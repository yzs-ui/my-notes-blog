// 博客应用 JavaScript

let blogPosts = [];
let privatePosts = [];
let currentMode = 'public'; // 'public' or 'private'
let currentCategory = 'all';
let selectedBlog = null;
let secretClickCount = 0;
let isDarkMode = false;

const PUBLIC_DATA_URL = 'data.json';
const PRIVATE_DATA_URL = 'private.json';
const PRIVATE_PASSWORD = '559999';

// 从 data.json 加载公开博客数据
async function loadPublicPosts() {
    try {
        const response = await fetch(PUBLIC_DATA_URL);
        if (!response.ok) throw new Error('Failed to load data');
        blogPosts = await response.json();
        sortPosts(blogPosts);
    } catch (error) {
        console.error('加载公开博客失败:', error);
        showEmptyState();
    }
}

// 从 private.json 加载私人博客数据
async function loadPrivatePosts() {
    try {
        const response = await fetch(PRIVATE_DATA_URL);
        if (!response.ok) throw new Error('Failed to load private data');
        privatePosts = await response.json();
        sortPosts(privatePosts);
    } catch (error) {
        console.error('加载私人博客失败:', error);
        privatePosts = [];
    }
}

// 按更新时间倒序排列
function sortPosts(posts) {
    posts.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
}

// 获取当前显示的博客列表
function getCurrentPosts() {
    return currentMode === 'private' ? privatePosts : blogPosts;
}

// 保存到对应数据文件
async function savePosts() {
    const data = currentMode === 'private' ? privatePosts : blogPosts;
    const jsonStr = JSON.stringify(data, null, 2);
    
    // 创建 Blob 并下载，然后通过某种方式保存（这里用 localStorage 模拟）
    const key = currentMode === 'private' ? 'privateBlogData' : 'publicBlogData';
    localStorage.setItem(key, jsonStr);
    
    // 更新显示
    renderPosts();
}

// 显示空状态
function showEmptyState(message = '暂无博客') {
    const grid = document.getElementById('blogGrid');
    grid.innerHTML = `
        <div class="empty-state">
            <h2>📝 ${message}</h2>
            <p>精彩内容即将呈现...</p>
        </div>
    `;
}

// HTML转义
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 高亮搜索关键词
function highlightText(text, searchTerm) {
    if (!searchTerm) return escapeHtml(text);
    const escapedText = escapeHtml(text);
    const escapedSearchTerm = escapeHtml(searchTerm);
    const regex = new RegExp(`(${escapedSearchTerm})`, 'gi');
    return escapedText.replace(regex, '<span class="highlight">$1</span>');
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

// 更新最后更新时间
function updateLastUpdateTime() {
    const allPosts = [...blogPosts, ...privatePosts];
    if (allPosts.length > 0) {
        const latest = allPosts.reduce((a, b) =>
            new Date(a.updatedAt) > new Date(b.updatedAt) ? a : b
        );
        const now = new Date(latest.updatedAt).toLocaleString('zh-CN');
        document.getElementById('lastUpdate').textContent = now;
    }
    // 更新文章数量
    document.getElementById('postCount').textContent = allPosts.length;
}

// 渲染博客列表
function renderPosts() {
    const grid = document.getElementById('blogGrid');
    grid.innerHTML = '';
    
    let posts = getCurrentPosts();
    
    // 筛选分类
    if (currentCategory !== 'all') {
        posts = posts.filter(post => post.category === currentCategory);
    }
    
    // 筛选搜索
    const searchTerm = document.getElementById('searchBox').value.toLowerCase();
    if (searchTerm) {
        posts = posts.filter(post => 
            post.title.toLowerCase().includes(searchTerm) ||
            post.content.toLowerCase().includes(searchTerm) ||
            (post.tags && post.tags.toLowerCase().includes(searchTerm))
        );
    }
    
    if (posts.length === 0) {
        showEmptyState(currentMode === 'private' ? '私人空间暂无博客' : '未找到相关博客');
        return;
    }
    
    const categoryLabels = {
        work: '💼 工作',
        life: '🏠 生活',
        learning: '📚 学习',
        ideas: '💡 想法'
    };
    
    posts.forEach(post => {
        const tags = post.tags ? post.tags.split(',').map(t => t.trim()).filter(t => t) : [];

        // 截取内容前10行
        const lines = post.content.split('\n');
        const previewContent = lines.slice(0, 10).join('\n');
        const hasMore = lines.length > 10;

        const article = document.createElement('article');
        article.className = 'blog-post';

        article.innerHTML = `
            <header class="post-header">
                <span class="category ${post.category}">${categoryLabels[post.category] || post.category}</span>
                <h2 class="post-title">${highlightText(post.title, searchTerm)}</h2>
                <div class="post-meta">
                    <span class="post-date">📅 ${formatDate(post.updatedAt)}</span>
                </div>
            </header>
            <div class="post-content">
                <p>${highlightText(previewContent, searchTerm)}</p>
                ${hasMore ? '<span class="read-more">...展开全文</span>' : ''}
            </div>
            ${tags.length > 0 ? `
            <footer class="post-tags">
                ${tags.map(tag => `<span class="tag">${highlightText(tag, searchTerm)}</span>`).join('')}
            </footer>
            ` : ''}
        `;

        // 点击查看详情
        article.addEventListener('click', () => openBlogDetail(post));

        grid.appendChild(article);
    });
}

// 打开博客详情
function openBlogDetail(post) {
    selectedBlog = post;
    const modal = document.getElementById('blogModal');
    const detail = document.getElementById('blogDetail');

    const categoryLabels = {
        work: '💼 工作',
        life: '🏠 生活',
        learning: '📚 学习',
        ideas: '💡 想法'
    };

    const tags = post.tags ? post.tags.split(',').map(t => t.trim()).filter(t => t) : [];
    const contentHtml = escapeHtml(post.content).replace(/\n/g, '<br>');

    detail.innerHTML = `
        <span class="category ${post.category}">${categoryLabels[post.category] || post.category}</span>
        <h2 class="post-title">${escapeHtml(post.title)}</h2>
        <div class="post-meta">
            <span class="post-date">📅 ${formatDate(post.updatedAt)}</span>
        </div>
        <div class="post-content">
            <p>${contentHtml}</p>
        </div>
        ${tags.length > 0 ? `
        <footer class="post-tags">
            ${tags.map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join('')}
        </footer>
        ` : ''}

        <div class="share-buttons">
            <button class="share-btn copy" onclick="copyArticleUrl()">
                <span>📋</span>
                <span>复制链接</span>
            </button>
            <button class="share-btn wechat" onclick="shareToWechat()">
                <span>💬</span>
                <span>微信</span>
            </button>
            <button class="share-btn weibo" onclick="shareToWeibo()">
                <span>🐦</span>
                <span>微博</span>
            </button>
        </div>
    `;

    modal.style.display = 'block';

    // 添加阅读进度条
    addReadingProgress();
}

// 复制文章链接
function copyArticleUrl() {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
        alert('链接已复制到剪贴板！');
    }).catch(() => {
        alert('复制失败，请手动复制地址栏链接');
    });
}

