import simpleGit from "simple-git";

export class GitService {
  private git = simpleGit();

  async getStagedDiff(): Promise<string> {
    return this.git.diff(["--cached"]);
  }

  async getStagedFiles(): Promise<string[]> {
    const status = await this.git.status();
    return status.staged;
  }

  async commitMessage(message: string): Promise<void> {
    await this.git.commit(message);
  }

  async getUsername(): Promise<string> {
    try {
      const config = await this.git.raw(["config", "user.name"]);
      return config.trim() || "anonymous";
    } catch {
      return "anonymous";
    }
  }
}
