import React from 'react';
import { useAudioPipeline } from '../context/AudioPipelineContext';
import { Sliders } from 'lucide-react';

const EQSettings = () => {
  const { isInitialized, eqGains, updateEqBand, setPreset } = useAudioPipeline();

  if (!isInitialized) {
    return (
      <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center h-40 text-slate-500 dark:text-slate-400 text-sm">
        Play a song to enable Equalizer
      </div>
    );
  }

  const bands = [
    { label: '60Hz', key: 60 },
    { label: '230Hz', key: 230 },
    { label: '910Hz', key: 910 },
    { label: '3.6kHz', key: 3600 },
    { label: '14kHz', key: 14000 }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-slate-800 dark:text-slate-100 font-bold">
          <Sliders className="w-5 h-5 text-primary-500" />
          <span>Equalizer</span>
        </div>
        <div className="flex gap-2">
          {['flat', 'bassBoost', 'electronic', 'acoustic'].map((preset) => (
            <button
              key={preset}
              onClick={() => setPreset(preset)}
              className="text-xs font-semibold px-3 py-1.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-primary-100 dark:hover:bg-primary-900/30 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
            >
              {preset.replace(/([A-Z])/g, ' $1').trim().replace(/^\w/, c => c.toUpperCase())}
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-between items-end h-48 px-2">
        {bands.map((band) => (
          <div key={band.key} className="flex flex-col items-center gap-3">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {eqGains[band.key] > 0 ? '+' : ''}{eqGains[band.key]}dB
            </span>
            <input
              type="range"
              min="-12"
              max="12"
              step="1"
              value={eqGains[band.key]}
              onChange={(e) => updateEqBand(band.key, parseFloat(e.target.value))}
              className="w-2 h-32 appearance-none bg-slate-200 dark:bg-slate-700 rounded-full outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-primary-500 [&::-webkit-slider-thumb]:rounded-full cursor-ns-resize"
              style={{ writingMode: 'bt-lr', WebkitAppearance: 'slider-vertical' }}
            />
            <span className="text-xs font-bold text-slate-400">{band.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EQSettings;
