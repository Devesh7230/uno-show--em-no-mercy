import type { FeltColor } from "../../types/theme";
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
  feltColor: FeltColor;
}

const guestItems = [
  { icon: User, label: "Login" },
  { icon: User, label: "Create Account" },

  { icon: Medal, label: "Leaderboard" },
  { icon: BookOpen, label: "How To Play" },
  { icon: Info, label: "About Game" },
  { icon: Settings, label: "Settings" },
];

const playerItems = [
  { icon: Home, label: "Home" },

  { icon: User, label: "Profile" },
  { icon: Trophy, label: "Statistics" },
  { icon: Medal, label: "Leaderboard" },

  { icon: Trophy, label: "Achievements" },
  { icon: User, label: "Friends" },

  { icon: Settings, label: "Settings" },
  { icon: BookOpen, label: "How To Play" },
  { icon: Info, label: "About Game" },

  { icon: Lock, label: "Logout" },
];
function getSidebarThemeClasses(feltColor: FeltColor) {
  switch (feltColor) {
    case "emerald":
      return {
        background: "bg-[#082012]",
        border: "border-emerald-700/40",
      };

    case "burgundy":
      return {
        background: "bg-[#2B0A11]",
        border: "border-red-800/40",
      };

    case "navy":
      return {
        background: "bg-[#081728]",
        border: "border-blue-800/40",
      };
  }
}
export default function Sidebar({
  open,
  onClose,
  isGuest,
  feltColor,
}: SidebarProps) {
  const theme = getSidebarThemeClasses(feltColor);
  return (
    <>
      {/* Overlay */}
      {open && (
        <div onClick={onClose} className="fixed inset-0 bg-black/60 z-40" />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-screen w-[82vw] sm:w-[320px]
          ${theme.background}
          border-r ${theme.border}
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
          {(isGuest ? guestItems : playerItems).map((item) => {
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
              </button>
            );
          })}
        </div>
      </aside>
    </>
  );
}
