// @ts-nocheck
'use client';
import { useEffect, useRef } from 'react';

export function SpaceBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Particles
    const particles = Array.from({ length: 80 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - .5) * 0.3,
      vy: (Math.random() - .5) * 0.3,
      r: Math.random() * 1.5 + 0.5,
      a: Math.random() * 0.6 + 0.2,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Move
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;
      });

      // Lines
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(255,255,255,${(1 - dist / 120) * 0.07})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      // Dots
      particles.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${p.a})`;
        ctx.fill();
      });

      animId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <>
      {/* Canvas particles */}
      <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }} />

      {/* Orbs */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        <div className="float" style={{
          position: 'absolute', top: '10%', left: '15%',
          width: 500, height: 500,
          background: 'radial-gradient(circle, rgba(37,99,235,.35), transparent 70%)',
          filter: 'blur(70px)',
          animationDelay: '0s',
        }} />
        <div className="float" style={{
          position: 'absolute', top: '50%', right: '10%',
          width: 400, height: 400,
          background: 'radial-gradient(circle, rgba(56,189,248,.25), transparent 70%)',
          filter: 'blur(70px)',
          animationDelay: '-3s',
        }} />
        <div className="float" style={{
          position: 'absolute', bottom: '10%', left: '40%',
          width: 350, height: 350,
          background: 'radial-gradient(circle, rgba(99,102,241,.2), transparent 70%)',
          filter: 'blur(70px)',
          animationDelay: '-6s',
        }} />
      </div>
    </>
  );
}
