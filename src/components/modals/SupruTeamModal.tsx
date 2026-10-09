import React from 'react';
import { 
  X, 
  Bot, 
  Code2, 
  Terminal, 
  MessageSquare, 
  GitBranch, 
  Wand2, 
  Film, 
  Sparkles, 
  ShieldCheck, 
  Cpu, 
  ArrowRight,
  Zap,
  CheckCircle2,
  Workflow
} from 'lucide-react';
import { WorkspaceView } from '../../types/workbench';
import { soundFx } from '../../utils/audio';

interface SupruTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAgent: (view: WorkspaceView) => void;
  onOpenImageStudio: () => void;
  onOpenVeoStudio: () => void;
}

export const SupruTeamModal: React.FC<SupruTeamModalProps> = ({
  isOpen,
  onClose,
  onSelectAgent,
  onOpenImageStudio,
  onOpenVeoStudio,
}) => {
  if (!isOpen) return null;

  const team = [
    {
      id: 'generative',
      name: 'Supru Generative Studio',
      role: 'Genesis Protocol & 4D World-State Synthesis',
      badge: 'Genesis Engine',
      desc: 'Manifests 4D world-states, hardware-native liquid canvas physics, 8K visuals, Veo 3.1 motion tracking, neural audio soundscapes, and atomic UI component genesis directly to metal.',
      icon: <Sparkles size={20} className="text-pink-400" />,
      color: 'border-pink-500/40 bg-pink-500/10 text-pink-300',
      action: () => {
        onSelectAgent('generative');
        onClose();
      },
      capabilities: ['4D World-State Synthesis', 'Direct-to-Metal 120 FPS', 'Atomic UI Manipulator', 'Neural Audio & Veo Motion'],
    },
    {
      id: 'orchestrator',
      name: 'Supru Orchestrator',
      role: 'Project Architect, Tool Dispatcher & Bug Triage Engine',
      badge: 'Token & Bug Engine',
      desc: 'Manages small to multi-complex projects, interactive tool calling (linting, test suites, AST parsing), dynamic multi-model arranging, and context window token rearrangement to eliminate token wastage. Self-heals bugs with tool diagnosis.',
      icon: <Workflow size={20} className="text-amber-400" />,
      color: 'border-amber-500/40 bg-amber-500/10 text-amber-300',
      action: () => onSelectAgent('orchestrator'),
      capabilities: ['Small to Multi-Complex Projects', 'Tool Calling Facility', 'Token Rearrangement (<54% Wastage)', 'Self-Healing Bug Handler'],
    },
    {
      id: 'hunter',
      name: 'Supru Hunter',
      role: 'Autonomous Headless Agent',
      badge: 'Tier 1 Agent',
      desc: 'Top-class autonomous headless agent. End-to-end capabilities exceeding GitHub Copilot, Hermes Agent, Claude Code & OpenRouter: deep codebase research, architectural design, multi-file synthesis, and self-testing verification.',
      icon: <Bot size={20} className="text-amber-400" />,
      color: 'border-amber-500/40 bg-amber-500/10 text-amber-300',
      action: () => onSelectAgent('agent'),
      capabilities: ['Deep Codebase Research', 'Autonomous End-to-End Delivery', 'Multi-File Refactoring', 'Test Suite Generation'],
    },
    {
      id: 'code',
      name: 'Supru Code',
      role: 'Principal Multi-Language Code Editor',
      badge: 'IDE Workspace',
      desc: 'Full-spectrum developer workspace supporting TypeScript, Python, Rust, Go, SQL, Bash, and HTML. Features instant terminal execution, split coding spaces, right-side assistant dock (Hunter + Cat), and AI refactoring.',
      icon: <Code2 size={20} className="text-emerald-400" />,
      color: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300',
      action: () => onSelectAgent('editor'),
      capabilities: ['11+ Languages', 'Window Rearranging', 'Docked Hunter & Cat', 'Live Run in CLI'],
    },
    {
      id: 'cli',
      name: 'Supru CLI',
      role: 'Terminal Shell Commander & System Runner',
      badge: 'Shell Engine',
      desc: 'High-speed interactive developer shell. Executes local Linux commands, git operations, node/python scripts, and agent pipelines with exit code metrics and history buffer.',
      icon: <Terminal size={20} className="text-sky-400" />,
      color: 'border-sky-500/40 bg-sky-500/10 text-sky-300',
      action: () => onSelectAgent('terminal'),
      capabilities: ['Full Bash Execution', 'Command History (↑/↓)', 'Sub-15ms Latency', 'AI Model Diagnostic'],
    },
    {
      id: 'chat',
      name: 'Supru Chat',
      role: 'Generative AI Partner & Creative Mastermind',
      badge: 'Feline Cortex',
      desc: 'Conversational powerhouse featuring feline personality modes, live SSE streaming, markdown synthesis, mathematical and quantum computing breakdowns.',
      icon: <MessageSquare size={20} className="text-amber-400" />,
      color: 'border-amber-500/40 bg-amber-500/10 text-amber-300',
      action: () => onSelectAgent('chat'),
      capabilities: ['Streaming Thoughts', 'Persona Tuning', 'Image Understanding', 'Feline Wit & Logic'],
    },
    {
      id: 'git',
      name: 'Supru Git',
      role: 'Repository Intelligence & Branch Inspector',
      badge: 'Version Control',
      desc: 'Connects with GitHub repositories, explores directory trees, inspects file diffs, and feeds repository code directly into Supru Hunter, Supru Code, or Supru Orchestrator.',
      icon: <GitBranch size={20} className="text-purple-400" />,
      color: 'border-purple-500/40 bg-purple-500/10 text-purple-300',
      action: () => onSelectAgent('github'),
      capabilities: ['GitHub REST Sync', 'File Tree Browser', 'PAT Support', 'One-Click Code Import'],
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-4 backdrop-blur-md">
      <div className="relative w-full max-w-3xl overflow-hidden rounded-3xl border border-amber-500/30 bg-[#101017] p-5 sm:p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#20202e] pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
              <Zap size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Supru Team Squad</h3>
                <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-300 border border-amber-500/30">
                  Autonomous Studio
                </span>
              </div>
              <p className="text-xs text-gray-400">
                End-to-end engineering, research, editing, CLI, and version control agents
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-gray-400 hover:bg-white/10 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        {/* Squad Cards Grid */}
        <div className="mt-4 max-h-[65vh] overflow-y-auto pr-1 space-y-2.5">
          {team.map((member) => (
            <div
              key={member.id}
              className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-2xl border border-[#212130] bg-[#14141f] p-3.5 hover:border-amber-500/40 hover:bg-[#181825] transition-all"
            >
              <div className="flex items-start gap-3">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${member.color}`}>
                  {member.icon}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-white">{member.name}</span>
                    <span className="text-[10px] font-medium text-amber-400/90">{member.role}</span>
                    <span className="rounded bg-[#1f1f2d] px-1.5 py-0.2 text-[9px] text-gray-400 font-mono">
                      {member.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-300 mt-1 leading-relaxed">{member.desc}</p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {member.capabilities.map((cap, i) => (
                      <span
                        key={i}
                        className="rounded bg-[#1c1c2a] px-2 py-0.5 text-[9.5px] text-gray-400 border border-[#26263a]"
                      >
                        ✓ {cap}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  soundFx.playClick();
                  member.action();
                  onClose();
                }}
                className="shrink-0 flex items-center gap-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 px-3 py-1.5 text-xs font-bold text-amber-300 hover:bg-amber-500 hover:text-neutral-950 transition-all self-end sm:self-center"
              >
                <span>Launch</span>
                <ArrowRight size={13} />
              </button>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-4 flex items-center justify-between border-t border-[#20202e] pt-3 text-xs text-gray-400">
          <div className="flex items-center gap-2 text-[11px]">
            <ShieldCheck size={14} className="text-emerald-400" />
            <span>All agents operate seamlessly with Cloud or Localhost AI models</span>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl bg-[#20202e] px-4 py-1.5 text-xs font-semibold text-gray-200 hover:bg-[#28283a] hover:text-white"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
