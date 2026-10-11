'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  Pause,
  Play,
  CornerDownRight,
  X,
  Volume2,
  Delete,
  Shield,
  CheckCircle2,
  AlertCircle,
  Grid,
  Users2,
  Minimize2,
  Maximize2,
  Radio,
} from 'lucide-react';
import { UserAgent, Inviter, SessionState, Registerer } from 'sip.js';
import { api, getStoredUser } from '@/lib/api';

interface SoftphoneProps {
  isOpen: boolean;
  onClose: () => void;
  initialTarget?: string;
}

interface TeamMember {
  ext: string;
  name: string;
  status: 'AVAILABLE' | 'AWAY' | 'OFFLINE';
}

const DEFAULT_BLF_KEYS: TeamMember[] = [
  { ext: '1001', name: 'Alice Smith (1001)', status: 'AVAILABLE' },
  { ext: '1010', name: 'Support Agent (1010)', status: 'AVAILABLE' },
];

// DTMF tone frequencies
const DTMF_FREQS: Record<string, [number, number]> = {
  '1': [697, 1209],
  '2': [697, 1336],
  '3': [697, 1477],
  '4': [770, 1209],
  '5': [770, 1336],
  '6': [770, 1477],
  '7': [852, 1209],
  '8': [852, 1336],
  '9': [852, 1477],
  '*': [941, 1209],
  '0': [941, 1336],
  '#': [941, 1477],
};

function playDtmfTone(digit: string) {
  try {
    const freqs = DTMF_FREQS[digit];
    if (!freqs) return;
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.frequency.value = freqs[0];
    osc2.frequency.value = freqs[1];
    gain.gain.value = 0.08;

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start();
    osc2.start();

    setTimeout(() => {
      osc1.stop();
      osc2.stop();
      ctx.close().catch(() => {});
    }, 120);
  } catch (e) {
    // AudioContext might not be allowed before user interaction
  }
}

