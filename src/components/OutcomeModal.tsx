import type { HudSnapshot } from '../game/types';

interface OutcomeModalProps {
  hud: HudSnapshot;
  onNextStage: () => void;
  onRetry: () => void;
  onTitle: () => void;
}

export function OutcomeModal({
  hud,
  onNextStage,
  onRetry,
  onTitle,
}: OutcomeModalProps) {
  const isVictory = hud.phase === 'VICTORY';
  const isStageClear = hud.phase === 'STAGE_CLEAR';
  const isDefeat = hud.phase === 'GAME_OVER';

  if (!isVictory && !isStageClear && !isDefeat) return null;

  const heading = isVictory
    ? 'NEIGHBORHOOD CHAMPIONS!'
    : isStageClear
      ? `STAGE ${hud.stageNumber} CLEAR!`
      : 'KNOCKED OUT!';

  const subline = isVictory
    ? 'Ziyad & Mohamed defeated Baraa and restored peace to the whole neighborhood!'
    : isStageClear
      ? `${hud.stageTitle} cleared! Ready for Stage ${hud.stageNumber + 1}.`
      : `Fell on Stage ${hud.stageNumber} (${hud.stageTitle}). Get back up and fight!`;

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/70"
      role="dialog"
      aria-modal="true"
      aria-label={heading}
    >
      <div
        className={`w-full max-w-md bg-[#14131c] border-4 p-6 shadow-[8px_8px_0_#09090b] text-center ${
          isDefeat ? 'border-red-500' : 'border-amber-400'
        }`}
      >
        <h2
          className={`font-pixel text-lg md:text-xl ${
            isDefeat ? 'text-red-400' : 'text-amber-300'
          }`}
        >
          {heading}
        </h2>
        <p className="font-arcade text-sm text-stone-200 mt-2">{subline}</p>

        <div className="mt-5 grid grid-cols-3 gap-2 bg-[#1c1b29] border-2 border-stone-700 p-3">
          <div>
            <div className="font-pixel text-[10px] text-stone-400">SCORE</div>
            <div className="font-pixel text-sm text-white tabular-nums mt-0.5">
              {hud.totalScore}
            </div>
          </div>
          <div>
            <div className="font-pixel text-[10px] text-stone-400">
              {isDefeat ? 'STAGE' : 'TIME'}
            </div>
            <div className="font-pixel text-sm text-amber-300 tabular-nums mt-0.5">
              {isDefeat ? `${hud.stageNumber}/15` : `${hud.clearTimeSec}s`}
            </div>
          </div>
          <div>
            <div className="font-pixel text-[10px] text-stone-400">
              {isDefeat ? 'BEST' : 'KO COUNT'}
            </div>
            <div className="font-pixel text-sm text-emerald-300 tabular-nums mt-0.5">
              {isDefeat ? hud.bestScore : hud.enemiesDefeated}
            </div>
          </div>
        </div>

        {hud.boss && isDefeat && (
          <p className="mt-3 font-pixel text-[11px] text-red-300 tabular-nums">
            {hud.boss.name} HP REMAINING: {hud.boss.hp}/{hud.boss.maxHp}
          </p>
        )}

        <div className="mt-5 flex flex-col gap-2.5">
          {isStageClear && (
            <button
              type="button"
              data-start="true"
              onClick={(e) => {
                e.currentTarget.blur();
                onNextStage();
              }}
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-pixel text-xs font-bold border-2 border-stone-950 shadow-[4px_4px_0_#09090b] cursor-pointer"
            >
              NEXT STAGE ({hud.stageNumber + 1}/15)
            </button>
          )}

          {(isDefeat || isVictory) && (
            <button
              type="button"
              data-start="true"
              onClick={(e) => {
                e.currentTarget.blur();
                onRetry();
              }}
              className="w-full py-3 bg-amber-400 hover:bg-amber-300 text-stone-950 font-pixel text-xs font-bold border-2 border-stone-950 shadow-[4px_4px_0_#09090b] cursor-pointer"
            >
              {isVictory ? 'PLAY AGAIN' : 'TRY AGAIN'}
            </button>
          )}

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
