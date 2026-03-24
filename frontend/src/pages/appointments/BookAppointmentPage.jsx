import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'
import { patientApi } from '../../api/patientApi'
import { appointmentApi } from '../../api/appointmentApi'
import { userApi } from '../../api/userApi'
import { Search, User, Calendar, Clock, ClipboardList, CheckCircle2, ChevronDown } from 'lucide-react'

function getBookingErrorMessage(err) {
  const data = err?.response?.data
  if (!data) return 'Booking failed'
  if (typeof data.message === 'string' && data.message.trim()) return data.message
  if (typeof data.error === 'string' && data.error.trim()) return data.error
  if (Array.isArray(data.errors) && data.errors.length > 0) {
    const first = data.errors[0]
    if (typeof first === 'string') return first
    if (first?.defaultMessage) return first.defaultMessage
  }
  return 'Booking failed'
}

export default function BookAppointmentPage() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const location = useLocation()
  const { user, hasRole } = useAuth()
  const isPatient = hasRole('PATIENT')

  const statePatientRaw = location.state?.patient || null
  const statePatient = statePatientRaw?.data || statePatientRaw || null
  const statePatientId = Number(location.state?.patientId || statePatient?.id || 0) || null

  const [selectedPatient, setSelectedPatient] = useState(statePatient)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [selectedDoctorId, setSelectedDoctorId] = useState(hasRole('DOCTOR') ? user?.id : null)
  const [reason, setReason] = useState('')
  const [visitType, setVisitType] = useState('REGULAR')

  const { data: myPatientRes } = useQuery({
    queryKey: ['my-patient-profile'],
    queryFn: () => patientApi.getMyProfile(),
    enabled: isPatient,
  })

  const { data: statePatientRes } = useQuery({
    queryKey: ['booking-state-patient', statePatientId],
    queryFn: () => patientApi.getById(statePatientId),
    enabled: !isPatient && !!statePatientId,
  })

  useEffect(() => {
    if (isPatient && myPatientRes?.data) {
      setSelectedPatient(myPatientRes.data)
    }
  }, [isPatient, myPatientRes])

  useEffect(() => {
    if (isPatient) return

    const resolvedStatePatient = statePatientRes?.data || statePatientRes || statePatient
    if (resolvedStatePatient?.id) {
      setSelectedPatient(resolvedStatePatient)
    }
  }, [isPatient, statePatient, statePatientRes])

  useEffect(() => {
    if (hasRole('DOCTOR') && user?.id) {
      setSelectedDoctorId(user.id)
    }
  }, [hasRole, user?.id])

  const { data: searchRes, isLoading: isSearching } = useQuery({
    queryKey: ['patient-search-book', searchQuery],
    queryFn: () => patientApi.search(searchQuery),
    enabled: searchQuery.length > 2 && !selectedPatient && !isPatient,
  })

  const { data: patientsRes } = useQuery({
    queryKey: ['patients-book-quick-list'],
    queryFn: () => patientApi.getAll(),
    enabled: !selectedPatient && !isPatient,
  })

  const { data: doctorsRes } = useQuery({
    queryKey: ['doctors'],
    queryFn: () => userApi.getDoctors(),
    enabled: !hasRole('DOCTOR'),
  })

  const allowedDoctors = useMemo(() => {
    const doctors = doctorsRes?.data ?? []
    const targetName = 'pulasthi senevirathne'
    const matches = doctors.filter((doc) => {
      const fullName = [doc?.firstName, doc?.lastName].filter(Boolean).join(' ').trim().toLowerCase()
      return fullName === targetName
    })

    return matches.length > 0 ? [matches[0]] : []
  }, [doctorsRes])

  const selectedDoctor = useMemo(
    () => allowedDoctors.find((doc) => Number(doc.id) === Number(selectedDoctorId)) || null,
    [allowedDoctors, selectedDoctorId]
  )

  const { data: slotsRes, isLoading: isLoadingSlots } = useQuery({
    queryKey: ['available-slots', selectedDoctorId, selectedDate],
    queryFn: () => appointmentApi.getAvailableSlots(selectedDoctorId, selectedDate),
    enabled: !!selectedDoctorId,
  })

  const bookMutation = useMutation({
    mutationFn: (data) => appointmentApi.book(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
      queryClient.invalidateQueries({ queryKey: ['calendar'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-patient-upcoming'] })
      queryClient.invalidateQueries({ queryKey: ['patient-profile-upcoming-appointments'] })
      toast.success('Appointment booked and confirmed!')
      navigate(`/appointments?date=${selectedDate}`)
    },
    onError: (err) => toast.error(getBookingErrorMessage(err)),
  })

  const handleBook = () => {
    if (!selectedDoctorId) {
      toast.error('Please select a doctor before booking')
      return
    }
    if (!selectedSlot) return
    if (!isPatient && !selectedPatient) return

    const payload = {
      doctorId: selectedDoctorId,
      appointmentTime: selectedSlot,
      reason,
      visitType,
    }

    if (!isPatient) {
      payload.patientId = selectedPatient.id
    } else if (selectedPatient?.id) {
      payload.patientId = selectedPatient.id
    }

    bookMutation.mutate(payload)
  }

  const slots = slotsRes?.data || []
  const searchedPatients = searchRes?.data || []
  const quickPatients = (patientsRes?.data || []).slice(0, 8)

  return (
    <div className="space-y-5 pb-10 max-w-5xl mx-auto">
      <h2 className="text-xl font-semibold text-foreground">Book Appointment</h2>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: steps */}
        <div className="lg:col-span-8 space-y-4">

          {/* Step 1  Patient */}
          <div className="pm-card p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
              <User size={14} className="text-primary" /> Patient
            </h3>

            {!selectedPatient ? (
              <div className="space-y-3">
                {isPatient ? (
                  <p className="text-sm text-muted-foreground">Loading your patient profile...</p>
                ) : (
                  <>
                    <div className="relative">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input
                        className="form-input pl-8 h-9 text-sm"
                        placeholder="Search by name, NIC, or patient ID"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                      />
                    </div>
                    {isSearching && <p className="text-xs text-center text-primary animate-pulse py-2">Searching</p>}
                    {searchedPatients.length > 0 && (
                      <div className="border border-border rounded-xl overflow-hidden divide-y divide-border">
                        {searchedPatients.map(p => (
                          <button
                            key={p.id}
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/40 transition-colors text-left"
                            onClick={() => { setSelectedPatient(p); setSearchQuery('') }}
                          >
                            <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-sm font-bold text-primary shrink-0 uppercase">
                              {p.firstName?.[0]}{p.lastName?.[0]}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-foreground">{p.firstName} {p.lastName}</p>
                              <p className="text-xs text-muted-foreground font-mono">{p.patientNumber}  {p.nicNumber}</p>
                            </div>
                            <span className="ml-auto text-xs text-primary font-medium">Select</span>
                          </button>
                        ))}
                      </div>
                    )}
                    {!searchQuery.trim() && quickPatients.length > 0 && (
                      <div className="border border-border rounded-xl overflow-hidden divide-y divide-border">
                        {quickPatients.map(p => (
                          <button
                            key={p.id}
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/40 transition-colors text-left"
                            onClick={() => setSelectedPatient(p)}
                          >
                            <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-sm font-bold text-primary shrink-0 uppercase">
                              {p.firstName?.[0]}{p.lastName?.[0]}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-foreground">{p.firstName} {p.lastName}</p>
                              <p className="text-xs text-muted-foreground font-mono">{p.patientNumber}  {p.nicNumber}</p>
                            </div>
                            <span className="ml-auto text-xs text-primary font-medium">Select</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-between p-3 bg-primary/5 border border-primary/20 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold uppercase">
                    {selectedPatient.firstName?.[0]}{selectedPatient.lastName?.[0]}
                  </div>
                  <div>
                    <p className="font-medium text-foreground text-sm">{selectedPatient.firstName} {selectedPatient.lastName}</p>
                    <p className="text-xs font-mono text-primary">{selectedPatient.patientNumber}</p>
                  </div>
                </div>
                {!isPatient && (
                  <button className="btn-ghost h-8 px-3 text-xs" onClick={() => setSelectedPatient(null)}>Change</button>
                )}
              </div>
            )}
          </div>

          {/* Step 2  Date & Slot */}
          <div className="pm-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Clock size={14} className="text-primary" /> Select Slot
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_220px] gap-3 items-end mb-5">
              {!hasRole('DOCTOR') ? (
                <div>
                  <label className="form-label">Select Doctor</label>
                  <div className="relative mt-1">
                    <select
                      className="form-input h-10 text-sm w-full appearance-none pr-10 leading-none"
                      value={selectedDoctorId ?? ''}
                      onChange={e => { setSelectedDoctorId(e.target.value ? Number(e.target.value) : null); setSelectedSlot(null) }}
                    >
                      <option value="">-- Select Doctor --</option>
                      {allowedDoctors.map(doc => (
                        <option key={doc.id} value={doc.id}>
                          Dr. {[doc.firstName, doc.lastName].filter(Boolean).join(' ')}
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="form-label">Doctor</label>
                  <div className="form-input h-10 text-sm mt-1 flex items-center bg-muted/30">
                    Dr. {[user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'Assigned'}
                  </div>
                </div>
              )}

              <div>
                <label className="form-label">Date</label>
                <input
                  type="date"
                  className="form-input h-10 text-sm w-full mt-1"
                  value={selectedDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={e => { setSelectedDate(e.target.value); setSelectedSlot(null) }}
                />
              </div>
            </div>

            {!hasRole('DOCTOR') && (
              <p className="text-[11px] text-muted-foreground mb-4">
                {selectedDoctor
                  ? `Selected doctor: Dr. ${[selectedDoctor.firstName, selectedDoctor.lastName].filter(Boolean).join(' ')}`
                  : 'Please select a doctor'}
              </p>
            )}

            {isLoadingSlots ? (
              <div className="flex items-center justify-center py-10">
                <div className="w-5 h-5 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
              </div>
            ) : slots.length > 0 ? (
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                {slots.map((slotIso, idx) => {
                  const slotTime = slotIso.split('T')[1].substring(0, 5)
                  return (
                    <button
                      key={idx}
                      onClick={() => setSelectedSlot(slotIso)}
                      className={`h-10 rounded-lg text-xs font-semibold transition-all border ${
                        selectedSlot === slotIso
                          ? 'bg-primary text-primary-foreground border-primary shadow-md'
                          : 'bg-card border-border hover:border-primary/50 hover:text-primary'
                      }`}
                    >
                      {slotTime}
                    </button>
                  )
                })}
              </div>
            ) : (
              <div className="py-10 text-center border-2 border-dashed border-border rounded-xl">
                <Calendar size={24} className="text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No slots available for this date</p>
              </div>
            )}
          </div>

          {/* Step 3  Visit Details */}
          <div className="pm-card p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
              <ClipboardList size={14} className="text-primary" /> Visit Details
            </h3>
            <div className="space-y-3">
              <div>
                <label className="form-label">Appointment Type</label>
                <select className="form-input mt-1" value={visitType} onChange={e => setVisitType(e.target.value)}>
                  <option value="REGULAR">Regular Consultation</option>
                  <option value="FOLLOW_UP">Follow-up</option>
                  <option value="WALK_IN">Emergency / Walk-in</option>
                  <option value="CONSULTATION">Specialist Referral</option>
                </select>
              </div>
              <div>
                <label className="form-label">Reason for Visit</label>
                <textarea
                  rows={3}
                  className="form-input mt-1 resize-none"
                  placeholder="Briefly describe the reason"
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right: summary + confirm */}
        <div className="lg:col-span-4">
          <div className="pm-card p-5 sticky top-4">
            <h3 className="text-sm font-semibold text-foreground mb-4">Appointment Summary</h3>
            <div className="space-y-3 mb-5">
              <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl">
                <User size={14} className="text-muted-foreground shrink-0" />
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Patient</p>
                  <p className="text-sm font-medium text-foreground">
                    {selectedPatient
                      ? `${selectedPatient.firstName || ''} ${selectedPatient.lastName || ''}`.trim()
                      : (isPatient ? (user?.fullName || [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'My Profile') : '')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl">
                <Clock size={14} className="text-muted-foreground shrink-0" />
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Time Slot</p>
                  <p className="text-sm font-medium text-foreground font-mono">
                    {selectedSlot ? `${selectedSlot.split('T')[0]}  ${selectedSlot.split('T')[1].substring(0, 5)}` : ''}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl">
                <ClipboardList size={14} className="text-primary shrink-0" />
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Type</p>
                  <p className="text-sm font-medium text-primary">{visitType}</p>
                </div>
              </div>
            </div>

            {((isPatient || selectedPatient) && selectedSlot && selectedDoctorId) && (
              <div className="flex items-center gap-2 text-xs text-emerald-600 mb-4">
                <CheckCircle2 size={14} />
                <span>Ready to book</span>
              </div>
            )}

            {((!isPatient && !selectedPatient) || !selectedSlot || !selectedDoctorId) && (
              <p className="text-xs text-amber-600 mb-3">
                {!isPatient && !selectedPatient ? 'Select a patient' : ''}
                {!isPatient && !selectedPatient && (!selectedDoctorId || !selectedSlot) ? ' and ' : ''}
                {!selectedDoctorId ? 'select a doctor' : ''}
                {!selectedDoctorId && !selectedSlot ? ' and ' : ''}
                {!selectedSlot ? 'select a time slot' : ''} to enable confirm booking.
              </p>
            )}

            <button
              disabled={((!isPatient && !selectedPatient) || !selectedSlot || !selectedDoctorId || bookMutation.isPending)}
              onClick={handleBook}
              className="btn-primary w-full h-10 text-sm disabled:opacity-30"
            >
              {bookMutation.isPending ? 'Booking' : 'Confirm Booking'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}