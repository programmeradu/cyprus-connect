"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useSession } from "@/lib/auth-client";

interface User {
  id: string;
  email: string;
  name: string;
  companyName: string | null;
  companyIndustry: string | null;
  teamSize: string | null;
  sustainabilityGoals: string | null;
  totalCredits: number;
  onboardingCompleted: boolean;
  // Location and currency preferences
  preferredCurrency: string | null;
  countryCode: string | null;
  timezone: string | null;
  energyZone: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
}

interface UserContextType {
  user: User | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  refetchUser: () => Promise<void>;
  updatePreferences: (preferences: {
    preferredCurrency?: string;
    countryCode?: string;
    timezone?: string;
    energyZone?: string;
  }) => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { data: session, isPending: isSessionPending } = useSession();

  const fetchUser = async () => {
    try {
      const sessionUserId = session?.user?.id;
      
      if (!sessionUserId) {
        setIsLoading(false);
        setUser(null);
        return;
      }

      const response = await fetch(`/api/users?id=${sessionUserId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem("bearer_token") || ""}`
        }
      });
      
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error("Failed to fetch user:", error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const refetchUser = async () => {
    setIsLoading(true);
    await fetchUser();
  };

  const updatePreferences = async (preferences: {
    preferredCurrency?: string;
    countryCode?: string;
    timezone?: string;
    energyZone?: string;
  }) => {
    if (!user?.id) return;

    try {
      const token = localStorage.getItem("bearer_token");
      const response = await fetch(`/api/users/${user.id}/preferences`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || ""}`
        },
        body: JSON.stringify(preferences)
      });

      if (response.ok) {
        await refetchUser();
      }
    } catch (error) {
      console.error("Failed to update preferences:", error);
    }
  };

  useEffect(() => {
    if (!isSessionPending) {
      fetchUser();
    }
  }, [session?.user?.id, isSessionPending]);

  // Auto-refetch when page becomes visible (e.g., returning from Stripe checkout for credits)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && session?.user?.id) {
        console.log("🔄 Page visible - refetching user data (including credits)");
        fetchUser();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [session?.user?.id]);

  return (
    <UserContext.Provider value={{ user, isLoading, setUser, refetchUser, updatePreferences }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};