#!/usr/bin/env python3

import urllib.request
import re
import json
import sys

# ==============================================================================
# INPUT VARIABLE: Paste your Google Sheets string here.
# ==============================================================================
SHEET_INPUT = "https://docs.google.com/spreadsheets/d/1ZQJqdArlwCS965uw4sbJrB6j8rEPfZerMT7X8qkXSzY/edit?gid=2029661410#gid=2029661410"

# ==============================================================================
# SOURCE OF TRUTH: Predefined Mapping
# Used to determine the batch for Regular Courses.
# ==============================================================================
VALID_COURSES_MAP = {
    "2022": {
        "CS": ["Stat Modeling", "Entre", "Digital Mktg", "AI Prod Develop", "Gen AI", "Cloud Comp", "Tech Mgt", "Big Data", "Deep Learn", "Agentic AI", "Fund of Data Vis", "ML for Robo", "Robo Tech", "Fund of SPM", "MLOPs"],
        "SE": ["PPIT", "S/w Metrices", "Cloud Comp", "NLP", "Entre", "User Exp Engg", "Gen AI"],
        "AI": ["PPIT", "Fin Mgt", "Info Sec", "Blockchain", "Responsible AI", "Agentic AI", "Gen AI"],
        "DS": ["Reinf Learn", "Agentic AI", "MLOPs", "Fin Mgt", "NLP", "Resp AI", "Gen AI", "Comp Vision"],
        "CY": ["Blockchain", "Entre", "PPIT", "Cloud Security", "Blockchain"]
    },
    "2023": {
        "CS": ["PDC", "Web", "AI", "Comp Arch", "SE", "Comp Const", "DIP", "AI Lab"],
        "SE": ["SPM", "Civics", "Comp Net Lab", "AI Lab", "Comp Net", "AI", "Process Mining", "Formal Meth in SE"],
        "AI": ["Comp Vision", "NLP", "PDC", "Art Neural Net", "Comp Net", "Comp Net Lab"],
        "DS": ["Deep Learn", "AI", "PDC", "NLP", "AI Lab", "Data Mining", "Comp Net", "Comp Net Lab"],
        "CY": ["AI", "Digital Forensics", "Sec S/w Design", "Info Sec", "Malware Analysis", "Ethical Hack", "Digital Forensics Lab", "AI Lab", "Sec S/w Design Lab", "Comp Net", "Comp Net Lab"]
    },
    "2024": {
        "CS": ["DB", "OS", "Prob & Stats", "SDA", "DB Lab", "OS Lab", "AI", "AI Lab"],
        "SE": ["DB", "SRE", "SDA", "COAL", "OS", "COAL Lab", "OS Lab", "DB Lab", "Pak Studies"],
        "AI": ["DB", "AI", "OS", "DB Lab", "OS Lab", "AI Lab", "Pak Studies", "Fund of S/w Engg", "Prob & Stats"],
        "DS": ["AI", "AI Lab", "Pak Studies", "DB", "OS", "DB Lab", "OS Lab", "Prob & Stats", "Fund of S/w Engg"],
        "CY": ["Comp Net", "Prob & Stats", "Algo", "Pak Studies", "Comp Net Lab", "COAL Lab", "TBW", "COAL"]
    },
    "2025": {
        "CS": ["OOP", "Discrete", "Civics", "MV Calculus", "Pak Studies", "Exp Writing", "Exp Writing Lab", "OOP Lab"],
        "SE": ["DLD", "OOP", "MV Calculus", "Exp Writing", "Exp Writing Lab", "AP", "Seerah & UHQ-I", "OOP Lab", "DLD Lab"],
        "AI": ["OOP", "OOP Lab", "MV Calculus", "DLD", "DLD Lab", "AP", "Exp Writing", "Exp Writing Lab", "Seerah & UHQ-I"],
        "DS": ["OOP", "MV Calculus", "DLD", "DLD Lab", "Civics", "Pak Studies", "OOP Lab", "Exp Writing", "Exp Writing Lab"],
        "CY": ["OOP", "OOP Lab", "DLD", "DLD Lab", "MV Calculus", "AP", "Exp Writing", "Exp Writing Lab", "Seerah & UHQ-I"]
    }
}

# ==============================================================================
# HELPER: Batch reverse-lookup (returns ALL possible batches, not just the first)
# ==============================================================================
def find_possible_batches(course_name, dept):
    """Returns every batch in VALID_COURSES_MAP that lists (dept, course_name)."""
    lookup_name = course_name[:-4].strip() if course_name.lower().endswith("lab") else course_name
    possible = []
    for b, departments in VALID_COURSES_MAP.items():
        if dept in departments:
            courses = departments[dept]
            if course_name in courses or lookup_name in courses:
                possible.append(b)
    return possible

