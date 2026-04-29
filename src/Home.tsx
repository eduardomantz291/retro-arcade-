import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { useAuth } from "./contexts/AuthContext";
import "./home-style.css";

type GameStatus = "available" | "coming-soon" | "locked";

type HomeContentView = "games" | "account";

type Game = {
  id: number;
  title: string;
  description: string;
  emoji: string;
  status: GameStatus;
  requiredLevel: number;
  tag: string;
  highlightLabel: string;
  bonusLabel: string;
  powerUps: string;
  replayValue: string;
};

const games: Game[] = [
  {
    id: 1,
    title: "Snake Arcade",
    description:
      "A cobrinha evoluída com poderes, frutas especiais, combo e frenesi.",
    emoji: "🐍",
    status: "available",
    requiredLevel: 1,
    tag: "Disponível",
    highlightLabel: "Jogo em destaque",
    bonusLabel: "250+",
    powerUps: "5",
    replayValue: "∞",
  },
  {
    id: 2,
    title: "Number Merge",
    description:
      "Combine números, faça combos e tente alcançar a maior pontuação.",
    emoji: "🧩",
    status: "locked",
    requiredLevel: 3,
    tag: "Nível 3",
    highlightLabel: "Próximo desafio",
    bonusLabel: "Combo",
    powerUps: "Merge",
    replayValue: "Score",
  },
  {
    id: 3,
    title: "Ghost Maze",
    description: "Um labirinto retrô inspirado em clássicos de perseguição.",
    emoji: "👻",
    status: "locked",
    requiredLevel: 5,
    tag: "Nível 5",
    highlightLabel: "Mistério retrô",
    bonusLabel: "Maze",
    powerUps: "Ghost",
    replayValue: "Skill",
  },
  {
    id: 4,
    title: "Space Shooter",
    description: "Controle uma nave, desvie de obstáculos e destrua inimigos.",
    emoji: "🚀",
    status: "coming-soon",
    requiredLevel: 8,
    tag: "Em breve",
    highlightLabel: "Em desenvolvimento",
    bonusLabel: "Wave",
    powerUps: "Laser",
    replayValue: "Boss",
  },
];

