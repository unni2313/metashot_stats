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
        startDate = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0));
    } else {
        startDate = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
    }

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        throw new Error('Invalid date created');
    }

    return { startDate, endDate };
};

module.exports = {
    parseDateRange
};
