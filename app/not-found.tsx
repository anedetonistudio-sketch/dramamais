import Link from "next/link";
export default function NotFound() {
  return (
    <div className="mx-auto max-w-md px-4 pt-20 text-center">
      <p className="text-5xl font-extrabold text-brand">404</p>
      <p className="mt-3 text-white/70">Essa página saiu de cena.</p>
      <Link href="/" className="btn-primary mt-6">Voltar ao catálogo</Link>
    </div>
  );
}
