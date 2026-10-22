export interface GitHubUser {
  login: string;
  id: number;
  avatar_url: string;
  name: string | null;
  email: string | null;
}

export interface GitHubContentFile {
  name: string;
  path: string;
  sha: string;
  size: number;
  url: string;
  html_url: string;
  download_url: string;
  type: 'file' | 'dir';
  encoding?: string;
  content?: string;
}

export interface GitHubApiError {
  message: string;
  documentation_url?: string;
  errors?: Array<{ resource?: string; field?: string; code?: string; message?: string }>;
}

export interface CommitResult {
  commitSha: string;
  contentSha: string;
  commitUrl: string;
  contentPath: string;
}

function getEnv(key: string, fallback: string): string {
  try {
    return ((import.meta.env as Record<string, string | undefined>)[key] as string) || fallback;
  } catch {
    return fallback;
  }
}

const REPO_OWNER = getEnv('GITHUB_OWNER', 'inflatablepool');
const REPO_NAME = getEnv('GITHUB_REPO', 'web');
const DEFAULT_BRANCH = 'main';
const REQUEST_TIMEOUT_MS = 12000;
const COMMIT_AUTHOR_NAME = 'Inflatable Pool Factory Admin';
const COMMIT_AUTHOR_EMAIL = 'admin@inflatablepoolfactory.local';
const USER_AGENT = 'inflatable-pool-factory-admin';

export function getRepoInfo(): { owner: string; repo: string } {
  return { owner: REPO_OWNER, repo: REPO_NAME };
}

export class GitHubClient {
  private token: string;
  private baseUrl = 'https://api.github.com';

  constructor(token: string | null) {
    this.token = token ?? '';
  }

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const res = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${this.token}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        'User-Agent': USER_AGENT,
        'X-GitHub-Api-Version': '2022-11-28',
      },
      body: body ? JSON.stringify(body) : undefined,
      // Never let a stalled GitHub request block page rendering / builds.
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    if (!res.ok) {
      const errorBody = await res.text();
      let parsed: GitHubApiError | null;
      try {
        parsed = JSON.parse(errorBody) as GitHubApiError;
      } catch {
        parsed = { message: errorBody || res.statusText };
      }
      const err = new GitHubRequestError(parsed.message || res.statusText, res.status, parsed);
      throw err;
    }

    if (res.status === 204) return undefined as T;
    return (await res.json()) as T;
  }

  async verifyToken(): Promise<GitHubUser> {
    return this.request<GitHubUser>('GET', '/user');
  }

  async listFiles(dirPath: string, branch?: string): Promise<GitHubContentFile[]> {
    const normalized = dirPath.replace(/^\/+|\/+$/g, '');
    const ref = branch || DEFAULT_BRANCH;
    const items = await this.request<GitHubContentFile[] | GitHubContentFile>(
      'GET',
      `/repos/${REPO_OWNER}/${REPO_NAME}/contents/${normalized}?ref=${ref}`
    );
    return Array.isArray(items) ? items.filter((i) => i.type === 'file') : [];
  }

  async getRecursiveTree(branch?: string): Promise<Array<{ path: string; sha: string; size: number; type: string }>> {
    interface TreeResp {
      sha: string;
      url: string;
      tree: Array<{ path: string; mode: string; type: string; sha: string; size?: number }>;
      truncated: boolean;
    }
    const ref = branch || DEFAULT_BRANCH;
    const res = await this.request<TreeResp>('GET', `/repos/${REPO_OWNER}/${REPO_NAME}/git/trees/${ref}?recursive=1`);
    return res.tree
      .filter((t) => t.type === 'blob' && typeof t.size === 'number')
      .map((t) => ({ path: t.path, sha: t.sha, size: t.size as number, type: t.type }));
  }

  async readFile(filePath: string, branch?: string): Promise<{ sha: string; content: string; downloadUrl: string }> {
    const normalized = filePath.replace(/^\/+/, '');
    const ref = branch || DEFAULT_BRANCH;
    const item = await this.request<GitHubContentFile>(
      'GET',
      `/repos/${REPO_OWNER}/${REPO_NAME}/contents/${normalized}?ref=${ref}`
    );
    if (!item.content) {
      throw new GitHubRequestError('Empty file content', 500);
    }
    const decoded = Buffer.from(item.content, 'base64').toString('utf-8');
    return { sha: item.sha, content: decoded, downloadUrl: item.download_url };
  }

  async createFile(filePath: string, content: string, message: string, branch?: string): Promise<CommitResult> {
    const normalized = filePath.replace(/^\/+/, '');
    const encoded = Buffer.from(content, 'utf-8').toString('base64');
    const res = await this.request<{
      commit: { sha: string; html_url: string };
      content: { sha: string; path: string; html_url: string };
    }>('PUT', `/repos/${REPO_OWNER}/${REPO_NAME}/contents/${normalized}`, {
      message,
      branch: branch || DEFAULT_BRANCH,
      content: encoded,
      author: { name: COMMIT_AUTHOR_NAME, email: COMMIT_AUTHOR_EMAIL },
      committer: { name: COMMIT_AUTHOR_NAME, email: COMMIT_AUTHOR_EMAIL },
    });
    return {
      commitSha: res.commit.sha,
      contentSha: res.content.sha,
      commitUrl: res.commit.html_url,
      contentPath: res.content.path,
    };
  }

  async updateFile(
    filePath: string,
    content: string,
    sha: string,
    message: string,
    branch?: string
  ): Promise<CommitResult> {
    const normalized = filePath.replace(/^\/+/, '');
    const encoded = Buffer.from(content, 'utf-8').toString('base64');
    const res = await this.request<{
      commit: { sha: string; html_url: string };
      content: { sha: string; path: string; html_url: string };
    }>('PUT', `/repos/${REPO_OWNER}/${REPO_NAME}/contents/${normalized}`, {
      message,
      branch: branch || DEFAULT_BRANCH,
      content: encoded,
      sha,
      author: { name: COMMIT_AUTHOR_NAME, email: COMMIT_AUTHOR_EMAIL },
      committer: { name: COMMIT_AUTHOR_NAME, email: COMMIT_AUTHOR_EMAIL },
    });
    return {
      commitSha: res.commit.sha,
      contentSha: res.content.sha,
      commitUrl: res.commit.html_url,
      contentPath: res.content.path,
    };
  }

  async deleteFile(
    filePath: string,
    sha: string,
    message: string,
    branch?: string
  ): Promise<{ commitSha: string; commitUrl: string }> {
    const normalized = filePath.replace(/^\/+/, '');
    const encodedMessage = encodeURIComponent(message);
    const ref = branch || DEFAULT_BRANCH;
    const res = await this.request<{ commit: { sha: string; html_url: string } }>(
      'DELETE',
      `/repos/${REPO_OWNER}/${REPO_NAME}/contents/${normalized}?ref=${ref}&message=${encodedMessage}&sha=${sha}`
    );
    return { commitSha: res.commit.sha, commitUrl: res.commit.html_url };
  }
}

export class GitHubRequestError extends Error {
  status: number;
  detail: GitHubApiError | null;
  constructor(message: string, status: number, detail: GitHubApiError | null = null) {
    super(message);
    this.name = 'GitHubRequestError';
    this.status = status;
    this.detail = detail;
  }
}

export function slugify(input: string): string {
  return (
    input
      .toString()
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80) || 'untitled'
  );
}
