import { PageContainer } from "@/ui/components/PageContainer";

export default function DishRecipeLoading() {
  return (
    <PageContainer>
      <div className="animate-pulse" aria-label="Đang mở công thức">
        <div className="h-10 w-40 rounded-full bg-surface" />
        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <div className="aspect-[4/3] rounded-[24px] bg-surface" />
          <div className="space-y-4">
            <div className="h-4 w-28 rounded-full bg-surface" />
            <div className="h-14 w-4/5 rounded-[16px] bg-surface" />
            <div className="h-5 w-full rounded-full bg-surface" />
            <div className="h-5 w-3/4 rounded-full bg-surface" />
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
