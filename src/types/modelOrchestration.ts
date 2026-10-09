/**
 * Editable model pool and multi-agent orchestration contracts.
 * This file defines configuration shape only; provider/agent adapters and UI wiring
 * must validate and enforce these contracts at runtime.
 */

export type ModelProviderKind =
  | 'ollama'
  | 'lmstudio'
  | 'openai-compatible'
  | 'openai'
  | 'anthropic'
  | 'gemini'
  | 'nvidia'
  | 'openrouter'
  | 'custom';

export type ModelCapability =
  | 'text'
  | 'code'
  | 'tool-calling'
  | 'structured-output'
  | 'image-input'
  | 'image-generation'
  | 'audio-input'
  | 'audio-output'
  | 'streaming';

export interface ModelProviderProfile {
  id: string;
  name: string;
  kind: ModelProviderKind;
  /** Base endpoint only; never store a secret in this object. */
  baseUrl?: string;
  /** Reference into OS/Rust-managed credential storage, not the credential itself. */
  credentialRef?: string;
  enabled: boolean;
  isLocal: boolean;
  models: ModelProfile[];
  createdAt: number;
  updatedAt: number;
}

export interface ModelProfile {
  id: string;
  providerId: string;
  displayName: string;
  /** Exact provider model identifier, e.g. an Ollama tag or remote model slug. */
  modelId: string;
  capabilities: ModelCapability[];
  contextWindow?: number;
  maxOutputTokens?: number;
  /** Unknown must remain unknown; do not assume that a free tier is permanent. */
  pricing: {
    status: 'free-local' | 'provider-free-tier' | 'paid' | 'unknown';
    inputPerMillionTokensUsd?: number;
    outputPerMillionTokensUsd?: number;
    notes?: string;
  };
  enabled: boolean;
  lastTestedAt?: number;
  lastTestStatus?: 'passed' | 'failed' | 'untested';
}

export type AgentRuntimeKind =
  | 'supru-native'
  | 'kilo-code'
  | 'claude-code-cli'
  | 'copilot-cli'
  | 'custom-cli'
  | 'remote-agent';

export interface AgentRuntimeProfile {
  id: string;
  name: string;
  kind: AgentRuntimeKind;
  enabled: boolean;
  executablePath?: string;
  endpointUrl?: string;
  modelProfileId?: string;
  workspaceScope: 'current-project' | 'approved-paths';
  timeoutSeconds: number;
  /** Secret references only; never inline credentials. */
  credentialRefs?: string[];
}

export type AgentSeatRole =
  | 'lead'
  | 'researcher'
  | 'planner'
  | 'architect'
  | 'coder'
  | 'reviewer'
  | 'judge'
  | 'ui-specialist'
  | 'security-reviewer'
  | 'documentation'
  | 'custom';

export interface AgentSeat {
  id: string;
  name: string;
  role: AgentSeatRole;
  enabled: boolean;
  modelProfileId?: string;
  runtimeProfileId?: string;
  systemInstructions: string;
  responsibilities: string[];
  rules: string[];
  allowedToolIds: string[];
  approvalRequiredFor: string[];
  temperature?: number;
  maxOutputTokens?: number;
  /** Optional input/context budget for this seat; the Lead should keep handoffs compact. */
  maxInputTokens?: number;
  /** Hard per-seat deadline; timed-out work must be reported, never treated as success. */
  timeoutSeconds?: number;
  /** Files/patterns this seat owns during a task; avoid concurrent write collisions. */
  ownedPaths: string[];
}

export type OrchestrationMode =
  | 'sequential'
  | 'parallel-research'
  | 'parallel-implementation'
  | 'compare'
  | 'generative-pipeline';

export interface OrchestrationSettings {
  mode: OrchestrationMode;
  maxConcurrentModels: number;
  maxRetries: number;
  /** Optional hard wall-clock budget for the whole orchestration run. */
  totalTimeoutSeconds?: number;
  /** Optional aggregate model-token budget; actual usage may be unavailable by provider. */
  totalTokenBudget?: number;
  /** Compact/summarize role handoffs while retaining evidence references. */
  summarizeBetweenRoles?: boolean;
  /** Adaptive scheduling target; the runtime must also obey project/platform hard limits. */
  maxConcurrentAgents?: number;
  /** Hard ceiling for a single agent task, in seconds. */
  maxAgentTimeoutSeconds?: number;
  /** Hard ceiling for the whole orchestration run, in seconds. */
  maxTotalTimeoutSeconds?: number;
  /** Per-role input cap when the provider/runtime supports enforcing it. */
  maxInputTokensPerRole?: number;
  /** Per-role output cap when the provider/runtime supports enforcing it. */
  maxOutputTokensPerRole?: number;
  /** Fraction of the run budget reserved for integration, review, and Judge (0–1). */
  verificationReserveFraction?: number;
  /** Persist a recoverable checkpoint after each meaningful work unit. */
  checkpointAfterEachWorkUnit?: boolean;
  stopOnFirstFailure: boolean;
  requireIndependentReview: boolean;
  checkpointBeforeWrites: boolean;
  pauseForHighRiskActions: boolean;
  /** IDs of configured seats; default team should include three distinct coder roles. */
  seatIds: string[];
}

