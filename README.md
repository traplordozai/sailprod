# SA1L - Student Articling Information and Logistics

A web application for managing student articling placements, built with Django and React.

## Project Structure

```
django-1/
├── backend/          # Django backend
│   ├── admin_portal/ # Admin portal app
│   ├── sail/         # Main application logic
│   └── ...
└── frontend/         # React frontend
    ├── src/
    ├── public/
    └── ...
```

## Setup

### Backend (Django)

1. Create and activate a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
cd backend
pip install -r requirements.txt
```

3. Set up the database:
```bash
python manage.py migrate
```

4. Create a superuser:
```bash
python manage.py createsuperuser
```

5. Run the development server:
```bash
python manage.py runserver
```

### Frontend (React)

1. Install dependencies:
```bash
cd frontend
npm install
```

2. Run the development server:
```bash
npm run dev
```

## Development

- Backend runs on http://127.0.0.1:8000/
- Frontend runs on http://127.0.0.1:5175/
- Admin interface available at http://127.0.0.1:8000/admin/

## Features

- User authentication with JWT
- Role-based access control (Student, Faculty, Organization)
- Student profile management
- Organization profile management
- Statement grading
- Matching algorithm for student placements
- CSV import for student data
- PDF grade import 