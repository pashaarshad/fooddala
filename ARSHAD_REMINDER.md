# 🍔 Fooddala - Project Documentation

## Dear Arshad Pasha,

This is written by you yourself, **Arshad Pasha**, as a future reminder on how to run and manage this project.

---

## 📁 Project Structure

This project has **3 main components**:

```
📁 fooddala/
├── 📁 backend/        → Node.js API Server
├── 📁 web/            → Next.js Web Application
└── 📁 fooddala_app/   → Flutter Mobile Application
```

---

## 🚀 Deployment URLs

| Component | Platform | Live URL |
|-----------|----------|----------|
| **Backend API** | Render | https://fooddala.onrender.com/api |
| **Web App** | Vercel | https://fooddala.vercel.app |
| **Mobile App** | APK | Build locally and install |

---

## 🔧 How to Run Locally

### 1. Backend (Node.js)
```bash
cd fooddala/backend
npm install
npm run dev
# Runs on: http://localhost:5000
```

### 2. Web (Next.js)
```bash
cd fooddala/web
npm install
npm run dev
# Runs on: http://localhost:3000
```

### 3. Flutter App
```bash
cd fooddala/fooddala_app
flutter pub get
flutter run -d chrome    # For web
flutter run               # For connected device
```

---

## 📱 Building the APK

```bash
cd fooddala/fooddala_app
flutter clean
flutter pub get
flutter build apk --release

# APK Location: build/app/outputs/flutter-apk/app-release.apk
```

---

## 🔑 Environment Variables

### Backend (.env)
```
MONGODB_URI=mongodb+srv://arshadpashaintern_db_user:***@cluster0.rcs2ev7.mongodb.net/fooddala
JWT_SECRET=fooddala-jwt-key-2024-production-ready
JWT_EXPIRE=7d
NODE_ENV=production
```

### Web (.env.local)
```
NEXT_PUBLIC_API_URL=https://fooddala.onrender.com/api
```

### Flutter (lib/utils/constants.dart)
```dart
static const String baseUrl = 'https://fooddala.onrender.com/api';
```

---

## 👥 Test Accounts

| Role | Email | Password |
|------|-------|----------|
| Customer | test@example.com | password123 |
| Restaurant | restaurant@fooddala.com | password123 |
| Driver | driver@fooddala.com | password123 |

---

## 📝 Important Notes

1. **Free Tier Limitation**: Render free tier sleeps after 15 mins of inactivity. First request may take 30-60 seconds to wake up.

2. **To Update Backend**: Push changes to GitHub → Render auto-deploys

3. **To Update Web**: Push changes to GitHub → Vercel auto-deploys

4. **Local Development**: Change `constants.dart` baseUrl to `http://localhost:5000/api`

---

## 🛠️ Tech Stack

- **Backend**: Node.js, Express, MongoDB, JWT
- **Web**: Next.js 14, React, Tailwind CSS
- **Mobile**: Flutter, Dart
- **Database**: MongoDB Atlas
- **Payments**: Razorpay (test mode)
- **SMS**: Fast2SMS for OTP

---

## 📅 Created

- **Date**: January 2026
- **By**: Arshad Pasha
- **With Help From**: AI Assistant (Antigravity)

---

*Good luck with the project, future Arshad! 🚀*
