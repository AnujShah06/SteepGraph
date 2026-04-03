import type { TeaType } from "./types";

/**
 * Returns the CSS color for a tea type.
 * Maps to CSS variable values from globals.css.
 */
export function getTypeColor(type: TeaType): string {
  const map: Record<TeaType, string> = {
    black: "#c8a96e",    // gold — amber
    green: "#4a8c7a",    // teal
    herbal: "#6b8e5a",   // green
    rooibos: "#6b8e5a",  // green
    oolong: "#8b6ea8",   // purple
    "pu-erh": "#8b6ea8", // purple
    white: "#a0997a",    // olive
    blend: "#a0997a",    // olive
  };
  return map[type] || "#6b6860";
}

/**
 * Creates a URL-safe slug from brand + tea name.
 */
export function makeTeaId(brand: string, name: string): string {
  const slug = (s: string) =>
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  return `${slug(brand)}_${slug(name)}`;
}

/**
 * Capitalize first letter of a string.
 */
export function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
