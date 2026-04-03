import { CloseCircleFilled, SearchOutlined } from '@ant-design/icons'
import { useState } from 'react'

export interface TopbarSearchProps {
  placeholder?: string
  /** Trang chủ: ô tìm kiếm điều khiển từ ngoài */
  value?: string
  onChange?: (value: string) => void
  /** Enter — ví dụ cuộn tới khu kết quả */
  onEnter?: (value: string) => void
  /** Trang khác: Enter → về trang chủ kèm `?q=` */
  onNavigateHomeWithQuery?: (trimmedQuery: string) => void
}

export function TopbarSearch({
  placeholder = 'Tìm phim, thể loại...',
  value: valueProp,
  onChange,
  onEnter,
  onNavigateHomeWithQuery,
}: TopbarSearchProps) {
  const controlled = valueProp !== undefined && onChange !== undefined
  const [local, setLocal] = useState('')

  const value = controlled ? valueProp : local
  const setValue = controlled ? onChange : setLocal

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== 'Enter') return
    const q = value.trim()
    onEnter?.(q)
    if (onNavigateHomeWithQuery) {
      onNavigateHomeWithQuery(q)
    }
  }

  function clear() {
    setValue('')
    ;(document.activeElement as HTMLElement | null)?.blur()
  }

  const showClear = value.length > 0

  return (
    <div className="topbar-search-wrap">
      <SearchOutlined className="topbar-search-icon" />
      <input
        className={`topbar-search-input ${showClear ? 'topbar-search-input--clear' : ''}`}
        name="search"
        placeholder={placeholder}
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        autoComplete="off"
        aria-label={placeholder}
      />
      {showClear ? (
        <button
          type="button"
          className="topbar-search-clear"
          onClick={clear}
          aria-label="Xóa từ khóa"
        >
          <CloseCircleFilled />
        </button>
      ) : null}
    </div>
  )
}
