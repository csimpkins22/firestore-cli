import { describe, expect, it } from "vitest";

import { createFirestoreClient } from "../src/core/firestore.js";

const shouldRun = Boolean(process.env.FIRESTORE_EMULATOR_HOST && process.env.RUN_FIRESTORE_EMULATOR_TESTS);

describe.runIf(shouldRun)("emulator integration", () => {
  it("can read seeded documents from the emulator", async () => {
    const firestore = createFirestoreClient({
      databaseId: "(default)",
      emulatorHost: process.env.FIRESTORE_EMULATOR_HOST ?? "127.0.0.1:8080",
      mode: "emulator",
      projectId: "demo-project",
    });

    await firestore.doc("users/ada").set({
      name: "Ada",
      role: "engineer",
    });

    const snapshot = await firestore.doc("users/ada").get();
    expect(snapshot.exists).toBe(true);
    expect(snapshot.data()?.name).toBe("Ada");
  });
});
