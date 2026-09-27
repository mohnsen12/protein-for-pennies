export const SITE = {
  name: process.env.NEXT_PUBLIC_SITE_NAME || "Protein for Pennies",
  url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  tagline: "High-protein dinners under $3 a serving.",
  description:
    "Cheap, high-protein dinner recipes with macros and price per serving on every recipe. Eat strong without spending big — every dinner costs under $3 a portion.",
  niche: "high-protein budget dinners",
  // Social handles — update when accounts are live
  pinterest: "https://www.pinterest.com/proteinforpennies/",
  facebook: "",
  instagram: "",
  // Monetization (phase 2 — paywall is NOT active at launch). Flip to true when
  // the Stripe membership goes live; recipe pages + JSON-LD react automatically.
  premiumEnabled: false,
  pricePerMonth: 4.99,
  currency: "USD",
};

export const CATEGORIES = [
  "Chicken",
  "Ground Beef",
  "Eggs",
  "Dairy & Cottage Cheese",
  "Canned Fish",
  "Beans & Lentils",
  "Tofu & Plant Protein",
  "Turkey & Pork",
  "Bowls & Pasta",
] as const;
