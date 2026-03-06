import { useState } from "react";
import { AuthContext } from "./AuthContext";
import api from "../services/api";

// Função helper para verificar autenticação inicial
const getInitialAuth = () => {
  const token = localStorage.getItem("authToken");
  const savedUser = localStorage.getItem("user");

  if (token && savedUser) {
    return {
      isAuthenticated: true,
      user: JSON.parse(savedUser),
    };
  }

  return {
    isAuthenticated: false,
    user: null,
  };
};

export default function AuthProvider({ children }) {
  const initialAuth = getInitialAuth();
  const [isAuthenticated, setIsAuthenticated] = useState(
    initialAuth.isAuthenticated,
  );
  const [user, setUser] = useState(initialAuth.user);

  const login = async (email, password) => {
    try {
      const { data } = await api.post("/api/auth/login", {
        email,
        password,
      });

      // Espera-se que a API retorne: { token: "...", user: { id: 1, name: "...", username: "..." } }
      localStorage.setItem("authToken", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      setIsAuthenticated(true);
      setUser(data.user);

      return { success: true };
    } catch (error) {
      const errorMessage =
        error.response?.status === 401
          ? "Usuário ou senha incorretos"
          : error.message || "Erro ao fazer login";
      return { success: false, error: errorMessage };
    }
  };

  const logout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    setIsAuthenticated(false);
    setUser(null);
  };

  const value = {
    isAuthenticated,
    user,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
