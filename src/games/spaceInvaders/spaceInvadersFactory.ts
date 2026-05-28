// Fábricas de estado do Space Invaders.
// Criam formações, bosses, poderes inativos e o runtime inicial da partida.

import {
  BOSS_AIM_ERROR_RANGE,
  BOSS_ATTACK_INTERVAL_MS,
  BOSS_ATTACK_REST_TIME_MS,
  BOSS_BULLET_SPEED,
  BOSS_HEIGHT,
  BOSS_MAX_HEALTH,
  BOSS_MOVE_SPEED,
  BOSS_POINTS,
  BOSS_RAIN_BULLET_COUNT,
  BOSS_START_Y,
  BOSS_WAVE_INTERVAL,
  BOSS_WIDTH,
  CANVAS_WIDTH,
  FINAL_BOSS_AIM_ERROR_RANGE,
  FINAL_BOSS_ATTACK_INTERVAL_MS,
  FINAL_BOSS_ATTACK_REST_TIME_MS,
  FINAL_BOSS_BULLET_SPEED,
  FINAL_BOSS_HEIGHT,
  FINAL_BOSS_MAX_HEALTH,
  FINAL_BOSS_MOVE_SPEED,
  FINAL_BOSS_POINTS,
  FINAL_BOSS_RAIN_BULLET_COUNT,
  FINAL_BOSS_START_Y,
  FINAL_BOSS_WIDTH,
  FINAL_WAVE,
  FOURTH_BOSS_AIM_ERROR_RANGE,
  FOURTH_BOSS_ATTACK_INTERVAL_MS,
  FOURTH_BOSS_ATTACK_REST_TIME_MS,
  FOURTH_BOSS_BULLET_SPEED,
  FOURTH_BOSS_HEIGHT,
  FOURTH_BOSS_MAX_HEALTH,
  FOURTH_BOSS_MOVE_SPEED,
  FOURTH_BOSS_POINTS,
  FOURTH_BOSS_RAIN_BULLET_COUNT,
  FOURTH_BOSS_START_Y,
  FOURTH_BOSS_WIDTH,
  INVADER_BASE_SPEED,
  INVADER_COLUMNS,
  INVADER_GAP_X,
  INVADER_GAP_Y,
  INVADER_HEIGHT,
  INVADER_ROWS,
  INVADER_START_X,
  INVADER_START_Y,
  INVADER_WIDTH,
  LASER_POWER_COOLDOWN_MS,
  PLAYER_HEIGHT,
  PLAYER_LIVES,
  PLAYER_WIDTH,
  PLAYER_Y,
  SECOND_BOSS_AIM_ERROR_RANGE,
  SECOND_BOSS_ATTACK_INTERVAL_MS,
  SECOND_BOSS_ATTACK_REST_TIME_MS,
  SECOND_BOSS_BULLET_SPEED,
  SECOND_BOSS_HEIGHT,
  SECOND_BOSS_MAX_HEALTH,
  SECOND_BOSS_MOVE_SPEED,
  SECOND_BOSS_POINTS,
  SECOND_BOSS_RAIN_BULLET_COUNT,
  SECOND_BOSS_START_Y,
  SECOND_BOSS_WIDTH,
  SHIELD_POWER_COOLDOWN_MS,
  SUPPORT_SHIP_COOLDOWN_MS,
  SUPPORT_SHIP_HEIGHT,
  SUPPORT_SHIP_WIDTH,
  SUMMONER_BOSS_AIM_ERROR_RANGE,
  SUMMONER_BOSS_ATTACK_INTERVAL_MS,
  SUMMONER_BOSS_ATTACK_REST_TIME_MS,
  SUMMONER_BOSS_BULLET_SPEED,
  SUMMONER_BOSS_HEIGHT,
  SUMMONER_BOSS_MAX_HEALTH,
  SUMMONER_BOSS_MOVE_SPEED,
  SUMMONER_BOSS_POINTS,
  SUMMONER_BOSS_RAIN_BULLET_COUNT,
  SUMMONER_BOSS_START_Y,
  SUMMONER_BOSS_WIDTH,
  THIRD_BOSS_AIM_ERROR_RANGE,
  THIRD_BOSS_ATTACK_INTERVAL_MS,
  THIRD_BOSS_ATTACK_REST_TIME_MS,
  THIRD_BOSS_BULLET_SPEED,
  THIRD_BOSS_HEIGHT,
  THIRD_BOSS_MAX_HEALTH,
  THIRD_BOSS_MOVE_SPEED,
  THIRD_BOSS_POINTS,
  THIRD_BOSS_RAIN_BULLET_COUNT,
  THIRD_BOSS_START_Y,
  THIRD_BOSS_WIDTH,
} from "./spaceInvadersConfig";
import type {
  Boss,
  BossTier,
  Invader,
  SpaceInvadersRuntime,
  SupportShip,
} from "./spaceInvadersTypes";

