import { CSSProperties } from 'react';
import { Card } from '../types';
import { getColorClass, getCardLabel } from '../utils/game';

interface CardItemProps {
  card: Card;
  size?: 'sm' | 'md' | 'lg' | 'pile';
  onClick?: () => void;
  disabled?: boolean;
  angle?: number; // rotation in degrees for beautiful fan layout
  translateY?: number; // y-offset for fan layout
  isPlayable?: boolean;
}

export default function CardItem({
  card,
  size = 'md',
  onClick,
  disabled = false,
  angle = 0,
  translateY = 0,
  isPlayable = false,
}: CardItemProps) {
  // Styles for different sizes
  const sizeStyles = {
    sm: 'w-10 h-14 text-[9px] rounded-sm border',
    md: 'w-16 h-24 text-xs rounded border-2',
    lg: 'w-24 h-36 text-base rounded-md border-2 shadow-lg',
    pile: 'w-24 h-36 text-base rounded-md border-2 shadow-xl',
  };

  const colorClass = getColorClass(card.color);
  const isWild = card.color === 'wild';

  // Inner icon/badge representation
  const renderCardContent = () => {
    switch (card.type) {
      case 'number':
        return (
          <span className="font-serif font-bold text-lg md:text-3xl tracking-tight">
            {card.value}
          </span>
        );
      case 'draw_2':
        return <span className="font-serif font-bold tracking-tighter text-base md:text-2xl">+2</span>;
      case 'draw_4':
        return <span className="font-serif font-bold tracking-tighter text-base md:text-2xl">+4</span>;
      case 'draw_6':
        return <span className="font-serif font-bold tracking-tighter text-base md:text-2xl">+6</span>;
      case 'draw_10':
        return <span className="font-serif font-bold tracking-tighter text-base md:text-2xl">+10</span>;
      case 'skip':
        return <span className="font-serif text-[10px] md:text-sm font-semibold tracking-wider">SKIP</span>;
      case 'skip_everyone':
        return (
          <span className="font-serif text-[8px] md:text-[11px] font-extrabold tracking-tight leading-none text-center px-1">
            SKIP ALL
          </span>
        );
      case 'reverse':
        return <span className="font-serif text-[10px] md:text-sm font-semibold tracking-wider">REV</span>;
      case 'discard_all':
        return (
          <span className="font-serif text-[8px] md:text-[10px] font-bold text-center leading-none px-1 uppercase">
            DISCARD<br/>ALL
          </span>
        );
      case 'wild_standard':
        return <span className="font-serif text-xs md:text-sm font-bold tracking-widest text-[#D4AF37]">WILD</span>;
      case 'wild_draw_6':
        return <span className="font-serif text-xs md:text-sm font-bold text-[#D4AF37]">+6 WILD</span>;
      case 'wild_draw_10':
        return (
          <span className="font-serif text-xs md:text-sm font-extrabold text-[#D4AF37] animate-pulse">
            +10 WILD
          </span>
        );
      case 'wild_reverse_draw_4':
        return (
          <span className="font-serif text-[9px] md:text-[11px] font-bold text-[#D4AF37] text-center leading-none">
            REV +4
          </span>
        );
      case 'wild_roulette':
        return (
          <span className="font-serif text-[9px] md:text-[10px] font-bold text-center leading-none text-[#D4AF37] tracking-tighter animate-pulse">
            ROULETTE
          </span>
        );
      default:
        return <span>UNO</span>;
    }
  };

  // Compute rotation & transformation inline for fan layout
  const style: CSSProperties = {
    transform: `rotate(${angle}deg) translateY(${translateY}px)`,
    transformOrigin: 'bottom center',
    transition: 'transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.2s ease',
  };

  return (
    <div
      onClick={!disabled && onClick ? onClick : undefined}
      style={style}
      id={`card-${card.id}`}
      className={`
        relative flex flex-col items-center justify-between p-1.5 md:p-3 select-none cursor-pointer
        ${sizeStyles[size]}
        ${colorClass}
        ${isPlayable ? 'ring-4 ring-yellow-400 scale-105 z-10' : ''}
        ${disabled ? 'opacity-60 cursor-not-allowed filter grayscale-[15%]' : 'gold-glow-hover'}
        border-solid
      `}
    >
      {/* Tiny corner indicators */}
      <div className="absolute top-1 left-1.5 font-mono text-[9px] md:text-xs font-bold uppercase tracking-tighter flex flex-col items-center leading-none">
        {card.type.startsWith('wild') ? (
          <span className="text-[#D4AF37]">👑</span>
        ) : card.type.includes('draw') ? (
          <span>+{getCardLabel(card).split('+')[1] || 'D'}</span>
        ) : card.type === 'number' ? (
          <span>{card.value}</span>
        ) : (
          <span className="scale-75">✦</span>
        )}
      </div>

      {/* Center Circle with Luxury Frame */}
      <div className="my-auto flex items-center justify-center rounded-full border border-yellow-500/30 w-11 h-11 md:w-16 md:h-16 bg-black/10 shadow-inner">
        {renderCardContent()}
      </div>

      {/* Tiny bottom mirror corner indicator */}
      <div className="absolute bottom-1 right-1.5 font-mono text-[9px] md:text-xs font-bold uppercase tracking-tighter rotate-180 flex flex-col items-center leading-none">
        {card.type.startsWith('wild') ? (
          <span className="text-[#D4AF37]">👑</span>
        ) : card.type.includes('draw') ? (
          <span>+{getCardLabel(card).split('+')[1] || 'D'}</span>
        ) : card.type === 'number' ? (
          <span>{card.value}</span>
        ) : (
          <span className="scale-75">✦</span>
        )}
      </div>

      {/* Double thin golden foil lines */}
      <div className="absolute inset-0.5 border border-[#D4AF37]/35 rounded pointer-events-none" />
      
      {/* Playable gold sparkle overlay */}
      {isPlayable && (
        <div className="absolute inset-0 border border-yellow-300 rounded pointer-events-none animate-pulse" />
      )}
    </div>
  );
}
