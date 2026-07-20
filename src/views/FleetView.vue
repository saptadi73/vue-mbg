<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { storeToRefs } from 'pinia'
import type { ApexOptions } from 'apexcharts'
import ChartPanel from '@/components/charts/ChartPanel.vue'
import DataTableCard from '@/components/common/DataTableCard.vue'
import PageHeader from '@/components/common/PageHeader.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import { useAsyncState } from '@/composables/useAsyncState'
import { mockDeliveryOrders, mockDeliveryRoutes } from '@/services/mock-data'
import {
  createFleetAssignment,
  createFleetDriver,
  createFleetMaintenance,
  createFleetVehicle,
  createVehicleType,
  getFleetAssignments,
  getFleetDrivers,
  getFleetMaintenances,
  getFleetVehicleById,
  getFleetVehicles,
  getVehicleTypes,
} from '@/services/fleet'
import type {
  FleetAssignmentRecord,
  FleetDriverRecord,
  FleetMaintenanceRecord,
  FleetVehicleDetailRecord,
  FleetVehicleRecord,
  DeliveryOrderRecord,
  DeliveryRoutePlanRecord,
  VehicleTypeRecord,
} from '@/types/domain'
import { useAppStore } from '@/stores/app'
import { formatCurrency, formatDate, formatNumber } from '@/utils/format'

type FuelLogRow = {
  id: string
  vehicle_id: string
  vehicle_code: string
  sppg_name: string
  log_date: string
  liters: number
  unit_cost: number
  odometer_km: number
  note: string
}

const appStore = useAppStore()
const { themeMode } = storeToRefs(appStore)
const vehicleTypesState = useAsyncState(getVehicleTypes)
const vehiclesState = useAsyncState(getFleetVehicles)
const driversState = useAsyncState(getFleetDrivers)
const assignmentsState = useAsyncState(getFleetAssignments)
const maintenancesState = useAsyncState(getFleetMaintenances)
const selectedVehicleId = ref('vehicle-1')
const detailState = useAsyncState<FleetVehicleDetailRecord>(() => getFleetVehicleById(selectedVehicleId.value))
const saving = ref(false)
const fuelLogs = ref<FuelLogRow[]>([
  {
    id: 'fuel-log-1',
    vehicle_id: 'vehicle-1',
    vehicle_code: 'VH-001',
    sppg_name: 'SPPG Jakarta Pusat 01',
    log_date: '2026-07-18',
    liters: 42,
    unit_cost: 13800,
    odometer_km: 12410,
    note: 'Top-up sebelum dispatch pagi.',
  },
  {
    id: 'fuel-log-2',
    vehicle_id: 'vehicle-2',
    vehicle_code: 'VH-002',
    sppg_name: 'SPPG Tanah Abang 02',
    log_date: '2026-07-19',
    liters: 37,
    unit_cost: 13800,
    odometer_km: 12650,
    note: 'Refuel setelah route sekolah padat.',
  },
  {
    id: 'fuel-log-3',
    vehicle_id: 'vehicle-3',
    vehicle_code: 'VH-003',
    sppg_name: 'SPPG Menteng 03',
    log_date: '2026-07-20',
    liters: 28,
    unit_cost: 14100,
    odometer_km: 8940,
    note: 'Pengisian untuk trip pending siang.',
  },
])

const vehicleTypeForm = reactive({
  tenant_id: 'tenant-1',
  code: 'VAN-HOT',
  name: 'Van Hot Box',
  description: 'Kendaraan untuk distribusi makanan dengan box termal.',
  capacity_portions: 950,
  capacity_kg: 700,
  temperature_controlled: true,
  is_active: true,
})

const vehicleForm = reactive({
  tenant_id: 'tenant-1',
  home_sppg_id: 'sppg-jakarta-pusat-01',
  vehicle_type_id: 'vehicle-type-1',
  vehicle_code: 'VH-004',
  plate_number: 'B 4455 MBG',
  ownership_status: 'OWNED',
  brand_name: 'Suzuki',
  model_name: 'Carry Box',
  manufacture_year: 2025,
  capacity_portions: 780,
  fuel_type: 'BENSIN',
  status: 'ACTIVE',
  is_active: true,
  notes: 'Armada tambahan untuk distribusi cadangan.',
})

const driverForm = reactive({
  tenant_id: 'tenant-1',
  driver_code: 'DRV-003',
  full_name: 'Fajar Hidayat',
  phone_number: '081234567892',
  license_number: 'SIMB-00112235',
  license_type: 'B1',
  license_expiry_date: '2027-05-31',
  status: 'ACTIVE',
  is_active: true,
  notes: 'Driver backup shift sore.',
})

const assignmentForm = reactive({
  vehicle_id: 'vehicle-1',
  sppg_id: 'sppg-jakarta-pusat-01',
  driver_id: 'driver-1',
  assignment_date: '2026-07-20',
  end_date: '',
  assignment_role: 'DELIVERY',
  status: 'ASSIGNED',
  is_active: true,
  notes: 'Assignment aktif untuk rute pagi.',
})

const maintenanceForm = reactive({
  vehicle_id: 'vehicle-2',
  sppg_id: 'sppg-tanah-abang-02',
  maintenance_date: '2026-07-20',
  maintenance_type: 'SERVICE_BERKALA',
  odometer_km: 12680,
  cost_amount: 680000,
  vendor_name: 'Bengkel MBG Motor',
  status: 'SCHEDULED',
  notes: 'Service ringan sebelum operasi puncak.',
})

const fuelLogForm = reactive({
  vehicle_id: 'vehicle-1',
  log_date: '2026-07-20',
  liters: 35,
  unit_cost: 14100,
  odometer_km: 12480,
  note: 'Top-up untuk dispatch sore.',
})

