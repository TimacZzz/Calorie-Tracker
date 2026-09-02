ALTER TABLE foods
  ADD COLUMN search_vector tsvector
  GENERATED ALWAYS AS (to_tsvector('english', description)) STORED;

CREATE INDEX foods_search_vector_idx ON foods USING GIN (search_vector);