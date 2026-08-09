# Frontend Gap Todo

Dokumen ini mencatat gap antara implementasi frontend ERP MBG saat ini dengan acuan dokumentasi per **Minggu, 9 Agustus 2026**.

Dokumen ini melengkapi:

- [frontend_api_reference.md](./frontend_api_reference.md)
- [frontend_functional_reference.md](./frontend_functional_reference.md)
- [frontend_screen_matrix.md](./frontend_screen_matrix.md)

## 1. Tujuan

- mencatat fitur frontend yang belum tersedia
- membedakan gap total, gap parsial, dan polishing UX
- memberi urutan kerja yang paling natural untuk implementasi berikutnya
- menjadi backlog kerja bersama frontend dan backend

## 2. Status Ringkas

| Tier | Arti | Kondisi |
| --- | --- | --- |
| `T1` | Belum ada sama sekali | Perlu screen, service, route, dan navigasi baru |
| `T2` | Sudah ada tapi parsial | Sudah ada workspace dasar, belum memenuhi screen matrix |
| `T3` | Sudah ada, perlu polishing | Perlu pemisahan layar, UX, atau penyempurnaan reusable component |

## 3. Todo Prioritas Tinggi

### 3.1 `T1` Workforce Module

Status: `DASAR SUDAH TERPASANG`

Screen yang sudah tersedia:

- `Position List`
- `Employee List`
- `Employee Detail`
- `Employee Form`
- `Assignment Form`
- `Shift List`
- `Attendance List`
- `Timesheet List`

Catatan status:

- frontend saat ini baru menyentuh `Labor Cost` di modul costing
- modul workforce sekarang sudah punya service layer, route, sidebar grouping, dan reusable table
- workforce penting karena berhubungan langsung dengan operasi harian, attendance, dan finance

Todo lanjutan:

- tambahkan `Labor Cost List` khusus workforce agar terpisah dari halaman costing umum
- tambahkan create/edit untuk `positions`, `shifts`, `attendance`, dan `timesheets`
- tambahkan filter tenant/SPPG yang lebih formal dan action approval timesheet bila backend sudah siap

### 3.2 `T1` Program Module

Status: `DASAR SUDAH TERPASANG`

Screen yang sudah tersedia:

- `Program List`
- `Program Detail`
- `Create Program`
- `Add Period`
- `Assign Tenant`
- `Assign SPPG`

Todo lanjutan:

- tambahkan validasi bisnis yang lebih ketat mengikuti error code backend
- tambahkan edit program bila endpoint update tersedia di dokumentasi backend
- tambahkan filter tenant/SPPG context langsung dari header state agar program list lebih presisi

### 3.3 `T1` Penerima Manfaat Module

Status: `DASAR SUDAH TERPASANG`

Screen yang sudah tersedia:

- `Penerima Manfaat List`
- `Penerima Manfaat Detail`
- `Create Penerima Manfaat`

Todo lanjutan:

- tambahkan edit beneficiary bila endpoint update tersedia
- tambahkan filter tenant/SPPG/school yang lebih formal dari header context
- tambahkan bulk import atau upload bila terdokumentasi di backend berikutnya

### 3.4 `T1` Asset Module

Status: `DASAR SUDAH TERPASANG`

Screen yang sudah tersedia:

- `Asset Category List`
- `Asset List`
- `Asset Detail`
- `Asset Assignment List`
- `Depreciation List`

Todo lanjutan:

- tambahkan edit asset dan perubahan condition/status bila endpoint update tersedia
- tambahkan filter context tenant/SPPG yang lebih kuat dari header state
- tambahkan ringkasan nilai buku dan aging depresiasi bila backend atau read model sudah tersedia

### 3.5 `T1` Documents & Audit

Status: `DASAR SUDAH TERPASANG`

Screen yang sudah tersedia:

- `Document List`
- `Document Detail`
- `Upload Version`
- `Link Document`
- `Audit Event List`
- `Audit Event Detail`

Todo lanjutan:

- tambah preview/download file bila backend storage sudah menyediakan signed URL atau endpoint stream
- tambah filter audit event dengan date range dan actor bila query backend sudah tersedia
- tambah reusable JSON viewer component bila makin banyak modul governance memakai raw metadata

### 3.6 `T1` Integration & Platform Ops

Status: `TERPASANG DASAR`

Screen yang belum tersedia:

- `External System Detail`
- `Sync Job Detail`
- `Inbound Message Detail`
- `Outbound Message Detail`
- `Sync Log Detail`

Todo implementasi:

- pecah workspace menjadi detail route saat data backend sudah stabil
- tambahkan create form untuk external system, webhook, mapping, sync job, dan sync log manual
- tambah filter lanjutan status, idempotency key, processed time per endpoint backend
- tambah drawer JSON viewer dengan copy/search jika kebutuhan inspeksi makin intensif

