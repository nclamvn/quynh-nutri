import { REPERTOIRE } from "@/data/seed/repertoire";
import { RecipeDetailView } from "@/ui/components/RecipeDetailView";

export function generateStaticParams() {
  return REPERTOIRE.map((dish) => ({ dishId: dish.id }));
}

export default async function DishRecipePage({
  params,
}: PageProps<"/dishes/[dishId]">) {
  const { dishId } = await params;
  return <RecipeDetailView dishId={dishId} />;
}
