import {
  BOSS_CONFIGS,
  ENEMY_CONFIGS,
  MAX_CONCURRENT_ATTACK_TOKENS,
  MOHAMED_KICK_COMBO,
  MOHAMED_PUNCH_COMBO,
  MOHAMED_SPECIAL,
  PLAYER_BASE_STATS,
  STREET_Z_MAX,
  STREET_Z_MIN,
  TOTAL_STAGES,
  ZIYAD_KICK_COMBO,
  ZIYAD_PUNCH_COMBO,
  ZIYAD_SPECIAL,
} from './constants';
import type {
  AttackSpec,
  BossId,
  EnemyArchetype,
  EnemyEntity,
  PlayerEntity,
  PlayerId,
  SpriteState,
} from './types';

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function createPlayerEntity(id: PlayerId, spawnX: number, spawnZ: number): PlayerEntity {
  const stats = PLAYER_BASE_STATS[id];
  return {
    id,
    name: stats.name,
    arabicName: stats.arabicName,
    x: spawnX,
    z: clamp(spawnZ, STREET_Z_MIN, STREET_Z_MAX),
    y: 0,
    vx: 0,
    vz: 0,
    vy: 0,
    facing: 1,
    hp: stats.maxHp,
    maxHp: stats.maxHp,
    trailHp: stats.maxHp,
    stamina: stats.maxStamina,
    maxStamina: stats.maxStamina,
    lives: 3,
    score: 0,
    state: 'IDLE',
    stateTimer: 0,
    animTime: 0,
    comboStep: 0,
    comboWindowTimer: 0,
    lastAttackKind: null,
    bufferedAttack: null,
    bufferTimer: 0,
    invulnTimer: 0,
    hitFlashTimer: 0,
    grabbedByEnemyId: null,
    squashX: 1,
    squashY: 1,
    walkDistance: 0,
    glassesGlintTimer: 0,
    koFadeTimer: 0,
    downTimer: 0,
    hitTargetIds: new Set<number>(),
    attackSpec: null,
    heightScale: stats.heightScale,
    widthScale: stats.widthScale,
    hitboxHalfW: stats.hitboxHalfW,
    hitboxHalfZ: stats.hitboxHalfZ,
    hitboxHeight: stats.hitboxHeight,
    walkSpeedX: stats.walkSpeedX,
    walkSpeedZ: stats.walkSpeedZ,
    jumpVel: stats.jumpVel,
  };
}

export function createEnemyEntity(
  uid: number,
  kind: EnemyArchetype | BossId,
  x: number,
  z: number,
  stageScale = 1
): EnemyEntity {
  const isBoss = kind === 'anas' || kind === 'saad' || kind === 'baraa';
  const enemyCfg = !isBoss ? ENEMY_CONFIGS[kind as EnemyArchetype] : null;
  const cfg = isBoss ? BOSS_CONFIGS[kind as BossId] : enemyCfg!;
  const hpMultiplier = isBoss ? 1 : 0.9 + (stageScale - 1) * 0.05;
  const maxHp = Math.round(cfg.maxHp * hpMultiplier);

  return {
    uid,
    kind,
    isBoss,
    name: cfg.name,
    arabicName: cfg.arabicName,
    x,
    z: clamp(z, STREET_Z_MIN, STREET_Z_MAX),
    y: 0,
    vx: 0,
    vz: 0,
    vy: 0,
    facing: -1,
    hp: maxHp,
    maxHp,
    trailHp: maxHp,
    state: 'IDLE',
    stateTimer: 0,
    animTime: 0,
    hitFlashTimer: 0,
    squashX: 1,
    squashY: 1,
    walkDistance: 0,
    hasToken: false,
    aiTimer: 0.25 + (uid % 4) * 0.15,
    aiAction: 'APPROACH',
    orbitAngle: (uid * 1.37) % (Math.PI * 2),
    attackCooldown: 0.4 + (uid % 3) * 0.25,
    telegraphTimer: 0,
    telegraphMax: 0.4,
    bossPhase: 1,
    superArmor: false,
    rageGlow: false,
    mashBlockCounter: 0,
    grabbingPlayerId: null,
    knockdownTimer: 0,
    koTimer: 0,
    hitPlayersThisSwing: new Set<PlayerId>(),
    heightScale: cfg.heightScale,
    widthScale: cfg.widthScale,
    hitboxHalfW: cfg.hitboxHalfW,
    hitboxHalfZ: cfg.hitboxHalfZ,
    hitboxHeight: cfg.hitboxHeight,
    scoreValue: cfg.scoreValue,
    attackDamage: cfg.damage,
    knockdownAttack: isBoss ? true : enemyCfg!.knockdownAttack,
  };
}

