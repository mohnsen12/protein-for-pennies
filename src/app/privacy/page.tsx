import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy policy",
  description: "Privacy policy for Protein for Pennies.",
};

export default function PrivacyPage() {
  return (
    <section className="container prose">
      <h1>Privacy policy</h1>
      <p>Last updated: September 26, 2026.</p>
      <p>
        We collect as little data as possible. This site does not require an account and does not
        sell personal data.
      </p>
      <h2>Analytics</h2>
      <p>
        We use privacy-respecting analytics to count visits and see which recipes are popular.
        Analytics data is aggregated and is not used to identify you personally.
      </p>
      <h2>Advertising &amp; affiliate cookies</h2>
      <p>
        If/when advertising is enabled, ad partners may set cookies to measure and personalize ads.
        Some outbound links to kitchen equipment are affiliate links: if you buy through them we may
        earn a small commission at no extra cost to you. This never affects which products we
        recommend or recipe pricing shown.
      </p>
      <h2>Premium memberships (future)</h2>
      <p>
        If you purchase a membership, payments are processed by Stripe. We receive your email
        address and subscription status only — never your card details.
      </p>
      <h2>Contact</h2>
      <p>Questions about this policy? Reach us via the Pinterest page.</p>
    </section>
  );
}
