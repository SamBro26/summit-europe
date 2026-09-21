ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS views_count integer NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION public.increment_listing_views(_listing_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.listings SET views_count = views_count + 1 WHERE id = _listing_id;
$$;

GRANT EXECUTE ON FUNCTION public.increment_listing_views(uuid) TO anon, authenticated;

CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text,
  kind text NOT NULL DEFAULT 'admin',
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, UPDATE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications_read_own" ON public.notifications
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "notifications_update_own" ON public.notifications
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "notifications_admin_insert" ON public.notifications
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "notifications_admin_delete" ON public.notifications
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX IF NOT EXISTS notifications_user_unread_idx ON public.notifications (user_id, read_at);

CREATE OR REPLACE FUNCTION public.broadcast_notification(_title text, _body text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE inserted integer;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Only admins can broadcast notifications';
  END IF;
  INSERT INTO public.notifications (user_id, title, body, kind)
  SELECT p.id, _title, _body, 'broadcast' FROM public.profiles p;
  GET DIAGNOSTICS inserted = ROW_COUNT;
  RETURN inserted;
END;
$$;

GRANT EXECUTE ON FUNCTION public.broadcast_notification(text, text) TO authenticated;

ALTER TABLE public.notifications REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;