import { createContext, useState, useEffect } from "react";
import { api } from "../library/api";

export const AuthContext = createContext(null);

export default function AuthContextProvider({ children }){
  const [ user, setUser ] = useState(null);
  const [ status, setStatus ] = useState("loading");

  useEffect(() => {
    api.get("/api/me")
      .then(res => { 
        setUser(res.data.user);
        setStatus("authenticated");
      })
      .catch(() => {
        setUser(null);
        setStatus("anonymous");
      })
  }, []);

  async function login(email, password) {
    const res = await api.post("/api/auth/login", { email, password });
    setUser(res.data.user);
    setStatus("authenticated");
    return res.data.user;
  }

  async function register(email, password) {
    const res = await api.post("/api/auth/register", { email, password });
    setUser(res.data.user);
    setStatus("authenticated");
    return res.data.user;
  }

  async function logout() {
    try {
      await api.post("/api/auth/logout");
    }
    finally {
      setUser(null);
      setStatus("anonymous");
    }
  }

  const value = { user, status, login, register, logout };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
