// Load reports
async function loadReports() {
    const from = document.getElementById('date-from').value;
    const to = document.getElementById('date-to').value;

    if (!from || !to) {
        showAlert('Vui lòng chọn khoảng thời gian', 'error');
        return;
    }

    const container = document.getElementById('reports-container');
    container.innerHTML = '<div class="spinner"></div>';

    try {
        const [revenueByDate, revenueByMovie, topShowtimes] = await Promise.all([
            get(`/reports/revenue-by-date?from=${from}&to=${to}`, true),
            get(`/reports/revenue-by-movie?from=${from}&to=${to}`, true),
            get(`/reports/top-showtimes?from=${from}&to=${to}&top=10`, true)
        ]);

        container.innerHTML = '';

        if (revenueByDate.success) {
            container.appendChild(createRevenueByDateCard(revenueByDate.data));
        }

        if (revenueByMovie.success) {
            container.appendChild(createRevenueByMovieCard(revenueByMovie.data));
        }

        if (topShowtimes.success) {
            container.appendChild(createTopShowtimesCard(topShowtimes.data));
        }
    } catch (error) {
        console.error('Load reports error:', error);
        container.innerHTML = '<div class="alert alert--error">Lỗi khi tải báo cáo</div>';
    }
}

// Create revenue by date card
function createRevenueByDateCard(data) {
    const card = document.createElement('div');
    card.className = 'card mb-lg';

    const maxRevenue = Math.max(...data.revenues, 1);

    card.innerHTML = `
        <div class="card__header">
            <h3 class="card__title">Doanh thu theo ngày</h3>
            <p class="text-secondary">Tổng: ${formatCurrency(data.totalRevenue)}</p>
        </div>
        <div class="card__body">
            <div style="display: flex; gap: var(--spacing-md); align-items: flex-end; height: 300px; padding: var(--spacing-md);">
                ${data.labels.map((label, index) => `
                    <div style="flex: 1; display: flex; flex-direction: column; align-items: center;">
                        <div style="flex: 1; display: flex; align-items: flex-end; width: 100%;">
                            <div style="width: 100%; background-color: var(--primary-color); height: ${(data.revenues[index] / maxRevenue) * 100}%; border-radius: var(--border-radius) var(--border-radius) 0 0;"></div>
                        </div>
                        <div style="margin-top: var(--spacing-sm); font-size: 0.75rem; text-align: center; color: var(--text-secondary);">
                            ${new Date(label).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
                        </div>
                        <div style="font-size: 0.75rem; text-align: center; color: var(--text-primary); font-weight: 600;">
                            ${formatCurrency(data.revenues[index])}
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;

    return card;
}

// Create revenue by movie card
function createRevenueByMovieCard(data) {
    const card = document.createElement('div');
    card.className = 'card mb-lg';

    const maxRevenue = Math.max(...data.revenues, 1);

    card.innerHTML = `
        <div class="card__header">
            <h3 class="card__title">Doanh thu theo phim</h3>
            <p class="text-secondary">Tổng: ${formatCurrency(data.totalRevenue)}</p>
        </div>
        <div class="card__body">
            <div style="display: flex; gap: var(--spacing-md); align-items: flex-end; height: 300px; padding: var(--spacing-md);">
                ${data.movieTitles.slice(0, 10).map((title, index) => `
                    <div style="flex: 1; display: flex; flex-direction: column; align-items: center;">
                        <div style="flex: 1; display: flex; align-items: flex-end; width: 100%;">
                            <div style="width: 100%; background-color: var(--primary-color); height: ${(data.revenues[index] / maxRevenue) * 100}%; border-radius: var(--border-radius) var(--border-radius) 0 0;"></div>
                        </div>
                        <div style="margin-top: var(--spacing-sm); font-size: 0.75rem; text-align: center; color: var(--text-secondary); writing-mode: vertical-rl; text-orientation: mixed; height: 100px;">
                            ${title.length > 15 ? title.substring(0, 15) + '...' : title}
                        </div>
                        <div style="font-size: 0.75rem; text-align: center; color: var(--text-primary); font-weight: 600;">
                            ${formatCurrency(data.revenues[index])}
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;

    return card;
}

// Create top showtimes card
function createTopShowtimesCard(data) {
    const card = document.createElement('div');
    card.className = 'card mb-lg';

    card.innerHTML = `
        <div class="card__header">
            <h3 class="card__title">Top suất chiếu đông khách</h3>
        </div>
        <div class="card__body">
            <table class="table">
                <thead>
                    <tr>
                        <th>Phim</th>
                        <th>Phòng</th>
                        <th>Thời gian</th>
                        <th>Số vé</th>
                        <th>Doanh thu</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.map(showtime => {
                        const startTime = new Date(showtime.startTime);
                        return `
                            <tr>
                                <td>${showtime.movieTitle}</td>
                                <td>${showtime.auditoriumName}</td>
                                <td>${startTime.toLocaleString('vi-VN')}</td>
                                <td>${showtime.ticketCount}</td>
                                <td>${formatCurrency(showtime.revenue)}</td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        </div>
    `;

    return card;
}

// Format currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(amount);
}

// Show alert
function showAlert(message, type) {
    const container = document.getElementById('reports-container');
    container.innerHTML = `<div class="alert alert--${type}">${message}</div>`;
}

