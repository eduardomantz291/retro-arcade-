// Hook principal do Space Invaders.
// Orquestra estado, loop, entradas, colisões, bosses, poderes e desenho no canvas.

import { useEffect, useRef, useState } from "react";
import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  DEBUG_BOSS_WAVE,
  DEBUG_PLAYER_LIVES_BY_BOSS_WAVE,
  DEBUG_PLAYER_LIVES_OVERRIDE,
  DEBUG_START_ON_BOSS_WAVE,
  ENEMY_BULLET_HEIGHT,
  ENEMY_BULLET_WIDTH,
  INVADER_DROP_DISTANCE,
  LASER_BOSS_DAMAGE_PER_FRAME,
  LASER_POWER_COOLDOWN_MS,
  LASER_POWER_DURATION_MS,
  LASER_POWER_MAX_WIDTH,
  PLAYER_BULLET_HEIGHT,
  PLAYER_BULLET_SPEED,
  PLAYER_BULLET_WIDTH,
  PLAYER_LIVES,
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
  Bullet,
  Invader,
  SpaceInvadersRuntime,
  SpaceInvadersScreenState,
  SupportShip,
} from "./spaceInvadersTypes";
import {
  clamp,
  getEnemyBulletSpeedForWave,
  getInvaderShootChanceForWave,
  getInvaderSpeedForWave,
  isBossWave,
} from "./engine/spaceInvadersUtils";
import { createSpaceInvadersBossEngine } from "./engine/spaceInvadersBossEngine";
import { createSpaceInvadersCollisionEngine } from "./engine/spaceInvadersCollisionEngine";
import { drawSpaceInvadersRuntime } from "./engine/spaceInvadersRenderer";

