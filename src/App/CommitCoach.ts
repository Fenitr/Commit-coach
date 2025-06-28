import { loadConfig } from "../config/ConfigLoader";
import { GitService } from "../infrastructure/GitService";
import { MessageBuilder } from "../domain/services/MessageBuilder";
import { DiffParser } from "../domain/services/DiffParser"
import inquirer from "inquirer";

export class CommitCoach {
    private gitService = new GitService();

    constructor(private configPath: string) { }

    async run(): Promise<void> {
        const config = await loadConfig(this.configPath);
        const username = config.username || await this.gitService.getUsername();

        const builder = new MessageBuilder({ username });
        const diff = await this.gitService.getStagedDiff();
        const files = await this.gitService.getStagedFiles();

        if (!files.length) {
            console.log("❌ Aucun fichier en staging. Utilisez `git add` avant de committer.");
            return;
        }

        const summary = new DiffParser().parse(diff, files);
        const message = await builder.generate(summary);

        const { finalMessage } = await inquirer.prompt([
            {
                type: "input",
                name: "finalMessage",
                message: "✅ Proposez ou modifiez le message de commit :",
                default: message
            }
        ]);

        const { confirm } = await inquirer.prompt([
            {
                type: "confirm",
                name: "confirm",
                message: "✅ Souhaitez-vous valider ce message ?",
                default: true
            }
        ]);

        if (confirm) {
            await this.gitService.commitMessage(finalMessage);
            console.log("✅ Commit effectué avec succès !");
        } else {
            console.log("❌ Commit annulé.");
        }
    }
}
