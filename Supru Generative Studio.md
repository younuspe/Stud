# Supru Ecosystem: The Visual Identity & UI

**Module Status:** Global Interface Specification

**Vision:** A "Sovereign Dark" aesthetic characterized by ambient backlighting, neon accents, and a minimalist, high-efficiency layout that eliminates visual clutter.

## 1. The Aesthetic: "Sovereign Dark"

The interface is not just a "theme"; it is a visual manifestation of power and precision.

- **The Backlight (Ambient Glow):** The UI uses "Dynamic Bloom." Instead of flat colors, components have a soft, neon backlight that changes color based on the active module (e.g., Blue for Code, Red for Akhada).
- **Glass-morphism:** All panels are semi-transparent "Sovereign Glass," creating a sense of depth and layering.
- **Iconography:** High-contrast, minimalist neon icons that act as "Glyphs" for the different modules.
- **The "Glide" Motion:** All transitions between panels are handled by the Bevy engine as fluid, non-linear glides, avoiding "pop-in" or "loading" screens.

## 2. The "Sovereign" Left Panel (Solving the Mess)

To fix the "messy" layout, we are replacing the cluttered list with a Tiers of Authority structure. The left panel is reorganized into four distinct, clean zones:

### Tier 1: The Identity (Top)

- **The Profile:** A minimalist, glowing avatar and the "Sovereign Status" (Online/Offline/Sovereign).
- **The Realm:** A simple indicator of the current active Workspace (e.g., Workspace: Chat).

### Tier 2: The Glide-Nav (The Core)

- **The Glyph-Bar:** Instead of a list of text, we use a vertical row of Sovereign Glyphs (Icons).
- **Interaction:** Hovering over a Glyph reveals the name of the module. Clicking it "glides" the main view to that component.
- **Included Glyphs:** Chat, Studio, Code, CLI, Hunter, Warrior, Akhada, Galaxy.

### Tier 3: The Engine Room (Bottom-Middle)

- **The Pulse:** A single, elegant status bar showing the AI Engine Status (e.g., Llama-3-405B: Ready).
- **The Resource Monitor:** A tiny, glowing line showing GPU/RAM usage, ensuring the "Glider" feel is maintained.

### Tier 4: The System Base (Bottom)

- **The Utility Hub:** Minimalist, low-opacity icons for Preferences, Help, and User Profile. No text—only glyphs.

## 3. The Main Stage (The Center View)

The center area is designed for Maximum Focus.

- **The Hero Section:** A bold, centered greeting and a "Sovereign Command" area.
- **The Omni-Input:** A single, centered, glowing input field that handles all intents (Text, Voice, and la-macro commands).
- **The Action Cards:** Instead of a messy list of buttons, the system presents "Sovereign Cards"—visually stunning, high-contrast tiles for the most frequent actions (e.g., "Synthesize 3D Galaxy" or "Audit Architecture").
- **The HUD Overlay:** When a module is launched, the main stage transforms into that module's specific layout, but the "Sovereign Dark" backlight remains consistent.

## 4. Technical Implementation (The Prism Stack)

- **Rendering Engine:** Bevy + WGPU (Using custom shaders to achieve the "Backlight" glow and glass-morphism).
- **UI Framework:** Tauri (Hosting the shell) → Rust (Managing the state of the left panel).
- **Motion:** Curve-based animations (To ensure the "glide" feels organic and not mechanical).
- **Performance:** All UI elements are rendered as entities in the ECS, ensuring 120fps+ regardless of the complexity of the "Sovereign" visual effects.
