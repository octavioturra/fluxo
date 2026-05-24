import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  computeMonthSummary, buildCalendarProjection, formatCurrency, getFixedHealth,
} from '../lib/finance';
import { AddExpenseForm } from '../components/forms/AddExpenseForm';
import { EXPENSE_CATEGORIES } from '../types';
import { Icon } from '../components/ui/Icon';

// ── Status config ────────────────────────────────────────
type StatusKey = 'maravilhoso' | 'bom' | 'atencao' | 'alerta';

const STATUS_CFG: Record<StatusKey, { bg: string; fg: string; accent: string; icon: string; label: string }> = {
  maravilhoso: { bg: 'var(--fx-blue-bg)',   fg: 'var(--fx-blue-fg)',   accent: 'var(--fx-blue)',   icon: 'verified',      label: 'Maravilhoso' },
  bom:         { bg: 'var(--fx-green-bg)',  fg: 'var(--fx-green-fg)',  accent: 'var(--fx-green)',  icon: 'check_circle',  label: 'Bom' },
  atencao:     { bg: 'var(--fx-yellow-bg)', fg: 'var(--fx-yellow-fg)', accent: 'var(--fx-yellow)', icon: 'warning',       label: 'Atenção' },
  alerta:      { bg: 'var(--fx-red-bg)',    fg: 'var(--fx-red-fg)',    accent: 'var(--fx-red)',    icon: 'error',         label: 'Alerta' },
};

const DOW = ['dom','seg','ter','qua','qui','sex','sáb'];

function brl(n: number) {
  return Math.round(Math.abs(n)).toLocaleString('pt-BR');
}
function brlSplit(n: number) {
  const [int, dec] = Math.abs(n).toFixed(2).split('.');
  return { int: Number(int).toLocaleString('pt-BR'), dec };
}

// ── Sheet overlay ────────────────────────────────────────
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

