// salary.js - Xử lý tính lương và bảng lương

// Mở modal tính lương
function openSalaryModal(userId, userName) {
    const modal = document.getElementById('salaryModal');
    if (!modal) return;
    
    document.getElementById('salaryUserId').value = userId;
    document.getElementById('salaryModalTitle').textContent = `Tính lương cho ${userName}`;
    
    // Reset form
    const now = new Date();
    document.getElementById('month').value = now.getMonth() + 1;
    document.getElementById('year').value = now.getFullYear();
    document.getElementById('bonus').value = 0;
    document.getElementById('revenue').value = 0;
    
    const bsModal = new bootstrap.Modal(modal);
    bsModal.show();
}

// Tính lương cho một người dùng
async function calculateUserSalary(userId, bonus = 0, revenue = 0) {
    try {
        const url = `${APP_CONFIG.ENDPOINTS.SALARY}/${userId}?bonus=${bonus}&revenue=${revenue}`;
        const response = await fetch(url, {
            method: 'GET',
            credentials: 'include'
        });
        
        if (response.ok) {
            const data = await response.json();
            return data;
        } else {
            throw new Error('Failed to calculate salary');
        }
    } catch (error) {
        console.error('Calculate salary error:', error);
        showToast('Lỗi khi tính lương', 'error');
        return null;
    }
}

// Tính và hiển thị lương
async function calculateAndShowSalary() {
    const userId = document.getElementById('salaryUserId')?.value;
    const month = parseInt(document.getElementById('month')?.value) || 1;
    const year = parseInt(document.getElementById('year')?.value) || 2026;
    const bonus = parseFloat(document.getElementById('bonus')?.value) || 0;
    const revenue = parseFloat(document.getElementById('revenue')?.value) || 0;
    
    if (!userId) return;
    
    const user = usersList?.find(u => u._id === userId);
    if (!user) return;
    
    // Tính lương theo công thức
    const salary = calculateSalary(user, bonus, revenue);
    
    // Hiển thị kết quả
    const resultHtml = `
        <div class="salary-result mt-3 p-3 bg-success bg-opacity-25 rounded">
            <div class="text-center">
                <h5>Kết quả tính lương</h5>
                <p><strong>Nhân viên:</strong> ${escapeHtml(user.fullName)}</p>
                <p><strong>Tháng ${month}/${year}</strong></p>
                <p><strong>Lương cơ bản:</strong> ${formatCurrency(APP_CONFIG.BASE_SALARY)}</p>
                ${bonus > 0 ? `<p><strong>Thưởng:</strong> ${formatCurrency(bonus)}</p>` : ''}
                ${revenue > 0 ? `<p><strong>Hoa hồng (5%):</strong> ${formatCurrency(revenue * 0.05)}</p>` : ''}
                <p><strong>Thâm niên:</strong> ${user.seniorityYears} năm (+${formatCurrency(APP_CONFIG.BASE_SALARY * user.seniorityYears * 0.03)})</p>
                <hr>
                <h4 class="text-success">Tổng lương: ${formatCurrency(salary)}</h4>
            </div>
        </div>
    `;
    
    // Hiển thị trong modal hoặc toast
    const existingResult = document.querySelector('.salary-result');
    if (existingResult) existingResult.remove();
    
    const modalBody = document.querySelector('#salaryModal .modal-body');
    if (modalBody) {
        modalBody.insertAdjacentHTML('beforeend', resultHtml);
    }
    
    showToast(`Lương của ${user.fullName}: ${formatCurrency(salary)}`, 'success');
    
    // Thêm vào lịch sử
    if (typeof addToHistory === 'function') {
        addToHistory('tính lương', 'salary', userId, { month, year, bonus, revenue, salary });
    }
}

// Hiển thị bảng lương tổng hợp
async function renderSalaryTable(containerId = 'salaryTableBody') {
    const tbody = document.getElementById(containerId);
    if (!tbody) return;
    
    if (!usersList || usersList.length === 0) {
        await fetchUsers();
    }
    
    if (!usersList || usersList.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">Không có dữ liệu nhân viên</td></tr>';
        return;
    }
    
    tbody.innerHTML = '<tr><td colspan="7" class="text-center"><div class="spinner"></div> Đang tính toán...</td></tr>';
    
    for (const user of usersList) {
        const salaryData = await calculateUserSalary(user._id);
        const salary = salaryData?.salary || 0;
        
        tbody.innerHTML += `
            <tr>
                <td><strong>${escapeHtml(user.fullName)}</strong></td>
                <td><span class="role-badge ${getRoleBadgeClass(user.role)}">${getRoleDisplayName(user.role)}</span></td>
                <td>${user.coefficient}</td>
                <td>${user.seniorityYears} năm</td>
                <td>${formatCurrency(APP_CONFIG.BASE_SALARY)}</td>
                <td class="text-success fw-bold">${formatCurrency(salary)}</td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="openSalaryModal('${user._id}', '${escapeHtml(user.fullName)}')">💰 Tính chi tiết</button>
                </td>
            </tr>
        `;
    }
}

// Xuất bảng lương ra file Excel (CSV)
function exportSalaryToCSV() {
    if (!usersList || usersList.length === 0) {
        showToast('Không có dữ liệu để xuất', 'warning');
        return;
    }
    
    const headers = ['STT', 'Họ tên', 'Email', 'Vai trò', 'Loại nhân viên', 'Hệ số', 'Thâm niên', 'Lương cơ bản', 'Lương thực nhận'];
    const rows = [headers];
    
    Promise.all(usersList.map(async (user, index) => {
        const salaryData = await calculateUserSalary(user._id);
        const salary = salaryData?.salary || 0;
        return [
            index + 1,
            user.fullName,
            user.email,
            getRoleDisplayName(user.role),
            user.jobType === APP_CONFIG.JOB_TYPES.KINH_DOANH ? 'Kinh doanh' : 'Văn phòng',
            user.coefficient,
            user.seniorityYears,
            APP_CONFIG.BASE_SALARY,
            salary
        ];
    })).then(results => {
        results.forEach(row => rows.push(row));
        
        const csvContent = rows.map(row => row.join(',')).join('\n');
        const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `bang_luong_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showToast('Xuất file thành công', 'success');
    });
}