import { X, UserCircle, Coins, Trophy, Palette, Smile } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import type { FeltColor } from "../../types/theme";

interface ProfileDialogProps {
  open: boolean;
  onClose: () => void;
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

export default function ProfileDialog({
  open,
  onClose,
  feltColor,
}: ProfileDialogProps) {
  const { player, logout } = useAuth();

  if (!open || !player) return null;
  const dialogTheme = getDialogTheme(feltColor);
  return (
    <>
      <div onClick={onClose} className="fixed inset-0 bg-black/60 z-50" />

      <div className="fixed inset-0 flex items-center justify-center p-4 z-[60]">
        <div
          className={`w-full max-w-md rounded-xl border border-[#D4AF37]/30 ${getDialogTheme(feltColor)} shadow-2xl`}
        >
          <div className="flex items-center justify-between border-b border-[#D4AF37]/20 p-5">
            <div className="flex items-center gap-3">
              <UserCircle className="text-[#D4AF37]" />
              <h2 className="text-xl font-serif text-[#F3E5AB]">
                Noble Profile
              </h2>
            </div>

            <button onClick={onClose}>
              <X className="text-[#D4AF37]" />
            </button>
          </div>

          <div className="p-5 space-y-4 text-sm">
            <Row title="Username" value={player.username} />

            <Row title="Title" value={player.equippedTitle} />

            <Row
              icon={<Coins size={16} />}
              title="Coins"
              value={player.coins}
            />

            <Row icon={<Trophy size={16} />} title="Wins" value={player.wins} />

            <Row title="Losses" value={player.losses} />

            <Row title="Matches" value={player.totalMatches} />

            <Row
              icon={<Palette size={16} />}
              title="Theme"
              value={player.equippedTheme}
            />

            <div>
              <div className="mb-2 flex items-center gap-2">
                <Smile size={16} />
                Equipped Emojis
              </div>

              <div className="flex gap-2 text-2xl">
                {player.equippedEmojis.map((emoji) => (
                  <span key={emoji}>{emoji}</span>
                ))}
              </div>
            </div>

            <button
              onClick={logout}
              className="w-full rounded-lg border border-red-500 py-3 text-red-400 hover:bg-red-900/20"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

function Row({
  title,
  value,
  icon,
}: {
  title: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex justify-between items-center border-b border-[#D4AF37]/10 pb-2">
      <div className="flex items-center gap-2 text-stone-300">
        {icon}
        {title}
      </div>

      <div className="font-semibold text-[#F3E5AB]">{value}</div>
    </div>
  );
}
