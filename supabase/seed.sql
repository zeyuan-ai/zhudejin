-- 部署后先在 Supabase Auth 创建管理员，再把对应 UUID 写入 admins。
-- insert into public.admins (user_id) values ('管理员的 auth.users UUID');

-- 邀请码只保存 SHA-256。下面用 PostgreSQL 生成示例；请替换明文并妥善保管。
-- insert into public.invite_codes (label, code_hash, expires_at)
-- values ('首批测试用户', encode(digest('请替换为至少六位的邀请码', 'sha256'), 'hex'), now() + interval '30 days');
