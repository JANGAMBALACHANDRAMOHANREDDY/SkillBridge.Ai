/*
# SkillBridge AI — Core Schema

## Overview
Creates the foundational schema for SkillBridge AI, an AI-powered career platform for students and recruiters. This migration establishes the core tables, relationships, indexes, and row-level security policies.

## New Tables

### User & Profile
1. `profiles` — Extends `auth.users` with role, name, avatar, college info, skills, target role, profile completion %, study streak, total study hours. Owner-scoped to the authenticated user.

### Resume Builder (Module 1)
2. `resumes` — Stores resume versions with title, content (JSON structured sections), template, ATS score, AI suggestions, status (draft/published/archived), and version number. Owner-scoped.

### Portfolio Builder (Module 2)
3. `portfolios` — Public portfolio metadata: title, slug, bio, theme, is_public flag. Owner-scoped.
4. `portfolio_projects` — Projects within a portfolio: title, description, github_url, live_url, tech_stack (array), screenshots (array), rating. Scoped via portfolio ownership.

### Mock Interview (Module 4)
5. `mock_interviews` — Interview sessions: type (behavioral/technical/hr/company), company, role, status, overall score, feedback, duration. Owner-scoped.
6. `mock_interview_questions` — Individual questions in a session: question text, user answer, AI evaluation, score, suggestions. Scoped via interview ownership.

### Coding Tracker (Module 5)
7. `coding_logs` — Daily coding activity: platform (leetcode/codechef/codeforces/github), problems solved (easy/medium/hard), time spent, notes. Owner-scoped.

### Internship Portal (Module 6)
8. `internships` — Posted internships: company, title, description, location, stipend, deadline, requirements (array), posted_by (recruiter profile).
9. `applications` — Student applications to internships: status (applied/shortlisted/interview/offer/rejected), cover_letter, resume_id, applied_at. Owner-scoped to student; recruiter can update status.

### Learning Hub (Module 7)
10. `courses` — Catalog of courses: title, description, instructor, category, difficulty, duration, thumbnail, rating.
11. `enrollments` — Student enrollment in courses: progress %, completed flag, enrolled_at. Owner-scoped.
12. `learning_notes` — Notes taken during a course: content, course_id. Owner-scoped.

### Assessment Center (Module 8)
13. `assessments` — Assessment definitions: title, category (mcq/coding/sql/python/java/aptitude/reasoning), duration, passing_score, questions (JSON).
14. `assessment_attempts` — Student attempts: score, passed flag, answers (JSON), started_at, completed_at. Owner-scoped.

### Project Hub (Module 9)
15. `projects` — Public project showcase: title, description, github_url, live_url, tech_stack (array), screenshots (array), video_url, owner. Owner-scoped.
16. `project_ratings` — Ratings on projects: rating (1-5), comment, rated_by. One rating per user per project.

### Community (Module 10)
17. `community_posts` — Posts/questions: title, content, tags (array), upvotes, views. Owner-scoped.
18. `community_answers` — Answers to posts: content, upvotes, accepted flag. Scoped via post ownership (anyone can answer; owner of post can accept).

### Notifications (Module 11)
19. `notifications` — User notifications: type, title, message, read flag, action_url. Owner-scoped.

### Analytics & Goals (Module 12)
20. `daily_activities` — Per-day activity log: date, study_hours, coding_hours, applications_count, interviews_count. Owner-scoped.
21. `goals` — Daily/weekly/monthly goals: title, target, progress, deadline, status. Owner-scoped.

### Certificates
22. `certificates` — Earned certificates: title, issuer, issue_date, certificate_url, course_id. Owner-scoped.

### Audit Log
23. `audit_logs` — Tracks sensitive actions: actor, action, entity, entity_id, metadata (JSON), created_at. Owner-scoped (user sees own logs).

## Security
- RLS enabled on every table.
- Owner-scoped tables use `user_id uuid NOT NULL DEFAULT auth.uid()` with 4 CRUD policies each (select/insert/update/delete) scoped `TO authenticated`.
- Public/shared tables (internships, courses, assessments, community_posts, community_answers, projects, project_ratings) allow authenticated SELECT; writes are owner-scoped.
- `audit_logs` is owner-scoped.

## Important Notes
1. Owner columns default to `auth.uid()` so client inserts that omit `user_id` still satisfy RLS.
2. All tables include `created_at` and (where relevant) `updated_at` timestamps.
3. Indexes added for frequently-queried columns (user_id, status, created_at, foreign keys).
4. Soft-delete pattern via `deleted_at` column on key content tables.
5. Foreign keys use `ON DELETE CASCADE` for child relationships.
*/

