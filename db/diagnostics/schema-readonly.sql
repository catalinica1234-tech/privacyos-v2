-- Consulta de cat?logo. Devuelve una fila JSON y no lee datos de usuarios.
WITH app_tables AS (
  SELECT c.oid, c.relname, c.relrowsecurity, c.relforcerowsecurity, c.relowner
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND c.relname IN ('sites', 'analyses', 'quote_requests', 'quote_rate_windows') AND c.relkind IN ('r', 'p')
),
web_roles AS (
  SELECT oid, rolname
  FROM pg_roles
  WHERE rolname IN ('anon', 'authenticated', 'service_role')
)
SELECT jsonb_build_object(
  'postgres', current_setting('server_version'),
  'migrationHistoryExists', to_regclass('public._prisma_migrations') IS NOT NULL,
  'tables', COALESCE((
    SELECT jsonb_agg(jsonb_build_object(
      'name', t.relname,
      'rls', t.relrowsecurity,
      'forcedRls', t.relforcerowsecurity,
      'owner', pg_get_userbyid(t.relowner),
      'columns', (
        SELECT jsonb_agg(jsonb_build_object(
          'name', a.attname,
          'type', format_type(a.atttypid, a.atttypmod),
          'notNull', a.attnotnull
        ) ORDER BY a.attnum)
        FROM pg_attribute a
        WHERE a.attrelid = t.oid AND a.attnum > 0 AND NOT a.attisdropped
      ),
      'constraints', (
        SELECT jsonb_agg(jsonb_build_object('name', con.conname, 'definition', pg_get_constraintdef(con.oid)))
        FROM pg_constraint con WHERE con.conrelid = t.oid
      ),
      'indexes', (
        SELECT jsonb_agg(pg_get_indexdef(i.indexrelid))
        FROM pg_index i WHERE i.indrelid = t.oid
      ),
      'policies', (
        SELECT jsonb_agg(jsonb_build_object('name', p.policyname, 'roles', p.roles, 'command', p.cmd))
        FROM pg_policies p WHERE p.schemaname = 'public' AND p.tablename = t.relname
      ),
      'webRolePrivileges', (
        SELECT jsonb_agg(jsonb_build_object(
          'role', r.rolname,
          'select', has_table_privilege(r.oid, t.oid, 'SELECT'),
          'insert', has_table_privilege(r.oid, t.oid, 'INSERT'),
          'update', has_table_privilege(r.oid, t.oid, 'UPDATE'),
          'delete', has_table_privilege(r.oid, t.oid, 'DELETE'),
          'selectAnyColumn', has_any_column_privilege(r.oid, t.oid, 'SELECT')
        ))
        FROM web_roles r
      )
    ) ORDER BY t.relname)
    FROM app_tables t
  ), '[]'::jsonb),
  'extensions', COALESCE((SELECT jsonb_agg(extname ORDER BY extname) FROM pg_extension), '[]'::jsonb)
) AS diagnosis;
