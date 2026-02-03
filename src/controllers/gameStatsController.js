const { client } = require('../config/db');

/**
 * Robustly parses a date string and returns a UTC date range.
 * @param {string} dateStr - Date string in DD-MM-YYYY or YYYY-MM-DD format.
 * @param {string} type - 'day' for 24h range, 'month' for start-of-month to end-of-day.
 * @returns {{startDate: Date, endDate: Date}}
 */
const parseDateRange = (dateStr, type = 'day') => {
    let year, month, day;

    const parts = dateStr.includes('-') ? dateStr.split('-') : dateStr.split('/');
    if (parts.length !== 3) {
        throw new Error('Invalid date format. Use DD-MM-YYYY or YYYY-MM-DD');
    }

    if (parts[0].length === 4) {
        // YYYY-MM-DD
        year = parseInt(parts[0]);
        month = parseInt(parts[1]) - 1;
        day = parseInt(parts[2]);
    } else {
        // DD-MM-YYYY
        year = parseInt(parts[2]);
        month = parseInt(parts[1]) - 1;
        day = parseInt(parts[0]);
    }

    if (isNaN(year) || isNaN(month) || isNaN(day)) {
        throw new Error('Invalid date values');
    }

    const endDate = new Date(Date.UTC(year, month, day, 23, 59, 59, 999));

    let startDate;
    if (type === 'month') {
        startDate = new Date(endDate);
        startDate.setUTCDate(startDate.getUTCDate() - 31);
        startDate.setUTCHours(0, 0, 0, 0);
    } else {
        startDate = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
    }

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        throw new Error('Invalid date created');
    }

    return { startDate, endDate };
};

/**
 * Counts unique active users in a date range (across all game types).
 * @param {Date} startDate 
 * @param {Date} endDate 
 * @returns {Promise<number>}
 */
const fetchUniqueActiveUsersCount = async (startDate, endDate) => {
    const db = client.db();
    const coll = db.collection('clnGamePlay');
    const agg = [
        {
            $match: {
                createdDate: { $gte: startDate, $lte: endDate },

            }
        },
        { $unwind: { path: '$playerInfo' } },
        { $group: { _id: '$playerInfo.playerId' } },
        { $count: 'count' }
    ];

    const result = await coll.aggregate(agg).toArray();
    return result.length > 0 ? result[0].count : 0;
};

/**
 * Counts total matches played for a specific gameType.
 */
const fetchGameTypeMatchesCount = async (startDate, endDate, gameType) => {
    const db = client.db();
    const coll = db.collection('clnGamePlay');
    const agg = [
        {
            $match: {
                createdDate: { $gte: startDate, $lte: endDate },
                gameType: gameType,


            }
        },
        { $count: 'Matches' }
    ];
    const result = await coll.aggregate(agg).toArray();
    return result.length > 0 ? result[0].Matches : 0;
};

/**
 * Counts unique players for a specific gameType.
 */
const fetchGameTypeUniquePlayersCount = async (startDate, endDate, gameType) => {
    const db = client.db();
    const coll = db.collection('clnGamePlay');
    const agg = [
        {
            $match: {
                createdDate: { $gte: startDate, $lte: endDate },
                gameType: gameType,


            }
        },
        { $group: { _id: '$playerInfo.playerId' } },
        { $count: 'UniquePlayers' }
    ];
    const result = await coll.aggregate(agg).toArray();
    return result.length > 0 ? result[0].UniquePlayers : 0;
};

/**
 * Counts wins for a specific gameType.
 */
