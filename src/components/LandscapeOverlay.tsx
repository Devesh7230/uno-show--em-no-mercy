import { RotateCw } from 'lucide-react';

export default function LandscapeOverlay() {
  return (
    <div className="portrait-overlay hidden fixed inset-0 bg-[#0A192F] z-[9999] flex-col items-center justify-center p-8 text-center text-[#F4EBD0] font-serif">
      <div className="border-2 border-[#D4AF37] p-8 max-w-md bg-[#093A20] rounded shadow-[0_0_30px_rgba(212,175,55,0.3)] flex flex-col items-center gap-6">
        <div className="text-4xl text-[#D4AF37] animate-bounce">👑</div>
        <h2 className="text-2xl font-bold tracking-wider text-[#D4AF37] uppercase">Rotate Your Device</h2>
        <p className="text-sm font-sans text-stone-300 leading-relaxed">
          UNO Show 'Em No Mercy requires the grand vista of a horizontal layout to arrange your cards and view the royal table. Please turn your phone sideways.
        </p>
        <RotateCw className="w-12 h-12 text-[#D4AF37] animate-spin" style={{ animationDuration: '3s' }} />
        <p className="text-[10px] uppercase tracking-widest text-[#D4AF37]/60 font-mono">
          Strict Landscape Protocol Active
        </p>
      </div>
    </div>
  );
}
