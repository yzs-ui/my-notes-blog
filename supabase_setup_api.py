"""
通过 Supabase Management API 完成以下配置：
1. 执行 SQL（创建 post_views、comments 表 + RLS 策略）
2. 创建 blog-images Storage Bucket（Public）
3. 配置 Storage Policies

注意：需要 Supabase Personal Access Token
获取地址：https://supabase.com/dashboard/account/tokens
"""
import urllib.request
import urllib.parse
import json
import sys

# ============================================================
# 配置区
# ============================================================
PROJECT_REF = "uiubbfkqfflhhqlkuovg"
# 注意：这是 anon key，无法执行管理 API，需要 access token
# 请从 https://supabase.com/dashboard/account/tokens 获取 Personal Access Token
ACCESS_TOKEN = ""  # 填入后运行

PROXY = "http://127.0.0.1:7890"

# ============================================================
# SQL 语句
# ============================================================
SQL = """
CREATE TABLE IF NOT EXISTS public.post_views (
    id          BIGSERIAL PRIMARY KEY,
    post_id     TEXT NOT NULL,
    viewed_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ip_hash     TEXT
);
CREATE INDEX IF NOT EXISTS idx_post_views_post_id ON public.post_views(post_id);
ALTER TABLE public.post_views ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='allow_read_views' AND tablename='post_views') THEN
    CREATE POLICY "allow_read_views" ON public.post_views FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='allow_insert_views' AND tablename='post_views') THEN
    CREATE POLICY "allow_insert_views" ON public.post_views FOR INSERT WITH CHECK (true);
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.comments (
    id          BIGSERIAL PRIMARY KEY,
    post_id     TEXT NOT NULL,
    nickname    TEXT NOT NULL DEFAULT '匿名读者',
    avatar_seed TEXT,
    content     TEXT NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_approved BOOLEAN NOT NULL DEFAULT TRUE
);
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON public.comments(post_id);
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='allow_read_comments' AND tablename='comments') THEN
    CREATE POLICY "allow_read_comments" ON public.comments FOR SELECT USING (is_approved = true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='allow_insert_comments' AND tablename='comments') THEN
    CREATE POLICY "allow_insert_comments" ON public.comments FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='allow_admin_delete_comments' AND tablename='comments') THEN
    CREATE POLICY "allow_admin_delete_comments" ON public.comments FOR DELETE USING (true);
  END IF;
END $$;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('blog-images', 'blog-images', true, 5242880, ARRAY['image/jpeg','image/png','image/gif','image/webp'])
ON CONFLICT (id) DO UPDATE SET public=true;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='allow_public_upload' AND tablename='objects') THEN
    CREATE POLICY "allow_public_upload" ON storage.objects
      FOR INSERT WITH CHECK (bucket_id = 'blog-images');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='allow_public_read' AND tablename='objects') THEN
    CREATE POLICY "allow_public_read" ON storage.objects
      FOR SELECT USING (bucket_id = 'blog-images');
  END IF;
END $$;
"""

def request_with_proxy(url, method="GET", data=None, headers=None, proxy=PROXY):
    proxy_handler = urllib.request.ProxyHandler({
        "http": proxy,
        "https": proxy,
    })
    opener = urllib.request.build_opener(proxy_handler)
    
    body = json.dumps(data).encode() if data else None
    h = {"Content-Type": "application/json", "Accept": "application/json"}
    if headers:
        h.update(headers)
    
    req = urllib.request.Request(url, data=body, headers=h, method=method)
    try:
        with opener.open(req, timeout=30) as resp:
            return resp.status, json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode())

def run_sql(token):
    print("📡 执行 SQL...")
    url = f"https://api.supabase.com/v1/projects/{PROJECT_REF}/database/query"
    status, result = request_with_proxy(
        url, "POST",
        data={"query": SQL},
        headers={"Authorization": f"Bearer {token}"}
    )
    print(f"  状态: {status}")
    print(f"  结果: {json.dumps(result, ensure_ascii=False, indent=2)[:500]}")
    return status == 200

if __name__ == "__main__":
    token = ACCESS_TOKEN or (len(sys.argv) > 1 and sys.argv[1])
    if not token:
        print("❌ 请提供 Personal Access Token")
        print("   用法: python supabase_setup_api.py <token>")
        print("   获取: https://supabase.com/dashboard/account/tokens")
        sys.exit(1)
    
    ok = run_sql(token)
    if ok:
        print("✅ 所有配置完成！")
    else:
        print("❌ 部分配置失败，请查看错误信息")
