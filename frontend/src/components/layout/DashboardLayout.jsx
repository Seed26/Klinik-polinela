import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { Activity, Bell, CalendarDays, ClipboardList, HeartPulse, Home, LogOut, Menu, Pill, X } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import clinicLogo from '../../assets/clinic-admin-logo.png'

const navigation = {
  admin: [
    { to: '/admin', label: 'Dashboard', icon: Home, end: true },
    { to: '/admin/queues', label: 'Kelola Antrean', icon: ClipboardList },
    { to: '/admin/schedules', label: 'Jadwal Dokter', icon: CalendarDays },
    { to: '/admin/medicines', label: 'Obat', icon: Pill },
    { to: '/admin/notifications', label: 'Kelola Notifikasi', icon: Bell },
  ],
  doctor: [
    { to: '/doctor', label: 'Dashboard', icon: Home, end: true },
    { to: '/doctor/queues', label: 'Antrean Pasien', icon: ClipboardList },
    { to: '/doctor/records', label: 'Riwayat Pemeriksaan', icon: Activity },
  ],
  patient: [
    { to: '/patient', label: 'Beranda', icon: Home, end: true },
    { to: '/patient/queues', label: 'Antrean Saya', icon: ClipboardList },
    { to: '/patient/schedules', label: 'Jadwal Dokter', icon: CalendarDays },
    { to: '/patient/records', label: 'Rekam Medis', icon: HeartPulse },
    { to: '/patient/notifications', label: 'Notifikasi', icon: Bell },
  ],
}

const roleNames = { admin: 'Administrator', doctor: 'Dokter', patient: 'Pasien' }

export default function DashboardLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)
  const role = user?.role || 'patient'

  async function handleLogout() {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="app-shell">
      {mobileOpen && <button className="mobile-overlay" aria-label="Tutup navigasi" onClick={() => setMobileOpen(false)} />}
      <aside className={`sidebar ${mobileOpen ? 'sidebar-open' : ''}`}>
        <div className="brand-lockup">
          <div className="brand-mark"><img className="clinic-admin-logo" src={clinicLogo} alt="Logo Klinik Polinela" /></div>
          <div><strong>Klinik Polinela</strong><span>Layanan Kesehatan</span></div>
          <button className="icon-button mobile-close" onClick={() => setMobileOpen(false)} aria-label="Tutup menu"><X size={18} /></button>
        </div>
        <div className="nav-caption">MENU {roleNames[role]?.toUpperCase()}</div>
        <nav className="side-nav">
          {navigation[role]?.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={() => setMobileOpen(false)}>
              <Icon size={18} strokeWidth={1.8} /><span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-profile"><div className="avatar">{user?.name?.[0]?.toUpperCase() || 'U'}</div><div className="sidebar-profile-copy"><strong>{user?.name}</strong><span>{roleNames[role]}</span></div></div>
          <button className="logout-link" onClick={handleLogout}><LogOut size={17} /> Keluar</button>
        </div>
      </aside>
      <main className="main-area">
        <header className="topbar">
          <button className="icon-button mobile-menu" aria-label="Buka navigasi" onClick={() => setMobileOpen(true)}><Menu size={21} /></button>
          <div className="topbar-title"><span>Klinik Polinela</span><b>/</b><strong>{roleNames[role]}</strong></div>
          <div className="topbar-user"><div className="avatar avatar-small">{user?.name?.[0]?.toUpperCase() || 'U'}</div><span>{user?.name}</span></div>
        </header>
        <div className="page-content"><Outlet /></div>
      </main>
    </div>
  )
}
