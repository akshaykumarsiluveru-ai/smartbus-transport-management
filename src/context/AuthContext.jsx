import React, { createContext, useContext, useState, useEffect } from 'react';
import { INITIAL_USERS } from '../services/mockData';
import {
  hashPassword,
  getRegisteredUsers,
  saveRegisteredUsers,
  getStoredCredentials,
  saveStoredCredentials,
  getCurrentUserSession,
  saveCurrentUserSession,
  clearCurrentUserSession,
  generateDigitalPassId,
} from '../services/authStorage';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(() => getCurrentUserSession());
  const [isLoading, setIsLoading] = useState(false);
  const [authView, setAuthView] = useState('login'); // 'login' | 'register'
  const [authSuccessMessage, setAuthSuccessMessage] = useState('');
  const [prefilledEmail, setPrefilledEmail] = useState('');

  // Synchronize session on mount
  useEffect(() => {
    const savedUser = getCurrentUserSession();
    if (savedUser) {
      setCurrentUser(savedUser);
    }
  }, []);

  /**
   * Register a new student account
   * Role is automatically and strictly set to "student"
   */
  const register = async (studentData, password) => {
    setIsLoading(true);
    try {
      // Simulate network / processing delay
      await new Promise((res) => setTimeout(res, 600));

      const normalizedEmail = studentData.email.trim().toLowerCase();
      const normalizedStudentId = studentData.studentId.trim().toUpperCase();

      // Check for existing user in demo users or registered users
      const existingRegistered = getRegisteredUsers();
      const allUsers = [...INITIAL_USERS, ...existingRegistered];

      const emailExists = allUsers.some(
        (u) => u.email.toLowerCase() === normalizedEmail
      );
      if (emailExists) {
        setIsLoading(false);
        return {
          success: false,
          error: 'An account with this email address already exists. Please sign in.',
        };
      }

      const idExists = allUsers.some(
        (u) => u.studentId && u.studentId.toUpperCase() === normalizedStudentId
      );
      if (idExists) {
        setIsLoading(false);
        return {
          success: false,
          error: 'This Student ID is already registered in the system.',
        };
      }

      // Hash password (never plain-text)
      const hashedPassword = await hashPassword(password);

      // Create new student user object
      const newUser = {
        id: `user_student_${Date.now()}`,
        name: studentData.name.trim(),
        email: normalizedEmail,
        phone: studentData.phone.trim(),
        studentId: normalizedStudentId,
        department: studentData.department,
        year: studentData.year,
        photoUrl: studentData.photoUrl || null,
        role: 'student', // Locked to student
        digitalPassId: generateDigitalPassId(studentData.year),
        createdAt: new Date().toISOString(),
      };

      // Save user to registered users list
      const updatedUsers = [newUser, ...existingRegistered];
      saveRegisteredUsers(updatedUsers);

      // Save credential hash
      const credentials = getStoredCredentials();
      credentials[normalizedEmail] = hashedPassword;
      saveStoredCredentials(credentials);

      // Pre-fill email and set success banner for login transition
      setPrefilledEmail(newUser.email);
      setAuthSuccessMessage('Account created successfully! Please sign in with your password.');
      setAuthView('login');
      setIsLoading(false);

      return { success: true, user: newUser };
    } catch (err) {
      console.error('Registration error:', err);
      setIsLoading(false);
      return { success: false, error: 'Registration failed due to an unexpected error. Please try again.' };
    }
  };

  /**
   * Log in using email & password
   */
  const login = async (email, password) => {
    setIsLoading(true);
    setAuthSuccessMessage('');
    try {
      await new Promise((res) => setTimeout(res, 500));
      const normalizedEmail = email.trim().toLowerCase();

      // 1. Check Demo Accounts
      const demoUser = INITIAL_USERS.find(
        (u) => u.email.toLowerCase() === normalizedEmail
      );
      if (demoUser) {
        // Accept default password or any password for demo users
        saveCurrentUserSession(demoUser);
        setCurrentUser(demoUser);
        setIsLoading(false);
        return { success: true, user: demoUser };
      }

      // 2. Check Registered Users
      const registeredUsers = getRegisteredUsers();
      const user = registeredUsers.find(
        (u) => u.email.toLowerCase() === normalizedEmail
      );

      if (user) {
        const credentials = getStoredCredentials();
        const storedHash = credentials[normalizedEmail];
        const enteredHash = await hashPassword(password);

        if (storedHash && storedHash === enteredHash) {
          saveCurrentUserSession(user);
          setCurrentUser(user);
          setIsLoading(false);
          return { success: true, user };
        } else {
          setIsLoading(false);
          return { success: false, error: 'Incorrect password. Please verify and try again.' };
        }
      }

      setIsLoading(false);
      return {
        success: false,
        error: 'No account found with this email address. Please check your credentials or Sign Up.',
      };
    } catch (err) {
      console.error('Login error:', err);
      setIsLoading(false);
      return { success: false, error: 'An error occurred during login. Please try again.' };
    }
  };

  /**
   * Instant Role Switcher for live demos
   */
  const loginAsRole = (role) => {
    const user = INITIAL_USERS.find((u) => u.role.toLowerCase() === role.toLowerCase());
    if (user) {
      saveCurrentUserSession(user);
      setCurrentUser(user);
      setAuthSuccessMessage('');
    }
  };

  /**
   * Log out active user
   */
  const logout = () => {
    clearCurrentUserSession();
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
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
