"use strict"; function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }// bin/index.ts
var _commander = require('commander');

// src/App/CommitCoach.ts
require('dotenv/config');

// src/infrastructure/GitService.ts
var _simplegit = require('simple-git'); var _simplegit2 = _interopRequireDefault(_simplegit);
var GitService = class {
  constructor() {
    this.git = _simplegit2.default.call(void 0, );
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
var _zod = require('zod');
var _promises = require('fs/promises');
var configSchema = _zod.z.object({
  convention: _zod.z.enum(["conventional", "gitmoji"]).optional(),
  autoCommit: _zod.z.boolean().optional()
});
async function loadConfig(path) {
  const raw = await _promises.readFile.call(void 0, path, "utf-8");
  const json = JSON.parse(raw);
  return configSchema.parse(json);
}

// src/utils/PromptUtils.ts
var _prompts = require('prompts'); var _prompts2 = _interopRequireDefault(_prompts);
async function askForMessage(defaultMsg) {
  const res = await _prompts2.default.call(void 0, {
    type: "text",
    name: "message",
    message: "Proposez ou modifiez le message de commit :",
    initial: defaultMsg
  });
  return res.message;
}
async function askToConfirm(msg) {
  const res = await _prompts2.default.call(void 0, {
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
var program = new (0, _commander.Command)();
program.name("commit-coach").description("Assistant IA pour g\xE9n\xE9rer un message de commit").version("1.0.0").option("-c, --config <path>", "Chemin du fichier de config", ".commitcoachrc.json").action(async (options) => {
  const coach = new CommitCoach(options.config);
  await coach.run();
});
program.parse();
