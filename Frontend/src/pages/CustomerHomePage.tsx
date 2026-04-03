import {
  BellOutlined,
  CalendarOutlined,
  GiftOutlined,
  LeftOutlined,
  PlayCircleOutlined,
  RightOutlined,
  ShoppingCartOutlined,
  StarFilled,
  FireOutlined,
  CheckSquareOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons'
import {
  Button,
  Card,
  Carousel,
  Col,
  Layout,
  Menu,
  Row,
  Skeleton,
  Space,
  Tag,
  Typography,
  message,
} from 'antd'
import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { TopbarSearch } from '../components/common/TopbarSearch'
import { UserDropdown } from '../components/common/UserDropdown'
import { useDebouncedValue } from '../hooks/useDebouncedValue'
import { listMovies } from '../services/movieService'
import type { LoginResponse } from '../types/auth'
import type { Movie } from '../types/movie'
import { mapApiError } from '../utils/error'
import { resolveUploadedPosterUrl } from '../utils/moviePoster'

const { Header, Content, Footer } = Layout

interface CustomerHomePageProps {
  currentUser: LoginResponse
  onLogout: () => void
  routeBase?: string
  staffCounterMode?: boolean
  onBackToAdmin?: () => void
}

const heroSlides = [
  {
    title: 'Bom tấn đang chiếu mỗi ngày',
    subtitle: 'Đặt vé nhanh, chọn ghế trực quan, check-in QR tại rạp.',
  },
  {
    title: 'Không gian giải trí chuẩn cinema',
    subtitle: 'Âm thanh sống động, màn hình lớn, suất chiếu liên tục.',
  },
  {
    title: 'Ưu đãi đặc biệt cho khách hàng thân thiết',
    subtitle: 'Theo dõi lịch chiếu đông khách và đặt vé sớm để có ghế đẹp.',
  },
]

const allHeroBanners = [
  '/hero-banners/Avenger_endGame.jpg',
  '/hero-banners/Doraemon_Movie.jpg',
  '/hero-banners/Spider-Man_HomeComing.jpg',
  '/hero-banners/SpyXFamily.jpg',
  '/hero-banners/Thanh_Guom_Diet_Quy.png',
  '/hero-banners/Anh_duong_cua_me.jpg',
  '/hero-banners/Dich_vu_giao_hang_cua_phu_thuy_Kiki.webp',
  '/hero-banners/Super_Mario_thien_ha.jpg',
  '/hero-banners/Tai.jpg',
]

function resolveHeroBanner(movie: Movie): string {
  const n = movie.name.toLowerCase()
  if (n.includes('doraemon') || n.includes('đôrêmon')) return '/hero-banners/Doraemon_Movie.jpg'
  if (n.includes('spider')) return '/hero-banners/Spider-Man_HomeComing.jpg'
  if (n.includes('avengers') || n.includes('avenger')) return '/hero-banners/Avenger_endGame.jpg'
  if (n.includes('spy x family') || n.includes('spy family')) return '/hero-banners/SpyXFamily.jpg'
  if (n.includes('thanh gươm') || n.includes('demon slayer')) return '/hero-banners/Thanh_Guom_Diet_Quy.png'
  if (n.includes('ánh dương') || n.includes('anh duong') || n.includes('của mẹ')) return '/hero-banners/Anh_duong_cua_me.jpg'
  if (n.includes('kiki') || n.includes('phù thủy') || n.includes('giao hàng')) return '/hero-banners/Dich_vu_giao_hang_cua_phu_thuy_Kiki.webp'
  if (n.includes('mario')) return '/hero-banners/Super_Mario_thien_ha.jpg'
  if (n.includes('tai') || n.includes('tài')) return '/hero-banners/Tai.jpg'
  return allHeroBanners[movie.id % allHeroBanners.length]
}

function resolvePoster(movie: Movie): string {
  const uploaded = resolveUploadedPosterUrl(movie.posterUrl)
  if (uploaded) return uploaded
  const normalized = movie.name.toLowerCase()
  if (normalized.includes('avengers')) return '/posters/Avengers_Endgame.jpg'
  if (normalized.includes('doraemon')) return '/posters/Doraemon_Movie.jpg'
  return allHeroBanners[movie.id % allHeroBanners.length]
}

const promoCards = [
  {
    title: 'Combo bắp nước ưu đãi 30%',
    desc: 'Áp dụng khung giờ 10:00 - 16:00 từ thứ 2 đến thứ 5.',
    image: '/posters/promo-combo.svg',
  },
  {
    title: 'Vé cặp đôi cuối tuần',
    desc: 'Đặt 2 ghế liền kề, giảm ngay 20% tổng hóa đơn.',
    image: '/posters/promo-couple.svg',
  },
  {
    title: 'Thành viên mới nhận voucher',
    desc: 'Đăng ký tài khoản và nhận voucher 50.000 VND.',
    image: '/posters/promo-member.svg',
  },
]

const businessSections = [
  {
    title: 'Đặt vé siêu tốc',
    desc: 'Tìm phim, chọn suất, thanh toán và nhận QR trong một luồng xử lý mượt mà.',
    icon: <ShoppingCartOutlined />,
  },
  {
    title: 'Lịch chiếu AI',
    desc: 'Gợi ý suất chiếu đông khách và khung giờ vàng phù hợp theo nhu cầu của bạn.',
    icon: <CalendarOutlined />,
  },
  {
    title: 'Khuyến mãi Real-time',
    desc: 'Bùng nổ ưu đãi độc quyền cập nhật theo event, phân hạng thành viên.',
    icon: <GiftOutlined />,
  },
  {
    title: 'Thông báo VIP',
    desc: 'Nhận thông báo khi siêu phẩm sắp khởi chiếu để săn ghế đôi VIP.',
    icon: <BellOutlined />,
  },
]



export function CustomerHomePage({
  currentUser,
  onLogout,
  routeBase = '',
  staffCounterMode = false,
  onBackToAdmin,
}: CustomerHomePageProps) {
  const navigate = useNavigate()
  const base = routeBase.replace(/\/$/, '')
  const movieBookingPath = (movieId: number) => (base ? `${base}/phim/${movieId}` : `/phim/${movieId}`)
  const [searchParams] = useSearchParams()
  const [searchInput, setSearchInput] = useState(() => searchParams.get('q') ?? '')
  const debouncedSearch = useDebouncedValue(searchInput, 380)
  const [movies, setMovies] = useState<Movie[]>([])
  const [loading, setLoading] = useState(true)
  const [activeMenu, setActiveMenu] = useState('')
  const [api, contextHolder] = message.useMessage()
  const scrollNowRef = useRef<HTMLDivElement>(null)
  const scrollUpcomingRef = useRef<HTMLDivElement>(null)

  function scrollSection(ref: React.RefObject<HTMLDivElement | null>, dir: 'left' | 'right') {
    if (ref.current) {
      ref.current.scrollBy({ left: dir === 'right' ? 360 : -360, behavior: 'smooth' })
    }
  }
  const [isScrolled, setIsScrolled] = useState(false)

  const qParam = searchParams.get('q') ?? ''
  useEffect(() => {
    setSearchInput(qParam)
  }, [qParam])

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    async function loadMovies() {
      setLoading(true)
      try {
        const kw = debouncedSearch.trim()
        const data = await listMovies(kw ? { keyword: kw } : undefined)
        setMovies(data)
      } catch (error) {
        const detail = mapApiError(error)
        api.error(detail.message)
      } finally {
        setLoading(false)
      }
    }
    void loadMovies()
  }, [debouncedSearch, api])

  function handleMenuClick(sectionId: string) {
    setActiveMenu(sectionId)
    const el = document.getElementById(sectionId)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  const upcomingMovies = movies.slice(0, 5).map((movie, idx) => ({
    ...movie,
    releaseText: `Khởi chiếu sau ${idx + 3} ngày`,
  }))
  const topRevenueMovies = [...movies]
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 7)
    .map((movie, idx) => ({
      ...movie,
      revenue: `${(2.1 - idx * 0.25).toFixed(2)} tỷ`,
    }))

  return (
    <Layout className="customer-layout cinematic-theme">
      {contextHolder}

      {/* ═══ STAFF COUNTER KIOSK MODE ═══ */}
      {staffCounterMode ? (
        <>
          {/* Kiosk Header */}
          <Header className="customer-header cinematic-header solid" style={{ zIndex: 100 }}>
            <div className="customer-header-left">
              <div className="counter-badge">
                <span className="counter-live-dot" />
                QUẦY BÁN VÉ
              </div>
              <div className="brand-block" style={{ cursor: 'pointer' }} onClick={() => handleMenuClick('hero')}>
                <img src="/icons/cinema.svg" alt="Cinema logo" width={32} height={32} className="brand-glow" />
                <Typography.Title level={4} style={{ margin: 0, color: '#fff' }}>
                  CineStar<span style={{ color: '#5b7cff' }}>EX</span>
                </Typography.Title>
              </div>
              <TopbarSearch
                placeholder="Tìm phim nhanh..."
                value={searchInput}
                onChange={setSearchInput}
                onEnter={() => handleMenuClick('phim-dang-chieu')}
              />
            </div>
            <UserDropdown
              username={currentUser.username}
              role={currentUser.role}
              onLogout={onLogout}
              onBackToAdmin={onBackToAdmin}
            />
          </Header>

          {/* Kiosk Body */}
          <Content className="customer-content" style={{ padding: '90px 40px 40px', minHeight: '100vh', position: 'relative' }}>
            <div className="ambient-orbs" style={{ zIndex: 0 }}>
              <div className="orb blue-orb" />
              <div className="orb purple-orb" />
            </div>
            <div style={{ position: 'relative', zIndex: 1 }}>
              {/* Kiosk Title */}
              <div className="kiosk-section-header">
                <div>
                  <Typography.Title level={2} className="gradient-text" style={{ marginBottom: 4 }}>
                    CHỌN PHIM
                  </Typography.Title>
                  <Typography.Text style={{ color: '#8ea8ff' }}>
                    {debouncedSearch.trim()
                      ? `Tìm thấy ${movies.length} phim cho "${debouncedSearch.trim()}"`
                      : `${movies.length} phim đang chiếu — nhấn để chọn suất và ghế ngồi`}
                  </Typography.Text>
                </div>
                <div className="kiosk-time-display">
                  <ClockCircleOutlined style={{ marginRight: 8, color: '#5b7cff' }} />
                  {new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>

              {/* Kiosk Movie Grid */}
              <div className="kiosk-movie-grid">
                {loading
                  ? Array.from({ length: 8 }).map((_, idx) => (
                      <Card className="glow-card" key={idx} bordered={false}>
                        <Skeleton active paragraph={{ rows: 3 }} />
                      </Card>
                    ))
                  : movies.length === 0 ? (
                      <div className="empty-state-cyber" style={{ gridColumn: '1 / -1' }}>
                        Không tìm thấy phim nào.
                      </div>
                    )
                  : movies.map((movie) => (
                      <div
                        key={movie.id}
                        className="kiosk-movie-card"
                        onClick={() => navigate(movieBookingPath(movie.id))}
                      >
                        {/* Poster */}
                        <div className="kiosk-poster" style={{ backgroundImage: `url(${resolvePoster(movie)})` }}>
                          <div className="kiosk-poster-overlay">
                            <PlayCircleOutlined className="kiosk-play-icon" />
                          </div>
                        </div>
                        {/* Info */}
                        <div className="kiosk-movie-info">
                          <div className="kiosk-movie-name">{movie.name}</div>
                          <div className="kiosk-movie-meta">
                            <span className="kiosk-genre-tag">{movie.genre}</span>
                            <span className="kiosk-duration"><ClockCircleOutlined style={{ marginRight: 4 }} />{movie.durationMinutes} phút</span>
                          </div>
                          <div className="kiosk-rating">
                            <StarFilled style={{ color: '#ffb200', marginRight: 4 }} />
                            <span>{Math.min(5, Number(movie.rating)).toFixed(1)}</span>
                          </div>
                          <Button type="primary" block className="btn-glow-primary kiosk-book-btn" onClick={(e) => { e.stopPropagation(); navigate(movieBookingPath(movie.id)) }}>
                            CHỌN PHIM NÀY
                          </Button>
                        </div>
                      </div>
                    ))}
              </div>
            </div>
          </Content>
        </>
      ) : (
        <>
      <Header className={`customer-header cinematic-header ${isScrolled ? 'solid' : 'transparent'}`}>
        <div className="customer-header-left">
          <div className="brand-block" style={{ cursor: 'pointer' }} onClick={() => handleMenuClick('hero')}>
            <img src="/icons/cinema.svg" alt="Cinema logo" width={38} height={38} className="brand-glow" />
            <Typography.Title level={4} style={{ margin: 0, color: '#fff' }} className="brand-text">
              CineStar<span style={{ color: '#5b7cff' }}>EX</span>
            </Typography.Title>
          </div>
          <Menu
            mode="horizontal"
            selectedKeys={[activeMenu]}
            className="customer-menu"
            items={[
              { key: 'phim-dang-chieu', label: 'XEM PHIM' },
              { key: 'phim-top-doanh-thu', label: 'HOT NHẤT' },
              { key: 'nghiep-vu', label: 'DỊCH VỤ' },
              { key: 'uu-dai', label: 'VOUCHER VIP' },
            ]}
            onClick={(info) => handleMenuClick(info.key)}
          />
          <TopbarSearch
            placeholder="Tìm siêu phẩm..."
            value={searchInput}
            onChange={setSearchInput}
            onEnter={() => handleMenuClick('phim-dang-chieu')}
          />
        </div>

        <UserDropdown
          username={currentUser.username}
          role={currentUser.role}
          onLogout={onLogout}
          onMyTickets={staffCounterMode ? undefined : () => navigate('/ve-cua-toi')}
          onBackToAdmin={staffCounterMode && onBackToAdmin ? onBackToAdmin : undefined}
        />
      </Header>

      <Content className="customer-content full-width">
        {/* Full-width massive hero section */}
        <section id="hero" className="hero-cinematic-banner">
          {movies.length > 0 ? (
            <Carousel autoplay effect="fade" pauseOnHover={false} speed={800} autoplaySpeed={5000} dots={{ className: 'hero-dots' }}>
              {[...movies].sort((a, b) => b.rating - a.rating).slice(0, 5).map((movie) => (
                <div key={`hero-slide-${movie.id}`}>
                  <div 
                    className="hero-slide-bg"
                    style={{ backgroundImage: `url(${resolveHeroBanner(movie)})` }}
                  >
                    <div className="hero-overlay-dark">
                      <div className="hero-content">
                        <Space size="middle" className="hero-tags-wrapper" style={{ marginBottom: 10 }}>
                          <Tag className="hero-tag pulse-glow" color="#f50">
                            <FireOutlined /> TOP THỊNH HÀNH
                          </Tag>
                          <Tag className="hero-tag cyber-tag" color="cyan">
                            4K IMAX
                          </Tag>
                          <Tag className="hero-tag outline-tag">
                            {movie.genre}
                          </Tag>
                          <Tag className="hero-tag outline-tag">
                            <ClockCircleOutlined style={{ marginRight: 4 }}/> {movie.durationMinutes} phút
                          </Tag>
                          <Tag className="hero-tag rating-tag" color="#ffb200">
                            ★ {Math.min(5, Number(movie.rating)).toFixed(1)}
                          </Tag>
                        </Space>
                        <Typography.Title className="hero-title">{movie.name}</Typography.Title>
                        <Space size="large" className="hero-actions">
                          <Button type="primary" size="large" className="btn-glow-primary" onClick={() => navigate(movieBookingPath(movie.id))}>
                            Đặt Vé Ngay <PlayCircleOutlined />
                          </Button>
                          <Button size="large" className="btn-glass" onClick={() => handleMenuClick('uu-dai')}>
                            Xem Ưu Đãi
                          </Button>
                        </Space>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </Carousel>
          ) : (
            <Carousel autoplay effect="fade" pauseOnHover={false} speed={800} autoplaySpeed={5000}>
              {heroSlides.map((slide, idx) => (
                <div key={slide.title}>
                  <div 
                    className="hero-slide-bg"
                    style={{ backgroundImage: `url(${allHeroBanners[idx % allHeroBanners.length]})` }}
                  >
                    <div className="hero-overlay-dark">
                      <div className="hero-content">
                        <Tag className="hero-tag pulse-glow"><FireOutlined /> Now Showing</Tag>
                        <Typography.Title className="hero-title">{slide.title}</Typography.Title>
                        <Typography.Paragraph className="hero-subtitle">{slide.subtitle}</Typography.Paragraph>
                        <Space size="large" className="hero-actions">
                          <Button type="primary" size="large" className="btn-glow-primary" onClick={() => handleMenuClick('phim-dang-chieu')}>
                            Khám Phá <PlayCircleOutlined />
                          </Button>
                        </Space>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </Carousel>
          )}
          <div className="bottom-fader"></div>
        </section>

        {/* Floating Ambient Lighting */}
        <div className="ambient-orbs">
          <div className="orb blue-orb"></div>
          <div className="orb purple-orb"></div>
        </div>

        <div className="container-centered">
          <section className="section-spacing section-relative" id="phim-dang-chieu">
            <Space orientation="vertical" size={0} className="cinematic-section-header">
              <Typography.Title level={2} className="gradient-text">PHIM ĐANG CHIẾU</Typography.Title>
              <Typography.Text className="section-subtitle">Tận hưởng những giây phút choáng ngợp tại rạp.</Typography.Text>
              {debouncedSearch.trim() && (
                <Typography.Text style={{ color: '#00e5ff', marginTop: '10px', display: 'block' }}>
                  Tìm thấy {movies.length} phim cho "{debouncedSearch.trim()}"
                </Typography.Text>
              )}
            </Space>

            <div className="horizontal-section-wrapper">
              <Button className="scroll-btn-left" icon={<LeftOutlined />} onClick={() => scrollSection(scrollNowRef, 'left')} />
              <div className="horizontal-scroll-container hide-scrollbar" ref={scrollNowRef}>
                {loading
                  ? Array.from({ length: 6 }).map((_, idx) => (
                      <div className="horizontal-card-wrapper" style={{ width: 220 }} key={idx}>
                        <Card className="glow-card" bordered={false} style={{ height: 340 }}>
                          <Skeleton active paragraph={{ rows: 4 }} />
                        </Card>
                      </div>
                    ))
                  : movies.length === 0 ? (
                      <div className="empty-state-cyber" style={{ width: '100%' }}>
                        Không tìm thấy siêu phẩm nào phù hợp. Bạn hãy thử tìm tên khác!
                      </div>
                    )
                  : movies.map((movie) => (
                      <div className="horizontal-card-wrapper" style={{ width: 220 }} key={movie.id}>
                        <Card className="glow-card movie-card-3d" bordered={false} style={{ height: '100%' }}>
                          <div className="poster-container">
                            <div
                              className="movie-poster"
                              style={{ backgroundImage: `url(${resolvePoster(movie)})` }}
                            />
                            <div className="poster-overlay">
                              <PlayCircleOutlined className="play-icon-large" />
                            </div>
                          </div>
                          <div className="card-content">
                            <Typography.Title level={4} className="movie-title">{movie.name}</Typography.Title>
                            <Space className="movie-meta" split={<span style={{ color: '#445' }}>•</span>}>
                              <span>{movie.genre}</span>
                              <span>{movie.durationMinutes} phút</span>
                            </Space>
                            <div className="movie-rating-row">
                              <StarFilled className="star-icon" />
                              <span className="rating-score">{Math.min(5, Number(movie.rating)).toFixed(1)}</span>
                            </div>
                            <Button type="primary" block className="btn-glow-small" onClick={() => navigate(movieBookingPath(movie.id))}>
                              MUA VÉ NGAY
                            </Button>
                          </div>
                        </Card>
                      </div>
                    ))}
              </div>
              <Button className="scroll-btn-right" icon={<RightOutlined />} onClick={() => scrollSection(scrollNowRef, 'right')} />
            </div>
          </section>

          <section className="section-spacing section-relative" id="phim-top-doanh-thu">
            <Space orientation="vertical" size={0} className="cinematic-section-header">
              <Typography.Title level={2} className="gradient-text gold">TOP DOANH THU</Typography.Title>
              <Typography.Text className="section-subtitle">Đỉnh cao phòng vé tuần qua.</Typography.Text>
            </Space>

            <div className="ranking-table">
              {/* Header */}
              <div className="ranking-header">
                <span className="rank-col">HẠNG</span>
                <span className="movie-col">PHIM</span>
                <span className="genre-col">THỂ LOẠI</span>
                <span className="rating-col">ĐIỂM</span>
                <span className="revenue-col">DOANH THU</span>
              </div>
              {topRevenueMovies.map((movie, idx) => (
                <div
                  key={`top-${movie.id}`}
                  className={`ranking-row ${idx === 0 ? 'rank-1' : idx === 1 ? 'rank-2' : idx === 2 ? 'rank-3' : ''}`}
                  onClick={() => navigate(movieBookingPath(movie.id))}
                  style={{ cursor: 'pointer' }}
                >
                  {/* Rank badge */}
                  <span className="rank-col">
                    <span className={`rank-number rank-${idx + 1}`}>
                      {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                    </span>
                  </span>

                  {/* Poster + Name */}
                  <span className="movie-col">
                    <div className="ranking-poster" style={{ backgroundImage: `url(${resolvePoster(movie)})` }} />
                    <div className="ranking-movie-info">
                      <div className="ranking-movie-name">{movie.name}</div>
                      <div className="ranking-movie-duration">{movie.durationMinutes} phút</div>
                    </div>
                  </span>

                  {/* Genre */}
                  <span className="genre-col">
                    <span className="ranking-genre-tag">{movie.genre}</span>
                  </span>

                  {/* Rating */}
                  <span className="rating-col">
                    <span className="ranking-rating">
                      <StarFilled style={{ marginRight: 4, color: '#ffb200' }} />
                      {movie.rating.toFixed(1)}
                    </span>
                  </span>

                  {/* Revenue */}
                  <span className="revenue-col">
                    <span className="ranking-revenue">{movie.revenue}</span>
                  </span>
                </div>
              ))}
            </div>
          </section>


          <section className="section-spacing section-relative" id="phim-sap-chieu">
            <Space orientation="vertical" size={0} className="cinematic-section-header">
              <Typography.Title level={2} className="gradient-text purple">SẮP KHỞI CHIẾU</Typography.Title>
              <Typography.Text className="section-subtitle">Lên lịch ngay, không bỏ lỡ siêu phẩm.</Typography.Text>
            </Space>

            <div className="horizontal-section-wrapper">
              <Button className="scroll-btn-left" icon={<LeftOutlined />} onClick={() => scrollSection(scrollUpcomingRef, 'left')} />
              <div className="horizontal-scroll-container hide-scrollbar" ref={scrollUpcomingRef}>
                {upcomingMovies.map((movie) => (
                  <div className="horizontal-card-wrapper" key={`upcoming-${movie.id}`}>
                    <Card className="glow-card horizontal-movie-card purple-glow" bordered={false}>
                      <div className="movie-poster" style={{ backgroundImage: `url(${resolvePoster(movie)})` }} />
                      <div className="horizontal-card-body">
                        <Typography.Title level={5} className="movie-title-small">{movie.name}</Typography.Title>
                        <Typography.Text className="purple-text">{movie.releaseText}</Typography.Text>
                      </div>
                    </Card>
                  </div>
                ))}
              </div>
              <Button className="scroll-btn-right" icon={<RightOutlined />} onClick={() => scrollSection(scrollUpcomingRef, 'right')} />
            </div>
          </section>

          <section className="section-spacing section-relative" id="nghiep-vu">
             <Space orientation="vertical" size={0} className="cinematic-section-header">
              <Typography.Title level={2} className="gradient-text cyan">HỆ SINH THÁI DỊCH VỤ</Typography.Title>
              <Typography.Text className="section-subtitle">Vượt mọi rào cản, đặt vé chỉ trong tích tắc.</Typography.Text>
            </Space>

            <Row gutter={[24, 24]}>
              {businessSections.map((section) => (
                <Col xs={24} sm={12} key={section.title}>
                  <Card className="cyber-feature-card" bordered={false}>
                    <div className="feature-icon-wrapper">{section.icon}</div>
                    <div className="feature-content">
                      <Typography.Title level={4} className="feature-title">
                        {section.title}
                      </Typography.Title>
                      <Typography.Text className="feature-desc">{section.desc}</Typography.Text>
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>
          </section>

          <section className="section-spacing section-relative" id="uu-dai">
             <Space orientation="vertical" size={0} className="cinematic-section-header">
              <Typography.Title level={2} className="gradient-text pink">VOUCHER VIP</Typography.Title>
            </Space>

            <Row gutter={[24, 24]}>
              {promoCards.map((promo) => (
                <Col xs={24} md={8} key={promo.title}>
                  <Card className="glass-promo-card" bordered={false}>
                    <div className="promo-img-wrapper">
                      <img src={promo.image} alt={promo.title} />
                    </div>
                    <div className="promo-body">
                      <Typography.Title level={4} className="promo-title">{promo.title}</Typography.Title>
                      <Typography.Text className="promo-desc">{promo.desc}</Typography.Text>
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>
          </section>

        </div>
      </Content>

      <Footer className="customer-footer cinematic-footer">
        <div className="business-footer glass-footer">
          <Row gutter={[30, 30]}>
            <Col xs={24} md={8}>
              <Space orientation="vertical" size={16}>
                <div className="brand-block">
                  <img src="/icons/cinema.svg" alt="Cinema logo" width={40} height={40} className="brand-glow" />
                  <Typography.Title level={4} style={{ margin: 0, color: '#fff' }}>
                    CineStar<span style={{ color: '#5b7cff' }}>EX</span>
                  </Typography.Title>
                </div>
                <Typography.Text className="footer-mute-text">
                  Khai tử sự nhàm chán. CineStarEx tái định nghĩa không gian đặt vé phim với trải nghiệm hình ảnh tuyệt mỹ và tốc độ không đối thủ.
                </Typography.Text>
              </Space>
            </Col>

            <Col xs={24} md={8}>
              <Space orientation="vertical" size={12}>
                <Typography.Title level={5} className="footer-heading">
                  Tổng Đài Hologram
                </Typography.Title>
                <Typography.Text className="footer-mute-text">Hotline 24/7: 1900 1234</Typography.Text>
                <Typography.Text className="footer-mute-text">Support: hotro@cinestarex.io</Typography.Text>
                <Space size={8} wrap style={{ marginTop: 10 }}>
                  <Tag className="cyber-tag">Bảo Mật Ánh Sáng</Tag>
                  <Tag className="cyber-tag">Luật Vũ Trụ</Tag>
                </Space>
              </Space>
            </Col>

            <Col xs={24} md={8}>
              <Space orientation="vertical" size={16} style={{ width: '100%' }}>
                <Typography.Title level={5} className="footer-heading">
                  Mạng Lưới Thần Kinh
                </Typography.Title>
                <Space size={16}>
                  <Button shape="circle" icon={<StarFilled />} className="social-btn" />
                  <Button shape="circle" icon={<CheckSquareOutlined />} className="social-btn" />
                  <Button shape="circle" icon={<BellOutlined />} className="social-btn" />
                </Space>
              </Space>
            </Col>
          </Row>

          <div className="footer-bottom">
            <Typography.Text className="footer-mute-text text-center" style={{ display: 'block' }}>
              © {new Date().getFullYear()} CineStarEX. The future of cinema ticketing.
            </Typography.Text>
          </div>
        </div>
      </Footer>
        </>
      )}
    </Layout>
  )
}
