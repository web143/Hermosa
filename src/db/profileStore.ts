import type { ProfileId } from "@/data/routines";

export interface ExerciseLog {
  exerciseName: string;
  set1Weight: string;
  topSetWeight: string;
  topSetReps: string;
  set3Weight: string;
  set4Weight: string;
  warmupEnabled: boolean;
  warmupWeight: string;
  isCompleted: boolean;
  unit: "kg" | "lbs";
  set3Reps?: string;
  set4Reps?: string;
  set5Weight?: string;
  set5Reps?: string;
}

export interface DaySession {
  date: string;
  dayId: string;
  dayLabel: string;
  dayTitle: string;
  timestamp: number;
  exercises: ExerciseLog[];
}

interface ProfileData {
  sessions: DaySession[];
}

function getKey(profile: ProfileId): string {
  return `gym_data_profile_${profile}`;
}

function read(profile: ProfileId): ProfileData {
  try {
    const raw = localStorage.getItem(getKey(profile));
    if (raw) return JSON.parse(raw) as ProfileData;
  } catch { /* ignore */ }
  return { sessions: [] };
}

function write(profile: ProfileId, data: ProfileData): void {
  localStorage.setItem(getKey(profile), JSON.stringify(data));
}

export function addSession(profile: ProfileId, session: DaySession): void {
  const data = read(profile);
  const idx = data.sessions.findIndex((s) => s.date === session.date);
  if (idx >= 0) {
    data.sessions[idx] = session;
  } else {
    data.sessions.push(session);
  }
  data.sessions.sort((a, b) => b.timestamp - a.timestamp);
  write(profile, data);
}

export function getSessions(profile: ProfileId): DaySession[] {
  return read(profile).sessions;
}

export function getSessionByDate(profile: ProfileId, date: string): DaySession | undefined {
  return read(profile).sessions.find((s) => s.date === date);
}

export function hasCompletedRoutineToday(profile: ProfileId, dayId: string): boolean {
  const today = new Date().toLocaleDateString("en-CA");
  return read(profile).sessions.some((s) => s.date === today && s.dayId === dayId);
}

export function updateSessionExercises(
  profile: ProfileId,
  date: string,
  exercises: ExerciseLog[]
): void {
  const data = read(profile);
  const session = data.sessions.find((s) => s.date === date);
  if (session) {
    session.exercises = exercises;
    write(profile, data);
  }
}

export function deleteSession(profile: ProfileId, date: string): void {
  const data = read(profile);
  data.sessions = data.sessions.filter((s) => s.date !== date);
  write(profile, data);
}

export function removeExerciseFromSession(
  profile: ProfileId,
  date: string,
  exerciseIndex: number
): void {
  const data = read(profile);
  const session = data.sessions.find((s) => s.date === date);
  if (session) {
    session.exercises = session.exercises.filter((_, i) => i !== exerciseIndex);
    write(profile, data);
  }
}

export function getSessionDates(profile: ProfileId): string[] {
  return read(profile).sessions.map((s) => s.date);
}

export function getTotalSessions(profile: ProfileId): number {
  return read(profile).sessions.length;
}

export function getCurrentStreak(profile: ProfileId): number {
  const dates = getSessionDates(profile).sort().reverse();
  if (dates.length === 0) return 0;
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < dates.length; i++) {
    const check = new Date(today);
    check.setDate(check.getDate() - i);
    const checkStr = check.toLocaleDateString("en-CA");
    if (dates[i] === checkStr) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

const DAY_MUSCLE_MAP: Record<string, string> = {
  haniel_day1: "Glúteos & Femorales",
  haniel_day2: "Hombros & Pecho & Tríceps",
  haniel_day3: "Cuádriceps & Pantorrillas",
  haniel_day4: "Espalda & Bíceps",
  ella_day1: "Cuádriceps & Glúteos",
  ella_day2: "Espalda & Bíceps",
  ella_day3: "Femorales & Glúteos",
  ella_day4: "Pecho & Hombros & Tríceps",
};

export function getTopMuscle(profile: ProfileId): string {
  const sessions = getSessions(profile);
  const counts: Record<string, number> = {};
  for (const s of sessions) {
    const muscle = DAY_MUSCLE_MAP[s.dayId] || "General";
    counts[muscle] = (counts[muscle] || 0) + 1;
  }
  let top = "General";
  let max = 0;
  for (const [muscle, count] of Object.entries(counts)) {
    if (count > max) {
      max = count;
      top = muscle;
    }
  }
  return top;
}
