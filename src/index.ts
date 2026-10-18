import type { CDSLogoConfig, GradientConfig } from "./types";

if (!("content" in document.createElement("template"))) {
  throw new Error("Template element not supported.");
}

function $<T extends HTMLElement>(id: string) {
  const element = document.getElementById(id);
  if (!element) throw new Error(`Element with id '${id}' not found`);
  return element as T;
}

function hexToRgb(h: string): [string, string, string] {
  return [1, 3, 5].map((i) => (parseInt(h.slice(i, i + 2), 16) / 255).toFixed(3)) as [
    string,
    string,
    string,
  ];
}

const trianglePts = "20,10 50,90 80,10";
const streetPts = "2,5 40,5 75,34 75,36 42,49 65,61 65,63 20,45 20,55 55,35 20,15";
const sidesPts = ["5,10 28.25,40 17,10", "83,10 71.75,40 95,10", "53,90 66.125,55 79,70"];
const presets: Record<string, CDSLogoConfig> = {
  p1: {
    canvas: { active: false, color: "#ffffff" },
    triangle: {
      from: "#0e6b1b",
      to: "#45a62d",
      frequency: 10,
      octaves: 4,
      seed: 1,
      type: "turbulence",
      bands: [false, false, true, true, true, true, true, true, true, true, true, false, false],
      color: "#003300",
      strength: 1,
      sides: true,
    },
    street: {
      from: "#d4a700",
      to: "#fcd34d",
      frequency: 0.8,
      sides: true,
      octaves: 1,
      seed: 2,
      type: "turbulence",
      bands: [
        true,
        false,
        false,
        false,
        false,
        false,
        false,
        false,
        false,
        false,
        false,
        false,
        false,
      ],
      color: "#996600",
      strength: 1,
    },
    shadow: { active: true, color: "#000000", opacity: 1, dx: 0, dy: 2, mode: "street" },
    edge: { active: true, color: "#000000", opacity: 1, width: 4 },
    outline: {
      triangleColor: "#ffffff",
      triangleWidth: 0,
      streetColor: "#000000",
      streetWidth: 0,
      joinStyle: "round",
    },
  },
};
presets.p2 = structuredClone(presets.p1) as CDSLogoConfig;
presets.p2.triangle.frequency = 0.8;
presets.p2.triangle.octaves = 1;
presets.p2.shadow.color = "#330101";
presets.p2.shadow.opacity = 0.98;
presets.p2.edge.color = "#330101";
presets.p2.edge.opacity = 0.98;
presets.p2.street.bands = [
  true,
  false,
  false,
  false,
  false,
  false,
  false,
  false,
  false,
  false,
  false,
  false,
  false,
];

const triangleTab = $("triangle-tab");
const streetTab = $("street-tab");
const shadowTab = $("shadow-tab");
const outlineTab = $("outline-tab");
const canvasTab = $("canvas-tab");
const triangleSection = $("triangle-section");
const streetSection = $("street-section");
const shadowSection = $("shadow-section");
const outlineSection = $("outline-section");
const canvasSection = $("canvas-section");
const tabButtons = [triangleTab, streetTab, shadowTab, outlineTab, canvasTab];
const tabSections = [triangleSection, streetSection, shadowSection, outlineSection, canvasSection];

for (const button of tabButtons) {
  button.addEventListener("click", () => {
    selectTab(button.id.replace("-tab", ""));
  });
}

const current = structuredClone(presets.p1);
const get = (key: string) => key.split(".").reduce((o, k) => o[k], current as any);
const set = (key: string, value: string | number | boolean) => {
  const k = key.split(".");
  const l = k.pop();
  if (!l) throw new Error("Invalid key");
  k.reduce((o, x) => o[x], current as any)[l] = value;
  draw();
};
const fmt = (v: number | string | boolean): string =>
  typeof v === "number" ? v.toPrecision(3) : typeof v === "boolean" ? v.toString() : v;

