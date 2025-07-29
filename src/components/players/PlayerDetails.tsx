// PlayerDetail.tsx
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell 
} from 'recharts';
import type { PlayerMortTiming } from '../../hooks/usePlayerDetailedStats';

export function PlayerDetail({
  selectedPlayerData,
  mortTimingViewMode,
  setMortTimingViewMode,
  COLORS,
  TIMING_TYPE_COLORS,
  sortMortTimingChronologically,
  groupMortTimingByType
}: any) {
  // ...render all the detailed stats and charts for the selected player
  return (
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
            <ResponsiveContainer>
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
                  {selectedPlayerData.DistributionRoles.map((_: any, index: number) => (
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
            <ResponsiveContainer>
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
                  className={`toggle-button${mortTimingViewMode === 'chronological' ? ' active' : ''}`}
                  onClick={() => setMortTimingViewMode('chronological')}
                >
                  Vue Chronologique
                </button>
                <button 
                  className={`toggle-button${mortTimingViewMode === 'byType' ? ' active' : ''}`}
                  onClick={() => setMortTimingViewMode('byType')}
                >
                  Vue par Type
                </button>
              </div>

              <div className="chart-card">
              <ResponsiveContainer>
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
                    domain={[0, Math.max(...selectedPlayerData.DistributionMortTiming.map((item: PlayerMortTiming) => item.Percentage * 1.1))]}
                  />
                  <Tooltip
                    formatter={(value, name, props) => {
                      if (typeof value === 'number') {
                        // Example: Show "Nuit 3 : 4 fois (19.0%)" in chronological mode
                        if (mortTimingViewMode === 'chronological') {
                          const label = props?.payload?.MortTiming || '';
                          return [`${props.payload.Count} fois (${(value * 100).toFixed(1)}%)`, `${label}`];
                        }
                        // Example: Show "Nuit : 4 fois (19.0%)" in type mode
                        return [`${props.payload.Count} fois (${(value * 100).toFixed(1)}%)`, `${props.payload.TimingType}`];
                      }
                      return [value, name];
                    }}
                  />
                  <Legend />
                  <Bar dataKey="Percentage" name="Fréquence">
                    {mortTimingViewMode === 'chronological' 
                      ? selectedPlayerData.DistributionMortTiming.map((entry: PlayerMortTiming, index: number) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={TIMING_TYPE_COLORS[entry.TimingType] || COLORS[index % COLORS.length]} 
                          />
                        ))
                      : groupMortTimingByType(selectedPlayerData.DistributionMortTiming).map((entry: PlayerMortTiming) => (
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
              <div className="chart-card">
                <ResponsiveContainer>
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
                      {selectedPlayerData.DistributionMortRaisons.map((_: any, index: number) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={COLORS[(index + 2) % COLORS.length]} 
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
          ) : (
            <p>Aucune donnée de camp disponible</p>
          )}
        </div>
  );
}