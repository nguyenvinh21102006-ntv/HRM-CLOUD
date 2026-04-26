// main.js - Logic chính cho trang home (dashboard, điều hướng, khởi tạo)

// Khởi tạo toàn bộ ứng dụng
document.addEventListener('DOMContentLoaded', async () => {
    // Đợi auth check hoàn tất
    if (typeof checkAuth === 'function') {
        const isAuthenticated = await checkAuth();
        if (!isAuthenticated) return;
    }
    
    // Khởi tạo attendance
    if (typeof initAttendance === 'function') {
        initAttendance();
    }
    
    // Khởi tạo history
    if (typeof initHistory === 'function') {
        initHistory();
    }
    
    // Load dữ liệu ban đầu
    await loadDashboardData();
    await fetchUsers();
    
    // Gắn event listeners
    attachEventListeners();
});

// Gắn event listeners cho các thành phần giao diện
function attachEventListeners() {
    // Theme toggle
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }
    
    // Search input (nếu có)
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(handleSearch, 300));
    }
    
    // Refresh button
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', async () => {
            await fetchUsers();
            await renderUserTable();
            showToast('Dữ liệu đã được làm mới', 'success');
        });
    }
}

// Toggle theme (Dark/Light/Auto)
function toggleTheme() {
    const currentTheme = document.body.classList.contains('light-theme') ? 'light' : 'dark';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.body.classList.remove('dark-theme', 'light-theme', 'auto-theme');
    document.body.classList.add(`${newTheme}-theme`);
    
    localStorage.setItem('theme', newTheme);
    
    const themeIcon = document.getElementById('themeIcon');
    if (themeIcon) {
        themeIcon.innerHTML = newTheme === 'dark' ? '🌙' : '☀️';
    }
    
    showToast(`Đã chuyển sang chế độ ${newTheme === 'dark' ? 'tối' : 'sáng'}`, 'info');
}

// Load dữ liệu dashboard
async function loadDashboardData() {
    try {
        const response = await fetch(APP_CONFIG.ENDPOINTS.USERS, { credentials: 'include' });
        if (response.ok) {
            const users = await response.json();
            
            // Cập nhật số liệu thống kê
            const totalEmployeesEl = document.getElementById('totalEmployees');
            if (totalEmployeesEl) totalEmployeesEl.innerText = users.length;
            
            // Tính tổng lương
            let totalSalary = 0;
            for (const user of users) {
                const salaryData = await calculateUserSalary(user._id);
                totalSalary += salaryData?.salary || 0;
            }
            
            const totalSalaryEl = document.getElementById('totalSalary');
            if (totalSalaryEl) totalSalaryEl.innerText = formatCurrency(totalSalary);
            
            // Cập nhật hoạt động gần đây
            const recentActivities = document.getElementById('recentActivities');
            if (recentActivities && typeof getRecentActivities === 'function') {
                const activities = getRecentActivities(5);
                if (activities.length > 0) {
                    recentActivities.innerHTML = activities.map(a => `
                        <div class="border-bottom border-secondary pb-2 mb-2">
                            <small class="text-muted">${formatDate(a.timestamp)}</small>
                            <div><strong>${escapeHtml(a.userName || 'Hệ thống')}</strong> đã ${a.action} ${a.targetType}</div>
                        </div>
                    `).join('');
                }
            }
        }
    } catch (error) {
        console.error('Load dashboard error:', error);
    }
}

// Xử lý tìm kiếm
function handleSearch(event) {
    const searchTerm = event.target.value.toLowerCase();
    if (!searchTerm) {
        renderUserTable();
        return;
    }
    
    const filteredUsers = usersList.filter(user => 
        user.fullName.toLowerCase().includes(searchTerm) ||
        user.email.toLowerCase().includes(searchTerm) ||
        getRoleDisplayName(user.role).toLowerCase().includes(searchTerm)
    );
    
    renderUserTable('usersTableBody', filteredUsers);
}

