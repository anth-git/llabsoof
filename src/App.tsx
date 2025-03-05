import React, { useEffect, useRef, useState } from 'react'
import { ChevronUp, ChevronDown, CircleCheck, CircleX, ToggleLeft, ToggleRight } from 'lucide-react';
import { Tooltip, TooltipRefProps } from 'react-tooltip'
import './App.css'
import { LineChart } from '@mui/x-charts/LineChart';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { ChartsLegend, LineSeriesType } from '@mui/x-charts';
import { MakeOptional } from '@mui/x-charts/internals';
import { SeriesLegendItemContext } from '@mui/x-charts/ChartsLegend/chartsLegend.types';

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

interface TrendPoint {
  date: string;
  game: number;
  [key: string]: number | string;
};

interface Trends {
  playerTrend: TrendPoint[];
  playerOffenseTrend: TrendPoint[];
  playerDefenseTrend: TrendPoint[];
  players: string[];
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

interface PlayersColors {
  [key: string]: PlayerColor;
}

interface PlayerColor {
  tailwind: string;
  color: string;
}

interface SortableTableProps<T extends Stats> {
  data: T[];
  title: string;
  statsFor: string;
}

const playersColors: PlayersColors = {
  'AH': { tailwind: 'text-rose-400', color: 'oklch(0.712 0.194 13.428)' },
  'WS': { tailwind: 'text-cyan-400', color: 'oklch(0.789 0.154 211.53)' },
  'JP': { tailwind: 'text-yellow-400', color: 'oklch(0.852 0.199 91.936)' },
  'TW': { tailwind: 'text-violet-400', color: 'oklch(.606 .25 292.717)' },
  'others': { tailwind: 'text-lime-600', color: 'oklch(0.648 0.2 131.684)' },
  'vs': { tailwind: 'text-gray-50', color: 'oklch(0.5 0.5 0)' },
}

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
  },
});

const fetchData = (debug: boolean = false) => {
  if (debug) {
    return Promise.resolve(testData);
  }

  return fetch("https://api.github.com/gists/16fc9291f9b939835ade9494a75de5cb")
    .then(response => response.json())
    .then(data => data["files"]["llabsoof.txt"]["content"])
}

