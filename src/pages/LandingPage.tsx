import { useNavigate } from 'react-router-dom';
import { ArrowRight, Check, BarChart3, Zap, Shield, Calendar, CreditCard, TrendingUp, ChevronDown } from 'lucide-react';
import { useState } from 'react';

const FAQ_ITEMS = [
  { q: 'É gratuito?', a: 'Sim, o primeiro mês é completamente grátis. Após isso, você escolhe entre plano mensal (R$ 14,90) ou anual (R$ 119,90, equivalente a R$ 10/mês).' },
  { q: 'Funciona no celular e no computador?', a: 'Sim! O app funciona em qualquer dispositivo com navegador — celular, tablet ou desktop. Nenhuma instalação necessária.' },
  { q: 'Preciso conectar meu banco?', a: 'Não. Você registra os gastos manualmente — simples, rápido e sem integrações obrigatórias.' },
  { q: 'Posso usar se minha renda é variável?', a: 'Sim. O app aceita renda estimada no início do mês e você atualiza quando receber. O valor diário é recalculado automaticamente.' },
  { q: 'Meus dados são seguros?', a: 'Sim. Todos os dados são criptografados em trânsito e em repouso, seguindo as diretrizes da LGPD.' },
  { q: 'Posso cancelar a qualquer momento?', a: 'Sim, sem multa ou fidelidade. Cancele quando quiser pelo próprio app.' },
  { q: 'Tem suporte em português?', a: 'Sim, o app e o suporte são 100% em PT-BR.' },
];

const FEATURES = [
  { icon: <Calendar size={24} />, title: 'Valor diário inteligente', desc: 'Saiba exatamente quanto pode gastar por dia, atualizado em tempo real.' },
  { icon: <Shield size={24} />, title: 'Controle de gastos fixos', desc: 'Organize aluguel, assinaturas e contas recorrentes com saúde financeira monitorada.' },
  { icon: <Zap size={24} />, title: 'Lançamento em 10 segundos', desc: 'Registre um gasto com valor + categoria + confirmação. Sem fricção.' },
  { icon: <BarChart3 size={24} />, title: 'Projeção do mês em tempo real', desc: 'Veja se o mês vai fechar bem ou mal antes que seja tarde demais.' },
  { icon: <CreditCard size={24} />, title: 'Cartão de crédito e parcelas', desc: 'Rastreie cada compra no crédito com ciclo de fatura e parcelamentos automáticos.' },
  { icon: <TrendingUp size={24} />, title: 'Economias e patrimônio', desc: 'Registre seus investimentos mensalmente e acompanhe a evolução do seu patrimônio.' },
];

