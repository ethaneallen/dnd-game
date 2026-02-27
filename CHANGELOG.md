# 📋 CHANGELOG - Realms of Adventure

All notable changes to the D&D: Realms of Adventure web game.

---

## [3.3.0] - 2026-02-27 - "Tabletop Fidelity" 🎯

### 🎉 MAJOR UPDATE - 5 Nice-to-Have D&D 5e Systems

This release fills in five commonly requested "nice-to-have" gaps — proper HP choices on level up, missing short rest class features, tool proficiencies, languages, and real item weight encumbrance — bringing the game closer to a true Player's Handbook experience.

### ✨ Added

#### **Proper HP on Level Up** (NEW)
- Modal dialog on level up presents the actual die roll AND the PHB "take average" (hitDie/2 + 1)
- Player chooses between the rolled value or the safe average each level
- `hpRollHistory` array tracks every HP choice (base roll + CON mod) per level
- `recalculateAfterAsi()` now uses actual recorded rolls instead of flat averages — fixes inconsistency where raising CON via ASI previously recalculated all levels using averages
- Python backend `level_up()` also prompts for roll vs average with printed options
- `showHpLevelUpChoice()` and `applyHpChoice()` methods on Game class

#### **Short Rest Class Features** (NEW)
- **Action Surge** (Fighter): Unlocked at level 2, second use at level 17. Resets on short rest and long rest. Tracked via `actionSurgeUses` / `actionSurgeUsed`
- **Channel Divinity** (Cleric): Unlocked at level 2 (Turn Undead), extra uses at levels 6 and 18. Resets on short rest and long rest. Tracked via `channelDivinityUses` / `channelDivinityUsed`
- **Channel Divinity** (Paladin): Unlocked at level 3 (oath power). Resets on short rest and long rest
- **Arcane Recovery** (Wizard): Once per day during short rest, automatically recovers lowest-level spell slots up to `ceil(level/2)` total levels (max 5th-level slots per RAW). Resets on long rest. Tracked via `arcaneRecoveryUsed`
- Level-up log messages announce each feature when unlocked
- Short Rest Resources panel in character sidebar shows Action Surge / Channel Divinity / Arcane Recovery status (used/available)

