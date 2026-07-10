import React, { createContext, useContext, useRef, useState } from 'react';

const AudioPipelineContext = createContext();

export const useAudioPipeline = () => useContext(AudioPipelineContext);

export const AudioPipelineProvider = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const sourceRef = useRef(null);
  
  // EQ Nodes
  const eqNodesRef = useRef({});
  const [eqGains, setEqGains] = useState({
    60: 0,
    230: 0,
    910: 0,
    3600: 0,
    14000: 0
  });

  const initPipeline = (audioElement) => {
    if (isInitialized || !audioElement || sourceRef.current) return;

    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const ctx = new AudioContext();
    audioCtxRef.current = ctx;

    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.8;
    analyserRef.current = analyser;

    // Create EQ bands
    const bands = [
      { f: 60, type: 'lowshelf' },
      { f: 230, type: 'peaking' },
      { f: 910, type: 'peaking' },
      { f: 3600, type: 'peaking' },
      { f: 14000, type: 'highshelf' }
    ];

    const nodes = {};
    let prevNode = null;

    bands.forEach((band) => {
      const filter = ctx.createBiquadFilter();
      filter.type = band.type;
      filter.frequency.value = band.f;
      filter.gain.value = eqGains[band.f] || 0;
      
      nodes[band.f] = filter;

      if (prevNode) {
        prevNode.connect(filter);
      }
      prevNode = filter;
    });
    
    eqNodesRef.current = nodes;

    try {
      const source = ctx.createMediaElementSource(audioElement);
      sourceRef.current = source;
      
      // Connect Graph: Source -> Analyser -> EQ[0] ... EQ[4] -> Destination
      source.connect(analyser);
      analyser.connect(nodes[60]);
      nodes[14000].connect(ctx.destination);
      
      setIsInitialized(true);
    } catch (err) {
      console.error("Failed to init audio pipeline:", err);
    }
  };

  const updateEqBand = (freq, gain) => {
    setEqGains(prev => ({ ...prev, [freq]: gain }));
    if (eqNodesRef.current[freq]) {
      eqNodesRef.current[freq].gain.value = gain;
    }
  };

  const setPreset = (presetName) => {
    const presets = {
      flat: { 60: 0, 230: 0, 910: 0, 3600: 0, 14000: 0 },
      bassBoost: { 60: 6, 230: 4, 910: 0, 3600: -2, 14000: -4 },
      electronic: { 60: 5, 230: 3, 910: -2, 3600: 4, 14000: 5 },
      acoustic: { 60: -2, 230: 2, 910: 4, 3600: 2, 14000: 1 }
    };
    if (presets[presetName]) {
      Object.keys(presets[presetName]).forEach(freq => {
        updateEqBand(freq, presets[presetName][freq]);
      });
    }
  };

  return (
    <AudioPipelineContext.Provider value={{
      initPipeline,
      isInitialized,
      getAnalyser: () => analyserRef.current,
      eqGains,
      updateEqBand,
      setPreset
    }}>
      {children}
    </AudioPipelineContext.Provider>
  );
};
