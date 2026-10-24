"use client";

import { BadgeCheck, ListChecks, MessageSquare, PiggyBank, Receipt, SlidersHorizontal, Wallet } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { isAddress, isHex, parseEther, type Address, type Hex } from "viem";
import { useAccount, usePublicClient, useReadContracts } from "wagmi";
import { Amount } from "@/components/ui/Amount";
import { ArrowButton } from "@/components/ui/Button";
import { Chip, DemoBadge } from "@/components/ui/Chip";
import { Jebi } from "@/components/ui/Jebi";
import { Melt } from "@/components/ui/Melt";
import { monadTestnet } from "@/config/chains";
import { SUPPLIERS, VAULT_ADDRESS, VAULT_READY, vaultAbi } from "@/config/vault";
import { useNow } from "@/hooks/useNow";
import { useVaultConfig } from "@/hooks/useVaultConfig";
import { useVaultStatus } from "@/hooks/useVaultStatus";
import { useVaultWrite } from "@/hooks/useVaultWrite";
import { formatDate, shortAddress, txUrl } from "@/utils/format";

const REPUTATION_REGISTRY = "0x8004B663056A597Dffe9eCcC1965A193B7388713";

const fieldCls =
  "h-11 w-full rounded-2xl bg-field px-4 text-sm outline-none placeholder:text-ink-3 focus-visible:ring-2 focus-visible:ring-orange disabled:cursor-not-allowed";
const btnCls = (dark = true) =>
  `h-10 rounded-full px-[18px] text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
    dark ? "bg-navy text-white hover:bg-[#1a2a55]" : "bg-field text-navy hover:bg-[#ECE6DC]"
  }`;

function Card({ title, icon, children, className = "" }: { title: string; icon: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`flex flex-col gap-4 rounded-[28px] bg-white p-5 sm:p-6 ${className}`}>
      <h2 className="flex items-center gap-2.5 text-base font-semibold">
        <span className="grid size-9 place-items-center rounded-xl bg-cream text-orange">{icon}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}

function Note({ children }: { children: ReactNode }) {
  return <p className="text-[13px] leading-relaxed text-ink-2">{children}</p>;
}

function WriteStatus({ state }: { state: ReturnType<typeof useVaultWrite>["state"] }) {
  if (state.kind === "idle") return null;
  if (state.kind === "signing") return <Note>Confirm in your wallet.</Note>;
  if (state.kind === "pending")
    return (
      <Note>
        Waiting for Monad.{" "}
        <a className="font-semibold text-orange" href={txUrl(state.hash)} target="_blank" rel="noreferrer">
          Receipt ↗
        </a>
      </Note>
    );
  if (state.kind === "done")
    return (
      <p className="text-[13px] font-semibold text-ok">
        Done.{" "}
        <a className="text-orange" href={txUrl(state.hash)} target="_blank" rel="noreferrer">
          Receipt ↗
        </a>
      </p>
    );
  return (
    <p role="alert" className="text-[13px] font-semibold text-warn" title={state.detail}>
      {state.message}
    </p>
  );
}

const toWei = (v: string) => {
  try {
    const w = parseEther(v.trim() as `${number}`);
    return w > BigInt(0) ? w : null;
  } catch {
    return null;
  }
};

