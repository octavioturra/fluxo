import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { useDarkMode } from '../hooks/useDarkMode';
import { Icon } from '../components/ui/Icon';
import { Modal } from '../components/ui/Modal';
import type { CreditCard as CC } from '../types';

const AVATARS = ['raposa', 'coruja', 'urso', 'gato', 'cachorro'] as const;
type AvatarKind = typeof AVATARS[number];

// ─── Avatar SVG illustrations ──────────────────────────────────
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
          <ellipse cx="40" cy="46" rx="22" ry="20" fill="#FFB74D" />
          <circle cx="31" cy="44" r="3" fill="#1A1A1A" />
          <circle cx="49" cy="44" r="3" fill="#1A1A1A" />
          <path d="M40 52 L36 54 L40 56 L44 54 Z" fill="#FF7043" />
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
        </g>
      ),
    },
  };
  const a = sets[kind] ?? sets.raposa;
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: a.bg, overflow: 'hidden', flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <svg viewBox="0 0 80 80" width={size} height={size}>{a.svg}</svg>
    </div>
  );
}

// ─── Switch ────────────────────────────────────────────────────
function Switch({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch" aria-checked={value}
      onClick={() => onChange(!value)}
      className="w-12 h-6 rounded-full relative flex-shrink-0 transition-colors duration-200"
      style={{ background: value ? 'var(--fx-primary)' : 'var(--fx-surface-container-highest)' }}
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
    </button>
  );
}

// ─── Radio ────────────────────────────────────────────────────
function Radio({ selected }: { selected: boolean }) {
  return (
    <div
      className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors"
      style={{
        borderColor: selected ? 'var(--fx-primary)' : 'var(--fx-outline)',
        background: 'transparent',
      }}
    >
      {selected && (
        <div className="w-2.5 h-2.5 rounded-full" style={{ background: 'var(--fx-primary)' }} />
      )}
    </div>
  );
}

// ─── PrefRow ──────────────────────────────────────────────────
function PrefRow({ icon, title, subtitle, trailing, accent, danger, children }: {
  icon: string;
  title: string;
  subtitle?: string;
  trailing?: React.ReactNode;
  accent?: string;
  danger?: boolean;
  children?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const expandable = !!children;

  return (
    <>
      <div
        className="flex items-center gap-3 px-4 py-3.5"
        onClick={expandable ? () => setOpen(o => !o) : undefined}
        style={{ cursor: expandable ? 'pointer' : 'default' }}
      >
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={accent ? {
            background: accent + '22', color: accent,
          } : {
            background: danger ? 'var(--fx-error-container)' : 'var(--fx-surface-container-high)',
            color: danger ? 'var(--fx-error)' : 'var(--fx-on-surface-variant)',
          }}
        >
          <Icon name={icon} size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <div
            className="text-sm font-medium"
            style={{ color: danger ? 'var(--fx-red)' : 'var(--fx-on-surface)' }}
          >
            {title}
          </div>
          {subtitle && (
            <div className="text-xs mt-0.5" style={{ color: 'var(--fx-on-surface-variant)' }}>{subtitle}</div>
          )}
        </div>
        {expandable ? (
          <div style={{
            color: 'var(--fx-on-surface-variant)',
            transform: open ? 'rotate(90deg)' : 'none',
            transition: 'transform 200ms',
          }}>
            <Icon name="chevron_right" size={20} />
          </div>
        ) : trailing}
      </div>
      {expandable && (
        <div style={{
          maxHeight: open ? 400 : 0,
          overflow: 'hidden',
          transition: 'max-height 280ms cubic-bezier(0.2,0,0,1)',
        }}>
          <div className="px-4 pb-3">{children}</div>
        </div>
      )}
    </>
  );
}

function PrefSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="px-5 pt-5 pb-1.5 text-[11px] font-semibold uppercase tracking-widest"
        style={{ color: 'var(--fx-on-surface-variant)' }}>
        {label}
      </div>
      <div className="mx-4 rounded-2xl overflow-hidden divide-y"
        style={{
          background: 'var(--fx-surface-container-low)',
          '--divide-color': 'var(--fx-surface-container)',
        } as React.CSSProperties}>
        {children}
      </div>
    </div>
  );
}

