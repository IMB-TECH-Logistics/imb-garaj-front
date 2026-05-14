# API Reorganization — May 2026

## Maqsad

Backend `apps/` strukturasi va URL nomlash domain-driven bo'yicha qayta tashkillashtirildi:
- `common/` dan barcha domain modellari tegishli appga ko'chirildi
- Role/platform asosidagi `owner/`, `mobile/` apps o'chirildi yoki qayta nomlandi
- URL prefiks lar **mantiqiy va o'zini ko'rsatuvchi** (self-describing) bo'ldi

URL paths bilan code tashkilotchiligi mos kelishi sababli, frontend developer endpointni o'qib darhol qaysi app/domain tegishli ekanini biladi.

## Yangi URL strukturasi

| Prefiks            | Tegishli app              | Maqsad                                    |
|--------------------|---------------------------|-------------------------------------------|
| `/auth/`           | apps.auth                 | Web va mobile auth                        |
| `/profile/`        | apps.users                | Joriy foydalanuvchi                       |
| `/users/`          | apps.users                | User, Role, Driver CRUD                   |
| `/places/`         | apps.places               | Country, Region, District                 |
| `/petrol-stations/`| apps.petrol_stations      | Petrol station + uning cashflows          |
| `/clients/`        | apps.clients              | Mijozlar (customers)                      |
| `/routes/`         | apps.routes               | Direction + DirectionPrice (route configs)|
| `/cargo-types/`    | apps.trips                | Yuk turlari                               |
| `/vehicle-types/`  | apps.vehicles             | Transport turlari                         |
| `/payment-types/`  | apps.checkout             | To'lov turlari                            |
| `/expense-categories/` | apps.checkout         | Xarajat kategoriyalari                    |
| `/selectable/`     | apps.common               | Dropdown/select helperlari (utility)      |
| `/trips/`          | apps.trips                | Trip va Order CRUD                        |
| `/vehicles/`       | apps.vehicles             | Vehicle, TechnicalInspection              |
| `/checkout/`       | apps.checkout             | CashFlow, Checkout                        |
| `/transaction/`    | apps.checkout             | Transaction CRUD                          |
| `/manager/`        | apps.manager              | **BFF**: manager dashboard aggregator     |
| `/mobile/`         | apps.monitoring + apps.trips | Driver mobile app endpoints             |
| `/dashboard/`      | apps.dashboard            | Owner statistika (formerly `/owner/`)     |
| `/logs/`           | apps.logs                 | Audit log                                 |

## O'zgartirilgan endpointlar

### Places (Country / Region / District)
```
common/countries/        →  places/countries/
common/regions/          →  places/regions/
common/districts/        →  places/districts/
```

### Petrol stations
```
common/petrol-stations/                  →  petrol-stations/
common/petrol-stations/<id>/top-up/      →  petrol-stations/<id>/top-up/
common/petrol-stations/<id>/cash-flows/  →  petrol-stations/<id>/cash-flows/
common/petrol-stations/cash-flows/<id>/  →  petrol-stations/cash-flows/<id>/
```

### Clients (customers)
```
common/clients/  →  clients/
```

### Routes (was: Directions in common)
```
common/directions/                  →  routes/
common/directions/create/           →  routes/create/
common/directions/<id>/             →  routes/<id>/
common/directions/<id>/update/      →  routes/<id>/update/
common/directions/<id>/delete/      →  routes/<id>/delete/
```

### Reference data
```
common/cargo-types/        →  cargo-types/
common/vehicle-types/      →  vehicle-types/
common/payment-types/      →  payment-types/
common/expense-types/      →  expense-categories/
```

> **Diqqat:** `expense-types/` → `expense-categories/` ga **renamed** (frontend o'zgartirildi).

### Selectable helpers
```
common/selectable/user/                →  selectable/user/
common/selectable/vehicle/             →  selectable/vehicle/
common/selectable/vehicle-type/        →  selectable/vehicle-type/
common/selectable/<model_name>/        →  selectable/<model_name>/
```

`selectable/<model_name>/` qabul qiluvchi model nomlari: `region`, `district`, `country`, `cargo-type`, `payment-type`, `vehicle-type`, `client`, `expense-category`.

### Dashboard (was: Owner)
```
owner/main-statistic/         →  dashboard/main-statistic/
owner/trip-daily-statistic/   →  dashboard/trip-daily-statistic/
```

## O'zgarmagan endpointlar

Quyidagilar **xuddi avvalgidek**:

- `/auth/*`
- `/profile/`
- `/users/*` (roles, drivers ham)
- `/trips/*`
- `/vehicles/*` (technical-inspection ham)
- `/checkout/*` (cashflow, main)
- `/transaction/*`
- `/manager/*` — BFF role aggregator (saqlandi, README qo'shildi)
- `/mobile/*` — driver mobile (route-create, order-list, order-update)
- `/logs/*`

## Frontend o'zgarishlari

`src/constants/api-endpoints.ts` faylida barcha constant lar yangi URL ga moslandi. Constant nomlari saqlandi (kod buzilmasligi uchun) — faqat qiymatlari yangilandi.

Inline qattiq kodlangan URL lar:
- `src/pages/home/settings/route-configs/add-route.tsx` — `selectable/region`
- `src/pages/home/texnik-check/add-expense.tsx` — `selectable/vehicle`

## Migratsiya yo'riqnomasi

### Frontend developer uchun

```bash
git pull
pnpm install
pnpm dev
```

Hech qanday qo'shimcha o'zgarish kerak emas — `api-endpoints.ts` ichidagi constant qiymatlari yangilangan, barcha import qiluvchi joylar avtomatik yangi URL ga murojaat qiladi.

### Backend developer uchun

```bash
git pull
source venv/bin/activate
python manage.py check       # 0 issues bo'lishi kerak
python manage.py migrate     # state-only migration lar (DB tegmaydi)
```

Hozirgi DB jadvallari (`db_table`) o'zgarmaydi — faqat Django app state model joylashuvi o'zgardi.

### Eski mobil ilovalar uchun

Agar mobil ilova hali eski URL larga murojaat qilsa, backend da legacy redirect lar qo'shilishi mumkin. Hozircha bu yo'l qo'yilmagan — mobil app yangilanishi kerak.

## Faylar tahliloti

- Yangi yaratilgan apps: `places/`, `petrol_stations/`, `clients/`, `routes/`, `dashboard/`
- O'chirilgan apps: `owner/`, `mobile/`
- Common dan ko'chirilgan modellar: Country, Region, District, PetrolStation, Client, CargoType, VehicleType, PaymentType, ExpenseCategory, FuelLog, Direction, DirectionPrice
- O'zgartirilgan migrations (state-only, DB tegmaydi): 13 ta yangi migration

## Sanasi

- **2026-05-12** — Reorg branchi yaratildi (`reorg-by-claude-2026-05-12`)
- **2026-05-12** — API renaming yakunlandi
