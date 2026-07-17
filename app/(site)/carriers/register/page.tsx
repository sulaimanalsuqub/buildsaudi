import { CarrierRegisterContent } from "@/components/sections/carrier-register-content";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  lang: "en",
  path: "/carriers/register",
  title: "Become a Carrier Partner | Build",
  description:
    "Register your fleet as a carrier partner with Build. Shipment opportunities for construction material deliveries across Saudi Arabia.",
  keywords: ["carrier registration Saudi Arabia", "freight partner construction materials", "logistics partner Build"],
});

export default function CarrierRegisterPage() {
  return <CarrierRegisterContent />;
}
