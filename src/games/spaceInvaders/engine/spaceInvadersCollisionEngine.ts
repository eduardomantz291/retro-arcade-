// Motor de colisões do Space Invaders.
// Cuida de tiros, escudo, dano em boss, dano no player e limpeza de projéteis.

import type { MutableRefObject } from "react";
import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  FINAL_WAVE,
  PLAYER_MAX_LIVES,
  POINTS_PER_INVADER,
  SHIELD_POWER_MAX_HITS,
} from "../spaceInvadersConfig";
import type { SpaceInvadersRuntime } from "../spaceInvadersTypes";
import type { SpaceInvadersBossEngine } from "./spaceInvadersBossEngine";
import { clamp, isColliding } from "./spaceInvadersUtils";

type SpaceInvadersCollisionEngineContext = {
  runtimeRef: MutableRefObject<SpaceInvadersRuntime>;
  bossEngine: SpaceInvadersBossEngine;
  createParticleExplosion: (x: number, y: number, color: string) => void;
  syncStateFromRuntime: () => void;
  syncPowerState: () => void;
  advanceToNextNormalWave: (nextWave: number) => void;
  showGameOver: () => void;
  showVictory: () => void;
};

export function createSpaceInvadersCollisionEngine({
  runtimeRef,
  bossEngine,
  createParticleExplosion,
  syncStateFromRuntime,
  syncPowerState,
  advanceToNextNormalWave,
  showGameOver,
  showVictory,
}: SpaceInvadersCollisionEngineContext) {
  function updateBullets() {
    const runtime = runtimeRef.current;
    const now = performance.now();

    for (const bullet of runtime.playerBullets) {
      bullet.x += bullet.vx;
      bullet.y += bullet.vy;
    }

    for (const bullet of runtime.enemyBullets) {
      if (
        bullet.source === "boss-laser" &&
        bullet.followBossCenter &&
        runtime.boss.active
      ) {
        bullet.x = clamp(
          runtime.boss.x + runtime.boss.width / 2 - bullet.width / 2,
          18,
          CANVAS_WIDTH - bullet.width - 18
        );
        bullet.y = runtime.boss.y + runtime.boss.height - 8;
        bullet.height = CANVAS_HEIGHT - bullet.y;
      }

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
      bossEngine.damageForgeShield(runtime.boss, shieldDamage);
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

        if (bossEngine.hasActiveSummonerGuardians()) {
          createParticleExplosion(
            bullet.x + bullet.width / 2,
            bullet.y + bullet.height / 2,
            "#4facfe"
          );
          continue;
        }

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


  return {
    damageBoss,
    handleEnemyBulletCollisions,
    handlePlayerBulletCollisions,
    handleShieldBulletCollisions,
    updateBullets,
  };
}
