import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Activity, AlertCircle, BarChart2, Bell, CalendarDays, Calendar, Check, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, Clock3, ClipboardList, Download, Edit, ListOrdered, PackagePlus, Pencil, Pill, Plus, PlusCircle, RefreshCw, Search, Send, Stethoscope, Trash2, TrendingUp, User, Users, Volume2, X, XCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import './admin.css'
import './schedule.css'
import './queues-v2.css'

function SlideOver({ title, sub, onClose, children, footer }) {
  return (
    <div className="slide-over-backdrop" onClick={(e) => e.target.className === 'slide-over-backdrop' && onClose()}>
      <section className="slide-over-panel">
        <div className="slide-over-header">
          <div className="slide-over-title-area" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#e0f2fe', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><PackagePlus size={19} /></div>
            <div><h2>{title}</h2>
            <p>{sub}</p></div>
          </div>
          <button className="btn-close" onClick={onClose} aria-label="Tutup"><X size={20} /></button>
        </div>
        <div className="slide-over-body">{children}</div>
        <div className="slide-over-footer">{footer}</div>
      </section>
    </div>
  )
}


function PageHeading({ eyebrow, title, description, action }) {
  return (
    <div className="page-heading-row admin-heading">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {action}
    </div>
  )
}

function StatTile({ icon: Icon, label, value, tone = 'blue', detail }) {
  return (
    <article className="metric-card">
      <div className={`metric-icon ${tone}`}>
        <Icon size={19} />
      </div>
      <div className="metric-label">{label}</div>
      <strong className="metric-value">{value ?? '—'}</strong>
      <span className="metric-detail">{detail}</span>
    </article>
  )
}

function useAdminData(endpoint, fallback = []) {
  const [data, setData] = useState(fallback)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const refresh = useCallback(async (params) => {
    setLoading(true)
    setError('')
    try {
      const response = await api.get(endpoint, { params })
      setData(response.data.data ?? fallback)
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Data gagal dimuat. Periksa koneksi server.')
    } finally {
      setLoading(false)
    }
  }, [endpoint])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { data, setData, loading, error, refresh }
}

function Alert({ children, type = 'error' }) {
  return children ? <div className={`alert-banner admin-alert ${type}`}>{children}</div> : null
}

function Modal({ title, onClose, children }) {
  return (
    <div className="admin-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <section className="admin-modal" role="dialog" aria-modal="true" aria-label={title}>
        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2>{title}</h2>
          <button className="btn-close" onClick={onClose} aria-label="Tutup"><X size={19} /></button>
        </header>
        {children}
      </section>
    </div>
  )
}

function Pagination({ page, pageCount, onChange }) {
  if (pageCount <= 1) return null
  return (
    <div className="admin-pagination">
      <span>Halaman {page} dari {pageCount}</span>
      <div>
        <button disabled={page <= 1} onClick={() => onChange(page - 1)} aria-label="Halaman sebelumnya">
          <ChevronLeft size={17} />
        </button>
        <button disabled={page >= pageCount} onClick={() => onChange(page + 1)} aria-label="Halaman berikutnya">
          <ChevronRight size={17} />
        </button>
      </div>
    </div>
  )
}

