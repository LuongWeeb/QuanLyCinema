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
              <Card
                key={r.id}
                className="cinema-card"
                title={
                  <Space wrap>
                    <span style={{ color: '#fff' }}>{r.movieName}</span>
                    {statusTag(r.status)}
                  </Space>
                }
                extra={
                  <Space wrap>
                    {r.canPay ? (
                      <Button
                        type="primary"
                        size="small"
                        loading={payingId === r.id}
                        onClick={() => void onPay(r.id)}
                      >
                        Thanh toán
                      </Button>
                    ) : null}
                    {r.canCancel ? (
                      <Popconfirm
                        title="Hủy đặt chỗ?"
                        description="Ghế sẽ được trả lại cho suất chiếu này."
                        okText="Hủy đặt"
                        cancelText="Không"
                        onConfirm={() => void onCancel(r.id)}
                      >
                        <Button danger size="small" loading={cancellingId === r.id}>
                          Hủy đặt chỗ
                        </Button>
                      </Popconfirm>
                    ) : null}
                  </Space>
                }
              >
                <Space orientation="vertical" size={8} style={{ width: '100%' }}>
                  <Typography.Text style={{ color: '#b8c7ff' }}>
                    Phòng: <strong style={{ color: '#fff' }}>{r.auditoriumName}</strong>
                  </Typography.Text>
                  <Typography.Text style={{ color: '#b8c7ff' }}>
                    Giờ chiếu:{' '}
                    <strong style={{ color: '#fff' }}>{dayjs(r.startTime).format('DD/MM/YYYY HH:mm')}</strong>
                  </Typography.Text>
                  <Typography.Text style={{ color: '#b8c7ff' }}>
                    Ghế:{' '}
                    <strong style={{ color: '#fff' }}>
                      {r.seatCodes.length > 0 ? r.seatCodes.join(', ') : '—'}
                    </strong>
                  </Typography.Text>
                  {r.status !== 'Cancelled' ? (
                    <Typography.Text style={{ color: '#ffd666' }}>
                      Tổng tiền: {Number(r.totalAmount).toLocaleString('vi-VN')} ₫
                    </Typography.Text>
                  ) : null}

                  {r.tickets.length > 0 ? (
                    <div style={{ marginTop: 8 }}>
                      <Typography.Text style={{ color: '#fff', display: 'block', marginBottom: 8 }}>
                        Vé / QR
                      </Typography.Text>
                      <Space orientation="vertical" size={8} style={{ width: '100%' }}>
                        {r.tickets.map((t) => (
                          <div
                            key={t.qrCode}
                            style={{
                              padding: '8px 12px',
                              borderRadius: 8,
                              background: 'rgba(0,0,0,0.2)',
                              border: '1px solid rgba(127,154,255,0.25)',
                            }}
                          >
                            <Space wrap>
                              <Typography.Text style={{ color: '#e6edff' }}>{t.seatCode}</Typography.Text>
                              {t.checkedIn ? <Tag color="blue">Đã check-in</Tag> : null}
                              <Typography.Text copyable style={{ color: '#9fb3ff', fontSize: 12 }}>
                                {t.qrCode}
                              </Typography.Text>
                              {r.status === 'Paid' ? (
                                <Button
                                  type="link"
                                  size="small"
                                  icon={<DownloadOutlined />}
                                  onClick={() => void onDownloadPdf(t.qrCode)}
                                  style={{ padding: 0 }}
                                >
                                  PDF
                                </Button>
                              ) : null}
                            </Space>
                          </div>
                        ))}
                      </Space>
                    </div>
                  ) : null}
                </Space>
              </Card>
            ))
          )}
        </Space>
      </Content>
    </Layout>
  )
}
