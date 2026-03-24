import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { toast } from 'react-hot-toast'
import {
  Plus, Search, Eye, Pencil, Trash2, Download, Filter,
  X, AlertTriangle, Package, ChevronUp, ChevronDown,
  ChevronLeft, ChevronRight, Activity
} from 'lucide-react'
import { inventoryApi } from '../../api/inventoryApi'
import { supplierApi } from '../../api/supplierApi'
import { RoleProtected } from '../../context/AuthContext'
import Modal from '../../components/common/Modal'
import Badge from '../../components/common/Badge'

const CATEGORIES = ['Antibiotics', 'Painkillers', 'Vitamins', 'Medical Supplies', 'Tablets', 'Syrups', 'Injections', 'Other']
const ADJUST_REASONS = ['New Purchase', 'Return', 'Damage Adjustment', 'Correction', 'Other']

function exportCSV(items) {
  const headers = ['Name', 'Category', 'Qty', 'Unit', 'Selling Price', 'Expiry', 'Supplier']
  const rows = items.map(i => [
    i.drugName, i.category, i.quantity, i.unit || '',
    i.sellingPrice, i.expiryDate || '', i.supplierEntity?.name || i.supplier || '',
  ].map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','))
  const csv = [headers.join(','), ...rows].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `inventory-${new Date().toISOString().slice(0, 10)}.csv`
  link.click()
  URL.revokeObjectURL(link.href)
}

function StockBadge({ quantity, threshold = 10 }) {
  if (quantity <= 0) return <span className="badge-red">Out of stock</span>
  if (quantity <= threshold) return <span className="badge-amber">Low</span>
  return <span className="badge-green">In stock</span>
}

function SortIcon({ col, sortConfig }) {
  if (sortConfig.key !== col) return <ChevronUp size={12} className="text-muted-foreground/30" />
  return sortConfig.dir === 'asc'
    ? <ChevronUp size={12} className="text-primary" />
    : <ChevronDown size={12} className="text-primary" />
}

