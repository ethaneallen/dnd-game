# 📋 CHANGELOG - Realms of Adventure

All notable changes to the D&D: Realms of Adventure web game.

---

## [3.0.0] - 2026-02-25 - "Underworld Economy" ⚔️

### 🎉 MAJOR RELEASE - Full Economy, Black Market & Combat Depth

This release transforms the game engine into a living economy with meaningful survival mechanics, high-risk black market trading, deep boss encounters, and campaign-specific loot systems.

### ✨ Added

#### **Full Economy & Lifestyle System**
- 5 Lifestyle tiers: Squalid, Poor, Modest, Comfortable, Wealthy — each with mechanical effects
- Starvation system with 6-level exhaustion scale and CON saves
- Foraging system with Help action (Advantage when exhausted — death spiral prevention)
- Armor Degradation on critical hits and acid/fire damage
- Material Components with Component Pouch (15g)
- Combat Loot tables scaled by CR

#### **Shop & Barter Economy**
- Full shop with buy/sell interface, campaign-adjusted prices
- Barter-for-lodging system (trade items for rest when broke)
- Odd Jobs (once-per-visit, reputation-gated) with campaign payout scaling
- Bounty Board with CR-appropriate targets
- Trinket-for-essentials trade system for harsh-economy campaigns

#### **Black Market System** (NEW)
- Sell cursed/forbidden items to shady fences that normal shops refuse
- Illicit value multiplier: cursed items sell for 1.5× base value
- CHA-based haggle mechanic: ≥18 → price ×1.3; ≤5 → critical failure
- Critical failure triggers guard encounter (fight / flee DEX DC 14 / surrender)
- Bounty system tracks criminal notoriety; scales guard patrol chance in towns
- Thieves' Guild encounters in low-reputation towns (rep ≤ -2)
- Surrender option shows gold/cost before choosing; insufficient gold forces combat

#### **Artifact & Favor System**
- Legendary items marked PRICELESS (value = -1), cannot be sold for gold
- Artifact-for-Favor trading: each legendary has 2 curated favors with mechanical effects
- **Favor charge counters** (NEW): "Advantage on next 3 encounters" now uses `favor_advantage_encounters` that properly decrements per combat instead of a dead inventory string
- **NPC Ally charges** (NEW): `favor_ally_encounters` counter — ally deals 1d6 bonus damage per round, decrements per combat
- Favors grant real effects: exhaustion removal, stat boosts, 500-1000g, ally tokens, trap bypass

#### **Campaign-Specific Magic Items**
- `CAMPAIGN_MAGIC_ITEMS` with legendary/unique/common tiers per campaign
- Strahd: Sunsword, Holy Symbol of Ravenkind, Icon of Ravenloft
- ToA: Eye of Zaltec, Ring of Winter, Skull Chalice of Ch'gakare
- Borderlands: Blade of the Keep Commander, Chaos Shard
- Dark Terror: Yellow-Fang Fang-Dagger, Night Terror Cloak
- Standard: Flame Tongue Longsword, Staff of Defense
- 40% common-campaign, 30% unique, 5% legendary blend in loot rolls

#### **5 Campaign Settings**
- **Keep on the Borderlands** ★ Recommended Start — balanced economy
- **Standard** — default D&D experience
- **Curse of Strahd** — scarce resources, Gothic horror
- **Tomb of Annihilation** — brutal survival, highest price multiplier
- **Dark Terror** — savage frontier, barter economy
- Each setting has `price_mult`, `loot_mult`, `foraging_dc_mod`, `exhaustion_strict`, `special` fields

#### **Boss Encounter Depth**
- Legendary Resistance Cost Model
- Enhanced Phase Narration with phase transitions
- Objective Incentives (secondary objectives in boss fights)
- Last Stand mechanic (3 rounds of forced Advantage + bonus damage at 0 HP)
- Heroic Sacrifice system with Legacy bonuses for next character
- Fail-Forward: rescue events prevent unfair wipes
- Soft Enrage Timer for prolonged fights

#### **Combat Enhancements**
- Full action economy: Action, Bonus Action, Reaction, Movement
- Conditions system: Prone, Stunned, Poisoned, Blessed, etc.
- Battlefield events and telegraphing
- Shove / Help actions
- Natural 20 / Natural 1 narration
- Standing Up from Prone (half movement)
- Spellcasting with V/S components
- R/V/I damage types (Resistance / Vulnerability / Immunity)
- Passive Perception & Surprise checks
- Tactical Positioning: flanking, high ground, cover, difficult terrain
- Ready Action (set trigger + response)
- Social Combat: Persuade, Intimidate, Deceive in battle
- Environmental Synergy: terrain, lighting, weather
- Death Saving Throws with full 5e rules

