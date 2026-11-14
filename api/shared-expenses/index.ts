import { getAuthenticatedUserId } from '../_lib/session.js';
import { readJsonBody, withErrorHandler, type ApiRequest, type ApiResponse } from '../_lib/request.js';
import { ValidationError, requireString, requireAmount, requireDate, requireCategory } from '../_lib/validate.js';
import { splitsMatchTotal } from '../_lib/sharedExpenseMath.js';
import {
  SharedExpenseError,
  linkPendingMemberships,
  listGroups,
  getGroupDetail,
  createGroup,
  renameGroup,
  deleteGroup,
  addMember,
  removeMember,
  createExpense,
  updateExpense,
  deleteExpense,
  type ExpenseInput,
} from '../_lib/sharedExpenses.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_MEMBERS = 50;
const MAX_INITIAL_MEMBERS = 20;

function requireId(val: unknown, field: string): string {
  if (typeof val !== 'string' || !/^[0-9a-f-]{36}$/i.test(val)) {
    throw new ValidationError(`${field} is invalid.`);
  }
  return val;
}

function optionalEmail(val: unknown): string | null {
  if (val == null || (typeof val === 'string' && val.trim() === '')) return null;
  if (typeof val !== 'string' || !EMAIL_RE.test(val.trim()) || val.trim().length > 254) {
    throw new ValidationError('email is not valid.');
  }
  return val.trim().toLowerCase();
}

function requireMemberInput(val: unknown): { name: string; email: string | null } {
  const m = (val ?? {}) as Record<string, unknown>;
  return { name: requireString(m.name, 'member name', 60), email: optionalEmail(m.email) };
}

function requireExpenseInput(body: Record<string, unknown>): ExpenseInput {
  const kind = body.kind === 'settlement' ? 'settlement' : 'expense';
  const amount = requireAmount(body.amount);
  const date = requireDate(body.date);
  const paidBy = requireId(body.paidBy, 'paidBy');

  if (!Array.isArray(body.splits) || body.splits.length === 0 || body.splits.length > MAX_MEMBERS) {
    throw new ValidationError('splits must be a non-empty list.');
  }
  const seen = new Set<string>();
  const splits = body.splits.map((raw) => {
    const s = (raw ?? {}) as Record<string, unknown>;
    const memberId = requireId(s.memberId, 'split memberId');
    if (seen.has(memberId)) throw new ValidationError('Each member can only appear once in splits.');
    seen.add(memberId);
    const n = typeof s.amount === 'number' ? s.amount : parseFloat(s.amount as string);
    if (!Number.isFinite(n) || n < 0) throw new ValidationError('split amounts must be non-negative numbers.');
    return { memberId, amount: Math.round(n * 100) / 100 };
  });
  if (!splitsMatchTotal(amount, splits.map((s) => s.amount))) {
    throw new ValidationError('The split amounts must add up to the total.');
  }

  if (kind === 'settlement') {
    if (splits.length !== 1) throw new ValidationError('A settlement must have exactly one recipient.');
    if (splits[0].memberId === paidBy) throw new ValidationError('A member cannot pay themselves.');
    return { kind, amount, date, paidBy, splits, category: 'Other', description: 'Settlement' };
  }

  const description = requireString(body.description, 'description', 200);
  const category = requireCategory(body.category);
  return { kind, amount, date, paidBy, splits, category, description };
}

export default withErrorHandler(async function handler(req: ApiRequest, res: ApiResponse) {
  const userId = await getAuthenticatedUserId(req);
  if (!userId) { res.status(401).json({ error: 'Unauthorized' }); return; }

  try {
    if (req.method === 'GET') {
      const groupId = req.query?.groupId as string | undefined;
      if (groupId) {
        const group = await getGroupDetail(userId, requireId(groupId, 'groupId'));
        res.status(200).json({ group });
        return;
      }
      await linkPendingMemberships(userId);
      const groups = await listGroups(userId);
      res.status(200).json({ groups });
      return;
    }

    if (req.method === 'POST') {
      const body = (await readJsonBody(req)) as Record<string, unknown>;
      switch (body.action) {
        case 'createGroup': {
          const name = requireString(body.name, 'name', 80);
          const rawMembers = Array.isArray(body.members) ? body.members : [];
          if (rawMembers.length > MAX_INITIAL_MEMBERS) throw new ValidationError('Too many members.');
          const members = rawMembers.map(requireMemberInput);
          const groupId = await createGroup({ userId, name, members });
          res.status(201).json({ groupId });
          return;
        }
        case 'renameGroup': {
          const groupId = requireId(body.groupId, 'groupId');
          await renameGroup({ userId, groupId, name: requireString(body.name, 'name', 80) });
          res.status(200).json({ ok: true });
          return;
        }
        case 'deleteGroup': {
          await deleteGroup({ userId, groupId: requireId(body.groupId, 'groupId') });
          res.status(200).json({ ok: true });
          return;
        }
        case 'addMember': {
          const groupId = requireId(body.groupId, 'groupId');
          const { name, email } = requireMemberInput(body);
          const memberId = await addMember({ userId, groupId, name, email });
          res.status(201).json({ memberId });
          return;
        }
        case 'removeMember': {
          await removeMember({
            userId,
            groupId: requireId(body.groupId, 'groupId'),
            memberId: requireId(body.memberId, 'memberId'),
          });
          res.status(200).json({ ok: true });
          return;
        }
        case 'createExpense': {
          const groupId = requireId(body.groupId, 'groupId');
          const expenseId = await createExpense({ userId, groupId, input: requireExpenseInput(body) });
          res.status(201).json({ expenseId });
          return;
        }
        case 'updateExpense': {
          const expenseId = requireId(body.expenseId, 'expenseId');
          await updateExpense({ userId, expenseId, input: requireExpenseInput(body) });
          res.status(200).json({ ok: true });
          return;
        }
        case 'deleteExpense': {
          await deleteExpense({ userId, expenseId: requireId(body.expenseId, 'expenseId') });
          res.status(200).json({ ok: true });
          return;
        }
        default:
          res.status(400).json({ error: 'Unknown action' });
          return;
      }
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    if (err instanceof ValidationError) { res.status(400).json({ error: err.message }); return; }
    if (err instanceof SharedExpenseError) { res.status(err.status).json({ error: err.message }); return; }
    throw err;
  }
});
