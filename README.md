# 🎓 Student Registration & Digital ID Badge System

A full-stack application built with **React** and **Express.js** for student enrollment, authentication, and digital ID card generation with QR verification.

---

## 🚀 How to Run in VS Code

You can run this project in VS Code using any of the following convenient methods:

### Method 1: One-Click Keyboard Shortcut (Recommended)
1. Open the project root folder (`student_app`) in VS Code.
2. Press **`Ctrl + Shift + B`** (or **`Cmd + Shift + B`** on macOS).
3. VS Code will automatically start both the backend server and the frontend client concurrently!
4. Open [http://localhost:3000](http://localhost:3000) in your browser.

---

### Method 2: Via VS Code Menu
1. In the top menu bar, click **Terminal** ➔ **Run Task...**
2. Select **`Start Full Stack (Server + Client)`**.
   *(You can also run `Start Backend Server Only` or `Start Frontend Client Only` if desired).*

---

### Method 3: Via Integrated Terminal
Open a terminal in the root folder and run:
```bash
npm run dev
```
> Both the backend (`http://localhost:5000`) and the frontend (`http://localhost:3000`) will launch simultaneously with color-coded log streams.

---

### Method 4: Debug Mode (F5)
1. Open the **Run and Debug** view in VS Code (`Ctrl + Shift + D`).
2. Select **`Full Stack Debug`** or **`Debug Express Backend`** from the dropdown.
3. Press **F5** to start debugging with breakpoints enabled.

---

## ✨ Features & Improvements

- **⚡ Instant Photo Preview**: Uploaded photos are previewed immediately before submission.
- **🛡️ Data Validation & Duplicate Prevention**: Prevents duplicate roll number registration and validates file types (JPEG, PNG, WEBP, GIF up to 5MB).
- **💾 Data Persistence**: Students and their records are safely stored in `server/data/students.json` and persist across restarts.
- **🔒 Robust Login & Error Handling**: Gracefully handles incorrect credentials with inline error alerts without page crashes.
- **🔄 Session Persistence**: Staying logged in across page refreshes via `localStorage`.
- **🪪 Professional ID Badge**:
  - University crest and header with verified status indicators.
  - High-resolution student photo frame.
  - Verifiable QR Code containing encoded identity payload.
  - Realistic barcode and registrar signature notice.
  - **🖨️ Print & Save ID Card**: Uses `@media print` CSS so clicking **Print ID Card** prints *only* the identification badge perfectly centered on paper or PDF.
  - **Log Out / Switch Account** buttons.

---

## 📁 Project Structure

```
student_app/
├── .vscode/
│   ├── launch.json       # VS Code debugging configurations
│   └── tasks.json        # One-click VS Code build and launch tasks
├── client/               # React Frontend
│   ├── public/
│   └── src/
│       ├── components/
│       │   ├── Badge.js    # Digital ID Card with QR & Print support
│       │   ├── Login.js    # Student Login with error handling
│       │   └── register.js # Student Registration with photo preview
│       ├── config.js       # Centralized API endpoints
│       ├── App.js          # Main app container & session management
│       ├── App.css         # Modern design, animations & print styles
│       └── index.js
├── server/               # Express Backend
│   ├── data/
│   │   └── students.json # Persistent student database
│   ├── uploads/          # Uploaded profile photos
│   ├── server.js         # API routes, multer storage, and QR generator
│   └── package.json
├── package.json          # Root orchestration scripts (concurrently)
└── README.md
```

---

## 🌐 API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | API Health Check |
| `POST` | `/register` | Register student (multipart form with photo) |
| `POST` | `/login` | Authenticate student via roll number and password |
| `GET` | `/verify/:roll` | Retrieve verified student details |
| `GET` | `/qr/:id` | Generate QR code data URL |
| `GET` | `/uploads/:file` | Serve student profile photo |
