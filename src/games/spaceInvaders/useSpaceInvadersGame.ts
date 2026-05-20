import { useEffect, useRef, useState } from "react";
import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  ENEMY_BULLET_HEIGHT,
  ENEMY_BULLET_SPEED,
  ENEMY_BULLET_WIDTH,
  INVADER_BASE_SPEED,
  INVADER_DROP_DISTANCE,
  INVADER_SHOOT_CHANCE,
  PLAYER_BULLET_HEIGHT,
  PLAYER_BULLET_SPEED,
  PLAYER_BULLET_WIDTH,
  PLAYER_SPEED,
  POINTS_PER_INVADER,
  WAVE_CLEAR_BONUS,
} from "./spaceInvadersConfig";
import {
  createInitialSpaceInvadersRuntime,
  createInvaders,
} from "./spaceInvadersFactory";
import type {
  Bullet,
  Invader,
  SpaceInvadersRuntime,
  SpaceInvadersScreenState,
} from "./spaceInvadersTypes";

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function isColliding(
  first: { x: number; y: number; width: number; height: number },
  second: { x: number; y: number; width: number; height: number }
) {
  return (
    first.x < second.x + second.width &&
    first.x + first.width > second.x &&
    first.y < second.y + second.height &&
    first.y + first.height > second.y
  );
}

