# Dokumentasi Teknis Frontend Vue.js --- Google Maps Platform untuk ERP MBG

**Dokumen:** Integrasi Google Maps, PostGIS, Delivery Tracking, ETA, dan
Food Safety\
**Frontend:** Vue.js\
**Backend:** FastAPI\
**Database GIS:** PostgreSQL 18 + PostGIS\
**Versi:** 1.0\
**Tanggal:** 7 Agustus 2026

------------------------------------------------------------------------

## 1. Tujuan

Dokumen ini menjadi acuan implementasi Google Maps Platform pada
frontend Vue.js ERP Pengelolaan Dapur MBG.

Google Maps digunakan terutama untuk kebutuhan operasional distribusi
dan Food Safety, yaitu:

-   menampilkan lokasi Dapur/SPPG;
-   menampilkan sekolah atau titik penerima manfaat;
-   menampilkan posisi armada;
-   menampilkan rute pengiriman;
-   menghitung estimasi jarak;
-   menghitung estimasi waktu tempuh;
-   menghasilkan ETA;
-   menampilkan route polyline;
-   mendukung pengiriman multi-destination;
-   menjadi input Predictive Food Safety Early Warning.

Google Maps **tidak menggantikan PostGIS**. PostGIS tetap menjadi
spatial source of truth ERP MBG.

------------------------------------------------------------------------

## 2. Prinsip Arsitektur

Pembagian tanggung jawab utama:

  -----------------------------------------------------------------------
  Komponen                            Tanggung Jawab
  ----------------------------------- -----------------------------------
  PostgreSQL + PostGIS                Menyimpan data spasial dan histori
                                      GIS

  FastAPI                             Business logic, traceability,
                                      delivery, Food Safety Engine

  Vue.js                              Operational UI, peta, QR, delivery
                                      monitoring

  Google Maps Platform                Visualisasi peta, routing,
                                      distance, duration, ETA
  -----------------------------------------------------------------------

Arsitektur:

``` text
PostgreSQL 18 + PostGIS
        |
        | FastAPI REST API
        v
Frontend Vue.js
        |
        +-- Google Maps JavaScript API
        |
        +-- Google Routes API
        |
        v
Route / Distance / Duration / ETA / Polyline
```

------------------------------------------------------------------------

## 3. Data Spasial yang Tetap Disimpan di PostGIS

PostGIS tetap menyimpan data utama seperti:

-   lokasi Tenant;
-   lokasi SPPG/Dapur;
-   lokasi sekolah;
-   lokasi titik penerima manfaat;
-   lokasi warehouse;
-   posisi armada;
-   histori GPS kendaraan;
-   delivery stop;
-   service area;
-   administrative boundary;
-   histori distribusi;
-   histori kejadian Food Safety berbasis lokasi.

Contoh struktur lokasi:

``` text
sppg
----
id UUID
tenant_id UUID
name
location geometry(Point,4326)

beneficiary_locations
---------------------
id UUID
tenant_id UUID
name
location geometry(Point,4326)
```

Frontend memperoleh koordinat melalui FastAPI.

------------------------------------------------------------------------

## 4. Google Maps Platform yang Digunakan

### 4.1 Maps JavaScript API

Digunakan untuk:

-   render Google Map;
-   marker Dapur/SPPG;
-   marker sekolah/penerima;
-   marker armada;
-   Info Window;
-   route polyline;
-   monitoring perjalanan;
-   visualisasi status Food Safety.

### 4.2 Routes API

Digunakan untuk:

-   menghitung rute;
-   distance;
-   estimated travel duration;
-   ETA;
-   route polyline;
-   route matrix untuk kebutuhan banyak tujuan.

Untuk implementasi baru gunakan konsep:

-   **Compute Routes** --- perhitungan satu perjalanan/rute;
-   **Compute Route Matrix** --- perhitungan origin/destination dalam
    jumlah lebih banyak.

