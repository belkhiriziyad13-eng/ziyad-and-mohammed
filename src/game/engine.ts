import { arcadeAudio } from './audio';
import { drawChapterBackground } from './backgrounds';
import {
  GRAVITY,
  LOGICAL_HEIGHT,
  LOGICAL_WIDTH,
  SNACK_HEAL,
  STAGE_CUTSCENES,
  STAGES,
  STORAGE_BEST_SCORE_KEY,
  STORAGE_PROGRESS_KEY,
  STREET_Z_MAX,
  STREET_Z_MIN,
  TOTAL_STAGES,
} from './constants';
import {
  allocateAttackTokens,
  applyPlayerHitToEnemy,
  canPlayerAcceptAttack,
  checkBeltScrollerStrike,
  clamp,
  createEnemyEntity,
  createPlayerEntity,
  isAttackingState,
  startPlayerAttack,
  triggerOrBufferPlayerAttack,
  unlockNextStage,
  updateBossPhase,
} from './rules';
import { drawFighterSprite, drawPropSprite, drawSnackPickup } from './sprites';
import type {
  BossHudSnapshot,
  BreakableProp,
  CutsceneLine,
  EnemyEntity,
  FloatingTextSlot,
  GameMode,
  GamePhase,
  HudSnapshot,
  ParticleSlot,
  PickupEntity,
  PlayerEntity,
  PlayerHudSnapshot,
  ProjectileEntity,
  StageDefinition,
} from './types';

const PARTICLE_POOL_SIZE = 140;
const FLOATING_TEXT_POOL_SIZE = 32;

