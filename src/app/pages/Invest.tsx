import { useState, useMemo, useCallback, useRef } from 'react';
import { ExternalLink, TrendingUp, X } from 'lucide-react';
import productData from '../../data/invest-products.json';

// ── Types ─────────────────────────────────────────────────────────────────────

interface SavingsAccount {
  id: string;
  name: string;
  institution: string;
  tan: number;
  expectedAnnualReturn: number;
  maxEligibleAmount: number;
  term: string;
  suggestedAllocationPct: number;
  notes?: string;
  url: string;
}

interface ETF {
  id: string;
  name: string;
  ticker: string;
  expectedAnnualReturn: number;
  ter: number;
  risk: 'high' | 'medium' | 'low';
  description: string;
  suggestedAllocationPct: number;
  url: string;
}

interface Future {
  id: string;
  name: string;
  issuer: string;
  couponRate: number;
  expectedAnnualReturn: number;
  maturityDate: string;
  minInvestment: number;
  suggestedAllocationPct: number;
  notes?: string;
  url: string;
}

interface PPR {
  id: string;
  name: string;
  institution: string;
  expectedAnnualReturn: number;
  risk: 'high' | 'medium' | 'low';
  taxBenefit?: string;
  suggestedAllocationPct: number;
  notes?: string;
  url: string;
}

type AnyProduct = SavingsAccount | ETF | Future | PPR;

type RiskProfile = 'safe' | 'balanced' | 'growth';

interface FVResult {
  grossFV: number;
  taxOnGains: number;
  netFV: number;
  netReturn: number;
  weightedReturn: number;
}

interface ChartPoint {
  year: number;
  net: number;
  contrib: number;
}

interface WeightedProduct extends AnyProduct {
  weight: number;
}

// ── Config ────────────────────────────────────────────────────────────────────

const RISK_SPLITS: Record<RiskProfile, { savings: number; highRisk: number; bonds: number }> = {
  safe:     { savings: 85, highRisk: 5,  bonds: 10 },
  balanced: { savings: 60, highRisk: 20, bonds: 20 },
  growth:   { savings: 50, highRisk: 25, bonds: 25 },
};

const BUCKET_COLORS = {
  savings:  '#14b8a6',
  highRisk: '#7c3aed',
  bonds:    '#1d4ed8',
} as const;

