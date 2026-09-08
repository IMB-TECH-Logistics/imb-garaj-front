# Yo'nalishlar (Route Configs) — Sozlamalar bo'limi

`Sozlamalar → Yo'nalishlar` (`/route-configs`) sahifasi. **To'liq API'ga ulangan** —
localStorage yoki qotirilgan (hardcoded) ma'lumot ishlatilmaydi.

> Eslatma: bu hujjatning avvalgi versiyasi sahifani "frontend-only, zustand +
> localStorage" deb tasvirlagan edi. Bu allaqachon to'g'ri emas edi (UI audit
> topilmasi S1-24) va 2026-09-08 da haqiqiy holatga moslab qayta yozildi.

## Nima qiladi

Oldindan belgilangan yo'nalish (direction) yozuvlari jadvali. Har bir qator:

| Maydon | Komponent | Manba |
|---|---|---|
| Yuklash manzili | combobox | `selectable/region` |
| Yuk tushirish manzili | combobox | `selectable/region` |
| Yuk egasi | combobox | `SETTINGS_SELECTABLE_CLIENT` |
| Yuk turi | combobox | `SETTINGS_SELECTABLE_CARGO_TYPE` |
| To'lov turi | combobox | `SETTINGS_SELECTABLE_PAYMENT_TYPE` |
| Valyuta | combobox | lokal ro'yxat (UZS / USD) |
| Summa | raqam maydoni | narx tarixi bilan (`current_price` / `prices`) |
| Qaysi sanadan amal qiladi | sana | `valid_from` |

Qo'shish / tahrirlash / o'chirish va qidiruv — hammasi server tomonda.

## Fayllar

```
src/pages/home/settings/route-configs/
├── index.tsx        ← sahifa: DataTable + Modal + DeleteModal
├── add-route.tsx    ← yaratish/tahrirlash formasi
├── cols.tsx         ← jadval ustunlari + narx tarixi popover'i
└── README.md        ← shu fayl
```

`cols.tsx` dagi `DirectionRow` / `DirectionPrice` tiplari va `useDirectionColumns`
`../driver-salaries` sahifasida ham qayta ishlatiladi — o'zgartirishdan oldin
o'sha sahifani ham tekshiring.

## Ulanish nuqtalari

- **Route:** `/_main/_settings/route-configs/` (`createLazyFileRoute`)
- **Endpoint:** `COMMON_DIRECTIONS`
  - ro'yxat: `GET {COMMON_DIRECTIONS}` (`search`, `page`, `page_size`)
  - yaratish: `POST {COMMON_DIRECTIONS}/create`
  - tahrirlash: `PATCH {COMMON_DIRECTIONS}/{id}/update`
  - o'chirish: `DELETE {COMMON_DIRECTIONS}/{id}/delete` (shared `DeleteModal`)
- **Tahrirlash holati:** `useGlobalStore` da `COMMON_DIRECTIONS` kaliti bilan
  (jadval qatorining to'liq obyekti saqlanadi — `*_name` maydonlari bilan birga).
- **Menyu:** `src/hooks/usePaths.tsx`
- **Qidiruv:** `TableHeader` → `route_configs_search` URL parametri → server `search`

## Ma'lumot ko'rsatishdagi ikki nozik nuqta

1. **`payment_type_name` javobda yo'q.** Shu sababli `index.tsx` `selectable/payment-type`
   ro'yxatini alohida yuklab, id → nom xaritasini o'zi quradi.
2. **Arxivlangan (soft-delete qilingan) ma'lumotnomalar.** `selectable/*` feedlari
   `deleted=False` bo'yicha filtrlanadi, jadval esa nomni FK orqali chiqaradi.
   Natijada o'chirilgan manzilga bog'langan yo'nalish tahrirlashda bo'sh
   ko'rinardi (S1-19). `add-route.tsx` dagi `withCurrentValue()` shu holatda
   saqlangan qiymatni ro'yxatga "(arxivlangan)" belgisi bilan qo'shadi va
   forma tepasida ogohlantirish chiqaradi. To'liq yechim server tomonda —
   `tuzatish-20260908/backend-kerak/F3.md` ga qarang.

## Validatsiya

Formada: barcha 8 maydon majburiy (xato matni ko'rinadi), summa **0 dan katta**
bo'lishi shart va manfiy raqam kiritilmaydi (`allowNegative={false}`),
yuklash va yuk tushirish manzili bir xil bo'lolmaydi.

⚠️ Bularning hammasi **faqat brauzer tomonda**. Server hozircha manfiy narxni
ham, `load == unload` yo'nalishni ham qabul qiladi — talablar
`tuzatish-20260908/backend-kerak/F3.md` da (S1-17, S1-18).
