import { z } from "zod";
import { readFile } from "fs/promises";

const configSchema = z.object({
    convention: z.enum(["conventional", "gitmoji"]).optional(),
    autoCommit: z.boolean().optional(),
    username: z.string().optional()
});

export type AppConfig = z.infer<typeof configSchema>;

export async function loadConfig(path: string): Promise<AppConfig> {
    const raw = await readFile(path, "utf-8");
    const json = JSON.parse(raw);
    return configSchema.parse(json);
}