export function AdminDashboardPage() {
  const { data, loading, error, refresh } = useAdminData('/admin/dashboard/stats', {})
  const stats = data?.stats || {}
  const queues = data?.latest_queues || []
  const medicines = data?.medicines || []

  // Auto-refresh data metrik realtime setiap 15 detik
  useEffect(() => {
    const timer = setInterval(() => {
      refresh()
    }, 15000)
    return () => clearInterval(timer)
  }, [refresh])

  return (
    <section className="admin-dashboard-page">
      <div className="admin-welcome-banner">
        <div>
          <span className="admin-welcome-pill">● REALTIME AKTIF (Setiap 15 Detik)</span>
          <h1>Selamat Datang, Admin Klinik</h1>
          <p>Pantau metrik pelayanan klinik hari ini secara realtime dan terintegrasi.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="button"
            onClick={() => refresh()}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 12px',
              borderRadius: '18px',
              border: 'none',
              background: '#ffffff26',
              color: '#fff',
              fontSize: '11px',
              cursor: 'pointer',
              fontWeight: 600
            }}
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Segarkan
          </button>
          <div className="admin-operating-pill">
            <span /> Operasional Klinik
          </div>
        </div>
      </div>

      {error && <Alert>{error}</Alert>}

      {loading && !stats.total_patients ? (
        <div className="loading-panel">Memuat ringkasan aktual…</div>
      ) : (
        <>
          {/* 4 METRIK REALTIME UTAMA */}
          <div className="metrics-grid" style={{ marginBottom: '16px' }}>
            <StatTile
              icon={ClipboardList}
              label="Total Antrean Hari Ini"
              value={stats.today_queues ?? 0}
              tone="blue"
              detail={`${stats.waiting_queues ?? 0} menunggu · ${stats.processing_queues ?? 0} diperiksa`}
            />
            <StatTile
              icon={Users}
              label="Pasien Hari Ini"
              value={stats.today_patients ?? 0}
              tone="mint"
              detail={`Total ${stats.total_patients ?? 0} pasien terdaftar`}
            />
            <StatTile
              icon={Pill}
              label="Obat Menipis"
              value={stats.low_stock_medicines ?? 0}
              tone="amber"
              detail={`Dari ${stats.total_medicines ?? 0} item obat aktif`}
            />
            <StatTile
              icon={CalendarDays}
              label="Jadwal Dokter Aktif"
              value={stats.active_schedules ?? 0}
              tone="violet"
              detail={`${stats.active_doctors ?? 0} dokter berpraktik`}
            />
          </div>

          <div className="admin-dashboard-grid">
            <div className="surface-card admin-dashboard-activity">
              <div className="surface-heading">
                <div>
                  <span className="eyebrow">PEMANTAUAN HARI INI</span>
                  <h2>Aktivitas Antrean Terbaru</h2>
                  <p>Pantauan alur antrean pelayanan pasien saat ini.</p>
                </div>
                <ClipboardList size={20} />
              </div>
              {queues.length ? (
                <div className="admin-dashboard-table-wrap">
                  <table className="admin-dashboard-table">
                    <thead>
                      <tr>
                        <th>Nomor antrean</th>
                        <th>Nama pasien</th>
                        <th>Poli / Dokter</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {queues.slice(0, 6).map((queue) => (
                        <tr key={queue.id}>
                          <td><strong>{queue.queue_number}</strong></td>
                          <td>{queue.patient_profile?.user?.name || 'Pasien'}</td>
                          <td>{queue.doctor_profile?.user?.name || queue.doctor_profile?.clinic_type || 'Umum'}</td>
                          <td>
                            <span className={`status-pill status-${queue.status === 'Selesai' ? 'done' : queue.status === 'Diperiksa' ? 'process' : queue.status === 'Dibatalkan' ? 'danger' : 'waiting'}`}>
                              {queue.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="empty-state">Belum ada antrean hari ini.</div>
              )}
              <Link className="admin-dashboard-link" to="/admin/queues">
                Kelola Seluruh Antrean <ChevronRight size={15} />
              </Link>
            </div>

            <div className="surface-card admin-dashboard-stock">
              <div className="surface-heading">
                <div>
                  <span className="eyebrow">INVENTARIS FARMASI</span>
                  <h2>Informasi Stok Obat</h2>
                  <p>Status obat yang menipis atau memerlukan stok masuk.</p>
                </div>
                <Pill size={19} />
              </div>
              {medicines.length ? (
                <div className="admin-stock-list">
                  {medicines.slice(0, 5).map((medicine) => {
                    const low = Number(medicine.stock) <= Number(medicine.min_stock_alert)
                    return (
                      <div key={medicine.id}>
                        <span>
                          <strong>{medicine.name}</strong>
                          <small>{medicine.stock} {medicine.form || 'unit'}</small>
                        </span>
                        <b className={low ? 'low' : ''}>{low ? 'Menipis' : 'Aman'}</b>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="empty-state">Belum ada data obat.</div>
              )}
              <Link className="admin-dashboard-stock-link" to="/admin/medicines">
                <Pill size={14} /> Kelola Obat
              </Link>
            </div>
          </div>

          <div className="admin-dashboard-summary" style={{ marginTop: '14px' }}>
            <span>● {stats.processing_queues ?? 0} antrean sedang dilayani</span>
            <span>● {stats.completed_queues ?? 0} antrean selesai hari ini</span>
            <span>● {stats.active_doctors ?? 0} dokter aktif bertugas</span>
          </div>
        </>
      )}
    </section>
  )
}

export function AdminQueuesPage() {
  const [activeTab, setActiveTab] = useState('permintaan')
  const [activePopover, setActivePopover] = useState(null)
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [status, setStatus] = useState('Semua')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [callingId, setCallingId] = useState(null)

  const { data, loading, error, refresh } = useAdminData('/admin/queues', [])

  useEffect(() => {
    refresh({ date })
  }, [date, refresh])

  useEffect(() => {
    const handleClickOutside = () => setActivePopover(null)
    window.addEventListener('click', handleClickOutside)
    return () => window.removeEventListener('click', handleClickOutside)
  }, [])

  const allRows = Array.isArray(data) ? data : []
  
  // Filter data untuk masing-masing tab
  const permintaanRows = allRows.filter(r => r.status === 'Menunggu')
  const aktifRows = allRows.filter(r => r.status === 'Diperiksa' || r.status === 'Menunggu')
  
  const getFilteredRows = () => {
    let rows = []
    if (activeTab === 'permintaan') rows = permintaanRows
    else if (activeTab === 'aktif') rows = aktifRows
    else rows = allRows

    if (search) {
      const s = search.toLowerCase()
      rows = rows.filter(row => 
        `${row.queue_number} ${row.patient_profile?.user?.name || ''} ${row.patient_profile?.identifier_number || ''} ${row.patient_profile?.study_program || ''} ${row.complaint || ''}`
          .toLowerCase()
          .includes(s)
      )
    }
    return rows
  }

  const rows = getFilteredRows()
  const pageCount = Math.max(1, Math.ceil(rows.length / 8))
  const pageRows = rows.slice((page - 1) * 8, page * 8)

  const changeStatus = async (row, nextStatus) => {
    try {
      await api.patch(`/admin/queues/${row.id}/status`, { status: nextStatus })
      toast.success(`Status antrean ${row.queue_number} diubah menjadi "${nextStatus}".`)
      refresh({ date })
      setActivePopover(null)
    } catch (requestError) {
      toast.error(requestError.response?.data?.message || 'Status antrean gagal diperbarui.')
    }
  }

  const handleCallPatient = async (row) => {
    setCallingId(row.id)
    try {
      await api.post(`/admin/queues/${row.id}/call`)
      const patientName = row.patient_profile?.user?.name || 'Pasien'
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel()
        const speech = new SpeechSynthesisUtterance(`Nomor antrean ${row.queue_number}. Atas nama ${patientName}. Silakan menuju ruang pemeriksaan.`)
        speech.lang = 'id-ID'
        speech.rate = 0.95
        window.speechSynthesis.speak(speech)
      }
      toast.success(`Nomor antrean ${row.queue_number} (${patientName}) dipanggil!`, { icon: '📢' })
      refresh({ date })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal memanggil antrean.')
    } finally {
      setCallingId(null)
    }
  }

  const kpi = {
    permintaan: allRows.filter(r => r.status === 'Menunggu').length,
    hariIni: allRows.length,
    diperiksa: allRows.filter(r => r.status === 'Diperiksa').length,
    selesai: allRows.filter(r => r.status === 'Selesai').length,
    kuota: 60 // ponytail: kuota harian statis, upgrade dengan config API
  }

  return (
    <section className="admin-queues-v2">
      <header className="page-header-v2">
        <div className="header-left">
          <h1>Kelola Antrean Klinik</h1>
          <p>Kelola pendaftaran mandiri dari aplikasi pengguna, konfirmasi nomor antrean resmi dengan aman, dan pantau antrean aktif secara real-time.</p>
        </div>
        {(activeTab === 'permintaan' || activeTab === 'aktif') && (
          <button className="btn-download-v2">
            <Download size={18} /> Download Rekap Harian (XLSX)
          </button>
        )}
      </header>

      <div className="kpi-grid-v2">
        <div className="kpi-card-v2">
          <div className="kpi-top">
            <div>
              <span className="kpi-label">PERMINTAAN BARU</span>
              <div className="kpi-value">{kpi.permintaan} <small>Pengajuan</small></div>
            </div>
            <div className="kpi-icon-box alert"><AlertCircle size={22} /></div>
          </div>
          <div className="kpi-footer">
            <span className="badge-v2 warning">Menunggu Validasi</span>
            <span className="kpi-note">Perlu verifikasi poli segera</span>
          </div>
        </div>

        <div className="kpi-card-v2">
          <div className="kpi-top">
            <div>
              <span className="kpi-label">ANTREAN HARI INI</span>
              <div className="kpi-value">{kpi.hariIni} <small>/ {kpi.kuota} kuota</small></div>
            </div>
            <div className="kpi-icon-box blue"><ListOrdered size={22} /></div>
          </div>
          <div className="kpi-footer">
            <span className="kpi-note-icon"><Users size={14} /> Pasien Terkonfirmasi</span>
            <span className="kpi-percent">{Math.round((kpi.hariIni / kpi.kuota) * 100)}% kuota terisi</span>
          </div>
        </div>

        <div className="kpi-card-v2">
          <div className="kpi-top">
            <div>
              <span className="kpi-label">SEDANG DIPERIKSA</span>
              <div className="kpi-value">{kpi.diperiksa} <small>Ruang Aktif</small></div>
            </div>
            <div className="kpi-icon-box mint"><Stethoscope size={22} /></div>
          </div>
          <div className="kpi-footer">
            <span className="badge-v2 success">Pasien di Ruang Poli</span>
            <span className="kpi-note">Konsultasi dokter berjalan</span>
          </div>
        </div>

        <div className="kpi-card-v2">
          <div className="kpi-top">
            <div>
              <span className="kpi-label">SELESAI DILAYANI</span>
              <div className="kpi-value">{kpi.selesai} <small>Pasien</small></div>
            </div>
            <div className="kpi-icon-box violet"><CheckCircle2 size={22} /></div>
          </div>
          <div className="kpi-footer">
            <span className="kpi-note-icon text-violet"><TrendingUp size={14} /> Penanganan {Math.round((kpi.selesai / (kpi.hariIni || 1)) * 100)}%</span>
            <span className="kpi-note">Obat selesai diambil</span>
          </div>
        </div>
      </div>

      <div className="main-tabs-container-v2">
        <nav className="tabs-header-v2">
          <button className={activeTab === 'permintaan' ? 'active' : ''} onClick={() => setActiveTab('permintaan')}>
            PERMINTAAN ANTREAN <span className="tab-badge">{kpi.permintaan}</span>
          </button>
          <button className={activeTab === 'aktif' ? 'active' : ''} onClick={() => setActiveTab('aktif')}>
            ANTREAN AKTIF <span className="tab-badge">{kpi.diperiksa}</span>
          </button>
          <button className={activeTab === 'data' ? 'active' : ''} onClick={() => setActiveTab('data')}>
            Data Antrean <span className="tab-badge">{kpi.hariIni}</span>
          </button>
        </nav>

        <div className="tab-content-v2">
          {activeTab !== 'data' ? (
            <>
              <div className="search-bar-v2">
                <Search size={18} />
                <input 
                  type="text" 
                  placeholder="Cari nama pemohon, NPM, jurusan, atau keluhan ringkas..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <div className="table-header-v2">
                <h3>Daftar antrean klinik Polinela</h3>
                <span className="table-info">Menampilkan {pageRows.length} dari {rows.length} permintaan</span>
              </div>

              <div className="table-responsive-v2">
                <table className="table-v2">
                  <thead>
                    {activeTab === 'permintaan' ? (
                      <tr>
                        <th>NAMA & IDENTITAS PASIEN</th>
                        <th>JENIS LAYANAN</th>
                        <th>TANGGAL & WAKTU PENDAFTARAN</th>
                        <th>STATUS</th>
                        <th>TINDAKAN ADMIN</th>
                      </tr>
                    ) : (
                      <tr>
                        <th>NO. ANTREAN</th>
                        <th>IDENTITAS PASIEN</th>
                        <th>LAYANAN & DOKTER</th>
                        <th>JAM ANTRIAN</th>
                        <th>STATUS ALUR</th>
                        <th>AKSI TINDAKAN</th>
                      </tr>
                    )}
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan="6" className="text-center py-8">Memuat data...</td></tr>
                    ) : pageRows.length === 0 ? (
                      <tr><td colSpan="6" className="text-center py-8">Tidak ada data ditemukan</td></tr>
                    ) : pageRows.map(row => (
                      <tr key={row.id}>
                        {activeTab === 'permintaan' ? (
                          <>
                            <td>
                              <div className="patient-cell-v2">
                                <div className="avatar-v2">{row.patient_profile?.user?.name?.[0] || 'P'}</div>
                                <div>
                                  <div className="patient-name-v2">{row.patient_profile?.user?.name}</div>
                                  <div className="patient-meta-v2">NPM: {row.patient_profile?.identifier_number}</div>
                                  <div className="patient-meta-v2">{row.patient_profile?.study_program}</div>
                                </div>
                              </div>
                            </td>
                            <td><span className="badge-pill-v2">{row.doctor_profile?.clinic_type || 'Poli Umum'}</span></td>
                            <td>
                              <div className="time-cell-v2">
                                <strong>{row.visit_date}</strong>
                                <span>{row.estimated_time?.slice(0, 5)} WIB</span>
                              </div>
                            </td>
                            <td><span className="badge-pill-v2 waiting">Menunggu Konfirmasi</span></td>
                            <td>
                              <button className="btn-confirm-v2" onClick={() => changeStatus(row, 'Diperiksa')}>
                                <Check size={16} /> Konfirmasi
                              </button>
                            </td>
                          </>
                        ) : (
                          <>
                            <td><span className="queue-number-v2">{row.queue_number}</span></td>
                            <td>
                              <div>
                                <div className="patient-name-v2">{row.patient_profile?.user?.name}</div>
                                <div className="patient-meta-v2">
                                  <span className="badge-npm-v2">{row.patient_profile?.identifier_number}</span> • {row.patient_profile?.study_program}
                                </div>
                              </div>
                            </td>
                            <td>
                              <div className="doctor-cell-v2">
                                <User size={14} /> {row.doctor_profile?.user?.name || 'Dokter'}
                              </div>
                            </td>
                            <td>
                              <div className="time-cell-v2">
                                <strong>{row.estimated_time?.slice(0, 5)}</strong>
                                <span>Est: ~15 Menit lagi</span>
                              </div>
                            </td>
                            <td>
                              <span className={`status-indicator-v2 ${row.status === 'Diperiksa' ? 'process' : 'waiting'}`}>
                                {row.status}
                              </span>
                            </td>
                            <td className="relative">
                              <button 
                                className={`btn-status-v2 ${activePopover === row.id ? 'active' : ''}`}
                                onClick={(e) => { e.stopPropagation(); setActivePopover(row.id === activePopover ? null : row.id) }}
                              >
                                Ubah Status
                              </button>
                              
                              {activePopover === row.id && (
                                <div className="popover-v2" onClick={e => e.stopPropagation()}>
                                  <div className="popover-header-v2">
                                    <span>UBAH STATUS KE</span>
                                    <strong>{row.queue_number}</strong>
                                  </div>
                                  <div className="popover-options-v2">
                                    {['Menunggu', 'Diperiksa', 'Selesai'].map(st => (
                                      <button key={st} onClick={() => changeStatus(row, st)}>
                                        <span className={`dot-v2 ${st === 'Menunggu' ? 'waiting' : st === 'Diperiksa' ? 'process' : 'done'}`}></span>
                                        {st}
                                        {row.status === st && <Check size={14} className="ml-auto" />}
                                      </button>
                                    ))}
                                  </div>
                                  <div className="popover-footer-v2">
                                    <button className="btn-cancel-queue-v2" onClick={() => changeStatus(row, 'Dibatalkan')}>
                                      <XCircle size={14} /> Batalkan antrean
                                    </button>
                                  </div>
                                </div>
                              )}
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="pagination-v2">
                <button disabled={page <= 1} onClick={() => setPage(page - 1)}>Sebelumnya</button>
                <div className="page-numbers-v2">
                  {[...Array(pageCount)].map((_, i) => (
                    <button key={i} className={page === i + 1 ? 'active' : ''} onClick={() => setPage(i + 1)}>{i + 1}</button>
                  ))}
                </div>
                <button disabled={page >= pageCount} onClick={() => setPage(page + 1)}>Berikutnya</button>
              </div>
            </>
          ) : (
            <div className="chart-container-v2">
              <header className="chart-header-v2">
                <div className="header-left">
                  <div className="chart-title">
                    <BarChart2 size={20} />
                    <div>
                      <h4>Jumlah Antrean per Hari</h4>
                      <p>Data harian bulan {new Date().toLocaleString('id-ID', { month: 'long', year: 'numeric' })}. Tampilan dimulai dari awal setiap tanggal 1.</p>
                    </div>
                  </div>
                </div>
                <div className="header-right">
                  <button className="btn-month-v2">
                    <Calendar size={16} /> {new Date().toLocaleString('id-ID', { month: 'long', year: 'numeric' })} <ChevronDown size={16} />
                  </button>
                  <button className="btn-download-white-v2">
                    <Download size={16} /> Download Rekap Harian (XLSX)
                  </button>
                </div>
              </header>

              <div className="chart-visual-v2">
                <div className="y-axis-v2">
                  {[60, 45, 30, 15, 0].map(val => <span key={val}>{val}</span>)}
                </div>
                <div className="chart-area-v2">
                  <div className="quota-line-v2" style={{ bottom: '100%' }}>
                    <span>● Kuota Harian Maks: {kpi.kuota} Pasien</span>
                  </div>
                  <div className="bars-v2">
                    {[...Array(30)].map((_, i) => {
                      const day = i + 1
                      const today = new Date().getDate()
                      let type = 'future'
                      if (day < today) type = 'past'
                      if (day === today) type = 'today'
                      
                      return (
                        <div key={i} className="bar-wrapper-v2 group">
                          <div 
                            className={`bar-v2 ${type}`} 
                            style={{ height: day === today ? `${(kpi.hariIni / kpi.kuota) * 100}%` : '5%' }}
                          ></div>
                          <span className="bar-label-v2">{day}</span>
                          
                          <div className="chart-tooltip-v2">
                            <strong>{day} {new Date().toLocaleString('id-ID', { month: 'long' })} {day === today && <span className="tooltip-today">Hari ini</span>}</strong>
                            <div>{day === today ? kpi.hariIni : 0} Antrean Tercatat</div>
                            <ul>
                              <li className="done">● {day === today ? kpi.selesai : 0} Selesai</li>
                              <li className="cancel">● 0 Dibatalkan</li>
                            </ul>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              <div className="chart-legend-v2">
                <span><span className="dot past"></span> Hari lalu (1 – {new Date().getDate() - 1})</span>
                <span><span className="dot today"></span> Hari ini ({new Date().getDate()})</span>
                <span><span className="dot future"></span> Belum berjalan ({new Date().getDate() + 1} – 30)</span>
                <span><span className="dot-line"></span> Batas kuota harian ({kpi.kuota})</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <footer className="info-card-v2">
        <div className="info-left-v2">
          <div className="info-icon-v2"><Activity size={24} /></div>
          <div>
            <h4>Alur Status Triase Otomatis</h4>
            <p>Setiap pembaruan status akan langsung disiarkan ke papan monitor ruang tunggu dan aplikasi seluler mahasiswa secara simultan.</p>
          </div>
        </div>
        <div className="info-right-v2">
          <div className="flow-step-v2">
            <span className="flow-dot waiting"></span>
            <span>Menunggu</span>
          </div>
          <div className="flow-arrow-v2"></div>
          <div className="flow-step-v2">
            <span className="flow-dot process"></span>
            <span>Diperiksa</span>
          </div>
          <div className="flow-arrow-v2"></div>
          <div className="flow-step-v2">
            <span className="flow-dot done"></span>
            <span>Selesai</span>
          </div>
        </div>
      </footer>
    </section>
  )
}

export function AdminSchedulesPage() {
  const { data: schedules, loading, error, refresh } = useAdminData('/admin/schedules')
  const { data: doctors, error: doctorError } = useAdminData('/admin/doctors')
  const [editing, setEditing] = useState(null)
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false)
  const [form, setForm] = useState({ doctor_profile_id: '', day: 'Senin', start_time: '08:00', end_time: '12:00', is_active: true })

  const openForm = (item = null) => {
    setEditing(item)
    setScheduleModalOpen(true)
    setForm(item ? {
      doctor_profile_id: String(item.doctor_profile_id),
      day: item.day,
      start_time: item.start_time?.slice(0, 5),
      end_time: item.end_time?.slice(0, 5),
      is_active: item.is_active
    } : {
      doctor_profile_id: String(doctors[0]?.id || ''),
      day: 'Senin',
      start_time: '08:00',
      end_time: '12:00',
      is_active: true
    })
  }

  const save = async (event) => {
    event.preventDefault()
    try {
      if (editing) await api.put(`/admin/schedules/${editing.id}`, form)
      else await api.post('/admin/schedules', form)
      setScheduleModalOpen(false)
      setEditing(null)
      toast.success('Jadwal berhasil disimpan.')
      refresh()
    } catch (requestError) {
      toast.error(requestError.response?.data?.message || 'Jadwal gagal disimpan.')
    }
  }

  const remove = async (item) => {
    if (!window.confirm(`Hapus jadwal ${item.day} milik ${item.doctor_profile?.user?.name || 'dokter'}?`)) return
    try {
      await api.delete(`/admin/schedules/${item.id}`)
      toast.success('Jadwal dihapus.')
      refresh()
    } catch (requestError) {
      toast.error(requestError.response?.data?.message || 'Jadwal gagal dihapus.')
    }
  }

  return (
    <section>
      <PageHeading
        eyebrow="JADWAL PRAKTIK"
        title="Jadwal Dokter"
        description="Atur jadwal praktik dokter yang bertugas di Klinik Polinela."
        action={
          <button className="schedule-add-btn" onClick={() => openForm()}>
            <Plus size={17} /> Tambah Jadwal
          </button>
        }
      />
      {(error || doctorError) && <Alert>{error || doctorError}</Alert>}
      <div className="surface-card admin-panel schedule-card-container">
        <div className="schedule-card-header">
          <div>
            <h2 className="schedule-card-title">Daftar Jadwal Praktek</h2>
            <p className="schedule-card-subtitle">Silakan datang sesuai hari dan jam praktek dokter.</p>
          </div>
        </div>
        {loading ? (
          <div className="loading-panel">Memuat jadwal…</div>
        ) : schedules.length ? (
          <div className="schedule-cards-grid">
            {schedules.map((item) => (
              <article key={item.id} className="schedule-item-card">
                <div className="schedule-top-section">
                  <div className="schedule-doctor-info">
                    <div className="schedule-avatar" style={{ background: '#E0F2FE', color: '#0284C7' }}>
                      <Stethoscope size={18} />
                    </div>
                    <div>
                      <span className="schedule-label">DOKTER KLINIK</span>
                      <h3 className="schedule-doctor-name">{item.doctor_profile?.user?.name || 'Dokter'}</h3>
                      <p className="schedule-clinic-type">{item.doctor_profile?.clinic_type || 'Jenis pelayanan'}</p>
                    </div>
                  </div>
                </div>
                <div className="schedule-details-section">
                  <div className="schedule-detail-item">
                    <Calendar size={16} />
                    <span>{item.day || '—'}</span>
                  </div>
                  <div className="schedule-detail-item">
                    <Clock3 size={16} />
                    <span>{item.start_time?.slice(0, 5) || '—'}–{item.end_time?.slice(0, 5) || '—'}</span>
                  </div>
                  <div className={`schedule-status-badge ${item.is_active ? 'status-active' : 'status-inactive'}`}>
                    <i />
                    {item.is_active ? 'Aktif' : 'Nonaktif'}
                  </div>
                </div>
                <div className="schedule-card-actions">
                  <button className="schedule-action-btn edit" onClick={() => openForm(item)}>
                    <Pencil size={16} /> Edit
                  </button>
                  <button className="schedule-action-btn delete" onClick={() => remove(item)} title="Hapus jadwal" aria-label="Hapus jadwal">
                    <Trash2 size={16} />
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-state">Belum ada jadwal terdaftar.</div>
        )}
      </div>

      {scheduleModalOpen && (
        <Modal title={editing?.id ? 'Edit Jadwal' : 'Tambah Jadwal'} onClose={() => setScheduleModalOpen(false)}>
          <form className="admin-form schedule-form" onSubmit={save}>
            <div className="schedule-form-fields">
            <label>
              Dokter
              <select required value={form.doctor_profile_id} onChange={(e) => setForm({ ...form, doctor_profile_id: e.target.value })}>
                <option value="">Pilih dokter</option>
                {doctors.map((doctor) => <option key={doctor.id} value={doctor.id}>{doctor.user?.name}</option>)}
              </select>
            </label>
            <label>
              Hari
              <select value={form.day} onChange={(e) => setForm({ ...form, day: e.target.value })}>
                {['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'].map((day) => <option key={day}>{day}</option>)}
              </select>
            </label>
            <label>
              Mulai
              <input type="time" required value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} />
            </label>
            <label>
              Selesai
              <input type="time" required value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} />
            </label>
            </div>
            <label className="schedule-active-field">
              <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
              Status Jadwal Aktif
            </label>
            <div className="schedule-form-actions">
              <button type="button" className="schedule-cancel-btn" onClick={() => setScheduleModalOpen(false)}>Batal</button>
              <button type="submit" className="schedule-save-btn">Simpan Jadwal</button>
            </div>
          </form>
        </Modal>
      )}
    </section>
  )
}

export function AdminMedicinesPage() {
  const { user } = useAuth()
  const { data: medicines, loading, error, refresh } = useAdminData('/admin/medicines')
  const { data: transactions, loading: loadingTransactions, refresh: refreshTransactions } = useAdminData('/admin/medicine-transactions')
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState('')
  const [selected, setSelected] = useState(null)
  const [category, setCategory] = useState('Semua kategori')
  const [drawerTab, setDrawerTab] = useState('form')
  const emptyForm = { name: '', category: '', form: '', stock: 0, min_stock_alert: 10, description: '', dosage: '', side_effects: '', image_url: '' }
  const [form, setForm] = useState(emptyForm)
  const [stockForm, setStockForm] = useState({ medicine_id: '', type: 'masuk', quantity: 1, notes: '', batch: '', entry_date: '', exp_date: '' })
  const selectedAdd = medicines.find(m => String(m.id) === stockForm.medicine_id)

  const categories = ['Semua kategori', ...new Set(medicines.map((item) => item.category).filter(Boolean))]
  const shown = medicines.filter((item) => {
    const matchesCategory = category === 'Semua kategori' || item.category === category
    const text = `${item.name} ${item.category} ${item.form} ${item.id} RAK-${item.id}`.toLowerCase()
    return matchesCategory && text.includes(search.toLowerCase())
  })

  const exportCsv = () => {
    const headers = ['Kode Obat', 'Nama Obat', 'Kategori', 'Sediaan', 'Stok', 'Batas Min', 'Status']
    const csvContent = [
      headers.join(','),
      ...shown.map(m => [
        `"OBT-${String(m.id).padStart(4, '0')}"`,
        `"${m.name}"`,
        `"${m.category}"`,
        `"${m.form}"`,
        m.stock,
        m.min_stock_alert,
        Number(m.stock) === 0 ? 'Habis' : Number(m.stock) <= Number(m.min_stock_alert) ? 'Menipis' : 'Tersedia'
      ].join(','))
    ].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `Rekap_Obat_${new Date().toISOString().slice(0, 10)}.xlsx`
    link.click()
  }

  const openMedicine = (item = null) => {
    setSelected(item)
    setForm(item ? { ...emptyForm, ...item } : emptyForm)
    setStockForm({ medicine_id: item ? String(item.id) : '', type: 'masuk', quantity: 1, notes: '', batch: '', entry_date: '', exp_date: '' })
    setModal('medicine')
  }

  const openAddStock = () => {
    setDrawerTab('form')
    setStockForm({
      medicine_id: medicines[0] ? String(medicines[0].id) : '',
      type: 'masuk',
      quantity: 1,
      notes: '',
      batch: '',
      entry_date: new Date().toISOString().slice(0, 10),
      exp_date: ''
    })
    setModal('add_stock')
  }

  const saveMedicine = async (event) => {
    event.preventDefault()
    try {
      if (selected) {
        await api.put(`/admin/medicines/${selected.id}`, form)
        if (stockForm.quantity > 0) {
          await api.post('/admin/medicine-transactions', {
            medicine_id: selected.id,
            type: stockForm.type,
            quantity: Number(stockForm.quantity),
            notes: `Penyesuaian stok (${stockForm.type}) melalui Edit Informasi Obat.`
          })
        }
      } else {
        await api.post('/admin/medicines', form)
      }
      setModal('')
      toast.success('Informasi obat berhasil disimpan.')
      refresh()
      refreshTransactions()
    } catch (requestError) {
      toast.error(requestError.response?.data?.message || 'Data obat gagal disimpan.')
    }
  }

  const saveStock = async (event) => {
    if (event) event.preventDefault()
    if (!stockForm.medicine_id) {
      toast.error('Pilih obat terlebih dahulu.')
      return
    }
    if (!stockForm.quantity || stockForm.quantity < 1) {
      toast.error('Jumlah masuk minimal 1.')
      return
    }
    if (!stockForm.batch) {
      toast.error('Nomor batch wajib diisi.')
      return
    }
    try {
      const payload = {
        medicine_id: Number(stockForm.medicine_id),
        type: 'masuk',
        quantity: Number(stockForm.quantity),
        notes: `Batch: ${stockForm.batch} | EXP: ${stockForm.exp_date || '-'} | Ket: ${stockForm.notes || 'Pengadaan stok fisik'}`,
      }
      await api.post('/admin/medicine-transactions', payload)
      setModal('')
      setStockForm({ medicine_id: '', type: 'masuk', quantity: 1, notes: '', batch: '', entry_date: '', exp_date: '' })
      toast.success('Penambahan stok berhasil dicatat.')
      refresh()
      refreshTransactions()
    } catch (requestError) {
      toast.error(requestError.response?.data?.message || 'Penambahan stok gagal dicatat.')
    }
  }

  return (
    <section>
      <PageHeading
        eyebrow="MANAJEMEN FARMASI"
        title="Manajemen Obat & Resep"
        description="Kelola persediaan obat, penyesuaian stok fisik secara atomik, dan verifikasi rekomendasi resep dokter poliklinik."
        action={
          <button className="btn-download" onClick={exportCsv}>
            <Download size={16} /> Download Rekap Harian (XLSX)
          </button>
        }
      />
      <div style={{ borderBottom: '1px solid #E2E8F0', marginBottom: '24px', paddingBottom: '20px' }}></div>
      {error && <Alert>{error}</Alert>}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '14px', marginBottom: '20px', borderBottom: '1px solid #E2E8F0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, fontSize: '15px', color: '#1e293b', borderBottom: '2px solid #0071CE', paddingBottom: '12px', marginBottom: '-14px' }}>
          <Pill size={20} /> Stok Obat 
          <span style={{ padding: '3px 10px', borderRadius: '12px', background: '#e2e8f0', fontSize: '12px', fontWeight: 600 }}>{medicines.length}</span>
        </div>
        <button className="btn-primary" onClick={openAddStock}>
          <PlusCircle size={17} /> Tambah Obat
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={17} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
          <input 
            style={{ width: '100%', height: '44px', paddingLeft: '40px', paddingRight: '16px', fontSize: '14px', background: '#fff', border: '1px solid #E2E8F0', borderRadius: '8px', outline: 'none' }} 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            placeholder="Cari nama, kode obat, batch, lokasi rak..." 
          />
        </div>
        <div style={{ position: 'relative' }}>
          <select 
            style={{ height: '44px', padding: '0 36px 0 16px', fontSize: '14px', background: '#fff', border: '1px solid #E2E8F0', borderRadius: '8px', outline: 'none', appearance: 'none', cursor: 'pointer', minWidth: '180px' }} 
            value={category} 
            onChange={(e) => setCategory(e.target.value)}
          >
            {categories.map((item) => <option key={item}>{item}</option>)}
          </select>
          <ChevronDown size={16} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
        </div>
      </div>

      {loading ? (
        <div className="loading-panel">Memuat obat…</div>
      ) : (
        <div className="admin-medicine-grid">
          {shown.map((item) => {
            const isLow = Number(item.stock) <= Number(item.min_stock_alert)
            const isOut = Number(item.stock) === 0
            const kodeObat = `OBT-${String(item.id).padStart(4, '0')}`
            const lokasiRak = `RAK-${String(item.id % 12 || 1).padStart(2, '0')}`
            return (
              <article className="admin-medicine-card" key={item.id}>
                <div className="medicine-card-image">
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.name} />
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                      <Pill size={36} />
                      <span style={{ fontSize: '11px', color: '#94a3b8' }}>Foto Sediaan</span>
                    </div>
                  )}
                  <div className={`medicine-card-badge ${isOut ? 'badge-empty' : isLow ? 'badge-low' : 'badge-available'}`}>
                    {isOut ? 'HABIS' : isLow ? 'MENIPIS' : 'TERSEDIA'}
                  </div>
                </div>
                <div className="medicine-card-content">
                  <div className="medicine-card-meta">
                    <span className="medicine-code">Rak {lokasiRak} • KODE: <strong>{kodeObat}</strong></span>
                    <span className="medicine-category-tag">{String(item.category || 'OBAT').toUpperCase()}</span>
                  </div>
                  <h3 className="medicine-name">{item.name}</h3>
                  <p className="medicine-desc">{item.form} {item.dosage ? `(${item.dosage})` : `(${item.form})`}</p>
                  
                  <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: '8px', marginTop: '12px', border: '1px solid #edf2f7' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ fontSize: '12px', color: '#64748b' }}>Stok Tersedia:</span>
                      <strong style={{ fontSize: '13px', color: '#1e293b' }}>{item.stock} {item.form}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: '#64748b' }}>
                      <span>Batas Min: {item.min_stock_alert} {item.form}</span>
                      <span>EXP: {item.updated_at ? new Date(item.updated_at).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' }) : 'Des 2026'}</span>
                    </div>
                  </div>
                </div>
                <div className="medicine-card-footer">
                  <button className="btn-edit-card" onClick={() => openMedicine(item)}>
                    <Edit size={14} /> Edit
                  </button>
                </div>
              </article>
            )
          })}
          {!shown.length && <div className="empty-state" style={{ gridColumn: '1 / -1' }}>Tidak ada obat ditemukan.</div>}
        </div>
      )}

      {/* MODAL EDIT INFORMASI OBAT */}
      {modal === 'medicine' && (
        <Modal title="" onClose={() => setModal('')}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '16px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#e0f2fe', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Pill size={20} />
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: '17px', fontWeight: 700 }}>Edit Informasi Obat</h2>
                <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>Perbarui pengaturan stok fisik, foto sediaan, dan deskripsi obat.</p>
              </div>
            </div>
            <button className="btn-close" onClick={() => setModal('')} aria-label="Tutup"><X size={20} /></button>
          </div>

          <div style={{ marginBottom: '16px', padding: '14px', background: '#f8fafc', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #e2e8f0' }}>
            <div>
              <small style={{ color: '#94a3b8', fontSize: '10px', fontWeight: 700, letterSpacing: '0.5px' }}>SEDIAAN OBAT</small>
              <div style={{ fontSize: '15px', fontWeight: 700, color: '#1e293b' }}>{selected?.name}</div>
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <span className="medicine-code" style={{ padding: '4px 8px', background: '#fff', borderRadius: '6px', border: '1px solid #e2e8f0', fontWeight: 700 }}>OBT-{String(selected?.id).padStart(4, '0')}</span>
              <span className="medicine-category-tag">{selected?.form} ({selected?.category})</span>
            </div>
          </div>

          <form className="admin-form" onSubmit={saveMedicine}>
            {/* SECTION 1: PENGATURAN STOK */}
            <div className="form-section-title" style={{ marginTop: '12px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><PackagePlus size={15} /> 1. PENGATURAN STOK</span>
              <span style={{ color: '#1e293b', background: '#e2e8f0', padding: '3px 8px', borderRadius: '6px' }}>Stok Saat Ini: {selected?.stock} {selected?.form}</span>
            </div>
            
            <label style={{ fontSize: '12px', color: '#475569', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Pilih Aksi Penyesuaian Stok:</label>
            <div className="adjustment-toggle" style={{ marginBottom: '12px' }}>
              <button type="button" className={`adjustment-btn ${stockForm.type === 'masuk' ? 'active' : ''}`} onClick={() => setStockForm({...stockForm, type: 'masuk'})}>Tambah Stok (+)</button>
              <button type="button" className={`adjustment-btn ${stockForm.type === 'keluar' ? 'active' : ''}`} onClick={() => setStockForm({...stockForm, type: 'keluar'})}>Kurang Stok (-)</button>
            </div>

            <label style={{ fontSize: '12px', color: '#475569', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
              {stockForm.type === 'masuk' ? 'Jumlah Tambah Stok:' : 'Jumlah Kurang Stok:'}
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <button type="button" onClick={() => setStockForm({...stockForm, quantity: Math.max(0, stockForm.quantity - 1)})} style={{ width: '40px', height: '40px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', fontSize: '18px', cursor: 'pointer' }}>-</button>
              <input
                type="number"
                min="0"
                max={stockForm.type === 'keluar' ? (selected?.stock || 0) : undefined}
                value={stockForm.quantity}
                onChange={(e) => {
                  const val = Math.max(0, Number(e.target.value))
                  if (stockForm.type === 'keluar' && val > (selected?.stock || 0)) {
                    toast.error('Pengurangan tidak boleh melebihi stok yang ada.')
                    return
                  }
                  setStockForm({...stockForm, quantity: val})
                }}
                style={{ flex: 1, textAlign: 'center', height: '40px', borderRadius: '8px', border: '1px solid #cbd5e1', fontWeight: 700 }}
              />
              <button type="button" onClick={() => {
                if (stockForm.type === 'keluar' && stockForm.quantity >= (selected?.stock || 0)) {
                  toast.error('Pengurangan tidak boleh melebihi stok yang ada.')
                  return
                }
                setStockForm({...stockForm, quantity: stockForm.quantity + 1})
              }} style={{ width: '40px', height: '40px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', fontSize: '18px', cursor: 'pointer' }}>+</button>
              <span style={{ fontWeight: 600, color: '#475569', padding: '0 8px' }}>{selected?.form}</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#64748b', marginBottom: '18px' }}>
              <ShieldCheck size={14} style={{ color: '#059669' }} />
              <span>Mutasi stok dicatat otomatis dalam riwayat logistik oleh <strong>{user?.name || 'Petugas Farmasi'}</strong>.</span>
            </div>

            {/* SECTION 2: FOTO OBAT */}
            <div className="form-section-title">
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Camera size={15} /> 2. FOTO OBAT</span>
            </div>
            <div className="image-upload-wrapper" style={{ marginBottom: '18px', background: '#f8fafc', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                <div className="image-preview-sm">
                  {form.image_url ? <img src={form.image_url} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Pill size={24} />}
                </div>
                <span style={{ fontSize: '9px', fontWeight: 700, color: '#059669', background: '#ecfdf5', padding: '2px 6px', borderRadius: '4px' }}>Foto Aktif</span>
              </div>
              <div className="image-upload-info" style={{ flex: 1 }}>
                <label className="btn-image" style={{ cursor: 'pointer' }}>
                  <Upload size={14} /> Ganti Foto
                  <input type="file" accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }} onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      if (file.size > 2 * 1024 * 1024) {
                        toast.error('Ukuran file maksimal 2MB.')
                        return
                      }
                      const reader = new FileReader()
                      reader.onload = (ev) => setForm({ ...form, image_url: ev.target?.result })
                      reader.readAsDataURL(file)
                    }
                  }} />
                </label>
                <p>Format JPG, PNG, atau WEBP (Maks. 2MB)</p>
              </div>
            </div>

            {/* SECTION 3: DESKRIPSI OBAT */}
            <div className="form-section-title">
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><FileText size={15} /> 3. DESKRIPSI OBAT</span>
              <span style={{ fontSize: '11px', color: '#94a3b8' }}>{(form.description || '').length} karakter</span>
            </div>
            <textarea
              style={{ width: '100%', minHeight: '80px', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', lineHeight: 1.5 }}
              value={form.description || ''}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Deskripsi obat dan kegunaan sediaan..."
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#64748b', marginTop: '6px', marginBottom: '20px' }}>
              <Info size={14} />
              <span>Deskripsi ini membantu tenaga farmasi & pasien memahami indikasi sediaan.</span>
            </div>

            <div className="footer-actions" style={{ marginBottom: '8px' }}>
              <button type="button" className="btn-secondary" onClick={() => setModal('')}>Batal</button>
              <button type="submit" className="btn-primary"><Check size={16} /> Simpan Perubahan</button>
            </div>
            <p style={{ margin: 0, textAlign: 'center', fontSize: '10px', color: '#94a3b8' }}>
              Perubahan stok, foto, dan deskripsi disimpan secara atomik ke database serta mencatat riwayat mutasi stok.
            </p>
          </form>
        </Modal>
      )}

      {/* SLIDE-OVER DRAWER TAMBAH STOK OBAT */}
      {modal === 'add_stock' && (
        <SlideOver 
          title="Tambah Stok Obat" 
          sub="Pencatatan penambahan stok fisik obat yang telah terdaftar"
          onClose={() => setModal('')}
          footer={
            drawerTab === 'form' ? (
              <div className="footer-actions" style={{ width: '100%' }}>
                <button type="button" className="btn-secondary" onClick={() => setModal('')}>Batal</button>
                <button type="button" className="btn-primary" onClick={saveStock}>
                  <CheckCircle2 size={16} /> Simpan Penambahan Stok
                </button>
              </div>
            ) : (
              <button type="button" className="btn-secondary" onClick={() => setModal('')}>Tutup</button>
            )
          }
        >
          {/* TAB NAVIGASI DRAWER */}
          <div className="slide-over-tabs">
            <button className={`slide-over-tab ${drawerTab === 'form' ? 'active' : ''}`} onClick={() => setDrawerTab('form')}>
              Form Tambah Stok
            </button>
            <button className={`slide-over-tab ${drawerTab === 'history' ? 'active' : ''}`} onClick={() => setDrawerTab('history')} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <History size={15} /> Lihat Riwayat Stok Masuk
            </button>
          </div>

          {drawerTab === 'form' ? (
            <div>
              {/* CARD RINGKASAN OBAT TERPILIH */}
              <label style={{ display: 'block', marginBottom: '16px' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '6px' }}>Pilih Obat Terdaftar</span>
                <select style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} value={stockForm.medicine_id} onChange={(e) => setStockForm({ ...stockForm, medicine_id: e.target.value })}>
                  <option value="">-- Pilih Obat --</option>
                  {medicines.map((m) => <option key={m.id} value={m.id}>{m.name} (OBT-{String(m.id).padStart(4, '0')} • {m.category})</option>)}
                </select>
              </label>

              {selectedAdd && (
                <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                    <div>
                      <strong style={{ fontSize: '14px', color: '#1e293b' }}>{selectedAdd.name}</strong>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>OBT-{String(selectedAdd.id).padStart(4, '0')} • {selectedAdd.category}</div>
                    </div>
                    <span style={{ fontSize: '11px', background: '#fff', border: '1px solid #e2e8f0', padding: '2px 8px', borderRadius: '6px', color: '#475569' }}>
                      Satuan Dasar: <strong>{selectedAdd.form}</strong>
                    </span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', paddingTop: '10px', borderTop: '1px solid #edf2f7' }}>
                    <div>
                      <small style={{ color: '#94a3b8', fontSize: '11px' }}>Stok Saat Ini</small>
                      <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '13px' }}>{selectedAdd.stock} {selectedAdd.form}</div>
                    </div>
                    <div>
                      <small style={{ color: '#94a3b8', fontSize: '11px' }}>Batas Minimum</small>
                      <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '13px' }}>{selectedAdd.min_stock_alert} {selectedAdd.form}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* FIELD INPUT FORM */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>Jumlah Masuk <span style={{ color: '#ef4444' }}>*</span></span>
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>Min. 1 {selectedAdd?.form || 'Satuan'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
                <button type="button" onClick={() => setStockForm({...stockForm, quantity: Math.max(1, stockForm.quantity - 1)})} style={{ width: '40px', height: '40px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', fontSize: '18px', cursor: 'pointer' }}>-</button>
                <input type="number" min="1" value={stockForm.quantity} onChange={(e) => setStockForm({...stockForm, quantity: Math.max(1, Number(e.target.value))})} style={{ flex: 1, textAlign: 'center', height: '40px', borderRadius: '8px', border: '1px solid #cbd5e1', fontWeight: 700 }} />
                <button type="button" onClick={() => setStockForm({...stockForm, quantity: stockForm.quantity + 1})} style={{ width: '40px', height: '40px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', fontSize: '18px', cursor: 'pointer' }}>+</button>
                <span style={{ fontWeight: 600, color: '#475569', background: '#f1f5f9', padding: '10px 14px', borderRadius: '8px' }}>{selectedAdd?.form || 'Satuan'}</span>
              </div>

              <label style={{ display: 'block', marginBottom: '18px' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '6px' }}>Nomor Batch <span style={{ color: '#ef4444' }}>*</span></span>
                <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '0 10px', background: '#fff' }}>
                  <QrCode size={16} style={{ color: '#94a3b8', marginRight: '8px' }} />
                  <input placeholder="Contoh: BATCH-202611-MTF" style={{ width: '100%', padding: '10px 0', border: 'none', outline: 'none' }} value={stockForm.batch} onChange={(e) => setStockForm({...stockForm, batch: e.target.value})} />
                </div>
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '18px' }}>
                <label>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#334155', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px' }}>
                    <Calendar size={13} /> Tanggal Masuk <span style={{ color: '#ef4444' }}>*</span>
                  </span>
                  <input type="date" style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid #cbd5e1' }} value={stockForm.entry_date} onChange={(e) => setStockForm({...stockForm, entry_date: e.target.value})} />
                </label>
                <label>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#334155', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px' }}>
                    <Calendar size={13} /> Tanggal EXP <span style={{ color: '#ef4444' }}>*</span>
                  </span>
                  <input type="date" style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid #cbd5e1' }} value={stockForm.exp_date} onChange={(e) => setStockForm({...stockForm, exp_date: e.target.value})} />
                </label>
              </div>

              <label style={{ display: 'block', marginBottom: '18px' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '6px' }}>Catatan (Opsional)</span>
                <textarea placeholder="Contoh: Pengadaan rutin poliklinik..." style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', minHeight: '60px' }} value={stockForm.notes} onChange={(e) => setStockForm({ ...stockForm, notes: e.target.value })} />
              </label>

              {/* CARD FOTO OBAT */}
              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>FOTO OBAT</span>
                <div className="image-upload-wrapper">
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                    <div className="image-preview-sm">
                      {selectedAdd?.image_url ? <img src={selectedAdd.image_url} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Pill size={24} />}
                    </div>
                    {selectedAdd?.image_url && <span style={{ fontSize: '9px', fontWeight: 700, color: '#059669', background: '#ecfdf5', padding: '2px 6px', borderRadius: '4px' }}>Foto Aktif</span>}
                  </div>
                  <div className="image-upload-info" style={{ flex: 1 }}>
                    <label className="btn-image" style={{ cursor: 'pointer' }}>
                      <Upload size={14} /> {selectedAdd?.image_url ? 'Ganti Foto' : 'Unggah Foto'}
                      <input type="file" accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }} onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file && file.size > 2 * 1024 * 1024) toast.error('Ukuran file maksimal 2MB.')
                      }} />
                    </label>
                    <p>Format JPG, PNG, atau WEBP (Maks. 2MB)</p>
                  </div>
                </div>
              </div>

              {/* BOX KALKULASI STOK OTOMATIS */}
              {selectedAdd && (
                <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '10px', padding: '14px', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#0369a1', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <PackagePlus size={15} /> Kalkulasi Stok Otomatis
                    </span>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#059669', background: '#ecfdf5', padding: '2px 8px', borderRadius: '12px' }}>
                      • Tersedia
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#0c4a6e' }}>
                      {selectedAdd.stock} {selectedAdd.form} + {stockForm.quantity} {selectedAdd.form} = {Number(selectedAdd.stock) + Number(stockForm.quantity)} {selectedAdd.form}
                    </span>
                    <span style={{ fontSize: '11px', color: '#0284c7' }}>Batas Min: {selectedAdd.min_stock_alert}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#0369a1', paddingTop: '8px', borderTop: '1px solid #e0f2fe' }}>
                    <CheckCircle2 size={14} style={{ color: '#0284c7' }} />
                    <span>Stok berada di atas batas aman minimum ({selectedAdd.min_stock_alert} {selectedAdd.form})</span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div>
              <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '12px' }}>Riwayat Stok Masuk Terkini</h3>
              {loadingTransactions ? (
                <div className="loading-panel">Memuat riwayat transaksi...</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {transactions?.filter(tx => tx.type === 'masuk').slice(0, 10).map((tx) => (
                    <div key={tx.id} style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, marginBottom: '4px' }}>
                        <span>{tx.medicine?.name || 'Obat'}</span>
                        <span style={{ color: '#059669' }}>+{tx.quantity}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', fontSize: '11px' }}>
                        <span>{new Date(tx.created_at).toLocaleString('id-ID')}</span>
                        <span>Stok: {tx.stock_before} → {tx.stock_after}</span>
                      </div>
                      {tx.notes && <div style={{ color: '#94a3b8', fontSize: '10px', marginTop: '4px' }}>{tx.notes}</div>}
                    </div>
                  ))}
                  {(!transactions || !transactions.filter(tx => tx.type === 'masuk').length) && (
                    <div className="empty-state">Belum ada riwayat stok masuk.</div>
                  )}
                </div>
              )}
            </div>
          )}
        </SlideOver>
      )}

    </section>
  )
}

