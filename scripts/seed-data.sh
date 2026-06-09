#!/bin/bash
set -e

echo "Seeding RickChat database..."

PG_HOST=${PG_HOST:-localhost}
PG_PORT=${PG_PORT:-5432}
PG_USER=${PG_USER:-rickchat}
PG_PASSWORD=${PG_PASSWORD:-rickchat}
PG_DB=${PG_DB:-rickchat}

export PGPASSWORD=$PG_PASSWORD

echo "Creating sample subscription plans..."
psql -h $PG_HOST -p $PG_PORT -U $PG_USER -d $PG_DB <<SQL
INSERT INTO subscription_plans (id, name, description, price, interval, features, limits)
VALUES
    ('plan_free', 'Free', 'Basic access', 0, 'monthly', '["Basic chat","100 msgs/day"]', '{"max_chats":10,"max_memories":50}'),
    ('plan_pro', 'Pro', 'Enhanced features', 19.99, 'monthly', '["Unlimited chat","AI models","Memory","50GB"]', '{"max_chats":-1,"max_memories":1000}'),
    ('plan_enterprise', 'Enterprise', 'Full platform', 99.99, 'monthly', '["Everything in Pro","Custom AI","1TB","API"]', '{"max_chats":-1,"max_memories":-1}')
ON CONFLICT (id) DO NOTHING;
SQL

echo "Creating system config..."
psql -h $PG_HOST -p $PG_PORT -U $PG_USER -d $PG_DB <<SQL
INSERT INTO system_config (key, value, description, is_public)
VALUES
    ('platform.name', '"RickChat"', 'Platform name', true),
    ('platform.version', '"1.0.0"', 'Version', true),
    ('ai.default_model', '"gpt-4"', 'Default AI model', true),
    ('ai.available_models', '["gpt-4","gpt-4-turbo","gpt-3.5-turbo","gemini-pro","claude-3-opus","claude-3-sonnet"]', 'Available models', true),
    ('maintenance_mode', 'false', 'Maintenance mode', true)
ON CONFLICT (key) DO NOTHING;
SQL

echo "Creating admin user..."
ADMIN_ID="usr_$(uuidgen 2>/dev/null | head -c 24 || echo "admin_seed_001")"
psql -h $PG_HOST -p $PG_PORT -U $PG_USER -d $PG_DB <<SQL
INSERT INTO users (id, email, username, display_name, role, email_verified)
VALUES ('$ADMIN_ID', 'admin@rickchat.ai', 'admin', 'System Administrator', 'super_admin', true)
ON CONFLICT (email) DO NOTHING;

INSERT INTO user_profiles (user_id) VALUES ('$ADMIN_ID')
ON CONFLICT (user_id) DO NOTHING;
SQL

echo "✅ Seed complete! Admin user: admin@rickchat.ai"
