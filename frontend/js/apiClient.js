// URL của API Gateway - Frontend chỉ gọi qua gateway
const API_BASE_URL = "https://localhost:5001/api";

// Lấy token từ localStorage
function getToken() {
    return localStorage.getItem('token');
}

// Lấy refresh token từ localStorage
function getRefreshToken() {
    return localStorage.getItem('refreshToken');
}

// Lưu token vào localStorage
function saveTokens(token, refreshToken) {
    localStorage.setItem('token', token);
    localStorage.setItem('refreshToken', refreshToken);
}

// Xóa token
function clearTokens() {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
}

// Xử lý lỗi 401 - thử làm mới token
async function handleUnauthorized() {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
        clearTokens();
        window.location.href = '/frontend/pages/login.html';
        return null;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/auth/refresh-token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ refreshToken })
        });

        if (response.ok) {
            const data = await response.json();
            if (data.success && data.data) {
                saveTokens(data.data.token, data.data.refreshToken);
                return data.data.token;
            }
        }
    } catch (error) {
        console.error('Làm mới token thất bại:', error);
    }

    clearTokens();
    window.location.href = '/frontend/pages/login.html';
    return null;
}

// Yêu cầu GET chung
async function get(url, authRequired = false) {
    const headers = {
        'Content-Type': 'application/json'
    };

    if (authRequired) {
        const token = getToken();
        if (!token) {
            await handleUnauthorized();
            throw new Error('Unauthorized');
        }
        headers['Authorization'] = `Bearer ${token}`;
    }

    try {
        const response = await fetch(`${API_BASE_URL}${url}`, {
            method: 'GET',
            headers: headers
        });

        if (response.status === 401 && authRequired) {
            const newToken = await handleUnauthorized();
            if (newToken) {
                headers['Authorization'] = `Bearer ${newToken}`;
                const retryResponse = await fetch(`${API_BASE_URL}${url}`, {
                    method: 'GET',
                    headers: headers
                });
                if (!retryResponse.ok) {
                    if (retryResponse.status === 403) {
                        throw new Error('Bạn không có quyền thực hiện thao tác này. Vui lòng đăng nhập với tài khoản Admin.');
                    }
                    throw new Error(`HTTP error! status: ${retryResponse.status}`);
                }
                return await retryResponse.json();
            }
        }

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Yêu cầu GET thất bại:', error);
        throw error;
    }
}

// Yêu cầu POST chung
async function post(url, body, authRequired = false) {
    const headers = {
        'Content-Type': 'application/json'
    };

    if (authRequired) {
        const token = getToken();
        if (!token) {
            await handleUnauthorized();
            throw new Error('Unauthorized');
        }
        headers['Authorization'] = `Bearer ${token}`;
    }

    try {
        const response = await fetch(`${API_BASE_URL}${url}`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(body)
        });

        if (response.status === 401 && authRequired) {
            const newToken = await handleUnauthorized();
            if (newToken) {
                headers['Authorization'] = `Bearer ${newToken}`;
                const retryResponse = await fetch(`${API_BASE_URL}${url}`, {
                    method: 'POST',
                    headers: headers,
                    body: JSON.stringify(body)
                });
                if (!retryResponse.ok) {
                    if (retryResponse.status === 403) {
                        throw new Error('Bạn không có quyền thực hiện thao tác này. Vui lòng đăng nhập với tài khoản Admin.');
                    }
                    throw new Error(`HTTP error! status: ${retryResponse.status}`);
                }
                return await retryResponse.json();
            }
        }

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            if (response.status === 403) {
                throw new Error('Bạn không có quyền thực hiện thao tác này. Vui lòng đăng nhập với tài khoản Admin.');
            }
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Yêu cầu POST thất bại:', error);
        throw error;
    }
}

