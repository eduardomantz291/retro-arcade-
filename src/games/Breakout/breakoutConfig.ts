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

export const HEART_DROP_CHANCE = 0.1;
export const HEART_BONUS_POINTS = 50;

export const POWER_UP_RADIUS = 14;
export const POWER_UP_FALL_SPEED = 2.1;

// Drops ruins
export const SKULL_DROP_CHANCE = 0.9;
export const PADDLE_SHRINK_DROP_CHANCE = 0.07;
export const GHOST_DROP_CHANCE = 0.035;

export const PADDLE_SHRINK_AMOUNT = 18;
export const PADDLE_SHRINK_MAX_STACKS = 3;
export const GHOST_PADDLE_DURATION_MS = 3000;

// Escudo
export const SHIELD_POWER_DURATION_MS = 2500;
export const SHIELD_POWER_COOLDOWN_MS = 5000;

export const BRICK_REBUILD_INTERVAL = 26;
export const BRICK_REBUILD_RELEASE_DELAY = 550;

// TNT
export const TNT_EXPLOSION_RADIUS = 92;
export const TNT_BRICK_POINTS = 60;
export const TNT_EXPLOSION_BRICK_POINTS = 35;

// Bomba da bolinha
export const BOMB_DROP_CHANCE = 0.2;
export const BOMB_DROP_COOLDOWN_MS = 30000;
export const BOMB_CHARGES = 2;
export const BOMB_EXPLOSION_RADIUS = 66;
export const BOMB_EXPLOSION_BRICK_POINTS = 25;

// Poder de flecha / mira
export const ARROW_POWER_COOLDOWN_MS = 28000;
export const ARROW_POWER_SHOT_SPEED = 15.5;
export const ARROW_POWER_MAX_HORIZONTAL_FORCE = 13.2;
export const ARROW_POWER_PIERCE_HITS = 9;

// Mira da flecha
export const ARROW_AIM_TOP_PADDING = 42;
export const ARROW_AIM_SIDE_PADDING = 8;

// Poder teleguiado
export const HOMING_POWER_COOLDOWN_MS = 35000;
export const HOMING_POWER_DURATION_MS = 8000;
export const HOMING_POWER_STRENGTH = 0.075;
export const HOMING_POWER_MAX_TURN = 0.36;
export const HOMING_MIN_BALL_SPEED = 6.4;
export const HOMING_END_BOOST_SPEED = 7.2;

// Combo Flecha + Guia
export const HOMING_ARROW_COMBO_STRENGTH = 0.18;
export const HOMING_ARROW_COMBO_MAX_TURN = 0.82;

// Ultimate / Frenesi
export const ULTIMATE_MAX_CHARGE = 100;
export const ULTIMATE_REQUIRED_BRICKS = 120;
export const ULTIMATE_DURATION_MS = 60000;
export const ULTIMATE_FIXED_BALL_SPEED = 8.2;
export const ULTIMATE_GREEN_BRICK_POINTS = 50;
export const ULTIMATE_EXTRA_BALL_POINTS = 35;
export const ULTIMATE_EXTRA_BALL_MAX = 10;

export const brickColors = [
  { color: "#4facfe", glow: "#4facfe" },
  { color: "#38ef7d", glow: "#38ef7d" },
  { color: "#f1c40f", glow: "#f1c40f" },
  { color: "#9b59b6", glow: "#be2edd" },
  { color: "#ff4757", glow: "#ff6b81" },
];