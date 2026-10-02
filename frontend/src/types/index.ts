export interface User {
  id: number;
  telegram_id: number;
  username?: string;
  first_name?: string;
  gender: string;
  age?: number;
  weight_kg?: number;
  height_cm?: number;
  biceps_cm?: number;
  chest_cm?: number;
  waist_cm?: number;
  hips_cm?: number;
  experience_level: 'beginner' | 'intermediate' | 'advanced';
  goal: 'hypertrophy' | 'strength' | 'fat_loss';
  is_onboarded: boolean;
  created_at: string;
}

export interface Exercise {
  id: number;
  name: string;
  category: 'chest' | 'back' | 'legs' | 'shoulders' | 'biceps' | 'triceps' | 'core';
  equipment: string;
  target_muscle?: string;
  instructions?: string;
  image_start_url?: string;
  image_end_url?: string;
  is_custom: boolean;
  created_by_user_id?: number;
}

export interface ProgramExercise {
  id: number;
  exercise_id: number;
  order_index: number;
  target_sets: number;
  target_reps: string;
  target_weight_kg?: number;
  rest_seconds: number;
  exercise?: Exercise;
}

export interface ProgramDay {
  id: number;
  day_number: number;
  name: string;
  exercises: ProgramExercise[];
}

export interface WorkoutProgram {
  id: number;
  user_id?: number;
  title: string;
  description?: string;
  split_type: 'full_body' | 'upper_lower' | 'ppl' | 'custom';
  days_per_week: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  is_active: boolean;
  days: ProgramDay[];
}

export interface WorkoutSet {
  id: number;
  session_id: number;
  exercise_id: number;
  set_number: number;
  weight_kg: number;
  reps: number;
  is_completed: boolean;
  rpe?: number;
  created_at: string;
  exercise?: Exercise;
}

export interface WorkoutSession {
  id: number;
  user_id: number;
  program_day_id?: number;
  name: string;
  started_at: string;
  finished_at?: string;
  duration_seconds: number;
  total_volume_kg: number;
  notes?: string;
  is_completed: boolean;
  sets: WorkoutSet[];
}

export interface Exercise1RM {
  exercise_id: number;
  exercise_name: string;
  category: string;
  estimated_1rm: number;
  best_weight: number;
  best_reps: number;
  last_performed_at?: string;
}

export interface AnalyticsStats {
  total_workouts: number;
  total_volume_kg: number;
  total_reps: number;
  total_sets: number;
  streak_weeks: number;
  top_exercises_1rm: Exercise1RM[];
}

export interface GenerateProgramParams {
  weight_kg: number;
  height_cm?: number;
  age?: number;
  gender: string;
  biceps_cm?: number;
  chest_cm?: number;
  waist_cm?: number;
  hips_cm?: number;
  experience_level: string;
  goal: string;
  split_type: string;
  days_per_week: number;
}

export interface WorkoutDay {
  id: number;
  dayNumber: number;
  name: string;
  focusMuscles: string;
  exerciseCount: number;
  lastRecordTag?: string;
  exercises?: Exercise[];
}

export interface UserStats {
  completedThisWeek: number;
  targetThisWeek: number;
  streakWeeks: number;
  totalVolumeTons: number;
  caloriesBurned?: number;
}
