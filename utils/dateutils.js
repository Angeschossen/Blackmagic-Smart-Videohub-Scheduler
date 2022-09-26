const MS_PER_DAY = 1000 * 60 * 60 * 24;

// a and b are javascript Date objects
function dateDiffInDays(a, b) {
    // Discard the time and time-zone information.
    const utc1 = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
    const utc2 = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());

    return Math.floor((utc2 - utc1) / _MS_PER_DAY);
}

function getWeek(date) {
    const janFirst = new Date(date.getFullYear(), 0, 1);
    return Math.ceil((((date.getTime() - janFirst.getTime()) / 86400000) + janFirst.getDay() + 1) / 7);
}

function getMinAndMax(dates) {
    var result = {};
    for (var index in dates) {
        var thisDate = dates[index]
            , dateParts = thisDate.split(/\//)
            , fullDate = new Date(dateParts[2], dateParts[0] - 1, dateParts[1]);
        if (!result['max'] || fullDate > result['max']) {
            result['max'] = fullDate;
        }
        if (!result['min'] || fullDate < result['min']) {
            result['min'] = fullDate
        }
    }
    return result;
}

module.exports = {
    convert_date_to_utc: function (date) {
        return new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds());
    },
    dateDiffInDays: function (a, b) {
        // discard the time and time-zone information.
        const utc1 = this.convert_date_to_utc(a);
        const utc2 = this.convert_date_to_utc(b);

        return Math.floor((utc2 - utc1) / MS_PER_DAY);
    },
    setDayOfWeek: function (date, day_of_week) {
        const dist = day_of_week - date.getDay();
        date.setDate(date.getDate() + dist);
    },
    setDayOfWeekWithWeeks: function (date, day_of_week, weeks) {
        if (weeks < 2) {
            this.setDayOfWeek(date, day_of_week);
            return;
        }

        const dist = (day_of_week + (7 * weeks) - date.getDay()) % 7;
        date.setDate(date.getDate() + dist);
    },
    isSameWeek: function (a, b) {
        return getWeek(a) === getWeek(b);
    }
}