// Panel pemilik (desain A7). Semua angka dibaca dari chain, aksi ditandatangani wallet pemilik.
export function OwnerPanel() {
  const { status, isDemo, refetch } = useVaultStatus();
  const { pemilik, minKunci } = useVaultConfig();
  const { address, chainId } = useAccount();
  const now = useNow();
  const isOwner = VAULT_READY && !!address && !!pemilik && address.toLowerCase() === pemilik.toLowerCase();
  const wrongChain = isOwner && chainId !== monadTestnet.id;
  const locked = !isOwner || wrongChain;
  const stopped = !!status && !status.aktif;

  return (
    <>
      <OwnerHero stopped={stopped} isDemo={isDemo} isOwner={isOwner} wrongChain={wrongChain} pemilik={pemilik} />
      <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-[1fr_1fr_400px]">
        <div className="flex flex-col gap-3">
          <MainFunds amount={status?.danaUtama} locked={locked} onDone={refetch} />
          <Bounty
            amount={status?.celengan}
            unlockAt={status ? Number(status.kunciSampai) : 0}
            currentLock={status?.kunciSampai ?? BigInt(0)}
            stopped={stopped}
            now={now}
            minKunci={Number(minKunci ?? BigInt(300))}
            locked={locked}
            onDone={refetch}
          />
        </div>
        <div className="flex flex-col gap-3">
          <Suppliers locked={locked} />
          <AdminTools />
        </div>
        <div className="flex flex-col gap-3 md:col-span-2 md:grid md:grid-cols-2 xl:col-span-1 xl:flex">
          <Setup stopped={stopped} current={status?.sidikJari} locked={locked} onDone={refetch} />
          <Reputation locked={locked} />
        </div>
      </div>
    </>
  );
}

function OwnerHero({ stopped, isDemo, isOwner, wrongChain, pemilik }: { stopped: boolean; isDemo: boolean; isOwner: boolean; wrongChain: boolean; pemilik?: Address }) {
  return (
    <section className="relative mt-2 min-h-[220px] overflow-hidden rounded-[32px] bg-navy p-6 text-white sm:p-8 lg:rounded-[36px]">
      <Melt variant="glow" className="opacity-90" />
      <Jebi mood={stopped ? "stopped" : "safe"} size={300} className="absolute -bottom-16 -right-10 w-[38%] max-w-[300px] opacity-90 sm:right-10 sm:w-[30%] sm:opacity-100" />
      <div className="relative flex max-w-[72%] flex-col gap-3 sm:max-w-[640px]">
        <div className="flex flex-wrap gap-2">
          <Chip tone={stopped ? "warn" : "ok"}>{stopped ? "Stopped" : "Active"}</Chip>
          {isDemo ? <DemoBadge /> : isOwner ? <Chip tone="glass">You are the owner</Chip> : <Chip tone="glass">Read only</Chip>}
        </div>
        <h1 className="font-head text-[34px] font-semibold leading-tight tracking-[-0.035em] sm:text-[44px]">
          {stopped ? "KopiBot is stopped" : "KopiBot settings"}
        </h1>
        <p className="text-[15px] leading-relaxed text-white/70 sm:text-base">
          {isDemo
            ? "The vault is not on Monad yet. Buttons turn on once it is deployed."
            : wrongChain
              ? "Switch your wallet to Monad testnet to make changes."
              : !isOwner
              ? `Only the owner wallet${pemilik ? ` ${shortAddress(pemilik)}` : ""} can change these. You can still look around.`
              : stopped
                ? "Someone broke it. Change its setup, then restart it. Your main funds are safe."
                : "Your main funds can only go to approved suppliers. Only the bounty can reach an address off the list."}
        </p>
      </div>
    </section>
  );
}

function MainFunds({ amount, locked, onDone }: { amount?: bigint; locked: boolean; onDone: () => void }) {
  const [v, setV] = useState("");
  const w = useVaultWrite(onDone);
  const wei = toWei(v);
  return (
    <Card title="Main funds" icon={<Wallet size={16} aria-hidden />}>
      {amount !== undefined ? <Amount wei={amount} className="text-[40px] leading-none" unitClassName="text-ink-2" /> : <div className="h-10 w-32 animate-pulse rounded-xl bg-field" />}
      <label className="sr-only" htmlFor="main-amount">
        Amount in MON
      </label>
      <input id="main-amount" inputMode="decimal" placeholder="Amount in MON" value={v} onChange={(e) => setV(e.target.value)} disabled={locked} className={fieldCls} />
      <div className="flex gap-2">
        <button type="button" className={btnCls()} disabled={locked || !wei || w.busy} onClick={() => wei && w.run("setorUtama", [], wei)}>
          Add
        </button>
        <button type="button" className={btnCls(false)} disabled={locked || !wei || w.busy || (amount !== undefined && wei! > amount)} onClick={() => wei && w.run("tarikUtama", [wei])}>
          Take out
        </button>
      </div>
      <WriteStatus state={w.state} />
      <Note>You can always take this out, even after a break.</Note>
    </Card>
  );
}

