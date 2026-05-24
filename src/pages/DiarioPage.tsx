import { useState, useMemo } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { computeMonthSummary } from '../lib/finance';
import { AddExpenseForm } from '../components/forms/AddExpenseForm';
import { useToast } from '../components/ui/Toast';
import { EXPENSE_CATEGORIES } from '../types';
import { Icon } from '../components/ui/Icon';
import type { DailyExpense } from '../types';

const PM_ICONS: Record<string, string> = {
  dinheiro: 'payments',
  pix: 'bolt',
  debito: 'credit_card',
  credito: 'credit_score',
};
const PM_LABELS: Record<string, string> = {
  dinheiro: 'Dinheiro', pix: 'Pix', debito: 'Débito', credito: 'Crédito',
};

const CAT_FILTERS = [
  { id: 'todos',           label: 'Todos',       icon: null },
  { id: 'alimentacao',     label: 'Alimentação', icon: 'restaurant' },
  { id: 'transporte',      label: 'Transporte',  icon: 'directions_car' },
  { id: 'lazer',           label: 'Lazer',       icon: 'celebration' },
  { id: 'compras_produtos',label: 'Compras',     icon: 'shopping_bag' },
  { id: 'saude',           label: 'Saúde',       icon: 'favorite' },
  { id: 'estudo',          label: 'Estudo',      icon: 'school' },
];

function brl(n: number) { return Math.round(n).toLocaleString('pt-BR'); }
function brlSplit(n: number) {
  const [int, dec] = Math.abs(n).toFixed(2).split('.');
  return { int: Number(int).toLocaleString('pt-BR'), dec };
}

function BottomSheet({ open, onClose, children }: { open: boolean; onClose: () => void; children: React.ReactNode }) {
  return (
    <>
      <div
        className="fixed inset-0 z-40 transition-opacity duration-200"
        style={{ background: 'rgba(0,0,0,0.42)', opacity: open ? 1 : 0, pointerEvents: open ? 'auto' : 'none' }}
        onClick={onClose}
      />
      <div
        className="fixed left-1/2 -translate-x-1/2 bottom-0 w-full sm:max-w-[440px] z-50 rounded-t-3xl overflow-y-auto"
        style={{
          background: 'var(--fx-surface-container-low)',
          maxHeight: '92%',
          transform: `translateX(-50%) translateY(${open ? '0' : '100%'})`,
          transition: 'transform 320ms cubic-bezier(0.2,0,0,1)',
        }}
      >
        <div className="w-8 h-1 rounded-full mx-auto mt-2 mb-3" style={{ background: 'var(--fx-outline-variant)' }} />
        {children}
      </div>
    </>
  );
}

