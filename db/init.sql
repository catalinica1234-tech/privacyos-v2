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

