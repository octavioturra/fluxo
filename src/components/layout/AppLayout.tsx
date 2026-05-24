import { Outlet, NavLink } from 'react-router-dom';
import { Wallet, RepeatIcon, Home, PenLine, TrendingUp, Bell, UserCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { MonthPicker } from '../ui/MonthPicker';
import { useDarkMode } from '../../hooks/useDarkMode';

const navItems = [
  { to: '/app/entradas', icon: Wallet, label: 'Entradas' },
  { to: '/app/fixos', icon: RepeatIcon, label: 'Fixos' },
  { to: '/app', icon: Home, label: 'Resumo', center: true },
  { to: '/app/diario', icon: PenLine, label: 'Diário' },
  { to: '/app/economias', icon: TrendingUp, label: 'Economias' },
];

export function AppLayout() {
  const navigate = useNavigate();
  const { currentMonth, currentYear, setCurrentPeriod } = useApp();
  useDarkMode();
  return (
    <div className="flex flex-col min-h-svh bg-[#FDF5F3] dark:bg-slate-950 max-w-md mx-auto relative">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white dark:bg-slate-900 border-b border-[#F3F4F6] dark:border-slate-800 px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <span className="font-bold text-lg text-[#4361EE] tracking-tight">Bolso</span>
          <MonthPicker month={currentMonth} year={currentYear} onChange={setCurrentPeriod} short />
        </div>
        <div className="flex items-center gap-2">
          <button className="relative p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800">
            <Bell size={20} className="text-slate-500 dark:text-slate-400" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
          </button>
          <button onClick={() => navigate('/app/perfil')} className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800">
            <UserCircle size={22} className="text-slate-500 dark:text-slate-400" />
          </button>
        </div>
      </header>

      {/* Page content */}
      <main className="flex-1 overflow-y-auto pb-20">
        <Outlet />
      </main>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-40 bg-white dark:bg-slate-900 border-t border-[#F3F4F6] dark:border-slate-800 safe-area-bottom">
        <div className="flex items-end justify-around px-2 py-2">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/app'}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all ${
                  item.center ? 'relative -mt-4' : ''
                } ${isActive && !item.center ? 'text-[#4361EE]' : !item.center ? 'text-slate-400 dark:text-slate-500' : ''}`
              }
            >
              {({ isActive }) => (
                <>
                  <div className={item.center
                    ? `p-3 rounded-full shadow-lg ${isActive ? 'bg-[#4361EE]' : 'bg-[#5a78f0]'}`
                    : ''
                  }>
                    <item.icon
                      size={item.center ? 22 : 20}
                      className={item.center ? 'text-white' : ''}
                    />
                  </div>
                  <span className={`text-[10px] font-medium ${item.center ? 'mt-1 text-[#4361EE]' : ''}`}>
                    {item.label}
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