#### **Tool Proficiencies** (NEW)
- `CLASS_TOOL_PROFICIENCY` constant: Rogue → Thieves' Tools, Druid → Herbalism Kit, Artificer → Thieves' Tools + Tinker's Tools
- Background tool grants: Criminal → Thieves' Tools + Dice Set, Soldier → Dice Set + Vehicles (Land), Outlander → Herbalism Kit, Noble → Dice Set
- Race tool grants supported (data hook for Dwarf smith's tools variant, etc.)
- `isToolProficient()` and `getToolCheckBonus()` methods on Character
- Tool proficiency panel in character sidebar with proficiency bonus tooltips
- Downtime "Training" activity now has a mechanical target for tool proficiency

#### **Languages** (NEW)
- `ALL_LANGUAGES` constant: 16 languages (8 standard + 8 exotic) — Common, Dwarvish, Elvish, Giant, Gnomish, Goblin, Halfling, Orc, Abyssal, Celestial, Draconic, Deep Speech, Infernal, Primordial, Sylvan, Undercommon
- Racial languages: Elf → Common + Elvish, Dwarf → Common + Dwarvish, Dragonborn → Common + Draconic, Tiefling → Common + Infernal, Half-Orc → Common + Orc, Halfling → Common + Halfling, Human → Common + 1 extra
- Background languages: Scholar & Acolyte → 2 extra, Noble & Outlander → 1 extra (randomly assigned from available pool)
- `knowsLanguage()` method on Character for future language-gated encounters
- Languages panel in character sidebar with speech-bubble icons
- Languages and tool proficiencies announced in game start log

#### **Proper Encumbrance with Real Item Weights** (NEW)
- `ITEM_WEIGHTS` table: 60+ items with PHB-accurate weights (replaces old flat 2 lb/item estimate)
- Weapons: Dagger 1 lb, Longsword 3 lb, Greataxe 7 lb, etc.
- Armor: Leather 10 lb, Chain Mail 55 lb, Plate 65 lb, etc.
- Consumables, tools, shields, magic weapons all weighted
- Variant encumbrance thresholds per 5e SRD: Encumbered at STR×5 (-10 speed), Heavily Encumbered at STR×10 (-20 speed), Capacity at STR×15
- Color-coded encumbrance bar in character panel (green → yellow → red)
- Export system now uses the same `ITEM_WEIGHTS` table (renamed from `EXPORT_ITEM_WEIGHTS`)
- Unknown items default to 1 lb

### 🔧 Changed
- `levelUp()` refactored: core progression logic moved to `applyLevelUpFeatures()` so HP choice modal doesn't block feature unlocks
- `recalculateAfterAsi()` uses `hpRollHistory` for accurate HP when CON changes (falls back to averages for pre-3.3 saves)
- `calculateEncumbrance()` rewritten with real item weights and 5e variant encumbrance thresholds
- `EXPORT_ITEM_WEIGHTS` renamed to `ITEM_WEIGHTS` and expanded (backward compatible — same data, shared reference)
- `setupClass()` now grants class tool proficiencies
- `setupBackground()` now grants background tool proficiencies and languages
- `applyRacialBonus()` now grants racial languages and tool proficiencies
- `shortRest()` expanded with Action Surge, Channel Divinity, and Arcane Recovery recovery
- `performLongRest()` expanded with Action Surge, Channel Divinity, Arcane Recovery, and Paladin Channel Divinity resets
- `toJSON()` / `fromJSON()` updated with 8 new serialized properties (hpRollHistory, toolProficiencies, languages, actionSurgeUses, actionSurgeUsed, channelDivinityUses, channelDivinityUsed, arcaneRecoveryUsed) — backward compatible
- Character constructor adds new state: `actionSurgeUses`, `actionSurgeUsed`, `channelDivinityUses`, `channelDivinityUsed`, `arcaneRecoveryUsed`, `toolProficiencies`, `languages`, `hpRollHistory`
- Python `Character.__init__` adds matching state fields
- Python `level_up()` now prompts for roll vs average HP choice
- GAME_DATA races now include `languages` and optional `extraLanguages` / `toolProficiencies`
- GAME_DATA backgrounds now include `toolProficiencies` and `languages` arrays
- `updateUI()` expanded with 4 new panel renders (tools, languages, short rest resources, encumbrance)
- index.html character panel gains 4 new display sections

### 📊 Statistics
- game.js: ~16,020 lines (+320 from v3.2)
- game.py: ~6,870 lines (+20 from v3.2)
- 5 new D&D 5e mechanical systems
- 16 languages defined
- 60+ items with real weights
- 3 short rest class features added
- ~10 new Character methods
- Full backward compatibility with v3.0/v3.1/v3.2 saves

---

## [3.2.0] - 2026-02-26 - "Realism & Depth" 🎯

### 🎉 MAJOR UPDATE - 8 D&D 5e Realism Systems, Half-Orc Race & UI Overhaul

This release adds eight interconnected D&D 5e mechanical systems that bring authentic tabletop depth to every aspect of gameplay — from skill checks and equipment proficiency to racial abilities with real mechanical effects.

### ✨ Added

#### **Proper Skill System** (NEW)
- Complete 18-skill D&D 5e skill system with ability score mapping (Athletics→STR, Perception→WIS, etc.)
- `SKILL_ABILITY_MAP` constant mapping all 18 skills to their governing ability scores
- `CLASS_SKILL_CHOICES` defining available skill proficiencies per class with choice counts
- Skill proficiency tracking via `skillProficiencies` map on Character
- Expertise support (double proficiency bonus) via `expertise` map
- New Character methods: `isSkillProficient()`, `hasExpertise()`, `getSkillModifier()`, `addSkillProficiency()`
- `skillCheck()` and `skillCheckAnimated()` now accept optional `skillName` parameter and apply proficiency bonus
- Skills auto-assigned from class and background during character creation
- Human "Extra Skill" trait grants a random bonus skill proficiency
- Collapsible Skills Panel in character sidebar showing all 18 skills with ○/●/◆ proficiency markers

#### **Opportunity Attacks & Reactions** (NEW)
- Fleeing combat without Disengage now provokes an opportunity attack from the monster
- Monster makes a full attack roll vs player AC; on hit, deals weapon damage
- Rogue "Cunning Disengage" class feature prevents opportunity attacks
- Flee check reworked to use Acrobatics skill with proficiency bonus
- DC reduced to 5 when Disengaged, remains DC 12 otherwise
- Half-Orc Relentless Endurance triggers if opportunity attack drops player to 0 HP

#### **Passive Perception** (NEW)
- Three passive scores: Passive Perception, Passive Insight, Passive Investigation
- Calculated as 10 + skill modifier (includes proficiency if proficient)
- Ambush detection (`triggerAmbushCheck()`) rewritten: passive perception auto-detects if score ≥ DC
- Trap detection (treasure chests, trapped chest events) uses passive perception for auto-detect
- Disadvantage applies -5 to passive scores (darkness without darkvision)
- Advantage applies +5 to passive scores
- Passive score badges displayed in character panel (👁️ PP, 🧠 PI, 🔍 Inv)

#### **Ritual Casting** (NEW)
- 6 ritual spells added: Detect Magic, Identify, Comprehend Languages, Find Familiar, Speak with Animals, Water Breathing
- All marked with `ritual: true` in spell data
- `canCastRitual()` method checks class eligibility (Wizard, Cleric, Druid, Bard)
- `castSpellAsRitual()` casts without expending spell slots, advances time by 10 minutes
- Detect Magic reveals magic items in inventory; Identify shows item properties
- Ritual tag (🕯️) displayed on spell buttons; ritual cast option appears when out of spell slots
- Spell menu shows ritual availability for eligible spells out of combat

#### **Equipment Proficiency** (NEW)
- `CLASS_ARMOR_PROFICIENCY` table: per-class proficiency in light/medium/heavy armor and shields
- `CLASS_WEAPON_PROFICIENCY` table: per-class proficiency in simple/martial weapons and specific weapons
- All 50+ weapons tagged with `category: "simple"` or `category: "martial"`
- `isProficientWithWeapon()`, `isProficientWithArmor()`, `isProficientWithShield()` methods
- Non-proficient weapon attacks no longer add proficiency bonus to attack rolls
- Non-proficient armor/shield causes disadvantage on attack rolls
- Warning messages displayed when equipping non-proficient gear
- Magic weapon prefix stripping for proficiency checks ("+1 Longsword" → "Longsword")

#### **Attunement System** (NEW)
- 3-item attunement limit per D&D 5e rules
- All magic weapons (+1/+2/+3) marked with `requiresAttunement: true`
- `canAttune()`, `attuneItem()`, `unattuneItem()`, `isAttuned()`, `getItemRequiresAttunement()` methods
- Auto-attunement on equipping magic weapons (if slots available)
- Block equipping if attunement slots full with clear error message
- Attunement display in character panel showing count (X/3) and attuned item names
- Attunement state saved/loaded with character data

#### **Darkvision Mechanics** (NEW)
- `darkvisionRange` property on Character (60ft for applicable races)
- `hasDarkvision()` method for mechanical checks
- Ambush checks: nighttime without darkvision = disadvantage on perception
- Nighttime with darkvision = still disadvantage (dim light per RAW, not bright)
- Trap detection: darkness without darkvision = disadvantage on Investigation checks
- Darkvision indicator displayed in character panel traits row (🌙 Darkvision 60ft)
- Races with Darkvision: Elf, Dwarf, Half-Orc, Tiefling, Dragonborn

#### **Racial Abilities with Mechanical Effect** (NEW)
- `RACIAL_ABILITIES` constant with detailed ability data for all 7 races
- **Halfling Lucky**: Natural 1s on d20 rolls are rerolled (implemented in skillCheck/skillCheckAnimated)
- **Halfling Brave**: Advantage on saving throws against being frightened
- **Elf Fey Ancestry**: Advantage on saving throws against being charmed
- **Dwarf Dwarven Resilience**: Advantage on saving throws against poison
- **Dragonborn Breath Weapon**: Bonus action 15ft cone/30ft line attack, CON-save DC, scales 2d6→5d6 by level, recharges on short rest
- **Dragonborn Fire Resistance**: Half damage from fire attacks
- **Tiefling Fire Resistance**: Half damage from fire attacks
- **Dwarf Poison Resistance**: Half damage from poison attacks
- **Half-Orc Relentless Endurance**: Drop to 1 HP instead of 0 once per long rest
- **Half-Orc Savage Attacks**: Extra damage die on critical hits (trait tracked)
- `takeDamage()` now accepts `damageType` parameter for racial resistance checks
- `applyMonsterDamageToPlayer()` passes monster damage type through to resistance system
- Racial resistance notifications displayed during combat
- Racial ability status indicators in character panel (used/available)

#### **Half-Orc Race** (NEW)
- Added to `GAME_DATA.races` with +2 STR, +1 CON ability bonuses
- Traits: Darkvision, Relentless Endurance, Savage Attacks
- Race icon (🪓) added to character creation screen
- Full mechanical integration: darkvision, damage resistance, Relentless Endurance

#### **Character Panel UI Enhancements** (NEW)
- Passive score badges (PP, PI, Inv) with tooltips explaining calculation
- Racial traits row showing Darkvision range, ability status (Breath Weapon used/available, Relentless used/available), Lucky, Fey Ancestry, Dwarven Resilience, Fire Resistance
- Attunement display showing attuned item count and names
- Collapsible 18-skill panel with proficiency markers (○ untrained, ● proficient, ◆ expertise), ability abbreviations, and signed modifiers
- CSS styles for all new panel elements (passive badges, trait tags, skill rows, attunement display, equipment panel)

### 🔧 Changed
- `skillCheck()` / `skillCheckAnimated()` signature expanded with `skillName` parameter (backward compatible)
- `takeDamage()` signature expanded with `damageType` parameter (backward compatible)
- `applyMonsterDamageToPlayer()` signature expanded with `damageType` parameter
- `checkForAdvantage()` updated to use `isSkillProficient()` and racial advantage checks
- `triggerAmbushCheck()` completely rewritten for passive perception + darkvision integration
- `combatAction("flee")` completely rewritten with opportunity attack system
- `equipItem()` now checks attunement limits and equipment proficiency
- Attack roll calculation now conditionally adds proficiency based on weapon proficiency
- `performLongRest()` restores racial abilities (Breath Weapon, Relentless Endurance)
- `shortRest()` restores Dragonborn Breath Weapon
- `setupClass()` now initializes skill proficiencies from class data
- `setupBackground()` now adds background skill proficiencies
- `applyRacialBonus()` now sets darkvision range and initializes racial ability tracking
- `toJSON()` / `fromJSON()` updated with 5 new serialized properties (backward compatible)
- Trapped chest events use passive perception and Investigation skill
- Treasure chest events use passive perception for trap auto-detection
- `getAvailableBonusActions()` includes Dragonborn Breath Weapon
- `createSpellButton()` displays ritual and concentration tags
- `showSpellMenu()` shows ritual casting availability
- Save format version bumped to 3.2 (backward compatible with 3.1)

### 📊 Statistics
- game.js: ~15,700 lines (+700 from v3.1)
- 8 new interconnected D&D 5e mechanical systems
- 6 new ritual spells
- 1 new playable race (Half-Orc)
- 18 skills fully mapped and tracked
- 50+ weapons categorized (simple/martial)
- ~25 new Character methods
- Full backward compatibility with v3.0/v3.1 saves

---

## [3.1.0] - 2026-02-25 - "Combat Gates" ⚔️

### 🎉 MAJOR UPDATE - New Campaign, Combat-Gated Progression & Full Campaign Audit

This release adds the Lost Mine of Phandelver as a fully integrated 5th campaign with all 15 game systems wired, and overhauls story progression across ALL campaigns so players must earn advancement through combat instead of clicking through locations.

### ✨ Added

#### **Lost Mine of Phandelver Campaign** (NEW)
- Complete 7-chapter campaign: Prologue through Epilogue (Levels 1-5)
- 6 NPCs: Gundren Rockseeker, Sildar Hallwinter, The Black Spider, Glasstaff, Nezznar, Elmar Barthen
- 21 locations across wilderness, town, and dungeon types
- 17 monsters across 5 tiers including 4 bosses (Glasstaff, King Grol, Flameskull, Nezznar)
- 17 quest flags tracking full story progression
- 2 companions: Sildar Hallwinter (Fighter) and Sister Garaele (Cleric)
- 8 campaign-specific rumors
- Campaign-specific items: Talon, Hew, Lightbringer, Spider Staff, Phandalin Shield, and more
- Full story events: intro, rescue Sildar, arrive Phandalin, Redbrand arc, Cragmaw Castle, Wave Echo Cave, defeat Black Spider
- Chapter hints and progression locations fully wired
- Location unlock logic tied to quest flags for chapter gating

#### **Combat-Gated Story Progression** (NEW - All 5 Campaigns)
- New `pendingStoryEvent` system queues story events behind mandatory combat encounters
- Story no longer advances by simply clicking travel — players must fight through guardians
- 22 combat gates added across all campaigns:
  - **LMoP (6):** Goblin ambush, Klarg the Bugbear, Nothic guardian, Hobgoblin Sentry, Undead Miner, Spectator
  - **Night's Dark Terror (3):** Bugbear Sentry, Goblin Jailer, Dire Wolf
  - **Curse of Strahd (4):** Strahd Zombie, Werewolf, Amber Golem, Vampire Spawn
  - **Tomb of Annihilation (4):** Allosaurus, Yuan-ti Malison, Yuan-ti Abomination, Tomb Guardian
  - **Keep on the Borderlands (6):** Kobold Scout, Kobold Warrior, Goblin Ambusher, Hobgoblin Patrol Leader, Acolyte of Chaos (+ existing Minotaur/High Priest bosses)
- Town arrivals and NPC meetings remain ungated (narratively appropriate)
- Each gate features unique flavor text describing the encounter

#### **Full Campaign Integration Audit**
- Verified all 5 campaigns across 15 integration points each (75 total checkpoints)
- Fixed 4 missing integration points in Keep on the Borderlands:
  - Campaign items (weapons, armor, consumables, shop/loot tables)
  - Campaign rumors (8 entries)
  - Kill tracking (outer/inner monster counters)
  - Game over statistics
- All campaigns confirmed at 100% integration coverage

### 🔧 Changed
- `checkStoryTriggers()` now starts combat at dungeon/dangerous progression points instead of instantly firing story events
- Combat victory handler checks `pendingStoryEvent` and fires queued story after winning
- `DungeonMaster` constructor initializes `pendingStoryEvent: null`
- Save format version bumped to 3.1 (backward compatible with 3.0)

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

| Feature | v1.0 | v1.5 | v2.0 | v3.0 | v3.1 | v3.2 | v3.3 |
|---------|------|------|------|------|------|------|------|
| Core D&D Mechanics | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Campaigns | 4 | 4 | 4 | 5 settings | 5 full | 5 full | 5 full |
| Character Options | Basic | Advanced | Advanced | Advanced | Advanced | Advanced | Advanced |
| Achievements | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Crafting | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Companions | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Professional UI | ❌ | ⚠️ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Landing Page | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Full Economy System | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| Black Market | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| Artifact Favors | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| Boss Depth (LR/LS) | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| Exhaustion System | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| Campaign Magic Items | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| Bounty/Guard System | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| Combat-Gated Progress | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| Lost Mine of Phandelver | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| Skill Proficiency (18) | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| Racial Abilities | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| Darkvision | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| Tool Proficiencies | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Languages | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Short Rest Features | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Proper Encumbrance | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| HP Roll vs Average | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Lines of Code (py) | — | — | — | ~6,850 | ~6,850 | ~6,850 | ~6,870 |
| Lines of Code (js) | ~6,000 | ~9,000 | ~11,000 | ~11,000 | ~13,000 | ~15,700 | ~16,020 |

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

**Last Updated:** February 27, 2026  
**Current Stable Version:** 3.3.0