function Bounty({
  amount,
  unlockAt,
  currentLock,
  stopped,
  now,
  minKunci,
  locked,
  onDone,
}: {
  amount?: bigint;
  unlockAt: number;
  currentLock: bigint;
  stopped: boolean;
  now: number;
  minKunci: number;
  locked: boolean;
  onDone: () => void;
}) {
  const minMinutes = Math.max(1, Math.ceil(minKunci / 60));
  const [v, setV] = useState("");
  const [mins, setMins] = useState(String(minMinutes));
  const w = useVaultWrite(onDone);
  const client = usePublicClient();
  const wei = toWei(v);
  const lockMins = Math.max(minMinutes, Math.floor(Number(mins) || 0));
  // Kontrak menolak kunci yang lebih awal dari kunci sekarang atau dari waktu blok + minKunci.
  // Waktu diambil dari blok terbaru (bukan jam browser) dan diberi jeda 60 detik untuk waktu menambang.
  const addBounty = async () => {
    if (!wei || !client) return;
    const blk = await client.getBlock().catch(() => null);
    const chainNow = blk ? blk.timestamp : BigInt(now);
    const wanted = chainNow + BigInt(lockMins * 60);
    const kunci = (wanted > currentLock ? wanted : currentLock) + BigInt(60);
    await w.run("isiCelengan", [kunci], wei);
  };
  const canWithdraw = stopped || (now > 0 && now >= unlockAt);
  const leftMin = Math.ceil((unlockAt - now) / 60);
  return (
    <Card title="Bounty" icon={<PiggyBank size={16} aria-hidden />}>
      {amount !== undefined ? <Amount wei={amount} className="text-[40px] leading-none" unitClassName="text-ink-2" /> : <div className="h-10 w-32 animate-pulse rounded-xl bg-field" />}
      <div className="grid grid-cols-[1fr_120px] gap-2">
        <label className="sr-only" htmlFor="bounty-amount">
          Amount in MON
        </label>
        <input id="bounty-amount" inputMode="decimal" placeholder="Amount in MON" value={v} onChange={(e) => setV(e.target.value)} disabled={locked} className={fieldCls} />
        <label className="sr-only" htmlFor="bounty-lock">
          Lock in minutes
        </label>
        <input id="bounty-lock" inputMode="numeric" value={mins} onChange={(e) => setMins(e.target.value)} disabled={locked} className={fieldCls} title="Lock in minutes" />
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          className={btnCls()}
          disabled={locked || !wei || w.busy || now === 0}
          onClick={addBounty}
        >
          Add, lock {lockMins} min
        </button>
        <button type="button" className={btnCls(false)} disabled={locked || w.busy || !canWithdraw || !amount} onClick={() => w.run("tarikCelengan")}>
          Take out all
        </button>
      </div>
      <WriteStatus state={w.state} />
      <Note>
        {canWithdraw ? "You can take it out now. That resets the score." : `Locked ${leftMin <= 1 ? "1 more min" : `${leftMin} more min`}. Taking it out resets the score.`} The lock
        is at least {minMinutes} min and can never move earlier.
      </Note>
    </Card>
  );
}

