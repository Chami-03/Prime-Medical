import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import { useForm } from 'react-hook-form'
import { staffApi } from '../../api/staffApi'
import { RoleProtected } from '../../context/AuthContext'
import Modal from '../../components/common/Modal'
import { Users, Shield, Phone, Mail, Award, Search, Pencil, UserX, Plus } from 'lucide-react'

function FormRow({ label, children }) {
  return (
    <div>
      <label className="form-label">{label}</label>
      <div className="mt-1">{children}</div>
    </div>
  )
}

export default function StaffProfilesPage() {
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState('')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeactivateModalOpen, setIsDeactivateModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState(null)

  const { data: staffRes, isLoading } = useQuery({
    queryKey: ['staff'],
    queryFn: () => staffApi.getAll(),
  })

  const { register, handleSubmit, reset, setValue } = useForm()
  const {
    register: registerCreate,
    handleSubmit: handleCreateSubmit,
    reset: resetCreate,
  } = useForm()

  const createMutation = useMutation({
    mutationFn: (data) => staffApi.createStaff({
      ...data,
      permissions: typeof data.permissions === 'string'
        ? data.permissions.split(',').map(s => s.trim()).filter(Boolean)
        : data.permissions,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] })
      toast.success('Staff profile created')
      setIsCreateModalOpen(false)
      resetCreate()
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Create failed'),
  })

  const updateMutation = useMutation({
    mutationFn: (data) => staffApi.updateStaff(editingItem.userId, {
      ...data,
      permissions: typeof data.permissions === 'string'
        ? data.permissions.split(',').map(s => s.trim()).filter(Boolean)
        : data.permissions,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] })
      toast.success('Staff profile updated')
      closeEditModal()
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Update failed'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => staffApi.deactivateStaff(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] })
      toast.success('Staff member deactivated')
      setIsDeactivateModalOpen(false)
      setEditingItem(null)
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Deactivation failed'),
  })

  const openEditModal = (item) => {
    setEditingItem(item)
    setValue('firstName', item.firstName)
    setValue('lastName', item.lastName)
    setValue('phone', item.phone || '')
    setValue('role', item.role || '')
    setValue('specialization', item.specialization || '')
    setValue('licenseNumber', item.licenseNumber || '')
    setValue('permissions', item.permissions ? item.permissions.join(', ') : '')
    setIsEditModalOpen(true)
  }

  const closeEditModal = () => {
    setIsEditModalOpen(false)
    setEditingItem(null)
    reset()
  }

  const openDeactivate = (item) => {
    setEditingItem(item)
    setIsDeactivateModalOpen(true)
  }

  const profilesRaw = staffRes?.data || []
  const profiles = Array.from(
    new Map(profilesRaw.filter((p) => p?.userId != null).map((p) => [p.userId, p])).values()
  )
  const activeCount = profiles.filter(p => p.isActive).length
  const isPrimaryDoctor = (item) => {
    const fullName = `${item?.firstName || ''} ${item?.lastName || ''}`.trim().toLowerCase()
    return fullName === 'pulasthi senevirathne'
  }

  const filteredProfiles = profiles
    .filter(p =>
      `${p.firstName} ${p.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.role && p.role.toLowerCase().includes(searchQuery.toLowerCase()))
    )
    .sort((a, b) => {
      const aPrimary = isPrimaryDoctor(a)
      const bPrimary = isPrimaryDoctor(b)
      if (aPrimary && !bPrimary) return -1
      if (!aPrimary && bPrimary) return 1

      const aName = `${a?.firstName || ''} ${a?.lastName || ''}`.trim()
      const bName = `${b?.firstName || ''} ${b?.lastName || ''}`.trim()
      return aName.localeCompare(bName)
    })

  return (
    <div className="space-y-5">
      {/* Page header + KPIs */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-xl font-semibold text-foreground">Staff Profiles</h2>
        <div className="flex items-center gap-2">
          <span className="badge-blue text-sm">{activeCount} Active</span>
          <span className="badge-gray text-sm">{profiles.length - activeCount} Inactive</span>
          <RoleProtected allowedRoles={['ADMIN', 'OWNER']}>
            <button className="btn-primary h-9 px-3 text-sm flex items-center gap-1.5" onClick={() => setIsCreateModalOpen(true)}>
              <Plus size={14} /> Add Staff
            </button>
          </RoleProtected>
        </div>
      </div>

      {/* Search */}
      <div className="pm-card p-3">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            className="form-input pl-8 h-9 text-sm"
            placeholder="Search by name or role"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="pm-card overflow-hidden">
        <table className="pm-table">
          <thead>
            <tr>
              <th>Staff Member</th>
              <th>Contact</th>
              <th>Role & Access</th>
              <th>Status</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={5} className="py-16 text-center">
                  <div className="flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                  </div>
                </td>
              </tr>
            ) : filteredProfiles.length > 0 ? (
              filteredProfiles.map(item => (
                <tr key={item.userId} className={!item.isActive ? 'opacity-50' : ''}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                        <Users size={15} className="text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground text-sm">{item.firstName} {item.lastName}</p>
                        {item.specialization && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Award size={10} /> {item.specialization}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="space-y-1">
                      <p className="text-xs text-foreground flex items-center gap-1.5"><Mail size={11} className="text-muted-foreground" />{item.email}</p>
                      {item.phone && <p className="text-xs text-muted-foreground flex items-center gap-1.5"><Phone size={11} />{item.phone}</p>}
                    </div>
                  </td>
                  <td>
                    <span className="inline-flex items-center gap-1.5 badge-blue text-[10px] font-semibold uppercase">
                      <Shield size={10} /> {item.role || 'Unassigned'}
                    </span>
                    {item.permissions?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {item.permissions.map(p => (
                          <span key={p} className="text-[9px] font-mono bg-muted border border-border/50 text-muted-foreground px-1.5 py-0.5 rounded">{p}</span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td>
                    {item.isActive
                      ? <span className="badge-green flex items-center gap-1 w-fit text-[10px]"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />Active</span>
                      : <span className="badge-red flex items-center gap-1 w-fit text-[10px]"><span className="w-1.5 h-1.5 rounded-full bg-red-500" />Inactive</span>
                    }
                  </td>
                  <td>
                    <RoleProtected allowedRoles={['ADMIN', 'OWNER', 'DOCTOR']}>
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(item)}
                          className="w-8 h-8 rounded-lg border border-border bg-muted/30 hover:border-primary hover:text-primary transition-colors flex items-center justify-center"
                          title="Edit profile"
                        >
                          <Pencil size={13} />
                        </button>
                        {item.isActive && (
                          <button
                            onClick={() => openDeactivate(item)}
                            className="w-8 h-8 rounded-lg border border-destructive/20 bg-destructive/5 text-destructive hover:bg-destructive hover:text-white transition-colors flex items-center justify-center"
                            title="Deactivate"
                          >
                            <UserX size={13} />
                          </button>
                        )}
                      </div>
                    </RoleProtected>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="py-16 text-center">
                  <Users size={28} className="text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No staff found</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Edit Modal */}
      <Modal isOpen={isEditModalOpen} onClose={closeEditModal} title="Manage Staff Profile">
        <form onSubmit={handleSubmit(d => updateMutation.mutate(d))} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <FormRow label="First Name">
              <input className="form-input" {...register('firstName', { required: true })} />
            </FormRow>
            <FormRow label="Last Name">
              <input className="form-input" {...register('lastName', { required: true })} />
            </FormRow>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormRow label="Role">
              <input className="form-input uppercase" placeholder="NURSE, DOCTOR" {...register('role', { required: true })} />
            </FormRow>
            <FormRow label="Phone">
              <input className="form-input" {...register('phone')} />
            </FormRow>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormRow label="Specialization">
              <input className="form-input" placeholder="e.g. Head Pharmacist" {...register('specialization')} />
            </FormRow>
            <FormRow label="License/Registration #">
              <input className="form-input font-mono" {...register('licenseNumber')} />
            </FormRow>
          </div>
          <FormRow label="Permissions (comma-separated)">
            <input className="form-input font-mono text-xs" placeholder="MANAGE_INVENTORY, VIEW_REPORTS" {...register('permissions')} />
          </FormRow>
          <div className="flex gap-3 pt-2">
            <button type="button" className="btn-secondary flex-1 h-10 text-sm" onClick={closeEditModal}>Cancel</button>
            <button type="submit" className="btn-primary flex-[2] h-10 text-sm disabled:opacity-40" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? 'Saving' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Create Modal */}
      <Modal isOpen={isCreateModalOpen} onClose={() => { setIsCreateModalOpen(false); resetCreate() }} title="Create Staff Profile">
        <form onSubmit={handleCreateSubmit(d => createMutation.mutate(d))} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <FormRow label="First Name">
              <input className="form-input" {...registerCreate('firstName', { required: true })} />
            </FormRow>
            <FormRow label="Last Name">
              <input className="form-input" {...registerCreate('lastName', { required: true })} />
            </FormRow>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormRow label="Email">
              <input type="email" className="form-input" {...registerCreate('email', { required: true })} />
            </FormRow>
            <FormRow label="Phone">
              <input className="form-input" {...registerCreate('phone')} />
            </FormRow>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormRow label="Role">
              <input className="form-input uppercase" placeholder="DOCTOR, NURSE" {...registerCreate('role', { required: true })} />
            </FormRow>
            <FormRow label="Temporary Password">
              <input type="password" className="form-input" placeholder="Password123!" {...registerCreate('password')} />
            </FormRow>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormRow label="Specialization">
              <input className="form-input" {...registerCreate('specialization')} />
            </FormRow>
            <FormRow label="License/Registration #">
              <input className="form-input" {...registerCreate('licenseNumber')} />
            </FormRow>
          </div>
          <FormRow label="Permissions (comma-separated)">
            <input className="form-input font-mono text-xs" placeholder="MANAGE_INVENTORY, VIEW_REPORTS" {...registerCreate('permissions')} />
          </FormRow>
          <div className="flex gap-3 pt-2">
            <button type="button" className="btn-secondary flex-1 h-10 text-sm" onClick={() => { setIsCreateModalOpen(false); resetCreate() }}>Cancel</button>
            <button type="submit" className="btn-primary flex-[2] h-10 text-sm disabled:opacity-40" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Creating' : 'Create Staff'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Deactivate confirmation modal */}
      <Modal isOpen={isDeactivateModalOpen} onClose={() => { setIsDeactivateModalOpen(false); setEditingItem(null) }} title="Deactivate Staff Member">
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Are you sure you want to deactivate <span className="font-semibold text-foreground">{editingItem?.firstName} {editingItem?.lastName}</span>? This will revoke their system access.
          </p>
          <div className="flex gap-3">
            <button className="btn-secondary flex-1 h-10 text-sm" onClick={() => { setIsDeactivateModalOpen(false); setEditingItem(null) }}>Cancel</button>
            <button className="btn-danger flex-1 h-10 text-sm disabled:opacity-40" disabled={deleteMutation.isPending} onClick={() => deleteMutation.mutate(editingItem.userId)}>
              {deleteMutation.isPending ? 'Deactivating' : 'Yes, Deactivate'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}