import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Check, ChevronLeft } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatCurrency } from '../lib/finance';

// ─── MD3 Outlined Text Field ──────────────────────────────────────────────────

function OutlinedField({
  label,
  value,
  onChange,
  type = 'text',
  inputMode,
  placeholder = '',
  prefix = '',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  inputMode?: React.InputHTMLAttributes<HTMLInputElement>['inputMode'];
  placeholder?: string;
  prefix?: string;
}) {
  const [focused, setFocused] = useState(false);
  const floating = focused || value.length > 0;

  return (
    <div
      className={`relative border rounded transition-colors ${
        focused ? 'border-2 border-[#4361EE]' : 'border border-slate-400'
      }`}
    >
      <label
        className={`absolute left-3 transition-all duration-150 pointer-events-none bg-white px-0.5 ${
          floating
            ? `-top-2.5 text-[11px] font-medium ${focused ? 'text-[#4361EE]' : 'text-slate-500'}`
            : 'top-1/2 -translate-y-1/2 text-sm text-slate-400'
        }`}
      >
        {label}
      </label>
      {prefix && floating && (
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-700 pointer-events-none">
          {prefix}
        </span>
      )}
      <input
        type={type}
        inputMode={inputMode}
        value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={focused ? placeholder : ''}
        className={`w-full py-3.5 text-sm text-slate-800 bg-transparent outline-none ${
          prefix && floating ? 'pl-8 pr-3' : 'px-3'
        }`}
      />
    </div>
  );
}

// ─── Income card ─────────────────────────────────────────────────────────────

