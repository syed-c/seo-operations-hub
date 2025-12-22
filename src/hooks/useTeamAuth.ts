// Hook to retrieve team authentication data from sessionStorage
import { useState, useEffect } from "react";

interface TeamUser {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role?: string;
}

export const useTeamAuth = () => {
  const [teamUser, setTeamUser] = useState<TeamUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const storedTeamUser = sessionStorage.getItem('teamUser');
      if (storedTeamUser) {
        const parsedUser = JSON.parse(storedTeamUser);
        setTeamUser(parsedUser);
      }
    } catch (error) {
      console.error('Failed to parse team user data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearTeamAuth = () => {
    sessionStorage.removeItem('teamUser');
    setTeamUser(null);
  };

  return { teamUser, loading, clearTeamAuth };
};