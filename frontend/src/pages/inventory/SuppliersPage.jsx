import { useState } from 'react'
import { Plus, Pencil, Trash2, Search, Truck } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import { supplierApi } from '../../api/supplierApi'
import { RoleProtected } from '../../context/AuthContext'
import Modal from '../../components/common/Modal'
import { useForm } from 'react-hook-form'

export default function SuppliersPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const { data: res, isLoading } = useQuery({
    queryKey: ['suppliers', search],
    queryFn: () => supplierApi.getAll(search),
  })

  const createMutation = useMutation({
    mutationFn: (data) => supplierApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] })
      toast.success('Supplier added')
      setIsModalOpen(false)
      reset()
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => supplierApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] })
      toast.success('Supplier updated')
      setEditingSupplier(null)
      setIsModalOpen(false)
      reset()
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => supplierApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] })
      toast.success('Supplier deleted')
      setDeleteTarget(null)
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed'),
  })

  const { register, handleSubmit, reset, setValue } = useForm()

  const suppliers = Array.isArray(res) ? res : res?.data || []

  const openAdd = () => {
    setEditingSupplier(null)
    reset({ name: '', contactPerson: '', phone: '', email: '', address: '' })
    setIsModalOpen(true)
  }

  const openEdit = (s) => {
    setEditingSupplier(s)
    setValue('name', s.name)
    setValue('contactPerson', s.contactPerson || '')
    setValue('phone', s.phone || '')
    setValue('email', s.email || '')
    setValue('address', s.address || '')
    setIsModalOpen(true)
  }

  const onSubmit = (d) => {
    if (editingSupplier) updateMutation.mutate({ id: editingSupplier.id, data: d })
    else createMutation.mutate(d)
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-foreground">Suppliers</h2>
        <RoleProtected allowedRoles={['ADMIN', 'PHARMACIST']}>
          <button className="btn-primary h-9 px-3 text-sm flex items-center gap-1.5" onClick={openAdd}>
            <Plus size={14} /> Add Supplier
          </button>
        </RoleProtected>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          className="form-input pl-9 h-9 text-sm w-full"
          placeholder="Search suppliers…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="pm-card overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
          </div>
        ) : suppliers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Truck size={32} className="text-muted-foreground/30 mb-2" />
            <p className="text-sm text-muted-foreground">No suppliers found</p>
          </div>
        ) : (
          <table className="pm-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Contact Person</th>
                <th>Phone</th>
                <th>Email</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {suppliers.map(s => (
                <tr key={s.id}>
                  <td className="font-medium text-foreground">{s.name}</td>
                  <td className="text-muted-foreground">{s.contactPerson || '—'}</td>
                  <td className="text-muted-foreground font-mono text-xs">{s.phone || '—'}</td>
                  <td className="text-muted-foreground text-sm">{s.email || '—'}</td>
                  <td>
                    <RoleProtected allowedRoles={['ADMIN', 'PHARMACIST']}>
                      <div className="flex items-center justify-end gap-1">
                        <button
                          className="w-7 h-7 flex items-center justify-center rounded text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                          onClick={() => openEdit(s)}
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          className="w-7 h-7 flex items-center justify-center rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                          onClick={() => setDeleteTarget(s)}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </RoleProtected>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingSupplier ? 'Edit Supplier' : 'Add Supplier'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="form-label">Supplier Name *</label>
            <input className="form-input mt-1" {...register('name', { required: true })} />
          </div>
          <div>
            <label className="form-label">Contact Person</label>
            <input className="form-input mt-1" {...register('contactPerson')} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label">Phone</label>
              <input className="form-input mt-1" {...register('phone')} />
            </div>
            <div>
              <label className="form-label">Email</label>
              <input type="email" className="form-input mt-1" {...register('email')} />
            </div>
          </div>
          <div>
            <label className="form-label">Address</label>
            <textarea rows={2} className="form-input mt-1 resize-none" {...register('address')} />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" className="btn-secondary flex-1 h-10 text-sm" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button
              type="submit"
              className="btn-primary flex-1 h-10 text-sm disabled:opacity-40"
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {editingSupplier ? 'Update' : 'Add Supplier'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete confirmation */}
      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title={`Delete "${deleteTarget?.name}"?`}>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            This supplier will be permanently deleted. Any linked inventory items will lose their supplier reference.
          </p>
          <div className="flex gap-3">
            <button className="btn-secondary flex-1 h-10 text-sm" onClick={() => setDeleteTarget(null)}>Cancel</button>
            <button
              className="btn-danger flex-1 h-10 text-sm disabled:opacity-40"
              disabled={deleteMutation.isPending}
              onClick={() => deleteMutation.mutate(deleteTarget.id)}
            >
              {deleteMutation.isPending ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
