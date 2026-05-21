import { useEffect, useRef, useState } from "react";
import {
  BOSS_ATTACK_INTERVAL_MS,
  BOSS_BULLET_SPEED,
  BOSS_BURST_INTERVAL_MS,
  BOSS_MOVE_SPEED,
  BOSS_POINTS,
  BOSS_WAVE_INTERVAL,
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  ENEMY_BULLET_HEIGHT,
  ENEMY_BULLET_SPEED,
  ENEMY_BULLET_WIDTH,
  INVADER_BASE_SPEED,
  INVADER_DROP_DISTANCE,
  INVADER_SHOOT_CHANCE,
  INVADER_SHOOT_CHANCE_MAX,
  INVADER_SHOOT_CHANCE_STEP,
  INVADER_SPEED_CYCLE_LENGTH,
  INVADER_SPEED_STEP,
  LASER_BOSS_DAMAGE_PER_FRAME,
  LASER_POWER_COOLDOWN_MS,
  LASER_POWER_DURATION_MS,
  LASER_POWER_MAX_WIDTH,
  PLAYER_BULLET_HEIGHT,
  PLAYER_BULLET_SPEED,
  PLAYER_BULLET_WIDTH,
  PLAYER_MAX_LIVES,
  PLAYER_SPEED,
  POINTS_PER_INVADER,
  SHIELD_POWER_COOLDOWN_MS,
  SHIELD_POWER_MAX_HITS,
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
  createBoss,
  createInactiveBoss,
  createInitialSpaceInvadersRuntime,
  createInvaders,
} from "./spaceInvadersFactory";
import type {
  Boss,
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

function getWaveDifficultyStep(wave: number) {
  return ((wave - 1) % INVADER_SPEED_CYCLE_LENGTH) + 1;
}

function getInvaderSpeedForWave(wave: number) {
  const difficultyStep = getWaveDifficultyStep(wave);

  return INVADER_BASE_SPEED + (difficultyStep - 1) * INVADER_SPEED_STEP;
}

function getInvaderShootChanceForWave(wave: number) {
  const difficultyStep = getWaveDifficultyStep(wave);
  const nextChance =
    INVADER_SHOOT_CHANCE + (difficultyStep - 1) * INVADER_SHOOT_CHANCE_STEP;

  return Math.min(INVADER_SHOOT_CHANCE_MAX, nextChance);
}

function isBossWave(wave: number) {
  return wave > 0 && wave % BOSS_WAVE_INTERVAL === 0;
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
  const [bossHealth, setBossHealth] = useState(0);
  const [bossMaxHealth, setBossMaxHealth] = useState(0);
  const [isBossActive, setIsBossActive] = useState(false);

  const [isLaserReady, setIsLaserReady] = useState(true);
  const [isLaserActive, setIsLaserActive] = useState(false);
  const [laserCooldownProgress, setLaserCooldownProgress] = useState(1);

  const [isSupportReady, setIsSupportReady] = useState(true);
  const [isSupportActive, setIsSupportActive] = useState(false);
  const [supportCooldownProgress, setSupportCooldownProgress] = useState(1);

  const [isShieldReady, setIsShieldReady] = useState(true);
  const [isShieldActive, setIsShieldActive] = useState(false);
  const [shieldCooldownProgress, setShieldCooldownProgress] = useState(1);
  const [shieldHitsLeft, setShieldHitsLeft] = useState(SHIELD_POWER_MAX_HITS);

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

      if (event.key.toLowerCase() === "r") {
        event.preventDefault();
        handleShieldPowerAction();
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
    setIsBossActive(runtime.boss.active);
    setBossHealth(runtime.boss.active ? runtime.boss.health : 0);
    setBossMaxHealth(runtime.boss.active ? runtime.boss.maxHealth : 0);
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

    const shieldElapsedCooldown = now - runtime.shieldPower.lastBrokenAt;
    const shieldProgress = Math.min(
      1,
      Math.max(0, shieldElapsedCooldown / SHIELD_POWER_COOLDOWN_MS)
    );

    setIsShieldActive(runtime.shieldPower.active);
    setIsShieldReady(
      shieldProgress >= 1 &&
        !runtime.shieldPower.active &&
        !runtime.shieldPower.breaking
    );
    setShieldCooldownProgress(runtime.shieldPower.active ? 1 : shieldProgress);
    setShieldHitsLeft(
      Math.max(0, SHIELD_POWER_MAX_HITS - runtime.shieldPower.hitsTaken)
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
    runtime.laserPower.lastBossDamageAt = 0;
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

  function handleShieldPowerAction() {
    const runtime = runtimeRef.current;
    const now = performance.now();

    if (screenStateRef.current !== "playing") {
      return;
    }

    if (runtime.shieldPower.active || runtime.shieldPower.breaking) {
      return;
    }

    const isReady =
      now - runtime.shieldPower.lastBrokenAt >= SHIELD_POWER_COOLDOWN_MS;

    if (!isReady) {
      syncPowerState();
      return;
    }

    runtime.shieldPower.active = true;
    runtime.shieldPower.activatedAt = now;
    runtime.shieldPower.hitsTaken = 0;
    runtime.shieldPower.breaking = false;
    runtime.shieldPower.brokenAt = 0;
    runtime.shake = 4;

    createParticleExplosion(
      runtime.player.x + runtime.player.width / 2,
      runtime.player.y - 16,
      "#4facfe"
    );

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
    source: Bullet["source"],
    vx = 0
  ): Bullet {
    bulletIdRef.current += 1;

    return {
      id: bulletIdRef.current,
      x,
      y,
      width,
      height,
      vx,
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

  function shootBossBullet(x: number, y: number, vx: number, vy: number) {
    const runtime = runtimeRef.current;

    runtime.enemyBullets.push(
      createBullet(
        x,
        y,
        ENEMY_BULLET_WIDTH + 2,
        ENEMY_BULLET_HEIGHT + 2,
        vy,
        "boss",
        vx
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

    if (runtime.boss.active) {
      const bossCenter = runtime.boss.x + runtime.boss.width / 2;
      const isBossInsideLaser = bossCenter >= laserLeft && bossCenter <= laserRight;

      if (isBossInsideLaser && now - runtime.laserPower.lastBossDamageAt > 45) {
        damageBoss(LASER_BOSS_DAMAGE_PER_FRAME);
        runtime.laserPower.lastBossDamageAt = now;
      }
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

    ship.y =
      CANVAS_HEIGHT + 32 + (targetEntryY - (CANVAS_HEIGHT + 32)) * spawnProgress;

    if (spawnProgress >= 1) {
      if (now >= ship.nextMoveAt) {
        ship.targetX = clamp(
          runtime.player.x +
            runtime.player.width / 2 -
            ship.width / 2 +
            (Math.random() - 0.5) * 160,
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

  function updateShieldPower() {
    const runtime = runtimeRef.current;

    if (!runtime.shieldPower.breaking) {
      return;
    }

    const now = performance.now();
    const elapsed = now - runtime.shieldPower.brokenAt;

    if (elapsed >= 520) {
      runtime.shieldPower.breaking = false;
      syncPowerState();
    }
  }

  function startBossWave(nextWave: number) {
    const runtime = runtimeRef.current;

    runtime.wave = nextWave;
    runtime.invaders = [];
    runtime.boss = createBoss();
    runtime.enemyBullets = [];
    runtime.invaderDirection = 1;
    runtime.invaderSpeed = getInvaderSpeedForWave(nextWave);
    runtime.shake = 12;

    createParticleExplosion(CANVAS_WIDTH / 2, 86, "#be2edd");
    createParticleExplosion(CANVAS_WIDTH / 2, 86, "#f1c40f");

    syncStateFromRuntime();
  }

  function advanceToNextNormalWave(nextWave: number) {
    const runtime = runtimeRef.current;

    runtime.wave = nextWave;
    runtime.boss = createInactiveBoss();
    runtime.invaders = createInvaders(nextWave);
    runtime.enemyBullets = [];
    runtime.invaderDirection = 1;
    runtime.invaderSpeed = getInvaderSpeedForWave(nextWave);

    syncStateFromRuntime();
  }

  function updateInvaders() {
    const runtime = runtimeRef.current;

    if (runtime.boss.active) {
      return;
    }

    const activeInvaders = runtime.invaders.filter((invader) => invader.active);

    if (activeInvaders.length === 0) {
      const nextWave = runtime.wave + 1;

      runtime.score += WAVE_CLEAR_BONUS;
      runtime.lives = Math.min(PLAYER_MAX_LIVES, runtime.lives + 1);

      if (isBossWave(nextWave)) {
        startBossWave(nextWave);
        return;
      }

      advanceToNextNormalWave(nextWave);
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

    if (randomShooter && Math.random() < getInvaderShootChanceForWave(runtime.wave)) {
      shootEnemyBullet(randomShooter);
    }

    const hasInvaderReachedPlayer = activeInvaders.some((invader) => {
      return invader.y + invader.height >= runtime.player.y - 12;
    });

    if (hasInvaderReachedPlayer) {
      showGameOver();
    }
  }

  function updateBoss() {
    const runtime = runtimeRef.current;
    const boss = runtime.boss;

    if (!boss.active) {
      return;
    }

    const now = performance.now();

    boss.x += boss.direction * BOSS_MOVE_SPEED;

    if (boss.x <= 28) {
      boss.x = 28;
      boss.direction = 1;
    }

    if (boss.x + boss.width >= CANVAS_WIDTH - 28) {
      boss.x = CANVAS_WIDTH - boss.width - 28;
      boss.direction = -1;
    }

    if (now >= boss.nextAttackAt) {
      boss.burstShotsLeft = 3;
      boss.nextBurstShotAt = now;
      boss.nextAttackAt = now + BOSS_ATTACK_INTERVAL_MS;
    }

    if (boss.burstShotsLeft > 0 && now >= boss.nextBurstShotAt) {
      const bossCenterX = boss.x + boss.width / 2;
      const bulletY = boss.y + boss.height - 6;

      shootBossBullet(bossCenterX - 4, bulletY, 0, BOSS_BULLET_SPEED);
      shootBossBullet(bossCenterX - 24, bulletY, -1.25, BOSS_BULLET_SPEED * 0.92);
      shootBossBullet(bossCenterX + 20, bulletY, 1.25, BOSS_BULLET_SPEED * 0.92);

      boss.burstShotsLeft -= 1;
      boss.nextBurstShotAt = now + BOSS_BURST_INTERVAL_MS;
    }
  }

  function updateBullets() {
    const runtime = runtimeRef.current;

    for (const bullet of runtime.playerBullets) {
      bullet.x += bullet.vx;
      bullet.y += bullet.vy;
    }

    for (const bullet of runtime.enemyBullets) {
      bullet.x += bullet.vx;
      bullet.y += bullet.vy;
    }

    runtime.playerBullets = runtime.playerBullets.filter((bullet) => {
      return (
        bullet.active &&
        bullet.y + bullet.height > 0 &&
        bullet.x + bullet.width > -20 &&
        bullet.x < CANVAS_WIDTH + 20
      );
    });

    runtime.enemyBullets = runtime.enemyBullets.filter((bullet) => {
      return (
        bullet.active &&
        bullet.y < CANVAS_HEIGHT + bullet.height &&
        bullet.x + bullet.width > -20 &&
        bullet.x < CANVAS_WIDTH + 20
      );
    });
  }

  function damageBoss(amount: number) {
    const runtime = runtimeRef.current;

    if (!runtime.boss.active) {
      return;
    }

    runtime.boss.health = Math.max(0, runtime.boss.health - amount);
    runtime.shake = Math.max(runtime.shake, 3);

    if (runtime.boss.health <= 0) {
      defeatBoss();
    }

    syncStateFromRuntime();
  }

  function defeatBoss() {
    const runtime = runtimeRef.current;
    const boss = runtime.boss;

    if (!boss.active) {
      return;
    }

    runtime.score += BOSS_POINTS;
    runtime.lives = Math.min(PLAYER_MAX_LIVES, runtime.lives + 1);
    runtime.enemyBullets = [];
    runtime.boss.active = false;
    runtime.boss.defeated = true;
    runtime.shake = 18;

    createParticleExplosion(boss.x + boss.width / 2, boss.y + boss.height / 2, "#be2edd");
    createParticleExplosion(boss.x + boss.width / 2, boss.y + boss.height / 2, "#f1c40f");
    createParticleExplosion(boss.x + boss.width / 2, boss.y + boss.height / 2, "#4facfe");

    const nextWave = runtime.wave + 1;
    advanceToNextNormalWave(nextWave);
  }

  function handlePlayerBulletCollisions() {
    const runtime = runtimeRef.current;

    for (const bullet of runtime.playerBullets) {
      if (!bullet.active) {
        continue;
      }

      if (runtime.boss.active && isColliding(bullet, runtime.boss)) {
        bullet.active = false;
        damageBoss(bullet.source === "support" ? 12 : 18);

        createParticleExplosion(
          bullet.x + bullet.width / 2,
          bullet.y + bullet.height / 2,
          "#f1c40f"
        );

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

  function getShieldHitBox() {
    const runtime = runtimeRef.current;
    const { player } = runtime;

    return {
      x: player.x - 18,
      y: player.y - 38,
      width: player.width + 36,
      height: 42,
    };
  }

  function breakShield() {
    const runtime = runtimeRef.current;
    const shieldCenter = runtime.player.x + runtime.player.width / 2;
    const shieldY = runtime.player.y - 18;
    const now = performance.now();

    runtime.shieldPower.active = false;
    runtime.shieldPower.breaking = true;
    runtime.shieldPower.brokenAt = now;
    runtime.shieldPower.lastBrokenAt = now;
    runtime.shake = 10;

    createParticleExplosion(shieldCenter, shieldY, "#4facfe");
    createParticleExplosion(shieldCenter, shieldY, "#ffffff");

    syncPowerState();
  }

  function handleShieldBulletCollisions() {
    const runtime = runtimeRef.current;

    if (!runtime.shieldPower.active) {
      return;
    }

    const shieldHitBox = getShieldHitBox();

    for (const bullet of runtime.enemyBullets) {
      if (!bullet.active) {
        continue;
      }

      if (!isColliding(bullet, shieldHitBox)) {
        continue;
      }

      bullet.active = false;
      runtime.shieldPower.hitsTaken += 1;
      runtime.shake = 5;

      createParticleExplosion(
        bullet.x + bullet.width / 2,
        bullet.y + bullet.height / 2,
        "#4facfe"
      );

      if (runtime.shieldPower.hitsTaken >= SHIELD_POWER_MAX_HITS) {
        breakShield();
      }

      syncPowerState();
      break;
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
    updateShieldPower();
    updateBoss();
    updateInvaders();
    updateBullets();
    handlePlayerBulletCollisions();
    handleShieldBulletCollisions();
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

  function drawShield(ctx: CanvasRenderingContext2D) {
    const runtime = runtimeRef.current;
    const shield = runtime.shieldPower;

    if (!shield.active && !shield.breaking) {
      return;
    }

    const { player } = runtime;
    const centerX = player.x + player.width / 2;
    const shieldY = player.y - 24;

    const now = performance.now();

    const spawnProgress = shield.active
      ? Math.min(1, (now - shield.activatedAt) / 280)
      : 1;

    const breakProgress = shield.breaking
      ? Math.min(1, (now - shield.brokenAt) / 520)
      : 0;

    const pulse = Math.abs(Math.sin(now / 120));
    const damageRatio = shield.hitsTaken / SHIELD_POWER_MAX_HITS;

    const shieldColor = damageRatio >= 0.5 ? "#f1c40f" : "#4facfe";
    const shieldGlow = damageRatio >= 0.5 ? "#f9ca24" : "#00f2fe";

    const baseAlpha = shield.breaking
      ? Math.max(0, 1 - breakProgress)
      : 0.62 + pulse * 0.16;

    const shieldWidth =
      112 * spawnProgress * (shield.breaking ? 1 + breakProgress * 0.26 : 1);

    const shieldHeight =
      48 * spawnProgress * (shield.breaking ? 1 + breakProgress * 0.18 : 1);

    ctx.save();

    ctx.globalAlpha = baseAlpha;

    const auraGradient = ctx.createRadialGradient(
      centerX,
      shieldY,
      4,
      centerX,
      shieldY,
      shieldWidth * 0.72
    );

    auraGradient.addColorStop(0, "rgba(255, 255, 255, 0.28)");
    auraGradient.addColorStop(
      0.35,
      damageRatio >= 0.5
        ? "rgba(241, 196, 15, 0.22)"
        : "rgba(79, 172, 254, 0.24)"
    );
    auraGradient.addColorStop(1, "rgba(79, 172, 254, 0)");

    ctx.fillStyle = auraGradient;
    ctx.beginPath();
    ctx.ellipse(
      centerX,
      shieldY + 6,
      shieldWidth * 0.62,
      shieldHeight * 0.72,
      0,
      Math.PI,
      Math.PI * 2
    );
    ctx.fill();

    ctx.shadowBlur = 28 + pulse * 10;
    ctx.shadowColor = shieldGlow;
    ctx.lineWidth = damageRatio >= 0.5 ? 4 : 5;
    ctx.strokeStyle = shieldColor;

    const shieldGradient = ctx.createLinearGradient(
      centerX - shieldWidth / 2,
      shieldY - shieldHeight,
      centerX + shieldWidth / 2,
      shieldY + shieldHeight
    );

    shieldGradient.addColorStop(0, "rgba(255, 255, 255, 0.32)");
    shieldGradient.addColorStop(
      0.45,
      damageRatio >= 0.5
        ? "rgba(241, 196, 15, 0.24)"
        : "rgba(79, 172, 254, 0.26)"
    );
    shieldGradient.addColorStop(
      1,
      damageRatio >= 0.5
        ? "rgba(241, 196, 15, 0.04)"
        : "rgba(79, 172, 254, 0.04)"
    );

    ctx.beginPath();
    ctx.moveTo(centerX - shieldWidth / 2, shieldY + shieldHeight * 0.38);
    ctx.quadraticCurveTo(
      centerX,
      shieldY - shieldHeight * 1.08,
      centerX + shieldWidth / 2,
      shieldY + shieldHeight * 0.38
    );
    ctx.quadraticCurveTo(
      centerX,
      shieldY + shieldHeight * 0.82,
      centerX - shieldWidth / 2,
      shieldY + shieldHeight * 0.38
    );
    ctx.closePath();
    ctx.fillStyle = shieldGradient;
    ctx.fill();
    ctx.stroke();

    ctx.globalAlpha = baseAlpha * 0.62;
    ctx.shadowBlur = 14;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.72)";
    ctx.lineWidth = 1.6;

    ctx.beginPath();
    ctx.moveTo(centerX - shieldWidth * 0.36, shieldY + shieldHeight * 0.28);
    ctx.quadraticCurveTo(
      centerX,
      shieldY - shieldHeight * 0.72,
      centerX + shieldWidth * 0.36,
      shieldY + shieldHeight * 0.28
    );
    ctx.stroke();

    ctx.globalAlpha = baseAlpha * 0.74;
    ctx.strokeStyle = shieldColor;
    ctx.lineWidth = 2;

    for (let index = 0; index < 5; index++) {
      const offset = -0.42 + index * 0.21;
      const arcX = centerX + offset * shieldWidth;
      const arcY = shieldY + shieldHeight * (0.28 + Math.abs(offset) * 0.22);

      ctx.beginPath();
      ctx.arc(arcX, arcY, 3 + pulse * 1.4, 0, Math.PI * 2);
      ctx.stroke();
    }

    if (shield.hitsTaken >= 1 || shield.breaking) {
      ctx.globalAlpha = Math.max(0, baseAlpha * 0.95);
      ctx.shadowBlur = 12;
      ctx.shadowColor = "#ffffff";
      ctx.strokeStyle = "rgba(255, 255, 255, 0.92)";
      ctx.lineWidth = 2.2;

      ctx.beginPath();
      ctx.moveTo(centerX - 12, shieldY - 22);
      ctx.lineTo(centerX - 4, shieldY - 8);
      ctx.lineTo(centerX - 15, shieldY + 4);
      ctx.lineTo(centerX - 6, shieldY + 15);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(centerX + 18, shieldY - 18);
      ctx.lineTo(centerX + 7, shieldY - 4);
      ctx.lineTo(centerX + 17, shieldY + 8);
      ctx.lineTo(centerX + 10, shieldY + 18);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(centerX + 2, shieldY - 30);
      ctx.lineTo(centerX + 1, shieldY - 15);
      ctx.lineTo(centerX - 5, shieldY - 2);
      ctx.stroke();
    }

    if (shield.breaking) {
      ctx.globalAlpha = Math.max(0, 1 - breakProgress);
      ctx.shadowBlur = 18;
      ctx.shadowColor = "#ffffff";
      ctx.strokeStyle = "rgba(255, 255, 255, 0.96)";
      ctx.lineWidth = 2.2;

      const burstDistance = 24 + breakProgress * 58;

      for (let index = 0; index < 12; index++) {
        const angle = (Math.PI * 2 * index) / 12;
        const startX = centerX + Math.cos(angle) * 16;
        const startY = shieldY + Math.sin(angle) * 8;
        const endX = centerX + Math.cos(angle) * burstDistance;
        const endY = shieldY + Math.sin(angle) * burstDistance * 0.55;

        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
      }

      ctx.globalAlpha = Math.max(0, 0.44 - breakProgress * 0.44);
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(centerX, shieldY, 22 + breakProgress * 42, 0, Math.PI * 2);
      ctx.fill();
    }

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

  function drawBoss(ctx: CanvasRenderingContext2D, boss: Boss) {
    if (!boss.active) {
      return;
    }

    const centerX = boss.x + boss.width / 2;
    const centerY = boss.y + boss.height / 2;
    const pulse = Math.abs(Math.sin(Date.now() / 180));

    ctx.save();

    ctx.shadowBlur = 30 + pulse * 12;
    ctx.shadowColor = "#be2edd";

    const bodyGradient = ctx.createLinearGradient(
      boss.x,
      boss.y,
      boss.x + boss.width,
      boss.y + boss.height
    );

    bodyGradient.addColorStop(0, "#4facfe");
    bodyGradient.addColorStop(0.35, "#be2edd");
    bodyGradient.addColorStop(0.7, "#f1c40f");
    bodyGradient.addColorStop(1, "#38ef7d");

    ctx.fillStyle = bodyGradient;

    ctx.beginPath();
    ctx.ellipse(centerX, centerY, boss.width / 2, boss.height / 2, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "rgba(0, 0, 0, 0.28)";
    ctx.beginPath();
    ctx.ellipse(centerX, centerY + 8, boss.width * 0.36, boss.height * 0.22, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 18;
    ctx.shadowColor = "#ffffff";
    ctx.fillStyle = "#ffffff";

    ctx.beginPath();
    ctx.arc(centerX - 34, centerY - 8, 10, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(centerX + 34, centerY - 8, 10, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#101820";

    ctx.beginPath();
    ctx.arc(centerX - 34 + boss.direction * 2, centerY - 7, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(centerX + 34 + boss.direction * 2, centerY - 7, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 20;
    ctx.shadowColor = "#ff4757";
    ctx.fillStyle = "#ff4757";
    drawRoundedRect(ctx, centerX - 26, boss.y + boss.height - 13, 52, 6, 999);

    ctx.shadowBlur = 14;
    ctx.shadowColor = "#f1c40f";
    ctx.strokeStyle = "#f1c40f";
    ctx.lineWidth = 3;

    ctx.beginPath();
    ctx.moveTo(boss.x + 10, centerY + 8);
    ctx.lineTo(boss.x - 22, centerY + 28);
    ctx.lineTo(boss.x + 18, centerY + 28);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(boss.x + boss.width - 10, centerY + 8);
    ctx.lineTo(boss.x + boss.width + 22, centerY + 28);
    ctx.lineTo(boss.x + boss.width - 18, centerY + 28);
    ctx.stroke();

    ctx.globalAlpha = 0.55 + pulse * 0.24;
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 1.5;

    ctx.beginPath();
    ctx.ellipse(centerX, centerY, boss.width * 0.44, boss.height * 0.36, 0, 0, Math.PI * 2);
    ctx.stroke();

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

    const gradient = ctx.createLinearGradient(
      x - laserWidth / 2,
      0,
      x + laserWidth / 2,
      0
    );

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
      const isBossBullet = bullet.source === "boss";

      ctx.shadowBlur = isBossBullet ? 20 : 14;
      ctx.shadowColor = isBossBullet ? "#be2edd" : "#ff4757";
      ctx.fillStyle = isBossBullet ? "#be2edd" : "#ff4757";

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

    if (runtime.boss.active) {
      drawBoss(ctx, runtime.boss);
    }

    for (const invader of runtime.invaders) {
      if (invader.active) {
        drawInvader(ctx, invader);
      }
    }

    drawSupportShip(ctx);
    drawPlayer(ctx);
    drawShield(ctx);
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
    isBossActive,
    bossHealth,
    bossMaxHealth,
    isLaserReady,
    isLaserActive,
    laserCooldownProgress,
    isSupportReady,
    isSupportActive,
    supportCooldownProgress,
    isShieldReady,
    isShieldActive,
    shieldCooldownProgress,
    shieldHitsLeft,
    startGame,
    restartGame,
    backToStartScreen,
    handlePointerMove,
    handleShootAction,
    handleLaserPowerAction,
    handleSupportPowerAction,
    handleShieldPowerAction,
  };
}