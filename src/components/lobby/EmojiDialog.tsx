import { X, Check, Coins, Smile } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { EMOJIS } from "../../config/emojis";
import { buyEmoji, equipEmojis } from "../../firebase/emojiService";
import type { FeltColor } from "../../types/theme";
interface EmojiDialogProps {
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

export default function EmojiDialog({
  open,
  onClose,
  feltColor,
}: EmojiDialogProps) {
  const { player, user, refreshPlayer } = useAuth();

  if (!open || !player || !user) return null;

  async function handleEmoji(emoji: string, price: number) {
    if (!player || !user) return;
    const currentPlayer = player;
    const currentUser = user;

    const owned = currentPlayer.emojisUnlocked.includes(emoji);

    // Buy
    if (!owned) {
      if (currentPlayer.coins < price) {
        alert("Not enough coins.");
        return;
      }

      await buyEmoji(currentUser.uid, emoji, currentPlayer.coins - price);

      await refreshPlayer();
      return;
    }

    let equipped = [...currentPlayer.equippedEmojis];

    // Unequip
    if (equipped.includes(emoji)) {
      equipped = equipped.filter((e) => e !== emoji);
    }
    // Equip
    else {
      if (equipped.length >= 5) {
        alert("You can equip only 5 emojis.");
        return;
      }

      equipped.push(emoji);
    }

    await equipEmojis(currentUser.uid, equipped);

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
          {/* Header */}

          <div className="flex items-center justify-between border-b border-[#D4AF37]/20 p-5">
            <div className="flex items-center gap-2">
              <Smile className="text-[#D4AF37]" />

              <h2 className="font-serif text-xl text-[#F3E5AB]">
                Royal Emojis
              </h2>
            </div>

            <button onClick={onClose}>
              <X className="text-[#D4AF37]" />
            </button>
          </div>

          {/* List */}

          <div className="max-h-[65vh] overflow-y-auto p-5 space-y-3">
            {EMOJIS.map((item) => {
              const owned = player.emojisUnlocked.includes(item.emoji);

              const equipped = player.equippedEmojis.includes(item.emoji);

              return (
                <div
                  key={item.emoji}
                  className="flex items-center justify-between rounded-lg border border-[#D4AF37]/20 p-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-3xl">{item.emoji}</div>

                    <div>
                      {!owned && (
                        <div className="flex items-center gap-1 text-sm text-stone-400">
                          <Coins size={14} />
                          {item.price}
                        </div>
                      )}
                    </div>
                  </div>

                  {equipped ? (
                    <button
                      onClick={() => handleEmoji(item.emoji, item.price)}
                      className="flex items-center gap-1 rounded bg-emerald-600 px-3 py-2 text-sm"
                    >
                      <Check size={16} />
                      Equipped
                    </button>
                  ) : (
                    <button
                      onClick={() => handleEmoji(item.emoji, item.price)}
                      className="rounded bg-[#D4AF37] px-4 py-2 font-semibold text-black"
                    >
                      {owned ? "Equip" : "Buy"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Footer */}

          <div className="border-t border-[#D4AF37]/20 p-4 text-center text-sm text-stone-400">
            Equipped {player.equippedEmojis.length} / 5
          </div>
        </div>
      </div>
    </>
  );
}
