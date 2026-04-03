import { DeleteOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons'
import {
  Button,
  Card,
  DatePicker,
  Form,
  InputNumber,
  Modal,
  Popconfirm,
  Select,
  Space,
  Table,
  Typography,
  message,
} from 'antd'
import dayjs, { type Dayjs } from 'dayjs'
import { useEffect, useState } from 'react'
import { listAuditoriums } from '../../services/auditoriumService'
import { getNowShowingMovies } from '../../services/movieService'
import { createShowtime, deleteShowtime, listShowtimes } from '../../services/showtimeService'
import type { AuditoriumListItem } from '../../types/auditorium'
import type { Movie } from '../../types/movie'
import type { Showtime } from '../../types/showtime'
import { mapApiError } from '../../utils/error'

export function AdminShowtimesPage() {
  const [rows, setRows] = useState<Showtime[]>([])
  const [movies, setMovies] = useState<Movie[]>([])
  const [rooms, setRooms] = useState<AuditoriumListItem[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form] = Form.useForm<{
    movieId: number
    auditoriumId: number
    startTime: Dayjs
    price: number
  }>()
  const [api, contextHolder] = message.useMessage()

  async function load() {
    setLoading(true)
    try {
      const [st, mv, rm] = await Promise.all([
        listShowtimes(),
        getNowShowingMovies(),
        listAuditoriums(),
      ])
      setRows(st)
      setMovies(mv)
      setRooms(rm)
    } catch (e) {
      api.error(mapApiError(e).message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  async function onCreate(values: {
    movieId: number
    auditoriumId: number
    startTime: Dayjs
    price: number
  }) {
    setSubmitting(true)
    try {
      await createShowtime({
        movieId: values.movieId,
        auditoriumId: values.auditoriumId,
        startTime: values.startTime.toISOString(),
        price: values.price,
      })
      api.success('Tạo suất chiếu thành công.')
      setOpen(false)
      form.resetFields()
      await load()
    } catch (e) {
      api.error(mapApiError(e).message)
    } finally {
      setSubmitting(false)
    }
  }

  async function onDelete(id: number) {
    try {
      api.success(await deleteShowtime(id))
      await load()
    } catch (e) {
      api.error(mapApiError(e).message)
    }
  }

  return (
    <Card className="cinema-card" title={<span style={{ color: '#fff' }}>Quản lý lịch chiếu</span>}>
      {contextHolder}
      <Typography.Paragraph style={{ color: '#b8c7ff' }}>
        Tạo suất chiếu gắn phim + phòng + giờ + giá vé. Khách chọn suất trên trang đặt vé; phòng được xác định theo suất.
      </Typography.Paragraph>
      <Space style={{ marginBottom: 12 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen(true)}>
          Thêm suất chiếu
        </Button>
        <Button icon={<ReloadOutlined />} onClick={() => void load()}>
          Tải lại
        </Button>
      </Space>

      <Table<Showtime>
        rowKey="id"
        loading={loading}
        dataSource={rows}
        pagination={{ pageSize: 8 }}
        scroll={{ x: 900 }}
        columns={[
          { title: 'ID', dataIndex: 'id', width: 70 },
          { title: 'Phim', render: (_, r) => r.movie?.name ?? `#${r.movieId}` },
          { title: 'Phòng', render: (_, r) => r.auditorium?.name ?? `#${r.auditoriumId}` },
          {
            title: 'Giờ chiếu',
            render: (_, r) => dayjs(r.startTime).format('DD/MM/YYYY HH:mm'),
          },
          { title: 'Giá vé', dataIndex: 'price', width: 100 },
          {
            title: 'Xóa',
            key: 'd',
            width: 100,
            render: (_, r) => (
              <Popconfirm title="Xóa suất? (chỉ khi chưa có vé)" onConfirm={() => void onDelete(r.id)}>
                <Button danger size="small" icon={<DeleteOutlined />}>
                  Xóa
                </Button>
              </Popconfirm>
            ),
          },
        ]}
      />

      <Modal open={open} title="Thêm suất chiếu" onCancel={() => setOpen(false)} footer={null} destroyOnHidden>
        <Form form={form} layout="vertical" onFinish={(v) => void onCreate(v)}>
          <Form.Item name="movieId" label="Phim" rules={[{ required: true }]}>
            <Select
              showSearch
              optionFilterProp="label"
              options={movies.map((m) => ({ value: m.id, label: m.name }))}
            />
          </Form.Item>
          <Form.Item name="auditoriumId" label="Phòng chiếu" rules={[{ required: true }]}>
            <Select options={rooms.map((r) => ({ value: r.id, label: r.name }))} />
          </Form.Item>
          <Form.Item name="startTime" label="Thời gian bắt đầu" rules={[{ required: true }]}>
            <DatePicker showTime style={{ width: '100%' }} format="DD/MM/YYYY HH:mm" />
          </Form.Item>
          <Form.Item name="price" label="Giá vé (1 ghế)" rules={[{ required: true }]}>
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={submitting} block>
            Tạo suất
          </Button>
        </Form>
      </Modal>
    </Card>
  )
}
