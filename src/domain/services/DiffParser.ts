export class DiffParser {
  parse(diff: string, files: string[]): string {
    return `📝 Modifications détectées dans : ${files.join(", ")}`;
  }
}
