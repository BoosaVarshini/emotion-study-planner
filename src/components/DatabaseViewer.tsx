import { StudentRow, MoodLogRow, StudyPlanRow, PerformanceRow } from "../types";
import { useState } from "react";
import { Users, Thermometer, CalendarRange, Medal, RefreshCw, Layers } from "lucide-react";

interface DatabaseViewerProps {
  students: StudentRow[];
  moodLogs: MoodLogRow[];
  studyPlans: StudyPlanRow[];
  performance: PerformanceRow[];
  onResetSeed: () => void;
}

export default function DatabaseViewer({
  students,
  moodLogs,
  studyPlans,
  performance,
  onResetSeed
}: DatabaseViewerProps) {
  const [activeTab, setActiveTab] = useState<"students" | "mood_logs" | "study_plans" | "performance">("students");

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
      {/* Title & seed controls */}
      <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-amber-500/10 text-amber-400 rounded-lg">
            <Layers size={18} />
          </div>
          <div>
            <h3 className="font-sans font-semibold text-slate-100 text-sm flex items-center gap-1.5">
              MySQL DB: <span className="font-mono text-xs text-amber-400 font-bold">emotion_study_planner</span>
            </h3>
            <p className="text-xs text-slate-400 font-mono">Live relational state viewer</p>
          </div>
        </div>
        <button
          onClick={onResetSeed}
          className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 rounded border border-amber-500/20 transition-all font-mono"
          title="Reset database to demo seed data"
        >
          <RefreshCw size={11} />
          <span>Reset/Seed DB</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex bg-slate-950 px-2 pt-2 border-b border-slate-800 overflow-x-auto gap-1">
        <button
          onClick={() => setActiveTab("students")}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-mono font-medium rounded-t-lg transition-colors border-b-2 whitespace-nowrap ${
            activeTab === "students"
              ? "text-indigo-400 border-indigo-500 bg-slate-900"
              : "text-slate-400 border-transparent hover:text-slate-200"
          }`}
        >
          <Users size={13} />
          <span>students ({students.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("mood_logs")}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-mono font-medium rounded-t-lg transition-colors border-b-2 whitespace-nowrap ${
            activeTab === "mood_logs"
              ? "text-indigo-400 border-indigo-500 bg-slate-900"
              : "text-slate-400 border-transparent hover:text-slate-200"
          }`}
        >
          <Thermometer size={13} />
          <span>mood_logs ({moodLogs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("study_plans")}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-mono font-medium rounded-t-lg transition-colors border-b-2 whitespace-nowrap ${
            activeTab === "study_plans"
              ? "text-indigo-400 border-indigo-500 bg-slate-900"
              : "text-slate-400 border-transparent hover:text-slate-200"
          }`}
        >
          <CalendarRange size={13} />
          <span>study_plans ({studyPlans.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("performance")}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-mono font-medium rounded-t-lg transition-colors border-b-2 whitespace-nowrap ${
            activeTab === "performance"
              ? "text-indigo-400 border-indigo-500 bg-slate-900"
              : "text-slate-400 border-transparent hover:text-slate-200"
          }`}
        >
          <Medal size={13} />
          <span>performance ({performance.length})</span>
        </button>
      </div>

      {/* Main Table Content */}
      <div className="flex-1 overflow-auto p-3 bg-slate-900/60">
        {activeTab === "students" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs font-mono text-slate-300">
              <thead>
                <tr className="border-b border-slate-800 text-slate-500 bg-slate-950/40">
                  <th className="py-2.5 px-3">student_id (PK)</th>
                  <th className="py-2.5 px-3">name</th>
                  <th className="py-2.5 px-3">email</th>
                  <th className="py-2.5 px-3">password (hashed)</th>
                </tr>
              </thead>
              <tbody>
                {students.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-500">
                      Empty set (No students registered). Try Option 1 in the terminal!
                    </td>
                  </tr>
                ) : (
                  students.map((stud) => (
                    <tr key={stud.student_id} className="border-b border-slate-800/60 hover:bg-slate-800/20">
                      <td className="py-2.5 px-3 text-indigo-400 font-bold">{stud.student_id}</td>
                      <td className="py-2.5 px-3 text-slate-100 font-sans">{stud.name}</td>
                      <td className="py-2.5 px-3 text-slate-300">{stud.email}</td>
                      <td className="py-2.5 px-3 text-slate-500 truncate max-w-[120px]" title={stud.password_hash}>
                        {stud.password_hash}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "mood_logs" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs font-mono text-slate-300">
              <thead>
                <tr className="border-b border-slate-800 text-slate-500 bg-slate-950/40">
                  <th className="py-2.5 px-3">mood_id (PK)</th>
                  <th className="py-2.5 px-3">student_id (FK)</th>
                  <th className="py-2.5 px-3">mood</th>
                  <th className="py-2.5 px-3">energy_level</th>
                  <th className="py-2.5 px-3">study_hours</th>
                  <th className="py-2.5 px-3">log_date</th>
                </tr>
              </thead>
              <tbody>
                {moodLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500">
                      Empty set (No mood check-ins logged). Try Option 3 in the terminal!
                    </td>
                  </tr>
                ) : (
                  moodLogs.map((log) => (
                    <tr key={log.mood_id} className="border-b border-slate-800/60 hover:bg-slate-800/20">
                      <td className="py-2.5 px-3 text-emerald-400 font-bold">{log.mood_id}</td>
                      <td className="py-2.5 px-3 text-indigo-400">{log.student_id}</td>
                      <td className="py-2.5 px-3">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          log.mood === "Happy" || log.mood === "Motivated"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : log.mood === "Tired" || log.mood === "Stressed" || log.mood === "Anxious"
                            ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                            : "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                        }`}>
                          {log.mood}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-200">{log.energy_level}/10</td>
                      <td className="py-2.5 px-3 text-sky-400 font-bold">{log.study_hours} hrs</td>
                      <td className="py-2.5 px-3 text-slate-400">{log.log_date}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "study_plans" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs font-mono text-slate-300">
              <thead>
                <tr className="border-b border-slate-800 text-slate-500 bg-slate-950/40">
                  <th className="py-2.5 px-3">plan_id (PK)</th>
                  <th className="py-2.5 px-3">student_id (FK)</th>
                  <th className="py-2.5 px-3">subject (Assigned Activity)</th>
                  <th className="py-2.5 px-3">duration</th>
                  <th className="py-2.5 px-3">plan_date</th>
                </tr>
              </thead>
              <tbody>
                {studyPlans.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500">
                      Empty set (No study plans computed). Try Option 4 in terminal!
                    </td>
                  </tr>
                ) : (
                  studyPlans.map((plan) => (
                    <tr key={plan.plan_id} className="border-b border-slate-800/60 hover:bg-slate-800/20">
                      <td className="py-2.5 px-3 text-indigo-400 font-bold">{plan.plan_id}</td>
                      <td className="py-2.5 px-3 text-indigo-400">{plan.student_id}</td>
                      <td className="py-2.5 px-3 text-slate-100 font-sans">{plan.subject}</td>
                      <td className="py-2.5 px-3 text-amber-400 font-bold">{plan.duration} mins</td>
                      <td className="py-2.5 px-3 text-slate-400">{plan.plan_date}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "performance" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs font-mono text-slate-300">
              <thead>
                <tr className="border-b border-slate-800 text-slate-500 bg-slate-950/40">
                  <th className="py-2.5 px-3">perf_id (PK)</th>
                  <th className="py-2.5 px-3">student_id (FK)</th>
                  <th className="py-2.5 px-3">planned</th>
                  <th className="py-2.5 px-3">actual</th>
                  <th className="py-2.5 px-3">tasks_completed</th>
                  <th className="py-2.5 px-3">completion_percentage</th>
                  <th className="py-2.5 px-3">entry_date</th>
                </tr>
              </thead>
              <tbody>
                {performance.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500">
                      Empty set (No performance records logged). Try Option 7 in terminal!
                    </td>
                  </tr>
                ) : (
                  performance.map((perf) => (
                    <tr key={perf.performance_id} className="border-b border-slate-800/60 hover:bg-slate-800/20">
                      <td className="py-2.5 px-3 text-pink-400 font-bold">{perf.performance_id}</td>
                      <td className="py-2.5 px-3 text-indigo-400">{perf.student_id}</td>
                      <td className="py-2.5 px-3 text-slate-400">{perf.planned_hours} hrs</td>
                      <td className="py-2.5 px-3 text-slate-100 font-bold">{perf.actual_hours} hrs</td>
                      <td className="py-2.5 px-3 text-slate-300 font-semibold">{perf.tasks_completed} tasks</td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1.5">
                          <span className={`font-bold ${
                            perf.completion_percentage >= 100
                              ? "text-emerald-400"
                              : perf.completion_percentage >= 70
                              ? "text-indigo-400"
                              : "text-rose-400"
                          }`}>
                            {perf.completion_percentage}%
                          </span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-slate-400">{perf.entry_date}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Database Status Footnote */}
      <div className="p-3 bg-slate-950 text-[11px] text-slate-500 font-mono border-t border-slate-800 flex items-center justify-between">
        <span>MySQL Version: 8.0.32-Community</span>
        <span>InnoDB State: Connected</span>
      </div>
    </div>
  );
}
