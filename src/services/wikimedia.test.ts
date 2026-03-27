import { describe, expect, it, vi } from "vitest";
import { searchFoodImages } from "./wikimedia";

describe("searchFoodImages", () => {
  it("maps Commons pages into image candidates", async () => {
    const fetcher = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        query: {
          pages: {
            "1": {
              title: "File:Cartoon Egg.png",
              fullurl: "https://commons.wikimedia.org/wiki/File:Cartoon_Egg.png",
              imageinfo: [
                {
                  thumburl: "https://upload.wikimedia.org/thumb/egg.png",
                  url: "https://upload.wikimedia.org/egg.png",
                  extmetadata: {
                    Artist: { value: "Kid Artist" },
                    LicenseShortName: { value: "CC BY-SA 4.0" },
                  },
                },
              ],
            },
          },
        },
      }),
    });

    const results = await searchFoodImages("鸡蛋", fetcher as typeof fetch);

    expect(results).toEqual([
      {
        thumbnailUrl: "https://upload.wikimedia.org/thumb/egg.png",
        fullUrl: "https://upload.wikimedia.org/egg.png",
        sourceName: "wikimedia-commons",
        sourcePageUrl: "https://commons.wikimedia.org/wiki/File:Cartoon_Egg.png",
        authorName: "Kid Artist",
        license: "CC BY-SA 4.0",
        searchQuery: "鸡蛋 插画 卡通 食物",
      },
    ]);
  });
});
