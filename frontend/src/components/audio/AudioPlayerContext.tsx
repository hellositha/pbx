'use client';

import React, { createContext, useContext, useState, useRef, useEffect, useCallback, ReactNode } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  X,
  Download,
  AlertCircle,
  Radio,
  Music,
  Layers,
  Voicemail,
  FileAudio,
} from 'lucide-react';

export interface AudioTrack {
  id: string;
  title: string;
  subtitle?: string;
  streamUrl: string;
  category?: 'IVR_PROMPT' | 'MOH' | 'QUEUE_ANNOUNCEMENT' | 'VOICEMAIL_GREETING' | 'GENERAL' | 'RECORDING';
}

interface AudioPlayerContextType {
  currentTrack: AudioTrack | null;
  isPlaying: boolean;
  isLoading: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  playbackRate: number;
  error: string | null;
  playTrack: (track: AudioTrack) => void;
  pauseTrack: () => void;
  resumeTrack: () => void;
  toggleTrack: (track: AudioTrack) => void;
  stopTrack: () => void;
  seekTo: (seconds: number) => void;
  seekRelative: (deltaSeconds: number) => void;
  setVolume: (val: number) => void;
  toggleMute: () => void;
  setPlaybackRate: (rate: number) => void;
  isCurrentTrack: (id: string) => boolean;
  isCurrentPlaying: (id: string) => boolean;
}

const AudioPlayerContext = createContext<AudioPlayerContextType | undefined>(undefined);

