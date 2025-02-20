import React, { useEffect, useRef, useState } from 'react'
import { ChevronUp, ChevronDown, CircleCheck, CircleX, ToggleLeft, ToggleRight } from 'lucide-react';
import { Tooltip, TooltipRefProps } from 'react-tooltip'
import './App.css'

interface Match {
  team_1: string;
  team_2: string;
  date: string;
  score: [number, number];
}

interface Result {
  win: boolean;
  match: Match;
}

interface Stats {
  playerOrTeam: string;
  games: number;
  wins: number;
  losses: number;
  curWinStreak: number;
  curLoseStreak: number;
  winStreak: number;
  loseStreak: number;
  winRate: number;
  results: Result[];
}

interface SortableTableProps<T extends Stats> {
  data: T[];
  title: string;
  statsFor: string;
}

// const testData = `
// 13.01.25
// ah+ws jp+tw 0:1
// tw+ah ws+jp 0:1
// ah+jp tw+ws 1:0

// 14.01.25
// ws+ah jp+tw 1:0
// ah+jp tw+ws 1:0
// tw+ah ws+jp 1:0

// 15.01.25
// ah+jp ws+tw 0:1
// tw+ah jp+ws 0:1
// ah+ws tw+jp 1:0

// 16.01.25
// ah+jp ws+tw 1:0
// tw+ah jp+ws 0:1
// ah+ws tw+jp 1:0

// 17.01.25
// ws+ah jp+tw 1:0
// ah+jp tw+ws 0:1
// ah+tw ws+jp 1:0

// 18.01.25
// ah+jp ws+tw 0:1
// tw+ah jp+ws 1:0
// ws+ah tw+jp 1:0

// 19.01.25
// ah+jp tw+ws 0:1
// ws+ah jp+tw 1:0
// tw+ah jp+ws 0:1

// 20.01.25
// ah+jp sg+ws 0:1
// ws+ah jp+sg 1:0
// sg+ah jp+ws 0:1

// 20.02.25
// sk+ah jp+mr 0:1
// ah+jp mr+sk 1:0
// ah+mr sk+jp 1:0
// `;

