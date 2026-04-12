quota = 2
q_cal = {"2024": 0, "2023": 0}
slots = ["Mon 10:00", "Wed 10:00", "Tue 11:30", "Thu 11:30"]

for s in slots:
    # free_candidates logic
    free = [b for b in ["2023", "2024"] if q_cal[b] < quota]
    
    # Sort by "Already has some" descending, then "Total room" descending
    free.sort(key=lambda b: (q_cal[b] > 0, quota - q_cal[b]), reverse=True)
    
    assigned = free[0]
    q_cal[assigned] += 1
    print(f"Assigned {s} to {assigned}. New Cal: {q_cal}")