type BossStats = {
  name: string;
  tier: BossTier;
  width: number;
  height: number;
  y: number;
  maxHealth: number;
  points: number;
  moveSpeed: number;
  bulletSpeed: number;
  attackIntervalMs: number;
  attackRestTimeMs: number;
  aimErrorRange: number;
  rainBulletCount: number;
};

function getNormalWaveCycleStep(wave: number) {
  return ((wave - 1) % BOSS_WAVE_INTERVAL) + 1;
}

function getBossStatsForWave(wave: number): BossStats {
  if (wave >= FINAL_WAVE) {
    return {
      name: "Nucleo Omega",
      tier: "omega",
      width: FINAL_BOSS_WIDTH,
      height: FINAL_BOSS_HEIGHT,
      y: FINAL_BOSS_START_Y,
      maxHealth: FINAL_BOSS_MAX_HEALTH,
      points: FINAL_BOSS_POINTS,
      moveSpeed: FINAL_BOSS_MOVE_SPEED,
      bulletSpeed: FINAL_BOSS_BULLET_SPEED,
      attackIntervalMs: FINAL_BOSS_ATTACK_INTERVAL_MS,
      attackRestTimeMs: FINAL_BOSS_ATTACK_REST_TIME_MS,
      aimErrorRange: FINAL_BOSS_AIM_ERROR_RANGE,
      rainBulletCount: FINAL_BOSS_RAIN_BULLET_COUNT,
    };
  }

  if (wave >= 25) {
    return {
      name: "Regente do Enxame",
      tier: "summoner",
      width: SUMMONER_BOSS_WIDTH,
      height: SUMMONER_BOSS_HEIGHT,
      y: SUMMONER_BOSS_START_Y,
      maxHealth: SUMMONER_BOSS_MAX_HEALTH,
      points: SUMMONER_BOSS_POINTS,
      moveSpeed: SUMMONER_BOSS_MOVE_SPEED,
      bulletSpeed: SUMMONER_BOSS_BULLET_SPEED,
      attackIntervalMs: SUMMONER_BOSS_ATTACK_INTERVAL_MS,
      attackRestTimeMs: SUMMONER_BOSS_ATTACK_REST_TIME_MS,
      aimErrorRange: SUMMONER_BOSS_AIM_ERROR_RANGE,
      rainBulletCount: SUMMONER_BOSS_RAIN_BULLET_COUNT,
    };
  }

  if (wave >= 20) {
    return {
      name: "Forja Estelar",
      tier: "forge",
      width: FOURTH_BOSS_WIDTH,
      height: FOURTH_BOSS_HEIGHT,
      y: FOURTH_BOSS_START_Y,
      maxHealth: FOURTH_BOSS_MAX_HEALTH,
      points: FOURTH_BOSS_POINTS,
      moveSpeed: FOURTH_BOSS_MOVE_SPEED,
      bulletSpeed: FOURTH_BOSS_BULLET_SPEED,
      attackIntervalMs: FOURTH_BOSS_ATTACK_INTERVAL_MS,
      attackRestTimeMs: FOURTH_BOSS_ATTACK_REST_TIME_MS,
      aimErrorRange: FOURTH_BOSS_AIM_ERROR_RANGE,
      rainBulletCount: FOURTH_BOSS_RAIN_BULLET_COUNT,
    };
  }

  if (wave >= 15) {
    return {
      name: "Serafim Quasar",
      tier: "quasar",
      width: THIRD_BOSS_WIDTH,
      height: THIRD_BOSS_HEIGHT,
      y: THIRD_BOSS_START_Y,
      maxHealth: THIRD_BOSS_MAX_HEALTH,
      points: THIRD_BOSS_POINTS,
      moveSpeed: THIRD_BOSS_MOVE_SPEED,
      bulletSpeed: THIRD_BOSS_BULLET_SPEED,
      attackIntervalMs: THIRD_BOSS_ATTACK_INTERVAL_MS,
      attackRestTimeMs: THIRD_BOSS_ATTACK_REST_TIME_MS,
      aimErrorRange: THIRD_BOSS_AIM_ERROR_RANGE,
      rainBulletCount: THIRD_BOSS_RAIN_BULLET_COUNT,
    };
  }

  if (wave > 0 && wave % 10 === 0) {
    return {
      name: "Arconte Prisma",
      tier: "overlord",
      width: SECOND_BOSS_WIDTH,
      height: SECOND_BOSS_HEIGHT,
      y: SECOND_BOSS_START_Y,
      maxHealth: SECOND_BOSS_MAX_HEALTH,
      points: SECOND_BOSS_POINTS,
      moveSpeed: SECOND_BOSS_MOVE_SPEED,
      bulletSpeed: SECOND_BOSS_BULLET_SPEED,
      attackIntervalMs: SECOND_BOSS_ATTACK_INTERVAL_MS,
      attackRestTimeMs: SECOND_BOSS_ATTACK_REST_TIME_MS,
      aimErrorRange: SECOND_BOSS_AIM_ERROR_RANGE,
      rainBulletCount: SECOND_BOSS_RAIN_BULLET_COUNT,
    };
  }

  return {
    name: "Nebulume Slime",
    tier: "scout",
    width: BOSS_WIDTH,
    height: BOSS_HEIGHT,
    y: BOSS_START_Y,
    maxHealth: BOSS_MAX_HEALTH,
    points: BOSS_POINTS,
    moveSpeed: BOSS_MOVE_SPEED,
    bulletSpeed: BOSS_BULLET_SPEED,
    attackIntervalMs: BOSS_ATTACK_INTERVAL_MS,
    attackRestTimeMs: BOSS_ATTACK_REST_TIME_MS,
    aimErrorRange: BOSS_AIM_ERROR_RANGE,
    rainBulletCount: BOSS_RAIN_BULLET_COUNT,
  };
}

