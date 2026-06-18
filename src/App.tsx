import { useState, useEffect } from "react";
import { StudentRow, MoodLogRow, StudyPlanRow, PerformanceRow } from "./types";
import TerminalSimulator from "./components/TerminalSimulator";
import DatabaseViewer from "./components/DatabaseViewer";
import CodeExplorer from "./components/CodeExplorer";
import { Code2, Database, Terminal, Sparkles, BookOpen, UserCheck, HelpCircle } from "lucide-react";

// Get date relative days helper
const getPastDateStr = (daysAgo: number): string => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split("T")[0];
};

// Seed values
const SEED_STUDENTS: StudentRow[] = [
  {
    student_id: 1,
    name: "Jane Doe",
    email: "jane@college.edu",
    password_hash: "securepass123"
  }
];

const SEED_MOOD_LOGS: MoodLogRow[] = [
  {
    mood_id: 1,
    student_id: 1,
    mood: "Stressed",
    energy_level: 4,
    study_hours: 3.0,
    log_date: getPastDateStr(3)
  },
  {
    mood_id: 2,
    student_id: 1,
    mood: "Tired",
    energy_level: 3,
    study_hours: 2.0,
    log_date: getPastDateStr(2)
  },
  {
    mood_id: 3,
    student_id: 1,
    mood: "Happy",
    energy_level: 8,
    study_hours: 4.0,
    log_date: getPastDateStr(1)
  },
  {
    mood_id: 4,
    student_id: 1,
    mood: "Motivated",
    energy_level: 7,
    study_hours: 5.0,
    log_date: getPastDateStr(0)
  }
];

const SEED_STUDY_PLANS: StudyPlanRow[] = [
  {
    plan_id: 1,
    student_id: 1,
    subject: "Python Advanced - System Design & Building Core Engine",
    duration: 180,
    plan_date: getPastDateStr(0)
  },
  {
    plan_id: 2,
    student_id: 1,
    subject: "DSA - Project Architecture Mapping",
    duration: 120,
    plan_date: getPastDateStr(0)
  }
];

const SEED_PERFORMANCE: PerformanceRow[] = [
  {
    performance_id: 1,
    student_id: 1,
    planned_hours: 3.0,
    actual_hours: 2.0,
    tasks_completed: 1,
    completion_percentage: 66.67,
    entry_date: getPastDateStr(3)
  },
  {
    performance_id: 2,
    student_id: 1,
    planned_hours: 2.0,
    actual_hours: 2.0,
    tasks_completed: 2,
    completion_percentage: 100.0,
    entry_date: getPastDateStr(2)
  },
  {
    performance_id: 3,
    student_id: 1,
    planned_hours: 4.0,
    actual_hours: 4.2,
    tasks_completed: 3,
    completion_percentage: 105.0,
    entry_date: getPastDateStr(1)
  }
];

