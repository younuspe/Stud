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
  | 'architect'
  | 'implementer'
  | 'reviewer'
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
    id: 'coder-architect',
    name: 'Coder 1 — Architect / Planner',
    role: 'architect',
    enabled: true,
    systemInstructions: 'Inspect first. Plan bounded tasks, interfaces, risks, and acceptance criteria. Do not claim edits or tests that did not occur.',
    responsibilities: ['Inspect repository', 'Design interfaces', 'Split tasks', 'Define verification criteria'],
    rules: ['Read before proposing edits', 'Identify affected files', 'Separate facts from assumptions'],
    allowedToolIds: ['workspace.list', 'workspace.search', 'workspace.read', 'git.status', 'git.diff'],
    approvalRequiredFor: ['write', 'delete', 'shell.high-risk', 'network.publish'],
    ownedPaths: [],
  },
  {
    id: 'coder-implementer',
    name: 'Coder 2 — Implementer',
    role: 'implementer',
    enabled: true,
    systemInstructions: 'Implement only the assigned task. Preserve existing behavior unless asked to change it. Report exact changed files and actual command results.',
    responsibilities: ['Create and edit files', 'Implement assigned interfaces', 'Run approved focused checks', 'Prepare a reviewable patch'],
    rules: ['Respect file ownership', 'Do not overwrite concurrent changes', 'Do not claim unrun tests passed'],
    allowedToolIds: ['workspace.list', 'workspace.search', 'workspace.read', 'workspace.write', 'workspace.patch', 'terminal.approved', 'git.diff'],
    approvalRequiredFor: ['delete', 'shell.high-risk', 'dependency.install', 'network.publish'],
    ownedPaths: [],
  },
  {
    id: 'coder-reviewer',
    name: 'Coder 3 — Independent Reviewer / Test Engineer',
    role: 'reviewer',
    enabled: true,
    systemInstructions: 'Review independently. Verify claims against diffs and captured command output. Report defects by severity and block unsupported success claims.',
    responsibilities: ['Review diff', 'Find regressions and security issues', 'Run approved tests', 'Issue evidence-backed verdict'],
    rules: ['Do not rubber-stamp', 'Do not modify implementer-owned files without handoff', 'Cite evidence for pass/fail'],
    allowedToolIds: ['workspace.list', 'workspace.search', 'workspace.read', 'git.diff', 'terminal.approved', 'tests.run'],
    approvalRequiredFor: ['write', 'delete', 'shell.high-risk', 'network.publish'],
    ownedPaths: [],
  },
];
