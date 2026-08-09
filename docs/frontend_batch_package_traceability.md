# Frontend Integration — Batch Production, Packaging, and Delivery Traceability

Dokumen ini menjadi kontrak frontend untuk tracing bahan baku per batch sampai kemasan diterima pada tujuan pengiriman.

## 1. Alur Bisnis

```text
RAW_MATERIAL_BATCH
  -> PRODUCTION_MATERIAL
  -> PRODUCTION_OUTPUT
       -> PACKAGE A (400 porsi) -> DELIVERY ORDER A
       -> PACKAGE B (350 porsi) -> DELIVERY ORDER B
       -> PACKAGE C (250 porsi) -> DELIVERY ORDER C
```

Satu `PRODUCTION_OUTPUT` boleh dibagi ke banyak kemasan. Satu kemasan hanya boleh ditetapkan ke satu pengiriman. Jumlah seluruh kemasan tidak boleh melebihi `accepted_portions` produksi.

Semua request menggunakan:

```http
Authorization: Bearer <access_token>
X-Tenant-ID: <tenant_uuid>
X-SPPG-ID: <sppg_uuid>
Content-Type: application/json
```

Role mutation: `super_admin`, `tenant_admin`, `operations_manager`, atau `quality_officer`.

## 2. Complete Production dan Trace Batch Bahan

```http
POST /api/v1/production-orders/{production_order_id}/complete
```

```json
{
  "actual_portions": 1000,
  "accepted_portions": 1000,
  "rejected_portions": 0,
  "output_trace_code": "PRD-20260809-001"
}
```

Backend memilih batch bahan baku secara FEFO untuk produk yang memakai `track_batch` atau `track_expiry`. Frontend tidak perlu menghitung pembagian batch. Setiap item `data.materials` berisi:

```json
{
  "inventory_batch_id": "uuid",
  "batch_number": "BATCH-BERAS-0809",
  "batch_trace_code": "TRC-RAW-12345678",
  "batch_received_date": "2026-08-01",
  "batch_expiry_date": "2026-12-01",
  "issued_at": "2026-08-09T04:30:00Z",
  "actual_quantity": 75,
  "produced_portions": 1000,
  "accepted_portions": 1000,
  "trace_code": "TRC-PRO-87654321"
}
```

UI production detail menampilkan tabel `Batch Materials Used` dengan kolom nomor batch, tanggal terima, kedaluwarsa, quantity, waktu issue, dan porsi output. Bila beberapa batch digunakan dalam satu produksi, setiap batch menunjuk output porsi yang sama; angka tersebut adalah lineage output, bukan porsi yang boleh dijumlahkan antarbaris bahan.

## 3. Membagi Output Produksi Menjadi Kemasan

```http
POST /api/v1/deliveries/packages
```

```json
{
  "tenant_id": "<tenant_uuid>",
  "sppg_id": "<sppg_uuid>",
  "production_order_id": "<production_order_uuid>",
  "quantity_portions": 400,
  "packaging_started_at": "2026-08-09T06:00:00+07:00",
  "trace_code": "PKG-20260809-001",
  "product_name": "Paket Makan Siang"
}
```

`trace_code` dan `product_name` opsional. Jika `trace_code` kosong, backend membuat trace code. Response `201` menggunakan code `PRODUCTION_PACKAGE_CREATED`.

Field penting response:

```json
{
  "id": "<package_uuid>",
  "trace_code": "PKG-20260809-001",
  "production_order_id": "<production_order_uuid>",
  "quantity_portions": 400,
  "package_trace_entity_id": "<trace_entity_uuid>",
  "packaging_started_at": "2026-08-08T23:00:00Z",
  "delivery_route_id": null,
  "delivery_stop_id": null,
  "vehicle_id": null,
  "status": "IN_WAREHOUSE"
}
```

Untuk pembagian 1.000 porsi, frontend memanggil endpoint ini tiga kali dengan quantity `400`, `350`, dan `250`. Setelah setiap request berhasil, refresh daftar kemasan dan hitung:

```text
remaining_portions = accepted_portions - sum(quantity_portions semua kemasan)
```