# ==============================================================================
# HELPER: Time Overlap Logic
# ==============================================================================
def parse_time_to_minutes(t_str):
    start_str, end_str = t_str.split('-')
    def to_mins(hm):
        h, m = map(int, hm.split(':'))
        if 1 <= h <= 7: h += 12  # PM mapping for afternoon FAST classes
        return h * 60 + m
    return to_mins(start_str.strip()), to_mins(end_str.strip())
    
def minutes_to_time(m):
    h = (m // 60)
    mi = m % 60
    # FAST 24h-like format used in scraper (1:00 PM is 1:00)
    h_disp = h - 12 if h > 12 else h
    return f"{h_disp:02d}:{mi:02d}"

def is_overlap(t1_str, t2_str):
    if t1_str == "Unknown Time" or t2_str == "Unknown Time": 
        return False
    try:
        s1, e1 = parse_time_to_minutes(t1_str)
        s2, e2 = parse_time_to_minutes(t2_str)
        return max(s1, s2) < min(e1, e2)
    except Exception:
        return False

def get_slot_quota(t_str):
    """
    80 min -> 2 slots
    105 min -> 1 slot
    165 min -> 1 slot
    Returns (duration_mins, quota)
    """
    if t_str == "Unknown Time":
        return 0, 999
    try:
        s, e = parse_time_to_minutes(t_str)
        duration = e - s
        if abs(duration - 80) <= 5: return duration, 2
        if abs(duration - 105) <= 5: return duration, 1
        if abs(duration - 165) <= 5: return duration, 1
        return duration, 999 # Default for unknown durations
    except:
        return 0, 999

def is_batch_busy(batch, dept, section, day, actual_time, busy_calendar):
    key = f"{batch}-{dept}-{section}-{day}"
    occupied_times = busy_calendar.get(key, [])
    for busy_t in occupied_times:
        if is_overlap(actual_time, busy_t):
            return True
    return False

def has_quota_room(batch, dept, section, course_name, quota, quota_calendar):
    """Checks if the batch has room in its weekly quota for this course."""
    if quota >= 999: return True
    key = f"{batch}-{dept}-{section}-{course_name}"
    assigned_count = quota_calendar.get(key, 0)
    return assigned_count < quota

# ==============================================================================
# SETUP
# ==============================================================================
if "/d/" in SHEET_INPUT:
    sheet_id = SHEET_INPUT.split("/d/")[1]
else:
    sheet_id = SHEET_INPUT

sheet_id = sheet_id.split('/')[0].replace('\r', '').strip()

if not sheet_id or sheet_id.startswith("http"):
    print("Error: Could not extract Spreadsheet ID.")
    sys.exit(1)

print(f"Using Spreadsheet ID: {sheet_id}")
print("Fetching and parsing unified timetable (2-pass constraint satisfaction)...")

days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]

# Regex patterns
repeat_pattern = re.compile(r'^([^(]+?)\s*\(\s*([A-Z]{2,}(?:\/[A-Z]{2,})?)\s*-\s*([A-Z0-9]+)\s*,\s*(\d{2})\s*\)')
regular_pattern = re.compile(r'^([^(]+?)\s*\(\s*([A-Z]{2,}(?:\/[A-Z]{2,})?)\s*-\s*([A-Z0-9]+)\s*\)')
time_pattern    = re.compile(r'\d{1,2}:\d{2}\s*-\s*\d{1,2}:\d{2}')

# ==============================================================================
# CONSTRAINT SATISFACTION DATA STRUCTURES
#
#   busy_calendar      : "{batch}-{dept}-{section}-{day}" → list of time strings
#                        Tracks every confirmed slot so Pass 2 can eliminate
#                        impossible candidates.
#
#   unambiguous_classes: List of fully resolved class records (batch is known).
#
#   ambiguous_pool     : Records where 2+ batches are possible — deferred to
#                        Pass 2.
# ==============================================================================
busy_calendar       = {}   # key: "{batch}-{dept}-{section}-{day}" → list[str]
quota_calendar      = {}   # key: "{batch}-{dept}-{section}-{course_name}" -> int (count)
unambiguous_classes = []   # list of fully resolved records
ambiguous_pool      = []   # list of records still needing deduction

