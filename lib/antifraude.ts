export function generateFingerprint(): string {
  if (typeof window === "undefined") return "SERVER";

  const components: string[] = [];

  // User Agent
  components.push(navigator.userAgent || "no-ua");

  // Screen resolution
  components.push(`${screen.width}x${screen.height}`);

  // Color depth
  components.push(`${screen.colorDepth}`);

  // Language
  components.push(navigator.language || "no-lang");

  // Hardware concurrency
  components.push(`${navigator.hardwareConcurrency || 0}`);

  // Platform
  components.push(navigator.platform || "no-platform");

  // Timezone
  components.push(Intl.DateTimeFormat().resolvedOptions().timeZone || "no-tz");

  // Canvas fingerprint
  try {
    const canvas = document.createElement("canvas");
    canvas.width = 200;
    canvas.height = 50;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.textBaseline = "top";
      ctx.font = "14px Arial";
      ctx.fillStyle = "#002147";
      ctx.fillText("UNAM-Asistencia-FP", 2, 2);
      ctx.fillStyle = "#C4972F";
      ctx.fillRect(50, 10, 80, 20);
      ctx.beginPath();
      ctx.arc(100, 25, 15, 0, Math.PI * 2);
      ctx.fillStyle = "#FBF7EF";
      ctx.fill();
      components.push(canvas.toDataURL());
    }
  } catch {
    components.push("no-canvas");
  }

  // Generate hash from all components
  const combined = components.join("|||");
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }

  // Make it positive and convert to base36
  const positiveHash = Math.abs(hash);
  return "FP-" + positiveHash.toString(36).toUpperCase();
}
