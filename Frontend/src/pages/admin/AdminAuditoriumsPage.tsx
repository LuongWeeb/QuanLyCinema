import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  ReloadOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons'
import {
  Button,
  Card,
  Divider,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  Typography,
  message,
} from 'antd'
import { useCallback, useEffect, useState } from 'react'

const { TextArea } = Input
import {
  addSeat,
  addSeatsByRow,
  bulkSetSeatVip,
  createAuditorium,
  deleteAuditorium,
  deleteSeat,
  listAuditoriums,
  listSeats,
  updateAuditorium,
  updateSeat,
} from '../../services/auditoriumService'
import type { AuditoriumListItem, Seat } from '../../types/auditorium'
import { mapApiError } from '../../utils/error'
import { sortSeatsForDisplay } from '../../utils/seatSort'

const ROW_OPTIONS = Array.from({ length: 26 }, (_, i) => ({
  value: i,
  label: `Hàng ${String.fromCharCode(65 + i)}`,
}))

export function AdminAuditoriumsPage() {
  const [rooms, setRooms] = useState<AuditoriumListItem[]>([])
  const [loading, setLoading] = useState(false)
  const [roomModal, setRoomModal] = useState(false)
  const [editingRoom, setEditingRoom] = useState<AuditoriumListItem | null>(null)
  const [roomSubmit, setRoomSubmit] = useState(false)
  const [roomForm] = Form.useForm<{ name: string; capacity: number; seatCodesText?: string }>()

  const [seatModalOpen, setSeatModalOpen] = useState(false)
  const [seatRoom, setSeatRoom] = useState<AuditoriumListItem | null>(null)
  const [seats, setSeats] = useState<Seat[]>([])
  const [seatsLoading, setSeatsLoading] = useState(false)
  const [addSeatOpen, setAddSeatOpen] = useState(false)
  const [editSeat, setEditSeat] = useState<Seat | null>(null)
  const [seatForm] = Form.useForm<{ seatCode: string; isVip: boolean }>()
  const [batchSeatForm] = Form.useForm<{
    rowIndex: number
    startNumber: number
    count: number
    isVip: boolean
  }>()
  const [selectedSeatIds, setSelectedSeatIds] = useState<number[]>([])
  const [batchSubmitting, setBatchSubmitting] = useState(false)
  const [api, contextHolder] = message.useMessage()

  const loadRooms = useCallback(async () => {
    setLoading(true)
    try {
      setRooms(await listAuditoriums())
    } catch (e) {
      api.error(mapApiError(e).message)
    } finally {
      setLoading(false)
    }
  }, [api])

  useEffect(() => {
    void loadRooms()
  }, [loadRooms])

  async function openSeats(r: AuditoriumListItem) {
    setSeatRoom(r)
    setSelectedSeatIds([])
    setSeatModalOpen(true)
    setSeatsLoading(true)
    try {
      setSeats(await listSeats(r.id))
    } catch (e) {
      api.error(mapApiError(e).message)
    } finally {
      setSeatsLoading(false)
    }
  }

  async function refreshSeats() {
    if (!seatRoom) return
    setSeatsLoading(true)
    try {
      setSeats(await listSeats(seatRoom.id))
      await loadRooms()
    } catch (e) {
      api.error(mapApiError(e).message)
    } finally {
      setSeatsLoading(false)
    }
  }

  function openCreateRoom() {
    setEditingRoom(null)
    roomForm.resetFields()
    setRoomModal(true)
  }

  function openEditRoom(r: AuditoriumListItem) {
    setEditingRoom(r)
    roomForm.setFieldsValue({ name: r.name, capacity: r.capacity })
    setRoomModal(true)
  }

  async function saveRoom(values: { name: string; capacity: number; seatCodesText?: string }) {
    setRoomSubmit(true)
    try {
      if (editingRoom) {
        await updateAuditorium(editingRoom.id, {
          name: values.name.trim(),
          capacity: values.capacity,
        })
        api.success('Cập nhật phòng thành công.')
      } else {
        const raw = values.seatCodesText?.trim() || ''
        const codes = raw
          .split(/[\n,;]+/)
          .map((s) => s.trim())
          .filter(Boolean)
        if (codes.length === 0) {
          api.warning('Nhập ít nhất một mã ghế (mỗi dòng hoặc cách nhau bởi dấu phẩy).')
          setRoomSubmit(false)
          return
        }
        await createAuditorium({
          name: values.name.trim(),
          capacity: values.capacity,
          seatCodes: codes,
        })
        api.success('Tạo phòng và ghế thành công.')
      }
      setRoomModal(false)
      await loadRooms()
    } catch (e) {
      api.error(mapApiError(e).message)
    } finally {
      setRoomSubmit(false)
    }
  }

  async function removeRoom(id: number) {
    try {
      api.success(await deleteAuditorium(id))
      await loadRooms()
    } catch (e) {
      api.error(mapApiError(e).message)
    }
  }

  function toggleSeatSelection(seatId: number) {
    setSelectedSeatIds((prev) =>
      prev.includes(seatId) ? prev.filter((x) => x !== seatId) : [...prev, seatId],
    )
  }

  async function submitBatchRow(values: {
    rowIndex: number
    startNumber: number
    count: number
    isVip: boolean
  }) {
    if (!seatRoom) return
    setBatchSubmitting(true)
    try {
      const res = await addSeatsByRow(seatRoom.id, {
        rowIndex: values.rowIndex,
        startNumber: values.startNumber,
        count: values.count,
        isVip: values.isVip,
      })
      api.success(`Đã thêm ${res.added} ghế (${res.codes.slice(0, 5).join(', ')}${res.codes.length > 5 ? '…' : ''}).`)
      setSelectedSeatIds([])
      await refreshSeats()
    } catch (e) {
      api.error(mapApiError(e).message)
    } finally {
      setBatchSubmitting(false)
    }
  }

  async function applyBulkVip(isVip: boolean) {
    if (!seatRoom || selectedSeatIds.length === 0) return
    try {
      await bulkSetSeatVip(seatRoom.id, selectedSeatIds, isVip)
      api.success(isVip ? 'Đã đặt VIP cho ghế đã chọn.' : 'Đã đặt ghế thường.')
      setSelectedSeatIds([])
      await refreshSeats()
    } catch (e) {
      api.error(mapApiError(e).message)
    }
  }

  async function removeSelectedSeats() {
    if (!seatRoom || selectedSeatIds.length === 0) return
    try {
      for (const id of selectedSeatIds) {
        await deleteSeat(seatRoom.id, id)
      }
      api.success(`Đã xóa ${selectedSeatIds.length} ghế.`)
      setSelectedSeatIds([])
      await refreshSeats()
    } catch (e) {
      api.error(mapApiError(e).message)
    }
  }

  async function saveSeatCode(values: { seatCode: string; isVip: boolean }) {
    if (!seatRoom) return
    setRoomSubmit(true)
    try {
      if (editSeat) {
        await updateSeat(seatRoom.id, editSeat.id, values.seatCode.trim(), values.isVip)
        api.success('Cập nhật ghế thành công.')
      } else {
        await addSeat(seatRoom.id, values.seatCode.trim(), values.isVip)
        api.success('Thêm ghế thành công.')
      }
      seatForm.resetFields()
      setAddSeatOpen(false)
      setEditSeat(null)
      await refreshSeats()
    } catch (e) {
      api.error(mapApiError(e).message)
    } finally {
      setRoomSubmit(false)
    }
  }

  async function removeSeat(s: Seat) {
    if (!seatRoom) return
    try {
      api.success(await deleteSeat(seatRoom.id, s.id))
      await refreshSeats()
    } catch (e) {
      api.error(mapApiError(e).message)
    }
  }

  return (
    <Card className="cinema-card" title={<span style={{ color: '#fff' }}>Quản lý phòng chiếu & ghế</span>}>
      {contextHolder}
      <Typography.Paragraph style={{ color: '#b8c7ff' }}>
        Tạo phòng kèm danh sách ghế ban đầu. Trong phòng: lưới tối đa 20 ghế một hàng (tự xuống dòng), click chọn nhiều
        ghế, thêm nhanh theo hàng A–Z, VIP có màu vàng và giá vé ×1,5 khi khách đặt.
      </Typography.Paragraph>
      <Space style={{ marginBottom: 12 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreateRoom}>
          Thêm phòng
        </Button>
        <Button icon={<ReloadOutlined />} onClick={() => void loadRooms()}>
          Tải lại
        </Button>
      </Space>

      <Table<AuditoriumListItem>
        rowKey="id"
        loading={loading}
        dataSource={rooms}
        pagination={{ pageSize: 6 }}
        columns={[
          { title: 'ID', dataIndex: 'id', width: 70 },
          { title: 'Tên phòng', dataIndex: 'name' },
          { title: 'Sức chứa (khai báo)', dataIndex: 'capacity', width: 140 },
          { title: 'Số ghế thực tế', dataIndex: 'seatCount', width: 130 },
          {
            title: 'Thao tác',
            key: 'a',
            width: 280,
            render: (_, r) => (
              <Space wrap>
                <Button icon={<UnorderedListOutlined />} onClick={() => void openSeats(r)}>
                  Ghế
                </Button>
                <Button icon={<EditOutlined />} onClick={() => openEditRoom(r)}>
                  Sửa phòng
                </Button>
                <Popconfirm title="Xóa phòng? (chỉ khi chưa có suất chiếu)" onConfirm={() => void removeRoom(r.id)}>
                  <Button danger icon={<DeleteOutlined />}>
                    Xóa
                  </Button>
                </Popconfirm>
              </Space>
            ),
          },
        ]}
      />

      <Modal
        open={roomModal}
        title={editingRoom ? 'Sửa phòng chiếu' : 'Thêm phòng chiếu'}
        onCancel={() => setRoomModal(false)}
        footer={null}
        destroyOnHidden
      >
        <Form form={roomForm} layout="vertical" onFinish={(v) => void saveRoom(v)}>
          <Form.Item name="name" label="Tên phòng" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="capacity" label="Sức chứa" rules={[{ required: true }]}>
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
          {!editingRoom ? (
            <Form.Item
              name="seatCodesText"
              label="Danh sách mã ghế (mỗi dòng một mã, hoặc cách nhau bởi dấu phẩy)"
              rules={[{ required: true, message: 'Nhập mã ghế.' }]}
            >
              <TextArea rows={6} placeholder="A1&#10;A2&#10;A3" />
            </Form.Item>
          ) : null}
          <Button type="primary" htmlType="submit" loading={roomSubmit} block>
            Lưu
          </Button>
        </Form>
      </Modal>

      <Modal
        open={seatModalOpen}
        title={seatRoom ? `Ghế — ${seatRoom.name}` : 'Ghế'}
        onCancel={() => {
          setSeatModalOpen(false)
          setSeatRoom(null)
          setSelectedSeatIds([])
        }}
        footer={null}
        width={960}
        destroyOnHidden
      >
        <Typography.Paragraph style={{ color: '#b8c7ff', marginBottom: 8 }}>
          Ô vàng = VIP (×1,5 giá vé). Click để chọn nhiều ghế; double-click để sửa mã / loại.
        </Typography.Paragraph>
        <Space wrap style={{ marginBottom: 12 }}>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditSeat(null)
              setAddSeatOpen(true)
            }}
          >
            Thêm một ghế
          </Button>
          <Button icon={<ReloadOutlined />} onClick={() => void refreshSeats()}>
            Tải lại ghế
          </Button>
        </Space>

        <Divider plain style={{ color: '#8fa8ff' }}>
          Thêm nhanh theo hàng (A, B, C…)
        </Divider>
        <Form
          form={batchSeatForm}
          layout="vertical"
          initialValues={{ rowIndex: 0, startNumber: 1, count: 8, isVip: false }}
          onFinish={(v) => void submitBatchRow(v)}
          style={{ marginBottom: 16 }}
        >
          <Space wrap align="start">
            <Form.Item name="rowIndex" label="Hàng" rules={[{ required: true }]}>
              <Select options={ROW_OPTIONS} style={{ width: 160 }} />
            </Form.Item>
            <Form.Item name="startNumber" label="Bắt đầu từ số" rules={[{ required: true }]}>
              <InputNumber min={1} max={999} />
            </Form.Item>
            <Form.Item name="count" label="Số lượng" rules={[{ required: true }]}>
              <InputNumber min={1} max={80} />
            </Form.Item>
            <Form.Item name="isVip" label="Loại" valuePropName="checked">
              <Switch checkedChildren="VIP" unCheckedChildren="Thường" />
            </Form.Item>
            <Form.Item label=" ">
              <Button type="primary" htmlType="submit" loading={batchSubmitting}>
                Thêm dải ghế
              </Button>
            </Form.Item>
          </Space>
        </Form>

        {selectedSeatIds.length > 0 ? (
          <Space wrap style={{ marginBottom: 12 }}>
            <Typography.Text style={{ color: '#ffd666' }}>Đã chọn: {selectedSeatIds.length}</Typography.Text>
            <Button size="small" onClick={() => void applyBulkVip(true)}>
              Đặt VIP
            </Button>
            <Button size="small" onClick={() => void applyBulkVip(false)}>
              Đặt thường
            </Button>
            <Popconfirm
              title={`Xóa ${selectedSeatIds.length} ghế đã chọn?`}
              onConfirm={() => void removeSelectedSeats()}
            >
              <Button size="small" danger>
                Xóa đã chọn
              </Button>
            </Popconfirm>
            <Button size="small" type="link" onClick={() => setSelectedSeatIds([])}>
              Bỏ chọn
            </Button>
          </Space>
        ) : null}

        <Divider plain style={{ color: '#8fa8ff' }}>
          Sơ đồ ghế (tối đa 20 ô / hàng)
        </Divider>
        <div style={{ minHeight: 80 }}>
          {seatsLoading ? (
            <Typography.Text style={{ color: '#b8c7ff' }}>Đang tải…</Typography.Text>
          ) : (
            <div className="admin-seat-grid">
              {sortSeatsForDisplay(seats).map((s) => {
                const sel = selectedSeatIds.includes(s.id)
                const vip = Boolean(s.isVip)
                return (
                  <button
                    key={s.id}
                    type="button"
                    className={`admin-seat-cell ${vip ? 'vip' : ''} ${sel ? 'selected' : ''}`}
                    title={`ID ${s.id} · ${vip ? 'VIP' : 'Thường'}`}
                    onClick={() => toggleSeatSelection(s.id)}
                    onDoubleClick={(e) => {
                      e.preventDefault()
                      setEditSeat(s)
                      setAddSeatOpen(true)
                    }}
                  >
                    {s.seatCode}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        <Divider plain style={{ color: '#8fa8ff' }}>
          Bảng chi tiết
        </Divider>
        <Table<Seat>
          rowKey="id"
          loading={seatsLoading}
          dataSource={seats}
          size="small"
          pagination={{ pageSize: 8 }}
          columns={[
            { title: 'ID', dataIndex: 'id', width: 70 },
            { title: 'Mã ghế', dataIndex: 'seatCode' },
            {
              title: 'Loại',
              key: 'vip',
              width: 90,
              render: (_, s) => (s.isVip ? <Tag color="gold">VIP</Tag> : 'Thường'),
            },
            {
              title: 'Thao tác',
              key: 's',
              width: 180,
              render: (_, s) => (
                <Space>
                  <Button
                    size="small"
                    icon={<EditOutlined />}
                    onClick={() => {
                      setEditSeat(s)
                      setAddSeatOpen(true)
                    }}
                  >
                    Sửa
                  </Button>
                  <Popconfirm title="Xóa ghế?" onConfirm={() => void removeSeat(s)}>
                    <Button size="small" danger icon={<DeleteOutlined />}>
                      Xóa
                    </Button>
                  </Popconfirm>
                </Space>
              ),
            },
          ]}
        />
      </Modal>

      <Modal
        open={addSeatOpen}
        title={editSeat ? 'Sửa mã ghế' : 'Thêm ghế'}
        onCancel={() => {
          setAddSeatOpen(false)
          setEditSeat(null)
        }}
        footer={null}
        destroyOnHidden
        afterOpenChange={(open) => {
          if (open) {
            if (editSeat) {
              seatForm.setFieldsValue({
                seatCode: editSeat.seatCode,
                isVip: Boolean(editSeat.isVip),
              })
            } else {
              seatForm.resetFields()
              seatForm.setFieldsValue({ isVip: false })
            }
          }
        }}
      >
        <Form form={seatForm} layout="vertical" onFinish={(v) => void saveSeatCode(v)}>
          <Form.Item name="seatCode" label="Mã ghế" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="isVip" label="Ghế VIP (×1,5 giá khi đặt vé)" valuePropName="checked">
            <Switch checkedChildren="VIP" unCheckedChildren="Thường" />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={roomSubmit} block>
            Lưu
          </Button>
        </Form>
      </Modal>
    </Card>
  )
}
