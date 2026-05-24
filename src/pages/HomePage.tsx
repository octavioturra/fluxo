import { useState, useMemo } from 'react';
import { Plus, ChevronDown, ChevronUp } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { computeMonthSummary, buildCalendarProjection, formatCurrency, formatPercent, getStatusMessage, getFixedHealth } from '../lib/finance';
import { Modal } from '../components/ui/Modal';
import { AddExpenseForm } from '../components/forms/AddExpenseForm';
import { EXPENSE_CATEGORIES } from '../types';

const statusBarColor: Record<string, string> = {
  maravilhoso: 'bg-[#4361EE]',
  bom: 'bg-[#22C55E]',
  atencao: 'bg-[#EAB308]',
  alerta: 'bg-[#EF4444]',
};

const statusNotifColor: Record<string, string> = {
  maravilhoso: 'bg-blue-50 border-blue-200 text-blue-800',
  bom: 'bg-green-50 border-green-200 text-green-800',
  atencao: 'bg-yellow-50 border-yellow-200 text-yellow-800',
  alerta: 'bg-red-50 border-red-200 text-red-800',
};

type FilterType = 'todos' | 'entrada' | 'fixo' | 'diario';

export function HomePage() {
  const { user, incomes, fixedExpenses, dailyExpenses, currentMonth, currentYear, addDailyExpense } = useApp();
  const [showAddModal, setShowAddModal] = useState(false);
  const [filter, setFilter] = useState<FilterType>('todos');
  const [showCalendar, setShowCalendar] = useState(true);

  const today = new Date();
  const todayDay = today.getDate();
  const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
  const daysLeft = currentYear === today.getFullYear() && currentMonth === today.getMonth() + 1
    ? daysInMonth - todayDay + 1
    : daysInMonth;

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

  const allTransactions = useMemo(() => {
    const list: Array<{ id: string; date: string; description: string; category: string; amount: number; type: 'entrada' | 'fixo' | 'diario' }> = [];

    incomes
      .filter(i => i.month === currentMonth && i.year === currentYear)
      .forEach(i => list.push({ id: i.id, date: `${currentYear}-${String(currentMonth).padStart(2,'0')}-${String(i.day).padStart(2,'0')}`, description: i.source, category: 'entrada', amount: i.amount, type: 'entrada' }));

    fixedExpenses
      .filter(f => f.active)
      .forEach(f => list.push({ id: f.id, date: `${currentYear}-${String(currentMonth).padStart(2,'0')}-${String(f.dueDay).padStart(2,'0')}`, description: f.name, category: f.category, amount: f.amount, type: 'fixo' }));

    dailyExpenses
      .filter(d => d.month === currentMonth && d.year === currentYear)
      .forEach(d => list.push({ id: d.id, date: d.date, description: d.description, category: d.category, amount: d.amount, type: 'diario' }));

    return list.sort((a, b) => b.date.localeCompare(a.date));
  }, [incomes, fixedExpenses, dailyExpenses, currentMonth, currentYear]);

  const filteredTransactions = filter === 'todos' ? allTransactions : allTransactions.filter(t => t.type === filter);

  const grouped = filteredTransactions.reduce<Record<string, typeof filteredTransactions>>((acc, t) => {
    if (!acc[t.date]) acc[t.date] = [];
    acc[t.date].push(t);
    return acc;
  }, {});

  const getCatEmoji = (catId: string) => {
    const cat = EXPENSE_CATEGORIES.find(c => c.id === catId);
    return cat?.emoji ?? '📦';
  };

  const balancePercent = summary.totalIncome > 0
    ? Math.min(100, Math.max(0, (summary.currentBalance / summary.totalIncome) * 100))
    : 0;

  return (
    <div className="flex flex-col">
      {/* Contexto do dia */}
      {isCurrentMonth && (
        <div className="px-4 pt-4 pb-2 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Hoje é dia <strong>{todayDay}</strong> · Faltam {daysLeft - 1} dias para o fim do mês.
          </span>
          <span className={`text-sm font-bold px-3 py-0.5 rounded-full ${statusBarColor[summary.status]} text-white`}>
            {formatCurrency(Math.max(0, summary.dailyBudget))}/dia
          </span>
        </div>
      )}

      {/* Balance bar */}
      <div className="px-4 pb-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500 dark:text-slate-400">Saldo disponível</span>
          {!isCurrentMonth && (
            <span className={`text-sm font-bold px-3 py-0.5 rounded-full ${statusBarColor[summary.status]} text-white`}>
              {formatCurrency(Math.max(0, summary.dailyBudget))}/dia
            </span>
          )}
        </div>
        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${statusBarColor[summary.status]}`}
            style={{ width: `${balancePercent}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-slate-500">
          <span>{formatCurrency(summary.currentBalance)} restante</span>
          <span>{formatPercent(balancePercent)} da renda</span>
        </div>
      </div>

      {/* Status notification */}
      <div className={`mx-4 mb-3 px-3 py-2 rounded-xl border text-sm ${statusNotifColor[summary.status]}`}>
        {getStatusMessage(summary.status, summary.currentBalance)}
      </div>

      {/* 3 summary cards */}
      <div className="px-4 pb-3 grid grid-cols-3 gap-2">
        <SummaryCard label="Entradas" value={summary.totalIncome} percent={100} />
        <SummaryCard
          label="Fixos"
          value={summary.totalFixed}
          percent={summary.totalIncome > 0 ? (summary.totalFixed / summary.totalIncome) * 100 : 0}
          health={fixedHealth}
        />
        <SummaryCard
          label="Diário"
          value={summary.totalDaily}
          percent={summary.totalIncome > 0 ? (summary.totalDaily / summary.totalIncome) * 100 : 0}
        />
      </div>

      {/* Calendar toggle */}
      <div className="px-4 pb-2">
        <button
          onClick={() => setShowCalendar(v => !v)}
          className="w-full flex items-center justify-between py-2 px-3 bg-white dark:bg-slate-800 rounded-xl border border-[#F3F4F6] dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-300"
        >
          <span>📅 Calendário do mês</span>
          {showCalendar ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {/* Calendar projection */}
      {showCalendar && (
        <div className="px-4 pb-3">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-[#F3F4F6] dark:border-slate-700 overflow-hidden">
            <div className="grid grid-cols-4 text-xs font-semibold text-slate-400 uppercase px-3 py-2 border-b border-[#F3F4F6] dark:border-slate-700">
              <span>Dia</span>
              <span className="text-center">Gasto</span>
              <span className="text-center">Planejado</span>
              <span className="text-right">Saldo</span>
            </div>
            <div className="max-h-64 overflow-y-auto">
              {calendar.map(day => (
                <div
                  key={day.day}
                  className={`grid grid-cols-4 text-xs px-3 py-2 border-b border-slate-50 dark:border-slate-700/50 ${
                    day.isToday ? 'bg-blue-50 dark:bg-blue-900/20 font-semibold' : ''
                  }`}
                >
                  <span className={`${day.isToday ? 'text-[#4361EE] font-bold' : 'text-slate-500'}`}>
                    {String(day.day).padStart(2, '0')}
                    {day.isToday && <span className="ml-1 text-[10px] bg-[#4361EE] text-white px-1 rounded">hoje</span>}
                  </span>
                  <span className={`text-center ${day.isFuture ? 'text-slate-300' : day.status === 'over' ? 'text-red-500 font-semibold' : 'text-slate-700 dark:text-slate-300'}`}>
                    {day.isFuture ? '—' : formatCurrency(day.realSpent).replace('R$\xa0', '')}
                  </span>
                  <span className="text-center text-slate-400">
                    {formatCurrency(day.planned).replace('R$\xa0', '')}
                  </span>
                  <span className={`text-right font-medium ${day.balance >= 0 ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>
                    {formatCurrency(day.balance).replace('R$\xa0', '')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Extrato */}
      <div className="px-4 pb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-slate-800 dark:text-white text-sm">Extrato</h3>
          <div className="flex gap-1">
            {(['todos', 'entrada', 'fixo', 'diario'] as FilterType[]).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`text-xs px-2 py-1 rounded-full ${filter === f ? 'bg-[#4361EE] text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-500'}`}
              >
                {f === 'todos' ? 'Todos' : f === 'entrada' ? 'Entradas' : f === 'fixo' ? 'Fixos' : 'Diário'}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {Object.entries(grouped).map(([date, transactions]) => (
            <div key={date}>
              <p className="text-xs font-semibold text-slate-400 uppercase mb-1">
                {new Date(date + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })}
              </p>
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-[#F3F4F6] dark:border-slate-700 overflow-hidden divide-y divide-slate-50 dark:divide-slate-700/50">
                {transactions.map(t => (
                  <div key={t.id} className="flex items-center gap-3 px-3 py-2.5">
                    <span className="text-lg">{t.type === 'entrada' ? '💰' : getCatEmoji(t.category)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 dark:text-white truncate">{t.description}</p>
                      <p className="text-xs text-slate-400 capitalize">{t.type}</p>
                    </div>
                    <span className={`text-sm font-semibold ${t.type === 'entrada' ? 'text-[#22C55E]' : 'text-slate-700 dark:text-slate-300'}`}>
                      {t.type === 'entrada' ? '+' : '-'}{formatCurrency(t.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {filteredTransactions.length === 0 && (
            <div className="text-center py-8 text-slate-400 text-sm">Nenhum lançamento encontrado</div>
          )}
        </div>
      </div>

      {/* FAB */}
      <button
        onClick={() => setShowAddModal(true)}
        className="fixed bottom-20 right-4 w-14 h-14 bg-[#4361EE] text-white rounded-full shadow-xl flex items-center justify-center z-30 hover:bg-[#3451d1] active:scale-95 transition-all"
      >
        <Plus size={24} />
      </button>

      <Modal open={showAddModal} onClose={() => setShowAddModal(false)} title="Novo Gasto">
        <AddExpenseForm
          month={currentMonth}
          year={currentYear}
          onSubmit={expense => {
            addDailyExpense(expense);
            setShowAddModal(false);
          }}
          onCancel={() => setShowAddModal(false)}
        />
      </Modal>
    </div>
  );
}

function SummaryCard({ label, value, percent, health }: {
  label: string; value: number; percent: number; health?: string;
}) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-3 border border-[#F3F4F6] dark:border-slate-700">
      <p className="text-xs text-slate-400 mb-1">{label}</p>
      <p className="text-sm font-bold text-slate-800 dark:text-white leading-tight">{formatCurrency(value)}</p>
      <p className="text-xs text-slate-400 mt-0.5">{formatPercent(percent)}</p>
      {health && (
        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full mt-1 inline-block ${
          health === 'recomendado' ? 'bg-green-100 text-green-700' :
          health === 'excelente' ? 'bg-blue-100 text-blue-700' :
          health === 'alerta' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-700'
        }`}>
          {health === 'recomendado' ? '✓ Ok' : health === 'excelente' ? '✓ Bom' : health === 'alerta' ? '⚠ Alto' : '🔴 Crítico'}
        </span>
      )}
    </div>
  );
}
