import type {
  AttackSpec,
  BossId,
  CutsceneLine,
  EnemyArchetype,
  PlayerId,
  PropType,
  SnackType,
  StageDefinition,
  WaveDefinition,
} from './types';

export const LOGICAL_WIDTH = 960;
export const LOGICAL_HEIGHT = 540;

// Street walkable depth band (Z-axis in screen Y pixels from top)
export const STREET_Z_MIN = 315;
export const STREET_Z_MAX = 492;
export const GRAVITY = 1520;

export const TOTAL_STAGES = 15;
export const MAX_CONCURRENT_ATTACK_TOKENS = 3;

export const STORAGE_PROGRESS_KEY = 'nb_ziyad_mohamed_progress_v1';
export const STORAGE_BEST_SCORE_KEY = 'nb_ziyad_mohamed_best_score_v1';

export const PLAYER_BASE_STATS: Record<
  PlayerId,
  {
    name: string;
    arabicName: string;
    maxHp: number;
    maxStamina: number;
    walkSpeedX: number;
    walkSpeedZ: number;
    jumpVel: number;
    heightScale: number;
    widthScale: number;
    hitboxHalfW: number;
    hitboxHalfZ: number;
    hitboxHeight: number;
  }
> = {
  // 13yo, 157 cm, thin/slim build, fast & agile
  ziyad: {
    name: 'ZIYAD',
    arabicName: 'زياد',
    maxHp: 110,
    maxStamina: 100,
    walkSpeedX: 255,
    walkSpeedZ: 155,
    jumpVel: 585,
    heightScale: 0.94,
    widthScale: 0.9,
    hitboxHalfW: 20,
    hitboxHalfZ: 18,
    hitboxHeight: 74,
  },
  // 15yo, 170 cm taller, 70 kg stocky powerhouse, glasses
  mohamed: {
    name: 'MOHAMED',
    arabicName: 'محمد',
    maxHp: 150,
    maxStamina: 100,
    walkSpeedX: 205,
    walkSpeedZ: 128,
    jumpVel: 530,
    heightScale: 1.07,
    widthScale: 1.16,
    hitboxHalfW: 27,
    hitboxHalfZ: 21,
    hitboxHeight: 84,
  },
};

export const ZIYAD_PUNCH_COMBO: AttackSpec[] = [
  {
    kind: 'PUNCH',
    comboStep: 1,
    damage: 11,
    knockbackX: 70,
    knockdown: false,
    hitstopSec: 0.02,
    shakeTrauma: 0.1,
    reachX: 54,
    depthZ: 24,
    heightY: 64,
    windupSec: 0.05,
    activeSec: 0.09,
    recoverySec: 0.09,
    staminaCost: 0,
    label: 'JAB!',
  },
  {
    kind: 'PUNCH',
    comboStep: 2,
    damage: 13,
    knockbackX: 90,
    knockdown: false,
    hitstopSec: 0.025,
    shakeTrauma: 0.14,
    reachX: 58,
    depthZ: 26,
    heightY: 64,
    windupSec: 0.05,
    activeSec: 0.1,
    recoverySec: 0.1,
    staminaCost: 0,
    label: 'CROSS!',
  },
  {
    kind: 'PUNCH',
    comboStep: 3,
    damage: 18,
    knockbackX: 195,
    knockdown: true,
    hitstopSec: 0.05,
    shakeTrauma: 0.3,
    reachX: 62,
    depthZ: 28,
    heightY: 70,
    windupSec: 0.07,
    activeSec: 0.12,
    recoverySec: 0.16,
    staminaCost: 0,
    label: 'POW!',
  },
];

