-- 00-create-extensions.sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- create whichever schema, tables, roles etc:
CREATE TABLE IF NOT EXISTS public.posta_cloud (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
); Optional: use a dedicated init folder (safer)