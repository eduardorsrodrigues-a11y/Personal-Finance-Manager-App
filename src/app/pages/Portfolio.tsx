import { useState, useEffect, type ReactNode } from 'react';
import { Info, ChevronDown, X, Clock, Wallet, Landmark, TrendingUp, TrendingDown, Home } from 'lucide-react';
import { useCurrency } from '../context/CurrencyContext';

type RangeKey = '1M' | '6M' | 'YTD' | 'All';

interface CashItem    { id: string; name: string; meta: string; balance: number; prev: number; color: string; abbr: string; }
interface SavingsItem { id: string; name: string; meta: string; invested: number; current: number; color: string; abbr: string; }
interface InvestItem  { id: string; name: string; type: string; typeClass: string; invested: number; current: number; color: string; abbr: string; }
interface PhysItem    { id: string; name: string; meta: string; invested: number; current: number; color: string; abbr: string; }
interface LiabItem    { id: string; name: string; type: string; typeClass: string; total: number; remaining: number; prev: number; color: string; abbr: string; }
interface DistEntry   { id: string; name: string; value: number; color: string; isNeg: boolean; }
interface HistPoint   { m: string; v: number; }

// ── Mock data ──────────────────────────────────────────────────────────────────
const LAST_UPDATED = 'May 24, 2026';

const CASH: CashItem[] = [
  { id: 'cgd-current', name: 'CGD — Current Account', meta: 'Caixa Geral de Depósitos', balance: 3240.50, prev: 3580.20, color: '#005a8c', abbr: 'CGD' },
  { id: 'mil-current', name: 'Millennium — Current',  meta: 'Millennium BCP',           balance: 1820.00, prev: 1645.30, color: '#c8102e', abbr: 'MIL' },
  { id: 'revolut-eur', name: 'Revolut EUR',           meta: 'E-money',                  balance: 580.75,  prev: 910.00,  color: '#000000', abbr: 'REV' },
];

const SAVINGS: SavingsItem[] = [
  { id: 'cgd-poup',  name: 'Caixa Poupança Plus',        meta: 'Caixa Geral de Depósitos', invested: 15000, current: 15412.50, color: '#005a8c', abbr: 'CGD' },
  { id: 'ot-2029',   name: 'Obrigações do Tesouro 2029', meta: 'República Portuguesa',     invested: 5000,  current: 5210.00,  color: '#006600', abbr: 'OT'  },
  { id: 'mil-super', name: 'Super Poupança Millennium',  meta: 'Millennium BCP',           invested: 8000,  current: 8104.00,  color: '#c8102e', abbr: 'MIL' },
];

const INVESTMENTS: InvestItem[] = [
  { id: 'vwce',    name: 'Vanguard FTSE All-World', type: 'ETF',    typeClass: 'etf',    invested: 22000, current: 26840.75, color: '#6b0d14', abbr: 'VAN' },
  { id: 'eqqq',    name: 'Invesco NASDAQ-100',      type: 'ETF',    typeClass: 'etf',    invested: 8500,  current: 9912.30,  color: '#0056a2', abbr: 'INV' },
  { id: 'btc',     name: 'Bitcoin',                 type: 'Crypto', typeClass: 'crypto', invested: 3200,  current: 4815.60,  color: '#f7931a', abbr: 'BTC' },
  { id: 'eth',     name: 'Ethereum',                type: 'Crypto', typeClass: 'crypto', invested: 1500,  current: 1342.20,  color: '#627eea', abbr: 'ETH' },
  { id: 'xtb-ppr', name: 'XTB PPR Global Equity',  type: 'Fund',   typeClass: 'fund',   invested: 4800,  current: 5260.00,  color: '#1e3a8a', abbr: 'XTB' },
];

const PHYSICAL: PhysItem[] = [
  { id: 'apt', name: 'Apartment — Lisbon', meta: 'Primary residence', invested: 285000, current: 312000, color: '#15803d', abbr: 'APT' },
  { id: 'car', name: 'Honda Civic 2022',   meta: 'Personal vehicle',  invested: 24000,  current: 18500,  color: '#475569', abbr: 'CAR' },
];

