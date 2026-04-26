// history.js - Quản lý lịch sử thay đổi của hệ thống

let changeHistory = [];

// Khởi tạo history từ localStorage
function initHistory() {
    const stored = localStorage.getItem('changeHistory');
    if (stored) {
        changeHistory = JSON.parse(stored);
    } else {
        changeHistory = [];
    }
}

// Lưu history vào localStorage
function saveHistory() {
    localStorage.setItem('changeHistory', JSON.stringify(changeHistory));
}

// Thêm một sự kiện vào lịch sử
function addToHistory(action, targetType, targetId, details) {
    const historyEntry = {
        id: Date.now() + '_' + Math.random().toString(36).substr(2, 6),
        timestamp: new Date().toISOString(),
        userId: currentUser?.id || 'system',
        userName: currentUser?.fullName || 'Hệ thống',
        userRole: currentUser?.role || 'system',
        action: action,
        targetType: targetType,
        targetId: targetId,
        details: details || {}
    };
    
    changeHistory.unshift(historyEntry);
    
    // Giữ lại tối đa 200 bản ghi
    if (changeHistory.length > 200) {
        changeHistory = changeHistory.slice(0, 200);
    }
    
    saveHistory();
}

// Lấy toàn bộ lịch sử
function getFullHistory() {
    return changeHistory;
}

// Lấy lịch sử theo người dùng
function getHistoryByUser(userId) {
    return changeHistory.filter(h => h.userId === userId);
}

// Lấy lịch sử theo hành động
function getHistoryByAction(action) {
    return changeHistory.filter(h => h.action === action);
}

// Lấy lịch sử theo đối tượng
function getHistoryByTargetType(targetType) {
    return changeHistory.filter(h => h.targetType === targetType);
}

// Lấy lịch sử trong khoảng thời gian
function getHistoryByDateRange(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return changeHistory.filter(h => {
        const date = new Date(h.timestamp);
        return date >= start && date <= end;
    });
}

// Lấy các hoạt động gần đây (cho dashboard)
function getRecentActivities(limit = 10) {
    return changeHistory.slice(0, limit);
}

// Xóa toàn bộ lịch sử (chỉ admin)
function clearAllHistory() {
    if (!hasPermission(currentUser?.role, 'admin')) {
        showToast('Bạn không có quyền xóa lịch sử', 'error');
        return;
    }
    
    if (confirm('Bạn có chắc chắn muốn xóa toàn bộ lịch sử thay đổi?')) {
        changeHistory = [];
        saveHistory();
        addToHistory('xóa lịch sử', 'system', 'all', { clearedBy: currentUser?.fullName });
        showToast('Đã xóa toàn bộ lịch sử', 'success');
        
        // Refresh nếu đang ở trang history
        if (document.querySelector('#historyTableBody')) {
            showHistory();
        }
    }
}

// Xuất lịch sử ra file JSON
function exportHistoryToJSON() {
    const data = {
        exportDate: new Date().toISOString(),
        exportedBy: currentUser?.fullName,
        totalRecords: changeHistory.length,
        history: changeHistory
    };
    
    downloadJSON(data, `history_export_${new Date().toISOString().split('T')[0]}.json`);
    showToast('Xuất lịch sử thành công', 'success');
}

// Xuất toàn bộ dữ liệu hệ thống
function exportSystemData() {
    const systemData = {
        exportDate: new Date().toISOString(),
        exportedBy: currentUser?.fullName,
        users: usersList,
        history: changeHistory,
        attendance: attendanceRecords
    };
    
    downloadJSON(systemData, `system_export_${new Date().toISOString().split('T')[0]}.json`);
    addToHistory('xuất dữ liệu', 'system', 'all', { recordCount: changeHistory.length });
    showToast('Xuất dữ liệu hệ thống thành công', 'success');
}

// Export to global
window.addToHistory = addToHistory;
window.getFullHistory = getFullHistory;
window.getHistoryByUser = getHistoryByUser;
window.getHistoryByAction = getHistoryByAction;
window.getHistoryByTargetType = getHistoryByTargetType;
window.getRecentActivities = getRecentActivities;
window.clearAllHistory = clearAllHistory;
window.exportHistoryToJSON = exportHistoryToJSON;
window.exportSystemData = exportSystemData;