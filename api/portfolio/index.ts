import { getAuthenticatedUserId } from '../_lib/session.js';
import { listPortfolioItems, createPortfolioItem, updatePortfolioItemValue, deletePortfolioItem } from '../_lib/db.js';
import { readJsonBody, withErrorHandler, type ApiRequest, type ApiResponse } from '../_lib/request.js';
import { ValidationError, requireString } from '../_lib/validate.js';

const VALID_SECTIONS = ['cash', 'savings', 'investment', 'physical', 'liability'] as const;
type Section = (typeof VALID_SECTIONS)[number];

function requireSection(v: unknown): Section {
  if (typeof v !== 'string' || !VALID_SECTIONS.includes(v as Section)) {
    throw new ValidationError(`section must be one of: ${VALID_SECTIONS.join(', ')}`);
  }
  return v as Section;
}

function requirePortfolioAmount(val: unknown, field: string): number {
  const n = typeof val === 'number' ? val : parseFloat(val as string);
  if (!Number.isFinite(n) || n < 0) {
    throw new ValidationError(`${field} must be a non-negative number.`);
  }
  return n;
}

export default withErrorHandler(async function handler(req: ApiRequest, res: ApiResponse) {
  const userId = await getAuthenticatedUserId(req);
  if (!userId) { res.status(401).json({ error: 'Unauthorized' }); return; }

  if (req.method === 'GET') {
    const items = await listPortfolioItems(userId);
    res.status(200).json({ items });
    return;
  }

  if (req.method === 'POST') {
    const body = (await readJsonBody(req)) as Record<string, unknown>;
    try {
      const section = requireSection(body.section);
      const name = requireString(body.name, 'name');
      const abbr = requireString(body.abbr, 'abbr', 6);
      const color = requireString(body.color, 'color', 20);
      const currentValue = requirePortfolioAmount(body.current_value, 'current_value');
      const meta = typeof body.meta === 'string' && body.meta.trim() ? body.meta.trim() : null;
      const typeLabel = typeof body.type_label === 'string' && body.type_label.trim() ? body.type_label.trim() : null;
      const typeClass = typeof body.type_class === 'string' && body.type_class.trim() ? body.type_class.trim() : null;
      const investedValue = body.invested_value != null ? requirePortfolioAmount(body.invested_value, 'invested_value') : null;
      const sortOrder = typeof body.sort_order === 'number' ? body.sort_order : 0;
      const result = await createPortfolioItem({
        userId, section, name, meta, abbr, color, typeLabel, typeClass,
        currentValue, investedValue, sortOrder,
      });
      res.status(201).json({ id: result.id });
    } catch (err) {
      if (err instanceof ValidationError) { res.status(400).json({ error: err.message }); return; }
      throw err;
    }
    return;
  }

  if (req.method === 'PUT') {
    const id = req.query?.id as string | undefined;
    if (!id) { res.status(400).json({ error: 'Missing id' }); return; }
    const body = (await readJsonBody(req)) as Record<string, unknown>;
    try {
      const currentValue = requirePortfolioAmount(body.current_value, 'current_value');
      await updatePortfolioItemValue({ userId, id, currentValue });
      res.status(200).json({ id });
    } catch (err) {
      if (err instanceof ValidationError) { res.status(400).json({ error: err.message }); return; }
      throw err;
    }
    return;
  }

  if (req.method === 'DELETE') {
    const id =
      (req.query?.id as string | undefined) ??
      (((await readJsonBody(req)) as Record<string, unknown>)?.id as string | undefined);
    if (!id) { res.status(400).json({ error: 'Missing id' }); return; }
    await deletePortfolioItem({ userId, id });
    res.status(204).end();
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
});
