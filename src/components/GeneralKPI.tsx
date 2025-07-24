import { useParticipationRates } from '../hooks/useParticipationRates';
import { usePlayerColors } from '../hooks/usePlayersWithColors';
import { useGameStats } from '../hooks/useGameStats';
import { Cell } from 'recharts';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LabelList } from 'recharts';

type ParticipationData = {
  JoueurID: string;
  ParticipationCount: number;
  ParticipationRate: number;
  CouleurBackground?: string;
  ParticipationPercent?: number;
};

export default function GeneralKPI() {
  const { data: participationData, loading: loadingParticipation } = useParticipationRates() as { data: ParticipationData[]; loading: boolean };
  const { data: colorData, loading: loadingColors } = usePlayerColors() as { data: { JoueurID: string; CouleurBackground: string }[]; loading: boolean };

  // Game stats (durée moyenne, plus courte, plus longue)
  const { data: gameStats, loading: loadingGameStats } = useGameStats() as {
    data: {
      TotalParties: number;
      DureeMoyenne: string;
      PartiePlusCourte: { PartieID: string; Duree: string; Date: string; LienVideo: string };
      PartiePlusLongue: { PartieID: string; Duree: string; Date: string; LienVideo: string };
    };
    loading: boolean;
  };

  if (loadingParticipation || loadingColors || loadingGameStats) return <div>Chargement...</div>;

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

  return (
    <div>
      <h2>Statistiques Générales des Parties</h2>
      <div style={{ display: 'flex', gap: '2rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        <div style={{ minWidth: 200 }}>
          <strong>Nombre total de parties :</strong><br />
          {gameStats?.TotalParties || '-'}
        </div>
        <div style={{ minWidth: 200 }}>
          <strong>Durée moyenne :</strong><br />
          {gameStats?.DureeMoyenne || '-'}
        </div>
        <div style={{ minWidth: 200 }}>
          <strong>Partie la plus courte :</strong><br />
          {gameStats?.PartiePlusCourte?.Duree || '-'}<br />
          <small>Date : {gameStats?.PartiePlusCourte?.Date || '-'}</small><br />
          {gameStats?.PartiePlusCourte?.LienVideo && (
            <a href={gameStats.PartiePlusCourte.LienVideo} target="_blank" rel="noopener noreferrer">Lien vidéo</a>
          )}
        </div>
        <div style={{ minWidth: 200 }}>
          <strong>Partie la plus longue :</strong><br />
          {gameStats?.PartiePlusLongue?.Duree || '-'}<br />
          <small>Date : {gameStats?.PartiePlusLongue?.Date || '-'}</small><br />
          {gameStats?.PartiePlusLongue?.LienVideo && (
            <a href={gameStats.PartiePlusLongue.LienVideo} target="_blank" rel="noopener noreferrer">Lien vidéo</a>
          )}
        </div>
      </div>
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