#### **Survival & Exhaustion**
- 6-level exhaustion scale (level 6 = death)
- Strict exhaustion DC tied to campaign settings
- Exhaustion HUD display
- Tier-gated exhaustion removal (rest type required varies by level)
- Starvation → Exhaustion with CON save progression

### 🔧 Changed
- Borderlands moved to top of campaign list as ★ Recommended Start
- Default campaign changed from "standard" to "borderlands"
- Unique item barter values scaled up 3-5× (e.g., +2 Sword: 250 → 1000g)
- Treasure Hoard d100 table with campaign loot modifiers
- Armor Decay restricted to critical hit / acid / fire only
- Odd Jobs once-per-visit with reputation gating
- Component Pouch standardized to 15g
- `_get_barter_value()` unified lookup across all item sources
- `_is_artifact()` helper for priceless-item detection

### 🐛 Fixed
- Death spiral prevention: Help on Forage grants Advantage when exhausted
- Barter economy scaling for harsh campaigns (trinket-for-essentials fallback)
- Favor tokens now properly decrement instead of sitting as dead inventory strings
- Surrender path in guard encounter handles 0-gold edge case (forces combat)
- NPC Ally Token now deals actual combat damage instead of being cosmetic

---

## [2.0.0] - 2026-02-02 - "Professional Edition" 🎨

### 🎉 MAJOR RELEASE - Complete Professional Overhaul

This version transforms the game into a polished, professional product with comprehensive content and visual improvements.

### ✨ Added

#### **Landing Page & Onboarding**
- Professional landing page with animated logo and feature showcase
- Loading screen with rotating gameplay tips
- Call-to-action buttons with hover animations
- Feature grid highlighting key game elements
- Demo mode button for showcasing gameplay

#### **Visual Design**
- Completely redesigned UI with modern gradient aesthetics
- Separated CSS into dedicated `styles.css` file for maintainability
- Custom color palette with professional gold/purple/red theme
- Smooth animations and transitions throughout
- Particle effect background with subtle pulsing
- Glow effects on important elements
- Hover states with scale transformations

#### **Typography & Branding**
- Premium font stack: Cinzel, Crimson Text, MedievalSharp
- Improved text hierarchy and readability
- Better font sizing across all elements
- Professional text shadows and effects
- Consistent spacing system

#### **Enhanced UI Components**
- Redesigned character panel with better stat visualization
- Improved HP/XP bars with gradient fills and shine effects
- Better inventory list with hover effects
- Polished stat boxes with animation on hover
- Enhanced buttons with ripple effects
- Improved modal dialogs

#### **Documentation**
- Professional README.md with badges and complete feature list
- Detailed PRESS_KIT.md for marketing and media
- Comprehensive changelog (this file)

#### **User Experience**
- Smoother page transitions
- Better loading states
- Improved visual feedback throughout
- Enhanced accessibility with better contrast
- Responsive design improvements

### 🔧 Changed

#### **Code Organization**
- Extracted 800+ lines of CSS to external stylesheet
- Better code comments and structure
- Improved HTML meta tags for SEO
- Updated page titles and descriptions

#### **Visual Refinements**
- Updated color scheme for better visual appeal
- Improved spacing and padding throughout
- Better border radius consistency
- Enhanced shadow effects
- More polished animations

### 🎨 Design Details

#### **Color Palette**
- Primary Gold: #d4af37
- Dark Gold: #c9a227
- Deep Red: #8b0000
- Royal Purple: #4a148c
- Dark Background: #0a0a0f
- Text Primary: #f5f5f5
- Text Secondary: #b8b8b8

#### **Animation Features**
- Fade-in effects on page load
- Slide-up animations for cards
- Glow pulse on logo
- Button ripple effects
- Smooth hover transitions
- Loading spinner animation
- Background pulse effect

### 📦 File Structure Changes
```
Added:
  - styles.css (professional CSS stylesheet)
  - README.md (documentation)
  - PRESS_KIT.md (media kit)
  - CHANGELOG.md (this file)

Modified:
  - index.html (added landing page, loading screen, linked CSS)
  - game.js (added landing page functions, demo mode)
```

### 🎯 Content & Feature Updates
- Professional landing page that showcases features
- Demo mode for trying out gameplay
- Complete documentation
- SEO-optimized meta tags
- Social media ready descriptions

### 💡 Technical Improvements
- Better performance with CSS transitions
- Reduced inline styles
- Improved maintainability
- Better browser compatibility
- Optimized animations

---

## [1.5.0] - Previous Version - "Feature Complete"

