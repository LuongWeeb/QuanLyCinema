// Các hàm tiện ích chung cho tất cả các trang

// Khởi tạo menu người dùng với kiểm tra liên kết admin
async function initUserMenu() {
    const user = getCurrentUser();
    if (!user) {
        return;
    }

    // Cập nhật tên người dùng nếu phần tử tồn tại
    const userNameEl = document.getElementById('user-name');
    if (userNameEl) {
        userNameEl.textContent = user.fullName || user.username;
    }

    // Kiểm tra vai trò admin và hiển thị liên kết admin
    const adminLinkEl = document.getElementById('admin-link');
    if (adminLinkEl) {
        try {
            // Refresh user info from API to get latest roles
            const currentUser = await getCurrentUserFromApi();
            if (currentUser && currentUser.roles && currentUser.roles.includes('Admin')) {
                adminLinkEl.classList.remove('hidden');
            } else if (user.roles && user.roles.includes('Admin')) {
                // Dự phòng: kiểm tra vai trò từ localStorage
                adminLinkEl.classList.remove('hidden');
            }
        } catch (error) {
            console.error('Lỗi khi tải thông tin người dùng:', error);
            // Fallback: check roles from localStorage
            if (user.roles && user.roles.includes('Admin')) {
                adminLinkEl.classList.remove('hidden');
            }
        }
    }

    // Kiểm tra vai trò nhân viên và hiển thị liên kết nhân viên
    const staffLinkEl = document.getElementById('staff-link');
    if (staffLinkEl) {
        try {
            // Refresh user info from API to get latest roles
            const currentUser = await getCurrentUserFromApi();
            if (currentUser && currentUser.roles && (currentUser.roles.includes('Staff') || currentUser.roles.includes('Admin'))) {
                staffLinkEl.classList.remove('hidden');
            } else if (user.roles && (user.roles.includes('Staff') || user.roles.includes('Admin'))) {
                // Dự phòng: kiểm tra vai trò từ localStorage
                staffLinkEl.classList.remove('hidden');
            }
        } catch (error) {
            console.error('Lỗi khi tải thông tin người dùng:', error);
            // Fallback: check roles from localStorage
            if (user.roles && (user.roles.includes('Staff') || user.roles.includes('Admin'))) {
                staffLinkEl.classList.remove('hidden');
            }
        }
    }
}

