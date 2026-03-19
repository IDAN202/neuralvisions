CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- TOPICS (Scout Agent output)
CREATE TABLE topics (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title       TEXT NOT NULL,
  summary     TEXT,
  source      TEXT NOT NULL,
  source_url  TEXT,
  thumbnail   TEXT,
  score       INTEGER DEFAULT 0,
  category    TEXT,
  status      TEXT DEFAULT 'pending',
  fetched_at  TIMESTAMPTZ DEFAULT NOW(),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- RESEARCH REPORTS
CREATE TABLE research_reports (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  topic_id     UUID REFERENCES topics(id) ON DELETE SET NULL,
  title        TEXT NOT NULL,
  query        TEXT NOT NULL,
  summary      TEXT,
  full_content TEXT,
  sources      JSONB DEFAULT '[]',
  status       TEXT DEFAULT 'pending',
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- VIDEO PROJECTS
CREATE TABLE projects (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  research_id     UUID REFERENCES research_reports(id) ON DELETE SET NULL,
  title           TEXT NOT NULL,
  description     TEXT,
  total_duration  INTEGER DEFAULT 360,
  status          TEXT DEFAULT 'draft',
  render_job_id   TEXT,
  render_url      TEXT,
  render_status   TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- SCENES (30 per project)
CREATE TABLE scenes (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id       UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  scene_number     INTEGER NOT NULL,
  duration         INTEGER DEFAULT 12,
  narration_text   TEXT,
  broll_suggestion TEXT,
  visual_prompt    TEXT,
  broll_url        TEXT,
  broll_pexels_id  TEXT,
  voiceover_url    TEXT,
  status           TEXT DEFAULT 'draft',
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, scene_number)
);

-- CLIP JOBS
CREATE TABLE clip_jobs (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  source_url   TEXT NOT NULL,
  transcript   TEXT,
  status       TEXT DEFAULT 'pending',
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- CLIPS (5 per job)
CREATE TABLE clips (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id       UUID REFERENCES clip_jobs(id) ON DELETE CASCADE NOT NULL,
  clip_number  INTEGER NOT NULL,
  start_time   NUMERIC NOT NULL,
  end_time     NUMERIC NOT NULL,
  caption      TEXT,
  hook_text    TEXT,
  render_url   TEXT,
  status       TEXT DEFAULT 'pending',
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- PUBLISH QUEUE
CREATE TABLE publish_queue (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  project_id   UUID REFERENCES projects(id) ON DELETE SET NULL,
  clip_id      UUID REFERENCES clips(id) ON DELETE SET NULL,
  platform     TEXT NOT NULL,
  title        TEXT,
  description  TEXT,
  tags         TEXT[],
  scheduled_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  status       TEXT DEFAULT 'scheduled',
  error_msg    TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- EDITOR SESSIONS
CREATE TABLE editor_sessions (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- EDITOR MESSAGES
CREATE TABLE editor_messages (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id   UUID REFERENCES editor_sessions(id) ON DELETE CASCADE NOT NULL,
  role         TEXT NOT NULL,
  content      TEXT NOT NULL,
  action_type  TEXT,
  action_data  JSONB,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- APPROVAL QUEUE VIEW
CREATE OR REPLACE VIEW approval_queue AS
  SELECT id, user_id, 'topic' AS entity_type, title, status, created_at FROM topics WHERE status = 'pending'
  UNION ALL
  SELECT id, user_id, 'research', title, status, created_at FROM research_reports WHERE status = 'pending'
  UNION ALL
  SELECT id, user_id, 'project', title, status, created_at FROM projects WHERE status = 'review'
  UNION ALL
  SELECT c.id, cj.user_id, 'clip', hook_text, c.status, c.created_at FROM clips c JOIN clip_jobs cj ON cj.id = c.job_id WHERE c.status = 'pending';

-- ROW LEVEL SECURITY
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE scenes ENABLE ROW LEVEL SECURITY;
ALTER TABLE clip_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE clips ENABLE ROW LEVEL SECURITY;
ALTER TABLE publish_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE editor_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE editor_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_topics" ON topics FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users_own_research" ON research_reports FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users_own_projects" ON projects FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users_own_scenes" ON scenes FOR ALL USING (
  project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
);
CREATE POLICY "users_own_clip_jobs" ON clip_jobs FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users_own_clips" ON clips FOR ALL USING (
  job_id IN (SELECT id FROM clip_jobs WHERE user_id = auth.uid())
);
CREATE POLICY "users_own_publish_queue" ON publish_queue FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users_own_editor_sessions" ON editor_sessions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users_own_editor_messages" ON editor_messages FOR ALL USING (
  session_id IN (SELECT id FROM editor_sessions WHERE user_id = auth.uid())
);

-- UPDATED_AT TRIGGERS
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_scenes_updated_at BEFORE UPDATE ON scenes FOR EACH ROW EXECUTE FUNCTION update_updated_at();
