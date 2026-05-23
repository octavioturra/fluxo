import { supabase } from './supabase';
import type { User, Income, FixedExpense, DailyExpense, CreditCard, SavingEntry } from '../types';

// ─── Profile ────────────────────────────────────────────────────────────────

export interface ProfileData {
  user: User;
  isOnboarded: boolean;
}

export async function fetchProfile(
  authId: string,
  authEmail: string,
  authName: string,
): Promise<ProfileData | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', authId)
    .single();

  if (error || !data) return null;

  return {
    isOnboarded: data.is_onboarded as boolean,
    user: {
      id: data.id as string,
      name: (data.name as string) || authName,
      email: authEmail,
      avatar: data.avatar as User['avatar'],
      darkMode: data.dark_mode as boolean,
      balanceCarryover: data.balance_carryover as User['balanceCarryover'],
      savingsReminderDay: data.savings_reminder_day as number,
      statusThresholds: {
        maravilhoso: data.status_threshold_maravilhoso as number,
        bom: data.status_threshold_bom as number,
        atencao: data.status_threshold_atencao as number,
      },
      fixedHealthThresholds: {
        recomendado: data.fixed_health_recomendado as number,
        excelente: data.fixed_health_excelente as number,
        alerta: data.fixed_health_alerta as number,
      },
    },
  };
}

export async function updateProfile(userId: string, patch: Partial<User>): Promise<void> {
  const row: Record<string, unknown> = {};
  if (patch.name !== undefined) row.name = patch.name;
  if (patch.avatar !== undefined) row.avatar = patch.avatar;
  if (patch.darkMode !== undefined) row.dark_mode = patch.darkMode;
  if (patch.balanceCarryover !== undefined) row.balance_carryover = patch.balanceCarryover;
  if (patch.savingsReminderDay !== undefined) row.savings_reminder_day = patch.savingsReminderDay;
  if (patch.statusThresholds) {
    row.status_threshold_maravilhoso = patch.statusThresholds.maravilhoso;
    row.status_threshold_bom = patch.statusThresholds.bom;
    row.status_threshold_atencao = patch.statusThresholds.atencao;
  }
  if (patch.fixedHealthThresholds) {
    row.fixed_health_recomendado = patch.fixedHealthThresholds.recomendado;
    row.fixed_health_excelente = patch.fixedHealthThresholds.excelente;
    row.fixed_health_alerta = patch.fixedHealthThresholds.alerta;
  }
  if (Object.keys(row).length > 0) {
    await supabase.from('profiles').update(row).eq('id', userId);
  }
}

export async function markOnboarded(userId: string): Promise<void> {
  await supabase.from('profiles').update({ is_onboarded: true }).eq('id', userId);
}

// ─── Incomes ────────────────────────────────────────────────────────────────

function rowToIncome(row: Record<string, unknown>): Income {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    source: row.source as string,
    type: row.type as Income['type'],
    amount: Number(row.amount),
    day: Number(row.day),
    month: Number(row.month),
    year: Number(row.year),
    isEstimated: Boolean(row.is_estimated),
  };
}

export async function fetchIncomes(userId: string): Promise<Income[]> {
  const { data } = await supabase.from('incomes').select('*').eq('user_id', userId);
  return (data ?? []).map(r => rowToIncome(r as Record<string, unknown>));
}

export async function insertIncome(userId: string, income: Omit<Income, 'id' | 'userId'>): Promise<Income> {
  const { data, error } = await supabase
    .from('incomes')
    .insert({
      user_id: userId,
      source: income.source,
      type: income.type,
      amount: income.amount,
      day: income.day,
      month: income.month,
      year: income.year,
      is_estimated: income.isEstimated ?? false,
    })
    .select()
    .single();
  if (error || !data) throw error ?? new Error('insertIncome failed');
  return rowToIncome(data as Record<string, unknown>);
}

