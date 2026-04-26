// utils.js - Các hàm tiện ích dùng chung

// Hiển thị toast notification
function showToast(message, type = 'success') {
    // Tạo container nếu chưa có
    let toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container';
        document.body.appendChild(toastContainer);
    }
    
    const toastId = 'toast_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
    const bgClass = type === 'success' ? 'bg-success' : (type === 'error' ? 'bg-danger' : (type === 'warning' ? 'bg-warning' : 'bg-info'));
    const textClass = type === 'warning' ? 'text-dark' : 'text-white';
    
    const toastHtml = `
        <div id="${toastId}" class="toast align-items-center ${bgClass} ${textClass} border-0 mb-2" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="d-flex">
                <div class="toast-body">${escapeHtml(message)}</div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
        </div>
    `;
    
    toastContainer.insertAdjacentHTML('beforeend', toastHtml);
    const toastElement = document.getElementById(toastId);
    
    if (typeof bootstrap !== 'undefined' && bootstrap.Toast) {
        const toast = new bootstrap.Toast(toastElement, { delay: APP_CONFIG?.TOAST_DURATION || 3000 });
        toast.show();
    } else {
        // Fallback nếu Bootstrap chưa load
        toastElement.style.display = 'block';
        setTimeout(() => {
            toastElement.remove();
        }, 3000);
    }
    
    toastElement.addEventListener('hidden.bs.toast', () => {
        toastElement.remove();
    });
}

// Format currency VND
function formatCurrency(amount) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

// Format date
function formatDate(dateString, format = 'datetime') {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    if (format === 'date') {
        return date.toLocaleDateString('vi-VN');
    } else if (format === 'time') {
        return date.toLocaleTimeString('vi-VN');
    }
    return date.toLocaleString('vi-VN');
}

// Escape HTML để tránh XSS
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Validate email
function isValidEmail(email) {
    const re = /^[^\s@]+@([^\s@.,]+\.)+[^\s@.,]{2,}$/;
    return re.test(email);
}

// Get role badge class
function getRoleBadgeClass(role) {
    const classes = {
        admin: 'role-admin',
        director: 'role-director',
        department_head: 'role-department_head',
        team_leader: 'role-team_leader',
        employee: 'role-employee'
    };
    return classes[role] || 'role-employee';
}

// Get role display name
function getRoleDisplayName(role) {
    const names = {
        admin: 'Quản trị viên',
        director: 'Giám đốc',
        department_head: 'Trưởng phòng',
        team_leader: 'Trưởng nhóm',
        employee: 'Nhân viên'
    };
    return names[role] || role;
}

// Check permission
function hasPermission(userRole, requiredRole) {
    const hierarchy = {
        admin: 5,
        director: 4,
        department_head: 3,
        team_leader: 2,
        employee: 1
    };
    return (hierarchy[userRole] || 0) >= (hierarchy[requiredRole] || 0);
}

// Get role symbol
function getRoleSymbol(role) {
    const symbols = {
        admin: '⚙️',
        director: '👑',
        department_head: '📁',
        team_leader: '👥',
        employee: '👤'
    };
    return symbols[role] || '👤';
}

// Gắn vào window để dùng toàn cục
if (typeof window !== 'undefined') {
    window.showToast = showToast;
    window.formatCurrency = formatCurrency;
    window.formatDate = formatDate;
    window.escapeHtml = escapeHtml;
    window.isValidEmail = isValidEmail;
    window.getRoleBadgeClass = getRoleBadgeClass;
    window.getRoleDisplayName = getRoleDisplayName;
    window.hasPermission = hasPermission;
    window.getRoleSymbol = getRoleSymbol;
}