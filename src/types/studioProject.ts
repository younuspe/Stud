/**
 * Shared data contracts for Supru's unified creative workspace.
 *
 * These are the stable IDs and artifact contracts shared by the Pill, Model Lab,
 * Canvas, Structure/Layers, Inspector, code editor, and orchestration system.
 * UI features should pass IDs and typed operations rather than unrelated prompt strings.
 */

export type StudioArtifactKind =
  | 'image'
  | 'video'
  | 'audio'
  | 'web-page'
  | 'design-document'
  | 'code-file'
  | 'document'
  | 'presentation'
  | '3d-scene'
  | 'data'
  | 'unknown';

export type StudioOperationStatus =
  | 'draft'
  | 'queued'
  | 'running'
  | 'awaiting-approval'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'unsupported';

export interface StudioSelection {
  artifactId: string;
  /** Optional layer, node, code range, document block, or timeline item. */
  elementId?: string;
  /** Optional text/code selection range, in the adapter's coordinate system. */
  range?: { start: number; end: number };
  /** Optional normalized region for image/canvas operations. */
  region?: { x: number; y: number; width: number; height: number };
}

export interface StudioAsset {
  id: string;
  name: string;
  mediaType: string;
  uri: string;
  sha256?: string;
  width?: number;
  height?: number;
  durationMs?: number;
  provenance?: {
    source: 'user' | 'model' | 'import' | 'tool' | 'unknown';
    provider?: string;
    model?: string;
    createdAt: number;
    license?: string;
  };
}

export interface StudioArtifact {
  id: string;
  projectId: string;
  kind: StudioArtifactKind;
  name: string;
  uri?: string;
  mimeType?: string;
  assetIds: string[];
  currentVersionId: string;
  createdAt: number;
  updatedAt: number;
  capabilities: StudioArtifactCapability[];
  metadata: Record<string, unknown>;
}

export type StudioArtifactCapability =
  | 'view'
  | 'edit'
  | 'generate-variant'
  | 'annotate'
  | 'preview'
  | 'export'
  | 'run'
  | 'inspect';

export interface StudioArtifactVersion {
  id: string;
  artifactId: string;
  parentVersionId?: string;
  createdAt: number;
  createdBy: 'user' | 'assistant' | 'agent' | 'tool' | 'import';
  summary: string;
  /** A patch, source snapshot URI, or adapter-specific reversible change. */
  changeRef?: string;
  verificationStatus: 'not-run' | 'passed' | 'failed' | 'blocked';
  evidenceIds: string[];
}

export type StudioOperationIntent =
  | 'ask'
  | 'create'
  | 'edit'
  | 'transform'
  | 'restyle'
  | 'refactor'
  | 'annotate'
  | 'generate-variant'
  | 'preview'
  | 'run'
  | 'verify'
  | 'export'
  | 'unsupported';

export interface StudioOperationRequest {
  id: string;
  projectId: string;
  intent: StudioOperationIntent;
  instruction: string;
  target?: StudioSelection;
  inputArtifactIds: string[];
  requestedBy: 'pill' | 'canvas' | 'inspector' | 'model-lab' | 'agent' | 'system';
  language: {
    inputLocale: 'en' | 'ml' | 'auto';
    outputLocale: 'en' | 'requested';
  };
  createdAt: number;
  requiresApproval: boolean;
}

export interface StudioEvidence {
  id: string;
  operationId: string;
  kind: 'provider-response' | 'command' | 'test' | 'diff' | 'preview' | 'permission' | 'error' | 'note';
  title: string;
  content: string;
  createdAt: number;
  exitCode?: number;
  sourceUri?: string;
}

export interface StudioOperationResult {
  operationId: string;
  status: StudioOperationStatus;
  summary: string;
  error?: string;
  outputArtifactIds: string[];
  versionIds: string[];
  evidenceIds: string[];
}

export interface StudioModelRun {
  id: string;
  projectId: string;
  providerId: string;
  modelId: string;
  prompt: string;
  systemInstruction: string;
  parameters: {
    temperature?: number;
    topP?: number;
    maxOutputTokens?: number;
    seed?: number;
    responseFormat?: 'text' | 'json' | 'code';
  };
  inputArtifactIds: string[];
  outputArtifactIds: string[];
  status: StudioOperationStatus;
  startedAt: number;
  completedAt?: number;
  latencyMs?: number;
  inputTokens?: number;
  outputTokens?: number;
  costUsd?: number;
  error?: string;
}

export interface StudioProjectState {
  schemaVersion: 1;
  projectId: string;
  projectName: string;
  rootUri?: string;
  artifacts: Record<string, StudioArtifact>;
  assets: Record<string, StudioAsset>;
  versions: Record<string, StudioArtifactVersion>;
  operations: Record<string, StudioOperationRequest>;
  operationResults: Record<string, StudioOperationResult>;
  evidence: Record<string, StudioEvidence>;
  modelRuns: Record<string, StudioModelRun>;
  selection?: StudioSelection;
  updatedAt: number;
}

/** Capability declarations are authoritative: unsupported actions must never be faked. */
export function supportsStudioCapability(
  artifact: Pick<StudioArtifact, 'capabilities'>,
  capability: StudioArtifactCapability,
): boolean {
  return artifact.capabilities.includes(capability);
}
