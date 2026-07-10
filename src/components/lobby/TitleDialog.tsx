import { X, Check, Coins, Crown } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { TITLES } from "../../config/titles";
import { buyTitle, equipTitle } from "../../firebase/titleService";
import type { FeltColor } from "../../types/theme";

interface TitleDialogProps {
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
export default function TitleDialog({
  open,
  onClose,
  feltColor,
}: TitleDialogProps) {
  const { player, user, refreshPlayer } = useAuth();

  if (!open || !player || !user) return null;

  async function handleTitle(title: string, price: number) {
    if (!player || !user) return;

    const currentPlayer = player;
    const currentUser = user;

    const owned = currentPlayer.ownedTitles.includes(title);

    if (!owned) {
      if (currentPlayer.coins < price) {
        alert("Not enough coins.");
        return;
      }

      await buyTitle(currentUser.uid, title, currentPlayer.coins - price);

      await refreshPlayer();
    }

    await equipTitle(currentUser.uid, title);

    await refreshPlayer();
  }
  const dialogTheme = getDialogTheme(feltColor);
  return (
    <>
      <div onClick={onClose} className="fixed inset-0 bg-black/60 z-50" />

      <div className="fixed inset-0 flex items-center justify-center p-4 z-[60]">
        <div
          className={`w-full max-w-md rounded-xl border border-[#D4AF37]/30 ${dialogTheme} shadow-2xl`}
        >
          <div className="flex items-center justify-between border-b border-[#D4AF37]/20 p-5">
            <div className="flex items-center gap-2">
              <Crown className="text-[#D4AF37]" />
              <h2 className="text-xl font-serif text-[#F3E5AB]">
                Noble Titles
              </h2>
            </div>

            <button onClick={onClose}>
              <X className="text-[#D4AF37]" />
            </button>
          </div>

          <div className="p-5 space-y-4 max-h-[65vh] overflow-y-auto">
            {TITLES.map((title) => {
              const owned = player.ownedTitles.includes(title.id);

              const equipped = player.equippedTitle === title.id;

              return (
                <div
                  key={title.id}
                  className="rounded-lg border border-[#D4AF37]/20 p-4 flex justify-between items-center"
                >
                  <div>
                    <div className="font-semibold">{title.name}</div>

                    {!owned && (
                      <div className="flex items-center gap-1 text-sm text-stone-400">
                        <Coins size={14} />
                        {title.price}
                      </div>
                    )}
                  </div>

                  {equipped ? (
                    <span className="flex items-center gap-1 text-emerald-400">
                      <Check size={16} />
                      Equipped
                    </span>
                  ) : (
                    <button
                      onClick={() => handleTitle(title.id, title.price)}
                      className="rounded-lg bg-[#D4AF37] px-4 py-2 text-black font-semibold"
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
