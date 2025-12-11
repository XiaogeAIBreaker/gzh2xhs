-- 事件明细
CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  ts TIMESTAMP NOT NULL,
  name TEXT NOT NULL,
  user_id TEXT,
  session_id TEXT,
  ip TEXT,
  referrer TEXT,
  campaign TEXT,
  device TEXT,
  geo TEXT,
  variant TEXT,
  model TEXT,
  reason TEXT
);

-- 订单与收入
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  ts TIMESTAMP NOT NULL,
  user_id TEXT,
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL,
  plan TEXT,
  channel TEXT,
  campaign TEXT,
  status TEXT NOT NULL
);

-- 成本明细
CREATE TABLE IF NOT EXISTS costs (
  id TEXT PRIMARY KEY,
  ts TIMESTAMP NOT NULL,
  kind TEXT NOT NULL,
  unit_cost NUMERIC NOT NULL,
  qty NUMERIC NOT NULL,
  amount NUMERIC NOT NULL,
  meta JSON
);

-- 用户画像
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  created_at TIMESTAMP NOT NULL,
  age_group TEXT,
  region TEXT,
  income_band TEXT,
  segment TEXT
);

-- 每日KPI汇总
CREATE TABLE IF NOT EXISTS daily_kpi (
  day DATE PRIMARY KEY,
  dau INT,
  generate_ok INT,
  export_zip INT,
  mrr NUMERIC,
  cac NUMERIC,
  churn_rate NUMERIC
);

