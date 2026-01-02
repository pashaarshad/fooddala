# Project Overview for Arshad

**Created By:** Arshad  
**Project Name:** Fooddala

## 🚀 Access Links
*   **Web Application (Live):** [https://fooddala.onrender.com](https://fooddala.onrender.com)
*   **Backend API (Live):** [https://fooddala.onrender.com/api](https://fooddala.onrender.com/api)
*   **Android APK (Local):** `fooddala_app/build/app/outputs/flutter-apk/app-release.apk`

---

## 🛠️ Technology Stack
### Core Technologies
*   **Web Frontend:** Next.js v13+ (React, CSS Modules/Tailwind optional)
*   **Backend API:** Node.js, Express.js
*   **Mobile Application:** Flutter (Dart)
*   **Database:** MongoDB Atlas (Cloud)

### Services & Integrations
*   **Authentication:** 
    *   **Firebase Authentication** (Google Sign-In for Web & Mobile)
    *   **Passport.js & JWT** (Session Management & Security)
*   **Maps & Location:** 
    *   **Google Maps API** (Geocoding & Places)
    *   **Leaflet / React-Leaflet** (Web Maps)
    *   **Geolocator** (Flutter GPS)
*   **Storage & Media:** 
    *   **Cloudinary** (Image Management)

---

## 📝 Project Summary (Detailed)
**Fooddala** is a comprehensive food delivery platform designed to seamlessly connect Customers, Restaurants, and Delivery Partners.

**Key Features:**
1.  **Unified Authentication:** Implements a hybrid auth system using Google Firebase for easy onboarding and Custom JWT for secure API access. Consistent login experience across Web and Mobile.
2.  **Multi-Platform Presence:**
    *   **Web Portal:** A responsive Next.js application handling complex user flows, restaurant management, and order tracking.
    *   **Mobile App:** A native-feel Flutter application optimized for Android with custom launcher icons, smooth animations (flutter_animate), and robust state management (Provider).
3.  **Real-Time Capabilities:** Built with `socket.io` for real-time order status updates and driver tracking.
4.  **Role-Based Architecture:** Distinct flows for Customers (Ordering), Restaurants (Menu/Order Mgmt), and Drivers (Delivery Tasks).

---

## ⚙️ Development Workflow for Arshad
1.  **Backend:** Started with `npm run dev` in `backend/` (Port 5000). Connects to MongoDB Atlas.
2.  **Web:** Started with `npm run dev` in `web/` (Port 3000). Consumes Backend API.
3.  **Mobile:** developed using `flutter run` and built using `flutter build apk --release`. Configured with `google-services.json` for Android G-Auth.
