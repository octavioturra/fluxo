import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { computeMonthSummary, buildCalendarProjection } from '../lib/finance';
import { AddExpenseForm } from '../components/forms/AddExpenseForm';
import { EXPENSE_CATEGORIES } from '../types';
import { Icon } from '../components/ui/Icon';

type StatusKey = 'maravilhoso' | 'bom' | 'atencao' | 'alerta';

const STATUS_VARS: Record<StatusKey, { bg: string; fg: string; accent: string; icon: string; barColor: string }> = {
  maravilhoso: { bg: 'var(--fx-status-blue-bg)',   fg: 'var(--fx-status-blue-fg)',   accent: 'var(--fx-status-blue)',   icon: 'verified',     barColor: 'var(--fx-status-blue)' },
  bom:         { bg: 'var(--fx-status-green-bg)',  fg: 'var(--fx-status-green-fg)',  accent: 'var(--fx-status-green)',  icon: 'check_circle', barColor: 'var(--fx-status-green)' },
  atencao:     { bg: 'var(--fx-status-yellow-bg)', fg: 'var(--fx-status-yellow-fg)', accent: 'var(--fx-status-yellow)', icon: 'warning',      barColor: 'var(--fx-status-yellow)' },
  alerta:      { bg: 'var(--fx-status-red-bg)',    fg: 'var(--fx-status-red-fg)',    accent: 'var(--fx-status-red)',    icon: 'error',        barColor: 'var(--fx-status-red)' },
};

const STATUS_LABEL: Record<StatusKey, string> = {
  maravilhoso: 'Maravilhoso',
  bom:         'Bom',
  atencao:     'Atenção',
  alerta:      'Alerta',
};

const MONTHS_FULL = [
  'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro',
];
const DOW = ['dom','seg','ter','qua','qui','sex','sáb'];

function brlInt(n: number) {
  return Math.round(Math.abs(n)).toLocaleString('pt-BR');
}
function brlSplit(n: number) {
  const [int, dec] = Math.abs(n).toFixed(2).split('.');
  return { int: Number(int).toLocaleString('pt-BR'), dec };
}

