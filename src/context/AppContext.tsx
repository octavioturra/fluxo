import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import type { User, Income, FixedExpense, DailyExpense, CreditCard, SavingEntry } from '../types';
import {
  mockUser, mockIncomes, mockFixedExpenses, mockDailyExpenses,
  mockCreditCards, mockSavings,
} from '../data/mockData';
import { useAuth } from './AuthContext';
import { isSupabaseConfigured } from '../lib/supabase';
import * as db from '../lib/db';

const STORAGE_KEY = 'orca_app_state';

function loadState(): Partial<AppState> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveState(state: AppState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // storage full
  }
}

const now = new Date();

const defaultState: AppState = {
  user: mockUser,
  incomes: [],
  fixedExpenses: [],
  dailyExpenses: [],
  creditCards: [],
  savings: [],
  isOnboarded: false,
  currentMonth: now.getMonth() + 1,
  currentYear: now.getFullYear(),
};

interface AppState {
  user: User;
  incomes: Income[];
  fixedExpenses: FixedExpense[];
  dailyExpenses: DailyExpense[];
  creditCards: CreditCard[];
  savings: SavingEntry[];
  isOnboarded: boolean;
  currentMonth: number;
  currentYear: number;
}

interface AppContextType extends AppState {
  dataLoaded: boolean;
  setCurrentPeriod: (month: number, year: number) => void;
  addIncome: (income: Omit<Income, 'id' | 'userId'>) => void;
  updateIncome: (id: string, income: Partial<Income>) => void;
  deleteIncome: (id: string) => void;
  addFixedExpense: (expense: Omit<FixedExpense, 'id' | 'userId'>) => void;
  updateFixedExpense: (id: string, expense: Partial<FixedExpense>) => void;
  deleteFixedExpense: (id: string) => void;
  addDailyExpense: (expense: Omit<DailyExpense, 'id' | 'userId'>) => void;
  updateDailyExpense: (id: string, expense: Partial<DailyExpense>) => void;
  deleteDailyExpense: (id: string) => void;
  addCreditCard: (card: Omit<CreditCard, 'id' | 'userId'>) => void;
  updateCreditCard: (id: string, card: Partial<CreditCard>) => void;
  deleteCreditCard: (id: string) => void;
  addSaving: (saving: Omit<SavingEntry, 'id' | 'userId'>) => void;
  updateSaving: (id: string, saving: Partial<SavingEntry>) => void;
  updateUser: (user: Partial<User>) => void;
  completeOnboarding: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

let idCounter = 1000;
const genId = () => `tmp_${++idCounter}`;

const useSupabase = () => isSupabaseConfigured();

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { user: authUser } = useAuth();
  const authRef = useRef(authUser);
  useEffect(() => { authRef.current = authUser; }, [authUser]);

  const [dataLoaded, setDataLoaded] = useState(!isSupabaseConfigured());

  const [state, setState] = useState<AppState>(() => {
    if (isSupabaseConfigured()) return { ...defaultState };
    const stored = loadState();
    return {
      user: stored.user ?? mockUser,
      incomes: stored.incomes ?? mockIncomes,
      fixedExpenses: stored.fixedExpenses ?? mockFixedExpenses,
      dailyExpenses: stored.dailyExpenses ?? mockDailyExpenses,
      creditCards: stored.creditCards ?? mockCreditCards,
      savings: stored.savings ?? mockSavings,
      isOnboarded: stored.isOnboarded ?? true,
      currentMonth: now.getMonth() + 1,
      currentYear: now.getFullYear(),
    };
  });

  // Load from Supabase when auth user changes
  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    if (!authUser) {
      setState(s => ({ ...defaultState, currentMonth: s.currentMonth, currentYear: s.currentYear }));
      setDataLoaded(true);
      return;
    }

