const { parseDateRange } = require('../utils/dateUtils');
const {
    fetchUniqueActiveUsersCount,
    fetchDailyInstallsCount,
    fetchTotalMatchesCount,
    fetchPlayerAvgDailyMatches
} = require('../utils/metricFetchers');

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
        avgDaily
    ] = await Promise.all([
        fetchDailyInstallsCount(dayRange.startDate, dayRange.endDate),
        fetchUniqueActiveUsersCount(dayRange.startDate, dayRange.endDate),
        fetchUniqueActiveUsersCount(monthRange.startDate, monthRange.endDate),
        fetchTotalMatchesCount(dayRange.startDate, dayRange.endDate),
        fetchPlayerAvgDailyMatches(dayRange.startDate, dayRange.endDate)
    ]);

    const status = monthlyActive === 0 ? 0 : (dailyActive / monthlyActive) * 100;

    return {
        data: {
            date: targetDate,
            dailyNewInstalls: installs.no_installs,
            dailyActiveUsers: dailyActive,
            monthlyActiveUsers: monthlyActive,
            dailyProgress: status.toFixed(2) + '%',
            totalMatches: matches.No_of_Matches,
            playerAvgDaily: avgDaily.averageMatchesPerUser
        },
        message: `Consolidated daily report for ${targetDate}`
    };
};

module.exports = {
    dailyInstalls,
    activeUsers,
    monthlyActiveUsers,
    dailyProgress,
    totalMatches,
    playerAvgDaily,
    dailyReport
};
