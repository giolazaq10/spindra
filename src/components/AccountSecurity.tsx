import { useState } from "react";
import QRCode from "qrcode";
import { supabase } from "@/lib/supabase";
export default function AccountSecurity({
  onVerified,
}: {
  onVerified?: () => void;
}) {
  const [factor, setFactor] = useState(""),
    [qr, setQr] = useState(""),
    [code, setCode] = useState(""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  async function start() {
    setBusy(true);
    setMessage("");
    try {
      const list = await supabase.auth.mfa.listFactors();
      if (list.error) throw list.error;
      const existing = list.data.totp.find((f) => f.status === "verified");
      if (existing) {
        setFactor(existing.id);
        setMessage("Enter your current authenticator code.");
      } else {
        for (const f of list.data.totp.filter((f) => f.status === "unverified"))
          await supabase.auth.mfa.unenroll({ factorId: f.id });
        const enrolled = await supabase.auth.mfa.enroll({
          factorType: "totp",
          friendlyName: "Spindra wallet",
        });
        if (enrolled.error) throw enrolled.error;
        setFactor(enrolled.data.id);
        setQr(await QRCode.toDataURL(enrolled.data.totp.uri));
        setMessage(
          "Scan with your authenticator, then enter its six-digit code. Keep your authenticator backed up.",
        );
      }
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Security setup failed");
    } finally {
      setBusy(false);
    }
  }
  async function verify() {
    setBusy(true);
    try {
      const result = await supabase.auth.mfa.challengeAndVerify({
        factorId: factor,
        code,
      });
      if (result.error) throw result.error;
      setQr("");
      setFactor("");
      setCode("");
      setMessage("Two-factor authentication verified for this session.");
      onVerified?.();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Verification failed");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="bank-security">
      <h3>Two-factor security</h3>
      <p>Required for withdrawals and admin controls.</p>
      {message && <p role="status">{message}</p>}
      {qr && (
        <img
          width="180"
          height="180"
          src={qr}
          alt="Authenticator enrollment QR code"
        />
      )}
      {factor ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void verify();
          }}
        >
          <label>
            Authenticator code
            <input
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6}"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
            />
          </label>
          <button
            className="button primary"
            disabled={busy || code.length !== 6}
          >
            Verify code
          </button>
        </form>
      ) : (
        <button
          className="button secondary"
          onClick={() => void start()}
          disabled={busy}
        >
          Set up / verify authenticator
        </button>
      )}
    </div>
  );
}
