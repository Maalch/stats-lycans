import { useState, useEffect } from 'react';

export interface LycanSessionData {
  DateSession: string;
  NombreParties: number;
  DureeMoyenne: string;
  TempsJeuTotal: string;
  JoueursMoyen: number;
  VideosYoutubeAvecTemps: string[];
  VideosYoutube: string[];
  PartiesIDs: string[];
  Versions: string[];
}

export function useSessionStats() {
  const [gameSessionData, setGameSessionData] = useState<LycanSessionData[]>([]);
  const [isDataFetching, setIsDataFetching] = useState(true);
  const [fetchError, setFetchError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchSessionData = async () => {
      try {
        setIsDataFetching(true);
        const apiBaseUrl = import.meta.env.VITE_LYCANS_API_BASE;
        const sessionResponse = await fetch(`${apiBaseUrl}?action=sessionStats`);
        
        if (!sessionResponse.ok) {
          throw new Error(`Erreur HTTP: ${sessionResponse.status}`);
        }
        
        const responseData = await sessionResponse.json();
        setGameSessionData(responseData);
      } catch (err) {
        setFetchError(err instanceof Error ? err : new Error(String(err)));
        console.error("Erreur lors de la récupération des stats de session:", err);
      } finally {
        setIsDataFetching(false);
      }
    };

    fetchSessionData();
  }, []);

  return { gameSessionData, isDataFetching, fetchError };
}