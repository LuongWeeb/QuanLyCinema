import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ConfigProvider, theme } from 'antd'
import viVN from 'antd/locale/vi_VN'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ConfigProvider
      locale={viVN}
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorPrimary: '#4f7cff',
          borderRadius: 10,
          colorBgLayout: '#050915',
          colorBgContainer: '#0c142b',
          colorText: '#e6edff',
        },
      }}
    >
      <App />
    </ConfigProvider>
  </StrictMode>,
)
