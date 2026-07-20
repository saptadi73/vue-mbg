import type {
  BudgetSummary,
  DashboardPayload,
  InventoryBalance,
  MapDataset,
  MealPlan,
  ProductRecord,
  RecipeRecord,
  SchoolRecord,
  SppgRecord,
  TenantRecord,
  UserRecord,
} from '@/types/domain'

export const mockDashboard: DashboardPayload = {
  tenantKpis: [
    { id: 'mp', label: 'Meal Plan Aktif', value: '126', change: '+12%', trend: 'up', tone: 'brand', caption: 'Dibanding minggu lalu' },
    { id: 'po', label: 'Produksi Berjalan', value: '38', change: '+4 unit', trend: 'up', tone: 'success', caption: '17 dapur aktif hari ini' },
    { id: 'do', label: 'Delivery Hari Ini', value: '214', change: '96.4% on-time', trend: 'up', tone: 'success', caption: '9 rute sedang berjalan' },
    { id: 'budget', label: 'Budget Tersedia', value: 'Rp4,8 M', change: '-8%', trend: 'down', tone: 'warning', caption: 'Perlu kontrol bahan baku' },
  ],
  sppgKpis: [
    { id: 'stock', label: 'Stok Kritis', value: '08', change: '-3 item', trend: 'up', tone: 'warning', caption: 'Fokus gudang pendingin' },
    { id: 'prod', label: 'Progress Produksi', value: '82%', change: '4280 porsi', trend: 'up', tone: 'brand', caption: 'Menu siang hampir selesai' },
    { id: 'quality', label: 'Issue Quality', value: '03', change: '1 high risk', trend: 'down', tone: 'danger', caption: 'Perlu inspeksi cepat' },
    { id: 'expiry', label: 'Near Expiry', value: '12', change: '2 batch hari ini', trend: 'neutral', tone: 'warning', caption: 'Prioritaskan FEFO' },
  ],
  financeKpis: [
    { id: 'cashflow', label: 'Cash Flow Bersih', value: 'Rp1,2 M', change: '+6%', trend: 'up', tone: 'success', caption: 'Dalam 30 hari terakhir' },
    { id: 'receivable', label: 'Piutang Klaim', value: 'Rp2,1 M', change: '31 hari avg', trend: 'neutral', tone: 'warning', caption: 'Butuh follow up verifikasi' },
    { id: 'funding', label: 'Investor Funding', value: 'Rp6,9 M', change: 'ROI 14.8%', trend: 'up', tone: 'brand', caption: '3 agreement aktif' },
    { id: 'roi', label: 'ROI per SPPG', value: '18.2%', change: '+1.1 pts', trend: 'up', tone: 'success', caption: 'Top performer: JKT-01' },
  ],
  mealPlanStatus: [
    { name: 'Meal Plan', data: [44, 28, 21, 16] },
  ],
  deliveryPerformance: [
    { name: 'On Time', data: [91, 94, 92, 96, 95, 97, 96] },
    { name: 'Issue', data: [5, 4, 7, 3, 5, 2, 4] },
  ],
  budgetUtilization: [74, 68, 81, 63, 88],
  receivableBuckets: [420, 330, 210, 140, 90],
  alerts: [
    { id: '1', title: 'Stok ayam fillet menipis', description: 'Warehouse cold room tinggal 14% buffer.', time: '2026-07-20T09:12:00Z', status: 'OPEN' },
    { id: '2', title: 'Suhu delivery turun', description: 'Route RT-20260720-0003 mencatat 58.4C.', time: '2026-07-20T08:41:00Z', status: 'FAILED' },
    { id: '3', title: '3 batch near expiry', description: 'Prioritaskan issue untuk menu besok.', time: '2026-07-20T07:26:00Z', status: 'PENDING' },
  ],
  approvals: [
    { id: '4', title: 'Budget Operasional Juli', description: 'Menunggu approval finance manager.', time: '2026-07-20T06:45:00Z', status: 'PENDING' },
    { id: '5', title: 'Meal Plan 21 Juli - SPPG JKT 01', description: 'Perlu approval sebelum reserve material.', time: '2026-07-20T06:10:00Z', status: 'SUBMITTED' },
    { id: '6', title: 'Claim Pemerintah Batch 07', description: 'Verifikasi evidence pengiriman.', time: '2026-07-19T16:32:00Z', status: 'PENDING' },
  ],
}

