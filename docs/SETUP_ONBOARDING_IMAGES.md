# Onboarding Image Generation Guide

The onboarding screens for passenger + driver reference 6 placeholder PNGs (currently the YB logo duplicated). Replace them with **AI-generated hero illustrations** to ship the finished onboarding.

## Where the files live

```
apps/passenger-new/assets/onboarding/
  01-movement.png
  02-tracking.png
  03-paystack.png

apps/driver/assets/onboarding/
  01-online.png
  02-trips.png
  03-earnings.png
```

The code references these paths via `require()`. Drop replacements with the **exact same filenames** and rebuild — no code change needed.

## Image specs (apply to all 6)

| Property | Value |
|---|---|
| Format | PNG with transparency |
| Canvas | **1024 × 1024** square |
| Subject placement | Centred, with ~10% breathing room on every edge |
| Background | **Transparent** — the onboarding screen renders the yellow gradient backdrop itself |
| Style | Consistent across all 6: same illustration style, line weight, palette |
| Palette | Brand yellow `#FACC15` accents allowed; primarily dark line work `#0A0A0A` on transparent; soft greys for shading |
| Vibe | Premium / editorial / Apple-product-page caliber — NOT clip-art, NOT stock-icon style |
| File size | ≤ 400 KB each (export at 8-bit PNG, dither off) |

Keep ALL 6 in the same illustration style so the onboarding feels coherent — passenger and driver should look like they came from the same studio.

## Recommended generation tools

- **Midjourney v6+** — best quality for the editorial illustration style we want.
- **DALL·E 3 / GPT-4o image** — easiest to iterate with via ChatGPT or Sora.
- **Adobe Firefly** — commercially safe license, fine for brand use.
- **Leonardo.ai** — good free tier with consistent style locking.

Whichever tool you pick: **generate slide 1 first, iterate until perfect**, then use that image as a style reference for the other 5 so they all match.

## Prompts

### Passenger 01 — Movement / fast taxi
> Editorial flat illustration of a stylish yellow sedan in motion against a transparent background, viewed from a 3/4 front angle, with dynamic motion lines in pale yellow. Premium minimalist style, thick clean line work in #0A0A0A on transparent background, soft grey shading, brand yellow #FACC15 accents on the car body and motion trail. 1024×1024 PNG. No text, no logo, no UI elements.

### Passenger 02 — Live driver tracking
> Editorial flat illustration of a smartphone viewed from above, showing a stylised map with a yellow car icon mid-route and a green pickup pin and pink destination pin. Premium minimalist style, thick clean line work in #0A0A0A on transparent background, brand yellow #FACC15 for the car and route polyline, green #10B981 for pickup, magenta #E91E63 for destination. The phone should feel like a confident product render, not a flat 2D mock. 1024×1024 PNG. No text on the phone screen.

### Passenger 03 — Cashless payment via Paystack
> Editorial flat illustration of a hand holding up a credit card next to a stylised payment success checkmark on a glowing yellow disc. Premium minimalist style, thick clean line work in #0A0A0A on transparent background, brand yellow #FACC15 for the success glow, soft grey shading on the hand and card. Feels secure and confident — Apple Pay marketing aesthetic. 1024×1024 PNG. No text or logos visible.

### Driver 01 — Online toggle / accepting trips
> Editorial flat illustration of a smartphone with a big rounded toggle switch showing "ONLINE" state, glowing yellow halo around the toggle to convey activation. Premium minimalist style, thick clean line work in #0A0A0A on transparent background, brand yellow #FACC15 for the active toggle and halo, soft grey shading on the phone. Same illustration language as the passenger set. 1024×1024 PNG. No text other than the abstract "ONLINE" word on the toggle.

### Driver 02 — Trip request inbound
> Editorial flat illustration of a stylised yellow sedan from a 3/4 rear angle, with a notification bell icon hovering above it in a soft yellow burst. Premium minimalist style, thick clean line work in #0A0A0A on transparent background, brand yellow #FACC15 for the car and the notification burst, soft grey shading. Coherent with the passenger 01 sedan style. 1024×1024 PNG. No text.

### Driver 03 — Earnings dashboard
> Editorial flat illustration of a stack of Nigerian naira notes overlapping a stylised line chart trending upward, all on a glowing yellow circular disc. Premium minimalist style, thick clean line work in #0A0A0A on transparent background, brand yellow #FACC15 for the disc and the chart trend, soft greys for the notes. Feels like a premium fintech earnings illustration. 1024×1024 PNG. No text or specific currency amounts visible.

## After dropping the new files

```
# Rebuild both apps so the new image assets are bundled
cd apps/passenger-new
eas build --platform android --profile development
eas build --platform ios --profile development

cd ../driver
eas build --platform android --profile development
eas build --platform ios --profile development
```

Or, for quicker preview during development, the dev client picks up new image assets on **shake → Reload** (no build needed for asset swaps — Metro re-bundles).

## QA checklist for the generated images

- [ ] All 6 use the SAME illustration style (line weight, palette, shading approach).
- [ ] Passenger trio reads as a coherent flow (book → track → pay).
- [ ] Driver trio reads as a coherent flow (go online → get trips → see earnings).
- [ ] No text or logo embedded in the images (we add our own typography via the screen).
- [ ] Transparent background — yellow shows through from the screen's backdrop, no white-box halo.
- [ ] On a real device, the image sits cleanly inside the rounded hero card without visual artefacts.
- [ ] Light + dark mode: dark line work on the transparent PNG must still read against the yellow backdrop in both themes (we currently only ship light, but future-proof).
