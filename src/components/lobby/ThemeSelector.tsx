import type { FeltColor } from "../../types/theme";

interface ThemeSelectorProps {
  feltColor: FeltColor;
  setFeltColor: React.Dispatch<React.SetStateAction<FeltColor>>;
}

export default function ThemeSelector({
  feltColor,
  setFeltColor,
}: ThemeSelectorProps) {
  const themes: {
    id: FeltColor;
    label: string;
    color: string;
  }[] = [
    {
      id: "emerald",
      label: "Deep Emerald",
      color: "bg-emerald-800 border-emerald-500",
    },
    {
      id: "burgundy",
      label: "Rich Burgundy",
      color: "bg-red-900 border-red-500",
    },
    {
      id: "navy",
      label: "Royal Navy",
      color: "bg-slate-900 border-indigo-500",
    },
  ];

  return (
    <div className="mt-2">
      <span className="text-[10px] uppercase tracking-wider text-stone-300 font-mono block mb-1.5">
        Select Salon Velvet Wallpaper
      </span>

      <div className="flex gap-3">
        {themes.map((style) => (
          <button
            key={style.id}
            onClick={() => setFeltColor(style.id)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-mono border cursor-pointer transition-all ${
              feltColor === style.id
                ? "border-[#D4AF37] text-[#D4AF37] scale-105 shadow-[0_0_8px_rgba(212,175,55,0.4)] bg-black/40"
                : "border-stone-600 text-stone-400 bg-black/20 hover:text-stone-300"
            }`}
          >
            <span className={`w-2.5 h-2.5 rounded-full ${style.color}`} />
            {style.label}
          </button>
        ))}
      </div>
    </div>
  );
}
