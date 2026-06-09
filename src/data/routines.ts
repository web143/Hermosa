// ============================================================
// GYM APP — Centralized Routine Data & Image Mapping
// ============================================================

export type ProfileId = "haniel" | "ella";

export interface ExerciseConfig {
  name: string;
  imageKey: string;
  isSuperset?: boolean;
  isDropset?: boolean;
  notes?: string;
}

export interface RoutineDay {
  id: string;
  dayLabel: string;      // e.g. "DÍA 1"
  title: string;         // e.g. "Legs & Glutes"
  subtitle: string;      // e.g. "Glutes · Hamstrings"
  emoji: string;
  heroBg: string;        // image key for background hero
  duration: string;      // e.g. "45-55 min"
  exercises: ExerciseConfig[];
}

// ─── Image Map (keyed to actual filenames in /gym images/) ───────────────────
export const GYM_IMAGES: Record<string, string> = {
  // Glutes / Legs
  barbell_hip_thrust:           "/gym images/01_barbell_hip_thrust.png",
  barbell_rdl:                  "/gym images/02_barbell_romanian_deadlift_rdl.png",
  deficit_reverse_lunge:        "/gym images/03_deficit_reverse_lunge.png",
  glute_medius_kickback:        "/gym images/04_glute_medius_kickback_cable.png",
  barbell_back_squat:           "/gym images/05_barbell_back_squat.png",
  leg_press:                    "/gym images/06_leg_press_normal.png",
  narrow_low_leg_press:         "/gym images/07_leg_press_narrow.png",
  seated_leg_curl:              "/gym images/08_seated_leg_curl.png",
  lying_leg_curl:               "/gym images/09_lying_leg_curl.png",
  step_ups:                     "/gym images/10_step_ups.png",
  lunges:                       "/gym images/11_lunges_walking.png",
  leg_extension:                "/gym images/12_leg_extension.png",
  standing_calf_raise:          "/gym images/13_standing_calf_raise.png",
  seated_calf_raise:            "/gym images/14_seated_calf_raise.png",

  // Pull / Back / Biceps
  dead_stop_row:                "/gym images/15_dead_stop_row.png",
  remo_sentado_menton:          "/gym images/16_high_cable_row.png",
  seated_row_inclinado:         "/gym images/17_chest-supported_incline_row.png",
  reverse_pec_deck:             "/gym images/18_reverse_pec_deck.png",
  lat_pulldown_dropset:         "/gym images/19_lat_pulldown.png",
  single_arm_bent_over_row:     "/gym images/20_single_arm_bent_over_row.png",

  // Push / Chest / Shoulders / Triceps
  seated_chest_press:           "/gym images/21_seated_chest_press.png",
  low_cable_chest_fly:          "/gym images/22_low_cable_chest_fly.png",
  pec_deck_flyes:               "/gym images/23_pec_deck_flyes.png",
  barbell_strict_press:         "/gym images/24_barbell_strict_press.png",
  cable_diamond_front_raise:    "/gym images/25_cable_diamond_front_raise.png",
  combo_lateral_frontal:        "/gym images/26_dumbbell_lateral_raise.png",
  bent_over_reverse_fly:        "/gym images/27_bent_over_reverse_fly.png",
  half_kneeling_single_arm_press: "/gym images/28_half_kneeling_single_arm_press.png",
  cable_rope_tricep_pushdown:   "/gym images/29_cable_rope_tricep_pushdown.png",
  overhead_db_tricep_extension: "/gym images/30_overhead_triceps_extension.png",

  // Biceps
  hammer_curl:                  "/gym images/31_hammer_curl.png",
  hammer_to_wide_bicep_curl:    "/gym images/31_hammer_curl.png",
  wide_bicep_curl:              "/gym images/32_wide_bicep_curl.png",
  cable_rope_bicep_curl:        "/gym images/33_cable_rope_bicep_curl.png",
};

