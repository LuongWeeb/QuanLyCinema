// Tải danh sách phim admin
async function loadAdminMovies() {
    try {
        const response = await get('/movies?pageIndex=1&pageSize=100');
        if (response.success && response.data) {
            renderMoviesTable(response.data.items || []);
        }
    } catch (error) {
        console.error('Lỗi khi tải danh sách phim:', error);
        showAlert('Lỗi khi tải danh sách phim', 'error');
    }
}

// Hiển thị bảng phim
function renderMoviesTable(movies) {
    const tbody = document.getElementById('movies-table-body');
    tbody.innerHTML = '';

    movies.forEach(movie => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${movie.movieId}</td>
            <td>${movie.title}</td>
            <td>${movie.genres ? movie.genres.map(g => g.genreName).join(', ') : 'N/A'}</td>
            <td>${movie.durationMinutes} phút</td>
            <td>${movie.imdbRating || 'N/A'}</td>
            <td>
                <button class="btn btn--small btn--secondary" onclick="editMovie(${movie.movieId})">Sửa</button>
                <button class="btn btn--small btn--outline" onclick="deleteMovie(${movie.movieId})">Xóa</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Mở modal phim
function openMovieModal(movieId = null) {
    const modal = document.getElementById('movie-modal');
    const form = document.getElementById('movie-form');
    const title = document.getElementById('modal-title');

    if (movieId) {
        title.textContent = 'Sửa phim';
        loadMovieForEdit(movieId);
    } else {
        title.textContent = 'Thêm phim mới';
        form.reset();
        document.getElementById('movie-id').value = '';
        document.getElementById('poster-preview').innerHTML = '';
        document.getElementById('movie-poster-file').value = '';
    }

    modal.classList.add('modal--active');
}

// Đóng modal phim
function closeMovieModal() {
    const modal = document.getElementById('movie-modal');
    modal.classList.remove('modal--active');
}

// Tải phim để chỉnh sửa
async function loadMovieForEdit(movieId) {
    try {
        const response = await get(`/movies/${movieId}`);
        if (response.success && response.data) {
            const movie = response.data;
            document.getElementById('movie-id').value = movie.movieId;
            document.getElementById('movie-title').value = movie.title;
            document.getElementById('movie-description').value = movie.description || '';
            document.getElementById('movie-duration').value = movie.durationMinutes;
            document.getElementById('movie-rating').value = movie.imdbRating || '';
            document.getElementById('movie-poster').value = movie.posterUrl || '';
            document.getElementById('movie-poster-url').value = movie.posterUrl || '';
            
            // Hiển thị xem trước nếu có poster
            if (movie.posterUrl) {
                showPosterPreview(movie.posterUrl);
            }
        }
    } catch (error) {
        console.error('Lỗi khi tải phim để chỉnh sửa:', error);
        showAlert('Lỗi khi tải thông tin phim', 'error');
    }
}

// Chỉnh sửa phim
function editMovie(movieId) {
    openMovieModal(movieId);
}

// Xóa phim
async function deleteMovie(movieId) {
    if (!confirm('Bạn có chắc chắn muốn xóa phim này?')) {
        return;
    }

    try {
        const response = await del(`/movies/${movieId}`, true);
        if (response.success) {
            showAlert('Xóa phim thành công', 'success');
            loadAdminMovies();
        } else {
            showAlert(response.message || 'Xóa phim thất bại', 'error');
        }
    } catch (error) {
        console.error('Lỗi khi xóa phim:', error);
        showAlert('Lỗi khi xóa phim', 'error');
    }
}

// Xử lý thay đổi file poster
async function handlePosterFileChange(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Xác thực loại file
    if (!file.type.startsWith('image/')) {
        showAlert('Vui lòng chọn file ảnh', 'error');
        event.target.value = '';
        return;
    }

    // Xác thực kích thước file (5MB)
    if (file.size > 5 * 1024 * 1024) {
        showAlert('Kích thước file không được vượt quá 5MB', 'error');
        event.target.value = '';
        return;
    }

    // Hiển thị xem trước
    const reader = new FileReader();
    reader.onload = (e) => {
        showPosterPreview(e.target.result);
    };
    reader.readAsDataURL(file);

    // Tải lên file
    const button = event.target.closest('form')?.querySelector('button[type="submit"]');
    const originalText = button?.textContent;
    if (button) {
        button.disabled = true;
        button.textContent = 'Đang upload ảnh...';
    }

    try {
        const response = await uploadFile(file, '/upload/poster', true);
        if (response.success && response.data) {
            document.getElementById('movie-poster').value = response.data;
            document.getElementById('movie-poster-url').value = response.data;
            showAlert('Upload ảnh thành công', 'success');
        } else {
            showAlert(response.message || 'Upload ảnh thất bại', 'error');
            event.target.value = '';
        }
    } catch (error) {
        console.error('Upload poster error:', error);
        showAlert('Lỗi khi upload ảnh', 'error');
        event.target.value = '';
    } finally {
        if (button) {
            button.disabled = false;
            button.textContent = originalText || 'Lưu';
        }
    }
}

// Hiển thị xem trước poster
function showPosterPreview(imageUrl) {
    const preview = document.getElementById('poster-preview');
    preview.innerHTML = `
        <img src="${imageUrl}" alt="Poster preview" style="max-width: 200px; max-height: 300px; border-radius: var(--border-radius); border: 1px solid var(--border-color);">
    `;
}

// Xử lý gửi form phim
document.getElementById('movie-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const movieId = document.getElementById('movie-id').value;
    const posterUrl = document.getElementById('movie-poster').value.trim() || 
                     document.getElementById('movie-poster-url').value.trim() || null;

    const movie = {
        title: document.getElementById('movie-title').value.trim(),
        description: document.getElementById('movie-description').value.trim(),
        durationMinutes: parseInt(document.getElementById('movie-duration').value),
        imdbRating: document.getElementById('movie-rating').value ? parseFloat(document.getElementById('movie-rating').value) : null,
        posterUrl: posterUrl
    };

    const button = e.target.querySelector('button[type="submit"]');
    button.disabled = true;
    button.textContent = 'Đang lưu...';

    // Xác thực
    if (!movie.title || movie.title.trim().length === 0) {
        showAlert('Vui lòng nhập tên phim', 'error');
        button.disabled = false;
        button.textContent = 'Lưu';
        return;
    }

    if (!movie.durationMinutes || movie.durationMinutes <= 0) {
        showAlert('Vui lòng nhập thời lượng phim hợp lệ', 'error');
        button.disabled = false;
        button.textContent = 'Lưu';
        return;
    }

    try {
        let response;
        if (movieId) {
            response = await put(`/movies/${movieId}`, movie, true);
        } else {
            response = await post('/movies', movie, true);
        }

        if (response.success) {
            showAlert(movieId ? 'Cập nhật phim thành công' : 'Thêm phim thành công', 'success');
            closeMovieModal();
            loadAdminMovies();
        } else {
            showAlert(response.message || 'Lưu phim thất bại', 'error');
        }
    } catch (error) {
        console.error('Lỗi khi lưu phim:', error);
        const errorMessage = error.message || 'Lỗi khi lưu phim. Vui lòng kiểm tra lại thông tin.';
        showAlert(errorMessage, 'error');
    } finally {
        button.disabled = false;
        button.textContent = 'Lưu';
    }
});

// Hiển thị thông báo
function showAlert(message, type) {
    const container = document.getElementById('alert-container');
    container.innerHTML = `<div class="alert alert--${type}">${message}</div>`;
    setTimeout(() => {
        container.innerHTML = '';
    }, 5000);
}

