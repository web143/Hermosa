// ============================================================
// GYM APP — IndexedDB Persistence Layer (Offline-First)
// ============================================================

export type ProfileId = "haniel" | "ella";

export interface WorkoutLog {
  id?: number;
  date: string;
  timestamp: number;
  profile: ProfileId;
  dayId: string;
  exerciseName: string;
  topSetWeight: string;
  topSetReps: string;
  bo1Weight: string;
  bo1Reps: string;
  bo2Weight: string;
  bo2Reps: string;
  bo3Weight: string;
  bo3Reps: string;
  bo3Enabled: boolean;
  unit: "kg" | "lbs";
}

export interface SetInputRecord {
  key: string;
  profile: ProfileId;
  exerciseName: string;
  topSetWeight: string;
  topSetReps: string;
  bo1Weight: string;
  bo1Reps: string;
  bo2Weight: string;
  bo2Reps: string;
  bo3Weight: string;
  bo3Reps: string;
  bo3Enabled: boolean;
  warmupEnabled: boolean;
  isCompleted: boolean;
}

class GymDb {
  private dbName = "gym_database";
  private version = 2;
  private db: IDBDatabase | null = null;

  private openDb(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      if (this.db) { resolve(this.db); return; }

      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);

      request.onsuccess = () => {
        this.db = request.result;
        resolve(request.result);
      };

      request.onupgradeneeded = (event) => {
        const db = request.result;
        const oldVersion = event.oldVersion;

        if (oldVersion < 1) {
          // Current exercise input states
          if (!db.objectStoreNames.contains("set_inputs")) {
            db.createObjectStore("set_inputs", { keyPath: "key" });
          }
          // Historical completed logs
          if (!db.objectStoreNames.contains("workout_logs")) {
            const store = db.createObjectStore("workout_logs", {
              keyPath: "id",
              autoIncrement: true,
            });
            store.createIndex("profile", "profile", { unique: false });
            store.createIndex("exerciseName", "exerciseName", { unique: false });
            store.createIndex("date", "date", { unique: false });
            store.createIndex("dayId", "dayId", { unique: false });
          }
        }
      };
    });
  }

  // ─── Set Inputs ───────────────────────────────────────────────────────────
  async saveSetInputs(record: SetInputRecord): Promise<void> {
    const db = await this.openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction("set_inputs", "readwrite");
      const store = tx.objectStore("set_inputs");
      const req = store.put(record);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async getSetInputs(profile: ProfileId, exerciseName: string): Promise<SetInputRecord | null> {
    const db = await this.openDb();
    const key = `${profile}_${exerciseName.replace(/\s+/g, "_").toLowerCase()}`;
    return new Promise((resolve, reject) => {
      const tx = db.transaction("set_inputs", "readonly");
      const store = tx.objectStore("set_inputs");
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  }

  // ─── Workout Logs ─────────────────────────────────────────────────────────
  async addWorkoutLog(log: WorkoutLog): Promise<void> {
    const db = await this.openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction("workout_logs", "readwrite");
      const store = tx.objectStore("workout_logs");
      const req = store.add(log);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async getLogsByProfile(profile: ProfileId): Promise<WorkoutLog[]> {
    const db = await this.openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction("workout_logs", "readonly");
      const store = tx.objectStore("workout_logs");
      const index = store.index("profile");
      const req = index.getAll(profile);
      req.onsuccess = () => {
        const sorted = (req.result || []).sort((a, b) => b.timestamp - a.timestamp);
        resolve(sorted);
      };
      req.onerror = () => reject(req.error);
    });
  }

  async deleteWorkoutLog(id: number): Promise<void> {
    const db = await this.openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction("workout_logs", "readwrite");
      const store = tx.objectStore("workout_logs");
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async updateWorkoutLog(log: WorkoutLog): Promise<void> {
    const db = await this.openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction("workout_logs", "readwrite");
      const store = tx.objectStore("workout_logs");
      const req = store.put(log);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  // ─── Profile Reset ────────────────────────────────────────────────────────
  async clearProfileData(profile: ProfileId, exercises: string[]): Promise<void> {
    const db = await this.openDb();

    // Clear active inputs
    const txInputs = db.transaction("set_inputs", "readwrite");
    const storeInputs = txInputs.objectStore("set_inputs");
    exercises.forEach((name) => {
      const key = `${profile}_${name.replace(/\s+/g, "_").toLowerCase()}`;
      storeInputs.delete(key);
    });

    // Clear logs matching profile
    return new Promise((resolve, reject) => {
      const txLogs = db.transaction("workout_logs", "readwrite");
      const storeLogs = txLogs.objectStore("workout_logs");
      const index = storeLogs.index("profile");
      const req = index.openCursor(profile);
      req.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue | null>).result;
        if (cursor) { cursor.delete(); cursor.continue(); }
        else resolve();
      };
      req.onerror = () => reject(req.error);
    });
  }
}

export const gymDb = new GymDb();
