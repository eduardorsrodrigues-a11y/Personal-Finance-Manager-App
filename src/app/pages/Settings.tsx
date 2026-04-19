import { useState, useEffect } from 'react';
import { Save, Loader2 } from 'lucide-react';
import { useUserSettings, type RiskProfileSetting } from '../context/UserSettingsContext';
import { useToast } from '../context/ToastContext';

const RISK_OPTIONS: { value: RiskProfileSetting; label: string; desc: string; color: string }[] = [
  { value: 'safe',     label: 'Safe',     desc: 'Mostly savings accounts & bonds',   color: '#0f766e' },
  { value: 'balanced', label: 'Balanced', desc: 'Mix of savings, ETFs & bonds',       color: '#1d4ed8' },
  { value: 'growth',   label: 'Growth',   desc: 'Higher allocation to ETFs & PPRs',  color: '#7c3aed' },
];

export function Settings() {
  const { settings, loading, saveSettings } = useUserSettings();
  const { showToast } = useToast();

  const [name, setName] = useState('');
  const [birthday, setBirthday] = useState('');
  const [riskProfile, setRiskProfile] = useState<RiskProfileSetting>('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loading) {
      setName(settings.name);
      setBirthday(settings.birthday);
      setRiskProfile(settings.riskProfile);
    }
  }, [loading, settings]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveSettings({ name, birthday, riskProfile });
      showToast('Settings saved');
    } catch {
      showToast('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const inputClass = 'w-full px-3 py-2.5 text-sm bg-input-background border border-border rounded-xl outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors';

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card sticky top-0 z-40">
        <div className="px-4 lg:px-8 py-3 lg:py-5 flex items-center justify-between">
          <h1 className="text-xl font-semibold">Settings</h1>
          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-500 hover:bg-teal-600 text-white text-sm font-medium transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save
          </button>
        </div>
      </header>

      <div className="px-4 lg:px-8 py-6 max-w-xl">

        {/* Profile */}
        <div className="bg-card border border-border rounded-xl mb-4 overflow-hidden">
          <div className="px-5 py-3.5 border-b border-border">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Profile</p>
          </div>
          <div className="p-5 flex flex-col gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Full name</label>
              {loading ? (
                <div className="h-10 bg-muted rounded-xl animate-pulse" />
              ) : (
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Your name"
                  className={inputClass}
                />
              )}
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Birthday</label>
              {loading ? (
                <div className="h-10 bg-muted rounded-xl animate-pulse" />
              ) : (
                <input
                  type="date"
                  value={birthday}
                  onChange={e => setBirthday(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  className={inputClass}
                />
              )}
              <p className="text-xs text-muted-foreground mt-1.5">Used to auto-suggest a risk profile in the Investment Simulator.</p>
            </div>
          </div>
        </div>

        {/* Investment preferences */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-border">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Investment preferences</p>
          </div>
          <div className="p-5">
            <label className="text-xs font-medium text-muted-foreground mb-3 block">Default risk profile</label>
            {loading ? (
              <div className="h-24 bg-muted rounded-xl animate-pulse" />
            ) : (
              <div className="flex flex-col gap-2">
                {RISK_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setRiskProfile(opt.value)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl border-[1.5px] text-left transition-colors ${
                      riskProfile === opt.value ? 'border-current' : 'border-border hover:border-muted-foreground/30'
                    }`}
                    style={riskProfile === opt.value ? { borderColor: opt.color, background: `color-mix(in srgb, ${opt.color} 5%, white)` } : {}}
                  >
                    <div className="w-3 h-3 rounded-full shrink-0" style={{ background: opt.color }} />
                    <div>
                      <div className="text-sm font-semibold text-foreground">{opt.label}</div>
                      <div className="text-xs text-muted-foreground">{opt.desc}</div>
                    </div>
                    {riskProfile === opt.value && (
                      <div className="ml-auto w-4 h-4 rounded-full flex items-center justify-center" style={{ background: opt.color }}>
                        <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1.5 4L3.5 6L6.5 2" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </div>
                    )}
                  </button>
                ))}
                {riskProfile !== '' && (
                  <button onClick={() => setRiskProfile('')} className="text-xs text-muted-foreground hover:text-foreground underline self-start mt-1">
                    Clear preference
                  </button>
                )}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-3">Pre-selected in the Investment Simulator when you visit.</p>
          </div>
        </div>

      </div>
    </div>
  );
}