export default function WebRtcSoftphone({ isOpen, onClose, initialTarget }: SoftphoneProps) {
  const [extension, setExtension] = useState('1001');
  const [sipPassword, setSipPassword] = useState('EclypeExt1001!');
  const [dialTarget, setDialTarget] = useState('');
  const [registered, setRegistered] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [regError, setRegError] = useState<string | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(DEFAULT_BLF_KEYS);

  // Tab: Keypad vs BLF Team
  const [activeTab, setActiveTab] = useState<'KEYPAD' | 'BLF'>('KEYPAD');

  // Call state
  const [activeSession, setActiveSession] = useState<any>(null);
  const [callState, setCallState] = useState<'IDLE' | 'CALLING' | 'RINGING' | 'CONNECTED'>('IDLE');
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isOnHold, setIsOnHold] = useState(false);
  const [transferTarget, setTransferTarget] = useState('');
  const [showTransfer, setShowTransfer] = useState(false);

  const userAgentRef = useRef<UserAgent | null>(null);
  const registererRef = useRef<Registerer | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Load team extensions from API
  useEffect(() => {
    api.getExtensions()
      .then((data) => {
        if (data?.extensions && data.extensions.length > 0) {
          const members: TeamMember[] = data.extensions.map((ext: any) => ({
            ext: ext.extensionNumber,
            name: `${ext.displayName} (${ext.extensionNumber})`,
            status: ext.status === 'ONLINE' ? 'AVAILABLE' : 'AWAY',
          }));
          setTeamMembers(members);
        }
      })
      .catch(() => {});
  }, []);

  // Pre-fill target if passed from header or extensions
  useEffect(() => {
    if (initialTarget) {
      setDialTarget(initialTarget);
    }
  }, [initialTarget]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (userAgentRef.current) {
        userAgentRef.current.stop();
      }
    };
  }, []);

  // Duration timer
  useEffect(() => {
    if (callState === 'CONNECTED') {
      timerRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setCallDuration(0);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [callState]);

  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleRegister = async (): Promise<boolean> => {
    setRegistering(true);
    setRegError(null);

    try {
      if (userAgentRef.current) {
        await userAgentRef.current.stop();
      }

      const domain = window.location.hostname;
      const isHttps = window.location.protocol === 'https:';
      const protocol = isHttps ? 'wss:' : 'ws:';
      const wsPort = isHttps ? '8089' : '5066';
      const serverUri = `${protocol}//${domain}:${wsPort}`;

      const uri = UserAgent.makeURI(`sip:${extension}@${domain}`);
      if (!uri) throw new Error('Invalid SIP URI format');

      const ua = new UserAgent({
        uri,
        transportOptions: {
          server: serverUri,
          connectionTimeout: 8,
        },
        authorizationUsername: extension,
        authorizationPassword: sipPassword,
        delegate: {
          onInvite(invitation) {
            setActiveSession(invitation);
            setCallState('RINGING');
            invitation.stateChange.addListener((state) => {
              if (state === SessionState.Established) {
                setCallState('CONNECTED');
                setupRemoteAudio(invitation);
              } else if (state === SessionState.Terminated) {
                setCallState('IDLE');
                setActiveSession(null);
              }
            });
          },
        },
      });

      await ua.start();
      const registerer = new Registerer(ua);
      await registerer.register();

      userAgentRef.current = ua;
      registererRef.current = registerer;
      setRegistered(true);
      return true;
    } catch (err: any) {
      setRegError(err.message || 'Asterisk WebRTC Registration Failed');
      setRegistered(false);
      return false;
    } finally {
      setRegistering(false);
    }
  };

  const handleUnregister = async () => {
    if (registererRef.current) {
      await registererRef.current.unregister();
    }
    if (userAgentRef.current) {
      await userAgentRef.current.stop();
    }
    userAgentRef.current = null;
    registererRef.current = null;
    setRegistered(false);
    setCallState('IDLE');
  };

  const setupRemoteAudio = (session: any) => {
    const remoteStream = new MediaStream();
    if (session.sessionDescriptionHandler?.peerConnection) {
      session.sessionDescriptionHandler.peerConnection
        .getReceivers()
        .forEach((receiver: any) => {
          if (receiver.track) {
            remoteStream.addTrack(receiver.track);
          }
        });
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = remoteStream;
        remoteAudioRef.current.play().catch(() => {});
      }
    }
  };

  const handleMakeCall = async (target?: string) => {
    const dest = target || dialTarget;
    if (!dest) return;
    setRegError(null);

    let ua = userAgentRef.current;
    if (!ua) {
      const ok = await handleRegister();
      if (!ok) return;
      ua = userAgentRef.current;
    }

    if (!ua) return;

    try {
      const domain = window.location.hostname;
      const targetUri = UserAgent.makeURI(`sip:${dest}@${domain}`);
      if (!targetUri) return;

      const inviter = new Inviter(ua, targetUri, {
        sessionDescriptionHandlerOptions: {
          constraints: { audio: true, video: false },
        },
      });

      setActiveSession(inviter);
      setCallState('CALLING');

      inviter.stateChange.addListener((state) => {
        if (state === SessionState.Established) {
          setCallState('CONNECTED');
          setupRemoteAudio(inviter);
        } else if (state === SessionState.Terminated) {
          setCallState('IDLE');
          setActiveSession(null);
        }
      });

      await inviter.invite();
    } catch (err: any) {
      setRegError('Call initiation failed: ' + (err.message || 'Check microphone or destination'));
      setCallState('IDLE');
    }
  };

  const handleAnswer = async () => {
    if (activeSession && callState === 'RINGING') {
      await activeSession.accept();
      setCallState('CONNECTED');
    }
  };

  const handleHangup = async () => {
    if (activeSession) {
      if (callState === 'RINGING') {
        await activeSession.reject();
      } else {
        await activeSession.bye();
      }
    }
    setCallState('IDLE');
    setActiveSession(null);
  };

  const toggleMute = () => {
    if (activeSession && activeSession.sessionDescriptionHandler?.peerConnection) {
      const senders = activeSession.sessionDescriptionHandler.peerConnection.getSenders();
      senders.forEach((sender: any) => {
        if (sender.track && sender.track.kind === 'audio') {
          sender.track.enabled = !sender.track.enabled;
          setIsMuted(!sender.track.enabled);
        }
      });
    }
  };

  const toggleHold = async () => {
    if (activeSession) {
      try {
        if (!isOnHold) {
          await activeSession.hold();
          setIsOnHold(true);
        } else {
          await activeSession.unhold();
          setIsOnHold(false);
        }
      } catch (err) {}
    }
  };

  const handleDigit = (digit: string) => {
    playDtmfTone(digit);
    setDialTarget((prev) => prev + digit);
    if (activeSession && callState === 'CONNECTED') {
      try {
        activeSession.sendDtmf(digit);
      } catch (e) {}
    }
  };

  const handleTransfer = async () => {
    if (activeSession && transferTarget) {
      try {
        const domain = window.location.hostname;
        const targetUri = UserAgent.makeURI(`sip:${transferTarget}@${domain}`);
        if (targetUri) {
          await activeSession.refer(targetUri);
          setShowTransfer(false);
          setTransferTarget('');
        }
      } catch (err) {}
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-5 sm:right-5 w-[calc(100vw-32px)] sm:w-84 max-w-sm bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col text-slate-200 animate-in fade-in slide-in-from-bottom-4 duration-200">
      <audio ref={remoteAudioRef} autoPlay />

      {/* Top Header */}
      <div className="h-12 bg-slate-950/80 px-3.5 flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-sky-500 to-blue-600 flex items-center justify-center text-white text-[10px] font-black shadow-xs shadow-sky-500/20">
            ET
          </div>
          <div>
            <span className="font-bold text-xs text-white tracking-tight block leading-none">
              Eclype Web Phone
            </span>
            <span className="text-[10px] text-slate-400 font-medium leading-none mt-0.5 block">
              Ext {extension} • {registered ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            {registered && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            )}
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${
                registered ? 'bg-emerald-500' : 'bg-slate-500'
              }`}
            />
          </span>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
            title="Close Web Phone"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Registration Settings Accordion if not registered */}
      {!registered && (
        <div className="p-3.5 bg-slate-950/90 border-b border-slate-800 space-y-2.5">
          <div className="flex items-center justify-between text-xs text-slate-300">
            <span className="font-semibold text-white">SIP Account Login</span>
            <span className="text-[10px] text-sky-400 font-bold">Asterisk WebRTC</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-slate-400 font-medium">Extension</label>
              <input
                type="text"
                value={extension}
                onChange={(e) => setExtension(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-white focus:border-sky-500 outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 font-medium">SIP Secret</label>
              <input
                type="password"
                value={sipPassword}
                onChange={(e) => setSipPassword(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-white focus:border-sky-500 outline-none"
              />
            </div>
          </div>
          <button
            onClick={handleRegister}
            disabled={registering}
            className="w-full py-2 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white text-xs font-bold transition shadow-md shadow-sky-600/20 disabled:opacity-50"
          >
            {registering ? 'Connecting to Asterisk...' : 'Connect Eclype Phone'}
          </button>
          {regError && <p className="text-[10px] text-rose-400 font-medium">{regError}</p>}
        </div>
      )}

      {/* Active Call Display */}
      {callState !== 'IDLE' && (
        <div className="p-4 bg-gradient-to-b from-slate-950 to-slate-900 border-b border-sky-500/30 text-center space-y-2">
          <div className="text-[10px] uppercase tracking-widest text-sky-400 font-bold">
            {callState === 'RINGING' && 'Incoming Call...'}
            {callState === 'CALLING' && 'Calling Destination...'}
            {callState === 'CONNECTED' && 'Call in Progress'}
          </div>

          <div className="text-2xl font-black text-white font-mono tracking-wider">
            {dialTarget || 'Ext ' + extension}
          </div>

          {callState === 'CONNECTED' && (
            <div className="text-xs font-mono text-emerald-400 font-bold bg-emerald-950/50 px-2.5 py-0.5 rounded-full inline-block border border-emerald-800/40">
              {formatDuration(callDuration)}
            </div>
          )}

          {/* Action buttons during active call */}
          <div className="flex items-center justify-center gap-3 pt-2">
            {callState === 'RINGING' ? (
              <>
                <button
                  onClick={handleAnswer}
                  className="p-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full shadow-lg shadow-emerald-950/40 animate-pulse"
                  title="Answer Call"
                >
                  <Phone className="w-5 h-5 fill-current" />
                </button>
                <button
                  onClick={handleHangup}
                  className="p-3 bg-rose-600 hover:bg-rose-500 text-white rounded-full shadow-lg shadow-rose-950/40"
                  title="Decline Call"
                >
                  <PhoneOff className="w-5 h-5" />
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={toggleMute}
                  className={`p-2.5 rounded-full border transition ${
                    isMuted
                      ? 'bg-amber-600/30 border-amber-500 text-amber-300'
                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:text-white'
                  }`}
                  title={isMuted ? 'Unmute Microphone' : 'Mute Microphone'}
                >
                  {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>

                <button
                  onClick={toggleHold}
                  className={`p-2.5 rounded-full border transition ${
                    isOnHold
                      ? 'bg-amber-600/30 border-amber-500 text-amber-300'
                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:text-white'
                  }`}
                  title={isOnHold ? 'Resume Call' : 'Place Call on Hold'}
                >
                  {isOnHold ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                </button>

                <button
                  onClick={() => setShowTransfer(!showTransfer)}
                  className="p-2.5 rounded-full border bg-slate-950 border-slate-800 text-slate-300 hover:text-white transition"
                  title="Transfer Call"
                >
                  <CornerDownRight className="w-4 h-4" />
                </button>

                <button
                  onClick={handleHangup}
                  className="p-3 bg-rose-600 hover:bg-rose-500 text-white rounded-full shadow-lg shadow-rose-950/50"
                  title="End Call"
                >
                  <PhoneOff className="w-5 h-5" />
                </button>
              </>
            )}
          </div>

          {/* Transfer Box */}
          {showTransfer && (
            <div className="flex gap-1.5 pt-2">
              <input
                type="text"
                placeholder="Transfer to (e.g. 1002)"
                value={transferTarget}
                onChange={(e) => setTransferTarget(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-2.5 text-xs text-white focus:border-sky-500 outline-none"
              />
              <button
                onClick={handleTransfer}
                className="bg-sky-600 hover:bg-sky-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition"
              >
                Send
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tabs: Keypad vs BLF Team */}
      <div className="flex border-b border-slate-800 bg-slate-950/60 text-xs">
        <button
          onClick={() => setActiveTab('KEYPAD')}
          className={`flex-1 py-2 font-bold text-center border-b-2 transition ${
            activeTab === 'KEYPAD'
              ? 'border-sky-500 text-white bg-slate-900/60'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Grid className="w-3.5 h-3.5 inline mr-1.5" />
          Keypad
        </button>
        <button
          onClick={() => setActiveTab('BLF')}
          className={`flex-1 py-2 font-bold text-center border-b-2 transition ${
            activeTab === 'BLF'
              ? 'border-sky-500 text-white bg-slate-900/60'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users2 className="w-3.5 h-3.5 inline mr-1.5" />
          BLF Team Keys
        </button>
      </div>

      {activeTab === 'KEYPAD' ? (
        <>
          {/* Dial Input & Clear */}
          <div className="p-3 bg-slate-950/60 border-b border-slate-800 flex items-center gap-2">
            <input
              type="text"
              value={dialTarget}
              placeholder="Enter number or extension..."
              onChange={(e) => setDialTarget(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleMakeCall()}
              className="flex-1 bg-transparent text-lg font-mono font-bold text-white outline-none tracking-widest placeholder:text-slate-600"
            />
            {dialTarget && (
              <button
                onClick={() => setDialTarget(dialTarget.slice(0, -1))}
                className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition"
                title="Backspace"
              >
                <Delete className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* 12-Key Dialpad */}
          <div className="p-3.5 grid grid-cols-3 gap-2 bg-slate-900/90">
            {[
              { key: '1', sub: '' },
              { key: '2', sub: 'ABC' },
              { key: '3', sub: 'DEF' },
              { key: '4', sub: 'GHI' },
              { key: '5', sub: 'JKL' },
              { key: '6', sub: 'MNO' },
              { key: '7', sub: 'PQRS' },
              { key: '8', sub: 'TUV' },
              { key: '9', sub: 'WXYZ' },
              { key: '*', sub: '' },
              { key: '0', sub: '+' },
              { key: '#', sub: '' },
            ].map(({ key, sub }) => (
              <button
                key={key}
                onClick={() => handleDigit(key)}
                className="h-11 rounded-xl bg-slate-950/80 hover:bg-slate-800/90 active:bg-sky-600 border border-slate-800/80 flex flex-col items-center justify-center transition shadow-xs active:scale-95 group"
              >
                <span className="text-base font-bold text-white leading-none">{key}</span>
                {sub && <span className="text-[8px] text-slate-400 font-semibold leading-none mt-0.5">{sub}</span>}
              </button>
            ))}
          </div>

          {/* Bottom Call Button */}
          <div className="p-3 bg-slate-950/80 flex items-center justify-between border-t border-slate-800">
            {registered ? (
              <button
                onClick={handleUnregister}
                className="text-[10px] text-slate-400 hover:text-rose-400 transition"
              >
                Disconnect Ext
              </button>
            ) : (
              <div className="text-[10px] text-slate-500">Not connected</div>
            )}

            <button
              onClick={() => handleMakeCall()}
              disabled={!dialTarget || callState !== 'IDLE'}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-40 text-white font-extrabold text-xs shadow-lg shadow-emerald-950/40 transition active:scale-95"
            >
              <Phone className="w-4 h-4 fill-current" />
              <span>Call</span>
            </button>
          </div>
        </>
      ) : (
        /* BLF Team Keys Tab */
        <div className="p-3 bg-slate-900/90 space-y-2 max-h-72 overflow-y-auto">
          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">
            Speed Dial & Team BLF Status
          </div>
          {teamMembers.map((user) => (
            <div
              key={user.ext}
              className="flex items-center justify-between p-2 rounded-xl bg-slate-950/80 border border-slate-800/80 hover:border-sky-500/50 transition"
            >
              <div className="flex items-center gap-2.5">
                <span
                  className={`w-2 h-2 rounded-full ${
                    user.status === 'AVAILABLE' ? 'bg-emerald-500' : 'bg-amber-500'
                  }`}
                />
                <div>
                  <div className="text-xs font-bold text-white">{user.name}</div>
                  <div className="text-[10px] text-slate-400 font-mono">Ext {user.ext}</div>
                </div>
              </div>

              <button
                onClick={() => {
                  setDialTarget(user.ext);
                  handleMakeCall(user.ext);
                }}
                className="px-2.5 py-1 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-[10px] font-bold transition flex items-center gap-1 shadow-xs"
              >
                <Phone className="w-3 h-3 fill-current" />
                <span>Call</span>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
