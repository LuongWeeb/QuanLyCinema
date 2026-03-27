// Kiểm tra xem người dùng đã xác thực chưa
function isAuthenticated() {
    return !!getToken();
}

// Lấy người dùng hiện tại từ localStorage
function getCurrentUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
}

// Kiểm tra xem người dùng hiện tại có phải admin không
function isAdmin() {
    const user = getCurrentUser();
    return user && user.roles && user.roles.includes('Admin');
}

// Lưu người dùng vào localStorage
function saveUser(user) {
    localStorage.setItem('user', JSON.stringify(user));
}

// Đăng ký
async function register(username, email, password, fullName, phoneNumber) {
    try {
        const response = await post('/auth/register', {
            username,
            email,
            password,
            fullName,
            phoneNumber
        });

        if (response.success && response.data) {
            saveTokens(response.data.token, response.data.refreshToken);
            saveUser(response.data.user);
            return { success: true, data: response.data };
        }

        return { success: false, message: response.message || 'Registration failed' };
    } catch (error) {
        return { success: false, message: error.message || 'Registration failed' };
    }
}

// Đăng nhập
async function login(username, password) {
    try {
        const response = await post('/auth/login', {
            username,
            password
        });

        if (response.success && response.data) {
            saveTokens(response.data.token, response.data.refreshToken);
            saveUser(response.data.user);
            return { success: true, data: response.data };
        }

        return { success: false, message: response.message || 'Login failed' };
    } catch (error) {
        return { success: false, message: error.message || 'Login failed' };
    }
}

// Đăng xuất
async function logout() {
    try {
        const refreshToken = getRefreshToken();
        if (refreshToken) {
            await post('/auth/logout', { refreshToken }, true);
        }
    } catch (error) {
        console.error('Lỗi khi đăng xuất:', error);
    } finally {
        clearTokens();
        // Chuyển hướng đến trang đăng nhập - sử dụng đường dẫn tương đối
        const currentPath = window.location.pathname;
        if (currentPath.includes('/pages/')) {
            window.location.href = 'login.html';
        } else {
            window.location.href = 'pages/login.html';
        }
    }
}

// Quên mật khẩu
async function forgotPassword(email) {
    try {
        const response = await post('/auth/forgot-password', { email });
        return { success: response.success, message: response.message };
    } catch (error) {
        return { success: false, message: error.message || 'Request failed' };
    }
}

// Đặt lại mật khẩu
async function resetPassword(email, token, newPassword) {
    try {
        const response = await post('/auth/reset-password', {
            email,
            token,
            newPassword
        });
        return { success: response.success, message: response.message };
    } catch (error) {
        return { success: false, message: error.message || 'Reset failed' };
    }
}

// Lấy người dùng hiện tại từ API
async function getCurrentUserFromApi() {
    try {
        const response = await get('/auth/me', true);
        if (response.success && response.data) {
            saveUser(response.data);
            return response.data;
        }
        return null;
    } catch (error) {
        console.error('Lấy người dùng hiện tại thất bại:', error);
        return null;
    }
}

