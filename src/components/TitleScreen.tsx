import type { GameMode } from '../game/types';

interface TitleScreenProps {
  bestScore: number;
  highestUnlockedStage: number;
  muted: boolean;
  onStartMode: (mode: GameMode) => void;
  onOpenStageSelect: () => void;
  onOpenControls: () => void;
  onToggleMute: () => void;
}

export function TitleScreen({
  bestScore,
  highestUnlockedStage,
  muted,
  onStartMode,
  onOpenStageSelect,
  onOpenControls,
  onToggleMute,
}: TitleScreenProps) {
  return (
    <div className="fixed inset-0 z-20 flex flex-col justify-between p-6 md:p-10 pointer-events-none">
      {/* Top Bar: Sound toggle & best progress */}
      <div className="flex items-start justify-between gap-4">
        <div className="bg-[#14131c]/88 border-2 border-amber-400/70 px-3.5 py-2 shadow-[4px_4px_0_#09090b] pointer-events-auto">
          <div className="font-pixel text-[11px] tracking-wider text-amber-300 tabular-nums">
            STAGE UNLOCKED {highestUnlockedStage} / 15
            {bestScore > 0 ? ` · BEST ${bestScore}` : ''}
          </div>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.currentTarget.blur();
            onToggleMute();
          }}
          aria-label={muted ? 'Unmute audio' : 'Mute audio'}
          className="pointer-events-auto px-3.5 py-2 bg-[#14131c]/90 border-2 border-stone-300 text-stone-100 font-pixel text-xs hover:border-amber-300 hover:text-amber-300 transition-colors cursor-pointer shadow-[4px_4px_0_#09090b] whitespace-nowrap shrink-0"
        >
          {muted ? 'SOUND: OFF [M]' : 'SOUND: ON [M]'}
        </button>
      </div>

      {/* Main Focal Lockup & Menu Actions */}
      <div className="max-w-xl my-auto flex flex-col items-start gap-5 pointer-events-auto">
        <div className="bg-[#14131c]/88 border-4 border-amber-400 p-5 md:p-6 shadow-[8px_8px_0_#09090b]">
          {/* Bespoke inline SVG Arcade Pixel Title Lockup */}
          <svg
            viewBox="0 0 520 128"
            className="w-full max-w-[460px] h-auto"
            role="img"
            aria-label="Neighborhood Brawlers: Ziyad and Mohamed"
          >
            <rect x="4" y="4" width="512" height="120" fill="#1b1926" stroke="#f59e0b" strokeWidth="4" />
            <rect x="10" y="10" width="500" height="108" fill="none" stroke="#b45309" strokeWidth="2" />
            <text
              x="26"
              y="46"
              fill="#fbbf24"
              fontFamily="'Silkscreen', monospace"
              fontSize="26"
              fontWeight="700"
              letterSpacing="1"
            >
              NEIGHBORHOOD
            </text>
            <text
              x="26"
              y="82"
              fill="#f8fafc"
              fontFamily="'Silkscreen', monospace"
              fontSize="32"
              fontWeight="700"
              letterSpacing="2"
            >
              BRAWLERS
            </text>
            <rect x="26" y="92" width="468" height="3" fill="#ef4444" />
            <text
              x="26"
              y="112"
              fill="#38bdf8"
              fontFamily="'Silkscreen', monospace"
              fontSize="14"
              fontWeight="700"
            >
              ZIYAD &amp; MOHAMED · معركة الحي
            </text>
          </svg>

          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              data-start="true"
              onClick={(e) => {
                e.currentTarget.blur();
                onStartMode('1P');
              }}
              className="px-5 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-pixel text-sm font-bold border-2 border-stone-950 shadow-[4px_4px_0_#09090b] active:translate-y-0.5 transition-transform cursor-pointer whitespace-nowrap shrink-0"
            >
              1 PLAYER (SOLO)
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.currentTarget.blur();
                onStartMode('2P');
              }}
              className="px-5 py-3.5 bg-amber-400 hover:bg-amber-300 text-stone-950 font-pixel text-sm font-bold border-2 border-stone-950 shadow-[4px_4px_0_#09090b] active:translate-y-0.5 transition-transform cursor-pointer whitespace-nowrap shrink-0"
            >
              2 PLAYERS (CO-OP)
            </button>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={(e) => {
                e.currentTarget.blur();
                onOpenStageSelect();
              }}
              className="px-4 py-2.5 bg-[#242333] hover:bg-[#312f44] text-stone-100 font-pixel text-xs border-2 border-stone-500 hover:border-amber-300 shadow-[3px_3px_0_#09090b] transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              STAGE SELECT (1–15)
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.currentTarget.blur();
                onOpenControls();
              }}
              className="px-4 py-2.5 bg-[#242333] hover:bg-[#312f44] text-stone-100 font-pixel text-xs border-2 border-stone-500 hover:border-sky-300 shadow-[3px_3px_0_#09090b] transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              CONTROLS GUIDE
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Safe-Margin Single Flat Control Hint Line */}
      <div className="flex justify-center">
        <p className="px-4 py-1.5 bg-[#14131c]/85 text-stone-200 font-pixel text-[11px] tracking-wide text-center">
          P1: WASD Move · Space Jump · E Punch · R Kick · E+R Special · Esc Pause
        </p>
      </div>
    </div>
  );
}
