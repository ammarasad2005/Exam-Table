/**
 * data-timestamps — re-export build-time data freshness timestamps from a
 * generated JSON file (public/data/build-info.json).
 *
 * The build-info.json file is written by the prebuild script
 * (scripts/run-exam-parser.ts) before every `next build` / `next dev`. It
 * contains the mtime of each data file at build time.
 *
 * Importing JSON (not fs) keeps this safe for client-component import chains.
 */
import buildInfo from '../../public/data/build-info.json';

interface BuildInfo {
  generated: string;          // ISO timestamp of the build
  regular_schedule?: string;  // formatted date string
  summer_schedule?: string;
  timetable?: string;
}

const info = buildInfo as BuildInfo;

export const SCHEDULE_UPDATED = info.regular_schedule ?? null;
export const SUMMER_SCHEDULE_UPDATED = info.summer_schedule ?? null;
export const TIMETABLE_UPDATED = info.timetable ?? null;
