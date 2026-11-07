/**
 * Name of a division subject as the timetable shows it. A non-lecture subject also shows its activity
 * type from its non-lecture plan, e.g. "Human Anatomy · Seminar", wherever it is scheduled.
 */
export function timetableSubjectLabel(subject: any, fallback = ""): string {
  const name = subject?.subject?.name || fallback
  const activities: string[] = Array.isArray(subject?.non_lecture_activity_types) ? subject.non_lecture_activity_types : []
  return activities.length ? `${name} · ${activities.join(", ")}` : name
}
