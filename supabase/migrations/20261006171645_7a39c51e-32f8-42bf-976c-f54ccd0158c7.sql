-- Likes / ratings: own rows only, public aggregates via function
DROP POLICY IF EXISTS likes_public_read ON public.listing_likes;
CREATE POLICY likes_read_own ON public.listing_likes FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS ratings_public_read ON public.listing_ratings;
CREATE POLICY ratings_read_own ON public.listing_ratings FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.get_listing_engagement(_listing_id uuid)
RETURNS TABLE(like_count bigint, rating_count bigint, rating_avg numeric)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT (SELECT count(*) FROM public.listing_likes WHERE listing_id = _listing_id),
         (SELECT count(*) FROM public.listing_ratings WHERE listing_id = _listing_id),
         (SELECT coalesce(avg(stars),0) FROM public.listing_ratings WHERE listing_id = _listing_id);
$$;
GRANT EXECUTE ON FUNCTION public.get_listing_engagement(uuid) TO anon, authenticated;

-- Profiles: full row for owner/admin, names via function
DROP POLICY IF EXISTS profiles_public_read ON public.profiles;
CREATE POLICY profiles_read_own_or_admin ON public.profiles FOR SELECT TO authenticated
  USING (auth.uid() = id OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE OR REPLACE FUNCTION public.get_display_names(_ids uuid[])
RETURNS TABLE(id uuid, display_name text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.id, p.display_name FROM public.profiles p WHERE p.id = ANY(_ids);
$$;
GRANT EXECUTE ON FUNCTION public.get_display_names(uuid[]) TO anon, authenticated;

-- Roles: own or admin
DROP POLICY IF EXISTS user_roles_public_read ON public.user_roles;
CREATE POLICY user_roles_read_own_or_admin ON public.user_roles FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::app_role));

-- Listing photos table: only photos attached to an existing listing
DROP POLICY IF EXISTS photos_public_read ON public.listing_photos;
CREATE POLICY photos_read_published ON public.listing_photos FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.listings l WHERE l.id = listing_photos.listing_id));

-- Storage: only files attached to a listing, or the uploader's own folder
DROP POLICY IF EXISTS listing_photos_read ON storage.objects;
CREATE POLICY listing_photos_read ON storage.objects FOR SELECT
  USING (bucket_id = 'listing-photos' AND (
    (storage.foldername(name))[1] = (auth.uid())::text
    OR EXISTS (SELECT 1 FROM public.listing_photos lp WHERE lp.storage_path = storage.objects.name)
  ));