const vehicleTypes = computed(() => vehicleTypesState.data.value?.items || [])
const vehicles = computed(() => vehiclesState.data.value?.items || [])
const drivers = computed(() => driversState.data.value?.items || [])
const assignments = computed(() => assignmentsState.data.value?.items || [])
const maintenances = computed(() => maintenancesState.data.value?.items || [])
const detail = computed(() => detailState.data.value || null)
const licenseExpiryAlerts = computed(() =>
  drivers.value
    .filter((item) => item.license_expiry_date)
    .map((item) => ({
      ...item,
      days_remaining: Math.ceil(
        (new Date(`${item.license_expiry_date}T00:00:00Z`).getTime() - new Date('2026-07-20T00:00:00Z').getTime()) / 86400000,
      ),
    }))
    .sort((left, right) => left.days_remaining - right.days_remaining),
)
const openMaintenanceAlerts = computed(() =>
  maintenances.value.filter((item) => item.status !== 'COMPLETED'),
)
const selectedVehicleAssignments = computed(() => detail.value?.assignments || [])
const selectedVehicleMaintenances = computed(() => detail.value?.maintenances || [])
const selectedVehicleSppgIds = computed(() => {
  const ids = new Set<string>()
  if (detail.value?.vehicle.home_sppg_id) {
    ids.add(detail.value.vehicle.home_sppg_id)
  }
  for (const assignment of selectedVehicleAssignments.value) {
    ids.add(assignment.sppg_id)
  }
  return [...ids]
})
const selectedVehicleDeliveries = computed(() =>
  mockDeliveryOrders.filter((item) => selectedVehicleSppgIds.value.includes(item.sppg_id)),
)
const selectedVehicleRoutes = computed(() =>
  mockDeliveryRoutes.filter((item) => selectedVehicleSppgIds.value.includes(item.sppg_id)),
)
const selectedVehiclePlannedPortions = computed(() =>
  selectedVehicleDeliveries.value.reduce((sum, item) => sum + (item.production_order_id ? 1 : 0), 0),
)
const driverWorkloadRows = computed(() =>
  drivers.value.map((driver) => {
    const driverAssignments = assignments.value.filter((item) => item.driver_id === driver.id)
    const linkedSppgIds = new Set(driverAssignments.map((item) => item.sppg_id))
    const linkedDeliveries = mockDeliveryOrders.filter((item) => linkedSppgIds.has(item.sppg_id))
    return {
      id: driver.id,
      driver_code: driver.driver_code,
      full_name: driver.full_name,
      active_assignments: driverAssignments.filter((item) => item.is_active).length,
      served_sppg_count: linkedSppgIds.size,
      delivery_count: linkedDeliveries.length,
      in_transit_count: linkedDeliveries.filter((item) => item.status === 'IN_TRANSIT').length,
      status: driver.status,
    }
  }),
)
const dispatchReadinessRows = computed(() =>
  vehicles.value.map((vehicle) => {
    const vehicleAssignments = assignments.value.filter((item) => item.vehicle_id === vehicle.id && item.is_active)
    const vehicleMaintenances = maintenances.value.filter(
      (item) => item.vehicle_id === vehicle.id && item.status !== 'COMPLETED',
    )
    const driverCount = new Set(vehicleAssignments.map((item) => item.driver_id).filter(Boolean)).size
    const linkedSppgIds = new Set([
      ...(vehicle.home_sppg_id ? [vehicle.home_sppg_id] : []),
      ...vehicleAssignments.map((item) => item.sppg_id),
    ])
    const linkedRoutes = mockDeliveryRoutes.filter((item) => linkedSppgIds.has(item.sppg_id))
    const linkedDeliveries = mockDeliveryOrders.filter((item) => linkedSppgIds.has(item.sppg_id))

    let readiness = 'READY'
    if (vehicle.status === 'MAINTENANCE' || vehicleMaintenances.length) {
      readiness = 'MAINTENANCE_BLOCK'
    } else if (!vehicleAssignments.length) {
      readiness = 'NO_ASSIGNMENT'
    } else if (!driverCount) {
      readiness = 'NO_DRIVER'
    }

    return {
      id: vehicle.id,
      vehicle_code: vehicle.vehicle_code,
      plate_number: vehicle.plate_number,
      sppg_name: vehicle.home_sppg_name || 'Belum di-home SPPG',
      driver_count: driverCount,
      active_assignments: vehicleAssignments.length,
      open_maintenances: vehicleMaintenances.length,
      route_count: linkedRoutes.length,
      delivery_count: linkedDeliveries.length,
      readiness,
    }
  }),
)
const fleetCostRows = computed(() =>
  vehicles.value.map((vehicle) => {
    const vehicleAssignments = assignments.value.filter((item) => item.vehicle_id === vehicle.id && item.is_active)
    const linkedSppgIds = new Set([
      ...(vehicle.home_sppg_id ? [vehicle.home_sppg_id] : []),
      ...vehicleAssignments.map((item) => item.sppg_id),
    ])
    const routeDistanceKm = mockDeliveryRoutes
      .filter((item) => linkedSppgIds.has(item.sppg_id))
      .reduce((sum, item) => sum + (item.total_distance_km || 0), 0)
    const maintenanceCost = maintenances.value
      .filter((item) => item.vehicle_id === vehicle.id)
      .reduce((sum, item) => sum + (item.cost_amount || 0), 0)
    const fuelCost = fuelLogs.value
      .filter((item) => item.vehicle_id === vehicle.id)
      .reduce((sum, item) => sum + item.liters * item.unit_cost, 0)
    const totalCost = maintenanceCost + fuelCost

    return {
      id: vehicle.id,
      vehicle_code: vehicle.vehicle_code,
      sppg_name: vehicle.home_sppg_name || 'Belum di-home SPPG',
      route_distance_km: routeDistanceKm,
      maintenance_cost: maintenanceCost,
      fuel_cost: fuelCost,
      total_cost: totalCost,
      cost_per_km: routeDistanceKm ? totalCost / routeDistanceKm : 0,
    }
  }),
)
const costBySppgRows = computed(() =>
  utilizationBySppg.value.map((sppg) => {
    const relatedCosts = fleetCostRows.value.filter((item) => item.sppg_name === sppg.sppg_name)
    const fuelCost = relatedCosts.reduce((sum, item) => sum + item.fuel_cost, 0)
    const maintenanceCost = relatedCosts.reduce((sum, item) => sum + item.maintenance_cost, 0)
    const totalCost = relatedCosts.reduce((sum, item) => sum + item.total_cost, 0)

    return {
      id: sppg.id,
      sppg_name: sppg.sppg_name,
      vehicle_count: sppg.vehicle_count,
      delivery_count: sppg.delivery_count,
      fuel_cost: fuelCost,
      maintenance_cost: maintenanceCost,
      total_cost: totalCost,
    }
  }),
)
const utilizationBySppg = computed(() => {
  const bySppg = new Map<string, {
    id: string
    sppg_name: string
    vehicle_count: number
    assigned_vehicle_count: number
    driver_count: number
    delivery_count: number
    route_count: number
  }>()

  for (const vehicle of vehicles.value) {
    const sppgId = vehicle.home_sppg_id || 'unassigned'
    const sppgName = vehicle.home_sppg_name || 'Belum di-home SPPG'
    const current = bySppg.get(sppgId) || {
      id: sppgId,
      sppg_name: sppgName,
      vehicle_count: 0,
      assigned_vehicle_count: 0,
      driver_count: 0,
      delivery_count: 0,
      route_count: 0,
    }
    current.vehicle_count += 1
    if (assignments.value.some((item) => item.vehicle_id === vehicle.id && item.is_active)) {
      current.assigned_vehicle_count += 1
    }
    bySppg.set(sppgId, current)
  }

  for (const assignment of assignments.value) {
    const current = bySppg.get(assignment.sppg_id)
    if (!current) continue
    if (assignment.driver_id) current.driver_count += 1
  }

  for (const delivery of mockDeliveryOrders) {
    const current = bySppg.get(delivery.sppg_id)
    if (!current) continue
    current.delivery_count += 1
  }

  for (const route of mockDeliveryRoutes) {
    const current = bySppg.get(route.sppg_id)
    if (!current) continue
    current.route_count += 1
  }

  return [...bySppg.values()].sort((left, right) => right.vehicle_count - left.vehicle_count)
})
const axisColor = computed(() => (themeMode.value === 'dark' ? '#94a3b8' : '#526072'))
const legendColor = computed(() => (themeMode.value === 'dark' ? '#cbd5e1' : '#334155'))
const gridColor = computed(() =>
  themeMode.value === 'dark' ? 'rgba(148, 163, 184, 0.12)' : 'rgba(51, 65, 85, 0.12)',
)
const baseChartOptions = computed<ApexOptions>(() => ({
  chart: { toolbar: { show: false }, background: 'transparent', foreColor: axisColor.value },
  grid: { borderColor: gridColor.value },
  dataLabels: { enabled: false },
  legend: { labels: { colors: legendColor.value } },
  xaxis: { labels: { style: { colors: axisColor.value } } },
  yaxis: { labels: { style: { colors: axisColor.value } } },
  theme: { mode: themeMode.value },
}))
const fleetStatusOptions = computed<ApexOptions>(() => ({
  ...baseChartOptions.value,
  chart: { ...baseChartOptions.value.chart, type: 'bar' },
  colors: ['#5cf0c6', '#ffcf5a', '#ff8f8f'],
  xaxis: {
    categories: ['ACTIVE', 'MAINTENANCE', 'INACTIVE'],
    labels: { style: { colors: axisColor.value } },
  },
}))
const fleetStatusSeries = computed(() => [
  {
    name: 'Vehicles',
    data: [
      vehicles.value.filter((item) => item.status === 'ACTIVE').length,
      vehicles.value.filter((item) => item.status === 'MAINTENANCE').length,
      vehicles.value.filter((item) => item.status !== 'ACTIVE' && item.status !== 'MAINTENANCE').length,
    ],
  },
])
const sppgUtilizationOptions = computed<ApexOptions>(() => ({
  ...baseChartOptions.value,
  chart: { ...baseChartOptions.value.chart, type: 'bar', stacked: true },
  colors: ['#5cf0c6', '#6ea8fe'],
  xaxis: {
    categories: utilizationBySppg.value.map((item) => item.sppg_name.replace('SPPG ', '')),
    labels: { style: { colors: axisColor.value } },
  },
}))
const sppgUtilizationSeries = computed(() => [
  { name: 'Vehicles', data: utilizationBySppg.value.map((item) => item.vehicle_count) },
  { name: 'Deliveries', data: utilizationBySppg.value.map((item) => item.delivery_count) },
])
const driverLoadOptions = computed<ApexOptions>(() => ({
  ...baseChartOptions.value,
  chart: { ...baseChartOptions.value.chart, type: 'bar' },
  colors: ['#6ea8fe', '#ff8f8f'],
  xaxis: {
    categories: driverWorkloadRows.value.map((item) => item.driver_code),
    labels: { style: { colors: axisColor.value } },
  },
}))
const driverLoadSeries = computed(() => [
  { name: 'Deliveries', data: driverWorkloadRows.value.map((item) => item.delivery_count) },
  { name: 'In Transit', data: driverWorkloadRows.value.map((item) => item.in_transit_count) },
])
const readyVehiclesCount = computed(
  () => dispatchReadinessRows.value.filter((item) => item.readiness === 'READY').length,
)
const blockedVehiclesCount = computed(
  () => dispatchReadinessRows.value.filter((item) => item.readiness !== 'READY').length,
)
const totalFuelCost = computed(() =>
  fuelLogs.value.reduce((sum, item) => sum + item.liters * item.unit_cost, 0),
)
const totalFleetRouteDistance = computed(() =>
  fleetCostRows.value.reduce((sum, item) => sum + item.route_distance_km, 0),
)

