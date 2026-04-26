// auth.js - Xử lý xác thực người dùng

// Biến toàn cục lưu thông tin user hiện tại
let currentUser = null;

// Kiểm tra trạng thái đăng nhập
async function checkAuth() {
    try {
        const response = await fetch('/api/me', {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            currentUser = await response.json();
            
            // Cập nhật UI nếu đang ở trang home
            if (window.location.pathname.includes('home.html')) {
                updateUserUI();
                // Load dữ liệu ban đầu nếu có hàm
                if (typeof loadDashboardData === 'function') {
                    loadDashboardData();
                }
                if (typeof loadUsers === 'function') {
                    loadUsers();
                }
            }
            return true;
        } else {
            // Chưa đăng nhập, chuyển về trang login nếu đang ở trang home
            if (window.location.pathname.includes('home.html')) {
                window.location.href = '/index.html';
            }
            return false;
        }
    } catch (error) {
        console.error('Auth check failed:', error);
        if (window.location.pathname.includes('home.html')) {
            window.location.href = '/index.html';
        }
        return false;
    }
}

// Xử lý đăng nhập
async function handleLogin(email, password) {
    if (!email || !password) {
        if (typeof showToast === 'function') {
            showToast('Vui lòng nhập đầy đủ email và mật khẩu', 'warning');
        } else {
            alert('Vui lòng nhập đầy đủ email và mật khẩu');
        }
        return false;
    }
    
    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password }),
            credentials: 'include'
        });
        
        const data = await response.json();
        
        if (response.ok) {
            if (typeof showToast === 'function') {
                showToast('Đăng nhập thành công! Đang chuyển hướng...', 'success');
            }
            currentUser = data.user;
            setTimeout(() => {
                window.location.href = data.redirectUrl || '/home.html';
            }, 500);
            return true;
        } else {
            if (typeof showToast === 'function') {
                showToast(data.message || 'Đăng nhập thất bại', 'error');
            } else {
                alert(data.message || 'Đăng nhập thất bại');
            }
            return false;
        }
    } catch (error) {
        console.error('Login error:', error);
        if (typeof showToast === 'function') {
            showToast('Lỗi kết nối server', 'error');
        } else {
            alert('Lỗi kết nối server');
        }
        return false;
    }
}

// Xử lý đăng xuất
async function handleLogout() {
    try {
        const response = await fetch('/api/logout', {
            method: 'POST',
            credentials: 'include'
        });
        
        if (response.ok) {
            if (typeof showToast === 'function') {
                showToast('Đăng xuất thành công', 'success');
            }
            currentUser = null;
            setTimeout(() => {
                window.location.href = '/index.html';
            }, 500);
        } else {
            if (typeof showToast === 'function') {
                showToast('Đăng xuất thất bại', 'error');
            }
        }
    } catch (error) {
        console.error('Logout error:', error);
        if (typeof showToast === 'function') {
            showToast('Lỗi kết nối server', 'error');
        }
    }
}

// Cập nhật UI sau khi đăng nhập
function updateUserUI() {
    if (!currentUser) return;
    
    // Cập nhật tên user
    const userNameElements = document.querySelectorAll('#userNameDisplay, .user-name');
    userNameElements.forEach(el => {
        if (el) el.textContent = currentUser.fullName;
    });
    
    // Cập nhật avatar/ký hiệu
    const avatarElements = document.querySelectorAll('#userAvatarDisplay, .user-avatar');
    avatarElements.forEach(el => {
        if (el) el.innerHTML = getRoleSymbol(currentUser.role);
    });
    
    // Hiển thị welcome message
    const welcomeEl = document.getElementById('welcomeMessage');
    if (welcomeEl) {
        const roleName = getRoleDisplayName(currentUser.role);
        welcomeEl.innerHTML = `Xin chào ${escapeHtml(currentUser.fullName)} <span class="role-badge ${getRoleBadgeClass(currentUser.role)}">${roleName}</span>`;
    }
    
    // Ẩn/hiện menu admin dựa trên quyền
    const adminMenu = document.getElementById('adminMenu');
    if (adminMenu) {
        const hasAdminAccess = hasPermission(currentUser.role, 'department_head');
        adminMenu.style.display = hasAdminAccess ? 'block' : 'none';
    }
}

// Khởi tạo trang login
function initLoginPage() {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email')?.value;
            const password = document.getElementById('password')?.value;
            await handleLogin(email, password);
        });
    }
}

// Khởi tạo trang home
function initHomePage() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
    
    // Kiểm tra đăng nhập
    checkAuth();
}

// Tự động khởi tạo dựa trên trang hiện tại
document.addEventListener('DOMContentLoaded', () => {
    const path = window.location.pathname;
    if (path.includes('index.html') || path === '/' || path === '/index.html') {
        initLoginPage();
    } else if (path.includes('home.html')) {
        initHomePage();
    }
});

// Export cho window
if (typeof window !== 'undefined') {
    window.currentUser = currentUser;
    window.checkAuth = checkAuth;
    window.handleLogin = handleLogin;
    window.handleLogout = handleLogout;
    window.updateUserUI = updateUserUI;
}