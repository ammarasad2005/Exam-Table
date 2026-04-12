import json
import re

VALID_COURSES_MAP = {
    "2023": {"CS": ["AI"]},
    "2024": {"CS": ["AI"]}
}

def parse_time_to_minutes(t_str):
    start_str, end_str = t_str.split("-")
    def to_mins(hm):
        h, m = map(int, hm.split(":"))
        if 1 <= h <= 7: h += 12
        return h * 60 + m
    return to_mins(start_str.strip()), to_mins(end_str.strip())

def get_slot_quota(t_str):
    s, e = parse_time_to_minutes(t_str)
    duration = e - s
    if abs(duration - 80) <= 5: return 2
    return 999

quota_calendar = {}

def has_quota_room(batch, dept, section, course_name, quota):
    key = f"{batch}-{dept}-{section}-{course_name}"
    return quota_calendar.get(key, 0) < quota

slots = [
    ("Monday", "10:00-11:20"),
    ("Wednesday", "10:00-11:20"),
    ("Tuesday", "11:30-12:50"),
    ("Thursday", "11:30-12:50"),
]

for day, time in slots:
    quota = get_slot_quota(time)
    possible = ["2023", "2024"]
    free = [b for b in possible if has_quota_room(b, "CS", "D", "AI", quota)]
    
    # sticky sort
    free.sort(key=lambda b: (quota_calendar.get(f"{b}-CS-D-AI", 0) > 0, quota - quota_calendar.get(f"{b}-CS-D-AI", 0)), reverse=True)
    
    assigned = free[0]
    q_key = f"{assigned}-CS-D-AI"
    quota_calendar[q_key] = quota_calendar.get(q_key, 0) + 1
    print(f"{day} {time} -> {assigned}. Cal: {quota_calendar}")
