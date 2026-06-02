export interface WorkoutLog {
  id?: number;
  date: string; // YYYY-MM-DD
  timestamp: number;
  profile: "haniel" | "novia";
  exerciseName: string;
  set1Kg: string;
  topSetKg: string;
  topSetReps: string;
  set3Kg: string;
  set4Kg: string;
}

export interface SetInputRecord {
  key: string; // `${profile}_${exerciseName}`
  profile: "haniel" | "novia";
  exerciseName: string;
  set1Kg: string;
  topSetKg: string;
  topSetReps: string;
  set3Kg: string;
  set4Kg: string;
  isCompleted: boolean;
}

class OlympusDb {
  private dbName = "olympus_database";
  private version = 1;
  private db: IDBDatabase | null = null;

  // Open database
  private openDb(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      if (this.db) {
        resolve(this.db);
        return;
      }

      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => {
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve(request.result);
      };

      request.onupgradeneeded = () => {
        const db = request.result;
        // Store current inputs of current active sessions
        if (!db.objectStoreNames.contains("set_inputs")) {
          db.createObjectStore("set_inputs", { keyPath: "key" });
        }
        // Store historical completed exercises for tracking overload progress over time
        if (!db.objectStoreNames.contains("workout_logs")) {
          const store = db.createObjectStore("workout_logs", {
            keyPath: "id",
            autoIncrement: true,
          });
          store.createIndex("profile", "profile", { unique: false });
          store.createIndex("exerciseName", "exerciseName", { unique: false });
          store.createIndex("date", "date", { unique: false });
        }
      };
    });
  }

  // Save current active input states
  async saveSetInputs(record: SetInputRecord): Promise<void> {
    const db = await this.openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction("set_inputs", "readwrite");
      const store = tx.objectStore("set_inputs");
      const request = store.put(record);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Get current active inputs
  async getSetInputs(profile: "haniel" | "novia", exerciseName: string): Promise<SetInputRecord | null> {
    const db = await this.openDb();
    const key = `${profile}_${exerciseName.replace(/\s+/g, "_").toLowerCase()}`;
    return new Promise((resolve, reject) => {
      const tx = db.transaction("set_inputs", "readonly");
      const store = tx.objectStore("set_inputs");
      const request = store.get(key);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  // Log a historical completed workout set
  async addWorkoutLog(log: WorkoutLog): Promise<void> {
    const db = await this.openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction("workout_logs", "readwrite");
      const store = tx.objectStore("workout_logs");
      const request = store.add(log);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Get all completed logs for a profile
  async getLogsByProfile(profile: "haniel" | "novia"): Promise<WorkoutLog[]> {
    const db = await this.openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction("workout_logs", "readonly");
      const store = tx.objectStore("workout_logs");
      const index = store.index("profile");
      const request = index.getAll(profile);

      request.onsuccess = () => {
        // Sort by timestamp descending
        const sorted = (request.result || []).sort(
          (a, b) => b.timestamp - a.timestamp
        );
        resolve(sorted);
      };
      request.onerror = () => reject(request.error);
    });
  }

  // Clear all data for a specific profile (resets everything)
  async clearProfileData(profile: "haniel" | "novia", exercises: string[]): Promise<void> {
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
      const request = index.openCursor(profile);

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue | null>).result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        } else {
          resolve();
        }
      };
      request.onerror = () => reject(request.error);
    });
  }
}

export const olympusDb = new OlympusDb();
