import { Col, Layout, Row, Space, Statistic, message } from 'antd'
import { useState } from 'react'
import { LoginFormCard } from '../components/auth/LoginFormCard'
import { LoginHeader } from '../components/auth/LoginHeader'
import { login } from '../services/authService'
import type { LoginResponse } from '../types/auth'
import { mapApiError } from '../utils/error'

const { Content } = Layout

interface LoginPageProps {
  onLoginSuccess: (user: LoginResponse) => void
}

export function LoginPage({ onLoginSuccess }: LoginPageProps) {
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [api, contextHolder] = message.useMessage()

  async function handleLogin(values: { username: string; password: string }) {
    setLoading(true)
    setErrorMessage(null)

    try {
      const result = await login({
        username: values.username.trim(),
        password: values.password,
      })

      localStorage.setItem('token', result.accessToken)
      localStorage.setItem('currentUser', JSON.stringify(result))
      onLoginSuccess(result)
      api.success(`Đăng nhập thành công: ${result.username} (${result.role})`)
    } catch (error) {
      const detail = mapApiError(error)
      setErrorMessage(detail.message)
      api.error(detail.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout className="login-layout">
      {contextHolder}
      <Content className="login-content">
        <Row gutter={[24, 24]} align="middle" justify="center">
          <Col xs={24} md={12}>
            <Space orientation="vertical" size={20} style={{ width: '100%' }}>
              <LoginHeader />
              <Row gutter={12}>
                <Col span={12}>
                  <Statistic title="Vận hành hệ thống" value="24/7" valueStyle={{ color: '#d6e4ff' }} />
                </Col>
                <Col span={12}>
                  <Statistic title="Dịch vụ" value="Real-time" valueStyle={{ color: '#d6e4ff' }} />
                </Col>
              </Row>
            </Space>
          </Col>

          <Col xs={24} md={10} lg={8}>
            <LoginFormCard
              loading={loading}
              errorMessage={errorMessage}
              onSubmit={handleLogin}
            />
          </Col>
        </Row>
      </Content>
    </Layout>
  )
}
