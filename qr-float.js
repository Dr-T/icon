// 二维码浮窗组件
document.addEventListener('DOMContentLoaded', function() {
    // 创建浮窗元素
    const qrFloat = document.createElement('div');
    qrFloat.className = 'qr-float';
    qrFloat.innerHTML = `
        <div class="qr-float-content">
            <p class="qr-text">扫码交流</p>
            <img src="assets/QR.jpg" alt="联系二维码" class="qr-image">
            <p class="qr-feedback">如遇问题，欢迎反馈</p>
        </div>
        <button class="qr-toggle" aria-label="折叠/展开二维码">
            <span class="toggle-icon"></span>
        </button>
    `;
    
    // 添加到body
    document.body.appendChild(qrFloat);
    
    // 获取折叠按钮和内容区域
    const toggleBtn = qrFloat.querySelector('.qr-toggle');
    const qrContent = qrFloat.querySelector('.qr-float-content');
    
    // 从localStorage获取折叠状态，默认为展开(false)
    let isCollapsed = localStorage.getItem('qrFloatCollapsed') === 'true';
    
    // 初始化折叠状态
    if (isCollapsed) {
        qrFloat.classList.add('collapsed');
    }
    
    // 切换折叠状态
    toggleBtn.addEventListener('click', function() {
        isCollapsed = !isCollapsed;
        if (isCollapsed) {
            qrFloat.classList.add('collapsed');
        } else {
            qrFloat.classList.remove('collapsed');
        }
        
        // 保存状态到localStorage
        localStorage.setItem('qrFloatCollapsed', isCollapsed);
    });
});