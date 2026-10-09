import React, { useState } from 'react';
import { 
  GitBranch, 
  GitFork, 
  Star, 
  AlertCircle, 
  Folder, 
  FileCode, 
  ExternalLink, 
  Search, 
  RefreshCw, 
  ArrowLeft, 
  Code2, 
  Bot, 
  Key, 
  Check, 
  ShieldCheck,
  ChevronRight,
  Download
} from 'lucide-react';
import { GitHubConfig, GitHubRepoItem } from '../../types/workbench';
import { soundFx } from '../../utils/audio';

interface GitHubViewProps {
  onOpenInEditor: (fileName: string, content: string) => void;
  onTriggerAgent: (objective: string) => void;
}

const PRESET_REPOS = [
  { owner: 'expressjs', repo: 'express' },
  { owner: 'vitejs', repo: 'vite' },
  { owner: 'facebook', repo: 'react' },
  { owner: 'tailwindlabs', repo: 'tailwindcss' },
];

export const GitHubView: React.FC<GitHubViewProps> = ({
  onOpenInEditor,
  onTriggerAgent,
}) => {
  const [owner, setOwner] = useState('expressjs');
  const [repo, setRepo] = useState('express');
  const [token, setToken] = useState('');
  const [showTokenInput, setShowTokenInput] = useState(false);
  const [currentPath, setCurrentPath] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [repoData, setRepoData] = useState<any>(null);
  const [items, setItems] = useState<GitHubRepoItem[]>([]);
  const [selectedFile, setSelectedFile] = useState<{ name: string; content: string } | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  const fetchRepoInfo = async (targetOwner = owner, targetRepo = repo) => {
    setIsLoading(true);
    setErrorMessage('');
    setSelectedFile(null);
    soundFx.playClick();

    try {
      const res = await fetch('/api/github/repo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ owner: targetOwner, repo: targetRepo, token: token || undefined }),
      });

      const data = await res.json();
      if (data.error) {
        setErrorMessage(data.error);
        setIsLoading(false);
        return;
      }

      setRepoData(data);
      fetchContents(targetOwner, targetRepo, '');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to connect to GitHub repository');
      setIsLoading(false);
    }
  };

  const fetchContents = async (targetOwner = owner, targetRepo = repo, path = '') => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/github/contents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          owner: targetOwner,
          repo: targetRepo,
          path,
          token: token || undefined,
        }),
      });

      const data = await res.json();
      if (data.error) {
        setErrorMessage(data.error);
      } else if (data.type === 'dir') {
        setItems(data.items || []);
        setCurrentPath(path);
        setSelectedFile(null);
      } else if (data.type === 'file') {
        setSelectedFile({ name: data.name, content: data.content });
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error fetching contents');
    } finally {
      setIsLoading(false);
    }
  };

  const handleItemClick = (item: GitHubRepoItem) => {
    soundFx.playClick();
    fetchContents(owner, repo, item.path);
  };

  const handleNavigateUp = () => {
    soundFx.playClick();
    if (!currentPath) return;
    const parts = currentPath.split('/');
    parts.pop();
    const newPath = parts.join('/');
    fetchContents(owner, repo, newPath);
  };

  const handleOpenInEditorClick = () => {
    if (!selectedFile) return;
    soundFx.playClick();
    onOpenInEditor(selectedFile.name, selectedFile.content);
  };

  const handleAnalyzeWithHunter = () => {
    soundFx.playClick();
    const objective = `Deep research repository architecture for ${owner}/${repo} (${repoData?.description || 'Software repo'}). Identify key modules, audit hot paths, and synthesize test suite.`;
    onTriggerAgent(objective);
  };

  return (
    <div className="flex h-full w-full flex-col bg-[#09090e] text-gray-200 overflow-hidden font-sans text-xs">
      {/* Top Search & Connect Bar - Compact */}
      <div className="border-b border-[#1b1b28] bg-[#0e0e16] p-3 sm:p-4">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-400">
              <GitBranch size={19} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white">Supru Git</h2>
                <span className="rounded-full bg-purple-500/20 px-2 py-0.2 text-[9.5px] font-bold text-purple-300 border border-purple-500/30">
                  Repository Explorer
                </span>
              </div>
              <p className="text-[11px] text-gray-400">
                Explore repos, branches, and code files to pipe directly into Supru Hunter or Supru Code
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowTokenInput(!showTokenInput)}
              className="flex items-center gap-1 rounded-lg border border-[#262638] bg-[#14141f] px-2.5 py-1 text-[11px] text-gray-300 hover:text-white"
            >
              <Key size={12} className="text-amber-400" />
              <span>{token ? 'PAT Configured' : 'Personal Token'}</span>
            </button>
          </div>
        </div>

        {/* Token Input Drawer */}
        {showTokenInput && (
          <div className="mt-2.5 rounded-xl border border-[#28283a] bg-[#13131e] p-2.5">
            <label className="text-[11px] font-semibold text-gray-300">GitHub Personal Access Token (PAT)</label>
            <p className="text-[10px] text-gray-500 mb-1.5">For private repositories or rate limits.</p>
            <input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              className="w-full rounded-lg border border-[#2e2e42] bg-[#0a0a0f] px-2.5 py-1 text-xs font-mono text-white outline-none focus:border-amber-500"
            />
          </div>
        )}

        {/* Search Repository Form */}
        <div className="mt-3 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="flex flex-1 items-center gap-1.5">
            <input
              type="text"
              value={owner}
              onChange={(e) => setOwner(e.target.value)}
              placeholder="Owner (e.g., expressjs)"
              className="w-1/3 rounded-xl border border-[#2a2a3c] bg-[#12121b] px-3 py-1.5 text-xs text-white outline-none focus:border-amber-500"
            />
            <span className="text-gray-500">/</span>
            <input
              type="text"
              value={repo}
              onChange={(e) => setRepo(e.target.value)}
              placeholder="Repo (e.g., express)"
              className="flex-1 rounded-xl border border-[#2a2a3c] bg-[#12121b] px-3 py-1.5 text-xs text-white outline-none focus:border-amber-500"
            />
          </div>

          <button
            onClick={() => fetchRepoInfo()}
            disabled={isLoading || !owner || !repo}
            className="flex items-center justify-center gap-1.5 rounded-xl bg-amber-500 px-4 py-1.5 text-xs font-bold text-neutral-950 hover:bg-amber-400 disabled:opacity-40 shadow-md transition-all shrink-0"
          >
            {isLoading ? <RefreshCw size={12} className="animate-spin" /> : <Search size={12} />}
            <span>Fetch Repo</span>
          </button>
        </div>

        {/* Quick Presets */}
        <div className="mt-2 flex items-center gap-1 overflow-x-auto text-[10.5px] scrollbar-none">
          <span className="text-gray-500 text-[9.5px] uppercase font-semibold shrink-0">Popular:</span>
          {PRESET_REPOS.map((p, idx) => (
            <button
              key={idx}
              onClick={() => {
                setOwner(p.owner);
                setRepo(p.repo);
                fetchRepoInfo(p.owner, p.repo);
              }}
              className="shrink-0 rounded-md border border-[#232332] bg-[#14141e] px-2 py-0.5 text-gray-300 hover:border-amber-500/40 hover:text-amber-300"
            >
              {p.owner}/{p.repo}
            </button>
          ))}
        </div>
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="m-3 rounded-lg border border-rose-500/30 bg-rose-500/10 p-2 text-xs text-rose-300 flex items-center gap-2">
          <AlertCircle size={14} className="shrink-0 text-rose-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Repo Browser Column */}
        <div className="flex flex-1 flex-col overflow-hidden border-r border-[#1a1a26]">
          {repoData && (
            <div className="border-b border-[#1c1c28] bg-[#11111a] p-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-white flex items-center gap-2">
                    <span>{repoData.fullName}</span>
                    <span className="rounded bg-amber-500/15 px-1.5 py-0.2 text-[9.5px] text-amber-300 border border-amber-500/30">
                      {repoData.defaultBranch}
                    </span>
                  </h3>
                  <p className="text-[11px] text-gray-400 mt-0.5 line-clamp-1">{repoData.description}</p>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleAnalyzeWithHunter}
                    className="flex items-center gap-1 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-[11px] font-semibold text-amber-300 hover:bg-amber-500/20"
                    title="Send repository to Supru Hunter"
                  >
                    <Bot size={12} />
                    <span>Audit with Hunter</span>
                  </button>

                  <a
                    href={repoData.htmlUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-lg border border-[#272738] bg-[#161622] p-1 text-gray-400 hover:text-white"
                    title="View on GitHub"
                  >
                    <ExternalLink size={12} />
                  </a>
                </div>
              </div>

              {/* Stats */}
              <div className="mt-2 flex items-center gap-3 text-[11px] text-gray-400">
                <span className="flex items-center gap-1">
                  <Star size={11} className="text-amber-400" />
                  <span>{repoData.stars?.toLocaleString()} stars</span>
                </span>
                <span className="flex items-center gap-1">
                  <GitFork size={11} className="text-sky-400" />
                  <span>{repoData.forks?.toLocaleString()} forks</span>
                </span>
              </div>
            </div>
          )}

          {/* Directory Breadcrumb */}
          {repoData && (
            <div className="flex items-center gap-1.5 border-b border-[#191924] bg-[#0c0c12] px-3 py-1.5 text-xs font-mono text-gray-400">
              <button
                onClick={() => fetchContents(owner, repo, '')}
                className="hover:text-amber-400 font-bold"
              >
                {repo}
              </button>
              {currentPath && (
                <>
                  <span>/</span>
                  <span className="text-white">{currentPath}</span>
                  <button
                    onClick={handleNavigateUp}
                    className="ml-auto text-[10.5px] text-amber-400 hover:underline font-sans"
                  >
                    Up one level
                  </button>
                </>
              )}
            </div>
          )}

          {/* Directory Item List */}
          <div className="flex-1 overflow-y-auto p-1.5 space-y-0.5">
            {items.map((item) => (
              <div
                key={item.path}
                onClick={() => handleItemClick(item)}
                className="flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs hover:bg-[#161624] cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2">
                  {item.type === 'dir' ? (
                    <Folder size={14} className="text-amber-400 fill-amber-400/20" />
                  ) : (
                    <FileCode size={14} className="text-sky-400" />
                  )}
                  <span className={item.type === 'dir' ? 'font-semibold text-white' : 'text-gray-300'}>
                    {item.name}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-[9.5px] text-gray-500 font-mono">
                  {item.size ? `${Math.round(item.size / 1024)} KB` : ''}
                  <ChevronRight size={11} className="text-gray-600" />
                </div>
              </div>
            ))}

            {!repoData && !isLoading && (
              <div className="flex h-full flex-col items-center justify-center text-center p-4">
                <GitBranch size={26} className="text-gray-600 mb-1.5" />
                <p className="text-[11px] text-gray-400">Enter a repository name or choose a preset to inspect files.</p>
              </div>
            )}
          </div>
        </div>

        {/* File Preview Column */}
        {selectedFile && (
          <div className="flex flex-1 flex-col overflow-hidden bg-[#0d0d14]">
            <div className="flex items-center justify-between border-b border-[#1e1e2d] bg-[#12121b] px-3 py-1.5">
              <div className="flex items-center gap-1.5">
                <FileCode size={13} className="text-amber-400" />
                <span className="font-mono text-xs font-bold text-white">{selectedFile.name}</span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleOpenInEditorClick}
                  className="flex items-center gap-1 rounded-lg border border-amber-500/30 bg-amber-500/15 px-2.5 py-1 text-xs font-semibold text-amber-300 hover:bg-amber-500/25"
                >
                  <Code2 size={12} />
                  <span>Open in Supru Code</span>
                </button>
              </div>
            </div>

            <pre className="flex-1 overflow-auto p-3 font-mono text-[11px] leading-relaxed text-gray-200 selection:bg-amber-500/30 selection:text-amber-200 whitespace-pre-wrap">
              {selectedFile.content}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
