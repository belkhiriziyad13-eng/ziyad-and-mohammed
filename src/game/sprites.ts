import type {
  BossId,
  CharacterPortraitId,
  CustomSpriteSheetRegistry,
  EnemyArchetype,
  PlayerId,
  PropType,
  SnackType,
  SpriteState,
} from './types';

/**
 * Custom Sprite Sheet Adapter:
 * Plug in your own sprite sheet PNGs per character and per SpriteState via
 * `registerCustomSpriteSheets({ ziyad: { IDLE: { imageUrl, frameWidth, frameHeight, frameCount, fps, loop } } })`.
 * Whenever a slot is registered and loaded, the renderer draws from the custom sprite sheet automatically!
 */
const customRegistry: CustomSpriteSheetRegistry = {};
const loadedSheetImages = new Map<string, HTMLImageElement>();

export function registerCustomSpriteSheets(registry: CustomSpriteSheetRegistry): void {
  if (registry.ziyad) {
    customRegistry.ziyad = { ...customRegistry.ziyad, ...registry.ziyad };
  }
  if (registry.mohamed) {
    customRegistry.mohamed = { ...customRegistry.mohamed, ...registry.mohamed };
  }
  for (const charMap of [customRegistry.ziyad, customRegistry.mohamed]) {
    if (!charMap) continue;
    for (const slot of Object.values(charMap)) {
      if (slot?.imageUrl && !loadedSheetImages.has(slot.imageUrl)) {
        const img = new Image();
        img.src = slot.imageUrl;
        loadedSheetImages.set(slot.imageUrl, img);
      }
    }
  }
}

function tryDrawCustomSpriteSheet(
  ctx: CanvasRenderingContext2D,
  id: PlayerId,
  state: SpriteState,
  animTime: number,
  x: number,
  y: number,
  facing: 1 | -1,
  scaleX: number,
  scaleY: number
): boolean {
  const slot = customRegistry[id]?.[state];
  if (!slot?.imageUrl) return false;
  const img = loadedSheetImages.get(slot.imageUrl);
  if (!img || !img.complete || img.naturalWidth === 0) return false;

  const rawFrame = Math.floor(animTime * slot.fps);
  const frameIdx = slot.loop
    ? rawFrame % slot.frameCount
    : Math.min(slot.frameCount - 1, rawFrame);

  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));
  ctx.scale(facing * scaleX, scaleY);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(
    img,
    frameIdx * slot.frameWidth,
    0,
    slot.frameWidth,
    slot.frameHeight,
    -slot.frameWidth / 2,
    -slot.frameHeight,
    slot.frameWidth,
    slot.frameHeight
  );
  ctx.restore();
  return true;
}

/** Pixel-snapped rect helper for crisp 16-bit/32-bit sprites */
function px(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string
): void {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

function outlinedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  fill: string,
  outline = '#14131c'
): void {
  px(ctx, x - 2, y - 2, w + 4, h + 4, outline);
  px(ctx, x, y, w, h, fill);
}

export interface SpriteDrawParams {
  kind: PlayerId | EnemyArchetype | BossId;
  x: number;
  groundScreenY: number;
  jumpY: number;
  facing: 1 | -1;
  state: SpriteState;
  animTime: number;
  walkDistance: number;
  heightScale: number;
  widthScale: number;
  hitFlash: boolean;
  squashX: number;
  squashY: number;
  glassesGlintTimer?: number;
  rageGlow?: boolean;
  telegraphRatio?: number;
}

/**
 * Draws a rich Metal-Slug-inspired 16/32-bit procedural pixel sprite with expressive
 * frame poses for every SpriteState: IDLE, WALK, JUMP, PUNCH, KICK, SPECIAL, HURT, KNOCKDOWN, BLOCK, VICTORY.
 */
