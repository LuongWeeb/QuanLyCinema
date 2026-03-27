let currentAuditoriumId = null;
let seatTypes = [];
let currentSeats = [];

// Load auditoriums
async function loadAuditoriums() {
    try {
        const response = await get('/auditoriums');
        if (response.success && response.data) {
            renderAuditoriums(response.data);
        } else {
            showAlert('Lỗi khi tải danh sách phòng chiếu', 'error');
        }
    } catch (error) {
        console.error('Load auditoriums error:', error);
        showAlert('Lỗi khi tải danh sách phòng chiếu', 'error');
    }
}

// Render auditoriums
function renderAuditoriums(auditoriums) {
    const container = document.getElementById('auditoriums-list');
    if (auditoriums.length === 0) {
        container.innerHTML = '<p class="text-center">Chưa có phòng chiếu nào.</p>';
        return;
    }

    container.innerHTML = auditoriums.map(auditorium => `
        <div class="card mb-md auditorium-card" data-auditorium-id="${auditorium.auditoriumId}" style="cursor: pointer; border: 0;" onclick="selectAuditorium(${auditorium.auditoriumId})">
            <div class="card__body">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <h4 style="margin: 0 0 var(--spacing-xs) 0;">${auditorium.name}</h4>
                        ${auditorium.locationDescription ? `<p class="text-secondary" style="margin: 0;">${auditorium.locationDescription}</p>` : ''}
                        <p style="margin: var(--spacing-xs) 0 0 0;"><strong>Sức chứa:</strong> ${auditorium.capacity} ghế</p>
                    </div>
                    <div>
                        <span class="badge ${auditorium.isActive ? 'badge--success' : 'badge--error'}">
                            ${auditorium.isActive ? 'Hoạt động' : 'Tạm ngưng'}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

// Select auditorium and load seats
async function selectAuditorium(auditoriumId) {
    currentAuditoriumId = auditoriumId;
    document.getElementById('seat-auditorium-id').value = auditoriumId;
    document.getElementById('bulk-seat-auditorium-id').value = auditoriumId;
    
    // Highlight selected auditorium
    document.querySelectorAll('.auditorium-card').forEach(card => {
        const id = card.getAttribute('data-auditorium-id');
        if (id == auditoriumId) {
            card.style.border = '2px solid var(--primary-color)';
        } else {
            card.style.border = '0';
        }
    });
    
    await loadSeats(auditoriumId);
    document.getElementById('seats-section').style.display = 'block';
    
    // Get auditorium name for title
    const auditoriumsResponse = await get('/auditoriums');
    if (auditoriumsResponse.success && auditoriumsResponse.data) {
        const auditorium = auditoriumsResponse.data.find(a => a.auditoriumId === auditoriumId);
        if (auditorium) {
            document.getElementById('seats-section-title').textContent = `Quản lý ghế - ${auditorium.name}`;
        }
    }
}

// Load seats
async function loadSeats(auditoriumId) {
    try {
        const response = await get(`/auditoriums/${auditoriumId}/seats`);
        if (response.success && response.data) {
            currentSeats = response.data;
            renderSeatsGrid();
        } else {
            showAlert('Lỗi khi tải danh sách ghế', 'error');
        }
    } catch (error) {
        console.error('Load seats error:', error);
        showAlert('Lỗi khi tải danh sách ghế', 'error');
    }
}

// Render seats grid
function renderSeatsGrid() {
    const container = document.getElementById('seats-grid-container');
    container.innerHTML = '';

    if (currentSeats.length === 0) {
        container.innerHTML = '<p class="text-center">Chưa có ghế nào. Hãy thêm ghế cho phòng này.</p>';
        return;
    }

    // Group seats by row
    const seatsByRow = {};
    currentSeats.forEach(seat => {
        if (!seatsByRow[seat.rowLabel]) {
            seatsByRow[seat.rowLabel] = [];
        }
        seatsByRow[seat.rowLabel].push(seat);
    });

    // Sort rows
    const sortedRows = Object.keys(seatsByRow).sort();

    sortedRows.forEach(rowLabel => {
        const rowDiv = document.createElement('div');
        rowDiv.style.marginBottom = 'var(--spacing-md)';

        const rowLabelDiv = document.createElement('div');
        rowLabelDiv.textContent = `Hàng ${rowLabel}`;
        rowLabelDiv.style.marginBottom = 'var(--spacing-sm)';
        rowLabelDiv.style.fontWeight = '600';
        rowDiv.appendChild(rowLabelDiv);

        const seatsDiv = document.createElement('div');
        seatsDiv.className = 'seat-grid';
        seatsDiv.style.gridTemplateColumns = `repeat(${seatsByRow[rowLabel].length}, 1fr)`;

        seatsByRow[rowLabel].forEach(seat => {
            const seatButton = document.createElement('button');
            seatButton.className = 'seat-grid__seat';
            seatButton.textContent = seat.seatNumber;
            seatButton.title = `${seat.rowLabel}${seat.seatNumber} - ${seat.seatTypeName}`;

            if (!seat.isActive) {
                seatButton.classList.add('seat-grid__seat--booked');
            } else {
                seatButton.classList.add('seat-grid__seat--available');
                if (seat.seatTypeName && seat.seatTypeName.toLowerCase().includes('vip')) {
                    seatButton.classList.add('seat-grid__seat--vip');
                }
            }

            seatButton.onclick = () => editSeat(seat.seatId);
            seatsDiv.appendChild(seatButton);
        });

        rowDiv.appendChild(seatsDiv);
        container.appendChild(rowDiv);
    });
}

// Load seat types
async function loadSeatTypes() {
    try {
        const response = await get('/auditoriums/seat-types');
        if (response.success && response.data) {
            seatTypes = response.data;
            const select = document.getElementById('seat-type');
            const bulkSelect = document.getElementById('bulk-seat-type');
            
            select.innerHTML = '<option value="">Chọn loại ghế</option>';
            bulkSelect.innerHTML = '<option value="">Chọn loại ghế</option>';
            
            seatTypes.forEach(seatType => {
                const option = document.createElement('option');
                option.value = seatType.seatTypeId;
                option.textContent = `${seatType.seatTypeName} (x${seatType.priceMultiplier})`;
                select.appendChild(option.cloneNode(true));
                bulkSelect.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Load seat types error:', error);
    }
}

// Open add seat modal
function openAddSeatModal(seatId = null) {
    if (!currentAuditoriumId) {
        showAlert('Vui lòng chọn phòng chiếu trước', 'error');
        return;
    }

    const modal = document.getElementById('seat-modal');
    const form = document.getElementById('seat-form');
    const title = document.getElementById('seat-modal-title');

    form.reset();
    document.getElementById('seat-id').value = '';
    document.getElementById('seat-auditorium-id').value = currentAuditoriumId;

    if (seatId) {
        title.textContent = 'Sửa ghế';
        loadSeatForEdit(seatId);
    } else {
        title.textContent = 'Thêm ghế';
    }

    modal.classList.add('modal--active');
}

// Close seat modal
function closeSeatModal() {
    const modal = document.getElementById('seat-modal');
    modal.classList.remove('modal--active');
}

// Load seat for edit
async function loadSeatForEdit(seatId) {
    try {
        const seat = currentSeats.find(s => s.seatId === seatId);
        if (seat) {
            document.getElementById('seat-id').value = seat.seatId;
            document.getElementById('seat-row').value = seat.rowLabel;
            document.getElementById('seat-number').value = seat.seatNumber;
            document.getElementById('seat-type').value = seat.seatTypeId;
        }
    } catch (error) {
        console.error('Load seat for edit error:', error);
        showAlert('Lỗi khi tải thông tin ghế', 'error');
    }
}

// Edit seat
function editSeat(seatId) {
    openAddSeatModal(seatId);
}

// Handle seat form submit
document.getElementById('seat-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const seatId = document.getElementById('seat-id').value;
    const auditoriumId = parseInt(document.getElementById('seat-auditorium-id').value);
    const rowLabel = document.getElementById('seat-row').value.trim().toUpperCase();
    const seatNumber = parseInt(document.getElementById('seat-number').value);
    const seatTypeId = parseInt(document.getElementById('seat-type').value);

    if (!rowLabel || !seatNumber || !seatTypeId) {
        showAlert('Vui lòng điền đầy đủ thông tin', 'error');
        return;
    }

    const button = e.target.querySelector('button[type="submit"]');
    button.disabled = true;
    button.textContent = 'Đang lưu...';

    try {
        let response;
        if (seatId) {
            // Update seat
            response = await put(`/auditoriums/seats/${seatId}`, {
                rowLabel: rowLabel,
                seatNumber: seatNumber,
                seatTypeId: seatTypeId
            }, true);
        } else {
            // Create seat
            response = await post(`/auditoriums/${auditoriumId}/seats`, {
                auditoriumId: auditoriumId,
                rowLabel: rowLabel,
                seatNumber: seatNumber,
                seatTypeId: seatTypeId
            }, true);
        }

        if (response.success) {
            showAlert(seatId ? 'Cập nhật ghế thành công' : 'Thêm ghế thành công', 'success');
            closeSeatModal();
            await loadSeats(auditoriumId);
            await loadAuditoriums(); // Refresh capacity
        } else {
            showAlert(response.message || 'Lưu ghế thất bại', 'error');
        }
    } catch (error) {
        console.error('Save seat error:', error);
        showAlert(error.message || 'Lỗi khi lưu ghế', 'error');
    } finally {
        button.disabled = false;
        button.textContent = 'Lưu';
    }
});

// Open bulk add seats modal
function openBulkSeatModal() {
    if (!currentAuditoriumId) {
        showAlert('Vui lòng chọn phòng chiếu trước', 'error');
        return;
    }

    const modal = document.getElementById('bulk-seat-modal');
    const form = document.getElementById('bulk-seat-form');
    form.reset();
    document.getElementById('bulk-seat-auditorium-id').value = currentAuditoriumId;
    modal.classList.add('modal--active');
}

// Close bulk seat modal
function closeBulkSeatModal() {
    const modal = document.getElementById('bulk-seat-modal');
    modal.classList.remove('modal--active');
}

// Handle bulk seat form submit
document.getElementById('bulk-seat-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const auditoriumId = parseInt(document.getElementById('bulk-seat-auditorium-id').value);
    const rowLabel = document.getElementById('bulk-seat-row').value.trim().toUpperCase();
    const startSeat = parseInt(document.getElementById('bulk-seat-start').value);
    const endSeat = parseInt(document.getElementById('bulk-seat-end').value);
    const seatTypeId = parseInt(document.getElementById('bulk-seat-type').value);

    if (!rowLabel || !startSeat || !endSeat || !seatTypeId) {
        showAlert('Vui lòng điền đầy đủ thông tin', 'error');
        return;
    }

    if (startSeat > endSeat) {
        showAlert('Số ghế bắt đầu phải nhỏ hơn số ghế kết thúc', 'error');
        return;
    }

    if (endSeat - startSeat > 50) {
        showAlert('Chỉ có thể tạo tối đa 50 ghế mỗi lần', 'error');
        return;
    }

    const button = e.target.querySelector('button[type="submit"]');
    button.disabled = true;
    button.textContent = 'Đang tạo...';

    try {
        const response = await post(`/auditoriums/${auditoriumId}/seats/bulk`, {
            auditoriumId: auditoriumId,
            rowLabel: rowLabel,
            startSeatNumber: startSeat,
            endSeatNumber: endSeat,
            seatTypeId: seatTypeId
        }, true);

        if (response.success) {
            showAlert(response.message || 'Tạo ghế thành công', 'success');
            closeBulkSeatModal();
            await loadSeats(auditoriumId);
            await loadAuditoriums(); // Refresh capacity
        } else {
            showAlert(response.message || 'Tạo ghế thất bại', 'error');
        }
    } catch (error) {
        console.error('Bulk create seats error:', error);
        showAlert(error.message || 'Lỗi khi tạo ghế', 'error');
    } finally {
        button.disabled = false;
        button.textContent = 'Tạo ghế';
    }
});

// Show alert
function showAlert(message, type) {
    const container = document.getElementById('alert-container');
    container.innerHTML = `<div class="alert alert--${type}">${message}</div>`;
    setTimeout(() => {
        container.innerHTML = '';
    }, 5000);
}

