import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import AppLayout from './components/layout/AppLayout'
import ProtectedRoute from './components/layout/ProtectedRoute'

// Auth Pages
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import UnauthorizedPage from './pages/UnauthorizedPage'
import LandingPage from './pages/public/LandingPage'
import PrivacyPolicyPage from './pages/public/PrivacyPolicyPage'
import TermsOfServicePage from './pages/public/TermsOfServicePage'

// Functional Pages
import Dashboard from './pages/Dashboard'
import PatientSearchPage from './pages/patients/PatientSearchPage'
import PatientRegisterPage from './pages/patients/PatientRegisterPage'
import PatientProfilePage from './pages/patients/PatientProfilePage'
import AppointmentListPage from './pages/appointments/AppointmentListPage'
import BookAppointmentPage from './pages/appointments/BookAppointmentPage'
import CalendarPage from './pages/appointments/CalendarPage'
import QueueManagementPage from './pages/queue/QueueManagementPage'
import PatientVitalsPage from './pages/nurse/PatientVitalsPage'
import ConsultationPage from './pages/medical/ConsultationPage'
import PrescriptionPage from './pages/medical/PrescriptionPage'
import DispensePage from './pages/medical/DispensePage'
import BillingPage from './pages/billing/BillingPage'
import PaymentPage from './pages/billing/PaymentPage'
import InventoryPage from './pages/inventory/InventoryPage'
import SuppliersPage from './pages/inventory/SuppliersPage'
import ReportsPage from './pages/inventory/ReportsPage'
import ArchivedPage from './pages/inventory/ArchivedPage'
import MedicationIconsDemo from './pages/MedicationIconsDemo'
import StaffProfilesPage from './pages/admin/StaffProfilesPage'
import AdminAnalyticsPage from './pages/admin/AdminAnalyticsPage'
import SystemSettingsPage from './pages/admin/SystemSettingsPage'
import ProfileSettingsPage from './pages/profile/ProfileSettingsPage'

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                {/* Public Routes */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/unauthorized" element={<UnauthorizedPage />} />
                <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
                <Route path="/terms-of-service" element={<TermsOfServicePage />} />

                {/* Protected Routes */}
                <Route
                    element={
                        <ProtectedRoute>
                            <AppLayout />
                        </ProtectedRoute>
                    }
                >
                    {/* All Auth Users */}
                    <Route path="/dashboard" element={<Dashboard />} />

                    {/* Patient Management */}
                    <Route
                        path="/patients"
                        element={
                            <ProtectedRoute allowedRoles={['RECEPTIONIST', 'DOCTOR', 'NURSE']}>
                                <PatientSearchPage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/patients/register"
                        element={
                            <ProtectedRoute allowedRoles={['RECEPTIONIST', 'DOCTOR']}>
                                <PatientRegisterPage />
                            </ProtectedRoute>
                        }
                    />
                    <Route path="/patients/:id" element={<PatientProfilePage />} />

                    {/* Appointment Management */}
                    <Route path="/appointments" element={<AppointmentListPage />} />
                    <Route
                        path="/appointments/book"
                        element={
                            <ProtectedRoute allowedRoles={['RECEPTIONIST', 'DOCTOR', 'PATIENT']}>
                                <BookAppointmentPage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/appointments/calendar"
                        element={
                            <ProtectedRoute allowedRoles={['RECEPTIONIST', 'DOCTOR', 'PATIENT']}>
                                <CalendarPage />
                            </ProtectedRoute>
                        }
                    />

                    {/* Queue Management */}
                    <Route
                        path="/queue"
                        element={
                            <ProtectedRoute allowedRoles={['RECEPTIONIST', 'DOCTOR', 'NURSE']}>
                                <QueueManagementPage />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/nurse/patient-vitals"
                        element={
                            <ProtectedRoute allowedRoles={['NURSE']}>
                                <PatientVitalsPage />
                            </ProtectedRoute>
                        }
                    />

                    {/* Medical Flow */}
                    <Route
                        path="/consultation/:id"
                        element={
                            <ProtectedRoute allowedRoles={['DOCTOR', 'NURSE']}>
                                <ConsultationPage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/prescription/new"
                        element={
                            <ProtectedRoute allowedRoles={['DOCTOR']}>
                                <PrescriptionPage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/prescription/:id"
                        element={
                            <ProtectedRoute allowedRoles={['DOCTOR']}>
                                <PrescriptionPage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/dispense/:id"
                        element={
                            <ProtectedRoute allowedRoles={['PHARMACIST', 'DOCTOR']}>
                                <DispensePage />
                            </ProtectedRoute>
                        }
                    />

                    {/* Billing */}
                    <Route
                        path="/billing"
                        element={
                            <ProtectedRoute allowedRoles={['RECEPTIONIST', 'PATIENT', 'DOCTOR']}>
                                <BillingPage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/billing/:id/payment"
                        element={
                            <ProtectedRoute allowedRoles={['RECEPTIONIST', 'DOCTOR']}>
                                <PaymentPage />
                            </ProtectedRoute>
                        }
                    />

                    {/* Inventory */}
                    <Route
                        path="/inventory"
                        element={
                            <ProtectedRoute allowedRoles={['PHARMACIST', 'DOCTOR', 'ADMIN']}>
                                <InventoryPage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/inventory/suppliers"
                        element={
                            <ProtectedRoute allowedRoles={['PHARMACIST', 'DOCTOR', 'ADMIN']}>
                                <SuppliersPage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/inventory/reports"
                        element={
                            <ProtectedRoute allowedRoles={['PHARMACIST', 'DOCTOR', 'ADMIN']}>
                                <ReportsPage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/inventory/archived"
                        element={
                            <ProtectedRoute allowedRoles={['PHARMACIST', 'DOCTOR', 'ADMIN']}>
                                <ArchivedPage />
                            </ProtectedRoute>
                        }
                    />

                    {/* Administration */}
                    <Route path="/profile" element={<ProfileSettingsPage />} />

                    <Route
                        path="/staff"
                        element={
                            <ProtectedRoute allowedRoles={['ADMIN', 'OWNER', 'DOCTOR']}>
                                <StaffProfilesPage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/admin/analytics"
                        element={
                            <ProtectedRoute allowedRoles={['ADMIN', 'OWNER']}>
                                <AdminAnalyticsPage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/settings"
                        element={
                            <ProtectedRoute allowedRoles={['ADMIN', 'OWNER']}>
                                <SystemSettingsPage />
                            </ProtectedRoute>
                        }
                    />

                    {/* Demo Page */}
                    <Route path="/demo" element={<MedicationIconsDemo />} />
                </Route>

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    )
}
