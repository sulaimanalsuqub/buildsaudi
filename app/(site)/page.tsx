import { Metadata } from "next";

import { HomeContent } from "@/components/sections/home-content";

export const metadata: Metadata = {
  title: "Home",
  description: "Build helps Saudi construction teams register, verify, and onboard vendors faster."
};

export default function HomePage() {
  return <HomeContent />;
}
