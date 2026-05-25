import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { useDarkMode } from '../hooks/useDarkMode';
import { Icon } from '../components/ui/Icon';
import type { CreditCard as CC } from '../types';

const AVATARS = ['raposa', 'coruja', 'urso', 'gato', 'cachorro'] as const;

// ── AvatarSvg ────────────────────────────────────────────────────
function AvatarSvg({ kind, size = 56 }: { kind: string; size?: number }) {
  const sets: Record<string, { bg: string; svg: React.ReactNode }> = {
    raposa: {
      bg: '#FFE0B2',
      svg: (
        <g>
          <path d="M40 22 L24 14 L26 30 Z" fill="#E65100" />
          <path d="M40 22 L56 14 L54 30 Z" fill="#E65100" />
          <ellipse cx="40" cy="44" rx="22" ry="20" fill="#FB8C00" />
          <path d="M40 64 L34 56 H46 Z" fill="#FFFFFF" />
          <circle cx="32" cy="42" r="3.5" fill="#1A1A1A" />
          <circle cx="48" cy="42" r="3.5" fill="#1A1A1A" />
          <ellipse cx="40" cy="54" rx="3" ry="2.5" fill="#1A1A1A" />
        </g>
      ),
    },
    coruja: {
      bg: '#D7CCC8',
      svg: (
        <g>
          <ellipse cx="40" cy="42" rx="24" ry="22" fill="#8D6E63" />
          <circle cx="30" cy="38" r="10" fill="#FFF" />
          <circle cx="50" cy="38" r="10" fill="#FFF" />
          <circle cx="30" cy="38" r="5" fill="#1A1A1A" />
          <circle cx="50" cy="38" r="5" fill="#1A1A1A" />
          <path d="M40 46 L34 54 L46 54 Z" fill="#FFA000" />
          <path d="M20 28 L26 22 L28 30 Z M60 28 L54 22 L52 30 Z" fill="#5D4037" />
        </g>
      ),
    },
    urso: {
      bg: '#FFCCBC',
      svg: (
        <g>
          <circle cx="22" cy="24" r="8" fill="#6D4C41" />
          <circle cx="58" cy="24" r="8" fill="#6D4C41" />
          <circle cx="22" cy="24" r="4" fill="#FFAB91" />
          <circle cx="58" cy="24" r="4" fill="#FFAB91" />
          <ellipse cx="40" cy="44" rx="22" ry="20" fill="#8D6E63" />
          <ellipse cx="40" cy="52" rx="12" ry="9" fill="#FFAB91" />
          <circle cx="32" cy="42" r="2.5" fill="#1A1A1A" />
          <circle cx="48" cy="42" r="2.5" fill="#1A1A1A" />
          <ellipse cx="40" cy="50" rx="2.5" ry="2" fill="#1A1A1A" />
        </g>
      ),
    },
    gato: {
      bg: '#FFE0B2',
      svg: (
        <g>
          <path d="M40 22 L22 16 L26 32 Z" fill="#FFA000" />
          <path d="M40 22 L58 16 L54 32 Z" fill="#FFA000" />
          <path d="M40 22 L24 18 L27 28 Z" fill="#FFCC80" />
          <path d="M40 22 L56 18 L53 28 Z" fill="#FFCC80" />
          <ellipse cx="40" cy="46" rx="22" ry="20" fill="#FFB74D" />
          <circle cx="31" cy="44" r="3" fill="#1A1A1A" />
          <circle cx="49" cy="44" r="3" fill="#1A1A1A" />
          <path d="M40 52 L36 54 L40 56 L44 54 Z" fill="#FF7043" />
          <path d="M22 50 L14 48 M22 52 L13 53 M22 54 L14 56" stroke="#1A1A1A" strokeWidth="0.8" strokeLinecap="round" />
          <path d="M58 50 L66 48 M58 52 L67 53 M58 54 L66 56" stroke="#1A1A1A" strokeWidth="0.8" strokeLinecap="round" />
        </g>
      ),
    },
    cachorro: {
      bg: '#FFCDD2',
      svg: (
        <g>
          <ellipse cx="20" cy="32" rx="9" ry="14" fill="#795548" transform="rotate(-20 20 32)" />
          <ellipse cx="60" cy="32" rx="9" ry="14" fill="#795548" transform="rotate(20 60 32)" />
          <ellipse cx="40" cy="46" rx="22" ry="20" fill="#A1887F" />
          <ellipse cx="40" cy="56" rx="14" ry="9" fill="#FFE0B2" />
          <circle cx="32" cy="42" r="3" fill="#1A1A1A" />
          <circle cx="48" cy="42" r="3" fill="#1A1A1A" />
          <ellipse cx="40" cy="54" rx="3" ry="2.5" fill="#1A1A1A" />
          <path d="M40 56 L40 62" stroke="#1A1A1A" strokeWidth="1.5" />
        </g>
      ),
    },
  };
  const a = sets[kind] ?? sets.raposa;
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: a.bg, overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg viewBox="0 0 80 80" width={size} height={size}>{a.svg}</svg>
    </div>
  );
}

