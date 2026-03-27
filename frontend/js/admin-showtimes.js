// Load admin showtimes
async function loadAdminShowtimes() {
    try {
        const response = await get('/showtimes?pageIndex=1&pageSize=100');
        if (response.success && response.data) {
            const showtimes = response.data.items || response.data;
            renderShowtimesTable(showtimes);
        }
    } catch (error) {
        console.error('Load admin showtimes error:', error);
        showAlert('Lỗi khi tải danh sách suất chiếu', 'error');
    }
}

// Render showtimes table
function renderShowtimesTable(showtimes) {
    const tbody = document.getElementById('showtimes-table-body');
    tbody.innerHTML = '';

    showtimes.forEach(showtime => {
        const row = document.createElement('tr');
        const startTime = new Date(showtime.startTime);
        row.innerHTML = `
            <td>${showtime.showtimeId}</td>
            <td>${showtime.movieTitle || 'N/A'}</td>
            <td>${showtime.auditoriumName || 'N/A'}</td>
            <td>${startTime.toLocaleString('vi-VN')}</td>
            <td>${formatCurrency(showtime.baseTicketPrice)}</td>
            <td>
                <button class="btn btn--small btn--secondary" onclick="editShowtime(${showtime.showtimeId})">Sửa</button>
                <button class="btn btn--small btn--outline" onclick="deleteShowtime(${showtime.showtimeId})">Xóa</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Load movies for select
async function loadMoviesForSelect() {
    try {
        const response = await get('/movies?pageIndex=1&pageSize=1000');
        if (response.success && response.data) {
            const select = document.getElementById('showtime-movie');
            select.innerHTML = '<option value="">Chọn phim</option>';
            (response.data.items || []).forEach(movie => {
                const option = document.createElement('option');
                option.value = movie.movieId;
                option.textContent = movie.title;
                select.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Load movies for select error:', error);
    }
}

// Load auditoriums for select
async function loadAuditoriumsForSelect() {
    try {
        const response = await get('/auditoriums');
        if (response.success && response.data) {
            const select = document.getElementById('showtime-auditorium');
            select.innerHTML = '<option value="">Chọn phòng</option>';
            response.data.forEach(auditorium => {
                const option = document.createElement('option');
                option.value = auditorium.auditoriumId;
                option.textContent = auditorium.name;
                select.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Load auditoriums for select error:', error);
    }
}

// Open showtime modal
function openShowtimeModal(showtimeId = null) {
    const modal = document.getElementById('showtime-modal');
    const form = document.getElementById('showtime-form');
    const title = document.getElementById('modal-title');

    if (showtimeId) {
        title.textContent = 'Sửa suất chiếu';
        loadShowtimeForEdit(showtimeId);
    } else {
        title.textContent = 'Thêm suất chiếu mới';
        form.reset();
        document.getElementById('showtime-id').value = '';
    }

    modal.classList.add('modal--active');
}

// Close showtime modal
function closeShowtimeModal() {
    const modal = document.getElementById('showtime-modal');
    modal.classList.remove('modal--active');
}

// Load showtime for edit
async function loadShowtimeForEdit(showtimeId) {
    try {
        const response = await get(`/showtimes/${showtimeId}`);
        if (response.success && response.data) {
            const showtime = response.data;
            document.getElementById('showtime-id').value = showtime.showtimeId;
            document.getElementById('showtime-movie').value = showtime.movieId;
            document.getElementById('showtime-auditorium').value = showtime.auditoriumId;
            
            const startTime = new Date(showtime.startTime);
            const localDateTime = new Date(startTime.getTime() - startTime.getTimezoneOffset() * 60000)
                .toISOString()
                .slice(0, 16);
            document.getElementById('showtime-start').value = localDateTime;
            
            document.getElementById('showtime-price').value = showtime.baseTicketPrice;
            document.getElementById('showtime-format').value = showtime.format || '2D';
            document.getElementById('showtime-language').value = showtime.language || 'Lồng tiếng';
        }
    } catch (error) {
        console.error('Load showtime for edit error:', error);
        showAlert('Lỗi khi tải thông tin suất chiếu', 'error');
    }
}

// Edit showtime
function editShowtime(showtimeId) {
    openShowtimeModal(showtimeId);
}

// Delete showtime
async function deleteShowtime(showtimeId) {
    if (!confirm('Bạn có chắc chắn muốn xóa suất chiếu này?')) {
        return;
    }

    try {
        const response = await del(`/showtimes/${showtimeId}`, true);
        if (response.success) {
            showAlert('Xóa suất chiếu thành công', 'success');
            loadAdminShowtimes();
        } else {
            showAlert(response.message || 'Xóa suất chiếu thất bại', 'error');
        }
    } catch (error) {
        console.error('Delete showtime error:', error);
        showAlert('Lỗi khi xóa suất chiếu', 'error');
    }
}

// Handle showtime form submit
document.getElementById('showtime-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const showtimeId = document.getElementById('showtime-id').value;
    const startTimeInput = document.getElementById('showtime-start').value;
    
    // Convert datetime-local to ISO string (UTC)
    // datetime-local returns value in local time, we need to convert to UTC
    const startTime = new Date(startTimeInput);
    if (isNaN(startTime.getTime())) {
        showAlert('Thời gian không hợp lệ', 'error');
        return;
    }
    
    const showtime = {
        movieId: parseInt(document.getElementById('showtime-movie').value),
        auditoriumId: parseInt(document.getElementById('showtime-auditorium').value),
        startTime: startTime.toISOString(),
        baseTicketPrice: parseFloat(document.getElementById('showtime-price').value),
        format: document.getElementById('showtime-format').value || null,
        language: document.getElementById('showtime-language').value || null
    };

    // Validate required fields
    if (!showtime.movieId || !showtime.auditoriumId || !showtime.startTime || !showtime.baseTicketPrice) {
        showAlert('Vui lòng điền đầy đủ thông tin bắt buộc', 'error');
        return;
    }

    const button = e.target.querySelector('button[type="submit"]');
    button.disabled = true;
    button.textContent = 'Đang lưu...';

    try {
        let response;
        if (showtimeId) {
            response = await put(`/showtimes/${showtimeId}`, showtime, true);
        } else {
            response = await post('/showtimes', showtime, true);
        }

        if (response.success) {
            showAlert(showtimeId ? 'Cập nhật suất chiếu thành công' : 'Thêm suất chiếu thành công', 'success');
            closeShowtimeModal();
            loadAdminShowtimes();
        } else {
            const errorMessage = response.message || 'Lưu suất chiếu thất bại';
            showAlert(errorMessage, 'error');
            console.error('Save showtime error response:', response);
        }
    } catch (error) {
        console.error('Save showtime error:', error);
        const errorMessage = error.message || 'Lỗi khi lưu suất chiếu. Vui lòng thử lại.';
        showAlert(errorMessage, 'error');
    } finally {
        button.disabled = false;
        button.textContent = 'Lưu';
    }
});

// Format currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(amount);
}

// Show alert
function showAlert(message, type) {
    const container = document.getElementById('alert-container');
    container.innerHTML = `<div class="alert alert--${type}">${message}</div>`;
    setTimeout(() => {
        container.innerHTML = '';
    }, 5000);
}