export const ZIYAD_KICK_COMBO: AttackSpec[] = [
  {
    kind: 'KICK',
    comboStep: 1,
    damage: 14,
    knockbackX: 130,
    knockdown: false,
    hitstopSec: 0.045,
    shakeTrauma: 0.22,
    reachX: 64,
    depthZ: 26,
    heightY: 62,
    windupSec: 0.07,
    activeSec: 0.11,
    recoverySec: 0.12,
    staminaCost: 0,
    label: 'SNAP!',
  },
  {
    kind: 'KICK',
    comboStep: 2,
    damage: 16,
    knockbackX: 150,
    knockdown: false,
    hitstopSec: 0.05,
    shakeTrauma: 0.26,
    reachX: 66,
    depthZ: 28,
    heightY: 46,
    windupSec: 0.07,
    activeSec: 0.12,
    recoverySec: 0.13,
    staminaCost: 0,
    label: 'SWEEP!',
  },
  {
    kind: 'KICK',
    comboStep: 3,
    damage: 22,
    knockbackX: 250,
    knockdown: true,
    hitstopSec: 0.065,
    shakeTrauma: 0.42,
    reachX: 72,
    depthZ: 30,
    heightY: 70,
    windupSec: 0.09,
    activeSec: 0.14,
    recoverySec: 0.18,
    staminaCost: 0,
    label: 'THWACK!',
  },
];

export const ZIYAD_SPECIAL: AttackSpec = {
  kind: 'SPECIAL',
  comboStep: 1,
  damage: 28,
  knockbackX: 290,
  knockdown: true,
  hitstopSec: 0.075,
  shakeTrauma: 0.52,
  reachX: 78,
  depthZ: 44,
  heightY: 76,
  windupSec: 0.05,
  activeSec: 0.24,
  recoverySec: 0.16,
  staminaCost: 26,
  label: 'SPIN KICK!',
};

export const MOHAMED_PUNCH_COMBO: AttackSpec[] = [
  {
    kind: 'PUNCH',
    comboStep: 1,
    damage: 17,
    knockbackX: 120,
    knockdown: false,
    hitstopSec: 0.035,
    shakeTrauma: 0.2,
    reachX: 64,
    depthZ: 28,
    heightY: 76,
    windupSec: 0.08,
    activeSec: 0.12,
    recoverySec: 0.13,
    staminaCost: 0,
    label: 'HOOK!',
  },
  {
    kind: 'PUNCH',
    comboStep: 2,
    damage: 21,
    knockbackX: 185,
    knockdown: false,
    hitstopSec: 0.045,
    shakeTrauma: 0.28,
    reachX: 68,
    depthZ: 32,
    heightY: 76,
    windupSec: 0.09,
    activeSec: 0.12,
    recoverySec: 0.15,
    staminaCost: 0,
    label: 'SHOVE!',
  },
  {
    kind: 'PUNCH',
    comboStep: 3,
    damage: 29,
    knockbackX: 260,
    knockdown: true,
    hitstopSec: 0.075,
    shakeTrauma: 0.5,
    reachX: 72,
    depthZ: 34,
    heightY: 86,
    windupSec: 0.11,
    activeSec: 0.14,
    recoverySec: 0.22,
    staminaCost: 0,
    label: 'SLAM!',
  },
];

export const MOHAMED_KICK_COMBO: AttackSpec[] = [
  {
    kind: 'KICK',
    comboStep: 1,
    damage: 23,
    knockbackX: 340,
    knockdown: true,
    hitstopSec: 0.07,
    shakeTrauma: 0.45,
    reachX: 76,
    depthZ: 30,
    heightY: 72,
    windupSec: 0.1,
    activeSec: 0.14,
    recoverySec: 0.18,
    staminaCost: 0,
    label: 'BOOT!',
  },
  {
    kind: 'KICK',
    comboStep: 2,
    damage: 28,
    knockbackX: 280,
    knockdown: true,
    hitstopSec: 0.08,
    shakeTrauma: 0.56,
    reachX: 72,
    depthZ: 38,
    heightY: 72,
    windupSec: 0.12,
    activeSec: 0.15,
    recoverySec: 0.22,
    staminaCost: 0,
    label: 'STOMP!',
  },
];

