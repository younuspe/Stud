export type WorkspaceView = 'chat' | 'generative' | 'editor' | 'terminal' | 'agent' | 'github' | 'orchestrator' | 'topology';

export interface CellularNode {
  id: string;
  name: string;
  layer: 'Layer 0: Bedrock' | 'Layer 2: Manifold' | 'Layer 3: Prism';
  runtime: 'Zig' | 'Z3/SMT' | 'Rust' | 'SurrealDB' | 'HNSW' | 'Bevy/WGPU' | 'Tauri';
  cpuCorePinned: number;
  ramUsageMb: number;
  ramQuotaMb: number;
  mailboxMessages: number;
  status: 'active' | 'quarantined' | 'gliding';
  z3VerifiedToken: string;
}

export interface EphemeralIsolationWard {
  id: string;
  name: string;
  guestOs: 'Disposable Alpine-Linux v3.20' | 'Ephemeral Firecracker MicroVM' | 'gVisor Sandbox';
  sandboxState: 'sterile' | 'detonating' | 'scrubbing' | 'terminated';
  threatVector: string;
  grpcScrubbingActive: boolean;
  isolationIntegrity: number; // 0 - 100%
  lastAuditTimestamp: number;
}

export interface StratifiedStackState {
  version: '1.3.0';
  designPhilosophy: 'Manifold ⊗ Formula';
  operationalGoal: 'Zero-Friction Gliding through sovereign digital environment';
  universalStateHash: string;
  cells: CellularNode[];
  wards: EphemeralIsolationWard[];
  z3InvarianceScore: number;
}

export type CodingSpaceLayout = 'single' | 'split-terminal' | 'split-hunter' | 'split-github' | 'split-preview';

export type AIProviderType = 'gemini_cloud' | 'ollama_local' | 'lmstudio_local' | 'custom_local' | 'offline_core';

export interface ExternalAIModelConfig {
  id: string;
  name: string;
  provider: 'gemini' | 'openai' | 'anthropic' | 'deepseek' | 'groq' | 'ollama' | 'lmstudio' | 'custom';
  modelId: string;
  apiKey?: string;
  endpointUrl?: string;
  description: string;
  badge?: string;
  isExternal: boolean;
  status: 'online' | 'offline' | 'untested';
  latencyMs?: number;
}

export interface CodeStudioPromptTurn {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  modelUsed?: string;
  tokensCount?: number;
  codeDiffSummary?: string;
}

export interface StudioModelSettings {
  systemInstruction: string;
  temperature: number;
  topP: number;
  maxOutputTokens: number;
}

export interface ConsoleLogEntry {
  id: string;
  level: 'log' | 'info' | 'warn' | 'error';
  message: string;
  timestamp: number;
}

export interface LocalHostConfig {
  provider: AIProviderType;
  endpointUrl: string; // e.g., 'http://localhost:11434' or 'http://localhost:1234/v1'
  modelName: string; // e.g., 'llama3', 'mistral', 'deepseek-coder', 'qwen2.5'
  apiKey?: string;
  isCustomUrl: boolean;
}

export interface TerminalCommandResult {
  id: string;
  command: string;
  output: string;
  exitCode: number;
  timestamp: number;
  durationMs: number;
}

export type SupportedLanguage = 
  | 'typescript' 
  | 'javascript' 
  | 'python' 
  | 'rust' 
  | 'go' 
  | 'html' 
  | 'css' 
  | 'json' 
  | 'sql' 
  | 'markdown' 
  | 'bash';

export interface EditorFile {
  id: string;
  name: string;
  language: SupportedLanguage;
  content: string;
  isModified?: boolean;
}

export interface AgentStep {
  id: string;
  type: 'research' | 'plan' | 'action' | 'verify' | 'reflect' | 'finish';
  title: string;
  detail: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  command?: string;
  output?: string;
  artifact?: string;
  timestamp: number;
}

export interface AgentTask {
  id: string;
  objective: string;
  status: 'idle' | 'running' | 'paused' | 'completed' | 'failed';
  steps: AgentStep[];
  startedAt: number;
  completedAt?: number;
  summary?: string;
  researchFindings?: string[];
  generatedArtifacts?: { name: string; content: string }[];
}

export interface HunterEvidence {
  id: string;
  type: 'command' | 'file' | 'compiler' | 'test' | 'lint' | 'git' | 'provider' | 'user' | 'agent' | 'system';
  claim: string;
  command?: string;
  exitCode?: number;
  filePath?: string;
  outputSnippet?: string;
  timestamp: number;
  isVerified: boolean;
}

