import HeroSection    from './HeroSection';
import DemoSection    from './DemoSection';
import FeaturesSection from './FeaturesSection';
import PricingSection from './PricingSection';
import FAQSection     from './FAQSection';
import FooterSection  from './FooterSection';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-black text-white font-mono">
      <HeroSection />
      <DemoSection />
      <FeaturesSection />
      <PricingSection />
      <FAQSection />
      <FooterSection />
    </div>
  );
}
