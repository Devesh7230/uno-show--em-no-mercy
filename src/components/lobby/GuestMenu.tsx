import {
  UserCircle,
  LogIn,
  UserPlus,
  Cloud,
  Trophy,
  Palette,
  Mic,
  Smile,
  Award,
} from "lucide-react";
import { logout } from "../../firebase/auth";
import { useAuth } from "../../contexts/AuthContext";
import { LogOut } from "lucide-react";
import type { FeltColor } from "../../types/theme";
interface GuestMenuProps {
  open: boolean;
  onClose: () => void;
  onLogin: () => void;
  onSignup: () => void;
  onProfile: () => void;
  onThemes: () => void;
  onTitles: () => void;
  onEmojis: () => void;
  feltColor: FeltColor;
}
function getDialogTheme(feltColor: FeltColor) {
  switch (feltColor) {
    case "emerald":
      return "bg-[#082012]";

    case "burgundy":
      return "bg-[#2B0A11]";

    case "navy":
      return "bg-[#081728]";
  }
}
export default function GuestMenu({
  open,
  onClose,
  onLogin,
  onSignup,
  onProfile,
  onTitles,
  onThemes,
  onEmojis,
  feltColor,
}: GuestMenuProps) {
  const { player } = useAuth();

  if (!open) return null;
  const dialogTheme = getDialogTheme(feltColor);
  return (
    <>
      {/* Overlay */}
      <div onClick={onClose} className="fixed inset-0 z-40" />

      {/* Dropdown */}
      <div
        className="
          absolute
          top-20
          right-4
          w-80
          max-w-[92vw]
          ${dialogTheme}
          border
          border-[#D4AF37]/30
          rounded-xl
          shadow-2xl
          z-50
          overflow-hidden
        "
      >
        {/* ================= HEADER ================= */}

        <div className="p-5 border-b border-[#D4AF37]/20">
          {player ? (
            <div className="flex items-center gap-4">
              <UserCircle size={52} className="text-[#D4AF37]" />

              <div className="flex flex-col">
                <span className="text-lg font-bold text-[#F4EBD0]">
                  {player.username}
                </span>

                <span className="text-sm text-[#D4AF37]">
                  {player.equippedTitle}
                </span>

                <span className="text-sm text-stone-300 mt-1">
                  💰 {player.coins} Coins
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <UserCircle size={52} className="text-[#D4AF37]" />

              <div className="flex flex-col">
                <span className="text-lg font-bold">Guest Noble</span>

                <span className="text-sm text-stone-400">
                  Continue as Guest
                </span>
              </div>
            </div>
          )}
        </div>

        {/* ================= MENU ================= */}

        <div className="p-3 space-y-2">
          {!player && (
            <>
              <MenuButton
                icon={<LogIn size={20} />}
                text="Login"
                onClick={() => {
                  onClose();
                  onLogin();
                }}
              />

              <MenuButton
                icon={<UserPlus size={20} />}
                text="Create Account"
                onClick={() => {
                  onClose();
                  onSignup();
                }}
              />
            </>
          )}

          {player && (
            <>
              <MenuButton
                onClick={() => {
                  onClose();
                  onProfile();
                }}
                icon={<UserCircle size={20} />}
                text="Profile"
              />

              <MenuButton
                onClick={() => {
                  onClose();
                  onTitles();
                }}
                icon={<Award size={20} />}
                text="Title Shop"
              />

              <MenuButton
                onClick={() => {
                  onClose();
                  onThemes();
                }}
                icon={<Palette size={20} />}
                text="Theme Shop"
              />

              <MenuButton
                onClick={() => {
                  onClose();
                  onEmojis();
                }}
                icon={<Smile size={20} />}
                text="Emoji Shop"
              />

              <MenuButton icon={<Trophy size={20} />} text="Statistics" />

              <MenuButton
                icon={<LogOut size={20} />}
                text="Logout"
                onClick={async () => {
                  await logout();
                  onClose();
                }}
              />
            </>
          )}
        </div>

        <div className="border-t border-[#D4AF37]/20" />

        {/* ================= EXTRA ================= */}

        <div className="p-4">
          <div className="text-xs uppercase tracking-widest text-stone-400 mb-3">
            {player ? "Royal Features" : "Available After Login"}
          </div>

          <div className="space-y-2">
            <Feature icon={<Cloud size={18} />} text="Cloud Save" />

            <Feature icon={<Trophy size={18} />} text="Statistics" />

            <Feature icon={<Palette size={18} />} text="Themes" />

            <Feature icon={<Mic size={18} />} text="Voice Chat" />
          </div>
        </div>
      </div>
    </>
  );
}

/* ===================================================== */

function MenuButton({
  icon,
  text,
  onClick,
}: {
  icon: React.ReactNode;
  text: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="
        w-full
        flex
        items-center
        gap-3
        rounded-lg
        p-3
        hover:bg-[#D4AF37]/10
        transition
        text-left
      "
    >
      <span className="text-[#D4AF37]">{icon}</span>

      <span>{text}</span>
    </button>
  );
}

/* ===================================================== */

function Feature({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-3 text-stone-500">
      <span className="text-[#D4AF37]">{icon}</span>

      {text}
    </div>
  );
}
