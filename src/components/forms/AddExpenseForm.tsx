import { useState } from 'react';
import { format } from 'date-fns';
import { EXPENSE_CATEGORIES } from '../../types';
import type { DailyExpense, PaymentMethod } from '../../types';
import { useApp } from '../../context/AppContext';
import { Icon } from '../ui/Icon';

const PM_OPTIONS = [
  { id: 'dinheiro', icon: 'payments',     label: 'Dinheiro' },
  { id: 'pix',      icon: 'bolt',         label: 'Pix' },
  { id: 'debito',   icon: 'credit_card',  label: 'Débito' },
  { id: 'credito',  icon: 'credit_score', label: 'Crédito' },
] as const;

const INSTALLMENT_OPTS = [1, 2, 3, 6, 10, 12];

const inputStyle = {
  background: 'var(--fx-surface-container)',
  border: '1px solid var(--fx-outline-variant)',
  color: 'var(--fx-on-surface)',
};

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
  const [installments, setInstallments] = useState(initial?.installments ?? 1);

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
      installments: paymentMethod === 'credito' && installments > 1 ? installments : undefined,
      installmentAmount: paymentMethod === 'credito' && installments > 1 ? parsed / installments : undefined,
      date,
      month: d.getMonth() + 1,
      year: d.getFullYear(),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Amount */}
      <div
        className="rounded-2xl p-4"
        style={{ background: 'var(--fx-surface-container)' }}
      >
        <div className="text-[11px] font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--fx-on-surface-variant)' }}>
          Valor
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-base opacity-60" style={{ color: 'var(--fx-on-surface)' }}>R$</span>
          <input
            type="number" step="0.01" min="0" placeholder="0,00"
            value={amount} onChange={e => setAmount(e.target.value)} autoFocus
            className="flex-1 text-3xl font-light outline-none bg-transparent"
            style={{ color: 'var(--fx-on-surface)' }}
          />
        </div>
        <div className="text-xs mt-1" style={{ color: 'var(--fx-on-surface-variant)' }}>
          Toque para editar
        </div>
      </div>

      {/* Category */}
      <div>
        <div className="text-xs font-semibold uppercase mb-2" style={{ color: 'var(--fx-on-surface-variant)' }}>
          Categoria
        </div>
        <div className="flex flex-wrap gap-2">
          {EXPENSE_CATEGORIES.map(cat => {
            const sel = category === cat.id;
            return (
              <button
                key={cat.id} type="button"
                onClick={() => setCategory(cat.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all"
                style={{
                  background: sel ? 'var(--fx-secondary-container)' : 'var(--fx-surface-container)',
                  color: sel ? 'var(--fx-on-secondary-container)' : 'var(--fx-on-surface-variant)',
                }}
              >
                <Icon name={cat.icon} size={15} />
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Payment method */}
      <div>
        <div className="text-xs font-semibold uppercase mb-2" style={{ color: 'var(--fx-on-surface-variant)' }}>
          Método de pagamento
        </div>
        <div className="grid grid-cols-4 gap-2">
          {PM_OPTIONS.map(pm => {
            const sel = paymentMethod === pm.id;
            return (
              <button
                key={pm.id} type="button"
                onClick={() => setPaymentMethod(pm.id as PaymentMethod)}
                className="flex flex-col items-center gap-1 py-2.5 rounded-xl text-xs font-medium transition-all"
                style={{
                  background: sel ? 'var(--fx-secondary-container)' : 'var(--fx-surface-container)',
                  color: sel ? 'var(--fx-on-secondary-container)' : 'var(--fx-on-surface-variant)',
                }}
              >
                <Icon name={pm.icon} size={20} />
                {pm.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Credit — card + installments */}
      {paymentMethod === 'credito' && (
        <div className="space-y-3">
          {creditCards.length > 0 && (
            <div>
              <div className="text-xs font-semibold uppercase mb-2" style={{ color: 'var(--fx-on-surface-variant)' }}>
                Cartão
              </div>
              <select
                value={cardId} onChange={e => setCardId(e.target.value)}
                className="w-full py-2.5 px-3 rounded-xl text-sm outline-none"
                style={inputStyle}
              >
                {creditCards.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          )}
          <div>
            <div className="text-xs font-semibold uppercase mb-2" style={{ color: 'var(--fx-on-surface-variant)' }}>
              Parcelamento
            </div>
            <div className="flex flex-wrap gap-2">
              {INSTALLMENT_OPTS.map(n => {
                const sel = installments === n;
                return (
                  <button
                    key={n} type="button"
                    onClick={() => setInstallments(n)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium transition-all"
                    style={{
                      background: sel ? 'var(--fx-secondary-container)' : 'var(--fx-surface-container)',
                      color: sel ? 'var(--fx-on-secondary-container)' : 'var(--fx-on-surface-variant)',
                    }}
                  >
                    {sel && <Icon name="check" size={13} />}
                    {n}x
                  </button>
                );
              })}
            </div>
            {installments > 1 && amount && (
              <div
                className="mt-2 flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium"
                style={{ background: 'var(--fx-yellow-bg)', color: 'var(--fx-yellow-fg)' }}
              >
                <Icon name="info" size={15} />
                {installments}x de R$ {(parseFloat(amount) / installments).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} por fatura
              </div>
            )}
          </div>
        </div>
      )}

      {/* Description */}
      <div>
        <div className="text-xs font-semibold uppercase mb-2" style={{ color: 'var(--fx-on-surface-variant)' }}>
          Descrição (opcional)
        </div>
        <input
          type="text" value={description} onChange={e => setDescription(e.target.value)}
          placeholder="Ex: Almoço com a equipe"
          className="w-full py-2.5 px-3 rounded-xl text-sm outline-none"
          style={inputStyle}
        />
      </div>

      {/* Date */}
      <div>
        <div className="text-xs font-semibold uppercase mb-2" style={{ color: 'var(--fx-on-surface-variant)' }}>
          Data
        </div>
        <input
          type="date" value={date} onChange={e => setDate(e.target.value)}
          className="w-full py-2.5 px-3 rounded-xl text-sm outline-none"
          style={inputStyle}
        />
      </div>

      <div className="flex gap-3 pt-1">
        <button type="button" onClick={onCancel}
          className="flex-1 py-3 rounded-full text-sm font-medium"
          style={{ border: '1px solid var(--fx-outline-variant)', color: 'var(--fx-on-surface)' }}>
          Cancelar
        </button>
        <button type="submit"
          className="flex-1 py-3 rounded-full text-sm font-semibold flex items-center justify-center gap-1.5"
          style={{ background: 'var(--fx-primary)', color: 'var(--fx-on-primary)' }}>
          <Icon name="check" size={18} />
          Lançar gasto
        </button>
      </div>
    </form>
  );
}