export const mockMealPlans: MealPlan[] = [
  { id: 'mp-1', plan_date: '2026-07-21', meal_type: 'Lunch', recipe_name: 'Nasi Ayam Rempah', planned_portions: 1450, cost_per_portion_budget: 15800, status: 'DRAFT', workflow_status: 'DRAFT', notes: 'Menunggu finalisasi bahan segar.' },
  { id: 'mp-2', plan_date: '2026-07-21', meal_type: 'Breakfast', recipe_name: 'Bubur Kacang Hijau Protein', planned_portions: 980, cost_per_portion_budget: 9300, status: 'SUBMITTED', workflow_status: 'PENDING', notes: 'Sudah hitung kebutuhan bahan.' },
  { id: 'mp-3', plan_date: '2026-07-22', meal_type: 'Lunch', recipe_name: 'Nasi Ikan Bumbu Kuning', planned_portions: 1620, cost_per_portion_budget: 17100, status: 'APPROVED', workflow_status: 'APPROVED', notes: 'Siap reserve material.' },
  { id: 'mp-4', plan_date: '2026-07-22', meal_type: 'Snack', recipe_name: 'Puding Susu Kurma', planned_portions: 1620, cost_per_portion_budget: 5100, status: 'MATERIAL_RESERVED', workflow_status: 'APPROVED', notes: 'Terkait PO bahan susu batch baru.' },
]

export const mockInventory: InventoryBalance[] = [
  { id: 'inv-1', warehouse_name: 'Gudang Kering Utama', location_name: 'Aisle A-02', product_name: 'Beras Premium', quantity_on_hand: 4200, reserved_quantity: 1600, available_quantity: 2600, average_cost: 14500, quality_status: 'PASSED' },
  { id: 'inv-2', warehouse_name: 'Cold Storage', location_name: 'Rack C-07', product_name: 'Ayam Fillet', quantity_on_hand: 320, reserved_quantity: 210, available_quantity: 110, average_cost: 38200, quality_status: 'PENDING' },
  { id: 'inv-3', warehouse_name: 'Gudang Sayur', location_name: 'Bin V-05', product_name: 'Wortel Segar', quantity_on_hand: 180, reserved_quantity: 90, available_quantity: 90, average_cost: 8700, quality_status: 'PASSED' },
  { id: 'inv-4', warehouse_name: 'Cold Storage', location_name: 'Rack M-02', product_name: 'Susu UHT', quantity_on_hand: 96, reserved_quantity: 24, available_quantity: 72, average_cost: 6900, quality_status: 'PASSED' },
]

export const mockBudgets: BudgetSummary[] = [
  { id: 'bdg-1', name: 'Budget Operasional Juli 2026', date_start: '2026-07-01', date_end: '2026-07-31', status: 'APPROVED', effective_budget: 5800000000, available_budget: 4800000000 },
  { id: 'bdg-2', name: 'Budget Distribusi Q3', date_start: '2026-07-01', date_end: '2026-09-30', status: 'SUBMITTED', effective_budget: 2100000000, available_budget: 1640000000 },
  { id: 'bdg-3', name: 'Budget Cadangan Mutu', date_start: '2026-07-01', date_end: '2026-08-31', status: 'DRAFT', effective_budget: 760000000, available_budget: 760000000 },
]