// ─── Faixas de cor ────────────────────────────────────────────
function FaixaRow({ color, label, rule }: { color: string; label: string; rule: string }) {
  const colors: Record<string, { bg: string; fg: string; dot: string }> = {
    blue:   { bg: 'var(--fx-blue-bg)',   fg: 'var(--fx-blue-fg)',   dot: 'var(--fx-blue)' },
    green:  { bg: 'var(--fx-green-bg)',  fg: 'var(--fx-green-fg)',  dot: 'var(--fx-green)' },
    yellow: { bg: 'var(--fx-yellow-bg)', fg: 'var(--fx-yellow-fg)', dot: 'var(--fx-yellow)' },
    red:    { bg: 'var(--fx-red-bg)',    fg: 'var(--fx-red-fg)',    dot: 'var(--fx-red)' },
  };
  const c = colors[color] ?? colors.blue;
  return (
    <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl mt-2"
      style={{ background: c.bg, color: c.fg }}>
      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: c.dot }} />
      <div className="flex-1 text-sm font-medium">{label}</div>
      <div className="text-xs opacity-85">{rule}</div>
    </div>
  );
}

// ─── Card form ────────────────────────────────────────────────
function CardForm({ initial, onSubmit, onCancel }: {
  initial?: Partial<CC>;
  onSubmit: (data: Omit<CC, 'id' | 'userId'>) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [closingDay, setClosingDay] = useState(initial?.closingDay?.toString() ?? '15');
  const [dueDay, setDueDay] = useState(initial?.dueDay?.toString() ?? '10');

  const inputStyle = {
    background: 'var(--fx-surface-container)',
    border: '1px solid var(--fx-outline-variant)',
    color: 'var(--fx-on-surface)',
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    onSubmit({ name, closingDay: parseInt(closingDay), dueDay: parseInt(dueDay) });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-semibold uppercase mb-1" style={{ color: 'var(--fx-on-surface-variant)' }}>
          Nome do cartão
        </label>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Nubank, Itaú Visa..."
          className="w-full py-2.5 px-3 rounded-xl text-sm outline-none" style={inputStyle} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold uppercase mb-1" style={{ color: 'var(--fx-on-surface-variant)' }}>
            Dia fechamento
          </label>
          <input type="number" min="1" max="31" value={closingDay} onChange={e => setClosingDay(e.target.value)}
            className="w-full py-2.5 px-3 rounded-xl text-sm outline-none" style={inputStyle} />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase mb-1" style={{ color: 'var(--fx-on-surface-variant)' }}>
            Dia vencimento
          </label>
          <input type="number" min="1" max="31" value={dueDay} onChange={e => setDueDay(e.target.value)}
            className="w-full py-2.5 px-3 rounded-xl text-sm outline-none" style={inputStyle} />
        </div>
      </div>
      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onCancel}
          className="flex-1 py-3 rounded-full text-sm font-medium"
          style={{ border: '1px solid var(--fx-outline-variant)', color: 'var(--fx-on-surface)' }}>
          Cancelar
        </button>
        <button type="submit"
          className="flex-1 py-3 rounded-full text-sm font-semibold"
          style={{ background: 'var(--fx-primary)', color: 'var(--fx-on-primary)' }}>
          Salvar
        </button>
      </div>
    </form>
  );
}

