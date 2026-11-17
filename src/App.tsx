import { useEffect, useRef, useState } from 'react';
import { ControlsModal } from './components/ControlsModal';
import { CutsceneOverlay } from './components/CutsceneOverlay';
import { GameHud } from './components/GameHud';
import { OutcomeModal } from './components/OutcomeModal';
import { PauseModal } from './components/PauseModal';
import { StageSelectModal } from './components/StageSelectModal';
import { TitleScreen } from './components/TitleScreen';
import { LOGICAL_HEIGHT, LOGICAL_WIDTH } from './game/constants';
import { BeatEmUpEngine } from './game/engine';
import type { GameMode, HudSnapshot } from './game/types';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<BeatEmUpEngine | null>(null);

  const [hud, setHud] = useState<HudSnapshot | null>(null);
  const [showControls, setShowControls] = useState(false);
  const [showStageSelect, setShowStageSelect] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = new BeatEmUpEngine(canvas, (snapshot) => {
      setHud(snapshot);
    });
    engineRef.current = engine;
    engine.startLoop();

    const params = new URLSearchParams(window.location.search);
    if (params.get('autostart') === '1') {
      const mode: GameMode = params.get('mode') === '2P' ? '2P' : '1P';
      engine.startGame(mode, 1, true);
    }

    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, []);

  // Title-to-Start Handshake: Enter or Space starts 1P Solo when on Title with no modal open
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!hud || hud.phase !== 'TITLE') return;
      if (showControls || showStageSelect) {
        if (e.code === 'Escape') {
          setShowControls(false);
          setShowStageSelect(false);
        }
        return;
      }
      if (e.code === 'Enter' || e.code === 'Space') {
        e.preventDefault();
        engineRef.current?.startGame('1P', 1, false);
        canvasRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [hud, showControls, showStageSelect]);

  const handleStartMode = (mode: GameMode) => {
    setShowControls(false);
    setShowStageSelect(false);
    engineRef.current?.startGame(mode, 1, false);
    canvasRef.current?.focus();
  };

  const handleSelectStage = (stageNumber: number, mode: GameMode) => {
    setShowStageSelect(false);
    engineRef.current?.startGame(mode, stageNumber, false);
    canvasRef.current?.focus();
  };

  const highestUnlockedStage = engineRef.current?.getHighestUnlockedStage() ?? 1;

  return (
    <main className="relative w-screen h-screen bg-[#11131a] flex items-center justify-center overflow-hidden">
      {/* Isolated Canvas Mount */}
      <div className="relative w-full h-full flex items-center justify-center">
        <canvas
          ref={canvasRef}
          width={LOGICAL_WIDTH}
          height={LOGICAL_HEIGHT}
          tabIndex={0}
          data-testid="game-canvas"
          className="w-full h-full object-contain pixelated outline-none"
        />
      </div>

      {/* Title Screen */}
      {hud?.phase === 'TITLE' && (
        <TitleScreen
          bestScore={hud.bestScore}
          highestUnlockedStage={highestUnlockedStage}
          muted={hud.muted}
          onStartMode={handleStartMode}
          onOpenStageSelect={() => setShowStageSelect(true)}
          onOpenControls={() => setShowControls(true)}
          onToggleMute={() => engineRef.current?.toggleMute()}
        />
      )}

      {/* Active Gameplay HUD */}
      {hud &&
        (hud.phase === 'PLAYING' ||
          hud.phase === 'CUTSCENE' ||
          hud.phase === 'PAUSED') && (
          <GameHud
            hud={hud}
            onTogglePause={() => engineRef.current?.togglePause()}
            onToggleMute={() => engineRef.current?.toggleMute()}
          />
        )}

      {/* Pre-Stage / Pre-Boss Cutscene Overlay */}
      {hud?.phase === 'CUTSCENE' && (
        <CutsceneOverlay
          lines={hud.cutsceneLines}
          index={hud.cutsceneIndex}
          stageNumber={hud.stageNumber}
          onNext={() => {
            engineRef.current?.advanceCutscene();
            canvasRef.current?.focus();
          }}
          onSkip={() => {
            engineRef.current?.skipCutscene();
            canvasRef.current?.focus();
          }}
        />
      )}

      {/* Pause Modal */}
      {hud?.phase === 'PAUSED' && (
        <PauseModal
          stageNumber={hud.stageNumber}
          stageTitle={hud.stageTitle}
          onResume={() => {
            engineRef.current?.togglePause();
            canvasRef.current?.focus();
          }}
          onRestart={() => {
            engineRef.current?.restartCurrentStage();
            canvasRef.current?.focus();
          }}
          onTitle={() => engineRef.current?.returnToTitle()}
        />
      )}

      {/* Stage Clear / Victory / Game Over Modal */}
      {hud &&
        (hud.phase === 'STAGE_CLEAR' ||
          hud.phase === 'VICTORY' ||
          hud.phase === 'GAME_OVER') && (
          <OutcomeModal
            hud={hud}
            onNextStage={() => {
              engineRef.current?.nextStage();
              canvasRef.current?.focus();
            }}
            onRetry={() => {
              if (hud.phase === 'VICTORY') {
                engineRef.current?.startGame(hud.mode, 1, false);
              } else {
                engineRef.current?.restartCurrentStage();
              }
              canvasRef.current?.focus();
            }}
            onTitle={() => engineRef.current?.returnToTitle()}
          />
        )}

      {/* Title Sub-Modals */}
      {showControls && <ControlsModal onClose={() => setShowControls(false)} />}
      {showStageSelect && (
        <StageSelectModal
          highestUnlockedStage={highestUnlockedStage}
          onSelectStage={handleSelectStage}
          onClose={() => setShowStageSelect(false)}
        />
      )}
    </main>
  );
}