export function AdminNotificationsPage() {
  const { data: notifications, loading, error, refresh } = useAdminData('/admin/notifications')
  const { data: users } = useAdminData('/admin/dashboard/stats', {})
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('Semua')
  const [period, setPeriod] = useState('Semua')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ category: 'Informasi Klinik', title: '', message: '', target_role: 'all' })

  const totalUsers = (users?.stats?.total_patients || 0) + (users?.stats?.active_doctors || 0)

  const filtered = notifications.filter((item) => {
    const matchCategory = category === 'Semua' || item.category === category
    const matchSearch = `${item.title} ${item.message}`.toLowerCase().includes(search.toLowerCase())
    return matchCategory && matchSearch
  })

  const resetForm = () => {
    setForm({ category: 'Informasi Klinik', title: '', message: '', target_role: 'all' })
  }

  const publish = async (event) => {
    event.preventDefault()
    if (!form.category || !form.title.trim() || !form.message.trim() || !form.target_role) {
      toast.error('Semua field wajib harus diisi.')
      return
    }
    try {
      await api.post('/admin/notifications', form)
      resetForm()
      setShowForm(false)
      toast.success('Notifikasi berhasil dikirim kepada target.')
      refresh()
    } catch (requestError) {
      toast.error(requestError.response?.data?.message || 'Notifikasi gagal dikirim.')
    }
  }

  return (
    <section>
      <PageHeading
        eyebrow="INFORMASI PENGGUNA"
        title="Kelola Notifikasi Pengguna"
        description="Kelola pengumuman klinik, perubahan jadwal dokter, dan siaran darurat untuk mahasiswa, dosen, serta staf kampus Politeknik Negeri Lampung."
        action={
          <button 
            className="primary-button admin-action" 
            onClick={() => setShowForm(!showForm)} 
            style={{ height: '40px', padding: '0 20px', borderRadius: '10px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px', border: 'none', background: '#0060a9', color: '#fff', fontSize: '14px', fontWeight: 600, cursor: 'pointer', boxShadow: '0 2px 6px rgba(0,0,0,0.12)' }}
          >
            <Plus size={16} /> Buat Notifikasi Baru
          </button>
        }
      />
      {error && <Alert>{error}</Alert>}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {showForm && (
          <div className="lg:col-span-5">
            <div className="surface-card">
              <div className="surface-heading" style={{ paddingBottom: '16px' }}>
                <div>
                  <span className="eyebrow" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', color: '#10b981' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} />
                    BUAT NOTIFIKASI BARU
                  </span>
                  <h2 style={{ fontSize: '17px', marginTop: '6px' }}>Buat Notifikasi Baru</h2>
                  <p style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Kirim pemberitahuan resmi klinik kepada target pengguna tertentu.</p>
                </div>
              </div>

              <form onSubmit={publish} style={{ padding: '16px', borderTop: '1px solid #e2e8f0' }}>
                <label style={{ display: 'block', marginBottom: '14px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '8px' }}>KATEGORI NOTIFIKASI *</span>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {['Jadwal Dokter Berubah', 'Informasi Klinik', 'Pengumuman'].map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setForm({ ...form, category: cat })}
                        style={{ padding: '6px 12px', fontSize: '11px', fontWeight: 600, borderRadius: '16px', border: form.category === cat ? '1.5px solid #0060a9' : '1px solid #cbd5e1', background: form.category === cat ? '#e0f2fe' : '#fff', color: form.category === cat ? '#0060a9' : '#64748b', cursor: 'pointer' }}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </label>

                <label style={{ display: 'block', marginBottom: '14px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '8px' }}>JUDUL NOTIFIKASI *</span>
                  <input
                    required
                    maxLength={150}
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="Contoh: Perubahan Jam Pelayanan Klinik"
                    style={{ width: '100%', height: '40px', padding: '0 14px', fontSize: '14px', border: '1px solid #E2E8F0', borderRadius: '10px', background: '#F8FAFC' }}
                  />
                </label>

                <label style={{ display: 'block', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>ISI PESAN NOTIFIKASI *</span>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>{form.message.length} / 500</span>
                  </div>
                  <textarea
                    required
                    maxLength={500}
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    placeholder="Tuliskan isi pesan..."
                    style={{ width: '100%', padding: '10px', fontSize: '14px', border: '1px solid #E2E8F0', borderRadius: '10px', background: '#F8FAFC', minHeight: '100px' }}
                  />
                </label>

                <label style={{ display: 'block' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>TARGET PENERIMA *</span>
                  <select
                    value={form.target_role}
                    onChange={(e) => setForm({ ...form, target_role: e.target.value })}
                    style={{ width: '100%', height: '40px', padding: '0 14px', fontSize: '14px', border: '1px solid #E2E8F0', borderRadius: '10px', background: '#F8FAFC' }}
                  >
                    <option value="all">Semua Pengguna</option>
                    <option value="patient">Pasien</option>
                    <option value="doctor">Dokter</option>
                  </select>
                </label>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
                  <button type="button" onClick={resetForm} style={{ height: '40px', padding: '0 20px', borderRadius: '10px', border: 'none', background: '#F1F5F9', color: '#334155', fontSize: '14px', fontWeight: 500, cursor: 'pointer' }}>Reset Form</button>
                  <button type="submit" style={{ height: '40px', padding: '0 22px', borderRadius: '10px', border: 'none', background: '#0060a9', color: '#fff', fontSize: '14px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}><Send size={16} /> Kirim Notifikasi</button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className={showForm ? 'lg:col-span-7' : 'lg:col-span-12'}>
          <div className="surface-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', borderBottom: '1px solid #e2e8f0', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
                <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari judul, kategori, atau isi pesan..."
                  style={{ width: '100%', height: '40px', padding: '0 14px 0 40px', borderRadius: '10px', border: '1px solid #E2E8F0', background: '#F8FAFC', fontSize: '14px', outline: 'none' }}
                />
              </div>
              <select value={category} onChange={(e) => setCategory(e.target.value)} style={{ height: '40px', padding: '0 34px 0 14px', borderRadius: '10px', border: '1px solid #E2E8F0', background: '#fff', fontSize: '14px', cursor: 'pointer' }}>
                <option>Semua Kategori</option>
                <option>Jadwal Dokter Berubah</option>
                <option>Informasi Klinik</option>
                <option>Pengumuman</option>
              </select>
              <select value={period} onChange={(e) => setPeriod(e.target.value)} style={{ height: '40px', padding: '0 34px 0 14px', borderRadius: '10px', border: '1px solid #E2E8F0', background: '#fff', fontSize: '14px', cursor: 'pointer' }}>
                <option>Semua Periode</option>
                <option>Hari Ini</option>
              </select>
              <button onClick={refresh} style={{ width: '40px', height: '40px', borderRadius: '10px', border: '1px solid #E2E8F0', background: '#fff', color: '#475569', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              </button>
            </div>

            {loading ? (
              <div className="loading-panel">Memuat notifikasi…</div>
            ) : (
              <div style={{ padding: '16px' }}>
                {filtered.map((item) => (
                  <article key={item.id} style={{ marginBottom: '12px', padding: '14px', border: '1px solid #e2e8f0', borderRadius: '8px', background: '#fff' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                      <span style={{ padding: '4px 8px', fontSize: '10px', fontWeight: 600, borderRadius: '12px', background: '#dbeafe', color: '#1e40af', textTransform: 'uppercase' }}>{item.category || 'Informasi'}</span>
                      <time style={{ fontSize: '11px', color: '#64748b', marginLeft: 'auto' }}>{new Date(item.created_at).toLocaleString('id-ID')}</time>
                    </div>
                    <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>{item.title}</h3>
                    <p style={{ fontSize: '12px', color: '#475569' }}>{item.message}</p>
                  </article>
                ))}
                {!filtered.length && <div className="empty-state">Belum ada notifikasi.</div>}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
