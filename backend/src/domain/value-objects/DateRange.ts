/**
 * DateRange Value Object
 * Immutable value object representing a range of dates
 */

import {
    startOfDay,
    endOfDay,
    startOfWeek,
    endOfWeek,
    startOfMonth,
    endOfMonth,
    startOfYear,
    endOfYear,
    subDays,
    subMonths,
    subYears,
    differenceInDays,
    differenceInMonths,
    isWithinInterval,
    eachDayOfInterval,
    eachMonthOfInterval,
    format,
} from 'date-fns';

export interface DateRangeProps {
    start: Date;
    end: Date;
}

export class DateRange {
    private readonly _start: Date;
    private readonly _end: Date;

    private constructor(start: Date, end: Date) {
        if (start > end) {
            throw new Error('Start date must be before or equal to end date');
        }
        this._start = startOfDay(start);
        this._end = endOfDay(end);
    }

    // Factory methods
    static create(start: Date, end: Date): DateRange {
        return new DateRange(start, end);
    }

    static today(): DateRange {
        const now = new Date();
        return new DateRange(now, now);
    }

    static thisWeek(): DateRange {
        const now = new Date();
        return new DateRange(startOfWeek(now), endOfWeek(now));
    }

    static thisMonth(): DateRange {
        const now = new Date();
        return new DateRange(startOfMonth(now), endOfMonth(now));
    }

    static thisYear(): DateRange {
        const now = new Date();
        return new DateRange(startOfYear(now), endOfYear(now));
    }

    static lastDays(days: number): DateRange {
        const now = new Date();
        return new DateRange(subDays(now, days - 1), now);
    }

    static lastMonths(months: number): DateRange {
        const now = new Date();
        const start = startOfMonth(subMonths(now, months - 1));
        return new DateRange(start, endOfMonth(now));
    }

    static lastYear(): DateRange {
        const now = new Date();
        const start = subYears(now, 1);
        return new DateRange(start, now);
    }

    static previousMonth(): DateRange {
        const now = new Date();
        const prevMonth = subMonths(now, 1);
        return new DateRange(startOfMonth(prevMonth), endOfMonth(prevMonth));
    }

    static previousYear(): DateRange {
        const now = new Date();
        const prevYear = subYears(now, 1);
        return new DateRange(startOfYear(prevYear), endOfYear(prevYear));
    }

    // Getters
    get start(): Date {
        return this._start;
    }

    get end(): Date {
        return this._end;
    }

    // Derived properties
    get daysCount(): number {
        return differenceInDays(this._end, this._start) + 1;
    }

    get monthsCount(): number {
        return differenceInMonths(this._end, this._start) + 1;
    }

    // Query methods
    contains(date: Date): boolean {
        return isWithinInterval(date, { start: this._start, end: this._end });
    }

    overlaps(other: DateRange): boolean {
        return this._start <= other._end && this._end >= other._start;
    }

    includes(other: DateRange): boolean {
        return this._start <= other._start && this._end >= other._end;
    }

    // Iteration helpers
    eachDay(): Date[] {
        return eachDayOfInterval({ start: this._start, end: this._end });
    }

    eachMonth(): Date[] {
        return eachMonthOfInterval({ start: this._start, end: this._end });
    }

    // Transformation methods (return new instances)
    extend(days: number): DateRange {
        return new DateRange(this._start, new Date(this._end.getTime() + days * 24 * 60 * 60 * 1000));
    }

    shift(days: number): DateRange {
        const shiftMs = days * 24 * 60 * 60 * 1000;
        return new DateRange(
            new Date(this._start.getTime() + shiftMs),
            new Date(this._end.getTime() + shiftMs)
        );
    }

    previousPeriod(): DateRange {
        const duration = this._end.getTime() - this._start.getTime();
        const newStart = new Date(this._start.getTime() - duration - 24 * 60 * 60 * 1000);
        const newEnd = new Date(this._start.getTime() - 24 * 60 * 60 * 1000);
        return new DateRange(newStart, newEnd);
    }

    // Formatting
    format(dateFormat: string = 'yyyy-MM-dd'): { start: string; end: string } {
        return {
            start: format(this._start, dateFormat),
            end: format(this._end, dateFormat),
        };
    }

    formatRange(dateFormat: string = 'MMM d, yyyy'): string {
        if (this.daysCount === 1) {
            return format(this._start, dateFormat);
        }
        return `${format(this._start, dateFormat)} - ${format(this._end, dateFormat)}`;
    }

    // Serialization
    toJSON(): DateRangeProps {
        return {
            start: this._start,
            end: this._end,
        };
    }

    toString(): string {
        return this.formatRange();
    }

    // Comparison
    equals(other: DateRange): boolean {
        return (
            this._start.getTime() === other._start.getTime() &&
            this._end.getTime() === other._end.getTime()
        );
    }
}
