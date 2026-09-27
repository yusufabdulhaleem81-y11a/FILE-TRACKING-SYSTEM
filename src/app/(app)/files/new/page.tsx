import { requireRole } from "@/lib/auth-guard";
import { CreateFileForm } from "@/components/files/create-file-form";

export default async function NewFilePage() {
  await requireRole(["ADMIN", "OFFICER"]);
  return <CreateFileForm />;
}