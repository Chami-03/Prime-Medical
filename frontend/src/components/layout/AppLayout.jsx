import { Outlet, useLocation, Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import Sidebar from './Sidebar'
import ThemeToggle from '../common/ThemeToggle'
import GlobalSearch from '../common/GlobalSearch'
import NotificationCenter from '../common/NotificationCenter'
import { useAuth } from '../../context/AuthContext'
import { patientApi } from '../../api/patientApi'
import { ChevronRight, Menu } from 'lucide-react'

const ROUTE_META = {
  '/dashboard':               { title: 'Dashboard' },
  '/patients':                { title: 'Patients', parent: 'Dashboard' },
  '/patients/register':       { title: 'Register Patient', parent: 'Patients' },
  '/appointments':            { title: 'Appointments', parent: 'Dashboard' },
  '/appointments/book':       { title: 'Book Appointment', parent: 'Appointments' },
  '/appointments/calendar':   { title: 'Calendar', parent: 'Appointments' },
  '/queue':                   { title: 'Patient Queue', parent: 'Dashboard' },
  '/billing':                 { title: 'Billing', parent: 'Dashboard' },
  '/inventory':               { title: 'Inventory', parent: 'Dashboard' },
  '/inventory/suppliers':     { title: 'Suppliers', parent: 'Inventory' },
  '/inventory/reports':       { title: 'Inventory Reports', parent: 'Inventory' },
  '/inventory/archived':      { title: 'Archived Items', parent: 'Inventory' },
  '/staff':                   { title: 'Staff Profiles', parent: 'Dashboard' },
  '/admin/analytics':         { title: 'Analytics & Reports', parent: 'Dashboard' },
  '/settings':                { title: 'System Settings', parent: 'Dashboard' },
  '/profile':                 { title: 'Profile Settings', parent: 'Dashboard' },
}

function getPageMeta(pathname) {
  if (ROUTE_META[pathname]) return ROUTE_META[pathname]
  if (pathname.startsWith('/patients/'))    return { title: 'Patient Profile',    parent: 'Patients' }
  if (pathname.startsWith('/consultation/')) return { title: 'Consultation',      parent: 'Queue' }
  if (pathname.startsWith('/billing/'))     return { title: 'Invoice Detail',     parent: 'Billing' }
  if (pathname.startsWith('/prescription/')) return { title: 'Prescription',      parent: 'Queue' }
  if (pathname.startsWith('/dispense/'))    return { title: 'Dispense Medicine',  parent: 'Inventory' }
  return { title: 'Prime Medical' }
}

/* Role greeting (used on dashboard only) */
const ROLE_GREETINGS = {
  DOCTOR:       'Clinical Portal',
  NURSE:        'Nursing Station',
  RECEPTIONIST: 'Front Desk',
  PHARMACIST:   'Pharmacy',
  PATIENT:      'Patient Portal',
  ADMIN:        'Administration',
}

export default function AppLayout() {
  const { pathname } = useLocation()
  const { user, hasRole } = useAuth()
  const [avatarLoadError, setAvatarLoadError] = useState(false)

  const patientPathMatch = pathname.match(/^\/patients\/(\d+)$/)
  const patientIdInPath = patientPathMatch ? Number(patientPathMatch[1]) : null

  const { data: patientHeadingData } = useQuery({
    queryKey: ['layout-patient-heading', patientIdInPath],
    queryFn: () => patientApi.getById(patientIdInPath),
    enabled: !!patientIdInPath,
  })

  // Mobile overlay
  const [mobileOpen, setMobileOpen] = useState(false)

  // Close mobile sidebar on route change
  useEffect(() => { setMobileOpen(false) }, [pathname])

  const metaBase = getPageMeta(pathname)
  const resolvedPatient = patientHeadingData?.data || patientHeadingData || null
  const patientHeadingName = resolvedPatient
    ? `${resolvedPatient.firstName || ''} ${resolvedPatient.lastName || ''}`.trim()
    : ''

  const meta =
    patientIdInPath && patientHeadingName
      ? { ...metaBase, title: patientHeadingName }
      : metaBase

  const primaryRole = ['ADMIN', 'OWNER', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'PHARMACIST', 'PATIENT']
    .find(r => hasRole(r)) || 'PATIENT'
  const roleSubtitle = ROLE_GREETINGS[primaryRole] || 'Prime Medical'

  const initials = (user?.fullName || user?.firstName || 'U').charAt(0).toUpperCase()
  const profilePhotoUrl = (user?.profilePhotoUrl || '').trim()
  const showProfilePhoto = Boolean(profilePhotoUrl) && !avatarLoadError

  useEffect(() => {
    setAvatarLoadError(false)
  }, [profilePhotoUrl])

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">

      {/*  Mobile overlay  */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/*  Sidebar  */}
      <div
        className={`
          lg:relative lg:translate-x-0 fixed z-50 lg:z-auto h-full
          transition-transform duration-250
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <Sidebar />
      </div>

      {/*  Main column  */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/*  Header  */}
        <header
          className="sticky top-0 z-40 flex items-center px-5 gap-4 flex-shrink-0
                     bg-card/85 backdrop-blur-xl border-b border-border"
          style={{ height: 'var(--header-height)' }}
        >
          {/* Mobile menu button */}
          <button
            className="lg:hidden btn-neu text-muted-foreground hover:text-foreground"
            onClick={() => setMobileOpen(v => !v)}
          >
            <Menu size={16} />
          </button>

          {/* Page breadcrumb */}
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            <div className="w-0.5 h-4 rounded-full bg-primary shrink-0 hidden sm:block" />
            <div className="min-w-0">
              <div className="breadcrumb hidden sm:flex">
                <Link to="/dashboard" className="hover:text-foreground">{roleSubtitle}</Link>
                {meta.parent && (
                  <>
                    <ChevronRight size={10} className="breadcrumb-sep" />
                    <span>{meta.parent}</span>
                  </>
                )}
                {meta.title !== meta.parent && (
                  <>
                    <ChevronRight size={10} className="breadcrumb-sep" />
                    <span className="current">{meta.title}</span>
                  </>
                )}
              </div>
              <h1 className="text-base font-semibold text-foreground truncate sm:text-xs sm:font-normal sm:text-muted-foreground sm:hidden">
                {meta.title}
              </h1>
            </div>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Global search */}
            <div className="hidden md:block">
              <GlobalSearch />
            </div>

            {/* Notifications */}
            <NotificationCenter />

            {/* Theme toggle */}
            <ThemeToggle />

            {/* Divider */}
            <div className="w-px h-6 bg-border hidden sm:block" />

            {/* User avatar */}
            <div className="flex items-center gap-2.5">
              <div
                className={[
                  'w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white text-sm select-none overflow-hidden',
                  showProfilePhoto ? 'bg-muted' : 'bg-primary',
                ].join(' ')}
              >
                {showProfilePhoto ? (
                  <img
                    src={profilePhotoUrl}
                    alt="Profile"
                    className="w-full h-full object-cover"
                    onError={() => setAvatarLoadError(true)}
                  />
                ) : (
                  initials
                )}
              </div>
              <div className="hidden lg:block text-left leading-tight">
                <p className="text-xs font-semibold text-foreground truncate max-w-[120px]">
                  {user?.fullName || user?.firstName || 'User'}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {primaryRole.charAt(0) + primaryRole.slice(1).toLowerCase()}
                </p>
              </div>
            </div>
          </div>
        </header>

        {/*  Scrollable content  */}
        <main className="flex-1 overflow-y-auto no-scrollbar bg-transparent">
          <div className="max-w-[1320px] mx-auto px-4 py-5 md:px-5 md:py-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}