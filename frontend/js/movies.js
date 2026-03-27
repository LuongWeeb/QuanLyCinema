let currentPage = 1;
let pageSize = 12;
let currentSearch = '';
let currentGenreId = null;

// Load movies
async function loadMovies(page = 1) {
    currentPage = page;
    const container = document.getElementById('movies-container');
    const loading = document.getElementById('loading');
    const pagination = document.getElementById('pagination');

    container.innerHTML = '';
    loading.classList.remove('hidden');

    try {
        const params = new URLSearchParams({
            pageIndex: page,
            pageSize: pageSize
        });

        if (currentSearch) {
            params.append('search', currentSearch);
        }

        if (currentGenreId) {
            params.append('genreId', currentGenreId);
        }

        const response = await get(`/movies?${params.toString()}`);

        if (response.success && response.data) {
            const { items, totalItems, totalPages } = response.data;

            if (items.length === 0) {
                container.innerHTML = '<p class="text-center">Không tìm thấy phim nào.</p>';
            } else {
                items.forEach(movie => {
                    container.appendChild(createMovieCard(movie));
                });
            }

            renderPagination(totalPages, page);
        } else {
            container.innerHTML = '<p class="alert alert--error">Lỗi khi tải danh sách phim.</p>';
        }
    } catch (error) {
        console.error('Load movies error:', error);
        container.innerHTML = '<p class="alert alert--error">Lỗi khi tải danh sách phim.</p>';
    } finally {
        loading.classList.add('hidden');
    }
}

// Create movie card
function createMovieCard(movie) {
    const card = document.createElement('div');
    card.className = 'movie-card';
    card.onclick = () => {
        window.location.href = `movie-detail.html?id=${movie.movieId}`;
    };

    const poster = movie.posterUrl 
        ? `<img src="${movie.posterUrl}" alt="${movie.title}" class="movie-card__poster" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'300\' height=\'450\'%3E%3Crect fill=\'%23141414\' width=\'300\' height=\'450\'/%3E%3Ctext fill=\'%23ffffff\' x=\'50%25\' y=\'50%25\' text-anchor=\'middle\' dy=\'.3em\'%3ENo Image%3C/text%3E%3C/svg%3E'">`
        : `<div class="movie-card__poster" style="background-color: var(--bg-secondary); display: flex; align-items: center; justify-content: center; color: var(--text-secondary);">No Image</div>`;

    card.innerHTML = `
        ${poster}
        <div class="movie-card__body">
            <h3 class="movie-card__title">${movie.title}</h3>
            <div class="movie-card__meta">
                <span class="movie-card__rating">${movie.imdbRating ? `⭐ ${movie.imdbRating}` : 'N/A'}</span>
                <span class="movie-card__duration">${movie.durationMinutes} phút</span>
            </div>
            <p class="movie-card__description text-secondary" style="font-size: 0.875rem; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;">
                ${movie.description || 'Không có mô tả'}
            </p>
        </div>
    `;

    return card;
}

// Load genres
async function loadGenres() {
    try {
        const response = await get('/movies/genres');
        if (response.success && response.data) {
            renderGenreFilter(response.data);
        }
    } catch (error) {
        console.error('Load genres error:', error);
    }
}

// Render genre filter
function renderGenreFilter(genres) {
    const container = document.getElementById('genres-filter');
    container.innerHTML = '';

    const allButton = document.createElement('button');
    allButton.className = 'btn btn--outline btn--small';
    allButton.textContent = 'Tất cả';
    allButton.onclick = () => {
        currentGenreId = null;
        loadMovies(1);
        updateActiveGenreButton(allButton);
    };
    container.appendChild(allButton);

    genres.forEach(genre => {
        const button = document.createElement('button');
        button.className = 'btn btn--outline btn--small';
        button.textContent = genre.genreName;
        button.onclick = () => {
            currentGenreId = genre.genreId;
            loadMovies(1);
            updateActiveGenreButton(button);
        };
        container.appendChild(button);
    });
}

function updateActiveGenreButton(activeButton) {
    document.querySelectorAll('#genres-filter button').forEach(btn => {
        btn.classList.remove('btn--primary');
        btn.classList.add('btn--outline');
    });
    activeButton.classList.remove('btn--outline');
    activeButton.classList.add('btn--primary');
}

// Render pagination
function renderPagination(totalPages, currentPage) {
    const container = document.getElementById('pagination');
    container.innerHTML = '';

    if (totalPages <= 1) return;

    const prevButton = document.createElement('button');
    prevButton.className = 'btn btn--outline';
    prevButton.textContent = 'Trước';
    prevButton.disabled = currentPage === 1;
    prevButton.onclick = () => loadMovies(currentPage - 1);
    container.appendChild(prevButton);

    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) {
            const button = document.createElement('button');
            button.className = `btn ${i === currentPage ? 'btn--primary' : 'btn--outline'}`;
            button.textContent = i;
            button.onclick = () => loadMovies(i);
            container.appendChild(button);
        } else if (i === currentPage - 3 || i === currentPage + 3) {
            const span = document.createElement('span');
            span.textContent = '...';
            span.style.padding = '0.5rem';
            container.appendChild(span);
        }
    }

    const nextButton = document.createElement('button');
    nextButton.className = 'btn btn--outline';
    nextButton.textContent = 'Sau';
    nextButton.disabled = currentPage === totalPages;
    nextButton.onclick = () => loadMovies(currentPage + 1);
    container.appendChild(nextButton);
}

// Search handler
if (document.getElementById('search-input')) {
    let searchTimeout;
    document.getElementById('search-input').addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            currentSearch = e.target.value;
            loadMovies(1);
        }, 500);
    });
}

