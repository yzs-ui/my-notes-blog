// 博客应用

let blogPosts = [];
let titleClickCount = 0;
let clickTimeout = null;
let isAdminMode = false;
const ADMIN_PASSWORD = '55999';

// 点击标题5次打开口令验证
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

    loadBlogPosts();
});

// 打开口令验证弹窗
function openPasswordModal() {
    const modal = document.getElementById('passwordModal');
    const passwordInput = document.getElementById('password');
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
    passwordInput.value = '';
    passwordInput.focus();
}

// 关闭口令验证弹窗
function closePasswordModal() {
    const modal = document.getElementById('passwordModal');
    modal.style.display = 'none';
    document.body.style.overflow = '';
    document.getElementById('password').value = '';
}

// 验证口令
function verifyPassword() {
    const password = document.getElementById('password').value;
    console.log('验证口令，输入值:', password);
    if (password === ADMIN_PASSWORD) {
        closePasswordModal();
        // 启用管理模式，显示新增按钮
        isAdminMode = true;
        document.body.classList.add('admin-mode');
        document.getElementById('adminToolbar').style.display = 'flex';
        console.log('已进入管理模式，isAdminMode:', isAdminMode);
        // 重新渲染博客以显示删除按钮
        renderBlogPosts();
        showToast('已进入管理模式', 'success');
    } else {
        showToast('口令错误', 'error');
        document.getElementById('password').value = '';
        document.getElementById('password').focus();
    }
}

// 监听密码输入的回车键
document.getElementById('password').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        verifyPassword();
    }
});

// 打开新增文章弹窗
function openAddArticleModal() {
    const modal = document.getElementById('addArticleModal');
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
    document.getElementById('title').focus();
}

// 关闭新增文章弹窗
function closeAddArticleModal() {
    const modal = document.getElementById('addArticleModal');
    modal.style.display = 'none';
    document.body.style.overflow = '';
    document.getElementById('articleForm').reset();
}

// 加载博客数据
async function loadBlogPosts() {
    try {
        // 先尝试从本地存储加载（包含新增的文章）
        const hasLocalData = loadFromLocalStorage();

        // 然后尝试从 data.json 加载原始数据
        try {
            const response = await fetch('data.json');
            if (!response.ok) throw new Error('Failed to load data');
            const data = await response.json();

            // 如果本地存储有数据，合并（新增的文章在前），但要去重
            if (hasLocalData) {
                const existingIds = new Set(data.map(post => post.id));
                const newPosts = blogPosts.filter(post => !existingIds.has(post.id));
                blogPosts = [...newPosts, ...data];
            } else {
                blogPosts = data;
            }
        } catch (error) {
            console.warn('加载 data.json 失败，使用本地存储:', error);
            if (!hasLocalData) {
                showEmptyState();
                return;
            }
        }

        renderBlogPosts();
    } catch (error) {
        console.error('加载博客失败:', error);
        showEmptyState();
    }
}

// 显示空状态
function showEmptyState() {
    const grid = document.getElementById('blogGrid');
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
    grid.innerHTML = '';

    if (blogPosts.length === 0) {
        showEmptyState();
        return;
    }

    // 按时间倒序
    const sortedPosts = [...blogPosts].sort((a, b) =>
        new Date(b.updatedAt) - new Date(a.updatedAt)
    );

    const categoryLabels = {
        work: '工作',
        life: '生活',
        learning: '学习',
        ideas: '想法'
    };

    sortedPosts.forEach(post => {
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

// 删除文章
function deleteArticle(id, event) {
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

    console.log('开始删除文章，删除前文章数量:', blogPosts.length);
    blogPosts = blogPosts.filter(post => post.id !== id);
    console.log('删除后文章数量:', blogPosts.length);

    saveBlogPosts();
    renderBlogPosts();
    showToast('文章已删除', 'success');
}

// 打开文章详情
function openArticle(post) {
    const modal = document.getElementById('articleModal');
    const content = document.getElementById('articleContent');

    const categoryLabels = {
        work: '工作',
        life: '生活',
        learning: '学习',
        ideas: '想法'
    };

    const tags = post.tags ? post.tags.split(',').map(t => t.trim()).filter(t => t) : [];
    const contentHtml = escapeHtml(post.content).replace(/\n/g, '<br>');

    content.innerHTML = `
        <div class="card-category">${categoryLabels[post.category] || post.category}</div>
        <h1 class="card-title">${escapeHtml(post.title)}</h1>
        <div class="card-meta">
            <div class="card-date">
                <span>📅</span>
                <span>${formatDate(post.updatedAt)}</span>
            </div>
        </div>
        <div class="article-content">
            ${contentHtml}
        </div>
        ${tags.length > 0 ? `
        <div class="card-tags">
            ${tags.map(tag => `<span class="card-tag">${escapeHtml(tag)}</span>`).join('')}
        </div>
        ` : ''}
    `;

    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

// 关闭弹窗
function closeModal() {
    const modal = document.getElementById('articleModal');
    modal.style.display = 'none';
    document.body.style.overflow = '';
}

// 点击弹窗外部关闭
window.addEventListener('click', (e) => {
    const modal = document.getElementById('articleModal');
    const modalContent = modal.querySelector('.modal-content');
    if (e.target === modal || e.target.classList.contains('modal-close-bottom')) {
        closeModal();
    }
});

// ESC键关闭
window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeModal();
    }
});

// 下滑关闭（移动端手势）
let touchStartY = 0;
window.addEventListener('touchstart', (e) => {
    const modal = document.getElementById('articleModal');
    if (modal.style.display === 'block') {
        touchStartY = e.touches[0].clientY;
    }
});

window.addEventListener('touchmove', (e) => {
    const modal = document.getElementById('articleModal');
    if (modal.style.display !== 'block') return;

    const touchEndY = e.touches[0].clientY;
    const diff = touchEndY - touchStartY;

    // 下滑超过100px关闭
    if (diff > 100) {
        closeModal();
    }
});

// 显示Toast提示
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');

    toast.className = 'toast ' + type;
    toastMessage.textContent = message;

    setTimeout(() => {
        toast.classList.add('show');
    }, 10);

    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// 提交文章表单
document.getElementById('articleForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const title = document.getElementById('title').value.trim();
    const category = document.getElementById('category').value;
    const tags = document.getElementById('tags').value.trim();
    const content = document.getElementById('content').value.trim();

    if (!title || !category || !content) {
        showToast('请填写必填项', 'error');
        return;
    }

    const newPost = {
        id: Date.now().toString(),
        title,
        category,
        tags,
        content,
        updatedAt: new Date().toISOString()
    };

    try {
        // 保存到本地存储
        blogPosts.push(newPost);
        await saveBlogPosts();

        // 重新渲染
        renderBlogPosts();

        // 关闭管理面板
        closeAddArticleModal();

        // 显示成功提示
        showToast('文章发布成功！', 'success');
    } catch (error) {
        console.error('保存文章失败:', error);
        showToast('保存失败，请重试', 'error');
    }
});

// 保存博客文章到本地存储
async function saveBlogPosts() {
    try {
        localStorage.setItem('blogPosts', JSON.stringify(blogPosts));
    } catch (error) {
        console.error('保存到本地存储失败:', error);
        throw error;
    }
}

// 从本地存储加载博客文章
function loadFromLocalStorage() {
    try {
        const saved = localStorage.getItem('blogPosts');
        if (saved) {
            blogPosts = JSON.parse(saved);
            return true;
        }
    } catch (error) {
        console.error('从本地存储加载失败:', error);
    }
    return false;
}
