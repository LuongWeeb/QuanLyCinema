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
        setShowtimes(st)
        if (st.length === 0) {
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
          <Card className="cinema-card" loading={loading}>
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
          <Card className="cinema-card" style={{ marginTop: 16 }} title={<span style={{ color: '#fff' }}>Chọn suất chiếu</span>}>
            <Typography.Paragraph style={{ color: '#b8c7ff' }}>
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
            <Space orientation="vertical" style={{ width: '100%' }}>
              {showtimes.map((s) => (
                <Button
                  key={s.id}
                  block
                  type={showtimeId === s.id ? 'primary' : 'default'}
                  onClick={() => {
                    setShowtimeId(s.id)
                  }}
                  style={{ textAlign: 'left', height: 'auto', padding: '12px 16px' }}
                >
                  <div>
                    <strong>{s.auditorium?.name ?? `Phòng #${s.auditoriumId}`}</strong>
                    <div style={{ color: 'inherit', opacity: 0.85 }}>
                      {dayjs(s.startTime).format('DD/MM/YYYY HH:mm')} — từ{' '}
                      {Number(s.price).toLocaleString('vi-VN')} ₫ / ghế thường · VIP ×{VIP_PRICE_MULTIPLIER}
                    </div>
                  </div>
                </Button>
              ))}
            </Space>
            <Button
              type="primary"
              style={{ marginTop: 16 }}
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
          <Card className="cinema-card" style={{ marginTop: 16 }} title={<span style={{ color: '#fff' }}>Chọn ghế</span>}>
            <Typography.Text style={{ color: '#b8c7ff' }}>
              Phòng: <strong style={{ color: '#fff' }}>{selectedShowtime.auditorium?.name}</strong> — Giờ:{' '}
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
            <Space style={{ marginTop: 16 }} wrap>
              <Tag color="default">Trống</Tag>
              <Tag color="gold">VIP (×{VIP_PRICE_MULTIPLIER})</Tag>
              <Tag color="processing">Đang chọn</Tag>
              <Tag color="error">Đã bán / giữ</Tag>
            </Space>
            <Space style={{ marginTop: 16 }}>
              <Button onClick={() => setStep(0)}>Quay lại</Button>
              <Button type="primary" disabled={selectedSeats.length === 0} onClick={() => setStep(2)}>
                Tiếp tục
              </Button>
            </Space>
          </Card>
        )}

        {step === 2 && selectedShowtime && (
          <Card className="cinema-card" style={{ marginTop: 16 }} title={<span style={{ color: '#fff' }}>Xác nhận</span>}>
            <Typography.Paragraph style={{ color: '#b8c7ff' }}>
              Số ghế: {selectedSeats.length} — Giá suất (thường):{' '}
              {Number(selectedShowtime.price).toLocaleString('vi-VN')} ₫ · VIP nhân {VIP_PRICE_MULTIPLIER}
            </Typography.Paragraph>
            <Typography.Title level={4} style={{ color: '#ffd666' }}>
              Tạm tính: {estimatedSeatTotal.toLocaleString('vi-VN')} ₫
            </Typography.Title>
            <Space>
              <Button onClick={() => setStep(1)}>Quay lại</Button>
              <Button type="primary" icon={<CheckCircleOutlined />} onClick={() => void submitReserve()}>
                Đặt ghế
              </Button>
            </Space>
          </Card>
        )}

        {step === 3 && reservationId != null && (
          <Card className="cinema-card" style={{ marginTop: 16 }} title={<span style={{ color: '#fff' }}>Đã tạo đơn</span>}>
            <Typography.Paragraph style={{ color: '#b8c7ff' }}>
              Mã đặt chỗ: <strong style={{ color: '#fff' }}>{reservationId}</strong>
            </Typography.Paragraph>
            <Typography.Title level={4} style={{ color: '#73d13d' }}>
              Tổng dự kiến: {totalAmount.toLocaleString('vi-VN')} ₫
            </Typography.Title>
            <Typography.Paragraph style={{ color: '#b8c7ff' }}>
              {staffCounterMode
                ? 'Quản lý duyệt đơn trên trang quản trị. Sau đó bạn có thể thu tiền tại tab “Chờ thanh toán”, hoặc khách tự thanh toán trong mục Vé của tôi.'
                : 'Đơn đang chờ duyệt. Sau khi được duyệt, vào mục Vé của tôi để thanh toán và nhận vé.'}
            </Typography.Paragraph>
            <Button type="primary" onClick={() => navigate(homePath)}>
              {staffCounterMode ? 'Về danh sách phim (quầy)' : 'Về trang chủ'}
            </Button>
          </Card>
        )}
      </Content>
    </Layout>
  )
}
