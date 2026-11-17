import test from 'node:test';
import assert from 'node:assert/strict';
import {
  allocateAttackTokens,
  applyPlayerHitToEnemy,
  checkBeltScrollerStrike,
  createEnemyEntity,
  createPlayerEntity,
  getAttackSpecForPlayer,
  startPlayerAttack,
  triggerOrBufferPlayerAttack,
  unlockNextStage,
  updateBossPhase,
} from './rules';

test('Ziyad and Mohamed proportions match 157cm slim vs 170cm 70kg specs', () => {
  const ziyad = createPlayerEntity('ziyad', 100, 400);
  const mohamed = createPlayerEntity('mohamed', 140, 400);

  assert.ok(mohamed.heightScale > ziyad.heightScale, 'Mohamed must be taller than Ziyad');
  assert.ok(mohamed.widthScale > ziyad.widthScale, 'Mohamed must have heavier build than Ziyad');
  assert.ok(mohamed.maxHp > ziyad.maxHp, 'Mohamed powerhouse must have higher HP');
  assert.ok(ziyad.walkSpeedX > mohamed.walkSpeedX, 'Ziyad agility archetype must move faster');
});

test('Input buffering and 3-hit punch combo progression for Ziyad', () => {
  const ziyad = createPlayerEntity('ziyad', 100, 400);
  assert.equal(ziyad.state, 'IDLE');

  const started1 = triggerOrBufferPlayerAttack(ziyad, 'PUNCH');
  assert.equal(started1, true);
  assert.equal(ziyad.state, 'PUNCH');
  assert.equal(ziyad.comboStep, 1);

  // Pressing E while still in PUNCH buffers the next combo hit
  const buffered = triggerOrBufferPlayerAttack(ziyad, 'PUNCH');
  assert.equal(buffered, true);
  assert.equal(ziyad.bufferedAttack, 'PUNCH');

  // Completing hit 1 and triggering hit 2 & 3 increments comboStep cleanly
  ziyad.state = 'IDLE';
  startPlayerAttack(ziyad, 'PUNCH');
  assert.equal(ziyad.comboStep, 2);

  ziyad.state = 'IDLE';
  startPlayerAttack(ziyad, 'PUNCH');
  assert.equal(ziyad.comboStep, 3);
  assert.equal(ziyad.attackSpec?.knockdown, true);
});

test('Special attacks consume stamina and trigger Mohamed glasses glint', () => {
  const mohamed = createPlayerEntity('mohamed', 100, 400);
  const initialStamina = mohamed.stamina;

  const ok = startPlayerAttack(mohamed, 'SPECIAL');
  assert.equal(ok, true);
  assert.equal(mohamed.state, 'SPECIAL');
  assert.ok(mohamed.stamina < initialStamina);
  assert.ok(mohamed.glassesGlintTimer > 0);

  // Drain stamina below cost and verify special is blocked
  mohamed.state = 'IDLE';
  mohamed.stamina = 5;
  assert.equal(startPlayerAttack(mohamed, 'SPECIAL'), false);
});

test('2.5D belt-scroller strike detection respects X reach, Z lane depth, and Y jump height', () => {
  // Directly in front on same lane
  assert.equal(
    checkBeltScrollerStrike({
      attackerX: 200,
      attackerZ: 400,
      attackerY: 0,
      facing: 1,
      reachX: 60,
      depthZ: 25,
      heightY: 70,
      targetX: 245,
      targetZ: 410,
      targetY: 0,
      targetHalfW: 20,
      targetHalfZ: 18,
      targetHeight: 75,
    }),
    true
  );

  // Too far on Z depth lane -> miss
  assert.equal(
    checkBeltScrollerStrike({
      attackerX: 200,
      attackerZ: 400,
      attackerY: 0,
      facing: 1,
      reachX: 60,
      depthZ: 25,
      heightY: 70,
      targetX: 245,
      targetZ: 470,
      targetY: 0,
      targetHalfW: 20,
      targetHalfZ: 18,
      targetHeight: 75,
    }),
    false
  );

  // Target jumped high above low attack -> miss
  assert.equal(
    checkBeltScrollerStrike({
      attackerX: 200,
      attackerZ: 400,
      attackerY: 0,
      facing: 1,
      reachX: 60,
      depthZ: 25,
      heightY: 50,
      targetX: 245,
      targetZ: 400,
      targetY: 80,
      targetHalfW: 20,
      targetHalfZ: 18,
      targetHeight: 75,
    }),
    false
  );
});

test('Attack token pool caps simultaneous melee attackers to 3', () => {
  const player = createPlayerEntity('ziyad', 200, 400);
  const enemies = [
    createEnemyEntity(1, 'taunter', 250, 400),
    createEnemyEntity(2, 'shover', 280, 405),
    createEnemyEntity(3, 'grappler', 320, 395),
    createEnemyEntity(4, 'taunter', 420, 410),
    createEnemyEntity(5, 'shover', 510, 420),
    createEnemyEntity(6, 'thrower', 550, 400), // ranged thrower doesn't consume melee token
  ];

  allocateAttackTokens(enemies, [player], 3);
  const tokensHeld = enemies.filter((e) => e.hasToken).length;
  assert.equal(tokensHeld, 3);
  assert.equal(enemies[5].hasToken, false);
});

test('Boss phases transition accurately for Anas, Saad, and Baraa', () => {
  const anas = createEnemyEntity(10, 'anas', 500, 400);
  anas.hp = anas.maxHp * 0.49;
  assert.deepEqual(updateBossPhase(anas), { changed: true, newPhase: 2 });

  const saad = createEnemyEntity(11, 'saad', 500, 400);
  saad.hp = saad.maxHp * 0.45;
  assert.deepEqual(updateBossPhase(saad), { changed: true, newPhase: 2 });
  assert.equal(saad.rageGlow, true);

  const baraa = createEnemyEntity(12, 'baraa', 500, 400);
  baraa.hp = baraa.maxHp * 0.55;
  assert.deepEqual(updateBossPhase(baraa), { changed: true, newPhase: 2 });
  baraa.hp = baraa.maxHp * 0.2;
  assert.deepEqual(updateBossPhase(baraa), { changed: true, newPhase: 3 });
});

test('Baraa Phase 1 blocks repeated frontal punch spam and punishes with counter state', () => {
  const ziyad = createPlayerEntity('ziyad', 200, 400);
  const baraa = createEnemyEntity(20, 'baraa', 260, 400);
  baraa.facing = -1;
  const jab = getAttackSpecForPlayer('ziyad', 'PUNCH', 1);

  const first = applyPlayerHitToEnemy(ziyad, baraa, jab);
  assert.equal(first.outcome, 'HIT');

  const second = applyPlayerHitToEnemy(ziyad, baraa, jab);
  assert.equal(second.outcome, 'BLOCKED');
  assert.equal(baraa.state, 'BLOCK');

  // Kick breaks guard instead of triggering punch-spam block
  baraa.state = 'IDLE';
  const kick = getAttackSpecForPlayer('ziyad', 'KICK', 1);
  const third = applyPlayerHitToEnemy(ziyad, baraa, kick);
  assert.equal(third.outcome, 'HIT');
});

test('Stage unlock progression caps cleanly at Stage 15', () => {
  assert.equal(unlockNextStage(1, 1), 2);
  assert.equal(unlockNextStage(5, 2), 5);
  assert.equal(unlockNextStage(15, 15), 15);
});
