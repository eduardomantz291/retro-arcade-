export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 420;

export const PADDLE_WIDTH = 112;
export const PADDLE_HEIGHT = 14;

export const BALL_RADIUS = 7;

export const BRICK_ROWS = 5;
export const BRICK_COLUMNS = 9;
export const BRICK_GAP = 8;
export const BRICK_TOP = 72;
export const BRICK_SIDE = 24;
export const BRICK_HEIGHT = 22;

export const INITIAL_LIVES = 3;
export const MAX_LIVES = 6;

// Chance do coração aparecer quando um bloco é destruído.
// 0.14 = 14%. Dá para ajustar depois se ficar fácil ou difícil demais.
export const HEART_DROP_CHANCE = 0.14;

// Se o jogador pegar um coração já estando com vida máxima,
// ele recebe pontos bônus.
export const HEART_BONUS_POINTS = 50;

export const POWER_UP_RADIUS = 14;
export const POWER_UP_FALL_SPEED = 2.1;

export const brickColors = [
  { color: "#4facfe", glow: "#4facfe" },
  { color: "#38ef7d", glow: "#38ef7d" },
  { color: "#f1c40f", glow: "#f1c40f" },
  { color: "#9b59b6", glow: "#be2edd" },
  { color: "#ff4757", glow: "#ff6b81" },
];