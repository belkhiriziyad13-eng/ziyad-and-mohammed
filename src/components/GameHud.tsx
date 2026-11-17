import { getPortraitDataUrl } from '../game/sprites';
import type { HudSnapshot } from '../game/types';

interface GameHudProps {
  hud: HudSnapshot;
  onTogglePause: () => void;
  onToggleMute: () => void;
}

export function GameHud({ hud, onTogglePause, onToggleMute }: GameHudProps) {
  const p1Portrait = getPortraitDataUrl('ziyad');
  const p2Portrait = hud.p2 ? getPortraitDataUrl('mohamed') : '';
  const bossPortrait = hud.boss ? getPortraitDataUrl(hud.boss.id) : '';

  const p1Pct = Math.max(0, Math.min(100, (hud.p1.hp / hud.p1.maxHp) * 100));
  const p1TrailPct = Math.max(0, Math.min(100, (hud.p1.trailHp / hud.p1.maxHp) * 100));
  const p1StamPct = Math.max(0, Math.min(100, (hud.p1.stamina / hud.p1.maxStamina) * 100));

  return (
    <div className="fixed inset-0 z-10 pointer-events-none flex flex-col justify-between p-3 md:p-4">
      {/* TOP BAR CLUSTER */}
      <div className="flex items-start justify-between gap-3">
        {/* TOP-LEFT: P1 ZIYAD HUD */}
        <div className="flex items-center gap-2.5 bg-[#14131c]/88 border-2 border-emerald-400/80 p-2 shadow-[4px_4px_0_#09090b]">
          <img
            src={p1Portrait}
            alt="Ziyad pixel portrait"
            className="w-12 h-12 pixelated border-2 border-stone-950 bg-slate-900 shrink-0"
          />
          <div className="w-44 md:w-52">
            <div className="flex items-baseline justify-between gap-2">
              <span className="font-pixel text-xs font-bold text-emerald-300">
                P1 {hud.p1.name}
              </span>
              <span className="font-pixel text-[11px] text-stone-200 tabular-nums">
                {hud.p1.hp}/{hud.p1.maxHp}
              </span>
            </div>
            {/* Green Health Bar + delayed damage trail */}
            <div className="relative h-3.5 bg-stone-900 border border-stone-950 mt-1 overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 bg-amber-300/80 transition-[width] duration-75"
                style={{ width: `${p1TrailPct}%` }}
              />
              <div
                className="absolute inset-y-0 left-0 bg-emerald-500"
                style={{ width: `${p1Pct}%` }}
              />
            </div>
            {/* Stamina Bar + Score & Lives */}
            <div className="relative h-1.5 bg-stone-900 border border-stone-950 mt-1 overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 bg-sky-400"
                style={{ width: `${p1StamPct}%` }}
              />
            </div>
            <div className="flex items-center justify-between mt-1 font-pixel text-[10px] text-stone-300 tabular-nums">
              <span>SCORE {hud.p1.score}</span>
              <span className="text-amber-300">LIVES x{hud.p1.lives}</span>
            </div>
          </div>
        </div>

        {/* TOP-CENTER: STAGE / WAVE */}
        <div className="hidden sm:flex flex-col items-center bg-[#14131c]/88 border-2 border-stone-500 px-3.5 py-1.5 shadow-[4px_4px_0_#09090b]">
          <div className="font-pixel text-[11px] text-amber-300 tabular-nums">
            STAGE {hud.stageNumber}/{hud.totalStages} · {hud.stageTitle}
          </div>
          <div className="font-pixel text-[10px] text-stone-300 tabular-nums mt-0.5">
            WAVE {Math.max(1, hud.waveIndex)}/{hud.totalWaves}
          </div>
        </div>

        {/* TOP-RIGHT: P2 MOHAMED HUD (2P) + UTILITY BUTTONS */}
        <div className="flex items-start gap-2">
          {hud.p2 && (
            <div className="flex items-center gap-2.5 bg-[#14131c]/88 border-2 border-sky-400/80 p-2 shadow-[4px_4px_0_#09090b]">
              <div className="w-44 md:w-52">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-pixel text-xs font-bold text-sky-300">
                    P2 {hud.p2.name}
                  </span>
                  <span className="font-pixel text-[11px] text-stone-200 tabular-nums">
                    {hud.p2.hp}/{hud.p2.maxHp}
                  </span>
                </div>
                <div className="relative h-3.5 bg-stone-900 border border-stone-950 mt-1 overflow-hidden">
                  <div
                    className="absolute inset-y-0 left-0 bg-amber-300/80 transition-[width] duration-75"
                    style={{
                      width: `${Math.max(0, Math.min(100, (hud.p2.trailHp / hud.p2.maxHp) * 100))}%`,
                    }}
                  />
                  <div
                    className="absolute inset-y-0 left-0 bg-sky-500"
                    style={{
                      width: `${Math.max(0, Math.min(100, (hud.p2.hp / hud.p2.maxHp) * 100))}%`,
                    }}
                  />
                </div>
                <div className="relative h-1.5 bg-stone-900 border border-stone-950 mt-1 overflow-hidden">
                  <div
                    className="absolute inset-y-0 left-0 bg-amber-400"
                    style={{
                      width: `${Math.max(0, Math.min(100, (hud.p2.stamina / hud.p2.maxStamina) * 100))}%`,
                    }}
                  />
                </div>
                <div className="flex items-center justify-between mt-1 font-pixel text-[10px] text-stone-300 tabular-nums">
                  <span>SCORE {hud.p2.score}</span>
                  <span className="text-amber-300">LIVES x{hud.p2.lives}</span>
                </div>
              </div>
              <img
                src={p2Portrait}
                alt="Mohamed pixel portrait with glasses"
                className="w-12 h-12 pixelated border-2 border-stone-950 bg-indigo-950 shrink-0"
              />
            </div>
          )}

          {/* Compact Mute & Pause Utility Buttons */}
          <div className="flex items-center gap-1.5 pointer-events-auto">
            <button
              type="button"
              tabIndex={-1}
              onClick={(e) => {
                e.currentTarget.blur();
                onToggleMute();
              }}
              aria-label={hud.muted ? 'Unmute audio' : 'Mute audio'}
              className="w-10 h-10 flex items-center justify-center bg-[#14131c]/90 border-2 border-stone-400 hover:border-amber-300 text-stone-100 font-pixel text-[11px] shadow-[3px_3px_0_#09090b] cursor-pointer"
              title="Mute [M]"
            >
              {hud.muted ? 'OFF' : 'SFX'}
            </button>
            <button
              type="button"
              tabIndex={-1}
              onClick={(e) => {
                e.currentTarget.blur();
                onTogglePause();
              }}
              aria-label="Pause game"
              className="w-10 h-10 flex items-center justify-center bg-[#14131c]/90 border-2 border-stone-400 hover:border-amber-300 text-stone-100 font-pixel text-xs shadow-[3px_3px_0_#09090b] cursor-pointer"
              title="Pause [Esc]"
            >
              II
            </button>
          </div>
        </div>
      </div>

      {/* RIGHT-EDGE FLASHING "GO ->" INDICATOR WHEN WAVE CLEARS */}
      {hud.goArrowActive && (
        <div className="self-end mr-4 my-auto bg-amber-400 text-stone-950 border-2 border-stone-950 px-3 py-1.5 font-pixel text-sm font-bold shadow-[4px_4px_0_#09090b] animate-pulse">
          GO →
        </div>
      )}

      {/* BOTTOM-CENTER: DEDICATED BOSS HEALTH BAR */}
      {hud.boss ? (
        <div className="mx-auto w-full max-w-xl bg-[#14131c]/92 border-2 border-red-500 p-2.5 shadow-[6px_6px_0_#09090b]">
          <div className="flex items-center gap-3">
            <img
              src={bossPortrait}
              alt={`${hud.boss.name} boss portrait`}
              className="w-11 h-11 pixelated border-2 border-stone-950 shrink-0"
            />
            <div className="flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-pixel text-xs font-bold text-red-400">
                  BOSS: {hud.boss.name} ({hud.boss.arabicName})
                </span>
                <span className="font-pixel text-[11px] text-amber-300 tabular-nums">
                  PHASE {hud.boss.phase}
                  {hud.boss.rageGlow ? ' · RAGE' : ''} · {hud.boss.hp}/{hud.boss.maxHp}
                </span>
              </div>
              <div className="relative h-4 bg-stone-900 border border-stone-950 mt-1 overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 bg-amber-300/85 transition-[width] duration-75"
                  style={{
                    width: `${Math.max(0, Math.min(100, (hud.boss.trailHp / hud.boss.maxHp) * 100))}%`,
                  }}
                />
                <div
                  className="absolute inset-y-0 left-0 bg-red-600"
                  style={{
                    width: `${Math.max(0, Math.min(100, (hud.boss.hp / hud.boss.maxHp) * 100))}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div />
      )}
    </div>
  );
}