### 3.7 `T1` AI & Analytics

Status: `BELUM ADA`

Screen yang belum tersedia:

- `AI Overview`
- `Forecast List`
- `Recommendation List`
- `Daily Summary List`
- `NL2SQL Workspace`
- `Image Analysis`
- `Video Analysis`

Todo implementasi:

- buat menu `AI & Analytics`
- siapkan workspace NL2SQL dengan area pertanyaan, SQL, explanation, dan safety notes
- siapkan upload UI untuk image/video analysis

## 4. Todo Prioritas Menengah

### 4.1 `T2` Dashboard Split

Status: `PARSIAL`

Kondisi saat ini:

- baru ada satu dashboard besar

Gap terhadap docs:

- `Tenant Dashboard`
- `SPPG Dashboard`
- `Finance Dashboard`

Todo implementasi:

- pecah dashboard menjadi 3 route
- pertahankan shared KPI card dan chart component

### 4.2 `T2` Identity & Access Completion

Status: `TERPASANG DASAR`

Sudah ada:

- `Login`
- `User List`
- `Create User`
- `Notification Inbox`
- `My Profile`
- `User Detail`
- `Edit User`
- `User SPPG Access`

Todo implementasi:

- tambah notification preference editor bila prioritas UX berikutnya membutuhkan channel/quiet hours
- tambahkan detail notification bila endpoint `/notifications/{notification_id}` perlu diekspos
- sinkronkan unread count header dari `GET /notifications/inbox` bila backend sudah stabil untuk polling/realtime

### 4.3 `T2` Meal Plan & Production Completion

Status: `PARSIAL`

Sudah tersedia:

- `Meal Plan List`
- `Production Order Detail`
- `Production Cost Sheet Detail`
- `Material Batch Trace` berisi batch, received/expiry, issued time, quantity, output portions, dan forward trace
- `Package Allocation` dengan progress accepted/packaged/remaining
- deep-link production batch ke QR lineage forward graph

Belum lengkap:

- `Meal Plan Detail`
- `Create Meal Plan`
- `Requirements Preview`
- `Cost Preview`
- `Production Order List` sebagai route terpisah
- `Create from Meal Plan`
- `Complete Production`

Todo implementasi:

- perjelas linked documents meal plan -> PR -> production
- buat action nyata dari meal plan ke production order
- pindahkan atau tampilkan package allocation langsung sebagai tab pada production detail
- tambahkan invalidation/query refresh formal setelah complete production dan create package

### 4.4 `T2` Inventory Core Completion

Status: `WORKSPACE CORE TERPASANG`

Sudah tersedia dalam `InventoryView`:

- `Warehouse List/Form`
- `Stock Location List/Form`
- `Batch List/Form`
- `Transaction List/Form`
- `Balance List`
- `Expiry Alert`
- `FEFO Preview`
- edit/delete untuk warehouse, location, batch, dan transaction
- quality status, blocked state, available quantity, dan expiry monitoring

Gap tersisa:

- pecah workspace menjadi route list/detail bila volume dan kebutuhan deep-link meningkat
- tambahkan `Warehouse Detail` dan `Batch Detail` khusus
- tambahkan filter `near expiry`, `blocked only`, product, warehouse, dan location yang sinkron ke query backend
- tambahkan aksi kontekstual `Review Batch`, `View Reason`, dan `Open Expiry Alert` sesuai status/CTA matrix

### 4.5 `T2` Food Safety & End-to-End Traceability

Status: `WORKFLOW UTAMA TERPASANG`

Sudah tersedia:

- create/resolve QR identity, timeline, backward/forward graph, dan print label
- safety check, temperature reading, alert acknowledgement, HOLD, dan recall
- package create, load, receive, GPS, suhu, serta lifecycle status
- progress `packaged / accepted / remaining` dari refresh data package backend
- goods receipt batch table dengan expiry, quality, blocked state, print QR, dan forward trace
- QR scanner dengan `BarcodeDetector` dan fallback `jsQR`
- error handling package berdasarkan `response.code`

Gap tersisa:

- validasi mutation end-to-end terhadap backend aktif; pengujian lokal terakhir masih menerima `502`
- ganti input manual `delivery_stop_id` dengan selector stop yang difilter berdasarkan production/delivery order
- tampilkan kapasitas tujuan `assigned / planned` sebelum load package
- tambahkan visual graph relation/edge, bukan hanya entity cards
- tampilkan detail hasil recall dan daftar package/delivery order terdampak
- tambahkan automated component/E2E test untuk create package, double-submit prevention, HOLD blocking, dan receiving