export default function App() {
  // Database States
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [moodLogs, setMoodLogs] = useState<MoodLogRow[]>([]);
  const [studyPlans, setStudyPlans] = useState<StudyPlanRow[]>([]);
  const [performance, setPerformance] = useState<PerformanceRow[]>([]);
  const [loggedStudent, setLoggedStudent] = useState<StudentRow | null>(null);

  // Layout Tab: Code Viewer vs MySQL database view
  const [rightPanelTab, setRightPanelTab] = useState<"code" | "database">("code");

  // Clipboard click copy feedback state
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  const handleCopyCredentials = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopyFeedback(label);
    setTimeout(() => {
      setCopyFeedback(null);
    }, 2000);
  };

  // Load from local storage or set seed
  useEffect(() => {
    const storedStudents = localStorage.getItem("study_planner_students");
    const storedMoods = localStorage.getItem("study_planner_moods");
    const storedPlans = localStorage.getItem("study_planner_plans");
    const storedPerf = localStorage.getItem("study_planner_performance");

    if (storedStudents && storedMoods && storedPlans && storedPerf) {
      setStudents(JSON.parse(storedStudents));
      setMoodLogs(JSON.parse(storedMoods));
      setStudyPlans(JSON.parse(storedPlans));
      setPerformance(JSON.parse(storedPerf));
    } else {
      // Seed initial dummy data to demonstrate full analytics immediately
      handleResetSeed();
    }
  }, []);

  // Save states helper
  const saveAllToLocalStorage = (
    newStuds: StudentRow[],
    newMoods: MoodLogRow[],
    newPlans: StudyPlanRow[],
    newPerf: PerformanceRow[]
  ) => {
    localStorage.setItem("study_planner_students", JSON.stringify(newStuds));
    localStorage.setItem("study_planner_moods", JSON.stringify(newMoods));
    localStorage.setItem("study_planner_plans", JSON.stringify(newPlans));
    localStorage.setItem("study_planner_performance", JSON.stringify(newPerf));
  };

  const handleResetSeed = () => {
    setStudents(SEED_STUDENTS);
    setMoodLogs(SEED_MOOD_LOGS);
    setStudyPlans(SEED_STUDY_PLANS);
    setPerformance(SEED_PERFORMANCE);
    setLoggedStudent(null);
    saveAllToLocalStorage(SEED_STUDENTS, SEED_MOOD_LOGS, SEED_STUDY_PLANS, SEED_PERFORMANCE);
  };

  const registerStudent = (name: string, email: string, pass: string): StudentRow | string => {
    // Unique check
    const exists = students.some((s) => s.email.toLowerCase() === email.toLowerCase());
    if (exists) {
      return `Registration error: Domain '${email}' represents a verified registered account.`;
    }

    const newStudent: StudentRow = {
      student_id: students.length + 1,
      name,
      email,
      password_hash: pass
    };

    const updatedStudents = [...students, newStudent];
    setStudents(updatedStudents);
    saveAllToLocalStorage(updatedStudents, moodLogs, studyPlans, performance);
    return newStudent;
  };

  const addMoodLog = (student_id: number, mood: string, energy: number, hours: number): string => {
    const todayStr = new Date().toISOString().split("T")[0];
    const newLog: MoodLogRow = {
      mood_id: moodLogs.length + 1,
      student_id,
      mood,
      energy_level: energy,
      study_hours: hours,
      log_date: todayStr
    };

    const updatedMoodLogs = [...moodLogs, newLog];
    setMoodLogs(updatedMoodLogs);
    saveAllToLocalStorage(students, updatedMoodLogs, studyPlans, performance);
    return todayStr;
  };

  const generatePlans = (
    student_id: number,
    mood: string,
    energy: number,
    hours: number,
    subjects: string[]
  ): StudyPlanRow[] => {
    const totalMinutes = intHoursToMins(hours);
    const allocated: StudyPlanRow[] = [];
    let slots: { activity: string; ratio: number }[] = [];

    // Rules engine
    if (mood === "Happy" && energy > 7) {
      slots = [
        { activity: "DSA / Concept Practice", ratio: 0.5 },
        { activity: "Python Advanced Coding", ratio: 0.33 },
        { activity: "Analytical Aptitude", ratio: 0.17 }
      ];
    } else if (mood === "Tired" && energy < 5) {
      slots = [
        { activity: "Revision of Notes", ratio: 0.375 },
        { activity: "Handwritten Summaries", ratio: 0.375 },
        { activity: "Topic MCQs", ratio: 0.25 }
      ];
    } else if (mood === "Stressed") {
      slots = [
        { activity: "Mindfulness Breathing Break", ratio: 0.2 },
        { activity: "Decompressed Revision & Core Maps", ratio: 0.4 },
        { activity: "Elementary Easy Review", ratio: 0.4 }
      ];
    } else if (mood === "Motivated" && energy >= 6) {
      slots = [
        { activity: "System Design & Building Core Engine", ratio: 0.6 },
        { activity: "Project Architecture Mapping", ratio: 0.4 }
      ];
    } else if (mood === "Anxious") {
      slots = [
        { activity: "Self-Testing Quiz", ratio: 0.3 },
        { activity: "Interactive Tutorials", ratio: 0.5 },
        { activity: "Calming Buffer Break", ratio: 0.2 }
      ];
    } else {
      slots = [
        { activity: "Core Textbook Reading", ratio: 0.5 },
        { activity: "Practical Assignments", ratio: 0.5 }
      ];
    }

    const todayStr = new Date().toISOString().split("T")[0];

    // Wipe any existing plan today for this student
    const filteredPlans = studyPlans.filter(
      (p) => !(p.student_id === student_id && p.plan_date === todayStr)
    );

    slots.forEach((s, idx) => {
      const assignedSubject = subjects[idx % subjects.length];
      const duration = Math.round(totalMinutes * s.ratio);
      if (duration > 0) {
        allocated.push({
          plan_id: filteredPlans.length + allocated.length + 1,
          student_id,
          subject: `${assignedSubject} - ${s.activity}`,
          duration,
          plan_date: todayStr
        });
      }
    });

    const updatedPlans = [...filteredPlans, ...allocated];
    setStudyPlans(updatedPlans);
    saveAllToLocalStorage(students, moodLogs, updatedPlans, performance);
    return allocated;
  };

  const addPerformance = (
    student_id: number,
    planned: number,
    actual: number,
    tasks: number
  ): { comp_pct: number; prod_score: number } => {
    const todayStr = new Date().toISOString().split("T")[0];
    const comp_pct = parseFloat(Math.min((actual / (planned || 1.0)) * 100, 150.0).toFixed(2));
    const prod_score = parseFloat((actual * 0.7 + tasks * 0.3).toFixed(2));

    const newPerf: PerformanceRow = {
      performance_id: performance.length + 1,
      student_id,
      planned_hours: planned,
      actual_hours: actual,
      tasks_completed: tasks,
      completion_percentage: comp_pct,
      entry_date: todayStr
    };

    // Filter today's duplicate performance entries
    const filteredPerf = performance.filter(
      (p) => !(p.student_id === student_id && p.entry_date === todayStr)
    );

    const updatedPerf = [...filteredPerf, newPerf];
    setPerformance(updatedPerf);
    saveAllToLocalStorage(students, moodLogs, studyPlans, updatedPerf);

    return { comp_pct, prod_score };
  };

  const intHoursToMins = (hours: number): number => Math.round(hours * 60);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500/20 antialiased">
      {/* Premium Elegant Header */}
      <header className="bg-slate-900 border-b border-slate-800/80 px-6 py-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shrink-0 shadow-sm relative overflow-hidden">
        {/* Subtle decorative background vector blobs */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none" />

        <div className="flex items-center gap-3.5 relative z-10">
          <div className="p-2.5 bg-gradient-to-tr from-indigo-500 to-rose-500 text-white rounded-xl shadow-md shadow-indigo-500/10 animate-pulse">
            <Sparkles size={22} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white font-sans flex items-center gap-2">
              Emotion-Based Study Planner
            </h1>
            <p className="text-xs text-slate-400 font-mono">
              Python OOP / mysql-connector / Matplotlib CLI Simulator Studio
            </p>
          </div>
        </div>

        {/* Diagnostic Status Cards */}
        <div className="flex items-center gap-3 font-mono text-[11px] relative z-10 self-stretch md:self-auto justify-end">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <UserCheck size={12} />
            <span>
              Session:{" "}
              <b className="text-slate-100">
                {loggedStudent ? loggedStudent.name : "Anonymous Student"}
              </b>
            </span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
            <span>Local DB: <b className="text-slate-100">ONLINE</b></span>
          </div>
        </div>
      </header>

      {/* Quick Start Callout Prompt with Click-to-Copy Credentials */}
      <div className="mx-6 mt-4 p-4 bg-indigo-950/20 border border-indigo-500/20 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-3 relative overflow-hidden backdrop-blur-sm shadow-md">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
        <div className="flex items-start gap-3">
          <HelpCircle size={18} className="text-indigo-400 shrink-0 mt-1" />
          <p className="text-xs text-indigo-200/90 leading-relaxed font-sans">
            <span className="font-bold text-white uppercase tracking-wider font-mono mr-2 bg-indigo-500/25 px-1.5 py-0.5 rounded text-[9px] border border-indigo-500/20">
              Academic Sandbox Guidance:
            </span>
            To run the interactive Python terminal, enter option digits below and press <b>EXEC</b> (or press Enter). Log in instantly by clicking these demo credentials: 
            <span className="inline-flex gap-1.5 mx-1.5">
              <code 
                onClick={() => handleCopyCredentials("jane@college.edu", "Demo Email (jane@college.edu)")}
                className="bg-slate-950 text-amber-300 px-2 py-0.5 border border-slate-800 rounded font-mono font-bold cursor-pointer hover:bg-slate-800 hover:text-amber-200 hover:border-amber-500/30 transition-all duration-200 select-all"
                title="Click to copy email address"
              >
                jane@college.edu
              </code>
              <span className="text-slate-500 text-[10px]">password</span>
              <code 
                onClick={() => handleCopyCredentials("securepass123", "Demo Password (securepass123)")}
                className="bg-slate-950 text-amber-300 px-2 py-0.5 border border-slate-800 rounded font-mono font-bold cursor-pointer hover:bg-slate-800 hover:text-amber-200 hover:border-amber-500/30 transition-all duration-200 select-all"
                title="Click to copy password"
              >
                securepass123
              </code>
            </span>
            to plot full analytics (Option 8), download TXT/CSV reports (Option 9), browse relational tables (Option 10), or explore database-ready Python code modules.
          </p>
        </div>
      </div>

      {/* Real-time MySQL Schema Stats Bento Bar */}
      <div className="mx-6 mt-4 grid grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-3.5 flex flex-col gap-1 relative overflow-hidden backdrop-blur-sm hover:border-indigo-500/20 transition-all duration-300 shadow-sm group">
          <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-500/5 rounded-full blur-xl pointer-events-none transition-all duration-300 group-hover:bg-indigo-500/10" />
          <span className="text-[9px] font-mono font-semibold text-slate-500 tracking-wider uppercase">TABLE: students</span>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="text-2xl font-bold font-mono text-indigo-400 tracking-tight">{students.length}</span>
            <span className="text-[11px] text-slate-400 font-sans">registered row{students.length !== 1 ? "s" : ""}</span>
          </div>
        </div>

        <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-3.5 flex flex-col gap-1 relative overflow-hidden backdrop-blur-sm hover:border-emerald-500/20 transition-all duration-300 shadow-sm group">
          <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/5 rounded-full blur-xl pointer-events-none transition-all duration-300 group-hover:bg-emerald-500/10" />
          <span className="text-[9px] font-mono font-semibold text-slate-500 tracking-wider uppercase">TABLE: mood_logs</span>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="text-2xl font-bold font-mono text-emerald-400 tracking-tight">{moodLogs.length}</span>
            <span className="text-[11px] text-slate-400 font-sans">emotional log{moodLogs.length !== 1 ? "s" : ""}</span>
          </div>
        </div>

        <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-3.5 flex flex-col gap-1 relative overflow-hidden backdrop-blur-sm hover:border-amber-500/20 transition-all duration-300 shadow-sm group">
          <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/5 rounded-full blur-xl pointer-events-none transition-all duration-300 group-hover:bg-amber-500/10" />
          <span className="text-[9px] font-mono font-semibold text-slate-500 tracking-wider uppercase">TABLE: study_plans</span>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="text-2xl font-bold font-mono text-amber-500 tracking-tight">{studyPlans.length}</span>
            <span className="text-[11px] text-slate-400 font-sans">AI plan segment{studyPlans.length !== 1 ? "s" : ""}</span>
          </div>
        </div>

        <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-3.5 flex flex-col gap-1 relative overflow-hidden backdrop-blur-sm hover:border-pink-500/20 transition-all duration-300 shadow-sm group">
          <div className="absolute top-0 right-0 w-20 h-20 bg-pink-500/5 rounded-full blur-xl pointer-events-none transition-all duration-300 group-hover:bg-pink-500/10" />
          <span className="text-[9px] font-mono font-semibold text-slate-500 tracking-wider uppercase">TABLE: performance</span>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="text-2xl font-bold font-mono text-pink-400 tracking-tight">{performance.length}</span>
            <span className="text-[11px] text-slate-400 font-sans">logged stats record{performance.length !== 1 ? "s" : ""}</span>
          </div>
        </div>
      </div>

      {/* Sophisticated micro-toast feedback for copy operations */}
      {copyFeedback && (
        <div className="fixed bottom-6 right-6 bg-slate-900 border border-emerald-500/30 text-emerald-400 px-4 py-3 rounded-xl shadow-2xl z-50 font-mono text-xs flex items-center gap-2.5 transition-all duration-300 select-none animate-shimmer scale-100">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>Copied <b className="text-white">{copyFeedback}</b> to clipboard!</span>
        </div>
      )}

      {/* Main Grid Workspace */}
      <main className="flex-1 p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0 overflow-auto">
        {/* Left Column: Terminal (takes 5 cols of grid) */}
        <div className="lg:col-span-5 flex flex-col h-full min-h-[460px] lg:min-h-0">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono font-bold text-slate-400 flex items-center gap-1.5">
              <Terminal size={13} className="text-amber-400" /> CLI TERMINAL SIMULATOR
            </span>
            <button
              onClick={() => {
                // Re-trigger standard terminal main setup by reloading or setting logged session clean
                setLoggedStudent(null);
                window.location.reload();
              }}
              title="Re-initialize CLI and database"
              className="text-[10px] font-mono text-slate-500 hover:text-slate-300 transition-colors"
            >
              Reboot CLI Session
            </button>
          </div>
          <div className="flex-1">
            <TerminalSimulator
              students={students}
              moodLogs={moodLogs}
              studyPlans={studyPlans}
              performance={performance}
              onChangeData={{
                registerStudent,
                addMoodLog,
                generatePlans,
                addPerformance
              }}
              loggedStudent={loggedStudent}
              setLoggedStudent={setLoggedStudent}
            />
          </div>
        </div>

        {/* Right Column: Code viewer & Live Database Tabber (takes 7 cols) */}
        <div className="lg:col-span-7 flex flex-col h-full min-h-[460px] lg:min-h-0">
          {/* Sub-tabs header */}
          <div className="flex items-center justify-between mb-2 shrink-0">
            <span className="text-xs font-mono font-bold text-slate-400 flex items-center gap-1.5">
              <BookOpen size={13} className="text-indigo-400" /> CODEBASE & ARCHITECTURE ENGINE
            </span>

            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5">
              <button
                onClick={() => setRightPanelTab("code")}
                className={`flex items-center gap-1 px-3 py-1 text-[11px] font-semibold font-mono rounded-md transition-all ${
                  rightPanelTab === "code"
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Code2 size={12} />
                <span>Source Code (.py/.sql)</span>
              </button>

              <button
                onClick={() => setRightPanelTab("database")}
                className={`flex items-center gap-1 px-3 py-1 text-[11px] font-semibold font-mono rounded-md transition-all ${
                  rightPanelTab === "database"
                    ? "bg-amber-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Database size={12} />
                <span>MySQL Tables live</span>
              </button>
            </div>
          </div>

          {/* Active right-hand display panels */}
          <div className="flex-1 min-h-0">
            {rightPanelTab === "code" ? (
              <CodeExplorer />
            ) : (
              <DatabaseViewer
                students={students}
                moodLogs={moodLogs}
                studyPlans={studyPlans}
                performance={performance}
                onResetSeed={handleResetSeed}
              />
            )}
          </div>
        </div>
      </main>

      {/* Footer System Line */}
      <footer className="bg-slate-950 border-t border-slate-900/60 py-3.5 px-6 shrink-0 flex flex-col sm:flex-row items-center justify-between gap-3 font-mono text-[10px] text-slate-600">
        <div>
          <span>Emotion-Based Study Planner Workspace | 2026 Sandbox Standard</span>
        </div>
        <div className="flex items-center gap-4">
          <span>Python Version: 3.10.8</span>
          <span>mysql-connector-python: 8.0.32</span>
          <span>matplotlib: 3.6.2</span>
        </div>
      </footer>
    </div>
  );
}
