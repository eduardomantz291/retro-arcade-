// Página do Space Invaders.
// Renderiza canvas, HUD, seleção de poderes, pause, game over e integração de XP.

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Link } from "react-router";
import { useAuth } from "../../contexts/AuthContext";
import { CANVAS_HEIGHT, CANVAS_WIDTH, FINAL_WAVE } from "./spaceInvadersConfig";
import { useSpaceInvadersGame } from "./useSpaceInvadersGame";
import "./space-invaders-style.css";

type PowerSlot = "attack" | "support" | "defense";

type PowerOption = {
  id: string;
  name: string;
  icon: string;
  summary: string;
  status: "available" | "locked";
};

const powerOptions: Record<PowerSlot, PowerOption[]> = {
  attack: [
    {
      id: "laser",
      name: "Laser",
      icon: "⚡",
      summary: "Feixe vertical que atravessa invasores e causa dano no boss.",
      status: "available",
    },
    {
      id: "bomb",
      name: "Bomba",
      icon: "💣",
      summary: "Explosão em área para limpar colunas perigosas.",
      status: "locked",
    },
    {
      id: "burst",
      name: "Rajada",
      icon: "🔥",
      summary: "Sequência curta de tiros rápidos para pressionar bosses.",
      status: "locked",
    },
  ],
  support: [
    {
      id: "support-ship",
      name: "Nave de suporte",
      icon: "🚀",
      summary: "Aliado temporario que acompanha a nave e dispara automaticamente.",
      status: "available",
    },
    {
      id: "homing-shot",
      name: "Tiro teleguiado",
      icon: "🎯",
      summary: "Disparo especial que procura o alvo mais próximo.",
      status: "locked",
    },
    {
      id: "drone",
      name: "Drone sentinela",
      icon: "🛰️",
      summary: "Pequeno drone que protege uma faixa da arena.",
      status: "locked",
    },
  ],
  defense: [
    {
      id: "shield",
      name: "Escudo",
      icon: "🛡️",
      summary: "Cúpula energética que bloqueia dois ataques inimigos.",
      status: "available",
    },
    {
      id: "barrier",
      name: "Barreira",
      icon: "🧱",
      summary: "Parede curta que segura uma chuva de tiros.",
      status: "locked",
    },
    {
      id: "repair",
      name: "Reparo",
      icon: "❤️",
      summary: "Recupera parte da nave quando a partida aperta.",
      status: "locked",
    },
  ],
};

const passiveOptions = [
  "Recarga mais curta",
  "Tiro principal mais rápido",
  "Vida extra inicial",
  "Mais dano contra bosses",
];

