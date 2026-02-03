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
                createdDate: { $gte: startDate, $lte: endDate },


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
    const [matchesData, activeUsersCount] = await Promise.all([
        fetchTotalMatchesCount(startDate, endDate),
        fetchUniqueActiveUsersCount(startDate, endDate)
    ]);

    const totalMatches = matchesData.No_of_Matches || 0;
    const avg = activeUsersCount === 0 ? 0 : totalMatches / activeUsersCount;

    return { averageMatchesPerUser: Number(avg.toFixed(2)) };
};

/**
 * Counts actual installs based on installDate in playerInfo.
 */
const fetchActualInstallsCount = async (startDate, endDate) => {
    const db = client.db();
    const coll = db.collection('clnGamePlay');
    const agg = [
        {
            $match: {
                createdDate: { $gte: startDate, $lte: endDate }
            }
        },
        { $unwind: '$playerInfo' },
        {
            $match: {
                'playerInfo.installDate': { $gte: startDate, $lte: endDate }
            }
        },
        { $group: { _id: '$playerInfo.playerId' } },
        { $count: 'ActualNoOfInstalls' }
    ];
    const result = await coll.aggregate(agg).toArray();
    return result.length > 0 ? result[0].ActualNoOfInstalls : 0;
};

/**
 * Controller Actions - Handlers for API endpoints
 */

/**
 * GET/POST /dailyInstalls
 */
const dailyInstalls = async (req) => {
    const { date } = req.body;
    if (!date) throw new Error('date is required');

    const { startDate, endDate } = parseDateRange(date, 'day');
    const data = await fetchDailyInstallsCount(startDate, endDate);
    return { data, message: `Daily installs for ${date}` };
};

/**
 * GET/POST /activeUsers
 */
const activeUsers = async (req) => {
    const { date } = req.body;
    if (!date) throw new Error('date is required');

    const { startDate, endDate } = parseDateRange(date, 'day');
    const count = await fetchUniqueActiveUsersCount(startDate, endDate);
    return { data: { NO_Active_Users: count }, message: `Active users on ${date}` };
};

/**
 * GET/POST /monthlyActiveUsers
 */
const monthlyActiveUsers = async (req) => {
    const { endDate: dateStr, date } = req.body;
    const targetDate = dateStr || date;
    if (!targetDate) throw new Error('endDate or date is required');

    const { startDate, endDate } = parseDateRange(targetDate, 'month');
    const count = await fetchUniqueActiveUsersCount(startDate, endDate);
    return {
        data: { NO_Active_Users: count },
        message: `Monthly active users up to ${endDate.toISOString().split('T')[0]} and from ${startDate.toISOString().split('T')[0]}`
    };
};

/**
 * GET/POST /dailyProgress
 */
const dailyProgress = async (req) => {
    const targetDate = req.body.date || req.body.endDate;
    if (!targetDate) throw new Error('date or endDate is required');

    const dayRange = parseDateRange(targetDate, 'day');
    const monthRange = parseDateRange(targetDate, 'month');

    const dailyCount = await fetchUniqueActiveUsersCount(dayRange.startDate, dayRange.endDate);
    const monthlyCount = await fetchUniqueActiveUsersCount(monthRange.startDate, monthRange.endDate);

    const progressPercentage = monthlyCount === 0 ? 0 : (dailyCount / monthlyCount) * 100;

    return {
        data: {
            dailyActiveUsers: dailyCount,
            monthlyActiveUsers: monthlyCount,
            progressPercentage: progressPercentage.toFixed(2) + '%'
        },
        message: `Daily progress for ${targetDate}`
    };
};

/**
 * GET/POST /totalMatches
 */
const totalMatches = async (req) => {
    const { date } = req.body;
    if (!date) throw new Error('date is required');

    const { startDate, endDate } = parseDateRange(date, 'day');
    const data = await fetchTotalMatchesCount(startDate, endDate);
    return { data, message: `Total matches on ${date}` };
};

/**
 * GET/POST /playerAvgDaily
 */
const playerAvgDaily = async (req) => {
    const { date } = req.body;
    if (!date) throw new Error('date is required');

    const { startDate, endDate } = parseDateRange(date, 'day');
    const data = await fetchPlayerAvgDailyMatches(startDate, endDate);
    return { data, message: `Average matches per player on ${date}` };
};

/**
 * GET/POST /dailyReport
 * Combines all metrics into a single response
 */
const dailyReport = async (req) => {
    const targetDate = req.body.date || req.body.endDate;
    if (!targetDate) throw new Error('date or endDate is required');

    const dayRange = parseDateRange(targetDate, 'day');
    const monthRange = parseDateRange(targetDate, 'month');

    const [
        installs,
        dailyActive,
        monthlyActive,
        matches,
        avgDaily,
        actualInstallsCount
    ] = await Promise.all([
        fetchDailyInstallsCount(dayRange.startDate, dayRange.endDate),
        fetchUniqueActiveUsersCount(dayRange.startDate, dayRange.endDate),
        fetchUniqueActiveUsersCount(monthRange.startDate, monthRange.endDate),
        fetchTotalMatchesCount(dayRange.startDate, dayRange.endDate),
        fetchPlayerAvgDailyMatches(dayRange.startDate, dayRange.endDate),
        fetchActualInstallsCount(dayRange.startDate, dayRange.endDate)
    ]);

    const status = monthlyActive === 0 ? 0 : (dailyActive / monthlyActive) * 100;

    return {
        data: {
            date: targetDate,
            dailyNewInstalls: installs.no_installs,
            actualInstalls: actualInstallsCount,
            dailyActiveUsers: dailyActive,
            monthlyActiveUsers: monthlyActive,
            dailyProgress: status.toFixed(2) + '%',
            totalMatches: matches.No_of_Matches,
            playerAvgDaily: avgDaily.averageMatchesPerUser
        },
        message: `Consolidated daily report for ${targetDate}`
    };
};

/**
 * GET/POST /actualInstalls
 */
const actualInstalls = async (req) => {
    const { date } = req.body;
    if (!date) throw new Error('date is required');

    const { startDate, endDate } = parseDateRange(date, 'day');
    const count = await fetchActualInstallsCount(startDate, endDate);
    return { data: { ActualNoOfInstalls: count }, message: `Actual Installs on ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}` };
};

module.exports = {
    dailyInstalls,
    activeUsers,
    monthlyActiveUsers,
    dailyProgress,
    totalMatches,
    playerAvgDaily,
    dailyReport,
    actualInstalls
};
