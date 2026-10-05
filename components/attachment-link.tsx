import { isDataUrl, safeHref } from "@/lib/url";

/** Renders a submission attachment only if its URL is safe (http(s) or an allowed uploaded file type). */
export function AttachmentLink({ url, children }: { url: string | null | undefined; children: React.ReactNode }) {
  const href = safeHref(url);
  if (!href) return null;
  return (
    <a
      href={href}
      download={isDataUrl(href) ? "assignment" : undefined}
      target="_blank"
      rel="noreferrer noopener"
      className="text-sm font-medium text-[color:hsl(var(--brand-blue))]"
    >
      {children}
    </a>
  );
}
