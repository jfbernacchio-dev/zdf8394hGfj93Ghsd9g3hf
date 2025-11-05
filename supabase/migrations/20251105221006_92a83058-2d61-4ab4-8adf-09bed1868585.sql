-- Create patient-files bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'patient-files',
  'patient-files',
  false,
  52428800, -- 50MB limit
  NULL
)
ON CONFLICT (id) DO NOTHING;