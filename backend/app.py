import os
import time
import socket
import pymysql
from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

DB_USER = os.getenv("DB_USER", "root")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = int(os.getenv("DB_PORT", 3306))
DB_NAME = os.getenv("DB_NAME", "appointment_system")
SECRET_KEY = os.getenv("SECRET_KEY", "dev_secret_key_appointment_system")



# Initialize Flask and SQLAlchemy
app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})
app.config['SECRET_KEY'] = SECRET_KEY
app.config['SQLALCHEMY_DATABASE_URI'] = f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

db_connected = False
db_connection_error = None
_last_retry_time = 0
RETRY_INTERVAL = 10  # seconds between reconnect attempts

def _can_reach_mysql():
    """Quick TCP port check with a hard 3-second timeout to avoid hanging."""
    try:
        sock = socket.create_connection((DB_HOST, DB_PORT), timeout=3)
        sock.close()
        return True
    except Exception:
        return False

def init_db_with_retry():
    global db_connected, db_connection_error
    if db_connected:
        return True
    try:
        # Fast TCP check first — avoids pymysql hanging forever on Windows
        if not _can_reach_mysql():
            raise ConnectionRefusedError(f"Cannot reach MySQL at {DB_HOST}:{DB_PORT}. Is MySQL running?")

        # Connect to MySQL host without specifying a DB to create the database if missing
        conn = pymysql.connect(
            host=DB_HOST,
            user=DB_USER,
            password=DB_PASSWORD,
            port=DB_PORT,
            connect_timeout=3
        )
        try:
            with conn.cursor() as cursor:
                cursor.execute(f"CREATE DATABASE IF NOT EXISTS `{DB_NAME}`")
            conn.commit()
        finally:
            conn.close()

        # Create tables and seed mock data
        db.create_all()
        seed_database()

        db_connected = True
        db_connection_error = None
        print("✅ Database connected and initialized successfully.")
        return True
    except Exception as e:
        db_connection_error = str(e)
        db_connected = False
        print(f"⚠️  Database connection failed: {e}")
        return False

@app.before_request
def check_database_connection():
    global _last_retry_time
    if db_connected:
        return  # Already connected — fast path

    now = time.time()
    # Only retry every RETRY_INTERVAL seconds to avoid per-request hangs
    if now - _last_retry_time >= RETRY_INTERVAL:
        _last_retry_time = now
        init_db_with_retry()

    if not db_connected:
        return jsonify({
            'error': 'Database Offline',
            'message': 'Unable to connect to the MySQL database server. Please ensure MySQL is running on your machine and configured correctly in backend/.env.',
            'details': db_connection_error
        }), 503

# 2. Database Models
class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    role = db.Column(db.String(50), nullable=False)

    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'name': self.name,
            'role': self.role
        }

class Appointment(db.Model):
    __tablename__ = 'appointments'
    id = db.Column(db.BigInteger, primary_key=True)  # Using BigInt to support Date.now() timestamp IDs from frontend
    name = db.Column(db.String(100), nullable=False)
    reason = db.Column(db.String(255), nullable=False)
    phone = db.Column(db.String(50), nullable=False)
    email = db.Column(db.String(100), nullable=False)
    date = db.Column(db.String(10), nullable=False)  # YYYY-MM-DD
    time = db.Column(db.String(20), nullable=False)
    status = db.Column(db.String(20), default='Pending')  # Pending, Confirmed, Cancelled
    refNo = db.Column(db.String(50), unique=True, nullable=False)
    nic = db.Column(db.String(20), nullable=False)
    district = db.Column(db.String(50), nullable=False)
    province = db.Column(db.String(50), nullable=False)
    council = db.Column(db.String(100), nullable=False)
    gsDivision = db.Column(db.String(100), nullable=False)
    address = db.Column(db.Text, nullable=False)
    postalCode = db.Column(db.String(20), nullable=False)
    officer = db.Column(db.String(50), nullable=False)  # Secretary, Deputy Minister, Minister
    cancellationRemark = db.Column(db.Text, nullable=True)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'reason': self.reason,
            'phone': self.phone,
            'email': self.email,
            'date': self.date,
            'time': self.time,
            'status': self.status,
            'refNo': self.refNo,
            'nic': self.nic,
            'district': self.district,
            'province': self.province,
            'council': self.council,
            'gsDivision': self.gsDivision,
            'address': self.address,
            'postalCode': self.postalCode,
            'officer': self.officer,
            'cancellationRemark': self.cancellationRemark
        }

class AllowedDate(db.Model):
    __tablename__ = 'allowed_dates'
    id = db.Column(db.Integer, primary_key=True)
    role = db.Column(db.String(50), nullable=False)
    date = db.Column(db.String(10), nullable=False)  # YYYY-MM-DD

    def to_dict(self):
        return {
            'id': self.id,
            'role': self.role,
            'date': self.date
        }

