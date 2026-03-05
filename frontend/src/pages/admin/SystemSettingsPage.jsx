import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'react-hot-toast'
import {
  Settings, Building2, Phone, Mail, Globe, Clock,
  Moon, Sun, Bell, Shield, Database, Save, RefreshCw,
} from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'

function SettingsSection({ title, icon: Icon, children }) {
  return (
    <div className="pm-card p-5 flex flex-col gap-4">
      <div className="flex items-center gap-2.5 pb-3 border-b border-border">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon size={15} className="text-primary" />
        </div>
        <span className="text-sm font-semibold text-foreground">{title}</span>
      </div>
      {children}
    </div>
  )
}

function Field({ label, hint, children }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 items-start">
      <div>
        <label className="form-label">{label}</label>
        {hint && <p className="text-[11px] text-muted-foreground mt-0.5">{hint}</p>}
      </div>
      <div className="md:col-span-2">{children}</div>
    </div>
  )
}

function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${checked ? 'bg-primary' : 'bg-muted-foreground/30'}`}
    >
      <span className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transform transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  )
}

export default function SystemSettingsPage() {
  const { theme, toggleTheme } = useTheme()

  const { register, handleSubmit, formState: { isDirty } } = useForm({
    defaultValues: {
      clinicName: 'Prime Medical Centre',
      clinicAddress: '42 Main Street, Colombo 07',
      phone: '+94 11 234 5678',
      email: 'info@primemedical.lk',
      website: 'www.primemedical.lk',
      timezone: 'Asia/Colombo',
      slotDuration: '30',
      language: 'en',
    },
  })

  const [notifications, setNotifications] = useState({
    lowStockAlerts: true,
    appointmentReminders: true,
    dailySummary: false,
  })

  const [saving, setSaving] = useState(false)

  const onSave = async (data) => {
    setSaving(true)
    await new Promise(r => setTimeout(r, 800))
    setSaving(false)
    toast.success('Settings saved')
    // In a real app, call a settings API here.
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">System Settings</h1>
          <p className="page-subtitle">Manage clinic configuration and preferences</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSave)} className="flex flex-col gap-4">
        {/* Clinic Information */}
        <SettingsSection title="Clinic Information" icon={Building2}>
          <Field label="Clinic Name">
            <input className="form-input" {...register('clinicName')} />
          </Field>
          <Field label="Address">
            <input className="form-input" {...register('clinicAddress')} />
          </Field>
          <Field label="Phone">
            <input className="form-input" type="tel" {...register('phone')} />
          </Field>
          <Field label="Email">
            <input className="form-input" type="email" {...register('email')} />
          </Field>
          <Field label="Website">
            <input className="form-input" {...register('website')} />
          </Field>
        </SettingsSection>

        {/* Operational Settings */}
        <SettingsSection title="Operational" icon={Clock}>
          <Field label="Timezone">
            <select className="form-select" {...register('timezone')}>
              <option value="Asia/Colombo">Asia/Colombo (UTC+5:30)</option>
              <option value="UTC">UTC</option>
              <option value="Asia/Kolkata">Asia/Kolkata (UTC+5:30)</option>
            </select>
          </Field>
          <Field label="Default Slot Duration" hint="Minutes per appointment slot">
            <select className="form-select" {...register('slotDuration')}>
              <option value="15">15 minutes</option>
              <option value="20">20 minutes</option>
              <option value="30">30 minutes</option>
              <option value="45">45 minutes</option>
              <option value="60">60 minutes</option>
            </select>
          </Field>
          <Field label="Language">
            <select className="form-select" {...register('language')}>
              <option value="en">English</option>
              <option value="si">Sinhala</option>
              <option value="ta">Tamil</option>
            </select>
          </Field>
        </SettingsSection>

        {/* Appearance */}
        <SettingsSection title="Appearance" icon={theme === 'dark' ? Moon : Sun}>
          <Field label="Color Theme" hint="Applies to your account">
            <div className="flex items-center gap-3">
              <Toggle checked={theme === 'dark'} onChange={toggleTheme} />
              <span className="text-sm text-foreground">{theme === 'dark' ? 'Dark mode' : 'Light mode'}</span>
            </div>
          </Field>
        </SettingsSection>

        {/* Notifications */}
        <SettingsSection title="Notifications" icon={Bell}>
          <Field label="Low Stock Alerts" hint="Alert when medicines fall below threshold">
            <Toggle
              checked={notifications.lowStockAlerts}
              onChange={v => setNotifications(n => ({ ...n, lowStockAlerts: v }))}
            />
          </Field>
          <Field label="Appointment Reminders" hint="Staff reminder before appointments">
            <Toggle
              checked={notifications.appointmentReminders}
              onChange={v => setNotifications(n => ({ ...n, appointmentReminders: v }))}
            />
          </Field>
          <Field label="Daily Summary" hint="End-of-day summary email">
            <Toggle
              checked={notifications.dailySummary}
              onChange={v => setNotifications(n => ({ ...n, dailySummary: v }))}
            />
          </Field>
        </SettingsSection>

        {/* Security */}
        <SettingsSection title="Security" icon={Shield}>
          <Field label="Session Timeout" hint="Auto-logout after inactivity">
            <select className="form-select">
              <option>30 minutes</option>
              <option>1 hour</option>
              <option>4 hours</option>
              <option>8 hours</option>
            </select>
          </Field>
          <Field label="Password Policy" hint="Minimum complexity requirements">
            <select className="form-select">
              <option>Standard (8+ chars)</option>
              <option>Strong (12+ chars, mixed)</option>
            </select>
          </Field>
        </SettingsSection>

        {/* System Info (read-only) */}
        <SettingsSection title="System Information" icon={Database}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Version', value: '1.0.0' },
              { label: 'Environment', value: 'Production' },
              { label: 'Backend', value: 'Spring Boot 3' },
              { label: 'Database', value: 'MySQL 8' },
            ].map(item => (
              <div key={item.label} className="bg-muted/40 rounded-xl p-3">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{item.label}</p>
                <p className="text-sm font-semibold text-foreground mt-0.5">{item.value}</p>
              </div>
            ))}
          </div>
        </SettingsSection>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pb-2">
          <button
            type="button"
            className="btn-ghost btn-md flex items-center gap-2"
            onClick={() => toast('Settings reset to defaults', { icon: '↺' })}
          >
            <RefreshCw size={14} /> Reset Defaults
          </button>
          <button
            type="submit"
            className="btn-primary btn-md flex items-center gap-2"
            disabled={saving}
          >
            {saving
              ? <><RefreshCw size={14} className="animate-spin" /> Saving…</>
              : <><Save size={14} /> Save Changes</>
            }
          </button>
        </div>
      </form>
    </div>
  )
}