const vehicleTypeSearchText = (item: unknown) => {
  const row = item as VehicleTypeRecord
  return [row.code, row.name, row.description].filter(Boolean).join(' ')
}

const vehicleSearchText = (item: unknown) => {
  const row = item as FleetVehicleRecord
  return [row.vehicle_code, row.plate_number, row.vehicle_type_name, row.home_sppg_name, row.status].filter(Boolean).join(' ')
}

const driverSearchText = (item: unknown) => {
  const row = item as FleetDriverRecord
  return [row.driver_code, row.full_name, row.phone_number, row.license_type, row.status].filter(Boolean).join(' ')
}

const assignmentSearchText = (item: unknown) => {
  const row = item as FleetAssignmentRecord
  return [row.vehicle_code, row.plate_number, row.sppg_name, row.driver_name, row.assignment_role, row.status].filter(Boolean).join(' ')
}

const maintenanceSearchText = (item: unknown) => {
  const row = item as FleetMaintenanceRecord
  return [row.vehicle_code, row.plate_number, row.sppg_name, row.maintenance_type, row.vendor_name, row.status].filter(Boolean).join(' ')
}

const selectedVehicleAssignmentSearchText = (item: unknown) => {
  const row = item as FleetAssignmentRecord
  return [row.sppg_name, row.driver_name, row.assignment_role, row.status, row.notes].filter(Boolean).join(' ')
}

const selectedVehicleMaintenanceSearchText = (item: unknown) => {
  const row = item as FleetMaintenanceRecord
  return [row.maintenance_type, row.vendor_name, row.status, row.notes].filter(Boolean).join(' ')
}

const licenseExpirySearchText = (item: unknown) => {
  const row = item as FleetDriverRecord & { days_remaining: number }
  return [row.driver_code, row.full_name, row.license_type, row.license_expiry_date, row.days_remaining].join(' ')
}

const selectedVehicleDeliverySearchText = (item: unknown) => {
  const row = item as DeliveryOrderRecord
  return [row.delivery_number, row.school_name, row.status, row.receiver_name].filter(Boolean).join(' ')
}

const selectedVehicleRouteSearchText = (item: unknown) => {
  const row = item as DeliveryRoutePlanRecord
  return [row.route_code, row.route_name, row.route_status, row.notes].filter(Boolean).join(' ')
}

const driverWorkloadSearchText = (item: unknown) => {
  const row = item as {
    driver_code: string
    full_name: string
    active_assignments: number
    served_sppg_count: number
    delivery_count: number
    in_transit_count: number
    status: string
  }
  return [
    row.driver_code,
    row.full_name,
    row.active_assignments,
    row.served_sppg_count,
    row.delivery_count,
    row.in_transit_count,
    row.status,
  ].join(' ')
}

const dispatchReadinessSearchText = (item: unknown) => {
  const row = item as {
    vehicle_code: string
    plate_number: string
    sppg_name: string
    driver_count: number
    active_assignments: number
    open_maintenances: number
    route_count: number
    delivery_count: number
    readiness: string
  }
  return [
    row.vehicle_code,
    row.plate_number,
    row.sppg_name,
    row.driver_count,
    row.active_assignments,
    row.open_maintenances,
    row.route_count,
    row.delivery_count,
    row.readiness,
  ].join(' ')
}

const fuelLogSearchText = (item: unknown) => {
  const row = item as FuelLogRow
  return [
    row.vehicle_code,
    row.sppg_name,
    row.log_date,
    row.liters,
    row.unit_cost,
    row.odometer_km,
    row.note,
  ].join(' ')
}

const fleetCostSearchText = (item: unknown) => {
  const row = item as {
    vehicle_code: string
    sppg_name: string
    route_distance_km: number
    maintenance_cost: number
    fuel_cost: number
    total_cost: number
    cost_per_km: number
  }
  return [
    row.vehicle_code,
    row.sppg_name,
    row.route_distance_km,
    row.maintenance_cost,
    row.fuel_cost,
    row.total_cost,
    row.cost_per_km,
  ].join(' ')
}

const costBySppgSearchText = (item: unknown) => {
  const row = item as {
    sppg_name: string
    vehicle_count: number
    delivery_count: number
    fuel_cost: number
    maintenance_cost: number
    total_cost: number
  }
  return [
    row.sppg_name,
    row.vehicle_count,
    row.delivery_count,
    row.fuel_cost,
    row.maintenance_cost,
    row.total_cost,
  ].join(' ')
}

const utilizationBySppgSearchText = (item: unknown) => {
  const row = item as {
    sppg_name: string
    vehicle_count: number
    assigned_vehicle_count: number
    driver_count: number
    delivery_count: number
    route_count: number
  }
  return [
    row.sppg_name,
    row.vehicle_count,
    row.assigned_vehicle_count,
    row.driver_count,
    row.delivery_count,
    row.route_count,
  ].join(' ')
}

const selectVehicle = async (vehicleId: string) => {
  selectedVehicleId.value = vehicleId
  await detailState.execute()
}

const reloadFleet = async () => {
  await Promise.all([
    vehicleTypesState.execute(),
    vehiclesState.execute(),
    driversState.execute(),
    assignmentsState.execute(),
    maintenancesState.execute(),
    detailState.execute(),
  ])
}

const submitVehicleType = async () => {
  saving.value = true
  try {
    await createVehicleType({
      tenant_id: vehicleTypeForm.tenant_id,
      code: vehicleTypeForm.code,
      name: vehicleTypeForm.name,
      description: vehicleTypeForm.description,
      capacity_portions: Number(vehicleTypeForm.capacity_portions),
      capacity_kg: Number(vehicleTypeForm.capacity_kg),
      temperature_controlled: vehicleTypeForm.temperature_controlled,
      is_active: vehicleTypeForm.is_active,
    })
    await vehicleTypesState.execute()
  } finally {
    saving.value = false
  }
}

const submitVehicle = async () => {
  saving.value = true
  try {
    const created = await createFleetVehicle({
      tenant_id: vehicleForm.tenant_id,
      home_sppg_id: vehicleForm.home_sppg_id,
      vehicle_type_id: vehicleForm.vehicle_type_id,
      vehicle_code: vehicleForm.vehicle_code,
      plate_number: vehicleForm.plate_number,
      ownership_status: vehicleForm.ownership_status,
      brand_name: vehicleForm.brand_name,
      model_name: vehicleForm.model_name,
      manufacture_year: Number(vehicleForm.manufacture_year),
      capacity_portions: Number(vehicleForm.capacity_portions),
      fuel_type: vehicleForm.fuel_type,
      status: vehicleForm.status,
      is_active: vehicleForm.is_active,
      notes: vehicleForm.notes,
    })
    await vehiclesState.execute()
    await selectVehicle(created.id)
  } finally {
    saving.value = false
  }
}

const submitDriver = async () => {
  saving.value = true
  try {
    await createFleetDriver({
      tenant_id: driverForm.tenant_id,
      driver_code: driverForm.driver_code,
      full_name: driverForm.full_name,
      phone_number: driverForm.phone_number,
      license_number: driverForm.license_number,
      license_type: driverForm.license_type,
      license_expiry_date: driverForm.license_expiry_date,
      status: driverForm.status,
      is_active: driverForm.is_active,
      notes: driverForm.notes,
    })
    await driversState.execute()
  } finally {
    saving.value = false
  }
}

