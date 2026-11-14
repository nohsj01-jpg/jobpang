CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, role, name, phone)
  VALUES (
    NEW.id,
    CASE
      WHEN NEW.raw_user_meta_data ->> 'role' = 'owner' THEN 'owner'::public.user_role
      ELSE 'worker'::public.user_role
    END,
    COALESCE(
      NULLIF(btrim(NEW.raw_user_meta_data ->> 'name'), ''),
      NULLIF(btrim(NEW.raw_user_meta_data ->> 'full_name'), ''),
      NULLIF(split_part(COALESCE(NEW.email, ''), '@', 1), ''),
      '신규 회원'
    ),
    COALESCE(NULLIF(btrim(NEW.raw_user_meta_data ->> 'phone'), ''), '미등록')
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();
