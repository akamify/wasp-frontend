import { Link } from "react-router-dom";
import { Card } from "@components/ui/Card";
import { Seo } from "@shared/components/Seo";

export default function NotFoundPage() {
  return (
    <div className="flex min-h-dvh items-center justify-center px-4 py-10">
      <Seo title="404 - Page not found | AiWizChat" description="The page you are looking for does not exist." robots="noindex,nofollow" />
      <Card className="w-full max-w-lg p-8">
        <div className="text-xs font-semibold text-ink-800/60">404</div>
        <h1 className="mt-2 text-3xl font-black tracking-tight">Page not found</h1>
        <p className="mt-2 text-sm text-ink-800/70">
          The page you are looking for doesn&apos;t exist.
        </p>
        <div className="mt-5">
          <Link className="text-sm font-semibold underline" to="/app">
            Go to dashboard
          </Link>
        </div>
      </Card>
    </div>
  );
}
