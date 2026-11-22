import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, Route, Routes } from 'react-router-dom'
import { Activity, ArrowDown, ArrowRight, CalendarDays, CheckCircle2, Clock3, HeartPulse, Info, MapPin, Menu, Pill, ShieldPlus, Stethoscope, UsersRound, X } from 'lucide-react'
import clinicLogo from './assets/logo-klinik.png'
import heroIllustration from './assets/polinela-smartphone-mockup.png'
import api from './services/api'
import { useAuth } from './context/AuthContext'
import RoleGuard from './components/layout/RoleGuard'
import DashboardLayout from './components/layout/DashboardLayout'
import LoginPage from './pages/auth/LoginPage'
import DashboardPage from './pages/common/DashboardPage'
import { AdminDashboardPage, AdminMedicinesPage, AdminNotificationsPage, AdminQueuesPage, AdminSchedulesPage } from './pages/admin/AdminPages'
import './landing.css'

const benefits = [
  { icon: HeartPulse, title: 'Pelayanan Kesehatan', description: 'Informasi pelayanan klinik untuk civitas akademika Polinela.' },
  { icon: CalendarDays, title: 'Informasi Jadwal Dokter', description: 'Lihat jadwal praktik yang tersedia dari informasi klinik.' },
  { icon: CheckCircle2, title: 'Kemudahan Antrean', description: 'Akses informasi proses antrean secara lebih praktis.' },
  { icon: Pill, title: 'Informasi Obat', description: 'Informasi inventaris obat dikelola melalui sistem klinik.' },
]

const services = [
  { icon: Stethoscope, title: 'Konsultasi Dokter', description: 'Informasi mengenai pelayanan konsultasi dokter di Klinik Polinela.', href: '#jadwal' },
  { icon: HeartPulse, title: 'Pemeriksaan Kesehatan', description: 'Pelayanan pemeriksaan kesehatan oleh tenaga kesehatan klinik.', href: '#tentang' },
  { icon: Pill, title: 'Informasi Obat', description: 'Informasi obat klinik dikelola oleh petugas melalui sistem.', href: '#informasi' },
  { icon: UsersRound, title: 'Layanan Psikologi', description: 'Hubungi pihak klinik untuk memastikan ketersediaan layanan ini.', href: '#lokasi' },
]

const reasons = [
  { icon: Info, title: 'Akses Informasi Mudah', description: 'Informasi klinik dirangkum dalam halaman publik yang mudah dijelajahi.' },
  { icon: Activity, title: 'Pelayanan Terorganisir', description: 'Antrean dan pelayanan didukung sistem informasi klinik.' },
  { icon: CalendarDays, title: 'Informasi Jadwal Transparan', description: 'Jadwal ditampilkan berdasarkan informasi yang berhasil dimuat.' },
  { icon: ShieldPlus, title: 'Riwayat Pemeriksaan Terintegrasi', description: 'Data pemeriksaan dikelola dalam sistem klinik dengan akses terjaga.' },
]

function NotFoundPage() {
  return <section className="not-found"><span>404</span><h1>Halaman tidak ditemukan</h1><p>Alamat yang Anda buka tidak tersedia.</p><Link to="/">Kembali ke beranda</Link></section>
}

