import { CheckOutlined, CloseOutlined, DollarOutlined, ReloadOutlined } from '@ant-design/icons'
import {
  Button,
  Card,
  Modal,
  Popconfirm,
  Select,
  Space,
  Table,
  Tabs,
  Typography,
  message,
} from 'antd'
import dayjs from 'dayjs'
import { useCallback, useEffect, useState } from 'react'
import { payReservation } from '../../services/bookingService'
import {
  approveReservation,
  listAwaitingPayment,
  listPendingApprovals,
  rejectReservation,
} from '../../services/pendingReservationService'
import type { PendingReservationAdmin } from '../../types/pendingReservation'
import { mapApiError } from '../../utils/error'

export function PendingApprovalsPanel() {
  const [approvalRows, setApprovalRows] = useState<PendingReservationAdmin[]>([])
  const [paymentRows, setPaymentRows] = useState<PendingReservationAdmin[]>([])
  const [loadingA, setLoadingA] = useState(true)
  const [loadingP, setLoadingP] = useState(true)
  const [busyId, setBusyId] = useState<number | null>(null)
  const [payOpen, setPayOpen] = useState(false)
  const [payReservationId, setPayReservationId] = useState<number | null>(null)
  const [payMethod, setPayMethod] = useState('Tiền mặt tại quầy')

  const loadApprovals = useCallback(async () => {
    setLoadingA(true)
    try {
      setApprovalRows(await listPendingApprovals())
    } catch (e) {
      message.error(mapApiError(e).message)
    } finally {
      setLoadingA(false)
    }
  }, [])

  const loadPayments = useCallback(async () => {
    setLoadingP(true)
    try {
      setPaymentRows(await listAwaitingPayment())
    } catch (e) {
      message.error(mapApiError(e).message)
    } finally {
      setLoadingP(false)
    }
  }, [])

  const loadAll = useCallback(async () => {
    await Promise.all([loadApprovals(), loadPayments()])
  }, [loadApprovals, loadPayments])

  useEffect(() => {
    void loadAll()
  }, [loadAll])

  async function onApprove(id: number) {
    setBusyId(id)
    try {
      const msg = await approveReservation(id)
      message.success(msg)
      await loadAll()
    } catch (e) {
      message.error(mapApiError(e).message)
    } finally {
      setBusyId(null)
    }
  }

  async function onReject(id: number) {
    setBusyId(id)
    try {
      const msg = await rejectReservation(id)
      message.success(msg)
      await loadAll()
    } catch (e) {
      message.error(mapApiError(e).message)
    } finally {
      setBusyId(null)
    }
  }

  function openPay(id: number) {
    setPayReservationId(id)
    setPayMethod('Tiền mặt tại quầy')
    setPayOpen(true)
  }

  async function confirmPay() {
    if (payReservationId == null) return
    setBusyId(payReservationId)
    try {
      const msg = await payReservation(payReservationId, payMethod)
      message.success(msg)
      setPayOpen(false)
      setPayReservationId(null)
      await loadAll()
    } catch (e) {
      message.error(mapApiError(e).message)
    } finally {
      setBusyId(null)
    }
  }

  const approvalColumns = [
    { title: 'Mã', dataIndex: 'id', width: 72 },
    {
      title: 'Khách',
      render: (_: unknown, r: PendingReservationAdmin) => (
        <Space orientation="vertical" size={0}>
          <Typography.Text style={{ color: '#fff' }}>{r.customerFullName}</Typography.Text>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            @{r.customerUsername}
          </Typography.Text>
        </Space>
      ),
    },
    { title: 'Phim', dataIndex: 'movieName', ellipsis: true },
    {
      title: 'Suất',
      render: (_: unknown, r: PendingReservationAdmin) => dayjs(r.startTime).format('DD/MM/YYYY HH:mm'),
    },
    { title: 'Phòng', dataIndex: 'auditoriumName', width: 120 },
    {
      title: 'Ghế',
      render: (_: unknown, r: PendingReservationAdmin) => (r.seatCodes?.length ? r.seatCodes.join(', ') : '—'),
    },
    {
      title: 'Tổng',
      width: 120,
      render: (_: unknown, r: PendingReservationAdmin) => `${Number(r.totalAmount).toLocaleString('vi-VN')} ₫`,
    },
    {
      title: '',
      key: 'actions',
      width: 200,
      render: (_: unknown, r: PendingReservationAdmin) => (
        <Space wrap>
          <Button
            type="primary"
            size="small"
            icon={<CheckOutlined />}
            loading={busyId === r.id}
            onClick={() => void onApprove(r.id)}
          >
            Duyệt
          </Button>
          <Popconfirm
            title="Từ chối đơn này?"
            description="Ghế sẽ được mở lại cho suất chiếu."
            okText="Từ chối"
            cancelText="Hủy"
            onConfirm={() => void onReject(r.id)}
          >
            <Button danger size="small" icon={<CloseOutlined />} loading={busyId === r.id}>
              Từ chối
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  const paymentColumns = [
    { title: 'Mã', dataIndex: 'id', width: 72 },
    {
      title: 'Khách',
      render: (_: unknown, r: PendingReservationAdmin) => (
        <Space orientation="vertical" size={0}>
          <Typography.Text style={{ color: '#fff' }}>{r.customerFullName}</Typography.Text>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            @{r.customerUsername}
          </Typography.Text>
        </Space>
      ),
    },
    { title: 'Phim', dataIndex: 'movieName', ellipsis: true },
    {
      title: 'Suất',
      render: (_: unknown, r: PendingReservationAdmin) => dayjs(r.startTime).format('DD/MM/YYYY HH:mm'),
    },
    { title: 'Phòng', dataIndex: 'auditoriumName', width: 120 },
    {
      title: 'Ghế',
      render: (_: unknown, r: PendingReservationAdmin) => (r.seatCodes?.length ? r.seatCodes.join(', ') : '—'),
    },
    {
      title: 'Tổng',
      width: 120,
      render: (_: unknown, r: PendingReservationAdmin) => `${Number(r.totalAmount).toLocaleString('vi-VN')} ₫`,
    },
    {
      title: '',
      key: 'pay',
      width: 140,
      render: (_: unknown, r: PendingReservationAdmin) => (
        <Button
          type="primary"
          size="small"
          icon={<DollarOutlined />}
          loading={busyId === r.id}
          onClick={() => openPay(r.id)}
        >
          Thu tiền
        </Button>
      ),
    },
  ]

  return (
    <Card
      className="cinema-card"
      title={<span style={{ color: '#fff' }}>Đặt vé — duyệt và thanh toán</span>}
      extra={
        <Button icon={<ReloadOutlined />} onClick={() => void loadAll()} loading={loadingA || loadingP}>
          Làm mới
        </Button>
      }
    >
      <Typography.Paragraph style={{ color: '#b8c7ff', marginTop: 0 }}>
        Đơn mới vào trạng thái chờ duyệt. Sau khi duyệt, khách thanh toán trên mục Vé của tôi hoặc nhân viên thu tiền tại
        quầy ở tab chờ thanh toán.
      </Typography.Paragraph>
      <Tabs
        items={[
          {
            key: 'approval',
            label: `Chờ duyệt (${approvalRows.length})`,
            children: (
              <Table<PendingReservationAdmin>
                rowKey="id"
                loading={loadingA}
                pagination={false}
                dataSource={approvalRows}
                scroll={{ x: true }}
                columns={approvalColumns}
              />
            ),
          },
          {
            key: 'pay',
            label: `Chờ thanh toán (${paymentRows.length})`,
            children: (
              <Table<PendingReservationAdmin>
                rowKey="id"
                loading={loadingP}
                pagination={false}
                dataSource={paymentRows}
                scroll={{ x: true }}
                columns={paymentColumns}
              />
            ),
          },
        ]}
      />

      <Modal
        title="Xác nhận thanh toán tại quầy"
        open={payOpen}
        onCancel={() => {
          setPayOpen(false)
          setPayReservationId(null)
        }}
        onOk={() => void confirmPay()}
        confirmLoading={payReservationId != null && busyId === payReservationId}
        okText="Xác nhận"
      >
        <Space orientation="vertical" style={{ width: '100%' }}>
          <Typography.Text type="secondary">Mã đặt chỗ: {payReservationId}</Typography.Text>
          <Select
            style={{ width: '100%' }}
            value={payMethod}
            onChange={setPayMethod}
            options={[
              { value: 'Tiền mặt tại quầy', label: 'Tiền mặt tại quầy' },
              { value: 'Thẻ tại quầy', label: 'Thẻ tại quầy' },
              { value: 'Chuyển khoản', label: 'Chuyển khoản' },
            ]}
          />
        </Space>
      </Modal>
    </Card>
  )
}
