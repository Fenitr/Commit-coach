import { Command } from "commander";
import { CommitCoach } from "../src/App/CommitCoach";

const program = new Command();

program
    .name("commit-coach")
    .description("Assistant IA pour générer un message de commit")
    .version("1.0.0")
    .option("-c, --config <path>", "Chemin du fichier de config", ".commitcoachrc.json")
    .action(async (options) => {
        const coach = new CommitCoach(options.config);
        await coach.run();
    });

program.parse();
