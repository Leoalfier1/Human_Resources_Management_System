// Exclude weekends (Saturday = 6, Sunday = 0)
const getWorkingDaysElapsed = (startDate) => {
    let count = 0;
    let curDate = new Date(startDate);
    const today = new Date();

    while (curDate <= today) {
        const dayOfWeek = curDate.getDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) count++;
        curDate.setDate(curDate.getDate() + 1);
    }
    return count;
};

module.exports = { getWorkingDaysElapsed };