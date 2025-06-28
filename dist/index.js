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
    return `\u{1F4DD} Modifications d\xE9tect\xE9es dans : ${files.join(", ")}`;
  }
};

// src/domain/services/MessageBuilder.ts
var MessageBuilder = class {
  constructor(config) {
    this.config = config;
  }
  /**
   * Génère un message de commit localement à partir du diff Git.
   * @param summary Résumé du diff Git (texte brut).
   * @returns Un message de commit intelligent avec username.
   */
  async generate(summary) {
    const added = (summary.match(/^\+[^+]/gm) || []).length;
    const removed = (summary.match(/^-[^-]/gm) || []).length;
    let type = "chore";
    if (/test/i.test(summary)) type = "test";
    else if (/fix/i.test(summary)) type = "fix";
    else if (/feature|feat/i.test(summary)) type = "feat";
    else if (/refactor/i.test(summary)) type = "refactor";
    else if (/docs?/i.test(summary)) type = "docs";
    else if (/style/i.test(summary)) type = "style";
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
    return `${type}: ${selectedMessage} (+${added}/-${removed}) \u2013 @${this.config.username}`;
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
