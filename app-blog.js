// 博客应用 - 集成 CloudBase 国内数据库

// ==================== CloudBase 配置 ====================
const CLOUD_BASE_ENV = 'testyu-4g1ofztb1f9ef6e8';
const ADMIN_SECRET = '55999';

// CloudBase API 调用
async function callCloudAPI(action, params) {
    const url = `https://tcb-api.tencentcloudapi.com/web?env=${CLOUD_BASE_ENV}&action=${action}`;
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(params || {})
        });
        return await response.json();
    } catch (error) {
        console.error('CloudBase API 调用失败:', error);
        throw error;
    }
}

// ==================== 全局变量 ====================
let blogPosts = [];
let titleClickCount = 0;
let clickTimeout = null;
let isAdminMode = false;
const ADMIN_PASSWORD = '55999';

// 缓存配置
const CACHE_KEY = 'blog_posts_cache';
const CACHE_DURATION = 5 * 60 * 1000; // 5分钟缓存

// ==================== 页面初始化 ====================
document.addEventListener('DOMContentLoaded', () => {
    const blogTitle = document.getElementById('blogTitle');
    if (blogTitle) {
        blogTitle.addEventListener('click', () => {
            titleClickCount++;

            // 重置计时器（如果2秒内没有点击，计数重置）
            if (clickTimeout) {
                clearTimeout(clickTimeout);
            }

            clickTimeout = setTimeout(() => {
                titleClickCount = 0;
            }, 2000);

            // 点击5次打开口令验证
            if (titleClickCount >= 5) {
                titleClickCount = 0;
                openPasswordModal();
            }
        });
    }

    // 监听密码输入的回车键
    const passwordInput = document.getElementById('password');
    if (passwordInput) {
        passwordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                verifyPassword();
            }
        });
    }

    // 监听文章表单提交
    const articleForm = document.getElementById('articleForm');
    if (articleForm) {
        articleForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const title = document.getElementById('title').value.trim();
            const category = document.getElementById('category').value;
            const tags = document.getElementById('tags').value.trim();
            const content = document.getElementById('content').value.trim();

            if (!title || !category || !content) {
                showToast('请填写必填项', 'error');
                return;
            }

            try {
                console.log('📝 正在发布文章到 CloudBase...');

                const result = await callCloudAPI('database.addDocument', {
                    collectionName: 'posts',
                    data: {
                        title: title,
                        content: content,
                        category: category,
                        tags: tags
                    }
                });

                if (result.error) {
                    console.error('❌ 发布失败:', result.error);
                    showToast('发布失败，请重试', 'error');
                    return;
                }

                console.log('✅ 文章发布成功');

                // 重新加载
                await loadBlogPosts();

                // 关闭管理面板
                closeAddArticleModal();

                // 显示成功提示
                showToast('文章发布成功！所有人都能看到', 'success');
            } catch (error) {
                console.error('保存文章失败:', error);
                showToast('保存失败，请重试', 'error');
            }
        });
    }

    // 加载博客文章
    showLoadingState();
    loadBlogPosts();
});

// ==================== 管理模式相关 ====================
// 打开口令验证弹窗
function openPasswordModal() {
    console.log('openPasswordModal 被调用');
    const modal = document.getElementById('passwordModal');
    const passwordInput = document.getElementById('password');

    console.log('modal 元素:', modal);
    console.log('passwordInput 元素:', passwordInput);

    if (!modal || !passwordInput) {
        console.error('❌ modal 或 passwordInput 元素不存在');
        return;
    }

    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
    passwordInput.value = '';
    passwordInput.focus();
}

// 关闭口令验证弹窗
function closePasswordModal() {
    console.log('closePasswordModal 被调用');
    const modal = document.getElementById('passwordModal');
    const passwordInput = document.getElementById('password');

    if (!modal) {
        console.error('❌ passwordModal 元素不存在');
        return;
    }

    modal.style.display = 'none';
    document.body.style.overflow = '';
    if (passwordInput) {
        passwordInput.value = '';
    }
}

// 验证口令
function verifyPassword() {
    const passwordInput = document.getElementById('password');
    if (!passwordInput) {
        console.error('❌ passwordInput 元素不存在');
        return;
    }

    const password = passwordInput.value;
    console.log('验证口令，输入值:', password);

    if (password === ADMIN_PASSWORD) {
        closePasswordModal();
        // 启用管理模式，显示新增按钮
        isAdminMode = true;
        document.body.classList.add('admin-mode');

        const adminToolbar = document.getElementById('adminToolbar');
        if (adminToolbar) {
            adminToolbar.style.display = 'flex';
        }

        console.log('已进入管理模式，isAdminMode:', isAdminMode);
        // 重新渲染博客以显示删除按钮
        renderBlogPosts();
        showToast('已进入管理模式', 'success');
    } else {
        showToast('口令错误', 'error');
        passwordInput.value = '';
        passwordInput.focus();
    }
}

