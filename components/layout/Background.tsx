
import React, { useEffect, useRef } from 'react';

export const InteractiveDotBackground = ({ isDark = true }: { isDark?: boolean }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let mouse = { x: -1000, y: -1000, targetX: -1000, targetY: -1000 };
    
    const easing = 0.15;
    const connectionDistance = 150;
    const mouseConnectionDistance = 250;

    let particles: { x: number, y: number, vx: number, vy: number, radius: number }[] = [];

    const initParticles = () => {
      particles = [];
      const numParticles = Math.floor((canvas.width * canvas.height) / 12000);
      for (let i = 0; i < numParticles; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 1.5,
          vy: (Math.random() - 0.5) * 1.5,
          radius: Math.random() * 1.5 + 0.5,
        });
      }
    };

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initParticles();
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouse.targetX = e.clientX;
      mouse.targetY = e.clientY;
    };
    
    const handleMouseLeave = () => {
      mouse.targetX = -1000;
      mouse.targetY = -1000;
    };

    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);
    
    resize();
    mouse.x = -1000;
    mouse.y = -1000;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      mouse.x += (mouse.targetX - mouse.x) * easing;
      mouse.y += (mouse.targetY - mouse.y) * easing;

      const colorRGB = isDark ? '255, 255, 255' : '99, 102, 241';
      const dotOpacity = isDark ? 0.6 : 0.8;
      const lineOpacity = isDark ? 0.2 : 0.25;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${colorRGB}, ${dotOpacity})`;
        ctx.fill();

        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const distToMouse = Math.sqrt(dx * dx + dy * dy);
        
        if (distToMouse < mouseConnectionDistance) {
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(mouse.x, mouse.y);
          const opacity = lineOpacity * (1 - distToMouse / mouseConnectionDistance);
          ctx.strokeStyle = `rgba(${colorRGB}, ${opacity * 1.5})`;
          ctx.lineWidth = 1;
          ctx.stroke();

          p.x -= dx * 0.015;
          p.y -= dy * 0.015;
        }

        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx2 = p.x - p2.x;
          const dy2 = p.y - p2.y;
          const dist2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);

          if (dist2 < connectionDistance) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            const opacity = lineOpacity * (1 - dist2 / connectionDistance);
            ctx.strokeStyle = `rgba(${colorRGB}, ${opacity})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isDark]);

  return (
    <div className={`absolute inset-0 pointer-events-none overflow-hidden select-none z-0`}>
      <div className={`absolute inset-0 ${isDark ? 'bg-slate-950' : 'bg-slate-50'}`}></div>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full opacity-100"
      />
    </div>
  );
};


