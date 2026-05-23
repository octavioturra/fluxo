import { useState, useMemo } from 'react';
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatCurrency, formatPercent, getFixedHealth, getFixedHealthLabel, getFixedHealthColor } from '../lib/finance';
import { CategoryTags } from '../components/ui/CategoryTags';
import { Modal } from '../components/ui/Modal';
import { FIXED_CATEGORIES } from '../types';
import type { FixedExpense } from '../types';

function FixedForm({ initial, onSubmit, onCancel }: {
  initial?: Partial<FixedExpense>;
  onSubmit: (data: Omit<FixedExpense, 'id' | 'userId'>) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [category, setCategory] = useState(initial?.category ?? 'moradia');
  const [amount, setAmount] = useState(initial?.amount?.toString() ?? '');
  const [dueDay, setDueDay] = useState(initial?.dueDay?.toString() ?? '10');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(amount.replace(',', '.'));
    if (!parsed || !name) return;
    onSubmit({ name, category, amount: parsed, dueDay: parseInt(dueDay), active: initial?.active ?? true });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase">Nome</label>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Aluguel, Netflix..."
          className="w-full py-2.5 px-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase">Categoria</label>
        <CategoryTags categories={FIXED_CATEGORIES} selected={category} onChange={setCategory} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase">Valor (R$)</label>
          <input type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0,00"
            className="w-full py-2.5 px-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase">Dia vencimento</label>
          <input type="number" min="1" max="31" value={dueDay} onChange={e => setDueDay(e.target.value)}
            className="w-full py-2.5 px-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
        </div>
      </div>
      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onCancel} className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-medium text-sm">Cancelar</button>
        <button type="submit" className="flex-1 py-3 rounded-xl bg-emerald-600 text-white font-semibold text-sm">Salvar</button>
      </div>
    </form>
  );
}

const healthColorMap: Record<string, string> = {
  green: 'from-green-500 to-green-700',
  blue: 'from-blue-500 to-blue-700',
  yellow: 'from-yellow-400 to-yellow-600',
  red: 'from-red-500 to-red-700',
};

export function FixosPage() {
  const { incomes, fixedExpenses, currentMonth, currentYear, addFixedExpense, updateFixedExpense, deleteFixedExpense } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<FixedExpense | null>(null);

  const totalIncome = useMemo(() =>
    incomes.filter(i => i.month === currentMonth && i.year === currentYear).reduce((s, i) => s + i.amount, 0),
    [incomes, currentMonth, currentYear]
  );

  const activeFixeds = fixedExpenses.filter(f => f.active);
  const totalFixed = activeFixeds.reduce((s, f) => s + f.amount, 0);
  const percent = totalIncome > 0 ? (totalFixed / totalIncome) * 100 : 0;
  const health = getFixedHealth(percent);
  const healthColor = getFixedHealthColor(health);

  const byCategory = FIXED_CATEGORIES.map(cat => ({
    ...cat,
    items: fixedExpenses.filter(f => f.category === cat.id),
  })).filter(c => c.items.length > 0);

  const uncategorized = fixedExpenses.filter(f => !FIXED_CATEGORIES.find(c => c.id === f.category));

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-lg text-slate-800 dark:text-white">Gastos Fixos</h2>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 text-white rounded-xl text-sm font-semibold">
          <Plus size={16} /> Adicionar
        </button>
      </div>

      {/* Health card */}
      <div className={`bg-gradient-to-br ${healthColorMap[healthColor] ?? 'from-slate-500 to-slate-700'} rounded-2xl p-4 text-white`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white/80 text-sm">Total de gastos fixos</p>
            <p className="text-3xl font-bold mt-1">{formatCurrency(totalFixed)}</p>
            <p className="text-white/80 text-xs mt-1">{formatPercent(percent)} da receita mensal</p>
          </div>
          <div className="text-right">
            <span className="text-sm font-bold bg-white/20 px-3 py-1 rounded-full">
              {getFixedHealthLabel(health)}
            </span>
          </div>
        </div>
        <div className="mt-3 text-xs text-white/70">
          {health === 'recomendado' && '✓ Gastos fixos muito saudáveis (até 20% da receita)'}
          {health === 'excelente' && '✓ Boa gestão dos comprometimentos fixos (21–30%)'}
          {health === 'alerta' && '⚠️ Gastos fixos elevados — atenção (31–50%)'}
          {health === 'critico' && '🔴 Gastos fixos comprometem o orçamento (>51%)'}
        </div>
      </div>

      {/* Categories */}
      {byCategory.length === 0 && uncategorized.length === 0 ? (
        <div className="text-center py-12 text-slate-400 text-sm">
          <p className="text-3xl mb-2">📋</p>
          <p>Nenhum gasto fixo cadastrado.</p>
          <button onClick={() => setShowModal(true)} className="mt-3 text-emerald-600 font-medium">+ Adicionar gasto fixo</button>
        </div>
      ) : (
        <div className="space-y-3">
          {byCategory.map(cat => (
            <div key={cat.id} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden">
              <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-700/50 flex items-center justify-between border-b border-slate-100 dark:border-slate-700">
                <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">{cat.emoji} {cat.label}</span>
                <span className="text-sm font-bold text-slate-700 dark:text-white">
                  {formatCurrency(cat.items.reduce((s, i) => s + i.amount, 0))}
                </span>
              </div>
              <div className="divide-y divide-slate-50 dark:divide-slate-700/50">
                {cat.items.map(item => (
                  <FixedItem key={item.id} item={item}
                    onEdit={() => setEditing(item)}
                    onDelete={() => deleteFixedExpense(item.id)}
                    onToggle={() => updateFixedExpense(item.id, { active: !item.active })}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Novo Gasto Fixo">
        <FixedForm onSubmit={data => { addFixedExpense(data); setShowModal(false); }} onCancel={() => setShowModal(false)} />
      </Modal>

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Editar Gasto Fixo">
        {editing && (
          <FixedForm initial={editing}
            onSubmit={data => { updateFixedExpense(editing.id, data); setEditing(null); }}
            onCancel={() => setEditing(null)} />
        )}
      </Modal>
    </div>
  );
}

function FixedItem({ item, onEdit, onDelete, onToggle }: {
  item: FixedExpense; onEdit: () => void; onDelete: () => void; onToggle: () => void;
}) {
  return (
    <div className={`flex items-center gap-3 px-4 py-3 ${!item.active ? 'opacity-50' : ''}`}>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium truncate ${item.active ? 'text-slate-800 dark:text-white' : 'line-through text-slate-400'}`}>
          {item.name}
        </p>
        <p className="text-xs text-slate-400">Vence dia {item.dueDay}</p>
      </div>
      <span className="font-bold text-slate-700 dark:text-slate-200 text-sm">{formatCurrency(item.amount)}</span>
      <div className="flex gap-1">
        <button onClick={onToggle} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700">
          {item.active ? <ToggleRight size={16} className="text-emerald-500" /> : <ToggleLeft size={16} className="text-slate-400" />}
        </button>
        <button onClick={onEdit} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700">
          <Pencil size={14} className="text-slate-400" />
        </button>
        <button onClick={onDelete} className="p-1.5 rounded-lg hover:bg-red-50">
          <Trash2 size={14} className="text-red-400" />
        </button>
      </div>
    </div>
  );
}
