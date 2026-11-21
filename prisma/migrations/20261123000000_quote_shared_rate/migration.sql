BEGIN;

CREATE TABLE "public"."quote_rate_windows" (
    "key" TEXT NOT NULL,
    "windowStart" TIMESTAMP(3) NOT NULL,
    "count" INTEGER NOT NULL,
    CONSTRAINT "quote_rate_windows_pkey" PRIMARY KEY ("key", "windowStart")
);

CREATE INDEX "quote_rate_windows_windowStart_idx" ON "public"."quote_rate_windows"("windowStart");
ALTER TABLE "public"."quote_rate_windows" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE "public"."quote_rate_windows" FROM PUBLIC;

DO $$
DECLARE client_role text;
BEGIN
  FOR client_role IN SELECT rolname FROM pg_roles WHERE rolname IN ('anon', 'authenticated') LOOP
    EXECUTE format('REVOKE ALL ON TABLE "public"."quote_rate_windows" FROM %I', client_role);
  END LOOP;
END
$$;

COMMIT;
