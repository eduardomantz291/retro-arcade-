// Motor de bosses do Space Invaders.
// Centraliza ataques, invocações e escudos para manter o hook principal menor.

import type { MutableRefObject } from "react";
import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  ENEMY_BULLET_HEIGHT,
  ENEMY_BULLET_WIDTH,
} from "../spaceInvadersConfig";
import type { Boss, Bullet, Invader, SpaceInvadersRuntime } from "../spaceInvadersTypes";
import {
  FORGE_SHIELD_BURST_INTERVAL_MS,
  FORGE_SHIELD_BURST_REST_MS,
  FORGE_SHIELD_BURST_SIZE,
  FORGE_SHIELD_COOLDOWN_MS,
  FORGE_SHIELD_MAX_HITS,
  OMEGA_MAX_SUMMONS,
  OMEGA_SUMMON_COOLDOWN_MS,
  OMEGA_SUMMON_COUNT,
  SUMMONER_ATTACKER_COOLDOWN_MS,
  SUMMONER_ATTACKER_COUNT,
  SUMMONER_ATTACKER_DRIFT_SPEED,
  SUMMONER_ATTACKER_FALL_SPEED,
  SUMMONER_GUARDIAN_COOLDOWN_MS,
  SUMMONER_GUARDIAN_COUNT,
  SUMMONER_GUARDIAN_ROW_SPACING,
  SUMMONER_GUARDIAN_SIDE_OFFSET_X,
  SUMMONER_GUARDIAN_START_Y_OFFSET,
  SUMMONER_HEALER_COOLDOWN_MS,
  SUMMONER_HEALER_HEALTH_THRESHOLD,
  SUMMONER_HEALER_SIDE_OFFSET_X,
  SUMMONER_HEALER_Y_OFFSET,
  SUMMONER_MAX_ACTIVE_ROLE_TYPES,
  SUMMONER_MAX_ATTACKERS,
  SUMMONER_MAX_GUARDIANS,
  SUMMONER_MAX_HEALERS,
  SUMMONER_SUMMON_COOLDOWN_MS,
  type BossAttackType,
  type BossSummonRole,
} from "./spaceInvadersBossRuntime";
import { clamp, getEnemyBulletSpeedForWave } from "./spaceInvadersUtils";

type CreateBullet = (
  x: number,
  y: number,
  width: number,
  height: number,
  vy: number,
  source: Bullet["source"],
  vx?: number,
  options?: Partial<
    Pick<
      Bullet,
      | "damageActiveAt"
      | "expiresAt"
      | "createdAt"
      | "followBossCenter"
      | "color"
      | "glow"
    >
  >
) => Bullet;

type SpaceInvadersBossEngineContext = {
  runtimeRef: MutableRefObject<SpaceInvadersRuntime>;
  bulletIdRef: MutableRefObject<number>;
  createBullet: CreateBullet;
  createParticleExplosion: (x: number, y: number, color: string) => void;
  syncStateFromRuntime: () => void;
  showGameOver: () => void;
};

