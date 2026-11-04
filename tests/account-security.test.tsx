import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { JSDOM } from "jsdom";
import { supabase } from "../src/lib/supabase";
import QRCode from "../src/lib/vendor/qr-code.js";
const dom = new JSDOM("<!doctype html><html><body></body></html>", {
  url: "https://fixture.invalid",
});
Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  HTMLElement: dom.window.HTMLElement,
  Element: dom.window.Element,
});
Object.defineProperty(globalThis, "navigator", {
  configurable: true,
  value: dom.window.navigator,
});
const { render, fireEvent, screen, act, cleanup } =
  await import("@testing-library/react");
const { default: AccountSecurity } =
  await import("../src/components/AccountSecurity");
for (const scenario of ["verified", "unfinished", "cleanup-error"] as const)
  test("authenticator setup safely handles " + scenario, async (t) => {
    const calls: string[] = [];
    const all = [
      { id: "old-totp", factor_type: "totp", status: "unverified" },
      { id: "phone", factor_type: "phone", status: "unverified" },
      ...(scenario === "verified"
        ? [{ id: "verified-totp", factor_type: "totp", status: "verified" }]
        : []),
    ];
    t.mock.method(supabase.auth.mfa, "listFactors", async () => ({
      data: {
        all,
        totp: all.filter(
          (f) => f.factor_type === "totp" && f.status === "verified",
        ),
        phone: [],
      },
      error: null,
    }));
    t.mock.method(supabase.auth.mfa, "unenroll", async ({ factorId }) => {
      calls.push("remove:" + factorId);
      return {
        data: null,
        error:
          scenario === "cleanup-error"
            ? new Error("Unable to remove unfinished enrollment")
            : null,
      };
    });
    t.mock.method(supabase.auth.mfa, "enroll", async () => {
      calls.push("enroll");
      return {
        data: { id: "new-totp", totp: { uri: "otpauth://fixture" } },
        error: null,
      };
    });
    t.mock.method(
      QRCode,
      "toDataURL",
      async () => "data:image/png;base64,fixture",
    );
    t.mock.method(supabase.auth.mfa, "challengeAndVerify", async (args) => {
      calls.push("verify:" + args.factorId);
      return { data: {}, error: null };
    });
    render(<AccountSecurity />);
    await act(async () =>
      fireEvent.click(
        screen.getByRole("button", { name: "Set up / verify authenticator" }),
      ),
    );
    if (scenario === "cleanup-error") {
      assert.deepEqual(calls, ["remove:old-totp"]);
      assert.match(screen.getByRole("status").textContent!, /Unable to remove/);
    } else {
      assert.deepEqual(
        calls,
        scenario === "verified" ? [] : ["remove:old-totp", "enroll"],
      );
      fireEvent.change(screen.getByLabelText("Authenticator code"), {
        target: { value: "123456" },
      });
      await act(async () =>
        fireEvent.click(screen.getByRole("button", { name: "Verify code" })),
      );
      assert.equal(
        calls.at(-1),
        "verify:" + (scenario === "verified" ? "verified-totp" : "new-totp"),
      );
      assert.match(
        screen.getByRole("status").textContent!,
        /verified for this session/,
      );
    }
    cleanup();
    await supabase.auth.stopAutoRefresh();
  });
