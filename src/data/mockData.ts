import type { User, Income, FixedExpense, DailyExpense, CreditCard, SavingEntry } from '../types';

export const mockUser: User = {
  id: 'u1',
  name: 'Letícia',
  email: 'leticia@email.com',
  avatar: 'raposa',
  darkMode: false,
  balanceCarryover: 'auto',
  savingsReminderDay: 1,
  statusThresholds: { maravilhoso: 20, bom: 11, atencao: 1 },
  fixedHealthThresholds: { recomendado: 20, excelente: 30, alerta: 50 },
};

export const mockIncomes: Income[] = [
  { id: 'i1', userId: 'u1', source: 'Salário CLT', type: 'clt', amount: 8000, day: 5, month: 5, year: 2026 },
  { id: 'i2', userId: 'u1', source: 'Freela Design', type: 'outro', amount: 1200, day: 15, month: 5, year: 2026 },
  { id: 'i3', userId: 'u1', source: 'Salário CLT', type: 'clt', amount: 8000, day: 5, month: 4, year: 2026 },
  { id: 'i4', userId: 'u1', source: 'Salário CLT', type: 'clt', amount: 8000, day: 5, month: 3, year: 2026 },
];

export const mockFixedExpenses: FixedExpense[] = [
  { id: 'f1', userId: 'u1', name: 'Aluguel', category: 'moradia', amount: 1800, dueDay: 5, active: true },
  { id: 'f2', userId: 'u1', name: 'Condomínio', category: 'moradia', amount: 350, dueDay: 10, active: true },
  { id: 'f3', userId: 'u1', name: 'Internet', category: 'utilidades', amount: 120, dueDay: 15, active: true },
  { id: 'f4', userId: 'u1', name: 'Energia', category: 'utilidades', amount: 180, dueDay: 20, active: true },
  { id: 'f5', userId: 'u1', name: 'Plano de celular', category: 'comunicacao', amount: 60, dueDay: 10, active: true },
  { id: 'f6', userId: 'u1', name: 'Netflix', category: 'comunicacao', amount: 45, dueDay: 18, active: true },
  { id: 'f7', userId: 'u1', name: 'Spotify', category: 'comunicacao', amount: 22, dueDay: 18, active: true },
  { id: 'f8', userId: 'u1', name: 'Academia', category: 'saude', amount: 130, dueDay: 1, active: true },
  { id: 'f9', userId: 'u1', name: 'Plano de saúde', category: 'saude', amount: 280, dueDay: 10, active: true },
  { id: 'f10', userId: 'u1', name: 'Seguro do carro', category: 'transporte', amount: 215, dueDay: 25, active: true },
];

