import { Link, useNavigate } from "react-router";
import { useAuth } from "../../contexts/AuthContext";
import "./profile-style.css";

function ProfilePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    // Logout fake: remove o usuário atual do navegador.
    logout();
    navigate("/");
  }

  if (!user) {
    return null;
  }

  return (
    <main className="profile-page">
      <div className="background-orb orb-one" />
      <div className="background-orb orb-two" />
      <div className="background-grid" />

      <section className="profile-card glass-panel">
        <Link to="/" className="profile-back-link">
          ← Voltar para Home
        </Link>

        <div className="profile-header">
          <div className="profile-avatar">
            <span>{user.avatarInitial}</span>
          </div>

          <div>
            <span className="section-kicker">Player Profile</span>
            <h1>{user.username}</h1>
            <p>{user.email}</p>
          </div>
        </div>

        <div className="profile-data-grid">
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

        <div className="profile-section">
          <h2>Jogos recentes</h2>

          {user.recentGames.length > 0 ? (
            <ul>
              {user.recentGames.map((game) => (
                <li key={game}>{game}</li>
              ))}
            </ul>
          ) : (
            <p>
              Você ainda não jogou nenhuma partida nessa conta. O Snake Arcade
              será o primeiro grande teste.
            </p>
          )}
        </div>

        <button className="btn btn-secondary" type="button" onClick={handleLogout}>
          Sair da conta
        </button>
      </section>
    </main>
  );
}

export default ProfilePage;