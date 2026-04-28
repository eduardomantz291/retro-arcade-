import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";

export type AuthUser = {
  id: string;
  username: string;
  email: string;
  level: number;
  points: number;
  gamesUnlocked: number;
  avatarInitial: string;
  recentGames: string[];
};

type SavedFakeAccount = AuthUser & {
  password: string;
};

type RegisterData = {
  username: string;
  email: string;
  password: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isGuest: boolean;
  login: (email: string, password: string) => boolean;
  register: (data: RegisterData) => AuthUser;
  logout: () => void;
  continueAsGuest: () => void;
};

const CURRENT_USER_KEY = "retroArcadeCurrentUser";
const SAVED_ACCOUNT_KEY = "retroArcadeSavedAccount";
const GUEST_MODE_KEY = "retroArcadeGuestMode";

const defaultFakeAccount: SavedFakeAccount = {
  id: "fake-user-001",
  username: "Arcade Player",
  email: "player@retroarcade.com",
  password: "123456",
  level: 1,
  points: 0,
  gamesUnlocked: 1,
  avatarInitial: "A",
  recentGames: ["Snake Arcade"],
};

const AuthContext = createContext<AuthContextValue | null>(null);

function getStoredCurrentUser(): AuthUser | null {
  const storedUser = localStorage.getItem(CURRENT_USER_KEY);

  if (!storedUser) {
    return null;
  }

  return JSON.parse(storedUser) as AuthUser;
}

function getStoredAccount(): SavedFakeAccount {
  const storedAccount = localStorage.getItem(SAVED_ACCOUNT_KEY);

  if (!storedAccount) {
    return defaultFakeAccount;
  }

  return JSON.parse(storedAccount) as SavedFakeAccount;
}

function getStoredGuestMode() {
  return localStorage.getItem(GUEST_MODE_KEY) === "true";
}

function saveCurrentUser(user: AuthUser) {
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
}

function removeCurrentUser() {
  localStorage.removeItem(CURRENT_USER_KEY);
}

function saveGuestMode() {
  localStorage.setItem(GUEST_MODE_KEY, "true");
}

function removeGuestMode() {
  localStorage.removeItem(GUEST_MODE_KEY);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isGuest, setIsGuest] = useState(false);

  useEffect(() => {
    // Ao abrir o site, verificamos se existe usuário real salvo.
    const storedUser = getStoredCurrentUser();

    if (storedUser) {
      setUser(storedUser);
      setIsGuest(false);
      return;
    }

    // Se não tiver usuário real, verificamos se ele escolheu modo visitante.
    setIsGuest(getStoredGuestMode());
  }, []);

  function login(email: string, password: string) {
    const savedAccount = getStoredAccount();

    const isEmailCorrect =
      savedAccount.email.toLowerCase() === email.toLowerCase();

    const isPasswordCorrect = savedAccount.password === password;

    if (!isEmailCorrect || !isPasswordCorrect) {
      return false;
    }

    const loggedUser: AuthUser = {
      id: savedAccount.id,
      username: savedAccount.username,
      email: savedAccount.email,
      level: savedAccount.level,
      points: savedAccount.points,
      gamesUnlocked: savedAccount.gamesUnlocked,
      avatarInitial: savedAccount.avatarInitial,
      recentGames: savedAccount.recentGames,
    };

    // Login real fake: agora o usuário deixa de ser visitante.
    setUser(loggedUser);
    setIsGuest(false);

    saveCurrentUser(loggedUser);
    removeGuestMode();

    return true;
  }

  function register(data: RegisterData) {
    const avatarInitial = data.username.trim().charAt(0).toUpperCase() || "P";

    const newAccount: SavedFakeAccount = {
      id: crypto.randomUUID(),
      username: data.username,
      email: data.email,
      password: data.password,
      level: 1,
      points: 0,
      gamesUnlocked: 1,
      avatarInitial,
      recentGames: [],
    };

    // Cadastro fake: salvamos apenas no navegador por enquanto.
    localStorage.setItem(SAVED_ACCOUNT_KEY, JSON.stringify(newAccount));

    const newUser: AuthUser = {
      id: newAccount.id,
      username: newAccount.username,
      email: newAccount.email,
      level: newAccount.level,
      points: newAccount.points,
      gamesUnlocked: newAccount.gamesUnlocked,
      avatarInitial: newAccount.avatarInitial,
      recentGames: newAccount.recentGames,
    };

    // Ao cadastrar, removemos o modo visitante.
    setIsGuest(false);
    removeGuestMode();

    return newUser;
  }

  function logout() {
    // Logout remove usuário real e também remove modo visitante.
    setUser(null);
    setIsGuest(false);

    removeCurrentUser();
    removeGuestMode();
  }

  function continueAsGuest() {
    // Visitante pode navegar pela Home, mas não acessa áreas protegidas.
    setUser(null);
    setIsGuest(true);

    removeCurrentUser();
    saveGuestMode();
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: user !== null,
        isGuest,
        login,
        register,
        logout,
        continueAsGuest,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}