import { Modal, Tabs, Form, Input, Button, message, Avatar, Typography } from 'antd'
import { useState, useEffect } from 'react'
import { changePassword, updateProfile } from '../../services/authService'
import { useRecoilState } from 'recoil'
import { currentUserState } from '../../state/recoil/auth'

interface ProfileModalProps {
  open: boolean
  onClose: () => void
}

export function ProfileModal({ open, onClose }: ProfileModalProps) {
  const [currentUser, setCurrentUser] = useRecoilState(currentUserState)
  const [loadingProfile, setLoadingProfile] = useState(false)
  const [loadingPassword, setLoadingPassword] = useState(false)
  const [profileForm] = Form.useForm()
  const [passwordForm] = Form.useForm()
  const [api, contextHolder] = message.useMessage()

  useEffect(() => {
    if (open && currentUser) {
      profileForm.setFieldsValue({
        fullName: currentUser.fullName || '',
        avatarUrl: currentUser.avatarUrl || '',
      })
      passwordForm.resetFields()
    }
  }, [open, currentUser, profileForm, passwordForm])

  async function onSaveProfile(values: { fullName: string; avatarUrl?: string }) {
    if (!currentUser) return
    setLoadingProfile(true)
    try {
      const msg = await updateProfile(values)
      api.success(msg)
      setCurrentUser({
        ...currentUser,
        fullName: values.fullName,
        avatarUrl: values.avatarUrl,
      })
    } catch (error: any) {
      api.error(error?.response?.data?.message || 'Cập nhật thất bại')
    } finally {
      setLoadingProfile(false)
    }
  }

  async function onChangePassword(values: any) {
    if (values.newPassword !== values.confirmPassword) {
      api.error('Mật khẩu xác nhận không khớp.')
      return
    }
    setLoadingPassword(true)
    try {
      const msg = await changePassword({
        oldPassword: values.oldPassword,
        newPassword: values.newPassword,
      })
      api.success(msg)
      passwordForm.resetFields()
    } catch (error: any) {
      api.error(error?.response?.data?.message || 'Đổi mật khẩu thất bại')
    } finally {
      setLoadingPassword(false)
    }
  }

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      title="Tài khoản của tôi"
      destroyOnClose
      width={480}
    >
      {contextHolder}
      <Tabs
        defaultActiveKey="info"
        items={[
          {
            key: 'info',
            label: 'Hồ sơ cá nhân',
            children: (
              <div style={{ paddingTop: 16 }}>
                <div style={{ textAlign: 'center', marginBottom: 24 }}>
                  <Avatar
                    src={profileForm.getFieldValue('avatarUrl') || currentUser?.avatarUrl}
                    size={80}
                    style={{ backgroundColor: '#4f7cff', fontSize: 32 }}
                  >
                    {currentUser?.username?.[0]?.toUpperCase()}
                  </Avatar>
                  <div style={{ marginTop: 8 }}>
                    <Typography.Text strong style={{ fontSize: 18 }}>
                      {currentUser?.username}
                    </Typography.Text>
                    <br />
                    <Typography.Text type="secondary">Vai trò: {currentUser?.role}</Typography.Text>
                  </div>
                </div>

                <Form form={profileForm} layout="vertical" onFinish={onSaveProfile}>
                  <Form.Item
                    name="fullName"
                    label="Họ và Tên"
                    rules={[{ required: true, message: 'Vui lòng nhập họ và tên' }]}
                  >
                    <Input placeholder="Nhập họ và tên" />
                  </Form.Item>
                  <Form.Item name="avatarUrl" label="Link Ảnh đại diện (Avatar URL)">
                    <Input placeholder="https://example.com/avatar.jpg" />
                  </Form.Item>
                  <Button type="primary" htmlType="submit" loading={loadingProfile} block>
                    Lưu Thông Tin
                  </Button>
                </Form>
              </div>
            ),
          },
          {
            key: 'password',
            label: 'Đổi mật khẩu',
            children: (
              <div style={{ paddingTop: 16 }}>
                <Form form={passwordForm} layout="vertical" onFinish={onChangePassword}>
                  <Form.Item
                    name="oldPassword"
                    label="Mật khẩu hiện tại"
                    rules={[{ required: true, message: 'Vui lòng nhập mật khẩu hiện tại' }]}
                  >
                    <Input.Password placeholder="Nhập mật khẩu cũ" />
                  </Form.Item>
                  <Form.Item
                    name="newPassword"
                    label="Mật khẩu mới"
                    rules={[{ required: true, message: 'Vui lòng nhập mật khẩu mới' }]}
                  >
                    <Input.Password placeholder="Nhập mật khẩu mới" />
                  </Form.Item>
                  <Form.Item
                    name="confirmPassword"
                    label="Xác nhận mật khẩu mới"
                    rules={[{ required: true, message: 'Vui lòng xác nhận mật khẩu mới' }]}
                  >
                    <Input.Password placeholder="Nhập lại mật khẩu mới" />
                  </Form.Item>
                  <Button type="primary" htmlType="submit" loading={loadingPassword} block>
                    Cập nhật mật khẩu
                  </Button>
                </Form>
              </div>
            ),
          },
        ]}
      />
    </Modal>
  )
}
