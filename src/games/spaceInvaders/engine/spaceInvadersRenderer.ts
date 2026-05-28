// Renderer completo do Space Invaders.
// O hook principal controla estado e regras; este arquivo desenha o runtime atual
// no canvas para manter a engine mais dividida e facil de navegar.

import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  LASER_POWER_DURATION_MS,
  LASER_POWER_MAX_WIDTH,
  SHIELD_POWER_MAX_HITS,
} from "../spaceInvadersConfig";
import { FORGE_SHIELD_MAX_HITS } from "./spaceInvadersBossRuntime";
import type { Boss, SpaceInvadersRuntime } from "../spaceInvadersTypes";
import { clamp } from "./spaceInvadersUtils";
import { drawInvader } from "./spaceInvadersInvaderRenderer";

function hasActiveSummonerGuardians(runtime: SpaceInvadersRuntime) {
  return (
    runtime.boss.tier === "summoner" &&
    runtime.invaders.some((invader) => {
      return invader.active && invader.row >= 90 && invader.summonRole === "guardian";
    })
  );
}

export function drawSpaceInvadersRuntime(
  ctx: CanvasRenderingContext2D,
  runtime: SpaceInvadersRuntime
) {
  // Mantem compatibilidade com funcoes extraidas do antigo hook.
  const runtimeRef = { current: runtime };
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

  function drawSummonerBoss(ctx: CanvasRenderingContext2D, boss: Boss) {
    const centerX = boss.x + boss.width / 2;
    const centerY = boss.y + boss.height / 2;
    const pulse = Math.abs(Math.sin(Date.now() / 130));
    const isProtected = hasActiveSummonerGuardians(runtimeRef.current);

    ctx.save();

    ctx.shadowBlur = 34 + pulse * 18;
    ctx.shadowColor = "#38ef7d";

    const mantleGradient = ctx.createLinearGradient(
      boss.x,
      boss.y,
      boss.x + boss.width,
      boss.y + boss.height
    );

    mantleGradient.addColorStop(0, "#071016");
    mantleGradient.addColorStop(0.24, "#38ef7d");
    mantleGradient.addColorStop(0.52, "#4facfe");
    mantleGradient.addColorStop(0.78, "#be2edd");
    mantleGradient.addColorStop(1, "#f1c40f");

    ctx.fillStyle = mantleGradient;
    ctx.beginPath();
    ctx.moveTo(centerX, boss.y - 10);
    ctx.lineTo(boss.x + boss.width + 16, centerY + 8);
    ctx.lineTo(centerX + 58, boss.y + boss.height + 20);
    ctx.lineTo(centerX + 18, boss.y + boss.height - 4);
    ctx.lineTo(centerX, boss.y + boss.height + 28);
    ctx.lineTo(centerX - 18, boss.y + boss.height - 4);
    ctx.lineTo(centerX - 58, boss.y + boss.height + 20);
    ctx.lineTo(boss.x - 16, centerY + 8);
    ctx.closePath();
    ctx.fill();

    ctx.globalAlpha = 0.82;
    ctx.fillStyle = "rgba(7, 16, 22, 0.88)";
    ctx.beginPath();
    ctx.ellipse(centerX, centerY + 4, boss.width * 0.31, boss.height * 0.42, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = 1;
    ctx.shadowBlur = 26 + pulse * 10;
    ctx.shadowColor = "#38ef7d";

    const portalGradient = ctx.createRadialGradient(
      centerX,
      centerY + 2,
      4,
      centerX,
      centerY + 2,
      42
    );

    portalGradient.addColorStop(0, "#ffffff");
    portalGradient.addColorStop(0.25, "#38ef7d");
    portalGradient.addColorStop(0.62, "#4facfe");
    portalGradient.addColorStop(1, "rgba(56, 239, 125, 0.05)");

    ctx.fillStyle = portalGradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY + 2, 30 + pulse * 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#f1c40f";
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.48 + pulse * 0.24;

    for (let index = 0; index < 3; index++) {
      ctx.beginPath();
      ctx.ellipse(
        centerX,
        centerY + 2,
        42 + index * 15 + pulse * 4,
        16 + index * 7,
        index * 0.55 + Date.now() / 900,
        0,
        Math.PI * 2
      );
      ctx.stroke();
    }

    ctx.globalAlpha = 1;
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(centerX - 42, centerY - 10, 7, 0, Math.PI * 2);
    ctx.arc(centerX + 42, centerY - 10, 7, 0, Math.PI * 2);
    ctx.fill();

    if (isProtected) {
      ctx.globalAlpha = 0.3 + pulse * 0.18;
      ctx.shadowBlur = 30;
      ctx.shadowColor = "#4facfe";
      ctx.strokeStyle = "#4facfe";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.ellipse(centerX, centerY + 4, boss.width * 0.34, boss.height * 0.38, 0, 0, Math.PI * 2);
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

    if (boss.tier === "summoner") {
      drawSummonerBoss(ctx, boss);
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
        const warningStartAt =
          bullet.createdAt ??
          (bullet.damageActiveAt ? bullet.damageActiveAt - 650 : now);
        const warningDuration = Math.max(
          1,
          (bullet.damageActiveAt ?? now) - warningStartAt
        );
        const warningProgress = clamp(
          (now - warningStartAt) / warningDuration,
          0,
          1
        );
        const activeProgress = bullet.damageActiveAt
          ? clamp((now - bullet.damageActiveAt) / 180, 0, 1)
          : 1;
        const color = bullet.color ?? "#f1c40f";
        const glow = bullet.glow ?? color;
        const originX = bullet.x + bullet.width / 2;
        const originY = bullet.y + 8;
        const visualWidth = isArmed
          ? bullet.width * (0.78 + activeProgress * 0.34)
          : Math.max(4, bullet.width * (0.16 + warningProgress * 0.24));
        const visualX = originX - visualWidth / 2;

        ctx.save();
        ctx.globalAlpha = isArmed ? 0.82 : 0.22 + warningProgress * 0.24;
        ctx.shadowBlur = isArmed ? 36 : 14 + warningProgress * 14;
        ctx.shadowColor = glow;

        const beamGradient = ctx.createLinearGradient(
          visualX,
          0,
          visualX + visualWidth,
          0
        );

        beamGradient.addColorStop(0, "rgba(255, 255, 255, 0.08)");
        beamGradient.addColorStop(0.2, color);
        beamGradient.addColorStop(0.5, "#ffffff");
        beamGradient.addColorStop(0.8, color);
        beamGradient.addColorStop(1, "rgba(255, 255, 255, 0.08)");

        ctx.fillStyle = beamGradient;
        drawRoundedRect(ctx, visualX, bullet.y, visualWidth, bullet.height, 999);

        ctx.globalAlpha = isArmed ? 0.92 : 0.48;
        ctx.fillStyle = "#ffffff";
        drawRoundedRect(
          ctx,
          originX - Math.max(2, visualWidth * 0.08),
          bullet.y,
          Math.max(3, visualWidth * 0.16),
          bullet.height,
          999
        );

        if (!isArmed) {
          ctx.globalAlpha = 0.34 + warningProgress * 0.38;
          ctx.strokeStyle = color;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(
            originX,
            originY,
            8 + warningProgress * 24,
            0,
            Math.PI * 2
          );
          ctx.stroke();

          ctx.globalAlpha = 0.72;
          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.arc(originX, originY, 3 + warningProgress * 4, 0, Math.PI * 2);
          ctx.fill();
        }

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