------------------------------------------------------------------------

## 5. Struktur Frontend Vue.js

Struktur yang direkomendasikan:

``` text
src/
├── components/
│   ├── maps/
│   │   ├── GoogleMap.vue
│   │   ├── KitchenMarker.vue
│   │   ├── BeneficiaryMarker.vue
│   │   ├── VehicleMarker.vue
│   │   ├── DeliveryRoute.vue
│   │   ├── DeliveryInfoWindow.vue
│   │   └── FoodSafetyMapStatus.vue
│   │
│   └── traceability/
│       ├── QrCodeView.vue
│       ├── QrCodeScanner.vue
│       ├── QrLabel.vue
│       ├── QrPrintPreview.vue
│       └── TraceTimeline.vue
│
├── composables/
│   ├── useGoogleMaps.js
│   ├── useRouteCalculation.js
│   ├── useVehicleTracking.js
│   └── useFoodSafetyStatus.js
│
├── services/
│   ├── googleMapsService.js
│   ├── routingService.js
│   ├── deliveryService.js
│   └── traceabilityService.js
│
├── stores/
│   ├── deliveryStore.js
│   ├── fleetStore.js
│   └── foodSafetyStore.js
│
└── views/
    ├── DeliveryMapView.vue
    ├── FleetMonitoringView.vue
    ├── DeliveryPlanningView.vue
    └── FoodSafetyMapView.vue
```

Google Maps sebaiknya dibungkus dalam composable/service agar business
component tidak bergantung langsung pada detail implementasi Google API.

------------------------------------------------------------------------

## 6. Environment Configuration

API key tidak ditulis langsung di source code.

Contoh `.env`:

``` env
VITE_GOOGLE_MAPS_API_KEY=xxxxxxxxxxxxxxxx
```

Penggunaan:

``` javascript
const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
```

API key frontend secara teknis dapat terlihat di browser. Oleh karena
itu key wajib menggunakan restriction pada Google Cloud.

Direkomendasikan:

``` text
Application Restriction:
HTTP Referrers
```

Contoh:

``` text
https://mbg.domain.id/*
https://staging-mbg.domain.id/*
```

Batasi API hanya terhadap API yang memang diperlukan.

------------------------------------------------------------------------

## 7. Flow Perhitungan Rute

Contoh:

``` text
User membuka Delivery Planning
        |
        v
Vue.js meminta data delivery
        |
        v
FastAPI
        |
        v
PostGIS
        |
        +-- SPPG GPS
        +-- Destination GPS
        |
        v
Vue.js
        |
        v
Google Routes API
        |
        +-- Distance
        +-- Duration
        +-- ETA
        +-- Polyline
        |
        v
Display Google Maps
```

Contoh hasil:

``` text
Origin       : SPPG-001
Destination  : SDN-018
Distance     : 8.4 km
Duration     : 27 menit
ETA          : 10:15
```

------------------------------------------------------------------------

## 8. Route Snapshot Harus Disimpan ke Backend

Hasil routing penting tidak boleh hanya berada di browser.

Frontend mengirim snapshot hasil perhitungan ke FastAPI.

Contoh:

``` json
{
  "delivery_run_id": "UUID",
  "delivery_stop_id": "UUID",
  "estimated_distance_m": 8400,
  "estimated_duration_sec": 1620,
  "estimated_arrival_at": "2026-08-07T10:15:00+07:00",
  "route_provider": "GOOGLE_ROUTES"
}
```

Backend kemudian dapat membandingkan:

``` text
PLANNED                  ACTUAL

Distance 8.4 km          Distance 9.1 km
Duration 27 min          Duration 43 min
ETA 10:15                Arrival 10:31
```

Data tersebut penting untuk:

-   audit delivery;
-   analitik distribusi;
-   evaluasi keterlambatan;
-   Food Safety;
-   pengembangan AI/analytics di masa depan.

------------------------------------------------------------------------