export const mockMapData: MapDataset = {
  kitchens: [
    { id: 'k-1', name: 'SPPG Jakarta Pusat 01', latitude: -6.1775, longitude: 106.8272, status: 'ACTIVE' },
    { id: 'k-2', name: 'SPPG Tanah Abang 02', latitude: -6.1907, longitude: 106.8099, status: 'ACTIVE' },
    { id: 'k-3', name: 'SPPG Menteng 03', latitude: -6.194, longitude: 106.8326, status: 'ACTIVE' },
  ],
  schools: [
    { id: 's-1', name: 'SDN Cikini 01', latitude: -6.1883, longitude: 106.8393, status: 'SERVED' },
    { id: 's-2', name: 'SMPN 12 Jakarta', latitude: -6.1714, longitude: 106.8219, status: 'UNSERVED' },
    { id: 's-3', name: 'SDN Kebon Melati', latitude: -6.1896, longitude: 106.8138, status: 'SERVED' },
  ],
  coverage: {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: { name: 'Coverage JKT-01', type: 'coverage' },
        geometry: {
          type: 'Polygon',
          coordinates: [[[106.8162, -6.1702], [106.8423, -6.1702], [106.8423, -6.1919], [106.8162, -6.1919], [106.8162, -6.1702]]],
        },
      },
    ],
  },
  unserved: {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: { name: 'Gap Coverage', type: 'gap' },
        geometry: {
          type: 'Polygon',
          coordinates: [[[106.8196, -6.1664], [106.8296, -6.1664], [106.8296, -6.1731], [106.8196, -6.1731], [106.8196, -6.1664]]],
        },
      },
    ],
  },
}

export const mockUsers: UserRecord[] = [
  {
    id: 'usr-1',
    full_name: 'Raka Mahendra',
    email: 'raka.mahendra@mbg.local',
    role_names: ['operations_manager'],
    is_active: true,
    active_sppg_id: 'sppg-jakarta-pusat-01',
    accessible_sppg_ids: ['sppg-jakarta-pusat-01', 'sppg-tanah-abang-02'],
    created_at: '2026-07-18T09:30:00Z',
  },
  {
    id: 'usr-2',
    full_name: 'Nadia Puspita',
    email: 'nadia.puspita@mbg.local',
    role_names: ['tenant_admin'],
    is_active: true,
    active_sppg_id: 'sppg-jakarta-pusat-01',
    accessible_sppg_ids: ['sppg-jakarta-pusat-01', 'sppg-menteng-03'],
    created_at: '2026-07-17T13:10:00Z',
  },
  {
    id: 'usr-3',
    full_name: 'Budi Santoso',
    email: 'budi.santoso@mbg.local',
    role_names: ['quality_officer'],
    is_active: false,
    active_sppg_id: 'sppg-tanah-abang-02',
    accessible_sppg_ids: ['sppg-tanah-abang-02'],
    created_at: '2026-07-15T06:45:00Z',
  },
]

export const mockTenants: TenantRecord[] = [
  {
    id: 'tenant-1',
    name: 'Tenant MBG Nasional',
    code: 'MBG-NASIONAL',
    description: 'Tenant pusat operasional dan orchestration lintas wilayah.',
    is_active: true,
    created_at: '2026-07-10T08:00:00Z',
  },
  {
    id: 'tenant-2',
    name: 'Yayasan MBG Jawa Barat',
    code: 'MBG-JABAR',
    description: 'Tenant operasional wilayah Jawa Barat.',
    is_active: true,
    created_at: '2026-07-12T09:15:00Z',
  },
  {
    id: 'tenant-3',
    name: 'Yayasan MBG Sumatera Selatan',
    code: 'MBG-SUMSEL',
    description: 'Tenant pilot ekspansi wilayah Sumatera bagian selatan.',
    is_active: false,
    created_at: '2026-07-15T11:40:00Z',
  },
]

export const mockSppgs: SppgRecord[] = [
  {
    id: 'sppg-jakarta-pusat-01',
    tenant_id: 'tenant-1',
    code: 'SPPG-JKT-01',
    name: 'SPPG Jakarta Pusat 01',
    address: 'Jl. Medan Merdeka Selatan No. 12, Jakarta Pusat',
    latitude: -6.1775,
    longitude: 106.8272,
    radius_km: 5,
    is_active: true,
    created_at: '2026-07-11T08:10:00Z',
  },
  {
    id: 'sppg-tanah-abang-02',
    tenant_id: 'tenant-1',
    code: 'SPPG-TAB-02',
    name: 'SPPG Tanah Abang 02',
    address: 'Jl. KH Mas Mansyur No. 21, Jakarta Pusat',
    latitude: -6.1907,
    longitude: 106.8099,
    radius_km: 4.5,
    is_active: true,
    created_at: '2026-07-12T09:00:00Z',
  },
  {
    id: 'sppg-bandung-01',
    tenant_id: 'tenant-2',
    code: 'SPPG-BDG-01',
    name: 'SPPG Bandung 01',
    address: 'Jl. Asia Afrika No. 10, Bandung',
    latitude: -6.921757,
    longitude: 107.607611,
    radius_km: 5,
    is_active: true,
    created_at: '2026-07-13T10:25:00Z',
  },
]

