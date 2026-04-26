// config.js - Cấu hình tập trung cho toàn bộ ứng dụng
// File này PHẢI được load đầu tiên trước các file JS khác

const APP_CONFIG = {
    // API Endpoints
    API_BASE_URL: '/api',
    ENDPOINTS: {
        LOGIN: '/api/login',
        LOGOUT: '/api/logout',
        ME: '/api/me',
        USERS: '/api/users',
        SALARY: '/api/salary',
        PROFILE: '/api/profile'
    },
    
    // Constants
    BASE_SALARY: 4500000,
    COMMISSION_RATE: 0.05,
    SENIORITY_RATE: 0.03,
    SESSION_MAX_AGE: 86400000,
    
    // Role coefficients
    ROLE_COEFFICIENTS: {
        employee: { van_phong: 2.2, kinh_doanh: 2.0 },
        team_leader: { van_phong: 2.5, kinh_doanh: 2.5 },
        department_head: { van_phong: 2.8, kinh_doanh: 2.8 },
        director: 4.0,
        admin: 4.0
    },
    
    ROLE_HIERARCHY: {
        admin: 5,
        director: 4,
        department_head: 3,
        team_leader: 2,
        employee: 1
    },
    
    JOB_TYPES: {
        VAN_PHONG: 'van_phong',
        KINH_DOANH: 'kinh_doanh'
    },
    
    ROLE_NAMES: {
        admin: 'Quản trị viên',
        director: 'Giám đốc',
        department_head: 'Trưởng phòng',
        team_leader: 'Trưởng nhóm',
        employee: 'Nhân viên'
    },
    
    TOAST_DURATION: 3000,
    ITEMS_PER_PAGE: 10
};

// Đảm bảo biến toàn cục
if (typeof window !== 'undefined') {
    window.APP_CONFIG = APP_CONFIG;
}

// Export cho Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = APP_CONFIG;
}