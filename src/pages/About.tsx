import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ShieldCheck, 
  MapPin, 
  MessageSquare, 
  Sparkles, 
  Package, 
  CheckCircle2, 
  Scale, 
  Store, 
  HelpCircle,
  Check,
  ChevronDown,
  Building,
  Compass
} from 'lucide-react';
import { BENUE_LGAS } from '../constants/benue';

export const About: React.FC = () => {
  const [selectedZone, setSelectedZone] = useState<'all' | 'Zone A' | 'Zone B' | 'Zone C'>('all');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const filteredLGAs = selectedZone === 'all' 
    ? BENUE_LGAS 
    : BENUE_LGAS.filter(lga => lga.zone === selectedZone);

  const zonesCount = {
    'Zone A': BENUE_LGAS.filter(l => l.zone === 'Zone A').length,
    'Zone B': BENUE_LGAS.filter(l => l.zone === 'Zone B').length,
    'Zone C': BENUE_LGAS.filter(l => l.zone === 'Zone C').length,
  };

  const corePillars = [
    {
      title: 'Zero-Commission Farmgate Trading',
      subtitle: '100% Direct Profit Retention',
      description: 'Unlike conventional broker-dominated commodity channels, Benue Market does not take a percentage of farmer transactions or charge buyers middleman markups. Farmers keep every single Naira earned.',
      icon: Scale,
      color: 'from-emerald-500/10 to-emerald-500/20 text-[#0F5132] border-emerald-200'
    },
    {
      title: 'Verified Producer Identity',
      subtitle: 'Combating Agricultural Fraud',
      description: 'We authenticate local farming clusters, cooperatives, and aggregators with verified contact numbers, physical farm locations, and community seller ratings so buyers can trade with complete confidence.',
      icon: ShieldCheck,
      color: 'from-amber-500/10 to-amber-500/20 text-[#B45309] border-amber-200'
    },
    {
      title: 'Direct WhatsApp & Phone Connectivity',
      subtitle: 'Instant Negotiations',
      description: 'Transactions occur in the real world where Nigerian commerce thrives. Prospective bulk buyers connect directly with producers via one-click mobile telephone calls or pre-structured WhatsApp chat threads.',
      icon: MessageSquare,
      color: 'from-emerald-500/10 to-emerald-500/20 text-[#0F5132] border-emerald-200'
    },
    {
      title: 'All-23 LGAs Deep Agro-Mapping',
      subtitle: 'Unrivaled State-Wide Reach',
      description: 'From the world-famous Zaki Biam Yam Market in Ukum, to the Gboko Rice & Soybean belts, Makurdi citrus groves, and Otukpo grain depots—every corner of Benue State is accessible.',
      icon: MapPin,
      color: 'from-amber-500/10 to-amber-500/20 text-[#B45309] border-amber-200'
    }
  ];

  const valueProps = [
    {
      category: 'For Farmers & Producers',
      roleIcon: Store,
      points: [
        'Break free from predatory middleman cartels that force low farmgate prices at harvest time.',
        'Reach industrial food processors, national grain merchants, and hotel buyers in Lagos, Abuja, Port Harcourt, and Kano.',
        'Showcase wholesale harvest volumes, pricing flexibility, and minimum order quantities (MOQs).',
        'Optional affordable subscription boosts (Starter & Growth VIP) for priority spotlight on the homepage.'
      ]
    },
    {
      category: 'For Buyers, Aggregators & Processors',
      roleIcon: Building,
      points: [
        'Source fresh farm produce directly from the source at authentic primary farmgate prices.',
        'Verify harvest authenticity through community reviews, seller badges, and location maps.',
        'Eliminate unnecessary middleman surcharges that inflate retail and food production costs.',
        'Direct access to bulk quantities: full truckloads of yams, 100kg bags of soybeans, and crates of citrus.'
      ]
    }
  ];

  const faqs = [
    {
      q: 'What is Benue Market and why was it founded?',
      a: 'Benue Market is the premier digital agricultural marketplace built exclusively to connect verified farmers, agro-cooperatives, and wholesale aggregators in Benue State directly with buyers, merchants, and food processors across Nigeria. Benue State is celebrated as the "Food Basket of the Nation", producing an enormous share of Nigeria’s yams, soybeans, benniseed (sesame), citrus, rice, and grains. However, for decades, local farmers suffered severe post-harvest losses and predatory exploitation by multi-layered intermediaries. Benue Market was established to digitize this vital agricultural supply chain, giving rural producers equitable market access and giving buyers direct farmgate transparency.'
    },
    {
      q: 'How does the Direct Farmgate Model work?',
      a: 'Benue Market operates on an open direct-connection model. Farmers and sellers create listings showcasing their fresh produce, harvest photos, location, unit packaging, and price. When a buyer discovers produce they need, they click to initiate an immediate Phone Call or WhatsApp negotiation directly with the seller. There are no mandatory escrow lockups, platform transaction taxes, or hidden commission deductions.'
    },
    {
      q: 'Does Benue Market charge a commission on produce sales?',
      a: 'No. Benue Market is completely free from transaction commissions. Unlike conventional e-commerce platforms that siphon 10% to 25% of sales, we believe agricultural profits belong in the hands of hardworking farmers. Farmers can list produce for free, and only pay an optional nominal fee if they choose to advertise/boost their listing into premium featured spotlights.'
    },
    {
      q: 'How are transactions and logistics handled safely?',
      a: 'Buyers and farmers agree directly on trade terms, payment schedules, and dispatch logistics. We provide comprehensive Safe Trading guidelines: we strongly advise buyers to inspect goods physically or through trusted representatives at verified public market depots (such as Zaki Biam Yam Market, Gboko Main Market, or Wurukum Market Makurdi) before releasing final payment, or use trusted, reputable interstate agro-haulage transport partners.'
    },
    {
      q: 'Which crops and agricultural commodities are covered?',
      a: 'Benue Market covers all major crops and agricultural outputs of Benue State: Tubers & Roots (White Yams, Yellow Yams, Cassava, Sweet Potatoes), Grains & Cereals (Paddy & Milled Rice, Yellow & White Maize, Sorghum), Legumes & Oilseeds (Soybeans, Sesame/Benniseed, Groundnuts, Brown Beans), Fresh Vegetables (Makurdi Tomatoes, Peppers, Okra), Fruits (Valencia Sweet Oranges, Grapefruits, Mangoes, Cashew), Livestock (Goats, Sheep, Cattle), Poultry, Aquaculture (Fresh & Smoked Catfish), and Organic Farm Inputs.'
    },
    {
      q: 'What local government areas does the platform support?',
      a: 'Benue Market provides comprehensive coverage across all 23 Local Government Areas (LGAs) of Benue State, categorized into the 3 official agricultural zones: Zone A (Sankera / Katsina-Ala, Ukum, etc.), Zone B (Tiv Central / Gboko, Makurdi, etc.), and Zone C (Idoma & Igede / Otukpo, Oju, etc.).'
    }
  ];

  return (
    <div className="w-full bg-[#FAF8F5] min-h-screen py-8 md:py-16 text-[#1A1A1A]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">

        {/* ── Section 1: Hero Header ── */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 text-xs font-black text-[#B45309] uppercase tracking-wider bg-amber-100/70 px-4 py-1.5 rounded-full border border-amber-300 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-[#B45309]" />
            <span>Digital Agricultural Backbone of Nigeria</span>
          </div>
          <h1 className="font-black text-3xl sm:text-4xl md:text-5xl text-[#0F5132] tracking-tight leading-tight">
            About Benue Market
          </h1>
          <p className="text-base sm:text-lg text-[#4A5568] leading-relaxed font-medium">
            Bridging the gap between the fertile soil of <strong>Benue State — the Food Basket of the Nation</strong> — and millions of consumers, industrial food processors, and commodity traders across Nigeria and beyond.
          </p>
        </div>

        {/* ── Section 2: Key Platform Metrics Banner ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-3xl border border-[#E8E2D9] shadow-sm text-center space-y-1 hover:border-emerald-300 transition-colors">
            <span className="text-3xl sm:text-4xl font-black text-[#0F5132]">23 / 23</span>
            <div className="text-xs font-bold text-[#111827] uppercase tracking-wide">All Benue LGAs</div>
            <p className="text-[11px] text-[#6B7280]">Complete state-wide agricultural coverage</p>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-[#E8E2D9] shadow-sm text-center space-y-1 hover:border-emerald-300 transition-colors">
            <span className="text-3xl sm:text-4xl font-black text-[#B45309]">0%</span>
            <div className="text-xs font-bold text-[#111827] uppercase tracking-wide">Middleman Cut</div>
            <p className="text-[11px] text-[#6B7280]">Zero commissions on farm produce sales</p>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-[#E8E2D9] shadow-sm text-center space-y-1 hover:border-emerald-300 transition-colors">
            <span className="text-3xl sm:text-4xl font-black text-[#0F5132]">100%</span>
            <div className="text-xs font-bold text-[#111827] uppercase tracking-wide">Direct Farmgate</div>
            <p className="text-[11px] text-[#6B7280]">Instant Phone & WhatsApp negotiations</p>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-[#E8E2D9] shadow-sm text-center space-y-1 hover:border-emerald-300 transition-colors">
            <span className="text-3xl sm:text-4xl font-black text-[#B45309]">#1</span>
            <div className="text-xs font-bold text-[#111827] uppercase tracking-wide">Food Basket Hub</div>
            <p className="text-[11px] text-[#6B7280]">Home of Zaki Biam, the world's yam capital</p>
          </div>
        </div>

        {/* ── Section 3: The Story & Deep Explanation ── */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-[#E8E2D9] shadow-sm space-y-8">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              <Compass className="w-3.5 h-3.5 text-emerald-700" />
              <span>Our Origins & Purpose</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-[#0F5132] tracking-tight">
              Why Benue Market Exists: Solving the Agricultural Dilemma
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-[#4B5563] text-sm leading-relaxed">
            <div className="space-y-4">
              <h3 className="font-extrabold text-lg text-[#111827] flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                <span>The Traditional Problem</span>
              </h3>
              <p>
                Benue State possesses some of the most naturally endowed agricultural ecosystems on the African continent. Fed by the mighty River Benue and blessed with rich alluvial soil, Benue farmers harvest millions of metric tonnes of yams, grains, citrus, and oilseeds every single year.
              </p>
              <p>
                Yet for generations, a crippling paradox held back local prosperity: <strong>exploitative broker cartels and severe post-harvest opacity</strong>. Farmers in remote farming settlements had no direct access to buyers in major Nigerian commercial centers. Intermediaries bought crops at rock-bottom prices, while urban consumers in Lagos, Abuja, and Port Harcourt paid exorbitant sums for the exact same produce.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="font-extrabold text-lg text-[#111827] flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                <span>The Benue Market Solution</span>
              </h3>
              <p>
                <strong>Benue Market</strong> was engineered from the ground up to eliminate these barriers. By combining mobile technology with verified local producer networks, the platform creates an open, transparent, and direct bridge.
              </p>
              <p>
                Now, a yam farmer in <em>Zaki Biam (Ukum LGA)</em>, a rice miller in <em>Gboko</em>, an orange grower in <em>Vandeikya</em>, or a fish farmer along the <em>River Benue in Makurdi</em> can list their harvest on the internet in minutes. Buyers call or chat directly with the farmer, negotiating quantities, delivery terms, and fair farmgate pricing without any middleman siphoning off their profits.
              </p>
            </div>
          </div>
        </div>

        {/* ── Section 4: The 4 Core Pillars of Benue Market ── */}
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <span className="text-xs font-bold text-[#B45309] uppercase tracking-wider bg-amber-100 px-3 py-1 rounded-full border border-amber-200">
              Platform Architecture
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-[#0F5132]">
              The Four Pillars That Power Our Marketplace
            </h2>
            <p className="text-sm text-[#4B5563] max-w-2xl mx-auto">
              Every feature on Benue Market is designed around transparency, simplicity, and direct empowerment.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {corePillars.map((pillar, idx) => {
              const Icon = pillar.icon;
              return (
                <div 
                  key={idx}
                  className="bg-white p-6 sm:p-7 rounded-3xl border border-[#E8E2D9] shadow-sm hover:shadow-md transition-all space-y-3 relative overflow-hidden group"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${pillar.color} border flex items-center justify-center shrink-0`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-black text-lg text-[#111827] group-hover:text-[#0F5132] transition-colors">
                        {pillar.title}
                      </h3>
                      <span className="text-xs font-bold text-[#B45309]">{pillar.subtitle}</span>
                    </div>
                  </div>
                  <p className="text-xs sm:text-sm text-[#4B5563] leading-relaxed pt-1">
                    {pillar.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Section 5: Who Benefits from Benue Market ── */}
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <span className="text-xs font-bold text-[#0F5132] uppercase tracking-wider bg-emerald-100 px-3 py-1 rounded-full border border-emerald-300">
              Value Ecosystem
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-[#0F5132]">
              Empowering Both Ends of the Agricultural Chain
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {valueProps.map((prop, idx) => {
              const RoleIcon = prop.roleIcon;
              return (
                <div 
                  key={idx}
                  className="bg-white p-7 sm:p-8 rounded-3xl border border-[#E8E2D9] shadow-sm space-y-5"
                >
                  <div className="flex items-center gap-3 border-b border-[#F0EBE1] pb-4">
                    <div className="w-10 h-10 rounded-xl bg-[#0F5132] text-white flex items-center justify-center shadow-sm">
                      <RoleIcon className="w-5 h-5 text-[#FEAE3A]" />
                    </div>
                    <h3 className="font-black text-xl text-[#0F5132]">{prop.category}</h3>
                  </div>

                  <ul className="space-y-3.5">
                    {prop.points.map((point, pIdx) => (
                      <li key={pIdx} className="flex items-start gap-3 text-xs sm:text-sm text-[#4B5563] leading-relaxed">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Section 6: Comprehensive 23 LGAs & 3 Agro Zones Coverage ── */}
        <div className="bg-white p-6 sm:p-10 rounded-3xl border border-[#E8E2D9] shadow-sm space-y-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-2">
              <span className="text-xs font-bold text-[#B45309] uppercase tracking-wider bg-amber-100 px-3 py-1 rounded-full border border-amber-300">
                Geographic Presence
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-[#0F5132]">
                Coverage Across All 23 Benue LGAs & 3 Agro-Zones
              </h2>
              <p className="text-xs sm:text-sm text-[#4B5563] max-w-2xl">
                Benue's agricultural trade is organized across three senatorial agricultural zones. Every single local government area and major agricultural trading hub is connected:
              </p>
            </div>

            {/* Zone Filter Buttons */}
            <div className="flex flex-wrap gap-1.5 p-1 bg-[#F4EFEA] rounded-2xl border border-[#E5DFD7]">
              {(['all', 'Zone A', 'Zone B', 'Zone C'] as const).map((zone) => (
                <button
                  key={zone}
                  type="button"
                  onClick={() => setSelectedZone(zone)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    selectedZone === zone
                      ? 'bg-[#0F5132] text-white shadow-sm'
                      : 'text-[#4B5563] hover:text-[#111827] hover:bg-white/60'
                  }`}
                >
                  {zone === 'all' ? 'All 23 LGAs' : `${zone} (${zonesCount[zone]})`}
                </button>
              ))}
            </div>
          </div>

          {/* Zone Descriptions Banner */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
            <div className={`p-4 rounded-2xl border text-xs space-y-1 ${selectedZone === 'Zone A' || selectedZone === 'all' ? 'bg-amber-50/70 border-amber-200' : 'bg-gray-50 border-gray-200 opacity-60'}`}>
              <div className="font-black text-[#92400E]">Zone A (Sankera / Tiv East)</div>
              <p className="text-[11px] text-[#78350F]">World-famous Yam hubs (Zaki Biam), grain silos, soya bean fields, and livestock trading in Katsina-Ala, Ukum, Kwande & Logo.</p>
            </div>
            <div className={`p-4 rounded-2xl border text-xs space-y-1 ${selectedZone === 'Zone B' || selectedZone === 'all' ? 'bg-emerald-50/70 border-emerald-200' : 'bg-gray-50 border-gray-200 opacity-60'}`}>
              <div className="font-black text-[#065F46]">Zone B (MINDA / Jemgbagh)</div>
              <p className="text-[11px] text-[#047857]">Gboko rice mills, Makurdi riverine aquaculture, citrus plantations, cassava flour production, and central distribution depots.</p>
            </div>
            <div className={`p-4 rounded-2xl border text-xs space-y-1 ${selectedZone === 'Zone C' || selectedZone === 'all' ? 'bg-amber-50/70 border-amber-200' : 'bg-gray-50 border-gray-200 opacity-60'}`}>
              <div className="font-black text-[#92400E]">Zone C (Idoma / Igede Agro Belt)</div>
              <p className="text-[11px] text-[#78350F]">Otukpo grain hubs, Oju yam harvests, Agatu freshwater fisheries, palm oil plantations, and southern trade export gates.</p>
            </div>
          </div>

          {/* Grid of LGA Badges */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 pt-2">
            {filteredLGAs.map((lga) => (
              <div
                key={lga.name}
                className="bg-[#FAF8F5] p-3.5 rounded-2xl border border-[#E8E2D9] flex items-center justify-between hover:bg-emerald-50/50 hover:border-emerald-200 transition-colors"
              >
                <div className="space-y-0.5">
                  <div className="font-extrabold text-sm text-[#111827] flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                    <span>{lga.name}</span>
                  </div>
                  <div className="text-[11px] text-[#6B7280] truncate font-medium max-w-[170px]" title={lga.majorMarket}>
                    {lga.majorMarket}
                  </div>
                </div>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-white border border-[#DDD5C7] text-[#4B5563] shrink-0">
                  {lga.zone}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Section 7: Safe Trading Guidelines ── */}
        <div className="bg-gradient-to-br from-[#0F5132] to-[#0A3D24] text-white p-7 sm:p-10 rounded-3xl shadow-lg border border-emerald-700/40 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
              <ShieldCheck className="w-6 h-6 text-[#FEAE3A]" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                Safety, Trust & Fair Trading Guarantee
              </h2>
              <p className="text-xs sm:text-sm text-emerald-200">
                How we protect buyers and farmers in an open direct-connection marketplace
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs sm:text-sm leading-relaxed text-emerald-100">
            <div className="bg-black/20 p-5 rounded-2xl border border-white/10 space-y-2">
              <div className="font-extrabold text-white text-sm flex items-center gap-2">
                <Check className="w-4 h-4 text-[#FEAE3A]" />
                <span>1. Verified Phone & Identity</span>
              </div>
              <p className="text-xs text-emerald-200/90">
                Sellers provide validated Nigerian phone numbers, physical cooperative farm addresses, and earn verified seller badges based on community credibility.
              </p>
            </div>

            <div className="bg-black/20 p-5 rounded-2xl border border-white/10 space-y-2">
              <div className="font-extrabold text-white text-sm flex items-center gap-2">
                <Check className="w-4 h-4 text-[#FEAE3A]" />
                <span>2. Public Market Inspections</span>
              </div>
              <p className="text-xs text-emerald-200/90">
                For wholesale bulk orders (truckloads of yams or grains), we advise physical inspection at major public agricultural depots before finalizing payments.
              </p>
            </div>

            <div className="bg-black/20 p-5 rounded-2xl border border-white/10 space-y-2">
              <div className="font-extrabold text-white text-sm flex items-center gap-2">
                <Check className="w-4 h-4 text-[#FEAE3A]" />
                <span>3. Active Moderation & Reporting</span>
              </div>
              <p className="text-xs text-emerald-200/90">
                Our administrative monitoring team reviews flagged produce, audits suspicious listings, and immediately suspends fraudulent accounts.
              </p>
            </div>
          </div>
        </div>

        {/* ── Section 8: Frequently Asked Questions ── */}
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <span className="text-xs font-bold text-[#0F5132] uppercase tracking-wider bg-emerald-100 px-3 py-1 rounded-full border border-emerald-300">
              Got Questions?
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-[#0F5132]">
              Frequently Asked Questions About Benue Market
            </h2>
            <p className="text-xs sm:text-sm text-[#4B5563] max-w-xl mx-auto">
              Everything you need to know about our business model, listing produce, and sourcing bulk harvest.
            </p>
          </div>

          <div className="space-y-3 max-w-4xl mx-auto">
            {faqs.map((faq, idx) => (
              <div 
                key={idx}
                className="bg-white rounded-2xl border border-[#E8E2D9] overflow-hidden transition-all shadow-sm"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaqIndex(openFaqIndex === idx ? null : idx)}
                  className="w-full p-5 text-left flex items-center justify-between gap-4 font-bold text-sm sm:text-base text-[#111827] hover:bg-[#FAF8F5] transition-colors"
                >
                  <span className="flex items-center gap-2.5">
                    <HelpCircle className="w-4 h-4 text-[#0F5132] shrink-0" />
                    <span>{faq.q}</span>
                  </span>
                  <ChevronDown className={`w-4 h-4 text-[#6B7280] shrink-0 transition-transform duration-300 ${openFaqIndex === idx ? 'rotate-180 text-[#0F5132]' : ''}`} />
                </button>
                {openFaqIndex === idx && (
                  <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-[#4B5563] leading-relaxed border-t border-[#F0EBE1] bg-[#FAF8F5]/50 animate-in fade-in duration-200">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ── Section 9: Call to Action ── */}
        <div className="bg-gradient-to-r from-[#0F5132] via-[#145A32] to-[#0A3D24] text-white p-8 sm:p-12 rounded-3xl text-center space-y-6 shadow-xl border border-emerald-600/30 relative overflow-hidden">
          <div className="max-w-2xl mx-auto space-y-3 relative z-10">
            <span className="text-xs font-black uppercase tracking-wider text-[#FEAE3A] bg-white/10 px-3.5 py-1.5 rounded-full border border-white/20">
              Join Nigeria's Agro Commerce Revolution
            </span>
            <h2 className="font-black text-2xl sm:text-3xl md:text-4xl text-white">
              Ready to Buy or Sell Fresh Benue Harvest?
            </h2>
            <p className="text-xs sm:text-sm text-emerald-100 max-w-xl mx-auto leading-relaxed">
              Whether you are a local farmer ready to showcase your harvest to national buyers or a commodity buyer seeking verified direct farmgate supply, Benue Market is your digital gateway.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-4 pt-2 relative z-10">
            <Link
              to="/browse"
              className="bg-[#FEAE3A] hover:bg-[#E59D2C] text-[#0F5132] font-black text-xs sm:text-sm px-7 py-3.5 rounded-2xl shadow-lg transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
            >
              <Package className="w-4 h-4" />
              <span>Browse Fresh Produce</span>
            </Link>
            <Link
              to="/sell-produce"
              className="bg-white/15 hover:bg-white/25 text-white font-black text-xs sm:text-sm px-7 py-3.5 rounded-2xl border border-white/25 transition-all hover:scale-105 active:scale-95 flex items-center gap-2 backdrop-blur-sm"
            >
              <Store className="w-4 h-4 text-[#FEAE3A]" />
              <span>List Your Produce Free</span>
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
};

