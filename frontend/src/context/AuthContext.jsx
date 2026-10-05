import { useCallback, useMemo, useState } from "react";
import { setAccessToken } from "../services/api";

import { AuthContext } from "./authContext";

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);

  const login = useCallback((response) => {
    setAccessToken(response.accessToken);
    setSession({
      token: response.accessToken,
      user: response.user,
    });
  }, []);

  const logout = useCallback(() => {
    setAccessToken(null);
    setSession(null);
  }, []);

  const value = useMemo(() => ({
    token: session?.token ?? null,
    user: session?.user ?? null,
    isAuthenticated: Boolean(session?.token),
    login,
    logout,
  }), [session, login, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