export type ToolRisk = 'read-only' | 'low' | 'medium' | 'high' | 'critical';
export type PermissionDecision = 'deny' | 'ask' | 'allow';

export interface AgentToolDefinition {
  id: string;
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  risk: ToolRisk;
  defaultPermission: PermissionDecision;
  implemented: boolean;
  requiresNetwork: boolean;
  requiresWorkspaceWrite: boolean;
  timeoutSeconds: number;
}

export interface EditableAITeamConfig {
  schemaVersion: 1;
  providers: ModelProviderProfile[];
  agents: AgentRuntimeProfile[];
  seats: AgentSeat[];
  orchestration: OrchestrationSettings;
  tools: AgentToolDefinition[];
  /** Non-secret UI preferences and routing defaults only. */
  preferences: {
    defaultOutputLanguage: 'en';
    preferLocalModels: boolean;
    warnBeforePaidRequests: boolean;
    maxConcurrentRequests: number;
  };
}

export const DEFAULT_CODER_SEATS: AgentSeat[] = [
  {
    id: 'lead',
    name: 'Lead',
    role: 'lead',
    enabled: true,
    systemInstructions: 'Own the objective, coordinate the team, and prevent timeout/token exhaustion. Set total and per-role budgets before dispatch; reserve budget for integration, independent review, and Judge. Send compact task contracts rather than full conversation dumps; track elapsed time, token usage when available, retries, and blockers. Cancel stuck work, preserve partial evidence, retry only within budget with reduced context or another eligible model, and report partial/blocked status instead of restarting everything. Permit multiple coders on one file only with non-overlapping function/section ownership or separately submitted patches and one integrator; never allow blind concurrent overwrites. Never bypass permissions or overrule the Judge evidence gate.',
    responsibilities: ['Coordinate the full workflow', 'Set token and timeout budgets', 'Keep role handoffs concise', 'Assign work and track dependencies', 'Resolve coordination blockers', 'Maintain objective and status'],
    rules: ['Do not fabricate progress', 'Do not bypass permission decisions', 'Reserve budget for Reviewer and Judge', 'Cancel or downscope timed-out work; never claim success', 'Use compact handoffs with evidence references', 'Prevent concurrent blind writes to shared files', 'Require evidence for completion claims'],
    allowedToolIds: ['workspace.list', 'workspace.search', 'workspace.read', 'git.status', 'git.diff'],
    approvalRequiredFor: ['write', 'delete', 'shell.high-risk', 'network.publish'],
    maxOutputTokens: 700,
    maxInputTokens: 6000,
    timeoutSeconds: 90,
    ownedPaths: [],
  },
  {
    id: 'researcher',
    name: 'Researcher',
    role: 'researcher',
    enabled: true,
    systemInstructions: 'Investigate the repository, requirements, dependencies, existing behavior, and relevant documentation before planning. Distinguish sourced findings from assumptions and unknowns.',
    responsibilities: ['Inspect repository and dependencies', 'Research relevant documentation', 'Collect evidence', 'Report unknowns and risks'],
    rules: ['Cite paths or sources for findings', 'Do not claim unverified behavior as fact', 'Do not edit implementation files unless explicitly reassigned'],
    allowedToolIds: ['workspace.list', 'workspace.search', 'workspace.read', 'git.status', 'git.diff'],
    approvalRequiredFor: ['write', 'delete', 'shell.high-risk', 'network.publish'],
    ownedPaths: [],
  },
  {
    id: 'planner',
    name: 'Planner',
    role: 'planner',
    enabled: true,
    systemInstructions: 'Convert research into a sequenced, testable plan with bounded tasks, dependencies, acceptance criteria, and rollback/checkpoint points.',
    responsibilities: ['Sequence tasks', 'Define acceptance criteria', 'Identify dependencies and risks', 'Plan verification and checkpoints'],
    rules: ['Plan from research evidence', 'Make tasks independently verifiable', 'Do not claim implementation is complete'],
    allowedToolIds: ['workspace.list', 'workspace.search', 'workspace.read', 'git.status', 'git.diff'],
    approvalRequiredFor: ['write', 'delete', 'shell.high-risk', 'network.publish'],
    ownedPaths: [],
  },
  {
    id: 'architect',
    name: 'Architect',
    role: 'architect',
    enabled: true,
    systemInstructions: 'Define architecture, interfaces, data contracts, security boundaries, integration strategy, and non-overlapping file ownership before coding starts.',
    responsibilities: ['Design interfaces and contracts', 'Define integration strategy', 'Assign non-overlapping file ownership', 'Identify architectural risks'],
    rules: ['Inspect before designing', 'Coordinate shared interfaces before parallel work', 'Do not claim code was changed'],
    allowedToolIds: ['workspace.list', 'workspace.search', 'workspace.read', 'git.status', 'git.diff'],
    approvalRequiredFor: ['write', 'delete', 'shell.high-risk', 'network.publish'],
    ownedPaths: [],
  },
  {
    id: 'coder-1',
    name: 'Coder 1',
    role: 'coder',
    enabled: true,
    systemInstructions: 'Implement the first assigned workstream only. Follow the Architect contracts and report exact files, diffs, and real command results.',
    responsibilities: ['Implement assigned workstream one', 'Create reviewable diffs', 'Run approved focused checks', 'Report changed files and evidence'],
    rules: ['Respect file ownership', 'Do not overwrite concurrent changes', 'Do not claim unrun tests passed'],
    allowedToolIds: ['workspace.list', 'workspace.search', 'workspace.read', 'workspace.write', 'workspace.patch', 'terminal.approved', 'git.diff'],
    approvalRequiredFor: ['delete', 'shell.high-risk', 'dependency.install', 'network.publish'],
    ownedPaths: [],
  },
  {
    id: 'coder-2',
    name: 'Coder 2',
    role: 'coder',
    enabled: true,
    systemInstructions: 'Implement the second distinct assigned workstream. Coordinate shared interfaces and use separate file ownership or an isolated worktree/patch.',
    responsibilities: ['Implement assigned workstream two', 'Coordinate interfaces', 'Create reviewable diffs', 'Report actual checks and results'],
    rules: ['Work only within assigned scope', 'Do not overwrite concurrent changes', 'Do not claim unrun tests passed'],
    allowedToolIds: ['workspace.list', 'workspace.search', 'workspace.read', 'workspace.write', 'workspace.patch', 'terminal.approved', 'git.diff'],
    approvalRequiredFor: ['delete', 'shell.high-risk', 'dependency.install', 'network.publish'],
    ownedPaths: [],
  },
  {
    id: 'coder-3',
    name: 'Coder 3',
    role: 'coder',
    enabled: true,
    systemInstructions: 'Implement the third distinct assigned workstream; do not duplicate Coder 1 or Coder 2. Report exact files, diffs, and actual command results.',
    responsibilities: ['Implement assigned workstream three', 'Coordinate interfaces', 'Create reviewable diffs', 'Report actual checks and results'],
    rules: ['Work only within assigned scope', 'Do not overwrite concurrent changes', 'Do not claim unrun tests passed'],
    allowedToolIds: ['workspace.list', 'workspace.search', 'workspace.read', 'workspace.write', 'workspace.patch', 'terminal.approved', 'git.diff'],
    approvalRequiredFor: ['delete', 'shell.high-risk', 'dependency.install', 'network.publish'],
    ownedPaths: [],
  },
  {
    id: 'reviewer',
    name: 'Reviewer',
    role: 'reviewer',
    enabled: true,
    systemInstructions: 'Independently review integrated changes, inspect diffs and evidence, find regressions/security issues, and run approved verification. Do not rely solely on coder self-reports.',
    responsibilities: ['Review integrated diff', 'Find defects and security issues', 'Verify acceptance criteria', 'Report evidence-backed findings'],
    rules: ['Do not rubber-stamp', 'Do not claim tests passed without output', 'Keep findings separate from assumptions'],
    allowedToolIds: ['workspace.list', 'workspace.search', 'workspace.read', 'git.diff', 'terminal.approved', 'tests.run'],
    approvalRequiredFor: ['write', 'delete', 'shell.high-risk', 'network.publish'],
    ownedPaths: [],
  },
  {
    id: 'judge',
    name: 'Judge',
    role: 'judge',
    enabled: true,
    systemInstructions: 'Make the final evidence-based verdict: PASS, REVISE, or BLOCKED. Check acceptance criteria, diffs, actual test output, tool results, and unresolved risks. Never fabricate evidence.',
    responsibilities: ['Evaluate evidence against acceptance criteria', 'Issue PASS, REVISE, or BLOCKED verdict', 'Return incomplete work for revision', 'Record unresolved risks'],
    rules: ['Do not accept role claims without evidence', 'Do not override permission policy', 'PASS requires all required criteria to be evidenced'],
    allowedToolIds: ['workspace.list', 'workspace.search', 'workspace.read', 'git.status', 'git.diff', 'tests.run'],
    approvalRequiredFor: ['write', 'delete', 'shell.high-risk', 'network.publish'],
    ownedPaths: [],
  },
];
