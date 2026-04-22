const fs = require('fs');
const raw = JSON.parse(fs.readFileSync('/home/ammarasad2005/projects/exams/public/data/timetable.json', 'utf8'));
const entries = [];
for (const batch in raw) {
    if (batch === '__meta__') continue;
    for (const dept in raw[batch]) {
        for (const cat in raw[batch][dept]) {
            for (const course in raw[batch][dept][cat]) {
                for (const sec in raw[batch][dept][cat][course]) {
                    for (const day in raw[batch][dept][cat][course][sec]) {
                        for (const slot of raw[batch][dept][cat][course][sec][day]) {
                            entries.push({ course, batch, dept, section: sec, day, time: slot.time });
                        }
                    }
                }
            }
        }
    }
}
const sea = entries.filter(e => e.batch === '2023' && e.dept === 'SE' && e.section === 'A');
console.log("SE-A classes:");
sea.filter(e => e.course === 'Comp Net Lab' || e.course === 'AI Lab').forEach(e => console.log(e.day, e.course, e.time));
