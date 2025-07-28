import { useState, useEffect } from 'react';

export interface PlayerRole {
  RoleID: string;
  Count: number;
  Percentage: number;
}

export interface PlayerCamp {
  Camp: string;
  Count: number;
  Percentage: number;
  Victoires: number;
  TauxVictoireCamp: number;
}

export interface PlayerMortTiming {
  MortTiming: string;
  TimingType: string; // "Jour", "Nuit" or "Conseil"
  TimingDay: number; // Numeric day (1, 2, 3, etc)
  Count: number;
  Percentage: number;
}
  
export interface PlayerMortRaisons {
  MortRaison: string;
  Count: number;
  Percentage: number;
}

export interface PlayerDetailedStats {
  JoueurID: string;
  TotalParties: number;
  Victoires: number;
  Defaites: number;
  Survivant: number;
  Mort: number;
  TauxVictoire: number;
  TauxSurvie: number;
  DistributionRoles: PlayerRole[];
  DistributionRolesSecondaires: PlayerRole[];
  DistributionCamps: PlayerCamp[];
  DistributionMortTiming: PlayerMortTiming[];
  DistributionMortRaisons: PlayerMortRaisons[];
  TotalGames: number;
}

export function usePlayerDetailedStats() {
  const [playerStats, setPlayerStats] = useState<PlayerDetailedStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const baseUrl = import.meta.env.VITE_LYCANS_API_BASE;
        const response = await fetch(`${baseUrl}?action=playerDetailedStats`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const data = await response.json();
        setPlayerStats(data);
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
        console.error("Error fetching player detailed stats:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return { playerStats, loading, error };
}