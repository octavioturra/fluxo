import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Icon } from '../components/ui/Icon';
import { NumericKeypad } from '../components/ui/NumericKeypad';
import { DayPicker } from '../components/ui/DayPicker';
import { getEffectiveIncomes } from '../lib/finance';
import type { Income, EntryType } from '../types';

const TIPOS: { id: EntryType; icon: string; label: string }[] = [
  { id: 'clt',     icon: 'work',         label: 'Salário CLT' },
  { id: 'pj',      icon: 'receipt_long', label: 'PJ · NF' },
  { id: 'passiva', icon: 'key',          label: 'Renda passiva' },
  { id: 'freela',  icon: 'handshake',    label: 'Freela' },
  { id: 'outros',  icon: 'category',     label: 'Outros' },
];

function fxBRLInt(n: number) { return Math.round(n).toLocaleString('pt-BR'); }
function fxBRLSplit(n: number) {
  const [int, dec] = Math.abs(n).toFixed(2).split('.');
  return { int: Number(int).toLocaleString('pt-BR'), dec };
}

const MONTHS_FULL = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

interface EntradaDraft {
  amount: number; desc: string; day: number;
  tipo: EntryType; recorrente: boolean; estimado: boolean;
}
const DEFAULT_DRAFT: EntradaDraft = { amount: 0, desc: '', day: 5, tipo: 'clt', recorrente: true, estimado: false };