export const MOHAMED_SPECIAL: AttackSpec = {
  kind: 'SPECIAL',
  comboStep: 1,
  damage: 36,
  knockbackX: 390,
  knockdown: true,
  hitstopSec: 0.085,
  shakeTrauma: 0.65,
  reachX: 88,
  depthZ: 46,
  heightY: 84,
  windupSec: 0.08,
  activeSec: 0.28,
  recoverySec: 0.2,
  staminaCost: 30,
  label: 'CRUSH!',
};

export const ENEMY_CONFIGS: Record<
  EnemyArchetype,
  {
    name: string;
    arabicName: string;
    maxHp: number;
    speedX: number;
    speedZ: number;
    damage: number;
    knockdownAttack: boolean;
    heightScale: number;
    widthScale: number;
    hitboxHalfW: number;
    hitboxHalfZ: number;
    hitboxHeight: number;
    scoreValue: number;
  }
> = {
  taunter: {
    name: 'Street Taunter',
    arabicName: 'المشاكس السريع',
    maxHp: 46,
    speedX: 165,
    speedZ: 112,
    damage: 7,
    knockdownAttack: false,
    heightScale: 0.93,
    widthScale: 0.86,
    hitboxHalfW: 19,
    hitboxHalfZ: 17,
    hitboxHeight: 72,
    scoreValue: 120,
  },
  shover: {
    name: 'Alley Shover',
    arabicName: 'الدفّاع',
    maxHp: 68,
    speedX: 150,
    speedZ: 96,
    damage: 11,
    knockdownAttack: true,
    heightScale: 1.0,
    widthScale: 1.04,
    hitboxHalfW: 23,
    hitboxHalfZ: 19,
    hitboxHeight: 78,
    scoreValue: 180,
  },
  grappler: {
    name: 'Corner Grappler',
    arabicName: 'الممسك',
    maxHp: 84,
    speedX: 122,
    speedZ: 88,
    damage: 9,
    knockdownAttack: false,
    heightScale: 1.06,
    widthScale: 1.12,
    hitboxHalfW: 25,
    hitboxHalfZ: 20,
    hitboxHeight: 82,
    scoreValue: 220,
  },
  thrower: {
    name: 'Soda Thrower',
    arabicName: 'رامي الأشياء',
    maxHp: 52,
    speedX: 138,
    speedZ: 105,
    damage: 9,
    knockdownAttack: false,
    heightScale: 0.96,
    widthScale: 0.95,
    hitboxHalfW: 20,
    hitboxHalfZ: 18,
    hitboxHeight: 75,
    scoreValue: 160,
  },
};

export const BOSS_CONFIGS: Record<
  BossId,
  {
    name: string;
    arabicName: string;
    maxHp: number;
    speedX: number;
    speedZ: number;
    damage: number;
    heightScale: number;
    widthScale: number;
    hitboxHalfW: number;
    hitboxHalfZ: number;
    hitboxHeight: number;
    scoreValue: number;
  }
> = {
  anas: {
    name: 'ANAS',
    arabicName: 'أناس',
    maxHp: 340,
    speedX: 198,
    speedZ: 132,
    damage: 14,
    heightScale: 1.02,
    widthScale: 0.98,
    hitboxHalfW: 24,
    hitboxHalfZ: 20,
    hitboxHeight: 80,
    scoreValue: 1200,
  },
  saad: {
    name: 'SAAD',
    arabicName: 'سعد',
    maxHp: 460,
    speedX: 142,
    speedZ: 98,
    damage: 18,
    // Roughly the same height as Ziyad (~157 cm), chubby/heavy build
    heightScale: 0.95,
    widthScale: 1.24,
    hitboxHalfW: 29,
    hitboxHalfZ: 22,
    hitboxHeight: 76,
    scoreValue: 2000,
  },
  baraa: {
    name: 'BARAA',
    arabicName: 'براء - ابن فقيه الجامع',
    maxHp: 580,
    speedX: 215,
    speedZ: 144,
    damage: 16,
    heightScale: 1.06,
    widthScale: 1.0,
    hitboxHalfW: 24,
    hitboxHalfZ: 20,
    hitboxHeight: 83,
    scoreValue: 3500,
  },
};

