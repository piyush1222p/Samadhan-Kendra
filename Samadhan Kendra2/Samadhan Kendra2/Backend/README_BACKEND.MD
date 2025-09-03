# Samadhan Kendra Backend (Django + DRF)

## Quickstart (local)

1. cd Backend
2. cp .env.example .env
3. python -m venv .venv && source .venv/bin/activate
4. pip install -r requirements.txt
5. python manage.py migrate
6. python manage.py createsuperuser
7. python manage.py runserver

API at http://localhost:8000

## With Docker

- cd Backend
- cp .env.example .env
- Uncomment DATABASE_URL in `.env` for Postgres (matches docker-compose)
- docker compose up --build
- Apply migrations (inside container if needed): `docker compose exec web python manage.py migrate`
- Create admin: `docker compose exec web python manage.py createsuperuser`

## Endpoints

- POST /api/auth/register/ — create a user
- POST /api/auth/login/ — JWT login (username/password)
- POST /api/auth/refresh/ — refresh token

- GET /api/departments/
- GET/POST /api/grievances/
- GET/PATCH/DELETE /api/grievances/{id}/
- POST /api/grievances/{id}/comment/ — add a comment
- POST /api/grievances/{id}/set_status/ — staff only
- POST /api/grievances/{id}/assign/ — staff only

## Notes

- Default DB is SQLite; set `DATABASE_URL` for Postgres (e.g., docker-compose)
- Set `CORS_ALLOWED_ORIGINS` for your frontend URL(s), e.g. `http://localhost:5173` or `http://localhost:3000`
- Time zone set to Asia/Kolkata