export function drawFighterSprite(
  ctx: CanvasRenderingContext2D,
  params: SpriteDrawParams
): void {
  const {
    kind,
    x,
    groundScreenY,
    jumpY,
    facing,
    state,
    animTime,
    walkDistance,
    heightScale,
    widthScale,
    hitFlash,
    squashX,
    squashY,
    glassesGlintTimer = 0,
    rageGlow = false,
    telegraphRatio = 0,
  } = params;

  // Ground ellipse shadow (always grounded on street plane)
  const shadowScale = Math.max(0.45, 1 - jumpY / 220);
  ctx.save();
  ctx.fillStyle = 'rgba(12, 12, 20, 0.36)';
  ctx.beginPath();
  ctx.ellipse(
    Math.round(x),
    Math.round(groundScreenY + 2),
    Math.round(24 * widthScale * shadowScale),
    Math.round(8 * shadowScale),
    0,
    0,
    Math.PI * 2
  );
  ctx.fill();
  ctx.restore();

  const drawY = groundScreenY - jumpY;

  // Allow custom sprite sheets for Ziyad and Mohamed with zero engine modifications
  if (
    (kind === 'ziyad' || kind === 'mohamed') &&
    tryDrawCustomSpriteSheet(
      ctx,
      kind,
      state,
      animTime,
      x,
      drawY,
      facing,
      squashX,
      squashY
    )
  ) {
    return;
  }

  const palette = getFighterPalette(kind);

  ctx.save();
  ctx.translate(Math.round(x), Math.round(drawY));
  ctx.scale(facing * widthScale * squashX, heightScale * squashY);

  // Telegraph / Rage aura around boss
  if (rageGlow) {
    const pulse = 0.25 + 0.15 * Math.sin(animTime * 16);
    ctx.fillStyle = `rgba(239, 68, 68, ${pulse})`;
    ctx.fillRect(-30, -86, 60, 88);
  } else if (telegraphRatio > 0) {
    ctx.fillStyle = `rgba(250, 204, 21, ${0.18 + telegraphRatio * 0.28})`;
    ctx.fillRect(-26, -82, 52, 84);
  }

  // Knockdown horizontal lie-down pose
  if (state === 'KNOCKDOWN') {
    ctx.translate(0, -14);
    ctx.rotate(-Math.PI / 2);
  } else if (state === 'HURT') {
    ctx.rotate(-0.18);
  }

  // Distance-synced gait cycle for walk; breathing bob for idle
  const stridePhase =
    state === 'WALK' ? Math.sin(walkDistance * 0.13) : Math.sin(animTime * 6.5) * 0.15;
  const idleBob =
    state === 'IDLE'
      ? Math.round(Math.sin(animTime * 7) * 2)
      : state === 'WALK'
        ? -Math.abs(Math.round(stridePhase * 3))
        : 0;

  // Pose offsets per SpriteState
  const isPunch = state === 'PUNCH';
  const isKick = state === 'KICK';
  const isSpecial = state === 'SPECIAL';
  const isJump = state === 'JUMP';
  const isBlock = state === 'BLOCK';
  const isVictory = state === 'VICTORY';

  const torsoLean = isPunch ? 4 : isSpecial ? 6 : isKick ? -4 : 0;

  // --- LEGS & SNEAKERS ---
  const leftLegX = state === 'WALK' ? -9 + stridePhase * 9 : isKick ? -12 : -10;
  const rightLegX = state === 'WALK' ? 3 - stridePhase * 9 : isKick ? 14 : 4;
  const legHeight = isJump ? 18 : 26;
  const legTopY = isJump ? -32 : -28;

  // Back leg
  outlinedRect(ctx, leftLegX, legTopY, 9, legHeight, palette.pantsDark);
  outlinedRect(ctx, leftLegX - 1, legTopY + legHeight - 6, 12, 7, palette.shoeDark);
  px(ctx, leftLegX, legTopY + legHeight - 2, 11, 2, '#f4f4f5'); // sneaker sole

  // Front leg (extended if kicking or spinning special!)
  if (isKick) {
    // High/front kick extension
    outlinedRect(ctx, 4, -36, 26, 9, palette.pants);
    outlinedRect(ctx, 26, -38, 12, 10, palette.shoe);
    px(ctx, 30, -34, 6, 3, '#ffffff');
  } else if (isSpecial && kind === 'ziyad') {
    // Spinning tornado kick arc
    const spinDir = Math.cos(animTime * 28) >= 0 ? 1 : -1;
    outlinedRect(ctx, spinDir * 4, -40, spinDir * 28, 9, palette.pants);
    outlinedRect(ctx, spinDir * 28, -42, spinDir * 11, 10, palette.shoe);
    ctx.fillStyle = 'rgba(250, 204, 21, 0.55)';
    ctx.fillRect(-34, -44, 68, 5);
  } else {
    outlinedRect(ctx, rightLegX, legTopY, 9, legHeight, palette.pants);
    outlinedRect(ctx, rightLegX - 1, legTopY + legHeight - 6, 12, 7, palette.shoe);
    px(ctx, rightLegX, legTopY + legHeight - 2, 11, 2, '#ffffff');
  }

  // --- TORSO & OUTFIT ---
  const torsoY = -56 + idleBob;
  const torsoW = kind === 'mohamed' || kind === 'saad' ? 28 : 22;
  const torsoX = -torsoW / 2 + torsoLean;

  outlinedRect(ctx, torsoX, torsoY, torsoW, 30, palette.top);
  // Shading & outfit details
  px(ctx, torsoX + 2, torsoY + 2, 5, 26, palette.topHighlight);
  px(ctx, torsoX + torsoW - 6, torsoY + 2, 4, 26, palette.topShade);

  // Ziyad's black hoodie drawstrings & hood collar
  if (kind === 'ziyad') {
    px(ctx, torsoX + 3, torsoY - 3, torsoW - 6, 5, '#18181b'); // hood collar
    px(ctx, torsoX + 9, torsoY + 4, 2, 11, '#d4d4d8'); // left drawstring
    px(ctx, torsoX + 13, torsoY + 4, 2, 11, '#d4d4d8'); // right drawstring
    px(ctx, torsoX + 4, torsoY + 19, torsoW - 8, 8, '#18181b'); // hoodie pocket
  }

  // Mohamed's charcoal pullover hoodie pocket & hood rim
  if (kind === 'mohamed') {
    px(ctx, torsoX + 4, torsoY - 3, torsoW - 8, 5, '#2d3138');
    px(ctx, torsoX + 11, torsoY + 4, 2, 10, '#9ca3af');
    px(ctx, torsoX + 16, torsoY + 4, 2, 10, '#9ca3af');
    px(ctx, torsoX + 5, torsoY + 19, torsoW - 10, 9, '#2d3138');
    // Mohamed's signature shorts hem (matches full-body photo)
    px(ctx, -14, -30, 28, 7, '#14151a');
  }

  // Anas rural vest details
  if (kind === 'anas') {
    px(ctx, torsoX + 2, torsoY, 6, 28, '#854d0e');
    px(ctx, torsoX + torsoW - 8, torsoY, 6, 28, '#854d0e');
    px(ctx, torsoX + 9, torsoY + 3, 4, 24, '#fef3c7');
  }

  // Baraa neat traditional-meets-casual tunic trim
  if (kind === 'baraa') {
    px(ctx, torsoX + torsoW / 2 - 2, torsoY + 2, 4, 24, '#fbbf24'); // gold trim placket
    px(ctx, torsoX + 2, torsoY + 24, torsoW - 4, 4, '#0f766e'); // sash belt
  }

  // Taunter striped tee
  if (kind === 'taunter') {
    px(ctx, torsoX + 1, torsoY + 8, torsoW - 2, 4, '#fef2f2');
    px(ctx, torsoX + 1, torsoY + 18, torsoW - 2, 4, '#fef2f2');
  }

  // --- BACK ARM ---
  const backArmY = torsoY + 4;
  if (isVictory) {
    outlinedRect(ctx, torsoX - 8, torsoY - 16, 8, 20, palette.topShade);
    outlinedRect(ctx, torsoX - 8, torsoY - 22, 8, 7, palette.skin);
  } else {
    outlinedRect(ctx, torsoX - 6, backArmY, 7, 16, palette.topShade);
    outlinedRect(ctx, torsoX - 6, backArmY + 15, 7, 7, palette.skin);
  }

  // --- HEAD, FACE & HAIR ---
  const headY = torsoY - 22;
  const headW = 20;
  const headX = -headW / 2 + torsoLean;

  outlinedRect(ctx, headX, headY, headW, 21, palette.skin);
  // Subtle jaw shadow
  px(ctx, headX + 1, headY + 16, headW - 2, 4, palette.skinShade);

  // Expressive eyes
  px(ctx, headX + 11, headY + 8, 3, 4, '#18181b');
  px(ctx, headX + 16, headY + 8, 3, 4, '#18181b');
  // Eye shine
  px(ctx, headX + 12, headY + 8, 1, 1, '#ffffff');
  px(ctx, headX + 17, headY + 8, 1, 1, '#ffffff');

  // Eyebrows (angry for bullies/bosses, focused for Ziyad & Mohamed)
  const browColor = kind === 'anas' ? '#a16207' : '#18181b';
  px(ctx, headX + 10, headY + 6, 4, 2, browColor);
  px(ctx, headX + 15, headY + 6, 4, 2, browColor);

  // Mouth
  px(ctx, headX + 12, headY + 15, 5, 2, '#9a5b4a');

  // Hair / Headgear per character
  if (kind === 'ziyad') {
    // Dark curly/wavy hair with characteristic forehead curls from reference image 1
    outlinedRect(ctx, headX - 1, headY - 6, headW + 2, 8, '#171717');
    px(ctx, headX - 2, headY + 1, 5, 11, '#171717'); // back hair
    // Curly bangs hanging onto forehead
    px(ctx, headX + 5, headY + 1, 3, 4, '#171717');
    px(ctx, headX + 10, headY + 1, 4, 5, '#171717');
    px(ctx, headX + 15, headY + 1, 3, 3, '#171717');
    px(ctx, headX + 4, headY - 4, 6, 2, '#2e2e33'); // hair sheen
  } else if (kind === 'mohamed') {
    // Dark curly hair from reference image 2
    outlinedRect(ctx, headX - 1, headY - 7, headW + 2, 9, '#18181b');
    px(ctx, headX - 2, headY + 1, 5, 10, '#18181b');
    px(ctx, headX + 6, headY + 1, 4, 3, '#18181b');
    px(ctx, headX + 12, headY + 1, 4, 3, '#18181b');
    px(ctx, headX + 4, headY - 5, 8, 2, '#303038');

    // Signature round dark-rimmed eyeglasses from reference image 2!
    const glinting = glassesGlintTimer > 0;
    const frameCol = '#09090b';
    const lensCol = glinting ? '#fef08a' : 'rgba(224, 242, 254, 0.45)';
    // Left lens frame & bridge & right lens frame
    px(ctx, headX + 9, headY + 7, 6, 6, frameCol);
    px(ctx, headX + 10, headY + 8, 4, 4, lensCol);
    px(ctx, headX + 15, headY + 9, 1, 2, frameCol); // bridge
    px(ctx, headX + 16, headY + 7, 5, 6, frameCol);
    px(ctx, headX + 17, headY + 8, 3, 4, lensCol);
    px(ctx, headX + 4, headY + 9, 5, 1, frameCol); // temple arm
    if (glinting) {
      // Dramatic anime/arcade glasses glint star!
      px(ctx, headX + 18, headY + 4, 2, 10, '#ffffff');
      px(ctx, headX + 14, headY + 8, 10, 2, '#ffffff');
    }
  } else if (kind === 'anas') {
    // Slightly blonde rural hair, messy energetic tufts
    outlinedRect(ctx, headX - 1, headY - 6, headW + 3, 8, '#eab308');
    px(ctx, headX + 14, headY - 8, 6, 4, '#facc15');
    px(ctx, headX + 3, headY - 8, 5, 4, '#ca8a04');
  } else if (kind === 'saad') {
    // Close-cropped dark curly hair
    outlinedRect(ctx, headX - 1, headY - 5, headW + 2, 7, '#111115');
  } else if (kind === 'baraa') {
    // Sharp, neat disciplined dark hair & calm beard/stubble hint
    outlinedRect(ctx, headX - 1, headY - 6, headW + 2, 8, '#171717');
    px(ctx, headX + 4, headY - 4, 10, 2, '#3f3f46');
  } else if (kind === 'taunter') {
    // Backwards cap
    outlinedRect(ctx, headX - 3, headY - 6, headW + 4, 7, '#dc2626');
    px(ctx, headX - 8, headY - 3, 7, 3, '#991b1b');
  } else if (kind === 'grappler') {
    // Blue headband
    outlinedRect(ctx, headX - 1, headY - 5, headW + 2, 6, '#1c1917');
    px(ctx, headX - 1, headY + 1, headW + 2, 4, '#2563eb');
    px(ctx, headX - 6, headY + 2, 5, 5, '#1d4ed8'); // bandana tails
  } else {
    outlinedRect(ctx, headX - 1, headY - 5, headW + 2, 7, '#27272a');
  }

  // --- FRONT ARM (PUNCH / BLOCK / SPECIAL / IDLE) ---
  if (isPunch) {
    // Extended heavy punch!
    outlinedRect(ctx, torsoX + torsoW - 4, torsoY + 3, 24, 9, palette.top);
    outlinedRect(ctx, torsoX + torsoW + 18, torsoY + 2, 10, 10, palette.skin);
    px(ctx, torsoX + torsoW + 26, torsoY + 1, 6, 12, 'rgba(255,255,255,0.55)');
  } else if (isSpecial && kind === 'mohamed') {
    // Heavy shoulder/belly charge tucked arm!
    outlinedRect(ctx, torsoX + torsoW - 6, torsoY + 4, 14, 14, palette.topHighlight);
    ctx.fillStyle = 'rgba(251, 191, 36, 0.5)';
    ctx.fillRect(torsoX + torsoW + 4, torsoY - 2, 10, 32);
  } else if (isBlock) {
    // Crossed defensive martial guard
    outlinedRect(ctx, torsoX + torsoW - 6, torsoY - 4, 10, 22, palette.topHighlight);
    outlinedRect(ctx, torsoX + torsoW - 5, torsoY - 8, 9, 8, palette.skin);
  } else if (isVictory) {
    // Raised fist celebration!
    outlinedRect(ctx, torsoX + torsoW - 4, torsoY - 18, 9, 20, palette.top);
    outlinedRect(ctx, torsoX + torsoW - 4, torsoY - 25, 9, 8, palette.skin);
  } else {
    const armSwing = state === 'WALK' ? -stridePhase * 5 : 0;
    outlinedRect(ctx, torsoX + 8 + armSwing, torsoY + 5, 8, 16, palette.top);
    outlinedRect(ctx, torsoX + 9 + armSwing, torsoY + 20, 8, 7, palette.skin);
  }

  // --- HIT FLASH OVERLAY ---
  if (hitFlash) {
    ctx.globalCompositeOperation = 'source-atop';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.fillRect(-48, -96, 96, 110);
  }

  ctx.restore();
}