function App() {
  const [playerStats, setPlayerStats] = useState<Stats[]>([]);
  const [playerDefenseStats, setPlayerDefenseStats] = useState<Stats[]>([]);
  const [playerOffenseStats, setPlayerOffenseStats] = useState<Stats[]>([]);
  const [teamStatsOverall, setTeamStatsOverall] = useState<Stats[]>([]);
  const [teamStatsSpecific, setTeamStatsSpecific] = useState<Stats[]>([]);
  const [matchStatsOverall, setMatchStatsOverall] = useState<Stats[]>([]);
  const [matchStatsSpecific, setMatchStatsSpecific] = useState<Stats[]>([]);
  const [showResults, setShowResults] = useState<boolean>(false);
  const [showPerformanceTrends, setShowPerformanceTrends] = useState<boolean>(true);
  const [showAllPlayers, setShowAllPlayers] = useState<boolean>(false);
  const [hiddenPerformanceSeries, setHiddenPerformanceSeries] = useState<string[]>([]);
  const [hiddenDefensePerformanceSeries, setHiddenDefensePerformanceSeries] = useState<string[]>([]);
  const [hiddenOffensePerformanceSeries, setHiddenOffensePerformanceSeries] = useState<string[]>([]);
  const [playersPerformance, setPlayerPerformance] = useState<Trends>({
    playerTrend: [],
    playerOffenseTrend: [],
    playerDefenseTrend: [],
    players: []
  });

  const tooltipRef = useRef<TooltipRefProps>(null);

  useEffect(() => {

    fetchData().then(data => {
      const results = parseResults(data);
      const [playerStats, playerDefenseStats, playerOffenseStats, teamStatsOverall, teamStatsSpecific, matchStatsOverall, matchStatsSpecific, trends] = extractStats(results);
      setPlayerStats(playerStats);
      setPlayerDefenseStats(playerDefenseStats);
      setPlayerOffenseStats(playerOffenseStats);
      setTeamStatsOverall(teamStatsOverall);
      setTeamStatsSpecific(teamStatsSpecific);
      setMatchStatsOverall(matchStatsOverall);
      setMatchStatsSpecific(matchStatsSpecific);
      setPlayerPerformance(trends);

      const requestedPlayers = window.location.pathname
        .replace('llabsoof', '')
        .split(/\/|,/)
        .filter(player => player !== '')
        .map(player => player.toUpperCase());

      const hiddenPlayers: string[] = requestedPlayers.length > 0
        ? trends.players.filter(player => !requestedPlayers.includes(player.replace('_wr', '')))
        : trends.players.filter(player => player.includes('_wr'));

      setHiddenPerformanceSeries(hiddenPlayers);
      setHiddenDefensePerformanceSeries(hiddenPlayers);
      setHiddenOffensePerformanceSeries(hiddenPlayers);
    })
      .catch(error => console.error('Error fetching the text file:', error));

  }, [showAllPlayers]);

  function parseResults(results: string): Match[] {
    const lines = results.split('\n');
    const matches: Match[] = [];

    let date = 'Unknown date';
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

  const hideColumnInMobile = (key: string) => (key === 'results' && !showResults) || (!['results', 'playerOrTeam'].includes(key) && showResults);

  const getPlayerColor = (player: string, forChart: boolean = false, hidden: boolean = false) => {
    const key = player.replace('_wr', '');
    const playerColor = playersColors[key] ?? playersColors['others'];
    if (!forChart) {
      return playerColor['tailwind']
    }

    const color = !hidden
      ? playerColor['color']
      : playerColor['color'].replace(')', '/ 0.3)');
    return color;
  }

  const stylePlayers = (value: string) => {
    if (!value) {
      return null;
    }

    const players = value.split(' ');
    return players.map(player => (<span key={player} className={`px-1 ${getPlayerColor(player)}`}>{player}</span>));
  };

  const extractStats = (results: Match[]): [Stats[], Stats[], Stats[], Stats[], Stats[], Stats[], Stats[], Trends] => {
    const playerStats: { [key: string]: Stats } = {};
    const playerDefenseStats: { [key: string]: Stats } = {};
    const playerOffenseStats: { [key: string]: Stats } = {};
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

    const trends: Trends = {
      playerTrend: [],
      playerOffenseTrend: [],
      playerDefenseTrend: [],
      players: []
    };

    const corePlayers = ['AH', 'WS', 'JP', 'TW'];
    const allPlayers = new Set<string>();

    const weight = 0.05;
    const oddWeights = Array.from({ length: 15 }, (_, i) => (1 + 7 * weight) - i * weight);
    const evenWeights = oddWeights.filter(w => w != 1)

    results.forEach((match, gameNo) => {
      const { team_1, team_2, score } = match;
      const [score1, score2] = score;

      const team1Players = getPlayers(team_1);
      const team2Players = getPlayers(team_2);
      const team1Overall = [...team1Players].sort().join(' ');
      const team2Overall = [...team2Players].sort().join(' ');
      const players = [...team1Players, ...team2Players];
      const player1Defense = team1Players[0];
      const player1Offense = team1Players[1];
      const player2Defense = team2Players[0];
      const player2Offense = team2Players[1];
      const teamsOverall = [team1Overall, team2Overall];
      const teamsSpecific = [team_1, team_2];
      const gamesSpecific = [`${team_1} vs ${team_2}`, `${team_2} vs ${team_1}`];
      const gamesOverall = [`${team1Overall} vs ${team2Overall}`, `${team2Overall} vs ${team1Overall}`];

      const everyThirdGame = gameNo % 3 === 2;

      if (!showAllPlayers) {
        const matchFeaturedNotCorePlayer = players.some(player => !corePlayers.includes(player));
        if (matchFeaturedNotCorePlayer) {
          return;
        }
      }

      //

      const playerTrendPoint: TrendPoint = { game: gameNo, date: match.date + gameNo };

      players.forEach(player => {
        initializeStats(player, playerStats);
        playerStats[player].games++;
        playerTrendPoint[player] = 0;
        allPlayers.add(player);
        allPlayers.add(player + '_wr');
      });

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

        const games = stats.results.slice(0, 15);
        const weights = games.length % 2 === 0 ? evenWeights : oddWeights;
        const offset = (weights.length - games.length) / 2;
        const performance = games.reduce((sum, game, i) => {
          return sum + (game.win ? 1 : 0) * weights[i + offset];
        }, 0);

        playerTrendPoint[stats.playerOrTeam] = performance / games.length * 100;
        playerTrendPoint[`${stats.playerOrTeam}_wr`] = stats.winRate;
      });

      if (everyThirdGame) {
        trends.playerTrend.push(playerTrendPoint);
      }

      //
      const playerDefenseTrendPoint: TrendPoint = { game: gameNo, date: match.date + gameNo };

      [player1Defense, player2Defense].forEach(player => initializeStats(player, playerDefenseStats));
      [player1Defense, player2Defense].forEach(player => {
        playerDefenseStats[player].games++;
        playerDefenseTrendPoint[player] = 0;
      });

      if (score1 > score2) {
        playerDefenseStats[player1Defense].wins++;
        playerDefenseStats[player1Defense].results.unshift({ win: true, match });
        playerDefenseStats[player1Defense].curWinStreak++;
        playerDefenseStats[player1Defense].curLoseStreak = 0;

        playerDefenseStats[player2Defense].losses++;
        playerDefenseStats[player2Defense].results.unshift({ win: false, match });
        playerDefenseStats[player2Defense].curLoseStreak++;
        playerDefenseStats[player2Defense].curWinStreak = 0;
      } else if (score2 > score1) {
        playerDefenseStats[player2Defense].wins++;
        playerDefenseStats[player2Defense].results.unshift({ win: true, match });
        playerDefenseStats[player2Defense].curWinStreak++;
        playerDefenseStats[player2Defense].curLoseStreak = 0;

        playerDefenseStats[player1Defense].losses++;
        playerDefenseStats[player1Defense].results.unshift({ win: false, match });
        playerDefenseStats[player1Defense].curLoseStreak++;
        playerDefenseStats[player1Defense].curWinStreak = 0;
      }

      Object.values(playerDefenseStats).forEach(stats => {
        stats.winRate = (stats.wins / stats.games) * 100;
        stats.winStreak = Math.max(stats.winStreak, stats.curWinStreak);
        stats.loseStreak = Math.max(stats.loseStreak, stats.curLoseStreak);

        const games = stats.results.slice(0, 15);
        const weights = games.length % 2 === 0 ? evenWeights : oddWeights;
        const offset = (weights.length - games.length) / 2;
        const performance = games.reduce((sum, game, i) => {
          return sum + (game.win ? 1 : 0) * weights[i + offset];
        }, 0);

        playerDefenseTrendPoint[stats.playerOrTeam] = performance / games.length * 100;
        playerDefenseTrendPoint[`${stats.playerOrTeam}_wr`] = stats.winRate;
      });

      if (everyThirdGame) {
        trends.playerDefenseTrend.push(playerDefenseTrendPoint);
      }

      //
      const playerOffenseTrendPoint: TrendPoint = { game: gameNo, date: match.date + gameNo };

      [player1Offense, player2Offense].forEach(player => initializeStats(player, playerOffenseStats));
      [player1Offense, player2Offense].forEach(player => {
        playerOffenseStats[player].games++;
        playerOffenseTrendPoint[player] = 0;
      });

      if (score1 > score2) {
        playerOffenseStats[player1Offense].wins++;
        playerOffenseStats[player1Offense].results.unshift({ win: true, match });
        playerOffenseStats[player1Offense].curWinStreak++;
        playerOffenseStats[player1Offense].curLoseStreak = 0;

        playerOffenseStats[player2Offense].losses++;
        playerOffenseStats[player2Offense].results.unshift({ win: false, match });
        playerOffenseStats[player2Offense].curLoseStreak++;
        playerOffenseStats[player2Offense].curWinStreak = 0;
      } else if (score2 > score1) {
        playerOffenseStats[player2Offense].wins++;
        playerOffenseStats[player2Offense].results.unshift({ win: true, match });
        playerOffenseStats[player2Offense].curWinStreak++;
        playerOffenseStats[player2Offense].curLoseStreak = 0;

        playerOffenseStats[player1Offense].losses++;
        playerOffenseStats[player1Offense].results.unshift({ win: false, match });
        playerOffenseStats[player1Offense].curLoseStreak++;
        playerOffenseStats[player1Offense].curWinStreak = 0;
      }

      Object.values(playerOffenseStats).forEach(stats => {
        stats.winRate = (stats.wins / stats.games) * 100;
        stats.winStreak = Math.max(stats.winStreak, stats.curWinStreak);
        stats.loseStreak = Math.max(stats.loseStreak, stats.curLoseStreak);

        const games = stats.results.slice(0, 15);
        const weights = games.length % 2 === 0 ? evenWeights : oddWeights;
        const offset = (weights.length - games.length) / 2;
        const performance = games.reduce((sum, game, i) => {
          return sum + (game.win ? 1 : 0) * weights[i + offset];
        }, 0);

        playerOffenseTrendPoint[stats.playerOrTeam] = performance / games.length * 100;
        playerOffenseTrendPoint[`${stats.playerOrTeam}_wr`] = stats.winRate;
      });

      if (everyThirdGame) {
        trends.playerOffenseTrend.push(playerOffenseTrendPoint);
      }

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

    trends.players = [...allPlayers].sort();

    return [
      Object.values(playerStats),
      Object.values(playerDefenseStats),
      Object.values(playerOffenseStats),
      Object.values(teamStatsOverall),
      Object.values(teamStatsSpecific),
      Object.values(gamesStatsOverall),
      Object.values(gamesStatsSpecific),
      trends];
  };

  const TrendChart = ({ title, trend, players, tooltip, hiddenSeries, updateHiddenSeries }: { title: string, tooltip?: string, trend: TrendPoint[], players: string[], hiddenSeries: string[], updateHiddenSeries: (series: string[]) => void }) => {

    const series: MakeOptional<LineSeriesType, 'type'>[] = players.map(player => ({
      id: player,
      label: player,
      dataKey: player,
      showMark: false,
      curve: "natural",
      color: getPlayerColor(player, true, hiddenSeries.includes(player)),
      disableHighlight: hiddenSeries.includes(player),
      valueFormatter: (value: number | null) => `${Math.round(value ?? 0)}%`,
    }));

    const sx = players.map(player => ({
      [`& .MuiLineElement-series-${player}_wr`]: {
        strokeDasharray: '10 5',
      },
      [`& .MuiLineElement-series-${player}`]: {
        display: hiddenSeries.includes(player) ? 'none' : 'initial',
      }
    }));

    const clickHandler = (event: React.MouseEvent<SVGRectElement, MouseEvent>, context: SeriesLegendItemContext, index: number) => {
      const seriesKey: string = context.seriesId as string;
      let newHiddenSeries = [...hiddenSeries];

      if (newHiddenSeries.includes(seriesKey)) {
        newHiddenSeries = newHiddenSeries.filter(player => player !== seriesKey);
      } else {
        newHiddenSeries.push(seriesKey);
      }

      updateHiddenSeries(newHiddenSeries);
    };

    const QuickSwitch = () => {
      return (<div className="flex space-x-2 cursor-pointer mb-0 select-none">
        <span>Presets:</span>
        <span className="text-lime-400" onClick={() => { updateHiddenSeries(players.filter(player => player.includes('_wr'))) }}>Perf</span>
        <span className="text-green-400" onClick={() => { updateHiddenSeries(players.filter(player => !player.includes('_wr'))) }}>Win_Rate</span>
        <span className={`${getPlayerColor('AH')}`} onClick={() => { updateHiddenSeries(players.filter(player => !player.includes('AH'))) }}>AH</span>
        <span className={`${getPlayerColor('JP')}`} onClick={() => { updateHiddenSeries(players.filter(player => !player.includes('JP'))) }}>JP</span>
        <span className={`${getPlayerColor('TW')}`} onClick={() => { updateHiddenSeries(players.filter(player => !player.includes('TW'))) }}>TW</span>
        <span className={`${getPlayerColor('WS')}`} onClick={() => { updateHiddenSeries(players.filter(player => !player.includes('WS'))) }}>WS</span>
      </div>);
    }

    return (
      <>
        <div className="w-fit mb-1 relative">
          <h2 className="text-2xl font-bold" data-tooltip-id="performance-tooltip" data-tooltip-content={tooltip ?? title}>{title}</h2>
        </div>

        <QuickSwitch />
        <LineChart
          dataset={trend}
          xAxis={[
            {
              id: 'Games',
              dataKey: 'date',
              scaleType: 'point',
              valueFormatter: (date: string) => date.substring(0, 10)
            },
          ]}
          yAxis={[{
            min: 0,
            max: 100,
          }]}
          series={series}
          width={1130}
          height={500}
          sx={sx}
          skipAnimation={true}
          slotProps={{
            legend: {
              onItemClick: clickHandler
            },
          }}>

        </LineChart>
      </>
    );
  }

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
        <div className="w-full max-w-6xl mb-8">
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
      <div className="w-full max-w-6xl mb-8">
        <h2 className="text-2xl font-bold mb-4">{title}</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-slate-700 shadow-md rounded-lg">
            <thead className="bg-slate-800">
              <tr>
                {Object.keys(data[0]).filter(key => key !== 'curWinStreak' && key !== 'curLoseStreak').map((key) => (
                  <th
                    key={key}
                    className={`px-2 py-3 text-sm font-semibold text-gray-50 text-center uppercase tracking-wider cursor-pointer ${hideColumnInMobile(key) ? 'hidden' : ''} sm:table-cell`}
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
                    <td key={key} className={`px-2 py-3 text-sm text-gray-50 text-center relative ${hideColumnInMobile(key) ? 'hidden' : ''} ${key === 'results' ? 'w-[180px] md:w-[500px] text-right' : ''} sm:table-cell whitespace-nowrap`}>
                      {(() => {
                        switch (key) {
                          case 'playerOrTeam':
                            return stylePlayers(value);
                          case 'results':
                            return (
                              <div className="w-[180px] md:w-[500px] overflow-x-auto whitespace-nowrap scrollbar-hide" style={{ direction: 'rtl' }} onMouseDown={handleScroll}>
                                {(value as Result[]).map((result, idx) => (
                                  <span key={idx} className="cursor-default" data-tooltip-id="results-tooltip" data-tooltip-content={getTooltipData(item, result)}>
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

  const renderResultsTooltip = ({ content }: { content: string | null }) => {
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
  }

  const Toggle = ({ title, className, value, callback }: { title: string, value: boolean, className?: string, callback: (newVal: boolean) => void }) => {
    return (<div className={`flex justify-between items-center mb-4 ${className}`}>
      <button
        onClick={() => callback(!value)}
        className="flex items-center text-gray-50">
        {value ? <ToggleRight className="w-6 h-6 text-green-300" /> : <ToggleLeft className="w-6 h-6 text-pink-400" />}
        <span className={`ml-2 ${value ? 'text-green-300' : 'text-pink-400'}`}>{title}</span>
      </button>
    </div>);
  }

  return (
    <ThemeProvider theme={darkTheme}>
      <div className="p-6 space-y-8">

        <div className="flex space-x-5 mb-2">
          <Toggle title='Show results' value={showResults} className='sm:hidden' callback={(newVal) => setShowResults(newVal)} />

          <Toggle title='Show performance trends' value={showPerformanceTrends} callback={(newVal) => setShowPerformanceTrends(newVal)} />

          <Toggle title='Show all players' value={showAllPlayers} callback={(newVal) => setShowAllPlayers(newVal)} />
        </div>

        {showPerformanceTrends && <>
          <TrendChart title='Performance Trend' tooltip='Solid line: Weighted Win Rate over 15 games | Dashed line (_wr): Win Rate so far' trend={playersPerformance.playerTrend} players={playersPerformance.players} hiddenSeries={hiddenPerformanceSeries} updateHiddenSeries={setHiddenPerformanceSeries} />
          <TrendChart title='Performance Trend (Defense)' trend={playersPerformance.playerDefenseTrend} players={playersPerformance.players} hiddenSeries={hiddenDefensePerformanceSeries} updateHiddenSeries={setHiddenDefensePerformanceSeries} />
          <TrendChart title='Performance Trend (Offense)' trend={playersPerformance.playerOffenseTrend} players={playersPerformance.players} hiddenSeries={hiddenOffensePerformanceSeries} updateHiddenSeries={setHiddenOffensePerformanceSeries} />
        </>}

        <SortableTable<Stats>
          data={playerStats}
          title="Player Statistics"
          statsFor="Player" />

        <SortableTable<Stats>
          data={playerDefenseStats}
          title="Player Statistics (Defense)"
          statsFor="Player" />

        <SortableTable<Stats>
          data={playerOffenseStats}
          title="Player Statistics (Offense)"
          statsFor="Player" />

        <SortableTable<Stats>
          data={teamStatsOverall}
          title="Team Statistics (Overall)"
          statsFor="Team" />

        <SortableTable<Stats>
          data={teamStatsSpecific}
          title="Team Statistics (Defense Offense)"
          statsFor="Team" />

        <SortableTable<Stats>
          data={matchStatsOverall}
          title="Match Statistics (Overall)"
          statsFor="Match" />

        <SortableTable<Stats>
          data={matchStatsSpecific}
          title="Match Statistics (Defense Offense)"
          statsFor="Match" />

        <Tooltip id="results-tooltip" delayShow={300} ref={tooltipRef} style={{ backgroundColor: "oklch(.279 .041 260.031)", color: "#222" }} opacity={1} render={renderResultsTooltip} />
        <Tooltip id="performance-tooltip" style={{ backgroundColor: "oklch(.609 .126 221.723)", color: "white" }} opacity={1} />
      </div>
    </ThemeProvider>
  );
}

export default App


const testData = `
13.01.2025
ah+ws jp+tw 0:1
tw+ah ws+jp 0:1
ah+jp tw+ws 1:0

15.01.2025
ws+ah jp+tw 1:0
ah+jp tw+ws 1:0
tw+ah ws+jp 1:0

17.01.2025
ah+jp ws+tw 0:1
tw+ah jp+ws 0:1
ah+ws tw+jp 1:0

27.01.2025
ah+jp ws+tw 1:0
tw+ah jp+ws 0:1
ah+ws tw+jp 1:0

28.01.2025
ws+ah jp+tw 1:0
ah+jp tw+ws 0:1
ah+tw ws+jp 1:0

29.01.2025
ah+jp ws+tw 0:1
tw+ah jp+ws 1:0
ws+ah tw+jp 1:0

30.01.2025
ah+jp tw+ws 0:1
ws+ah jp+tw 1:0
tw+ah jp+ws 0:1

31.01.2025
ah+ws jp+tw 0:1
tw+ah ws+jp 1:0
ah+jp tw+ws 0:1

03.02.2025
ah+tw ws+jp 0:1
jp+ah tw+ws 1:0
ah+ws jp+tw 0:1

05.02.2025
ws+ah jp+tw 1:0
ah+jp tw+ws 1:0
ah+tw ws+jp 0:1

07.02.2025
ws+ah jp+tw 0:1
ah+jp tw+ws 0:1
tw+ah ws+jp 0:1

10.02.2025
jp+ah ws+tw 1:0
ah+ws jp+tw 1:0
tw+ah ws+jp 0:1

12.02.2025
jp+ah tw+ws 0:1
ah+tw ws+jp 0:1
ws+ah jp+tw 1:0

19.02.2025
ws+ah jp+tw 0:1
ah+jp tw+ws 1:0
ah+tw ws+jp 1:0

20.02.2025
sk+ah jp+mr 0:1
ah+jp mr+sk 1:0
ah+mr sk+jp 1:0

21.02.2025
ws+ah jp+tw 0:1
ah+jp ws+tw 0:1
tw+ah ws+jp 1:0
`;