export async function patchIncome(id: string, patch: Partial<Income>): Promise<void> {
  const row: Record<string, unknown> = {};
  if (patch.source !== undefined) row.source = patch.source;
  if (patch.type !== undefined) row.type = patch.type;
  if (patch.amount !== undefined) row.amount = patch.amount;
  if (patch.day !== undefined) row.day = patch.day;
  if (patch.month !== undefined) row.month = patch.month;
  if (patch.year !== undefined) row.year = patch.year;
  if (patch.isEstimated !== undefined) row.is_estimated = patch.isEstimated;
  if (Object.keys(row).length > 0) await supabase.from('incomes').update(row).eq('id', id);
}

export async function removeIncome(id: string): Promise<void> {
  await supabase.from('incomes').delete().eq('id', id);
}

// ─── Fixed Expenses ──────────────────────────────────────────────────────────

function rowToFixed(row: Record<string, unknown>): FixedExpense {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    name: row.name as string,
    category: row.category as string,
    amount: Number(row.amount),
    dueDay: Number(row.due_day),
    active: Boolean(row.active),
  };
}

export async function fetchFixedExpenses(userId: string): Promise<FixedExpense[]> {
  const { data } = await supabase.from('fixed_expenses').select('*').eq('user_id', userId);
  return (data ?? []).map(r => rowToFixed(r as Record<string, unknown>));
}

export async function insertFixedExpense(userId: string, expense: Omit<FixedExpense, 'id' | 'userId'>): Promise<FixedExpense> {
  const { data, error } = await supabase
    .from('fixed_expenses')
    .insert({
      user_id: userId,
      name: expense.name,
      category: expense.category,
      amount: expense.amount,
      due_day: expense.dueDay,
      active: expense.active,
    })
    .select()
    .single();
  if (error || !data) throw error ?? new Error('insertFixedExpense failed');
  return rowToFixed(data as Record<string, unknown>);
}

export async function patchFixedExpense(id: string, patch: Partial<FixedExpense>): Promise<void> {
  const row: Record<string, unknown> = {};
  if (patch.name !== undefined) row.name = patch.name;
  if (patch.category !== undefined) row.category = patch.category;
  if (patch.amount !== undefined) row.amount = patch.amount;
  if (patch.dueDay !== undefined) row.due_day = patch.dueDay;
  if (patch.active !== undefined) row.active = patch.active;
  if (Object.keys(row).length > 0) await supabase.from('fixed_expenses').update(row).eq('id', id);
}

export async function removeFixedExpense(id: string): Promise<void> {
  await supabase.from('fixed_expenses').delete().eq('id', id);
}

// ─── Daily Expenses ──────────────────────────────────────────────────────────

function rowToDaily(row: Record<string, unknown>): DailyExpense {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    description: row.description as string,
    category: row.category as string,
    amount: Number(row.amount),
    paymentMethod: row.payment_method as DailyExpense['paymentMethod'],
    creditCardId: (row.credit_card_id as string | null) ?? undefined,
    installments: row.installments != null ? Number(row.installments) : undefined,
    installmentAmount: row.installment_amount != null ? Number(row.installment_amount) : undefined,
    date: row.date as string,
    month: Number(row.month),
    year: Number(row.year),
  };
}

export async function fetchDailyExpenses(userId: string): Promise<DailyExpense[]> {
  const { data } = await supabase.from('daily_expenses').select('*').eq('user_id', userId);
  return (data ?? []).map(r => rowToDaily(r as Record<string, unknown>));
}

export async function insertDailyExpense(userId: string, expense: Omit<DailyExpense, 'id' | 'userId'>): Promise<DailyExpense> {
  const { data, error } = await supabase
    .from('daily_expenses')
    .insert({
      user_id: userId,
      description: expense.description,
      category: expense.category,
      amount: expense.amount,
      payment_method: expense.paymentMethod,
      credit_card_id: expense.creditCardId ?? null,
      installments: expense.installments ?? null,
      installment_amount: expense.installmentAmount ?? null,
      date: expense.date,
      month: expense.month,
      year: expense.year,
    })
    .select()
    .single();
  if (error || !data) throw error ?? new Error('insertDailyExpense failed');
  return rowToDaily(data as Record<string, unknown>);
}