    setDataLoaded(false);
    Promise.all([
      db.fetchProfile(authUser.id, authUser.email, authUser.name),
      db.fetchIncomes(authUser.id),
      db.fetchFixedExpenses(authUser.id),
      db.fetchDailyExpenses(authUser.id),
      db.fetchCreditCards(authUser.id),
      db.fetchSavings(authUser.id),
    ]).then(([profile, incomes, fixedExpenses, dailyExpenses, creditCards, savings]) => {
      setState(s => ({
        ...s,
        user: profile?.user ?? {
          ...mockUser,
          id: authUser.id,
          name: authUser.name,
          email: authUser.email,
        },
        incomes,
        fixedExpenses,
        dailyExpenses,
        creditCards,
        savings,
        isOnboarded: profile?.isOnboarded ?? false,
      }));
      setDataLoaded(true);
    }).catch(err => {
      console.error('Failed to load data from Supabase', err);
      setDataLoaded(true);
    });
  }, [authUser?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Persist to localStorage when not using Supabase
  useEffect(() => {
    if (!isSupabaseConfigured()) saveState(state);
  }, [state]);

  const setCurrentPeriod = useCallback((month: number, year: number) => {
    setState(s => ({ ...s, currentMonth: month, currentYear: year }));
  }, []);

  // ─── Incomes ──────────────────────────────────────────────────────────────

  const addIncome = useCallback((income: Omit<Income, 'id' | 'userId'>) => {
    const uid = authRef.current?.id ?? 'u1';
    const tempId = genId();
    setState(s => ({ ...s, incomes: [...s.incomes, { ...income, id: tempId, userId: uid }] }));
    if (useSupabase() && uid) {
      db.insertIncome(uid, income).then(inserted => {
        setState(s => ({ ...s, incomes: s.incomes.map(i => i.id === tempId ? inserted : i) }));
      }).catch(console.error);
    }
  }, []);

  const updateIncome = useCallback((id: string, data: Partial<Income>) => {
    setState(s => ({ ...s, incomes: s.incomes.map(i => i.id === id ? { ...i, ...data } : i) }));
    if (useSupabase()) db.patchIncome(id, data).catch(console.error);
  }, []);

  const deleteIncome = useCallback((id: string) => {
    setState(s => ({ ...s, incomes: s.incomes.filter(i => i.id !== id) }));
    if (useSupabase()) db.removeIncome(id).catch(console.error);
  }, []);

  // ─── Fixed Expenses ───────────────────────────────────────────────────────

  const addFixedExpense = useCallback((expense: Omit<FixedExpense, 'id' | 'userId'>) => {
    const uid = authRef.current?.id ?? 'u1';
    const tempId = genId();
    setState(s => ({ ...s, fixedExpenses: [...s.fixedExpenses, { ...expense, id: tempId, userId: uid }] }));
    if (useSupabase() && uid) {
      db.insertFixedExpense(uid, expense).then(inserted => {
        setState(s => ({ ...s, fixedExpenses: s.fixedExpenses.map(f => f.id === tempId ? inserted : f) }));
      }).catch(console.error);
    }
  }, []);

  const updateFixedExpense = useCallback((id: string, data: Partial<FixedExpense>) => {
    setState(s => ({ ...s, fixedExpenses: s.fixedExpenses.map(f => f.id === id ? { ...f, ...data } : f) }));
    if (useSupabase()) db.patchFixedExpense(id, data).catch(console.error);
  }, []);

  const deleteFixedExpense = useCallback((id: string) => {
    setState(s => ({ ...s, fixedExpenses: s.fixedExpenses.filter(f => f.id !== id) }));
    if (useSupabase()) db.removeFixedExpense(id).catch(console.error);
  }, []);

  // ─── Daily Expenses ───────────────────────────────────────────────────────

  const addDailyExpense = useCallback((expense: Omit<DailyExpense, 'id' | 'userId'>) => {
    const uid = authRef.current?.id ?? 'u1';
    const tempId = genId();
    setState(s => ({ ...s, dailyExpenses: [...s.dailyExpenses, { ...expense, id: tempId, userId: uid }] }));
    if (useSupabase() && uid) {
      db.insertDailyExpense(uid, expense).then(inserted => {
        setState(s => ({ ...s, dailyExpenses: s.dailyExpenses.map(d => d.id === tempId ? inserted : d) }));
      }).catch(console.error);
    }
  }, []);

  const updateDailyExpense = useCallback((id: string, data: Partial<DailyExpense>) => {
    setState(s => ({ ...s, dailyExpenses: s.dailyExpenses.map(d => d.id === id ? { ...d, ...data } : d) }));
    if (useSupabase()) db.patchDailyExpense(id, data).catch(console.error);
  }, []);

  const deleteDailyExpense = useCallback((id: string) => {
    setState(s => ({ ...s, dailyExpenses: s.dailyExpenses.filter(d => d.id !== id) }));
    if (useSupabase()) db.removeDailyExpense(id).catch(console.error);
  }, []);

  // ─── Credit Cards ─────────────────────────────────────────────────────────

  const addCreditCard = useCallback((card: Omit<CreditCard, 'id' | 'userId'>) => {
    const uid = authRef.current?.id ?? 'u1';
    const tempId = genId();
    setState(s => ({ ...s, creditCards: [...s.creditCards, { ...card, id: tempId, userId: uid }] }));
    if (useSupabase() && uid) {
      db.insertCreditCard(uid, card).then(inserted => {
        setState(s => ({ ...s, creditCards: s.creditCards.map(c => c.id === tempId ? inserted : c) }));
      }).catch(console.error);
    }
  }, []);

  const updateCreditCard = useCallback((id: string, data: Partial<CreditCard>) => {
    setState(s => ({ ...s, creditCards: s.creditCards.map(c => c.id === id ? { ...c, ...data } : c) }));
    if (useSupabase()) db.patchCreditCard(id, data).catch(console.error);
  }, []);

  const deleteCreditCard = useCallback((id: string) => {
    setState(s => ({ ...s, creditCards: s.creditCards.filter(c => c.id !== id) }));
    if (useSupabase()) db.removeCreditCard(id).catch(console.error);
  }, []);

  // ─── Savings ──────────────────────────────────────────────────────────────

  const addSaving = useCallback((saving: Omit<SavingEntry, 'id' | 'userId'>) => {
    const uid = authRef.current?.id ?? 'u1';
    const tempId = genId();
    setState(s => ({ ...s, savings: [...s.savings, { ...saving, id: tempId, userId: uid }] }));
    if (useSupabase() && uid) {
      db.insertSaving(uid, saving).then(inserted => {
        setState(s => ({ ...s, savings: s.savings.map(sv => sv.id === tempId ? inserted : sv) }));
      }).catch(console.error);
    }
  }, []);

  const updateSaving = useCallback((id: string, data: Partial<SavingEntry>) => {
    setState(s => ({ ...s, savings: s.savings.map(sv => sv.id === id ? { ...sv, ...data } : sv) }));
    if (useSupabase()) db.patchSaving(id, data).catch(console.error);
  }, []);

  // ─── User / Profile ───────────────────────────────────────────────────────

  const updateUser = useCallback((data: Partial<User>) => {
    setState(s => ({ ...s, user: { ...s.user, ...data } }));
    const uid = authRef.current?.id;
    if (useSupabase() && uid) db.updateProfile(uid, data).catch(console.error);
  }, []);

  const completeOnboarding = useCallback(() => {
    setState(s => ({ ...s, isOnboarded: true }));
    const uid = authRef.current?.id;
    if (useSupabase() && uid) db.markOnboarded(uid).catch(console.error);
  }, []);

  return (
    <AppContext.Provider value={{
      ...state,
      dataLoaded,
      setCurrentPeriod,
      addIncome, updateIncome, deleteIncome,
      addFixedExpense, updateFixedExpense, deleteFixedExpense,
      addDailyExpense, updateDailyExpense, deleteDailyExpense,
      addCreditCard, updateCreditCard, deleteCreditCard,
      addSaving, updateSaving,
      updateUser,
      completeOnboarding,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
