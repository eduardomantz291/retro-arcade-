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
  LASER_POWER_COOLDOWN_MS,
  LASER_POWER_DURATION_MS,
  LASER_POWER_MAX_WIDTH,
  PLAYER_BULLET_HEIGHT,
  PLAYER_BULLET_SPEED,
  PLAYER_BULLET_WIDTH,
  PLAYER_SPEED,
  POINTS_PER_INVADER,
  SUPPORT_BULLET_HEIGHT,
  SUPPORT_BULLET_SPEED,
  SUPPORT_BULLET_WIDTH,
  SUPPORT_SHIP_COOLDOWN_MS,
  SUPPORT_SHIP_DURATION_MS,
  SUPPORT_SHIP_MOVE_INTERVAL_MS,
  SUPPORT_SHIP_SHOOT_INTERVAL_MS,
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
  SupportShip,
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

  const [isLaserReady, setIsLaserReady] = useState(true);
  const [isLaserActive, setIsLaserActive] = useState(false);
  const [laserCooldownProgress, setLaserCooldownProgress] = useState(1);

  const [isSupportReady, setIsSupportReady] = useState(true);
  const [isSupportActive, setIsSupportActive] = useState(false);
  const [supportCooldownProgress, setSupportCooldownProgress] = useState(1);

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

      if (event.key.toLowerCase() === "q") {
        event.preventDefault();
        handleLaserPowerAction();
      }

      if (event.key.toLowerCase() === "e") {
        event.preventDefault();
        handleSupportPowerAction();
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

  function syncPowerState() {
    const runtime = runtimeRef.current;
    const now = performance.now();

    const laserElapsedCooldown = now - runtime.laserPower.lastUsedAt;
    const laserProgress = Math.min(
      1,
      Math.max(0, laserElapsedCooldown / LASER_POWER_COOLDOWN_MS)
    );

    setIsLaserActive(runtime.laserPower.active);
    setIsLaserReady(laserProgress >= 1 && !runtime.laserPower.active);
    setLaserCooldownProgress(runtime.laserPower.active ? 1 : laserProgress);

    const supportElapsedCooldown = now - runtime.supportPower.lastUsedAt;
    const supportProgress = Math.min(
      1,
      Math.max(0, supportElapsedCooldown / SUPPORT_SHIP_COOLDOWN_MS)
    );

    setIsSupportActive(runtime.supportPower.ship.active);
    setIsSupportReady(supportProgress >= 1 && !runtime.supportPower.ship.active);
    setSupportCooldownProgress(
      runtime.supportPower.ship.active ? 1 : supportProgress
    );
  }

  function startGame() {
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
    }

    bulletIdRef.current = 0;
    runtimeRef.current = createInitialSpaceInvadersRuntime();

    syncStateFromRuntime();
    syncPowerState();
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
    syncPowerState();
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

    const runtime = runtimeRef.current;

    if (runtime.laserPower.active) {
      return;
    }

    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_WIDTH / rect.width;
    const pointerX = (clientX - rect.left) * scaleX;

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

  function handleLaserPowerAction() {
    const runtime = runtimeRef.current;
    const now = performance.now();

    if (screenStateRef.current !== "playing") {
      return;
    }

    if (runtime.laserPower.active) {
      return;
    }

    const isReady = now - runtime.laserPower.lastUsedAt >= LASER_POWER_COOLDOWN_MS;

    if (!isReady) {
      syncPowerState();
      return;
    }

    runtime.laserPower.active = true;
    runtime.laserPower.activatedAt = now;
    runtime.laserPower.lastUsedAt = now;
    runtime.laserPower.x = runtime.player.x + runtime.player.width / 2;

    runtime.keys.left = false;
    runtime.keys.right = false;
    runtime.player.targetX = runtime.player.x;
    runtime.shake = 7;

    createParticleExplosion(runtime.laserPower.x, runtime.player.y, "#4facfe");

    syncPowerState();
  }

  function handleSupportPowerAction() {
    const runtime = runtimeRef.current;
    const now = performance.now();

    if (screenStateRef.current !== "playing") {
      return;
    }

    if (runtime.supportPower.ship.active) {
      return;
    }

    const isReady =
      now - runtime.supportPower.lastUsedAt >= SUPPORT_SHIP_COOLDOWN_MS;

    if (!isReady) {
      syncPowerState();
      return;
    }

    const playerCenter = runtime.player.x + runtime.player.width / 2;

    runtime.supportPower.lastUsedAt = now;
    runtime.supportPower.ship = {
      active: true,
      x: clamp(playerCenter - 18, 8, CANVAS_WIDTH - 44),
      y: CANVAS_HEIGHT + 32,
      targetX: clamp(playerCenter - 18, 8, CANVAS_WIDTH - 44),
      width: 36,
      height: 20,
      spawnedAt: now,
      expiresAt: now + SUPPORT_SHIP_DURATION_MS,
      nextMoveAt: now + 350,
      nextShotAt: now + 450,
    };

    createParticleExplosion(playerCenter, runtime.player.y, "#f1c40f");
    syncPowerState();
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
    vy: number,
    source: Bullet["source"]
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
      source,
    };
  }

  function shootPlayerBullet() {
    const runtime = runtimeRef.current;
    const now = performance.now();

    if (runtime.laserPower.active) {
      return;
    }

    if (now - runtime.lastPlayerShotAt < 240) {
      return;
    }

    const hasActivePlayerBullet = runtime.playerBullets.some((bullet) => {
      return bullet.active && bullet.source === "player";
    });

    if (hasActivePlayerBullet) {
      return;
    }

    runtime.lastPlayerShotAt = now;

    runtime.playerBullets.push(
      createBullet(
        runtime.player.x + runtime.player.width / 2 - PLAYER_BULLET_WIDTH / 2,
        runtime.player.y - PLAYER_BULLET_HEIGHT,
        PLAYER_BULLET_WIDTH,
        PLAYER_BULLET_HEIGHT,
        -PLAYER_BULLET_SPEED,
        "player"
      )
    );
  }

  function shootSupportBullets(ship: SupportShip) {
    const runtime = runtimeRef.current;

    const leftGunX = ship.x + ship.width * 0.3 - SUPPORT_BULLET_WIDTH / 2;
    const rightGunX = ship.x + ship.width * 0.7 - SUPPORT_BULLET_WIDTH / 2;

    runtime.playerBullets.push(
      createBullet(
        leftGunX,
        ship.y - SUPPORT_BULLET_HEIGHT,
        SUPPORT_BULLET_WIDTH,
        SUPPORT_BULLET_HEIGHT,
        -SUPPORT_BULLET_SPEED,
        "support"
      )
    );

    runtime.playerBullets.push(
      createBullet(
        rightGunX,
        ship.y - SUPPORT_BULLET_HEIGHT,
        SUPPORT_BULLET_WIDTH,
        SUPPORT_BULLET_HEIGHT,
        -SUPPORT_BULLET_SPEED,
        "support"
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
        ENEMY_BULLET_SPEED,
        "enemy"
      )
    );
  }

  function updatePlayer() {
    const runtime = runtimeRef.current;
    const { player, keys } = runtime;

    if (runtime.laserPower.active) {
      player.targetX = player.x;
      return;
    }

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

  function updateLaserPower() {
    const runtime = runtimeRef.current;

    if (!runtime.laserPower.active) {
      return;
    }

    const now = performance.now();
    const elapsed = now - runtime.laserPower.activatedAt;

    if (elapsed >= LASER_POWER_DURATION_MS) {
      runtime.laserPower.active = false;
      syncPowerState();
      return;
    }

    const progress = Math.min(1, elapsed / LASER_POWER_DURATION_MS);
    const growProgress = Math.min(1, progress / 0.45);
    const laserWidth = 8 + (LASER_POWER_MAX_WIDTH - 8) * growProgress;
    const laserLeft = runtime.laserPower.x - laserWidth / 2;
    const laserRight = runtime.laserPower.x + laserWidth / 2;

    for (const invader of runtime.invaders) {
      if (!invader.active) {
        continue;
      }

      const invaderCenterX = invader.x + invader.width / 2;
      const isInsideLaser =
        invaderCenterX >= laserLeft && invaderCenterX <= laserRight;

      if (!isInsideLaser) {
        continue;
      }

      invader.active = false;
      runtime.score += POINTS_PER_INVADER;
      runtime.shake = Math.max(runtime.shake, 4);

      createParticleExplosion(
        invader.x + invader.width / 2,
        invader.y + invader.height / 2,
        "#4facfe"
      );
    }

    syncStateFromRuntime();
  }

  function updateSupportShip() {
    const runtime = runtimeRef.current;
    const ship = runtime.supportPower.ship;

    if (!ship.active) {
      return;
    }

    const now = performance.now();

    if (now >= ship.expiresAt) {
      createParticleExplosion(ship.x + ship.width / 2, ship.y, "#f1c40f");

      ship.active = false;
      syncPowerState();
      return;
    }

    const spawnProgress = Math.min(1, (now - ship.spawnedAt) / 450);
    const targetEntryY = runtime.player.y - 44;

    ship.y = CANVAS_HEIGHT + 32 + (targetEntryY - (CANVAS_HEIGHT + 32)) * spawnProgress;

    if (spawnProgress >= 1) {
      if (now >= ship.nextMoveAt) {
        ship.targetX = clamp(
          runtime.player.x + runtime.player.width / 2 - ship.width / 2 + (Math.random() - 0.5) * 160,
          8,
          CANVAS_WIDTH - ship.width - 8
        );

        ship.nextMoveAt = now + SUPPORT_SHIP_MOVE_INTERVAL_MS;
      }

      ship.x += (ship.targetX - ship.x) * 0.05;
    }

    if (now >= ship.nextShotAt) {
      shootSupportBullets(ship);
      ship.nextShotAt = now + SUPPORT_SHIP_SHOOT_INTERVAL_MS;
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

      runtime.invaderSpeed = INVADER_BASE_SPEED + runtime.wave * 0.08;

      syncStateFromRuntime();
      return;
    }

    const leftMost = Math.min(...activeInvaders.map((invader) => invader.x));
    const rightMost = Math.max(
      ...activeInvaders.map((invader) => invader.x + invader.width)
    );

    const shouldDrop =
      (rightMost >= CANVAS_WIDTH - 24 && runtime.invaderDirection === 1) ||
      (leftMost <= 24 && runtime.invaderDirection === -1);

    if (shouldDrop) {
      runtime.invaderDirection *= -1;

      for (const invader of activeInvaders) {
        invader.y += INVADER_DROP_DISTANCE;
      }

      runtime.shake = 2.5;
    } else {
      const speedBonus = Math.max(
        0,
        1 - activeInvaders.length / runtime.invaders.length
      );

      const speed = runtime.invaderSpeed + speedBonus * 0.75;

      for (const invader of activeInvaders) {
        invader.x += speed * runtime.invaderDirection;
      }
    }

    const randomShooter =
      activeInvaders[Math.floor(Math.random() * activeInvaders.length)];

    if (
      randomShooter &&
      Math.random() < INVADER_SHOOT_CHANCE + runtime.wave * 0.0008
    ) {
      shootEnemyBullet(randomShooter);
    }

    const hasInvaderReachedPlayer = activeInvaders.some((invader) => {
      return invader.y + invader.height >= runtime.player.y - 12;
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
          runtime.shake = 2.5;

          createParticleExplosion(
            invader.x + invader.width / 2,
            invader.y + invader.height / 2,
            invader.glow
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
    syncPowerState();
    updatePlayer();
    updateSupportShip();
    updateLaserPower();
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
    syncPowerState();
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
    const centerX = player.x + player.width / 2;
    const bottomY = player.y + player.height;

    ctx.save();

    ctx.shadowBlur = 22;
    ctx.shadowColor = "#4facfe";

    const baseGradient = ctx.createLinearGradient(
      player.x,
      player.y,
      player.x + player.width,
      bottomY
    );

    baseGradient.addColorStop(0, "#00f2fe");
    baseGradient.addColorStop(0.5, "#4facfe");
    baseGradient.addColorStop(1, "#38ef7d");

    ctx.fillStyle = baseGradient;
    drawRoundedRect(ctx, player.x + 3, player.y + 13, player.width - 6, 12, 999);

    const bodyGradient = ctx.createLinearGradient(
      centerX,
      player.y,
      centerX,
      bottomY
    );

    bodyGradient.addColorStop(0, "#ffffff");
    bodyGradient.addColorStop(0.36, "#4facfe");
    bodyGradient.addColorStop(1, "#11998e");

    ctx.fillStyle = bodyGradient;
    ctx.beginPath();
    ctx.moveTo(centerX, player.y - 2);
    ctx.lineTo(player.x + player.width - 5, bottomY);
    ctx.lineTo(centerX + 10, bottomY - 5);
    ctx.lineTo(centerX, bottomY - 1);
    ctx.lineTo(centerX - 10, bottomY - 5);
    ctx.lineTo(player.x + 5, bottomY);
    ctx.closePath();
    ctx.fill();

    ctx.shadowBlur = 16;
    ctx.shadowColor = "#f1c40f";
    ctx.fillStyle = "#f1c40f";
    ctx.beginPath();
    ctx.ellipse(centerX, player.y + 12, 6, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 12;
    ctx.shadowColor = "#ffffff";
    ctx.fillStyle = "#ffffff";
    drawRoundedRect(ctx, centerX - 3, player.y + 1, 6, 16, 999);

    ctx.shadowBlur = 14;
    ctx.shadowColor = "#38ef7d";
    ctx.fillStyle = "rgba(56, 239, 125, 0.92)";

    ctx.beginPath();
    ctx.moveTo(player.x + 8, bottomY - 2);
    ctx.lineTo(player.x - 2, bottomY + 8);
    ctx.lineTo(player.x + 22, bottomY - 4);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(player.x + player.width - 8, bottomY - 2);
    ctx.lineTo(player.x + player.width + 2, bottomY + 8);
    ctx.lineTo(player.x + player.width - 22, bottomY - 4);
    ctx.closePath();
    ctx.fill();

    if (runtimeRef.current.laserPower.active) {
      ctx.globalAlpha = 0.42;
      ctx.shadowBlur = 24;
      ctx.shadowColor = "#4facfe";
      ctx.strokeStyle = "#4facfe";
      ctx.lineWidth = 2;

      ctx.beginPath();
      ctx.arc(centerX, player.y + 10, 34, 0, Math.PI * 2);
      ctx.stroke();

      ctx.globalAlpha = 1;
    }

    ctx.restore();
  }

  function drawSupportShip(ctx: CanvasRenderingContext2D) {
    const ship = runtimeRef.current.supportPower.ship;

    if (!ship.active) {
      return;
    }

    const centerX = ship.x + ship.width / 2;
    const centerY = ship.y + ship.height / 2;
    const pulse = Math.abs(Math.sin(Date.now() / 120)) * 4;

    ctx.save();

    ctx.globalAlpha = 0.9;
    ctx.shadowBlur = 18 + pulse;
    ctx.shadowColor = "#f1c40f";

    ctx.fillStyle = "#f1c40f";
    ctx.beginPath();
    ctx.moveTo(centerX, ship.y - 2);
    ctx.lineTo(ship.x + ship.width, ship.y + ship.height);
    ctx.lineTo(ship.x, ship.y + ship.height);
    ctx.closePath();
    ctx.fill();

    ctx.shadowBlur = 12;
    ctx.shadowColor = "#38ef7d";
    ctx.fillStyle = "#38ef7d";
    drawRoundedRect(ctx, ship.x + 5, centerY, ship.width - 10, 7, 999);

    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(centerX, centerY, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  function drawInvader(ctx: CanvasRenderingContext2D, invader: Invader) {
    const pulse = Math.abs(Math.sin(Date.now() / 220)) * 3;

    ctx.save();

    ctx.shadowBlur = 14 + pulse;
    ctx.shadowColor = invader.glow;
    ctx.fillStyle = invader.color;

    if (invader.variant === "square") {
      drawRoundedRect(
        ctx,
        invader.x,
        invader.y,
        invader.width,
        invader.height,
        7
      );
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
    ctx.fillStyle = "rgba(255, 255, 255, 0.22)";
    drawRoundedRect(
      ctx,
      invader.x + 6,
      invader.y + 4,
      invader.width - 12,
      4,
      999
    );

    ctx.fillStyle = "rgba(0, 0, 0, 0.72)";

    ctx.beginPath();
    ctx.arc(
      invader.x + invader.width * 0.35,
      invader.y + invader.height * 0.48,
      2.3,
      0,
      Math.PI * 2
    );
    ctx.fill();

    ctx.beginPath();
    ctx.arc(
      invader.x + invader.width * 0.65,
      invader.y + invader.height * 0.48,
      2.3,
      0,
      Math.PI * 2
    );
    ctx.fill();

    ctx.restore();
  }

  function drawLaserPower(ctx: CanvasRenderingContext2D) {
    const runtime = runtimeRef.current;

    if (!runtime.laserPower.active) {
      return;
    }

    const elapsed = performance.now() - runtime.laserPower.activatedAt;
    const progress = Math.min(1, elapsed / LASER_POWER_DURATION_MS);
    const growProgress = Math.min(1, progress / 0.45);
    const fadeOut = progress > 0.72 ? 1 - (progress - 0.72) / 0.28 : 1;

    const laserWidth = 8 + (LASER_POWER_MAX_WIDTH - 8) * growProgress;
    const x = runtime.laserPower.x;

    ctx.save();

    ctx.globalAlpha = Math.max(0, fadeOut);
    ctx.shadowBlur = 34;
    ctx.shadowColor = "#4facfe";

    const gradient = ctx.createLinearGradient(x - laserWidth / 2, 0, x + laserWidth / 2, 0);
    gradient.addColorStop(0, "rgba(79, 172, 254, 0.08)");
    gradient.addColorStop(0.35, "rgba(79, 172, 254, 0.75)");
    gradient.addColorStop(0.5, "rgba(255, 255, 255, 0.98)");
    gradient.addColorStop(0.65, "rgba(79, 172, 254, 0.75)");
    gradient.addColorStop(1, "rgba(79, 172, 254, 0.08)");

    ctx.fillStyle = gradient;
    ctx.fillRect(x - laserWidth / 2, 0, laserWidth, runtime.player.y + 20);

    ctx.globalAlpha = Math.max(0, fadeOut * 0.4);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(x - 2, 0, 4, runtime.player.y + 20);

    ctx.restore();
  }

  function drawBullets(ctx: CanvasRenderingContext2D) {
    const runtime = runtimeRef.current;

    for (const bullet of runtime.playerBullets) {
      const isSupportBullet = bullet.source === "support";

      ctx.shadowBlur = isSupportBullet ? 14 : 16;
      ctx.shadowColor = isSupportBullet ? "#38ef7d" : "#f1c40f";
      ctx.fillStyle = isSupportBullet ? "#38ef7d" : "#f1c40f";

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

    drawSupportShip(ctx);
    drawPlayer(ctx);
    drawLaserPower(ctx);
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
    isLaserReady,
    isLaserActive,
    laserCooldownProgress,
    isSupportReady,
    isSupportActive,
    supportCooldownProgress,
    startGame,
    restartGame,
    backToStartScreen,
    handlePointerMove,
    handleShootAction,
    handleLaserPowerAction,
    handleSupportPowerAction,
  };
}