import Link from "next/link";

export default function NotFound() {
  return (
    <section className="hero container" style={{ paddingBottom: 60 }}>
      <p className="kicker">404 — Recipe not found</p>
      <h1>
        This dish isn&apos;t <em>on the menu.</em>
      </h1>
      <p className="sub">
        The page you were looking for doesn&apos;t exist — but there are plenty of cheap,
        high-protein dinners that do.
      </p>
      <div style={{ marginTop: 28, display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
        <Link href="/recipes" className="btn btn-primary">
          Browse all dinners
        </Link>
        <Link href="/meal-plan" className="btn btn-ghost">
          This week&apos;s plan
        </Link>
      </div>
    </section>
  );
}
