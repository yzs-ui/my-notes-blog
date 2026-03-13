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
        profileImg.src = '029d65a517d4f.jpeg';
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

// 页面加载时执行
document.addEventListener('DOMContentLoaded', function() {
    checkScreenSizeAndLoadImage();
    
    // 检查移动端图片加载情况
    const screenWidth = window.innerWidth;
    console.log('屏幕宽度:', screenWidth);
    console.log('图片显示状态:', document.getElementById('profile-img').style.display);
});