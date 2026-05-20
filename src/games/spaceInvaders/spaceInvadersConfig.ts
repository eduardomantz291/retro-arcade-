// Configurações principais do Space Invaders.
// Aqui ficam os valores fixos do jogo, como tamanho do canvas,
// velocidade, pontuação e quantidade de inimigos.

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
export const INVADER_DROP_DISTANCE = 14;
export const INVADER_SHOOT_CHANCE = 0.008;

export const PLAYER_LIVES = 3;

export const POINTS_PER_INVADER = 25;
export const WAVE_CLEAR_BONUS = 150;

// Poder Laser.
// O laser fica ativo por pouco tempo, mas destrói tudo dentro da largura dele.
export const LASER_POWER_COOLDOWN_MS = 10000;
export const LASER_POWER_DURATION_MS = 720;
export const LASER_POWER_MAX_WIDTH = 78;

// Poder da nave de suporte.
// Ela entra no campo, acompanha a batalha por alguns segundos e depois some.
export const SUPPORT_SHIP_COOLDOWN_MS = 10000;
export const SUPPORT_SHIP_DURATION_MS = 8000;
export const SUPPORT_SHIP_WIDTH = 36;
export const SUPPORT_SHIP_HEIGHT = 20;
export const SUPPORT_SHIP_SHOOT_INTERVAL_MS = 500;
export const SUPPORT_SHIP_MOVE_INTERVAL_MS = 650;