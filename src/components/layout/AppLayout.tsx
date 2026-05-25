import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { useDarkMode } from '../../hooks/useDarkMode';
import { Icon } from '../ui/Icon';

const MONTHS_FULL = [
  'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro',
];

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

const NAV_ITEMS = [
  { to: '/app/entradas',  icon: 'account_balance_wallet', label: 'Entradas' },
  { to: '/app/fixos',     icon: 'autorenew',              label: 'Fixos' },
  { to: '/app',           icon: 'home',                   label: 'Resumo',   center: true },
  { to: '/app/diario',    icon: 'edit_note',              label: 'Diário' },
  { to: '/app/economias', icon: 'trending_up',            label: 'Economias' },
];

export function AppLayout() {
  const navigate = useNavigate();
  const { currentMonth, currentYear, setCurrentPeriod, user } = useApp();
  useDarkMode();

  const monthLabel = `${MONTHS_FULL[currentMonth - 1]} ${currentYear}`;

  const prev = () => {
    if (currentMonth === 1) setCurrentPeriod(12, currentYear - 1);
    else setCurrentPeriod(currentMonth - 1, currentYear);
  };
  const next = () => {
    if (currentMonth === 12) setCurrentPeriod(1, currentYear + 1);
    else setCurrentPeriod(currentMonth + 1, currentYear);
  };

  return (
    <div
      style={{
        minHeight: '100svh',
        display: 'flex',
        justifyContent: 'center',
        background: 'var(--md-sys-color-surface-container-low)',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100svh',
          width: '100%',
          maxWidth: 440,
          position: 'relative',
          background: 'var(--md-sys-color-background)',
        }}
      >
        {/* Top App Bar */}
        <div className="fx-appbar" style={{ position: 'sticky', top: 0, zIndex: 40 }}>
          <div className="logo">
            <span className="mark">F</span>
            <span>Fluxo</span>
          </div>

          <div className="fx-month-picker">
            <button className="arrow" onClick={prev} aria-label="Mês anterior">
              <Icon name="chevron_left" />
            </button>
            <span className="label">{monthLabel}</span>
            <button className="arrow" onClick={next} aria-label="Próximo mês">
              <Icon name="chevron_right" />
            </button>
          </div>

          <div className="spacer" />

          <button className="fx-icon-btn has-dot" aria-label="Notificações">
            <Icon name="notifications" />
          </button>
          <button
            className="fx-avatar"
            aria-label="Perfil"
            onClick={() => navigate('/app/perfil')}
          >
            {getInitials(user.name)}
          </button>
        </div>

        {/* Page content */}
        <main className="fx-body">
          <Outlet />
        </main>

        {/* Bottom Navigation */}
        <div
          className="fx-bottomnav"
          style={{
            position: 'fixed',
            bottom: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            width: '100%',
            maxWidth: 440,
            zIndex: 40,
          }}
        >
          {NAV_ITEMS.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/app'}
              style={{ textDecoration: 'none', display: 'contents' }}
            >
              {({ isActive }) => (
                <button
                  className={[
                    'nav-item',
                    isActive ? 'active' : '',
                    item.center ? 'center' : '',
                  ].filter(Boolean).join(' ')}
                >
                  <div className="indicator">
                    <Icon
                      name={item.icon}
                      fill={isActive ? 1 : 0}
                      weight={isActive ? 500 : 400}
                    />
                  </div>
                  <span className="lbl">{item.label}</span>
                </button>
              )}
            </NavLink>
          ))}
        </div>
      </div>
    </div>
  );
}
