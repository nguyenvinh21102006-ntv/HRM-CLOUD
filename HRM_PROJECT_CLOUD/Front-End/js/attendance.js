// attendance.js - Xử lý chấm công (hoàn chỉnh)

let attendanceRecords = [];

// Khởi tạo dữ liệu chấm công từ localStorage
function initAttendance() {
    const storageKey = `attendance_${currentUser?.id || 'anonymous'}`;
    const stored = localStorage.getItem(storageKey);
    if (stored) {
        attendanceRecords = JSON.parse(stored);
    } else {
        attendanceRecords = [];
    }
}

// Lưu dữ liệu chấm công
function saveAttendance() {
    const storageKey = `attendance_${currentUser?.id || 'anonymous'}`;
    localStorage.setItem(storageKey, JSON.stringify(attendanceRecords));
}

// Chấm công vào
async function checkIn() {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    
    // Kiểm tra đã chấm công chưa
    const existingRecord = attendanceRecords.find(r => r.date === today);
    if (existingRecord && existingRecord.checkIn) {
        showToast('Bạn đã chấm công vào hôm nay rồi!', 'warning');
        bootstrap.Modal.getInstance(document.getElementById('attendanceModal'))?.hide();
        return;
    }
    
    const record = {
        date: today,
        checkIn: now.toLocaleTimeString('vi-VN'),
        checkOut: null,
        userId: currentUser?.id,
        userName: currentUser?.fullName,
        timestamp: now.toISOString()
    };
    
    if (existingRecord) {
        existingRecord.checkIn = record.checkIn;
        existingRecord.timestamp = record.timestamp;
    } else {
        attendanceRecords.unshift(record);
    }
    
    saveAttendance();
    addToHistory('chấm công vào', 'chấm công', currentUser?.id, { date: today, time: record.checkIn });
    showToast(`Chấm công vào lúc ${record.checkIn} thành công`, 'success');
    
    bootstrap.Modal.getInstance(document.getElementById('attendanceModal'))?.hide();
    
    // Refresh attendance view nếu đang hiển thị
    if (document.querySelector('.attendance-status')) {
        showAttendance();
    }
}

// Chấm công ra
async function checkOut() {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    
    const record = attendanceRecords.find(r => r.date === today);
    if (!record || !record.checkIn) {
        showToast('Bạn chưa chấm công vào hôm nay!', 'warning');
        bootstrap.Modal.getInstance(document.getElementById('attendanceModal'))?.hide();
        return;
    }
    
    if (record.checkOut) {
        showToast('Bạn đã chấm công ra hôm nay rồi!', 'warning');
        bootstrap.Modal.getInstance(document.getElementById('attendanceModal'))?.hide();
        return;
    }
    
    record.checkOut = now.toLocaleTimeString('vi-VN');
    saveAttendance();
    addToHistory('chấm công ra', 'chấm công', currentUser?.id, { date: today, time: record.checkOut });
    showToast(`Chấm công ra lúc ${record.checkOut} thành công`, 'success');
    
    bootstrap.Modal.getInstance(document.getElementById('attendanceModal'))?.hide();
    
    if (document.querySelector('.attendance-status')) {
        showAttendance();
    }
}

// Load lịch sử chấm công
function loadAttendanceHistory() {
    const historyDiv = document.getElementById('attendanceHistoryList');
    if (!historyDiv) return;
    
    // Lấy 30 ngày gần nhất
    const last30Days = attendanceRecords
        .filter(r => r.userId === currentUser?.id)
        .slice(0, 30);
    
    if (last30Days.length === 0) {
        historyDiv.innerHTML = '<div class="text-center text-muted">Chưa có dữ liệu chấm công</div>';
        return;
    }
    
    historyDiv.innerHTML = last30Days.map(r => `
        <div class="border-bottom border-secondary pb-2 mb-2">
            <div class="d-flex justify-content-between align-items-center">
                <strong>📅 ${formatDate(r.date, 'date')}</strong>
                <span class="badge ${r.checkOut ? 'bg-success' : 'bg-warning'}">${r.checkOut ? 'Đã đủ' : 'Chưa ra'}</span>
            </div>
            <div class="mt-1">
                <span>🕐 Vào: ${r.checkIn || '--'}</span>
                <span class="ms-3">🚪 Ra: ${r.checkOut || '--'}</span>
            </div>
        </div>
    `).join('');
}

// Lấy trạng thái chấm công hôm nay (cho dashboard)
function getTodayAttendanceStatusForDashboard() {
    const today = new Date().toISOString().split('T')[0];
    const record = attendanceRecords.find(r => r.date === today && r.userId === currentUser?.id);
    return {
        hasCheckedIn: !!record?.checkIn,
        hasCheckedOut: !!record?.checkOut
    };
}

// Export to global
window.checkIn = checkIn;
window.checkOut = checkOut;
window.loadAttendanceHistory = loadAttendanceHistory;
window.getTodayAttendanceStatusForDashboard = getTodayAttendanceStatusForDashboard;