export function HomePage() {
  const navigate = useNavigate();
  const { incomes, fixedExpenses, dailyExpenses, currentMonth, currentYear, addDailyExpense, user } = useApp();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);

  const today = new Date();
  const todayDay = today.getDate();
  const isCurrentMonth = currentYear === today.getFullYear() && currentMonth === today.getMonth() + 1;
  const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
  const displayToday = isCurrentMonth ? todayDay : daysInMonth;

  const summary = useMemo(() =>
    computeMonthSummary(incomes, fixedExpenses, dailyExpenses, currentYear, currentMonth, user),
    [incomes, fixedExpenses, dailyExpenses, currentYear, currentMonth, user]
  );

  const calendar = useMemo(() =>
    buildCalendarProjection(incomes, fixedExpenses, dailyExpenses, currentYear, currentMonth, summary.dailyBudget),
    [incomes, fixedExpenses, dailyExpenses, currentYear, currentMonth, summary.dailyBudget]
  );

  const status = summary.status as StatusKey;
  const sv = STATUS_VARS[status] ?? STATUS_VARS.bom;
  const daily = brlSplit(summary.dailyBudget);
  const remainingPct = summary.totalIncome > 0
    ? (summary.currentBalance / summary.totalIncome) * 100
    : 2;
  const pctFixed = summary.totalIncome > 0 ? (summary.totalFixed / summary.totalIncome) * 100 : 0;
  const pctDaily  = summary.totalIncome > 0 ? (summary.totalDaily  / summary.totalIncome) * 100 : 0;

  const calDays = useMemo(() =>
    calendar.filter(d => Math.abs(d.day - displayToday) <= 3),
    [calendar, displayToday]
  );

  const recent = useMemo(() =>
    dailyExpenses
      .filter(d => d.month === currentMonth && d.year === currentYear)
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 4),
    [dailyExpenses, currentMonth, currentYear]
  );

  const monthLabel = `${MONTHS_FULL[currentMonth - 1]} ${currentYear}`;

  return (
    <>
      <div className="fx-scroll">
        {/* Daily pill */}
        <div className="fx-daily-pill" onClick={() => setCalendarOpen(true)} style={{ cursor: 'pointer' }}>
          <div className="top-row">
            <span>O valor sugerido para o gasto de hoje é</span>
          </div>
          <div className="amount">
            <span className="currency">R$</span>
            <span>{daily.int}</span>
            <span className="cents">,{daily.dec}</span>
          </div>
          <div className="meta">
            <span>{summary.daysLeft} dias restantes</span>
          </div>
        </div>

        {/* Month health bar */}
        <div className="fx-month-bar" onClick={() => setCalendarOpen(true)} style={{ cursor: 'pointer' }}>
          <div className="row">
            <span>Saldo disponível · <span className="meta">{Math.max(0, remainingPct).toFixed(0)}% da renda</span></span>
            <span style={{ fontWeight: 500 }}>R$ {brlInt(summary.currentBalance)}</span>
          </div>
          <div className="bar">
            <div className="fill" style={{ width: `${Math.min(100, Math.max(2, remainingPct))}%`, background: sv.barColor }} />
          </div>
          <div className="row" style={{ marginTop: -4 }}>
            <span className="meta">Dia {displayToday} de {daysInMonth}</span>
            <span className="meta">Projeção: R$ {brlInt(summary.projectedBalance)}</span>
          </div>
        </div>

        {/* Status notification card */}
        <div
          className="fx-status-card"
          style={{ '--bg': sv.bg, '--fg': sv.fg, '--accent': sv.accent } as React.CSSProperties}
        >
          <div className="glyph"><Icon name={sv.icon} /></div>
          <div>
            <div className="lbl">{STATUS_LABEL[status]}</div>
            <div className="msg">
              {status === 'maravilhoso' && <>Saldo projetado no fim do mês: <strong>R$ {brlInt(summary.projectedBalance)}</strong> ({summary.projectedPercent.toFixed(0)}% da renda). Sobra confortável.</>}
              {status === 'bom'         && <>Saldo projetado no fim do mês: <strong>R$ {brlInt(summary.projectedBalance)}</strong> ({summary.projectedPercent.toFixed(0)}% da renda). Está no caminho certo.</>}
              {status === 'atencao'     && <>Saldo projetado no fim do mês: <strong>R$ {brlInt(summary.projectedBalance)}</strong> ({summary.projectedPercent.toFixed(0)}% da renda). Atenção — margem pequena.</>}
              {status === 'alerta'      && <>O mês vai fechar no vermelho. Reduza gastos.</>}
            </div>
          </div>
        </div>

        {/* 3 summary cards */}
        <div className="fx-summary-row">
          <button className="fx-summary-card" onClick={() => navigate('/app/entradas')}>
            <div className="head"><Icon name="south_west" /> Entradas</div>
            <div className="v"><span className="currency">R$</span>{brlInt(summary.totalIncome)}</div>
            <div className="pct">100% renda</div>
          </button>
          <button className="fx-summary-card" onClick={() => navigate('/app/fixos')}>
            <div className="head"><Icon name="autorenew" /> Fixos</div>
            <div className="v"><span className="currency">R$</span>{brlInt(summary.totalFixed)}</div>
            <div className="pct">{pctFixed.toFixed(0)}% renda</div>
          </button>
          <button className="fx-summary-card" onClick={() => navigate('/app/diario')}>
            <div className="head"><Icon name="edit_note" /> Diário</div>
            <div className="v"><span className="currency">R$</span>{brlInt(summary.totalDaily)}</div>
            <div className="pct">{pctDaily.toFixed(0)}% renda</div>
          </button>
        </div>

        {/* Calendar */}
        <div className="fx-section-h">
          <h2>Calendário do mês</h2>
          <span className="link" onClick={() => setCalendarOpen(true)} style={{ cursor: 'pointer' }}>Ver tudo</span>
        </div>
        <div className="fx-calendar">
          <div className="cal-head">
            <div className="h0">Dia</div>
            <div>Gasto</div>
            <div>Planejado</div>
            <div>Saldo</div>
          </div>
          {calDays.map(d => {
            const dn = DOW[new Date(currentYear, currentMonth - 1, d.day).getDay()];
            const isOver = !d.isFuture && d.realSpent > d.planned;
            return (
              <div
                key={d.day}
                className={['row', d.isToday ? 'today' : '', d.isFuture ? 'future' : ''].filter(Boolean).join(' ')}
              >
                <div className="date">
                  {String(d.day).padStart(2, '0')}<small>{dn}</small>
                </div>
                <div className="col">
                  {d.isFuture ? (
                    <span style={{ opacity: 0.5 }}>—</span>
                  ) : d.realSpent > 0 ? (
                    <span className={`ind ${isOver ? 'over' : 'under'}`}>
                      R$ {brlInt(d.realSpent)}
                      <Icon name={isOver ? 'arrow_upward' : 'check'} size={12} />
                    </span>
                  ) : (
                    <span style={{ opacity: 0.4 }}>R$ 0</span>
                  )}
                </div>
                <div className="col planned">R$ {brlInt(d.planned)}</div>
                <div className="col balance">
                  <span style={{ color: !d.isToday && d.balance < 0 ? 'var(--fx-status-red)' : undefined }}>
                    R$ {brlInt(d.balance)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Recent transactions */}
        <div className="fx-section-h">
          <h2>Últimos lançamentos</h2>
          <span className="link" onClick={() => navigate('/app/diario')} style={{ cursor: 'pointer' }}>Ver tudo</span>
        </div>
        <div className="fx-tx-list">
          {recent.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: '24px 16px',
              color: 'var(--md-sys-color-on-surface-variant)',
              font: '400 14px/20px var(--md-ref-typeface-plain)',
            }}>
              Nenhum lançamento ainda.
            </div>
          ) : recent.map(t => {
            const cat = EXPENSE_CATEGORIES.find(c => c.id === t.category) ?? EXPENSE_CATEGORIES[EXPENSE_CATEGORIES.length - 1];
            const sp = brlSplit(t.amount);
            return (
              <button className="fx-tx-row" key={t.id}>
                <div className="icon"><Icon name={cat.icon} /></div>
                <div className="body">
                  <div className="desc">{t.description}</div>
                  <div className="meta">
                    <span className="cat-tag"><Icon name={cat.icon} />{cat.label}</span>
                    <span className="sep" />
                    <span>{t.date.slice(8)}/{String(currentMonth).padStart(2, '0')}</span>
                  </div>
                </div>
                <div className="v">
                  <span className="currency">R$</span>
                  {sp.int}<span className="sm">,{sp.dec}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* FAB */}
      <button className="fx-fab" onClick={() => setSheetOpen(true)} aria-label="Novo gasto">
        <Icon name="add" />
      </button>

      {/* New expense sheet */}
      <div className={`fx-scrim${sheetOpen ? ' open' : ''}`} onClick={() => setSheetOpen(false)} />
      <div className={`fx-sheet${sheetOpen ? ' open' : ''}`}>
        <div className="grabber" />
        <div className="sheet-title">Novo gasto</div>
        <div className="sheet-subtitle">
          Hoje · {String(todayDay).padStart(2, '0')} de {MONTHS_FULL[currentMonth - 1].toLowerCase()}
        </div>
        <div style={{ padding: '0 20px 32px' }}>
          <AddExpenseForm
            month={currentMonth}
            year={currentYear}
            onSubmit={expense => { addDailyExpense(expense); setSheetOpen(false); }}
            onCancel={() => setSheetOpen(false)}
          />
        </div>
      </div>

      {/* Full calendar sheet */}
      <FullCalendarSheet
        open={calendarOpen}
        onClose={() => setCalendarOpen(false)}
        calendar={calendar}
        dailyBudget={summary.dailyBudget}
        monthLabel={monthLabel}
        currentYear={currentYear}
        currentMonth={currentMonth}
      />
    </>
  );
}

// ── Full calendar sheet ──────────────────────────────────────────
interface CalDay {
  day: number;
  realSpent: number;
  planned: number;
  balance: number;
  isToday: boolean;
  isFuture: boolean;
}

function FullCalendarSheet({
  open, onClose, calendar, dailyBudget, monthLabel, currentYear, currentMonth,
}: {
  open: boolean;
  onClose: () => void;
  calendar: CalDay[];
  dailyBudget: number;
  monthLabel: string;
  currentYear: number;
  currentMonth: number;
}) {
  const maxReal = Math.max(dailyBudget * 1.5, ...calendar.map(x => x.realSpent));

  return (
    <>
      <div className={`fx-scrim${open ? ' open' : ''}`} onClick={onClose} style={{ zIndex: 50 }} />
      <div
        className={`fx-sheet fx-fullcal${open ? ' open' : ''}`}
        style={{ zIndex: 51 }}
      >
        <div className="grabber" />
        <div className="sheet-title">Calendário · {monthLabel}</div>
        <div className="sheet-subtitle">
          Gasto real do dia vs valor diário sugerido (R$ {brlInt(dailyBudget)})
        </div>

        {/* Bar chart */}
        <div className="fx-fullcal-chart">
          {calendar.map(x => {
            const h = x.realSpent > 0 ? Math.max(4, (x.realSpent / maxReal) * 60) : 0;
            const isOver = !x.isFuture && x.realSpent > dailyBudget;
            const baseline = (dailyBudget / maxReal) * 60;
            return (
              <div
                key={x.day}
                className={['day-bar', x.isToday ? 'today' : '', x.isFuture ? 'future' : ''].filter(Boolean).join(' ')}
              >
                <div className="bars">
                  <div className="planned-line" style={{ bottom: baseline + 'px' }} />
                  <div
                    className={['bar', isOver ? 'over' : 'under', x.isFuture ? 'future' : ''].filter(Boolean).join(' ')}
                    style={{ height: h + 'px' }}
                  />
                </div>
                <div className="d">{x.day}</div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="fx-fullcal-legend">
          <span><span className="dot under" />Dentro do planejado</span>
          <span><span className="dot over" />Acima do planejado</span>
          <span><span className="dot line" />Valor sugerido</span>
        </div>

        {/* Table */}
        <div className="fx-fullcal-table">
          <div className="head">
            <span>Dia</span>
            <span>Gasto</span>
            <span>Planejado</span>
            <span>Saldo</span>
          </div>
          {calendar.map(x => {
            const dn = DOW[new Date(currentYear, currentMonth - 1, x.day).getDay()];
            const isOver = !x.isFuture && x.realSpent > dailyBudget;
            return (
              <div
                key={x.day}
                className={['row', x.isToday ? 'today' : '', x.isFuture ? 'future' : ''].filter(Boolean).join(' ')}
              >
                <div className="date">
                  {String(x.day).padStart(2, '0')}<small>{dn}</small>
                </div>
                <div className="col">
                  {x.isFuture ? (
                    <span className="muted">—</span>
                  ) : x.realSpent > 0 ? (
                    <span className={`ind ${isOver ? 'over' : 'under'}`}>
                      R$ {brlInt(x.realSpent)}
                      <Icon name={isOver ? 'arrow_upward' : 'check'} size={12} />
                    </span>
                  ) : (
                    <span className="muted">R$ 0</span>
                  )}
                </div>
                <div className="col planned">R$ {brlInt(x.planned)}</div>
                <div className="col balance">R$ {brlInt(x.balance)}</div>
              </div>
            );
          })}
        </div>

        <div className="cta-row" style={{ paddingTop: 12 }}>
          <button className="fx-btn flex" onClick={onClose}>Fechar</button>
        </div>
      </div>
    </>
  );
}
