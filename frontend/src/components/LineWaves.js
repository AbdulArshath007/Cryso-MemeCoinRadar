import React, { useEffect, useRef } from 'react';

const LineWaves = ({
  speed = 0.3,
  innerLineCount = 32,
  outerLineCount = 36,
  warpIntensity = 1,
  rotation = -45,
  edgeFadeWidth = 0,
  colorCycleSpeed = 1,
  brightness = 0.2,
  color1 = "#ff00a2",
  color2 = "#e00083",
  color3 = "#ff0095",
  enableMouseInteraction = false,
  mouseInfluence = 2,
}) => {
  const canvasRef = useRef(null);
  const mousePos = useRef({ x: 0, y: 0 });
  const animationRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const maxRadius = Math.min(canvas.width, canvas.height) / 2;

    let time = 0;

    const handleMouseMove = (e) => {
      if (enableMouseInteraction && canvas) {
        const rect = canvas.getBoundingClientRect();
        mousePos.current = {
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        };
      }
    };

    if (enableMouseInteraction) {
      canvas.addEventListener('mousemove', handleMouseMove);
    }

    const animate = () => {
      ctx.fillStyle = '#06080f';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate((rotation * Math.PI) / 180);

      // Draw inner lines
      for (let i = 0; i < innerLineCount; i++) {
        const angle = (i / innerLineCount) * Math.PI * 2;
        const wave = Math.sin(time * speed + i * 0.1) * warpIntensity;

        // Color cycling
        const hue = (time * colorCycleSpeed + i) % 360;
        ctx.strokeStyle = color1;
        ctx.globalAlpha = brightness * (0.5 + 0.5 * Math.sin(time * speed + i));
        ctx.lineWidth = 1;

        ctx.beginPath();
        const startR = maxRadius * 0.2 + wave * 20;
        const endR = maxRadius * 0.5 + wave * 30;
        
        ctx.moveTo(Math.cos(angle) * startR, Math.sin(angle) * startR);
        ctx.lineTo(Math.cos(angle) * endR, Math.sin(angle) * endR);
        ctx.stroke();
      }

      // Draw outer lines
      for (let i = 0; i < outerLineCount; i++) {
        const angle = (i / outerLineCount) * Math.PI * 2;
        const wave = Math.sin(time * speed * 0.8 + i * 0.08) * warpIntensity;

        ctx.strokeStyle = i % 2 === 0 ? color2 : color3;
        ctx.globalAlpha = brightness * (0.4 + 0.6 * Math.sin(time * speed * 0.7 + i));
        ctx.lineWidth = 0.8;

        ctx.beginPath();
        const startR = maxRadius * 0.5 + wave * 25;
        const endR = maxRadius * 0.95 + wave * 40;
        
        ctx.moveTo(Math.cos(angle) * startR, Math.sin(angle) * startR);
        ctx.lineTo(Math.cos(angle) * endR, Math.sin(angle) * endR);
        ctx.stroke();
      }

      // Draw connecting waves
      ctx.strokeStyle = color1;
      ctx.globalAlpha = brightness * 0.3;
      ctx.lineWidth = 1.5;

      ctx.beginPath();
      for (let i = 0; i < innerLineCount; i++) {
        const angle = (i / innerLineCount) * Math.PI * 2;
        const wave = Math.sin(time * speed + i * 0.1) * warpIntensity;
        const radius = maxRadius * 0.35 + wave * 25;

        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.closePath();
      ctx.stroke();

      // Apply mouse interaction if enabled
      if (enableMouseInteraction) {
        const relMouseX = mousePos.current.x - centerX;
        const relMouseY = mousePos.current.y - centerY;
        const distToMouse = Math.sqrt(relMouseX * relMouseX + relMouseY * relMouseY);
        
        if (distToMouse < maxRadius) {
          ctx.strokeStyle = color1;
          ctx.globalAlpha = brightness * (1 - distToMouse / maxRadius) * mouseInfluence * 0.5;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(relMouseX, relMouseY, 50, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      ctx.restore();
      ctx.globalAlpha = 1;

      time += 1;
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (enableMouseInteraction) {
        canvas.removeEventListener('mousemove', handleMouseMove);
      }
      cancelAnimationFrame(animationRef.current);
    };
  }, [speed, innerLineCount, outerLineCount, warpIntensity, rotation, colorCycleSpeed, brightness, color1, color2, color3, enableMouseInteraction, mouseInfluence]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
      }}
    />
  );
};

export default LineWaves;