function getInvaderVisualByRow(row: number) {
  // Fileiras de cima ficam mais especiais visualmente.
  // Topo roxo, meio amarelo, parte de baixo verde.
  if (row === 0) {
    return {
      color: "#be2edd",
      glow: "#e056fd",
    };
  }

  if (row === 1) {
    return {
      color: "#f1c40f",
      glow: "#f9ca24",
    };
  }

  return {
    color: "#38ef7d",
    glow: "#26de81",
  };
}

// Cria a formação inicial dos inimigos comuns.
export function createInvaders(wave = 1): Invader[] {
  const invaders: Invader[] = [];
  let id = 0;
  const cycleStep = getNormalWaveCycleStep(wave);

  for (let row = 0; row < INVADER_ROWS; row++) {
    for (let column = 0; column < INVADER_COLUMNS; column++) {
      id += 1;

      const variant =
        row % 3 === 0 ? "square" : row % 3 === 1 ? "circle" : "triangle";

      const visual = getInvaderVisualByRow(row);

      invaders.push({
        id,
        row,
        x: INVADER_START_X + column * (INVADER_WIDTH + INVADER_GAP_X),
        y: INVADER_START_Y + row * (INVADER_HEIGHT + INVADER_GAP_Y),
        width: INVADER_WIDTH,
        height: INVADER_HEIGHT,
        active: true,
        variant,
        color: visual.color,
        glow: visual.glow,
      });
    }
  }

  return invaders.map((invader) => ({
    ...invader,
    y: invader.y + Math.min(cycleStep - 1, 4) * 6,
  }));
}

