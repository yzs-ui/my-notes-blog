// 博客应用 - 集成 Supabase
// 注意：Supabase 客户端已在 HTML 中初始化，存储在 window.blogSupabase

// ==================== 全局变量 ====================
const blogSupabase = window.blogSupabase;
let blogPosts = [];
let titleClickCount = 0;
let clickTimeout = null;
let isAdminMode = false;
const ADMIN_PASSWORD = '55999';
let blogPosts = [];
let titleClickCount = 0;
let clickTimeout = null;
let isAdminMode = false;
const ADMIN_PASSWORD = '55999';

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

    // 加载博客文章
    loadBlogPosts();
});

// ==================== 管理模式相关 ====================
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

// ==================== 新增文章相关 ====================
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

// ==================== 加载博客数据（从 Supabase） ====================
async function loadBlogPosts() {
    try {
        if (!blogSupabase) {
            console.error('❌ Supabase 未初始化');
            showEmptyState();
            return;
        }

        console.log('📡 正在从 Supabase 加载文章...');

        // 从 Supabase 读取所有文章，按更新时间倒序
        const { data, error } = await blogSupabase
            .from('posts')
            .select('*')
            .order('updated_at', { ascending: false });

        if (error) {
            console.error('❌ 加载文章失败:', error);
            showToast('加载文章失败', 'error');
            showEmptyState();
            return;
        }

        console.log('✅ 加载文章成功，共', data.length, '篇');

        // 转换数据格式（数据库字段名改为驼峰命名）
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
    } catch (error) {
        console.error('加载博客失败:', error);
        showToast('加载失败，请刷新重试', 'error');
        showEmptyState();
    }
}

// ==================== 渲染相关 ====================
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
        console.log('🗑️ 正在从 Supabase 删除文章...');

        const { error } = await supabase
            .from('posts')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('❌ 删除失败:', error);
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

// ==================== 弹窗交互 ====================
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

