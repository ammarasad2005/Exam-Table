-- Table Definition
CREATE TABLE lost_found_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('lost', 'found')),
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  location TEXT NOT NULL,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  contact_info TEXT NOT NULL,
  is_resolved BOOLEAN DEFAULT false,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE lost_found_items ENABLE ROW LEVEL SECURITY;

-- Policies for lost_found_items
-- Allow anyone to read items
CREATE POLICY "Allow public read access"
ON lost_found_items
FOR SELECT
USING (true);

-- Allow anyone to insert items
CREATE POLICY "Allow public insert access"
ON lost_found_items
FOR INSERT
WITH CHECK (true);

-- Allow anyone to update items (for marking as resolved)
CREATE POLICY "Allow public update access"
ON lost_found_items
FOR UPDATE
USING (true);

-- Allow anyone to delete items (for demo purposes)
CREATE POLICY "Allow public delete access"
ON lost_found_items
FOR DELETE
USING (true);

-- Storage Bucket Definition
INSERT INTO storage.buckets (id, name, public) 
VALUES ('lost_found_images', 'lost_found_images', true);

-- Policies for storage
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'lost_found_images' );

CREATE POLICY "Public Upload"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'lost_found_images' );
