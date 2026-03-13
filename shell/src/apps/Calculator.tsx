import { useState, useCallback } from 'react';
import { useThemeStore } from '../store/themeStore';

type Op = '+' | '-' | '*' | '/' | null;

export function Calculator() {
  const colors = useThemeStore((s) => s.colors);
  const [display, setDisplay] = useState('0');
  const [prev, setPrev] = useState<number | null>(null);
  const [op, setOp] = useState<Op>(null);
  const [reset, setReset] = useState(false);
  const [history, setHistory] = useState<string[]>([]);

  const inputDigit = useCallback((d: string) => {
    if (reset) {
      setDisplay(d);
      setReset(false);
    } else {
      setDisplay((v) => (v === '0' && d !== '.' ? d : v.includes('.') && d === '.' ? v : v + d));
    }
  }, [reset]);

  const clear = () => { setDisplay('0'); setPrev(null); setOp(null); setReset(false); };
  const clearEntry = () => { setDisplay('0'); };

  const toggleSign = () => setDisplay((v) => (v === '0' ? v : v.startsWith('-') ? v.slice(1) : '-' + v));
  const percent = () => setDisplay((v) => String(parseFloat(v) / 100));

  const calculate = useCallback((a: number, b: number, operator: Op): number => {
    switch (operator) {
      case '+': return a + b;
      case '-': return a - b;
      case '*': return a * b;
      case '/': return b === 0 ? NaN : a / b;
      default: return b;
    }
  }, []);

  const handleOp = useCallback((nextOp: Op) => {
    const current = parseFloat(display);
    if (prev !== null && op && !reset) {
      const result = calculate(prev, current, op);
      const resultStr = isNaN(result) ? 'Erreur' : String(parseFloat(result.toFixed(10)));
      setDisplay(resultStr);
      setPrev(isNaN(result) ? null : result);
    } else {
      setPrev(current);
    }
    setOp(nextOp);
    setReset(true);
  }, [display, prev, op, reset, calculate]);

  const handleEquals = useCallback(() => {
    if (prev === null || !op) return;
    const current = parseFloat(display);
    const result = calculate(prev, current, op);
    const resultStr = isNaN(result) ? 'Erreur' : String(parseFloat(result.toFixed(10)));
    const opSymbol = op === '*' ? '\u00d7' : op === '/' ? '\u00f7' : op;
    setHistory((h) => [`${prev} ${opSymbol} ${current} = ${resultStr}`, ...h].slice(0, 20));
    setDisplay(resultStr);
    setPrev(null);
    setOp(null);
    setReset(true);
  }, [prev, op, display, calculate]);

  const handleKey = useCallback((e: React.KeyboardEvent) => {
    if (e.key >= '0' && e.key <= '9') inputDigit(e.key);
    else if (e.key === '.') inputDigit('.');
    else if (e.key === '+') handleOp('+');
    else if (e.key === '-') handleOp('-');
    else if (e.key === '*') handleOp('*');
    else if (e.key === '/') { e.preventDefault(); handleOp('/'); }
    else if (e.key === 'Enter' || e.key === '=') handleEquals();
    else if (e.key === 'Escape') clear();
    else if (e.key === 'Backspace') setDisplay((v) => v.length > 1 ? v.slice(0, -1) : '0');
    else if (e.key === '%') percent();
  }, [inputDigit, handleOp, handleEquals]);

  const Btn = ({ label, onClick, span = 1, variant = 'default' }: {
    label: string; onClick: () => void; span?: number;
    variant?: 'default' | 'op' | 'accent' | 'secondary';
  }) => {
    const bg = variant === 'accent' ? colors.accent
      : variant === 'op' ? `${colors.accent}44`
      : variant === 'secondary' ? `${colors.border}`
      : `${colors.surfaceAlt}`;
    const fg = variant === 'accent' ? '#fff'
      : variant === 'op' ? colors.accent
      : colors.textPrimary;
    return (
      <button
        onClick={onClick}
        className="rounded-xl text-base font-medium transition-all active:scale-95 hover:brightness-110"
        style={{
          backgroundColor: bg, color: fg,
          gridColumn: span > 1 ? `span ${span}` : undefined,
          height: 48,
        }}
      >
        {label}
      </button>
    );
  };

  const opLabel = (o: Op) => o === '*' ? '\u00d7' : o === '/' ? '\u00f7' : o ?? '';

  return (
    <div
      className="flex h-full flex-col"
      style={{ backgroundColor: colors.bg, color: colors.textPrimary }}
      tabIndex={0}
      onKeyDown={handleKey}
    >
      {/* History panel */}
      <div className="flex-1 overflow-auto px-4 pt-2" style={{ minHeight: 60, maxHeight: 120 }}>
        {history.length === 0 ? (
          <div className="text-[11px] pt-2" style={{ color: colors.textSecondary }}>Historique vide</div>
        ) : (
          history.map((h, i) => (
            <div key={i} className="text-[11px] text-right truncate" style={{ color: colors.textSecondary }}>{h}</div>
          ))
        )}
      </div>

      {/* Display */}
      <div className="px-4 pb-2">
        {prev !== null && op && (
          <div className="text-right text-xs mb-0.5" style={{ color: colors.textSecondary }}>
            {prev} {opLabel(op)}
          </div>
        )}
        <div
          className="text-right font-mono font-semibold truncate"
          style={{ fontSize: display.length > 12 ? 24 : display.length > 8 ? 32 : 40, color: colors.textPrimary }}
          data-testid="calc-display"
        >
          {display}
        </div>
      </div>

      {/* Buttons */}
      <div className="grid grid-cols-4 gap-1.5 p-3 pt-1">
        <Btn label="C" onClick={clear} variant="secondary" />
        <Btn label="CE" onClick={clearEntry} variant="secondary" />
        <Btn label="%" onClick={percent} variant="secondary" />
        <Btn label={'\u00f7'} onClick={() => handleOp('/')} variant="op" />

        <Btn label="7" onClick={() => inputDigit('7')} />
        <Btn label="8" onClick={() => inputDigit('8')} />
        <Btn label="9" onClick={() => inputDigit('9')} />
        <Btn label={'\u00d7'} onClick={() => handleOp('*')} variant="op" />

        <Btn label="4" onClick={() => inputDigit('4')} />
        <Btn label="5" onClick={() => inputDigit('5')} />
        <Btn label="6" onClick={() => inputDigit('6')} />
        <Btn label="-" onClick={() => handleOp('-')} variant="op" />

        <Btn label="1" onClick={() => inputDigit('1')} />
        <Btn label="2" onClick={() => inputDigit('2')} />
        <Btn label="3" onClick={() => inputDigit('3')} />
        <Btn label="+" onClick={() => handleOp('+')} variant="op" />

        <Btn label={'\u00b1'} onClick={toggleSign} />
        <Btn label="0" onClick={() => inputDigit('0')} />
        <Btn label="." onClick={() => inputDigit('.')} />
        <Btn label="=" onClick={handleEquals} variant="accent" />
      </div>
    </div>
  );
}
