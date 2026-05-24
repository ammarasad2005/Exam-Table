# FAST-NUCES Islamabad Campus Location & Parsing Rules

This document outlines the strict guidelines and extraction parameters to be used by the Lost & Found location extraction engine.

---

## 1. High-Fidelity Data Extraction Policy (Zero Assumption)

To preserve the absolute integrity of student and campus records, the location parser must follow a strict **zero-assumption policy**:

* **Block A is NOT EE and Block B is NOT CS:** Under no circumstances should you assume or map "Block A" to "EE" (Electrical Engineering) or "Block B" to "CS" (Computer Science), or vice-versa. They are separate, distinct identifiers in the campus map and student records.
  * If the input text says `"Block A"`, the extracted building MUST be exactly `"Block A"` (do NOT extract it as `"EE"`, `"EE Block"`, or associate it with Electrical Engineering).
  * If the input text says `"EE"` or `"EE Block"`, the extracted building MUST be `"EE Block"` or `"EE"` (do NOT extract it as `"Block A"` or assume it refers to Block A).
  * If the input text says `"Block B"`, the extracted building MUST be exactly `"Block B"` (do NOT extract it as `"CS"`, `"CS Block"`, or associate it with Computer Science).
  * If the input text says `"CS"` or `"CS Block"`, the extracted building MUST be `"CS Block"` or `"CS"` (do NOT extract it as `"Block B"` or assume it refers to Block B).
* **No External Mapping or Assumptions:** Do NOT attribute any assumptions, external campus layout knowledge, or guesses to the user's message. Extract building names, custodians, and areas entirely and literally from the given note content.
* **Preserve Textual Context:** If the text says "on bridge between C Block and D Block", the building is strictly `"C Block / D Block"` (or `"C Block & D Block"`) and the area is `"On the bridge"`. Do not guess or truncate.

## 2. Dynamic Location Extraction & Open-Ended Parsing

Instead of trying to fit the user's input into a hardcoded list of campus buildings, map coordinates, or pre-defined locations:
* **Use Intuitive Reasoning:** Rely on standard linguistic analysis and contextual clues to extract the name of the building and the specific area where the item was found.
* **No Predefined Layout Mapping:** The extracted `"building"` or `"area"` fields can be any string whatsoever that accurately represents the structure or location described by the user. Do not force-map their input to "Block A", "Block B", "Block C", "Block D", "Library", etc., if they wrote something else.
* **Open-Ended Examples:**
  * If the note is: `"found on ridge between c block and d block at 4th floor"`, the extracted building is `"C Block / D Block"` (or `"C Block & D Block"`) and the area is `"On the bridge walkway, 4th floor"`.
  * If the note is: `"in the lawn in front of EE building"`, the extracted building is `"EE Block"` or `"EE Building"` (NOT `"Block A"`, NOT `"Academic Block"`).
  * If the note is: `"at the CS department lobby"`, the extracted building is `"CS Department"` or `"CS Block"` (NOT `"Block B"`, NOT `"Academic Block"`).
  * If the note is: `"in the newly built block F"`, the extracted building is `"Block F"` (even if Block F doesn't exist in any pre-defined campus list!).

---

## 3. Custodian & Submission Mapping

Analyze the handoff details carefully:

### 3.1 "Left as is" (Static Status)
* If the finder explicitly states that the item was left where it was (e.g., "left it as it is there", "left it on the bench", "didn't pick up", "left it there"):
  * `currently_held_at.custodian` **MUST** be `"None"`.
  * `currently_held_at.building` **MUST** match the `discovered_at.building` exactly.
  * `currently_held_at.area` **MUST** be set to `"Left at discovery spot"` (or match the discovered area exactly).

### 3.2 Handed Over (Active Custodian)
* **Guard / Security:**
  * If handed to a guard or security desk (e.g., "handed to guard", "with guard in C Block", "left at security"):
    * `currently_held_at.custodian` = `"Guard"`.
* **Department Office:**
  * If handed to an academic or department office:
    * `currently_held_at.custodian` = `"Academic Office"`.
* **None:**
  * If the finder is keeping the item personally:
    * `currently_held_at.custodian` = `"None"`.

---

## 4. Typo Correction & Normalization

Correct typos on the fly to keep coordinates readable:
* **"nridge" / "bridge"** -> "bridge"
* **"c bolck" / "c block"** -> "C Block"
* **"d bolck" / "d block"** -> "D Block"
* **"admin bolck" / "admin block"** -> "Admin Block"
