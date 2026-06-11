import React, { useEffect, useRef } from 'react';

export default function CanvasMechanicBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    let width = canvas.width = canvas.clientWidth || window.innerWidth;
    let height = canvas.height = canvas.clientHeight || 500;
    
    // Mouse tracking variables
    let mouseX = -1000;
    let mouseY = -1000;
    let lastMouseX = null;
    let lastMouseY = null;
    let vx = 0;
    let vy = 0;
    let lastTime = Date.now();
    
    const teeth1 = 12;
    const innerR1 = 60;
    const outerR1 = 80;
    const depth = 32;

    const teeth2 = 8;
    const innerR2 = 40;
    const outerR2 = 54;

    let angleX = 0.45;
    let rot1 = 0;
    let rot2 = 0.35;
    
    let speed = 0.08;
    let active = true;

    // Apply interactive torque to gears based on mouse velocity
    const applyGearInteractions = () => {
      // Gear centers mapped to screen coordinates
      const gear1X = width / 2 - 130;
      const gear1Y = height / 2 + 20;
      
      const gear2X = width / 2 + 110;
      const gear2Y = height / 2 - 30;
      
      // Compute distance from cursor to Gear 1
      const dx1 = mouseX - gear1X;
      const dy1 = mouseY - gear1Y;
      const dist1 = Math.sqrt(dx1 * dx1 + dy1 * dy1);
      
      // Compute distance from cursor to Gear 2
      const dx2 = mouseX - gear2X;
      const dy2 = mouseY - gear2Y;
      const dist2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);
      
      let torque = 0;
      
      // Gear 1 (large, left) interaction
      if (dist1 < 180 && dist1 > 10) {
        const tangentX = -dy1 / dist1;
        const tangentY = dx1 / dist1;
        const dot = vx * tangentX + vy * tangentY;
        const influence = (1 - dist1 / 180);
        torque += dot * influence * 0.0025;
      }
      
      // Gear 2 (small, right) interaction
      if (dist2 < 140 && dist2 > 10) {
        const tangentX = -dy2 / dist2;
        const tangentY = dx2 / dist2;
        const dot = vx * tangentX + vy * tangentY;
        const influence = (1 - dist2 / 140);
        // Gear 2 has opposite spin direction, scaling torque by gear ratio (teeth2 / teeth1)
        torque -= dot * influence * 0.0025 * (teeth2 / teeth1);
      }
      
      if (Math.abs(torque) > 0.00005) {
        speed += torque;
        const maxSpeed = 0.15;
        if (speed > maxSpeed) speed = maxSpeed;
        if (speed < -maxSpeed) speed = -maxSpeed;
        
        if (!active) {
          active = true;
          render();
        }
      }
    };

    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      const currentMouseX = e.clientX - rect.left;
      const currentMouseY = e.clientY - rect.top;
      
      const now = Date.now();
      const dt = now - lastTime;
      lastTime = now;
      
      if (dt > 120) {
        // Long pause or window focus switch: reset velocity to avoid wild jumps
        vx = 0;
        vy = 0;
      } else if (lastMouseX !== null && lastMouseY !== null) {
        vx = currentMouseX - lastMouseX;
        vy = currentMouseY - lastMouseY;
      }
      
      mouseX = currentMouseX;
      mouseY = currentMouseY;
      lastMouseX = currentMouseX;
      lastMouseY = currentMouseY;
      
      applyGearInteractions();
      
      // Trigger a single redraw if the rotation is currently frozen
      if (!active) {
        drawFrame();
      }
    };

    const handleResize = () => {
      if (canvas) {
        width = canvas.width = canvas.clientWidth || window.innerWidth;
        height = canvas.height = canvas.clientHeight || 500;
        if (!active) {
          drawFrame();
        }
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('resize', handleResize);

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

    const drawFrame = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.lineWidth = 1;
      
      // 1. Draw blueprint grid lines illuminated by the mouse
      const gridGrad = ctx.createRadialGradient(mouseX, mouseY, 0, mouseX, mouseY, 280);
      gridGrad.addColorStop(0, 'rgba(0, 242, 255, 0.15)');
      gridGrad.addColorStop(0.5, 'rgba(0, 242, 255, 0.04)');
      gridGrad.addColorStop(1, 'rgba(0, 242, 255, 0)');
      
      ctx.strokeStyle = gridGrad;
      
      const gridSpacing = 30;
      for (let x = 0; x < width; x += gridSpacing) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSpacing) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // 1b. Draw technical blueprint crosshairs ('+') at intersections close to the mouse
      if (mouseX > -500 && mouseY > -500) {
        ctx.save();
        const startX = Math.max(0, Math.floor((mouseX - 200) / gridSpacing) * gridSpacing);
        const endX = Math.min(width, Math.ceil((mouseX + 200) / gridSpacing) * gridSpacing);
        const startY = Math.max(0, Math.floor((mouseY - 200) / gridSpacing) * gridSpacing);
        const endY = Math.min(height, Math.ceil((mouseY + 200) / gridSpacing) * gridSpacing);
        
        for (let x = startX; x <= endX; x += gridSpacing) {
          for (let y = startY; y <= endY; y += gridSpacing) {
            const dx = x - mouseX;
            const dy = y - mouseY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 200) {
              const alpha = Math.max(0, 1 - dist / 200) ** 1.5 * 0.35;
              ctx.strokeStyle = `rgba(0, 242, 255, ${alpha})`;
              ctx.lineWidth = 1;
              ctx.beginPath();
              // Horizontal tick
              ctx.moveTo(x - 2, y);
              ctx.lineTo(x + 2, y);
              // Vertical tick
              ctx.moveTo(x, y - 2);
              ctx.lineTo(x, y + 2);
              ctx.stroke();
            }
          }
        }
        ctx.restore();
      }

      // 1c. Draw snapping CAD reticle showing snapped coordinate telemetry
      if (mouseX > 0 && mouseY > 0 && mouseX < width && mouseY < height) {
        const snappedX = Math.round(mouseX / gridSpacing) * gridSpacing;
        const snappedY = Math.round(mouseY / gridSpacing) * gridSpacing;
        const distToSnap = Math.sqrt((mouseX - snappedX) ** 2 + (mouseY - snappedY) ** 2);
        const snapAlpha = Math.max(0, 1 - distToSnap / 80) * 0.45;
        
        if (snapAlpha > 0) {
          ctx.save();
          ctx.strokeStyle = `rgba(0, 242, 255, ${snapAlpha})`;
          ctx.fillStyle = `rgba(0, 242, 255, ${snapAlpha * 0.15})`;
          ctx.lineWidth = 1;
          
          // Snapping circle with subtle shadow glow
          ctx.shadowBlur = 4;
          ctx.shadowColor = 'rgba(0, 242, 255, 0.4)';
          ctx.beginPath();
          ctx.arc(snappedX, snappedY, 6, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          
          // Crosshair ticks
          ctx.beginPath();
          ctx.moveTo(snappedX - 15, snappedY);
          ctx.lineTo(snappedX + 15, snappedY);
          ctx.moveTo(snappedX, snappedY - 15);
          ctx.lineTo(snappedX, snappedY + 15);
          ctx.stroke();
          
          // SNAPPED telemetry label
          ctx.shadowBlur = 0;
          ctx.fillStyle = `rgba(0, 242, 255, ${snapAlpha * 1.5})`;
          ctx.font = '8px monospace';
          ctx.fillText(`X:${snappedX} Y:${snappedY}`, snappedX + 10, snappedY - 10);
          
          ctx.restore();
        }
      }

      // 2. Draw gears - PASS 1 (Ambient faint outlines)
      ctx.shadowBlur = 0;
      ctx.strokeStyle = 'rgba(0, 242, 255, 0.02)';
      drawGear(-130, 20, 1.25, teeth1, innerR1, outerR1, rot1, angleX);
      ctx.strokeStyle = 'rgba(255, 85, 0, 0.015)';
      drawGear(110, -30, 0.85, teeth2, innerR2, outerR2, rot2, angleX);

      // 3. Draw gears - PASS 2 (Neon glow highlight centered at the mouse)
      const gear1Grad = ctx.createRadialGradient(mouseX, mouseY, 0, mouseX, mouseY, 200);
      gear1Grad.addColorStop(0, 'rgba(0, 242, 255, 0.38)');
      gear1Grad.addColorStop(0.5, 'rgba(0, 242, 255, 0.12)');
      gear1Grad.addColorStop(1, 'rgba(0, 242, 255, 0.02)');
      
      ctx.shadowBlur = 3;
      ctx.strokeStyle = gear1Grad;
      ctx.shadowColor = 'rgba(0, 242, 255, 0.35)';
      drawGear(-130, 20, 1.25, teeth1, innerR1, outerR1, rot1, angleX);

      const gear2Grad = ctx.createRadialGradient(mouseX, mouseY, 0, mouseX, mouseY, 200);
      gear2Grad.addColorStop(0, 'rgba(255, 85, 0, 0.3)');
      gear2Grad.addColorStop(0.5, 'rgba(255, 85, 0, 0.1)');
      gear2Grad.addColorStop(1, 'rgba(255, 85, 0, 0.015)');
      
      ctx.strokeStyle = gear2Grad;
      ctx.shadowColor = 'rgba(255, 85, 0, 0.3)';
      drawGear(110, -30, 0.85, teeth2, innerR2, outerR2, rot2, angleX);
    };

    const render = () => {
      if (!active) return;
      
      drawFrame();
      
      rot1 += speed;
      rot2 -= speed * (teeth1 / teeth2);
      speed *= 0.98;
      
      // Decay velocity over time to avoid carry-over when mouse stops
      vx *= 0.8;
      vy *= 0.8;
      
      if (Math.abs(speed) < 0.0003) {
        active = false; // Freeze rotation, but cursor highlighting remains active
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
        if (!active) {
          drawFrame();
        }
      }
    });
    
    resizeObserver.observe(canvas);
    
    return () => {
      active = false;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
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