export function useSpaceInvadersGame() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const frameRef = useRef<number | null>(null);
  const runtimeRef = useRef<SpaceInvadersRuntime>(
    createInitialSpaceInvadersRuntime()
  );
  const pausedAtRef = useRef(0);

  const screenStateRef = useRef<SpaceInvadersScreenState>("start");
  const bulletIdRef = useRef(0);

  const [screenState, setScreenState] =
    useState<SpaceInvadersScreenState>("start");

  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [wave, setWave] = useState(1);
  const [bossHealth, setBossHealth] = useState(0);
  const [bossMaxHealth, setBossMaxHealth] = useState(0);
  const [bossName, setBossName] = useState("");
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
      const normalizedKey = event.key.toLowerCase();

      if (screenStateRef.current !== "playing") {
        return;
      }

      if (event.key === "ArrowLeft" || normalizedKey === "a") {
        runtime.keys.left = true;
      }

      if (event.key === "ArrowRight" || normalizedKey === "d") {
        runtime.keys.right = true;
      }

      if (event.key === " " || normalizedKey === "w") {
        event.preventDefault();
        runtime.keys.shooting = true;
      }

      if (normalizedKey === "q") {
        event.preventDefault();
        handleLaserPowerAction();
      }

      if (normalizedKey === "e") {
        event.preventDefault();
        handleSupportPowerAction();
      }

      if (normalizedKey === "r") {
        event.preventDefault();
        handleShieldPowerAction();
      }
    }

    function handleKeyUp(event: KeyboardEvent) {
      const runtime = runtimeRef.current;
      const normalizedKey = event.key.toLowerCase();

      if (event.key === "ArrowLeft" || normalizedKey === "a") {
        runtime.keys.left = false;
      }

      if (event.key === "ArrowRight" || normalizedKey === "d") {
        runtime.keys.right = false;
      }

      if (event.key === " " || normalizedKey === "w") {
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
    setBossName(runtime.boss.active ? runtime.boss.name : "");
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

  function getDebugPlayerLivesForBossWave(bossWave: number) {
    if (DEBUG_PLAYER_LIVES_OVERRIDE !== null) {
      return DEBUG_PLAYER_LIVES_OVERRIDE;
    }

    return DEBUG_PLAYER_LIVES_BY_BOSS_WAVE[bossWave] ?? PLAYER_LIVES;
  }

  function startDebugBossWave() {
    const runtime = runtimeRef.current;
    const bossWave = DEBUG_BOSS_WAVE;

    runtime.wave = bossWave;
    runtime.lives = getDebugPlayerLivesForBossWave(bossWave);
    runtime.invaders = [];
    runtime.boss = createBoss(bossWave);
    runtime.enemyBullets = [];
    runtime.playerBullets = [];
    runtime.invaderDirection = 1;
    runtime.invaderSpeed = getInvaderSpeedForWave(bossWave);
    runtime.shake = 10;

    createParticleExplosion(CANVAS_WIDTH / 2, 86, "#be2edd");
    createParticleExplosion(CANVAS_WIDTH / 2, 86, "#f1c40f");
  }

  function startGame() {
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
    }

    bulletIdRef.current = 0;
    runtimeRef.current = createInitialSpaceInvadersRuntime();

    if (DEBUG_START_ON_BOSS_WAVE) {
      startDebugBossWave();
    }

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

  function shiftRuntimeTimestamps(deltaMs: number) {
    const runtime = runtimeRef.current;

    runtime.boss.spawnedAt += deltaMs;
    runtime.boss.nextAttackAt += deltaMs;
    runtime.boss.nextBurstShotAt += deltaMs;
    runtime.laserPower.activatedAt += deltaMs;
    runtime.laserPower.lastUsedAt += deltaMs;
    runtime.laserPower.lastBossDamageAt += deltaMs;
    runtime.supportPower.lastUsedAt += deltaMs;
    runtime.supportPower.ship.spawnedAt += deltaMs;
    runtime.supportPower.ship.expiresAt += deltaMs;
    runtime.supportPower.ship.nextMoveAt += deltaMs;
    runtime.supportPower.ship.nextShotAt += deltaMs;
    runtime.shieldPower.activatedAt += deltaMs;
    runtime.shieldPower.lastBrokenAt += deltaMs;
    runtime.shieldPower.brokenAt += deltaMs;
  }

  function pauseGame() {
    if (screenStateRef.current !== "playing") {
      return;
    }

    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }

    runtimeRef.current.keys.left = false;
    runtimeRef.current.keys.right = false;
    runtimeRef.current.keys.shooting = false;
    pausedAtRef.current = performance.now();
    setGameScreen("paused");
  }

  function resumeGame() {
    if (screenStateRef.current !== "paused") {
      return;
    }

    if (pausedAtRef.current > 0) {
      shiftRuntimeTimestamps(performance.now() - pausedAtRef.current);
      pausedAtRef.current = 0;
    }

    setGameScreen("playing");
    frameRef.current = requestAnimationFrame(gameLoop);
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

    const isReady =
      now - runtime.laserPower.lastUsedAt >= LASER_POWER_COOLDOWN_MS;

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
    vx = 0,
    options: Partial<
      Pick<
        Bullet,
        | "damageActiveAt"
        | "expiresAt"
        | "createdAt"
        | "followBossCenter"
        | "color"
        | "glow"
      >
    > = {}
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
      ...options,
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
        getEnemyBulletSpeedForWave(runtime.wave),
        "enemy"
      )
    );
  }

  const bossEngine = createSpaceInvadersBossEngine({
    runtimeRef,
    bulletIdRef,
    createBullet,
    createParticleExplosion,
    syncStateFromRuntime,
    showGameOver,
  });

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
      const isBossInsideLaser =
        bossCenter >= laserLeft && bossCenter <= laserRight;
      const canDamageBoss = now - runtime.laserPower.lastBossDamageAt > 45;
      const canDamageShield =
        now - runtime.laserPower.lastBossDamageAt > LASER_POWER_DURATION_MS;

      if (isBossInsideLaser && runtime.boss.shieldActive) {
        if (canDamageShield) {
          collisionEngine.damageBoss(0, 8);
          runtime.laserPower.lastBossDamageAt = now;
        }
      } else if (isBossInsideLaser && canDamageBoss) {
        if (bossEngine.hasActiveSummonerGuardians()) {
          createParticleExplosion(bossCenter, runtime.boss.y + runtime.boss.height / 2, "#4facfe");
        } else {
          collisionEngine.damageBoss(LASER_BOSS_DAMAGE_PER_FRAME, 0);
        }

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
    runtime.boss = createBoss(nextWave);
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
      runtime.lives += 1;

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

    if (
      randomShooter &&
      Math.random() < getInvaderShootChanceForWave(runtime.wave)
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

  const collisionEngine = createSpaceInvadersCollisionEngine({
    runtimeRef,
    bossEngine,
    createParticleExplosion,
    syncStateFromRuntime,
    syncPowerState,
    advanceToNextNormalWave,
    showGameOver,
    showVictory,
  });

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
    bossEngine.updateBoss();
    bossEngine.updateBossMinions();
    updateInvaders();
    collisionEngine.updateBullets();
    collisionEngine.handlePlayerBulletCollisions();
    collisionEngine.handleShieldBulletCollisions();
    collisionEngine.handleEnemyBulletCollisions();
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

  function showVictory() {
    setGameScreen("victory");

    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }

    syncStateFromRuntime();
    syncPowerState();
    drawGame();
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

    drawSpaceInvadersRuntime(ctx, runtimeRef.current);
  }
  function gameLoop() {
    if (screenStateRef.current !== "playing") {
      return;
    }

    updateGame();

    if (screenStateRef.current !== "playing") {
      return;
    }

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
    bossName,
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
    pauseGame,
    resumeGame,
    backToStartScreen,
    handlePointerMove,
    handleShootAction,
    handleLaserPowerAction,
    handleSupportPowerAction,
    handleShieldPowerAction,
  };
}