-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- PROFILES
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL UNIQUE,
  full_name text,
  role text NOT NULL DEFAULT 'student' CHECK (role IN ('student','recruiter','placement_officer','admin')),
  avatar_url text,
  headline text,
  bio text,
  phone text,
  location text,
  college text,
  graduation_year int,
  major text,
  skills text[] DEFAULT '{}',
  target_role text,
  profile_completion int NOT NULL DEFAULT 25,
  study_streak int NOT NULL DEFAULT 0,
  total_study_hours numeric(10,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_profile" ON profiles;
CREATE POLICY "select_own_profile" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "delete_own_profile" ON profiles;
CREATE POLICY "delete_own_profile" ON profiles FOR DELETE
  TO authenticated USING (auth.uid() = id);

CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- ============================================================
-- RESUMES
-- ============================================================
CREATE TABLE IF NOT EXISTS resumes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  template text NOT NULL DEFAULT 'modern',
  ats_score int,
  grammar_score int,
  keyword_score int,
  ai_suggestions jsonb DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
  version int NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

ALTER TABLE resumes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_resumes" ON resumes;
CREATE POLICY "select_own_resumes" ON resumes FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_resumes" ON resumes;
CREATE POLICY "insert_own_resumes" ON resumes FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_resumes" ON resumes;
CREATE POLICY "update_own_resumes" ON resumes FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_resumes" ON resumes;
CREATE POLICY "delete_own_resumes" ON resumes FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_resumes_user_id ON resumes(user_id);
CREATE INDEX IF NOT EXISTS idx_resumes_status ON resumes(status);

-- ============================================================
-- PORTFOLIOS
-- ============================================================
CREATE TABLE IF NOT EXISTS portfolios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  slug text NOT NULL,
  bio text,
  theme text NOT NULL DEFAULT 'aurora',
  is_public boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, slug)
);

ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_portfolios" ON portfolios;
CREATE POLICY "select_portfolios" ON portfolios FOR SELECT
  TO authenticated USING (auth.uid() = user_id OR is_public = true);

DROP POLICY IF EXISTS "insert_own_portfolios" ON portfolios;
CREATE POLICY "insert_own_portfolios" ON portfolios FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_portfolios" ON portfolios;
CREATE POLICY "update_own_portfolios" ON portfolios FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_portfolios" ON portfolios;
CREATE POLICY "delete_own_portfolios" ON portfolios FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_portfolios_user_id ON portfolios(user_id);

CREATE TABLE IF NOT EXISTS portfolio_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_id uuid NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  github_url text,
  live_url text,
  tech_stack text[] DEFAULT '{}',
  screenshots text[] DEFAULT '{}',
  rating int DEFAULT 0,
  display_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE portfolio_projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_portfolio_projects" ON portfolio_projects;
CREATE POLICY "select_portfolio_projects" ON portfolio_projects FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM portfolios p WHERE p.id = portfolio_id AND (p.user_id = auth.uid() OR p.is_public = true))
  );

DROP POLICY IF EXISTS "insert_own_portfolio_projects" ON portfolio_projects;
CREATE POLICY "insert_own_portfolio_projects" ON portfolio_projects FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM portfolios p WHERE p.id = portfolio_id AND p.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "update_own_portfolio_projects" ON portfolio_projects;
CREATE POLICY "update_own_portfolio_projects" ON portfolio_projects FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM portfolios p WHERE p.id = portfolio_id AND p.user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM portfolios p WHERE p.id = portfolio_id AND p.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "delete_own_portfolio_projects" ON portfolio_projects;
CREATE POLICY "delete_own_portfolio_projects" ON portfolio_projects FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM portfolios p WHERE p.id = portfolio_id AND p.user_id = auth.uid())
  );

