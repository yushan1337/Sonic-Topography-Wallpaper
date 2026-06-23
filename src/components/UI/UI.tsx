import React, { useEffect, useRef, useState } from 'react';
import { Palette, SlidersHorizontal, X } from 'lucide-react';
import { engine } from '../../lib/AudioEngine';
import { themes } from '../../lib/themes';
import { extractLyricsFromAudio } from '../../lib/metadata';
import { LyricsDisplay } from './LyricsDisplay';
import type { VisualSettings } from '../../App';

interface UIProps {
  theme: string;
  onThemeChange: (theme: string) => void;
  visualSettings: VisualSettings;
  onVisualSettingsChange: (settings: VisualSettings) => void;
}

function formatTime(time: number) {
  if (Number.isNaN(time)) return '0:00';
  const min = Math.floor(time / 60);
  const sec = Math.floor(time % 60);
  return `${min}:${sec.toString().padStart(2, '0')}`;
}

function parseDemoMetadata(text: string) {
  const firstLine = text.split('\n').find((line) => line.trim()) || '';
  const match = firstLine.match(/^\[\d{2}:\d{2}\.\d{2}\](.+)$/);
  const rawTitle = (match?.[1] || '').trim();
  const [title, artist] = rawTitle.split(' - ');
  return {
    title: title?.trim() || 'Demo Track',
    artist: artist?.trim() || 'Demo',
  };
}

function parseLrcMetadata(text: string) {
  const firstLine = text.split('\n').find((line) => line.trim()) || '';
  const match = firstLine.match(/^\[\d{2}:\d{2}\.\d{2}\](.+)$/);
  const rawTitle = (match?.[1] || '').trim();
  const [title, artist] = rawTitle.split(' - ');
  return {
    title: title?.trim() || 'Track',
    artist: artist?.trim() || 'Demo',
  };
}