export function EntradasPage() {
  const { incomes, currentMonth, currentYear, addIncome, updateIncome, deleteIncome } = useApp();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [draft, setDraft] = useState<EntradaDraft>(DEFAULT_DRAFT);
  const [editing, setEditing] = useState<Income | null>(null);
  const [actionTarget, setActionTarget] = useState<Income | null>(null);

  const monthIncomes = useMemo(() =>
    getEffectiveIncomes(incomes, currentMonth, currentYear),
    [incomes, currentMonth, currentYear]
  );
  const total = monthIncomes.reduce((s, i) => s + i.amount, 0);
  const confirmed = monthIncomes.filter(i => !i.isEstimated).length;

  const getTipoIcon = (type: string) => TIPOS.find(t => t.id === type)?.icon ?? 'payments';

  const openNew = () => { setEditing(null); setDraft(DEFAULT_DRAFT); setSheetOpen(true); };
  const openEdit = (item: Income) => {
    setEditing(item);
    setDraft({ amount: item.amount, desc: item.source, day: item.day, tipo: item.type as EntryType, recorrente: item.isRecurring ?? false, estimado: item.isEstimated ?? false });
    setActionTarget(null);
    setSheetOpen(true);
  };

  const handleSave = () => {
    const base = { source: draft.desc || 'Nova entrada', type: draft.tipo, amount: draft.amount, day: draft.day, month: currentMonth, year: currentYear, isEstimated: draft.tipo === 'pj' ? draft.estimado : false, isRecurring: draft.recorrente };
    if (editing && !editing.isProjected) updateIncome(editing.id, base);
    else addIncome(base);
    setSheetOpen(false); setEditing(null);
  };

  return (
    <>
      <div className="fx-scroll">
        {/* Total hero */}
        <div className="fx-entrada-total">
          <div className="lbl">Total de entradas · {MONTHS_FULL[currentMonth - 1]}</div>
          <div className="v">
            <span className="currency">R$</span>
            {fxBRLInt(total)}
          </div>
          <div className="meta">
            {monthIncomes.length} fonte{monthIncomes.length !== 1 ? 's' : ''} · {confirmed} confirmada{confirmed !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Section header */}
        <div className="fx-section-h">
          <h2>Suas entradas</h2>
          <span className="link" onClick={openNew} style={{ cursor: 'pointer' }}>Adicionar</span>
        </div>

        {/* Income list */}
        {monthIncomes.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 16px', color: 'var(--md-sys-color-on-surface-variant)', font: '400 14px/20px var(--md-ref-typeface-plain)' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>💰</div>
            <div>Nenhuma entrada cadastrada neste mês.</div>
            <button onClick={openNew} style={{ marginTop: 12, color: 'var(--md-sys-color-primary)', font: '500 14px/20px var(--md-ref-typeface-plain)', background: 'none', border: 'none', cursor: 'pointer' }}>
              + Adicionar entrada
            </button>
          </div>
        ) : (
          <div className="fx-entrada-list">
            {monthIncomes.map(income => {
              const sp = fxBRLSplit(income.amount);
              return (
                <button
                  key={income.id}
                  className="fx-entrada-item"
                  onClick={() => setActionTarget(income)}
                >
                  <div className="glyph">
                    <Icon name={getTipoIcon(income.type)} />
                  </div>
                  <div>
                    <div className="desc">{income.source}</div>
                    <div className="meta">
                      {TIPOS.find(t => t.id === income.type)?.label ?? income.type} · recebe dia {income.day}
                      {income.isProjected && (
                        <> · <span className="estimated"><Icon name="autorenew" size={11} />Recorrente</span></>
                      )}
                      {income.isEstimated && (
                        <> · <span className="estimated"><Icon name="schedule" size={11} />Estimado</span></>
                      )}
                    </div>
                  </div>
                  <div className="v">
                    <span className={income.isEstimated ? 'pending' : ''}>
                      <span className="currency">R$ </span>
                      {sp.int},{sp.dec}
                    </span>
                    <Icon name="edit" size={14} color="var(--md-sys-color-on-surface-variant)" style={{ marginLeft: 6, opacity: 0.55, verticalAlign: 'middle' }} />
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Add button */}
        <div style={{ padding: '20px 16px 4px', display: 'flex', justifyContent: 'center' }}>
          <button className="fx-btn tonal" style={{ width: 'auto' }} onClick={openNew}>
            <Icon name="add" size={18} />Nova entrada
          </button>
        </div>

        {/* Tip card */}
        <div style={{ margin: '16px 16px 120px', padding: '16px 18px', background: 'var(--md-sys-color-surface-container-low)', borderRadius: 18, display: 'flex', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 12, background: 'var(--md-sys-color-tertiary-container)', color: 'var(--md-sys-color-on-tertiary-container)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icon name="lightbulb" />
          </div>
          <div>
            <div style={{ font: '500 14px/20px var(--md-ref-typeface-plain)', color: 'var(--md-sys-color-on-surface)' }}>Renda variável</div>
            <div style={{ font: '400 13px/18px var(--md-ref-typeface-plain)', color: 'var(--md-sys-color-on-surface-variant)', marginTop: 2 }}>
              Entradas estimadas usam o valor projetado. Quando o pagamento for confirmado, edite o lançamento e o valor diário recalcula sozinho.
            </div>
          </div>
        </div>
      </div>

      {/* Action sheet */}
      <div className={`fx-scrim${actionTarget ? ' open' : ''}`} onClick={() => setActionTarget(null)} />
      <div className={`fx-sheet${actionTarget ? ' open' : ''}`} style={{ paddingBottom: 32 }}>
        <div className="grabber" />
        {actionTarget && (
          <>
            <div className="sheet-title">{actionTarget.source}</div>
            <div className="sheet-subtitle">
              {TIPOS.find(t => t.id === actionTarget.type)?.label} · Dia {actionTarget.day} · R$ {fxBRLSplit(actionTarget.amount).int}
              {actionTarget.isProjected && (
                <><br /><span style={{ color: 'var(--md-sys-color-primary)', fontSize: 12 }}>Entrada recorrente — projetada neste mês</span></>
              )}
            </div>
            <div className="cta-row">
              <button className="fx-btn tonal" onClick={() => openEdit(actionTarget)}>
                <Icon name="edit" size={18} />{actionTarget.isProjected ? 'Confirmar valor' : 'Editar'}
              </button>
              <button className="fx-btn danger" onClick={() => { deleteIncome(actionTarget.id); setActionTarget(null); }}>
                <Icon name="delete" size={18} />{actionTarget.isProjected ? 'Remover recorrência' : 'Excluir'}
              </button>
            </div>
          </>
        )}
      </div>

      {/* New / Edit entrada sheet */}
      <NovaEntradaSheet
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

// ── Nova Entrada Sheet ──────────────────────────────────────────
function NovaEntradaSheet({
  open, onClose, draft, setDraft, onSave, isEditing, currentYear, currentMonth,
}: {
  open: boolean; onClose: () => void;
  draft: EntradaDraft; setDraft: (d: EntradaDraft) => void;
  onSave: () => void; isEditing: boolean;
  currentYear: number; currentMonth: number;
}) {
  const [padOpen, setPadOpen] = useState(false);
  const [calOpen, setCalOpen] = useState(false);
  const amt = fxBRLSplit(draft.amount || 0);

  return (
    <>
      <div className={`fx-scrim${open ? ' open' : ''}`} onClick={onClose} style={{ zIndex: 50 }} />
      <div className={`fx-sheet${open ? ' open' : ''}`} style={{ zIndex: 51 }}>
        <div className="grabber" />
        <div className="sheet-title">{isEditing ? 'Editar entrada' : 'Nova entrada'}</div>
        <div className="sheet-subtitle">Cadastre uma fonte de renda do mês</div>

        <div className="amount-input" onClick={() => setPadOpen(true)} style={{ cursor: 'pointer' }}>
          <div className="amount">
            <span className="currency">R$</span>
            <span>{amt.int},{amt.dec}</span>
            <span className="cursor" />
          </div>
          <div style={{ font: '400 11px/14px var(--md-ref-typeface-plain)', color: 'var(--md-sys-color-on-surface-variant)', marginTop: 6, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <Icon name="keyboard" size={14} />
            {draft.estimado ? 'Toque para digitar · valor estimado' : 'Toque para digitar'}
          </div>
        </div>

        <div className="field">
          <div className="field-lbl">Tipo de entrada</div>
          <div className="cat-tags">
            {TIPOS.map(t => (
              <button
                key={t.id}
                className={`cat-tag${draft.tipo === t.id ? ' selected' : ''}`}
                onClick={() => setDraft({ ...draft, tipo: t.id, estimado: t.id === 'pj' ? draft.estimado : false })}
              >
                <Icon name={t.icon} size={16} />{t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <div className="field-lbl">Descrição</div>
          <input
            className="desc-input"
            placeholder="Ex: Salário · TechBrasil"
            value={draft.desc}
            onChange={e => setDraft({ ...draft, desc: e.target.value })}
          />
        </div>

        <div className="field">
          <div className="field-lbl">Recebimento</div>
          <button
            className="fx-day-row"
            onClick={() => setCalOpen(true)}
            style={{ width: '100%', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
          >
            <span className="lbl">Dia do mês</span>
            <span className="fx-day-pick">
              <Icon name="calendar_month" size={18} />
              <strong>Dia {draft.day}</strong>
              <Icon name="chevron_right" size={18} color="var(--md-sys-color-on-surface-variant)" />
            </span>
          </button>
        </div>

        <div className="field">
          <div
            className="fx-toggle-row"
            onClick={() => setDraft({ ...draft, recorrente: !draft.recorrente })}
            style={{ cursor: 'pointer' }}
          >
            <div className="ic"><Icon name="autorenew" /></div>
            <div className="txt">
              <div className="t">Recorrente</div>
              <div className="s">Lançar automaticamente todo mês</div>
            </div>
            <div className={`fx-switch${draft.recorrente ? ' on' : ''}`}>
              <div className="thumb">{draft.recorrente && <Icon name="check" size={14} />}</div>
            </div>
          </div>
          {draft.tipo === 'pj' && (
            <div
              className="fx-toggle-row"
              style={{ marginTop: 8, cursor: 'pointer' }}
              onClick={() => setDraft({ ...draft, estimado: !draft.estimado })}
            >
              <div className="ic"><Icon name="schedule" /></div>
              <div className="txt">
                <div className="t">Valor estimado</div>
                <div className="s">Usado para projeção até a NF ser emitida</div>
              </div>
              <div className={`fx-switch${draft.estimado ? ' on' : ''}`}>
                <div className="thumb">{draft.estimado && <Icon name="check" size={14} />}</div>
              </div>
            </div>
          )}
        </div>

        <div className="cta-row">
          <button className="fx-btn text" onClick={onClose}>Cancelar</button>
          <button className="fx-btn flex" onClick={onSave} disabled={draft.amount <= 0}>
            <Icon name="check" size={18} />
            {isEditing ? 'Salvar' : 'Salvar entrada'}
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
        value={draft.day}
        onPick={d => { setDraft({ ...draft, day: d }); setCalOpen(false); }}
        year={currentYear}
        month={currentMonth}
      />
    </>
  );
}
