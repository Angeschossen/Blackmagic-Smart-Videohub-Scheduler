const MS_PER_DAY = 1000 * 60 * 60 * 24;

// a and b are javascript Date objects
function dateDiffInDays(a, b) {
    // Discard the time and time-zone information.
    const utc1 = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
    const utc2 = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());

    return Math.floor((utc2 - utc1) / _MS_PER_DAY);
}

function getWeek(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    d.setUTCDate(d.getUTCDate() - d.getUTCDay());
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
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
    getSecondOfDay(date) {
        return date.getSeconds() + (60 * (date.getMinutes() + (60 * date.getHours())))
    },
    getSecondOfDayUTC(date) {
        return date.getUTCSeconds() + (60 * (date.getUTCMinutes() + (60 * date.getUTCHours())))
    },
    convertDateToLocal(date) {
        date = new Date(date)
        return date
    },
    removeSecondsFromDate(date) {
        date.setUTCSeconds(0)
        date.setUTCMilliseconds(0)
    },
    setDayOfWeekUTC: function (date, day_of_week) {
        const dist = day_of_week - date.getUTCDay();
        date.setDate(date.getDate() + dist);
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