import {
  BarChartOutlined,
  CalendarOutlined,
  HomeOutlined,
  PlaySquareOutlined,
  ShoppingCartOutlined,
  TeamOutlined,
} from '@ant-design/icons'
import { Layout, Menu, Typography } from 'antd'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { UserDropdown } from '../components/common/UserDropdown'
import type { LoginResponse } from '../types/auth'

const { Sider, Header, Content } = Layout

interface AdminLayoutProps {
  currentUser: LoginResponse
  onLogout: () => void
}

export function AdminLayout({ currentUser, onLogout }: AdminLayoutProps) {
  const navigate = useNavigate()
  const location = useLocation()

  const selectedKey =
    location.pathname === '/' || location.pathname === ''
      ? 'home'
      : location.pathname.replace(/^\//, '').split('/')[0] || 'home'

  return (
    <Layout className="dashboard-layout">
      <Sider breakpoint="lg" collapsedWidth="0" width={250} className="dashboard-sider">
        <div className="brand-block">
          <img src="/icons/cinema.svg" alt="Cinema logo" width={42} height={42} />
          <div>
            <Typography.Title level={5} style={{ margin: 0, color: '#fff' }}>
              QLRapPhim
            </Typography.Title>
            <Typography.Text style={{ color: '#8ea8ff' }}>Quản trị</Typography.Text>
          </div>
        </div>

        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey === '' ? 'home' : selectedKey]}
          style={{ background: 'transparent', border: 'none' }}
          items={[
            { key: 'home', icon: <HomeOutlined />, label: 'Tổng quan', onClick: () => navigate('/') },
            {
              key: 'phim',
              icon: <PlaySquareOutlined />,
              label: 'Quản lý phim',
              onClick: () => navigate('/phim'),
            },
            {
              key: 'phong',
              icon: <TeamOutlined />,
              label: 'Phòng & ghế',
              onClick: () => navigate('/phong'),
            },
            {
              key: 'lich-chieu',
              icon: <CalendarOutlined />,
              label: 'Lịch chiếu',
              onClick: () => navigate('/lich-chieu'),
            },
            {
              key: 'don-cho-duyet',
              icon: <TeamOutlined />,
              label: 'Duyệt đơn vé',
              onClick: () => navigate('/don-cho-duyet'),
            },
            {
              key: 'ban-ve',
              icon: <ShoppingCartOutlined />,
              label: 'Đặt vé tại quầy',
              onClick: () => navigate('/ban-ve'),
            },
            {
              key: 'bao-cao',
              icon: <BarChartOutlined />,
              label: 'Báo cáo doanh thu',
              onClick: () => navigate('/bao-cao'),
            },
          ]}
        />
      </Sider>

      <Layout>
        <Header className="dashboard-header">
          <div />
          <UserDropdown
            username={currentUser.username}
            role={currentUser.role}
            onLogout={onLogout}
            onPendingReservations={() => navigate('/don-cho-duyet')}
            onCounterBooking={() => navigate('/ban-ve')}
          />
        </Header>
        <Content className="dashboard-content">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}
