// bin/index.ts
import { Command } from "commander";

// src/config/ConfigLoader.ts
import { z } from "zod";
import { readFile } from "fs/promises";
var configSchema = z.object({
  convention: z.enum(["conventional", "gitmoji"]).optional(),
  autoCommit: z.boolean().optional(),
  username: z.string().optional()
});
async function loadConfig(path) {
  const raw = await readFile(path, "utf-8");
  const json = JSON.parse(raw);
  return configSchema.parse(json);
}

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
  async getUsername() {
    try {
      const config = await this.git.raw(["config", "user.name"]);
      return config.trim() || "anonymous";
    } catch {
      return "anonymous";
    }
  }
};

// src/domain/services/MessageBuilder.ts
var MessageBuilder = class {
  constructor(config) {
    this.config = config;
  }
  async generate(summary) {
    const added = (summary.match(/^\+[^+]/gm) || []).length;
    const removed = (summary.match(/^-[^-]/gm) || []).length;
    const lowerSummary = summary.toLowerCase();
    let type = "chore";
    if (/test/.test(lowerSummary)) type = "test";
    else if (/fix|bug/.test(lowerSummary)) type = "fix";
    else if (/feature|feat/.test(lowerSummary)) type = "feat";
    else if (/refactor/.test(lowerSummary)) type = "refactor";
    else if (/docs?/.test(lowerSummary)) type = "docs";
    else if (/style|indent/.test(lowerSummary)) type = "style";
    else if (/messagebuilder|diffparser|logic|parser/.test(lowerSummary)) type = "refactor";
    const messagesByType = {
      feat: [
        "\u2728 Nouvelle fonctionnalit\xE9 ajout\xE9e",
        "\u{1F680} Ajout d'une nouvelle capacit\xE9",
        "feat: am\xE9lioration du produit"
      ],
      fix: [
        "\u{1F41B} Correction d\u2019un bug",
        "fix: r\xE9paration d\u2019un comportement inattendu",
        "\u{1F527} R\xE9solution de probl\xE8me sur le code"
      ],
      test: [
        "\u{1F9EA} Ajout ou modification des tests",
        "test: couverture \xE9tendue",
        "\u2705 Mise \xE0 jour des tests unitaires"
      ],
      docs: [
        "\u{1F4DD} Mise \xE0 jour de la documentation",
        "docs: am\xE9lioration du README ou commentaires",
        "\u{1F4DA} Contenu documentaire enrichi"
      ],
      style: [
        "\u{1F484} Changement de formatage / indentation",
        "style: mise en conformit\xE9 avec les r\xE8gles de lint",
        "\u{1F3A8} Ajustement stylistique du code"
      ],
      refactor: [
        "\u267B\uFE0F Refactorisation du code sans changement de comportement",
        "refactor: am\xE9lioration interne",
        "\u{1F528} Code restructur\xE9 pour plus de clart\xE9"
      ],
      chore: [
        "\u{1F527} T\xE2che d'entretien",
        "chore: maintenance ou mise \xE0 jour technique",
        "\u{1F4E6} MAJ d\xE9pendances ou outils"
      ]
    };
    const possibleMessages = messagesByType[type] || ["commit g\xE9n\xE9rique"];
    const selectedMessage = possibleMessages[Math.floor(Math.random() * possibleMessages.length)];
    const username = this.config?.username || "anonymous";
    return `${type}: ${selectedMessage} (+${added}/-${removed}) \u2013 @${username}`;
  }
};

// src/domain/services/DiffParser.ts
var DiffParser = class {
  parse(diff, files) {
    return `\u{1F4DD} Modifications d\xE9tect\xE9es dans : ${files.join(", ")}`;
  }
};

// src/App/CommitCoach.ts
import inquirer from "inquirer";
var CommitCoach = class {
  constructor(configPath) {
    this.configPath = configPath;
    this.gitService = new GitService();
  }
  async run() {
    const config = await loadConfig(this.configPath);
    const username = config.username || await this.gitService.getUsername();
    const builder = new MessageBuilder({ username });
    const diff = await this.gitService.getStagedDiff();
    const files = await this.gitService.getStagedFiles();
    if (!files.length) {
      console.log("\u274C Aucun fichier en staging. Utilisez `git add` avant de committer.");
      return;
    }
    const summary = new DiffParser().parse(diff, files);
    const message = await builder.generate(summary);
    const { finalMessage } = await inquirer.prompt([
      {
        type: "input",
        name: "finalMessage",
        message: "\u2705 Proposez ou modifiez le message de commit :",
        default: message
      }
    ]);
    const { confirm } = await inquirer.prompt([
      {
        type: "confirm",
        name: "confirm",
        message: "\u2705 Souhaitez-vous valider ce message ?",
        default: true
      }
    ]);
    if (confirm) {
      await this.gitService.commitMessage(finalMessage);
      console.log("\u2705 Commit effectu\xE9 avec succ\xE8s !");
    } else {
      console.log("\u274C Commit annul\xE9.");
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