## 9. Integrasi dengan QR Traceability

QR Code dirender dan dicetak di frontend.

Backend bertanggung jawab menghasilkan:

``` text
UUID
trace_code
trace_token
trace_path
```

Alur:

``` text
RAW MATERIAL QR
      |
      v
STORAGE
      |
      v
MATERIAL ISSUE SCAN
      |
      v
COOKING BATCH QR
      |
      v
MEAL BATCH QR
      |
      v
PACKAGE / CONTAINER QR
      |
      v
LOADING SCAN
      |
      v
VEHICLE
      |
      v
DELIVERY
      |
      v
RECEIVING SCAN
```

Pada proses loading:

``` text
SCAN VEHICLE
     |
     v
VH-004

SCAN PACKAGE
     |
     +-- PK-001
     +-- PK-002
     +-- PK-003
     |
     v
CONFIRM LOADING
```

FastAPI kemudian menyimpan relasi package dengan vehicle, delivery run
dan delivery stop.

------------------------------------------------------------------------

## 10. Integrasi Google Maps dengan Food Safety

Google Routes API menjadi salah satu input Food Safety Engine.

Misalnya:

``` text
Cooking Completed     08:15
Maximum Receive       10:15
Current Time          09:20

Google Travel Time    42 menit
Predicted Arrival     10:02
```

Sistem menghitung:

``` text
Safety Buffer = 13 menit
```

Frontend dapat menampilkan:

``` text
DELIVERY FOOD SAFETY
--------------------

Meal Batch       MB-00082
Vehicle          VH-004
Destination      SDN 18

Distance         12.4 km
Google ETA       10:02

Maximum Receive  10:15
Safety Buffer    13 min

STATUS           WARNING
```

------------------------------------------------------------------------

## 11. Food Safety Clock

Food Safety Clock dimulai ketika backend mencatat:

``` text
cooking_completed_at
```

Definisi timestamp:

``` text
T0 = cooking_completed_at
T1 = packaging_completed_at
T2 = actual_departure_at
T3 = actual_arrival_at
T4 = received_at
```

Perhitungan:

``` text
Kitchen Holding = T2 - T0
Travel Time     = T3 - T2
Receiving Delay = T4 - T3
Total Food Age  = T4 - T0
```

Frontend boleh menampilkan countdown secara real-time, tetapi sumber
kebenaran waktu tetap berasal dari timestamp backend.

------------------------------------------------------------------------

## 12. Predictive Food Safety Warning

Backend menentukan:

``` text
maximum_recipient_at
=
cooking_completed_at
+
max_time_to_recipient
```

Google menyediakan estimasi perjalanan.

Sistem kemudian memperoleh:

``` text
predicted_recipient_at
=
current_time
+
estimated_loading_duration
+
google_route_duration
+
estimated_receiving_duration
```

Selanjutnya:

``` text
safety_buffer
=
maximum_recipient_at
-
predicted_recipient_at
```

Status dapat dikategorikan:

  Kondisi                              Status
  ------------------------------------ --------------
  Buffer masih cukup                   SAFE
  Mendekati threshold                  WARNING
  Buffer sangat kecil                  HIGH WARNING
  Predicted arrival melewati maximum   CRITICAL

Threshold harus berasal dari Food Safety Profile backend dan tidak
di-hard-code di Vue.js.

------------------------------------------------------------------------

## 13. Delivery dengan Banyak Tujuan

Satu armada dapat membawa makanan ke beberapa lokasi.

Contoh:

``` text
SPPG
 |
 +-- SDN A
 +-- SDN B
 +-- SMP C
 +-- SDN D
```

Frontend dapat menggunakan Route Matrix untuk memperoleh informasi jarak
dan waktu tempuh.

Contoh tampilan:

  Destination       ETA   Safety Buffer Status
  ------------- ------- --------------- --------------
  SDN A           09:40          35 min SAFE
  SDN B           09:57          18 min WARNING
  SMP C           10:11           4 min HIGH WARNING
  SDN D           10:22          -7 min CRITICAL

