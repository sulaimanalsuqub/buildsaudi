import { Metadata } from "next";

import { HomeContent } from "@/components/sections/home-content";

export const metadata: Metadata = {
  title: "Home",
  description: "Build helps suppliers deliver building materials to Saudi projects faster and easier."
};

export default function HomePage() {
  return <HomeContent />;
}
