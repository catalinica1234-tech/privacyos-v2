-- Aislamiento por espacio de trabajo anónimo (capability token).
-- Las filas existentes quedan con ownerHash NULL y dejan de ser visibles
-- para cualquier espacio de trabajo; no se borran datos.
ALTER TABLE "sites" ADD COLUMN "ownerHash" TEXT;
ALTER TABLE "analyses" ADD COLUMN "ownerHash" TEXT;

-- La unicidad de URL pasa a ser por espacio de trabajo.
DROP INDEX IF EXISTS "sites_url_key";
CREATE UNIQUE INDEX "sites_ownerHash_url_key" ON "sites"("ownerHash", "url");
CREATE INDEX "sites_ownerHash_idx" ON "sites"("ownerHash");
CREATE INDEX "analyses_ownerHash_createdAt_idx" ON "analyses"("ownerHash", "createdAt" DESC);
