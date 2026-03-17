// 首页的JavaScript

// 检测屏幕大小并控制图片加载
function checkScreenSizeAndLoadImage() {
    const profileImg = document.getElementById('profile-img');
    const leftSection = document.querySelector('.left-section');
    
    if (!profileImg || !leftSection) return;
    
    // 获取屏幕宽度
    const screenWidth = window.innerWidth;
    
    // 如果屏幕宽度大于768px，加载图片
    if (screenWidth > 768) {
        // 确保图片加载（先设置src，再显示）
        profileImg.src = 'profile-image.png';
        profileImg.style.display = 'block';
        leftSection.style.display = 'flex';
    } else {
        // 手机设备：彻底隐藏图片区域
        // 设置src为空白图像，避免加载
        profileImg.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="0" height="0"></svg>';
        profileImg.style.display = 'none';
        leftSection.style.display = 'none';
    }
}

// 监听窗口大小变化
window.addEventListener('resize', checkScreenSizeAndLoadImage);

// ==============================
// 生成浮动粒子
// ==============================
function createParticles() {
    const container = document.getElementById('left-particles');
    if (!container) return;

    const count = 20;
    for (let i = 0; i < count; i++) {
        const p = document.createElement('div');
        p.className = 'particle';

        const size = Math.random() * 5 + 2;       // 2~7px
        const left = Math.random() * 90 + 5;      // 5%~95%
        const duration = Math.random() * 9 + 7;   // 7~16s
        const delay = -(Math.random() * 15);       // 负延迟让它们立即出现在不同位置
        const drift = (Math.random() - 0.5) * 80; // 左右漂移

        p.style.cssText = `
            width: ${size}px;
            height: ${size}px;
            left: ${left}%;
            bottom: -${size}px;
            animation-name: floatUp;
            animation-timing-function: linear;
            animation-iteration-count: infinite;
            animation-duration: ${duration}s;
            animation-delay: ${delay}s;
            --drift: ${drift}px;
        `;
        container.appendChild(p);
    }
}

// ==============================
// 鼠标视差 —— 用 CSS 变量叠加偏移，完全不暂停 CSS 动画
// ==============================
function initParallax() {
    const leftSection = document.getElementById('left-section');
    const floatWrap   = document.getElementById('img-float-wrap');
    if (!leftSection || !floatWrap) {
        console.error('[Parallax] 关键元素缺失，跳过初始化');
        return;
    }

    if (leftSection.dataset.parallaxInited === 'true') {
        console.warn('[Parallax] 已初始化，跳过重复绑定');
        return;
    }
    leftSection.dataset.parallaxInited = 'true';

    let curX = 0, curY = 0;
    let tgtX = 0, tgtY = 0;
    let ticking = false;

    function lerp(a, b, t) { return a + (b - a) * t; }

    function update() {
        curX = lerp(curX, tgtX, 0.12);
        curY = lerp(curY, tgtY, 0.12);

        // 用 CSS 变量传递偏移量，与 CSS 动画的 transform 叠加
        floatWrap.style.setProperty('--mouse-x', `${curX.toFixed(2)}px`);
        floatWrap.style.setProperty('--mouse-y', `${curY.toFixed(2)}px`);

        const dist = Math.abs(curX) + Math.abs(curY);
        if (dist < 0.05) {
            // 归零时移除变量，CSS 动画继续
            floatWrap.style.removeProperty('--mouse-x');
            floatWrap.style.removeProperty('--mouse-y');
        }

        ticking = false;
    }

    leftSection.addEventListener('mousemove', function(e) {
        const rect = leftSection.getBoundingClientRect();
        const nx = (e.clientX - rect.left) / rect.width  * 2 - 1;
        const ny = (e.clientY - rect.top)  / rect.height * 2 - 1;
        tgtX = nx * 20;
        tgtY = ny * 14;

        if (!ticking) {
            ticking = true;
            requestAnimationFrame(update);
        }
    });

    leftSection.addEventListener('mouseleave', function() {
        tgtX = 0;
        tgtY = 0;
        if (!ticking) {
            ticking = true;
            requestAnimationFrame(update);
        }
    });

    console.log('[Parallax] 初始化完成，使用 CSS 变量叠加模式');
}

// 页面加载时执行
document.addEventListener('DOMContentLoaded', function() {
    checkScreenSizeAndLoadImage();
    createParticles();
    initParallax();

    const screenWidth = window.innerWidth;
    console.log('屏幕宽度:', screenWidth);

    // 调试日志
    console.log('[Parallax] initParallax 已调用');
    console.log('[Particles] 粒子容器:', document.getElementById('left-particles'));
    console.log('[FloatWrap] 漂浮层:', document.getElementById('img-float-wrap'));
});