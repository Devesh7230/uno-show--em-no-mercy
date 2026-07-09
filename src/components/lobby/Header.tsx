import { Sparkles, Menu, UserCircle, Maximize } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

interface HeaderProps {
  onFullscreen: () => void;
  onMenu: () => void;
  onGuest: () => void;
}

export default function Header({ onFullscreen, onMenu, onGuest }: HeaderProps) {
  const { player } = useAuth();
  return (
    <header className="w-full max-w-4xl flex items-center justify-between mb-5">
      {/* LEFT */}
      <button
        onClick={onMenu}
        className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[#D4AF37]/40 bg-black/30 hover:bg-black/50 transition cursor-pointer"
      >
        <Menu className="w-5 h-5 text-[#D4AF37]" />
        <span className="hidden md:block text-sm font-serif text-[#F3E5AB]">
          Menu
        </span>
      </button>

      {/* CENTER */}
      <div className="flex flex-col items-center">
        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-[#D4AF37]/80">
          <Sparkles className="w-3 h-3" />
          The Royal Card Room
          <Sparkles className="w-3 h-3" />
        </div>

        <h1 className="text-3xl md:text-5xl font-serif font-extrabold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-[#F3E5AB] via-[#D4AF37] to-[#AA7C11]">
          UNO NO MERCY
        </h1>

        <p className="text-[10px] md:text-xs italic text-[#D4AF37]/70 uppercase tracking-widest">
          Show 'Em No Mercy • Royal Salon Edition
        </p>
      </div>

      {/* RIGHT */}
      <div className="flex items-center gap-2">
        <button
          onClick={onFullscreen}
          className="p-2 rounded-lg border border-[#D4AF37]/40 bg-black/30 hover:bg-black/50 transition cursor-pointer"
        >
          <Maximize className="w-5 h-5 text-[#D4AF37]" />
        </button>

        <button
          onClick={onGuest}
          className="flex flex-col items-center gap-2 px-3 py-2 rounded-lg border border-[#D4AF37]/40 bg-black/30 hover:bg-black/50 transition cursor-pointer"
        >
          {player ? (
            <>
              <span className="font-bold text-[#F4EBD0]">
                {player.username}
              </span>

              <span className="text-xs text-[#D4AF37]">
                {player.equippedTitle}
              </span>
            </>
          ) : (
            <>
              <span className="font-bold text-[#F4EBD0]">Guest Noble</span>

              <span className="text-xs text-stone-400">Continue as Guest</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
}
