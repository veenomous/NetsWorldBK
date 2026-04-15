import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST() {
  const hookUrl = process.env.VERCEL_DEPLOY_HOOK;
  const ghToken = process.env.GITHUB_PAT;

  // Trigger GitHub Action
  if (ghToken) {
    try {
      const res = await fetch(
        "https://api.github.com/repos/veenomous/NetsWorldBK/actions/workflows/kb-compile.yml/dispatches",
        {
          method: "POST",
          headers: {
            Authorization: `token ${ghToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ ref: "main", inputs: { compile: "true" } }),
        }
      );
      if (res.ok) {
        return NextResponse.json({ status: "triggered", method: "github-action" });
      }
    } catch {}
  }

  // Fallback: trigger Vercel deploy hook
  if (hookUrl) {
    try {
      await fetch(hookUrl, { method: "POST" });
      return NextResponse.json({ status: "triggered", method: "vercel-hook" });
    } catch {}
  }

  return NextResponse.json({ status: "error", message: "No trigger method available. Add GITHUB_PAT or VERCEL_DEPLOY_HOOK to env." }, { status: 500 });
}
