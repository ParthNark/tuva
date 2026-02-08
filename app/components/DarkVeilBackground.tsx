"use client";

import { DarkVeil } from "./DarkVeil";
import { useTheme } from "@/app/hooks/useTheme";

const THEME_VEIL = {
  tokyo: {
    hueShift: 0,
    noiseIntensity: 0.06,
    scanlineIntensity: 0.05,
    scanlineFrequency: 1.4,
    warpAmount: 0.12,
  },
  dracula: {
    hueShift: 18,
    noiseIntensity: 0.08,
    scanlineIntensity: 0.06,
    scanlineFrequency: 1.6,
    warpAmount: 0.14,
  },
  nord: {
    hueShift: -12,
    noiseIntensity: 0.05,
    scanlineIntensity: 0.04,
    scanlineFrequency: 1.2,
    warpAmount: 0.1,
  },
  light: {
    hueShift: -38,
    noiseIntensity: 0.015,
    scanlineIntensity: 0.02,
    scanlineFrequency: 0.9,
    warpAmount: 0.04,
  },
  "tuva-light": {
    hueShift: 0,
    noiseIntensity: 0,
    scanlineIntensity: 0,
    scanlineFrequency: 0,
    warpAmount: 0,
  },
} as const;

export function DarkVeilBackground() {
  const { theme } = useTheme();
  const settings = THEME_VEIL[theme] ?? THEME_VEIL.tokyo;
  const backgroundColor =
    theme === "light" ? "#fdf6e3" : theme === "tuva-light" ? "#ffffff" : undefined;
  const canvasClassName =
    theme === "light"
      ? "darkveil-canvas darkveil-canvas--light"
      : theme === "tuva-light"
        ? "darkveil-canvas darkveil-canvas--white"
        : "darkveil-canvas";

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <DarkVeil
        className={canvasClassName}
        speed={0.5}
        resolutionScale={1}
        hueShift={settings.hueShift}
        noiseIntensity={settings.noiseIntensity}
        scanlineIntensity={settings.scanlineIntensity}
        scanlineFrequency={settings.scanlineFrequency}
        warpAmount={settings.warpAmount}
        backgroundColor={backgroundColor}
      />
    </div>
  );
}
