import { Link } from "react-router";
import { useAuth } from "../../contexts/AuthContext";
import "./ranking-style.css";

type RankingPlayer = {
  id: number;
  username: string;
  avatarInitial: string;
  level: number;
  totalPoints: number;
  gamesPlayed: number;
  favoriteGame: string;
  badge: string;
};

const mockRankingPlayers: RankingPlayer[] = [
  {
    id: 1,
    username: "PixelMaster",
    avatarInitial: "P",
    level: 18,
    totalPoints: 12450,
    gamesPlayed: 142,
    favoriteGame: "Snake Arcade",
    badge: "Lenda Arcade",
  },
  {
    id: 2,
    username: "GhostRunner",
    avatarInitial: "G",
    level: 15,
    totalPoints: 10880,
    gamesPlayed: 118,
    favoriteGame: "Ghost Maze",
    badge: "Caçador de Fantasmas",
  },
  {
    id: 3,
    username: "SnakeBoss",
    avatarInitial: "S",
    level: 13,
    totalPoints: 9340,
    gamesPlayed: 96,
    favoriteGame: "Snake Arcade",
    badge: "Mestre da Cobrinha",
  },
  {
    id: 4,
    username: "RetroNinja",
    avatarInitial: "R",
    level: 11,
    totalPoints: 7810,
    gamesPlayed: 84,
    favoriteGame: "Number Merge",
    badge: "Combo Expert",
  },
  {
    id: 5,
    username: "StarShooter",
    avatarInitial: "S",
    level: 9,
    totalPoints: 6420,
    gamesPlayed: 71,
    favoriteGame: "Space Shooter",
    badge: "Piloto Estelar",
  },
  {
    id: 6,
    username: "ArcadeKid",
    avatarInitial: "A",
    level: 7,
    totalPoints: 4280,
    gamesPlayed: 49,
    favoriteGame: "Snake Arcade",
    badge: "Promessa Retro",
  },
];

function RankingPage() {
  const { user, isAuthenticated } = useAuth();

  const rankingPlayers = [...mockRankingPlayers].sort((firstPlayer, secondPlayer) => {
    if (secondPlayer.totalPoints !== firstPlayer.totalPoints) {
      return secondPlayer.totalPoints - firstPlayer.totalPoints;
    }

    return secondPlayer.level - firstPlayer.level;
  });

  const podiumPlayers = rankingPlayers.slice(0, 3);
  const tablePlayers = rankingPlayers.slice(3);

  return (
    <main className="ranking-page">
      <div className="ranking-background-grid" />
      <div className="ranking-background-orb ranking-orb-one" />
      <div className="ranking-background-orb ranking-orb-two" />

      <header className="ranking-header glass-panel">
        <Link to="/" className="ranking-back-link">
          ← Voltar para Home
        </Link>

        <div className="ranking-title-area">
          <span className="ranking-kicker">Ranking Global</span>

          <h1>Os maiores jogadores do arcade</h1>

          <p>
            Veja quem está no topo por pontos, nível e partidas jogadas. Por
            enquanto, esses dados são fictícios, mas depois eles vão vir direto
            da API.
          </p>
        </div>
      </header>

      <section className="ranking-stats-row">
        <div className="ranking-stat-card glass-panel">
          <strong>{rankingPlayers.length}</strong>
          <span>Jogadores ranqueados</span>
        </div>

        <div className="ranking-stat-card glass-panel">
          <strong>{rankingPlayers[0].totalPoints}</strong>
          <span>Maior pontuação</span>
        </div>

        <div className="ranking-stat-card glass-panel">
          <strong>{rankingPlayers[0].level}</strong>
          <span>Maior nível</span>
        </div>
      </section>

      {isAuthenticated && user && (
        <section className="ranking-current-user glass-panel">
          <div className="ranking-current-user-avatar">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt={`Avatar de ${user.username}`} />
            ) : (
              <span>{user.avatarInitial}</span>
            )}
          </div>

          <div>
            <span className="ranking-kicker">Sua posição</span>
            <h2>{user.username}</h2>
            <p>
              Você ainda não está no ranking global mockado, mas seus dados já
              aparecem aqui: nível {user.level} com {user.points} pontos.
            </p>
          </div>

          <Link className="btn btn-primary" to="/profile">
            Ver meu perfil
          </Link>
        </section>
      )}

      <section className="ranking-podium">
        {podiumPlayers.map((player, index) => {
          const position = index + 1;

          return (
            <article
              className={`ranking-podium-card ranking-position-${position} glass-panel`}
              key={player.id}
            >
              <span className="ranking-medal">
                {position === 1 ? "🥇" : position === 2 ? "🥈" : "🥉"}
              </span>

              <div className="ranking-avatar">
                <span>{player.avatarInitial}</span>
              </div>

              <h2>{player.username}</h2>

              <p>{player.badge}</p>

              <div className="ranking-podium-data">
                <div>
                  <strong>{player.totalPoints}</strong>
                  <span>Pontos</span>
                </div>

                <div>
                  <strong>{player.level}</strong>
                  <span>Nível</span>
                </div>
              </div>
            </article>
          );
        })}
      </section>

      <section className="ranking-table-card glass-panel">
        <div className="ranking-table-header">
          <div>
            <span className="ranking-kicker">Leaderboard</span>
            <h2>Classificação geral</h2>
          </div>

          <span className="ranking-table-note">Ordenado por pontos</span>
        </div>

        <div className="ranking-table">
          {tablePlayers.map((player, index) => {
            const position = index + 4;

            return (
              <article className="ranking-row" key={player.id}>
                <span className="ranking-row-position">#{position}</span>

                <div className="ranking-row-user">
                  <div className="ranking-row-avatar">
                    <span>{player.avatarInitial}</span>
                  </div>

                  <div>
                    <strong>{player.username}</strong>
                    <small>{player.badge}</small>
                  </div>
                </div>

                <div className="ranking-row-info">
                  <span>{player.favoriteGame}</span>
                  <strong>{player.gamesPlayed} partidas</strong>
                </div>

                <div className="ranking-row-score">
                  <strong>{player.totalPoints}</strong>
                  <span>Lv. {player.level}</span>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}

export default RankingPage;