# 3. Database Seeding Setup
def seed_database():
    # Only seed if no users exist
    if User.query.first() is None:
        print("Seeding database with initial mock data...")
        
        # Add mock users
        users = [
            User(username='secretary', name='Secretary of Ministry', role='Secretary', password_hash=generate_password_hash('password123')),
            User(username='deputy_minister', name='Deputy Minister', role='Deputy Minister', password_hash=generate_password_hash('password123')),
            User(username='minister', name='Hon. Minister', role='Minister', password_hash=generate_password_hash('password123'))
        ]
        db.session.add_all(users)

        # Add initial mock appointments
        initial_appointments = [
            Appointment(id=1, name='Sarah Connor', reason='General Consultation', date='2026-08-24', time='10:00 AM', status='Confirmed', phone='+1 555-0199', email='sarah.c@cyberdyne.com', refNo='APPT-5B9C2D', nic='198412345678', district='Colombo', province='Western', council='Colombo Municipal Council', gsDivision='Fort', address='Cyberdyne HQ, Colombo', postalCode='00100', officer='Secretary'),
            Appointment(id=2, name='John Doe', reason='Dental Cleaning', date='2026-08-24', time='11:30 AM', status='Pending', phone='+1 555-0143', email='john.doe@gmail.com', refNo='APPT-9X4E1F', nic='199098765432', district='Kandy', province='Central', council='Kandy Municipal Council', gsDivision='Katugastota', address='45, Peradeniya Rd, Kandy', postalCode='20000', officer='Secretary'),
            Appointment(id=3, name='Bruce Wayne', reason='Therapy Session', date='2026-08-25', time='03:00 PM', status='Confirmed', phone='+1 555-0100', email='bruce@waynecorp.com', refNo='APPT-2A7D8K', nic='197544332211', district='Galle', province='Southern', council='Galle Municipal Council', gsDivision='Fort', address='Wayne Manor, Galle', postalCode='80000', officer='Secretary'),
            Appointment(id=4, name='Clark Kent', reason='Eye Examination', date='2026-08-23', time='09:00 AM', status='Cancelled', phone='+1 555-0112', email='clark.k@dailyplanet.com', refNo='APPT-3H8J9P', nic='198088776655', district='Gampaha', province='Western', council='Gampaha Municipal Council', gsDivision='Kadawatha', address='32, Kandy Rd, Kadawatha', postalCode='11850', officer='Secretary', cancellationRemark='Urgent assignment at the Daily Planet'),
            Appointment(id=5, name='Diana Prince', reason='Cardiology Check', date='2026-08-25', time='02:00 PM', status='Pending', phone='+1 555-0125', email='diana@themyscira.gov', refNo='APPT-4Y9L0Q', nic='198555443322', district='Jaffna', province='Northern', council='Jaffna Municipal Council', gsDivision='Nallur', address='Temple Rd, Nallur, Jaffna', postalCode='40000', officer='Secretary'),
            Appointment(id=6, name='Arthur Dent', reason='Sandwich Making consultation', date='2026-08-27', time='09:30 AM', status='Confirmed', phone='+44 7700 900077', email='arthur.dent@prefect.com', refNo='APPT-6F8G9H', nic='197943210987', district='Colombo', province='Western', council='Colombo Municipal Council', gsDivision='Kollupitiya', address='12, Galle Rd, Colombo', postalCode='00300', officer='Deputy Minister'),
            Appointment(id=7, name='Tricia McMillan', reason='Astrophysics Discussion', date='2026-08-28', time='11:00 AM', status='Pending', phone='+44 7700 900088', email='trillian@heartofgold.org', refNo='APPT-7I9J0K', nic='198112345098', district='Kandy', province='Central', council='Kandy Municipal Council', gsDivision='Peradeniya', address='Royal Botanic Gardens, Kandy', postalCode='20400', officer='Deputy Minister'),
            Appointment(id=8, name='Ford Prefect', reason='Guide Entry Updates', date='2026-08-28', time='02:00 PM', status='Confirmed', phone='+1 555-4242', email='ford@hitchhikers.guide', refNo='APPT-8L0M1N', nic='197822446688', district='Galle', province='Southern', council='Galle Municipal Council', gsDivision='Fort', address='Light House Street, Galle Fort', postalCode='80000', officer='Minister'),
            Appointment(id=9, name='Zaphod Beeblebrox', reason='Ego Boost Interview', date='2026-08-31', time='04:00 PM', status='Pending', phone='+1 555-9999', email='president@galaxy.gov', refNo='APPT-9O1P2Q', nic='197011335577', district='Jaffna', province='Northern', council='Jaffna Municipal Council', gsDivision='Chunnakam', address='Kankesanthurai Rd, Jaffna', postalCode='40000', officer='Minister')
        ]
        db.session.add_all(initial_appointments)

        # Add initial mock allowed dates by role
        default_dates = {
            'Secretary': ['2026-08-26', '2026-08-27', '2026-08-28', '2026-09-01', '2026-09-02'],
            'Deputy Minister': ['2026-08-27', '2026-08-28', '2026-08-29', '2026-09-03', '2026-09-04'],
            'Minister': ['2026-08-28', '2026-08-31', '2026-09-02', '2026-09-05', '2026-09-06']
        }
        for role, dates in default_dates.items():
            for d in dates:
                db.session.add(AllowedDate(role=role, date=d))

        db.session.commit()
        print("Database seeding completed.")

