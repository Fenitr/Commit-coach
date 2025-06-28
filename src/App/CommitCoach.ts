// Charge automatiquement les variables d'environnement depuis .env
import "dotenv/config";

// Import des services du projet
import { GitService } from "../infrastructure/GitService";
import { DiffParser } from "../domain/services/DiffParser";
import { MessageBuilder } from "../domain/services/MessageBuilder";
import { loadConfig } from "../config/ConfigLoader";

// Fonctions utilitaires d'interaction utilisateur
import { askToConfirm, askForMessage } from "../utils/PromptUtils";

/**
 * Classe principale du projet : orchestre le processus de génération de commit.
 */
export class CommitCoach {
    constructor(private configPath: string) { }

    /**
     * Lance le processus complet :
     * - Récupère la config
     * - Récupère les changements Git
     * - Génère un résumé + un message avec l'IA
     * - Demande validation à l'utilisateur
     * - Exécute le commit final
     */
    async run(): Promise<void> {
        try {
            // 1. Chargement de la configuration (.commitcoachrc.json ou autre)
            const config = await loadConfig(this.configPath);

            // 2. Initialisation des services
            const git = new GitService();
            const diffParser = new DiffParser();
            const messageBuilder = new MessageBuilder(config);

            // 3. Récupération des modifications en attente (staged)
            const diff = await git.getStagedDiff();
            const files = await git.getStagedFiles();

            // 4. Analyse du diff pour créer un résumé lisible
            const summary = diffParser.parse(diff, files);

            // 5. Génération du message de commit via OpenAI
            const generatedMsg = await messageBuilder.generate(summary);

            // 6. Interaction : possibilité de modifier le message
            const finalMsg = await askForMessage(generatedMsg);

            // 7. Confirmation de l'utilisateur avant de faire le commit
            const confirmed = await askToConfirm("Souhaitez-vous valider ce message ?");

            // 8. Commit ou annulation
            if (confirmed) {
                await git.commitMessage(finalMsg);
                console.log("✅ Commit effectué avec succès !");
            } else {
                console.log("❌ Commit annulé par l'utilisateur.");
            }

        } catch (error) {
            console.error("🚨 Une erreur est survenue :", error);
        }
    }
}
