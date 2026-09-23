// src/hooks/useUserService.js
import { useState, useCallback } from 'react';
import {
  loginUser,
  registerUser,
  logoutUser,
  getAllUsers,
  getUserById,
  deleteUser,
  updateUser
} from '../services/userServices';

export const useUsers = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  // ================================
  // Login User
  // ================================
  const login = useCallback(async (email, password) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await loginUser(email, password);
      
      if (!result.success) {
        setError(result.message);
        setData(null);
      } else {
        setData(result);
        setError(null);
      }
      
      return result;
    } catch (err) {
      const errorMessage = err.message || 'Login failed';
      setError(errorMessage);
      setData(null);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  // ================================
  // Register User
  // ================================
  const register = useCallback(async (username, email, password) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await registerUser(username, email, password);
      
      if (!result.success) {
        setError(result.message);
        setData(null);
      } else {
        setData(result);
        setError(null);
      }
      
      return result;
    } catch (err) {
      const errorMessage = err.message || 'Registration failed';
      setError(errorMessage);
      setData(null);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  // ================================
  // Logout User
  // ================================
  const logout = useCallback(() => {
    logoutUser();
    setData(null);
    setError(null);
  }, []);

  // ================================
  // Get All Users (Admin)
  // ================================
  const fetchAllUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await getAllUsers();
      
      if (!result.success) {
        setError(result.message);
        setData(null);
      } else {
        setData(result);
        setError(null);
      }
      
      return result;
    } catch (err) {
      const errorMessage = err.message || 'Failed to fetch users';
      setError(errorMessage);
      setData(null);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  // ================================
  // Get User by ID
  // ================================
  const fetchUserById = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await getUserById(id);
      
      if (!result.success) {
        setError(result.message);
        setData(null);
      } else {
        setData(result);
        setError(null);
      }
      
      return result;
    } catch (err) {
      const errorMessage = err.message || 'Failed to fetch user';
      setError(errorMessage);
      setData(null);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  // ================================
  // Delete User
  // ================================
  const removeUser = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await deleteUser(id);
      
      if (!result.success) {
        setError(result.message);
      } else {
        // If we deleted the current user, clear the data
        if (data?.user?.id === id) {
          setData(null);
        }
        setError(null);
      }
      
      return result;
    } catch (err) {
      const errorMessage = err.message || 'Failed to delete user';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [data]);

  // ================================
  // Update User
  // ================================
  const update = useCallback(async (id, updateData) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await updateUser(id, updateData);
      
      if (!result.success) {
        setError(result.message);
      } else {
        // Update local data if we're updating the current user
        if (data?.user?.id === id) {
          setData(prev => ({
            ...prev,
            user: { ...prev.user, ...updateData }
          }));
        }
        setError(null);
      }
      
      return result;
    } catch (err) {
      const errorMessage = err.message || 'Failed to update user';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [data]);

  // ================================
  // Clear Error
  // ================================
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // ================================
  // Reset State
  // ================================
  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
    setData(null);
  }, []);

  return {
    // State
    loading,
    error,
    data,
    
    // Actions
    login,
    register,
    logout,
    fetchAllUsers,
    fetchUserById,
    removeUser,
    update,
    
    // Utilities
    clearError,
    reset,
    
    // Convenience getters
    user: data?.user,
    users: data?.users,
    isAuthenticated: !!data?.user
  };
};

