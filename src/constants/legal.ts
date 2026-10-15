// ═════════════════════════════════════════════════════════════════════════════════
// BENUE MARKET — TERMS & CONDITIONS & LEGAL SPECIFICATIONS
// Notice: This legal copy is configurable and provided for platform governance.
// Review with qualified legal counsel before formal production deployment.
// ═════════════════════════════════════════════════════════════════════════════════

export const CURRENT_TERMS_VERSION = '1.0.0';
export const TERMS_LAST_UPDATED = 'October 15, 2026';
export const TERMS_EFFECTIVE_DATE = 'October 15, 2026';

export interface LegalSection {
  id: string;
  number: string;
  title: string;
  category: 'general' | 'farmer' | 'buyer' | 'promotion' | 'safety' | 'privacy';
  summary?: string;
  paragraphs: string[];
  bulletPoints?: string[];
}

export const LEGAL_SECTIONS: LegalSection[] = [
  {
    id: 'intro',
    number: '1',
    title: 'Introduction & Acceptance of Terms',
    category: 'general',
    summary: 'By accessing Benue Market or creating an account, you enter into a binding agreement with Benue Market.',
    paragraphs: [
      'Welcome to Benue Market ("the Platform", "we", "us", or "our"). Benue Market is a specialized digital agricultural directory and matchmaking gateway built specifically for Benue State, known as the "Food Basket of the Nation".',
      'These Terms & Conditions ("Terms") govern your access to and use of the Benue Market website, services, mobile web interfaces, and communication tools. By registering an account, listing farm produce, browsing harvest directories, or contacting farmers or buyers, you explicitly acknowledge that you have read, understood, and agreed to be bound by these Terms and our Privacy Policy.',
      'If you do not agree with any part of these Terms, you must immediately refrain from creating an account and cease using the platform.',
    ],
  },
  {
    id: 'direct-connection-model',
    number: '2',
    title: 'Direct Farmer-to-Buyer Connection Model (Zero Middlemen)',
    category: 'general',
    summary: 'Benue Market connects buyers and farmers directly. We do not process payments for produce, manage delivery, or charge transaction commissions.',
    paragraphs: [
      'Benue Market is designed as an open, transparent digital gateway connecting local farmers and agricultural cooperatives across all 23 Local Government Areas (LGAs) of Benue State directly with wholesale grain merchants, food aggregators, institutions, and household buyers across Nigeria.',
      'To preserve maximum value for our farmers and provide genuine farmgate prices for buyers, Benue Market operates strictly as an information directory and communication platform. Please review our operational boundaries carefully:',
    ],
    bulletPoints: [
      'No Shopping Carts or In-App Checkout: Benue Market does not provide an online shopping cart, instant digital checkout, or wallet escrow for harvest purchases.',
      'Direct Buyer-Farmer Negotiation: All negotiations, price agreements, quality inspections, payment terms, and delivery arrangements take place directly between the buyer and the farmer via direct phone call or WhatsApp.',
      'No Transaction Commissions: Benue Market charges 0% commission on agricultural harvest sales. 100% of the sale price stays between the buyer and the farmer.',
      'No Platform Delivery Logistics: Benue Market does not own haulage trucks, operate shipping services, or guarantee transit waybills. Haulage and logistics must be mutually agreed upon by the transacting parties.',
      'Direct Payments: Any payment for produce must be arranged directly between buyer and seller using trusted, verified banking or on-site cash-on-delivery arrangements. Benue Market never collects funds for produce purchases.',
    ],
  },
  {
    id: 'registration-eligibility',
    number: '3',
    title: 'User Accounts, Roles & Registration Integrity',
    category: 'general',
    summary: 'Users must provide truthful details and select the appropriate account type (Farmer/Producer vs Buyer/Merchant).',
    paragraphs: [
      'To access certain features of the platform, including listing farm harvests or saving favorite produce, you must register an account. During registration, you are required to select your designated user role:',
    ],
    bulletPoints: [
      'Farmer / Producer (Seller Account): For individual farmers, cooperative societies, and agricultural enterprises located in or farming within Benue State who wish to list produce for sale.',
      'Buyer / Merchant (Customer Account): For food merchants, grain aggregators, food processing enterprises, restaurants, and individuals sourcing farm produce from Benue State.',
      'Truthful Identity: You agree to provide true, accurate, current, and complete registration information (name, valid personal email, active Nigerian phone number, and primary Benue LGA location).',
      'Account Security: You are solely responsible for maintaining the confidentiality of your login credentials and for all activities that occur under your account.',
      'Explicit Acceptance Required: An unchecked, mandatory checkbox must be explicitly checked during registration to confirm acceptance of these Terms and our Privacy Policy before account creation is completed.',
    ],
  },
  {
    id: 'farmer-obligations',
    number: '4',
    title: 'Farmer & Seller Rules and Listing Standards',
    category: 'farmer',
    summary: 'Sellers must maintain truthful produce listings, accurate farmgate pricing in Naira, and genuine harvest locations.',
    paragraphs: [
      'Farmers and agricultural sellers play a pivotal role in maintaining the reputation of Benue State agriculture. By registering as a Farmer or listing produce, you pledge to adhere to strict quality and transparency standards:',
    ],
    bulletPoints: [
      'Truthful Listings: All product descriptions, crop varieties, harvest dates, quantities, and quality grades must accurately represent genuine agricultural goods available in Benue State.',
      'Accurate Farmgate Pricing: Prices must be quoted honestly in Nigerian Naira (₦) with appropriate measurement units (e.g., per 100 Tubers, per 100kg Bag, per Crate, per Head of Livestock). Artificially misleading prices intended to bait buyers are strictly prohibited.',
      'Authentic Produce Images: Sellers are encouraged to upload genuine photos of their own harvest, farm depot, or cooperative storage. Misleading stock photos that misrepresent quality are forbidden.',
      'Valid Location Representation: Sellers must correctly specify the Benue LGA (e.g., Ukum, Gboko, Otukpo, Katsina-Ala, Kwande) and local market or depot where the harvest is located.',
      'Prompt Direct Communication: Farmers must maintain active phone numbers and responsive WhatsApp lines to attend to legitimate buyer inquiries.',
      'Fulfillment Honesty: If a listed harvest is sold out, damaged, or no longer available, the farmer must promptly update the listing availability or remove it from the catalog.',
    ],
  },
  {
    id: 'buyer-obligations',
    number: '5',
    title: 'Buyer & Merchant Rules and Purchasing Conduct',
    category: 'buyer',
    summary: 'Buyers must communicate respectfully, conduct fair negotiations, and perform necessary due diligence before dispatching funds.',
    paragraphs: [
      'Buyers and food merchants are valued partners in sustaining Benue farming communities. When interacting with farmers on Benue Market, buyers agree to the following code of conduct:',
    ],
    bulletPoints: [
      'Respectful Inquiries: Inquiries directed to farmers via phone or WhatsApp must be genuine, commercial, or household purchase inquiries conducted with courtesy and professional respect.',
      'Fair Negotiation: While direct price negotiation is customary and welcomed in agricultural trade, buyers must not engage in predatory, deceptive, or bad-faith negotiations.',
      'Due Diligence & Verification: Because Benue Market is a directory rather than an escrow agent, buyers are strongly encouraged to inspect produce physically (or via a trusted representative or verified logistics partner at the market depot) prior to releasing substantial wholesale funds.',
      'No Frivolous Waybill Requests: Buyers must not instruct farmers to load or transport produce without reaching a mutually agreed-upon payment and transportation protocol.',
      'Reporting Malpractice: If a seller behaves suspiciously, misrepresents goods, or attempts a fraudulent transaction, the buyer should report the incident immediately via our in-app reporting tool.',
    ],
  },
  {
    id: 'paid-promotions',
    number: '6',
    title: 'Paid Product-Promotion Subscriptions & Advertising Policy',
    category: 'promotion',
    summary: 'Optional paid promotion plans (Starter ₦2,000 / Growth ₦5,000) boost product visibility. Ordinary marketplace listing remains free of commission.',
    paragraphs: [
      'To help farmers and agricultural enterprises achieve higher visibility and connect with interstate bulk buyers, Benue Market offers optional paid promotional subscription plans for specific produce listings.',
      'Listing produce and contacting buyers is completely free of transaction commissions. Promotional subscriptions are entirely optional and exist solely to enhance listing exposure:',
    ],
    bulletPoints: [
      'Starter Plan (₦2,000 per month): Provides 30 days of active verified promotion, priority ranking in search results, a verified produce badge, and basic contact performance metrics.',
      'Growth Plan (₦5,000 per month): Provides top placement in the VIP Homepage Sponsored Harvests Carousel, gold highlight border styling, top-pinned ranking across category filters, interstate bulk buyer spotlighting, and priority help desk support.',
      'Transparent Pricing: The fees for paid promotion are strictly ₦2,000 for Starter and ₦5,000 for Growth per 30-day cycle. There are no setup fees, hidden charges, or percentage commissions taken from harvest sales.',
      'Secure Payment Processing: Promotion subscription payments are processed securely via our licensed payment gateway partner (Paystack). Benue Market does not store payment card numbers, CVVs, or bank PINs.',
      'No Automatic Hidden Renewals: Subscriptions do not automatically debit your account without your affirmative renewal action.',
      'Non-Refundable After Activation: Due to immediate digital visibility and search priority upon payment verification, promotional subscription fees are non-refundable once activated, unless a technical error occurred on our platform.',
    ],
  },
  {
    id: 'safety-and-offline-trade',
    number: '7',
    title: 'Off-Platform Trade Safety & Anti-Fraud Guidelines',
    category: 'safety',
    summary: 'Guidelines for safely completing face-to-face or depot-based agricultural transactions in Benue State markets.',
    paragraphs: [
      'Because transactions occur directly between parties outside of our technical infrastructure, both buyers and sellers must exercise sound commercial caution and adhere to agricultural trade best practices:',
    ],
    bulletPoints: [
      'Meet at Recognized Agricultural Hubs: Whenever possible, conduct physical inspections and trade handovers at recognized, busy Benue market depots (e.g., Zaki Biam Yam Market in Ukum, Gboko Rice Mill Center, Wadata Market in Makurdi, Otukpo Grain Market, or Adikpo Grain Market in Kwande).',
      'Verify Before Large Electronic Transfers: Do not transfer large sums of money to unknown individuals without verifying identity, cooperative membership, or physical presence of the crop batch.',
      'Waybill & Haulage Documentation: For interstate deliveries, use registered logistics haulage operators who issue formal waybill receipts, driver identity verification, and vehicle registration records.',
      'Beware of Unrealistically Low Prices: If an offer sounds too good to be true (e.g., white yams or soybeans priced at half the prevailing market rate), proceed with extreme caution as it may be a lure for fraudulent advance-fee schemes.',
    ],
  },
  {
    id: 'prohibited-conduct',
    number: '8',
    title: 'Prohibited Conduct & Fraud Prevention',
    category: 'general',
    summary: 'Strict zero-tolerance policy against scams, false claims, harassment, and illegal agricultural activities.',
    paragraphs: [
      'To maintain a safe, trusted digital agricultural ecosystem for Benue State, users are strictly prohibited from engaging in any of the following activities:',
    ],
    bulletPoints: [
      'Publishing fraudulent, counterfeit, stolen, or non-existent agricultural listings.',
      'Using another individual\'s phone number, name, or cooperative credentials without explicit authorization.',
      'Engaging in advance-fee fraud, deceptive bank transfer claims, or fake payment proof slips.',
      'Harassing, threatening, or sending abusive or unsolicited marketing spam to farmers or buyers.',
      'Listing hazardous, prohibited, or unauthorized chemicals, contraband, or wildlife.',
      'Attempting to scrape, reverse engineer, compromise, or overload the Benue Market platform infrastructure.',
    ],
  },
  {
    id: 'reporting-and-disputes',
    number: '9',
    title: 'Reporting Violations, Dispute Handling & Support',
    category: 'general',
    summary: 'Our in-app reporting tool and customer support desk investigate community complaints and mediate platform issues.',
    paragraphs: [
      'We empower our community to self-regulate and report any bad actors swiftly:',
    ],
    bulletPoints: [
      'In-App Reporting: Every produce listing and seller profile features a "Report" button allowing users to report scams, fake pricing, offensive conduct, or suspicious activity directly to platform administrators.',
      'Administrative Review: Our compliance team reviews submitted reports, inspects evidence, and contacts involved parties when appropriate.',
      'Support Desk & Tickets: Users experiencing account issues, payment verification delays for subscriptions, or trade grievances can submit a formal support ticket via the Support Portal or contact desk.',
      'Independent Dispute Limitation: Because Benue Market is not a party to bilateral trade contracts, we cannot compel monetary refunds or legal restitution between independent traders. However, we cooperate fully with verified law enforcement agencies upon receipt of lawful requests.',
    ],
  },
  {
    id: 'suspension-and-termination',
    number: '10',
    title: 'Account Suspension, Progressive Lockouts & Appeals',
    category: 'general',
    summary: 'Accounts breaching community rules or failing security thresholds face progressive lockouts, suspension, or permanent termination.',
    paragraphs: [
      'To ensure integrity across the ecosystem, Benue Market enforces an automated and administrative security policy:',
    ],
    bulletPoints: [
      'Automated Security Lockouts: Repeated incorrect password entries trigger progressive security lockouts (e.g., 5-minute cooldown) to protect accounts from brute-force takeover attempts.',
      'Administrative Suspension: We reserve the absolute right to suspend or terminate any user account, hide listings, or revoke verified badges without prior notice if we determine in good faith that a user has violated these Terms, engaged in fraudulent activity, or harmed platform trust.',
      'Reopening Appeals Process: A suspended user may submit a formal Account Reopening Request detailing their explanation and supporting documentation. Reopening requests are reviewed by the Super Administrator, whose determination is final.',
    ],
  },
  {
    id: 'privacy-summary',
    number: '11',
    title: 'Privacy Policy & Data Handling Summary',
    category: 'privacy',
    summary: 'How we collect, utilize, and protect your personal information on Benue Market.',
    paragraphs: [
      'Your privacy and data security are paramount. This section outlines our core privacy practices:',
    ],
    bulletPoints: [
      'Information We Collect: When registering, we collect your name, email, Nigerian phone number, WhatsApp contact, account role, and Benue LGA. When listing produce, we collect product photos, pricing, and farm location descriptions.',
      'Public Marketplace Information: To facilitate direct trade, a farmer\'s name, verified badge status, LGA, listed produce, and contact phone number/WhatsApp link are displayed publicly on produce listings and the farmer directory.',
      'Data Usage: We use your data to authenticate your account, display produce listings, facilitate direct communication with buyers, process subscription payments, send critical security notices, and prevent fraud.',
      'No Selling of Personal Data: We never sell, rent, or trade your personal information to third-party advertisers or external data brokers.',
      'Security Measures: We implement industry-standard database encryption, Row-Level Security (RLS) policies, hashed passwords, and secure HTTPS transmission.',
    ],
  },
  {
    id: 'disclaimers-and-liability',
    number: '12',
    title: 'Disclaimers of Warranties & Limitation of Liability',
    category: 'general',
    summary: 'The platform is provided "as is". Benue Market is an intermediary directory and is not liable for bilateral trading outcomes.',
    paragraphs: [
      'The Platform and all listings, content, and materials available on it are provided on an "as is" and "as available" basis without warranties of any kind, whether express or implied.',
      'Benue Market does not warrant that produce listed by third-party farmers will meet particular standards of merchantability, agricultural grade, shelf life, or fitness for purpose, nor do we guarantee the financial solvency, integrity, or punctuality of any buyer or seller.',
      'To the fullest extent permissible by applicable law, Benue Market, its founders, operators, affiliates, and representatives shall not be liable for any direct, indirect, incidental, special, consequential, or punitive damages resulting from transactions conducted between users, transit losses, spoilage, agricultural crop failures, or reliance on information obtained via the platform.',
    ],
  },
  {
    id: 'versioning-and-updates',
    number: '13',
    title: 'Legal Versioning, Amendments & Notification',
    category: 'general',
    summary: 'We may update these Terms periodically. Material updates require explicit user re-acceptance.',
    paragraphs: [
      'Benue Market reserves the right to amend, update, or replace these Terms & Conditions from time to time to reflect changes in agricultural regulations, operational practices, platform capabilities, or legal requirements.',
      `Each iteration is assigned a formal version number (currently v${CURRENT_TERMS_VERSION}) and timestamped with an effective date.`,
      'When material amendments are made, registered users will be notified upon their next sign-in via an in-app notice and prompted to review and re-accept the updated terms before proceeding. Continued use of the platform following notification constitutes full acceptance of the updated terms.',
    ],
  },
  {
    id: 'governing-law-and-contact',
    number: '14',
    title: 'Governing Law & Official Contact Details',
    category: 'general',
    summary: 'These terms are governed by the laws of Benue State and the Federal Republic of Nigeria.',
    paragraphs: [
      'These Terms shall be construed and governed in accordance with the laws of the Federal Republic of Nigeria, with specific regard to applicable statutes in Benue State. Any disputes arising out of these Terms that cannot be settled amicably shall be submitted to mediation in Makurdi, Benue State.',
      'For official legal inquiries, partnership discussions, or support regarding these Terms, please contact our administrative desk:',
    ],
    bulletPoints: [
      'Platform: Benue Market — Direct Farmgate Commerce',
      'Headquarters / Operations: Makurdi, Benue State, Nigeria 🇳🇬',
      'Support Email: support@benuemarket.ng / keghterhemba19@gmail.com',
      'Customer Care & Verification Desk: Available via the in-app Support Center',
      'Operating Hours: Monday – Saturday, 8:00 AM – 6:00 PM WAT',
    ],
  },
];
