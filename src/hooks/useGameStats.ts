import { useEffect, useState } from 'react';

const API_BASE = import.meta.env.VITE_LYCANS_API_BASE;
const API_URL = `${API_BASE}?action=gameStats`;

type GameStats = {
  TotalParties: number;
  DureeMoyenne: string;
  PartiePlusCourte: { PartieID: string; Duree: string; Date: string; LienVideo: string };
  PartiePlusLongue: { PartieID: string; Duree: string; Date: string; LienVideo: string };
};

export function useGameStats() {
  const [data, setData] = useState<GameStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(API_URL)
      .then(res => res.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  return { data, loading };
}