export function getAttackSpecForPlayer(
  playerId: PlayerId,
  kind: 'PUNCH' | 'KICK' | 'SPECIAL',
  comboStep: number
): AttackSpec {
  if (kind === 'SPECIAL') {
    return playerId === 'ziyad' ? ZIYAD_SPECIAL : MOHAMED_SPECIAL;
  }
  if (playerId === 'ziyad') {
    const list = kind === 'PUNCH' ? ZIYAD_PUNCH_COMBO : ZIYAD_KICK_COMBO;
    return list[(comboStep - 1) % list.length];
  }
  const list = kind === 'PUNCH' ? MOHAMED_PUNCH_COMBO : MOHAMED_KICK_COMBO;
  return list[(comboStep - 1) % list.length];
}

export function isAttackingState(state: SpriteState): boolean {
  return state === 'PUNCH' || state === 'KICK' || state === 'SPECIAL';
}

export function canPlayerAcceptAttack(player: PlayerEntity): boolean {
  if (player.hp <= 0) return false;
  if (
    player.state === 'HURT' ||
    player.state === 'KNOCKDOWN' ||
    player.state === 'VICTORY'
  ) {
    return false;
  }
  return true;
}

/**
 * Starts or buffers a player attack input ('PUNCH', 'KICK', or 'SPECIAL').
 * Returns true if the attack started immediately or was buffered.
 */
export function triggerOrBufferPlayerAttack(
  player: PlayerEntity,
  kind: 'PUNCH' | 'KICK' | 'SPECIAL'
): boolean {
  if (!canPlayerAcceptAttack(player)) return false;

  if (isAttackingState(player.state)) {
    // Allow input buffering during active/recovery frames so combos chain crisply
    player.bufferedAttack = kind;
    player.bufferTimer = 0.16;
    return true;
  }

  return startPlayerAttack(player, kind);
}

export function startPlayerAttack(
  player: PlayerEntity,
  kind: 'PUNCH' | 'KICK' | 'SPECIAL'
): boolean {
  if (!canPlayerAcceptAttack(player)) return false;

  if (kind === 'SPECIAL') {
    const spec = getAttackSpecForPlayer(player.id, 'SPECIAL', 1);
    if (player.stamina < spec.staminaCost) {
      return false;
    }
    player.stamina -= spec.staminaCost;
    player.state = 'SPECIAL';
    player.attackSpec = spec;
    player.stateTimer = spec.windupSec + spec.activeSec + spec.recoverySec;
    player.animTime = 0;
    player.comboStep = 0;
    player.comboWindowTimer = 0;
    player.lastAttackKind = null;
    player.bufferedAttack = null;
    player.hitTargetIds.clear();
    if (player.id === 'mohamed') {
      player.glassesGlintTimer = 0.48;
      player.vx = player.facing * 310;
    } else {
      player.vx = player.facing * 120;
    }
    player.squashX = 1.15;
    player.squashY = 0.88;
    return true;
  }

  // Determine next combo step within combo window
  const maxSteps =
    player.id === 'ziyad'
      ? 3
      : kind === 'PUNCH'
        ? MOHAMED_PUNCH_COMBO.length
        : MOHAMED_KICK_COMBO.length;

  let nextStep = 1;
  if (player.comboWindowTimer > 0 && player.lastAttackKind === kind) {
    nextStep = player.comboStep >= maxSteps ? 1 : player.comboStep + 1;
  }

  const spec = getAttackSpecForPlayer(player.id, kind, nextStep);
  player.state = kind;
  player.attackSpec = spec;
  player.comboStep = nextStep;
  player.lastAttackKind = kind;
  player.comboWindowTimer = 0.42;
  player.stateTimer = spec.windupSec + spec.activeSec + spec.recoverySec;
  player.animTime = 0;
  player.bufferedAttack = null;
  player.hitTargetIds.clear();
  player.squashX = 1.12;
  player.squashY = 0.9;
  return true;
}