Dengan demikian routing tidak hanya digunakan untuk mencari tujuan
terdekat.

ERP dapat mempertimbangkan:

``` text
Travel Time
+
Holding Time
+
Maximum Receive Time
+
Food Safety Priority
```

untuk membantu menentukan prioritas pengiriman.

------------------------------------------------------------------------

## 14. Vehicle Position Monitoring — On-Demand / Checkpoint Based

Untuk fase awal ERP MBG, tidak direkomendasikan membuat live vehicle tracking terus-menerus seperti aplikasi ride-hailing.

Tujuan utama tracking adalah memastikan makanan masih dapat sampai ke penerima dalam batas waktu aman.

Strategi yang direkomendasikan:

- GPS dicatat saat armada berangkat;
- GPS dicatat saat armada tiba;
- posisi antara dikirim hanya ketika driver menekan tombol update posisi atau saat dibutuhkan;
- dashboard menggunakan posisi terakhir untuk menghitung ulang ETA;
- update posisi dapat diminta ketika Food Safety status mulai WARNING atau CRITICAL.

```text
Driver Mobile / PWA
        |
        | Geolocation
        v
[ UPDATE POSISI ]
        |
        v
FastAPI
        |
        v
PostGIS
        |
        v
Dashboard Vue.js
        |
        v
Google Routes API
        |
        v
Remaining Distance
Remaining Duration
Updated ETA
        |
        v
Food Safety Engine
        |
        v
Updated Safety Buffer
```

### 14.1 Data Posisi Armada

```text
vehicle_positions
-----------------
id UUID
vehicle_id UUID
delivery_run_id UUID
position geometry(Point,4326)
recorded_at
speed NULL
heading NULL
accuracy NULL
source
```

Contoh nilai `source`:

```text
DEPARTURE
MANUAL_UPDATE
ARRIVAL
SYSTEM_CHECKPOINT
```

### 14.2 Workflow Driver

```text
1. Scan Package
      ↓
2. Confirm Loading
      ↓
3. Berangkat
      ↓
   GPS departure tersimpan
      ↓
4. Update Posisi
   hanya bila diperlukan
      ↓
5. Tiba
      ↓
   GPS arrival tersimpan
      ↓
6. Scan QR Penerima
      ↓
7. Serah Terima
```

Contoh UI driver:

```text
DELIVERY DL-0082

Destination
SDN 18

Packages
8

Departure
09:10

[ UPDATE POSISI SEKARANG ]

[ TIBA DI TUJUAN ]
```

### 14.3 Dashboard On-Demand Check

Dashboard operasional menyediakan tombol:

```text
[ CEK POSISI ARMADA ]
```

Saat digunakan:

```text
FastAPI
   ↓
Last Known Vehicle Position
   ↓
Google Routes API
   ↓
Remaining Distance
Remaining Duration
Updated ETA
   ↓
Food Safety Engine
   ↓
Recalculate Safety Buffer
```

Contoh:

```text
Vehicle          VH-004
Last Position    09:36

Remaining        4.2 km
Travel Time      16 min
Updated ETA      09:52

Maximum Receive  10:05
Safety Buffer    13 min

STATUS           WARNING
```

### 14.4 Adaptive Position Update

| Food Safety Status | Tracking Strategy |
|---|---|
| SAFE | Departure + optional manual checkpoint |
| WARNING | Minta/update posisi bila diperlukan |
| HIGH WARNING | Update posisi lebih sering |
| CRITICAL | Immediate position check dan escalation |

Dengan strategi ini, tracking tetap relevan dengan pencegahan keracunan tanpa membuat sistem fleet tracking yang kompleks.

---

## 15. Recalculation Strategy

Google Routes API tidak boleh dipanggil terus-menerus tanpa kebutuhan.

