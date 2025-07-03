-- Real-Time Markdown Database Setup for Supabase
-- Run these commands in your Supabase SQL editor

-- Enable Row Level Security
ALTER TABLE IF EXISTS auth.users ENABLE ROW LEVEL SECURITY;

-- Create documents table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS public.documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL DEFAULT 'Untitled Document',
    content TEXT DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    is_public BOOLEAN DEFAULT FALSE
);

-- Create user_contributions table (enhanced)
DROP TABLE IF EXISTS public.user_contributions;
CREATE TABLE public.user_contributions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    document_id UUID REFERENCES public.documents(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id TEXT NOT NULL,
    insertions INTEGER DEFAULT 0,
    deletions INTEGER DEFAULT 0,
    characters_added INTEGER DEFAULT 0,
    characters_removed INTEGER DEFAULT 0,
    time_spent_seconds INTEGER DEFAULT 0,
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(document_id, user_id, session_id)
);

-- Create document_versions table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS public.document_versions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    document_id UUID REFERENCES public.documents(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    changes_summary TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create document_shares table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS public.document_shares (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    document_id UUID REFERENCES public.documents(id) ON DELETE CASCADE,
    token TEXT UNIQUE NOT NULL,
    access_level TEXT CHECK (access_level IN ('view', 'edit')) DEFAULT 'view',
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON public.documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_updated_at ON public.documents(updated_at);
CREATE INDEX IF NOT EXISTS idx_user_contributions_document_id ON public.user_contributions(document_id);
CREATE INDEX IF NOT EXISTS idx_user_contributions_user_id ON public.user_contributions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_contributions_last_activity ON public.user_contributions(last_activity);
CREATE INDEX IF NOT EXISTS idx_user_contributions_session ON public.user_contributions(document_id, user_id, session_id);
CREATE INDEX IF NOT EXISTS idx_document_versions_document_id ON public.document_versions(document_id);
CREATE INDEX IF NOT EXISTS idx_document_shares_token ON public.document_shares(token);

-- Create or replace function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_documents_updated_at ON public.documents;
CREATE TRIGGER update_documents_updated_at
    BEFORE UPDATE ON public.documents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security Policies

-- Documents policies
DROP POLICY IF EXISTS "Users can view their own documents" ON public.documents;
CREATE POLICY "Users can view their own documents"
    ON public.documents FOR SELECT
    USING (auth.uid() = user_id OR is_public = true);

DROP POLICY IF EXISTS "Users can insert their own documents" ON public.documents;
CREATE POLICY "Users can insert their own documents"
    ON public.documents FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own documents" ON public.documents;
CREATE POLICY "Users can update their own documents"
    ON public.documents FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own documents" ON public.documents;
CREATE POLICY "Users can delete their own documents"
    ON public.documents FOR DELETE
    USING (auth.uid() = user_id);

-- User contributions policies
DROP POLICY IF EXISTS "Users can view contributions for documents they have access to" ON public.user_contributions;
CREATE POLICY "Users can view contributions for documents they have access to"
    ON public.user_contributions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.documents 
            WHERE id = document_id 
            AND (user_id = auth.uid() OR is_public = true)
        )
    );

DROP POLICY IF EXISTS "Users can insert their own contributions" ON public.user_contributions;
CREATE POLICY "Users can insert their own contributions"
    ON public.user_contributions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own contributions" ON public.user_contributions;
CREATE POLICY "Users can update their own contributions"
    ON public.user_contributions FOR UPDATE
    USING (auth.uid() = user_id);

-- Document versions policies
DROP POLICY IF EXISTS "Users can view versions for documents they have access to" ON public.document_versions;
CREATE POLICY "Users can view versions for documents they have access to"
    ON public.document_versions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.documents 
            WHERE id = document_id 
            AND (user_id = auth.uid() OR is_public = true)
        )
    );

DROP POLICY IF EXISTS "Users can create versions for their documents" ON public.document_versions;
CREATE POLICY "Users can create versions for their documents"
    ON public.document_versions FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.documents 
            WHERE id = document_id 
            AND user_id = auth.uid()
        )
    );

-- Document shares policies
DROP POLICY IF EXISTS "Users can view shares for their documents" ON public.document_shares;
CREATE POLICY "Users can view shares for their documents"
    ON public.document_shares FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.documents 
            WHERE id = document_id 
            AND user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can create shares for their documents" ON public.document_shares;
CREATE POLICY "Users can create shares for their documents"
    ON public.document_shares FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.documents 
            WHERE id = document_id 
            AND user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can update shares for their documents" ON public.document_shares;
