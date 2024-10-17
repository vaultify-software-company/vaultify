-- Enable HTTP extension
create extension http with schema extensions;

-- Enable vector extension
create extension vector with schema extensions;

-- Function to update modified column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now(); 
    RETURN NEW; 
END;
$$ language 'plpgsql';

-- Function to delete a message and all following messages
CREATE OR REPLACE FUNCTION delete_message_including_and_after(
    p_user_id UUID, 
    p_chat_id UUID, 
    p_sequence_number INT
)
RETURNS VOID AS $$
BEGIN
    DELETE FROM messages 
    WHERE user_id = p_user_id AND chat_id = p_chat_id AND sequence_number >= p_sequence_number;
END;
$$ LANGUAGE plpgsql;

-- Function to create duplicate messages for a new chat
CREATE OR REPLACE FUNCTION create_duplicate_messages_for_new_chat(old_chat_id UUID, new_chat_id UUID, new_user_id UUID)
RETURNS VOID AS $$
BEGIN
    INSERT INTO messages (user_id, chat_id, content, role, model, sequence_number, tokens, created_at, updated_at)
    SELECT new_user_id, new_chat_id, content, role, model, sequence_number, tokens, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    FROM messages
    WHERE chat_id = old_chat_id;
END;
$$ LANGUAGE plpgsql;

-- Policy to allow users to read their own files
CREATE POLICY "Allow users to read their own files"
ON storage.objects FOR SELECT
TO authenticated
USING (auth.uid()::text = owner_id::text);

-- Function to delete a storage object
CREATE OR REPLACE FUNCTION delete_storage_object(bucket TEXT, object TEXT, OUT status INT, OUT content TEXT)
RETURNS RECORD
LANGUAGE 'plpgsql'
SECURITY DEFINER
AS $$
DECLARE
<<<<<<< HEAD
  project_url TEXT := 'https://supabase.com/dashboard/project/mtczyjykphjxkpcxkdff/settings/general';
  service_role_key TEXT := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im10Y3p5anlrcGhqeGtwY3hrZGZmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcxNDcyMjIyOSwiZXhwIjoyMDMwMjk4MjI5fQ.ud48JJqWR-Rj5cU-fKFUR4jRvlKCsNKkq4X2J_23hhc'; -- full access needed for http request to storage
=======
  project_url TEXT := 'https://supabase.com/dashboard/project/xppjjlvjfkqavuhffxnn/settings/general';
  service_role_key TEXT := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhwcGpqbHZqZmtxYXZ1aGZmeG5uIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcxNDk5NzA2NywiZXhwIjoyMDMwNTczMDY3fQ.rSAiM1n_TjCkyZbomz-zR_CW7wOvz8IH9jQfxnDHcYI'; -- full access needed for http request to storage
>>>>>>> 48f802659c782b353b85473252b81d06dbc5042e
  url TEXT := project_url || '/storage/v1/object/' || bucket || '/' || object;
BEGIN
  SELECT
      INTO status, content
           result.status::INT, result.content::TEXT
      FROM extensions.http((
    'DELETE',
    url,
    ARRAY[extensions.http_header('authorization','Bearer ' || service_role_key)],
    NULL,
    NULL)::extensions.http_request) AS result;
END;
$$;

-- Function to delete a storage object from a bucket
CREATE OR REPLACE FUNCTION delete_storage_object_from_bucket(bucket_name TEXT, object_path TEXT, OUT status INT, OUT content TEXT)
RETURNS RECORD
LANGUAGE 'plpgsql'
SECURITY DEFINER
AS $$
BEGIN
  SELECT
      INTO status, content
           result.status, result.content
      FROM public.delete_storage_object(bucket_name, object_path) AS result;
END;
$$;