// ─── HANIEL Routines ─────────────────────────────────────────────────────────
export const HANIEL_ROUTINE: RoutineDay[] = [
  {
    id: "haniel_day1",
    dayLabel: "DÍA 1",
    title: "Legs · Glutes & Hamstrings",
    subtitle: "Glúteos · Femorales · Abductores",
    emoji: "🦵",
    heroBg: "barbell_hip_thrust",
    duration: "50-60 min",
    exercises: [
      { name: "Barbell Hip Thrust",       imageKey: "barbell_hip_thrust",    notes: "Control total en la bajada. Empuje de cadera explosivo." },
      { name: "Barbell RDL (Rumano)",     imageKey: "barbell_rdl",           notes: "Rodillas ligeramente flexionadas. Tensión en femorales todo el recorrido." },
      { name: "Deficit Reverse Lunge",    imageKey: "deficit_reverse_lunge", notes: "Plataforma elevada al frente. Máximo rango de movimiento." },
      { name: "Glute Medius Kickback",    imageKey: "glute_medius_kickback", notes: "Cable bajo. Aislamiento de glúteo medio." },
    ],
  },
  {
    id: "haniel_day2",
    dayLabel: "DÍA 2",
    title: "Push · Shoulders, Chest & Triceps",
    subtitle: "Hombros · Pecho · Tríceps",
    emoji: "🎯",
    heroBg: "barbell_strict_press",
    duration: "55-65 min",
    exercises: [
      { name: "Barbell Strict Press",            imageKey: "barbell_strict_press",          notes: "Press estricto vertical. Sin ayuda de piernas." },
      { name: "Cable Rope Tricep Pushdown",      imageKey: "cable_rope_tricep_pushdown",    isSuperset: true, notes: "SUPERSET ⛓️ — Codos pegados al cuerpo. Full extensión." },
      { name: "Cable Diamond Front Raise",       imageKey: "cable_diamond_front_raise",     isSuperset: true, notes: "SUPERSET ⛓️ — Elevación frontal con agarre diamante." },
      { name: "Low Cable Chest Fly / Seated Press", imageKey: "low_cable_chest_fly",        notes: "Alternativa: Chest Press en máquina si hay cola." },
      { name: "Half Kneeling Single Arm Press",  imageKey: "half_kneeling_single_arm_press",notes: "Rodilla apoyada. Activación de core + hombro unilateral." },
      { name: "Overhead DB Tricep Extension",    imageKey: "overhead_db_tricep_extension",  notes: "Codo fijo sobre la cabeza. Estira el tríceps largo." },
    ],
  },
  {
    id: "haniel_day3",
    dayLabel: "DÍA 3",
    title: "Legs · Quads & Calves",
    subtitle: "Cuádriceps · Pantorrillas",
    emoji: "🏔️",
    heroBg: "barbell_back_squat",
    duration: "55-65 min",
    exercises: [
      { name: "Barbell Back Squat",             imageKey: "barbell_back_squat",     notes: "Espalda neutra. Rodillas hacia afuera." },
      { name: "Narrow Low Stance Leg Press",    imageKey: "narrow_low_leg_press",   notes: "Pie estrecho y bajo para máximo énfasis en cuádriceps." },
      { name: "Alternating Steps",              imageKey: "step_ups",               notes: "Step alternado explosivo. Mantén el torso erecto." },
      { name: "DB Squat o Leg Extension",       imageKey: "leg_extension",          isSuperset: true, notes: "SUPERSET ⛓️ — Sentadilla con mancuerna o máquina extensora." },
      { name: "DB Calf Raise",                  imageKey: "standing_calf_raise",    isSuperset: true, notes: "SUPERSET ⛓️ — Elevación de talones. Full rango completo." },
    ],
  },
  {
    id: "haniel_day4",
    dayLabel: "DÍA 4",
    title: "Pull · Back & Biceps",
    subtitle: "Espalda · Bíceps · Romboides",
    emoji: "📐",
    heroBg: "dead_stop_row",
    duration: "55-65 min",
    exercises: [
      { name: "Dead Stop Row (Barbell)",        imageKey: "dead_stop_row",              notes: "Pausa completa en el suelo. Sin impulso." },
      { name: "Bent Over Reverse Fly",          imageKey: "bent_over_reverse_fly",      isSuperset: true, notes: "SUPERSET ⛓️ — Cuerpo inclinado. Foco en deltoides posterior." },
      { name: "Hammer to Wide Bicep Curl",      imageKey: "hammer_to_wide_bicep_curl",  isSuperset: true, notes: "SUPERSET ⛓️ — Combina Hammer Curl + Curl Ancho al fallo." },
      { name: "Lat Pulldown Dropset",           imageKey: "lat_pulldown_dropset",       isDropset: true,  notes: "DROPSET 💥 Top set pesado → drop 4, 6, 8, 10 reps." },
      { name: "Cable Rope Bicep Curl",          imageKey: "cable_rope_bicep_curl",      notes: "Cuerda. Supinación al final. Full pico bicipital." },
      { name: "Single Arm Bent Over Row",       imageKey: "single_arm_bent_over_row",   notes: "Apoyo en banco. Rango máximo de tracción." },
    ],
  },
];