# 4. API Endpoints

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    if not data or 'username' not in data or 'password' not in data:
        return jsonify({'error': 'Please provide username and password'}), 400
    
    username = data['username'].strip().lower()
    password = data['password'].strip()

    user = User.query.filter_by(username=username).first()
    if user and check_password_hash(user.password_hash, password):
        return jsonify(user.to_dict()), 200
    
    return jsonify({'error': 'Invalid credentials'}), 401


@app.route('/api/appointments', methods=['GET'])
def get_appointments():
    try:
        appts = Appointment.query.order_by(Appointment.id.desc()).all()
        return jsonify([a.to_dict() for a in appts]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/appointments', methods=['POST'])
def create_appointment():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    required_fields = ['name', 'reason', 'phone', 'email', 'date', 'time', 'refNo', 'nic', 
                       'district', 'province', 'council', 'gsDivision', 'address', 'postalCode', 'officer']
    
    for field in required_fields:
        if field not in data:
            return jsonify({'error': f'Field "{field}" is required'}), 400

    try:
        # Use frontend's ID or generate one if not supplied
        appt_id = data.get('id', int(time.time() * 1000))
        
        new_appt = Appointment(
            id=appt_id,
            name=data['name'],
            reason=data['reason'],
            phone=data['phone'],
            email=data['email'],
            date=data['date'],
            time=data['time'],
            status=data.get('status', 'Pending'),
            refNo=data['refNo'],
            nic=data['nic'],
            district=data['district'],
            province=data['province'],
            council=data['council'],
            gsDivision=data['gsDivision'],
            address=data['address'],
            postalCode=data['postalCode'],
            officer=data['officer']
        )
        db.session.add(new_appt)
        db.session.commit()
        return jsonify(new_appt.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@app.route('/api/appointments/<int:appt_id>/status', methods=['PUT'])
def update_appointment_status(appt_id):
    data = request.get_json()
    if not data or 'status' not in data:
        return jsonify({'error': 'Field "status" is required'}), 400
    
    new_status = data['status']
    if new_status not in ['Pending', 'Confirmed', 'Cancelled']:
        return jsonify({'error': 'Invalid status'}), 400

    try:
        appt = db.session.get(Appointment, appt_id)
        if not appt:
            return jsonify({'error': 'Appointment not found'}), 404
        
        appt.status = new_status
        if new_status == 'Cancelled':
            appt.cancellationRemark = data.get('cancellationRemark', '')
        else:
            appt.cancellationRemark = None

        db.session.commit()
        return jsonify(appt.to_dict()), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@app.route('/api/appointments/<int:appt_id>', methods=['DELETE'])
def delete_appointment(appt_id):
    try:
        appt = db.session.get(Appointment, appt_id)
        if not appt:
            return jsonify({'error': 'Appointment not found'}), 404
        
        db.session.delete(appt)
        db.session.commit()
        return jsonify({'success': True}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@app.route('/api/schedule', methods=['GET'])
def get_schedule():
    try:
        dates = AllowedDate.query.all()
        # Group by role for the frontend
        grouped = {
            'Secretary': [],
            'Deputy Minister': [],
            'Minister': []
        }
        for d in dates:
            if d.role in grouped:
                grouped[d.role].append(d.date)
            else:
                grouped[d.role] = [d.date]
        
        # Sort dates for each role
        for role in grouped:
            grouped[role].sort()

        return jsonify(grouped), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/schedule', methods=['POST'])
def add_allowed_date():
    data = request.get_json()
    if not data or 'role' not in data or 'date' not in data:
        return jsonify({'error': 'Fields "role" and "date" are required'}), 400
    
    role = data['role']
    date_val = data['date']

    try:
        # Check if already exists
        exists = AllowedDate.query.filter_by(role=role, date=date_val).first()
        if exists:
            return jsonify({'error': 'Date already enabled for this role'}), 400

        new_date = AllowedDate(role=role, date=date_val)
        db.session.add(new_date)
        db.session.commit()
        return jsonify(new_date.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@app.route('/api/schedule', methods=['DELETE'])
def remove_allowed_date():
    role = request.args.get('role')
    date_val = request.args.get('date')

    if not role or not date_val:
        return jsonify({'error': 'Query parameters "role" and "date" are required'}), 400

    try:
        item = AllowedDate.query.filter_by(role=role, date=date_val).first()
        if not item:
            return jsonify({'error': 'Allowed date mapping not found'}), 404
        
        db.session.delete(item)
        db.session.commit()
        return jsonify({'success': True}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    # Attempt DB init at startup so it's ready before first request
    with app.app_context():
        print("🔄 Attempting database initialization at startup...")
        init_db_with_retry()
    app.run(host='0.0.0.0', port=5000, debug=True, use_reloader=False)
