import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import './PlayersKPI.css';

interface GlobalStatsChartsProps {
  playerStats: any[];
  playerColorMap: Record<string, string>;
  COLORS: string[];
}

const MIN_GAMES_OPTIONS = [1, 5, 10, 11, 15, 20, 30, 50];
const CHART_TYPE_OPTIONS = [
  { value: 'victory', label: '% Victoire' },
  { value: 'survival', label: '% Survie' },
  { value: 'participation', label: '% Participation' },
];

export function GlobalStatsCharts({ playerStats, playerColorMap, COLORS }: GlobalStatsChartsProps) {
  // State for minimum games filter and chart type
  const [minGames, setMinGames] = useState<number>(11);
  const [chartType, setChartType] = useState<string>('victory');

  // Filter players with at least minGames games
  const filteredStats = playerStats.filter(player => player.TotalParties >= minGames);

  // Create sorted data arrays for each chart
  const playerStatsByVictory = [...filteredStats]
    .sort((a, b) => b.TauxVictoire - a.TauxVictoire)
    .slice(0, 15);

  const playerStatsBySurvival = [...filteredStats]
    .sort((a, b) => b.TauxSurvie - a.TauxSurvie)
    .slice(0, 15);

  const playerStatsWithParticipation = playerStats.map(player => ({
    ...player,
    ParticipationRate: player.TotalGames > 0 ? player.TotalParties / player.TotalGames : 0,
    ParticipationPercent: player.TotalGames > 0 ? Number((player.TotalParties / player.TotalGames * 100).toFixed(1)) : 0,
  }));

  const playerStatsByParticipation = [...playerStatsWithParticipation]
    .sort((a, b) => b.ParticipationRate - a.ParticipationRate)
    .slice(0, 15);

  return (
    <div className="global-stats">
      <div className="list-selector">
        <label htmlFor="chart-type-select">Type de graphique :</label>
        <select
          id="chart-type-select"
          value={chartType}
          onChange={e => setChartType(e.target.value)}
        >
          {CHART_TYPE_OPTIONS.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
         {chartType !== 'participation' && (
          <>      
            <label htmlFor="min-games-select">Nombre min. de parties : </label>
            <select
              id="min-games-select"
              value={minGames}
              onChange={e => setMinGames(Number(e.target.value))}
            >
              {MIN_GAMES_OPTIONS.map(option => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
                </select>
          </>
        )}
      </div>

      {chartType === 'victory' && (
        <>
          <h3>Taux de victoire par joueur (min. {minGames} parties)</h3>
          <div className="chart-card">
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={playerStatsByVictory}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="JoueurID" />
                <YAxis tickFormatter={v => `${(v * 100).toFixed(0)}%`} />
                <Tooltip
                  formatter={(value, _name, props) => [
                    `${props.payload.JoueurID} : ${(Number(value) * 100).toFixed(1)}%`,
                    'Taux de victoire'
                  ]}
                />
                <Legend />
                <Bar dataKey="TauxVictoire" name="Taux de victoire" fill="#8884d8">
                  {playerStatsByVictory.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={playerColorMap[entry.JoueurID] || COLORS[index % COLORS.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      {chartType === 'survival' && (
        <>
          <h3>Taux de survie par joueur (min. {minGames} parties)</h3>
          <div className="chart-card">
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={playerStatsBySurvival}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="JoueurID" />
                <YAxis tickFormatter={(value) => `${(value * 100).toFixed(0)}%`} />
                <Tooltip
                  formatter={(value, _name, props) => [
                    `${props.payload.JoueurID} : ${(Number(value) * 100).toFixed(1)}%`,
                    'Taux de survie'
                  ]}
                />
                <Legend />
                <Bar 
                  dataKey="TauxSurvie" 
                  name="Taux de survie"
                  fill="#82ca9d" 
                >
                  {playerStatsBySurvival.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={playerColorMap[entry.JoueurID] || COLORS[index % COLORS.length]} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      {chartType === 'participation' && (
        <>
          <h3>Taux de participation par joueur (min. {minGames} parties)</h3>
          <div className="chart-card">
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={playerStatsByParticipation}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="JoueurID" />
                <YAxis domain={[0, 1]} tickFormatter={v => `${(v * 100).toFixed(0)}%`} />
                <Tooltip
                  formatter={(value, _name, props) => [
                    `${props.payload.JoueurID} : ${(Number(value) * 100).toFixed(1)}%`,
                    'Taux de participation'
                  ]}
                />
                <Legend />
                <Bar
                  dataKey="ParticipationRate"
                  name="Taux de participation"
                  fill="#d40606"
                >
                  {playerStatsByParticipation.map((player, index) => (
                    <Cell
                      key={`cell-participation-${index}`}
                      fill={playerColorMap[player.JoueurID] || COLORS[index % COLORS.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
}