# ==============================================================================
# PASS 1 — ANCHOR PASS
# Parse every sheet cell across all five day-tabs.
#   • Repeat courses   → batch is encoded in the cell text → anchor immediately.
#   • Regular courses  → call find_possible_batches():
#       len == 1  → unambiguous → anchor immediately
#       len  > 1  → ambiguous   → push to ambiguous_pool
#       len == 0  → unmapped    → discard
# ==============================================================================
for day in days:
    req_url = (
        f"https://docs.google.com/spreadsheets/d/{sheet_id}"
        f"/gviz/tq?tqx=out:json&sheet={day}"
    )
    try:
        response = urllib.request.urlopen(req_url)
        text     = response.read().decode("utf-8")

        start_idx = text.find("{")
        end_idx   = text.rfind("}") + 1
        data      = json.loads(text[start_idx:end_idx])
        rows      = data.get("table", {}).get("rows", [])

        time_map        = {}
        master_time_map = {}
        current_room    = ""
        is_lab_section  = False

        for r in rows:
            cells = r.get("c", [])
            if not cells:
                continue

            first_val = (
                str(cells[0].get("v", "")).strip()
                if cells[0] and cells[0].get("v")
                else ""
            )

            if first_val in ("Room", "Lab"):
                is_lab_section = (first_val == "Lab")
                local_time_map = {}
                row_last_time  = "Unknown Time"
                
                for i in range(1, len(cells)):
                    c_val = str(cells[i].get("v", "")).strip() if cells[i] and cells[i].get("v") else ""
                    
                    if c_val and c_val not in ("Room", "Lab"):
                        row_last_time = c_val
                    elif not c_val and i in master_time_map:
                        # Fallback logic: 
                        # If current header cell is empty, check if master header starts a new slot
                        m_time = master_time_map[i]
                        if m_time != "Unknown Time" and row_last_time != "Unknown Time":
                            try:
                                m_start, m_end = parse_time_to_minutes(m_time)
                                r_start, r_end = parse_time_to_minutes(row_last_time)
                                # If master starts after current row_last_time ends, it's a new slot
                                if m_start >= r_end:
                                    row_last_time = m_time
                            except:
                                pass
                        elif row_last_time == "Unknown Time":
                            row_last_time = m_time
                    
                    local_time_map[i] = row_last_time
                
                # First header of the day becomes the master template
                if not master_time_map:
                    master_time_map = local_time_map.copy()
                
                time_map = local_time_map
                continue

            if first_val:
                current_room = first_val
            if not current_room:
                continue

            # ── Scan each column for a class entry ──
            for i in range(1, len(cells)):
                val = (
                    str(cells[i].get("v", "")).replace("\n", " ").strip()
                    if cells[i] and cells[i].get("v")
                    else ""
                )
                if not val:
                    continue

                course_name = dept = section = batch = category = None

                # Repeat courses carry the YY suffix, e.g. "AI (CS-A, 23)"
                rep_match = repeat_pattern.search(val)
                if rep_match:
                    course_name = rep_match.group(1).strip()
                    dept        = rep_match.group(2).strip()
                    section     = rep_match.group(3).strip()
                    batch       = "20" + rep_match.group(4).strip()
                    category    = "repeat"
                else:
                    reg_match = regular_pattern.search(val)
                    if reg_match:
                        course_name = reg_match.group(1).strip()
                        dept        = reg_match.group(2).strip()
                        section     = reg_match.group(3).strip()
                        category    = "regular"

                if not category:
                    continue

                # Normalize: force "Lab" suffix when inside the lab block
                if is_lab_section and not course_name.lower().endswith("lab"):
                    course_name = f"{course_name} Lab"

                # Determine if special slot
                is_rescheduled = any(k in val.lower() for k in ["rescheduled", "resch"])
                is_exam        = any(k in val.lower() for k in ["mid", "exam", "sessional"])
                
                if is_rescheduled or is_exam:
                    # Strip keywords from course name if they got captured
                    course_name = re.sub(r'(?i)\b(resch(eduled)?|mid|exam|sessional)\b', '', course_name).strip()
                    label = "Exam" if is_exam else "Rescheduled"
                    print(f"  ✨ {label}: {course_name} ({dept}-{section}) on {day}")

                # Determine the class time
                explicit_time = time_pattern.search(val)
                actual_time   = (
                    explicit_time.group(0)
                    if explicit_time
                    else time_map.get(i, "Unknown Time")
                )

                # Force specific durations based on cell type (per user request)
                is_actually_lab = is_lab_section or course_name.lower().endswith("lab")
                if actual_time != "Unknown Time":
                    try:
                        s_min, _ = parse_time_to_minutes(actual_time)
                        if is_exam:
                            # Exams/Sessionals are strictly 90 mins
                            e_min = s_min + 90
                            actual_time = f"{minutes_to_time(s_min)}-{minutes_to_time(e_min)}"
                        elif is_actually_lab:
                            # Regular labs are 165 mins
                            e_min = s_min + 165
                            actual_time = f"{minutes_to_time(s_min)}-{minutes_to_time(e_min)}"
                    except Exception as e:
                        pass

                duration, quota = get_slot_quota(actual_time)

                # Base record — batch filled in when resolved
                record = {
                    "course_name": course_name,
                    "dept":        dept,
                    "section":     section,
                    "day":         day,
                    "time":        actual_time,
                    "room":        current_room,
                    "category":    category,
                    "batch":       batch,        # None for regular until resolved
                    "is_rescheduled": is_rescheduled,
                    "is_exam":     is_exam,
                    "quota":       quota
                }

                if category == "repeat":
                    # Batch encoded in cell — anchor immediately
                    cal_key = f"{batch}-{dept}-{section}-{day}"
                    busy_calendar.setdefault(cal_key, []).append(actual_time)
                    if not is_rescheduled:
                        q_key = f"{batch}-{dept}-{section}-{course_name}"
                        quota_calendar[q_key] = quota_calendar.get(q_key, 0) + 1
                    unambiguous_classes.append(record)

                else:  # regular
                    possible = find_possible_batches(course_name, dept)

                    if not possible:
                        # Completely unmapped — discard silently
                        continue

                    elif len(possible) == 1:
                        # Single candidate — anchor immediately
                        batch_val = possible[0]
                        if "Comp Net Lab" in course_name or "AI Lab" in course_name:
                            print(f"  [DEBUG] P1: Anchored {course_name} to {batch_val} {dept}-{section}")
                        record["batch"] = batch_val
                        cal_key = f"{batch_val}-{dept}-{section}-{day}"
                        busy_calendar.setdefault(cal_key, []).append(actual_time)
                        if not is_rescheduled:
                            q_key = f"{batch_val}-{dept}-{section}-{course_name}"
                            quota_calendar[q_key] = quota_calendar.get(q_key, 0) + 1
                        unambiguous_classes.append(record)

                    else:
                        # Multiple candidates — defer to Pass 2
                        record["possible_batches"] = possible
                        ambiguous_pool.append(record)

    except Exception as e:
        print(f"Warning: Could not process {day}. Error: {e}")

