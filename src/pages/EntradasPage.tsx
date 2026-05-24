import { useState, useMemo } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useToast } from '../components/ui/Toast';
import { Icon } from '../components/ui/Icon';
import type { Income } from '../types';

const TIPOS = [
  { id: 'clt',     icon: 'work',            label: 'Salário CLT' },
  { id: 'pj',      icon: 'receipt_long',    label: 'PJ · NF' },
  { id: 'passiva', icon: 'key',             label: 'Renda passiva' },
  { id: 'freela',  icon: 'handshake',       label: 'Freela' },
  { id: 'outros',  icon: 'category',        label: 'Outros' },
] as const;

type TipoId = typeof TIPOS[number]['id'];

function brlInt(n: number) { return Math.round(n).toLocaleString('pt-BR'); }
function brlFull(n: number) {
  return n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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
        className="fixed left-1/2 bottom-0 w-full sm:max-w-[440px] z-50 rounded-t-3xl overflow-y-auto"
        style={{
          background: 'var(--fx-surface-container-low)',
          maxHeight: '92%',
          transform: `translateX(-50%) translateY(${open ? '0' : '100%'})`,
          transition: 'transform 320ms cubic-bezier(0.2,0,0,1)',
        }}
      >
        <div className="w-8 h-1 rounded-full mx-auto mt-3 mb-1" style={{ background: 'var(--fx-outline-variant)' }} />
        {children}
      </div>
    </>
  );
}

function IncomeForm({ initial, onSubmit, onCancel, month, year }: {
  initial?: Partial<Income>;
  onSubmit: (data: Omit<Income, 'id' | 'userId'>) => void;
  onCancel: () => void;
  month: number;
  year: number;
}) {
  const [source, setSource] = useState(initial?.source ?? '');
  const [type, setType] = useState<TipoId>((initial?.type as TipoId) ?? 'clt');
  const [amount, setAmount] = useState(initial?.amount?.toString() ?? '');
  const [day, setDay] = useState(initial?.day ?? 5);
  const [isRecorrente, setIsRecorrente] = useState(true);
  const [isEstimated, setIsEstimated] = useState(initial?.isEstimated ?? false);

  const tipoObj = TIPOS.find(t => t.id === type);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(amount.replace(',', '.'));
    if (!parsed || !source) return;
    onSubmit({ source, type, amount: parsed, day, month, year, isEstimated: type === 'pj' ? isEstimated : false });
  };

  return (
    <form onSubmit={handleSubmit} className="px-6 pb-8 space-y-5">
      <div>
        <div className="text-2xl font-normal mb-0.5" style={{ color: 'var(--fx-on-surface)' }}>
          {initial ? 'Editar entrada' : 'Nova entrada'}
        </div>
        <div className="text-sm mb-4" style={{ color: 'var(--fx-on-surface-variant)' }}>
          Cadastre uma fonte de renda do mês
        </div>
      </div>

      {/* Amount display */}
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
            type="number" step="0.01" value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder="0,00"
            className="flex-1 text-3xl font-light outline-none bg-transparent"
            style={{ color: 'var(--fx-on-surface)' }}
          />
        </div>
        <div className="text-xs mt-1" style={{ color: 'var(--fx-on-surface-variant)' }}>
          {isEstimated ? 'Valor estimado · você ajusta quando receber' : 'Informe o valor líquido'}
        </div>
      </div>

      {/* Tipo de entrada */}
      <div>
        <div className="text-xs font-semibold uppercase mb-2" style={{ color: 'var(--fx-on-surface-variant)' }}>
          Tipo de entrada
        </div>
        <div className="flex flex-wrap gap-2">
          {TIPOS.map(t => {
            const sel = type === t.id;
            return (
              <button
                key={t.id} type="button"
                onClick={() => { setType(t.id); if (t.id !== 'pj') setIsEstimated(false); }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all"
                style={{
                  background: sel ? 'var(--fx-secondary-container)' : 'var(--fx-surface-container)',
                  color: sel ? 'var(--fx-on-secondary-container)' : 'var(--fx-on-surface-variant)',
                }}
              >
                <Icon name={t.icon} size={15} />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Descrição */}
      <div>
        <div className="text-xs font-semibold uppercase mb-2" style={{ color: 'var(--fx-on-surface-variant)' }}>
          Descrição
        </div>
        <input
          value={source} onChange={e => setSource(e.target.value)}
          placeholder="Ex: Salário · TechBrasil"
          className="w-full py-2.5 px-3 rounded-xl text-sm outline-none"
          style={{ background: 'var(--fx-surface-container)', border: '1px solid var(--fx-outline-variant)', color: 'var(--fx-on-surface)' }}
        />
      </div>

      {/* Dia do recebimento */}
      <div
        className="rounded-xl px-4 py-3 flex items-center justify-between"
        style={{ background: 'var(--fx-surface-container)' }}
      >
        <div>
          <div className="text-sm font-medium" style={{ color: 'var(--fx-on-surface)' }}>Dia do recebimento</div>
          <div className="text-xs" style={{ color: 'var(--fx-on-surface-variant)' }}>Dia do mês que entra na conta</div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setDay(d => Math.max(1, d - 1))}
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: 'var(--fx-surface-container-high)', color: 'var(--fx-on-surface)' }}
          >
            <Icon name="remove" size={16} />
          </button>
          <span className="w-6 text-center text-sm font-semibold" style={{ color: 'var(--fx-on-surface)' }}>{day}</span>
          <button
            type="button"
            onClick={() => setDay(d => Math.min(31, d + 1))}
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: 'var(--fx-surface-container-high)', color: 'var(--fx-on-surface)' }}
          >
            <Icon name="add" size={16} />
          </button>
        </div>
      </div>

      {/* Toggles */}
      <div className="space-y-2">
        <button
          type="button"
          onClick={() => setIsRecorrente(v => !v)}
          className="w-full flex items-center gap-3 rounded-xl px-4 py-3"
          style={{ background: 'var(--fx-surface-container)' }}
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: 'var(--fx-secondary-container)', color: 'var(--fx-on-secondary-container)' }}
          >
            <Icon name="autorenew" size={18} />
          </div>
          <div className="flex-1 text-left">
            <div className="text-sm font-medium" style={{ color: 'var(--fx-on-surface)' }}>Recorrente</div>
            <div className="text-xs" style={{ color: 'var(--fx-on-surface-variant)' }}>Lançar automaticamente todo mês</div>
          </div>
          <SwitchToggle value={isRecorrente} />
        </button>

        {type === 'pj' && (
          <button
            type="button"
            onClick={() => setIsEstimated(v => !v)}
            className="w-full flex items-center gap-3 rounded-xl px-4 py-3"
            style={{ background: 'var(--fx-surface-container)' }}
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: 'var(--fx-tertiary-container)', color: 'var(--fx-on-tertiary-container)' }}
            >
              <Icon name="schedule" size={18} />
            </div>
            <div className="flex-1 text-left">
              <div className="text-sm font-medium" style={{ color: 'var(--fx-on-surface)' }}>Valor estimado</div>
              <div className="text-xs" style={{ color: 'var(--fx-on-surface-variant)' }}>Usado para projeção até a NF ser emitida</div>
            </div>
            <SwitchToggle value={isEstimated} />
          </button>
        )}
      </div>

      <div className="flex gap-3 pt-1">
        <button
          type="button" onClick={onCancel}
          className="flex-1 py-3 rounded-full text-sm font-medium"
          style={{ border: '1px solid var(--fx-outline-variant)', color: 'var(--fx-on-surface)' }}
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="flex-1 py-3 rounded-full text-sm font-semibold flex items-center justify-center gap-1.5"
          style={{ background: 'var(--fx-primary)', color: 'var(--fx-on-primary)' }}
        >
          <Icon name="check" size={18} />
          Salvar entrada
        </button>
      </div>
    </form>
  );
}

