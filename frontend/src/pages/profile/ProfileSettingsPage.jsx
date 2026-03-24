import { useEffect, useMemo, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import { Camera, Save, Trash2, Upload, UserCircle } from 'lucide-react'
import { userApi } from '../../api/userApi'
import { patientApi } from '../../api/patientApi'
import { appointmentApi } from '../../api/appointmentApi'
import { useAuth } from '../../context/AuthContext'

function extractProfile(payload) {
  return payload?.data?.data || payload?.data || payload || null
}

function normalizeProfile(profile) {
  return {
    firstName: profile?.firstName || '',
    lastName: profile?.lastName || '',
    email: profile?.email || '',
    phone: profile?.phone || '',
  }
}

function toLocalIsoDate(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export default function ProfileSettingsPage() {
  const queryClient = useQueryClient()
  const { user, logout, syncUserProfile, hasRole } = useAuth()
  const isPatient = hasRole('PATIENT')
  const lastSyncedProfileRef = useRef('')
  const [avatarLoadError, setAvatarLoadError] = useState(false)
  const [selectedPhotoFile, setSelectedPhotoFile] = useState(null)
  const [localPhotoPreview, setLocalPhotoPreview] = useState('')

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm({
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
    },
  })

  const { data: profileRes, isLoading, isError } = useQuery({
    queryKey: ['my-profile'],
    queryFn: async () => {
      try {
        return await userApi.getMyProfile()
      } catch (err) {
        if (hasRole('PATIENT')) {
          return patientApi.getMyProfile()
        }
        throw err
      }
    },
    staleTime: 5 * 60 * 1000,
    refetchInterval: false,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  })

  const profile = useMemo(() => extractProfile(profileRes), [profileRes])
  const today = useMemo(() => toLocalIsoDate(new Date()), [])
  const upcomingEnd = useMemo(() => {
    const end = new Date()
    end.setDate(end.getDate() + 60)
    return toLocalIsoDate(end)
  }, [])

  const { data: patientUpcomingRes } = useQuery({
    queryKey: ['patient-profile-upcoming-appointments', today, upcomingEnd],
    queryFn: () => appointmentApi.getMyUpcoming(today, upcomingEnd),
    enabled: isPatient,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchInterval: 3000,
    refetchIntervalInBackground: true,
  })

  const upcomingAppointments = useMemo(() => {
    const list = extractProfile(patientUpcomingRes)
    if (!Array.isArray(list)) return []
    return list
      .filter((item) => ['SCHEDULED', 'CONFIRMED', 'REQUESTED', 'PENDING'].includes(item?.status))
      .sort((a, b) => new Date(a?.appointmentTime || a?.slotTime || 0) - new Date(b?.appointmentTime || b?.slotTime || 0))
      .slice(0, 5)
  }, [patientUpcomingRes])
  const profilePhotoUrl = (profile?.profilePhotoUrl || '').trim()
  const displayPhotoUrl = (localPhotoPreview || profilePhotoUrl || '').trim()
  const hasPhoto = Boolean(displayPhotoUrl)

  useEffect(() => {
    if (!profile) return
    if (isDirty) return

    const normalizedProfile = normalizeProfile(profile)
    const profileSnapshot = JSON.stringify(normalizedProfile)
    if (lastSyncedProfileRef.current === profileSnapshot) return

    reset(normalizedProfile)
    lastSyncedProfileRef.current = profileSnapshot
    setAvatarLoadError(false)
  }, [profile, isDirty, reset])

  useEffect(() => {
    if (profile) return
    if (!user) return
    if (isDirty) return

    // Fallback to current session user data when profile API is temporarily unavailable.
    const normalizedUser = normalizeProfile(user)
    const profileSnapshot = JSON.stringify(normalizedUser)
    if (lastSyncedProfileRef.current === profileSnapshot) return

    reset(normalizedUser)
    lastSyncedProfileRef.current = profileSnapshot
  }, [profile, user, isDirty, reset])

  useEffect(() => {
    if (!displayPhotoUrl) {
      setAvatarLoadError(false)
    }
  }, [displayPhotoUrl])

  useEffect(() => {
    return () => {
      if (localPhotoPreview) {
        URL.revokeObjectURL(localPhotoPreview)
      }
    }
  }, [localPhotoPreview])

  const updateMutation = useMutation({
    mutationFn: (payload) => userApi.updateMyProfile(payload),
    onSuccess: (res) => {
      const updatedProfile = extractProfile(res)
      const normalizedUpdatedProfile = normalizeProfile(updatedProfile)
      syncUserProfile(updatedProfile)
      queryClient.setQueryData(['my-profile'], { success: true, data: updatedProfile })
      reset(normalizedUpdatedProfile)
      lastSyncedProfileRef.current = JSON.stringify(normalizedUpdatedProfile)
      setSelectedPhotoFile(null)
      setLocalPhotoPreview('')
      setAvatarLoadError(false)
      toast.success('Profile updated successfully')

      const previousEmail = (user?.email || '').trim().toLowerCase()
      const currentEmail = (updatedProfile?.email || '').trim().toLowerCase()
      if (previousEmail && currentEmail && previousEmail !== currentEmail) {
        toast.success('Email changed. Please sign in again.')
        logout()
      }
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || 'Failed to update profile')
    },
  })

  const uploadPhotoMutation = useMutation({
    mutationFn: (file) => userApi.uploadMyProfilePhoto(file),
    onSuccess: (res) => {
      const updatedProfile = extractProfile(res)
      syncUserProfile(updatedProfile)
      queryClient.setQueryData(['my-profile'], { success: true, data: updatedProfile })
      setSelectedPhotoFile(null)
      setLocalPhotoPreview('')
      setAvatarLoadError(false)
      toast.success('Profile photo updated')
      queryClient.invalidateQueries({ queryKey: ['my-profile'] })
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || 'Failed to upload profile photo')
    },
  })

  const onSubmit = (values) => {
    const payload = {
      firstName: values.firstName?.trim(),
      lastName: values.lastName?.trim(),
      email: values.email?.trim(),
      phone: values.phone?.trim(),
      removeProfilePhoto: false,
    }
    updateMutation.mutate(payload)
  }

  const handlePhotoSelect = (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type?.startsWith('image/')) {
      toast.error('Please select an image file')
      event.target.value = ''
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be 5MB or less')
      event.target.value = ''
      return
    }

    if (localPhotoPreview) {
      URL.revokeObjectURL(localPhotoPreview)
    }

    const previewUrl = URL.createObjectURL(file)
    setSelectedPhotoFile(file)
    setLocalPhotoPreview(previewUrl)
    setAvatarLoadError(false)
  }

  const uploadSelectedPhoto = () => {
    if (!selectedPhotoFile) {
      toast('Please choose a photo first')
      return
    }
    uploadPhotoMutation.mutate(selectedPhotoFile)
  }

  const removePhoto = () => {
    const existingUrl = profilePhotoUrl
    if (!existingUrl && !selectedPhotoFile) {
      toast('No profile photo to remove')
      return
    }

    setSelectedPhotoFile(null)
    if (localPhotoPreview) {
      URL.revokeObjectURL(localPhotoPreview)
    }
    setLocalPhotoPreview('')
    setAvatarLoadError(false)

    if (!existingUrl) return
    updateMutation.mutate({ removeProfilePhoto: true })
  }

  return (
    <div className="page-container max-w-3xl mx-auto">
      <div className="page-header">
        <div>
          <h1 className="page-title">Profile Settings</h1>
          <p className="page-subtitle">Update your personal details and profile photo.</p>
        </div>
      </div>

      <div className="pm-card p-5">
        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="flex items-start gap-4">
              <div className="w-20 h-20 rounded-2xl overflow-hidden bg-muted flex items-center justify-center">
                {hasPhoto && !avatarLoadError ? (
                  <img
                    src={displayPhotoUrl}
                    alt="Profile"
                    className="w-full h-full object-cover"
                    onError={() => setAvatarLoadError(true)}
                  />
                ) : (
                  <UserCircle size={40} className="text-muted-foreground" />
                )}
              </div>
              <div className="flex-1 space-y-2">
                <label className="form-label flex items-center gap-2">
                  <Camera size={14} /> Profile Photo
                </label>
                <input type="file" accept="image/*" className="form-input" onChange={handlePhotoSelect} />
                {selectedPhotoFile && (
                  <p className="text-xs text-muted-foreground">Selected: {selectedPhotoFile.name}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Upload a photo from your device (jpg, png, webp). Max size: 5MB.
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={uploadSelectedPhoto}
                    className="btn-primary h-8 px-3 text-xs inline-flex items-center gap-1.5"
                    disabled={uploadPhotoMutation.isPending || !selectedPhotoFile}
                  >
                    <Upload size={12} /> {uploadPhotoMutation.isPending ? 'Uploading...' : 'Upload Photo'}
                  </button>
                  <button
                    type="button"
                    onClick={removePhoto}
                    className="btn-secondary h-8 px-3 text-xs inline-flex items-center gap-1.5"
                    disabled={updateMutation.isPending || uploadPhotoMutation.isPending || !hasPhoto}
                  >
                    <Trash2 size={12} /> Remove Photo
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="form-label">First Name</label>
                <input
                  className="form-input"
                  {...register('firstName', {
                    required: 'First name is required',
                    maxLength: { value: 100, message: 'First name must be 100 characters or less' },
                  })}
                />
                {errors.firstName && <p className="text-xs text-destructive mt-1">{errors.firstName.message}</p>}
              </div>
              <div>
                <label className="form-label">Last Name</label>
                <input
                  className="form-input"
                  {...register('lastName', {
                    required: 'Last name is required',
                    maxLength: { value: 100, message: 'Last name must be 100 characters or less' },
                  })}
                />
                {errors.lastName && <p className="text-xs text-destructive mt-1">{errors.lastName.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="form-label">Email</label>
                <input
                  type="email"
                  className="form-input"
                  {...register('email', {
                    required: 'Email is required',
                    maxLength: { value: 150, message: 'Email must be 150 characters or less' },
                  })}
                />
                {errors.email && <p className="text-xs text-destructive mt-1">{errors.email.message}</p>}
              </div>
              <div>
                <label className="form-label">Phone</label>
                <input
                  className="form-input"
                  {...register('phone', {
                    maxLength: { value: 20, message: 'Phone must be 20 characters or less' },
                  })}
                />
                {errors.phone && <p className="text-xs text-destructive mt-1">{errors.phone.message}</p>}
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="btn-primary h-10 px-4 text-sm inline-flex items-center gap-2 disabled:opacity-50"
                disabled={updateMutation.isPending || uploadPhotoMutation.isPending || !isDirty}
              >
                <Save size={14} />
                {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
              </button>
            </div>

            {isError && !profile && !user && (
              <p className="text-xs text-destructive">Unable to load profile details. Refresh and try again.</p>
            )}
          </form>
        )}
      </div>

      {isPatient && (
        <div className="pm-card p-5 mt-4">
          <h2 className="text-sm font-semibold text-foreground mb-3">Upcoming Appointments</h2>
          {upcomingAppointments.length === 0 ? (
            <p className="text-sm text-muted-foreground">No upcoming appointments found.</p>
          ) : (
            <div className="space-y-2">
              {upcomingAppointments.map((appointment) => {
                const apptDateTime = appointment?.appointmentTime || appointment?.slotTime
                return (
                  <div key={appointment.id} className="rounded-lg border border-border bg-muted/30 px-3 py-2">
                    <p className="text-sm font-medium text-foreground">Dr. {appointment?.doctorName || '-'}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {apptDateTime ? new Date(apptDateTime).toLocaleString([], { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}
                    </p>
                    <p className="text-xs text-primary mt-1">{appointment?.status || 'CONFIRMED'}</p>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
