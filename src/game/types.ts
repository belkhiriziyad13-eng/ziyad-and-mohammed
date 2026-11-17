export type SpriteState =
  | 'IDLE'
  | 'WALK'
  | 'JUMP'
  | 'PUNCH'
  | 'KICK'
  | 'SPECIAL'
  | 'HURT'
  | 'KNOCKDOWN'
  | 'BLOCK'
  | 'VICTORY';

export type GameMode = '1P' | '2P';

export type GamePhase =
  | 'TITLE'
  | 'CUTSCENE'
  | 'PLAYING'
  | 'PAUSED'
  | 'STAGE_CLEAR'
  | 'GAME_OVER'
  | 'VICTORY';

export type ChapterId = 1 | 2 | 3;

export type PlayerId = 'ziyad' | 'mohamed';

export type EnemyArchetype = 'taunter' | 'shover' | 'grappler' | 'thrower';

export type BossId = 'anas' | 'saad' | 'baraa';

export type CharacterPortraitId =
  | 'ziyad'
  | 'mohamed'
  | 'taunter'
  | 'shover'
  | 'anas'
  | 'saad'
  | 'baraa';

export type SnackType = 'sandwich' | 'juice' | 'apple';

export type PropType = 'crate' | 'trashcan';

export type ProjectileKind = 'pebble' | 'can';

export interface SpriteSheetSlot {
  /** Optional external sprite sheet URL (horizontal strip of frames) */
  imageUrl?: string;
  frameWidth: number;
  frameHeight: number;
  frameCount: number;
  fps: number;
  loop: boolean;
}

export type CharacterSpriteSheetMap = Partial<Record<SpriteState, SpriteSheetSlot>>;

export interface CustomSpriteSheetRegistry {
  ziyad?: CharacterSpriteSheetMap;
  mohamed?: CharacterSpriteSheetMap;
}

export interface HitboxRect {
  x: number;
  y: number;
  z: number;
  halfW: number;
  halfH: number;
  halfZ: number;
}

export interface AttackSpec {
  kind: 'PUNCH' | 'KICK' | 'SPECIAL';
  comboStep: number;
  damage: number;
  knockbackX: number;
  knockdown: boolean;
  hitstopSec: number;
  shakeTrauma: number;
  reachX: number;
  depthZ: number;
  heightY: number;
  windupSec: number;
  activeSec: number;
  recoverySec: number;
  staminaCost: number;
  label: string;
}

export interface PlayerEntity {
  id: PlayerId;
  name: string;
  arabicName: string;
  x: number;
  z: number;
  y: number; // vertical jump offset >= 0 (upwards)
  vx: number;
  vz: number;
  vy: number;
  facing: 1 | -1;
  hp: number;
  maxHp: number;
  trailHp: number;
  stamina: number;
  maxStamina: number;
  lives: number;
  score: number;
  state: SpriteState;
  stateTimer: number;
  animTime: number;
  comboStep: number;
  comboWindowTimer: number;
  lastAttackKind: 'PUNCH' | 'KICK' | null;
  bufferedAttack: 'PUNCH' | 'KICK' | 'SPECIAL' | null;
  bufferTimer: number;
  invulnTimer: number;
  hitFlashTimer: number;
  grabbedByEnemyId: number | null;
  squashX: number;
  squashY: number;
  walkDistance: number;
  glassesGlintTimer: number;
  koFadeTimer: number;
  downTimer: number;
  hitTargetIds: Set<number>;
  attackSpec: AttackSpec | null;
  heightScale: number;
  widthScale: number;
  hitboxHalfW: number;
  hitboxHalfZ: number;
  hitboxHeight: number;
  walkSpeedX: number;
  walkSpeedZ: number;
  jumpVel: number;
}