// ==================== 新增文章相关 ====================
// 打开新增文章弹窗
function openAddArticleModal() {
    console.log('openAddArticleModal 被调用');
    const modal = document.getElementById('addArticleModal');
    const titleInput = document.getElementById('title');

    console.log('modal 元素:', modal);
    console.log('titleInput 元素:', titleInput);

    if (!modal) {
        console.error('❌ addArticleModal 元素不存在');
        return;
    }

    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';

    if (titleInput) {
        titleInput.focus();
    }
}

// 关闭新增文章弹窗
function closeAddArticleModal() {
    console.log('closeAddArticleModal 被调用');
    const modal = document.getElementById('addArticleModal');
    const articleForm = document.getElementById('articleForm');

    if (!modal) {
        console.error('❌ addArticleModal 元素不存在');
        return;
    }

    modal.style.display = 'none';
    document.body.style.overflow = '';

    if (articleForm) {
        articleForm.reset();
    }
}

// ==================== 加载博客数据（从 CloudBase） ====================
async function loadBlogPosts() {
    console.log('=== loadBlogPosts 开始执行 ===');
    const startTime = Date.now();

    try {
        // 检查缓存
        const cachedData = getCachedData();
        if (cachedData) {
            console.log('✅ 使用缓存数据，共', cachedData.length, '篇');
            blogPosts = cachedData;
            renderBlogPosts();
            // 后台更新缓存
            updateCacheInBackground();
            return;
        }

        console.log('📡 正在从 CloudBase 加载文章...');

        // 从 CloudBase 读取所有文章
        const result = await callCloudAPI('database.queryDocuments', {
            collectionName: 'posts',
            queryType: 'all'
        });

        if (result.error) {
            console.error('❌ 加载文章失败:', result.error);
            showToast('加载文章失败', 'error');
            showEmptyState();
            return;
        }

        const data = result.data || [];
        const loadTime = Date.now() - startTime;
        console.log('✅ 加载文章成功，共', data.length, '篇，耗时', loadTime, 'ms');

        // 转换数据格式
        blogPosts = data.map(post => ({
            id: post._id,
            title: post.title,
            content: post.content,
            category: post.category,
            tags: post.tags,
            updatedAt: post._updateTime || post._createTime
        }));

        // 按更新时间排序
        blogPosts.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

        // 保存到缓存
        setCachedData(blogPosts);

        renderBlogPosts();
    } catch (error) {
        console.error('❌ 加载博客失败:', error);
        showToast('加载失败，请刷新重试', 'error');
        showEmptyState();
    }
}

// 获取缓存数据
function getCachedData() {
    try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (!cached) return null;

        const { data, timestamp } = JSON.parse(cached);
        const now = Date.now();

        // 检查缓存是否过期
        if (now - timestamp > CACHE_DURATION) {
            console.log('⏰ 缓存已过期');
            return null;
        }

        return data;
    } catch (error) {
        console.error('❌ 读取缓存失败:', error);
        return null;
    }
}

// 保存数据到缓存
function setCachedData(data) {
    try {
        const cacheData = {
            data: data,
            timestamp: Date.now()
        };
        localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
        console.log('💾 数据已缓存');
    } catch (error) {
        console.error('❌ 保存缓存失败:', error);
    }
}

// 后台更新缓存
async function updateCacheInBackground() {
    try {
        console.log('🔄 后台更新缓存...');
        const result = await callCloudAPI('database.queryDocuments', {
            collectionName: 'posts',
            queryType: 'all'
        });

        if (!result.error && result.data) {
            const updatedPosts = result.data.map(post => ({
                id: post._id,
                title: post.title,
                content: post.content,
                category: post.category,
                tags: post.tags,
                updatedAt: post._updateTime || post._createTime
            }));

            updatedPosts.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

            // 检查是否有更新
            if (JSON.stringify(updatedPosts) !== JSON.stringify(blogPosts)) {
                blogPosts = updatedPosts;
                setCachedData(blogPosts);
                renderBlogPosts();
                console.log('✅ 缓存已更新');
            }
        }
    } catch (error) {
        console.error('❌ 后台更新缓存失败:', error);
    }
}

// ==================== 渲染相关 ====================
// 显示加载状态
function showLoadingState() {
    const grid = document.getElementById('blogGrid');

    if (!grid) {
        console.error('❌ blogGrid 元素不存在');
        return;
    }

    grid.innerHTML = `
        <div class="loading-state">
            <div class="loading-spinner"></div>
            <p>正在加载文章...</p>
        </div>
    `;
}

