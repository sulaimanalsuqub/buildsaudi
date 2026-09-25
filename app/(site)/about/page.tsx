import { LegalPageContent } from "@/components/sections/legal-page-content";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  lang: "en",
  path: "/about",
  title: "About Build | Build",
  description: "Learn about Build — a modern, integrated supply platform connecting products, suppliers, and logistics for contractors, developers, and businesses in Saudi Arabia.",
});

function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="type-section-title !mt-10 text-brand-dark first:!mt-0">{children}</h2>;
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="type-body text-brand-dark/80">{children}</p>;
}

export default function AboutPage() {
  return (
    <LegalPageContent title="About Build" badge="About Us">
      <P>
        After years of work in the supply and building-materials sector, Build launched to offer a modern, integrated model for supplying project needs — a platform that brings together products, suppliers, and logistics services in one experience, aimed at making purchasing and supply easier for contractors, developers, companies, and individuals.
      </P>

      <H2>Why Build?</H2>
      <P>
        The idea behind Build came from the need to simplify the journey of purchasing project materials. Instead of dealing with a large number of suppliers and constantly searching for prices and availability, Build works as a single point that gathers a project&apos;s needs, helping source the right products and arrange supply and delivery to the site efficiently and clearly.
      </P>

      <H2>Our Products</H2>
      <P>
        Build offers a wide range of products, including sanitaryware, plumbing, electrical and lighting, air conditioning, building materials, insulation, finishing materials, and tools and equipment — in addition to many other products tied to the needs of residential and commercial projects.
      </P>

      <H2>Our Supplier Network</H2>
      <P>
        Build works with a growing network of suppliers, manufacturers, and local and international brands, aiming to offer multiple options that combine quality, fair pricing, and product variety — allowing customers to choose what suits their project needs and budgets.
      </P>

      <H2>Our Services</H2>
      <P>
        Build&apos;s services are not limited to selling products; they extend to project supply, preparing bills of quantities, quantity requests, and requests for quotations, as well as coordinating shipping and delivery — whether directly from the supplier to the project site or through logistics partners and third-party warehouses when needed.
      </P>

      <H2>International Supply</H2>
      <P>
        Build also supports project needs that rely on suppliers from within and outside Saudi Arabia, handling different supply models according to the nature of each request — including import, shipping, and delivery under international trade terms such as EXW, FOB, CIF, and DDP.
      </P>

      <H2>Our Vision</H2>
      <P>
        Build strives to build a flexible supply ecosystem that combines e-commerce with project supply, so a customer can purchase a single product directly, or send a complete list of project materials and receive a suitable quote for their needs.
      </P>
      <P>
        Build&apos;s experience is being developed to be more than just an online store — a complete supply platform that supports the customer from the product-search stage all the way to the materials arriving at the project site, with attention to service quality, response speed, and clarity throughout the supply process.
      </P>

      <H2>Our Commitment</H2>
      <P>
        Build believes that the success of any project starts with an organized supply chain. That&apos;s why we are building a strong network of suppliers, transport, and service partners, to deliver an easier and more reliable purchasing and supply experience across the Kingdom.
      </P>

      <p className="type-section-title !mt-10 text-brand-primary">
        Build — everything your project needs, in one place.
      </p>
    </LegalPageContent>
  );
}