export interface HunterApprovalRequest {
  id: string;
  action: string;
  agentId: string;
  risk: 'critical' | 'high' | 'medium' | 'low';
  whatWillHappen: string;
  why: string;
  affectedFiles: string[];
  command?: string;
  status: 'pending' | 'approved' | 'rejected';
  timestamp: number;
}

export interface HunterJudgeVerdict {
  status: 'verified' | 'blocked';
  milestone: string;
  criteria: { id: string; title: string; isMet: boolean; evidenceRef?: string }[];
  evidence: HunterEvidence[];
  remainingRisks: string[];
  timestamp: number;
}

export interface HunterAgentDefinition {
  id: string;
  role: string;
  duties: string[];
  boundaries: string[];
  model: string;
  tools: string[];
  status: 'idle' | 'working' | 'waiting_approval' | 'done' | 'failed';
  handoffTo?: string;
}

export interface GitHubRepoItem {
  name: string;
  path: string;
  type: 'file' | 'dir';
  size?: number;
  downloadUrl?: string;
}

export interface GitHubConfig {
  owner: string;
  repo: string;
  branch: string;
  token?: string;
  isConnected: boolean;
}

export interface SupruAgentMember {
  id: string;
  name: string;
  role: string;
  tagline: string;
  capabilities: string[];
  status: 'active' | 'ready' | 'standby';
  icon: string;
}

export type OrchestratorToolName = 
  | 'linter' 
  | 'test_runner' 
  | 'type_checker' 
  | 'ast_parser' 
  | 'git_diff' 
  | 'token_budgeter' 
  | 'debugger' 
  | 'package_manager' 
  | 'api_checker'
  | 'smt_prover'
  | 'hunter_scent';

export interface OrchestratorToolCall {
  id: string;
  tool: OrchestratorToolName;
  args: Record<string, any>;
  output: string;
  status: 'running' | 'success' | 'warning' | 'error';
  durationMs: number;
  timestamp: number;
}

export interface OrchestratorBug {
  id: string;
  title: string;
  file: string;
  line?: number;
  severity: 'critical' | 'high' | 'medium' | 'low';
  errorDetails: string;
  recommendedTool: OrchestratorToolName;
  recommendedModel: string;
  status: 'open' | 'investigating' | 'verifying' | 'fixed';
  solutionDiff?: string;
}

export interface OrchestratorProject {
  id: string;
  name: string;
  complexity: 'small' | 'medium' | 'complex' | 'multi_service';
  description: string;
  tokenBudget: number; // e.g., 8192
  tokensUsed: number;
  tokensSaved: number;
  activeModel: string;
  fallbackModel: string;
  tasks: {
    id: string;
    title: string;
    stage: 'plan' | 'code' | 'test' | 'bugfix' | 'deploy';
    status: 'pending' | 'in_progress' | 'completed';
    assignedModel: string;
  }[];
}

export type StudioWindowId = 'editor' | 'preview' | 'generator' | 'terminal' | 'agent' | 'github' | 'console' | 'orchestrator';

export interface StudioWindowState {
  id: StudioWindowId;
  title: string;
  isOpen: boolean;
  isUndocked: boolean;
  position?: { x: number; y: number };
  size?: { width: number; height: number };
}

export type WorkflowCategory = 
  | 'fullstack_web'
  | 'autonomous_microservice'
  | 'genesis_multimodal'
  | 'security_invariance'
  | 'data_neural'
  | 'mobile_crossplatform'
  | 'custom_pipeline';

export type OrchestratorModelRole = 'oracle' | 'builder' | 'critic' | 'tester' | 'judge';

export interface WorkflowPipelineNode {
  id: string;
  name: string;
  stage: 'plan' | 'code' | 'tool_call' | 'test' | 'verify' | 'deploy';
  modelId: string;
  modelRole: OrchestratorModelRole;
  description: string;
  status: 'idle' | 'running' | 'completed' | 'failed' | 'healed';
  toolToCall?: OrchestratorToolName;
  toolArgs?: Record<string, any>;
  toolResult?: string;
  durationMs?: number;
  tokensUsed?: number;
  inputDependencies?: string[];
  outputData?: string;
  invarianceProof?: string;
}

export interface AutonomousWorkflowPipeline {
  id: string;
  name: string;
  category: WorkflowCategory;
  description: string;
  projectArchetype: string;
  objective: string;
  activeModelCount: number;
  nodes: WorkflowPipelineNode[];
  executionStatus: 'idle' | 'running' | 'paused' | 'completed' | 'failed';
  totalDurationMs: number;
  totalTokensUsed: number;
  totalTokensSaved: number;
  toolCallsExecuted: number;
  selfHealingTriggered: number;
  invarianceScore: number;
}