export function UI({ theme, onThemeChange, visualSettings, onVisualSettingsChange }: UIProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [trackName, setTrackName] = useState<string>('No track selected');
  const [trackArtist, setTrackArtist] = useState<string>('Demo');
  const [demoTitle, setDemoTitle] = useState<string>('Demo Track');
  const [demoArtist, setDemoArtist] = useState<string>('Demo');
  const [lyricsText, setLyricsText] = useState<string>('');
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [captureDenied, setCaptureDenied] = useState(false);

  useEffect(() => {
    const initEngine = async () => {
      await engine.init();
    };
    initEngine();

    fetch('./Demo Subtitles.lrc')
      .then((response) => (response.ok ? response.text() : ''))
      .then((text) => {
        if (!text) return;
        const meta = parseDemoMetadata(text);
        setDemoTitle(meta.title);
        setDemoArtist(meta.artist);
      })
      .catch(() => {
        setDemoTitle('Demo Track');
        setDemoArtist('Demo');
      });

    const audio = engine.audioElement;
    let progressTimer: ReturnType<typeof setTimeout> | null = null;

    const syncPlaybackState = () => {
      setIsPlaying(audio.paused ? false : true);
      setDuration(audio.duration || 0);
      setVolume(audio.volume);
      setIsCapturing(engine.isCapturing);
    };

    const syncCurrentTime = () => {
      setCurrentTime(audio.currentTime);
    };

    const startProgressLoop = () => {
      if (progressTimer) return;
      const tick = () => {
        syncCurrentTime();
        progressTimer = setTimeout(tick, 250);
      };
      tick();
    };

    const stopProgressLoop = () => {
      if (progressTimer) {
        clearTimeout(progressTimer);
        progressTimer = null;
      }
    };

    const handlePlay = () => {
      syncPlaybackState();
      startProgressLoop();
    };
    const handlePause = () => {
      syncPlaybackState();
      stopProgressLoop();
    };
    const handleLoadedMetadata = syncPlaybackState;
    const handleVolumeChange = syncPlaybackState;
    const handleEnded = () => {
      syncPlaybackState();
      stopProgressLoop();
    };

    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('volumechange', handleVolumeChange);
    audio.addEventListener('ended', handleEnded);

    // Auto-start system audio capture
    const trySystemCapture = () => {
      if (engine.isCapturing) return;
      engine.startSystemCapture();
    };
    // First attempt might fail without user gesture (autoplay policy)
    trySystemCapture();

    // Click to overcome autoplay policy
    const handleAudioStart = () => {
      if (!engine.isCapturing) {
        trySystemCapture();
      }
    };
    window.addEventListener('click', handleAudioStart, { once: false });

    const captureTimer = setInterval(() => {
      setIsCapturing(engine.isCapturing);
      setIsPlaying(engine.isPlaying);
      if (typeof performance !== 'undefined') {
        if (typeof performance.clearMeasures === 'function') {
          performance.clearMeasures();
        }
        if (typeof performance.clearMarks === 'function') {
          performance.clearMarks();
        }
      }
    }, 1000);

    engine.onLyricsUpdate = (lyrics) => {
      if (!lyrics.trackId) return;
      setTrackName(lyrics.title || 'Track');
      setTrackArtist(lyrics.artist || '');
      setDuration(lyrics.duration || 0);
      setCurrentTime(lyrics.currentTime || 0);
      setIsPlaying(lyrics.isPlaying);
      if (lyrics.lrcText) {
        setLyricsText(lyrics.lrcText);
      }
    };

    return () => {
      clearInterval(captureTimer);
      engine.onLyricsUpdate = undefined;
      window.removeEventListener('click', handleAudioStart);
      stopProgressLoop();
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('volumechange', handleVolumeChange);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  const loadDemo = () => {
    const demoAudioUrl = './SoundHelix-Song-1.mp3';
    const demoSubtitleUrl = './Demo Subtitles.lrc';
    engine.init();
    engine.loadUrl(demoAudioUrl);
    fetch(demoSubtitleUrl)
      .then((response) => (response.ok ? response.text() : ''))
      .then((text) => {
        setLyricsText(text || '');
        const meta = parseDemoMetadata(text);
        setTrackName(`${meta.title} - ${meta.artist}`);
        setTrackArtist(meta.artist);
        setDemoTitle(meta.title);
        setDemoArtist(meta.artist);
      })
      .catch(() => {
        setLyricsText('');
        setTrackName(`${demoTitle} - ${demoArtist}`);
        setTrackArtist(demoArtist);
      });
    engine.play();
  };

  const togglePlay = () => {
    engine.init();
    engine.togglePlay();
  };

  const processFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const audioFiles: File[] = [];
    const lrcFiles: File[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type.startsWith('audio/') || file.name.endsWith('.mp3') || file.name.endsWith('.wav') || file.name.endsWith('.flac')) {
        audioFiles.push(file);
      } else if (file.name.endsWith('.lrc')) {
        lrcFiles.push(file);
      }
    }

    const newLyricsMap = new Map<string, string>();
    for (const file of lrcFiles) {
      const text = await file.text();
      newLyricsMap.set(file.name.replace(/\.[^/.]+$/, ''), text);
    }

    if (audioFiles.length > 0) {
      const audioFile = audioFiles[0];
      engine.init();
      engine.loadFile(audioFile);
      engine.play();

      const baseName = audioFile.name.replace(/\.[^/.]+$/, '');
      const matchedLyrics = newLyricsMap.get(baseName);
      if (matchedLyrics) {
        setLyricsText(matchedLyrics);
        const meta = parseLrcMetadata(matchedLyrics);
        setTrackName(meta.title);
        setTrackArtist(meta.artist);
      } else {
        setTrackName(baseName);
        setTrackArtist('Demo');
        setLyricsText('');
        const extractedLyrics = await extractLyricsFromAudio(audioFile);
        if (extractedLyrics) {
          setLyricsText(extractedLyrics);
        }
      }
    } else if (lrcFiles.length > 0) {
      const firstLyrics = newLyricsMap.values().next().value;
      const text = firstLyrics || '';
      setLyricsText(text);
      if (text) {
        const meta = parseLrcMetadata(text);
        setTrackName(meta.title);
        setTrackArtist(meta.artist);
      }
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.code === 'Space') {
        e.preventDefault();
        engine.init();
        engine.togglePlay();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const handleDragOverGlobal = (e: DragEvent) => {
      e.preventDefault();
      setIsDragging(true);
    };

    const handleDragLeaveGlobal = (e: DragEvent) => {
      e.preventDefault();
      if (e.clientX === 0 || e.clientY === 0) {
        setIsDragging(false);
      }
    };

    const handleDropGlobal = (e: DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      processFiles(e.dataTransfer?.files || null);
    };

    window.addEventListener('dragover', handleDragOverGlobal);
    window.addEventListener('dragleave', handleDragLeaveGlobal);
    window.addEventListener('drop', handleDropGlobal);

    return () => {
      window.removeEventListener('dragover', handleDragOverGlobal);
      window.removeEventListener('dragleave', handleDragLeaveGlobal);
      window.removeEventListener('drop', handleDropGlobal);
    };
  }, []);

  const t = themes[theme] || themes.nocturnal;
  const accentHex = `#${t.uRippleColor.getHexString()}`;

  return (
    <div
      className="absolute inset-0 pointer-events-none z-10 flex w-full h-full"
      style={{ fontFamily: "'Helvetica Neue', Arial, sans-serif", color: '#94a3b8' }}
    >
      {isDragging && (
        <div
          className="absolute inset-0 z-[60] backdrop-blur-sm border-2 border-dashed m-4 rounded-xl flex items-center justify-center font-mono text-2xl tracking-widest pointer-events-none"
          style={{ backgroundColor: `${accentHex}1a`, borderColor: accentHex, color: accentHex }}
        >
          DROP AUDIO FILE TO PLAY
        </div>
      )}

      {!isCapturing && !captureDenied && (
        <div className="absolute inset-0 z-[55] flex items-end justify-center pb-12 pointer-events-none">
          <div className="px-8 py-3 rounded-lg bg-black/40 backdrop-blur-sm border border-white/10 text-white/60 text-sm tracking-wider animate-pulse">
            Click anywhere to enable audio visualization
          </div>
        </div>
      )}

      <LyricsDisplay
        lrcText={lyricsText}
        currentTime={currentTime}
        accentHex={accentHex}
        isPlaying={isPlaying || isCapturing}
      />

      <div className="absolute top-[40px] left-[40px] font-black text-[24px] text-white z-50 select-none">
        AETHER.
      </div>

      {/* Close button */}
      <button
        onClick={() => {
          window.open('', '_self', '');
          window.close();
        }}
        className="absolute top-[16px] right-[16px] p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white/50 hover:text-white/80 transition-all z-50 pointer-events-auto"
        title="Close (click twice if needed)"
      >
        <X size={14} />
      </button>

      <div className="absolute top-[40px] right-[40px] w-[320px] p-5 rounded-sm z-50 pointer-events-auto backdrop-blur-[20px] border border-white/10 bg-black/20">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-[15px] font-medium text-white">Visualizer</div>
            <div className="text-[10px] uppercase mt-1 opacity-50">{isCapturing ? 'System audio linked' : 'Click canvas to link audio'}</div>
          </div>
          <SlidersHorizontal size={17} className="text-white/45" />
        </div>

        <div className="mb-5">
          <div className="flex items-center gap-2 text-[10px] uppercase opacity-45 mb-3">
            <Palette size={13} />
            Palette
          </div>
          <div className="grid grid-cols-4 gap-2">
            {Object.entries(themes).map(([key, value]) => (
              <button
                key={key}
                onClick={() => onThemeChange(key)}
                className={`h-8 border transition-all ${theme === key ? 'border-white/70' : 'border-white/10 hover:border-white/35'}`}
                title={value.name}
                style={{
                  background: `linear-gradient(135deg, #${value.uBaseColor2.getHexString()}, #${value.uCoolCore.getHexString()} 48%, #${value.uWarmCore.getHexString()})`,
                  boxShadow: theme === key ? `0 0 18px ${accentHex}66` : 'none',
                }}
              />
            ))}
          </div>
        </div>

        <SettingSlider
          label="Detail"
          value={visualSettings.detail}
          min={120}
          max={220}
          step={20}
          suffix={`${visualSettings.detail} x ${visualSettings.detail}`}
          accentHex={accentHex}
          onChange={(detail) => onVisualSettingsChange({ ...visualSettings, detail })}
        />
        <SettingSlider
          label="Frame Rate"
          value={visualSettings.fps}
          min={24}
          max={60}
          step={12}
          suffix={`${visualSettings.fps} fps`}
          accentHex={accentHex}
          onChange={(fps) => onVisualSettingsChange({ ...visualSettings, fps })}
        />
        <SettingSlider
          label="Wave"
          value={visualSettings.waveStrength}
          min={0.7}
          max={1.8}
          step={0.05}
          suffix={`${visualSettings.waveStrength.toFixed(2)}x`}
          accentHex={accentHex}
          onChange={(waveStrength) => onVisualSettingsChange({ ...visualSettings, waveStrength })}
        />
      </div>

      <div className="absolute bottom-[40px] left-[40px] z-50 pointer-events-none flex flex-col gap-6">
        <StatsPanel accentHex={accentHex} isPlaying={isPlaying || isCapturing} />
      </div>

      <div className="absolute bottom-[40px] right-[40px] text-[10px] uppercase opacity-30 select-none">
        Drag to orbit / Click to pulse
      </div>
    </div>
  );
}

function SettingSlider({
  label,
  value,
  min,
  max,
  step,
  suffix,
  accentHex,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  suffix: string;
  accentHex: string;
  onChange: (value: number) => void;
}) {
  return (
    <label className="block mb-4">
      <div className="flex items-center justify-between text-[10px] uppercase opacity-55 mb-2">
        <span>{label}</span>
        <span>{suffix}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1 bg-white/15 appearance-none cursor-pointer"
        style={{ accentColor: accentHex }}
      />
    </label>
  );
}

function StatsPanel({ accentHex, isPlaying }: { accentHex: string; isPlaying: boolean }) {
  const [data, setData] = useState({ bass: 0, mid: 0, treble: 0, energy: 0 });

  useEffect(() => {
    if (!isPlaying) {
      setData({ bass: 0, mid: 0, treble: 0, energy: 0 });
      return;
    }
    let animationFrameId: number;
    const poll = () => {
      setData(engine.getAudioData());
      animationFrameId = requestAnimationFrame(poll);
    };
    poll();
    return () => cancelAnimationFrame(animationFrameId);
  }, [isPlaying]);

  return (
    <div className="flex gap-10">
      <StatBox label="Bass" value={data.bass} accentHex={accentHex} />
      <StatBox label="Mid" value={data.mid} accentHex={accentHex} />
      <StatBox label="Treble" value={data.treble} accentHex={accentHex} />
      <StatBox label="Energy" value={data.energy} accentHex={accentHex} />
    </div>
  );
}

function StatBox({ label, value, accentHex }: { label: string; value: number; accentHex: string }) {
  const displayValue = (value * 100).toFixed(1);

  return (
    <div className="flex flex-col gap-2">
      <div className="text-[9px] uppercase tracking-[0.15em] opacity-40">{label}</div>
      <div className="font-mono text-[14px]" style={{ color: accentHex }}>
        {displayValue}
      </div>
      <div className="w-[100px] h-[2px] relative bg-white/10">
        <div
          className="absolute h-full transition-all duration-75"
          style={{ backgroundColor: accentHex, width: `${Math.min(100, value * 100)}%`, boxShadow: `0 0 8px ${accentHex}88` }}
        />
      </div>
    </div>
  );
}
