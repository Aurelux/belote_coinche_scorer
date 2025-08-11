/*
  # Create friendships table

  1. New Tables
    - `friendships`
      - `id` (uuid, primary key)
      - `user_id` (text, foreign key to users)
      - `friend_id` (text, foreign key to users)
      - `status` (text, enum: pending, accepted, blocked)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `friendships` table
    - Add policies for friendship management
*/

CREATE TABLE IF NOT EXISTS friendships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  friend_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'blocked')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, friend_id)
);

ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their friendships"
  ON friendships
  FOR ALL
  TO authenticated, anon
  USING (user_id = auth.uid()::text OR friend_id = auth.uid()::text);

CREATE POLICY "Users can view friendships"
  ON friendships
  FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Users can create friendships"
  ON friendships
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

CREATE POLICY "Users can update friendships"
  ON friendships
  FOR UPDATE
  TO authenticated, anon
  USING (true);

CREATE POLICY "Users can delete friendships"
  ON friendships
  FOR DELETE
  TO authenticated, anon
  USING (true);