function getFighterPalette(kind: PlayerId | EnemyArchetype | BossId) {
  switch (kind) {
    case 'ziyad':
      // Photo 1: warm olive-tan skin, black hoodie, denim jeans, dark sneakers
      return {
        skin: '#d8a47f',
        skinShade: '#b87f5a',
        top: '#1e1f26',
        topHighlight: '#323440',
        topShade: '#111217',
        pants: '#2c4870',
        pantsDark: '#1e324f',
        shoe: '#e4e4e7',
        shoeDark: '#a1a1aa',
      };
    case 'mohamed':
      // Photo 2: warm tan skin, charcoal/dark grey pullover hoodie, black shorts, sneakers
      return {
        skin: '#cf9974',
        skinShade: '#ae7652',
        top: '#3a3d45',
        topHighlight: '#50545e',
        topShade: '#26282e',
        pants: '#c58f6a', // legs below shorts
        pantsDark: '#ab7652',
        shoe: '#1e293b',
        shoeDark: '#0f172a',
      };
    case 'taunter':
      return {
        skin: '#deb08a',
        skinShade: '#be8a62',
        top: '#dc2626',
        topHighlight: '#ef4444',
        topShade: '#991b1b',
        pants: '#334155',
        pantsDark: '#1e293b',
        shoe: '#f8fafc',
        shoeDark: '#cbd5e1',
      };
    case 'shover':
      return {
        skin: '#c68d65',
        skinShade: '#9f6944',
        top: '#4d7c0f',
        topHighlight: '#65a30d',
        topShade: '#365314',
        pants: '#475569',
        pantsDark: '#334155',
        shoe: '#27272a',
        shoeDark: '#18181b',
      };
    case 'grappler':
      return {
        skin: '#b87c56',
        skinShade: '#8f5938',
        top: '#1d4ed8',
        topHighlight: '#3b82f6',
        topShade: '#1e3a8a',
        pants: '#27272a',
        pantsDark: '#18181b',
        shoe: '#52525b',
        shoeDark: '#3f3f46',
      };
    case 'thrower':
      return {
        skin: '#d7a27c',
        skinShade: '#b37c55',
        top: '#d97706',
        topHighlight: '#f59e0b',
        topShade: '#92400e',
        pants: '#3f3f46',
        pantsDark: '#27272a',
        shoe: '#e4e4e7',
        shoeDark: '#a1a1aa',
      };
    case 'anas':
      // Slightly blonde rural vibe
      return {
        skin: '#e0b48d',
        skinShade: '#bd8a62',
        top: '#a16207',
        topHighlight: '#ca8a04',
        topShade: '#713f12',
        pants: '#3f6212',
        pantsDark: '#2c440c',
        shoe: '#78350f',
        shoeDark: '#451a03',
      };
    case 'saad':
      // Dark-skinned, chubby/heavy build
      return {
        skin: '#7c4d34',
        skinShade: '#5b3522',
        top: '#7f1d1d',
        topHighlight: '#b91c1c',
        topShade: '#450a0a',
        pants: '#1f2937',
        pantsDark: '#111827',
        shoe: '#374151',
        shoeDark: '#1f2937',
      };
    case 'baraa':
      // Neat traditional-meets-casual attire
      return {
        skin: '#d6a079',
        skinShade: '#b27a53',
        top: '#0f766e',
        topHighlight: '#14b8a6',
        topShade: '#115e59',
        pants: '#1e293b',
        pantsDark: '#0f172a',
        shoe: '#f1f5f9',
        shoeDark: '#cbd5e1',
      };
  }
}

