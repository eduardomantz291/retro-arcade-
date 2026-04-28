import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { useAuth } from "../../contexts/AuthContext";
import "./snake-game-style.css";

type Point = {
  x: number;
  y: number;
};

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
};

type BackgroundParticle = {
  x: number;
  y: number;
  vy: number;
  radius: number;
  opacity: number;
};

type Fruit = {
  active: boolean;
  x: number;
  y: number;
  radius: number;
  color: string;
  glow: string;
  glowSize: number;
  points: number;
  colorStart?: string;
  colorEnd?: string;
};

type Fruits = {
  normal: Fruit;
  golden: Fruit;
  purple: Fruit;
  black: Fruit;
  hybrid: Fruit;
  wanderingGreen: Fruit;
};

type GameRuntime = {
  snake: Point[];
  dx: number;
  dy: number;
  score: number;
  invincible: boolean;
  invincibleTime: number;
  magnetActive: boolean;
  magnetTime: number;
  frenzyActive: boolean;
  frenzyTime: number;
  particles: Particle[];
  backgroundParticles: BackgroundParticle[];
  shakeIntensity: number;
  greenMoveTimer: number;
  extraFruits: Fruit[];
  fruits: Fruits;
};

const CANVAS_SIZE = 400;
const TILE_SIZE = 20;
const HALF_TILE = TILE_SIZE / 2;

const MAX_GOLDEN_TIME = 60;
const MAX_MAGNET_TIME = 80;
const TICK_SPEED = 120;

const HIGH_SCORE_KEY = "snakeHighScorePremium";

