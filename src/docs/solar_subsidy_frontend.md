# SolarPanelCRM Frontend uchun subsidiya sozlamalari

Bu hujjat admin qo'lda subsidiya qiymatlarini boshqarishi va webapp/frontend kalkulyator shu qiymatlar asosida ishlashi uchun yozildi.

## Asosiy qoida

Frontend subsidiya foizi, maksimal summa yoki hisoblash formulasini o'zida hardcode qilmaydi.

Hamma hisob-kitob backenddan olinadi:

- Admin panelda subsidiya sozlamalari backendga saqlanadi.
- Webapp kalkulyator backend calculator APIga request yuboradi.
- AI ham subsidiya haqida javob berganda backenddagi live config/calculator natijasiga tayanadi.
- Frontend faqat backend qaytargan `base_price`, `subsidy_amount`, `customer_amount` qiymatlarini ko'rsatadi.

## Admin UI

Admin uchun alohida "Subsidiya sozlamalari" page kerak.

Tavsiya qilingan joy:

- `Settings`
- yoki `Hisob-kitob`
- yoki `Integratsiyalar / Biznes sozlamalari`

Page ichida quyidagi fieldlar bo'ladi:

- `enabled` — subsidiya kalkulyatori yoqilgan yoki o'chirilgan
- `subsidy_percent` — subsidiya foizi, masalan `20`
- `max_subsidy_amount` — maksimal subsidiya summasi, masalan `20600000`
- `max_subsidy_power_kw` — subsidiya hisoblanadigan maksimal quvvat, masalan `30`
- `description_uz` — frontend/webappda ko'rsatish uchun qisqa izoh
- `updated_at` — oxirgi o'zgargan vaqt
- `updated_by` — kim o'zgartirgani

## Config API

Admin sozlamalarni saqlash uchun mavjud config endpoint ishlatiladi.

Base endpoint:

```http
GET /api/integrations/configs/
POST /api/integrations/configs/
PATCH /api/integrations/configs/{id}/
DELETE /api/integrations/configs/{id}/
```

Auth:

```http
Authorization: Bearer <access_token>
```

Subsidiya sozlamalari uchun `provider` doim:

```text
subsidy
```

Tavsiya qilingan config keys:

```text
enabled
percent
max_amount
max_power_kw
description_uz
```

## Config yaratish

Misol:

```http
POST /api/integrations/configs/
Content-Type: application/json
Authorization: Bearer <access_token>
```

```json
{
  "provider": "subsidy",
  "key": "percent",
  "value": "20",
  "is_active": true,
  "description": "Subsidiya foizi"
}
```

Maksimal summa:

```json
{
  "provider": "subsidy",
  "key": "max_amount",
  "value": "20600000",
  "is_active": true,
  "description": "Maksimal subsidiya summasi"
}
```

Maksimal quvvat:

```json
{
  "provider": "subsidy",
  "key": "max_power_kw",
  "value": "30",
  "is_active": true,
  "description": "Subsidiya hisoblanadigan maksimal quvvat"
}
```

## Configlarni olish

```http
GET /api/integrations/configs/
Authorization: Bearer <access_token>
```

Response:

```json
{
  "status": "success",
  "data": [
    {
      "id": "uuid",
      "provider": "subsidy",
      "key": "percent",
      "value": "20",
      "is_active": true,
      "description": "Subsidiya foizi",
      "updated_by": "uuid",
      "created_at": "2026-08-21T12:00:00+05:00",
      "updated_at": "2026-08-21T12:00:00+05:00"
    }
  ]
}
```

Frontend `provider === "subsidy"` bo'lganlarini ajratib oladi.

## Config update

```http
PATCH /api/integrations/configs/{id}/
Content-Type: application/json
Authorization: Bearer <access_token>
```

```json
{
  "value": "25",
  "is_active": true
}
```

Admin saqlash bosilganda:

