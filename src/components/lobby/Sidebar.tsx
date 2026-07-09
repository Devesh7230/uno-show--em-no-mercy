import {
  Home,
  User,
  Trophy,
  Coins,
  Palette,
  Smile,
  Mic,
  Medal,
  Settings,
  Info,
  BookOpen,
  X,
  Lock,
} from "lucide-react";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  isGuest: boolean;
}

const items = [
  { icon: Home, label: "Home", locked: false },
  { icon: User, label: "Profile", locked: true },
  { icon: Trophy, label: "Statistics", locked: true },
  { icon: Coins, label: "Coins", locked: true },
  { icon: Palette, label: "Themes", locked: true },
  { icon: Smile, label: "Emoji", locked: true },
  { icon: Mic, label: "Voice Chat", locked: true },
  { icon: Medal, label: "Leaderboard", locked: true },
  { icon: BookOpen, label: "How To Play", locked: false },
  { icon: Settings, label: "Settings", locked: false },
  { icon: Info, label: "About", locked: false },
];

export default function Sidebar({ open, onClose, isGuest }: SidebarProps) {
  return (
    <>
      {/* Overlay */}
      {open && (
        <div onClick={onClose} className="fixed inset-0 bg-black/60 z-40" />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-screen w-[82vw] sm:w-[320px]
        bg-[#082012]
        border-r border-[#D4AF37]/30
        shadow-2xl
        z-50
        transform transition-transform duration-300 ease-in-out
        ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex items-center justify-between p-5 border-b border-[#D4AF37]/20">
          <h2 className="font-serif text-xl text-[#D4AF37]">Royal Menu</h2>

          <button onClick={onClose}>
            <X className="text-[#D4AF37]" />
          </button>
        </div>

        <div className="flex flex-col p-4 gap-2">
          {items.map((item) => {
            const Icon = item.icon;

            return (
              <button
                key={item.label}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-[#D4AF37]/10 transition text-left"
              >
                <div className="flex items-center gap-3">
                  <Icon size={20} className="text-[#D4AF37]" />

                  <span className="text-[#F3E5AB]">{item.label}</span>
                </div>

                {isGuest && item.locked && (
                  <Lock size={15} className="text-stone-500" />
                )}
              </button>
            );
          })}
        </div>
      </aside>
    </>
  );
}
