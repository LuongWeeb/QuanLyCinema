// Các hàm cho nhân viên: check-in và quản lý vé

let scanningInterval = null;

// Kiểm tra vé bằng mã QR
async function checkTicketByQrCode(qrCodeData) {
    try {
        const response = await get(`/tickets/qr/${encodeURIComponent(qrCodeData)}`, true);
        
        if (response.success && response.data) {
            currentTicket = response.data;
            displayTicketInfo(currentTicket);
            document.getElementById('qr-code-input').value = '';
        } else {
            showAlert(response.message || 'Không tìm thấy vé với mã QR code này', 'error');
            hideTicketInfo();
        }
    } catch (error) {
        console.error('Lỗi khi kiểm tra vé:', error);
        showAlert(error.message || 'Lỗi khi kiểm tra vé', 'error');
        hideTicketInfo();
    }
}

// Hiển thị thông tin vé
function displayTicketInfo(ticket) {
    const container = document.getElementById('ticket-info-container');
    const infoDiv = document.getElementById('ticket-info');
    const checkinBtn = document.getElementById('checkin-btn');

    const startTime = ticket.showtimeStartTime ? new Date(ticket.showtimeStartTime) : new Date();
    const statusClass = ticket.status === 'Paid' ? 'ticket-status--paid' : 
                       ticket.status === 'CheckedIn' ? 'ticket-status--checkedin' : 
                       'ticket-status--booked';
    
    const statusText = ticket.status === 'Paid' ? 'Đã thanh toán' :
                      ticket.status === 'CheckedIn' ? 'Đã check-in' :
                      ticket.status === 'Booked' ? 'Đã đặt' : ticket.status;

    infoDiv.innerHTML = `
        <p><strong>Mã đặt vé:</strong> <code style="background-color: var(--bg-secondary); padding: 2px 6px; border-radius: var(--border-radius);">${ticket.reservationCode || 'N/A'}</code></p>
        <p><strong>Phim:</strong> ${ticket.movieTitle || 'N/A'}</p>
        <p><strong>Phòng:</strong> ${ticket.auditoriumName || 'N/A'}</p>
        <p><strong>Ghế:</strong> ${ticket.rowLabel}${ticket.seatNumber}</p>
        <p><strong>Loại ghế:</strong> ${ticket.seatTypeName || 'N/A'}</p>
        <p><strong>Thời gian:</strong> ${startTime.toLocaleString('vi-VN', { 
            weekday: 'long', 
            day: '2-digit', 
            month: '2-digit', 
            year: 'numeric',
            hour: '2-digit', 
            minute: '2-digit' 
        })}</p>
        <p><strong>Trạng thái:</strong> <span class="ticket-status ${statusClass}">${statusText}</span></p>
        ${ticket.checkedInAt ? `<p><strong>Đã check-in lúc:</strong> ${new Date(ticket.checkedInAt).toLocaleString('vi-VN')}</p>` : ''}
        <p><strong>Giá vé:</strong> ${formatCurrency(ticket.seatPrice || 0)}</p>
    `;

    // Bật/tắt nút check-in
    if (ticket.status === 'Paid' && !ticket.checkedInAt) {
        checkinBtn.disabled = false;
        checkinBtn.textContent = 'Check-in vé';
    } else if (ticket.status === 'CheckedIn') {
        checkinBtn.disabled = true;
        checkinBtn.textContent = 'Đã check-in';
        checkinBtn.classList.add('btn--secondary');
    } else {
        checkinBtn.disabled = true;
        checkinBtn.textContent = 'Vé chưa thanh toán';
    }

    container.style.display = 'block';
    container.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Ẩn thông tin vé
function hideTicketInfo() {
    document.getElementById('ticket-info-container').style.display = 'none';
    currentTicket = null;
}

// Check-in vé
async function checkInTicket(qrCodeData) {
    const button = document.getElementById('checkin-btn');
    button.disabled = true;
    button.textContent = 'Đang xử lý...';

    try {
        const response = await post('/tickets/checkin', {
            qrCodeData: qrCodeData
        }, true);

        if (response.success) {
            showAlert('Check-in vé thành công!', 'success');
            // Tải lại thông tin vé
            await checkTicketByQrCode(qrCodeData);
        } else {
            showAlert(response.message || 'Check-in vé thất bại', 'error');
        }
    } catch (error) {
        console.error('Lỗi khi check-in:', error);
        showAlert(error.message || 'Lỗi khi check-in vé', 'error');
    } finally {
        // Trạng thái nút sẽ được cập nhật bởi displayTicketInfo
    }
}

// Bật camera để quét QR
async function startCamera() {
    try {
        const video = document.getElementById('qr-video');
        const startBtn = document.getElementById('start-camera-btn');
        const stopBtn = document.getElementById('stop-camera-btn');

        stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
                facingMode: 'environment' // Sử dụng camera sau trên thiết bị di động
            } 
        });

        video.srcObject = stream;
        video.style.display = 'block';
        video.play();

        startBtn.style.display = 'none';
        stopBtn.style.display = 'block';

        // Bắt đầu quét
        scanningInterval = setInterval(() => {
            scanQRCode(video);
        }, 500);
    } catch (error) {
        console.error('Lỗi camera:', error);
        showAlert('Không thể truy cập camera. Vui lòng nhập mã QR thủ công.', 'error');
    }
}

// Tắt camera
function stopCamera() {
    const video = document.getElementById('qr-video');
    const startBtn = document.getElementById('start-camera-btn');
    const stopBtn = document.getElementById('stop-camera-btn');

    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        stream = null;
    }

    video.style.display = 'none';
    startBtn.style.display = 'block';
    stopBtn.style.display = 'none';

    if (scanningInterval) {
        clearInterval(scanningInterval);
        scanningInterval = null;
    }
}

// Quét mã QR từ video
function scanQRCode(video) {
    const canvas = document.getElementById('qr-canvas');
    const context = canvas.getContext('2d');

    if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        
        // Phát hiện mã QR đơn giản - trong môi trường sản xuất, sử dụng thư viện như jsQR
        // Hiện tại, chúng ta sẽ sử dụng nhập thủ công hoặc thư viện QR
        // Đây là giá trị tạm thời - bạn nên tích hợp thư viện mã QR như jsQR
    }
}

// Định dạng tiền tệ
function formatCurrency(amount) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(amount);
}

// Hiển thị thông báo
function showAlert(message, type) {
    const container = document.getElementById('alert-container');
    container.innerHTML = `<div class="alert alert--${type}">${message}</div>`;
    setTimeout(() => {
        container.innerHTML = '';
    }, 5000);
}

