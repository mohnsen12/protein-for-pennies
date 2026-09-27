import Link from "next/link";

export default function Header() {
  return (
    <header className="site-header">
      <div className="container inner">
        <Link href="/" className="brand">
          Protein <span className="pennies">for Pennies</span>
        </Link>
        <nav className="nav">
          <Link href="/recipes">Recipes</Link>
          <Link href="/meal-plan">Meal Plan</Link>
          <Link href="/about">About</Link>
          <Link href="/recipes" className="nav-cta">
            Browse dinners
          </Link>
        </nav>
      </div>
    </header>
  );
}
