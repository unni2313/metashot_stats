const { parseDateRange } = require('../utils/dateUtils');
const {
    fetchUniqueActiveUsersCount,
    fetchGameTypeMatchesCount,
    fetchGameTypeUniquePlayersCount,
    fetchGameTypeWinsCount
} = require('../utils/metricFetchers');

/**
 * Field name mapping for different game modes to maintain existing response formats.
 */
const fieldMapping = {
    quickPlay: {
        matches: 'QuickPlay_Matches',
        uniquePlayers: 'QuickPlay_UniquePlayers',
        adoption: 'Adoption_Percentage',
        matchPerADU: 'Match_Per_ADU_Ratio',
        matchPerPlayer: 'Match_Per_Player_Ratio',
        winRate: 'QuickPlay_WinRate',
        wins: 'QuickPlay_Wins',
        totalMatchesLabel: 'QuickPlay_TotalMatches',
        usersLabel: 'QuickPlay_Users'
    },
    weeklyEvent: {
        matches: 'Week_Event_Matches',
        uniquePlayers: 'Week_Event_UniquePlayers',
        adoption: 'Adoption_Percentage',
        matchPerADU: 'Match_Per_ADU_Ratio',
        matchPerPlayer: 'Match_Per_Player_Ratio',
        winRate: 'WinRate',
        wins: 'Wins',
        totalMatchesLabel: 'TotalMatches',
        usersLabel: 'WeeklyChallenge_Users'
    }
};

const getPrefix = (gameType) => fieldMapping[gameType] || {
    matches: 'Matches',
    uniquePlayers: 'UniquePlayers',
    adoption: 'Adoption_Percentage',
    matchPerADU: 'Match_Per_ADU_Ratio',
    matchPerPlayer: 'Match_Per_Player_Ratio',
    winRate: 'WinRate',
    wins: 'Wins',
    totalMatchesLabel: 'TotalMatches',
    usersLabel: 'Users'
};

/**
 * POST /totalMatches
 */
const totalMatches = async (req) => {
    const { date, gameType } = req.body;
    if (!date) throw new Error('date is required');
    if (!gameType) throw new Error('gameType is required');

    const { startDate, endDate } = parseDateRange(date, 'day');
    const count = await fetchGameTypeMatchesCount(startDate, endDate, gameType);

    const fields = getPrefix(gameType);
    return {
        data: { [fields.matches]: count },
        message: `${gameType} matches on ${date}`
    };
};

/**
 * POST /uniquePlayers
 */
const uniquePlayers = async (req) => {
    const { date, gameType } = req.body;
    if (!date) throw new Error('date is required');
    if (!gameType) throw new Error('gameType is required');

    const { startDate, endDate } = parseDateRange(date, 'day');
    const count = await fetchGameTypeUniquePlayersCount(startDate, endDate, gameType);

    const fields = getPrefix(gameType);
    return {
        data: { [fields.uniquePlayers]: count },
        message: `${gameType} unique players on ${date}`
    };
};

/**
 * POST /adoptionPercentage
 */
const adoptionPercentage = async (req) => {
    const { date, gameType } = req.body;
    if (!date) throw new Error('date is required');
    if (!gameType) throw new Error('gameType is required');

    const { startDate, endDate } = parseDateRange(date, 'day');

    const [gameUsers, totalDau] = await Promise.all([
        fetchGameTypeUniquePlayersCount(startDate, endDate, gameType),
        fetchUniqueActiveUsersCount(startDate, endDate)
    ]);

    const adoption = totalDau === 0 ? 0 : (gameUsers / totalDau) * 100;
    const fields = getPrefix(gameType);

    return {
        data: {
            [fields.usersLabel]: gameUsers,
            Total_DailyActiveUsers: totalDau,
            [fields.adoption]: adoption.toFixed(2) + '%'
        },
        message: `${gameType} adoption percentage on ${date}`
    };
};

/**
 * POST /matchPerADU
 */
const matchPerADU = async (req) => {
    const { date, gameType } = req.body;
    if (!date) throw new Error('date is required');
    if (!gameType) throw new Error('gameType is required');

    const { startDate, endDate } = parseDateRange(date, 'day');

    const [matches, totalDau] = await Promise.all([
        fetchGameTypeMatchesCount(startDate, endDate, gameType),
        fetchUniqueActiveUsersCount(startDate, endDate)
    ]);

    const ratio = totalDau === 0 ? 0 : matches / totalDau;
    const fields = getPrefix(gameType);

    return {
        data: {
            [fields.matches]: matches,
            Total_DailyActiveUsers: totalDau,
            [fields.matchPerADU]: ratio.toFixed(2)
        },
        message: `${gameType} match per ADU ratio on ${date}`
    };
};

/**
 * POST /matchPerPlayer
 */
const matchPerPlayer = async (req) => {
    const { date, gameType } = req.body;
    if (!date) throw new Error('date is required');
    if (!gameType) throw new Error('gameType is required');

    const { startDate, endDate } = parseDateRange(date, 'day');

    const [matches, uniquePlayers] = await Promise.all([
        fetchGameTypeMatchesCount(startDate, endDate, gameType),
        fetchGameTypeUniquePlayersCount(startDate, endDate, gameType)
    ]);

    const ratio = uniquePlayers === 0 ? 0 : matches / uniquePlayers;
    const fields = getPrefix(gameType);

    return {
        data: {
            [fields.matches]: matches,
            [fields.uniquePlayers]: uniquePlayers,
            [fields.matchPerPlayer]: ratio.toFixed(2)
        },
        message: `${gameType} match per player ratio on ${date}`
    };
};

/**
 * POST /winRate
 */
const winRate = async (req) => {
    const { date, gameType } = req.body;
    if (!date) throw new Error('date is required');
    if (!gameType) throw new Error('gameType is required');

    const { startDate, endDate } = parseDateRange(date, 'day');

    const [wins, matches] = await Promise.all([
        fetchGameTypeWinsCount(startDate, endDate, gameType),
        fetchGameTypeMatchesCount(startDate, endDate, gameType)
    ]);

    const rate = matches === 0 ? 0 : (wins / matches) * 100;
    const fields = getPrefix(gameType);

    return {
        data: {
            [fields.wins]: wins,
            [fields.totalMatchesLabel]: matches,
            [fields.winRate]: rate.toFixed(2) + '%'
        },
        message: `${gameType} win rate on ${date}`
    };
};

module.exports = {
    totalMatches,
    uniquePlayers,
    adoptionPercentage,
    matchPerADU,
    matchPerPlayer,
    winRate
};
