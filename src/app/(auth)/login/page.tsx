import { LoginForm } from "@/components/auth/login-form";
import { FolderSync } from "lucide-react";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <FolderSync className="size-6" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">File Tracking System</h1>
          <p className="text-sm text-muted-foreground">Sign in to your account to continue</p>
        </div>
        <LoginForm />
        {process.env.NODE_ENV !== "production" && (
          <p className="rounded-md border border-dashed bg-muted/50 px-3 py-2 text-center text-xs text-muted-foreground">
            Dev accounts — admin@fts.local / Admin@123 · hr.officer@fts.local / Officer@123
          </p>
        )}
      </div>
    </div>
  );
}