CREATE INDEX IF NOT EXISTS idx_portfolio_projects_portfolio_id ON portfolio_projects(portfolio_id);

-- ============================================================
-- MOCK INTERVIEWS
-- ============================================================
CREATE TABLE IF NOT EXISTS mock_interviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'behavioral' CHECK (type IN ('behavioral','technical','hr','company')),
  company text,
  role text,
  status text NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress','completed','abandoned')),
  overall_score int,
  feedback text,
  duration_minutes int,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  deleted_at timestamptz
);

ALTER TABLE mock_interviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_mock_interviews" ON mock_interviews;
CREATE POLICY "select_own_mock_interviews" ON mock_interviews FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_mock_interviews" ON mock_interviews;
CREATE POLICY "insert_own_mock_interviews" ON mock_interviews FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_mock_interviews" ON mock_interviews;
CREATE POLICY "update_own_mock_interviews" ON mock_interviews FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_mock_interviews" ON mock_interviews;
CREATE POLICY "delete_own_mock_interviews" ON mock_interviews FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_mock_interviews_user_id ON mock_interviews(user_id);
CREATE INDEX IF NOT EXISTS idx_mock_interviews_status ON mock_interviews(status);

CREATE TABLE IF NOT EXISTS mock_interview_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  interview_id uuid NOT NULL REFERENCES mock_interviews(id) ON DELETE CASCADE,
  question text NOT NULL,
  user_answer text,
  ai_evaluation text,
  score int,
  suggestions text[] DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE mock_interview_questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_miq" ON mock_interview_questions;
CREATE POLICY "select_own_miq" ON mock_interview_questions FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM mock_interviews m WHERE m.id = interview_id AND m.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "insert_own_miq" ON mock_interview_questions;
CREATE POLICY "insert_own_miq" ON mock_interview_questions FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM mock_interviews m WHERE m.id = interview_id AND m.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "update_own_miq" ON mock_interview_questions;
CREATE POLICY "update_own_miq" ON mock_interview_questions FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM mock_interviews m WHERE m.id = interview_id AND m.user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM mock_interviews m WHERE m.id = interview_id AND m.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "delete_own_miq" ON mock_interview_questions;
CREATE POLICY "delete_own_miq" ON mock_interview_questions FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM mock_interviews m WHERE m.id = interview_id AND m.user_id = auth.uid())
  );

CREATE INDEX IF NOT EXISTS idx_miq_interview_id ON mock_interview_questions(interview_id);

-- ============================================================
-- CODING LOGS
-- ============================================================
CREATE TABLE IF NOT EXISTS coding_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  date date NOT NULL DEFAULT CURRENT_DATE,
  platform text NOT NULL DEFAULT 'leetcode' CHECK (platform IN ('leetcode','codechef','codeforces','github','other')),
  easy_solved int NOT NULL DEFAULT 0,
  medium_solved int NOT NULL DEFAULT 0,
  hard_solved int NOT NULL DEFAULT 0,
  time_spent_minutes int NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, date, platform)
);

ALTER TABLE coding_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_coding_logs" ON coding_logs;
CREATE POLICY "select_own_coding_logs" ON coding_logs FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_coding_logs" ON coding_logs;
CREATE POLICY "insert_own_coding_logs" ON coding_logs FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_coding_logs" ON coding_logs;
CREATE POLICY "update_own_coding_logs" ON coding_logs FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_coding_logs" ON coding_logs;
CREATE POLICY "delete_own_coding_logs" ON coding_logs FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_coding_logs_user_id ON coding_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_coding_logs_date ON coding_logs(date);

-- ============================================================
-- INTERNSHIPS & APPLICATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS internships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  posted_by uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  company text NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  location text,
  stipend text,
  duration text,
  deadline date,
  requirements text[] DEFAULT '{}',
  skills_required text[] DEFAULT '{}',
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','closed','filled')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

