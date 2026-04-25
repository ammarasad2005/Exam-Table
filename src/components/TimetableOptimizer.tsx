'use client';

import React, { useState } from 'react';
import { ShieldAlert } from 'lucide-react';

// eslint-disable-next-line
const timetableData: any = require('../../public/data/timetable.json');

interface CourseRow {
  year: string;
  dept: string;
  type: string;
  course: string;
  preferredSection: string;
}

interface ScheduleItem {
  course: string;
  section: string;
  config: string;
  isLocked: boolean;
}

interface Slot {
  day: string;
  start: number;
  end: number;
}

interface ValidSchedule {
  activeDays: number;
  maxOffDays: number;
  workloadScore: number;
  comfortScore: number;
  totalBadGapMinutes: number;
  maxClassesInOneDay: number;
  missedMiddayBreaks: number;
  maxConsecutiveAMClasses: number;
  hasBackToBackPMClasses: boolean;
  totalEarlyClasses: number;
  totalLateClasses: number;
  totalConsecutivePenalties: number;
  customScore?: number;
  schedule: ScheduleItem[];
}

export function TimetableOptimizer() {
  const ObjectKeys = (obj: any) => (obj ? Object.keys(obj) : []);
  const availableYears = ObjectKeys(timetableData).filter((k: string) => k !== '__meta__');

  const getDefaultRow = (): CourseRow => {
    const defaultYear = availableYears[0] || '';
    const defaultDept = ObjectKeys(timetableData[defaultYear])[0] || '';
    const defaultType = ObjectKeys(timetableData[defaultYear]?.[defaultDept])[0] || '';
    return { year: defaultYear, dept: defaultDept, type: defaultType, course: '', preferredSection: '' };
  };

  const handlePreview = (schedule: ScheduleItem[]) => {
    try {
      const previewRows = schedule.map((item) => {
        const [year, dept, type] = item.config.split(' ');
        return {
          id: crypto.randomUUID(),
          batch: year,
          stream: dept,
          category: type,
          selection: `${item.course} | ${item.section}`,
          errorBatch: false,
          errorStream: false,
          errorCategory: false,
          errorSelection: false,
        };
      });
      localStorage.setItem('fsc_timetable_preview', JSON.stringify(previewRows));
    } catch (e) {
      console.error("Failed to set preview data", e);
    }
  };

  // --- State ---
  const [selectedCourses, setSelectedCourses] = useState<CourseRow[]>([getDefaultRow()]);
  const [hasPreferences, setHasPreferences] = useState(false);
  const [optimizationMode, setOptimizationMode] = useState('balanced');
  const [customWeights, setCustomWeights] = useState({
    earlyMorning: 50,
    lateAfternoon: 50,
    middayBreak: 50,
    gaps: 50,
    consecutiveClasses: 50,
    daysOnCampus: 50,
  });
  const [result, setResult] = useState<{ totalFound: number; options: ValidSchedule[] } | null>(null);
  const [error, setError] = useState('');

  const handleWeightChange = (key: keyof typeof customWeights, newValue: number) => {
    setCustomWeights(prev => ({ ...prev, [key]: newValue }));
  };

  // --- Row Management ---
  const addCourse = () => {
    const lastRow = selectedCourses[selectedCourses.length - 1];
    setSelectedCourses([...selectedCourses, { ...lastRow, course: '', preferredSection: '' }]);
  };

  const removeCourse = (index: number) => {
    const newCourses = selectedCourses.filter((_, i) => i !== index);
    setSelectedCourses(newCourses.length ? newCourses : [getDefaultRow()]);
  };

  const updateRowField = (index: number, field: keyof CourseRow, value: string) => {
    const newCourses = [...selectedCourses];
    const row = { ...newCourses[index] };

    row[field] = value;

    if (field === 'year') {
      const depts = ObjectKeys(timetableData[value]);
      row.dept = depts[0] || '';
      const types = ObjectKeys(timetableData[value]?.[row.dept]);
      row.type = types[0] || '';
      row.course = '';
      row.preferredSection = '';
    } else if (field === 'dept') {
      const types = ObjectKeys(timetableData[row.year]?.[value]);
      row.type = types[0] || '';
      row.course = '';
      row.preferredSection = '';
    } else if (field === 'type') {
      row.course = '';
      row.preferredSection = '';
    } else if (field === 'course') {
      row.preferredSection = '';
    }

    newCourses[index] = row;
    setSelectedCourses(newCourses);
    setResult(null);
  };

  // --- Core Algorithm ---
  const parseTime = (timeStr: string) => {
    const [start, end] = timeStr.split('-');
    const toMinutes = (tS: string) => {
      let [h, m] = tS.split(':').map(Number);
      if (h >= 1 && h <= 7) h += 12; // PM shift
      return h * 60 + m;
    };
    return [toMinutes(start), toMinutes(end)];
  };

  const isClash = (currentSlots: Slot[], newSlots: Slot[]) => {
    for (const n of newSlots) {
      for (const s of currentSlots) {
        if (n.day === s.day) {
          if (!(n.end <= s.start || n.start >= s.end)) return true;
        }
      }
    }
    return false;
  };

  const calculateWorkloadMetrics = (slots: Slot[]) => {
    const days: Record<string, Slot[]> = {};
    slots.forEach(s => {
      if (!days[s.day]) days[s.day] = [];
      days[s.day].push(s);
    });

    let score = 0;
    let totalBadGapMinutes = 0;
    let maxClassesInOneDay = 0;
    let missedMiddayBreaks = 0;
    let totalEarlyClasses = 0;
    let totalLateClasses = 0;
    let totalConsecutivePenalties = 0;

    let maxConsecutiveAMClasses = 1;
    let hasBackToBackPMClasses = false;

    // New Comfort Score Deductions
    let totalComfortDeductions = 0;

    for (const daySlots of Object.values(days)) {
      daySlots.sort((a, b) => a.start - b.start);

      const starts = daySlots.map(s => s.start);
      const ends = daySlots.map(s => s.end);
      const minStart = Math.min(...starts);
      const maxEnd = Math.max(...ends);

      const span = maxEnd - minStart;
      maxClassesInOneDay = Math.max(maxClassesInOneDay, daySlots.length);

      let dayBadGapMinutes = 0;
      let middayBreakAchieved = false;

      let dayConsecutiveClasses = 1;
      let dayFatiguePenalty = 0;

      for (let i = 0; i < daySlots.length - 1; i++) {
        const gapStart = daySlots[i].end;
        const gapEnd = daySlots[i + 1].start;
        const gapDuration = gapEnd - gapStart;

        if (gapDuration <= 20) {
          dayConsecutiveClasses++;

          const isAfternoonClass = daySlots[i + 1].start >= 750;

          if (isAfternoonClass) {
            if (dayConsecutiveClasses >= 2) {
              dayFatiguePenalty += 300;
              hasBackToBackPMClasses = true;
              totalConsecutivePenalties += 1;
              totalComfortDeductions += 25; // 25% penalty for afternoon drain
            }
          } else {
            maxConsecutiveAMClasses = Math.max(maxConsecutiveAMClasses, dayConsecutiveClasses);
            if (dayConsecutiveClasses > 2) {
              dayFatiguePenalty += 150;
              totalConsecutivePenalties += 1;
              totalComfortDeductions += 10; // 10% penalty for 3+ AM classes
            }
          }
        } else {
          dayConsecutiveClasses = 1;

          // Midday Break logic: Must start between 11:30 AM and 2:30 PM
          const isNoonGap = gapStart >= (11 * 60 + 30) && gapStart <= (14 * 60 + 30);
          if (isNoonGap && gapDuration >= 30 && gapDuration <= 100) {
            middayBreakAchieved = true;
            dayBadGapMinutes += (gapDuration * 0.1);
          } else {
            dayBadGapMinutes += gapDuration;
          }
        }
      }

      // Midday Break Penalty Logic
      const arrivedEarly = minStart <= 11 * 60 + 30; // 11:30 AM or earlier
      const onCampusDuringMidday = maxEnd >= 13 * 60 + 30; // 1:30 PM or later
      
      if (arrivedEarly && onCampusDuringMidday && !middayBreakAchieved) {
        missedMiddayBreaks += 1;
        score += 200;
        totalComfortDeductions += 20; // 20% penalty for missing Midday Break
      }

      totalBadGapMinutes += dayBadGapMinutes;

      score += span;
      score += (dayBadGapMinutes * 1.5);
      score += dayFatiguePenalty;

      if (daySlots.length > 3) {
        score += (daySlots.length - 3) * 120;
        totalComfortDeductions += (daySlots.length - 3) * 5; // 5% penalty per extra class
      }

      if (minStart <= 8 * 60 + 30) {
        score += 40;
        totalEarlyClasses += 1;
      }
      if (maxEnd >= 16 * 60) {
        score += 50;
        totalLateClasses += 1;
      }
    }

    // Deduct 1% from comfort for every 10 mins of bad gaps
    totalComfortDeductions += (totalBadGapMinutes / 10);

    // Ensure score stays between 0 and 100
    const comfortScore = Math.max(0, Math.min(100, Math.round(100 - totalComfortDeductions)));

    return {
      score,
      totalBadGapMinutes,
      maxClassesInOneDay,
      missedMiddayBreaks,
      maxConsecutiveAMClasses,
      hasBackToBackPMClasses,
      totalEarlyClasses,
      totalLateClasses,
      totalConsecutivePenalties,
      comfortScore // Export the new UX metric
    };
  };

  const handleOptimize = () => {
    setError('');
    setResult(null);

    const validCourses = selectedCourses.filter(c => c.course !== '');

    if (validCourses.length === 0) {
      setError('Please select at least one course.');
      return;
    }

    const courseNames = validCourses.map(c => c.course);
    if (new Set(courseNames).size !== courseNames.length) {
      setError('You have selected duplicate courses. Please remove them.');
      return;
    }

    const courseData: Record<string, any> = {};
    for (const item of validCourses) {
      const data = timetableData[item.year]?.[item.dept]?.[item.type]?.[item.course];
      if (!data) {
        setError(`Data for '${item.course}' is missing.`);
        return;
      }
      courseData[item.course] = data;
    }

    const allValidSchedules: ValidSchedule[] = [];

    const backtrack = (courseIdx: number, currentSchedule: ScheduleItem[], currentSlots: Slot[]) => {
      if (courseIdx === validCourses.length) {
        const activeDays = new Set(currentSlots.map(s => s.day));
        const metrics = calculateWorkloadMetrics(currentSlots);
        
        let customScore = 0;
        if (optimizationMode === 'custom') {
            const totalWeight = Object.values(customWeights).reduce((a, b) => a + b, 0);
            if (totalWeight > 0) {
                // Normalize weights so the final score is consistent regardless of scale
                const norm = (w: number) => w / totalWeight;
                
                customScore += (metrics.totalEarlyClasses * norm(customWeights.earlyMorning) * 100);
                customScore += (metrics.totalLateClasses * norm(customWeights.lateAfternoon) * 100);
                customScore += (metrics.missedMiddayBreaks * norm(customWeights.middayBreak) * 500); // High impact
                customScore += (metrics.totalBadGapMinutes * norm(customWeights.gaps) * 5); 
                customScore += (metrics.totalConsecutivePenalties * norm(customWeights.consecutiveClasses) * 200);
                customScore += (activeDays.size * norm(customWeights.daysOnCampus) * 300);
            }
        }

        allValidSchedules.push({
          activeDays: activeDays.size,
          maxOffDays: 5 - activeDays.size,
          workloadScore: metrics.score,
          comfortScore: metrics.comfortScore,
          totalBadGapMinutes: metrics.totalBadGapMinutes,
          maxClassesInOneDay: metrics.maxClassesInOneDay,
          missedMiddayBreaks: metrics.missedMiddayBreaks,
          maxConsecutiveAMClasses: metrics.maxConsecutiveAMClasses,
          hasBackToBackPMClasses: metrics.hasBackToBackPMClasses,
          totalEarlyClasses: metrics.totalEarlyClasses,
          totalLateClasses: metrics.totalLateClasses,
          totalConsecutivePenalties: metrics.totalConsecutivePenalties,
          customScore: optimizationMode === 'custom' ? customScore : undefined,
          schedule: [...currentSchedule]
        });
        return;
      }

      const currentItem = validCourses[courseIdx];
      const currentCourseName = currentItem.course;
      const sections = courseData[currentCourseName];

      let sectionsToTry = Object.entries(sections);
      if (hasPreferences && currentItem.preferredSection) {
        if (sections[currentItem.preferredSection]) {
          sectionsToTry = [[currentItem.preferredSection, sections[currentItem.preferredSection]]];
        } else {
          setError(`Preferred section ${currentItem.preferredSection} for ${currentCourseName} is invalid.`);
          return;
        }
      }

      for (const [sectionName, daysDict] of sectionsToTry) {
        const newSlots: Slot[] = [];
        for (const [day, classes] of Object.entries(daysDict as Record<string, any[]>)) {
          if (day === 'Saturday' || day === 'Sunday') continue;

          for (const cls of classes) {
            const [startMin, endMin] = parseTime(cls.time);
            newSlots.push({ day, start: startMin, end: endMin });
          }
        }

        if (!isClash(currentSlots, newSlots)) {
          currentSchedule.push({
            course: currentCourseName,
            section: sectionName,
            config: `${currentItem.year} ${currentItem.dept} ${currentItem.type}`,
            isLocked: hasPreferences && currentItem.preferredSection === sectionName
          });

          backtrack(courseIdx + 1, currentSchedule, [...currentSlots, ...newSlots]);
          currentSchedule.pop();
        }
      }
    };

    backtrack(0, [], []);

    if (allValidSchedules.length === 0) {
      setError('No clash-free timetable exists within the 5-day workweek. Check your locked sections or selected courses.');
    } else {
      if (optimizationMode === 'max_off_days') {
        allValidSchedules.sort((a, b) => {
          if (a.activeDays !== b.activeDays) return a.activeDays - b.activeDays;
          return a.workloadScore - b.workloadScore;
        });
      } else if (optimizationMode === 'min_workload') {
        allValidSchedules.sort((a, b) => {
          if (a.workloadScore !== b.workloadScore) return a.workloadScore - b.workloadScore;
          return a.activeDays - b.activeDays;
        });
      } else if (optimizationMode === 'balanced') {
        allValidSchedules.sort((a, b) => {
          const balancedScoreA = a.workloadScore + (a.activeDays * 250);
          const balancedScoreB = b.workloadScore + (b.activeDays * 250);
          if (balancedScoreA !== balancedScoreB) return balancedScoreA - balancedScoreB;
          return a.activeDays - b.activeDays;
        });
      } else if (optimizationMode === 'custom') {
        allValidSchedules.sort((a, b) => {
           if (a.customScore !== b.customScore) return (a.customScore || 0) - (b.customScore || 0);
           return a.activeDays - b.activeDays;
        });
      }

      setResult({
        totalFound: allValidSchedules.length,
        options: allValidSchedules.slice(0, 15)
      });
    }
  };

  // --- UI Render ---
  return (
    <div className="w-full mx-auto pb-12 rounded-xl bg-[var(--color-bg)]">
      <div className="flex flex-col md:flex-row md:justify-between md:items-start mb-6">
        <div>
          <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">Advanced Timetable Optimizer</h2>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">
            Configure the exact batch, department, and type for every course you plan to take. (5-Day Week Mode).
          </p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 mb-8 bg-[var(--color-bg-subtle)] p-4 rounded-lg border border-[var(--color-border)]">
        <div className="flex-1">
          <label className="block text-sm font-bold text-[var(--color-text-primary)] mb-3">Optimization Goal</label>
          <div className="space-y-3">
            <label className="flex items-start gap-3 cursor-pointer p-2 rounded-md hover:bg-[var(--color-bg-raised)] transition-colors">
              <input
                type="radio"
                name="optMode"
                className="w-4 h-4 mt-0.5 text-[var(--accent-cs)] focus:ring-[var(--accent-cs)]"
                checked={optimizationMode === 'max_off_days'}
                onChange={() => { setOptimizationMode('max_off_days'); setResult(null); }}
              />
              <span className="text-sm text-[var(--color-text-secondary)]">
                <strong className="text-[var(--color-text-primary)] block mb-0.5">Maximize Off-Days</strong>
                Crams classes into fewest days possible.
              </span>
            </label>

            <label className="flex items-start gap-3 cursor-pointer p-2 rounded-md hover:bg-[var(--color-bg-raised)] transition-colors bg-[var(--accent-se-bg)] border border-[var(--color-border)]">
              <input
                type="radio"
                name="optMode"
                className="w-4 h-4 mt-0.5 text-[var(--accent-se)] focus:ring-[var(--accent-se)]"
                checked={optimizationMode === 'balanced'}
                onChange={() => { setOptimizationMode('balanced'); setResult(null); }}
              />
              <span className="text-sm text-[var(--color-text-secondary)]">
                <strong className="text-[var(--color-text-primary)] block mb-0.5">Balanced (Recommended)</strong>
                Maximizes off-days, but gracefully accepts an extra campus day if it saves you from a brutal workload or missed prayers.
              </span>
            </label>

            <label className={`flex items-start gap-3 cursor-pointer p-2 rounded-md hover:bg-[var(--color-bg-raised)] transition-colors ${optimizationMode === 'min_workload' ? 'bg-[var(--accent-ee-bg)] border border-[var(--color-border)]' : ''}`}>
              <input
                type="radio"
                name="optMode"
                className="w-4 h-4 mt-0.5 text-[var(--accent-ee)] focus:ring-[var(--accent-ee)]"
                checked={optimizationMode === 'min_workload'}
                onChange={() => { setOptimizationMode('min_workload'); setResult(null); }}
              />
              <span className="text-sm text-[var(--color-text-secondary)]">
                <strong className="text-[var(--color-text-primary)] block mb-0.5">Minimize Workload</strong>
                Absolute priority on balanced days, avoids heavy gaps, limits back-to-back classes, and ensures time for Midday Break.
              </span>
            </label>

            <label className={`flex items-start gap-3 cursor-pointer p-2 rounded-md hover:bg-[var(--color-bg-raised)] transition-colors ${optimizationMode === 'custom' ? 'bg-[var(--color-bg-raised)] border border-[var(--color-border-strong)]' : ''}`}>
              <input
                type="radio"
                name="optMode"
                className="w-4 h-4 mt-0.5 text-[var(--color-text-primary)] focus:ring-[var(--color-text-primary)]"
                checked={optimizationMode === 'custom'}
                onChange={() => { setOptimizationMode('custom'); setResult(null); }}
              />
              <span className="text-sm text-[var(--color-text-secondary)] w-full">
                <strong className="text-[var(--color-text-primary)] block mb-0.5">Custom Weights</strong>
                Tune exactly how much you care about mornings, afternoons, gaps, and breaks.
              </span>
            </label>

            {optimizationMode === 'custom' && (
              <div className="pl-7 pr-2 py-2 flex flex-col gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                {[
                  { key: 'earlyMorning', label: 'Avoid Early Mornings (8:30 AM)' },
                  { key: 'lateAfternoon', label: 'Avoid Late Afternoons (4:00 PM+)' },
                  { key: 'middayBreak', label: 'Secure Midday Break' },
                  { key: 'gaps', label: 'Minimize Unproductive Gaps' },
                  { key: 'consecutiveClasses', label: 'Avoid Fatigue (Back-to-Back)' },
                  { key: 'daysOnCampus', label: 'Maximize Off-Days' },
                ].map(({ key, label }) => (
                  <div key={key} className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-medium text-[var(--color-text-primary)]">{label}</span>
                      <span className="font-mono font-bold text-[var(--color-text-secondary)] w-10 text-right">
                        {customWeights[key as keyof typeof customWeights]}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={customWeights[key as keyof typeof customWeights]}
                      onChange={(e) => handleWeightChange(key as keyof typeof customWeights, parseInt(e.target.value, 10))}
                      className="w-full h-1.5 bg-[var(--color-border)] rounded-lg appearance-none cursor-pointer accent-[var(--color-text-primary)]"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="w-px bg-[var(--color-border)] hidden lg:block"></div>

        <div className="flex-1">
          <label className="block text-sm font-bold text-[var(--color-text-primary)] mb-3">Section Constraints</label>
          <label className="flex items-center gap-2 cursor-pointer bg-[var(--color-bg-raised)] p-2 border border-[var(--color-border)] rounded-md w-max shadow-sm hover:border-[var(--color-border-strong)] transition-colors">
            <input
              type="checkbox"
              className="w-4 h-4 text-[var(--accent-cs)] rounded focus:ring-[var(--accent-cs)]"
              checked={hasPreferences}
              onChange={e => { setHasPreferences(e.target.checked); setResult(null); }}
            />
            <span className="text-sm font-medium text-[var(--color-text-secondary)] select-none">
              I want to lock in preferred sections manually
            </span>
          </label>
        </div>
      </div>

      <div className="space-y-4 mb-6">
        {selectedCourses.map((row, idx) => {
          const availableDepts = ObjectKeys(timetableData[row.year]);
          const availableTypes = ObjectKeys(timetableData[row.year]?.[row.dept]);
          const availableCourses = ObjectKeys(timetableData[row.year]?.[row.dept]?.[row.type]);
          const availableSections = row.course
            ? ObjectKeys(timetableData[row.year]?.[row.dept]?.[row.type]?.[row.course])
            : [];

          return (
            <div key={idx} className="flex flex-wrap lg:flex-nowrap gap-3 p-4 border border-[var(--color-border)] rounded-lg bg-[var(--color-bg-raised)] items-end shadow-sm">
              <div className="flex-1 min-w-[80px]">
                <label className="block text-xs font-medium text-[var(--color-text-tertiary)] mb-1 uppercase tracking-wider">Year</label>
                <select
                  className="w-full p-2 border border-[var(--color-border)] rounded-md outline-none focus:ring-2 focus:ring-[var(--accent-cs)] text-sm bg-[var(--color-bg)] text-[var(--color-text-primary)]"
                  value={row.year} onChange={e => updateRowField(idx, 'year', e.target.value)}>
                  {availableYears.map((y: string) => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>

              <div className="flex-1 min-w-[80px]">
                <label className="block text-xs font-medium text-[var(--color-text-tertiary)] mb-1 uppercase tracking-wider">Dept</label>
                <select
                  className="w-full p-2 border border-[var(--color-border)] rounded-md outline-none focus:ring-2 focus:ring-[var(--accent-cs)] text-sm bg-[var(--color-bg)] text-[var(--color-text-primary)]"
                  value={row.dept} onChange={e => updateRowField(idx, 'dept', e.target.value)}>
                  {availableDepts.map((d: string) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>

              <div className="flex-1 min-w-[80px]">
                <label className="block text-xs font-medium text-[var(--color-text-tertiary)] mb-1 uppercase tracking-wider">Type</label>
                <select
                  className="w-full p-2 border border-[var(--color-border)] rounded-md outline-none focus:ring-2 focus:ring-[var(--accent-cs)] text-sm bg-[var(--color-bg)] text-[var(--color-text-primary)]"
                  value={row.type} onChange={e => updateRowField(idx, 'type', e.target.value)}>
                  {availableTypes.map((t: string) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              <div className="flex-[2] min-w-[150px]">
                <label className="block text-xs font-bold text-[var(--color-text-primary)] mb-1">Course</label>
                <select
                  className="w-full p-2 border border-[var(--color-border-strong)] rounded-md outline-none focus:ring-2 focus:ring-[var(--accent-cs)] font-medium text-sm bg-[var(--color-bg)] text-[var(--color-text-primary)]"
                  value={row.course}
                  onChange={e => updateRowField(idx, 'course', e.target.value)}
                >
                  <option value="">-- Select Course --</option>
                  {availableCourses.map((c: string) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {hasPreferences && (
                <div className="flex-1 min-w-[120px]">
                  <label className="block text-xs font-bold text-[var(--accent-ee)] mb-1">Lock Section</label>
                  <select
                    disabled={!row.course}
                    className="w-full p-2 border border-[var(--color-border)] bg-[var(--accent-ee-bg)] rounded-md outline-none focus:ring-2 focus:ring-[var(--accent-ee)] font-medium text-sm disabled:opacity-50 text-[var(--color-text-primary)]"
                    value={row.preferredSection}
                    onChange={e => updateRowField(idx, 'preferredSection', e.target.value)}
                  >
                    <option value="">Optimize Any</option>
                    {availableSections.map((s: string) => (
                      <option key={s} value={s}>Section {s}</option>
                    ))}
                  </select>
                </div>
              )}

              <button
                onClick={() => removeCourse(idx)}
                className="px-4 py-2 text-red-500 hover:bg-red-500/10 bg-transparent border border-red-500/30 rounded-md font-medium transition-colors text-sm h-[38px] flex items-center justify-center"
              >
                Remove
              </button>
            </div>
          );
        })}
      </div>

      <button
        onClick={addCourse}
        className="mb-8 text-[var(--color-text-secondary)] font-bold hover:text-[var(--color-text-primary)] transition-colors flex items-center gap-1"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
        Add Another Course
      </button>

      <button
        onClick={handleOptimize}
        className={`w-full py-4 text-white rounded-lg font-bold text-lg transition-colors shadow-lg
          ${optimizationMode === 'max_off_days' ? 'bg-[var(--accent-cs)] hover:opacity-90' :
            optimizationMode === 'balanced' ? 'bg-[var(--accent-se)] hover:opacity-90' : 'bg-[var(--accent-ee)] hover:opacity-90'}`}
      >
        Find the Best Schedules
      </button>

      {/* Results Display */}
      {error && (
        <div className="mt-6 p-4 bg-red-500/10 text-red-600 border border-red-500/20 rounded-lg flex items-center gap-3">
          <span className="font-medium">{error}</span>
        </div>
      )}

      {result && (
        <div className="mt-10 border-t border-[var(--color-border)] pt-8">
          <div className="mb-6 flex justify-between items-end">
            <div>
              <h3 className="text-xl font-bold text-[var(--color-text-primary)]">
                Top Schedules ({
                  optimizationMode === 'max_off_days' ? 'Max Off-Days' :
                    optimizationMode === 'balanced' ? 'Balanced' : 'Min Workload'
                })
              </h3>
              <p className="text-[var(--color-text-secondary)] mt-1">
                Found {result.totalFound} valid combinations. Showing top {result.options.length}.
              </p>
            </div>
          </div>

          <div className="space-y-6">
            {result.options.map((option, optIdx) => {
              const isAbsoluteBest = optIdx === 0;

              // Color coding for Comfort Score
              const getComfortColor = (score: number) => {
                if (score >= 90) return 'text-emerald-600 dark:text-emerald-400';
                if (score >= 70) return 'text-amber-500 dark:text-amber-400';
                return 'text-rose-500 dark:text-rose-400';
              };

              let borderClass = 'border-[var(--color-border)] bg-[var(--color-bg-raised)]';
              let badgeClass = 'bg-[var(--color-bg-subtle)] text-[var(--color-text-secondary)]';

              if (isAbsoluteBest) {
                if (optimizationMode === 'max_off_days') {
                  borderClass = 'border-[var(--accent-cs)] bg-[var(--accent-cs-bg)]';
                  badgeClass = 'bg-[var(--accent-cs)] text-white';
                } else if (optimizationMode === 'balanced') {
                  borderClass = 'border-[var(--accent-se)] bg-[var(--accent-se-bg)]';
                  badgeClass = 'bg-[var(--accent-se)] text-white';
                } else {
                  borderClass = 'border-[var(--accent-ee)] bg-[var(--accent-ee-bg)]';
                  badgeClass = 'bg-[var(--accent-ee)] text-white';
                }
              }

              return (
                <div key={optIdx} className={`p-5 rounded-xl border-2 transition-all flex flex-col gap-4 ${borderClass}`}>

                  <div className="flex flex-col xl:flex-row justify-between xl:items-center pb-3 border-b border-[var(--color-border)] gap-4">
                    <div className="flex items-center gap-4">
                      <span className={`text-sm font-bold px-3 py-1 rounded-lg ${badgeClass}`}>
                        Rank #{optIdx + 1}
                      </span>
                      <div className="flex flex-col">
                        <span className={`text-xl font-black ${getComfortColor(option.comfortScore)}`}>
                          Comfort Score: {option.comfortScore}%
                        </span>
                        <span className="text-xs text-[var(--color-text-secondary)] font-medium uppercase tracking-wider">
                          {option.maxOffDays} Off-Days Secured
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap xl:flex-nowrap items-center gap-3 text-xs font-medium text-[var(--color-text-primary)]">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Midday Break Badges */}
                        {option.missedMiddayBreaks === 0 ? (
                          <span className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5">
                            🕌 Midday Break Secured
                          </span>
                        ) : (
                          <span className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 px-2.5 py-1.5 rounded-lg">
                            ⚠️ Missed Midday Break ({option.missedMiddayBreaks}x)
                          </span>
                        )}

                        {/* Attention Span / Fatigue Badges */}
                        {option.hasBackToBackPMClasses ? (
                          <span className="bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20 px-2.5 py-1.5 rounded-lg">
                            ⚠️ Afternoon Drain (Back-to-back PM classes)
                          </span>
                        ) : option.maxConsecutiveAMClasses > 2 ? (
                          <span className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 px-2.5 py-1.5 rounded-lg">
                            ⚠️ Morning Fatigue (3+ back-to-back AM classes)
                          </span>
                        ) : (
                          <span className="bg-[var(--accent-cs-bg)] text-[var(--accent-cs)] border border-[var(--accent-cs)]/20 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5">
                            🧠 Focus Maintained (Well spaced)
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <a
                          href="/timetable/custom"
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => handlePreview(option.schedule)}
                          className="shrink-0 h-9 px-4 rounded-md font-body text-xs font-bold transition-all border bg-[var(--color-text-primary)] text-[var(--color-bg)] border-transparent hover:opacity-90 active:scale-[0.98]"
                        >
                          Preview in New Tab
                        </a>
                      </div>
                    </div>
                  </div>

                  <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {option.schedule.map((item, idx) => (
                      <li key={idx} className="flex justify-between items-center p-3 bg-[var(--color-bg)] rounded-lg border border-[var(--color-border)] shadow-sm hover:border-[var(--color-border-strong)] transition-colors">
                        <div className="flex flex-col pr-2">
                          <span className="font-bold text-[var(--color-text-primary)] text-sm">{item.course}</span>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {item.isLocked && <span className="text-xs font-bold text-[var(--accent-ee)]">🔒</span>}
                          <span className={`font-mono text-xs px-2 py-1 rounded border ${item.isLocked ? 'bg-[var(--accent-ee-bg)] border-[var(--accent-ee)]/30 text-[var(--accent-ee)]' : 'bg-[var(--color-bg-subtle)] border-[var(--color-border)] text-[var(--color-text-secondary)]'}`}>
                            Sec {item.section}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
