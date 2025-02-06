import { useEffect, useState } from 'react'
import { ChevronUp, ChevronDown, CircleCheck, CircleX, ToggleLeft, ToggleRight } from 'lucide-react';
import './App.css'

interface Match {
  team_1: string;
  team_2: string;
  score: [number, number];
}

interface PlayerStats {
  player: string;
  games: number;
  wins: number;  
  losses: number;
  winRate: number;
  results: number[];
}

interface TeamStats {
  team: string;
  games: number;
  wins: number;  
  losses: number;
  winRate: number;
  results: number[];
}

interface MatchStats {
  match: string;
  games: number;
  wins: number;
  losses: number;
  winRate: number;
  results: number[];
}

type Stats = PlayerStats | TeamStats | MatchStats;

interface SortableTableProps<T extends Stats> {
  data: T[];
  title: string;
}

function App() {  
  
  const [playerStats, setPlayerStats] = useState<PlayerStats[]>([]);  
  const [teamStatsOverall, setTeamStatsOverall] = useState<TeamStats[]>([]);
  const [teamStatsSpecific, setTeamStatsSpecific] = useState<TeamStats[]>([]);
  const [matchStats, setMatchStats] = useState<MatchStats[]>([]);
  const [showTrends, setShowTrend] = useState<boolean>(false);

  useEffect(() => {

    fetch("https://api.github.com/gists/16fc9291f9b939835ade9494a75de5cb")
      .then(response => response.json())
      .then(data => data["files"]["llabsoof.txt"]["content"])
      .then(data => {
          const results = parseResults(data);
          const [playerStats, teamStatsOverall, teamStatsSpecific, matchStats] = extractStats(results);

          setPlayerStats(playerStats);
          setTeamStatsOverall(teamStatsOverall);
          setTeamStatsSpecific(teamStatsSpecific);
          setMatchStats(matchStats);
        })
        .catch(error => console.error('Error fetching the text file:', error));
  }, []);

  function parseResults(results: string): Match[]  {
    const lines = results.split('\n');

    const parseScore = (score: string): [number, number] => {
      const parts = score.split(':');
      return [+parts[0], +parts[1]];
    }

    const matches: Match[] =  lines
    .map(line => line.split(' '))
    .filter(parts => parts.length === 3)
    .map(parts => {
      return {
        team_1: parts[0].replace('+', ' ').toUpperCase(),
        team_2: parts[1].replace('+', ' ').toUpperCase(),
        score: parseScore(parts[2])
      };
    });

    return matches;
  } 


  const extractStats = (results: Match[]): [PlayerStats[], TeamStats[], TeamStats[], MatchStats[]] => {
    const playerStats: { [key: string]: PlayerStats } = {};
    const teamStatsOverall: { [key: string]: TeamStats } = {};
    const teamStatsSpecific: { [key: string]: TeamStats } = {};
    const gamesStats: { [key: string]: MatchStats } = {};
      
    const getPlayers = (team: string): string[] => team.split(' ');
      
    const initializePlayerStats = (player: string) => {
      if (!playerStats[player]) {
        playerStats[player] = {
          player,
          games: 0,
          wins: 0,
          losses: 0,
          winRate: 0,
          results: []
        };
      }
    };

    const initializeTeamOverallStats = (team: string) => {
      if (!teamStatsOverall[team]) {
        teamStatsOverall[team] = {
          team,
          games: 0,
          wins: 0,
          losses: 0,
          winRate: 0,
          results: []
        };
      }
    };

    const initializeTeamSpecificStats = (team: string) => {
      if (!teamStatsSpecific[team]) {
        teamStatsSpecific[team] = {
          team,
          games: 0,
          wins: 0,
          losses: 0,
          winRate: 0,
          results: []
        };
      }
    };
    const initializeMatchStats = (match: string) => {
      if (!gamesStats[match]) {
        gamesStats[match] = {
          match,
          games: 0,
          wins: 0,
          losses: 0,
          winRate: 0,
          results: []
        };
      }
    };
      
    results.forEach(match => {
      const { team_1, team_2, score } = match;
      const [score1, score2] = score;
        
      const team1Players = getPlayers(team_1);
      const team2Players = getPlayers(team_2);
      const team1Overall = team1Players.sort().join(' ');
      const team2Overall = team2Players.sort().join(' ');
      const players = [...team1Players, ...team2Players];
      const teams_overall = [team1Overall, team2Overall];
      const teams_specific = [team_1, team_2];
      const games = [`${team_1} vs ${team_2}`, `${team_2} vs ${team_1}`];
      
      //

      players.forEach(initializePlayerStats);
      players.forEach(player => playerStats[player].games++);      
      
      if (score1 > score2) {
        team1Players.forEach(player =>  {
          playerStats[player].wins++;
          playerStats[player].results.push(1);
        });
        team2Players.forEach(player => {
          playerStats[player].losses++;
          playerStats[player].results.push(-1);
        });
      } else if (score2 > score1) {
        team2Players.forEach(player => {
          playerStats[player].wins++;
          playerStats[player].results.push(1);          
        });
        team1Players.forEach(player => {
          playerStats[player].losses++;
          playerStats[player].results.push(-1);
        });
      }

      Object.values(playerStats).forEach(stats => {
        stats.winRate = (stats.wins / stats.games) * 100;
      });

      //

      teams_overall.forEach(initializeTeamOverallStats);
      teams_overall.forEach(team => teamStatsOverall[team].games++);
      
      if (score1 > score2) {
        teamStatsOverall[team1Overall].wins++;
        teamStatsOverall[team2Overall].losses++;

        teamStatsOverall[team1Overall].results.push(1);
        teamStatsOverall[team2Overall].results.push(-1);
      } else if (score2 > score1) {
        teamStatsOverall[team2Overall].wins++;
        teamStatsOverall[team1Overall].losses++;

        teamStatsOverall[team2Overall].results.push(1);
        teamStatsOverall[team1Overall].results.push(-1);
      }
      
      Object.values(teamStatsOverall).forEach(stats => {
        stats.winRate = (stats.wins / stats.games) * 100;
      });

      //

      teams_specific.forEach(initializeTeamSpecificStats);
      teams_specific.forEach(team => teamStatsSpecific[team].games++);
      
      if (score1 > score2) {
        teamStatsSpecific[team_1].wins++;
        teamStatsSpecific[team_2].losses++;

        teamStatsSpecific[team_1].results.push(1);
        teamStatsSpecific[team_2].results.push(-1);
      } else if (score2 > score1) {
        teamStatsSpecific[team_2].wins++;
        teamStatsSpecific[team_1].losses++;

        teamStatsSpecific[team_2].results.push(1);
        teamStatsSpecific[team_1].results.push(-1);
      }
      
      Object.values(teamStatsSpecific).forEach(stats => {
        stats.winRate = (stats.wins / stats.games) * 100;
      });

      //

      games.forEach(initializeMatchStats);
      games.forEach(game => gamesStats[game].games++);
      const t1vst2 = games[0];
      const t2vst1 = games[1];
      
      if (score1 > score2) {
        gamesStats[t1vst2].wins++;
        gamesStats[t2vst1].losses++;

        gamesStats[t1vst2].results.push(1);
        gamesStats[t2vst1].results.push(-1);
      } else if (score2 > score1) {
        gamesStats[t2vst1].wins++;
        gamesStats[t1vst2].losses++;

        gamesStats[t2vst1].results.push(1);
        gamesStats[t1vst2].results.push(-1);
      }

      Object.values(gamesStats).forEach(stats => {
        stats.winRate = (stats.wins / stats.games) * 100;
      });
    });   
      
    return [Object.values(playerStats), Object.values(teamStatsOverall), Object.values(teamStatsSpecific), Object.values(gamesStats)];
  };

  const SortableTable = <T extends Stats>({ data, title }: SortableTableProps<T>) => {
    const [sortField, setSortField] = useState<keyof T>('winRate');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
    const handleSort = (field: keyof T) => {
      if (sortField === field) {
        setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
      } else {
        setSortField(field);
        setSortDirection('desc');
      }
    };
  
    const sortedData = [...data].sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      
      return 0;
    });
  
    const renderSortIcon = (field: keyof T) => {
      if (sortField !== field) return null;
      return sortDirection === 'asc' ? 
        <ChevronUp className="inline w-4 h-4" /> : 
        <ChevronDown className="inline w-4 h-4" />;
    };
  
    const getHeaderName = (key: string) => {
      switch(key) {
        case 'player':
        case 'team':
        case 'match':
          return key.charAt(0).toUpperCase() + key.slice(1);
        case 'winRate':
          return 'Win Rate';
          case 'results':
            return 'Recent Games';
        default:
          return key.charAt(0).toUpperCase() + key.slice(1);
      }
    };

    if (!data || data.length === 0) {
      return (
        <div className="w-full max-w-4xl mb-8">
          <h2 className="text-2xl font-bold mb-4">{title}</h2>
          <p className="text-gray-50">No data available</p>
        </div>
      );
    }

    const trendMode = (key: string) => (key === 'results' && !showTrends) || (!['results', 'player', 'team', 'match'].includes(key) && showTrends);

    return (
      <div className="w-full max-w-4xl mb-8">
        <h2 className="text-2xl font-bold mb-4">{title}</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-slate-700 shadow-md rounded-lg">
            <thead className="bg-slate-800">
              <tr>
                {Object.keys(data[0]).map((key) => (
                    <th
                    key={key}
                    className={`px-2 py-3 text-sm font-semibold text-gray-50 text-center uppercase tracking-wider cursor-pointer ${trendMode(key) ? 'hidden' : ''} sm:table-cell`}
                    onClick={() => handleSort(key as keyof T)}>
                    {getHeaderName(key)} {renderSortIcon(key as keyof T)}
                    </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {sortedData.map((item, index) => (
                <tr key={index}>
                  {Object.entries(item).map(([key, value]) => (
                    <td key={key} className={`px-2 py-3 text-sm text-gray-50 ${trendMode(key) ? 'hidden' : ''} ${key === 'results' ? 'w-[180px] md:w-[300px] text-right' : ''} sm:table-cell whitespace-nowrap`}>
                      {(() => {
                      switch (key) {
                        case 'results':
                            return (
                              <div className="w-[180px] md:w-[300px] overflow-x-auto whitespace-nowrap scrollbar-hide" style={{ direction: 'rtl' }}>
                              {(value as number[]).map((result, idx) => (
                                result === 1 
                                ? <CircleCheck key={idx} className="inline w-4 h-4 text-green-300 mx-0.5" /> 
                                : <CircleX key={idx} className="inline w-4 h-4 text-red-400 mx-0.5" />
                              ))}
                              </div>
                            );
                        case 'winRate':
                          return `${(value as number).toFixed(1)}%`;
                        default:
                          return value;
                      }
                      })()}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    
    <div className="p-6 space-y-8">
        
    <div className="flex justify-between items-center mb-4 sm:hidden">      
      <button 
        onClick={() => setShowTrend(!showTrends)} 
        className="flex items-center text-gray-50">
        {showTrends ? <ToggleRight className="w-6 h-6 text-green-300" /> : <ToggleLeft className="w-6 h-6 text-amber-400" />}
        <span className="ml-2 text-amber-400">{showTrends ? 'Recent Games' : 'Recent Games'}</span>
      </button>
    </div>

      <SortableTable<PlayerStats> 
        data={playerStats} 
        title="Player Statistics" />   

      <SortableTable<TeamStats> 
        data={teamStatsOverall} 
        title="Team Statistics (Overall)" />

      <SortableTable<TeamStats> 
        data={teamStatsSpecific} 
        title="Team Statistics (Positions)" />

      <SortableTable<MatchStats> 
        data={matchStats} 
        title="Match Statistics" />
    </div>
  );
}

export default App