import { useState } from 'react';
import { STAGES } from '../game/constants';
import type { GameMode } from '../game/types';

interface StageSelectModalProps {
  highestUnlockedStage: number;
  onSelectStage: (stageNumber: number, mode: GameMode) => void;
  onClose: () => void;
}

export function StageSelectModal({
  highestUnlockedStage,
  onSelectStage,
  onClose,
}: StageSelectModalProps) {
  const [mode, setMode] = useState<GameMode>('1P');

  const chapters = [
    { id: 1, title: 'CHAPTER 1: THE ALLEYWAYS & STREETS', stages: STAGES.slice(0, 5) },
    { id: 2, title: 'CHAPTER 2: SCHOOLYARD & FIELD', stages: STAGES.slice(5, 10) },
    { id: 3, title: 'CHAPTER 3: THE MOSQUE SQUARE', stages: STAGES.slice(10, 15) },
  ];

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/75"
      role="dialog"
      aria-modal="true"
      aria-label="Stage Select"
    >
      <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-[#14131c] border-4 border-amber-400 p-5 md:p-6 shadow-[8px_8px_0_#09090b]">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h2 className="font-pixel text-lg text-amber-300">STAGE SELECT (1–15)</h2>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMode('1P')}
              className={`px-3 py-1.5 font-pixel text-xs border-2 cursor-pointer whitespace-nowrap shrink-0 ${
                mode === '1P'
                  ? 'bg-emerald-500 text-stone-950 border-stone-950'
                  : 'bg-[#222132] text-stone-300 border-stone-600'
              }`}
            >
              1P SOLO
            </button>
            <button
              type="button"
              onClick={() => setMode('2P')}
              className={`px-3 py-1.5 font-pixel text-xs border-2 cursor-pointer whitespace-nowrap shrink-0 ${
                mode === '2P'
                  ? 'bg-sky-400 text-stone-950 border-stone-950'
                  : 'bg-[#222132] text-stone-300 border-stone-600'
              }`}
            >
              2P CO-OP
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 bg-[#252436] hover:bg-[#34324a] border-2 border-stone-400 font-pixel text-xs text-stone-100 cursor-pointer whitespace-nowrap shrink-0"
            >
              CLOSE
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {chapters.map((ch) => (
            <div key={ch.id} className="bg-[#1b1a28] border-2 border-stone-700 p-3.5">
              <div className="font-pixel text-xs text-amber-300 mb-2.5">{ch.title}</div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {ch.stages.map((st) => {
                  const unlocked = st.stageNumber <= highestUnlockedStage;
                  return (
                    <button
                      key={st.stageNumber}
                      type="button"
                      disabled={!unlocked}
                      onClick={() => onSelectStage(st.stageNumber, mode)}
                      className={`p-2.5 text-left border-2 transition-colors ${
                        unlocked
                          ? 'bg-[#252438] hover:bg-[#32304b] border-stone-400 hover:border-amber-300 cursor-pointer'
                          : 'bg-[#15141f] border-stone-800 opacity-50 cursor-not-allowed'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-pixel text-xs text-white tabular-nums">
                          ST {st.stageNumber}
                        </span>
                        {st.bossId && (
                          <span className="font-pixel text-[9px] text-red-400">BOSS</span>
                        )}
                      </div>
                      <div className="font-arcade text-[11px] text-stone-300 truncate mt-1">
                        {unlocked ? st.title : 'LOCKED'}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
