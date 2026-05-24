# FAST-NUCES Islamabad Campus Location & Parsing Rules

This document outlines the strict guidelines, abbreviations, and layout of the FAST-NUCES Islamabad campus to be used by the Lost & Found location extraction engine.

---

## 1. Campus Geography & Blocks

The Islamabad campus consists of several prominent academic and administrative blocks. When analyzing raw location notes, always normalize references to these specific blocks:

### 1.1 Academic & Departmental Blocks
* **Block A (EE Block):** 
  * Electrical Engineering department, labs, and office.
  * Keywords: "A Block", "EE Block", "A-Block", "EE department", "EE labs".
* **Block B (CS Block):**
  * Computer Science department, labs, and CS department office.
  * Keywords: "B Block", "CS Block", "B-Block", "CS department", "CS labs".
* **Block C:**
  * Academic Block C containing classrooms (C-101 to C-310).
  * Keywords: "C Block", "C-Block", "C block", "Classroom C".
* **Block D:**
  * Academic Block D containing classrooms (D-101 to D-310) and CS labs.
  * Keywords: "D Block", "D-Block", "D block", "Classroom D".
* **Admin Block:**
  * Administrative offices, Director's office, and Main Lobby.
  * Keywords: "Admin Block", "Admin", "Lobby", "Reception".

### 1.2 Shared Facilities
* **Library:**
  * Keywords: "Library", "Library 1st floor", "Library 2nd floor", "Reading hall".
* **Cafeteria:**
  * Keywords: "Cafeteria", "Cafe", "Dhaba", "Canteen", "Outdoor cafe".
* **Sports Area:**
  * Keywords: "Ground", "Playground", "Futsal", "Gym", "Sports complex".
* **Parking Lots:**
  * Keywords: "Parking", "Parking Lot A", "Parking Lot B", "Car parking", "Bike parking".

### 1.3 Transition Zones & Bridges
* **Bridges:**
  * There are bridges connecting the 4th floors of C Block and D Block (or other levels).
  * Keywords: "bridge", "nridge", "connector", "walkway between C and D".
  * *Rule:* If an item is on the bridge between C and D, map the building to **"C/D Block"** and the area to **"On the bridge"** (along with the specified floor).

---

## 2. Custodian & Submission Status

Differentiate carefully between where an item was found and where it is currently held:

### 2.1 "Left as is" (No Handoff)
* If the note indicates that the finder left the item at its original spot (e.g., "left it as it is there", "left it on the bench", "didn't pick up", "is still there"):
  * `currently_held_at.custodian` **MUST** be `"None"`.
  * `currently_held_at.building` **MUST** match the `discovered_at.building`.
  * `currently_held_at.area` **MUST** be mapped to `"Left at discovery spot"`.

### 2.2 Handed Over (Active Custodian)
* **Guard / Security:**
  * If handed to a guard or security desk (e.g., "handed to guard", "with guard in C Block", "left at security"):
    * `currently_held_at.custodian` = `"Guard"`.
    * Identify the building of the guard if mentioned, otherwise map to the discovery building.
* **Department Office:**
  * If handed to academic or department offices (e.g., "left at CS office", "submitted to EE department office"):
    * `currently_held_at.custodian` = `"Academic Office"`.
* **Library / Cafeteria Desk:**
  * If left at the library counter or cafeteria counter:
    * `currently_held_at.custodian` = `"Library Desk"` or `"Cafeteria Counter"`.

---

## 3. Typo Correction & Robustness

Students typing quickly on mobile devices often introduce typos. Correct them on the fly:
* **"nridge" / "bridge"** -> "bridge"
* **"c bolck" / "c block"** -> "C Block"
* **"d bolck" / "d block"** -> "D Block"
* **"EE dept" / "ee block"** -> "EE"
* **"CS dept" / "cs block"** -> "CS"
