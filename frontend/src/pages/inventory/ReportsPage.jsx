import { useState, useMemo, useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer,
  XAxis, YAxis, Tooltip as ReTooltip, CartesianGrid, Legend,
} from 'recharts'
import {
  Download, RefreshCw, AlertTriangle, Package,
  TrendingDown, Clock, Activity, ChevronUp, ChevronDown,
  FileText, CheckCircle2, BarChart3
} from 'lucide-react'
import { inventoryApi } from '../../api/inventoryApi'
import { format, formatDistanceToNow } from 'date-fns'

/* ─── helpers ──────────────────────────────────────────────── */
const fmt = (n) =>
  n == null ? '—' : `LKR ${Number(n).toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

function exportCSV(rows, filename) {
  if (!rows.length) return
  const headers = Object.keys(rows[0]).join(',')
  const data = rows.map(r =>
    Object.values(r).map(v => `"${String(v ?? '').replace(/"/g, '""')}"` ).join(',')
  )
  const blob = new Blob([[headers, ...data].join('\n')], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = filename
  link.click()
  URL.revokeObjectURL(link.href)
}

const PIE_COLORS = [
  '#6366f1', '#10b981', '#f59e0b', '#ef4444',
  '#3b82f6', '#8b5cf6', '#14b8a6', '#f97316',
]
const STOCK_HEALTH_COLORS = { Healthy: '#10b981', Medium: '#6366f1', Low: '#f59e0b', Critical: '#ef4444' }

/* ─── sub-components ────────────────────────────────────────── */
function KpiCard({ label, value, subtext, icon: Icon, color, loading }) {
  return (
    <div className="pm-card p-4 flex items-start gap-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
        <Icon size={18} strokeWidth={1.8} />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide truncate">{label}</p>
        {loading
          ? <div className="h-6 w-20 rounded bg-muted animate-pulse mt-1" />
          : <p className="text-xl font-bold text-foreground leading-tight mt-0.5">{value}</p>}
        {subtext && <p className="text-[11px] text-muted-foreground mt-0.5">{subtext}</p>}
      </div>
    </div>
  )
}

function SortTh({ col, label, sortConfig, onSort, className = '' }) {
  const active = sortConfig.key === col
  return (
    <th className={`cursor-pointer select-none hover:text-foreground ${className}`} onClick={() => onSort(col)}>
      <span className="inline-flex items-center gap-1">
        {label}
        {active
          ? sortConfig.dir === 'asc'
            ? <ChevronUp size={11} className="text-primary" />
            : <ChevronDown size={11} className="text-primary" />
          : <ChevronUp size={11} className="text-muted-foreground/30" />}
      </span>
    </th>
  )
}

const CUSTOM_PIE_LABEL = ({ cx, cy, midAngle, outerRadius, percent }) => {
  if (percent < 0.05) return null
  const RADIAN = Math.PI / 180
  const r = outerRadius + 20
  const x = cx + r * Math.cos(-midAngle * RADIAN)
  const y = cy + r * Math.sin(-midAngle * RADIAN)
  return (
    <text x={x} y={y} fill="currentColor" textAnchor={x > cx ? 'start' : 'end'}
      dominantBaseline="central" fontSize={11} className="text-muted-foreground">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  )
}

