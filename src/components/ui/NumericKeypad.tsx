import { useState, useEffect } from 'react';
import { Icon } from './Icon';

function fxBRLSplit(n: number) {
  const [int, dec] = Math.abs(n).toFixed(2).split('.');
  return { int: Number(int).toLocaleString('pt-BR'), dec };
}

export function NumericKeypad({
  open, onClose, value, onChange, onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  value: number;
  onChange: (v: number) => void;
  onConfirm: () => void;
}) {
  const [cents, setCents] = useState(Math.round((value || 0) * 100));
  useEffect(() => { if (open) setCents(Math.round((value || 0) * 100)); }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const update = (c: number) => { setCents(c); onChange(c / 100); };
  const press = (n: number) => update(Math.min(999999999, cents * 10 + n));
  const back  = () => update(Math.floor(cents / 10));
  const clear = () => update(0);

  const split = fxBRLSplit(cents / 100);
  const keys = ['1','2','3','4','5','6','7','8','9','C','0','⌫'];

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.42)',
          zIndex: 54,
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'auto' : 'none',
          transition: 'opacity 200ms',
        }}
      />
      <div
        style={{
          position: 'fixed',
          left: '50%',
          transform: `translateX(-50%) translateY(${open ? '0' : '100%'})`,
          bottom: 0,
          width: '100%', maxWidth: 440,
          background: 'var(--md-sys-color-surface-container-high)',
          color: 'var(--md-sys-color-on-surface)',
          borderRadius: '28px 28px 0 0',
          padding: '12px 16px 20px',
          zIndex: 55,
          transition: 'transform 280ms cubic-bezier(0.2,0,0,1)',
          boxShadow: '0 -16px 40px rgba(0,0,0,0.25)',
        }}
      >
        <div style={{ width: 32, height: 4, borderRadius: 2, background: 'var(--md-sys-color-on-surface-variant)', opacity: 0.4, margin: '4px auto 12px' }} />

        {/* Preview */}
        <div style={{
          textAlign: 'center',
          font: '400 32px/36px var(--md-ref-typeface-brand)',
          color: 'var(--md-sys-color-on-surface)',
          marginBottom: 16,
          fontVariantNumeric: 'tabular-nums',
          letterSpacing: '-0.01em',
        }}>
          <span style={{ fontSize: 16, opacity: 0.6, marginRight: 4 }}>R$</span>
          {split.int},{split.dec}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {keys.map(k => {
            const isAction = k === 'C' || k === '⌫';
            return (
              <button
                key={k}
                onClick={() => k === 'C' ? clear() : k === '⌫' ? back() : press(parseInt(k, 10))}
                style={{
                  height: 56, borderRadius: 18, border: 'none',
                  background: isAction ? 'var(--md-sys-color-surface-container)' : 'var(--md-sys-color-surface-container-highest)',
                  color: isAction ? 'var(--md-sys-color-on-surface-variant)' : 'var(--md-sys-color-on-surface)',
                  font: '500 22px/1 var(--md-ref-typeface-brand)',
                  cursor: 'pointer',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >{k}</button>
            );
          })}
        </div>
        <div style={{ display: 'flex', gap: 12, marginTop: 14 }}>
          <button className="fx-btn flex" onClick={onConfirm}>
            <Icon name="check" size={18} />Pronto
          </button>
        </div>
      </div>
    </>
  );
}
