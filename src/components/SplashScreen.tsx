import type { FeltColor } from "../types/theme";

export default function SplashScreen() {
  const cached = localStorage.getItem("player");

  const theme: FeltColor = cached
    ? (JSON.parse(cached).equippedTheme as FeltColor)
    : "emerald";

  const bg =
    theme === "emerald"
      ? "bg-felt-emerald"
      : theme === "burgundy"
        ? "bg-felt-burgundy"
        : "bg-felt-navy";

  return (
    <div
      className={`fixed inset-0 flex flex-col items-center justify-center ${bg} text-[#D4AF37]`}
    >
      <h1 className="font-serif text-5xl md:text-7xl tracking-wide">
        UNO NO MERCY
      </h1>

      <p className="mt-4 text-sm md:text-base uppercase tracking-[0.4em] text-[#F3E5AB]/80">
        Loading Royal Salon...
      </p>

      <div className="mt-10 h-1 w-56 overflow-hidden rounded bg-[#D4AF37]/20">
        <div className="h-full w-1/2 animate-pulse bg-[#D4AF37]" />
      </div>
    </div>
  );
}
