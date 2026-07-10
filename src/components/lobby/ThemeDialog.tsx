import { X, Check, Coins } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { THEMES } from "../../config/themes";
import { buyTheme, equipTheme } from "../../firebase/themeService";
import type { FeltColor } from "../../types/theme";

interface ThemeDialogProps {
  open: boolean;
  onClose: () => void;
  feltColor: FeltColor;
}

export default function ThemeDialog({
  open,
  onClose,
  feltColor,
}: ThemeDialogProps) {
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
  const { player, user, refreshPlayer } = useAuth();

  if (!open || !player || !user) return null;

  async function handleTheme(themeId: FeltColor, price: number) {
    if (!player || !user) return;
    const owned = player.ownedThemes.includes(themeId);

    if (!owned) {
      if (player.coins < price) {
        alert("Not enough coins.");
        return;
      }

      await buyTheme(user.uid, themeId, player.coins - price);
    }

    await equipTheme(user.uid, themeId);
    await refreshPlayer();
  }
  const dialogTheme = getDialogTheme(feltColor);
  return (
    <>
      <div onClick={onClose} className="fixed inset-0 bg-black/60 z-50" />

      <div className="fixed inset-0 flex items-center justify-center p-4 z-[60]">
        <div className={`w-full max-w-md rounded-xl ${dialogTheme} border border-[#D4AF37]/30 shadow-2xl`}>
          <div className="flex items-center justify-between p-5 border-b border-[#D4AF37]/20">
            <h2 className="text-xl font-serif text-[#F3E5AB]">Themes</h2>

            <button onClick={onClose}>
              <X className="text-[#D4AF37]" />
            </button>
          </div>

          <div className="p-5 space-y-4">
            {THEMES.map((theme) => {
              const owned = player.ownedThemes.includes(theme.id);

              const equipped = player.equippedTheme === theme.id;

              return (
                <div
                  key={theme.id}
                  className="rounded-lg border border-[#D4AF37]/20 p-4 flex justify-between items-center"
                >
                  <div>
                    <div className="font-semibold">{theme.name}</div>

                    {!owned && (
                      <div className="text-sm text-stone-400 flex items-center gap-1">
                        <Coins size={14} />
                        {theme.price}
                      </div>
                    )}
                  </div>

                  {equipped ? (
                    <span className="text-emerald-400 flex items-center gap-1">
                      <Check size={16} />
                      Equipped
                    </span>
                  ) : (
                    <button
                      onClick={() => handleTheme(theme.id, theme.price)}
                      className="rounded-lg bg-[#D4AF37] text-black px-4 py-2 font-semibold"
                    >
                      {owned ? "Equip" : "Buy"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
