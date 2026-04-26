// user.js - Quản lý người dùng (CRUD)

let usersList = [];
let currentEditUserId = null;

// Lấy danh sách người dùng
async function fetchUsers() {
    try {
        const response = await fetch(APP_CONFIG.ENDPOINTS.USERS, {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            usersList = await response.json();
            return usersList;
        } else {
            showToast('Không thể tải danh sách người dùng', 'error');
            return [];
        }
    } catch (error) {
        console.error('Fetch users error:', error);
        showToast('Lỗi kết nối server', 'error');
        return [];
    }
}

// Hiển thị danh sách người dùng trong bảng
async function renderUserTable(containerId = 'usersTableBody', users = null) {
    const usersToRender = users || usersList;
    const tbody = document.getElementById(containerId);
    if (!tbody) return;
    
    if (!usersToRender || usersToRender.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" class="text-center text-muted">Không có dữ liệu nhân viên</td></tr>';
        return;
    }
    
    tbody.innerHTML = usersToRender.map((user, index) => {
        const roleName = getRoleDisplayName(user.role);
        const jobTypeName = user.jobType === APP_CONFIG.JOB_TYPES.KINH_DOANH ? '📈 Kinh doanh' : '📄 Văn phòng';
        const canEdit = hasPermission(currentUser?.role, 'department_head') || currentUser?.id === user._id;
        const canDelete = hasPermission(currentUser?.role, 'director');
        
        return `
            <tr data-user-id="${user._id}">
                <td>${index + 1}</td>
                <td class="text-center">${getRoleSymbol(user.role)}</td>
                <td><strong>${escapeHtml(user.fullName)}</strong></td>
                <td>${escapeHtml(user.email)}</td>
                <td><span class="role-badge ${getRoleBadgeClass(user.role)}">${roleName}</span></td>
                <td>${jobTypeName}</td>
                <td>${user.coefficient}</td>
                <td>${user.seniorityYears} năm</td>
                <td class="action-buttons">
                    <button class="btn btn-sm btn-info" onclick="viewUserSalary('${user._id}', '${escapeHtml(user.fullName)}')" title="Tính lương">💰</button>
                    ${canEdit ? `<button class="btn btn-sm btn-warning" onclick="openUserModal('${user._id}')" title="Sửa">✏️</button>` : ''}
                    ${canDelete ? `<button class="btn btn-sm btn-danger" onclick="deleteUser('${user._id}')" title="Xóa">🗑️</button>` : ''}
                </td>
            </tr>
        `;
    }).join('');
}

// Mở modal thêm/sửa người dùng
function openUserModal(userId = null) {
    currentEditUserId = userId;
    const modal = document.getElementById('userModal');
    const modalTitle = document.getElementById('modalTitle');
    const form = document.getElementById('userForm');
    
    if (!modal || !form) return;
    
    // Reset form
    form.reset();
    document.getElementById('userId').value = '';
    document.getElementById('password').required = !userId;
    
    if (userId) {
        const user = usersList.find(u => u._id === userId);
        if (user) {
            modalTitle.textContent = 'Sửa nhân viên';
            document.getElementById('userId').value = user._id;
            document.getElementById('fullName').value = user.fullName;
            document.getElementById('email').value = user.email;
            document.getElementById('role').value = user.role;
            document.getElementById('jobType').value = user.jobType;
            document.getElementById('coefficient').value = user.coefficient;
            document.getElementById('seniorityYears').value = user.seniorityYears;
            document.getElementById('password').placeholder = 'Để trống nếu không đổi mật khẩu';
        }
    } else {
        modalTitle.textContent = 'Thêm nhân viên mới';
        document.getElementById('password').placeholder = 'Nhập mật khẩu';
        document.getElementById('password').required = true;
    }
    
    const bsModal = new bootstrap.Modal(modal);
    bsModal.show();
}

// Lưu người dùng (thêm hoặc sửa)
async function saveUser() {
    const userId = document.getElementById('userId').value;
    const userData = {
        fullName: document.getElementById('fullName').value.trim(),
        email: document.getElementById('email').value.trim(),
        role: document.getElementById('role').value,
        jobType: document.getElementById('jobType').value,
        coefficient: parseFloat(document.getElementById('coefficient').value) || 2.2,
        seniorityYears: parseFloat(document.getElementById('seniorityYears').value) || 0
    };
    
    // Validation
    if (!userData.fullName) {
        showToast('Vui lòng nhập họ tên', 'warning');
        return;
    }
    if (!isValidEmail(userData.email)) {
        showToast('Email không hợp lệ', 'warning');
        return;
    }
    
    const password = document.getElementById('password').value;
    if (password) {
        userData.password = password;
    }
    
    try {
        let response;
        let action;
        
        if (userId) {
            response = await fetch(`${APP_CONFIG.ENDPOINTS.USERS}/${userId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData),
                credentials: 'include'
            });
            action = 'cập nhật';
        } else {
            if (!password) {
                showToast('Vui lòng nhập mật khẩu cho nhân viên mới', 'warning');
                return;
            }
            response = await fetch(APP_CONFIG.ENDPOINTS.USERS, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData),
                credentials: 'include'
            });
            action = 'thêm mới';
        }
        
        if (response.ok) {
            showToast(`${action === 'thêm mới' ? 'Thêm' : 'Cập nhật'} nhân viên thành công`);
            
            // Đóng modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('userModal'));
            if (modal) modal.hide();
            
            // Reload danh sách
            await fetchUsers();
            await renderUserTable();
            
            // Thêm vào lịch sử
            if (typeof addToHistory === 'function') {
                addToHistory(action, 'nhân viên', userId || 'new', userData);
            }
        } else {
            const error = await response.json();
            showToast(error.message || 'Lỗi khi lưu nhân viên', 'error');
        }
    } catch (error) {
        console.error('Save user error:', error);
        showToast('Lỗi kết nối server', 'error');
    }
}

// Xóa người dùng
async function deleteUser(userId) {
    const user = usersList.find(u => u._id === userId);
    if (!user) return;
    
    const confirmed = confirm(`Bạn có chắc chắn muốn xóa nhân viên "${user.fullName}"?`);
    if (!confirmed) return;
    
    try {
        const response = await fetch(`${APP_CONFIG.ENDPOINTS.USERS}/${userId}`, {
            method: 'DELETE',
            credentials: 'include'
        });
        
        if (response.ok) {
            showToast('Xóa nhân viên thành công');
            await fetchUsers();
            await renderUserTable();
            
            if (typeof addToHistory === 'function') {
                addToHistory('xóa', 'nhân viên', userId, { deletedName: user.fullName });
            }
        } else {
            showToast('Lỗi khi xóa nhân viên', 'error');
        }
    } catch (error) {
        console.error('Delete user error:', error);
        showToast('Lỗi kết nối server', 'error');
    }
}

// Cập nhật hồ sơ cá nhân
async function updateProfile() {
    const profileData = {
        fullName: document.getElementById('profileFullName')?.value,
        jobType: document.getElementById('profileJobType')?.value,
        coefficient: parseFloat(document.getElementById('profileCoefficient')?.value)
    };
    
    if (!profileData.fullName) {
        showToast('Vui lòng nhập họ tên', 'warning');
        return;
    }
    
    try {
        const response = await fetch(`${APP_CONFIG.ENDPOINTS.PROFILE}/${currentUser.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(profileData),
            credentials: 'include'
        });
        
        if (response.ok) {
            showToast('Cập nhật hồ sơ thành công');
            currentUser = { ...currentUser, ...profileData };
            updateUserUI();
            
            const modal = bootstrap.Modal.getInstance(document.getElementById('profileModal'));
            if (modal) modal.hide();
            
            if (typeof addToHistory === 'function') {
                addToHistory('cập nhật hồ sơ', 'profile', currentUser.id, profileData);
            }
        } else {
            showToast('Lỗi khi cập nhật hồ sơ', 'error');
        }
    } catch (error) {
        console.error('Update profile error:', error);
        showToast('Lỗi kết nối server', 'error');
    }
}