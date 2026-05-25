import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { SAVINGS_CATEGORIES } from '../types';
import { Icon } from '../components/ui/Icon';
import { NumericKeypad } from '../components/ui/NumericKeypad';
import type { SavingEntry } from '../types';

const MONTHS_SHORT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

const ECO_CAT_CFG: Record<string, { icon: string; color: string; label: string }> = {
  acoes:   { icon: 'trending_up',       color: '#1565C0', label: 'Ações' },
  fundos:  { icon: 'account_balance',   color: '#7B1FA2', label: 'Fundos' },
  fiis:    { icon: 'apartment',         color: '#00838F', label: 'FIIs' },
  cripto:  { icon: 'currency_bitcoin',  color: '#E65100', label: 'Criptomoedas' },
  reserva: { icon: 'shield',            color: '#2E7D32', label: 'Reserva de Emergência' },
  cdb100:  { icon: 'savings',           color: '#5D4037', label: 'CDB 100%' },
  cdb120:  { icon: 'savings',           color: '#455A64', label: 'CDB 120%' },
};

function getCatCfg(id: string) {
  return ECO_CAT_CFG[id] ?? { icon: 'savings', color: '#006A60', label: id };
}

function fxBRLInt(n: number) { return Math.round(n).toLocaleString('pt-BR'); }
function fxBRLSplit(n: number) {
  const [int, dec] = Math.abs(n).toFixed(2).split('.');
  return { int: Number(int).toLocaleString('pt-BR'), dec };
}

