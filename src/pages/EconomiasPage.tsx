import { useState, useMemo } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { SAVINGS_CATEGORIES } from '../types';
import { Modal } from '../components/ui/Modal';
import { Icon } from '../components/ui/Icon';
import { useToast } from '../components/ui/Toast';
import type { SavingEntry } from '../types';

const MONTHS_SHORT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

// Category config — icon + color matching design's FX_ECO_CATEGORIES
const ECO_CAT_CFG: Record<string, { icon: string; color: string; label: string }> = {
  acoes:   { icon: 'trending_up',      color: '#1565C0', label: 'Ações' },
  fundos:  { icon: 'account_balance',  color: '#7B1FA2', label: 'Fundos' },
  fiis:    { icon: 'apartment',        color: '#00838F', label: 'FIIs' },
  cripto:  { icon: 'currency_bitcoin', color: '#E65100', label: 'Criptomoedas' },
  reserva: { icon: 'shield',           color: '#2E7D32', label: 'Reserva de Emergência' },
  cdb100:  { icon: 'savings',          color: '#5D4037', label: 'CDB 100%' },
  cdb120:  { icon: 'savings',          color: '#455A64', label: 'CDB 120%' },
};

function getCatCfg(id: string, label: string) {
  return ECO_CAT_CFG[id] ?? { icon: 'savings', color: '#006A60', label };
}

