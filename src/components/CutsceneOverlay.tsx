import { getPortraitDataUrl } from '../game/sprites';
import type { CutsceneLine } from '../game/types';

interface CutsceneOverlayProps {
  lines: CutsceneLine[];
  index: number;
  stageNumber: number;
  onNext: () => void;
  onSkip: () => void;
}

export function CutsceneOverlay({
  lines,
  index,
  stageNumber,
  onNext,
  onSkip,
}: CutsceneOverlayProps) {
  const line = lines[index];
  if (!line) return null;

  const portraitUrl = getPortraitDataUrl(line.portrait);
  const isLast = index + 1 >= lines.length;

  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center p-4 md:p-8 bg-black/35">
      <div className="w-full max-w-3xl bg-[#14131c] border-4 border-amber-400 p-4 md:p-5 shadow-[8px_8px_0_#09090b]">
        <div className="flex items-start gap-4">
          {line.side === 'left' && (
            <img
              src={portraitUrl}
              alt={`${line.speaker} portrait`}
              className="w-16 h-16 md:w-20 md:h-20 pixelated border-2 border-amber-300 shrink-0"
            />
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <div className="font-pixel text-xs md:text-sm text-amber-300">
                {line.speaker}
                {line.arabicSpeaker ? ` · ${line.arabicSpeaker}` : ''}
              </div>
              <div className="font-pixel text-[10px] text-stone-400 tabular-nums">
                STAGE {stageNumber} · {index + 1}/{lines.length}
              </div>
            </div>
            <p className="font-arcade text-base md:text-lg text-stone-100 leading-snug">
              {line.text}
            </p>
          </div>

          {line.side === 'right' && (
            <img
              src={portraitUrl}
              alt={`${line.speaker} portrait`}
              className="w-16 h-16 md:w-20 md:h-20 pixelated border-2 border-red-400 shrink-0"
            />
          )}
        </div>

        <div className="mt-4 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={(e) => {
              e.currentTarget.blur();
              onSkip();
            }}
            className="px-4 py-2 bg-[#252436] hover:bg-[#323047] text-stone-200 font-pixel text-xs border-2 border-stone-500 cursor-pointer whitespace-nowrap shrink-0"
          >
            SKIP
          </button>
          <button
            type="button"
            data-start="true"
            onClick={(e) => {
              e.currentTarget.blur();
              onNext();
            }}
            className="px-5 py-2 bg-amber-400 hover:bg-amber-300 text-stone-950 font-pixel text-xs font-bold border-2 border-stone-950 shadow-[3px_3px_0_#09090b] cursor-pointer whitespace-nowrap shrink-0"
          >
            {isLast ? 'FIGHT! [SPACE]' : 'NEXT [SPACE]'}
          </button>
        </div>
      </div>
    </div>
  );
}
