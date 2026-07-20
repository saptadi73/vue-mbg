import type {
  ActualExpenseRecord,
  BudgetSummary,
  BudgetRecord,
  CostPolicyRecord,
  DashboardPayload,
  GoodsReceiptRecord,
  GoodsReceiptDetailRecord,
  InventoryBalance,
  LaborCostRecord,
  MapDataset,
  MealPlan,
  PurchaseOrderRecord,
  PurchaseOrderDetailRecord,
  PurchaseRequestRecord,
  PurchaseRequestDetailRecord,
  ProductionCostSheetRecord,
  ProductionOrderDetailRecord,
  ProductionOrderRecord,
  ProductRecord,
  RecipeRecord,
  RecipeLineRecord,
  SchoolRecord,
  SupplierInvoiceRecord,
  SupplierInvoiceDetailRecord,
  SupplierPaymentRecord,
  SupplierPaymentDetailRecord,
  SupplierRecord,
  SppgRecord,
  TenantRecord,
  UserRecord,
  WorkflowDefinitionRecord,
  WorkflowDocumentRecord,
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

export const mockBudgetRecords: BudgetRecord[] = [
  {
    id: 'bdg-1',
    name: 'Budget Operasional Juli 2026',
    date_start: '2026-07-01',
    date_end: '2026-07-31',
    status: 'APPROVED',
    effective_budget: 5800000000,
    available_budget: 4800000000,
    notes: 'Budget utama untuk operasi produksi, distribusi, dan bahan baku.',
    lines: [
      { id: 'bdg-1-ln-1', account_code: '510000', account_name: 'Bahan Baku', planned_amount: 3200000000, reserved_amount: 210000000, committed_amount: 560000000, actual_amount: 880000000, available_budget: 1550000000 },
      { id: 'bdg-1-ln-2', account_code: '520000', account_name: 'Distribusi', planned_amount: 910000000, reserved_amount: 45000000, committed_amount: 120000000, actual_amount: 170000000, available_budget: 575000000 },
      { id: 'bdg-1-ln-3', account_code: '530000', account_name: 'Quality & Utility', planned_amount: 640000000, reserved_amount: 18000000, committed_amount: 42000000, actual_amount: 86000000, available_budget: 494000000 },
    ],
  },
  {
    id: 'bdg-2',
    name: 'Budget Distribusi Q3',
    date_start: '2026-07-01',
    date_end: '2026-09-30',
    status: 'SUBMITTED',
    effective_budget: 2100000000,
    available_budget: 1640000000,
    notes: 'Menunggu approval untuk ekspansi route triwulan 3.',
    lines: [
      { id: 'bdg-2-ln-1', account_code: '520100', account_name: 'Fuel & Toll', planned_amount: 720000000, reserved_amount: 65000000, committed_amount: 0, actual_amount: 0, available_budget: 655000000 },
      { id: 'bdg-2-ln-2', account_code: '520200', account_name: 'Third Party Delivery', planned_amount: 890000000, reserved_amount: 32000000, committed_amount: 0, actual_amount: 0, available_budget: 858000000 },
    ],
  },
]

export const mockCostPolicies: CostPolicyRecord[] = [
  {
    id: 'cp-1',
    code: 'COST-JUL-2026',
    name: 'Cost Policy Operasional Juli',
    effective_start_date: '2026-07-01',
    effective_end_date: '2026-07-31',
    labor_cost_per_portion: 1800,
    utility_cost_per_portion: 450,
    packaging_cost_per_portion: 600,
    distribution_cost_per_portion: 950,
    overhead_cost_per_portion: 700,
    waste_cost_percentage: 4.5,
    is_active: true,
  },
  {
    id: 'cp-2',
    code: 'COST-Q3-ROUTE',
    name: 'Policy Distribusi Q3',
    effective_start_date: '2026-07-01',
    effective_end_date: '2026-09-30',
    labor_cost_per_portion: 1750,
    utility_cost_per_portion: 420,
    packaging_cost_per_portion: 580,
    distribution_cost_per_portion: 1020,
    overhead_cost_per_portion: 760,
    waste_cost_percentage: 5.2,
    is_active: true,
  },
]

export const mockLaborCosts: LaborCostRecord[] = [
  { id: 'lc-1', work_date: '2026-07-19', sppg_id: 'sppg-jakarta-pusat-01', sppg_name: 'SPPG Jakarta Pusat 01', employee_count: 18, hours_worked: 126, hourly_rate: 28000, total_cost: 3528000, notes: 'Shift pagi dan persiapan lunch.', status: 'POSTED' },
  { id: 'lc-2', work_date: '2026-07-20', sppg_id: 'sppg-tanah-abang-02', sppg_name: 'SPPG Tanah Abang 02', employee_count: 12, hours_worked: 88, hourly_rate: 27500, total_cost: 2420000, notes: 'Produksi snack dan breakfast.', status: 'POSTED' },
  { id: 'lc-3', work_date: '2026-07-20', sppg_id: 'sppg-jakarta-pusat-01', sppg_name: 'SPPG Jakarta Pusat 01', employee_count: 20, hours_worked: 144, hourly_rate: 28500, total_cost: 4104000, notes: 'Produksi volume tinggi untuk dua cluster sekolah.', status: 'DRAFT' },
]

export const mockActualExpenses: ActualExpenseRecord[] = [
  { id: 'ae-1', expense_date: '2026-07-20', sppg_id: 'sppg-jakarta-pusat-01', sppg_name: 'SPPG Jakarta Pusat 01', cost_category: 'UTILITY', reference_type: 'PRODUCTION_ORDER', reference_id: 'prod-1', amount: 780000, notes: 'Listrik dan gas shift pagi.', status: 'POSTED' },
  { id: 'ae-2', expense_date: '2026-07-20', sppg_id: 'sppg-jakarta-pusat-01', sppg_name: 'SPPG Jakarta Pusat 01', cost_category: 'PACKAGING', reference_type: 'PRODUCTION_ORDER', reference_id: 'prod-1', amount: 640000, notes: 'Tray, segel, dan label produksi.', status: 'POSTED' },
  { id: 'ae-3', expense_date: '2026-07-20', sppg_id: 'sppg-tanah-abang-02', sppg_name: 'SPPG Tanah Abang 02', cost_category: 'DISTRIBUTION', reference_type: 'DELIVERY_ROUTE', reference_id: 'route-77', amount: 920000, notes: 'Fuel dan handling distribusi cluster siang.', status: 'DRAFT' },
  { id: 'ae-4', expense_date: '2026-07-19', sppg_id: 'sppg-jakarta-pusat-01', sppg_name: 'SPPG Jakarta Pusat 01', cost_category: 'OVERHEAD', reference_type: 'PERIODIC', reference_id: 'ovh-jul-03', amount: 510000, notes: 'Sanitasi dan consumable dapur.', status: 'POSTED' },
]

export const mockProductionOrders: ProductionOrderRecord[] = [
  { id: 'prod-1', order_number: 'PROD-20260720-0001', production_date: '2026-07-20', meal_plan_id: 'mp-2', meal_plan_name: 'Bubur Kacang Hijau Protein', sppg_id: 'sppg-jakarta-pusat-01', sppg_name: 'SPPG Jakarta Pusat 01', status: 'COMPLETED', planned_portions: 980, actual_portions: 990, accepted_portions: 972, rejected_portions: 18 },
  { id: 'prod-2', order_number: 'PROD-20260719-0007', production_date: '2026-07-19', meal_plan_id: 'mp-1', meal_plan_name: 'Nasi Ayam Rempah', sppg_id: 'sppg-jakarta-pusat-01', sppg_name: 'SPPG Jakarta Pusat 01', status: 'COMPLETED', planned_portions: 1450, actual_portions: 1435, accepted_portions: 1410, rejected_portions: 25 },
  { id: 'prod-3', order_number: 'PROD-20260720-0003', production_date: '2026-07-20', meal_plan_id: 'mp-4', meal_plan_name: 'Puding Susu Kurma', sppg_id: 'sppg-tanah-abang-02', sppg_name: 'SPPG Tanah Abang 02', status: 'IN_PROGRESS', planned_portions: 1620, actual_portions: 0, accepted_portions: 0, rejected_portions: 0 },
]

export const mockProductionCostSheets: ProductionCostSheetRecord[] = [
  {
    production_order_id: 'prod-1',
    order_number: 'PROD-20260720-0001',
    production_date: '2026-07-20',
    meal_plan_name: 'Bubur Kacang Hijau Protein',
    accepted_portions: 972,
    budget_cost_per_portion: 9300,
    actual_material_cost: 4620000,
    labor_cost_amount: 4104000,
    utility_cost_amount: 780000,
    packaging_cost_amount: 640000,
    distribution_cost_amount: 520000,
    overhead_cost_amount: 510000,
    waste_cost_amount: 190000,
    total_actual_cost: 11364000,
    actual_cost_per_portion: 11691,
    variance_total: 2326800,
    variance_per_portion: 2391,
    labor_cost_source: 'ACTUAL',
  },
  {
    production_order_id: 'prod-2',
    order_number: 'PROD-20260719-0007',
    production_date: '2026-07-19',
    meal_plan_name: 'Nasi Ayam Rempah',
    accepted_portions: 1410,
    budget_cost_per_portion: 15800,
    actual_material_cost: 13480000,
    labor_cost_amount: 3528000,
    utility_cost_amount: 620000,
    packaging_cost_amount: 860000,
    distribution_cost_amount: 1280000,
    overhead_cost_amount: 640000,
    waste_cost_amount: 420000,
    total_actual_cost: 20828000,
    actual_cost_per_portion: 14772,
    variance_total: -1449800,
    variance_per_portion: -1028,
    labor_cost_source: 'ACTUAL',
  },
]

export const mockProductionOrderDetails: ProductionOrderDetailRecord[] = [
  {
    production_order: {
      id: 'prod-1',
      order_number: 'PROD-20260720-0001',
      production_date: '2026-07-20',
      meal_plan_id: 'mp-2',
      meal_plan_name: 'Bubur Kacang Hijau Protein',
      sppg_id: 'sppg-jakarta-pusat-01',
      sppg_name: 'SPPG Jakarta Pusat 01',
      status: 'COMPLETED',
      planned_portions: 980,
      actual_portions: 990,
      accepted_portions: 972,
      rejected_portions: 18,
    },
    meal_plan: {
      id: 'mp-2',
      recipe_name: 'Bubur Kacang Hijau Protein',
      meal_type: 'Breakfast',
      plan_date: '2026-07-20',
      planned_portions: 980,
      budget_cost_per_portion: 9300,
      status: 'SUBMITTED',
    },
    materials: [
      { id: 'pm-1', product_code: 'KHG-01', product_name: 'Kacang Hijau', planned_quantity: 84, actual_quantity: 82, uom_id: 'kg', unit_cost: 22000, total_cost: 1804000 },
      { id: 'pm-2', product_code: 'SUSU-01', product_name: 'Susu UHT', planned_quantity: 145, actual_quantity: 148, uom_id: 'box', unit_cost: 6900, total_cost: 1021200 },
      { id: 'pm-3', product_code: 'GULA-01', product_name: 'Gula Pasir', planned_quantity: 52, actual_quantity: 50, uom_id: 'kg', unit_cost: 12800, total_cost: 640000 },
      { id: 'pm-4', product_code: 'KURMA-01', product_name: 'Kurma Blend', planned_quantity: 23, actual_quantity: 21, uom_id: 'kg', unit_cost: 54800, total_cost: 1150800 },
    ],
  },
  {
    production_order: {
      id: 'prod-2',
      order_number: 'PROD-20260719-0007',
      production_date: '2026-07-19',
      meal_plan_id: 'mp-1',
      meal_plan_name: 'Nasi Ayam Rempah',
      sppg_id: 'sppg-jakarta-pusat-01',
      sppg_name: 'SPPG Jakarta Pusat 01',
      status: 'COMPLETED',
      planned_portions: 1450,
      actual_portions: 1435,
      accepted_portions: 1410,
      rejected_portions: 25,
    },
    meal_plan: {
      id: 'mp-1',
      recipe_name: 'Nasi Ayam Rempah',
      meal_type: 'Lunch',
      plan_date: '2026-07-19',
      planned_portions: 1450,
      budget_cost_per_portion: 15800,
      status: 'APPROVED',
    },
    materials: [
      { id: 'pm-5', product_code: 'BERAS-01', product_name: 'Beras Medium', planned_quantity: 338, actual_quantity: 332, uom_id: 'kg', unit_cost: 14500, total_cost: 4814000 },
      { id: 'pm-6', product_code: 'AYAM-01', product_name: 'Ayam Fillet', planned_quantity: 262, actual_quantity: 258, uom_id: 'kg', unit_cost: 38200, total_cost: 9855600 },
      { id: 'pm-7', product_code: 'BUMBU-01', product_name: 'Bumbu Rempah Mix', planned_quantity: 49, actual_quantity: 46, uom_id: 'kg', unit_cost: 35600, total_cost: 1637600 },
    ],
  },
]

export const mockWorkflowDefinitions: WorkflowDefinitionRecord[] = [
  { id: 'wf-1', code: 'WF-BUDGET', name: 'Workflow Approval Budget', document_type: 'budget', status: 'ACTIVE', active_version_number: 1, notes: 'Draft -> Submitted -> Approved / Rejected' },
  { id: 'wf-2', code: 'WF-MEALPLAN', name: 'Workflow Approval Meal Plan', document_type: 'meal_plan', status: 'ACTIVE', active_version_number: 2, notes: 'Approval sebelum reserve material.' },
  { id: 'wf-3', code: 'WF-CLAIM', name: 'Workflow Government Claim', document_type: 'government_claim', status: 'ACTIVE', active_version_number: 1, notes: 'Verifikasi evidence lalu approval finance.' },
]

export const mockWorkflowDocuments: WorkflowDocumentRecord[] = [
  {
    id: 'wfd-1',
    document_type: 'budget',
    document_id: 'bdg-2',
    current_state: 'SUBMITTED',
    business_status: 'SUBMITTED',
    approval_requests: [
      { id: 'apr-1', title: 'Budget Distribusi Q3', approver_name: 'Nadia Puspita', approver_role: 'tenant_admin', status: 'PENDING', requested_at: '2026-07-20T07:15:00Z', due_at: '2026-07-21T10:00:00Z' },
    ],
    history: [
      { id: 'wfh-1', state: 'DRAFT', action_name: 'Create Budget', actor_name: 'Raka Mahendra', created_at: '2026-07-19T08:30:00Z', notes: 'Budget awal dibuat.' },
      { id: 'wfh-2', state: 'SUBMITTED', action_name: 'Submit Budget', actor_name: 'Raka Mahendra', created_at: '2026-07-20T07:15:00Z', notes: 'Menunggu approval tenant admin.' },
    ],
  },
  {
    id: 'wfd-2',
    document_type: 'meal_plan',
    document_id: 'mp-2',
    current_state: 'PENDING_APPROVAL',
    business_status: 'SUBMITTED',
    approval_requests: [
      { id: 'apr-2', title: 'Meal Plan Breakfast 21 Juli', approver_name: 'Budi Santoso', approver_role: 'quality_officer', status: 'PENDING', requested_at: '2026-07-20T05:50:00Z', due_at: '2026-07-20T11:00:00Z' },
    ],
    history: [
      { id: 'wfh-3', state: 'DRAFT', action_name: 'Create Meal Plan', actor_name: 'Operator SPPG', created_at: '2026-07-19T15:30:00Z' },
      { id: 'wfh-4', state: 'PENDING_APPROVAL', action_name: 'Request Approval', actor_name: 'Operator SPPG', created_at: '2026-07-20T05:50:00Z' },
    ],
  },
]

export const mockSuppliers: SupplierRecord[] = [
  { id: 'sup-1', name: 'Supplier Pangan Nusantara', supplier_type: 'VENDOR', contact_person: 'Ari Wibowo', phone: '081234567890', email: 'supplier@example.com', address: 'Jl. Supplier 1, Jakarta', status: 'ACTIVE' },
  { id: 'sup-2', name: 'Distribusi Segar Mandiri', supplier_type: 'DISTRIBUTOR', contact_person: 'Santi Dewi', phone: '081255577799', email: 'mandiri@example.com', address: 'Jl. Industri 7, Bekasi', status: 'ACTIVE' },
]

export const mockPurchaseRequests: PurchaseRequestRecord[] = [
  { id: 'pr-1', request_number: 'PR-20260720-0001', request_date: '2026-07-20', meal_plan_id: 'mp-2', status: 'DRAFT', total_estimated_cost: 8600000, supplier_name: 'Supplier Pangan Nusantara' },
  { id: 'pr-2', request_number: 'PR-20260719-0004', request_date: '2026-07-19', meal_plan_id: 'mp-1', status: 'APPROVED', total_estimated_cost: 12450000, supplier_name: 'Distribusi Segar Mandiri' },
]

export const mockPurchaseRequestDetails: PurchaseRequestDetailRecord[] = [
  {
    purchase_request: {
      id: 'pr-1',
      request_number: 'PR-20260720-0001',
      request_date: '2026-07-20',
      meal_plan_id: 'mp-2',
      status: 'DRAFT',
      total_estimated_cost: 8600000,
      supplier_name: 'Supplier Pangan Nusantara',
      notes: 'PR dibuat dari shortage meal plan breakfast.',
      budget_account_code: '510000',
      reserved_amount: 8600000,
    },
    lines: [
      { id: 'pr1-ln1', product_code: 'KHG-01', product_name: 'Kacang Hijau', quantity: 84, uom_id: 'kg', unit_price: 22000, total_amount: 1848000, notes: 'Buffer 1 hari' },
      { id: 'pr1-ln2', product_code: 'SUSU-01', product_name: 'Susu UHT', quantity: 145, uom_id: 'box', unit_price: 6900, total_amount: 1000500 },
      { id: 'pr1-ln3', product_code: 'KURMA-01', product_name: 'Kurma Blend', quantity: 23, uom_id: 'kg', unit_price: 54800, total_amount: 1260400 },
    ],
  },
  {
    purchase_request: {
      id: 'pr-2',
      request_number: 'PR-20260719-0004',
      request_date: '2026-07-19',
      meal_plan_id: 'mp-1',
      status: 'APPROVED',
      total_estimated_cost: 12450000,
      supplier_name: 'Distribusi Segar Mandiri',
      notes: 'PR untuk lunch cluster pusat.',
      budget_account_code: '510000',
      reserved_amount: 12450000,
    },
    lines: [
      { id: 'pr2-ln1', product_code: 'BERAS-01', product_name: 'Beras Medium', quantity: 338, uom_id: 'kg', unit_price: 14500, total_amount: 4901000 },
      { id: 'pr2-ln2', product_code: 'AYAM-01', product_name: 'Ayam Fillet', quantity: 262, uom_id: 'kg', unit_price: 28500, total_amount: 7467000 },
    ],
  },
]

export const mockPurchaseOrders: PurchaseOrderRecord[] = [
  { id: 'po-1', po_number: 'PO-20260719-0001', po_date: '2026-07-19', supplier_name: 'Supplier Pangan Nusantara', status: 'POSTED', total_amount: 12000000 },
  { id: 'po-2', po_number: 'PO-20260720-0002', po_date: '2026-07-20', supplier_name: 'Distribusi Segar Mandiri', status: 'DRAFT', total_amount: 7800000 },
]

export const mockPurchaseOrderDetails: PurchaseOrderDetailRecord[] = [
  {
    purchase_order: {
      id: 'po-1',
      po_number: 'PO-20260719-0001',
      po_date: '2026-07-19',
      supplier_name: 'Supplier Pangan Nusantara',
      status: 'POSTED',
      total_amount: 12000000,
      expected_date: '2026-07-21',
      order_type: 'PO',
      notes: 'PO hasil konversi dari PR breakfast.',
    },
    lines: [
      { id: 'po1-ln1', product_code: 'KHG-01', product_name: 'Kacang Hijau', quantity: 84, uom_id: 'kg', unit_price: 22000, total_amount: 1848000 },
      { id: 'po1-ln2', product_code: 'SUSU-01', product_name: 'Susu UHT', quantity: 145, uom_id: 'box', unit_price: 6900, total_amount: 1000500 },
      { id: 'po1-ln3', product_code: 'KURMA-01', product_name: 'Kurma Blend', quantity: 23, uom_id: 'kg', unit_price: 54800, total_amount: 1260400 },
    ],
  },
  {
    purchase_order: {
      id: 'po-2',
      po_number: 'PO-20260720-0002',
      po_date: '2026-07-20',
      supplier_name: 'Distribusi Segar Mandiri',
      status: 'DRAFT',
      total_amount: 7800000,
      expected_date: '2026-07-23',
      order_type: 'PO',
      notes: 'PO draft untuk kebutuhan lunch hari berikutnya.',
    },
    lines: [
      { id: 'po2-ln1', product_code: 'BERAS-01', product_name: 'Beras Medium', quantity: 180, uom_id: 'kg', unit_price: 14500, total_amount: 2610000 },
      { id: 'po2-ln2', product_code: 'BUMBU-01', product_name: 'Bumbu Rempah Mix', quantity: 60, uom_id: 'kg', unit_price: 35600, total_amount: 2136000 },
    ],
  },
]

export const mockGoodsReceipts: GoodsReceiptRecord[] = [
  { id: 'gr-1', receipt_number: 'GR-20260719-0001', receipt_date: '2026-07-19', source_number: 'PO-20260719-0001', status: 'POSTED', total_amount: 11850000 },
  { id: 'gr-2', receipt_number: 'GR-20260720-0002', receipt_date: '2026-07-20', source_number: 'PR-20260720-0001', status: 'DRAFT', total_amount: 4200000 },
]

export const mockGoodsReceiptDetails: GoodsReceiptDetailRecord[] = [
  {
    goods_receipt: {
      id: 'gr-1',
      receipt_number: 'GR-20260719-0001',
      receipt_date: '2026-07-19',
      source_number: 'PO-20260719-0001',
      status: 'POSTED',
      total_amount: 11850000,
      warehouse_name: 'Gudang Kering Utama',
      location_name: 'Receiving Dock A',
      notes: 'Received from supplier',
      committed_amount: 11850000,
    },
    lines: [
      { id: 'gr1-ln1', product_code: 'KHG-01', product_name: 'Kacang Hijau', quantity: 82, uom_id: 'kg', unit_price: 22000, total_amount: 1804000 },
      { id: 'gr1-ln2', product_code: 'SUSU-01', product_name: 'Susu UHT', quantity: 148, uom_id: 'box', unit_price: 6900, total_amount: 1021200 },
      { id: 'gr1-ln3', product_code: 'KURMA-01', product_name: 'Kurma Blend', quantity: 21, uom_id: 'kg', unit_price: 54800, total_amount: 1150800 },
    ],
  },
  {
    goods_receipt: {
      id: 'gr-2',
      receipt_number: 'GR-20260720-0002',
      receipt_date: '2026-07-20',
      source_number: 'PR-20260720-0001',
      status: 'DRAFT',
      total_amount: 4200000,
      warehouse_name: 'Cold Storage',
      location_name: 'Inbound Rack B',
      notes: 'Menunggu final receiving',
      committed_amount: 0,
    },
    lines: [
      { id: 'gr2-ln1', product_code: 'AYAM-01', product_name: 'Ayam Fillet', quantity: 96, uom_id: 'kg', unit_price: 38200, total_amount: 3667200 },
    ],
  },
]

export const mockSupplierInvoices: SupplierInvoiceRecord[] = [
  { id: 'si-1', invoice_number: 'INV-20260719-0001', invoice_date: '2026-07-19', supplier_name: 'Supplier Pangan Nusantara', status: 'POSTED', total_amount: 11850000 },
  { id: 'si-2', invoice_number: 'INV-20260720-0002', invoice_date: '2026-07-20', supplier_name: 'Distribusi Segar Mandiri', status: 'DRAFT', total_amount: 4200000 },
]

export const mockSupplierInvoiceDetails: SupplierInvoiceDetailRecord[] = [
  {
    supplier_invoice: {
      id: 'si-1',
      invoice_number: 'INV-20260719-0001',
      invoice_date: '2026-07-19',
      supplier_name: 'Supplier Pangan Nusantara',
      status: 'POSTED',
      total_amount: 11850000,
      due_date: '2026-07-26',
      budget_account_code: '510000',
      goods_receipt_number: 'GR-20260719-0001',
      notes: 'Invoice supplier posted',
    },
    lines: [
      { id: 'si1-ln1', product_code: 'KHG-01', product_name: 'Kacang Hijau', quantity: 82, uom_id: 'kg', unit_price: 22000, total_amount: 1804000 },
      { id: 'si1-ln2', product_code: 'SUSU-01', product_name: 'Susu UHT', quantity: 148, uom_id: 'box', unit_price: 6900, total_amount: 1021200 },
      { id: 'si1-ln3', product_code: 'KURMA-01', product_name: 'Kurma Blend', quantity: 21, uom_id: 'kg', unit_price: 54800, total_amount: 1150800 },
    ],
  },
  {
    supplier_invoice: {
      id: 'si-2',
      invoice_number: 'INV-20260720-0002',
      invoice_date: '2026-07-20',
      supplier_name: 'Distribusi Segar Mandiri',
      status: 'DRAFT',
      total_amount: 4200000,
      due_date: '2026-07-27',
      budget_account_code: '510000',
      goods_receipt_number: 'GR-20260720-0002',
      notes: 'Draft invoice menunggu final receive',
    },
    lines: [
      { id: 'si2-ln1', product_code: 'AYAM-01', product_name: 'Ayam Fillet', quantity: 96, uom_id: 'kg', unit_price: 38200, total_amount: 3667200 },
    ],
  },
]

export const mockSupplierPayments: SupplierPaymentRecord[] = [
  { id: 'sp-1', payment_number: 'PAY-20260720-0001', payment_date: '2026-07-20', supplier_name: 'Supplier Pangan Nusantara', status: 'POSTED', amount: 11850000 },
]

export const mockSupplierPaymentDetails: SupplierPaymentDetailRecord[] = [
  {
    supplier_payment: {
      id: 'sp-1',
      payment_number: 'PAY-20260720-0001',
      payment_date: '2026-07-20',
      supplier_name: 'Supplier Pangan Nusantara',
      status: 'POSTED',
      amount: 11850000,
      supplier_invoice_number: 'INV-20260719-0001',
      bank_account_code: '110000',
      notes: 'Supplier payment posted',
    },
  },
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

export const mockRecipeLines: RecipeLineRecord[] = [
  {
    id: 'recipe-line-1',
    recipe_id: 'recipe-1',
    component_product_id: 'product-1',
    component_product_name: 'Beras Medium',
    quantity: 25,
    uom_id: 'uom-kg',
    waste_percentage: 1.5,
    notes: 'Komponen utama karbohidrat',
  },
  {
    id: 'recipe-line-2',
    recipe_id: 'recipe-1',
    component_product_id: 'product-2',
    component_product_name: 'Ayam Fillet',
    quantity: 18,
    uom_id: 'uom-kg',
    waste_percentage: 2.5,
    notes: 'Protein utama',
  },
  {
    id: 'recipe-line-3',
    recipe_id: 'recipe-3',
    component_product_id: 'product-1',
    component_product_name: 'Beras Medium',
    quantity: 24,
    uom_id: 'uom-kg',
    waste_percentage: 2,
    notes: 'Bahan dasar nasi goreng',
  },
]
