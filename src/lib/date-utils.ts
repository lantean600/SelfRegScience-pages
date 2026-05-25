export function todayInTimezone(_timezone: string) {
  return new Date().toISOString().slice(0, 10);
}

export function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

export function addSeconds(date: Date, seconds: number) {
  return new Date(date.getTime() + seconds * 1000);
}

export function isAppointmentOverdue(deadlineAt: string | Date, now = new Date()) {
  return new Date(deadlineAt) < now;
}
