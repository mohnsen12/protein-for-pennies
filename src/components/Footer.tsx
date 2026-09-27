import Link from "next/link";
import { SITE } from "@/lib/site";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container">
        <p className="footer-brand">
          Protein <span style={{ opacity: 0.85 }}>for Pennies</span>
        </p>
        <div className="cols">
          <div className="footer-col">
            <span className="caption">Recipes</span>
            <ul>
              <li><Link href="/recipes">All dinners</Link></li>
              <li><Link href="/recipes#Chicken">Chicken</Link></li>
              <li><Link href="/recipes#Ground%20Beef">Ground beef</Link></li>
              <li><Link href="/recipes#Beans%20%26%20Lentils">Beans &amp; lentils</Link></li>
            </ul>
          </div>
          <div className="footer-col">
            <span className="caption">Plan</span>
            <ul>
              <li><Link href="/meal-plan">This week&apos;s meal plan</Link></li>
              <li><Link href="/recipes#Eggs">Egg dinners</Link></li>
              <li><Link href="/recipes#Canned%20Fish">Canned fish</Link></li>
              <li><Link href="/recipes#Tofu%20%26%20Plant%20Protein">Plant protein</Link></li>
            </ul>
          </div>
          <div className="footer-col">
            <span className="caption">About</span>
            <ul>
              <li><Link href="/about">How we keep it cheap</Link></li>
              <li><Link href="/privacy">Privacy</Link></li>
              <li><Link href="/terms">Terms &amp; disclosures</Link></li>
              <li>
                {SITE.pinterest ? (
                  <a href={SITE.pinterest} target="_blank" rel="noreferrer">Pinterest</a>
                ) : (
                  <span style={{ opacity: 0.7 }}>Pinterest (coming)</span>
                )}
              </li>
            </ul>
          </div>
        </div>
        <p className="disclaimer">
          Nutrition values are estimates calculated from standard ingredient data and may vary with
          brands and portioning. Prices are US estimates based on typical grocery-store pricing and
          will vary by store and region. Some recipe imagery is AI-generated for illustration.
          © {new Date().getFullYear()} {SITE.name}.
        </p>
      </div>
    </footer>
  );
}
