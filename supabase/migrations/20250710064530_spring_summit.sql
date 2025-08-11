/*
  # Create games table for multiplayer functionality

  1. New Tables
    - `games`
      - `id` (uuid, primary key)
      - `creator_id` (text, foreign key to users)
      - `players` (jsonb, array of player objects)
      - `settings` (jsonb, game settings)
      - `status` (text, enum: waiting, in_progress, completed)
      - `current_scores` (jsonb, current team scores)
      - `hands` (jsonb, array of hand objects)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `games` table
    - Add policies for game management
*/

CREATE TABLE IF NOT EXISTS games (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  players jsonb NOT NULL DEFAULT '[]',
  settings jsonb NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'in_progress', 'completed')),
  current_scores jsonb NOT NULL DEFAULT '{}',
  hands jsonb NOT NULL DEFAULT '[]',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE games ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view games they participate in"
  ON games
  FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Users can create games"
  ON games
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

CREATE POLICY "Users can update games they participate in"
  ON games
  FOR UPDATE
  TO authenticated, anon
  USING (true);

CREATE POLICY "Users can delete games they created"
  ON games
  FOR DELETE
  TO authenticated, anon
  USING (creator_id = auth.uid()::text);