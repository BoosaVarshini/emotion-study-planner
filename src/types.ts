export interface StudentRow {
  student_id: number;
  name: string;
  email: string;
  password_hash: string;
}

export interface MoodLogRow {
  mood_id: number;
  student_id: number;
  mood: string;
  energy_level: number;
  study_hours: number;
  log_date: string;
}

export interface StudyPlanRow {
  plan_id: number;
  student_id: number;
  subject: string;
  duration: number; // in minutes
  plan_date: string;
}

export interface PerformanceRow {
  performance_id: number;
  student_id: number;
  planned_hours: number;
  actual_hours: number;
  tasks_completed: number;
  completion_percentage: number;
  entry_date: string;
}

export interface PythonFile {
  name: string;
  path: string;
  language: string;
  description: string;
  code: string;
}
