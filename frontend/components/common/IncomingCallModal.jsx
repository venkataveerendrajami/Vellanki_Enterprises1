import React, { useState, useEffect, useRef } from 'react';
import { 
  Phone, 
  PhoneCall, 
  PhoneOff, 
  Volume2, 
  RotateCcw, 
  Leaf, 
  MessageSquare, 
  Sparkles,
  ArrowRight
} from 'lucide-react';

const IncomingCallModal = ({ 
  isOpen, 
  onClose, 
  phoneNumber, 
  otpCode, 
  voiceScript, 
  smsText, 
  onApplyCode 
}) => {
  // Call States: 'ringing' | 'connected' | 'ended'
  const [callState, setCallState] = useState('ringing');
  const [callDuration, setCallDuration] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showSmsBanner, setShowSmsBanner] = useState(false);
  const timerRef = useRef(null);

  // Spoken voice speech function
  const speakScript = (text) => {
    if ('speechSynthesis' in window && text) {
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.9;
        utterance.pitch = 1.0;
        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);
        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.warn('Speech synthesis playback error:', err);
      }
    }
  };

  // Reset and handle open
  useEffect(() => {
    if (isOpen) {
      setCallState('ringing');
      setCallDuration(0);
      setIsSpeaking(false);
      setShowSmsBanner(!!smsText);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    }
  }, [isOpen, smsText]);

  // Call timer when connected
  useEffect(() => {
    if (callState === 'connected') {
      timerRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);

      // Automatically speak the voice code upon answering
      if (voiceScript) {
        speakScript(voiceScript);
      }
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [callState, voiceScript]);

  if (!isOpen) return null;

  const handleAnswerCall = () => {
    setCallState('connected');
  };

  const handleEndCall = () => {
    setCallState('ended');
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    setTimeout(() => {
      onClose();
    }, 700);
  };

  const handleApplyAndClose = () => {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    if (onApplyCode && otpCode) {
      onApplyCode(otpCode);
    }
    onClose();
  };

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      
      {/* Floating SMS Notification Pill on top if SMS was also sent */}
      {showSmsBanner && smsText && (
        <div className="absolute top-4 left-4 right-4 max-w-md mx-auto z-10 animate-in slide-in-from-top-6 duration-300">
          <div className="bg-white/95 text-gray-900 rounded-2xl p-3.5 shadow-2xl border border-emerald-300 flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between text-xs">
                <span className="font-black text-emerald-900 tracking-tight">MESSAGES • VELLANKI</span>
                <span className="text-[10px] text-gray-400">now</span>
              </div>
              <p className="text-xs text-gray-700 mt-0.5 line-clamp-2">
                {smsText}
              </p>
            </div>
            <button
              type="button"
              onClick={handleApplyAndClose}
              className="text-[10px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1.5 rounded-lg shrink-0 transition-all shadow"
            >
              Enter Code
            </button>
          </div>
        </div>
      )}

      {/* Realistic Mobile Incoming Phone Call Card */}
      <div className="relative w-full max-w-sm rounded-[36px] bg-gradient-to-b from-gray-950 via-slate-900 to-black text-white p-7 shadow-2xl border border-gray-800 flex flex-col justify-between items-center min-h-[520px] overflow-hidden">
        
        {/* Subtle decorative glow */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-forest/30 rounded-full blur-3xl pointer-events-none"></div>

        {/* Top Header info */}
        <div className="text-center space-y-1.5 w-full pt-4">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-emerald-400">
            {callState === 'ringing' && '📞 Incoming Voice Call...'}
            {callState === 'connected' && `Connected (${formatTimer(callDuration)})`}
            {callState === 'ended' && 'Call Ended'}
          </p>
          <h3 className="text-2xl font-black text-white tracking-tight">
            VELLANKI ENTERPRISES
          </h3>
          <p className="text-xs text-gray-400">
            Automated OTP Hotline • (+91 80 4012 3456)
          </p>
          <div className="inline-block bg-white/10 px-3 py-0.5 rounded-full text-[11px] text-emerald-300 font-mono mt-1">
            Calling: {phoneNumber || 'Your Mobile Number'}
          </div>
        </div>

        {/* Center: Caller Avatar & Active Call Feedback */}
        <div className="my-auto text-center space-y-4 py-4 w-full">
          
          {/* Avatar with pulsing rings */}
          <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
            {callState === 'ringing' && (
              <>
                <span className="absolute inset-0 rounded-full bg-emerald-500/30 animate-ping duration-1000"></span>
                <span className="absolute -inset-3 rounded-full bg-emerald-400/20 animate-pulse"></span>
              </>
            )}
            <div className="relative w-24 h-24 rounded-full bg-gradient-to-tr from-forest to-emerald-500 flex items-center justify-center text-white shadow-xl shadow-emerald-900/50">
              <Leaf className="w-12 h-12 text-emerald-100" />
            </div>
          </div>

          {/* When Ringing */}
          {callState === 'ringing' && (
            <div className="space-y-1">
              <p className="text-sm font-semibold text-gray-300">
                Tap <strong className="text-emerald-400">Answer</strong> to listen to your 6-digit OTP code
              </p>
              <p className="text-[11px] text-gray-500">
                Spoken aloud via automated voice system
              </p>
            </div>
          )}

          {/* When Connected */}
          {callState === 'connected' && (
            <div className="space-y-3 bg-white/5 border border-white/10 p-4 rounded-2xl w-full">
              <div className="flex items-center justify-center gap-1.5 text-xs text-emerald-300">
                <Volume2 className="w-4 h-4 animate-bounce" />
                <span className="font-bold">
                  {isSpeaking ? 'Speaking verification code aloud...' : 'Voice call active'}
                </span>
              </div>

              {/* Animated audio equalizer wave */}
              <div className="flex items-center justify-center gap-1 h-6">
                {[1, 2, 3, 4, 5, 6, 7].map((bar) => (
                  <span
                    key={bar}
                    className={`w-1 bg-emerald-400 rounded-full transition-all duration-300 ${
                      isSpeaking ? 'animate-pulse' : 'opacity-40'
                    }`}
                    style={{
                      height: isSpeaking ? `${Math.max(8, (bar * 7) % 24)}px` : '6px',
                      animationDelay: `${bar * 120}ms`
                    }}
                  ></span>
                ))}
              </div>

              {/* Spoken OTP digits preview */}
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold mb-1">
                  Spoken Verification Code:
                </p>
                <div className="flex justify-center gap-1.5 font-mono text-xl font-black text-emerald-200">
                  {otpCode ? (
                    otpCode.split('').map((d, i) => (
                      <span key={i} className="w-8 h-9 rounded-lg bg-black/40 border border-emerald-500/40 flex items-center justify-center">
                        {d}
                      </span>
                    ))
                  ) : (
                    <span>------</span>
                  )}
                </div>
              </div>

              {/* Replay audio speech button */}
              <button
                type="button"
                onClick={() => speakScript(voiceScript)}
                className="text-xs bg-white/10 hover:bg-white/20 text-emerald-200 px-3 py-1.5 rounded-xl font-bold inline-flex items-center gap-1.5 transition-all"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Repeat Voice Readout</span>
              </button>
            </div>
          )}

          {/* When Ended */}
          {callState === 'ended' && (
            <p className="text-sm font-semibold text-gray-400">
              Call disconnected.
            </p>
          )}

        </div>

        {/* Bottom Call Controls */}
        <div className="w-full pt-4 border-t border-white/10">
          
          {callState === 'ringing' && (
            <div className="flex items-center justify-around w-full px-4">
              {/* Decline Button */}
              <div className="text-center space-y-1">
                <button
                  type="button"
                  onClick={handleEndCall}
                  className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center shadow-lg shadow-red-900/40 transition-transform active:scale-95"
                >
                  <PhoneOff className="w-7 h-7" />
                </button>
                <span className="text-[11px] text-gray-400 font-medium">Decline</span>
              </div>

              {/* Answer Button */}
              <div className="text-center space-y-1">
                <button
                  type="button"
                  onClick={handleAnswerCall}
                  className="w-16 h-16 rounded-full bg-emerald-500 hover:bg-emerald-400 text-white flex items-center justify-center shadow-xl shadow-emerald-500/50 transition-transform active:scale-95 ring-4 ring-emerald-500/30 animate-pulse"
                >
                  <PhoneCall className="w-7 h-7" />
                </button>
                <span className="text-[11px] text-emerald-400 font-bold">Answer Call</span>
              </div>
            </div>
          )}

          {callState === 'connected' && (
            <div className="space-y-3 w-full">
              {/* Quick Enter Code into Website button */}
              <button
                type="button"
                onClick={handleApplyAndClose}
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-black text-xs rounded-xl shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-1.5 transition-all"
              >
                <Sparkles className="w-4 h-4 text-gray-950" />
                <span>Enter Code into Website & Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* End Call button */}
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={handleEndCall}
                  className="w-12 h-12 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center shadow-lg transition-transform active:scale-95"
                  title="Hang Up"
                >
                  <PhoneOff className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {callState === 'ended' && (
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 bg-gray-800 text-gray-300 font-bold text-xs rounded-xl"
            >
              Close
            </button>
          )}

        </div>

      </div>

    </div>
  );
};

export default IncomingCallModal;
