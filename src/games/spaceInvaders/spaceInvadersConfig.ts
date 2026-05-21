// Configurações principais do Space Invaders.
// Aqui ficam os valores fixos do jogo, como tamanho do canvas,
// velocidade, pontuação, poderes, boss e quantidade de inimigos.

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 460;

export const PLAYER_WIDTH = 58;
export const PLAYER_HEIGHT = 28;
export const PLAYER_Y = CANVAS_HEIGHT - 54;
export const PLAYER_SPEED = 7;

export const PLAYER_BULLET_WIDTH = 4;
export const PLAYER_BULLET_HEIGHT = 14;
export const PLAYER_BULLET_SPEED = 8;

export const SUPPORT_BULLET_WIDTH = 4;
export const SUPPORT_BULLET_HEIGHT = 12;
export const SUPPORT_BULLET_SPEED = 7.6;

export const ENEMY_BULLET_WIDTH = 4;
export const ENEMY_BULLET_HEIGHT = 12;
export const ENEMY_BULLET_SPEED = 3.7;

export const INVADER_ROWS = 4;
export const INVADER_COLUMNS = 9;
export const INVADER_WIDTH = 34;
export const INVADER_HEIGHT = 24;
export const INVADER_GAP_X = 20;
export const INVADER_GAP_Y = 18;

export const INVADER_START_X = 56;
export const INVADER_START_Y = 34;

export const INVADER_BASE_SPEED = 0.42;
export const INVADER_SPEED_STEP = 0.1;
export const INVADER_SPEED_CYCLE_LENGTH = 5;
export const INVADER_DROP_DISTANCE = 14;
export const INVADER_SHOOT_CHANCE = 0.008;
export const INVADER_SHOOT_CHANCE_STEP = 0.0025;
export const INVADER_SHOOT_CHANCE_MAX = 0.018;

export const PLAYER_LIVES = 3;
export const PLAYER_MAX_LIVES = 6;

export const POINTS_PER_INVADER = 25;
export const WAVE_CLEAR_BONUS = 150;

// Boss.
// O primeiro boss aparece na onda 5.
export const BOSS_WAVE_INTERVAL = 5;
export const BOSS_WIDTH = 154;
export const BOSS_HEIGHT = 72;
export const BOSS_START_Y = 42;
export const BOSS_MAX_HEALTH = 850;
export const BOSS_MOVE_SPEED = 1.35;
export const BOSS_POINTS = 800;
export const BOSS_BULLET_SPEED = 4.1;
export const BOSS_ATTACK_INTERVAL_MS = 900;
export const BOSS_BURST_INTERVAL_MS = 180;

// Poder Laser.
// O laser fica ativo por pouco tempo, mas destrói tudo dentro da largura dele.
export const LASER_POWER_COOLDOWN_MS = 10000;
export const LASER_POWER_DURATION_MS = 720;
export const LASER_POWER_MAX_WIDTH = 78;
export const LASER_BOSS_DAMAGE_PER_FRAME = 5;

// Poder da nave de suporte.
// Ela entra no campo, acompanha a batalha por alguns segundos e depois some.
export const SUPPORT_SHIP_COOLDOWN_MS = 10000;
export const SUPPORT_SHIP_DURATION_MS = 8000;
export const SUPPORT_SHIP_WIDTH = 36;
export const SUPPORT_SHIP_HEIGHT = 20;
export const SUPPORT_SHIP_SHOOT_INTERVAL_MS = 600;
export const SUPPORT_SHIP_MOVE_INTERVAL_MS = 650;

// Poder Escudo.
// O escudo fica ativo até receber dois ataques.
// Depois de quebrar, entra em recarga.
export const SHIELD_POWER_COOLDOWN_MS = 5000;
export const SHIELD_POWER_MAX_HITS = 2;