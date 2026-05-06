# PGAS Platform

Веб-приложение на Django для автоматизации подачи, проверки и расчета баллов на ПГАС.

## Что реализовано

- Роли: пользователь и администратор.
- Цифровой профиль студента (ФИО, дата рождения, институт, специальность, курс, форма обучения, портфолио).
- Загрузка грамот (фото/скан/PDF), в том числе с телефона через камеру.
- Автоматический расчет баллов по уровню мероприятия и месту.
- Ручная корректировка баллов администратором.
- Расчет соответствия выбранной стипендии.
- Архивация просроченных грамот (старше года после подтверждения).
- Фильтрация грамот по уровню, месту, дате и баллам.
- Вкладка файлов (портфолио + все загруженные грамоты).
- Админ-инструменты: создание/редактирование/удаление пользователей, модерация грамот, статистика.

## Запуск

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py seed_demo
python manage.py runserver
```

## Демо-доступ

- Администратор: `admin / admin12345` (создается командой `seed_demo`).

## OCR (распознавание)

В проекте подключен `pytesseract` в режиме best-effort:

- Если на машине установлен Tesseract OCR, текст из изображений будет сохраняться в карточке грамоты.
- Если Tesseract не установлен, загрузка всё равно работает, просто поле распознанного текста останется пустым.

Для Windows нужно установить [Tesseract OCR](https://github.com/tesseract-ocr/tesseract) и добавить его в PATH.

## Мобильная загрузка

Поле загрузки грамоты использует атрибуты `accept="image/*,.pdf"` и `capture="environment"`, поэтому на телефоне открывается камера/галерея для быстрого сканирования документа.

## REST API (DRF + OpenAPI)

- База API: `http://127.0.0.1:8000/api/v1/`
- Swagger UI: `http://127.0.0.1:8000/api/v1/docs/`
- ReDoc: `http://127.0.0.1:8000/api/v1/redoc/`
- OpenAPI schema: `http://127.0.0.1:8000/api/v1/schema/`
- Получение токена: `POST /api/v1/auth/token/` (`username`, `password`)

Основные endpoints:

- `GET|PUT|PATCH /api/v1/profile/`
- `GET /api/v1/me/`
- `GET|POST /api/v1/certificates/`
- `GET /api/v1/certificates/{id}/`
- `GET /api/v1/scholarships/`
- `GET|POST /api/v1/calculations/`
- `GET /api/v1/calculations/{id}/`

Админ API:

- `GET|POST|PUT|PATCH|DELETE /api/v1/admin/users/`
- `GET|POST|PUT|PATCH|DELETE /api/v1/admin/certificates/`
- `GET|POST|PUT|PATCH|DELETE /api/v1/admin/adjustments/`
- `GET /api/v1/admin/statistics/`
