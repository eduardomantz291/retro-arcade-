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
  avatarUrl: string | null;
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

type UpdateProfileData = {
  username: string;
  email: string;
  avatarUrl: string | null;
};

type ChangePasswordData = {
  currentPassword: string;
  newPassword: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isGuest: boolean;
  login: (email: string, password: string) => boolean;
  register: (data: RegisterData) => AuthUser;
  updateProfile: (data: UpdateProfileData) => AuthUser | null;
  changePassword: (data: ChangePasswordData) => boolean;
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
  avatarUrl: null,
  recentGames: ["Snake Arcade"],
};

const AuthContext = createContext<AuthContextValue | null>(null);

function getAvatarInitial(username: string) {
  return username.trim().charAt(0).toUpperCase() || "P";
}

function parseStorageItem<T>(key: string): T | null {
  const storedValue = localStorage.getItem(key);

  if (!storedValue) {
    return null;
  }

  try {
    return JSON.parse(storedValue) as T;
  } catch {
    localStorage.removeItem(key);
    return null;
  }
}

function getStoredCurrentUser(): AuthUser | null {
  return parseStorageItem<AuthUser>(CURRENT_USER_KEY);
}

function getStoredAccount(): SavedFakeAccount {
  const storedAccount = parseStorageItem<SavedFakeAccount>(SAVED_ACCOUNT_KEY);

  if (!storedAccount) {
    return defaultFakeAccount;
  }

  return {
    ...defaultFakeAccount,
    ...storedAccount,
    avatarUrl: storedAccount.avatarUrl ?? null,
  };
}

function getStoredGuestMode() {
  return localStorage.getItem(GUEST_MODE_KEY) === "true";
}

function saveCurrentUser(user: AuthUser) {
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
}

function saveAccount(account: SavedFakeAccount) {
  localStorage.setItem(SAVED_ACCOUNT_KEY, JSON.stringify(account));
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

function removePasswordFromAccount(account: SavedFakeAccount): AuthUser {
  return {
    id: account.id,
    username: account.username,
    email: account.email,
    level: account.level,
    points: account.points,
    gamesUnlocked: account.gamesUnlocked,
    avatarInitial: account.avatarInitial,
    avatarUrl: account.avatarUrl,
    recentGames: account.recentGames,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isGuest, setIsGuest] = useState(false);

  useEffect(() => {
    // Ao abrir o site, tentamos recuperar um usuário real salvo no navegador.
    const storedUser = getStoredCurrentUser();

    if (storedUser) {
      setUser({
        ...storedUser,
        avatarUrl: storedUser.avatarUrl ?? null,
      });

      setIsGuest(false);
      return;
    }

    // Se não tiver usuário real, verificamos se o modo visitante estava ativo.
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

    const loggedUser = removePasswordFromAccount(savedAccount);

    setUser(loggedUser);
    setIsGuest(false);

    saveCurrentUser(loggedUser);
    removeGuestMode();

    return true;
  }

  function register(data: RegisterData) {
    const newAccount: SavedFakeAccount = {
      id: crypto.randomUUID(),
      username: data.username,
      email: data.email,
      password: data.password,
      level: 1,
      points: 0,
      gamesUnlocked: 1,
      avatarInitial: getAvatarInitial(data.username),
      avatarUrl: null,
      recentGames: [],
    };

    // Cadastro fake: salvamos apenas no navegador por enquanto.
    saveAccount(newAccount);

    const newUser = removePasswordFromAccount(newAccount);

    setIsGuest(false);
    removeGuestMode();

    return newUser;
  }

  function updateProfile(data: UpdateProfileData) {
    if (!user) {
      return null;
    }

    const savedAccount = getStoredAccount();

    const updatedUser: AuthUser = {
      ...user,
      username: data.username,
      email: data.email,
      avatarInitial: getAvatarInitial(data.username),
      avatarUrl: data.avatarUrl,
    };

    const updatedAccount: SavedFakeAccount = {
      ...savedAccount,
      username: updatedUser.username,
      email: updatedUser.email,
      avatarInitial: updatedUser.avatarInitial,
      avatarUrl: updatedUser.avatarUrl,
    };

    setUser(updatedUser);
    saveCurrentUser(updatedUser);
    saveAccount(updatedAccount);

    return updatedUser;
  }

  function changePassword(data: ChangePasswordData) {
    const savedAccount = getStoredAccount();

    if (savedAccount.password !== data.currentPassword) {
      return false;
    }

    const updatedAccount: SavedFakeAccount = {
      ...savedAccount,
      password: data.newPassword,
    };

    saveAccount(updatedAccount);

    return true;
  }

  function logout() {
    // Logout remove usuário real e também remove modo visitante.
    setUser(null);
    setIsGuest(false);

    removeCurrentUser();
    removeGuestMode();
  }

  function continueAsGuest() {
    // Visitante pode explorar a Home e jogar, mas não acessa áreas protegidas.
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
        updateProfile,
        changePassword,
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