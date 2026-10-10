import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('vellanki_token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem('vellanki_token');
      if (savedToken) {
        try {
          const res = await authAPI.getProfile();
          if (res.success && res.user) {
            setUser(res.user);
          } else {
            logout();
          }
        } catch (err) {
          console.warn('Auth token expired or invalid', err);
          logout();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (identifier, password) => {
    const res = await authAPI.login({ identifier, password });
    if (res.success && res.token) {
      localStorage.setItem('vellanki_token', res.token);
      setToken(res.token);
      setUser(res.user);
      return res;
    }
    throw new Error(res.message || 'Login failed');
  };

  const adminLogin = async (email, password) => {
    const res = await authAPI.adminLogin({ email, password });
    if (res.success && res.token) {
      localStorage.setItem('vellanki_token', res.token);
      setToken(res.token);
      setUser(res.user);
      return res;
    }
    throw new Error(res.message || 'Admin authentication failed');
  };

  const register = async (userData) => {
    const res = await authAPI.register(userData);
    if (res.success && res.token) {
      localStorage.setItem('vellanki_token', res.token);
      setToken(res.token);
      setUser(res.user);
      return res;
    }
    throw new Error(res.message || 'Registration failed');
  };

  const sendOtp = async (identifier, channel = 'email', purpose = 'login') => {
    return await authAPI.sendOtp({ identifier, channel: 'email', purpose });
  };

  const loginWithOtp = async (identifier, otp, name, purpose = 'login') => {
    const res = await authAPI.verifyOtp({ identifier, otp, name, purpose });
    if (res.success && res.token) {
      localStorage.setItem('vellanki_token', res.token);
      setToken(res.token);
      setUser(res.user);
      return res;
    }
    throw new Error(res.message || 'OTP verification failed');
  };

  const forgotPasswordSendOtp = async (identifier) => {
    return await authAPI.forgotPasswordSendOtp({ identifier, channel: 'email' });
  };

  const forgotPasswordReset = async (identifier, otp, newPassword) => {
    return await authAPI.forgotPasswordReset({ identifier, otp, newPassword });
  };

  const verifyPhone = async (otp) => {
    const res = await authAPI.verifyPhone({ otp });
    if (res.success && res.user) {
      setUser(res.user);
    }
    return res;
  };

  const verifyEmail = async (otp) => {
    const res = await authAPI.verifyEmail({ otp });
    if (res.success && res.user) {
      setUser(res.user);
    }
    return res;
  };

  const changePhone = async (newPhone, otp) => {
    const res = await authAPI.changePhone({ newPhone, otp });
    if (res.success && res.user) {
      setUser(res.user);
    }
    return res;
  };

  const changeEmail = async (newEmail, otp) => {
    const res = await authAPI.changeEmail({ newEmail, otp });
    if (res.success && res.user) {
      setUser(res.user);
    }
    return res;
  };

  const logout = () => {
    localStorage.removeItem('vellanki_token');
    setToken(null);
    setUser(null);
  };

  const reloadProfile = async () => {
    try {
      const res = await authAPI.getProfile();
      if (res.success && res.user) {
        setUser(res.user);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const isAuthenticated = !!user;
  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      isAuthenticated,
      isAdmin,
      login,
      adminLogin,
      register,
      sendOtp,
      loginWithOtp,
      forgotPasswordSendOtp,
      forgotPasswordReset,
      verifyPhone,
      verifyEmail,
      changePhone,
      changeEmail,
      logout,
      reloadProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
