// Load movie detail
async function loadMovieDetail(movieId) {
    try {
        const response = await get(`/movies/${movieId}`);
        if (response.success && response.data) {
            renderMovieDetail(response.data);
        } else {
            document.getElementById('movie-detail').innerHTML = '<p class="alert alert--error">Không tìm thấy phim.</p>';
        }
    } catch (error) {
        console.error('Load movie detail error:', error);
        document.getElementById('movie-detail').innerHTML = '<p class="alert alert--error">Lỗi khi tải thông tin phim.</p>';
    }
}

// Render movie detail
function renderMovieDetail(movie) {
    const container = document.getElementById('movie-detail');
    const poster = movie.posterUrl 
        ? `<img src="${movie.posterUrl}" alt="${movie.title}" style="max-width: 300px; border-radius: var(--border-radius-lg); margin-bottom: var(--spacing-md);" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'300\' height=\'450\'%3E%3Crect fill=\'%23141414\' width=\'300\' height=\'450\'/%3E%3Ctext fill=\'%23ffffff\' x=\'50%25\' y=\'50%25\' text-anchor=\'middle\' dy=\'.3em\'%3ENo Image%3C/text%3E%3C/svg%3E'">`
        : '';

    container.innerHTML = `
        <div style="display: flex; gap: var(--spacing-lg); flex-wrap: wrap;">
            ${poster}
            <div style="flex: 1; min-width: 300px;">
                <h1>${movie.title}</h1>
                ${movie.originalTitle ? `<p class="text-secondary">${movie.originalTitle}</p>` : ''}
                <div style="display: flex; gap: var(--spacing-md); margin: var(--spacing-md) 0; flex-wrap: wrap;">
                    ${movie.imdbRating ? `<span class="badge badge--warning">⭐ ${movie.imdbRating}</span>` : ''}
                    <span class="badge">${movie.durationMinutes} phút</span>
                    ${movie.ageRating ? `<span class="badge">${movie.ageRating}</span>` : ''}
                </div>
                ${movie.genres && movie.genres.length > 0 ? `<p><strong>Thể loại:</strong> ${movie.genres.map(g => g.genreName).join(', ')}</p>` : ''}
                ${movie.releaseDate ? `<p><strong>Ngày phát hành:</strong> ${new Date(movie.releaseDate).toLocaleDateString('vi-VN')}</p>` : ''}
                ${movie.country ? `<p><strong>Quốc gia:</strong> ${movie.country}</p>` : ''}
                ${movie.director ? `<p><strong>Đạo diễn:</strong> ${movie.director}</p>` : ''}
                ${movie.cast ? `<p><strong>Diễn viên:</strong> ${movie.cast}</p>` : ''}
                ${movie.description ? `<p class="mt-md">${movie.description}</p>` : ''}
            </div>
        </div>
    `;
}

// Load showtimes
let selectedDate = new Date().toISOString().split('T')[0];

async function loadShowtimes(movieId, date = null) {
    if (!date) {
        date = selectedDate;
    }

    const container = document.getElementById('showtimes-container');
    const loading = document.getElementById('loading');

    container.innerHTML = '';
    loading.classList.remove('hidden');

    try {
        const params = new URLSearchParams({
            movieId: movieId
        });

        if (date) {
            params.append('date', date);
        }

        const response = await get(`/showtimes?${params.toString()}`);

        if (response.success && response.data) {
            const showtimes = response.data.items || response.data;

            if (showtimes.length === 0) {
                container.innerHTML = '<p class="text-center">Không có suất chiếu nào cho ngày này.</p>';
            } else {
                showtimes.forEach(showtime => {
                    container.appendChild(createShowtimeCard(showtime));
                });
            }
        } else {
            container.innerHTML = '<p class="alert alert--error">Lỗi khi tải lịch chiếu.</p>';
        }
    } catch (error) {
        console.error('Load showtimes error:', error);
        container.innerHTML = '<p class="alert alert--error">Lỗi khi tải lịch chiếu.</p>';
    } finally {
        loading.classList.add('hidden');
    }
}

// Create showtime card
function createShowtimeCard(showtime) {
    const card = document.createElement('div');
    card.className = 'card';

    const startTime = new Date(showtime.startTime);
    const endTime = new Date(showtime.endTime);

    card.innerHTML = `
        <div class="card__header">
            <h3 class="card__title">${showtime.auditoriumName || 'Phòng chiếu'}</h3>
        </div>
        <div class="card__body">
            <p><strong>Thời gian:</strong> ${startTime.toLocaleString('vi-VN', { 
                weekday: 'short', 
                day: '2-digit', 
                month: '2-digit', 
                hour: '2-digit', 
                minute: '2-digit' 
            })} - ${endTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</p>
            ${showtime.format ? `<p><strong>Định dạng:</strong> ${showtime.format}</p>` : ''}
            ${showtime.language ? `<p><strong>Ngôn ngữ:</strong> ${showtime.language}</p>` : ''}
            <p><strong>Giá vé:</strong> ${formatCurrency(showtime.baseTicketPrice)}</p>
        </div>
        <div class="card__footer">
            <button class="btn btn--primary" onclick="bookShowtime(${showtime.showtimeId})">Đặt vé</button>
        </div>
    `;

    return card;
}

// Book showtime
function bookShowtime(showtimeId) {
    if (!isAuthenticated()) {
        if (confirm('Bạn cần đăng nhập để đặt vé. Chuyển đến trang đăng nhập?')) {
            window.location.href = `login.html?redirect=booking.html?showtimeId=${showtimeId}`;
        }
        return;
    }

    window.location.href = `booking.html?showtimeId=${showtimeId}`;
}

// Render date filter
function renderDateFilter(movieId) {
    const container = document.getElementById('date-filter');
    container.innerHTML = '';

    // Generate dates for next 7 days
    for (let i = 0; i < 7; i++) {
        const date = new Date();
        date.setDate(date.getDate() + i);
        const dateStr = date.toISOString().split('T')[0];
        const dateLabel = i === 0 ? 'Hôm nay' : date.toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit' });

        const button = document.createElement('button');
        button.className = `btn ${i === 0 ? 'btn--primary' : 'btn--outline'} btn--small`;
        button.textContent = dateLabel;
        button.onclick = () => {
            selectedDate = dateStr;
            loadShowtimes(movieId, dateStr);
            updateActiveDateButton(button);
        };
        container.appendChild(button);
    }
}

function updateActiveDateButton(activeButton) {
    document.querySelectorAll('#date-filter button').forEach(btn => {
        btn.classList.remove('btn--primary');
        btn.classList.add('btn--outline');
    });
    activeButton.classList.remove('btn--outline');
    activeButton.classList.add('btn--primary');
}

// Format currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(amount);
}

// Initialize date filter
if (document.getElementById('date-filter')) {
    const urlParams = new URLSearchParams(window.location.search);
    const movieId = urlParams.get('id');
    if (movieId) {
        renderDateFilter(movieId);
    }
}