const TESTIMONIALS = [
  { name: 'Ana Lima', role: 'CLT · São Paulo', text: 'Finalmente parei de perder dinheiro no fim do mês sem saber onde foi. O valor diário mudou minha relação com o dinheiro.', avatar: '🦊' },
  { name: 'Carlos Mendes', role: 'PJ / Designer', text: 'Como autônomo, controlar a renda variável era um pesadelo. Agora registro uma estimativa e ajusto quando o pagamento cai.', avatar: '🦉' },
  { name: 'Mariana Souza', role: 'Estudante · RJ', text: 'Simples de verdade. Não preciso de curso nem manual — em 5 minutos já estava controlando meu orçamento.', avatar: '🐻' },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-slate-100 last:border-0">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between py-4 text-left">
        <span className="font-medium text-slate-800 text-sm pr-4">{q}</span>
        <ChevronDown size={16} className={`text-slate-400 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <p className="text-sm text-slate-600 pb-4 leading-relaxed">{a}</p>}
    </div>
  );
}

export function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-svh bg-white text-slate-900 font-sans">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-sm border-b border-slate-100 px-6 py-4 flex items-center justify-between">
        <span className="font-bold text-xl text-[#4361EE]">Bolso</span>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/login')} className="px-4 py-2 text-slate-600 text-sm font-medium hover:text-[#4361EE] transition-colors">
            Entrar
          </button>
          <button onClick={() => navigate('/register')} className="px-4 py-2 bg-[#4361EE] text-white rounded-full text-sm font-semibold hover:bg-[#3451d1] transition-colors">
            Começar grátis
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-6 py-16 text-center max-w-2xl mx-auto">
        <div className="inline-block bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-medium mb-6">
          14 dias grátis · Sem cartão de crédito
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight tracking-tight mb-4">
          Troque suas planilhas por uma gestão{' '}
          <span className="text-[#4361EE]">real e preditiva</span>
        </h1>
        <p className="text-slate-500 text-lg mb-8 leading-relaxed">
          Para CLT, autônomos e estudantes — controle financeiro que funciona de verdade, no celular, no computador, onde você estiver.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button onClick={() => navigate('/register')}
            className="flex items-center justify-center gap-2 px-8 py-4 bg-[#4361EE] text-white rounded-2xl text-base font-bold hover:bg-[#3451d1] transition-colors shadow-lg shadow-blue-200">
            Começar grátis por 14 dias <ArrowRight size={18} />
          </button>
          <button className="px-8 py-4 border border-slate-200 text-slate-600 rounded-2xl text-base font-medium hover:bg-slate-50">
            Ver como funciona
          </button>
        </div>

        {/* App mockup */}
        <div className="mt-12 relative">
          <div className="bg-gradient-to-b from-slate-900 to-slate-800 rounded-3xl p-4 mx-auto max-w-xs shadow-2xl">
            <div className="bg-white rounded-2xl overflow-hidden">
              {/* Mock app header */}
              <div className="bg-white border-b border-slate-100 px-4 py-3 flex items-center justify-between">
                <span className="font-bold text-[#4361EE] text-sm">Bolso</span>
                <div className="flex gap-2">
                  <div className="w-6 h-6 bg-slate-100 rounded-full" />
                  <div className="w-6 h-6 bg-slate-100 rounded-full" />
                </div>
              </div>
              {/* Mock content */}
              <div className="p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-400">Maio 2026</span>
                  <div className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full font-semibold">R$ 133,33/dia</div>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div className="bg-[#4361EE] h-full rounded-full" style={{ width: '68%' }} />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[{ l: 'Entradas', v: 'R$ 9.200', c: 'text-[#4361EE]' }, { l: 'Fixos', v: 'R$ 3.202', c: 'text-slate-600' }, { l: 'Diário', v: 'R$ 1.458', c: 'text-orange-600' }].map(card => (
                    <div key={card.l} className="bg-slate-50 rounded-xl p-2 text-center">
                      <p className="text-[9px] text-slate-400">{card.l}</p>
                      <p className={`text-[10px] font-bold ${card.c}`}>{card.v}</p>
                    </div>
                  ))}
                </div>
                <div className="bg-green-50 border border-green-200 rounded-xl p-2.5">
                  <p className="text-[10px] text-green-700 font-medium">✓ Situação confortável — saldo projetado: R$ 4.540</p>
                </div>
                {[
                  { emoji: '🍽️', desc: 'Almoço', val: '-R$ 42,00', date: 'hoje' },
                  { emoji: '💰', desc: 'Salário CLT', val: '+R$ 8.000', date: '05/mai' },
                  { emoji: '🎉', desc: 'Happy hour', val: '-R$ 78,00', date: 'ontem' },
                ].map((t, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-sm">{t.emoji}</span>
                    <span className="text-[10px] text-slate-600 flex-1">{t.desc}</span>
                    <span className="text-[10px] font-semibold text-slate-500">{t.val}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="absolute -inset-4 bg-[#4361EE]/10 rounded-3xl -z-10 blur-2xl" />
        </div>
      </section>

      {/* For who */}
      <section className="px-6 py-16 bg-slate-50">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-2">Para quem é o Bolso?</h2>
          <p className="text-slate-500 text-center text-sm mb-8">Não importa seu tipo de renda — o Bolso se adapta a você.</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { emoji: '💼', title: 'CLT', desc: 'Seu salário fixo, sem surpresas no fim do mês. Veja exatamente quanto sobra depois dos fixos.' },
              { emoji: '🧾', title: 'Autônomo / PJ', desc: 'Renda variável com controle previsível. Estime, registre e ajuste quando o pagamento cair.' },
              { emoji: '🎓', title: 'Estudante', desc: 'Aprenda a gerenciar desde cedo com uma ferramenta simples e sem jargão.' },
            ].map(p => (
              <div key={p.title} className="bg-white rounded-2xl p-5 border border-slate-100 text-center shadow-sm">
                <span className="text-4xl">{p.emoji}</span>
                <h3 className="font-bold mt-3 mb-2">{p.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-16">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-2">Tudo que você precisa. Nada do que não precisa.</h2>
          <p className="text-slate-500 text-center text-sm mb-8">Sem dashboard confuso, sem integrações forçadas, sem onboarding de 30 minutos.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {FEATURES.map(f => (
              <div key={f.title} className="flex gap-4 p-4 rounded-2xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/30 transition-colors">
                <div className="w-10 h-10 bg-blue-100 text-[#4361EE] rounded-xl flex items-center justify-center flex-shrink-0">
                  {f.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-sm mb-1">{f.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="px-6 py-16 bg-slate-50">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-2">Como funciona?</h2>
          <p className="text-slate-500 text-center text-sm mb-10">Você começa a usar em menos de 5 minutos.</p>
          <div className="space-y-6">
            {[
              { step: '01', title: 'Configure sua renda e gastos fixos', desc: 'No onboarding rápido, informe salário e despesas recorrentes. O app já calcula seu orçamento.' },
              { step: '02', title: 'Lance seus gastos do dia em segundos', desc: 'Valor + categoria + confirmar. Menos de 10 segundos por lançamento. Sem complicação.' },
              { step: '03', title: 'Acompanhe e economize sem esforço', desc: 'Veja seu saldo projetado, o valor diário disponível e a saúde do mês em tempo real.' },
            ].map(s => (
              <div key={s.step} className="flex gap-4">
                <div className="w-10 h-10 bg-[#4361EE] text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                  {s.step}
                </div>
                <div>
                  <h3 className="font-semibold mb-1">{s.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="px-6 py-16">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">O que dizem nossos usuários</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {TESTIMONIALS.map(t => (
              <div key={t.name} className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                <p className="text-sm text-slate-600 leading-relaxed mb-4">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{t.avatar}</span>
                  <div>
                    <p className="font-semibold text-sm">{t.name}</p>
                    <p className="text-xs text-slate-400">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="px-6 py-16 bg-slate-50">
        <div className="max-w-xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-2">Preço simples, sem pegadinhas</h2>
          <p className="text-slate-500 text-sm mb-8">Comece grátis. Assine se amar.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
              <p className="font-bold text-lg">Mensal</p>
              <p className="text-3xl font-extrabold mt-2">R$ 14,90<span className="text-base font-normal text-slate-400">/mês</span></p>
              <ul className="mt-4 space-y-2 text-sm text-slate-600">
                {['Todas as funcionalidades', 'Suporte PT-BR', 'Cancele quando quiser'].map(f => (
                  <li key={f} className="flex items-center gap-2"><Check size={14} className="text-[#4361EE]" />{f}</li>
                ))}
              </ul>
              <button onClick={() => navigate('/register')} className="mt-6 w-full py-3 rounded-xl border border-[#4361EE] text-[#4361EE] font-semibold text-sm hover:bg-blue-50">
                Começar grátis
              </button>
            </div>
            <div className="bg-[#4361EE] rounded-2xl p-6 shadow-lg relative overflow-hidden">
              <div className="absolute top-3 right-3 bg-yellow-400 text-yellow-900 text-[10px] font-bold px-2 py-0.5 rounded-full">MELHOR VALOR</div>
              <p className="font-bold text-lg text-white">Anual</p>
              <p className="text-3xl font-extrabold mt-2 text-white">R$ 10<span className="text-base font-normal text-blue-200">/mês</span></p>
              <p className="text-blue-200 text-xs mt-0.5">cobrado como R$ 119,90/ano</p>
              <ul className="mt-4 space-y-2 text-sm text-blue-100">
                {['Todas as funcionalidades', 'Suporte PT-BR', '2 meses grátis vs mensal'].map(f => (
                  <li key={f} className="flex items-center gap-2"><Check size={14} className="text-blue-300" />{f}</li>
                ))}
              </ul>
              <button onClick={() => navigate('/register')} className="mt-6 w-full py-3 rounded-xl bg-white text-blue-700 font-bold text-sm hover:bg-blue-50">
                Começar grátis
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-6 py-16">
        <div className="max-w-xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">Perguntas frequentes</h2>
          <div className="bg-white rounded-2xl border border-slate-100 px-6 divide-y divide-slate-100">
            {FAQ_ITEMS.map(item => <FaqItem key={item.q} {...item} />)}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-6 py-16 text-center bg-gradient-to-br from-[#4361EE] to-blue-800 text-white">
        <h2 className="text-3xl font-extrabold mb-3">Comece agora — é grátis por 14 dias.</h2>
        <p className="text-blue-200 mb-8">Sem cartão de crédito. Sem compromisso.</p>
        <button onClick={() => navigate('/register')}
          className="inline-flex items-center gap-2 px-8 py-4 bg-white text-blue-700 font-bold rounded-2xl hover:bg-blue-50 transition-colors shadow-xl">
          Criar conta grátis <ArrowRight size={18} />
        </button>
      </section>

      {/* Footer */}
      <footer className="px-6 py-8 text-center text-slate-400 text-xs border-t border-slate-100">
        <p>Bolso · © {new Date().getFullYear()} · Feito no Brasil 🇧🇷</p>
        <p className="mt-1">Privacidade · Termos · Suporte</p>
      </footer>
    </div>
  );
}
