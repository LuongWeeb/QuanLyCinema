import {
  BarChartOutlined,
  CalendarOutlined,
  PlaySquareOutlined,
  QrcodeOutlined,
  TeamOutlined,
} from '@ant-design/icons'
import { Card, Col, Layout, Row, Space, Statistic, Tag, Typography } from 'antd'
import { UserDropdown } from '../components/common/UserDropdown'
import type { LoginResponse } from '../types/auth'

const { Sider, Header, Content } = Layout

interface DashboardPageProps {
  currentUser: LoginResponse
  onLogout: () => void
}

const modules = [
  {
    title: 'Quản lý phim',
    desc: 'Cập nhật danh mục phim, thể loại, thời lượng, đánh giá.',
    icon: <PlaySquareOutlined />,
    badge: 'Movies',
  },
  {
    title: 'Lịch chiếu và ghế',
    desc: 'Cấu hình suất chiếu, phòng chiếu, sơ đồ ghế theo rạp.',
    icon: <CalendarOutlined />,
    badge: 'Showtimes',
  },
  {
    title: 'Đặt vé và thanh toán',
    desc: 'Xử lý đặt ghế online, hóa đơn, thanh toán và xác nhận.',
    icon: <TeamOutlined />,
    badge: 'Booking',
  },
  {
    title: 'Check-in QR',
    desc: 'Quét mã QR tại cổng rạp, kiểm tra trạng thái vé.',
    icon: <QrcodeOutlined />,
    badge: 'Check-in',
  },
  {
    title: 'Báo cáo doanh thu',
    desc: 'Tổng hợp doanh thu theo ngày và suất chiếu đông khách.',
    icon: <BarChartOutlined />,
    badge: 'Reports',
  },
]

export function DashboardPage({ currentUser, onLogout }: DashboardPageProps) {
  return (
    <Layout className="dashboard-layout">
      <Sider breakpoint="lg" collapsedWidth="0" width={250} className="dashboard-sider">
        <div className="brand-block">
          <img src="/icons/cinema.svg" alt="Cinema logo" width={42} height={42} />
          <div>
            <Typography.Title level={5} style={{ margin: 0, color: '#fff' }}>
              QLRapPhim
            </Typography.Title>
            <Typography.Text style={{ color: '#8ea8ff' }}>Cinema Command Center</Typography.Text>
          </div>
        </div>

        <Space orientation="vertical" size={10} style={{ width: '100%' }}>
          <Tag color="blue">Trang chủ</Tag>
          <Tag color="purple">Quản lý phim</Tag>
          <Tag color="gold">Đặt vé online</Tag>
          <Tag color="cyan">Check-in QR</Tag>
          <Tag color="green">Báo cáo doanh thu</Tag>
        </Space>
      </Sider>

      <Layout>
        <Header className="dashboard-header">
          <div />
          <UserDropdown username={currentUser.username} role={currentUser.role} onLogout={onLogout} />
        </Header>

        <Content className="dashboard-content">
          <Typography.Title level={2} style={{ color: '#fff', marginTop: 0 }}>
            Hệ thống quản lý rạp phim
          </Typography.Title>
          <Typography.Paragraph style={{ color: '#b8c7ff' }}>
            Giao diện đã được tối ưu để đưa vào thực tế: tông màu cinematic, bố cục rõ ràng,
            dễ mở rộng module nghiệp vụ và điều hướng theo vai trò.
          </Typography.Paragraph>

          <Row gutter={[16, 16]} style={{ marginBottom: 14 }}>
            <Col xs={24} sm={8}>
              <Card className="cinema-card">
                <Statistic title="Rạp đang hoạt động" value={4} valueStyle={{ color: '#d6e4ff' }} />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card className="cinema-card">
                <Statistic title="Suất chiếu hôm nay" value={28} valueStyle={{ color: '#d6e4ff' }} />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card className="cinema-card">
                <Statistic title="Tỉ lệ đặt vé" value={82} suffix="%" valueStyle={{ color: '#d6e4ff' }} />
              </Card>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            {modules.map((module) => (
              <Col xs={24} md={12} xl={8} key={module.title}>
                <Card className="cinema-card module-card">
                  <Space orientation="vertical" size={10}>
                    <Typography.Text style={{ color: '#8ea8ff', fontSize: 20 }}>
                      {module.icon}
                    </Typography.Text>
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
        </Content>
      </Layout>
    </Layout>
  )
}