// ==================== 发布文章 ====================
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

    try {
        console.log('📝 正在发布文章到 Supabase...');

        const { data, error } = await blogSupabase
            .from('posts')
            .insert([{
                title: title,
                content: content,
                category: category,
                tags: tags
            }])
            .select();

        if (error) {
            console.error('❌ 发布失败:', error);
            showToast('发布失败，请重试', 'error');
            return;
        }

        console.log('✅ 文章发布成功，ID:', data[0].id);

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

// ==================== Toast 提示 ====================
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

// ==================== 导入历史文章 ====================
async function importHistoricalPosts() {
    const historicalPosts = [
        {
            "title": "WorkBuddy技能安装汇总",
            "category": "learning",
            "content": "今天安装了以下技能：\n\n1. hot-skills（热门技能包）- 已启用\n   - 包含36个子技能\n   - find-skills、skill-vetter、humanizer、summarize等\n2. agent-browser - 浏览器自动化\n3. Tavily Search - AI网络搜索\n   - 安装命令: npx skills add tavily-ai/skills@search\n4. GitHub CLI (gh-cli) - GitHub操作工具\n   - 安装命令: npx skills add github/awesome-copilot@gh-cli\n\nGitHub CLI安装过程：\n- 使用PowerShell下载并解压到本地\n- 成功授权登录账号 yzs-ui\n- 创建了自动化发布脚本",
            "tags": "WorkBuddy,技能,AI,GitHub,学习"
        },
        {
            "title": "笔记网站创建记录",
            "category": "learning",
            "content": "今天创建了一个笔记网站项目：\n\n项目信息：\n- 仓库地址: https://github.com/yzs-ui/my-notes\n- 网站地址: https://yzs-ui.github.io/my-notes/\n- 技术栈: HTML + CSS + JavaScript\n- 部署方式: GitHub Pages\n\n实现功能：\n1. 笔记CRUD操作（增删改查）\n2. 分类管理（工作、生活、学习、想法）\n3. 标签系统\n4. 搜索和筛选\n5. 数据本地存储\n6. 响应式设计\n\n使用方法：\n- 直接在网站上手动编辑\n- 告诉AI助手整理发布笔记，自动更新到网站",
            "tags": "GitHub,网站,项目,学习"
        },
        {
            "title": "春回川沙：打工人的第二故乡",
            "category": "life",
            "content": "# 春回川沙：打工人的第二故乡\n\n## 序章：春风里的打工人\n\n三月的上海，春风已经染绿了浦江两岸。对于我这个在川沙打工的异乡人来说，每年这个时候，心底总会泛起一阵莫名的悸动——那是来自川沙古镇的温暖。\n\n川沙，这个位于浦东新区东北角的千年古镇，虽然不是我的故乡，却成了我离开家乡后最长停留的地方。五年前，我背着行囊来到这里，在这座古镇里打拼生活，不知不觉中，它已经成了我的第二故乡。\n\n## 一、初春的川沙：水墨画中的古镇\n\n从打工的地方出来，沿着新川路往东走，便渐渐进入了川沙的地界。城市的喧嚣开始淡去，取而代之的是一份难得的宁静。\n\n每天下班后，我喜欢骑着共享单车穿过川沙的街头巷尾，感受这座古镇的慢节奏。相比起陆家嘴的高楼大厦和川沙地铁站的拥挤人流，这里的生活显得格外悠然。\n\n春天的川沙，最让人着迷的是它那如水墨画般的轮廓。青灰色的城墙在薄雾中若隐若现，护城河的波光在晨曦中闪烁，河岸边的柳树已经抽出了嫩绿的枝条，在微风中轻轻摇曳。\n\n**护城河畔的早樱**是川沙春天的第一道风景。每年三月初，川沙公园的樱花树便迫不及待地绽放。粉白色的花瓣如云似霞，与古老的城墙相映成趣，构成了一幅古今交融的美丽画卷。\n\n## 二、古城墙下的岁月\n\n川沙的古城墙，始建于明朝嘉靖年间，是上海地区保存最完整的古城墙之一。对于我这个异乡打工人而言，这道城墙不仅是历史的见证，更是心灵的归宿。\n\n周末的时候，我喜欢沿着城墙慢慢行走。脚下的青石板路已经磨得发亮，那是无数脚步走过的痕迹。墙头上，不知名的小草顽强地钻出石缝，在春风中舒展着嫩绿的叶片，仿佛在诉说着生命的坚韧。\n\n有时候我会想，这些小草多像我们这些在异乡打拼的人啊——无论环境多么艰苦，都要顽强地生长下去。\n\n登上城楼，整个川沙镇尽收眼底。远处的农田已经翻耕完毕，泥土的气息混合着青草的香味扑面而来。近处，老街的屋檐下挂着红灯笼，几家老茶馆里传出了评弹的悠扬曲调。这样的场景，让人仿佛穿越了时空，回到了那个车马邮件都慢的年代。在这里，我可以暂时忘记工作的压力，享受片刻的宁静。\n\n## 三、老街的烟火气\n\n川沙的春天，最动人的莫过于老街上的烟火气。\n\n早晨六点半，当我从出租屋出来，准备去赶地铁上班时，老街就已经开始苏醒了。**老街包子铺**的蒸笼里冒出腾腾热气，肉包子的香味飘散在整条街上。老板娘手脚麻利，一边包着包子，一边和熟客们寒暄着家常。\n\n\"小伙子，今天又这么早啊？\"老板娘一眼就认出了我。\n\n\"嗯，今天要赶项目，\"我笑着回答，\"来两个包子，一杯豆浆。\"\n\n\"好嘞，趁热吃，\"她熟练地打包好递给我，\"辛苦了！\"\n\n接过热气腾腾的包子，咬上一口，熟悉的香味在口中散开。这一刻，所有的疲惫都烟消云散了。在异乡打拼的日子里，这样一句简单的问候，一个热乎乎的包子，就成了我一天中最温暖的时刻。\n\n上午九点，老街上渐渐热闹起来。卖菜的阿婆推着小车，叫卖着新鲜的小青菜和马兰头；卖花的老人挑着担子，担子里的海棠花和杜鹃花争奇斗艳；还有挑着担子卖青团的，那抹碧绿的颜色，是春天最独特的标记。\n\n## 四、川沙的春天味道\n\n说到青团，就不得不提川沙春天的味道。\n\n青团是江南一带的传统美食，而川沙的青团有着独特的制作工艺。用新鲜的艾草汁液和糯米粉揉成面团，包上豆沙或芝麻馅，蒸出来的青团色泽青翠，软糯香甜，带着淡淡的草香。\n\n**老街上的阿婆青团店**已经开了三代人。店主王阿婆今年七十多岁了，但依然坚持手工制作。她说，机器做的青团虽然快，但少了那份手工的温度。\n\n我站在旁边，看着王阿婆熟练地揉面、包馅、蒸制。她的手上布满了皱纹，但动作依然麻利。每一颗青团都圆润饱满，像是艺术品一样。\n\n\"小伙子，尝尝吧，刚出锅的，\"王阿婆笑着递给我一颗。\n\n我接过青团，轻轻咬了一口。软糯的皮在舌尖化开，甜而不腻的豆沙馅流了出来，艾草的清香在口中久久不散。这就是春天的味道，是故乡的味道。\n\n## 五、打工人的川沙情\n\n夜幕降临，我坐在出租屋的阳台上，望着川沙的夜空。\n\n古人说：\"举头望明月，低头思故乡。\"对于常年在外奔波的打工人来说，故乡永远是一个温暖的牵挂。但川沙，这个我生活了五年的地方，也渐渐成了我生命中不可分割的一部分。\n\n还记得刚来川沙的时候，我对这里的一切都感到陌生。没有亲人，没有朋友，每天除了工作就是待在出租屋里。但是慢慢地，我认识了一些同样在这里打拼的朋友，熟悉了这里的每一条街道，爱上了这里的烟火气。\n\n记得第一个春天，我因为工作压力大，整个人都很焦虑。那天傍晚，我一个人漫无目的地走在川沙公园里，看着满树的樱花在夕阳下绽放，突然就释怀了。我想，即使生活再艰难，也要像这些樱花一样，努力地绽放出最美的自己。\n\n## 六、川沙的改变\n\n今天的川沙，在保持传统韵味的同时，也在悄然发生着变化。\n\n古镇保护与开发并重的策略，让川沙在现代化进程中依然保持着它独特的魅力。老街上，传统的手工艺店依然在坚守，同时也有一些新兴的咖啡馆和文创店落户，为这座千年古镇注入了新的活力。\n\n今年春天，川沙还举办了一场**传统文化节**。老街上挂满了红灯笼，各种传统手工艺展示、民俗表演轮番上演。游客们穿梭在古街古巷中，感受着这座古镇的文化底蕴。\n\n我也看到，很多像我一样的打工人，在这里找到了自己的位置。有的在川沙开了小店，有的在古镇里找到了稳定的工作，有的选择在这里定居下来。我们这些来自五湖四海的人，用我们的方式，为这座古镇增添着新的色彩。\n\n## 尾声：川沙，我的第二故乡\n\n春天又来了，川沙的樱花又开了。\n\n对于在外打拼的人来说，无论走多远，无论在外面经历了什么，总有一个地方可以让人安心停靠。对我来说，川沙就是这样一个地方。它不是我的故乡，却承载了我太多的回忆和情感。\n\n明天，我又要开始新一周的工作。但我知道，无论工作多忙多累，只要回到川沙，看到古城墙上的春天，闻到老街上的烟火气，我的心里就会感到踏实。\n\n这就是川沙，一座承载着千年历史的古镇，一个让无数打工人找到温暖和归属的地方。它用它的包容和温暖，接纳了我们这些来自五湖四海的人，让我们在这里找到了家的感觉。",
            "tags": "春天,上海,川沙,打工人,生活,情感"
        },
        {
            "title": "博客首页视觉灵动化升级",
            "category": "learning",
            "content": "# 博客首页视觉灵动化升级\n\n## 升级日期\n**2026年3月17日**\n\n## 🎨 核心更新\n\n### 1. 头像图片更新\n- 替换为个人微信头像 `profile-image.png`\n- 优化图片定位，优先展示人物上半身\n\n\n### 2. 多层灵动效果\n\n#### 🌊 呼吸光晕背景\n- 蓝色光圈在图片后缓慢放大缩小\n- 4秒循环，营造氛围感\n- 亮度变化：50% ~ 100%\n\n#### ✨ 浮动粒子系统\n- 20颗蓝色光点从底部向上漂浮\n- 粒子大小：2-7px\n- 漂浮速度：7-16秒循环\n- 左右随机漂移：±40px\n\n#### 🎬 图片入场动画\n- 从模糊下移 → 清晰归位\n- 持续1.4秒\n- 缩放：1.1 → 1.03\n- 模糊：16px → 0px\n\n#### 🌫️ 顶底渐变遮罩\n- 顶部20%渐变遮罩，融入深色背景\n- 底部35%渐变遮罩，自然过渡\n- 避免图片边缘生硬\n\n#### 💫 扫光线效果\n- 每6秒从上到下扫过\n- 蓝色渐变线条，透明度最高12%\n- 营造科技感和流动感\n\n\n### 3. 图片持续漂浮\n- 8秒循环漂浮动画\n- 上下±14px轻微游移\n- 轻微缩放：1.03 ~ 1.04\n- 持续循环，永不停止\n\n\n### 4. 色调呼吸\n- 6秒循环色调变化\n- 亮度：±7%\n- 饱和度：±18%\n- 色相旋转：±5度\n- 图片有生命感\n\n\n### 5. 鼠标视差跟随\n- 鼠标在左侧移动，图片跟随偏移\n- 最大偏移：X轴20px，Y轴14px\n- 平滑插值，延迟0.1\n- 鼠标移出平滑回弹\n- CSS变量叠加，不干扰漂浮动画\n\n## 🔧 技术实现\n\n### HTML结构\n```html\n<div class=\"left-section\">\n    <div class=\"left-particles\"></div>  <!-- 粒子容器 -->\n    <div class=\"left-scan-line\"></div>   <!-- 扫光线 -->\n    <div class=\"profile-image\">\n        <div class=\"img-float-wrap\">    <!-- 漂浮层 -->\n            <img src=\"profile-image.png\" id=\"profile-img\">\n        </div>\n    </div>\n</div>\n```\n\n### CSS关键动画\n```css\n/* 漂浮动画（永不暂停） */\n@keyframes imgFloat {\n    0%   { transform: translate(0px,    0px) scale(1.03); }\n    20%  { transform: translate(3px,   -8px) scale(1.04); }\n    40%  { transform: translate(0px,  -14px) scale(1.035); }\n    60%  { transform: translate(-4px,  -8px) scale(1.04); }\n    80%  { transform: translate(-2px,  -3px) scale(1.03); }\n    100% { transform: translate(0px,    0px) scale(1.03); }\n}\n\n/* 色调呼吸 */\n@keyframes imgColor {\n    0%,  100% { filter: brightness(1)    saturate(1); }\n    33%        { filter: brightness(1.07) saturate(1.15); }\n    66%        { filter: brightness(0.95) saturate(0.92); }\n}\n```\n\n### JavaScript视差逻辑\n```javascript\n// CSS变量叠加偏移，不暂停CSS动画\nleftSection.addEventListener('mousemove', function(e) {\n    const rect = leftSection.getBoundingClientRect();\n    const nx = (e.clientX - rect.left) / rect.width  * 2 - 1;\n    const ny = (e.clientY - rect.top)  / rect.height * 2 - 1;\n    floatWrap.style.setProperty('--mouse-x', `${(nx * 20).toFixed(2)}px`);\n    floatWrap.style.setProperty('--mouse-y', `${(ny * 14).toFixed(2)}px`);\n});\n```\n\n## 🎯 视觉效果层级\n```\nleft-section (深色渐变背景)\n  └─ left-particles (z-index: 11) - 浮动粒子层\n  └─ left-scan-line  (z-index: 12) - 扫光线\n  └─ ::after (z-index: 10) - 呼吸光晕\n  └─ profile-image (z-index: 3)\n       └─ img-float-wrap (z-index: 内置)\n            └─ img (入场 + 色调呼吸)\n```\n\n## ✨ 优化要点\n- **动画分离**：漂浮、入场、色调三组动画独立，互不冲突\n- **永不暂停**：CSS漂浮动画持续运行，鼠标视差通过CSS变量叠加\n- **性能优化**：`will-change`提示浏览器优化，`requestAnimationFrame`节流鼠标事件\n- **z-index管理**：粒子、光晕、扫光线层级清晰，不遮挡图片\n\n## 📦 修改文件\n- `index.html` - 新增`img-float-wrap`容器\n- `styles-home.css` - 新增多层动画和CSS变量\n- `app-home.js` - 视差逻辑改为CSS变量叠加\n- `profile-image.png` - 新的头像图片\n- `博客网站升级记录.md` - 添加本次更新记录\n\n## 🚀 部署状态\n- 提交哈希：`d471fe3`\n- 推送分支：`gh-pages`\n- 发布时间：2026-03-17\n\n---\n\n*本次升级为博客首页带来了丰富的视觉层次和交互体验，多层动画叠加让页面充满活力。*",
            "tags": "博客,前端,动画,CSS,JavaScript,视觉"
        }
    ];

    try {
        console.log('📦 开始导入', historicalPosts.length, '篇历史文章...\n');

        let successCount = 0;
        let failCount = 0;

        for (const post of historicalPosts) {
            try {
                const { data, error } = await blogSupabase
                    .from('posts')
                    .insert([{
                        title: post.title,
                        content: post.content,
                        category: post.category,
                        tags: post.tags
                    }])
                    .select();

                if (error) {
                    console.error('❌ 导入失败:', post.title, error.message);
                    failCount++;
                } else {
                    console.log('✅ 导入成功:', post.title);
                    successCount++;
                }
            } catch (e) {
                console.error('❌ 导入异常:', post.title, e.message);
                failCount++;
            }
        }

        console.log('\n📊 导入完成！');
        console.log('成功:', successCount, '篇');
        console.log('失败:', failCount, '篇');

        showToast(`导入完成！成功 ${successCount} 篇，失败 ${failCount} 篇`, successCount > 0 ? 'success' : 'error');

        // 重新加载文章列表
        if (successCount > 0) {
            await loadBlogPosts();
        }
    } catch (error) {
        console.error('❌ 导入失败:', error);
        showToast('导入失败，请查看控制台', 'error');
    }
}
