import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms & disclosures",
  description: "Terms of use, nutrition disclaimer, and affiliate disclosure for Protein for Pennies.",
};

export default function TermsPage() {
  return (
    <section className="container prose">
      <h1>Terms &amp; disclosures</h1>
      <p>Last updated: September 26, 2026.</p>
      <h2>Use of recipes</h2>
      <p>
        Recipes are for personal, non-commercial use. You are welcome to cook them, adapt them in
        your own kitchen, and share the link. Please do not republish the recipe text or photos
        elsewhere without permission.
      </p>
      <h2>Nutrition &amp; pricing disclaimer</h2>
      <p>
        Nutrition values and cost-per-serving figures are estimates based on standard ingredient
        data and typical US grocery prices. Actual values vary with brands, regions, and portion
        sizes. Nothing on this site is medical or dietary advice — consult a professional for
        personal nutrition guidance.
      </p>
      <h2>Food safety</h2>
      <p>
        Follow safe food-handling practice, including cooking meat to safe internal temperatures.
        Our timings assume typical home equipment; your stove and oven may vary.
      </p>
      <h2>Affiliate disclosure</h2>
      <p>
        Some links to equipment or pantry staples are affiliate links. If you purchase through
        them, we may earn a commission at no additional cost to you.
      </p>
      <h2>AI imagery</h2>
      <p>
        Some food photography is AI-generated to illustrate the finished dish. Recipes themselves
        are developed and written by our team.
      </p>
    </section>
  );
}
