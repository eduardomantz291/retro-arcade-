import type { Fruit, Fruits, GameRuntime } from "./snakeTypes";

export function createFruits(): Fruits {
  return {
    normal: {
      active: false,
      x: 0,
      y: 0,
      radius: 6,
      color: "#ff4757",
      glow: "#ff6b81",
      glowSize: 15,
      points: 10,
    },
    golden: {
      active: false,
      x: 0,
      y: 0,
      radius: 9,
      color: "#f1c40f",
      glow: "#f9ca24",
      glowSize: 25,
      points: 50,
    },
    purple: {
      active: false,
      x: 0,
      y: 0,
      radius: 11,
      color: "#9b59b6",
      glow: "#be2edd",
      glowSize: 30,
      points: 100,
    },
    hybrid: {
      active: false,
      x: 0,
      y: 0,
      radius: 10,
      color: "#9b59b6",
      glow: "#e056fd",
      glowSize: 25,
      points: 75,
      colorStart: "#9b59b6",
      colorEnd: "#f1c40f",
    },
    wanderingGreen: {
      active: false,
      x: 0,
      y: 0,
      radius: 12,
      color: "#2ecc71",
      glow: "#26de81",
      glowSize: 35,
      points: 250,
    },
  };
}

export function createBlackFruit(x: number, y: number): Fruit {
  return {
    active: true,
    x,
    y,
    radius: 7,
    color: "#2f3542",
    glow: "#000000",
    glowSize: 10,
    points: -20,
  };
}

export function createInitialRuntime(): GameRuntime {
  return {
    snake: [
      { x: 200, y: 200 },
      { x: 180, y: 200 },
      { x: 160, y: 200 },
    ],
    dx: 20,
    dy: 0,
    score: 0,

    invincible: false,
    invincibleTime: 0,

    magnetActive: false,
    magnetTime: 0,

    frenzyActive: false,
    frenzyTime: 0,

    particles: [],
    backgroundParticles: [],
    shakeIntensity: 0,

    greenMoveTimer: 0,
    extraFruits: [],

    fruits: createFruits(),
    blackFruits: [],
  };
}