- empty value yubormasin
- foiz uchun `0..100` oralig'ini frontendda validate qilsin
- summa va quvvat uchun manfiy qiymat yubormasin
- saqlangandan keyin configlarni qayta fetch qilsin

## Public calculator API

Webapp va frontend hisoblash uchun shu endpointdan foydalanadi:

```http
POST /api/common/public/subsidy-calculator/
Content-Type: application/json
```

Request:

```json
{
  "panel_type": "longi_hi_mo_x10",
  "inverter_type": "deye",
  "requested_power_kw": 10,
  "audit_power_kw": 10
}
```

Fieldlar:

- `panel_type` — panel turi
- `inverter_type` — inverter turi
- `requested_power_kw` — mijoz so'ragan quvvat
- `audit_power_kw` — auditdan keyin tasdiqlangan quvvat, optional

Muhim:

- Agar `audit_power_kw` berilsa, subsidiya shu quvvatga qarab hisoblanadi.
- Agar `audit_power_kw` berilmasa, `requested_power_kw` ishlatiladi.
- Frontend hech qachon subsidiya summasini o'zi hisoblamaydi.

Response:

```json
{
  "status": "success",
  "data": {
    "base_price": "43000000.00",
    "subsidy_amount": "8600000.00",
    "customer_amount": "34400000.00",
    "subsidy_reference_power_kw": 10,
    "max_subsidy_amount": "20600000.00"
  }
}
```

UI ko'rsatish:

- `base_price` — umumiy narx
- `subsidy_amount` — davlat subsidiyasi
- `customer_amount` — mijoz to'laydigan summa
- `subsidy_reference_power_kw` — subsidiya qaysi quvvatga hisoblangan
- `max_subsidy_amount` — maksimal subsidiya limiti

## Webapp catalog

Mahsulot list/detail response ichida subsidiya fieldlari kelsa, frontend shularni ko'rsatadi:

```json
{
  "subsidy_enabled": true,
  "subsidy_amount": "5000000.00",
  "price_after_subsidy": "20000000.00"
}
```

UI qoidasi:

- `subsidy_enabled = true` bo'lsa, "Subsidiya bilan" badge chiqadi.
- `price_after_subsidy` asosiy to'lov summasi sifatida ko'rsatiladi.
- `subsidy_amount` alohida qatorda "Subsidiya" deb ko'rsatiladi.
- `subsidy_enabled = false` bo'lsa, subsidiya badge va chegirma summasi ko'rsatilmaydi.

## Form dizayn tavsiyasi

Admin page sodda bo'lsin:

- tepada status card: "Subsidiya faol" yoki "O'chirilgan"
- yonida oxirgi yangilangan vaqt
- pastda 3 ta asosiy input: foiz, maksimal summa, maksimal quvvat
- izoh uchun textarea
- pastda "Saqlash" button

Formatlash:

- summa inputda `20 600 000 so'm` ko'rinishida ko'rsatish
- backendga faqat raqam yuborish, masalan `"20600000"`
- foiz inputda `%` suffix bo'lsin
- saqlashdan oldin confirm modal chiqsin

## Error handling

400 response kelsa:

```json
{
  "status": "error",
  "message": "Validation error"
}
```

Frontend:

- field-level error bo'lsa input tagida ko'rsatadi
- umumiy error bo'lsa toast ko'rsatadi
- calculator xato bersa webappda "Hisoblashda xatolik bo'ldi, qayta urinib ko'ring" deyish kifoya

## Frontend checklist

- Admin subsidiya sozlamalarini ko'ra oladi.
- Admin foiz, limit, maksimal quvvat va izohni o'zgartira oladi.
- Saqlangandan keyin calculator yangi qiymatlar bilan ishlashi kerak.
- Webapp catalogda `price_after_subsidy` va `subsidy_amount` backenddan kelganicha ko'rsatiladi.
- Frontendda subsidiya formulasi yozilmaydi.
- Empty yoki inactive config bo'lsa backend default qiymatlari ishlatiladi.
- Mobile/webappda summa formatlari bir xil bo'ladi.
