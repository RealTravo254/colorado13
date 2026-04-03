import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface CategoryCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  onClick: () => void;
  className?: string;
  bgImage?: string;
}

export const CategoryCard = ({
  icon: Icon,
  title,
  description,
  onClick,
  className,
  bgImage,
}: CategoryCardProps) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "group cursor-pointer overflow-hidden rounded-2xl transition-all duration-300 hover:shadow-lg hover:-translate-y-1 relative",
        className
      )}
    >
      {bgImage ? (
        <>
          <div className="relative w-full aspect-[4/3] overflow-hidden">
            <img
              src={bgImage}
              alt={title}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-2 text-center">
            <h3 className="font-bold text-[10px] text-white uppercase tracking-wider drop-shadow-md">{title}</h3>
          </div>
        </>
      ) : (
        <div className="p-2 flex flex-col items-center text-center gap-1 bg-card border-2 border-border rounded-2xl hover:border-primary">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-primary-foreground group-hover:scale-110 transition-transform duration-300">
            <Icon className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-bold text-xs text-foreground">{title}</h3>
          </div>
        </div>
      )}
    </button>
  );
};
