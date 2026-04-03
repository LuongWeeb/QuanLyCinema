import {
  DeleteOutlined,
  EditOutlined,
  LockOutlined,
  UnlockOutlined,
  PlusOutlined,
  ReloadOutlined,
  UserAddOutlined,
} from '@ant-design/icons'
import {
  Button,
  Card,
  Form,
  Input,
  Modal,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from 'antd'
import { useEffect, useMemo, useState } from 'react'
import type { TablePaginationConfig } from 'antd'
import {
  assignRole,
  createUser,
  deleteUser,
  getUsersWithRoles,
  removeRole,
  updateUserStatus,
  updateUser,
} from '../../services/authService'
import type {
  CreateUserRequest,
  PagedUsersResponse,
  UpdateUserStatusRequest,
  UpdateUserRequest,
  UserWithRolesResponse,
} from '../../types/auth'
import { mapApiError } from '../../utils/error'

const roleOptions = ['Admin', 'Staff', 'Customer']

export function UserRoleManagementCard() {
  const [users, setUsers] = useState<UserWithRolesResponse[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [selectedRole, setSelectedRole] = useState<Record<number, string>>({})
  const [keyword, setKeyword] = useState('')
  const [filterRole, setFilterRole] = useState<string | undefined>(undefined)
  const [pagination, setPagination] = useState<TablePaginationConfig>({
    current: 1,
    pageSize: 10,
    total: 0,
    showSizeChanger: true,
  })
  const [createOpen, setCreateOpen] = useState(false)
  const [editUser, setEditUser] = useState<UserWithRolesResponse | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [createForm] = Form.useForm<CreateUserRequest>()
  const [editForm] = Form.useForm<UpdateUserRequest>()
  const [api, contextHolder] = message.useMessage()

  async function load(next?: { page?: number; pageSize?: number }) {
    const page = next?.page ?? (pagination.current ?? 1)
    const pageSize = next?.pageSize ?? (pagination.pageSize ?? 10)
    setLoading(true)
    try {
      const data: PagedUsersResponse = await getUsersWithRoles({
        page,
        pageSize,
        keyword: keyword.trim() || undefined,
        role: filterRole,
      })
      setUsers(data.items)
      setTotal(data.total)
      setPagination((prev) => ({
        ...prev,
        current: data.page,
        pageSize: data.pageSize,
        total: data.total,
      }))
    } catch (error) {
      api.error(mapApiError(error).message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load({ page: 1 })
    }, 350)
    return () => window.clearTimeout(timer)
  }, [keyword, filterRole])

  useEffect(() => {
    void load({ page: 1 })
  }, [])

  async function handleAssign(userId: number) {
    const roleName = selectedRole[userId]
    if (!roleName) {
      api.warning('Vui lòng chọn vai trò trước khi gán.')
      return
    }
    try {
      const msg = await assignRole({ userId, roleName })
      api.success(msg)
      await load()
    } catch (error) {
      api.error(mapApiError(error).message)
    }
  }

  async function handleRemove(userId: number, roleName: string) {
    try {
      const msg = await removeRole({ userId, roleName })
      api.success(msg)
      await load()
    } catch (error) {
      api.error(mapApiError(error).message)
    }
  }

  async function handleCreate(values: CreateUserRequest) {
    setSubmitting(true)
    try {
      const msg = await createUser({
        username: values.username.trim(),
        password: values.password,
        fullName: values.fullName.trim(),
        roles: values.roles,
      })
      api.success(msg)
      setCreateOpen(false)
      createForm.resetFields()
      await load({ page: 1 })
    } catch (error) {
      api.error(mapApiError(error).message)
    } finally {
      setSubmitting(false)
    }
  }

  function openEditModal(user: UserWithRolesResponse) {
    setEditUser(user)
    editForm.setFieldsValue({
      userId: user.userId,
      username: user.username,
      fullName: user.fullName,
      password: '',
    })
  }

  async function handleEdit(values: UpdateUserRequest) {
    setSubmitting(true)
    try {
      const msg = await updateUser({
        userId: values.userId,
        username: values.username.trim(),
        fullName: values.fullName.trim(),
        password: values.password?.trim() || undefined,
      })
      api.success(msg)
      setEditUser(null)
      editForm.resetFields()
      await load()
    } catch (error) {
      api.error(mapApiError(error).message)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(userId: number) {
    try {
      const msg = await deleteUser(userId)
      api.success(msg)
      await load()
    } catch (error) {
      api.error(mapApiError(error).message)
    }
  }

  async function handleChangeStatus(payload: UpdateUserStatusRequest) {
    try {
      const msg = await updateUserStatus(payload)
      api.success(msg)
      await load()
    } catch (error) {
      api.error(mapApiError(error).message)
    }
  }

  const columns = useMemo(
    () => [
      {
        title: 'Người dùng',
        key: 'user',
        render: (_: unknown, row: UserWithRolesResponse) => (
          <div>
            <Typography.Text strong style={{ color: '#fff' }}>
              {row.username}
            </Typography.Text>
            <div>
              <Typography.Text style={{ color: '#9fb3ff' }}>{row.fullName}</Typography.Text>
            </div>
          </div>
        ),
      },
      {
        title: 'Ngày tạo',
        key: 'createdAt',
        render: (_: unknown, row: UserWithRolesResponse) => (
          <Typography.Text style={{ color: '#d6e4ff' }}>
            {new Date(row.createdAt).toLocaleString('vi-VN')}
          </Typography.Text>
        ),
      },
      {
        title: 'Trạng thái',
        key: 'status',
        render: (_: unknown, row: UserWithRolesResponse) => {
          const isLocked = row.accountStatus.toLowerCase() === 'locked'
          return (
            <Space>
              <Tag color={isLocked ? 'volcano' : 'green'}>{isLocked ? 'locked' : 'active'}</Tag>
              <Popconfirm
                title={isLocked ? 'Mở khóa tài khoản?' : 'Khóa tài khoản?'}
                okText="Xác nhận"
                cancelText="Hủy"
                onConfirm={() =>
                  void handleChangeStatus({
                    userId: row.userId,
                    status: isLocked ? 'active' : 'locked',
                  })
                }
              >
                <Button icon={isLocked ? <UnlockOutlined /> : <LockOutlined />}>
                  {isLocked ? 'Mở khóa' : 'Khóa'}
                </Button>
              </Popconfirm>
            </Space>
          )
        },
      },
      {
        title: 'Vai trò',
        key: 'roles',
        render: (_: unknown, row: UserWithRolesResponse) => (
          <Space size={[6, 6]} wrap>
            {row.roles.map((r) => (
              <Tag key={`${row.userId}-${r.roleName}`} color="processing">
                {r.roleName}
                <Button
                  type="link"
                  size="small"
                  icon={<DeleteOutlined />}
                  onClick={() => void handleRemove(row.userId, r.roleName)}
                  style={{ paddingInline: 4, marginLeft: 2 }}
                />
              </Tag>
            ))}
          </Space>
        ),
      },
      {
        title: 'Phân quyền',
        key: 'assign',
        render: (_: unknown, row: UserWithRolesResponse) => (
          <Space>
            <Select
              placeholder="Chọn role"
              style={{ width: 140 }}
              value={selectedRole[row.userId]}
              onChange={(value) =>
                setSelectedRole((prev) => ({
                  ...prev,
                  [row.userId]: value,
                }))
              }
              options={roleOptions.map((r) => ({ value: r, label: r }))}
            />
            <Button icon={<PlusOutlined />} onClick={() => void handleAssign(row.userId)}>
              Gán
            </Button>
          </Space>
        ),
      },
      {
        title: 'Quản lý tài khoản',
        key: 'actions',
        render: (_: unknown, row: UserWithRolesResponse) => (
          <Space>
            <Button icon={<EditOutlined />} onClick={() => openEditModal(row)}>
              Sửa
            </Button>
            <Popconfirm
              title="Xóa tài khoản"
              description={`Bạn chắc chắn muốn xóa tài khoản ${row.username}?`}
              okText="Xóa"
              cancelText="Hủy"
              onConfirm={() => void handleDelete(row.userId)}
            >
              <Button danger icon={<DeleteOutlined />}>
                Xóa
              </Button>
            </Popconfirm>
          </Space>
        ),
      },
    ],
    [selectedRole],
  )

  return (
    <Card className="cinema-card" title={<span style={{ color: '#fff' }}>Quản lý tài khoản và phân quyền</span>}>
      {contextHolder}
      <Space wrap style={{ marginBottom: 12 }}>
        <Input
          placeholder="Tìm username hoặc họ tên..."
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          style={{ width: 260 }}
        />
        <Select
          allowClear
          placeholder="Lọc theo vai trò"
          style={{ width: 180 }}
          value={filterRole}
          onChange={(value) => setFilterRole(value)}
          options={roleOptions.map((r) => ({ value: r, label: r }))}
        />
        <Button type="primary" icon={<UserAddOutlined />} onClick={() => setCreateOpen(true)}>
          Thêm tài khoản
        </Button>
        <Button icon={<ReloadOutlined />} onClick={() => void load({ page: pagination.current ?? 1 })}>
          Tải lại
        </Button>
      </Space>
      <Table<UserWithRolesResponse>
        rowKey={(r) => r.userId}
        dataSource={users}
        columns={columns}
        loading={loading}
        pagination={{
          ...pagination,
          total,
          onChange: (page, pageSize) => {
            setPagination((prev) => ({ ...prev, current: page, pageSize }))
            void load({ page, pageSize })
          },
        }}
      />

      <Modal
        open={createOpen}
        title="Thêm tài khoản mới"
        onCancel={() => setCreateOpen(false)}
        footer={null}
        destroyOnHidden
      >
        <Form<CreateUserRequest> form={createForm} layout="vertical" onFinish={(v) => void handleCreate(v)}>
          <Form.Item
            name="fullName"
            label="Họ và tên"
            rules={[{ required: true, message: 'Nhập họ và tên.' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="username"
            label="Tên đăng nhập"
            rules={[{ required: true, message: 'Nhập tên đăng nhập.' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="password"
            label="Mật khẩu"
            rules={[
              { required: true, message: 'Nhập mật khẩu.' },
              { min: 6, message: 'Mật khẩu tối thiểu 6 ký tự.' },
            ]}
          >
            <Input.Password />
          </Form.Item>
          <Form.Item name="roles" label="Vai trò" initialValue={['Customer']}>
            <Select mode="multiple" options={roleOptions.map((r) => ({ value: r, label: r }))} />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={submitting} block>
            Tạo tài khoản
          </Button>
        </Form>
      </Modal>

      <Modal
        open={Boolean(editUser)}
        title="Cập nhật tài khoản"
        onCancel={() => setEditUser(null)}
        footer={null}
        destroyOnHidden
      >
        <Form<UpdateUserRequest> form={editForm} layout="vertical" onFinish={(v) => void handleEdit(v)}>
          <Form.Item name="userId" hidden>
            <Input type="hidden" />
          </Form.Item>
          <Form.Item
            name="fullName"
            label="Họ và tên"
            rules={[{ required: true, message: 'Nhập họ và tên.' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="username"
            label="Tên đăng nhập"
            rules={[{ required: true, message: 'Nhập tên đăng nhập.' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="password" label="Mật khẩu mới (không bắt buộc)">
            <Input.Password />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={submitting} block>
            Lưu thay đổi
          </Button>
        </Form>
      </Modal>
    </Card>
  )
}
