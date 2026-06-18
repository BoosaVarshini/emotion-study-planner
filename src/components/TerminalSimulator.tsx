import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { StudentRow, MoodLogRow, StudyPlanRow, PerformanceRow } from "../types";
import { Terminal, CornerDownLeft, Play, AlertCircle, RefreshCw, BarChart2, FileLineChart } from "lucide-react";

interface TerminalSimulatorProps {
  students: StudentRow[];
  moodLogs: MoodLogRow[];
  studyPlans: StudyPlanRow[];
  performance: PerformanceRow[];
  onChangeData: {
    registerStudent: (name: string, email: string, pass: string) => StudentRow | string;
    addMoodLog: (student_id: number, mood: string, energy: number, hours: number) => string;
    generatePlans: (student_id: number, mood: string, energy: number, hours: number, subjects: string[]) => StudyPlanRow[];
    addPerformance: (student_id: number, planned: number, actual: number, tasks: number) => { comp_pct: number; prod_score: number };
  };
  loggedStudent: StudentRow | null;
  setLoggedStudent: (stud: StudentRow | null) => void;
}

type TerminalState =
  | "MENU"
  | "REG_NAME"
  | "REG_EMAIL"
  | "REG_PASS"
  | "LOGIN_EMAIL"
  | "LOGIN_PASS"
  | "MOOD_SELECT"
  | "MOOD_ENERGY"
  | "MOOD_HOURS"
  | "PLAN_SUBJECTS"
  | "PERF_ACTUAL"
  | "PERF_TASKS"
  | "EXPORT_CHOOSE"
  | "SEARCH_CHOOSE"
  | "SEARCH_VAL_DATE"
  | "SEARCH_VAL_MOOD"
  | "SEARCH_VAL_STUDENT";

