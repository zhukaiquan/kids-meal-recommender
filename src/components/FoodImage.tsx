import type { FoodImage as FoodImageValue } from "../domain/types";

type FoodImageProps = {
  image: FoodImageValue | null;
  alt: string;
};

export function FoodImage({ image, alt }: FoodImageProps) {
  if (!image) {
    return (
      <div aria-label={`${alt}占位图`}>
        <span>暂无图片</span>
      </div>
    );
  }

  return <img src={image.thumbnailUrl} alt={alt} />;
}
