// bin/index.ts
import { Command } from "commander";

// src/App/CommitCoach.ts
import "dotenv/config";

// src/infrastructure/GitService.ts
import simpleGit from "simple-git";
var GitService = class {
  constructor() {
    this.git = simpleGit();
  }
  async getStagedDiff() {
    return this.git.diff(["--cached"]);
  }
  async getStagedFiles() {
    const status = await this.git.status();
    return status.staged;
  }
  async commitMessage(message) {
    await this.git.commit(message);
  }
};

// src/domain/services/DiffParser.ts
var DiffParser = class {
  parse(diff, files) {
    return `Modifications d\xE9tect\xE9es dans les fichiers : ${files.join(", ")}`;
  }
};

// src/domain/services/MessageBuilder.ts
var MessageBuilder = class {
  constructor(config) {
    this.config = config;
  }
  /**
   * Génère un message de commit localement à partir des fichiers modifiés.
   * @param summary Résumé du diff Git (texte brut).
   * @returns Un message de commit simple.
   */
  async generate(summary) {
    const added = (summary.match(/^\+[^+]/gm) || []).length;
    const removed = (summary.match(/^-[^-]/gm) || []).length;
    let type = "chore";
    if (summary.includes("test")) type = "test";
    else if (summary.includes("fix")) type = "fix";
    else if (summary.includes("feature") || summary.includes("feat")) type = "feat";
    return `${type}: update files (+${added}/-${removed})`;
  }
};

// src/config/ConfigLoader.ts
import { z } from "zod";
import { readFile } from "fs/promises";
var configSchema = z.object({
  convention: z.enum(["conventional", "gitmoji"]).optional(),
  autoCommit: z.boolean().optional()
});
async function loadConfig(path) {
  const raw = await readFile(path, "utf-8");
  const json = JSON.parse(raw);
  return configSchema.parse(json);
}

// src/utils/PromptUtils.ts
import prompts from "prompts";
async function askForMessage(defaultMsg) {
  const res = await prompts({
    type: "text",
    name: "message",
    message: "Proposez ou modifiez le message de commit :",
    initial: defaultMsg
  });
  return res.message;
}
async function askToConfirm(msg) {
  const res = await prompts({
    type: "confirm",
    name: "confirm",
    message: msg,
    initial: true
  });
  return res.confirm;
}

// src/App/CommitCoach.ts
var CommitCoach = class {
  constructor(configPath) {
    this.configPath = configPath;
  }
  /**
   * Lance le processus complet :
   * - Récupère la config
   * - Récupère les changements Git
   * - Génère un résumé + un message avec l'IA
   * - Demande validation à l'utilisateur
   * - Exécute le commit final
   */
  async run() {
    try {
      const config = await loadConfig(this.configPath);
      const git = new GitService();
      const diffParser = new DiffParser();
      const messageBuilder = new MessageBuilder(config);
      const diff = await git.getStagedDiff();
      const files = await git.getStagedFiles();
      const summary = diffParser.parse(diff, files);
      const generatedMsg = await messageBuilder.generate(summary);
      const finalMsg = await askForMessage(generatedMsg);
      const confirmed = await askToConfirm("Souhaitez-vous valider ce message ?");
      if (confirmed) {
        await git.commitMessage(finalMsg);
        console.log("\u2705 Commit effectu\xE9 avec succ\xE8s !");
      } else {
        console.log("\u274C Commit annul\xE9 par l'utilisateur.");
      }
    } catch (error) {
      console.error("\u{1F6A8} Une erreur est survenue :", error);
    }
  }
};

// bin/index.ts
var program = new Command();
program.name("commit-coach").description("Assistant IA pour g\xE9n\xE9rer un message de commit").version("1.0.0").option("-c, --config <path>", "Chemin du fichier de config", ".commitcoachrc.json").action(async (options) => {
  const coach = new CommitCoach(options.config);
  await coach.run();
});
program.parse();