print(
    f"\nPass 1 complete — "
    f"{len(unambiguous_classes)} anchored, "
    f"{len(ambiguous_pool)} deferred to deduction pass."
)

# ==============================================================================
# PASS 2 — DEDUCTION PASS
# For each ambiguous record, check busy_calendar at its exact slot key.
# A batch is "free" if its slot is NOT already occupied by a different batch.
# A section cannot be in two places at once, so the occupied batch eliminates
# itself as a candidate for any other class at the same slot.
#
# Logic:
#   free = [b for b in possible if busy_calendar.get(key) != b]
#   → if exactly 1 free candidate remains → assign it
#   → if 0 remain → conflict warning, skip
#   → if 2+ remain → still ambiguous, best-effort assign first free candidate
# ==============================================================================
deduced_count   = 0
conflict_count  = 0
fallback_count  = 0

still_ambiguous = ambiguous_pool.copy()
changed = True

while changed:
    changed = False
    next_ambiguous = []
    
    for record in still_ambiguous:
        dept           = record["dept"]
        section        = record["section"]
        day            = record["day"]
        actual_time    = record["time"]
        possible       = record["possible_batches"]
        course_name    = record["course_name"]
        quota          = record["quota"]
        is_rescheduled = record["is_rescheduled"]

        # Per-batch key: check if THAT batch is already busy or at its quota
        free_candidates = [
            b for b in possible
            if not is_batch_busy(b, dept, section, day, actual_time, busy_calendar)
            and (is_rescheduled or has_quota_room(b, dept, section, course_name, quota, quota_calendar))
        ]

        if len(free_candidates) == 1:
            # Definitive deduction — exactly one batch can own this slot
            assigned = free_candidates[0]
            record["batch"] = assigned
            cal_key = f"{assigned}-{dept}-{section}-{day}"
            busy_calendar.setdefault(cal_key, []).append(actual_time)
            if not record["is_rescheduled"]:
                q_key = f"{assigned}-{dept}-{section}-{record['course_name']}"
                quota_calendar[q_key] = quota_calendar.get(q_key, 0) + 1
            unambiguous_classes.append(record)
            changed = True
            deduced_count += 1

        elif len(free_candidates) == 0:
            # All candidate batches are already confirmed busy here — genuine conflict
            conflict_count += 1
            print(
                f"  ⚠ Conflict skipped: {record['course_name']} "
                f"({dept}-{section}) on {day} @ {actual_time} "
                f"— all {len(possible)} candidates already busy"
            )

        else:
            # Still ambiguous — keep for next pass
            record["possible_batches"] = free_candidates
            next_ambiguous.append(record)
            
    still_ambiguous = next_ambiguous

