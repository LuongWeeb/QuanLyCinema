import { Typography } from 'antd'
import { PendingApprovalsPanel } from '../../components/admin/PendingApprovalsPanel'

export function AdminPendingReservationsPage() {
  return (
    <>
      <Typography.Title level={2} style={{ color: '#fff', marginTop: 0 }}>
        Duyệt đơn đặt vé
      </Typography.Title>
      <PendingApprovalsPanel />
    </>
  )
}