### 4.6 `T2` Quality Completion

Status: `PARSIAL`

Belum lengkap:

- `QC Inspection Detail`
- `Add QC Lines`
- `Finalize Inspection`

Todo implementasi:

- buat detail inspection
- buat editable inspection lines
- buat finalize action dengan hasil `PASS` / `FAIL`

### 4.7 `T2` Funding & Accounting Completion

Status: `PARSIAL`

Belum lengkap:

- `Funding Source List`
- `Disbursement List`
- `Repayment List`
- `Account Form`
- `Journal Entry Form`

Todo implementasi:

- buat form CRUD dasar untuk accounting/funding
- perkuat funding agreement detail dengan tab

### 4.8 `T2` Workflow Engine Admin

Status: `PARSIAL`

Sudah ada:

- `Approval Queue`
- viewer ringan workflow document

Belum ada:

- `Workflow Definition Detail`
- `Workflow Version Create`
- `Workflow State Create`
- `Workflow Action Create`
- `Workflow Transition Create`

Todo implementasi:

- buat admin workflow builder
- buat tab definition/version/state/action/transition

## 5. Todo Polishing UX

### 5.1 `T3` GIS

Status: `PERLU PENYEMPURNAAN`

Todo:

- full-screen GIS mode
- layer checkbox panel
- side panel quick actions yang lebih formal

### 5.2 `T3` Fleet

Status: `PERLU PENYEMPURNAAN`

Sudah ada:

- `Fleet Workspace`
- `Fleet Vehicle Detail`
- `GIS Fleet`

Todo:

- pisahkan `Driver List`, `Assignment List`, `Maintenance List` bila diperlukan
- tambah dispatch board filter status armada dan waktu update

### 5.3 `T3` Delivery

Status: `PERLU PENYEMPURNAAN`

Todo:

- perjelas `Delivery Detail`, `Route Detail`, `Proof`, dan `Incident`
- optimalkan mobile-first flow untuk proof dan incident

### 5.4 `T3` Budget & Costing

Status: `SEDANG DIBERESKAN`

Sudah dibenahi:

- pagination/search untuk beberapa tabel panjang
- policy non-labor dibuat reusable table
- budget planning detail diubah menjadi selected record

Todo berikutnya:

- jika line input budget sangat banyak, buat editor line yang lebih scalable

### 5.5 `T3` Loading & Async UX

Status: `SKELETON DASAR TERPASANG`

Sudah tersedia:

- reusable `LoadingSkeleton` dengan varian `detail`, `table`, dan `workspace`
- shimmer adaptif dengan dukungan `prefers-reduced-motion`
- skeleton pada Production Order Detail, Goods Receipt Detail, dan Food Security package workspace
- loading mutation yang mencegah double-submit pada package action

Gap tersisa:

- migrasikan screen yang masih memakai `.loading-panel` teks polos ke `LoadingSkeleton`
- tambahkan skeleton langsung pada reusable list/table agar layout tidak bergeser saat initial fetch
- standardisasi spinner/progress kecil pada tombol mutation tanpa mengganti label secara mendadak
- bedakan initial loading, background refresh, dan pagination loading
- pertahankan data lama saat background refresh dan tampilkan indikator non-blocking

## 6. Urutan Implementasi yang Direkomendasikan

1. `Food Safety & Traceability Backend Validation`
2. `Meal Plan & Production Completion`
3. `Loading Skeleton Rollout`
4. `Workforce Completion`
5. `Identity & Access Completion`
6. `Workflow Engine Admin`
7. `Inventory Detail Routes`
8. `Integration & Platform Ops`
9. `AI & Analytics`

## 7. Catatan Kerja

- setiap screen baru sebaiknya memakai reusable `DataTableCard` untuk list panjang
- semua screen operasional wajib menjaga context `tenant` dan `SPPG`
- semua action utama sebaiknya menampilkan status bisnis dan langkah berikutnya
- untuk modul baru, utamakan pola: `list -> detail -> form/action`
- gunakan `LoadingSkeleton` untuk initial fetch dan indikator ringan untuk background refresh
- mutation wajib mencegah double-submit dan mempertahankan pesan error berdasarkan `response.code` bila tersedia

## 8. Definition of Done Backlog

Sebuah item todo dianggap selesai bila:

1. route tersedia
2. halaman list/detail/form tersedia sesuai kebutuhan
3. service layer terhubung ke API atau fallback mock
4. role gating sesuai dokumentasi
5. skeleton initial loading, background refresh, empty, dan error state tersedia tanpa layout shift besar
6. tabel panjang memakai search dan pagination
7. `npm run type-check` lulus
8. mutation utama memiliki disabled/loading state dan perlindungan double-submit
9. `npm run build` lulus
