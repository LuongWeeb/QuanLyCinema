import { Col, Layout, Row, Space, Typography, message } from 'antd'
import { useEffect, useRef, useState } from 'react'
import { PlayCircleOutlined } from '@ant-design/icons'
import { LoginFormCard } from '../components/auth/LoginFormCard'
import { LoginHeader } from '../components/auth/LoginHeader'
import { useAuth } from '../hooks/useAuth'
import { login, register } from '../services/authService'
import { mapApiError } from '../utils/error'

const { Content } = Layout
const { Title, Text } = Typography

const TRAILERS = [
  {
    src: '/trailers/Trailer_DoraemonMovie2026.mp4',
    title: 'Doraemon Movie 2026',
    subtitle: 'Nobita và bản giao hưởng Trái Đất',
    badge: 'HOẠT HÌNH',
    color: '#00b4d8',
  },
  {
    src: '/trailers/Trailer_Spiderman2026.mp4',
    title: 'Spider-Man 2026',
    subtitle: 'Người Nhện trở lại trong sứ mệnh mới',
    badge: 'HÀNH ĐỘNG',
    color: '#e63946',
  },
]

export function LoginPage() {
  const { setCurrentUser } = useAuth()
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [api, contextHolder] = message.useMessage()
  const [activeTrailer, setActiveTrailer] = useState(0)
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.load()
      void videoRef.current.play().catch(() => { /* autoplay may be blocked by browser */ })
    }
  }, [activeTrailer])

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
      setCurrentUser(result)
      api.success(`Đăng nhập thành công: ${result.username} (${result.role})`)
    } catch (error) {
      const detail = mapApiError(error)
      setErrorMessage(detail.message)
      api.error(detail.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleRegister(values: {
    fullName: string
    username: string
    password: string
    confirmPassword: string
  }) {
    setLoading(true)
    setErrorMessage(null)
    try {
      const msg = await register({
        fullName: values.fullName.trim(),
        username: values.username.trim(),
        password: values.password,
      })
      api.success(msg)
    } catch (error) {
      const detail = mapApiError(error)
      setErrorMessage(detail.message)
      api.error(detail.message)
    } finally {
      setLoading(false)
    }
  }

  const current = TRAILERS[activeTrailer]

  return (
    <Layout className="cinematic-login-layout">
      {contextHolder}
      <div className="cinematic-bg-overlay" />
      <div className="ambient-orbs" style={{ zIndex: 0 }}>
        <div className="orb blue-orb" style={{ top: '10%', left: '5%' }} />
        <div className="orb purple-orb" style={{ bottom: '10%', right: '5%' }} />
      </div>

      <Content className="cinematic-login-content" style={{ position: 'relative', zIndex: 1 }}>
        <Row style={{ minHeight: '100vh', width: '100%' }}>

          {/* ── LEFT: Trailer Section ── */}
          <Col xs={0} lg={14} xl={15} className="cinematic-showcase-col">
            <div className="trailer-showcase fade-in-up">

              {/* Brand header */}
              <div className="trailer-brand-row">
                <img src="/icons/cinema.svg" alt="logo" width={36} height={36} className="brand-glow" />
                <Title level={3} style={{ margin: 0, color: '#fff' }}>
                  CineStar<span style={{ color: '#5b7cff' }}>EX</span>
                </Title>
              </div>

              {/* Video Player */}
              <div className="trailer-video-wrapper">
                <div className="trailer-glow-border" style={{ borderColor: current.color + '88' }} />
                <video
                  ref={videoRef}
                  key={current.src}
                  className="trailer-video"
                  autoPlay
                  muted
                  loop
                  playsInline
                  controls
                >
                  <source src={current.src} type="video/mp4" />
                </video>
                {/* Gradient info overlay at the bottom */}
                <div className="trailer-info-overlay">
                  <span className="trailer-badge" style={{ background: current.color }}>
                    <PlayCircleOutlined style={{ marginRight: 6 }} />
                    {current.badge}
                  </span>
                  <Title level={2} className="trailer-movie-title">
                    {current.title}
                  </Title>
                  <Text className="trailer-movie-subtitle">{current.subtitle}</Text>
                </div>
              </div>

              {/* Tab switcher */}
              <div className="trailer-tabs">
                {TRAILERS.map((t, idx) => (
                  <button
                    key={t.src}
                    type="button"
                    className={`trailer-tab ${activeTrailer === idx ? 'active' : ''}`}
                    style={{
                      borderColor: activeTrailer === idx ? t.color : 'rgba(255,255,255,0.12)',
                      boxShadow: activeTrailer === idx ? `0 0 16px ${t.color}99` : 'none',
                    }}
                    onClick={() => setActiveTrailer(idx)}
                  >
                    <span className="trailer-tab-badge" style={{ background: t.color }}>{t.badge}</span>
                    <span className="trailer-tab-title">{t.title}</span>
                  </button>
                ))}
              </div>

              {/* Stats */}
              <div className="trailer-stats-row">
                {[
                  { label: 'Hình ảnh', value: '4K IMAX' },
                  { label: 'Âm thanh', value: 'Dolby Atmos' },
                  { label: 'Ghế VIP', value: 'Premium' },
                ].map((s) => (
                  <div key={s.label} className="trailer-stat">
                    <div className="trailer-stat-value">{s.value}</div>
                    <div className="trailer-stat-label">{s.label}</div>
                  </div>
                ))}
              </div>

            </div>
          </Col>

          {/* ── RIGHT: Login Form ── */}
          <Col xs={24} lg={10} xl={9} className="login-form-col fade-in-up" style={{ animationDelay: '0.15s' }}>
            <div className="login-form-wrapper">
              <Space direction="vertical" size={24} style={{ width: '100%', alignItems: 'center' }}>
                <LoginHeader />
                <LoginFormCard
                  loading={loading}
                  errorMessage={errorMessage}
                  onLogin={handleLogin}
                  onRegister={handleRegister}
                />
              </Space>
            </div>
          </Col>

        </Row>
      </Content>
    </Layout>
  )
}
