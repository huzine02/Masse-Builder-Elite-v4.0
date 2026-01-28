
export type Day = 'lundi' | 'mercredi' | 'vendredi' | 'recup' | 'progression' | 'evolution';

export interface ExerciseData {
  id: string;
  title: string;
  targetReps: number;
  sets: number;
  restTime?: number;
  isRappel?: boolean;
  tempo?: string;
  videoId?: string; // ID Youtube pour embed (ex: "dQw4w9WgXcQ")
  alternative?: string; // Nom de l'exercice alternatif
  isUnilateral?: boolean; // Si true, affiche "(par main)"
}

export interface WorkoutSession {
  date: string;
  week: number;
  day: string;
  // Format des valeurs: "80|10" (80kg, 10 reps) pour split input
  exercises: Record<string, string>; 
  notes: string;
  mcGillDone?: boolean;
}

export interface ProgressData {
  poids: string;
  taille: string;
  incline: string;
  rdl: string;
  photos?: Record<string, string>;
}