/**
 * Checks whether an attacker's active strike box overlaps a defender in 2.5D (X, Z-lane depth, Y jump height).
 */
export function checkBeltScrollerStrike(params: {
  attackerX: number;
  attackerZ: number;
  attackerY: number;
  facing: 1 | -1;
  reachX: number;
  depthZ: number;
  heightY: number;
  targetX: number;
  targetZ: number;
  targetY: number;
  targetHalfW: number;
  targetHalfZ: number;
  targetHeight: number;
  bidirectional?: boolean;
}): boolean {
  const dz = Math.abs(params.attackerZ - params.targetZ);
  if (dz > params.depthZ + params.targetHalfZ) {
    return false;
  }

  // Vertical overlap check (jumping over low attacks or hitting airborne foes)
  const atkBottom = params.attackerY;
  const atkTop = params.attackerY + params.heightY;
  const tgtBottom = params.targetY;
  const tgtTop = params.targetY + params.targetHeight;
  if (atkTop < tgtBottom || tgtTop < atkBottom) {
    return false;
  }

  if (params.bidirectional) {
    return Math.abs(params.targetX - params.attackerX) <= params.reachX + params.targetHalfW;
  }

  const dx = (params.targetX - params.attackerX) * params.facing;
  return dx >= -params.targetHalfW * 0.45 && dx <= params.reachX + params.targetHalfW;
}

/**
 * Assigns up to MAX_CONCURRENT_ATTACK_TOKENS (3) to the closest active melee enemies
 * so enemies never all attack on the exact same millisecond.
 */
export function allocateAttackTokens(
  enemies: EnemyEntity[],
  players: PlayerEntity[],
  maxTokens = MAX_CONCURRENT_ATTACK_TOKENS
): void {
  const livingPlayers = players.filter((p) => p.hp > 0);
  const eligible = enemies.filter(
    (e) =>
      e.hp > 0 &&
      e.state !== 'KNOCKDOWN' &&
      e.state !== 'HURT' &&
      e.kind !== 'thrower'
  );

  // Bosses always hold priority token when active
  const scored = eligible
    .map((e) => {
      let minDist = Infinity;
      for (const p of livingPlayers) {
        const d = Math.hypot(e.x - p.x, (e.z - p.z) * 1.4);
        if (d < minDist) minDist = d;
      }
      return {
        enemy: e,
        priority: e.isBoss ? minDist - 1000 : minDist,
      };
    })
    .sort((a, b) => a.priority - b.priority);

  for (const e of enemies) {
    e.hasToken = false;
  }

  let used = 0;
  for (const item of scored) {
    if (used >= maxTokens) break;
    item.enemy.hasToken = true;
    used++;
  }
}

/**
 * Evaluates Boss phase transitions based on current HP ratio.
 */
