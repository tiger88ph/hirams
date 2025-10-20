import { useState, useEffect } from "react";

const API_BASE_URL = "http://127.0.0.1:8000/api/mappings";

export default function useMapping() {
  const [userTypes, setUserTypes] = useState({});
  const [genders, setGenders] = useState({});
  const [statuses, setStatuses] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMappings = async () => {
      try {
        // Fetch all mappings at once
        const [userTypeRes, genderRes, statusRes] = await Promise.all([
          fetch(`${API_BASE_URL}/user-types`),
          fetch(`${API_BASE_URL}/genders`),
          fetch(`${API_BASE_URL}/status`),
        ]);

        // Parse JSON results
        const [userTypeData, genderData, statusData] = await Promise.all([
          userTypeRes.json(),
          genderRes.json(),
          statusRes.json(),
        ]);

        // Set states
        setUserTypes(userTypeData);
        setGenders(genderData);
        setStatuses(statusData);
      } catch (error) {
        console.error("Error fetching mappings:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMappings();
  }, []);

  return {
    userTypes,
    genders,
    statuses,
    loading,
  };
}