export const SNACK_HEAL: Record<SnackType, { label: string; heal: number }> = {
  sandwich: { label: 'SANDWICH +35', heal: 35 },
  juice: { label: 'JUICE BOX +24', heal: 24 },
  apple: { label: 'APPLE +18', heal: 18 },
};

const STAGE_TITLES: Array<{ title: string; arabic: string }> = [
  { title: 'Al-Baraka Corner', arabic: 'زاوية البقالة' },
  { title: 'Graffiti Alley', arabic: 'زقاق الجرافيتي' },
  { title: 'Parked Cars Block', arabic: 'شارع السيارات' },
  { title: 'Laundry Courtyard', arabic: 'ساحة الحي' },
  { title: 'Anas Showdown', arabic: 'مواجهة أناس' },
  { title: 'School Gate Bell', arabic: 'أمام بوابة المدرسة' },
  { title: 'Dusty Pitch Edge', arabic: 'ملعب التراب' },
  { title: 'Bleacher Brawl', arabic: 'المدرجات' },
  { title: 'Sunset Kickoff', arabic: 'غروب الملعب' },
  { title: 'Saad Bulldozer Clash', arabic: 'صدام سعد' },
  { title: 'Old Quarter Arch', arabic: 'أقواس الحي القديم' },
  { title: 'Lantern Passage', arabic: 'ممر الفوانيس' },
  { title: 'Fountain Courtyard', arabic: 'ساحة النافورة' },
  { title: 'Square Guards', arabic: 'حراس الساحة' },
  { title: 'Mosque Square Finale', arabic: 'معركة براء النهائية' },
];

function buildWavesForStage(stageNum: number): WaveDefinition[] {
  const chapter = stageNum <= 5 ? 1 : stageNum <= 10 ? 2 : 3;
  const isBossStage = stageNum === 5 || stageNum === 10 || stageNum === 15;
  const bossId: BossId | null =
    stageNum === 5 ? 'anas' : stageNum === 10 ? 'saad' : stageNum === 15 ? 'baraa' : null;

  const waveCount = isBossStage ? 3 : 3 + (stageNum % 2);
  const waves: WaveDefinition[] = [];

  for (let w = 0; w < waveCount; w++) {
    const triggerX = 220 + w * 560;
    const isFinalWave = w === waveCount - 1;
    const enemies: WaveDefinition['enemies'] = [];

    if (isFinalWave && bossId) {
      enemies.push({ kind: bossId, offsetX: 390, z: 405 });
      enemies.push({ kind: 'taunter', offsetX: 330, z: 350 });
      if (chapter >= 2) {
        enemies.push({ kind: 'thrower', offsetX: 430, z: 462 });
      }
    } else {
      const baseCount = Math.min(5, 2 + Math.floor((stageNum + w) / 3));
      const pool: EnemyArchetype[] =
        chapter === 1
          ? ['taunter', 'shover', 'thrower']
          : chapter === 2
            ? ['taunter', 'shover', 'grappler', 'thrower']
            : ['shover', 'grappler', 'thrower', 'taunter'];

      for (let i = 0; i < baseCount; i++) {
        const kind = pool[(stageNum + w + i) % pool.length];
        const fromLeft = i >= 3 && i % 2 === 1;
        const offsetX = fromLeft ? -360 - (i - 3) * 55 : 350 + i * 52;
        const z = 340 + ((i * 39 + w * 23) % 130);
        enemies.push({ kind, offsetX, z });
      }
    }

    waves.push({ triggerX, enemies });
  }

  return waves;
}

function buildPropsForStage(
  stageNum: number
): Array<{ type: PropType; x: number; z: number; dropSnack: SnackType | null }> {
  const snacks: SnackType[] = ['sandwich', 'juice', 'apple'];
  return [
    {
      type: stageNum % 2 === 0 ? 'trashcan' : 'crate',
      x: 470,
      z: 355,
      dropSnack: snacks[stageNum % snacks.length],
    },
    {
      type: stageNum % 2 === 0 ? 'crate' : 'trashcan',
      x: 1030,
      z: 458,
      dropSnack: snacks[(stageNum + 1) % snacks.length],
    },
    {
      type: 'crate',
      x: 1560,
      z: 372,
      dropSnack: snacks[(stageNum + 2) % snacks.length],
    },
  ];
}

