import React, { useEffect, useRef } from 'react';

const Dither = ({
  waveColor = [1, 0, 0.5333333333333333],
  disableAnimation = false,
  enableMouseInteraction = false,
  mouseRadius = 0.5,
  colorNum = 14,
  pixelSize = 1,
  waveAmplitude = 0.2,
  waveFrequency = 1.5,
  waveSpeed = 0.03,
}) => {
  const canvasRef = useRef(null);
  const mousePos = useRef({ x: 0, y: 0 });
  const animationRef = useRef(null);
  const timeRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    let windowWidth = canvas.width;
    let windowHeight = canvas.height;

    const handleMouseMove = (e) => {
      if (enableMouseInteraction && canvas) {
        const rect = canvas.getBoundingClientRect();
        mousePos.current = {
          x: (e.clientX - rect.left) / windowWidth,
          y: (e.clientY - rect.top) / windowHeight,
        };
      }
    };

    const handleResize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      windowWidth = canvas.width;
      windowHeight = canvas.height;
    };

    if (enableMouseInteraction) {
      canvas.addEventListener('mousemove', handleMouseMove);
    }
    window.addEventListener('resize', handleResize);

    // Convert RGB [0-1] to hex
    const rgbToHex = (r, g, b) => {
      const toHex = (x) => {
        const hex = Math.round(x * 255).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
      };
      return '#' + toHex(r) + toHex(g) + toHex(b);
    };

    const baseColor = rgbToHex(...waveColor);

    const animate = () => {
      ctx.fillStyle = '#06080f';
      ctx.fillRect(0, 0, windowWidth, windowHeight);

      const pixelSizeAdjusted = Math.max(1, pixelSize);
      const cols = Math.ceil(windowWidth / pixelSizeAdjusted);
      const rows = Math.ceil(windowHeight / pixelSizeAdjusted);

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const x = col * pixelSizeAdjusted;
          const y = row * pixelSizeAdjusted;

          // Normalize coordinates
          const nx = col / cols;
          const ny = row / rows;

          // Calculate wave
          let wave = Math.sin(ny * waveFrequency + timeRef.current * waveSpeed) * waveAmplitude;
          
          // Add horizontal wave based on x position
          wave += Math.sin(nx * waveFrequency * 0.5 + timeRef.current * waveSpeed * 0.7) * waveAmplitude * 0.5;

          // Distance-based modulation
          let intensity = Math.sin(timeRef.current * waveSpeed + nx * waveFrequency) * 0.5 + 0.5;
          intensity += Math.cos(ny * waveFrequency + timeRef.current * waveSpeed * 0.8) * 0.3;

          // Mouse interaction
          if (enableMouseInteraction) {
            const dx = nx - mousePos.current.x;
            const dy = ny - mousePos.current.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const influence = Math.max(0, 1 - dist / mouseRadius);
            intensity += influence * 0.4;
          }

          // Clamp intensity
          intensity = Math.max(0, Math.min(1, intensity));

          // Dither effect: create stippled pattern
          const colorValue = Math.floor(intensity * (colorNum - 1)) / (colorNum - 1);
          
          // Quantize to dither levels
          const ditherPattern = [
            [0, 8],
            [12, 5],
            [3, 14],
            [11, 6],
          ];

          const patternIndex = (Math.floor(x / pixelSizeAdjusted) + Math.floor(y / pixelSizeAdjusted)) % ditherPattern.length;
          const threshold = ditherPattern[patternIndex][Math.floor(Math.random() * 2)] / 16;

          const shouldDraw = intensity > threshold;

          if (shouldDraw) {
            const alpha = Math.min(1, intensity * 1.2);
            ctx.fillStyle = baseColor;
            ctx.globalAlpha = alpha;
            ctx.fillRect(x, y, pixelSizeAdjusted, pixelSizeAdjusted);
          }
        }
      }

      ctx.globalAlpha = 1;

      if (!disableAnimation) {
        timeRef.current += 1;
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      if (enableMouseInteraction) {
        canvas.removeEventListener('mousemove', handleMouseMove);
      }
      cancelAnimationFrame(animationRef.current);
    };
  }, [waveColor, disableAnimation, enableMouseInteraction, mouseRadius, colorNum, pixelSize, waveAmplitude, waveFrequency, waveSpeed]);

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

export default Dither;
