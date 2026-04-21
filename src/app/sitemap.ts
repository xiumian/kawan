import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://chenfenpro.com",
      lastModified: new Date(),
    },
    {
      url: "https://chenfenpro.com/orders/lookup",
      lastModified: new Date(),
    },
    {
      url: "https://chenfenpro.com/support",
      lastModified: new Date(),
    },
  ];
}
