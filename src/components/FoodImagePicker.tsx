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
    <section className="image-picker" aria-label="食物图片选择">
      <div className="image-picker__heading">
        <div>
          <h3>食物图片</h3>
          <p>给这张食物卡配一张图，翻牌时会更像小游戏。</p>
        </div>
      </div>

      <div className="image-picker__stage">
        <div className="image-picker__preview">
          <span>当前图片</span>
          <FoodImage image={value} alt={keyword.trim() || "食物"} />
        </div>

        <div className="image-picker__controls">
          <button
            type="button"
            className="image-picker__search"
            onClick={handleSearch}
            disabled={isLoading || !keyword.trim()}
          >
            {isLoading ? "搜索中..." : "搜索图片"}
          </button>
          <button type="button" className="image-picker__clear" onClick={() => onChange(null)}>
            不设置图片
          </button>
          {!keyword.trim() ? <p>先填写食物名称，再搜索图片。</p> : null}
        </div>
      </div>

      {hasSearched && results.length === 0 && !isLoading ? <p>没有找到合适的图片</p> : null}

      <div className="image-picker__results">
        {results.map((image) => (
          <button
            key={image.fullUrl}
            type="button"
            className="image-picker__result"
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
