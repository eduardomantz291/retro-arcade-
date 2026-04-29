import { useEffect, useRef, useState } from "react";
import {
  CANVAS_SIZE,
  HALF_TILE,
  HIGH_SCORE_KEY,
  MAX_GOLDEN_TIME,
  MAX_MAGNET_TIME,
  TICK_SPEED,
  TILE_SIZE,
} from "./snakeConfig";
import { createBlackFruit, createInitialRuntime } from "./snakeFactory";
import type { Fruit, GameRuntime, Point, SnakeScreenState } from "./snakeTypes";

type UseSnakeGameParams = {
  isAuthenticated: boolean;
};

const BLACK_FRUIT_COUNT = 5;
const MIN_BLACK_DISTANCE_FROM_PLAYER = 120;
const MIN_DISTANCE_BETWEEN_BLACK_FRUITS = 70;

export function useSnakeGame({ isAuthenticated }: UseSnakeGameParams) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const runtimeRef = useRef<GameRuntime>(createInitialRuntime());

  const screenStateRef = useRef<SnakeScreenState>("start");
  const isAuthenticatedRef = useRef(isAuthenticated);

  const animationFrameRef = useRef<number | null>(null);
  const gameLoopTimerRef = useRef<number | null>(null);
  const countdownTimerRef = useRef<number | null>(null);

  const touchStartXRef = useRef(0);
  const touchStartYRef = useRef(0);

  const titleMusicRef = useRef<HTMLAudioElement | null>(null);
  const gameMusicRef = useRef<HTMLAudioElement | null>(null);
  const soundEffectsRef = useRef<Record<string, HTMLAudioElement>>({});

  const [screenState, setScreenState] = useState<SnakeScreenState>("start");
  const [countdownText, setCountdownText] = useState("3");

  const [score, setScore] = useState(0);
  const [finalScore, setFinalScore] = useState(0);

  const [highScore, setHighScore] = useState(() => {
    return Number(localStorage.getItem(HIGH_SCORE_KEY)) || 0;
  });

  const highScoreRef = useRef(highScore);

  const [goldenPercent, setGoldenPercent] = useState(0);
  const [magnetPercent, setMagnetPercent] = useState(0);

  useEffect(() => {
    isAuthenticatedRef.current = isAuthenticated;
  }, [isAuthenticated]);

  useEffect(() => {
    highScoreRef.current = highScore;
  }, [highScore]);

  useEffect(() => {
    // Carregamos os áudios uma única vez quando a página do jogo abre.
    soundEffectsRef.current = {
      eat: new Audio("/audio/comer.wav"),
      damage: new Audio("/audio/dano.wav"),
      power: new Audio("/audio/poder.wav"),
      frenzy: new Audio("/audio/verde.wav"),
      death: new Audio("/audio/morte.wav"),
    };

    // Música da tela inicial do jogo.
    titleMusicRef.current = new Audio("/audio/music-title.mp3");
    titleMusicRef.current.volume = 0.35;
    titleMusicRef.current.loop = true;

    // Música principal da partida.
    gameMusicRef.current = new Audio("/audio/musica-tema.mp3");
    gameMusicRef.current.volume = 0.3;
    gameMusicRef.current.loop = true;

    // Alguns navegadores podem bloquear até o primeiro clique do usuário.
    startTitleMusic();
  }, []);

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
    document.addEventListener("touchstart", handleTouchStart, {
      passive: true,
    });
    document.addEventListener("touchend", handleTouchEnd);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchend", handleTouchEnd);

      stopGameTimers();
      stopTitleMusic();
      stopGameMusic();
    };
  }, []);

  function setGameScreen(nextScreen: SnakeScreenState) {
    // Ref usada pelo loop para não depender do estado assíncrono do React.
    screenStateRef.current = nextScreen;
    setScreenState(nextScreen);
  }

  function gridRandom() {
    return Math.floor(Math.random() * (CANVAS_SIZE / TILE_SIZE)) * TILE_SIZE;
  }

  function getDistance(first: Point, second: Point) {
    return Math.hypot(first.x - second.x, first.y - second.y);
  }

  function playEffect(soundName: string) {
    const sound = soundEffectsRef.current[soundName];

    if (!sound) {
      return;
    }

    // Clonamos para permitir efeitos rápidos em sequência.
    const soundClone = sound.cloneNode() as HTMLAudioElement;
    soundClone.volume = sound.volume;
    soundClone.play().catch(() => undefined);
  }

  function startTitleMusic() {
    titleMusicRef.current?.play().catch(() => undefined);
  }

  function stopTitleMusic() {
    if (!titleMusicRef.current) {
      return;
    }

    titleMusicRef.current.pause();
    titleMusicRef.current.currentTime = 0;
  }

  function startGameMusic() {
    gameMusicRef.current?.play().catch(() => undefined);
  }

  function stopGameMusic() {
    if (!gameMusicRef.current) {
      return;
    }

    gameMusicRef.current.pause();
    gameMusicRef.current.currentTime = 0;
  }

  function stopGameTimers() {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (gameLoopTimerRef.current !== null) {
      window.clearTimeout(gameLoopTimerRef.current);
      gameLoopTimerRef.current = null;
    }

    if (countdownTimerRef.current !== null) {
      window.clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
  }

  function isPointOnSnake(runtime: GameRuntime, point: Point) {
    return runtime.snake.some(
      (piece) => piece.x === point.x && piece.y === point.y
    );
  }

  function isPointOnFruit(point: Point, fruit: Fruit) {
    return fruit.active && fruit.x === point.x && fruit.y === point.y;
  }

  function isPointBusy(runtime: GameRuntime, point: Point) {
    const { fruits } = runtime;

    if (isPointOnSnake(runtime, point)) {
      return true;
    }

    if (Object.values(fruits).some((fruit) => isPointOnFruit(point, fruit))) {
      return true;
    }

    if (runtime.extraFruits.some((fruit) => isPointOnFruit(point, fruit))) {
      return true;
    }

    if (runtime.blackFruits.some((fruit) => isPointOnFruit(point, fruit))) {
      return true;
    }

    return false;
  }

  function getSafeGridPoint(runtime: GameRuntime) {
    for (let attempt = 0; attempt < 120; attempt++) {
      const point = {
        x: gridRandom(),
        y: gridRandom(),
      };

      if (!isPointBusy(runtime, point)) {
        return point;
      }
    }

    return {
      x: gridRandom(),
      y: gridRandom(),
    };
  }

  function placeFruit(runtime: GameRuntime, fruit: Fruit) {
    const point = getSafeGridPoint(runtime);

    fruit.active = true;
    fruit.x = point.x;
    fruit.y = point.y;
  }

  function spawnNormalFruit(runtime: GameRuntime) {
    placeFruit(runtime, runtime.fruits.normal);
  }

  function trySpawnSpecialFruits(runtime: GameRuntime) {
    const { fruits } = runtime;

    // As frutas especiais são independentes.
    // Se uma já estiver no mapa, ela não será removida nem reposicionada.
    if (!fruits.golden.active && runtime.score >= 150 && Math.random() < 0.1) {
      placeFruit(runtime, fruits.golden);
    }

    if (!fruits.purple.active && Math.random() < 0.06) {
      placeFruit(runtime, fruits.purple);
    }

    if (!fruits.hybrid.active && runtime.score >= 300 && Math.random() < 0.06) {
      placeFruit(runtime, fruits.hybrid);
    }

    if (!fruits.wanderingGreen.active && Math.random() < 0.05) {
      placeFruit(runtime, fruits.wanderingGreen);
      runtime.greenMoveTimer = 0;
    }
  }

  function getSafeBlackFruitPoint(
    runtime: GameRuntime,
    spawnedBlackFruits: Fruit[]
  ) {
    const playerHead = runtime.snake[0];

    for (let attempt = 0; attempt < 220; attempt++) {
      const point = {
        x: gridRandom(),
        y: gridRandom(),
      };

      if (isPointBusy(runtime, point)) {
        continue;
      }

      const isTooCloseToPlayer =
        getDistance(point, playerHead) < MIN_BLACK_DISTANCE_FROM_PLAYER;

      if (isTooCloseToPlayer) {
        continue;
      }

      const isTooCloseToOtherBlackFruit = spawnedBlackFruits.some((fruit) => {
        return getDistance(point, fruit) < MIN_DISTANCE_BETWEEN_BLACK_FRUITS;
      });

      if (isTooCloseToOtherBlackFruit) {
        continue;
      }

      return point;
    }

    return {
      x: gridRandom(),
      y: gridRandom(),
    };
  }

  function respawnBlackFruits(runtime: GameRuntime) {
    // Durante o frenesi, as frutas pretas não podem aparecer.
    if (runtime.frenzyActive) {
      runtime.blackFruits = [];
      return;
    }

    const nextBlackFruits: Fruit[] = [];

    for (let index = 0; index < BLACK_FRUIT_COUNT; index++) {
      const point = getSafeBlackFruitPoint(runtime, nextBlackFruits);
      nextBlackFruits.push(createBlackFruit(point.x, point.y));
    }

    runtime.blackFruits = nextBlackFruits;
  }

  function resetGame() {
    const runtime = createInitialRuntime();

    spawnNormalFruit(runtime);
    trySpawnSpecialFruits(runtime);
    respawnBlackFruits(runtime);

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
      if (
        runtime.snake[index].x === head.x &&
        runtime.snake[index].y === head.y
      ) {
        return true;
      }
    }

    return false;
  }

  function showGameOver() {
    const runtime = runtimeRef.current;

    // Ao morrer, paramos todas as músicas.
    // A tela de Game Over fica sem música, apenas com o efeito de morte.
    stopGameMusic();
    stopTitleMusic();

    playEffect("death");
    applyScreenShake(15);

    setFinalScore(runtime.score);
    setGameScreen("game-over");

    // Visitante joga, mas não salva recorde.
    if (isAuthenticatedRef.current && runtime.score > highScoreRef.current) {
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

  function handleFruitWasEaten(runtime: GameRuntime) {
    // Tentamos criar novas frutas especiais sem apagar as que já existem.
    trySpawnSpecialFruits(runtime);

    // Durante o frenesi verde, as frutas pretas não aparecem.
    if (runtime.frenzyActive) {
      runtime.blackFruits = [];
      return;
    }

    // Fora do frenesi, sempre que qualquer fruta for comida,
    // as frutas pretas somem e renascem em posições seguras.
    respawnBlackFruits(runtime);
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

    const blackFruitIndex = runtime.blackFruits.findIndex((fruit) =>
      checkFruitCollision(nextX, nextY, fruit)
    );

    if (blackFruitIndex >= 0) {
      const blackFruit = runtime.blackFruits[blackFruitIndex];

      if (runtime.invincible) {
        // A fruta amarela dá proteção completa.
        // Encostar em fruta preta durante a proteção não causa dano.
        createExplosion(blackFruit.x, blackFruit.y, "#f1c40f");
        applyScreenShake(2);
      } else {
        updateScore(blackFruit.points);
        createExplosion(blackFruit.x, blackFruit.y, blackFruit.glow);
        applyScreenShake(8);
        playEffect("damage");

        runtime.snake.pop();
        runtime.snake.pop();
        runtime.snake.pop();

        ateSomething = true;

        if (runtime.snake.length < 3) {
          showGameOver();
          return;
        }
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

      // Durante o frenesi, as frutas pretas somem completamente.
      runtime.blackFruits = [];

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

    if (ateSomething) {
      handleFruitWasEaten(runtime);
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

        // Quando o frenesi acaba, as frutas pretas voltam ao mapa.
        respawnBlackFruits(runtime);
      }
    }

    setGoldenPercent(
      runtime.invincible
        ? (runtime.invincibleTime / MAX_GOLDEN_TIME) * 100
        : 0
    );

    setMagnetPercent(
      runtime.magnetActive
        ? (runtime.magnetTime / MAX_MAGNET_TIME) * 100
        : 0
    );
  }

  function gameLoop() {
    if (screenStateRef.current !== "playing") {
      return;
    }

    moveWanderingGreenFruit();

    if (isGameOver()) {
      showGameOver();
      return;
    }

    moveSnake();

    if (screenStateRef.current !== "playing") {
      return;
    }

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
    ctx.arc(
      fruit.x + HALF_TILE,
      fruit.y + HALF_TILE,
      fruit.radius,
      0,
      Math.PI * 2
    );
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

    for (
      let index = runtime.backgroundParticles.length - 1;
      index >= 0;
      index--
    ) {
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

    Object.values(runtime.fruits).forEach((fruit) => {
      if (fruit.active) {
        drawCircle(ctx, fruit);
      }
    });

    runtime.blackFruits.forEach((blackFruit) => {
      drawCircle(ctx, blackFruit);
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

    if (screenStateRef.current === "playing") {
      animationFrameRef.current = requestAnimationFrame(drawGame);
    }
  }

  function startGame() {
    stopGameTimers();
    resetGame();

    setGameScreen("countdown");
    setCountdownText("3");

    stopTitleMusic();
    startGameMusic();

    let count = 3;

    countdownTimerRef.current = window.setInterval(() => {
      count--;

      if (count > 0) {
        setCountdownText(String(count));
        return;
      }

      if (count === 0) {
        setCountdownText("VAI!");
        return;
      }

      if (countdownTimerRef.current !== null) {
        window.clearInterval(countdownTimerRef.current);
        countdownTimerRef.current = null;
      }

      setGameScreen("playing");

      gameLoop();
      drawGame();
    }, 1000);
  }

  function changeDirection(direction: string) {
    if (screenStateRef.current !== "playing") {
      return;
    }

    const runtime = runtimeRef.current;

    const goingUp = runtime.dy === -TILE_SIZE;
    const goingDown = runtime.dy === TILE_SIZE;
    const goingRight = runtime.dx === TILE_SIZE;
    const goingLeft = runtime.dx === -TILE_SIZE;

    if (
      (direction === "ArrowUp" || direction === "up" || direction === "w") &&
      !goingDown
    ) {
      runtime.dx = 0;
      runtime.dy = -TILE_SIZE;
    }

    if (
      (direction === "ArrowDown" || direction === "down" || direction === "s") &&
      !goingUp
    ) {
      runtime.dx = 0;
      runtime.dy = TILE_SIZE;
    }

    if (
      (direction === "ArrowLeft" ||
        direction === "left" ||
        direction === "a") &&
      !goingRight
    ) {
      runtime.dx = -TILE_SIZE;
      runtime.dy = 0;
    }

    if (
      (direction === "ArrowRight" ||
        direction === "right" ||
        direction === "d") &&
      !goingLeft
    ) {
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

  return {
    canvasRef,
    screenState,
    countdownText,
    score,
    finalScore,
    highScore,
    goldenPercent,
    magnetPercent,
    startGame,
    changeDirection,
  };
}