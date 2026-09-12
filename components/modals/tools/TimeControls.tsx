import React, { useState, useEffect, useRef, useCallback } from 'react';

export const TimeKnob = ({ value, max, onChange, label, activeColors, isDark }: any) => {
  const knobRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const calculateValue = useCallback((e: MouseEvent | React.MouseEvent) => {
    if (!knobRef.current) return;
    const rect = knobRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    // Calculate angle in degrees
    const x = e.clientX - centerX;
    const y = e.clientY - centerY;
    let angle = Math.atan2(y, x) * (180 / Math.PI);
    angle = angle + 90; // Offset to make top 0
    if (angle < 0) angle += 360;

    // Map angle to value
    const newValue = Math.round((angle / 360) * max) % max;
    onChange(newValue);
  }, [max, onChange]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    calculateValue(e);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.stopPropagation();
    const direction = e.deltaY < 0 ? 1 : -1;
    let newValue = value + direction;
    if (newValue >= max) newValue = 0;
    if (newValue < 0) newValue = max - 1;
    onChange(newValue);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        e.preventDefault(); 
        calculateValue(e);
      }
    };
    const handleMouseUp = () => setIsDragging(false);

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, calculateValue]);

  const rotation = (value / max) * 360;

  return (
    <div className="flex flex-col items-center gap-1" onWheel={handleWheel}>
      <div 
        ref={knobRef}
        onMouseDown={handleMouseDown}
        className={`w-12 h-12 rounded-full border-2 relative cursor-pointer shadow-lg transition-transform active:scale-95 ${isDark ? 'bg-slate-800 border-slate-600' : 'bg-slate-100 border-slate-300'}`}
        style={{ transform: `rotate(${rotation}deg)` }}
        title="Drag or Scroll to adjust"
      >
        <div className={`absolute top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full ${activeColors.primary} shadow-[0_0_8px_currentColor]`}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-slate-400/20 shadow-inner"></div>
      </div>
      <span className="text-[9px] font-black uppercase tracking-wider opacity-60 select-none">{label}</span>
      <span className={`text-[10px] font-mono font-bold select-none ${isDark ? 'text-white' : 'text-slate-900'}`}>
        {value.toString().padStart(2, '0')}
      </span>
    </div>
  );
};

export const TimeSelector = ({ timeStr, onChange, label, isDark, activeColors }: any) => {
  const parseTime = (t: string) => {
    const parts = t.split(':').map(Number);
    return { h: parts[0] || 0, m: parts[1] || 0, s: parts[2] || 0 };
  };

  const { h, m, s } = parseTime(timeStr);

  const updateTime = (unit: 'h'|'m'|'s', val: number) => {
    let newH = h, newM = m, newS = s;
    if (unit === 'h') newH = val;
    if (unit === 'm') newM = val;
    if (unit === 's') newS = val;
    
    const formatted = `${newH.toString().padStart(2,'0')}:${newM.toString().padStart(2,'0')}:${newS.toString().padStart(2,'0')}`;
    onChange(formatted);
  };

  return (
    <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'} flex flex-col items-center gap-3 w-full`}>
      <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-50">{label}</span>
      <input 
        type="text" 
        value={timeStr} 
        onChange={(e) => onChange(e.target.value)} 
        className={`w-full text-center text-2xl font-mono font-bold bg-transparent outline-none border-b ${isDark ? 'border-slate-600 text-white focus:border-slate-400' : 'border-slate-200 text-slate-800 focus:border-slate-400'} py-2 mb-2`} 
      />
      <div className="flex gap-4 justify-center">
        <TimeKnob value={h} max={24} onChange={(v: number) => updateTime('h', v)} label="HR" isDark={isDark} activeColors={activeColors} />
        <TimeKnob value={m} max={60} onChange={(v: number) => updateTime('m', v)} label="MIN" isDark={isDark} activeColors={activeColors} />
        <TimeKnob value={s} max={60} onChange={(v: number) => updateTime('s', v)} label="SEC" isDark={isDark} activeColors={activeColors} />
      </div>
    </div>
  );
};
