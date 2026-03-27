import { Alert, Button, Card, Form, Input, Space, Tabs, Typography } from 'antd'

interface LoginFormValues {
  username: string
  password: string
}

interface RegisterFormValues {
  fullName: string
  username: string
  password: string
  confirmPassword: string
}

interface LoginFormCardProps {
  loading: boolean
  errorMessage: string | null
  onLogin: (values: LoginFormValues) => Promise<void>
  onRegister: (values: RegisterFormValues) => Promise<void>
}

export function LoginFormCard({
  loading,
  errorMessage,
  onLogin,
  onRegister,
}: LoginFormCardProps) {
  return (
    <Card
      className="login-card"
      styles={{ body: { padding: 28, background: 'rgba(8, 14, 32, 0.84)' } }}
      style={{ borderRadius: 16 }}
    >
      <Space orientation="vertical" size={16} style={{ width: '100%' }}>
        <div>
          <Typography.Title level={4} style={{ marginBottom: 4 }}>
            Đăng nhập hệ thống
          </Typography.Title>
          <Typography.Text type="secondary">
            Vui lòng sử dụng tài khoản đã được hệ thống cấp quyền.
          </Typography.Text>
        </div>

        {errorMessage ? (
          <Alert
            type="error"
            showIcon
            title="Đăng nhập thất bại"
            description={errorMessage}
          />
        ) : null}

        <Tabs
          defaultActiveKey="login"
          items={[
            {
              key: 'login',
              label: 'Đăng nhập',
              children: (
                <Form<LoginFormValues>
                  layout="vertical"
                  requiredMark={false}
                  onFinish={onLogin}
                  autoComplete="off"
                >
                  <Form.Item
                    label="Tên đăng nhập"
                    name="username"
                    rules={[{ required: true, message: 'Nhập tên đăng nhập.' }]}
                  >
                    <Input
                      size="large"
                      placeholder="Nhập tên đăng nhập"
                      prefix={<img src="/icons/user.svg" alt="" width={16} height={16} />}
                    />
                  </Form.Item>

                  <Form.Item
                    label="Mật khẩu"
                    name="password"
                    rules={[{ required: true, message: 'Nhập mật khẩu.' }]}
                  >
                    <Input.Password
                      size="large"
                      placeholder="Nhập mật khẩu"
                      prefix={<img src="/icons/lock.svg" alt="" width={16} height={16} />}
                    />
                  </Form.Item>

                  <Button type="primary" htmlType="submit" size="large" block loading={loading}>
                    Đăng nhập
                  </Button>
                </Form>
              ),
            },
            {
              key: 'register',
              label: 'Đăng ký',
              children: (
                <Form<RegisterFormValues>
                  layout="vertical"
                  requiredMark={false}
                  onFinish={onRegister}
                  autoComplete="off"
                >
                  <Form.Item
                    label="Họ và tên"
                    name="fullName"
                    rules={[{ required: true, message: 'Nhập họ và tên.' }]}
                  >
                    <Input size="large" placeholder="Nhập họ và tên" />
                  </Form.Item>

                  <Form.Item
                    label="Tên đăng nhập"
                    name="username"
                    rules={[{ required: true, message: 'Nhập tên đăng nhập.' }]}
                  >
                    <Input size="large" placeholder="Nhập tên đăng nhập" />
                  </Form.Item>

                  <Form.Item
                    label="Mật khẩu"
                    name="password"
                    rules={[
                      { required: true, message: 'Nhập mật khẩu.' },
                      { min: 6, message: 'Mật khẩu tối thiểu 6 ký tự.' },
                    ]}
                  >
                    <Input.Password size="large" placeholder="Nhập mật khẩu" />
                  </Form.Item>

                  <Form.Item
                    label="Xác nhận mật khẩu"
                    name="confirmPassword"
                    dependencies={['password']}
                    rules={[
                      { required: true, message: 'Nhập lại mật khẩu.' },
                      ({ getFieldValue }) => ({
                        validator(_, value) {
                          if (!value || getFieldValue('password') === value) {
                            return Promise.resolve()
                          }
                          return Promise.reject(new Error('Mật khẩu xác nhận không khớp.'))
                        },
                      }),
                    ]}
                  >
                    <Input.Password size="large" placeholder="Nhập lại mật khẩu" />
                  </Form.Item>

                  <Button type="primary" htmlType="submit" size="large" block loading={loading}>
                    Tạo tài khoản
                  </Button>
                </Form>
              ),
            },
          ]}
        />

        <Typography.Text type="secondary">
          Bằng cách đăng nhập, bạn đồng ý với điều khoản sử dụng và chính sách bảo mật.
        </Typography.Text>
      </Space>
    </Card>
  )
}