const fetchGameTypeWinsCount = async (startDate, endDate, gameType) => {
    const db = client.db();
    const coll = db.collection('clnGamePlay');
    const agg = [
        {
            $match: {
                createdDate: { $gte: startDate, $lte: endDate },
                gameType: gameType,
                $expr: { $eq: ['$gameWon', '$playerInfo.playerId'] },



            }
        },
        { $count: 'Wins' }
    ];
    const result = await coll.aggregate(agg).toArray();
    return result.length > 0 ? result[0].Wins : 0;
};

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
    },
    targetChasing: {
        matches: 'TargetChasing_Matches',
        uniquePlayers: 'TargetChasing_UniquePlayers',
        adoption: 'Adoption_Percentage',
        matchPerADU: 'Match_Per_ADU_Ratio',
        matchPerPlayer: 'Match_Per_Player_Ratio',
        winRate: 'WinRate',
        wins: 'Wins',
        totalMatchesLabel: 'TargetChasing_TotalMatches',
        usersLabel: 'TargetChasing_Users'
    },
    sequenceStar: {
        matches: 'SequenceStar_Matches',
        uniquePlayers: 'SequenceStar_UniquePlayers',
        adoption: 'Adoption_Percentage',
        matchPerADU: 'Match_Per_ADU_Ratio',
        matchPerPlayer: 'Match_Per_Player_Ratio',
        winRate: 'WinRate',
        wins: 'Wins',
        totalMatchesLabel: 'SequenceStar_TotalMatches',
        usersLabel: 'SequenceStar_Users'
    },
    mulitiPlayer: {
        matches: 'MulitiPlayer_Matches',
        uniquePlayers: 'MulitiPlayer_UniquePlayers',
        adoption: 'Adoption_Percentage',
        matchPerADU: 'Match_Per_ADU_Ratio',
        matchPerPlayer: 'Match_Per_Player_Ratio',
        winRate: 'WinRate',
        wins: 'Wins',
        totalMatchesLabel: 'MulitiPlayer_TotalMatches',
        usersLabel: 'MulitiPlayer_Users'
    },
    tieMaker: {
        matches: 'TieMaker_Matches',
        uniquePlayers: 'TieMaker_UniquePlayers',
        adoption: 'Adoption_Percentage',
        matchPerADU: 'Match_Per_ADU_Ratio',
        matchPerPlayer: 'Match_Per_Player_Ratio',
        winRate: 'WinRate',
        wins: 'Wins',
        totalMatchesLabel: 'TieMaker_TotalMatches',
        usersLabel: 'TieMaker_Users'
    },
    MFLmode: {
        matches: 'MFLmode_Matches',
        uniquePlayers: 'MFLmode_UniquePlayers',
        adoption: 'Adoption_Percentage',
        matchPerADU: 'Match_Per_ADU_Ratio',
        matchPerPlayer: 'Match_Per_Player_Ratio',
        winRate: 'WinRate',
        wins: 'Wins',
        totalMatchesLabel: 'MFLmode_TotalMatches',
        usersLabel: 'MFLmode_Users'
    },
    eventMode: {
        matches: 'EventMode_Matches',
        uniquePlayers: 'EventMode_UniquePlayers',
        adoption: 'Adoption_Percentage',
        matchPerADU: 'Match_Per_ADU_Ratio',
        matchPerPlayer: 'Match_Per_Player_Ratio',
        winRate: 'WinRate',
        wins: 'Wins',
        totalMatchesLabel: 'EventMode_TotalMatches',
        usersLabel: 'EventMode_Users'
    },
    iplGame: {
        matches: 'IplGame_Matches',
        uniquePlayers: 'IplGame_UniquePlayers',
        adoption: 'Adoption_Percentage',
        matchPerADU: 'Match_Per_ADU_Ratio',
        matchPerPlayer: 'Match_Per_Player_Ratio',
        winRate: 'WinRate',
        wins: 'Wins',
        totalMatchesLabel: 'IplGame_TotalMatches',
        usersLabel: 'IplGame_Users'
    },
    localLegends: {
        matches: 'LocalLegends_Matches',
        uniquePlayers: 'LocalLegends_UniquePlayers',
        adoption: 'Adoption_Percentage',
        matchPerADU: 'Match_Per_ADU_Ratio',
        matchPerPlayer: 'Match_Per_Player_Ratio',
        winRate: 'WinRate',
        wins: 'Wins',
        totalMatchesLabel: 'LocalLegends_TotalMatches',
        usersLabel: 'LocalLegends_Users'
    },
    mpPrivate: {
        matches: 'MpPrivate_Matches',
        uniquePlayers: 'MpPrivate_UniquePlayers',
        adoption: 'Adoption_Percentage',
        matchPerADU: 'Match_Per_ADU_Ratio',
        matchPerPlayer: 'Match_Per_Player_Ratio',
        winRate: 'WinRate',
        wins: 'Wins',
        totalMatchesLabel: 'MpPrivate_TotalMatches',
        usersLabel: 'MpPrivate_Users'
    },
    mpPublic: {
        matches: 'MpPublic_Matches',
        uniquePlayers: 'MpPublic_UniquePlayers',
        adoption: 'Adoption_Percentage',
        matchPerADU: 'Match_Per_ADU_Ratio',
        matchPerPlayer: 'Match_Per_Player_Ratio',
        winRate: 'WinRate',
        wins: 'Wins',
        totalMatchesLabel: 'MpPublic_TotalMatches',
        usersLabel: 'MpPublic_Users'
    },
    vitalityMode: {
        matches: 'VitalityMode_Matches',
        uniquePlayers: 'VitalityMode_UniquePlayers',
        adoption: 'Adoption_Percentage',
        matchPerADU: 'Match_Per_ADU_Ratio',
        matchPerPlayer: 'Match_Per_Player_Ratio',
        winRate: 'WinRate',
        wins: 'Wins',
        totalMatchesLabel: 'VitalityMode_TotalMatches',
        usersLabel: 'VitalityMode_Users'
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

const allowedGameTypes = [
    'quickPlay', 'targetChasing', 'sequenceStar', 'mulitiPlayer', 'tieMaker',
    'MFLmode', 'eventMode', 'iplGame', 'localLegends', 'mpPrivate', 'mpPublic', 'vitalityMode', 'weeklyEvent'
];

const validateGameType = (gameType) => {
    if (!allowedGameTypes.includes(gameType)) {
        throw new Error(`Invalid gameType. Allowed types: ${allowedGameTypes.join(', ')}`);
    }
};

/**
 * POST /totalMatches
 */
const totalMatches = async (req) => {
    const { date, gameType } = req.body;
    if (!date) throw new Error('date is required');
    if (!gameType) throw new Error('gameType is required');
    validateGameType(gameType);

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
    validateGameType(gameType);

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
    validateGameType(gameType);

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
    validateGameType(gameType);

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
    validateGameType(gameType);

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
    validateGameType(gameType);

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

/**
 * POST /gameStatsReport
 */
const gameStatsReport = async (req) => {
    const { date, gameType } = req.body;
    if (!date) throw new Error('date is required');
    if (!gameType) throw new Error('gameType is required');
    validateGameType(gameType);

    const { startDate, endDate } = parseDateRange(date, 'day');

    const [
        matches,
        uniquePlayers,
        totalDau,
        wins
    ] = await Promise.all([
        fetchGameTypeMatchesCount(startDate, endDate, gameType),
        fetchGameTypeUniquePlayersCount(startDate, endDate, gameType),
        fetchUniqueActiveUsersCount(startDate, endDate),
        fetchGameTypeWinsCount(startDate, endDate, gameType)
    ]);

    const adoption = totalDau === 0 ? 0 : (uniquePlayers / totalDau) * 100;
    const matchPerADU = totalDau === 0 ? 0 : matches / totalDau;
    const matchPerPlayer = uniquePlayers === 0 ? 0 : matches / uniquePlayers;
    const winRate = matches === 0 ? 0 : (wins / matches) * 100;

    const fields = getPrefix(gameType);

    return {
        data: {
            [fields.matches]: matches,
            [fields.uniquePlayers]: uniquePlayers,
            [fields.adoption]: adoption.toFixed(2) + '%',
            [fields.matchPerADU]: matchPerADU.toFixed(2),
            [fields.matchPerPlayer]: matchPerPlayer.toFixed(2),
            [fields.winRate]: winRate.toFixed(2) + '%',
            Total_DailyActiveUsers: totalDau,
            [fields.wins]: wins
        },
        message: `Consolidated game stats report for ${gameType} on ${date}`
    };
};

module.exports = {
    totalMatches,
    uniquePlayers,
    adoptionPercentage,
    matchPerADU,
    matchPerPlayer,
    winRate,
    gameStatsReport
};