// ── Local atoms ──────────────────────────────────────────────────
function PrefSectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ padding: '16px 24px 6px', font: '500 11px/14px var(--md-ref-typeface-plain)', letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--md-sys-color-on-surface-variant)' }}>
      {children}
    </div>
  );
}

function PrefRow({ icon, title, subtitle, trailing, accent, isAction, danger, expandable, children }: {
  icon: string; title: string; subtitle?: string;
  trailing?: React.ReactNode; accent?: string;
  isAction?: boolean; danger?: boolean;
  expandable?: boolean; children?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <div
        className={`fx-pref-row${isAction ? ' action' : ''}${danger ? ' danger' : ''}`}
        onClick={expandable ? () => setOpen(o => !o) : undefined}
        style={expandable || isAction ? { cursor: 'pointer' } : { cursor: 'default' }}
      >
        <div className="ic" style={accent ? { background: accent + '22', color: accent } : undefined}>
          <Icon name={icon} />
        </div>
        <div className="txt">
          <div className="t">{title}</div>
          {subtitle && <div className="s">{subtitle}</div>}
        </div>
        <div className="tr" style={expandable ? { transform: open ? 'rotate(90deg)' : 'none', transition: 'transform 200ms' } : undefined}>
          {expandable ? <Icon name="chevron_right" color="var(--md-sys-color-on-surface-variant)" /> : trailing}
        </div>
      </div>
      {expandable && (
        <div style={{ maxHeight: open ? 320 : 0, overflow: 'hidden', transition: 'max-height 280ms cubic-bezier(0.2,0,0,1)' }}>
          <div style={{ padding: '4px 16px 12px' }}>{children}</div>
        </div>
      )}
    </>
  );
}

function RadioRow({ selected, onSelect, icon, title, subtitle }: {
  selected: boolean; onSelect: () => void;
  icon: string; title: string; subtitle?: string;
}) {
  return (
    <div
      className={`fx-pref-row fx-radio-row${selected ? ' selected' : ''}`}
      onClick={onSelect}
      role="button"
      tabIndex={0}
      style={{ cursor: 'pointer' }}
    >
      <div className="ic"><Icon name={icon} /></div>
      <div className="txt">
        <div className="t">{title}</div>
        {subtitle && <div className="s">{subtitle}</div>}
      </div>
      <div className="tr">
        <div className={`radio${selected ? ' on' : ''}`}>
          {selected && <div className="dot" />}
        </div>
      </div>
    </div>
  );
}

