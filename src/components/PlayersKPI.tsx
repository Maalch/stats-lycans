import { useState } from 'react';
import { usePlayerDetailedStats } from '../hooks/usePlayerDetailedStats';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell 
} from 'recharts';
import { usePlayerColors } from '../hooks/usePlayersWithColors';
import type { PlayerColor } from '../hooks/usePlayersWithColors';
import type { PlayerMortTiming } from '../hooks/usePlayerDetailedStats';
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

   const playerStatsWithParticipation = playerStats.map(player => ({
   ...player,
   ParticipationRate: player.TotalGames > 0 ? player.TotalParties / player.TotalGames : 0,
   ParticipationPercent: player.TotalGames > 0 ? Number((player.TotalParties / player.TotalGames * 100).toFixed(1)) : 0,
   }));

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
      
      {/* Player Selector */}
      <div className="player-selector">
        <label>Sélectionner un joueur: </label>
        <select 
          value={selectedPlayer || ''} 
          onChange={(e) => setSelectedPlayer(e.target.value || null)}
        >
          <option value="">Tous les joueurs</option>
          {sortedPlayers.map((player) => (
            <option key={player.JoueurID} value={player.JoueurID}>
              {player.JoueurID}
            </option>
          ))}
        </select>
      </div>

      {/* Global Stats */}
      {!selectedPlayer && (
        <div className="global-stats">
          <h3>Taux de victoire par joueur</h3>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart
              data={playerStats.slice(0, 15)} // Limit to top 15 players
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="JoueurID" />
              <YAxis tickFormatter={(value) => `${(value * 100).toFixed(0)}%`} />
              <Tooltip 
                formatter={(value) => [`${(Number(value) * 100).toFixed(1)}%`, 'Taux de victoire']}
              />
              <Legend />
              <Bar 
                dataKey="TauxVictoire" 
                name="Taux de victoire"
                fill="#8884d8" 
              >
                {playerStats.slice(0, 15).map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={playerColorMap[entry.JoueurID] || COLORS[index % COLORS.length]} 
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          <h3>Taux de survie par joueur</h3>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart
              data={playerStats.slice(0, 15)}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="JoueurID" />
              <YAxis tickFormatter={(value) => `${(value * 100).toFixed(0)}%`} />
              <Tooltip 
                formatter={(value) => [`${(Number(value) * 100).toFixed(1)}%`, 'Taux de survie']}
              />
              <Legend />
              <Bar 
                dataKey="TauxSurvie" 
                name="Taux de survie"
                fill="#82ca9d" 
              >
                {playerStats.slice(0, 15).map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={playerColorMap[entry.JoueurID] || COLORS[index % COLORS.length]} 
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
         <h3>Taux de participation par joueur</h3>
         <ResponsiveContainer width="100%" height={400}>
          <BarChart
            data={playerStatsWithParticipation.slice(0, 15)}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="JoueurID" />
            <YAxis domain={[0, 1]} tickFormatter={v => `${(v * 100).toFixed(0)}%`} />
            <Tooltip
              formatter={(value) => [`${(Number(value) * 100).toFixed(1)}%`, 'Taux de participation']}
            />
            <Legend />
            <Bar
              dataKey="ParticipationRate"
              name="Taux de participation"
              fill="#d40606"
            >
              {playerStatsWithParticipation.slice(0, 15).map((player, index) => (
                <Cell
                  key={`cell-participation-${index}`}
                  fill={playerColorMap[player.JoueurID] || COLORS[index % COLORS.length]}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        </div>
      )}

      {/* Individual Player Stats */}
      {selectedPlayerData && (
        <div className="player-detail">
          <h3>Statistiques de {selectedPlayerData.JoueurID}</h3>
          
          <div className="stats-summary">
            <div className="stat-box">
              <h4>Parties</h4>
              <p>{selectedPlayerData.TotalParties}</p>
            </div>
            <div className="stat-box">
              <h4>Taux de Victoire</h4>
              <p>{(selectedPlayerData.TauxVictoire * 100).toFixed(1)}%</p>
              <p>({selectedPlayerData.Victoires} V / {selectedPlayerData.Defaites} D)</p>
            </div>
            <div className="stat-box">
              <h4>Taux de Survie</h4>
              <p>{(selectedPlayerData.TauxSurvie * 100).toFixed(1)}%</p>
              <p>({selectedPlayerData.Survivant} vivant / {selectedPlayerData.Mort} mort)</p>
            </div>
            <div className="stat-box">
               <h4>Taux de Participation</h4>
               <p>
                  {selectedPlayerData.TotalGames > 0
                  ? ((selectedPlayerData.TotalParties / selectedPlayerData.TotalGames) * 100).toFixed(1)
                  : '0.0'
                  }%
               </p>
            </div>
          </div>
          
          <h4>Distribution des Rôles</h4>
          {selectedPlayerData.DistributionRoles.length > 0 ? (
            <div className="chart-card">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={selectedPlayerData.DistributionRoles}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  label={({ name, percent }) => 
                    `${name ?? ''} (${percent !== undefined ? (percent * 100).toFixed(0) : '0'}%)`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="Count"
                  nameKey="RoleID"
                >
                  {selectedPlayerData.DistributionRoles.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} parties`, 'Nombre de parties']} />
              </PieChart>
            </ResponsiveContainer>
            </div>
          ) : (
            <p>Aucune donnée de rôle disponible</p>
          )}
          
          <h4>Performance par Camp</h4>
          {selectedPlayerData.DistributionCamps.length > 0 ? (
            <div className="chart-card">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={selectedPlayerData.DistributionCamps}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="Camp" />
                <YAxis tickFormatter={(value) => `${(value * 100).toFixed(0)}%`} />
                <Tooltip
                  formatter={(
                    value: number,
                    name: string
                  ) => {
                    // name correspond au "name" de la <Bar />
                    if (name === '% Joué') {
                      return [`${(Number(value) * 100).toFixed(1)}%`, '% Joué'];
                    }
                    if (name === '% Victoire') {
                      return [`${(Number(value) * 100).toFixed(1)}%`, '% Victoire'];
                    }
                    return [`${(Number(value) * 100).toFixed(1)}%`, name];
                  }}
                />
                <Legend />
                <Bar dataKey="Percentage" name="% Joué" fill="#8884d8" />
                <Bar dataKey="TauxVictoireCamp" name="% Victoire" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          ) : (
            <p>Aucune donnée de rôle disponible</p>
          )}
            {/* Section: Death Timing */}
          <h4>Moments de Mort</h4>
          {selectedPlayerData?.DistributionMortTiming && selectedPlayerData.DistributionMortTiming.length > 0 ? (
            <>
              <div className="chart-view-toggle">
                <button 
                  className={`chart-toggle-button${mortTimingViewMode === 'chronological' ? ' active' : ''}`}
                  onClick={() => setMortTimingViewMode('chronological')}
                >
                  Vue Chronologique
                </button>
                <button 
                  className={`chart-toggle-button${mortTimingViewMode === 'byType' ? ' active' : ''}`}
                  onClick={() => setMortTimingViewMode('byType')}
                >
                  Vue par Type
                </button>
              </div>

              <div className="chart-card">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={mortTimingViewMode === 'chronological' 
                    ? sortMortTimingChronologically(selectedPlayerData.DistributionMortTiming)
                    : groupMortTimingByType(selectedPlayerData.DistributionMortTiming)
                  }
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="MortTiming" />
                  <YAxis 
                    tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
                    domain={[0, Math.max(...selectedPlayerData.DistributionMortTiming.map(item => item.Percentage * 1.1))]}
                  />
                  <Tooltip
                    formatter={(value, name, props) => {
                      if (typeof value === 'number') {
                        // Show "Nuit 3 : 4 fois (19.0%)" in chronological mode
                        if (mortTimingViewMode === 'chronological') {
                          const label = props?.payload?.MortTiming || '';
                          return [`${props.payload.Count} fois (${(value * 100).toFixed(1)}%)`, `${label}`];
                        }
                        // Show "Nuit : 4 fois (19.0%)" in type mode
                        return [`${props.payload.Count} fois (${(value * 100).toFixed(1)}%)`, `${props.payload.TimingType}`];
                      }
                      return [value, name];
                    }}
                  />
                  <Legend />
                  <Bar dataKey="Percentage" name="Fréquence">
                    {mortTimingViewMode === 'chronological' 
                      ? selectedPlayerData.DistributionMortTiming.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={TIMING_TYPE_COLORS[entry.TimingType] || COLORS[index % COLORS.length]} 
                          />
                        ))
                      : groupMortTimingByType(selectedPlayerData.DistributionMortTiming).map((entry) => (
                          <Cell 
                            key={`cell-${entry.TimingType}`} 
                            fill={TIMING_TYPE_COLORS[entry.TimingType] || '#888888'} 
                          />
                        ))
                    }
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            </>
          ) : (
            <p>Aucune donnée de timing de mort disponible</p>
          )}
            
            {/* Death Reasons */}
            <h4>Causes de Mort</h4>
            {selectedPlayerData.DistributionMortRaisons && selectedPlayerData.DistributionMortRaisons.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={selectedPlayerData.DistributionMortRaisons}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="MortRaison" />
                  <YAxis tickFormatter={(value) => `${(value * 100).toFixed(0)}%`} />
                  <Tooltip
                    formatter={(value, _name, props) => {
                      // Use the MortRaison label from the payload
                      const raison = props?.payload?.MortRaison || '';
                      if (typeof value === 'number') {
                        return [`${props.payload.Count} fois (${(value * 100).toFixed(1)}%)`, `${raison}`];
                      }
                      return [value, raison];
                    }}
                  />
                  <Legend />
                  <Bar dataKey="Percentage" name="Fréquence" fill="#8884d8">
                    {selectedPlayerData.DistributionMortRaisons.map((_, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={COLORS[(index + 2) % COLORS.length]} 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
          ) : (
            <p>Aucune donnée de camp disponible</p>
          )}
        </div>
      )}
    </div>
  );
};