Backend tetap menjadi sumber kebenaran dan melakukan validasi dengan database lock.

## 4. Daftar Kemasan

```http
GET /api/v1/deliveries/packages
```

Gunakan response untuk tabel packaging dan delivery timeline. Field route, vehicle, serta destination bernilai `null` selama status masih `IN_WAREHOUSE`.

## 5. Menetapkan Kemasan ke Pengiriman

```http
POST /api/v1/deliveries/{route_id}/packages/load
```

```json
{
  "tenant_id": "<tenant_uuid>",
  "sppg_id": "<sppg_uuid>",
  "package_trace_code": "PKG-20260809-001",
  "delivery_stop_id": "<delivery_stop_uuid>",
  "vehicle_id": "<vehicle_uuid>",
  "loaded_at": "2026-08-09T07:00:00+07:00",
  "temp_at_loading": 65.2
}
```

Frontend sebaiknya menggunakan QR scanner untuk `package_trace_code`. Backend memvalidasi bahwa package dan delivery order berasal dari production order yang sama, package belum pernah ditetapkan, dan total porsi pada tujuan tidak melebihi `planned_portions` delivery order.

## 6. Receiving

```http
POST /api/v1/deliveries/{route_id}/packages/{package_id}/receive
```

```json
{
  "received_at": "2026-08-09T08:35:00+07:00",
  "temperature_c": 61.8,
  "latitude": -6.2001,
  "longitude": 106.8167
}
```

Status package berubah menjadi `RECEIVED` dan event penerimaan ditambahkan ke timeline trace.

## 7. Membuka Trace Graph

- sumber bahan suatu package: `GET /api/v1/traceability/{package_trace_code}/backward`
- tujuan seluruh hasil suatu batch bahan: `GET /api/v1/traceability/{batch_trace_code}/forward`
- timeline package: `GET /api/v1/traceability/{package_trace_code}/timeline`
- label package: `GET /api/v1/traceability/entities/{package_trace_code}/label`

Entity type utama: `RAW_MATERIAL_BATCH`, `PRODUCTION_MATERIAL`, `PRODUCTION_OUTPUT`, `PACKAGE`, dan `DELIVERY_ORDER`. Relation type utama: `ISSUED_TO_PRODUCTION`, `USED_IN`, `PACKAGED_AS`, dan `SHIPPED_IN`.

## 8. Error Handling

| HTTP | Code | Perilaku UI |
|---|---|---|
| `400` | `PRODUCTION_NOT_COMPLETED` | Disable form packaging dan arahkan user menyelesaikan produksi. |
| `400` | `PACKAGE_PORTIONS_EXCEED_PRODUCTION_OUTPUT` | Tampilkan remaining portions terbaru dan minta koreksi quantity. |
| `400` | `PACKAGE_ALREADY_ASSIGNED` | Refresh package; jangan menawarkan tujuan kedua. |
| `400` | `PACKAGE_DELIVERY_PRODUCTION_MISMATCH` | Filter delivery order berdasarkan production order package. |
| `400` | `PACKAGE_PORTIONS_EXCEED_DELIVERY_ORDER` | Tampilkan kapasitas porsi tujuan yang tersisa. |
| `400` | `INSUFFICIENT_BATCH_STOCK_FOR_PRODUCTION` | Arahkan kembali ke inventory/reservasi batch. |
| `404` | `PRODUCTION_OUTPUT_TRACE_NOT_FOUND` | Blok packaging dan minta sinkronisasi/eskalasi data. |

Pada error validasi, frontend harus memakai `response.code`, bukan mencocokkan teks `message`.

## 9. Rekomendasi State Frontend

- invalidate query `production-order`, `production-cost-sheet`, `delivery-packages`, dan `trace-graph` setelah mutation terkait
- cegah double-submit pada create package dan load package
- tampilkan progress `packaged / accepted` dan `assigned / planned`
- disable CTA `Load Package` kecuali status `IN_WAREHOUSE`
- tampilkan badge `HOLD` sebagai blocking state
- jangan menyimpan hasil kalkulasi remaining portions sebagai sumber kebenaran lokal
