import { useState, useMemo } from 'react';
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useToast } from '../components/ui/Toast';
import { formatCurrency, getFixedHealth } from '../lib/finance';
import { CategoryTags } from '../components/ui/CategoryTags';
import { Modal } from '../components/ui/Modal';
import { FIXED_CATEGORIES } from '../types';
import { Icon } from '../components/ui/Icon';
import type { FixedExpense } from '../types';

const CAT_ICONS: Record<string, string> = {
  moradia: 'home', utilidades: 'lightbulb', comunicacao: 'smartphone',
  transporte: 'directions_car', dividas: 'credit_card', saude: 'favorite',
  educacao: 'school', trabalho: 'work',
};

const HEALTH_CFG = {
  recomendado: { bg: 'var(--fx-blue-bg)',   fg: 'var(--fx-blue-fg)',   accent: 'var(--fx-blue)',   icon: 'verified',     label: 'Recomendado' },
  excelente:   { bg: 'var(--fx-green-bg)',  fg: 'var(--fx-green-fg)',  accent: 'var(--fx-green)',  icon: 'check_circle', label: 'Excelente' },
  alerta:      { bg: 'var(--fx-yellow-bg)', fg: 'var(--fx-yellow-fg)', accent: 'var(--fx-yellow)', icon: 'warning',      label: 'Alerta' },
  critico:     { bg: 'var(--fx-red-bg)',    fg: 'var(--fx-red-fg)',    accent: 'var(--fx-red)',    icon: 'error',        label: 'Crítico' },
};

const HEALTH_DESC: Record<string, string> = {
  recomendado: 'Até 20% — recomendado. Você tem espaço amplo no orçamento.',
  excelente:   '21% a 30% — excelente gestão dos comprometimentos fixos.',
  alerta:      '31% a 50% — atenção. Gastos fixos elevados reduzem sua margem.',
  critico:     'Acima de 51% — crítico. Renegociar fixos deve ser prioridade.',
};

function brl(n: number) { return (n).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function brlInt(n: number) { return Math.round(n).toLocaleString('pt-BR'); }

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
        <label className="block text-xs font-semibold uppercase mb-1" style={{ color: 'var(--fx-on-surface-variant)' }}>Nome</label>
        <input
          value={name} onChange={e => setName(e.target.value)}
          placeholder="Ex: Aluguel, Netflix..."
          className="w-full py-2.5 px-3 rounded-xl text-sm outline-none"
          style={{ background: 'var(--fx-surface-container)', border: '1px solid var(--fx-outline-variant)', color: 'var(--fx-on-surface)' }}
        />
      </div>
      <div>
        <label className="block text-xs font-semibold uppercase mb-1" style={{ color: 'var(--fx-on-surface-variant)' }}>Categoria</label>
        <CategoryTags categories={FIXED_CATEGORIES} selected={category} onChange={setCategory} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold uppercase mb-1" style={{ color: 'var(--fx-on-surface-variant)' }}>Valor (R$)</label>
          <input
            type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0,00"
            className="w-full py-2.5 px-3 rounded-xl text-sm outline-none"
            style={{ background: 'var(--fx-surface-container)', border: '1px solid var(--fx-outline-variant)', color: 'var(--fx-on-surface)' }}
          />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase mb-1" style={{ color: 'var(--fx-on-surface-variant)' }}>Dia vencimento</label>
          <input
            type="number" min="1" max="31" value={dueDay} onChange={e => setDueDay(e.target.value)}
            className="w-full py-2.5 px-3 rounded-xl text-sm outline-none"
            style={{ background: 'var(--fx-surface-container)', border: '1px solid var(--fx-outline-variant)', color: 'var(--fx-on-surface)' }}
          />
        </div>
      </div>
      <div className="flex gap-3 pt-2">
        <button
          type="button" onClick={onCancel}
          className="flex-1 py-3 rounded-full text-sm font-medium"
          style={{ border: '1px solid var(--fx-outline-variant)', color: 'var(--fx-on-surface)' }}
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="flex-1 py-3 rounded-full text-sm font-semibold"
          style={{ background: 'var(--fx-primary)', color: 'var(--fx-on-primary)' }}
        >
          Salvar
        </button>
      </div>
    </form>
  );
}