export async function patchDailyExpense(id: string, patch: Partial<DailyExpense>): Promise<void> {
  const row: Record<string, unknown> = {};
  if (patch.description !== undefined) row.description = patch.description;
  if (patch.category !== undefined) row.category = patch.category;
  if (patch.amount !== undefined) row.amount = patch.amount;
  if (patch.paymentMethod !== undefined) row.payment_method = patch.paymentMethod;
  if (patch.creditCardId !== undefined) row.credit_card_id = patch.creditCardId;
  if (patch.installments !== undefined) row.installments = patch.installments;
  if (patch.installmentAmount !== undefined) row.installment_amount = patch.installmentAmount;
  if (patch.date !== undefined) row.date = patch.date;
  if (patch.month !== undefined) row.month = patch.month;
  if (patch.year !== undefined) row.year = patch.year;
  if (Object.keys(row).length > 0) await supabase.from('daily_expenses').update(row).eq('id', id);
}

export async function removeDailyExpense(id: string): Promise<void> {
  await supabase.from('daily_expenses').delete().eq('id', id);
}

// ─── Credit Cards ────────────────────────────────────────────────────────────

function rowToCard(row: Record<string, unknown>): CreditCard {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    name: row.name as string,
    closingDay: Number(row.closing_day),
    dueDay: Number(row.due_day),
    limit: row.card_limit != null ? Number(row.card_limit) : undefined,
  };
}

export async function fetchCreditCards(userId: string): Promise<CreditCard[]> {
  const { data } = await supabase.from('credit_cards').select('*').eq('user_id', userId);
  return (data ?? []).map(r => rowToCard(r as Record<string, unknown>));
}

export async function insertCreditCard(userId: string, card: Omit<CreditCard, 'id' | 'userId'>): Promise<CreditCard> {
  const { data, error } = await supabase
    .from('credit_cards')
    .insert({
      user_id: userId,
      name: card.name,
      closing_day: card.closingDay,
      due_day: card.dueDay,
      card_limit: card.limit ?? null,
    })
    .select()
    .single();
  if (error || !data) throw error ?? new Error('insertCreditCard failed');
  return rowToCard(data as Record<string, unknown>);
}

export async function patchCreditCard(id: string, patch: Partial<CreditCard>): Promise<void> {
  const row: Record<string, unknown> = {};
  if (patch.name !== undefined) row.name = patch.name;
  if (patch.closingDay !== undefined) row.closing_day = patch.closingDay;
  if (patch.dueDay !== undefined) row.due_day = patch.dueDay;
  if (patch.limit !== undefined) row.card_limit = patch.limit;
  if (Object.keys(row).length > 0) await supabase.from('credit_cards').update(row).eq('id', id);
}

export async function removeCreditCard(id: string): Promise<void> {
  await supabase.from('credit_cards').delete().eq('id', id);
}

// ─── Savings ────────────────────────────────────────────────────────────────

function rowToSaving(row: Record<string, unknown>): SavingEntry {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    category: row.category as string,
    categoryLabel: row.category_label as string,
    amount: Number(row.amount),
    month: Number(row.month),
    year: Number(row.year),
  };
}

export async function fetchSavings(userId: string): Promise<SavingEntry[]> {
  const { data } = await supabase.from('savings').select('*').eq('user_id', userId);
  return (data ?? []).map(r => rowToSaving(r as Record<string, unknown>));
}

export async function insertSaving(userId: string, saving: Omit<SavingEntry, 'id' | 'userId'>): Promise<SavingEntry> {
  const { data, error } = await supabase
    .from('savings')
    .insert({
      user_id: userId,
      category: saving.category,
      category_label: saving.categoryLabel,
      amount: saving.amount,
      month: saving.month,
      year: saving.year,
    })
    .select()
    .single();
  if (error || !data) throw error ?? new Error('insertSaving failed');
  return rowToSaving(data as Record<string, unknown>);
}

export async function patchSaving(id: string, patch: Partial<SavingEntry>): Promise<void> {
  const row: Record<string, unknown> = {};
  if (patch.amount !== undefined) row.amount = patch.amount;
  if (patch.categoryLabel !== undefined) row.category_label = patch.categoryLabel;
  if (Object.keys(row).length > 0) await supabase.from('savings').update(row).eq('id', id);
}
