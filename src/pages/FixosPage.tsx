import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { getFixedHealth } from '../lib/finance';
import { FIXED_CATEGORIES } from '../types';
import { Icon } from '../components/ui/Icon';
import { NumericKeypad } from '../components/ui/NumericKeypad';
import { DayPicker } from '../components/ui/DayPicker';
import type { FixedExpense } from '../types';

const CAT_ICONS: Record<string, string> = {
  moradia: 'home', utilidades: 'lightbulb', comunicacao: 'smartphone',
  transporte: 'directions_car', dividas: 'credit_card', saude: 'favorite',
  educacao: 'school', trabalho: 'work', familia: 'family_restroom',
  pets: 'pets', doacoes: 'volunteer_activism', outros: 'category',
};

const HEALTH_CFG = {
  recomendado: { bg: 'var(--fx-status-blue-bg)',   fg: 'var(--fx-status-blue-fg)',   accent: 'var(--fx-status-blue)',   icon: 'verified',     label: 'Recomendado' },
  excelente:   { bg: 'var(--fx-status-green-bg)',  fg: 'var(--fx-status-green-fg)',  accent: 'var(--fx-status-green)',  icon: 'check_circle', label: 'Excelente' },
  alerta:      { bg: 'var(--fx-status-yellow-bg)', fg: 'var(--fx-status-yellow-fg)', accent: 'var(--fx-status-yellow)', icon: 'warning',      label: 'Alerta' },
  critico:     { bg: 'var(--fx-status-red-bg)',    fg: 'var(--fx-status-red-fg)',    accent: 'var(--fx-status-red)',    icon: 'error',        label: 'Crítico' },
};

const HEALTH_DESC: Record<string, string> = {
  recomendado: 'Até 20% — recomendado. Você tem espaço amplo no orçamento.',
  excelente:   '21% a 30% — excelente gestão dos comprometimentos fixos.',
  alerta:      '31% a 50% — atenção. Gastos fixos elevados reduzem sua margem.',
  critico:     'Acima de 51% — crítico. Renegociar fixos deve ser prioridade.',
};

