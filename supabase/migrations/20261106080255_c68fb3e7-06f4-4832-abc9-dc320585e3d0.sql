CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TYPE public.ad_kind AS ENUM ('supply','demand');
CREATE TYPE public.property_type AS ENUM ('apartment','house_villa','chalet','commercial_shop','building_land','agricultural_land');
CREATE TYPE public.transaction_type AS ENUM ('sale','rent');
CREATE TYPE public.app_role AS ENUM ('admin','moderator','user');
CREATE TABLE public.profiles (id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE, display_name text, phone text, banned_at timestamptz, ban_reason text, trial_start_date timestamptz NOT NULL DEFAULT now(), is_premium boolean NOT NULL DEFAULT false, subscription_status text NOT NULL DEFAULT 'trial' CHECK (subscription_status IN ('trial','free_with_ads','active_paid')), created_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated; GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE TABLE public.user_roles (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, role public.app_role NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), UNIQUE (user_id, role));
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_roles TO authenticated; GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role) $$;
CREATE OR REPLACE FUNCTION public.is_banned(_user_id uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$ SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = _user_id AND banned_at IS NOT NULL) $$;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon; REVOKE ALL ON FUNCTION public.is_banned(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role; GRANT EXECUTE ON FUNCTION public.is_banned(uuid) TO authenticated, service_role;
CREATE POLICY user_roles_read_own_or_admin ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY user_roles_admin_write ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY profiles_read_own_or_admin ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY profiles_insert_own ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY profiles_update_own ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY profiles_admin_update ON public.profiles FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name) VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email,'@',1))) ON CONFLICT (id) DO NOTHING;
  IF lower(NEW.email) = 'body05122@gmail.com' THEN INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin') ON CONFLICT DO NOTHING; END IF;
  RETURN NEW;