function SpaceInvadersGamePage() {
  const { isAuthenticated, isGuest } = useAuth();
  const loadoutCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const [showLoadout, setShowLoadout] = useState(false);
  const [showGuestWarning, setShowGuestWarning] = useState(isGuest);
  const [guestWarningAccepted, setGuestWarningAccepted] = useState(false);
  const [selectedPowers, setSelectedPowers] = useState<Record<PowerSlot, string>>(
    {
      attack: "laser",
      support: "support-ship",
      defense: "shield",
    }
  );

  const {
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
  } = useSpaceInvadersGame();

  const laserPowerStyle = {
    "--space-power-charge": laserCooldownProgress,
  } as CSSProperties;

  const supportPowerStyle = {
    "--space-power-charge": supportCooldownProgress,
  } as CSSProperties;

  const shieldPowerStyle = {
    "--space-power-charge": shieldCooldownProgress,
  } as CSSProperties;

  const bossHealthPercent =
    bossMaxHealth > 0 ? Math.max(0, (bossHealth / bossMaxHealth) * 100) : 0;

  const selectedAttackPower = powerOptions.attack.find(
    (option) => option.id === selectedPowers.attack
  );
  const selectedSupportPower = powerOptions.support.find(
    (option) => option.id === selectedPowers.support
  );
  const selectedDefensePower = powerOptions.defense.find(
    (option) => option.id === selectedPowers.defense
  );

  const laserPowerClassName = [
    "space-power-button",
    "space-laser-power-button",
    isLaserReady ? "space-power-ready" : "space-power-cooldown",
    isLaserActive ? "space-power-active" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const supportPowerClassName = [
    "space-power-button",
    "space-support-power-button",
    isSupportReady ? "space-power-ready" : "space-power-cooldown",
    isSupportActive ? "space-power-active" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const shieldPowerClassName = [
    "space-power-button",
    "space-shield-power-button",
    isShieldReady ? "space-power-ready" : "space-power-cooldown",
    isShieldActive ? "space-power-active" : "",
  ]
    .filter(Boolean)
    .join(" ");

  useEffect(() => {
    if (!showLoadout) {
      return;
    }

    const canvas = loadoutCanvasRef.current;

    if (!canvas) {
      return;
    }

    const ctx = canvas.getContext("2d");

    if (!ctx) {
      return;
    }

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2 + 18;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const backgroundGlow = ctx.createRadialGradient(
      centerX,
      centerY,
      12,
      centerX,
      centerY,
      170
    );

    backgroundGlow.addColorStop(0, "rgba(79, 172, 254, 0.26)");
    backgroundGlow.addColorStop(0.5, "rgba(56, 239, 125, 0.12)");
    backgroundGlow.addColorStop(1, "rgba(79, 172, 254, 0)");

    ctx.fillStyle = backgroundGlow;
    ctx.beginPath();
    ctx.arc(centerX, centerY, 170, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
    ctx.lineWidth = 1;

    for (let x = 20; x < canvas.width; x += 28) {
      ctx.beginPath();
      ctx.moveTo(x, 18);
      ctx.lineTo(x, canvas.height - 18);
      ctx.stroke();
    }

    for (let y = 18; y < canvas.height; y += 28) {
      ctx.beginPath();
      ctx.moveTo(20, y);
      ctx.lineTo(canvas.width - 20, y);
      ctx.stroke();
    }

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.scale(2.75, 2.75);

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
    ctx.lineWidth = 1;
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
    ctx.lineWidth = 1.15;
    ctx.stroke();

    ctx.shadowBlur = 14;
    ctx.shadowColor = "#ffffff";
    ctx.strokeStyle = "rgba(255, 255, 255, 0.58)";
    ctx.lineWidth = 0.9;

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
    ctx.lineWidth = 1.2;
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
  }, [showLoadout]);

  function handleStartGame() {
    if (!isAuthenticated && !isGuest) {
      return;
    }

    if (isGuest && !guestWarningAccepted) {
      setShowGuestWarning(true);
      return;
    }

    setShowLoadout(true);
  }

  function handleConfirmLoadout() {
    if (!isAuthenticated && !isGuest) {
      setShowLoadout(false);
      return;
    }

    if (isGuest && !guestWarningAccepted) {
      setShowGuestWarning(true);
      return;
    }

    setShowLoadout(false);
    startGame();
  }

  function handleBackToStartScreen() {
    setShowLoadout(false);
    backToStartScreen();
  }

  function handleRestartGame() {
    if (!isAuthenticated && !isGuest) {
      backToStartScreen();
      return;
    }

    if (isGuest && !guestWarningAccepted) {
      setShowGuestWarning(true);
      return;
    }

    restartGame();
  }

  function handleSelectPower(slot: PowerSlot, option: PowerOption) {
    if (option.status === "locked") {
      return;
    }

    setSelectedPowers((currentPowers) => ({
      ...currentPowers,
      [slot]: option.id,
    }));
  }

  const canStartGame = isAuthenticated || isGuest;
  const canPauseGame = screenState === "playing" || screenState === "paused";

  useEffect(() => {
    if (isGuest && !guestWarningAccepted) {
      setShowGuestWarning(true);
    }
  }, [isGuest, guestWarningAccepted]);

  useEffect(() => {
    function handlePauseShortcut(event: KeyboardEvent) {
      if (event.key !== "Escape") {
        return;
      }

      if (screenState === "playing") {
        pauseGame();
        return;
      }

      if (screenState === "paused") {
        resumeGame();
      }
    }

    window.addEventListener("keydown", handlePauseShortcut);

    return () => {
      window.removeEventListener("keydown", handlePauseShortcut);
    };
  }, [pauseGame, resumeGame, screenState]);

  function handleAcceptGuestWarning() {
    setGuestWarningAccepted(true);
    setShowGuestWarning(false);
  }

  return (
    <main className="space-page">
      <div className="space-background-grid" />
      <div className="space-background-orb space-orb-one" />
      <div className="space-background-orb space-orb-two" />

      <section className="space-shell">
        <header className="space-topbar space-glass-panel">
          <Link to="/" className="space-back-link">
            ← Home
          </Link>

          {canPauseGame && (
            <button
              className="space-pause-button"
              type="button"
              onClick={screenState === "paused" ? resumeGame : pauseGame}
            >
              {screenState === "paused" ? "Continuar" : "Pausar"}
            </button>
          )}

          <div className="space-title">
            <span>👾</span>

            <div>
              <strong>Space Invaders</strong>
              <p>Defenda a Terra contra uma invasão geométrica.</p>
            </div>
          </div>
        </header>

        <section className="space-scoreboard">
          <div className="space-score-box space-glass-panel">
            Pontos <span>{score}</span>
          </div>

          <div className="space-score-box space-glass-panel">
            Vidas <span>{lives}</span>
          </div>

          <div className="space-score-box space-glass-panel">
            Onda <span>{wave}</span>
          </div>
        </section>

        <section className="space-game-area">
          {isBossActive && (
            <div className="space-boss-panel space-glass-panel">
              <div>
                <strong>👾 {bossName || "Boss Alienigena"}</strong>
                <span>
                  {bossHealth}/{bossMaxHealth} HP
                </span>
              </div>

              <div className="space-boss-health-bar">
                <span style={{ width: `${bossHealthPercent}%` }} />
              </div>
            </div>
          )}

          <div className="space-canvas-wrapper">
            <canvas
              ref={canvasRef}
              width={CANVAS_WIDTH}
              height={CANVAS_HEIGHT}
              className="space-canvas"
              onMouseMove={(event) => handlePointerMove(event.clientX)}
              onTouchMove={(event) => {
                handlePointerMove(event.touches[0].clientX);
              }}
            />
          </div>

          {screenState === "start" && !showLoadout && (
            <div className="space-overlay">
              <div className="space-start-card space-glass-panel">
                <span className="space-start-icon">👾</span>

                <p className="space-eyebrow">Retro Arcade Mission</p>

                <h1>Space Invaders</h1>

                <p>
                  Mova sua nave, atire nos invasores, complete ondas para ganhar
                  vidas e prepare-se para enfrentar bosses nas ondas 5, 10, 15,
                  20, 25 e 30.
                </p>

                <div className="space-start-grid">
                  <span>⬅️ ➡️ ou A/D movem a nave</span>
                  <span>Espaço ou W atira</span>
                  <span>Q ativa o Laser</span>
                  <span>E chama a nave de suporte</span>
                  <span>R ativa o Escudo</span>
                  <span>Bosses nas ondas 5, 10, 15, 20, 25 e 30</span>
                  <span>Onda {FINAL_WAVE} encerra a missao</span>
                </div>

                {canStartGame ? (
                  <button
                    className="space-btn space-btn-primary"
                    type="button"
                    onClick={handleStartGame}
                  >
                    Preparar nave
                  </button>
                ) : (
                  <div className="space-login-warning">
                    <strong>Entre para jogar</strong>
                    <p>
                      Para jogar e salvar progresso, entre na sua conta ou
                      continue como visitante pela Home.
                    </p>

                    <div className="space-login-actions">
                      <Link className="space-btn space-btn-primary" to="/login">
                        Entrar
                      </Link>

                      <Link className="space-btn space-btn-secondary" to="/">
                        Voltar para Home
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {screenState === "start" && showLoadout && (
            <div className="space-overlay space-loadout-overlay">
              <div className="space-loadout-card space-glass-panel">
                <div className="space-loadout-preview">
                  <div className="space-loadout-preview-heading">
                    <span className="space-eyebrow">Hangar</span>
                    <h2>Nave pronta para missão</h2>
                  </div>

                  <canvas
                    ref={loadoutCanvasRef}
                    width={420}
                    height={360}
                    className="space-loadout-canvas"
                  />

                  <div className="space-loadout-summary">
                    <div>
                      <strong>{selectedAttackPower?.icon}</strong>
                      <span>{selectedAttackPower?.name}</span>
                    </div>

                    <div>
                      <strong>{selectedSupportPower?.icon}</strong>
                      <span>{selectedSupportPower?.name}</span>
                    </div>

                    <div>
                      <strong>{selectedDefensePower?.icon}</strong>
                      <span>{selectedDefensePower?.name}</span>
                    </div>
                  </div>
                </div>

                <div className="space-loadout-panel">
                  <div className="space-loadout-heading">
                    <span className="space-eyebrow">Loadout</span>
                    <h1>Escolha seus poderes</h1>
                    <p>
                      Esta primeira versão prepara os slots da nave. Novos
                      poderes e passivas serão desbloqueados conforme a
                      progressão evoluir.
                    </p>
                  </div>

                  <div className="space-loadout-columns">
                    {(
                      [
                        ["attack", "Ataque"],
                        ["support", "Suporte"],
                        ["defense", "Defesa"],
                      ] as [PowerSlot, string][]
                    ).map(([slot, title]) => (
                      <section className="space-loadout-column" key={slot}>
                        <h2>{title}</h2>

                        {powerOptions[slot].map((option) => {
                          const isSelected = selectedPowers[slot] === option.id;
                          const isLocked = option.status === "locked";

                          return (
                            <button
                              className={[
                                "space-loadout-option",
                                isSelected ? "space-loadout-option-selected" : "",
                                isLocked ? "space-loadout-option-locked" : "",
                              ]
                                .filter(Boolean)
                                .join(" ")}
                              disabled={isLocked}
                              key={option.id}
                              type="button"
                              onClick={() => handleSelectPower(slot, option)}
                            >
                              <span className="space-loadout-option-icon">
                                {option.icon}
                              </span>

                              <span className="space-loadout-option-copy">
                                <strong>{option.name}</strong>
                                <small>{option.summary}</small>
                              </span>

                              <span className="space-loadout-option-status">
                                {isLocked ? "Bloqueado" : "Equipado"}
                              </span>
                            </button>
                          );
                        })}
                      </section>
                    ))}
                  </div>

                  <section className="space-passive-row">
                    <div>
                      <span className="space-eyebrow">Passivas</span>
                      <h2>Módulos futuros</h2>
                    </div>

                    <div className="space-passive-list">
                      {passiveOptions.map((passive) => (
                        <span key={passive}>{passive}</span>
                      ))}
                    </div>
                  </section>

                  <div className="space-loadout-actions">
                    <button
                      className="space-btn space-btn-secondary"
                      type="button"
                      onClick={() => setShowLoadout(false)}
                    >
                      Voltar
                    </button>

                    <button
                      className="space-btn space-btn-primary"
                      type="button"
                      onClick={handleConfirmLoadout}
                    >
                      Começar missão
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {screenState === "game-over" && (
            <div className="space-overlay">
              <div className="space-modal space-glass-panel">
                <span className="space-modal-icon">💥</span>

                <h1>Game Over</h1>

                <p>
                  Você fez <strong>{score}</strong> pontos e chegou na onda{" "}
                  <strong>{wave}</strong>.
                </p>

                <div className="space-modal-actions">
                  <button
                    className="space-btn space-btn-primary"
                    type="button"
                    onClick={handleRestartGame}
                  >
                    Tentar novamente
                  </button>

                  <button
                    className="space-btn space-btn-secondary"
                    type="button"
                    onClick={handleBackToStartScreen}
                  >
                    Voltar ao início
                  </button>

                  <Link className="space-btn space-btn-ghost" to="/">
                    Home
                  </Link>
                </div>
              </div>
            </div>
          )}

          {screenState === "victory" && (
            <div className="space-overlay">
              <div className="space-modal space-victory-modal space-glass-panel">
                <span className="space-modal-icon">✨</span>

                <h1>Vitoria!</h1>

                <p>
                  Voce derrotou o <strong>Nucleo Omega</strong>, fechou a onda{" "}
                  <strong>{FINAL_WAVE}</strong> e terminou a missao com{" "}
                  <strong>{score}</strong> pontos.
                </p>

                <div className="space-modal-actions">
                  <button
                    className="space-btn space-btn-primary"
                    type="button"
                    onClick={handleRestartGame}
                  >
                    Jogar novamente
                  </button>

                  <button
                    className="space-btn space-btn-secondary"
                    type="button"
                    onClick={handleBackToStartScreen}
                  >
                    Voltar ao inicio
                  </button>

                  <Link className="space-btn space-btn-ghost" to="/">
                    Home
                  </Link>
                </div>
              </div>
            </div>
          )}

          {screenState === "paused" && (
            <div className="space-overlay">
              <div className="space-modal space-glass-panel">
                <span className="space-modal-icon">⏸️</span>

                <h1>Pausa</h1>

                <p>A invasão ficou congelada. Volte quando estiver pronto.</p>

                <div className="space-modal-actions">
                  <button
                    className="space-btn space-btn-primary"
                    type="button"
                    onClick={resumeGame}
                  >
                    Voltar a jogar
                  </button>

                  <Link className="space-btn space-btn-secondary" to="/">
                    Voltar para Home
                  </Link>
                </div>
              </div>
            </div>
          )}
        </section>

        <section className="space-control-panel space-glass-panel">
          <div>
            <strong>Controles</strong>
            <span>
              Mouse/A-D para mover, Espaço/W para atirar, Q Laser, E Suporte e R
              Escudo.
            </span>
          </div>

          <div className="space-action-buttons">
            <button
              className="space-shoot-button"
              type="button"
              onClick={handleShootAction}
              disabled={screenState !== "playing"}
            >
              🔥 Atirar
            </button>

            <button
              className={laserPowerClassName}
              style={laserPowerStyle}
              type="button"
              onClick={handleLaserPowerAction}
              disabled={screenState !== "playing"}
            >
              <span>⚡</span>
              <small>{isLaserActive ? "ATIVO" : isLaserReady ? "Q" : "REC"}</small>
            </button>

            <button
              className={supportPowerClassName}
              style={supportPowerStyle}
              type="button"
              onClick={handleSupportPowerAction}
              disabled={screenState !== "playing"}
            >
              <span>🚀</span>
              <small>
                {isSupportActive ? "ATIVO" : isSupportReady ? "E" : "REC"}
              </small>
            </button>

            <button
              className={shieldPowerClassName}
              style={shieldPowerStyle}
              type="button"
              onClick={handleShieldPowerAction}
              disabled={screenState !== "playing"}
            >
              <span>🛡️</span>
              <small>
                {isShieldActive
                  ? `${shieldHitsLeft}/2`
                  : isShieldReady
                    ? "R"
                    : "REC"}
              </small>
            </button>
          </div>
        </section>
      </section>

      {showGuestWarning && (
        <div className="space-page-modal-backdrop">
          <div className="space-warning-modal space-glass-panel">
            <span className="space-modal-icon">⚠️</span>

            <h2>Modo visitante</h2>

            <p>
              Você pode jogar normalmente, mas seus pontos e progresso não serão
              salvos enquanto estiver como visitante.
            </p>

            <div className="space-modal-actions">
              <button
                className="space-btn space-btn-primary"
                type="button"
                onClick={handleAcceptGuestWarning}
              >
                Entendi
              </button>

              <Link className="space-btn space-btn-secondary" to="/login">
                Entrar na conta
              </Link>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default SpaceInvadersGamePage;
