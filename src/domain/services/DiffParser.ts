export class DiffParser {
    parse(diff: string, files: string[]): string {
      return `Modifications détectées dans les fichiers : ${files.join(", ")}`;
    }
  }
  