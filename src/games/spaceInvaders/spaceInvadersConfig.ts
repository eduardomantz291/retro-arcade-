// Configurações principais do Space Invaders.
// Aqui ficam os valores fixos do jogo, como tamanho do canvas,
// velocidade, pontuação e quantidade de inimigos.

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 420;

export const PLAYER_WIDTH = 52;
export const PLAYER_HEIGHT = 24;
export const PLAYER_Y = CANVAS_HEIGHT - 48;
export const PLAYER_SPEED = 7;

export const PLAYER_BULLET_WIDTH = 4;
export const PLAYER_BULLET_HEIGHT = 14;
export const PLAYER_BULLET_SPEED = 8;

export const ENEMY_BULLET_WIDTH = 4;
export const ENEMY_BULLET_HEIGHT = 12;
export const ENEMY_BULLET_SPEED = 4.2;

export const INVADER_ROWS = 4;
export const INVADER_COLUMNS = 9;
export const INVADER_WIDTH = 34;
export const INVADER_HEIGHT = 24;
export const INVADER_GAP_X = 20;
export const INVADER_GAP_Y = 18;
export const INVADER_START_X = 56;
export const INVADER_START_Y = 62;

export const INVADER_BASE_SPEED = 0.85;
export const INVADER_DROP_DISTANCE = 20;
export const INVADER_SHOOT_CHANCE = 0.012;

export const PLAYER_LIVES = 3;

export const POINTS_PER_INVADER = 25;
export const WAVE_CLEAR_BONUS = 150;