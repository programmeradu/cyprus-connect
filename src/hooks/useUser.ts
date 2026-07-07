"use client";

import { useState, useEffect } from "react";

interface User {
  id: number;
  email: string;
  name: string;
  companyName: string | null;
  companyIndustry: string | null;
  teamSize: string | null;
  sustainabilityGoals: string | null;
  totalCredits: number;
  createdAt: string;
  updatedAt: string;
}

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userId = localStorage.getItem("user_id");
      if (!userId) {
        setIsLoading(false);
        return;
      }

      const response = await fetch(`/api/users?id=${userId}`);
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        // Clear invalid user ID
        localStorage.removeItem("user_id");
      }
    } catch (error) {
      console.error("Failed to load user:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const createUser = async (userData: {
    email: string;
    name: string;
    companyName?: string;
    companyIndustry?: string;
    teamSize?: string;
    sustainabilityGoals?: string[];
  }) => {
    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...userData,
          sustainabilityGoals: userData.sustainabilityGoals 
            ? JSON.stringify(userData.sustainabilityGoals)
            : null
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create user");
      }

      const newUser = await response.json();
      setUser(newUser);
      localStorage.setItem("user_id", newUser.id.toString());
      
      // Also store onboarding data in localStorage for backwards compatibility
      if (userData.companyName) localStorage.setItem("company_name", userData.companyName);
      if (userData.companyIndustry) localStorage.setItem("company_industry", userData.companyIndustry);
      if (userData.teamSize) localStorage.setItem("company_team_size", userData.teamSize);
      if (userData.sustainabilityGoals) {
        localStorage.setItem("company_goals", JSON.stringify(userData.sustainabilityGoals));
      }

      return newUser;
    } catch (error) {
      console.error("Failed to create user:", error);
      throw error;
    }
  };

  const updateUser = async (updates: Partial<User>) => {
    if (!user) return;

    try {
      const response = await fetch(`/api/users?id=${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        throw new Error("Failed to update user");
      }

      const updatedUser = await response.json();
      setUser(updatedUser);
      return updatedUser;
    } catch (error) {
      console.error("Failed to update user:", error);
      throw error;
    }
  };

  const refreshUser = async () => {
    await loadUser();
  };

  const logout = () => {
    localStorage.removeItem("user_id");
    setUser(null);
  };

  return {
    user,
    isLoading,
    createUser,
    updateUser,
    refreshUser,
    logout
  };
}
