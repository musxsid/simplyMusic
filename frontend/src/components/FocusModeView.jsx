import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Minimize2, Play, Pause, SkipBack, SkipForward } from 'lucide-react';
import { useAudioPipeline } from '../context/AudioPipelineContext';

const FocusModeView = ({ isOpen, onClose, track, isPlaying, ambientColor, onPlayPause, onNext, onPrev }) => {
  const canvasRef = useRef(null);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const { getAnalyser, isInitialized } = useAudioPipeline();

  useEffect(() => {
    if (!isOpen || !isInitialized) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const analyser = getAnalyser();
    if (!analyser) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    let animationId;

    const draw = () => {
      animationId = requestAnimationFrame(draw);

      // Make canvas fullscreen
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      // Initialize particles once
      if (!canvas.particles) {
        canvas.particles = [];
        const numParticles = 1500; // increased for larger circle
        for (let i = 0; i < numParticles; i++) {
          // Uniform distribution within a circle
          const r = Math.sqrt(Math.random());
          canvas.particles.push({
            angle: Math.random() * Math.PI * 2,
            radiusOffset: r, // 0 to 1
            baseSize: Math.random() * 2 + 1, // 1px to 3px
            freqIndex: Math.floor(Math.random() * (bufferLength * 0.5))
          });
        }
      }

      analyser.getByteFrequencyData(dataArray);

      // Check dark mode
      const isDarkMode = document.documentElement.classList.contains('dark');

      // Clear background with theme awareness
      ctx.fillStyle = isDarkMode ? 'rgba(15, 23, 42, 0.6)' : 'rgba(248, 250, 252, 0.6)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      
      // Increased overall size of the circle (50% of the smallest screen dimension)
      const maxRadius = Math.min(canvas.width, canvas.height) * 0.5;  

      // Base app theme color extraction
      let hue = 345; // Default Rose (primary-500)
      let sat = 80;
      let light = 60;
      
      if (ambientColor && ambientColor.startsWith('hsla')) {
        const matches = ambientColor.match(/hsla\((\d+),\s*(\d+)%,\s*(\d+)%/);
        if (matches) {
          hue = parseInt(matches[1]);
          sat = parseInt(matches[2]);
          light = parseInt(matches[3]);
        }
      } else if (ambientColor === 'rgba(244, 63, 94, 0.1)') {
        hue = 350; sat = 89; light = 60; // Approximate for rose-500
      }

      // Global rotation slowly
      const time = Date.now() * 0.0002;

      canvas.particles.forEach((p) => {
        const val = dataArray[p.freqIndex];
        const percent = val / 255;
        
        // Bubbles push outwards slightly
        const pushFactor = percent * (maxRadius * 0.15);
        const dynamicRadius = (maxRadius * p.radiusOffset) + pushFactor;
        
        // Rotate slowly
        const currentAngle = p.angle + time * (p.radiusOffset > 0.5 ? 0.5 : -0.5);

        const x = centerX + Math.cos(currentAngle) * dynamicRadius;
        const y = centerY + Math.sin(currentAngle) * dynamicRadius;

        // Hover interaction (magnetic repulsion)
        const dx = x - mouseRef.current.x;
        const dy = y - mouseRef.current.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        let repulseX = 0;
        let repulseY = 0;
        
        if (dist < 100 && dist > 0) {
          const force = (100 - dist) / 100; // 0 to 1 based on closeness
          const maxRepulsion = 8; // Lowered repulsion as requested
          const angle = Math.atan2(dy, dx); // Angle from mouse to particle
          repulseX = Math.cos(angle) * force * maxRepulsion;
          repulseY = Math.sin(angle) * force * maxRepulsion;
        }

        const finalX = x + repulseX;
        const finalY = y + repulseY;

        // Dot size pulses slightly with music, uniform across the circle
        const dotSize = p.baseSize + (percent * 2);

        // Flat 2D rendering
        ctx.beginPath();
        ctx.arc(finalX, finalY, dotSize, 0, Math.PI * 2);
        
        // Solid color matching theme or dark grey for light mode
        const opacity = Math.min(1, 0.4 + (percent * 0.6));
        if (isDarkMode) {
          ctx.fillStyle = `hsla(${hue}, ${sat}%, ${light + (percent * 20)}%, ${opacity})`;
        } else {
          // Dark grey for light mode bubbles
          ctx.fillStyle = `rgba(71, 85, 105, ${opacity})`; // Slate-600
        }
        
        ctx.shadowBlur = 0; 
        ctx.fill();
      });
    };

    draw();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [isOpen, isInitialized, getAnalyser, isPlaying]);

  if (!isOpen) return null;

  return createPortal(
    <div 
      className="fixed inset-0 z-[500] bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center animate-in fade-in duration-500 overflow-hidden"
      onMouseMove={(e) => { mouseRef.current = { x: e.clientX, y: e.clientY }; }}
      onMouseLeave={() => { mouseRef.current = { x: -1000, y: -1000 }; }}
    >
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
      
      {/* Overlay UI */}
      <div className="absolute top-8 right-8 z-10">
        <button 
          onClick={onClose}
          className="w-12 h-12 bg-slate-200/60 dark:bg-white/10 hover:bg-slate-300/80 dark:hover:bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-slate-600 dark:text-white/70 hover:text-slate-900 dark:hover:text-white transition-all shadow-lg"
        >
          <Minimize2 className="w-6 h-6" />
        </button>
      </div>

      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center">
        <div className="text-center pointer-events-none mb-6">
          <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white mb-1 drop-shadow-md dark:drop-shadow-2xl tracking-tight">
            {track?.title || 'No Track'}
          </h1>
          <p className="text-lg text-slate-600 dark:text-white/70 drop-shadow-sm dark:drop-shadow-lg font-medium">
            {track?.artist || 'Unknown Artist'}
          </p>
        </div>

        {/* Floating Pill Controls */}
        <div className="flex items-center gap-6 bg-slate-200/50 dark:bg-slate-800/50 backdrop-blur-xl border border-slate-300/50 dark:border-slate-700/50 px-8 py-3 rounded-full shadow-2xl">
          <button 
            onClick={onPrev}
            className="text-slate-500 dark:text-white/70 hover:text-slate-900 dark:hover:text-white hover:scale-110 active:scale-95 transition-all"
          >
            <SkipBack className="w-6 h-6 fill-current" />
          </button>
          
          <button 
            onClick={onPlayPause}
            className="w-14 h-14 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-full flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-lg"
          >
            {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-1" />}
          </button>

          <button 
            onClick={onNext}
            className="text-slate-500 dark:text-white/70 hover:text-slate-900 dark:hover:text-white hover:scale-110 active:scale-95 transition-all"
          >
            <SkipForward className="w-6 h-6 fill-current" />
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default FocusModeView;
