import { useState } from "react";
import { pythonFiles } from "../data/pythonCode";
import { Code2, Copy, Check, FileCode, FolderClosed, ShieldCheck, Database, Search } from "lucide-react";

export default function CodeExplorer() {
  const [activeFile, setActiveFile] = useState(pythonFiles[1]); // Default to database.py
  const [copied, setCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleCopy = () => {
    navigator.clipboard.writeText(activeFile.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredFiles = pythonFiles.filter(f =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
      {/* Search and Navigation Title */}
      <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-indigo-500/10 text-indigo-400 rounded-lg">
            <Code2 size={20} />
          </div>
          <div>
            <h3 className="font-sans font-semibold text-slate-100 text-sm">Python OOP Source Files</h3>
            <p className="text-xs text-slate-400 font-mono">Structure: Object-Oriented Database Integration</p>
          </div>
        </div>

        {/* File Search */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
          <input
            type="text"
            placeholder="Search files/classes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 text-slate-200 pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-800 focus:outline-none focus:border-indigo-500 transition-colors placeholder:text-slate-500 font-mono"
          />
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar: File Tree */}
        <div className="w-56 sm:w-64 p-3 bg-slate-950/40 border-r border-slate-800 overflow-y-auto flex flex-col gap-4">
          {/* Virtual Database Schema folder */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-bold text-slate-500 tracking-wider uppercase pl-2 font-mono flex items-center gap-1">
              <Database size={10} /> Database Schema
            </span>
            {filteredFiles.filter(f => f.name.endsWith('.sql')).map(f => (
              <button
                key={f.name}
                onClick={() => setActiveFile(f)}
                className={`flex items-center gap-2 px-2.5 py-2 text-xs rounded-lg font-mono text-left transition-all ${
                  activeFile.name === f.name
                    ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                    : "text-slate-400 hover:bg-slate-800/40 hover:text-slate-200 border border-transparent"
                }`}
              >
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                <span className="truncate">{f.name}</span>
              </button>
            ))}
          </div>

          {/* Source Code Files folder */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-bold text-slate-500 tracking-wider uppercase pl-2 font-mono flex items-center gap-1">
              <FolderClosed size={10} /> Python Modules
            </span>
            {filteredFiles.filter(f => f.name.endsWith('.py')).map(f => (
              <button
                key={f.name}
                onClick={() => setActiveFile(f)}
                className={`flex items-center gap-2 px-2.5 py-2 text-xs rounded-lg font-mono text-left transition-all ${
                  activeFile.name === f.name
                    ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                    : "text-slate-400 hover:bg-slate-800/40 hover:text-slate-200 border border-transparent"
                }`}
              >
                <FileCode size={13} className={activeFile.name === f.name ? "text-indigo-400" : "text-slate-500"} />
                <span className="truncate">{f.name}</span>
              </button>
            ))}
          </div>

          {/* Docs folder */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-bold text-slate-500 tracking-wider uppercase pl-2 font-mono flex items-center gap-1">
              <ShieldCheck size={10} /> Documentation
            </span>
            {filteredFiles.filter(f => f.name.endsWith('.txt')).map(f => (
              <button
                key={f.name}
                onClick={() => setActiveFile(f)}
                className={`flex items-center gap-2 px-2.5 py-2 text-xs rounded-lg font-mono text-left transition-all ${
                  activeFile.name === f.name
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    : "text-slate-400 hover:bg-slate-800/40 hover:text-slate-200 border border-transparent"
                }`}
              >
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span className="truncate">{f.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Right Code Display Area */}
        <div className="flex-1 flex flex-col bg-slate-950 overflow-hidden relative">
          <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800 text-xs text-slate-400 font-mono">
            <div className="flex items-center gap-2">
              <span className="text-slate-500">File:</span>
              <span className="text-yellow-500 font-semibold">{activeFile.path}</span>
            </div>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700/50"
              title="Copy to Clipboard"
            >
              {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
              <span>{copied ? "Copied" : "Copy"}</span>
            </button>
          </div>

          {/* Description of active module */}
          <div className="p-3 bg-indigo-950/20 border-b border-slate-800/50 flex items-start gap-2.5">
            <p className="text-[11px] text-slate-300 leading-relaxed">
              <span className="font-bold text-indigo-400 font-mono">Description:</span> {activeFile.description}
            </p>
          </div>

          {/* Code Viewer Panel */}
          <div className="flex-1 overflow-auto p-4 font-mono text-xs leading-relaxed selection:bg-indigo-500/30 selection:text-white">
            <pre className="text-slate-300">
              <code>
                {activeFile.code.split('\n').map((line, idx) => (
                  <div key={idx} className="flex hover:bg-slate-900/30 -mx-4 px-4 py-0.5">
                    <span className="w-8 select-none text-slate-600 text-right pr-4 border-r border-slate-900 mr-4">
                      {idx + 1}
                    </span>
                    <span className="whitespace-pre">{line}</span>
                  </div>
                ))}
              </code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
