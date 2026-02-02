const { client } = require('../config/db');

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
                createdDate: { $gte: startDate, $lte: endDate }
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
 * Counts new installs in a date range.
 * @param {Date} startDate 
 * @param {Date} endDate 
 * @returns {Promise<Object>}
 */
const fetchDailyInstallsCount = async (startDate, endDate) => {
    const db = client.db();
    const coll = db.collection('clnPlayers');
    const agg = [
        { $match: { createdDate: { $gte: startDate, $lte: endDate } } },
        { $count: 'no_installs' }
    ];
    const result = await coll.aggregate(agg).toArray();
    return result.length > 0 ? result[0] : { no_installs: 0 };
};

/**
 * Counts total matches played in a date range.
 * @param {Date} startDate 
 * @param {Date} endDate 
 * @returns {Promise<Object>}
 */
const fetchTotalMatchesCount = async (startDate, endDate) => {
    const db = client.db();
    const coll = db.collection('clnGamePlay');
    const agg = [
        {
            $match: {
                createdDate: { $gte: startDate, $lte: endDate }
            }
        },
        { $count: 'No_of_Matches' }
    ];
    const result = await coll.aggregate(agg).toArray();
    return result.length > 0 ? result[0] : { No_of_Matches: 0 };
};

/**
 * Calculates average matches per user in a date range.
 * @param {Date} startDate 
 * @param {Date} endDate 
 * @returns {Promise<Object>}
 */
const fetchPlayerAvgDailyMatches = async (startDate, endDate) => {
    const db = client.db();
    const coll = db.collection('clnGamePlay');
    const agg = [
        {
            $match: {
                createdDate: { $gte: startDate, $lte: endDate }
            }
        },
        { $unwind: { path: '$playerInfo' } },
        {
            $group: {
                _id: '$playerInfo.playerId',
                matchCount: { $sum: 1 }
            }
        },
        {
            $group: {
                _id: null,
                avgMatches: { $avg: '$matchCount' }
            }
        },
        {
            $project: {
                _id: 0,
                averageMatchesPerUser: { $round: ['$avgMatches', 2] }
            }
        }
    ];
    const result = await coll.aggregate(agg).toArray();
    return result.length > 0 ? result[0] : { averageMatchesPerUser: 0 };
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
                gameType: gameType
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
                gameType: gameType
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
                $expr: { $eq: ['$gameWon', '$playerInfo.playerId'] }
            }
        },
        { $count: 'Wins' }
    ];
    const result = await coll.aggregate(agg).toArray();
    return result.length > 0 ? result[0].Wins : 0;
};

module.exports = {
    fetchUniqueActiveUsersCount,
    fetchDailyInstallsCount,
    fetchTotalMatchesCount,
    fetchPlayerAvgDailyMatches,
    fetchGameTypeMatchesCount,
    fetchGameTypeUniquePlayersCount,
    fetchGameTypeWinsCount
};
