'use strict';

const moment = require('./moment');

class CalendarActionBuilder {

  constructor(offset, expires) {
    if (offset === undefined) {
      this._startOffset = '-0s';
    } else if (offset.startsWith('-') === false) {
      this._startOffset = `-${offset}`;
    } else {
      this._startOffset = offset;
    }

    // add an offset for the endDate (expires)
    if (expires === undefined) {
      this._expiresOffset = '-0s';
    } else if (expires.startsWith('-') === false) {
      this._expiresOffset = `-${expires}`;
    } else {
      this._expiresOffset = expires;
    }

    if (moment().isRelativeTimeFormat(this._startOffset) === false) {
      throw new Error('Invalid relative time format for offset.');
    }
    if (moment().isRelativeTimeFormat(this._expiresOffset) === false) {
      throw new Error('Invalid relative time format for expires.');
    }
  }

  generateActions(cal, now) {
    let allEvents = [].concat(
      this._generateNonRecurringEvents(cal),
      this._generateRecurringEvents(cal, moment(now)));

    allEvents = this._sortEventsByDate(allEvents);
    allEvents = this._filterExpiredEvents(allEvents, now);

    return allEvents;
  }

  _generateNonRecurringEvents(cal) {

    const events = [].concat(cal.events.map(e => ({
      date: moment(e.startDate.toJSDate()).relativeTime(this._startOffset).toDate(),
      expires: moment(e.endDate.toJSDate()).relativeTime(this._expiresOffset).toDate(),
      state: true,
      summary: e.summary
    })),
    cal.events.map(e => ({
      date: e.endDate.toJSDate(),
      expires: e.endDate.toJSDate(),
      state: false,
      summary: e.summary
    })));

    return events;
  }

  _generateRecurringEvents(cal) {

    const events = [].concat(cal.occurrences.map(e => ({
      date: moment(e.startDate.toJSDate()).relativeTime(this._startOffset).toDate(),
      expires: moment(e.endDate.toJSDate()).relativeTime(this._expiresOffset).toDate(),
      state: true,
      summary: e.item.summary
    })),
    cal.occurrences.map(e => ({
      date: e.endDate.toJSDate(),
      expires: e.endDate.toJSDate(),
      state: false,
      summary: e.item.summary
    })));

    return events;
  }

  _sortEventsByDate(events) {
    // Sort in start-order
    return events.sort((a, b) => a.date.valueOf() - b.date.valueOf());
  }

  _filterExpiredEvents(events, now) {
    // Keep only events that expire right now or in the future
    return events.filter(event => event.expires.valueOf() >= now);
  }
}

module.exports = CalendarActionBuilder;