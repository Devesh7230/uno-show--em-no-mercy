import {
  Sparkles,
  Trophy,
  Users,
  ShieldAlert,
  Cpu,
  HeartHandshake,
} from "lucide-react";

interface MenuActionsProps {
  roomCode: string;
  setRoomCode: React.Dispatch<React.SetStateAction<string>>;

  showJoinInput: boolean;
  setShowJoinInput: React.Dispatch<React.SetStateAction<boolean>>;

  errorMsg: string;
  setErrorMsg: React.Dispatch<React.SetStateAction<string>>;

  handleAction: (action: "host" | "join" | "offline" | "passplay") => void;
}

export default function MenuActions({
  roomCode,
  setRoomCode,
  showJoinInput,
  setShowJoinInput,
  errorMsg,
  setErrorMsg,
  handleAction,
}: MenuActionsProps) {
  return (
    <>
      <h2 className="text-lg font-serif uppercase tracking-wider text-[#D4AF37] border-b border-[#D4AF37]/20 pb-1.5 mt-2">
        Choose Match Arena
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Solo Offline vs Bots */}
        <button
          onClick={() => handleAction("offline")}
          className="flex items-center gap-3 bg-gradient-to-r from-[#AA7C11]/30 to-black hover:from-[#D4AF37]/30 border border-[#D4AF37]/60 hover:border-[#D4AF37] rounded px-4 py-3 text-left transition-all duration-300 group cursor-pointer"
        >
          <Cpu className="w-6 h-6 text-[#D4AF37] group-hover:scale-110 transition-transform" />
          <div>
            <div className="font-serif font-bold text-xs md:text-sm text-[#F3E5AB]">
              SOLO VS COURT BOTS
            </div>
            <div className="text-[10px] text-stone-300 font-sans leading-tight">
              Test your skill offline against noble automated AI players
              instantly.
            </div>
          </div>
        </button>

        {/* Pass & Play */}
        <button
          onClick={() => handleAction("passplay")}
          className="flex items-center gap-3 bg-gradient-to-r from-[#AA7C11]/30 to-black hover:from-[#D4AF37]/30 border border-[#D4AF37]/60 hover:border-[#D4AF37] rounded px-4 py-3 text-left transition-all duration-300 group cursor-pointer"
        >
          <HeartHandshake className="w-6 h-6 text-[#D4AF37] group-hover:scale-110 transition-transform" />
          <div>
            <div className="font-serif font-bold text-xs md:text-sm text-[#F3E5AB]">
              PASS & PLAY
            </div>
            <div className="text-[10px] text-stone-300 font-sans leading-tight">
              Gather around! Pass the device in person to battle friends
              locally.
            </div>
          </div>
        </button>

        {/* Host P2P */}
        <button
          onClick={() => handleAction("host")}
          className="flex items-center gap-3 bg-gradient-to-r from-emerald-950/40 to-black hover:from-emerald-900/40 border border-emerald-500/50 hover:border-emerald-400 rounded px-4 py-3 text-left transition-all duration-300 group cursor-pointer"
        >
          <Trophy className="w-6 h-6 text-emerald-400 group-hover:scale-110 transition-transform" />
          <div>
            <div className="font-serif font-bold text-xs md:text-sm text-emerald-400">
              HOST MULTIPLAYER
            </div>
            <div className="text-[10px] text-stone-300 font-sans leading-tight">
              Create a serverless peer-to-peer room code for WebRTC matching.
            </div>
          </div>
        </button>

        {/* Join P2P */}
        <button
          onClick={() => {
            setShowJoinInput(!showJoinInput);
            setErrorMsg("");
          }}
          className="flex items-center gap-3 bg-gradient-to-r from-indigo-950/40 to-black hover:from-indigo-900/40 border border-indigo-500/50 hover:border-indigo-400 rounded px-4 py-3 text-left transition-all duration-300 group cursor-pointer"
        >
          <Users className="w-6 h-6 text-indigo-400 group-hover:scale-110 transition-transform" />
          <div>
            <div className="font-serif font-bold text-xs md:text-sm text-indigo-400">
              JOIN BY ROOM CODE
            </div>
            <div className="text-[10px] text-stone-300 font-sans leading-tight">
              Enter a peer's 4-character room code to sit at their table.
            </div>
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
                setRoomCode(
                  e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""),
                );
                setErrorMsg("");
              }}
              className="w-24 text-center font-mono text-lg font-bold tracking-widest bg-[#1A0E04] border border-[#D4AF37]/60 rounded py-1 text-[#D4AF37] uppercase focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
            />
            <button
              onClick={() => handleAction("join")}
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
    </>
  );
}