function Suppliers({ locked }: { locked: boolean }) {
  const [extra, setExtra] = useState<Address[]>([]);
  const [v, setV] = useState("");
  const list = [...SUPPLIERS, ...extra.map((a) => ({ name: shortAddress(a), address: a }))];
  const reads = useReadContracts({
    contracts: list.map((s) => ({ address: VAULT_ADDRESS, abi: vaultAbi, functionName: "allowlist", args: [s.address] }) as const),
    query: { enabled: VAULT_READY },
  });
  const w = useVaultWrite(() => reads.refetch());
  return (
    <Card title="Approved suppliers" icon={<ListChecks size={16} aria-hidden />}>
      <ul className="flex flex-col">
        {list.map((s, i) => {
          const loaded = !VAULT_READY || reads.data?.[i]?.status === "success";
          const on = VAULT_READY ? reads.data?.[i]?.result === true : true;
          return (
            <li key={s.address} className="flex items-center justify-between gap-3 border-b border-line py-3 last:border-0">
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold">{s.name}</span>
                <span className="block font-mono text-xs text-ink-2">{shortAddress(s.address)}</span>
              </span>
              <button
                type="button"
                disabled={locked || w.busy || !loaded}
                onClick={() => w.run("aturAllowlist", [s.address, !on])}
                className={`shrink-0 text-[13px] font-semibold disabled:opacity-40 ${on ? "text-warn" : "text-ok"}`}
              >
                {!loaded ? "Checking" : on ? "Remove" : "Approve"}
              </button>
            </li>
          );
        })}
      </ul>
      <div className="flex gap-2">
        <label className="sr-only" htmlFor="new-supplier">
          New address
        </label>
        <input id="new-supplier" placeholder="New address 0x" value={v} onChange={(e) => setV(e.target.value)} disabled={locked} className={`${fieldCls} font-mono`} />
        <button
          type="button"
          className={btnCls()}
          disabled={locked || w.busy || !isAddress(v)}
          onClick={async () => {
            const a = v as Address;
            if (await w.run("aturAllowlist", [a, true])) {
              setExtra((x) => [...x, a]);
              setV("");
            }
          }}
        >
          Add
        </button>
      </div>
      <WriteStatus state={w.state} />
      <Note>Changing this list also changes the agent setup. Tell the backend so the setup ID matches again.</Note>
    </Card>
  );
}

function Setup({ stopped, current, locked, onDone }: { stopped: boolean; current?: Hex; locked: boolean; onDone: () => void }) {
  // null = belum diketik, jadi input memakai setup agent dari server.
  const [typed, setTyped] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  // Sidik jari yang dipakai agent di BE (sidikJariLokal dari GET /api/kesehatan, ikut AGENT_VERSI).
  // Diisi otomatis supaya pemilik tidak perlu menyalin hash.
  const agent = useQuery({
    queryKey: ["sidikJariAgent"],
    queryFn: async () => {
      const r = await fetch("/api/kesehatan", { cache: "no-store" }).catch(() => null);
      const b = (await r?.json().catch(() => null)) as { sidikJariLokal?: string } | null;
      return b?.sidikJariLokal ?? null;
    },
    enabled: VAULT_READY,
    refetchInterval: 15_000,
  });
  const agentSetup = agent.data ?? null;
  const v = typed ?? agentSetup ?? "";
  const w = useVaultWrite(onDone);
  const same = !!current && v.toLowerCase() === current.toLowerCase();
  const valid = isHex(v) && v.length === 66 && !same;
  const agentMatches = !!agentSetup && !!current && agentSetup.toLowerCase() === current.toLowerCase();
  const loadFromAgent = async () => {
    setHint(null);
    setTyped(null);
    const r = await agent.refetch();
    if (!r.data) setHint("We could not read the agent setup from the server.");
  };
  return (
    <Card title={stopped ? "Restart KopiBot" : "Setup"} icon={<SlidersHorizontal size={16} aria-hidden />}>
      {current ? (
        <div className="flex items-center justify-between gap-3 rounded-2xl bg-cream px-4 py-3">
          <span className="text-[13px] text-ink-2">Current setup</span>
          <button
            type="button"
            onClick={() => navigator.clipboard?.writeText(current)}
            title="Copy"
            className="font-mono text-[13px] font-semibold hover:text-orange"
          >
            {current.slice(0, 8)}…{current.slice(-6)}
          </button>
        </div>
      ) : null}
      <label className="sr-only" htmlFor="setup-id">
        Setup ID
      </label>
      <input id="setup-id" placeholder="Setup ID 0x" value={v} onChange={(e) => setTyped(e.target.value)} disabled={locked} className={`${fieldCls} font-mono text-xs`} />
      <div className="flex flex-wrap gap-2">
        {stopped ? (
          <ArrowButton
            disabled={locked || !valid || w.busy}
            onClick={() => w.run("nyalakanLagi", [v as Hex])}
            icon="↻"
            className="h-11 text-sm"
          >
            Restart KopiBot
          </ArrowButton>
        ) : (
          <button type="button" className={btnCls()} disabled={locked || !valid || w.busy} onClick={() => w.run("aturSidikJari", [v as Hex])}>
            Save new setup
          </button>
        )}
        <button type="button" className={btnCls(false)} disabled={locked} onClick={loadFromAgent}>
          Use agent setup
        </button>
      </div>
      <WriteStatus state={w.state} />
      {hint ? <p className="text-[13px] font-semibold text-warn">{hint}</p> : null}
      {agentSetup && current ? (
        <p role="status" className={`text-[13px] font-semibold ${agentMatches === stopped ? "text-warn" : "text-ok"}`}>
          {agentMatches
            ? stopped
              ? "The agent still has the current setup. Update the agent on the server first, then restart."
              : "The agent setup matches Monad. Tries are open."
            : stopped
              ? "The agent has a new setup. You can restart KopiBot with it."
              : "The agent setup is different from Monad. Tries are paused until you save it."}
        </p>
      ) : null}
      {same && !agentMatches ? <p className="text-[13px] font-semibold text-warn">This is the current setup. Change the model or prompt first.</p> : null}
      <Note>
        {stopped
          ? "Change the model or prompt first. Restarting with the same setup is not allowed. The score starts from zero."
          : "Use this after you change the model, prompt or supplier list. The score starts from zero."}
      </Note>
    </Card>
  );
}

