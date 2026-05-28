// Funções puras do Space Invaders.
// Este arquivo concentra cálculos pequenos e reutilizáveis para o hook principal
// não ficar carregado com regras de dificuldade, colisão e limites de valores.

import {
  ENEMY_BULLET_SPEED,
  ENEMY_BULLET_SPEED_MAX,
  ENEMY_BULLET_SPEED_MAX_WAVE,
  FINAL_WAVE,
  INVADER_BASE_SPEED,
  INVADER_SHOOT_CHANCE,
  INVADER_SHOOT_CHANCE_MAX,
  INVADER_SHOOT_CHANCE_MAX_WAVE,
  INVADER_SHOOT_CHANCE_STEP,
  INVADER_SPEED_CYCLE_LENGTH,
  INVADER_SPEED_STEP,
  BOSS_WAVE_INTERVAL,
} from "../spaceInvadersConfig";

type RectLike = {
  x: number;
  y: number;
  width: number;
  height: number;
};

// Mantém um número dentro de um intervalo.
export function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

// Colisão retangular simples usada por nave, tiros, inimigos e chefes.
export function isColliding(first: RectLike, second: RectLike) {
  return (
    first.x < second.x + second.width &&
    first.x + first.width > second.x &&
    first.y < second.y + second.height &&
    first.y + first.height > second.y
  );
}

// Reinicia o ciclo de velocidade dos inimigos comuns depois de cada boss.
export function getWaveDifficultyStep(wave: number) {
  return ((wave - 1) % INVADER_SPEED_CYCLE_LENGTH) + 1;
}

export function getCappedDifficultyWave(wave: number, maxWave: number) {
  return clamp(wave, 1, maxWave);
}

export function getInvaderSpeedForWave(wave: number) {
  const difficultyStep = getWaveDifficultyStep(wave);

  return INVADER_BASE_SPEED + (difficultyStep - 1) * INVADER_SPEED_STEP;
}

export function getInvaderShootChanceForWave(wave: number) {
  const difficultyStep = getCappedDifficultyWave(
    wave,
    INVADER_SHOOT_CHANCE_MAX_WAVE
  );
  const nextChance =
    INVADER_SHOOT_CHANCE + (difficultyStep - 1) * INVADER_SHOOT_CHANCE_STEP;

  return Math.min(INVADER_SHOOT_CHANCE_MAX, nextChance);
}

export function getEnemyBulletSpeedForWave(wave: number) {
  const cappedWave = getCappedDifficultyWave(wave, ENEMY_BULLET_SPEED_MAX_WAVE);
  const progress =
    (cappedWave - 1) / Math.max(1, ENEMY_BULLET_SPEED_MAX_WAVE - 1);

  return (
    ENEMY_BULLET_SPEED +
    (ENEMY_BULLET_SPEED_MAX - ENEMY_BULLET_SPEED) * progress
  );
}

export function isBossWave(wave: number) {
  return wave > 0 && wave <= FINAL_WAVE && wave % BOSS_WAVE_INTERVAL === 0;
}
