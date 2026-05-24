import { useState, useMemo } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatCurrency, formatPercent } from '../lib/finance';
import { Modal } from '../components/ui/Modal';
import { AddExpenseForm } from '../components/forms/AddExpenseForm';
import { useToast } from '../components/ui/Toast';
import { EXPENSE_CATEGORIES } from '../types';
import type { DailyExpense } from '../types';

const PM_LABELS: Record<string, string> = {
  dinheiro: '💵', pix: '⚡', debito: '💳', credito: '💳✨',
};

export function DiarioPage() {
  const { incomes, dailyExpenses, currentMonth, currentYear, addDailyExpense, updateDailyExpense, deleteDailyExpense } = useApp();
  const toast = useToast();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<DailyExpense | null>(null);
  const [filterCat, setFilterCat] = useState('');

  const monthIncome = useMemo(() =>
    incomes.filter(i => i.month === currentMonth && i.year === currentYear).reduce((s, i) => s + i.amount, 0),
    [incomes, currentMonth, currentYear]
  );

  const monthExpenses = useMemo(() =>
    dailyExpenses.filter(d => d.month === currentMonth && d.year === currentYear),
    [dailyExpenses, currentMonth, currentYear]
  );

  const filteredExpenses = filterCat ? monthExpenses.filter(d => d.category === filterCat) : monthExpenses;

  const totalSpent = monthExpenses.filter(d => d.paymentMethod !== 'credito').reduce((s, d) => s + d.amount, 0);
  const percent = monthIncome > 0 ? (totalSpent / monthIncome) * 100 : 0;

  const grouped = filteredExpenses.reduce<Record<string, DailyExpense[]>>((acc, d) => {
    if (!acc[d.date]) acc[d.date] = [];
    acc[d.date].push(d);
    return acc;
  }, {});

  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  const getCat = (id: string) => EXPENSE_CATEGORIES.find(c => c.id === id);

  return (
    <div className="p-4 space-y-4">
      {/* Summary */}
      <div className="bg-gradient-to-br from-slate-700 to-slate-900 rounded-2xl p-4 text-white">
        <p className="text-slate-300 text-sm">Gastos variáveis no mês</p>
        <p className="text-3xl font-bold mt-1">{formatCurrency(totalSpent)}</p>
        <p className="text-slate-400 text-xs mt-1">
          {formatPercent(percent)} da sua renda · {monthExpenses.length} lançamento{monthExpenses.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Category filter */}
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        <button
          onClick={() => setFilterCat('')}
          className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium ${!filterCat ? 'bg-[#4361EE] text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}
        >Todos</button>
        {EXPENSE_CATEGORIES.map(cat => (
          <button key={cat.id} onClick={() => setFilterCat(cat.id === filterCat ? '' : cat.id)}
            className={`flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium ${filterCat === cat.id ? 'bg-[#4361EE] text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
            {cat.emoji} {cat.label}
          </button>
        ))}
      </div>

      {/* Expenses list */}
      {filteredExpenses.length === 0 ? (
        <div className="text-center py-12 text-slate-400 text-sm">
          <p className="text-3xl mb-2">🛒</p>
          <p>Nenhum gasto registrado.</p>
          <button onClick={() => setShowModal(true)} className="mt-3 text-[#4361EE] font-medium">+ Registrar gasto</button>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedDates.map(date => (
            <div key={date}>
              <p className="text-xs font-semibold text-slate-400 uppercase mb-1">
                {new Date(date + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'short' })}
              </p>
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden divide-y divide-slate-50 dark:divide-slate-700/50">
                {grouped[date].map(expense => {
                  const cat = getCat(expense.category);
                  return (
                    <div key={expense.id} className="flex items-center gap-3 px-4 py-3">
                      <div className="w-9 h-9 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center text-base flex-shrink-0">
                        {cat?.emoji ?? '📦'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800 dark:text-white truncate">{expense.description}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-500 px-1.5 py-0.5 rounded-full">
                            {cat?.label ?? expense.category}
                          </span>
                          <span className="text-[10px] text-slate-400">{PM_LABELS[expense.paymentMethod]}</span>
                          {expense.installments && (
                            <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full">
                              {expense.installments}x
                            </span>
                          )}
                        </div>
                      </div>
                      <span className={`text-sm font-bold ${expense.paymentMethod === 'credito' ? 'text-purple-600' : 'text-slate-700 dark:text-slate-200'}`}>
                        -{formatCurrency(expense.amount)}
                      </span>
                      <div className="flex gap-1 ml-1">
                        <button onClick={() => setEditing(expense)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700">
                          <Pencil size={13} className="text-slate-400" />
                        </button>
                        <button onClick={() => { deleteDailyExpense(expense.id); toast('Gasto removido'); }} className="p-1.5 rounded-lg hover:bg-red-50">
                          <Trash2 size={13} className="text-red-400" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* FAB */}
      <button
        onClick={() => setShowModal(true)}
        className="fixed bottom-20 right-4 w-14 h-14 bg-[#4361EE] text-white rounded-full shadow-xl flex items-center justify-center z-30 hover:bg-[#3451d1] active:scale-95 transition-all"
      >
        <Plus size={24} />
      </button>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Novo Gasto">
        <AddExpenseForm month={currentMonth} year={currentYear}
          onSubmit={data => { addDailyExpense(data); setShowModal(false); toast('Gasto adicionado'); }}
          onCancel={() => setShowModal(false)} />
      </Modal>

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Editar Gasto">
        {editing && (
          <AddExpenseForm initial={editing} month={currentMonth} year={currentYear}
            onSubmit={data => { updateDailyExpense(editing.id, data); setEditing(null); toast('Gasto atualizado'); }}
            onCancel={() => setEditing(null)} />
        )}
      </Modal>
    </div>
  );
}
