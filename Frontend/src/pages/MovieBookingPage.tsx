import { ArrowLeftOutlined, CheckCircleOutlined } from '@ant-design/icons'
import { Button, Card, Layout, Rate, Select, Space, Steps, Tag, Typography, message } from 'antd'
import dayjs from 'dayjs'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { TopbarSearch } from '../components/common/TopbarSearch'
import { UserDropdown } from '../components/common/UserDropdown'
import { useDebouncedValue } from '../hooks/useDebouncedValue'
import { searchCustomers } from '../services/authService'
import { createReservation } from '../services/bookingService'
import { getMovieDetail, rateMovie } from '../services/movieService'
import { getSeatMap, listShowtimes, type SeatMapItem } from '../services/showtimeService'
import type { LoginResponse } from '../types/auth'
import type { MovieDetail } from '../types/movie'
import { resolveUploadedPosterUrl } from '../utils/moviePoster'
import type { Showtime } from '../types/showtime'
import { mapApiError } from '../utils/error'
import { sortSeatsForDisplay, VIP_PRICE_MULTIPLIER } from '../utils/seatSort'

const { Header, Content } = Layout

interface MovieBookingPageProps {
  currentUser: LoginResponse
  onLogout: () => void
  routeBase?: string
  staffCounterMode?: boolean
  onBackToAdmin?: () => void
}

const SEAT_AVAILABLE = 1

