import { ShieldAlert } from "lucide-react";
export default function RulesPanel() {
  return (
    <>
      {/* Right Column: Rule Sheet */}
      <div className="lg:col-span-5 flex flex-col gap-4 border border-[#D4AF37]/30 bg-black/45 p-4 md:p-6 rounded shadow-[0_0_20px_rgba(0,0,0,0.5)]">
        <h2 className="text-lg font-serif uppercase tracking-wider text-[#D4AF37] border-b border-[#D4AF37]/20 pb-1.5 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-[#D4AF37]" />
          Rules of Engagement
        </h2>

        <div className="flex flex-col gap-3 font-sans text-xs text-stone-300 leading-relaxed overflow-y-auto max-h-[220px] pr-1">
          <div>
            <strong className="text-[#F3E5AB] font-serif uppercase tracking-wide block mb-0.5">
              ✦ Infinite Draw Protocol
            </strong>
            If you have no playable cards on your turn, you must draw from the
            draw pile <em className="text-[#D4AF37]">until</em> you draw a
            legally playable card. Hands will grow with alarming speed!
          </div>

          <div>
            <strong className="text-[#F3E5AB] font-serif uppercase tracking-wide block mb-0.5">
              ✦ Merciless Stacking Rule
            </strong>
            Any draw-penalty card (+2, +4, +6, +10, etc.) can be stacked. You
            can ONLY stack if you play a Draw card of{" "}
            <strong className="text-[#D4AF37]">equal or greater</strong> value
            (e.g. play a +6 on top of a +4). Otherwise, you draw the cumulative
            sum!
          </div>

          <div>
            <strong className="text-[#F3E5AB] font-serif uppercase tracking-wide block mb-0.5">
              ✦ The 25-Card Mercy Threshold
            </strong>
            If your hand swell to{" "}
            <strong className="text-red-400">25 cards or more</strong>, you are
            instantly declared bankrupt &amp;{" "}
            <strong className="text-red-400">KNOCKED OUT</strong> of the match.
            Your remaining cards are removed.
          </div>

          <div>
            <strong className="text-[#F3E5AB] font-serif uppercase tracking-wide block mb-0.5">
              ✦ Hand Rotations (0 and 7)
            </strong>
            Playing a <strong className="text-[#D4AF37]">0</strong> forces all
            players to shift their hand to the next player. Playing a{" "}
            <strong className="text-[#D4AF37]">7</strong> triggers a mandatory
            hand swap with a targeted opponent!
          </div>

          <div>
            <strong className="text-[#F3E5AB] font-serif uppercase tracking-wide block mb-0.5">
              ✦ Action Warfare
            </strong>
            <strong className="text-yellow-400">Discard All</strong> dumps all
            cards of that color.{" "}
            <strong className="text-yellow-400">Skip Everyone</strong> returns
            the turn instantly to you!{" "}
            <strong className="text-yellow-400">Color Roulette</strong> forces a
            player to name a color and draw publicly until they pull it!
          </div>
        </div>

        <div className="mt-auto border-t border-[#D4AF37]/10 pt-3 flex items-center gap-2 justify-center text-[10px] text-stone-400 text-center font-mono">
          <span>🛡️ NO BOTSIM • AUTHENTIC WebRTC CHANNELS OR LOCAL ENGINES</span>
        </div>
      </div>
    </>
  );
}
