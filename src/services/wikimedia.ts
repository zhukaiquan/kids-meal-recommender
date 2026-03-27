import type { FoodImage } from "../domain/types";

type Fetcher = typeof fetch;

function buildQuery(keyword: string) {
  return `${keyword.trim()} 插画 卡通 食物`;
}

export async function searchFoodImages(
  keyword: string,
  fetcher: Fetcher = fetch,
): Promise<FoodImage[]> {
  const searchQuery = buildQuery(keyword);
  const endpoint = new URL("https://commons.wikimedia.org/w/api.php");

  endpoint.searchParams.set("action", "query");
  endpoint.searchParams.set("format", "json");
  endpoint.searchParams.set("origin", "*");
  endpoint.searchParams.set("generator", "search");
  endpoint.searchParams.set("gsrnamespace", "6");
  endpoint.searchParams.set("gsrsearch", searchQuery);
  endpoint.searchParams.set("gsrlimit", "6");
  endpoint.searchParams.set("prop", "imageinfo|info");
  endpoint.searchParams.set("inprop", "url");
  endpoint.searchParams.set("iiprop", "url|extmetadata");
  endpoint.searchParams.set("iiurlwidth", "320");

  const response = await fetcher(endpoint.toString());
  if (!response.ok) {
    return [];
  }

  const payload = (await response.json()) as {
    query?: {
      pages?: Record<
        string,
        {
          fullurl?: string;
          imageinfo?: Array<{
            thumburl?: string;
            url?: string;
            extmetadata?: {
              Artist?: { value?: string };
              LicenseShortName?: { value?: string };
            };
          }>;
        }
      >;
    };
  };

  return Object.values(payload.query?.pages ?? {})
    .map((page) => {
      const info = page.imageinfo?.[0];
      if (!info?.thumburl || !info.url || !page.fullurl) {
        return null;
      }

      return {
        thumbnailUrl: info.thumburl,
        fullUrl: info.url,
        sourceName: "wikimedia-commons" as const,
        sourcePageUrl: page.fullurl,
        authorName: info.extmetadata?.Artist?.value ?? null,
        license: info.extmetadata?.LicenseShortName?.value ?? null,
        searchQuery,
      };
    })
    .filter((item): item is FoodImage => item !== null);
}