export function createSpaceInvadersBossEngine({
  runtimeRef,
  bulletIdRef,
  createBullet,
  createParticleExplosion,
  syncStateFromRuntime,
  showGameOver,
}: SpaceInvadersBossEngineContext) {
  // Tiro simples usado pelos minions; fica aqui porque o comportamento deles pertence ao motor dos bosses.
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

  function updateBossMinions() {
    const runtime = runtimeRef.current;

    if (!runtime.boss.active) {
      return;
    }

    const activeSummons = runtime.invaders.filter((invader) => {
      return invader.active && invader.row >= 90;
    });

    for (const summon of activeSummons) {
      if (summon.summonRole === "guardian") {
        const boss = runtime.boss;
        const centerX = boss.x + boss.width / 2;
        const guardians = activeSummons.filter((invader) => {
          return invader.summonRole === "guardian";
        });
        const guardianIndex = guardians.findIndex((invader) => {
          return invader.id === summon.id;
        });
        const safeGuardianIndex =
          summon.formationIndex ?? Math.max(0, guardianIndex);
        const side = safeGuardianIndex < 3 ? -1 : 1;
        const rowIndex = safeGuardianIndex % 3;

        summon.x =
          centerX + side * SUMMONER_GUARDIAN_SIDE_OFFSET_X - summon.width / 2;
        summon.y =
          boss.y +
          boss.height +
          SUMMONER_GUARDIAN_START_Y_OFFSET +
          rowIndex * SUMMONER_GUARDIAN_ROW_SPACING;
        summon.x = clamp(summon.x, 12, CANVAS_WIDTH - summon.width - 12);
        summon.y = clamp(summon.y, 8, CANVAS_HEIGHT - summon.height - 150);

        if (Math.random() < 0.0035) {
          shootEnemyBullet(summon);
        }

        continue;
      }

      if (summon.summonRole === "healer") {
        const boss = runtime.boss;
        const healerIndex = activeSummons
          .filter((invader) => invader.summonRole === "healer")
          .findIndex((invader) => invader.id === summon.id);
        const side = healerIndex === 0 ? -1 : 1;

        summon.x =
          boss.x +
          boss.width / 2 +
          side * SUMMONER_HEALER_SIDE_OFFSET_X -
          summon.width / 2;
        summon.y =
          boss.y +
          boss.height +
          SUMMONER_HEALER_Y_OFFSET +
          Math.sin(Date.now() / 260 + summon.id) * 7;
        summon.x = clamp(summon.x, 16, CANVAS_WIDTH - summon.width - 16);
        summon.y = clamp(summon.y, 8, CANVAS_HEIGHT - summon.height - 150);

        if (boss.active && boss.health < boss.maxHealth && Math.random() < 0.075) {
          boss.health = Math.min(boss.maxHealth, boss.health + 6);
          createParticleExplosion(summon.x + summon.width / 2, summon.y, summon.glow);
          syncStateFromRuntime();
        }

        if (Math.random() < 0.0035) {
          shootEnemyBullet(summon);
        }

        continue;
      }

      summon.y +=
        runtime.boss.tier === "omega" ? 0.42 : SUMMONER_ATTACKER_FALL_SPEED;
      summon.x +=
        Math.sin(Date.now() / 260 + summon.id) *
        (runtime.boss.tier === "omega" ? 0.46 : SUMMONER_ATTACKER_DRIFT_SPEED);
      summon.x = clamp(summon.x, 18, CANVAS_WIDTH - summon.width - 18);

      if (Math.random() < (runtime.boss.tier === "omega" ? 0.012 : 0.008)) {
        shootEnemyBullet(summon);
      }

      if (summon.y + summon.height >= runtime.player.y - 10) {
        showGameOver();
        return;
      }
    }
  }

  function getActiveBossSummonCount(role?: Invader["summonRole"]) {
    return runtimeRef.current.invaders.filter((invader) => {
      return (
        invader.active &&
        invader.row >= 90 &&
        (!role || invader.summonRole === role)
      );
    }).length;
  }

  function hasActiveSummonerGuardians() {
    const runtime = runtimeRef.current;

    return (
      runtime.boss.tier === "summoner" &&
      getActiveBossSummonCount("guardian") > 0
    );
  }

  function getActiveSummonerRoleTypes() {
    const roles: BossSummonRole[] = ["attacker", "guardian", "healer"];

    return roles.filter((role) => getActiveBossSummonCount(role) > 0);
  }

  function canSummonerUseRole(role: BossSummonRole) {
    const activeRoleTypes = getActiveSummonerRoleTypes();

    return (
      activeRoleTypes.includes(role) ||
      activeRoleTypes.length < SUMMONER_MAX_ACTIVE_ROLE_TYPES
    );
  }

  function getSummonerRoleNextAt(boss: Boss, role: BossSummonRole) {
    if (role === "guardian") {
      return boss.summonGuardianNextAt;
    }

    if (role === "healer") {
      return boss.summonHealerNextAt;
    }

    return boss.summonAttackerNextAt;
  }

  function setSummonerRoleCooldown(
    boss: Boss,
    role: BossSummonRole,
    now = performance.now()
  ) {
    if (role === "guardian") {
      boss.summonGuardianNextAt = now + SUMMONER_GUARDIAN_COOLDOWN_MS;
      return;
    }

    if (role === "healer") {
      boss.summonHealerNextAt = now + SUMMONER_HEALER_COOLDOWN_MS;
      return;
    }

    boss.summonAttackerNextAt = now + SUMMONER_ATTACKER_COOLDOWN_MS;
  }

  function canSummonerSummonRole(
    role: BossSummonRole,
    maxActive: number,
    now = performance.now()
  ) {
    const boss = runtimeRef.current.boss;

    if (
      role === "healer" &&
      boss.health > boss.maxHealth * SUMMONER_HEALER_HEALTH_THRESHOLD
    ) {
      return false;
    }

    return (
      now >= boss.summonNextAt &&
      now >= getSummonerRoleNextAt(boss, role) &&
      canSummonerUseRole(role) &&
      getActiveBossSummonCount(role) < maxActive
    );
  }

  function canBossSummonMinions(maxActive: number, now = performance.now()) {
    const boss = runtimeRef.current.boss;

    return now >= boss.summonNextAt && getActiveBossSummonCount() < maxActive;
  }

  function getRandomBossAttackType(boss: Boss): BossAttackType {
    const randomValue = Math.random();
    const now = performance.now();

    if (boss.tier === "omega") {
      if (randomValue < 0.36) {
        return "omegaLaser";
      }

      if (randomValue < 0.56) {
        return "omegaHalo";
      }

      if (randomValue < 0.74 && canBossSummonMinions(OMEGA_MAX_SUMMONS, now)) {
        return "omegaSummon";
      }

      return "omegaBurst";
    }

    if (boss.tier === "forge") {
      if (
        !boss.shieldActive &&
        now >= boss.shieldAvailableAt &&
        randomValue < 0.24
      ) {
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

    if (boss.tier === "summoner") {
      const canCallGuardians =
        getActiveBossSummonCount("guardian") === 0 &&
        canSummonerSummonRole("guardian", SUMMONER_MAX_GUARDIANS, now);
      const canCallHealers = canSummonerSummonRole(
        "healer",
        SUMMONER_MAX_HEALERS,
        now
      );
      const canCallAttackers = canSummonerSummonRole(
        "attacker",
        SUMMONER_MAX_ATTACKERS,
        now
      );

      if (canCallGuardians && randomValue < 0.22) {
        return "summonerGuard";
      }

      if (canCallHealers && randomValue < 0.44) {
        return "summonerHealers";
      }

      if (canCallAttackers && randomValue < 0.78) {
        return "summonerSwarm";
      }

      if (canCallAttackers && randomValue < 0.88) {
        return "summonerSwarm";
      }

      if (canCallHealers && randomValue < 0.94) {
        return "summonerHealers";
      }

      if (canCallGuardians) {
        return "summonerGuard";
      }

      return "summonerNeedles";
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
    vx = 0,
    followBossCenter = false
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
          createdAt: now,
          damageActiveAt: now + warningMs,
          expiresAt: now + warningMs + durationMs,
          followBossCenter,
        }
      )
    );
  }

  function shootBossQuasarLaserAttack(boss: Boss) {
    const bossCenterX = boss.x + boss.width / 2;
    const laserY = boss.y + boss.height - 8;
    const laserHeight = CANVAS_HEIGHT - laserY;

    shootBossLaserColumn(
      bossCenterX,
      laserY,
      laserHeight,
      30,
      "#4facfe",
      "#00f2fe",
      820,
      720,
      0,
      true
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
    glow: string,
    maxActive = OMEGA_MAX_SUMMONS,
    role: Invader["summonRole"] = "attacker"
  ) {
    const runtime = runtimeRef.current;
    const activeSummons = runtime.invaders.filter((invader) => {
      return invader.active && invader.row >= 90 && invader.summonRole === role;
    });

    if (activeSummons.length >= maxActive) {
      return false;
    }

    const allowedCount = Math.min(count, maxActive - activeSummons.length);
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
        summonRole: role,
        orbitAngle:
          role === "guardian" ? (Math.PI * 2 * index) / allowedCount : undefined,
        orbitRadius:
          role === "guardian" ? SUMMONER_GUARDIAN_SIDE_OFFSET_X : undefined,
        formationIndex: role === "guardian" ? activeSummons.length + index : index,
      });
    }

    createParticleExplosion(bossCenterX, boss.y + boss.height, glow);

    return allowedCount > 0;
  }

  function activateBossForgeShield(boss: Boss) {
    const now = performance.now();

    if (now < boss.shieldAvailableAt) {
      return;
    }

    boss.shieldActive = true;
    boss.shieldHitsLeft = FORGE_SHIELD_MAX_HITS;
    boss.shieldLastActivatedAt = now;
    boss.shieldNextShotAt = now + 120;
    boss.burstShotsLeft = FORGE_SHIELD_BURST_SIZE;
    boss.nextBurstShotAt = now + 120;
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
    const now = performance.now();

    if (!canBossSummonMinions(OMEGA_MAX_SUMMONS, now)) {
      shootBossOmegaBurstAttack(boss);
      return;
    }

    summonBossMinions(
      boss,
      OMEGA_SUMMON_COUNT,
      "triangle",
      "#be2edd",
      "#4facfe",
      OMEGA_MAX_SUMMONS,
      "attacker"
    );
    boss.summonNextAt = now + OMEGA_SUMMON_COOLDOWN_MS;
    shootBossOmegaBurstAttack(boss);
  }

  function shootBossSummonerSwarmAttack(boss: Boss) {
    if (!canSummonerSummonRole("attacker", SUMMONER_MAX_ATTACKERS)) {
      shootBossSummonerNeedlesAttack(boss);
      return;
    }

    const summoned = summonBossMinions(
      boss,
      SUMMONER_ATTACKER_COUNT,
      "triangle",
      "#38ef7d",
      "#26de81",
      SUMMONER_MAX_ATTACKERS,
      "attacker"
    );

    if (!summoned) {
      shootBossSummonerNeedlesAttack(boss);
      return;
    }

    const now = performance.now();
    boss.summonNextAt = now + SUMMONER_SUMMON_COOLDOWN_MS;
    setSummonerRoleCooldown(boss, "attacker", now);
  }

  function shootBossSummonerGuardAttack(boss: Boss) {
    if (!canSummonerSummonRole("guardian", SUMMONER_MAX_GUARDIANS)) {
      shootBossSummonerNeedlesAttack(boss);
      return;
    }

    const summoned = summonBossMinions(
      boss,
      SUMMONER_GUARDIAN_COUNT,
      "circle",
      "#4facfe",
      "#00f2fe",
      SUMMONER_MAX_GUARDIANS,
      "guardian"
    );

    if (!summoned) {
      shootBossSummonerNeedlesAttack(boss);
      return;
    }

    const now = performance.now();
    boss.summonNextAt = now + SUMMONER_SUMMON_COOLDOWN_MS;
    setSummonerRoleCooldown(boss, "guardian", now);
  }

  function shootBossSummonerHealerAttack(boss: Boss) {
    if (!canSummonerSummonRole("healer", SUMMONER_MAX_HEALERS)) {
      shootBossSummonerNeedlesAttack(boss);
      return;
    }

    const summoned = summonBossMinions(
      boss,
      SUMMONER_MAX_HEALERS,
      "square",
      "#f1c40f",
      "#38ef7d",
      SUMMONER_MAX_HEALERS,
      "healer"
    );

    if (!summoned) {
      shootBossSummonerNeedlesAttack(boss);
      return;
    }

    const now = performance.now();
    boss.summonNextAt = now + SUMMONER_SUMMON_COOLDOWN_MS;
    setSummonerRoleCooldown(boss, "healer", now);
  }

  function shootBossSummonerNeedlesAttack(boss: Boss) {
    const bossCenterX = boss.x + boss.width / 2;
    const bulletY = boss.y + boss.height - 4;

    for (let index = -2; index <= 2; index++) {
      shootBossBullet(
        bossCenterX + index * 24,
        bulletY,
        index * 0.22,
        boss.bulletSpeed * (0.7 + Math.abs(index) * 0.05),
        {
          color: index === 0 ? "#ffffff" : "#38ef7d",
          glow: "#26de81",
        }
      );
    }
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
      boss.burstShotsLeft = 0;
      boss.nextBurstShotAt = 0;
      boss.shieldAvailableAt = performance.now() + FORGE_SHIELD_COOLDOWN_MS;
      boss.nextAttackAt = performance.now() + 680;
      runtimeRef.current.shake = Math.max(runtimeRef.current.shake, 12);
    }

    syncStateFromRuntime();
    return true;
  }

  function updateForgeShieldMode(boss: Boss, now: number) {
    boss.x += boss.direction * boss.moveSpeed * 0.72;

    if (now < boss.nextBurstShotAt) {
      return;
    }

    const bossCenterX = boss.x + boss.width / 2;
    const bulletY = boss.y + boss.height - 4;

    for (let index = 0; index < 4; index++) {
      const offset = (index - 1.5) * 26;
      const drift = (index - 1.5) * 0.2;

      shootBossBullet(
        bossCenterX + offset,
        bulletY + Math.abs(index - 1.5) * 2,
        drift,
        boss.bulletSpeed * (0.72 + Math.abs(index - 1.5) * 0.04),
        {
          color: index === 1 || index === 2 ? "#ffffff" : "#ff6b35",
          glow: "#f1c40f",
        }
      );
    }

    boss.burstShotsLeft -= 1;

    if (boss.burstShotsLeft <= 0) {
      boss.burstShotsLeft = FORGE_SHIELD_BURST_SIZE;
      boss.nextBurstShotAt = now + FORGE_SHIELD_BURST_REST_MS;
      boss.shieldNextShotAt = boss.nextBurstShotAt;
      return;
    }

    boss.nextBurstShotAt = now + FORGE_SHIELD_BURST_INTERVAL_MS;
    boss.shieldNextShotAt = boss.nextBurstShotAt;
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

    if (attackType === "summonerSwarm") {
      shootBossSummonerSwarmAttack(boss);
    }

    if (attackType === "summonerGuard") {
      shootBossSummonerGuardAttack(boss);
    }

    if (attackType === "summonerHealers") {
      shootBossSummonerHealerAttack(boss);
    }

    if (attackType === "summonerNeedles") {
      shootBossSummonerNeedlesAttack(boss);
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


  return {
    damageForgeShield,
    hasActiveSummonerGuardians,
    updateBoss,
    updateBossMinions,
  };
}

export type SpaceInvadersBossEngine = ReturnType<
  typeof createSpaceInvadersBossEngine
>;
