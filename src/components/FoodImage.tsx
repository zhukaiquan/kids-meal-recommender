import type { FoodImage as FoodImageValue } from "../domain/types";

type FoodImageProps = {
  image: FoodImageValue | null;
  alt: string;
  className?: string;
};

function joinClassNames(...values: Array<string | undefined>) {
  return values.filter(Boolean).join(" ");
}

export function FoodImage({ image, alt, className }: FoodImageProps) {
  if (!image) {
    return (
      <div className={joinClassNames("food-image", "food-image--placeholder", className)} aria-label={`${alt}占位图`}>
        <span>暂无图片</span>
      </div>
    );
  }

  return <img className={joinClassNames("food-image", className)} src={image.thumbnailUrl} alt={alt} loading="lazy" />;
}
