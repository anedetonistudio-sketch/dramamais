import "server-only";
import { notFound, redirect } from "next/navigation";
import { getViewer } from "./auth";
import { isDemoMode } from "./env";

/** Só usuários com profiles.is_admin = true. */
export async function requireAdmin() {
  if (isDemoMode()) return { demo: true as const };
  const viewer = await getViewer();
  if (!viewer.user) redirect("/entrar?next=/admin");
  if (!viewer.isAdmin) notFound();
  return { demo: false as const, viewer };
}
