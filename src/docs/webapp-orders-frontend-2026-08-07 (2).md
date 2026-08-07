# Telegram WebApp Orders Frontend Update

Date: 2026-08-07
Backend: SolarPanelCRM
Base API route: `/api/integrations/telegram/webapp/`

## Summary

WebApp checkout now creates a separate order for every submit. One Telegram user/client can have many orders. Old orders remain visible, and every new checkout appears as a new row in order history.

Frontend must continue sending `X-Telegram-Init-Data` on all webapp requests.

## Checkout

Endpoint:

```http
POST /api/integrations/telegram/webapp/checkout/
```

Required headers:

```http
X-Telegram-Init-Data: <Telegram.WebApp.initData>
Content-Type: application/json
```

Recommended request body:

```json
{
  "full_name": "Ali Valiyev",
  "phone": "+998901234567",
  "fulfillment_method": "delivery",
  "address": "Toshkent, Yunusobod",
  "location": {
    "latitude": 41.311081,
    "longitude": 69.240562,
    "address_name": "Toshkent, Yunusobod tumani"
  },
  "payment_method": "payme",
  "audit_conclusion_kw": 10,
  "items": [
    {
      "product": "PRODUCT_UUID",
      "quantity": 1
    }
  ]
}
```

`location` optional, but if user shares location from WebApp, send it. Backend accepts these key names:

- Latitude: `latitude` or `lat`
- Longitude: `longitude`, `lng`, `lon`, or `long`
- Address name: `address_name`, `addressName`, `display_name`, `displayName`, `name`, or `address`

Successful response:

```json
{
  "status": "success",
  "data": {
    "contract_id": "ORDER_UUID",
    "client_id": "CLIENT_UUID",
    "message": "Checkout accepted, client saved"
  }
}
```

Important frontend rule:

Every successful checkout is a new order. Do not overwrite old local order state. After checkout success, refetch `/orders/` or append the new order after reading `/orders/`.

## Orders History

Endpoint:

```http
GET /api/integrations/telegram/webapp/orders/
```

Response:

```json
{
  "status": "success",
  "data": [
    {
      "id": "ORDER_UUID",
      "title": "Solar Kit 5kW",
      "status": "draft",
      "status_label": "Draft",
      "delivery_status": "in_transit",
      "delivery_status_label": "Yo'lda",
      "total_amount": "20000000.00",
      "customer_phone": "+998901234567",
      "installation_address": "Toshkent, Yunusobod",
      "address_name": "Toshkent, Yunusobod tumani",
      "latitude": "41.311081",
      "longitude": "69.240562",
      "google_maps_url": "https://www.google.com/maps?q=41.311081,69.240562",
      "yandex_maps_url": "https://yandex.com/maps/?ll=69.240562,41.311081&z=16&pt=69.240562,41.311081",
      "fulfillment_method": "delivery",
      "payment_method": "payme",
      "items": [
        {
          "id": "ITEM_UUID",
          "product": "PRODUCT_UUID",
          "product_name": "Solar Kit 5kW",
          "quantity": 1,
          "unit_price": "20000000.00"
        }
      ],
      "created_at": "2026-08-07T12:00:00+05:00",
      "updated_at": "2026-08-07T12:00:00+05:00"
    }
  ]
}
```

Display recommendations:

- Show each object in `data` as a separate order card.
- Use `status_label` for visible text if UI is English/Russian neutral, or map `status` to Uzbek labels on frontend.
- Show `title`, `total_amount`, `created_at`, and status badge in the list.
- On order detail, show `items`, `address_name`, `installation_address`, phone, payment method, and map buttons.
- If `google_maps_url` exists, show "Google Map" button.
- If `yandex_maps_url` exists, show "Yandex Map" button.
- If `latitude`/`longitude` exists but links are empty, build map links on frontend using the same coordinates.

## Bootstrap

Endpoint:

```http
GET /api/integrations/telegram/webapp/bootstrap/
```

`active_order`, `order_history`, and `pending_reviews` now use the same order object shape as `/orders/`.

Frontend can use one shared TypeScript type for all order locations:

```ts
type WebAppOrder = {
  id: string;
  title: string;
  status: string;
  status_label: string;
  delivery_status: string;
  delivery_status_label: string;
  total_amount: string;
  customer_phone: string;
  installation_address: string;
  address_name: string;
  latitude?: string | null;
  longitude?: string | null;
  google_maps_url: string;
  yandex_maps_url: string;
  fulfillment_method: string;
  payment_method: string;
  items: Array<{
    id: string;
    product: string;
    product_name: string;
    quantity: number;
    unit_price: string;
  }>;
  created_at: string;
  updated_at: string;
};
```

## Frontend Location Flow

When user selects delivery:

1. Ask address text or WebApp location.
2. If WebApp geolocation is available, send `latitude`, `longitude`, and any readable `address_name`.
3. If readable address is not available, send coordinates anyway. Backend will still return Google/Yandex links.
4. Do not store orders only in local storage. Always refetch `/orders/` because CRM can update order status later.

## Status Handling

Backend order workflow status comes from CRM `Contract.status`.

Common workflow values:

- `draft`
- `audit_pending`
- `audit_paid`
- `moderation`
- `contract_ready`
- `payment_pending`
- `paid`
- `in_lot`
- `completed`
- `canceled`

Delivery progress comes from `delivery_status`.

Common delivery values:

- `pending`
- `in_transit` means `Yo'lda`
- `delivered`

Frontend should show delivery progress from `delivery_status_label` when the UI is about delivery/order route progress. Treat unknown statuses safely by showing the label or raw value.