export function drawPropSprite(
  ctx: CanvasRenderingContext2D,
  type: PropType,
  x: number,
  groundScreenY: number,
  hitFlash: boolean
): void {
  ctx.save();
  ctx.translate(Math.round(x), Math.round(groundScreenY));

  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  ctx.ellipse(0, 2, 22, 7, 0, 0, Math.PI * 2);
  ctx.fill();

  if (type === 'crate') {
    outlinedRect(ctx, -18, -36, 36, 36, '#b45309');
    px(ctx, -15, -33, 30, 30, '#d97706');
    px(ctx, -15, -20, 30, 4, '#92400e');
    px(ctx, -15, -33, 4, 30, '#78350f');
    px(ctx, 11, -33, 4, 30, '#78350f');
    // Diagonal brace
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-13, -31);
    ctx.lineTo(13, -5);
    ctx.stroke();
  } else {
    // Street trash can
    outlinedRect(ctx, -15, -38, 30, 38, '#52525b');
    px(ctx, -12, -35, 6, 32, '#71717a');
    px(ctx, -2, -35, 4, 32, '#3f3f46');
    px(ctx, 6, -35, 4, 32, '#3f3f46');
    outlinedRect(ctx, -17, -43, 34, 6, '#71717a');
    px(ctx, -5, -47, 10, 4, '#3f3f46');
  }

  if (hitFlash) {
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.fillRect(-20, -48, 40, 50);
  }
  ctx.restore();
}