export function useSpaceInvadersGame() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const frameRef = useRef<number | null>(null);
  const runtimeRef = useRef<SpaceInvadersRuntime>(
    createInitialSpaceInvadersRuntime()
  );

  const screenStateRef = useRef<SpaceInvadersScreenState>("start");
  const bulletIdRef = useRef(0);

  const [screenState, setScreenState] =
    useState<SpaceInvadersScreenState>("start");

  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [wave, setWave] = useState(1);

  useEffect(() => {
    drawGame();

    function handleKeyDown(event: KeyboardEvent) {
      const runtime = runtimeRef.current;

      if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") {
        runtime.keys.left = true;
      }

      if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") {
        runtime.keys.right = true;
      }

      if (event.key === " " || event.key.toLowerCase() === "w") {
        event.preventDefault();
        runtime.keys.shooting = true;
      }
    }

    function handleKeyUp(event: KeyboardEvent) {
      const runtime = runtimeRef.current;

      if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") {
        runtime.keys.left = false;
      }

      if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") {
        runtime.keys.right = false;
      }

      if (event.key === " " || event.key.toLowerCase() === "w") {
        runtime.keys.shooting = false;
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);

      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, []);

  function setGameScreen(nextScreen: SpaceInvadersScreenState) {
    screenStateRef.current = nextScreen;
    setScreenState(nextScreen);
  }

  function syncStateFromRuntime() {
    const runtime = runtimeRef.current;

    setScore(runtime.score);
    setLives(runtime.lives);
    setWave(runtime.wave);
  }

  function startGame() {
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
    }

    bulletIdRef.current = 0;
    runtimeRef.current = createInitialSpaceInvadersRuntime();

    syncStateFromRuntime();
    setGameScreen("playing");

    frameRef.current = requestAnimationFrame(gameLoop);
  }

  function restartGame() {
    startGame();
  }

  function backToStartScreen() {
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }

    runtimeRef.current = createInitialSpaceInvadersRuntime();
    syncStateFromRuntime();
    setGameScreen("start");
    drawGame();
  }

  function handlePointerMove(clientX: number) {
    if (screenStateRef.current !== "playing") {
      return;
    }

    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_WIDTH / rect.width;
    const pointerX = (clientX - rect.left) * scaleX;

    const runtime = runtimeRef.current;
    runtime.player.targetX = clamp(
      pointerX - runtime.player.width / 2,
      0,
      CANVAS_WIDTH - runtime.player.width
    );
  }

  function handleShootAction() {
    if (screenStateRef.current !== "playing") {
      return;
    }

    runtimeRef.current.keys.shooting = true;
    shootPlayerBullet();
  }

  function createParticleExplosion(x: number, y: number, color: string) {
    const runtime = runtimeRef.current;

    for (let index = 0; index < 14; index++) {
      runtime.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 5,
        vy: (Math.random() - 0.5) * 5,
        life: 1,
        color,
      });
    }
  }

  function createBullet(
    x: number,
    y: number,
    width: number,
    height: number,
    vy: number
  ): Bullet {
    bulletIdRef.current += 1;

    return {
      id: bulletIdRef.current,
      x,
      y,
      width,
      height,
      vy,
      active: true,
    };
  }

  function shootPlayerBullet() {
    const runtime = runtimeRef.current;
    const now = performance.now();

    if (now - runtime.lastPlayerShotAt < 260) {
      return;
    }

    const hasActiveBullet = runtime.playerBullets.some((bullet) => bullet.active);

    if (hasActiveBullet) {
      return;
    }

    runtime.lastPlayerShotAt = now;

    runtime.playerBullets.push(
      createBullet(
        runtime.player.x + runtime.player.width / 2 - PLAYER_BULLET_WIDTH / 2,
        runtime.player.y - PLAYER_BULLET_HEIGHT,
        PLAYER_BULLET_WIDTH,
        PLAYER_BULLET_HEIGHT,
        -PLAYER_BULLET_SPEED
      )
    );
  }

  function shootEnemyBullet(invader: Invader) {
    const runtime = runtimeRef.current;

    runtime.enemyBullets.push(
      createBullet(
        invader.x + invader.width / 2 - ENEMY_BULLET_WIDTH / 2,
        invader.y + invader.height,
        ENEMY_BULLET_WIDTH,
        ENEMY_BULLET_HEIGHT,
        ENEMY_BULLET_SPEED
      )
    );
  }

  function updatePlayer() {
    const runtime = runtimeRef.current;
    const { player, keys } = runtime;

    if (keys.left) {
      player.targetX -= PLAYER_SPEED;
    }

    if (keys.right) {
      player.targetX += PLAYER_SPEED;
    }

    player.targetX = clamp(player.targetX, 0, CANVAS_WIDTH - player.width);
    player.x += (player.targetX - player.x) * 0.28;

    if (keys.shooting) {
      shootPlayerBullet();
    }
  }

  function updateInvaders() {
    const runtime = runtimeRef.current;
    const activeInvaders = runtime.invaders.filter((invader) => invader.active);

    if (activeInvaders.length === 0) {
      runtime.wave += 1;
      runtime.score += WAVE_CLEAR_BONUS;
      runtime.invaders = createInvaders(runtime.wave);
      runtime.enemyBullets = [];
      runtime.invaderDirection = 1;
      runtime.invaderSpeed = INVADER_BASE_SPEED + runtime.wave * 0.18;

      syncStateFromRuntime();
      return;
    }

    const leftMost = Math.min(...activeInvaders.map((invader) => invader.x));
    const rightMost = Math.max(
      ...activeInvaders.map((invader) => invader.x + invader.width)
    );

    const shouldDrop =
      (rightMost >= CANVAS_WIDTH - 22 && runtime.invaderDirection === 1) ||
      (leftMost <= 22 && runtime.invaderDirection === -1);

    if (shouldDrop) {
      runtime.invaderDirection *= -1;

      for (const invader of activeInvaders) {
        invader.y += INVADER_DROP_DISTANCE;
      }

      runtime.shake = 4;
    } else {
      const speedBonus = Math.max(0, 1 - activeInvaders.length / runtime.invaders.length);
      const speed = runtime.invaderSpeed + speedBonus * 1.6;

      for (const invader of activeInvaders) {
        invader.x += speed * runtime.invaderDirection;
      }
    }

    const randomShooter =
      activeInvaders[Math.floor(Math.random() * activeInvaders.length)];

    if (randomShooter && Math.random() < INVADER_SHOOT_CHANCE + runtime.wave * 0.0015) {
      shootEnemyBullet(randomShooter);
    }

    const hasInvaderReachedPlayer = activeInvaders.some((invader) => {
      return invader.y + invader.height >= runtime.player.y - 8;
    });

    if (hasInvaderReachedPlayer) {
      showGameOver();
    }
  }

  function updateBullets() {
    const runtime = runtimeRef.current;

    for (const bullet of runtime.playerBullets) {
      bullet.y += bullet.vy;
    }

    for (const bullet of runtime.enemyBullets) {
      bullet.y += bullet.vy;
    }

    runtime.playerBullets = runtime.playerBullets.filter((bullet) => {
      return bullet.active && bullet.y + bullet.height > 0;
    });

    runtime.enemyBullets = runtime.enemyBullets.filter((bullet) => {
      return bullet.active && bullet.y < CANVAS_HEIGHT + bullet.height;
    });
  }

  function handlePlayerBulletCollisions() {
    const runtime = runtimeRef.current;

    for (const bullet of runtime.playerBullets) {
      if (!bullet.active) {
        continue;
      }

      for (const invader of runtime.invaders) {
        if (!invader.active) {
          continue;
        }

        if (isColliding(bullet, invader)) {
          bullet.active = false;
          invader.active = false;

          runtime.score += POINTS_PER_INVADER;
          runtime.shake = 3;

          createParticleExplosion(
            invader.x + invader.width / 2,
            invader.y + invader.height / 2,
            "#38ef7d"
          );

          syncStateFromRuntime();
          break;
        }
      }
    }
  }

  function handleEnemyBulletCollisions() {
    const runtime = runtimeRef.current;

    for (const bullet of runtime.enemyBullets) {
      if (!bullet.active) {
        continue;
      }

      if (isColliding(bullet, runtime.player)) {
        bullet.active = false;
        runtime.lives -= 1;
        runtime.shake = 12;

        createParticleExplosion(
          runtime.player.x + runtime.player.width / 2,
          runtime.player.y + runtime.player.height / 2,
          "#ff4757"
        );

        syncStateFromRuntime();

        if (runtime.lives <= 0) {
          showGameOver();
        }
      }
    }
  }

  function updateParticles() {
    const runtime = runtimeRef.current;

    for (let index = runtime.particles.length - 1; index >= 0; index--) {
      const particle = runtime.particles[index];

      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.life -= 0.04;

      if (particle.life <= 0) {
        runtime.particles.splice(index, 1);
      }
    }
  }

  function updateGame() {
    updatePlayer();
    updateInvaders();
    updateBullets();
    handlePlayerBulletCollisions();
    handleEnemyBulletCollisions();
    updateParticles();

    const runtime = runtimeRef.current;

    if (runtime.shake > 0) {
      runtime.shake -= 0.35;
    }
  }

  function showGameOver() {
    setGameScreen("game-over");

    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }

    syncStateFromRuntime();
    drawGame();
  }

  function drawRoundedRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number
  ) {
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, radius);
    ctx.fill();
  }

  function drawPlayer(ctx: CanvasRenderingContext2D) {
    const { player } = runtimeRef.current;

    ctx.save();

    ctx.shadowBlur = 20;
    ctx.shadowColor = "#4facfe";
    ctx.fillStyle = "#4facfe";

    drawRoundedRect(ctx, player.x, player.y + 8, player.width, 12, 999);

    ctx.fillStyle = "#38ef7d";
    ctx.beginPath();
    ctx.moveTo(player.x + player.width / 2, player.y);
    ctx.lineTo(player.x + player.width - 8, player.y + player.height);
    ctx.lineTo(player.x + 8, player.y + player.height);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(player.x + player.width / 2 - 2, player.y + 4, 4, 12);

    ctx.restore();
  }

  function drawInvader(ctx: CanvasRenderingContext2D, invader: Invader) {
    const pulse = Math.abs(Math.sin(Date.now() / 220)) * 3;

    ctx.save();

    ctx.shadowBlur = 14 + pulse;
    ctx.shadowColor = "#38ef7d";
    ctx.fillStyle = "#38ef7d";

    if (invader.variant === "square") {
      drawRoundedRect(ctx, invader.x, invader.y, invader.width, invader.height, 7);
    }

    if (invader.variant === "circle") {
      ctx.beginPath();
      ctx.ellipse(
        invader.x + invader.width / 2,
        invader.y + invader.height / 2,
        invader.width / 2,
        invader.height / 2,
        0,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }

    if (invader.variant === "triangle") {
      ctx.beginPath();
      ctx.moveTo(invader.x + invader.width / 2, invader.y);
      ctx.lineTo(invader.x + invader.width, invader.y + invader.height);
      ctx.lineTo(invader.x, invader.y + invader.height);
      ctx.closePath();
      ctx.fill();
    }

    ctx.shadowBlur = 0;
    ctx.fillStyle = "rgba(0, 0, 0, 0.68)";

    ctx.beginPath();
    ctx.arc(invader.x + invader.width * 0.35, invader.y + invader.height * 0.45, 2.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(invader.x + invader.width * 0.65, invader.y + invader.height * 0.45, 2.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  function drawBullets(ctx: CanvasRenderingContext2D) {
    const runtime = runtimeRef.current;

    for (const bullet of runtime.playerBullets) {
      ctx.shadowBlur = 16;
      ctx.shadowColor = "#f1c40f";
      ctx.fillStyle = "#f1c40f";
      drawRoundedRect(ctx, bullet.x, bullet.y, bullet.width, bullet.height, 999);
    }

    for (const bullet of runtime.enemyBullets) {
      ctx.shadowBlur = 14;
      ctx.shadowColor = "#ff4757";
      ctx.fillStyle = "#ff4757";
      drawRoundedRect(ctx, bullet.x, bullet.y, bullet.width, bullet.height, 999);
    }

    ctx.shadowBlur = 0;
  }

  function drawParticles(ctx: CanvasRenderingContext2D) {
    const runtime = runtimeRef.current;

    for (const particle of runtime.particles) {
      ctx.globalAlpha = Math.max(0, particle.life);
      ctx.fillStyle = particle.color;
      ctx.shadowBlur = 12;
      ctx.shadowColor = particle.color;

      ctx.beginPath();
      ctx.arc(particle.x, particle.y, 3, 0, Math.PI * 2);
      ctx.fill();

      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
    }
  }

  function drawGame() {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const ctx = canvas.getContext("2d");

    if (!ctx) {
      return;
    }

    const runtime = runtimeRef.current;

    ctx.save();

    if (runtime.shake > 0) {
      ctx.translate(
        (Math.random() - 0.5) * runtime.shake,
        (Math.random() - 0.5) * runtime.shake
      );
    }

    ctx.fillStyle = "#101820";
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    const glow = Math.abs(Math.sin(Date.now() / 460)) * 0.12;
    ctx.fillStyle = `rgba(56, 239, 125, ${0.035 + glow})`;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.strokeStyle = "rgba(255, 255, 255, 0.035)";
    ctx.lineWidth = 1;

    for (let x = 0; x < CANVAS_WIDTH; x += 24) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, CANVAS_HEIGHT);
      ctx.stroke();
    }

    for (let y = 0; y < CANVAS_HEIGHT; y += 24) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(CANVAS_WIDTH, y);
      ctx.stroke();
    }

    for (const invader of runtime.invaders) {
      if (invader.active) {
        drawInvader(ctx, invader);
      }
    }

    drawPlayer(ctx);
    drawBullets(ctx);
    drawParticles(ctx);

    ctx.restore();
  }

  function gameLoop() {
    if (screenStateRef.current !== "playing") {
      return;
    }

    updateGame();
    drawGame();

    frameRef.current = requestAnimationFrame(gameLoop);
  }

  return {
    canvasRef,
    screenState,
    score,
    lives,
    wave,
    startGame,
    restartGame,
    backToStartScreen,
    handlePointerMove,
    handleShootAction,
  };
}