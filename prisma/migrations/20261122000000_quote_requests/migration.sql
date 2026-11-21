BEGIN;

CREATE TABLE "public"."quote_requests" (
    "id" UUID NOT NULL,
    "fingerprint" TEXT NOT NULL,
    "segment" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "organization" TEXT,
    "sites" TEXT NOT NULL,
    "need" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "quote_requests_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "quote_requests_createdAt_idx" ON "public"."quote_requests"("createdAt");
ALTER TABLE "public"."quote_requests" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE "public"."quote_requests" FROM PUBLIC;

DO $$
DECLARE client_role text;
BEGIN
  FOR client_role IN SELECT rolname FROM pg_roles WHERE rolname IN ('anon', 'authenticated') LOOP
    EXECUTE format('REVOKE ALL ON TABLE "public"."quote_requests" FROM %I', client_role);
  END LOOP;
END
$$;

COMMIT;
