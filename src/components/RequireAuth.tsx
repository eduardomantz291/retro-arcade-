import { Link } from "react-router";
import { useAuth } from "../contexts/AuthContext";

type RequireAuthProps = {
  children: React.ReactNode;
};

function RequireAuth({ children }: RequireAuthProps) {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return children;
  }

  return (
    <main className="auth-page">
      <div className="auth-background-grid" />
      <div className="auth-orb auth-orb-blue" />
      <div className="auth-orb auth-orb-green" />

      <section className="auth-card glass-panel">
        <div className="auth-header">
          <span className="auth-icon">🔐</span>

          <span className="auth-kicker">Access denied</span>

          <h1>Acesso restrito</h1>

          <p>
            Para acessar a página de perfil, você precisa entrar na sua conta ou
            criar um cadastro.
          </p>
        </div>

        <div className="modal-actions">
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
      </section>
    </main>
  );
}

export default RequireAuth;