function brlInt(n: number) { return Math.round(n).toLocaleString('pt-BR'); }
function brlFull(n: number) {
  return n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const inputStyle = {
  background: 'var(--fx-surface-container)',
  border: '1px solid var(--fx-outline-variant)',
  color: 'var(--fx-on-surface)',
};

// ─── Custom SVG Patrimônio Chart ──────────────────────────────
function PatrimonioChart({ allCategories, savings, currentMonth, currentYear, visible, setVisible }: {
  allCategories: { id: string; label: string; emoji: string }[];
  savings: SavingEntry[];
  currentMonth: number;
  currentYear: number;
  visible: Record<string, boolean>;
  setVisible: (v: Record<string, boolean>) => void;
}) {
  const W = 340; const H = 150;
  const PAD_L = 4; const PAD_R = 4; const PAD_T = 12; const PAD_B = 22;
  const innerW = W - PAD_L - PAD_R;
  const innerH = H - PAD_T - PAD_B;

  // Build 6-month history
  const months = useMemo(() => {
    const result: { month: number; year: number; label: string }[] = [];
    for (let i = 5; i >= 0; i--) {
      let m = currentMonth - i; let y = currentYear;
      while (m <= 0) { m += 12; y--; }
      result.push({ month: m, year: y, label: MONTHS_SHORT[m - 1] });
    }
    return result;
  }, [currentMonth, currentYear]);

  const totalSeries = months.map(({ month, year }) =>
    savings.filter(s => s.month === month && s.year === year).reduce((sum, s) => sum + s.amount, 0)
  );

  const catSeries = allCategories.map(cat => ({
    key: cat.id,
    values: months.map(({ month, year }) =>
      savings.find(s => s.category === cat.id && s.month === month && s.year === year)?.amount ?? 0
    ),
  }));

  // Build visible series
  const activeSeries: { key: string; color: string; thick?: boolean; values: number[] }[] = [];
  if (visible['total']) activeSeries.push({ key: 'total', color: 'var(--fx-on-surface)', thick: true, values: totalSeries });
  catSeries.forEach(s => {
    if (visible[s.key]) {
      const cfg = getCatCfg(s.key, s.key);
      activeSeries.push({ key: s.key, color: cfg.color, values: s.values });
    }
  });

  const allVals = activeSeries.flatMap(s => s.values).filter(v => v > 0);
  const yMin = allVals.length ? Math.min(...allVals) * 0.95 : 0;
  const yMax = allVals.length ? Math.max(...allVals) * 1.05 : 1;
  const span = Math.max(1, yMax - yMin);
  const n = months.length;
  const xAt = (i: number) => PAD_L + innerW * (n === 1 ? 0.5 : i / (n - 1));
  const yAt = (v: number) => PAD_T + innerH - ((v - yMin) / span) * innerH;

  return (
    <div className="mx-4 mt-4 rounded-2xl overflow-hidden" style={{ background: 'var(--fx-surface-container-low)' }}>
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <h3 className="text-sm font-medium" style={{ color: 'var(--fx-on-surface)' }}>Evolução do patrimônio</h3>
        <span className="text-xs" style={{ color: 'var(--fx-on-surface-variant)' }}>6 meses</span>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: H, display: 'block' }}>
        {/* Grid lines */}
        {[0, 0.33, 0.67, 1].map(t => (
          <line key={t}
            x1={PAD_L} x2={W - PAD_R}
            y1={PAD_T + innerH * t} y2={PAD_T + innerH * t}
            stroke="var(--fx-outline-variant)"
            strokeDasharray={t === 0 ? '0' : '2 4'}
            strokeWidth="1" opacity="0.5"
          />
        ))}
        {/* X labels */}
        {months.map((m, i) => (
          <text key={i} x={xAt(i)} y={H - 5}
            textAnchor="middle" fontSize="9"
            fill="var(--fx-on-surface-variant)"
          >{m.label}</text>
        ))}
        {/* Series */}
        {activeSeries.map(s => {
          const path = s.values
            .map((v, i) => `${i === 0 ? 'M' : 'L'} ${xAt(i).toFixed(1)} ${yAt(v).toFixed(1)}`)
            .join(' ');
          return (
            <g key={s.key}>
              <path d={path} fill="none" stroke={s.color}
                strokeWidth={s.thick ? 2.5 : 1.8}
                strokeLinecap="round" strokeLinejoin="round" />
              {s.values.map((v, i) => (
                <circle key={i} cx={xAt(i)} cy={yAt(v)}
                  r={i === n - 1 ? 4 : 2.5}
                  fill={s.color} />
              ))}
            </g>
          );
        })}
      </svg>

      {/* Legend toggles */}
      <div className="flex flex-wrap gap-2 px-4 pb-4">
        <button
          onClick={() => setVisible({ ...visible, total: !visible['total'] })}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all"
          style={visible['total'] ? {
            background: 'var(--fx-on-surface)', color: 'var(--fx-surface)',
          } : {
            background: 'var(--fx-surface-container)',
            color: 'var(--fx-on-surface-variant)',
            border: '1px solid var(--fx-outline-variant)',
          }}
        >
          <span className="w-2 h-2 rounded-full inline-block flex-shrink-0" style={{ background: 'var(--fx-on-surface)' }} />
          Total
        </button>
        {allCategories.map(cat => {
          const cfg = getCatCfg(cat.id, cat.label);
          const on = !!visible[cat.id];
          return (
            <button key={cat.id}
              onClick={() => setVisible({ ...visible, [cat.id]: !on })}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all"
              style={on ? {
                background: cfg.color, color: '#fff',
              } : {
                background: 'var(--fx-surface-container)',
                color: 'var(--fx-on-surface-variant)',
                border: '1px solid var(--fx-outline-variant)',
              }}
            >
              <span className="w-2 h-2 rounded-full inline-block flex-shrink-0" style={{ background: cfg.color }} />
              {cat.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Forms ────────────────────────────────────────────────────

function EditAmountForm({ saving, onSubmit, onCancel }: {
  saving: SavingEntry;
  onSubmit: (amount: number) => void;
  onCancel: () => void;
}) {
  const cfg = getCatCfg(saving.category, saving.categoryLabel);
  const [amount, setAmount] = useState(saving.amount.toString());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(amount.replace(',', '.'));
    if (isNaN(parsed) || parsed < 0) return;
    onSubmit(parsed);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center gap-3 rounded-xl px-4 py-3" style={{ background: 'var(--fx-surface-container)' }}>
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: cfg.color + '28', color: cfg.color }}
        >
          <Icon name={cfg.icon} size={22} />
        </div>
        <span className="text-sm font-medium" style={{ color: 'var(--fx-on-surface)' }}>{saving.categoryLabel}</span>
      </div>
      <div>
        <label className="block text-xs font-semibold uppercase mb-1" style={{ color: 'var(--fx-on-surface-variant)' }}>
          Saldo atual (R$)
        </label>
        <input
          type="number" step="0.01" min="0" value={amount} autoFocus
          onChange={e => setAmount(e.target.value)}
          className="w-full py-3 px-3 rounded-xl text-xl font-bold outline-none"
          style={inputStyle}
        />
      </div>
      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onCancel}
          className="flex-1 py-3 rounded-full text-sm font-medium"
          style={{ border: '1px solid var(--fx-outline-variant)', color: 'var(--fx-on-surface)' }}>
          Cancelar
        </button>
        <button type="submit"
          className="flex-1 py-3 rounded-full text-sm font-semibold"
          style={{ background: 'var(--fx-primary)', color: 'var(--fx-on-primary)' }}>
          Salvar
        </button>
      </div>
    </form>
  );
}

function SavingsForm({ month, year, existingCategories, allCategories, onSubmit, onCancel }: {
  month: number; year: number;
  existingCategories: SavingEntry[];
  allCategories: { id: string; label: string; emoji: string }[];
  onSubmit: (data: Omit<SavingEntry, 'id' | 'userId'>) => void;
  onCancel: () => void;
}) {
  const [category, setCategory] = useState(SAVINGS_CATEGORIES[0].id);
  const [customCategory, setCustomCategory] = useState('');
  const [isCustom, setIsCustom] = useState(false);
  const [amount, setAmount] = useState(() => {
    const existing = existingCategories.find(s => s.category === SAVINGS_CATEGORIES[0].id);
    return existing?.amount.toString() ?? '';
  });

  const selectedCat = isCustom ? customCategory : category;
  const catLabel = isCustom ? customCategory : (allCategories.find(c => c.id === category)?.label ?? category);

  const handleCategoryChange = (id: string) => {
    setCategory(id);
    const existing = existingCategories.find(s => s.category === id);
    setAmount(existing?.amount.toString() ?? '');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(amount.replace(',', '.'));
    if (isNaN(parsed) || parsed < 0 || !selectedCat) return;
    onSubmit({ category: selectedCat, categoryLabel: catLabel, amount: parsed, month, year });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-semibold uppercase mb-1.5" style={{ color: 'var(--fx-on-surface-variant)' }}>
          Categoria
        </label>
        <div className="flex flex-wrap gap-2">
          {SAVINGS_CATEGORIES.map(cat => {
            const cfg = getCatCfg(cat.id, cat.label);
            const sel = !isCustom && category === cat.id;
            return (
              <button key={cat.id} type="button"
                onClick={() => { setIsCustom(false); handleCategoryChange(cat.id); }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all"
                style={{
                  background: sel ? 'var(--fx-secondary-container)' : 'var(--fx-surface-container)',
                  color: sel ? 'var(--fx-on-secondary-container)' : 'var(--fx-on-surface-variant)',
                }}>
                <Icon name={cfg.icon} size={14} />
                {cat.label}
              </button>
            );
          })}
          <button type="button" onClick={() => setIsCustom(true)}
            className="px-3 py-1.5 rounded-full text-sm font-medium transition-all"
            style={{
              background: isCustom ? 'var(--fx-secondary-container)' : 'var(--fx-surface-container)',
              color: isCustom ? 'var(--fx-on-secondary-container)' : 'var(--fx-on-surface-variant)',
            }}>
            + Personalizada
          </button>
        </div>
        {isCustom && (
          <input value={customCategory} onChange={e => setCustomCategory(e.target.value)}
            placeholder="Nome da categoria"
            className="mt-2 w-full py-2.5 px-3 rounded-xl text-sm outline-none"
            style={inputStyle} />
        )}
      </div>
      <div>
        <label className="block text-xs font-semibold uppercase mb-1" style={{ color: 'var(--fx-on-surface-variant)' }}>
          Saldo atual (R$)
        </label>
        <p className="text-xs mb-1.5" style={{ color: 'var(--fx-on-surface-variant)' }}>
          Informe o total investido nesta categoria hoje.
        </p>
        <input type="number" step="0.01" min="0" value={amount} autoFocus
          onChange={e => setAmount(e.target.value)} placeholder="0,00"
          className="w-full py-3 px-3 rounded-xl text-xl font-bold outline-none"
          style={inputStyle} />
      </div>
      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onCancel}
          className="flex-1 py-3 rounded-full text-sm font-medium"
          style={{ border: '1px solid var(--fx-outline-variant)', color: 'var(--fx-on-surface)' }}>
          Cancelar
        </button>
        <button type="submit"
          className="flex-1 py-3 rounded-full text-sm font-semibold"
          style={{ background: 'var(--fx-primary)', color: 'var(--fx-on-primary)' }}>
          Salvar
        </button>
      </div>
    </form>
  );
}

// ─── Main page ────────────────────────────────────────────────

export function EconomiasPage() {
  const { savings, currentMonth, currentYear, addSaving, updateSaving, deleteSaving, user } = useApp();
  const toast = useToast();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSaving, setEditingSaving] = useState<SavingEntry | null>(null);
  const [visible, setVisible] = useState<Record<string, boolean>>({ total: true });

  const allCategories = useMemo(() => {
    const cats = new Map<string, string>();
    SAVINGS_CATEGORIES.forEach(c => cats.set(c.id, c.label));
    savings.forEach(s => { if (!cats.has(s.category)) cats.set(s.category, s.categoryLabel); });
    return Array.from(cats.entries()).map(([id, label]) => ({
      id, label, emoji: SAVINGS_CATEGORIES.find(c => c.id === id)?.emoji ?? '💰',
    }));
  }, [savings]);

  const currentMonthSavings = savings.filter(s => s.month === currentMonth && s.year === currentYear);
  const previousMonthSavings = useMemo(() => {
    const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;
    return savings.filter(s => s.month === prevMonth && s.year === prevYear);
  }, [savings, currentMonth, currentYear]);

  const totalCurrent = currentMonthSavings.reduce((s, sv) => s + sv.amount, 0);
  const totalPrevious = previousMonthSavings.reduce((s, sv) => s + sv.amount, 0);
  const totalDelta = totalCurrent - totalPrevious;
  const deltaPct = totalPrevious > 0 ? (totalDelta / totalPrevious) * 100 : 0;

  const getCatDelta = (catId: string) => {
    const curr = currentMonthSavings.find(s => s.category === catId)?.amount ?? 0;
    const prev = previousMonthSavings.find(s => s.category === catId)?.amount ?? 0;
    return curr - prev;
  };

  // Next reminder date
  const nextReminder = (() => {
    const d = user.savingsReminderDay;
    const now = new Date(currentYear, currentMonth - 1, 1);
    const next = new Date(now.getFullYear(), now.getMonth() + 1, d);
    return `${String(d).padStart(2, '0')}/${String(next.getMonth() + 1).padStart(2, '0')}`;
  })();

  return (
    <div className="flex flex-col pb-6">

      {/* ── Hero card ─── */}
      <div
        className="mx-4 mt-3 rounded-3xl p-6 relative overflow-hidden"
        style={{ background: 'var(--fx-tertiary-container)', color: 'var(--fx-on-tertiary-container)' }}
      >
        <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full opacity-10 border-4" style={{ borderColor: 'currentColor' }} />
        <div className="relative z-10">
          <div className="text-[11px] font-medium uppercase tracking-widest opacity-80 mb-1">Patrimônio total</div>
          <div style={{ font: '400 40px/48px Roboto', letterSpacing: '-0.01em' }}>
            <span className="text-lg opacity-60 mr-1">R$</span>{brlInt(totalCurrent)}
          </div>
          <div className="mt-2">
            <span
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold"
              style={{
                background: totalDelta >= 0 ? 'var(--fx-green-bg)' : 'var(--fx-red-bg)',
                color: totalDelta >= 0 ? 'var(--fx-green-fg)' : 'var(--fx-red-fg)',
              }}
            >
              <Icon name={totalDelta >= 0 ? 'trending_up' : 'trending_down'} size={13} fill={1} />
              {totalDelta >= 0 ? '+' : '−'} R$ {brlInt(Math.abs(totalDelta))} · {deltaPct >= 0 ? '+' : ''}{deltaPct.toFixed(1)}% no mês
            </span>
          </div>
        </div>
      </div>

      {/* ── Chart ─── */}
      <PatrimonioChart
        allCategories={allCategories}
        savings={savings}
        currentMonth={currentMonth}
        currentYear={currentYear}
        visible={visible}
        setVisible={setVisible}
      />

      {/* ── Section header ─── */}
      <div className="flex items-baseline justify-between px-5 pt-5 pb-2">
        <h2 className="text-base font-medium" style={{ color: 'var(--fx-on-surface)' }}>Por categoria</h2>
        <button onClick={() => setShowAddModal(true)} className="text-sm font-medium" style={{ color: 'var(--fx-primary)' }}>
          Atualizar
        </button>
      </div>

      {/* ── Category list ─── */}
      {currentMonthSavings.length === 0 ? (
        <div className="text-center py-12 text-sm" style={{ color: 'var(--fx-on-surface-variant)' }}>
          <p className="text-3xl mb-2">💼</p>
          <p>Nenhum dado de investimentos este mês.</p>
          <p className="text-xs mt-1 opacity-75">Registre seus saldos atuais em cada categoria.</p>
          <button onClick={() => setShowAddModal(true)} className="mt-3 font-medium" style={{ color: 'var(--fx-primary)' }}>
            + Registrar agora
          </button>
        </div>
      ) : (
        <div className="mx-4 rounded-2xl overflow-hidden" style={{ background: 'var(--fx-surface-container-low)' }}>
          {currentMonthSavings.map((saving, i) => {
            const cfg = getCatCfg(saving.category, saving.categoryLabel);
            const delta = getCatDelta(saving.category);
            const pct = previousMonthSavings.find(s => s.category === saving.category)?.amount;
            const deltaPctCat = pct && pct > 0 ? (delta / pct) * 100 : 0;
            return (
              <div
                key={saving.id}
                className="flex items-center gap-3.5 px-4 py-3.5"
                style={{ borderTop: i > 0 ? '1px solid var(--fx-surface-container)' : undefined }}
              >
                {/* Color-mixed glyph */}
                <div
                  className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
                  style={{ background: cfg.color + '28', color: cfg.color }}
                >
                  <Icon name={cfg.icon} size={22} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate" style={{ color: 'var(--fx-on-surface)' }}>
                    {saving.categoryLabel}
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--fx-on-surface-variant)' }}>
                    Saldo registrado em {currentYear}/{String(currentMonth).padStart(2, '0')}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold" style={{ color: 'var(--fx-on-surface)', fontVariantNumeric: 'tabular-nums' }}>
                    <span className="text-[11px] opacity-50 mr-0.5">R$</span>{brlFull(saving.amount)}
                  </div>
                  {delta !== 0 && (
                    <div
                      className="flex items-center justify-end gap-0.5 text-[11px] font-medium"
                      style={{ color: delta > 0 ? 'var(--fx-green)' : 'var(--fx-red)' }}
                    >
                      <Icon name={delta > 0 ? 'arrow_upward' : 'arrow_downward'} size={11} />
                      {delta > 0 ? '+' : '−'} R$ {brlInt(Math.abs(delta))}
                      {pct ? ` (${deltaPctCat >= 0 ? '+' : ''}${deltaPctCat.toFixed(1)}%)` : ''}
                    </div>
                  )}
                </div>
                <div className="flex gap-0.5 ml-1">
                  <button onClick={() => setEditingSaving(saving)} className="p-1.5 rounded-lg">
                    <Pencil size={13} style={{ color: 'var(--fx-on-surface-variant)' }} />
                  </button>
                  <button onClick={() => { deleteSaving(saving.id); toast('Removido'); }} className="p-1.5 rounded-lg">
                    <Trash2 size={13} style={{ color: 'var(--fx-red)' }} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Reminder card ─── */}
      <div
        className="mx-4 mt-4 rounded-2xl p-4 flex gap-3 items-center"
        style={{ background: 'var(--fx-surface-container-low)' }}
      >
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'var(--fx-primary-container)', color: 'var(--fx-on-primary-container)' }}
        >
          <Icon name="schedule" size={20} />
        </div>
        <div className="flex-1">
          <div className="text-sm font-medium" style={{ color: 'var(--fx-on-surface)' }}>
            Próximo lembrete · {nextReminder}
          </div>
          <div className="text-xs leading-relaxed mt-0.5" style={{ color: 'var(--fx-on-surface-variant)' }}>
            Atualize o saldo de cada categoria no dia {user.savingsReminderDay}.
          </div>
        </div>
      </div>

      {/* ── Modals ─── */}
      <Modal open={showAddModal} onClose={() => setShowAddModal(false)} title="Atualizar Economias">
        <SavingsForm
          month={currentMonth} year={currentYear}
          existingCategories={currentMonthSavings}
          allCategories={allCategories}
          onSubmit={data => {
            const existing = currentMonthSavings.find(s => s.category === data.category);
            if (existing) updateSaving(existing.id, { amount: data.amount });
            else addSaving(data);
            setShowAddModal(false);
            toast('Economias atualizadas');
          }}
          onCancel={() => setShowAddModal(false)}
        />
      </Modal>
      <Modal open={!!editingSaving} onClose={() => setEditingSaving(null)} title="Editar valor">
        {editingSaving && (
          <EditAmountForm
            saving={editingSaving}
            onSubmit={amount => { updateSaving(editingSaving.id, { amount }); setEditingSaving(null); toast('Valor atualizado'); }}
            onCancel={() => setEditingSaving(null)}
          />
        )}
      </Modal>
    </div>
  );
}
