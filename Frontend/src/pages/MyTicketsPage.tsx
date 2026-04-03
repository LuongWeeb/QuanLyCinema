import { ArrowLeftOutlined, DownloadOutlined } from '@ant-design/icons'
import { Button, Card, Layout, Popconfirm, Space, Tag, Typography, message } from 'antd'
import dayjs from 'dayjs'
import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { TopbarSearch } from '../components/common/TopbarSearch'
import { UserDropdown } from '../components/common/UserDropdown'
import { payReservation } from '../services/bookingService'
import {
  cancelReservation,
  downloadTicketPdfBlob,
  listMyReservations,
} from '../services/reservationService'
import type { LoginResponse } from '../types/auth'
import type { MyReservation } from '../types/reservation'
import { mapApiError } from '../utils/error'

const { Header, Content } = Layout

interface MyTicketsPageProps {
  currentUser: LoginResponse
  onLogout: () => void
}

function statusTag(status: string) {
  switch (status) {
    case 'PendingApproval':
      return <Tag color="warning">Chờ duyệt</Tag>
    case 'PendingPayment':
      return <Tag color="processing">Chờ thanh toán</Tag>
    case 'Paid':
      return <Tag color="success">Đã thanh toán</Tag>
    case 'Cancelled':
      return <Tag>Đã hủy</Tag>
    default:
      return <Tag>{status}</Tag>
  }
}

