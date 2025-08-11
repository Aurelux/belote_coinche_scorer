/*
  # Create match history table for completed games

  1. New Tables
    - `match_history`
      - `id` (uuid, primary key)
      - `game_id` (uuid, foreign key to games)
      - `players` (jsonb, array of player objects)
      - `settings` (jsonb, game settings)
      - `final_scores` (jsonb, final team scores)
      - `winning_team` (text, winning team)
      - `hands_played` (integer, number of hands)
      - `duration` (integer, game duration in minutes)
      - `penalties` (jsonb, array of penalties)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `match_history` table
    - Add policies for match history access
*/

CREATE TABLE IF NOT EXISTS match_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id uuid REFERENCES games(id) ON DELETE CASCADE,
  players jsonb NOT NULL DEFAULT '[]',
  settings jsonb NOT NULL DEFAULT '{}',
  final_scores jsonb NOT NULL DEFAULT '{}',
  winning_team text NOT NULL,
  hands_played integer NOT NULL DEFAULT 0,
  duration integer NOT NULL DEFAULT 0,
  penalties jsonb NOT NULL DEFAULT '[]',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE match_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view match history"
  ON match_history
  FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Users can create match history"
  ON match_history
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);