function IncomeCard({
  source,
  amount,
  day,
  onSourceChange,
  onAmountChange,
  onDayChange,
  onRemove,
  canRemove,
}: {
  source: string;
  amount: string;
  day: string;
  onSourceChange: (v: string) => void;
  onAmountChange: (v: string) => void;
  onDayChange: (v: string) => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-4 space-y-3 shadow-sm">
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <OutlinedField
            label="Fonte de renda"
            value={source}
            onChange={onSourceChange}
            placeholder="ex: Salário, Freela…"
          />
        </div>
        {canRemove && (
          <button
            onClick={onRemove}
            className="p-2 rounded-full text-slate-400 hover:bg-red-50 hover:text-red-400 transition-colors flex-shrink-0"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <OutlinedField
          label="Valor"
          value={amount}
          onChange={onAmountChange}
          type="number"
          inputMode="decimal"
          prefix="R$"
        />
        <OutlinedField
          label="Dia do mês"
          value={day}
          onChange={onDayChange}
          type="number"
          inputMode="numeric"
        />
      </div>
    </div>
  );
}

// ─── Constants ────────────────────────────────────────────────────────────────

const FIXED_SUGGESTIONS = [
  { category: 'moradia', name: 'Aluguel', emoji: '🏠' },
  { category: 'moradia', name: 'Condomínio', emoji: '🏠' },
  { category: 'utilidades', name: 'Energia elétrica', emoji: '💡' },
  { category: 'utilidades', name: 'Internet', emoji: '🌐' },
  { category: 'comunicacao', name: 'Plano de celular', emoji: '📱' },
  { category: 'comunicacao', name: 'Netflix', emoji: '📺' },
  { category: 'saude', name: 'Academia', emoji: '💪' },
  { category: 'transporte', name: 'Combustível', emoji: '⛽' },
];

const STEPS = [
  { title: 'Suas entradas', subtitle: 'Quais fontes de renda você tem programadas mensalmente?' },
  { title: 'Gastos fixos', subtitle: 'Aluguel, assinaturas, contas recorrentes…' },
  { title: 'Tudo certo! 🎉', subtitle: 'Confira o resumo do seu orçamento.' },
];

// ─── Types ────────────────────────────────────────────────────────────────────

type IncomeEntry = { source: string; amount: string; day: string };
type FixedEntry = { name: string; category: string; amount: string; dueDay: string };

// ─── Page ─────────────────────────────────────────────────────────────────────

export function OnboardingPage() {
  const navigate = useNavigate();
  const { addIncome, addFixedExpense, completeOnboarding } = useApp();
  const [step, setStep] = useState(0);

  const [incomes, setIncomes] = useState<IncomeEntry[]>([{ source: '', amount: '', day: '5' }]);
  const [fixeds, setFixeds] = useState<FixedEntry[]>([]);

  const totalIncome = incomes.reduce((s, i) => s + (parseFloat(i.amount) || 0), 0);
  const totalFixed = fixeds.reduce((s, f) => s + (parseFloat(f.amount) || 0), 0);
  const balance = totalIncome - totalFixed;
  const today = new Date();
  const daysLeft =
    new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate() - today.getDate() + 1;
  const dailyBudget = daysLeft > 0 ? balance / daysLeft : 0;

  const updateIncome = (i: number, field: keyof IncomeEntry, val: string) =>
    setIncomes(prev => prev.map((e, j) => (j === i ? { ...e, [field]: val } : e)));

  const updateFixed = (i: number, field: keyof FixedEntry, val: string) =>
    setFixeds(prev => prev.map((f, j) => (j === i ? { ...f, [field]: val } : f)));

  const addSuggestion = (s: (typeof FIXED_SUGGESTIONS)[0]) => {
    if (!fixeds.find(f => f.name === s.name)) {
      setFixeds(prev => [...prev, { name: s.name, category: s.category, amount: '', dueDay: '10' }]);
    }
  };

  const handleFinish = () => {
    const now = new Date();
    incomes.forEach(i => {
      if (i.source && i.amount) {
        addIncome({
          source: i.source,
          type: 'outro',
          amount: parseFloat(i.amount),
          day: parseInt(i.day) || 5,
          month: now.getMonth() + 1,
          year: now.getFullYear(),
        });
      }
    });
    fixeds.forEach(f => {
      if (f.name && f.amount) {
        addFixedExpense({
          name: f.name,
          category: f.category,
          amount: parseFloat(f.amount),
          dueDay: parseInt(f.dueDay),
          active: true,
        });
      }
    });
    completeOnboarding();
    navigate('/app');
  };

  return (
    /* Viewport — fundo neutro no desktop, branco no mobile */
    <div className="min-h-svh bg-white sm:bg-slate-100 dark:bg-slate-950 flex flex-col sm:items-center sm:justify-center sm:py-8 sm:px-4">

      {/* Card — full-screen no mobile, card elevado no desktop */}
      <div className="w-full sm:max-w-[440px] bg-[#FFFBFE] dark:bg-slate-900 flex flex-col
                      min-h-svh sm:min-h-0 sm:rounded-[28px] sm:shadow-2xl sm:overflow-hidden">

      {/* MD3 linear progress indicator */}
      <div className="h-1 bg-slate-200">
        <div
          className="h-full bg-[#4361EE] transition-all duration-500 ease-out"
          style={{ width: `${((step + 1) / 3) * 100}%` }}
        />
      </div>

      {/* Scrollable content */}
      <div className="flex-1 px-6 pt-8 pb-4 overflow-y-auto">

        {/* Step dots + back button + counter */}
        <div className="flex items-center gap-3 mb-8">
          {step > 0 ? (
            <button
              onClick={() => setStep(s => s - 1)}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors"
            >
              <ChevronLeft size={20} className="text-slate-700" />
            </button>
          ) : (
            <div className="w-10" />
          )}

          <div className="flex gap-1.5 items-center flex-1 justify-center">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`rounded-full transition-all duration-300 ${
                  i === step
                    ? 'w-6 h-2 bg-[#4361EE]'
                    : i < step
                    ? 'w-2 h-2 bg-[#4361EE]'
                    : 'w-2 h-2 bg-slate-300'
                }`}
              />
            ))}
          </div>

          <span className="w-10 text-right text-xs text-slate-400">{step + 1}/3</span>
        </div>

        {/* Step header */}
        <div className="mb-8">
          <h1 className="text-[26px] font-semibold text-slate-900 leading-tight">
            {STEPS[step].title}
          </h1>
          <p className="text-sm text-slate-500 mt-2 leading-relaxed">{STEPS[step].subtitle}</p>
        </div>

        {/* ── STEP 0: Entradas ─────────────────────────────────────────── */}
        {step === 0 && (
          <div className="space-y-3">
            {incomes.map((inc, i) => (
              <IncomeCard
                key={i}
                source={inc.source}
                amount={inc.amount}
                day={inc.day}
                onSourceChange={v => updateIncome(i, 'source', v)}
                onAmountChange={v => updateIncome(i, 'amount', v)}
                onDayChange={v => updateIncome(i, 'day', v)}
                onRemove={() => setIncomes(prev => prev.filter((_, j) => j !== i))}
                canRemove={incomes.length > 1}
              />
            ))}

            <button
              onClick={() => setIncomes(prev => [...prev, { source: '', amount: '', day: '5' }])}
              className="w-full py-3.5 rounded-full border-2 border-dashed border-[#4361EE]/40 text-[#4361EE] text-sm font-medium flex items-center justify-center gap-2 hover:bg-[#4361EE]/5 active:bg-[#4361EE]/10 transition-colors"
            >
              <Plus size={16} />
              Adicionar outra fonte
            </button>
          </div>
        )}

        {/* ── STEP 1: Gastos fixos ─────────────────────────────────────── */}
        {step === 1 && (
          <div className="space-y-5">
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-3">
                Sugestões rápidas
              </p>
              <div className="flex flex-wrap gap-2">
                {FIXED_SUGGESTIONS.map(s => {
                  const selected = !!fixeds.find(f => f.name === s.name);
                  return (
                    <button
                      key={s.name}
                      onClick={() => addSuggestion(s)}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium border transition-all ${
                        selected
                          ? 'bg-[#4361EE] text-white border-[#4361EE]'
                          : 'bg-white border-slate-200 text-slate-600 hover:border-[#4361EE] hover:text-[#4361EE]'
                      }`}
                    >
                      {s.emoji} {s.name} {selected && <Check size={12} />}
                    </button>
                  );
                })}
              </div>
            </div>

            {fixeds.length > 0 && (
              <div className="space-y-2">
                {fixeds.map((f, i) => (
                  <div
                    key={i}
                    className="bg-white rounded-2xl border border-slate-200 p-3 flex items-center gap-3 shadow-sm"
                  >
                    <div className="flex-1">
                      <OutlinedField
                        label="Nome"
                        value={f.name}
                        onChange={v => updateFixed(i, 'name', v)}
                      />
                    </div>
                    <div className="w-28">
                      <OutlinedField
                        label="Valor"
                        value={f.amount}
                        onChange={v => updateFixed(i, 'amount', v)}
                        type="number"
                        inputMode="decimal"
                        prefix="R$"
                      />
                    </div>
                    <button
                      onClick={() => setFixeds(prev => prev.filter((_, j) => j !== i))}
                      className="p-2 rounded-full text-slate-400 hover:bg-red-50 hover:text-red-400 transition-colors flex-shrink-0"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() =>
                setFixeds(prev => [...prev, { name: '', category: 'outros', amount: '', dueDay: '10' }])
              }
              className="w-full py-3.5 rounded-full border-2 border-dashed border-[#4361EE]/40 text-[#4361EE] text-sm font-medium flex items-center justify-center gap-2 hover:bg-[#4361EE]/5 active:bg-[#4361EE]/10 transition-colors"
            >
              <Plus size={16} />
              Adicionar gasto fixo
            </button>
          </div>
        )}

        {/* ── STEP 2: Resumo ───────────────────────────────────────────── */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="p-5 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-500">💰 Entradas</span>
                  <span className="font-semibold text-[#4361EE]">{formatCurrency(totalIncome)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-500">📋 Gastos fixos</span>
                  <span className="font-semibold text-slate-700">−{formatCurrency(totalFixed)}</span>
                </div>
                <div className="border-t border-slate-100 pt-4 flex justify-between items-center">
                  <span className="font-semibold text-slate-800">Saldo disponível</span>
                  <span
                    className={`font-bold text-xl ${balance >= 0 ? 'text-[#4361EE]' : 'text-red-500'}`}
                  >
                    {formatCurrency(balance)}
                  </span>
                </div>
              </div>

              <div className="bg-[#4361EE]/5 px-5 py-5 text-center border-t border-[#4361EE]/10">
                <p className="text-xs text-slate-500 mb-1.5">Valor diário sugerido</p>
                <p className="text-4xl font-extrabold text-[#4361EE]">
                  {formatCurrency(Math.max(0, dailyBudget))}
                </p>
                <p className="text-xs text-slate-400 mt-1.5">para os próximos {daysLeft} dias</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom CTA */}
      <div className="px-6 pb-10 pt-4 space-y-2">
        {step < 2 ? (
          <button
            onClick={() => setStep(s => s + 1)}
            className="w-full h-14 bg-[#4361EE] text-white font-semibold rounded-full hover:bg-[#3451d1] active:scale-[0.98] transition-all shadow-md shadow-[#4361EE]/30 text-[15px]"
          >
            Continuar
          </button>
        ) : (
          <button
            onClick={handleFinish}
            className="w-full h-14 bg-[#4361EE] text-white font-semibold rounded-full hover:bg-[#3451d1] active:scale-[0.98] transition-all shadow-md shadow-[#4361EE]/30 flex items-center justify-center gap-2 text-[15px]"
          >
            <Check size={18} />
            Começar a usar
          </button>
        )}
        {step === 1 && (
          <button onClick={() => setStep(2)} className="w-full py-3 text-slate-400 text-sm text-center">
            Pular por agora
          </button>
        )}
      </div>
      </div> {/* /card */}
    </div> // /viewport
  );
}