/* ---------- SVG builder (same structure as the original files) ---------- */
function svg(x: boolean) {
  const g = current.triangle;
  const y = current.street;
  const sh = current.shadow;
  const e = current.edge;
  const o = current.outline;
  const d = (t: string) => (x ? "" : ` data-tab="${t}"`);
  const noise = (id: string, p: GradientConfig, extra?: string) => {
    const [r, gg, b] = hexToRgb(p.color);
    // frequency = pattern size, bands = which noise levels show, color matrix = speckle color + strength
    return `<filter id="${id}">
    <feTurbulence type="${p.type}" baseFrequency="${p.frequency}" numOctaves="${p.octaves}" seed="${p.seed}"/><feComponentTransfer><feFuncA type="discrete" tableValues="${p.bands.map((b) => (b ? "1" : "0")).join(" ")}"/></feComponentTransfer>
    <feColorMatrix values="0 0 0 0 ${r} 0 0 0 0 ${gg} 0 0 0 0 ${b} 0 0 0 ${p.strength} 0"/>
    <feComposite in2="SourceGraphic" operator="atop" result="bricks"/>${extra || ""}
    </filter>`;
  };
  let shadow = "";
  if (sh.active) {
    const inside = sh.mode === "street";
    shadow =
      `<feFlood flood-color="${sh.color}" flood-opacity="${sh.opacity}"/>
      <feComposite in2="SourceGraphic" operator="in"/><feOffset dx="${sh.dx}" dy="${sh.dy}"/><feComposite in2="SourceGraphic" operator="out"${inside ? "" : ' result="sh"'}/>` +
      (inside
        ? `<feOffset dx="${-sh.dx}" dy="${-sh.dy}"/><feComposite in2="SourceGraphic" operator="in" result="sh"/>`
        : "") +
      `<feMerge><feMergeNode in="bricks"/><feMergeNode in="sh"/></feMerge>`;
  }
  const polygon = (pts: string, c: string, w: number, clip?: boolean) =>
    +w
      ? `<polygon points="${pts}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linejoin="${o.joinStyle}"${clip ? ' clip-path="url(#tc)"' : ""} pointer-events="none"/>`
      : "";

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" ${x ? 'width="1000" height="1000"' : 'width="100%" height="100%"'}>
<defs>
<!-- Gradients run bottom to top -->
<linearGradient id="green" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${g.from}"/><stop offset="1" stop-color="${g.to}"/></linearGradient>
<linearGradient id="yellow" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${y.from}"/><stop offset="1" stop-color="${y.to}"/></linearGradient>
<!-- Noise patterns -->
${noise("gp", g)}
${noise("yp", y, shadow)}
<clipPath id="tc"><polygon points="${trianglePts}"/></clipPath>
<mask id="sl"><line x1="20" y1="10" x2="50" y2="90" stroke="white" stroke-width="${e.width}"/></mask>
</defs>
${current.canvas.active ? `<rect width="100" height="100" fill="${current.canvas.color}"/>` : ""}
<g transform="translate(0,100) scale(1,-1)">
<polygon${d("triangle")} points="${trianglePts}" fill="url(#green)" filter="url(#gp)"/>
<polygon${d("street")} points="${streetPts}" fill="url(#yellow)" filter="url(#yp)" clip-path="url(#tc)"/>
${e.active ? `<polygon${d("shadow")} points="${streetPts}" fill="${e.color}" fill-opacity="${e.opacity}" clip-path="url(#tc)" mask="url(#sl)"/>` : ""}
${g.sides ? sidesPts.map((p) => `<polygon${d("outline")} points="${p}" fill="url(#green)" filter="url(#gp)"/>`).join("\n") : ""}
${polygon(streetPts, o.streetColor, o.streetWidth, true)}
${polygon(trianglePts, o.triangleColor, o.triangleWidth)}
${g.sides ? sidesPts.map((p) => polygon(p, o.triangleColor, o.triangleWidth)).join("") : ""}
</g>
</svg>`;
}
function draw() {
  $("frame").innerHTML = svg(false);
  $<HTMLTextAreaElement>("code").value = svg(true);
  $<HTMLTextAreaElement>("cfg").value = cfg();
}
function selectTab(tab: string) {
  tabSections.forEach((section) =>
    section.setAttribute("aria-selected", section.id.startsWith(tab) ? "true" : "false"),
  );
  tabButtons.forEach((button) =>
    button.setAttribute("aria-selected", button.id.startsWith(tab) ? "true" : "false"),
  );
}
function updateUI() {
  for (const [key, value] of Object.entries(current)) {
    if (typeof value !== "object" && value === null) continue;

    for (const [subKey, subValue] of Object.entries(value)) {
      const inputs = document.querySelectorAll<HTMLInputElement>(`[data-p="${key}.${subKey}"]`);
      for (const input of inputs) {
        // console.log(`Updating UI for ${key}.${subKey} with value:`, subValue);
        if (input) {
          if (input.type === "checkbox") {
            input.checked = Boolean(subValue);
          } else if (input.type === "range" || input.type === "number" || input.type === "color") {
            if (input.dataset.log)
              console.log(
                `Updating range input for ${key}.${subKey} with value:`,
                subValue,
                `log10: ${Math.log10(Number(subValue)).toFixed(3)}`,
              );
            input.value = input.dataset.log
              ? Math.log10(Number(subValue)).toFixed(3)
              : String(subValue);
            const output = input.nextElementSibling as HTMLOutputElement;
            if (output && output.tagName === "OUTPUT" && !Array.isArray(subValue)) {
              output.textContent = fmt(subValue);
            }
          } else if (input.dataset.v !== undefined) {
            input.setAttribute("aria-pressed", `${subValue === input.dataset.v}`);
          } else if (input.dataset.i !== undefined && Array.isArray(subValue)) {
            const i = Number(input.dataset.i);
            input.setAttribute("aria-pressed", `${subValue[i]}`);
          }
        }
      }
    }
  }
}

/* ---------- randomness ---------- */
const rnd = (a: number, b: number) => a + Math.random() * (b - a);
const hex = (h: number, sa: number, l: number) => {
  h = ((h % 360) + 360) % 360;
  sa /= 100;
  l /= 100;
  const a = sa * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    return Math.round(255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))));
  };
  return "#" + [f(0), f(8), f(4)].map((v) => v.toString(16).padStart(2, "0")).join("");
};
function shuffleGradient(gradient: GradientConfig): void {
  gradient.seed = Math.floor(rnd(0, 100));
  gradient.frequency = +(10 ** rnd(-0.5, 1.1)).toFixed(5);
  console.log(
    `Shuffling gradient: seed=${gradient.seed}, frequency=${gradient.frequency} => ${Math.log10(gradient.frequency).toFixed(3)}`,
  );
  gradient.octaves = 1 + Math.floor(rnd(0, 4));
  gradient.bands = gradient.bands.map(() => Math.random() < 0.35) as typeof gradient.bands;
  if (!gradient.bands.includes(true)) gradient.bands[6] = true;
  gradient.type = Math.random() < 0.5 ? "turbulence" : "fractalNoise";
  draw();
  updateUI();
}
function shuffleAll() {
  shuffleGradient(current.triangle);
  shuffleGradient(current.street);
  const h = rnd(0, 360),
    h2 = h + rnd(70, 200);
  Object.assign(current.triangle, {
    from: hex(h, 70, 22),
    to: hex(h + 12, 60, 42),
    color: hex(h, 80, 10),
  });
  Object.assign(current.street, {
    from: hex(h2, 75, 38),
    to: hex(h2 + 14, 85, 66),
    color: hex(h2, 70, 22),
  });
  current.shadow.color = current.edge.color = hex(h2, 80, 8);
  draw();
  updateUI();
}
function cfg() {
  return JSON.stringify({ app: "cds-logo-editor", version: 1, configuration: current }, null, 2);
}

/* ---------- events ---------- */
document.addEventListener("DOMContentLoaded", () => {
  $("panel").addEventListener("input", (e: Event) => {
    const t = e.target as HTMLInputElement;
    const p = t.dataset.p;
    if (!p) return;
    let v = t.type === "checkbox" ? t.checked : t.type === "range" ? +t.value : t.value;
    if (t.dataset.log && typeof v === "number") v = +(10 ** v).toFixed(3);
    set(p, v);
    if (t.type === "checkbox" && p === "bg.t") return;
    const o = t.nextElementSibling as HTMLOutputElement;
    if (o && o.tagName === "OUTPUT") o.textContent = fmt(v);
  });
  document.querySelectorAll<HTMLElement>("[data-s]").forEach((el) => {
    el.addEventListener("click", (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target) return;
      const shuffle = target.dataset.s;
      if (shuffle === "triangle") shuffleGradient(current.triangle);
      else if (shuffle === "street") shuffleGradient(current.street);
      else if (shuffle === "all") shuffleAll();
    });
  });
  document.querySelectorAll<HTMLElement>("[data-p][data-i]").forEach((el) => {
    el.addEventListener("click", (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (!t) return;
      const key = t.dataset.p;
      const index = t.dataset.i;
      if (!key || index === undefined) return;
      const arr = get(key) as any[];
      if (!Array.isArray(arr)) return;
      const i = +index;
      if (i < 0 || i >= arr.length) return;
      arr[i] = !arr[i];
      t.setAttribute("aria-pressed", arr[i] ? "true" : "false");
      draw();
    });
  });
  document.querySelectorAll<HTMLElement>("[data-p][data-v]").forEach((el) => {
    el.addEventListener("click", (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (!t) return;
      const key = t.dataset.p;
      const value = t.dataset.v;
      if (!key || value === undefined) return;
      t.setAttribute("aria-pressed", "true");
      document.querySelectorAll<HTMLElement>(`[data-p="${key}"]`).forEach((sibling) => {
        if (sibling !== t) sibling.setAttribute("aria-pressed", "false");
      });
      set(key, value);
    });
  });
  document.querySelectorAll<HTMLElement>("[data-preset]").forEach((el) => {
    el.addEventListener("click", (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (!t) return;
      const key = t.dataset.preset;
      console.log(`Preset button clicked: ${key}=`, presets[key]);
      if (!key || !(key in presets)) return;
      Object.assign(current, structuredClone(presets[key]));
      updateUI();
      draw();
      console.log(`Applied preset: ${key}=`, current);
    });
  });
  $("frame").addEventListener("click", (e: MouseEvent) => {
    const t = (e.target as HTMLElement).closest("[data-tab]") as HTMLElement;
    if (t) selectTab(t.dataset.tab!);
  });
  $("copy").addEventListener("click", async () => {
    const b = $("copy");
    const t = svg(true);
    try {
      await navigator.clipboard.writeText(t);
      const oldText = b.textContent;
      b.textContent = "✓";
      setTimeout(() => (b.textContent = oldText), 1400);
    } catch (e) {
      console.error("Failed to copy SVG to clipboard", e);
    }
  });
  /* ---------- export and import ---------- */
  async function saveFile(name: string, data: Blob | string) {
    const link = document.createElement("a");
    const content = typeof data === "string" ? new Blob([data], { type: "text/plain" }) : data;
    link.href = URL.createObjectURL(content);
    link.download = name;
    link.click();
    URL.revokeObjectURL(link.href);
  }
  function toPng() {
    const n = +$<HTMLInputElement>("size").value;
    const img = new Image();
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = c.height = n;
      c.getContext("2d")?.drawImage(img, 0, 0, n, n);
      c.toBlob(
        (b) => (b ? saveFile("cds-logo.png", b) : console.error("Couldn’t render the PNG")),
        "image/png",
      );
    };
    img.onerror = () => console.error("Couldn’t render the PNG");
    img.src =
      "data:image/svg+xml;charset=utf-8," +
      encodeURIComponent(
        svg(true).replace('width="1000" height="1000"', 'width="' + n + '" height="' + n + '"'),
      );
  }

  function merge(b: Record<any, any>, x: Record<any, any>) {
    for (const k in b) {
      if (!(k in x)) continue;
      const v = b[k];
      const w = x[k];
      if (typeof v === "object") {
        merge(v, w);
      } else {
        b[k] = w;
      }
    }
    return b;
  }
  function applyCfg(t: string) {
    try {
      const j = JSON.parse(t);
      if (!j.configuration) return;
      merge(current, structuredClone(j.configuration));
      draw();
      updateUI();
    } catch (e) {
      console.error("Couldn’t read those configuration", e);
    }
  }
  $("png").onclick = toPng;
  $("svgdl").onclick = () => saveFile("cds-logo.svg", svg(true));
  $("cfgout").onclick = () => saveFile("cds-logo-configuration.json", cfg());
  $("cfgin").onclick = () => $("file").click();
  $("file").onchange = async (e: Event) => {
    const el = e?.target as HTMLInputElement;
    if (!el || !el.files || el.files.length === 0) return;
    const f = el.files?.item(0);
    el.value = "";
    if (f) applyCfg(await f.text());
  };
  $("cfgapply").onclick = () => applyCfg($<HTMLTextAreaElement>("cfg").value);

  draw();
  selectTab("street");
});
