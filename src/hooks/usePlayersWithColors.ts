// filepath: src/hooks/usePlayerColors.ts
import { useEffect, useState } from 'react';

const API_BASE = import.meta.env.VITE_LYCANS_API_BASE;
const API_URL = `${API_BASE}?action=playersWithColors`;

export type PlayerColor = {
  JoueurID: string;
  Couleur: string;
  CouleurBackground: string;
};

export function usePlayerColors() {
  const [data, setData] = useState<PlayerColor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(API_URL)
      .then(res => res.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  return { data, loading };
}
