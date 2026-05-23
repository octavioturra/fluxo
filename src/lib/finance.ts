import { getDaysInMonth } from 'date-fns';
import type {
  Income,
  FixedExpense,
  DailyExpense,
  MonthStatus,
  MonthSummary,
  FixedExpenseHealth,
  User,
} from '../types';

export function getDaysLeft(year: number, month: number): number {
  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() + 1 === month;
  if (!isCurrentMonth) {
    const lastDay = getDaysInMonth(new Date(year, month - 1));
    return lastDay;
  }
  const lastDay = getDaysInMonth(new Date(year, month - 1));
  return lastDay - today.getDate() + 1;
}

export function getDailyBudget(
  totalIncome: number,
  totalFixed: number,
  totalDailySpent: number,
  year: number,
  month: number
): number {
  const balance = totalIncome - totalFixed - totalDailySpent;
  const daysLeft = getDaysLeft(year, month);
  if (daysLeft <= 0) return 0;
  return balance / daysLeft;
}

export function getMonthStatus(
  projectedPercent: number,
  thresholds = { maravilhoso: 20, bom: 11, atencao: 1 }
): MonthStatus {
  if (projectedPercent > thresholds.maravilhoso) return 'maravilhoso';
  if (projectedPercent > thresholds.bom) return 'bom';
  if (projectedPercent > thresholds.atencao) return 'atencao';
  return 'alerta';
}

export function getStatusColor(status: MonthStatus): string {
  switch (status) {
    case 'maravilhoso': return 'blue';
    case 'bom': return 'green';
    case 'atencao': return 'yellow';
    case 'alerta': return 'red';
  }
}

export function getStatusLabel(status: MonthStatus): string {
  switch (status) {
    case 'maravilhoso': return 'Maravilhoso';
    case 'bom': return 'Bom';
    case 'atencao': return 'Atenção';
    case 'alerta': return 'Alerta';
  }
}

export function getStatusMessage(status: MonthStatus, projectedBalance: number): string {
  const fmt = formatCurrency(projectedBalance);
  switch (status) {
    case 'maravilhoso': return `Você está ótimo! Saldo projetado no fim do mês: ${fmt}`;
    case 'bom': return `Situação confortável. Saldo projetado: ${fmt}`;
    case 'atencao': return `⚠️ Atenção — saldo projetado no fim do mês: ${fmt}`;
    case 'alerta': return `🔴 Alerta! O mês pode fechar no vermelho: ${fmt}`;
  }
}

export function getFixedHealth(percent: number, thresholds = { recomendado: 20, excelente: 30, alerta: 50 }): FixedExpenseHealth {
  if (percent <= thresholds.recomendado) return 'recomendado';
  if (percent <= thresholds.excelente) return 'excelente';
  if (percent <= thresholds.alerta) return 'alerta';
  return 'critico';
}

export function getFixedHealthLabel(health: FixedExpenseHealth): string {
  switch (health) {
    case 'recomendado': return 'Recomendado';
    case 'excelente': return 'Excelente';
    case 'alerta': return 'Alerta';
    case 'critico': return 'Crítico';
  }
}

export function getFixedHealthColor(health: FixedExpenseHealth): string {
  switch (health) {
    case 'recomendado': return 'green';
    case 'excelente': return 'blue';
    case 'alerta': return 'yellow';
    case 'critico': return 'red';
  }
}

export function computeMonthSummary(
  incomes: Income[],
  fixedExpenses: FixedExpense[],
  dailyExpenses: DailyExpense[],
  year: number,
  month: number,
  user: User
): MonthSummary {
  const totalIncome = incomes
    .filter(i => i.month === month && i.year === year)
    .reduce((s, i) => s + i.amount, 0);

  const totalFixed = fixedExpenses
    .filter(f => f.active)
    .reduce((s, f) => s + f.amount, 0);

  const totalDaily = dailyExpenses
    .filter(d => d.month === month && d.year === year && d.paymentMethod !== 'credito')
    .reduce((s, d) => s + d.amount, 0);

  const totalExpenses = totalFixed + totalDaily;
  const currentBalance = totalIncome - totalExpenses;

  const daysLeft = getDaysLeft(year, month);
  const dailyBudget = daysLeft > 0 ? currentBalance / daysLeft : 0;

  const actualProjectedPercent = totalIncome > 0 ? (currentBalance / totalIncome) * 100 : 0;

  const status = getMonthStatus(actualProjectedPercent, user.statusThresholds);

  return {
    month,
    year,
    totalIncome,
    totalFixed,
    totalDaily,
    totalExpenses,
    currentBalance,
    dailyBudget,
    daysLeft,
    status,
    projectedBalance: currentBalance,
    projectedPercent: actualProjectedPercent,
  };
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

export interface DayProjection {
  day: number;
  date: string;
  realSpent: number;
  planned: number;
  balance: number;
  isPast: boolean;
  isToday: boolean;
  isFuture: boolean;
  status: 'ok' | 'over' | 'future';
}

export function buildCalendarProjection(
  incomes: Income[],
  fixedExpenses: FixedExpense[],
  dailyExpenses: DailyExpense[],
  year: number,
  month: number,
  dailyBudget: number
): DayProjection[] {
  const today = new Date();
  const daysInMonth = getDaysInMonth(new Date(year, month - 1));
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() + 1 === month;
  const todayDay = today.getDate();

  const totalIncome = incomes
    .filter(i => i.month === month && i.year === year)
    .reduce((s, i) => s + i.amount, 0);
  const totalFixed = fixedExpenses.filter(f => f.active).reduce((s, f) => s + f.amount, 0);

  const days: DayProjection[] = [];
  let runningBalance = totalIncome - totalFixed;

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const isPast = isCurrentMonth ? d < todayDay : true;
    const isToday = isCurrentMonth && d === todayDay;
    const isFuture = isCurrentMonth ? d > todayDay : false;

    const dayExpenses = dailyExpenses.filter(e => e.date === dateStr && e.paymentMethod !== 'credito');
    const realSpent = dayExpenses.reduce((s, e) => s + e.amount, 0);

    if (isPast || isToday) {
      runningBalance -= realSpent;
    } else {
      runningBalance -= dailyBudget;
    }

    days.push({
      day: d,
      date: dateStr,
      realSpent: isPast || isToday ? realSpent : 0,
      planned: dailyBudget,
      balance: runningBalance,
      isPast,
      isToday,
      isFuture,
      status: isFuture ? 'future' : realSpent <= dailyBudget ? 'ok' : 'over',
    });
  }

  return days;
}
