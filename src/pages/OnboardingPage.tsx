import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, ChevronLeft, Check } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatCurrency } from '../lib/finance';

const CONTRACT_TYPES = [
  { id: 'clt', label: 'CLT', desc: 'Salário fixo mensal', emoji: '💼' },
  { id: 'pj', label: 'PJ / Autônomo', desc: 'Renda variável ou recorrente', emoji: '🧾' },
  { id: 'aposentado', label: 'Aposentado', desc: 'Aposentadoria / Pensão', emoji: '🏦' },
  { id: 'variavel', label: 'Renda variável', desc: 'Sem renda fixa', emoji: '📊' },
];

const FIXED_SUGGESTIONS = [
  { category: 'moradia', name: 'Aluguel', emoji: '🏠' },
  { category: 'moradia', name: 'Condomínio', emoji: '🏠' },
  { category: 'utilidades', name: 'Energia elétrica', emoji: '💡' },
  { category: 'utilidades', name: 'Internet', emoji: '💡' },
  { category: 'comunicacao', name: 'Plano de celular', emoji: '📱' },
  { category: 'comunicacao', name: 'Netflix', emoji: '📱' },
  { category: 'saude', name: 'Academia', emoji: '🏥' },
  { category: 'transporte', name: 'Combustível', emoji: '🚗' },
];