// ─── ELLA Routines ────────────────────────────────────────────────────────────
export const ELLA_ROUTINE: RoutineDay[] = [
  {
    id: "ella_day1",
    dayLabel: "DÍA 1",
    title: "Cuádriceps, Glúteos & Pantorrilla",
    subtitle: "Quads · Glúteos · Calves",
    emoji: "🌸",
    heroBg: "barbell_back_squat",
    duration: "60-70 min",
    exercises: [
      { name: "Squats (Sentadillas)",              imageKey: "barbell_back_squat",    notes: "Control en la bajada. Rodillas alineadas." },
      { name: "Barbell Hip Thrust",                imageKey: "barbell_hip_thrust",    notes: "Empuje de cadera al máximo. Pausa arriba 1 seg." },
      { name: "Seated Leg Curl",                   imageKey: "seated_leg_curl",       notes: "Curl sentado. Foco femoral en punto de máxima contracción." },
      { name: "Step Ups",                          imageKey: "step_ups",              notes: "Step alternado con mancuerna o libre." },
      { name: "Lunges (Zancadas)",                 imageKey: "lunges",                notes: "Zancadas caminando. Rodilla trasera cerca del suelo." },
      { name: "Leg Press",                         imageKey: "leg_press",             notes: "Pie ancho y alto para glúteos." },
      { name: "Elevación de Pantorrilla de Pie",   imageKey: "standing_calf_raise",   notes: "Full rango. Pausa arriba y abajo." },
      { name: "Elevación de Pantorrilla Sentado",  imageKey: "seated_calf_raise",     notes: "Soleus emphasis. Rodillas a 90°." },
    ],
  },
  {
    id: "ella_day2",
    dayLabel: "DÍA 2",
    title: "Tren Superior · Espalda & Bíceps",
    subtitle: "Espalda · Dorsales · Bíceps",
    emoji: "💪",
    heroBg: "remo_sentado_menton",
    duration: "45-55 min",
    exercises: [
      { name: "Remo Sentado al Mentón (Espalda Alta)", imageKey: "remo_sentado_menton",   notes: "Remo vertical. Codos al frente y arriba." },
      { name: "Seated Row Inclinado (C-Row)",           imageKey: "seated_row_inclinado",  notes: "Tórax sobre el soporte. Pecho apoyado todo el recorrido." },
      { name: "Reverse Pec Deck / Pec Deck Inverso",   imageKey: "reverse_pec_deck",      notes: "Deltoides posterior. Control total en apertura." },
      { name: "Curl Normal",                            imageKey: "wide_bicep_curl",       isSuperset: true, notes: "BISERIE 💪 — Curl alterno o bilateral al fallo." },
      { name: "Curl Martillo al fallo",                 imageKey: "hammer_curl",           isSuperset: true, notes: "BISERIE 💪 — Sin pausa del Curl Normal al Martillo." },
    ],
  },
  {
    id: "ella_day3",
    dayLabel: "DÍA 3",
    title: "Femorales, Glúteos & Pantorrilla",
    subtitle: "Isquios · Glúteos · Calves",
    emoji: "🔥",
    heroBg: "barbell_hip_thrust",
    duration: "55-65 min",
    exercises: [
      { name: "Hip Thrust",                        imageKey: "barbell_hip_thrust",    notes: "Empuje máximo. Squeeze en la cima." },
      { name: "Romanian Deadlifts",                imageKey: "barbell_rdl",           notes: "RDL controlado. Tensión constante en femorales." },
      { name: "Bulgarian Split Squat",             imageKey: "deficit_reverse_lunge", notes: "Pie trasero elevado. Bajada lenta y controlada." },
      { name: "Máquina Acostada (Lying Leg Curl)", imageKey: "lying_leg_curl",        notes: "Curl acostado. Contracción máxima al final." },
      { name: "Glute Kickbacks",                   imageKey: "glute_medius_kickback", notes: "Cable o máquina. Control total del glúteo." },
      { name: "Elevación de Pantorrilla de Pie",   imageKey: "standing_calf_raise",   notes: "Full rango. Pausa arriba." },
      { name: "Elevación de Pantorrilla Sentado",  imageKey: "seated_calf_raise",     notes: "Rodillas a 90°. Soleus." },
    ],
  },
  {
    id: "ella_day4",
    dayLabel: "DÍA 4",
    title: "Tren Superior · Pecho, Hombro & Tríceps",
    subtitle: "Pecho · Hombros · Tríceps",
    emoji: "✨",
    heroBg: "seated_chest_press",
    duration: "50-60 min",
    exercises: [
      { name: "Prensa de Pecho (Chest Press Machine)", imageKey: "seated_chest_press",          notes: "Pecho máquina. Empuje explosivo, bajada controlada." },
      { name: "Aperturas en Máquina (Pec Deck / Flyes)", imageKey: "pec_deck_flyes",            notes: "Rango completo. Foco en el estiramiento pectoral." },
      { name: "Press Militar de Hombro",                 imageKey: "barbell_strict_press",      notes: "Puede ser con mancuerna. Estricto sin momentum." },
      { name: "Combo Lateral + Frontal (10+10)",         imageKey: "combo_lateral_frontal",     isSuperset: true, notes: "BISERIE ⛓️ — 10 elevaciones laterales + 10 frontales sin pausa." },
      { name: "Extensión de Tríceps con Cuerda",         imageKey: "cable_rope_tricep_pushdown",notes: "Pushdown con cuerda. Full extensión." },
      { name: "Overhead Triceps Extension",              imageKey: "overhead_db_tricep_extension", notes: "Sobre la cabeza. Estira el tríceps largo completo." },
    ],
  },
];

// ─── Helper ───────────────────────────────────────────────────────────────────
export function getRoutineForProfile(profile: ProfileId): RoutineDay[] {
  return profile === "haniel" ? HANIEL_ROUTINE : ELLA_ROUTINE;
}

export function getImageSrc(imageKey: string): string {
  return GYM_IMAGES[imageKey] ?? "";
}
