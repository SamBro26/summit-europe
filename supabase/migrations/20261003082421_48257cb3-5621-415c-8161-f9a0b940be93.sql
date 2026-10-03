ALTER TABLE public.profiles
  ADD COLUMN trial_start_date timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN is_premium boolean NOT NULL DEFAULT false,
  ADD COLUMN subscription_status text NOT NULL DEFAULT 'trial';

UPDATE public.profiles p SET trial_start_date = u.created_at FROM auth.users u WHERE u.id = p.id;

ALTER TABLE public.profiles ADD CONSTRAINT profiles_subscription_status_check
  CHECK (subscription_status IN ('trial','free_with_ads','active_paid'));

CREATE OR REPLACE FUNCTION public.protect_profile_billing()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF (NEW.trial_start_date IS DISTINCT FROM OLD.trial_start_date
      OR NEW.is_premium IS DISTINCT FROM OLD.is_premium
      OR NEW.subscription_status IS DISTINCT FROM OLD.subscription_status)
     AND auth.uid() IS NOT NULL
     AND NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Subscription fields can only be changed by the system';
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER profiles_protect_billing BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.protect_profile_billing();