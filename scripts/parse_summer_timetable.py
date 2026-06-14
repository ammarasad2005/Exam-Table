import os
import sys
import json
import re
import urllib.request
import urllib.parse
import zipfile
import io
import csv
import xml.etree.ElementTree as ET

CANONICAL_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
DAY_ALIASES = {
    "mon": "Monday", "monday": "Monday",
    "tue": "Tuesday", "tues": "Tuesday", "tuesday": "Tuesday",
    "wed": "Wednesday", "weds": "Wednesday", "wednesday": "Wednesday",
    "thu": "Thursday", "thur": "Thursday", "thurs": "Thursday", "thursday": "Thursday",
    "fri": "Friday", "friday": "Friday",
    "sat": "Saturday", "saturday": "Saturday",
}

def _load_dotenv():
    try:
        with open(".env.local", "r") as f:
            for line in f:
                if "=" in line and not line.strip().startswith("#"):
                    key, val = line.strip().split("=", 1)
                    os.environ[key] = val.strip().replace('"', '').replace("'", "")
    except FileNotFoundError:
        pass

_load_dotenv()

def fetch_google_sheets_url():
    supabase_url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL", "").rstrip("/")
    supabase_key = os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY", "")
    if not supabase_url or not supabase_key:
        return None
    try:
        url = f"{supabase_url}/rest/v1/semester_settings?id=eq.1&select=google_sheets_url"
        req = urllib.request.Request(url, headers={
            "apikey": supabase_key,
            "Authorization": f"Bearer {supabase_key}",
        })
        resp = urllib.request.urlopen(req, timeout=6)
        rows = json.loads(resp.read().decode("utf-8"))
        if rows:
            return rows[0].get("google_sheets_url")
    except Exception as e:
        print(f"⚠  Could not fetch Google Sheets URL from Supabase: {e}")
    return None

