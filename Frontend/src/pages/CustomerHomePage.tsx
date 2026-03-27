import {
  BellOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  GiftOutlined,
  PlayCircleOutlined,
  QrcodeOutlined,
  SafetyCertificateOutlined,
  ShoppingCartOutlined,
  StarFilled,
} from '@ant-design/icons'
import {
  Button,
  Card,
  Carousel,
  Col,
  Collapse,
  Layout,
  Menu,
  Row,
  Skeleton,
  Space,
  Tag,
  Typography,
  message,
} from 'antd'
import { useEffect, useState } from 'react'
import { TopbarSearch } from '../components/common/TopbarSearch'
import { UserDropdown } from '../components/common/UserDropdown'
import { getNowShowingMovies } from '../services/movieService'
import type { LoginResponse } from '../types/auth'
import type { Movie } from '../types/movie'
import { mapApiError } from '../utils/error'

const { Header, Content, Footer } = Layout

interface CustomerHomePageProps {
  currentUser: LoginResponse
  onLogout: () => void
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

const posterImages = [
  '/posters/Avengers_Endgame.jpg',
  '/posters/Doraemon_Movie.jpg',
  '/posters/poster-sci-fi.svg',
  '/posters/poster-animation.svg',
]

function resolvePoster(movie: Movie): string {
  const normalized = movie.name.toLowerCase()
  if (normalized.includes('avengers')) return '/posters/Avengers_Endgame.jpg'
  if (normalized.includes('doraemon')) return '/posters/Doraemon_Movie.jpg'
  return posterImages[movie.id % posterImages.length]
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
    title: 'Đặt vé nhanh',
    desc: 'Tìm phim, chọn suất, thanh toán và nhận QR trong một luồng xử lý.',
    icon: <ShoppingCartOutlined />,
  },
  {
    title: 'Lịch chiếu thông minh',
    desc: 'Gợi ý suất chiếu đông khách và khung giờ phù hợp theo nhu cầu.',
    icon: <CalendarOutlined />,
  },
  {
    title: 'Khuyến mãi theo mùa',
    desc: 'Cập nhật ưu đãi realtime theo event, đối tượng và vai trò thành viên.',
    icon: <GiftOutlined />,
  },
  {
    title: 'Thông báo sự kiện',
    desc: 'Nhận thông báo khi phim mới sắp khởi chiếu hoặc có ưu đãi hot.',
    icon: <BellOutlined />,
  },
]

const faqItems = [
  {
    key: '1',
    label: 'Tôi có thể đổi ghế sau khi thanh toán không?',
    children:
      'Bạn có thể đổi ghế trước giờ chiếu tối thiểu 30 phút thông qua mục lịch sử đặt vé hoặc liên hệ quầy hỗ trợ.',
  },
  {
    key: '2',
    label: 'Nếu QR code bị lỗi thì xử lý thế nào?',
    children:
      'Bạn vui lòng đưa mã đơn hàng tại quầy vé. Nhân viên sẽ xác thực vé và hỗ trợ check-in thủ công.',
  },
  {
    key: '3',
    label: 'Có hỗ trợ thanh toán nào?',
    children:
      'Hệ thống hỗ trợ thẻ ngân hàng, ví điện tử và thanh toán tại quầy đối với một số suất chiếu.',
  },
]

