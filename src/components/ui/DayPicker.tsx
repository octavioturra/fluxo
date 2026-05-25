export function DayPicker({
  open, onClose, value, onPick, year, month,
}: {
  open: boolean;
  onClose: () => void;
  value: number;
  onPick: (day: number) => void;
  year: number;
  month: number;
}) {
  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDow = new Date(year, month - 1, 1).getDay(); // 0=sun

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const MONTHS_PT = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.42)',
          zIndex: 56,
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'auto' : 'none',
          transition: 'opacity 200ms',
        }}
      />
      <div
        style={{
          position: 'fixed',
          left: '50%',
          top: '50%',
          transform: `translateX(-50%) translateY(-50%) scale(${open ? 1 : 0.9})`,
          width: 'calc(100% - 48px)', maxWidth: 360,
          background: 'var(--md-sys-color-surface-container-high)',
          color: 'var(--md-sys-color-on-surface)',
          borderRadius: 24,
          padding: 20,
          zIndex: 57,
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'auto' : 'none',
          transition: 'opacity 200ms, transform 220ms cubic-bezier(0.2,0,0,1)',
          boxShadow: '0 24px 60px rgba(0,0,0,0.35)',
        }}
      >
        <div style={{ font: '500 11px/14px var(--md-ref-typeface-plain)', letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--md-sys-color-on-surface-variant)' }}>
          Selecionar dia
        </div>
        <div style={{ font: '400 22px/28px var(--md-ref-typeface-brand)', color: 'var(--md-sys-color-on-surface)', marginTop: 4, marginBottom: 16 }}>
          {MONTHS_PT[month - 1]} {year}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 6 }}>
          {['D','S','T','Q','Q','S','S'].map((d, i) => (
            <div key={i} style={{ textAlign: 'center', font: '500 11px/14px var(--md-ref-typeface-plain)', color: 'var(--md-sys-color-on-surface-variant)', padding: 4 }}>{d}</div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
          {cells.map((d, i) => {
            if (d == null) return <div key={`e${i}`} />;
            const isSel = d === value;
            return (
              <button
                key={d}
                onClick={() => onPick(d)}
                style={{
                  height: 36, borderRadius: 999, border: 'none',
                  background: isSel ? 'var(--md-sys-color-primary)' : 'transparent',
                  color: isSel ? 'var(--md-sys-color-on-primary)' : 'var(--md-sys-color-on-surface)',
                  font: `${isSel ? 600 : 400} 14px/1 var(--md-ref-typeface-plain)`,
                  cursor: 'pointer',
                  fontVariantNumeric: 'tabular-nums',
                  transition: 'background 120ms',
                }}
              >{d}</button>
            );
          })}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
          <button className="fx-btn text" onClick={onClose}>Cancelar</button>
        </div>
      </div>
    </>
  );
}
