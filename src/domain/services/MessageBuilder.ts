export class MessageBuilder {
  constructor(private config: { username: string }) { }

  async generate(summary: string): Promise<string> {
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

    const username = this.config?.username || "anonymous";
    return `${type}: ${selectedMessage} (+${added}/-${removed}) – @${username}`;
  }
}
