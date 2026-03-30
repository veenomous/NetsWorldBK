"use client";

import { useState, useEffect } from "react";
import { getNetsTeam, getOtherTeams, formatSalary, type NBAPlayer, type NBATeam, type DraftPick } from "@/data/rosters";
import { checkTradeValidity } from "@/lib/tradeRules";
import { supabase, getVisitorId } from "@/lib/supabase";

interface SavedTrade {
  id: string;
  nets_send: { name: string; salary: number }[];
  nets_receive: { name: string; salary: number }[];
  other_team: string;
  is_valid: boolean;
  author: string;
  upvotes: number;
  downvotes: number;
  created_at: string;
}

export default function TradeMachine() {
  const nets = getNetsTeam();
  const otherTeams = getOtherTeams();

  const [step, setStep] = useState(0);
  const [otherTeam, setOtherTeam] = useState<NBATeam | null>(null);
  const [netsSend, setNetsSend] = useState<NBAPlayer[]>([]);
  const [netsReceive, setNetsReceive] = useState<NBAPlayer[]>([]);
  const [picksSend, setPicksSend] = useState<DraftPick[]>([]);
  const [picksReceive, setPicksReceive] = useState<DraftPick[]>([]);
  const [author, setAuthor] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Community trades
  const [communityTrades, setCommunityTrades] = useState<SavedTrade[]>([]);
  const [tradeVotes, setTradeVotes] = useState<Record<string, string>>({});

  useEffect(() => {
    loadCommunityTrades();
  }, []);

  async function loadCommunityTrades() {
    const visitorId = getVisitorId();
    const [tradesRes, votesRes] = await Promise.all([
      supabase.from("trades").select("*").order("created_at", { ascending: false }).limit(10),
      supabase.from("trade_votes").select("trade_id, vote_type").eq("visitor_id", visitorId),
    ]);
    if (tradesRes.data) setCommunityTrades(tradesRes.data);
    if (votesRes.data) {
      const map: Record<string, string> = {};
      votesRes.data.forEach((v: any) => { map[v.trade_id] = v.vote_type; });
      setTradeVotes(map);
    }
  }

  const outSalary = netsSend.reduce((a, p) => a + p.salary, 0);
  const inSalary = netsReceive.reduce((a, p) => a + p.salary, 0);
  const validity = checkTradeValidity(outSalary, inSalary);

  const togglePick = (pick: DraftPick, side: "send" | "receive") => {
    if (side === "send") {
      setPicksSend((prev) =>
        prev.find((p) => p.label === pick.label) ? prev.filter((p) => p.label !== pick.label) : [...prev, pick]
      );
    } else {
      setPicksReceive((prev) =>
        prev.find((p) => p.label === pick.label) ? prev.filter((p) => p.label !== pick.label) : [...prev, pick]
      );
    }
  };

  const togglePlayer = (player: NBAPlayer, side: "send" | "receive") => {
    if (side === "send") {
      setNetsSend((prev) =>
        prev.find((p) => p.name === player.name)
          ? prev.filter((p) => p.name !== player.name)
          : [...prev, player]
      );
    } else {
      setNetsReceive((prev) =>
        prev.find((p) => p.name === player.name)
          ? prev.filter((p) => p.name !== player.name)
          : [...prev, player]
      );
    }
  };

  const handleSubmit = async () => {
    if (!validity.valid || submitting) return;
    setSubmitting(true);
    const visitorId = getVisitorId();

    const sendData = [
      ...netsSend.map((p) => ({ name: p.name, salary: p.salary, type: "player" })),
      ...picksSend.map((p) => ({ name: p.label, salary: 0, type: "pick" })),
    ];
    const receiveData = [
      ...netsReceive.map((p) => ({ name: p.name, salary: p.salary, type: "player" })),
      ...picksReceive.map((p) => ({ name: p.label, salary: 0, type: "pick" })),
    ];

    const { data } = await supabase.from("trades").insert({
      nets_send: sendData,
      nets_receive: receiveData,
      other_team: otherTeam?.abbrev || "",
      nets_salary_out: outSalary,
      nets_salary_in: inSalary,
      is_valid: true,
      author: author.trim() || "Anonymous",
      visitor_id: visitorId,
    }).select().single();

    if (data) {
      setCommunityTrades((prev) => [data, ...prev]);
      setSubmitted(true);
    }
    setSubmitting(false);
  };

  const voteTrade = async (tradeId: string, voteType: "up" | "down") => {
    if (tradeVotes[tradeId]) return;
    const visitorId = getVisitorId();

    setTradeVotes((prev) => ({ ...prev, [tradeId]: voteType }));
    setCommunityTrades((prev) =>
      prev.map((t) =>
        t.id === tradeId
          ? { ...t, upvotes: t.upvotes + (voteType === "up" ? 1 : 0), downvotes: t.downvotes + (voteType === "down" ? 1 : 0) }
          : t
      )
    );

    await supabase.from("trade_votes").insert({ trade_id: tradeId, vote_type: voteType, visitor_id: visitorId });
    const trade = communityTrades.find((t) => t.id === tradeId);
    if (trade) {
      const field = voteType === "up" ? "upvotes" : "downvotes";
      await supabase.from("trades").update({ [field]: (trade[field] || 0) + 1 }).eq("id", tradeId);
    }
  };

  const reset = () => {
    setStep(0);
    setOtherTeam(null);
    setNetsSend([]);
    setNetsReceive([]);
    setPicksSend([]);
    setPicksReceive([]);
    setAuthor("");
    setSubmitted(false);
  };

  return (
    <div className="space-y-6">
      {/* Progress bar */}
      {!submitted && (
        <div className="flex gap-2 mb-4">
          {["Pick Team", "Nets Send", "They Send", "Review"].map((label, idx) => (
            <div key={label} className="flex-1">
              <div className={`h-1.5 rounded-full transition-colors ${
                idx < step ? "bg-accent-green" : idx === step ? "gradient-bg-brand" : "bg-gray-200"
              }`} />
              <p className={`text-[10px] mt-1 ${idx === step ? "text-text-primary font-bold" : "text-text-muted"}`}>{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Step 0: Pick team */}
      {step === 0 && !submitted && (
        <div className="animate-slide-up">
          <h3 className="text-lg font-black mb-1">Who are the Nets trading with?</h3>
          <p className="text-text-muted text-xs mb-4">Pick the other team</p>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            {otherTeams.map((team) => (
              <button
                key={team.abbrev}
                onClick={() => { setOtherTeam(team); setStep(1); }}
                className="p-3 rounded-xl bg-gray-100 border border-gray-200 hover:border-brand-orange/30 hover:bg-gray-100 transition-all text-center cursor-pointer"
              >
                <p className="font-bold text-sm">{team.abbrev}</p>
                <p className="text-text-muted text-[10px]">{team.name.split(" ").pop()}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 1: Nets send */}
      {step === 1 && !submitted && (
        <div className="animate-slide-up">
          <h3 className="text-lg font-black mb-1">Nets are sending...</h3>
          <p className="text-text-muted text-xs mb-4">Select players to trade away</p>
          <PlayerList players={nets.players} selected={netsSend} onToggle={(p) => togglePlayer(p, "send")} />
          {nets.picks && nets.picks.length > 0 && (
            <PickList picks={nets.picks} selected={picksSend} onToggle={(p) => togglePick(p, "send")} />
          )}
          <SalaryBar label="Outgoing salary" amount={outSalary} />
          {picksSend.length > 0 && (
            <div className="text-[11px] text-accent-gold mt-1">+ {picksSend.length} draft pick{picksSend.length > 1 ? "s" : ""}</div>
          )}
          <div className="flex justify-between mt-4">
            <button onClick={() => setStep(0)} className="text-sm text-text-muted hover:text-white transition-colors cursor-pointer">&larr; Back</button>
            <button
              onClick={() => setStep(2)}
              disabled={netsSend.length === 0 && picksSend.length === 0}
              className="px-5 py-2 rounded-xl gradient-bg-brand font-bold text-sm disabled:opacity-30 transition-all cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Other team sends */}
      {step === 2 && otherTeam && !submitted && (
        <div className="animate-slide-up">
          <h3 className="text-lg font-black mb-1">{otherTeam.name} are sending...</h3>
          <p className="text-text-muted text-xs mb-4">Select players Nets receive</p>
          <PlayerList players={otherTeam.players} selected={netsReceive} onToggle={(p) => togglePlayer(p, "receive")} />
          {otherTeam.picks && otherTeam.picks.length > 0 && (
            <PickList picks={otherTeam.picks} selected={picksReceive} onToggle={(p) => togglePick(p, "receive")} />
          )}
          <SalaryBar label="Incoming salary" amount={inSalary} />
          {picksReceive.length > 0 && (
            <div className="text-[11px] text-accent-gold mt-1">+ {picksReceive.length} draft pick{picksReceive.length > 1 ? "s" : ""}</div>
          )}

          {/* Live validity check */}
          {netsSend.length > 0 && netsReceive.length > 0 && (
            <div className={`mt-3 p-3 rounded-xl text-sm font-medium ${
              validity.valid ? "bg-accent-green/10 text-accent-green" : "bg-accent-red/10 text-accent-red"
            }`}>
              {validity.valid ? "✓" : "✗"} {validity.message}
            </div>
          )}

          <div className="flex justify-between mt-4">
            <button onClick={() => setStep(1)} className="text-sm text-text-muted hover:text-white transition-colors cursor-pointer">&larr; Back</button>
            <button
              onClick={() => setStep(3)}
              disabled={netsReceive.length === 0}
              className="px-5 py-2 rounded-xl gradient-bg-brand font-bold text-sm disabled:opacity-30 transition-all cursor-pointer"
            >
              Review Trade
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Review */}
      {step === 3 && otherTeam && !submitted && (
        <div className="animate-slide-up">
          <h3 className="text-lg font-black mb-4">Review Trade</h3>

          <div className="grid grid-cols-2 gap-4 mb-4">
            {/* Nets send */}
            <div className="p-4 rounded-xl bg-accent-red/5 border border-accent-red/20">
              <p className="text-xs font-bold text-accent-red mb-2">NETS SEND</p>
              {netsSend.map((p) => (
                <div key={p.name} className="flex justify-between text-sm mb-1">
                  <span>{p.name}</span>
                  <span className="text-text-muted">{formatSalary(p.salary)}</span>
                </div>
              ))}
              {picksSend.map((p) => (
                <div key={p.label} className="flex justify-between text-sm mb-1">
                  <span className="text-accent-gold">{p.label}</span>
                  <span className="text-accent-gold text-[10px]">PICK</span>
                </div>
              ))}
              <div className="border-t border-gray-200 mt-2 pt-2 flex justify-between text-sm font-bold">
                <span>Salary</span>
                <span>{formatSalary(outSalary)}</span>
              </div>
            </div>

            {/* Nets receive */}
            <div className="p-4 rounded-xl bg-accent-green/5 border border-accent-green/20">
              <p className="text-xs font-bold text-accent-green mb-2">NETS RECEIVE</p>
              {netsReceive.map((p) => (
                <div key={p.name} className="flex justify-between text-sm mb-1">
                  <span>{p.name}</span>
                  <span className="text-text-muted">{formatSalary(p.salary)}</span>
                </div>
              ))}
              {picksReceive.map((p) => (
                <div key={p.label} className="flex justify-between text-sm mb-1">
                  <span className="text-accent-gold">{p.label}</span>
                  <span className="text-accent-gold text-[10px]">PICK</span>
                </div>
              ))}
              <div className="border-t border-gray-200 mt-2 pt-2 flex justify-between text-sm font-bold">
                <span>Salary</span>
                <span>{formatSalary(inSalary)}</span>
              </div>
            </div>
          </div>

          {/* Validity */}
          <div className={`p-3 rounded-xl text-sm font-bold text-center ${
            validity.valid ? "bg-accent-green/10 text-accent-green" : "bg-accent-red/10 text-accent-red"
          }`}>
            {validity.valid ? "✓ " : "✗ "}{validity.message}
          </div>

          {/* Author + Submit */}
          <div className="flex items-center gap-3 mt-4">
            <input
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="Your name (optional)"
              maxLength={20}
              className="flex-1 bg-gray-100 rounded-lg px-3 py-2 text-[13px] text-text-primary placeholder:text-text-muted outline-none"
            />
            <button
              onClick={handleSubmit}
              disabled={!validity.valid || submitting}
              className="px-5 py-2 rounded-xl gradient-bg-brand font-bold text-sm disabled:opacity-30 transition-all cursor-pointer"
            >
              {submitting ? "Saving..." : "Submit Trade"}
            </button>
          </div>

          <button onClick={() => setStep(2)} className="text-sm text-text-muted hover:text-white transition-colors mt-3 cursor-pointer">
            &larr; Back
          </button>
        </div>
      )}

      {/* Submitted */}
      {submitted && (
        <div className="animate-slide-up text-center py-6">
          <p className="text-2xl font-black gradient-text-brand">Trade Submitted!</p>
          <p className="text-text-muted text-sm mt-2">See how other fans vote on your trade below.</p>
          <button onClick={reset} className="mt-4 px-5 py-2 rounded-xl gradient-bg-brand font-bold text-sm transition-all cursor-pointer">
            Build Another Trade
          </button>
        </div>
      )}

      {/* Community Trades */}
      {communityTrades.length > 0 && (
        <div className="mt-6">
          <h3 className="font-bold text-[15px] mb-3">Recent Fan Trades</h3>
          <div className="space-y-3">
            {communityTrades.map((trade) => {
              const vote = tradeVotes[trade.id];
              const total = trade.upvotes + trade.downvotes;
              const pct = total > 0 ? Math.round((trade.upvotes / total) * 100) : 50;

              return (
                <div key={trade.id} className="p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-text-muted">@{trade.author}</span>
                      <span className={`tag ${trade.is_valid ? "tag-green" : "tag-red"}`}>
                        {trade.is_valid ? "Valid" : "Invalid"}
                      </span>
                      <span className="tag tag-blue">BKN ↔ {trade.other_team}</span>
                    </div>
                    <span className="text-[11px] text-text-muted">{timeAgo(trade.created_at)}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs mb-3">
                    <div>
                      <p className="text-accent-red font-bold text-[10px] mb-1">NETS SEND</p>
                      {(trade.nets_send as any[]).map((p: any) => (
                        <p key={p.name} className="text-text-secondary">{p.name} <span className="text-text-muted">({formatSalary(p.salary)})</span></p>
                      ))}
                    </div>
                    <div>
                      <p className="text-accent-green font-bold text-[10px] mb-1">NETS RECEIVE</p>
                      {(trade.nets_receive as any[]).map((p: any) => (
                        <p key={p.name} className="text-text-secondary">{p.name} <span className="text-text-muted">({formatSalary(p.salary)})</span></p>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => voteTrade(trade.id, "up")}
                      disabled={!!vote}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all ${
                        vote === "up" ? "bg-accent-green/15 text-accent-green" : "bg-gray-100 text-text-secondary hover:bg-accent-green/10 hover:text-accent-green"
                      } ${vote ? "cursor-default" : "cursor-pointer"}`}
                    >
                      &#128077; {trade.upvotes}
                    </button>
                    <button
                      onClick={() => voteTrade(trade.id, "down")}
                      disabled={!!vote}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all ${
                        vote === "down" ? "bg-accent-red/15 text-accent-red" : "bg-gray-100 text-text-secondary hover:bg-accent-red/10 hover:text-accent-red"
                      } ${vote ? "cursor-default" : "cursor-pointer"}`}
                    >
                      &#128078; {trade.downvotes}
                    </button>
                    {vote && total > 0 && (
                      <span className="text-[11px] text-text-muted ml-auto">{pct}% approve</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// Sub-components

function PlayerList({ players, selected, onToggle }: { players: NBAPlayer[]; selected: NBAPlayer[]; onToggle: (p: NBAPlayer) => void }) {
  return (
    <div className="space-y-1 max-h-[300px] overflow-y-auto">
      {players.map((p) => {
        const isSelected = selected.some((s) => s.name === p.name);
        return (
          <button
            key={p.name}
            onClick={() => onToggle(p)}
            className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all cursor-pointer ${
              isSelected
                ? "bg-brand-orange/10 border border-brand-orange/30"
                : "bg-gray-50 border border-transparent hover:bg-gray-100"
            }`}
          >
            <div className="flex items-center gap-2">
              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center text-[10px] ${
                isSelected ? "border-brand-orange bg-brand-orange text-white" : "border-gray-300"
              }`}>
                {isSelected && "✓"}
              </div>
              <div>
                <p className="text-sm font-medium">{p.name}</p>
                <p className="text-text-muted text-[11px]">{p.position} · {p.stats}</p>
              </div>
            </div>
            <span className="text-text-muted text-xs font-mono">{formatSalary(p.salary)}</span>
          </button>
        );
      })}
    </div>
  );
}

function PickList({ picks, selected, onToggle }: { picks: DraftPick[]; selected: DraftPick[]; onToggle: (p: DraftPick) => void }) {
  return (
    <div className="mt-3">
      <p className="text-[11px] text-accent-gold font-bold uppercase tracking-wider mb-1.5">Draft Picks</p>
      <div className="space-y-1">
        {picks.map((p) => {
          const isSelected = selected.some((s) => s.label === p.label);
          return (
            <button
              key={p.label}
              onClick={() => onToggle(p)}
              className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all cursor-pointer ${
                isSelected
                  ? "bg-accent-gold/10 border border-accent-gold/30"
                  : "bg-gray-50 border border-transparent hover:bg-gray-100"
              }`}
            >
              <div className="flex items-center gap-2">
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center text-[10px] ${
                  isSelected ? "border-accent-gold bg-accent-gold text-white" : "border-gray-300"
                }`}>
                  {isSelected && "✓"}
                </div>
                <div>
                  <p className="text-sm font-medium text-accent-gold">{p.label}</p>
                  {p.protection && <p className="text-text-muted text-[10px]">{p.protection}</p>}
                </div>
              </div>
              <span className="tag tag-gold text-[9px]">{p.round === 1 ? "1st" : "2nd"} Round</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SalaryBar({ label, amount }: { label: string; amount: number }) {
  return (
    <div className="flex items-center justify-between mt-3 p-2.5 rounded-lg bg-gray-100">
      <span className="text-text-muted text-xs">{label}</span>
      <span className="font-bold text-sm">{formatSalary(amount)}</span>
    </div>
  );
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}
