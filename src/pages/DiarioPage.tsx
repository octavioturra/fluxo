import { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { computeMonthSummary } from '../lib/finance';
import { EXPENSE_CATEGORIES } from '../types';
import { Icon } from '../components/ui/Icon';
import type { DailyExpense, PaymentMethod } from '../types';

const PM_ICONS: Record<string, string> = {
  dinheiro: 'payments', pix: 'bolt', debito: 'credit_card', credito: 'credit_score',
};
const PM_LABELS: Record<string, string> = {
  dinheiro: 'Dinheiro', pix: 'Pix', debito: 'Débito', credito: 'Crédito',
};

const MONTHS_FULL = [
  'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro',
];

const CAT_FILTERS = [
  { id: 'todos',            label: 'Todos',       icon: null },
  { id: 'alimentacao',      label: 'Alimentação', icon: 'restaurant' },
  { id: 'transporte',       label: 'Transporte',  icon: 'directions_car' },
  { id: 'lazer',            label: 'Lazer',       icon: 'celebration' },
  { id: 'compras_produtos', label: 'Compras',     icon: 'shopping_bag' },
  { id: 'saude',            label: 'Saúde',       icon: 'favorite' },
  { id: 'estudo',           label: 'Estudo',      icon: 'school' },
];

function fxBRLInt(n: number) { return Math.round(Math.abs(n)).toLocaleString('pt-BR'); }
function fxBRLSplit(n: number) {
  const [int, dec] = Math.abs(n).toFixed(2).split('.');
  return { int: Number(int).toLocaleString('pt-BR'), dec };
}

interface Draft {
  amount: number;
  cat: string;
  pay: PaymentMethod;
  parcelas: number;
  desc: string;
}

const DEFAULT_DRAFT: Draft = { amount: 0, cat: 'alimentacao', pay: 'pix', parcelas: 1, desc: '' };

export function DiarioPage() {
  const { user, incomes, fixedExpenses, dailyExpenses, currentMonth, currentYear, addDailyExpense, updateDailyExpense, deleteDailyExpense } = useApp();
  const [filterCat, setFilterCat] = useState('todos');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [draft, setDraft] = useState<Draft>(DEFAULT_DRAFT);
  const [editing, setEditing] = useState<DailyExpense | null>(null);
  const [actionTarget, setActionTarget] = useState<DailyExpense | null>(null);

  const today = new Date();
  const todayDay = today.getDate();

  const summary = useMemo(() =>
    computeMonthSummary(incomes, fixedExpenses, dailyExpenses, currentYear, currentMonth, user),
    [incomes, fixedExpenses, dailyExpenses, currentYear, currentMonth, user]
  );

  const monthExpenses = useMemo(() =>
    dailyExpenses.filter(d => d.month === currentMonth && d.year === currentYear),
    [dailyExpenses, currentMonth, currentYear]
  );

  const filtered = filterCat === 'todos'
    ? monthExpenses
    : monthExpenses.filter(d => d.category === filterCat);

  const grouped = filtered.reduce<Record<string, DailyExpense[]>>((acc, d) => {
    if (!acc[d.date]) acc[d.date] = [];
    acc[d.date].push(d);
    return acc;
  }, {});
  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  const pct = summary.totalIncome > 0 ? (summary.totalDaily / summary.totalIncome) * 100 : 0;

  const dayLabel = (dateStr: string) => {
    const d = parseInt(dateStr.slice(8));
    const isToday = d === todayDay && currentYear === today.getFullYear() && currentMonth === today.getMonth() + 1;
    const isYesterday = d === todayDay - 1 && currentYear === today.getFullYear() && currentMonth === today.getMonth() + 1;
    const m = MONTHS_FULL[currentMonth - 1].slice(0, 3).toLowerCase();
    if (isToday) return `Hoje · ${String(d).padStart(2, '0')} ${m}`;
    if (isYesterday) return `Ontem · ${String(d).padStart(2, '0')} ${m}`;
    return `${String(d).padStart(2, '0')} ${m}`;
  };

  const openNew = () => { setDraft(DEFAULT_DRAFT); setSheetOpen(true); };
  const openEdit = (t: DailyExpense) => {
    setEditing(t);
    setDraft({
      amount: t.amount,
      cat: t.category,
      pay: t.paymentMethod as PaymentMethod,
      parcelas: t.installments ?? 1,
      desc: t.description,
    });
    setSheetOpen(true);
  };

  const handleSave = () => {
    const base = {
      description: draft.desc || 'Gasto sem descrição',
      category: draft.cat,
      paymentMethod: draft.pay,
      amount: draft.amount,
      installments: draft.pay === 'credito' ? draft.parcelas : 1,
      date: `${currentYear}-${String(currentMonth).padStart(2,'0')}-${String(todayDay).padStart(2,'0')}`,
      month: currentMonth,
      year: currentYear,
    };
    if (editing) {
      updateDailyExpense(editing.id, base);
      setEditing(null);
    } else {
      addDailyExpense(base);
    }
    setSheetOpen(false);
  };

  const closeSheet = () => { setSheetOpen(false); setEditing(null); };

  return (
    <>
      <div className="fx-scroll">
        {/* Compact summary */}
        <div style={{
          margin: '0 16px 12px',
          padding: '16px 20px',
          background: 'var(--md-sys-color-surface-container)',
          borderRadius: 22,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <div style={{
              font: '500 11px/14px var(--md-ref-typeface-plain)',
              letterSpacing: '0.04em', textTransform: 'uppercase',
              color: 'var(--md-sys-color-on-surface-variant)',
            }}>
              Gasto no Diário · {MONTHS_FULL[currentMonth - 1]}
            </div>
            <div style={{
              font: '400 28px/32px var(--md-ref-typeface-brand)',
              color: 'var(--md-sys-color-on-surface)',
              letterSpacing: '-0.01em', marginTop: 4,
            }}>
              <span style={{ fontSize: 14, opacity: 0.6, marginRight: 4 }}>R$</span>
              {fxBRLInt(summary.totalDaily)}
            </div>
            <div style={{ font: '400 12px/16px var(--md-ref-typeface-plain)', color: 'var(--md-sys-color-on-surface-variant)', marginTop: 4 }}>
              {pct.toFixed(0)}% da renda · {monthExpenses.length} lançamentos
            </div>
          </div>
          <div style={{
            width: 56, height: 56, borderRadius: 16,
            background: 'var(--md-sys-color-primary-container)',
            color: 'var(--md-sys-color-on-primary-container)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon name="edit_note" size={28} />
          </div>
        </div>

        {/* Filter chips */}
        <div className="fx-filters">
          {CAT_FILTERS.map(f => {
            const active = filterCat === f.id;
            return (
              <button
                key={f.id}
                className={`fx-chip${active ? ' selected' : ''}`}
                onClick={() => setFilterCat(f.id)}
              >
                {active && <Icon name="check" size={14} />}
                {!active && f.icon && <Icon name={f.icon} size={14} />}
                {f.label}
              </button>
            );
          })}
        </div>

        {/* Transaction list */}
        {sortedDates.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '48px 16px',
            color: 'var(--md-sys-color-on-surface-variant)',
            font: '400 14px/20px var(--md-ref-typeface-plain)',
          }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>🛒</div>
            <div>Nenhum gasto registrado.</div>
            <button onClick={openNew} style={{ marginTop: 12, color: 'var(--md-sys-color-primary)', font: '500 14px/20px var(--md-ref-typeface-plain)', background: 'none', border: 'none', cursor: 'pointer' }}>
              + Registrar gasto
            </button>
          </div>
        ) : (
          <div className="fx-tx-list">
            {sortedDates.map(date => {
              const dayTotal = grouped[date].reduce((s, t) => s + t.amount, 0);
              return (
                <div key={date}>
                  <div className="fx-day-divider">
                    <span>{dayLabel(date)}</span>
                    <span style={{ textTransform: 'none', letterSpacing: 0, opacity: 0.85 }}>
                      R$ {fxBRLInt(dayTotal)}
                    </span>
                  </div>
                  {grouped[date].map(t => {
                    const cat = EXPENSE_CATEGORIES.find(c => c.id === t.category) ?? EXPENSE_CATEGORIES[EXPENSE_CATEGORIES.length - 1];
                    const pm = PM_ICONS[t.paymentMethod] ?? 'payments';
                    const pmLabel = PM_LABELS[t.paymentMethod] ?? t.paymentMethod;
                    const sp = fxBRLSplit(t.amount);
                    return (
                      <button
                        key={t.id}
                        className="fx-tx-row"
                        onClick={() => setActionTarget(t)}
                      >
                        <div className="icon"><Icon name={cat.icon} /></div>
                        <div className="body">
                          <div className="desc">{t.description}</div>
                          <div className="meta">
                            <span className="cat-tag">
                              <Icon name={pm} />{pmLabel}
                              {t.installments && t.installments > 1 ? ` · ${t.installments}x` : ''}
                            </span>
                            <span className="sep" />
                            <span>{t.date.slice(8)}</span>
                          </div>
                        </div>
                        <div className="v">
                          <span className="currency">R$</span>
                          {sp.int}<span className="sm">,{sp.dec}</span>
                          <Icon name="edit" size={12} color="var(--md-sys-color-on-surface-variant)" style={{ marginLeft: 5, opacity: 0.5, verticalAlign: 'middle' }} />
                        </div>
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* FAB */}
      <button className="fx-fab" onClick={openNew} aria-label="Novo gasto">
        <Icon name="add" />
      </button>

      {/* Action sheet (tap a row → edit / delete) */}
      <div className={`fx-scrim${actionTarget ? ' open' : ''}`} onClick={() => setActionTarget(null)} />
      <div className={`fx-sheet${actionTarget ? ' open' : ''}`} style={{ paddingBottom: 32 }}>
        <div className="grabber" />
        {actionTarget && (() => {
          const cat = EXPENSE_CATEGORIES.find(c => c.id === actionTarget.category) ?? EXPENSE_CATEGORIES[EXPENSE_CATEGORIES.length - 1];
          const sp = fxBRLSplit(actionTarget.amount);
          return (
            <>
              <div className="sheet-title">{actionTarget.description}</div>
              <div className="sheet-subtitle">
                {cat.label} · R$ {sp.int},{sp.dec} · {actionTarget.date.slice(8)}/{String(currentMonth).padStart(2,'0')}
              </div>
              <div className="cta-row">
                <button className="fx-btn tonal" onClick={() => { openEdit(actionTarget); setActionTarget(null); }}>
                  <Icon name="edit" size={18} />Editar
                </button>
                <button className="fx-btn danger" onClick={() => { deleteDailyExpense(actionTarget.id); setActionTarget(null); }}>
                  <Icon name="delete" size={18} />Excluir
                </button>
              </div>
            </>
          );
        })()}
      </div>

      {/* New / Edit expense sheet */}
      <NovoGastoSheet
        open={sheetOpen}
        onClose={closeSheet}
        draft={draft}
        setDraft={setDraft}
        onSave={handleSave}
        isEditing={!!editing}
        todayDay={todayDay}
        currentMonth={currentMonth}
      />
    </>
  );
}

// ── Novo Gasto Sheet ────────────────────────────────────────────
function NovoGastoSheet({
  open, onClose, draft, setDraft, onSave, isEditing, todayDay, currentMonth,
}: {
  open: boolean;
  onClose: () => void;
  draft: Draft;
  setDraft: (d: Draft) => void;
  onSave: () => void;
  isEditing: boolean;
  todayDay: number;
  currentMonth: number;
}) {
  const [padOpen, setPadOpen] = useState(false);
  const amountSplit = fxBRLSplit(draft.amount || 0);
  const monthName = MONTHS_FULL[currentMonth - 1];

  const cats = EXPENSE_CATEGORIES;
  const pays: { id: PaymentMethod; icon: string; label: string }[] = [
    { id: 'dinheiro', icon: 'payments',     label: 'Dinheiro' },
    { id: 'pix',      icon: 'bolt',         label: 'Pix' },
    { id: 'debito',   icon: 'credit_card',  label: 'Débito' },
    { id: 'credito',  icon: 'credit_score', label: 'Crédito' },
  ];

  return (
    <>
      <div className={`fx-scrim${open ? ' open' : ''}`} onClick={onClose} style={{ zIndex: 50 }} />
      <div className={`fx-sheet${open ? ' open' : ''}`} style={{ zIndex: 51 }}>
        <div className="grabber" />
        <div className="sheet-title">{isEditing ? 'Editar gasto' : 'Novo gasto'}</div>
        <div className="sheet-subtitle">Hoje · {String(todayDay).padStart(2, '0')} de {monthName.toLowerCase()}</div>

        <div className="amount-input" onClick={() => setPadOpen(true)} style={{ cursor: 'pointer' }}>
          <div className="amount">
            <span className="currency">R$</span>
            <span>{amountSplit.int},{amountSplit.dec}</span>
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
                <Icon name={c.icon} size={16} />{c.label}
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <div className="field-lbl">Método de pagamento</div>
          <div className="pay-tags">
            {pays.map(p => (
              <button
                key={p.id}
                className={`pay-tag${draft.pay === p.id ? ' selected' : ''}`}
                onClick={() => setDraft({ ...draft, pay: p.id })}
              >
                <Icon name={p.icon} />{p.label}
              </button>
            ))}
          </div>
        </div>

        {draft.pay === 'credito' && (
          <div className="field">
            <div className="field-lbl">Parcelamento</div>
            <div className="fx-filters" style={{ padding: 0 }}>
              {[1,2,3,6,10,12].map(n => (
                <button
                  key={n}
                  className={`fx-chip${draft.parcelas === n ? ' selected' : ''}`}
                  onClick={() => setDraft({ ...draft, parcelas: n })}
                >
                  {draft.parcelas === n && <Icon name="check" size={14} />}
                  {n}x
                </button>
              ))}
            </div>
            {draft.parcelas > 1 && (
              <div style={{
                marginTop: 8, padding: '10px 14px',
                background: 'var(--fx-status-yellow-bg)',
                color: 'var(--fx-status-yellow-fg)',
                borderRadius: 12,
                font: '500 12px/16px var(--md-ref-typeface-plain)',
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <Icon name="info" size={16} />
                {draft.parcelas} parcelas de R$ {fxBRLInt(draft.amount / draft.parcelas)} comprometerão as próximas faturas.
              </div>
            )}
          </div>
        )}

        <div className="field">
          <div className="field-lbl">Descrição (opcional)</div>
          <input
            className="desc-input"
            placeholder="Ex: Almoço com a equipe"
            value={draft.desc}
            onChange={e => setDraft({ ...draft, desc: e.target.value })}
          />
        </div>

        <div className="cta-row">
          <button className="fx-btn text" onClick={onClose}>Cancelar</button>
          <button className="fx-btn flex" onClick={onSave} disabled={draft.amount <= 0}>
            <Icon name="check" size={18} />
            {isEditing ? 'Salvar' : 'Lançar gasto'}
          </button>
        </div>
      </div>

      {/* Numeric keypad — above the sheet */}
      <NumericKeypadOverlay
        open={padOpen}
        onClose={() => setPadOpen(false)}
        value={draft.amount}
        onChange={v => setDraft({ ...draft, amount: v })}
        onConfirm={() => setPadOpen(false)}
      />
    </>
  );
}

// ── Numeric Keypad Overlay ──────────────────────────────────────
function NumericKeypadOverlay({
  open, onClose, value, onChange, onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  value: number;
  onChange: (v: number) => void;
  onConfirm: () => void;
}) {
  const [cents, setCents] = useState(Math.round((value || 0) * 100));
  useEffect(() => { if (open) setCents(Math.round((value || 0) * 100)); }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const update = (c: number) => { setCents(c); onChange(c / 100); };
  const press = (n: number) => update(Math.min(999999999, cents * 10 + n));
  const back  = () => update(Math.floor(cents / 10));
  const clear = () => update(0);

  const keys = ['1','2','3','4','5','6','7','8','9','C','0','⌫'];

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.42)',
          zIndex: 54,
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'auto' : 'none',
          transition: 'opacity 200ms',
        }}
      />
      <div
        style={{
          position: 'fixed',
          left: '50%', transform: `translateX(-50%) translateY(${open ? '0' : '100%'})`,
          bottom: 0,
          width: '100%', maxWidth: 440,
          background: 'var(--md-sys-color-surface-container-high)',
          color: 'var(--md-sys-color-on-surface)',
          borderRadius: '28px 28px 0 0',
          padding: '12px 16px 20px',
          zIndex: 55,
          transition: 'transform 280ms cubic-bezier(0.2,0,0,1)',
          boxShadow: '0 -16px 40px rgba(0,0,0,0.25)',
        }}
      >
        <div style={{ width: 32, height: 4, borderRadius: 2, background: 'var(--md-sys-color-on-surface-variant)', opacity: 0.4, margin: '4px auto 12px' }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {keys.map(k => {
            const isAction = k === 'C' || k === '⌫';
            return (
              <button
                key={k}
                onClick={() => k === 'C' ? clear() : k === '⌫' ? back() : press(parseInt(k, 10))}
                style={{
                  height: 56, borderRadius: 18, border: 'none',
                  background: isAction ? 'var(--md-sys-color-surface-container)' : 'var(--md-sys-color-surface-container-highest)',
                  color: isAction ? 'var(--md-sys-color-on-surface-variant)' : 'var(--md-sys-color-on-surface)',
                  font: '500 22px/1 var(--md-ref-typeface-brand)',
                  cursor: 'pointer', fontVariantNumeric: 'tabular-nums',
                }}
              >{k}</button>
            );
          })}
        </div>
        <div style={{ display: 'flex', gap: 12, marginTop: 14 }}>
          <button className="fx-btn flex" onClick={onConfirm}>
            <Icon name="check" size={18} />Pronto
          </button>
        </div>
      </div>
    </>
  );
}
