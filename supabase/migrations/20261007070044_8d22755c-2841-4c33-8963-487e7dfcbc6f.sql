CREATE OR REPLACE FUNCTION public.protect_profile_billing()
 RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public'
AS $$
BEGIN
  IF (NEW.trial_start_date IS DISTINCT FROM OLD.trial_start_date
      OR NEW.is_premium IS DISTINCT FROM OLD.is_premium
      OR NEW.subscription_status IS DISTINCT FROM OLD.subscription_status)
     AND auth.uid() IS NOT NULL
     AND coalesce(current_setting('app.billing_bypass', true), '') <> 'on'
     AND NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Subscription fields can only be changed by the system';
  END IF;
  RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.choose_free_plan()
 RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not signed in'; END IF;
  PERFORM set_config('app.billing_bypass', 'on', true);
  UPDATE public.profiles SET subscription_status = 'free_with_ads'
   WHERE id = auth.uid() AND is_premium = false
     AND trial_start_date < now() - interval '30 days';
  PERFORM set_config('app.billing_bypass', 'off', true);
END; $$;

CREATE OR REPLACE FUNCTION public.ensure_trial_warning(_title text, _body text)
 RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE p record;
BEGIN
  IF auth.uid() IS NULL THEN RETURN false; END IF;
  SELECT * INTO p FROM public.profiles WHERE id = auth.uid();
  IF p IS NULL OR p.is_premium OR p.subscription_status <> 'trial' THEN RETURN false; END IF;
  IF p.trial_start_date + interval '30 days' <= now()
     OR p.trial_start_date + interval '25 days' > now() THEN RETURN false; END IF;
  IF EXISTS (SELECT 1 FROM public.notifications WHERE user_id = auth.uid() AND kind = 'trial_warning') THEN RETURN false; END IF;
  INSERT INTO public.notifications (user_id, title, body, kind)
  VALUES (auth.uid(), left(_title, 200), left(_body, 1000), 'trial_warning');
  RETURN true;
END; $$;

REVOKE EXECUTE ON FUNCTION public.choose_free_plan() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.ensure_trial_warning(text, text) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.choose_free_plan() TO authenticated;
GRANT EXECUTE ON FUNCTION public.ensure_trial_warning(text, text) TO authenticated;