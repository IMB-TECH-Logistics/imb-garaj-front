# Yo'nalishlar (Route Configs) — Settings Tab

Oldindan belgilangan yo'nalish tariflari. **Sozlamalar → Yo'nalishlar** (`/route-configs`).

To'liq backendga ulangan: ma'lumot `routes` endpointidan keladi, yaratish/tahrirlash/o'chirish
API orqali. Hech qanday localStorage yoki mahalliy store ishlatilmaydi.

## Ustunlar

| Ustun | Manba |
|---|---|
| Yuk egasi / Firma kodi | `owner_name`, `owner_code` — `routes` javobidan |
| Yuklash manzili | `load_name` |
| Yuk tushirish manzili | `unload_name` |
| Yuk turi | `cargo_type_name` |
| To'lov turi | `selectable/payment-type` dan qidiriladi (javobda `payment_type_name` yo'q) |
| Valyuta | `currency` (1 = UZS, 2 = USD) |
| Summa | `current_price.price`, yonidagi popover `prices[]` tarixini ko'rsatadi |

## API

| Amal | So'rov |
|---|---|
| Ro'yxat | `GET routes/` — `search`, `page`, `page_size` |
| Yaratish | `POST routes/create/` |
| Tahrirlash | `PATCH routes/<id>/update/` |
| O'chirish | `DELETE routes/<id>/delete/` |

Ochiluvchi ro'yxatlar: `selectable/client`, `selectable/region`, `selectable/cargo-type`,
`selectable/payment-type`. Valyuta — `add-route.tsx` dagi qattiq ro'yxat (backendda
`Direction.Currency` IntegerChoices).

Narx alohida jadvalda (`direction_prices`) versiyalanadi: formadagi `price` + `valid_from`
har saqlashda yangi versiya yaratadi, jadval `current_price` ni ko'rsatadi.

## Fayllar

```
src/pages/home/settings/route-configs/
├── index.tsx        ← sahifa: DataTable, modallar, paginatsiya
├── add-route.tsx    ← yaratish/tahrirlash formasi
├── cols.tsx         ← ustunlar + narx tarixi popoveri
└── README.md        ← shu fayl

src/routes/_main/_settings/route-configs/index.lazy.tsx   ← TanStack marshruti
```

## Konventsiyalar

- **Modal kalitlari:** `create` (qo'shish/tahrirlash), `delete` — loyihadagi umumiy nomlar.
  Bir vaqtda bitta marshrut mount bo'lgani uchun xavfsiz.
- **Tanlangan qator:** `useGlobalStore` da `COMMON_DIRECTIONS` kaliti ostida saqlanadi.
  `TableHeader` ning "Qo'shish" tugmasi modal ochishdan oldin `clearKey(storeKey)` chaqiradi.
- **Qidiruv:** URL parametri `route_configs_search`, server tomonida filtrlanadi.
- **Ruxsat:** `settings_directions_control` — bo'lmasa "Qo'shish", "Tahrirlash",
  "O'chirish" ko'rinmaydi (`hasControl`).
- **O'chirish:** umumiy `DeleteModal`, `id` sifatida `<id>/delete` uzatiladi, chunki
  backend uchun alohida yo'l.

## Diqqat qilinadigan joylar

- `payment_type_name` `routes` javobida yo'q — shuning uchun sahifa qo'shimcha
  `selectable/payment-type` so'rovini yuborib, id → nom xaritasini yasaydi.
  Backend bu maydonni qo'shsa, `paymentMap` ni olib tashlash mumkin.
- Tahrirlash formasida o'chirilgan ma'lumotnomalar (soft-deleted viloyat/mijoz)
  `withCurrent` yordamchisi orqali `(o'chirilgan)` belgisi bilan ko'rsatiladi —
  aks holda majburiy maydon bo'sh chiqadi.
- `routeTree.gen.ts` TanStack plagini tomonidan avtomatik yaratiladi, qo'lda tahrirlamang.
- `TableHeader` dagi `fileName` propi Excel eksporti uchun, lekin eksport komponentda
  izohga olingan — qiymat hozircha bezak.
