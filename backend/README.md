# RoadFix Backend (FastAPI + MongoDB)

This backend is built for the RoadFix frontend and uses MongoDB for data storage.

## Features
- Citizen register/login (email or phone + password)
- Admin login
- JWT auth with role-based access
- Create/list reports
- Status progression updates (admin)
- Confirm/upvote issue
- Upload/save resolution evidence URL (admin)
- Dashboard summary + recent solved

## Folder
- This backend is intentionally created in `back end/` as requested.

## Setup
1. Open terminal in `back end/`
2. Create virtual environment (optional but recommended)
3. Install dependencies:
   - `pip install -r requirements.txt`
4. Copy `.env.example` to `.env` and update values
5. Run API:
   - `uvicorn main:app --reload --port 8000`

## API Base URL
- `http://localhost:8000`

## Key Endpoints
- `POST /api/auth/citizen/register`
- `POST /api/auth/citizen/login`
- `POST /api/auth/admin/login`
- `GET /api/reports`
- `POST /api/reports`
- `PATCH /api/reports/{report_id}/status` (admin)
- `PATCH /api/reports/{report_id}/confirm`
- `PATCH /api/reports/{report_id}/evidence` (admin)
- `GET /api/reports/summary`
- `GET /api/reports/recent-solved`

## Notes
- Current frontend still stores and reads local state. To make every button fully backend-driven, next step is wiring the frontend API calls to these endpoints.