export function DiarioPage() {
  const { user, incomes, fixedExpenses, dailyExpenses, currentMonth, currentYear, addDailyExpense, updateDailyExpense, deleteDailyExpense } = useApp();
  const toast = useToast();
  const [filterCat, setFilterCat] = useState('todos');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<DailyExpense | null>(null);

  const today = new Date();
  const todayDay = today.getDate();

  const summary = useMemo(() =>
    computeMonthSummary(incomes, fixedExpenses, dailyExpenses, currentYear, currentMonth, user),
    [incomes, fixedExpenses, dailyExpenses, currentYear, currentMonth, user]
  );

  const monthExpenses = useMemo(() =>
    dailyExpenses.filter(d => d.month === currentMonth && d.year === currentYear),
    [dailyExpenses, currentMonth, currentYear]
  );

  const filtered = filterCat === 'todos'
    ? monthExpenses
    : monthExpenses.filter(d => d.category === filterCat);

  const grouped = filtered.reduce<Record<string, DailyExpense[]>>((acc, d) => {
    if (!acc[d.date]) acc[d.date] = [];
    acc[d.date].push(d);
    return acc;
  }, {});
  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  const pct = summary.totalIncome > 0 ? (summary.totalDaily / summary.totalIncome) * 100 : 0;

  const dayLabel = (dateStr: string) => {
    const d = parseInt(dateStr.slice(8));
    if (d === todayDay && currentYear === today.getFullYear() && currentMonth === today.getMonth() + 1)
      return `Hoje · ${String(d).padStart(2, '0')} mai`;
    if (d === todayDay - 1 && currentYear === today.getFullYear() && currentMonth === today.getMonth() + 1)
      return `Ontem · ${String(d).padStart(2, '0')} mai`;
    return `${String(d).padStart(2, '0')} mai`;
  };

  return (
    <>
      <div className="flex flex-col pb-8">

        {/* ── Compact summary ─── */}
        <div
          className="mx-4 mt-4 rounded-2xl px-5 py-4 flex flex-col gap-3"
          style={{ background: 'var(--fx-surface-container)' }}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[11px] font-medium uppercase tracking-wide" style={{ color: 'var(--fx-on-surface-variant)' }}>
                Gasto no Diário · {new Date(currentYear, currentMonth - 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
              </div>
              <div className="mt-1 flex items-baseline gap-1" style={{ color: 'var(--fx-on-surface)' }}>
                <span className="text-sm opacity-60">R$</span>
                <span style={{ font: '400 28px/32px Roboto', letterSpacing: '-0.01em' }}>{brl(summary.totalDaily)}</span>
              </div>
              <div className="text-xs mt-1" style={{ color: 'var(--fx-on-surface-variant)' }}>
                {pct.toFixed(0)}% da renda · {monthExpenses.length} lançamentos
              </div>
            </div>
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{ background: 'var(--fx-primary-container)', color: 'var(--fx-on-primary-container)' }}
            >
              <Icon name="edit_note" size={28} />
            </div>
          </div>

          <div
            className="flex items-center justify-between pt-3"
            style={{ borderTop: '1px solid var(--fx-surface-container-high)' }}
          >
            <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--fx-on-surface-variant)' }}>
              <Icon name="today" size={14} />
              <span>Valor por dia · {summary.daysLeft} {summary.daysLeft === 1 ? 'dia restante' : 'dias restantes'}</span>
            </div>
            <span className="text-sm font-semibold" style={{ color: 'var(--fx-primary)', fontVariantNumeric: 'tabular-nums' }}>
              R$ {brl(summary.dailyBudget)}/dia
            </span>
          </div>
        </div>

        {/* ── Category filters ─── */}
        <div className="flex gap-2 px-4 py-3 overflow-x-auto no-scrollbar">
          {CAT_FILTERS.map(f => {
            const active = filterCat === f.id;
            return (
              <button
                key={f.id}
                onClick={() => setFilterCat(f.id)}
                className="flex-shrink-0 flex items-center gap-1 h-8 px-3 rounded-lg text-[13px] font-medium transition-all"
                style={{
                  border: active ? 'none' : '1px solid var(--fx-outline-variant)',
                  background: active ? 'var(--fx-secondary-container)' : 'transparent',
                  color: active ? 'var(--fx-on-secondary-container)' : 'var(--fx-on-surface-variant)',
                  paddingLeft: active ? 8 : undefined,
                }}
              >
                {active && <Icon name="check" size={14} />}
                {!active && f.icon && <Icon name={f.icon} size={14} />}
                {f.label}
              </button>
            );
          })}
        </div>

        {/* ── Transaction list ─── */}
        {sortedDates.length === 0 ? (
          <div className="text-center py-12 text-sm" style={{ color: 'var(--fx-on-surface-variant)' }}>
            <p className="text-3xl mb-2">🛒</p>
            <p>Nenhum gasto registrado.</p>
            <button onClick={() => setSheetOpen(true)} className="mt-3 font-medium" style={{ color: 'var(--fx-primary)' }}>
              + Registrar gasto
            </button>
          </div>
        ) : (
          <div>
            {sortedDates.map(date => {
              const dayTotal = grouped[date].reduce((s, t) => s + t.amount, 0);
              return (
                <div key={date}>
                  {/* Day divider */}
                  <div
                    className="flex justify-between items-baseline px-5 pt-3.5 pb-1 text-[11px] font-medium uppercase tracking-[0.06em]"
                    style={{ color: 'var(--fx-on-surface-variant)' }}
                  >
                    <span>{dayLabel(date)}</span>
                    <span className="normal-case tracking-normal opacity-85">R$ {brl(dayTotal)}</span>
                  </div>
                  {grouped[date].map((t, i) => {
                    const cat = EXPENSE_CATEGORIES.find(c => c.id === t.category);
                    const pm = PM_ICONS[t.paymentMethod] ?? 'payments';
                    const pmLabel = PM_LABELS[t.paymentMethod] ?? t.paymentMethod;
                    const sp = brlSplit(t.amount);
                    return (
                      <div
                        key={t.id}
                        className="flex items-center gap-3.5 px-5 py-3"
                        style={{
                          borderTop: i > 0 ? '1px solid var(--fx-surface-container)' : undefined,
                        }}
                      >
                        <div
                          className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{ background: 'var(--fx-secondary-container)', color: 'var(--fx-on-secondary-container)' }}
                        >
                          <Icon name={cat?.icon ?? 'category'} size={22} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate" style={{ color: 'var(--fx-on-surface)' }}>
                            {t.description}
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5 text-xs" style={{ color: 'var(--fx-on-surface-variant)' }}>
                            <span
                              className="flex items-center gap-1 px-2 py-0.5 rounded-full"
                              style={{ background: 'var(--fx-surface-container)', fontSize: 11 }}
                            >
                              <Icon name={pm} size={12} />
                              {pmLabel}
                              {t.installments && t.installments > 1 ? ` · ${t.installments}x` : ''}
                            </span>
                          </div>
                        </div>
                        <div className="font-semibold text-sm" style={{ color: 'var(--fx-on-surface)', fontVariantNumeric: 'tabular-nums' }}>
                          <span className="text-[11px] opacity-50 mr-0.5">R$</span>
                          {sp.int}<span className="text-xs opacity-60">,{sp.dec}</span>
                        </div>
                        <div className="flex gap-0.5 ml-1">
                          <button
                            onClick={() => setEditing(t)}
                            className="p-1.5 rounded-lg"
                            style={{ color: 'var(--fx-on-surface-variant)' }}
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            onClick={() => { deleteDailyExpense(t.id); toast('Gasto removido'); }}
                            className="p-1.5 rounded-lg"
                            style={{ color: 'var(--fx-red)' }}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── FAB ─── */}
      <button
        onClick={() => setSheetOpen(true)}
        className="fixed z-30 flex items-center justify-center rounded-2xl shadow-lg transition-transform active:scale-95"
        style={{
          right: 'calc(max(16px, 50vw - 220px + 16px))',
          bottom: 96,
          width: 56, height: 56,
          background: 'var(--fx-primary-container)',
          color: 'var(--fx-on-primary-container)',
        }}
      >
        <Icon name="add" size={28} />
      </button>

      {/* ── New expense sheet ─── */}
      <BottomSheet open={sheetOpen} onClose={() => setSheetOpen(false)}>
        <div className="px-6 pb-8">
          <div className="text-2xl font-normal mb-1" style={{ color: 'var(--fx-on-surface)' }}>Novo gasto</div>
          <div className="text-sm mb-5" style={{ color: 'var(--fx-on-surface-variant)' }}>
            Hoje · {String(todayDay).padStart(2, '0')} de {new Date(currentYear, currentMonth - 1).toLocaleDateString('pt-BR', { month: 'long' })}
          </div>
          <AddExpenseForm
            month={currentMonth}
            year={currentYear}
            onSubmit={d => { addDailyExpense(d); setSheetOpen(false); toast('Gasto adicionado'); }}
            onCancel={() => setSheetOpen(false)}
          />
        </div>
      </BottomSheet>

      {/* ── Edit sheet ─── */}
      <BottomSheet open={!!editing} onClose={() => setEditing(null)}>
        <div className="px-6 pb-8">
          <div className="text-2xl font-normal mb-5" style={{ color: 'var(--fx-on-surface)' }}>Editar gasto</div>
          {editing && (
            <AddExpenseForm
              initial={editing}
              month={currentMonth}
              year={currentYear}
              onSubmit={d => { updateDailyExpense(editing.id, d); setEditing(null); toast('Gasto atualizado'); }}
              onCancel={() => setEditing(null)}
            />
          )}
        </div>
      </BottomSheet>
    </>
  );
}
