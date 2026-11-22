import { useState } from 'react'
import { ArrowRight, Eye, EyeOff, LockKeyhole, LogOut, Mail, Shield, Stethoscope, UserCheck } from 'lucide-react'
import clinicLogo from '../../assets/logo-klinik.png'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'

export default function LoginPage() {
  const { user, login, logout } = useAuth()
  const navigate = useNavigate()
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setSubmitting(true)
    try {
      const account = await login(identifier.trim(), password)
      if (account.role === 'patient') {
        await logout()
        toast.error('Akun pasien tidak memiliki akses ke portal web. Silakan gunakan akun staf (Admin atau Dokter).')
        return
      }

      const roleLabel = account.role === 'admin' ? 'Administrator' : 'Dokter'
      toast.success(`Berhasil masuk sebagai ${roleLabel} (${account.name})`)

      if (account.role === 'doctor') {
        navigate('/doctor', { replace: true })
      } else {
        navigate('/admin', { replace: true })
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Tidak dapat masuk. Periksa kembali email dan kata sandi Anda.')
    } finally {
      setSubmitting(false)
    }
  }

  const fillCredentials = (email, pass) => {
    setIdentifier(email)
    setPassword(pass)
  }

  return (
    <main className="auth-page">
      <section className="auth-panel">
        <div className="auth-brand">
          <div className="brand-mark">
            <img className="auth-logo" src={clinicLogo} alt="Logo Klinik Polinela" />
          </div>
          <div>
            <strong>KLINIK POLINELA</strong>
            <span>Sistem Informasi Pelayanan Klinik</span>
          </div>
        </div>

        <div className="auth-copy">
          <h1>Portal Petugas Klinik</h1>
          <p>Satu akses untuk Administrator dan Dokter. Masukkan akun Anda untuk diarahkan ke dashboard sesuai kewenangan.</p>
        </div>

        {user && (user.role === 'admin' || user.role === 'doctor') && (
          <div style={{
            background: '#f0f7ff',
            border: '1px solid #c7e0ff',
            borderRadius: '10px',
            padding: '14px 16px',
            marginTop: '20px',
            marginBottom: '10px',
            fontSize: '13px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#005bb5', fontWeight: 600 }}>
              <UserCheck size={18} />
              <span>Sesi Aktif: {user.name} ({user.role === 'admin' ? 'Admin' : 'Dokter'})</span>
            </div>
            <p style={{ margin: '6px 0 10px', color: '#4a5568', fontSize: '12px' }}>
              Anda sedang masuk. Anda dapat membuka portal atau masuk dengan akun lain di bawah.
            </p>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => navigate(user.role === 'doctor' ? '/doctor' : '/admin')}
                style={{
                  padding: '6px 12px',
                  background: '#0060a9',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  fontWeight: 600
                }}
              >
                Buka Portal {user.role === 'doctor' ? 'Dokter' : 'Admin'} →
              </button>
              <button
                type="button"
                onClick={async () => {
                  await logout()
                  toast.success('Berhasil keluar dari akun.')
                }}
                style={{
                  padding: '6px 12px',
                  background: '#fff',
                  color: '#e53e3e',
                  border: '1px solid #fed7d7',
                  borderRadius: '6px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <LogOut size={13} /> Keluar
              </button>
            </div>
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          <label htmlFor="identifier">Email / Identitas Akun</label>
          <div className="input-wrap">
            <Mail size={17} />
            <input
              id="identifier"
              type="text"
              autoComplete="username"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="Contoh: adminklinik@polinela.ac.id atau dr.dian@polinela.ac.id"
              required
            />
          </div>

          <label htmlFor="password">Kata Sandi</label>
          <div className="input-wrap" style={{ position: 'relative' }}>
            <LockKeyhole size={17} />
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Masukkan kata sandi"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute',
                right: '12px',
                background: 'none',
                border: 'none',
                color: '#718096',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center'
              }}
              aria-label={showPassword ? 'Sembunyikan password' : 'Lihat password'}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          <button className="primary-button auth-submit" type="submit" disabled={submitting}>
            {submitting ? 'Memproses Masuk…' : 'Masuk ke Portal'} <ArrowRight size={17} />
          </button>
        </form>

        <div style={{
          marginTop: '22px',
          padding: '14px',
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '9px',
          fontSize: '12px'
        }}>
          <strong style={{ display: 'block', marginBottom: '8px', color: '#2d3748' }}>
            Pintasan Akses Demo Petugas:
          </strong>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <button
              type="button"
              onClick={() => fillCredentials('adminklinik@polinela.ac.id', 'klinik123')}
              style={{
                textAlign: 'left',
                padding: '8px',
                background: '#fff',
                border: '1px solid #cbd5e0',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              <div style={{ fontWeight: 600, color: '#0060a9', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Shield size={13} /> Admin
              </div>
              <div style={{ fontSize: '10px', color: '#718096', marginTop: '2px' }}>adminklinik@polinela.ac.id</div>
            </button>

            <button
              type="button"
              onClick={() => fillCredentials('dr.dian@polinela.ac.id', 'Dokter123!')}
              style={{
                textAlign: 'left',
                padding: '8px',
                background: '#fff',
                border: '1px solid #cbd5e0',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              <div style={{ fontWeight: 600, color: '#2b6cb0', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Stethoscope size={13} /> Dokter
              </div>
              <div style={{ fontSize: '10px', color: '#718096', marginTop: '2px' }}>dr.dian@polinela.ac.id</div>
            </button>
          </div>
        </div>

        <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link className="auth-forgot" to="/">← Kembali ke beranda</Link>
          <span style={{ fontSize: '11px', color: '#a0aec0' }}>Klinik Polinela v1.0</span>
        </div>
      </section>

      <aside className="auth-aside">
        <div className="aside-orb orb-a" />
        <div className="aside-orb orb-b" />
        <div className="aside-content">
          <span>SISTEM INFORMASI KLINIK</span>
          <h2>Pelayanan Medis Terpadu & Terorganisir</h2>
          <p style={{ marginTop: '14px', opacity: 0.9, lineHeight: 1.6, fontSize: '14px' }}>
            Kelola antrean harian, rekam medis pemeriksaan, inventaris farmasi, dan jadwal praktik dokter dengan aman dan efisien.
          </p>
        </div>
      </aside>
    </main>
  )
}
