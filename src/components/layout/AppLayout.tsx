import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { MonthPicker } from '../ui/MonthPicker';
import { useDarkMode } from '../../hooks/useDarkMode';
import { Icon } from '../ui/Icon';

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

const navItems = [
  { to: '/app/entradas', icon: 'account_balance_wallet', label: 'Entradas' },
  { to: '/app/fixos',    icon: 'autorenew',              label: 'Fixos' },
  { to: '/app',         icon: 'home',                   label: 'Resumo', center: true },
  { to: '/app/diario',  icon: 'edit_note',              label: 'Diário' },
  { to: '/app/economias', icon: 'trending_up',          label: 'Economias' },
];

export function AppLayout() {
  const navigate = useNavigate();
  const { currentMonth, currentYear, setCurrentPeriod, user } = useApp();
  useDarkMode();

  return (
    <div
      className="min-h-svh flex justify-center"
      style={{ background: 'var(--fx-surface-container-low)' }}
    >
      <div
        className="flex flex-col min-h-svh w-full sm:max-w-[440px] relative sm:shadow-2xl"
        style={{ background: 'var(--fx-background)' }}
      >
        {/* Top App Bar */}
        <header
          className="sticky top-0 z-40 flex items-center gap-1 px-4 h-16"
          style={{ background: 'var(--fx-background)', borderBottom: '1px solid var(--fx-outline-variant)' }}
        >
          {/* Logo */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <span
              className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-base"
              style={{ background: 'var(--fx-primary)', color: 'var(--fx-on-primary)' }}
            >
              F
            </span>
            <span className="font-semibold text-xl tracking-tight" style={{ color: 'var(--fx-on-surface)' }}>
              Fluxo
            </span>
          </div>

          {/* Month picker */}
          <div
            className="ml-3 flex items-center gap-0.5 rounded-full px-2 py-1"
            style={{ background: 'var(--fx-surface-container)' }}
          >
            <MonthPicker month={currentMonth} year={currentYear} onChange={setCurrentPeriod} short />
          </div>

          <div className="flex-1" />

          {/* Notification bell */}
          <button
            className="relative w-10 h-10 rounded-full flex items-center justify-center"
            style={{ color: 'var(--fx-on-surface)' }}
          >
            <Icon name="notifications" size={24} />
            <span
              className="absolute top-2 right-2 w-2 h-2 rounded-full border-2"
              style={{ background: 'var(--fx-primary)', borderColor: 'var(--fx-background)' }}
            />
          </button>

          {/* Avatar */}
          <button
            onClick={() => navigate('/app/perfil')}
            className="w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm ml-1"
            style={{
              background: 'linear-gradient(135deg, var(--fx-tertiary-container), var(--fx-primary-container))',
              color: 'var(--fx-on-primary-container)',
            }}
          >
            {getInitials(user.name)}
          </button>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto" style={{ paddingBottom: 80 }}>
          <Outlet />
        </main>

        {/* Bottom Nav */}
        <nav
          className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full sm:max-w-[440px] z-40 grid"
          style={{
            background: 'var(--fx-surface-container)',
            gridTemplateColumns: 'repeat(5, 1fr)',
            height: 80,
            padding: '8px 4px',
          }}
        >
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/app'}
              className="flex flex-col items-center justify-center gap-1 outline-none"
              style={{ textDecoration: 'none' }}
            >
              {({ isActive }) => (
                <>
                  <div
                    className="flex items-center justify-center rounded-2xl transition-all duration-200"
                    style={{
                      width: item.center ? 72 : 64,
                      height: item.center ? 36 : 32,
                      background: isActive ? 'var(--fx-secondary-container)' : 'transparent',
                      color: isActive ? 'var(--fx-on-secondary-container)' : 'var(--fx-on-surface-variant)',
                    }}
                  >
                    <Icon
                      name={item.icon}
                      size={item.center ? 28 : 24}
                      fill={isActive ? 1 : 0}
                      weight={isActive ? 500 : 400}
                    />
                  </div>
                  <span
                    className="text-[11px] font-medium leading-none"
                    style={{
                      color: isActive ? 'var(--fx-on-secondary-container)' : 'var(--fx-on-surface-variant)',
                      letterSpacing: '0.03em',
                    }}
                  >
                    {item.label}
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
}
