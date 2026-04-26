/** 将日期归算到「周一 00:00:00」本地时区 */
export function startOfWeekMonday(d: Date): Date {
  const x = new Date(d);
  const day = x.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  x.setDate(x.getDate() + diff);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

/** 8 周时间窗 [start, end) */
export function getDefaultCommandWindow(weeks = 8) {
  const start = startOfWeekMonday(new Date());
  const end = addDays(start, weeks * 7);
  return { start, end, weeks };
}