export function OnboardingPage() {
  const navigate = useNavigate();
  const { addIncome, addFixedExpense, completeOnboarding } = useApp();
  const [step, setStep] = useState(0);

  // Step 0 — income
  const [contractType, setContractType] = useState('clt');
  const [mainIncome, setMainIncome] = useState('');
  const [incomeDay, setIncomeDay] = useState('5');
  const [extraIncomes, setExtraIncomes] = useState<{ source: string; amount: string; day: string }[]>([]);

  // Step 1 — fixed expenses
  const [fixeds, setFixeds] = useState<{ name: string; category: string; amount: string; dueDay: string }[]>([]);

  const totalIncome = (parseFloat(mainIncome) || 0) + extraIncomes.reduce((s, e) => s + (parseFloat(e.amount) || 0), 0);
  const totalFixed = fixeds.reduce((s, f) => s + (parseFloat(f.amount) || 0), 0);
  const balance = totalIncome - totalFixed;
  const today = new Date();
  const daysLeft = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate() - today.getDate() + 1;
  const dailyBudget = daysLeft > 0 ? balance / daysLeft : 0;

  const addSuggestion = (s: typeof FIXED_SUGGESTIONS[0]) => {
    if (!fixeds.find(f => f.name === s.name)) {
      setFixeds(prev => [...prev, { name: s.name, category: s.category, amount: '', dueDay: '10' }]);
    }
  };

  const handleFinish = () => {
    const now = new Date();
    if (mainIncome) {
      addIncome({
        source: contractType === 'clt' ? 'Salário CLT' : contractType === 'pj' ? 'Renda PJ' : contractType === 'aposentado' ? 'Aposentadoria' : 'Renda',
        type: contractType as any,
        amount: parseFloat(mainIncome),
        day: parseInt(incomeDay),
        month: now.getMonth() + 1,
        year: now.getFullYear(),
        isEstimated: contractType !== 'clt',
      });
    }
    extraIncomes.forEach(e => {
      if (e.source && e.amount) {
        addIncome({ source: e.source, type: 'outro', amount: parseFloat(e.amount), day: parseInt(e.day), month: now.getMonth() + 1, year: now.getFullYear() });
      }
    });
    fixeds.forEach(f => {
      if (f.name && f.amount) {
        addFixedExpense({ name: f.name, category: f.category, amount: parseFloat(f.amount), dueDay: parseInt(f.dueDay), active: true });
      }
    });
    completeOnboarding();
    navigate('/app');
  };

  return (
    <div className="min-h-svh bg-gradient-to-br from-emerald-50 to-white flex flex-col max-w-md mx-auto">
      {/* Progress */}
      <div className="px-6 pt-8 pb-4">
        <div className="flex items-center gap-3 mb-6">
          {step > 0 && (
            <button onClick={() => setStep(s => s - 1)} className="p-2 rounded-full bg-white shadow-sm">
              <ChevronLeft size={18} />
            </button>
          )}
          <div className="flex-1">
            <p className="text-xs text-slate-400 mb-1">Passo {step + 1} de 3</p>
            <div className="flex gap-1.5">
              {[0, 1, 2].map(i => (
                <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= step ? 'bg-emerald-500' : 'bg-slate-200'}`} />
              ))}
            </div>
          </div>
        </div>

        {step === 0 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-bold text-slate-800">Qual é sua renda?</h2>
              <p className="text-slate-500 text-sm mt-1">Vamos calcular quanto você pode gastar por dia.</p>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase block mb-2">Tipo de contrato</label>
              <div className="grid grid-cols-2 gap-2">
                {CONTRACT_TYPES.map(t => (
                  <button key={t.id} onClick={() => setContractType(t.id)}
                    className={`p-3 rounded-xl border text-left transition-all ${contractType === t.id ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 bg-white'}`}>
                    <span className="text-xl">{t.emoji}</span>
                    <p className="font-semibold text-sm mt-1">{t.label}</p>
                    <p className="text-xs text-slate-400">{t.desc}</p>
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="text-xs font-semibold text-slate-400 uppercase block mb-1">Valor (R$)</label>
                <input type="number" step="0.01" value={mainIncome} onChange={e => setMainIncome(e.target.value)}
                  placeholder="0,00"
                  className="w-full py-3 px-3 border border-slate-200 rounded-xl text-lg font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase block mb-1">Dia</label>
                <input type="number" min="1" max="31" value={incomeDay} onChange={e => setIncomeDay(e.target.value)}
                  className="w-full py-3 px-3 border border-slate-200 rounded-xl text-lg font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
            </div>
            {(contractType === 'pj' || contractType === 'variavel') && (
              <p className="text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">
                💡 Use o valor estimado. Você pode ajustar quando receber de verdade.
              </p>
            )}

            {/* Extra incomes */}
            {extraIncomes.map((e, i) => (
              <div key={i} className="grid grid-cols-3 gap-2">
                <input value={e.source} onChange={ev => setExtraIncomes(prev => prev.map((x, j) => j === i ? {...x, source: ev.target.value} : x))}
                  placeholder="Fonte" className="col-span-2 py-2 px-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                <input type="number" value={e.amount} onChange={ev => setExtraIncomes(prev => prev.map((x, j) => j === i ? {...x, amount: ev.target.value} : x))}
                  placeholder="R$" className="py-2 px-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
            ))}
            <button onClick={() => setExtraIncomes(prev => [...prev, { source: '', amount: '', day: '15' }])}
              className="text-emerald-600 text-sm font-medium">+ Outra fonte de renda</button>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-bold text-slate-800">Quais são seus gastos fixos?</h2>
              <p className="text-slate-500 text-sm mt-1">Aluguel, assinaturas, contas recorrentes...</p>
            </div>

            {/* Suggestions */}
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase mb-2">Sugestões rápidas</p>
              <div className="flex flex-wrap gap-2">
                {FIXED_SUGGESTIONS.map(s => (
                  <button key={s.name} onClick={() => addSuggestion(s)}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${fixeds.find(f => f.name === s.name) ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white border-slate-200 text-slate-600 hover:border-emerald-400'}`}>
                    {s.emoji} {s.name} {fixeds.find(f => f.name === s.name) && <Check size={10} />}
                  </button>
                ))}
              </div>
            </div>

            {/* Fixed list with amounts */}
            {fixeds.length > 0 && (
              <div className="space-y-2">
                {fixeds.map((f, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <input value={f.name} onChange={e => setFixeds(prev => prev.map((x, j) => j === i ? {...x, name: e.target.value} : x))}
                      className="flex-1 py-2 px-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                    <input type="number" step="0.01" value={f.amount} placeholder="R$"
                      onChange={e => setFixeds(prev => prev.map((x, j) => j === i ? {...x, amount: e.target.value} : x))}
                      className="w-24 py-2 px-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                    <button onClick={() => setFixeds(prev => prev.filter((_, j) => j !== i))}
                      className="text-red-400 text-lg">×</button>
                  </div>
                ))}
              </div>
            )}

            {/* Add custom */}
            <button onClick={() => setFixeds(prev => [...prev, { name: '', category: 'outros', amount: '', dueDay: '10' }])}
              className="text-emerald-600 text-sm font-medium">+ Adicionar gasto fixo</button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-bold text-slate-800">Tudo certo! 🎉</h2>
              <p className="text-slate-500 text-sm mt-1">Veja o resumo do seu orçamento.</p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
              <div className="p-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">💰 Total de entradas</span>
                  <span className="font-bold text-emerald-600">{formatCurrency(totalIncome)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">📋 Gastos fixos</span>
                  <span className="font-bold text-slate-700">-{formatCurrency(totalFixed)}</span>
                </div>
                <div className="border-t border-slate-100 pt-3 flex justify-between text-sm">
                  <span className="font-semibold">Saldo disponível</span>
                  <span className={`font-bold text-lg ${balance >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>{formatCurrency(balance)}</span>
                </div>
                <div className="bg-emerald-50 rounded-xl p-3 text-center">
                  <p className="text-xs text-slate-500 mb-1">Valor diário sugerido</p>
                  <p className="text-2xl font-extrabold text-emerald-600">{formatCurrency(Math.max(0, dailyBudget))}</p>
                  <p className="text-xs text-slate-400 mt-0.5">para os próximos {daysLeft} dias</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom button */}
      <div className="mt-auto px-6 pb-8 pt-4">
        {step < 2 ? (
          <button onClick={() => setStep(s => s + 1)}
            className="w-full py-4 bg-emerald-600 text-white font-bold rounded-2xl flex items-center justify-center gap-2 hover:bg-emerald-700">
            Continuar <ChevronRight size={18} />
          </button>
        ) : (
          <button onClick={handleFinish}
            className="w-full py-4 bg-emerald-600 text-white font-bold rounded-2xl flex items-center justify-center gap-2 hover:bg-emerald-700">
            Começar a usar <Check size={18} />
          </button>
        )}
        {step === 1 && (
          <button onClick={() => setStep(2)} className="w-full py-3 text-slate-400 text-sm mt-2">
            Pular por agora
          </button>
        )}
      </div>
    </div>
  );
}
