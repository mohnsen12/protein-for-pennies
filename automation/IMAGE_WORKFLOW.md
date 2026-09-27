# Image Generation Workflow — Google Antigravity

This project uses **Google Antigravity** (included in your Google Pro subscription) to generate the recipe photos.

## Master System Prompt (Female Chef POV + Remix Rule)

Every image must use a reference food photo (`ImagePaths`) and the following exact anatomical POV structure so it ALWAYS looks like the female chef is holding the camera herself:

> "First-person point of view (POV) looking straight down at a dark scratched oak wooden table. The bottom foreground prominently shows the chest and shoulders of a full-figured dark-skinned female food blogger wearing [VARY SWEATER/CARDIGAN], NO HEAD. Both of her sleeved upper arms are raised and angled UPWARDS toward the camera lens at the bottom left and right corners of the frame, making it physically clear that she is holding the camera up in front of her with both hands (her hands and the camera are cropped just out of frame). NEVER show her arms hanging down along her sides, and NEVER show hands or arms on the table. Resting on crumpled baking paper is [INSERT DISH]. IMPORTANT INSTRUCTION: Use the reference image ONLY to understand the culinary nature of the food. DO NOT copy the tablecloth, plates, or background elements from the reference image. Assume this dish was cooked in a different kitchen. Invent a completely new, unique styling setup. EXTREMELY PHOTOREALISTIC, shot on 35mm film, grainy, raw, unpolished, high-end editorial culinary photography, natural harsh window shadows. AVOID glossy, plastic, or overly perfect AI aesthetics."

## Rules
- **Aspect Ratio**: Landscape `4:3` (`1024×768` or higher)
- **Target Filenames**:
  - `recipe-site/public/images/recipes/<slug>-hero.jpg`
  - `recipe-site/public/images/recipes/<slug>-detail.jpg`
- **Verify Coverage**: Run `npm run image:report` in `recipe-site/`.
- **Refresh Pins**: Run `npm run generate:pins` after adding images.