function FaixaRow({ color, label, rule }: { color: string; label: string; rule: string }) {
  const c: Record<string, { dot: string; bg: string; fg: string }> = {
    blue:   { dot: 'var(--fx-status-blue)',   bg: 'var(--fx-status-blue-bg)',   fg: 'var(--fx-status-blue-fg)' },
    green:  { dot: 'var(--fx-status-green)',  bg: 'var(--fx-status-green-bg)',  fg: 'var(--fx-status-green-fg)' },
    yellow: { dot: 'var(--fx-status-yellow)', bg: 'var(--fx-status-yellow-bg)', fg: 'var(--fx-status-yellow-fg)' },
    red:    { dot: 'var(--fx-status-red)',     bg: 'var(--fx-status-red-bg)',    fg: 'var(--fx-status-red-fg)' },
  };
  const cv = c[color] ?? c.blue;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 10px', background: cv.bg, color: cv.fg, borderRadius: 12, marginTop: 6 }}>
      <div style={{ width: 10, height: 10, borderRadius: '50%', background: cv.dot, flexShrink: 0 }} />
      <div style={{ flex: 1, font: '500 13px/18px var(--md-ref-typeface-plain)' }}>{label}</div>
      <div style={{ font: '400 12px/16px var(--md-ref-typeface-plain)', opacity: 0.85 }}>{rule}</div>
    </div>
  );
}

