# FAST ISB Schedule Platform

A unified student scheduling platform for FAST ISB with three major tools in one website:

- Exam schedule viewer
- Weekly class timetable viewer
- Free room finder

The app supports both regular cohort flows and custom mixed-course flows for irregular students.

## What Is Included

### 1. Exams
- Filter by batch, school, and department.
- Search by course code or course name.
- Grouped timeline view by date.
- Exam detail drawer (mobile + desktop optimized).
- Export current results to `.ics`, `.xlsx`, and `.csv`.

### 2. Timetable
- Filter by batch, department, and section.
- List view and visual grid view.
- Detect overlapping class conflicts.
- Toggle repeat courses on/off.
- Export current timetable to `.ics`, `.xlsx`, and `.csv`.

### 3. Free Rooms
- Check empty rooms for a selected day + slot.
- See full-week availability map.
- Distinguishes:
   - Fully vacant rooms
   - Partially vacant rooms (at least 30 free minutes in a slot)

### 4. Custom Workflows
- Custom Exams: add mixed rows from different batches/departments and build a merged exam list.
- Custom Timetable: build class sets from mixed rows and save reusable named bundles.
- Local persistence using browser storage for saved preferences and custom bundles.

## Screenshots

### Home / Configuration
<p>
   <img src="Screenshots/configuration_page_desktop.png" alt="Configuration page on desktop" width="68%" />
   <img src="Screenshots/configuration_page_mobile.png" alt="Configuration page on mobile" width="28%" />
</p>

### Exam Schedule
<p>
   <img src="Screenshots/schedule_detail_desktop.png" alt="Exam schedule detail mode on desktop" width="68%" />
   <img src="Screenshots/schedule_detail_mobile.png" alt="Exam schedule detail mode on mobile" width="28%" />
</p>

### Timetable
<p>
   <img src="Screenshots/timetable_detail_desktop.png" alt="Timetable detail mode on desktop" width="68%" />
   <img src="Screenshots/timetable_detail_mobile.png" alt="Timetable detail mode on mobile" width="28%" />
</p>

### Custom Exams
<p>
   <img src="Screenshots/custom_exams_page_desktop.png" alt="Custom exams page on desktop" width="68%" />
   <img src="Screenshots/custom_exams_page_mobile.png" alt="Custom exams page on mobile" width="28%" />
</p>

### Custom Timetable
<p>
   <img src="Screenshots/custom_timetable_page_desktop.png" alt="Custom timetable page on desktop" width="68%" />
   <img src="Screenshots/custom_timetable_page_mobile.png" alt="Custom timetable page on mobile" width="28%" />
</p>

### Free Rooms
<p>
   <img src="Screenshots/rooms_detail_desktop.png" alt="Free rooms detail mode on desktop" width="68%" />
   <img src="Screenshots/rooms_detail_mobile.png" alt="Free rooms detail mode on mobile" width="28%" />
</p>

## Tech Stack

- Next.js 14 (App Router)
- React 18 + TypeScript
- Tailwind CSS
- `xlsx` for Excel parsing
- `exceljs` for export generation

## Data Pipeline

There are two primary data pipelines in this project:

1. Exam Finder pipeline
- Source: `exam_schedule.xlsx`
- Purpose: powers the Exam Schedule / Exam Finder feature only.
- Output: normalized exam data in `public/data/schedule.json`
- Parser entrypoint: `scripts/parse-excel.ts`

2. Timetable + Free Rooms pipeline
- Source: semester schedule fetched from Google Sheets.
- Purpose: powers both the Timetable and Free Rooms features.
- Output: normalized timetable data in `public/data/timetable.json`

3. Campus Events pipeline
- Source: SLATE calendar list view with a custom date range.
- Step 1 (scrape): `scripts/scrape_slate.py` -> `public/data/slate_calendar_events.json`
- Step 2 (filter): `scripts/filter_events.py` -> `public/data/student_events.json`
- Purpose: powers the Campus Events calendar view.
- Required environment variables:
   - `SLATE_USERNAME`
   - `SLATE_PASSWORD`
   - `SLATE_TOOL_BASE`
   - `GROQ_API_KEY`

## Routes

- `/` -> setup/configuration home
- `/schedule` -> exam results
- `/custom` -> custom exam builder
- `/timetable` -> timetable results
- `/timetable/custom` -> custom timetable builder + bundles
- `/rooms` -> free room finder
- `/events` -> campus events calendar
- `/api/schedule` -> filtered exam JSON API

## Local Development

1. Install dependencies:
```bash
npm install
```

2. Start development server:
```bash
npm run dev
```

3. Open:
```text
http://localhost:3000
```

## Available Scripts

- `npm run dev` -> runs parser, then starts Next.js dev server
- `npm run build` -> production build
- `npm run start` -> start production server
- `npm run type-check` -> TypeScript checks
- `npm run lint` -> Next.js linting
- `npm run timetable:update` -> regenerate timetable JSON and copy to frontend data
- `npm run events:scrape` -> scrape SLATE events into JSON
- `npm run events:filter` -> filter scraped events for student relevance
- `npm run events:update` -> run scrape + filter in sequence

## Scheduled Automation

### Option A: GitHub Actions (recommended)

This repo now includes:
- `.github/workflows/update-timetable.yml` (hourly timetable refresh)
- `.github/workflows/update-events.yml` (weekly Monday events refresh)

Required repository secrets for events workflow:
- `MAIN_PUSH_TOKEN`
- `SLATE_USERNAME`
- `SLATE_PASSWORD`
- `SLATE_TOOL_BASE`
- `GROQ_API_KEY`

### Option B: Local server cron jobs

1. Create your local env file:
```bash
cp .env.events.example .env.events
```

2. Add these cron entries:
```cron
# Weekly events update (every Monday 06:00 UTC)
0 6 * * 1 cd /home/ammarasad2005/projects/exams && set -a; . ./.env.events; set +a; npm run events:update >> logs/events.log 2>&1

# Hourly timetable update
0 * * * * cd /home/ammarasad2005/projects/exams && npm run timetable:update >> logs/timetable.log 2>&1
```

3. Create logs directory once:
```bash
mkdir -p logs
```

## Notes

- This project is built for FAST ISB students and schedule planning workflows.
- Screenshot files are stored in `Screenshots/` and can be re-captured any time from the running app.
- Screenshot automation script: `scripts/capture-screenshots.js`