const RISK_HEX: Record<RiskProfile, string> = {
  safe:     '#0f766e',
  balanced: '#1d4ed8',
  growth:   '#7c3aed',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtEur(n: number, decimals = 0): string {
  return '€' + n.toLocaleString('pt-PT', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function fmtPct(n: number): string {
  return n.toFixed(1) + '%';
}

function getBuckets() {
  const data = productData as {
    savingsAccounts: SavingsAccount[];
    etfs: ETF[];
    futures: Future[];
    pprs: PPR[];
  };
  return {
    savings:  data.savingsAccounts as AnyProduct[],
    highRisk: [
      ...data.etfs.filter(p => p.risk === 'high' || p.risk === 'medium'),
      ...data.pprs.filter(p => p.risk === 'high' || p.risk === 'medium'),
    ] as AnyProduct[],
    bonds: [
      ...data.futures,
      ...data.pprs.filter(p => p.risk === 'low'),
    ] as AnyProduct[],
  };
}

function buildAllProducts(
  buckets: ReturnType<typeof getBuckets>,
  allocations: Record<string, number>,
  splits: { savings: number; highRisk: number; bonds: number },
): WeightedProduct[] {
  const result: WeightedProduct[] = [];
  const entries: [keyof typeof buckets, keyof typeof splits][] = [
    ['savings', 'savings'],
    ['highRisk', 'highRisk'],
    ['bonds', 'bonds'],
  ];
  for (const [bKey, sKey] of entries) {
    const bucketPct = splits[sKey] / 100;
    for (const p of buckets[bKey]) {
      const productPct = (allocations[p.id] ?? (p as AnyProduct & { suggestedAllocationPct: number }).suggestedAllocationPct) / 100;
      result.push({ ...p, weight: bucketPct * productPct } as WeightedProduct);
    }
  }
  return result;
}

function calcFV(amount: number, horizonYears: number, allProducts: WeightedProduct[]): FVResult | null {
  if (!amount || amount <= 0) return null;
  const totalWeight = allProducts.reduce((s, p) => s + p.weight, 0);
  if (totalWeight === 0) return null;
  const weightedReturn = allProducts.reduce((s, p) => s + p.expectedAnnualReturn * p.weight, 0) / totalWeight;
  const monthlyRate = weightedReturn / 12 / 100;
  const months = horizonYears * 12;
  const grossFV = amount * Math.pow(1 + monthlyRate, months);
  const taxOnGains = (grossFV - amount) * 0.28;
  const netFV = grossFV - taxOnGains;
  const netReturn = netFV - amount;
  return { grossFV, taxOnGains, netFV, netReturn, weightedReturn };
}

function calcComparisonFV(amount: number, horizon: number, profile: RiskProfile): FVResult | null {
  const splits = RISK_SPLITS[profile];
  const buckets = getBuckets();
  const allProducts = buildAllProducts(buckets, {}, splits);
  return calcFV(amount, horizon, allProducts);
}

function buildChartData(amount: number, horizon: number, allProducts: WeightedProduct[]): ChartPoint[] {
  if (!amount || amount <= 0) return [];
  const totalWeight = allProducts.reduce((s, p) => s + p.weight, 0);
  const weightedReturn =
    allProducts.reduce((s, p) => s + p.expectedAnnualReturn * p.weight, 0) / (totalWeight || 1);
  const monthlyRate = weightedReturn / 12 / 100;
  return Array.from({ length: horizon }, (_, i) => {
    const yr = i + 1;
    const months = yr * 12;
    const grossFV = amount * Math.pow(1 + monthlyRate, months);
    const taxOnGains = (grossFV - amount) * 0.28;
    const netFV = grossFV - taxOnGains;
    return { year: yr, net: Math.round(netFV), contrib: Math.round(amount) };
  });
}

// ── SimChart ──────────────────────────────────────────────────────────────────

interface TipState { d: ChartPoint; x: number; y: number }

function SimChart({ data, riskProfile, horizon }: { data: ChartPoint[]; riskProfile: RiskProfile; horizon: number }) {
  const [tip, setTip] = useState<TipState | null>(null);
  const color = RISK_HEX[riskProfile];

  if (!data || data.length === 0) return null;

  const W = 840, H = 190;
  const pad = { top: 10, right: 16, bottom: 24, left: 56 };
  const iW = W - pad.left - pad.right;
  const iH = H - pad.top - pad.bottom;
  const maxVal = Math.max(...data.map(d => d.net)) * 1.1;
  const xS = (i: number) => pad.left + (i / (data.length - 1 || 1)) * iW;
  const yS = (v: number) => pad.top + iH - (v / maxVal) * iH;
  const baseline = pad.top + iH;

  const netPts = data.map((d, i) => [xS(i), yS(d.net)] as [number, number]);
  const cntPts = data.map((d, i) => [xS(i), yS(d.contrib)] as [number, number]);
  const toPath = (pts: [number, number][]) =>
    pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  const toArea = (pts: [number, number][]) =>
    toPath(pts) +
    ` L${pts[pts.length - 1][0].toFixed(1)},${baseline} L${pts[0][0].toFixed(1)},${baseline} Z`;

  const fmtY = (v: number) => {
    const n = Math.ceil(v);
    return n >= 1_000_000 ? `€${(n / 1_000_000).toFixed(1)}M` : n >= 1000 ? `€${Math.ceil(n / 1000)}k` : `€${n}`;
  };
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map(f => maxVal * f);
  const step = horizon <= 10 ? 2 : horizon <= 20 ? 5 : 10;
  const xTicks = data.filter(d => d.year % step === 0 || d.year === 1 || d.year === horizon);
  const colW = iW / data.length;

  return (
    <div>
    <div className="relative" style={{ height: 210 }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: '100%', display: 'block' }}>
        <defs>
          <linearGradient id="gNet" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.18" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {yTicks.map((v, i) => (
          <line key={i} x1={pad.left} x2={pad.left + iW} y1={yS(v)} y2={yS(v)} stroke="rgba(37,99,235,0.08)" strokeWidth="1" />
        ))}
        {horizon >= 20 && [10, 20].map(r => {
          const d = data.find(x => x.year === r);
          if (!d) return null;
          const x = xS(data.indexOf(d));
          return <line key={r} x1={x} x2={x} y1={pad.top} y2={baseline} stroke="#cbd5e1" strokeDasharray="3 3" strokeWidth="1" />;
        })}
        <path d={toArea(netPts)} fill="url(#gNet)" />
        <path d={toPath(cntPts)} fill="none" stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="5 4" />
        <path d={toPath(netPts)} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {yTicks.map((v, i) => (
          <text key={i} x={pad.left - 5} y={yS(v) + 4} textAnchor="end" fontSize="10" fill="#5b7a9c">{fmtY(v)}</text>
        ))}
        {xTicks.map(d => (
          <text key={d.year} x={xS(data.indexOf(d))} y={H - 4} textAnchor="middle" fontSize="10" fill="#5b7a9c">{d.year}y</text>
        ))}
        {data.map((d, i) => (
          <rect
            key={i}
            x={xS(i) - colW / 2}
            y={pad.top}
            width={colW}
            height={iH}
            fill="transparent"
            style={{ cursor: 'crosshair' }}
            onMouseEnter={() => setTip({ d, x: xS(i), y: yS(d.net) })}
            onMouseLeave={() => setTip(null)}
          />
        ))}
        {tip && <circle cx={tip.x} cy={tip.y} r="4" fill={color} stroke="white" strokeWidth="2" />}
      </svg>

      {tip && (
        <div
          className="absolute pointer-events-none bg-card border border-border rounded-lg shadow-lg"
          style={{
            left: `${(tip.x / W) * 100}%`,
            top: `${(tip.y / H) * 100}%`,
            transform: 'translate(-50%, -115%)',
            padding: '8px 12px',
            fontSize: 11,
            whiteSpace: 'nowrap',
            zIndex: 10,
          }}
        >
          <div className="font-bold mb-1 text-foreground">Year {tip.d.year}</div>
          <div className="text-muted-foreground">Net value <span style={{ color, fontWeight: 700 }}>{fmtEur(tip.d.net)}</span></div>
          <div className="text-muted-foreground">Principal <span className="font-semibold text-foreground">{fmtEur(tip.d.contrib)}</span></div>
          <div className="text-muted-foreground">Net gain <span className="font-semibold text-emerald-500">{fmtEur(tip.d.net - tip.d.contrib)}</span></div>
        </div>
      )}

    </div>
    <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
      <div className="flex items-center gap-1.5">
        <svg width="20" height="3" style={{ display: 'inline-block' }}>
          <line x1="0" y1="1.5" x2="20" y2="1.5" stroke={color} strokeWidth="2.5" />
        </svg>
        Net portfolio value
      </div>
      <div className="flex items-center gap-1.5">
        <svg width="20" height="3" style={{ display: 'inline-block' }}>
          <line x1="0" y1="1.5" x2="20" y2="1.5" stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="4 3" />
        </svg>
        Principal
      </div>
    </div>
    </div>
  );
}

