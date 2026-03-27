import { Alert, Button, Card, Form, Input, Space, Typography } from 'antd'

interface LoginFormValues {
  username: string
  password: string
}

interface LoginFormCardProps {
  loading: boolean
  errorMessage: string | null
  onSubmit: (values: LoginFormValues) => Promise<void>
}

export function LoginFormCard({
  loading,
  errorMessage,
  onSubmit,
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

        <Form<LoginFormValues>
          layout="vertical"
          requiredMark={false}
          onFinish={onSubmit}
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

        <Typography.Text type="secondary">
          Bằng cách đăng nhập, bạn đồng ý với điều khoản sử dụng và chính sách bảo mật.
        </Typography.Text>
      </Space>
    </Card>
  )
}
