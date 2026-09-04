# Appointment System — Backend

Flask + MySQL REST API that powers the Appointment System frontend.

## Quick Start

### 1. Prerequisites
- Python 3.10+
- MySQL 8.x running locally (or accessible remotely)

### 2. Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate it (Windows)
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### 3. Configure the database
Copy `.env.example` to `.env` and fill in your MySQL credentials:

```
DB_USER=root
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=3306
DB_NAME=appointment_system
SECRET_KEY=change_me_in_production
```

The backend will **automatically create** the `appointment_system` database and tables
on first run. It will also seed 3 admin users and 9 demo appointments.

### 4. Run

```bash
python app.py
```

The server starts on **http://localhost:5000**.

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/login` | Authenticate admin user |
| GET | `/api/appointments` | List all appointments |
| POST | `/api/appointments` | Create new appointment |
| PUT | `/api/appointments/<id>/status` | Update appointment status |
| DELETE | `/api/appointments/<id>` | Delete appointment |
| GET | `/api/schedule` | Get allowed booking dates by role |
| POST | `/api/schedule` | Enable a new booking date |
| DELETE | `/api/schedule?role=&date=` | Disable a booking date |
| GET | `/api/health` | Health / liveness check |

## Default Admin Credentials

| Username | Password | Role |
|----------|----------|------|
| `secretary` | `password123` | Secretary |
| `deputy_minister` | `password123` | Deputy Minister |
| `minister` | `password123` | Minister |

## Frontend Integration

The Vite dev server (`frontend/`) is already configured to proxy `/api/*` requests
to `http://127.0.0.1:5000`, so no CORS changes are needed during development.
