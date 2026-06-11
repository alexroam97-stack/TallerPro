import React, { useEffect, useRef } from 'react';

export default function CanvasMechanicBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    // Initial size fallbacks
    let width = canvas.width = canvas.clientWidth || window.innerWidth;
    let height = canvas.height = canvas.clientHeight || 500;
    
    const teeth1 = 12;
    const innerR1 = 60;
    const outerR1 = 80;
    const depth = 32;

    const teeth2 = 8;
    const innerR2 = 40;
    const outerR2 = 54;

    const drawGear = (centerX, centerY, scaleVal, teeth, innerR, outerR, angleY, angleX) => {
      const vertices = [];
      const edges = [];
      
      for (let f = 0; f < 2; f++) {
        const z = (f === 0 ? -depth / 2 : depth / 2) * scaleVal;
        const offset = f * teeth * 4;
        
        for (let i = 0; i < teeth; i++) {
          const angle = (i / teeth) * Math.PI * 2;
          const nextAngle = ((i + 0.5) / teeth) * Math.PI * 2;
          
          const x1 = Math.cos(angle) * innerR * scaleVal;
          const y1 = Math.sin(angle) * innerR * scaleVal;
          vertices.push({ x: x1, y: y1, z });
          
          const x2 = Math.cos(angle) * outerR * scaleVal;
          const y2 = Math.sin(angle) * outerR * scaleVal;
          vertices.push({ x: x2, y: y2, z });
          
          const x3 = Math.cos(nextAngle) * outerR * scaleVal;
          const y3 = Math.sin(nextAngle) * outerR * scaleVal;
          vertices.push({ x: x3, y: y3, z });
          
          const x4 = Math.cos(nextAngle) * innerR * scaleVal;
          const y4 = Math.sin(nextAngle) * innerR * scaleVal;
          vertices.push({ x: x4, y: y4, z });
          
          const base = offset + i * 4;
          edges.push([base, base + 1]);
          edges.push([base + 1, base + 2]);
          edges.push([base + 2, base + 3]);
          edges.push([base + 3, (base + 4) % (teeth * 4) + offset]);
        }
      }
      
      for (let i = 0; i < teeth * 4; i++) {
        edges.push([i, i + teeth * 4]);
      }

      const projected = vertices.map(v => {
        // Translate in 3D
        let tx = v.x + centerX;
        let ty = v.y + centerY;
        let tz = v.z;
        
        // Rotate Y
        let x1 = tx * Math.cos(angleY) - tz * Math.sin(angleY);
        let z1 = tx * Math.sin(angleY) + tz * Math.cos(angleY);
        
        // Rotate X
        let y2 = ty * Math.cos(angleX) - z1 * Math.sin(angleX);
        let z2 = ty * Math.sin(angleX) + z1 * Math.cos(angleX);
        
        const fov = 400;
        const projScale = fov / (fov + z2);
        const projX = x1 * projScale + width / 2;
        const projY = y2 * projScale + height / 2;
        
        return { x: projX, y: projY };
      });
      
      edges.forEach(edge => {
        const p1 = projected[edge[0]];
        const p2 = projected[edge[1]];
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      });
    };

    let angleX = 0.45;
    let rot1 = 0;
    let rot2 = 0.35; // offset phase to mesh teeth
    
    let speed = 0.08;
    let active = true;

    // Draw frame function to call on demand or loop
    const drawFrame = () => {
      ctx.clearRect(0, 0, width, height);
      
      // Outer neon-glow settings (soft diagnostics feel)
      ctx.shadowBlur = 3;
      ctx.lineWidth = 1;
      
      // Large Gear on Left (Neon Cyan)
      ctx.strokeStyle = 'rgba(0, 242, 255, 0.22)';
      ctx.shadowColor = 'rgba(0, 242, 255, 0.35)';
      drawGear(-130, 20, 1.25, teeth1, innerR1, outerR1, rot1, angleX);
      
      // Small Gear on Right (Neon Orange)
      ctx.strokeStyle = 'rgba(255, 85, 0, 0.18)';
      ctx.shadowColor = 'rgba(255, 85, 0, 0.3)';
      drawGear(110, -30, 0.85, teeth2, innerR2, outerR2, rot2, angleX);
    };

    const render = () => {
      if (!active) return;
      
      drawFrame();
      
      rot1 += speed;
      rot2 -= speed * (teeth1 / teeth2);
      speed *= 0.98;
      
      if (speed < 0.0003) {
        active = false; // Freeze at final position
      } else {
        requestAnimationFrame(render);
      }
    };
    
    render();

    // Use ResizeObserver to reliably monitor layout sizing changes
    const resizeObserver = new ResizeObserver(entries => {
      for (let entry of entries) {
        const { width: w, height: h } = entry.contentRect;
        width = canvas.width = w;
        height = canvas.height = h;
        // Redraw current frame immediately if animation is already frozen
        if (!active) {
          drawFrame();
        }
      }
    });
    
    resizeObserver.observe(canvas);
    
    return () => {
      active = false;
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      className="absolute inset-0 w-full h-full pointer-events-none z-0"
    />
  );
}