const LIABILITIES: LiabItem[] = [
  { id: 'mort',     name: 'Mortgage — Lisbon Apt',   type: 'Mortgage', typeClass: 'mortgage', total: 228000, remaining: 214380.50, prev: 215120, color: '#92400e', abbr: 'MOR' },
  { id: 'car-loan', name: 'Honda Civic Loan',         type: 'Loan',     typeClass: 'loan',     total: 18000,  remaining: 9420.00,   prev: 9685,   color: '#b91c1c', abbr: 'CL'  },
  { id: 'cc-1',     name: 'Credit Card — Millennium', type: 'Card',     typeClass: 'card',     total: 5000,   remaining: 412.00,    prev: 0,      color: '#6b21a8', abbr: 'CC'  },
];

const NW_HISTORY: HistPoint[] = [
  { m: 'Jun 25', v: 118200 }, { m: 'Jul 25', v: 121400 }, { m: 'Aug 25', v: 120100 },
  { m: 'Sep 25', v: 124800 }, { m: 'Oct 25', v: 127500 }, { m: 'Nov 25', v: 129100 },
  { m: 'Dec 25', v: 131200 }, { m: 'Jan 26', v: 128900 }, { m: 'Feb 26', v: 133600 },
  { m: 'Mar 26', v: 136400 }, { m: 'Apr 26', v: 139800 }, { m: 'May 26', v: 142500 },
];

// ── Module-level totals ────────────────────────────────────────────────────────
const totalCash    = CASH.reduce((s, a) => s + a.balance, 0);
const totalSavInv  = SAVINGS.reduce((s, a) => s + a.invested, 0);
const totalSavCur  = SAVINGS.reduce((s, a) => s + a.current, 0);
const totalInvInv  = INVESTMENTS.reduce((s, a) => s + a.invested, 0);
const totalInvCur  = INVESTMENTS.reduce((s, a) => s + a.current, 0);
const totalPhysInv = PHYSICAL.reduce((s, a) => s + a.invested, 0);
const totalPhysCur = PHYSICAL.reduce((s, a) => s + a.current, 0);
const totalLiabs   = LIABILITIES.reduce((s, a) => s + a.remaining, 0);
const totalAssets  = totalCash + totalSavCur + totalInvCur + totalPhysCur;
const netWorth     = totalAssets - totalLiabs;
const prevNW       = NW_HISTORY[NW_HISTORY.length - 2].v;
const nwChange     = netWorth - prevNW;
const nwChangePct  = (nwChange / prevNW) * 100;

const DISTRIBUTION: DistEntry[] = [
  { id: 'cash',        name: 'Cash',           value: totalCash,    color: '#14b8a6', isNeg: false },
  { id: 'savings',     name: 'Savings',         value: totalSavCur,  color: '#06b6d4', isNeg: false },
  { id: 'investments', name: 'Investments',     value: totalInvCur,  color: '#7c3aed', isNeg: false },
  { id: 'physical',    name: 'Physical Assets', value: totalPhysCur, color: '#f59e0b', isNeg: false },
  { id: 'liabilities', name: 'Liabilities',     value: -totalLiabs,  color: '#ef4444', isNeg: true  },
];

// ── Helpers ────────────────────────────────────────────────────────────────────
const fmtPct = (n: number) => (n >= 0 ? '+' : '') + n.toFixed(2) + '%';

const TYPE_PILL: Record<string, string> = {
  etf:      'bg-blue-100 text-blue-700',
  crypto:   'bg-amber-100 text-amber-800',
  stock:    'bg-indigo-100 text-indigo-700',
  bond:     'bg-teal-100 text-teal-700',
  fund:     'bg-pink-100 text-pink-800',
  loan:     'bg-red-100 text-red-700',
  mortgage: 'bg-amber-100 text-amber-800',
  card:     'bg-purple-100 text-purple-800',
};

// ── Sub-components ─────────────────────────────────────────────────────────────
function AssetIcon({ color, abbr }: { color: string; abbr: string }) {
  return (
    <div
      className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-[10px] font-bold text-white"
      style={{ background: color, letterSpacing: '-0.2px' }}
    >
      {abbr}
    </div>
  );
}