export const SpiderWebBackground = ({ opacity = "opacity-[0.09]", isDark = true }: { opacity?: string, isDark?: boolean }) => (
  <div className={`absolute inset-0 pointer-events-none overflow-hidden select-none z-0`}>
    {/* Video Background */}
    {/* Fallback gradient visible when video fails to load */}
    <div className={`absolute inset-0 ${isDark ? 'bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950' : 'bg-gradient-to-br from-slate-100 via-indigo-50 to-white'}`}></div>
    <video
      autoPlay
      loop
      muted
      playsInline
      className="absolute inset-0 w-full h-full object-cover opacity-100 dark:opacity-100"
      onError={(e) => { e.currentTarget.style.display = 'none'; }}
    >
      <source src="/bg.mp4" type="video/mp4" />
    </video>

    {/* Spider Web SVGs */}
    <div className={`absolute inset-0 ${opacity}`}>
      {/* Top Left - Classic Corner Web */}
    <svg className="absolute -top-16 -left-16 w-[450px] h-[450px] text-slate-900" viewBox="0 0 100 100">
      <circle cx="0" cy="0" r="1.5" fill="currentColor" />
      {[...Array(14)].map((_, i) => (
        <line key={`line-tl-${i}`} x1="0" y1="0" x2={100 * Math.cos(i * Math.PI / 24)} y2={100 * Math.sin(i * Math.PI / 24)} stroke="currentColor" strokeWidth="0.1" />
      ))}
      {[8, 18, 28, 38, 48, 58, 68, 78, 88, 98].map(r => (
        <path key={`ring-tl-${r}`} fill="none" stroke="currentColor" strokeWidth="0.08" d={`M${r},0 Q${r * 0.94},${r * 0.94} 0,${r}`} />
      ))}
    </svg>

    {/* Top Right - Sharp Web Fragment */}
    <svg className="absolute -top-12 -right-12 w-[350px] h-[350px] text-slate-900 rotate-90" viewBox="0 0 100 100">
      {[...Array(12)].map((_, i) => (
        <line key={`line-tr-${i}`} x1="0" y1="0" x2={100 * Math.cos(i * Math.PI / 20)} y2={100 * Math.sin(i * Math.PI / 20)} stroke="currentColor" strokeWidth="0.1" />
      ))}
      {[15, 35, 55, 75, 95].map(r => (
        <path key={`ring-tr-${r}`} fill="none" stroke="currentColor" strokeWidth="0.08" d={`M${r},0 Q${r * 0.91},${r * 0.91} 0,${r}`} />
      ))}
    </svg>

    {/* Bottom Right - Dense Web */}
    <svg className="absolute -bottom-24 -right-24 w-[550px] h-[550px] text-slate-900 rotate-180" viewBox="0 0 100 100">
      {[...Array(18)].map((_, i) => (
        <line key={`line-br-${i}`} x1="0" y1="0" x2={100 * Math.cos(i * Math.PI / 32)} y2={100 * Math.sin(i * Math.PI / 32)} stroke="currentColor" strokeWidth="0.1" />
      ))}
      {[10, 25, 40, 55, 70, 85, 100].map(r => (
        <path key={`ring-br-${r}`} fill="none" stroke="currentColor" strokeWidth="0.08" d={`M${r},0 Q${r * 0.88},${r * 0.88} 0,${r}`} />
      ))}
    </svg>

    {/* Bottom Left - Delicate Hanging Web */}
    <svg className="absolute -bottom-10 -left-10 w-[300px] h-[300px] text-slate-900 -rotate-90" viewBox="0 0 100 100">
      {[...Array(10)].map((_, i) => (
        <line key={`line-bl-${i}`} x1="0" y1="0" x2={100 * Math.cos(i * Math.PI / 18)} y2={100 * Math.sin(i * Math.PI / 18)} stroke="currentColor" strokeWidth="0.1" />
      ))}
      {[20, 45, 70, 95].map(r => (
        <path key={`ring-bl-${r}`} fill="none" stroke="currentColor" strokeWidth="0.08" d={`M${r},0 Q${r * 0.9},${r * 0.9} 0,${r}`} />
      ))}
    </svg>

    {/* Center Left - Floating Fragment */}
    <svg className="absolute top-1/2 -left-20 w-[250px] h-[250px] text-slate-900 -translate-y-1/2 opacity-50" viewBox="0 0 100 100">
      {[...Array(8)].map((_, i) => (
        <line key={`line-cl-${i}`} x1="0" y1="50" x2={100} y2={50 + (i - 4) * 15} stroke="currentColor" strokeWidth="0.08" />
      ))}
      {[30, 60, 90].map(r => (
        <path key={`ring-cl-${r}`} fill="none" stroke="currentColor" strokeWidth="0.06" d={`M${r},20 Q${r+10},50 ${r},80`} />
      ))}
    </svg>

    {/* Center Right - Floating Fragment */}
    <svg className="absolute top-1/4 -right-16 w-[280px] h-[280px] text-slate-900 opacity-40 rotate-12" viewBox="0 0 100 100">
      {[...Array(7)].map((_, i) => (
        <line key={`line-cr-${i}`} x1="100" y1="50" x2={0} y2={50 + (i - 3) * 20} stroke="currentColor" strokeWidth="0.08" />
      ))}
      {[25, 55, 85].map(r => (
        <path key={`ring-cr-${r}`} fill="none" stroke="currentColor" strokeWidth="0.06" d={`M${100-r},25 Q${90-r},50 ${100-r},75`} />
      ))}
    </svg>

    {/* Top Middle - Faint Connector */}
    <svg className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[150px] text-slate-900 opacity-20" viewBox="0 0 1000 100" preserveAspectRatio="none">
      <path d="M0,0 Q250,80 500,20 T1000,0" fill="none" stroke="currentColor" strokeWidth="0.05" />
      <path d="M0,10 Q300,60 600,40 T1000,10" fill="none" stroke="currentColor" strokeWidth="0.05" />
    </svg>
    </div>
  </div>
);