function fxBRL(n: number) { return n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function fxBRLInt(n: number) { return Math.round(n).toLocaleString('pt-BR'); }
function fxBRLSplit(n: number) {
  const [int, dec] = Math.abs(n).toFixed(2).split('.');
  return { int: Number(int).toLocaleString('pt-BR'), dec };
}

interface FixoDraft { amount: number; desc: string; dueDay: number; cat: string; active: boolean; }
const DEFAULT_DRAFT: FixoDraft = { amount: 0, desc: '', dueDay: 10, cat: 'moradia', active: true };

export function FixosPage() {
  const { incomes, fixedExpenses, currentMonth, currentYear, addFixedExpense, updateFixedExpense, deleteFixedExpense } = useApp();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<FixedExpense | null>(null);
  const [draft, setDraft] = useState<FixoDraft>(DEFAULT_DRAFT);
  const [actionTarget, setActionTarget] = useState<FixedExpense | null>(null);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const totalIncome = useMemo(() =>
    incomes.filter(i => i.month === currentMonth && i.year === currentYear).reduce((s, i) => s + i.amount, 0),
    [incomes, currentMonth, currentYear]
  );

  const totalFixed = fixedExpenses.reduce((s, f) => s + f.amount, 0);
  const pct = totalIncome > 0 ? (totalFixed / totalIncome) * 100 : 0;
  const health = getFixedHealth(pct);
  const hc = HEALTH_CFG[health] ?? HEALTH_CFG.recomendado;

  const byCategory = FIXED_CATEGORIES.map(cat => ({
    ...cat, icon: CAT_ICONS[cat.id] ?? 'category',
    items: fixedExpenses.filter(f => f.category === cat.id),
  })).filter(c => c.items.length > 0);

  const toggle = (id: string) => setCollapsed(s => ({ ...s, [id]: !s[id] }));
  const allCollapsed = byCategory.every(g => collapsed[g.id]);
  const setAll = (v: boolean) => {
    const next: Record<string, boolean> = {};
    byCategory.forEach(g => { next[g.id] = v; });
    setCollapsed(next);
  };

  const openNew = () => { setEditing(null); setDraft(DEFAULT_DRAFT); setSheetOpen(true); };
  const openEdit = (item: FixedExpense) => {
    setEditing(item);
    setDraft({ amount: item.amount, desc: item.name, dueDay: item.dueDay, cat: item.category, active: item.active });
    setActionTarget(null);
    setSheetOpen(true);
  };

  const handleSave = () => {
    const base = { name: draft.desc || 'Gasto fixo', category: draft.cat, amount: draft.amount, dueDay: draft.dueDay, active: draft.active };
    if (editing) updateFixedExpense(editing.id, base);
    else addFixedExpense(base);
    setSheetOpen(false); setEditing(null);
  };

  return (
    <>
      <div className="fx-scroll">
        {/* Saúde card */}
        <div
          className="fx-saude-card"
          style={{ '--bg': hc.bg, '--fg': hc.fg, '--accent': hc.accent } as React.CSSProperties}
        >
          <div className="fx-saude-header">
            <h2 className="fx-saude-title">Saúde dos seus gastos fixos</h2>
            <span className="tag"><Icon name={hc.icon} />{hc.label}</span>
          </div>
          <div className="v">
            <span className="currency">R$</span>
            {fxBRLInt(totalFixed)}
          </div>
          <div className="meta">
            <strong>{pct.toFixed(0)}%</strong> da sua renda comprometida com gastos fixos.
          </div>
          <div className="bar">
            <div className="fill" style={{ width: `${Math.min(100, pct)}%` }} />
          </div>
          <div className="meta" style={{ font: '400 12px/16px var(--md-ref-typeface-plain)' }}>
            {HEALTH_DESC[health]}
          </div>
        </div>

        {/* Section header */}
        <div className="fx-section-h">
          <h2>Por categoria</h2>
          <span
            className="link"
            onClick={() => setAll(!allCollapsed)}
            style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
          >
            <Icon name={allCollapsed ? 'unfold_more' : 'unfold_less'} size={16} />
            {allCollapsed ? 'Expandir tudo' : 'Recolher tudo'}
          </span>
        </div>

        {/* Category groups */}
        {byCategory.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 16px', color: 'var(--md-sys-color-on-surface-variant)', font: '400 14px/20px var(--md-ref-typeface-plain)' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>📋</div>
            <div>Nenhum gasto fixo cadastrado.</div>
            <button onClick={openNew} style={{ marginTop: 12, color: 'var(--md-sys-color-primary)', font: '500 14px/20px var(--md-ref-typeface-plain)', background: 'none', border: 'none', cursor: 'pointer' }}>
              + Adicionar gasto fixo
            </button>
          </div>
        ) : byCategory.map(group => {
          const total = group.items.reduce((s, i) => s + i.amount, 0);
          const pctRenda = totalIncome > 0 ? (total / totalIncome) * 100 : 0;
          const paidCount = group.items.filter(i => i.active).length;
          const isCollapsed = !!collapsed[group.id];
          return (
            <div className={`fx-cat-group${isCollapsed ? ' collapsed' : ''}`} key={group.id}>
              <button className="fx-cat-head" onClick={() => toggle(group.id)} aria-expanded={!isCollapsed}>
                <div className="glyph"><Icon name={group.icon} /></div>
                <div className="title">
                  {group.label}
                  <div className="cat-sub">{paidCount}/{group.items.length} ativos · {group.items.length} {group.items.length === 1 ? 'item' : 'itens'}</div>
                </div>
                <div className="total">
                  <span className="currency">R$</span>{fxBRLInt(total)}
                  <div className="pct-chip">{pctRenda.toFixed(1)}% da renda</div>
                </div>
                <div className="chev"><Icon name="expand_more" size={20} /></div>
              </button>
              <div className="fx-cat-items">
                <div style={{ maxHeight: isCollapsed ? 0 : 1200, overflow: 'hidden', opacity: isCollapsed ? 0 : 1, transition: 'max-height 320ms cubic-bezier(0.2,0,0,1), opacity 200ms ease' }}>
                  {group.items.map(item => {
                    const sp = fxBRLSplit(item.amount);
                    return (
                      <button
                        key={item.id}
                        className="fx-cat-item"
                        onClick={() => setActionTarget(item)}
                      >
                        <div>
                          {item.name}
                          <div className="meta">Vence dia {item.dueDay}</div>
                        </div>
                        <div className={`due${item.active ? ' paid' : ''}`}>
                          {item.active ? <><Icon name="check_circle" size={14} /> Ativo</> : 'Pausado'}
                        </div>
                        <div className="v">
                          <span className="currency">R$ </span>{sp.int},{sp.dec}
                          <Icon name="edit" size={12} color="var(--md-sys-color-on-surface-variant)" style={{ marginLeft: 5, opacity: 0.55, verticalAlign: 'middle' }} />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}

        {/* Add button */}
        <div style={{ padding: '20px 16px 120px', display: 'flex', justifyContent: 'center' }}>
          <button className="fx-btn tonal" style={{ width: 'auto' }} onClick={openNew}>
            <Icon name="add" size={18} />Novo gasto fixo
          </button>
        </div>
      </div>

      {/* Action sheet */}
      <div className={`fx-scrim${actionTarget ? ' open' : ''}`} onClick={() => setActionTarget(null)} />
      <div className={`fx-sheet${actionTarget ? ' open' : ''}`} style={{ paddingBottom: 32 }}>
        <div className="grabber" />
        {actionTarget && (
          <>
            <div className="sheet-title">{actionTarget.name}</div>
            <div className="sheet-subtitle">
              {FIXED_CATEGORIES.find(c => c.id === actionTarget.category)?.label} · R$ {fxBRL(actionTarget.amount)} · Dia {actionTarget.dueDay}
            </div>
            <div className="cta-row">
              <button className="fx-btn tonal" onClick={() => openEdit(actionTarget)}>
                <Icon name="edit" size={18} />Editar
              </button>
              <button className="fx-btn danger" onClick={() => { deleteFixedExpense(actionTarget.id); setActionTarget(null); }}>
                <Icon name="delete" size={18} />Excluir
              </button>
            </div>
          </>
        )}
      </div>

      {/* Add / Edit sheet */}
      <NovoFixoSheet
        open={sheetOpen}
        onClose={() => { setSheetOpen(false); setEditing(null); }}
        draft={draft}
        setDraft={setDraft}
        onSave={handleSave}
        isEditing={!!editing}
        currentYear={currentYear}
        currentMonth={currentMonth}
      />
    </>
  );
}

// ── Novo Fixo Sheet ─────────────────────────────────────────────
function NovoFixoSheet({
  open, onClose, draft, setDraft, onSave, isEditing, currentYear, currentMonth,
}: {
  open: boolean; onClose: () => void;
  draft: FixoDraft; setDraft: (d: FixoDraft) => void;
  onSave: () => void; isEditing: boolean;
  currentYear: number; currentMonth: number;
}) {
  const [padOpen, setPadOpen] = useState(false);
  const [calOpen, setCalOpen] = useState(false);
  const amt = fxBRLSplit(draft.amount || 0);
  const cats = FIXED_CATEGORIES;

  return (
    <>
      <div className={`fx-scrim${open ? ' open' : ''}`} onClick={onClose} style={{ zIndex: 50 }} />
      <div className={`fx-sheet${open ? ' open' : ''}`} style={{ zIndex: 51 }}>
        <div className="grabber" />
        <div className="sheet-title">{isEditing ? 'Editar gasto fixo' : 'Novo gasto fixo'}</div>
        <div className="sheet-subtitle">Cadastre uma despesa recorrente</div>

        <div className="amount-input" onClick={() => setPadOpen(true)} style={{ cursor: 'pointer' }}>
          <div className="lbl">Valor mensal</div>
          <div className="amount">
            <span className="currency">R$</span>
            <span>{amt.int},{amt.dec}</span>
            <span className="cursor" />
          </div>
          <div style={{ font: '400 11px/14px var(--md-ref-typeface-plain)', color: 'var(--md-sys-color-on-surface-variant)', marginTop: 6, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <Icon name="keyboard" size={14} />Toque para digitar
          </div>
        </div>

        <div className="field">
          <div className="field-lbl">Categoria</div>
          <div className="cat-tags">
            {cats.map(c => (
              <button
                key={c.id}
                className={`cat-tag${draft.cat === c.id ? ' selected' : ''}`}
                onClick={() => setDraft({ ...draft, cat: c.id })}
              >
                <Icon name={CAT_ICONS[c.id] ?? 'category'} size={16} />{c.label}
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <div className="field-lbl">Descrição</div>
          <input
            className="desc-input"
            placeholder="Ex: Aluguel, Plano celular, Academia"
            value={draft.desc}
            onChange={e => setDraft({ ...draft, desc: e.target.value })}
          />
        </div>

        <div className="field">
          <div className="field-lbl">Vencimento</div>
          <button
            className="fx-day-row"
            onClick={() => setCalOpen(true)}
            style={{ width: '100%', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
          >
            <span className="lbl">Dia do mês</span>
            <span className="fx-day-pick">
              <Icon name="calendar_month" size={18} />
              <strong>Dia {draft.dueDay}</strong>
              <Icon name="chevron_right" size={18} color="var(--md-sys-color-on-surface-variant)" />
            </span>
          </button>
        </div>

        <div className="field">
          <div
            className="fx-toggle-row"
            onClick={() => setDraft({ ...draft, active: !draft.active })}
            style={{ cursor: 'pointer' }}
          >
            <div className="ic"><Icon name="check_circle" /></div>
            <div className="txt">
              <div className="t">Ativo (incluso no orçamento)</div>
              <div className="s">Desative para pausar sem excluir</div>
            </div>
            <div className={`fx-switch${draft.active ? ' on' : ''}`}>
              <div className="thumb">{draft.active && <Icon name="check" size={14} />}</div>
            </div>
          </div>
        </div>

        <div className="cta-row">
          <button className="fx-btn text" onClick={onClose}>Cancelar</button>
          <button className="fx-btn flex" onClick={onSave} disabled={draft.amount <= 0}>
            <Icon name="check" size={18} />
            {isEditing ? 'Salvar' : 'Salvar gasto fixo'}
          </button>
        </div>
      </div>

      <NumericKeypad
        open={padOpen}
        onClose={() => setPadOpen(false)}
        value={draft.amount}
        onChange={v => setDraft({ ...draft, amount: v })}
        onConfirm={() => setPadOpen(false)}
      />
      <DayPicker
        open={calOpen}
        onClose={() => setCalOpen(false)}
        value={draft.dueDay}
        onPick={d => { setDraft({ ...draft, dueDay: d }); setCalOpen(false); }}
        year={currentYear}
        month={currentMonth}
      />
    </>
  );
}