export function updateBossPhase(boss: EnemyEntity): {
  changed: boolean;
  newPhase: 1 | 2 | 3;
} {
  if (!boss.isBoss || boss.hp <= 0) {
    return { changed: false, newPhase: boss.bossPhase };
  }

  const ratio = boss.hp / boss.maxHp;
  let targetPhase: 1 | 2 | 3 = 1;

  if (boss.kind === 'anas') {
    targetPhase = ratio <= 0.5 ? 2 : 1;
  } else if (boss.kind === 'saad') {
    targetPhase = ratio <= 0.5 ? 2 : 1;
    boss.rageGlow = targetPhase === 2;
  } else if (boss.kind === 'baraa') {
    if (ratio <= 0.25) {
      targetPhase = 3;
    } else if (ratio <= 0.6) {
      targetPhase = 2;
    } else {
      targetPhase = 1;
    }
  }

  const changed = targetPhase !== boss.bossPhase;
  boss.bossPhase = targetPhase;
  return { changed, newPhase: targetPhase };
}

/**
 * Resolves a player attack hitting an enemy, including Baraa's Phase 1 counter-block
 * against blind frontal punch-spam and Saad's super armor.
 */
export function applyPlayerHitToEnemy(
  attacker: PlayerEntity,
  enemy: EnemyEntity,
  spec: AttackSpec
): {
  outcome: 'HIT' | 'BLOCKED' | 'KO';
  damage: number;
  knockdown: boolean;
} {
  // Baraa Phase 1 blocks repeated frontal PUNCH spam
  const isFrontal =
    (attacker.x < enemy.x && enemy.facing === -1) ||
    (attacker.x > enemy.x && enemy.facing === 1);

  if (
    enemy.kind === 'baraa' &&
    enemy.bossPhase === 1 &&
    isFrontal &&
    spec.kind === 'PUNCH' &&
    enemy.state !== 'KNOCKDOWN'
  ) {
    enemy.mashBlockCounter += 1;
    if (enemy.mashBlockCounter >= 2) {
      enemy.state = 'BLOCK';
      enemy.aiAction = 'BLOCK_COUNTER';
      enemy.stateTimer = 0.34;
      enemy.mashBlockCounter = 0;
      return { outcome: 'BLOCKED', damage: 0, knockdown: false };
    }
  } else if (spec.kind !== 'PUNCH') {
    enemy.mashBlockCounter = 0;
  }

  // Ziyad's rapid punch deals clean damage; heavy kicks & Mohamed hits break super armor
  const breaksArmor =
    spec.knockdown || spec.kind === 'SPECIAL' || spec.kind === 'KICK';
  const damage = spec.damage;
  enemy.hp = Math.max(0, enemy.hp - damage);
  enemy.hitFlashTimer = 0.08;
  enemy.squashX = 0.86;
  enemy.squashY = 1.14;

  // Release any player grabbed by this grappler
  if (enemy.grabbingPlayerId) {
    enemy.grabbingPlayerId = null;
  }

  if (enemy.hp <= 0) {
    enemy.state = 'KNOCKDOWN';
    enemy.vx = attacker.facing * Math.max(200, spec.knockbackX);
    enemy.vy = 260;
    enemy.koTimer = 0.65;
    attacker.score += enemy.scoreValue;
    return { outcome: 'KO', damage, knockdown: true };
  }

  if (enemy.superArmor && !breaksArmor) {
    // Takes damage without flinching
    return { outcome: 'HIT', damage, knockdown: false };
  }

  if (spec.knockdown && (!enemy.isBoss || breaksArmor)) {
    enemy.state = 'KNOCKDOWN';
    enemy.vx = attacker.facing * spec.knockbackX;
    enemy.vy = 235;
    enemy.knockdownTimer = enemy.isBoss ? 0.55 : 0.78;
    enemy.superArmor = false;
    return { outcome: 'HIT', damage, knockdown: true };
  }

  enemy.state = 'HURT';
  enemy.stateTimer = enemy.isBoss ? 0.2 : 0.3;
  enemy.vx = attacker.facing * spec.knockbackX * 0.55;
  enemy.superArmor = false;
  return { outcome: 'HIT', damage, knockdown: false };
}

export function unlockNextStage(highestUnlocked: number, clearedStage: number): number {
  return clamp(Math.max(highestUnlocked, clearedStage + 1), 1, TOTAL_STAGES);
}
