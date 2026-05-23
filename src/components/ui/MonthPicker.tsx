import { ChevronLeft, ChevronRight } from 'lucide-react';

const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const MONTHS_FULL = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

interface MonthPickerProps {
  month: number;
  year: number;
  onChange: (month: number, year: number) => void;
  short?: boolean;
}

export function MonthPicker({ month, year, onChange, short }: MonthPickerProps) {
  const prev = () => {
    if (month === 1) onChange(12, year - 1);
    else onChange(month - 1, year);
  };
  const next = () => {
    if (month === 12) onChange(1, year + 1);
    else onChange(month + 1, year);
  };

  return (
    <div className="flex items-center gap-2">
      <button onClick={prev} className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700">
        <ChevronLeft size={16} className="text-slate-500" />
      </button>
      <span className="font-semibold text-slate-800 dark:text-white min-w-[110px] text-center text-sm">
        {short ? `${MONTHS[month - 1]}/${year}` : `${MONTHS_FULL[month - 1]} ${year}`}
      </span>
      <button onClick={next} className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700">
        <ChevronRight size={16} className="text-slate-500" />
      </button>
    </div>
  );
}

export { MONTHS_FULL };
