import { z } from "zod";

export const profileSchema = z.discriminatedUnion("mode", [
  z.object({
    credentialsPath: z.string().min(1),
    databaseId: z.string().min(1).default("(default)"),
    mode: z.literal("cloud"),
    projectId: z.string().min(1),
  }),
  z.object({
    databaseId: z.string().min(1).default("(default)"),
    emulatorHost: z.string().min(1),
    mode: z.literal("emulator"),
    projectId: z.string().min(1),
  }),
]);

export const configSchema = z.object({
  defaultProfile: z.string().optional(),
  profiles: z.record(profileSchema).default({}),
  version: z.literal(1).default(1),
});

export type FirestoreProfile = z.infer<typeof profileSchema>;
export type FirestoreCliConfig = z.infer<typeof configSchema>;

export interface SerializedDocument {
  createTime?: string;
  data: Record<string, unknown>;
  id: string;
  path: string;
  updateTime?: string;
}
