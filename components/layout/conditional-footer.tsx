import { SiteFooter } from "@/components/layout/site-footer";

export function ConditionalFooter({ isRtl }: { isRtl?: boolean }) {
  return <SiteFooter isRtl={isRtl} />;
}
