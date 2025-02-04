import { useEffect, useState } from 'react'
import { ChevronUp, ChevronDown } from 'lucide-react';
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
}

interface TeamStats {
  team: string;
  games: number;
  wins: number;  
  losses: number;
  winRate: number;
}

interface MatchStats {
  match: string;
  games: number;
  wins: number;
  losses: number;
  winRate: number;
}

type Stats = PlayerStats | TeamStats | MatchStats;

interface SortableTableProps<T extends Stats> {
  data: T[];
  title: string;
}

function App() {  
  
  const [playerStats, setPlayerStats] = useState<PlayerStats[]>([]);  
  const [teamStats, setTeamStats] = useState<TeamStats[]>([]);
  const [matchStats, setMatchStats] = useState<MatchStats[]>([]);

  useEffect(() => {

    fetch("https://api.github.com/gists/16fc9291f9b939835ade9494a75de5cb")
      .then(response => response.json())
      .then(data => data["files"]["llabsoof.txt"]["content"])
      .then(data => {
          const results = parseResults(data);
          var [playerStats, teamStats, matchStats] = extractPlayerStats(results);

          setPlayerStats(playerStats);
          setTeamStats(teamStats);
          setMatchStats(matchStats);
        })
        .catch(error => console.error('Error fetching the text file:', error));
  }, []);

  function parseResults(results: string): Match[]  {
    const lines = results.split('\n');

    const matches: Match[] =  lines
    .map(line => line.split(' '))
    .filter(parts => parts.length === 3)
    .map(parts => {
      return {
        team_1: parts[0].toUpperCase(),
        team_2: parts[1].toUpperCase(),
        score: parseScore(parts[2]),
      };
    });

    return matches;
  }
  
  function parseScore(score: string): [number, number] {
    const parts = score.split(':');
    return [+parts[0], +parts[1]];
  }

  const extractPlayerStats = (results: Match[]): [PlayerStats[], TeamStats[], MatchStats[]] => {
    const playerStats: { [key: string]: PlayerStats } = {};
    const teamsStats: { [key: string]: TeamStats } = {};
    const matchesStats: { [key: string]: MatchStats } = {};
      
    const getPlayers = (team: string): string[] => team.split('+');
      
    const initializePlayerStats = (player: string) => {
      if (!playerStats[player]) {
        playerStats[player] = {
          player,
          games: 0,
          wins: 0,
          losses: 0,
          winRate: 0
        };
      }
    };

    const initializeTeamStats = (team: string) => {
      if (!teamsStats[team]) {
        teamsStats[team] = {
          team,
          games: 0,
          wins: 0,
          losses: 0,
          winRate: 0
        };
      }
    };

    const initializeMatchStats = (match: string) => {
      if (!matchesStats[match]) {
        matchesStats[match] = {
          match,
          games: 0,
          wins: 0,
          losses: 0,
          winRate: 0
        };
      }
    };
      
    results.forEach(match => {
      const { team_1, team_2, score } = match;
      const [score1, score2] = score;
        
      const team1Players = getPlayers(team_1);
      const team2Players = getPlayers(team_2);
      const players = [...team1Players, ...team2Players];
      const teams = [team_1, team_2];
      const matchCombinations = [`${team_1} vs ${team_2}`, `${team_2} vs ${team_1}`];
      
      //

      players.forEach(initializePlayerStats);
      players.forEach(player => playerStats[player].games++);      
      
      if (score1 > score2) {
        team1Players.forEach(player => playerStats[player].wins++);
        team2Players.forEach(player => playerStats[player].losses++);
      } else if (score2 > score1) {
        team2Players.forEach(player => playerStats[player].wins++);
        team1Players.forEach(player => playerStats[player].losses++);
      }

      Object.values(playerStats).forEach(stats => {
        stats.winRate = (stats.wins / stats.games) * 100;
      });

      //

      teams.forEach(initializeTeamStats);
      teams.forEach(team => teamsStats[team].games++);
      
      if (score1 > score2) {
        teamsStats[team_1].wins++;
        teamsStats[team_2].losses++;
      } else if (score2 > score1) {
        teamsStats[team_2].wins++;
        teamsStats[team_1].losses++;
      }
      
      Object.values(teamsStats).forEach(stats => {
        stats.winRate = (stats.wins / stats.games) * 100;
      });

      //

      matchCombinations.forEach(initializeMatchStats);
      matchCombinations.forEach(game => matchesStats[game].games++);
      const match1 = matchCombinations[0];
      const match2 = matchCombinations[1];
      
      if (score1 > score2) {
        matchesStats[match1].wins++;
        matchesStats[match2].losses++;
      } else if (score2 > score1) {
        matchesStats[match2].wins++;
        matchesStats[match1].losses++;
      }

      Object.values(matchesStats).forEach(stats => {
        stats.winRate = (stats.wins / stats.games) * 100;
      });
    });   
      
    return [Object.values(playerStats), Object.values(teamsStats), Object.values(matchesStats)];
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
        default:
          return key.charAt(0).toUpperCase() + key.slice(1);
      }
    };
  
    // Add check for empty data
    if (!data || data.length === 0) {
      return (
        <div className="w-full max-w-4xl mb-8">
          <h2 className="text-2xl font-bold mb-4">{title}</h2>
          <p className="text-gray-50">No data available</p>
        </div>
      );
    }
  
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
                    className="px-6 py-3 text-left text-sm font-semibold text-gray-50 uppercase tracking-wider cursor-pointer hover:bg-rose-900"
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
                    <td key={key} className="px-6 py-4 text-sm text-gray-50">
                      {key === 'winRate' ? `${(value as number).toFixed(1)}%` : value}
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
      <SortableTable<PlayerStats> 
        data={playerStats} 
        title="Player Statistics" 
      />
      <SortableTable<TeamStats> 
        data={teamStats} 
        title="Team Statistics" 
      />
      <SortableTable<MatchStats> 
        data={matchStats} 
        title="Match Statistics" 
      />
    </div>
  );
}

export default App