CREATE POLICY "Users can update shares for their documents"
    ON public.document_shares FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.documents 
            WHERE id = document_id 
            AND user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can delete shares for their documents" ON public.document_shares;
CREATE POLICY "Users can delete shares for their documents"
    ON public.document_shares FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.documents 
            WHERE id = document_id 
            AND user_id = auth.uid()
        )
    );

-- Enable RLS on all tables
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_shares ENABLE ROW LEVEL SECURITY;

-- Enable realtime for collaboration
ALTER PUBLICATION supabase_realtime ADD TABLE public.documents;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_contributions;

-- Create a view for contribution statistics
CREATE OR REPLACE VIEW public.contribution_stats AS
SELECT 
    d.id as document_id,
    d.title,
    d.user_id as document_owner,
    COUNT(DISTINCT uc.user_id) as contributor_count,
    SUM(uc.insertions) as total_insertions,
    SUM(uc.deletions) as total_deletions,
    SUM(uc.characters_added) as total_characters_added,
    SUM(uc.characters_removed) as total_characters_removed,
    SUM(uc.time_spent_seconds) as total_time_spent,
    MAX(uc.last_activity) as last_contribution
FROM public.documents d
LEFT JOIN public.user_contributions uc ON d.id = uc.document_id
GROUP BY d.id, d.title, d.user_id;

-- Grant necessary permissions
GRANT SELECT ON public.contribution_stats TO authenticated;

-- Create function to clean up old contributions (optional)
CREATE OR REPLACE FUNCTION cleanup_old_contributions()
RETURNS void AS $$
BEGIN
    DELETE FROM public.user_contributions 
    WHERE last_activity < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

-- Create function to aggregate contributions by day
CREATE OR REPLACE FUNCTION get_daily_contributions(doc_id UUID, days_back INTEGER DEFAULT 30)
RETURNS TABLE (
    date DATE,
    contributor_count BIGINT,
    total_insertions BIGINT,
    total_deletions BIGINT,
    total_characters_added BIGINT,
    total_characters_removed BIGINT,
    total_time_spent BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        DATE(uc.last_activity) as date,
        COUNT(DISTINCT uc.user_id) as contributor_count,
        SUM(uc.insertions) as total_insertions,
        SUM(uc.deletions) as total_deletions,
        SUM(uc.characters_added) as total_characters_added,
        SUM(uc.characters_removed) as total_characters_removed,
        SUM(uc.time_spent_seconds) as total_time_spent
    FROM public.user_contributions uc
    WHERE uc.document_id = doc_id
    AND uc.last_activity >= CURRENT_DATE - INTERVAL '1 day' * days_back
    GROUP BY DATE(uc.last_activity)
    ORDER BY date DESC;
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION get_daily_contributions TO authenticated;

-- Sample document creation is commented out to prevent auto-generation
-- If you want to create a sample document manually, uncomment and run the following:

/*
INSERT INTO public.documents (title, content, user_id) 
SELECT 
    'Welcome to Real-Time Markdown!',
    '# Welcome to Real-Time Markdown Editor

This is a collaborative markdown editor that supports:

- **Real-time collaboration** with multiple users
- **Auto-save** functionality  
- **Version history** tracking
- **Contribution metrics** to see who contributed what
- **Shareable links** for easy collaboration

Start editing and see the magic happen! ✨

## Features

### Real-time Collaboration
Multiple users can edit the same document simultaneously. You''ll see other users'' cursors and changes in real-time.

### Auto-save
Your changes are automatically saved every few seconds, so you never lose your work.

### Version History
Every significant change is tracked, allowing you to revert to previous versions if needed.

### Contribution Metrics
See detailed statistics about who contributed what to each document.

### Sharing
Generate shareable links with view or edit permissions.

Happy writing! 🚀',
    (SELECT id FROM auth.users LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM public.documents);
*/

-- Note: Documents will be created empty when users create new documents

-- Clean up any existing documents with unwanted default content
UPDATE public.documents 
SET content = '' 
WHERE content LIKE '%Welcome to your new document%' 
   OR content LIKE '%Start typing here...%'
   OR content LIKE '%Welcome to Real-Time Markdown%';

-- If you want to delete all sample/test documents entirely, uncomment the following:
-- DELETE FROM public.documents WHERE content LIKE '%Welcome to Real-Time Markdown%';

-- Verify the cleanup worked
SELECT id, title, LEFT(content, 50) as content_preview, created_at 
FROM public.documents 
ORDER BY created_at DESC;

-- Add some sample contribution data for testing
-- (This will be populated automatically as users interact with documents)

COMMIT;
