import { DownOutlined } from '@ant-design/icons'
import { Avatar, Space, Typography } from 'antd'
import { useEffect, useRef, useState } from 'react'

interface UserDropdownProps {
  username: string
  role: string
  onLogout: () => void
}

export function UserDropdown({ username, role, onLogout }: UserDropdownProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!rootRef.current) return
      if (!rootRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleAction(action: string) {
    if (action === 'logout') {
      onLogout()
      return
    }
    setOpen(false)
  }

  return (
    <div className="user-dropdown" ref={rootRef}>
      <button className="user-dropdown-trigger" onClick={() => setOpen((v) => !v)}>
        <Space size={8}>
          <Avatar style={{ backgroundColor: '#4f7cff' }}>{username[0]?.toUpperCase()}</Avatar>
          <div className="user-dropdown-meta">
            <Typography.Text className="user-dropdown-name">{username}</Typography.Text>
            <Typography.Text className="user-dropdown-role">{role}</Typography.Text>
          </div>
          <DownOutlined style={{ color: '#c5d3ff', fontSize: 12 }} />
        </Space>
      </button>

      {open ? (
        <div className="user-dropdown-panel">
          <button className="user-dd-value" onClick={() => handleAction('profile')}>
            Hồ sơ công khai
          </button>
          <button className="user-dd-value" onClick={() => handleAction('account')}>
            Tài khoản
          </button>
          <button className="user-dd-value" onClick={() => handleAction('appearance')}>
            Giao diện
          </button>
          <button className="user-dd-value" onClick={() => handleAction('accessibility')}>
            Trợ năng
          </button>
          <button className="user-dd-value" onClick={() => handleAction('notifications')}>
            Thông báo
          </button>
          <button className="user-dd-value user-dd-danger" onClick={() => handleAction('logout')}>
            Đăng xuất
          </button>
        </div>
      ) : null}
    </div>
  )
}