const submitAssignment = async () => {
  saving.value = true
  try {
    await createFleetAssignment(assignmentForm.vehicle_id, {
      sppg_id: assignmentForm.sppg_id,
      driver_id: assignmentForm.driver_id,
      assignment_date: assignmentForm.assignment_date,
      end_date: assignmentForm.end_date || null,
      assignment_role: assignmentForm.assignment_role,
      status: assignmentForm.status,
      is_active: assignmentForm.is_active,
      notes: assignmentForm.notes,
    })
    await reloadFleet()
  } finally {
    saving.value = false
  }
}

const submitMaintenance = async () => {
  saving.value = true
  try {
    await createFleetMaintenance(maintenanceForm.vehicle_id, {
      sppg_id: maintenanceForm.sppg_id,
      maintenance_date: maintenanceForm.maintenance_date,
      maintenance_type: maintenanceForm.maintenance_type,
      odometer_km: Number(maintenanceForm.odometer_km),
      cost_amount: Number(maintenanceForm.cost_amount),
      vendor_name: maintenanceForm.vendor_name,
      status: maintenanceForm.status,
      notes: maintenanceForm.notes,
    })
    await reloadFleet()
  } finally {
    saving.value = false
  }
}

const submitFuelLog = async () => {
  const vehicle = vehicles.value.find((item) => item.id === fuelLogForm.vehicle_id)
  if (!vehicle) return

  fuelLogs.value = [
    {
      id: `fuel-log-${Date.now()}`,
      vehicle_id: vehicle.id,
      vehicle_code: vehicle.vehicle_code,
      sppg_name: vehicle.home_sppg_name || 'Belum di-home SPPG',
      log_date: fuelLogForm.log_date,
      liters: Number(fuelLogForm.liters),
      unit_cost: Number(fuelLogForm.unit_cost),
      odometer_km: Number(fuelLogForm.odometer_km),
      note: fuelLogForm.note,
    },
    ...fuelLogs.value,
  ]
}
</script>

