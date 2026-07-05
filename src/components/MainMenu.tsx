import { useState } from 'react';
import { Sparkles, Trophy, Users, ShieldAlert, Cpu, HeartHandshake } from 'lucide-react';

interface MainMenuProps {
  onHostRoom: (name: string) => void;
  onJoinRoom: (name: string, code: string) => void;
  onStartOffline: (name: string) => void;
  onStartPassPlay: (name: string) => void;
  feltColor: 'emerald' | 'burgundy' | 'navy';
  setFeltColor: (color: 'emerald' | 'burgundy' | 'navy') => void;
}

export default function MainMenu({
  onHostRoom,
  onJoinRoom,
  onStartOffline,
  onStartPassPlay,
  feltColor,
  setFeltColor,
}: MainMenuProps) {
  const [name, setName] = useState(() => {
    return localStorage.getItem('uno_mercy_name') || '';
  });
  const [roomCode, setRoomCode] = useState('');
  const [showJoinInput, setShowJoinInput] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleAction = (action: 'host' | 'join' | 'offline' | 'passplay') => {
    const trimmedName = name.trim() || 'Noble Player';
    localStorage.setItem('uno_mercy_name', trimmedName);

    if (action === 'host') {
      onHostRoom(trimmedName);
    } else if (action === 'join') {
      if (!roomCode.trim() || roomCode.length < 4) {
        setErrorMsg('Please enter a valid 4-character room code.');
        return;
      }
      onJoinRoom(trimmedName, roomCode.trim().toUpperCase());
    } else if (action === 'offline') {
      onStartOffline(trimmedName);
    } else if (action === 'passplay') {
      onStartPassPlay(trimmedName);
    }
  };

  return (
    <div className="w-full h-screen overflow-y-auto flex flex-col justify-start items-center p-4 md:p-6 text-[#F4EBD0] relative select-none">
      
      {/* Luxury Header Banner */}
      <div className="text-center mt-2 md:mt-4 mb-4 flex flex-col items-center">
        <div className="text-xs md:text-sm font-sans uppercase tracking-[0.3em] text-[#D4AF37]/80 mb-1 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
          The Royal Card Room
          <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
        </div>
        <h1 className="text-3xl md:text-5xl font-serif font-extrabold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-[#F3E5AB] via-[#D4AF37] to-[#AA7C11] drop-shadow-md">
          UNO NO MERCY
        </h1>
        <p className="text-[10px] md:text-xs font-serif italic text-[#D4AF37]/70 uppercase tracking-widest mt-1">
          Show 'Em No Mercy • Royal Salon Edition
        </p>
      </div>

      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch pb-8">
        
        {/* Left Column: Player Config & Actions */}
        <div className="lg:col-span-7 flex flex-col gap-4 border border-[#D4AF37]/30 bg-black/45 p-4 md:p-6 rounded shadow-[0_0_20px_rgba(0,0,0,0.5)]">
          <h2 className="text-lg font-serif uppercase tracking-wider text-[#D4AF37] border-b border-[#D4AF37]/20 pb-1.5">
            1. Proclaim Your Identity
          </h2>
          
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] uppercase tracking-wider text-stone-300 font-mono">
              Noble Title & Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value.slice(0, 16));
                setErrorMsg('');
              }}
              placeholder="e.g., Duchess Penelope, Sir Sterling"
              maxLength={16}
              className="w-full bg-[#1A0E04]/80 border border-[#D4AF37]/50 rounded px-3 py-2 text-sm text-[#F4EBD0] placeholder-[#F4EBD0]/35 focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
            />
          </div>

          <h2 className="text-lg font-serif uppercase tracking-wider text-[#D4AF37] border-b border-[#D4AF37]/20 pb-1.5 mt-2">
            2. Choose Match Arena
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Solo Offline vs Bots */}
            <button
              onClick={() => handleAction('offline')}
              className="flex items-center gap-3 bg-gradient-to-r from-[#AA7C11]/30 to-black hover:from-[#D4AF37]/30 border border-[#D4AF37]/60 hover:border-[#D4AF37] rounded px-4 py-3 text-left transition-all duration-300 group cursor-pointer"
            >
              <Cpu className="w-6 h-6 text-[#D4AF37] group-hover:scale-110 transition-transform" />
              <div>
                <div className="font-serif font-bold text-xs md:text-sm text-[#F3E5AB]">SOLO VS COURT BOTS</div>
                <div className="text-[10px] text-stone-300 font-sans leading-tight">Test your skill offline against noble automated AI players instantly.</div>
              </div>
            </button>

            {/* Pass & Play */}
            <button
              onClick={() => handleAction('passplay')}
              className="flex items-center gap-3 bg-gradient-to-r from-[#AA7C11]/30 to-black hover:from-[#D4AF37]/30 border border-[#D4AF37]/60 hover:border-[#D4AF37] rounded px-4 py-3 text-left transition-all duration-300 group cursor-pointer"
            >
              <HeartHandshake className="w-6 h-6 text-[#D4AF37] group-hover:scale-110 transition-transform" />
              <div>
                <div className="font-serif font-bold text-xs md:text-sm text-[#F3E5AB]">PASS & PLAY</div>
                <div className="text-[10px] text-stone-300 font-sans leading-tight">Gather around! Pass the device in person to battle friends locally.</div>
              </div>
            </button>

            {/* Host P2P */}
            <button
              onClick={() => handleAction('host')}
              className="flex items-center gap-3 bg-gradient-to-r from-emerald-950/40 to-black hover:from-emerald-900/40 border border-emerald-500/50 hover:border-emerald-400 rounded px-4 py-3 text-left transition-all duration-300 group cursor-pointer"
            >
              <Trophy className="w-6 h-6 text-emerald-400 group-hover:scale-110 transition-transform" />
              <div>
                <div className="font-serif font-bold text-xs md:text-sm text-emerald-400">HOST MULTIPLAYER</div>
                <div className="text-[10px] text-stone-300 font-sans leading-tight">Create a serverless peer-to-peer room code for WebRTC matching.</div>
              </div>
            </button>

            {/* Join P2P */}
            <button
              onClick={() => {
                setShowJoinInput(!showJoinInput);
                setErrorMsg('');
              }}
              className="flex items-center gap-3 bg-gradient-to-r from-indigo-950/40 to-black hover:from-indigo-900/40 border border-indigo-500/50 hover:border-indigo-400 rounded px-4 py-3 text-left transition-all duration-300 group cursor-pointer"
            >
              <Users className="w-6 h-6 text-indigo-400 group-hover:scale-110 transition-transform" />
              <div>
                <div className="font-serif font-bold text-xs md:text-sm text-indigo-400">JOIN BY ROOM CODE</div>
                <div className="text-[10px] text-stone-300 font-sans leading-tight">Enter a peer's 4-character room code to sit at their table.</div>
              </div>
            </button>
          </div>

          {/* Join Drawer */}
          {showJoinInput && (
            <div className="border border-indigo-500/30 bg-indigo-950/20 p-3 rounded flex flex-col gap-3 mt-1 animate-fadeIn">
              <div className="flex gap-2 items-center">
                <input
                  type="text"
                  placeholder="CODE"
                  maxLength={4}
                  value={roomCode}
                  onChange={(e) => {
                    setRoomCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''));
                    setErrorMsg('');
                  }}
                  className="w-24 text-center font-mono text-lg font-bold tracking-widest bg-[#1A0E04] border border-[#D4AF37]/60 rounded py-1 text-[#D4AF37] uppercase focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                />
                <button
                  onClick={() => handleAction('join')}
                  className="flex-1 text-center bg-[#D4AF37] hover:bg-yellow-500 text-[#093A20] font-serif font-bold text-xs py-2 px-4 rounded tracking-wider transition-colors cursor-pointer"
                >
                  ENTER THE PORTAL
                </button>
              </div>
              <p className="text-[9px] uppercase tracking-wider text-indigo-300 font-mono">
                Tip: Enter exactly the 4 letters/numbers shown on host screen.
              </p>
            </div>
          )}

          {errorMsg && (
            <div className="text-rose-400 font-mono text-xs mt-1 border border-rose-400/20 bg-rose-950/30 p-2 rounded">
              ⚠️ {errorMsg}
            </div>
          )}

          {/* Salon Felt Settings */}
          <div className="mt-2">
            <span className="text-[10px] uppercase tracking-wider text-stone-300 font-mono block mb-1.5">
              Select Salon Velvet Wallpaper
            </span>
            <div className="flex gap-3">
              {[
                { id: 'emerald', label: 'Deep Emerald', color: 'bg-emerald-800 border-emerald-500' },
                { id: 'burgundy', label: 'Rich Burgundy', color: 'bg-red-900 border-red-500' },
                { id: 'navy', label: 'Royal Navy', color: 'bg-slate-900 border-indigo-500' },
              ].map((style) => (
                <button
                  key={style.id}
                  onClick={() => setFeltColor(style.id as any)}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-mono border cursor-pointer transition-all ${
                    feltColor === style.id
                      ? 'border-[#D4AF37] text-[#D4AF37] scale-105 shadow-[0_0_8px_rgba(212,175,55,0.4)] bg-black/40'
                      : 'border-stone-600 text-stone-400 bg-black/20 hover:text-stone-300'
                  }`}
                >
                  <span className={`w-2.5 h-2.5 rounded-full ${style.color}`} />
                  {style.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Rule Sheet */}
        <div className="lg:col-span-5 flex flex-col gap-4 border border-[#D4AF37]/30 bg-black/45 p-4 md:p-6 rounded shadow-[0_0_20px_rgba(0,0,0,0.5)]">
          <h2 className="text-lg font-serif uppercase tracking-wider text-[#D4AF37] border-b border-[#D4AF37]/20 pb-1.5 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-[#D4AF37]" />
            Rules of Engagement
          </h2>

          <div className="flex flex-col gap-3 font-sans text-xs text-stone-300 leading-relaxed overflow-y-auto max-h-[220px] pr-1">
            <div>
              <strong className="text-[#F3E5AB] font-serif uppercase tracking-wide block mb-0.5">
                ✦ Infinite Draw Protocol
              </strong>
              If you have no playable cards on your turn, you must draw from the draw pile <em className="text-[#D4AF37]">until</em> you draw a legally playable card. Hands will grow with alarming speed!
            </div>
            
            <div>
              <strong className="text-[#F3E5AB] font-serif uppercase tracking-wide block mb-0.5">
                ✦ Merciless Stacking Rule
              </strong>
              Any draw-penalty card (+2, +4, +6, +10, etc.) can be stacked. You can ONLY stack if you play a Draw card of <strong className="text-[#D4AF37]">equal or greater</strong> value (e.g. play a +6 on top of a +4). Otherwise, you draw the cumulative sum!
            </div>

            <div>
              <strong className="text-[#F3E5AB] font-serif uppercase tracking-wide block mb-0.5">
                ✦ The 25-Card Mercy Threshold
              </strong>
              If your hand swell to <strong className="text-red-400">25 cards or more</strong>, you are instantly declared bankrupt &amp; <strong className="text-red-400">KNOCKED OUT</strong> of the match. Your remaining cards are removed.
            </div>

            <div>
              <strong className="text-[#F3E5AB] font-serif uppercase tracking-wide block mb-0.5">
                ✦ Hand Rotations (0 and 7)
              </strong>
              Playing a <strong className="text-[#D4AF37]">0</strong> forces all players to shift their hand to the next player. Playing a <strong className="text-[#D4AF37]">7</strong> triggers a mandatory hand swap with a targeted opponent!
            </div>

            <div>
              <strong className="text-[#F3E5AB] font-serif uppercase tracking-wide block mb-0.5">
                ✦ Action Warfare
              </strong>
              <strong className="text-yellow-400">Discard All</strong> dumps all cards of that color. <strong className="text-yellow-400">Skip Everyone</strong> returns the turn instantly to you! <strong className="text-yellow-400">Color Roulette</strong> forces a player to name a color and draw publicly until they pull it!
            </div>
          </div>

          <div className="mt-auto border-t border-[#D4AF37]/10 pt-3 flex items-center gap-2 justify-center text-[10px] text-stone-400 text-center font-mono">
            <span>🛡️ NO BOTSIM • AUTHENTIC WebRTC CHANNELS OR LOCAL ENGINES</span>
          </div>
        </div>
      </div>
    </div>
  );
}
