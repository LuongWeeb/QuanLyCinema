import { DeleteOutlined, EditOutlined, PlusOutlined, ReloadOutlined, UploadOutlined } from '@ant-design/icons'
import { Button, Card, Form, Input, InputNumber, Modal, Popconfirm, Select, Space, Table, Upload, message } from 'antd'
import type { UploadFile } from 'antd/es/upload/interface'
import { useEffect, useState } from 'react'
import {
  createMovie,
  deleteMovie,
  getNowShowingMovies,
  updateMovie,
  uploadMoviePoster,
  type MoviePayload,
} from '../../services/movieService'
import type { Movie } from '../../types/movie'
import { mapApiError } from '../../utils/error'
import { resolveUploadedPosterUrl } from '../../utils/moviePoster'

export function AdminMoviesPage() {
  const [rows, setRows] = useState<Movie[]>([])
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Movie | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [form] = Form.useForm<MoviePayload>()
  const [posterFile, setPosterFile] = useState<File | null>(null)
  const [posterFileList, setPosterFileList] = useState<UploadFile[]>([])
  const [api, contextHolder] = message.useMessage()

  const genreOptions = (() => {
    const common = [
      'Hành động',
      'Phiêu lưu',
      'Khoa học viễn tưởng',
      'Viễn tưởng',
      'Trinh thám',
      'Kinh dị',
      'Tâm lý',
      'Hài hước',
      'Tình cảm',
      'Romance',
      'Gia đình',
      'Hoạt hình',
      'Giả tưởng',
      'Thần thoại',
      'Chiến tranh',
      'Thể thao',
      'Âm nhạc',
      'Bí ẩn',
      'Tâm linh',
      'Dạng tài liệu',
      'Chính kịch',
      // thêm một vài alias phổ biến để map nhanh nếu dữ liệu DB đang dùng tiếng Anh
      'Adventure',
      'Comedy',
      'Drama',
      'Horror',
      'Romance',
    ]

    const uniq = Array.from(
      new Set(rows.map((r) => (r.genre ?? '').trim()).filter(Boolean)),
    )

    const merged = Array.from(new Set([...uniq, ...common]))
    return merged.map((g) => ({ value: g, label: g }))
  })()

  async function load() {
    setLoading(true)
    try {
      const data = await getNowShowingMovies()
      setRows(data)
    } catch (e) {
      api.error(mapApiError(e).message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  function openCreate() {
    setEditing(null)
    setPosterFile(null)
    setPosterFileList([])
    form.resetFields()
    setModalOpen(true)
  }

  function openEdit(m: Movie) {
    setEditing(m)
    setPosterFile(null)
    const url = resolveUploadedPosterUrl(m.posterUrl)
    setPosterFileList(
      url ? [{ uid: '-poster', name: 'poster', status: 'done', url }] : [],
    )
    form.setFieldsValue({
      name: m.name,
      genre: m.genre,
      durationMinutes: m.durationMinutes,
      rating: m.rating,
    })
    setModalOpen(true)
  }

  async function onSubmit(values: MoviePayload) {
    setSubmitting(true)
    try {
      const fileToUpload = posterFile
      if (editing) {
        await updateMovie(editing.id, values)
        if (fileToUpload) {
          await uploadMoviePoster(editing.id, fileToUpload)
        }
        api.success('Cập nhật phim thành công.')
      } else {
        const created = await createMovie(values)
        if (fileToUpload) {
          await uploadMoviePoster(created.id, fileToUpload)
        }
        api.success('Thêm phim thành công.')
      }
      setPosterFile(null)
      setPosterFileList([])
      setModalOpen(false)
      await load()
    } catch (e) {
      api.error(mapApiError(e).message)
    } finally {
      setSubmitting(false)
    }
  }

  async function onDelete(id: number) {
    try {
      const msg = await deleteMovie(id)
      api.success(msg)
      await load()
    } catch (e) {
      api.error(mapApiError(e).message)
    }
  }

  return (
    <Card className="cinema-card" title={<span style={{ color: '#fff' }}>Quản lý phim</span>}>
      {contextHolder}
      <Space style={{ marginBottom: 12 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate} className="btn-glow-primary">
          Thêm phim
        </Button>
        <Button icon={<ReloadOutlined />} onClick={() => void load()}>
          Tải lại
        </Button>
      </Space>
      <Table<Movie>
        rowKey="id"
        loading={loading}
        dataSource={rows}
        pagination={{ pageSize: 8 }}
        columns={[
          { title: 'ID', dataIndex: 'id', width: 70 },
          {
            title: 'Poster',
            key: 'poster',
            width: 88,
            render: (_, m) => {
              const u = resolveUploadedPosterUrl(m.posterUrl)
              return u ? (
                <img src={u} alt="" style={{ maxHeight: 52, borderRadius: 4, objectFit: 'cover' }} />
              ) : (
                '—'
              )
            },
          },
          { title: 'Tên phim', dataIndex: 'name' },
          { title: 'Thể loại', dataIndex: 'genre' },
          { title: 'Phút', dataIndex: 'durationMinutes', width: 90 },
          { title: 'Rating', dataIndex: 'rating', width: 90 },
          {
            title: 'Thao tác',
            key: 'act',
            width: 160,
            render: (_, m) => (
              <Space>
                <Button icon={<EditOutlined />} onClick={() => openEdit(m)}>
                  Sửa
                </Button>
                <Popconfirm title="Xóa phim?" onConfirm={() => void onDelete(m.id)}>
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
        open={modalOpen}
        title={editing ? 'Sửa phim' : 'Thêm phim'}
        onCancel={() => setModalOpen(false)}
        footer={null}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" onFinish={(v) => void onSubmit(v)}>
          <Form.Item name="name" label="Tên phim" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="genre" label="Thể loại" rules={[{ required: true }]}>
            <Select
              showSearch
              allowClear
              placeholder="Chọn thể loại"
              options={genreOptions}
              filterOption={(input, option) => {
                const label = String(option?.label ?? '')
                return label.toLowerCase().includes(input.toLowerCase())
              }}
            />
          </Form.Item>
          <Form.Item name="durationMinutes" label="Thời lượng (phút)" rules={[{ required: true }]}>
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="rating" label="Đánh giá" rules={[{ required: true }]}>
            <InputNumber min={0} max={10} step={0.1} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="Ảnh poster (từ máy)">
            <Upload
              accept="image/jpeg,image/png,image/webp,image/gif"
              maxCount={1}
              fileList={posterFileList}
              beforeUpload={(file) => {
                setPosterFile(file)
                setPosterFileList([
                  {
                    uid: file.uid,
                    name: file.name,
                    status: 'done',
                    url: URL.createObjectURL(file),
                  },
                ])
                return false
              }}
              onRemove={() => {
                setPosterFile(null)
                setPosterFileList([])
              }}
            >
              <Button icon={<UploadOutlined />}>Chọn ảnh</Button>
            </Upload>
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={submitting} block>
            Lưu
          </Button>
        </Form>
      </Modal>
    </Card>
  )
}