export const mockDailyExpenses: DailyExpense[] = [
  { id: 'd1', userId: 'u1', description: 'Almoço', category: 'alimentacao', amount: 35, paymentMethod: 'pix', date: '2026-05-01', month: 5, year: 2026 },
  { id: 'd2', userId: 'u1', description: 'Uber', category: 'transporte', amount: 22, paymentMethod: 'credito', creditCardId: 'cc1', date: '2026-05-01', month: 5, year: 2026 },
  { id: 'd3', userId: 'u1', description: 'Mercado', category: 'alimentacao', amount: 280, paymentMethod: 'debito', date: '2026-05-02', month: 5, year: 2026 },
  { id: 'd4', userId: 'u1', description: 'Farmácia', category: 'saude', amount: 45, paymentMethod: 'pix', date: '2026-05-03', month: 5, year: 2026 },
  { id: 'd5', userId: 'u1', description: 'Cinema', category: 'lazer', amount: 52, paymentMethod: 'credito', creditCardId: 'cc1', date: '2026-05-04', month: 5, year: 2026 },
  { id: 'd6', userId: 'u1', description: 'Gasolina', category: 'transporte', amount: 180, paymentMethod: 'debito', date: '2026-05-05', month: 5, year: 2026 },
  { id: 'd7', userId: 'u1', description: 'Almoço trabalho', category: 'alimentacao', amount: 38, paymentMethod: 'pix', date: '2026-05-06', month: 5, year: 2026 },
  { id: 'd8', userId: 'u1', description: 'Bar com amigos', category: 'lazer', amount: 95, paymentMethod: 'credito', creditCardId: 'cc1', date: '2026-05-07', month: 5, year: 2026 },
  { id: 'd9', userId: 'u1', description: 'Padaria', category: 'alimentacao', amount: 28, paymentMethod: 'dinheiro', date: '2026-05-08', month: 5, year: 2026 },
  { id: 'd10', userId: 'u1', description: 'Curso Figma', category: 'estudo', amount: 129, paymentMethod: 'credito', creditCardId: 'cc1', installments: 3, installmentAmount: 43, date: '2026-05-09', month: 5, year: 2026 },
  { id: 'd11', userId: 'u1', description: 'Restaurante', category: 'alimentacao', amount: 88, paymentMethod: 'debito', date: '2026-05-10', month: 5, year: 2026 },
  { id: 'd12', userId: 'u1', description: 'Mercado', category: 'alimentacao', amount: 195, paymentMethod: 'debito', date: '2026-05-12', month: 5, year: 2026 },
  { id: 'd13', userId: 'u1', description: 'Roupa', category: 'compras_produtos', amount: 320, paymentMethod: 'credito', creditCardId: 'cc1', installments: 2, installmentAmount: 160, date: '2026-05-14', month: 5, year: 2026 },
  { id: 'd14', userId: 'u1', description: 'Lanche', category: 'alimentacao', amount: 32, paymentMethod: 'pix', date: '2026-05-15', month: 5, year: 2026 },
  { id: 'd15', userId: 'u1', description: 'Transporte público', category: 'transporte', amount: 18, paymentMethod: 'debito', date: '2026-05-16', month: 5, year: 2026 },
  { id: 'd16', userId: 'u1', description: 'Delivery', category: 'alimentacao', amount: 67, paymentMethod: 'credito', creditCardId: 'cc1', date: '2026-05-17', month: 5, year: 2026 },
  { id: 'd17', userId: 'u1', description: 'Livros', category: 'estudo', amount: 85, paymentMethod: 'pix', date: '2026-05-18', month: 5, year: 2026 },
  { id: 'd18', userId: 'u1', description: 'Mercado', category: 'alimentacao', amount: 240, paymentMethod: 'debito', date: '2026-05-20', month: 5, year: 2026 },
  { id: 'd19', userId: 'u1', description: 'Happy hour', category: 'lazer', amount: 78, paymentMethod: 'pix', date: '2026-05-21', month: 5, year: 2026 },
  { id: 'd20', userId: 'u1', description: 'Almoço', category: 'alimentacao', amount: 42, paymentMethod: 'pix', date: '2026-05-22', month: 5, year: 2026 },
];

export const mockCreditCards: CreditCard[] = [
  { id: 'cc1', userId: 'u1', name: 'Nubank', closingDay: 15, dueDay: 10 },
  { id: 'cc2', userId: 'u1', name: 'Itaú Visa', closingDay: 20, dueDay: 15 },
];

export const mockSavings: SavingEntry[] = [
  { id: 's1', userId: 'u1', category: 'reserva', categoryLabel: 'Reserva de Emergência', amount: 15000, month: 1, year: 2026 },
  { id: 's2', userId: 'u1', category: 'acoes', categoryLabel: 'Ações', amount: 32000, month: 1, year: 2026 },
  { id: 's3', userId: 'u1', category: 'cdb100', categoryLabel: 'CDB 100%', amount: 8000, month: 1, year: 2026 },
  { id: 's4', userId: 'u1', category: 'reserva', categoryLabel: 'Reserva de Emergência', amount: 16500, month: 2, year: 2026 },
  { id: 's5', userId: 'u1', category: 'acoes', categoryLabel: 'Ações', amount: 35000, month: 2, year: 2026 },
  { id: 's6', userId: 'u1', category: 'cdb100', categoryLabel: 'CDB 100%', amount: 8500, month: 2, year: 2026 },
  { id: 's7', userId: 'u1', category: 'reserva', categoryLabel: 'Reserva de Emergência', amount: 17800, month: 3, year: 2026 },
  { id: 's8', userId: 'u1', category: 'acoes', categoryLabel: 'Ações', amount: 31000, month: 3, year: 2026 },
  { id: 's9', userId: 'u1', category: 'cdb100', categoryLabel: 'CDB 100%', amount: 9200, month: 3, year: 2026 },
  { id: 's10', userId: 'u1', category: 'reserva', categoryLabel: 'Reserva de Emergência', amount: 19200, month: 4, year: 2026 },
  { id: 's11', userId: 'u1', category: 'acoes', categoryLabel: 'Ações', amount: 38500, month: 4, year: 2026 },
  { id: 's12', userId: 'u1', category: 'cdb100', categoryLabel: 'CDB 100%', amount: 9800, month: 4, year: 2026 },
  { id: 's13', userId: 'u1', category: 'cripto', categoryLabel: 'Criptomoedas', amount: 4500, month: 4, year: 2026 },
];
