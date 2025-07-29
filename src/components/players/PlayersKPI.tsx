import { useState } from 'react';

import { PlayerSelector } from './PlayerSelector';
import { GlobalStatsCharts } from './GlobalStatsCharts';
import { PlayerDetail } from './PlayerDetails';
import { usePlayerColors } from '../../hooks/usePlayersWithColors';
import type { PlayerColor } from '../../hooks/usePlayersWithColors';
import { usePlayerDetailedStats } from '../../hooks/usePlayerDetailedStats';
import type { PlayerMortTiming } from '../../hooks/usePlayerDetailedStats';
import './PlayersKPI.css';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export default function PlayersKPI() {
  const { data: playersWithColors, loading: loadingColors } = usePlayerColors();
  const { playerStats, loading, error } = usePlayerDetailedStats();
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [mortTimingViewMode, setMortTimingViewMode] = useState<'chronological' | 'byType'>('chronological');

  if (loading || loadingColors) return <div>Chargement des statistiques des joueurs...</div>;
  if (error) return <div>Erreur: {error.message}</div>;
  if (!playerStats.length) return <div>Aucune donnée disponible</div>;

  // Map players to their background colors
  const playerColorMap = Object.fromEntries(
    (playersWithColors || []).map((player: PlayerColor) => [player.JoueurID, player.CouleurBackground])
  );

  // Sort players alphabetically by JoueurID (case-insensitive, accent-insensitive)
  let sortedPlayers = [...playerStats].sort((a, b) =>
    a.JoueurID.localeCompare(b.JoueurID, 'fr', { sensitivity: 'base' })
  );

  const ponceIndex = sortedPlayers.findIndex(player => player.JoueurID.toLowerCase() === 'ponce');
  if (ponceIndex > -1) {
    const [poncePlayer] = sortedPlayers.splice(ponceIndex, 1);
    sortedPlayers = [poncePlayer, ...sortedPlayers];
  }

  const selectedPlayerData = selectedPlayer 
    ? playerStats.find(p => p.JoueurID === selectedPlayer)
    : null;

  const sortMortTimingChronologically = (data: PlayerMortTiming[]) => {
    const typePriority: Record<string, number> = { 'Jour': 0, 'Nuit': 1, 'Conseil': 2, 'Autre': 3 };
    return [...data].sort((a, b) => {
      // First sort by day
      if (a.TimingDay !== b.TimingDay) {
        return a.TimingDay - b.TimingDay;
      }
      
      // Then by type priority
      return (typePriority[a.TimingType] || 99) - (typePriority[b.TimingType] || 99);
    });
  };

  // Add this function to group death timings by type
  const groupMortTimingByType = (data: PlayerMortTiming[]) => {
    const groupedData = data.reduce<Record<string, PlayerMortTiming>>((acc, item) => {
      if (!acc[item.TimingType]) {
        acc[item.TimingType] = {
          MortTiming: item.TimingType,
          TimingType: item.TimingType,
          TimingDay: 0,
          Count: 0,
          Percentage: 0
        };
      }
      acc[item.TimingType].Count += item.Count;
      acc[item.TimingType].Percentage += item.Percentage;
      return acc;
    }, {});
    
    return Object.values(groupedData);
  };

  // Define colors by timing type
  const TIMING_TYPE_COLORS: Record<string, string> = {
    'Jour': '#FFD700',     // Gold for day
    'Nuit': '#0088FE',     // Blue for night 
    'Conseil': '#FF8042',  // Orange for council 
    'Autre': '#8884d8'     // Purple for other 
  };

  return (
      <div className="player-stats">
        <h2>Statistiques des Joueurs</h2>
        <div className="selectors-column">
        <PlayerSelector
          players={sortedPlayers}
          selectedPlayer={selectedPlayer}
          onChange={setSelectedPlayer}
        />
        {!selectedPlayer && (
          <GlobalStatsCharts
            playerStats={playerStats}
            playerColorMap={playerColorMap}
            COLORS={COLORS}
          />
        )}
        </div>
        {selectedPlayerData && (
          <PlayerDetail
            selectedPlayerData={selectedPlayerData}
            mortTimingViewMode={mortTimingViewMode}
            setMortTimingViewMode={setMortTimingViewMode}
            COLORS={COLORS}
            TIMING_TYPE_COLORS={TIMING_TYPE_COLORS}
            sortMortTimingChronologically={sortMortTimingChronologically}
            groupMortTimingByType={groupMortTimingByType}
          />
        )}
    </div>
  );
};