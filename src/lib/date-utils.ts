
/**
 * Returns a string formatted as "M월 N주차" for a given date.
 * The week number is calculated based on the calendar row (Sunday start).
 */
export function formatMonthWeek(date: Date | string): string {
    const d = new Date(date)
    if (isNaN(d.getTime())) return ''

    const month = d.getMonth() + 1
    const firstDay = new Date(d.getFullYear(), d.getMonth(), 1)

    // Day of week for the 1st of the month (0: Sun, 1: Mon, ... 6: Sat)
    const firstDayOfWeek = firstDay.getDay()

    // Date of the month (1-31)
    const day = d.getDate()

    // Calculate week number (1-based)
    // Conceptually adding empty slots before the 1st to make a full first week grid
    const week = Math.ceil((day + firstDayOfWeek) / 7)

    return `${month}월 ${week}주차`
}