export function AudioPlayerProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [currentTrack, setCurrentTrack] = useState<AudioTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRateState] = useState(1);
  const [error, setError] = useState<string | null>(null);

  // Synchronize audio element settings
  const playTrack = useCallback((track: AudioTrack) => {
    setError(null);
    setCurrentTrack(track);
    setIsLoading(true);

    if (audioRef.current) {
      audioRef.current.src = track.streamUrl;
      audioRef.current.currentTime = 0;
      audioRef.current.playbackRate = playbackRate;
      audioRef.current.volume = isMuted ? 0 : volume;
      audioRef.current.load();

      const promise = audioRef.current.play();
      if (promise !== undefined) {
        promise
          .then(() => {
            setIsPlaying(true);
            setIsLoading(false);
          })
          .catch((err) => {
            console.warn('Audio play() error:', err);
            setError('Playback blocked by browser or format unsupported. Click Play to retry.');
            setIsPlaying(false);
            setIsLoading(false);
          });
      }
    }
  }, [playbackRate, isMuted, volume]);

  const pauseTrack = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setIsPlaying(false);
  }, []);

  const resumeTrack = useCallback(() => {
    if (audioRef.current) {
      setError(null);
      const promise = audioRef.current.play();
      if (promise !== undefined) {
        promise
          .then(() => setIsPlaying(true))
          .catch((err) => {
            setError('Failed to resume audio playback.');
            setIsPlaying(false);
          });
      }
    }
  }, []);

  const toggleTrack = useCallback((track: AudioTrack) => {
    if (currentTrack?.id === track.id) {
      if (isPlaying) {
        pauseTrack();
      } else {
        resumeTrack();
      }
    } else {
      playTrack(track);
    }
  }, [currentTrack, isPlaying, pauseTrack, resumeTrack, playTrack]);

  const stopTrack = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.src = '';
    }
    setCurrentTrack(null);
    setIsPlaying(false);
    setIsLoading(false);
    setCurrentTime(0);
    setDuration(0);
    setError(null);
  }, []);

  const seekTo = useCallback((seconds: number) => {
    if (audioRef.current) {
      const target = Math.max(0, Math.min(seconds, audioRef.current.duration || seconds));
      audioRef.current.currentTime = target;
      setCurrentTime(target);
    }
  }, []);

  const seekRelative = useCallback((delta: number) => {
    if (audioRef.current) {
      const target = Math.max(0, Math.min((audioRef.current.currentTime || 0) + delta, audioRef.current.duration || 99999));
      audioRef.current.currentTime = target;
      setCurrentTime(target);
    }
  }, []);

  const setVolume = useCallback((val: number) => {
    const clamped = Math.max(0, Math.min(1, val));
    setVolumeState(clamped);
    if (audioRef.current) {
      audioRef.current.volume = clamped;
      if (clamped > 0 && isMuted) {
        setIsMuted(false);
      }
    }
  }, [isMuted]);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      if (audioRef.current) {
        audioRef.current.muted = next;
      }
      return next;
    });
  }, []);

  const setPlaybackRate = useCallback((rate: number) => {
    setPlaybackRateState(rate);
    if (audioRef.current) {
      audioRef.current.playbackRate = rate;
    }
  }, []);

  const isCurrentTrack = useCallback((id: string) => {
    return currentTrack?.id === id;
  }, [currentTrack]);

  const isCurrentPlaying = useCallback((id: string) => {
    return currentTrack?.id === id && isPlaying;
  }, [currentTrack, isPlaying]);

  // Audio element event bindings
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
    };
    const onDurationChange = () => {
      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
    };
    const onWaiting = () => setIsLoading(true);
    const onPlaying = () => {
      setIsLoading(false);
      setIsPlaying(true);
      setError(null);
    };
    const onPause = () => setIsPlaying(false);
    const onEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };
    const onError = () => {
      const mediaErr = audio.error;
      let msg = 'Failed to load audio stream';
      if (mediaErr) {
        if (mediaErr.code === 1) msg = 'Audio playback aborted';
        else if (mediaErr.code === 2) msg = 'Network error fetching stream';
        else if (mediaErr.code === 3) msg = 'Audio decode error';
        else if (mediaErr.code === 4) msg = 'Audio file format not supported or not found';
      }
      setError(msg);
      setIsLoading(false);
      setIsPlaying(false);
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('durationchange', onDurationChange);
    audio.addEventListener('waiting', onWaiting);
    audio.addEventListener('playing', onPlaying);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('error', onError);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('durationchange', onDurationChange);
      audio.removeEventListener('waiting', onWaiting);
      audio.removeEventListener('playing', onPlaying);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('error', onError);
    };
  }, []);

  return (
    <AudioPlayerContext.Provider
      value={{
        currentTrack,
        isPlaying,
        isLoading,
        currentTime,
        duration,
        volume,
        isMuted,
        playbackRate,
        error,
        playTrack,
        pauseTrack,
        resumeTrack,
        toggleTrack,
        stopTrack,
        seekTo,
        seekRelative,
        setVolume,
        toggleMute,
        setPlaybackRate,
        isCurrentTrack,
        isCurrentPlaying,
      }}
    >
      {/* Hidden native audio element */}
      <audio ref={audioRef} preload="auto" />

      {children}

      {/* Floating Global Audio Player Dock */}
      {currentTrack && (
        <GlobalAudioPlayerDock
          track={currentTrack}
          isPlaying={isPlaying}
          isLoading={isLoading}
          currentTime={currentTime}
          duration={duration}
          volume={volume}
          isMuted={isMuted}
          playbackRate={playbackRate}
          error={error}
          onTogglePlay={() => (isPlaying ? pauseTrack() : resumeTrack())}
          onSeek={seekTo}
          onSeekRelative={seekRelative}
          onSetVolume={setVolume}
          onToggleMute={toggleMute}
          onSetPlaybackRate={setPlaybackRate}
          onClose={stopTrack}
        />
      )}
    </AudioPlayerContext.Provider>
  );
}

export function useAudioPlayer() {
  const context = useContext(AudioPlayerContext);
  if (!context) {
    throw new Error('useAudioPlayer must be used within an AudioPlayerProvider');
  }
  return context;
}

// Global Floating Audio Dock Component
interface GlobalDockProps {
  track: AudioTrack;
  isPlaying: boolean;
  isLoading: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  playbackRate: number;
  error: string | null;
  onTogglePlay: () => void;
  onSeek: (seconds: number) => void;
  onSeekRelative: (delta: number) => void;
  onSetVolume: (val: number) => void;
  onToggleMute: () => void;
  onSetPlaybackRate: (rate: number) => void;
  onClose: () => void;
}

