import { Copy, Users, Crown, CheckCircle, Clock, XSquare } from 'lucide-react';
import { Player } from '../types';
import { useState } from 'react';

interface LobbyProps {
  roomCode: string;
  players: Player[];
  myPeerId: string;
  isHost: boolean;
  onStartGame: () => void;
  onToggleReady: () => void;
  onLeaveLobby: () => void;
  onKickPlayer?: (playerId: string) => void;
}

export default function Lobby({
  roomCode,
  players,
  myPeerId,
  isHost,
  onStartGame,
  onToggleReady,
  onLeaveLobby,
  onKickPlayer,
}: LobbyProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const localPlayer = players.find((p) => p.id === myPeerId);
  const isReady = localPlayer?.isReady || false;

  // Let's count who is ready
  const readyCount = players.filter((p) => p.isReady || p.isHost).length;
  const canStart = players.length >= 2; // Needs at least 2 players to start a game

  return (
    <div className="w-full h-screen overflow-y-auto flex flex-col justify-center items-center p-4 md:p-6 text-[#F4EBD0] relative select-none">
      
      <div className="w-full max-w-2xl border-2 border-[#D4AF37] bg-black/55 p-5 md:p-6 rounded shadow-[0_0_30px_rgba(212,175,55,0.25)] relative">
        {/* Double thin golden foil lines */}
        <div className="absolute inset-1 border border-[#D4AF37]/35 rounded pointer-events-none" />

        {/* Header */}
        <div className="text-center mb-5 relative z-10 border-b border-[#D4AF37]/20 pb-4">
          <div className="text-[10px] uppercase tracking-[0.35em] text-[#D4AF37] mb-1">
            Establishing WebRTC Court Room
          </div>
          <h2 className="text-xl md:text-2xl font-serif tracking-widest text-[#F3E5AB]">
            ROYAL SALON LOBBY
          </h2>
        </div>

        {/* Room Code Showcase */}
        <div className="bg-[#1A0E04] border border-[#D4AF37]/40 rounded p-4 mb-5 flex flex-col md:flex-row items-center justify-between gap-4 relative">
          <div className="text-center md:text-left">
            <span className="text-[10px] uppercase tracking-wider text-stone-400 font-mono block">
              Share Room Code
            </span>
            <span className="text-3xl font-mono font-extrabold text-[#D4AF37] tracking-[0.2em] select-all">
              {roomCode}
            </span>
          </div>

          <button
            onClick={handleCopy}
            className="flex items-center gap-2 bg-[#D4AF37] hover:bg-yellow-500 text-[#093A20] font-serif font-bold text-xs py-2 px-4 rounded tracking-wider transition-all shadow-md cursor-pointer"
          >
            <Copy className="w-3.5 h-3.5" />
            {copied ? 'COPIED!' : 'COPY CODE'}
          </button>
        </div>

        {/* Player List */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-xs font-mono text-stone-300 border-b border-[#D4AF37]/10 pb-2 mb-2">
            <span className="flex items-center gap-1.5 uppercase tracking-wider text-[#D4AF37]">
              <Users className="w-3.5 h-3.5" /> Present Courtiers ({players.length})
            </span>
            <span className="uppercase tracking-wider">
              {readyCount} / {players.length} Ready
            </span>
          </div>

          <div className="flex flex-col gap-2 max-h-[160px] overflow-y-auto pr-1">
            {players.map((player) => {
              const isSelf = player.id === myPeerId;
              return (
                <div
                  key={player.id}
                  className={`flex items-center justify-between px-3 py-2 rounded border transition-colors ${
                    isSelf
                      ? 'bg-[#D4AF37]/10 border-[#D4AF37]/50'
                      : 'bg-black/30 border-stone-800'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {player.isHost ? (
                      <Crown className="w-4 h-4 text-[#D4AF37] fill-[#D4AF37]/20" />
                    ) : (
                      <div className="w-2 h-2 rounded-full bg-stone-500" />
                    )}
                    <span className="font-serif text-sm font-semibold text-[#F4EBD0]">
                      {player.name} {isSelf && <span className="text-[10px] text-[#D4AF37]/80 font-mono">(You)</span>}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    {player.isHost ? (
                      <span className="text-[10px] font-mono text-[#D4AF37] bg-[#D4AF37]/10 px-2 py-0.5 rounded border border-[#D4AF37]/30 uppercase tracking-wider">
                        Grand Host
                      </span>
                    ) : player.isReady ? (
                      <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-mono uppercase tracking-wider bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                        <CheckCircle className="w-3 h-3" /> Ready
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[10px] text-amber-500 font-mono uppercase tracking-wider bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                        <Clock className="w-3 h-3 animate-pulse" /> Pending
                      </span>
                    )}

                    {/* Kick Button for Host */}
                    {isHost && !player.isHost && onKickPlayer && (
                      <button
                        onClick={() => onKickPlayer(player.id)}
                        title="Kick player"
                        className="text-rose-400 hover:text-rose-300 cursor-pointer p-0.5 hover:bg-rose-500/10 rounded transition-colors"
                      >
                        <XSquare className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Actions Bar */}
        <div className="flex flex-col md:flex-row gap-3 border-t border-[#D4AF37]/20 pt-4 mt-4">
          <button
            onClick={onLeaveLobby}
            className="flex-1 text-center border border-rose-500/40 hover:border-rose-400 bg-rose-950/10 text-rose-300 font-serif font-bold text-xs py-2 px-4 rounded tracking-wider transition-colors cursor-pointer uppercase"
          >
            Leave Salon
          </button>

          {!isHost && (
            <button
              onClick={onToggleReady}
              className={`flex-1 text-center font-serif font-bold text-xs py-2 px-4 rounded tracking-wider transition-all uppercase cursor-pointer ${
                isReady
                  ? 'bg-amber-600 hover:bg-amber-500 text-[#1A0E04]'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-[#F4EBD0]'
              }`}
            >
              {isReady ? 'UNREADY MYSELF' : 'PROCLAIM READY'}
            </button>
          )}

          {isHost && (
            <button
              disabled={!canStart}
              onClick={onStartGame}
              className={`flex-1 text-center font-serif font-bold text-xs py-2 px-4 rounded tracking-wider transition-all uppercase cursor-pointer ${
                canStart
                  ? 'bg-[#D4AF37] hover:bg-yellow-500 text-[#093A20] shadow-[0_0_15px_rgba(212,175,55,0.4)]'
                  : 'bg-stone-800 text-stone-500 border border-stone-700 cursor-not-allowed'
              }`}
            >
              {canStart ? 'START THE MATCH' : 'Awaiting Opponents...'}
            </button>
          )}
        </div>

        {!canStart && isHost && (
          <p className="text-center text-[10px] font-mono text-stone-400 mt-3 animate-pulse">
            ⚠️ NEED AT LEAST 2 COURTIERS TO DEAL THE DECK
          </p>
        )}
      </div>
    </div>
  );
}
