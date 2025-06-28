/**
 * Génère un message de commit enrichi basé sur les fichiers modifiés.
 */
export class MessageBuilder {
  constructor(private config: { username: string }) {}

  /**
   * Génère un message de commit localement à partir du diff Git.
   * @param summary Résumé du diff Git (texte brut).
   * @returns Un message de commit intelligent avec username.
   */
  async generate(summary: string): Promise<string> {
    const added = (summary.match(/^\+[^+]/gm) || []).length;
    const removed = (summary.match(/^-[^-]/gm) || []).length;

    // Type de commit
    let type = "chore";
    if (/test/i.test(summary)) type = "test";
    else if (/fix/i.test(summary)) type = "fix";
    else if (/feature|feat/i.test(summary)) type = "feat";
    else if (/refactor/i.test(summary)) type = "refactor";
    else if (/docs?/i.test(summary)) type = "docs";
    else if (/style/i.test(summary)) type = "style";

    // Génération de message personnalisé selon le type
    const messagesByType: Record<string, string[]> = {
      feat: [
        "✨ Nouvelle fonctionnalité ajoutée",
        "🚀 Ajout d'une nouvelle capacité",
        "feat: amélioration du produit",
      ],
      fix: [
        "🐛 Correction d’un bug",
        "fix: réparation d’un comportement inattendu",
        "🔧 Résolution de problème sur le code",
      ],
      test: [
        "🧪 Ajout ou modification des tests",
        "test: couverture étendue",
        "✅ Mise à jour des tests unitaires",
      ],
      docs: [
        "📝 Mise à jour de la documentation",
        "docs: amélioration du README ou commentaires",
        "📚 Contenu documentaire enrichi",
      ],
      style: [
        "💄 Changement de formatage / indentation",
        "style: mise en conformité avec les règles de lint",
        "🎨 Ajustement stylistique du code",
      ],
      refactor: [
        "♻️ Refactorisation du code sans changement de comportement",
        "refactor: amélioration interne",
        "🔨 Code restructuré pour plus de clarté",
      ],
      chore: [
        "🔧 Tâche d'entretien",
        "chore: maintenance ou mise à jour technique",
        "📦 MAJ dépendances ou outils",
      ],
    };

    const possibleMessages = messagesByType[type] || ["commit générique"];
    const selectedMessage = possibleMessages[Math.floor(Math.random() * possibleMessages.length)];

    // Message final
    return `${type}: ${selectedMessage} (+${added}/-${removed}) – @${this.config.username}`;
  }
}
