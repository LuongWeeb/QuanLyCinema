import { Typography } from 'antd'

const { Title, Paragraph } = Typography

export function LoginHeader() {
  return (
    <div>
      <img
        src="/icons/cinema.svg"
        alt="Cinema icon"
        width={64}
        height={64}
        className="brand-icon"
      />
      <Title level={2} style={{ marginBottom: 8 }}>
        Chào mừng đến với hệ thống vận hành rạp phim
      </Title>
      <Paragraph type="secondary" style={{ marginBottom: 0 }}>
        Nền tảng quản lý và đặt vé chuyên nghiệp, kết nối trực tiếp giữa khách hàng,
        nhân viên bán vé và quản trị rạp.
      </Paragraph>
    </div>
  )
}
