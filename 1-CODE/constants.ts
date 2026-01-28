
import { ExerciseData } from './types';

// Programme de base pour placeholders S1
export const BASELINE_PROGRAM: Record<string, { weight?: number | string; reps: number }> = {
  'lun-1': { weight: 10, reps: 15 },
  'lun-2': { weight: 25, reps: 15 },
  'lun-3': { weight: 30, reps: 10 },
  'lun-4': { weight: 18, reps: 12 },
  'lun-5': { reps: 12 },
  'mer-1': { reps: 6 },
  'mer-2': { weight: 60, reps: 10 },
  'mer-3': { weight: 50, reps: 12 },
  'mer-4': { weight: 20, reps: 15 },
  'mer-5': { weight: 12, reps: 12 },
  'ven-1': { weight: 60, reps: 10 },
  'ven-2': { weight: 40, reps: 12 },
  'ven-3': { weight: 24, reps: 10 },
  'ven-4': { weight: 12, reps: 12 },
};

// Note: J'ai mis des IDs Youtube génériques pour l'exemple. 
// Idéalement, remplacez par les IDs précis de vos vidéos préférées.
export const WORKOUT_PLAN: Record<string, ExerciseData[]> = {
  lundi: [
    { id: 'lun-1', title: 'Élévations Latérales', targetReps: 15, sets: 4, restTime: 90, tempo: "2-0-1-1", videoId: "3VcKaXpzqRo", isUnilateral: true, alternative: "Élévations Poulie" },
    { id: 'lun-2', title: 'Face Pull', targetReps: 15, sets: 4, restTime: 90, tempo: "2-0-1-2", videoId: "rep-EPVktec", alternative: "Oiseau Haltères" },
    { id: 'lun-3', title: 'Développé Incliné Haltères', targetReps: 10, sets: 4, restTime: 120, tempo: "3-1-1-0", videoId: "0G2_kHIv7p8", isUnilateral: true, alternative: "Développé Incliné Barre / Machine" },
    { id: 'lun-4', title: 'Développé Arnold', targetReps: 12, sets: 3, restTime: 90, tempo: "3-0-1-0", videoId: "6Z15_WdXMa4", isUnilateral: true },
    { id: 'lun-5', title: 'Dips (ou Ext. Triceps)', targetReps: 12, sets: 3, restTime: 90, tempo: "3-0-1-0", videoId: "2z8JmcrW-As" },
  ],
  mercredi: [
    { id: 'mer-1', title: 'Tractions', targetReps: 6, sets: 5, restTime: 120, tempo: "3-0-X-1", videoId: "eGo4IYlbE5g", alternative: "Tirage Vertical Poulie Haute" },
    { id: 'mer-2', title: 'Rowing Barre Pronation', targetReps: 10, sets: 4, restTime: 120, tempo: "3-0-1-1", videoId: "G8l_8chR5BE", alternative: "Rowing T-Bar / Haltère" },
    { id: 'mer-3', title: 'Tirage Horizontal', targetReps: 12, sets: 3, restTime: 90, tempo: "3-0-1-2", videoId: "GZbfZ033f74" },
    { id: 'mer-4', title: 'Pull-over Poulie', targetReps: 15, sets: 3, restTime: 60, tempo: "4-1-1-0", videoId: "H5-0X3j0-s0" },
    { id: 'mer-5', title: 'Curl Incliné', targetReps: 12, sets: 3, restTime: 60, tempo: "3-0-1-0", videoId: "soxrZlIl35U", isUnilateral: true },
    { id: 'mer-rappel', title: '⚡ RAPPEL PUSH : Pompes', targetReps: 20, sets: 3, isRappel: true, restTime: 60, videoId: "IODxDxX7oi4" },
  ],
  vendredi: [
    { id: 'ven-1', title: 'Romanian Deadlift (RDL)', targetReps: 10, sets: 4, restTime: 180, tempo: "4-1-1-0", videoId: "JCXUYuzwNrM", alternative: "Leg Curl Assis (si dos HS)" },
    { id: 'ven-2', title: 'Hip Thrust', targetReps: 12, sets: 4, restTime: 120, tempo: "2-1-X-2", videoId: "SEdqd1n0cvg" },
    { id: 'ven-3', title: 'Goblet Squat', targetReps: 12, sets: 4, restTime: 120, tempo: "3-1-1-0", videoId: "MeIiIdhvXT4", alternative: "Presse à cuisses" },
    { id: 'ven-4', title: 'Fentes Bulgares', targetReps: 10, sets: 3, restTime: 90, tempo: "3-0-1-0", videoId: "2C-uNgKwPLE", isUnilateral: true },
    { id: 'ven-rappel', title: '⚡ RAPPEL DOS : Tractions', targetReps: 8, sets: 3, isRappel: true, restTime: 90, videoId: "eGo4IYlbE5g" },
  ],
};