// Hiển thị dashboard view
function showDashboard() {
    const mainContent = document.getElementById('mainContent');
    if (!mainContent) return;
    
    mainContent.innerHTML = `
        <div class="dashboard-container">
            <div class="row dashboard-cards">
                <div class="col-md-3 mb-3">
                    <div class="stat-card">
                        <div class="stat-icon">👥</div>
                        <div class="stat-value" id="totalEmployees">0</div>
                        <div class="stat-label">Tổng số nhân viên</div>
                    </div>
                </div>
                <div class="col-md-3 mb-3">
                    <div class="stat-card">
                        <div class="stat-icon">💰</div>
                        <div class="stat-value" id="totalSalary">0</div>
                        <div class="stat-label">Tổng lương tháng này</div>
                    </div>
                </div>
                <div class="col-md-3 mb-3">
                    <div class="stat-card">
                        <div class="stat-icon">⏱️</div>
                        <div class="stat-value" id="attendanceToday">0</div>
                        <div class="stat-label">Đã chấm công hôm nay</div>
                    </div>
                </div>
                <div class="col-md-3 mb-3">
                    <div class="stat-card">
                        <div class="stat-icon">📋</div>
                        <div class="stat-value" id="totalHistory">0</div>
                        <div class="stat-label">Lịch sử thay đổi</div>
                    </div>
                </div>
            </div>
            <div class="row mt-4">
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-header">📊 Phân bố nhân sự theo phòng ban</div>
                        <div class="card-body">
                            <canvas id="deptChart" height="200"></canvas>
                        </div>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-header">📋 Hoạt động gần đây</div>
                        <div class="card-body" id="recentActivities" style="max-height: 300px; overflow-y: auto;">
                            <div class="text-center text-muted">Đang tải...</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    loadDashboardData();
}

// Hiển thị employees view
function showEmployees() {
    const mainContent = document.getElementById('mainContent');
    if (!mainContent) return;
    
    const canAdd = hasPermission(currentUser?.role, 'department_head');
    
    mainContent.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
            <h3>👥 Danh sách nhân viên</h3>
            <div class="d-flex gap-2">
                <div class="search-box">
                    <input type="text" id="searchInput" class="form-control" placeholder="🔍 Tìm kiếm nhân viên...">
                </div>
                ${canAdd ? '<button class="btn btn-primary" onclick="openUserModal()">➕ Thêm nhân viên</button>' : ''}
                <button class="btn btn-outline-secondary" onclick="fetchUsers(); renderUserTable();">🔄 Làm mới</button>
            </div>
        </div>
        <div class="table-responsive">
            <table class="table table-dark table-hover">
                <thead>
                    <tr>
                        <th>#</th>
                        <th></th>
                        <th>Họ tên</th>
                        <th>Email</th>
                        <th>Vai trò</th>
                        <th>Loại</th>
                        <th>Hệ số</th>
                        <th>Thâm niên</th>
                        <th>Thao tác</th>
                    </tr>
                </thead>
                <tbody id="usersTableBody">
                    <tr><td colspan="9" class="text-center"><div class="spinner"></div> Đang tải...</td></tr>
                </tbody>
            </table>
        </div>
        <div id="pagination" class="pagination"></div>
    `;
    
    renderUserTable();
    
    // Gắn search event
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(handleSearch, 300));
    }
}

// Hiển thị attendance view
function showAttendance() {
    const mainContent = document.getElementById('mainContent');
    if (!mainContent) return;
    
    const todayStatus = getTodayAttendanceStatus();
    
    mainContent.innerHTML = `
        <h3>⏱️ Chấm công</h3>
        <div class="row">
            <div class="col-md-5 mb-3">
                <div class="card">
                    <div class="card-body text-center">
                        <div class="attendance-status">
                            <div class="status-icon">${todayStatus.checkedIn ? '✅' : '⏰'}</div>
                            <div class="status-text ${todayStatus.checkedIn ? 'status-checked-in' : ''}">
                                ${todayStatus.checkedIn ? 'Đã chấm công hôm nay' : 'Chưa chấm công hôm nay'}
                            </div>
                            ${todayStatus.checkedIn ? `<div class="mt-2">Vào lúc: ${todayStatus.checkInTime}</div>` : ''}
                            ${todayStatus.checkedOut ? `<div>Ra lúc: ${todayStatus.checkOutTime}</div>` : ''}
                            <div class="mt-3">
                                <button class="btn btn-success me-2" onclick="openAttendanceModal()" ${todayStatus.checkedIn ? 'disabled' : ''}>✅ Chấm công vào</button>
                                <button class="btn btn-danger" onclick="checkOut()" ${!todayStatus.checkedIn || todayStatus.checkedOut ? 'disabled' : ''}>❌ Chấm công ra</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-md-7">
                <div class="card">
                    <div class="card-header">📅 Lịch sử chấm công (30 ngày gần nhất)</div>
                    <div class="card-body" id="attendanceHistoryList" style="max-height: 400px; overflow-y: auto;">
                        <div class="text-center text-muted">Đang tải...</div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    loadAttendanceHistory();
}

// Hiển thị salary view
function showSalary() {
    const mainContent = document.getElementById('mainContent');
    if (!mainContent) return;
    
    mainContent.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-3">
            <h3>💰 Bảng lương</h3>
            <button class="btn btn-outline-secondary" onclick="exportSalaryToCSV()">📎 Xuất Excel</button>
        </div>
        <div class="table-responsive">
            <table class="table table-dark table-hover">
                <thead>
                    <tr>
                        <th>Nhân viên</th>
                        <th>Vai trò</th>
                        <th>Hệ số</th>
                        <th>Thâm niên</th>
                        <th>Lương cơ bản</th>
                        <th>Lương thực nhận</th>
                        <th>Thao tác</th>
                    </tr>
                </thead>
                <tbody id="salaryTableBody">
                    <tr><td colspan="7" class="text-center"><div class="spinner"></div> Đang tính toán...</td></tr>
                </tbody>
            </table>
        </div>
    `;
    
    renderSalaryTable();
}

