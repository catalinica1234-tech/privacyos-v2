BEGIN;

-- Prisma es el único canal de datos de la aplicación.
-- RLS sin políticas mantiene cerrados los accesos directos de clientes.
ALTER TABLE "public"."sites" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."analyses" ENABLE ROW LEVEL SECURITY;

REVOKE ALL PRIVILEGES ON TABLE "public"."sites", "public"."analyses" FROM PUBLIC;

DO $$
DECLARE
  client_role text;
BEGIN
  FOR client_role IN
    SELECT rolname FROM pg_roles WHERE rolname IN ('anon', 'authenticated')
  LOOP
    EXECUTE format('REVOKE ALL PRIVILEGES ON TABLE "public"."sites", "public"."analyses" FROM %I', client_role);
  END LOOP;
END
$$;

COMMIT;
