// Tải danh sách vé
async function loadTickets() {
    const container = document.getElementById('tickets-container');
    const loading = document.getElementById('loading');

    container.innerHTML = '';
    loading.classList.remove('hidden');

    try {
        const response = await get('/tickets/my', true);

        if (response.success && response.data) {
            const tickets = response.data;

            if (tickets.length === 0) {
                container.innerHTML = '<p class="text-center">Bạn chưa có vé nào.</p>';
            } else {
                // Nhóm vé theo mã đặt chỗ
                const ticketsByReservation = {};
                tickets.forEach(ticket => {
                    const reservationId = ticket.reservationId;
                    if (!ticketsByReservation[reservationId]) {
                        ticketsByReservation[reservationId] = [];
                    }
                    ticketsByReservation[reservationId].push(ticket);
                });

                Object.values(ticketsByReservation).forEach(reservationTickets => {
                    container.appendChild(createTicketCard(reservationTickets));
                });
            }
        } else {
            container.innerHTML = '<p class="alert alert--error">Lỗi khi tải danh sách vé.</p>';
        }
    } catch (error) {
                console.error('Lỗi khi tải vé:', error);
        container.innerHTML = '<p class="alert alert--error">Lỗi khi tải danh sách vé.</p>';
    } finally {
        loading.classList.add('hidden');
    }
}

// Tạo thẻ vé
function createTicketCard(tickets) {
    if (tickets.length === 0) return document.createElement('div');

    const ticket = tickets[0];
    const card = document.createElement('div');
    card.className = 'card mb-lg';

    const startTime = ticket.showtimeStartTime ? new Date(ticket.showtimeStartTime) : new Date();
    const statusBadge = getStatusBadge(ticket.status);

    card.innerHTML = `
        <div class="card__header">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <h3 class="card__title">${ticket.movieTitle || 'N/A'}</h3>
                ${statusBadge}
            </div>
        </div>
        <div class="card__body">
            <p><strong>Mã đặt vé:</strong> ${ticket.reservationCode || 'N/A'}</p>
            <p><strong>Phòng:</strong> ${ticket.auditoriumName || 'N/A'}</p>
            <p><strong>Thời gian:</strong> ${startTime.toLocaleString('vi-VN')}</p>
            <p><strong>Ghế:</strong> ${tickets.map(t => `${t.rowLabel}${t.seatNumber}`).join(', ')}</p>
            <p><strong>Tổng tiền:</strong> ${formatCurrency(ticket.totalAmount || 0)}</p>
        </div>
        <div class="card__footer">
            <div style="display: flex; gap: var(--spacing-md); flex-wrap: wrap;">
                ${tickets.map(t => `
                    <div style="flex: 1; min-width: 200px; padding: var(--spacing-md); background-color: var(--bg-secondary); border-radius: var(--border-radius); text-align: center;">
                        <p style="font-size: 0.875rem; color: var(--text-secondary); margin-bottom: var(--spacing-xs);">Ghế ${t.rowLabel}${t.seatNumber}</p>
                        <div id="qr-${t.ticketId}" style="width: 150px; height: 150px; margin: var(--spacing-sm) auto; background-color: white; padding: var(--spacing-sm); border-radius: var(--border-radius); display: flex; align-items: center; justify-content: center;">
                            <div class="spinner"></div>
                        </div>
                        <div style="margin-top: var(--spacing-sm); padding: var(--spacing-xs); background-color: var(--bg-primary); border-radius: var(--border-radius);">
                            <p style="font-size: 0.7rem; color: var(--text-secondary); margin: 0 0 var(--spacing-xs) 0;">Mã check-in:</p>
                            <p style="font-size: 0.75rem; font-weight: 600; font-family: monospace; word-break: break-all; margin: 0; color: var(--text-primary);">${t.qrCodeData || 'N/A'}</p>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;

    // Tạo mã QR cho mỗi vé
    tickets.forEach(t => {
        if (t.qrCodeData) {
            generateQRCode(t.qrCodeData, `qr-${t.ticketId}`);
        }
    });

    return card;
}

// Lấy badge trạng thái
function getStatusBadge(status) {
    const badges = {
        'Booked': '<span class="badge badge--warning">Đã đặt</span>',
        'Paid': '<span class="badge badge--success">Đã thanh toán</span>',
        'CheckedIn': '<span class="badge badge--success">Đã check-in</span>',
        'Cancelled': '<span class="badge badge--error">Đã hủy</span>'
    };
    return badges[status] || `<span class="badge">${status}</span>`;
}

// Tạo mã QR sử dụng thư viện QRCode
function generateQRCode(data, elementId) {
    const element = document.getElementById(elementId);
    if (!element || !data) return;

    // Kiểm tra xem thư viện QRCode đã được tải chưa
    if (typeof QRCode !== 'undefined') {
        // Tạo canvas cho mã QR
        const canvas = document.createElement('canvas');
        canvas.id = elementId + '-canvas';
        canvas.style.display = 'none';
        element.appendChild(canvas);

        QRCode.toCanvas(canvas, data, {
            width: 150,
            margin: 2,
            color: {
                dark: '#000000',
                light: '#FFFFFF'
            }
        }, function (error) {
            if (error) {
                console.error('Lỗi khi tạo mã QR:', error);
                element.innerHTML = `
                    <div style="display: flex; align-items: center; justify-content: center; height: 100%; font-size: 0.7rem; text-align: center; word-break: break-all; padding: var(--spacing-xs);">
                        ${data}
                    </div>
                `;
            } else {
                canvas.style.display = 'block';
                element.innerHTML = '';
                element.appendChild(canvas);
            }
        });
    } else {
        // Dự phòng: hiển thị văn bản nếu thư viện QRCode chưa được tải
        element.innerHTML = `
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; padding: var(--spacing-sm);">
                <div style="font-size: 0.7rem; text-align: center; word-break: break-all; margin-bottom: var(--spacing-xs);">
                    ${data}
                </div>
                <div style="font-size: 0.6rem; color: var(--text-secondary); text-align: center;">
                    (Mã check-in)
                </div>
            </div>
        `;
    }
}

// Định dạng tiền tệ
function formatCurrency(amount) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(amount);
}

