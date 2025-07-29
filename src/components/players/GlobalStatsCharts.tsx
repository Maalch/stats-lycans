// GlobalStatsCharts.tsx
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

interface GlobalStatsChartsProps {
  playerStats: any[];
  playerStatsWithParticipation: any[];
  playerColorMap: Record<string, string>;
  COLORS: string[];
}

export function GlobalStatsCharts({ playerStats, playerStatsWithParticipation, playerColorMap, COLORS }: GlobalStatsChartsProps) {
  return (
    <div className="global-stats">
      <h3>Taux de victoire par joueur</h3>
      <div className="chart-card">
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={playerStats.slice(0, 15)}>
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
              {playerStats.slice(0, 15).map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={playerColorMap[entry.JoueurID] || COLORS[index % COLORS.length]}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <h3>Taux de survie par joueur</h3>
         <div className="chart-card ">
         <ResponsiveContainer>
         <BarChart
            data={playerStats.slice(0, 15)}
         >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="JoueurID" />
            <YAxis tickFormatter={(value) => `${(value * 100).toFixed(0)}%`} />
               <Tooltip
               formatter={(value, _name, props) => {
                  return [
                     `${(Number(value) * 100).toFixed(1)}%`,
                     `${props.payload.JoueurID}`
                  ];
               }}
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
         </div>
      <h3>Taux de participation par joueur</h3>
      <div className="chart-card">
         <ResponsiveContainer>
         <BarChart
            data={playerStatsWithParticipation.slice(0, 15)}
         >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="JoueurID" />
            <YAxis domain={[0, 1]} tickFormatter={v => `${(v * 100).toFixed(0)}%`} />
               <Tooltip
               formatter={(value, _name, props) => {
                  return [
                     `${(Number(value) * 100).toFixed(1)}%`,
                     `${props.payload.JoueurID}`
                  ];
               }}
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
    </div>
  );
}