// Hiển thị history view
function showHistory() {
    const mainContent = document.getElementById('mainContent');
    if (!mainContent) return;
    
    const allHistory = getFullHistory();
    
    mainContent.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-3">
            <h3>📜 Lịch sử thay đổi hệ thống</h3>
            <button class="btn btn-outline-secondary" onclick="exportHistoryToJSON()">📎 Xuất JSON</button>
        </div>
        <div class="table-responsive">
            <table class="table table-dark table-hover">
                <thead>
                    <tr>
                        <th>Thời gian</th>
                        <th>Người dùng</th>
                        <th>Hành động</th>
                        <th>Đối tượng</th>
                        <th>Chi tiết</th>
                    </tr>
                </thead>
                <tbody id="historyTableBody">
                    ${allHistory.length === 0 ? 
                        '<tr><td colspan="5" class="text-center text-muted">Chưa có lịch sử thay đổi</td></tr>' :
                        allHistory.map(h => `
                            <tr>
                                <td>${formatDate(h.timestamp)}</td>
                                <td>${escapeHtml(h.userName || 'Hệ thống')}</td>
                                <td>${h.action}</td>
                                <td>${h.targetType}</td>
                                <td><pre class="small mb-0" style="max-width: 300px; overflow-x: auto;">${JSON.stringify(h.details, null, 2)}</pre></td>
                            </tr>
                        `).join('')
                    }
                </tbody>
            </table>
        </div>
    `;
}

// Hiển thị admin panel
function showAdminPanel() {
    const mainContent = document.getElementById('mainContent');
    if (!mainContent) return;
    
    const canAccess = hasPermission(currentUser?.role, 'department_head');
    if (!canAccess) {
        showToast('Bạn không có quyền truy cập', 'error');
        showDashboard();
        return;
    }
    
    mainContent.innerHTML = `
        <h3>⚙️ Quản trị hệ thống</h3>
        <div class="row">
            <div class="col-md-6 mb-3">
                <div class="card">
                    <div class="card-header">📊 Thống kê hệ thống</div>
                    <div class="card-body">
                        <div class="info-row"><span class="info-label">Tổng số nhân viên:</span><span class="info-value" id="statTotalUsers">-</span></div>
                        <div class="info-row"><span class="info-label">Tổng số lịch sử thay đổi:</span><span class="info-value" id="statTotalHistory">-</span></div>
                        <div class="info-row"><span class="info-label">Phiên đăng nhập:</span><span class="info-value">24 giờ</span></div>
                        <div class="info-row"><span class="info-label">Database:</span><span class="info-value">MongoDB Atlas</span></div>
                    </div>
                </div>
            </div>
            <div class="col-md-6 mb-3">
                <div class="card">
                    <div class="card-header">🛡️ Bảo mật</div>
                    <div class="card-body">
                        <div class="info-row"><span class="info-label">✅ Chống NoSQL Injection</span><span class="info-value">Active</span></div>
                        <div class="info-row"><span class="info-label">✅ Chống XSS</span><span class="info-value">Active</span></div>
                        <div class="info-row"><span class="info-label">✅ Phân quyền RBAC</span><span class="info-value">Active</span></div>
                        <div class="info-row"><span class="info-label">✅ Rate Limiting</span><span class="info-value">Active</span></div>
                        <div class="info-row"><span class="info-label">✅ HTTPOnly Session</span><span class="info-value">Active</span></div>
                    </div>
                </div>
            </div>
        </div>
        <div class="row">
            <div class="col-12">
                <div class="card">
                    <div class="card-header">🔄 Hành động hệ thống</div>
                    <div class="card-body">
                        <button class="btn btn-warning me-2" onclick="clearAllHistory()">🗑️ Xóa toàn bộ lịch sử</button>
                        <button class="btn btn-info" onclick="exportSystemData()">📦 Xuất toàn bộ dữ liệu</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('statTotalUsers').innerText = usersList?.length || 0;
    const allHistory = getFullHistory();
    document.getElementById('statTotalHistory').innerText = allHistory?.length || 0;
}

// Các hàm helper cho dashboard
function getTodayAttendanceStatus() {
    const today = new Date().toISOString().split('T')[0];
    const record = attendanceRecords?.find(r => r.date === today);
    return {
        checkedIn: !!record?.checkIn,
        checkedOut: !!record?.checkOut,
        checkInTime: record?.checkIn || null,
        checkOutTime: record?.checkOut || null
    };
}

function openAttendanceModal() {
    const modal = document.getElementById('attendanceModal');
    if (modal) {
        new bootstrap.Modal(modal).show();
    }
}

// Export functions to global scope
window.showDashboard = showDashboard;
window.showEmployees = showEmployees;
window.showAttendance = showAttendance;
window.showSalary = showSalary;
window.showHistory = showHistory;
window.showAdminPanel = showAdminPanel;
window.toggleTheme = toggleTheme;
window.openAttendanceModal = openAttendanceModal;