# Any remaining items in still_ambiguous could not be deduced.
# Sort to ensure that slots of the same course/section/time (e.g. Mon 10:00 and Wed 10:00) 
# are processed sequentially, allowing the quota logic to pair them to the same batch.
still_ambiguous.sort(key=lambda x: (x["dept"], x["section"], x["course_name"], x["time"]))

for record in still_ambiguous:
    dept           = record["dept"]
    section        = record["section"]
    day            = record["day"]
    actual_time    = record["time"]
    possible       = record["possible_batches"]
    course_name    = record["course_name"]
    quota_val      = record["quota"]
    is_rescheduled = record["is_rescheduled"]

    # Re-calculate free candidates based on the MOST RECENT quota and busy state
    # This is critical because previous assignments in this same loop update the state.
    free_candidates = [
        b for b in possible
        if not is_batch_busy(b, dept, section, day, actual_time, busy_calendar)
        and (is_rescheduled or has_quota_room(b, dept, section, course_name, quota_val, quota_calendar))
    ]

    # Sort candidates by:
    # 1. "Already has some slots assigned" (Secondary sort - keeps pairs together)
    # 2. "Total room left" (Tertiary sort)
    free_candidates.sort(
        key=lambda b: (
            quota_calendar.get(f"{b}-{dept}-{section}-{course_name}", 0) > 0,
            quota_val - quota_calendar.get(f"{b}-{dept}-{section}-{course_name}", 0)
        ),
        reverse=True
    )

    if free_candidates:
        assigned = free_candidates[0]
        if "Comp Net Lab" in course_name or "AI Lab" in course_name:
            print(f"  [DEBUG] P2 Assignment: {course_name} ({dept}-{section}) on {day} @ {actual_time} -> {assigned}")
        new_record = record.copy()
        new_record["batch"] = assigned
        cal_key = f"{assigned}-{dept}-{section}-{day}"
        busy_calendar.setdefault(cal_key, []).append(actual_time)
        if not is_rescheduled:
            q_key = f"{assigned}-{dept}-{section}-{course_name}"
            quota_calendar[q_key] = quota_calendar.get(q_key, 0) + 1
        unambiguous_classes.append(new_record)
        fallback_count += 1
    else:
        print(
            f"  ⚠ Dropped ambiguous: {record['course_name']} "
            f"({dept}-{section}) on {day} @ {actual_time} "
            f"— no batches with room left and not busy"
        )

print(
    f"Pass 2 complete — "
    f"{deduced_count} deduced, "
    f"{fallback_count} fallback, "
    f"{conflict_count} conflicts skipped."
)

# ==============================================================================
# PASS 3 — BUILD FINAL JSON HIERARCHY
# Walk unambiguous_classes (anchored + deduced) and populate:
#   batch → dept → "regular"|"repeat" → course → section → day → [{room, time}]
# ==============================================================================
data_hierarchy = {}

for rec in unambiguous_classes:
    batch       = rec["batch"]
    dept        = rec["dept"]
    category    = rec["category"]
    course_name = rec["course_name"]
    section     = rec["section"]
    day         = rec["day"]
    actual_time = rec["time"]
    room        = rec["room"]

    if batch not in data_hierarchy:
        data_hierarchy[batch] = {}
    if dept not in data_hierarchy[batch]:
        data_hierarchy[batch][dept] = {"regular": {}, "repeat": {}}

    target = data_hierarchy[batch][dept][category]

    if course_name not in target:
        target[course_name] = {}
    if section not in target[course_name]:
        target[course_name][section] = {}
    if day not in target[course_name][section]:
        target[course_name][section][day] = []

    target[course_name][section][day].append({
        "room": room, 
        "time": actual_time,
        "rescheduled": rec.get("is_rescheduled", False),
        "exam": rec.get("is_exam", False)
    })

# ==============================================================================
# OUTPUT
# ==============================================================================
output_filename = "timetable.json"
with open(output_filename, "w") as json_file:
    json.dump(data_hierarchy, json_file, indent=4)

total_resolved  = len(unambiguous_classes)
total_ambiguous = len(ambiguous_pool)
print(f"\n✅ Success! Unified schedule exported to: {output_filename}")
print(
    f"   Total resolved: {total_resolved} class slots "
    f"({total_ambiguous} passed through the deduction pass)"
)