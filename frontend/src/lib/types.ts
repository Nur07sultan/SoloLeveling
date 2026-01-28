export type ApiEnvelope<T> = {
  success: boolean;
  data: T | null;
  errors: Record<string, string[]> | null;
};

export type Paginated<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

export type UserDto = {
  id: number;
  username: string;
  email: string;
};

export type AuthResponse = {
  token: string;
  user: UserDto;
};

export type DashboardDto = {
  level: number;
  xp: number;
  rank: string;
  dev_score: number;
  balance: number;
  workouts_this_week: number;
  tasks_done: number;
  skills_in_progress: number;
};

export type HeroStatsDto = {
  level: number;
  xp: number;
  xp_to_next_level: number;
  rank: string;
  dev_score: number;
  strength: number;
  agility: number;
  intelligence: number;
  vitality: number;
  stat_points: number;
};

export type ProfileDto = {
  nickname: string;
  email: string;
  title: string;
  bio: string;
  avatar_url: string;
  rank: string;
  level: number;
  xp: number;
  key_skills: Array<{ id: number; category: string; name: string; level: number; status: string }>;
  active_projects: Array<{ id: number; name: string; is_commercial: boolean }>;
};

export type SkillDto = {
  id: number;
  node: number | null;
  category: string;
  name: string;
  level: number;
  mastery_xp?: number;
  status: "learning" | "practicing" | "mastered";
  created_at: string;
  updated_at: string;
};

export type SkillTrackDto = {
  id: number;
  code: string;
  title: string;
  order: number;
};

export type SkillNodeDto = {
  id: number;
  track: SkillTrackDto;
  code: string;
  title: string;
  description: string;
  max_level: number;
  order: number;
  prerequisites: number[];
};

export type ProjectDto = {
  id: number;
  name: string;
  is_commercial: boolean;
  description: string;
  stack: string;
  role: string;
  status: "active" | "paused" | "done";
  created_at: string;
};

export type TaskDto = {
  id: number;
  project: number;
  title: string;
  type: "daily" | "main" | "internship";
  status: "todo" | "in_progress" | "done";
  difficulty: number;
  xp_reward: number;
  deadline: string | null;
  notes: string;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type WorkoutDto = {
  id: number;
  type: string;
  duration: number;
  intensity: number;
  date: string;
  comment: string;
  xp_reward: number;
  created_at: string;
};

export type FinanceDto = {
  id: number;
  type: "income" | "expense";
  amount: string;
  category: string;
  date: string;
  description: string;
  created_at: string;
  updated_at: string;
};

export type LearningLogDto = {
  id: number;
  title: string;
  description: string;
  date: string;
  created_at: string;
};

export type SystemDto = {
  ranks: Array<{ code: string; title: string; min_dev_score: number }>;
  xp_rules: {
    level_formula: string;
    task: { formula: string };
    workout: { formula: string };
    learning_log: { fixed: number };
    skill: { per_level: number; mastered_bonus: number };
  };
};

export type FocusSessionDto = {
  id: number;
  kind: string;
  note: string;
  skill_node: number | null;
  skill_node_title: string | null;
  track_title: string | null;
  started_at: string;
  ended_at: string | null;
  canceled: boolean;
  duration_seconds: number;
  xp_awarded: number;
  created_at: string;
};

export type AIProposedAction = { name: string; args?: Record<string, unknown> } | null;

export type AIChatResponseDto = {
  reply: string;
  proposed_action: AIProposedAction;
  action_token: string | null;
  model: string;
};

export type AIActResponseDto = {
  action: { name: string; args?: Record<string, unknown> };
  result: unknown;
};

export type AIProfileDto = {
  preferred_name: string;
  how_to_address: string;
  about_me: string;
  assistant_persona: string;
};

export type AIProposedAction = {
  name: string;
  args?: Record<string, unknown>;
} | null;

export type AIChatResponseDto = {
  reply: string;
  proposed_action: AIProposedAction;
  action_token: string | null;
  model: string;
};

export type AIActResponseDto = {
  action: { name: string; args?: Record<string, unknown> };
  result: unknown;
};
