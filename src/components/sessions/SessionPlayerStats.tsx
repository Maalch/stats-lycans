import './SessionsKPI.css';
import { Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const ROLE_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

interface SessionPlayerStatsProps {
  playerStatsBySession: any[];
  loading: boolean;
  error: Error | null;
}

export function SessionPlayerStats({ playerStatsBySession, loading, error }: SessionPlayerStatsProps) {
  if (loading) return <div>Chargement des statistiques des joueurs...</div>;

  if (error) {
    return (
      <div className="info-message error">
        <p>Erreur: {error.message}</p>
      </div>
    );
  }

  if (!playerStatsBySession || playerStatsBySession.length === 0) {
    return (
      <div className="info-message">
        <p>Aucune donnée de joueur disponible pour cette session.</p>
      </div>
    );
  }

  return (
    <div className="lycans-session-player-stats">
      <h3>Statistiques des joueurs pour cette session</h3>
      <div className="player-session-cards">
        {playerStatsBySession.map(player => (
          <div key={player.JoueurID} className="player-session-card">
            <h4>{player.JoueurID}</h4>
            <div className="player-session-stats">
              <div className="player-stat">
                <span>Parties:</span>
                <strong>{player.PartiesSession}</strong>
              </div>
              <div className="player-stat">
                <span>Victoires:</span>
                <strong>{player.VictoiresSession} ({(player.TauxVictoireSession * 100).toFixed(1)}%)</strong>
              </div>
              <div className="player-stat">
                <span>Survie:</span>
                <strong>{player.SurvivantSession} ({(player.TauxSurvieSession * 100).toFixed(1)}%)</strong>
              </div>
            </div>
            {player.DistributionRolesSession.length > 0 && (
              <div className="player-roles-chart">
                <h5>Rôles joués</h5>
                <ResponsiveContainer width="100%" height={100}>
                  <PieChart>
                    <Pie
                      data={player.DistributionRolesSession.slice(0, 5)}
                      cx="50%"
                      cy="50%"
                      innerRadius={15}
                      outerRadius={30}
                      dataKey="Count"
                      nameKey="RoleName"
                    >
                      {player.DistributionRolesSession.slice(0, 5).map((_: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={ROLE_COLORS[index % ROLE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(
                        value: number,
                        _name: string,
                        props: { payload?: { RoleName?: string } }
                      ) => {
                        const role = props?.payload?.RoleName || '';
                        return [`${value} fois`, `${role}`];
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="role-legend">
                  {player.DistributionRolesSession.slice(0, 8).map((role: any, idx: number) => (
                    <div key={idx} className="role-item">
                      <span
                        className="role-color"
                        style={{ backgroundColor: ROLE_COLORS[idx % ROLE_COLORS.length] }}
                      ></span>
                      <span className="role-name">{role.RoleName}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}