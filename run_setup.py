"""快速执行 Supabase 配置"""
import urllib.request
import urllib.parse
import json
import sys

PROJECT_REF = "uiubbfkqfflhhqlkuovg"
TOKEN = "sbp_6f03643224efb86ddf708d8a0e36eb483b890fe3"
PROXY = "http://127.0.0.1:7890"

SQL = """
-- Storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('blog-images', 'blog-images', true, 5242880, ARRAY['image/jpeg','image/png','image/gif','image/webp'])
ON CONFLICT (id) DO UPDATE SET public=true;

-- Storage policies
CREATE POLICY allow_public_upload ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'blog-images');
CREATE POLICY allow_public_read ON storage.objects FOR SELECT USING (bucket_id = 'blog-images');
"""

# 创建代理处理器
proxy_handler = urllib.request.ProxyHandler({
    "http": PROXY,
    "https": PROXY
})
opener = urllib.request.build_opener(proxy_handler)

# 发送请求
url = f"https://api.supabase.com/v1/projects/{PROJECT_REF}/database/query"
data = json.dumps({"query": SQL}).encode()
headers = {
    "Authorization": f"Bearer {TOKEN}",
    "Content-Type": "application/json"
}

req = urllib.request.Request(url, data=data, headers=headers, method="POST")

try:
    with opener.open(req, timeout=60) as resp:
        result = resp.read().decode()
        print("[OK] Database config success!")
        print(result[:500] if len(result) > 500 else result)
except urllib.error.HTTPError as e:
    body = e.read().decode()
    print(f"[ERROR] HTTP {e.code}")
    print(body)
except Exception as e:
    print(f"[ERROR] {e}")