// ── PerfilPage ───────────────────────────────────────────────────
export function PerfilPage() {
  const { user, creditCards, updateUser, addCreditCard, updateCreditCard, deleteCreditCard } = useApp();
  const { signOut } = useAuth();
  const { isDark, toggle } = useDarkMode();
  const navigate = useNavigate();
  const [editingName, setEditingName] = useState(false);
  const [nameVal, setNameVal] = useState(user.name);
  const [cardSheetOpen, setCardSheetOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<CC | null>(null);

  const faixas = user.statusThresholds;

  const openNewCard = () => { setEditingCard(null); setCardSheetOpen(true); };
  const openEditCard = (card: CC) => { setEditingCard(card); setCardSheetOpen(true); };

  return (
    <>
      <div className="fx-scroll" style={{ paddingBottom: 24 }}>

        {/* Identity */}
        <div className="fx-perfil-id">
          <AvatarSvg kind={user.avatar} size={80} />
          <div style={{ flex: 1, minWidth: 0 }}>
            {editingName ? (
              <input
                value={nameVal}
                autoFocus
                onChange={e => setNameVal(e.target.value)}
                onBlur={() => { updateUser({ name: nameVal }); setEditingName(false); }}
                onKeyDown={e => { if (e.key === 'Enter') { updateUser({ name: nameVal }); setEditingName(false); } }}
                style={{ font: '500 22px/28px var(--md-ref-typeface-brand)', color: 'var(--md-sys-color-on-surface)', background: 'var(--md-sys-color-surface-container)', border: 'none', borderRadius: 8, padding: '2px 8px', outline: 'none', width: '100%' }}
              />
            ) : (
              <button className="fx-perfil-name" onClick={() => setEditingName(true)}>
                {user.name}
                <Icon name="edit" size={16} />
              </button>
            )}
            <div className="fx-perfil-email">{user.email}</div>
            <div className="fx-perfil-meta">
              <span className="badge">
                <Icon name="bolt" size={14} fill={1} />Anual · ativo
              </span>
            </div>
          </div>
        </div>

        {/* Avatar picker */}
        <div className="fx-section-h" style={{ paddingTop: 12 }}>
          <h2>Escolha seu avatar</h2>
        </div>
        <div className="fx-avatar-picker">
          {AVATARS.map(k => (
            <button
              key={k}
              className={`avatar-pick${user.avatar === k ? ' selected' : ''}`}
              onClick={() => updateUser({ avatar: k })}
            >
              <AvatarSvg kind={k} size={48} />
              <span className="lbl">{k}</span>
            </button>
          ))}
        </div>

        {/* Configurações */}
        <div className="fx-section-h" style={{ paddingTop: 24 }}>
          <h2>Configurações</h2>
        </div>
        <div className="fx-pref-group">
          <PrefRow
            icon="palette"
            title="Modo escuro"
            subtitle="Mude entre tema claro e escuro"
            trailing={
              <button className={`fx-switch${isDark ? ' on' : ''}`} onClick={toggle} role="switch" aria-checked={isDark}>
                <div className="thumb">{isDark && <Icon name="check" size={14} />}</div>
              </button>
            }
          />
        </div>

        {/* Final do mês */}
        <PrefSectionLabel>Final do mês</PrefSectionLabel>
        <div className="fx-pref-group">
          <RadioRow
            selected={user.balanceCarryover === 'auto'}
            onSelect={() => updateUser({ balanceCarryover: 'auto' })}
            icon="forward"
            title="Transportar saldo"
            subtitle="O saldo restante soma ao próximo mês"
          />
          <RadioRow
            selected={user.balanceCarryover === 'manual'}
            onSelect={() => updateUser({ balanceCarryover: 'manual' })}
            icon="savings"
            title="Enviar para Economias"
            subtitle="O app pergunta quanto destinar; o restante zera"
          />
        </div>

        {/* Status do mês */}
        <PrefSectionLabel>Status do mês</PrefSectionLabel>
        <div className="fx-pref-group">
          <PrefRow
            icon="tune"
            title="Faixas de cor"
            subtitle="Configurar limites do indicador (azul · verde · amarelo · vermelho)"
            expandable
          >
            <FaixaRow color="blue"   label="Maravilhoso" rule={`> ${faixas.maravilhoso}% da renda`} />
            <FaixaRow color="green"  label="Bom"         rule={`${faixas.bom + 1}% a ${faixas.maravilhoso}%`} />
            <FaixaRow color="yellow" label="Atenção"     rule={`${faixas.atencao + 1}% a ${faixas.bom}%`} />
            <FaixaRow color="red"    label="Alerta"      rule={`≤ ${faixas.atencao}%`} />
          </PrefRow>
        </div>

        {/* Cartões de crédito */}
        <PrefSectionLabel>Cartões de crédito</PrefSectionLabel>
        <div className="fx-pref-group">
          {creditCards.map(card => (
            <PrefRow
              key={card.id}
              icon="credit_card"
              title={card.name}
              subtitle={`Fecha dia ${card.closingDay} · Vence dia ${card.dueDay}`}
              trailing={
                <div style={{ display: 'inline-flex', gap: 4 }}>
                  <button
                    onClick={e => { e.stopPropagation(); openEditCard(card); }}
                    style={{ padding: 6, borderRadius: 8, border: 'none', background: 'transparent', cursor: 'pointer', display: 'inline-flex' }}
                  >
                    <Icon name="edit" size={16} color="var(--md-sys-color-on-surface-variant)" />
                  </button>
                  <button
                    onClick={e => { e.stopPropagation(); deleteCreditCard(card.id); }}
                    style={{ padding: 6, borderRadius: 8, border: 'none', background: 'transparent', cursor: 'pointer', display: 'inline-flex' }}
                  >
                    <Icon name="delete" size={16} color="var(--fx-status-red)" />
                  </button>
                </div>
              }
            />
          ))}
          <div onClick={openNewCard} style={{ cursor: 'pointer' }}>
            <PrefRow
              icon="add"
              title="Adicionar cartão"
              subtitle="Cadastre fechamento e vencimento"
              isAction
            />
          </div>
        </div>

        {/* Economias */}
        <PrefSectionLabel>Economias</PrefSectionLabel>
        <div className="fx-pref-group">
          <PrefRow
            icon="schedule"
            title="Lembrete mensal"
            subtitle={`Notificar todo dia ${user.savingsReminderDay} para atualizar saldos`}
            trailing={
              <div className="fx-day-stepper">
                <button onClick={e => { e.stopPropagation(); updateUser({ savingsReminderDay: Math.max(1, user.savingsReminderDay - 1) }); }} aria-label="Anterior">
                  <Icon name="remove" size={16} />
                </button>
                <span>{user.savingsReminderDay}</span>
                <button onClick={e => { e.stopPropagation(); updateUser({ savingsReminderDay: Math.min(28, user.savingsReminderDay + 1) }); }} aria-label="Próximo">
                  <Icon name="add" size={16} />
                </button>
              </div>
            }
          />
        </div>

        {/* Conta */}
        <PrefSectionLabel>Conta</PrefSectionLabel>
        <div className="fx-pref-group">
          <PrefRow
            icon="notifications"
            title="Alertas in-app"
            subtitle="Gerenciar notificações de status, vencimento e lembretes"
            trailing={<Icon name="chevron_right" color="var(--md-sys-color-on-surface-variant)" />}
          />
          <PrefRow
            icon="workspace_premium"
            title="Assinatura"
            subtitle="Plano anual · renova em 12/2026"
            trailing={<Icon name="chevron_right" color="var(--md-sys-color-on-surface-variant)" />}
          />
          <PrefRow
            icon="help"
            title="Ajuda e suporte"
            trailing={<Icon name="chevron_right" color="var(--md-sys-color-on-surface-variant)" />}
          />
          <PrefRow
            icon="logout"
            title="Sair da conta"
            danger
            isAction
            trailing={
              <button
                onClick={async e => { e.stopPropagation(); await signOut(); navigate('/'); }}
                style={{ font: '500 14px/20px var(--md-ref-typeface-plain)', color: 'var(--fx-status-red)', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                Sair
              </button>
            }
          />
        </div>

        <div style={{ padding: '20px 24px 60px', font: '400 11px/16px var(--md-ref-typeface-plain)', color: 'var(--md-sys-color-on-surface-variant)', textAlign: 'center' }}>
          Fluxo · v0.9 · LGPD compliant
        </div>
      </div>

      {/* Card sheet */}
      <CardSheet
        open={cardSheetOpen}
        initial={editingCard}
        onClose={() => { setCardSheetOpen(false); setEditingCard(null); }}
        onSave={data => {
          if (editingCard) updateCreditCard(editingCard.id, data);
          else addCreditCard(data);
          setCardSheetOpen(false);
          setEditingCard(null);
        }}
      />
    </>
  );
}

// ── CardSheet ────────────────────────────────────────────────────
function CardSheet({ open, initial, onClose, onSave }: {
  open: boolean;
  initial: CC | null;
  onClose: () => void;
  onSave: (data: Omit<CC, 'id' | 'userId'>) => void;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [closingDay, setClosingDay] = useState(initial?.closingDay?.toString() ?? '15');
  const [dueDay, setDueDay] = useState(initial?.dueDay?.toString() ?? '10');

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({ name: name.trim(), closingDay: parseInt(closingDay) || 15, dueDay: parseInt(dueDay) || 10 });
  };

  return (
    <>
      <div className={`fx-scrim${open ? ' open' : ''}`} onClick={onClose} style={{ zIndex: 50 }} />
      <div className={`fx-sheet${open ? ' open' : ''}`} style={{ zIndex: 51 }}>
        <div className="grabber" />
        <div className="sheet-title">{initial ? 'Editar cartão' : 'Novo cartão'}</div>
        <div className="sheet-subtitle">Cadastre fechamento e vencimento</div>

        <div className="field">
          <div className="field-lbl">Nome do cartão</div>
          <input
            className="desc-input"
            placeholder="Ex: Nubank, Itaú Visa..."
            value={name}
            onChange={e => setName(e.target.value)}
          />
        </div>

        <div className="field" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <div className="field-lbl">Dia fechamento</div>
            <input
              className="desc-input"
              type="number" min="1" max="31"
              value={closingDay}
              onChange={e => setClosingDay(e.target.value)}
            />
          </div>
          <div>
            <div className="field-lbl">Dia vencimento</div>
            <input
              className="desc-input"
              type="number" min="1" max="31"
              value={dueDay}
              onChange={e => setDueDay(e.target.value)}
            />
          </div>
        </div>

        <div className="cta-row">
          <button className="fx-btn text" onClick={onClose}>Cancelar</button>
          <button className="fx-btn flex" onClick={handleSave} disabled={!name.trim()}>
            <Icon name="check" size={18} />{initial ? 'Salvar' : 'Adicionar'}
          </button>
        </div>
      </div>
    </>
  );
}
