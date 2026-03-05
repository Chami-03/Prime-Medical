import { useState } from 'react'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Search, UserPlus, Phone, Calendar, UserCheck, ExternalLink } from 'lucide-react'
import { patientApi } from '../../api/patientApi'
import { queueApi } from '../../api/queueApi'
import { RoleProtected } from '../../context/AuthContext'
import Button from '../../components/common/Button'
import CheckInModal from '../../components/common/CheckInModal'
import { toast } from 'react-hot-toast'
import { Link } from 'react-router-dom'

export default function PatientSearchPage() {
  const [query, setQuery] = useState('')
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [checkInPatient, setCheckInPatient] = useState(null)

  const checkInMutation = useMutation({
    mutationFn: (data) => queueApi.checkIn(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['today-queue'] })
      toast.success('Patient checked in (Walk-in)')
      setCheckInPatient(null)
    },
    onError: () => toast.error('Check-in failed'),
  })

  const { data, isLoading } = useQuery({
    queryKey: ['patients', query],
    queryFn: () => (query.trim() ? patientApi.search(query) : patientApi.getAll()),
    enabled: true,
  })

  const patients = Array.isArray(data) ? data : data?.data || []

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-foreground">Patients</h2>
        <RoleProtected allowedRoles={['DOCTOR', 'RECEPTIONIST']}>
          <Link to="/patients/register">
            <Button size="sm" className="flex items-center gap-1.5">
              <UserPlus size={14} />
              Register Patient
            </Button>
          </Link>
        </RoleProtected>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          placeholder="Search by name, NIC, or patient ID"
          className="form-input pl-9"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="pm-card overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
          </div>
        ) : patients.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Search size={32} className="text-muted-foreground/30 mb-2" />
            <p className="text-sm text-muted-foreground">{query ? 'No patients match your search' : 'No patients registered yet'}</p>
          </div>
        ) : (
          <table className="pm-table">
            <thead>
              <tr>
                <th>Patient</th>
                <th>Contact</th>
                <th>NIC</th>
                <th>Age / Gender</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {patients.map((patient) => (
                <tr key={patient.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold flex-shrink-0 uppercase">
                        {patient.firstName?.charAt(0)}{patient.lastName?.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{patient.firstName} {patient.lastName}</p>
                        <p className="text-xs text-muted-foreground">{patient.patientNumber}</p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Phone size={13} />
                      {patient.phone}
                    </div>
                  </td>
                  <td className="text-sm text-muted-foreground font-mono">{patient.nicNumber}</td>
                  <td className="text-sm text-muted-foreground">{patient.age}y  {patient.gender}</td>
                  <td>
                    <div className="flex items-center justify-end gap-1">
                      <RoleProtected allowedRoles={['DOCTOR', 'RECEPTIONIST', 'NURSE']}>
                        <button
                          title="Walk-in Check-in"
                          className="p-1.5 rounded-md hover:bg-primary/10 text-primary transition-colors"
                          onClick={() => setCheckInPatient(patient)}
                        >
                          <UserCheck size={15} />
                        </button>
                      </RoleProtected>
                      <RoleProtected allowedRoles={['DOCTOR', 'RECEPTIONIST']}>
                        <button
                          title="Book Appointment"
                          className="p-1.5 rounded-md hover:bg-muted text-muted-foreground transition-colors"
                          onClick={() => navigate('/appointments/book', { state: { patient } })}
                        >
                          <Calendar size={15} />
                        </button>
                      </RoleProtected>
                      <button
                        title="View Profile"
                        className="p-1.5 rounded-md hover:bg-muted text-muted-foreground transition-colors"
                        onClick={() => navigate(`/patients/${patient.id}`)}
                      >
                        <ExternalLink size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <CheckInModal
        isOpen={!!checkInPatient}
        onClose={() => setCheckInPatient(null)}
        patient={checkInPatient}
        isPending={checkInMutation.isPending}
        onConfirm={(priority) => checkInMutation.mutate({ patientId: checkInPatient.id, priority })}
      />
    </div>
  )
}
