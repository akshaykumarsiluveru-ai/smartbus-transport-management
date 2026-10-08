import React, { createContext, useContext, useState, useEffect } from 'react';
import { login as apiLogin, register as apiRegister, getMe as apiGetMe } from '../services/authApi';
import { getToken, setToken, removeToken } from '../services/tokenStorage';
import { ApiError } from '../services/api';
import { disconnectSocket } from '../services/socket';

const AuthContext = createContext();

/**
 * Normalizes user object fields to support both camelCase and snake_case for frontend UI compatibility
 */
const normalizeUser = (user) => {
  if (!user) return null;
  return {
    ...user,
    studentId: user.studentId || user.student_id || null,
    digitalPassId: user.digitalPassId || user.digital_pass_id || null,
  };
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [authView, setAuthView] = useState('login'); // 'login' | 'register'
  const [authSuccessMessage, setAuthSuccessMessage] = useState('');
  const [prefilledEmail, setPrefilledEmail] = useState('');

  // Restore session on application startup via GET /api/auth/me
  useEffect(() => {
    const restoreSession = async () => {
      const token = getToken();
      if (!token) {
        setCurrentUser(null);
        setIsInitializing(false);
        return;
      }

      try {
        const response = await apiGetMe();
        if (response && response.success && response.user) {
          setCurrentUser(normalizeUser(response.user));
        } else {
          removeToken();
          setCurrentUser(null);
        }
      } catch (error) {
        // Token invalid or expired
        removeToken();
        setCurrentUser(null);
      } finally {
        setIsInitializing(false);
      }
    };

    restoreSession();
  }, []);

  /**
   * Log in using backend authentication API (POST /api/auth/login)
   */
  const login = async (email, password) => {
    setIsLoading(true);
    setAuthSuccessMessage('');
    try {
      const response = await apiLogin(email, password);

      if (response && response.success && response.token) {
        setToken(response.token);
        const normalizedUser = normalizeUser(response.user);
        setCurrentUser(normalizedUser);
        setIsLoading(false);
        return { success: true, user: normalizedUser };
      }

      setIsLoading(false);
      return {
        success: false,
        error: response?.message || 'Login failed. Please check your credentials.',
      };
    } catch (err) {
      setIsLoading(false);
      const errorMessage =
        err instanceof ApiError
          ? err.message
          : 'An error occurred during login. Please try again.';
      return { success: false, error: errorMessage };
    }
  };

  /**
   * Register a new student account using backend API (POST /api/auth/register)
   * Public registration is strictly locked to role = "student"
   */
  const register = async (studentData, password) => {
    setIsLoading(true);
    setAuthSuccessMessage('');
    try {
      const payload = {
        name: studentData.name,
        email: studentData.email,
        password: password,
        student_id: studentData.studentId || studentData.student_id,
        phone: studentData.phone,
        department: studentData.department,
        year: studentData.year,
      };

      const response = await apiRegister(payload);

      if (response && response.success) {
        const registeredUser = normalizeUser(response.user);
        setPrefilledEmail(registeredUser.email);
        setAuthSuccessMessage('Account created successfully! Please sign in with your password.');
        setAuthView('login');
        setIsLoading(false);
        return { success: true, user: registeredUser };
      }

      setIsLoading(false);
      return {
        success: false,
        error: response?.message || 'Registration failed. Please check your inputs.',
      };
    } catch (err) {
      setIsLoading(false);
      const errorMessage =
        err instanceof ApiError
          ? err.message
          : 'Registration failed due to an unexpected error. Please try again.';
      return { success: false, error: errorMessage };
    }
  };

  /**
   * Quick Role Switcher for Demos (authenticates via real backend using seed credentials)
   */
  const loginAsRole = async (role) => {
    const roleKey = role.toLowerCase();
    const demoCredentials = {
      admin: { email: 'admin@smartbus.edu', password: 'admin123' },
      driver: { email: 'driver@smartbus.edu', password: 'driver123' },
      student: { email: 'student@smartbus.edu', password: 'student123' },
    };

    const creds = demoCredentials[roleKey] || demoCredentials.student;
    return await login(creds.email, creds.password);
  };

  /**
   * Log out active user session
   */
  const logout = () => {
    disconnectSocket();
    removeToken();
    setCurrentUser(null);
    setAuthView('login');
    setAuthSuccessMessage('');
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated: !!currentUser,
        role: currentUser?.role || 'guest',
        authView,
        setAuthView,
        authSuccessMessage,
        setAuthSuccessMessage,
        prefilledEmail,
        setPrefilledEmail,
        login,
        register,
        loginAsRole,
        logout,
        isLoading,
        isInitializing,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
