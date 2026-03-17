#!/usr/bin/env python3
"""发布文章到 Supabase"""

import json
import urllib.request
import urllib.error

# Supabase 配置
SUPABASE_URL = "https://uiubbfkqfflhhqlkuovg.supabase.co"
API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpdWJiZmtxZmZsaGhxbGt1b3ZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3MjgxOTYsImV4cCI6MjA4OTMwNDE5Nn0.iL4Hmu4HlEMGIMO4vTJCRqdTG404AYtEnX-BVWgAA7w"

# 文章数据
article = {
    "title": "博客数据库集成：Supabase实战记录",
    "category": "learning",
    "tags": "Supabase,数据库,前端,GitHub Pages,部署",
    "content": """# 博客数据库集成：Supabase实战记录

## 需求背景

一直以来，发布博客文章都需要更新代码、重新推送到 GitHub Pages，流程繁琐。今天终于实现了**直接在网站上发布文章**的功能，无需更新代码！

## 技术方案选择

### 为什么选择 Supabase？

GitHub Pages 是静态托管服务，不支持后端数据库。调研了几个方案后，选择了 Supabase：

- ✅ **免费额度充足**：500MB 数据库，50,000 次/月 API 调用
- ✅ **原生 JavaScript SDK**：无需后端，前端直接调用
- ✅ **自动 RESTful API**：创建表后自动生成 API 接口
- ✅ **行级安全（RLS）**：可配置公开读写权限
- ✅ **实时订阅**：支持数据库变更实时推送

## 实现过程

### 1. 创建 Supabase 项目

1. 访问 https://supabase.com 注册账号
2. 创建新项目，获取 API URL 和 Anon Key
3. 在 SQL 编辑器中创建 posts 表：

```sql
CREATE TABLE posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL,
  tags TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 启用行级安全
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- 允许所有人读取、插入、删除
CREATE POLICY "read" ON posts FOR SELECT TO public USING (true);
CREATE POLICY "insert" ON posts FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "delete" ON posts FOR DELETE TO public USING (true);
```

### 2. 集成 Supabase SDK

在 HTML 中引入 SDK：

```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js"></script>
```

初始化客户端：

```javascript
const blogSupabase = window.supabase.createClient(
  'https://uiubbfkqfflhhqlkuovg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
);
```

### 3. 读取文章列表

```javascript
async function loadBlogPosts() {
    const { data, error } = await blogSupabase
        .from('posts')
        .select('*')
        .order('updated_at', { ascending: false });

    if (error) {
        console.error('加载失败:', error);
        return;
    }

    blogPosts = data.map(post => ({
        id: post.id,
        title: post.title,
        content: post.content,
        category: post.category,
        tags: post.tags,
        createdAt: post.created_at,
        updatedAt: post.updated_at
    }));

    renderBlogPosts();
}
```

### 4. 发布新文章

```javascript
async function publishArticle(article) {
    const { data, error } = await blogSupabase
        .from('posts')
        .insert([{
            title: article.title,
            content: article.content,
            category: article.category,
            tags: article.tags
        }])
        .select();

    if (error) {
        console.error('发布失败:', error);
        return;
    }

    console.log('发布成功:', data[0].id);
    await loadBlogPosts(); // 重新加载
}
```

### 5. 删除文章

```javascript
async function deleteArticle(id) {
    const { error } = await blogSupabase
        .from('posts')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('删除失败:', error);
        return;
    }

    await loadBlogPosts(); // 重新加载
}
```

## 遇到的坑

### 问题1：变量重复声明

```
Uncaught SyntaxError: Identifier 'supabase' has already been declared
```

**原因**：CDN 加载的 Supabase SDK 会创建全局变量，而代码中又用 `let/const` 声明同名变量。

**解决**：改为 `window.supabase.createClient(...)`，使用局部变量名 `blogSupabase`。

### 问题2：CDN 加载失败

```
TypeError: blogSupabase.from is not a function
```

**原因**：Supabase 客户端未正确初始化。

**解决**：在 HTML 中同步初始化并验证：

```javascript
window.blogSupabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
console.log('初始化成功:', typeof window.blogSupabase.from); // 应该是 'function'
```

### 问题3：Git 推送超时

```
fatal: unable to access 'https://github.com/...': The operation timed out
```

**原因**：命令行未配置 Clash 代理。

**解决**：
```bash
git config --global http.proxy http://127.0.0.1:7890
git config --global https.proxy https://127.0.0.1:7890
```

### 问题4：浏览器缓存导致旧代码运行

**现象**：修改代码后推送，但页面仍然报错。

**原因**：浏览器缓存了旧的 JavaScript 文件。

**解决**：
- 强制刷新：Ctrl + F5
- 清除浏览器缓存
- 临时创建新文件名绕过缓存（如 `blog-v2.html`）

## 最终效果

### 功能清单

- ✅ **直接发布文章**：在网站上填写表单即可发布
- ✅ **文章列表展示**：按更新时间倒序排列
- ✅ **文章详情查看**：点击卡片查看完整内容
- ✅ **删除文章**：管理模式下可删除
- ✅ **管理模式**：点击标题5次 + 密码验证（55999）

### 技术栈

| 组件 | 技术 |
|------|------|
| 前端框架 | 纯 HTML + CSS + JavaScript |
| 数据库 | Supabase (PostgreSQL) |
| 托管平台 | GitHub Pages |
| SDK | @supabase/supabase-js@2 |

## 后续优化

- [ ] 添加文章编辑功能
- [ ] 实现搜索高亮
- [ ] 添加文章浏览次数统计
- [ ] 支持图片上传（到 Supabase Storage）
- [ ] 添加文章分类筛选
- [ ] 实现标签云功能
- [ ] 添加评论系统

## 总结

通过集成 Supabase，博客从纯静态网站升级为动态内容管理平台，同时保留了 GitHub Pages 的简单部署优势。整个过程不需要后端服务器，所有操作都在前端完成，大大降低了开发和维护成本。

现在，发布一篇博客只需要几分钟，再也不用折腾 Git 了！🎉

---

*记录日期：2026年3月17日*"""
}

# 发送请求
url = f"{SUPABASE_URL}/rest/v1/posts"
data = json.dumps(article).encode('utf-8')

req = urllib.request.Request(
    url,
    data=data,
    method='POST',
    headers={
        'apikey': API_KEY,
        'Authorization': f'Bearer {API_KEY}',
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
    }
)

try:
    response = urllib.request.urlopen(req)
    result = json.loads(response.read().decode('utf-8'))
    print(f"[OK] 文章发布成功！")
    print(f"文章ID: {result[0]['id']}")
    print(f"文章标题: {result[0]['title']}")
    print(f"\n请访问 https://yzs-ui.github.io/my-notes-blog/blog.html 查看")
except urllib.error.HTTPError as e:
    print(f"[ERROR] 发布失败: HTTP {e.code}")
    print(f"错误信息: {e.read().decode('utf-8')}")
except Exception as e:
    print(f"[ERROR] 发布失败: {e}")