function TypePill({ type, typeClass }: { type: string; typeClass: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${TYPE_PILL[typeClass] ?? 'bg-muted text-muted-foreground'}`}>
      {type}
    </span>
  );
}

// ── NetWorthChart ──────────────────────────────────────────────────────────────
function NetWorthChart({ data, range, fmt }: { data: HistPoint[]; range: RangeKey; fmt: (n: number) => string }) {
  const [tip, setTip] = useState<{ d: HistPoint; x: number; y: number } | null>(null);

  const sliced: HistPoint[] = range === '1M' ? data.slice(-2)
    : range === '6M' ? data.slice(-6)
    : range === 'YTD' ? data.slice(-5)
    : data;

  if (!sliced.length) return null;

  const W = 760, H = 220;
  const pad = { top: 16, right: 14, bottom: 28, left: 56 };
  const iW = W - pad.left - pad.right;
  const iH = H - pad.top - pad.bottom;
  const maxV = Math.max(...sliced.map(d => d.v)) * 1.05;
  const minRaw = Math.min(...sliced.map(d => d.v)) * 0.95;
  const minV = maxV === minRaw ? minRaw - 1 : minRaw;
  const xS = (i: number) => sliced.length === 1 ? pad.left + iW / 2 : pad.left + (i / (sliced.length - 1)) * iW;
  const yS = (v: number) => pad.top + iH - ((v - minV) / (maxV - minV)) * iH;
  const baseline = pad.top + iH;
  const pts = sliced.map((d, i) => [xS(i), yS(d.v)] as [number, number]);
  const linePath = pts.map((pt, i) => `${i === 0 ? 'M' : 'L'}${pt[0].toFixed(1)},${pt[1].toFixed(1)}`).join(' ');
  const areaPath = `${linePath} L${pts[pts.length - 1][0].toFixed(1)},${baseline} L${pts[0][0].toFixed(1)},${baseline} Z`;
  const fmtY = (v: number) => `€${(v / 1000).toFixed(0)}k`;
  const yTicks = [0, .25, .5, .75, 1].map(f => minV + (maxV - minV) * f);
  const xStep = Math.max(1, Math.ceil(sliced.length / 6));
  const segW = sliced.length > 1 ? iW / (sliced.length - 1) : iW;

  return (
    <div className="flex-1 min-h-[200px] mt-3.5 relative">
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: '100%', display: 'block' }}>
        <defs>
          <linearGradient id="nwG" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#14b8a6" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#14b8a6" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {yTicks.map((v, i) => (
          <line key={i} x1={pad.left} x2={pad.left + iW} y1={yS(v)} y2={yS(v)} stroke="rgba(37,99,235,0.08)" strokeWidth="1" />
        ))}
        <path d={areaPath} fill="url(#nwG)" />
        <path d={linePath} fill="none" stroke="#14b8a6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {yTicks.map((v, i) => (
          <text key={i} x={pad.left - 6} y={yS(v) + 4} textAnchor="end" fontSize="10" fill="#5b7a9c">{fmtY(v)}</text>
        ))}
        {sliced
          .filter((_, i) => i % xStep === 0 || i === sliced.length - 1)
          .map((d, i) => (
            <text key={i} x={xS(sliced.indexOf(d))} y={H - 8} textAnchor="middle" fontSize="10" fill="#5b7a9c">{d.m}</text>
          ))}
        {sliced.map((d, i) => (
          <rect
            key={i}
            x={xS(i) - segW / 2}
            y={pad.top}
            width={segW}
            height={iH}
            fill="transparent"
            style={{ cursor: 'crosshair' }}
            onMouseEnter={() => setTip({ d, x: xS(i), y: yS(d.v) })}
            onMouseLeave={() => setTip(null)}
          />
        ))}
        {tip && <circle cx={tip.x} cy={tip.y} r="4.5" fill="#14b8a6" stroke="white" strokeWidth="2.5" />}
      </svg>
      {tip && (
        <div
          className="absolute pointer-events-none bg-card border border-border rounded-lg px-3 py-2 text-[11px] shadow-lg whitespace-nowrap z-10"
          style={{ left: `${(tip.x / W) * 100}%`, top: `${(tip.y / H) * 100}%`, transform: 'translate(-50%, -115%)' }}
        >
          <div className="font-bold mb-0.5 text-foreground">{tip.d.m}</div>
          <div className="text-muted-foreground">Net worth <span className="text-teal-500 font-bold">{fmt(tip.d.v)}</span></div>
        </div>
      )}
    </div>
  );
}

// ── DonutChart ─────────────────────────────────────────────────────────────────
function DonutChart({ data, fmt }: { data: DistEntry[]; fmt: (n: number) => string }) {
  const positive = data.filter(d => !d.isNeg);
  const totalPos = positive.reduce((s, d) => s + d.value, 0);
  const R = 64, r = 42, cx = 80, cy = 80;
  let cumAngle = -Math.PI / 2;

  return (
    <div className="flex flex-col items-center pt-2">
      <div className="relative w-40 h-40">
        <svg viewBox="0 0 160 160" className="w-full h-full">
          {positive.map(seg => {
            const a = (seg.value / totalPos) * Math.PI * 2;
            const start = cumAngle;
            const end = cumAngle + a;
            cumAngle = end;
            const x1 = cx + R * Math.cos(start), y1 = cy + R * Math.sin(start);
            const x2 = cx + R * Math.cos(end),   y2 = cy + R * Math.sin(end);
            const x3 = cx + r * Math.cos(end),   y3 = cy + r * Math.sin(end);
            const x4 = cx + r * Math.cos(start), y4 = cy + r * Math.sin(start);
            const large = a > Math.PI ? 1 : 0;
            const d = `M${x1},${y1} A${R},${R} 0 ${large} 1 ${x2},${y2} L${x3},${y3} A${r},${r} 0 ${large} 0 ${x4},${y4} Z`;
            return <path key={seg.id} d={d} fill={seg.color} />;
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
          <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.06em]">Total Assets</div>
          <div className="text-lg font-bold text-foreground tracking-tight leading-tight">{fmt(totalPos)}</div>
        </div>
      </div>
      <div className="flex flex-col gap-1.5 mt-4 w-full">
        {data.map(seg => {
          const pct = seg.isNeg
            ? (Math.abs(seg.value) / totalAssets) * 100
            : (seg.value / totalPos) * 100;
          return (
            <div key={seg.id} className="flex items-center gap-2 text-xs">
              <div className="w-2 h-2 rounded-[2px] shrink-0" style={{ background: seg.color }} />
              <span className="flex-1 font-medium text-foreground">{seg.name}</span>
              <span className="text-[11px] font-medium text-muted-foreground min-w-[38px] text-right">
                {seg.isNeg ? '−' : ''}{pct.toFixed(0)}%
              </span>
              <span className={`font-semibold min-w-[80px] text-right tabular-nums ${seg.isNeg ? 'text-red-500' : 'text-foreground'}`}>
                {fmt(Math.abs(seg.value))}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── LedgerSection ──────────────────────────────────────────────────────────────
interface LedgerSectionProps {
  name: string;
  icon: ReactNode;
  iconBg: string;
  total: number;
  totalLabel: string;
  isLiability?: boolean;
  count: number;
  columns: { label: string; num?: boolean; width?: string }[];
  children: ReactNode;
  defaultOpen?: boolean;
  fmt: (n: number) => string;
}

function LedgerSection({ name, icon, iconBg, total, totalLabel, isLiability, count, columns, children, defaultOpen, fmt }: LedgerSectionProps) {
  const [open, setOpen] = useState(defaultOpen ?? false);
  return (
    <div className="border-b border-border last:border-b-0">
      <button
        className="w-full flex items-center gap-3 px-5 py-3.5 text-left hover:bg-background transition-colors"
        onClick={() => setOpen(o => !o)}
      >
        <div className="w-[30px] h-[30px] rounded-lg flex items-center justify-center shrink-0" style={{ background: iconBg }}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-foreground">{name}</div>
          <div className="text-[11px] text-muted-foreground">{count} item{count !== 1 ? 's' : ''} · {totalLabel}</div>
        </div>
        <div className={`text-base font-bold tracking-tight tabular-nums ${isLiability ? 'text-red-500' : 'text-foreground'}`}>
          {isLiability ? '−' : ''}{fmt(total)}
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform duration-200 shrink-0 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="bg-[#fafcfe] border-t border-border">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {columns.map((col, i) => (
                  <th
                    key={i}
                    className={`text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.06em] py-2.5 px-4 border-b border-border text-left ${col.num ? 'text-right' : ''}`}
                    style={col.width ? { width: col.width } : undefined}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">{children}</tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Slide-over sub-components ──────────────────────────────────────────────────
function SoSection({ icon, iconBg, title, count, children }: {
  icon: ReactNode; iconBg: string; title: string; count: number; children: ReactNode;
}) {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="flex items-center gap-2.5 px-4 py-3 bg-[#fafcfe] border-b border-border">
        <div className="w-6 h-6 rounded-md flex items-center justify-center shrink-0" style={{ background: iconBg }}>{icon}</div>
        <div className="flex-1 text-xs font-semibold text-foreground">{title}</div>
        <div className="text-[10px] text-muted-foreground">{count} item{count !== 1 ? 's' : ''}</div>
      </div>
      {children}
    </div>
  );
}

function SoRow({ name, meta, valueKey, prevValue, values, update, fmt }: {
  name: string; meta?: string; valueKey: string; prevValue: number;
  values: Record<string, string>; update: (k: string, v: string) => void; fmt: (n: number) => string;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-border last:border-b-0">
      <div className="flex-1 min-w-0">
        <div className="text-xs font-semibold text-foreground leading-snug">{name}</div>
        {meta && <div className="text-[10px] text-muted-foreground mt-0.5">{meta}</div>}
      </div>
      <div className="flex flex-col items-end gap-0.5 shrink-0">
        <input
          className="w-32 px-2.5 py-1.5 border-[1.5px] border-border rounded-lg text-sm font-semibold text-foreground bg-card text-right outline-none tabular-nums transition-colors focus:border-teal-500 focus:bg-white"
          type="text"
          inputMode="decimal"
          value={values[valueKey] ?? ''}
          onChange={e => update(valueKey, e.target.value)}
        />
        <div className="text-[10px] text-muted-foreground pr-0.5">Prev: {fmt(prevValue)}</div>
      </div>
    </div>
  );
}

// ── UpdatePortfolioSlideover ───────────────────────────────────────────────────
function UpdatePortfolioSlideover({ open, onClose, fmt }: {
  open: boolean; onClose: () => void; fmt: (n: number) => string;
}) {
  const [values, setValues] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    const init: Record<string, string> = {};
    CASH.forEach(a => { init[`cash-${a.id}`] = a.balance.toFixed(2); });
    SAVINGS.forEach(a => { init[`sav-${a.id}`] = a.current.toFixed(2); });
    INVESTMENTS.forEach(a => { init[`inv-${a.id}`] = a.current.toFixed(2); });
    PHYSICAL.forEach(a => { init[`phys-${a.id}`] = a.current.toFixed(2); });
    LIABILITIES.forEach(a => { init[`liab-${a.id}`] = a.remaining.toFixed(2); });
    setValues(init);
  }, [open]);

  const update = (k: string, v: string) => setValues(prev => ({ ...prev, [k]: v }));
  const monthLabel = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/40 z-50 transition-opacity duration-200 ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />
      <div className={`fixed top-0 right-0 bottom-0 w-[480px] max-w-full bg-background z-[60] flex flex-col shadow-2xl transition-transform duration-[250ms] ease-out ${open ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between px-6 py-[18px] bg-card border-b border-border shrink-0">
          <div>
            <div className="text-[15px] font-semibold text-foreground">Update Portfolio</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">{monthLabel} snapshot · review and adjust each value</div>
          </div>
          <button
            className="w-[30px] h-[30px] rounded-lg bg-muted flex items-center justify-center text-muted-foreground hover:bg-muted/80 transition-colors"
            onClick={onClose}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-[18px] space-y-3.5">
          <SoSection icon={<Wallet className="w-3.5 h-3.5 text-white" />} iconBg="#14b8a6" title="Cash" count={CASH.length}>
            {CASH.map(a => (
              <SoRow key={a.id} name={a.name} meta={a.meta} valueKey={`cash-${a.id}`} prevValue={a.prev} values={values} update={update} fmt={fmt} />
            ))}
          </SoSection>
          <SoSection icon={<Landmark className="w-3.5 h-3.5 text-white" />} iconBg="#06b6d4" title="Savings" count={SAVINGS.length}>
            {SAVINGS.map(a => (
              <SoRow key={a.id} name={a.name} meta={`Invested: ${fmt(a.invested)}`} valueKey={`sav-${a.id}`} prevValue={a.current} values={values} update={update} fmt={fmt} />
            ))}
          </SoSection>
          <SoSection icon={<TrendingUp className="w-3.5 h-3.5 text-white" />} iconBg="#7c3aed" title="Investments" count={INVESTMENTS.length}>
            {INVESTMENTS.map(a => (
              <SoRow key={a.id} name={a.name} meta={`${a.type} · Invested: ${fmt(a.invested)}`} valueKey={`inv-${a.id}`} prevValue={a.current} values={values} update={update} fmt={fmt} />
            ))}
          </SoSection>
          <SoSection icon={<Home className="w-3.5 h-3.5 text-white" />} iconBg="#f59e0b" title="Physical Assets" count={PHYSICAL.length}>
            {PHYSICAL.map(a => (
              <SoRow key={a.id} name={a.name} meta={a.meta} valueKey={`phys-${a.id}`} prevValue={a.current} values={values} update={update} fmt={fmt} />
            ))}
          </SoSection>
          <SoSection icon={<TrendingDown className="w-3.5 h-3.5 text-white" />} iconBg="#ef4444" title="Liabilities" count={LIABILITIES.length}>
            {LIABILITIES.map(a => (
              <SoRow key={a.id} name={a.name} meta={`${a.type} · Original: ${fmt(a.total)}`} valueKey={`liab-${a.id}`} prevValue={a.prev || a.remaining} values={values} update={update} fmt={fmt} />
            ))}
          </SoSection>
        </div>
        <div className="flex gap-2.5 px-6 py-3.5 bg-card border-t border-border shrink-0">
          <button className="flex-1 py-2.5 rounded-xl bg-muted text-foreground text-sm font-semibold hover:bg-muted/80 transition-colors" onClick={onClose}>
            Cancel
          </button>
          <button className="flex-[2] py-2.5 rounded-xl bg-teal-500 hover:bg-teal-600 text-white text-sm font-semibold transition-colors" onClick={onClose}>
            Save {monthLabel} Snapshot
          </button>
        </div>
      </div>
    </>
  );
}

