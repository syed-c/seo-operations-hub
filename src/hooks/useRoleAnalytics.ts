import { useState, useEffect } from "react";
import { getRoleAnalyticsData, RoleAnalyticsData } from "@/services/roleAnalytics.service";

export const useRoleAnalytics = (userRole: string | null, userId: string | null) => {
  const [data, setData] = useState<RoleAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeFilter, setTimeFilter] = useState<'7d' | '30d' | '90d' | undefined>(undefined);

  useEffect(() => {
    const fetchData = async () => {
      if (!userRole || !userId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const result = await getRoleAnalyticsData(userRole, userId, timeFilter);
        setData(result);
      } catch (err) {
        console.error("Error fetching role analytics data:", err);
        setError("Failed to load analytics data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userRole, userId, timeFilter]);

  return { data, loading, error, timeFilter, setTimeFilter };
};