// 分享到微信
function shareToWechat() {
    alert('微信分享功能：请使用微信扫描二维码分享\n（功能开发中...）');
}

// 分享到微博
function shareToWeibo() {
    const url = encodeURIComponent(window.location.href);
    const title = encodeURIComponent(selectedBlog?.title || '分享文章');
    window.open(`https://service.weibo.com/share/share.php?url=${url}&title=${title}`, '_blank');
}

// 添加阅读进度条
function addReadingProgress() {
    const progressBar = document.createElement('div');
    progressBar.className = 'reading-progress';
    progressBar.id = 'readingProgress';
    document.body.appendChild(progressBar);

    // 移除旧的进度条事件
    const existingProgress = document.getElementById('readingProgress');
    if (existingProgress) {
        const modalContent = document.querySelector('.blog-modal');
        modalContent.addEventListener('scroll', updateProgress);
    }
}

function updateProgress() {
    const modalContent = document.querySelector('.blog-modal');
    const scrollTop = modalContent.scrollTop;
    const scrollHeight = modalContent.scrollHeight - modalContent.clientHeight;
    const progress = (scrollTop / scrollHeight) * 100;

    document.getElementById('readingProgress').style.width = progress + '%';
}

// 关闭博客详情
function closeBlogModal() {
    document.getElementById('blogModal').style.display = 'none';
    selectedBlog = null;

    // 移除阅读进度条
    const progressBar = document.getElementById('readingProgress');
    if (progressBar) {
        progressBar.remove();
    }
}



// 打开私人空间口令弹窗
function openPasswordModal() {
    document.getElementById('passwordModal').style.display = 'block';
    document.getElementById('privatePassword').value = '';
    document.getElementById('privatePassword').focus();
}

// 关闭口令弹窗
function closePasswordModal() {
    document.getElementById('passwordModal').style.display = 'none';
}

// 验证口令
function verifyPassword() {
    const password = document.getElementById('privatePassword').value;
    
    if (password === PRIVATE_PASSWORD) {
        closePasswordModal();
        currentMode = 'private';
        updateNavActive('private');
        document.getElementById('pageTitle').textContent = '🔒 私人空间';
        
        // 加载私人博客
        const stored = localStorage.getItem('privateBlogData');
        if (stored) {
            privatePosts = JSON.parse(stored);
        }
        renderPosts();
    } else {
        alert('口令错误，请重试');
        document.getElementById('privatePassword').value = '';
    }
}