function ItemForm({ register, suppliers, isEdit = false }) {
  return (
    <div className="space-y-4 max-h-[60vh] overflow-y-auto no-scrollbar pr-1">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="form-label">Drug Name *</label>
          <input className="form-input mt-1" {...register('drugName', { required: true })} />
        </div>
        <div>
          <label className="form-label">Generic Name</label>
          <input className="form-input mt-1" {...register('genericName')} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="form-label">Category *</label>
          <select className="form-input mt-1" {...register('category', { required: true })}>
            <option value="">Select…</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="form-label">Unit</label>
          <input className="form-input mt-1" placeholder="tablets" {...register('unit')} />
        </div>
      </div>
      {!isEdit && (
        <div>
          <label className="form-label">Initial Quantity *</label>
          <input type="number" className="form-input mt-1" {...register('quantityAdded', { required: !isEdit })} />
        </div>
      )}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="form-label">Unit Price</label>
          <input type="number" step="0.01" className="form-input mt-1" {...register('unitPrice')} />
        </div>
        <div>
          <label className="form-label">Purchase Price</label>
          <input type="number" step="0.01" className="form-input mt-1" {...register('purchasePrice')} />
        </div>
        <div>
          <label className="form-label">Selling Price</label>
          <input type="number" step="0.01" className="form-input mt-1" {...register('sellingPrice')} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="form-label">Expiry Date</label>
          <input type="date" className="form-input mt-1" {...register('expiryDate')} />
        </div>
        <div>
          <label className="form-label">Batch Number</label>
          <input className="form-input mt-1" {...register('batchNumber')} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="form-label">Storage Location</label>
          <input className="form-input mt-1" {...register('storageLocation')} />
        </div>
        <div>
          <label className="form-label">Low Stock Threshold</label>
          <input type="number" className="form-input mt-1" placeholder="10" {...register('lowStockThreshold')} />
        </div>
      </div>
      <div>
        <label className="form-label">Supplier</label>
        <select className="form-input mt-1" {...register('supplierId')}>
          <option value="">None</option>
          {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>
      <div>
        <label className="form-label">Description</label>
        <textarea rows={2} className="form-input mt-1 resize-none" {...register('description')} />
      </div>
    </div>
  )
}

export default function InventoryPage() {
  const queryClient = useQueryClient()
  const refreshInventoryReporting = () => {
    queryClient.invalidateQueries({ queryKey: ['inventory'] })
    queryClient.invalidateQueries({ queryKey: ['inventory-all'] })
    queryClient.invalidateQueries({ queryKey: ['inventory-alerts'] })
    queryClient.invalidateQueries({ queryKey: ['inventory-activity'] })
    queryClient.invalidateQueries({ queryKey: ['inventory-report'] })
  }
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState({ category: '', stockLevel: '' })
  const [showFilters, setShowFilters] = useState(false)
  const [addModal, setAddModal] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [viewingItem, setViewingItem] = useState(null)
  const [adjustItem, setAdjustItem] = useState(null)
  const [deleteItem, setDeleteItem] = useState(null)
  const [deleteReason, setDeleteReason] = useState('')
  const [sortConfig, setSortConfig] = useState({ key: null, dir: 'asc' })
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 10

  const params = {
    keyword: searchQuery || undefined,
    category: filters.category || undefined,
    stockLevel: filters.stockLevel || undefined,
  }

  const { data: inventoryRes, isLoading } = useQuery({
    queryKey: ['inventory', params],
    queryFn: () => inventoryApi.getAll(params),
  })

  const { data: suppliersRes } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => supplierApi.getAll(),
  })

  const addMutation = useMutation({
    mutationFn: (data) => inventoryApi.add(data),
    onSuccess: () => {
      refreshInventoryReporting()
      toast.success('Item added')
      setAddModal(false)
      resetAdd()
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to add item'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => inventoryApi.update(id, data),
    onSuccess: () => {
      refreshInventoryReporting()
      toast.success('Item updated')
      setEditingItem(null)
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Update failed'),
  })

  const adjustMutation = useMutation({
    mutationFn: ({ id, data }) => inventoryApi.adjustStock(id, data),
    onSuccess: () => {
      refreshInventoryReporting()
      toast.success('Stock adjusted')
      setAdjustItem(null)
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Adjustment failed'),
  })

  const deleteMutation = useMutation({
    mutationFn: ({ id, reason }) => inventoryApi.delete(id, reason),
    onSuccess: () => {
      refreshInventoryReporting()
      toast.success('Item archived')
      setDeleteItem(null)
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Delete failed'),
  })

  const { register: regAdd, handleSubmit: handleAddSubmit, reset: resetAdd } = useForm()
  const { register: regEdit, handleSubmit: handleEditSubmit, reset: resetEdit } = useForm()
  const { register: regAdjust, handleSubmit: handleAdjustSubmit, reset: resetAdjust } = useForm()

  const allItems = Array.isArray(inventoryRes) ? inventoryRes : inventoryRes?.data || []
  const suppliers = Array.isArray(suppliersRes) ? suppliersRes : suppliersRes?.data || []

  const sortedItems = useMemo(() => {
    if (!sortConfig.key) return allItems
    return [...allItems].sort((a, b) => {
      const av = a[sortConfig.key]
      const bv = b[sortConfig.key]
      const cmp = typeof av === 'string' ? (av || '').localeCompare(bv || '') : (Number(av) || 0) - (Number(bv) || 0)
      return sortConfig.dir === 'asc' ? cmp : -cmp
    })
  }, [allItems, sortConfig])

  const totalPages = Math.max(1, Math.ceil(sortedItems.length / PAGE_SIZE))
  const paginatedItems = sortedItems.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const lowStockCount = allItems.filter(i => i.quantity > 0 && i.quantity <= (i.lowStockThreshold || 10)).length
  const outOfStockCount = allItems.filter(i => i.quantity <= 0).length
  const expiringCount = allItems.filter(i => {
    if (!i.expiryDate) return false
    const exp = new Date(i.expiryDate)
    const in30 = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    return exp <= in30 && exp >= new Date()
  }).length

  const handleSort = (key) => {
    setSortConfig(prev => ({ key, dir: prev.key === key && prev.dir === 'asc' ? 'desc' : 'asc' }))
    setPage(1)
  }

  const onAddSubmit = (d) => {
    addMutation.mutate({
      drugName: d.drugName,
      genericName: d.genericName,
      category: d.category,
      description: d.description,
      quantityAdded: parseInt(d.quantityAdded) || 0,
      unitPrice: parseFloat(d.unitPrice) || 0,
      sellingPrice: parseFloat(d.sellingPrice) || parseFloat(d.unitPrice) || 0,
      purchasePrice: parseFloat(d.purchasePrice) || 0,
      expiryDate: d.expiryDate || null,
      batchNumber: d.batchNumber || null,
      supplierId: d.supplierId ? parseInt(d.supplierId) : null,
      storageLocation: d.storageLocation,
      unit: d.unit || 'tablets',
      lowStockThreshold: parseInt(d.lowStockThreshold) || 10,
    })
  }

  const onEditSubmit = (d) => {
    if (!editingItem) return

    const supplierId = d.supplierId ? parseInt(d.supplierId, 10) : null
    const selectedSupplier = supplierId
      ? suppliers.find((s) => Number(s.id) === supplierId)
      : null

    updateMutation.mutate({
      id: editingItem.id,
      data: {
        quantity: parseInt(editingItem.quantity, 10) || 0,
        drugName: d.drugName,
        genericName: d.genericName,
        category: d.category,
        description: d.description,
        unitCost: parseFloat(d.unitPrice) || 0,
        sellingPrice: parseFloat(d.sellingPrice) || parseFloat(d.unitPrice) || 0,
        purchasePrice: parseFloat(d.purchasePrice) || 0,
        expiryDate: d.expiryDate || null,
        batchNumber: d.batchNumber || null,
        storageLocation: d.storageLocation,
        unit: d.unit || 'tablets',
        lowStockThreshold: parseInt(d.lowStockThreshold) || 10,
        supplier: selectedSupplier?.name || editingItem.supplier || '',
        supplierEntity: supplierId ? { id: supplierId } : null,
      },
    })
  }

  const onAdjustSubmit = (d) => {
    const change = parseInt(d.quantityChange) || 0
    if (change === 0) { toast.error('Quantity change cannot be zero'); return }
    adjustMutation.mutate({
      id: adjustItem.id,
      data: { quantityChange: change, reason: d.reason || 'Adjustment', note: d.note },
    })
  }

  const SORTABLE_COLS = [
    { key: 'drugName', label: 'Drug Name' },
    { key: 'category', label: 'Category' },
    { key: 'quantity', label: 'Qty' },
    { key: 'sellingPrice', label: 'Price (LKR)' },
    { key: 'expiryDate', label: 'Expiry' },
  ]

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-foreground">Inventory</h2>
        <div className="flex items-center gap-2">
          <button
            className="btn-secondary h-9 px-3 text-sm flex items-center gap-1.5"
            onClick={() => exportCSV(allItems)}
          >
            <Download size={14} />
            Export
          </button>
          <RoleProtected allowedRoles={['ADMIN', 'PHARMACIST', 'DOCTOR']}>
            <button
              className="btn-primary h-9 px-3 text-sm flex items-center gap-1.5"
              onClick={() => { resetAdd(); setAddModal(true) }}
            >
              <Plus size={14} />
              Add Item
            </button>
          </RoleProtected>
        </div>
      </div>

      {/* Alert banners */}
      {(lowStockCount > 0 || outOfStockCount > 0 || expiringCount > 0) && (
        <div className="flex flex-wrap gap-3">
          {outOfStockCount > 0 && (
            <div className="flex items-center gap-2 px-4 py-2.5 bg-destructive/5 border border-destructive/20 rounded-lg text-sm">
              <AlertTriangle size={14} className="text-destructive" />
              <span className="text-foreground font-medium">{outOfStockCount} items out of stock</span>
            </div>
          )}
          {lowStockCount > 0 && (
            <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-500/5 border border-amber-500/20 rounded-lg text-sm">
              <AlertTriangle size={14} className="text-amber-500" />
              <span className="text-foreground font-medium">{lowStockCount} items low in stock</span>
            </div>
          )}
          {expiringCount > 0 && (
            <div className="flex items-center gap-2 px-4 py-2.5 bg-orange-500/5 border border-orange-500/20 rounded-lg text-sm">
              <AlertTriangle size={14} className="text-orange-500" />
              <span className="text-foreground font-medium">{expiringCount} items expiring within 30 days</span>
            </div>
          )}
        </div>
      )}

      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Items', value: allItems.length, color: 'text-foreground' },
          { label: 'Low Stock', value: lowStockCount, color: lowStockCount > 0 ? 'text-amber-500' : 'text-foreground' },
          { label: 'Out of Stock', value: outOfStockCount, color: outOfStockCount > 0 ? 'text-destructive' : 'text-foreground' },
          { label: 'Expiring Soon', value: expiringCount, color: expiringCount > 0 ? 'text-orange-500' : 'text-foreground' },
        ].map(({ label, value, color }) => (
          <div key={label} className="pm-card p-4">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Filters row */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            className="form-input pl-9 h-9 text-sm w-full"
            placeholder="Search drugs…"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPage(1) }}
          />
        </div>
        <button
          className={`btn-secondary h-9 px-3 text-sm flex items-center gap-1.5 ${showFilters ? 'bg-primary/10 text-primary border-primary/20' : ''}`}
          onClick={() => setShowFilters(f => !f)}
        >
          <Filter size={14} />
          Filters
          {(filters.category || filters.stockLevel) && (
            <span className="w-4 h-4 bg-primary text-primary-foreground rounded-full text-[10px] flex items-center justify-center font-bold">
              {[filters.category, filters.stockLevel].filter(Boolean).length}
            </span>
          )}
        </button>
        {(filters.category || filters.stockLevel) && (
          <button
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
            onClick={() => setFilters({ category: '', stockLevel: '' })}
          >
            <X size={12} /> Clear
          </button>
        )}
      </div>

      {showFilters && (
        <div className="pm-card p-4 flex flex-wrap gap-4">
          <div>
            <label className="form-label text-xs">Category</label>
            <select
              className="form-select mt-1 h-10 text-sm"
              value={filters.category}
              onChange={(e) => { setFilters(f => ({ ...f, category: e.target.value })); setPage(1) }}
            >
              <option value="">All categories</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label text-xs">Stock Level</label>
            <select
              className="form-select mt-1 h-10 text-sm"
              value={filters.stockLevel}
              onChange={(e) => { setFilters(f => ({ ...f, stockLevel: e.target.value })); setPage(1) }}
            >
              <option value="">All</option>
              <option value="low">Low stock</option>
              <option value="out">Out of stock</option>
              <option value="high">Healthy stock</option>
            </select>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="pm-card overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
          </div>
        ) : paginatedItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Package size={32} className="text-muted-foreground/30 mb-2" />
            <p className="text-sm text-muted-foreground">No items found</p>
          </div>
        ) : (
          <>
            <table className="pm-table">
              <thead>
                <tr>
                  {SORTABLE_COLS.map(col => (
                    <th
                      key={col.key}
                      className="cursor-pointer select-none"
                      onClick={() => handleSort(col.key)}
                    >
                      <span className="flex items-center gap-1">
                        {col.label}
                        <SortIcon col={col.key} sortConfig={sortConfig} />
                      </span>
                    </th>
                  ))}
                  <th>Supplier</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {paginatedItems.map(item => {
                  const isExp = item.expiryDate && new Date(item.expiryDate) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                  return (
                    <tr key={item.id}>
                      <td>
                        <div>
                          <p className="font-medium text-foreground">{item.drugName}</p>
                          {item.genericName && <p className="text-xs text-muted-foreground">{item.genericName}</p>}
                        </div>
                      </td>
                      <td>
                        <span className="badge-blue text-xs">{item.category}</span>
                      </td>
                      <td className="font-medium">
                        {item.quantity} <span className="text-xs text-muted-foreground">{item.unit || ''}</span>
                      </td>
                      <td className="text-right">
                        {item.sellingPrice ? `LKR ${item.sellingPrice?.toFixed(2)}` : '—'}
                      </td>
                      <td className={isExp ? 'text-orange-500 font-medium' : 'text-muted-foreground'}>
                        {item.expiryDate || '—'}
                      </td>
                      <td className="text-muted-foreground text-sm">
                        {item.supplierEntity?.name || item.supplier || '—'}
                      </td>
                      <td>
                        <StockBadge quantity={item.quantity} threshold={item.lowStockThreshold || 10} />
                      </td>
                      <td>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            className="w-7 h-7 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                            onClick={() => setViewingItem(item)}
                          >
                            <Eye size={13} />
                          </button>
                          <RoleProtected allowedRoles={['ADMIN', 'PHARMACIST']}>
                            <button
                              className="w-7 h-7 flex items-center justify-center rounded text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                              onClick={() => {
                                setEditingItem(item)
                                resetEdit({
                                  ...item,
                                  unitPrice: item.unitCost ?? item.unitPrice ?? '',
                                  supplierId: item.supplierEntity?.id ?? '',
                                })
                              }}
                            >
                              <Pencil size={13} />
                            </button>
                            <button
                              className="w-7 h-7 flex items-center justify-center rounded text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                              onClick={() => { setAdjustItem(item); resetAdjust() }}
                              title="Adjust stock"
                            >
                              <Activity size={13} />
                            </button>
                            <button
                              className="w-7 h-7 flex items-center justify-center rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                              onClick={() => { setDeleteItem(item); setDeleteReason('') }}
                            >
                              <Trash2 size={13} />
                            </button>
                          </RoleProtected>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-border">
                <p className="text-xs text-muted-foreground">
                  Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, sortedItems.length)} of {sortedItems.length}
                </p>
                <div className="flex items-center gap-1">
                  <button
                    className="w-7 h-7 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-40"
                    disabled={page === 1}
                    onClick={() => setPage(p => p - 1)}
                  >
                    <ChevronLeft size={14} />
                  </button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + i
                    return (
                      <button
                        key={p}
                        className={`w-7 h-7 rounded text-xs font-medium ${p === page ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`}
                        onClick={() => setPage(p)}
                      >
                        {p}
                      </button>
                    )
                  })}
                  <button
                    className="w-7 h-7 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-40"
                    disabled={page === totalPages}
                    onClick={() => setPage(p => p + 1)}
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Add Modal */}
      <Modal isOpen={addModal} onClose={() => setAddModal(false)} title="Add Inventory Item">
        <form onSubmit={handleAddSubmit(onAddSubmit)} className="space-y-4">
          <ItemForm register={regAdd} suppliers={suppliers} />
          <div className="flex gap-3 pt-2">
            <button type="button" className="btn-secondary flex-1 h-10 text-sm" onClick={() => setAddModal(false)}>Cancel</button>
            <button type="submit" className="btn-primary flex-1 h-10 text-sm disabled:opacity-40" disabled={addMutation.isPending}>
              {addMutation.isPending ? 'Adding…' : 'Add Item'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={!!editingItem} onClose={() => setEditingItem(null)} title="Edit Item">
        <form onSubmit={handleEditSubmit(onEditSubmit)} className="space-y-4">
          <ItemForm register={regEdit} suppliers={suppliers} isEdit />
          <div className="flex gap-3 pt-2">
            <button type="button" className="btn-secondary flex-1 h-10 text-sm" onClick={() => setEditingItem(null)}>Cancel</button>
            <button type="submit" className="btn-primary flex-1 h-10 text-sm disabled:opacity-40" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Adjust Stock Modal */}
      <Modal isOpen={!!adjustItem} onClose={() => setAdjustItem(null)} title={`Adjust Stock — ${adjustItem?.drugName}`}>
        <form onSubmit={handleAdjustSubmit(onAdjustSubmit)} className="space-y-4">
          <div className="p-3 bg-muted rounded-lg text-sm">
            Current stock: <span className="font-semibold text-foreground">{adjustItem?.quantity} {adjustItem?.unit || ''}</span>
          </div>
          <div>
            <label className="form-label">Quantity Change *</label>
            <input
              type="number"
              className="form-input mt-1"
              placeholder="+10 to add, -5 to remove"
              {...regAdjust('quantityChange', { required: true })}
            />
          </div>
          <div>
            <label className="form-label">Reason</label>
            <select className="form-input mt-1" {...regAdjust('reason')}>
              {ADJUST_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Note (optional)</label>
            <input className="form-input mt-1" {...regAdjust('note')} />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" className="btn-secondary flex-1 h-10 text-sm" onClick={() => setAdjustItem(null)}>Cancel</button>
            <button type="submit" className="btn-primary flex-1 h-10 text-sm disabled:opacity-40" disabled={adjustMutation.isPending}>
              {adjustMutation.isPending ? 'Adjusting…' : 'Adjust Stock'}
            </button>
          </div>
        </form>
      </Modal>

      {/* View Modal */}
      <Modal isOpen={!!viewingItem} onClose={() => setViewingItem(null)} title={viewingItem?.drugName}>
        {viewingItem && (
          <div className="space-y-3 text-sm">
            {[
              ['Generic Name', viewingItem.genericName],
              ['Category', viewingItem.category],
              ['Quantity', `${viewingItem.quantity} ${viewingItem.unit || ''}`],
              ['Batch Number', viewingItem.batchNumber],
              ['Expiry Date', viewingItem.expiryDate],
              ['Selling Price', viewingItem.sellingPrice ? `LKR ${viewingItem.sellingPrice?.toFixed(2)}` : null],
              ['Purchase Price', viewingItem.purchasePrice ? `LKR ${viewingItem.purchasePrice?.toFixed(2)}` : null],
              ['Storage Location', viewingItem.storageLocation],
              ['Supplier', viewingItem.supplierEntity?.name || viewingItem.supplier],
              ['Low Stock Threshold', viewingItem.lowStockThreshold],
            ].map(([label, value]) => value ? (
              <div key={label} className="flex justify-between gap-4">
                <span className="text-muted-foreground">{label}</span>
                <span className="font-medium text-foreground text-right">{value}</span>
              </div>
            ) : null)}
            {viewingItem.description && (
              <div className="pt-2 border-t border-border">
                <p className="text-xs text-muted-foreground mb-1">Description</p>
                <p className="text-foreground">{viewingItem.description}</p>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Delete Modal */}
      <Modal isOpen={!!deleteItem} onClose={() => setDeleteItem(null)} title={`Archive "${deleteItem?.drugName}"?`}>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            This item will be archived and removed from the active inventory. This can be reviewed in the archived items page.
          </p>
          <div>
            <label className="form-label">Reason for archiving *</label>
            <textarea
              rows={2}
              className="form-input mt-1 resize-none"
              placeholder="Enter reason…"
              value={deleteReason}
              onChange={(e) => setDeleteReason(e.target.value)}
            />
          </div>
          <div className="flex gap-3">
            <button className="btn-secondary flex-1 h-10 text-sm" onClick={() => setDeleteItem(null)}>Cancel</button>
            <button
              className="btn-danger flex-1 h-10 text-sm disabled:opacity-40"
              disabled={!deleteReason.trim() || deleteMutation.isPending}
              onClick={() => deleteMutation.mutate({ id: deleteItem.id, reason: deleteReason })}
            >
              {deleteMutation.isPending ? 'Archiving…' : 'Archive Item'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}