END; $$;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
CREATE OR REPLACE FUNCTION public.protect_profile_billing() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF (NEW.trial_start_date IS DISTINCT FROM OLD.trial_start_date OR NEW.is_premium IS DISTINCT FROM OLD.is_premium OR NEW.subscription_status IS DISTINCT FROM OLD.subscription_status)
     AND auth.uid() IS NOT NULL AND coalesce(current_setting('app.billing_bypass', true), '') <> 'on' AND NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Subscription fields can only be changed by the system';
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER profiles_protect_billing BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.protect_profile_billing();
CREATE TABLE public.listings (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), author_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE, kind public.ad_kind NOT NULL, property_type public.property_type NOT NULL, transaction_type public.transaction_type NOT NULL, country_code text NOT NULL, region text NOT NULL, city text NOT NULL, price_eur numeric(12,2), description text, phone text, views_count integer NOT NULL DEFAULT 0, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT ON public.listings TO anon; GRANT SELECT, INSERT, UPDATE, DELETE ON public.listings TO authenticated; GRANT ALL ON public.listings TO service_role;
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
CREATE POLICY listings_public_read ON public.listings FOR SELECT USING (true);
CREATE POLICY listings_insert_own ON public.listings FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id AND NOT public.is_banned(auth.uid()));
CREATE POLICY listings_update_own ON public.listings FOR UPDATE TO authenticated USING (auth.uid() = author_id) WITH CHECK (auth.uid() = author_id);
CREATE POLICY listings_delete_own ON public.listings FOR DELETE TO authenticated USING (auth.uid() = author_id);
CREATE POLICY listings_admin_delete ON public.listings FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER listings_updated_at BEFORE UPDATE ON public.listings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE OR REPLACE FUNCTION public.lock_listing_location() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.country_code IS DISTINCT FROM OLD.country_code OR NEW.region IS DISTINCT FROM OLD.region OR NEW.city IS DISTINCT FROM OLD.city OR NEW.kind IS DISTINCT FROM OLD.kind THEN
    RAISE EXCEPTION 'Location cannot be changed after the ad is published';
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER listings_lock_location BEFORE UPDATE ON public.listings FOR EACH ROW EXECUTE FUNCTION public.lock_listing_location();
CREATE INDEX listings_location_idx ON public.listings (country_code, region, city);
CREATE INDEX listings_kind_idx ON public.listings (kind, created_at DESC);
CREATE OR REPLACE FUNCTION public.increment_listing_views(_listing_id uuid) RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$ UPDATE public.listings SET views_count = views_count + 1 WHERE id = _listing_id; $$;
GRANT EXECUTE ON FUNCTION public.increment_listing_views(uuid) TO anon, authenticated;
CREATE TABLE public.listing_photos (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE, url text NOT NULL, storage_path text, sort_order int NOT NULL DEFAULT 0, created_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT ON public.listing_photos TO anon; GRANT SELECT, INSERT, UPDATE, DELETE ON public.listing_photos TO authenticated; GRANT ALL ON public.listing_photos TO service_role;
ALTER TABLE public.listing_photos ENABLE ROW LEVEL SECURITY;
CREATE POLICY photos_read_published ON public.listing_photos FOR SELECT USING (EXISTS (SELECT 1 FROM public.listings l WHERE l.id = listing_photos.listing_id));
CREATE POLICY photos_write_own ON public.listing_photos FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.listings l WHERE l.id = listing_id AND l.author_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM public.listings l WHERE l.id = listing_id AND l.author_id = auth.uid()));
CREATE POLICY listing_photos_admin_delete ON public.listing_photos FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE INDEX listing_photos_listing_idx ON public.listing_photos (listing_id, sort_order);
CREATE TABLE public.listing_likes (listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE, user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE, created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY (listing_id, user_id));
GRANT SELECT, INSERT, DELETE ON public.listing_likes TO authenticated; GRANT ALL ON public.listing_likes TO service_role;
ALTER TABLE public.listing_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY likes_read_own ON public.listing_likes FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY likes_insert_own ON public.listing_likes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY likes_delete_own ON public.listing_likes FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE TABLE public.listing_ratings (listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE, user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE, stars smallint NOT NULL CHECK (stars BETWEEN 1 AND 5), created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY (listing_id, user_id));
GRANT SELECT, INSERT, UPDATE, DELETE ON public.listing_ratings TO authenticated; GRANT ALL ON public.listing_ratings TO service_role;
ALTER TABLE public.listing_ratings ENABLE ROW LEVEL SECURITY;
CREATE POLICY ratings_read_own ON public.listing_ratings FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY ratings_insert_own ON public.listing_ratings FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY ratings_update_own ON public.listing_ratings FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY ratings_delete_own ON public.listing_ratings FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE OR REPLACE FUNCTION public.get_listing_engagement(_listing_id uuid) RETURNS TABLE(like_count bigint, rating_count bigint, rating_avg numeric) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT (SELECT count(*) FROM public.listing_likes WHERE listing_id = _listing_id), (SELECT count(*) FROM public.listing_ratings WHERE listing_id = _listing_id), (SELECT coalesce(avg(stars),0) FROM public.listing_ratings WHERE listing_id = _listing_id); $$;
GRANT EXECUTE ON FUNCTION public.get_listing_engagement(uuid) TO anon, authenticated;
CREATE OR REPLACE FUNCTION public.get_display_names(_ids uuid[]) RETURNS TABLE(id uuid, display_name text) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$ SELECT p.id, p.display_name FROM public.profiles p WHERE p.id = ANY(_ids); $$;
GRANT EXECUTE ON FUNCTION public.get_display_names(uuid[]) TO anon, authenticated;
CREATE TABLE public.messages (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE, sender_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE, recipient_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE, body text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 2000), read_at timestamptz, created_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT, INSERT, UPDATE ON public.messages TO authenticated; GRANT ALL ON public.messages TO service_role;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY messages_read_own ON public.messages FOR SELECT TO authenticated USING (auth.uid() = sender_id OR auth.uid() = recipient_id);
CREATE POLICY messages_insert_own ON public.messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = sender_id AND sender_id <> recipient_id AND NOT public.is_banned(auth.uid()));
CREATE POLICY messages_recipient_can_mark_read ON public.messages FOR UPDATE TO authenticated USING (auth.uid() = recipient_id) WITH CHECK (auth.uid() = recipient_id);
CREATE INDEX messages_thread_idx ON public.messages (listing_id, created_at);
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
CREATE TABLE public.listing_reports (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE, reporter_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE, reason text NOT NULL, details text, status text NOT NULL DEFAULT 'open', created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT, INSERT, UPDATE, DELETE ON public.listing_reports TO authenticated; GRANT ALL ON public.listing_reports TO service_role;
ALTER TABLE public.listing_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY reports_insert_own ON public.listing_reports FOR INSERT TO authenticated WITH CHECK (auth.uid() = reporter_id AND NOT public.is_banned(auth.uid()));
CREATE POLICY reports_read_own_or_admin ON public.listing_reports FOR SELECT TO authenticated USING (auth.uid() = reporter_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY reports_admin_update ON public.listing_reports FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY reports_admin_delete ON public.listing_reports FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER listing_reports_updated_at BEFORE UPDATE ON public.listing_reports FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TABLE public.notifications (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE, title text NOT NULL, body text, kind text NOT NULL DEFAULT 'admin', read_at timestamptz, created_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated; GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY notifications_read_own ON public.notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY notifications_update_own ON public.notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY notifications_admin_insert ON public.notifications FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY notifications_admin_delete ON public.notifications FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE INDEX notifications_user_unread_idx ON public.notifications (user_id, read_at);
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
CREATE OR REPLACE FUNCTION public.broadcast_notification(_title text, _body text) RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE inserted integer;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Only admins can broadcast notifications'; END IF;
  INSERT INTO public.notifications (user_id, title, body, kind) SELECT p.id, _title, _body, 'broadcast' FROM public.profiles p;
  GET DIAGNOSTICS inserted = ROW_COUNT; RETURN inserted;
END; $$;
REVOKE EXECUTE ON FUNCTION public.broadcast_notification(text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.broadcast_notification(text, text) TO authenticated;
CREATE OR REPLACE FUNCTION public.choose_free_plan() RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not signed in'; END IF;
  PERFORM set_config('app.billing_bypass', 'on', true);
  UPDATE public.profiles SET subscription_status = 'free_with_ads' WHERE id = auth.uid() AND is_premium = false AND trial_start_date < now() - interval '30 days';
  PERFORM set_config('app.billing_bypass', 'off', true);
END; $$;
CREATE OR REPLACE FUNCTION public.ensure_trial_warning(_title text, _body text) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE p record;
BEGIN
  IF auth.uid() IS NULL THEN RETURN false; END IF;
  SELECT * INTO p FROM public.profiles WHERE id = auth.uid();
  IF p IS NULL OR p.is_premium OR p.subscription_status <> 'trial' THEN RETURN false; END IF;
  IF p.trial_start_date + interval '30 days' <= now() OR p.trial_start_date + interval '25 days' > now() THEN RETURN false; END IF;
  IF EXISTS (SELECT 1 FROM public.notifications WHERE user_id = auth.uid() AND kind = 'trial_warning') THEN RETURN false; END IF;
  INSERT INTO public.notifications (user_id, title, body, kind) VALUES (auth.uid(), left(_title,200), left(_body,1000), 'trial_warning');
  RETURN true;
END; $$;
REVOKE EXECUTE ON FUNCTION public.choose_free_plan() FROM PUBLIC, anon; REVOKE EXECUTE ON FUNCTION public.ensure_trial_warning(text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.choose_free_plan() TO authenticated; GRANT EXECUTE ON FUNCTION public.ensure_trial_warning(text, text) TO authenticated;
CREATE TABLE public.subscriptions (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, stripe_subscription_id text NOT NULL UNIQUE, stripe_customer_id text NOT NULL, product_id text, price_id text, status text NOT NULL DEFAULT 'active', current_period_start timestamptz, current_period_end timestamptz, cancel_at_period_end boolean NOT NULL DEFAULT false, environment text NOT NULL DEFAULT 'sandbox', created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
CREATE INDEX idx_subscriptions_user_id ON public.subscriptions(user_id);
GRANT SELECT ON public.subscriptions TO authenticated; GRANT ALL ON public.subscriptions TO service_role;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY subscriptions_read_own ON public.subscriptions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE TRIGGER subscriptions_updated_at BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE POLICY listing_photos_read_own ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'listing-photos' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY listing_photos_insert_own ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'listing-photos' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY listing_photos_update_own ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'listing-photos' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY listing_photos_delete_own ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'listing-photos' AND (storage.foldername(name))[1] = auth.uid()::text);