import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About — how every recipe stays under $3",
  description:
    "Why we print price per serving and protein per serving on every recipe, and how our budget protein recipes are built.",
};

export default function AboutPage() {
  return (
    <section className="container prose">
      <h1>About Protein for Pennies</h1>
      <p>
        Eating enough protein is the single most common problem in a grocery budget. Chicken
        breasts, Greek yogurt, and &quot;healthy&quot; recipes add up fast — and most recipe sites
        never tell you what a plate actually costs.
      </p>
      <p>
        Every recipe here does three things differently:
      </p>
      <ul>
        <li>
          <strong>Price per serving is printed on the recipe.</strong> Estimated with typical US
          grocery pricing, so you can see before you cook whether it fits your week.
        </li>
        <li>
          <strong>Protein per serving is printed too.</strong> No counting required — every dinner
          here is built to deliver a serious hit of protein without a serious bill.
        </li>
        <li>
          <strong>Weeknight-real.</strong> Most recipes are 30–45 minutes total, use one or two
          pans, and lean on cheap protein workhorses: chicken thighs, ground beef, eggs, lentils,
          cottage cheese, canned fish.
        </li>
      </ul>
      <h2>How the recipes are developed</h2>
      <p>
        Recipes are developed in-house from classic budget-cooking building blocks — flavor
        combinations and techniques that are well known to home cooks — and written fresh for this
        site, with ingredient swaps chosen specifically to cut cost without cutting protein. We
        publish our own tested quantities, timings, and money-saving tips rather than reproducing
        anyone else&apos;s written recipes.
      </p>
      <h2>Imagery</h2>
      <p>
        Some food photography on this site is AI-generated for illustration. It shows the kind of
        finished dish the recipe produces; ingredient brands and finishes may differ.
      </p>
      <h2>Get in touch</h2>
      <p>
        Found a cheaper swap for one of our recipes? That&apos;s the whole sport — tell us on
        Pinterest.
      </p>
    </section>
  );
}
