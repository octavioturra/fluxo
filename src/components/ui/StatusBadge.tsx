import type { MonthStatus, FixedExpenseHealth } from '../../types';
import { getStatusLabel, getFixedHealthLabel } from '../../lib/finance';

const statusBg: Record<MonthStatus, string> = {
  maravilhoso: 'bg-blue-100 text-blue-700',
  bom: 'bg-green-100 text-green-700',
  atencao: 'bg-yellow-100 text-yellow-800',
  alerta: 'bg-red-100 text-red-700',
};

const healthBg: Record<FixedExpenseHealth, string> = {
  recomendado: 'bg-green-100 text-green-700',
  excelente: 'bg-blue-100 text-blue-700',
  alerta: 'bg-yellow-100 text-yellow-800',
  critico: 'bg-red-100 text-red-700',
};

export function StatusBadge({ status }: { status: MonthStatus }) {
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusBg[status]}`}>
      {getStatusLabel(status)}
    </span>
  );
}

export function HealthBadge({ health }: { health: FixedExpenseHealth }) {
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${healthBg[health]}`}>
      {getFixedHealthLabel(health)}
    </span>
  );
}