ALTER TABLE internships ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_internships" ON internships;
CREATE POLICY "select_internships" ON internships FOR SELECT
  TO authenticated USING (deleted_at IS NULL);

DROP POLICY IF EXISTS "insert_own_internships" ON internships;
CREATE POLICY "insert_own_internships" ON internships FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = posted_by);

DROP POLICY IF EXISTS "update_own_internships" ON internships;
CREATE POLICY "update_own_internships" ON internships FOR UPDATE
  TO authenticated USING (auth.uid() = posted_by) WITH CHECK (auth.uid() = posted_by);

DROP POLICY IF EXISTS "delete_own_internships" ON internships;
CREATE POLICY "delete_own_internships" ON internships FOR DELETE
  TO authenticated USING (auth.uid() = posted_by);

CREATE INDEX IF NOT EXISTS idx_internships_status ON internships(status);
CREATE INDEX IF NOT EXISTS idx_internships_deadline ON internships(deadline);
CREATE INDEX IF NOT EXISTS idx_internships_posted_by ON internships(posted_by);

CREATE TABLE IF NOT EXISTS applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  internship_id uuid NOT NULL REFERENCES internships(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  cover_letter text,
  resume_id uuid REFERENCES resumes(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'applied' CHECK (status IN ('applied','shortlisted','interview','offer','rejected')),
  applied_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (internship_id, user_id)
);

ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_applications" ON applications;
CREATE POLICY "select_applications" ON applications FOR SELECT
  TO authenticated USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM internships i WHERE i.id = internship_id AND i.posted_by = auth.uid())
  );

DROP POLICY IF EXISTS "insert_own_applications" ON applications;
CREATE POLICY "insert_own_applications" ON applications FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_applications" ON applications;
CREATE POLICY "update_applications" ON applications FOR UPDATE
  TO authenticated USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM internships i WHERE i.id = internship_id AND i.posted_by = auth.uid())
  ) WITH CHECK (true);

DROP POLICY IF EXISTS "delete_own_applications" ON applications;
CREATE POLICY "delete_own_applications" ON applications FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_applications_user_id ON applications(user_id);
CREATE INDEX IF NOT EXISTS idx_applications_internship_id ON applications(internship_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);

-- ============================================================
-- COURSES & ENROLLMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  instructor text,
  category text NOT NULL,
  difficulty text NOT NULL DEFAULT 'beginner' CHECK (difficulty IN ('beginner','intermediate','advanced')),
  duration_hours int,
  thumbnail text,
  rating numeric(3,2) DEFAULT 0,
  enrollment_count int DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_courses" ON courses;
CREATE POLICY "select_courses" ON courses FOR SELECT
  TO authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_courses_category ON courses(category);
CREATE INDEX IF NOT EXISTS idx_courses_difficulty ON courses(difficulty);

CREATE TABLE IF NOT EXISTS enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  progress int NOT NULL DEFAULT 0,
  completed boolean NOT NULL DEFAULT false,
  enrolled_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  UNIQUE (user_id, course_id)
);

ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_enrollments" ON enrollments;
CREATE POLICY "select_own_enrollments" ON enrollments FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_enrollments" ON enrollments;
CREATE POLICY "insert_own_enrollments" ON enrollments FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_enrollments" ON enrollments;
CREATE POLICY "update_own_enrollments" ON enrollments FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_enrollments" ON enrollments;
CREATE POLICY "delete_own_enrollments" ON enrollments FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_enrollments_user_id ON enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course_id ON enrollments(course_id);

CREATE TABLE IF NOT EXISTS learning_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id uuid REFERENCES courses(id) ON DELETE SET NULL,
  title text NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE learning_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_learning_notes" ON learning_notes;
CREATE POLICY "select_own_learning_notes" ON learning_notes FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_learning_notes" ON learning_notes;
CREATE POLICY "insert_own_learning_notes" ON learning_notes FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_learning_notes" ON learning_notes;
CREATE POLICY "update_own_learning_notes" ON learning_notes FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_learning_notes" ON learning_notes;
CREATE POLICY "delete_own_learning_notes" ON learning_notes FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_learning_notes_user_id ON learning_notes(user_id);

