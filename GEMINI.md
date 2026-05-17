# FAST ISB Schedule Platform - Project Context

## Project Overview
This is a unified student scheduling platform for FAST NUCES, Islamabad. It provides three main tools:
1.  **Exam Schedule Viewer:** Filter and search for exam schedules.
2.  **Weekly Class Timetable:** Visual and list views of class schedules.
3.  **Free Room Finder:** Locate vacant rooms for study or meetings.

The application is built with **Next.js 14 (App Router)** and follows a data-driven approach where static JSON files (generated from Excel and Python scripts) serve as the primary data source.

## Tech Stack
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Icons:** Lucide React
- **Animation:** Framer Motion
- **Data Processing:** 
    - `xlsx` & `exceljs` (Excel parsing and generation)
    - Python (Data scraping and normalization)

## Project Structure
- `src/app/`: Route handlers and page components (App Router).
- `src/components/`: Reusable UI components (Navbar, SearchBar, Cards, etc.).
- `src/lib/`: Core logic, including filtering, data types, and utility functions.
- `src/styles/`: Global CSS and Tailwind configuration.
- `scripts/`: Data ingestion scripts for parsing Excel files and scraping web data.
- `public/data/`: Generated JSON data files used by the frontend.

## Data Pipelines
- **Exams:** `scripts/parse-excel.ts` processes `exam_schedule.xlsx` into `public/data/schedule.json`.
- **Timetable:** `all_courses_schedule.py` (root) and `scripts/filter_events.py` process schedule data into `public/data/timetable.json`.
- **Events:** `scripts/scrape_slate.py` and `scripts/filter_events.py` handle campus event data.

## Key Commands
- `npm run dev`: Runs the Excel parser (`scripts/parse-excel.ts`) and then starts the Next.js development server.
- `npm run build`: Compiles the application for production.
- `npm run type-check`: Runs TypeScript compiler check (`tsc --noEmit`).
- `npm run lint`: Runs ESLint for code quality checks.
- `npm run timetable:update`: Executes the Python script to refresh timetable data.
- `npm run events:update`: Scrapes and filters latest campus events.

## Development Conventions
- **Component Architecture:** Prefer small, focused components in `src/components`. Use client components (`'use client'`) only when necessary for interactivity or hooks.
- **Type Safety:** Maintain strict TypeScript definitions in `src/lib/types.ts`. All data structures must be typed.
- **Styling:** Use Tailwind CSS utility classes. Custom themes and CSS variables are managed in `src/styles/globals.css` and `src/lib/theme.tsx`.
- **Data Handling:** Frontend logic should prioritize efficient filtering and grouping (see `src/lib/filter.ts`).
- **Icons:** Always use `lucide-react` for UI icons to maintain consistency.
- **State Management:** Use local React state or URL search parameters for filtering and UI state. Browser storage is used for user preferences and custom bundles.