def fetch_workbook_sheet_names(sheet_id):
    html_url = f"https://docs.google.com/spreadsheets/d/{sheet_id}/edit?usp=sharing"
    request = urllib.request.Request(html_url, headers={"User-Agent": "Mozilla/5.0"})
    try:
        html = urllib.request.urlopen(request).read().decode("utf-8", errors="ignore")
        sheet_pattern = re.compile(
            r'(?i)\b(?:monday|tuesday|wednesday|thursday|friday|saturday|mon|tue|wed|thu|fri|sat)(?:\s*\([^)]{1,40}\))?'
        )
        sheet_names = []
        seen = set()
        for match in sheet_pattern.finditer(html):
            title = match.group(0).strip()
            normalized = title.lower()
            if normalized not in seen:
                seen.add(normalized)
                sheet_names.append(title)
        if sheet_names:
            return sheet_names
    except Exception as e:
        print(f"HTML workbook inspection failed: {e}. Falling back to zip method.")

    # Fallback to ZIP/XML method
    export_url = f"https://docs.google.com/spreadsheets/d/{sheet_id}/export?format=xlsx"
    response = urllib.request.urlopen(export_url)
    workbook_bytes = response.read()
    with zipfile.ZipFile(io.BytesIO(workbook_bytes)) as workbook_zip:
        workbook_xml = workbook_zip.read("xl/workbook.xml")
    root = ET.fromstring(workbook_xml)
    namespace = {"main": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
    return [sheet.attrib["name"] for sheet in root.findall("main:sheets/main:sheet", namespace)]

def resolve_day_name(sheet_title):
    cleaned = re.sub(r"\s*\([^)]*\)\s*$", "", sheet_title).strip()
    prefix_match = re.match(r"^([A-Za-z]+)", cleaned)
    if not prefix_match:
        return None
    prefix = prefix_match.group(1).lower()
    return DAY_ALIASES.get(prefix)

def parse_csv(csv_text):
    f = io.StringIO(csv_text)
    reader = csv.reader(f)
    return list(reader)

def extract_course_and_section(cell_content):
    # Matches formats like "Object Oriented Programming (A)" or "OOP (A1)"
    match = re.match(r'^([^(]+?)\s*\(\s*([A-Za-z0-9\-/]+)\s*\)', cell_content)
    if match:
        course_name = match.group(1).strip()
        section = match.group(2).strip()
        return course_name, section
    return cell_content.strip(), "A"

def process_sheet_rows(rows, day_name):
    if len(rows) < 2:
        return []

    is_grid_format = False
    for i in range(min(len(rows), 5)):
        first_cell = rows[i][0].lower().strip() if len(rows[i]) > 0 else ""
        if first_cell in ["room", "rooms", "lab", "labs"]:
            is_grid_format = True
            break

    entries = []

    if is_grid_format:
        current_time_headers = None
        for row in rows:
            if not row:
                continue
            first_cell = row[0].lower().strip()
            if first_cell in ["room", "rooms", "lab", "labs"]:
                current_time_headers = row
                continue
            
            if current_time_headers:
                room = row[0].strip()
                if not room or "reserved" in room.lower() or "students" in room.lower():
                    continue
                for col in range(1, min(len(row), len(current_time_headers))):
                    cell = row[col].strip()
                    if not cell:
                        continue
                    time_slot = current_time_headers[col].strip()
                    if not time_slot:
                        continue
                    
                    course_name, section = extract_course_and_section(cell)
                    entries.append({
                        "courseName": course_name,
                        "section": section,
                        "day": day_name,
                        "time": time_slot,
                        "room": room
                    })
    else:
        # Flat table format
        headers = [h.lower().strip() for h in rows[0]]
        course_idx = -1
        section_idx = -1
        day_idx = -1
        time_idx = -1
        room_idx = -1

        for idx, h in enumerate(headers):
            if "course" in h or "subject" in h or "class" in h:
                course_idx = idx
            elif "section" in h or "sec" in h:
                section_idx = idx
            elif "day" in h:
                day_idx = idx
            elif "time" in h or "slot" in h:
                time_idx = idx
            elif "room" in h or "venue" in h:
                room_idx = idx

        for row in rows[1:]:
            if not row or all(c == "" for c in row):
                continue
            course_val = row[course_idx].strip() if course_idx < len(row) and course_idx >= 0 else ""
            if not course_val:
                continue
            
            course_name, section = extract_course_and_section(course_val)
            # If section column is explicitly present, override
            if section_idx < len(row) and section_idx >= 0 and row[section_idx].strip():
                section = row[section_idx].strip()
                
            day_val = row[day_idx].strip() if day_idx < len(row) and day_idx >= 0 else day_name
            time_val = row[time_idx].strip() if time_idx < len(row) and time_idx >= 0 else ""
            room_val = row[room_idx].strip() if room_idx < len(row) and room_idx >= 0 else "TBA"

            entries.append({
                "courseName": course_name,
                "section": section,
                "day": day_val,
                "time": time_val,
                "room": room_val
            })

    return entries

def main():
    gs_url = fetch_google_sheets_url()
    if not gs_url:
        print("Error: Could not retrieve Google Sheets URL from Supabase.")
        sys.exit(1)

    print(f"Fetching summer timetable from URL: {gs_url}")
    # Extract spreadsheet ID
    if "/d/" in gs_url:
        sheet_id = gs_url.split("/d/")[1].split("/")[0].strip()
    else:
        sheet_id = gs_url.strip()

    try:
        sheet_names = fetch_workbook_sheet_names(sheet_id)
        print(f"Resolved sheet tabs: {sheet_names}")
    except Exception as e:
        print(f"Error resolving worksheet names: {e}")
        sheet_names = CANONICAL_DAYS

    # Match tabs to weekdays
    day_to_sheets = {}
    for name in sheet_names:
        day_name = resolve_day_name(name)
        if day_name:
            day_to_sheets[day_name] = name

    all_entries = []

    for day in CANONICAL_DAYS:
        sheet_name = day_to_sheets.get(day)
        if not sheet_name:
            print(f"ℹ  No matching sheet found for {day}, skipping.")
            continue
        
        print(f"Downloading and parsing sheet: {sheet_name} ({day})")
        csv_url = f"https://docs.google.com/spreadsheets/d/{sheet_id}/gviz/tq?tqx=out:csv&sheet={urllib.parse.quote(sheet_name)}"
        try:
            req = urllib.request.Request(csv_url, headers={"User-Agent": "Mozilla/5.0"})
            csv_text = urllib.request.urlopen(req).read().decode("utf-8")
            rows = parse_csv(csv_text)
            day_entries = process_sheet_rows(rows, day)
            all_entries.extend(day_entries)
            print(f"✅ Parsed {len(day_entries)} slots for {day}")
        except Exception as e:
            print(f"⚠  Failed to fetch/parse sheet '{sheet_name}': {e}")

    # Build the nested RawTimetableJSON structure:
    # batch ("Summer") -> department ("CS") -> category ("regular") -> courseName -> section -> day -> [{room, time}]
    nested_timetable = {
        "Summer": {
            "CS": {
                "regular": {},
                "repeat": {}
            }
        }
    }

    regular_map = nested_timetable["Summer"]["CS"]["regular"]

    for entry in all_entries:
        course = entry["courseName"]
        sec = entry["section"]
        day = entry["day"]
        room = entry["room"]
        time_slot = entry["time"]

        if course not in regular_map:
            regular_map[course] = {}
        if sec not in regular_map[course]:
            regular_map[course][sec] = {}
        if day not in regular_map[course][sec]:
            regular_map[course][sec][day] = []

        regular_map[course][sec][day].append({
            "room": room,
            "time": time_slot,
            "rescheduled": False,
            "exam": False,
            "is_elective": False,
            "elective_group": None
        })

    # Add meta information
    nested_timetable["__meta__"] = {
        "days": {
            day: {"sheetName": day, "date": ""} for day in CANONICAL_DAYS
        }
    }

    # Save to timetable.json
    out_path = "timetable.json"
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(nested_timetable, f, indent=2)
    print(f"✅ Successfully wrote nested summer timetable containing {len(all_entries)} slots to {out_path}")

if __name__ == "__main__":
    main()
