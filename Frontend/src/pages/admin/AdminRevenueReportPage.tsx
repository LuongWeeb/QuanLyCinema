import { Column } from '@ant-design/plots'
import { BarChartOutlined, ReloadOutlined } from '@ant-design/icons'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Button, Card, DatePicker, Empty, Space, Spin, Statistic, Table, Typography, message } from 'antd'
import { fetchRevenueReport } from '../../services/reportService'
import type { MovieRevenueRow, RevenueReport } from '../../types/report'
import { mapApiError } from '../../utils/error'

const { RangePicker } = DatePicker

export function AdminRevenueReportPage() {
  const [range, setRange] = useState<[Dayjs, Dayjs]>(() => [
    dayjs().subtract(29, 'day').startOf('day'),
    dayjs().endOf('day'),
  ])
  const [report, setReport] = useState<RevenueReport | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [from, to] = range
      const data = await fetchRevenueReport(from.toISOString(), to.toISOString())
      setReport(data)
    } catch (e) {
      message.error(mapApiError(e).message)
      setReport(null)
    } finally {
      setLoading(false)
    }
  }, [range])

  useEffect(() => {
    void load()
  }, [load])

  const columnData = useMemo(
    () =>
      (report?.revenueByMovie ?? []).map((r) => ({
        movieName:
          r.movieName.length > 22 ? `${r.movieName.slice(0, 20)}…` : r.movieName,
        movieNameFull: r.movieName,
        revenue: r.revenue,
        ticketsSold: r.ticketsSold,
      })),
    [report?.revenueByMovie],
  )

  const columnConfig = useMemo(
    () => ({
      data: columnData,
      xField: 'movieName',
      yField: 'revenue',
      height: 420,
      autoFit: true,
      color: '#4f7cff',
      style: { maxWidth: 56, radiusTopLeft: 4, radiusTopRight: 4 },
      axis: {
        x: {
          title: false,
          labelAutoRotate: true,
          labelAutoHide: true,
          labelAutoEllipsis: true,
        },
        y: {
          title: false,
          labelFormatter: (v: string) =>
            `${Number(v).toLocaleString('vi-VN', { maximumFractionDigits: 0 })}`,
        },
      },
      interaction: { elementHighlightByColor: true },
    }),
    [columnData],
  )

  return (
    <>
      <Typography.Title level={2} style={{ color: '#fff', marginTop: 0 }}>
        <BarChartOutlined style={{ marginRight: 10 }} />
        Báo cáo doanh thu
      </Typography.Title>
      <Typography.Paragraph style={{ color: '#b8c7ff' }}>
        Thống kê theo vé đã thanh toán thành công trong khoảng thời gian chọn. Doanh thu được gom theo từng phim (theo
        suất chiếu của đơn đã thanh toán).
      </Typography.Paragraph>

      <Card
        className="cinema-card"
        style={{ marginBottom: 16 }}
        title={<span style={{ color: '#fff' }}>Bộ lọc</span>}
        extra={
          <Space wrap>
            <RangePicker
              value={range}
              onChange={(v) => {
                if (v?.[0] && v[1]) setRange([v[0], v[1]])
              }}
              format="DD/MM/YYYY HH:mm"
              showTime={{ format: 'HH:mm' }}
            />
            <Button type="default" icon={<ReloadOutlined />} loading={loading} onClick={() => void load()}>
              Tải lại
            </Button>
          </Space>
        }
      >
        <Spin spinning={loading && !report}>
          <Space size="large" wrap style={{ width: '100%' }}>
            <Statistic
              title={<span style={{ color: '#8ea8ff' }}>Tổng doanh thu</span>}
              value={report?.totalRevenue ?? 0}
              precision={0}
              suffix="₫"
              formatter={(v) => Number(v).toLocaleString('vi-VN')}
              styles={{ content: { color: '#73d13d', fontSize: 22 } }}
            />
            <Statistic
              title={<span style={{ color: '#8ea8ff' }}>Tổng vé đã bán</span>}
              value={report?.ticketsSold ?? 0}
              styles={{ content: { color: '#d6e4ff', fontSize: 22 } }}
            />
          </Space>
        </Spin>
      </Card>

      <Card className="cinema-card" title={<span style={{ color: '#fff' }}>Doanh thu theo phim</span>}>
        <Spin spinning={loading}>
          {columnData.length === 0 && !loading ? (
            <Empty description="Chưa có dữ liệu thanh toán trong khoảng thời gian này" />
          ) : (
            <Column {...columnConfig} />
          )}
        </Spin>
      </Card>

      <Card className="cinema-card" style={{ marginTop: 16 }} title={<span style={{ color: '#fff' }}>Bảng chi tiết</span>}>
        <Spin spinning={loading}>
          <Table<MovieRevenueRow>
            rowKey="movieId"
            pagination={false}
            dataSource={report?.revenueByMovie ?? []}
            locale={{ emptyText: 'Không có dữ liệu' }}
            columns={[
              { title: 'Phim', dataIndex: 'movieName', ellipsis: true },
              {
                title: 'Doanh thu',
                dataIndex: 'revenue',
                width: 160,
                render: (v: number) => `${Number(v).toLocaleString('vi-VN')} ₫`,
              },
              { title: 'Số vé', dataIndex: 'ticketsSold', width: 100 },
            ]}
          />
        </Spin>
      </Card>

      <Card className="cinema-card" style={{ marginTop: 16 }} title={<span style={{ color: '#fff' }}>Suất bán chạy (top 5)</span>}>
        <Spin spinning={loading}>
          <Table
            rowKey="showtimeId"
            pagination={false}
            dataSource={report?.popularShowtimes ?? []}
            locale={{ emptyText: 'Không có dữ liệu' }}
            columns={[
              { title: 'Phim', dataIndex: 'movieName', ellipsis: true },
              {
                title: 'Giờ chiếu',
                dataIndex: 'startTime',
                width: 180,
                render: (t: string) => dayjs(t).format('DD/MM/YYYY HH:mm'),
              },
              { title: 'Vé bán', dataIndex: 'soldTickets', width: 100 },
            ]}
          />
        </Spin>
      </Card>
    </>
  )
}
