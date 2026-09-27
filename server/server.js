const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const QRCode = require("qrcode");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ensure upload & data directories exist using absolute paths
const uploadsDir = path.join(__dirname, "uploads");
const dataDir = path.join(__dirname, "data");
const dataFilePath = path.join(dataDir, "students.json");

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}
if (!fs.existsSync(dataFilePath)) {
  fs.writeFileSync(dataFilePath, JSON.stringify([], null, 2), "utf8");
}

// Helper functions for persistent student storage
function getStudents() {
  try {
    const data = fs.readFileSync(dataFilePath, "utf8");
    return JSON.parse(data || "[]");
  } catch (err) {
    console.error("Error reading students.json:", err);
    return [];
  }
}

function saveStudents(students) {
  try {
    fs.writeFileSync(dataFilePath, JSON.stringify(students, null, 2), "utf8");
    return true;
  } catch (err) {
    console.error("Error writing students.json:", err);
    return false;
  }
}

function deleteUploadedFile(filename) {
  if (!filename) return;
  const filePath = path.join(uploadsDir, filename);
  if (fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
    } catch (err) {
      console.error("Failed to delete orphaned file:", err);
    }
  }
}

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, uniqueName);
  },
});

// Multer File Filter for Images
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg", "image/gif"];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only image files (.jpg, .jpeg, .png, .webp, .gif) are allowed"), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
});

// Serve uploaded photos statically
app.use("/uploads", express.static(uploadsDir));

// HEALTH CHECK ROUTE
app.get("/", (req, res) => {
  res.json({ status: "ok", message: "Student App API is running." });
});

// REGISTER ROUTE
app.post("/register", (req, res) => {
  upload.single("photo")(req, res, (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }

    const { name, department, roll, password } = req.body;

    // Validate required fields
    if (!name || !department || !roll || !password || !req.file) {
      if (req.file) deleteUploadedFile(req.file.filename);
      return res.status(400).json({
        success: false,
        message: "Please fill in all fields and select a photo.",
      });
    }

    const trimmedRoll = roll.toString().trim();
    const trimmedName = name.trim();
    const trimmedDept = department.trim();

    const students = getStudents();

    // Check if roll number is already registered
    const existing = students.find(
      (s) => s.roll.toString().trim().toLowerCase() === trimmedRoll.toLowerCase()
    );

    if (existing) {
      deleteUploadedFile(req.file.filename);
      return res.status(409).json({
        success: false,
        message: `Roll number ${trimmedRoll} is already registered. Please login or use a different roll number.`,
      });
    }

    const newStudent = {
      id: students.length > 0 ? Math.max(...students.map((s) => s.id || 0)) + 1 : 1,
      name: trimmedName,
      department: trimmedDept,
      roll: trimmedRoll,
      password: password,
      photo: req.file.filename,
      registeredAt: new Date().toISOString(),
    };

    students.push(newStudent);
    saveStudents(students);

    // Return student data without password
    const { password: _, ...safeStudent } = newStudent;

    return res.status(201).json({
      success: true,
      message: "Student registered successfully!",
      student: safeStudent,
    });
  });
});

// LOGIN ROUTE
app.post("/login", (req, res) => {
  const { roll, password } = req.body;

  if (!roll || !password) {
    return res.status(400).json({
      success: false,
      message: "Please provide both roll number and password.",
    });
  }

  const trimmedRoll = roll.toString().trim().toLowerCase();
  const students = getStudents();

  const student = students.find(
    (s) => s.roll.toString().trim().toLowerCase() === trimmedRoll && s.password === password
  );

  if (!student) {
    return res.status(401).json({
      success: false,
      message: "Invalid roll number or password.",
    });
  }

  // Return student data without password
  const { password: _, ...safeStudent } = student;

  return res.json({
    success: true,
    message: "Login successful!",
    student: safeStudent,
  });
});

// VERIFY / STUDENT DETAILS ROUTE
app.get("/verify/:roll", (req, res) => {
  const roll = req.params.roll.toString().trim().toLowerCase();
  const students = getStudents();
  const student = students.find(
    (s) => s.roll.toString().trim().toLowerCase() === roll
  );

  if (!student) {
    return res.status(404).json({ success: false, message: "Student not found." });
  }

  const { password: _, ...safeStudent } = student;
  return res.json({ success: true, student: safeStudent });
});

// QR CODE GENERATOR ROUTE
app.get("/qr/:id", async (req, res) => {
  try {
    const students = getStudents();
    const student = students.find((s) => String(s.id) === String(req.params.id) || String(s.roll) === String(req.params.id));
    
    // QR code payload contains verified student badge info
    const qrData = student 
      ? JSON.stringify({
          id: student.id,
          roll: student.roll,
          name: student.name,
          dept: student.department,
          verified: true
        })
      : req.params.id;

    const qr = await QRCode.toDataURL(qrData);
    res.json({ success: true, qr });
  } catch (error) {
    console.error("QR generation error:", error);
    res.status(500).json({ success: false, message: "Failed to generate QR code." });
  }
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ success: false, message: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
