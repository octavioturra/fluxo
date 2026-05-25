import { useEffect } from 'react';
import { useApp } from '../context/AppContext';

export function useDarkMode() {
  const { user, updateUser } = useApp();
  const isDark = !!user.darkMode;

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  const toggle = (v: boolean) => updateUser({ darkMode: v });

  return { isDark, toggle };
}
