import { useEffect, useState } from 'react';

const API_BASE = import.meta.env.VITE_LYCANS_API_BASE;
const API_URL = `${API_BASE}?action=participationRate`;

export function useParticipationRates() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(API_URL)
      .then(res => res.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  return { data, loading };
}