function SwitchToggle({ value }: { value: boolean }) {
  return (
    <div
      className="w-12 h-6 rounded-full flex-shrink-0 relative transition-colors duration-200"
      style={{ background: value ? 'var(--fx-primary)' : 'var(--fx-surface-container-high)' }}
    >
      <div
        className="absolute top-1 w-4 h-4 rounded-full transition-all duration-200 flex items-center justify-center"
        style={{
          left: value ? 'calc(100% - 20px)' : 4,
          background: value ? 'var(--fx-on-primary)' : 'var(--fx-outline)',
        }}
      >
        {value && <Icon name="check" size={11} style={{ color: 'var(--fx-primary)' }} />}
      </div>
    </div>
  );
}

export function EntradasPage() {
  const { incomes, currentMonth, currentYear, addIncome, updateIncome, deleteIncome } = useApp();
  const toast = useToast();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<Income | null>(null);

  const monthIncomes = useMemo(() =>
    incomes.filter(i => i.month === currentMonth && i.year === currentYear),
    [incomes, currentMonth, currentYear]
  );
  const total = monthIncomes.reduce((s, i) => s + i.amount, 0);
  const confirmed = monthIncomes.filter(i => !i.isEstimated).length;

  const getTipoIcon = (type: string) => TIPOS.find(t => t.id === type)?.icon ?? 'payments';
  const getTipoLabel = (type: string) => TIPOS.find(t => t.id === type)?.label ?? type;

  return (
    <div className="flex flex-col pb-6">

      {/* ── Total hero ─── */}
      <div
        className="mx-4 mt-3 rounded-3xl p-6 relative overflow-hidden"
        style={{ background: 'var(--fx-primary-container)', color: 'var(--fx-on-primary-container)' }}
      >
        <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full opacity-20 border" style={{ borderColor: 'currentColor' }} />
        <div className="relative z-10">
          <div className="text-[11px] font-medium uppercase tracking-widest opacity-85 mb-1">
            Total de entradas · {new Date(currentYear, currentMonth - 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
          </div>
          <div style={{ font: '400 40px/48px Roboto', letterSpacing: '-0.01em' }}>
            <span className="text-lg opacity-70 mr-1">R$</span>
            {brlInt(total)}
          </div>
          <div className="text-sm mt-1 opacity-85">
            {monthIncomes.length} fonte{monthIncomes.length !== 1 ? 's' : ''} · {confirmed} confirmada{confirmed !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* ── Section header ─── */}
      <div className="flex items-baseline justify-between px-5 pt-5 pb-2">
        <h2 className="text-base font-medium" style={{ color: 'var(--fx-on-surface)' }}>Suas entradas</h2>
        <button
          onClick={() => setSheetOpen(true)}
          className="text-sm font-medium"
          style={{ color: 'var(--fx-primary)' }}
        >
          Adicionar
        </button>
      </div>

      {/* ── Income list ─── */}
      {monthIncomes.length === 0 ? (
        <div className="text-center py-12 text-sm" style={{ color: 'var(--fx-on-surface-variant)' }}>
          <p className="text-3xl mb-2">💰</p>
          <p>Nenhuma entrada cadastrada neste mês.</p>
          <button onClick={() => setSheetOpen(true)} className="mt-3 font-medium" style={{ color: 'var(--fx-primary)' }}>
            + Adicionar entrada
          </button>
        </div>
      ) : (
        <div
          className="mx-4 rounded-2xl overflow-hidden"
          style={{ background: 'var(--fx-surface-container-low)' }}
        >
          {monthIncomes.map((income, i) => {
            const icon = getTipoIcon(income.type);
            return (
              <div
                key={income.id}
                className="flex items-center gap-3.5 px-4 py-3.5"
                style={{ borderTop: i > 0 ? '1px solid var(--fx-surface-container)' : undefined }}
              >
                <div
                  className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: 'var(--fx-primary-container)', color: 'var(--fx-on-primary-container)' }}
                >
                  <Icon name={icon} size={22} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-sm font-medium truncate" style={{ color: 'var(--fx-on-surface)' }}>{income.source}</span>
                    {income.isEstimated && (
                      <span
                        className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wide"
                        style={{ background: 'var(--fx-yellow-bg)', color: 'var(--fx-yellow-fg)' }}
                      >
                        <Icon name="schedule" size={11} /> Estimado
                      </span>
                    )}
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--fx-on-surface-variant)' }}>
                    {getTipoLabel(income.type)} · recebe dia {income.day}
                  </div>
                </div>
                <div
                  className="text-sm font-semibold"
                  style={{ color: income.isEstimated ? 'var(--fx-on-surface-variant)' : 'var(--fx-green)', fontVariantNumeric: 'tabular-nums' }}
                >
                  <span className="text-[11px] opacity-60 mr-0.5">R$</span>
                  {brlFull(income.amount)}
                </div>
                <div className="flex gap-0.5">
                  <button onClick={() => setEditing(income)} className="p-1.5 rounded-lg">
                    <Pencil size={13} style={{ color: 'var(--fx-on-surface-variant)' }} />
                  </button>
                  <button onClick={() => { deleteIncome(income.id); toast('Entrada removida'); }} className="p-1.5 rounded-lg">
                    <Trash2 size={13} style={{ color: 'var(--fx-red)' }} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Add button ─── */}
      <div className="flex justify-center mt-4 px-4">
        <button
          onClick={() => setSheetOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium"
          style={{ background: 'var(--fx-secondary-container)', color: 'var(--fx-on-secondary-container)' }}
        >
          <Icon name="add" size={16} /> Nova entrada
        </button>
      </div>

      {/* ── Tip card ─── */}
      <div
        className="mx-4 mt-4 rounded-2xl p-4 flex gap-3"
        style={{ background: 'var(--fx-surface-container-low)' }}
      >
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'var(--fx-tertiary-container)', color: 'var(--fx-on-tertiary-container)' }}
        >
          <Icon name="lightbulb" size={20} />
        </div>
        <div>
          <div className="text-sm font-medium mb-0.5" style={{ color: 'var(--fx-on-surface)' }}>Renda variável</div>
          <div className="text-xs leading-relaxed" style={{ color: 'var(--fx-on-surface-variant)' }}>
            Entradas estimadas usam o valor projetado. Quando o pagamento for confirmado, edite o lançamento e o valor diário recalcula sozinho.
          </div>
        </div>
      </div>

      {/* ── New income sheet ─── */}
      <BottomSheet open={sheetOpen} onClose={() => setSheetOpen(false)}>
        <IncomeForm
          month={currentMonth} year={currentYear}
          onSubmit={data => { addIncome(data); setSheetOpen(false); toast('Entrada adicionada'); }}
          onCancel={() => setSheetOpen(false)}
        />
      </BottomSheet>

      {/* ── Edit income sheet ─── */}
      <BottomSheet open={!!editing} onClose={() => setEditing(null)}>
        {editing && (
          <IncomeForm
            initial={editing}
            month={currentMonth} year={currentYear}
            onSubmit={data => { updateIncome(editing.id, data); setEditing(null); toast('Entrada atualizada'); }}
            onCancel={() => setEditing(null)}
          />
        )}
      </BottomSheet>
    </div>
  );
}