function Reputation({ locked }: { locked: boolean }) {
  const [reg, setReg] = useState(REPUTATION_REGISTRY);
  const [id, setId] = useState("");
  const w = useVaultWrite();
  const ok = isAddress(reg) && /^\d+$/.test(id);
  return (
    <Card title="Agent reputation" icon={<BadgeCheck size={16} aria-hidden />}>
      <Note>Write each break to the ERC-8004 registry on Monad so other apps can see it.</Note>
      <label className="sr-only" htmlFor="rep-registry">
        Registry address
      </label>
      <input id="rep-registry" value={reg} onChange={(e) => setReg(e.target.value)} disabled={locked} className={`${fieldCls} font-mono text-xs`} />
      <label className="sr-only" htmlFor="rep-id">
        Agent ID
      </label>
      <input id="rep-id" inputMode="numeric" placeholder="Agent ID" value={id} onChange={(e) => setId(e.target.value)} disabled={locked} className={fieldCls} />
      <button type="button" className={`${btnCls()} w-fit`} disabled={locked || !ok || w.busy} onClick={() => w.run("aturErc8004", [reg as Address, BigInt(id)])}>
        Connect
      </button>
      <WriteStatus state={w.state} />
    </Card>
  );
}

const HASIL: Record<string, string> = { dibayar: "Paid", crackie: "Broke", jebol: "Broke", revert: "Refused", tertunda: "Pending" };

type Percobaan = { ke: number | null; penyerang: string | null; saluran: string; pesan: string; status: string; aksi: { hasil: string } | null; waktu: string };

