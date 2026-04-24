# AquaMonitor Pro
### Smart Water Quality Monitoring System with Payment Integration

---

## 📁 Project Structure

```
aquamonitor/
├── backend/
│   ├── config/
│   │   └── db.js                  ← MongoDB connection
│   ├── controllers/
│   │   ├── authController.js      ← Register, Login, Profile
│   │   ├── waterController.js     ← IoT readings, alerts, analytics
│   │   └── paymentController.js   ← Razorpay order + verify
│   ├── middleware/
│   │   └── auth.js                ← JWT protect, admin, premium
│   ├── models/
│   │   ├── User.js                ← Users (bcrypt hashed passwords)
│   │   ├── WaterData.js           ← Sensor readings (auto WQI calc)
│   │   ├── Alert.js               ← Threshold breach alerts
│   │   └── Payment.js             ← Razorpay transactions
│   ├── routes/
│   │   ├── auth.js                ← /api/auth/*
│   │   ├── water.js               ← /api/water/*
│   │   └── payment.js             ← /api/payment/*
│   ├── .env                       ← Environment variables (edit this)
│   ├── package.json
│   └── server.js                  ← Express app entry point
│
└── frontend/
    └── public/
        ├── css/
        │   └── style.css          ← All styles
        ├── js/
        │   ├── api.js             ← API helper (fetch wrapper)
        │   └── app.js             ← All page logic, charts, auth
        └── index.html             ← Single-page app (all pages)
```

---

## ⚙️ Prerequisites

- Node.js v18+
- MongoDB (local or MongoDB Atlas)
- Razorpay account (for payments)

---

## 🚀 Setup Instructions

### Step 1 — Install dependencies
```bash
cd backend
npm install
```

### Step 2 — Configure environment
Edit `backend/.env` with your actual values:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/aquamonitor

JWT_SECRET=your_super_secret_key_here

RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxx

EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
```

### Step 3 — Start MongoDB
```bash
# If running locally:
mongod

# Or use MongoDB Atlas — just paste the connection string in MONGO_URI
```

### Step 4 — Start the backend server
```bash
cd backend
npm run dev        # development (auto-restart)
# or
npm start          # production
```

### Step 5 — Open the frontend
Open `frontend/public/index.html` in your browser.

**Option A** — Direct file open (quick test):
```
Just double-click index.html
```

**Option B** — Live Server (recommended for VS Code):
1. Install "Live Server" extension in VS Code
2. Right-click `index.html` → "Open with Live Server"
3. It will open at `http://127.0.0.1:5500`

**Option C** — Serve from backend (production):
The Express server at port 5000 also serves the frontend.
Visit: `http://localhost:5000`

---

## 🔑 API Endpoints Reference

### Auth
| Method | Route | Description | Auth |
|--------|-------|-------------|------|
| POST | /api/auth/register | Create new account | Public |
| POST | /api/auth/login | Login → get JWT | Public |
| GET | /api/auth/me | Get current user | Private |
| PUT | /api/auth/profile | Update profile | Private |
| PUT | /api/auth/change-password | Change password | Private |

### Water Quality
| Method | Route | Description | Auth |
|--------|-------|-------------|------|
| POST | /api/water | Add new sensor reading | Private |
| GET | /api/water | Get all readings | Private |
| GET | /api/water/latest | Latest reading per station | Private |
| GET | /api/water/analytics | Daily averages (7/30/90 days) | Pro only |
| GET | /api/water/alerts | Get all alerts | Private |
| PUT | /api/water/alerts/:id/resolve | Resolve an alert | Private |
| GET | /api/water/station/:id | Station readings history | Private |

### Payments (Razorpay)
| Method | Route | Description | Auth |
|--------|-------|-------------|------|
| POST | /api/payment/create-order | Create Razorpay order | Private |
| POST | /api/payment/verify | Verify payment signature | Private |
| GET | /api/payment/history | User payment history | Private |

---

## 💡 Adding IoT Sensor Data

To push real IoT data from a device (Raspberry Pi, ESP32, Arduino):

```javascript
// POST to /api/water with Bearer token
fetch('http://localhost:5000/api/water', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_JWT_TOKEN'
  },
  body: JSON.stringify({
    stationId: 'ST001',
    stationName: 'Ravi River Station',
    location: { name: 'Ludhiana, Punjab', lat: 30.7946, lng: 75.8458 },
    readings: {
      ph: 7.2,
      turbidity: 45,
      temperature: 28.5,
      dissolvedOxygen: 7.8,
      tds: 320,
      conductivity: 480
    },
    source: 'sensor'
  })
});
```

---

## 🔐 Security Notes

1. Change `JWT_SECRET` to a strong random string in production
2. Use environment variables — never hardcode secrets
3. Razorpay signature is verified server-side using HMAC-SHA256
4. Passwords are hashed with bcrypt (salt rounds: 10)
5. Premium routes are protected with `premiumOnly` middleware

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | HTML5, CSS3, Vanilla JS, Chart.js |
| Backend | Node.js, Express.js |
| Database | MongoDB + Mongoose |
| Auth | JWT + bcryptjs |
| Payments | Razorpay |
| Email | Nodemailer |

---

## 📊 Water Quality Index (WQI) Calculation

The WQI (0–100) is calculated automatically on each reading save:

| Parameter | Deduction |
|-----------|-----------|
| pH < 6.5 or > 8.5 | −25 points |
| pH < 6.8 or > 8.0 | −10 points |
| Turbidity > 100 NTU | −25 points |
| Turbidity > 70 NTU | −15 points |
| TDS > 1000 ppm | −25 points |
| TDS > 500 ppm | −15 points |
| DO₂ < 4 mg/L | −20 points |
| DO₂ < 6 mg/L | −10 points |

- **≥ 70** → Safe (green)
- **50–69** → Caution (yellow)
- **< 50** → Unsafe (red)