export default function TerminalSimulator({
  students,
  moodLogs,
  studyPlans,
  performance,
  onChangeData,
  loggedStudent,
  setLoggedStudent
}: TerminalSimulatorProps) {
  // Terminal history lines
  const [history, setHistory] = useState<string[]>([
    "=== INITIALIZING EMOTION-BASED STUDY PLANNER DATABASE ===",
    "[Database] Connected securely to MySQL host='localhost' root@localhost",
    "Loading schemas: students, mood_logs, study_plans, performance... Loaded successfully.",
    "",
    "============================================================",
    "             EMOTION-BASED STUDY PLANNER MAIN MENU",
    "============================================================",
    " [No Active Academic Session - Register / Login to Start]",
    "------------------------------------------------------------",
    "  1.  Register New Student",
    "  2.  Student Login",
    "  3.  Assessment of Daily Mood",
    "  4.  Trigger AI Study Plan Generator",
    "  5.  View Today's Operational Study Plan",
    "  6.  Review Historic Mood Logs",
    "  7.  Track Practical Study Performance",
    "  8.  Open Analytics Dashboard (Matplotlib Progress)",
    "  9.  Export Study Report (TXT & CSV Formats)",
    "  10. Search Custom Academic Log Parameters",
    "  11. Exit Program Workspace",
    "============================================================",
  ]);

  const [currentInput, setCurrentInput] = useState("");
  const [terminalState, setTerminalState] = useState<TerminalState>("MENU");

  // Temporary buffers of input states
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [loginEmail, setLoginEmail] = useState("");
  const [moodChoice, setMoodChoice] = useState("");
  const [moodEnergy, setMoodEnergy] = useState<number>(5);
  const [searchChoice, setSearchChoice] = useState("");

  // Matplotlib figure display control
  const [showFigure, setShowFigure] = useState(false);

  const historyEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    historyEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history]);

  const focusInput = () => {
    inputRef.current?.focus();
  };

  useEffect(() => {
    focusInput();
  }, []);

  const appendToHistory = (lines: string | string[]) => {
    if (Array.isArray(lines)) {
      setHistory((prev) => [...prev, ...lines]);
    } else {
      setHistory((prev) => [...prev, lines]);
    }
  };

  const showMenu = (customUser: StudentRow | null = loggedStudent) => {
    const userLine = customUser
      ? ` Logged in as: ${customUser.name} (${customUser.email})`
      : " [No Active Academic Session - Register / Login to Start]";

    appendToHistory([
      "",
      "============================================================",
      "             EMOTION-BASED STUDY PLANNER MAIN MENU",
      "============================================================",
      userLine,
      "------------------------------------------------------------",
      "  1.  Register New Student",
      "  2.  Student Login",
      "  3.  Assessment of Daily Mood",
      "  4.  Trigger AI Study Plan Generator",
      "  5.  View Today's Operational Study Plan",
      "  6.  Review Historic Mood Logs",
      "  7.  Track Practical Study Performance",
      "  8.  Open Analytics Dashboard (Matplotlib Progress)",
      "  9.  Export Study Report (TXT & CSV Formats)",
      "  10. Search Custom Academic Log Parameters",
      "  11. Exit Program Workspace",
      "============================================================",
    ]);
    setTerminalState("MENU");
  };

  const triggerExportDownload = (type: "txt" | "csv") => {
    if (!loggedStudent) return;
    const userLogs = moodLogs.filter((m) => m.student_id === loggedStudent.student_id);
    const userPerf = performance.filter((p) => p.student_id === loggedStudent.student_id);

    let content = "";
    let mimeType = "text/plain";
    let extension = "txt";

    if (type === "txt") {
      content += `==================================================\n`;
      content += `       STUDENT REPORT: ${loggedStudent.name.toUpperCase()}\n`;
      content += `       Email: ${loggedStudent.email}\n`;
      content += `==================================================\n\n`;
      content += `--- 1. MOOD & COGNITIVE CHECKS HISTORIC LOGS ---\n`;
      userLogs.forEach((l) => {
        content += ` Date: ${l.log_date} | Mood: ${l.mood} | Energy: ${l.energy_level} | Target Study: ${l.study_hours} hrs\n`;
      });
      content += `\n--- 2. EXPERIMENTAL STUDY PERFORMANCE ---\n`;
      userPerf.forEach((p) => {
        content += ` Date: ${p.entry_date} | Goals: ${p.planned_hours}h | Done: ${p.actual_hours}h | Tasks: ${p.tasks_completed} | Completion: ${p.completion_percentage}%\n`;
      });
      mimeType = "text/plain";
      extension = "txt";
    } else {
      content += `"Date","Expected Target Hours","Actual Study Outputs","Tasks Quantified","Completion Index Percentage"\n`;
      userPerf.forEach((p) => {
        content += `"${p.entry_date}",${p.planned_hours},${p.actual_hours},${p.tasks_completed},"${p.completion_percentage}%"\n`;
      });
      mimeType = "text/csv";
      extension = "csv";
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `student_${loggedStudent.student_id}_report.${extension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCommandSubmit = () => {
    const input = currentInput.trim();
    setCurrentInput("");

    // Output typed input instantly to preserve raw terminal emulation trace
    appendToHistory(`Enter option sequence selector (1-11): ${input}`);

    if (terminalState === "MENU") {
      if (input === "1") {
        appendToHistory(["\n--- New Student Registration Portal ---", "Enter Student Full Name:"]);
        setTerminalState("REG_NAME");
      } else if (input === "2") {
        appendToHistory(["\n--- Log Into Active Account ---", "Enter Registered Email:"]);
        setTerminalState("LOGIN_EMAIL");
      } else if (input === "3") {
        // Daily Mood Assessment
        if (!loggedStudent) {
          appendToHistory([
            "\n[Validation Refused] Error encountered: Access Blocked: Login to log daily mood logs.",
          ]);
          showMenu();
          return;
        }
        appendToHistory([
          "\n--- Daily Emotional Health State Check ---",
          "Options: [Happy, Motivated, Tired, Stressed, Anxious, Bored]",
          "Select current predominant emotion:",
        ]);
        setTerminalState("MOOD_SELECT");
      } else if (input === "4") {
        // Generate Study Plan
        if (!loggedStudent) {
          appendToHistory([
            "\n[Validation Refused] Error encountered: Access Blocked: Login to initiate the planner.",
          ]);
          showMenu();
          return;
        }

        // Pull latest registered mood check
        const logs = moodLogs.filter((m) => m.student_id === loggedStudent.student_id);
        if (logs.length === 0) {
          appendToHistory([
            "\n[Validation Refused] Error encountered: Pre-requisite missing: Check in daily emotional state logs first (Option 3)!",
          ]);
          showMenu();
          return;
        }

        const latestLog = logs[logs.length - 1];
        appendToHistory([
          "\n--- AI Algorithm-Based Schedule Formulation ---",
          `Current Mood evaluated: ${latestLog.mood} | Energy index: ${latestLog.energy_level}`,
          `Study Time budget checked: ${latestLog.study_hours} hours.`,
          "Enter subject titles separated by commas (e.g. Python, Math, DSA):",
        ]);
        setTerminalState("PLAN_SUBJECTS");
      } else if (input === "5") {
        // View Today's Operational Study Plan
        if (!loggedStudent) {
          appendToHistory([
            "\n[Validation Refused] Error encountered: Access Blocked: Login to read structured agendas.",
          ]);
          showMenu();
          return;
        }

        const plans = studyPlans.filter((s) => s.student_id === loggedStudent.student_id);
        appendToHistory(["\n--- Completed Target Study Agenda Today ---"]);
        if (plans.length === 0) {
          appendToHistory("No study schedules formulated. Proceed with AI logic trigger first (Option 4).");
        } else {
          plans.forEach((p, idx) => {
            appendToHistory([
              `  ${idx + 1}. Code Task: ${p.subject}`,
              `     Time Segment allocated: ${p.duration} minutes | Date: ${p.plan_date}`,
            ]);
          });
        }
        showMenu();
      } else if (input === "6") {
        // View Mood History
        if (!loggedStudent) {
          appendToHistory([
            "\n[Validation Refused] Error encountered: Access Blocked: Login credentials required.",
          ]);
          showMenu();
          return;
        }

        const logs = moodLogs.filter((m) => m.student_id === loggedStudent.student_id);
        appendToHistory(["\n--- Historical Mood Checkpoints logs ---"]);
        if (logs.length === 0) {
          appendToHistory("No historical logs register yet on your portal identifier.");
        } else {
          appendToHistory([
            "-----------------------------------------------------------------",
            `${"Date".padEnd(15)} | ${"Mood Index".padEnd(15)} | ${"Energy index".padEnd(12)} | ${"Time Allocated".padEnd(15)}`,
            "-----------------------------------------------------------------",
          ]);
          logs.forEach((h) => {
            appendToHistory(
              `${h.log_date.padEnd(15)} | ${h.mood.padEnd(15)} | ${h.energy_level.toString().padEnd(12)} | ${h.study_hours.toFixed(1).padEnd(15)} hrs`
            );
          });
          appendToHistory("-----------------------------------------------------------------");
        }
        showMenu();
      } else if (input === "7") {
        // Track Performance
        if (!loggedStudent) {
          appendToHistory([
            "\n[Validation Refused] Error encountered: Access Blocked: Login account credentials needed.",
          ]);
          showMenu();
          return;
        }

        const plans = studyPlans.filter((s) => s.student_id === loggedStudent.student_id);
        const totalDuration = plans.reduce((accum, curr) => accum + curr.duration, 0);

        if (totalDuration === 0) {
          appendToHistory([
            "\n[Validation Refused] Error encountered: No matching study records exist for today. Re-schedule first!",
          ]);
          showMenu();
          return;
        }

        const plannedHours = (totalDuration / 60.0).toFixed(2);
        appendToHistory([
          "\n--- Performance Tracker Interface ---",
          `Your calculated active studies goal today: ${plannedHours} hours.`,
          "Input true active study time spent:",
        ]);
        setTerminalState("PERF_ACTUAL");
      } else if (input === "8") {
        // Analytics Dashboard
        if (!loggedStudent) {
          appendToHistory([
            "\n[Validation Refused] Error encountered: Access Blocked: Account authentication active mandatory.",
          ]);
          showMenu();
          return;
        }

        const userLogs = moodLogs.filter((m) => m.student_id === loggedStudent.student_id);
        const userPerf = performance.filter((p) => p.student_id === loggedStudent.student_id);

        appendToHistory(["\n--- Compiling Dashboard Multi-Schema Statistics ---"]);

        if (userPerf.length === 0) {
          appendToHistory([
            " No performance records logged yet. Track historical days in Option 7 first!",
          ]);
          showMenu();
          return;
        }

        const totalHrs = userPerf.reduce((acc, curr) => acc + curr.actual_hours, 0);
        const avgComp = userPerf.reduce((acc, curr) => acc + curr.completion_percentage, 0) / userPerf.length;

        // calculate most frequent mood
        const moodCounts: Record<string, number> = {};
        userLogs.forEach((l) => {
          moodCounts[l.mood] = (moodCounts[l.mood] || 0) + 1;
        });
        let primeMood = "No Log";
        let maxCount = 0;
        Object.entries(moodCounts).forEach(([m, count]) => {
          if (count > maxCount) {
            maxCount = count;
            primeMood = m;
          }
        });

        const consistencyScore = Math.min(userPerf.length * 20, 100);

        appendToHistory([
          "--------------------------------------------------",
          ` Cumulative Study Output Logging: ${totalHrs.toFixed(1)} hrs`,
          ` Predominant Emotional Factor:    ${primeMood}`,
          ` Average Session Completion Rate:  ${avgComp.toFixed(2)}%`,
          ` Workspace Consistency Coefficient: ${consistencyScore}/100`,
          ` Total Logged Study Days:          ${userPerf.length}`,
          "--------------------------------------------------",
          "\n[Matplotlib] Generating analytical charting window... Plotted lines built correctly.",
        ]);

        // Pop up the Matplotlib window simulation!
        setShowFigure(true);
        showMenu();
      } else if (input === "9") {
        // Export Report
        if (!loggedStudent) {
          appendToHistory([
            "\n[Validation Refused] Error encountered: Access Blocked: Active authentication required.",
          ]);
          showMenu();
          return;
        }

        appendToHistory([
          "\n--- Data Core File Exporter Workspace ---",
          "1. Text file report standard (.txt)",
          "2. CSV sheet tables standard (.csv)",
          "Choose file specification index (1-2):",
        ]);
        setTerminalState("EXPORT_CHOOSE");
      } else if (input === "10") {
        // Search Records
        if (!loggedStudent) {
          appendToHistory([
            "\n[Validation Refused] Error encountered: Access Blocked: Security credential login check needed.",
          ]);
          showMenu();
          return;
        }

        appendToHistory([
          "\n--- Query Filtering and Deep Search Module ---",
          " 1. Filter metrics by exact log Calendar Date",
          " 2. Filter logs by localized Mood emotion factor",
          " 3. Filter by Student Database ID reference code",
          "Select filtering parameter index (1-3):",
        ]);
        setTerminalState("SEARCH_CHOOSE");
      } else if (input === "11") {
        appendToHistory([
          "\nClosing Study Simulator Session context. Remain consistent and stay mindful!",
          "System offline.",
        ]);
        // Allow resetting console
        setTimeout(() => {
          setHistory([
            "Terminal Console reset. Ready to launch.",
            "Type 'python main.py' to run the Study Planner application.",
          ]);
        }, 1200);
      } else if (input.toLowerCase() === "python main.py") {
        setHistory([
          "=== INITIALIZING EMOTION-BASED STUDY PLANNER DATABASE ===",
          "[Database] Connected securely to MySQL host='localhost' root@localhost",
          "Loading schemas: students, mood_logs, study_plans, performance... Loaded successfully.",
        ]);
        showMenu(null);
        setLoggedStudent(null);
      } else {
        appendToHistory([
          `\n[Command Warning] Option '${input}' not mapped inside simulation workspace.`,
          "Choose 1-11 to browse functions or enter 'python main.py' to reset.",
        ]);
      }
    } else {
      // Sub-state machine handling
      handleSubState(input);
    }
  };

  const handleSubState = (input: string) => {
    switch (terminalState) {
      case "REG_NAME":
        if (!input) {
          appendToHistory([
            "\n[Validation Refused] Error encountered: Registration fields cannot be left empty.",
          ]);
          showMenu();
          return;
        }
        setRegName(input);
        appendToHistory(["Enter Academic Email Domain:"]);
        setTerminalState("REG_EMAIL");
        break;

      case "REG_EMAIL":
        if (!input) {
          appendToHistory([
            "\n[Validation Refused] Error encountered: Registration fields cannot be left empty.",
          ]);
          showMenu();
          return;
        }
        // Verify unique email
        const exists = students.find((s) => s.email.toLowerCase() === input.toLowerCase());
        if (exists) {
          appendToHistory([
            `\n[Validation Refused] Error encountered: Email domain '${input}' is already registered.`,
          ]);
          showMenu();
          return;
        }
        setRegEmail(input);
        appendToHistory(["Enter Security Password value:"]);
        setTerminalState("REG_PASS");
        break;

      case "REG_PASS":
        if (!input) {
          appendToHistory([
            "\n[Validation Refused] Error encountered: Registration fields cannot be left empty.",
          ]);
          showMenu();
          return;
        }
        // Commit to database
        const result = onChangeData.registerStudent(regName, regEmail, input);
        if (typeof result === "string") {
          appendToHistory(`\n[DB Error] ${result}`);
        } else {
          appendToHistory([
            `\n[Success] Registration successful! Welcome ${result.name}. You can now login.`,
          ]);
        }
        showMenu();
        break;

      case "LOGIN_EMAIL":
        if (!input) {
          appendToHistory([
            "\n[Validation Refused] Error encountered: Email and password fields cannot be empty.",
          ]);
          showMenu();
          return;
        }
        setLoginEmail(input);
        appendToHistory(["Enter Account Password:"]);
        setTerminalState("LOGIN_PASS");
        break;

      case "LOGIN_PASS":
        if (!input) {
          appendToHistory([
            "\n[Validation Refused] Error encountered: Email and password fields cannot be empty.",
          ]);
          showMenu();
          return;
        }
        // Check database
        const user = students.find(
          (s) => s.email.toLowerCase() === loginEmail.toLowerCase() && s.password_hash === input
        );
        if (user) {
          setLoggedStudent(user);
          appendToHistory([
            `\n[Success] Credentials confirmed! Account unlocked. Welcome back, ${user.name}!`,
          ]);
          showMenu(user);
        } else {
          appendToHistory([
            "\n[Validation Refused] Error encountered: Credentials mismatch: Invalid email or incorrect password.",
          ]);
          showMenu();
        }
        break;

      case "MOOD_SELECT": {
        const validMoods = ["Happy", "Motivated", "Tired", "Stressed", "Anxious", "Bored"];
        const mood = input.trim().charAt(0).toUpperCase() + input.trim().slice(1).toLowerCase();
        if (!validMoods.includes(mood)) {
          appendToHistory([
            `\n[Validation Refused] Error: Invalid mood selection. Must navigate: ${validMoods.join(", ")}`,
          ]);
          showMenu();
          return;
        }
        setMoodChoice(mood);
        appendToHistory(["Scale physical energy intensity level (1-10):"]);
        setTerminalState("MOOD_ENERGY");
        break;
      }

      case "MOOD_ENERGY": {
        const energy = parseInt(input, 10);
        if (isNaN(energy) || energy < 1 || energy > 10) {
          appendToHistory([
            "\n[Validation Refused] Error: Energy spectrum must fall inside [1 - 10] range.",
          ]);
          showMenu();
          return;
        }
        setMoodEnergy(energy);
        appendToHistory(["List cumulative hours target available (e.g. 3.5):"]);
        setTerminalState("MOOD_HOURS");
        break;
      }

      case "MOOD_HOURS": {
        const hours = parseFloat(input);
        if (isNaN(hours) || hours <= 0 || hours > 24) {
          appendToHistory([
            "\n[Validation Refused] Error: Intelligent study hours must be greater than 0 and fit within a single day (24h).",
          ]);
          showMenu();
          return;
        }
        if (loggedStudent) {
          onChangeData.addMoodLog(loggedStudent.student_id, moodChoice, moodEnergy, hours);
          appendToHistory([
            `\n[Success] Daily emotion index recorded securely inside logs on: ${new Date().toISOString().split("T")[0]}`,
          ]);
        }
        showMenu();
        break;
      }

      case "PLAN_SUBJECTS": {
        if (!input || !loggedStudent) {
          appendToHistory(["\n[Validation Refused] Error: You must list target subjects to study."]);
          showMenu();
          return;
        }
        const subjects = input.split(",").map((s) => s.trim()).filter((s) => s.length > 0);
        const latestMoodLog = moodLogs.filter((m) => m.student_id === loggedStudent.student_id).pop();

        if (!latestMoodLog) {
          appendToHistory(["\n[Validation Refused] Exception: Latest mood parameters not resolved."]);
          showMenu();
          return;
        }

        const createdPlans = onChangeData.generatePlans(
          loggedStudent.student_id,
          latestMoodLog.mood,
          latestMoodLog.energy_level,
          latestMoodLog.study_hours,
          subjects
        );

        appendToHistory([
          "\n[Success] Optimized Study Schedule generated successfully! Check contents below:",
          "--------------------------------------------------",
        ]);
        createdPlans.forEach((p) => {
          appendToHistory([
            ` * Subject Module: ${p.subject}`,
            `   Required Session Time: ${p.duration} mins`,
          ]);
        });
        appendToHistory(["--------------------------------------------------"]);
        showMenu();
        break;
      }

      case "PERF_ACTUAL": {
        const actual = parseFloat(input);
        if (isNaN(actual) || actual < 0 || actual > 24) {
          appendToHistory(["\n[Validation Refused] Error: Actual study hours must be in range [0 - 24]."]);
          showMenu();
          return;
        }
        // Save actual reference and prompt tasks completed
        setMoodEnergy(actual); // re-use register state key
        appendToHistory(["Enter metric index representing tasks completed:"]);
        setTerminalState("PERF_TASKS");
        break;
      }

      case "PERF_TASKS": {
        const tasks = parseInt(input, 10);
        if (isNaN(tasks) || tasks < 0) {
          appendToHistory(["\n[Validation Refused] Error: Quantified tasks completed cannot register negative values."]);
          showMenu();
          return;
        }
        if (loggedStudent) {
          const out = onChangeData.addPerformance(loggedStudent.student_id, moodEnergy, moodEnergy, tasks);
          appendToHistory([
            "\n[Success] Performance tracked!",
            ` * Session Completion Rate: ${out.comp_pct}%`,
            ` * Composite Productivity Factor Metric: ${out.prod_score}`,
          ]);
        }
        showMenu();
        break;
      }

      case "EXPORT_CHOOSE":
        if (input === "1") {
          triggerExportDownload("txt");
          appendToHistory([
            "\n[Success] Report compiled and saved securely to localized text repository file",
          ]);
        } else if (input === "2") {
          triggerExportDownload("csv");
          appendToHistory([
            "\n[Success] Performance datasets written into table schema CSV sheets",
          ]);
        } else {
          appendToHistory(["\n[Validation Refused] Option choice unauthorized parsing cancelled."]);
        }
        showMenu();
        break;

      case "SEARCH_CHOOSE":
        setSearchChoice(input);
        if (input === "1") {
          appendToHistory(["Enter target retrieval calendar date (YYYY-MM-DD):"]);
          setTerminalState("SEARCH_VAL_DATE");
        } else if (input === "2") {
          appendToHistory(["Enter keyword mood factor criteria (e.g. Happy, Stressed):"]);
          setTerminalState("SEARCH_VAL_MOOD");
        } else if (input === "3") {
          appendToHistory(["Enter database Student Master ID verification index:"]);
          setTerminalState("SEARCH_VAL_STUDENT");
        } else {
          appendToHistory(["\n[Validation Refused] Filtering parameter choice not registered."]);
          showMenu();
        }
        break;

      case "SEARCH_VAL_DATE": {
        const dateInput = input.trim();
        const records = moodLogs.filter(
          (m) => m.student_id === loggedStudent?.student_id && m.log_date === dateInput
        );
        appendToHistory([`\n--- Found ${records.length} matching relational records inside schema ---`]);
        records.forEach((r, idx) => {
          appendToHistory(
            `  ${idx + 1}. Log Date: ${r.log_date} | Emotional Coefficient: ${r.mood} | Body Energy metrics: ${r.energy_level} | Target Plan time: ${r.study_hours}h`
          );
        });
        showMenu();
        break;
      }

      case "SEARCH_VAL_MOOD": {
        const moodIn = input.trim().toLowerCase();
        const records = moodLogs.filter(
          (m) => m.student_id === loggedStudent?.student_id && m.mood.toLowerCase() === moodIn
        );
        appendToHistory([`\n--- Found ${records.length} matching relational records inside schema ---`]);
        records.forEach((r, idx) => {
          appendToHistory(
            `  ${idx + 1}. Log Date: ${r.log_date} | Emotional Coefficient: ${r.mood} | Body Energy metrics: ${r.energy_level} | Target Plan time: ${r.study_hours}h`
          );
        });
        showMenu();
        break;
      }

      case "SEARCH_VAL_STUDENT": {
        const findId = parseInt(input, 10);
        const matches = moodLogs.filter((m) => m.student_id === findId);
        const refStud = students.find((s) => s.student_id === findId);

        appendToHistory([`\n--- Found ${matches.length} matching relational records inside schema ---`]);
        matches.forEach((r, idx) => {
          appendToHistory(
            `  ${idx + 1}. [Student ID: ${findId}] Student: ${refStud ? refStud.name : "Anonymous"} | Logged: ${r.log_date} | Mood: ${r.mood} | Energy: ${r.energy_level}`
          );
        });
        showMenu();
        break;
      }

      default:
        showMenu();
        break;
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleCommandSubmit();
    }
  };

  // Custom calculation metrics for Matplotlib SVG plotter
  const userPerf = loggedStudent ? performance.filter((p) => p.student_id === loggedStudent.student_id) : [];
  const maxHours = userPerf.length > 0 ? Math.max(...userPerf.map((p) => Math.max(p.planned_hours, p.actual_hours))) : 8;

  return (
    <div className="flex flex-col h-full bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-2xl relative min-h-[460px]">
      {/* Terminal Title Bar */}
      <div className="px-4 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Terminal size={15} className="text-emerald-400 animate-pulse" />
          <span className="font-mono text-xs font-semibold text-slate-300">
            Python Interactive Execution Terminal: Main Session
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/40" />
          <span className="w-3 h-3 rounded-full bg-amber-500/20 border border-amber-500/40" />
          <span className="w-3 h-3 rounded-full bg-emerald-500/20 border border-emerald-500/40" />
        </div>
      </div>

      {/* Simulator terminal output stream */}
      <div
        className="flex-1 overflow-y-auto p-4 font-mono text-xs text-slate-300 space-y-1.5 cursor-text select-text"
        onClick={focusInput}
      >
        {history.map((line, idx) => {
          let textStyle = "text-slate-300";
          if (line.includes("[Success]")) textStyle = "text-emerald-400 font-semibold";
          if (line.includes("[DB Error]") || line.includes("CRITICAL:")) textStyle = "text-rose-400 font-semibold";
          if (line.includes("[Validation Refused]")) textStyle = "text-amber-400 font-semibold";
          if (line.includes("===") || line.includes("---")) textStyle = "text-indigo-400 font-bold";

          return (
            <div key={idx} className={`${textStyle} whitespace-pre-wrap leading-relaxed`}>
              {line}
            </div>
          );
        })}
        <div ref={historyEndRef} />
      </div>

      {/* Interactive Terminal Typing Prompt */}
      <div className="p-3.5 bg-slate-900/60 border-t border-slate-800 flex items-center gap-2">
        <span className="font-mono text-xs text-emerald-400 font-semibold selection:bg-slate-800 select-none">
          {terminalState === "MENU" ? ">>>" : "..."}
        </span>
        <input
          ref={inputRef}
          type="text"
          value={currentInput}
          onChange={(e) => setCurrentInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            terminalState === "MENU"
              ? "Select option (1-11)..."
              : "Provide parameter input details..."
          }
          className="flex-1 bg-transparent font-mono text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-0 focus:border-transparent select-text"
        />
        <button
          onClick={handleCommandSubmit}
          className="p-1 px-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded flex items-center gap-1 cursor-pointer"
        >
          <CornerDownLeft size={10} />
          <span className="text-[10px] font-mono">EXEC</span>
        </button>
      </div>

      {/* Matplotlib Interactive popup Window */}
      {showFigure && loggedStudent && (
        <div className="absolute inset-0 z-50 bg-slate-950/90 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-gray-100 border border-gray-400 rounded-lg shadow-2xl flex flex-col overflow-hidden text-gray-800">
            {/* Real Matplotlib Figure toolbar */}
            <div className="bg-gray-200 border-b border-gray-400 px-3 py-1.5 flex items-center justify-between text-xs font-sans font-normal">
              <span className="flex items-center gap-1.5 font-semibold text-gray-700">
                <FileLineChart size={14} className="text-indigo-600" />
                Figure 1: Study Progress Analytics
              </span>
              <button
                onClick={() => setShowFigure(false)}
                className="text-gray-500 hover:text-gray-900 font-bold px-1.5 hover:bg-gray-300 rounded"
              >
                ✕
              </button>
            </div>

            {/* Matplotlib SVG Graphical render */}
            <div className="p-4 bg-white flex flex-col justify-center items-center flex-1 min-h-[280px]">
              {userPerf.length === 0 ? (
                <div className="text-center text-gray-400 py-10">
                  <AlertCircle className="mx-auto text-amber-500 mb-2" size={32} />
                  <p className="text-sm font-semibold">No Performance Records Recorded</p>
                  <p className="text-xs">Log study sessions first in order to plot.</p>
                </div>
              ) : (
                <div className="w-full">
                  <h4 className="text-center text-sm font-bold text-gray-800 mb-4 font-sans">
                    Academic Weekly Progress Curve (Planned vs Actual Hours)
                  </h4>

                  {/* SVG Bar/Line graph */}
                  <svg viewBox="0 0 450 200" className="w-full h-auto">
                    {/* Gridlines */}
                    <line x1="40" y1="20" x2="430" y2="20" stroke="#f0f0f0" />
                    <line x1="40" y1="60" x2="430" y2="60" stroke="#e0e0e0" strokeDasharray="3,3" />
                    <line x1="40" y1="100" x2="430" y2="100" stroke="#e0e0e0" strokeDasharray="3,3" />
                    <line x1="40" y1="140" x2="430" y2="140" stroke="#e0e0e0" strokeDasharray="3,3" />
                    <line x1="40" y1="170" x2="430" y2="170" stroke="#ccc" />

                    {/* Left/Right Axes titles */}
                    <text x="15" y="100" transform="rotate(-90 15,100)" textAnchor="middle" fontSize="9" fill="#666">
                      Allocated (Hours)
                    </text>

                    {/* Rendering values */}
                    {userPerf.map((p, idx) => {
                      const spacing = 390 / userPerf.length;
                      const x = 55 + idx * spacing;

                      // map points based on range
                      const mapY = (val: number) => 170 - (val / (maxHours + 1)) * 140;

                      const plannedY = mapY(p.planned_hours);
                      const actualY = mapY(p.actual_hours);

                      return (
                        <g key={idx}>
                          {/* Planned Bar */}
                          <rect
                            x={x - 12}
                            y={plannedY}
                            width="10"
                            height={170 - plannedY}
                            fill="#bae6fd"
                            rx="1"
                          />
                          <text x={x - 7} y={plannedY - 4} textAnchor="middle" fontSize="8" fill="#0369a1" fontWeight="bold">
                            {p.planned_hours}h
                          </text>

                          {/* Actual point/circle */}
                          <circle cx={x + 5} cy={actualY} r="4.5" fill="#1e3a8a" stroke="#fff" strokeWidth="1" />
                          <text x={x + 5} y={actualY - 8} textAnchor="middle" fontSize="8" fill="#1e3a8a" fontWeight="bold">
                            {p.actual_hours}h
                          </text>

                          {/* X labels */}
                          <text x={x} y="185" textAnchor="middle" fontSize="8" fill="#444">
                            {p.entry_date.slice(5)}
                          </text>
                        </g>
                      );
                    })}

                    {/* Axis lines */}
                    <line x1="40" y1="20" x2="40" y2="170" stroke="#ccc" />
                  </svg>

                  {/* Graph labels */}
                  <div className="flex justify-center items-center gap-6 mt-4 text-[10px] font-sans">
                    <div className="flex items-center gap-1.5">
                      <span className="w-5 h-2 bg-sky-200 border border-sky-300 inline-block rounded" />
                      <span className="text-gray-600">Planned Goal (Matplotlib Bars)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 bg-blue-900 rounded-full inline-block" />
                      <span className="text-gray-600">Actual Spent (Matplotlib Spline)</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Simulated Matplotlib window statusbar & toolbar */}
            <div className="bg-gray-200 border-t border-gray-300 px-4 py-2 flex items-center justify-between text-[11px] font-mono text-gray-500">
              <div className="flex items-center gap-3">
                <span className="cursor-pointer hover:text-gray-900" title="Home">⌂</span>
                <span className="cursor-pointer hover:text-gray-900" title="Back">←</span>
                <span className="cursor-pointer hover:text-gray-900" title="Forward">→</span>
                <span className="cursor-pointer hover:text-gray-900" title="Pan">✥</span>
                <span className="cursor-pointer hover:text-gray-900" title="Zoom">🔍</span>
              </div>
              <span>x=244.3, y=10.45</span>
            </div>
            
            {/* Action button to dismiss */}
            <div className="bg-white px-4 py-2.5 border-t border-gray-300 flex justify-end gap-2">
              <button
                onClick={() => setShowFigure(false)}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-sans text-xs font-semibold shadow-sm transition"
              >
                Close Figure Window
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
