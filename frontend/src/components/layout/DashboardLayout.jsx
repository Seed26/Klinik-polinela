import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { Activity, Bell, CalendarDays, ClipboardList, HeartPulse, Home, LogOut, Pill, Users } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import clinicLogo from '../../assets/clinic-admin-logo.png'

const navigation = {
  admin: [
    { to: '/admin', label: 'home', icon: Home, end: true },
    { to: '/admin/queues', label: 'Antrian Saya', icon: ClipboardList },
    { to: '/admin/medicines', label: 'obat', icon: Pill },
    { to: '/admin/notifications', label: 'Kelola notifikasi', icon: Bell },
  ],
  doctor: [
    { to: '/doctor', label: 'Home', icon: Home, end: true },
    { to: '/doctor/queues', label: 'Antrian Saya', icon: ClipboardList },
    { to: '/doctor/records', label: 'Riwayat Pemeriksaan', icon: Activity },
  ],
  patient: [
    { to: '/patient', label: 'Home', icon: Home, end: true },
    { to: '/patient/queues', label: 'Antrian Saya', icon: ClipboardList },
    { to: '/patient/schedules', label: 'Jadwal Dokter', icon: CalendarDays },
    { to: '/patient/records', label: 'Rekam Medis', icon: HeartPulse },
  ],
}

const roleTitles = {
  admin: 'Administrator',
  doctor: 'Profil Dokter',
  patient: 'Pasien'
}

export default function DashboardLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const role = user?.role || 'admin'

  async function handleLogout() {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="app-shell">
      {/* 1. Left Sidebar */}
      <aside className="sidebar">
        {/* Header Logo */}
        <div className="sidebar-header-box">
          <img src={clinicLogo} alt="Logo Klinik Polinela" />
          <strong>Klinik Polinela</strong>
        </div>

        {/* Menu Navigasi */}
        <div className="sidebar-menu-area">
          <span className="sidebar-menu-caption">
            {role === 'doctor' ? 'MENU DOKTER' : 'MENU ADMINISTRATOR'}
          </span>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {navigation[role]?.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={`${to}-${label}`}
                to={to}
                end={end}
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              >
                <Icon size={18} strokeWidth={2} />
                <span>{label}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Footer Sidebar */}
        <div className="sidebar-footer-box">
          <div className="sidebar-user-profile">
            <div className="sidebar-user-avatar">
              {user?.name?.[0]?.toUpperCase() || 'A'}
            </div>
            <div className="sidebar-user-info">
              <strong>{user?.name || 'Admin Demo'}</strong>
              <span>{roleTitles[role]}</span>
            </div>
          </div>
          <button className="sidebar-logout-btn" onClick={handleLogout} type="button">
            <LogOut size={16} />
            <span>Keluar Sesi</span>
          </button>
        </div>
      </aside>

      {/* 2. Main Area */}
      <main className="main-area">
        {/* Top Header / Navbar */}
        <header className="topbar">
          <div className="topbar-breadcrumb">
            {role === 'admin' ? 'Portal Admin' : role === 'doctor' ? 'Portal Dokter' : 'Portal Pasien'} &gt; <strong>Beranda</strong>
          </div>
          <div className="topbar-right-area">
            <div className="notification-bell-wrap" title="Notifikasi">
              <Bell size={20} />
              <span className="notification-badge-dot" />
            </div>
            <div className="topbar-divider" />
            <div className="topbar-user-profile">
              <div className="topbar-avatar">
                {user?.name?.[0]?.toUpperCase() || 'A'}
              </div>
              <div className="topbar-user-text">
                <strong>{user?.name || 'Admin'}</strong>
                <span>{roleTitles[role]}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="page-content">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