// ─── Main page ────────────────────────────────────────────────
export function PerfilPage() {
  const { user, creditCards, updateUser, addCreditCard, updateCreditCard, deleteCreditCard } = useApp();
  const { signOut } = useAuth();
  const { isDark, toggle } = useDarkMode();
  const navigate = useNavigate();
  const [editName, setEditName] = useState(false);
  const [nameVal, setNameVal] = useState(user.name);
  const [showCardModal, setShowCardModal] = useState(false);
  const [editingCard, setEditingCard] = useState<CC | null>(null);

  const faixas = user.statusThresholds;

  return (
    <div className="flex flex-col pb-10" style={{ background: 'var(--fx-background)' }}>

      {/* ── Identity ─── */}
      <div className="mx-4 mt-4 rounded-3xl p-5"
        style={{ background: 'var(--fx-surface-container-low)' }}>
        <div className="flex items-center gap-4">
          <AvatarSvg kind={user.avatar} size={72} />
          <div className="flex-1 min-w-0">
            {editName ? (
              <input
                value={nameVal}
                autoFocus
                onChange={e => setNameVal(e.target.value)}
                onBlur={() => { updateUser({ name: nameVal }); setEditName(false); }}
                onKeyDown={e => { if (e.key === 'Enter') { updateUser({ name: nameVal }); setEditName(false); } }}
                className="text-xl font-medium outline-none rounded-lg px-2 py-0.5 w-full"
                style={{ background: 'var(--fx-surface-container)', color: 'var(--fx-on-surface)' }}
              />
            ) : (
              <button
                onClick={() => setEditName(true)}
                className="flex items-center gap-2 text-left group"
              >
                <span className="text-xl font-medium" style={{ color: 'var(--fx-on-surface)' }}>{user.name}</span>
                <Icon name="edit" size={16} style={{ color: 'var(--fx-on-surface-variant)' }} />
              </button>
            )}
            <div className="text-sm mt-0.5" style={{ color: 'var(--fx-on-surface-variant)' }}>
              {user.email}
            </div>
            <div className="mt-1.5">
              <span
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold"
                style={{ background: 'var(--fx-primary-container)', color: 'var(--fx-on-primary-container)' }}
              >
                <Icon name="bolt" size={13} fill={1} /> Anual · ativo
              </span>
            </div>
          </div>
        </div>

        {/* Avatar picker */}
        <div className="mt-4">
          <div className="text-[11px] font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--fx-on-surface-variant)' }}>
            Escolha seu avatar
          </div>
          <div className="flex gap-3">
            {AVATARS.map(av => (
              <button
                key={av}
                onClick={() => updateUser({ avatar: av })}
                className="relative flex flex-col items-center gap-1"
              >
                <div
                  className="rounded-full transition-all"
                  style={{
                    padding: user.avatar === av ? 2 : 0,
                    background: user.avatar === av ? 'var(--fx-primary)' : 'transparent',
                  }}
                >
                  <AvatarSvg kind={av} size={48} />
                </div>
                <span className="text-[10px] capitalize" style={{ color: 'var(--fx-on-surface-variant)' }}>{av}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Configurações ─── */}
      <PrefSection label="Configurações">
        <PrefRow
          icon="palette"
          title="Modo escuro"
          subtitle="Mude entre tema claro e escuro"
          trailing={<Switch value={isDark} onChange={toggle} />}
        />
      </PrefSection>

      {/* ── Final do mês ─── */}
      <PrefSection label="Final do mês">
        <div
          className="px-4 py-3 flex items-center gap-3 cursor-pointer"
          onClick={() => updateUser({ balanceCarryover: 'auto' })}
        >
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'var(--fx-surface-container-high)', color: 'var(--fx-on-surface-variant)' }}>
            <Icon name="forward" size={20} />
          </div>
          <div className="flex-1">
            <div className="text-sm font-medium" style={{ color: 'var(--fx-on-surface)' }}>Transportar saldo</div>
            <div className="text-xs mt-0.5" style={{ color: 'var(--fx-on-surface-variant)' }}>O saldo restante soma ao próximo mês</div>
          </div>
          <Radio selected={user.balanceCarryover === 'auto'} />
        </div>
        <div
          className="px-4 py-3 flex items-center gap-3 cursor-pointer"
          style={{ borderTop: '1px solid var(--fx-surface-container)' }}
          onClick={() => updateUser({ balanceCarryover: 'manual' })}
        >
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'var(--fx-surface-container-high)', color: 'var(--fx-on-surface-variant)' }}>
            <Icon name="savings" size={20} />
          </div>
          <div className="flex-1">
            <div className="text-sm font-medium" style={{ color: 'var(--fx-on-surface)' }}>Enviar para Economias</div>
            <div className="text-xs mt-0.5" style={{ color: 'var(--fx-on-surface-variant)' }}>O app pergunta quanto destinar; o restante zera</div>
          </div>
          <Radio selected={user.balanceCarryover === 'manual'} />
        </div>
      </PrefSection>

      {/* ── Status do mês ─── */}
      <PrefSection label="Status do mês">
        <PrefRow
          icon="tune"
          title="Faixas de cor"
          subtitle={`Azul >${faixas.maravilhoso}% · Verde >${faixas.bom}% · Amarelo >${faixas.atencao}%`}
        >
          <FaixaRow color="blue"   label="Maravilhoso" rule={`> ${faixas.maravilhoso}% da renda`} />
          <FaixaRow color="green"  label="Bom"         rule={`${faixas.bom + 1}% a ${faixas.maravilhoso}%`} />
          <FaixaRow color="yellow" label="Atenção"     rule={`${faixas.atencao + 1}% a ${faixas.bom}%`} />
          <FaixaRow color="red"    label="Alerta"      rule={`≤ ${faixas.atencao}%`} />
        </PrefRow>
      </PrefSection>

      {/* ── Cartões de crédito ─── */}
      <PrefSection label="Cartões de crédito">
        {creditCards.map(card => (
          <div key={card.id} style={{ borderTop: `1px solid var(--fx-surface-container)` }}
            className="first:border-t-0">
            <PrefRow
              icon="credit_card"
              title={card.name}
              subtitle={`Fecha dia ${card.closingDay} · Vence dia ${card.dueDay}`}
              trailing={
                <div className="flex gap-1">
                  <button onClick={() => setEditingCard(card)} className="p-1.5 rounded-lg">
                    <Icon name="edit" size={16} style={{ color: 'var(--fx-on-surface-variant)' }} />
                  </button>
                  <button onClick={() => deleteCreditCard(card.id)} className="p-1.5 rounded-lg">
                    <Icon name="delete" size={16} style={{ color: 'var(--fx-red)' }} />
                  </button>
                </div>
              }
            />
          </div>
        ))}
        <div
          style={{ borderTop: creditCards.length > 0 ? '1px solid var(--fx-surface-container)' : undefined, cursor: 'pointer' }}
          onClick={() => setShowCardModal(true)}
        >
          <PrefRow
            icon="add"
            title="Adicionar cartão"
            subtitle="Cadastre fechamento e vencimento"
            trailing={<Icon name="chevron_right" size={20} style={{ color: 'var(--fx-on-surface-variant)' }} />}
          />
        </div>
      </PrefSection>

      {/* ── Economias ─── */}
      <PrefSection label="Economias">
        <PrefRow
          icon="schedule"
          title="Lembrete mensal"
          subtitle={`Notificar todo dia ${user.savingsReminderDay} para atualizar saldos`}
          trailing={
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => { e.stopPropagation(); updateUser({ savingsReminderDay: Math.max(1, user.savingsReminderDay - 1) }); }}
                className="w-7 h-7 rounded-full flex items-center justify-center"
                style={{ background: 'var(--fx-surface-container-high)', color: 'var(--fx-on-surface)' }}
              >
                <Icon name="remove" size={14} />
              </button>
              <span className="w-5 text-center text-sm font-semibold" style={{ color: 'var(--fx-on-surface)' }}>
                {user.savingsReminderDay}
              </span>
              <button
                onClick={(e) => { e.stopPropagation(); updateUser({ savingsReminderDay: Math.min(28, user.savingsReminderDay + 1) }); }}
                className="w-7 h-7 rounded-full flex items-center justify-center"
                style={{ background: 'var(--fx-surface-container-high)', color: 'var(--fx-on-surface)' }}
              >
                <Icon name="add" size={14} />
              </button>
            </div>
          }
        />
      </PrefSection>

      {/* ── Conta ─── */}
      <PrefSection label="Conta">
        <PrefRow
          icon="notifications"
          title="Alertas in-app"
          subtitle="Notificações de status, vencimento e lembretes"
          trailing={<Icon name="chevron_right" size={20} style={{ color: 'var(--fx-on-surface-variant)' }} />}
        />
        <div style={{ borderTop: '1px solid var(--fx-surface-container)' }}>
          <PrefRow
            icon="workspace_premium"
            title="Assinatura"
            subtitle="Plano anual · renova em 12/2026"
            trailing={<Icon name="chevron_right" size={20} style={{ color: 'var(--fx-on-surface-variant)' }} />}
          />
        </div>
        <div style={{ borderTop: '1px solid var(--fx-surface-container)' }}>
          <PrefRow
            icon="logout"
            title="Sair da conta"
            danger
            trailing={
              <button
                onClick={async () => { await signOut(); navigate('/'); }}
                className="text-sm font-medium"
                style={{ color: 'var(--fx-red)' }}
              >
                Sair
              </button>
            }
          />
        </div>
      </PrefSection>

      <div className="px-5 py-5 text-center text-[11px]" style={{ color: 'var(--fx-on-surface-variant)' }}>
        Fluxo · v0.9 · LGPD compliant
      </div>

      {/* ── Modals ─── */}
      <Modal open={showCardModal} onClose={() => setShowCardModal(false)} title="Novo Cartão">
        <CardForm
          onSubmit={data => { addCreditCard(data); setShowCardModal(false); }}
          onCancel={() => setShowCardModal(false)}
        />
      </Modal>
      <Modal open={!!editingCard} onClose={() => setEditingCard(null)} title="Editar Cartão">
        {editingCard && (
          <CardForm
            initial={editingCard}
            onSubmit={data => { updateCreditCard(editingCard.id, data); setEditingCard(null); }}
            onCancel={() => setEditingCard(null)}
          />
        )}
      </Modal>
    </div>
  );
}