function createFruits(): Fruits {
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
    black: {
      active: false,
      x: 0,
      y: 0,
      radius: 7,
      color: "#2f3542",
      glow: "#000000",
      glowSize: 10,
      points: -20,
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

function createInitialRuntime(): GameRuntime {
  return {
    snake: [
      { x: 200, y: 200 },
      { x: 180, y: 200 },
      { x: 160, y: 200 },
    ],
    dx: TILE_SIZE,
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
  };
}

function gridRandom() {
  return Math.floor(Math.random() * (CANVAS_SIZE / TILE_SIZE)) * TILE_SIZE;
}

function SnakeGamePage() {
  const { isAuthenticated, isGuest } = useAuth();

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const runtimeRef = useRef<GameRuntime>(createInitialRuntime());

  const animationFrameRef = useRef<number | null>(null);
  const gameLoopTimerRef = useRef<number | null>(null);
  const countdownTimerRef = useRef<number | null>(null);

  const touchStartXRef = useRef(0);
  const touchStartYRef = useRef(0);

  const musicRef = useRef<HTMLAudioElement | null>(null);
  const soundEffectsRef = useRef<Record<string, HTMLAudioElement>>({});

  const [screenState, setScreenState] = useState<
    "start" | "countdown" | "playing" | "game-over"
  >("start");

  const [countdownText, setCountdownText] = useState("3");
  const [score, setScore] = useState(0);
  const [finalScore, setFinalScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    return Number(localStorage.getItem(HIGH_SCORE_KEY)) || 0;
  });

  const [goldenPercent, setGoldenPercent] = useState(0);
  const [magnetPercent, setMagnetPercent] = useState(0);

  const [showGuestWarning, setShowGuestWarning] = useState(isGuest);
  const [guestWarningAccepted, setGuestWarningAccepted] = useState(false);
  const [showLoginWarning, setShowLoginWarning] = useState(
    !isAuthenticated && !isGuest
  );

  useEffect(() => {
    // Carregamos os áudios uma vez quando a página do jogo abre.
    soundEffectsRef.current = {
      eat: new Audio("/audio/comer.wav"),
      damage: new Audio("/audio/dano.wav"),
      power: new Audio("/audio/poder.wav"),
      frenzy: new Audio("/audio/verde.wav"),
      death: new Audio("/audio/morte.wav"),
    };

    musicRef.current = new Audio("/audio/musica-tema.mp3");
    musicRef.current.volume = 0.3;
    musicRef.current.loop = true;
  }, []);

  useEffect(() => {
    // Se o usuário estiver como visitante, mostramos o aviso de progresso.
    if (isGuest && !guestWarningAccepted) {
      setShowGuestWarning(true);
    }

    if (!isAuthenticated && !isGuest) {
      setShowLoginWarning(true);
    }
  }, [isAuthenticated, isGuest, guestWarningAccepted]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      changeDirection(event.key);
    }

    function handleTouchStart(event: TouchEvent) {
      touchStartXRef.current = event.changedTouches[0].screenX;
      touchStartYRef.current = event.changedTouches[0].screenY;
    }

    function handleTouchEnd(event: TouchEvent) {
      const touchEndX = event.changedTouches[0].screenX;
      const touchEndY = event.changedTouches[0].screenY;

      calculateSwipe(
        touchStartXRef.current,
        touchStartYRef.current,
        touchEndX,
        touchEndY
      );
    }

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("touchstart", handleTouchStart, { passive: true });
    document.addEventListener("touchend", handleTouchEnd);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchend", handleTouchEnd);

      stopGameTimers();
      stopMusic();
    };
  }, []);

  function playEffect(soundName: string) {
    const sound = soundEffectsRef.current[soundName];

    if (!sound) {
      return;
    }

    // Clonamos o áudio para permitir sons rápidos em sequência.
    const soundClone = sound.cloneNode() as HTMLAudioElement;
    soundClone.volume = sound.volume;
    soundClone.play().catch(() => undefined);
  }

  function startMusic() {
    musicRef.current?.play().catch(() => undefined);
  }

  function stopMusic() {
    if (!musicRef.current) {
      return;
    }

    musicRef.current.pause();
    musicRef.current.currentTime = 0;
  }

  function stopGameTimers() {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    if (gameLoopTimerRef.current) {
      window.clearTimeout(gameLoopTimerRef.current);
    }

    if (countdownTimerRef.current) {
      window.clearInterval(countdownTimerRef.current);
    }
  }

  function spawnNormalFruit(runtime: GameRuntime) {
    const { fruits } = runtime;

    fruits.normal.active = true;
    fruits.normal.x = gridRandom();
    fruits.normal.y = gridRandom();

    const chance = Math.random();

    fruits.golden.active = false;
    fruits.purple.active = false;
    fruits.hybrid.active = false;
    fruits.wanderingGreen.active = false;

    if (runtime.score >= 150 && chance >= 0 && chance < 0.1) {
      fruits.golden.active = true;
      fruits.golden.x = gridRandom();
      fruits.golden.y = gridRandom();
    } else if (chance >= 0.1 && chance < 0.15) {
      fruits.purple.active = true;
      fruits.purple.x = gridRandom();
      fruits.purple.y = gridRandom();
    } else if (runtime.score >= 300 && chance >= 0.15 && chance < 0.2) {
      fruits.hybrid.active = true;
      fruits.hybrid.x = gridRandom();
      fruits.hybrid.y = gridRandom();
    } else if (chance >= 0.2 && chance < 0.25) {
      fruits.wanderingGreen.active = true;
      fruits.wanderingGreen.x = gridRandom();
      fruits.wanderingGreen.y = gridRandom();
      runtime.greenMoveTimer = 0;
    }

    if (Math.random() < 0.15) {
      fruits.black.active = true;
      fruits.black.x = gridRandom();
      fruits.black.y = gridRandom();
    }
  }

  function resetGame() {
    const runtime = createInitialRuntime();
    spawnNormalFruit(runtime);

    runtimeRef.current = runtime;

    setScore(0);
    setFinalScore(0);
    setGoldenPercent(0);
    setMagnetPercent(0);
  }

  function createExplosion(x: number, y: number, color: string) {
    const runtime = runtimeRef.current;

    for (let index = 0; index < 12; index++) {
      runtime.particles.push({
        x: x + HALF_TILE,
        y: y + HALF_TILE,
        vx: (Math.random() - 0.5) * 6,
        vy: (Math.random() - 0.5) * 6,
        life: 1,
        color,
      });
    }
  }

  function applyScreenShake(intensity: number) {
    runtimeRef.current.shakeIntensity = intensity;
  }

  function updateScore(points: number) {
    const runtime = runtimeRef.current;

    runtime.score = Math.max(0, runtime.score + points);
    setScore(runtime.score);
  }

  function checkFruitCollision(x: number, y: number, fruit: Fruit) {
    if (!fruit.active) {
      return false;
    }

    const distance = Math.hypot(
      x + HALF_TILE - (fruit.x + HALF_TILE),
      y + HALF_TILE - (fruit.y + HALF_TILE)
    );

    return distance < HALF_TILE + fruit.radius - 2;
  }

  function checkCollisionWithWholeSnake(fruit: Fruit) {
    const runtime = runtimeRef.current;

    if (!fruit.active) {
      return false;
    }

    return runtime.snake.some((piece) =>
      checkFruitCollision(piece.x, piece.y, fruit)
    );
  }

  function isGameOver() {
    const runtime = runtimeRef.current;
    const head = runtime.snake[0];

    if (runtime.invincible) {
      return false;
    }

    if (
      head.x < 0 ||
      head.x >= CANVAS_SIZE ||
      head.y < 0 ||
      head.y >= CANVAS_SIZE
    ) {
      return true;
    }

    for (let index = 4; index < runtime.snake.length; index++) {
      if (runtime.snake[index].x === head.x && runtime.snake[index].y === head.y) {
        return true;
      }
    }

    return false;
  }

  function showGameOver() {
    const runtime = runtimeRef.current;

    stopMusic();
    playEffect("death");
    applyScreenShake(15);

    setFinalScore(runtime.score);
    setScreenState("game-over");

    if (isAuthenticated && runtime.score > highScore) {
      localStorage.setItem(HIGH_SCORE_KEY, String(runtime.score));
      setHighScore(runtime.score);
    }

    stopGameTimers();
  }

  function moveWanderingGreenFruit() {
    const runtime = runtimeRef.current;
    const greenFruit = runtime.fruits.wanderingGreen;

    if (!greenFruit.active) {
      return;
    }

    runtime.greenMoveTimer++;

    if (runtime.greenMoveTimer < 3) {
      return;
    }

    runtime.greenMoveTimer = 0;

    const directions = [
      { x: TILE_SIZE, y: 0 },
      { x: -TILE_SIZE, y: 0 },
      { x: 0, y: TILE_SIZE },
      { x: 0, y: -TILE_SIZE },
    ].sort(() => Math.random() - 0.5);

    for (const direction of directions) {
      const nextX = greenFruit.x + direction.x;
      const nextY = greenFruit.y + direction.y;

      if (
        nextX < 0 ||
        nextX >= CANVAS_SIZE ||
        nextY < 0 ||
        nextY >= CANVAS_SIZE
      ) {
        continue;
      }

      const isSnakePosition = runtime.snake.some(
        (piece) => piece.x === nextX && piece.y === nextY
      );

      if (!isSnakePosition) {
        greenFruit.x = nextX;
        greenFruit.y = nextY;
        break;
      }
    }
  }

  function moveSnake() {
    const runtime = runtimeRef.current;
    const { fruits } = runtime;

    let nextX = runtime.snake[0].x + runtime.dx;
    let nextY = runtime.snake[0].y + runtime.dy;

    if (runtime.invincible) {
      if (nextX < 0) nextX = CANVAS_SIZE - TILE_SIZE;
      if (nextX >= CANVAS_SIZE) nextX = 0;
      if (nextY < 0) nextY = CANVAS_SIZE - TILE_SIZE;
      if (nextY >= CANVAS_SIZE) nextY = 0;
    }

    const newHead = { x: nextX, y: nextY };
    runtime.snake.unshift(newHead);

    let ateSomething = false;

    if (checkFruitCollision(nextX, nextY, fruits.black)) {
      updateScore(fruits.black.points);
      createExplosion(fruits.black.x, fruits.black.y, fruits.black.glow);
      applyScreenShake(8);
      playEffect("damage");

      fruits.black.active = false;

      runtime.snake.pop();
      runtime.snake.pop();
      runtime.snake.pop();

      ateSomething = true;

      if (runtime.snake.length < 3) {
        showGameOver();
        return;
      }
    }

    const ateNormal = runtime.magnetActive
      ? checkCollisionWithWholeSnake(fruits.normal)
      : checkFruitCollision(nextX, nextY, fruits.normal);

    if (ateNormal) {
      updateScore(fruits.normal.points);
      createExplosion(fruits.normal.x, fruits.normal.y, fruits.normal.color);
      applyScreenShake(2);
      playEffect("eat");

      fruits.normal.active = false;
      spawnNormalFruit(runtime);

      ateSomething = true;
    }

    for (let index = runtime.extraFruits.length - 1; index >= 0; index--) {
      const extraFruit = runtime.extraFruits[index];
      extraFruit.active = true;

      const ateExtra = runtime.magnetActive
        ? checkCollisionWithWholeSnake(extraFruit)
        : checkFruitCollision(nextX, nextY, extraFruit);

      if (ateExtra) {
        updateScore(extraFruit.points);
        createExplosion(extraFruit.x, extraFruit.y, extraFruit.color);
        applyScreenShake(2);
        playEffect("eat");

        runtime.extraFruits.splice(index, 1);
        ateSomething = true;
      }
    }

    if (checkFruitCollision(nextX, nextY, fruits.golden)) {
      updateScore(fruits.golden.points);
      createExplosion(fruits.golden.x, fruits.golden.y, fruits.golden.color);
      applyScreenShake(4);
      playEffect("power");

      runtime.invincible = true;
      runtime.invincibleTime = MAX_GOLDEN_TIME;

      runtime.magnetActive = false;
      runtime.magnetTime = 0;

      runtime.frenzyActive = false;
      runtime.frenzyTime = 0;

      fruits.golden.active = false;
      ateSomething = true;
    }

    if (checkFruitCollision(nextX, nextY, fruits.purple)) {
      updateScore(fruits.purple.points);
      createExplosion(fruits.purple.x, fruits.purple.y, fruits.purple.color);
      applyScreenShake(5);
      playEffect("power");

      runtime.magnetActive = true;
      runtime.magnetTime = MAX_MAGNET_TIME;

      runtime.invincible = false;
      runtime.invincibleTime = 0;

      runtime.frenzyActive = false;
      runtime.frenzyTime = 0;

      fruits.purple.active = false;
      ateSomething = true;
    }

    if (checkFruitCollision(nextX, nextY, fruits.hybrid)) {
      updateScore(fruits.hybrid.points);
      createExplosion(fruits.hybrid.x, fruits.hybrid.y, fruits.hybrid.glow);
      applyScreenShake(6);
      playEffect("power");

      runtime.frenzyActive = false;
      runtime.frenzyTime = 0;

      if (Math.random() < 0.5) {
        runtime.invincible = true;
        runtime.invincibleTime = MAX_GOLDEN_TIME;

        runtime.magnetActive = false;
        runtime.magnetTime = 0;
      } else {
        runtime.magnetActive = true;
        runtime.magnetTime = MAX_MAGNET_TIME;

        runtime.invincible = false;
        runtime.invincibleTime = 0;
      }

      fruits.hybrid.active = false;
      ateSomething = true;
    }

    if (checkFruitCollision(nextX, nextY, fruits.wanderingGreen)) {
      updateScore(fruits.wanderingGreen.points);
      createExplosion(
        fruits.wanderingGreen.x,
        fruits.wanderingGreen.y,
        fruits.wanderingGreen.color
      );
      applyScreenShake(10);
      playEffect("frenzy");

      runtime.invincible = true;
      runtime.invincibleTime = Math.max(MAX_GOLDEN_TIME, MAX_MAGNET_TIME);

      runtime.magnetActive = true;
      runtime.magnetTime = Math.max(MAX_GOLDEN_TIME, MAX_MAGNET_TIME);

      runtime.frenzyActive = true;
      runtime.frenzyTime = Math.max(MAX_GOLDEN_TIME, MAX_MAGNET_TIME);

      for (let index = 0; index < 7; index++) {
        runtime.extraFruits.push({
          active: true,
          x: gridRandom(),
          y: gridRandom(),
          radius: 6,
          color: "#ff4757",
          glow: "#ff6b81",
          glowSize: 15,
          points: 10,
        });
      }

      fruits.wanderingGreen.active = false;
      ateSomething = true;
    }

    if (!ateSomething) {
      runtime.snake.pop();
    }

    if (runtime.invincible) {
      runtime.invincibleTime--;

      if (runtime.invincibleTime <= 0) {
        runtime.invincible = false;
      }
    }

    if (runtime.magnetActive) {
      runtime.magnetTime--;

      if (runtime.magnetTime <= 0) {
        runtime.magnetActive = false;
      }
    }

    if (runtime.frenzyActive) {
      runtime.frenzyTime--;

      if (runtime.frenzyTime <= 0) {
        runtime.frenzyActive = false;
      }
    }

    setGoldenPercent(
      runtime.invincible
        ? (runtime.invincibleTime / MAX_GOLDEN_TIME) * 100
        : 0
    );

    setMagnetPercent(
      runtime.magnetActive ? (runtime.magnetTime / MAX_MAGNET_TIME) * 100 : 0
    );
  }

  function gameLoop() {
    if (screenState !== "playing") {
      return;
    }

    moveWanderingGreenFruit();

    if (isGameOver()) {
      showGameOver();
      return;
    }

    moveSnake();

    gameLoopTimerRef.current = window.setTimeout(gameLoop, TICK_SPEED);
  }

  function applyMagnetPhysics() {
    const runtime = runtimeRef.current;

    if (!runtime.magnetActive) {
      return;
    }

    const head = runtime.snake[0];

    function pullFruit(fruit: Fruit, speed: number) {
      if (!fruit.active) {
        return;
      }

      const distance = Math.hypot(head.x - fruit.x, head.y - fruit.y);

      if (distance > 0 && distance < 180) {
        fruit.x += ((head.x - fruit.x) / distance) * speed;
        fruit.y += ((head.y - fruit.y) / distance) * speed;
      }
    }

    pullFruit(runtime.fruits.normal, 4);
    pullFruit(runtime.fruits.wanderingGreen, 2);

    runtime.extraFruits.forEach((extraFruit) => {
      pullFruit(extraFruit, 4);
    });
  }

  function drawCircle(ctx: CanvasRenderingContext2D, fruit: Fruit) {
    const oscillator = Math.sin(Date.now() / 150);

    ctx.shadowBlur = fruit.glowSize + oscillator * 5;
    ctx.shadowColor = fruit.glow;

    if (fruit.colorStart && fruit.colorEnd) {
      const gradient = ctx.createLinearGradient(
        fruit.x,
        fruit.y,
        fruit.x + TILE_SIZE,
        fruit.y + TILE_SIZE
      );

      gradient.addColorStop(0, fruit.colorStart);
      gradient.addColorStop(1, fruit.colorEnd);
      ctx.fillStyle = gradient;
    } else {
      ctx.fillStyle = fruit.color;
    }

    ctx.beginPath();
    ctx.arc(fruit.x + HALF_TILE, fruit.y + HALF_TILE, fruit.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;
  }

  function drawGame() {
    const canvas = canvasRef.current;
    const runtime = runtimeRef.current;

    if (!canvas) {
      return;
    }

    const ctx = canvas.getContext("2d");

    if (!ctx) {
      return;
    }

    applyMagnetPhysics();

    ctx.save();

    if (runtime.shakeIntensity > 0) {
      const shakeX = (Math.random() - 0.5) * runtime.shakeIntensity;
      const shakeY = (Math.random() - 0.5) * runtime.shakeIntensity;

      ctx.translate(shakeX, shakeY);
      runtime.shakeIntensity -= 0.5;
    }

    ctx.fillStyle = "#1e272e";
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    if (runtime.frenzyActive) {
      const pulse = Math.abs(Math.sin(Date.now() / 250)) * 0.15;

      ctx.fillStyle = `rgba(46, 204, 113, ${0.05 + pulse})`;
      ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

      if (Math.random() < 0.4) {
        runtime.backgroundParticles.push({
          x: Math.random() * CANVAS_SIZE,
          y: CANVAS_SIZE + 10,
          vy: -(1 + Math.random() * 2),
          radius: Math.random() * 2.5 + 1,
          opacity: Math.random() * 0.5 + 0.1,
        });
      }
    }

    for (let index = runtime.backgroundParticles.length - 1; index >= 0; index--) {
      const particle = runtime.backgroundParticles[index];

      particle.y += particle.vy;

      ctx.fillStyle = `rgba(46, 204, 113, ${particle.opacity})`;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
      ctx.fill();

      if (particle.y < -10) {
        runtime.backgroundParticles.splice(index, 1);
      }
    }

    ctx.strokeStyle = "rgba(255, 255, 255, 0.03)";
    ctx.lineWidth = 1;

    for (let index = 0; index < CANVAS_SIZE; index += TILE_SIZE) {
      ctx.beginPath();
      ctx.moveTo(index, 0);
      ctx.lineTo(index, CANVAS_SIZE);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, index);
      ctx.lineTo(CANVAS_SIZE, index);
      ctx.stroke();
    }

    Object.entries(runtime.fruits).forEach(([fruitKey, fruit]) => {
      if (!fruit.active) {
        return;
      }

      if (fruitKey === "hybrid") {
        drawCircle(ctx, fruit);
        return;
      }

      drawCircle(ctx, fruit);
    });

    runtime.extraFruits.forEach((extraFruit) => {
      drawCircle(ctx, extraFruit);
    });

    runtime.snake.forEach((piece, index) => {
      const baseColor = `hsl(${180 + index * 4}, 100%, 60%)`;
      let currentColor = baseColor;

      const shouldBlink = Date.now() % 300 < 150;

      if (runtime.frenzyActive) {
        currentColor =
          runtime.frenzyTime < 20 && shouldBlink ? baseColor : "#2ecc71";
      } else if (runtime.invincible) {
        currentColor =
          runtime.invincibleTime < 20 && shouldBlink ? baseColor : "#f1c40f";
      } else if (runtime.magnetActive) {
        currentColor =
          runtime.magnetTime < 20 && shouldBlink ? baseColor : "#9b59b6";
      }

      ctx.fillStyle = currentColor;
      ctx.shadowBlur = 5;
      ctx.shadowColor = currentColor;

      const radius = index === 0 || index === runtime.snake.length - 1 ? 8 : 2;

      ctx.beginPath();
      ctx.roundRect(
        piece.x + 1,
        piece.y + 1,
        TILE_SIZE - 2,
        TILE_SIZE - 2,
        radius
      );
      ctx.fill();

      ctx.shadowBlur = 0;

      if (index === 0) {
        ctx.fillStyle = "rgba(0, 0, 0, 0.7)";

        ctx.beginPath();
        ctx.arc(piece.x + 6, piece.y + 6, 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.arc(piece.x + 14, piece.y + 6, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    for (let index = runtime.particles.length - 1; index >= 0; index--) {
      const particle = runtime.particles[index];

      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.life -= 0.05;

      ctx.globalAlpha = Math.max(0, particle.life);
      ctx.fillStyle = particle.color;
      ctx.shadowBlur = 10;
      ctx.shadowColor = particle.color;

      ctx.beginPath();
      ctx.arc(particle.x, particle.y, 3, 0, Math.PI * 2);
      ctx.fill();

      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;

      if (particle.life <= 0) {
        runtime.particles.splice(index, 1);
      }
    }

    ctx.restore();

    if (screenState === "playing") {
      animationFrameRef.current = requestAnimationFrame(drawGame);
    }
  }

  function startGame() {
    if (!isAuthenticated && !isGuest) {
      setShowLoginWarning(true);
      return;
    }

    if (isGuest && !guestWarningAccepted) {
      setShowGuestWarning(true);
      return;
    }

    stopGameTimers();
    resetGame();

    setScreenState("countdown");
    setCountdownText("3");

    startMusic();

    let count = 3;

    countdownTimerRef.current = window.setInterval(() => {
      if (count > 0) {
        setCountdownText(String(count));
        count--;
        return;
      }

      if (count === 0) {
        setCountdownText("VAI!");
        count--;
        return;
      }

      if (countdownTimerRef.current) {
        window.clearInterval(countdownTimerRef.current);
      }

      setScreenState("playing");

      window.setTimeout(() => {
        gameLoop();
        drawGame();
      }, 0);
    }, 1000);
  }

  function changeDirection(direction: string) {
    if (screenState !== "playing") {
      return;
    }

    const runtime = runtimeRef.current;

    const goingUp = runtime.dy === -TILE_SIZE;
    const goingDown = runtime.dy === TILE_SIZE;
    const goingRight = runtime.dx === TILE_SIZE;
    const goingLeft = runtime.dx === -TILE_SIZE;

    if ((direction === "ArrowUp" || direction === "up" || direction === "w") && !goingDown) {
      runtime.dx = 0;
      runtime.dy = -TILE_SIZE;
    }

    if ((direction === "ArrowDown" || direction === "down" || direction === "s") && !goingUp) {
      runtime.dx = 0;
      runtime.dy = TILE_SIZE;
    }

    if ((direction === "ArrowLeft" || direction === "left" || direction === "a") && !goingRight) {
      runtime.dx = -TILE_SIZE;
      runtime.dy = 0;
    }

    if ((direction === "ArrowRight" || direction === "right" || direction === "d") && !goingLeft) {
      runtime.dx = TILE_SIZE;
      runtime.dy = 0;
    }
  }

  function calculateSwipe(
    startX: number,
    startY: number,
    endX: number,
    endY: number
  ) {
    const diffX = endX - startX;
    const diffY = endY - startY;

    if (Math.abs(diffX) < 30 && Math.abs(diffY) < 30) {
      return;
    }

    if (Math.abs(diffX) > Math.abs(diffY)) {
      changeDirection(diffX > 0 ? "right" : "left");
      return;
    }

    changeDirection(diffY > 0 ? "down" : "up");
  }

  function acceptGuestWarning() {
    setGuestWarningAccepted(true);
    setShowGuestWarning(false);
  }

  return (
    <main className="snake-page">
      <div className="background-orb orb-one" />
      <div className="background-orb orb-two" />
      <div className="background-grid" />

      <section className="snake-shell">
        <div className="snake-topbar glass-panel">
          <Link to="/" className="snake-back-link">
            ← Voltar para Home
          </Link>

          <div className="snake-title">
            <span>🐍</span>
            <div>
              <strong>Snake Arcade</strong>
              <p>Frutas especiais, poderes e frenesi.</p>
            </div>
          </div>
        </div>

        <div className="snake-scoreboard">
          <div className="snake-score-box glass-panel">
            PONTOS <span>{score}</span>
          </div>

          <div className="snake-score-box glass-panel">
            RECORDE <span>{highScore}</span>
          </div>
        </div>

        <div className="snake-power-area">
          {goldenPercent > 0 && (
            <div className="snake-power-ui">
              <span>🌟 PROTEÇÃO</span>

              <div className="snake-bar-bg">
                <div
                  className="snake-bar-fill snake-bar-golden"
                  style={{ width: `${goldenPercent}%` }}
                />
              </div>
            </div>
          )}

          {magnetPercent > 0 && (
            <div className="snake-power-ui">
              <span>🧲 ÍMÃ</span>

              <div className="snake-bar-bg">
                <div
                  className="snake-bar-fill snake-bar-purple"
                  style={{ width: `${magnetPercent}%` }}
                />
              </div>
            </div>
          )}
        </div>

        <div className="snake-canvas-wrapper">
          <canvas
            ref={canvasRef}
            width={CANVAS_SIZE}
            height={CANVAS_SIZE}
            className="snake-canvas"
          />

          {screenState === "start" && (
            <div className="snake-overlay glass-panel">
              <h1>Snake Arcade</h1>

              <p>
                Domine os poderes, desvie das frutas pretas e sobreviva ao
                frenesi verde.
              </p>

              <button className="btn btn-primary" type="button" onClick={startGame}>
                Iniciar jogo
              </button>
            </div>
          )}

          {screenState === "countdown" && (
            <div className="snake-overlay glass-panel">
              <strong className="snake-countdown">{countdownText}</strong>
            </div>
          )}

          {screenState === "game-over" && (
            <div className="snake-overlay glass-panel">
              <h1 className="snake-game-over-title">Fim de jogo</h1>

              <div className="snake-final-score">
                <span>PONTOS</span>
                <strong>{finalScore}</strong>
              </div>

              {!isAuthenticated && (
                <p className="snake-save-warning">
                  Como visitante, essa pontuação não foi salva.
                </p>
              )}

              <button className="btn btn-primary" type="button" onClick={startGame}>
                Tentar novamente
              </button>

              <Link className="btn btn-secondary" to="/">
                Voltar
              </Link>
            </div>
          )}
        </div>

        <div className="snake-mobile-controls">
          <div className="snake-pad-left">
            <button type="button" onClick={() => changeDirection("left")}>
              ⬅️
            </button>

            <button type="button" onClick={() => changeDirection("right")}>
              ➡️
            </button>
          </div>

          <div className="snake-pad-right">
            <button type="button" onClick={() => changeDirection("up")}>
              ⬆️
            </button>

            <button type="button" onClick={() => changeDirection("down")}>
              ⬇️
            </button>
          </div>
        </div>
      </section>

      {showGuestWarning && (
        <div className="snake-modal-backdrop">
          <div className="snake-warning-modal glass-panel">
            <span className="snake-modal-icon">⚠️</span>

            <h2>Modo visitante</h2>

            <p>
              Você pode jogar normalmente, mas seus pontos, recordes e progresso
              não serão salvos enquanto estiver como visitante.
            </p>

            <div className="snake-modal-actions">
              <button
                className="btn btn-primary"
                type="button"
                onClick={acceptGuestWarning}
              >
                Entendi, continuar
              </button>

              <Link className="btn btn-secondary" to="/login">
                Entrar na conta
              </Link>
            </div>
          </div>
        </div>
      )}

      {showLoginWarning && (
        <div className="snake-modal-backdrop">
          <div className="snake-warning-modal glass-panel">
            <span className="snake-modal-icon">🔐</span>

            <h2>Entre para jogar</h2>

            <p>
              Para jogar e salvar seu progresso, entre na sua conta ou crie um
              cadastro. Também é possível continuar como visitante pela Home.
            </p>

            <div className="snake-modal-actions">
              <Link className="btn btn-primary" to="/login">
                Entrar
              </Link>

              <Link className="btn btn-secondary" to="/register">
                Criar conta
              </Link>

              <Link className="btn btn-ghost" to="/">
                Voltar para Home
              </Link>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default SnakeGamePage;