// 显示空状态
function showEmptyState() {
    const grid = document.getElementById('blogGrid');

    if (!grid) {
        console.error('❌ blogGrid 元素不存在');
        return;
    }

    grid.innerHTML = `
        <div class="empty-state">
            <h2>📝 暂无文章</h2>
            <p>精彩内容即将呈现...</p>
        </div>
    `;
}

// 格式化日期
function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// HTML转义
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 渲染博客列表
function renderBlogPosts() {
    const grid = document.getElementById('blogGrid');

    if (!grid) {
        console.error('❌ blogGrid 元素不存在');
        return;
    }

    grid.innerHTML = '';

    if (blogPosts.length === 0) {
        showEmptyState();
        return;
    }

    const categoryLabels = {
        work: '工作',
        life: '生活',
        learning: '学习',
        ideas: '想法'
    };

    blogPosts.forEach(post => {
        const tags = post.tags ? post.tags.split(',').map(t => t.trim()).filter(t => t) : [];
        const excerpt = post.content.split('\n').slice(0, 4).join('\n');

        const card = document.createElement('div');
        card.className = 'blog-card';
        card.dataset.id = post.id;
        card.innerHTML = `
            <div class="card-category">${categoryLabels[post.category] || post.category}</div>
            <h2 class="card-title">${escapeHtml(post.title)}</h2>
            <div class="card-excerpt">${escapeHtml(excerpt)}</div>
            <div class="card-meta">
                <div class="card-date">
                    <span>📅</span>
                    <span>${formatDate(post.updatedAt)}</span>
                </div>
                <div class="card-tags">
                    ${tags.slice(0, 3).map(tag => `<span class="card-tag">${escapeHtml(tag)}</span>`).join('')}
                    ${isAdminMode ? `<button class="delete-btn" onclick="deleteArticle('${post.id}', event)" title="删除文章">🗑</button>` : ''}
                </div>
            </div>
        `;

        // 卡片点击事件
        card.addEventListener('click', (e) => {
            // 如果点击的是删除按钮或标签区域，不打开文章
            if (e.target.classList.contains('delete-btn') || e.target.closest('.card-tag')) return;
            openArticle(post);
        });

        grid.appendChild(card);
    });
}

// ==================== 删除文章 ====================
async function deleteArticle(id, event) {
    console.log('=== deleteArticle 被调用 ===');
    console.log('文章ID:', id);
    console.log('当前 isAdminMode:', isAdminMode);

    if (event) {
        event.stopPropagation();
        console.log('事件已阻止冒泡');
    }

    // 使用同步的confirm对话框
    const confirmed = window.confirm('确定要删除这篇文章吗？');
    console.log('用户选择:', confirmed);

    if (!confirmed) {
        console.log('用户取消删除');
        return;
    }

    try {
        console.log('🗑️ 正在从 CloudBase 删除文章...');

        const result = await callCloudAPI('database.deleteDocument', {
            collectionName: 'posts',
            id: id
        });

        if (result.error) {
            console.error('❌ 删除失败:', result.error);
            showToast('删除失败，请重试', 'error');
            return;
        }

        console.log('✅ 文章删除成功');

        // 重新加载
        await loadBlogPosts();
        showToast('文章已删除', 'success');
    } catch (error) {
        console.error('删除文章失败:', error);
        showToast('删除失败，请重试', 'error');
    }
}

// ==================== 文章详情 ====================
// 打开文章详情（跳转到文章页面）
function openArticle(post) {
    console.log('openArticle 被调用，文章ID:', post.id);
    // 跳转到文章详情页
    window.location.href = `article.html?id=${post.id}`;
}

// ==================== 弹窗交互 ====================
// 注释：文章详情已改为页面跳转模式，删除弹窗相关代码

// ==================== 发布文章 ====================
// 提交文章表单 - 已移到 DOMContentLoaded 中

// ==================== Toast 提示 ====================
// 显示Toast提示
function showToast(message, type = 'success') {
    console.log('showToast 被调用:', message, type);
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');

    console.log('toast 元素:', toast);
    console.log('toastMessage 元素:', toastMessage);

    if (!toast || !toastMessage) {
        console.error('❌ toast 或 toastMessage 元素不存在');
        return;
    }

    toast.className = 'toast ' + type;
    toastMessage.textContent = message;

    setTimeout(() => {
        toast.classList.add('show');
        console.log('toast 已添加 show 类');
    }, 10);

    setTimeout(() => {
        toast.classList.remove('show');
        console.log('toast 已移除 show 类');
    }, 3000);
}
