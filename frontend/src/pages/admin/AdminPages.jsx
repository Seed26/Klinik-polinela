import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Activity, Bell, CalendarDays, Check, CheckCircle2, ChevronLeft, ChevronRight, ClipboardList, Clock3, PackagePlus, Pill, Plus, RefreshCw, Search, Trash2, Users, Volume2, X } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../services/api'
import './admin.css'

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
        <header>
          <h2>{title}</h2>
          <button className="icon-button" onClick={onClose} aria-label="Tutup"><X size={19} /></button>
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
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [status, setStatus] = useState('Semua')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [callingId, setCallingId] = useState(null)

  const { data, loading, error, refresh } = useAdminData('/admin/queues', [])

  useEffect(() => {
    refresh({ date })
  }, [date, refresh])

  const allRows = Array.isArray(data) ? data : []
  const rows = allRows.filter((row) => {
    const matchStatus = status === 'Semua' || row.status === status
    const matchSearch = !search ||
      `${row.queue_number} ${row.patient_profile?.user?.name || ''} ${row.doctor_profile?.user?.name || ''} ${row.patient_profile?.identifier_number || ''}`
        .toLowerCase()
        .includes(search.toLowerCase())
    return matchStatus && matchSearch
  })

  const pageCount = Math.max(1, Math.ceil(rows.length / 8))
  const pageRows = rows.slice((page - 1) * 8, page * 8)

  // Ubah status antrean
  const changeStatus = async (row, nextStatus) => {
    try {
      await api.patch(`/admin/queues/${row.id}/status`, { status: nextStatus })
      toast.success(`Status antrean ${row.queue_number} diubah menjadi "${nextStatus}".`)
      refresh({ date })
    } catch (requestError) {
      toast.error(requestError.response?.data?.message || 'Status antrean gagal diperbarui.')
    }
  }

  // Panggil antrean pasien dengan suara TTS
  const handleCallPatient = async (row) => {
    setCallingId(row.id)
    try {
      await api.post(`/admin/queues/${row.id}/call`)
      const patientName = row.patient_profile?.user?.name || 'Pasien'

      // Panggilan suara Text-to-Speech browser
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel() // hentikan panggilan sebelumnya
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

  const waitingCount = allRows.filter((r) => r.status === 'Menunggu').length
  const processingCount = allRows.filter((r) => r.status === 'Diperiksa').length
  const completedCount = allRows.filter((r) => r.status === 'Selesai').length

  return (
    <section>
      <PageHeading
        eyebrow="PELAYANAN PASIEN"
        title="Manajemen Antrean"
        description="Konfirmasi kedatangan pasien, panggil antrean, dan pantau status antrean aktif harian."
      />

      {error && <Alert>{error}</Alert>}

      {/* METRIK ANTREAN LENGKAP */}
      <div className="metrics-grid admin-metrics admin-metrics-compact">
        <StatTile icon={ClipboardList} label="Total Antrean Hari Ini" value={allRows.length} />
        <StatTile icon={Clock3} label="Menunggu Panggilan" value={waitingCount} tone="amber" />
        <StatTile icon={Activity} label="Sedang Diperiksa" value={processingCount} tone="mint" />
        <StatTile icon={Check} label="Pemeriksaan Selesai" value={completedCount} tone="violet" />
      </div>

      <div className="surface-card admin-panel">
        <div className="admin-toolbar" style={{ flexWrap: 'wrap', gap: '12px' }}>
          <div className="admin-tabs">
            {['Semua', 'Menunggu', 'Diperiksa', 'Selesai', 'Dibatalkan'].map((st) => (
              <button
                key={st}
                className={status === st ? 'active' : ''}
                onClick={() => { setStatus(st); setPage(1) }}
              >
                {st === 'Semua' ? 'Semua Status' : st}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}>
            <label className="admin-date-filter" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              Tanggal:
              <input
                type="date"
                value={date}
                onChange={(event) => { setDate(event.target.value); setPage(1) }}
              />
            </label>
            <button
              type="button"
              onClick={() => { setDate(new Date().toISOString().slice(0, 10)); setPage(1) }}
              style={{
                padding: '6px 10px',
                fontSize: '11px',
                background: '#f1f5f9',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              Hari Ini
            </button>
          </div>
        </div>

        <div className="admin-search" style={{ marginTop: '12px', marginBottom: '16px' }}>
          <Search size={17} />
          <input
            value={search}
            onChange={(event) => { setSearch(event.target.value); setPage(1) }}
            placeholder="Cari nomor antrean, nama pasien, identitas, atau nama dokter…"
          />
        </div>

        {loading ? (
          <div className="loading-panel">Memuat data antrean…</div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>No. Antrean</th>
                  <th>Pasien</th>
                  <th>Dokter & Poli</th>
                  <th>Waktu</th>
                  <th>Status</th>
                  <th>Tindakan / Aksi</th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <strong style={{ fontSize: '13px', color: '#0060a9' }}>{row.queue_number}</strong>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{row.patient_profile?.user?.name || 'Pasien'}</div>
                      <small style={{ color: '#64748b' }}>{row.patient_profile?.identifier_number || row.patient_profile?.user?.email || '—'}</small>
                    </td>
                    <td>
                      <div>{row.doctor_profile?.user?.name || 'Dokter'}</div>
                      <small style={{ color: '#0284c7' }}>{row.doctor_profile?.clinic_type || 'Poli Umum'}</small>
                    </td>
                    <td>
                      <div>{row.visit_date}</div>
                      <small style={{ color: '#64748b' }}>{row.estimated_time || '—'}</small>
                    </td>
                    <td>
                      <span className={`status-pill status-${row.status === 'Selesai' ? 'done' : row.status === 'Diperiksa' ? 'process' : row.status === 'Dibatalkan' ? 'danger' : 'waiting'}`}>
                        {row.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        {/* Tombol Panggil Pasien */}
                        <button
                          type="button"
                          className="admin-icon-action"
                          onClick={() => handleCallPatient(row)}
                          disabled={callingId === row.id}
                          title="Panggil Antrean (Suara)"
                          style={{
                            background: '#0284c7',
                            color: '#fff',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '4px 8px',
                            borderRadius: '5px'
                          }}
                        >
                          <Volume2 size={14} /> Panggil
                        </button>

                        {/* Tombol Konfirmasi Cepat */}
                        {row.status === 'Menunggu' && (
                          <button
                            type="button"
                            className="admin-icon-action"
                            onClick={() => changeStatus(row, 'Diperiksa')}
                            title="Konfirmasi Masuk Ruangan"
                            style={{
                              background: '#10b981',
                              color: '#fff',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '4px 8px',
                              borderRadius: '5px'
                            }}
                          >
                            <CheckCircle2 size={14} /> Konfirmasi
                          </button>
                        )}

                        {/* Dropdown Ubah Status */}
                        <select
                          value={row.status}
                          onChange={(e) => changeStatus(row, e.target.value)}
                          style={{
                            padding: '4px 6px',
                            borderRadius: '5px',
                            border: '1px solid #cbd5e1',
                            fontSize: '11px',
                            background: '#fff'
                          }}
                        >
                          <option value="Menunggu">Menunggu</option>
                          <option value="Diperiksa">Diperiksa</option>
                          <option value="Selesai">Selesai</option>
                          <option value="Dibatalkan">Dibatalkan</option>
                        </select>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!rows.length && (
              <div className="empty-state">
                Tidak ada data antrean pada tanggal atau filter ini.
              </div>
            )}
          </div>
        )}

        <Pagination page={page} pageCount={pageCount} onChange={setPage} />
      </div>
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
          <button className="primary-button admin-action" onClick={() => openForm()}>
            <Plus size={17} /> Tambah Jadwal
          </button>
        }
      />
      {(error || doctorError) && <Alert>{error || doctorError}</Alert>}
      <div className="surface-card admin-panel">
        {loading ? (
          <div className="loading-panel">Memuat jadwal…</div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Dokter</th>
                  <th>Hari praktik</th>
                  <th>Jam praktik</th>
                  <th>Status</th>
                  <th>Tindakan</th>
                </tr>
              </thead>
              <tbody>
                {schedules.map((item) => (
                  <tr key={item.id}>
                    <td><strong>{item.doctor_profile?.user?.name || 'Dokter'}</strong></td>
                    <td>{item.day}</td>
                    <td>{item.start_time?.slice(0, 5)}–{item.end_time?.slice(0, 5)}</td>
                    <td>
                      <span className={`status-pill ${item.is_active ? 'status-done' : 'status-danger'}`}>
                        {item.is_active ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td>
                      <button className="admin-icon-action" onClick={() => openForm(item)}>Edit</button>
                      <button className="admin-icon-action danger" onClick={() => remove(item)} aria-label="Hapus jadwal">
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!schedules.length && <div className="empty-state">Belum ada jadwal terdaftar.</div>}
          </div>
        )}
      </div>

      {scheduleModalOpen && (
        <Modal title={editing?.id ? 'Edit Jadwal' : 'Tambah Jadwal'} onClose={() => setScheduleModalOpen(false)}>
          <form className="admin-form" onSubmit={save}>
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
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
              Status Jadwal Aktif
            </label>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
              <button type="button" className="admin-secondary-action" onClick={() => setScheduleModalOpen(false)}>Batal</button>
              <button type="submit" className="primary-button admin-action">Simpan Jadwal</button>
            </div>
          </form>
        </Modal>
      )}
    </section>
  )
}

export function AdminMedicinesPage() {
  const { data: medicines, loading, error, refresh } = useAdminData('/admin/medicines')
  const { data: transactions, loading: loadingTransactions, refresh: refreshTransactions } = useAdminData('/admin/medicine-transactions')
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState('')
  const [selected, setSelected] = useState(null)
  const [category, setCategory] = useState('Semua kategori')
  const emptyForm = { name: '', category: '', form: '', stock: 0, min_stock_alert: 10, description: '', dosage: '', side_effects: '', image_url: '' }
  const [form, setForm] = useState(emptyForm)
  const [stockForm, setStockForm] = useState({ medicine_id: '', type: 'masuk', quantity: 1, notes: '' })

  const categories = ['Semua kategori', ...new Set(medicines.map((item) => item.category).filter(Boolean))]
  const shown = medicines.filter((item) => (category === 'Semua kategori' || item.category === category) && `${item.name} ${item.category}`.toLowerCase().includes(search.toLowerCase()))

  const openMedicine = (item = null) => {
    setSelected(item)
    setForm(item ? { ...emptyForm, ...item } : emptyForm)
    setModal('medicine')
  }

  const saveMedicine = async (event) => {
    event.preventDefault()
    try {
      if (selected) await api.put(`/admin/medicines/${selected.id}`, form)
      else await api.post('/admin/medicines', form)
      setModal('')
      toast.success('Data obat berhasil disimpan.')
      refresh()
    } catch (requestError) {
      toast.error(requestError.response?.data?.message || 'Data obat gagal disimpan.')
    }
  }

  const saveStock = async (event) => {
    event.preventDefault()
    try {
      await api.post('/admin/medicine-transactions', stockForm)
      setModal('')
      toast.success('Transaksi stok berhasil dicatat.')
      refresh()
      refreshTransactions()
    } catch (requestError) {
      toast.error(requestError.response?.data?.message || 'Transaksi stok gagal dicatat.')
    }
  }

  return (
    <section>
      <PageHeading
        eyebrow="INVENTARIS FARMASI"
        title="Obat"
        description="Kelola data, stok masuk, dan stok keluar obat."
        action={
          <div className="admin-heading-actions">
            <button className="admin-secondary-action" onClick={() => { setStockForm({ medicine_id: String(medicines[0]?.id || ''), type: 'masuk', quantity: 1, notes: '' }); setModal('stock') }}>
              <PackagePlus size={16} /> Catat Stok
            </button>
            <button className="primary-button admin-action" onClick={() => openMedicine()}>
              <Plus size={17} /> Tambah Obat
            </button>
          </div>
        }
      />
      {error && <Alert>{error}</Alert>}
      <div className="metrics-grid admin-metrics admin-metrics-compact">
        <StatTile icon={Pill} label="Jenis obat" value={medicines.length} />
        <StatTile icon={PackagePlus} label="Stok keseluruhan" value={medicines.reduce((total, item) => total + Number(item.stock || 0), 0)} tone="mint" />
        <StatTile icon={Activity} label="Stok menipis" value={medicines.filter((item) => Number(item.stock) <= Number(item.min_stock_alert)).length} tone="amber" />
      </div>
      <div className="admin-toolbar admin-toolbar-filter">
        <label className="admin-search">
          <Search size={17} />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari nama atau kategori obat" />
        </label>
        <select value={category} onChange={(event) => setCategory(event.target.value)}>
          {categories.map((item) => <option key={item}>{item}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="loading-panel">Memuat obat…</div>
      ) : (
        <div className="admin-medicine-grid">
          {shown.map((item) => (
            <article className="admin-medicine-card" key={item.id}>
              <div className="admin-medicine-symbol"><Pill size={23} /></div>
              <span className={`admin-stock-tag ${Number(item.stock) <= Number(item.min_stock_alert) ? 'low' : ''}`}>
                {Number(item.stock) <= Number(item.min_stock_alert) ? 'Stok menipis' : 'Tersedia'}
              </span>
              <h3>{item.name}</h3>
              <p>{item.category} · {item.form}</p>
              <div className="admin-medicine-stock">
                <small>Stok saat ini</small>
                <strong>{item.stock} {item.form}</strong>
              </div>
              <button className="admin-medicine-edit-btn" onClick={() => openMedicine(item)}>Edit Data</button>
            </article>
          ))}
          {!shown.length && <div className="empty-state">Tidak ada obat ditemukan.</div>}
        </div>
      )}

      {/* RIWAYAT MUTASI STOK OBAT */}
      <div className="surface-card admin-panel" style={{ marginTop: '24px' }}>
        <div className="surface-heading" style={{ marginBottom: '16px' }}>
          <div>
            <span className="eyebrow">CATATAN FARMASI</span>
            <h2 style={{ fontSize: '16px', fontWeight: 700, margin: '2px 0 4px' }}>Riwayat Mutasi Stok Obat</h2>
            <p style={{ margin: 0, color: '#64748b', fontSize: '12px' }}>Daftar aktivitas stok masuk dan pengeluaran obat terkini.</p>
          </div>
          <PackagePlus size={20} />
        </div>
        {loadingTransactions ? (
          <div className="loading-panel">Memuat riwayat transaksi stok…</div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Waktu</th>
                  <th>Nama Obat</th>
                  <th>Jenis Mutasi</th>
                  <th>Jumlah</th>
                  <th>Stok Sebelum</th>
                  <th>Stok Sesudah</th>
                  <th>Keterangan</th>
                </tr>
              </thead>
              <tbody>
                {Array.isArray(transactions) && transactions.slice(0, 15).map((tx) => (
                  <tr key={tx.id}>
                    <td><small>{new Date(tx.created_at).toLocaleString('id-ID')}</small></td>
                    <td><strong>{tx.medicine?.name || 'Obat'}</strong></td>
                    <td>
                      <span className={`status-pill ${tx.type === 'masuk' ? 'status-done' : 'status-danger'}`}>
                        {tx.type === 'masuk' ? 'Stok Masuk' : 'Stok Keluar'}
                      </span>
                    </td>
                    <td><strong>{tx.type === 'masuk' ? `+${tx.quantity}` : `-${tx.quantity}`}</strong></td>
                    <td>{tx.stock_before}</td>
                    <td><strong>{tx.stock_after}</strong></td>
                    <td><small style={{ color: '#64748b' }}>{tx.notes || '—'}</small></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {(!transactions || !transactions.length) && (
              <div className="empty-state">Belum ada riwayat transaksi stok dicatat.</div>
            )}
          </div>
        )}
      </div>

      {modal === 'medicine' && (
        <Modal title={selected ? 'Edit Data Obat' : 'Tambah Obat Baru'} onClose={() => setModal('')}>
          <form className="admin-form" onSubmit={saveMedicine}>
            <label>Nama Obat<input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
            <label>Kategori<input required value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Contoh: Analgesik, Antibiotik" /></label>
            <label>Bentuk<input required value={form.form} onChange={(e) => setForm({ ...form, form: e.target.value })} placeholder="Contoh: Tablet, Sirup, Kapsul" /></label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <label>Stok Awal<input type="number" min="0" required value={form.stock} onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })} /></label>
              <label>Batas Min Stok<input type="number" min="0" required value={form.min_stock_alert} onChange={(e) => setForm({ ...form, min_stock_alert: Number(e.target.value) })} /></label>
            </div>
            <label>Dosis / Aturan Pakai<input value={form.dosage} onChange={(e) => setForm({ ...form, dosage: e.target.value })} placeholder="Contoh: 3x1 sehari sesudah makan" /></label>
            <label>Deskripsi<textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
              <button type="button" className="admin-secondary-action" onClick={() => setModal('')}>Batal</button>
              <button type="submit" className="primary-button admin-action">Simpan Obat</button>
            </div>
          </form>
        </Modal>
      )}

      {modal === 'stock' && (
        <Modal title="Catat Transaksi Stok Obat" onClose={() => setModal('')}>
          <form className="admin-form" onSubmit={saveStock}>
            <label>
              Pilih Obat
              <select required value={stockForm.medicine_id} onChange={(e) => setStockForm({ ...stockForm, medicine_id: e.target.value })}>
                <option value="">Pilih obat</option>
                {medicines.map((m) => <option key={m.id} value={m.id}>{m.name} (Stok: {m.stock})</option>)}
              </select>
            </label>
            <label>
              Jenis Transaksi
              <select value={stockForm.type} onChange={(e) => setStockForm({ ...stockForm, type: e.target.value })}>
                <option value="masuk">Stok Masuk (Penambahan)</option>
                <option value="keluar">Stok Keluar (Pengurangan / Kadaluwarsa)</option>
              </select>
            </label>
            <label>
              Jumlah
              <input type="number" min="1" required value={stockForm.quantity} onChange={(e) => setStockForm({ ...stockForm, quantity: Number(e.target.value) })} />
            </label>
            <label>
              Catatan
              <input value={stockForm.notes} onChange={(e) => setStockForm({ ...stockForm, notes: e.target.value })} placeholder="Contoh: Pengadaan Dinkes, Pemusnahan" />
            </label>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
              <button type="button" className="admin-secondary-action" onClick={() => setModal('')}>Batal</button>
              <button type="submit" className="primary-button admin-action">Catat Transaksi</button>
            </div>
          </form>
        </Modal>
      )}
    </section>
  )
}

export function AdminNotificationsPage() {
  const { data: notifications, loading, error, refresh } = useAdminData('/admin/notifications')
  const [search, setSearch] = useState('')
  const [target, setTarget] = useState('Semua kategori')
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ title: '', message: '', target_role: 'patient' })

  const filtered = notifications.filter((item) => (target === 'Semua kategori' || item.target_role === target) && `${item.title} ${item.message}`.toLowerCase().includes(search.toLowerCase()))

  const publish = async (event) => {
    event.preventDefault()
    try {
      await api.post('/admin/notifications', form)
      setModal(false)
      setForm({ title: '', message: '', target_role: 'patient' })
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
        title="Kelola Notifikasi"
        description="Kirim pengumuman dan informasi resmi kepada pengguna layanan Klinik Polinela."
        action={
          <button className="primary-button admin-action" onClick={() => setModal(true)}>
            <Plus size={17} /> Buat Notifikasi Baru
          </button>
        }
      />
      {error && <Alert>{error}</Alert>}
      <div className="admin-toolbar admin-toolbar-filter">
        <label className="admin-search">
          <Search size={17} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari notifikasi" />
        </label>
        <select value={target} onChange={(e) => setTarget(e.target.value)}>
          <option>Semua kategori</option>
          <option value="patient">Pengguna layanan (Pasien)</option>
          <option value="doctor">Dokter</option>
          <option value="all">Semua penerima</option>
        </select>
      </div>

      {loading ? (
        <div className="loading-panel">Memuat notifikasi…</div>
      ) : (
        <div className="admin-notice-list">
          {filtered.map((item) => (
            <article className="admin-notice-card" key={item.id}>
              <div className="admin-notice-icon"><Bell size={19} /></div>
              <div className="admin-notice-content">
                <div className="admin-notice-meta">
                  <span>{item.target_role === 'patient' ? 'Pengguna layanan' : item.target_role === 'doctor' ? 'Dokter' : 'Semua penerima'}</span>
                  <time>{new Date(item.created_at).toLocaleString('id-ID')}</time>
                </div>
                <h3>{item.title}</h3>
                <p>{item.message}</p>
              </div>
            </article>
          ))}
          {!filtered.length && <div className="empty-state">Belum ada notifikasi.</div>}
        </div>
      )}

      {modal && (
        <Modal title="Buat Notifikasi Baru" onClose={() => setModal(false)}>
          <form className="admin-form" onSubmit={publish}>
            <label>
              Judul Pengumuman
              <input required maxLength="255" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Contoh: Informasi Libur Pelayanan" />
            </label>
            <label>
              Isi Notifikasi
              <textarea required rows={4} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Tuliskan pesan lengkap pengumuman di sini..." />
            </label>
            <label>
              Sasaran Penerima
              <select value={form.target_role} onChange={(e) => setForm({ ...form, target_role: e.target.value })}>
                <option value="patient">Pengguna Layanan (Pasien)</option>
                <option value="doctor">Dokter</option>
                <option value="all">Semua Pengguna</option>
              </select>
            </label>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
              <button type="button" className="admin-secondary-action" onClick={() => setModal(false)}>Batal</button>
              <button type="submit" className="primary-button admin-action">Kirim Notifikasi</button>
            </div>
          </form>
        </Modal>
      )}
    </section>
  )
}
