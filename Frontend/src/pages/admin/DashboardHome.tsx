import {
  BarChartOutlined,
  CalendarOutlined,
  PlaySquareOutlined,
  QrcodeOutlined,
  TeamOutlined,
} from '@ant-design/icons'
import { Card, Col, Row, Statistic, Typography } from 'antd'
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { PendingApprovalsPanel } from '../../components/admin/PendingApprovalsPanel'
import { UserRoleManagementCard } from '../../components/admin/UserRoleManagementCard'

const modules: {
  title: string
  desc: string
  icon: ReactNode
  badge: string
  path?: string
}[] = [
  {
    title: 'Quản lý phim',
    desc: 'Thêm, sửa, xóa phim từ menu bên trái.',
    icon: <PlaySquareOutlined />,
    badge: 'Movies',
    path: '/phim',
  },
  {
    title: 'Phòng & ghế',
    desc: 'Tạo phòng, chỉnh sửa ghế theo từng phòng.',
    icon: <CalendarOutlined />,
    badge: 'Rooms',
    path: '/phong',
  },
  {
    title: 'Lịch chiếu',
    desc: 'Tạo suất chiếu để khách đặt vé online.',
    icon: <TeamOutlined />,
    badge: 'Showtimes',
    path: '/lich-chieu',
  },
  {
    title: 'Check-in QR',
    desc: 'API check-in cho nhân viên tại quầy.',
    icon: <QrcodeOutlined />,
    badge: 'Check-in',
  },
  {
    title: 'Báo cáo doanh thu',
    desc: 'Biểu đồ cột doanh thu theo từng phim, theo kỳ thanh toán.',
    icon: <BarChartOutlined />,
    badge: 'Reports',
    path: '/bao-cao',
  },
]

export function DashboardHome({ isAdmin }: { isAdmin: boolean }) {
  const navigate = useNavigate()
  const modulesToShow = isAdmin
    ? modules
    : // Staff chỉ duyệt đơn/chờ thanh toán; không hiển thị các module admin-only.
      []
  return (
    <div className="fade-in-up">
      <Typography.Title level={2} className="gradient-text cyan" style={{ marginTop: 0, marginBottom: 10 }}>
        TRUNG TÂM KIỂM SOÁT
      </Typography.Title>
      <Typography.Paragraph style={{ color: '#8ea8ff', fontSize: '1.1rem' }}>
        Quản lý hệ thống chiếu phim, phòng chiếu, và dữ liệu doanh thu thời gian thực.
      </Typography.Paragraph>

      <div style={{ marginBottom: 20 }}>
        <PendingApprovalsPanel />
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 14 }}>
        <Col xs={24} sm={8}>
          <Card className="glow-card" bordered={false}>
            <Statistic
              title={<span style={{ color: '#8ea8ff' }}>MODULE QUẢN TRỊ</span>}
              value={6}
              valueStyle={{ color: '#00f2fe', fontWeight: 'bold', fontSize: '2.5rem' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card className="glow-card" bordered={false}>
            <Statistic
              title={<span style={{ color: '#8ea8ff' }}>TRẠNG THÁI API ĐẶT VÉ</span>}
              value="ACTIVATE"
              valueStyle={{ color: '#00fa9a', fontWeight: 'bold', fontSize: '2.5rem', textShadow: '0 0 10px rgba(0, 250, 154, 0.4)' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card className="glow-card" bordered={false}>
            <Statistic
              title={<span style={{ color: '#8ea8ff' }}>HỆ THỐNG THANH TOÁN</span>}
              value="SECURE"
              suffix={<span style={{ fontSize: '1rem', color: '#5b7cff' }}>FLOW</span>}
              valueStyle={{ color: '#d8b4fe', fontWeight: 'bold', fontSize: '2.5rem' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
        {modulesToShow.map((module, index) => (
          <Col xs={24} md={12} xl={8} key={module.title}>
            <div
              className={`cyber-feature-card fade-in-up`}
              onClick={module.path ? () => navigate(module.path!) : undefined}
              style={{ cursor: module.path ? 'pointer' : 'default', animationDelay: `${index * 0.1}s` }}
            >
              <div className="feature-icon-wrapper">
                {module.icon}
              </div>
              <Typography.Title level={4} className="feature-title">
                {module.title}
              </Typography.Title>
              <Typography.Paragraph className="feature-desc">
                {module.desc}
              </Typography.Paragraph>
              <div style={{ marginTop: 'auto' }}>
                <span className="cyber-tag">{module.badge}</span>
              </div>
            </div>
          </Col>
        ))}
      </Row>

      {isAdmin ? (
        <div style={{ marginTop: 24, animation: 'fadeInUp 1s ease-out 0.6s both' }}>
          <UserRoleManagementCard />
        </div>
      ) : null}
    </div>
  )
}