export function drawSnackPickup(
  ctx: CanvasRenderingContext2D,
  snack: SnackType,
  x: number,
  groundScreenY: number,
  yOffset: number
): void {
  ctx.save();
  ctx.translate(Math.round(x), Math.round(groundScreenY - yOffset));

  ctx.fillStyle = 'rgba(250, 204, 21, 0.25)';
  ctx.beginPath();
  ctx.arc(0, -10, 16, 0, Math.PI * 2);
  ctx.fill();

  if (snack === 'sandwich') {
    outlinedRect(ctx, -12, -16, 24, 12, '#f59e0b');
    px(ctx, -10, -12, 20, 3, '#22c55e'); // lettuce
    px(ctx, -10, -9, 20, 3, '#ef4444'); // tomato
    px(ctx, -10, -15, 20, 3, '#fde68a'); // top bread
  } else if (snack === 'juice') {
    outlinedRect(ctx, -8, -20, 16, 20, '#f97316');
    px(ctx, -6, -15, 12, 8, '#fef08a');
    px(ctx, 2, -26, 2, 6, '#ffffff'); // straw
    px(ctx, 2, -26, 6, 2, '#ffffff');
  } else {
    outlinedRect(ctx, -9, -17, 18, 16, '#dc2626');
    px(ctx, -6, -15, 5, 5, '#fca5a5');
    px(ctx, -1, -21, 2, 4, '#78350f');
    px(ctx, 1, -21, 5, 3, '#22c55e');
  }
  ctx.restore();
}

