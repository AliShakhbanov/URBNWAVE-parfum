# URBNWAVE

Премиальный storefront для распива и Atelier-линейки парфюма.

## Запуск

1. Установите зависимости:

```bash
npm i
```

2. Создайте `.env` из шаблона:

```bash
cp .env.example .env
```

3. В первом терминале запустите analytics endpoint:

```bash
npm run analytics:server
```

4. Во втором терминале запустите фронт:

```bash
npm run dev
```

## Сборка

```bash
npm run build
```

Во время `build` автоматически генерируются:
- `public/sitemap.xml`
- `public/og/default.svg`
- `public/og/product-<id>.svg`

## Analytics endpoint

Локальный endpoint принимает события:
- `POST /collect`
- `GET /health`
- `GET /events?limit=100`
- `GET /metrics`

События сохраняются в `analytics/events-YYYY-MM-DD.ndjson`.

Фронт отправляет события, если задан `VITE_ANALYTICS_ENDPOINT`.
