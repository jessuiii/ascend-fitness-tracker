-- ============================================
-- Gamified Fitness Tracker — Supabase Schema
-- ============================================
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New Query)

-- 1. Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  height NUMERIC NOT NULL DEFAULT 170,
  weight NUMERIC NOT NULL DEFAULT 70,
  selected_path TEXT NOT NULL DEFAULT 'strength' CHECK (selected_path IN ('shred', 'strength', 'hybrid')),
  gym_experience TEXT NOT NULL DEFAULT 'experienced' CHECK (gym_experience IN ('beginner', 'experienced')),
  workout_split TEXT NOT NULL DEFAULT 'ppl' CHECK (workout_split IN ('ppl', 'upper_lower', 'bro_split', 'full_body', 'custom')),
  schedule JSONB,                         -- day → {type: "Push", label: "Custom Name"}
  skipped_muscle_groups TEXT[],           -- e.g. '{"Legs"}' for injury
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Workouts table
CREATE TABLE IF NOT EXISTS workouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  muscle_group TEXT NOT NULL,
  exercise_name TEXT NOT NULL,
  weight NUMERIC NOT NULL DEFAULT 0,
  reps INTEGER NOT NULL DEFAULT 1,
  sets INTEGER NOT NULL DEFAULT 1,
  estimated_1rm NUMERIC NOT NULL DEFAULT 0,
  date DATE NOT NULL DEFAULT CURRENT_DATE
);

-- 3. Strength scores table
CREATE TABLE IF NOT EXISTS strength_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  total_strength_score NUMERIC NOT NULL DEFAULT 0,
  tier_name TEXT NOT NULL DEFAULT 'Iron',
  squat_1rm NUMERIC NOT NULL DEFAULT 0,
  bench_1rm NUMERIC NOT NULL DEFAULT 0,
  deadlift_1rm NUMERIC NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Chat conversations table
CREATE TABLE IF NOT EXISTS chat_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'New Conversation',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Chat messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES chat_conversations(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  sender TEXT NOT NULL CHECK (sender IN ('user', 'ai')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Custom routines table
CREATE TABLE IF NOT EXISTS custom_routines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  muscle_groups TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- Indexes for performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_workouts_user_id ON workouts(user_id);
CREATE INDEX IF NOT EXISTS idx_workouts_date ON workouts(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_strength_scores_user_id ON strength_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON chat_messages(user_id, created_at);

-- ============================================
-- Row Level Security (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE strength_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_routines ENABLE ROW LEVEL SECURITY;

-- Profiles: users can only read/write their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Workouts: users can only read/write their own workouts
CREATE POLICY "Users can view own workouts" ON workouts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own workouts" ON workouts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own workouts" ON workouts
  FOR DELETE USING (auth.uid() = user_id);

-- Strength scores: users can only read/write their own scores
CREATE POLICY "Users can view own strength scores" ON strength_scores
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own strength scores" ON strength_scores
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own strength scores" ON strength_scores
  FOR UPDATE USING (auth.uid() = user_id);

-- Chat conversations: users can only read/write their own
CREATE POLICY "Users can view own conversations" ON chat_conversations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own conversations" ON chat_conversations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own conversations" ON chat_conversations
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own conversations" ON chat_conversations
  FOR DELETE USING (auth.uid() = user_id);

-- Chat messages: users can only read/write their own messages
CREATE POLICY "Users can view own messages" ON chat_messages
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own messages" ON chat_messages
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================
-- Planned Workouts (per-day exercise plan)
-- ============================================
-- Run this if it doesn't exist yet:
CREATE TABLE IF NOT EXISTS planned_workouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day_of_week TEXT NOT NULL,           -- 'Monday', 'Tuesday', etc.
  exercise_name TEXT NOT NULL,
  muscle_group TEXT NOT NULL,
  target_sets INTEGER NOT NULL DEFAULT 3,
  target_rep_range TEXT NOT NULL DEFAULT '8-10',  -- '2-4','4-6','6-8','8-10','10-12','12-15','15+'
  target_weight NUMERIC NOT NULL DEFAULT 0,
  -- Progression state: 'base' = at base range, 'next' = pushed to next range this cycle
  progression_state TEXT NOT NULL DEFAULT 'base' CHECK (progression_state IN ('base', 'next')),
  custom_day_label TEXT,               -- e.g. 'Super Chest Day'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE planned_workouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own planned workouts" ON planned_workouts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own planned workouts" ON planned_workouts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own planned workouts" ON planned_workouts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own planned workouts" ON planned_workouts
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_planned_workouts_user_day ON planned_workouts(user_id, day_of_week);