export function MyTicketsPage({ currentUser, onLogout }: MyTicketsPageProps) {
  const navigate = useNavigate()
  const [rows, setRows] = useState<MyReservation[]>([])
  const [loading, setLoading] = useState(true)
  const [cancellingId, setCancellingId] = useState<number | null>(null)
  const [payingId, setPayingId] = useState<number | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setRows(await listMyReservations())
    } catch (e) {
      message.error(mapApiError(e).message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  async function onPay(id: number) {
    setPayingId(id)
    try {
      const msg = await payReservation(id, 'Online')
      message.success(msg)
      await load()
    } catch (e) {
      message.error(mapApiError(e).message)
    } finally {
      setPayingId(null)
    }
  }

  async function onCancel(id: number) {
    setCancellingId(id)
    try {
      const msg = await cancelReservation(id)
      message.success(msg)
      await load()
    } catch (e) {
      message.error(mapApiError(e).message)
    } finally {
      setCancellingId(null)
    }
  }

  async function onDownloadPdf(qrCode: string) {
    try {
      const blob = await downloadTicketPdfBlob(qrCode)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `ve-${qrCode.slice(0, 12)}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      message.error(mapApiError(e).message)
    }
  }

  return (
    <Layout className="customer-layout">
      <Header className="customer-header">
        <div className="customer-header-left">
          <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate('/')} style={{ color: '#fff' }}>
            Trang chủ
          </Button>
          <TopbarSearch
            placeholder="Tìm tên phim hoặc thể loại..."
            onNavigateHomeWithQuery={(q) => navigate(q.trim() ? `/?q=${encodeURIComponent(q.trim())}` : '/')}
          />
        </div>
        <UserDropdown
          username={currentUser.username}
          role={currentUser.role}
          onLogout={onLogout}
          onMyTickets={() => navigate('/ve-cua-toi')}
        />
      </Header>
      <Content className="customer-content" style={{ maxWidth: 880, margin: '0 auto' }}>
        <Typography.Title level={3} style={{ color: '#fff', marginTop: 0 }}>
          Vé của tôi
        </Typography.Title>
        <Typography.Paragraph style={{ color: '#b8c7ff' }}>
          Đơn mới ở trạng thái chờ duyệt; sau khi được duyệt bạn thanh toán tại đây để hoàn tất vé. Có thể hủy trước giờ
          chiếu (chưa check-in); sau khi hủy ghế sẽ mở bán lại.
        </Typography.Paragraph>

        <Space orientation="vertical" size={16} style={{ width: '100%' }}>
          {loading ? (
            <Card className="cinema-card">
              <Typography.Text style={{ color: '#b8c7ff' }}>Đang tải…</Typography.Text>
            </Card>
          ) : rows.length === 0 ? (
            <Card className="cinema-card">
              <Typography.Text style={{ color: '#b8c7ff' }}>Bạn chưa có đặt chỗ nào.</Typography.Text>
              <div style={{ marginTop: 12 }}>
                <Button type="primary" onClick={() => navigate('/')}>
                  Đặt vé
                </Button>
              </div>
            </Card>
          ) : (
            rows.map((r) => (
              <div key={r.id} className="digital-ticket-card">
                <div className="ticket-left">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                    <div>
                      <Typography.Text className="hero-tag cyber-tag" style={{ border: 'none', background: 'rgba(0,242,254,0.1)', marginBottom: 8, display: 'inline-block' }}>
                        Mã vé: {r.id}
                      </Typography.Text>
                      <Typography.Title level={3} style={{ color: '#fff', margin: 0 }}>
                        {r.movieName}
                      </Typography.Title>
                    </div>
                    {statusTag(r.status)}
                  </div>
                  
                  <Space size="large" wrap style={{ marginBottom: 20 }}>
                    <div>
                      <Typography.Text type="secondary" style={{ color: '#8ea8ff', display: 'block', fontSize: 12 }}>THỜI GIAN</Typography.Text>
                      <Typography.Text style={{ color: '#fff', fontSize: 16, fontWeight: 500 }}>
                        {dayjs(r.startTime).format('HH:mm - DD/MM/YYYY')}
                      </Typography.Text>
                    </div>
                    <div>
                      <Typography.Text type="secondary" style={{ color: '#8ea8ff', display: 'block', fontSize: 12 }}>PHÒNG CHIẾU</Typography.Text>
                      <Typography.Text style={{ color: '#fff', fontSize: 16, fontWeight: 500 }}>
                        {r.auditoriumName}
                      </Typography.Text>
                    </div>
                    {r.status !== 'Cancelled' ? (
                      <div>
                        <Typography.Text type="secondary" style={{ color: '#8ea8ff', display: 'block', fontSize: 12 }}>TỔNG TIỀN</Typography.Text>
                        <Typography.Text className="gradient-text gold" style={{ fontSize: 16, fontWeight: 'bold' }}>
                          {Number(r.totalAmount).toLocaleString('vi-VN')} ₫
                        </Typography.Text>
                      </div>
                    ) : null}
                  </Space>

                  <Space wrap>
                    {r.canPay ? (
                      <Button
                        type="primary"
                        className="btn-glow-primary"
                        loading={payingId === r.id}
                        onClick={() => void onPay(r.id)}
                      >
                        Thanh toán ngay
                      </Button>
                    ) : null}
                    {r.canCancel ? (
                      <Popconfirm
                        title="Hủy đặt chỗ?"
                        description="Ghế sẽ được trả lại cho hệ thống."
                        okText="Hủy đặt"
                        cancelText="Đóng"
                        onConfirm={() => void onCancel(r.id)}
                      >
                        <Button className="btn-glass" danger loading={cancellingId === r.id}>
                          Hủy xuất vé
                        </Button>
                      </Popconfirm>
                    ) : null}
                  </Space>
                </div>

                <div className="ticket-divider"></div>

                <div className="ticket-right">
                  <Typography.Text type="secondary" style={{ color: '#8ea8ff', marginBottom: 16, letterSpacing: 2 }}>
                    GHẾ CỦA BẠN
                  </Typography.Text>
                  
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 20 }}>
                    {r.seatCodes.length > 0 ? (
                      r.seatCodes.map((sc) => (
                        <div key={sc} className="booking-seat selected" style={{ pointerEvents: 'none', width: '40px', height: '40px', fontSize: '1rem', padding: 0 }}>
                          {sc}
                        </div>
                      ))
                    ) : (
                      <Typography.Text style={{ color: 'rgba(255,255,255,0.3)' }}>—</Typography.Text>
                    )}
                  </div>

                  {r.tickets.length > 0 && r.status === 'Paid' ? (
                    <Button 
                      type="primary" 
                      className="btn-glow-primary" 
                      icon={<DownloadOutlined />} 
                      style={{ width: '100%', borderRadius: 100 }}
                      onClick={() => {
                        // Demo: just download the first one or alert if multiple. For now we follow the UI flow.
                        if (r.tickets[0]) void onDownloadPdf(r.tickets[0].qrCode)
                      }}
                    >
                      TẢI VÉ PDF
                    </Button>
                  ) : r.status === 'Paid' ? (
                    <Typography.Text style={{ color: '#00fa9a' }}>Đã xuất vé</Typography.Text>
                  ) : (
                    <Typography.Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>
                      Vé điện tử sẽ hiển thị sau khi thanh toán
                    </Typography.Text>
                  )}
                </div>
              </div>
            ))
          )}
        </Space>
      </Content>
    </Layout>
  )
}