### Added
- Crafting system with recipes and materials
- Achievement system (18+ achievements)
- Companion recruitment and loyalty system
- Party management features
- Side quest system
- Downtime activities
- Tutorial system
- Inspiration mechanic
- Status effects (poison, burning, stunned, blessed, etc.)
- Combat tactics (defensive, balanced, aggressive)

### Enhanced
- Character creation with backgrounds
- Inventory system with equipment slots
- Spell system with spell slots
- Journal and quest tracking
- Save/load functionality
- Settings panel

---

## [1.0.0] - Initial Release - "Core Experience"

### Features
- Character creation (7 races, 6 classes)
- D&D 5e combat mechanics
- 4 campaign adventures:
  - Night's Dark Terror
  - Curse of Strahd
  - Tomb of Annihilation
  - Keep on the Borderlands
- Leveling system (1-20)
- Basic inventory and equipment
- Exploration and travel
- Rest system (short/long rest)
- 50+ enemies
- 100+ items
- 30+ spells

---

## 🔮 Roadmap - Future Versions

### [2.1.0] - Planned - "Audio Experience"
- Background music for different locations
- Sound effects for combat
- Ambient sounds
- Voice-over for key moments
- Audio settings panel

### [2.2.0] - Planned - "Social Features"
- Character export/import improvements
- Campaign sharing
- Leaderboards
- Achievement showcasing
- Player statistics dashboard

### [2.3.0] - Planned - "Extended Content"
- New campaign: Lost Mine of Phandelver
- Additional character races (Gnome, Half-Elf)
- Additional classes (Paladin, Warlock)
- More spells and items
- Random encounter generator

### [3.0.0] - Concept - "Multiplayer"
- Online multiplayer support
- DM mode for one player
- Party coordination
- Shared campaigns
- Real-time chat

---

## 📊 Version Comparison

| Feature | v1.0 | v1.5 | v2.0 | v3.0 |
|---------|------|------|------|------|
| Core D&D Mechanics | ✅ | ✅ | ✅ | ✅ |
| Campaigns | 4 | 4 | 4 | 5 settings |
| Character Options | Basic | Advanced | Advanced | Advanced |
| Achievements | ❌ | ✅ | ✅ | ✅ |
| Crafting | ❌ | ✅ | ✅ | ✅ |
| Companions | ❌ | ✅ | ✅ | ✅ |
| Professional UI | ❌ | ⚠️ | ✅ | ✅ |
| Landing Page | ❌ | ❌ | ✅ | ✅ |
| Full Economy System | ❌ | ❌ | ❌ | ✅ |
| Black Market | ❌ | ❌ | ❌ | ✅ |
| Artifact Favors | ❌ | ❌ | ❌ | ✅ |
| Boss Depth (LR/LS) | ❌ | ❌ | ❌ | ✅ |
| Exhaustion System | ❌ | ❌ | ❌ | ✅ |
| Campaign Magic Items | ❌ | ❌ | ❌ | ✅ |
| Bounty/Guard System | ❌ | ❌ | ❌ | ✅ |
| Lines of Code (py) | — | — | — | ~6,850 |
| Lines of Code (js) | ~6,000 | ~9,000 | ~11,000 | ~11,000 |

---

## 🐛 Known Issues

### Minor
- Mobile keyboard may cover action buttons on small screens
- Very long item names may overflow in inventory
- Achievement notifications may stack if many unlocked simultaneously

### In Progress
- Cloud save synchronization (planned for 2.2.0)
- Audio system (planned for 2.1.0)

---

## 🙏 Credits

### Development
- Game Design & Programming: Solo developer
- D&D 5e Rule Implementation: Based on official SRD
- Campaign Adaptations: Inspired by official D&D modules

### Inspiration
- Gary Gygax & Dave Arneson - Creators of D&D
- Wizards of the Coast - D&D 5th Edition
- Classic D&D modules and adventures

### Tools & Resources
- HTML5, CSS3, JavaScript (Vanilla)
- Google Fonts (Cinzel, Crimson Text, MedievalSharp)
- D&D 5e System Reference Document (SRD)

---

## 📝 Notes

### Version Numbering
- **Major** (X.0.0): Significant overhauls, new major features
- **Minor** (0.X.0): New features, campaigns, or systems
- **Patch** (0.0.X): Bug fixes, balance tweaks, minor improvements

### Release Philosophy
- Quality over speed
- Player experience first
- No pay-to-win mechanics
- Respect for D&D lore and rules
- Community feedback valued

---

## 🎮 How to Check Your Version

The version number is displayed in:
1. Browser console on game load
2. Version badge in bottom-right of game screen
3. Settings panel > About section

---

*For full feature documentation, see README.md*  
*For press information, see PRESS_KIT.md*  
*For player's guide, see readme.txt*

---

**Last Updated:** February 25, 2026  
**Current Stable Version:** 3.0.0
