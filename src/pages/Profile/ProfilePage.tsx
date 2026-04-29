import { useEffect, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "../../contexts/AuthContext";
import "./profile-style.css";

type ProfileTab = "dashboard" | "settings";

function ProfilePage() {
  const { user, updateProfile, changePassword, logout } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<ProfileTab>("dashboard");

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const [profileMessage, setProfileMessage] = useState("");
  const [profileError, setProfileError] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");

  useEffect(() => {
    if (!user) {
      return;
    }

    // Mantemos o formulário sincronizado com o usuário atual.
    setUsername(user.username);
    setEmail(user.email);
    setAvatarPreview(user.avatarUrl);
  }, [user]);

  if (!user) {
    return null;
  }

  const nextLevelTarget = Math.max(user.level * 500, 500);
  const currentLevelProgress = user.points % nextLevelTarget;
  const progressPercent = Math.min(
    (currentLevelProgress / nextLevelTarget) * 100,
    100
  );

  function handleLogout() {
    // Logout fake: remove o usuário atual do navegador.
    logout();
    navigate("/");
  }

  function clearProfileFeedback() {
    setProfileMessage("");
    setProfileError("");
  }

  function clearPasswordFeedback() {
    setPasswordMessage("");
    setPasswordError("");
  }

  function handleAvatarChange(event: ChangeEvent<HTMLInputElement>) {
    const selectedFile = event.target.files?.[0];

    clearProfileFeedback();

    if (!selectedFile) {
      return;
    }

    if (!selectedFile.type.startsWith("image/")) {
      setProfileError("Selecione um arquivo de imagem válido.");
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      setAvatarPreview(String(reader.result));
    };

    reader.readAsDataURL(selectedFile);
  }

  function handleRemoveAvatar() {
    clearProfileFeedback();
    setAvatarPreview(null);
  }

  function handleProfileSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearProfileFeedback();

    if (username.trim().length < 3) {
      setProfileError("O nickname precisa ter pelo menos 3 caracteres.");
      return;
    }

    if (!email.includes("@")) {
      setProfileError("Digite um e-mail válido.");
      return;
    }

    updateProfile({
      username: username.trim(),
      email: email.trim(),
      avatarUrl: avatarPreview,
    });

    setProfileMessage("Perfil atualizado com sucesso.");
  }

  function handlePasswordSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearPasswordFeedback();

    if (newPassword.length < 6) {
      setPasswordError("A nova senha precisa ter pelo menos 6 caracteres.");
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setPasswordError("A confirmação da nova senha não bate.");
      return;
    }

    const wasChanged = changePassword({
      currentPassword,
      newPassword,
    });

    if (!wasChanged) {
      setPasswordError("A senha atual está incorreta.");
      return;
    }

    setCurrentPassword("");
    setNewPassword("");
    setConfirmNewPassword("");
    setPasswordMessage("Senha alterada com sucesso.");
  }

  return (
    <main className="profile-page">
      <div className="profile-background-grid" />
      <div className="profile-background-orb profile-orb-one" />
      <div className="profile-background-orb profile-orb-two" />

      <section className="profile-layout">
        <aside className="profile-sidebar glass-panel">
          <Link to="/" className="profile-back-link">
            ← Voltar para Home
          </Link>

          <div className="profile-user-card">
            <div className="profile-avatar">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={`Avatar de ${user.username}`} />
              ) : (
                <span>{user.avatarInitial}</span>
              )}
            </div>

            <div>
              <span className="profile-kicker">Player Profile</span>
              <h1>{user.username}</h1>
              <p>{user.email}</p>
            </div>
          </div>

          <div className="profile-tabs">
            <button
              className={activeTab === "dashboard" ? "active" : ""}
              type="button"
              onClick={() => setActiveTab("dashboard")}
            >
              Dashboard
            </button>

            <button
              className={activeTab === "settings" ? "active" : ""}
              type="button"
              onClick={() => setActiveTab("settings")}
            >
              Configurações
            </button>
          </div>

          <button
            className="btn btn-secondary profile-logout-button"
            type="button"
            onClick={handleLogout}
          >
            Sair da conta
          </button>
        </aside>

        <section className="profile-content">
          {activeTab === "dashboard" && (
            <div className="profile-panel glass-panel">
              <div className="profile-section-heading">
                <span className="profile-kicker">Dashboard</span>
                <h2>Resumo da conta</h2>
                <p>
                  Aqui fica a visão geral da evolução do jogador dentro da
                  plataforma.
                </p>
              </div>

              <div className="profile-data-grid">
                <div>
                  <strong>{user.points}</strong>
                  <span>Pontos totais</span>
                </div>

                <div>
                  <strong>{user.level}</strong>
                  <span>Nível atual</span>
                </div>

                <div>
                  <strong>{user.gamesUnlocked}</strong>
                  <span>Jogos liberados</span>
                </div>
              </div>

              <div className="profile-progress-card">
                <div>
                  <h3>Progresso de nível</h3>
                  <p>
                    Continue jogando para acumular pontos e liberar novos jogos.
                  </p>
                </div>

                <div className="profile-progress-bar">
                  <span style={{ width: `${progressPercent}%` }} />
                </div>

                <small>
                  {currentLevelProgress} / {nextLevelTarget} pontos para o
                  próximo ciclo de evolução.
                </small>
              </div>

              <div className="profile-dashboard-grid">
                <div className="profile-section-card">
                  <h3>Jogos recentes</h3>

                  {user.recentGames.length > 0 ? (
                    <ul className="profile-list">
                      {user.recentGames.map((game) => (
                        <li key={game}>{game}</li>
                      ))}
                    </ul>
                  ) : (
                    <p>
                      Você ainda não jogou nenhuma partida nessa conta. O Snake
                      Arcade será o primeiro grande teste.
                    </p>
                  )}
                </div>

                <div className="profile-section-card">
                  <h3>Conquistas</h3>

                  <ul className="profile-list">
                    <li>🐍 Primeiro jogo liberado: Snake Arcade</li>
                    <li>🔒 Próximas conquistas serão liberadas em breve</li>
                    <li>🏆 Ranking global ainda será implementado</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {activeTab === "settings" && (
            <div className="profile-panel glass-panel">
              <div className="profile-section-heading">
                <span className="profile-kicker">Account Settings</span>
                <h2>Configurações da conta</h2>
                <p>
                  Edite seu nickname, e-mail, avatar e senha. Por enquanto, tudo
                  fica salvo apenas no navegador.
                </p>
              </div>

              <div className="profile-settings-grid">
                <form className="profile-form" onSubmit={handleProfileSubmit}>
                  <h3>Dados do perfil</h3>

                  {profileMessage && (
                    <div className="profile-success-message">
                      {profileMessage}
                    </div>
                  )}

                  {profileError && (
                    <div className="profile-error-message">{profileError}</div>
                  )}

                  <div className="profile-avatar-settings">
                    <div className="profile-avatar profile-avatar-preview">
                      {avatarPreview ? (
                        <img
                          src={avatarPreview}
                          alt={`Avatar de ${username}`}
                        />
                      ) : (
                        <span>{username.trim().charAt(0).toUpperCase() || "P"}</span>
                      )}
                    </div>

                    <div>
                      <label className="profile-file-button">
                        Trocar foto
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarChange}
                        />
                      </label>

                      <button
                        className="profile-text-button"
                        type="button"
                        onClick={handleRemoveAvatar}
                      >
                        Remover foto
                      </button>
                    </div>
                  </div>

                  <label className="profile-field">
                    <span>Nickname</span>

                    <input
                      type="text"
                      value={username}
                      onChange={(event) => setUsername(event.target.value)}
                      placeholder="Seu nickname"
                      required
                    />
                  </label>

                  <label className="profile-field">
                    <span>E-mail</span>

                    <input
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="seuemail@email.com"
                      required
                    />
                  </label>

                  <button className="btn btn-primary" type="submit">
                    Salvar perfil
                  </button>
                </form>

                <form className="profile-form" onSubmit={handlePasswordSubmit}>
                  <h3>Alterar senha</h3>

                  {passwordMessage && (
                    <div className="profile-success-message">
                      {passwordMessage}
                    </div>
                  )}

                  {passwordError && (
                    <div className="profile-error-message">
                      {passwordError}
                    </div>
                  )}

                  <label className="profile-field">
                    <span>Senha atual</span>

                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(event) =>
                        setCurrentPassword(event.target.value)
                      }
                      placeholder="Digite sua senha atual"
                      required
                    />
                  </label>

                  <label className="profile-field">
                    <span>Nova senha</span>

                    <input
                      type="password"
                      value={newPassword}
                      onChange={(event) => setNewPassword(event.target.value)}
                      placeholder="Crie uma nova senha"
                      required
                    />
                  </label>

                  <label className="profile-field">
                    <span>Confirmar nova senha</span>

                    <input
                      type="password"
                      value={confirmNewPassword}
                      onChange={(event) =>
                        setConfirmNewPassword(event.target.value)
                      }
                      placeholder="Repita a nova senha"
                      required
                    />
                  </label>

                  <button className="btn btn-primary" type="submit">
                    Alterar senha
                  </button>

                  <small>
                    Dica para o usuário fake padrão: a senha inicial é 123456.
                  </small>
                </form>
              </div>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}

export default ProfilePage;