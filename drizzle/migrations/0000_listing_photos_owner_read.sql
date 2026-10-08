DROP POLICY IF EXISTS listing_photos_read ON storage.objects;
CREATE POLICY listing_photos_read_own ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'listing-photos' AND (storage.foldername(name))[1] = (auth.uid())::text);