export const STAGES: StageDefinition[] = Array.from({ length: TOTAL_STAGES }, (_, idx) => {
  const stageNumber = idx + 1;
  const chapter = stageNumber <= 5 ? 1 : stageNumber <= 10 ? 2 : 3;
  const chapterTitle =
    chapter === 1
      ? 'Chapter 1: The Alleyways & Streets'
      : chapter === 2
        ? 'Chapter 2: Schoolyard & Field'
        : 'Chapter 3: The Mosque Square';
  const meta = STAGE_TITLES[idx];
  const bossId: BossId | null =
    stageNumber === 5 ? 'anas' : stageNumber === 10 ? 'saad' : stageNumber === 15 ? 'baraa' : null;
  const waves = buildWavesForStage(stageNumber);
  const lengthX = waves[waves.length - 1].triggerX + 760;

  return {
    stageNumber,
    chapter,
    chapterTitle,
    title: meta.title,
    arabicTitle: meta.arabic,
    lengthX,
    bossId,
    waves,
    props: buildPropsForStage(stageNumber),
  };
});

export const STAGE_CUTSCENES: Record<number, CutsceneLine[]> = {
  1: [
    {
      speaker: 'Ziyad',
      arabicSpeaker: 'زياد',
      portrait: 'ziyad',
      side: 'left',
      text: "Just walking home past Al-Baraka's corner... why are those guys blocking the sidewalk again?",
    },
    {
      speaker: 'Mohamed',
      arabicSpeaker: 'محمد',
      portrait: 'mohamed',
      side: 'left',
      text: "Stay sharp, Ziyad. They're looking for trouble. Stick close—you handle the fast ones, I'll clear the lane.",
    },
    {
      speaker: 'Street Taunter',
      arabicSpeaker: 'المشاكس',
      portrait: 'taunter',
      side: 'right',
      text: "Wrong street to pass through, little guy! Let's see how fast you run!",
    },
  ],
  5: [
    {
      speaker: 'Anas',
      arabicSpeaker: 'أناس',
      portrait: 'anas',
      side: 'right',
      text: "You knocked down half the block? Not bad! Let's see you handle countryside speed!",
    },
    {
      speaker: 'Ziyad',
      arabicSpeaker: 'زياد',
      portrait: 'ziyad',
      side: 'left',
      text: 'Watch his dash feints, Mohamed! He switches lanes fast!',
    },
  ],
  10: [
    {
      speaker: 'Saad',
      arabicSpeaker: 'سعد',
      portrait: 'saad',
      side: 'right',
      text: "Nobody crosses the school field without my say-so! Step up and hit me if you think you can budge me!",
    },
    {
      speaker: 'Mohamed',
      arabicSpeaker: 'محمد',
      portrait: 'mohamed',
      side: 'left',
      text: "He's solid as a brick wall! When he turns red and charges, jump over him and strike from behind!",
    },
  ],
  15: [
    {
      speaker: 'Baraa',
      arabicSpeaker: 'براء - ابن فقيه الجامع',
      portrait: 'baraa',
      side: 'right',
      text: 'You made it all the way to the Mosque Square. Impressive. But wild punches will not break my guard.',
    },
    {
      speaker: 'Ziyad',
      arabicSpeaker: 'زياد',
      portrait: 'ziyad',
      side: 'left',
      text: "Don't spam straight punches—mix kicks, flank him, and watch his counters. Let's end this!",
    },
    {
      speaker: 'Mohamed',
      arabicSpeaker: 'محمد',
      portrait: 'mohamed',
      side: 'left',
      text: 'Time to teach the whole neighborhood some respect. Ready when you are!',
    },
  ],
};
