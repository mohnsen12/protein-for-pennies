import Link from "next/link";
import { Recipe } from "@/lib/recipes";
import { asset } from "@/lib/paths";

function ClockIcon() {
  return (
    <svg
      className="clock-icon"
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" strokeLinecap="round" />
    </svg>
  );
}

export default function RecipeCard({ recipe, compact }: { recipe: Recipe; compact?: boolean }) {
  const time = recipe.totalTime.replace("PT", "").toLowerCase();
  return (
    <Link href={`/recipes/${recipe.slug}`} className="recipe-card">
      <div className="card-media">
        {recipe.hasHeroImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={asset(`/images/recipes/${recipe.slug}-hero.jpg`)}
            alt={recipe.title}
            loading="lazy"
            width={800}
            height={800}
          />
        ) : (
          <div className="img-placeholder">
            <span>{recipe.title}</span>
          </div>
        )}
      </div>
      <div className="card-body">
        {!compact && <span className="card-tag">{recipe.category}</span>}
        <h3 className="card-title">{recipe.title}</h3>
        <div className="card-meta">
          <span className="protein-badge">{recipe.nutrition.protein}g protein</span>
          <span className="cost-badge">${recipe.costPerServing.toFixed(2)}/srv</span>
          <span className="time-meta"><ClockIcon />{time}</span>
        </div>
      </div>
    </Link>
  );
}
