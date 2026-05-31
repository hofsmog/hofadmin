import type { FormCornerRadius, FormFontStyle, FormLayout } from "@/types/database";

export type PublicFormDesign = {
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  buttonColor: string;
  buttonTextColor: string;
  fontStyle: FormFontStyle;
  formLayout: FormLayout;
  cornerRadius: FormCornerRadius;
  logoUrl: string | null;
  coverImageUrl: string | null;
  customThankYouMessage: string | null;
};

export function getRadiusClass(radius: FormCornerRadius) {
  return {
    none: "rounded-none",
    small: "rounded-md",
    medium: "rounded-xl",
    large: "rounded-3xl",
  }[radius];
}

export function getFontClass(fontStyle: FormFontStyle) {
  return {
    default: "font-sans",
    modern: "font-sans tracking-tight",
    classic: "font-serif",
    playful: "font-sans",
  }[fontStyle];
}
