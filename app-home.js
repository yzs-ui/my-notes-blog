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
        // 确保图片加载
        profileImg.src = profileImg.src || '029d65a517d4f.jpeg';
        leftSection.style.display = 'flex';
    } else {
        // 手机设备：隐藏图片区域
        profileImg.src = '';
        profileImg.style.display = 'none';
        leftSection.style.display = 'none';
    }
}

// 监听窗口大小变化
window.addEventListener('resize', checkScreenSizeAndLoadImage);

// 页面加载时执行
document.addEventListener('DOMContentLoaded', function() {
    checkScreenSizeAndLoadImage();
    
    // 检查移动端图片加载情况
    const screenWidth = window.innerWidth;
    console.log('屏幕宽度:', screenWidth, '图片加载状态:', document.getElementById('profile-img').src);
});