/*
# Add lesson tracking and community upvote support

## Overview
Adds tables for course lesson tracking (Learning Hub) and community upvote tracking (Community module), plus RPC functions for safe concurrent upvote toggling and view incrementing.

## New Tables
1. `course_lessons` — Lessons within a course: title, content, duration_minutes, display_order. Course-scoped (CASCADE on course delete). Authenticated SELECT (shared content).
2. `lesson_progress` — Per-user lesson completion tracking: completed flag, completed_at. Owner-scoped. Unique per user+lesson.
3. `post_upvotes` — Tracks which user upvoted which community post. Owner-scoped, unique per user+post.
4. `answer_upvotes` — Tracks which user upvoted which community answer. Owner-scoped, unique per user+answer.

## New Functions (SECURITY DEFINER)
1. `toggle_post_upvote(p_post_id uuid)` — Toggles a user's upvote on a post, updates the `upvotes` count on `community_posts`, returns `{ upvoted boolean, count int }`.
2. `toggle_answer_upvote(p_answer_id uuid)` — Same for community answers.
3. `increment_post_views(p_post_id uuid)` — Increments `views` on a community post (for view tracking when a post is opened).

## Seed Data
- Inserts 3 lessons per existing course (Introduction, Core Concepts, Advanced Topics) if none exist.

## Security
- RLS enabled on all new tables.
- `course_lessons`: authenticated SELECT only (shared course content, no writes from frontend).
- `lesson_progress`, `post_upvotes`, `answer_upvotes`: owner-scoped CRUD (user_id DEFAULT auth.uid(), 4 policies each).
- RPCs are SECURITY DEFINER so they can update count columns on posts/answers the caller doesn't own.
*/

-- ============================================================
-- COURSE LESSONS
-- ============================================================
CREATE TABLE IF NOT EXISTS course_lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text,
  duration_minutes int NOT NULL DEFAULT 10,
  display_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE course_lessons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_course_lessons" ON course_lessons;
CREATE POLICY "select_course_lessons" ON course_lessons FOR SELECT
  TO authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_course_lessons_course_id ON course_lessons(course_id);

-- ============================================================
-- LESSON PROGRESS (owner-scoped)
-- ============================================================
CREATE TABLE IF NOT EXISTS lesson_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id uuid NOT NULL REFERENCES course_lessons(id) ON DELETE CASCADE,
  completed boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, lesson_id)
);

ALTER TABLE lesson_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_lesson_progress" ON lesson_progress;
CREATE POLICY "select_own_lesson_progress" ON lesson_progress FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_lesson_progress" ON lesson_progress;
CREATE POLICY "insert_own_lesson_progress" ON lesson_progress FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_lesson_progress" ON lesson_progress;
CREATE POLICY "update_own_lesson_progress" ON lesson_progress FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_lesson_progress" ON lesson_progress;
CREATE POLICY "delete_own_lesson_progress" ON lesson_progress FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_lesson_progress_user_id ON lesson_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_lesson_id ON lesson_progress(lesson_id);

-- ============================================================
-- POST UPVOTES (owner-scoped)
-- ============================================================
CREATE TABLE IF NOT EXISTS post_upvotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id uuid NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, post_id)
);

ALTER TABLE post_upvotes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_post_upvotes" ON post_upvotes;
CREATE POLICY "select_own_post_upvotes" ON post_upvotes FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_post_upvotes" ON post_upvotes;
CREATE POLICY "insert_own_post_upvotes" ON post_upvotes FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_post_upvotes" ON post_upvotes;
CREATE POLICY "delete_own_post_upvotes" ON post_upvotes FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_post_upvotes_post_id ON post_upvotes(post_id);

-- ============================================================
-- ANSWER UPVOTES (owner-scoped)
-- ============================================================
CREATE TABLE IF NOT EXISTS answer_upvotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  answer_id uuid NOT NULL REFERENCES community_answers(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, answer_id)
);

ALTER TABLE answer_upvotes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_answer_upvotes" ON answer_upvotes;
CREATE POLICY "select_own_answer_upvotes" ON answer_upvotes FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_answer_upvotes" ON answer_upvotes;
CREATE POLICY "insert_own_answer_upvotes" ON answer_upvotes FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_answer_upvotes" ON answer_upvotes;
CREATE POLICY "delete_own_answer_upvotes" ON answer_upvotes FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_answer_upvotes_answer_id ON answer_upvotes(answer_id);

-- ============================================================
-- RPC: TOGGLE POST UPVOTE
-- ============================================================
CREATE OR REPLACE FUNCTION toggle_post_upvote(p_post_id uuid)
RETURNS TABLE(upvoted boolean, count int)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO post_upvotes (user_id, post_id) VALUES (auth.uid(), p_post_id)
    ON CONFLICT (user_id, post_id) DO NOTHING;

  IF FOUND THEN
    UPDATE community_posts SET upvotes = upvotes + 1 WHERE id = p_post_id;
    RETURN QUERY SELECT true, upvotes FROM community_posts WHERE id = p_post_id;
  ELSE
    DELETE FROM post_upvotes WHERE user_id = auth.uid() AND post_id = p_post_id;
    UPDATE community_posts SET upvotes = GREATEST(0, upvotes - 1) WHERE id = p_post_id;
    RETURN QUERY SELECT false, upvotes FROM community_posts WHERE id = p_post_id;
  END IF;
END;
$$;

-- ============================================================
-- RPC: TOGGLE ANSWER UPVOTE
-- ============================================================
CREATE OR REPLACE FUNCTION toggle_answer_upvote(p_answer_id uuid)
RETURNS TABLE(upvoted boolean, count int)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO answer_upvotes (user_id, answer_id) VALUES (auth.uid(), p_answer_id)
    ON CONFLICT (user_id, answer_id) DO NOTHING;

  IF FOUND THEN
    UPDATE community_answers SET upvotes = upvotes + 1 WHERE id = p_answer_id;
    RETURN QUERY SELECT true, upvotes FROM community_answers WHERE id = p_answer_id;
  ELSE
    DELETE FROM answer_upvotes WHERE user_id = auth.uid() AND answer_id = p_answer_id;
    UPDATE community_answers SET upvotes = GREATEST(0, upvotes - 1) WHERE id = p_answer_id;
    RETURN QUERY SELECT false, upvotes FROM community_answers WHERE id = p_answer_id;
  END IF;
END;
$$;

-- ============================================================
-- RPC: INCREMENT POST VIEWS
-- ============================================================
CREATE OR REPLACE FUNCTION increment_post_views(p_post_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE community_posts SET views = views + 1 WHERE id = p_post_id;
END;
$$;

-- ============================================================
-- SEED: COURSE LESSONS (3 per course)
-- ============================================================
DO $$
DECLARE
  c record;
  lesson_idx int;
BEGIN
  FOR c IN SELECT id, title FROM courses ORDER BY title LOOP
    IF NOT EXISTS (SELECT 1 FROM course_lessons WHERE course_id = c.id) THEN
      FOR lesson_idx IN 1..3 LOOP
        INSERT INTO course_lessons (course_id, title, content, duration_minutes, display_order)
        VALUES (
          c.id,
          CASE lesson_idx
            WHEN 1 THEN 'Introduction & Fundamentals'
            WHEN 2 THEN 'Core Concepts & Hands-on Practice'
            WHEN 3 THEN 'Advanced Topics & Real-world Applications'
          END,
          'Comprehensive lesson covering key concepts with examples, code samples, and exercises for ' || c.title || '.',
          30,
          lesson_idx
        );
      END LOOP;
    END IF;
  END LOOP;
END $$;