// ── Main export ────────────────────────────────────────────────────────────────
export function Portfolio() {
  const { formatAmount } = useCurrency();
  const fmt = formatAmount;
  const [range, setRange] = useState<RangeKey>('All');
  const [soOpen, setSoOpen] = useState(false);

  return (
    <div className="px-4 lg:px-8 py-6 lg:py-8 max-w-[1240px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Portfolio Manager</h1>
        <button
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-500 hover:bg-teal-600 text-white text-sm font-semibold transition-colors"
          onClick={() => setSoOpen(true)}
        >
          <Clock className="w-3.5 h-3.5" />
          Update Portfolio
        </button>
      </div>

      {/* Info banner */}
      <div className="flex items-center gap-2.5 bg-blue-50 border border-blue-200 rounded-xl px-3.5 py-2.5 text-xs text-blue-800 mb-6">
        <Info className="w-3.5 h-3.5 shrink-0" />
        <span>Manually track your assets and liabilities to monitor your total net worth over time.</span>
      </div>

      {/* Overview grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-3.5 mb-3.5">
        {/* Net worth card */}
        <div className="bg-card border border-border rounded-xl p-5 flex flex-col">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-[0.06em]">Total Net Worth</p>
              <p className="text-[42px] font-bold tracking-[-1.5px] text-foreground mt-1 leading-none">{fmt(netWorth)}</p>
              <div className="flex items-center gap-2.5 mt-2 text-xs">
                <span className={`font-semibold flex items-center gap-1 ${nwChange >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                  {nwChange >= 0 ? '↑' : '↓'} {fmt(Math.abs(nwChange))}
                  <span className="font-medium opacity-80 ml-0.5">({fmtPct(nwChangePct)})</span>
                </span>
                <span className="text-muted-foreground">vs last month</span>
              </div>
            </div>
            <div className="flex gap-px bg-muted rounded-lg p-0.5 shrink-0">
              {(['1M', '6M', 'YTD', 'All'] as RangeKey[]).map(r => (
                <button
                  key={r}
                  className={`px-2.5 py-1.5 text-[11px] font-medium rounded-md transition-all ${range === r ? 'bg-card text-foreground font-semibold shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                  onClick={() => setRange(r)}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
          <NetWorthChart data={NW_HISTORY} range={range} fmt={fmt} />
        </div>

        {/* Wealth distribution card */}
        <div className="bg-card border border-border rounded-xl p-5 flex flex-col">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-[0.06em] mb-1">Wealth Distribution</p>
          <DonutChart data={DISTRIBUTION} fmt={fmt} />
        </div>
      </div>

      {/* Portfolio ledger */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <p className="text-sm font-semibold text-foreground">Current Portfolio</p>
          <p className="text-xs text-muted-foreground">Last updated: {LAST_UPDATED}</p>
        </div>

        <LedgerSection
          name="Cash" icon={<Wallet className="w-4 h-4 text-white" />} iconBg="#14b8a6"
          total={totalCash} totalLabel="Total balance" count={CASH.length} defaultOpen fmt={fmt}
          columns={[{ label: 'Account Name' }, { label: 'Current Balance', num: true, width: '200px' }]}
        >
          {CASH.map(a => (
            <tr key={a.id} className="hover:bg-teal-500/[0.04] transition-colors">
              <td className="px-4 py-3 font-medium text-[13px]">
                <div className="flex items-center gap-2.5">
                  <AssetIcon color={a.color} abbr={a.abbr} />
                  <div>
                    <div>{a.name}</div>
                    <div className="text-[11px] text-muted-foreground font-normal mt-0.5">{a.meta}</div>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3 text-right tabular-nums text-[13px]">{fmt(a.balance)}</td>
            </tr>
          ))}
        </LedgerSection>

        <LedgerSection
          name="Savings" icon={<Landmark className="w-4 h-4 text-white" />} iconBg="#06b6d4"
          total={totalSavCur} totalLabel={`Profit ${fmt(totalSavCur - totalSavInv)}`} count={SAVINGS.length} defaultOpen fmt={fmt}
          columns={[
            { label: 'Name' }, { label: 'Invested', num: true }, { label: 'Actual', num: true },
            { label: 'Profit', num: true }, { label: 'Profit %', num: true },
          ]}
        >
          {SAVINGS.map(a => {
            const profit = a.current - a.invested;
            const pct = (profit / a.invested) * 100;
            return (
              <tr key={a.id} className="hover:bg-teal-500/[0.04] transition-colors">
                <td className="px-4 py-3 font-medium text-[13px]">
                  <div className="flex items-center gap-2.5">
                    <AssetIcon color={a.color} abbr={a.abbr} />
                    <div>
                      <div>{a.name}</div>
                      <div className="text-[11px] text-muted-foreground font-normal mt-0.5">{a.meta}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-[13px]">{fmt(a.invested)}</td>
                <td className="px-4 py-3 text-right tabular-nums text-[13px]">{fmt(a.current)}</td>
                <td className={`px-4 py-3 text-right tabular-nums text-[13px] font-semibold ${profit >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                  {profit >= 0 ? '+' : ''}{fmt(profit)}
                </td>
                <td className={`px-4 py-3 text-right tabular-nums text-[13px] font-semibold ${profit >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                  {fmtPct(pct)}
                </td>
              </tr>
            );
          })}
        </LedgerSection>

        <LedgerSection
          name="Investments" icon={<TrendingUp className="w-4 h-4 text-white" />} iconBg="#7c3aed"
          total={totalInvCur} totalLabel={`Profit ${fmt(totalInvCur - totalInvInv)}`} count={INVESTMENTS.length} defaultOpen fmt={fmt}
          columns={[
            { label: 'Name' }, { label: 'Type' }, { label: 'Invested', num: true },
            { label: 'Actual', num: true }, { label: 'Profit %', num: true }, { label: 'Profit', num: true },
          ]}
        >
          {INVESTMENTS.map(a => {
            const profit = a.current - a.invested;
            const pct = (profit / a.invested) * 100;
            return (
              <tr key={a.id} className="hover:bg-teal-500/[0.04] transition-colors">
                <td className="px-4 py-3 font-medium text-[13px]">
                  <div className="flex items-center gap-2.5">
                    <AssetIcon color={a.color} abbr={a.abbr} />
                    <div>{a.name}</div>
                  </div>
                </td>
                <td className="px-4 py-3"><TypePill type={a.type} typeClass={a.typeClass} /></td>
                <td className="px-4 py-3 text-right tabular-nums text-[13px]">{fmt(a.invested)}</td>
                <td className="px-4 py-3 text-right tabular-nums text-[13px]">{fmt(a.current)}</td>
                <td className={`px-4 py-3 text-right tabular-nums text-[13px] font-semibold ${profit >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                  {fmtPct(pct)}
                </td>
                <td className={`px-4 py-3 text-right tabular-nums text-[13px] font-semibold ${profit >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                  {profit >= 0 ? '+' : ''}{fmt(profit)}
                </td>
              </tr>
            );
          })}
        </LedgerSection>

        <LedgerSection
          name="Physical Assets" icon={<Home className="w-4 h-4 text-white" />} iconBg="#f59e0b"
          total={totalPhysCur} totalLabel={`Profit ${fmt(totalPhysCur - totalPhysInv)}`} count={PHYSICAL.length} fmt={fmt}
          columns={[
            { label: 'Name' }, { label: 'Invested', num: true }, { label: 'Actual', num: true },
            { label: 'Profit %', num: true }, { label: 'Profit', num: true },
          ]}
        >
          {PHYSICAL.map(a => {
            const profit = a.current - a.invested;
            const pct = (profit / a.invested) * 100;
            return (
              <tr key={a.id} className="hover:bg-teal-500/[0.04] transition-colors">
                <td className="px-4 py-3 font-medium text-[13px]">
                  <div className="flex items-center gap-2.5">
                    <AssetIcon color={a.color} abbr={a.abbr} />
                    <div>
                      <div>{a.name}</div>
                      <div className="text-[11px] text-muted-foreground font-normal mt-0.5">{a.meta}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-[13px]">{fmt(a.invested)}</td>
                <td className="px-4 py-3 text-right tabular-nums text-[13px]">{fmt(a.current)}</td>
                <td className={`px-4 py-3 text-right tabular-nums text-[13px] font-semibold ${profit >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                  {fmtPct(pct)}
                </td>
                <td className={`px-4 py-3 text-right tabular-nums text-[13px] font-semibold ${profit >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                  {profit >= 0 ? '+' : ''}{fmt(profit)}
                </td>
              </tr>
            );
          })}
        </LedgerSection>

        <LedgerSection
          name="Liabilities" icon={<TrendingDown className="w-4 h-4 text-white" />} iconBg="#ef4444" isLiability
          total={totalLiabs} totalLabel="Total outstanding" count={LIABILITIES.length} fmt={fmt}
          columns={[{ label: 'Name' }, { label: 'Type' }, { label: 'Original', num: true }, { label: 'Remaining', num: true }]}
        >
          {LIABILITIES.map(a => (
            <tr key={a.id} className="hover:bg-teal-500/[0.04] transition-colors">
              <td className="px-4 py-3 font-medium text-[13px]">
                <div className="flex items-center gap-2.5">
                  <AssetIcon color={a.color} abbr={a.abbr} />
                  <div>{a.name}</div>
                </div>
              </td>
              <td className="px-4 py-3"><TypePill type={a.type} typeClass={a.typeClass} /></td>
              <td className="px-4 py-3 text-right tabular-nums text-[13px]">{fmt(a.total)}</td>
              <td className="px-4 py-3 text-right tabular-nums text-[13px] font-semibold text-red-500">−{fmt(a.remaining)}</td>
            </tr>
          ))}
        </LedgerSection>
      </div>

      <UpdatePortfolioSlideover open={soOpen} onClose={() => setSoOpen(false)} fmt={fmt} />
    </div>
  );
}