export function FixosPage() {
  const { incomes, fixedExpenses, currentMonth, currentYear, addFixedExpense, updateFixedExpense, deleteFixedExpense } = useApp();
  const toast = useToast();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<FixedExpense | null>(null);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const totalIncome = useMemo(() =>
    incomes.filter(i => i.month === currentMonth && i.year === currentYear).reduce((s, i) => s + i.amount, 0),
    [incomes, currentMonth, currentYear]
  );

  const activeFixeds = fixedExpenses.filter(f => f.active);
  const totalFixed = activeFixeds.reduce((s, f) => s + f.amount, 0);
  const pct = totalIncome > 0 ? (totalFixed / totalIncome) * 100 : 0;
  const health = getFixedHealth(pct);
  const hc = HEALTH_CFG[health] ?? HEALTH_CFG.recomendado;

  const byCategory = FIXED_CATEGORIES.map(cat => ({
    ...cat,
    items: fixedExpenses.filter(f => f.category === cat.id),
  })).filter(c => c.items.length > 0);

  const toggle = (catId: string) => setCollapsed(s => ({ ...s, [catId]: !s[catId] }));
  const allCollapsed = byCategory.every(g => collapsed[g.id]);
  const setAll = (v: boolean) => {
    const next: Record<string, boolean> = {};
    byCategory.forEach(g => { next[g.id] = v; });
    setCollapsed(next);
  };

  return (
    <div className="flex flex-col pb-6">

      {/* ── Saúde card ─── */}
      <div className="mx-4 mt-3 rounded-3xl p-5 flex flex-col gap-2" style={{ background: hc.bg, color: hc.fg }}>
        <span
          className="self-start flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium uppercase tracking-wide"
          style={{ background: hc.accent, color: '#fff' }}
        >
          <Icon name={hc.icon} size={13} fill={1} /> {hc.label}
        </span>
        <div style={{ font: '400 32px/36px Roboto', letterSpacing: '-0.01em' }}>
          <span className="text-sm opacity-70 mr-1">R$</span>
          {brlInt(totalFixed)}
        </div>
        <div className="text-sm opacity-85">
          <strong>{pct.toFixed(0)}%</strong> da sua renda comprometida com gastos fixos.
        </div>
        <div
          className="h-2 rounded-full overflow-hidden mt-1"
          style={{ background: 'color-mix(in srgb, currentColor 14%, transparent)' }}
        >
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${Math.min(100, pct)}%`, background: hc.accent }}
          />
        </div>
        <div className="text-xs opacity-85">{HEALTH_DESC[health]}</div>
      </div>

      {/* ── Section header with collapse toggle ─── */}
      <div className="flex items-baseline justify-between px-5 pt-5 pb-2">
        <h2 className="text-base font-medium" style={{ color: 'var(--fx-on-surface)' }}>Por categoria</h2>
        <button
          onClick={() => setAll(!allCollapsed)}
          className="flex items-center gap-1 text-sm font-medium"
          style={{ color: 'var(--fx-primary)' }}
        >
          <Icon name={allCollapsed ? 'unfold_more' : 'unfold_less'} size={15} />
          {allCollapsed ? 'Expandir tudo' : 'Recolher tudo'}
        </button>
      </div>

      {/* ── Category groups ─── */}
      {byCategory.length === 0 ? (
        <div className="text-center py-12 text-sm" style={{ color: 'var(--fx-on-surface-variant)' }}>
          <p className="text-3xl mb-2">📋</p>
          <p>Nenhum gasto fixo cadastrado.</p>
          <button onClick={() => setShowModal(true)} className="mt-3 font-medium" style={{ color: 'var(--fx-primary)' }}>
            + Adicionar gasto fixo
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-2 px-4">
          {byCategory.map(cat => {
            const catIcon = CAT_ICONS[cat.id] ?? 'category';
            const total = cat.items.reduce((s, i) => s + i.amount, 0);
            const paidCount = cat.items.filter(i => i.active).length;
            const isCollapsed = !!collapsed[cat.id];

            return (
              <div
                key={cat.id}
                className="rounded-2xl overflow-hidden"
                style={{ background: 'var(--fx-surface-container-low)' }}
              >
                {/* Category header */}
                <button
                  onClick={() => toggle(cat.id)}
                  className="w-full flex items-center gap-3.5 px-4 py-3.5 text-left"
                  style={{ background: 'var(--fx-surface-container)' }}
                >
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'var(--fx-tertiary-container)', color: 'var(--fx-on-tertiary-container)' }}
                  >
                    <Icon name={catIcon} size={20} />
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <div className="text-sm font-medium" style={{ color: 'var(--fx-on-surface)' }}>{cat.emoji} {cat.label}</div>
                    <div className="text-[11px]" style={{ color: 'var(--fx-on-surface-variant)' }}>
                      {paidCount}/{cat.items.length} ativos · {cat.items.length} {cat.items.length === 1 ? 'item' : 'itens'}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold" style={{ color: 'var(--fx-on-surface)', fontVariantNumeric: 'tabular-nums' }}>
                      <span className="text-[11px] opacity-55 mr-0.5">R$</span>{brlInt(total)}
                    </div>
                    {totalIncome > 0 && (
                      <div
                        className="text-[10px] font-medium mt-0.5 px-1.5 py-0.5 rounded-full"
                        style={{ background: 'var(--fx-surface-container)', color: 'var(--fx-on-surface-variant)' }}
                      >
                        {((total / totalIncome) * 100).toFixed(1)}% da renda
                      </div>
                    )}
                  </div>
                  <div
                    className="transition-transform duration-200 ml-1"
                    style={{ transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)', color: 'var(--fx-on-surface-variant)' }}
                  >
                    <Icon name="expand_more" size={20} />
                  </div>
                </button>

                {/* Items */}
                <div
                  className="overflow-hidden transition-all duration-300"
                  style={{ maxHeight: isCollapsed ? 0 : 600 }}
                >
                  {cat.items.map((item, i) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 pl-16 pr-4 py-2.5"
                      style={{
                        borderTop: '1px solid var(--fx-surface-container)',
                        opacity: item.active ? 1 : 0.45,
                      }}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-sm" style={{ color: 'var(--fx-on-surface)', textDecoration: item.active ? undefined : 'line-through' }}>
                          {item.name}
                        </div>
                        <div className="text-[11px]" style={{ color: 'var(--fx-on-surface-variant)' }}>Vence dia {item.dueDay}</div>
                      </div>
                      <div
                        className="flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full"
                        style={{
                          color: item.active ? 'var(--fx-green)' : 'var(--fx-on-surface-variant)',
                          background: item.active ? 'var(--fx-green-bg)' : 'var(--fx-surface-container)',
                        }}
                      >
                        {item.active && <Icon name="check_circle" size={12} />}
                        {item.active ? 'Ativo' : 'Pausado'}
                      </div>
                      <div className="text-sm font-semibold" style={{ color: 'var(--fx-on-surface)', fontVariantNumeric: 'tabular-nums' }}>
                        R$ {brl(item.amount)}
                      </div>
                      <div className="flex gap-0.5">
                        <button
                          onClick={() => updateFixedExpense(item.id, { active: !item.active })}
                          className="p-1.5 rounded-lg"
                        >
                          {item.active
                            ? <ToggleRight size={16} style={{ color: 'var(--fx-primary)' }} />
                            : <ToggleLeft size={16} style={{ color: 'var(--fx-on-surface-variant)' }} />}
                        </button>
                        <button onClick={() => setEditing(item)} className="p-1.5 rounded-lg">
                          <Pencil size={13} style={{ color: 'var(--fx-on-surface-variant)' }} />
                        </button>
                        <button onClick={() => { deleteFixedExpense(item.id); toast('Removido'); }} className="p-1.5 rounded-lg">
                          <Trash2 size={13} style={{ color: 'var(--fx-red)' }} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Add button ─── */}
      <div className="flex justify-center mt-5 px-4">
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium"
          style={{ background: 'var(--fx-secondary-container)', color: 'var(--fx-on-secondary-container)' }}
        >
          <Plus size={16} /> Novo gasto fixo
        </button>
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Novo Gasto Fixo">
        <FixedForm
          onSubmit={data => { addFixedExpense(data); setShowModal(false); toast('Gasto fixo adicionado'); }}
          onCancel={() => setShowModal(false)}
        />
      </Modal>
      <Modal open={!!editing} onClose={() => setEditing(null)} title="Editar Gasto Fixo">
        {editing && (
          <FixedForm
            initial={editing}
            onSubmit={data => { updateFixedExpense(editing.id, data); setEditing(null); toast('Atualizado'); }}
            onCancel={() => setEditing(null)}
          />
        )}
      </Modal>
    </div>
  );
}