export class BeatEmUpEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private onHudChange: (snapshot: HudSnapshot) => void;

  private rafId: number | null = null;
  private lastTimestamp = 0;
  private elapsedSec = 0;

  private phase: GamePhase = 'TITLE';
  private mode: GameMode = '1P';
  private stageNumber = 1;
  private stage: StageDefinition = STAGES[0];
  private highestUnlockedStage = 1;
  private bestScore = 0;

  private cameraX = 0;
  private lockCameraX: number | null = null;
  private waveIndex = 0;
  private nextUid = 1;

  private hitstopTimer = 0;
  private shakeTrauma = 0;

  private p1: PlayerEntity = createPlayerEntity('ziyad', 160, 405);
  private p2: PlayerEntity | null = null;
  private enemies: EnemyEntity[] = [];
  private projectiles: ProjectileEntity[] = [];
  private props: BreakableProp[] = [];
  private pickups: PickupEntity[] = [];

  private particles: ParticleSlot[] = Array.from({ length: PARTICLE_POOL_SIZE }, () => ({
    active: false,
    kind: 'spark',
    x: 0,
    y: 0,
    z: 0,
    vx: 0,
    vy: 0,
    vz: 0,
    size: 4,
    life: 0,
    maxLife: 0.3,
    color: '#ffffff',
  }));
  private particleCursor = 0;

  private floatingTexts: FloatingTextSlot[] = Array.from(
    { length: FLOATING_TEXT_POOL_SIZE },
    () => ({
      active: false,
      text: '',
      x: 0,
      y: 0,
      vy: -40,
      life: 0,
      maxLife: 0.65,
      color: '#fde047',
      scale: 1,
    })
  );
  private textCursor = 0;

  private cutsceneLines: CutsceneLine[] = [];
  private cutsceneIndex = 0;

  private stageTimeSec = 0;
  private damageTaken = 0;
  private enemiesDefeated = 0;
  private stageClearDelay = 0;
  private hudSyncTimer = 0;
  private lastHudKey = '';

  // Unified input state (held keys + edge triggers + simultaneous attack chord tracking)
  private heldKeys = new Set<string>();
  private p1PunchTimestamp = -1;
  private p1KickTimestamp = -1;
  private p2PunchTimestamp = -1;
  private p2KickTimestamp = -1;

  // Ambient title-screen walkers
  private titleTime = 0;

  constructor(
    canvas: HTMLCanvasElement,
    onHudChange: (snapshot: HudSnapshot) => void
  ) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Could not initialize 2D canvas context');
    }
    this.ctx = ctx;
    this.onHudChange = onHudChange;
    this.loadPersistentProgress();
    this.syncBodyState();
    this.attachInputListeners();
    this.emitHud(true);
  }

  private loadPersistentProgress(): void {
    try {
      const savedStage = Number(localStorage.getItem(STORAGE_PROGRESS_KEY) || '1');
      if (Number.isFinite(savedStage) && savedStage >= 1 && savedStage <= TOTAL_STAGES) {
        this.highestUnlockedStage = savedStage;
      }
      const savedBest = Number(localStorage.getItem(STORAGE_BEST_SCORE_KEY) || '0');
      if (Number.isFinite(savedBest) && savedBest > 0) {
        this.bestScore = savedBest;
      }
    } catch {
      // Ignore storage access restrictions
    }
  }

  private saveProgress(): void {
    try {
      localStorage.setItem(STORAGE_PROGRESS_KEY, String(this.highestUnlockedStage));
      localStorage.setItem(STORAGE_BEST_SCORE_KEY, String(this.bestScore));
    } catch {
      // Ignore storage access restrictions
    }
  }

  public getHighestUnlockedStage(): number {
    return this.highestUnlockedStage;
  }

  public startLoop(): void {
    if (this.rafId !== null) return;
    this.lastTimestamp = performance.now();
    const tick = (now: number) => {
      const rawDt = (now - this.lastTimestamp) / 1000;
      this.lastTimestamp = now;
      const dt = Math.min(Math.max(rawDt, 0), 0.05);
      this.update(dt);
      this.render();
      this.rafId = requestAnimationFrame(tick);
    };
    this.rafId = requestAnimationFrame(tick);
  }

  public destroy(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.detachInputListeners();
    arcadeAudio.setMusicTrack('NONE');
  }

  public startGame(mode: GameMode, stageNum = 1, skipCutscene = false): void {
    arcadeAudio.unlock();
    this.mode = mode;
    this.p1 = createPlayerEntity('ziyad', 160, 400);
    this.p2 = mode === '2P' ? createPlayerEntity('mohamed', 110, 442) : null;
    this.loadStage(stageNum, skipCutscene);
  }

  public loadStage(stageNum: number, skipCutscene = false): void {
    const clamped = clamp(stageNum, 1, TOTAL_STAGES);
    this.stageNumber = clamped;
    this.stage = STAGES[clamped - 1];
    this.cameraX = 0;
    this.lockCameraX = null;
    this.waveIndex = 0;
    this.enemies = [];
    this.projectiles = [];
    this.pickups = [];
    this.hitstopTimer = 0;
    this.shakeTrauma = 0;
    this.stageTimeSec = 0;
    this.damageTaken = 0;
    this.enemiesDefeated = 0;
    this.stageClearDelay = 0;
    this.heldKeys.clear();

    // Reset player positions & heal slightly between stages while preserving lives/score
    this.p1.x = 150;
    this.p1.z = 392;
    this.p1.y = 0;
    this.p1.vx = 0;
    this.p1.vz = 0;
    this.p1.vy = 0;
    this.p1.facing = 1;
    this.p1.state = 'IDLE';
    this.p1.hp = Math.min(this.p1.maxHp, Math.max(this.p1.hp + 40, Math.round(this.p1.maxHp * 0.75)));
    this.p1.trailHp = this.p1.hp;
    this.p1.stamina = this.p1.maxStamina;
    this.p1.grabbedByEnemyId = null;

    if (this.p2) {
      this.p2.x = 110;
      this.p2.z = 444;
      this.p2.y = 0;
      this.p2.vx = 0;
      this.p2.vz = 0;
      this.p2.vy = 0;
      this.p2.facing = 1;
      this.p2.state = 'IDLE';
      this.p2.hp = Math.min(
        this.p2.maxHp,
        Math.max(this.p2.hp + 50, Math.round(this.p2.maxHp * 0.75))
      );
      this.p2.trailHp = this.p2.hp;
      this.p2.stamina = this.p2.maxStamina;
      this.p2.grabbedByEnemyId = null;
    }

    // Spawn stage destructible crates & trash cans
    this.props = this.stage.props.map((p) => ({
      uid: this.nextUid++,
      type: p.type,
      x: p.x,
      z: p.z,
      hp: 25,
      hitFlashTimer: 0,
      broken: false,
      dropSnack: p.dropSnack,
    }));

    const script = STAGE_CUTSCENES[clamped];
    if (script && script.length > 0 && !skipCutscene) {
      this.cutsceneLines = script;
      this.cutsceneIndex = 0;
      this.phase = 'CUTSCENE';
      arcadeAudio.setMusicTrack(this.stage.bossId ? 'BOSS' : 'STREET');
    } else {
      this.cutsceneLines = [];
      this.cutsceneIndex = 0;
      this.phase = 'PLAYING';
      arcadeAudio.setMusicTrack(this.stage.bossId ? 'BOSS' : 'STREET');
    }

    this.syncBodyState();
    this.emitHud(true);
  }

  public advanceCutscene(): void {
    if (this.phase !== 'CUTSCENE') return;
    arcadeAudio.unlock();
    if (this.cutsceneIndex + 1 < this.cutsceneLines.length) {
      this.cutsceneIndex += 1;
      this.emitHud(true);
    } else {
      this.skipCutscene();
    }
  }

  public skipCutscene(): void {
    if (this.phase !== 'CUTSCENE') return;
    this.heldKeys.clear();
    this.phase = 'PLAYING';
    this.syncBodyState();
    this.emitHud(true);
  }

  public togglePause(): void {
    if (this.phase === 'PLAYING') {
      this.phase = 'PAUSED';
      this.heldKeys.clear();
      arcadeAudio.setMusicTrack('NONE');
      this.syncBodyState();
      this.emitHud(true);
    } else if (this.phase === 'PAUSED') {
      this.phase = 'PLAYING';
      this.heldKeys.clear();
      arcadeAudio.setMusicTrack(this.stage.bossId ? 'BOSS' : 'STREET');
      this.syncBodyState();
      this.emitHud(true);
    }
  }

  public returnToTitle(): void {
    this.phase = 'TITLE';
    this.heldKeys.clear();
    this.enemies = [];
    this.projectiles = [];
    this.pickups = [];
    arcadeAudio.setMusicTrack('MENU');
    this.syncBodyState();
    this.emitHud(true);
  }

  public nextStage(): void {
    if (this.stageNumber < TOTAL_STAGES) {
      this.loadStage(this.stageNumber + 1, false);
    } else {
      this.returnToTitle();
    }
  }

  public restartCurrentStage(): void {
    this.startGame(this.mode, this.stageNumber, true);
  }

  public toggleMute(): boolean {
    const muted = arcadeAudio.toggleMute();
    this.emitHud(true);
    return muted;
  }

  private syncBodyState(): void {
    if (typeof document === 'undefined') return;
    let bodyState = 'title';
    if (this.phase === 'PLAYING' || this.phase === 'CUTSCENE') {
      bodyState = 'playing';
    } else if (this.phase === 'PAUSED') {
      bodyState = 'paused';
    } else if (
      this.phase === 'GAME_OVER' ||
      this.phase === 'STAGE_CLEAR' ||
      this.phase === 'VICTORY'
    ) {
      bodyState = 'gameover';
    }
    document.body.dataset.state = bodyState;
  }

  private getLivingPlayers(): PlayerEntity[] {
    const list: PlayerEntity[] = [];
    if (this.p1.hp > 0 || this.p1.lives > 0) list.push(this.p1);
    if (this.p2 && (this.p2.hp > 0 || this.p2.lives > 0)) list.push(this.p2);
    return list;
  }

  private getActivePlayers(): PlayerEntity[] {
    const list: PlayerEntity[] = [];
    if (this.p1.hp > 0) list.push(this.p1);
    if (this.p2 && this.p2.hp > 0) list.push(this.p2);
    return list;
  }

  private handleKeyDown = (e: KeyboardEvent): void => {
    const code = e.code;
    const key = e.key.toLowerCase();

    if (
      code === 'Space' ||
      code === 'ArrowUp' ||
      code === 'ArrowDown' ||
      code === 'ArrowLeft' ||
      code === 'ArrowRight'
    ) {
      if (this.phase === 'PLAYING' || this.phase === 'CUTSCENE') {
        e.preventDefault();
      }
    }

    if (e.repeat) return;

    if (key === 'm') {
      this.toggleMute();
      return;
    }

    if (code === 'Escape') {
      if (this.phase === 'PLAYING' || this.phase === 'PAUSED') {
        this.togglePause();
      }
      return;
    }

    if (this.phase === 'CUTSCENE') {
      if (code === 'Space' || code === 'Enter') {
        this.advanceCutscene();
      }
      return;
    }

    if (this.phase !== 'PLAYING') return;
    arcadeAudio.unlock();

    this.heldKeys.add(code);
    this.heldKeys.add(key);

    const nowSec = this.elapsedSec;

    // --- PLAYER 1 (ZIYAD) ACTIONS ---
    if (code === 'Space') {
      this.tryPlayerJump(this.p1);
    }
    if (key === 'e') {
      this.p1PunchTimestamp = nowSec;
      const chord =
        this.heldKeys.has('r') || Math.abs(nowSec - this.p1KickTimestamp) < 0.085;
      if (chord && startPlayerAttack(this.p1, 'SPECIAL')) {
        arcadeAudio.playSpecial(false);
      } else if (triggerOrBufferPlayerAttack(this.p1, 'PUNCH')) {
        arcadeAudio.playSwing(false);
      }
    }
    if (key === 'r') {
      this.p1KickTimestamp = nowSec;
      const chord =
        this.heldKeys.has('e') || Math.abs(nowSec - this.p1PunchTimestamp) < 0.085;
      if (chord && startPlayerAttack(this.p1, 'SPECIAL')) {
        arcadeAudio.playSpecial(false);
      } else if (triggerOrBufferPlayerAttack(this.p1, 'KICK')) {
        arcadeAudio.playSwing(false);
      }
    }

    // --- PLAYER 2 (MOHAMED) ACTIONS ---
    if (this.p2) {
      if (code === 'ShiftRight' || code === 'Enter') {
        this.tryPlayerJump(this.p2);
      }
      if (key === 'o') {
        this.p2PunchTimestamp = nowSec;
        const chord =
          this.heldKeys.has('p') || Math.abs(nowSec - this.p2KickTimestamp) < 0.085;
        if (chord && startPlayerAttack(this.p2, 'SPECIAL')) {
          arcadeAudio.playSpecial(true);
          this.spawnParticleBurst(this.p2.x + this.p2.facing * 12, this.p2.z, 66, 8, '#fef08a', 'glint');
        } else if (triggerOrBufferPlayerAttack(this.p2, 'PUNCH')) {
          arcadeAudio.playSwing(true);
        }
      }
      if (key === 'p') {
        this.p2KickTimestamp = nowSec;
        const chord =
          this.heldKeys.has('o') || Math.abs(nowSec - this.p2PunchTimestamp) < 0.085;
        if (chord && startPlayerAttack(this.p2, 'SPECIAL')) {
          arcadeAudio.playSpecial(true);
          this.spawnParticleBurst(this.p2.x + this.p2.facing * 12, this.p2.z, 66, 8, '#fef08a', 'glint');
        } else if (triggerOrBufferPlayerAttack(this.p2, 'KICK')) {
          arcadeAudio.playSwing(true);
        }
      }
    }
  };

  private handleKeyUp = (e: KeyboardEvent): void => {
    this.heldKeys.delete(e.code);
    this.heldKeys.delete(e.key.toLowerCase());
  };

  private handleWindowBlur = (): void => {
    this.heldKeys.clear();
  };

  private handleVisibilityChange = (): void => {
    if (document.hidden) {
      this.heldKeys.clear();
    }
  };

  private attachInputListeners(): void {
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('blur', this.handleWindowBlur);
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
  }

  private detachInputListeners(): void {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('blur', this.handleWindowBlur);
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
  }

  private tryPlayerJump(p: PlayerEntity): void {
    if (p.hp <= 0 || p.y > 0) return;
    if (p.state === 'HURT' || p.state === 'KNOCKDOWN' || p.state === 'VICTORY') return;
    if (p.grabbedByEnemyId !== null) {
      // Jumping shakes off a grappler!
      p.grabbedByEnemyId = null;
    }
    p.vy = p.jumpVel;
    p.state = 'JUMP';
    p.attackSpec = null;
    p.squashX = 0.85;
    p.squashY = 1.18;
    arcadeAudio.playJump();
    this.spawnParticleBurst(p.x, p.z, 2, 5, '#d6d3d1', 'dust');
  }

  private update(dt: number): void {
    this.elapsedSec += dt;
    this.shakeTrauma = Math.max(0, this.shakeTrauma - dt * 1.9);

    if (this.phase === 'TITLE') {
      this.titleTime += dt;
      return;
    }

    if (this.phase === 'PAUSED' || this.phase === 'GAME_OVER' || this.phase === 'VICTORY') {
      return;
    }

    // Update particles and floating text in real dt even during hitstop
    this.updateParticles(dt);
    this.updateFloatingTexts(dt);

    // Hit flash and trailing health bars tick smoothly in real dt
    for (const p of [this.p1, this.p2]) {
      if (!p) continue;
      if (p.hitFlashTimer > 0) p.hitFlashTimer = Math.max(0, p.hitFlashTimer - dt);
      if (p.glassesGlintTimer > 0) p.glassesGlintTimer = Math.max(0, p.glassesGlintTimer - dt);
      if (p.trailHp > p.hp) {
        p.trailHp = Math.max(p.hp, p.trailHp - dt * 42);
      } else {
        p.trailHp = p.hp;
      }
    }
    for (const e of this.enemies) {
      if (e.hitFlashTimer > 0) e.hitFlashTimer = Math.max(0, e.hitFlashTimer - dt);
      if (e.trailHp > e.hp) {
        e.trailHp = Math.max(e.hp, e.trailHp - dt * 65);
      } else {
        e.trailHp = e.hp;
      }
    }

    if (this.phase === 'CUTSCENE') {
      return;
    }

    if (this.hitstopTimer > 0) {
      this.hitstopTimer = Math.max(0, this.hitstopTimer - dt);
      return;
    }

    this.stageTimeSec += dt;

    // Update Players
    this.updatePlayer(this.p1, dt, true);
    if (this.p2) {
      this.updatePlayer(this.p2, dt, false);
    }

    // Check Wave Triggering & Camera Scrolling
    this.updateCameraAndWaves();

    // Update Attack Tokens for fair arcade combat
    const activePlayers = this.getActivePlayers();
    allocateAttackTokens(this.enemies, activePlayers);

    // Update Enemies & Bosses
    this.updateEnemies(dt, activePlayers);

    // Update Projectiles
    this.updateProjectiles(dt, activePlayers);

    // Update Props & Pickups
    for (const prop of this.props) {
      if (prop.hitFlashTimer > 0) prop.hitFlashTimer = Math.max(0, prop.hitFlashTimer - dt);
    }
    this.updatePickups(dt, activePlayers);

    // Check Stage Clear or Defeat
    this.checkStageOutcome(dt);

    // Throttled HUD sync
    this.hudSyncTimer += dt;
    if (this.hudSyncTimer >= 0.08) {
      this.hudSyncTimer = 0;
      this.emitHud(false);
    }
  }

  private updatePlayer(p: PlayerEntity, dt: number, isP1: boolean): void {
    // Respawn handling if player has remaining lives
    if (p.hp <= 0) {
      p.downTimer += dt;
      if (p.lives > 0 && p.downTimer >= 1.1) {
        p.lives -= 1;
        p.hp = p.maxHp;
        p.trailHp = p.maxHp;
        p.stamina = p.maxStamina;
        p.invulnTimer = 2.2;
        p.state = 'IDLE';
        p.downTimer = 0;
        p.y = 140;
        p.vy = 0;
        p.x = clamp(this.cameraX + 180, 60, this.stage.lengthX - 60);
        p.z = 400;
        this.emitHud(true);
      }
      return;
    }

    p.animTime += dt;
    p.stamina = Math.min(p.maxStamina, p.stamina + dt * 13);
    if (p.invulnTimer > 0) p.invulnTimer = Math.max(0, p.invulnTimer - dt);
    if (p.comboWindowTimer > 0) p.comboWindowTimer = Math.max(0, p.comboWindowTimer - dt);
    if (p.bufferTimer > 0) {
      p.bufferTimer = Math.max(0, p.bufferTimer - dt);
      if (p.bufferTimer <= 0) p.bufferedAttack = null;
    }

    // Damped squash-and-stretch recovery
    p.squashX += (1 - p.squashX) * Math.min(1, dt * 14);
    p.squashY += (1 - p.squashY) * Math.min(1, dt * 14);

    // Airborne gravity
    if (p.y > 0 || p.vy > 0) {
      p.y += p.vy * dt;
      p.vy -= GRAVITY * dt;
      if (p.y <= 0) {
        p.y = 0;
        p.vy = 0;
        p.squashX = 1.22;
        p.squashY = 0.78;
        this.spawnParticleBurst(p.x, p.z, 2, 5, '#d6d3d1', 'dust');
        if (p.state === 'JUMP') {
          p.state = 'IDLE';
        }
      }
    }

    // State timers
    if (p.state === 'HURT' || p.state === 'KNOCKDOWN') {
      p.stateTimer -= dt;
      p.x += p.vx * dt;
      p.vx *= Math.pow(0.05, dt);
      if (p.stateTimer <= 0 && p.y === 0) {
        p.state = 'IDLE';
      }
      this.clampPlayerBounds(p);
      return;
    }

    if (p.grabbedByEnemyId !== null) {
      p.state = 'HURT';
      p.vx = 0;
      p.vz = 0;
      return;
    }

    if (isAttackingState(p.state) && p.attackSpec) {
      p.stateTimer -= dt;
      const spec = p.attackSpec;
      const elapsed = spec.windupSec + spec.activeSec + spec.recoverySec - p.stateTimer;
      const inActiveWindow =
        elapsed >= spec.windupSec && elapsed <= spec.windupSec + spec.activeSec;

      if (inActiveWindow) {
        this.evaluatePlayerStrike(p);
      }

      if (p.state === 'SPECIAL') {
        p.x += p.vx * dt;
        p.vx *= Math.pow(0.18, dt);
      }

      if (p.stateTimer <= 0) {
        p.attackSpec = null;
        p.state = p.y > 0 ? 'JUMP' : 'IDLE';
        if (p.bufferedAttack) {
          const next = p.bufferedAttack;
          p.bufferedAttack = null;
          if (startPlayerAttack(p, next)) {
            arcadeAudio.playSwing(p.id === 'mohamed');
          }
        }
      }
      this.clampPlayerBounds(p);
      return;
    }

    // Movement input
    let moveX = 0;
    let moveZ = 0;
    if (isP1) {
      if (this.heldKeys.has('KeyA') || (this.mode === '1P' && this.heldKeys.has('ArrowLeft'))) {
        moveX -= 1;
      }
      if (this.heldKeys.has('KeyD') || (this.mode === '1P' && this.heldKeys.has('ArrowRight'))) {
        moveX += 1;
      }
      if (this.heldKeys.has('KeyW') || (this.mode === '1P' && this.heldKeys.has('ArrowUp'))) {
        moveZ -= 1;
      }
      if (this.heldKeys.has('KeyS') || (this.mode === '1P' && this.heldKeys.has('ArrowDown'))) {
        moveZ += 1;
      }
    } else {
      if (this.heldKeys.has('ArrowLeft')) moveX -= 1;
      if (this.heldKeys.has('ArrowRight')) moveX += 1;
      if (this.heldKeys.has('ArrowUp')) moveZ -= 1;
      if (this.heldKeys.has('ArrowDown')) moveZ += 1;
    }

    if (moveX !== 0 && moveZ !== 0) {
      moveX *= 0.7071;
      moveZ *= 0.7071;
    }

    p.vx = moveX * p.walkSpeedX;
    p.vz = moveZ * p.walkSpeedZ;
    p.x += p.vx * dt;
    p.z += p.vz * dt;

    if (moveX > 0.1) p.facing = 1;
    else if (moveX < -0.1) p.facing = -1;

    const distMoved = Math.hypot(p.vx * dt, p.vz * dt);
    p.walkDistance += distMoved;

    if (p.y === 0) {
      p.state = Math.abs(moveX) > 0.05 || Math.abs(moveZ) > 0.05 ? 'WALK' : 'IDLE';
    } else {
      p.state = 'JUMP';
    }

    this.clampPlayerBounds(p);
  }

  private clampPlayerBounds(p: PlayerEntity): void {
    const minX = this.lockCameraX !== null ? this.lockCameraX + 34 : this.cameraX + 34;
    const maxX =
      this.lockCameraX !== null
        ? this.lockCameraX + LOGICAL_WIDTH - 34
        : this.stage.lengthX - 34;
    p.x = clamp(p.x, minX, maxX);
    p.z = clamp(p.z, STREET_Z_MIN, STREET_Z_MAX);
  }

  private evaluatePlayerStrike(p: PlayerEntity): void {
    const spec = p.attackSpec;
    if (!spec) return;
    const bidirectional = p.state === 'SPECIAL' && p.id === 'ziyad';

    // Hit Enemies
    for (const enemy of this.enemies) {
      if (enemy.hp <= 0 || p.hitTargetIds.has(enemy.uid)) continue;
      const hit = checkBeltScrollerStrike({
        attackerX: p.x,
        attackerZ: p.z,
        attackerY: p.y,
        facing: p.facing,
        reachX: spec.reachX,
        depthZ: spec.depthZ,
        heightY: spec.heightY,
        targetX: enemy.x,
        targetZ: enemy.z,
        targetY: enemy.y,
        targetHalfW: enemy.hitboxHalfW,
        targetHalfZ: enemy.hitboxHalfZ,
        targetHeight: enemy.hitboxHeight,
        bidirectional,
      });

      if (!hit) continue;
      p.hitTargetIds.add(enemy.uid);

      const res = applyPlayerHitToEnemy(p, enemy, spec);
      if (res.outcome === 'BLOCKED') {
        arcadeAudio.playBlock();
        this.spawnParticleBurst(enemy.x, enemy.z, 52, 6, '#38bdf8', 'spark');
        this.spawnFloatingText('BLOCKED!', enemy.x, enemy.z - 84, '#38bdf8', 0.95);
      } else {
        const isHeavy = spec.kind !== 'PUNCH' || spec.comboStep >= 3 || p.id === 'mohamed';
        arcadeAudio.playHit(isHeavy);
        this.hitstopTimer = Math.max(this.hitstopTimer, spec.hitstopSec);
        this.shakeTrauma = Math.min(1, this.shakeTrauma + spec.shakeTrauma);

        const impactX = (p.x + enemy.x) / 2;
        this.spawnParticleBurst(impactX, enemy.z, 46, isHeavy ? 14 : 7, '#fde047', 'spark');
        this.spawnFloatingText(
          `${spec.label} -${res.damage}`,
          enemy.x,
          enemy.z - 84 - enemy.y,
          isHeavy ? '#facc15' : '#ffffff',
          isHeavy ? 1.15 : 0.95
        );

        if (res.outcome === 'KO') {
          this.enemiesDefeated += 1;
          if (p.score > this.bestScore) {
            this.bestScore = p.score;
          }
          this.emitHud(true);
        } else if (enemy.isBoss) {
          const phaseChange = updateBossPhase(enemy);
          if (phaseChange.changed) {
            this.hitstopTimer = 0.08;
            this.shakeTrauma = 0.7;
            arcadeAudio.playBossTelegraph();
            const shout =
              enemy.kind === 'saad'
                ? 'RAGE MODE!'
                : enemy.kind === 'baraa' && phaseChange.newPhase === 3
                  ? 'FULL FOCUS!'
                  : 'PHASE UP!';
            this.spawnFloatingText(shout, enemy.x, enemy.z - 102, '#ef4444', 1.3);
          }
          this.emitHud(true);
        }
      }
    }

    // Deflect incoming enemy pebbles or soda cans back at bullies!
    for (const proj of this.projectiles) {
      if (!proj.alive || !proj.fromEnemy) continue;
      const dz = Math.abs(proj.z - p.z);
      const dx = (proj.x - p.x) * p.facing;
      if (dz <= spec.depthZ + 18 && dx >= -16 && dx <= spec.reachX + 20) {
        proj.fromEnemy = false;
        proj.vx = p.facing * Math.max(360, Math.abs(proj.vx) * 1.45);
        proj.vy = 110;
        proj.damage = 18;
        arcadeAudio.playHit(false);
        this.spawnFloatingText('DEFLECT!', proj.x, proj.z - 50, '#4ade80', 1);
      }
    }

    // Hit Breakable Crates & Trash Cans
    for (const prop of this.props) {
      if (prop.broken || p.hitTargetIds.has(prop.uid)) continue;
      const hit = checkBeltScrollerStrike({
        attackerX: p.x,
        attackerZ: p.z,
        attackerY: p.y,
        facing: p.facing,
        reachX: spec.reachX,
        depthZ: spec.depthZ,
        heightY: spec.heightY,
        targetX: prop.x,
        targetZ: prop.z,
        targetY: 0,
        targetHalfW: 20,
        targetHalfZ: 18,
        targetHeight: 42,
        bidirectional,
      });
      if (!hit) continue;
      p.hitTargetIds.add(prop.uid);
      prop.hp -= spec.damage;
      prop.hitFlashTimer = 0.08;
      arcadeAudio.playCrateBreak();
      this.spawnParticleBurst(prop.x, prop.z, 22, 10, '#d97706', 'spark');
      if (prop.hp <= 0) {
        prop.broken = true;
        if (prop.dropSnack) {
          this.pickups.push({
            uid: this.nextUid++,
            snack: prop.dropSnack,
            x: prop.x,
            z: prop.z,
            y: 24,
            vy: 210,
            healAmount: SNACK_HEAL[prop.dropSnack].heal,
            bobPhase: 0,
            collected: false,
          });
        }
      }
    }
  }

  private updateCameraAndWaves(): void {
    const activePlayers = this.getActivePlayers();
    if (activePlayers.length === 0) return;

    const avgX =
      activePlayers.reduce((sum, p) => sum + p.x, 0) / activePlayers.length;

    // Trigger next wave when players advance past triggerX
    if (this.lockCameraX === null && this.waveIndex < this.stage.waves.length) {
      const nextWave = this.stage.waves[this.waveIndex];
      if (avgX >= nextWave.triggerX) {
        const lockX = clamp(
          nextWave.triggerX - 180,
          0,
          Math.max(0, this.stage.lengthX - LOGICAL_WIDTH)
        );
        this.cameraX = lockX;
        this.lockCameraX = lockX;
        for (const def of nextWave.enemies) {
          const spawnX = clamp(lockX + LOGICAL_WIDTH * 0.5 + def.offsetX, 40, this.stage.lengthX - 40);
          const e = createEnemyEntity(
            this.nextUid++,
            def.kind,
            spawnX,
            def.z,
            this.stageNumber
          );
          this.enemies.push(e);
        }
        this.waveIndex += 1;
        this.emitHud(true);
      }
    }

    // Unlock camera once all spawned enemies in current wave are KO'd
    if (this.lockCameraX !== null && this.enemies.length === 0) {
      this.lockCameraX = null;
      this.emitHud(true);
    }

    if (this.lockCameraX !== null) {
      this.cameraX = this.lockCameraX;
    } else {
      const targetCam = clamp(
        avgX - LOGICAL_WIDTH * 0.36,
        this.cameraX,
        Math.max(0, this.stage.lengthX - LOGICAL_WIDTH)
      );
      this.cameraX += (targetCam - this.cameraX) * 0.14;
    }
  }

  private updateEnemies(dt: number, players: PlayerEntity[]): void {
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      e.animTime += dt;
      e.squashX += (1 - e.squashX) * Math.min(1, dt * 12);
      e.squashY += (1 - e.squashY) * Math.min(1, dt * 12);

      // Gravity for knocked-down enemies
      if (e.y > 0 || e.vy > 0) {
        e.y += e.vy * dt;
        e.vy -= GRAVITY * dt;
        if (e.y <= 0) {
          e.y = 0;
          e.vy = 0;
          this.spawnParticleBurst(e.x, e.z, 2, 6, '#a8a29e', 'dust');
        }
      }

      // KO removal after knockback arc
      if (e.hp <= 0) {
        e.x += e.vx * dt;
        e.vx *= Math.pow(0.08, dt);
        e.koTimer -= dt;
        if (e.koTimer <= 0) {
          this.spawnParticleBurst(e.x, e.z, 18, 12, '#e4e4e7', 'dust');
          this.enemies.splice(i, 1);
        }
        continue;
      }

      if (e.state === 'KNOCKDOWN') {
        e.x += e.vx * dt;
        e.vx *= Math.pow(0.08, dt);
        e.knockdownTimer -= dt;
        if (e.knockdownTimer <= 0 && e.y === 0) {
          e.state = 'IDLE';
          e.aiAction = 'APPROACH';
        }
        this.clampEnemyBounds(e);
        continue;
      }

      if (e.state === 'HURT') {
        e.x += e.vx * dt;
        e.vx *= Math.pow(0.05, dt);
        e.stateTimer -= dt;
        if (e.stateTimer <= 0) {
          e.state = 'IDLE';
          e.aiAction = 'APPROACH';
        }
        this.clampEnemyBounds(e);
        continue;
      }

      if (e.state === 'BLOCK') {
        e.stateTimer -= dt;
        if (e.stateTimer <= 0) {
          // Baraa immediate swift counter-kick!
          e.state = 'KICK';
          e.aiAction = 'ATTACK';
          e.stateTimer = 0.28;
          e.hitPlayersThisSwing.clear();
          e.telegraphTimer = 0;
        }
        continue;
      }

      if (players.length === 0) {
        e.state = 'IDLE';
        continue;
      }

      // Pick nearest living player
      let target = players[0];
      let bestDist = Infinity;
      for (const p of players) {
        const d = Math.hypot(p.x - e.x, (p.z - e.z) * 1.4);
        if (d < bestDist) {
          bestDist = d;
          target = p;
        }
      }

      if (e.attackCooldown > 0) e.attackCooldown = Math.max(0, e.attackCooldown - dt);

      if (e.isBoss) {
        this.updateBossAI(e, target, dt);
      } else {
        this.updateRegularEnemyAI(e, target, dt);
      }

      this.clampEnemyBounds(e);
    }
  }

  private clampEnemyBounds(e: EnemyEntity): void {
    const camLeft = this.lockCameraX ?? this.cameraX;
    e.x = clamp(e.x, camLeft + 24, camLeft + LOGICAL_WIDTH - 24);
    e.z = clamp(e.z, STREET_Z_MIN, STREET_Z_MAX);
  }

  private updateRegularEnemyAI(e: EnemyEntity, target: PlayerEntity, dt: number): void {
    const dx = target.x - e.x;
    const dz = target.z - e.z;
    e.facing = dx >= 0 ? 1 : -1;

    // Grappler holding a player
    if (e.aiAction === 'GRAB_HOLD' && e.grabbingPlayerId) {
      if (target.id !== e.grabbingPlayerId || target.grabbedByEnemyId !== e.uid || target.hp <= 0) {
        e.aiAction = 'RECOVER';
        e.grabbingPlayerId = null;
        e.state = 'IDLE';
        return;
      }
      e.state = 'PUNCH';
      e.aiTimer -= dt;
      if (e.aiTimer <= 0) {
        // Release after 1.3s or small squeeze damage
        target.grabbedByEnemyId = null;
        e.grabbingPlayerId = null;
        e.aiAction = 'RECOVER';
        e.attackCooldown = 1.6;
        e.state = 'IDLE';
      }
      return;
    }

    // Windup telegraph before active hit
    if (e.aiAction === 'WINDUP') {
      e.telegraphTimer -= dt;
      e.state = 'IDLE';
      if (e.telegraphTimer <= 0) {
        e.aiAction = 'ATTACK';
        e.state = e.kind === 'shover' ? 'PUNCH' : 'KICK';
        e.stateTimer = e.kind === 'shover' ? 0.34 : 0.28;
        e.hitPlayersThisSwing.clear();
        if (e.kind === 'shover') {
          e.vx = e.facing * 240;
        }
      }
      return;
    }

    if (e.aiAction === 'ATTACK') {
      e.stateTimer -= dt;
      if (e.kind === 'shover') {
        e.x += e.vx * dt;
      }
      this.tryEnemyMeleeHit(e, target);
      if (e.stateTimer <= 0) {
        e.aiAction = 'RECOVER';
        e.state = 'IDLE';
        e.attackCooldown = e.kind === 'taunter' ? 0.9 : 1.35;
      }
      return;
    }

    // Ranged Thrower behavior: stays near screen edge and lobs pebbles/soda cans
    if (e.kind === 'thrower') {
      const desiredSide = e.x < target.x ? -1 : 1;
      const desiredX = target.x + desiredSide * 270;
      const camLeft = this.lockCameraX ?? this.cameraX;
      const clampedDesiredX = clamp(desiredX, camLeft + 52, camLeft + LOGICAL_WIDTH - 52);

      const moveX = clamp(clampedDesiredX - e.x, -1, 1);
      const moveZ = clamp(dz, -1, 1);
      e.x += moveX * 115 * dt;
      e.z += moveZ * 90 * dt;
      e.walkDistance += Math.hypot(moveX * 115 * dt, moveZ * 90 * dt);
      e.state = Math.abs(moveX) > 0.1 || Math.abs(moveZ) > 0.1 ? 'WALK' : 'IDLE';

      if (Math.abs(dz) < 34 && e.attackCooldown <= 0) {
        const kind = e.uid % 2 === 0 ? 'can' : 'pebble';
        this.projectiles.push({
          uid: this.nextUid++,
          kind,
          fromEnemy: true,
          x: e.x + e.facing * 18,
          z: e.z,
          y: 44,
          vx: e.facing * 275,
          vz: 0,
          vy: 120,
          damage: e.attackDamage,
          radius: 10,
          rotation: 0,
          alive: true,
        });
        e.state = 'PUNCH';
        e.attackCooldown = 2.1;
      }
      return;
    }

    // Enemies WITHOUT an attack token circle menacingly instead of dogpiling!
    if (!e.hasToken) {
      e.orbitAngle += dt * 1.4;
      const goalX = target.x + Math.cos(e.orbitAngle) * 145;
      const goalZ = clamp(target.z + Math.sin(e.orbitAngle) * 58, STREET_Z_MIN, STREET_Z_MAX);
      const dirX = goalX - e.x;
      const dirZ = goalZ - e.z;
      const len = Math.hypot(dirX, dirZ) || 1;
      const spd = 110;
      e.x += (dirX / len) * spd * dt;
      e.z += (dirZ / len) * spd * dt;
      e.walkDistance += spd * dt;
      e.state = 'WALK';
      return;
    }

    // Token-holding melee enemy approaches target lane
    const engageDist = e.kind === 'shover' ? 88 : 54;
    if (Math.abs(dx) > engageDist || Math.abs(dz) > 22) {
      const speedX = e.kind === 'taunter' ? 162 : e.kind === 'shover' ? 152 : 122;
      const speedZ = 105;
      const vx = Math.abs(dx) > engageDist ? Math.sign(dx) * speedX : 0;
      const vz = Math.abs(dz) > 12 ? Math.sign(dz) * speedZ : 0;
      e.x += vx * dt;
      e.z += vz * dt;
      e.walkDistance += Math.hypot(vx * dt, vz * dt);
      e.state = 'WALK';
    } else if (e.attackCooldown <= 0) {
      if (e.kind === 'grappler' && target.grabbedByEnemyId === null && target.y === 0) {
        // Grab player for 1.25s while other bullies threaten!
        target.grabbedByEnemyId = e.uid;
        e.grabbingPlayerId = target.id;
        e.aiAction = 'GRAB_HOLD';
        e.aiTimer = 1.25;
        this.spawnFloatingText('GRABBED! JUMP!', target.x, target.z - 92, '#f97316', 0.9);
      } else {
        // Visible windup telegraph before strike
        e.aiAction = 'WINDUP';
        e.telegraphMax = e.kind === 'shover' ? 0.42 : 0.3;
        e.telegraphTimer = e.telegraphMax;
      }
    } else {
      e.state = 'IDLE';
    }
  }

  private updateBossAI(boss: EnemyEntity, target: PlayerEntity, dt: number): void {
    const dx = target.x - boss.x;
    const dz = target.z - boss.z;

    if (boss.aiAction === 'WINDUP') {
      boss.facing = dx >= 0 ? 1 : -1;
      boss.telegraphTimer -= dt;
      boss.state = 'IDLE';
      if (boss.telegraphTimer <= 0) {
        boss.hitPlayersThisSwing.clear();
        if (boss.kind === 'saad' && boss.bossPhase === 2) {
          boss.aiAction = 'BOSS_CHARGE';
          boss.state = 'SPECIAL';
          boss.superArmor = true;
          boss.stateTimer = 0.85;
          boss.vx = boss.facing * 355;
        } else if (boss.kind === 'anas' && boss.bossPhase === 2) {
          boss.aiAction = 'BOSS_DASH';
          boss.state = 'PUNCH';
          boss.stateTimer = 0.55;
          boss.vx = boss.facing * 320;
        } else if (boss.kind === 'baraa' && boss.bossPhase >= 2) {
          boss.aiAction = 'BOSS_SWEEP';
          boss.state = 'KICK';
          boss.stateTimer = 0.45;
          boss.vx = boss.facing * 240;
        } else {
          boss.aiAction = 'ATTACK';
          boss.state = boss.kind === 'saad' ? 'PUNCH' : 'KICK';
          boss.stateTimer = 0.36;
          boss.superArmor = boss.kind === 'saad';
        }
      }
      return;
    }

    if (
      boss.aiAction === 'ATTACK' ||
      boss.aiAction === 'BOSS_DASH' ||
      boss.aiAction === 'BOSS_CHARGE' ||
      boss.aiAction === 'BOSS_SWEEP'
    ) {
      boss.stateTimer -= dt;
      if (boss.aiAction !== 'ATTACK') {
        boss.x += boss.vx * dt;
      }
      this.tryEnemyMeleeHit(boss, target);
      if (boss.stateTimer <= 0) {
        boss.aiAction = 'RECOVER';
        boss.state = 'IDLE';
        boss.superArmor = false;
        boss.attackCooldown = boss.bossPhase >= 2 ? 0.72 : 1.05;
      }
      return;
    }

    boss.facing = dx >= 0 ? 1 : -1;
    const speedMult =
      boss.kind === 'anas' && boss.bossPhase === 2
        ? 1.35
        : boss.kind === 'baraa' && boss.bossPhase === 3
          ? 1.4
          : 1;
    const spdX = (boss.kind === 'saad' ? 142 : 196) * speedMult;
    const spdZ = 128 * speedMult;

    const triggerDist = boss.kind === 'saad' && boss.bossPhase === 2 ? 210 : 72;
    if (Math.abs(dx) > triggerDist || Math.abs(dz) > 22) {
      const vx = Math.abs(dx) > 55 ? Math.sign(dx) * spdX : 0;
      const vz = Math.abs(dz) > 14 ? Math.sign(dz) * spdZ : 0;
      boss.x += vx * dt;
      boss.z += vz * dt;
      boss.walkDistance += Math.hypot(vx * dt, vz * dt);
      boss.state = 'WALK';
    } else if (boss.attackCooldown <= 0) {
      boss.aiAction = 'WINDUP';
      boss.telegraphMax = boss.bossPhase >= 2 ? 0.34 : 0.42;
      boss.telegraphTimer = boss.telegraphMax;
      arcadeAudio.playBossTelegraph();
    } else {
      boss.state = 'IDLE';
    }
  }

  private tryEnemyMeleeHit(enemy: EnemyEntity, target: PlayerEntity): void {
    const players = this.getActivePlayers();
    for (const p of players) {
      if (p.invulnTimer > 0 || enemy.hitPlayersThisSwing.has(p.id)) continue;
      const reach = enemy.aiAction === 'BOSS_CHARGE' ? 62 : 56;
      const hit = checkBeltScrollerStrike({
        attackerX: enemy.x,
        attackerZ: enemy.z,
        attackerY: enemy.y,
        facing: enemy.facing,
        reachX: reach,
        depthZ: 24,
        heightY: 72,
        targetX: p.x,
        targetZ: p.z,
        targetY: p.y,
        targetHalfW: p.hitboxHalfW,
        targetHalfZ: p.hitboxHalfZ,
        targetHeight: p.hitboxHeight,
      });

      if (!hit) continue;
      enemy.hitPlayersThisSwing.add(p.id);
      this.damagePlayer(p, enemy.attackDamage, enemy.facing, enemy.knockdownAttack || enemy.isBoss);
    }
    void target;
  }

  private damagePlayer(
    p: PlayerEntity,
    dmg: number,
    fromDir: 1 | -1,
    knockdown: boolean
  ): void {
    if (p.hp <= 0 || p.invulnTimer > 0) return;
    p.hp = Math.max(0, p.hp - dmg);
    p.hitFlashTimer = 0.09;
    p.invulnTimer = knockdown ? 0.9 : 0.45;
    p.grabbedByEnemyId = null;
    p.attackSpec = null;
    p.state = knockdown || p.hp <= 0 ? 'KNOCKDOWN' : 'HURT';
    p.stateTimer = knockdown ? 0.6 : 0.28;
    p.vx = fromDir * (knockdown ? 210 : 120);
    if (knockdown || p.hp <= 0) {
      p.vy = 210;
    }
    this.damageTaken += dmg;
    this.shakeTrauma = Math.min(1, this.shakeTrauma + 0.35);
    arcadeAudio.playPlayerHurt();
    this.spawnParticleBurst(p.x, p.z, 46, 9, '#ef4444', 'spark');
    this.spawnFloatingText(`-${dmg}`, p.x, p.z - 84, '#ef4444', 1);
    this.emitHud(true);
  }

  private updateProjectiles(dt: number, players: PlayerEntity[]): void {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const proj = this.projectiles[i];
      proj.x += proj.vx * dt;
      proj.z += proj.vz * dt;
      proj.y += proj.vy * dt;
      proj.vy -= GRAVITY * 0.48 * dt;
      proj.rotation += dt * 12;

      if (proj.y <= 0) {
        proj.alive = false;
        this.spawnParticleBurst(proj.x, proj.z, 4, 4, '#a8a29e', 'dust');
      }

      if (proj.alive && proj.fromEnemy) {
        for (const p of players) {
          if (p.invulnTimer > 0) continue;
          if (
            Math.abs(proj.x - p.x) < p.hitboxHalfW + proj.radius &&
            Math.abs(proj.z - p.z) < 20 &&
            proj.y >= p.y &&
            proj.y <= p.y + p.hitboxHeight
          ) {
            proj.alive = false;
            this.damagePlayer(p, proj.damage, proj.vx >= 0 ? 1 : -1, false);
            break;
          }
        }
      } else if (proj.alive && !proj.fromEnemy) {
        for (const e of this.enemies) {
          if (e.hp <= 0) continue;
          if (
            Math.abs(proj.x - e.x) < e.hitboxHalfW + proj.radius &&
            Math.abs(proj.z - e.z) < 26
          ) {
            proj.alive = false;
            e.hp = Math.max(0, e.hp - proj.damage);
            e.hitFlashTimer = 0.08;
            e.state = e.hp <= 0 ? 'KNOCKDOWN' : 'HURT';
            e.stateTimer = 0.3;
            e.koTimer = 0.5;
            arcadeAudio.playHit(true);
            this.spawnFloatingText(`-${proj.damage}`, e.x, e.z - 80, '#4ade80', 1.05);
            if (e.hp <= 0) {
              this.enemiesDefeated += 1;
              this.p1.score += e.scoreValue;
            }
            break;
          }
        }
      }

      if (!proj.alive) {
        this.projectiles.splice(i, 1);
      }
    }
  }

  private updatePickups(dt: number, players: PlayerEntity[]): void {
    for (let i = this.pickups.length - 1; i >= 0; i--) {
      const item = this.pickups[i];
      item.bobPhase += dt * 4;
      if (item.y > 0 || item.vy !== 0) {
        item.y += item.vy * dt;
        item.vy -= GRAVITY * 0.7 * dt;
        if (item.y <= 0) {
          item.y = 0;
          item.vy = 0;
        }
      }

      for (const p of players) {
        if (Math.abs(p.x - item.x) < 34 && Math.abs(p.z - item.z) < 24) {
          p.hp = Math.min(p.maxHp, p.hp + item.healAmount);
          p.score += 50;
          item.collected = true;
          arcadeAudio.playPickup();
          this.spawnFloatingText(
            SNACK_HEAL[item.snack].label,
            item.x,
            item.z - 42,
            '#4ade80',
            0.95
          );
          this.emitHud(true);
          break;
        }
      }

      if (item.collected) {
        this.pickups.splice(i, 1);
      }
    }
  }

  private checkStageOutcome(dt: number): void {
    const anyAlive =
      this.p1.hp > 0 ||
      this.p1.lives > 0 ||
      (this.p2 !== null && (this.p2.hp > 0 || this.p2.lives > 0));

    if (!anyAlive) {
      this.phase = 'GAME_OVER';
      arcadeAudio.setMusicTrack('NONE');
      this.syncBodyState();
      this.emitHud(true);
      return;
    }

    const allWavesCleared =
      this.waveIndex >= this.stage.waves.length && this.enemies.length === 0;

    if (allWavesCleared) {
      this.stageClearDelay += dt;
      if (this.stageClearDelay >= 0.85) {
        this.p1.state = 'VICTORY';
        if (this.p2 && this.p2.hp > 0) this.p2.state = 'VICTORY';
        this.highestUnlockedStage = unlockNextStage(
          this.highestUnlockedStage,
          this.stageNumber
        );
        const totalScore = this.p1.score + (this.p2?.score ?? 0);
        if (totalScore > this.bestScore) this.bestScore = totalScore;
        this.saveProgress();

        if (this.stageNumber >= TOTAL_STAGES) {
          this.phase = 'VICTORY';
          arcadeAudio.setMusicTrack('VICTORY');
        } else {
          this.phase = 'STAGE_CLEAR';
          arcadeAudio.playStageClear();
        }
        this.syncBodyState();
        this.emitHud(true);
      }
    }
  }

  private spawnParticleBurst(
    x: number,
    z: number,
    y: number,
    count: number,
    color: string,
    kind: ParticleSlot['kind']
  ): void {
    for (let i = 0; i < count; i++) {
      const slot = this.particles[this.particleCursor];
      this.particleCursor = (this.particleCursor + 1) % PARTICLE_POOL_SIZE;
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.6;
      const spd = kind === 'dust' ? 40 + Math.random() * 60 : 90 + Math.random() * 140;
      slot.active = true;
      slot.kind = kind;
      slot.x = x;
      slot.z = z;
      slot.y = y;
      slot.vx = Math.cos(angle) * spd;
      slot.vy = 50 + Math.random() * 110;
      slot.vz = Math.sin(angle) * spd * 0.25;
      slot.size = kind === 'glint' ? 6 : 4 + Math.random() * 4;
      slot.maxLife = kind === 'dust' ? 0.34 : 0.24;
      slot.life = slot.maxLife;
      slot.color = color;
    }
  }

  private updateParticles(dt: number): void {
    for (let i = 0; i < PARTICLE_POOL_SIZE; i++) {
      const p = this.particles[i];
      if (!p.active) continue;
      p.life -= dt;
      if (p.life <= 0) {
        p.active = false;
        continue;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.z += p.vz * dt;
      p.vy -= 360 * dt;
      if (p.y < 0) p.y = 0;
    }
  }

  private spawnFloatingText(
    text: string,
    x: number,
    y: number,
    color: string,
    scale = 1
  ): void {
    const slot = this.floatingTexts[this.textCursor];
    this.textCursor = (this.textCursor + 1) % FLOATING_TEXT_POOL_SIZE;
    slot.active = true;
    slot.text = text;
    slot.x = x;
    slot.y = y;
    slot.vy = -48;
    slot.maxLife = 0.65;
    slot.life = slot.maxLife;
    slot.color = color;
    slot.scale = scale;
  }

  private updateFloatingTexts(dt: number): void {
    for (let i = 0; i < FLOATING_TEXT_POOL_SIZE; i++) {
      const t = this.floatingTexts[i];
      if (!t.active) continue;
      t.life -= dt;
      if (t.life <= 0) {
        t.active = false;
        continue;
      }
      t.y += t.vy * dt;
    }
  }

  private render(): void {
    const ctx = this.ctx;
    ctx.imageSmoothingEnabled = false;

    if (this.phase === 'TITLE') {
      this.renderTitleScene(ctx);
      return;
    }

    const shakeMag = this.shakeTrauma * this.shakeTrauma * 12;
    const shakeX = shakeMag > 0.2 ? (Math.random() * 2 - 1) * shakeMag : 0;
    const shakeY = shakeMag > 0.2 ? (Math.random() * 2 - 1) * shakeMag : 0;

    ctx.save();
    ctx.translate(Math.round(shakeX), Math.round(shakeY));

    // Chapter Parallax Background
    drawChapterBackground(ctx, this.stage.chapter, this.cameraX, this.elapsedSec);

    // Depth-sorted drawable entities (props, pickups, players, enemies)
    const drawList: Array<{ z: number; draw: () => void }> = [];

    for (const prop of this.props) {
      if (prop.broken) continue;
      drawList.push({
        z: prop.z,
        draw: () =>
          drawPropSprite(
            ctx,
            prop.type,
            prop.x - this.cameraX,
            prop.z,
            prop.hitFlashTimer > 0
          ),
      });
    }

    for (const item of this.pickups) {
      drawList.push({
        z: item.z,
        draw: () =>
          drawSnackPickup(
            ctx,
            item.snack,
            item.x - this.cameraX,
            item.z,
            item.y + Math.sin(item.bobPhase) * 3
          ),
      });
    }

    for (const p of [this.p1, this.p2]) {
      if (!p || p.hp <= 0) continue;
      // Invulnerability blink
      if (p.invulnTimer > 0 && Math.floor(p.invulnTimer * 18) % 2 === 0) continue;
      drawList.push({
        z: p.z,
        draw: () =>
          drawFighterSprite(ctx, {
            kind: p.id,
            x: p.x - this.cameraX,
            groundScreenY: p.z,
            jumpY: p.y,
            facing: p.facing,
            state: p.state,
            animTime: p.animTime,
            walkDistance: p.walkDistance,
            heightScale: p.heightScale,
            widthScale: p.widthScale,
            hitFlash: p.hitFlashTimer > 0,
            squashX: p.squashX,
            squashY: p.squashY,
            glassesGlintTimer: p.glassesGlintTimer,
          }),
      });
    }

    for (const e of this.enemies) {
      const telegraphRatio =
        e.aiAction === 'WINDUP' && e.telegraphMax > 0
          ? 1 - e.telegraphTimer / e.telegraphMax
          : 0;
      drawList.push({
        z: e.z,
        draw: () => {
          drawFighterSprite(ctx, {
            kind: e.kind,
            x: e.x - this.cameraX,
            groundScreenY: e.z,
            jumpY: e.y,
            facing: e.facing,
            state: e.state,
            animTime: e.animTime,
            walkDistance: e.walkDistance,
            heightScale: e.heightScale,
            widthScale: e.widthScale,
            hitFlash: e.hitFlashTimer > 0,
            squashX: e.squashX,
            squashY: e.squashY,
            rageGlow: e.rageGlow,
            telegraphRatio,
          });
          // Overhead compact HP bar for injured regular enemies
          if (!e.isBoss && e.hp > 0 && e.hp < e.maxHp) {
            const sx = Math.round(e.x - this.cameraX);
            const sy = Math.round(e.z - e.y - 90 * e.heightScale);
            ctx.fillStyle = '#09090b';
            ctx.fillRect(sx - 21, sy - 1, 42, 7);
            ctx.fillStyle = '#ef4444';
            ctx.fillRect(sx - 20, sy, Math.round(40 * (e.hp / e.maxHp)), 5);
          }
        },
      });
    }

    drawList.sort((a, b) => a.z - b.z);
    for (const item of drawList) {
      item.draw();
    }

    // Projectiles (pebbles & soda cans)
    for (const proj of this.projectiles) {
      const sx = Math.round(proj.x - this.cameraX);
      const sy = Math.round(proj.z - proj.y);
      ctx.save();
      ctx.translate(sx, sy);
      ctx.rotate(proj.rotation);
      if (proj.kind === 'can') {
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(-5, -7, 10, 14);
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(-4, -2, 8, 4);
      } else {
        ctx.fillStyle = '#78716c';
        ctx.fillRect(-4, -4, 8, 8);
      }
      ctx.restore();
    }

    // Pooled Particles
    for (let i = 0; i < PARTICLE_POOL_SIZE; i++) {
      const pt = this.particles[i];
      if (!pt.active) continue;
      ctx.globalAlpha = Math.max(0, pt.life / pt.maxLife);
      ctx.fillStyle = pt.color;
      const sx = Math.round(pt.x - this.cameraX - pt.size / 2);
      const sy = Math.round(pt.z - pt.y - pt.size / 2);
      ctx.fillRect(sx, sy, Math.round(pt.size), Math.round(pt.size));
    }
    ctx.globalAlpha = 1;

    // Comic-style floating impact words ("POW!", "THWACK!", damage numbers)
    for (let i = 0; i < FLOATING_TEXT_POOL_SIZE; i++) {
      const ft = this.floatingTexts[i];
      if (!ft.active) continue;
      ctx.save();
      ctx.globalAlpha = Math.min(1, (ft.life / ft.maxLife) * 1.4);
      ctx.font = `bold ${Math.round(14 * ft.scale)}px Silkscreen, monospace`;
      ctx.textAlign = 'center';
      const sx = Math.round(ft.x - this.cameraX);
      const sy = Math.round(ft.y);
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#111827';
      ctx.strokeText(ft.text, sx, sy);
      ctx.fillStyle = ft.color;
      ctx.fillText(ft.text, sx, sy);
      ctx.restore();
    }

    ctx.restore();
  }

  private renderTitleScene(ctx: CanvasRenderingContext2D): void {
    const panX = this.titleTime * 42;
    drawChapterBackground(ctx, 1, panX, this.titleTime);

    // Animated neighborhood pedestrians & heroes strolling calmly on the street!
    const walkDist = this.titleTime * 90;
    drawFighterSprite(ctx, {
      kind: 'taunter',
      x: 780 - ((this.titleTime * 48) % 920),
      groundScreenY: 365,
      jumpY: 0,
      facing: -1,
      state: 'WALK',
      animTime: this.titleTime,
      walkDistance: walkDist * 0.7,
      heightScale: 0.93,
      widthScale: 0.86,
      hitFlash: false,
      squashX: 1,
      squashY: 1,
    });

    drawFighterSprite(ctx, {
      kind: 'ziyad',
      x: 615,
      groundScreenY: 422,
      jumpY: 0,
      facing: 1,
      state: 'WALK',
      animTime: this.titleTime,
      walkDistance: walkDist,
      heightScale: 0.94,
      widthScale: 0.9,
      hitFlash: false,
      squashX: 1,
      squashY: 1,
    });

    drawFighterSprite(ctx, {
      kind: 'mohamed',
      x: 545,
      groundScreenY: 444,
      jumpY: 0,
      facing: 1,
      state: 'WALK',
      animTime: this.titleTime + 0.5,
      walkDistance: walkDist * 0.88,
      heightScale: 1.07,
      widthScale: 1.16,
      hitFlash: false,
      squashX: 1,
      squashY: 1,
      glassesGlintTimer: (this.titleTime % 4) < 0.35 ? 0.3 : 0,
    });
  }

  private toPlayerHud(p: PlayerEntity): PlayerHudSnapshot {
    return {
      id: p.id,
      name: p.name,
      arabicName: p.arabicName,
      hp: Math.round(p.hp),
      maxHp: p.maxHp,
      trailHp: Math.round(p.trailHp),
      stamina: Math.round(p.stamina),
      maxStamina: p.maxStamina,
      lives: p.lives,
      score: Math.round(p.score),
      active: p.hp > 0 || p.lives > 0,
    };
  }

  private emitHud(force: boolean): void {
    const bossEntity = this.enemies.find((e) => e.isBoss) ?? null;
    const bossHud: BossHudSnapshot | null = bossEntity
      ? {
          id: bossEntity.kind as BossHudSnapshot['id'],
          name: bossEntity.name,
          arabicName: bossEntity.arabicName,
          hp: Math.round(bossEntity.hp),
          maxHp: bossEntity.maxHp,
          trailHp: Math.round(bossEntity.trailHp),
          phase: bossEntity.bossPhase,
          rageGlow: bossEntity.rageGlow,
        }
      : null;

    const goArrowActive =
      this.phase === 'PLAYING' &&
      this.lockCameraX === null &&
      this.enemies.length === 0 &&
      this.waveIndex < this.stage.waves.length;

    const totalScore = Math.round(this.p1.score + (this.p2?.score ?? 0));

    const snap: HudSnapshot = {
      phase: this.phase,
      mode: this.mode,
      stageNumber: this.stageNumber,
      totalStages: TOTAL_STAGES,
      chapter: this.stage.chapter,
      chapterTitle: this.stage.chapterTitle,
      stageTitle: this.stage.title,
      waveIndex: this.waveIndex,
      totalWaves: this.stage.waves.length,
      goArrowActive,
      p1: this.toPlayerHud(this.p1),
      p2: this.p2 ? this.toPlayerHud(this.p2) : null,
      boss: bossHud,
      cutsceneLines: this.cutsceneLines,
      cutsceneIndex: this.cutsceneIndex,
      clearTimeSec: Math.round(this.stageTimeSec),
      damageTaken: Math.round(this.damageTaken),
      enemiesDefeated: this.enemiesDefeated,
      totalScore,
      bestScore: Math.max(this.bestScore, totalScore),
      muted: arcadeAudio.isMuted(),
    };

    const key = JSON.stringify([
      snap.phase,
      snap.mode,
      snap.stageNumber,
      snap.waveIndex,
      snap.goArrowActive,
      snap.p1.hp,
      snap.p1.trailHp,
      snap.p1.stamina,
      snap.p1.lives,
      snap.p1.score,
      snap.p2?.hp,
      snap.p2?.trailHp,
      snap.p2?.stamina,
      snap.p2?.lives,
      snap.p2?.score,
      snap.boss?.hp,
      snap.boss?.trailHp,
      snap.boss?.phase,
      snap.cutsceneIndex,
      snap.muted,
    ]);

    if (force || key !== this.lastHudKey) {
      this.lastHudKey = key;
      this.onHudChange(snap);
    }
  }
}