// ── Main page ────────────────────────────────────────────
export function HomePage() {
  const { user, incomes, fixedExpenses, dailyExpenses, currentMonth, currentYear, addDailyExpense } = useApp();
  const [sheetOpen, setSheetOpen] = useState(false);

  const today = new Date();
  const todayDay = today.getDate();
  const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
  const isCurrentMonth = currentYear === today.getFullYear() && currentMonth === today.getMonth() + 1;

  const summary = useMemo(() =>
    computeMonthSummary(incomes, fixedExpenses, dailyExpenses, currentYear, currentMonth, user),
    [incomes, fixedExpenses, dailyExpenses, currentYear, currentMonth, user]
  );

  const calendar = useMemo(() =>
    buildCalendarProjection(incomes, fixedExpenses, dailyExpenses, currentYear, currentMonth, summary.dailyBudget),
    [incomes, fixedExpenses, dailyExpenses, currentYear, currentMonth, summary.dailyBudget]
  );

  const fixedHealth = getFixedHealth(
    summary.totalIncome > 0 ? (summary.totalFixed / summary.totalIncome) * 100 : 0,
    user.fixedHealthThresholds
  );

  const pctFixed = summary.totalIncome > 0 ? (summary.totalFixed / summary.totalIncome) * 100 : 0;
  const pctDaily = summary.totalIncome > 0 ? (summary.totalDaily / summary.totalIncome) * 100 : 0;
  const balancePct = summary.totalIncome > 0
    ? Math.min(100, Math.max(2, (summary.currentBalance / summary.totalIncome) * 100))
    : 2;

  const status = summary.status as StatusKey;
  const sc = STATUS_CFG[status] ?? STATUS_CFG.bom;
  const daily = brlSplit(summary.dailyBudget);
  const daysLeft = summary.daysLeft;

  // Calendar: show today ±3 days
  const calDays = useMemo(() => {
    const result: typeof calendar = [];
    for (const d of calendar) {
      if (Math.abs(d.day - todayDay) <= 3) result.push(d);
    }
    return result;
  }, [calendar, todayDay]);

  const recent = dailyExpenses
    .filter(d => d.month === currentMonth && d.year === currentYear)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 4);

  return (
    <>
      <div className="flex flex-col">

        {/* ── SIGNATURE: Daily pill ─── */}
        <div
          className="mx-4 mt-3 mb-2 rounded-3xl p-6 relative overflow-hidden cursor-pointer"
          style={{ background: 'var(--fx-primary-container)', color: 'var(--fx-on-primary-container)' }}
        >
          {/* decorative arcs */}
          <div className="absolute -right-10 -top-10 w-52 h-52 rounded-full opacity-20 border" style={{ borderColor: 'currentColor' }} />
          <div className="absolute -right-24 -top-24 w-80 h-80 rounded-full opacity-10 border" style={{ borderColor: 'currentColor' }} />

          <div className="relative z-10 flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-[11px] font-medium uppercase tracking-widest opacity-85">
              <span>Você pode gastar hoje</span>
              <span className="flex items-center gap-0.5 opacity-65">
                <Icon name="edit" size={13} /> Ajustar
              </span>
            </div>
            <div className="flex items-baseline gap-1.5" style={{ font: '400 56px/64px Roboto, sans-serif', letterSpacing: '-0.02em' }}>
              <span className="text-2xl opacity-70">R$</span>
              <span>{daily.int}</span>
              <span className="text-3xl opacity-70">,{daily.dec}</span>
            </div>
            <div className="flex items-center gap-3 text-sm opacity-85">
              <span>R$ {daily.int} / dia</span>
              <span className="w-1 h-1 rounded-full bg-current opacity-40" />
              <span>{daysLeft} dias restantes</span>
            </div>
          </div>
        </div>

        {/* ── Month health bar ─── */}
        <div
          className="mx-4 rounded-3xl px-5 py-4 flex flex-col gap-3"
          style={{ background: 'var(--fx-surface-container-low)' }}
        >
          <div className="flex items-center justify-between text-sm font-medium" style={{ color: 'var(--fx-on-surface)' }}>
            <span>
              Saldo disponível
              <span className="ml-1.5 text-xs font-normal" style={{ color: 'var(--fx-on-surface-variant)' }}>
                {balancePct.toFixed(0)}% da renda
              </span>
            </span>
            <span className="font-semibold">R$ {brl(summary.currentBalance)}</span>
          </div>
          <div className="h-2.5 rounded-full overflow-hidden" style={{ background: 'var(--fx-surface-container-high)' }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${balancePct}%`, background: sc.accent }}
            />
          </div>
          <div className="flex justify-between text-xs" style={{ color: 'var(--fx-on-surface-variant)' }}>
            <span>Dia {isCurrentMonth ? todayDay : daysInMonth} de {daysInMonth}</span>
            <span>Projeção: R$ {brl(summary.projectedBalance)}</span>
          </div>
        </div>

        {/* ── Status notification card ─── */}
        <div
          className="mx-4 mt-3 rounded-2xl px-4 py-3.5 grid gap-3.5"
          style={{ background: sc.bg, color: sc.fg, gridTemplateColumns: 'auto 1fr' }}
        >
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: sc.accent }}
          >
            <Icon name={sc.icon} size={20} fill={1} style={{ color: '#fff' }} />
          </div>
          <div>
            <div className="text-xs font-medium uppercase tracking-wide opacity-85 mb-0.5">{sc.label}</div>
            <div className="text-sm leading-snug">
              {status === 'maravilhoso' && <>Saldo projetado no fim do mês: <strong>R$ {brl(summary.projectedBalance)}</strong> ({summary.projectedPercent.toFixed(0)}% da renda). Sobra confortável.</>}
              {status === 'bom' && <>Saldo projetado no fim do mês: <strong>R$ {brl(summary.projectedBalance)}</strong> ({summary.projectedPercent.toFixed(0)}% da renda). Está no caminho certo.</>}
              {status === 'atencao' && <>Saldo projetado no fim do mês: <strong>R$ {brl(summary.projectedBalance)}</strong> ({summary.projectedPercent.toFixed(0)}% da renda). Atenção — margem pequena.</>}
              {status === 'alerta' && <>O mês pode fechar no vermelho. Reduza os gastos.</>}
            </div>
          </div>
        </div>

        {/* ── 3 summary cards ─── */}
        <div className="px-4 pt-4 pb-2 grid grid-cols-3 gap-2">
          {[
            { icon: 'south_west',  label: 'Entradas', value: summary.totalIncome,  pct: 100,           health: null },
            { icon: 'autorenew',   label: 'Fixos',    value: summary.totalFixed,   pct: pctFixed,      health: fixedHealth },
            { icon: 'edit_note',   label: 'Diário',   value: summary.totalDaily,   pct: pctDaily,      health: null },
          ].map(card => (
            <div
              key={card.label}
              className="rounded-2xl p-3.5 flex flex-col gap-1"
              style={{ background: 'var(--fx-surface-container)' }}
            >
              <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide" style={{ color: 'var(--fx-on-surface-variant)' }}>
                <Icon name={card.icon} size={15} style={{ color: 'var(--fx-on-surface-variant)' }} />
                {card.label}
              </div>
              <div className="text-base font-semibold leading-tight" style={{ color: 'var(--fx-on-surface)', fontVariantNumeric: 'tabular-nums' }}>
                <span className="text-[11px] opacity-55 mr-0.5">R$</span>
                {brl(card.value)}
              </div>
              <div className="text-[11px]" style={{ color: 'var(--fx-on-surface-variant)' }}>
                {card.pct.toFixed(0)}% renda
                {card.health && (
                  <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${
                    card.health === 'recomendado' ? 'bg-green-100 text-green-700' :
                    card.health === 'excelente' ? 'bg-blue-100 text-blue-700' :
                    card.health === 'alerta' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-700'
                  }`}>
                    {card.health === 'recomendado' ? '✓ Ok' : card.health === 'excelente' ? '✓ Bom' : card.health === 'alerta' ? '⚠ Alto' : '🔴 Crítico'}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* ── Calendar ─── */}
        <SectionHeader title="Calendário do mês" />
        <div className="mx-4 rounded-2xl overflow-hidden" style={{ background: 'var(--fx-surface-container-low)' }}>
          {/* header row */}
          <div
            className="grid text-[11px] font-medium uppercase tracking-wide px-4 py-3"
            style={{ gridTemplateColumns: '56px 1fr 1fr 1fr', color: 'var(--fx-on-surface-variant)', background: 'var(--fx-surface-container)' }}
          >
            <span>Dia</span>
            <span className="text-right">Gasto</span>
            <span className="text-right">Planejado</span>
            <span className="text-right">Saldo</span>
          </div>
          {calDays.map((d, i) => {
            const dow = DOW[(new Date(d.date + 'T12:00:00').getDay())];
            const isOver = !d.isFuture && d.realSpent > d.planned;
            return (
              <div
                key={d.day}
                className="grid px-4 py-2.5 text-sm"
                style={{
                  gridTemplateColumns: '56px 1fr 1fr 1fr',
                  borderTop: i > 0 ? '1px solid var(--fx-surface-container)' : undefined,
                  background: d.isToday ? 'var(--fx-primary-container)' : undefined,
                  color: d.isToday ? 'var(--fx-on-primary-container)' : d.isFuture ? 'var(--fx-on-surface-variant)' : 'var(--fx-on-surface)',
                }}
              >
                <div className="flex flex-col">
                  <span className="font-medium">{String(d.day).padStart(2, '0')}</span>
                  <span className="text-[11px] uppercase opacity-60">{dow}</span>
                </div>
                <div className="text-right font-[12px]" style={{ fontVariantNumeric: 'tabular-nums' }}>
                  {d.isFuture ? (
                    <span className="opacity-40">—</span>
                  ) : (
                    <span className={isOver ? 'font-semibold' : ''} style={{ color: isOver && !d.isToday ? 'var(--fx-red)' : undefined }}>
                      {d.realSpent > 0 ? `R$ ${brl(d.realSpent)}` : <span className="opacity-40">R$ 0</span>}
                    </span>
                  )}
                </div>
                <div className="text-right text-xs opacity-70" style={{ fontVariantNumeric: 'tabular-nums' }}>
                  R$ {brl(d.planned)}
                </div>
                <div className="text-right font-medium text-sm" style={{ fontVariantNumeric: 'tabular-nums' }}>
                  <span style={{ color: !d.isToday && d.balance < 0 ? 'var(--fx-red)' : undefined }}>
                    R$ {brl(d.balance)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Recent transactions ─── */}
        <SectionHeader title="Últimos lançamentos" />
        <div className="mx-4 rounded-2xl overflow-hidden mb-6" style={{ background: 'var(--fx-surface-container-low)' }}>
          {recent.length === 0 ? (
            <div className="text-center py-8 text-sm" style={{ color: 'var(--fx-on-surface-variant)' }}>
              Nenhum lançamento ainda.
            </div>
          ) : recent.map((t, i) => {
            const cat = EXPENSE_CATEGORIES.find(c => c.id === t.category);
            const sp = brlSplit(t.amount);
            return (
              <div
                key={t.id}
                className="flex items-center gap-3.5 px-4 py-3"
                style={{ borderTop: i > 0 ? '1px solid var(--fx-surface-container)' : undefined }}
              >
                <div
                  className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 text-lg"
                  style={{ background: 'var(--fx-secondary-container)', color: 'var(--fx-on-secondary-container)' }}
                >
                  {cat?.emoji ?? '📦'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate" style={{ color: 'var(--fx-on-surface)' }}>{t.description}</div>
                  <div className="text-xs mt-0.5 flex items-center gap-1.5" style={{ color: 'var(--fx-on-surface-variant)' }}>
                    <span
                      className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px]"
                      style={{ background: 'var(--fx-surface-container)' }}
                    >
                      {cat?.label ?? t.category}
                    </span>
                    <span className="w-1 h-1 rounded-full opacity-40" style={{ background: 'currentColor' }} />
                    <span>{t.date.slice(8)}/05</span>
                  </div>
                </div>
                <div className="text-sm font-semibold" style={{ color: 'var(--fx-on-surface)', fontVariantNumeric: 'tabular-nums' }}>
                  <span className="text-[11px] opacity-50 mr-0.5">R$</span>
                  {sp.int}<span className="text-xs opacity-60">,{sp.dec}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── FAB ─── */}
      <button
        onClick={() => setSheetOpen(true)}
        className="fixed z-30 flex items-center justify-center rounded-2xl shadow-lg transition-transform active:scale-95"
        style={{
          right: 'calc(max(16px, 50vw - 220px + 16px))',
          bottom: 96,
          width: 56,
          height: 56,
          background: 'var(--fx-primary-container)',
          color: 'var(--fx-on-primary-container)',
        }}
      >
        <Icon name="add" size={28} />
      </button>

      {/* ── New expense bottom sheet ─── */}
      <BottomSheet open={sheetOpen} onClose={() => setSheetOpen(false)}>
        <div className="px-6 pb-8">
          <div className="text-2xl font-normal mb-1" style={{ color: 'var(--fx-on-surface)' }}>Novo gasto</div>
          <div className="text-sm mb-5" style={{ color: 'var(--fx-on-surface-variant)' }}>
            Hoje · {String(todayDay).padStart(2, '0')} de {new Date(currentYear, currentMonth - 1).toLocaleDateString('pt-BR', { month: 'long' })}
          </div>
          <AddExpenseForm
            month={currentMonth}
            year={currentYear}
            onSubmit={expense => { addDailyExpense(expense); setSheetOpen(false); }}
            onCancel={() => setSheetOpen(false)}
          />
        </div>
      </BottomSheet>
    </>
  );
}

function SectionHeader({ title, action }: { title: string; action?: string }) {
  return (
    <div className="flex items-baseline justify-between px-5 pt-6 pb-2">
      <h2 className="text-base font-medium" style={{ color: 'var(--fx-on-surface)', letterSpacing: '0.01em' }}>{title}</h2>
      {action && <span className="text-sm font-medium" style={{ color: 'var(--fx-primary)' }}>{action}</span>}
    </div>
  );
}
