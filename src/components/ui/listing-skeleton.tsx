import { memo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

interface ListingSkeletonProps {
  compact?: boolean;
  className?: string;
}

const ListingSkeletonComponent = ({ compact = false, className }: ListingSkeletonProps) => {
  return (
    <Card className={cn(
      "group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm",
      "w-full",
      className
    )}>
      {/* Image - matches ListingCard aspect ratio */}
      <div className="relative w-full overflow-hidden aspect-[1/1] sm:aspect-[4/3]">
        <Skeleton className="absolute inset-0 h-full w-full rounded-none" />
        {/* Category badge */}
        <div className="absolute top-2 left-2 z-20">
          <Skeleton className="h-4 w-16 rounded-md" />
        </div>
        {/* Heart */}
        <Skeleton className="absolute top-2 right-2 h-7 w-7 rounded-full" />
      </div>

      {/* Content below image - matches ListingCard layout */}
      <div className="flex flex-col gap-1 p-2.5 min-w-0">
        {/* Title */}
        <Skeleton className="h-3.5 w-11/12 rounded-sm" />
        <Skeleton className="h-3.5 w-7/12 rounded-sm" />

        {/* Location */}
        <div className="flex items-center gap-1">
          <Skeleton className="h-2.5 w-2.5 rounded-sm flex-shrink-0" />
          <Skeleton className="h-2.5 w-24 rounded-sm" />
        </div>

        {/* Price */}
        <div className="flex items-center gap-1">
          <Skeleton className="h-3 w-16 rounded-sm" />
          <Skeleton className="h-2 w-10 rounded-sm" />
        </div>

        {/* Date */}
        <div className="flex items-center gap-0.5">
          <Skeleton className="h-2.5 w-2.5 rounded-sm" />
          <Skeleton className="h-2.5 w-14 rounded-sm" />
        </div>

        {/* Rating */}
        <div className="flex items-center gap-0.5 pt-0.5">
          <Skeleton className="h-2.5 w-2.5 rounded-sm" />
          <Skeleton className="h-2.5 w-8 rounded-sm" />
        </div>
      </div>
    </Card>
  );
};

export const ListingSkeleton = memo(ListingSkeletonComponent);

export const ListingGridSkeleton = memo(({ count = 8, className }: { count?: number; className?: string }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <ListingSkeleton key={i} />
      ))}
    </>
  );
});

export const HorizontalScrollSkeleton = memo(({ count = 5 }: { count?: number }) => {
  return (
    <div className="flex gap-3 md:gap-4 overflow-x-auto pb-2 scrollbar-hide pl-1 pr-8 md:pl-2 md:pr-12">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex-shrink-0 w-[45vw] md:w-56">
          <ListingSkeleton compact />
        </div>
      ))}
    </div>
  );
});

export function DetailPageSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <Skeleton className="w-full h-[40vh] md:h-[50vh] rounded-none" />
      <div className="container mx-auto px-4 py-6 space-y-6">
        <div className="flex justify-between items-start">
          <div className="space-y-2 flex-1">
            <Skeleton className="h-8 w-3/4 rounded-none" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4 rounded-none" />
              <Skeleton className="h-4 w-32 rounded-none" />
            </div>
          </div>
          <Skeleton className="h-10 w-24 rounded-none" />
        </div>
        <div className="flex gap-3 md:hidden">
          <Skeleton className="h-10 w-24 rounded-xl" />
          <Skeleton className="h-10 w-24 rounded-xl" />
          <Skeleton className="h-10 w-24 rounded-xl" />
        </div>
        <div className="space-y-3 p-6 rounded-3xl border border-border bg-card">
          <Skeleton className="h-4 w-24 rounded-none" />
          <Skeleton className="h-4 w-full rounded-none" />
          <Skeleton className="h-4 w-full rounded-none" />
          <Skeleton className="h-4 w-3/4 rounded-none" />
        </div>
        <div className="space-y-4 p-6 rounded-[32px] border border-border bg-card shadow-xl">
          <Skeleton className="h-6 w-24 rounded-none" />
          <div className="flex justify-between items-center">
            <div className="space-y-1">
              <Skeleton className="h-3 w-16 rounded-none" />
              <Skeleton className="h-8 w-32 rounded-none" />
            </div>
          </div>
          <Skeleton className="h-14 w-full rounded-2xl" />
        </div>
      </div>
    </div>
  );
}