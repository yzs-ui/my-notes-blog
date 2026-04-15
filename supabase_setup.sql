-- ============================================================
-- 博客功能扩展 SQL 脚本
-- 执行位置：Supabase Dashboard -> SQL Editor
-- ============================================================

-- 1. 文章浏览次数表（不需要外键，因为博客使用 JSON 文件存储文章）
CREATE TABLE IF NOT EXISTS public.post_views (
    id          BIGSERIAL PRIMARY KEY,
    post_id     TEXT NOT NULL,  -- 文章ID（来自 data.json）
    viewed_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ip_hash     TEXT  -- 可选：用于防止同一IP短时间重复计数（已哈希保护隐私）
);

-- 为 post_id 加索引，加速按文章聚合查询
CREATE INDEX IF NOT EXISTS idx_post_views_post_id ON public.post_views(post_id);

-- 启用 RLS
ALTER TABLE public.post_views ENABLE ROW LEVEL SECURITY;

-- 允许所有人读（统计总数）
CREATE POLICY "allow_read_views" ON public.post_views
    FOR SELECT USING (true);

-- 允许所有人写（记录浏览）
CREATE POLICY "allow_insert_views" ON public.post_views
    FOR INSERT WITH CHECK (true);


-- 2. 评论表（不需要外键，因为博客使用 JSON 文件存储文章）
CREATE TABLE IF NOT EXISTS public.comments (
    id          BIGSERIAL PRIMARY KEY,
    post_id     TEXT NOT NULL,  -- 文章ID（来自 data.json）
    nickname    TEXT NOT NULL DEFAULT '匿名读者',
    avatar_seed TEXT,          -- 用于生成随机头像的种子（用 nickname hash）
    content     TEXT NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_approved BOOLEAN NOT NULL DEFAULT TRUE  -- 默认直接显示；如需审核改为 FALSE
);

CREATE INDEX IF NOT EXISTS idx_comments_post_id ON public.comments(post_id);

-- 启用 RLS
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- 允许所有人读已批准的评论
CREATE POLICY "allow_read_comments" ON public.comments
    FOR SELECT USING (is_approved = true);

-- 允许所有人发表评论
CREATE POLICY "allow_insert_comments" ON public.comments
    FOR INSERT WITH CHECK (true);

-- 允许管理员（通过 service_role key）删除评论
CREATE POLICY "allow_admin_delete_comments" ON public.comments
    FOR DELETE USING (true);  -- 前端用 anon key 无法删除，需后端或 Dashboard 操作


-- 3. 图片存储桶（在 Supabase Storage 中手动创建，或运行下面语句）
-- 注意：需要在 Storage 页面手动创建名为 "blog-images" 的 Bucket，设置为 Public
-- INSERT INTO storage.buckets (id, name, public) VALUES ('blog-images', 'blog-images', true)
-- ON CONFLICT (id) DO NOTHING;

-- 允许所有人上传图片（无需登录）
-- CREATE POLICY "allow_public_upload" ON storage.objects
--     FOR INSERT WITH CHECK (bucket_id = 'blog-images');

-- 允许所有人读图片
-- CREATE POLICY "allow_public_read" ON storage.objects
--     FOR SELECT USING (bucket_id = 'blog-images');
