-- V9: Add pgvector and RAG tables
CREATE EXTENSION IF NOT EXISTS vector;

-- HR Knowledge Base for RAG Assistant
CREATE TABLE hr_knowledge_base (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    embedding vector(1536),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Pre-embedded goal history for Semantic Search
CREATE TABLE goal_embeddings (
    goal_id UUID PRIMARY KEY REFERENCES goals(id) ON DELETE CASCADE,
    embedding vector(1536)
);

CREATE INDEX idx_goal_embeddings ON goal_embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