<template>
  <div class="space-y-6">
    <PageHeader
      title="Fleet Workspace"
      subtitle="Kelola tipe armada, kendaraan, driver, assignment kendaraan ke dapur, dan maintenance dalam satu workspace operasional distribusi."
      :badges="['Vehicle Types', 'Vehicles', 'Assignments & Maintenance']"
    />

    <section class="grid gap-4 xl:grid-cols-4">
      <article class="glass-panel p-5">
        <p class="text-sm text-app-muted">Vehicle types</p>
        <p class="mt-3 font-display text-3xl text-app-heading">{{ vehicleTypes.length }}</p>
        <p class="mt-2 text-sm text-app-body">Master tipe armada aktif yayasan.</p>
      </article>
      <article class="glass-panel p-5">
        <p class="text-sm text-app-muted">Vehicles</p>
        <p class="mt-3 font-display text-3xl text-app-heading">{{ vehicles.length }}</p>
        <p class="mt-2 text-sm text-app-body">Armada yang tersedia untuk operasi.</p>
      </article>
      <article class="glass-panel p-5">
        <p class="text-sm text-app-muted">Drivers</p>
        <p class="mt-3 font-display text-3xl text-app-heading">{{ drivers.length }}</p>
        <p class="mt-2 text-sm text-app-body">Driver yang siap diassign.</p>
      </article>
      <article class="glass-panel p-5">
        <p class="text-sm text-app-muted">Open maintenance</p>
        <p class="mt-3 font-display text-3xl text-app-heading">{{ openMaintenanceAlerts.length }}</p>
        <p class="mt-2 text-sm text-app-body">Perlu tindak lanjut sebelum full dispatch.</p>
      </article>
      <article class="glass-panel p-5">
        <p class="text-sm text-app-muted">Dispatch ready</p>
        <p class="mt-3 font-display text-3xl text-app-heading">{{ readyVehiclesCount }}</p>
        <p class="mt-2 text-sm text-app-body">Armada siap jalan tanpa blocker operasional.</p>
      </article>
      <article class="glass-panel p-5">
        <p class="text-sm text-app-muted">Dispatch blocked</p>
        <p class="mt-3 font-display text-3xl text-app-heading">{{ blockedVehiclesCount }}</p>
        <p class="mt-2 text-sm text-app-body">Perlu assignment, driver, atau clearance maintenance.</p>
      </article>
      <article class="glass-panel p-5">
        <p class="text-sm text-app-muted">Fuel spend</p>
        <p class="mt-3 font-display text-3xl text-app-heading">{{ formatCurrency(totalFuelCost) }}</p>
        <p class="mt-2 text-sm text-app-body">Akumulasi fuel log frontend untuk monitoring cepat.</p>
      </article>
      <article class="glass-panel p-5">
        <p class="text-sm text-app-muted">Route distance</p>
        <p class="mt-3 font-display text-3xl text-app-heading">{{ formatNumber(totalFleetRouteDistance) }} km</p>
        <p class="mt-2 text-sm text-app-body">Total jarak route yang terkait coverage armada.</p>
      </article>
      <article class="glass-panel p-5 xl:col-span-4">
        <div class="grid gap-4 md:grid-cols-2">
          <div class="surface-subtle rounded-3xl p-4">
            <p class="text-sm text-app-muted">SIM paling dekat jatuh tempo</p>
            <p class="mt-2 font-semibold text-app-heading">
              {{ licenseExpiryAlerts[0]?.full_name || 'Belum ada data' }}
            </p>
            <p class="mt-2 text-sm text-app-body">
              {{ licenseExpiryAlerts[0]?.license_expiry_date ? `Berakhir ${formatDate(licenseExpiryAlerts[0].license_expiry_date)}` : 'Tidak ada alert SIM.' }}
            </p>
          </div>
          <div class="surface-subtle rounded-3xl p-4">
            <p class="text-sm text-app-muted">Maintenance terdekat</p>
            <p class="mt-2 font-semibold text-app-heading">
              {{ openMaintenanceAlerts[0]?.vehicle_code || 'Belum ada data' }}
            </p>
            <p class="mt-2 text-sm text-app-body">
              {{ openMaintenanceAlerts[0]?.maintenance_date ? `${openMaintenanceAlerts[0].maintenance_type} pada ${formatDate(openMaintenanceAlerts[0].maintenance_date)}` : 'Tidak ada maintenance terbuka.' }}
            </p>
          </div>
        </div>
      </article>
    </section>

    <section class="grid gap-6 xl:grid-cols-3">
      <ChartPanel
        title="Fleet Status"
        subtitle="Komposisi armada aktif, maintenance, dan non-aktif."
        type="bar"
        :options="fleetStatusOptions"
        :series="fleetStatusSeries"
        :height="280"
      />
      <ChartPanel
        title="SPPG Utilization"
        subtitle="Perbandingan jumlah armada dan delivery pada tiap dapur."
        type="bar"
        :options="sppgUtilizationOptions"
        :series="sppgUtilizationSeries"
        :height="280"
      />
      <ChartPanel
        title="Driver Load"
        subtitle="Ringkasan delivery dan in-transit per driver aktif."
        type="bar"
        :options="driverLoadOptions"
        :series="driverLoadSeries"
        :height="280"
      />
    </section>

    <section class="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
      <DataTableCard
        :items="vehicles"
        :search-text-resolver="vehicleSearchText"
        search-placeholder="Cari vehicle code, plate, type, SPPG..."
        title="Fleet Vehicles"
      >
        <template #table="{ items }">
          <table class="data-table">
            <thead><tr><th>Vehicle</th><th>Type</th><th>Home SPPG</th><th>Capacity</th><th>Status</th><th>Aksi</th></tr></thead>
            <tbody>
              <tr v-for="item in items" :key="(item as FleetVehicleRecord).id">
                <td>
                  <p>{{ (item as FleetVehicleRecord).vehicle_code }}</p>
                  <p class="mt-1 text-xs text-app-muted">{{ (item as FleetVehicleRecord).plate_number }}</p>
                </td>
                <td>{{ (item as FleetVehicleRecord).vehicle_type_name || '-' }}</td>
                <td>{{ (item as FleetVehicleRecord).home_sppg_name || '-' }}</td>
                <td>{{ formatNumber((item as FleetVehicleRecord).capacity_portions || 0) }} porsi</td>
                <td><StatusBadge :status="(item as FleetVehicleRecord).status" /></td>
                <td>
                  <div class="flex flex-wrap gap-2">
                    <button class="secondary-button" type="button" @click="selectVehicle((item as FleetVehicleRecord).id)">Preview</button>
                    <RouterLink class="secondary-button" :to="`/fleet/vehicles/${(item as FleetVehicleRecord).id}`">Detail</RouterLink>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </template>
      </DataTableCard>

      <article class="glass-panel p-6">
        <p class="eyebrow-text">Selected Vehicle</p>
        <div v-if="detail" class="mt-5 grid gap-4">
          <div class="surface-subtle rounded-3xl p-4">
            <p class="text-sm text-app-muted">Vehicle</p>
            <p class="mt-2 font-display text-2xl text-app-heading">{{ detail.vehicle.vehicle_code }}</p>
            <p class="mt-2 text-sm text-app-body">{{ detail.vehicle.plate_number }} | {{ detail.vehicle.brand_name || '-' }} {{ detail.vehicle.model_name || '' }}</p>
          </div>
          <div class="grid gap-4 md:grid-cols-2">
            <div class="surface-subtle rounded-3xl p-4"><p class="text-sm text-app-muted">Type</p><p class="mt-2 font-semibold text-app-heading">{{ detail.vehicle.vehicle_type_name || '-' }}</p></div>
            <div class="surface-subtle rounded-3xl p-4"><p class="text-sm text-app-muted">Home SPPG</p><p class="mt-2 font-semibold text-app-heading">{{ detail.vehicle.home_sppg_name || '-' }}</p></div>
            <div class="surface-subtle rounded-3xl p-4"><p class="text-sm text-app-muted">Fuel</p><p class="mt-2 font-semibold text-app-heading">{{ detail.vehicle.fuel_type || '-' }}</p></div>
            <div class="surface-subtle rounded-3xl p-4"><p class="text-sm text-app-muted">Assignments</p><p class="mt-2 font-semibold text-app-heading">{{ formatNumber(detail.assignments.length) }}</p></div>
            <div class="surface-subtle rounded-3xl p-4"><p class="text-sm text-app-muted">Maintenances</p><p class="mt-2 font-semibold text-app-heading">{{ formatNumber(detail.maintenances.length) }}</p></div>
            <div class="surface-subtle rounded-3xl p-4"><p class="text-sm text-app-muted">Status</p><div class="mt-2"><StatusBadge :status="detail.vehicle.status" /></div></div>
          </div>
        </div>
      </article>
    </section>

    <section class="grid gap-6 xl:grid-cols-1">
      <DataTableCard
        :items="utilizationBySppg"
        :search-text-resolver="utilizationBySppgSearchText"
        search-placeholder="Cari SPPG, vehicle, driver, delivery..."
        title="Fleet Utilization by SPPG"
      >
        <template #table="{ items }">
          <table class="data-table">
            <thead><tr><th>SPPG</th><th>Vehicles</th><th>Assigned</th><th>Drivers</th><th>Deliveries</th><th>Routes</th></tr></thead>
            <tbody>
              <tr v-for="item in items" :key="(item as { id: string }).id">
                <td>{{ (item as { sppg_name: string }).sppg_name }}</td>
                <td>{{ formatNumber((item as { vehicle_count: number }).vehicle_count) }}</td>
                <td>{{ formatNumber((item as { assigned_vehicle_count: number }).assigned_vehicle_count) }}</td>
                <td>{{ formatNumber((item as { driver_count: number }).driver_count) }}</td>
                <td>{{ formatNumber((item as { delivery_count: number }).delivery_count) }}</td>
                <td>{{ formatNumber((item as { route_count: number }).route_count) }}</td>
              </tr>
            </tbody>
          </table>
        </template>
      </DataTableCard>
    </section>

    <section v-if="detail" class="grid gap-6 xl:grid-cols-2">
      <DataTableCard
        :items="selectedVehicleAssignments"
        :search-text-resolver="selectedVehicleAssignmentSearchText"
        search-placeholder="Cari SPPG, driver, role, status..."
        title="Assignment History Kendaraan"
      >
        <template #table="{ items }">
          <table class="data-table">
            <thead><tr><th>SPPG</th><th>Driver</th><th>Tanggal</th><th>Role</th><th>Status</th></tr></thead>
            <tbody>
              <tr v-for="item in items" :key="(item as FleetAssignmentRecord).id">
                <td>{{ (item as FleetAssignmentRecord).sppg_name || '-' }}</td>
                <td>{{ (item as FleetAssignmentRecord).driver_name || '-' }}</td>
                <td>{{ formatDate((item as FleetAssignmentRecord).assignment_date) }}</td>
                <td>{{ (item as FleetAssignmentRecord).assignment_role }}</td>
                <td><StatusBadge :status="(item as FleetAssignmentRecord).status" /></td>
              </tr>
            </tbody>
          </table>
        </template>
      </DataTableCard>

      <DataTableCard
        :items="selectedVehicleMaintenances"
        :search-text-resolver="selectedVehicleMaintenanceSearchText"
        search-placeholder="Cari maintenance, vendor, status..."
        title="Maintenance History Kendaraan"
      >
        <template #table="{ items }">
          <table class="data-table">
            <thead><tr><th>Tanggal</th><th>Tipe</th><th>Vendor</th><th>Biaya</th><th>Status</th></tr></thead>
            <tbody>
              <tr v-for="item in items" :key="(item as FleetMaintenanceRecord).id">
                <td>{{ formatDate((item as FleetMaintenanceRecord).maintenance_date) }}</td>
                <td>{{ (item as FleetMaintenanceRecord).maintenance_type }}</td>
                <td>{{ (item as FleetMaintenanceRecord).vendor_name || '-' }}</td>
                <td>{{ formatCurrency((item as FleetMaintenanceRecord).cost_amount || 0) }}</td>
                <td><StatusBadge :status="(item as FleetMaintenanceRecord).status" /></td>
              </tr>
            </tbody>
          </table>
        </template>
      </DataTableCard>
    </section>

    <section v-if="detail" class="grid gap-6 xl:grid-cols-4">
      <article class="glass-panel p-5">
        <p class="text-sm text-app-muted">Linked deliveries</p>
        <p class="mt-3 font-display text-3xl text-app-heading">{{ formatNumber(selectedVehicleDeliveries.length) }}</p>
        <p class="mt-2 text-sm text-app-body">Terkait SPPG home/assignment kendaraan ini.</p>
      </article>
      <article class="glass-panel p-5">
        <p class="text-sm text-app-muted">Linked routes</p>
        <p class="mt-3 font-display text-3xl text-app-heading">{{ formatNumber(selectedVehicleRoutes.length) }}</p>
        <p class="mt-2 text-sm text-app-body">Rute distribusi pada dapur yang dilayani kendaraan.</p>
      </article>
      <article class="glass-panel p-5">
        <p class="text-sm text-app-muted">Assignment coverage</p>
        <p class="mt-3 font-display text-3xl text-app-heading">{{ formatNumber(selectedVehicleSppgIds.length) }}</p>
        <p class="mt-2 text-sm text-app-body">Jumlah dapur yang tercakup oleh home/assignment.</p>
      </article>
      <article class="glass-panel p-5">
        <p class="text-sm text-app-muted">Delivery-linked workload</p>
        <p class="mt-3 font-display text-3xl text-app-heading">{{ formatNumber(selectedVehiclePlannedPortions) }}</p>
        <p class="mt-2 text-sm text-app-body">Indikator beban dari jumlah delivery terkait.</p>
      </article>
    </section>

    <section v-if="detail" class="grid gap-6 xl:grid-cols-2">
      <DataTableCard
        :items="selectedVehicleDeliveries"
        :search-text-resolver="selectedVehicleDeliverySearchText"
        search-placeholder="Cari delivery, sekolah, status..."
        title="Related Deliveries by SPPG Coverage"
      >
        <template #table="{ items }">
          <table class="data-table">
            <thead><tr><th>Delivery</th><th>Sekolah</th><th>SPPG</th><th>Planned Arrival</th><th>Status</th></tr></thead>
            <tbody>
              <tr v-for="item in items" :key="(item as DeliveryOrderRecord).id">
                <td>{{ (item as DeliveryOrderRecord).delivery_number }}</td>
                <td>{{ (item as DeliveryOrderRecord).school_name || '-' }}</td>
                <td>{{ detail?.vehicle.home_sppg_name || (item as DeliveryOrderRecord).sppg_id }}</td>
                <td>{{ formatDate((item as DeliveryOrderRecord).planned_arrival.slice(0, 10)) }}</td>
                <td><StatusBadge :status="(item as DeliveryOrderRecord).status" /></td>
              </tr>
            </tbody>
          </table>
        </template>
      </DataTableCard>

      <DataTableCard
        :items="selectedVehicleRoutes"
        :search-text-resolver="selectedVehicleRouteSearchText"
        search-placeholder="Cari route code, name, status..."
        title="Related Routes by SPPG Coverage"
      >
        <template #table="{ items }">
          <table class="data-table">
            <thead><tr><th>Route</th><th>SPPG</th><th>Planned Departure</th><th>Distance</th><th>Status</th></tr></thead>
            <tbody>
              <tr v-for="item in items" :key="(item as DeliveryRoutePlanRecord).id">
                <td>
                  <p>{{ (item as DeliveryRoutePlanRecord).route_code }}</p>
                  <p class="mt-1 text-xs text-app-muted">{{ (item as DeliveryRoutePlanRecord).route_name }}</p>
                </td>
                <td>{{ detail?.vehicle.home_sppg_name || (item as DeliveryRoutePlanRecord).sppg_id }}</td>
                <td>{{ formatDate((item as DeliveryRoutePlanRecord).planned_departure.slice(0, 10)) }}</td>
                <td>{{ formatNumber((item as DeliveryRoutePlanRecord).total_distance_km || 0) }} km</td>
                <td><StatusBadge :status="(item as DeliveryRoutePlanRecord).route_status" /></td>
              </tr>
            </tbody>
          </table>
        </template>
      </DataTableCard>
    </section>

    <section class="grid gap-6 xl:grid-cols-2">
      <DataTableCard
        :items="assignments"
        :search-text-resolver="assignmentSearchText"
        search-placeholder="Cari kendaraan, SPPG, driver, role..."
        title="Fleet Assignments"
      >
        <template #table="{ items }">
          <table class="data-table">
            <thead><tr><th>Vehicle</th><th>SPPG</th><th>Driver</th><th>Date</th><th>Role</th><th>Status</th></tr></thead>
            <tbody>
              <tr v-for="item in items" :key="(item as FleetAssignmentRecord).id">
                <td>{{ (item as FleetAssignmentRecord).vehicle_code }} / {{ (item as FleetAssignmentRecord).plate_number }}</td>
                <td>{{ (item as FleetAssignmentRecord).sppg_name || '-' }}</td>
                <td>{{ (item as FleetAssignmentRecord).driver_name || '-' }}</td>
                <td>{{ formatDate((item as FleetAssignmentRecord).assignment_date) }}</td>
                <td>{{ (item as FleetAssignmentRecord).assignment_role }}</td>
                <td><StatusBadge :status="(item as FleetAssignmentRecord).status" /></td>
              </tr>
            </tbody>
          </table>
        </template>
      </DataTableCard>

      <DataTableCard
        :items="maintenances"
        :search-text-resolver="maintenanceSearchText"
        search-placeholder="Cari kendaraan, SPPG, maintenance, vendor..."
        title="Fleet Maintenances"
      >
        <template #table="{ items }">
          <table class="data-table">
            <thead><tr><th>Vehicle</th><th>Date</th><th>Type</th><th>Vendor</th><th>Cost</th><th>Status</th></tr></thead>
            <tbody>
              <tr v-for="item in items" :key="(item as FleetMaintenanceRecord).id">
                <td>{{ (item as FleetMaintenanceRecord).vehicle_code }} / {{ (item as FleetMaintenanceRecord).plate_number }}</td>
                <td>{{ formatDate((item as FleetMaintenanceRecord).maintenance_date) }}</td>
                <td>{{ (item as FleetMaintenanceRecord).maintenance_type }}</td>
                <td>{{ (item as FleetMaintenanceRecord).vendor_name || '-' }}</td>
                <td>{{ formatCurrency((item as FleetMaintenanceRecord).cost_amount || 0) }}</td>
                <td><StatusBadge :status="(item as FleetMaintenanceRecord).status" /></td>
              </tr>
            </tbody>
          </table>
        </template>
      </DataTableCard>
    </section>

    <section class="grid gap-6 xl:grid-cols-1">
      <DataTableCard
        :items="dispatchReadinessRows"
        :search-text-resolver="dispatchReadinessSearchText"
        search-placeholder="Cari vehicle, SPPG, readiness, assignment..."
        title="Dispatch Readiness Board"
      >
        <template #table="{ items }">
          <table class="data-table">
            <thead><tr><th>Vehicle</th><th>SPPG</th><th>Driver</th><th>Assignments</th><th>Open Maintenance</th><th>Routes</th><th>Deliveries</th><th>Readiness</th></tr></thead>
            <tbody>
              <tr v-for="item in items" :key="(item as { id: string }).id">
                <td>
                  <p>{{ (item as { vehicle_code: string }).vehicle_code }}</p>
                  <p class="mt-1 text-xs text-app-muted">{{ (item as { plate_number: string }).plate_number }}</p>
                </td>
                <td>{{ (item as { sppg_name: string }).sppg_name }}</td>
                <td>{{ formatNumber((item as { driver_count: number }).driver_count) }}</td>
                <td>{{ formatNumber((item as { active_assignments: number }).active_assignments) }}</td>
                <td>{{ formatNumber((item as { open_maintenances: number }).open_maintenances) }}</td>
                <td>{{ formatNumber((item as { route_count: number }).route_count) }}</td>
                <td>{{ formatNumber((item as { delivery_count: number }).delivery_count) }}</td>
                <td><StatusBadge :status="(item as { readiness: string }).readiness" /></td>
              </tr>
            </tbody>
          </table>
        </template>
      </DataTableCard>
    </section>

    <section class="grid gap-6 xl:grid-cols-2">
      <DataTableCard
        :items="fleetCostRows"
        :search-text-resolver="fleetCostSearchText"
        search-placeholder="Cari vehicle, SPPG, cost, distance..."
        title="Fleet Cost per Vehicle"
      >
        <template #table="{ items }">
          <table class="data-table">
            <thead><tr><th>Vehicle</th><th>SPPG</th><th>Route KM</th><th>Fuel</th><th>Maintenance</th><th>Total</th><th>Cost/KM</th></tr></thead>
            <tbody>
              <tr v-for="item in items" :key="(item as { id: string }).id">
                <td>{{ (item as { vehicle_code: string }).vehicle_code }}</td>
                <td>{{ (item as { sppg_name: string }).sppg_name }}</td>
                <td>{{ formatNumber((item as { route_distance_km: number }).route_distance_km) }}</td>
                <td>{{ formatCurrency((item as { fuel_cost: number }).fuel_cost) }}</td>
                <td>{{ formatCurrency((item as { maintenance_cost: number }).maintenance_cost) }}</td>
                <td>{{ formatCurrency((item as { total_cost: number }).total_cost) }}</td>
                <td>{{ formatCurrency((item as { cost_per_km: number }).cost_per_km) }}</td>
              </tr>
            </tbody>
          </table>
        </template>
      </DataTableCard>

      <DataTableCard
        :items="costBySppgRows"
        :search-text-resolver="costBySppgSearchText"
        search-placeholder="Cari SPPG, delivery, fuel, maintenance..."
        title="Fleet Cost by SPPG"
      >
        <template #table="{ items }">
          <table class="data-table">
            <thead><tr><th>SPPG</th><th>Vehicles</th><th>Deliveries</th><th>Fuel</th><th>Maintenance</th><th>Total</th></tr></thead>
            <tbody>
              <tr v-for="item in items" :key="(item as { id: string }).id">
                <td>{{ (item as { sppg_name: string }).sppg_name }}</td>
                <td>{{ formatNumber((item as { vehicle_count: number }).vehicle_count) }}</td>
                <td>{{ formatNumber((item as { delivery_count: number }).delivery_count) }}</td>
                <td>{{ formatCurrency((item as { fuel_cost: number }).fuel_cost) }}</td>
                <td>{{ formatCurrency((item as { maintenance_cost: number }).maintenance_cost) }}</td>
                <td>{{ formatCurrency((item as { total_cost: number }).total_cost) }}</td>
              </tr>
            </tbody>
          </table>
        </template>
      </DataTableCard>
    </section>

    <section class="grid gap-6 xl:grid-cols-2">
      <DataTableCard
        :items="fuelLogs"
        :search-text-resolver="fuelLogSearchText"
        search-placeholder="Cari vehicle, SPPG, tanggal, odometer..."
        title="Fuel Log"
      >
        <template #table="{ items }">
          <table class="data-table">
            <thead><tr><th>Date</th><th>Vehicle</th><th>SPPG</th><th>Liters</th><th>Unit Cost</th><th>Total</th><th>Odometer</th></tr></thead>
            <tbody>
              <tr v-for="item in items" :key="(item as FuelLogRow).id">
                <td>{{ formatDate((item as FuelLogRow).log_date) }}</td>
                <td>{{ (item as FuelLogRow).vehicle_code }}</td>
                <td>{{ (item as FuelLogRow).sppg_name }}</td>
                <td>{{ formatNumber((item as FuelLogRow).liters) }} L</td>
                <td>{{ formatCurrency((item as FuelLogRow).unit_cost) }}</td>
                <td>{{ formatCurrency((item as FuelLogRow).liters * (item as FuelLogRow).unit_cost) }}</td>
                <td>{{ formatNumber((item as FuelLogRow).odometer_km) }} km</td>
              </tr>
            </tbody>
          </table>
        </template>
      </DataTableCard>

      <article class="glass-panel p-6">
        <div class="flex items-center justify-between gap-3">
          <div><p class="eyebrow-text">Fuel Log</p><h2 class="mt-2 font-display text-2xl text-app-heading">Catat konsumsi bahan bakar</h2></div>
          <span class="status-pill">Frontend Operational Log</span>
        </div>
        <form class="mt-6 grid gap-4" @submit.prevent="submitFuelLog">
          <label class="form-field"><span>Vehicle ID</span><input v-model="fuelLogForm.vehicle_id" class="toolbar-input" required /></label>
          <label class="form-field"><span>Log date</span><input v-model="fuelLogForm.log_date" class="toolbar-input" type="date" required /></label>
          <label class="form-field"><span>Liters</span><input v-model.number="fuelLogForm.liters" class="toolbar-input" min="0" step="0.1" type="number" required /></label>
          <label class="form-field"><span>Unit cost</span><input v-model.number="fuelLogForm.unit_cost" class="toolbar-input" min="0" type="number" required /></label>
          <label class="form-field"><span>Odometer KM</span><input v-model.number="fuelLogForm.odometer_km" class="toolbar-input" min="0" type="number" required /></label>
          <label class="form-field"><span>Notes</span><textarea v-model="fuelLogForm.note" class="toolbar-input min-h-24" /></label>
          <div class="flex justify-end"><button class="primary-button" type="submit">Simpan Fuel Log</button></div>
        </form>
      </article>
    </section>

    <section class="grid gap-6 xl:grid-cols-1">
      <DataTableCard
        :items="driverWorkloadRows"
        :search-text-resolver="driverWorkloadSearchText"
        search-placeholder="Cari driver, assignment, delivery..."
        title="Driver Workload Summary"
      >
        <template #table="{ items }">
          <table class="data-table">
            <thead><tr><th>Driver</th><th>Active Assignments</th><th>SPPG Served</th><th>Deliveries</th><th>In Transit</th><th>Status</th></tr></thead>
            <tbody>
              <tr v-for="item in items" :key="(item as { id: string }).id">
                <td>
                  <p>{{ (item as { full_name: string }).full_name }}</p>
                  <p class="mt-1 text-xs text-app-muted">{{ (item as { driver_code: string }).driver_code }}</p>
                </td>
                <td>{{ formatNumber((item as { active_assignments: number }).active_assignments) }}</td>
                <td>{{ formatNumber((item as { served_sppg_count: number }).served_sppg_count) }}</td>
                <td>{{ formatNumber((item as { delivery_count: number }).delivery_count) }}</td>
                <td>{{ formatNumber((item as { in_transit_count: number }).in_transit_count) }}</td>
                <td><StatusBadge :status="(item as { status: string }).status" /></td>
              </tr>
            </tbody>
          </table>
        </template>
      </DataTableCard>
    </section>

    <section class="grid gap-6 xl:grid-cols-2">
      <DataTableCard
        :items="licenseExpiryAlerts"
        :search-text-resolver="licenseExpirySearchText"
        search-placeholder="Cari driver, tipe SIM, expiry..."
        title="License Expiry Alerts"
      >
        <template #table="{ items }">
          <table class="data-table">
            <thead><tr><th>Driver</th><th>SIM</th><th>Expiry</th><th>Sisa Hari</th><th>Status</th></tr></thead>
            <tbody>
              <tr v-for="item in items" :key="(item as FleetDriverRecord & { days_remaining: number }).id">
                <td>
                  <p>{{ (item as FleetDriverRecord & { days_remaining: number }).full_name }}</p>
                  <p class="mt-1 text-xs text-app-muted">{{ (item as FleetDriverRecord & { days_remaining: number }).driver_code }}</p>
                </td>
                <td>{{ (item as FleetDriverRecord & { days_remaining: number }).license_type || '-' }}</td>
                <td>{{ (item as FleetDriverRecord & { days_remaining: number }).license_expiry_date ? formatDate((item as FleetDriverRecord & { days_remaining: number }).license_expiry_date as string) : '-' }}</td>
                <td>{{ formatNumber((item as FleetDriverRecord & { days_remaining: number }).days_remaining) }}</td>
                <td>
                  <StatusBadge
                    :status="(item as FleetDriverRecord & { days_remaining: number }).days_remaining <= 30 ? 'PENDING' : 'ACTIVE'"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </template>
      </DataTableCard>

      <DataTableCard
        :items="openMaintenanceAlerts"
        :search-text-resolver="maintenanceSearchText"
        search-placeholder="Cari vehicle, maintenance, vendor..."
        title="Open Maintenance Alerts"
      >
        <template #table="{ items }">
          <table class="data-table">
            <thead><tr><th>Vehicle</th><th>SPPG</th><th>Tanggal</th><th>Tipe</th><th>Status</th></tr></thead>
            <tbody>
              <tr v-for="item in items" :key="(item as FleetMaintenanceRecord).id">
                <td>{{ (item as FleetMaintenanceRecord).vehicle_code }} / {{ (item as FleetMaintenanceRecord).plate_number }}</td>
                <td>{{ (item as FleetMaintenanceRecord).sppg_name || '-' }}</td>
                <td>{{ formatDate((item as FleetMaintenanceRecord).maintenance_date) }}</td>
                <td>{{ (item as FleetMaintenanceRecord).maintenance_type }}</td>
                <td><StatusBadge :status="(item as FleetMaintenanceRecord).status" /></td>
              </tr>
            </tbody>
          </table>
        </template>
      </DataTableCard>
    </section>

    <section class="grid gap-6 xl:grid-cols-2">
      <DataTableCard
        :items="vehicleTypes"
        :search-text-resolver="vehicleTypeSearchText"
        search-placeholder="Cari code, nama, deskripsi..."
        title="Vehicle Types"
      >
        <template #table="{ items }">
          <table class="data-table">
            <thead><tr><th>Type</th><th>Capacity</th><th>Temp Controlled</th><th>Active</th></tr></thead>
            <tbody>
              <tr v-for="item in items" :key="(item as VehicleTypeRecord).id">
                <td>
                  <p>{{ (item as VehicleTypeRecord).name }}</p>
                  <p class="mt-1 text-xs text-app-muted">{{ (item as VehicleTypeRecord).code }}</p>
                </td>
                <td>{{ formatNumber((item as VehicleTypeRecord).capacity_portions || 0) }} porsi</td>
                <td><StatusBadge :status="(item as VehicleTypeRecord).temperature_controlled ? 'ACTIVE' : 'DRAFT'" /></td>
                <td><StatusBadge :status="(item as VehicleTypeRecord).is_active ? 'APPROVED' : 'REJECTED'" /></td>
              </tr>
            </tbody>
          </table>
        </template>
      </DataTableCard>

      <DataTableCard
        :items="drivers"
        :search-text-resolver="driverSearchText"
        search-placeholder="Cari code, nama, SIM, status..."
        title="Fleet Drivers"
      >
        <template #table="{ items }">
          <table class="data-table">
            <thead><tr><th>Driver</th><th>Phone</th><th>License</th><th>Expiry</th><th>Status</th></tr></thead>
            <tbody>
              <tr v-for="item in items" :key="(item as FleetDriverRecord).id">
                <td>
                  <p>{{ (item as FleetDriverRecord).full_name }}</p>
                  <p class="mt-1 text-xs text-app-muted">{{ (item as FleetDriverRecord).driver_code }}</p>
                </td>
                <td>{{ (item as FleetDriverRecord).phone_number || '-' }}</td>
                <td>{{ (item as FleetDriverRecord).license_type || '-' }} / {{ (item as FleetDriverRecord).license_number || '-' }}</td>
                <td>{{ (item as FleetDriverRecord).license_expiry_date ? formatDate((item as FleetDriverRecord).license_expiry_date as string) : '-' }}</td>
                <td><StatusBadge :status="(item as FleetDriverRecord).status" /></td>
              </tr>
            </tbody>
          </table>
        </template>
      </DataTableCard>
    </section>

    <section class="grid gap-6 xl:grid-cols-3">
      <article class="glass-panel p-6">
        <div class="flex items-center justify-between gap-3">
          <div><p class="eyebrow-text">Vehicle Type</p><h2 class="mt-2 font-display text-2xl text-app-heading">Buat tipe armada</h2></div>
          <span class="status-pill">POST /fleet/vehicle-types</span>
        </div>
        <form class="mt-6 grid gap-4" @submit.prevent="submitVehicleType">
          <label class="form-field"><span>Code</span><input v-model="vehicleTypeForm.code" class="toolbar-input" required /></label>
          <label class="form-field"><span>Name</span><input v-model="vehicleTypeForm.name" class="toolbar-input" required /></label>
          <label class="form-field"><span>Capacity Portions</span><input v-model.number="vehicleTypeForm.capacity_portions" class="toolbar-input" min="0" type="number" required /></label>
          <label class="form-field"><span>Capacity Kg</span><input v-model.number="vehicleTypeForm.capacity_kg" class="toolbar-input" min="0" type="number" required /></label>
          <label class="form-field"><span>Description</span><textarea v-model="vehicleTypeForm.description" class="toolbar-input min-h-24" /></label>
          <div class="flex justify-end"><button class="primary-button" :disabled="saving" type="submit">{{ saving ? 'Menyimpan...' : 'Simpan Type' }}</button></div>
        </form>
      </article>

      <article class="glass-panel p-6">
        <div class="flex items-center justify-between gap-3">
          <div><p class="eyebrow-text">Vehicle</p><h2 class="mt-2 font-display text-2xl text-app-heading">Daftarkan kendaraan</h2></div>
          <span class="status-pill">POST /fleet/vehicles</span>
        </div>
        <form class="mt-6 grid gap-4" @submit.prevent="submitVehicle">
          <label class="form-field"><span>Vehicle code</span><input v-model="vehicleForm.vehicle_code" class="toolbar-input" required /></label>
          <label class="form-field"><span>Plate number</span><input v-model="vehicleForm.plate_number" class="toolbar-input" required /></label>
          <label class="form-field"><span>Vehicle type ID</span><input v-model="vehicleForm.vehicle_type_id" class="toolbar-input" required /></label>
          <label class="form-field"><span>Home SPPG ID</span><input v-model="vehicleForm.home_sppg_id" class="toolbar-input" required /></label>
          <label class="form-field"><span>Brand / Model</span><input v-model="vehicleForm.brand_name" class="toolbar-input" placeholder="Brand" /></label>
          <label class="form-field"><span>Capacity Portions</span><input v-model.number="vehicleForm.capacity_portions" class="toolbar-input" min="0" type="number" required /></label>
          <label class="form-field"><span>Notes</span><textarea v-model="vehicleForm.notes" class="toolbar-input min-h-24" /></label>
          <div class="flex justify-end"><button class="primary-button" :disabled="saving" type="submit">{{ saving ? 'Menyimpan...' : 'Simpan Vehicle' }}</button></div>
        </form>
      </article>

      <article class="glass-panel p-6">
        <div class="flex items-center justify-between gap-3">
          <div><p class="eyebrow-text">Driver</p><h2 class="mt-2 font-display text-2xl text-app-heading">Daftarkan driver</h2></div>
          <span class="status-pill">POST /fleet/drivers</span>
        </div>
        <form class="mt-6 grid gap-4" @submit.prevent="submitDriver">
          <label class="form-field"><span>Driver code</span><input v-model="driverForm.driver_code" class="toolbar-input" required /></label>
          <label class="form-field"><span>Full name</span><input v-model="driverForm.full_name" class="toolbar-input" required /></label>
          <label class="form-field"><span>Phone</span><input v-model="driverForm.phone_number" class="toolbar-input" required /></label>
          <label class="form-field"><span>License number</span><input v-model="driverForm.license_number" class="toolbar-input" required /></label>
          <label class="form-field"><span>License expiry</span><input v-model="driverForm.license_expiry_date" class="toolbar-input" type="date" required /></label>
          <label class="form-field"><span>Notes</span><textarea v-model="driverForm.notes" class="toolbar-input min-h-24" /></label>
          <div class="flex justify-end"><button class="primary-button" :disabled="saving" type="submit">{{ saving ? 'Menyimpan...' : 'Simpan Driver' }}</button></div>
        </form>
      </article>
    </section>

    <section class="grid gap-6 xl:grid-cols-2">
      <article class="glass-panel p-6">
        <div class="flex items-center justify-between gap-3">
          <div><p class="eyebrow-text">Assignment</p><h2 class="mt-2 font-display text-2xl text-app-heading">Assign kendaraan</h2></div>
          <span class="status-pill">POST /fleet/vehicles/{id}/assignments</span>
        </div>
        <form class="mt-6 grid gap-4" @submit.prevent="submitAssignment">
          <label class="form-field"><span>Vehicle ID</span><input v-model="assignmentForm.vehicle_id" class="toolbar-input" required /></label>
          <label class="form-field"><span>SPPG ID</span><input v-model="assignmentForm.sppg_id" class="toolbar-input" required /></label>
          <label class="form-field"><span>Driver ID</span><input v-model="assignmentForm.driver_id" class="toolbar-input" required /></label>
          <label class="form-field"><span>Assignment date</span><input v-model="assignmentForm.assignment_date" class="toolbar-input" type="date" required /></label>
          <label class="form-field"><span>Role</span><input v-model="assignmentForm.assignment_role" class="toolbar-input" required /></label>
          <label class="form-field"><span>Notes</span><textarea v-model="assignmentForm.notes" class="toolbar-input min-h-24" /></label>
          <div class="flex justify-end"><button class="primary-button" :disabled="saving" type="submit">{{ saving ? 'Menyimpan...' : 'Simpan Assignment' }}</button></div>
        </form>
      </article>

      <article class="glass-panel p-6">
        <div class="flex items-center justify-between gap-3">
          <div><p class="eyebrow-text">Maintenance</p><h2 class="mt-2 font-display text-2xl text-app-heading">Catat maintenance</h2></div>
          <span class="status-pill">POST /fleet/vehicles/{id}/maintenances</span>
        </div>
        <form class="mt-6 grid gap-4" @submit.prevent="submitMaintenance">
          <label class="form-field"><span>Vehicle ID</span><input v-model="maintenanceForm.vehicle_id" class="toolbar-input" required /></label>
          <label class="form-field"><span>SPPG ID</span><input v-model="maintenanceForm.sppg_id" class="toolbar-input" required /></label>
          <label class="form-field"><span>Maintenance date</span><input v-model="maintenanceForm.maintenance_date" class="toolbar-input" type="date" required /></label>
          <label class="form-field"><span>Type</span><input v-model="maintenanceForm.maintenance_type" class="toolbar-input" required /></label>
          <label class="form-field"><span>Odometer KM</span><input v-model.number="maintenanceForm.odometer_km" class="toolbar-input" min="0" type="number" required /></label>
          <label class="form-field"><span>Cost</span><input v-model.number="maintenanceForm.cost_amount" class="toolbar-input" min="0" type="number" required /></label>
          <label class="form-field"><span>Vendor</span><input v-model="maintenanceForm.vendor_name" class="toolbar-input" required /></label>
          <label class="form-field"><span>Notes</span><textarea v-model="maintenanceForm.notes" class="toolbar-input min-h-24" /></label>
          <div class="flex justify-end"><button class="primary-button" :disabled="saving" type="submit">{{ saving ? 'Menyimpan...' : 'Simpan Maintenance' }}</button></div>
        </form>
      </article>
    </section>
  </div>
</template>
