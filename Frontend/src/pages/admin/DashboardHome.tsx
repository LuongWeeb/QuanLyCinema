import {
  BarChartOutlined,
  CalendarOutlined,
  PlaySquareOutlined,
  QrcodeOutlined,
  TeamOutlined,
} from '@ant-design/icons'
import { Card, Col, Row, Space, Statistic, Tag, Typography } from 'antd'
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

export function DashboardHome() {
  const navigate = useNavigate()
  return (
    <>
      <Typography.Title level={2} style={{ color: '#fff', marginTop: 0 }}>
        Hệ thống quản lý rạp phim
      </Typography.Title>
      <Typography.Paragraph style={{ color: '#b8c7ff' }}>
        Chọn module ở menu bên trái để quản lý phim, phòng chiếu, ghế và lịch chiếu. Khách hàng đặt vé qua trang chủ sau
        khi đã có suất chiếu.
      </Typography.Paragraph>

      <div style={{ marginBottom: 20 }}>
        <PendingApprovalsPanel />
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 14 }}>
        <Col xs={24} sm={8}>
          <Card className="cinema-card">
            <Statistic
              title="Module quản trị"
              value={6}
              styles={{ content: { color: '#d6e4ff' } }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card className="cinema-card">
            <Statistic
              title="API đặt vé"
              value="Live"
              styles={{ content: { color: '#d6e4ff' } }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card className="cinema-card">
            <Statistic
              title="Thanh toán"
              value="Demo"
              suffix="flow"
              styles={{ content: { color: '#d6e4ff' } }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        {modules.map((module) => (
          <Col xs={24} md={12} xl={8} key={module.title}>
            <Card
              className="cinema-card module-card"
              hoverable={Boolean(module.path)}
              onClick={module.path ? () => navigate(module.path!) : undefined}
              style={module.path ? { cursor: 'pointer' } : undefined}
            >
              <Space orientation="vertical" size={10}>
                <Typography.Text style={{ color: '#8ea8ff', fontSize: 20 }}>{module.icon}</Typography.Text>
                <Typography.Title level={4} style={{ margin: 0, color: '#fff' }}>
                  {module.title}
                </Typography.Title>
                <Typography.Paragraph style={{ marginBottom: 0, color: '#b8c7ff' }}>
                  {module.desc}
                </Typography.Paragraph>
                <Tag color="processing">{module.badge}</Tag>
              </Space>
            </Card>
          </Col>
        ))}
      </Row>

      <div style={{ marginTop: 16 }}>
        <UserRoleManagementCard />
      </div>
    </>
  )
}
