import { useEffect, useState } from 'react';

export interface PlayerRoleSession {
  RoleName: string;
  Count: number;
  Percentage: number;
}

export interface PlayerStatsBySession {
  JoueurID: string;
  PartiesSession: number;
  VictoiresSession: number;
  DefaitesSession: number;
  SurvivantSession: number;
  MortSession: number;
  TauxVictoireSession: number;
  TauxSurvieSession: number;
  DistributionRolesSession: PlayerRoleSession[];
}

interface UsePlayerStatsBySessionResult {
  playerStatsBySession: PlayerStatsBySession[] | null;
  loading: boolean;
  error: Error | null;
}

export function usePlayerStatsBySession(sessionDate: string | null): UsePlayerStatsBySessionResult {
  const [playerStatsBySession, setPlayerStatsBySession] = useState<PlayerStatsBySession[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!sessionDate) {
      setPlayerStatsBySession(null);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    const apiBase = import.meta.env.VITE_LYCANS_API_BASE;
    fetch(`${apiBase}?action=playerStatsBySession&sessionDate=${encodeURIComponent(sessionDate)}`)
      .then(async (res) => {
        if (!res.ok) throw new Error(`Erreur HTTP: ${res.status}`);
        const data = await res.json();
        setPlayerStatsBySession(data);
      })
      .catch((err) => setError(err instanceof Error ? err : new Error(String(err))))
      .finally(() => setLoading(false));
  }, [sessionDate]);

  return { playerStatsBySession, loading, error };
}