// 切换到公开模式
function switchToPublic() {
    currentMode = 'public';
    currentCategory = 'all';
    document.getElementById('pageTitle').textContent = '全部博客';
    document.getElementById('searchBox').value = '';
    updateNavActive('all');
    renderPosts();
}

// 更新导航高亮
function updateNavActive(category) {
    document.querySelectorAll('.nav-item').forEach(item => {
        // 只对有data-category属性的项添加active类
        if (item.dataset.category) {
            item.classList.remove('active');
            if (item.dataset.category === category) {
                item.classList.add('active');
            }
        }
    });
}

// 打开关于我弹窗
function openAboutModal() {
    console.log('打开关于我弹窗');
    const modal = document.getElementById('aboutModal');
    if (modal) {
        modal.style.display = 'block';
    } else {
        console.error('找不到aboutModal元素');
    }
}

// 关闭关于我弹窗
function closeAboutModal() {
    console.log('关闭关于我弹窗');
    const modal = document.getElementById('aboutModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// 打开标签云弹窗
function openTagsModal() {
    console.log('打开标签云弹窗');
    const modal = document.getElementById('tagsModal');
    const tagsCloud = document.getElementById('tagsCloud');

    if (!modal || !tagsCloud) {
        console.error('找不到tagsModal或tagsCloud元素');
        return;
    }

    // 收集所有标签
    const allPosts = [...blogPosts, ...privatePosts];
    const tagMap = new Map();

    allPosts.forEach(post => {
        if (post.tags) {
            const tags = post.tags.split(',').map(t => t.trim()).filter(t => t);
            tags.forEach(tag => {
                tagMap.set(tag, (tagMap.get(tag) || 0) + 1);
            });
        }
    });

    // 按使用频率排序
    const sortedTags = Array.from(tagMap.entries()).sort((a, b) => b[1] - a[1]);

    if (sortedTags.length === 0) {
        tagsCloud.innerHTML = '<p class="empty-state">暂无标签</p>';
    } else {
        tagsCloud.innerHTML = sortedTags.map(([tag, count]) => `
            <span class="cloud-tag" onclick="filterByTag('${tag}')">${tag} (${count})</span>
        `).join('');
    }

    modal.style.display = 'block';
}

// 通过标签筛选
function filterByTag(tag) {
    console.log('筛选标签:', tag);
    closeTagsModal();
    const searchBox = document.getElementById('searchBox');
    if (searchBox) {
        searchBox.value = tag;
    }
    renderPosts();
    const pageTitle = document.getElementById('pageTitle');
    if (pageTitle) {
        pageTitle.textContent = `标签：${tag}`;
    }
}

// 关闭标签云弹窗
function closeTagsModal() {
    console.log('关闭标签云弹窗');
    const modal = document.getElementById('tagsModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// 打开归档弹窗
function openArchiveModal() {
    console.log('打开归档弹窗');
    const modal = document.getElementById('archiveModal');
    const archiveList = document.getElementById('archiveList');

    if (!modal || !archiveList) {
        console.error('找不到archiveModal或archiveList元素');
        return;
    }

    const allPosts = [...blogPosts, ...privatePosts];

    // 按年份分组
    const yearMap = new Map();
    allPosts.forEach(post => {
        const year = new Date(post.createdAt).getFullYear();
        if (!yearMap.has(year)) {
            yearMap.set(year, []);
        }
        yearMap.get(year).push(post);
    });

    // 按年份降序排列
    const sortedYears = Array.from(yearMap.keys()).sort((a, b) => b - a);

    if (sortedYears.length === 0) {
        archiveList.innerHTML = '<p class="empty-state">暂无归档</p>';
    } else {
        archiveList.innerHTML = sortedYears.map(year => {
            const posts = yearMap.get(year);
            const yearPosts = posts
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                .map(post => `
                    <li onclick="openBlogDetailById('${post.id}')">
                        <span class="archive-date">${formatDate(post.createdAt)}</span>
                        <span class="archive-title">${escapeHtml(post.title)}</span>
                    </li>
                `).join('');

            return `
                <div class="archive-year">
                    <h3>${year}年 (${posts.length}篇)</h3>
                    <ul class="archive-posts">
                        ${yearPosts}
                    </ul>
                </div>
            `;
        }).join('');
    }

    modal.style.display = 'block';
}

// 通过ID打开博客详情
function openBlogDetailById(id) {
    const allPosts = [...blogPosts, ...privatePosts];
    const post = allPosts.find(p => p.id === id);
    if (post) {
        openBlogDetail(post);
    }
}

// 关闭归档弹窗
function closeArchiveModal() {
    console.log('关闭归档弹窗');
    const modal = document.getElementById('archiveModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// 切换主题
function toggleTheme() {
    console.log('切换主题，当前:', isDarkMode);
    isDarkMode = !isDarkMode;
    document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');

    const themeBtn = document.getElementById('themeBtn');
    if (themeBtn) {
        const icon = themeBtn.querySelector('.theme-icon');
        if (icon) {
            icon.textContent = isDarkMode ? '☀️' : '🌙';
        }
    }
}

// 加载主题设置
function loadTheme() {
    console.log('加载主题设置');
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        isDarkMode = true;
        document.documentElement.setAttribute('data-theme', 'dark');
        const themeBtn = document.getElementById('themeBtn');
        if (themeBtn) {
            const icon = themeBtn.querySelector('.theme-icon');
            if (icon) {
                icon.textContent = '☀️';
            }
        }
    }
}

// 初始化
document.addEventListener('DOMContentLoaded', async function() {
    // 加载主题
    loadTheme();

    // 加载公开博客
    await loadPublicPosts();

    // 秘密点击显示私人空间
    const pageTitle = document.getElementById('pageTitle');
    pageTitle.style.cursor = 'pointer';
    pageTitle.addEventListener('click', function() {
        secretClickCount++;
        if (secretClickCount >= 5) {
            document.getElementById('privateNav').classList.remove('hidden');
            secretClickCount = 0;
        }
    });

    // 尝试加载私人博客
    const storedPrivate = localStorage.getItem('privateBlogData');
    if (storedPrivate) {
        privatePosts = JSON.parse(storedPrivate);
    }

    renderPosts();
    updateLastUpdateTime();

    // 导航点击事件
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const category = this.dataset.category;

            if (category === 'private') {
                openPasswordModal();
            } else {
                currentMode = 'public';
                currentCategory = category;
                updateNavActive(category);

                const titles = {
                    'all': '全部博客',
                    'work': '💼 工作',
                    'life': '🏠 生活',
                    'learning': '📚 学习',
                    'ideas': '💡 想法'
                };
                document.getElementById('pageTitle').textContent = titles[category] || '全部博客';

                renderPosts();
            }
        });
    });

    // 关于我按钮
    const aboutBtn = document.getElementById('aboutBtn');
    if (aboutBtn) {
        aboutBtn.addEventListener('click', openAboutModal);
    }

    // 归档按钮
    const archiveBtn = document.getElementById('archiveBtn');
    if (archiveBtn) {
        archiveBtn.addEventListener('click', openArchiveModal);
    }

    // 标签云按钮
    const tagsBtn = document.getElementById('tagsBtn');
    if (tagsBtn) {
        tagsBtn.addEventListener('click', openTagsModal);
    }

    // 主题切换按钮
    const themeBtn = document.getElementById('themeBtn');
    if (themeBtn) {
        themeBtn.addEventListener('click', toggleTheme);
    }

    // 私人空间导航点击
    document.getElementById('privateNav').addEventListener('click', function(e) {
        e.preventDefault();
        openPasswordModal();
    });

    // 口令弹窗事件
    document.getElementById('confirmPassword').addEventListener('click', verifyPassword);
    document.getElementById('cancelPassword').addEventListener('click', closePasswordModal);
    document.getElementById('privatePassword').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') verifyPassword();
    });

    // 博客详情弹窗事件
    const blogCloseBtn = document.querySelector('#blogModal .close');
    if (blogCloseBtn) {
        blogCloseBtn.addEventListener('click', closeBlogModal);
    }

    // 关于我弹窗事件
    const aboutCloseBtn = document.querySelector('#aboutModal .close');
    if (aboutCloseBtn) {
        aboutCloseBtn.addEventListener('click', closeAboutModal);
    }

    // 标签云弹窗事件
    const tagsCloseBtn = document.querySelector('#tagsModal .close');
    if (tagsCloseBtn) {
        tagsCloseBtn.addEventListener('click', closeTagsModal);
    }

    // 归档弹窗事件
    const archiveCloseBtn = document.querySelector('#archiveModal .close');
    if (archiveCloseBtn) {
        archiveCloseBtn.addEventListener('click', closeArchiveModal);
    }

    // 搜索事件
    document.getElementById('searchBox').addEventListener('input', renderPosts);

    // 点击弹窗外部关闭
    window.addEventListener('click', function(e) {
        const blogModal = document.getElementById('blogModal');
        const passwordModal = document.getElementById('passwordModal');
        const aboutModal = document.getElementById('aboutModal');
        const tagsModal = document.getElementById('tagsModal');
        const archiveModal = document.getElementById('archiveModal');

        if (e.target === blogModal) closeBlogModal();
        if (e.target === passwordModal) closePasswordModal();
        if (e.target === aboutModal) closeAboutModal();
        if (e.target === tagsModal) closeTagsModal();
        if (e.target === archiveModal) closeArchiveModal();
    });
});
