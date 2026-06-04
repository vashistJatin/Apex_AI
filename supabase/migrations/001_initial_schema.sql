-- ============================================================
-- APEX AI — Supabase Database Schema
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── Profiles ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  username TEXT NOT NULL,
  binance_api_key_encrypted TEXT,
  binance_secret_encrypted TEXT,
  telegram_chat_id TEXT,
  default_mode TEXT DEFAULT 'SIM' CHECK (default_mode IN ('SIM', 'LIVE')),
  risk_profile TEXT DEFAULT 'balanced' CHECK (risk_profile IN ('conservative', 'balanced', 'aggressive')),
  daily_loss_limit DECIMAL DEFAULT 500,
  max_position_size DECIMAL DEFAULT 5,
  max_open_trades INTEGER DEFAULT 4,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Strategies ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS strategies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  risk_profile TEXT DEFAULT 'balanced',
  indicators JSONB DEFAULT '{}',
  risk_settings JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT FALSE,
  win_rate DECIMAL,
  total_trades INTEGER DEFAULT 0,
  net_profit DECIMAL DEFAULT 0,
  max_drawdown DECIMAL DEFAULT 0,
  sharpe_ratio DECIMAL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Trades ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS trades (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  side TEXT NOT NULL CHECK (side IN ('BUY', 'SELL')),
  order_type TEXT NOT NULL DEFAULT 'MARKET',
  quantity DECIMAL NOT NULL,
  price DECIMAL NOT NULL,
  total DECIMAL NOT NULL,
  stop_loss DECIMAL,
  take_profit DECIMAL,
  leverage INTEGER DEFAULT 1,
  status TEXT DEFAULT 'FILLED' CHECK (status IN ('PENDING', 'FILLED', 'CANCELLED', 'PARTIAL')),
  mode TEXT DEFAULT 'SIM' CHECK (mode IN ('SIM', 'LIVE')),
  pnl DECIMAL DEFAULT 0,
  fee DECIMAL DEFAULT 0,
  binance_order_id TEXT,
  filled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Positions ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS positions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  side TEXT NOT NULL CHECK (side IN ('LONG', 'SHORT')),
  size DECIMAL NOT NULL,
  entry_price DECIMAL NOT NULL,
  current_price DECIMAL,
  liquidation_price DECIMAL,
  leverage INTEGER DEFAULT 1,
  stop_loss DECIMAL,
  take_profit DECIMAL,
  pnl DECIMAL DEFAULT 0,
  pnl_percent DECIMAL DEFAULT 0,
  mode TEXT DEFAULT 'SIM',
  status TEXT DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'CLOSED')),
  opened_at TIMESTAMPTZ DEFAULT NOW(),
  closed_at TIMESTAMPTZ
);

-- ─── Signals ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS signals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  symbol TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('BUY', 'SELL', 'HOLD')),
  entry_price DECIMAL,
  stop_loss DECIMAL,
  take_profit_targets DECIMAL[],
  risk_reward_ratio TEXT,
  confidence_score INTEGER,
  reasoning TEXT,
  indicators JSONB,
  timeframe TEXT,
  agent_results JSONB,
  composite_score INTEGER,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Audit Logs ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  resource TEXT,
  details JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Row Level Security ───────────────────────────────────────────────────────
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE strategies ENABLE ROW LEVEL SECURITY;
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Profiles: users see only their own
CREATE POLICY "Users view own profile"
  ON profiles FOR ALL USING (auth.uid() = id);

-- Strategies: users manage only their own
CREATE POLICY "Users manage own strategies"
  ON strategies FOR ALL USING (auth.uid() = user_id);

-- Trades: users see only their own
CREATE POLICY "Users view own trades"
  ON trades FOR ALL USING (auth.uid() = user_id);

-- Positions: users see only their own
CREATE POLICY "Users view own positions"
  ON positions FOR ALL USING (auth.uid() = user_id);

-- Signals: public readable
CREATE POLICY "Signals are public readable"
  ON signals FOR SELECT USING (true);

-- ─── Indexes ──────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_trades_user_id ON trades(user_id);
CREATE INDEX IF NOT EXISTS idx_trades_symbol ON trades(symbol);
CREATE INDEX IF NOT EXISTS idx_trades_created_at ON trades(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_positions_user_id ON positions(user_id);
CREATE INDEX IF NOT EXISTS idx_positions_status ON positions(status);
CREATE INDEX IF NOT EXISTS idx_signals_symbol ON signals(symbol);
CREATE INDEX IF NOT EXISTS idx_signals_created_at ON signals(created_at DESC);

-- ─── Updated_at trigger ───────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER strategies_updated_at BEFORE UPDATE ON strategies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── Default strategies for new users ────────────────────────────────────────
-- Run after inserting a user via application logic