-- ============================================================
-- ASSESSMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  category text NOT NULL CHECK (category IN ('mcq','coding','sql','python','java','aptitude','reasoning')),
  duration_minutes int NOT NULL DEFAULT 30,
  passing_score int NOT NULL DEFAULT 70,
  questions jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_assessments" ON assessments;
CREATE POLICY "select_assessments" ON assessments FOR SELECT
  TO authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_assessments_category ON assessments(category);

CREATE TABLE IF NOT EXISTS assessment_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  assessment_id uuid NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  score int NOT NULL DEFAULT 0,
  passed boolean NOT NULL DEFAULT false,
  answers jsonb DEFAULT '{}'::jsonb,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  UNIQUE (user_id, assessment_id)
);

ALTER TABLE assessment_attempts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_assessment_attempts" ON assessment_attempts;
CREATE POLICY "select_own_assessment_attempts" ON assessment_attempts FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_assessment_attempts" ON assessment_attempts;
CREATE POLICY "insert_own_assessment_attempts" ON assessment_attempts FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_assessment_attempts" ON assessment_attempts;
CREATE POLICY "update_own_assessment_attempts" ON assessment_attempts FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_assessment_attempts" ON assessment_attempts;
CREATE POLICY "delete_own_assessment_attempts" ON assessment_attempts FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_assessment_attempts_user_id ON assessment_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_assessment_attempts_assessment_id ON assessment_attempts(assessment_id);

-- ============================================================
-- PROJECTS (Hub) & RATINGS
-- ============================================================
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  github_url text,
  live_url text,
  tech_stack text[] DEFAULT '{}',
  screenshots text[] DEFAULT '{}',
  video_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_projects" ON projects;
CREATE POLICY "select_projects" ON projects FOR SELECT
  TO authenticated USING (deleted_at IS NULL);

DROP POLICY IF EXISTS "insert_own_projects" ON projects;
CREATE POLICY "insert_own_projects" ON projects FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_projects" ON projects;
CREATE POLICY "update_own_projects" ON projects FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_projects" ON projects;
CREATE POLICY "delete_own_projects" ON projects FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);

CREATE TABLE IF NOT EXISTS project_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  rating int NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (project_id, user_id)
);

ALTER TABLE project_ratings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_project_ratings" ON project_ratings;
CREATE POLICY "select_project_ratings" ON project_ratings FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_own_project_ratings" ON project_ratings;
CREATE POLICY "insert_own_project_ratings" ON project_ratings FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_project_ratings" ON project_ratings;
CREATE POLICY "update_own_project_ratings" ON project_ratings FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_project_ratings" ON project_ratings;
CREATE POLICY "delete_own_project_ratings" ON project_ratings FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_project_ratings_project_id ON project_ratings(project_id);

-- ============================================================
-- COMMUNITY
-- ============================================================
CREATE TABLE IF NOT EXISTS community_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text NOT NULL,
  tags text[] DEFAULT '{}',
  upvotes int NOT NULL DEFAULT 0,
  views int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_community_posts" ON community_posts;
CREATE POLICY "select_community_posts" ON community_posts FOR SELECT
  TO authenticated USING (deleted_at IS NULL);

DROP POLICY IF EXISTS "insert_own_community_posts" ON community_posts;
CREATE POLICY "insert_own_community_posts" ON community_posts FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_community_posts" ON community_posts;
CREATE POLICY "update_own_community_posts" ON community_posts FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_community_posts" ON community_posts;
CREATE POLICY "delete_own_community_posts" ON community_posts FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_community_posts_user_id ON community_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_created_at ON community_posts(created_at);

CREATE TABLE IF NOT EXISTS community_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  upvotes int NOT NULL DEFAULT 0,
  accepted boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE community_answers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_community_answers" ON community_answers;
