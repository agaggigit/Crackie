"use client";

import { useAccount, useReadContract, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { formatEther } from "viem";
import { VAULT_ADDRESS, VAULT_READY, vaultAbi } from "@/config/vault";

// Muncul kalau transfer hadiah otomatis gagal dan hadiah ditahan di hadiahTertunda (docs/prd/sc.md 3.4).
export function ClaimCard() {
  const { address } = useAccount();
  const pending = useReadContract({
    address: VAULT_ADDRESS,
    abi: vaultAbi,
    functionName: "hadiahTertunda",
    args: address ? [address] : undefined,
    query: { enabled: VAULT_READY && !!address, refetchInterval: 8_000 },
  });
  const write = useWriteContract();
  const wait = useWaitForTransactionReceipt({ hash: write.data });
  const amount = pending.data ?? BigInt(0);
  if (amount === BigInt(0) || wait.isSuccess) return null;
  const working = write.isPending || wait.isLoading;

  return (
    <div className="anim-pop flex flex-wrap items-center gap-3 rounded-[24px] bg-navy px-5 py-4 text-white">
      <div className="min-w-0 flex-1">
        <div className="text-[15px] font-semibold">{Number(formatEther(amount)).toFixed(2)} MON is waiting for you</div>
        <p className="text-[13px] text-white/65">
          {write.isError ? "That did not go through. Nothing was charged. Try again." : "We could not send your bounty automatically. Claim it with one tap."}
        </p>
      </div>
      <button
        type="button"
        disabled={working}
        onClick={() => write.writeContract({ address: VAULT_ADDRESS, abi: vaultAbi, functionName: "klaimHadiah" })}
        className="h-10 rounded-full bg-orange px-5 text-sm font-semibold hover:bg-ember disabled:opacity-60"
      >
        {working ? "Claiming" : "Claim bounty"}
      </button>
    </div>
  );
}
