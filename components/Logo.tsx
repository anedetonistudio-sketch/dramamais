import Link from "next/link";
export default function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2" aria-label="Drama+ — início">
      <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand text-sm font-extrabold">D+</span>
      <span className="text-lg font-extrabold tracking-tight">Drama<span className="text-brand">+</span></span>
    </Link>
  );
}