/* ─── main page ─────────────────────────────────────────────── */
export default function ReportsPage() {
  const queryClient = useQueryClient()
  const [reportType, setReportType]   = useState('STOCK_SUMMARY')
  const [expiryDays, setExpiryDays]   = useState('30')
  const [sortConfig, setSortConfig]   = useState({ key: 'totalValue', dir: 'desc' })
  const [search, setSearch]           = useState('')

  /* ── queries with near real-time auto-refresh ───────────── */
  const refetchInterval = 60_000
  const liveQueryOptions = {
    refetchInterval,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    staleTime: 0,
  }

  const { data: allItemsRes, isLoading: loadingAll, dataUpdatedAt, refetch: refetchAllItems } = useQuery({
    queryKey: ['inventory-all'],
    queryFn:  () => inventoryApi.getAll(),
    ...liveQueryOptions,
  })

  const { data: alertsRes, isLoading: loadingAlerts, refetch: refetchAlerts } = useQuery({
    queryKey: ['inventory-alerts'],
    queryFn:  () => inventoryApi.getAlerts(),
    ...liveQueryOptions,
  })

  const { data: activityRes, isLoading: loadingActivity, refetch: refetchActivity } = useQuery({
    queryKey: ['inventory-activity'],
    queryFn:  () => inventoryApi.getActivity(),
    ...liveQueryOptions,
  })

  const beforeDate = reportType === 'EXPIRY'
    ? new Date(Date.now() + parseInt(expiryDays, 10) * 86_400_000).toISOString().slice(0, 10)
    : undefined

  const { data: reportRes, isLoading: loadingReport, refetch: refetchReport } = useQuery({
    queryKey: ['inventory-report', reportType, expiryDays],
    queryFn:  () => inventoryApi.getReport(reportType, beforeDate),
    ...liveQueryOptions,
  })

  /* ── derived data ───────────────────────────────────────── */
  const allItems = useMemo(() => allItemsRes?.data || [], [allItemsRes])
  const alerts   = alertsRes?.data || {}
  const activity = activityRes?.data || []
  const report   = reportRes?.data  || reportRes || {}
  const rows     = Array.isArray(report?.rows) ? report.rows : []

  const totalValue  = report?.totalValue ?? 0
  const outOfStock  = useMemo(() => allItems.filter(i => (i.quantity ?? 0) === 0).length, [allItems])
  const lowStockCnt = alerts.lowStockCount ?? 0
  const expiryCnt   = alerts.expiringCount  ?? 0

  /* Category pie */
  const categoryData = useMemo(() => {
    const map = {}
    allItems.forEach(i => {
      const cat = i.category || 'Uncategorized'
      map[cat] = (map[cat] || 0) + (i.quantity ?? 0)
    })
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
  }, [allItems])

  /* Stock health */
  const stockHealthData = useMemo(() => {
    let healthy = 0, medium = 0, low = 0, critical = 0
    allItems.forEach(i => {
      const qty = i.quantity ?? 0
      const th  = i.lowStockThreshold ?? 10
      if      (qty === 0)     critical++
      else if (qty <= th)     low++
      else if (qty <= th * 3) medium++
      else                    healthy++
    })
    return [
      { name: 'Healthy',  count: healthy  },
      { name: 'Medium',   count: medium   },
      { name: 'Low',      count: low      },
      { name: 'Critical', count: critical },
    ]
  }, [allItems])

  /* Top items by value */
  const topItems = useMemo(() =>
    [...rows]
      .filter(r => (r.totalValue ?? 0) > 0)
      .sort((a, b) => (b.totalValue ?? 0) - (a.totalValue ?? 0))
      .slice(0, 8)
      .map(r => ({
        name:  (r.itemName ?? '').length > 18 ? r.itemName.slice(0, 18) + '…' : (r.itemName ?? ''),
        value: Number(r.totalValue ?? 0),
      })),
    [rows]
  )

  /* Sort handler */
  const handleSort = useCallback((key) => {
    setSortConfig(prev => ({ key, dir: prev.key === key && prev.dir === 'asc' ? 'desc' : 'asc' }))
  }, [])

  /* Filtered + sorted rows */
  const filteredRows = useMemo(() => {
    const q = String(search ?? '').trim().toLowerCase()
    return [...rows]
      .filter(r =>
        !q ||
        String(r.itemName ?? '').toLowerCase().includes(q) ||
        String(r.category ?? '').toLowerCase().includes(q) ||
        String(r.supplier ?? '').toLowerCase().includes(q)
      )
      .sort((a, b) => {
        const av = a[sortConfig.key] ?? 0
        const bv = b[sortConfig.key] ?? 0
        const cmp = typeof av === 'string'
          ? String(av).localeCompare(String(bv))
          : Number(av) - Number(bv)
        return sortConfig.dir === 'asc' ? cmp : -cmp
      })
  }, [rows, search, sortConfig])

  /* CSV export */
  const handleExport = () => {
    exportCSV(
      filteredRows.map(r => ({
        Item:          r.itemName    ?? '',
        Category:      r.category    ?? '',
        Quantity:      r.quantity    ?? 0,
        Unit:          r.unit        ?? '',
        'Unit Price':  r.unitPrice   ?? '',
        'Total Value': r.totalValue  ?? '',
        'Expiry Date': r.expiryDate  ?? '',
        Batch:         r.batchNumber ?? '',
        Supplier:      r.supplier    ?? '',
      })),
      `inventory-${reportType.toLowerCase()}-${new Date().toISOString().slice(0, 10)}.csv`
    )
  }

  const handleRefresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['inventory-all'] }),
      queryClient.invalidateQueries({ queryKey: ['inventory-alerts'] }),
      queryClient.invalidateQueries({ queryKey: ['inventory-activity'] }),
      queryClient.invalidateQueries({ queryKey: ['inventory-report'] }),
      refetchAllItems(),
      refetchAlerts(),
      refetchActivity(),
      refetchReport(),
    ])
  }

  const lastUpdated = dataUpdatedAt
    ? formatDistanceToNow(new Date(dataUpdatedAt), { addSuffix: true })
    : '—'
  const loadingKpi  = loadingAll || loadingAlerts
  const totalItems  = allItems.length

  /* Expiry row colouring */
  function expiryRowClass(date) {
    if (!date || reportType !== 'EXPIRY') return ''
    const diff = Math.ceil((new Date(date) - new Date()) / 86_400_000)
    if (diff <= 7)  return 'bg-red-50/60   dark:bg-red-900/10'
    if (diff <= 30) return 'bg-amber-50/60 dark:bg-amber-900/10'
    return ''
  }

  function expiryBadge(date) {
    if (!date) return <span className="text-muted-foreground text-xs">—</span>
    const diff = Math.ceil((new Date(date) - new Date()) / 86_400_000)
    if (diff <= 0)  return <span className="badge-red   text-xs">Expired</span>
    if (diff <= 7)  return <span className="badge-red   text-xs">{diff}d left</span>
    if (diff <= 30) return <span className="badge-amber text-xs">{diff}d left</span>
    return <span className="text-muted-foreground text-xs">{date}</span>
  }

  /* ── render ──────────────────────────────────────────────── */
  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-foreground">Pharmacy Reports</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Live inventory analytics · auto-refreshes every 1 min · last updated {lastUpdated}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            className="btn-neu flex items-center gap-1.5 text-sm px-3 h-9 text-muted-foreground hover:text-foreground"
          >
            <RefreshCw size={13} /> Refresh
          </button>
          <button
            className="btn-secondary flex items-center gap-1.5 text-sm px-3 h-9 disabled:opacity-40"
            disabled={filteredRows.length === 0}
            onClick={handleExport}
          >
            <Download size={13} /> Export CSV
          </button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <KpiCard label="Total Items"      value={loadingKpi    ? '…' : totalItems.toLocaleString()} subtext="active SKUs"        icon={Package}       color="bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30"   loading={loadingKpi} />
        <KpiCard label="Inventory Value"  value={loadingReport ? '…' : fmt(totalValue)}             subtext="selling price basis" icon={BarChart3}      color="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30" loading={loadingReport} />
        <KpiCard label="Low Stock"        value={loadingAlerts ? '…' : lowStockCnt.toString()}       subtext="below threshold"     icon={TrendingDown}   color={lowStockCnt > 0 ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30'   : 'bg-muted text-muted-foreground'} loading={loadingAlerts} />
        <KpiCard label="Expiring Soon"    value={loadingAlerts ? '…' : expiryCnt.toString()}         subtext="within alert window" icon={Clock}          color={expiryCnt   > 0 ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/30' : 'bg-muted text-muted-foreground'} loading={loadingAlerts} />
        <KpiCard label="Out of Stock"     value={loadingKpi    ? '…' : outOfStock.toString()}        subtext="zero quantity"       icon={AlertTriangle}  color={outOfStock  > 0 ? 'bg-red-100 text-red-600 dark:bg-red-900/30'         : 'bg-muted text-muted-foreground'} loading={loadingKpi} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Category distribution */}
        <div className="pm-card p-4">
          <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <span className="w-1.5 h-4 rounded-full bg-indigo-500 inline-block" />
            Stock by Category (units)
          </h3>
          {loadingAll
            ? <div className="flex justify-center items-center h-52"><div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" /></div>
            : categoryData.length === 0
              ? <div className="flex justify-center items-center h-52 text-muted-foreground text-sm">No data</div>
              : (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={categoryData} cx="50%" cy="50%" outerRadius={75}
                      dataKey="value" labelLine={false} label={CUSTOM_PIE_LABEL}>
                      {categoryData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <ReTooltip formatter={(v, n) => [`${v.toLocaleString()} units`, n]} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} iconType="circle" iconSize={8} />
                  </PieChart>
                </ResponsiveContainer>
              )}
        </div>

        {/* Stock health */}
        <div className="pm-card p-4">
          <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <span className="w-1.5 h-4 rounded-full bg-emerald-500 inline-block" />
            Stock Health Distribution
          </h3>
          {loadingAll
            ? <div className="flex justify-center items-center h-52"><div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" /></div>
            : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={stockHealthData} barCategoryGap="35%">
                  <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-border opacity-40" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={28} />
                  <ReTooltip formatter={(v) => [`${v} items`]} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {stockHealthData.map(entry => <Cell key={entry.name} fill={STOCK_HEALTH_COLORS[entry.name]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
        </div>

        {/* Top items by value */}
        <div className="pm-card p-4">
          <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <span className="w-1.5 h-4 rounded-full bg-amber-500 inline-block" />
            Top Items by Value (LKR)
          </h3>
          {loadingReport
            ? <div className="flex justify-center items-center h-52"><div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" /></div>
            : topItems.length === 0
              ? <div className="flex justify-center items-center h-52 text-muted-foreground text-sm">No data</div>
              : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={topItems} layout="vertical" barCategoryGap="20%">
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="currentColor" className="text-border opacity-40" />
                    <XAxis type="number" tick={{ fontSize: 10 }} tickLine={false} axisLine={false}
                      tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} />
                    <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                    <ReTooltip formatter={(v) => [fmt(v), 'Value']} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                    <Bar dataKey="value" fill="#f59e0b" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
        </div>
      </div>

      {/* Activity + Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Recent stock activity */}
        <div className="pm-card p-4">
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <Activity size={14} className="text-primary" />
            Recent Stock Activity
          </h3>
          {loadingActivity
            ? <div className="space-y-3">{[1,2,3,4,5].map(i => <div key={i} className="h-10 rounded-lg bg-muted animate-pulse" />)}</div>
            : activity.length === 0
              ? (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <Activity size={24} className="opacity-30 mb-1" />
                  <p className="text-sm">No recent activity</p>
                </div>
              )
              : (
                <div className="space-y-1">
                  {activity.map(a => (
                    <div key={a.id} className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-muted/40 transition-colors">
                      <div className={[
                        'w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0',
                        (a.quantityChange ?? 0) >= 0
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30'
                          : 'bg-red-100    text-red-700    dark:bg-red-900/30',
                      ].join(' ')}>
                        {(a.quantityChange ?? 0) >= 0 ? '+' : ''}{a.quantityChange}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-foreground truncate">{a.itemName}</p>
                        <p className="text-[11px] text-muted-foreground truncate">{a.reason} · {a.performedByName}</p>
                      </div>
                      <p className="text-[10px] text-muted-foreground shrink-0 text-right">
                        {a.createdAt ? formatDistanceToNow(new Date(a.createdAt), { addSuffix: true }) : ''}
                      </p>
                    </div>
                  ))}
                </div>
              )}
        </div>

        {/* Live alerts */}
        <div className="pm-card p-4">
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <AlertTriangle size={14} className="text-amber-500" />
            Active Alerts
          </h3>
          {loadingAlerts
            ? <div className="space-y-2">{[1,2,3,4].map(i => <div key={i} className="h-8 rounded-lg bg-muted animate-pulse" />)}</div>
            : (alerts.lowStockItems?.length ?? 0) === 0 && (alerts.expiringItems?.length ?? 0) === 0
              ? (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <CheckCircle2 size={24} className="text-emerald-500 mb-1" />
                  <p className="text-sm">All items are well-stocked</p>
                </div>
              )
              : (
                <div className="space-y-1 max-h-[220px] overflow-y-auto no-scrollbar">
                  {(alerts.lowStockItems || []).slice(0, 5).map(a => (
                    <div key={`low-${a.id}`} className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-amber-50/60 dark:bg-amber-900/10">
                      <TrendingDown size={12} className="text-amber-600 shrink-0" />
                      <p className="text-xs text-foreground flex-1 truncate">{a.itemName}</p>
                      <span className="badge-amber text-[10px] shrink-0">{a.quantity} left</span>
                    </div>
                  ))}
                  {(alerts.expiringItems || []).slice(0, 5).map(a => (
                    <div key={`exp-${a.id}`} className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-red-50/60 dark:bg-red-900/10">
                      <Clock size={12} className="text-red-600 shrink-0" />
                      <p className="text-xs text-foreground flex-1 truncate">{a.itemName}</p>
                      <span className="badge-red text-[10px] shrink-0">
                        {a.expiryDate ? format(new Date(a.expiryDate), 'dd MMM yy') : 'Expiring'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
        </div>
      </div>

      {/* Report table */}
      <div className="pm-card">
        <div className="p-4 border-b border-border">
          <div className="flex flex-wrap items-end gap-3">
          <div className="w-full sm:w-[220px] min-w-0">
            <label className="form-label text-[11px]">Report Type</label>
            <select className="form-input mt-1 h-10 text-sm" value={reportType} onChange={e => setReportType(e.target.value)}>
              <option value="STOCK_SUMMARY">Stock Summary</option>
              <option value="LOW_STOCK">Low Stock</option>
              <option value="EXPIRY">Expiry Report</option>
            </select>
          </div>
          {reportType === 'EXPIRY' && (
            <div className="w-full sm:w-[180px] min-w-0">
              <label className="form-label text-[11px]">Expiring Within</label>
              <select className="form-input mt-1 h-10 text-sm" value={expiryDays} onChange={e => setExpiryDays(e.target.value)}>
                <option value="7">7 days</option>
                <option value="30">30 days</option>
                <option value="90">90 days</option>
              </select>
            </div>
          )}
          <div className="min-w-[260px] flex-1">
            <label className="form-label text-[11px]">Search</label>
            <input
              className="form-input mt-1 h-10 text-sm"
              placeholder="Filter by name, category, supplier…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="w-full sm:w-auto sm:ml-auto text-left sm:text-right">
            <p className="text-[11px] text-muted-foreground">
              {filteredRows.length} row{filteredRows.length !== 1 ? 's' : ''}
              {report?.totalItems ? ` of ${report.totalItems}` : ''}
            </p>
            {report?.totalValue != null && (
              <p className="text-sm font-bold text-foreground">{fmt(report.totalValue)}</p>
            )}
          </div>
          </div>
        </div>

        {loadingReport ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
          </div>
        ) : filteredRows.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <FileText size={32} className="text-muted-foreground/30 mb-2" />
            <p className="text-sm text-muted-foreground">No items match your criteria</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="pm-table">
              <thead>
                <tr>
                  <SortTh col="itemName"   label="Item"        sortConfig={sortConfig} onSort={handleSort} />
                  <SortTh col="category"   label="Category"    sortConfig={sortConfig} onSort={handleSort} />
                  <SortTh col="quantity"   label="Qty"         sortConfig={sortConfig} onSort={handleSort} />
                  <SortTh col="unitPrice"  label="Unit Price"  sortConfig={sortConfig} onSort={handleSort} className="text-right" />
                  <SortTh col="totalValue" label="Total Value" sortConfig={sortConfig} onSort={handleSort} className="text-right" />
                  <th>Expiry</th>
                  <th>Batch</th>
                  <SortTh col="supplier"   label="Supplier"    sortConfig={sortConfig} onSort={handleSort} />
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((r, i) => (
                  <tr key={r.id ?? i} className={expiryRowClass(r.expiryDate)}>
                    <td className="font-medium text-foreground">{r.itemName}</td>
                    <td>
                      {r.category
                        ? <span className="badge-blue text-xs">{r.category}</span>
                        : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td>
                      <span className={[
                        'font-medium',
                        (r.quantity ?? 0) === 0 ? 'text-red-600'
                        : (r.quantity ?? 0) <= 10 ? 'text-amber-600'
                        : 'text-foreground',
                      ].join(' ')}>
                        {r.quantity ?? 0}
                      </span>
                      {r.unit && <span className="text-xs text-muted-foreground ml-1">{r.unit}</span>}
                    </td>
                    <td className="text-right text-muted-foreground">{r.unitPrice != null ? fmt(r.unitPrice) : '—'}</td>
                    <td className="text-right font-semibold text-foreground">{r.totalValue != null ? fmt(r.totalValue) : '—'}</td>
                    <td>{expiryBadge(r.expiryDate)}</td>
                    <td className="text-xs text-muted-foreground">{r.batchNumber || '—'}</td>
                    <td className="text-sm text-muted-foreground">{r.supplier || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}