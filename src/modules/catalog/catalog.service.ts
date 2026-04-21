export type StorefrontProduct = {
  slug: string;
};

export function buildStorefrontProducts<T extends StorefrontProduct>(products: T[]) {
  return [...products];
}
