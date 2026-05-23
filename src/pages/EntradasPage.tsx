import { useState, useMemo } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatCurrency } from '../lib/finance';
import { MonthPicker } from '../components/ui/MonthPicker';
import { Modal } from '../components/ui/Modal';
import type { Income } from '../types';

const TYPE_LABELS: Record<string, string> = {
  clt: 'CLT', pj: 'PJ / Autônomo', aposentado: 'Aposentado', variavel: 'Variável', outro: 'Outro',
};

function IncomeForm({ initial, onSubmit, onCancel, month, year }: {
  initial?: Partial<Income>;
  onSubmit: (data: Omit<Income, 'id' | 'userId'>) => void;
  onCancel: () => void;
  month: number;
  year: number;
}) {
  const [source, setSource] = useState(initial?.source ?? '');
  const [type, setType] = useState<Income['type']>(initial?.type ?? 'clt');
  const [amount, setAmount] = useState(initial?.amount?.toString() ?? '');
  const [day, setDay] = useState(initial?.day?.toString() ?? '5');
  const [isEstimated, setIsEstimated] = useState(initial?.isEstimated ?? false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(amount.replace(',', '.'));
    if (!parsed || !source) return;
    onSubmit({ source, type: type as Income['type'], amount: parsed, day: parseInt(day), month, year, isEstimated });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase">Fonte</label>
        <input value={source} onChange={e => setSource(e.target.value)} placeholder="Ex: Salário, Freela..."
          className="w-full py-2.5 px-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase">Tipo</label>
        <div className="flex flex-wrap gap-2">
          {Object.entries(TYPE_LABELS).map(([k, v]) => (
            <button key={k} type="button" onClick={() => setType(k as Income['type'])}
              className={`px-3 py-1.5 rounded-full text-sm font-medium ${type === k ? 'bg-emerald-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
              {v}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase">Valor (R$)</label>
          <input type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0,00"
            className="w-full py-2.5 px-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase">Dia do mês</label>
          <input type="number" min="1" max="31" value={day} onChange={e => setDay(e.target.value)}
            className="w-full py-2.5 px-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
        </div>
      </div>
      {(type === 'pj' || type === 'variavel') && (
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={isEstimated} onChange={e => setIsEstimated(e.target.checked)} className="w-4 h-4 accent-emerald-600" />
          <span className="text-sm text-slate-600 dark:text-slate-300">Valor estimado (renda variável)</span>
        </label>
      )}
      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onCancel} className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-600 font-medium text-sm">Cancelar</button>
        <button type="submit" className="flex-1 py-3 rounded-xl bg-emerald-600 text-white font-semibold text-sm">Salvar</button>
      </div>
    </form>
  );
}

export function EntradasPage() {
  const { incomes, currentMonth, currentYear, setCurrentPeriod, addIncome, updateIncome, deleteIncome } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Income | null>(null);

  const monthIncomes = useMemo(() =>
    incomes.filter(i => i.month === currentMonth && i.year === currentYear),
    [incomes, currentMonth, currentYear]
  );

  const total = monthIncomes.reduce((s, i) => s + i.amount, 0);

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <MonthPicker month={currentMonth} year={currentYear} onChange={setCurrentPeriod} />
        <button onClick={() => setShowModal(true)} className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 text-white rounded-xl text-sm font-semibold">
          <Plus size={16} /> Adicionar
        </button>
      </div>

      {/* Summary card */}
      <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-2xl p-4 text-white">
        <p className="text-emerald-100 text-sm">Total de entradas</p>
        <p className="text-3xl font-bold mt-1">{formatCurrency(total)}</p>
        <p className="text-emerald-200 text-xs mt-1">{monthIncomes.length} fonte{monthIncomes.length !== 1 ? 's' : ''} de renda</p>
      </div>

      {/* List */}
      {monthIncomes.length === 0 ? (
        <div className="text-center py-12 text-slate-400 text-sm">
          <p className="text-3xl mb-2">💰</p>
          <p>Nenhuma entrada cadastrada neste mês.</p>
          <button onClick={() => setShowModal(true)} className="mt-3 text-emerald-600 font-medium">+ Adicionar entrada</button>
        </div>
      ) : (
        <div className="space-y-2">
          {monthIncomes.map(income => (
            <div key={income.id} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-lg">💰</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-slate-800 dark:text-white truncate">{income.source}</p>
                  {income.isEstimated && (
                    <span className="text-[10px] bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded-full font-medium">estimado</span>
                  )}
                </div>
                <p className="text-xs text-slate-400">{TYPE_LABELS[income.type]} · dia {income.day}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-emerald-600">{formatCurrency(income.amount)}</p>
              </div>
              <div className="flex gap-1 ml-1">
                <button onClick={() => setEditing(income)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700">
                  <Pencil size={14} className="text-slate-400" />
                </button>
                <button onClick={() => deleteIncome(income.id)} className="p-1.5 rounded-lg hover:bg-red-50">
                  <Trash2 size={14} className="text-red-400" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Nova Entrada">
        <IncomeForm month={currentMonth} year={currentYear}
          onSubmit={data => { addIncome(data); setShowModal(false); }}
          onCancel={() => setShowModal(false)} />
      </Modal>

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Editar Entrada">
        {editing && (
          <IncomeForm initial={editing} month={currentMonth} year={currentYear}
            onSubmit={data => { updateIncome(editing.id, data); setEditing(null); }}
            onCancel={() => setEditing(null)} />
        )}
      </Modal>
    </div>
  );
}
