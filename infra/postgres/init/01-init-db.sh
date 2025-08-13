#!/bin/bash
set -e

echo "Starting PostgreSQL initialization..."

# Create the pgvector extension
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    CREATE EXTENSION IF NOT EXISTS vector;
    
    -- Create basic tables for the notebooklm project
    CREATE TABLE IF NOT EXISTS documents (
        id SERIAL PRIMARY KEY,
        content TEXT,
        metadata JSONB,
        embedding vector(768),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE TABLE IF NOT EXISTS n8n_chat_histories (
        id SERIAL PRIMARY KEY,
        session_id VARCHAR(255),
        message TEXT,
        role VARCHAR(50),
        metadata JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    
    -- Create indexes for better performance
    CREATE INDEX IF NOT EXISTS idx_documents_embedding ON documents USING ivfflat (embedding vector_cosine_ops);
    CREATE INDEX IF NOT EXISTS idx_chat_session ON n8n_chat_histories(session_id);
    
    -- Grant permissions
    GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO $POSTGRES_USER;
    GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO $POSTGRES_USER;
EOSQL

echo "Database schema created successfully"

# Configure pg_hba.conf for host connections
echo "Configuring pg_hba.conf for external connections..."
cat >> /var/lib/postgresql/data/pg_hba.conf <<EOF

# Custom rules for NotebookLM
# Allow md5 authentication from any host
host    all             all             0.0.0.0/0               md5
host    all             all             ::/0                    md5
EOF

# Also ensure password is set correctly
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    ALTER USER $POSTGRES_USER WITH PASSWORD '$POSTGRES_PASSWORD';
EOSQL

echo "PostgreSQL configuration updated"

# Reload PostgreSQL configuration
pg_ctl reload -D /var/lib/postgresql/data || echo "Could not reload config, will restart"
