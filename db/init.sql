-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "sites" (
    "id" TEXT NOT NULL,
    "ownerHash" TEXT,
    "url" TEXT NOT NULL,
    "nombre" TEXT,
    "notas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analyses" (
    "id" TEXT NOT NULL,
    "ownerHash" TEXT,
    "url" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "riskLevel" TEXT,
    "payload" JSONB NOT NULL,
    "notas" TEXT,
    "revisado" BOOLEAN NOT NULL DEFAULT false,
    "siteId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "analyses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "sites_ownerHash_url_key" ON "sites"("ownerHash", "url");

-- CreateIndex
CREATE INDEX "sites_ownerHash_idx" ON "sites"("ownerHash");

-- CreateIndex
CREATE INDEX "analyses_ownerHash_createdAt_idx" ON "analyses"("ownerHash", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "analyses_createdAt_idx" ON "analyses"("createdAt" DESC);

-- CreateIndex
CREATE INDEX "analyses_siteId_idx" ON "analyses"("siteId");

-- AddForeignKey
ALTER TABLE "analyses" ADD CONSTRAINT "analyses_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

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
