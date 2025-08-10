import { createContext, useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { io } from "socket.io-client";

const backendUrl = import.meta.env.VITE_BACKEND_URL;

// Create axios instance with default config
const axiosInstance = axios.create({
  baseURL: backendUrl,
});

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem("token") || null);
  const [authUser, setAuthUser] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [socket, setSocket] = useState(null);
  const [loading, setLoading] = useState(true);

  // Add axios request interceptor
  useEffect(() => {
    const requestInterceptor = axiosInstance.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem("token");
        if (token) {
          config.headers.token = token;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    return () => {
      axiosInstance.interceptors.request.eject(requestInterceptor);
    };
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setLoading(false);
        return;
      }

      const { data } = await axiosInstance.get("/api/auth/check-auth");
      if (data.success) {
      if (data.success) {
  setAuthUser(data.user);
  connectSocket(data.user);
}
      } else {
        handleLogout();
      }
    } catch (error) {
      console.error("Auth check failed:", error);
      handleLogout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (state, credentials) => {
    try {
      const { data } = await axiosInstance.post(`/api/auth/${state}`, credentials);
      if (data.success) {
        setAuthUser(data.userData);
        setToken(data.token);
        localStorage.setItem("token", data.token);
        connectSocket(data.userData);
        toast.success(data.message);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setAuthUser(null);
    setOnlineUsers([]);
    if (socket) {
      socket.disconnect();
      setSocket(null);
    }
    toast.success("Logged out successfully");
  };

  const connectSocket = (userData) => {
    if (!userData?._id || socket?.connected) return;

    const newSocket = io(backendUrl, {
      query: { userId: userData._id },
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    newSocket.on("connect", () => {
      console.log("Socket connected");
    });

    newSocket.on("onlineUsers", (userIds) => {
      setOnlineUsers(userIds);
    });

    newSocket.on("disconnect", () => {
      console.log("Socket disconnected");
    });

    setSocket(newSocket);
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const value = {
    axios: axiosInstance,
    token,
    setToken,
    authUser,
    setAuthUser,
    onlineUsers,
    setOnlineUsers,
    socket,
    login,
    logout: handleLogout,
    updateProfile: async (body) => {
      try {
        const { data } = await axiosInstance.put("/api/auth/update-profile", body);
        if (data.success) {
          setAuthUser(data.user);
          toast.success(data.message);
          return true;
        }
        toast.error(data.message);
        return false;
      } catch (error) {
        toast.error(error.response?.data?.message || error.message);
        return false;
      }
    },
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};