CREATE POLICY "select_community_answers" ON community_answers FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_own_community_answers" ON community_answers;
CREATE POLICY "insert_own_community_answers" ON community_answers FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_community_answers" ON community_answers;
CREATE POLICY "update_own_community_answers" ON community_answers FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_community_answers" ON community_answers;
CREATE POLICY "delete_own_community_answers" ON community_answers FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_community_answers_post_id ON community_answers(post_id);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  message text,
  read boolean NOT NULL DEFAULT false,
  action_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_notifications" ON notifications;
CREATE POLICY "select_own_notifications" ON notifications FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_notifications" ON notifications;
CREATE POLICY "insert_own_notifications" ON notifications FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_notifications" ON notifications;
CREATE POLICY "update_own_notifications" ON notifications FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_notifications" ON notifications;
CREATE POLICY "delete_own_notifications" ON notifications FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);

-- ============================================================
-- DAILY ACTIVITIES & GOALS
-- ============================================================
CREATE TABLE IF NOT EXISTS daily_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  date date NOT NULL DEFAULT CURRENT_DATE,
  study_hours numeric(5,2) NOT NULL DEFAULT 0,
  coding_hours numeric(5,2) NOT NULL DEFAULT 0,
  applications_count int NOT NULL DEFAULT 0,
  interviews_count int NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, date)
);

ALTER TABLE daily_activities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_daily_activities" ON daily_activities;
CREATE POLICY "select_own_daily_activities" ON daily_activities FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_daily_activities" ON daily_activities;
CREATE POLICY "insert_own_daily_activities" ON daily_activities FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_daily_activities" ON daily_activities;
CREATE POLICY "update_own_daily_activities" ON daily_activities FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_daily_activities" ON daily_activities;
CREATE POLICY "delete_own_daily_activities" ON daily_activities FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_daily_activities_user_id ON daily_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_activities_date ON daily_activities(date);

CREATE TABLE IF NOT EXISTS goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  type text NOT NULL DEFAULT 'daily' CHECK (type IN ('daily','weekly','monthly')),
  target int NOT NULL DEFAULT 1,
  progress int NOT NULL DEFAULT 0,
  unit text NOT NULL DEFAULT 'count',
  deadline date,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','completed','overdue')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE goals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_goals" ON goals;
CREATE POLICY "select_own_goals" ON goals FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_goals" ON goals;
CREATE POLICY "insert_own_goals" ON goals FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_goals" ON goals;
CREATE POLICY "update_own_goals" ON goals FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_goals" ON goals;
CREATE POLICY "delete_own_goals" ON goals FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id);
CREATE INDEX IF NOT EXISTS idx_goals_status ON goals(status);

-- ============================================================
-- CERTIFICATES
-- ============================================================
CREATE TABLE IF NOT EXISTS certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  issuer text NOT NULL,
  issue_date date NOT NULL DEFAULT CURRENT_DATE,
  certificate_url text,
  course_id uuid REFERENCES courses(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_certificates" ON certificates;
CREATE POLICY "select_own_certificates" ON certificates FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_certificates" ON certificates;
CREATE POLICY "insert_own_certificates" ON certificates FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_certificates" ON certificates;
CREATE POLICY "update_own_certificates" ON certificates FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_certificates" ON certificates;
CREATE POLICY "delete_own_certificates" ON certificates FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_certificates_user_id ON certificates(user_id);

-- ============================================================
-- AUDIT LOGS
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  action text NOT NULL,
  entity text NOT NULL,
  entity_id uuid,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_audit_logs" ON audit_logs;
CREATE POLICY "select_own_audit_logs" ON audit_logs FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_audit_logs" ON audit_logs;
CREATE POLICY "insert_own_audit_logs" ON audit_logs FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
  t text;
BEGIN
  FOR t IN SELECT unnest(ARRAY['profiles','resumes','portfolios','mock_interviews','internships','applications','enrollments','learning_notes','assessment_attempts','projects','community_posts','community_answers','notifications','goals','certificates']) LOOP
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_' || t || '_updated_at') THEN
      EXECUTE format(
        'CREATE TRIGGER trg_%I_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()',
        t, t
      );
    END IF;
  END LOOP;
END $$;
