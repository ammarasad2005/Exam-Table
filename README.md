# 🗓️ FSC Exam Schedule Engine

A modern, fast, and elegant web application designed to help students at FSC (Fast School of Computing) navigate their exam schedules with ease. Say goodbye to messy Excel sheets and hello to a clean, searchable, and exportable timeline.

---

## 🚀 Quick Start
1. **Visit the website** at [fast-nuces-exams.vercel.app](https://fast-nuces-exams.vercel.app).
2. **Select your Batch** (e.g., 2023) and **Department** (e.g., CS).
3. **Browse your exams** in a beautiful, chronological list.

---

## ✨ Key Features

### 🔍 Smart Search & Filtering
Instantly find your exams by course name or code. No more scrolling through giant grids.

### 🛠️ Custom Course Builder (For Irregular Students)
Fail a course? Taking an inter-batch elective? We've got you covered. Toggle **"Custom Courses"** to mix and match courses from different batches and departments into a single unified schedule.

### 📤 Powerful Exports
Take your schedule with you:
*   **Excel (.xlsx):** A beautifully formatted table (modeled after professional templates) with headers and gridlines.
*   **Calendar (.ics):** Import your entire schedule into Google Calendar, Apple Calendar, or Outlook in one click. Exams appear as "All-Day" events with the exact time slot in the description.
*   **CSV:** Standard raw data for personal use.

### 🌓 Dark Mode
A premium, glassmorphism-inspired design that's easy on the eyes, whether you're studying at noon or midnight.

---

## 📸 Screenshots

### Schedule View
![Schedule View](https://github.com/user-attachments/assets/70939b91-8279-4338-a1c0-ee59c5eea7a5)

### Configuration Page
![Alternate Schedule View](https://github.com/user-attachments/assets/b3c5e8fe-0c0e-422f-9f1d-771b2ae5ec62)

---

## 🛠️ How it Works (For Developers)

### 📊 Data Pipeline
The website's "Source of Truth" is `exam_schedule.xlsx`. 
- **Automatic Parsing:** We've built a custom Positional Parser (`scripts/parse-excel.ts`) that reads the complex Excel grid and converts it into a clean JSON format.
- **Pre-build Sync:** Every time you run the site, the parser ensures the website's data matches the Excel file exactly.

### 💻 Technology Stack
*   **Frontend:** Next.js 14 (App Router), TypeScript, Tailwind CSS.
*   **Logic:** Custom Date & Time parsing for high accuracy.
*   **Exports:** `exceljs` for beautiful spreadsheets and custom `.ics` generation.

---

## 📥 Local Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/ammarasad2005/Exam-Table.git
   cd Exam-Table
   ```
2. **Install dependencies:**
   ```bash
   npm install
   ```
3. **Run the development server:**
   ```bash
   npm run dev
   ```
4. **Open [http://localhost:3000](http://localhost:3000)** in your browser.

---

## 📝 License
Built for the students of FAST-NUCES. Use it, share it, and ace those exams! 🎓