export function MovieBookingPage({
  currentUser,
  onLogout,
  routeBase = '',
  staffCounterMode = false,
  onBackToAdmin,
}: MovieBookingPageProps) {
  const { movieId } = useParams<{ movieId: string }>()
  const navigate = useNavigate()
  const base = routeBase.replace(/\/$/, '')
  const homePath = base || '/'
  const id = Number(movieId)
  const [movie, setMovie] = useState<MovieDetail | null>(null)
  const [showtimes, setShowtimes] = useState<Showtime[]>([])
  const [step, setStep] = useState(0)
  const [showtimeId, setShowtimeId] = useState<number | null>(null)
  const [seatMap, setSeatMap] = useState<SeatMapItem[]>([])
  const [selectedSeats, setSelectedSeats] = useState<number[]>([])
  const [loading, setLoading] = useState(true)
  const [reservationId, setReservationId] = useState<number | null>(null)
  const [totalAmount, setTotalAmount] = useState<number>(0)
  const [targetUserId, setTargetUserId] = useState<number | null>(null)
  const [customerQuery, setCustomerQuery] = useState('')
  const debouncedCustomerQ = useDebouncedValue(customerQuery, 320)
  const [customerOptions, setCustomerOptions] = useState<{ value: number; label: string }[]>([])

  const selectedShowtime = useMemo(
    () => showtimes.find((s) => s.id === showtimeId) ?? null,
    [showtimes, showtimeId],
  )

  const estimatedSeatTotal = useMemo(() => {
    if (!selectedShowtime) return 0
    const base = Number(selectedShowtime.price)
    return selectedSeats.reduce((sum, sid) => {
      const row = seatMap.find((s) => s.id === sid)
      const mult = row?.isVip ? VIP_PRICE_MULTIPLIER : 1
      return sum + base * mult
    }, 0)
  }, [selectedSeats, seatMap, selectedShowtime])

  const seatsSortedForUi = useMemo(() => sortSeatsForDisplay(seatMap), [seatMap])

  useEffect(() => {
    if (!Number.isFinite(id) || id <= 0) {
      message.error('Phim không hợp lệ.')
      navigate(homePath)
      return
    }

    async function load() {
      setLoading(true)
      try {
        const [m, st] = await Promise.all([getMovieDetail(id), listShowtimes(id)])
        setMovie(m)
        const nowMs = Date.now()
        const futureShowtimes = st.filter((x) => dayjs(x.startTime).valueOf() > nowMs)
        setShowtimes(futureShowtimes)
        if (futureShowtimes.length === 0) {
          message.warning('Phim này chưa có suất chiếu. Vui lòng quay lại sau.')
        }
      } catch (e) {
        message.error(mapApiError(e).message)
        navigate(homePath)
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [id, navigate, homePath])

  useEffect(() => {
    if (!staffCounterMode) return
    let cancelled = false
    async function loadCustomers() {
      try {
        const list = await searchCustomers(debouncedCustomerQ.trim() || undefined, 40)
        if (cancelled) return
        setCustomerOptions(
          list.map((c) => ({
            value: c.userId,
            label: `${c.fullName} (@${c.username})`,
          })),
        )
      } catch {
        if (!cancelled) setCustomerOptions([])
      }
    }
    void loadCustomers()
    return () => {
      cancelled = true
    }
  }, [debouncedCustomerQ, staffCounterMode])

  async function loadSeatMap(stId: number) {
    try {
      const map = await getSeatMap(stId)
      setSeatMap(map)
      setSelectedSeats([])
    } catch (e) {
      message.error(mapApiError(e).message)
    }
  }

  function toggleSeat(seatId: number, status: number) {
    if (status !== SEAT_AVAILABLE) return
    setSelectedSeats((prev) =>
      prev.includes(seatId) ? prev.filter((x) => x !== seatId) : [...prev, seatId],
    )
  }

  async function submitReserve() {
    if (!showtimeId || selectedSeats.length === 0) {
      message.warning('Chọn ít nhất một ghế.')
      return
    }
    if (staffCounterMode && (targetUserId == null || targetUserId <= 0)) {
      message.warning('Chọn tài khoản khách hàng cho đơn đặt tại quầy.')
      return
    }
    try {
      const res = await createReservation(
        showtimeId,
        selectedSeats,
        staffCounterMode ? targetUserId! : undefined,
      )
      setReservationId(res.reservationId)
      setTotalAmount(res.totalAmount)
      setStep(3)
      message.success(
        staffCounterMode
          ? 'Đã tạo đơn chờ duyệt cho khách.'
          : 'Đã gửi đơn đặt vé — chờ quản lý duyệt.',
      )
    } catch (e) {
      message.error(mapApiError(e).message)
    }
  }

  return (
    <Layout className="customer-layout">
      <Header className="customer-header">
        <div className="customer-header-left">
          <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate(homePath)} style={{ color: '#fff' }}>
            Trang chủ
          </Button>
          <TopbarSearch
            placeholder="Tìm tên phim hoặc thể loại..."
            onNavigateHomeWithQuery={(q) =>
              navigate(q.trim() ? `${homePath}?q=${encodeURIComponent(q.trim())}` : homePath)
            }
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
      <Content className="customer-content" style={{ maxWidth: 960, margin: '0 auto' }}>
        <Steps
          current={step}
          style={{ marginBottom: 24 }}
          items={[
            { title: 'Phim & suất' },
            { title: 'Chọn ghế' },
            { title: 'Xác nhận' },
            { title: 'Hoàn tất' },
          ]}
        />

        {movie ? (
          <Card className="glow-card" bordered={false} loading={loading}>
            {(() => {
              const poster = resolveUploadedPosterUrl(movie.posterUrl)
              return (
            <Space align="start" size={20} wrap>
              {poster ? (
                <div
                  className="movie-poster"
                  style={{
                    width: 140,
                    minHeight: 200,
                    borderRadius: 8,
                    backgroundImage: `url(${poster})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                />
              ) : null}
              <div style={{ flex: 1, minWidth: 200 }}>
                <Typography.Title level={3} style={{ color: '#fff', marginTop: 0 }}>
                  {movie.name}
                </Typography.Title>
                <Space wrap>
                  <Tag color="blue">{movie.genre}</Tag>
                  <Tag>{movie.durationMinutes} phút</Tag>
                  <Tag color="gold">IMDb ★ {movie.rating}</Tag>
                </Space>
                <Typography.Paragraph style={{ color: '#b8c7ff', marginTop: 12, marginBottom: 8 }}>
                  Đánh giá khách hàng ({movie.userRatingCount} lượt):{' '}
                  {movie.userRatingCount > 0 ? (
                    <strong style={{ color: '#ffd666' }}>{movie.averageUserStars.toFixed(1)} / 5</strong>
                  ) : (
                    <span>Chưa có</span>
                  )}
                </Typography.Paragraph>
                <Typography.Text style={{ color: '#fff', display: 'block', marginBottom: 6 }}>
                  Sao của bạn (1–5)
                </Typography.Text>
                <Rate
                  value={movie.myStars ?? 0}
                  onChange={async (v) => {
                    try {
                      await rateMovie(id, v)
                      const refreshed = await getMovieDetail(id)
                      setMovie(refreshed)
                      message.success('Đã lưu đánh giá.')
                    } catch (e) {
                      message.error(mapApiError(e).message)
                    }
                  }}
                />
              </div>
            </Space>
              )
            })()}
          </Card>
        ) : null}

        {step === 0 && (
          <Card className="glow-card" style={{ marginTop: 16 }} bordered={false} title={<span style={{ color: '#fff', fontSize: '1.2rem' }}>CHỌN TOẠ ĐỘ & SUẤT CHIẾU</span>}>
            <Typography.Paragraph style={{ color: '#8ea8ff' }}>
              Mỗi suất gắn với một phòng cụ thể. Sau bước này bạn chọn ghế trong phòng đó.
            </Typography.Paragraph>
            {staffCounterMode ? (
              <div style={{ marginBottom: 16 }}>
                <Typography.Text style={{ color: '#fff', display: 'block', marginBottom: 8 }}>
                  Khách hàng (bắt buộc)
                </Typography.Text>
                <Select
                  showSearch
                  allowClear
                  placeholder="Tìm theo tên hoặc tên đăng nhập…"
                  style={{ width: '100%', maxWidth: 480 }}
                  options={customerOptions}
                  filterOption={false}
                  onSearch={setCustomerQuery}
                  value={targetUserId ?? undefined}
                  onChange={(v) => setTargetUserId(v ?? null)}
                />
                <Typography.Paragraph style={{ color: '#8ea8ff', marginTop: 8, marginBottom: 0, fontSize: 13 }}>
                  Đơn sẽ được ghi nhận cho tài khoản khách; quản lý duyệt trước khi thanh toán.
                </Typography.Paragraph>
              </div>
            ) : null}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', width: '100%' }}>
              {showtimes.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className={`ticket-showtime-btn ${showtimeId === s.id ? 'ant-btn-primary' : ''}`}
                  onClick={() => setShowtimeId(s.id)}
                >
                  <div style={{ flex: 1 }}>
                    <Typography.Title level={4} style={{ color: '#fff', marginTop: 0, marginBottom: 8, fontSize: '1.25rem' }}>
                      {s.auditorium?.name ?? `Phòng #${s.auditoriumId}`}
                    </Typography.Title>
                    <div style={{ color: '#8ea8ff', opacity: 0.9, display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <span><strong style={{color: '#fff'}}>🕒 Giờ chiếu:</strong> {dayjs(s.startTime).format('DD/MM/YYYY HH:mm')}</span>
                      <span><strong style={{color: '#fff'}}>🎟️ Giá vé:</strong> {Number(s.price).toLocaleString('vi-VN')} ₫ <small style={{ opacity: 0.7 }}>(Thường)</small></span>
                      <span className="gold-text">⭐ VIP ×{VIP_PRICE_MULTIPLIER}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
            <Button
              type="primary"
              className="btn-glow-primary"
              size="large"
              style={{ marginTop: 24, padding: '0 40px' }}
              disabled={!showtimeId}
              onClick={() => {
                if (showtimeId) {
                  void loadSeatMap(showtimeId)
                  setStep(1)
                }
              }}
            >
              Tiếp tục chọn ghế
            </Button>
          </Card>
        )}

        {step === 1 && selectedShowtime && (
          <div className="animate-slide-up">
          <Card className="glow-card" style={{ marginTop: 16, textAlign: 'center' }} bordered={false}>
            <div className="cinema-screen-curve">MÀN HÌNH</div>
            <Typography.Text style={{ color: '#b8c7ff', fontSize: '1.1rem' }}>
              Phòng chiếu: <strong style={{ color: '#00f2fe' }}>{selectedShowtime.auditorium?.name}</strong> | Giờ chiếu:{' '}
              {dayjs(selectedShowtime.startTime).format('DD/MM/YYYY HH:mm')}
            </Typography.Text>
            <div className="booking-seat-grid" style={{ marginTop: 16 }}>
              {seatsSortedForUi.map((s) => {
                const sel = selectedSeats.includes(s.id)
                const sold = s.status !== SEAT_AVAILABLE
                const vip = Boolean(s.isVip)
                return (
                  <button
                    key={s.id}
                    type="button"
                    className={`booking-seat ${sold ? 'sold' : ''} ${sel ? 'selected' : ''} ${vip && !sold ? 'vip' : ''}`}
                    disabled={sold}
                    onClick={() => toggleSeat(s.id, s.status)}
                  >
                    {s.seatCode}
                  </button>
                )
              })}
            </div>
            <Space style={{ marginTop: 24, justifyContent: 'center', width: '100%' }} wrap>
              <Tag className="hero-tag outline-tag">Trống</Tag>
              <Tag className="hero-tag rating-tag">VIP</Tag>
              <Tag className="hero-tag cyber-tag" style={{ background: 'linear-gradient(135deg, #00f2fe 0%, #4facfe 100%)', color: '#000' }}>Đang chọn</Tag>
              <Tag className="hero-tag" style={{ border: '1px solid rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.4)', background: 'rgba(30,30,40,0.6)' }}>Đã bán</Tag>
            </Space>
            <Space style={{ marginTop: 30, justifyContent: 'center', width: '100%' }} size="large">
              <Button size="large" className="btn-glass" onClick={() => setStep(0)}>Quay lại</Button>
              <Button type="primary" size="large" className="btn-glow-primary" disabled={selectedSeats.length === 0} onClick={() => setStep(2)}>
                Tiếp tục
              </Button>
            </Space>
          </Card>
          </div>
        )}

        {step === 2 && selectedShowtime && (
          <div className="animate-slide-up">
            <Card className="glass-receipt-card" style={{ marginTop: 16, marginInline: 'auto', maxWidth: 600 }} bordered={false}>
              <Typography.Title level={3} style={{ color: '#fff', textAlign: 'center', marginBottom: 24, letterSpacing: 2 }}>
                XÁC NHẬN VÉ
              </Typography.Title>
              
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: 20, borderRadius: 12 }}>
                <Typography.Paragraph style={{ color: '#8ea8ff', fontSize: '1.1rem', marginBottom: 8 }}>
                  Khán phòng: <strong style={{ color: '#fff' }}>{selectedShowtime.auditorium?.name}</strong>
                </Typography.Paragraph>
                <Typography.Paragraph style={{ color: '#8ea8ff', fontSize: '1.1rem', marginBottom: 8 }}>
                  Suất chiếu: <strong style={{ color: '#fff' }}>{dayjs(selectedShowtime.startTime).format('DD/MM/YYYY HH:mm')}</strong>
                </Typography.Paragraph>
                <div className="receipt-divider" />
                <Typography.Paragraph style={{ color: '#8ea8ff', fontSize: '1.1rem', marginBottom: 8 }}>
                  Số ghế: <strong style={{ color: '#00f2fe' }}>{selectedSeats.length}</strong>
                </Typography.Paragraph>
                <Typography.Paragraph style={{ color: '#8ea8ff', fontSize: '1.1rem', marginBottom: 0 }}>
                  Giá vé gốc (thường): {Number(selectedShowtime.price).toLocaleString('vi-VN')} ₫
                </Typography.Paragraph>
              </div>

              <div style={{ textAlign: 'center', marginTop: 30 }}>
                <Typography.Text style={{ color: '#8ea8ff', fontSize: '1.2rem', textTransform: 'uppercase' }}>Tổng thanh toán</Typography.Text>
                <Typography.Title level={2} className="gradient-text gold" style={{ marginTop: 8 }}>
                  {estimatedSeatTotal.toLocaleString('vi-VN')} ₫
                </Typography.Title>
              </div>
              
              <Space size="large" style={{ marginTop: 30, display: 'flex', justifyContent: 'center' }}>
                <Button size="large" className="btn-glass" onClick={() => setStep(1)} style={{ padding: '0 32px' }}>Quay lại</Button>
                <Button type="primary" size="large" className="btn-glow-primary pulse-glow" icon={<CheckCircleOutlined />} onClick={() => void submitReserve()} style={{ padding: '0 32px' }}>
                  XÁC NHẬN ĐẶT GHẾ
                </Button>
              </Space>
            </Card>
          </div>
        )}

        {step === 3 && reservationId != null && (
          <div className="animate-slide-up">
            <Card className="glass-receipt-card" style={{ marginTop: 16, marginInline: 'auto', maxWidth: 640, textAlign: 'center', padding: '20px 0' }} bordered={false}>
              <div style={{ display: 'inline-flex', padding: 20, borderRadius: '50%', background: 'rgba(0, 250, 154, 0.1)', marginBottom: 24, boxShadow: '0 0 30px rgba(0, 250, 154, 0.4)' }}>
                <CheckCircleOutlined style={{ fontSize: 72, color: '#00fa9a' }} />
              </div>
              <Typography.Title level={2} className="gradient-text cyan" style={{ marginBottom: 8, marginTop: 0 }}>
                CHỐT VÉ THÀNH CÔNG!
              </Typography.Title>
              <Typography.Paragraph style={{ color: '#8ea8ff', fontSize: '1.2rem' }}>
                Mã đặt chỗ: <strong style={{ color: '#fff', fontSize: '1.4rem', letterSpacing: 2, padding: '4px 12px', background: 'rgba(255,255,255,0.1)', borderRadius: 8 }}>{reservationId}</strong>
              </Typography.Paragraph>
              
              <div className="receipt-divider" style={{ margin: '30px 40px' }} />
              
              <Typography.Title level={2} className="gradient-text gold" style={{ marginTop: 10, marginBottom: 20 }}>
                {totalAmount.toLocaleString('vi-VN')} ₫
              </Typography.Title>
              <Typography.Paragraph style={{ color: '#b8c7ff', maxWidth: 480, margin: '0 auto 30px', lineHeight: 1.6 }}>
                {staffCounterMode
                  ? 'Giao dịch tại quầy đã được đưa vào hàng đợi duyệt. Khách hàng có thể thanh toán tiền mặt/hoặc thẻ ngay bây giờ.'
                  : 'Vé đang chờ hệ thống xác nhận. Vui lòng kiểm tra mục "Vé của tôi" để tiến hành thanh toán giữ chỗ.'}
              </Typography.Paragraph>
              <Button type="primary" size="large" className="btn-glow-primary" onClick={() => navigate(homePath)} style={{ padding: '0 40px', height: 50, borderRadius: 25 }}>
                {staffCounterMode ? 'VỀ DANH SÁCH (QUẦY)' : 'VỀ TRANG CHỦ'}
              </Button>
            </Card>
          </div>
        )}
      </Content>
    </Layout>
  )
}
