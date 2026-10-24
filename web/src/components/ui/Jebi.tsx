import Image from "next/image";

export type JebiMood = "idle" | "think" | "safe" | "broken" | "stopped" | "gift";

const ALT: Record<JebiMood, string> = {
  idle: "Jebi the piggy bank, calm",
  think: "Jebi thinking",
  safe: "Jebi holding a shield",
  broken: "Jebi cracked open with coins flying",
  stopped: "Jebi asleep with a padlock",
  gift: "Jebi holding out a coin",
};

// Maskot dari web/public/maskot (diekspor dari docs/desain/jebol.pen).
export function Jebi({
  mood,
  size,
  className = "",
  priority = false,
}: {
  mood: JebiMood;
  size: number;
  className?: string;
  priority?: boolean;
}) {
  return (
    <Image
      src={`/maskot/jebi-${mood}.svg`}
      alt={ALT[mood]}
      width={size}
      height={size}
      priority={priority}
      draggable={false}
      className={`pointer-events-none select-none ${className}`}
    />
  );
}

export function KopiBotAvatar({ size, className = "" }: { size: number; className?: string }) {
  return (
    <Image
      src="/maskot/kopibot.svg"
      alt="KopiBot, a coffee cup"
      width={size}
      height={size}
      draggable={false}
      className={`pointer-events-none select-none ${className}`}
    />
  );
}
