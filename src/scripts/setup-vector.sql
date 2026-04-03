-- SQL para configurar o Supabase Vector (pgvector) no projeto Pacto Ágil

-- 1. Habilitar a extensão vector
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Criar a tabela para armazenar cláusulas vetorizadas
CREATE TABLE IF NOT EXISTS clausulas (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  content text NOT NULL,
  embedding vector(768), -- Dimensão correspondente ao text-embedding-004 do Gemini
  metadata jsonb,
  criado_em timestamp with time zone DEFAULT now()
);

-- 3. Habilitar RLS (Opcional, mas recomendado)
ALTER TABLE clausulas ENABLE ROW LEVEL SECURITY;

-- 4. Função para busca por similaridade (Cosseno)
-- Esta função será chamada pelo servidor para encontrar as cláusulas mais próximas ao query
CREATE OR REPLACE FUNCTION match_clausulas (
  query_embedding vector(768),
  match_threshold float,
  match_count int
)
RETURNS TABLE (
  id uuid,
  content text,
  metadata jsonb,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    clausulas.id,
    clausulas.content,
    clausulas.metadata,
    1 - (clausulas.embedding <=> query_embedding) AS similarity
  FROM clausulas
  WHERE 1 - (clausulas.embedding <=> query_embedding) > match_threshold
  ORDER BY clausulas.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