// Yêu cầu PUT chung
async function put(url, body, authRequired = false) {
    const headers = {
        'Content-Type': 'application/json'
    };

    if (authRequired) {
        const token = getToken();
        if (!token) {
            await handleUnauthorized();
            throw new Error('Unauthorized');
        }
        headers['Authorization'] = `Bearer ${token}`;
    }

    try {
        const response = await fetch(`${API_BASE_URL}${url}`, {
            method: 'PUT',
            headers: headers,
            body: JSON.stringify(body)
        });

        if (response.status === 401 && authRequired) {
            const newToken = await handleUnauthorized();
            if (newToken) {
                headers['Authorization'] = `Bearer ${newToken}`;
                const retryResponse = await fetch(`${API_BASE_URL}${url}`, {
                    method: 'PUT',
                    headers: headers,
                    body: JSON.stringify(body)
                });
                if (!retryResponse.ok) {
                    if (retryResponse.status === 403) {
                        throw new Error('Bạn không có quyền thực hiện thao tác này. Vui lòng đăng nhập với tài khoản Admin.');
                    }
                    throw new Error(`HTTP error! status: ${retryResponse.status}`);
                }
                return await retryResponse.json();
            }
        }

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            if (response.status === 403) {
                throw new Error('Bạn không có quyền thực hiện thao tác này. Vui lòng đăng nhập với tài khoản Admin.');
            }
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Yêu cầu PUT thất bại:', error);
        throw error;
    }
}

// Tải lên tệp
async function uploadFile(file, url, authRequired = false) {
    const formData = new FormData();
    formData.append('file', file);

    const headers = {};

    if (authRequired) {
        const token = getToken();
        if (!token) {
            await handleUnauthorized();
            throw new Error('Unauthorized');
        }
        headers['Authorization'] = `Bearer ${token}`;
    }

    try {
        const response = await fetch(`${API_BASE_URL}${url}`, {
            method: 'POST',
            headers: headers,
            body: formData
        });

        if (response.status === 401 && authRequired) {
            const newToken = await handleUnauthorized();
            if (newToken) {
                headers['Authorization'] = `Bearer ${newToken}`;
                const retryResponse = await fetch(`${API_BASE_URL}${url}`, {
                    method: 'POST',
                    headers: headers,
                    body: formData
                });
                if (!retryResponse.ok) {
                    if (retryResponse.status === 403) {
                        throw new Error('Bạn không có quyền thực hiện thao tác này. Vui lòng đăng nhập với tài khoản Admin.');
                    }
                    throw new Error(`HTTP error! status: ${retryResponse.status}`);
                }
                return await retryResponse.json();
            }
        }

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            if (response.status === 403) {
                throw new Error('Bạn không có quyền thực hiện thao tác này. Vui lòng đăng nhập với tài khoản Admin.');
            }
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Tải lên tệp thất bại:', error);
        throw error;
    }
}

// Yêu cầu DELETE chung
async function del(url, authRequired = false) {
    const headers = {
        'Content-Type': 'application/json'
    };

    if (authRequired) {
        const token = getToken();
        if (!token) {
            await handleUnauthorized();
            throw new Error('Unauthorized');
        }
        headers['Authorization'] = `Bearer ${token}`;
    }

    try {
        const response = await fetch(`${API_BASE_URL}${url}`, {
            method: 'DELETE',
            headers: headers
        });

        if (response.status === 401 && authRequired) {
            const newToken = await handleUnauthorized();
            if (newToken) {
                headers['Authorization'] = `Bearer ${newToken}`;
                const retryResponse = await fetch(`${API_BASE_URL}${url}`, {
                    method: 'DELETE',
                    headers: headers
                });
                if (!retryResponse.ok) {
                    if (retryResponse.status === 403) {
                        throw new Error('Bạn không có quyền thực hiện thao tác này. Vui lòng đăng nhập với tài khoản Admin.');
                    }
                    throw new Error(`HTTP error! status: ${retryResponse.status}`);
                }
                return await retryResponse.json();
            }
        }

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Yêu cầu DELETE thất bại:', error);
        throw error;
    }
}

