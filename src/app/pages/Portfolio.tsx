import { useState, useEffect, useRef, type ReactNode } from 'react';
import { ChevronDown, X, Clock, Wallet, Landmark, TrendingUp, TrendingDown, Home, Plus, Trash2, Calendar } from 'lucide-react';
import { useCurrency } from '../context/CurrencyContext';
import { usePortfolio, type PortfolioItem, type PortfolioSection, type PortfolioSnapshot } from '../context/PortfolioContext';

type RangeKey = '1M' | '6M' | 'YTD' | 'All';

interface HistPoint { m: string; v: number; date: string; }
interface DistEntry  { id: string; name: string; value: number; color: string; isNeg: boolean; }

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

const INVESTMENT_TYPES = [
  { label: 'ETF',    class: 'etf'    },
  { label: 'Crypto', class: 'crypto' },
  { label: 'Stock',  class: 'stock'  },
  { label: 'Bond',   class: 'bond'   },
  { label: 'Fund',   class: 'fund'   },
];

const LIABILITY_TYPES = [
  { label: 'Loan',     class: 'loan'     },
  { label: 'Mortgage', class: 'mortgage' },
  { label: 'Card',     class: 'card'     },
];

const COLOR_PALETTE = [
  '#14b8a6', '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6',
  '#ec4899', '#f43f5e', '#ef4444', '#f97316', '#f59e0b',
  '#10b981', '#22c55e', '#0d2d52', '#475569', '#000000',
];

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

  const now = new Date();
  const cutoff = (days: number) => new Date(now.getTime() - days * 86_400_000).toISOString().slice(0, 10);
  const ytdStart = `${now.getFullYear()}-01-01`;
  const sliced: HistPoint[] =
    range === '1M'  ? data.filter(d => d.date >= cutoff(30))
    : range === '6M'  ? data.filter(d => d.date >= cutoff(180))
    : range === 'YTD' ? data.filter(d => d.date >= ytdStart)
    : data;

  if (!sliced.length) return (
    <div className="flex-1 min-h-[200px] mt-3.5 flex items-center justify-center">
      <p className="text-xs text-muted-foreground">No snapshot history yet — save your first snapshot to start tracking</p>
    </div>
  );

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
function DonutChart({ data, fmt, hiddenIds, onToggle }: {
  data: DistEntry[];
  fmt: (n: number) => string;
  hiddenIds: Set<string>;
  onToggle: (id: string) => void;
}) {
  const visibleItems = data.filter(d => !hiddenIds.has(d.id));
  // Use absolute values to size each slice (liabilities get their own slice)
  const totalForSlices = visibleItems.reduce((s, d) => s + Math.abs(d.value), 0);
  // Center shows net: assets − liabilities (liabilities stored as negative)
  const centerValue = visibleItems.reduce((s, d) => s + d.value, 0);
  const R = 64, r = 42, cx = 80, cy = 80;
  let cumAngle = -Math.PI / 2;

  const allHidden = data.length > 0 && visibleItems.length === 0;

  return (
    <div className="flex flex-col items-center pt-2">
      <div className="relative w-40 h-40">
        {allHidden || totalForSlices === 0 ? (
          <div className="w-full h-full rounded-full border-4 border-muted flex items-center justify-center">
            <p className="text-[10px] text-muted-foreground text-center px-3">
              {allHidden ? 'All hidden' : 'No assets yet'}
            </p>
          </div>
        ) : (
          <>
            <svg viewBox="0 0 160 160" className="w-full h-full">
              {visibleItems.map(seg => {
                const a = (Math.abs(seg.value) / totalForSlices) * Math.PI * 2;
                const start = cumAngle;
                const end = cumAngle + a;
                cumAngle = end;
                const x1 = cx + R * Math.cos(start), y1 = cy + R * Math.sin(start);
                const x2 = cx + R * Math.cos(end),   y2 = cy + R * Math.sin(end);
                const x3 = cx + r * Math.cos(end),   y3 = cy + r * Math.sin(end);
                const x4 = cx + r * Math.cos(start), y4 = cy + r * Math.sin(start);
                const large = a > Math.PI ? 1 : 0;
                const path = `M${x1},${y1} A${R},${R} 0 ${large} 1 ${x2},${y2} L${x3},${y3} A${r},${r} 0 ${large} 0 ${x4},${y4} Z`;
                return <path key={seg.id} d={path} fill={seg.color} />;
              })}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
              <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.06em]">Total</div>
              <div className="text-lg font-bold text-foreground tracking-tight leading-tight">{fmt(centerValue)}</div>
            </div>
          </>
        )}
      </div>
      <div className="flex flex-col gap-0.5 mt-4 w-full">
        {data.map(seg => {
          const hidden = hiddenIds.has(seg.id);
          const pct = !hidden && totalForSlices > 0
            ? (Math.abs(seg.value) / totalForSlices) * 100
            : null;
          return (
            <button
              key={seg.id}
              onClick={() => onToggle(seg.id)}
              className={`flex items-center gap-2 text-xs w-full text-left px-1.5 py-1 rounded-lg transition-all hover:bg-muted/50 ${hidden ? 'opacity-40' : ''}`}
            >
              <div
                className="w-2 h-2 rounded-[2px] shrink-0 transition-colors"
                style={{ background: hidden ? '#94a3b8' : seg.color }}
              />
              <span className={`flex-1 font-medium text-foreground ${hidden ? 'line-through' : ''}`}>
                {seg.name}
              </span>
              <span className="text-[11px] font-medium text-muted-foreground min-w-[38px] text-right">
                {hidden ? '—' : `${seg.isNeg ? '−' : ''}${pct!.toFixed(0)}%`}
              </span>
              <span className={`font-semibold min-w-[80px] text-right tabular-nums ${hidden ? 'text-muted-foreground' : seg.isNeg ? 'text-red-500' : 'text-foreground'}`}>
                {hidden ? '—' : fmt(Math.abs(seg.value))}
              </span>
            </button>
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
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <button
        className={`w-full flex items-center gap-3 px-5 py-4 text-left transition-colors ${open ? 'bg-muted/50' : 'hover:bg-muted/20'}`}
        onClick={() => setOpen(o => !o)}
      >
        <div className="w-[32px] h-[32px] rounded-xl flex items-center justify-center shrink-0" style={{ background: iconBg }}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-foreground">{name}</div>
          <div className="text-[11px] text-muted-foreground">{count} item{count !== 1 ? 's' : ''} · {totalLabel}</div>
        </div>
        <div className={`text-base font-bold tracking-tight tabular-nums ${isLiability && total > 0 ? 'text-red-500' : 'text-foreground'}`}>
          {isLiability && total > 0 ? '−' : ''}{fmt(total)}
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform duration-200 shrink-0 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="px-3 pb-3 pt-0 bg-muted/50 border-t border-border">
          <div className="bg-card border border-border rounded-lg overflow-hidden mt-3">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-muted/40">
                  {columns.map((col, i) => (
                    <th
                      key={i}
                      className={`text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.08em] py-2 px-4 border-b border-border text-left ${col.num ? 'text-right' : ''}`}
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

function SoRow({ name, meta, valueKey, prevValue, values, update, fmt, prevLabel = 'Prev' }: {
  name: string; meta?: string; valueKey: string; prevValue: number;
  values: Record<string, string>; update: (k: string, v: string) => void; fmt: (n: number) => string;
  prevLabel?: string;
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
        <div className="text-[10px] text-muted-foreground pr-0.5">{prevLabel}: {fmt(prevValue)}</div>
      </div>
    </div>
  );
}

// ── UpdatePortfolioSlideover ───────────────────────────────────────────────────
function UpdatePortfolioSlideover({ open, onClose, items, onSave, fmt }: {
  open: boolean;
  onClose: () => void;
  items: PortfolioItem[];
  onSave: (params: { itemValues: Record<string, number>; netWorth: number; snapshotMonth: string }) => Promise<void>;
  fmt: (n: number) => string;
}) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [asOfDate, setAsOfDate] = useState(new Date().toISOString().slice(0, 10));

  useEffect(() => {
    if (!open) return;
    setAsOfDate(new Date().toISOString().slice(0, 10));
    const init: Record<string, string> = {};
    items.forEach(item => { init[item.id] = item.current_value.toFixed(2); });
    setValues(init);
  }, [open, items]);

  const update = (k: string, v: string) => setValues(prev => ({ ...prev, [k]: v }));

  const snapshotMonth = asOfDate; // full YYYY-MM-DD — daily granularity
  const monthLabel = new Date(asOfDate + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  const handleSave = async () => {
    setSaving(true);
    try {
      const itemValues: Record<string, number> = {};
      items.forEach(item => {
        const raw = values[item.id];
        const n = parseFloat(raw ?? '');
        itemValues[item.id] = Number.isFinite(n) && n >= 0 ? n : item.current_value;
      });

      const sum = (section: PortfolioSection) =>
        items.filter(i => i.section === section).reduce((s, i) => s + (itemValues[i.id] ?? 0), 0);

      const netWorth = sum('cash') + sum('savings') + sum('investment') + sum('physical') - sum('liability');
      await onSave({ itemValues, netWorth, snapshotMonth });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const cash        = items.filter(i => i.section === 'cash');
  const savings     = items.filter(i => i.section === 'savings');
  const investments = items.filter(i => i.section === 'investment');
  const physical    = items.filter(i => i.section === 'physical');
  const liabilities = items.filter(i => i.section === 'liability');

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
            <div className="text-[11px] text-muted-foreground mt-0.5">Review and adjust each value, then save a snapshot</div>
          </div>
          <button
            className="w-[30px] h-[30px] rounded-lg bg-muted flex items-center justify-center text-muted-foreground hover:bg-muted/80 transition-colors"
            onClick={onClose}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        {/* As of Date */}
        <div className="flex items-center justify-between gap-4 px-6 py-3 bg-muted/30 border-b border-border shrink-0">
          <div>
            <p className="text-xs font-semibold text-foreground">As of Date</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Snapshot saved for {monthLabel}</p>
          </div>
          <input
            type="date"
            className="px-3 py-1.5 border border-border rounded-lg text-sm bg-card text-foreground outline-none focus:border-teal-500 transition-colors cursor-pointer"
            value={asOfDate}
            onChange={e => setAsOfDate(e.target.value || new Date().toISOString().slice(0, 10))}
          />
        </div>
        <div className="flex-1 overflow-y-auto p-[18px] space-y-3.5">
          {items.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">Add items to your portfolio first.</p>
          )}
          {cash.length > 0 && (
            <SoSection icon={<Wallet className="w-3.5 h-3.5 text-white" />} iconBg="#14b8a6" title="Cash" count={cash.length}>
              {cash.map(a => (
                <SoRow key={a.id} name={a.name} meta={a.meta ?? undefined} valueKey={a.id} prevValue={a.current_value} values={values} update={update} fmt={fmt} />
              ))}
            </SoSection>
          )}
          {savings.length > 0 && (
            <SoSection icon={<Landmark className="w-3.5 h-3.5 text-white" />} iconBg="#06b6d4" title="Savings" count={savings.length}>
              {savings.map(a => (
                <SoRow key={a.id} name={a.name} meta={a.invested_value != null ? `Invested: ${fmt(a.invested_value)}` : undefined} valueKey={a.id} prevValue={a.current_value} values={values} update={update} fmt={fmt} />
              ))}
            </SoSection>
          )}
          {investments.length > 0 && (
            <SoSection icon={<TrendingUp className="w-3.5 h-3.5 text-white" />} iconBg="#7c3aed" title="Investments" count={investments.length}>
              {investments.map(a => (
                <SoRow key={a.id} name={a.name} meta={a.type_label && a.invested_value != null ? `${a.type_label} · Invested: ${fmt(a.invested_value)}` : (a.type_label ?? undefined)} valueKey={a.id} prevValue={a.current_value} values={values} update={update} fmt={fmt} />
              ))}
            </SoSection>
          )}
          {physical.length > 0 && (
            <SoSection icon={<Home className="w-3.5 h-3.5 text-white" />} iconBg="#f59e0b" title="Physical Assets" count={physical.length}>
              {physical.map(a => (
                <SoRow key={a.id} name={a.name} meta={a.meta ?? undefined} valueKey={a.id} prevValue={a.current_value} values={values} update={update} fmt={fmt} />
              ))}
            </SoSection>
          )}
          {liabilities.length > 0 && (
            <SoSection icon={<TrendingDown className="w-3.5 h-3.5 text-white" />} iconBg="#ef4444" title="Liabilities" count={liabilities.length}>
              {liabilities.map(a => (
                <SoRow key={a.id} name={a.name} meta={a.type_label && a.invested_value != null ? `${a.type_label} · Original: ${fmt(a.invested_value)}` : (a.type_label ?? undefined)} valueKey={a.id} prevValue={a.current_value} values={values} update={update} fmt={fmt} />
              ))}
            </SoSection>
          )}
        </div>
        <div className="flex gap-2.5 px-6 py-3.5 bg-card border-t border-border shrink-0">
          <button className="flex-1 py-2.5 rounded-xl bg-muted text-foreground text-sm font-semibold hover:bg-muted/80 transition-colors" onClick={onClose}>
            Cancel
          </button>
          <button
            className="flex-[2] py-2.5 rounded-xl bg-teal-500 hover:bg-teal-600 text-white text-sm font-semibold transition-colors disabled:opacity-60"
            onClick={handleSave}
            disabled={saving || items.length === 0}
          >
            {saving ? 'Saving…' : `Save ${monthLabel} Snapshot`}
          </button>
        </div>
      </div>
    </>
  );
}

// ── BackfillSlideover ──────────────────────────────────────────────────────────
function BackfillSlideover({ open, onClose, snapshot, items, onSave, fmt }: {
  open: boolean;
  onClose: () => void;
  snapshot: PortfolioSnapshot;
  items: PortfolioItem[];
  onSave: (params: { snapshotId: string; itemValues: Record<string, number>; netWorth: number }) => Promise<void>;
  fmt: (n: number) => string;
}) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const dateLabel = new Date(snapshot.snapshot_month + 'T12:00:00').toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  });

  useEffect(() => {
    if (!open) return;
    const init: Record<string, string> = {};
    items.forEach(item => { init[item.id] = ''; });
    setValues(init);
  }, [open, items]);

  const update = (k: string, v: string) => setValues(prev => ({ ...prev, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const itemValues: Record<string, number> = {};
      items.forEach(item => {
        const n = parseFloat(values[item.id] ?? '');
        itemValues[item.id] = Number.isFinite(n) && n >= 0 ? n : item.current_value;
      });
      const sum = (section: PortfolioSection) =>
        items.filter(i => i.section === section).reduce((s, i) => s + (itemValues[i.id] ?? 0), 0);
      const netWorth = sum('cash') + sum('savings') + sum('investment') + sum('physical') - sum('liability');
      await onSave({ snapshotId: snapshot.id, itemValues, netWorth });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const cash        = items.filter(i => i.section === 'cash');
  const savings     = items.filter(i => i.section === 'savings');
  const investments = items.filter(i => i.section === 'investment');
  const physical    = items.filter(i => i.section === 'physical');
  const liabilities = items.filter(i => i.section === 'liability');

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/40 z-50 transition-opacity duration-200 ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />
      <div className={`fixed top-0 right-0 bottom-0 w-[480px] max-w-full bg-background z-[60] flex flex-col shadow-2xl transition-transform duration-[250ms] ease-out ${open ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between px-6 py-[18px] bg-card border-b border-border shrink-0">
          <div>
            <div className="text-[15px] font-semibold text-foreground">Fill in Historical Values</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">Enter what each item was worth on {dateLabel}</div>
          </div>
          <button
            className="w-[30px] h-[30px] rounded-lg bg-muted flex items-center justify-center text-muted-foreground hover:bg-muted/80 transition-colors"
            onClick={onClose}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex items-center gap-2.5 px-6 py-3 bg-amber-50 dark:bg-amber-900/10 border-b border-amber-200 dark:border-amber-800 shrink-0">
          <Calendar className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
          <p className="text-xs text-amber-700 dark:text-amber-400">
            Snapshot date: <span className="font-semibold">{dateLabel}</span> — current values shown as reference
          </p>
        </div>
        <div className="flex-1 overflow-y-auto p-[18px] space-y-3.5">
          {items.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">Add items to your portfolio first.</p>
          )}
          {cash.length > 0 && (
            <SoSection icon={<Wallet className="w-3.5 h-3.5 text-white" />} iconBg="#14b8a6" title="Cash" count={cash.length}>
              {cash.map(a => (
                <SoRow key={a.id} name={a.name} meta={a.meta ?? undefined} valueKey={a.id} prevValue={a.current_value} values={values} update={update} fmt={fmt} prevLabel="Current" />
              ))}
            </SoSection>
          )}
          {savings.length > 0 && (
            <SoSection icon={<Landmark className="w-3.5 h-3.5 text-white" />} iconBg="#06b6d4" title="Savings" count={savings.length}>
              {savings.map(a => (
                <SoRow key={a.id} name={a.name} meta={undefined} valueKey={a.id} prevValue={a.current_value} values={values} update={update} fmt={fmt} prevLabel="Current" />
              ))}
            </SoSection>
          )}
          {investments.length > 0 && (
            <SoSection icon={<TrendingUp className="w-3.5 h-3.5 text-white" />} iconBg="#7c3aed" title="Investments" count={investments.length}>
              {investments.map(a => (
                <SoRow key={a.id} name={a.name} meta={a.type_label ?? undefined} valueKey={a.id} prevValue={a.current_value} values={values} update={update} fmt={fmt} prevLabel="Current" />
              ))}
            </SoSection>
          )}
          {physical.length > 0 && (
            <SoSection icon={<Home className="w-3.5 h-3.5 text-white" />} iconBg="#f59e0b" title="Physical Assets" count={physical.length}>
              {physical.map(a => (
                <SoRow key={a.id} name={a.name} meta={a.meta ?? undefined} valueKey={a.id} prevValue={a.current_value} values={values} update={update} fmt={fmt} prevLabel="Current" />
              ))}
            </SoSection>
          )}
          {liabilities.length > 0 && (
            <SoSection icon={<TrendingDown className="w-3.5 h-3.5 text-white" />} iconBg="#ef4444" title="Liabilities" count={liabilities.length}>
              {liabilities.map(a => (
                <SoRow key={a.id} name={a.name} meta={a.type_label ?? undefined} valueKey={a.id} prevValue={a.current_value} values={values} update={update} fmt={fmt} prevLabel="Current" />
              ))}
            </SoSection>
          )}
        </div>
        <div className="flex gap-2.5 px-6 py-3.5 bg-card border-t border-border shrink-0">
          <button className="flex-1 py-2.5 rounded-xl bg-muted text-foreground text-sm font-semibold hover:bg-muted/80 transition-colors" onClick={onClose}>
            Cancel
          </button>
          <button
            className="flex-[2] py-2.5 rounded-xl bg-teal-500 hover:bg-teal-600 text-white text-sm font-semibold transition-colors disabled:opacity-60"
            onClick={handleSave}
            disabled={saving || items.length === 0}
          >
            {saving ? 'Saving…' : `Save ${dateLabel} Data`}
          </button>
        </div>
      </div>
    </>
  );
}

// ── AddItemModal ───────────────────────────────────────────────────────────────
const SECTION_OPTIONS: { value: PortfolioSection; label: string }[] = [
  { value: 'cash',       label: 'Cash'           },
  { value: 'savings',    label: 'Savings'         },
  { value: 'investment', label: 'Investment'      },
  { value: 'physical',   label: 'Physical Asset'  },
  { value: 'liability',  label: 'Liability'       },
];

function AddItemModal({ onClose, onAdd }: {
  onClose: () => void;
  onAdd: (item: Omit<PortfolioItem, 'id'>) => Promise<void>;
}) {
  const [section, setSection] = useState<PortfolioSection>('cash');
  const [name, setName] = useState('');
  const [abbr, setAbbr] = useState('');
  const [meta, setMeta] = useState('');
  const [color, setColor] = useState('#14b8a6');
  const [typeClass, setTypeClass] = useState('');
  const [currentValue, setCurrentValue] = useState('');
  const [investedValue, setInvestedValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const needsType = section === 'investment' || section === 'liability';
  const needsInvested = section !== 'cash';
  const typeOptions = section === 'investment' ? INVESTMENT_TYPES : LIABILITY_TYPES;
  const selectedType = typeOptions.find(t => t.class === typeClass);

  const handleSubmit = async () => {
    setError('');
    if (!name.trim()) { setError('Name is required.'); return; }
    if (!abbr.trim()) { setError('Abbreviation is required.'); return; }
    const cv = parseFloat(currentValue);
    if (!Number.isFinite(cv) || cv < 0) { setError('Enter a valid current value.'); return; }
    const iv = investedValue.trim() ? parseFloat(investedValue) : null;
    if (needsInvested && investedValue.trim() && (!Number.isFinite(iv!) || iv! < 0)) { setError('Enter a valid invested / original value.'); return; }
    if (needsType && !typeClass) { setError('Select a type.'); return; }

    setSaving(true);
    try {
      await onAdd({
        section,
        name: name.trim(),
        abbr: abbr.trim().toUpperCase().slice(0, 5),
        meta: meta.trim() || null,
        color,
        type_label: selectedType?.label ?? null,
        type_class: typeClass || null,
        current_value: cv,
        invested_value: needsInvested ? (iv ?? cv) : null,
        sort_order: 0,
      });
      onClose();
    } catch {
      setError('Failed to add item. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const currentValueLabel =
    section === 'cash'       ? 'Current Balance'      :
    section === 'liability'  ? 'Remaining Balance'     :
    'Current Value';

  const investedLabel =
    section === 'liability'  ? 'Original Amount'       :
    section === 'savings'    ? 'Amount Deposited'      :
    'Amount Invested';

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-card w-full max-w-md rounded-t-2xl sm:rounded-2xl shadow-xl overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <p className="font-semibold text-sm">Add Portfolio Item</p>
          <button onClick={onClose} className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Section */}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Category</label>
            <div className="flex flex-wrap gap-1.5">
              {SECTION_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => { setSection(opt.value); setTypeClass(''); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                    section === opt.value
                      ? 'bg-teal-500 text-white border-teal-500'
                      : 'border-border text-muted-foreground hover:border-teal-500 hover:text-teal-600'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Name & Abbr */}
          <div className="grid grid-cols-[1fr_100px] gap-3">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Name</label>
              <input
                className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-input-background outline-none focus:border-teal-500 transition-colors"
                placeholder="e.g. Vanguard FTSE All-World"
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Abbr</label>
              <input
                className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-input-background outline-none focus:border-teal-500 transition-colors uppercase"
                placeholder="VAN"
                maxLength={5}
                value={abbr}
                onChange={e => setAbbr(e.target.value.toUpperCase())}
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Description <span className="font-normal opacity-60">(optional)</span></label>
            <input
              className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-input-background outline-none focus:border-teal-500 transition-colors"
              placeholder={section === 'cash' ? 'e.g. Revolut, Millennium BCP' : section === 'physical' ? 'e.g. Primary residence' : ''}
              value={meta}
              onChange={e => setMeta(e.target.value)}
            />
          </div>

          {/* Type (investments / liabilities only) */}
          {needsType && (
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Type</label>
              <div className="flex flex-wrap gap-1.5">
                {typeOptions.map(t => (
                  <button
                    key={t.class}
                    onClick={() => setTypeClass(t.class)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                      typeClass === t.class
                        ? 'bg-teal-500 text-white border-teal-500'
                        : 'border-border text-muted-foreground hover:border-teal-500 hover:text-teal-600'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Values */}
          <div className={`grid gap-3 ${needsInvested ? 'grid-cols-2' : 'grid-cols-1'}`}>
            {needsInvested && (
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">{investedLabel}</label>
                <input
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-input-background outline-none focus:border-teal-500 transition-colors text-right tabular-nums"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={investedValue}
                  onChange={e => setInvestedValue(e.target.value)}
                />
              </div>
            )}
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">{currentValueLabel}</label>
              <input
                className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-input-background outline-none focus:border-teal-500 transition-colors text-right tabular-nums"
                inputMode="decimal"
                placeholder="0.00"
                value={currentValue}
                onChange={e => setCurrentValue(e.target.value)}
              />
            </div>
          </div>

          {/* Color */}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Color</label>
            <div className="flex flex-wrap gap-2">
              {COLOR_PALETTE.map(c => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-6 h-6 rounded-md transition-transform ${color === c ? 'ring-2 ring-offset-1 ring-teal-500 scale-110' : 'hover:scale-110'}`}
                  style={{ background: c }}
                />
              ))}
            </div>
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>

        <div className="flex gap-3 px-5 pb-5 pt-3 border-t border-border">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-muted text-foreground text-sm font-semibold hover:bg-muted/80 transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex-[2] py-2.5 rounded-xl bg-teal-500 hover:bg-teal-600 text-white text-sm font-semibold transition-colors disabled:opacity-60"
          >
            {saving ? 'Adding…' : 'Add Item'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main export ────────────────────────────────────────────────────────────────
export function Portfolio() {
  const { formatAmount } = useCurrency();
  const { items, snapshots, isLoading, addItem, deleteItem, saveSnapshot, fetchSnapshotItems, backfillSnapshotItems } = usePortfolio();
  const fmt = formatAmount;
  const [range, setRange] = useState<RangeKey>('All');
  const [soOpen, setSoOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [hiddenCategories, setHiddenCategories] = useState<Set<string>>(new Set());
  const [snapshotDate, setSnapshotDate] = useState<string | null>(null);
  const [snapshotItemValues, setSnapshotItemValues] = useState<Record<string, number> | null>(null);
  const [snapshotItemsLoading, setSnapshotItemsLoading] = useState(false);
  const [backfillOpen, setBackfillOpen] = useState(false);

  const toggleCategory = (id: string) => setHiddenCategories(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  // Derived totals
  const cash        = items.filter(i => i.section === 'cash');
  const savings     = items.filter(i => i.section === 'savings');
  const investments = items.filter(i => i.section === 'investment');
  const physical    = items.filter(i => i.section === 'physical');
  const liabilities = items.filter(i => i.section === 'liability');

  const totalCash    = cash.reduce((s, a) => s + a.current_value, 0);
  const totalSavCur  = savings.reduce((s, a) => s + a.current_value, 0);
  const totalSavInv  = savings.reduce((s, a) => s + (a.invested_value ?? 0), 0);
  const totalInvCur  = investments.reduce((s, a) => s + a.current_value, 0);
  const totalInvInv  = investments.reduce((s, a) => s + (a.invested_value ?? 0), 0);
  const totalPhysCur = physical.reduce((s, a) => s + a.current_value, 0);
  const totalPhysInv = physical.reduce((s, a) => s + (a.invested_value ?? 0), 0);
  const totalLiabs   = liabilities.reduce((s, a) => s + a.current_value, 0);
  const totalAssets  = totalCash + totalSavCur + totalInvCur + totalPhysCur;
  const netWorth     = totalAssets - totalLiabs;

  // Net worth history from snapshots (daily granularity)
  const histPoints: HistPoint[] = snapshots.map(s => ({
    date: s.snapshot_month,
    m: new Date(s.snapshot_month + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    v: s.net_worth,
  }));

  // Snapshot date filter — historical view
  const selectedSnapshot = snapshotDate
    ? snapshots.find(s => s.snapshot_month === snapshotDate) ?? null
    : null;
  const isHistoricalView = selectedSnapshot !== null;

  // Load per-item values whenever we switch to a snapshot that has item data
  const prevSnapshotIdRef = useRef<string | null>(null);
  useEffect(() => {
    const id = selectedSnapshot?.has_item_data ? selectedSnapshot.id : null;
    if (id === prevSnapshotIdRef.current) return;
    prevSnapshotIdRef.current = id;
    if (!id) { setSnapshotItemValues(null); return; }
    setSnapshotItemsLoading(true);
    fetchSnapshotItems(id)
      .then(vals => setSnapshotItemValues(vals))
      .finally(() => setSnapshotItemsLoading(false));
  });

  // Returns the value to display for an item: historical (if loaded) or current
  const dv = (item: PortfolioItem): number =>
    isHistoricalView && snapshotItemValues ? (snapshotItemValues[item.id] ?? 0) : item.current_value;

  // Chart data clipped to the selected snapshot date
  const chartHistPoints = snapshotDate
    ? histPoints.filter(p => p.date <= snapshotDate)
    : histPoints;

  // Change from the selected snapshot to current net worth
  const histNwChange = isHistoricalView ? netWorth - selectedSnapshot!.net_worth : 0;
  const histNwChangePct =
    isHistoricalView && selectedSnapshot!.net_worth !== 0
      ? (histNwChange / selectedSnapshot!.net_worth) * 100
      : 0;

  // Hero number = live sum from items, filtered to visible categories when toggled.
  const isFiltered = hiddenCategories.size > 0;
  const visibleNW =
    (!hiddenCategories.has('cash')       ? totalCash    : 0) +
    (!hiddenCategories.has('savings')    ? totalSavCur  : 0) +
    (!hiddenCategories.has('investment') ? totalInvCur  : 0) +
    (!hiddenCategories.has('physical')   ? totalPhysCur : 0) -
    (!hiddenCategories.has('liability')  ? totalLiabs   : 0);
  const displayNW = isFiltered ? visibleNW : netWorth;
  // In historical view the hero shows the snapshot's net worth, not the live value
  const heroNW = isHistoricalView ? selectedSnapshot!.net_worth : displayNW;

  // Comparison baseline = a historical snapshot chosen by range.
  // "most recent snapshot at-or-before a cutoff date" gives the cleanest UX:
  // e.g. "1M" finds what your NW was ~30 days ago per your last recorded snapshot.
  const _now = new Date();
  const _cutoff = (days: number) => new Date(_now.getTime() - days * 86_400_000).toISOString().slice(0, 10);
  const _ytdStart = `${_now.getFullYear()}-01-01`;

  const lastSnapshotAtOrBefore = (date: string): HistPoint | null => {
    const hits = histPoints.filter(d => d.date <= date);
    return hits.length > 0 ? hits[hits.length - 1] : null;
  };

  const baselinePoint: HistPoint | null =
    range === 'All' ? (histPoints.length >= 1 ? histPoints[0] : null)
    : range === '1M'  ? lastSnapshotAtOrBefore(_cutoff(30))
    : range === '6M'  ? lastSnapshotAtOrBefore(_cutoff(180))
    : /* YTD */         lastSnapshotAtOrBefore(`${_now.getFullYear() - 1}-12-31`)
                        ?? (histPoints.find(d => d.date >= _ytdStart) ?? null);

  const nwChange      = baselinePoint ? displayNW - baselinePoint.v : 0;
  const nwChangePct   = baselinePoint && baselinePoint.v !== 0 ? (nwChange / baselinePoint.v) * 100 : 0;
  const showComparison = baselinePoint !== null && !isFiltered && !isHistoricalView;
  const rangeLabel =
    range === '1M'  ? 'vs 1 month ago'
    : range === '6M'  ? 'vs 6 months ago'
    : range === 'YTD' ? 'vs start of year'
    : 'vs oldest snapshot';

  // Ledger section totals — use historical item values when available, else live totals
  const hasHistItems = isHistoricalView && snapshotItemValues !== null;
  const ledgerCash   = hasHistItems ? cash.reduce((s, i) => s + dv(i), 0)    : totalCash;
  const ledgerSav    = hasHistItems ? savings.reduce((s, i) => s + dv(i), 0) : totalSavCur;
  const ledgerSavInv = totalSavInv;

  // Investments, physical assets and liabilities: hide rows with a displayed value of 0
  // (items the user has cleared out but not yet deleted). Totals and invested amounts
  // are derived from the visible subset so profit figures in section headers stay clean.
  const visibleInvestments = investments.filter(a => dv(a) > 0);
  const visiblePhysical    = physical.filter(a => dv(a) > 0);
  const visibleLiabilities = liabilities.filter(a => dv(a) > 0);

  const ledgerInv    = visibleInvestments.reduce((s, a) => s + dv(a), 0);
  const ledgerInvInv = visibleInvestments.reduce((s, a) => s + (a.invested_value ?? 0), 0);
  const ledgerPhys   = visiblePhysical.reduce((s, a) => s + dv(a), 0);
  const ledgerPhysInv = visiblePhysical.reduce((s, a) => s + (a.invested_value ?? 0), 0);
  const ledgerLiabs  = visibleLiabilities.reduce((s, a) => s + dv(a), 0);

  const distribution: DistEntry[] = [
    { id: 'cash',       name: 'Cash',           value: totalCash,    color: '#14b8a6', isNeg: false },
    { id: 'savings',    name: 'Savings',         value: totalSavCur,  color: '#06b6d4', isNeg: false },
    { id: 'investment', name: 'Investments',     value: totalInvCur,  color: '#7c3aed', isNeg: false },
    { id: 'physical',   name: 'Physical Assets', value: totalPhysCur, color: '#f59e0b', isNeg: false },
    { id: 'liability',  name: 'Liabilities',     value: -totalLiabs,  color: '#ef4444', isNeg: true  },
  ].filter(d => Math.abs(d.value) > 0);

  const lastUpdated = snapshots.length > 0
    ? new Date(snapshots[snapshots.length - 1].snapshot_month + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : 'Never';

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card sticky top-0 z-40">
        <div className="px-4 lg:px-8 py-3 lg:py-5">
          <div className="flex items-center justify-between gap-3">
            <h1 className="text-xl font-semibold">Portfolio Manager</h1>
            <div className="flex items-center gap-2 shrink-0">
              <button
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border text-sm font-semibold text-foreground hover:bg-muted transition-colors"
                onClick={() => setAddOpen(true)}
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Add Item</span>
              </button>
              <button
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-teal-500 hover:bg-teal-600 text-white text-sm font-semibold transition-colors"
                onClick={() => setSoOpen(true)}
              >
                <Clock className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Update Portfolio</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="px-4 lg:px-8 py-6 lg:py-8 max-w-[1240px] mx-auto">

        {isLoading && items.length === 0 ? (
          <div className="flex items-center justify-center py-24 text-muted-foreground text-sm">Loading…</div>
        ) : (
          <>
            {/* Snapshot date filter */}
            {snapshots.length > 0 && (
              <div className="flex items-center gap-2.5 mb-3.5 px-4 py-2.5 bg-card border border-border rounded-xl">
                <Calendar className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">View as of</span>
                <select
                  value={snapshotDate ?? ''}
                  onChange={e => setSnapshotDate(e.target.value || null)}
                  className="flex-1 sm:flex-none min-w-0 text-xs border border-border rounded-lg px-2.5 py-1.5 bg-input-background text-foreground outline-none focus:border-teal-500 cursor-pointer transition-colors"
                >
                  <option value="">Current (Live)</option>
                  {[...snapshots].reverse().map(s => (
                    <option key={s.snapshot_month} value={s.snapshot_month}>
                      {new Date(s.snapshot_month + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </option>
                  ))}
                </select>
                {isHistoricalView && (
                  <span className="hidden sm:inline text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 font-semibold whitespace-nowrap shrink-0">
                    Historical view
                  </span>
                )}
                {isHistoricalView && (
                  <button
                    onClick={() => setSnapshotDate(null)}
                    className="text-xs text-teal-600 hover:text-teal-700 font-semibold shrink-0"
                  >
                    Reset
                  </button>
                )}
              </div>
            )}

            {/* Overview grid */}
            <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-3.5 mb-3.5">
              {/* Net worth card */}
              <div className="bg-card border border-border rounded-xl p-5 flex flex-col">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-[0.06em]">
                      {isHistoricalView
                        ? `Net Worth — ${new Date(snapshotDate! + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
                        : 'Total Net Worth'}
                    </p>
                    <p className="text-[32px] sm:text-[42px] font-bold tracking-[-1.5px] text-foreground mt-1 leading-none">{fmt(heroNW)}</p>
                    {isHistoricalView && (
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-2 text-xs">
                        <span className="text-muted-foreground">Today:</span>
                        <span className="font-semibold text-foreground">{fmt(netWorth)}</span>
                        <span className={`font-semibold flex items-center gap-1 ${histNwChange >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                          {histNwChange >= 0 ? '↑' : '↓'} {fmt(Math.abs(histNwChange))}
                          <span className="font-medium opacity-80 ml-0.5">({fmtPct(histNwChangePct)})</span>
                        </span>
                        <span className="text-muted-foreground">since snapshot</span>
                      </div>
                    )}
                    {showComparison && (
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-2 text-xs">
                        <span className={`font-semibold flex items-center gap-1 ${nwChange >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                          {nwChange >= 0 ? '↑' : '↓'} {fmt(Math.abs(nwChange))}
                          <span className="font-medium opacity-80 ml-0.5">({fmtPct(nwChangePct)})</span>
                        </span>
                        <span className="text-muted-foreground">{rangeLabel}</span>
                      </div>
                    )}
                    {isFiltered && !isHistoricalView && (
                      <div className="flex items-center gap-2 mt-2 text-xs">
                        <span className="text-muted-foreground">Filtered view</span>
                        <button
                          onClick={() => setHiddenCategories(new Set())}
                          className="text-teal-600 hover:text-teal-700 font-semibold underline underline-offset-2"
                        >
                          Reset
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-px bg-muted rounded-lg p-0.5 self-start shrink-0">
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
                <NetWorthChart data={chartHistPoints} range={range} fmt={fmt} />
              </div>

              {/* Wealth distribution card */}
              <div className="bg-card border border-border rounded-xl p-5 flex flex-col">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-[0.06em] mb-1">Wealth Distribution</p>
                <DonutChart data={distribution} fmt={fmt} hiddenIds={hiddenCategories} onToggle={toggleCategory} />
              </div>
            </div>

            {/* Portfolio ledger */}
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-foreground">Current Portfolio</p>
              <p className="text-xs text-muted-foreground">Last snapshot: {lastUpdated}</p>
            </div>
            {isHistoricalView && selectedSnapshot && (
              selectedSnapshot.has_item_data ? (
                snapshotItemsLoading ? (
                  <div className="mb-3 px-4 py-2.5 bg-muted/60 border border-border rounded-xl">
                    <p className="text-xs text-muted-foreground">Loading historical values…</p>
                  </div>
                ) : (
                  <div className="mb-3 px-4 py-2.5 bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800 rounded-xl">
                    <p className="text-xs text-teal-700 dark:text-teal-400">
                      Showing item balances as of {new Date(snapshotDate! + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}.
                    </p>
                  </div>
                )
              ) : (
                <div className="mb-3 px-4 py-2.5 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-xl flex items-center justify-between gap-3">
                  <p className="text-xs text-amber-700 dark:text-amber-400">
                    No item-level data for this snapshot — net worth only.
                  </p>
                  <button
                    onClick={() => setBackfillOpen(true)}
                    className="shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white transition-colors"
                  >
                    Fill in historical values
                  </button>
                </div>
              )
            )}
            <div className="space-y-3">
              <LedgerSection
                name="Cash" icon={<Wallet className="w-4 h-4 text-white" />} iconBg="#14b8a6"
                total={ledgerCash} totalLabel="Total balance" count={cash.length} fmt={fmt}
                columns={[{ label: 'Account Name' }, { label: hasHistItems ? 'Balance on Date' : 'Current Balance', num: true, width: '200px' }, { label: '', width: '40px' }]}
              >
                {cash.length === 0 ? (
                  <tr><td colSpan={3} className="px-4 py-4 text-xs text-muted-foreground text-center">No cash accounts yet</td></tr>
                ) : cash.map(a => (
                  <tr key={a.id} className="group hover:bg-teal-500/[0.04] transition-colors">
                    <td className="px-4 py-3 font-medium text-[13px]">
                      <div className="flex items-center gap-2.5">
                        <AssetIcon color={a.color} abbr={a.abbr} />
                        <div>
                          <div>{a.name}</div>
                          {a.meta && <div className="text-[11px] text-muted-foreground font-normal mt-0.5">{a.meta}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-[13px]">{fmt(dv(a))}</td>
                    <td className="px-4 py-3 text-right">
                      {!isHistoricalView && (
                        <button onClick={() => deleteItem(a.id)} className="opacity-0 group-hover:opacity-100 p-1 rounded text-muted-foreground hover:text-red-500 transition-all">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </LedgerSection>

              <LedgerSection
                name="Savings" icon={<Landmark className="w-4 h-4 text-white" />} iconBg="#06b6d4"
                total={ledgerSav} totalLabel={`Profit ${fmt(ledgerSav - ledgerSavInv)}`} count={savings.length} fmt={fmt}
                columns={[
                  { label: 'Name' }, { label: 'Invested', num: true }, { label: hasHistItems ? 'Value on Date' : 'Actual', num: true },
                  { label: 'Profit', num: true }, { label: 'Profit %', num: true }, { label: '', width: '40px' },
                ]}
              >
                {savings.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-4 text-xs text-muted-foreground text-center">No savings accounts yet</td></tr>
                ) : savings.map(a => {
                  const val = dv(a);
                  const invested = a.invested_value ?? a.current_value;
                  const profit = val - invested;
                  const pct = invested > 0 ? (profit / invested) * 100 : 0;
                  return (
                    <tr key={a.id} className="group hover:bg-teal-500/[0.04] transition-colors">
                      <td className="px-4 py-3 font-medium text-[13px]">
                        <div className="flex items-center gap-2.5">
                          <AssetIcon color={a.color} abbr={a.abbr} />
                          <div>
                            <div>{a.name}</div>
                            {a.meta && <div className="text-[11px] text-muted-foreground font-normal mt-0.5">{a.meta}</div>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-[13px]">{fmt(invested)}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-[13px]">{fmt(val)}</td>
                      <td className={`px-4 py-3 text-right tabular-nums text-[13px] font-semibold ${profit >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                        {profit >= 0 ? '+' : ''}{fmt(profit)}
                      </td>
                      <td className={`px-4 py-3 text-right tabular-nums text-[13px] font-semibold ${profit >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                        {fmtPct(pct)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {!isHistoricalView && (
                          <button onClick={() => deleteItem(a.id)} className="opacity-0 group-hover:opacity-100 p-1 rounded text-muted-foreground hover:text-red-500 transition-all">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </LedgerSection>

              <LedgerSection
                name="Investments" icon={<TrendingUp className="w-4 h-4 text-white" />} iconBg="#7c3aed"
                total={ledgerInv} totalLabel={`Profit ${fmt(ledgerInv - ledgerInvInv)}`} count={visibleInvestments.length} fmt={fmt}
                columns={[
                  { label: 'Name' }, { label: 'Type' }, { label: 'Invested', num: true },
                  { label: hasHistItems ? 'Value on Date' : 'Actual', num: true }, { label: 'Profit %', num: true }, { label: 'Profit', num: true }, { label: '', width: '40px' },
                ]}
              >
                {visibleInvestments.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-4 text-xs text-muted-foreground text-center">No investments yet</td></tr>
                ) : visibleInvestments.map(a => {
                  const val = dv(a);
                  const invested = a.invested_value ?? a.current_value;
                  const profit = val - invested;
                  const pct = invested > 0 ? (profit / invested) * 100 : 0;
                  return (
                    <tr key={a.id} className="group hover:bg-teal-500/[0.04] transition-colors">
                      <td className="px-4 py-3 font-medium text-[13px]">
                        <div className="flex items-center gap-2.5">
                          <AssetIcon color={a.color} abbr={a.abbr} />
                          <div>{a.name}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3">{a.type_label && a.type_class ? <TypePill type={a.type_label} typeClass={a.type_class} /> : null}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-[13px]">{fmt(invested)}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-[13px]">{fmt(val)}</td>
                      <td className={`px-4 py-3 text-right tabular-nums text-[13px] font-semibold ${profit >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                        {fmtPct(pct)}
                      </td>
                      <td className={`px-4 py-3 text-right tabular-nums text-[13px] font-semibold ${profit >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                        {profit >= 0 ? '+' : ''}{fmt(profit)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {!isHistoricalView && (
                          <button onClick={() => deleteItem(a.id)} className="opacity-0 group-hover:opacity-100 p-1 rounded text-muted-foreground hover:text-red-500 transition-all">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </LedgerSection>

              <LedgerSection
                name="Physical Assets" icon={<Home className="w-4 h-4 text-white" />} iconBg="#f59e0b"
                total={ledgerPhys} totalLabel={`Profit ${fmt(ledgerPhys - ledgerPhysInv)}`} count={visiblePhysical.length} fmt={fmt}
                columns={[
                  { label: 'Name' }, { label: 'Purchased', num: true }, { label: hasHistItems ? 'Value on Date' : 'Actual', num: true },
                  { label: 'Profit %', num: true }, { label: 'Profit', num: true }, { label: '', width: '40px' },
                ]}
              >
                {visiblePhysical.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-4 text-xs text-muted-foreground text-center">No physical assets yet</td></tr>
                ) : visiblePhysical.map(a => {
                  const val = dv(a);
                  const invested = a.invested_value ?? a.current_value;
                  const profit = val - invested;
                  const pct = invested > 0 ? (profit / invested) * 100 : 0;
                  return (
                    <tr key={a.id} className="group hover:bg-teal-500/[0.04] transition-colors">
                      <td className="px-4 py-3 font-medium text-[13px]">
                        <div className="flex items-center gap-2.5">
                          <AssetIcon color={a.color} abbr={a.abbr} />
                          <div>
                            <div>{a.name}</div>
                            {a.meta && <div className="text-[11px] text-muted-foreground font-normal mt-0.5">{a.meta}</div>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-[13px]">{fmt(invested)}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-[13px]">{fmt(val)}</td>
                      <td className={`px-4 py-3 text-right tabular-nums text-[13px] font-semibold ${profit >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                        {fmtPct(pct)}
                      </td>
                      <td className={`px-4 py-3 text-right tabular-nums text-[13px] font-semibold ${profit >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                        {profit >= 0 ? '+' : ''}{fmt(profit)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {!isHistoricalView && (
                          <button onClick={() => deleteItem(a.id)} className="opacity-0 group-hover:opacity-100 p-1 rounded text-muted-foreground hover:text-red-500 transition-all">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </LedgerSection>

              <LedgerSection
                name="Liabilities" icon={<TrendingDown className="w-4 h-4 text-white" />} iconBg="#ef4444" isLiability
                total={ledgerLiabs} totalLabel="Total outstanding" count={visibleLiabilities.length} fmt={fmt}
                columns={[{ label: 'Name' }, { label: 'Type' }, { label: 'Original', num: true }, { label: hasHistItems ? 'Balance on Date' : 'Remaining', num: true }, { label: '', width: '40px' }]}
              >
                {visibleLiabilities.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-4 text-xs text-muted-foreground text-center">No liabilities yet</td></tr>
                ) : visibleLiabilities.map(a => {
                  const val = dv(a);
                  return (
                    <tr key={a.id} className="group hover:bg-teal-500/[0.04] transition-colors">
                      <td className="px-4 py-3 font-medium text-[13px]">
                        <div className="flex items-center gap-2.5">
                          <AssetIcon color={a.color} abbr={a.abbr} />
                          <div>{a.name}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3">{a.type_label && a.type_class ? <TypePill type={a.type_label} typeClass={a.type_class} /> : null}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-[13px]">{a.invested_value != null ? fmt(a.invested_value) : '—'}</td>
                      <td className={`px-4 py-3 text-right tabular-nums text-[13px] font-semibold ${val > 0 ? 'text-red-500' : 'text-foreground'}`}>
                        {val > 0 ? '−' : ''}{fmt(val)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {!isHistoricalView && (
                          <button onClick={() => deleteItem(a.id)} className="opacity-0 group-hover:opacity-100 p-1 rounded text-muted-foreground hover:text-red-500 transition-all">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </LedgerSection>
            </div>
          </>
        )}

        <UpdatePortfolioSlideover
          open={soOpen}
          onClose={() => setSoOpen(false)}
          items={items}
          onSave={saveSnapshot}
          fmt={fmt}
        />

        {selectedSnapshot && backfillOpen && (
          <BackfillSlideover
            open={backfillOpen}
            onClose={() => setBackfillOpen(false)}
            snapshot={selectedSnapshot}
            items={items}
            onSave={backfillSnapshotItems}
            fmt={fmt}
          />
        )}

        {addOpen && (
          <AddItemModal
            onClose={() => setAddOpen(false)}
            onAdd={addItem}
          />
        )}
      </div>
    </div>
  );
}
