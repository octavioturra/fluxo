import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, CreditCard, Bell, Palette, ArrowLeftRight, LogOut, Plus, Pencil, Trash2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { AVATAR_EMOJI } from '../types';
import { Modal } from '../components/ui/Modal';
import type { CreditCard as CC } from '../types';

const AVATARS = ['raposa', 'coruja', 'urso', 'gato', 'cachorro'] as const;

function CardForm({ initial, onSubmit, onCancel }: {
  initial?: Partial<CC>;
  onSubmit: (data: Omit<CC, 'id' | 'userId'>) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [closingDay, setClosingDay] = useState(initial?.closingDay?.toString() ?? '15');
  const [dueDay, setDueDay] = useState(initial?.dueDay?.toString() ?? '10');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    onSubmit({ name, closingDay: parseInt(closingDay), dueDay: parseInt(dueDay) });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase">Nome do cartão</label>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Nubank, Itaú Visa..."
          className="w-full py-2.5 px-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase">Dia fechamento</label>
          <input type="number" min="1" max="31" value={closingDay} onChange={e => setClosingDay(e.target.value)}
            className="w-full py-2.5 px-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase">Dia vencimento</label>
          <input type="number" min="1" max="31" value={dueDay} onChange={e => setDueDay(e.target.value)}
            className="w-full py-2.5 px-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
        </div>
      </div>
      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onCancel} className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-medium text-sm">Cancelar</button>
        <button type="submit" className="flex-1 py-3 rounded-xl bg-emerald-600 text-white font-semibold text-sm">Salvar</button>
      </div>
    </form>
  );
}

export function PerfilPage() {
  const { user, creditCards, updateUser, addCreditCard, updateCreditCard, deleteCreditCard } = useApp();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [editName, setEditName] = useState(false);
  const [nameVal, setNameVal] = useState(user.name);
  const [showCardModal, setShowCardModal] = useState(false);
  const [editingCard, setEditingCard] = useState<CC | null>(null);

  return (
    <div className="p-4 space-y-5">
      {/* Profile header */}
      <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-2xl p-5 text-white">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-3xl">
            {AVATAR_EMOJI[user.avatar]}
          </div>
          <div className="flex-1">
            {editName ? (
              <div className="flex gap-2">
                <input value={nameVal} onChange={e => setNameVal(e.target.value)}
                  className="bg-white/20 text-white placeholder-white/60 rounded-lg px-3 py-1.5 text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-white/50"
                  autoFocus onKeyDown={e => { if (e.key === 'Enter') { updateUser({ name: nameVal }); setEditName(false); } }} />
                <button onClick={() => { updateUser({ name: nameVal }); setEditName(false); }}
                  className="bg-white text-emerald-600 px-3 py-1.5 rounded-lg text-sm font-semibold">OK</button>
              </div>
            ) : (
              <button onClick={() => setEditName(true)} className="text-left">
                <p className="text-xl font-bold">{user.name}</p>
                <p className="text-emerald-200 text-sm">{user.email}</p>
              </button>
            )}
          </div>
        </div>

        {/* Avatar picker */}
        <div className="mt-4">
          <p className="text-emerald-200 text-xs mb-2">Escolha seu avatar</p>
          <div className="flex gap-3">
            {AVATARS.map(av => (
              <button key={av} onClick={() => updateUser({ avatar: av })}
                className={`w-11 h-11 rounded-full flex items-center justify-center text-xl transition-all ${user.avatar === av ? 'bg-white shadow-lg scale-110' : 'bg-white/20 hover:bg-white/30'}`}>
                {AVATAR_EMOJI[av]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Settings sections */}
      <SettingsSection title="Aparência">
        <SettingsRow
          icon={<Palette size={18} />}
          label="Modo escuro"
          right={
            <button onClick={() => updateUser({ darkMode: !user.darkMode })}
              className={`w-12 h-6 rounded-full transition-colors ${user.darkMode ? 'bg-emerald-500' : 'bg-slate-200'}`}>
              <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform mx-0.5 ${user.darkMode ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
          }
        />
      </SettingsSection>

      <SettingsSection title="Orçamento">
        <SettingsRow
          icon={<ArrowLeftRight size={18} />}
          label="Saldo entre meses"
          sublabel={user.balanceCarryover === 'auto' ? 'Transportar automaticamente' : 'Enviar para Economias'}
          right={
            <button onClick={() => updateUser({ balanceCarryover: user.balanceCarryover === 'auto' ? 'manual' : 'auto' })}
              className="text-xs text-emerald-600 font-medium">
              Alterar
            </button>
          }
        />
        <SettingsRow
          icon={<Bell size={18} />}
          label="Lembrete de Economias"
          sublabel={`Todo dia ${user.savingsReminderDay} do mês`}
          right={<ChevronRight size={16} className="text-slate-300" />}
        />
      </SettingsSection>

      <SettingsSection title="Cartões de crédito">
        <div className="divide-y divide-slate-50 dark:divide-slate-700/50">
          {creditCards.map(card => (
            <div key={card.id} className="flex items-center gap-3 px-4 py-3">
              <CreditCard size={18} className="text-slate-400" />
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{card.name}</p>
                <p className="text-xs text-slate-400">Fecha dia {card.closingDay} · Vence dia {card.dueDay}</p>
              </div>
              <button onClick={() => setEditingCard(card)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">
                <Pencil size={13} className="text-slate-400" />
              </button>
              <button onClick={() => deleteCreditCard(card.id)} className="p-1.5 hover:bg-red-50 rounded-lg">
                <Trash2 size={13} className="text-red-400" />
              </button>
            </div>
          ))}
          <button onClick={() => setShowCardModal(true)}
            className="flex items-center gap-2 px-4 py-3 text-emerald-600 text-sm font-medium w-full hover:bg-emerald-50 dark:hover:bg-emerald-900/20">
            <Plus size={16} /> Adicionar cartão
          </button>
        </div>
      </SettingsSection>

      <SettingsSection title="Conta">
        <button
          onClick={async () => { await signOut(); navigate('/'); }}
          className="flex items-center gap-3 px-4 py-3.5 w-full hover:bg-red-50 transition-colors"
        >
          <LogOut size={18} className="text-red-400" />
          <span className="text-sm font-medium text-red-500">Sair da conta</span>
        </button>
      </SettingsSection>

      <Modal open={showCardModal} onClose={() => setShowCardModal(false)} title="Novo Cartão">
        <CardForm onSubmit={data => { addCreditCard(data); setShowCardModal(false); }} onCancel={() => setShowCardModal(false)} />
      </Modal>
      <Modal open={!!editingCard} onClose={() => setEditingCard(null)} title="Editar Cartão">
        {editingCard && (
          <CardForm initial={editingCard}
            onSubmit={data => { updateCreditCard(editingCard.id, data); setEditingCard(null); }}
            onCancel={() => setEditingCard(null)} />
        )}
      </Modal>
    </div>
  );
}

function SettingsSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2 px-1">{title}</p>
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden">
        {children}
      </div>
    </div>
  );
}

function SettingsRow({ icon, label, sublabel, right, labelClass }: {
  icon: React.ReactNode; label: string; sublabel?: string; right?: React.ReactNode; labelClass?: string;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-50 dark:border-slate-700/50 last:border-0">
      <span className="text-slate-400">{icon}</span>
      <div className="flex-1">
        <p className={`text-sm font-medium ${labelClass ?? 'text-slate-700 dark:text-slate-200'}`}>{label}</p>
        {sublabel && <p className="text-xs text-slate-400 mt-0.5">{sublabel}</p>}
      </div>
      {right}
    </div>
  );
}
