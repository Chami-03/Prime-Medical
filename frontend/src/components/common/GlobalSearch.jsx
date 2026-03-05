import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Search, Users, Calendar, Pill, X, ArrowRight, Loader2 } from 'lucide-react'
import { patientApi } from '../../api/patientApi'
import { appointmentApi } from '../../api/appointmentApi'
import { inventoryApi } from '../../api/inventoryApi'
import { useAuth } from '../../context/AuthContext'

function useDebounce(value, delay = 300) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

export default function GlobalSearch() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const inputRef = useRef(null)
  const containerRef = useRef(null)
  const navigate = useNavigate()
  const { hasAnyRole } = useAuth()

  const canSearchPatients     = hasAnyRole('DOCTOR', 'NURSE', 'RECEPTIONIST', 'ADMIN')
  const canSearchAppointments = hasAnyRole('DOCTOR', 'NURSE', 'RECEPTIONIST', 'ADMIN', 'PATIENT')
  const canSearchInventory    = hasAnyRole('PHARMACIST', 'DOCTOR', 'ADMIN')

  const dq = useDebounce(query, 300)
  const isActive = dq.length >= 2

  const { data: patientsRes, isFetching: loadingP } = useQuery({
    queryKey: ['global-search-patients', dq],
    queryFn:  () => patientApi.search(dq),
    enabled:  isActive && canSearchPatients,
    staleTime: 30000,
  })

  const { data: apptRes, isFetching: loadingA } = useQuery({
    queryKey: ['global-search-appointments', dq],
    queryFn:  () => appointmentApi.search ? appointmentApi.search(dq) : appointmentApi.getAll({ search: dq }),
    enabled:  isActive && canSearchAppointments,
    staleTime: 30000,
  })

  const { data: invRes, isFetching: loadingI } = useQuery({
    queryKey: ['global-search-inventory', dq],
    queryFn:  () => inventoryApi.search ? inventoryApi.search(dq) : inventoryApi.getAll({ search: dq }),
    enabled:  isActive && canSearchInventory,
    staleTime: 30000,
  })

  const patients  = (patientsRes?.data  || []).slice(0, 4)
  const appts     = (apptRes?.data      || []).slice(0, 4)
  const items     = (invRes?.data       || []).slice(0, 4)
  const isLoading = loadingP || loadingA || loadingI
  const hasResults = patients.length || appts.length || items.length

  // Keyboard shortcut Ctrl/Cmd + K
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(true)
        setTimeout(() => inputRef.current?.focus(), 50)
      }
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const go = (path) => {
    navigate(path)
    setOpen(false)
    setQuery('')
  }

  return (
    <div className="relative" ref={containerRef}>
      {/* Trigger button */}
      <button
        onClick={() => { setOpen(true); setTimeout(() => inputRef.current?.focus(), 50) }}
        className="flex items-center gap-2 h-9 pl-3 pr-3 rounded-lg border border-border bg-muted/50
                   text-sm text-muted-foreground transition-all hover:bg-muted hover:border-border-strong
                   focus:outline-none focus:ring-2 focus:ring-ring/40"
        style={{ minWidth: '200px' }}
      >
        <Search size={14} className="shrink-0" />
        <span className="flex-1 text-left truncate">Search patients, appointments</span>
        <kbd className="hidden sm:inline-flex items-center gap-1 rounded border border-border bg-card
                        px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
          Ctrl K
        </kbd>
      </button>

      {/* Dropdown panel */}
      {open && (
        <div
          className="dropdown-panel w-[480px] max-w-[90vw] max-h-[500px] overflow-hidden flex flex-col"
          style={{ top: 'calc(100% + 8px)', left: '0' }}
        >
          {/* Search input */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
            <Search size={15} className="text-muted-foreground shrink-0" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search patients, appointments, medicines"
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground
                         outline-none border-none"
              autoFocus
            />
            {query && (
              <button onClick={() => setQuery('')} className="text-muted-foreground hover:text-foreground">
                <X size={13} />
              </button>
            )}
            {isLoading && <Loader2 size={13} className="text-muted-foreground animate-spin" />}
          </div>

          {/* Results */}
          <div className="overflow-y-auto no-scrollbar">
            {!isActive ? (
              <div className="px-4 py-6 text-center text-xs text-muted-foreground">
                Type at least 2 characters to search
              </div>
            ) : !hasResults && !isLoading ? (
              <div className="px-4 py-6 text-center text-xs text-muted-foreground">
                No results found for "{query}"
              </div>
            ) : (
              <>
                {/* Patients */}
                {patients.length > 0 && (
                  <div>
                    <p className="dropdown-header flex items-center gap-2">
                      <Users size={11} /> Patients
                    </p>
                    {patients.map(p => (
                      <button
                        key={p.id}
                        className="dropdown-item w-full text-left"
                        onClick={() => go(`/patients/${p.id}`)}
                      >
                        <div className="avatar avatar-sm text-xs shrink-0">{(p.fullName || p.firstName || '?').charAt(0)}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{p.fullName || `${p.firstName} ${p.lastName}`}</p>
                          <p className="text-xs text-muted-foreground">{p.nic || p.phoneNumber || ''}</p>
                        </div>
                        <ArrowRight size={12} className="text-muted-foreground" />
                      </button>
                    ))}
                    <button
                      className="w-full flex items-center justify-center gap-1.5 py-2 text-xs text-primary hover:bg-primary/5"
                      onClick={() => go('/patients')}
                    >
                      View all patients <ArrowRight size={11} />
                    </button>
                  </div>
                )}

                {/* Appointments */}
                {appts.length > 0 && (
                  <div>
                    <p className="dropdown-header flex items-center gap-2">
                      <Calendar size={11} /> Appointments
                    </p>
                    {appts.map(a => (
                      <button
                        key={a.id}
                        className="dropdown-item w-full text-left"
                        onClick={() => go('/appointments')}
                      >
                        <Calendar size={14} className="text-primary shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{a.patientName || a.patient?.fullName}</p>
                          <p className="text-xs text-muted-foreground">
                            {a.appointmentDate}  {a.status}
                          </p>
                        </div>
                        <ArrowRight size={12} className="text-muted-foreground" />
                      </button>
                    ))}
                  </div>
                )}

                {/* Inventory */}
                {items.length > 0 && (
                  <div>
                    <p className="dropdown-header flex items-center gap-2">
                      <Pill size={11} /> Medicines
                    </p>
                    {items.map(m => (
                      <button
                        key={m.id}
                        className="dropdown-item w-full text-left"
                        onClick={() => go('/inventory')}
                      >
                        <Pill size={14} className="text-amber-500 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{m.medicineName || m.name}</p>
                          <p className="text-xs text-muted-foreground">{m.category}  Stock: {m.quantity}</p>
                        </div>
                        <ArrowRight size={12} className="text-muted-foreground" />
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer hint */}
          <div className="px-4 py-2 border-t border-border bg-muted/30 flex items-center gap-4 text-[10px] text-muted-foreground">
            <span> Navigate</span>
            <span> Select</span>
            <span>Esc Close</span>
          </div>
        </div>
      )}
    </div>
  )
}