// ── ProductRow ────────────────────────────────────────────────────────────────

function ProductRow({
  product,
  bucketEur,
  alloc,
  onAllocChange,
}: {
  product: AnyProduct;
  bucketEur: number;
  alloc: number | undefined;
  onAllocChange: (id: string, val: number) => void;
}) {
  const p = product as AnyProduct & {
    tan?: number; couponRate?: number; ticker?: string; ter?: number;
    institution?: string; issuer?: string; maxEligibleAmount?: number;
    minInvestment?: number; taxBenefit?: string; notes?: string;
    suggestedAllocationPct: number;
  };

  const pct = alloc ?? p.suggestedAllocationPct;
  const eurAmt = bucketEur * (pct / 100);
  const isSavings = p.tan !== undefined;
  const isFuture = p.couponRate !== undefined;

  const metricLabel = isSavings
    ? `TAN ${fmtPct(p.tan!)}`
    : isFuture
    ? `${fmtPct(p.couponRate!)} coupon`
    : `${fmtPct(p.expectedAnnualReturn)} p.a.`;

  const subLabel = isSavings
    ? p.institution
    : p.ticker
    ? `${p.ticker} · TER ${fmtPct(p.ter!)}`
    : p.institution || p.issuer;

  const belowMin = isFuture && p.minInvestment && eurAmt < p.minInvestment;
  const aboveMax = isSavings && p.maxEligibleAmount && eurAmt > p.maxEligibleAmount;

  return (
    <div className="px-4 py-2.5 border-b border-border last:border-b-0 flex flex-col gap-1.5">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <a
            href={p.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs font-semibold text-foreground hover:text-teal-600 transition-colors leading-snug"
          >
            {p.name}
            <ExternalLink className="w-2.5 h-2.5 opacity-40 shrink-0" />
          </a>
          <div className="text-[11px] text-muted-foreground mt-0.5">{subLabel}</div>
        </div>
        <div className="text-xs font-bold text-emerald-500 shrink-0">{metricLabel}</div>
      </div>

      <div className="flex items-center gap-1.5">
        <input
          type="number"
          min="0"
          max="100"
          value={pct}
          onChange={e => onAllocChange(p.id, Number(e.target.value))}
          className="w-12 text-right border border-border rounded-md bg-input-background text-xs font-semibold text-foreground px-1.5 py-1 outline-none focus:border-teal-500 focus:bg-card transition-colors"
        />
        <span className="text-[11px] text-muted-foreground">%</span>
        <span className="text-[11px] font-medium text-muted-foreground ml-auto">{fmtEur(eurAmt)}</span>
      </div>

      {p.taxBenefit && (
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-teal-100 text-teal-700 self-start">
          ★ IRS benefit
        </span>
      )}
      {belowMin && (
        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 self-start">
          Min. investment {fmtEur(p.minInvestment!)}
        </span>
      )}
      {aboveMax && (
        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 self-start">
          Max eligible {fmtEur(p.maxEligibleAmount!)}
        </span>
      )}
      {p.notes && (
        <div className="text-[10px] text-muted-foreground leading-relaxed">{p.notes}</div>
      )}
    </div>
  );
}

// ── SeeMoreModal ──────────────────────────────────────────────────────────────

function SeeMoreModal({
  bucketLabel,
  products,
  bucketEur,
  allocations,
  onAllocChange,
  onClose,
}: {
  bucketLabel: string;
  products: AnyProduct[];
  bucketEur: number;
  allocations: Record<string, number>;
  onAllocChange: (id: string, val: number) => void;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-card rounded-xl w-full max-w-md max-h-[80vh] flex flex-col shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <span className="text-sm font-semibold text-foreground">All products — {bucketLabel}</span>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="overflow-y-auto flex-1">
          {products.map(p => (
            <ProductRow
              key={p.id}
              product={p}
              bucketEur={bucketEur}
              alloc={allocations[p.id]}
              onAllocChange={onAllocChange}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ── BucketCard ────────────────────────────────────────────────────────────────

const MAX_VISIBLE = 3;

function BucketCard({
  label,
  color,
  pct,
  eurAmount,
  products,
  allocations,
  onAllocChange,
}: {
  label: string;
  color: string;
  pct: number;
  eurAmount: number;
  products: AnyProduct[];
  allocations: Record<string, number>;
  onAllocChange: (id: string, val: number) => void;
}) {
  const [showModal, setShowModal] = useState(false);
  const visible = products.slice(0, MAX_VISIBLE);
  const hidden = products.slice(MAX_VISIBLE);

  const total = products.reduce((s, p) => {
    const pp = p as AnyProduct & { suggestedAllocationPct: number };
    return s + (allocations[p.id] ?? pp.suggestedAllocationPct);
  }, 0);
  const remaining = 100 - total;

  return (
    <>
      <div className="border border-border rounded-xl bg-card flex flex-col overflow-hidden">
        <div className="px-4 pt-3 pb-3 border-b border-border" style={{ borderTop: `3px solid ${color}` }}>
          <div className="flex items-start justify-between gap-2 mb-1">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{label}</span>
            {remaining !== 0 && (
              <span className="text-[10px] font-semibold text-red-500 bg-red-50 px-1.5 py-0.5 rounded">
                {remaining > 0 ? `${remaining}% left` : `+${Math.abs(remaining)}% over`}
              </span>
            )}
          </div>
          <div className="text-2xl font-bold leading-none mb-0.5" style={{ color }}>{pct}%</div>
          <div className="text-[11px] text-muted-foreground">{fmtEur(eurAmount)} to invest</div>
        </div>

        <div className="flex-1">
          {products.length === 0 ? (
            <div className="px-4 py-5 text-xs text-muted-foreground text-center">No products in this bucket</div>
          ) : (
            visible.map(p => (
              <ProductRow
                key={p.id}
                product={p}
                bucketEur={eurAmount}
                alloc={allocations[p.id]}
                onAllocChange={onAllocChange}
              />
            ))
          )}
        </div>

        {hidden.length > 0 && (
          <button
            onClick={() => setShowModal(true)}
            className="w-full py-2.5 px-4 border-t border-border bg-muted text-[11px] font-semibold text-muted-foreground hover:bg-muted/70 hover:text-foreground transition-colors text-center"
          >
            See {hidden.length} more product{hidden.length > 1 ? 's' : ''}
          </button>
        )}
      </div>

      {showModal && (
        <SeeMoreModal
          bucketLabel={label}
          products={products}
          bucketEur={eurAmount}
          allocations={allocations}
          onAllocChange={onAllocChange}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}

// ── InvestPage ────────────────────────────────────────────────────────────────

export function Invest() {
  const [amount, setAmount] = useState<string>('');
  const [riskProfile, setRiskProfile] = useState<RiskProfile>('balanced');
  const [age, setAge] = useState<string>('');
  const [horizon, setHorizon] = useState(10);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [allocations, setAllocations] = useState<Record<string, number>>({});

  const ageSuggestion = useMemo(() => {
    const n = parseInt(age);
    if (!n) return null;
    if (n < 35) return { profile: 'growth' as RiskProfile, label: 'Growth' };
    if (n <= 50) return { profile: 'balanced' as RiskProfile, label: 'Balanced' };
    return { profile: 'safe' as RiskProfile, label: 'Safe' };
  }, [age]);

  const showBanner = ageSuggestion && !bannerDismissed && ageSuggestion.profile !== riskProfile;
  const splits = RISK_SPLITS[riskProfile];
  const buckets = useMemo(() => getBuckets(), []);
  const parsedAmount = parseFloat(amount) || 0;
  const hasAmount = parsedAmount > 0;

  const handleAllocChange = useCallback((id: string, val: number) => {
    setAllocations(prev => ({ ...prev, [id]: val }));
  }, []);

  const allProducts = useMemo(
    () => buildAllProducts(buckets, allocations, splits),
    [buckets, allocations, splits],
  );
  const fv = useMemo(() => calcFV(parsedAmount, horizon, allProducts), [parsedAmount, horizon, allProducts]);
  const chartData = useMemo(() => buildChartData(parsedAmount, horizon, allProducts), [parsedAmount, horizon, allProducts]);

  const bucketDefs = [
    { key: 'savings',  label: 'Savings Account',        pct: splits.savings,  color: BUCKET_COLORS.savings,  products: buckets.savings  },
    { key: 'highRisk', label: 'High Risk / High Return', pct: splits.highRisk, color: BUCKET_COLORS.highRisk, products: buckets.highRisk },
    { key: 'bonds',    label: 'Futures & Bonds',         pct: splits.bonds,    color: BUCKET_COLORS.bonds,    products: buckets.bonds    },
  ];

  const updatedAt = (productData as { updatedAt: string }).updatedAt;
  const freshnessLabel = new Date(updatedAt).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Header — matches Dashboard pattern */}
      <header className="border-b border-border bg-card sticky top-0 z-40">
        <div className="px-4 lg:px-8 py-3 lg:py-5 flex items-center justify-between">
          <h1 className="font-semibold">Investment Simulator</h1>
          <span className="text-xs text-muted-foreground hidden sm:block">Product data: {freshnessLabel}</span>
        </div>
      </header>

      <div className="px-4 lg:px-8 py-6 pb-16">
        {/* Country notice */}
        <div className="flex items-center gap-2 bg-card border border-border rounded-xl px-4 py-2.5 mb-5 text-xs text-muted-foreground">
          🇵🇹 <span>Options shown are available in <strong className="text-foreground">Portugal</strong>. More countries coming soon.</span>
        </div>

        {/* Step 1 — Setup */}
        <div className="bg-card border border-border rounded-xl mb-4 overflow-hidden">
          <div className="px-5 py-3.5 border-b border-border flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground">1</div>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Setup</span>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Amount */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-muted-foreground">Savings amount</label>
                <div className="flex items-center border-[1.5px] border-border rounded-xl bg-input-background overflow-hidden focus-within:border-teal-500 focus-within:bg-card transition-colors">
                  <span className="px-3 text-base font-semibold text-muted-foreground h-11 flex items-center border-r border-border">€</span>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    className="flex-1 border-none outline-none px-3 text-xl font-bold text-foreground bg-transparent w-full placeholder:text-[#c5d8ea]"
                  />
                </div>
              </div>

              {/* Risk profile */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-muted-foreground">Risk profile</label>
                <div className="flex bg-muted rounded-xl p-[3px] gap-[2px]">
                  {(['safe', 'balanced', 'growth'] as RiskProfile[]).map(r => (
                    <button
                      key={r}
                      onClick={() => setRiskProfile(r)}
                      className={`flex-1 py-2 px-2 rounded-lg text-xs font-medium transition-all ${
                        riskProfile === r
                          ? 'bg-card shadow font-semibold ' +
                            (r === 'safe' ? 'text-teal-700' : r === 'balanced' ? 'text-blue-700' : 'text-violet-700')
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {r.charAt(0).toUpperCase() + r.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Age */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  Your age
                  <span className="text-[10px] font-medium bg-muted text-muted-foreground px-1.5 py-0.5 rounded">optional</span>
                </label>
                <div className="border-[1.5px] border-border rounded-xl bg-input-background overflow-hidden focus-within:border-teal-500 focus-within:bg-card transition-colors">
                  <input
                    type="number"
                    min="18"
                    max="90"
                    placeholder="e.g. 34"
                    value={age}
                    onChange={e => setAge(e.target.value)}
                    className="w-full border-none outline-none px-3 h-11 text-sm font-medium text-foreground bg-transparent placeholder:text-muted-foreground/50"
                  />
                </div>
              </div>

              {/* Horizon */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-muted-foreground">Time horizon</label>
                <div className="flex items-center gap-3 mt-0.5">
                  <input
                    type="range"
                    min="1"
                    max="30"
                    step="1"
                    value={horizon}
                    onChange={e => setHorizon(Number(e.target.value))}
                    className="flex-1 accent-teal-500"
                  />
                  <span className="text-sm font-semibold text-foreground min-w-[46px] text-right">
                    {horizon} yr{horizon > 1 ? 's' : ''}
                  </span>
                </div>
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>1 yr</span><span>30 yrs</span>
                </div>
              </div>
            </div>

            {/* Age banner */}
            {showBanner && (
              <div className="flex items-center gap-2.5 bg-blue-50 border border-blue-200 rounded-xl px-4 py-2.5 mt-4 text-xs text-blue-800">
                <span className="text-sm">💡</span>
                <span className="flex-1">
                  Based on your age, we suggest <strong>{ageSuggestion!.label}</strong>
                </span>
                <div className="flex gap-1.5 shrink-0">
                  <button
                    onClick={() => setBannerDismissed(true)}
                    className="text-[11px] text-muted-foreground px-2 py-1 rounded-md hover:bg-muted transition-colors"
                  >
                    Dismiss
                  </button>
                  <button
                    onClick={() => { setRiskProfile(ageSuggestion!.profile); setBannerDismissed(true); }}
                    className="text-[11px] font-semibold px-2.5 py-1 rounded-md bg-teal-500 text-white hover:bg-teal-600 transition-colors"
                  >
                    Apply
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Steps 2 & 3 */}
        {!hasAmount ? (
          <div className="bg-card border border-border rounded-xl">
            <div className="flex flex-col items-center py-14 px-6 text-center">
              <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mb-4">
                <TrendingUp className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-semibold text-foreground mb-1.5">Enter a savings amount to get started</p>
              <p className="text-xs text-muted-foreground">Your personalised allocation and projection will appear here.</p>
            </div>
          </div>
        ) : (
          <>
            {/* Step 2 — Allocation */}
            <div className="bg-card border border-border rounded-xl mb-4 overflow-hidden">
              <div className="px-5 py-3.5 border-b border-border flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground">2</div>
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Allocation</span>
              </div>
              <div className="p-5">
                {/* Allocation bar */}
                <div className="mb-5">
                  <div className="h-2 rounded-full overflow-hidden flex mb-2.5">
                    {bucketDefs.map(b => (
                      <div
                        key={b.key}
                        style={{ flex: b.pct, background: b.color, transition: 'flex 0.4s ease' }}
                      />
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-4">
                    {bucketDefs.map(b => (
                      <div key={b.key} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                        <div className="w-2 h-2 rounded-sm shrink-0" style={{ background: b.color }} />
                        {b.label} · {b.pct}%
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bucket cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                  {bucketDefs.map(b => (
                    <BucketCard
                      key={b.key}
                      label={b.label}
                      color={b.color}
                      pct={b.pct}
                      eurAmount={parsedAmount * (b.pct / 100)}
                      products={b.products}
                      allocations={allocations}
                      onAllocChange={handleAllocChange}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Step 3 — Projection */}
            <div className="bg-card border border-border rounded-xl mb-4 overflow-hidden">
              <div className="px-5 py-3.5 border-b border-border flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground">3</div>
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Projection</span>
              </div>
              <div className="p-5">
                {fv && (
                  <>
                    {/* Hero */}
                    <div className="text-center py-5 mb-4">
                      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-2.5">
                        Estimated net value after {horizon} year{horizon > 1 ? 's' : ''}
                      </p>
                      <p className="text-5xl font-bold text-foreground tracking-tight leading-none">
                        {fmtEur(fv.netFV)}
                      </p>
                      <p className="mt-2 text-sm font-medium flex items-center justify-center gap-1.5">
                        <span className="text-emerald-500 font-semibold">+ {fmtEur(fv.netReturn)} net return</span>
                        <span className="text-muted-foreground">· after 28% tax</span>
                      </p>
                    </div>

                    {/* Comparison row */}
                    <div className="flex gap-2.5 mb-5">
                      {(['safe', 'balanced', 'growth'] as RiskProfile[]).map(r => {
                        const c = calcComparisonFV(parsedAmount, horizon, r);
                        const isActive = r === riskProfile;
                        return (
                          <button
                            key={r}
                            onClick={() => setRiskProfile(r)}
                            className="flex-1 border-[1.5px] border-border rounded-xl px-3.5 py-3 flex items-center gap-2.5 transition-colors text-left hover:border-opacity-60"
                            style={
                              isActive
                                ? { borderColor: RISK_HEX[r], background: `color-mix(in srgb, ${RISK_HEX[r]} 5%, white)` }
                                : {}
                            }
                          >
                            <div className="w-2 h-2 rounded-full shrink-0" style={{ background: RISK_HEX[r] }} />
                            <div>
                              <div className="text-[11px] text-muted-foreground mb-0.5 capitalize">{r}</div>
                              <div
                                className="text-base font-bold tracking-tight"
                                style={{ color: isActive ? RISK_HEX[r] : undefined }}
                              >
                                {c ? fmtEur(c.netFV) : '—'}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {/* Horizon slider (repeated) */}
                    <div className="flex flex-col gap-1.5 mb-5">
                      <label className="text-xs font-medium text-muted-foreground">Adjust horizon</label>
                      <div className="flex items-center gap-3">
                        <input
                          type="range"
                          min="1"
                          max="30"
                          step="1"
                          value={horizon}
                          onChange={e => setHorizon(Number(e.target.value))}
                          className="flex-1 accent-teal-500"
                        />
                        <span className="text-sm font-semibold text-foreground min-w-[46px] text-right">
                          {horizon} yr{horizon > 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>

                    {/* Chart */}
                    <SimChart data={chartData} riskProfile={riskProfile} horizon={horizon} />

                    <p className="text-[10px] text-muted-foreground mt-3 leading-relaxed">
                      * PPR tax benefit not included in projection. May further reduce your tax bill.
                    </p>
                  </>
                )}
              </div>
            </div>
          </>
        )}

        {/* Disclaimer */}
        <p className="text-[11px] text-muted-foreground leading-relaxed border-t border-border pt-5 mt-2">
          This simulation is for informational purposes only and does not constitute financial advice.
          Expected returns are based on historical data and are not guaranteed. Past performance is not
          indicative of future results. The 28% tax rate applied is a general estimate; your actual tax
          liability may vary. Consult a licensed financial advisor before making any investment decisions.
        </p>
      </div>
    </div>
  );
}
