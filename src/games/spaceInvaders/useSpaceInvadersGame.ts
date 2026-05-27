import { useEffect, useRef, useState } from "react";
import {
  BOSS_WAVE_INTERVAL,
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  DEBUG_BOSS_WAVE,
  DEBUG_PLAYER_LIVES_BY_BOSS_WAVE,
  DEBUG_PLAYER_LIVES_OVERRIDE,
  DEBUG_START_ON_BOSS_WAVE,
  ENEMY_BULLET_HEIGHT,
  ENEMY_BULLET_SPEED,
  ENEMY_BULLET_SPEED_MAX,
  ENEMY_BULLET_SPEED_MAX_WAVE,
  ENEMY_BULLET_WIDTH,
  FINAL_WAVE,
  INVADER_BASE_SPEED,
  INVADER_DROP_DISTANCE,
  INVADER_SHOOT_CHANCE,
  INVADER_SHOOT_CHANCE_MAX,
  INVADER_SHOOT_CHANCE_MAX_WAVE,
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
  PLAYER_LIVES,
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

type BossAttackType =
  | "triple"
  | "focus"
  | "rain"
  | "wide"
  | "cross"
  | "sweep"
  | "burstRain"
  | "spiral"
  | "pinch"
  | "meteor"
  | "lattice"
  | "omegaBurst"
  | "quasarLaser"
  | "quasarComet"
  | "forgeGate"
  | "forgeCannon"
  | "forgeShield"
  | "omegaLaser"
  | "omegaHalo"
  | "omegaSummon";

const FORGE_SHIELD_MAX_HITS = 4;

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

function getCappedDifficultyWave(wave: number, maxWave: number) {
  return clamp(wave, 1, maxWave);
}

function getInvaderSpeedForWave(wave: number) {
  const difficultyStep = getWaveDifficultyStep(wave);

  return INVADER_BASE_SPEED + (difficultyStep - 1) * INVADER_SPEED_STEP;
}

function getInvaderShootChanceForWave(wave: number) {
  const difficultyStep = getCappedDifficultyWave(
    wave,
    INVADER_SHOOT_CHANCE_MAX_WAVE
  );
  const nextChance =
    INVADER_SHOOT_CHANCE + (difficultyStep - 1) * INVADER_SHOOT_CHANCE_STEP;

  return Math.min(INVADER_SHOOT_CHANCE_MAX, nextChance);
}

function getEnemyBulletSpeedForWave(wave: number) {
  const cappedWave = getCappedDifficultyWave(wave, ENEMY_BULLET_SPEED_MAX_WAVE);
  const progress =
    (cappedWave - 1) / Math.max(1, ENEMY_BULLET_SPEED_MAX_WAVE - 1);

  return (
    ENEMY_BULLET_SPEED +
    (ENEMY_BULLET_SPEED_MAX - ENEMY_BULLET_SPEED) * progress
  );
}

function isBossWave(wave: number) {
  return wave > 0 && wave <= FINAL_WAVE && wave % BOSS_WAVE_INTERVAL === 0;
}

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
      Pick<Bullet, "damageActiveAt" | "expiresAt" | "color" | "glow">
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

  function shootBossBullet(
    x: number,
    y: number,
    vx: number,
    vy: number,
    options: Partial<Pick<Bullet, "color" | "glow">> = {}
  ) {
    const runtime = runtimeRef.current;

    runtime.enemyBullets.push(
      createBullet(
        x,
        y,
        ENEMY_BULLET_WIDTH + 2,
        ENEMY_BULLET_HEIGHT + 2,
        vy,
        "boss",
        vx,
        options
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
      const isBossInsideLaser =
        bossCenter >= laserLeft && bossCenter <= laserRight;
      const canDamageBoss = now - runtime.laserPower.lastBossDamageAt > 45;
      const canDamageShield =
        now - runtime.laserPower.lastBossDamageAt > LASER_POWER_DURATION_MS;

      if (isBossInsideLaser && runtime.boss.shieldActive) {
        if (canDamageShield) {
          damageBoss(0, 2);
          runtime.laserPower.lastBossDamageAt = now;
        }
      } else if (isBossInsideLaser && canDamageBoss) {
        damageBoss(LASER_BOSS_DAMAGE_PER_FRAME, 0);
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

  function updateBossMinions() {
    const runtime = runtimeRef.current;

    if (!runtime.boss.active) {
      return;
    }

    const activeSummons = runtime.invaders.filter((invader) => {
      return invader.active && invader.row >= 90;
    });

    for (const summon of activeSummons) {
      summon.y += runtime.boss.tier === "omega" ? 0.42 : 0.34;
      summon.x += Math.sin(Date.now() / 260 + summon.id) * 0.42;
      summon.x = clamp(summon.x, 18, CANVAS_WIDTH - summon.width - 18);

      if (Math.random() < (runtime.boss.tier === "omega" ? 0.012 : 0.009)) {
        shootEnemyBullet(summon);
      }

      if (summon.y + summon.height >= runtime.player.y - 10) {
        showGameOver();
        return;
      }
    }
  }

  function getRandomBossAttackType(boss: Boss): BossAttackType {
    const randomValue = Math.random();

    if (boss.tier === "omega") {
      if (randomValue < 0.36) {
        return "omegaLaser";
      }

      if (randomValue < 0.56) {
        return "omegaHalo";
      }

      if (randomValue < 0.74) {
        return "omegaSummon";
      }

      return "omegaBurst";
    }

    if (boss.tier === "forge") {
      if (!boss.shieldActive && randomValue < 0.24) {
        return "forgeShield";
      }

      if (randomValue < 0.48) {
        return "forgeGate";
      }

      if (randomValue < 0.72) {
        return "meteor";
      }

      return "forgeCannon";
    }

    if (boss.tier === "quasar") {
      if (randomValue < 0.26) {
        return "spiral";
      }

      if (randomValue < 0.5) {
        return "pinch";
      }

      if (randomValue < 0.74) {
        return "quasarLaser";
      }

      return "quasarComet";
    }

    if (boss.tier === "overlord") {
      if (randomValue < 0.34) {
        return "rain";
      }

      if (randomValue < 0.58) {
        return "burstRain";
      }

      if (randomValue < 0.8) {
        return "sweep";
      }

      return "lattice";
    }

    // Ataque principal, aparece bastante.
    if (randomValue < 0.32) {
      return "triple";
    }

    // Mira perto do player, mais perigoso, mas ainda com erro.
    if (randomValue < 0.56) {
      return "focus";
    }

    // Ataque aberto, mais raro.
    if (randomValue < 0.78) {
      return "wide";
    }

    // Ataque cruzado, raro, mas cria uma tensão boa.
    return "cross";
  }

  function shootBossTripleAttack(boss: Boss) {
    const bossCenterX = boss.x + boss.width / 2;
    const bulletY = boss.y + boss.height - 6;

    shootBossBullet(bossCenterX - 4, bulletY, 0, boss.bulletSpeed);
    shootBossBullet(bossCenterX - 28, bulletY, -0.9, boss.bulletSpeed * 0.94);
    shootBossBullet(bossCenterX + 24, bulletY, 0.9, boss.bulletSpeed * 0.94);
  }

  function shootBossFocusAttack(boss: Boss) {
    const runtime = runtimeRef.current;
    const bossCenterX = boss.x + boss.width / 2;
    const bulletY = boss.y + boss.height - 4;

    const playerCenterX = runtime.player.x + runtime.player.width / 2;
    const aimError = (Math.random() - 0.5) * boss.aimErrorRange;
    const targetX = playerCenterX + aimError;

    const distanceX = targetX - bossCenterX;
    const normalizedX = clamp(distanceX / 170, -1.15, 1.15);

    shootBossBullet(
      bossCenterX - 4,
      bulletY,
      normalizedX,
      boss.bulletSpeed * 1.08
    );

    const sideOffset = Math.random() > 0.5 ? 0.42 : -0.42;

    shootBossBullet(
      bossCenterX - 4,
      bulletY + 2,
      normalizedX + sideOffset,
      boss.bulletSpeed * 0.94
    );
  }

  function shootBossRainAttack(boss: Boss) {
    for (let index = 0; index < boss.rainBulletCount; index++) {
      const x = 44 + Math.random() * (CANVAS_WIDTH - 88);
      const y = 64 + Math.random() * 34;

      shootBossBullet(
        x,
        y,
        (Math.random() - 0.5) * 0.42,
        boss.bulletSpeed * (0.82 + Math.random() * 0.26)
      );
    }
  }

  function shootBossWideAttack(boss: Boss) {
    const bossCenterX = boss.x + boss.width / 2;
    const bulletY = boss.y + boss.height - 6;

    shootBossBullet(bossCenterX - 4, bulletY, 0, boss.bulletSpeed * 0.94);
    shootBossBullet(bossCenterX - 34, bulletY, -0.82, boss.bulletSpeed * 0.88);
    shootBossBullet(bossCenterX + 30, bulletY, 0.82, boss.bulletSpeed * 0.88);
    shootBossBullet(bossCenterX - 54, bulletY, -1.28, boss.bulletSpeed * 0.78);
    shootBossBullet(bossCenterX + 50, bulletY, 1.28, boss.bulletSpeed * 0.78);
  }

  function shootBossCrossAttack(boss: Boss) {
    const bossCenterX = boss.x + boss.width / 2;
    const bulletY = boss.y + boss.height - 6;

    shootBossBullet(bossCenterX - 48, bulletY, 1.08, boss.bulletSpeed * 0.9);
    shootBossBullet(bossCenterX + 44, bulletY, -1.08, boss.bulletSpeed * 0.9);

    shootBossBullet(
      bossCenterX - 22,
      bulletY + 4,
      0.48,
      boss.bulletSpeed * 1.02
    );
    shootBossBullet(
      bossCenterX + 18,
      bulletY + 4,
      -0.48,
      boss.bulletSpeed * 1.02
    );
  }

  function shootBossSweepAttack(boss: Boss) {
    const bossCenterX = boss.x + boss.width / 2;
    const bulletY = boss.y + boss.height - 8;

    for (let index = 0; index < 7; index++) {
      const offset = index - 3;

      shootBossBullet(
        bossCenterX + offset * 16,
        bulletY,
        offset * 0.38,
        boss.bulletSpeed * (0.82 + Math.abs(offset) * 0.025)
      );
    }
  }

  function shootBossBurstRainAttack(boss: Boss) {
    const runtime = runtimeRef.current;
    const playerCenterX = runtime.player.x + runtime.player.width / 2;

    for (let index = 0; index < boss.rainBulletCount + 2; index++) {
      const laneProgress = index / Math.max(1, boss.rainBulletCount + 1);
      const x = 36 + laneProgress * (CANVAS_WIDTH - 72);
      const waveOffset = Math.sin(index * 1.7 + Date.now() / 180) * 10;

      shootBossBullet(
        x + waveOffset,
        54 + Math.random() * 28,
        (Math.random() - 0.5) * 0.32,
        boss.bulletSpeed * (0.78 + Math.random() * 0.18)
      );
    }

    const bossCenterX = boss.x + boss.width / 2;
    const targetOffset = clamp((playerCenterX - bossCenterX) / 190, -0.95, 0.95);

    shootBossBullet(
      bossCenterX - 18,
      boss.y + boss.height - 8,
      targetOffset - 0.28,
      boss.bulletSpeed * 1.03
    );
    shootBossBullet(
      bossCenterX + 14,
      boss.y + boss.height - 8,
      targetOffset + 0.28,
      boss.bulletSpeed * 1.03
    );
  }

  function shootBossSpiralAttack(boss: Boss) {
    const bossCenterX = boss.x + boss.width / 2;
    const bossCenterY = boss.y + boss.height / 2;
    const rotation = (Date.now() / 220) % (Math.PI * 2);

    for (let index = 0; index < 8; index++) {
      const angle = rotation + (index / 8) * Math.PI * 2;
      const vx = Math.cos(angle) * 1.15;
      const vy = boss.bulletSpeed * (0.72 + Math.max(0, Math.sin(angle)) * 0.22);

      if (vy <= 0.9) {
        continue;
      }

      shootBossBullet(
        bossCenterX - 3 + Math.cos(angle) * 22,
        bossCenterY + 10 + Math.sin(angle) * 12,
        vx,
        vy
      );
    }
  }

  function shootBossPinchAttack(boss: Boss) {
    const bulletY = boss.y + boss.height - 4;

    for (let index = 0; index < 4; index++) {
      const spread = index * 18;

      shootBossBullet(
        boss.x + 14 + spread,
        bulletY,
        0.72 + index * 0.13,
        boss.bulletSpeed * (0.82 + index * 0.03)
      );

      shootBossBullet(
        boss.x + boss.width - 20 - spread,
        bulletY,
        -0.72 - index * 0.13,
        boss.bulletSpeed * (0.82 + index * 0.03)
      );
    }
  }

  function shootBossMeteorAttack(boss: Boss) {
    const runtime = runtimeRef.current;
    const playerCenterX = runtime.player.x + runtime.player.width / 2;

    for (let index = 0; index < boss.rainBulletCount; index++) {
      const laneGap = (CANVAS_WIDTH - 92) / Math.max(1, boss.rainBulletCount - 1);
      const x = 46 + index * laneGap + (Math.random() - 0.5) * 14;
      const isAimedMeteor = index === 2 || index === boss.rainBulletCount - 3;
      const vx = isAimedMeteor
        ? clamp((playerCenterX - x) / 230, -0.9, 0.9)
        : (Math.random() - 0.5) * 0.28;

      shootBossBullet(
        x,
        46 + Math.random() * 24,
        vx,
        boss.bulletSpeed * (isAimedMeteor ? 1.12 : 0.86)
      );
    }
  }

  function shootBossLatticeAttack(boss: Boss) {
    const laneCount = boss.tier === "omega" ? 8 : 7;

    for (let index = 0; index < laneCount; index++) {
      const laneProgress = index / Math.max(1, laneCount - 1);
      const x = 58 + laneProgress * (CANVAS_WIDTH - 116);
      const direction = index % 2 === 0 ? 1 : -1;

      shootBossBullet(
        x,
        boss.y + boss.height - 2,
        direction * 0.42,
        boss.bulletSpeed * 0.9
      );
    }

    const centerX = boss.x + boss.width / 2;
    shootBossBullet(centerX - 4, boss.y + boss.height, 0, boss.bulletSpeed);
  }

  function shootBossOmegaBurstAttack(boss: Boss) {
    const runtime = runtimeRef.current;
    const centerX = boss.x + boss.width / 2;
    const playerCenterX = runtime.player.x + runtime.player.width / 2;
    const targetOffset = clamp((playerCenterX - centerX) / 220, -0.82, 0.82);

    shootBossBullet(
      centerX - 4,
      boss.y + boss.height,
      targetOffset,
      boss.bulletSpeed * 1.02
    );

    for (let index = -2; index <= 2; index++) {
      if (index === 0) {
        continue;
      }

      shootBossBullet(
        centerX + index * 26,
        boss.y + boss.height - 8,
        index * 0.26,
        boss.bulletSpeed * (0.74 + Math.abs(index) * 0.03)
      );
    }
  }

  function shootBossLaserColumn(
    x: number,
    y: number,
    height: number,
    width: number,
    color: string,
    glow: string,
    warningMs: number,
    durationMs: number,
    vx = 0
  ) {
    const now = performance.now();
    const laserX = clamp(x - width / 2, 18, CANVAS_WIDTH - width - 18);

    runtimeRef.current.enemyBullets.push(
      createBullet(
        laserX,
        y,
        width,
        height,
        0,
        "boss-laser",
        vx,
        {
          color,
          glow,
          damageActiveAt: now + warningMs,
          expiresAt: now + warningMs + durationMs,
        }
      )
    );
  }

  function shootBossQuasarLaserAttack(boss: Boss) {
    const bossCenterX = boss.x + boss.width / 2;
    const laserY = boss.y + boss.height - 8;
    const laserHeight = CANVAS_HEIGHT - laserY;
    const laserDrift = boss.direction * 0.72;

    shootBossLaserColumn(
      bossCenterX,
      laserY,
      laserHeight,
      24,
      "#4facfe",
      "#00f2fe",
      560,
      520,
      laserDrift
    );

    createParticleExplosion(bossCenterX, laserY, "#4facfe");
    createParticleExplosion(bossCenterX, laserY, "#be2edd");
  }

  function shootBossQuasarCometAttack(boss: Boss) {
    const bossCenterX = boss.x + boss.width / 2;
    const bulletY = boss.y + boss.height - 4;

    for (let index = -2; index <= 2; index++) {
      const sideDrift = index * 0.36;

      shootBossBullet(
        bossCenterX + index * 22,
        bulletY + Math.abs(index) * 3,
        sideDrift,
        boss.bulletSpeed * (0.82 + Math.abs(index) * 0.035),
        {
          color: index === 0 ? "#ffffff" : "#4facfe",
          glow: index === 0 ? "#f1c40f" : "#00f2fe",
        }
      );
    }
  }

  function shootBossForgeGateAttack(boss: Boss) {
    const runtime = runtimeRef.current;
    const playerCenterX = runtime.player.x + runtime.player.width / 2;
    const laneCount = 9;
    const laneWidth = CANVAS_WIDTH / laneCount;
    const safeLane = clamp(Math.floor(playerCenterX / laneWidth), 1, laneCount - 2);

    for (let index = 0; index < laneCount; index++) {
      if (Math.abs(index - safeLane) <= 1) {
        continue;
      }

      shootBossBullet(
        index * laneWidth + laneWidth / 2 - ENEMY_BULLET_WIDTH / 2,
        boss.y + boss.height,
        index < safeLane ? 0.16 : -0.16,
        boss.bulletSpeed * 0.88,
        {
          color: "#ff6b35",
          glow: "#f1c40f",
        }
      );
    }
  }

  function shootBossForgeCannonAttack(boss: Boss) {
    const cannonOffsets = [-76, -34, 34, 76];
    const bossCenterX = boss.x + boss.width / 2;

    for (const offset of cannonOffsets) {
      shootBossBullet(
        bossCenterX + offset,
        boss.y + boss.height - 4,
        offset > 0 ? -0.28 : 0.28,
        boss.bulletSpeed * 0.98,
        {
          color: "#f1c40f",
          glow: "#ff4757",
        }
      );
    }
  }

  function summonBossMinions(
    boss: Boss,
    count: number,
    variant: Invader["variant"],
    color: string,
    glow: string
  ) {
    const runtime = runtimeRef.current;
    const activeSummons = runtime.invaders.filter((invader) => {
      return invader.active && invader.row >= 90;
    });

    if (activeSummons.length >= 5) {
      return;
    }

    const allowedCount = Math.min(count, 5 - activeSummons.length);
    const bossCenterX = boss.x + boss.width / 2;

    for (let index = 0; index < allowedCount; index++) {
      bulletIdRef.current += 1;
      const offset = (index - (allowedCount - 1) / 2) * 48;

      runtime.invaders.push({
        id: 9000 + bulletIdRef.current,
        row: 90 + index,
        x: clamp(bossCenterX + offset - 15, 22, CANVAS_WIDTH - 52),
        y: boss.y + boss.height + 12,
        width: 30,
        height: 22,
        active: true,
        variant,
        color,
        glow,
      });
    }

    createParticleExplosion(bossCenterX, boss.y + boss.height, glow);
  }

  function activateBossForgeShield(boss: Boss) {
    boss.shieldActive = true;
    boss.shieldHitsLeft = FORGE_SHIELD_MAX_HITS;
    boss.shieldLastActivatedAt = performance.now();
    boss.shieldNextShotAt = boss.shieldLastActivatedAt + 120;
    runtimeRef.current.shake = Math.max(runtimeRef.current.shake, 8);

    createParticleExplosion(
      boss.x + boss.width / 2,
      boss.y + boss.height / 2,
      "#f1c40f"
    );
  }

  function shootBossOmegaLaserAttack(boss: Boss) {
    const runtime = runtimeRef.current;
    const playerCenterX = runtime.player.x + runtime.player.width / 2;
    const offset = Math.random() > 0.5 ? -86 : 86;
    const laserX = playerCenterX + offset;

    shootBossLaserColumn(
      laserX,
      0,
      CANVAS_HEIGHT,
      28,
      "#f1c40f",
      "#ff4757",
      620,
      360
    );
    createParticleExplosion(laserX, boss.y + boss.height, "#f1c40f");
  }

  function shootBossOmegaHaloAttack(boss: Boss) {
    const centerX = boss.x + boss.width / 2;
    const bulletY = boss.y + boss.height - 6;

    for (let index = -3; index <= 3; index++) {
      if (index === 0 || Math.abs(index) === 2) {
        continue;
      }

      shootBossBullet(
        centerX + index * 24,
        bulletY,
        index * 0.24,
        boss.bulletSpeed * (0.76 + Math.abs(index) * 0.035)
      );
    }

    shootBossLaserColumn(
      centerX,
      0,
      CANVAS_HEIGHT,
      18,
      "#be2edd",
      "#f1c40f",
      700,
      260
    );
  }

  function shootBossOmegaSummonAttack(boss: Boss) {
    summonBossMinions(boss, 1, "triangle", "#be2edd", "#4facfe");
    shootBossOmegaBurstAttack(boss);
  }

  function damageForgeShield(boss: Boss, damage: number) {
    if (!boss.shieldActive || damage <= 0) {
      return false;
    }

    boss.shieldHitsLeft = Math.max(0, boss.shieldHitsLeft - damage);
    runtimeRef.current.shake = Math.max(runtimeRef.current.shake, 5);

    createParticleExplosion(
      boss.x + boss.width / 2,
      boss.y + boss.height / 2,
      boss.shieldHitsLeft > 0 ? "#f1c40f" : "#ffffff"
    );

    if (boss.shieldHitsLeft <= 0) {
      boss.shieldActive = false;
      boss.shieldNextShotAt = 0;
      boss.nextAttackAt = performance.now() + 680;
      runtimeRef.current.shake = Math.max(runtimeRef.current.shake, 12);
    }

    syncStateFromRuntime();
    return true;
  }

  function updateForgeShieldMode(boss: Boss, now: number) {
    boss.x += boss.direction * boss.moveSpeed * 0.72;

    if (now < boss.shieldNextShotAt) {
      return;
    }

    const bossCenterX = boss.x + boss.width / 2;
    const bulletY = boss.y + boss.height - 4;

    for (let index = -2; index <= 2; index++) {
      shootBossBullet(
        bossCenterX + index * 24,
        bulletY + Math.abs(index) * 2,
        index * 0.2,
        boss.bulletSpeed * (0.72 + Math.abs(index) * 0.04),
        {
          color: index === 0 ? "#ffffff" : "#ff6b35",
          glow: "#f1c40f",
        }
      );
    }

    boss.shieldNextShotAt = now + 310;
  }

  function updateBoss() {
    const runtime = runtimeRef.current;
    const boss = runtime.boss;

    if (!boss.active) {
      return;
    }

    const now = performance.now();

    boss.x += boss.direction * boss.moveSpeed;

    if (boss.x <= 28) {
      boss.x = 28;
      boss.direction = 1;
    }

    if (boss.x + boss.width >= CANVAS_WIDTH - 28) {
      boss.x = CANVAS_WIDTH - boss.width - 28;
      boss.direction = -1;
    }

    if (boss.tier === "forge" && boss.shieldActive) {
      updateForgeShieldMode(boss, now);
      return;
    }

    if (now < boss.nextAttackAt) {
      return;
    }

    const attackType = getRandomBossAttackType(boss);

    if (attackType === "triple") {
      shootBossTripleAttack(boss);
    }

    if (attackType === "focus") {
      shootBossFocusAttack(boss);
    }

    if (attackType === "rain") {
      shootBossRainAttack(boss);
    }

    if (attackType === "wide") {
      shootBossWideAttack(boss);
    }

    if (attackType === "cross") {
      shootBossCrossAttack(boss);
    }

    if (attackType === "sweep") {
      shootBossSweepAttack(boss);
    }

    if (attackType === "burstRain") {
      shootBossBurstRainAttack(boss);
    }

    if (attackType === "spiral") {
      shootBossSpiralAttack(boss);
    }

    if (attackType === "pinch") {
      shootBossPinchAttack(boss);
    }

    if (attackType === "meteor") {
      shootBossMeteorAttack(boss);
    }

    if (attackType === "lattice") {
      shootBossLatticeAttack(boss);
    }

    if (attackType === "omegaBurst") {
      shootBossOmegaBurstAttack(boss);
    }

    if (attackType === "quasarLaser") {
      shootBossQuasarLaserAttack(boss);
    }

    if (attackType === "quasarComet") {
      shootBossQuasarCometAttack(boss);
    }

    if (attackType === "forgeGate") {
      shootBossForgeGateAttack(boss);
    }

    if (attackType === "forgeCannon") {
      shootBossForgeCannonAttack(boss);
    }

    if (attackType === "forgeShield") {
      activateBossForgeShield(boss);
    }

    if (attackType === "omegaLaser") {
      shootBossOmegaLaserAttack(boss);
    }

    if (attackType === "omegaHalo") {
      shootBossOmegaHaloAttack(boss);
    }

    if (attackType === "omegaSummon") {
      shootBossOmegaSummonAttack(boss);
    }

    boss.nextAttackAt =
      now + boss.attackIntervalMs + Math.random() * boss.attackRestTimeMs;
  }

  function updateBullets() {
    const runtime = runtimeRef.current;
    const now = performance.now();

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
        (!bullet.expiresAt || now < bullet.expiresAt) &&
        bullet.y < CANVAS_HEIGHT + bullet.height &&
        bullet.x + bullet.width > -20 &&
        bullet.x < CANVAS_WIDTH + 20
      );
    });
  }

  function damageBoss(amount: number, shieldDamage = 1) {
    const runtime = runtimeRef.current;

    if (!runtime.boss.active) {
      return;
    }

    if (runtime.boss.shieldActive) {
      damageForgeShield(runtime.boss, shieldDamage);
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

    runtime.score += boss.points;
    runtime.lives = Math.min(PLAYER_MAX_LIVES, runtime.lives + 1);
    runtime.enemyBullets = [];
    runtime.invaders = [];
    runtime.boss.active = false;
    runtime.boss.defeated = true;
    runtime.shake = 18;

    createParticleExplosion(
      boss.x + boss.width / 2,
      boss.y + boss.height / 2,
      "#be2edd"
    );
    createParticleExplosion(
      boss.x + boss.width / 2,
      boss.y + boss.height / 2,
      "#f1c40f"
    );
    createParticleExplosion(
      boss.x + boss.width / 2,
      boss.y + boss.height / 2,
      "#4facfe"
    );

    syncStateFromRuntime();

    if (boss.wave >= FINAL_WAVE) {
      showVictory();
      return;
    }

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
        damageBoss(bullet.source === "support" ? 12 : 18, 1);

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
    const now = performance.now();

    for (const bullet of runtime.enemyBullets) {
      if (!bullet.active) {
        continue;
      }

      if (bullet.damageActiveAt && now < bullet.damageActiveAt) {
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
    updateBossMinions();
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
    const centerY = player.y + 17.5;

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.scale(player.width / 100, (player.height + 11) / 96);

    ctx.shadowBlur = 18;
    ctx.shadowColor = "#4facfe";

    const engineGlow = ctx.createRadialGradient(0, 38, 2, 0, 42, 32);
    engineGlow.addColorStop(0, "rgba(79, 172, 254, 0.9)");
    engineGlow.addColorStop(0.42, "rgba(56, 239, 125, 0.35)");
    engineGlow.addColorStop(1, "rgba(79, 172, 254, 0)");

    ctx.fillStyle = engineGlow;
    ctx.beginPath();
    ctx.ellipse(0, 42, 35, 15, 0, 0, Math.PI * 2);
    ctx.fill();

    const wingGradient = ctx.createLinearGradient(-45, -2, 45, 38);
    wingGradient.addColorStop(0, "#38ef7d");
    wingGradient.addColorStop(0.5, "#4facfe");
    wingGradient.addColorStop(1, "#38ef7d");

    ctx.fillStyle = wingGradient;
    ctx.beginPath();
    ctx.moveTo(0, -39);
    ctx.lineTo(47, 34);
    ctx.lineTo(19, 27);
    ctx.lineTo(12, 40);
    ctx.lineTo(0, 33);
    ctx.lineTo(-12, 40);
    ctx.lineTo(-19, 27);
    ctx.lineTo(-47, 34);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = "rgba(255, 255, 255, 0.42)";
    ctx.lineWidth = 1.6;
    ctx.stroke();

    ctx.shadowBlur = 16;
    ctx.shadowColor = "#38ef7d";
    ctx.fillStyle = "#38ef7d";

    ctx.beginPath();
    ctx.moveTo(-49, 33);
    ctx.lineTo(-28, 23);
    ctx.lineTo(-17, 39);
    ctx.lineTo(-35, 48);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(49, 33);
    ctx.lineTo(28, 23);
    ctx.lineTo(17, 39);
    ctx.lineTo(35, 48);
    ctx.closePath();
    ctx.fill();

    const bodyGradient = ctx.createLinearGradient(0, -44, 0, 43);

    bodyGradient.addColorStop(0, "#ffffff");
    bodyGradient.addColorStop(0.24, "#9ee7ff");
    bodyGradient.addColorStop(0.56, "#4facfe");
    bodyGradient.addColorStop(1, "#11998e");

    ctx.shadowBlur = 28;
    ctx.shadowColor = "#4facfe";
    ctx.fillStyle = bodyGradient;
    ctx.beginPath();
    ctx.moveTo(0, -48);
    ctx.lineTo(28, 34);
    ctx.lineTo(10, 28);
    ctx.lineTo(0, 37);
    ctx.lineTo(-10, 28);
    ctx.lineTo(-28, 34);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = "rgba(255, 255, 255, 0.76)";
    ctx.lineWidth = 1.8;
    ctx.stroke();

    ctx.shadowBlur = 14;
    ctx.shadowColor = "#ffffff";
    ctx.strokeStyle = "rgba(255, 255, 255, 0.58)";
    ctx.lineWidth = 1.3;

    ctx.beginPath();
    ctx.moveTo(-14, -1);
    ctx.lineTo(-7, 23);
    ctx.lineTo(-18, 29);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(14, -1);
    ctx.lineTo(7, 23);
    ctx.lineTo(18, 29);
    ctx.stroke();

    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.roundRect(-3.8, -42, 7.6, 35, 999);
    ctx.fill();

    ctx.shadowBlur = 18;
    ctx.shadowColor = "#f1c40f";
    ctx.fillStyle = "#f1c40f";
    ctx.beginPath();
    ctx.ellipse(0, -9, 8.5, 11.5, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "rgba(7, 16, 22, 0.42)";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.ellipse(0, -9, 8.5, 11.5, 0, 0, Math.PI * 2);
    ctx.stroke();

    ctx.shadowBlur = 15;
    ctx.shadowColor = "#38ef7d";
    ctx.fillStyle = "#071016";
    ctx.beginPath();
    ctx.roundRect(-18, 31, 36, 11, 5);
    ctx.fill();

    ctx.fillStyle = "#4facfe";
    ctx.beginPath();
    ctx.roundRect(-12, 34, 7, 5, 3);
    ctx.roundRect(5, 34, 7, 5, 3);
    ctx.fill();

    ctx.restore();

    if (runtimeRef.current.laserPower.active) {
      ctx.save();
      ctx.globalAlpha = 0.42;
      ctx.shadowBlur = 24;
      ctx.shadowColor = "#4facfe";
      ctx.strokeStyle = "#4facfe";
      ctx.lineWidth = 2;

      ctx.beginPath();
      ctx.arc(centerX, player.y + 10, 34, 0, Math.PI * 2);
      ctx.stroke();

      ctx.restore();
    }
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

    if (invader.row >= 90) {
      const centerX = invader.x + invader.width / 2;
      const centerY = invader.y + invader.height / 2;

      ctx.shadowBlur = 18 + pulse;
      ctx.shadowColor = invader.glow;
      ctx.fillStyle = invader.color;

      ctx.beginPath();
      ctx.moveTo(centerX, invader.y - 4);
      ctx.lineTo(invader.x + invader.width + 4, centerY);
      ctx.lineTo(centerX, invader.y + invader.height + 4);
      ctx.lineTo(invader.x - 4, centerY);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = "rgba(7, 16, 22, 0.78)";
      ctx.beginPath();
      ctx.arc(centerX, centerY, 7, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(centerX, centerY, 3.2, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
      return;
    }

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

  function drawOverlordBoss(ctx: CanvasRenderingContext2D, boss: Boss) {
    const centerX = boss.x + boss.width / 2;
    const centerY = boss.y + boss.height / 2;
    const pulse = Math.abs(Math.sin(Date.now() / 150));

    ctx.save();

    ctx.shadowBlur = 34 + pulse * 16;
    ctx.shadowColor = "#ff4757";

    const wingGradient = ctx.createLinearGradient(
      boss.x,
      boss.y,
      boss.x + boss.width,
      boss.y + boss.height
    );

    wingGradient.addColorStop(0, "#4facfe");
    wingGradient.addColorStop(0.32, "#be2edd");
    wingGradient.addColorStop(0.62, "#ff4757");
    wingGradient.addColorStop(1, "#f1c40f");

    ctx.fillStyle = wingGradient;

    ctx.beginPath();
    ctx.moveTo(centerX, boss.y - 6);
    ctx.lineTo(boss.x + boss.width + 18, centerY + 10);
    ctx.lineTo(boss.x + boss.width - 24, boss.y + boss.height + 12);
    ctx.lineTo(centerX + 28, boss.y + boss.height - 10);
    ctx.lineTo(centerX, boss.y + boss.height + 18);
    ctx.lineTo(centerX - 28, boss.y + boss.height - 10);
    ctx.lineTo(boss.x + 24, boss.y + boss.height + 12);
    ctx.lineTo(boss.x - 18, centerY + 10);
    ctx.closePath();
    ctx.fill();

    ctx.globalAlpha = 0.72;
    ctx.fillStyle = "rgba(16, 24, 32, 0.78)";
    drawRoundedRect(
      ctx,
      boss.x + 34,
      boss.y + 18,
      boss.width - 68,
      boss.height - 18,
      18
    );

    ctx.globalAlpha = 1;
    ctx.shadowBlur = 24 + pulse * 10;
    ctx.shadowColor = "#f1c40f";

    const coreGradient = ctx.createRadialGradient(
      centerX,
      centerY,
      4,
      centerX,
      centerY,
      34 + pulse * 5
    );

    coreGradient.addColorStop(0, "#ffffff");
    coreGradient.addColorStop(0.3, "#f1c40f");
    coreGradient.addColorStop(0.72, "#ff4757");
    coreGradient.addColorStop(1, "rgba(255, 71, 87, 0.08)");

    ctx.fillStyle = coreGradient;
    ctx.beginPath();
    ctx.ellipse(centerX, centerY + 2, 28 + pulse * 3, 20, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 20;
    ctx.shadowColor = "#ffffff";
    ctx.fillStyle = "#ffffff";

    ctx.beginPath();
    ctx.arc(centerX - 38, centerY - 10, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(centerX + 38, centerY - 10, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#101820";

    ctx.beginPath();
    ctx.arc(centerX - 38 + boss.direction * 2, centerY - 9, 3.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(centerX + 38 + boss.direction * 2, centerY - 9, 3.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 18;
    ctx.shadowColor = "#4facfe";
    ctx.strokeStyle = "rgba(255, 255, 255, 0.82)";
    ctx.lineWidth = 2;

    for (let index = 0; index < 4; index++) {
      const side = index < 2 ? -1 : 1;
      const row = index % 2;
      const cannonX = centerX + side * (58 + row * 18);
      const cannonY = centerY + 18 + row * 12;

      ctx.beginPath();
      ctx.moveTo(cannonX, cannonY);
      ctx.lineTo(cannonX + side * 22, cannonY + 12);
      ctx.stroke();

      ctx.fillStyle = row === 0 ? "#4facfe" : "#ff4757";
      ctx.beginPath();
      ctx.arc(cannonX + side * 24, cannonY + 13, 4.5, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalAlpha = 0.5 + pulse * 0.28;
    ctx.strokeStyle = "#f1c40f";
    ctx.lineWidth = 1.5;

    ctx.beginPath();
    ctx.ellipse(centerX, centerY + 2, boss.width * 0.35, boss.height * 0.34, 0, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  }

  function drawQuasarBoss(ctx: CanvasRenderingContext2D, boss: Boss) {
    const centerX = boss.x + boss.width / 2;
    const centerY = boss.y + boss.height / 2;
    const pulse = Math.abs(Math.sin(Date.now() / 135));

    ctx.save();

    ctx.shadowBlur = 34 + pulse * 16;
    ctx.shadowColor = "#00f2fe";

    const wingGradient = ctx.createLinearGradient(
      boss.x,
      boss.y,
      boss.x + boss.width,
      boss.y + boss.height
    );

    wingGradient.addColorStop(0, "#38ef7d");
    wingGradient.addColorStop(0.36, "#4facfe");
    wingGradient.addColorStop(0.68, "#be2edd");
    wingGradient.addColorStop(1, "#ffffff");

    ctx.fillStyle = wingGradient;

    ctx.beginPath();
    ctx.moveTo(centerX, boss.y - 12);
    ctx.lineTo(boss.x + boss.width + 22, centerY);
    ctx.lineTo(centerX + 38, boss.y + boss.height + 16);
    ctx.lineTo(centerX, boss.y + boss.height - 2);
    ctx.lineTo(centerX - 38, boss.y + boss.height + 16);
    ctx.lineTo(boss.x - 22, centerY);
    ctx.closePath();
    ctx.fill();

    ctx.globalAlpha = 0.82;
    ctx.fillStyle = "rgba(7, 16, 22, 0.82)";
    ctx.beginPath();
    ctx.moveTo(centerX, boss.y + 4);
    ctx.lineTo(centerX + 46, centerY + 8);
    ctx.lineTo(centerX, boss.y + boss.height - 4);
    ctx.lineTo(centerX - 46, centerY + 8);
    ctx.closePath();
    ctx.fill();

    ctx.globalAlpha = 1;
    ctx.shadowBlur = 24;
    ctx.shadowColor = "#f1c40f";
    ctx.strokeStyle = "#f1c40f";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(centerX, centerY, boss.width * 0.34, 18 + pulse * 4, 0.18, 0, Math.PI * 2);
    ctx.stroke();

    const coreGradient = ctx.createRadialGradient(
      centerX,
      centerY,
      3,
      centerX,
      centerY,
      34
    );

    coreGradient.addColorStop(0, "#ffffff");
    coreGradient.addColorStop(0.36, "#4facfe");
    coreGradient.addColorStop(1, "rgba(190, 46, 221, 0.18)");

    ctx.fillStyle = coreGradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, 24 + pulse * 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.shadowBlur = 18;
    ctx.shadowColor = "#ffffff";
    ctx.beginPath();
    ctx.arc(centerX - 44, centerY - 7, 7, 0, Math.PI * 2);
    ctx.arc(centerX + 44, centerY - 7, 7, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#101820";
    ctx.beginPath();
    ctx.arc(centerX - 44 + boss.direction * 2, centerY - 6, 3, 0, Math.PI * 2);
    ctx.arc(centerX + 44 + boss.direction * 2, centerY - 6, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  function drawForgeBoss(ctx: CanvasRenderingContext2D, boss: Boss) {
    const centerX = boss.x + boss.width / 2;
    const centerY = boss.y + boss.height / 2;
    const pulse = Math.abs(Math.sin(Date.now() / 120));

    ctx.save();

    ctx.shadowBlur = 30 + pulse * 14;
    ctx.shadowColor = "#ff6b35";

    const armorGradient = ctx.createLinearGradient(
      boss.x,
      boss.y,
      boss.x + boss.width,
      boss.y + boss.height
    );

    armorGradient.addColorStop(0, "#f1c40f");
    armorGradient.addColorStop(0.28, "#ff4757");
    armorGradient.addColorStop(0.62, "#be2edd");
    armorGradient.addColorStop(1, "#4facfe");

    ctx.fillStyle = armorGradient;
    ctx.beginPath();
    ctx.moveTo(boss.x + 20, boss.y + 16);
    ctx.lineTo(centerX - 40, boss.y - 8);
    ctx.lineTo(centerX, boss.y + 8);
    ctx.lineTo(centerX + 40, boss.y - 8);
    ctx.lineTo(boss.x + boss.width - 20, boss.y + 16);
    ctx.lineTo(boss.x + boss.width + 10, centerY + 22);
    ctx.lineTo(boss.x + boss.width - 32, boss.y + boss.height + 14);
    ctx.lineTo(boss.x + 32, boss.y + boss.height + 14);
    ctx.lineTo(boss.x - 10, centerY + 22);
    ctx.closePath();
    ctx.fill();

    ctx.globalAlpha = 0.78;
    ctx.fillStyle = "rgba(16, 24, 32, 0.84)";
    drawRoundedRect(ctx, boss.x + 36, boss.y + 22, boss.width - 72, boss.height - 8, 16);

    ctx.globalAlpha = 1;
    ctx.shadowBlur = 26;
    ctx.shadowColor = "#ff4757";

    const furnaceGradient = ctx.createRadialGradient(
      centerX,
      centerY + 8,
      5,
      centerX,
      centerY + 8,
      38
    );

    furnaceGradient.addColorStop(0, "#ffffff");
    furnaceGradient.addColorStop(0.28, "#f1c40f");
    furnaceGradient.addColorStop(0.72, "#ff4757");
    furnaceGradient.addColorStop(1, "rgba(255, 71, 87, 0)");

    ctx.fillStyle = furnaceGradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY + 8, 30 + pulse * 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "rgba(255, 255, 255, 0.78)";
    ctx.lineWidth = 2.5;

    for (let index = 0; index < 3; index++) {
      const side = index === 0 ? -1 : index === 1 ? 1 : 0;
      const cannonX = centerX + side * 66;
      const cannonY = centerY + 24;

      ctx.beginPath();
      ctx.moveTo(cannonX - 12, cannonY);
      ctx.lineTo(cannonX + 12, cannonY);
      ctx.lineTo(cannonX + side * 18, cannonY + 22);
      ctx.stroke();
    }

    if (boss.shieldActive) {
      const shieldPulse = Math.abs(Math.sin(Date.now() / 95));
      const shieldRatio = boss.shieldHitsLeft / FORGE_SHIELD_MAX_HITS;

      ctx.globalAlpha = 0.46 + shieldPulse * 0.2;
      ctx.shadowBlur = 30;
      ctx.shadowColor = "#f1c40f";
      ctx.strokeStyle = "#f1c40f";
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.ellipse(
        centerX,
        centerY + 4,
        boss.width * 0.58,
        boss.height * 0.62,
        0,
        0,
        Math.PI * 2
      );
      ctx.stroke();

      ctx.globalAlpha = 0.18 + shieldPulse * 0.08;
      ctx.fillStyle = "#f1c40f";
      ctx.beginPath();
      ctx.ellipse(
        centerX,
        centerY + 4,
        boss.width * 0.58,
        boss.height * 0.62,
        0,
        0,
        Math.PI * 2
      );
      ctx.fill();

      ctx.globalAlpha = 0.86;
      ctx.shadowBlur = 12;
      ctx.fillStyle = "#ff6b35";

      for (let index = 0; index < FORGE_SHIELD_MAX_HITS; index++) {
        ctx.globalAlpha = index < boss.shieldHitsLeft ? 0.92 : 0.22;
        drawRoundedRect(
          ctx,
          centerX - 38 + index * 20,
          boss.y - 11,
          13,
          6,
          999
        );
      }

      ctx.globalAlpha = 0.34 + shieldRatio * 0.26;
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.ellipse(
        centerX,
        centerY + 4,
        boss.width * 0.43,
        boss.height * 0.46,
        0,
        0,
        Math.PI * 2
      );
      ctx.stroke();
    }

    ctx.restore();
  }

  function drawOmegaBoss(ctx: CanvasRenderingContext2D, boss: Boss) {
    const centerX = boss.x + boss.width / 2;
    const centerY = boss.y + boss.height / 2;
    const pulse = Math.abs(Math.sin(Date.now() / 110));

    ctx.save();

    ctx.shadowBlur = 42 + pulse * 18;
    ctx.shadowColor = "#be2edd";

    const auraGradient = ctx.createRadialGradient(
      centerX,
      centerY,
      14,
      centerX,
      centerY,
      boss.width * 0.72
    );

    auraGradient.addColorStop(0, "rgba(255, 255, 255, 0.28)");
    auraGradient.addColorStop(0.34, "rgba(190, 46, 221, 0.28)");
    auraGradient.addColorStop(1, "rgba(79, 172, 254, 0)");

    ctx.fillStyle = auraGradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, boss.width * 0.62, 0, Math.PI * 2);
    ctx.fill();

    const crownGradient = ctx.createLinearGradient(
      boss.x,
      boss.y,
      boss.x + boss.width,
      boss.y + boss.height
    );

    crownGradient.addColorStop(0, "#f1c40f");
    crownGradient.addColorStop(0.2, "#ffffff");
    crownGradient.addColorStop(0.46, "#be2edd");
    crownGradient.addColorStop(0.76, "#4facfe");
    crownGradient.addColorStop(1, "#38ef7d");

    ctx.fillStyle = crownGradient;
    ctx.beginPath();
    ctx.moveTo(centerX, boss.y - 18);
    ctx.lineTo(centerX + 36, boss.y + 18);
    ctx.lineTo(boss.x + boss.width + 28, centerY + 10);
    ctx.lineTo(centerX + 54, boss.y + boss.height + 20);
    ctx.lineTo(centerX, boss.y + boss.height - 2);
    ctx.lineTo(centerX - 54, boss.y + boss.height + 20);
    ctx.lineTo(boss.x - 28, centerY + 10);
    ctx.lineTo(centerX - 36, boss.y + 18);
    ctx.closePath();
    ctx.fill();

    ctx.globalAlpha = 0.84;
    ctx.fillStyle = "rgba(7, 16, 22, 0.88)";
    ctx.beginPath();
    ctx.ellipse(centerX, centerY + 6, boss.width * 0.32, boss.height * 0.42, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = 1;
    ctx.shadowBlur = 30 + pulse * 10;
    ctx.shadowColor = "#f1c40f";
    ctx.strokeStyle = "#f1c40f";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(centerX, centerY, boss.width * 0.38, 22 + pulse * 4, -0.24, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(centerX, centerY, boss.width * 0.28, 18 + pulse * 3, 0.42, 0, Math.PI * 2);
    ctx.stroke();

    const coreGradient = ctx.createRadialGradient(
      centerX,
      centerY + 2,
      4,
      centerX,
      centerY + 2,
      42
    );

    coreGradient.addColorStop(0, "#ffffff");
    coreGradient.addColorStop(0.24, "#f1c40f");
    coreGradient.addColorStop(0.58, "#be2edd");
    coreGradient.addColorStop(1, "rgba(190, 46, 221, 0.08)");

    ctx.fillStyle = coreGradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY + 2, 34 + pulse * 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.shadowBlur = 18;
    ctx.shadowColor = "#ffffff";

    for (let index = 0; index < 4; index++) {
      const angle = -Math.PI * 0.75 + index * (Math.PI * 0.5);
      ctx.beginPath();
      ctx.arc(
        centerX + Math.cos(angle) * 56,
        centerY + Math.sin(angle) * 26,
        6,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }

    ctx.restore();
  }

  function drawBoss(ctx: CanvasRenderingContext2D, boss: Boss) {
    if (!boss.active) {
      return;
    }

    if (boss.tier === "omega") {
      drawOmegaBoss(ctx, boss);
      return;
    }

    if (boss.tier === "forge") {
      drawForgeBoss(ctx, boss);
      return;
    }

    if (boss.tier === "quasar") {
      drawQuasarBoss(ctx, boss);
      return;
    }

    if (boss.tier === "overlord") {
      drawOverlordBoss(ctx, boss);
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
    ctx.ellipse(
      centerX,
      centerY,
      boss.width / 2,
      boss.height / 2,
      0,
      0,
      Math.PI * 2
    );
    ctx.fill();

    ctx.fillStyle = "rgba(0, 0, 0, 0.28)";
    ctx.beginPath();
    ctx.ellipse(
      centerX,
      centerY + 8,
      boss.width * 0.36,
      boss.height * 0.22,
      0,
      0,
      Math.PI * 2
    );
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
    ctx.ellipse(
      centerX,
      centerY,
      boss.width * 0.44,
      boss.height * 0.36,
      0,
      0,
      Math.PI * 2
    );
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

      if (bullet.source === "boss-laser") {
        const now = performance.now();
        const isArmed = !bullet.damageActiveAt || now >= bullet.damageActiveAt;
        const color = bullet.color ?? "#f1c40f";
        const glow = bullet.glow ?? color;

        ctx.save();
        ctx.globalAlpha = isArmed ? 0.76 : 0.26;
        ctx.shadowBlur = isArmed ? 28 : 14;
        ctx.shadowColor = glow;
        ctx.fillStyle = color;
        drawRoundedRect(ctx, bullet.x, bullet.y, bullet.width, bullet.height, 999);

        ctx.globalAlpha = isArmed ? 0.92 : 0.48;
        ctx.fillStyle = "#ffffff";
        drawRoundedRect(
          ctx,
          bullet.x + bullet.width * 0.42,
          bullet.y,
          Math.max(3, bullet.width * 0.16),
          bullet.height,
          999
        );
        ctx.restore();
        continue;
      }

      const bulletColor = bullet.color ?? (isBossBullet ? "#be2edd" : "#ff4757");
      const bulletGlow = bullet.glow ?? bulletColor;

      ctx.shadowBlur = isBossBullet ? 20 : 14;
      ctx.shadowColor = bulletGlow;
      ctx.fillStyle = bulletColor;

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
