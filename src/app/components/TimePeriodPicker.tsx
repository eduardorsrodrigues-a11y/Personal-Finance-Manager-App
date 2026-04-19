import { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Calendar } from 'lucide-react';
import { formatPeriodLabel } from '../utils/dateUtils';

type Period = 'all' | 'this-year' | 'this-month' | 'custom';

const PERIODS: { value: Period; label: string }[] = [
  { value: 'all',        label: 'All time'   },
  { value: 'this-year',  label: 'This year'  },
  { value: 'this-month', label: 'This month' },
  { value: 'custom',     label: 'Custom'     },
];

function activePeriod(selected: string): Period {
  if (!selected || selected === 'all') return 'all';
  if (selected === 'this-year') return 'this-year';
  if (selected === 'this-month') return 'this-month';
  if (selected.startsWith('custom:')) return 'custom';
  return 'all';
}

interface Props {
  value: string;
  onChange: (value: string) => void;
  /** Optional extra class on the pill container */
  className?: string;
}

export function TimePeriodPicker({ value, onChange, className = '' }: Props) {
  const [showModal, setShowModal] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const current = activePeriod(value);

  // Pre-fill modal dates if already in custom mode
  const openModal = () => {
    if (value.startsWith('custom:')) {
      const [, s, e] = value.split(':');
      setStartDate(s);
      setEndDate(e);
    } else {
      setStartDate('');
      setEndDate('');
    }
    setShowModal(true);
  };

  const handlePill = (p: Period) => {
    if (p === 'custom') { openModal(); return; }
    onChange(p);
  };

  const applyCustom = () => {
    if (!startDate || !endDate) return;
    onChange(`custom:${startDate}:${endDate}`);
    setShowModal(false);
  };

  const pillClass = (p: Period) =>
    `px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
      current === p
        ? 'bg-primary text-primary-foreground'
        : 'bg-muted text-muted-foreground hover:bg-muted/80'
    }`;

  const customLabel =
    current === 'custom' && value.startsWith('custom:')
      ? formatPeriodLabel(value)
      : 'Custom';

  return (
    <>
      <div className={`flex gap-1.5 flex-wrap ${className}`}>
        {PERIODS.map(({ value: p, label }) => (
          <button
            key={p}
            onClick={() => handlePill(p)}
            className={pillClass(p)}
          >
            {p === 'custom' ? customLabel : label}
          </button>
        ))}
      </div>

      {/* Date range modal — rendered via portal to escape transformed parent stacking contexts */}
      {showModal && createPortal(
        <div
          className="fixed inset-0 z-[300] flex items-center justify-center bg-black/40"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-card w-full max-w-sm mx-4 rounded-2xl shadow-2xl border border-border overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <p className="font-semibold text-sm">Custom date range</p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="px-5 py-5 flex flex-col gap-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Start date</label>
                <input
                  type="date"
                  value={startDate}
                  max={endDate || undefined}
                  onChange={e => setStartDate(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm bg-input-background border border-border rounded-xl outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">End date</label>
                <input
                  type="date"
                  value={endDate}
                  min={startDate || undefined}
                  onChange={e => setEndDate(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm bg-input-background border border-border rounded-xl outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-3 px-5 pb-5">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={applyCustom}
                disabled={!startDate || !endDate}
                className="flex-1 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-600 text-white text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Apply
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