export interface EnemyEntity {
  uid: number;
  kind: EnemyArchetype | BossId;
  isBoss: boolean;
  name: string;
  arabicName: string;
  x: number;
  z: number;
  y: number;
  vx: number;
  vz: number;
  vy: number;
  facing: 1 | -1;
  hp: number;
  maxHp: number;
  trailHp: number;
  state: SpriteState;
  stateTimer: number;
  animTime: number;
  hitFlashTimer: number;
  squashX: number;
  squashY: number;
  walkDistance: number;
  hasToken: boolean;
  aiTimer: number;
  aiAction:
    | 'APPROACH'
    | 'CIRCLE'
    | 'WINDUP'
    | 'ATTACK'
    | 'RECOVER'
    | 'GRAB_HOLD'
    | 'THROW_AIM'
    | 'BOSS_DASH'
    | 'BOSS_CHARGE'
    | 'BOSS_SWEEP'
    | 'BLOCK_COUNTER';
  orbitAngle: number;
  attackCooldown: number;
  telegraphTimer: number;
  telegraphMax: number;
  bossPhase: 1 | 2 | 3;
  superArmor: boolean;
  rageGlow: boolean;
  mashBlockCounter: number;
  grabbingPlayerId: PlayerId | null;
  knockdownTimer: number;
  koTimer: number;
  hitPlayersThisSwing: Set<PlayerId>;
  heightScale: number;
  widthScale: number;
  hitboxHalfW: number;
  hitboxHalfZ: number;
  hitboxHeight: number;
  scoreValue: number;
  attackDamage: number;
  knockdownAttack: boolean;
}

export interface ProjectileEntity {
  uid: number;
  kind: ProjectileKind;
  fromEnemy: boolean;
  x: number;
  z: number;
  y: number;
  vx: number;
  vz: number;
  vy: number;
  damage: number;
  radius: number;
  rotation: number;
  alive: boolean;
}

export interface BreakableProp {
  uid: number;
  type: PropType;
  x: number;
  z: number;
  hp: number;
  hitFlashTimer: number;
  broken: boolean;
  dropSnack: SnackType | null;
}

export interface PickupEntity {
  uid: number;
  snack: SnackType;
  x: number;
  z: number;
  y: number;
  vy: number;
  healAmount: number;
  bobPhase: number;
  collected: boolean;
}

export interface ParticleSlot {
  active: boolean;
  kind: 'spark' | 'dust' | 'sweat' | 'glint' | 'ring';
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  size: number;
  life: number;
  maxLife: number;
  color: string;
}

export interface FloatingTextSlot {
  active: boolean;
  text: string;
  x: number;
  y: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  scale: number;
}

export interface WaveDefinition {
  triggerX: number;
  enemies: Array<{
    kind: EnemyArchetype | BossId;
    offsetX: number;
    z: number;
  }>;
}

export interface StageDefinition {
  stageNumber: number;
  chapter: ChapterId;
  chapterTitle: string;
  title: string;
  arabicTitle: string;
  lengthX: number;
  bossId: BossId | null;
  waves: WaveDefinition[];
  props: Array<{ type: PropType; x: number; z: number; dropSnack: SnackType | null }>;
}

export interface CutsceneLine {
  speaker: string;
  arabicSpeaker?: string;
  portrait: CharacterPortraitId;
  side: 'left' | 'right';
  text: string;
}

export interface PlayerHudSnapshot {
  id: PlayerId;
  name: string;
  arabicName: string;
  hp: number;
  maxHp: number;
  trailHp: number;
  stamina: number;
  maxStamina: number;
  lives: number;
  score: number;
  active: boolean;
}

export interface BossHudSnapshot {
  id: BossId;
  name: string;
  arabicName: string;
  hp: number;
  maxHp: number;
  trailHp: number;
  phase: 1 | 2 | 3;
  rageGlow: boolean;
}

export interface HudSnapshot {
  phase: GamePhase;
  mode: GameMode;
  stageNumber: number;
  totalStages: number;
  chapter: ChapterId;
  chapterTitle: string;
  stageTitle: string;
  waveIndex: number;
  totalWaves: number;
  goArrowActive: boolean;
  p1: PlayerHudSnapshot;
  p2: PlayerHudSnapshot | null;
  boss: BossHudSnapshot | null;
  cutsceneLines: CutsceneLine[];
  cutsceneIndex: number;
  clearTimeSec: number;
  damageTaken: number;
  enemiesDefeated: number;
  totalScore: number;
  bestScore: number;
  muted: boolean;
}