const portraitCache = new Map<CharacterPortraitId, string>();

/**
 * Generates crisp 48x48 pixel-art portraits for HUD & Cutscenes matching each character's
 * exact features (Ziyad's curly bangs & black hoodie, Mohamed's glasses & charcoal hoodie, Anas, Saad, Baraa).
 */
export function getPortraitDataUrl(id: CharacterPortraitId): string {
  const existing = portraitCache.get(id);
  if (existing) return existing;
  if (typeof document === 'undefined') return '';

  const canvas = document.createElement('canvas');
  canvas.width = 48;
  canvas.height = 48;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  ctx.imageSmoothingEnabled = false;

  const bgColors: Record<CharacterPortraitId, string> = {
    ziyad: '#1e3a5f',
    mohamed: '#312e81',
    taunter: '#7f1d1d',
    shover: '#365314',
    anas: '#78350f',
    saad: '#581c87',
    baraa: '#115e59',
  };

  px(ctx, 0, 0, 48, 48, bgColors[id]);
  // Subtle pixel grid backdrop highlight
  px(ctx, 4, 4, 40, 40, 'rgba(255,255,255,0.06)');

  const palette = getFighterPalette(id === 'taunter' || id === 'shover' ? id : id);

  // Shoulders / hoodie collar
  outlinedRect(ctx, 8, 34, 32, 16, palette.top);
  if (id === 'ziyad') {
    px(ctx, 12, 33, 24, 5, '#18181b');
    px(ctx, 19, 37, 2, 11, '#e4e4e7');
    px(ctx, 27, 37, 2, 11, '#e4e4e7');
  } else if (id === 'mohamed') {
    px(ctx, 12, 33, 24, 5, '#27272a');
    px(ctx, 20, 37, 2, 11, '#a1a1aa');
    px(ctx, 26, 37, 2, 11, '#a1a1aa');
  } else if (id === 'baraa') {
    px(ctx, 22, 35, 4, 13, '#fbbf24');
  }

  // Neck & Head
  px(ctx, 19, 28, 10, 8, palette.skinShade);
  outlinedRect(ctx, 13, 10, 22, 22, palette.skin);
  px(ctx, 14, 27, 20, 4, palette.skinShade);

  // Eyes
  px(ctx, 17, 19, 4, 4, '#18181b');
  px(ctx, 27, 19, 4, 4, '#18181b');
  px(ctx, 18, 19, 1, 1, '#ffffff');
  px(ctx, 28, 19, 1, 1, '#ffffff');

  // Mouth
  px(ctx, 21, 26, 6, 2, '#9a5b4a');

  // Hair & signature traits
  if (id === 'ziyad') {
    outlinedRect(ctx, 12, 4, 24, 9, '#171717');
    px(ctx, 15, 11, 4, 4, '#171717');
    px(ctx, 21, 11, 5, 5, '#171717');
    px(ctx, 28, 11, 4, 4, '#171717');
    px(ctx, 17, 6, 8, 2, '#303036');
  } else if (id === 'mohamed') {
    outlinedRect(ctx, 12, 4, 24, 9, '#18181b');
    px(ctx, 15, 11, 5, 3, '#18181b');
    px(ctx, 24, 11, 5, 3, '#18181b');
    // Round dark-rimmed eyeglasses
    px(ctx, 15, 17, 8, 8, '#09090b');
    px(ctx, 16, 18, 6, 6, 'rgba(224,242,254,0.35)');
    px(ctx, 17, 19, 2, 2, '#ffffff');
    px(ctx, 23, 20, 2, 2, '#09090b');
    px(ctx, 25, 17, 8, 8, '#09090b');
    px(ctx, 26, 18, 6, 6, 'rgba(224,242,254,0.35)');
    px(ctx, 27, 19, 2, 2, '#ffffff');
  } else if (id === 'anas') {
    outlinedRect(ctx, 12, 4, 24, 9, '#eab308');
    px(ctx, 15, 3, 6, 4, '#facc15');
    px(ctx, 25, 2, 6, 5, '#ca8a04');
  } else if (id === 'saad') {
    outlinedRect(ctx, 12, 6, 24, 7, '#111115');
    px(ctx, 16, 16, 6, 2, '#111115');
    px(ctx, 26, 16, 6, 2, '#111115');
  } else if (id === 'baraa') {
    outlinedRect(ctx, 12, 5, 24, 8, '#171717');
    px(ctx, 17, 7, 10, 2, '#3f3f46');
    px(ctx, 16, 16, 5, 2, '#171717');
    px(ctx, 27, 16, 5, 2, '#171717');
  } else if (id === 'taunter') {
    outlinedRect(ctx, 11, 5, 26, 7, '#dc2626');
    px(ctx, 7, 8, 6, 4, '#991b1b');
  } else {
    outlinedRect(ctx, 12, 5, 24, 8, '#27272a');
  }

  const url = canvas.toDataURL();
  portraitCache.set(id, url);
  return url;
}
