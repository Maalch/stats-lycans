import { useParticipationRates } from '../hooks/useParticipationRates';
import { usePlayerColors } from '../hooks/usePlayersWithColors';
import { Cell } from 'recharts';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LabelList } from 'recharts';

type ParticipationData = {
  JoueurID: string;
  ParticipationCount: number;
  ParticipationRate: number;
  CouleurBackground?: string;
  ParticipationPercent?: number;
};

export default function ParticipationKPI() {
  const { data: participationData, loading: loadingParticipation } = useParticipationRates() as { data: ParticipationData[]; loading: boolean };
  const { data: colorData, loading: loadingColors } = usePlayerColors() as { data: { JoueurID: string; CouleurBackground: string }[]; loading: boolean };

  if (loadingParticipation || loadingColors) return <div>Loading...</div>;

    console.log('Participation Data:', participationData);
    console.log('Color Data:', colorData);

  // Merge color info into participation data
  const dataWithColors: ParticipationData[] = participationData.map(player => {
  const colorInfo = colorData.find(c => c.JoueurID === player.JoueurID);
    return {
      ...player,
      CouleurBackground: colorInfo?.CouleurBackground || '#d40606ff', // fallback color
      ParticipationPercent: Number((player.ParticipationRate * 100).toFixed(1)),
    };
  });

  // Sort and take top 10
  const topPlayers = [...dataWithColors]
    .sort((a, b) => b.ParticipationCount - a.ParticipationCount)
    .slice(0, 10);

  // Average participation rate for all players
  const avgRate =
    (participationData.reduce((sum, d) => sum + d.ParticipationRate, 0) / (participationData.length || 1) * 100).toFixed(1);

  console.log('Final data:' + topPlayers);

  return (
    <div>
      <h2>Pourcentage de participation</h2>
      <div>Pourcentage de participation moyen (tous les joueurs): {avgRate}%</div>
      <h3>Participation par joueurs (Top 10)</h3>
      <ResponsiveContainer width="100%" height={500}>
        <BarChart
          data={topPlayers}
          layout="vertical"
          margin={{ left: 40, right: 40, top: 20, bottom: 20 }}
        >
          <XAxis type="number" domain={[0, 100]} tickFormatter={v => `${v}%`} />
          <YAxis dataKey="JoueurID" type="category" width={120} />
          <Tooltip
            formatter={(value) => [`${value}%`, 'Participation']}
            labelFormatter={label => `Player: ${label}`}
          />
          <Bar dataKey="ParticipationPercent">
            {topPlayers.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.CouleurBackground} />
            ))}
            <LabelList dataKey="ParticipationPercent" position="right" formatter={(value) => `${value}%`} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}