Route/ETA recalculation direkomendasikan ketika:

1. delivery dibuat;
2. armada dipilih;
3. destination berubah;
4. sebelum dispatch;
5. driver mengirim posisi terbaru;
6. operator menekan **Cek Posisi Armada**;
7. kendaraan mengalami perubahan rute signifikan;
8. Food Safety Engine mendeteksi safety buffer mulai WARNING/HIGH WARNING/CRITICAL.

Hindari:

```text
Call Google Routes
setiap 1 detik
```

Strategi:

```text
GPS Checkpoint
    ↓
PostGIS
    ↓
Route Recalculation
hanya saat diperlukan
    ↓
Updated ETA
    ↓
Updated Food Safety Status
```

Dengan demikian penggunaan Google Routes lebih hemat dan backend tetap memiliki histori posisi yang cukup untuk audit serta evaluasi delivery.

---

## 16. Pengendalian Biaya Google Maps Platform

Google Maps Platform menggunakan model penggunaan berbasis billing.

Untuk mengendalikan biaya:

-   aktifkan hanya API yang diperlukan;
-   gunakan API key restriction;
-   pisahkan key berdasarkan environment;
-   hindari request routing berulang;
-   simpan route snapshot;
-   manfaatkan data route yang masih relevan;
-   tentukan quota di Google Cloud;
-   aktifkan billing alert;
-   monitor penggunaan API.

Google Workspace/Google Suite Business **tidak diperlukan** untuk
menggunakan Google Maps Platform.

Yang dibutuhkan adalah Google Cloud Project, billing account, API yang
diaktifkan, dan credential/API key yang sesuai.

------------------------------------------------------------------------

## 17. Security

### API Key

Frontend key wajib dibatasi dengan:

``` text
HTTP Referrer Restriction
```

dan API restriction.

Jangan menggunakan unrestricted API key.

### Backend

Data seperti:

-   tenant;
-   delivery;
-   package;
-   meal batch;
-   traceability;
-   receiver;
-   vehicle;

tetap dilindungi oleh JWT/RBAC FastAPI.

Google Maps hanya menerima data lokasi yang memang diperlukan untuk
fungsi pemetaan/routing.

------------------------------------------------------------------------

## 18. Food Safety Map

Frontend menyediakan `FoodSafetyMapView.vue`.

Contoh representasi:

``` text
SPPG-001
  SAFE

Cold Room-02
  CRITICAL TEMPERATURE

Vehicle VH-004
  WARNING
  ETA 10:02
  Safety Buffer 13 min

Vehicle VH-009
  CRITICAL
  Predicted Late 9 min

SDN-018
  WAITING DELIVERY
```

Status map berasal dari FastAPI Food Safety Engine, bukan dihitung
sepenuhnya di Vue.js.

------------------------------------------------------------------------

## 19. Recommended Frontend State

Contoh state delivery:

``` javascript
{
  deliveryRun: {},
  vehicle: {},
  stops: [],
  packages: [],
  currentPosition: null,
  route: null,

  estimatedDistance: null,
  estimatedDuration: null,
  estimatedArrival: null,

  foodSafety: {
    status: null,
    maximumRecipientAt: null,
    predictedRecipientAt: null,
    safetyBufferSeconds: null,
    alerts: []
  }
}
```

Gunakan Pinia agar state delivery/map tidak tersebar di banyak
component.

------------------------------------------------------------------------

## 20. Error Handling

Frontend harus menangani kondisi:

-   Google Maps gagal dimuat;
-   API key invalid;
-   quota exceeded;
-   route tidak ditemukan;
-   destination GPS tidak tersedia;
-   jaringan putus;
-   FastAPI tidak dapat diakses;
-   GPS kendaraan tidak tersedia;
-   ETA tidak dapat dihitung.

Kegagalan Google API **tidak boleh menyebabkan data transaksi delivery
hilang**.

