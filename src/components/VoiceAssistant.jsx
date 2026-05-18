import { useState, useRef, useEffect, useCallback } from 'react';
import { Mic, MicOff, X, Volume2, Zap, Moon, Sun, Home, Thermometer, Lock, Lightbulb, Wind } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useDeviceStore } from '../store/deviceStore';

// ─── Speech synthesis helper ────────────────────────────────────────────────
const speak = (text) => {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utt = new SpeechSynthesisUtterance(text);
  utt.rate = 1.05;
  utt.pitch = 1.0;
  utt.volume = 1;
  // Prefer a natural-sounding voice
  const voices = window.speechSynthesis.getVoices();
  const preferred = voices.find(v =>
    v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Karen')
  ) || voices[0];
  if (preferred) utt.voice = preferred;
  window.speechSynthesis.speak(utt);
};

// OpenRouter API Configuration
const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY || "";

// ─── Main Component ──────────────────────────────────────────────────────────
export default function VoiceAssistant({ onClose }) {
  const store = useDeviceStore();
  const { devices } = store;
  const navigate = useNavigate();

  const [isListening, setIsListening]   = useState(false);
  const [transcript, setTranscript]     = useState('');
  const [textInput, setTextInput]       = useState('');
  const [conversation, setConversation] = useState([
    { role: 'assistant', text: "Hi! I'm Syncra. Tap the mic or type a command below. Try 'good night', 'turn on the lights', or 'what's the status'." }
  ]);
  const [phase, setPhase]               = useState('idle'); // idle | listening | thinking | speaking
  const recognitionRef = useRef(null);
  const chatEndRef     = useRef(null);
  const retryCountRef  = useRef(0);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation]);

  const addMessage = useCallback((role, text) => {
    setConversation(prev => [...prev.slice(-19), { role, text }]);
  }, []);

  const processTranscript = useCallback(async (text) => {
    if (!text.trim()) return;
    addMessage('user', text);
    setPhase('thinking');

    try {
      // Simplify devices array so we don't blow up the prompt context
      const devicesMin = devices.map(d => ({ 
        id: d._id || d.id, 
        name: d.name, 
        type: d.type, 
        location: d.location, 
        status: d.status,
        isOn: d.state?.isOn,
        isLocked: d.state?.isLocked 
      }));

      const systemPrompt = `You are Syncra, a highly advanced AI smart home assistant running on a React web dashboard.
You can control real devices, navigate the website, and simulate advanced functionality like answering trivia, checking cameras, setting timers, etc.

Current Dashboard Devices:
${JSON.stringify(devicesMin)}

When the user asks you to do something, you MUST respond in pure JSON format:
{
  "reply": "Conversational response to speak to the user (keep it concise and natural, use an emoji).",
  "actions": [
    { "type": "set_state", "deviceId": "id_here", "isOn": true }, // Turns device on (true) or off (false)
    { "type": "set_lock", "deviceId": "id_here", "isLocked": true }, // Locks (true) or unlocks (false)
    { "type": "set_temp", "deviceId": "id_here", "temp": 24 }, // Thermostats/ACs
    { "type": "set_brightness", "deviceId": "id_here", "level": 50 }, // Lights 0-100
    { "type": "set_color", "deviceId": "id_here", "color": "blue" }, // Lights color
    { "type": "navigate", "path": "/dashboard" } // Navigates the UI (/dashboard, /routines, /devices, /analytics, /settings)
  ]
}

- For any device in the list, use its exact "id" in "deviceId".
- Check the current "isOn" or "isLocked" state in the list. ONLY generate an action if the state actually needs to change!
- If a user asks to do something with a device NOT in the list, or asks for weather, trivia, security camera feed, etc., just acknowledge it gracefully in "reply" as if you did it (no "actions" needed).
- If the user says "movie mode", "good night", etc., you can return multiple "set_state" or "set_lock" actions for the relevant devices.
- ALWAYS return purely valid JSON. No markdown backticks, no extra text around the JSON.`;

      // Keep recent context, format for OpenRouter
      const recentChat = conversation.slice(-6).map(c => ({ role: c.role, content: c.text }));

      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "openai/gpt-4o-mini", // Very fast and reliable for JSON outputs
          messages: [
            { role: "system", content: systemPrompt },
            ...recentChat,
            { role: "user", content: text }
          ]
        })
      });

      if (!response.ok) throw new Error("API Network Error");
      
      const data = await response.json();
      let aiText = data.choices[0].message.content.trim();
      
      // Cleanup markdown if the model hallucinates it
      if (aiText.startsWith('```json')) aiText = aiText.replace(/```json/g, '');
      if (aiText.startsWith('```')) aiText = aiText.replace(/```/g, '');
      if (aiText.endsWith('```')) aiText = aiText.replace(/```$/g, '');
      
      let parsed;
      try {
        // Robust extraction: Find the first { and last } to pull out the JSON object
        const match = aiText.match(/\{[\s\S]*\}/);
        if (match) {
          parsed = JSON.parse(match[0]);
        } else {
          parsed = JSON.parse(aiText.trim()); // Fallback
        }
      } catch (e) {
        console.error("Raw AI Output:", aiText);
        throw new Error("Model failed to return valid JSON format");
      }

      // Execute actions
      if (parsed.actions && parsed.actions.length > 0) {
        parsed.actions.forEach(action => {
          if (action.type === 'set_state') store.updateDeviceState(action.deviceId, { isOn: action.isOn });
          if (action.type === 'set_lock') store.updateDeviceState(action.deviceId, { isLocked: action.isLocked });
          if (action.type === 'set_temp') store.updateDeviceState(action.deviceId, { temp: action.temp });
          if (action.type === 'set_brightness') store.updateDeviceState(action.deviceId, { brightness: action.level, isOn: action.level > 0 });
          if (action.type === 'set_color') store.updateDeviceState(action.deviceId, { color: action.color, isOn: true });
          if (action.type === 'navigate') {
             navigate(action.path);
             onClose(); // Automatically close overlay so user can see the navigation result
          }
        });
      }

      addMessage('assistant', parsed.reply);
      setPhase('speaking');
      speak(parsed.reply);
      setTimeout(() => setPhase('idle'), parsed.reply.length > 80 ? 4000 : 2500); // speak longer for longer replies

    } catch (err) {
      console.error("Agent Error:", err);
      addMessage('assistant', `AI Connection Error: ${err.message}. Check your browser console (F12) for more details.`);
      setPhase('idle');
    }
  }, [devices, store, addMessage, conversation, navigate, onClose]);

  const startListening = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      addMessage('assistant', 'Voice recognition is not supported. Please type your command below instead.');
      return;
    }
    window.speechSynthesis.cancel();
    const rec = new SpeechRecognition();
    rec.continuous = false;
    rec.interimResults = false;   // disabling interim reduces network calls
    rec.lang = 'en-US';
    rec.maxAlternatives = 1;

    rec.onstart = () => { setIsListening(true); setPhase('listening'); setTranscript(''); };
    rec.onresult = (e) => {
      retryCountRef.current = 0;  // reset on success
      const final = e.results[0][0].transcript;
      setTranscript(final);
      processTranscript(final);
      setTranscript('');
    };
    rec.onerror = (e) => {
      setIsListening(false);
      setPhase('idle');

      // Network / audio-capture errors: silently retry up to 2 times
      if ((e.error === 'network' || e.error === 'audio-capture') && retryCountRef.current < 2) {
        retryCountRef.current += 1;
        setTimeout(() => startListening(), 600);
        return;
      }
      retryCountRef.current = 0;

      // Only show user-facing message for non-trivial errors
      if (e.error === 'not-allowed') {
        addMessage('assistant', 'Microphone access denied. Please allow mic permission in your browser settings, or type your command below.');
      } else if (e.error !== 'no-speech' && e.error !== 'aborted') {
        addMessage('assistant', `Could not use microphone (${e.error}). You can type your command in the box below instead.`);
      }
    };
    rec.onend = () => { setIsListening(false); if (phase === 'listening') setPhase('idle'); };
    recognitionRef.current = rec;
    rec.start();
  }, [addMessage, processTranscript, phase]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
    setPhase('idle');
  }, []);

  useEffect(() => () => { recognitionRef.current?.stop(); window.speechSynthesis.cancel(); }, []);

  // ── Quick commands ──
  const quickCommands = [
    { label: 'Good Night', icon: Moon,        cmd: 'good night' },
    { label: 'Good Morning', icon: Sun,        cmd: 'good morning' },
    { label: 'All Lights On', icon: Lightbulb, cmd: 'turn on all lights' },
    { label: 'All Lights Off', icon: Lightbulb,cmd: 'turn off all lights' },
    { label: 'Lock All', icon: Lock,           cmd: 'lock the door' },
    { label: 'Away Mode', icon: Home,          cmd: 'i am leaving' },
    { label: 'Movie Mode', icon: Zap,          cmd: 'movie mode' },
    { label: 'Status', icon: Volume2,          cmd: 'what is the status' },
  ];

  const orbColors = {
    idle:      'rgba(139,92,246,0.25)',
    listening: 'rgba(34,211,238,0.4)',
    thinking:  'rgba(245,158,11,0.35)',
    speaking:  'rgba(16,185,129,0.35)',
  };
  const orbGlow = {
    idle:      '0 0 40px rgba(139,92,246,0.3)',
    listening: '0 0 60px rgba(34,211,238,0.5), 0 0 120px rgba(34,211,238,0.2)',
    thinking:  '0 0 50px rgba(245,158,11,0.4)',
    speaking:  '0 0 60px rgba(16,185,129,0.4)',
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(5, 3, 15, 0.96)',
        backdropFilter: 'blur(20px)',
        display: 'flex', flexDirection: 'column',
        fontFamily: "'Space Grotesk', -apple-system, sans-serif",
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img src="/syncra-logo.png" alt="Syncra" style={{ width: '32px', height: '32px', objectFit: 'contain' }} />
          <div>
            <p style={{ color: '#fff', fontWeight: 700, fontSize: '16px', letterSpacing: '-0.3px' }}>Syncra Voice</p>
            <p style={{ color: 'rgba(139,92,246,0.7)', fontSize: '11px', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.15em' }}>
              Smart Home Assistant
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '8px', cursor: 'pointer', color: '#8892b0', display: 'flex', alignItems: 'center' }}
        >
          <X size={18} />
        </button>
      </div>

      {/* Orb + listening area */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px 24px 20px' }}>
        {/* Animated orb */}
        <div style={{ position: 'relative', marginBottom: '20px' }}>
          {/* Outer ring */}
          {(phase === 'listening') && (
            <div style={{
              position: 'absolute', inset: '-20px', borderRadius: '50%',
              border: '2px solid rgba(34,211,238,0.25)',
              animation: 'pulse-ring 1.2s ease-out infinite',
            }} />
          )}
          <div
            onClick={isListening ? stopListening : startListening}
            style={{
              width: '120px', height: '120px', borderRadius: '50%',
              background: `radial-gradient(circle at 40% 35%, ${orbColors[phase]}, rgba(5,3,15,0.8))`,
              border: `2px solid ${phase === 'listening' ? 'rgba(34,211,238,0.5)' : phase === 'speaking' ? 'rgba(16,185,129,0.5)' : 'rgba(139,92,246,0.3)'}`,
              boxShadow: orbGlow[phase],
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.4s ease',
              animation: phase === 'listening' ? 'orb-pulse 1.5s ease-in-out infinite' : 'none',
            }}
          >
            {isListening
              ? <MicOff size={40} color="#22d3ee" />
              : <Mic size={40} color={phase === 'speaking' ? '#10b981' : '#a78bfa'} />
            }
          </div>
        </div>

        {/* Status label */}
        <p style={{
          fontSize: '14px', fontWeight: 600, letterSpacing: '0.05em',
          color: phase === 'listening' ? '#22d3ee' : phase === 'speaking' ? '#10b981' : phase === 'thinking' ? '#f59e0b' : '#8892b0',
          transition: 'color 0.3s',
          marginBottom: '8px',
        }}>
          {phase === 'listening' ? '● Listening...' : phase === 'thinking' ? '◈ Processing...' : phase === 'speaking' ? '▶ Speaking...' : 'Tap to speak'}
        </p>

        {/* Live transcript */}
        {transcript && (
          <p style={{ fontSize: '13px', color: '#66fcf1', fontStyle: 'italic', textAlign: 'center', maxWidth: '320px' }}>
            "{transcript}"
          </p>
        )}
      </div>

      {/* Conversation */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {conversation.map((msg, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
            <div style={{
              maxWidth: '80%', padding: '10px 14px', borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
              background: msg.role === 'user'
                ? 'linear-gradient(135deg, rgba(139,92,246,0.25), rgba(99,102,241,0.2))'
                : 'rgba(255,255,255,0.05)',
              border: msg.role === 'user'
                ? '1px solid rgba(139,92,246,0.3)'
                : '1px solid rgba(255,255,255,0.08)',
              fontSize: '13px', lineHeight: 1.5,
              color: msg.role === 'user' ? '#e0d4ff' : '#e2e8f0',
            }}>
              {msg.text}
            </div>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      {/* Text input bar */}
      <div style={{ padding: '12px 20px 0', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <form
          onSubmit={e => { e.preventDefault(); if (textInput.trim()) { processTranscript(textInput.trim()); setTextInput(''); } }}
          style={{ display: 'flex', gap: '8px' }}
        >
          <input
            value={textInput}
            onChange={e => setTextInput(e.target.value)}
            placeholder="Type a command... e.g. 'turn on the lights'"
            style={{
              flex: 1, padding: '10px 14px', borderRadius: '12px', fontSize: '13px',
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(139,92,246,0.25)',
              color: '#fff', outline: 'none', fontFamily: 'inherit',
            }}
            onFocus={e => e.target.style.borderColor = 'rgba(139,92,246,0.6)'}
            onBlur={e => e.target.style.borderColor = 'rgba(139,92,246,0.25)'}
          />
          <button
            type="submit"
            disabled={!textInput.trim()}
            style={{
              padding: '10px 16px', borderRadius: '12px', fontSize: '13px', fontWeight: 600,
              background: textInput.trim() ? 'linear-gradient(135deg, #8b5cf6, #6366f1)' : 'rgba(255,255,255,0.05)',
              color: textInput.trim() ? '#fff' : '#4b5563',
              border: 'none', cursor: textInput.trim() ? 'pointer' : 'not-allowed', fontFamily: 'inherit',
            }}
          >
            Send
          </button>
        </form>
      </div>

      {/* Quick commands */}
      <div style={{ padding: '12px 20px 16px' }}>
        <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.25)', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '10px' }}>
          Quick Commands
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {quickCommands.map(({ label, icon: Icon, cmd }) => (
            <button
              key={label}
              onClick={() => processTranscript(cmd)}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 600,
                background: 'rgba(139,92,246,0.1)', color: '#c084fc',
                border: '1px solid rgba(139,92,246,0.2)',
                cursor: 'pointer', fontFamily: 'inherit',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(139,92,246,0.22)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(139,92,246,0.1)'; }}
            >
              <Icon size={12} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* CSS animations */}
      <style>{`
        @keyframes orb-pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.06); }
        }
        @keyframes pulse-ring {
          0% { transform: scale(1); opacity: 0.8; }
          100% { transform: scale(1.4); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