export function CustomerHomePage({ currentUser, onLogout }: CustomerHomePageProps) {
  const [movies, setMovies] = useState<Movie[]>([])
  const [loading, setLoading] = useState(true)
  const [activeMenu, setActiveMenu] = useState('phim-dang-chieu')
  const [api, contextHolder] = message.useMessage()

  useEffect(() => {
    async function loadMovies() {
      setLoading(true)
      try {
        const data = await getNowShowingMovies()
        setMovies(data)
      } catch (error) {
        const detail = mapApiError(error)
        api.error(detail.message)
      } finally {
        setLoading(false)
      }
    }

    void loadMovies()
  }, [api])

  function handleMenuClick(sectionId: string) {
    setActiveMenu(sectionId)
    const el = document.getElementById(sectionId)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  const updatedMovies = [...movies].sort((a, b) => b.id - a.id).slice(0, 4)
  const upcomingMovies = movies.slice(0, 4).map((movie, idx) => ({
    ...movie,
    releaseText: `Khởi chiếu sau ${idx + 3} ngày`,
  }))
  const topRevenueMovies = [...movies]
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 4)
    .map((movie, idx) => ({
      ...movie,
      revenue: `${(2.1 - idx * 0.25).toFixed(2)} tỷ`,
    }))

  return (
    <Layout className="customer-layout">
      {contextHolder}
      <Header className="customer-header">
        <div className="customer-header-left">
          <div className="brand-block">
            <img src="/icons/cinema.svg" alt="Cinema logo" width={36} height={36} />
            <Typography.Title level={4} style={{ margin: 0, color: '#fff' }}>
              CineStar Experience
            </Typography.Title>
          </div>
          <Menu
            mode="horizontal"
            selectedKeys={[activeMenu]}
            className="customer-menu"
            items={[
              { key: 'phim-dang-chieu', label: 'Phim đang chiếu' },
              { key: 'phim-moi-cap-nhat', label: 'Mới cập nhật' },
              { key: 'phim-sap-chieu', label: 'Sắp chiếu' },
              { key: 'phim-top-doanh-thu', label: 'Top doanh thu' },
              { key: 'nghiep-vu', label: 'Nghiệp vụ' },
              { key: 'uu-dai', label: 'Ưu đãi' },
              { key: 'ho-tro', label: 'Hỗ trợ' },
            ]}
            onClick={(info) => handleMenuClick(info.key)}
          />
          <TopbarSearch placeholder="Tìm kiếm phim..." />
        </div>

        <UserDropdown username={currentUser.username} role={currentUser.role} onLogout={onLogout} />
      </Header>

      <Content className="customer-content">
        <section className="section-spacing" id="hero">
          <Carousel autoplay dots>
            {heroSlides.map((slide) => (
              <div key={slide.title}>
                <div className="hero-slide">
                  <Typography.Title level={2} style={{ color: '#fff', marginBottom: 8 }}>
                    {slide.title}
                  </Typography.Title>
                  <Typography.Paragraph style={{ color: '#c5d3ff', fontSize: 16, marginBottom: 0 }}>
                    {slide.subtitle}
                  </Typography.Paragraph>
                </div>
              </div>
            ))}
          </Carousel>
        </section>

        <section className="section-spacing" id="phim-dang-chieu">
          <Space orientation="vertical" size={4} className="section-header">
            <Tag color="blue">Trang chủ</Tag>
            <Typography.Title level={3} style={{ color: '#fff', margin: 0 }}>
              Phim đang chiếu
            </Typography.Title>
            <Typography.Text style={{ color: '#9fb3ff' }}>
              Cập nhật theo lịch phim hiện tại tại rạp.
            </Typography.Text>
          </Space>

          <Row gutter={[16, 16]}>
            {loading
              ? Array.from({ length: 6 }).map((_, idx) => (
                  <Col xs={24} sm={12} md={8} key={idx}>
                    <Card className="cinema-card">
                      <Skeleton active paragraph={{ rows: 3 }} />
                    </Card>
                  </Col>
                ))
              : movies.map((movie) => (
                  <Col xs={24} sm={12} md={8} key={movie.id}>
                    <Card className="cinema-card movie-card">
                      <Space orientation="vertical" size={10}>
                        <div
                          className="movie-poster"
                          style={{
                            backgroundImage: `url(${resolvePoster(movie)})`,
                          }}
                        />
                        <Tag color="processing" icon={<PlayCircleOutlined />}>
                          Đang chiếu
                        </Tag>
                        <Typography.Title level={4} style={{ margin: 0, color: '#fff' }}>
                          {movie.name}
                        </Typography.Title>
                        <Typography.Text style={{ color: '#9fb3ff' }}>
                          Thể loại: {movie.genre}
                        </Typography.Text>
                        <Space size={12}>
                          <Typography.Text style={{ color: '#c5d3ff' }}>
                            <ClockCircleOutlined /> {movie.durationMinutes} phút
                          </Typography.Text>
                          <Typography.Text style={{ color: '#ffd666' }}>
                            <StarFilled /> {movie.rating.toFixed(1)}
                          </Typography.Text>
                        </Space>
                      </Space>
                    </Card>
                  </Col>
                ))}
          </Row>
        </section>

        <section className="section-spacing" id="phim-moi-cap-nhat">
          <Space orientation="vertical" size={4} className="section-header">
            <Tag color="cyan">Cập nhật</Tag>
            <Typography.Title level={3} style={{ color: '#fff', margin: 0 }}>
              Phim mới cập nhật
            </Typography.Title>
            <Typography.Text style={{ color: '#9fb3ff' }}>
              Danh sách phim vừa được bổ sung, ưu tiên hiển thị trên trang chủ.
            </Typography.Text>
          </Space>
          <Row gutter={[16, 16]}>
            {updatedMovies.map((movie) => (
              <Col xs={24} sm={12} md={6} key={`new-${movie.id}`}>
                <Card className="cinema-card movie-card compact-card">
                  <div className="movie-poster" style={{ backgroundImage: `url(${resolvePoster(movie)})` }} />
                  <Typography.Title level={5} style={{ color: '#fff', margin: '10px 0 6px' }}>
                    {movie.name}
                  </Typography.Title>
                  <Tag color="geekblue">Mới cập nhật</Tag>
                </Card>
              </Col>
            ))}
          </Row>
        </section>

        <section className="section-spacing" id="phim-sap-chieu">
          <Space orientation="vertical" size={4} className="section-header">
            <Tag color="purple">Coming Soon</Tag>
            <Typography.Title level={3} style={{ color: '#fff', margin: 0 }}>
              Phim sắp chiếu
            </Typography.Title>
            <Typography.Text style={{ color: '#9fb3ff' }}>
              Các tựa phim sắp khởi chiếu để khách hàng đặt lịch trước.
            </Typography.Text>
          </Space>
          <Row gutter={[16, 16]}>
            {upcomingMovies.map((movie) => (
              <Col xs={24} sm={12} md={6} key={`upcoming-${movie.id}`}>
                <Card className="cinema-card movie-card compact-card">
                  <div className="movie-poster" style={{ backgroundImage: `url(${resolvePoster(movie)})` }} />
                  <Typography.Title level={5} style={{ color: '#fff', margin: '10px 0 6px' }}>
                    {movie.name}
                  </Typography.Title>
                  <Typography.Text style={{ color: '#c5d3ff' }}>{movie.releaseText}</Typography.Text>
                  <Button type="primary" block size="middle" style={{ marginTop: 10 }}>
                    Đặt nhắc lịch
                  </Button>
                </Card>
              </Col>
            ))}
          </Row>
        </section>

        <section className="section-spacing" id="phim-top-doanh-thu">
          <Space orientation="vertical" size={4} className="section-header">
            <Tag color="gold">Top doanh thu</Tag>
            <Typography.Title level={3} style={{ color: '#fff', margin: 0 }}>
              Phim Top doanh thu
            </Typography.Title>
            <Typography.Text style={{ color: '#9fb3ff' }}>
              Nhóm phim có hiệu suất bán vé cao nhất hệ thống.
            </Typography.Text>
          </Space>
          <Row gutter={[16, 16]}>
            {topRevenueMovies.map((movie, idx) => (
              <Col xs={24} sm={12} md={6} key={`top-${movie.id}`}>
                <Card className="cinema-card movie-card compact-card top-revenue-card">
                  <Tag color="gold">Top #{idx + 1}</Tag>
                  <div className="movie-poster" style={{ backgroundImage: `url(${resolvePoster(movie)})` }} />
                  <Typography.Title level={5} style={{ color: '#fff', margin: '10px 0 6px' }}>
                    {movie.name}
                  </Typography.Title>
                  <Space size={10}>
                    <Typography.Text style={{ color: '#ffd666' }}>
                      <StarFilled /> {movie.rating.toFixed(1)}
                    </Typography.Text>
                    <Typography.Text style={{ color: '#73d13d' }}>Doanh thu: {movie.revenue}</Typography.Text>
                  </Space>
                </Card>
              </Col>
            ))}
          </Row>
        </section>

        <section className="section-spacing" id="nghiep-vu">
          <Space orientation="vertical" size={4} className="section-header">
            <Tag color="processing">Nghiệp vụ</Tag>
            <Typography.Title level={3} style={{ color: '#fff', margin: 0 }}>
              Mục nghiệp vụ nổi bật
            </Typography.Title>
            <Typography.Text style={{ color: '#9fb3ff' }}>
              Bố cục trang chủ theo chuẩn business cho nền tảng đặt vé online.
            </Typography.Text>
          </Space>

          <Row gutter={[16, 16]}>
            {businessSections.map((section) => (
              <Col xs={24} sm={12} key={section.title}>
                <Card className="cinema-card">
                  <Space>
                    <div className="business-icon">{section.icon}</div>
                    <Space orientation="vertical" size={4}>
                      <Typography.Title level={5} style={{ color: '#fff', margin: 0 }}>
                        {section.title}
                      </Typography.Title>
                      <Typography.Text style={{ color: '#c5d3ff' }}>{section.desc}</Typography.Text>
                    </Space>
                  </Space>
                </Card>
              </Col>
            ))}
          </Row>
        </section>

        <section className="section-spacing" id="uu-dai">
          <Space orientation="vertical" size={4} className="section-header">
            <Tag color="magenta">Promotion</Tag>
            <Typography.Title level={3} style={{ color: '#fff', margin: 0 }}>
              Ưu đãi và sự kiện
            </Typography.Title>
            <Typography.Text style={{ color: '#9fb3ff' }}>
              Các chương trình khuyến mãi và chiến dịch marketing đang diễn ra.
            </Typography.Text>
          </Space>

          <Row gutter={[16, 16]}>
            {promoCards.map((promo) => (
              <Col xs={24} md={8} key={promo.title}>
                <Card className="cinema-card promo-card">
                  <img src={promo.image} alt={promo.title} className="promo-image" />
                  <Typography.Title level={5} style={{ color: '#fff', marginBottom: 8 }}>
                    {promo.title}
                  </Typography.Title>
                  <Typography.Text style={{ color: '#c5d3ff' }}>{promo.desc}</Typography.Text>
                </Card>
              </Col>
            ))}
          </Row>
        </section>

        <section className="section-spacing" id="ho-tro">
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Card className="cinema-card">
                <Typography.Title level={4} style={{ marginTop: 0, color: '#fff' }}>
                  Tiêu chuẩn dịch vụ
                </Typography.Title>
                <Space orientation="vertical">
                  <Typography.Text style={{ color: '#c5d3ff' }}>
                    <SafetyCertificateOutlined /> Quy trình đặt vé an toàn, thanh toán minh bạch.
                  </Typography.Text>
                  <Typography.Text style={{ color: '#c5d3ff' }}>
                    <SafetyCertificateOutlined /> Check-in QR nhanh tại cổng vào.
                  </Typography.Text>
                  <Typography.Text style={{ color: '#c5d3ff' }}>
                    <SafetyCertificateOutlined /> Hỗ trợ khách hàng 24/7.
                  </Typography.Text>
                </Space>
              </Card>
            </Col>
            <Col xs={24} md={12}>
              <Card className="cinema-card">
                <Space orientation="vertical" size={12} style={{ width: '100%' }}>
                  <Typography.Title level={4} style={{ marginTop: 0, color: '#fff' }}>
                    FAQ / Hỗ trợ nhanh
                  </Typography.Title>
                  <Collapse
                    ghost
                    items={faqItems}
                    expandIconPosition="end"
                    style={{ color: '#c5d3ff' }}
                  />
                  <Typography.Text style={{ color: '#9fb3ff' }}>
                    <QrcodeOutlined /> Hỗ trợ check-in QR tại tất cả cửa vào.
                  </Typography.Text>
                </Space>
              </Card>
            </Col>
          </Row>
        </section>
      </Content>

      <Footer className="customer-footer">
        <div className="business-footer">
          <Row gutter={[20, 20]}>
            <Col xs={24} md={8}>
              <Space orientation="vertical" size={10}>
                <div className="brand-block" style={{ marginBottom: 0 }}>
                  <img src="/icons/cinema.svg" alt="Cinema logo" width={34} height={34} />
                  <Typography.Title level={5} style={{ margin: 0, color: '#fff' }}>
                    CineStar Experience
                  </Typography.Title>
                </div>
                <Typography.Text style={{ color: '#c5d3ff' }}>
                  Nền tảng đặt vé trực tuyến cho hệ thống rạp chiếu phim. Quản lý suất chiếu,
                  ghế ngồi, thanh toán và check-in QR theo thời gian thực.
                </Typography.Text>
                <Typography.Text style={{ color: '#9fb3ff' }}>
                  Giờ hoạt động: 08:00 - 23:30 (T2 - CN)
                </Typography.Text>
              </Space>
            </Col>

            <Col xs={24} md={8}>
              <Space orientation="vertical" size={8}>
                <Typography.Title level={5} style={{ margin: 0, color: '#fff' }}>
                  Trung tâm hỗ trợ
                </Typography.Title>
                <Typography.Text style={{ color: '#c5d3ff' }}>
                  Hotline: 1900 1234
                </Typography.Text>
                <Typography.Text style={{ color: '#c5d3ff' }}>
                  Email: hotro@cinestar.vn
                </Typography.Text>
                <Typography.Text style={{ color: '#c5d3ff' }}>
                  Địa chỉ: 123 Nguyễn Văn Cừ, Q.5, TP.HCM
                </Typography.Text>
                <Space size={8} wrap>
                  <Tag color="processing">Điều khoản sử dụng</Tag>
                  <Tag color="processing">Chính sách bảo mật</Tag>
                  <Tag color="processing">Quy định hoàn vé</Tag>
                </Space>
              </Space>
            </Col>

            <Col xs={24} md={8}>
              <Space orientation="vertical" size={10} style={{ width: '100%' }}>
                <Typography.Title level={5} style={{ margin: 0, color: '#fff' }}>
                  Kết nối với chúng tôi
                </Typography.Title>

                <div className="social-card">
                  <ul>
                    <li className="social-iso-pro">
                      <span />
                      <span />
                      <span />
                      <a href="https://facebook.com" target="_blank" rel="noreferrer">
                        <svg viewBox="0 0 320 512" xmlns="http://www.w3.org/2000/svg" className="social-svg">
                          <path d="M279.14 288l14.22-92.66h-88.91v-60.13c0-25.35 12.42-50.06 52.24-50.06h40.42V6.26S260.43 0 225.36 0c-73.22 0-121.08 44.38-121.08 124.72v70.62H22.89V288h81.39v224h100.17V288z" />
                        </svg>
                      </a>
                      <div className="social-text">Facebook</div>
                    </li>
                    <li className="social-iso-pro">
                      <span />
                      <span />
                      <span />
                      <a href="https://x.com" target="_blank" rel="noreferrer">
                        <svg className="social-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
                          <path d="M459.37 151.716c.325 4.548.325 9.097.325 13.645 0 138.72-105.583 298.558-298.558 298.558-59.452 0-114.68-17.219-161.137-47.106 8.447.974 16.568 1.299 25.34 1.299 49.055 0 94.213-16.568 130.274-44.832-46.132-.975-84.792-31.188-98.112-72.772 6.498.974 12.995 1.624 19.818 1.624 9.421 0 18.843-1.3 27.614-3.573-48.081-9.747-84.143-51.98-84.143-102.985v-1.299c13.969 7.797 30.214 12.67 47.431 13.319-28.264-18.843-46.781-51.005-46.781-87.391 0-19.492 5.197-37.36 14.294-52.954 51.655 63.675 129.3 105.258 216.365 109.807-1.624-7.797-2.599-15.918-2.599-24.04 0-57.828 46.782-104.934 104.934-104.934 30.213 0 57.502 12.67 76.67 33.137 23.715-4.548 46.456-13.32 66.599-25.34-7.798 24.366-24.366 44.833-46.132 57.827 21.117-2.273 41.584-8.122 60.426-16.243-14.292 20.791-32.161 39.308-52.628 54.253z" />
                        </svg>
                      </a>
                      <div className="social-text">Twitter</div>
                    </li>
                    <li className="social-iso-pro">
                      <span />
                      <span />
                      <span />
                      <a href="https://instagram.com" target="_blank" rel="noreferrer">
                        <svg className="social-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512">
                          <path d="M224.1 141c-63.6 0-114.9 51.3-114.9 114.9s51.3 114.9 114.9 114.9S339 319.5 339 255.9 287.7 141 224.1 141zm0 189.6c-41.1 0-74.7-33.5-74.7-74.7s33.5-74.7 74.7-74.7 74.7 33.5 74.7 74.7-33.6 74.7-74.7 74.7zm146.4-194.3c0 14.9-12 26.8-26.8 26.8-14.9 0-26.8-12-26.8-26.8s12-26.8 26.8-26.8 26.8 12 26.8 26.8zm76.1 27.2c-1.7-35.9-9.9-67.7-36.2-93.9-26.2-26.2-58-34.4-93.9-36.2-37-2.1-147.9-2.1-184.9 0-35.8 1.7-67.6 9.9-93.9 36.1s-34.4 58-36.2 93.9c-2.1 37-2.1 147.9 0 184.9 1.7 35.9 9.9 67.7 36.2 93.9s58 34.4 93.9 36.2c37 2.1 147.9 2.1 184.9 0 35.9-1.7 67.7-9.9 93.9-36.2 26.2-26.2 34.4-58 36.2-93.9 2.1-37 2.1-147.8 0-184.8zM398.8 388c-7.8 19.6-22.9 34.7-42.6 42.6-29.5 11.7-99.5 9-132.1 9s-102.7 2.6-132.1-9c-19.6-7.8-34.7-22.9-42.6-42.6-11.7-29.5-9-99.5-9-132.1s-2.6-102.7 9-132.1c7.8-19.6 22.9-34.7 42.6-42.6 29.5-11.7 99.5-9 132.1-9s102.7-2.6 132.1 9c19.6 7.8 34.7 22.9 42.6 42.6 11.7 29.5 9 99.5 9 132.1s2.7 102.7-9 132.1z" />
                        </svg>
                      </a>
                      <div className="social-text">Instagram</div>
                    </li>
                  </ul>
                </div>
              </Space>
            </Col>
          </Row>

          <div className="footer-bottom">
            <Typography.Text style={{ color: '#9fb3ff' }}>
              © {new Date().getFullYear()} CineStar Experience. Bản quyền thuộc hệ thống quản lý rạp phim.
            </Typography.Text>
          </div>
        </div>
      </Footer>
    </Layout>
  )
}
