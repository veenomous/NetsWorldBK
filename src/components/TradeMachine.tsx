"use client";

import { useState, useEffect } from "react";
import { getNetsTeam, getOtherTeams, formatSalary, type NBAPlayer, type NBATeam, type DraftPick } from "@/data/rosters";
import { checkTradeValidity } from "@/lib/tradeRules";
import { supabase, getVisitorId } from "@/lib/supabase";
import { useSession } from "next-auth/react";
import ShareOnX from "@/components/ShareOnX";

const netsTeam = getNetsTeam();
const otherTeams = getOtherTeams();

export default function TradeMachine() {
  const { data: session } = useSession();
  const xHandle = (session?.user as { xHandle?: string })?.xHandle;

  // State
  const [otherTeam, setOtherTeam] = useState<NBATeam | null>(null);
  const [netsSend, setNetsSend] = useState<NBAPlayer[]>([]);
  const [netsReceive, setNetsReceive] = useState<NBAPlayer[]>([]);
  const [picksSend, setPicksSend] = useState<DraftPick[]>([]);
  const [picksReceive, setPicksReceive] = useState<DraftPick[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Salary calculations
  const outSalary = netsSend.reduce((s, p) => s + p.salary, 0);
  const inSalary = netsReceive.reduce((s, p) => s + p.salary, 0);
  const validity = outSalary > 0 && inSalary > 0 ? checkTradeValidity(outSalary, inSalary) : null;
  const salaryDiff = inSalary - outSalary;

  function togglePlayer(player: NBAPlayer, side: "send" | "receive") {
    if (side === "send") {
      setNetsSend((prev) => prev.some((p) => p.name === player.name) ? prev.filter((p) => p.name !== player.name) : [...prev, player]);
    } else {
      setNetsReceive((prev) => prev.some((p) => p.name === player.name) ? prev.filter((p) => p.name !== player.name) : [...prev, player]);
    }
  }

  function togglePick(pick: DraftPick, side: "send" | "receive") {
    if (side === "send") {
      setPicksSend((prev) => prev.some((p) => p.label === pick.label) ? prev.filter((p) => p.label !== pick.label) : [...prev, pick]);
    } else {
      setPicksReceive((prev) => prev.some((p) => p.label === pick.label) ? prev.filter((p) => p.label !== pick.label) : [...prev, pick]);
    }
  }

  function reset() {
    setOtherTeam(null);
    setNetsSend([]);
    setNetsReceive([]);
    setPicksSend([]);
    setPicksReceive([]);
    setSubmitted(false);
  }

  async function handleSubmit() {
    if (!validity?.valid) return;
    setSubmitting(true);
    await supabase.from("trades").insert({
      nets_send: netsSend.map((p) => ({ name: p.name, salary: p.salary })),
      nets_receive: netsReceive.map((p) => ({ name: p.name, salary: p.salary })),
      other_team: otherTeam?.abbrev || "",
      is_valid: true,
      author: xHandle || "Anonymous",
      upvotes: 0,
      downvotes: 0,
    });
    setSubmitting(false);
    setSubmitted(true);
  }

  // ─── Team Selection ───
  if (!otherTeam) {
    return (
      <div>
        <header className="px-6 sm:px-8 py-12 sm:py-16 border-b-[6px] border-black max-w-7xl mx-auto">
          <div className="inline-block bg-brand-red text-white text-[10px] font-bold px-3 py-1 mb-4 tracking-[0.2em] uppercase">
            Live Transaction Simulation
          </div>
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-black uppercase leading-[0.85] tracking-tighter font-display mb-4">
            Trade<br />Machine.
          </h1>
          <p className="max-w-2xl text-base text-black/40 leading-relaxed">
            Execute front-office simulations with real-time salary cap validation and strategic impact analysis.
          </p>
        </header>
        <div className="max-w-7xl mx-auto px-6 sm:px-8 py-10">
          <h2 className="text-2xl font-black uppercase font-display mb-6">Select Trade Partner</h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
            {otherTeams.map((team) => (
              <button
                key={team.abbrev}
                onClick={() => setOtherTeam(team)}
                className="bg-white border border-gray-200 p-4 text-center hover:border-accent-blue hover:bg-accent-blue/5 transition-all group"
              >
                <div className="text-lg font-black font-display group-hover:text-accent-blue">{team.abbrev}</div>
                <div className="text-[9px] text-black/30 uppercase tracking-wider">{team.name}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ─── Trade Builder ───
  return (
    <div>
      <header className="px-6 sm:px-8 py-8 border-b-[6px] border-black max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <div className="inline-block bg-brand-red text-white text-[10px] font-bold px-3 py-1 mb-3 tracking-[0.2em] uppercase">
            Live Transaction Simulation
          </div>
          <h1 className="text-4xl sm:text-5xl font-black uppercase leading-[0.85] tracking-tighter font-display">
            Trade Machine.
          </h1>
        </div>
        <button onClick={reset} className="bg-gray-100 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.15em] hover:bg-brand-red hover:text-white transition-colors">
          Start Over
        </button>
      </header>

      {submitted ? (
        <div className="max-w-7xl mx-auto px-6 sm:px-8 py-16 text-center">
          <div className="inline-flex items-center gap-2 mb-4">
            <span className="w-3 h-3 bg-accent-green animate-pulse-soft" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-accent-green">Analysis Complete</span>
          </div>
          <h2 className="text-5xl font-black uppercase font-display mb-4">Trade <span className="text-accent-green">Submitted</span>.</h2>
          <p className="text-black/40 text-sm mb-6">See how other fans vote on your trade.</p>
          <div className="flex items-center justify-center gap-3">
            <button onClick={reset} className="bg-black text-white px-6 py-3 font-black text-[11px] uppercase tracking-wider hover:bg-gray-800 transition-all">
              Build Another
            </button>
            <ShareOnX
              text={`I just built a Nets trade: sending ${netsSend.map(p => p.name.split(" ").pop()).join(", ")} to ${otherTeam.abbrev} for ${netsReceive.map(p => p.name.split(" ").pop()).join(", ")}. What do you think?`}
              url="https://bkgrit.com/trade-machine"
            />
          </div>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto">
          {/* Trade Builder Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
            {/* Team A: Brooklyn */}
            <div className="lg:col-span-5 bg-white border-l-4 border-accent-blue p-6 sm:p-8">
              <div className="flex justify-between items-end mb-6">
                <div>
                  <span className="text-[10px] font-bold uppercase text-accent-blue tracking-[0.15em]">Franchise A</span>
                  <h2 className="text-3xl font-black uppercase font-display">Brooklyn</h2>
                </div>
              </div>
              {/* Nets players */}
              <div className="space-y-2">
                {netsTeam.players.map((player) => {
                  const selected = netsSend.some((p) => p.name === player.name);
                  return (
                    <div key={player.name} onClick={() => togglePlayer(player, "send")}
                      className={`p-3 flex items-center justify-between cursor-pointer transition-colors ${selected ? "bg-accent-blue/5 border-l-2 border-accent-blue" : "bg-gray-50 hover:bg-gray-100"}`}>
                      <div>
                        <div className="font-bold text-sm uppercase font-display">{player.name}</div>
                        <div className="text-[10px] text-black/30">{player.position} | {player.stats}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold font-display">{formatSalary(player.salary)}</div>
                        {selected && <span className="text-[9px] font-bold text-accent-blue uppercase">Outgoing</span>}
                      </div>
                    </div>
                  );
                })}
                {/* Nets picks */}
                {(netsTeam.picks || []).map((pick) => {
                  const selected = picksSend.some((p) => p.label === pick.label);
                  return (
                    <div key={pick.label} onClick={() => togglePick(pick, "send")}
                      className={`p-3 flex items-center justify-between cursor-pointer border-l-2 border-dashed ${selected ? "bg-accent-blue/5 border-accent-blue" : "border-gray-200 hover:bg-gray-100"}`}>
                      <div>
                        <div className="font-bold text-sm uppercase font-display">{pick.label}</div>
                        <div className="text-[9px] text-black/30">{pick.protection || "Unprotected"}</div>
                      </div>
                      {selected && <span className="text-[9px] font-bold text-accent-blue uppercase">Outgoing</span>}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Divider */}
            <div className="lg:col-span-2 flex flex-col items-center justify-center bg-black text-white py-6 lg:py-0">
              <span className="material-symbols-outlined text-4xl mb-1">swap_horiz</span>
              <span className="font-display font-black text-lg italic uppercase tracking-[0.2em]">Versus</span>
            </div>

            {/* Team B */}
            <div className="lg:col-span-5 bg-white border-r-4 border-brand-red p-6 sm:p-8">
              <div className="flex justify-between items-end mb-6">
                <div className="text-right ml-auto">
                  <span className="text-[10px] font-bold uppercase text-brand-red tracking-[0.15em]">Franchise B</span>
                  <h2 className="text-3xl font-black uppercase font-display">{otherTeam.name.split(" ").pop()}</h2>
                </div>
              </div>
              <div className="space-y-2">
                {otherTeam.players.map((player) => {
                  const selected = netsReceive.some((p) => p.name === player.name);
                  return (
                    <div key={player.name} onClick={() => togglePlayer(player, "receive")}
                      className={`p-3 flex items-center justify-between cursor-pointer transition-colors ${selected ? "bg-brand-red/5 border-r-2 border-brand-red" : "bg-gray-50 hover:bg-gray-100"}`}>
                      <div className="text-right ml-auto">
                        <div className="text-sm font-bold font-display">{formatSalary(player.salary)}</div>
                        {selected && <span className="text-[9px] font-bold text-brand-red uppercase">Outgoing</span>}
                      </div>
                      <div className="text-right ml-4">
                        <div className="font-bold text-sm uppercase font-display">{player.name}</div>
                        <div className="text-[10px] text-black/30">{player.position} | {player.stats}</div>
                      </div>
                    </div>
                  );
                })}
                {(otherTeam.picks || []).map((pick) => {
                  const selected = picksReceive.some((p) => p.label === pick.label);
                  return (
                    <div key={pick.label} onClick={() => togglePick(pick, "receive")}
                      className={`p-3 flex items-center justify-between cursor-pointer border-r-2 border-dashed ${selected ? "bg-brand-red/5 border-brand-red" : "border-gray-200 hover:bg-gray-100"}`}>
                      {selected && <span className="text-[9px] font-bold text-brand-red uppercase">Incoming</span>}
                      <div className="text-right ml-auto">
                        <div className="font-bold text-sm uppercase font-display">{pick.label}</div>
                        <div className="text-[9px] text-black/30">{pick.protection || "Unprotected"}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Trade Analysis */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 border-t-4 border-black">
            {/* Verdict */}
            <div className="lg:col-span-2 bg-white p-6 sm:p-8 border-r border-gray-200">
              {validity ? (
                <>
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`w-3 h-3 ${validity.valid ? "bg-accent-green" : "bg-brand-red"} animate-pulse-soft`} />
                    <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${validity.valid ? "text-accent-green" : "text-brand-red"}`}>
                      Analysis Complete
                    </span>
                  </div>
                  <h2 className="text-4xl sm:text-5xl font-black uppercase font-display leading-[0.85] mb-5">
                    Trade <span className={validity.valid ? "text-accent-green" : "text-brand-red"}>
                      {validity.valid ? "Valid" : "Invalid"}
                    </span>.
                  </h2>
                  <div className="border-t-2 border-gray-200 pt-4">
                    <p className="text-[10px] font-bold uppercase text-black/30 mb-1">Salary Status</p>
                    <p className="text-sm">{validity.message}</p>
                  </div>
                </>
              ) : (
                <div className="py-8">
                  <p className="text-black/15 font-display font-bold italic uppercase text-lg">Select players on both sides to analyze</p>
                </div>
              )}
            </div>

            {/* Cap Impact */}
            <div className="bg-gray-50 p-6 sm:p-8">
              <h3 className="text-lg font-black uppercase font-display mb-5 border-b-2 border-black pb-2">Cap Impact</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-[10px] font-bold uppercase mb-1">
                    <span>Brooklyn sends</span>
                    <span className="text-accent-blue">{formatSalary(outSalary)}</span>
                  </div>
                  <div className="h-6 bg-gray-200">
                    <div className="h-full bg-accent-blue transition-all" style={{ width: `${Math.min((outSalary / 60000000) * 100, 100)}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-[10px] font-bold uppercase mb-1">
                    <span>{otherTeam.name.split(" ").pop()} sends</span>
                    <span className="text-brand-red">{formatSalary(inSalary)}</span>
                  </div>
                  <div className="h-6 bg-gray-200">
                    <div className="h-full bg-brand-red transition-all" style={{ width: `${Math.min((inSalary / 60000000) * 100, 100)}%` }} />
                  </div>
                </div>
                <button
                  onClick={handleSubmit}
                  disabled={!validity?.valid || submitting}
                  className="w-full py-4 bg-black text-white font-black uppercase font-display tracking-[0.15em] text-xs hover:bg-gray-800 transition-all disabled:opacity-20 disabled:cursor-not-allowed mt-4"
                >
                  {submitting ? "Processing..." : "Execute Transaction"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
