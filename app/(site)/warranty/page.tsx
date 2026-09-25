import { LegalPageContent } from "@/components/sections/legal-page-content";
import { WarrantySeal } from "@/components/ui/warranty-seal";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  lang: "en",
  path: "/warranty",
  title: "Warranty Policy | Build",
  description: "Warranty duration and scope vary by product type, brand, and warranty provider — manufacturer, agent, or supplier. Learn the terms and how to file a claim.",
});

function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="type-section-title !mt-10 text-brand-dark first:!mt-0">{children}</h2>;
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="type-body text-brand-dark/80">{children}</p>;
}

function Ol({ children }: { children: React.ReactNode }) {
  return <ol className="list-decimal space-y-2 pl-5 type-body text-brand-dark/80">{children}</ol>;
}

function Ul({ children }: { children: React.ReactNode }) {
  return <ul className="list-disc space-y-2 pl-5 type-body text-brand-dark/80">{children}</ul>;
}

export default function WarrantyPage() {
  return (
    <LegalPageContent title="Warranty Policy" badge="Warranty">
      <div className="flex flex-col items-center gap-3 py-2 text-center">
        <WarrantySeal className="h-20 w-auto" />
        <p className="type-micro font-semibold text-brand-primary">Authentic products, backed warranty</p>
      </div>

      <P>
        Build is committed to supplying authentic, reliable products from approved suppliers, manufacturers, and agents, or from trusted sourcing channels. Warranty duration and scope vary depending on the product type, brand, and the party providing the warranty.
      </P>

      <H2>1. Product Warranty</H2>
      <Ol>
        <li>Products sold through Build are covered by the manufacturer&apos;s, agent&apos;s, or supplier&apos;s warranty, as stated on the product page, the purchase invoice, or the warranty document included with it.</li>
        <li>Warranty duration varies from product to product. Where available, the warranty period and provider are shown in the product details before the purchase is completed.</li>
        <li>The warranty period begins from the date of the purchase invoice, unless the manufacturer&apos;s or agent&apos;s terms state otherwise.</li>
        <li>The Build invoice or purchase document serves as proof of purchase and must be kept when requesting warranty service.</li>
        <li>If the product is covered by an authorized agent&apos;s warranty within Saudi Arabia, warranty and maintenance services are provided through that agent or an authorized service center according to its terms.</li>
        <li>If the warranty is provided directly by the supplier or manufacturer, Build assists the customer in submitting the warranty claim and coordinating with the relevant party according to the nature of the case.</li>
        <li>Build does not provide an additional, independent warranty on a product unless the product page explicitly states &quot;Build Warranty&quot; along with its duration and terms.</li>
      </Ol>

      <H2>2. What the Warranty Covers</H2>
      <P>
        The warranty covers manufacturing defects or faults covered under the manufacturer&apos;s, agent&apos;s, or supplier&apos;s warranty, according to each product&apos;s terms.
      </P>
      <P>The warranty typically does not cover cases resulting from:</P>
      <Ul>
        <li>Misuse or use contrary to the manufacturer&apos;s instructions.</li>
        <li>Incorrect installation, or installation by an unauthorized party where the product requires authorized installation.</li>
        <li>Damage resulting from accidents, breakage, or neglect.</li>
        <li>Modifications or repairs carried out by an unauthorized party.</li>
        <li>Normal wear and tear of the product or consumable parts, unless the product&apos;s warranty states otherwise.</li>
        <li>Operating, electrical, or environmental conditions that do not match the product&apos;s specifications.</li>
      </Ul>

      <H2>3. Products That Require Installation</H2>
      <P>
        For some products, the manufacturer or agent may require installation by a qualified technician or authorized party for the warranty to remain valid.
      </P>
      <P>
        These requirements are shown in the product details where available, and the customer is responsible for following the product&apos;s installation and operating instructions.
      </P>

      <H2>4. Filing a Warranty Claim</H2>
      <P>If there is a defect or fault covered by warranty, the customer can contact Build and provide:</P>
      <Ul>
        <li>Order or invoice number.</li>
        <li>Product name.</li>
        <li>Description of the issue.</li>
        <li>Photos or a video showing the issue, if needed.</li>
        <li>The product&apos;s serial number, if available.</li>
      </Ul>
      <P>Once the request is received, the responsible warranty provider is identified and the customer is informed of the appropriate next steps.</P>

      <H2>5. Build&apos;s Role in the Warranty Process</H2>
      <P>
        Build works to facilitate warranty procedures and follow up on the request with the supplier, manufacturer, or agent when needed.
      </P>
      <P>
        In cases where another party carries out the warranty, this does not mean Build stops following up with the customer or is released from any statutory obligations it holds as a seller or supplier.
      </P>

      <H2>6. Variation in Warranty Terms</H2>
      <P>
        Given the variety of products and brands, some products may have specific terms related to warranty duration, maintenance, installation, or spare parts.
      </P>
      <P>
        Where a product has specific terms, the terms stated on the product page, warranty card, or manufacturer documentation apply, provided they do not conflict with the regulations in force in Saudi Arabia.
      </P>

      <H2>7. Statutory Rights</H2>
      <P>
        This policy does not affect any rights granted to the consumer under the regulations in force in Saudi Arabia.
      </P>
      <P>
        The Ministry of Commerce requires warranty policies to be clear to the consumer, to explain the responsibility of the warranty provider and the role of the distributor, and it affirms warranty, maintenance, and spare-parts obligations according to the type of good and the party responsible for it.
      </P>
    </LegalPageContent>
  );
}
