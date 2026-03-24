import { NavLink, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import {
  LayoutDashboard, Calendar, Users, UserPlus, Activity,
  Stethoscope, Pill, Box, CreditCard, TrendingUp,
  Shield, Archive, LogOut, BarChart3, Truck,
  ClipboardList, HeartPulse, FlaskConical, Settings,
  FileText, Receipt, UserCog, BarChart2,
} from 'lucide-react'

/*  Role-based nav config  */
const NAV_GROUPS = {
  DOCTOR: [
    {
      label: 'Clinical',
      items: [
        { to: '/dashboard',           label: 'Dashboard',      icon: LayoutDashboard, exact: true },
        { to: '/queue',               label: 'Queue',          icon: Activity },
        { to: '/patients',            label: 'Patients',       icon: Users },
        { to: '/appointments',        label: 'Appointments',   icon: Calendar, exact: true },
        { to: '/appointments/calendar', label: 'Calendar',     icon: ClipboardList },
        { to: '/profile',             label: 'Profile',        icon: Settings },
      ]
    },
    {
      label: 'Operations',
      items: [
        { to: '/billing',             label: 'Billing',        icon: CreditCard },
        { to: '/inventory',           label: 'Pharmacy',       icon: Box },
        { to: '/staff',               label: 'Staff',          icon: Shield },
      ]
    },
  ],
  NURSE: [
    {
      label: 'Patient Care',
      items: [
        { to: '/dashboard',   label: 'Dashboard',    icon: LayoutDashboard, exact: true },
        { to: '/patients',    label: 'Patients',     icon: Users },
        { to: '/nurse/patient-vitals', label: 'Patient Vitals', icon: HeartPulse },
        { to: '/queue',       label: 'Queue',        icon: Activity },
        { to: '/appointments',label: 'Appointments', icon: Calendar },
        { to: '/profile',     label: 'Profile',      icon: Settings },
      ]
    }
  ],
  RECEPTIONIST: [
    {
      label: 'Front Desk',
      items: [
        { to: '/dashboard',             label: 'Dashboard',      icon: LayoutDashboard, exact: true },
        { to: '/patients',              label: 'Patients',       icon: Users, exact: true },
        { to: '/patients/register',     label: 'New Patient',    icon: UserPlus },
        { to: '/appointments',          label: 'Appointments',   icon: Calendar, exact: true },
        { to: '/appointments/calendar', label: 'Calendar',       icon: ClipboardList },
        { to: '/queue',                 label: 'Queue',          icon: Activity },
        { to: '/billing',               label: 'Billing',        icon: CreditCard },
        { to: '/profile',               label: 'Profile',        icon: Settings },
      ]
    }
  ],
  PHARMACIST: [
    {
      label: 'Pharmacy',
      items: [
        { to: '/dashboard',          label: 'Dashboard',  icon: LayoutDashboard, exact: true },
        { to: '/inventory',          label: 'Inventory',  icon: Box, exact: true },
        { to: '/inventory/suppliers',label: 'Suppliers',  icon: Truck },
        { to: '/inventory/reports',  label: 'Reports',    icon: BarChart3 },
        { to: '/inventory/archived', label: 'Archived',   icon: Archive },
        { to: '/profile',             label: 'Profile',   icon: Settings },
      ]
    }
  ],
  PATIENT: [
    {
      label: 'My Health',
      items: [
        { to: '/dashboard',    label: 'Overview',        icon: LayoutDashboard, exact: true },
        { to: '/appointments', label: 'My Appointments', icon: Calendar },
        { to: '/billing',      label: 'My Invoices',     icon: CreditCard },
        { to: '/profile',      label: 'Profile',         icon: Settings },
      ]
    }
  ],
  ADMIN: [
    {
      label: 'Administration',
      items: [
        { to: '/dashboard',          label: 'Dashboard',  icon: LayoutDashboard, exact: true },
        { to: '/staff',              label: 'Staff',      icon: UserCog },
        { to: '/admin/analytics',    label: 'Analytics',  icon: BarChart2 },
        { to: '/inventory',          label: 'Inventory',  icon: Box, exact: true },
        { to: '/inventory/suppliers',label: 'Suppliers',  icon: Truck },
        { to: '/inventory/reports',  label: 'Reports',    icon: BarChart3 },
        { to: '/inventory/archived', label: 'Archived',   icon: Archive },
        { to: '/profile',            label: 'Profile',    icon: Settings },
        { to: '/settings',           label: 'Settings',   icon: Settings },
      ]
    }
  ],
}

/*  Role accent colours  */
const ROLE_COLORS = {
  DOCTOR:       'text-blue-600    bg-blue-50    dark:bg-blue-900/20',
  NURSE:        'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20',
  RECEPTIONIST: 'text-purple-600  bg-purple-50  dark:bg-purple-900/20',
  PHARMACIST:   'text-amber-600   bg-amber-50   dark:bg-amber-900/20',
  PATIENT:      'text-teal-600    bg-teal-50    dark:bg-teal-900/20',
  ADMIN:        'text-red-600     bg-red-50     dark:bg-red-900/20',
}

const ROLE_LABELS = {
  DOCTOR: 'Doctor', NURSE: 'Nurse', RECEPTIONIST: 'Receptionist',
  PHARMACIST: 'Pharmacist', PATIENT: 'Patient',
  ADMIN: 'Administrator', OWNER: 'Owner',
}

function isItemActive(item, pathname, siblings) {
  const selfMatch = item.exact
    ? pathname === item.to
    : pathname === item.to || pathname.startsWith(item.to + '/')

  if (!selfMatch || item.exact) return selfMatch

  // If a more specific sibling route is active, keep only that child highlighted.
  const hasMoreSpecificActiveSibling = siblings.some((s) => {
    if (s.to === item.to) return false
    const isChildOfItem = s.to.startsWith(item.to + '/')
    if (!isChildOfItem) return false
    return pathname === s.to || pathname.startsWith(s.to + '/')
  })

  return !hasMoreSpecificActiveSibling
}

/*  Single nav item  */
function NavItem({ item, pathname, siblings }) {
  const isActive = isItemActive(item, pathname, siblings)
  const Icon = item.icon

  return (
    <NavLink
      to={item.to}
      end={item.exact}
      className={[
        'sidebar-item group',
        isActive ? 'active' : '',
      ].join(' ')}
    >
      <Icon
        size={17}
        strokeWidth={isActive ? 2.5 : 1.8}
        className="shrink-0 transition-colors duration-150"
        style={{ minWidth: '17px' }}
      />
      <span className="sidebar-label flex-1 truncate">{item.label}</span>
      {isActive && (
        <span className="sidebar-active-dot w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
      )}
    </NavLink>
  )
}

/*  Main Sidebar  */
export default function Sidebar() {
  const { user, logout, hasRole } = useAuth()
  const { pathname } = useLocation()
  const [avatarLoadError, setAvatarLoadError] = useState(false)

  const primaryRole = ['ADMIN', 'OWNER', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'PHARMACIST', 'PATIENT']
    .find(r => hasRole(r)) || 'PATIENT'

  const groups    = NAV_GROUPS[primaryRole] || NAV_GROUPS['PATIENT']
  const roleColor = ROLE_COLORS[primaryRole] || ROLE_COLORS['PATIENT']
  const roleLabel = ROLE_LABELS[primaryRole] || primaryRole
  const initials  = (user?.fullName || user?.firstName || 'U').charAt(0).toUpperCase()
  const profilePhotoUrl = (user?.profilePhotoUrl || '').trim()
  const showProfilePhoto = Boolean(profilePhotoUrl) && !avatarLoadError
  const logoSrc   = '/PrimeMedical.png'

  useEffect(() => {
    setAvatarLoadError(false)
  }, [profilePhotoUrl])

  return (
    <aside className="sidebar-root">

      {/*  Brand  */}
      <div
        className="flex items-center gap-3 px-4 shrink-0 border-b border-border"
        style={{ height: 'var(--header-height)' }}
      >
        <div className="w-9 h-9 rounded-xl bg-white overflow-hidden shrink-0 p-1 ring-1 ring-border">
          <img src={logoSrc} alt="Prime Medical" className="w-full h-full object-contain" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-foreground tracking-tight leading-tight">Prime Medical</p>
          <p className="text-[10px] text-muted-foreground">Care Platform</p>
        </div>
      </div>

      {/*  Navigation  */}
      <nav className="flex-1 overflow-y-auto no-scrollbar px-2 py-3 space-y-0.5">
        {groups.map((group) => (
          <div key={group.label}>
            {groups.length > 1 && (
              <p className="sidebar-group-label">{group.label}</p>
            )}
            {group.items.map(item => (
              <NavItem
                key={item.to}
                item={item}
                pathname={pathname}
                siblings={group.items}
              />
            ))}
          </div>
        ))}
      </nav>

      {/*  User Footer  */}
      <div className="px-2 py-3 border-t border-border shrink-0">
        <div className="px-3 py-2.5 rounded-xl bg-muted/40 flex items-center gap-2.5 mb-2">
          <div
            className={[
              'avatar avatar-sm text-xs shrink-0 overflow-hidden flex items-center justify-center',
              showProfilePhoto ? 'bg-muted' : roleColor,
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
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-foreground truncate leading-tight">
              {user?.fullName || user?.firstName || 'Staff Member'}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{roleLabel}</p>
          </div>
        </div>
        <button
          onClick={logout}
          title="Sign out"
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium
            text-muted-foreground hover:bg-red-50 hover:text-red-600
            dark:hover:bg-red-900/20 dark:hover:text-red-400 transition-colors duration-150"
        >
          <LogOut size={15} strokeWidth={1.8} />
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  )
}