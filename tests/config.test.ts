import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  configPath: "",
}));

vi.mock("env-paths", () => ({
  default: () => ({
    config: state.configPath,
  }),
}));

describe("config store", () => {
  beforeEach(async () => {
    state.configPath = await mkdtemp(join(tmpdir(), "firestore-cli-test-"));
  });

  afterEach(() => {
    vi.resetModules();
  });

  it("persists and resolves profiles", async () => {
    const { addProfile, getConfigPath, loadConfig, resolveProfile } = await import("../src/core/config.js");

    await addProfile("dev", {
      credentialsPath: "/tmp/service-account.json",
      databaseId: "(default)",
      mode: "cloud",
      projectId: "demo-project",
    });

    const config = await loadConfig();
    expect(config.defaultProfile).toBe("dev");
    expect(await readFile(getConfigPath(), "utf8")).toContain("\"dev\"");

    const resolved = await resolveProfile();
    expect(resolved.name).toBe("dev");
    expect(resolved.profile.projectId).toBe("demo-project");
  });
});
