"use client";

import { useState } from "react";
import { usePublicClient, useWriteContract } from "wagmi";
import { BaseError, UserRejectedRequestError, type Hash } from "viem";
import { monadTestnet } from "@/config/chains";
import { VAULT_ADDRESS, vaultAbi } from "@/config/vault";

type State = { kind: "idle" } | { kind: "signing" } | { kind: "pending"; hash: Hash } | { kind: "done"; hash: Hash } | { kind: "error"; message: string; detail?: string };

// Satu aksi tulis pemilik: tanda tangan → tunggu receipt → selesai atau error yang jelas.
export function useVaultWrite(onDone?: () => void) {
  const client = usePublicClient();
  const { writeContractAsync } = useWriteContract();
  const [state, setState] = useState<State>({ kind: "idle" });

  const run = async (
    functionName: string,
    args: readonly unknown[] = [],
    value?: bigint,
  ) => {
    setState({ kind: "signing" });
    let hash: Hash;
    try {
      // ABI parseAbi bertipe ketat; nama fungsi dan argumen dicek di pemanggil.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      hash = await writeContractAsync({ address: VAULT_ADDRESS, abi: vaultAbi, functionName: functionName as any, args: args as any, value, chainId: monadTestnet.id } as any);
    } catch (e) {
      const rejected = e instanceof BaseError && e.walk((x) => x instanceof UserRejectedRequestError);
      const detail = e instanceof BaseError ? e.shortMessage : String(e);
      setState({ kind: "error", message: rejected ? "You cancelled. Nothing was sent." : "Not sent. Check the amount and your wallet, then try again.", detail });
      return false;
    }
    setState({ kind: "pending", hash });
    const r = await client!.waitForTransactionReceipt({ hash }).catch(() => null);
    if (!r) {
      setState({ kind: "error", message: "Sent, but not confirmed yet. Check the receipt." });
      return false;
    }
    if (r.status !== "success") {
      setState({ kind: "error", message: "Monad refused it. The network fee was kept, nothing else changed." });
      return false;
    }
    setState({ kind: "done", hash });
    onDone?.();
    return true;
  };

  return { state, run, busy: state.kind === "signing" || state.kind === "pending" };
}
