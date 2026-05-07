// Página principal do Snake Game.
// Este arquivo cuida da interface visual: header, placar, canvas, tela inicial,
// contagem regressiva, Game Over e avisos de login/visitante.
// A lógica pesada do jogo fica no hook useSnakeGame.

import { useEffect, useState } from "react";
import { Link } from "react-router";
import { useAuth } from "../../contexts/AuthContext";
import { CANVAS_SIZE } from "./snakeConfig";
import { useSnakeGame } from "./useSnakeGame";
import "./snake-game-style.css";

function SnakeGamePage() {
  const { isAuthenticated, isGuest } = useAuth();

  const {
    canvasRef,
    screenState,
    countdownText,
    score,
    finalScore,
    highScore,
    goldenPercent,
    magnetPercent,
    startGame,
    backToStartScreen,
  } = useSnakeGame({ isAuthenticated });

  const [showGuestWarning, setShowGuestWarning] = useState(isGuest);
  const [guestWarningAccepted, setGuestWarningAccepted] = useState(false);
  const [showLoginWarning, setShowLoginWarning] = useState(
    !isAuthenticated && !isGuest
  );

  useEffect(() => {
    // Visitante pode jogar, mas precisa ver o aviso sobre progresso.
    if (isGuest && !guestWarningAccepted) {
      setShowGuestWarning(true);
    }

    // Usuário sem login e sem modo visitante não joga direto.
    if (!isAuthenticated && !isGuest) {
      setShowLoginWarning(true);
    }
  }, [isAuthenticated, isGuest, guestWarningAccepted]);

  // Valida se o jogador pode iniciar a partida.
  // Usuário logado joga direto, visitante precisa aceitar o aviso,
  // e quem não escolheu visitante nem login recebe aviso de login.
  function handleStartGame() {
    if (!isAuthenticated && !isGuest) {
      setShowLoginWarning(true);
      return;
    }

    if (isGuest && !guestWarningAccepted) {
      setShowGuestWarning(true);
      return;
    }

    startGame();
  }

  // Confirma o aviso de visitante e já começa o jogo.
  function handleAcceptGuestWarning() {
    setGuestWarningAccepted(true);
    setShowGuestWarning(false);
    startGame();
  }

  return (
    <main className="snake-page">
      <div className="background-orb orb-one" />
      <div className="background-orb orb-two" />
      <div className="background-grid" />

      <section className="snake-shell">
        <header className="snake-topbar glass-panel">
          <Link to="/" className="snake-back-link">
            ← Home
          </Link>

          <div className="snake-title">
            <span>🐍</span>

            <div>
              <strong>Snake Arcade</strong>
              <p>Frutas especiais, poderes e frenesi.</p>
            </div>
          </div>
        </header>

        <section className="snake-scoreboard">
          <div className="snake-score-box glass-panel">
            PONTOS <span>{score}</span>
          </div>

          <div className="snake-score-box glass-panel">
            RECORDE <span>{highScore}</span>
          </div>
        </section>

        <section className="snake-power-area glass-panel">
          <div className="snake-power-panel-title">
            <strong>Poderes</strong>
            <span>🌟 Proteção, 🧲 Ímã e 🟢 Frenesi aparecem durante a partida.</span>
          </div>

          <div className="snake-power-list">
            <div className="snake-power-ui snake-power-slot">
              <span>🌟 PROTEÇÃO</span>

              <div className="snake-bar-bg">
                <div
                  className="snake-bar-fill snake-bar-golden"
                  style={{ width: `${goldenPercent}%` }}
                />
              </div>
            </div>

            <div className="snake-power-ui snake-power-slot">
              <span>🧲 ÍMÃ</span>

              <div className="snake-bar-bg">
                <div
                  className="snake-bar-fill snake-bar-purple"
                  style={{ width: `${magnetPercent}%` }}
                />
              </div>
            </div>
          </div>
        </section>

        <section className="snake-canvas-area">
          <div className="snake-canvas-wrapper">
            <canvas
              ref={canvasRef}
              width={CANVAS_SIZE}
              height={CANVAS_SIZE}
              className="snake-canvas"
            />
          </div>
        </section>
      </section>

      {screenState === "start" && (
        <div className="snake-screen-backdrop">
          <div className="snake-start-modal glass-panel">
            <div className="snake-start-main">
              <span className="snake-screen-icon">🐍</span>

              <div>
                <span className="snake-start-kicker">Retro Arcade Challenge</span>

                <h1>Snake Arcade</h1>

                <p>
                  Controle a cobrinha, colete frutas, ative poderes especiais e
                  sobreviva ao caos das frutas pretas.
                </p>
              </div>
            </div>

            <div className="snake-start-grid">
              <span>⬆️ Setas ou WASD controlam</span>
              <span>📱 No celular, deslize o dedo</span>
              <span>🍎 Vermelha soma pontos</span>
              <span>🌟 Amarela dá proteção</span>
              <span>🧲 Roxa atrai frutas</span>
              <span>🟢 Verde ativa frenesi</span>
              <span>⚫ Preta causa dano</span>
              <span>🏆 Logado salva recorde</span>
            </div>

            <button
              className="btn btn-primary snake-start-button"
              type="button"
              onClick={handleStartGame}
            >
              Iniciar jogo
            </button>
          </div>
        </div>
      )}

      {screenState === "countdown" && (
        <div className="snake-screen-backdrop snake-countdown-backdrop">
          <div className="snake-countdown-modal glass-panel">
            <strong>{countdownText}</strong>
          </div>
        </div>
      )}

      {screenState === "game-over" && (
        <div className="snake-screen-backdrop">
          <div className="snake-screen-modal snake-game-over-modal glass-panel">
            <span className="snake-game-over-icon">💥</span>

            <h1 className="snake-game-over-title">Fim de jogo</h1>

            <div className="snake-final-score">
              <span>PONTOS</span>
              <strong>{finalScore}</strong>
            </div>

            {!isAuthenticated && (
              <p className="snake-save-warning">
                Como visitante, essa pontuação não foi salva.
              </p>
            )}

            <div className="snake-screen-actions">
              <button
                className="btn btn-primary"
                type="button"
                onClick={handleStartGame}
              >
                Tentar novamente
              </button>

              <button
                className="btn btn-secondary"
                type="button"
                onClick={backToStartScreen}
              >
                Voltar ao início
              </button>
            </div>
          </div>
        </div>
      )}

      {showGuestWarning && (
        <div className="snake-modal-backdrop">
          <div className="snake-warning-modal glass-panel">
            <span className="snake-modal-icon">⚠️</span>

            <h2>Modo visitante</h2>

            <p>
              Você pode jogar normalmente, mas seus pontos, recordes e progresso
              não serão salvos enquanto estiver como visitante.
            </p>

            <div className="snake-modal-actions">
              <button
                className="btn btn-primary"
                type="button"
                onClick={handleAcceptGuestWarning}
              >
                Entendi, começar jogo
              </button>

              <Link className="btn btn-secondary" to="/login">
                Entrar na conta
              </Link>
            </div>
          </div>
        </div>
      )}

      {showLoginWarning && (
        <div className="snake-modal-backdrop">
          <div className="snake-warning-modal glass-panel">
            <span className="snake-modal-icon">🔐</span>

            <h2>Entre para jogar</h2>

            <p>
              Para jogar e salvar seu progresso, entre na sua conta ou crie um
              cadastro. Também é possível continuar como visitante pela Home.
            </p>

            <div className="snake-modal-actions">
              <Link className="btn btn-primary" to="/login">
                Entrar
              </Link>

              <Link className="btn btn-secondary" to="/register">
                Criar conta
              </Link>

              <Link className="btn btn-ghost" to="/">
                Voltar para Home
              </Link>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default SnakeGamePage;