// ── PatrimonioChart ─────────────────────────────────────────────
function PatrimonioChart({ savings, currentMonth, currentYear, visible, setVisible }: {
  savings: SavingEntry[];
  currentMonth: number;
  currentYear: number;
  visible: Record<string, boolean>;
  setVisible: (v: Record<string, boolean>) => void;
}) {
  const W = 360, H = 180;
  const PAD_L = 44, PAD_R = 12, PAD_T = 12, PAD_B = 22;
  const innerW = W - PAD_L - PAD_R;
  const innerH = H - PAD_T - PAD_B;

  const months = useMemo(() => {
    const result: { month: number; year: number; label: string }[] = [];
    for (let i = 5; i >= 0; i--) {
      let m = currentMonth - i;
      let y = currentYear;
      while (m <= 0) { m += 12; y--; }
      result.push({ month: m, year: y, label: MONTHS_SHORT[m - 1] });
    }
    return result;
  }, [currentMonth, currentYear]);

  const n = months.length;

  const totalSeries = months.map(({ month, year }) =>
    savings.filter(s => s.month === month && s.year === year).reduce((sum, s) => sum + s.amount, 0)
  );

  const catIds = Array.from(new Set(savings.map(s => s.category)));

  const series: { key: string; label: string; color: string; values: number[]; thick?: boolean }[] = [];
  if (visible['total']) {
    series.push({ key: 'total', label: 'Total', color: 'var(--md-sys-color-on-surface)', thick: true, values: totalSeries });
  }
  for (const catId of catIds) {
    if (visible[catId]) {
      const cfg = getCatCfg(catId);
      series.push({
        key: catId,
        label: cfg.label,
        color: cfg.color,
        values: months.map(({ month, year }) =>
          savings.find(s => s.category === catId && s.month === month && s.year === year)?.amount ?? 0
        ),
      });
    }
  }

  let yMin = Infinity, yMax = -Infinity;
  for (const s of series) for (const v of s.values) { if (v < yMin) yMin = v; if (v > yMax) yMax = v; }
  if (!isFinite(yMin)) { yMin = 0; yMax = 1; }
  const span = Math.max(1, yMax - yMin);

  const xAt = (i: number) => PAD_L + innerW * (n === 1 ? 0.5 : i / (n - 1));
  const yAt = (v: number) => PAD_T + innerH - ((v - yMin) / span) * innerH;

  const legendCats = SAVINGS_CATEGORIES.filter(c => savings.some(s => s.category === c.id));

  return (
    <div className="fx-chart">
      <div className="chart-h">
        <h3>Evolução do patrimônio</h3>
        <span className="range">6 meses</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 180, display: 'block' }}>
        {[0, 0.25, 0.5, 0.75, 1].map(t => {
          const y = PAD_T + innerH * t;
          const value = yMin + (1 - t) * span;
          const label = value >= 1000 ? `${(value / 1000).toFixed(0)}k` : Math.round(value).toString();
          return (
            <g key={t}>
              <line
                x1={PAD_L} x2={W - PAD_R}
                y1={y} y2={y}
                stroke="var(--md-sys-color-outline-variant)"
                strokeDasharray={t === 1 ? '0' : '2 4'}
                strokeWidth="1"
                opacity={t === 1 ? 0.5 : 0.4}
              />
              <text
                x={PAD_L - 6} y={y + 3}
                textAnchor="end" fontSize="9"
                fill="var(--md-sys-color-on-surface-variant)"
                style={{ fontFamily: 'var(--md-ref-typeface-plain)', fontVariantNumeric: 'tabular-nums' }}
              >R$ {label}</text>
            </g>
          );
        })}
        {months.map((m, i) => (
          <text key={i}
            x={xAt(i)} y={H - 4}
            textAnchor="middle" fontSize="10"
            fill="var(--md-sys-color-on-surface-variant)"
            style={{ fontFamily: 'var(--md-ref-typeface-plain)' }}
          >{m.label}</text>
        ))}
        {series.map(s => {
          const path = s.values.map((v, i) => `${i === 0 ? 'M' : 'L'} ${xAt(i).toFixed(1)} ${yAt(v).toFixed(1)}`).join(' ');
          return (
            <g key={s.key}>
              <path d={path} fill="none" stroke={s.color}
                strokeWidth={s.thick ? 3 : 2}
                strokeLinecap="round" strokeLinejoin="round"
              />
              {s.values.map((v, i) => (
                <circle key={i} cx={xAt(i)} cy={yAt(v)} r={i === n - 1 ? 4 : 2.5} fill={s.color} />
              ))}
            </g>
          );
        })}
      </svg>
      <div className="legend">
        <button
          className={`legend-item${visible['total'] ? ' active' : ''}`}
          onClick={() => setVisible({ ...visible, total: !visible['total'] })}
        >
          <span className="swatch" style={{ background: 'var(--md-sys-color-on-surface)' }} />
          Total
        </button>
        {legendCats.map(cat => {
          const cfg = getCatCfg(cat.id);
          const on = !!visible[cat.id];
          return (
            <button key={cat.id}
              className={`legend-item${on ? ' active' : ''}`}
              onClick={() => setVisible({ ...visible, [cat.id]: !on })}
            >
              <span className="swatch" style={{ background: cfg.color }} />
              {cfg.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── EconomiasPage ────────────────────────────────────────────────
export function EconomiasPage() {
  const { savings, currentMonth, currentYear, addSaving, updateSaving, deleteSaving, user } = useApp();
  const [visible, setVisible] = useState<Record<string, boolean>>({ total: true });
  const [actionTarget, setActionTarget] = useState<SavingEntry | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editTarget, setEditTarget] = useState<SavingEntry | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [draftCat, setDraftCat] = useState(SAVINGS_CATEGORIES[0].id);
  const [draftAmount, setDraftAmount] = useState(0);

  const currentMonthSavings = savings.filter(s => s.month === currentMonth && s.year === currentYear);
  const previousMonthSavings = useMemo(() => {
    const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;
    return savings.filter(s => s.month === prevMonth && s.year === prevYear);
  }, [savings, currentMonth, currentYear]);

  const total = currentMonthSavings.reduce((s, sv) => s + sv.amount, 0);
  const prevTotal = previousMonthSavings.reduce((s, sv) => s + sv.amount, 0);
  const delta = total - prevTotal;
  const deltaPct = prevTotal > 0 ? (delta / prevTotal) * 100 : 0;

  const nextReminder = (() => {
    const d = user.savingsReminderDay;
    const next = new Date(currentYear, currentMonth, d);
    return `${String(d).padStart(2, '0')}/${String(next.getMonth() + 1).padStart(2, '0')}`;
  })();

  const openAdd = () => {
    const existing = currentMonthSavings.find(s => s.category === draftCat);
    setDraftAmount(existing?.amount ?? 0);
    setSheetOpen(true);
  };

  const handleSheetSave = () => {
    const catLabel = SAVINGS_CATEGORIES.find(c => c.id === draftCat)?.label ?? draftCat;
    const existing = currentMonthSavings.find(s => s.category === draftCat);
    if (existing) updateSaving(existing.id, { amount: draftAmount });
    else addSaving({ category: draftCat, categoryLabel: catLabel, amount: draftAmount, month: currentMonth, year: currentYear });
    setSheetOpen(false);
  };

  return (
    <>
      <div className="fx-scroll">
        {/* Hero */}
        <div className="fx-eco-total">
          <div className="lbl">Patrimônio total</div>
          <div className="v">
            <span className="currency">R$</span>
            {fxBRLInt(total)}
          </div>
          <div className={`change${delta < 0 ? ' neg' : ''}`}>
            <Icon name={delta >= 0 ? 'trending_up' : 'trending_down'} fill={1} />
            {delta >= 0 ? '+' : '−'} R$ {fxBRLInt(Math.abs(delta))} · {deltaPct >= 0 ? '+' : ''}{deltaPct.toFixed(1)}% no mês
          </div>
        </div>

        <PatrimonioChart
          savings={savings}
          currentMonth={currentMonth}
          currentYear={currentYear}
          visible={visible}
          setVisible={setVisible}
        />

        <div className="fx-section-h">
          <h2>Por categoria</h2>
          <span className="link" onClick={openAdd} style={{ cursor: 'pointer' }}>Atualizar</span>
        </div>

        {currentMonthSavings.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 16px', color: 'var(--md-sys-color-on-surface-variant)', font: '400 14px/20px var(--md-ref-typeface-plain)' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>💼</div>
            <div>Nenhum dado de investimentos este mês.</div>
            <button onClick={openAdd} style={{ marginTop: 12, color: 'var(--md-sys-color-primary)', font: '500 14px/20px var(--md-ref-typeface-plain)', background: 'none', border: 'none', cursor: 'pointer' }}>
              + Registrar agora
            </button>
          </div>
        ) : (
          <div className="fx-eco-list">
            {currentMonthSavings.map(saving => {
              const cfg = getCatCfg(saving.category);
              const prev = previousMonthSavings.find(s => s.category === saving.category);
              const d = saving.amount - (prev?.amount ?? 0);
              const pct = prev && prev.amount > 0 ? (d / prev.amount) * 100 : 0;
              return (
                <button
                  key={saving.id}
                  className="fx-eco-item"
                  onClick={() => { setActionTarget(saving); setConfirmDelete(false); }}
                  style={{ border: 'none', background: 'transparent', width: '100%', textAlign: 'left', fontFamily: 'inherit', color: 'inherit', cursor: 'pointer' }}
                >
                  <div className="glyph" style={{
                    background: `color-mix(in srgb, ${cfg.color} 18%, var(--md-sys-color-surface-container))`,
                    color: cfg.color,
                  }}>
                    <Icon name={cfg.icon} />
                  </div>
                  <div>
                    <div className="desc">{saving.categoryLabel}</div>
                    <div className="meta">Saldo em {currentYear}/{String(currentMonth).padStart(2, '0')}</div>
                  </div>
                  <div className="right">
                    <div className="v">
                      <span className="currency">R$ </span>
                      {fxBRLInt(saving.amount)}
                      <Icon name="edit" size={12} color="var(--md-sys-color-on-surface-variant)" style={{ marginLeft: 5, opacity: 0.5, verticalAlign: 'middle' }} />
                    </div>
                    <div className={`delta${d >= 0 ? ' pos' : ' neg'}`}>
                      <Icon name={d >= 0 ? 'arrow_upward' : 'arrow_downward'} />
                      {d >= 0 ? '+' : '−'} R$ {fxBRLInt(Math.abs(d))} ({pct >= 0 ? '+' : ''}{pct.toFixed(1)}%)
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        <div style={{ padding: '20px 16px 4px', display: 'flex', justifyContent: 'center' }}>
          <button className="fx-btn tonal" style={{ width: 'auto' }} onClick={openAdd}>
            <Icon name="add" size={18} />Atualizar economias
          </button>
        </div>

        <div style={{ margin: '16px 16px 120px', padding: '14px 18px', background: 'var(--md-sys-color-surface-container-low)', borderRadius: 18, display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ width: 36, height: 36, borderRadius: 12, background: 'var(--md-sys-color-primary-container)', color: 'var(--md-sys-color-on-primary-container)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icon name="schedule" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ font: '500 13px/18px var(--md-ref-typeface-plain)', color: 'var(--md-sys-color-on-surface)' }}>
              Próximo lembrete · {nextReminder}
            </div>
            <div style={{ font: '400 12px/16px var(--md-ref-typeface-plain)', color: 'var(--md-sys-color-on-surface-variant)', marginTop: 2 }}>
              Atualize o saldo de cada categoria no dia {user.savingsReminderDay}.
            </div>
          </div>
        </div>
      </div>

      {/* ActionSheet */}
      <div className={`fx-scrim${actionTarget ? ' open' : ''}`} onClick={() => setActionTarget(null)} />
      <div className={`fx-sheet fx-actions-sheet${actionTarget ? ' open' : ''}`} style={{ paddingBottom: 16 }}>
        <div className="grabber" />
        {actionTarget && (
          <>
            <div className="sheet-title">{actionTarget.categoryLabel}</div>
            <div className="sheet-subtitle">R$ {fxBRLInt(actionTarget.amount)}</div>
            <div className="fx-action-list">
              <button className="fx-action-row" onClick={() => { setEditTarget(actionTarget); setActionTarget(null); }}>
                <div className="ic"><Icon name="edit" /></div>
                <div className="txt">
                  <div className="t">Editar</div>
                  <div className="s">Atualizar o saldo desta categoria</div>
                </div>
                <Icon name="chevron_right" color="var(--md-sys-color-on-surface-variant)" />
              </button>
              {!confirmDelete ? (
                <button className="fx-action-row danger" onClick={() => setConfirmDelete(true)}>
                  <div className="ic"><Icon name="delete" /></div>
                  <div className="txt">
                    <div className="t">Excluir</div>
                    <div className="s">Remover este registro permanentemente</div>
                  </div>
                </button>
              ) : (
                <div className="fx-confirm-delete">
                  <div className="msg">
                    <Icon name="warning" fill={1} />
                    <span>Excluir <strong>{actionTarget.categoryLabel}</strong>? O saldo será recalculado.</span>
                  </div>
                  <div className="row">
                    <button className="fx-btn text" onClick={() => setConfirmDelete(false)}>Cancelar</button>
                    <button className="fx-btn flex danger" onClick={() => { deleteSaving(actionTarget.id); setActionTarget(null); setConfirmDelete(false); }}>
                      <Icon name="delete" size={18} />Excluir
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Edit existing saving sheet */}
      {editTarget && (
        <EditEconomiaSheet
          target={editTarget}
          prevAmount={previousMonthSavings.find(s => s.category === editTarget.category)?.amount ?? 0}
          onClose={() => setEditTarget(null)}
          onSave={amount => {
            updateSaving(editTarget.id, { amount });
            setEditTarget(null);
          }}
        />
      )}

      {/* Nova / Atualizar saving sheet */}
      <NovaEconomiaSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        draftCat={draftCat}
        setDraftCat={(cat) => {
          setDraftCat(cat);
          const existing = currentMonthSavings.find(s => s.category === cat);
          setDraftAmount(existing?.amount ?? 0);
        }}
        draftAmount={draftAmount}
        setDraftAmount={setDraftAmount}
        onSave={handleSheetSave}
        currentMonthSavings={currentMonthSavings}
      />
    </>
  );
}

// ── EditEconomiaSheet ───────────────────────────────────────────
function EditEconomiaSheet({ target, prevAmount, onClose, onSave }: {
  target: SavingEntry;
  prevAmount: number;
  onClose: () => void;
  onSave: (amount: number) => void;
}) {
  const [amount, setAmount] = useState(target.amount);
  const [padOpen, setPadOpen] = useState(false);
  const delta = amount - prevAmount;
  const amt = fxBRLSplit(amount || 0);

  return (
    <>
      <div className="fx-scrim open" onClick={onClose} style={{ zIndex: 52 }} />
      <div className="fx-sheet open" style={{ zIndex: 53 }}>
        <div className="grabber" />
        <div className="sheet-title">Atualizar saldo</div>
        <div className="sheet-subtitle">{target.categoryLabel}</div>

        <div className="amount-input" onClick={() => setPadOpen(true)} style={{ cursor: 'pointer' }}>
          <div className="lbl">Saldo atual</div>
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
          <div style={{
            padding: '12px 16px', borderRadius: 12,
            background: delta >= 0 ? 'var(--fx-status-green-bg)' : 'var(--fx-status-red-bg)',
            color: delta >= 0 ? 'var(--fx-status-green-fg)' : 'var(--fx-status-red-fg)',
            display: 'flex', alignItems: 'center', gap: 8,
            font: '500 13px/18px var(--md-ref-typeface-plain)',
          }}>
            <Icon name={delta >= 0 ? 'trending_up' : 'trending_down'} fill={1} />
            Variação no mês: {delta >= 0 ? '+' : '−'} R$ {fxBRLInt(Math.abs(delta))}
          </div>
        </div>

        <div className="cta-row">
          <button className="fx-btn text" onClick={onClose}>Cancelar</button>
          <button className="fx-btn flex" onClick={() => onSave(amount)} disabled={amount <= 0}>
            <Icon name="check" size={18} />Salvar saldo
          </button>
        </div>
      </div>

      <NumericKeypad
        open={padOpen}
        onClose={() => setPadOpen(false)}
        value={amount}
        onChange={setAmount}
        onConfirm={() => setPadOpen(false)}
      />
    </>
  );
}

// ── NovaEconomiaSheet ────────────────────────────────────────────
function NovaEconomiaSheet({ open, onClose, draftCat, setDraftCat, draftAmount, setDraftAmount, onSave, currentMonthSavings }: {
  open: boolean;
  onClose: () => void;
  draftCat: string;
  setDraftCat: (cat: string) => void;
  draftAmount: number;
  setDraftAmount: (n: number) => void;
  onSave: () => void;
  currentMonthSavings: SavingEntry[];
}) {
  const [padOpen, setPadOpen] = useState(false);
  const amt = fxBRLSplit(draftAmount || 0);
  const hasExisting = currentMonthSavings.some(s => s.category === draftCat);

  return (
    <>
      <div className={`fx-scrim${open ? ' open' : ''}`} onClick={onClose} style={{ zIndex: 50 }} />
      <div className={`fx-sheet${open ? ' open' : ''}`} style={{ zIndex: 51 }}>
        <div className="grabber" />
        <div className="sheet-title">{hasExisting ? 'Atualizar categoria' : 'Nova categoria'}</div>
        <div className="sheet-subtitle">Informe o saldo atual da categoria</div>

        <div className="field">
          <div className="field-lbl">Categoria</div>
          <div className="cat-tags">
            {SAVINGS_CATEGORIES.map(cat => {
              const cfg = getCatCfg(cat.id);
              return (
                <button
                  key={cat.id}
                  className={`cat-tag${draftCat === cat.id ? ' selected' : ''}`}
                  onClick={() => setDraftCat(cat.id)}
                >
                  <Icon name={cfg.icon} size={16} />{cfg.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="amount-input" onClick={() => setPadOpen(true)} style={{ cursor: 'pointer' }}>
          <div className="lbl">Saldo atual</div>
          <div className="amount">
            <span className="currency">R$</span>
            <span>{amt.int},{amt.dec}</span>
            <span className="cursor" />
          </div>
          <div style={{ font: '400 11px/14px var(--md-ref-typeface-plain)', color: 'var(--md-sys-color-on-surface-variant)', marginTop: 6, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <Icon name="keyboard" size={14} />Toque para digitar
          </div>
        </div>

        <div className="cta-row">
          <button className="fx-btn text" onClick={onClose}>Cancelar</button>
          <button className="fx-btn flex" onClick={onSave} disabled={draftAmount <= 0}>
            <Icon name="check" size={18} />{hasExisting ? 'Atualizar' : 'Salvar'}
          </button>
        </div>
      </div>

      <NumericKeypad
        open={padOpen}
        onClose={() => setPadOpen(false)}
        value={draftAmount}
        onChange={setDraftAmount}
        onConfirm={() => setPadOpen(false)}
      />
    </>
  );
}
