interface PauseModalProps {
  stageNumber: number;
  stageTitle: string;
  onResume: () => void;
  onRestart: () => void;
  onTitle: () => void;
}

export function PauseModal({
  stageNumber,
  stageTitle,
  onResume,
  onRestart,
  onTitle,
}: PauseModalProps) {
  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/65"
      role="dialog"
      aria-modal="true"
      aria-label="Game Paused"
    >
      <div className="w-full max-w-sm bg-[#14131c] border-4 border-amber-400 p-6 shadow-[8px_8px_0_#09090b] text-center">
        <h2 className="font-pixel text-xl text-amber-300">PAUSED</h2>
        <p className="font-pixel text-xs text-stone-300 mt-1.5">
          STAGE {stageNumber} · {stageTitle}
        </p>

        <div className="mt-5 flex flex-col gap-2.5">
          <button
            type="button"
            onClick={(e) => {
              e.currentTarget.blur();
              onResume();
            }}
            className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-pixel text-xs font-bold border-2 border-stone-950 shadow-[4px_4px_0_#09090b] cursor-pointer"
          >
            RESUME [ESC]
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.currentTarget.blur();
              onRestart();
            }}
            className="w-full py-2.5 bg-[#262538] hover:bg-[#32304a] text-stone-100 font-pixel text-xs border-2 border-stone-400 cursor-pointer"
          >
            RESTART STAGE
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.currentTarget.blur();
              onTitle();
            }}
            className="w-full py-2.5 bg-[#262538] hover:bg-[#32304a] text-stone-100 font-pixel text-xs border-2 border-stone-400 cursor-pointer"
          >
            MAIN MENU
          </button>
        </div>
      </div>
    </div>
  );
}
