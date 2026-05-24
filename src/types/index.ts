export type PaymentMethod = 'dinheiro' | 'pix' | 'debito' | 'credito';

export type EntryType = 'clt' | 'pj' | 'passiva' | 'freela' | 'outros' | 'aposentado' | 'variavel' | 'outro';

export type MonthStatus = 'maravilhoso' | 'bom' | 'atencao' | 'alerta';

export type FixedExpenseHealth = 'recomendado' | 'excelente' | 'alerta' | 'critico';

export type SavingsCategory =
  | 'acoes'
  | 'fundos'
  | 'fiis'
  | 'cripto'
  | 'reserva'
  | 'cdb100'
  | 'cdb120'
  | string;

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: 'raposa' | 'coruja' | 'urso' | 'gato' | 'cachorro';
  darkMode: boolean;
  balanceCarryover: 'auto' | 'manual';
  savingsReminderDay: number;
  statusThresholds: {
    maravilhoso: number;
    bom: number;
    atencao: number;
  };
  fixedHealthThresholds: {
    recomendado: number;
    excelente: number;
    alerta: number;
  };
}

export interface Income {
  id: string;
  userId: string;
  source: string;
  type: EntryType;
  amount: number;
  day: number;
  month: number;
  year: number;
  isEstimated?: boolean;
}

export interface FixedExpense {
  id: string;
  userId: string;
  name: string;
  category: string;
  amount: number;
  dueDay: number;
  active: boolean;
}

export interface DailyExpense {
  id: string;
  userId: string;
  description: string;
  category: string;
  amount: number;
  paymentMethod: PaymentMethod;
  creditCardId?: string;
  installments?: number;
  installmentAmount?: number;
  date: string;
  month: number;
  year: number;
}

export interface CreditCard {
  id: string;
  userId: string;
  name: string;
  closingDay: number;
  dueDay: number;
  limit?: number;
}

export interface CreditBill {
  id: string;
  cardId: string;
  month: number;
  year: number;
  dueMonth: number;
  dueYear: number;
  total: number;
  paid: boolean;
  items: DailyExpense[];
}

export interface SavingEntry {
  id: string;
  userId: string;
  category: SavingsCategory;
  categoryLabel: string;
  amount: number;
  month: number;
  year: number;
}

export interface MonthSummary {
  month: number;
  year: number;
  totalIncome: number;
  totalFixed: number;
  totalDaily: number;
  totalExpenses: number;
  currentBalance: number;
  dailyBudget: number;
  daysLeft: number;
  status: MonthStatus;
  projectedBalance: number;
  projectedPercent: number;
}

export const EXPENSE_CATEGORIES = [
  { id: 'alimentacao',     label: 'Alimentação',      emoji: '🍽️', icon: 'restaurant' },
  { id: 'transporte',      label: 'Transporte',        emoji: '🚗',  icon: 'directions_car' },
  { id: 'lazer',           label: 'Lazer',             emoji: '🎉',  icon: 'celebration' },
  { id: 'compras_produtos',label: 'Compras Produtos',  emoji: '🛍️', icon: 'shopping_bag' },
  { id: 'compras_servicos',label: 'Compras Serviços',  emoji: '🛎️', icon: 'room_service' },
  { id: 'estudo',          label: 'Estudo',            emoji: '📚',  icon: 'school' },
  { id: 'moradia',         label: 'Moradia',           emoji: '🏠',  icon: 'home' },
  { id: 'pets',            label: 'Pets',              emoji: '🐾',  icon: 'pets' },
  { id: 'saude',           label: 'Saúde',             emoji: '🏥',  icon: 'favorite' },
  { id: 'dividas',         label: 'Dívidas',           emoji: '💳',  icon: 'credit_card' },
  { id: 'outros',          label: 'Outros',            emoji: '📦',  icon: 'category' },
];

export const FIXED_CATEGORIES = [
  { id: 'moradia', label: 'Moradia', emoji: '🏠' },
  { id: 'utilidades', label: 'Utilidades', emoji: '💡' },
  { id: 'comunicacao', label: 'Comunicação', emoji: '📱' },
  { id: 'transporte', label: 'Transporte', emoji: '🚗' },
  { id: 'dividas', label: 'Dívidas e Empréstimos', emoji: '💳' },
  { id: 'saude', label: 'Saúde', emoji: '🏥' },
  { id: 'educacao', label: 'Educação', emoji: '📚' },
  { id: 'familia', label: 'Família e Filhos', emoji: '👶' },
  { id: 'pets', label: 'Pets', emoji: '🐾' },
  { id: 'trabalho', label: 'Trabalho', emoji: '💼' },
  { id: 'doacoes', label: 'Doações', emoji: '🙏' },
  { id: 'outros', label: 'Outros Fixos', emoji: '➕' },
];

export const SAVINGS_CATEGORIES = [
  { id: 'acoes', label: 'Ações', emoji: '📈' },
  { id: 'fundos', label: 'Fundos de Investimento', emoji: '💼' },
  { id: 'fiis', label: 'FIIs', emoji: '🏢' },
  { id: 'cripto', label: 'Criptomoedas', emoji: '₿' },
  { id: 'reserva', label: 'Reserva de Emergência', emoji: '🛡️' },
  { id: 'cdb100', label: 'CDB 100%', emoji: '🏦' },
  { id: 'cdb120', label: 'CDB 120%', emoji: '🏦' },
];

export const AVATAR_EMOJI: Record<string, string> = {
  raposa: '🦊',
  coruja: '🦉',
  urso: '🐻',
  gato: '🐱',
  cachorro: '🐶',
};