function LandingPage() {
  const { user, loading } = useAuth()
  const [schedules, setSchedules] = useState([])
  const [scheduleState, setScheduleState] = useState('loading')
  const [publicQueues, setPublicQueues] = useState([])
  const [queueSummary, setQueueSummary] = useState({ currently_served: null, waiting_count: 0 })
  const [queueState, setQueueState] = useState('loading')
  const [menuOpen, setMenuOpen] = useState(false)
  const landingRef = useRef(null)
  const isStaff = user?.role === 'admin' || user?.role === 'doctor'
  const portal = user?.role === 'doctor' ? '/doctor' : '/admin'

  useEffect(() => {
    let active = true
    api.get('/public/schedules')
      .then(({ data }) => {
        if (active) {
          setSchedules(Array.isArray(data.data) ? data.data : [])
          setScheduleState('loaded')
        }
      })
      .catch(() => {
        if (active) setScheduleState('unavailable')
      })
    return () => { active = false }
  }, [])

  useEffect(() => {
    let active = true
    api.get('/public/queues')
      .then(({ data }) => {
        if (active) {
          const publicData = data.data || {}
          setPublicQueues(Array.isArray(publicData.queues) ? publicData.queues : [])
          setQueueSummary({
            currently_served: publicData.currently_served || null,
            waiting_count: Number(publicData.waiting_count) || 0,
          })
          setQueueState('loaded')
        }
      })
      .catch(() => {
        if (active) setQueueState('unavailable')
      })
    return () => { active = false }
  }, [])

  useEffect(() => {
    const root = landingRef.current
    if (!root) return
    const targets = root.querySelectorAll('.landing-benefit, .landing-about, .landing-services, .landing-queue-banner, .landing-queue-info, .landing-schedules, .landing-reasons, .landing-location, .landing-footer-main')
    if (!('IntersectionObserver' in window)) return
    root.classList.add('scroll-animations-ready')
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible')
          observer.unobserve(entry.target)
        }
      })
    }, { threshold: 0.12, rootMargin: '0px 0px -35px 0px' })
    targets.forEach((target) => observer.observe(target))
    return () => observer.disconnect()
  }, [])

  const closeMenu = () => setMenuOpen(false)
  const loginHref = '/login'
  const handleLandingNavigation = (event) => {
    const link = event.target.closest('a[href^="#"]')
    if (!link) return

    const target = document.querySelector(link.getAttribute('href'))
    if (!target) return

    event.preventDefault()
    closeMenu()
    target.scrollIntoView({
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
      block: 'start',
    })
    window.history.replaceState(null, '', link.getAttribute('href'))
  }

  return <main className="landing-page" ref={landingRef} onClick={handleLandingNavigation}>
    <header className="landing-header">
      <Link className="landing-brand" to="/" aria-label="Klinik Polinela, beranda" onClick={closeMenu}>
        <img src={clinicLogo} alt="Logo Klinik Polinela" />
        <span><strong>KLINIK POLINELA</strong><small>Politeknik Negeri Lampung</small></span>
      </Link>
      <button className="landing-menu-toggle" type="button" aria-label={menuOpen ? 'Tutup navigasi' : 'Buka navigasi'} aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X size={22} /> : <Menu size={22} />}</button>
      <nav aria-label="Navigasi utama" className={`landing-nav${menuOpen ? ' is-open' : ''}`}>
        <a href="#beranda" onClick={closeMenu}>Beranda</a><a href="#tentang" onClick={closeMenu}>Tentang Klinik</a><a href="#layanan" onClick={closeMenu}>Layanan</a><a href="#jadwal" onClick={closeMenu}>Jadwal Dokter</a><a href="#informasi" onClick={closeMenu}>Informasi</a><a href="#antrean" onClick={closeMenu}>Lihat Antrean</a>
      </nav>
      <div className="landing-actions">
        {!loading && isStaff ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Link className="landing-login landing-login-primary" to={portal}>
              Portal {user.role === 'doctor' ? 'Dokter' : 'Admin'} <ArrowRight size={16} />
            </Link>
            <Link className="landing-login landing-login-secondary" to="/login" style={{ padding: '8px 12px', fontSize: '13px' }}>
              Ganti Akun
            </Link>
          </div>
        ) : (
          <>
            <Link className="landing-login landing-login-secondary" to={loginHref}>
              Login Admin / Dokter
            </Link>
            <a className="landing-login landing-login-primary" href="#antrean">
              Lihat Antrean <ArrowRight size={16} />
            </a>
          </>
        )}
      </div>
    </header>

    <section className="landing-hero" id="beranda">
      <div className="landing-hero-copy"><span className="landing-eyebrow"><span className="landing-eyebrow-dot" /> LAYANAN KESEHATAN KAMPUS</span><h1>Jaga Kesehatan, Dukung Aktivitas dan <em>Prestasimu.</em></h1><p>Klinik Politeknik Negeri Lampung hadir untuk memberikan informasi dan layanan kesehatan bagi mahasiswa serta seluruh civitas akademika.</p><div className="landing-hero-actions"><a className="landing-cta" href="#antrean">Lihat Antrean <ArrowRight size={17} /></a><a className="landing-text-link" href="#layanan">Jelajahi Layanan <ArrowDown size={16} /></a></div><div className="landing-hero-caption"><span className="landing-caption-icon"><HeartPulse size={17} /></span><span>Pelayanan kesehatan untuk civitas akademika Polinela.</span></div></div>
      <div className="landing-hero-visual" aria-label="Ilustrasi identitas Klinik Polinela"><div className="landing-visual-halo"/><div className="landing-visual-frame landing-visual-phone"><img src={heroIllustration} alt="Pratinjau tampilan mobile Klinik Polinela" /></div><div className="landing-visual-brand"><img src={clinicLogo} alt="" /><span><strong>Klinik Polinela</strong><small>Politeknik Negeri Lampung</small></span><HeartPulse size={21} /></div><div className="landing-visual-stamp"><span>SEHAT</span><HeartPulse size={20} /><span>BERKARYA</span></div></div>
    </section>

    <section className="landing-benefits" aria-label="Keunggulan informasi klinik"><div className="landing-benefits-grid">{benefits.map(({ icon: Icon, title, description }) => <article className="landing-benefit" key={title}><span className="landing-icon-box"><Icon size={21} strokeWidth={1.8} /></span><span className="landing-benefit-copy"><strong>{title}</strong><small>{description}</small></span></article>)}</div></section>

    <section className="landing-section landing-about" id="tentang"><div className="landing-section-intro"><span className="landing-eyebrow">TENTANG KLINIK</span><h2>Mendampingi civitas Polinela tetap sehat.</h2></div><p>Klinik Politeknik Negeri Lampung menyediakan informasi pelayanan kesehatan, jadwal dokter, dan pengelolaan layanan klinik bagi mahasiswa serta seluruh civitas akademika. Informasi pada halaman ini disajikan sesuai data yang tersedia.</p></section>

    <section className="landing-section landing-services" id="layanan"><div className="landing-section-heading"><div><span className="landing-eyebrow">DUKUNGAN KESEHATAN</span><h2>Layanan Kesehatan Kami</h2><p>Temukan informasi layanan kesehatan yang tersedia di Klinik Polinela.</p></div><a className="landing-section-link" href="#lokasi">Informasi klinik <ArrowRight size={16} /></a></div><div className="landing-service-grid">{services.map(({ icon: Icon, title, description, href }, index) => <article className="landing-service-card" key={title}><div className={`landing-service-icon service-tone-${index + 1}`}><Icon size={23} strokeWidth={1.8} /></div><span className="landing-card-index">0{index + 1}</span><h3>{title}</h3><p>{description}</p><a href={href}>Pelajari Selengkapnya <ArrowRight size={15} /></a></article>)}</div></section>

    <section className="landing-queue-banner" id="informasi"><div className="landing-queue-mark"><img src={clinicLogo} alt="" /></div><div className="landing-queue-copy"><span className="landing-eyebrow">AKSES INFORMASI KLINIK</span><h2>Lebih Mudah Mengakses Layanan Kesehatan</h2><p>Lihat informasi layanan dan jadwal Klinik Polinela dengan lebih praktis.</p></div><a className="landing-cta landing-cta-light" href="#antrean">Lihat Antrean <ArrowRight size={17} /></a><div className="landing-queue-decoration" aria-hidden="true"><HeartPulse /><span /><span /></div></section>

    <section className="landing-section landing-queue-info" id="antrean"><div className="landing-section-heading"><div><span className="landing-eyebrow">INFORMASI PUBLIK</span><h2>Informasi Antrean Klinik</h2><p>Pantau informasi antrean pelayanan Klinik Polinela dengan lebih mudah dan praktis.</p></div></div><div className="landing-queue-demo"><div className="landing-queue-demo-heading"><div><span className="landing-queue-demo-icon"><Clock3 size={20} /></span><span><strong>Antrean Pelayanan</strong><small>{queueState === 'loaded' ? 'Informasi antrean hari ini' : 'Status informasi antrean publik'}</small></span></div><span className={`landing-queue-live-badge ${queueState === 'loaded' ? 'is-live' : ''}`}><i />{queueState === 'loading' ? 'Memuat' : queueState === 'unavailable' ? 'Tidak tersedia' : 'Data terkini'}</span></div>{queueState === 'loading' ? <div className="landing-queue-message"><Clock3 size={18} /> Memuat informasi antrean…</div> : queueState === 'unavailable' ? <div className="landing-queue-message is-error"><Info size={18} /> Informasi antrean sedang tidak dapat dimuat. Silakan coba kembali nanti.</div> : publicQueues.length === 0 ? <div className="landing-queue-message"><Info size={18} /> Belum ada antrean saat ini</div> : <><div className="landing-queue-summary"><div><small>Sedang dilayani</small><strong>{queueSummary.currently_served || '—'}</strong></div><div><small>Antrean menunggu</small><strong>{queueSummary.waiting_count}</strong></div></div><div className="landing-demo-table-wrap"><table className="landing-demo-table"><thead><tr><th>Nomor antrean</th><th>Tanggal & waktu</th><th>Jenis layanan</th><th>Status antrean</th></tr></thead><tbody>{publicQueues.map((queue) => <tr key={`${queue.queue_number}-${queue.queue_time || queue.created_at}`}><td><strong className="landing-demo-number">{queue.queue_number}</strong></td><td>{queue.visit_date}{queue.queue_time ? ` · ${queue.queue_time}` : ''}</td><td>{queue.service_type}</td><td><span className={`landing-demo-status ${queue.status === 'Diperiksa' ? 'is-called' : ''}`}><i /> {queue.status}</span></td></tr>)}</tbody></table></div><div className="landing-queue-demo-note"><Info size={16} /><span>Data antrean publik tidak menyertakan nama pasien, identitas, keluhan, atau informasi medis.</span></div></>}</div></section>

    <section className="landing-section landing-schedules" id="jadwal"><div className="landing-section-heading"><div><span className="landing-eyebrow">INFORMASI PRAKTIK</span><h2>Jadwal Pelayanan Dokter</h2><p>Informasi jadwal dokter yang bertugas di Klinik Polinela.</p></div><span className="landing-live-label"><span /> {scheduleState === 'loaded' ? 'Data jadwal' : 'Informasi klinik'}</span></div>{scheduleState === 'loading' ? <div className="landing-schedule-empty"><span className="landing-icon-box"><CalendarDays size={21} /></span><p>Memuat informasi jadwal dokter…</p></div> : schedules.length ? <div className="landing-schedule-grid">{schedules.map((schedule) => <article className="landing-schedule-card" key={schedule.id}><div className="landing-doctor-avatar"><Stethoscope size={26} /></div><div className="landing-doctor-info"><span className="landing-doctor-label">DOKTER KLINIK</span><h3>{schedule.doctor_profile?.user?.name || schedule.doctorProfile?.user?.name || 'Nama dokter tidak tersedia'}</h3><p>{schedule.doctor_profile?.clinic_type || schedule.doctorProfile?.clinic_type || 'Jenis pelayanan belum tersedia'}</p></div><div className="landing-schedule-details"><span><CalendarDays size={16} /> {schedule.day || 'Hari belum tersedia'}</span><span><Clock3 size={16} /> {schedule.start_time || '—'} – {schedule.end_time || '—'}</span><span className={`landing-status ${schedule.is_active ? 'is-active' : ''}`}><i /> {schedule.is_active ? 'Jadwal aktif' : 'Tidak aktif'}</span></div></article>)}</div> : <div className="landing-schedule-empty"><span className="landing-icon-box"><CalendarDays size={21} /></span><div><strong>{scheduleState === 'unavailable' ? 'Jadwal dokter belum dapat ditampilkan.' : 'Belum ada jadwal dokter yang tersedia.'}</strong><p>Silakan hubungi Klinik Polinela atau petugas klinik untuk memastikan jadwal terbaru.</p></div></div>}</section>

    <section className="landing-section landing-reasons"><div className="landing-section-heading"><div><span className="landing-eyebrow">MENGAPA KLINIK POLINELA?</span><h2>Informasi yang membantu Anda.</h2></div></div><div className="landing-reason-grid">{reasons.map(({ icon: Icon, title, description }) => <article key={title}><span className="landing-reason-icon"><Icon size={20} /></span><h3>{title}</h3><p>{description}</p></article>)}</div></section>

    <section className="landing-location" id="lokasi"><div className="landing-location-copy"><span className="landing-eyebrow">KUNJUNGI KAMI</span><h2>Temukan Klinik Polinela</h2><p>Lokasi klinik berada di lingkungan Politeknik Negeri Lampung. Silakan hubungi pihak kampus atau petugas klinik untuk petunjuk lokasi dan informasi kontak terbaru.</p><div className="landing-location-facts"><span><MapPin size={18} /><span><strong>Klinik Politeknik Negeri Lampung</strong><small>Politeknik Negeri Lampung</small></span></span><span><Clock3 size={18} /><span><strong>Jam operasional</strong><small>Konfirmasi kepada pihak klinik untuk informasi terbaru</small></span></span></div><a className="landing-location-button" href="https://polinela.ac.id/" target="_blank" rel="noreferrer">Lihat Lokasi Kampus <ArrowRight size={16} /></a></div><div className="landing-map-placeholder"><div className="landing-map-grid"/><span className="landing-map-pin"><MapPin size={25} /></span><div className="landing-map-card"><img src={clinicLogo} alt="" /><span><strong>Klinik Polinela</strong><small>Politeknik Negeri Lampung</small></span></div><span className="landing-map-note">Peta lokasi kampus</span></div></section>

    <footer className="landing-footer"><div className="landing-footer-main"><div className="landing-footer-brand"><Link className="landing-footer-logo" to="/"><img src={clinicLogo} alt="Logo Klinik Polinela" /><span><strong>KLINIK POLINELA</strong><small>Politeknik Negeri Lampung</small></span></Link><p>Mendukung kesehatan mahasiswa dan seluruh civitas akademika Politeknik Negeri Lampung.</p></div><div className="landing-footer-column"><strong>Navigasi Cepat</strong><a href="#beranda">Beranda</a><a href="#tentang">Tentang Klinik</a><a href="#layanan">Layanan</a><a href="#jadwal">Jadwal Dokter</a></div><div className="landing-footer-column"><strong>Informasi Layanan</strong><a href="#informasi">Antrean Klinik</a><a href="#jadwal">Informasi Dokter</a><a href="#lokasi">Lokasi Klinik</a><Link to="/login">Login Admin & Dokter</Link></div><div className="landing-footer-column landing-footer-contact"><strong>Lokasi & Waktu</strong><span><MapPin size={16} /> Politeknik Negeri Lampung</span><span><Clock3 size={16} /> Hubungi klinik untuk jam terbaru</span><a href="https://polinela.ac.id/" target="_blank" rel="noreferrer">Situs Polinela <ArrowRight size={14} /></a></div></div><div className="landing-footer-bottom"><span>© 2026 Klinik Politeknik Negeri Lampung</span><span>Sehat untuk terus berkarya.</span></div></footer>
  </main>
}

export default function App() {
  return <Routes>
    <Route path="/" element={<LandingPage />} />
    <Route path="/login" element={<LoginPage />} />
    <Route path="/admin/*" element={<RoleGuard roles={['admin']} />}>
      <Route element={<DashboardLayout />}>
        <Route index element={<AdminDashboardPage />} />
        <Route path="queues" element={<AdminQueuesPage />} />
        <Route path="schedules" element={<AdminSchedulesPage />} />
        <Route path="medicines" element={<AdminMedicinesPage />} />
        <Route path="notifications" element={<AdminNotificationsPage />} />
        <Route path="*" element={<AdminDashboardPage />} />
      </Route>
    </Route>
    <Route path="/doctor/*" element={<RoleGuard roles={['doctor']} />}>
      <Route element={<DashboardLayout />}><Route index element={<DashboardPage />} /><Route path="*" element={<DashboardPage />} /></Route>
    </Route>
    <Route path="/patient/*" element={<Navigate to="/" replace />} />
    <Route path="*" element={<NotFoundPage />} />
  </Routes>
}
