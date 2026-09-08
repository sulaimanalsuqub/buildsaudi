import { CarrierRegisterPausedContent } from "@/components/sections/carrier-register-paused-content";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  lang: "en",
  path: "/carriers/register",
  title: "Register as a Carrier with Build",
  description: "Register your company to transport building materials with Build. Add your services, coverage areas and required documents, then submit your application for review.",
  keywords: ["carrier registration Saudi Arabia", "freight partner construction materials", "logistics partner Build"],
});

export default function CarrierRegisterPage() {
  return <CarrierRegisterPausedContent />;
}
