import { useState } from "react";
import type { FoodImage as FoodImageValue } from "../domain/types";
import { searchFoodImages } from "../services/wikimedia";
import { FoodImage } from "./FoodImage";

type FoodImagePickerProps = {
  keyword: string;
  value: FoodImageValue | null;
  onChange: (value: FoodImageValue | null) => void;
};

export function FoodImagePicker({ keyword, value, onChange }: FoodImagePickerProps) {
  const [results, setResults] = useState<FoodImageValue[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  async function handleSearch() {
    setIsLoading(true);
    setHasSearched(true);

    const nextResults = await searchFoodImages(keyword);

    setResults(nextResults);
    setIsLoading(false);
  }

  return (
    <section aria-label="食物图片选择">
      <p>当前图片</p>
      <FoodImage image={value} alt={keyword.trim() || "食物"} />

      <div>
        <button type="button" onClick={handleSearch} disabled={isLoading || !keyword.trim()}>
          {isLoading ? "搜索中..." : "搜索图片"}
        </button>
        <button type="button" onClick={() => onChange(null)}>
          不设置图片
        </button>
      </div>

      {hasSearched && results.length === 0 && !isLoading ? <p>没有找到合适的图片</p> : null}

      <div>
        {results.map((image) => (
          <button
            key={image.fullUrl}
            type="button"
            aria-pressed={value?.fullUrl === image.fullUrl}
            onClick={() => onChange(image)}
          >
            <FoodImage image={image} alt={`${keyword || "食物"}图片`} />
            <span>{image.license ?? "未知许可"}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
