import { useState, useMemo } from 'react';
import { Plus, Pencil, Bell } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useApp } from '../context/AppContext';
import { formatCurrency } from '../lib/finance';
import { SAVINGS_CATEGORIES } from '../types';
import { Modal } from '../components/ui/Modal';
import type { SavingEntry } from '../types';

const MONTHS_SHORT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const CHART_COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4', '#84cc16'];

export function EconomiasPage() {
  const { savings, currentMonth, currentYear, addSaving, updateSaving, user } = useApp();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedLines, setSelectedLines] = useState<string[]>(['total']);

  const allCategories = useMemo(() => {
    const cats = new Map<string, string>();
    SAVINGS_CATEGORIES.forEach(c => cats.set(c.id, c.label));
    savings.forEach(s => {
      if (!cats.has(s.category)) cats.set(s.category, s.categoryLabel);
    });
    return Array.from(cats.entries()).map(([id, label]) => {
      const emoji = SAVINGS_CATEGORIES.find(c => c.id === id)?.emoji ?? '💰';
      return { id, label, emoji };
    });
  }, [savings]);

  const currentMonthSavings = savings.filter(s => s.month === currentMonth && s.year === currentYear);
  const previousMonthSavings = useMemo(() => {
    const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;
    return savings.filter(s => s.month === prevMonth && s.year === prevYear);
  }, [savings, currentMonth, currentYear]);

  const totalCurrent = currentMonthSavings.reduce((s, sv) => s + sv.amount, 0);
  const totalPrevious = previousMonthSavings.reduce((s, sv) => s + sv.amount, 0);
  const totalVariation = totalCurrent - totalPrevious;

  // Build chart data (last 6 months)
  const chartData = useMemo(() => {
    const months: { month: number; year: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      let m = currentMonth - i;
      let y = currentYear;
      while (m <= 0) { m += 12; y--; }
      months.push({ month: m, year: y });
    }

    return months.map(({ month, year }) => {
      const monthSavings = savings.filter(s => s.month === month && s.year === year);
      const data: Record<string, number | string> = {
        name: `${MONTHS_SHORT[month - 1]}/${year}`,
      };
      let total = 0;
      allCategories.forEach(cat => {
        const entry = monthSavings.find(s => s.category === cat.id);
        data[cat.id] = entry?.amount ?? 0;
        total += entry?.amount ?? 0;
      });
      data.total = total;
      return data;
    });
  }, [savings, currentMonth, currentYear, allCategories]);

  const toggleLine = (id: string) => {
    setSelectedLines(prev => prev.includes(id) ? prev.filter(l => l !== id) : [...prev, id]);
  };

  const getCatIncrement = (catId: string) => {
    const curr = currentMonthSavings.find(s => s.category === catId)?.amount ?? 0;
    const prev = previousMonthSavings.find(s => s.category === catId)?.amount ?? 0;
    return curr - prev;
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-lg text-slate-800 dark:text-white">Economias</h2>
        <div className="flex gap-2">
          <button className="p-2 bg-slate-100 dark:bg-slate-700 rounded-xl" title={`Lembrete: dia ${user.savingsReminderDay} do mês`}>
            <Bell size={16} className="text-slate-500" />
          </button>
          <button onClick={() => setShowAddModal(true)} className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 text-white rounded-xl text-sm font-semibold">
            <Plus size={16} /> Atualizar
          </button>
        </div>
      </div>

      {/* Summary card */}
      <div className="bg-gradient-to-br from-violet-500 to-violet-700 rounded-2xl p-4 text-white">
        <p className="text-violet-200 text-sm">Patrimônio total</p>
        <p className="text-3xl font-bold mt-1">{formatCurrency(totalCurrent)}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className={`text-sm font-semibold px-2 py-0.5 rounded-full ${totalVariation >= 0 ? 'bg-green-400/20 text-green-200' : 'bg-red-400/20 text-red-200'}`}>
            {totalVariation >= 0 ? '+' : ''}{formatCurrency(totalVariation)} este mês
          </span>
        </div>
      </div>

      {/* Category cards */}
      {currentMonthSavings.length === 0 && (
        <div className="text-center py-8 text-slate-400 text-sm">
          <p className="text-3xl mb-2">💼</p>
          <p>Nenhum dado de investimentos este mês.</p>
          <p className="text-xs mt-1">Registre seus saldos atuais em cada categoria.</p>
          <button onClick={() => setShowAddModal(true)} className="mt-3 text-emerald-600 font-medium">+ Registrar agora</button>
        </div>
      )}

      {currentMonthSavings.length > 0 && (
        <div className="space-y-2">
          {currentMonthSavings.map(saving => {
            const cat = allCategories.find(c => c.id === saving.category);
            const increment = getCatIncrement(saving.category);
            const editing = editingId === saving.id;
            return (
              <div key={saving.id} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-4 flex items-center gap-3">
                <span className="text-2xl">{cat?.emoji ?? '💰'}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-800 dark:text-white text-sm">{saving.categoryLabel}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`text-xs font-semibold ${increment > 0 ? 'text-green-600' : increment < 0 ? 'text-red-600' : 'text-slate-400'}`}>
                      {increment > 0 ? '+' : ''}{formatCurrency(increment)}
                    </span>
                    <span className="text-xs text-slate-300">vs mês anterior</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-slate-800 dark:text-white">{formatCurrency(saving.amount)}</p>
                </div>
                <button onClick={() => setEditingId(editing ? null : saving.id)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700">
                  <Pencil size={14} className="text-slate-400" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Chart */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-4">
        <h3 className="font-semibold text-slate-700 dark:text-white text-sm mb-3">Evolução do patrimônio</h3>

        {/* Line toggles */}
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => toggleLine('total')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${selectedLines.includes('total') ? 'bg-slate-800 text-white border-slate-800' : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-600'}`}
          >
            <span className="w-2 h-2 rounded-full bg-slate-700 inline-block" />
            Total
          </button>
          {allCategories.map((cat, idx) => (
            <button
              key={cat.id}
              onClick={() => toggleLine(cat.id)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${selectedLines.includes(cat.id) ? 'text-white border-transparent' : 'text-slate-500 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800'}`}
              style={selectedLines.includes(cat.id) ? { backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] } : {}}
            >
              <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }} />
              {cat.emoji} {cat.label}
            </button>
          ))}
        </div>

        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
            <XAxis dataKey="name" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
            <Tooltip
              formatter={(value: unknown) => [formatCurrency(Number(value)), '']}
              labelStyle={{ fontSize: 12 }}
              contentStyle={{ fontSize: 12, borderRadius: 8 }}
            />
            {selectedLines.includes('total') && (
              <Line type="monotone" dataKey="total" stroke="#1e293b" strokeWidth={2.5} dot={false} name="Total" />
            )}
            {allCategories.map((cat, idx) =>
              selectedLines.includes(cat.id) ? (
                <Line key={cat.id} type="monotone" dataKey={cat.id}
                  stroke={CHART_COLORS[idx % CHART_COLORS.length]} strokeWidth={2}
                  dot={false} name={cat.label} />
              ) : null
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <Modal open={showAddModal} onClose={() => setShowAddModal(false)} title="Atualizar Economias">
        <SavingsForm
          month={currentMonth}
          year={currentYear}
          existingCategories={currentMonthSavings}
          allCategories={allCategories}
          onSubmit={(data) => {
            const existing = currentMonthSavings.find(s => s.category === data.category);
            if (existing) {
              updateSaving(existing.id, { amount: data.amount });
            } else {
              addSaving(data);
            }
            setShowAddModal(false);
          }}
          onCancel={() => setShowAddModal(false)}
        />
      </Modal>
    </div>
  );
}

function SavingsForm({ month, year, existingCategories, allCategories, onSubmit, onCancel }: {
  month: number;
  year: number;
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
    if (parsed < 0 || !selectedCat) return;
    onSubmit({ category: selectedCat, categoryLabel: catLabel, amount: parsed, month, year });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Categoria</label>
        <div className="flex flex-wrap gap-2">
          {SAVINGS_CATEGORIES.map(cat => (
            <button key={cat.id} type="button" onClick={() => { setIsCustom(false); handleCategoryChange(cat.id); }}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium ${!isCustom && category === cat.id ? 'bg-emerald-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
              {cat.emoji} {cat.label}
            </button>
          ))}
          <button type="button" onClick={() => setIsCustom(true)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium ${isCustom ? 'bg-emerald-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
            ➕ Personalizada
          </button>
        </div>
        {isCustom && (
          <input value={customCategory} onChange={e => setCustomCategory(e.target.value)}
            placeholder="Nome da categoria"
            className="mt-2 w-full py-2.5 px-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
        )}
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase">Saldo atual (R$)</label>
        <p className="text-xs text-slate-400 mb-1.5">Informe o valor total que você tem investido nesta categoria hoje.</p>
        <input type="number" step="0.01" min="0" value={amount} onChange={e => setAmount(e.target.value)}
          placeholder="0,00" autoFocus
          className="w-full py-3 px-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-xl font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500" />
      </div>
      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onCancel} className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-medium text-sm">Cancelar</button>
        <button type="submit" className="flex-1 py-3 rounded-xl bg-emerald-600 text-white font-semibold text-sm">Salvar</button>
      </div>
    </form>
  );
}