export const mockSchools: SchoolRecord[] = [
  {
    id: 'school-1',
    tenant_id: 'tenant-1',
    sppg_id: 'sppg-jakarta-pusat-01',
    npsn: '20101010',
    name: 'SDN Cikini 01',
    school_level: 'SD',
    address: 'Jl. Cikini Raya No. 8, Jakarta Pusat',
    latitude: -6.1883,
    longitude: 106.8393,
    is_active: true,
    created_at: '2026-07-16T08:00:00Z',
  },
  {
    id: 'school-2',
    tenant_id: 'tenant-1',
    sppg_id: 'sppg-tanah-abang-02',
    npsn: '20101011',
    name: 'SMPN 12 Jakarta',
    school_level: 'SMP',
    address: 'Jl. Kebon Kacang No. 12, Jakarta Pusat',
    latitude: -6.1714,
    longitude: 106.8219,
    is_active: true,
    created_at: '2026-07-16T09:20:00Z',
  },
  {
    id: 'school-3',
    tenant_id: 'tenant-2',
    sppg_id: 'sppg-bandung-01',
    npsn: '20202020',
    name: 'SDN Merdeka 01',
    school_level: 'SD',
    address: 'Jl. Merdeka No. 1, Bandung',
    latitude: -6.9,
    longitude: 107.61,
    is_active: true,
    created_at: '2026-07-17T10:30:00Z',
  },
]

export const mockProducts: ProductRecord[] = [
  {
    id: 'product-1',
    tenant_id: 'tenant-1',
    code: 'BERAS-01',
    name: 'Beras Medium',
    product_type: 'RAW_MATERIAL',
    uom_id: 'uom-kg',
    category_name: 'Bahan Pokok',
    is_active: true,
    created_at: '2026-07-14T07:45:00Z',
  },
  {
    id: 'product-2',
    tenant_id: 'tenant-1',
    code: 'AYAM-01',
    name: 'Ayam Fillet',
    product_type: 'RAW_MATERIAL',
    uom_id: 'uom-kg',
    category_name: 'Protein',
    is_active: true,
    created_at: '2026-07-14T08:15:00Z',
  },
  {
    id: 'product-3',
    tenant_id: 'tenant-2',
    code: 'SUSU-01',
    name: 'Susu UHT',
    product_type: 'RAW_MATERIAL',
    uom_id: 'uom-box',
    category_name: 'Minuman',
    is_active: true,
    created_at: '2026-07-15T11:00:00Z',
  },
]

export const mockRecipes: RecipeRecord[] = [
  {
    id: 'recipe-1',
    tenant_id: 'tenant-1',
    code: 'RCP-NASI-AYAM',
    name: 'Nasi Ayam Rempah',
    yield_portions: 100,
    notes: 'Menu makan siang unggulan tenant pusat.',
    is_active: true,
    created_at: '2026-07-14T09:00:00Z',
  },
  {
    id: 'recipe-2',
    tenant_id: 'tenant-1',
    code: 'RCP-BUBUR-KACANG',
    name: 'Bubur Kacang Hijau Protein',
    yield_portions: 80,
    notes: 'Menu sarapan tinggi energi.',
    is_active: true,
    created_at: '2026-07-14T09:20:00Z',
  },
  {
    id: 'recipe-3',
    tenant_id: 'tenant-2',
    code: 'RCP-NASI-GORENG',
    name: 'Nasi Goreng Telur',
    yield_portions: 100,
    notes: 'Menu sarapan tenant Jawa Barat.',
    is_active: true,
    created_at: '2026-07-16T06:40:00Z',
  },
]