Delivery tetap disimpan di FastAPI dan diberi status bahwa ETA/routing
belum tersedia.

------------------------------------------------------------------------

## 21. Recommended UX

### Vehicle Position Check

```text
DELIVERY DL-0082

Vehicle          VH-004
Destination      SDN 18

ETA Awal         09:47
Maximum Receive  10:05

Safety Buffer    18 min
Status           WARNING

[ CEK POSISI ARMADA ]
```

Sesudah posisi terbaru tersedia:

```text
Last Position    09:36
Remaining        4.2 km
Updated ETA      09:52

Safety Buffer    13 min
Status           WARNING
```

### Delivery Planning

Tampilkan:

``` text
MAP
---------------------------------

SPPG ●──────────────● SDN 18
          Route

Distance       8.4 km
Travel Time    27 min
ETA            10:15

Food Safety
Safety Buffer  24 min
Status         SAFE

[ASSIGN VEHICLE]
[CONFIRM ROUTE]
```

### Loading

``` text
Vehicle VH-004

Packages
PK-001  ✓
PK-002  ✓
PK-003  ✓

Destination
SDN 18

Google ETA
10:15

Food Safety
WARNING

[CONFIRM LOADING]
```

### Live Delivery

``` text
VH-004

Current Position
        ↓

Remaining Distance   4.2 km
ETA                  10:17

Maximum Receive      10:25
Safety Buffer         8 min

WARNING
```

------------------------------------------------------------------------

## 22. Hubungan dengan Backend FastAPI

Frontend tidak menentukan sendiri business rule Food Safety.

FastAPI tetap bertanggung jawab terhadap:

-   safety profile;
-   temperature rule;
-   expiry rule;
-   storage duration;
-   holding time;
-   maximum receive time;
-   alert severity;
-   HOLD/BLOCK;
-   traceability;
-   recall;
-   audit trail.

Vue.js bertanggung jawab terhadap:

-   presentation;
-   interaction;
-   Google Maps;
-   QR scan/render/print;
-   route visualization;
-   countdown visualization;
-   alert visualization.

------------------------------------------------------------------------

## 23. Keputusan Implementasi Tracking Armada

Untuk fase awal ERP MBG:

- tidak diperlukan live GPS tracking setiap beberapa detik;
- posisi wajib dicatat pada departure dan arrival;
- update posisi di tengah perjalanan bersifat on-demand/checkpoint based;
- driver dapat mengirim posisi melalui frontend mobile/PWA;
- dashboard kantor dapat melakukan Cek Posisi Armada;
- Google Routes API menghitung ulang remaining distance, duration dan ETA dari last known position;
- Food Safety Engine menghitung ulang safety buffer;
- tracking dapat ditingkatkan menjadi lebih frequent hanya ketika status delivery mulai WARNING atau CRITICAL.

Pendekatan ini dipilih karena tujuan utama sistem adalah **pencegahan risiko Food Safety**, bukan membangun fleet tracking real-time seperti aplikasi ride-hailing.

---

## 24. Ringkasan Arsitektur Final

``` text
POSTGIS
Spatial Source of Truth
        |
        v
FASTAPI
Business Logic
Traceability
Food Safety Engine
Delivery
Fleet
        |
        v
VUE.JS
Operational Frontend
        |
        +-- QR Scan / Render / Print
        |
        +-- Google Maps JavaScript API
        |
        +-- Google Routes API
                |
                v
        Route / Distance / ETA
```

Prinsip final:

> **PostGIS = Spatial Source of Truth**\
> **FastAPI = Business Logic & Food Safety Engine**\
> **Vue.js = Operational User Interface**\
> **Google Maps Platform = Mapping & Routing Intelligence**

Arsitektur ini menjaga data inti ERP tetap berada di backend sendiri,
sementara Google Maps Platform digunakan secara terkontrol untuk
kemampuan peta dan routing yang memang lebih efektif diperoleh dari
layanan eksternal.
