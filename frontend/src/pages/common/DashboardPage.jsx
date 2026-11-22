import { useEffect, useState } from 'react'
import { Activity, ArrowUpRight, CalendarDays, ClipboardList, Pill, Users } from 'lucide-react'
import api from '../../services/api'
import { useAuth } from '../../context/AuthContext'

function MetricCard({ icon: Icon, label, value, tone, detail }) {
  return <article className="metric-card"><div className={`metric-icon ${tone}`}><Icon size={19} /></div><div className="metric-label">{label}</div><strong className="metric-value">{value ?? '—'}</strong><span className="metric-detail">{detail}</span></article>
}

export default function DashboardPage() {
  const { user } = useAuth()
  const [payload, setPayload] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const endpoint = user?.role === 'admin' ? '/admin/dashboard/stats' : user?.role === 'doctor' ? '/doctor/dashboard' : '/patient/dashboard'
    api.get(endpoint)
      .then(({ data }) => setPayload(data.data))
      .catch((err) => setError(err.response?.data?.message || 'Data dashboard belum dapat dimuat. Pastikan API berjalan.'))
      .finally(() => setLoading(false))
  }, [user?.role])

  const roleLabel = { admin: 'Administrator Klinik', doctor: 'Dokter', patient: 'Pasien' }[user?.role]
  const stats = payload?.stats || {}

  return <section>
    <div className="page-heading-row"><div><span className="eyebrow">RINGKASAN LAYANAN</span><h1>Selamat datang, {user?.name?.split(' ')[0] || 'Pengguna'}</h1><p>Berikut ringkasan aktivitas layanan Klinik Polinela.</p></div><div className="date-chip"><CalendarDays size={16} />{new Intl.DateTimeFormat('id-ID', { dateStyle: 'long' }).format(new Date())}</div></div>
    {error && <div className="alert-banner">{error}</div>}
    {loading ? <div className="loading-panel">Memuat ringkasan…</div> : <>
      <div className="welcome-strip"><div><span className="welcome-kicker">PORTAL {roleLabel?.toUpperCase()}</span><h2>{user?.role === 'patient' ? 'Layanan kesehatan Anda dalam satu tempat.' : 'Informasi klinik terkini.'}</h2><p>{user?.role === 'patient' ? 'Pantau antrean dan akses informasi klinik dengan mudah.' : 'Kelola pelayanan klinik dengan data yang terhubung.'}</p></div><div className="welcome-decoration"><Activity size={42} /></div></div>
      {user?.role === 'admin' && <div className="metrics-grid"><MetricCard icon={Users} label="Pasien Terdaftar" value={stats.total_patients} tone="blue" detail="Total profil pasien" /><MetricCard icon={ClipboardList} label="Antrean Hari Ini" value={stats.today_queues} tone="mint" detail={`${stats.waiting_queues ?? 0} pasien menunggu`} /><MetricCard icon={Activity} label="Sedang Diperiksa" value={stats.processing_queues} tone="violet" detail="Antrean aktif" /><MetricCard icon={Pill} label="Obat Stok Menipis" value={stats.low_stock_medicines} tone="amber" detail={`${stats.total_medicines ?? 0} jenis obat terdaftar`} /></div>}
      {user?.role === 'doctor' && <div className="metrics-grid"><MetricCard icon={ClipboardList} label="Pasien Hari Ini" value={stats.today_total} tone="blue" detail="Antrean ditugaskan" /><MetricCard icon={Activity} label="Menunggu" value={stats.waiting} tone="amber" detail="Siap dilayani" /><MetricCard icon={Activity} label="Sedang Diperiksa" value={stats.processing} tone="mint" detail="Dalam pelayanan" /><MetricCard icon={Users} label="Selesai" value={stats.completed} tone="violet" detail="Pemeriksaan hari ini" /></div>}
      {user?.role === 'patient' && <div className="metrics-grid"><MetricCard icon={ClipboardList} label="Antrean Aktif" value={payload?.active_queue?.queue_number || '—'} tone="blue" detail={payload?.active_queue?.status || 'Belum ada antrean aktif'} /><MetricCard icon={Activity} label="Menunggu" value={payload?.live_queue?.waiting_count ?? 0} tone="amber" detail="Antrean klinik hari ini" /><MetricCard icon={CalendarDays} label="Jadwal Tersedia" value={payload?.schedules?.length ?? 0} tone="mint" detail="Jadwal dokter aktif" /><MetricCard icon={ArrowUpRight} label="Belum Dibaca" value={payload?.unread_notifications_count ?? 0} tone="violet" detail="Notifikasi klinik" /></div>}
    </>}
    <div className="dashboard-lower"><article className="surface-card"><div className="surface-heading"><div><span className="eyebrow">AKTIVITAS</span><h2>{user?.role === 'patient' ? 'Antrean Terbaru' : 'Antrean Hari Ini'}</h2></div><ClipboardList size={18} /></div>
      {loading ? <div className="empty-state">Memuat data…</div> : user?.role === 'patient' ? (payload?.latest_queues?.length ? <div className="simple-list">{payload.latest_queues.map((q) => <div className="simple-row" key={q.id}><span className="queue-number">{q.queue_number}</span><span>{q.doctor_profile?.user?.name || 'Dokter belum ditentukan'}</span><span className={`status-pill status-${q.status === 'Selesai' ? 'done' : q.status === 'Diperiksa' ? 'process' : 'waiting'}`}>{q.status}</span></div>)}</div> : <div className="empty-state">Belum ada riwayat antrean. Pengajuan antrean tersedia melalui menu Antrean Saya.</div>) : (payload?.latest_queues?.length || payload?.queues?.length ? <div className="simple-list">{(payload.latest_queues || payload.queues).slice(0, 6).map((q) => <div className="simple-row" key={q.id}><span className="queue-number">{q.queue_number}</span><span>{q.patient_profile?.user?.name || 'Pasien'}</span><span className={`status-pill status-${q.status === 'Selesai' ? 'done' : q.status === 'Diperiksa' ? 'process' : 'waiting'}`}>{q.status}</span></div>)}</div> : <div className="empty-state">Belum ada antrean untuk ditampilkan.</div>)}
    </article><article className="surface-card service-card"><div className="surface-heading"><div><span className="eyebrow">INFORMASI</span><h2>Profil Anda</h2></div><Users size={18} /></div><div className="profile-summary"><div className="avatar profile-avatar">{user?.name?.[0]?.toUpperCase()}</div><div><strong>{user?.name}</strong><span>{roleLabel}</span><small>{user?.email}</small></div></div><div className="service-note"><span className="service-dot" /><div><strong>Data terlindungi</strong><p>Akses akun mengikuti kewenangan role dan tersimpan di server klinik.</p></div></div></article></div>
  </section>
}
