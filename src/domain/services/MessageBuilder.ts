/**
 * Génère un message de commit simple basé sur les fichiers modifiés.
 */
export class MessageBuilder {
  constructor(private config: any) { }

  /**
   * Génère un message de commit localement à partir des fichiers modifiés.
   * @param summary Résumé du diff Git (texte brut).
   * @returns Un message de commit simple.
   */
  async generate(summary: string): Promise<string> {
    const added = (summary.match(/^\+[^+]/gm) || []).length;
    const removed = (summary.match(/^-[^-]/gm) || []).length;

    let type = "chore";
    if (summary.includes("test")) type = "test";
    else if (summary.includes("fix")) type = "fix";
    else if (summary.includes("feature") || summary.includes("feat")) type = "feat";

    return `${type}: update files (+${added}/-${removed})`;
  }
}