function App() {
  const [playerStats, setPlayerStats] = useState<Stats[]>([]);
  const [playerDStats, setPlayerDStats] = useState<Stats[]>([]);
  const [playerOStats, setPlayerOStats] = useState<Stats[]>([]);
  const [teamStatsOverall, setTeamStatsOverall] = useState<Stats[]>([]);
  const [teamStatsSpecific, setTeamStatsSpecific] = useState<Stats[]>([]);
  const [matchStatsOverall, setMatchStatsOverall] = useState<Stats[]>([]);
  const [matchStatsSpecific, setMatchStatsSpecific] = useState<Stats[]>([]);
  const [showTrends, setShowTrend] = useState<boolean>(false);
  const [showAllPlayers, setShowAllPlayers] = useState<boolean>(false);
  const tooltipRef = useRef<TooltipRefProps>(null);

  useEffect(() => {
    // const results = parseResults(testData);
    // const [playerStats, playerDStats, playerOStats, teamStatsOverall, teamStatsSpecific, matchStatsOverall, matchStatsSpecific] = extractStats(results);
    // setPlayerStats(playerStats);
    // setPlayerDStats(playerDStats);
    // setPlayerOStats(playerOStats);
    // setTeamStatsOverall(teamStatsOverall);
    // setTeamStatsSpecific(teamStatsSpecific);
    // setMatchStatsOverall(matchStatsOverall);
    // setMatchStatsSpecific(matchStatsSpecific);

    fetch("https://api.github.com/gists/16fc9291f9b939835ade9494a75de5cb")
      .then(response => response.json())
      .then(data => data["files"]["llabsoof.txt"]["content"])
      .then(data => {
        const results = parseResults(data);
        const [playerStats, playerDStats, playerOStats, teamStatsOverall, teamStatsSpecific, matchStatsOverall, matchStatsSpecific] = extractStats(results);
        setPlayerStats(playerStats);
        setPlayerDStats(playerDStats);
        setPlayerOStats(playerOStats);
        setTeamStatsOverall(teamStatsOverall);
        setTeamStatsSpecific(teamStatsSpecific);
        setMatchStatsOverall(matchStatsOverall);
        setMatchStatsSpecific(matchStatsSpecific);
      })
      .catch(error => console.error('Error fetching the text file:', error));
  }, [showAllPlayers]);

  function parseResults(results: string): Match[] {
    const lines = results.split('\n');
    const matches: Match[] = [];

    let date = 'Unknownd date';
    for (let line of lines) {
      line = line.trim();
      if (line === '') {
        continue;
      }

      const parts = line.split(' ');

      if (parts.length === 1) {
        date = parts[0];
      } else if (parts.length === 3) {
        const scoreParts = parts[2].split(':');

        matches.push({
          team_1: parts[0].replace('+', ' ').toUpperCase(),
          team_2: parts[1].replace('+', ' ').toUpperCase(),
          date: date,
          score: [+scoreParts[0], +scoreParts[1]]
        });
      }
    }

    return matches;
  }

  const trendMode = (key: string) => (key === 'results' && !showTrends) || (!['results', 'playerOrTeam'].includes(key) && showTrends);

  const getPlayerColor = (player: string) => {
    switch (player) {
      case 'AH':
        return 'text-rose-400';
      case 'WS':
        return 'text-cyan-400';
      case 'JP':
        return 'text-yellow-400';
      case 'TW':
        return 'text-lime-400';
      default:
        return 'text-indigo-300';
    }
  }

  const stylePlayers = (value: string) => {
    if (!value) {
      return null;
    }

    const players = value.split(' ');
    return players.map(player => (<span key={player} className={`px-1 ${getPlayerColor(player)}`}>{player}</span>));
  };

  const extractStats = (results: Match[]): [Stats[], Stats[], Stats[], Stats[], Stats[], Stats[], Stats[]] => {
    const playerStats: { [key: string]: Stats } = {};
    const playerDStats: { [key: string]: Stats } = {};
    const playerOStats: { [key: string]: Stats } = {};
    const teamStatsOverall: { [key: string]: Stats } = {};
    const teamStatsSpecific: { [key: string]: Stats } = {};
    const gamesStatsSpecific: { [key: string]: Stats } = {};
    const gamesStatsOverall: { [key: string]: Stats } = {};

    const getPlayers = (team: string): string[] => team.split(' ');

    const initializeStats = (playerOrTeam: string, stats: { [key: string]: Stats }) => {
      if (!stats[playerOrTeam]) {
        stats[playerOrTeam] = {
          playerOrTeam,
          games: 0,
          wins: 0,
          losses: 0,
          curLoseStreak: 0,
          curWinStreak: 0,
          winStreak: 0,
          loseStreak: 0,
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
      const team1Overall = [...team1Players].sort().join(' ');
      const team2Overall = [...team2Players].sort().join(' ');
      const players = [...team1Players, ...team2Players];
      const player1D = team1Players[0];
      const player1O = team1Players[1];
      const player2D = team2Players[0];
      const player2O = team2Players[1];
      const teamsOverall = [team1Overall, team2Overall];
      const teamsSpecific = [team_1, team_2];
      const gamesSpecific = [`${team_1} vs ${team_2}`, `${team_2} vs ${team_1}`];
      const gamesOverall = [`${team1Overall} vs ${team2Overall}`, `${team2Overall} vs ${team1Overall}`];

      if (!showAllPlayers) {
        const corePlayers = ['AH', 'WS', 'JP', 'TW'];
        if (players.some(player => !corePlayers.includes(player))) {
          return;
        }
      }

      //

      players.forEach(player => initializeStats(player, playerStats));
      players.forEach(player => playerStats[player].games++);

      if (score1 > score2) {
        team1Players.forEach(player => {
          playerStats[player].wins++;
          playerStats[player].results.unshift({ win: true, match });
          playerStats[player].curWinStreak++;
          playerStats[player].curLoseStreak = 0;
        });

        team2Players.forEach(player => {
          playerStats[player].losses++;
          playerStats[player].results.unshift({ win: false, match });
          playerStats[player].curLoseStreak++;
          playerStats[player].curWinStreak = 0;
        });
      } else if (score2 > score1) {
        team2Players.forEach(player => {
          playerStats[player].wins++;
          playerStats[player].results.unshift({ win: true, match });
          playerStats[player].curWinStreak++;
          playerStats[player].curLoseStreak = 0;
        });

        team1Players.forEach(player => {
          playerStats[player].losses++;
          playerStats[player].results.unshift({ win: false, match });
          playerStats[player].curLoseStreak++;
          playerStats[player].curWinStreak = 0;
        });
      }

      Object.values(playerStats).forEach(stats => {
        stats.winRate = (stats.wins / stats.games) * 100;
        stats.winStreak = Math.max(stats.winStreak, stats.curWinStreak);
        stats.loseStreak = Math.max(stats.loseStreak, stats.curLoseStreak);
      });

      //

      [player1D, player2D].forEach(player => initializeStats(player, playerDStats));
      [player1D, player2D].forEach(player => playerDStats[player].games++);

      if (score1 > score2) {
        playerDStats[player1D].wins++;
        playerDStats[player1D].results.unshift({ win: true, match });
        playerDStats[player1D].curWinStreak++;
        playerDStats[player1D].curLoseStreak = 0;

        playerDStats[player2D].losses++;
        playerDStats[player2D].results.unshift({ win: false, match });
        playerDStats[player2D].curLoseStreak++;
        playerDStats[player2D].curWinStreak = 0;
      } else if (score2 > score1) {
        playerDStats[player2D].wins++;
        playerDStats[player2D].results.unshift({ win: true, match });
        playerDStats[player2D].curWinStreak++;
        playerDStats[player2D].curLoseStreak = 0;

        playerDStats[player1D].losses++;
        playerDStats[player1D].results.unshift({ win: false, match });
        playerDStats[player1D].curLoseStreak++;
        playerDStats[player1D].curWinStreak = 0;
      }

      Object.values(playerDStats).forEach(stats => {
        stats.winRate = (stats.wins / stats.games) * 100;
        stats.winStreak = Math.max(stats.winStreak, stats.curWinStreak);
        stats.loseStreak = Math.max(stats.loseStreak, stats.curLoseStreak);
      });

      //

      [player1O, player2O].forEach(player => initializeStats(player, playerOStats));
      [player1O, player2O].forEach(player => playerOStats[player].games++);

      if (score1 > score2) {
        playerOStats[player1O].wins++;
        playerOStats[player1O].results.unshift({ win: true, match });
        playerOStats[player1O].curWinStreak++;
        playerOStats[player1O].curLoseStreak = 0;

        playerOStats[player2O].losses++;
        playerOStats[player2O].results.unshift({ win: false, match });
        playerOStats[player2O].curLoseStreak++;
        playerOStats[player2O].curWinStreak = 0;
      } else if (score2 > score1) {
        playerOStats[player2O].wins++;
        playerOStats[player2O].results.unshift({ win: true, match });
        playerOStats[player2O].curWinStreak++;
        playerOStats[player2O].curLoseStreak = 0;

        playerOStats[player1O].losses++;
        playerOStats[player1O].results.unshift({ win: false, match });
        playerOStats[player1O].curLoseStreak++;
        playerOStats[player1O].curWinStreak = 0;
      }

      Object.values(playerOStats).forEach(stats => {
        stats.winRate = (stats.wins / stats.games) * 100;
        stats.winStreak = Math.max(stats.winStreak, stats.curWinStreak);
        stats.loseStreak = Math.max(stats.loseStreak, stats.curLoseStreak);
      });

      //

      teamsOverall.forEach(team => initializeStats(team, teamStatsOverall));
      teamsOverall.forEach(team => teamStatsOverall[team].games++);

      if (score1 > score2) {
        teamStatsOverall[team1Overall].wins++;
        teamStatsOverall[team2Overall].losses++;

        teamStatsOverall[team1Overall].results.unshift({ win: true, match });
        teamStatsOverall[team2Overall].results.unshift({ win: false, match });

        teamStatsOverall[team1Overall].curWinStreak++;
        teamStatsOverall[team1Overall].curLoseStreak = 0;

        teamStatsOverall[team2Overall].curLoseStreak++;
        teamStatsOverall[team2Overall].curWinStreak = 0;
      } else if (score2 > score1) {
        teamStatsOverall[team2Overall].wins++;
        teamStatsOverall[team1Overall].losses++;

        teamStatsOverall[team2Overall].results.unshift({ win: true, match });
        teamStatsOverall[team1Overall].results.unshift({ win: false, match });

        teamStatsOverall[team2Overall].curWinStreak++;
        teamStatsOverall[team2Overall].curLoseStreak = 0;

        teamStatsOverall[team1Overall].curLoseStreak++;
        teamStatsOverall[team1Overall].curWinStreak = 0;
      }

      Object.values(teamStatsOverall).forEach(stats => {
        stats.winRate = (stats.wins / stats.games) * 100;
        stats.winStreak = Math.max(stats.winStreak, stats.curWinStreak);
        stats.loseStreak = Math.max(stats.loseStreak, stats.curLoseStreak);
      });

      //

      teamsSpecific.forEach(team => initializeStats(team, teamStatsSpecific));
      teamsSpecific.forEach(team => teamStatsSpecific[team].games++);

      if (score1 > score2) {
        teamStatsSpecific[team_1].wins++;
        teamStatsSpecific[team_2].losses++;

        teamStatsSpecific[team_1].results.unshift({ win: true, match });
        teamStatsSpecific[team_2].results.unshift({ win: false, match });

        teamStatsSpecific[team_1].curWinStreak++;
        teamStatsSpecific[team_1].curLoseStreak = 0;

        teamStatsSpecific[team_2].curLoseStreak++;
        teamStatsSpecific[team_2].curWinStreak = 0;

      } else if (score2 > score1) {
        teamStatsSpecific[team_2].wins++;
        teamStatsSpecific[team_1].losses++;

        teamStatsSpecific[team_2].results.unshift({ win: true, match });
        teamStatsSpecific[team_1].results.unshift({ win: false, match });

        teamStatsSpecific[team_2].curWinStreak++;
        teamStatsSpecific[team_2].curLoseStreak = 0;

        teamStatsSpecific[team_1].curLoseStreak++;
        teamStatsSpecific[team_1].curWinStreak = 0;
      }

      Object.values(teamStatsSpecific).forEach(stats => {
        stats.winRate = (stats.wins / stats.games) * 100;
        stats.winStreak = Math.max(stats.winStreak, stats.curWinStreak);
        stats.loseStreak = Math.max(stats.loseStreak, stats.curLoseStreak);
      });

      //

      gamesSpecific.forEach(game => initializeStats(game, gamesStatsSpecific));
      gamesSpecific.forEach(game => gamesStatsSpecific[game].games++);
      const t1vst2 = gamesSpecific[0];
      const t2vst1 = gamesSpecific[1];

      if (score1 > score2) {
        gamesStatsSpecific[t1vst2].wins++;
        gamesStatsSpecific[t2vst1].losses++;

        gamesStatsSpecific[t1vst2].results.unshift({ win: true, match });
        gamesStatsSpecific[t2vst1].results.unshift({ win: false, match });

        gamesStatsSpecific[t1vst2].curWinStreak++;
        gamesStatsSpecific[t1vst2].curLoseStreak = 0;

        gamesStatsSpecific[t2vst1].curLoseStreak++;
        gamesStatsSpecific[t2vst1].curWinStreak = 0;
      } else if (score2 > score1) {
        gamesStatsSpecific[t2vst1].wins++;
        gamesStatsSpecific[t1vst2].losses++;

        gamesStatsSpecific[t2vst1].results.unshift({ win: true, match });
        gamesStatsSpecific[t1vst2].results.unshift({ win: false, match });

        gamesStatsSpecific[t2vst1].curWinStreak++;
        gamesStatsSpecific[t2vst1].curLoseStreak = 0;

        gamesStatsSpecific[t1vst2].curLoseStreak++;
        gamesStatsSpecific[t1vst2].curWinStreak = 0;
      }

      Object.values(gamesStatsSpecific).forEach(stats => {
        stats.winRate = (stats.wins / stats.games) * 100;
        stats.winStreak = Math.max(stats.winStreak, stats.curWinStreak);
        stats.loseStreak = Math.max(stats.loseStreak, stats.curLoseStreak);
      });

      //

      gamesOverall.forEach(game => initializeStats(game, gamesStatsOverall));
      gamesOverall.forEach(game => gamesStatsOverall[game].games++);
      const t1vst2Overall = gamesOverall[0];
      const t2vst1Overall = gamesOverall[1];

      if (score1 > score2) {
        gamesStatsOverall[t1vst2Overall].wins++;
        gamesStatsOverall[t2vst1Overall].losses++;

        gamesStatsOverall[t1vst2Overall].results.unshift({ win: true, match });
        gamesStatsOverall[t2vst1Overall].results.unshift({ win: false, match });

        gamesStatsOverall[t1vst2Overall].curWinStreak++;
        gamesStatsOverall[t1vst2Overall].curLoseStreak = 0;

        gamesStatsOverall[t2vst1Overall].curLoseStreak++;
        gamesStatsOverall[t2vst1Overall].curWinStreak = 0;
      } else if (score2 > score1) {
        gamesStatsOverall[t2vst1Overall].wins++;
        gamesStatsOverall[t1vst2Overall].losses++;

        gamesStatsOverall[t2vst1Overall].results.unshift({ win: true, match });
        gamesStatsOverall[t1vst2Overall].results.unshift({ win: false, match });

        gamesStatsOverall[t2vst1Overall].curWinStreak++;
        gamesStatsOverall[t2vst1Overall].curLoseStreak = 0;

        gamesStatsOverall[t1vst2Overall].curLoseStreak++;
        gamesStatsOverall[t1vst2Overall].curWinStreak = 0;
      }

      Object.values(gamesStatsOverall).forEach(stats => {
        stats.winRate = (stats.wins / stats.games) * 100;
        stats.winStreak = Math.max(stats.winStreak, stats.curWinStreak);
        stats.loseStreak = Math.max(stats.loseStreak, stats.curLoseStreak);
      });
    });

    return [
      Object.values(playerStats),
      Object.values(playerDStats),
      Object.values(playerOStats),
      Object.values(teamStatsOverall),
      Object.values(teamStatsSpecific),
      Object.values(gamesStatsOverall),
      Object.values(gamesStatsSpecific)];
  };

  const SortableTable = <T extends Stats>({ data, title, statsFor }: SortableTableProps<T>) => {
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
      switch (key) {
        case 'playerOrTeam':
          return statsFor;
        case 'winRate':
          return 'Win Rate';
        case 'winStreak':
          return 'W. Streak';
        case 'loseStreak':
          return 'L. Streak';
        case 'results':
          return 'Results';
        default:
          return key.charAt(0).toUpperCase() + key.slice(1);
      }
    };

    if (!data || data.length === 0) {
      return (
        <div className="w-full max-w-5xl mb-8">
          <h2 className="text-2xl font-bold mb-4">{title}</h2>
          <p className="text-gray-50">No data available</p>
        </div>
      );
    }

    const handleScroll = (e: React.MouseEvent<HTMLDivElement>) => {
      tooltipRef.current?.close();

      const div = e.currentTarget;
      const startX = e.pageX - div.offsetLeft;
      const scrollLeft = div.scrollLeft;

      const onMouseMove = (e: MouseEvent) => {
        const x = e.pageX - div.offsetLeft;
        const walk = (x - startX) * 1;
        div.scrollLeft = scrollLeft - walk;

        tooltipRef.current?.close();
      };

      const onMouseUp = () => {
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
      };

      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    };

    const getTooltipData = (stats: Stats, result: Result) => {
      let players = stats.playerOrTeam.split(' ').map(player => player.trim());
      players = players.slice(0, players.length / 2 + 1);

      const match = players.some(p => result.match.team_1.includes(p))
        ? `${result.match.team_1} vs ${result.match.team_2}`
        : `${result.match.team_2} vs ${result.match.team_1}`;
      return `${result.match.date}|${match}`;
    }

    return (
      <div className="w-full max-w-5xl mb-8">
        <h2 className="text-2xl font-bold mb-4">{title}</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-slate-700 shadow-md rounded-lg">
            <thead className="bg-slate-800">
              <tr>
                {Object.keys(data[0]).filter(key => key !== 'curWinStreak' && key !== 'curLoseStreak').map((key) => (
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
                  {Object.entries(item).filter(([key]) => key !== 'curWinStreak' && key !== 'curLoseStreak').map(([key, value]) => (
                    <td key={key} className={`px-2 py-3 text-sm text-gray-50 text-center relative ${trendMode(key) ? 'hidden' : ''} ${key === 'results' ? 'w-[180px] md:w-[300px] text-right' : ''} sm:table-cell whitespace-nowrap`}>
                      {(() => {
                        switch (key) {
                          case 'playerOrTeam':
                            return stylePlayers(value);
                          case 'results':
                            return (
                              <div className="w-[180px] md:w-[300px] overflow-x-auto whitespace-nowrap scrollbar-hide" style={{ direction: 'rtl' }} onMouseDown={handleScroll}>
                                {(value as Result[]).map((result, idx) => (
                                  <span key={idx} className="cursor-default" data-tooltip-id="my-tooltip" data-tooltip-content={getTooltipData(item, result)}>
                                    {result.win
                                      ? <CircleCheck className="inline w-4 h-4 text-green-300 mx-0.5" />
                                      : <CircleX className="inline w-4 h-4 text-red-400 mx-0.5" />}
                                  </span>
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

  const Toggle = ({ title, className, value, callback }: { title: string, value: boolean, className?: string, callback: (newVal: boolean) => void }) => {
    return (<div className={`flex justify-between items-center mb-4 ${className}`}>
      <button
        onClick={() => callback(!value)}
        className="flex items-center text-gray-50">
        {value ? <ToggleRight className="w-6 h-6 text-green-300" /> : <ToggleLeft className="w-6 h-6 text-amber-400" />}
        <span className={`ml-2 ${value ? 'text-green-300' : 'text-amber-400'}`}>{title}</span>
      </button>
    </div>);
  }

  return (

    <div className="p-6 space-y-8">

      <Toggle title='Show trends' value={showTrends} className='sm:hidden' callback={(newVal) => setShowTrend(newVal)} />

      <Toggle title='Show all players' value={showAllPlayers} callback={(newVal) => setShowAllPlayers(newVal)} />

      <SortableTable<Stats>
        data={playerStats}
        title="Player Statistics"
        statsFor="Player" />

      <SortableTable<Stats>
        data={playerDStats}
        title="Player Statistics (Defence)"
        statsFor="Player" />

      <SortableTable<Stats>
        data={playerOStats}
        title="Player Statistics (Offence)"
        statsFor="Player" />

      <SortableTable<Stats>
        data={teamStatsOverall}
        title="Team Statistics (Overall)"
        statsFor="Team" />

      <SortableTable<Stats>
        data={teamStatsSpecific}
        title="Team Statistics (Defence Offence)"
        statsFor="Team" />

      <SortableTable<Stats>
        data={matchStatsOverall}
        title="Match Statistics (Overall)"
        statsFor="Match" />

      <SortableTable<Stats>
        data={matchStatsSpecific}
        title="Match Statistics (Defence Offence)"
        statsFor="Match" />

      <Tooltip id="my-tooltip" delayShow={300} ref={tooltipRef} style={{ backgroundColor: "oklch(.279 .041 260.031)", color: "#222" }} opacity={1} render={({ content }) => {

        if (!content) {
          return null;
        }

        const parts = content?.split('|')!;
        const date = parts[0];
        const teams = parts[1];
        return (<div>
          <div className="text-gray-200 text-center">{date}</div>
          {stylePlayers(teams)}
        </div>);
      }} />
    </div>
  );
}

export default App