function Home() {
  const { user, isAuthenticated, isGuest, logout, continueAsGuest } = useAuth();

  const contentSectionRef = useRef<HTMLElement | null>(null);

  const [showAuthWarning, setShowAuthWarning] = useState(
    !isAuthenticated && !isGuest
  );

  const [activeContentView, setActiveContentView] =
    useState<HomeContentView>("games");

  const [featuredGameIndex, setFeaturedGameIndex] = useState(0);

  const userLevel = user?.level ?? 0;
  const userPoints = user?.points ?? 0;
  const userName = user?.username ?? "";
  const featuredGame = games[featuredGameIndex];

  useEffect(() => {
    // Se o usuário estiver logado ou em modo visitante,
    // fechamos o aviso inicial.
    if (isAuthenticated || isGuest) {
      setShowAuthWarning(false);
    }
  }, [isAuthenticated, isGuest]);

  useEffect(() => {
    // Se o usuário sair da conta enquanto estiver vendo Minha Conta,
    // voltamos automaticamente para a lista de jogos.
    if (!isAuthenticated && activeContentView === "account") {
      setActiveContentView("games");
    }
  }, [isAuthenticated, activeContentView]);

  useEffect(() => {
    // Troca o jogo em destaque automaticamente a cada 10 segundos.
    const intervalId = window.setInterval(() => {
      setFeaturedGameIndex((currentIndex) => {
        return (currentIndex + 1) % games.length;
      });
    }, 10000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  function scrollToContentSection() {
    window.setTimeout(() => {
      contentSectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 80);
  }

  function handleGuestMode() {
    // Modo visitante: pode explorar a Home e jogar,
    // mas não acessa áreas protegidas como Perfil e Minha Conta.
    continueAsGuest();
    setShowAuthWarning(false);
  }

  function handleProtectedAction() {
    // Sempre que uma área exigir login real, mostramos o aviso.
    if (!isAuthenticated) {
      setShowAuthWarning(true);
    }
  }

  function handleShowGames() {
    setActiveContentView("games");
    scrollToContentSection();
  }

  function handleShowAccount() {
    if (!isAuthenticated) {
      handleProtectedAction();
      return;
    }

    setActiveContentView("account");
    scrollToContentSection();
  }

  function handleNextFeaturedGame() {
    setFeaturedGameIndex((currentIndex) => {
      return (currentIndex + 1) % games.length;
    });
  }

  function getEffectiveLevel() {
    // Usuário logado usa o nível real.
    // Visitante recebe nível 1 apenas para testar o Snake.
    // Usuário sem login e sem modo visitante fica com nível 0.
    if (isAuthenticated) {
      return userLevel;
    }

    if (isGuest) {
      return 1;
    }

    return 0;
  }

  function canPlayGame(game: Game) {
    const effectiveLevel = getEffectiveLevel();

    return game.status === "available" && effectiveLevel >= game.requiredLevel;
  }

  function renderFeaturedGameAction() {
    if (isAuthenticated || isGuest) {
      return (
        <Link className="btn btn-primary full-width" to="/games/snake">
          Jogar agora
        </Link>
      );
    }

    return (
      <button
        className="btn btn-primary full-width"
        type="button"
        onClick={handleProtectedAction}
      >
        Jogar agora
      </button>
    );
  }

  return (
    <main className="app">
      <div className="background-orb orb-one" />
      <div className="background-orb orb-two" />
      <div className="background-grid" />

      <header className="site-header glass-panel">
        <div className="brand">
          <span className="brand-icon">🎮</span>

          <div>
            <strong>Retro Arcade Games</strong>
            <p>Arcade moderno, alma retrô.</p>
          </div>
        </div>

        <nav className="main-nav">
          <button type="button" onClick={handleShowGames}>
            Jogos
          </button>

          <a href="#ranking">Ranking</a>

          {isAuthenticated ? (
            <Link to="/profile">Perfil</Link>
          ) : (
            <button type="button" onClick={handleProtectedAction}>
              Perfil
            </button>
          )}
        </nav>

        <div className="header-actions">
          {isAuthenticated && user ? (
            <>
              <Link className="user-pill" to="/profile">
                <span className="user-avatar">
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={`Avatar de ${user.username}`}
                    />
                  ) : (
                    user.avatarInitial
                  )}
                </span>

                <span>{userName}</span>
                <strong>Lv. {userLevel}</strong>
              </Link>

              <button className="btn btn-ghost" type="button" onClick={logout}>
                Sair
              </button>
            </>
          ) : isGuest ? (
            <>
              <button
                className="guest-pill"
                type="button"
                onClick={handleProtectedAction}
              >
                <span className="user-avatar">V</span>
                <span>Visitante</span>
              </button>

              <Link className="btn btn-primary" to="/login">
                Entrar
              </Link>
            </>
          ) : (
            <>
              <Link className="btn btn-ghost" to="/login">
                Entrar
              </Link>

              <Link className="btn btn-primary" to="/register">
                Criar conta
              </Link>
            </>
          )}
        </div>
      </header>

      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-badge">
            <span>✨ Novo projeto</span>
            <strong>Plataforma Arcade</strong>
          </div>

          <h1>
            Uma coleção de jogos retrô com visual moderno, progressão e desafios.
          </h1>

          <p>
            Jogue, acumule pontos, suba de nível e desbloqueie novos games
            dentro da sua própria central arcade.
          </p>

          <div className="hero-actions">
            <button
              className="btn btn-primary"
              type="button"
              onClick={handleShowGames}
            >
              Ver jogos
            </button>

            <button
              className="btn btn-secondary"
              type="button"
              onClick={handleShowAccount}
            >
              Minha conta
            </button>
          </div>
        </div>

        <aside className="hero-card glass-panel">
          <div className="hero-card-glow" />

          <div className="hero-card-content">
            <div className="featured-game-swap" key={featuredGame.id}>
              <div className="featured-card-header">
                <span className="arcade-label">
                  {featuredGame.highlightLabel}
                </span>

                <button
                  className="featured-card-change-button"
                  type="button"
                  onClick={handleNextFeaturedGame}
                >
                  Trocar
                </button>
              </div>

              <div className="featured-game-icon">{featuredGame.emoji}</div>

              <h2>{featuredGame.title}</h2>

              <p>{featuredGame.description}</p>

              <div className="featured-game-status">
                <span>
                  {featuredGame.status === "available"
                    ? "Disponível"
                    : featuredGame.tag}
                </span>

                <strong>Nível {featuredGame.requiredLevel}</strong>
              </div>

              <div className="stats-row">
                <div>
                  <strong>{featuredGame.bonusLabel}</strong>
                  <span>Pontos bônus</span>
                </div>

                <div>
                  <strong>{featuredGame.powerUps}</strong>
                  <span>Power-ups</span>
                </div>

                <div>
                  <strong>{featuredGame.replayValue}</strong>
                  <span>Replay</span>
                </div>
              </div>

              {featuredGame.id === 1 ? (
                renderFeaturedGameAction()
              ) : (
                <button
                  className="btn btn-primary full-width"
                  type="button"
                  disabled
                >
                  {featuredGame.status === "coming-soon"
                    ? "Em breve"
                    : "Bloqueado"}
                </button>
              )}
            </div>
          </div>
        </aside>
      </section>

      <section
        ref={contentSectionRef}
        className="section-header home-switch-header"
        id="games"
      >
        <div>
          <span className="section-kicker">
            {activeContentView === "games" ? "Biblioteca" : "Minha conta"}
          </span>

          <h2>
            {activeContentView === "games"
              ? "Escolha seu próximo jogo"
              : "Resumo da sua conta"}
          </h2>
        </div>

        <p>
          {activeContentView === "games"
            ? "Alguns jogos estarão bloqueados por nível. Quando o backend entrar, isso vai vir da conta real do usuário."
            : "Veja rapidamente seus dados principais sem sair da página inicial."}
        </p>
      </section>

      {activeContentView === "games" && (
        <section className="games-grid home-view-enter">
          {games.map((game) => {
            const isLockedByLevel = getEffectiveLevel() < game.requiredLevel;
            const isComingSoon = game.status === "coming-soon";
            const canPlay = game.status === "available" && !isLockedByLevel;

            return (
              <article
                className={`game-card glass-panel ${
                  canPlay ? "game-card-active" : "game-card-locked"
                }`}
                key={game.id}
              >
                <div className="game-card-top">
                  <span className="game-icon">{game.emoji}</span>

                  <span
                    className={`game-tag ${
                      canPlay ? "tag-open" : "tag-locked"
                    }`}
                  >
                    {canPlay ? "Liberado" : game.tag}
                  </span>
                </div>

                <h3>{game.title}</h3>

                <p>{game.description}</p>

                <div className="game-card-footer">
                  <span>Nível mínimo: {game.requiredLevel}</span>

                  {canPlay && game.id === 1 ? (
                    <Link className="btn btn-small" to="/games/snake">
                      Jogar
                    </Link>
                  ) : (
                    <button
                      className="btn btn-small"
                      type="button"
                      disabled={isComingSoon}
                      onClick={handleProtectedAction}
                    >
                      {isComingSoon ? "Em breve" : "Bloqueado"}
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </section>
      )}

      {activeContentView === "account" && user && (
        <section className="home-account-summary glass-panel home-view-enter">
          <div className="home-account-main">
            <div className="home-account-avatar">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={`Avatar de ${user.username}`} />
              ) : (
                <span>{user.avatarInitial}</span>
              )}
            </div>

            <div>
              <span className="section-kicker">Player Summary</span>
              <h3>{user.username}</h3>
              <p>{user.email}</p>
            </div>
          </div>

          <div className="home-account-stats">
            <div>
              <strong>{user.points}</strong>
              <span>Pontos</span>
            </div>

            <div>
              <strong>{user.level}</strong>
              <span>Nível</span>
            </div>

            <div>
              <strong>{user.gamesUnlocked}</strong>
              <span>Jogos liberados</span>
            </div>
          </div>

          <div className="home-account-actions">
            <button
              className="btn btn-secondary"
              type="button"
              onClick={handleShowGames}
            >
              Voltar para jogos
            </button>

            <Link className="btn btn-primary" to="/profile">
              Abrir dashboard completo
            </Link>
          </div>
        </section>
      )}

      <section className="profile-preview glass-panel" id="profile">
        <div>
          <span className="section-kicker">Perfil</span>

          <h2>
            {isAuthenticated
              ? `Bem-vindo, ${userName}`
              : "Entre para salvar sua evolução"}
          </h2>

          <p>
            Seu perfil vai guardar pontos, nível, jogos recentes, conquistas e
            desbloqueios.
          </p>
        </div>

        <div className="profile-stats">
          <div>
            <strong>{userPoints}</strong>
            <span>Pontos</span>
          </div>

          <div>
            <strong>{userLevel}</strong>
            <span>Nível</span>
          </div>

          <div>
            <strong>{isAuthenticated ? user?.gamesUnlocked : 0}</strong>
            <span>Jogos liberados</span>
          </div>
        </div>
      </section>

      {!isAuthenticated && showAuthWarning && (
        <div className="auth-modal-backdrop">
          <div className="auth-modal glass-panel">
            <button
              className="modal-close"
              type="button"
              onClick={() => setShowAuthWarning(false)}
              aria-label="Fechar aviso"
            >
              ×
            </button>

            <span className="modal-icon">🔐</span>

            <h2>Você precisa entrar na sua conta</h2>

            <p>
              Para acessar Perfil, Minha Conta, salvar pontos, subir de nível e
              desbloquear jogos, você precisa entrar ou criar um cadastro.
            </p>

            <div className="modal-actions">
              <Link className="btn btn-primary" to="/login">
                Entrar
              </Link>

              <Link className="btn btn-secondary" to="/register">
                Criar conta
              </Link>

              {!isGuest && (
                <button
                  className="btn btn-ghost"
                  type="button"
                  onClick={handleGuestMode}
                >
                  Continuar como visitante
                </button>
              )}
            </div>

            <small>
              Como visitante, você pode explorar a Home e jogar, mas precisa
              entrar ou criar conta para salvar progresso e acessar Perfil.
            </small>
          </div>
        </div>
      )}
    </main>
  );
}

export default Home;