export function createBoss(wave = BOSS_WAVE_INTERVAL): Boss {
  const stats = getBossStatsForWave(wave);
  const now = performance.now();

  return {
    active: true,
    defeated: false,
    wave,
    name: stats.name,
    tier: stats.tier,
    x: CANVAS_WIDTH / 2 - stats.width / 2,
    y: stats.y,
    width: stats.width,
    height: stats.height,
    health: stats.maxHealth,
    maxHealth: stats.maxHealth,
    points: stats.points,
    moveSpeed: stats.moveSpeed,
    bulletSpeed: stats.bulletSpeed,
    attackIntervalMs: stats.attackIntervalMs,
    attackRestTimeMs: stats.attackRestTimeMs,
    aimErrorRange: stats.aimErrorRange,
    rainBulletCount: stats.rainBulletCount,
    direction: 1,
    spawnedAt: now,
    nextAttackAt: now + 900,
    burstShotsLeft: 0,
    nextBurstShotAt: 0,
    shieldActive: false,
    shieldHitsLeft: 0,
    shieldLastActivatedAt: 0,
    shieldNextShotAt: 0,
    shieldAvailableAt: stats.tier === "forge" ? now + 5000 : 0,
    summonNextAt: 0,
    summonAttackerNextAt: 0,
    summonGuardianNextAt: 0,
    summonHealerNextAt: 0,
  };
}

export function createInactiveBoss(): Boss {
  const stats = getBossStatsForWave(BOSS_WAVE_INTERVAL);

  return {
    active: false,
    defeated: false,
    wave: 0,
    name: stats.name,
    tier: stats.tier,
    x: CANVAS_WIDTH / 2 - stats.width / 2,
    y: stats.y,
    width: stats.width,
    height: stats.height,
    health: stats.maxHealth,
    maxHealth: stats.maxHealth,
    points: stats.points,
    moveSpeed: stats.moveSpeed,
    bulletSpeed: stats.bulletSpeed,
    attackIntervalMs: stats.attackIntervalMs,
    attackRestTimeMs: stats.attackRestTimeMs,
    aimErrorRange: stats.aimErrorRange,
    rainBulletCount: stats.rainBulletCount,
    direction: 1,
    spawnedAt: 0,
    nextAttackAt: 0,
    burstShotsLeft: 0,
    nextBurstShotAt: 0,
    shieldActive: false,
    shieldHitsLeft: 0,
    shieldLastActivatedAt: 0,
    shieldNextShotAt: 0,
    shieldAvailableAt: 0,
    summonNextAt: 0,
    summonAttackerNextAt: 0,
    summonGuardianNextAt: 0,
    summonHealerNextAt: 0,
  };
}

function createInactiveSupportShip(): SupportShip {
  return {
    active: false,
    x: CANVAS_WIDTH / 2 - SUPPORT_SHIP_WIDTH / 2,
    y: PLAYER_Y + 36,
    targetX: CANVAS_WIDTH / 2 - SUPPORT_SHIP_WIDTH / 2,
    width: SUPPORT_SHIP_WIDTH,
    height: SUPPORT_SHIP_HEIGHT,
    spawnedAt: 0,
    expiresAt: 0,
    nextMoveAt: 0,
    nextShotAt: 0,
  };
}

// Cria o estado inicial completo da partida.
export function createInitialSpaceInvadersRuntime(): SpaceInvadersRuntime {
  return {
    player: {
      x: CANVAS_WIDTH / 2 - PLAYER_WIDTH / 2,
      y: PLAYER_Y,
      width: PLAYER_WIDTH,
      height: PLAYER_HEIGHT,
      targetX: CANVAS_WIDTH / 2 - PLAYER_WIDTH / 2,
    },

    invaders: createInvaders(1),
    boss: createInactiveBoss(),
    playerBullets: [],
    enemyBullets: [],
    particles: [],

    score: 0,
    lives: PLAYER_LIVES,
    wave: 1,

    invaderDirection: 1,
    invaderSpeed: INVADER_BASE_SPEED,

    keys: {
      left: false,
      right: false,
      shooting: false,
    },

    laserPower: {
      active: false,
      activatedAt: 0,
      lastUsedAt: -LASER_POWER_COOLDOWN_MS,
      x: CANVAS_WIDTH / 2,
      lastBossDamageAt: 0,
    },

    supportPower: {
      lastUsedAt: -SUPPORT_SHIP_COOLDOWN_MS,
      ship: createInactiveSupportShip(),
    },

    shieldPower: {
      active: false,
      activatedAt: 0,
      lastBrokenAt: -SHIELD_POWER_COOLDOWN_MS,
      hitsTaken: 0,
      breaking: false,
      brokenAt: 0,
    },

    lastPlayerShotAt: 0,
    shake: 0,
  };
}
