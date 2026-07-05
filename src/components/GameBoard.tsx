import { useState, useEffect, useRef } from 'react';
import { Maximize2, RotateCw, AlertTriangle, Volume2, VolumeX, Swords, Crown, Skull, Scroll } from 'lucide-react';
import { Card, Player, GameState, CardColor } from '../types';
import { canPlayCard, getCardLabel, isDrawCard } from '../utils/game';
import CardItem from './CardItem';
import { playSnap, playSwoosh, playChime, playGong } from '../utils/audio';

interface GameBoardProps {
  gameState: GameState;
  myPeerId: string;
  isHost: boolean;
  onPlayCard: (cardId: string, chosenColor: CardColor, targetPlayerId?: string) => void;
  onDrawCard: () => void;
  onAcceptPenalty: () => void;
  onYellUno: () => void;
  onChallengeUno: (targetPlayerId: string) => void;
  onSelectSwapTarget: (targetPlayerId: string) => void;
  onSelectRouletteParams: (targetPlayerId: string, chosenColor: CardColor) => void;
  onExitGame: () => void;
  isSoundOn: boolean;
  setIsSoundOn: (val: boolean) => void;
}

const getNobleTitle = (name: string, isHost: boolean) => {
  if (isHost) return 'Grand Sovereign';
  const titles = [
    'Archduke',
    'Viscount',
    'Baron',
    'Marquess',
    'Earl of Clover',
    'Lord Regent',
    'Countess',
    'Knight Commander',
    'High Chancellor'
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % titles.length;
  return titles[index];
};

export default function GameBoard({
  gameState,
  myPeerId,
  isHost,
  onPlayCard,
  onDrawCard,
  onAcceptPenalty,
  onYellUno,
  onChallengeUno,
  onSelectSwapTarget,
  onSelectRouletteParams,
  onExitGame,
  isSoundOn,
  setIsSoundOn,
}: GameBoardProps) {
  const [selectedWildCard, setSelectedWildCard] = useState<Card | null>(null);
  const [showSwapModal, setShowSwapModal] = useState(false);
  const [showRouletteModal, setShowRouletteModal] = useState(false);
  const [rouletteSelectedPlayerId, setRouletteSelectedPlayerId] = useState<string>('');
  
  const logEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll game logs
  useEffect(() => {
    if (logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [gameState.log]);

  const localPlayer = gameState.players.find((p) => p.id === myPeerId);
  const isMyTurn = gameState.players[gameState.currentTurnIndex]?.id === myPeerId;
  const isSpectating = !localPlayer || localPlayer.isKnockedOut;

  const topDiscard = gameState.discardPile[gameState.discardPile.length - 1];
  const playableHandCards = localPlayer?.cards.filter((card) =>
    canPlayCard(card, topDiscard, gameState.activeColor, gameState.stackCount)
  ) ?? [];
  const hasPlayableHandCard = playableHandCards.length > 0;

  // Colors list for Wild modal
  const wildColors: Exclude<CardColor, 'wild'>[] = ['red', 'blue', 'green', 'yellow'];

  const handleEnterFullscreen = () => {
    const root = document.documentElement;
    if (!document.fullscreenElement && root.requestFullscreen) {
      root.requestFullscreen().catch(() => {});
    }
  };

  // Handle card click
  const handleCardClick = (card: Card) => {
    if (!isMyTurn || isSpectating) return;

    // Check if card is legally playable
    const playable = canPlayCard(card, topDiscard, gameState.activeColor, gameState.stackCount);
    if (!playable) return;

    if (card.color === 'wild') {
      // Open Wild Color picker
      setSelectedWildCard(card);
      // For roulette, we also need to open player target selection
      if (card.type === 'wild_roulette') {
        // Choose first valid target
        const validOpponents = gameState.players.filter((p) => p.id !== myPeerId && !p.isKnockedOut);
        if (validOpponents.length > 0) {
          setRouletteSelectedPlayerId(validOpponents[0].id);
          setShowRouletteModal(true);
        } else {
          // No opponents? Just standard wild behavior or auto-play
          onPlayCard(card.id, 'red');
        }
      }
    } else if (card.type === 'skip_everyone') {
      // Returns turn to active player, no special selection needed
      onPlayCard(card.id, card.color);
    } else {
      onPlayCard(card.id, card.color);
    }
  };

  // Complete Wild Choice
  const handleSelectWildColor = (color: CardColor) => {
    if (selectedWildCard) {
      if (selectedWildCard.type === 'wild_roulette' && rouletteSelectedPlayerId) {
        onPlayCard(selectedWildCard.id, color);
        setTimeout(() => {
          onSelectRouletteParams(rouletteSelectedPlayerId, color);
        }, 150);
      } else {
        onPlayCard(selectedWildCard.id, color);
      }
      setSelectedWildCard(null);
      setShowRouletteModal(false);
    }
  };

  // Complete Swap selection
  const handleSelectSwap = (targetId: string) => {
    onSelectSwapTarget(targetId);
    setShowSwapModal(false);
  };

  // Check if 7 Hand-swap modal should show
  useEffect(() => {
    if (gameState.pendingSevenSwap === myPeerId && isMyTurn) {
      setShowSwapModal(true);
    } else {
      setShowSwapModal(false);
    }
  }, [gameState.pendingSevenSwap, gameState.currentTurnIndex]);

  // Fan layout math
  const getFanStyles = (index: number, totalCards: number) => {
    if (totalCards <= 1) return { angle: 0, translateY: 0 };
    
    // Spread cards out in a 40-degree arc max
    const maxArc = Math.min(45, totalCards * 4.5);
    const startAngle = -maxArc / 2;
    const step = maxArc / (totalCards - 1);
    
    const angle = startAngle + index * step;
    
    // Parabolic Y-offset (cards in the center of the arc are higher)
    const normalized = (index - (totalCards - 1) / 2) / ((totalCards - 1) / 2 || 1);
    const translateY = Math.round(normalized * normalized * 12);
    
    return { angle, translateY };
  };

  // Active glowing color boundary border
  const getGlowClass = () => {
    switch (gameState.activeColor) {
      case 'red': return 'active-glow-red ring-4 ring-red-500';
      case 'blue': return 'active-glow-blue ring-4 ring-blue-500';
      case 'green': return 'active-glow-green ring-4 ring-emerald-500';
      case 'yellow': return 'active-glow-yellow ring-4 ring-amber-500';
      default: return 'ring-2 ring-yellow-400';
    }
  };

  return (
    <div className="game-board w-full h-[100dvh] grid grid-rows-12 gap-1 p-2 md:p-3 select-none text-[#F4EBD0] overflow-hidden relative">
      
      {/* 1. TOP BAR PANEL */}
      <div className="game-topbar row-span-1 flex items-center justify-between border-b border-[#D4AF37]/20 pb-1.5 px-2 relative z-20">
        <div className="flex items-center gap-2">
          <button
            onClick={onExitGame}
            className="border border-[#D4AF37]/50 hover:border-[#D4AF37] bg-black/40 text-[10px] md:text-xs font-serif font-bold uppercase tracking-wider px-2.5 py-1 rounded cursor-pointer transition-colors"
          >
            Leave Salon
          </button>
          
          <button
            onClick={() => setIsSoundOn(!isSoundOn)}
            className="p-1 border border-[#D4AF37]/30 hover:border-[#D4AF37] rounded bg-black/40 transition-colors cursor-pointer text-[#D4AF37]"
            title={isSoundOn ? 'Mute Audio' : 'Unmute Audio'}
          >
            {isSoundOn ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={handleEnterFullscreen}
            className="p-1 border border-[#D4AF37]/30 hover:border-[#D4AF37] rounded bg-black/40 transition-colors cursor-pointer text-[#D4AF37]"
            title="Enter fullscreen"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Direction & Active Stats */}
        <div className="flex items-center gap-4 text-[10px] md:text-xs font-mono">
          <div className="flex items-center gap-1 bg-black/45 px-2 py-0.5 rounded border border-[#D4AF37]/20 text-[#D4AF37]">
            <RotateCw className={`w-3 h-3 ${gameState.turnDirection === 1 ? 'animate-spin' : 'animate-spin rotate-180'}`} style={{ animationDuration: '6s' }} />
            <span className="uppercase tracking-widest">{gameState.turnDirection === 1 ? 'Clockwise' : 'Counter-Clockwise'}</span>
          </div>

          <div className="flex items-center gap-1.5 bg-black/45 px-2.5 py-0.5 rounded border border-[#D4AF37]/20 uppercase">
            <span>Color: </span>
            <span className={`w-2.5 h-2.5 rounded-full inline-block ${
              gameState.activeColor === 'red' ? 'bg-red-500' :
              gameState.activeColor === 'blue' ? 'bg-blue-500' :
              gameState.activeColor === 'green' ? 'bg-emerald-500' : 'bg-amber-400'
            }`} />
            <strong className="font-serif tracking-wider font-bold text-[#F3E5AB]">
              {gameState.activeColor.toUpperCase()}
            </strong>
          </div>
        </div>

        {/* Game Code Stamp */}
        <div className="text-right font-mono text-[9px] md:text-[11px] text-[#D4AF37]/70 uppercase tracking-widest">
          ROOM: <strong className="text-[#F3E5AB] font-bold">{gameState.roomCode || 'SOLO'}</strong>
        </div>
      </div>

      {/* 2. OPPONENTS GRID (TOP/SIDES) */}
      <div className="game-players-panel row-span-2 grid grid-cols-4 md:grid-cols-6 gap-2 items-center justify-center px-1 py-1 z-10">
        {gameState.players.map((p, idx) => {
          const isCurrent = gameState.currentTurnIndex === idx;
          const isSelf = p.id === myPeerId;
          const cardCount = p.cards.length;
          const nobleTitle = getNobleTitle(p.name, p.isHost);
          const isCloseToMercy = cardCount >= 18;

          return (
            <div
              key={p.id}
              className={`flex flex-col justify-between p-2 rounded-lg border relative transition-all duration-300 min-h-[72px] md:min-h-[84px] overflow-hidden ${
                isCurrent 
                  ? 'bg-gradient-to-br from-[#093A20] via-[#0D5C33] to-[#03140b] border-[#D4AF37] scale-102 md:scale-105 shadow-[0_0_20px_rgba(212,175,55,0.5)] ring-1 ring-[#D4AF37]/50' 
                  : 'bg-gradient-to-br from-[#121212] to-black border-stone-800 hover:border-[#D4AF37]/30 shadow-md'
              }`}
            >
              {/* Highlight active turn seal */}
              {isCurrent && !p.isKnockedOut && (
                <div className="absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent animate-gold-shine" />
              )}

              {/* Card info header */}
              <div className="flex items-center gap-2 w-full">
                {/* Royal Crest Roundel */}
                <div className={`relative flex-shrink-0 w-8 h-8 rounded-full border flex items-center justify-center bg-gradient-to-b from-[#1C1C1C] to-black shadow-[inset_0_1px_3px_rgba(212,175,55,0.25)] ${
                  isCurrent ? 'border-[#D4AF37]' : 'border-stone-700'
                }`}>
                  {p.isHost ? (
                    <Crown className="w-4 h-4 text-[#D4AF37] filter drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]" />
                  ) : (
                    <span className="text-xs font-serif font-extrabold text-[#F3E5AB]">
                      {p.name.slice(0,1).toUpperCase()}
                    </span>
                  )}
                  {isCurrent && !p.isKnockedOut && (
                    <span className="absolute -bottom-1 -right-1 flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#D4AF37] opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-[#D4AF37]"></span>
                    </span>
                  )}
                </div>

                {/* Name & Title */}
                <div className="truncate flex-1 min-w-0">
                  <span className="text-[7px] md:text-[8px] font-serif font-semibold italic text-[#D4AF37] uppercase tracking-wider block truncate">
                    {nobleTitle}
                  </span>
                  <div className="text-[10px] md:text-xs font-serif font-bold text-[#F4EBD0] truncate leading-tight">
                    {p.name} {isSelf && <span className="text-[8px] font-mono text-stone-400 font-normal">(You)</span>}
                  </div>
                </div>

                {/* Overlapping Royal Cards Count */}
                {!p.isKnockedOut && (
                  <div className="relative w-6 h-8 flex items-center justify-center flex-shrink-0" title={`${cardCount} Cards`}>
                    <div className="absolute w-4.5 h-6.5 bg-stone-900 border border-[#D4AF37]/30 rounded-sm translate-x-[3px] translate-y-[-1px] rotate-6 shadow-[1px_1px_2px_rgba(0,0,0,0.5)]" />
                    <div className="relative w-4.5 h-6.5 bg-gradient-to-b from-stone-950 to-[#121212] border border-[#D4AF37] rounded-sm flex flex-col items-center justify-center shadow-lg">
                      <span className="text-[9px] md:text-[10px] font-serif font-extrabold text-[#F3E5AB] leading-none">
                        {cardCount}
                      </span>
                      <span className="text-[4px] font-mono text-[#D4AF37]/60 tracking-wider uppercase leading-none mt-0.5">
                        CRD
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom detail row */}
              {!p.isKnockedOut && (
                <div className="w-full mt-1.5">
                  {/* Mercy Gauge & Badge Header */}
                  <div className="flex justify-between items-center text-[7px] font-mono uppercase tracking-wider text-stone-400 mb-0.5">
                    <span className="flex items-center gap-0.5 text-[6px] md:text-[7px]">
                      <Scroll className="w-2 h-2 text-[#D4AF37]/80" /> Mercy Gauge ({cardCount}/25)
                    </span>
                    {isCloseToMercy && (
                      <span className="text-red-400 font-bold animate-pulse text-[6px] md:text-[7px]">
                        ⚠️ LIMIT AT 25
                      </span>
                    )}
                  </div>

                  {/* Mercy Gauge Progress bar */}
                  <div className="w-full bg-stone-950 h-1 rounded-full overflow-hidden border border-[#D4AF37]/15">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        cardCount >= 20 ? 'bg-gradient-to-r from-red-600 to-rose-500' : cardCount >= 15 ? 'bg-gradient-to-r from-amber-600 to-yellow-500' : 'bg-gradient-to-r from-[#AA7C11] to-[#D4AF37]'
                      }`}
                      style={{ width: `${Math.min(100, (cardCount / 25) * 100)}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Action / Declare Badges */}
              {!p.isKnockedOut && (
                <div className="flex gap-1.5 mt-1.5 justify-end w-full">
                  {cardCount === 1 && !p.hasYelledUno && (
                    <button
                      onClick={() => !isSelf && onChallengeUno(p.id)}
                      className="text-[7px] md:text-[8px] font-serif bg-gradient-to-r from-red-950 to-red-900 hover:from-red-900 hover:to-red-800 text-[#F3E5AB] border border-red-500 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider animate-pulse cursor-pointer shadow-sm transition-all duration-200"
                      title="Challenge! No UNO declared!"
                    >
                      ⚡ Challenge!
                    </button>
                  )}
                  {p.hasYelledUno && (
                    <span className="text-[6px] md:text-[7px] font-serif bg-[#093A20] text-emerald-300 border border-[#D4AF37]/30 px-1.5 py-0.5 rounded font-bold uppercase tracking-widest flex items-center gap-0.5">
                      📢 Yelled UNO!
                    </span>
                  )}
                </div>
              )}

              {/* 💀 KNOCKED OUT / EXILED OVERLAY */}
              {p.isKnockedOut && (
                <div className="absolute inset-0 bg-black/85 backdrop-blur-[1px] rounded-lg flex flex-col items-center justify-center z-20 border border-red-950/40 p-1">
                  <div className="absolute inset-0.5 border border-red-900/30 rounded pointer-events-none" />
                  
                  {/* Banner Ribbon */}
                  <div className="bg-gradient-to-r from-red-950 via-red-900 to-red-950 text-red-200 border-y border-[#D4AF37]/30 text-[8px] md:text-[9px] font-serif font-extrabold uppercase tracking-widest text-center py-0.5 w-full rotate-6 shadow-md flex items-center justify-center gap-1">
                    <Skull className="w-2.5 h-2.5 text-[#D4AF37]" /> EXILED BY MERCY
                  </div>
                  
                  <span className="text-[6px] md:text-[7px] font-mono text-stone-400 uppercase tracking-widest mt-1">
                    FORFEITED DECK (25+ Cards)
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 3. CENTRAL COMBAT ARENA */}
      <div className="game-combat-row row-span-5 grid grid-cols-12 gap-3 items-center justify-center relative z-10 px-1">
        
        {/* Left Side: Game Event Logs */}
        <div className="game-log-panel col-span-4 h-full border border-[#D4AF37]/20 bg-black/45 rounded p-2.5 flex flex-col justify-between overflow-hidden shadow-inner font-mono text-[9px] md:text-[10px]">
          <div className="border-b border-[#D4AF37]/15 pb-1 mb-1.5 text-stone-300 uppercase tracking-widest font-serif text-center font-bold">
            ✦ Court Bulletins ✦
          </div>
          
          <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-1 text-stone-300">
            {gameState.log.map((entry, idx) => (
              <div key={idx} className="border-b border-white/5 pb-0.5 leading-snug">
                <span className="text-[#D4AF37]">{idx + 1}.</span> {entry}
              </div>
            ))}
            <div ref={logEndRef} />
          </div>
        </div>

        {/* Center: Draw / Discard Cards Table */}
        <div className="game-table-panel col-span-8 h-full flex flex-col justify-center items-center relative border border-[#D4AF37]/20 bg-black/15 rounded shadow-inner py-2">
          
          {/* Stacking Penalty Alert Banner */}
          {gameState.stackCount > 0 && (
            <div className="absolute top-2 bg-gradient-to-r from-red-950 via-red-900 to-red-950 border border-red-500 text-red-100 text-xs py-1 px-4 rounded-full font-serif tracking-wider uppercase flex items-center gap-1.5 shadow-[0_0_15px_rgba(239,68,68,0.4)] animate-bounce z-20">
              <AlertTriangle className="w-3.5 h-3.5 text-red-400 animate-pulse" />
              Stacking Hazard Active: +{gameState.stackCount} Cards
            </div>
          )}

          <div className="flex items-center justify-center gap-8 md:gap-14 my-auto relative z-10">
            {/* Draw Pile */}
            <div className="flex flex-col items-center gap-1.5">
              <button
                disabled={!isMyTurn || isSpectating || (gameState.stackCount > 0 && hasPlayableHandCard)}
                onClick={gameState.stackCount > 0 ? onAcceptPenalty : onDrawCard}
                className={`
                  draw-pile-button relative w-22 h-32 md:w-24 md:h-36 rounded-md border-2 border-dashed border-[#D4AF37]/50 bg-black/55 shadow-md flex flex-col items-center justify-center cursor-pointer transition-all duration-300
                  ${isMyTurn && !isSpectating && !(gameState.stackCount > 0 && hasPlayableHandCard) ? 'ring-4 ring-[#D4AF37] scale-105 hover:bg-black/80 shadow-[0_0_15px_rgba(212,175,55,0.3)]' : 'opacity-65 cursor-not-allowed'}
                `}
              >
                {/* Royal back pattern */}
                <div className="absolute inset-1.5 border border-[#D4AF37]/30 rounded flex flex-col items-center justify-center bg-gradient-to-br from-stone-900 to-stone-950">
                  <div className="w-12 h-12 rounded-full border border-[#D4AF37]/20 flex items-center justify-center text-xl text-[#D4AF37] font-serif shadow-inner">
                    👑
                  </div>
                  <span className="text-[8px] font-mono text-[#D4AF37] tracking-[0.2em] uppercase mt-2">
                    Draw Pile
                  </span>
                </div>
              </button>
              <span className="text-[10px] font-mono text-stone-400">
                {gameState.drawPile.length} cards remaining
              </span>
            </div>

            {/* Discard Pile */}
            <div className="flex flex-col items-center gap-1.5">
              <div className={`discard-pile-slot relative w-22 h-32 md:w-24 md:h-36 rounded-md bg-black/65 flex items-center justify-center p-1 relative z-10 transition-shadow duration-500 ${getGlowClass()}`}>
                {topDiscard ? (
                  <CardItem card={topDiscard} size="pile" disabled={true} />
                ) : (
                  <div className="text-[10px] font-mono text-stone-500 uppercase">Empty</div>
                )}
              </div>
              <span className="text-[10px] font-mono text-[#D4AF37] uppercase tracking-wider font-semibold">
                Active Deck Top
              </span>
            </div>
          </div>

          {/* Action Prompts Overlay */}
          <div className="game-action-prompts absolute bottom-2 flex gap-3 z-20 pointer-events-none">
            {isMyTurn && gameState.stackCount > 0 && !isSpectating && !hasPlayableHandCard && (
              <button
                onClick={onAcceptPenalty}
                className="penalty-action-button pointer-events-auto flex items-center justify-center gap-1.5 bg-gradient-to-r from-red-600 to-red-800 hover:from-red-700 border border-red-400 text-[#F4EBD0] text-xs font-serif font-bold uppercase tracking-wider px-4 py-1.5 rounded-full shadow-lg transition-transform hover:scale-105 cursor-pointer whitespace-nowrap text-center"
              >
                Accept Penalty &amp; Draw +{gameState.stackCount}
              </button>
            )}

            {isMyTurn && gameState.stackCount > 0 && !isSpectating && hasPlayableHandCard && (
              <span className="bg-emerald-600/90 border border-emerald-300 text-white text-[10px] md:text-xs py-1 px-3 rounded-full font-serif uppercase tracking-wider shadow-lg">
                Play +{gameState.stackCount} or higher
              </span>
            )}

            {isMyTurn && gameState.stackCount === 0 && !isSpectating && (
              <span className="bg-black/60 border border-[#D4AF37]/35 text-[10px] md:text-xs py-0.5 px-3 rounded-full font-serif uppercase tracking-wider text-[#D4AF37] animate-pulse">
                Your move, Noble Courtier
              </span>
            )}
          </div>

        </div>

      </div>

      {/* 4. PLAYER HAND VIEWPORT */}
      <div className="game-hand-panel row-span-4 flex flex-col justify-end items-center relative z-20 px-1 border-t border-[#D4AF37]/10 pt-2 bg-black/25">
        
        {isSpectating ? (
          <div className="text-center pb-6">
            <p className="text-sm font-serif italic text-[#D4AF37]/75">
              {localPlayer?.isKnockedOut 
                ? 'Alas, you were Mercy-Ruled! Watching the remaining courtiers fight for the crown...' 
                : 'Sitting as spectator. Wait for the host to deal the next match.'}
            </p>
          </div>
        ) : (
          <div className="w-full max-w-5xl flex flex-col items-center">
            
            {/* Draw Prompt if no playable cards */}
            {isMyTurn && !hasPlayableHandCard && (
              <div className="absolute -top-6 bg-amber-500 text-slate-900 border border-amber-400 text-[10px] md:text-xs py-0.5 px-3.5 rounded-full font-mono uppercase tracking-wider animate-pulse flex items-center gap-1.5 shadow-lg">
                ⚠️ NO PLAYABLE CARDS IN HAND! CLICK DRAW PILE
              </div>
            )}

            {/* Hand Cards List */}
            <div className="card-fan-container w-full relative overflow-visible pb-1 flex justify-center items-end">
              {localPlayer.cards.map((card, idx) => {
                const { angle, translateY } = getFanStyles(idx, localPlayer.cards.length);
                const playable = isMyTurn && canPlayCard(card, topDiscard, gameState.activeColor, gameState.stackCount);
                
                return (
                  <div
                    key={card.id}
                    className="hand-card-slot absolute transition-transform duration-150"
                    style={{
                      left: `calc(50% - 40px + ${(idx - (localPlayer.cards.length - 1) / 2) * Math.min(22, 280 / localPlayer.cards.length)}px)`,
                      zIndex: 30 + idx,
                    }}
                  >
                    <CardItem
                      card={card}
                      size="md"
                      angle={angle}
                      translateY={translateY}
                      isPlayable={playable}
                      onClick={() => handleCardClick(card)}
                      disabled={isMyTurn ? !playable : true}
                    />
                  </div>
                );
              })}
            </div>

            {/* Floating Actions Strip */}
            <div className="flex gap-2.5 items-center mt-1 pb-1 relative z-50">
              {/* UNO Shout Button */}
              {localPlayer.cards.length <= 2 && (
                <button
                  onClick={onYellUno}
                  className={`
                    flex items-center gap-1.5 text-[10px] md:text-xs font-serif font-extrabold uppercase tracking-widest px-4 py-1 rounded-full shadow-lg border transition-transform hover:scale-105 cursor-pointer
                    ${localPlayer.hasYelledUno 
                      ? 'bg-emerald-600 text-white border-emerald-400 shadow-inner' 
                      : 'bg-gradient-to-r from-[#AA7C11] to-[#D4AF37] hover:to-yellow-400 text-slate-900 border-yellow-300 animate-pulse'}
                  `}
                >
                  📢 {localPlayer.hasYelledUno ? 'UNO SHOUTED!' : 'SHOUT UNO!'}
                </button>
              )}
            </div>

          </div>
        )}

      </div>

      {/* 5. MODAL OVERLAYS */}

      {/* A. Wild Color Picker Modal */}
      {selectedWildCard && !showRouletteModal && (
        <div className="fixed inset-0 bg-black/85 flex items-center justify-center z-[999] p-4">
          <div className="border border-[#D4AF37] p-6 max-w-sm w-full bg-[#1A0E04] rounded shadow-[0_0_30px_rgba(212,175,55,0.4)] text-center relative">
            <div className="absolute inset-1 border border-[#D4AF37]/30 rounded pointer-events-none" />
            
            <h3 className="text-lg font-serif uppercase tracking-widest text-[#D4AF37] mb-2">
              PROCLAIM WILD COLOR
            </h3>
            <p className="text-xs text-stone-300 font-sans leading-relaxed mb-6">
              You played {getCardLabel(selectedWildCard)}. Choose the next dominant color of the court table:
            </p>

            <div className="grid grid-cols-2 gap-3">
              {wildColors.map((color) => (
                <button
                  key={color}
                  onClick={() => handleSelectWildColor(color)}
                  className={`py-3 px-4 rounded text-sm font-serif font-bold tracking-wider uppercase border border-white/15 cursor-pointer transition-transform hover:scale-105 shadow ${
                    color === 'red' ? 'bg-gradient-to-r from-red-600 to-red-800 text-white hover:border-red-400' :
                    color === 'blue' ? 'bg-gradient-to-r from-blue-600 to-blue-800 text-white hover:border-blue-400' :
                    color === 'green' ? 'bg-gradient-to-r from-emerald-600 to-emerald-800 text-white hover:border-emerald-400' :
                    'bg-gradient-to-r from-amber-400 to-amber-600 text-slate-900 hover:border-amber-300'
                  }`}
                >
                  {color}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* B. Roulette Target Selection Secondary Panel */}
      {selectedWildCard?.type === 'wild_roulette' && showRouletteModal && (
        <div className="fixed inset-0 bg-black/85 flex items-center justify-center z-[999] p-4">
          <div className="border border-[#D4AF37] p-6 max-w-sm w-full bg-[#1A0E04] rounded shadow-[0_0_30px_rgba(212,175,55,0.4)] text-center relative">
            <div className="absolute inset-1 border border-[#D4AF37]/30 rounded pointer-events-none" />
            
            <h3 className="text-lg font-serif uppercase tracking-widest text-[#D4AF37] mb-1">
              ROULETTE TARGET
            </h3>
            <p className="text-[10px] uppercase font-mono tracking-widest text-red-400 mb-4 animate-pulse">
              Select Victim to Spin!
            </p>

            <div className="flex flex-col gap-2 mb-6">
              {gameState.players
                .filter((p) => p.id !== myPeerId && !p.isKnockedOut)
                .map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setRouletteSelectedPlayerId(p.id)}
                    className={`px-4 py-2 text-left font-serif text-xs rounded border cursor-pointer transition-all ${
                      rouletteSelectedPlayerId === p.id
                        ? 'bg-[#D4AF37]/20 border-[#D4AF37] text-[#D4AF37]'
                        : 'bg-black/30 border-stone-800 text-stone-300 hover:text-[#F4EBD0]'
                    }`}
                  >
                    ✦ {p.name} ({p.cards.length} cards)
                  </button>
                ))}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setSelectedWildCard(null);
                  setShowRouletteModal(false);
                }}
                className="flex-1 py-1.5 border border-stone-600 text-stone-400 rounded text-xs cursor-pointer hover:bg-black/20"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowRouletteModal(false)}
                className="flex-1 py-1.5 bg-[#D4AF37] text-slate-900 rounded font-serif font-bold text-xs cursor-pointer hover:bg-yellow-500"
              >
                Confirm Target
              </button>
            </div>
          </div>
        </div>
      )}

      {/* C. 7 Hand-Swap Target Selector Modal */}
      {showSwapModal && (
        <div className="fixed inset-0 bg-black/85 flex items-center justify-center z-[998] p-4">
          <div className="border border-[#D4AF37] p-6 max-w-sm w-full bg-[#1A0E04] rounded shadow-[0_0_30px_rgba(212,175,55,0.4)] text-center relative">
            <div className="absolute inset-1 border border-[#D4AF37]/30 rounded pointer-events-none" />
            
            <h3 className="text-lg font-serif uppercase tracking-widest text-[#D4AF37] mb-2 flex items-center justify-center gap-1.5">
              <Swords className="w-5 h-5" /> REVERSAL OF FORTUNE
            </h3>
            <p className="text-xs text-stone-300 font-sans leading-relaxed mb-6">
              You played a <strong className="text-yellow-400">7</strong>! Under Royal Protocol, you must swap your entire hand with an opponent. Select your target:
            </p>

            <div className="flex flex-col gap-2">
              {gameState.players
                .filter((p) => p.id !== myPeerId && !p.isKnockedOut)
                .map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleSelectSwap(p.id)}
                    className="flex items-center justify-between px-4 py-2.5 bg-gradient-to-r from-[#AA7C11]/20 to-black hover:from-[#D4AF37]/30 border border-[#D4AF37]/50 hover:border-[#D4AF37] text-left text-xs font-serif rounded transition-transform hover:-translate-y-0.5 cursor-pointer"
                  >
                    <span className="font-bold text-[#F3E5AB]">✦ {p.name}</span>
                    <span className="font-mono text-stone-300 uppercase tracking-widest text-[9px]">
                      {p.cards.length} Cards in hand
                    </span>
                  </button>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* D. GAME OVER MODAL */}
      {gameState.gameEnded && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[999] p-4 animate-fadeIn">
          <div className="border-2 border-[#D4AF37] p-8 max-w-md w-full bg-[#093A20] rounded shadow-[0_0_40px_rgba(212,175,55,0.5)] text-center relative">
            <div className="absolute inset-1 border border-[#D4AF37]/35 rounded pointer-events-none" />
            
            <div className="text-5xl mb-3 animate-bounce">🏆</div>
            <h3 className="text-2xl font-serif font-bold tracking-widest text-[#F3E5AB] uppercase mb-1">
              Match Complete
            </h3>
            <p className="text-[10px] font-mono tracking-widest text-[#D4AF37] uppercase mb-4">
              Crown Bestowed
            </p>

            <div className="border border-[#D4AF37]/30 bg-black/40 rounded p-4 mb-6">
              <span className="text-[10px] uppercase font-mono tracking-wider text-stone-400 block mb-1">
                Royal Victor
              </span>
              <span className="text-xl font-serif font-extrabold text-[#D4AF37] tracking-wider uppercase">
                {gameState.players.find((p) => p.id === gameState.winnerId)?.name || 'Noble Courtier'}
              </span>
              {gameState.winnerId === myPeerId ? (
                <p className="text-xs text-emerald-400 font-serif italic mt-2">
                  Sire, you have conquered the court! All yield to your glorious mercy.
                </p>
              ) : (
                <p className="text-xs text-stone-300 font-serif italic mt-2">
                  Fortunes rise and fall. May your next match bring greater victory.
                </p>
              )}
            </div>

            <button
              onClick={onExitGame}
              className="w-full bg-[#D4AF37] hover:bg-yellow-500 text-slate-900 font-serif font-bold text-xs py-2 px-6 rounded-full tracking-widest uppercase transition-colors shadow-lg cursor-pointer"
            >
              Return to Salon Gates
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
