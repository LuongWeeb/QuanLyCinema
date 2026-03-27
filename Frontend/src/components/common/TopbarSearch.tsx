import { SearchOutlined } from '@ant-design/icons'

interface TopbarSearchProps {
  placeholder?: string
}

export function TopbarSearch({ placeholder = 'Tìm phim, thể loại...' }: TopbarSearchProps) {
  return (
    <div className="topbar-search-wrap">
      <SearchOutlined className="topbar-search-icon" />
      <input className="topbar-search-input" name="search" placeholder={placeholder} type="search" />
    </div>
  )
}
