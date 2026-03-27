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

  it("uses the Commons search endpoint with the expected query params", async () => {
    const fetcher = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ query: { pages: {} } }),
    });

    await searchFoodImages("鸡蛋", fetcher as typeof fetch);

    expect(fetcher).toHaveBeenCalledTimes(1);
    const requestedUrl = new URL(fetcher.mock.calls[0][0] as string);
    expect(requestedUrl.origin + requestedUrl.pathname).toBe(
      "https://commons.wikimedia.org/w/api.php",
    );
    expect(requestedUrl.searchParams.get("action")).toBe("query");
    expect(requestedUrl.searchParams.get("format")).toBe("json");
    expect(requestedUrl.searchParams.get("origin")).toBe("*");
    expect(requestedUrl.searchParams.get("generator")).toBe("search");
    expect(requestedUrl.searchParams.get("gsrnamespace")).toBe("6");
    expect(requestedUrl.searchParams.get("gsrsearch")).toBe("鸡蛋 插画 卡通 食物");
    expect(requestedUrl.searchParams.get("gsrlimit")).toBe("6");
    expect(requestedUrl.searchParams.get("prop")).toBe("imageinfo|info");
    expect(requestedUrl.searchParams.get("inprop")).toBe("url");
    expect(requestedUrl.searchParams.get("iiprop")).toBe("url|extmetadata");
    expect(requestedUrl.searchParams.get("iiurlwidth")).toBe("320");
  });

  it("returns an empty list when the response is not ok", async () => {
    const fetcher = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => {
        throw new Error("should not parse");
      },
    });

    await expect(searchFoodImages("鸡蛋", fetcher as typeof fetch)).resolves.toEqual(
      [],
    );
  });

  it("returns an empty list when fetch or JSON parsing fails", async () => {
    const failingFetcher = vi.fn().mockRejectedValue(new Error("network down"));

    await expect(
      searchFoodImages("鸡蛋", failingFetcher as typeof fetch),
    ).resolves.toEqual([]);
  });

  it("filters out invalid Commons entries", async () => {
    const fetcher = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        query: {
          pages: {
            "1": {
              fullurl: "https://commons.wikimedia.org/wiki/File:Valid.png",
              imageinfo: [
                {
                  thumburl: "https://upload.wikimedia.org/thumb/valid.png",
                  url: "https://upload.wikimedia.org/valid.png",
                  extmetadata: {
                    Artist: { value: "Valid Artist" },
                    LicenseShortName: { value: "CC0" },
                  },
                },
              ],
            },
            "2": {
              fullurl: "https://commons.wikimedia.org/wiki/File:MissingThumb.png",
              imageinfo: [
                {
                  url: "https://upload.wikimedia.org/missing-thumb.png",
                },
              ],
            },
            "3": {
              fullurl: "https://commons.wikimedia.org/wiki/File:MissingUrl.png",
              imageinfo: [
                {
                  thumburl: "https://upload.wikimedia.org/thumb/missing-url.png",
                },
              ],
            },
            "4": {
              imageinfo: [
                {
                  thumburl: "https://upload.wikimedia.org/thumb/missing-fullurl.png",
                  url: "https://upload.wikimedia.org/missing-fullurl.png",
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
        thumbnailUrl: "https://upload.wikimedia.org/thumb/valid.png",
        fullUrl: "https://upload.wikimedia.org/valid.png",
        sourceName: "wikimedia-commons",
        sourcePageUrl: "https://commons.wikimedia.org/wiki/File:Valid.png",
        authorName: "Valid Artist",
        license: "CC0",
        searchQuery: "鸡蛋 插画 卡通 食物",
      },
    ]);
  });

  it("returns an empty list for a blank keyword without issuing a request", async () => {
    const fetcher = vi.fn();

    await expect(searchFoodImages("   ", fetcher as typeof fetch)).resolves.toEqual(
      [],
    );
    expect(fetcher).not.toHaveBeenCalled();
  });
});