function GlobalAudioPlayerDock({
  track,
  isPlaying,
  isLoading,
  currentTime,
  duration,
  volume,
  isMuted,
  playbackRate,
  error,
  onTogglePlay,
  onSeek,
  onSeekRelative,
  onSetVolume,
  onToggleMute,
  onSetPlaybackRate,
  onClose,
}: GlobalDockProps) {
  const formatTime = (secs: number) => {
    if (isNaN(secs) || !isFinite(secs)) return '00:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  const getCategoryIcon = () => {
    switch (track.category) {
      case 'IVR_PROMPT':
        return <Radio className="w-4 h-4 text-sky-400" />;
      case 'MOH':
        return <Music className="w-4 h-4 text-purple-400" />;
      case 'QUEUE_ANNOUNCEMENT':
        return <Layers className="w-4 h-4 text-amber-400" />;
      case 'VOICEMAIL_GREETING':
        return <Voicemail className="w-4 h-4 text-indigo-400" />;
      case 'RECORDING':
        return <FileAudio className="w-4 h-4 text-emerald-400" />;
      default:
        return <Volume2 className="w-4 h-4 text-sky-400" />;
    }
  };

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-4xl animate-in slide-in-from-bottom-5 duration-200">
      <div className="bg-slate-900/95 backdrop-blur-md text-white border border-slate-700/80 rounded-2xl shadow-2xl p-3 sm:p-4 transition-all">
        {/* Error message banner if any */}
        {error && (
          <div className="mb-2 p-2 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={onTogglePlay}
              className="text-[11px] underline font-bold hover:text-white"
            >
              Retry
            </button>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
          {/* Track Info & Equalizer */}
          <div className="flex items-center gap-3 w-full sm:w-1/3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
              {getCategoryIcon()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-white truncate flex items-center gap-1.5">
                <span className="truncate">{track.title}</span>
                {isPlaying && (
                  <span className="flex items-end gap-0.5 h-3 shrink-0">
                    <span className="w-0.5 h-2 bg-sky-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-0.5 h-3 bg-sky-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-0.5 h-1.5 bg-sky-400 rounded-full animate-bounce" />
                  </span>
                )}
              </div>
              <div className="text-[10px] text-slate-400 truncate font-mono">
                {track.subtitle || 'Asterisk Audio Stream • 8000Hz PCM WAV'}
              </div>
            </div>
          </div>

          {/* Central Controls & Progress Scrubber */}
          <div className="flex-1 w-full flex flex-col items-center gap-1.5">
            {/* Playback Buttons */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => onSeekRelative(-5)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
                title="Rewind 5 seconds"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={onTogglePlay}
                disabled={isLoading}
                className="w-9 h-9 rounded-full bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white flex items-center justify-center shadow-lg shadow-sky-600/30 transition transform active:scale-95 disabled:opacity-50"
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : isPlaying ? (
                  <Pause className="w-4 h-4" />
                ) : (
                  <Play className="w-4 h-4 ml-0.5" />
                )}
              </button>

              <button
                onClick={() => onSeekRelative(5)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
                title="Fast forward 5 seconds"
              >
                <RotateCw className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Scrubber Bar */}
            <div className="w-full flex items-center gap-2 text-[10px] font-mono text-slate-400">
              <span className="w-10 text-right">{formatTime(currentTime)}</span>
              <div
                className="flex-1 relative h-2 bg-slate-800 rounded-full cursor-pointer group"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const clickX = e.clientX - rect.left;
                  const ratio = Math.max(0, Math.min(1, clickX / rect.width));
                  onSeek(ratio * duration);
                }}
              >
                <div
                  className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-sky-500 to-blue-500 rounded-full transition-all"
                  style={{ width: `${progressPercent}%` }}
                />
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ left: `calc(${progressPercent}% - 6px)` }}
                />
              </div>
              <span className="w-10">{formatTime(duration)}</span>
            </div>
          </div>

          {/* Right Tools: Speed, Volume, Download, Close */}
          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-end">
            {/* Speed Selector */}
            <button
              onClick={() => {
                const nextRate = playbackRate === 1 ? 1.25 : playbackRate === 1.25 ? 1.5 : playbackRate === 1.5 ? 2 : 1;
                onSetPlaybackRate(nextRate);
              }}
              className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-mono font-bold transition"
              title="Playback Speed"
            >
              {playbackRate}x
            </button>

            {/* Volume Control */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={onToggleMute}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg transition"
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-4 h-4 text-rose-400" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={(e) => onSetVolume(parseFloat(e.target.value))}
                className="w-16 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
                title="Volume"
              />
            </div>

            {/* Direct Download */}
            <a
              href={track.streamUrl}
              download={`${track.title.replace(/\s+/g, '_')}.wav`}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
              title="Download Audio File"
            >
              <Download className="w-4 h-4" />
            </a>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition ml-1"
              title="Close Audio Player"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
