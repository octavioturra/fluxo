import { useState } from 'react';
import { format } from 'date-fns';
import { CategoryTags } from '../ui/CategoryTags';
import { EXPENSE_CATEGORIES } from '../../types';
import type { DailyExpense, PaymentMethod } from '../../types';
import { useApp } from '../../context/AppContext';

interface Props {
  month?: number;
  year?: number;
  onSubmit: (expense: Omit<DailyExpense, 'id' | 'userId'>) => void;
  onCancel: () => void;
  initial?: Partial<DailyExpense>;
}

export function AddExpenseForm({ onSubmit, onCancel, initial }: Props) {
  const { creditCards } = useApp();
  const today = format(new Date(), 'yyyy-MM-dd');
  const [amount, setAmount] = useState(initial?.amount?.toString() ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [category, setCategory] = useState(initial?.category ?? 'alimentacao');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(initial?.paymentMethod ?? 'pix');
  const [cardId, setCardId] = useState(initial?.creditCardId ?? creditCards[0]?.id ?? '');
  const [date, setDate] = useState(initial?.date ?? today);
  const [installments, setInstallments] = useState(initial?.installments?.toString() ?? '');
  const [installmentAmount, setInstallmentAmount] = useState(initial?.installmentAmount?.toString() ?? '');
  const [isInstallment, setIsInstallment] = useState(!!initial?.installments);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(amount.replace(',', '.'));
    if (!parsed || parsed <= 0) return;
    const d = new Date(date + 'T12:00:00');
    onSubmit({
      description: description || category,
      category,
      amount: parsed,
      paymentMethod,
      creditCardId: paymentMethod === 'credito' ? cardId : undefined,
      installments: isInstallment && installments ? parseInt(installments) : undefined,
      installmentAmount: isInstallment && installmentAmount ? parseFloat(installmentAmount) : undefined,
      date,
      month: d.getMonth() + 1,
      year: d.getFullYear(),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Amount */}
      <div>
        <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Valor</label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">R$</span>
          <input
            type="number"
            step="0.01"
            min="0"
            placeholder="0,00"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            autoFocus
            className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-xl font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Category */}
      <div>
        <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Categoria</label>
        <CategoryTags categories={EXPENSE_CATEGORIES} selected={category} onChange={setCategory} />
      </div>

      {/* Payment method */}
      <div>
        <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Pagamento</label>
        <div className="flex gap-2 flex-wrap">
          {(['dinheiro', 'pix', 'debito', 'credito'] as PaymentMethod[]).map(pm => (
            <button
              key={pm}
              type="button"
              onClick={() => setPaymentMethod(pm)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all capitalize ${
                paymentMethod === pm ? 'bg-emerald-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
              }`}
            >
              {pm === 'dinheiro' ? '💵 Dinheiro' : pm === 'pix' ? '⚡ Pix' : pm === 'debito' ? '💳 Débito' : '💳 Crédito'}
            </button>
          ))}
        </div>
      </div>

      {/* Credit card options */}
      {paymentMethod === 'credito' && creditCards.length > 0 && (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Cartão</label>
            <select
              value={cardId}
              onChange={e => setCardId(e.target.value)}
              className="w-full py-2.5 px-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {creditCards.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={isInstallment} onChange={e => setIsInstallment(e.target.checked)}
              className="w-4 h-4 accent-emerald-600" />
            <span className="text-sm text-slate-600 dark:text-slate-300">Parcelado</span>
          </label>
          {isInstallment && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Nº de parcelas</label>
                <input type="number" min="2" max="48" value={installments} onChange={e => setInstallments(e.target.value)}
                  placeholder="ex: 3"
                  className="w-full py-2 px-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Valor da parcela</label>
                <input type="number" step="0.01" value={installmentAmount} onChange={e => setInstallmentAmount(e.target.value)}
                  placeholder="R$ 0,00"
                  className="w-full py-2 px-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Description */}
      <div>
        <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Descrição (opcional)</label>
        <input
          type="text"
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Ex: Almoço, Uber, Mercado..."
          className="w-full py-2.5 px-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>

      {/* Date */}
      <div>
        <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Data</label>
        <input
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          className="w-full py-2.5 px-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onCancel}
          className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 font-medium text-sm">
          Cancelar
        </button>
        <button type="submit"
          className="flex-1 py-3 rounded-xl bg-emerald-600 text-white font-semibold text-sm hover:bg-emerald-700 transition-colors">
          Salvar
        </button>
      </div>
    </form>
  );
}
