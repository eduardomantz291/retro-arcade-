import { Navigate, Route, Routes } from "react-router";
import RequireAuth from "./components/RequireAuth";
import Home from "./Home";
import LoginPage from "./pages/Auth/LoginPage";
import RegisterPage from "./pages/Auth/RegisterPage";
import ProfilePage from "./pages/Profile/ProfilePage";
import SnakeGamePage from "./games/snake/SnakeGamePage";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />

      <Route path="/login" element={<LoginPage />} />

      <Route path="/register" element={<RegisterPage />} />

      <Route
        path="/profile"
        element={
          <RequireAuth>
            <ProfilePage />
          </RequireAuth>
        }
      />

      <Route path="/games/snake" element={<SnakeGamePage />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;