// Alat demo lewat endpoint admin BE. Token diketik, tidak disimpan.
function AdminTools() {
  const [token, setToken] = useState("");
  const [teks, setTeks] = useState("");
  const [sendState, setSendState] = useState<{ kind: "idle" | "busy" | "ok" | "err"; text?: string }>({ kind: "idle" });
  const [tries, setTries] = useState<Percobaan[] | null>(null);
  const [triesErr, setTriesErr] = useState<string | null>(null);
  const auth = { authorization: `Bearer ${token}` };

  const sendInvoice = async () => {
    setSendState({ kind: "busy" });
    for (let i = 0; i < 5; i++) {
      const r = await fetch("/api/admin/tagihan", { method: "POST", headers: { ...auth, "content-type": "application/json" }, body: JSON.stringify({ teks }) }).catch(() => null);
      if (!r) return setSendState({ kind: "err", text: "Could not reach the server." });
      const b = (await r.json().catch(() => ({}))) as { balasan?: string; aksi?: { hasil: string; jumlah: string } | null; alasan?: string };
      if (r.status === 429 && b.alasan === "sibuk") {
        await new Promise((res) => setTimeout(res, 2000));
        continue;
      }
      if (r.status === 401 || r.status === 403) return setSendState({ kind: "err", text: "Wrong admin token." });
      if (!r.ok) return setSendState({ kind: "err", text: "The invoice was not processed. Try again." });
      const paid = b.aksi ? `${HASIL[b.aksi.hasil] ?? "Sent"}. ${b.aksi.jumlah} MON.` : "Not paid.";
      return setSendState({ kind: "ok", text: `${paid} ${b.balasan ?? ""}` });
    }
    setSendState({ kind: "err", text: "KopiBot is busy. Try again in a moment." });
  };

  const loadTries = async () => {
    setTriesErr(null);
    const r = await fetch("/api/admin/percobaan?batas=10", { headers: auth, cache: "no-store" }).catch(() => null);
    if (!r || !r.ok) {
      setTries(null);
      setTriesErr(r && (r.status === 401 || r.status === 403) ? "Wrong admin token." : "Could not load tries.");
      return;
    }
    setTries((await r.json()) as Percobaan[]);
  };

  return (
    <>
      <Card title="Send a normal invoice" icon={<Receipt size={16} aria-hidden />}>
        <label className="sr-only" htmlFor="admin-token">
          Admin token
        </label>
        <input
          id="admin-token"
          type="password"
          autoComplete="off"
          placeholder="Admin token"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          className={fieldCls}
        />
        <label className="sr-only" htmlFor="invoice-text">
          Invoice text
        </label>
        <textarea
          id="invoice-text"
          rows={3}
          placeholder="Invoice #12 from Susu Segar Kaliurang, 0.02 MON. Please pay."
          value={teks}
          onChange={(e) => setTeks(e.target.value)}
          className={`${fieldCls} h-auto resize-none py-3`}
        />
        <button type="button" className={`${btnCls()} w-fit`} disabled={!token || !teks || sendState.kind === "busy"} onClick={sendInvoice}>
          {sendState.kind === "busy" ? "Sending" : "Send"}
        </button>
        {sendState.text ? (
          <p role="status" className={`text-[13px] leading-relaxed ${sendState.kind === "err" ? "font-semibold text-warn" : "text-ink-2"}`}>
            {sendState.text}
          </p>
        ) : null}
        <Note>For demos. This is the owner channel, not a try, and it does not count toward the score.</Note>
      </Card>
      <Card title="Recent tries" icon={<MessageSquare size={16} aria-hidden />}>
        <Note>Full messages are only visible to you. Uses the admin token above.</Note>
        <button type="button" className={`${btnCls(false)} w-fit`} disabled={!token} onClick={loadTries}>
          Load tries
        </button>
        {triesErr ? <p className="text-[13px] font-semibold text-warn">{triesErr}</p> : null}
        {tries ? (
          tries.length === 0 ? (
            <Note>No tries yet.</Note>
          ) : (
            <ul className="flex flex-col gap-2">
              {tries.map((t, i) => (
                <li key={`${t.ke}-${i}`} className="rounded-2xl bg-field px-4 py-3">
                  <div className="flex justify-between gap-2 text-sm font-semibold">
                    <span>{t.saluran === "pemilik" ? "Owner invoice" : `Try ${t.ke}`}</span>
                    <span className="text-ink-2">{t.status === "diproses" ? "Reading" : t.aksi ? (HASIL[t.aksi.hasil] ?? "Sent") : "Held"}</span>
                  </div>
                  <p className="mt-1 line-clamp-3 whitespace-pre-wrap text-[13px] text-ink-2">{t.pesan}</p>
                  <p className="mt-1 text-xs text-ink-3">{formatDate(Date.parse(t.waktu) / 1000)}</p>
                </li>
              ))}
            </ul>
          )
        ) : null}
      </Card>
    </>
  );
}
