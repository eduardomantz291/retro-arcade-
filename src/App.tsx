import { Navigate, Route, Routes } from "react-router";
import RequireAuth from "./components/RequireAuth";
import Home from "./Home";
import LoginPage from "./pages/Auth/LoginPage";
import RegisterPage from "./pages/Auth/RegisterPage";
import ProfilePage from "./pages/Profile/ProfilePage";
import SnakeGamePage from "./games/snake/SnakeGamePage";
import RankingPage from "./pages/Ranking/RankingPage"

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/profile" element={<ProfilePage />} />
      <Route path="/ranking" element={<RankingPage />} />
    </Routes>
  );
}

export default App;