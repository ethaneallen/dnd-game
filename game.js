// D&D 5e Web-Based Game Engine

// ==================== GAME SETTINGS ====================
const SOUND_ENABLED = true;
const SOUND_VOLUME = 0.5;
const MUSIC_VOLUME = 0.3;

// Difficulty Settings
const DIFFICULTY_SETTINGS = {
    easy: {
        name: "Easy",
        enemyHpMod: 0.75,
        enemyDamageMod: 0.75,
        xpMod: 0.8,
        goldMod: 1.25,
        description: "For those new to adventure"
    },
    normal: {
        name: "Normal",
        enemyHpMod: 1.0,
        enemyDamageMod: 1.0,
        xpMod: 1.0,
        goldMod: 1.0,
        description: "The standard D&D experience"
    },
    hard: {
        name: "Hard",
        enemyHpMod: 1.5,
        enemyDamageMod: 1.25,
        xpMod: 1.25,
        goldMod: 0.8,
        description: "For seasoned adventurers"
    }
};

let currentDifficulty = 'normal';
let currentTheme = 'dark';
let currentFontSize = 'medium';

// ==================== ACHIEVEMENT SYSTEM ====================
const ACHIEVEMENTS = {
    first_blood: { name: "First Blood", description: "Defeat your first enemy", icon: "⚔️", condition: (stats) => stats.enemiesKilled >= 1 },
    warrior: { name: "Warrior", description: "Defeat 25 enemies", icon: "🗡️", condition: (stats) => stats.enemiesKilled >= 25 },
    slayer: { name: "Slayer", description: "Defeat 100 enemies", icon: "💀", condition: (stats) => stats.enemiesKilled >= 100 },
    level_5: { name: "Seasoned", description: "Reach level 5", icon: "📈", condition: (stats) => stats.level >= 5 },
    level_10: { name: "Veteran", description: "Reach level 10", icon: "🌟", condition: (stats) => stats.level >= 10 },
    level_20: { name: "Legendary", description: "Reach level 20", icon: "👑", condition: (stats) => stats.level >= 20 },
    rich: { name: "Wealthy", description: "Accumulate 500 gold", icon: "💰", condition: (stats) => stats.goldEarned >= 500 },
    treasure_hunter: { name: "Treasure Hunter", description: "Accumulate 2000 gold", icon: "🏆", condition: (stats) => stats.goldEarned >= 2000 },
    critical_master: { name: "Critical Master", description: "Land 10 critical hits", icon: "🎯", condition: (stats) => stats.criticalHits >= 10 },
    survivor: { name: "Survivor", description: "Win a battle with less than 5 HP", icon: "❤️", condition: (stats) => stats.closeCallWins >= 1 },
    spell_slinger: { name: "Spell Slinger", description: "Cast 50 spells", icon: "✨", condition: (stats) => stats.spellsCast >= 50 },
    explorer: { name: "Explorer", description: "Visit 20 different locations", icon: "🗺️", condition: (stats) => stats.locationsVisited >= 20 },
    quest_complete: { name: "Hero", description: "Complete a campaign", icon: "🏅", condition: (stats) => stats.campaignsCompleted >= 1 },
    boss_slayer: { name: "Boss Slayer", description: "Defeat a boss enemy", icon: "🐉", condition: (stats) => stats.bossesKilled >= 1 },
    craftsman: { name: "Craftsman", description: "Craft 10 items", icon: "🔨", condition: (stats) => stats.itemsCrafted >= 10 },
    companion_bond: { name: "Companion Bond", description: "Max loyalty with a companion", icon: "🤝", condition: (stats) => stats.maxLoyaltyReached >= 1 },
    no_damage: { name: "Untouchable", description: "Win a combat without taking damage", icon: "🛡️", condition: (stats) => stats.flawlessVictories >= 1 },
    dragon_slayer: { name: "Dragon Slayer", description: "Defeat a dragon", icon: "🐲", condition: (stats) => stats.dragonsKilled >= 1 }
};

// ==================== STATUS EFFECTS ====================
const STATUS_EFFECTS = {
    poisoned: {
        name: "Poisoned",
        icon: "🤢",
        damagePerTurn: 3,
        duration: 3,
        description: "Taking poison damage each turn",
        onTurnStart: (char, effect) => {
            const damage = effect.damagePerTurn;
            char.hp -= damage;
            return `🤢 Poison deals ${damage} damage!`;
        }
    },
    burning: {
        name: "Burning",
        icon: "🔥",
        damagePerTurn: 5,
        duration: 2,
        description: "Engulfed in flames",
        onTurnStart: (char, effect) => {
            const damage = effect.damagePerTurn;
            char.hp -= damage;
            return `🔥 Fire burns for ${damage} damage!`;
        }
    },
    stunned: {
        name: "Stunned",
        icon: "💫",
        duration: 1,
        description: "Unable to take actions",
        preventsAction: true
    },
    blessed: {
        name: "Blessed",
        icon: "✨",
        duration: 3,
        attackBonus: 2,
        description: "+2 to attack rolls"
    },
    weakened: {
        name: "Weakened",
        icon: "📉",
        duration: 2,
        damageReduction: 0.5,
        description: "Dealing half damage"
    },
    regenerating: {
        name: "Regenerating",
        icon: "💚",
        healPerTurn: 3,
        duration: 3,
        description: "Healing each turn",
        onTurnStart: (char, effect) => {
            const heal = Math.min(effect.healPerTurn, char.maxHp - char.hp);
            char.hp += heal;
            return `💚 Regeneration heals ${heal} HP!`;
        }
    },
    frightened: {
        name: "Frightened",
        icon: "😨",
        duration: 2,
        attackPenalty: -2,
        description: "-2 to attack rolls, cannot approach source"
    }
};

// ==================== RANDOM SIDE QUESTS ====================
const SIDE_QUEST_TEMPLATES = [
    { type: "kill", title: "Bounty Hunt", description: "A bounty has been placed on {target}. Eliminate them for a reward.", reward: { gold: 50, xp: 100 } },
    { type: "kill", title: "Pest Control", description: "The local {target} population has grown dangerous. Thin their numbers.", reward: { gold: 30, xp: 75 } },
    { type: "fetch", title: "Lost Heirloom", description: "A family heirloom was lost in {location}. Retrieve it.", reward: { gold: 40, xp: 50 } },
    { type: "fetch", title: "Rare Ingredients", description: "An alchemist needs {item} found in {location}.", reward: { gold: 35, xp: 60 } },
    { type: "explore", title: "Uncharted Territory", description: "Map the area around {location}.", reward: { gold: 25, xp: 80 } },
    { type: "escort", title: "Safe Passage", description: "Escort a merchant safely through dangerous territory.", reward: { gold: 60, xp: 90 } },
    { type: "rescue", title: "Missing Person", description: "Someone has gone missing near {location}. Find them!", reward: { gold: 45, xp: 85 } }
];

// ==================== BOSS ENCOUNTERS ====================
const BOSS_ENEMIES = {
    goblin_king: {
        name: "Grishnak the Goblin King",
        hp: 85,
        ac: 16,
        attack: 8,
        damage: "2d8+4",
        xp: 450,
        icon: "👺",
        abilities: ["multiattack", "rally_goblins"],
        loot: ["Crown of the Goblin King", 150],
        description: "A massive goblin wearing a crude iron crown",
        legendaryResistances: 1
    },
    vampire_lord: {
        name: "Count Vasilis",
        hp: 120,
        ac: 17,
        attack: 9,
        damage: "2d6+5",
        xp: 700,
        icon: "🧛",
        abilities: ["life_drain", "charm", "mist_form"],
        loot: ["Vampiric Blade", 200],
        description: "An ancient vampire lord with piercing red eyes",
        legendaryResistances: 2
    },
    ancient_dragon: {
        name: "Scoratharax",
        hp: 200,
        ac: 19,
        attack: 12,
        damage: "3d10+6",
        xp: 1500,
        icon: "🐉",
        abilities: ["breath_weapon", "frightful_presence", "tail_attack"],
        loot: ["Dragon Scale Armor", 500],
        description: "A massive red dragon with scales like burning coals",
        legendaryResistances: 3
    },
    lich: {
        name: "Acererak the Eternal",
        hp: 135,
        ac: 18,
        attack: 10,
        damage: "3d6+5",
        xp: 1000,
        icon: "💀",
        abilities: ["power_word_kill", "paralyzing_touch", "summon_undead"],
        loot: ["Staff of the Lich", 350],
        description: "A skeletal mage crackling with necrotic energy",
        legendaryResistances: 3
    },
    beholder: {
        name: "Xanathar",
        hp: 150,
        ac: 18,
        attack: 11,
        damage: "2d8+4",
        xp: 900,
        icon: "👁️",
        abilities: ["eye_rays", "antimagic_cone", "death_ray"],
        loot: ["Beholder Eye", 300],
        description: "A floating orb covered in eyestalks",
        legendaryResistances: 3
    }
};

// ==================== FEATS DATA ====================
const FEATS_DATA = {
    "Great Weapon Master": {
        description: "Before you make a melee attack with a heavy weapon, you can take a -5 penalty to the attack roll. If it hits, +10 damage.",
        prerequisite: null,
        effect: { heavyWeaponPowerAttack: true },
        onApply: (char) => { char.feats.push("Great Weapon Master"); }
    },
    "Sharpshooter": {
        description: "Before you make a ranged attack, you can take a -5 penalty to the attack roll. If it hits, +10 damage. Ignore half and three-quarters cover.",
        prerequisite: null,
        effect: { rangedPowerAttack: true },
        onApply: (char) => { char.feats.push("Sharpshooter"); }
    },
    "Lucky": {
        description: "You have 3 luck points. Spend one to reroll an attack, ability check, or saving throw. Regain all on long rest.",
        prerequisite: null,
        effect: { luckyPoints: 3 },
        onApply: (char) => { char.feats.push("Lucky"); char.featData.luckyPoints = 3; }
    },
    "Sentinel": {
        description: "Creatures you hit with opportunity attacks have their speed reduced to 0. When a creature within 5ft attacks a target other than you, you can use your reaction to make a melee attack.",
        prerequisite: null,
        effect: { sentinel: true },
        onApply: (char) => { char.feats.push("Sentinel"); }
    },
    "Tough": {
        description: "Your hit point maximum increases by an amount equal to twice your level. Each time you gain a level, your HP max increases by 2 more.",
        prerequisite: null,
        effect: { toughHpBonus: true },
        onApply: (char) => { char.feats.push("Tough"); char.maxHp += char.level * 2; char.hp += char.level * 2; }
    },
    "War Caster": {
        description: "Advantage on CON saves to maintain concentration. Can perform somatic components with hands full. Cast a spell as an opportunity attack.",
        prerequisite: "spellcaster",
        effect: { warCaster: true },
        onApply: (char) => { char.feats.push("War Caster"); }
    },
    "Resilient (CON)": {
        description: "Increase CON by 1 (max 20). Gain proficiency in CON saving throws.",
        prerequisite: null,
        effect: { resilientCon: true },
        onApply: (char) => { char.feats.push("Resilient (CON)"); char.stats.con = Math.min(20, char.stats.con + 1); }
    },
    "Alert": {
        description: "+5 to initiative. You can't be surprised. Other creatures don't gain advantage on attack rolls against you from being unseen.",
        prerequisite: null,
        effect: { alertInitiativeBonus: 5 },
        onApply: (char) => { char.feats.push("Alert"); }
    },
    "Mobile": {
        description: "Your speed increases by 10 feet. When you use the Dash action, difficult terrain doesn't cost extra movement. No opportunity attacks from creatures you melee.",
        prerequisite: null,
        effect: { mobile: true },
        onApply: (char) => { char.feats.push("Mobile"); }
    },
    "Polearm Master": {
        description: "When you take the Attack action with a glaive, halberd, quarterstaff, or spear, you can make a bonus attack with the other end (1d4 bludgeoning).",
        prerequisite: null,
        effect: { polearmMaster: true },
        onApply: (char) => { char.feats.push("Polearm Master"); }
    },
    "Crossbow Expert": {
        description: "Ignore the loading property of crossbows. No disadvantage on ranged attacks within 5 feet. Bonus attack with hand crossbow after one-handed attack.",
        prerequisite: null,
        effect: { crossbowExpert: true },
        onApply: (char) => { char.feats.push("Crossbow Expert"); }
    },
    "Shield Master": {
        description: "Bonus action: shove a creature 5ft with your shield. Add your shield's AC bonus to DEX saves. Use your reaction to take no damage on successful DEX saves (Evasion).",
        prerequisite: null,
        effect: { shieldMaster: true },
        onApply: (char) => { char.feats.push("Shield Master"); }
    },
    "Magic Initiate": {
        description: "Learn 2 cantrips and 1 first-level spell from any class's spell list. Cast the 1st-level spell once per long rest without a spell slot.",
        prerequisite: null,
        effect: { magicInitiate: true },
        onApply: (char) => {
            char.feats.push("Magic Initiate");
            if (!char.spells.cantrips.includes("Fire Bolt")) {
                char.spells.cantrips.push("Fire Bolt");
            }
            if (!char.spells.known.includes("Shield") && !char.isSpellcaster()) {
                char.spells.known.push("Shield");
            }
        }
    },
    "Savage Attacker": {
        description: "Once per turn when you roll damage for a melee weapon attack, you can reroll the damage dice and use either total.",
        prerequisite: null,
        effect: { savageAttacker: true },
        onApply: (char) => { char.feats.push("Savage Attacker"); }
    }
};

// ==================== SUBCLASS DATA ====================
// Each class gets 2-3 subclasses, chosen at level 3 (D&D 5e standard)
const SUBCLASS_DATA = {
    Fighter: {
        name: "Martial Archetype",
        level: 3,
        options: {
            Champion: {
                name: "Champion",
                description: "A master of raw physical power. Improved criticals and athletic prowess.",
                features: {
                    3: { name: "Improved Critical", description: "Your weapon attacks score a critical hit on a roll of 19 or 20.", type: "passive" },
                    7: { name: "Remarkable Athlete", description: "+2 bonus to STR, DEX, and CON checks.", type: "passive" },
                    15: { name: "Superior Critical", description: "Your weapon attacks score a critical hit on a roll of 18-20.", type: "passive" }
                }
            },
            BattleMaster: {
                name: "Battle Master",
                description: "A tactical genius who uses superiority dice to perform combat maneuvers.",
                features: {
                    3: { name: "Combat Superiority", description: "You gain 4 superiority dice (d8). Spend them on maneuvers for bonus damage and effects.", type: "resource", dice: 4, dieSize: 8 },
                    7: { name: "Additional Superiority Die", description: "You gain a 5th superiority die.", type: "resource_upgrade", dice: 5 },
                    15: { name: "Relentless", description: "If you have no superiority dice at the start of combat, you regain one.", type: "passive" }
                }
            },
            EldritchKnight: {
                name: "Eldritch Knight",
                description: "A fighter who supplements martial prowess with arcane magic.",
                features: {
                    3: { name: "Spellcasting", description: "You learn 2 wizard cantrips and 3 wizard spells (1st level). Use INT for spellcasting.", type: "spellcasting", cantrips: 2, spellsKnown: 3 },
                    7: { name: "War Magic", description: "When you cast a cantrip, you can make one weapon attack as a bonus action.", type: "passive" },
                    15: { name: "Arcane Charge", description: "When you use Action Surge, you can teleport up to 30ft.", type: "passive" }
                }
            }
        }
    },
    Wizard: {
        name: "Arcane Tradition",
        level: 2, // Wizards choose at level 2 in 5e, but we use 3 for consistency
        options: {
            Evocation: {
                name: "School of Evocation",
                description: "Masters of destructive magical energy — fireballs and lightning bolts.",
                features: {
                    3: { name: "Sculpt Spells", description: "Allies automatically succeed on saves against your evocation spells.", type: "passive" },
                    7: { name: "Potent Cantrip", description: "Your damaging cantrips deal half damage even when the target succeeds on a saving throw.", type: "passive" },
                    14: { name: "Empowered Evocation", description: "Add your INT modifier to one damage roll of any evocation spell.", type: "passive" }
                }
            },
            Abjuration: {
                name: "School of Abjuration",
                description: "Specialists in protective magic — wards, shields, and counterspells.",
                features: {
                    3: { name: "Arcane Ward", description: "When you cast an abjuration spell, you gain a magical ward with HP equal to twice your wizard level + INT modifier.", type: "resource" },
                    7: { name: "Projected Ward", description: "Your Arcane Ward can absorb damage dealt to nearby allies.", type: "passive" },
                    14: { name: "Spell Resistance", description: "You have advantage on saving throws against spells.", type: "passive" }
                }
            },
            Necromancy: {
                name: "School of Necromancy",
                description: "Masters of the dark arts who drain life force and command the undead.",
                features: {
                    3: { name: "Grim Harvest", description: "When you kill a creature with a spell, you regain HP equal to twice the spell's level (3x for necromancy).", type: "passive" },
                    7: { name: "Undead Thralls", description: "Undead you raise have extra HP equal to your wizard level and deal bonus damage.", type: "passive" },
                    14: { name: "Inured to Undeath", description: "You have resistance to necrotic damage and your HP maximum can't be reduced.", type: "passive" }
                }
            }
        }
    },
    Rogue: {
        name: "Roguish Archetype",
        level: 3,
        options: {
            Thief: {
                name: "Thief",
                description: "A master burglar and treasure hunter with unmatched agility.",
                features: {
                    3: { name: "Fast Hands", description: "You can use your bonus action to pick locks, disarm traps, or use items. +2 to DEX checks.", type: "passive" },
                    7: { name: "Second-Story Work", description: "Climbing costs no extra movement. Running jump distance increases by your DEX modifier in feet.", type: "passive" },
                    13: { name: "Supreme Sneak", description: "You have advantage on Stealth checks if you move no more than half your speed.", type: "passive" }
                }
            },
            Assassin: {
                name: "Assassin",
                description: "A deadly killer who strikes from the shadows with lethal precision.",
                features: {
                    3: { name: "Assassinate", description: "You have advantage on attack rolls against creatures that haven't taken a turn. Any hit against a surprised creature is a critical hit.", type: "passive" },
                    7: { name: "Evasion", description: "When subjected to a DEX save for half damage, you take no damage on success and half on failure.", type: "passive" },
                    13: { name: "Death Strike", description: "When you hit a surprised creature, it must make a CON save or take double damage.", type: "passive" }
                }
            },
            ArcaneTrickster: {
                name: "Arcane Trickster",
                description: "A rogue who uses illusions and enchantments to confuse and outwit foes.",
                features: {
                    3: { name: "Spellcasting", description: "You learn Mage Hand plus 2 cantrips and 3 wizard spells. Use INT for spellcasting.", type: "spellcasting", cantrips: 3, spellsKnown: 3 },
                    7: { name: "Magical Ambush", description: "If you are hidden when you cast a spell, the target has disadvantage on its saving throw.", type: "passive" },
                    13: { name: "Versatile Trickster", description: "Use Mage Hand to distract a creature, giving you advantage on attacks against it.", type: "passive" }
                }
            }
        }
    },
    Cleric: {
        name: "Divine Domain",
        level: 1, // Clerics choose at level 1 in 5e, but we use 3 for consistency
        options: {
            Life: {
                name: "Life Domain",
                description: "Masters of healing magic who channel divine energy to restore the wounded.",
                features: {
                    3: { name: "Disciple of Life", description: "Your healing spells are empowered: whenever you use a spell to restore HP, the target regains an additional 2 + spell level HP.", type: "passive" },
                    7: { name: "Blessed Healer", description: "When you cast a healing spell on another creature, you also regain HP equal to 2 + spell level.", type: "passive" },
                    14: { name: "Supreme Healing", description: "Your healing spells always restore the maximum possible HP (no rolling).", type: "passive" }
                }
            },
            War: {
                name: "War Domain",
                description: "Holy warriors who channel divine wrath into devastating attacks.",
                features: {
                    3: { name: "War Priest", description: "When you take the Attack action, you can make one weapon attack as a bonus action (WIS modifier times per long rest).", type: "resource" },
                    7: { name: "Guided Strike", description: "You can add +10 to an attack roll after seeing the roll (once per short rest).", type: "resource" },
                    14: { name: "Avatar of Battle", description: "You have resistance to bludgeoning, piercing, and slashing damage from nonmagical attacks.", type: "passive" }
                }
            },
            Light: {
                name: "Light Domain",
                description: "Champions of radiance who wield fire and light against the darkness.",
                features: {
                    3: { name: "Radiance of the Dawn", description: "As an action, dispel magical darkness within 30ft and deal 2d10 + cleric level radiant damage to hostile creatures (CON save for half).", type: "active" },
                    7: { name: "Improved Flare", description: "When an enemy attacks you or an ally within 30ft, impose disadvantage on the attack roll (reaction).", type: "passive" },
                    14: { name: "Corona of Light", description: "Your damaging spells deal an extra 1d8 radiant damage.", type: "passive" }
                }
            }
        }
    },
    Ranger: {
        name: "Ranger Archetype",
        level: 3,
        options: {
            Hunter: {
                name: "Hunter",
                description: "A relentless tracker who studies and exploits the weaknesses of prey.",
                features: {
                    3: { name: "Colossus Slayer", description: "Once per turn, deal an extra 1d8 damage to a creature below its HP maximum.", type: "passive" },
                    7: { name: "Escape the Horde", description: "Opportunity attacks against you are made with disadvantage.", type: "passive" },
                    11: { name: "Multiattack", description: "You can make two ranged attacks against different creatures within 10ft of each other.", type: "passive" }
                }
            },
            BeastMaster: {
                name: "Beast Master",
                description: "A ranger who fights alongside a loyal animal companion.",
                features: {
                    3: { name: "Animal Companion", description: "You gain a beast companion (wolf) that fights alongside you. It has HP equal to 4x your ranger level.", type: "companion", companionHp: 4 },
                    7: { name: "Exceptional Training", description: "Your companion can Dash, Dodge, or Disengage as a bonus action on its turn.", type: "passive" },
                    11: { name: "Bestial Fury", description: "Your companion can make two attacks when you command it to attack.", type: "passive" }
                }
            }
        }
    },
    Barbarian: {
        name: "Primal Path",
        level: 3,
        options: {
            Berserker: {
                name: "Path of the Berserker",
                description: "A barbarian consumed by the thrill of combat, entering a mindless frenzy.",
                features: {
                    3: { name: "Frenzy", description: "While raging, you can make a single melee weapon attack as a bonus action on each turn. Gain 1 level of exhaustion when rage ends.", type: "passive" },
                    7: { name: "Mindless Rage", description: "You can't be charmed or frightened while raging.", type: "passive" },
                    14: { name: "Retaliation", description: "When you take damage from a creature within 5ft, you can use your reaction to make a melee attack against it.", type: "passive" }
                }
            },
            TotemWarrior: {
                name: "Path of the Totem Warrior",
                description: "A spiritual warrior who draws power from animal totems.",
                features: {
                    3: { name: "Totem Spirit (Bear)", description: "While raging, you have resistance to all damage except psychic damage.", type: "passive" },
                    7: { name: "Spirit Walker", description: "You can cast Commune with Nature as a ritual. +2 bonus to Perception and Survival checks.", type: "passive" },
                    14: { name: "Totemic Attunement", description: "While raging, hostile creatures within 5ft have disadvantage on attacks against targets other than you.", type: "passive" }
                }
            }
        }
    },
    Paladin: {
        name: "Sacred Oath",
        level: 3,
        options: {
            Devotion: {
                name: "Oath of Devotion",
                description: "The quintessential paladin, dedicated to justice and righteousness.",
                features: {
                    3: { name: "Sacred Weapon", description: "Channel Divinity: Add CHA modifier to attack rolls for 1 minute." },
                    7: { name: "Aura of Devotion", description: "You and allies within 10ft can't be charmed." },
                    15: { name: "Purity of Spirit", description: "You are permanently under the effect of Protection from Evil and Good." }
                }
            },
            Vengeance: {
                name: "Oath of Vengeance",
                description: "A paladin driven by punishing those who commit grievous sins.",
                features: {
                    3: { name: "Vow of Enmity", description: "Channel Divinity: Gain advantage on attacks against one creature for 1 minute." },
                    7: { name: "Relentless Avenger", description: "When you hit with an opportunity attack, move up to half your speed immediately." },
                    15: { name: "Soul of Vengeance", description: "When your Vow of Enmity target attacks, you can use your reaction to make a melee attack." }
                }
            },
            Ancients: {
                name: "Oath of the Ancients",
                description: "An oath to preserve the light of the world against darkness.",
                features: {
                    3: { name: "Nature's Wrath", description: "Channel Divinity: Spectral vines restrain a creature (STR/DEX save)." },
                    7: { name: "Aura of Warding", description: "You and allies within 10ft have resistance to spell damage." },
                    15: { name: "Undying Sentinel", description: "When reduced to 0 HP, drop to 1 HP instead (once per long rest)." }
                }
            }
        }
    },
    Monk: {
        name: "Monastic Tradition",
        level: 3,
        options: {
            OpenHand: {
                name: "Way of the Open Hand",
                description: "Masters of unarmed combat and martial arts techniques.",
                features: {
                    3: { name: "Open Hand Technique", description: "When you hit with Flurry of Blows, impose STR save (prone), DEX save (push 15ft), or no reactions until end of your next turn." },
                    7: { name: "Wholeness of Body", description: "As an action, regain HP equal to 3× your monk level. Once per long rest." },
                    15: { name: "Quivering Palm", description: "Set up vibrations in a creature's body. Can spend 3 ki to reduce it to 0 HP or deal 10d10 necrotic (CON save)." }
                }
            },
            Shadow: {
                name: "Way of Shadow",
                description: "Monks who follow this tradition are ninja — stealthy assassins of the night.",
                features: {
                    3: { name: "Shadow Arts", description: "Spend 2 ki to cast Darkness, Darkvision, Pass Without Trace, or Silence." },
                    7: { name: "Shadow Step", description: "Teleport 60ft from one shadow to another as a bonus action, gaining advantage on your next attack." },
                    15: { name: "Opportunist", description: "When a creature within 5ft is hit by another creature, you can use your reaction to make a melee attack." }
                }
            }
        }
    },
    Warlock: {
        name: "Otherworldly Patron",
        level: 3,
        options: {
            Fiend: {
                name: "The Fiend",
                description: "You have made a pact with a fiend from the lower planes of existence.",
                features: {
                    3: { name: "Dark One's Blessing", description: "When you reduce a hostile creature to 0 HP, gain temp HP equal to CHA mod + warlock level." },
                    7: { name: "Dark One's Own Luck", description: "Add 1d10 to an ability check or saving throw. Once per short rest." },
                    15: { name: "Hurl Through Hell", description: "When you hit, banish the creature through the lower planes. It takes 10d10 psychic damage." }
                }
            },
            GreatOldOne: {
                name: "The Great Old One",
                description: "Your patron is a mysterious entity from beyond the stars.",
                features: {
                    3: { name: "Awakened Mind", description: "Communicate telepathically with any creature within 30ft that you can see." },
                    7: { name: "Entropic Ward", description: "When attacked, impose disadvantage. If the attack misses, gain advantage on your next attack." },
                    15: { name: "Create Thrall", description: "Touch an incapacitated humanoid to charm it permanently until Remove Curse is cast." }
                }
            }
        }
    },
    Bard: {
        name: "Bard College",
        level: 3,
        options: {
            Lore: {
                name: "College of Lore",
                description: "Bards who know something about most things, collecting knowledge from every source.",
                features: {
                    3: { name: "Cutting Words", description: "Use Bardic Inspiration to subtract from an enemy's attack roll, ability check, or damage roll." },
                    7: { name: "Additional Magical Secrets", description: "Learn two spells from any class." },
                    15: { name: "Peerless Skill", description: "Expend a Bardic Inspiration die to add it to your own ability checks." }
                }
            },
            Valor: {
                name: "College of Valor",
                description: "Bards who are bold skalds whose tales keep alive the memory of great heroes.",
                features: {
                    3: { name: "Combat Inspiration", description: "Bardic Inspiration die can be added to weapon damage or AC when hit." },
                    7: { name: "Extra Attack", description: "You can attack twice when you take the Attack action." },
                    15: { name: "Battle Magic", description: "When you cast a spell, make one weapon attack as a bonus action." }
                }
            }
        }
    },
    Sorcerer: {
        name: "Sorcerous Origin",
        level: 3,
        options: {
            Draconic: {
                name: "Draconic Bloodline",
                description: "Your innate magic comes from draconic ancestry mixed with your bloodline.",
                features: {
                    3: { name: "Draconic Resilience", description: "+1 HP per sorcerer level. When unarmored, AC = 13 + DEX modifier." },
                    7: { name: "Elemental Affinity", description: "Add CHA modifier to damage of spells matching your draconic ancestry element." },
                    15: { name: "Dragon Wings", description: "Sprout spectral dragon wings, gaining a flying speed equal to your walking speed." }
                }
            },
            Wild: {
                name: "Wild Magic",
                description: "Your innate magic comes from the wild forces of chaos underlying creation.",
                features: {
                    3: { name: "Wild Magic Surge", description: "After casting a spell, roll d20. On a 1, roll on the Wild Magic Surge table for a random effect." },
                    7: { name: "Bend Luck", description: "Spend 2 sorcery points to add or subtract 1d4 from another creature's attack, check, or save." },
                    15: { name: "Controlled Chaos", description: "Roll twice on the Wild Magic Surge table and choose which effect occurs." }
                }
            }
        }
    },
    Druid: {
        name: "Druid Circle",
        level: 3,
        options: {
            Land: {
                name: "Circle of the Land",
                description: "Druids who are mystic guardians of an area of land they are spiritually connected to.",
                features: {
                    3: { name: "Natural Recovery", description: "During a short rest, recover spell slots with combined level ≤ half your druid level (rounded up)." },
                    7: { name: "Land's Stride", description: "Moving through nonmagical difficult terrain costs no extra movement. Advantage vs plant-based effects." },
                    15: { name: "Nature's Sanctuary", description: "Beasts and plant creatures must WIS save to attack you. On failure, they must choose a new target." }
                }
            },
            Moon: {
                name: "Circle of the Moon",
                description: "Druids who are fierce guardians of the wild, drawing power from the moon.",
                features: {
                    3: { name: "Combat Wild Shape", description: "Use Wild Shape as a bonus action. Can transform into beasts of CR 1 (instead of CR 1/4)." },
                    7: { name: "Primal Strike", description: "Your attacks in beast form count as magical for overcoming resistance and immunity." },
                    15: { name: "Elemental Wild Shape", description: "Expend two Wild Shape uses to transform into an elemental." }
                }
            }
        }
    },
    Artificer: {
        name: "Artificer Specialist",
        level: 3,
        options: {
            Alchemist: {
                name: "Alchemist",
                description: "An expert at combining reagents to produce mystical effects.",
                features: {
                    3: { name: "Experimental Elixir", description: "Create a free elixir on long rest (random beneficial effect: healing, flight, resilience, boldness, swiftness, or transformation)." },
                    7: { name: "Alchemical Savant", description: "Add INT modifier to healing and damage spells when using alchemist supplies." },
                    15: { name: "Chemical Mastery", description: "Resistance to acid and poison. Cast Greater Restoration and Heal once each per long rest without a spell slot." }
                }
            },
            BattleSmith: {
                name: "Battle Smith",
                description: "A master of defending others and repairing items and constructs.",
                features: {
                    3: { name: "Steel Defender", description: "Gain a construct companion that fights alongside you. Uses your bonus action to command." },
                    7: { name: "Arcane Jolt", description: "When you or your defender hit, add 2d6 force damage or 2d6 healing to an ally within 30ft." },
                    15: { name: "Improved Defender", description: "Steel Defender gains +2 AC and Arcane Jolt increases to 4d6." }
                }
            }
        }
    }
};

// ==================== KEYBOARD SHORTCUTS ====================
const KEYBOARD_SHORTCUTS = {
    '1': 'action1',
    '2': 'action2',
    '3': 'action3',
    '4': 'action4',
    '5': 'action5',
    'a': 'attack',
    's': 'spell',
    'd': 'defend',
    'b': 'bonusAction',
    'r': 'retreat_or_rest',
    'i': 'inventory',
    'c': 'character',
    't': 'travel',
    'Escape': 'closeModal',
    ' ': 'continue'
};

// ==================== CRAFTING RECIPES (discoverable) ====================
const DISCOVERABLE_RECIPES = {
    "Flaming Sword": { ingredients: ["Longsword", "Fire Essence", "Ruby"], result: "Flaming Sword", description: "+1d6 fire damage" },
    "Frost Bow": { ingredients: ["Longbow", "Ice Crystal", "Sapphire"], result: "Frost Bow", description: "+1d6 cold damage" },
    "Cloak of Shadows": { ingredients: ["Fine Cloak", "Shadow Essence", "Onyx"], result: "Cloak of Shadows", description: "+2 to Stealth" },
    "Boots of Speed": { ingredients: ["Leather Boots", "Quicksilver", "Emerald"], result: "Boots of Speed", description: "Double movement" },
    "Ring of Protection": { ingredients: ["Gold Ring", "Diamond Dust", "Holy Water"], result: "Ring of Protection", description: "+1 AC" },
    "Potion of Giant Strength": { ingredients: ["Health Potion", "Giant's Toe", "Bear Fur"], result: "Potion of Giant Strength", description: "STR becomes 21 for 1 hour" }
};

// ==================== SOUND & MUSIC SYSTEM ====================

// Sound effect URLs (using Web Audio API for generated sounds)
class SoundManager {
    constructor() {
        this.enabled = SOUND_ENABLED;
        this.volume = SOUND_VOLUME;
        this.audioContext = null;
    }

    init() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
    }

    playDiceRoll() {
        if (!this.enabled) return;
        this.init();
        // Generate dice roll sound
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        oscillator.frequency.setValueAtTime(200, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(100, this.audioContext.currentTime + 0.2);
        gainNode.gain.setValueAtTime(this.volume * 0.3, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.3);
    }

    playDiceSpinning() {
        if (!this.enabled) return;
        this.init();
        // Generate a spinning dice sound - rapid wobbling effect with chirps
        for (let i = 0; i < 4; i++) {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            osc.connect(gain);
            gain.connect(this.audioContext.destination);
            osc.type = 'triangle';
            // Frequencies that create a spinning/wobbling effect
            osc.frequency.setValueAtTime(180 + i * 40, this.audioContext.currentTime + i * 0.08);
            osc.frequency.exponentialRampToValueAtTime(220 + i * 40, this.audioContext.currentTime + i * 0.08 + 0.15);
            gain.gain.setValueAtTime(this.volume * 0.25, this.audioContext.currentTime + i * 0.08);
            gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + i * 0.08 + 0.2);
            osc.start(this.audioContext.currentTime + i * 0.08);
            osc.stop(this.audioContext.currentTime + i * 0.08 + 0.2);
        }
    }

    playHit() {
        if (!this.enabled) return;
        this.init();
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(150, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(50, this.audioContext.currentTime + 0.15);
        gainNode.gain.setValueAtTime(this.volume * 0.4, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.15);
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.15);
    }

    playCritical() {
        if (!this.enabled) return;
        this.init();
        // Triumphant sound for crits
        [523, 659, 784].forEach((freq, i) => {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            osc.connect(gain);
            gain.connect(this.audioContext.destination);
            osc.frequency.value = freq;
            gain.gain.setValueAtTime(this.volume * 0.2, this.audioContext.currentTime + i * 0.1);
            gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + i * 0.1 + 0.3);
            osc.start(this.audioContext.currentTime + i * 0.1);
            osc.stop(this.audioContext.currentTime + i * 0.1 + 0.3);
        });
    }

    playMiss() {
        if (!this.enabled) return;
        this.init();
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        osc.connect(gain);
        gain.connect(this.audioContext.destination);
        osc.frequency.setValueAtTime(300, this.audioContext.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, this.audioContext.currentTime + 0.2);
        gain.gain.setValueAtTime(this.volume * 0.2, this.audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);
        osc.start(this.audioContext.currentTime);
        osc.stop(this.audioContext.currentTime + 0.2);
    }

    playMagic() {
        if (!this.enabled) return;
        this.init();
        // Magical shimmer sound
        for (let i = 0; i < 5; i++) {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            osc.connect(gain);
            gain.connect(this.audioContext.destination);
            osc.frequency.value = 400 + Math.random() * 800;
            gain.gain.setValueAtTime(this.volume * 0.1, this.audioContext.currentTime + i * 0.05);
            gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + i * 0.05 + 0.2);
            osc.start(this.audioContext.currentTime + i * 0.05);
            osc.stop(this.audioContext.currentTime + i * 0.05 + 0.2);
        }
    }

    playDeath() {
        if (!this.enabled) return;
        this.init();
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        osc.connect(gain);
        gain.connect(this.audioContext.destination);
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, this.audioContext.currentTime);
        osc.frequency.exponentialRampToValueAtTime(30, this.audioContext.currentTime + 0.5);
        gain.gain.setValueAtTime(this.volume * 0.3, this.audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);
        osc.start(this.audioContext.currentTime);
        osc.stop(this.audioContext.currentTime + 0.5);
    }

    playLevelUp() {
        if (!this.enabled) return;
        this.init();
        const notes = [262, 330, 392, 523, 659, 784];
        notes.forEach((freq, i) => {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            osc.connect(gain);
            gain.connect(this.audioContext.destination);
            osc.frequency.value = freq;
            gain.gain.setValueAtTime(this.volume * 0.15, this.audioContext.currentTime + i * 0.08);
            gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + i * 0.08 + 0.3);
            osc.start(this.audioContext.currentTime + i * 0.08);
            osc.stop(this.audioContext.currentTime + i * 0.08 + 0.3);
        });
    }

    playGold() {
        if (!this.enabled) return;
        this.init();
        for (let i = 0; i < 3; i++) {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            osc.connect(gain);
            gain.connect(this.audioContext.destination);
            osc.frequency.value = 800 + i * 200;
            gain.gain.setValueAtTime(this.volume * 0.1, this.audioContext.currentTime + i * 0.05);
            gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + i * 0.05 + 0.1);
            osc.start(this.audioContext.currentTime + i * 0.05);
            osc.stop(this.audioContext.currentTime + i * 0.05 + 0.1);
        }
    }

    // New sound effects
    playFootsteps() {
        if (!this.enabled) return;
        this.init();
        for (let i = 0; i < 4; i++) {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            osc.connect(gain);
            gain.connect(this.audioContext.destination);
            osc.type = 'triangle';
            osc.frequency.value = 80 + Math.random() * 40;
            gain.gain.setValueAtTime(this.volume * 0.15, this.audioContext.currentTime + i * 0.25);
            gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + i * 0.25 + 0.1);
            osc.start(this.audioContext.currentTime + i * 0.25);
            osc.stop(this.audioContext.currentTime + i * 0.25 + 0.1);
        }
    }

    playDoorOpen() {
        if (!this.enabled) return;
        this.init();
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        osc.connect(gain);
        gain.connect(this.audioContext.destination);
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(100, this.audioContext.currentTime);
        osc.frequency.linearRampToValueAtTime(50, this.audioContext.currentTime + 0.3);
        gain.gain.setValueAtTime(this.volume * 0.2, this.audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
        osc.start(this.audioContext.currentTime);
        osc.stop(this.audioContext.currentTime + 0.3);
    }

    playAchievement() {
        if (!this.enabled) return;
        this.init();
        const notes = [523, 659, 784, 1047];
        notes.forEach((freq, i) => {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            osc.connect(gain);
            gain.connect(this.audioContext.destination);
            osc.type = 'sine';
            osc.frequency.value = freq;
            gain.gain.setValueAtTime(this.volume * 0.2, this.audioContext.currentTime + i * 0.15);
            gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + i * 0.15 + 0.4);
            osc.start(this.audioContext.currentTime + i * 0.15);
            osc.stop(this.audioContext.currentTime + i * 0.15 + 0.4);
        });
    }

    playPoison() {
        if (!this.enabled) return;
        this.init();
        for (let i = 0; i < 3; i++) {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            osc.connect(gain);
            gain.connect(this.audioContext.destination);
            osc.type = 'sine';
            osc.frequency.value = 200 - i * 30;
            gain.gain.setValueAtTime(this.volume * 0.15, this.audioContext.currentTime + i * 0.1);
            gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + i * 0.1 + 0.2);
            osc.start(this.audioContext.currentTime + i * 0.1);
            osc.stop(this.audioContext.currentTime + i * 0.1 + 0.2);
        }
    }

    playHeal() {
        if (!this.enabled) return;
        this.init();
        const notes = [392, 494, 587, 784];
        notes.forEach((freq, i) => {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            osc.connect(gain);
            gain.connect(this.audioContext.destination);
            osc.type = 'sine';
            osc.frequency.value = freq;
            gain.gain.setValueAtTime(this.volume * 0.12, this.audioContext.currentTime + i * 0.1);
            gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + i * 0.1 + 0.25);
            osc.start(this.audioContext.currentTime + i * 0.1);
            osc.stop(this.audioContext.currentTime + i * 0.1 + 0.25);
        });
    }

    playBossAppear() {
        if (!this.enabled) return;
        this.init();
        // Ominous deep tones
        const notes = [110, 82, 65, 55];
        notes.forEach((freq, i) => {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            osc.connect(gain);
            gain.connect(this.audioContext.destination);
            osc.type = 'sawtooth';
            osc.frequency.value = freq;
            gain.gain.setValueAtTime(this.volume * 0.25, this.audioContext.currentTime + i * 0.3);
            gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + i * 0.3 + 0.5);
            osc.start(this.audioContext.currentTime + i * 0.3);
            osc.stop(this.audioContext.currentTime + i * 0.3 + 0.5);
        });
    }

    playRetreat() {
        if (!this.enabled) return;
        this.init();
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        osc.connect(gain);
        gain.connect(this.audioContext.destination);
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(400, this.audioContext.currentTime);
        osc.frequency.linearRampToValueAtTime(200, this.audioContext.currentTime + 0.3);
        gain.gain.setValueAtTime(this.volume * 0.2, this.audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
        osc.start(this.audioContext.currentTime);
        osc.stop(this.audioContext.currentTime + 0.3);
    }
}

// ==================== BACKGROUND MUSIC SYSTEM ====================
class MusicManager {
    constructor() {
        this.enabled = true;
        this.volume = MUSIC_VOLUME;
        this.audioContext = null;
        this.currentTrack = null;
        this.isPlaying = false;
        this.oscillators = [];
        
        // Ambient soundscapes
        this.ambientAudio = null;
        this.ambientEnabled = false;
        this.ambientVolume = 0.3;
        this.loadAmbientSettings();
    }

    init() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
    }
    
    loadAmbientSettings() {
        const settings = localStorage.getItem('ambientSettings');
        if (settings) {
            const parsed = JSON.parse(settings);
            this.ambientEnabled = parsed.enabled ?? false;
            this.ambientVolume = parsed.volume ?? 0.3;
        }
    }
    
    saveAmbientSettings() {
        localStorage.setItem('ambientSettings', JSON.stringify({
            enabled: this.ambientEnabled,
            volume: this.ambientVolume
        }));
    }
    
    setAmbientEnabled(enabled) {
        this.ambientEnabled = enabled;
        this.saveAmbientSettings();
        if (!enabled) {
            this.stopAmbient();
        }
    }
    
    setAmbientVolume(volume) {
        this.ambientVolume = Math.max(0, Math.min(1, volume));
        if (this.ambientAudio) {
            this.ambientAudio.volume = this.ambientVolume;
        }
        this.saveAmbientSettings();
    }
    
    playAmbientForLocation(location) {
        if (!this.ambientEnabled) return;
        
        const locationName = location.name.toLowerCase();
        const locationType = location.type ? location.type.toLowerCase() : '';
        let soundFile = null;
        
        // Check location name first for specific matches
        if (locationName.includes('tavern') || locationName.includes('inn')) {
            soundFile = 'public/sounds/tavern-fire.mp3';
        } else if (locationName.includes('cave') || locationName.includes('crypt') || locationName.includes('cavern')) {
            soundFile = 'public/sounds/cave-ambience.mp3';
        } else if (locationName.includes('forest') || locationName.includes('jungle') || locationName.includes('wood')) {
            soundFile = 'public/sounds/forest-wind.mp3';
        } else if (locationName.includes('dungeon') || locationName.includes('lair')) {
            soundFile = 'public/sounds/dungeon-drips.mp3';
        } else if (locationName.includes('town') || locationName.includes('village') || locationName.includes('city')) {
            soundFile = 'public/sounds/town-square.mp3';
        }
        
        // If no name match, check location type
        if (!soundFile) {
            const soundscapeMap = {
                'town': 'public/sounds/town-square.mp3',
                'dungeon': 'public/sounds/dungeon-drips.mp3',
                'wilderness': 'public/sounds/forest-wind.mp3'
            };
            soundFile = soundscapeMap[locationType];
        }
        
        // Default to town square if nothing matched
        if (!soundFile) {
            soundFile = 'public/sounds/town-square.mp3';
        }
        
        console.log(`🎵 Playing ambient sound for "${location.name}" (type: ${locationType}): ${soundFile.split('/').pop()}`);
        
        // Check if we're already playing this sound
        if (this.ambientAudio && this.ambientAudio.src.includes(soundFile.split('/').pop())) {
            return; // Already playing the right sound
        }
        
        this.stopAmbient();
        
        this.ambientAudio = new Audio(soundFile);
        this.ambientAudio.loop = true;
        this.ambientAudio.volume = this.ambientVolume;
        this.ambientAudio.play().catch(err => {
            console.warn('Ambient audio playback failed:', err);
        });
    }
    
    stopAmbient() {
        if (this.ambientAudio) {
            this.ambientAudio.pause();
            this.ambientAudio.currentTime = 0;
            this.ambientAudio = null;
        }
    }

    stop() {
        this.oscillators.forEach(osc => {
            try { osc.stop(); } catch(e) {}
        });
        this.oscillators = [];
        this.isPlaying = false;
        this.stopAmbient();
    }

    // Ambient music using procedural generation
    playAmbient(type = 'town') {
        if (!this.enabled) return;
        this.stop();
        this.init();
        this.isPlaying = true;

        const themes = {
            town: { baseFreq: 220, tempo: 800, notes: [0, 4, 7, 12, 7, 4], mood: 'major' },
            dungeon: { baseFreq: 110, tempo: 1200, notes: [0, 3, 7, 10, 7, 3], mood: 'minor' },
            combat: { baseFreq: 165, tempo: 400, notes: [0, 3, 5, 7, 5, 3], mood: 'minor' },
            forest: { baseFreq: 196, tempo: 1000, notes: [0, 5, 7, 12, 7, 5], mood: 'major' },
            boss: { baseFreq: 82, tempo: 600, notes: [0, 3, 6, 7, 6, 3], mood: 'diminished' }
        };

        const theme = themes[type] || themes.town;
        this.playMusicLoop(theme);
    }

    playMusicLoop(theme) {
        if (!this.isPlaying || !this.enabled) return;

        const { baseFreq, tempo, notes } = theme;
        
        notes.forEach((semitone, i) => {
            const freq = baseFreq * Math.pow(2, semitone / 12);
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            
            osc.connect(gain);
            gain.connect(this.audioContext.destination);
            osc.type = 'sine';
            osc.frequency.value = freq;
            
            const startTime = this.audioContext.currentTime + (i * tempo / 1000);
            gain.gain.setValueAtTime(0, startTime);
            gain.gain.linearRampToValueAtTime(this.volume * 0.08, startTime + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.001, startTime + (tempo / 1000) * 0.9);
            
            osc.start(startTime);
            osc.stop(startTime + (tempo / 1000));
            this.oscillators.push(osc);
        });

        // Loop
        setTimeout(() => {
            if (this.isPlaying) {
                this.oscillators = [];
                this.playMusicLoop(theme);
            }
        }, tempo * notes.length);
    }

    setVolume(vol) {
        this.volume = vol;
    }

    toggle() {
        this.enabled = !this.enabled;
        if (!this.enabled) this.stop();
        return this.enabled;
    }
}

const soundManager = new SoundManager();
const musicManager = new MusicManager();

// Dice Animation System
class DiceAnimator {
    constructor() {
        this.container = null;
    }

    createContainer() {
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.id = 'diceAnimationContainer';
            this.container.className = 'dice-animation-container';
            document.body.appendChild(this.container);
        }
        return this.container;
    }

    async rollD20(finalValue, label = "") {
        return new Promise(resolve => {
            soundManager.playDiceSpinning();
            const container = this.createContainer();
            container.innerHTML = '';
            container.classList.add('active');

            const dice = document.createElement('div');
            dice.className = 'dice d20 rolling';
            dice.innerHTML = `<span class="dice-value">?</span>`;
            container.appendChild(dice);

            if (label) {
                const labelEl = document.createElement('div');
                labelEl.className = 'dice-label';
                labelEl.textContent = label;
                container.appendChild(labelEl);
            }

            // Animate through random numbers with faster updates during spin
            let count = 0;
            const animInterval = setInterval(() => {
                dice.querySelector('.dice-value').textContent = Math.floor(Math.random() * 20) + 1;
                count++;
                if (count > 15) {
                    clearInterval(animInterval);
                    dice.classList.remove('rolling');
                    dice.querySelector('.dice-value').textContent = finalValue;
                    
                    // Add result class
                    if (finalValue === 20) {
                        dice.classList.add('critical');
                        soundManager.playCritical();
                    } else if (finalValue === 1) {
                        dice.classList.add('fumble');
                    }

                    setTimeout(() => {
                        container.classList.remove('active');
                        resolve(finalValue);
                    }, 1200);
                }
            }, 50);
        });
    }

    async rollMultiple(dice1, dice2, finalValue, advType) {
        return new Promise(resolve => {
            soundManager.playDiceSpinning();
            const container = this.createContainer();
            container.innerHTML = '';
            container.classList.add('active');

            const diceWrapper = document.createElement('div');
            diceWrapper.className = 'dice-wrapper';

            const d1 = document.createElement('div');
            d1.className = 'dice d20 rolling';
            d1.innerHTML = `<span class="dice-value">?</span>`;

            const d2 = document.createElement('div');
            d2.className = 'dice d20 rolling';
            d2.innerHTML = `<span class="dice-value">?</span>`;

            diceWrapper.appendChild(d1);
            diceWrapper.appendChild(d2);
            container.appendChild(diceWrapper);

            const label = document.createElement('div');
            label.className = `dice-label ${advType}`;
            label.textContent = advType === 'advantage' ? '📈 ADVANTAGE' : '📉 DISADVANTAGE';
            container.appendChild(label);

            let count = 0;
            const animInterval = setInterval(() => {
                d1.querySelector('.dice-value').textContent = Math.floor(Math.random() * 20) + 1;
                d2.querySelector('.dice-value').textContent = Math.floor(Math.random() * 20) + 1;
                count++;
                if (count > 15) {
                    clearInterval(animInterval);
                    d1.classList.remove('rolling');
                    d2.classList.remove('rolling');
                    d1.querySelector('.dice-value').textContent = dice1;
                    d2.querySelector('.dice-value').textContent = dice2;

                    // Highlight the chosen die
                    if (advType === 'advantage') {
                        (dice1 >= dice2 ? d1 : d2).classList.add('chosen');
                        (dice1 < dice2 ? d1 : d2).classList.add('not-chosen');
                    } else {
                        (dice1 <= dice2 ? d1 : d2).classList.add('chosen');
                        (dice1 > dice2 ? d1 : d2).classList.add('not-chosen');
                    }

                    if (finalValue === 20) {
                        soundManager.playCritical();
                    }

                    setTimeout(() => {
                        container.classList.remove('active');
                        resolve(finalValue);
                    }, 1300);
                }
            }, 50);
        });
    }

    hide() {
        if (this.container) {
            this.container.classList.remove('active');
            this.container.innerHTML = '';
        }
    }
}

const diceAnimator = new DiceAnimator();

// ==================== DRAMATIC NARRATION SYSTEM ====================
const DRAMATIC_DESCRIPTIONS = {
    criticalHit: [
        "With supernatural precision, your blow finds its mark!",
        "Time seems to slow as your weapon arcs through the air, striking true!",
        "The Fates themselves guide your hand in this moment!",
        "A perfect strike! Your enemy reels from the devastating blow!",
        "Your attack is a thing of deadly beauty, striking with unerring accuracy!"
    ],
    fumble: [
        "Your weapon seems to have a mind of its own... and it's not a clever one.",
        "In a moment of terrible misfortune, everything goes wrong.",
        "The gods of war look away in embarrassment.",
        "A spectacular failure that will haunt your dreams.",
        "Your attack goes so wrong, bards will sing of this... as a cautionary tale."
    ],
    kill: [
        "With a final, desperate cry, your foe crumples to the ground.",
        "The light fades from your enemy's eyes as they fall.",
        "Victory! Your opponent is vanquished!",
        "The creature's threat ends with your decisive blow.",
        "Your enemy falls, never to rise again."
    ],
    nearDeath: [
        "Your vision blurs... is this the end?",
        "The cold embrace of death reaches for you...",
        "You teeter on the edge of oblivion.",
        "Everything grows dark... but a spark of life remains.",
        "Pain overwhelms you as consciousness slips away..."
    ],
    victory: [
        "The battle is won! You stand triumphant!",
        "Against all odds, you have prevailed!",
        "Your enemies lie defeated before you!",
        "Glory! The day is yours!",
        "The sweet taste of victory fills your soul!"
    ]
};

function getDramaticText(type) {
    const texts = DRAMATIC_DESCRIPTIONS[type];
    return texts ? texts[Math.floor(Math.random() * texts.length)] : "";
}

// NPC Voice/Personality System
const NPC_SPEECH_PATTERNS = {
    noble: { prefix: "*speaks formally*", style: "formal", quirk: "indeed" },
    commoner: { prefix: "", style: "casual", quirk: "y'know" },
    mysterious: { prefix: "*speaks in hushed tones*", style: "cryptic", quirk: "perhaps" },
    gruff: { prefix: "*grunts*", style: "terse", quirk: "hmph" },
    cheerful: { prefix: "*smiles warmly*", style: "friendly", quirk: "friend" },
    sinister: { prefix: "*sneers*", style: "menacing", quirk: "fool" }
};

// Campaign Data - Multiple Campaigns Support
// Save Management System
const SAVE_PREFIX = "dndSave_";
const MAX_SAVES = 5;

function getSaveSlots() {
    const saves = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith(SAVE_PREFIX)) {
            try {
                const data = JSON.parse(localStorage.getItem(key));
                saves.push({ key, data });
            } catch (e) {
                console.error("Invalid save data:", key);
            }
        }
    }
    // Sort by save time, newest first
    return saves.sort((a, b) => (b.data.saveTime || 0) - (a.data.saveTime || 0));
}

function deleteSave(key) {
    localStorage.removeItem(key);
}

function generateSaveKey() {
    return SAVE_PREFIX + Date.now();
}

const CAMPAIGNS = {
    "keep_on_borderlands": {
        id: "keep_on_borderlands",
        name: "Keep on the Borderlands",
        icon: "🏰",
        coverArt: "images/keep_on_borderlands.jpg",
        description: "★ Recommended Start! A classic beginner adventure! Defend the Keep on the Borderlands and explore the infamous Caves of Chaos. Perfect for new adventurers learning the ways of dungeon delving.",
        setting: "The Borderlands",
        level: "1-3",
        chapters: [
            { id: 0, name: "Prologue: Arrival at the Keep", description: "You are a fledgling adventurer seeking fame and fortune. The Keep on the Borderlands offers shelter and opportunity for those brave enough to face the wilderness beyond.", objective: "Arrive at the Keep and find lodging" },
            { id: 1, name: "Chapter 1: The Keep", description: "The Keep is a bastion of civilization on the edge of the wild. Meet the inhabitants, gather supplies, and learn of the dangers lurking in the Caves of Chaos.", objective: "Explore the Keep and gather information" },
            { id: 2, name: "Chapter 2: The Wilderness", description: "Between the Keep and the Caves of Chaos lies dangerous wilderness. Bandits, wild beasts, and worse prey on the unwary.", objective: "Navigate the wilderness and find the Caves" },
            { id: 3, name: "Chapter 3: Caves of Chaos - Outer Caves", description: "The Caves of Chaos are a ravine filled with monster lairs. Goblins, orcs, and kobolds vie for territory in the outer caves.", objective: "Clear the outer caves of monsters" },
            { id: 4, name: "Chapter 4: Caves of Chaos - Inner Caves", description: "Deeper in the ravine, more dangerous creatures lurk. Hobgoblins, gnolls, and bugbears have made their homes here.", objective: "Venture deeper into the caves" },
            { id: 5, name: "Chapter 5: The Temple of Evil Chaos", description: "At the heart of the ravine lies a hidden temple where evil priests conduct dark rituals. They are the true masterminds behind the monster alliance!", objective: "Destroy the Temple of Evil Chaos" },
            { id: 6, name: "Epilogue: Heroes of the Borderlands", description: "With the Temple destroyed and the Caves cleared, peace returns to the Borderlands. You are celebrated as heroes!", objective: "Return to the Keep as heroes" }
        ],
        npcs: {
            "Castellan": { name: "The Castellan", role: "Keep Commander", description: "The lord of the Keep, a stern but fair knight dedicated to protecting the frontier.", dialogue: ["Welcome to the Keep, traveler. We can always use brave souls to defend the Borderlands.", "The Caves of Chaos have grown more dangerous. The monsters there grow bolder each day.", "Clear those caves, and you'll earn the gratitude of everyone in the Keep - and a fair reward."] },
            "Corporal": { name: "Corporal of the Watch", role: "Guard Captain", description: "The leader of the Keep's guards, a veteran soldier with many scars.", dialogue: ["Keep your weapons sheathed inside the walls. We don't tolerate troublemakers.", "If you're heading to the Caves, travel in daylight. The roads aren't safe after dark.", "Report any monster sightings to me. We track their movements."] },
            "Priest": { name: "Abercrombie the Priest", role: "Temple Curate", description: "The kindly priest who tends the small chapel in the Keep.", dialogue: ["Blessings upon you, child. May the light guide your path.", "I can heal your wounds, though a small donation to the temple is customary.", "Beware the darkness in those caves. I sense a great evil lurking within."] },
            "Merchant": { name: "Olaf the Trader", role: "General Store Owner", description: "A jovial merchant who sells adventuring supplies at 'reasonable' prices.", dialogue: ["Welcome, welcome! Olaf has everything an adventurer needs!", "Torches, rope, iron spikes - don't enter those caves without proper supplies!", "I'll buy any treasures you bring back. Fair prices for fair goods, I always say!"] },
            "Innkeeper": { name: "Wilf the Innkeeper", role: "Tavern Owner", description: "The portly owner of the Green Man Inn, always eager for news and gossip.", dialogue: ["A room and hot meal? Five silver pieces a night, adventurer.", "The regulars have been talking about strange lights in the caves at night.", "Watch out for that mad hermit in the wilderness. He's not right in the head."] },
            "EvilPriest": { name: "The High Priest of Chaos", role: "Cult Leader", description: "The sinister leader of the Temple of Evil Chaos, he commands the monsters through dark pacts.", dialogue: ["Fools! You dare intrude upon the Temple of Chaos?", "The dark gods will feast upon your souls!", "The alliance of evil cannot be stopped! Even if I fall, others will rise!"], boss: true }
        },
        locations: [
            { name: "Road to the Keep", type: "wilderness", danger: 1, icon: "🛤️", chapter: 0, description: "The dusty road leading to the Keep. Relatively safe, but stay alert." },
            { name: "Keep Gates", type: "town", danger: 0, icon: "🚪", chapter: 0, description: "The main entrance to the Keep, guarded day and night." },
            { name: "Keep - Outer Bailey", type: "town", danger: 0, icon: "🏢️", chapter: 1, description: "The common area of the Keep with shops, tavern, and chapel." },
            { name: "Green Man Inn", type: "town", danger: 0, icon: "🍺", chapter: 1, description: "The Keep's only tavern. Good food, warm beds, and plenty of rumors." },
            { name: "Trader's Shop", type: "town", danger: 0, icon: "🏺", chapter: 1, description: "Olaf's general store, selling everything an adventurer might need." },
            { name: "Chapel of Light", type: "town", danger: 0, icon: "⛪", chapter: 1, description: "A small chapel where weary adventurers can find healing." },
            { name: "Keep - Inner Bailey", type: "town", danger: 0, icon: "🏰", chapter: 1, description: "The fortified heart of the Keep where the Castellan resides." },
            { name: "Bank & Jeweler", type: "town", danger: 0, icon: "💎", chapter: 1, description: "A secure place to store valuables and exchange gems for gold." },
            { name: "The Wilderness", type: "wilderness", danger: 2, icon: "🌲", chapter: 2, description: "Dense forest and rocky terrain between the Keep and the Caves." },
            { name: "Hermit's Cave", type: "wilderness", danger: 2, icon: "🏐️", chapter: 2, description: "A cave where a mad hermit dwells. Is he friend or foe?" },
            { name: "Spider Woods", type: "wilderness", danger: 2, icon: "🕷️", chapter: 2, description: "A stretch of forest infested with giant spiders." },
            { name: "Lizardfolk Lair", type: "wilderness", danger: 2, icon: "🦎", chapter: 2, description: "A swampy area near a stream where lizardfolk make their home." },
            { name: "Caves of Chaos - Entrance", type: "wilderness", danger: 2, icon: "🏔️", chapter: 3, description: "The ravine opens before you, dark cave mouths dotting the cliffs." },
            { name: "Kobold Caves", type: "dungeon", danger: 1, icon: "🐀", chapter: 3, description: "Small caves inhabited by cunning kobolds. Watch for traps!" },
            { name: "Goblin Caves", type: "dungeon", danger: 2, icon: "👺", chapter: 3, description: "A network of caves where goblins and their chief reside." },
            { name: "Orc Caves", type: "dungeon", danger: 2, icon: "👹", chapter: 3, description: "Two orc tribes lair here, constantly feuding with each other." },
            { name: "Hobgoblin Caves", type: "dungeon", danger: 3, icon: "⚔️", chapter: 4, description: "Well-organized caves inhabited by disciplined hobgoblin warriors." },
            { name: "Gnoll Caves", type: "dungeon", danger: 3, icon: "🐺", chapter: 4, description: "The caves of savage hyena-headed gnolls." },
            { name: "Bugbear Caves", type: "dungeon", danger: 3, icon: "🐻", chapter: 4, description: "Large caves where brutish bugbears lurk in the shadows." },
            { name: "Minotaur Lair", type: "dungeon", danger: 4, icon: "🐂", chapter: 4, description: "A twisting maze of tunnels where a fearsome minotaur dwells." },
            { name: "Temple of Evil Chaos", type: "dungeon", danger: 4, icon: "💀", chapter: 5, description: "The hidden temple where evil priests orchestrate the monster alliance." },
            { name: "Inner Sanctum", type: "dungeon", danger: 5, icon: "🔮", chapter: 5, description: "The heart of the temple where the High Priest conducts dark rituals." }
        ],
        monsters: {
            1: [
                { name: "Kobold", hp: 5, ac: 12, damage: "1d4", xp: 25, attackBonus: 4, damageType: "slashing", description: "A small, reptilian humanoid. Weak alone, dangerous in groups." },
                { name: "Giant Rat", hp: 7, ac: 12, damage: "1d4", xp: 25, attackBonus: 2, damageType: "piercing", description: "An oversized rodent with diseased fangs." },
                { name: "Goblin", hp: 7, ac: 13, damage: "1d6", xp: 50, attackBonus: 4, damageType: "slashing", description: "A small, malicious humanoid with a wicked grin." },
                { name: "Stirge", hp: 2, ac: 14, damage: "1d4", xp: 25, attackBonus: 5, damageType: "piercing", description: "A bat-like creature that drinks blood!" }
            ],
            2: [
                { name: "Orc", hp: 15, ac: 13, damage: "1d8", xp: 100, attackBonus: 5, damageType: "slashing", description: "A brutish humanoid with a thirst for battle." },
                { name: "Hobgoblin", hp: 11, ac: 16, damage: "1d8", xp: 100, attackBonus: 3, damageType: "slashing", description: "A disciplined goblinoid warrior in chain mail." },
                { name: "Giant Spider", hp: 18, ac: 13, damage: "1d8", xp: 200, attackBonus: 5, damageType: "piercing", saveDC: 11, specialAbilities: [{ name: "Poison Bite", type: "poison", triggerChance: 0.3, damage: "2d8", damageType: "poison", dc: 11 }], description: "A horse-sized spider with venomous fangs!" },
                { name: "Zombie", hp: 22, ac: 8, damage: "1d6", xp: 50, attackBonus: 3, damageType: "bludgeoning", immunities: ["poison"], resistances: ["necrotic"], description: "A shambling undead animated by dark magic." },
                { name: "Skeleton", hp: 13, ac: 13, damage: "1d6", xp: 50, attackBonus: 4, damageType: "slashing", immunities: ["poison"], vulnerabilities: ["bludgeoning"], description: "The animated bones of the dead, armed with rusty weapons." }
            ],
            3: [
                { name: "Gnoll", hp: 22, ac: 14, damage: "1d8", xp: 100, attackBonus: 4, damageType: "piercing", description: "A savage hyena-headed humanoid that cackles as it fights." },
                { name: "Bugbear", hp: 27, ac: 16, damage: "2d8", xp: 200, attackBonus: 4, damageType: "slashing", description: "A massive, hairy goblinoid that strikes from ambush." },
                { name: "Ogre", hp: 32, ac: 11, damage: "2d8", xp: 450, attackBonus: 6, damageType: "bludgeoning", description: "A towering brute with a very small brain and very big club." },
                { name: "Orc Chieftain", hp: 30, ac: 15, damage: "1d10", xp: 200, attackBonus: 5, damageType: "slashing", multiattack: 2, description: "The leader of an orc tribe, stronger than his followers." },
                { name: "Acolyte of Chaos", hp: 20, ac: 12, damage: "1d8", xp: 150, attackBonus: 4, damageType: "necrotic", saveDC: 13, specialAbilities: [{ name: "Dark Bolt", type: "poison", triggerChance: 0.3, damage: "2d6", damageType: "necrotic", dc: 13 }], description: "A lesser priest of the evil temple with dark magic." }
            ],
            4: [
                { name: "Minotaur", hp: 45, ac: 14, damage: "2d10", xp: 700, attackBonus: 6, damageType: "slashing", multiattack: 2, description: "A bull-headed monster that charges with its horns!", boss: true },
                { name: "Owlbear", hp: 38, ac: 13, damage: "2d8", xp: 700, attackBonus: 7, damageType: "slashing", multiattack: 2, description: "A terrifying hybrid of owl and bear with a vicious beak." },
                { name: "Troll", hp: 52, ac: 15, damage: "2d6", xp: 1800, attackBonus: 7, damageType: "slashing", multiattack: 3, vulnerabilities: ["fire", "acid"], specialAbilities: [{ name: "Regeneration", type: "heal", triggerChance: 0.5, healing: "1d10" }], description: "A regenerating horror. Fire and acid stop its healing!" },
                { name: "Hobgoblin Captain", hp: 35, ac: 17, damage: "2d8", xp: 450, attackBonus: 4, damageType: "slashing", multiattack: 2, description: "A veteran hobgoblin leader in gleaming armor." }
            ],
            5: [
                { name: "High Priest of Chaos", hp: 55, ac: 14, damage: "2d10", xp: 1100, attackBonus: 5, damageType: "necrotic", multiattack: 2, saveDC: 15, specialAbilities: [{ name: "Unholy Blight", type: "poison", triggerChance: 0.3, damage: "3d6", damageType: "necrotic", dc: 15 }], description: "The leader of the evil cult, wielding dark divine magic!", boss: true, legendaryResistances: 1 },
                { name: "Temple Guardian", hp: 40, ac: 18, damage: "2d8", xp: 700, attackBonus: 6, damageType: "slashing", multiattack: 2, immunities: ["poison"], resistances: ["necrotic"], description: "An undead warrior bound to protect the temple." },
                { name: "Shadow Demon", hp: 38, ac: 13, damage: "2d6", xp: 1100, attackBonus: 5, damageType: "psychic", resistances: ["cold", "fire", "lightning"], immunities: ["poison"], vulnerabilities: ["radiant"], description: "A demon of pure darkness summoned by the priests." }
            ]
        },
        events: {
            dungeon: [
                "Crude drawings on the cave walls show monsters fighting adventurers. The monsters are winning.",
                "You find gnawed bones scattered on the floor. Some look disturbingly human.",
                "The stench of unwashed monsters fills the air. You're not alone down here.",
                "Torchlight flickers ahead - another adventuring party, or something else?",
                "You discover a cache of supplies - some previous adventurer wasn't so lucky.",
                "Strange chanting echoes from somewhere deep within the caves.",
                "A crude alarm - bones hanging from strings - blocks the passage ahead."
            ],
            wilderness: [
                "You find merchant wagon tracks that veer suddenly off the road. Signs of a struggle.",
                "A raven caws from a dead tree. Local superstition says ravens guide the lost.",
                "You discover a shallow grave with a broken sword planted as a marker.",
                "Smoke rises in the distance - a campfire or a burning homestead?",
                "Animal tracks cross your path, but something larger has been following them.",
                "The forest grows quiet. Too quiet. Something has frightened the wildlife.",
                "You find a trail marker carved into a tree - other adventurers have been this way."
            ],
            town: [
                "Guards eye you suspiciously as you enter. 'No trouble, adventurer.'",
                "A merchant offers you a 'genuine treasure map' for only 50 gold pieces.",
                "You overhear travelers discussing the Caves of Chaos in hushed, fearful tones.",
                "A farmer seeks adventurers to deal with goblins raiding his homestead.",
                "The innkeeper warns you: 'Many go to those caves. Few return.'",
                "A veteran adventurer nursing his wounds advises: 'Bring more torches than you think you'll need.'",
                "Children gather around, asking if you're going to slay the monsters in the caves."
            ]
        }
    },
    "nights_dark_terror": {
        id: "nights_dark_terror",
        name: "Night's Dark Terror",
        icon: "🌙",
        coverArt: "images/nights_dark_terror.jpg",
        description: "A classic adventure in the Grand Duchy of Karameikos. Escort a horse trader home, only to find his family's homestead under siege by goblin wolf-riders!",
        setting: "Karameikos",
        level: "2-4",
        chapters: [
            { id: 0, name: "Prologue: Journey to Sukiskyn", description: "You have been hired by Stephan, a horse trader, to escort him to his family's homestead at Sukiskyn in the wilderness of Karameikos.", objective: "Travel to Sukiskyn homestead" },
            { id: 1, name: "Chapter 1: Siege of Sukiskyn", description: "Goblin wolf-riders have laid siege to the Sukiskyn homestead! The Sukiskyn family desperately needs your help to defend their home.", objective: "Defend Sukiskyn from the goblin attack" },
            { id: 2, name: "Chapter 2: The Kidnapping", description: "During the attack, Stephan's brother has been kidnapped by the goblins! Tracks lead into the Dymrak Forest.", objective: "Track the goblins and rescue the prisoners" },
            { id: 3, name: "Chapter 3: Xitaqa's Lair", description: "The trail leads to ancient ruins where a goblin king named Xitaqa has established his lair.", objective: "Infiltrate Xitaqa's lair and defeat him" },
            { id: 4, name: "Chapter 4: The Iron Ring", description: "You discover the goblins were working with the Iron Ring - a sinister slaving organization operating in Karameikos.", objective: "Investigate the Iron Ring's operations" },
            { id: 5, name: "Chapter 5: The Lost Valley", description: "Clues point to a hidden valley where the Iron Ring has a secret base and ancient Hutaakan ruins hold dark secrets.", objective: "Find the Lost Valley and stop the Iron Ring" },
            { id: 6, name: "Epilogue: Heroes of Karameikos", description: "With the Iron Ring defeated and the valley's secrets revealed, you have become legendary heroes of the Grand Duchy.", objective: "Celebrate your victory!" }
        ],
        npcs: {
            "Stephan": { name: "Stephan Sukiskyn", role: "Horse Trader (Quest Giver)", description: "A weathered horse trader who hired you to escort him home. He's worried about his family.", dialogue: ["Thank you for agreeing to help me reach Sukiskyn. The roads have become dangerous lately.", "My family's homestead has been breeding horses for generations. I fear something is wrong - I haven't heard from them in weeks.", "The goblins have grown bolder. Something is organizing them... something dark."] },
            "Pyotr": { name: "Pyotr Sukiskyn", role: "Homestead Patriarch", description: "Stephan's older brother and head of the Sukiskyn family. A proud and capable man.", dialogue: ["Strangers! Thank the Immortals you've arrived! The goblins attack every night!", "We cannot hold much longer. Please, help us defend our home!", "They took my brother during the last raid. You must find him!"] },
            "Taras": { name: "Taras Sukiskyn", role: "Kidnapped Brother", description: "The youngest Sukiskyn brother, kidnapped by goblins during the siege.", dialogue: ["*cough* You... you came for me? The goblins spoke of selling us to the Iron Ring.", "There is a man in black robes who commands them. He spoke of a 'great work' in the lost valley."] },
            "Golthar": { name: "Golthar the Iron Ring", role: "Villain - Iron Ring Agent", description: "A sinister wizard working for the Iron Ring slaving organization. He seeks ancient Hutaakan artifacts.", dialogue: ["Foolish adventurers! You cannot stop the Iron Ring. We have eyes everywhere!", "The secrets of the Hutaakans will give us power beyond imagination!", "Kill them! The master will reward me greatly for eliminating these meddlers!"] },
            "Xitaqa": { name: "King Xitaqa", role: "Goblin King", description: "A cunning goblin chieftain who united the wolf-rider tribes under his banner, allied with the Iron Ring.", dialogue: ["*snarl* More pink-skins come to die! Xitaqa will feast on your bones!", "The Iron Ring pays good gold for slaves. You will fetch a fine price!", "My wolves will tear you apart!"] }
        },
        locations: [
            { name: "Kelven", type: "town", danger: 0, icon: "🏰", chapter: 0, description: "A frontier town in eastern Karameikos. Your journey to Sukiskyn begins here." },
            { name: "Misha's Ferry", type: "town", danger: 0, icon: "⛵", chapter: 0, description: "A small ferry crossing on the Shutturga River. The last stop before the wilderness." },
            { name: "The Wilderness Road", type: "wilderness", danger: 1, icon: "🛤️", chapter: 0, description: "The dangerous road through untamed Karameikos. Goblin raids have increased lately." },
            { name: "Sukiskyn Homestead", type: "town", danger: 2, icon: "🏠", chapter: 1, description: "The Sukiskyn family homestead, famous for breeding white horses. Currently under siege!" },
            { name: "Sukiskyn Stables", type: "town", danger: 2, icon: "🐴", chapter: 1, description: "The prized stables of Sukiskyn. The goblins are trying to steal the horses!" },
            { name: "Palisade Walls", type: "dungeon", danger: 3, icon: "🛡️", chapter: 1, description: "The wooden walls defending Sukiskyn. Goblins assault from all sides!" },
            { name: "Dymrak Forest", type: "wilderness", danger: 2, icon: "🌲", chapter: 2, description: "A vast, dark forest full of dangers. The goblin trail leads deep within." },
            { name: "Goblin Trail", type: "wilderness", danger: 2, icon: "👣", chapter: 2, description: "Fresh tracks from goblin wolf-riders. They're heading northeast." },
            { name: "Fyodorll's Cabin", type: "town", danger: 0, icon: "🏚️", chapter: 2, description: "A hermit woodsman's cabin. He may have information about the goblins." },
            { name: "Xitaqa's Lair - Entrance", type: "dungeon", danger: 2, icon: "🕳️", chapter: 3, description: "Ancient ruins that the goblin king has claimed as his stronghold." },
            { name: "Wolf Pens", type: "dungeon", danger: 3, icon: "🐺", chapter: 3, description: "Where the goblins keep their dire wolves. The howling is deafening." },
            { name: "Xitaqa's Throne Room", type: "dungeon", danger: 4, icon: "👑", chapter: 3, description: "The heart of the goblin lair. King Xitaqa awaits on his crude throne." },
            { name: "Prison Caves", type: "dungeon", danger: 2, icon: "⛓️", chapter: 3, description: "Where the goblins keep their prisoners. You can hear cries for help." },
            { name: "Threshold", type: "town", danger: 0, icon: "🏛️", chapter: 4, description: "A larger town in Karameikos. The Iron Ring operates secretly here." },
            { name: "The Juggling Ogre Inn", type: "town", danger: 1, icon: "🍺", chapter: 4, description: "A rowdy inn where Iron Ring agents are known to meet." },
            { name: "Iron Ring Warehouse", type: "dungeon", danger: 3, icon: "📦", chapter: 4, description: "A secret warehouse where the Iron Ring holds captives before transport." },
            { name: "The Lost Valley - Entrance", type: "wilderness", danger: 3, icon: "🏔️", chapter: 5, description: "A hidden valley in the mountains, lost for centuries." },
            { name: "Hutaakan Ruins", type: "dungeon", danger: 3, icon: "🏛️", chapter: 5, description: "Ancient ruins of the dog-headed Hutaakan civilization." },
            { name: "Temple of Pflarr", type: "dungeon", danger: 4, icon: "⭐", chapter: 5, description: "The great temple at the heart of the valley. Dark magic stirs within." },
            { name: "Golthar's Sanctum", type: "dungeon", danger: 5, icon: "💀", chapter: 5, description: "The Iron Ring wizard's lair. The final confrontation awaits!" }
        ],
        monsters: {
            1: [
                { name: "Goblin Scout", hp: 7, ac: 13, damage: "1d6", xp: 50, attackBonus: 4, damageType: "piercing", description: "A sneaky goblin with a crude shortbow." },
                { name: "Wolf", hp: 11, ac: 13, damage: "1d6", xp: 50, attackBonus: 4, damageType: "piercing", description: "A grey wolf, common in the Karameikan wilderness." },
                { name: "Bandit", hp: 11, ac: 12, damage: "1d6", xp: 25, attackBonus: 3, damageType: "slashing", description: "A desperate outlaw preying on travelers." }
            ],
            2: [
                { name: "Goblin Wolf-Rider", hp: 12, ac: 14, damage: "1d8", xp: 100, attackBonus: 4, damageType: "slashing", description: "An elite goblin mounted on a dire wolf!" },
                { name: "Goblin Warrior", hp: 15, ac: 15, damage: "1d8", xp: 75, attackBonus: 4, damageType: "slashing", description: "A well-armed goblin soldier of Xitaqa's army." },
                { name: "Dire Wolf", hp: 22, ac: 13, damage: "2d6", xp: 100, attackBonus: 5, damageType: "piercing", description: "A massive wolf with glowing red eyes." },
                { name: "Iron Ring Thug", hp: 18, ac: 14, damage: "1d8", xp: 100, attackBonus: 4, damageType: "bludgeoning", description: "A brutal enforcer for the Iron Ring slavers." }
            ],
            3: [
                { name: "Goblin Shaman", hp: 20, ac: 12, damage: "2d6", xp: 200, attackBonus: 4, damageType: "fire", saveDC: 13, specialAbilities: [{ name: "Dark Fire", type: "breath", triggerChance: 0.3, damage: "2d6", damageType: "fire", dc: 13 }], description: "A goblin witch-doctor wielding dark magic!" },
                { name: "Bugbear", hp: 27, ac: 16, damage: "2d8", xp: 200, attackBonus: 4, damageType: "slashing", description: "A massive, hairy goblinoid. Xitaqa's elite guard." },
                { name: "Werewolf", hp: 35, ac: 12, damage: "2d6", xp: 450, attackBonus: 4, damageType: "slashing", multiattack: 2, description: "A cursed shapeshifter prowling the Dymrak." },
                { name: "Iron Ring Assassin", hp: 25, ac: 15, damage: "2d6", xp: 250, attackBonus: 6, damageType: "piercing", multiattack: 2, specialAbilities: [{ name: "Poison Blade", type: "poison", triggerChance: 0.25, damage: "2d6", damageType: "poison", dc: 13 }], description: "A deadly killer in service of the Iron Ring." }
            ],
            4: [
                { name: "King Xitaqa", hp: 45, ac: 16, damage: "2d8", xp: 700, attackBonus: 5, damageType: "slashing", multiattack: 2, description: "The cunning goblin king! He wears a crown of bones.", boss: true },
                { name: "Xitaqa's Warg", hp: 30, ac: 14, damage: "2d6", xp: 200, attackBonus: 5, damageType: "piercing", description: "Xitaqa's personal mount - a massive black warg." },
                { name: "Iron Ring Captain", hp: 40, ac: 16, damage: "2d8", xp: 450, attackBonus: 5, damageType: "slashing", multiattack: 2, description: "A high-ranking officer of the Iron Ring." }
            ],
            5: [
                { name: "Golthar the Wizard", hp: 55, ac: 14, damage: "3d6", xp: 1100, attackBonus: 5, damageType: "fire", multiattack: 2, saveDC: 15, specialAbilities: [{ name: "Fireball", type: "breath", triggerChance: 0.3, damage: "3d6", damageType: "fire", dc: 15 }], description: "The Iron Ring's wizard! He crackles with dark energy.", boss: true, legendaryResistances: 1 },
                { name: "Hutaakan Guardian", hp: 45, ac: 17, damage: "2d8", xp: 450, attackBonus: 6, damageType: "bludgeoning", immunities: ["poison", "psychic"], description: "An ancient construct guarding the temple." },
                { name: "Shadow", hp: 30, ac: 12, damage: "2d6", xp: 200, attackBonus: 4, damageType: "necrotic", resistances: ["cold", "necrotic"], immunities: ["poison"], vulnerabilities: ["radiant"], description: "A creature of pure darkness from the temple depths." }
            ]
        },
        events: {
            dungeon: [
                "Goblin voices echo through the tunnels... they're searching for intruders.",
                "You find crude goblin graffiti depicting wolf-riders in battle.",
                "The smell of wolves and goblins fills the musty air.",
                "You hear the clinking of chains - prisoners nearby?",
                "Ancient Hutaakan carvings show dog-headed figures performing rituals.",
                "A goblin horn sounds in the distance - have you been spotted?",
                "You find the remains of a previous adventurer... their journal mentions the Iron Ring."
            ],
            wilderness: [
                "Wolf howls echo through the Dymrak Forest. The goblins are near.",
                "You find wolf tracks mixed with goblin footprints heading northeast.",
                "A raven watches you from a dead tree - an ill omen in Karameikos.",
                "Smoke rises in the distance. Another homestead burning?",
                "You discover a goblin camp, recently abandoned. They left in a hurry.",
                "The forest grows darker. Local legends say evil spirits dwell here.",
                "You find a torn piece of cloth - the Sukiskyn family colors!"
            ],
            town: [
                "The townsfolk speak nervously of increased goblin raids.",
                "A merchant offers you supplies. 'Heading into the Dymrak? You're braver than most.'",
                "You overhear whispers of the Iron Ring... people quickly change the subject.",
                "A nervous man watches you from across the street. Iron Ring spy?",
                "Local guards are recruiting adventurers to deal with the goblin threat.",
                "A crying woman begs for help - her husband was taken by slavers.",
                "You see wanted posters for 'Golthar' - 500 gold reward for information."
            ]
        }
    },
    "curse_of_strahd": {
        id: "curse_of_strahd",
        name: "Curse of Strahd",
        icon: "🧛",
        coverArt: "images/curse_of_strahd.jpg",
        description: "A gothic horror adventure in the mist-shrouded land of Barovia. Face the vampire lord Strahd von Zarovich and uncover the dark secrets of Castle Ravenloft!",
        setting: "Barovia",
        level: "1-10",
        chapters: [
            { id: 0, name: "Prologue: Into the Mists", description: "Mysterious mists surround you and your companions. When they clear, you find yourselves in a dark, unfamiliar land.", objective: "Find shelter and learn where you are" },
            { id: 1, name: "Chapter 1: Village of Barovia", description: "The village of Barovia is a place of fear and despair. The locals speak in hushed tones of the Devil Strahd who rules this land.", objective: "Help Ismark protect his sister Ireena" },
            { id: 2, name: "Chapter 2: The Fortune Teller", description: "Madam Eva, a Vistani seer, has offered to read your fortune. The cards will reveal the path to defeating Strahd.", objective: "Visit Madam Eva at Tser Pool" },
            { id: 3, name: "Chapter 3: The Town of Vallaki", description: "Vallaki is a larger town trying to resist Strahd's influence. But dark forces work within its walls.", objective: "Investigate the troubles in Vallaki" },
            { id: 4, name: "Chapter 4: The Wizard's Tower", description: "The mad wizard's tower holds secrets and powerful allies. But the wizard himself may be beyond saving.", objective: "Find allies to stand against Strahd" },
            { id: 5, name: "Chapter 5: The Amber Temple", description: "Ancient evil lurks in the Amber Temple, where dark vestiges offer forbidden power.", objective: "Uncover the source of Strahd's power" },
            { id: 6, name: "Chapter 6: Castle Ravenloft", description: "The time has come to confront Strahd in his castle. The fate of Barovia hangs in the balance.", objective: "Defeat Strahd von Zarovich" },
            { id: 7, name: "Epilogue: Dawn Over Barovia", description: "With Strahd defeated, the mists begin to lift. Barovia is finally free from darkness.", objective: "Celebrate freedom!" }
        ],
        npcs: {
            "Ismark": { name: "Ismark Kolyanovich", role: "Burgomaster's Son", description: "A brave young man desperate to protect his sister from Strahd's obsession.", dialogue: ["Please, you must help us! The Devil Strahd has taken an interest in my sister Ireena.", "My father died of fright after Strahd's visitations. I cannot let Ireena suffer the same fate.", "If you help us reach Vallaki, I can offer what little gold we have."] },
            "Ireena": { name: "Ireena Kolyana", role: "Twice-Bitten Noble", description: "A beautiful young woman who bears an uncanny resemblance to Strahd's lost love, Tatyana.", dialogue: ["I remember nothing of Strahd's visits, only waking with these marks on my neck.", "There is something familiar about Castle Ravenloft... as if I've been there in a dream.", "I will not be a prisoner. I will fight alongside you against the Devil."] },
            "MadamEva": { name: "Madam Eva", role: "Vistani Seer", description: "An ancient Vistani fortune teller who may hold the key to defeating Strahd.", dialogue: ["The cards do not lie, but they can be... misinterpreted.", "Your fate is intertwined with the lord of this land. The cards will show you the way.", "Three treasures you must find: a weapon of light, a source of power, and an ally of great strength."] },
            "Strahd": { name: "Strahd von Zarovich", role: "Vampire Lord", description: "The ancient vampire lord who rules Barovia with an iron fist. He seeks to claim Ireena as his eternal bride.", dialogue: ["Welcome to my home. I am Count Strahd von Zarovich, and this land is mine.", "You remind me of adventurers I have known before. They all died, of course.", "Ireena will be mine. It is her destiny, as it was Tatyana's before her."], boss: true },
            "VanRichten": { name: "Rudolph van Richten", role: "Vampire Hunter", description: "A legendary monster hunter who has dedicated his life to destroying Strahd.", dialogue: ["I have hunted vampires for decades. Strahd is the most dangerous I have ever faced.", "Trust no one in Barovia. Strahd has spies everywhere.", "The Holy Symbol of Ravenkind can turn even the darkest creatures."] }
        },
        locations: [
            { name: "Gates of Barovia", type: "wilderness", danger: 1, icon: "🚪", chapter: 0, description: "Massive iron gates shrouded in mist. There is no going back." },
            { name: "Death House", type: "dungeon", danger: 2, icon: "🏚️", chapter: 0, description: "A seemingly abandoned manor that calls to travelers. Something evil lurks within." },
            { name: "Village of Barovia", type: "town", danger: 1, icon: "🏘️", chapter: 1, description: "A small, dreary village living in constant fear of Castle Ravenloft above." },
            { name: "Blood on the Vine Tavern", type: "town", danger: 0, icon: "🍷", chapter: 1, description: "The only tavern in the village. The locals drink to forget their sorrows." },
            { name: "Burgomaster's Mansion", type: "town", danger: 1, icon: "🏛️", chapter: 1, description: "Home of Ismark and Ireena. Their father's coffin awaits burial." },
            { name: "Church of Barovia", type: "town", danger: 2, icon: "⛪", chapter: 1, description: "A crumbling church where the priest has gone mad with grief." },
            { name: "Tser Pool", type: "wilderness", danger: 1, icon: "🎪", chapter: 2, description: "A Vistani encampment where Madam Eva awaits with her tarokka cards." },
            { name: "Old Svalich Road", type: "wilderness", danger: 2, icon: "🛤️", chapter: 2, description: "The dangerous road connecting the villages of Barovia." },
            { name: "Vallaki", type: "town", danger: 2, icon: "🏰", chapter: 3, description: "A walled town hosting weekly festivals to ward off Strahd's evil." },
            { name: "Blue Water Inn", type: "town", danger: 0, icon: "🍺", chapter: 3, description: "The best inn in Vallaki, run by the Martikov family." },
            { name: "Wachterhaus", type: "dungeon", danger: 3, icon: "🏠", chapter: 3, description: "Home of Lady Wachter, who secretly worships Strahd." },
            { name: "Church of St. Andral", type: "town", danger: 2, icon: "⛪", chapter: 3, description: "A holy place in Vallaki - but its bones have been stolen!" },
            { name: "Van Richten's Tower", type: "dungeon", danger: 2, icon: "🗼", chapter: 4, description: "The hidden tower of the legendary vampire hunter." },
            { name: "Argynvostholt", type: "dungeon", danger: 3, icon: "🐉", chapter: 4, description: "Ruins of an order of dragon knights who once opposed Strahd." },
            { name: "Berez", type: "wilderness", danger: 3, icon: "🌊", chapter: 4, description: "A drowned village where the witch Baba Lysaga dwells." },
            { name: "Amber Temple", type: "dungeon", danger: 4, icon: "💎", chapter: 5, description: "An ancient temple where dark vestiges are imprisoned." },
            { name: "Mount Ghakis", type: "wilderness", danger: 4, icon: "🏔️", chapter: 5, description: "The treacherous mountain where the Amber Temple is hidden." },
            { name: "Castle Ravenloft - Gates", type: "dungeon", danger: 4, icon: "🏰", chapter: 6, description: "The imposing entrance to Strahd's castle." },
            { name: "Castle Ravenloft - Crypt", type: "dungeon", danger: 5, icon: "⚰️", chapter: 6, description: "The crypts beneath the castle, where Strahd's coffin lies." },
            { name: "Castle Ravenloft - Tower", type: "dungeon", danger: 5, icon: "🗼", chapter: 6, description: "The highest tower of Ravenloft, overlooking all of Barovia." }
        ],
        monsters: {
            1: [
                { name: "Zombie", hp: 22, ac: 8, damage: "1d6", xp: 50, attackBonus: 3, damageType: "bludgeoning", immunities: ["poison"], resistances: ["necrotic"], description: "A shambling corpse animated by dark magic." },
                { name: "Swarm of Bats", hp: 10, ac: 12, damage: "1d6", xp: 25, attackBonus: 4, damageType: "piercing", description: "A cloud of chittering bats with glowing red eyes." },
                { name: "Strahd Zombie", hp: 28, ac: 8, damage: "1d8", xp: 75, attackBonus: 3, damageType: "bludgeoning", immunities: ["poison"], resistances: ["necrotic"], description: "A zombie enhanced by Strahd's dark power." }
            ],
            2: [
                { name: "Ghoul", hp: 22, ac: 12, damage: "2d6", xp: 200, attackBonus: 4, damageType: "slashing", immunities: ["poison"], saveDC: 10, specialAbilities: [{ name: "Paralyzing Touch", type: "frighten", triggerChance: 0.3, dc: 10 }], description: "An undead creature that feeds on corpses. Its claws can paralyze!" },
                { name: "Dire Wolf", hp: 37, ac: 14, damage: "2d6", xp: 200, attackBonus: 5, damageType: "piercing", description: "A massive wolf serving the dark powers of Barovia." },
                { name: "Wight", hp: 45, ac: 14, damage: "1d8", xp: 700, attackBonus: 4, damageType: "slashing", multiattack: 2, immunities: ["poison"], resistances: ["necrotic"], specialAbilities: [{ name: "Life Drain", type: "poison", triggerChance: 0.3, damage: "2d6", damageType: "necrotic", dc: 13 }], description: "An undead warrior whose touch drains life force." },
                { name: "Specter", hp: 22, ac: 12, damage: "2d6", xp: 200, attackBonus: 4, damageType: "necrotic", resistances: ["cold", "necrotic"], immunities: ["poison"], description: "A vengeful spirit bound to the land of Barovia." }
            ],
            3: [
                { name: "Vampire Spawn", hp: 52, ac: 15, damage: "2d8", xp: 1100, attackBonus: 6, damageType: "slashing", multiattack: 2, resistances: ["necrotic"], immunities: ["poison"], description: "A lesser vampire, bound to serve Strahd's will." },
                { name: "Werewolf", hp: 58, ac: 12, damage: "2d6", xp: 700, attackBonus: 4, damageType: "slashing", multiattack: 2, description: "A cursed shapeshifter prowling the forests of Barovia." },
                { name: "Revenant", hp: 75, ac: 13, damage: "2d6", xp: 1800, attackBonus: 6, damageType: "bludgeoning", multiattack: 2, immunities: ["poison"], resistances: ["necrotic"], description: "An undead knight sworn to destroy Strahd." },
                { name: "Phantom Warrior", hp: 45, ac: 16, damage: "2d6", xp: 450, attackBonus: 5, damageType: "slashing", resistances: ["cold", "necrotic"], immunities: ["poison"], description: "A ghostly warrior from the Order of the Silver Dragon." }
            ],
            4: [
                { name: "Baba Lysaga", hp: 75, ac: 15, damage: "3d6", xp: 2900, attackBonus: 6, damageType: "necrotic", multiattack: 2, saveDC: 16, specialAbilities: [{ name: "Finger of Death", type: "poison", triggerChance: 0.25, damage: "3d8", damageType: "necrotic", dc: 16 }], description: "The ancient witch of Berez who considers Strahd her son!", boss: true, legendaryResistances: 1 },
                { name: "Rahadin", hp: 85, ac: 17, damage: "2d8", xp: 2900, attackBonus: 7, damageType: "slashing", multiattack: 3, specialAbilities: [{ name: "Deathly Choir", type: "frighten", triggerChance: 0.3, damage: "2d10", damageType: "psychic", dc: 14 }], description: "Strahd's loyal chamberlain, surrounded by the screams of those he killed.", boss: true, legendaryResistances: 1 },
                { name: "Nightmare", hp: 68, ac: 13, damage: "2d8", xp: 700, attackBonus: 6, damageType: "fire", resistances: ["fire"], description: "A fiery steed from the lower planes." }
            ],
            5: [
                { name: "Strahd von Zarovich", hp: 144, ac: 16, damage: "3d8", xp: 10000, attackBonus: 9, damageType: "slashing", multiattack: 3, resistances: ["necrotic"], immunities: ["poison"], vulnerabilities: ["radiant"], saveDC: 18, specialAbilities: [{ name: "Charm", type: "frighten", triggerChance: 0.3, dc: 17 }, { name: "Children of the Night", type: "summon", triggerChance: 0.2 }], description: "The ancient vampire lord of Barovia! He regenerates and controls the very land.", boss: true, legendaryResistances: 3 },
                { name: "Amber Golem", hp: 95, ac: 17, damage: "3d6", xp: 2300, attackBonus: 8, damageType: "bludgeoning", multiattack: 2, immunities: ["poison", "psychic"], description: "A construct guarding the Amber Temple's darkest secrets." },
                { name: "Death Knight", hp: 95, ac: 18, damage: "3d8", xp: 8400, attackBonus: 8, damageType: "slashing", multiattack: 3, immunities: ["poison"], resistances: ["necrotic"], specialAbilities: [{ name: "Hellfire Orb", type: "breath", triggerChance: 0.25, damage: "4d6", damageType: "fire", dc: 18 }], description: "A fallen paladin serving dark powers." }
            ]
        },
        events: {
            dungeon: [
                "Cold air seeps from the stones. You hear distant screaming.",
                "Cobwebs thick as curtains block your path. Something large made them.",
                "A portrait's eyes seem to follow you as you pass.",
                "You find scratch marks on the inside of a coffin lid.",
                "Organ music echoes faintly through the halls. It sounds like a funeral dirge.",
                "Bats scatter from the ceiling as you disturb their rest.",
                "A cold hand seems to touch your shoulder, but when you turn, nothing is there."
            ],
            wilderness: [
                "The mists curl around you, never quite letting you see ahead.",
                "Wolf howls echo in the distance. They're getting closer.",
                "You pass a gallows where a body slowly twists in the wind.",
                "A black carriage passes you on the road. The curtains are drawn.",
                "You find a child's doll abandoned in the mud. It seems to be crying.",
                "Ravens watch you from dead trees. Are they Strahd's spies?",
                "The sun never seems to break through the perpetual clouds."
            ],
            town: [
                "The locals avoid your gaze. Trust is rare in Barovia.",
                "You overhear someone whisper: 'The Devil watches all.'",
                "A nervous shopkeeper offers wolfsbane. 'You'll need it,' he says.",
                "Children sing a disturbing nursery rhyme about Strahd.",
                "A funeral procession passes. This is the third one today.",
                "Someone slips you a note: 'Trust no one. The walls have ears.'",
                "The inn's wine is bitter. The locals call it 'Purple Grapemash No. 3.'"
            ]
        }
    },
    "tomb_of_annihilation": {
        id: "tomb_of_annihilation",
        name: "Tomb of Annihilation",
        icon: "💀",
        coverArt: "images/tomb_of_annihilation.jpg",
        description: "A deadly expedition into the jungles of Chult to end the Death Curse. Dinosaurs, undead, and an ancient tomb of horrors await!",
        setting: "Chult",
        level: "1-11",
        chapters: [
            { id: 0, name: "Prologue: The Death Curse", description: "A mysterious curse is killing those who have been raised from the dead. The source lies somewhere in the jungle peninsula of Chult.", objective: "Travel to Port Nyanzaru and find a guide" },
            { id: 1, name: "Chapter 1: Port Nyanzaru", description: "The vibrant trading port of Chult teems with merchants, dinosaur races, and rumors of treasure in the jungle.", objective: "Gather supplies and information about the Soulmonger" },
            { id: 2, name: "Chapter 2: The Jungle", description: "The steaming jungles of Chult are filled with ancient ruins, deadly predators, and undead horrors.", objective: "Navigate the jungle and find clues to the Soulmonger's location" },
            { id: 3, name: "Chapter 3: Omu, The Forbidden City", description: "The lost city of Omu lies in ruin, overrun by yuan-ti and the mysterious shrines of the Trickster Gods.", objective: "Collect the puzzle cubes from the Nine Shrines" },
            { id: 4, name: "Chapter 4: The Fane of the Night Serpent", description: "Deep beneath Omu lies the yuan-ti temple. Their leader serves an even darker master.", objective: "Infiltrate the yuan-ti temple and find the entrance to the tomb" },
            { id: 5, name: "Chapter 5: The Tomb of the Nine Gods", description: "The legendary Tomb of Annihilation awaits. Acererak's deadliest traps and the Soulmonger lie within.", objective: "Descend into the tomb and destroy the Soulmonger" },
            { id: 6, name: "Epilogue: Curse Lifted", description: "With the Soulmonger destroyed, the Death Curse ends. Chult begins to heal, and the souls trapped within are freed.", objective: "Celebrate your victory!" }
        ],
        npcs: {
            "Syndra": { name: "Syndra Silvane", role: "Quest Giver", description: "A dying archmage who sends the party to Chult to end the Death Curse before it claims her life.", dialogue: ["The Death Curse is killing me... and anyone else who has ever been raised from the dead.", "I have used magic to locate the source: somewhere in the jungles of Chult.", "Please, find the Soulmonger and destroy it. You are my last hope."] },
            "Wakanga": { name: "Wakanga O'tamu", role: "Merchant Prince", description: "One of Port Nyanzaru's seven merchant princes, a wizard with a love of magical curiosities.", dialogue: ["Welcome to Port Nyanzaru! The greatest city in all of Chult!", "If you seek to venture into the jungle, you'll need a guide. I know several trustworthy ones.", "Beware the undead. Ras Nsi's army grows larger by the day."] },
            "Azaka": { name: "Azaka Stormfang", role: "Weretiger Guide", description: "A skilled jungle guide with a secret - she is a weretiger seeking to recover a family heirloom.", dialogue: ["I know the jungle better than anyone. For the right price, I will guide you.", "The jungle is not evil, but it is unforgiving. Respect it or die.", "There is something... personal I seek in Firefinger. Perhaps we can help each other?"] },
            "Artus": { name: "Artus Cimber", role: "Ring Bearer", description: "A legendary explorer who possesses the Ring of Winter, a powerful artifact sought by many.", dialogue: ["I've spent years searching for Mezro... and hiding from those who want my ring.", "The Ring of Winter is not a gift. It's a burden I cannot put down.", "Ras Nsi was once a hero of Mezro. Now he leads an army of undead. How the mighty fall."] },
            "RasNsi": { name: "Ras Nsi", role: "Yuan-ti Leader", description: "A former Chultan hero turned yuan-ti malison, he serves Acererak in exchange for a cure to the Death Curse.", dialogue: ["I was once a paladin of Ubtao. Now I am something... more.", "Acererak promised me salvation from the Death Curse. I have paid dearly for that promise.", "You cannot stop what has been set in motion. The Soulmonger will devour all."], boss: true },
            "Acererak": { name: "Acererak", role: "Archlich", description: "The legendary archlich and creator of the Tomb of Horrors. The Soulmonger is his greatest trap.", dialogue: ["Welcome, fools, to your doom. I am Acererak, and this is my masterpiece.", "Every soul devoured by the Soulmonger feeds the Atropal. Soon, a new god of death will rise!", "You are not the first adventurers to enter my tomb. You will not be the last to die here."], boss: true }
        },
        locations: [
            { name: "Port Nyanzaru - Harbor", type: "town", danger: 0, icon: "⚓", chapter: 0, description: "The bustling harbor of Chult's greatest city. Ships from across Faerûn dock here." },
            { name: "Port Nyanzaru - Market", type: "town", danger: 0, icon: "🏺", chapter: 1, description: "A vibrant market selling everything from dinosaur mounts to jungle supplies." },
            { name: "Port Nyanzaru - Coliseum", type: "town", danger: 1, icon: "🏟️", chapter: 1, description: "The famous dinosaur racing arena. Fortunes are won and lost here daily." },
            { name: "Merchant Prince Palace", type: "town", danger: 0, icon: "🏛️", chapter: 1, description: "The meeting place of the seven merchant princes who rule Port Nyanzaru." },
            { name: "Aldani Basin", type: "wilderness", danger: 2, icon: "🌿", chapter: 2, description: "A swampy region inhabited by the mysterious lobsterfolk called aldani." },
            { name: "Camp Righteous", type: "wilderness", danger: 2, icon: "⛺", chapter: 2, description: "An abandoned Order of the Gauntlet camp, overrun by goblins and undead." },
            { name: "Camp Vengeance", type: "wilderness", danger: 2, icon: "🏕️", chapter: 2, description: "A struggling Order of the Gauntlet outpost, besieged by undead." },
            { name: "Firefinger", type: "dungeon", danger: 2, icon: "🗼", chapter: 2, description: "An ancient spire where pterafolk have made their nest." },
            { name: "Mbala", type: "wilderness", danger: 2, icon: "🏔️", chapter: 2, description: "A plateau where a green hag named Nanny Pu'pu dwells among the ruins." },
            { name: "Orolunga", type: "wilderness", danger: 2, icon: "🐍", chapter: 2, description: "A ziggurat where the naga oracle Saja N'baza resides." },
            { name: "Heart of Ubtao", type: "wilderness", danger: 3, icon: "🌳", chapter: 2, description: "A massive tree that serves as a lair of the lich Valindra Shadowmantle." },
            { name: "Omu - City Gates", type: "wilderness", danger: 3, icon: "🚪", chapter: 3, description: "The crumbling entrance to the lost city, guarded by gargoyles." },
            { name: "Omu - Shrines", type: "dungeon", danger: 3, icon: "⛩️", chapter: 3, description: "Nine shrines dedicated to the Trickster Gods, each holding a puzzle cube." },
            { name: "Omu - Royal Palace", type: "dungeon", danger: 3, icon: "👑", chapter: 3, description: "The ruined palace where the yuan-ti have established their base." },
            { name: "Fane of the Night Serpent", type: "dungeon", danger: 4, icon: "🐍", chapter: 4, description: "The underground yuan-ti temple beneath Omu." },
            { name: "Ras Nsi's Throne Room", type: "dungeon", danger: 4, icon: "🪑", chapter: 4, description: "Where the yuan-ti leader holds court and guards the entrance to the tomb." },
            { name: "Tomb - Level 1", type: "dungeon", danger: 4, icon: "💀", chapter: 5, description: "The first level of the tomb, filled with deadly traps and false paths." },
            { name: "Tomb - Level 2", type: "dungeon", danger: 4, icon: "☠️", chapter: 5, description: "Deeper into the tomb, where the Trickster Gods' spirits dwell." },
            { name: "Tomb - Level 3", type: "dungeon", danger: 5, icon: "⚰️", chapter: 5, description: "The machine level, filled with gears, traps, and the tomb's maintenance." },
            { name: "Tomb - Cradle of the Death God", type: "dungeon", danger: 5, icon: "🔮", chapter: 5, description: "The deepest level where the Soulmonger and the Atropal await." }
        ],
        monsters: {
            1: [
                { name: "Velociraptor", hp: 10, ac: 13, damage: "1d6", xp: 25, attackBonus: 4, damageType: "slashing", description: "A pack-hunting dinosaur with razor-sharp claws." },
                { name: "Zombie", hp: 22, ac: 8, damage: "1d6", xp: 50, attackBonus: 3, damageType: "bludgeoning", immunities: ["poison"], resistances: ["necrotic"], description: "One of Ras Nsi's endless undead soldiers." },
                { name: "Grung", hp: 11, ac: 12, damage: "1d4", xp: 50, attackBonus: 4, damageType: "piercing", specialAbilities: [{ name: "Poisonous Skin", type: "poison", triggerChance: 0.3, damage: "1d6", damageType: "poison", dc: 12 }], description: "A poisonous frog-like humanoid native to Chult." }
            ],
            2: [
                { name: "Allosaurus", hp: 51, ac: 13, damage: "2d8", xp: 450, attackBonus: 6, damageType: "piercing", multiattack: 2, description: "A massive predatory dinosaur, the terror of the jungle." },
                { name: "Ghoul", hp: 22, ac: 12, damage: "2d6", xp: 200, attackBonus: 4, damageType: "slashing", immunities: ["poison"], saveDC: 10, specialAbilities: [{ name: "Paralyzing Claws", type: "frighten", triggerChance: 0.3, dc: 10 }], description: "An undead creature with paralyzing claws." },
                { name: "Su-monster", hp: 27, ac: 12, damage: "2d6", xp: 450, attackBonus: 4, damageType: "bludgeoning", saveDC: 11, specialAbilities: [{ name: "Psychic Crush", type: "frighten", triggerChance: 0.25, damage: "2d6", damageType: "psychic", dc: 11 }], description: "A psionic ape-like creature that hunts in packs." },
                { name: "Pterafolk", hp: 26, ac: 12, damage: "2d6", xp: 200, attackBonus: 4, damageType: "slashing", description: "Cruel flying humanoids that raid from above." }
            ],
            3: [
                { name: "Tyrannosaurus Rex", hp: 136, ac: 13, damage: "3d12", xp: 3900, attackBonus: 10, damageType: "piercing", multiattack: 2, description: "The king of dinosaurs! Its massive jaws can swallow prey whole.", boss: true },
                { name: "Yuan-ti Malison", hp: 66, ac: 12, damage: "2d8", xp: 700, attackBonus: 5, damageType: "piercing", immunities: ["poison"], saveDC: 13, specialAbilities: [{ name: "Suggestion", type: "frighten", triggerChance: 0.25, dc: 13 }], description: "A snake-human hybrid with dark magic." },
                { name: "Girallon Zombie", hp: 59, ac: 11, damage: "2d8", xp: 450, attackBonus: 5, damageType: "slashing", multiattack: 2, immunities: ["poison"], resistances: ["necrotic"], description: "An undead four-armed ape, savage and relentless." },
                { name: "Eblis", hp: 13, ac: 13, damage: "1d8", xp: 200, attackBonus: 3, damageType: "piercing", description: "Crane-like creatures that bargain for information." }
            ],
            4: [
                { name: "Ras Nsi", hp: 127, ac: 15, damage: "3d6", xp: 5000, attackBonus: 9, damageType: "fire", multiattack: 3, immunities: ["poison"], saveDC: 16, specialAbilities: [{ name: "Flame Blade", type: "breath", triggerChance: 0.3, damage: "3d6", damageType: "fire", dc: 16 }], description: "The fallen paladin, now a yuan-ti abomination with a flaming sword!", boss: true, legendaryResistances: 2 },
                { name: "Yuan-ti Abomination", hp: 127, ac: 15, damage: "2d10", xp: 2900, attackBonus: 7, damageType: "piercing", multiattack: 3, immunities: ["poison"], saveDC: 14, specialAbilities: [{ name: "Fear Aura", type: "frighten", triggerChance: 0.25, dc: 14 }], description: "The most powerful form of yuan-ti, more snake than human." },
                { name: "Bodak", hp: 58, ac: 15, damage: "2d8", xp: 2300, attackBonus: 5, damageType: "necrotic", immunities: ["poison"], resistances: ["necrotic"], vulnerabilities: ["radiant"], saveDC: 13, specialAbilities: [{ name: "Death Gaze", type: "frighten", triggerChance: 0.3, damage: "3d6", damageType: "necrotic", dc: 13 }], description: "An undead whose gaze can kill." }
            ],
            5: [
                { name: "Acererak", hp: 285, ac: 21, damage: "4d8", xp: 25000, attackBonus: 12, damageType: "necrotic", multiattack: 2, immunities: ["poison", "necrotic"], resistances: ["cold"], saveDC: 23, specialAbilities: [{ name: "Sphere of Annihilation", type: "breath", triggerChance: 0.3, damage: "4d10", damageType: "necrotic", dc: 22 }], description: "The legendary archlich! He toys with adventurers before destroying them.", boss: true, legendaryResistances: 3 },
                { name: "Atropal", hp: 225, ac: 7, damage: "4d8", xp: 13000, attackBonus: 8, damageType: "necrotic", immunities: ["poison", "necrotic"], resistances: ["cold"], saveDC: 19, specialAbilities: [{ name: "Life Drain Aura", type: "poison", triggerChance: 0.4, damage: "3d8", damageType: "necrotic", dc: 19 }], description: "An undead godling, fed by the Soulmonger. Its wail can kill instantly!", boss: true, legendaryResistances: 2 },
                { name: "Tomb Guardian", hp: 75, ac: 17, damage: "2d10", xp: 1800, attackBonus: 7, damageType: "bludgeoning", multiattack: 2, immunities: ["poison", "psychic"], description: "A construct defending the tomb's deepest levels." },
                { name: "Soulmonger", hp: 200, ac: 15, damage: "3d10", xp: 8000, attackBonus: 8, damageType: "necrotic", immunities: ["poison", "psychic"], saveDC: 17, specialAbilities: [{ name: "Soul Drain", type: "poison", triggerChance: 0.3, damage: "3d10", damageType: "necrotic", dc: 17 }], description: "The source of the Death Curse! Destroy it to save countless souls.", boss: true, legendaryResistances: 1 }
            ]
        },
        events: {
            dungeon: [
                "You hear the grinding of ancient gears deep within the walls.",
                "A tile clicks beneath your foot. You freeze, waiting for something to happen...",
                "Skeletal remains wearing adventurer's gear lie scattered ahead. A warning.",
                "Green gas seeps from cracks in the floor. Best not to breathe deeply.",
                "A ghostly laugh echoes through the chamber. Acererak is watching.",
                "Strange symbols glow on the walls - the marks of the Trickster Gods.",
                "You find a journal entry: 'Day 47 in the tomb. We are the last two. One more trap...'"
            ],
            wilderness: [
                "Dinosaur calls echo through the jungle. Something big is hunting nearby.",
                "The humidity is oppressive. Your equipment is starting to rust.",
                "You find zombie tracks heading northeast. Ras Nsi's army on the move.",
                "Colorful birds scatter as you approach. At least something here isn't trying to kill you.",
                "A massive snake watches from the branches. Yuan-ti spy or just wildlife?",
                "You discover an ancient Chultan shrine, overgrown but still standing.",
                "The buzzing of insects is deafening. Something in the swamp smells of death."
            ],
            town: [
                "A merchant tries to sell you a 'guaranteed genuine' map to Omu. Third one today.",
                "Dinosaur races are about to begin! The betting is fierce.",
                "You overhear sailors discussing the Death Curse. Another crew lost their captain.",
                "A guide offers their services. They seem trustworthy... mostly.",
                "The smell of spiced meat fills the air. Chultan cuisine is delicious if deadly.",
                "A wealthy noble seeks adventurers to recover a family heirloom from the jungle.",
                "Wanted posters show Artus Cimber. The Zhentarim pay well for information."
            ]
        }
    },
    "lost_mine_of_phandelver": {
        id: "lost_mine_of_phandelver",
        name: "Lost Mine of Phandelver",
        icon: "⛏️",
        coverArt: "images/lost-mine-of-phandelver.jpg",
        description: "The classic D&D 5th Edition starter adventure! Escort supplies to the frontier town of Phandalin, but danger lurks on the Triboar Trail. Goblins, bandits, and a mysterious villain seek the legendary Wave Echo Cave!",
        setting: "Sword Coast",
        level: "1-5",
        chapters: [
            { id: 0, name: "Prologue: The Triboar Trail", description: "You've been hired by Gundren Rockseeker to escort a wagon of supplies to the frontier town of Phandalin. Gundren and his bodyguard Sildar have ridden ahead, promising to meet you in town.", objective: "Escort the wagon safely to Phandalin" },
            { id: 1, name: "Chapter 1: Goblin Trouble", description: "The road is blocked by dead horses - an ambush! Gundren and Sildar are missing, and goblin tracks lead into the forest. The Cragmaw tribe is behind this.", objective: "Rescue Sildar and discover what happened to Gundren" },
            { id: 2, name: "Chapter 2: Phandalin", description: "The small frontier town is being terrorized by the Redbrands - thugs who work for someone called Glasstaff. The townsfolk desperately need heroes.", objective: "Deal with the Redbrand menace" },
            { id: 3, name: "Chapter 3: Secrets of Tresendar Manor", description: "The Redbrand hideout lies beneath the old Tresendar Manor. Their leader Glasstaff knows something about Gundren's disappearance and the mysterious Black Spider.", objective: "Infiltrate the Redbrand hideout and confront Glasstaff" },
            { id: 4, name: "Chapter 4: Cragmaw Castle", description: "The goblin stronghold of Cragmaw Castle is where King Grol holds Gundren prisoner. The Black Spider wants information about Wave Echo Cave.", objective: "Storm Cragmaw Castle and rescue Gundren" },
            { id: 5, name: "Chapter 5: Wave Echo Cave", description: "The legendary lost mine has been found! Within lies the Forge of Spells, a magical forge from the ancient Phandelver's Pact. But the Black Spider has already entered the cave...", objective: "Explore Wave Echo Cave and stop the Black Spider" },
            { id: 6, name: "Epilogue: Heroes of Phandalin", description: "With the Black Spider defeated and Wave Echo Cave secured, Phandalin can finally prosper. You are celebrated as the heroes who saved the town!", objective: "Celebrate your victory!" }
        ],
        npcs: {
            "Gundren": { name: "Gundren Rockseeker", role: "Dwarf Prospector (Quest Giver)", description: "A jovial dwarf entrepreneur who discovered something important. He and his brothers have a big secret.", dialogue: ["Thank you for agreeing to escort my supplies! I need to ride ahead with Sildar to prepare for your arrival.", "There's something I haven't told you... my brothers and I found something. Something big. But that's a story for when you arrive in Phandalin!", "The Rockseeker name will be famous again! Just you wait and see!"] },
            "Sildar": { name: "Sildar Hallwinter", role: "Lords' Alliance Agent", description: "A retired soldier working for the Lords' Alliance. He's searching for a missing agent named Iarno Albrek.", dialogue: ["*groaning* Those cursed goblins... Thank you for rescuing me. But Gundren - they took him somewhere else!", "I was escorting Gundren as a favor to the Lords' Alliance. He's onto something big in these hills.", "I'm searching for Iarno Albrek, a fellow agent. He came to Phandalin two months ago and vanished. Have you seen him?"] },
            "TheBlackSpider": { name: "The Black Spider", role: "Mysterious Villain", description: "A mysterious figure who commands goblins and bandits alike. His agents seek Gundren and his map to Wave Echo Cave.", dialogue: ["[You receive a note] 'Gundren Rockseeker is my prisoner. Send word to his family that they should give up their search. The Black Spider.'", "So, the troublesome adventurers have finally arrived. No matter - you're too late!", "Wave Echo Cave and the Forge of Spells will be mine! The power within will make me unstoppable!"], boss: true },
            "Glasstaff": { name: "Glasstaff (Iarno Albrek)", role: "Redbrand Leader", description: "The mysterious wizard leading the Redbrands. He carries a glass staff and has connections to the Black Spider.", dialogue: ["You dare invade my sanctuary?! The Redbrands will cut you down!", "You don't understand - the Black Spider offers power! He'll make me the lord of Phandalin!", "Sildar was a fool to come looking for me. I've found a better path!"] },
            "Nezznar": { name: "Nezznar", role: "The Black Spider (Drow Villain)", description: "The true identity of the Black Spider - a drow seeking the magic of the Forge of Spells to advance his dark schemes.", dialogue: ["Ah, the meddlesome surface dwellers. Did you think your small victories would stop my plans?", "For too long, the secrets of Wave Echo Cave have been lost. Now they will serve the Spider Queen!", "Die knowing that your deaths will not be remembered, while my name will echo through the Underdark for centuries!"], boss: true },
            "ElmarBarthen": { name: "Elmar Barthen", role: "Merchant", description: "The owner of Barthen's Provisions in Phandalin. He hired you to deliver Gundren's supplies.", dialogue: ["Welcome to Phandalin! I've been expecting Gundren's delivery. Where is the old dwarf?", "The Redbrands are a menace. They work for someone in Tresendar Manor, but no one dares investigate.", "I'll pay you the agreed 10 gold pieces for the delivery. Shame to hear Gundren's in trouble."] }
        },
        locations: [
            { name: "Triboar Trail", type: "wilderness", danger: 0, icon: "🛤️", chapter: 0, description: "The High Road from Neverwinter to Phandalin. Well-traveled by merchants and settlers." },
            { name: "Goblin Ambush Site", type: "wilderness", danger: 1, icon: "💀", chapter: 1, description: "Dead horses block the trail. Goblin arrows still stick from their flanks." },
            { name: "Cragmaw Hideout - Entrance", type: "dungeon", danger: 1, icon: "🕳️", chapter: 1, description: "A hidden cave entrance where the Cragmaw goblins took their prisoners." },
            { name: "Cragmaw Hideout - Depths", type: "dungeon", danger: 2, icon: "👹", chapter: 1, description: "The main goblin den. Sildar is held prisoner somewhere inside." },
            { name: "Phandalin - Town Square", type: "town", danger: 0, icon: "🏘️", chapter: 2, description: "A small frontier settlement. Miners and farmers eye you with a mix of hope and suspicion." },
            { name: "Barthen's Provisions", type: "town", danger: 0, icon: "🏺", chapter: 2, description: "The general store run by Elmar Barthen. Gundren's supplies were destined here." },
            { name: "Stonehill Inn", type: "town", danger: 0, icon: "🍺", chapter: 2, description: "The town's inn and taproom, run by Toblen Stonehill and his family." },
            { name: "Shrine of Luck", type: "town", danger: 0, icon: "⛪", chapter: 2, description: "A small shrine tended by Sister Garaele, a contact for the Harpers." },
            { name: "Townmaster's Hall", type: "town", danger: 0, icon: "🏛️", chapter: 2, description: "Where the pompous Harbin Wester serves as townmaster under Redbrand intimidation." },
            { name: "Sleeping Giant Tap House", type: "town", danger: 2, icon: "🍷", chapter: 2, description: "A grimy taphouse that serves as the Redbrand headquarters in town." },
            { name: "Tresendar Manor Ruins", type: "dungeon", danger: 2, icon: "🏚️", chapter: 3, description: "The ruins of the old Tresendar estate. A hidden entrance leads to the Redbrand hideout below." },
            { name: "Redbrand Hideout - Crypts", type: "dungeon", danger: 2, icon: "⚰️", chapter: 3, description: "Ancient crypts beneath the manor, now infested with undead and Redbrand thugs." },
            { name: "Redbrand Hideout - Cells", type: "dungeon", danger: 2, icon: "⛓️", chapter: 3, description: "Prison cells where the Redbrands keep captured townsfolk." },
            { name: "Glasstaff's Quarters", type: "dungeon", danger: 3, icon: "🪄", chapter: 3, description: "The wizard's luxurious quarters. His desk contains incriminating documents." },
            { name: "Cragmaw Castle - Ruins", type: "dungeon", danger: 3, icon: "🏰", chapter: 4, description: "An ancient ruined castle, now the stronghold of the Cragmaw tribe." },
            { name: "Cragmaw Castle - Great Hall", type: "dungeon", danger: 3, icon: "👑", chapter: 4, description: "Where King Grol holds court over his disorganized goblin kingdom." },
            { name: "King Grol's Chamber", type: "dungeon", danger: 4, icon: "💎", chapter: 4, description: "The bugbear king's personal chamber. Gundren is held prisoner here!" },
            { name: "Wave Echo Cave - Entrance", type: "dungeon", danger: 3, icon: "⛏️", chapter: 5, description: "The legendary lost mine! An eerie echo like crashing waves reverberates through the tunnels." },
            { name: "Wave Echo Cave - Mines", type: "dungeon", danger: 4, icon: "💎", chapter: 5, description: "Old mining tunnels filled with monsters and the restless undead of Phandelver's Pact." },
            { name: "The Forge of Spells", type: "dungeon", danger: 4, icon: "🔨", chapter: 5, description: "The ancient magical forge where wizards once enchanted weapons and armor." },
            { name: "Temple of Dumathoin", type: "dungeon", danger: 5, icon: "⛏️", chapter: 5, description: "An underground temple to the dwarven god of mining. The Black Spider awaits within!" }
        ],
        monsters: {
            1: [
                { name: "Goblin", hp: 7, ac: 13, damage: "1d6", xp: 50, attackBonus: 4, damageType: "slashing", description: "A sneaky Cragmaw goblin with a shortbow and a nasty attitude." },
                { name: "Wolf", hp: 11, ac: 13, damage: "1d6", xp: 50, attackBonus: 4, damageType: "piercing", description: "A grey wolf trained by the Cragmaw tribe to attack intruders." },
                { name: "Redbrand Ruffian", hp: 12, ac: 12, damage: "1d6", xp: 50, attackBonus: 3, damageType: "slashing", description: "A common thug wearing a tattered red cloak." }
            ],
            2: [
                { name: "Hobgoblin", hp: 15, ac: 16, damage: "1d8", xp: 100, attackBonus: 3, damageType: "slashing", description: "A disciplined goblinoid warrior in chainmail." },
                { name: "Bugbear", hp: 27, ac: 16, damage: "2d8", xp: 200, attackBonus: 4, damageType: "slashing", description: "A massive, hairy goblinoid that excels at stealth ambushes." },
                { name: "Skeleton", hp: 13, ac: 13, damage: "1d6", xp: 50, attackBonus: 4, damageType: "slashing", immunities: ["poison"], vulnerabilities: ["bludgeoning"], description: "The animated bones of a long-dead Phandelver warrior." },
                { name: "Zombie", hp: 22, ac: 8, damage: "1d6", xp: 50, attackBonus: 3, damageType: "bludgeoning", immunities: ["poison"], resistances: ["necrotic"], description: "A shambling corpse from the ancient battle at Wave Echo Cave." },
                { name: "Ochre Jelly", hp: 45, ac: 8, damage: "2d6", xp: 200, attackBonus: 4, damageType: "bludgeoning", immunities: ["lightning", "slashing"], description: "An acidic ooze that splits when struck by lightning or slashing weapons!" }
            ],
            3: [
                { name: "Glasstaff", hp: 32, ac: 12, damage: "2d8", xp: 700, attackBonus: 5, damageType: "fire", saveDC: 13, specialAbilities: [{ name: "Staff Blast", type: "breath", triggerChance: 0.3, damage: "2d6", damageType: "fire", dc: 13 }], description: "The wizard leader of the Redbrands, wielding his signature glass staff!", boss: true },
                { name: "Nothic", hp: 45, ac: 15, damage: "2d6", xp: 450, attackBonus: 4, damageType: "slashing", saveDC: 12, specialAbilities: [{ name: "Rotting Gaze", type: "poison", triggerChance: 0.3, damage: "2d6", damageType: "necrotic", dc: 12 }], description: "A bizarre one-eyed aberration cursed by dark magic. It can see through lies!" },
                { name: "Grick", hp: 27, ac: 14, damage: "2d6", xp: 450, attackBonus: 4, damageType: "slashing", description: "A worm-like predator with stone-hard skin and tentacles." },
                { name: "Owlbear", hp: 59, ac: 13, damage: "2d8", xp: 700, attackBonus: 7, damageType: "slashing", multiattack: 2, description: "A ferocious hybrid creature with the temperament of a wounded bear." }
            ],
            4: [
                { name: "King Grol", hp: 45, ac: 16, damage: "2d8", xp: 700, attackBonus: 5, damageType: "bludgeoning", multiattack: 2, description: "The brutish bugbear king of Cragmaw Castle. His morningstar has crushed many skulls!", boss: true },
                { name: "Doppelganger", hp: 52, ac: 14, damage: "1d8", xp: 700, attackBonus: 6, damageType: "bludgeoning", description: "A shapeshifter working for the Black Spider. Who can you trust?" },
                { name: "Flameskull", hp: 40, ac: 13, damage: "3d6", xp: 1100, attackBonus: 5, damageType: "fire", immunities: ["poison", "cold"], resistances: ["necrotic"], specialAbilities: [{ name: "Fireball", type: "breath", triggerChance: 0.3, damage: "3d6", damageType: "fire", dc: 13 }], description: "A floating skull wreathed in green flames! It guards the Forge of Spells with deadly magic.", boss: true },
                { name: "Wraith", hp: 67, ac: 13, damage: "3d8", xp: 1800, attackBonus: 6, damageType: "necrotic", resistances: ["cold", "necrotic"], immunities: ["poison"], specialAbilities: [{ name: "Life Drain", type: "poison", triggerChance: 0.35, damage: "3d6", damageType: "necrotic", dc: 14 }], description: "A powerful undead spirit whose touch drains life and creates specters!" }
            ],
            5: [
                { name: "Nezznar the Black Spider", hp: 55, ac: 14, damage: "3d6", xp: 2000, attackBonus: 6, damageType: "poison", multiattack: 2, saveDC: 14, specialAbilities: [{ name: "Darkness", type: "frighten", triggerChance: 0.25, dc: 14 }, { name: "Spider Staff Venom", type: "poison", triggerChance: 0.3, damage: "2d6", damageType: "poison", dc: 14 }], description: "The drow mastermind behind everything! His spider staff channels dark magic!", boss: true, legendaryResistances: 2 },
                { name: "Giant Spider", hp: 26, ac: 14, damage: "1d8", xp: 200, attackBonus: 5, damageType: "piercing", saveDC: 11, specialAbilities: [{ name: "Poison Bite", type: "poison", triggerChance: 0.3, damage: "2d8", damageType: "poison", dc: 11 }], description: "One of the Black Spider's loyal pets. Its venom can paralyze!" },
                { name: "Drow", hp: 13, ac: 15, damage: "1d6", xp: 100, attackBonus: 4, damageType: "slashing", description: "A dark elf warrior serving Nezznar. Sunlight hurts their eyes." },
                { name: "Spectator", hp: 39, ac: 14, damage: "1d8", xp: 700, attackBonus: 5, damageType: "fire", specialAbilities: [{ name: "Eye Ray", type: "breath", triggerChance: 0.35, damage: "2d8", damageType: "fire", dc: 13 }], description: "A beholder-kin with four eyestalks guarding the Forge of Spells." }
            ]
        },
        events: {
            dungeon: [
                "You hear the scurrying of small feet echoing through stone passages.",
                "Crude goblin graffiti covers the walls - threats against intruders.",
                "The sound of dripping water and distant waves echoes eerily through the cave.",
                "You find old mining equipment, rusted and abandoned for centuries.",
                "Scratch marks on the walls show where something large was dragged through.",
                "A skeleton wearing ancient dwarven armor lies against the wall, still clutching a pickaxe.",
                "The air smells of mold, earth, and something else... something dangerous."
            ],
            wilderness: [
                "The Sword Mountains loom to the east, their peaks often shrouded in clouds.",
                "You spot signs of recent goblin activity - small footprints and crude camps.",
                "A merchant wagon passes, its driver nervously eyeing the tree line.",
                "You discover an old trail marker pointing toward Phandalin.",
                "Animal tracks cross your path - deer, wolves, and something larger.",
                "The Neverwinter Wood stretches to the west, dark and forbidding.",
                "You pass abandoned homesteads, victims of orc raids years ago."
            ],
            town: [
                "Townsfolk whisper nervously when Redbrands swagger past.",
                "A farmer offers to pay for help dealing with nearby monsters.",
                "The local miners speak hopefully of work once Wave Echo Cave is found.",
                "You overhear gossip about the Rockseeker brothers and their secret.",
                "A merchant complains about 'protection money' demanded by thugs.",
                "Children play in the street but scatter when adults appear nervous.",
                "The sound of hammers rings from the smithy as the town slowly rebuilds."
            ]
        }
    }
};

// Current active campaign data (set when campaign is selected)
let ACTIVE_CAMPAIGN = null;

// ========== D&D 5e Skill System ==========
const SKILL_ABILITY_MAP = {
    "Athletics": "str",
    "Acrobatics": "dex", "Sleight of Hand": "dex", "Stealth": "dex",
    "Arcana": "int", "History": "int", "Investigation": "int", "Nature": "int", "Religion": "int",
    "Animal Handling": "wis", "Insight": "wis", "Medicine": "wis", "Perception": "wis", "Survival": "wis",
    "Deception": "cha", "Intimidation": "cha", "Performance": "cha", "Persuasion": "cha"
};

// Skills each class can choose from during creation (D&D 5e PHB)
const CLASS_SKILL_CHOICES = {
    "Fighter": { count: 2, choices: ["Acrobatics", "Animal Handling", "Athletics", "History", "Insight", "Intimidation", "Perception", "Survival"] },
    "Wizard": { count: 2, choices: ["Arcana", "History", "Insight", "Investigation", "Medicine", "Religion"] },
    "Rogue": { count: 4, choices: ["Acrobatics", "Athletics", "Deception", "Insight", "Intimidation", "Investigation", "Perception", "Performance", "Persuasion", "Sleight of Hand", "Stealth"] },
    "Cleric": { count: 2, choices: ["History", "Insight", "Medicine", "Persuasion", "Religion"] },
    "Ranger": { count: 3, choices: ["Animal Handling", "Athletics", "Insight", "Investigation", "Nature", "Perception", "Stealth", "Survival"] },
    "Barbarian": { count: 2, choices: ["Animal Handling", "Athletics", "Intimidation", "Nature", "Perception", "Survival"] },
    "Paladin": { count: 2, choices: ["Athletics", "Insight", "Intimidation", "Medicine", "Persuasion", "Religion"] },
    "Monk": { count: 2, choices: ["Acrobatics", "Athletics", "History", "Insight", "Religion", "Stealth"] },
    "Warlock": { count: 2, choices: ["Arcana", "Deception", "History", "Intimidation", "Investigation", "Nature", "Religion"] },
    "Bard": { count: 3, choices: ["Acrobatics", "Animal Handling", "Arcana", "Athletics", "Deception", "History", "Insight", "Intimidation", "Investigation", "Medicine", "Nature", "Perception", "Performance", "Persuasion", "Religion", "Sleight of Hand", "Stealth", "Survival"] },
    "Sorcerer": { count: 2, choices: ["Arcana", "Deception", "Insight", "Intimidation", "Persuasion", "Religion"] },
    "Druid": { count: 2, choices: ["Arcana", "Animal Handling", "Insight", "Medicine", "Nature", "Perception", "Religion", "Survival"] },
    "Artificer": { count: 2, choices: ["Arcana", "History", "Investigation", "Medicine", "Nature", "Perception", "Sleight of Hand"] }
};

// ========== Equipment Proficiency Tables ==========
const CLASS_ARMOR_PROFICIENCY = {
    "Fighter": ["light", "medium", "heavy", "shields"],
    "Barbarian": ["light", "medium", "shields"],
    "Paladin": ["light", "medium", "heavy", "shields"],
    "Ranger": ["light", "medium", "shields"],
    "Cleric": ["light", "medium", "shields"],
    "Druid": ["light", "medium", "shields"],
    "Rogue": ["light"],
    "Bard": ["light"],
    "Warlock": ["light"],
    "Monk": [],
    "Wizard": [],
    "Sorcerer": [],
    "Artificer": ["light", "medium", "shields"]
};

const CLASS_WEAPON_PROFICIENCY = {
    "Fighter": ["simple", "martial"],
    "Barbarian": ["simple", "martial"],
    "Paladin": ["simple", "martial"],
    "Ranger": ["simple", "martial"],
    "Rogue": ["simple", "hand crossbow", "longsword", "rapier", "shortsword"],
    "Cleric": ["simple"],
    "Monk": ["simple", "shortsword"],
    "Bard": ["simple", "hand crossbow", "longsword", "rapier", "shortsword"],
    "Warlock": ["simple"],
    "Wizard": ["dagger", "dart", "sling", "quarterstaff", "light crossbow"],
    "Sorcerer": ["dagger", "dart", "sling", "quarterstaff", "light crossbow"],
    "Druid": ["club", "dagger", "dart", "javelin", "mace", "quarterstaff", "scimitar", "sickle", "sling", "spear"],
    "Artificer": ["simple"]
};

// ========== Racial Ability Data ==========
const RACIAL_ABILITIES = {
    "Halfling": {
        "Lucky": { description: "Reroll natural 1s on attack rolls, ability checks, and saving throws", type: "passive" },
        "Brave": { description: "Advantage on saving throws against being frightened", type: "passive" }
    },
    "Elf": {
        "Fey Ancestry": { description: "Advantage on saving throws against being charmed, and magic can't put you to sleep", type: "passive" },
        "Darkvision": { description: "See in dim light within 60 feet as if bright light, and darkness as dim light", type: "passive" }
    },
    "Dwarf": {
        "Dwarven Resilience": { description: "Advantage on saving throws against poison, and resistance to poison damage", type: "passive" },
        "Darkvision": { description: "See in dim light within 60 feet as if bright light, and darkness as dim light", type: "passive" }
    },
    "Dragonborn": {
        "Breath Weapon": { description: "Exhale destructive energy in a 15ft cone or 30ft line. 2d6 damage (scales with level). DEX save for half. Recharges on short rest.", type: "active", usesPerRest: 1, damage: "2d6", save: "dex" },
        "Damage Resistance": { description: "Resistance to your breath weapon's damage type", type: "passive", damageType: "fire" }
    },
    "Tiefling": {
        "Hellish Resistance": { description: "Resistance to fire damage", type: "passive", damageType: "fire" },
        "Darkvision": { description: "See in dim light within 60 feet as if bright light, and darkness as dim light", type: "passive" }
    },
    "Human": {
        "Versatile": { description: "+1 to all ability scores", type: "passive" },
        "Extra Skill": { description: "Gain proficiency in one additional skill of your choice", type: "creation" }
    }
};

const GAME_DATA = {
    races: {
        "Human": { bonus: { all: 1 }, traits: ["Versatile", "Extra Skill"] },
        "Elf": { bonus: { dex: 2 }, traits: ["Darkvision", "Fey Ancestry"] },
        "Dwarf": { bonus: { con: 2 }, traits: ["Darkvision", "Dwarven Resilience"] },
        "Halfling": { bonus: { dex: 2 }, traits: ["Lucky", "Brave"] },
        "Dragonborn": { bonus: { str: 2, cha: 1 }, traits: ["Breath Weapon", "Damage Resistance"] },
        "Tiefling": { bonus: { int: 1, cha: 2 }, traits: ["Darkvision", "Hellish Resistance"] },
        "Half-Orc": { bonus: { str: 2, con: 1 }, traits: ["Darkvision", "Relentless Endurance", "Savage Attacks"] }
    },
    classes: {
        "Fighter": { hitDie: 10, primary: "str", saves: ["str", "con"], skills: ["Athletics", "Intimidation"], equipment: ["Longsword", "Shield", "Chain Mail"], spellcaster: false },
        "Wizard": { hitDie: 6, primary: "int", saves: ["int", "wis"], skills: ["Arcana", "History"], equipment: ["Quarterstaff", "Spellbook", "Robes"], spellcaster: true, spellStat: "int", casterType: "full", cantrips: 3 },
        "Rogue": { hitDie: 8, primary: "dex", saves: ["dex", "int"], skills: ["Stealth", "Thieves' Tools"], equipment: ["Shortsword", "Dagger", "Leather Armor"], spellcaster: false },
        "Cleric": { hitDie: 8, primary: "wis", saves: ["wis", "cha"], skills: ["Medicine", "Religion"], equipment: ["Mace", "Shield", "Scale Mail"], spellcaster: true, spellStat: "wis", casterType: "full", cantrips: 3 },
        "Ranger": { hitDie: 10, primary: "dex", saves: ["str", "dex"], skills: ["Survival", "Nature"], equipment: ["Longbow", "Shortsword", "Leather Armor"], spellcaster: true, spellStat: "wis", casterType: "half", cantrips: 0 },
        "Barbarian": { hitDie: 12, primary: "str", saves: ["str", "con"], skills: ["Athletics", "Survival"], equipment: ["Greataxe", "Handaxes", "Hide Armor"], spellcaster: false },
        "Paladin": { hitDie: 10, primary: "cha", saves: ["wis", "cha"], skills: ["Athletics", "Religion"], equipment: ["Longsword", "Shield", "Chain Mail"], spellcaster: true, spellStat: "cha", casterType: "half", cantrips: 0 },
        "Monk": { hitDie: 8, primary: "dex", saves: ["str", "dex"], skills: ["Acrobatics", "Insight"], equipment: ["Shortsword", "Dagger"], spellcaster: false },
        "Warlock": { hitDie: 8, primary: "cha", saves: ["wis", "cha"], skills: ["Arcana", "Deception"], equipment: ["Light Crossbow", "Dagger", "Leather Armor"], spellcaster: true, spellStat: "cha", casterType: "pact", cantrips: 2 },
        "Bard": { hitDie: 8, primary: "cha", saves: ["dex", "cha"], skills: ["Performance", "Persuasion"], equipment: ["Rapier", "Dagger", "Leather Armor"], spellcaster: true, spellStat: "cha", casterType: "full", cantrips: 2 },
        "Sorcerer": { hitDie: 6, primary: "cha", saves: ["con", "cha"], skills: ["Arcana", "Persuasion"], equipment: ["Light Crossbow", "Dagger"], spellcaster: true, spellStat: "cha", casterType: "full", cantrips: 4 },
        "Druid": { hitDie: 8, primary: "wis", saves: ["int", "wis"], skills: ["Nature", "Survival"], equipment: ["Quarterstaff", "Leather Armor", "Shield"], spellcaster: true, spellStat: "wis", casterType: "full", cantrips: 2 },
        "Artificer": { hitDie: 8, primary: "int", saves: ["con", "int"], skills: ["Arcana", "Investigation"], equipment: ["Light Crossbow", "Dagger", "Scale Mail"], spellcaster: true, spellStat: "int", casterType: "half", cantrips: 2 }
    },
    // D&D 5e Spell Slot Tables
    // Full Caster table (Wizard, Cleric): slots by [characterLevel][spellLevel]
    fullCasterSlots: {
        1:  {1:2},
        2:  {1:3},
        3:  {1:4, 2:2},
        4:  {1:4, 2:3},
        5:  {1:4, 2:3, 3:2},
        6:  {1:4, 2:3, 3:3},
        7:  {1:4, 2:3, 3:3, 4:1},
        8:  {1:4, 2:3, 3:3, 4:2},
        9:  {1:4, 2:3, 3:3, 4:3, 5:1},
        10: {1:4, 2:3, 3:3, 4:3, 5:2},
        11: {1:4, 2:3, 3:3, 4:3, 5:2, 6:1},
        12: {1:4, 2:3, 3:3, 4:3, 5:2, 6:1},
        13: {1:4, 2:3, 3:3, 4:3, 5:2, 6:1, 7:1},
        14: {1:4, 2:3, 3:3, 4:3, 5:2, 6:1, 7:1},
        15: {1:4, 2:3, 3:3, 4:3, 5:2, 6:1, 7:1, 8:1},
        16: {1:4, 2:3, 3:3, 4:3, 5:2, 6:1, 7:1, 8:1},
        17: {1:4, 2:3, 3:3, 4:3, 5:2, 6:1, 7:1, 8:1, 9:1},
        18: {1:4, 2:3, 3:3, 4:3, 5:3, 6:1, 7:1, 8:1, 9:1},
        19: {1:4, 2:3, 3:3, 4:3, 5:3, 6:2, 7:1, 8:1, 9:1},
        20: {1:4, 2:3, 3:3, 4:3, 5:3, 6:2, 7:2, 8:1, 9:1}
    },
    // Half Caster table (Ranger): gets spellcasting at level 2
    halfCasterSlots: {
        1:  {},
        2:  {1:2},
        3:  {1:3},
        4:  {1:3},
        5:  {1:4, 2:2},
        6:  {1:4, 2:2},
        7:  {1:4, 2:3},
        8:  {1:4, 2:3},
        9:  {1:4, 2:3, 3:2},
        10: {1:4, 2:3, 3:2},
        11: {1:4, 2:3, 3:3},
        12: {1:4, 2:3, 3:3},
        13: {1:4, 2:3, 3:3, 4:1},
        14: {1:4, 2:3, 3:3, 4:1},
        15: {1:4, 2:3, 3:3, 4:2},
        16: {1:4, 2:3, 3:3, 4:2},
        17: {1:4, 2:3, 3:3, 4:3, 5:1},
        18: {1:4, 2:3, 3:3, 4:3, 5:1},
        19: {1:4, 2:3, 3:3, 4:3, 5:2},
        20: {1:4, 2:3, 3:3, 4:3, 5:2}
    },
    // Warlock Pact Magic (short rest recovery, fewer but higher-level slots)
    pactMagicSlots: {
        1:  {1:1}, 2:  {1:2}, 3:  {2:2}, 4:  {2:2}, 5:  {3:2},
        6:  {3:2}, 7:  {4:2}, 8:  {4:2}, 9:  {5:2}, 10: {5:2},
        11: {5:3}, 12: {5:3}, 13: {5:3}, 14: {5:3}, 15: {5:3},
        16: {5:3}, 17: {5:4}, 18: {5:4}, 19: {5:4}, 20: {5:4}
    },
    // Spell definitions
    spells: {
        // Cantrips (Level 0)
        "Fire Bolt": { level: 0, school: "Evocation", classes: ["Wizard", "Sorcerer", "Artificer"], damage: "1d10", damageType: "fire", range: 120, description: "Hurl a mote of fire at a creature. Make a ranged spell attack. On hit, deal fire damage.", scaling: "1d10 per 5 levels" },
        "Ray of Frost": { level: 0, school: "Evocation", classes: ["Wizard"], damage: "1d8", damageType: "cold", range: 60, description: "A frigid beam strikes a creature, dealing cold damage and reducing speed by 10ft.", scaling: "1d8 per 5 levels" },
        "Shocking Grasp": { level: 0, school: "Evocation", classes: ["Wizard"], damage: "1d8", damageType: "lightning", range: 5, description: "Lightning springs from your hand. Advantage vs metal armor. Target can't take reactions.", scaling: "1d8 per 5 levels" },
        "Sacred Flame": { level: 0, school: "Evocation", classes: ["Cleric"], damage: "1d8", damageType: "radiant", range: 60, save: "dex", description: "Flame descends on a creature. DEX save or take radiant damage. No cover bonus.", scaling: "1d8 per 5 levels" },
        "Toll the Dead": { level: 0, school: "Necromancy", classes: ["Cleric"], damage: "1d8", damageType: "necrotic", range: 60, save: "wis", description: "Point at a creature and a dolorous bell sounds. WIS save or take necrotic damage (1d12 if wounded).", scaling: "1d8 per 5 levels" },
        "Spare the Dying": { level: 0, school: "Necromancy", classes: ["Cleric"], healing: true, range: 5, description: "Touch a creature with 0 HP. It becomes stable." },
        "Light": { level: 0, school: "Evocation", classes: ["Cleric", "Wizard"], utility: true, range: 0, description: "Touch an object. It sheds bright light in 20ft radius for 1 hour." },
        "Mage Hand": { level: 0, school: "Conjuration", classes: ["Wizard"], utility: true, range: 30, description: "A spectral hand appears to manipulate objects up to 30 feet away." },
        // Ritual Spells
        "Detect Magic": { level: 1, school: "Divination", classes: ["Wizard", "Cleric", "Bard", "Druid", "Sorcerer", "Paladin", "Artificer"], utility: true, ritual: true, concentration: true, description: "Sense the presence of magic within 30 feet. Can be cast as a ritual (10 min, no spell slot)." },
        "Identify": { level: 1, school: "Divination", classes: ["Wizard", "Bard", "Artificer"], utility: true, ritual: true, description: "Learn the properties of a magic item or the effect of a spell on a creature/object. Can be cast as a ritual." },
        "Comprehend Languages": { level: 1, school: "Divination", classes: ["Wizard", "Bard", "Warlock"], utility: true, ritual: true, description: "Understand any spoken or written language for 1 hour. Can be cast as a ritual." },
        "Find Familiar": { level: 1, school: "Conjuration", classes: ["Wizard"], utility: true, ritual: true, description: "Summon a spirit that takes an animal form. Can be cast as a ritual (1 hour)." },
        "Speak with Animals": { level: 1, school: "Divination", classes: ["Druid", "Ranger", "Bard"], utility: true, ritual: true, description: "Communicate with beasts for 10 minutes. Can be cast as a ritual." },
        "Water Breathing": { level: 3, school: "Transmutation", classes: ["Wizard", "Druid", "Ranger", "Sorcerer", "Artificer"], utility: true, ritual: true, description: "Grant up to 10 creatures the ability to breathe underwater for 24 hours. Can be cast as a ritual." },
        
        // Level 1 Spells
        "Magic Missile": { level: 1, school: "Evocation", classes: ["Wizard", "Sorcerer"], damage: "3d4+3", damageType: "force", range: 120, autoHit: true, description: "Three darts of magical force strike targets automatically. Each dart deals 1d4+1 force damage." },
        "Burning Hands": { level: 1, school: "Evocation", classes: ["Wizard", "Sorcerer"], damage: "3d6", damageType: "fire", range: 15, aoe: "15ft cone", save: "dex", description: "Flames shoot from your fingers. Creatures in a 15ft cone must DEX save or take full damage, half on success." },
        "Shield": { level: 1, school: "Abjuration", classes: ["Wizard", "Sorcerer"], defensive: true, description: "Reaction: +5 AC until start of your next turn, including vs triggering attack. Blocks Magic Missile." },
        "Thunderwave": { level: 1, school: "Evocation", classes: ["Wizard", "Sorcerer", "Bard"], damage: "2d8", damageType: "thunder", range: 0, aoe: "15ft cube", save: "con", description: "Thunder crashes outward. Creatures in 15ft cube take thunder damage and are pushed 10ft. CON save for half, no push." },
        "Cure Wounds": { level: 1, school: "Evocation", classes: ["Cleric", "Paladin", "Druid", "Bard", "Artificer"], healing: "1d8", range: 5, description: "Touch a creature to restore 1d8 + spellcasting modifier HP." },
        "Healing Word": { level: 1, school: "Evocation", classes: ["Cleric", "Bard"], healing: "1d4", range: 60, bonus: true, description: "Bonus action: Speak a word of healing. Creature within 60ft regains 1d4 + modifier HP." },
        "Guiding Bolt": { level: 1, school: "Evocation", classes: ["Cleric"], damage: "4d6", damageType: "radiant", range: 120, description: "A flash of light streaks toward a creature. On hit, deal radiant damage and next attack has advantage." },
        "Bless": { level: 1, school: "Enchantment", classes: ["Cleric"], buff: true, concentration: true, description: "Up to 3 creatures add 1d4 to attack rolls and saving throws for 1 minute (concentration)." },
        "Inflict Wounds": { level: 1, school: "Necromancy", classes: ["Cleric"], damage: "3d10", damageType: "necrotic", range: 5, description: "Make a melee spell attack. On hit, deal massive necrotic damage." },
        "Hunter's Mark": { level: 1, school: "Divination", classes: ["Ranger"], buff: true, concentration: true, description: "Mark a creature. Deal +1d6 damage to it with weapon attacks. Track it easily. Lasts 1 hour (concentration)." },
        
        // Level 2 Spells
        "Scorching Ray": { level: 2, school: "Evocation", classes: ["Wizard"], damage: "2d6", damageType: "fire", range: 120, multiAttack: 3, description: "Create three rays of fire. Make a spell attack for each. Each ray deals 2d6 fire damage." },
        "Misty Step": { level: 2, school: "Conjuration", classes: ["Wizard", "Sorcerer", "Warlock"], utility: true, bonus: true, description: "Bonus action: Teleport up to 30 feet to an unoccupied space you can see." },
        "Hold Person": { level: 2, school: "Enchantment", classes: ["Wizard", "Cleric", "Bard", "Sorcerer", "Warlock"], save: "wis", description: "A humanoid must WIS save or be paralyzed for 1 minute. Repeat save at end of each turn." },
        "Spiritual Weapon": { level: 2, school: "Evocation", classes: ["Cleric"], damage: "1d8", damageType: "force", range: 60, bonus: true, description: "Create a floating weapon. Bonus action to attack with it each turn. Lasts 1 minute." },
        "Prayer of Healing": { level: 2, school: "Evocation", classes: ["Cleric"], healing: "2d8", outOfCombat: true, description: "Up to 6 creatures regain 2d8 + modifier HP. Takes 10 minutes to cast." },
        "Lesser Restoration": { level: 2, school: "Abjuration", classes: ["Cleric", "Ranger", "Bard", "Druid"], utility: true, description: "Touch a creature. End one disease, or blinded, deafened, paralyzed, or poisoned condition." },
        
        // Level 3 Spells
        "Fireball": { level: 3, school: "Evocation", classes: ["Wizard", "Sorcerer"], damage: "8d6", damageType: "fire", range: 150, aoe: "20ft sphere", save: "dex", description: "A bright streak explodes into a 20ft sphere of flame. DEX save for half damage." },
        "Lightning Bolt": { level: 3, school: "Evocation", classes: ["Wizard", "Sorcerer"], damage: "8d6", damageType: "lightning", range: 100, aoe: "100ft line", save: "dex", description: "A stroke of lightning 100ft long and 5ft wide blasts out. DEX save for half." },
        "Counterspell": { level: 3, school: "Abjuration", classes: ["Wizard", "Sorcerer", "Warlock"], utility: true, description: "Reaction: Attempt to interrupt a creature casting a spell. Automatically counters spells of 3rd level or lower." },
        "Spirit Guardians": { level: 3, school: "Conjuration", classes: ["Cleric"], damage: "3d8", damageType: "radiant", range: 0, aoe: "15ft radius", save: "wis", concentration: true, description: "Spirits swirl around you in a 15ft radius. Hostile creatures take 3d8 radiant damage (WIS save for half). Lasts 10 minutes (concentration)." },
        "Revivify": { level: 3, school: "Necromancy", classes: ["Cleric", "Paladin", "Druid", "Artificer"], healing: true, range: 5, description: "Touch a creature that has died within the last minute. It returns to life with 1 HP. Requires 300 gp worth of diamonds." },
        "Dispel Magic": { level: 3, school: "Abjuration", classes: ["Cleric", "Wizard", "Bard", "Sorcerer", "Warlock"], utility: true, description: "End one spell on a creature, object, or area. Spells of 3rd level or lower end automatically; higher ones require a check." },
        "Conjure Barrage": { level: 3, school: "Conjuration", classes: ["Ranger"], damage: "3d8", damageType: "slashing", range: 60, aoe: "60ft cone", save: "dex", description: "Throw a weapon or fire a piece of ammo that multiplies into a barrage. DEX save for half damage." },
        "Lightning Arrow": { level: 3, school: "Transmutation", classes: ["Ranger"], damage: "4d8", damageType: "lightning", range: 120, description: "Your next ranged attack transforms into a bolt of lightning. On hit, deal 4d8 lightning damage. Nearby creatures take 2d8 (DEX save for half)." },
        
        // Level 4 Spells
        "Greater Invisibility": { level: 4, school: "Illusion", classes: ["Wizard", "Bard", "Sorcerer"], buff: true, concentration: true, description: "You or a creature you touch becomes invisible for 1 minute (concentration). Attacking does not break it!" },
        "Wall of Fire": { level: 4, school: "Evocation", classes: ["Wizard"], damage: "5d8", damageType: "fire", range: 120, save: "dex", description: "Create a wall of fire up to 60ft long. One side deals 5d8 fire damage to creatures within 10ft (DEX save for half)." },
        "Ice Storm": { level: 4, school: "Evocation", classes: ["Wizard"], damage: "2d8+4d6", damageType: "cold", range: 300, aoe: "20ft cylinder", save: "dex", description: "Hail pounds a 20ft radius. Deals 2d8 bludgeoning + 4d6 cold (DEX save for half). Ground becomes difficult terrain." },
        "Guardian of Faith": { level: 4, school: "Conjuration", classes: ["Cleric"], damage: "20", damageType: "radiant", range: 30, description: "A Large spectral guardian appears. Hostile creatures within 10ft take 20 radiant damage (DEX save for half). Disappears after dealing 60 total damage." },
        "Death Ward": { level: 4, school: "Abjuration", classes: ["Cleric"], buff: true, range: 5, description: "Touch a creature. The first time it would drop to 0 HP, it drops to 1 HP instead. Lasts 8 hours." },
        "Freedom of Movement": { level: 4, school: "Abjuration", classes: ["Cleric", "Ranger"], buff: true, range: 5, description: "Touch a willing creature. Its movement is unaffected by difficult terrain, paralysis, or restraint. Lasts 1 hour." },
        
        // Level 5 Spells
        "Cone of Cold": { level: 5, school: "Evocation", classes: ["Wizard"], damage: "8d8", damageType: "cold", range: 60, aoe: "60ft cone", save: "con", description: "A blast of cold air erupts in a 60ft cone. CON save for half damage." },
        "Telekinesis": { level: 5, school: "Transmutation", classes: ["Wizard"], utility: true, concentration: true, description: "Gain the ability to move creatures or objects with your mind. Lasts 10 minutes (concentration)." },
        "Mass Cure Wounds": { level: 5, school: "Evocation", classes: ["Cleric", "Bard", "Druid"], healing: "3d8", range: 60, description: "A wave of healing energy washes out. Up to 6 creatures within 30ft regain 3d8 + modifier HP." },
        "Flame Strike": { level: 5, school: "Evocation", classes: ["Cleric"], damage: "4d6+4d6", damageType: "fire", range: 60, aoe: "10ft cylinder", save: "dex", description: "A vertical column of divine fire roars down. Deals 4d6 fire + 4d6 radiant damage. DEX save for half." },
        "Swift Quiver": { level: 5, school: "Transmutation", classes: ["Ranger"], buff: true, concentration: true, description: "Your quiver produces an endless supply of ammunition. Bonus action: make two ranged weapon attacks. Lasts 1 minute (concentration)." },
        // Paladin Spells
        "Divine Smite": { level: 1, school: "Evocation", classes: ["Paladin"], damage: "2d8", damageType: "radiant", range: 5, description: "Channel divine energy through your weapon strike. Deals 2d8 radiant damage (+1d8 per slot level above 1st, +1d8 vs undead/fiends)." },
        "Lay on Hands": { level: 0, school: "Evocation", classes: ["Paladin"], healing: "0", range: 5, description: "Your blessed touch can heal wounds. You have a pool of 5×Paladin level HP to restore." },
        "Thunderous Smite": { level: 1, school: "Evocation", classes: ["Paladin"], damage: "2d6", damageType: "thunder", range: 5, concentration: true, description: "Your weapon rings with thunder. On hit, deal extra 2d6 thunder damage and target must STR save or be pushed 10ft and knocked prone (concentration)." },
        "Shield of Faith": { level: 1, school: "Abjuration", classes: ["Paladin"], buff: true, concentration: true, description: "+2 AC to a creature you can see within 60 feet for up to 10 minutes (concentration)." },
        "Branding Smite": { level: 2, school: "Evocation", classes: ["Paladin"], damage: "2d6", damageType: "radiant", range: 5, concentration: true, description: "Your weapon gleams with astral radiance. On hit, extra 2d6 radiant damage. Invisible creatures become visible (concentration)." },
        // Warlock Spells
        "Eldritch Blast": { level: 0, school: "Evocation", classes: ["Warlock"], damage: "1d10", damageType: "force", range: 120, description: "A beam of crackling energy. Multiple beams at higher levels. The quintessential warlock cantrip.", scaling: "1d10 per 5 levels" },
        "Hex": { level: 1, school: "Enchantment", classes: ["Warlock"], buff: true, concentration: true, description: "Curse a creature. Deal +1d6 necrotic damage to it with your attacks. It has disadvantage on one ability check of your choice (concentration)." },
        "Armor of Agathys": { level: 1, school: "Abjuration", classes: ["Warlock"], buff: true, description: "Gain 5 temp HP. While you have these temp HP, creatures that hit you with melee take 5 cold damage." },
        "Hellish Rebuke": { level: 1, school: "Evocation", classes: ["Warlock"], damage: "2d10", damageType: "fire", range: 60, save: "dex", description: "Reaction: When damaged, point your finger and the creature is engulfed in flames. DEX save for half." },
        "Darkness": { level: 2, school: "Evocation", classes: ["Warlock"], utility: true, concentration: true, description: "Magical darkness fills a 15ft sphere. Creatures with darkvision can't see through it. Nonmagical light can't illuminate it (concentration)." },
        "Hunger of Hadar": { level: 3, school: "Conjuration", classes: ["Warlock"], damage: "2d6", damageType: "cold", range: 150, aoe: "20ft sphere", save: "dex", concentration: true, description: "Open a gateway to the void. 2d6 cold damage at start; 2d6 acid damage at end of turn in area (concentration)." },
        // Bard Spells
        "Vicious Mockery": { level: 0, school: "Enchantment", classes: ["Bard"], damage: "1d4", damageType: "psychic", range: 60, save: "wis", description: "You unleash a string of insults. WIS save or take psychic damage and have disadvantage on next attack.", scaling: "1d4 per 5 levels" },
        "Dissonant Whispers": { level: 1, school: "Enchantment", classes: ["Bard"], damage: "3d6", damageType: "psychic", range: 60, save: "wis", description: "You whisper a discordant melody. WIS save or take 3d6 psychic damage and must use reaction to flee." },
        "Faerie Fire": { level: 1, school: "Evocation", classes: ["Bard", "Druid", "Artificer"], buff: true, concentration: true, description: "Creatures in a 20ft cube are outlined in light. Affected creatures can't benefit from invisibility. Attacks against them have advantage (concentration)." },
        "Bardic Inspiration": { level: 0, school: "Enchantment", classes: ["Bard"], buff: true, description: "As a bonus action, give an ally a Bardic Inspiration die (1d6, increases at higher levels) to add to an attack, check, or save." },
        // Sorcerer Spells (shares many Wizard spells, add Sorcerer to existing + add unique ones)
        "Chaos Bolt": { level: 1, school: "Evocation", classes: ["Sorcerer"], damage: "2d8", damageType: "varies", range: 120, description: "Hurl an undulating mass of chaotic energy. 2d8+1d6 damage of a random type. If both d8s match, bolt leaps to another target." },
        "Chromatic Orb": { level: 1, school: "Evocation", classes: ["Sorcerer"], damage: "3d8", damageType: "varies", range: 90, description: "Hurl a 4-inch sphere of energy. Choose acid, cold, fire, lightning, poison, or thunder for the damage type." },
        // Druid Spells
        "Shillelagh": { level: 0, school: "Transmutation", classes: ["Druid"], buff: true, description: "A club or quarterstaff becomes a magical weapon. Uses WIS for attack/damage, deals 1d8 damage. Lasts 1 minute." },
        "Thorn Whip": { level: 0, school: "Transmutation", classes: ["Druid"], damage: "1d6", damageType: "piercing", range: 30, description: "A vine-like whip lashes out. On hit, deal 1d6 piercing and pull Large or smaller creature 10ft closer.", scaling: "1d6 per 5 levels" },
        "Entangle": { level: 1, school: "Conjuration", classes: ["Druid"], save: "str", concentration: true, description: "Grasping weeds and vines sprout in a 20ft square. STR save or be restrained. Lasts 1 minute (concentration)." },
        "Moonbeam": { level: 2, school: "Evocation", classes: ["Druid"], damage: "2d10", damageType: "radiant", range: 120, save: "con", concentration: true, description: "A silvery beam of pale light shines down. 2d10 radiant to creatures in the area. CON save for half (concentration)." },
        "Call Lightning": { level: 3, school: "Conjuration", classes: ["Druid"], damage: "3d10", damageType: "lightning", range: 120, save: "dex", concentration: true, description: "A storm cloud appears. Each turn, call down a bolt for 3d10 lightning damage. DEX save for half (concentration)." },
        // Monk Abilities (treated as spells for the system)
        "Flurry of Blows": { level: 0, school: "Martial", classes: ["Monk"], damage: "1d6", damageType: "bludgeoning", range: 5, description: "Spend 1 ki point after attacking to make two unarmed strikes as a bonus action." },
        "Patient Defense": { level: 0, school: "Martial", classes: ["Monk"], defensive: true, description: "Spend 1 ki point to take the Dodge action as a bonus action, imposing disadvantage on attacks against you." },
        "Step of the Wind": { level: 0, school: "Martial", classes: ["Monk"], utility: true, description: "Spend 1 ki point to take the Dash or Disengage action as a bonus action, and your jump distance is doubled." },
        // Artificer Spells
        "Mending": { level: 0, school: "Transmutation", classes: ["Artificer"], utility: true, description: "Repair a single break or tear in an object you touch." }
    },
    backgrounds: {
        "Soldier": { skills: ["Athletics", "Intimidation"], feature: "Military Rank" },
        "Scholar": { skills: ["Arcana", "History"], feature: "Researcher" },
        "Criminal": { skills: ["Deception", "Stealth"], feature: "Criminal Contact" },
        "Noble": { skills: ["History", "Persuasion"], feature: "Position of Privilege" },
        "Outlander": { skills: ["Athletics", "Survival"], feature: "Wanderer" },
        "Acolyte": { skills: ["Insight", "Religion"], feature: "Shelter of the Faithful" }
    },
    treasures: [
        { name: "Gold coins", getValue: () => Math.floor(Math.random() * 26) + 5 },
        { name: "Silver necklace", getValue: () => Math.floor(Math.random() * 16) + 10 },
        { name: "Gemstone", getValue: () => Math.floor(Math.random() * 51) + 25 },
        { name: "Ancient artifact", getValue: () => Math.floor(Math.random() * 101) + 50 },
        { name: "Healing Potion", getValue: () => 50, usable: true, effect: "heal" }
    ],
    weapons: {
        "Longsword": { damage: "1d8", type: "slashing", category: "martial", properties: ["versatile"], versatileDamage: "1d10", stat: "str" },
        "Shortsword": { damage: "1d6", type: "piercing", category: "martial", properties: ["finesse", "light"], stat: "dex" },
        "Greatsword": { damage: "2d6", type: "slashing", category: "martial", properties: ["two-handed", "heavy"], stat: "str" },
        "Greataxe": { damage: "1d12", type: "slashing", category: "martial", properties: ["two-handed", "heavy"], stat: "str" },
        "Battleaxe": { damage: "1d8", type: "slashing", category: "martial", properties: ["versatile"], versatileDamage: "1d10", stat: "str" },
        "Handaxes": { damage: "1d6", type: "slashing", category: "simple", properties: ["light", "thrown"], stat: "str" },
        "Rapier": { damage: "1d8", type: "piercing", category: "martial", properties: ["finesse"], stat: "dex" },
        "Scimitar": { damage: "1d6", type: "slashing", category: "martial", properties: ["finesse", "light"], stat: "dex" },
        "Dagger": { damage: "1d4", type: "piercing", category: "simple", properties: ["finesse", "light", "thrown"], stat: "dex" },
        "Mace": { damage: "1d6", type: "bludgeoning", category: "simple", properties: [], stat: "str" },
        "Warhammer": { damage: "1d8", type: "bludgeoning", category: "martial", properties: ["versatile"], versatileDamage: "1d10", stat: "str" },
        "Quarterstaff": { damage: "1d6", type: "bludgeoning", category: "simple", properties: ["versatile"], versatileDamage: "1d8", stat: "str" },
        "Longbow": { damage: "1d8", type: "piercing", category: "martial", properties: ["two-handed", "ranged"], stat: "dex", range: 150 },
        "Shortbow": { damage: "1d6", type: "piercing", category: "simple", properties: ["two-handed", "ranged"], stat: "dex", range: 80 },
        "Light Crossbow": { damage: "1d8", type: "piercing", category: "simple", properties: ["two-handed", "ranged", "loading"], stat: "dex", range: 80 },
        "Hand Crossbow": { damage: "1d6", type: "piercing", category: "martial", properties: ["light", "ranged", "loading"], stat: "dex", range: 30 },
        "Javelin": { damage: "1d6", type: "piercing", category: "simple", properties: ["thrown"], stat: "str", range: 30 },
        "Spear": { damage: "1d6", type: "piercing", category: "simple", properties: ["thrown", "versatile"], versatileDamage: "1d8", stat: "str" },
        "Flail": { damage: "1d8", type: "bludgeoning", category: "martial", properties: [], stat: "str" },
        "Morningstar": { damage: "1d8", type: "piercing", category: "martial", properties: [], stat: "str" },
        "Glaive": { damage: "1d10", type: "slashing", category: "martial", properties: ["two-handed", "reach", "heavy"], stat: "str" },
        "Halberd": { damage: "1d10", type: "slashing", category: "martial", properties: ["two-handed", "reach", "heavy"], stat: "str" },
        "Unarmed": { damage: "1d1", type: "bludgeoning", category: "simple", properties: [], stat: "str" },
        // +1 Magic Weapons (require attunement)
        "+1 Longsword": { damage: "1d8", type: "slashing", category: "martial", properties: ["versatile"], versatileDamage: "1d10", stat: "str", magicBonus: 1, requiresAttunement: true },
        "+1 Shortsword": { damage: "1d6", type: "piercing", category: "martial", properties: ["finesse", "light"], stat: "dex", magicBonus: 1, requiresAttunement: true },
        "+1 Greatsword": { damage: "2d6", type: "slashing", category: "martial", properties: ["two-handed", "heavy"], stat: "str", magicBonus: 1, requiresAttunement: true },
        "+1 Rapier": { damage: "1d8", type: "piercing", category: "martial", properties: ["finesse"], stat: "dex", magicBonus: 1, requiresAttunement: true },
        "+1 Battleaxe": { damage: "1d8", type: "slashing", category: "martial", properties: ["versatile"], versatileDamage: "1d10", stat: "str", magicBonus: 1, requiresAttunement: true },
        "+1 Longbow": { damage: "1d8", type: "piercing", category: "martial", properties: ["two-handed", "ranged"], stat: "dex", range: 150, magicBonus: 1, requiresAttunement: true },
        "+1 Warhammer": { damage: "1d8", type: "bludgeoning", category: "martial", properties: ["versatile"], versatileDamage: "1d10", stat: "str", magicBonus: 1, requiresAttunement: true },
        "+1 Mace": { damage: "1d6", type: "bludgeoning", category: "simple", properties: [], stat: "str", magicBonus: 1, requiresAttunement: true },
        // +2 Magic Weapons
        "+2 Longsword": { damage: "1d8", type: "slashing", category: "martial", properties: ["versatile"], versatileDamage: "1d10", stat: "str", magicBonus: 2, requiresAttunement: true },
        "+2 Greatsword": { damage: "2d6", type: "slashing", category: "martial", properties: ["two-handed", "heavy"], stat: "str", magicBonus: 2, requiresAttunement: true },
        "+2 Rapier": { damage: "1d8", type: "piercing", category: "martial", properties: ["finesse"], stat: "dex", magicBonus: 2, requiresAttunement: true },
        "+2 Battleaxe": { damage: "1d8", type: "slashing", category: "martial", properties: ["versatile"], versatileDamage: "1d10", stat: "str", magicBonus: 2, requiresAttunement: true },
        "+2 Longbow": { damage: "1d8", type: "piercing", category: "martial", properties: ["two-handed", "ranged"], stat: "dex", range: 150, magicBonus: 2, requiresAttunement: true },
        // +3 Magic Weapons
        "+3 Longsword": { damage: "1d8", type: "slashing", category: "martial", properties: ["versatile"], versatileDamage: "1d10", stat: "str", magicBonus: 3, requiresAttunement: true },
        "+3 Greatsword": { damage: "2d6", type: "slashing", category: "martial", properties: ["two-handed", "heavy"], stat: "str", magicBonus: 3, requiresAttunement: true },
        "+3 Rapier": { damage: "1d8", type: "piercing", category: "martial", properties: ["finesse"], stat: "dex", magicBonus: 3, requiresAttunement: true }
    },
    armor: {
        "Robes": { ac: 10, type: "none", maxDex: 99, stealthDisadvantage: false },
        "Padded Armor": { ac: 11, type: "light", maxDex: 99, stealthDisadvantage: true },
        "Leather Armor": { ac: 11, type: "light", maxDex: 99, stealthDisadvantage: false },
        "Studded Leather": { ac: 12, type: "light", maxDex: 99, stealthDisadvantage: false },
        "Hide Armor": { ac: 12, type: "medium", maxDex: 2, stealthDisadvantage: false },
        "Chain Shirt": { ac: 13, type: "medium", maxDex: 2, stealthDisadvantage: false },
        "Scale Mail": { ac: 14, type: "medium", maxDex: 2, stealthDisadvantage: true },
        "Breastplate": { ac: 14, type: "medium", maxDex: 2, stealthDisadvantage: false },
        "Half Plate": { ac: 15, type: "medium", maxDex: 2, stealthDisadvantage: true },
        "Ring Mail": { ac: 14, type: "heavy", maxDex: 0, stealthDisadvantage: true },
        "Chain Mail": { ac: 16, type: "heavy", maxDex: 0, stealthDisadvantage: true },
        "Splint Armor": { ac: 17, type: "heavy", maxDex: 0, stealthDisadvantage: true },
        "Plate Armor": { ac: 18, type: "heavy", maxDex: 0, stealthDisadvantage: true }
    },
    shields: {
        "Shield": { acBonus: 2 },
        "Tower Shield": { acBonus: 3, stealthDisadvantage: true }
    },
    // Campaign-specific equipment
    campaignItems: {
        "keep_on_borderlands": {
            weapons: {
                "Castellan's Blade": { damage: "1d8", type: "slashing", properties: ["versatile"], versatileDamage: "1d10", stat: "str", magicBonus: 1, description: "A +1 longsword gifted by the Castellan for exceptional service." },
                "Orc Cleaver": { damage: "1d10", type: "slashing", properties: ["two-handed", "heavy"], stat: "str", description: "A brutal two-handed weapon taken from an orc chieftain." },
                "Kobold Crossbow": { damage: "1d8", type: "piercing", properties: ["ranged", "loading"], stat: "dex", range: 80, description: "A light crossbow rigged with a kobold hair-trigger." },
                "Chaos Mace": { damage: "1d8", type: "bludgeoning", properties: [], stat: "str", magicBonus: 1, bonusDamageDice: "1d4", bonusDamageType: "necrotic", description: "A +1 mace crackling with dark energy from the Temple of Evil Chaos." },
                "Goblin Shortbow": { damage: "1d6", type: "piercing", properties: ["ranged", "light"], stat: "dex", range: 80, description: "A crude but effective goblin shortbow." }
            },
            armor: {
                "Guard's Chain": { ac: 16, type: "heavy", maxDex: 0, stealthDisadvantage: true, description: "Standard-issue chain mail from the Keep's armory." },
                "Orc Hide Armor": { ac: 13, type: "medium", maxDex: 2, stealthDisadvantage: false, description: "Crude armor pieced together from various hides by orcs." },
                "Temple Cult Robes": { ac: 11, type: "light", maxDex: 99, stealthDisadvantage: false, description: "Dark robes from the Temple of Evil Chaos. Faintly unsettling." },
                "Castellan's Plate": { ac: 18, type: "heavy", maxDex: 0, stealthDisadvantage: true, description: "Polished plate armor awarded to the Keep's greatest champion." }
            },
            shields: {
                "Keep Shield": { acBonus: 2, description: "A sturdy shield bearing the emblem of the Keep." }
            },
            consumables: {
                "Green Man Ale": { effect: "courage", description: "A hearty ale from the Green Man Inn. Grants advantage on fear saves for 1 hour." },
                "Chapel Holy Water": { effect: "damage_undead", description: "Blessed water from the Keep's chapel. Deals 2d6 radiant damage to undead." },
                "Frontier Rations": { effect: "heal", healAmount: "1d6", description: "Dried meats and hardtack from the Keep's stores." }
            },
            shopItems: ["Guard's Chain", "Orc Hide Armor", "Keep Shield", "Goblin Shortbow", "Green Man Ale", "Chapel Holy Water", "Frontier Rations"],
            lootItems: ["Orc Cleaver", "Kobold Crossbow", "Orc Hide Armor", "Green Man Ale", "Frontier Rations"],
            bossLoot: ["Castellan's Blade", "Chaos Mace", "Castellan's Plate", "Temple Cult Robes"]
        },
        "nights_dark_terror": {
            weapons: {
                "Karameikan Saber": { damage: "1d8", type: "slashing", properties: ["finesse"], stat: "dex", description: "A curved cavalry saber favored by Karameikan nobles." },
                "Goblin Cleaver": { damage: "1d8", type: "slashing", properties: ["light"], stat: "str", magicBonus: 1, bonusDamageVs: "goblinoid", bonusDamage: 1, description: "A jagged blade designed for fighting goblins. +1 weapon, +1 extra damage vs goblinoids." },
                "Wolf Fang Dagger": { damage: "1d4", type: "piercing", properties: ["finesse", "light", "thrown"], stat: "dex", description: "A dagger made from a dire wolf's fang." },
                "Iron Ring Whip": { damage: "1d4", type: "slashing", properties: ["finesse", "reach"], stat: "dex", description: "A cruel weapon used by Iron Ring slavers." },
                "Hutaakan Khopesh": { damage: "1d8", type: "slashing", properties: ["versatile"], versatileDamage: "1d10", stat: "str", magicBonus: 1, description: "An ancient curved blade from the Hutaakan ruins. A +1 magical weapon." }
            },
            armor: {
                "Karameikan Scale": { ac: 15, type: "medium", maxDex: 2, stealthDisadvantage: true, description: "Scale armor decorated with the Karameikan eagle." },
                "Wolfskin Cloak": { ac: 12, type: "light", maxDex: 99, stealthDisadvantage: false, description: "Armor made from dire wolf pelts. Grants cold resistance." },
                "Hutaakan Bronze Plate": { ac: 17, type: "heavy", maxDex: 0, stealthDisadvantage: true, description: "Ancient ceremonial armor from the Lost Valley." }
            },
            shields: {
                "Sukiskyn Buckler": { acBonus: 1, description: "A small shield bearing the Sukiskyn horse emblem." }
            },
            consumables: {
                "Karameikan Brandy": { effect: "courage", description: "Grants advantage on fear saves for 1 hour." },
                "Wolfsbane Potion": { effect: "wolfsbane", description: "Protects against lycanthrope curse for 24 hours." },
                "Hutaakan Healing Salve": { effect: "heal", healAmount: "3d4+3", description: "An ancient healing remedy from the Lost Valley." }
            },
            shopItems: ["Karameikan Saber", "Goblin Cleaver", "Wolf Fang Dagger", "Karameikan Scale", "Wolfskin Cloak", "Sukiskyn Buckler", "Karameikan Brandy", "Wolfsbane Potion"],
            lootItems: ["Wolf Fang Dagger", "Goblin Cleaver", "Wolfskin Cloak", "Iron Ring Whip", "Karameikan Brandy"],
            bossLoot: ["Karameikan Saber", "Hutaakan Khopesh", "Karameikan Scale", "Hutaakan Bronze Plate", "Hutaakan Healing Salve"]
        },
        "curse_of_strahd": {
            weapons: {
                "Silver Blade": { damage: "1d8", type: "slashing", properties: ["versatile"], versatileDamage: "1d10", stat: "str", magicBonus: 1, description: "A silvered longsword. +1 weapon. Full damage against undead and lycanthropes." },
                "Vampire Hunter's Stake": { damage: "1d4", type: "piercing", properties: ["finesse", "light"], stat: "dex", description: "A wooden stake blessed by the Morning Lord. Critical hits vs vampires are instant kills." },
                "Barovian Crossbow": { damage: "1d10", type: "piercing", properties: ["two-handed", "ranged", "loading"], stat: "dex", range: 100, description: "A heavy crossbow designed for hunting monsters." },
                "Sunsword Replica": { damage: "1d10", type: "radiant", properties: ["versatile"], versatileDamage: "1d12", stat: "str", magicBonus: 2, bonusDamageVs: "undead", bonusDamageDice: "1d6", description: "A blade that glows with faint sunlight. +2 weapon, +1d6 radiant vs undead." },
                "Ravenloft Mace": { damage: "1d8", type: "bludgeoning", properties: [], stat: "str", magicBonus: 1, description: "A mace bearing the symbol of the Morning Lord. A +1 magical weapon." }
            },
            armor: {
                "Vistani Leathers": { ac: 12, type: "light", maxDex: 99, stealthDisadvantage: false, description: "Supple leather armor worn by Vistani travelers." },
                "Vampire Hunter's Coat": { ac: 13, type: "light", maxDex: 99, stealthDisadvantage: false, description: "A reinforced leather coat with hidden stakes and holy symbols." },
                "Knight of the Order Armor": { ac: 18, type: "heavy", maxDex: 0, stealthDisadvantage: true, description: "Plate armor from the Order of the Silver Dragon." },
                "Strahd's Dark Gift": { ac: 16, type: "medium", maxDex: 2, stealthDisadvantage: false, description: "Cursed armor that grants power at a terrible cost." }
            },
            shields: {
                "Holy Shield": { acBonus: 2, description: "A shield emblazoned with the symbol of the Morning Lord. Glows faintly." },
                "Silver Dragon Shield": { acBonus: 3, description: "A shield from the Order of the Silver Dragon." }
            },
            consumables: {
                "Holy Water": { effect: "damage_undead", description: "Deals 2d6 radiant damage to undead. Can be thrown." },
                "Garlic Necklace": { effect: "vampire_ward", description: "Vampires have disadvantage on attacks against the wearer." },
                "Purple Grapemash Wine": { effect: "heal", healAmount: "1d4", description: "Barovian wine. Not great, but it takes the edge off." },
                "Morning Lord's Blessing": { effect: "heal", healAmount: "4d4+4", description: "A blessed vial that heals and removes curses." }
            },
            shopItems: ["Silver Blade", "Vampire Hunter's Stake", "Barovian Crossbow", "Vistani Leathers", "Vampire Hunter's Coat", "Holy Shield", "Holy Water", "Garlic Necklace"],
            lootItems: ["Vampire Hunter's Stake", "Purple Grapemash Wine", "Vistani Leathers", "Holy Water", "Garlic Necklace"],
            bossLoot: ["Silver Blade", "Sunsword Replica", "Ravenloft Mace", "Knight of the Order Armor", "Silver Dragon Shield", "Morning Lord's Blessing"]
        },
        "tomb_of_annihilation": {
            weapons: {
                "Chultan Machete": { damage: "1d6", type: "slashing", properties: ["light", "finesse"], stat: "dex", description: "A jungle blade essential for cutting through vegetation." },
                "Dinosaur Bone Club": { damage: "1d8", type: "bludgeoning", properties: ["versatile"], versatileDamage: "1d10", stat: "str", description: "A massive club made from a T-Rex femur." },
                "Yklwa": { damage: "1d8", type: "piercing", properties: ["thrown"], stat: "str", range: 30, description: "A traditional Chultan short spear." },
                "Pterafolk Wing Blade": { damage: "1d6", type: "slashing", properties: ["finesse", "light"], stat: "dex", description: "A curved blade made from pterafolk wing bones." },
                "Trickster God Blade": { damage: "1d10", type: "necrotic", properties: ["versatile"], versatileDamage: "1d12", stat: "str", magicBonus: 2, description: "A blade touched by the Nine Gods. +2 weapon. Unpredictable magic." },
                "Yuan-ti Fang Sword": { damage: "1d8", type: "piercing", properties: ["finesse"], stat: "dex", magicBonus: 1, bonusDamageDice: "1d4", bonusDamageType: "poison", description: "A serpentine blade coated with poison. +1 weapon, extra 1d4 poison damage on hit." }
            },
            armor: {
                "Jungle Explorer's Gear": { ac: 11, type: "light", maxDex: 99, stealthDisadvantage: false, description: "Light armor designed for jungle travel. Resists humidity." },
                "Dinosaur Hide Armor": { ac: 14, type: "medium", maxDex: 2, stealthDisadvantage: false, description: "Armor crafted from dinosaur scales." },
                "Yuan-ti Scale Mail": { ac: 15, type: "medium", maxDex: 2, stealthDisadvantage: true, description: "Armor made from shed yuan-ti scales." },
                "Tomb Guardian Plate": { ac: 19, type: "heavy", maxDex: 0, stealthDisadvantage: true, description: "Ancient armor from the Tomb of the Nine Gods." }
            },
            shields: {
                "Turtle Shell Shield": { acBonus: 2, description: "A shield made from a giant turtle shell." },
                "Omu Relic Shield": { acBonus: 3, description: "An ancient shield bearing symbols of the Nine Gods." }
            },
            consumables: {
                "Tej (Honey Wine)": { effect: "heal", healAmount: "1d6", description: "Sweet Chultan honey wine. Refreshing!" },
                "Antivenom": { effect: "cure_poison", description: "Cures poison and grants immunity for 1 hour." },
                "Insect Repellent": { effect: "insect_ward", description: "Keeps jungle insects away for 8 hours." },
                "Rain Catcher Rations": { effect: "heal", healAmount: "2d4", description: "Preserved rations designed for jungle survival." },
                "Spirit of Ubtao": { effect: "heal", healAmount: "4d4+4", description: "A blessed potion from Chultan priests. Also removes curses." }
            },
            shopItems: ["Chultan Machete", "Yklwa", "Dinosaur Bone Club", "Jungle Explorer's Gear", "Dinosaur Hide Armor", "Turtle Shell Shield", "Tej (Honey Wine)", "Antivenom", "Insect Repellent"],
            lootItems: ["Chultan Machete", "Yklwa", "Pterafolk Wing Blade", "Jungle Explorer's Gear", "Tej (Honey Wine)", "Insect Repellent", "Rain Catcher Rations"],
            bossLoot: ["Trickster God Blade", "Yuan-ti Fang Sword", "Dinosaur Hide Armor", "Yuan-ti Scale Mail", "Tomb Guardian Plate", "Omu Relic Shield", "Spirit of Ubtao"]
        },
        "lost_mine_of_phandelver": {
            weapons: {
                "Talon" : { damage: "1d8", type: "slashing", properties: ["versatile"], versatileDamage: "1d10", stat: "str", magicBonus: 1, description: "A +1 longsword found in the Redbrand hideout. Its blade glows faintly blue." },
                "Hew": { damage: "1d10", type: "slashing", properties: ["two-handed", "heavy"], stat: "str", magicBonus: 1, bonusDamageVs: "plant", bonusDamage: 2, description: "A +1 battleaxe made for a human hero long ago. It was used to clear forests. Extra damage vs plant creatures." },
                "Lightbringer": { damage: "1d6", type: "bludgeoning", properties: ["versatile"], versatileDamage: "1d8", stat: "str", magicBonus: 1, bonusDamageDice: "1d6", bonusDamageType: "radiant", description: "A +1 mace that glows bright as a torch on command. Extra 1d6 radiant damage vs undead." },
                "Dragonguard Halberd": { damage: "1d10", type: "slashing", properties: ["two-handed", "heavy", "reach"], stat: "str", magicBonus: 1, description: "A +1 halberd etched with dragon imagery from Cragmaw Castle." },
                "Spider Staff": { damage: "1d6", type: "bludgeoning", properties: ["versatile"], versatileDamage: "1d8", stat: "str", magicBonus: 1, description: "Nezznar's staff, carved to resemble black spider legs. +1 quarterstaff." }
            },
            armor: {
                "Redbrand Cloak": { ac: 12, type: "light", maxDex: 99, stealthDisadvantage: false, description: "Dyed red leather armor worn by Redbrand thugs." },
                "Miner's Breastplate": { ac: 14, type: "medium", maxDex: 2, stealthDisadvantage: false, description: "Reinforced breastplate made for the miners of Wave Echo Cave." },
                "Dragonguard": { ac: 17, type: "heavy", maxDex: 0, stealthDisadvantage: true, description: "A suit of armor adorned with dragon motifs. Grants advantage on saves vs. dragon breath." }
            },
            shields: {
                "Phandalin Shield": { acBonus: 2, description: "A sturdy wooden shield painted with the Phandalin coat of arms." }
            },
            consumables: {
                "Healing Potion (Phandalin)": { effect: "heal", healAmount: "2d4+2", description: "A standard healing potion from Barthen's Provisions." },
                "Stonehill Special Ale": { effect: "courage", description: "Toblen's special brew. Grants advantage on fear saves for 1 hour." },
                "Scroll of Augury": { effect: "divination", description: "A scroll from Sister Garaele. Reveals whether a course of action will be beneficial." }
            },
            shopItems: ["Redbrand Cloak", "Miner's Breastplate", "Phandalin Shield", "Healing Potion (Phandalin)", "Stonehill Special Ale", "Scroll of Augury"],
            lootItems: ["Redbrand Cloak", "Healing Potion (Phandalin)", "Stonehill Special Ale"],
            bossLoot: ["Talon", "Hew", "Lightbringer", "Dragonguard Halberd", "Spider Staff", "Dragonguard", "Miner's Breastplate"]
        }
    },
    // Shop prices for equipment
    shopPrices: {
        // Weapons
        "Dagger": 2,
        "Handaxes": 5,
        "Javelin": 5,
        "Mace": 5,
        "Quarterstaff": 2,
        "Spear": 1,
        "Light Crossbow": 25,
        "Shortbow": 25,
        "Shortsword": 10,
        "Scimitar": 25,
        "Rapier": 25,
        "Longsword": 15,
        "Battleaxe": 10,
        "Flail": 10,
        "Morningstar": 15,
        "Warhammer": 15,
        "Longbow": 50,
        "Hand Crossbow": 75,
        "Glaive": 20,
        "Halberd": 20,
        "Greatsword": 50,
        "Greataxe": 30,
        // +1 Magic Weapons (uncommon - ~500gp per DMG)
        "+1 Longsword": 500,
        "+1 Shortsword": 500,
        "+1 Greatsword": 500,
        "+1 Rapier": 500,
        "+1 Battleaxe": 500,
        "+1 Longbow": 500,
        "+1 Warhammer": 500,
        "+1 Mace": 500,
        // +2 Magic Weapons (rare - ~2000gp per DMG)
        "+2 Longsword": 2000,
        "+2 Greatsword": 2000,
        "+2 Rapier": 2000,
        "+2 Battleaxe": 2000,
        "+2 Longbow": 2000,
        // +3 Magic Weapons (very rare - ~10000gp per DMG)
        "+3 Longsword": 10000,
        "+3 Greatsword": 10000,
        "+3 Rapier": 10000,
        // Armor
        "Padded Armor": 5,
        "Leather Armor": 10,
        "Studded Leather": 45,
        "Hide Armor": 10,
        "Chain Shirt": 50,
        "Scale Mail": 50,
        "Breastplate": 400,
        "Half Plate": 750,
        "Ring Mail": 30,
        "Chain Mail": 75,
        "Splint Armor": 200,
        "Plate Armor": 1500,
        // Shields
        "Shield": 10,
        "Tower Shield": 50,
        // Consumables
        "Healing Potion": 50,
        "Greater Healing Potion": 150,
        "Antidote": 25,
        "Torch": 1,
        "Rope (50 ft)": 1,
        "Rations (1 day)": 1,
        // Campaign-specific items - Night's Dark Terror
        "Karameikan Saber": 40,
        "Goblin Cleaver": 30,
        "Wolf Fang Dagger": 15,
        "Iron Ring Whip": 20,
        "Hutaakan Khopesh": 100,
        "Karameikan Scale": 150,
        "Wolfskin Cloak": 75,
        "Hutaakan Bronze Plate": 500,
        "Sukiskyn Buckler": 15,
        "Karameikan Brandy": 10,
        "Wolfsbane Potion": 50,
        "Hutaakan Healing Salve": 100,
        // Campaign-specific items - Curse of Strahd
        "Silver Blade": 150,
        "Vampire Hunter's Stake": 25,
        "Barovian Crossbow": 100,
        "Sunsword Replica": 500,
        "Ravenloft Mace": 75,
        "Vistani Leathers": 50,
        "Vampire Hunter's Coat": 200,
        "Knight of the Order Armor": 1500,
        "Strahd's Dark Gift": 0, // Cannot be bought - only found
        "Holy Shield": 100,
        "Silver Dragon Shield": 300,
        "Holy Water": 25,
        "Garlic Necklace": 10,
        "Purple Grapemash Wine": 3,
        "Morning Lord's Blessing": 200,
        // Campaign-specific items - Tomb of Annihilation
        "Chultan Machete": 10,
        "Dinosaur Bone Club": 30,
        "Yklwa": 5,
        "Pterafolk Wing Blade": 25,
        "Trickster God Blade": 0, // Cannot be bought - only found
        "Yuan-ti Fang Sword": 250,
        "Jungle Explorer's Gear": 25,
        "Dinosaur Hide Armor": 200,
        "Yuan-ti Scale Mail": 300,
        "Tomb Guardian Plate": 0, // Cannot be bought - only found
        "Turtle Shell Shield": 35,
        "Omu Relic Shield": 0, // Cannot be bought - only found
        "Tej (Honey Wine)": 5,
        "Antivenom": 50,
        "Insect Repellent": 10,
        "Rain Catcher Rations": 5,
        "Spirit of Ubtao": 200
    },
    // Detailed item descriptions for shop display
    itemDescriptions: {
        // Weapons
        "Dagger": "A small blade perfect for close combat or throwing. Light and concealable.",
        "Handaxes": "A pair of small throwing axes. Can be used in melee or thrown at enemies.",
        "Javelin": "A light spear designed for throwing. Good range for a simple weapon.",
        "Mace": "A heavy club with a metal head. Effective against armored foes.",
        "Quarterstaff": "A versatile wooden staff. Can be wielded one or two-handed.",
        "Spear": "A simple polearm with a pointed tip. Can be thrown or used in melee.",
        "Light Crossbow": "A mechanical ranged weapon. Easy to use but slow to reload.",
        "Shortbow": "A compact bow for quick shots. Requires two hands to use.",
        "Shortsword": "A nimble blade favored by rogues. Quick and precise.",
        "Scimitar": "A curved blade with a slashing edge. Light and elegant.",
        "Rapier": "A thin, pointed blade for precise thrusts. The duelist's weapon.",
        "Longsword": "The classic knight's weapon. Versatile and reliable.",
        "Battleaxe": "A heavy axe that cleaves through armor. Can be used one or two-handed.",
        "Flail": "A spiked ball on a chain. Difficult to parry.",
        "Morningstar": "A spiked club that deals piercing damage. Brutal and effective.",
        "Warhammer": "A heavy hammer for crushing blows. Excellent against undead.",
        "Longbow": "A tall bow with excellent range. The archer's weapon of choice.",
        "Hand Crossbow": "A small crossbow that can be used one-handed. Popular with rogues.",
        "Glaive": "A blade on a long pole. Excellent reach in combat.",
        "Halberd": "An axe-blade on a pole with a spike. Versatile polearm.",
        "Greatsword": "A massive two-handed sword. Devastating damage potential.",
        "Greataxe": "An enormous axe requiring two hands. Maximum damage per swing.",
        // Magic Weapons
        "Longsword +1": "A magically enhanced longsword. +1 to attack and damage rolls.",
        "Longsword +2": "A finely enchanted longsword. +2 to attack and damage rolls.",
        "Longsword +3": "A legendary longsword crackling with power. +3 to attack and damage rolls.",
        "Shortsword +1": "A magically sharp shortsword. +1 to attack and damage rolls.",
        "Shortsword +2": "A finely enchanted shortsword. +2 to attack and damage rolls.",
        "Shortsword +3": "A legendary shortsword of incredible sharpness. +3 to attack and damage rolls.",
        "Greatsword +1": "A magically enhanced greatsword. +1 to attack and damage rolls.",
        "Greatsword +2": "A finely enchanted greatsword. +2 to attack and damage rolls.",
        "Greatsword +3": "A legendary greatsword of devastating power. +3 to attack and damage rolls.",
        "Rapier +1": "A magically keen rapier. +1 to attack and damage rolls.",
        "Rapier +2": "A finely enchanted rapier. +2 to attack and damage rolls.",
        "Rapier +3": "A legendary rapier of perfect balance. +3 to attack and damage rolls.",
        "Battleaxe +1": "A magically enhanced battleaxe. +1 to attack and damage rolls.",
        "Battleaxe +2": "A finely enchanted battleaxe. +2 to attack and damage rolls.",
        "Battleaxe +3": "A legendary battleaxe of cleaving might. +3 to attack and damage rolls.",
        "Longbow +1": "A magically enhanced longbow. +1 to attack and damage rolls.",
        "Longbow +2": "A finely enchanted longbow. +2 to attack and damage rolls.",
        "Longbow +3": "A legendary longbow of unerring aim. +3 to attack and damage rolls.",
        "Warhammer +1": "A magically enhanced warhammer. +1 to attack and damage rolls.",
        "Warhammer +2": "A finely enchanted warhammer. +2 to attack and damage rolls.",
        "Warhammer +3": "A legendary warhammer of crushing force. +3 to attack and damage rolls.",
        "Mace +1": "A magically enhanced mace. +1 to attack and damage rolls.",
        "Mace +2": "A finely enchanted mace. +2 to attack and damage rolls.",
        "Mace +3": "A legendary mace of divine might. +3 to attack and damage rolls.",
        // Armor
        "Padded Armor": "Quilted layers of cloth. Better than nothing.",
        "Leather Armor": "Cured leather protection. Light and flexible.",
        "Studded Leather": "Leather reinforced with metal rivets. Good protection, still flexible.",
        "Hide Armor": "Thick animal hides. Crude but effective.",
        "Chain Shirt": "A shirt of interlocking metal rings. Good balance of protection and mobility.",
        "Scale Mail": "Overlapping metal scales. Solid medium armor.",
        "Breastplate": "A fitted metal chestpiece. Excellent protection without bulk.",
        "Half Plate": "A breastplate with arm and leg guards. Heavy but protective.",
        "Ring Mail": "Leather with metal rings sewn on. Budget heavy armor.",
        "Chain Mail": "Full body chainmail. Classic knight's armor.",
        "Splint Armor": "Metal strips riveted to leather. Strong heavy armor.",
        "Plate Armor": "Full plate protection. The ultimate in defense.",
        // Shields
        "Shield": "A standard wooden shield. +2 AC when equipped.",
        "Tower Shield": "A large shield offering extra cover. +3 AC when equipped.",
        // Consumables
        "Healing Potion": "Restores 2d4+2 HP when consumed. Essential for adventurers.",
        "Greater Healing Potion": "Restores 4d4+4 HP when consumed. For serious injuries.",
        "Antidote": "Cures poison effects. Keep one handy in dangerous areas.",
        "Torch": "Provides light in dark places. Burns for 1 hour.",
        "Rope (50 ft)": "Useful for climbing, tying, and various adventuring needs.",
        "Rations (1 day)": "A day's worth of dried food. Keeps you fed on the road.",
        // Campaign items - Night's Dark Terror
        "Karameikan Saber": "A curved cavalry blade from Karameikos. Favored by horse traders.",
        "Goblin Cleaver": "A brutal weapon designed to dispatch goblins efficiently.",
        "Wolf Fang Dagger": "A dagger made from dire wolf fangs. Intimidating and sharp.",
        "Iron Ring Whip": "The slaver's weapon. Deals extra damage to restrained targets.",
        "Hutaakan Khopesh": "An ancient blade from the dog-headed Hutaakans. Magical.",
        "Karameikan Scale": "Traditional scale armor of Karameikan soldiers.",
        "Wolfskin Cloak": "A cloak made from dire wolf pelts. Grants cold resistance.",
        "Hutaakan Bronze Plate": "Ancient bronze armor with mystical properties.",
        "Sukiskyn Buckler": "A small shield crafted by the Sukiskyn family.",
        "Karameikan Brandy": "Strong spirits that grant courage. +1 to saves vs fear.",
        "Wolfsbane Potion": "Repels wolves and werewolves. Useful in the Dymrak Forest.",
        "Hutaakan Healing Salve": "Ancient healing paste. Restores 3d4+3 HP.",
        // Campaign items - Curse of Strahd
        "Silver Blade": "A silver-plated sword. Effective against werewolves and undead.",
        "Vampire Hunter's Stake": "Wooden stake. Destroys vampires when staked through the heart.",
        "Barovian Crossbow": "A crossbow crafted in Barovia. Reliable in the mists.",
        "Sunsword Replica": "A blade enchanted to glow like sunlight. Vampires hate it.",
        "Ravenloft Mace": "A blessed mace effective against undead creatures.",
        "Vistani Leathers": "Supple leathers worn by the Vistani people.",
        "Vampire Hunter's Coat": "Armored coat with hidden pockets for stakes and holy water.",
        "Knight of the Order Armor": "Plate armor of the Order of the Silver Dragon.",
        "Holy Shield": "A blessed shield that provides protection against evil.",
        "Silver Dragon Shield": "A shield bearing the mark of the Silver Dragon order.",
        "Holy Water": "Blessed water that burns undead. Throw it at vampires!",
        "Garlic Necklace": "A necklace of garlic cloves. Vampires keep their distance.",
        "Purple Grapemash Wine": "Barovian wine. Tastes terrible but calms nerves.",
        "Morning Lord's Blessing": "A vial of blessed light. Powerful against undead.",
        // Campaign items - Tomb of Annihilation
        "Chultan Machete": "A broad blade for cutting through jungle. +1 in wilderness.",
        "Dinosaur Bone Club": "A club made from T-Rex bone. Surprisingly effective.",
        "Yklwa": "A Chultan short spear. Traditional tribal weapon.",
        "Pterafolk Wing Blade": "A curved blade made from pterafolk wing-bone.",
        "Yuan-ti Fang Sword": "A serpentine blade that can envenom enemies.",
        "Jungle Explorer's Gear": "Light armor optimized for jungle travel.",
        "Dinosaur Hide Armor": "Armor made from dinosaur scales. Tough and exotic.",
        "Yuan-ti Scale Mail": "Serpent-themed armor with magical properties.",
        "Turtle Shell Shield": "A shield made from a giant turtle shell.",
        "Tej (Honey Wine)": "Sweet Chultan honey wine. Provides temporary HP.",
        "Antivenom": "Cures poison. Essential in Chult's snake-filled jungles.",
        "Insect Repellent": "Keeps insects at bay. Reduces disease chance.",
        "Rain Catcher Rations": "Special rations that collect rainwater. Never go thirsty.",
        "Spirit of Ubtao": "A blessed totem. Provides guidance in the jungle."
    },
    // Loot tables by danger level
    lootTables: {
        // Danger 1 enemies (weak)
        1: {
            weapons: ["Dagger", "Handaxes", "Quarterstaff", "Spear", "Shortbow"],
            armor: ["Padded Armor", "Leather Armor", "Hide Armor"],
            shields: ["Shield"],
            goldRange: [1, 10],
            dropChance: 0.3
        },
        // Danger 2 enemies (moderate)
        2: {
            weapons: ["Shortsword", "Scimitar", "Mace", "Longsword", "Battleaxe", "Light Crossbow"],
            armor: ["Leather Armor", "Studded Leather", "Chain Shirt", "Scale Mail", "Hide Armor"],
            shields: ["Shield"],
            goldRange: [5, 25],
            dropChance: 0.4
        },
        // Danger 3 enemies (dangerous)
        3: {
            weapons: ["Longsword", "Rapier", "Battleaxe", "Warhammer", "Longbow", "Morningstar", "Flail", "+1 Longsword", "+1 Shortsword"],
            armor: ["Scale Mail", "Chain Shirt", "Breastplate", "Chain Mail", "Ring Mail"],
            shields: ["Shield", "Tower Shield"],
            goldRange: [10, 50],
            dropChance: 0.5
        },
        // Danger 4 enemies (very dangerous)
        4: {
            weapons: ["Greatsword", "Greataxe", "Glaive", "Halberd", "Longbow", "Hand Crossbow", "+1 Greatsword", "+1 Rapier", "+1 Battleaxe", "+1 Longbow"],
            armor: ["Breastplate", "Half Plate", "Chain Mail", "Splint Armor"],
            shields: ["Shield", "Tower Shield"],
            goldRange: [25, 100],
            dropChance: 0.6
        },
        // Danger 5 enemies (bosses)
        5: {
            weapons: ["Greatsword", "Greataxe", "Glaive", "Halberd", "+2 Longsword", "+2 Greatsword", "+2 Rapier", "+2 Battleaxe"],
            armor: ["Half Plate", "Splint Armor", "Plate Armor"],
            shields: ["Tower Shield"],
            goldRange: [50, 200],
            dropChance: 0.8
        }
    },
    // Treasure chest contents by location danger
    chestLoot: {
        common: {
            items: ["Healing Potion", "Torch", "Rope (50 ft)", "Rations (1 day)", "Antidote"],
            goldRange: [5, 20]
        },
        uncommon: {
            items: ["Healing Potion", "Greater Healing Potion", "Dagger", "Shortsword", "Leather Armor", "Shield"],
            goldRange: [15, 50]
        },
        rare: {
            items: ["Greater Healing Potion", "Longsword", "Rapier", "Chain Mail", "Breastplate", "Longbow"],
            goldRange: [30, 100]
        },
        epic: {
            items: ["Greater Healing Potion", "Greatsword", "Plate Armor", "Half Plate", "Tower Shield"],
            goldRange: [75, 250]
        }
    }
};

class Character {
    constructor() {
        this.name = "";
        this.race = "";
        this.charClass = "";
        this.background = "";
        this.subclass = null; // Chosen at level 3 (e.g., "Champion", "Evocation")
        this.subclassFeatures = {}; // Active subclass feature state
        this.level = 1;
        this.experience = 0;
        this.stats = { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 };
        this.hp = 0;
        this.maxHp = 0;
        this.ac = 10;
        this.inventory = [];
        this.gold = 0;
        this.traits = [];
        this.skills = [];
        // Equipment slots
        this.equipped = {
            weapon: null,
            armor: null,
            shield: null
        };
        // Spell system
        this.spells = {
            cantrips: [],
            known: [],
            slots: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 },
            slotsUsed: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 }
        };
        // Combat buffs
        this.buffs = {
            shieldActive: false,
            blessActive: false,
            huntersMark: false,
            guidingBolt: false  // Next attack has advantage
        };
        // Death saving throws
        this.deathSaves = {
            successes: 0,
            failures: 0,
            stable: false
        };
        // Conditions system
        this.conditions = {
            poisoned: false,
            frightened: false,
            paralyzed: false,
            blinded: false,
            prone: false,
            restrained: false,
            stunned: false
        };
        // Rest system
        this.hitDice = { current: 1, max: 1 };
        this.longRestTaken = false;
        // Crafting materials
        this.materials = {};
        // Reputation with factions
        this.reputation = {};
        // Quest journal
        this.journal = {
            quests: [],
            npcs: [],
            lore: []
        };
        // Extra Attack tracking
        this.extraAttack = false;
        this.extraAttackCount = 1; // Number of extra attacks (Fighter gets more)
        // Rage tracking (Barbarian)
        this.raging = false;
        this.ragesRemaining = 0;
        // Inspiration system
        this.inspiration = false;
        // Exhaustion system (0-6 levels)
        this.exhaustion = 0;
        // Encumbrance tracking
        this.carryCapacity = 0; // Will be calculated based on STR
        // Character personality for roleplay
        this.personality = {
            trait: "",
            ideal: "",
            bond: "",
            flaw: ""
        };
        // Character voice patterns
        this.voiceStyle = "";
        // NPC relationships tracking
        this.relationships = {}; // NPC name -> relationship level (-100 to 100)
        // Concentration tracking for spells
        this.concentrating = null; // Spell name if concentrating
        // Feats system
        this.feats = [];
        this.featData = {}; // Runtime data for feats (lucky points, etc.)
        // Bonus action resources
        this.secondWindUsed = false; // Fighter: resets on short rest
        // Skill proficiency system (proper D&D 5e)
        this.skillProficiencies = {}; // { "Perception": true, "Stealth": true, ... }
        this.expertise = {}; // Double proficiency: { "Stealth": true, ... }
        // Attunement system
        this.attunedItems = []; // Max 3 attuned magic items
        // Racial ability tracking
        this.racialAbilities = {}; // { breathWeaponUsed: false, relentlessUsed: false, ... }
        // Darkvision range (0 for races without it)
        this.darkvisionRange = 0;
        // Downtime tracking
        this.downtime = {
            daysAvailable: 0,
            currentActivity: null,
            progress: 0
        };
    }

    rollStats() {
        for (let stat in this.stats) {
            const rolls = Array(4).fill(0).map(() => Math.floor(Math.random() * 6) + 1);
            rolls.sort((a, b) => b - a);
            this.stats[stat] = rolls[0] + rolls[1] + rolls[2];
        }
    }

    applyRacialBonus() {
        const bonuses = GAME_DATA.races[this.race].bonus;
        if (bonuses.all) {
            for (let stat in this.stats) {
                this.stats[stat] += bonuses.all;
            }
        } else {
            for (let stat in bonuses) {
                this.stats[stat] += bonuses[stat];
            }
        }
        this.traits = [...GAME_DATA.races[this.race].traits];
        
        // Set darkvision based on race
        if (this.traits.includes("Darkvision")) {
            this.darkvisionRange = 60;
        }
        
        // Initialize racial ability tracking
        this.racialAbilities = {};
        if (this.race === "Dragonborn") {
            this.racialAbilities.breathWeaponUsed = false;
            // Determine breath weapon type (fire by default)
            this.racialAbilities.breathType = "fire";
            this.racialAbilities.breathShape = "cone"; // 15ft cone
        }
        if (this.race === "Half-Orc") {
            this.racialAbilities.relentlessUsed = false; // Resets on long rest
        }
    }

    getModifier(stat) {
        return Math.floor((this.stats[stat] - 10) / 2);
    }

    getProficiencyBonus() {
        // D&D 5e proficiency bonus: +2 at L1-4, +3 at L5-8, +4 at L9-12, +5 at L13-16, +6 at L17-20
        return Math.floor((this.level - 1) / 4) + 2;
    }

    // ========== Skill Proficiency System ==========
    isSkillProficient(skillName) {
        return this.skillProficiencies[skillName] === true;
    }

    hasExpertise(skillName) {
        return this.expertise[skillName] === true;
    }

    getSkillModifier(skillName) {
        const ability = SKILL_ABILITY_MAP[skillName];
        if (!ability) return 0;
        let mod = this.getModifier(ability);
        if (this.isSkillProficient(skillName)) {
            mod += this.getProficiencyBonus();
        }
        if (this.hasExpertise(skillName)) {
            mod += this.getProficiencyBonus(); // Double proficiency
        }
        return mod;
    }

    getPassivePerception() {
        return 10 + this.getSkillModifier("Perception");
    }

    getPassiveInsight() {
        return 10 + this.getSkillModifier("Insight");
    }

    getPassiveInvestigation() {
        return 10 + this.getSkillModifier("Investigation");
    }

    addSkillProficiency(skillName) {
        if (SKILL_ABILITY_MAP[skillName]) {
            this.skillProficiencies[skillName] = true;
        }
    }

    // ========== Equipment Proficiency System ==========
    isProficientWithWeapon(weaponName) {
        const weapon = this.getWeaponData(weaponName);
        if (!weapon) return false;
        if (weaponName === "Unarmed") return true;
        
        const profList = CLASS_WEAPON_PROFICIENCY[this.charClass] || [];
        // Strip magic prefix for base weapon name matching
        const baseName = weaponName.replace(/^\+\d+\s/, '');
        
        // Check specific weapon name proficiency
        if (profList.includes(baseName.toLowerCase())) return true;
        
        // Check category proficiency (simple/martial)
        const category = weapon.category || "simple";
        if (profList.includes(category)) return true;
        
        return false;
    }

    isProficientWithArmor(armorName) {
        const armor = this.getArmorData(armorName);
        if (!armor) return false;
        if (armor.type === "none") return true; // Robes etc
        
        const profList = CLASS_ARMOR_PROFICIENCY[this.charClass] || [];
        return profList.includes(armor.type);
    }

    isProficientWithShield() {
        const profList = CLASS_ARMOR_PROFICIENCY[this.charClass] || [];
        return profList.includes("shields");
    }

    // ========== Attunement System ==========
    canAttune(itemName) {
        if (this.attunedItems.length >= 3) return false;
        if (this.attunedItems.includes(itemName)) return false;
        return true;
    }

    attuneItem(itemName) {
        if (!this.canAttune(itemName)) {
            return { success: false, message: this.attunedItems.length >= 3 ? "You can only attune to 3 items at a time!" : "Already attuned to this item." };
        }
        this.attunedItems.push(itemName);
        return { success: true, message: `Attuned to ${itemName}! (${this.attunedItems.length}/3 slots used)` };
    }

    unattuneItem(itemName) {
        const idx = this.attunedItems.indexOf(itemName);
        if (idx === -1) return { success: false, message: "Not attuned to this item." };
        this.attunedItems.splice(idx, 1);
        return { success: true, message: `Removed attunement to ${itemName}. (${this.attunedItems.length}/3 slots)` };
    }

    isAttuned(itemName) {
        return this.attunedItems.includes(itemName);
    }

    getItemRequiresAttunement(itemName) {
        const weapon = this.getWeaponData(itemName);
        if (weapon && weapon.requiresAttunement) return true;
        return false;
    }

    // ========== Ritual Casting ==========
    canCastRitual(spellName) {
        const spell = GAME_DATA.spells[spellName];
        if (!spell || !spell.ritual) return false;
        // Must know the spell
        if (!this.spells.known.includes(spellName) && !this.spells.cantrips.includes(spellName)) return false;
        // Wizards, Clerics, Druids can cast rituals. Bards too at higher levels.
        const ritualCasters = ["Wizard", "Cleric", "Druid", "Bard", "Artificer"];
        return ritualCasters.includes(this.charClass);
    }

    // ========== Darkvision Mechanics ==========
    hasDarkvision() {
        return this.darkvisionRange > 0;
    }

    // ========== Racial Abilities ==========
    getBreathWeaponDamage() {
        // Scales with level: 2d6 at L1, 3d6 at L6, 4d6 at L11, 5d6 at L16
        if (this.level >= 16) return "5d6";
        if (this.level >= 11) return "4d6";
        if (this.level >= 6) return "3d6";
        return "2d6";
    }

    getSneakAttackDice() {
        // Rogue Sneak Attack: 1d6 at L1, +1d6 every 2 odd levels
        if (this.charClass !== "Rogue") return 0;
        return Math.ceil(this.level / 2);
    }

    getRageDamage() {
        // Barbarian Rage bonus damage: +2 at L1, +3 at L9, +4 at L16
        if (this.charClass !== "Barbarian") return 0;
        if (this.level >= 16) return 4;
        if (this.level >= 9) return 3;
        return 2;
    }

    getExtraAttackCount() {
        // Fighter: 2 attacks at L5, 3 at L11, 4 at L20
        // Barbarian/Ranger: 2 attacks at L5
        if (!this.extraAttack) return 1;
        if (this.charClass === "Fighter") {
            if (this.level >= 20) return 4;
            if (this.level >= 11) return 3;
        }
        return 2;
    }

    calculateHp() {
        const hitDie = GAME_DATA.classes[this.charClass].hitDie;
        const conMod = this.getModifier("con");
        this.maxHp = hitDie + conMod;
        this.hp = this.maxHp;
        // Set hit dice for rest system
        this.hitDice = { current: this.level, max: this.level };
    }

    calculateAc(campaignId = null) {
        const dexMod = this.getModifier("dex");
        let baseAc = 10;
        let maxDex = 99;
        
        // Get campaign-specific items if available
        const campaignItems = campaignId ? GAME_DATA.campaignItems[campaignId] : null;
        
        // Check equipped armor (standard and campaign-specific)
        if (this.equipped.armor) {
            let armorData = GAME_DATA.armor[this.equipped.armor];
            if (!armorData && campaignItems && campaignItems.armor) {
                armorData = campaignItems.armor[this.equipped.armor];
            }
            if (armorData) {
                baseAc = armorData.ac;
                maxDex = armorData.maxDex;
            }
        }
        
        // Apply dex modifier (capped by armor type)
        this.ac = baseAc + Math.min(dexMod, maxDex);
        
        // Check equipped shield (standard and campaign-specific)
        if (this.equipped.shield) {
            let shieldData = GAME_DATA.shields[this.equipped.shield];
            if (!shieldData && campaignItems && campaignItems.shields) {
                shieldData = campaignItems.shields[this.equipped.shield];
            }
            if (shieldData) {
                this.ac += shieldData.acBonus;
            }
        }
    }
    
    // Helper method to get weapon data (checks both standard and campaign items)
    getWeaponData(weaponName, campaignId = null) {
        if (GAME_DATA.weapons[weaponName]) {
            return GAME_DATA.weapons[weaponName];
        }
        if (campaignId) {
            const campaignItems = GAME_DATA.campaignItems[campaignId];
            if (campaignItems && campaignItems.weapons && campaignItems.weapons[weaponName]) {
                return campaignItems.weapons[weaponName];
            }
        }
        return null;
    }
    
    // Helper method to get armor data (checks both standard and campaign items)
    getArmorData(armorName, campaignId = null) {
        if (GAME_DATA.armor[armorName]) {
            return GAME_DATA.armor[armorName];
        }
        if (campaignId) {
            const campaignItems = GAME_DATA.campaignItems[campaignId];
            if (campaignItems && campaignItems.armor && campaignItems.armor[armorName]) {
                return campaignItems.armor[armorName];
            }
        }
        return null;
    }
    
    // Helper method to get shield data (checks both standard and campaign items)
    getShieldData(shieldName, campaignId = null) {
        if (GAME_DATA.shields[shieldName]) {
            return GAME_DATA.shields[shieldName];
        }
        if (campaignId) {
            const campaignItems = GAME_DATA.campaignItems[campaignId];
            if (campaignItems && campaignItems.shields && campaignItems.shields[shieldName]) {
                return campaignItems.shields[shieldName];
            }
        }
        return null;
    }
    
    equipItem(itemName, campaignId = null) {
        // Determine item type and equip it
        const weaponData = this.getWeaponData(itemName, campaignId);
        const armorData = this.getArmorData(itemName, campaignId);
        const shieldData = this.getShieldData(itemName, campaignId);
        
        if (weaponData) {
            const weapon = weaponData;
            // Check if weapon is two-handed and we have a shield
            if (weapon.properties && weapon.properties.includes("two-handed") && this.equipped.shield) {
                return { success: false, message: "Cannot equip two-handed weapon while using a shield!" };
            }
            // Attunement check for magic items
            if (weapon.requiresAttunement && !this.isAttuned(itemName)) {
                if (!this.canAttune(itemName)) {
                    return { success: false, message: `${itemName} requires attunement, but you already have 3 attuned items! Unattune one first.` };
                }
                this.attuneItem(itemName);
            }
            const oldWeapon = this.equipped.weapon;
            this.equipped.weapon = itemName;
            // Proficiency warning
            let profMsg = "";
            if (!this.isProficientWithWeapon(itemName)) {
                profMsg = " ⚠️ Not proficient — you won't add proficiency bonus to attacks!";
            }
            return { success: true, message: `Equipped ${itemName}!${profMsg}`, oldItem: oldWeapon };
        } else if (armorData) {
            const oldArmor = this.equipped.armor;
            this.equipped.armor = itemName;
            this.calculateAc(campaignId);
            // Proficiency warning for armor
            let profMsg = "";
            if (!this.isProficientWithArmor(itemName)) {
                profMsg = " ⚠️ Not proficient — disadvantage on STR/DEX checks, attacks, and can't cast spells!";
            }
            return { success: true, message: `Equipped ${itemName}! AC is now ${this.ac}.${profMsg}`, oldItem: oldArmor };
        } else if (shieldData) {
            // Check if current weapon is two-handed
            const currentWeaponData = this.equipped.weapon ? this.getWeaponData(this.equipped.weapon, campaignId) : null;
            if (currentWeaponData && currentWeaponData.properties && currentWeaponData.properties.includes("two-handed")) {
                return { success: false, message: "Cannot equip shield while using a two-handed weapon!" };
            }
            const oldShield = this.equipped.shield;
            this.equipped.shield = itemName;
            this.calculateAc(campaignId);
            let profMsg = "";
            if (!this.isProficientWithShield()) {
                profMsg = " ⚠️ Not proficient with shields — disadvantage on STR/DEX checks and attacks!";
            }
            return { success: true, message: `Equipped ${itemName}! AC is now ${this.ac}.${profMsg}`, oldItem: oldShield };
        }
        return { success: false, message: "This item cannot be equipped." };
    }
    
    unequipItem(slot, campaignId = null) {
        if (this.equipped[slot]) {
            const item = this.equipped[slot];
            this.equipped[slot] = null;
            if (slot === "armor" || slot === "shield") {
                this.calculateAc(campaignId);
            }
            return { success: true, message: `Unequipped ${item}.`, item: item };
        }
        return { success: false, message: "Nothing equipped in that slot." };
    }
    
    getWeaponDamage(campaignId = null) {
        const weaponData = this.equipped.weapon ? this.getWeaponData(this.equipped.weapon, campaignId) : null;
        
        if (!this.equipped.weapon || !weaponData) {
            // Unarmed strike
            return { damage: "1d1", stat: "str", type: "bludgeoning", name: "Unarmed Strike" };
        }
        const weapon = weaponData;
        // Use versatile damage if no shield equipped
        let damage = weapon.damage;
        if (weapon.properties && weapon.properties.includes("versatile") && !this.equipped.shield) {
            damage = weapon.versatileDamage;
        }
        return { damage: damage, stat: weapon.stat, type: weapon.type, name: this.equipped.weapon, properties: weapon.properties || [], magicBonus: weapon.magicBonus || 0 };
    }

    setupClass() {
        const classInfo = GAME_DATA.classes[this.charClass];
        this.inventory = [...classInfo.equipment];
        this.skills = [...classInfo.skills];
        
        // Set skill proficiencies from class default skills
        this.skillProficiencies = {};
        for (const skill of classInfo.skills) {
            this.skillProficiencies[skill] = true;
        }
        
        // Auto-equip starting equipment
        for (const item of this.inventory) {
            if (GAME_DATA.weapons[item] && !this.equipped.weapon) {
                this.equipped.weapon = item;
            } else if (GAME_DATA.armor[item] && !this.equipped.armor) {
                this.equipped.armor = item;
            } else if (GAME_DATA.shields[item] && !this.equipped.shield) {
                // Only equip shield if weapon isn't two-handed
                if (!this.equipped.weapon || !GAME_DATA.weapons[this.equipped.weapon].properties.includes("two-handed")) {
                    this.equipped.shield = item;
                }
            }
        }
        
        // Setup spells for spellcasting classes
        if (classInfo.spellcaster) {
            this.setupSpells();
        }
        
        // Setup Barbarian Rage
        if (this.charClass === "Barbarian") {
            this.ragesRemaining = 2; // 2 rages at level 1
        }
        
        // Setup Paladin
        if (this.charClass === "Paladin") {
            this.layOnHandsPool = this.level * 5;
            this.divineSenseUses = 1 + this.getModifier("cha");
        }
        
        // Setup Monk
        if (this.charClass === "Monk") {
            this.kiPoints = Math.max(0, this.level - 1); // Ki starts at level 2 
            this.kiMax = this.kiPoints;
            this.martialArtsDie = "1d4"; // Scales at levels 5, 11, 17
        }
        
        // Setup Warlock
        if (this.charClass === "Warlock") {
            this.pactSlots = 1;
            this.pactSlotLevel = 1;
            this.pactSlotsUsed = 0;
        }
        
        // Setup Bard
        if (this.charClass === "Bard") {
            this.bardicInspirationDie = "1d6";
            this.bardicInspirationUses = Math.max(1, this.getModifier("cha"));
        }
        
        // Setup Sorcerer
        if (this.charClass === "Sorcerer") {
            this.sorceryPoints = Math.max(0, this.level - 1); // Starts at level 2
            this.sorceryPointsMax = this.sorceryPoints;
        }
        
        // Setup Druid
        if (this.charClass === "Druid") {
            this.wildShapeUses = 2;
            this.wildShapeCR = 0.25; // CR 1/4 at level 2
        }
        
        // Setup Artificer
        if (this.charClass === "Artificer") {
            this.infusionsKnown = 2;
            this.infusedItems = 0;
        }
        
        this.calculateHp();
        this.calculateAc();
    }
    
    setupSpells() {
        const classInfo = GAME_DATA.classes[this.charClass];
        if (!classInfo.spellcaster) return;
        
        // Get spell slot table based on caster type
        let slotTable;
        if (classInfo.casterType === 'pact') {
            slotTable = GAME_DATA.pactMagicSlots;
        } else if (classInfo.casterType === 'half') {
            slotTable = GAME_DATA.halfCasterSlots;
        } else {
            slotTable = GAME_DATA.fullCasterSlots;
        }
        const levelSlots = slotTable[this.level] || {};
        
        // Initialize all 9 spell levels
        this.spells.slots = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 };
        this.spells.slotsUsed = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 };
        
        // Set slots from the table
        for (let lvl in levelSlots) {
            this.spells.slots[lvl] = levelSlots[lvl];
        }
        
        // Assign starting cantrips and spells based on class
        const allSpells = GAME_DATA.spells;
        const classSpells = Object.keys(allSpells).filter(name => 
            allSpells[name].classes.includes(this.charClass)
        );
        
        const cantrips = classSpells.filter(name => allSpells[name].level === 0);
        const level1Spells = classSpells.filter(name => allSpells[name].level === 1);
        
        // Give starting cantrips (up to 3)
        const numCantrips = Math.min(classInfo.cantrips || 2, cantrips.length);
        this.spells.cantrips = cantrips.slice(0, numCantrips);
        
        // Give starting level 1 spells (2-4 depending on class)
        const numSpells = this.charClass === "Wizard" ? 4 : this.charClass === "Cleric" ? 3 : 2;
        this.spells.known = level1Spells.slice(0, Math.min(numSpells, level1Spells.length));
    }
    
    getSpellcastingMod() {
        const classInfo = GAME_DATA.classes[this.charClass];
        if (!classInfo.spellcaster) return 0;
        return this.getModifier(classInfo.spellStat);
    }
    
    getSpellSaveDC() {
        return 8 + this.getProficiencyBonus() + this.getSpellcastingMod();
    }
    
    getSpellAttackBonus() {
        return this.getProficiencyBonus() + this.getSpellcastingMod();
    }
    
    canCastSpell(spellName) {
        const spell = GAME_DATA.spells[spellName];
        if (!spell) return false;
        
        // Cantrips can always be cast
        if (spell.level === 0) {
            return this.spells.cantrips.includes(spellName);
        }
        
        // Check if spell is known
        if (!this.spells.known.includes(spellName)) return false;
        
        // Check if we have a slot available
        const slotsAvailable = this.spells.slots[spell.level] - this.spells.slotsUsed[spell.level];
        return slotsAvailable > 0;
    }
    
    useSpellSlot(level) {
        if (this.spells.slotsUsed[level] < this.spells.slots[level]) {
            this.spells.slotsUsed[level]++;
            return true;
        }
        return false;
    }
    
    restoreSpellSlots() {
        for (let level in this.spells.slotsUsed) {
            this.spells.slotsUsed[level] = 0;
        }
    }
    
    isSpellcaster() {
        return GAME_DATA.classes[this.charClass]?.spellcaster || false;
    }

    setupBackground() {
        const bgInfo = GAME_DATA.backgrounds[this.background];
        for (let skill of bgInfo.skills) {
            if (!this.skills.includes(skill)) {
                this.skills.push(skill);
            }
            // Add to proficiency map
            this.skillProficiencies[skill] = true;
        }
        // Human Extra Skill trait
        if (this.race === "Human" && this.traits.includes("Extra Skill")) {
            // Give a random skill the character doesn't already have
            const allSkills = Object.keys(SKILL_ABILITY_MAP);
            const available = allSkills.filter(s => !this.skillProficiencies[s]);
            if (available.length > 0) {
                const bonus = available[Math.floor(Math.random() * available.length)];
                this.skillProficiencies[bonus] = true;
                if (!this.skills.includes(bonus)) this.skills.push(bonus);
            }
        }
        this.gold = Math.floor(Math.random() * 16) + 10;
        // Initialize reputation based on background
        this.initializeReputation();
    }

    initializeReputation() {
        // Base reputation with common factions
        this.reputation = {
            commoners: 0,
            nobility: 0,
            merchants: 0,
            thieves_guild: 0,
            military: 0,
            church: 0
        };
        // Background-specific starting reputation
        switch (this.background) {
            case "Noble": this.reputation.nobility = 10; this.reputation.commoners = -5; break;
            case "Criminal": this.reputation.thieves_guild = 10; this.reputation.military = -5; break;
            case "Soldier": this.reputation.military = 10; break;
            case "Acolyte": this.reputation.church = 10; break;
            case "Scholar": this.reputation.merchants = 5; break;
            case "Outlander": this.reputation.commoners = 5; break;
        }
    }

    takeDamage(damage, damageType = null) {
        let finalDamage = damage;
        
        // Racial damage resistances
        if (damageType) {
            // Dragonborn Damage Resistance (fire by default)
            if (this.race === "Dragonborn" && this.racialAbilities.breathType === "fire" && damageType === "fire") {
                finalDamage = Math.floor(finalDamage / 2);
            }
            // Tiefling Hellish Resistance (fire)
            if (this.race === "Tiefling" && damageType === "fire") {
                finalDamage = Math.floor(finalDamage / 2);
            }
            // Dwarf Dwarven Resilience (poison)
            if (this.race === "Dwarf" && damageType === "poison") {
                finalDamage = Math.floor(finalDamage / 2);
            }
            // Barbarian Rage: resistance to bludgeoning, piercing, slashing
            if (this.raging && ["bludgeoning", "piercing", "slashing"].includes(damageType)) {
                finalDamage = Math.floor(finalDamage / 2);
            }
        }
        
        this.hp = Math.max(0, this.hp - finalDamage);
        
        // Half-Orc Relentless Endurance: drop to 1 HP instead of 0, once per long rest
        if (this.hp === 0 && this.race === "Half-Orc" && this.racialAbilities && !this.racialAbilities.relentlessUsed) {
            this.hp = 1;
            this.racialAbilities.relentlessUsed = true;
        }
        
        if (this.hp === 0) {
            // Reset death saves when first hitting 0 HP
            this.deathSaves = { successes: 0, failures: 0, stable: false };
        }
        return this.hp > 0;
    }

    heal(amount) {
        this.hp = Math.min(this.maxHp, this.hp + amount);
        // If healed from 0, reset death saves
        if (this.hp > 0) {
            this.deathSaves = { successes: 0, failures: 0, stable: false };
        }
    }

    // Condition management
    addCondition(condition) {
        if (this.conditions.hasOwnProperty(condition)) {
            this.conditions[condition] = true;
            return true;
        }
        return false;
    }

    removeCondition(condition) {
        if (this.conditions.hasOwnProperty(condition)) {
            this.conditions[condition] = false;
            return true;
        }
        return false;
    }

    hasCondition(condition) {
        return this.conditions[condition] || false;
    }

    clearAllConditions() {
        for (let c in this.conditions) {
            this.conditions[c] = false;
        }
    }

    // Get active conditions as array
    getActiveConditions() {
        return Object.keys(this.conditions).filter(c => this.conditions[c]);
    }

    // Hit dice for short rest
    useHitDie() {
        if (this.hitDice.current > 0) {
            const hitDie = GAME_DATA.classes[this.charClass].hitDie;
            const conMod = this.getModifier("con");
            const healing = Math.max(1, Math.floor(Math.random() * hitDie) + 1 + conMod);
            this.hitDice.current--;
            this.heal(healing);
            return healing;
        }
        return 0;
    }

    // Journal management
    addJournalEntry(type, entry) {
        if (type === 'quest' && !this.journal.quests.find(q => q.id === entry.id)) {
            this.journal.quests.push(entry);
        } else if (type === 'npc' && !this.journal.npcs.find(n => n.name === entry.name)) {
            this.journal.npcs.push(entry);
        } else if (type === 'lore' && !this.journal.lore.find(l => l.title === entry.title)) {
            this.journal.lore.push(entry);
        }
    }

    // Reputation management
    adjustReputation(faction, amount) {
        if (this.reputation.hasOwnProperty(faction)) {
            this.reputation[faction] = Math.max(-100, Math.min(100, this.reputation[faction] + amount));
        }
    }

    getReputationLevel(faction) {
        const rep = this.reputation[faction] || 0;
        if (rep >= 50) return "Revered";
        if (rep >= 25) return "Friendly";
        if (rep >= 0) return "Neutral";
        if (rep >= -25) return "Unfriendly";
        return "Hostile";
    }

    // Material/crafting management
    addMaterial(material, amount = 1) {
        this.materials[material] = (this.materials[material] || 0) + amount;
    }

    useMaterial(material, amount = 1) {
        if ((this.materials[material] || 0) >= amount) {
            this.materials[material] -= amount;
            return true;
        }
        return false;
    }

    toJSON() {
        return {
            name: this.name,
            race: this.race,
            charClass: this.charClass,
            subclass: this.subclass,
            subclassFeatures: this.subclassFeatures,
            background: this.background,
            level: this.level,
            experience: this.experience,
            stats: this.stats,
            hp: this.hp,
            maxHp: this.maxHp,
            ac: this.ac,
            inventory: this.inventory,
            gold: this.gold,
            traits: this.traits,
            skills: this.skills,
            equipped: this.equipped,
            spells: this.spells,
            buffs: this.buffs,
            deathSaves: this.deathSaves,
            conditions: this.conditions,
            hitDice: this.hitDice,
            materials: this.materials,
            reputation: this.reputation,
            journal: this.journal,
            concentrating: this.concentrating,
            feats: this.feats,
            featData: this.featData,
            secondWindUsed: this.secondWindUsed,
            skillProficiencies: this.skillProficiencies,
            expertise: this.expertise,
            attunedItems: this.attunedItems,
            racialAbilities: this.racialAbilities,
            darkvisionRange: this.darkvisionRange
        };
    }

    static fromJSON(data) {
        const char = new Character();
        Object.assign(char, data);
        // Ensure all properties exist for older saves
        if (!char.spells) {
            char.spells = { cantrips: [], known: [], slots: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 }, slotsUsed: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 } };
        } else {
            // Ensure all 9 spell levels exist for older saves
            for (let i = 1; i <= 9; i++) {
                if (char.spells.slots[i] === undefined) char.spells.slots[i] = 0;
                if (char.spells.slotsUsed[i] === undefined) char.spells.slotsUsed[i] = 0;
            }
        }
        if (!char.buffs) {
            char.buffs = { shieldActive: false, blessActive: false, huntersMark: false, guidingBolt: false };
        }
        if (!char.deathSaves) {
            char.deathSaves = { successes: 0, failures: 0, stable: false };
        }
        if (!char.conditions) {
            char.conditions = { poisoned: false, frightened: false, paralyzed: false, blinded: false, prone: false, restrained: false, stunned: false };
        }
        if (!char.hitDice) {
            char.hitDice = { current: char.level, max: char.level };
        }
        if (!char.materials) {
            char.materials = {};
        }
        if (!char.reputation) {
            char.reputation = { commoners: 0, nobility: 0, merchants: 0, thieves_guild: 0, military: 0, church: 0 };
        }
        if (!char.journal) {
            char.journal = { quests: [], npcs: [], lore: [] };
        }
        // Ensure subclass fields exist for older saves
        if (!char.subclass) char.subclass = null;
        if (!char.subclassFeatures) char.subclassFeatures = {};
        if (char.concentrating === undefined) char.concentrating = null;
        if (!char.feats) char.feats = [];
        if (!char.featData) char.featData = {};
        if (char.secondWindUsed === undefined) char.secondWindUsed = false;
        if (!char.skillProficiencies) {
            // Backward compat: convert old skills array to proficiency map
            char.skillProficiencies = {};
            if (char.skills && Array.isArray(char.skills)) {
                for (const skill of char.skills) {
                    char.skillProficiencies[skill] = true;
                }
            }
        }
        if (!char.expertise) char.expertise = {};
        if (!char.attunedItems) char.attunedItems = [];
        if (!char.racialAbilities) char.racialAbilities = {};
        if (char.darkvisionRange === undefined) {
            char.darkvisionRange = (char.traits && (char.traits.includes("Darkvision"))) ? 60 : 0;
        }
        return char;
    }
}

class DungeonMaster {
    constructor(character, campaignId) {
        this.character = character;
        this.campaignId = campaignId;
        this.campaign = CAMPAIGNS[campaignId];
        this.currentLocation = this.campaign.locations[0]; // Start at first location
        this.turn = 0;
        this.inCombat = false;
        this.currentEnemy = null;
        this.defendingThisTurn = false;
        this.currentChapter = 0;
        this.questFlags = this.initQuestFlags(campaignId);
        
        // Day/Night and Weather system
        this.timeOfDay = "day"; // day, dusk, night, dawn
        this.hour = 8; // Start at 8 AM
        this.day = 1;
        this.weather = "clear"; // clear, cloudy, rain, storm, fog
        
        // Initiative tracking
        this.initiative = {
            player: 0,
            enemy: 0,
            playerGoesFirst: true
        };
        
        // Action economy tracking
        this.actions = {
            action: true,
            bonusAction: true,
            reaction: true,
            movement: 30
        };
        
        // Short/Long rest tracking
        this.shortRestsTaken = 0;
        this.maxShortRests = 2; // Per long rest
        
        // Party system - companions
        this.party = [];
        this.maxPartySize = 4; // Including player
        
        // Tactical grid combat
        this.combatGrid = null;
        this.positions = {}; // Entity positions on grid
        
        // Rumors and world events
        this.rumors = [];
        this.worldEvents = [];
        this.tavennRumorsHeard = [];
        
        // Combat-gated story progression
        this.pendingStoryEvent = null;
    }
    
    initQuestFlags(campaignId) {
        if (campaignId === "nights_dark_terror") {
            return {
                metStephan: false,
                reachedSukiskyn: false,
                survivedSiege: false,
                enteredXitaqasLair: false,
                rescuedTaras: false,
                defeatedXitaqa: false,
                foundIronRing: false,
                foundLostValley: false,
                defeatedGolthar: false,
                goblinsKilled: 0,
                prisonersRescued: 0
            };
        } else if (campaignId === "curse_of_strahd") {
            return {
                enteredBarovia: false,
                metIsmark: false,
                metIreena: false,
                visitedMadamEva: false,
                reachedVallaki: false,
                foundVanRichten: false,
                reachedAmberTemple: false,
                enteredRavenloft: false,
                foundSunSword: false,
                foundHolySymbol: false,
                foundTome: false,
                foundAlly: false,
                defeatedStrahd: false,
                undeadKilled: 0,
                villagersRescued: 0
            };
        } else if (campaignId === "tomb_of_annihilation") {
            return {
                metSyndra: false,
                arrivedPort: false,
                hiredGuide: false,
                enteredJungle: false,
                foundOmu: false,
                collectedCubes: 0,
                enteredFane: false,
                defeatedRasNsi: false,
                enteredTomb: false,
                destroyedSoulmonger: false,
                defeatedAcererak: false,
                dinosaursSlain: 0,
                undeadSlain: 0
            };
        } else if (campaignId === "keep_on_borderlands") {
            return {
                arrivedAtKeep: false,
                foundLodging: false,
                exploredKeep: false,
                metCastellan: false,
                foundCaves: false,
                enteredKobolds: false,
                enteredGoblins: false,
                enteredOrcs: false,
                outerCavesKills: 0,
                outerCavesCleared: false,
                enteredBugbears: false,
                enteredGnolls: false,
                innerCavesKills: 0,
                innerCavesCleared: false,
                defeatedMinotaur: false,
                foundTemple: false,
                defeatedHighPriest: false
            };
        } else if (campaignId === "lost_mine_of_phandelver") {
            return {
                ambushed: false,
                rescuedSildar: false,
                arrivedPhandalin: false,
                metBarthen: false,
                learnedRedbrands: false,
                enteredRedbrandHideout: false,
                clearedRedbrands: false,
                defeatedGlassstaff: false,
                redbrandsDefeated: 0,
                enteredCragmawCastle: false,
                rescuedGundren: false,
                defeatedKingGrol: false,
                enteredWaveEchoCave: false,
                foundForgeOfSpells: false,
                defeatedBlackSpider: false,
                goblinsKilled: 0,
                townsfolkHelped: 0
            };
        }
        return {};
    }

    rollDice(notation) {
        if (!notation.includes("d")) return parseInt(notation);
        // Handle notation like "3d4+3" or "2d6-1"
        let bonus = 0;
        let diceStr = notation;
        const plusMatch = notation.match(/([^+\-]+)([+\-]\d+)$/);
        if (plusMatch) {
            diceStr = plusMatch[1];
            bonus = parseInt(plusMatch[2]);
        }
        const [num, sides] = diceStr.split("d").map(n => parseInt(n) || 1);
        let total = 0;
        for (let i = 0; i < num; i++) {
            total += Math.floor(Math.random() * sides) + 1;
        }
        return total + bonus;
    }

    skillCheck(stat, dc, advantage = false, disadvantage = false, skillName = null) {
        let roll1 = Math.floor(Math.random() * 20) + 1;
        let roll2 = Math.floor(Math.random() * 20) + 1;
        
        // Halfling Lucky: reroll natural 1s on ability checks
        if (this.character.race === "Halfling") {
            if (roll1 === 1) roll1 = Math.floor(Math.random() * 20) + 1;
            if (roll2 === 1) roll2 = Math.floor(Math.random() * 20) + 1;
        }
        
        let roll = roll1;
        let advType = null;
        
        // Apply advantage/disadvantage
        if (advantage && !disadvantage) {
            roll = Math.max(roll1, roll2);
            advType = "advantage";
        } else if (disadvantage && !advantage) {
            roll = Math.min(roll1, roll2);
            advType = "disadvantage";
        }
        
        let modifier = this.character.getModifier(stat);
        
        // Add proficiency bonus if proficient in the skill
        if (skillName && this.character.isSkillProficient(skillName)) {
            modifier += this.character.getProficiencyBonus();
            if (this.character.hasExpertise(skillName)) {
                modifier += this.character.getProficiencyBonus(); // Double proficiency
            }
        }
        
        // Subclass skill bonuses
        if (this.character.subclassFeatures?.['Champion_7'] && ['str','dex','con'].includes(stat)) {
            modifier += 2; // Remarkable Athlete
        }
        if (this.character.subclass === 'Thief' && stat === 'dex') {
            modifier += 2; // Fast Hands
        }
        
        const total = roll + modifier;
        const success = total >= dc;
        const critical = (roll === 20 || roll === 1); // Critical for narrative, but not auto-success/fail

        return { success, critical, roll, roll1, roll2, modifier, total, dc, advType, skillName };
    }

    async skillCheckAnimated(stat, dc, advantage = false, disadvantage = false, skillName = null) {
        let roll1 = Math.floor(Math.random() * 20) + 1;
        let roll2 = Math.floor(Math.random() * 20) + 1;
        
        // Halfling Lucky: reroll natural 1s on ability checks
        if (this.character.race === "Halfling") {
            if (roll1 === 1) roll1 = Math.floor(Math.random() * 20) + 1;
            if (roll2 === 1) roll2 = Math.floor(Math.random() * 20) + 1;
        }
        
        let roll = roll1;
        let advType = null;
        
        // Apply advantage/disadvantage
        if (advantage && !disadvantage) {
            roll = Math.max(roll1, roll2);
            advType = "advantage";
        } else if (disadvantage && !advantage) {
            roll = Math.min(roll1, roll2);
            advType = "disadvantage";
        }
        
        let modifier = this.character.getModifier(stat);
        
        // Add proficiency bonus if proficient in the skill
        if (skillName && this.character.isSkillProficient(skillName)) {
            modifier += this.character.getProficiencyBonus();
            if (this.character.hasExpertise(skillName)) {
                modifier += this.character.getProficiencyBonus(); // Double proficiency
            }
        }
        
        // Subclass skill bonuses
        if (this.character.subclassFeatures?.['Champion_7'] && ['str','dex','con'].includes(stat)) {
            modifier += 2; // Remarkable Athlete
        }
        if (this.character.subclass === 'Thief' && stat === 'dex') {
            modifier += 2; // Fast Hands
        }
        
        const total = roll + modifier;
        const success = total >= dc;
        const critical = (roll === 20 || roll === 1); // Critical for narrative, but not auto-success/fail

        // Show animation based on advantage/disadvantage
        if (advType) {
            await diceAnimator.rollMultiple(roll1, roll2, roll + modifier, advType);
        } else {
            await diceAnimator.rollD20(roll + modifier, `${stat.toUpperCase()} Check`);
        }

        return { success, critical, roll, roll1, roll2, modifier, total, dc, advType };
    }
    
    // Roll attack with advantage/disadvantage support
    rollAttack(modifier = 0, advantage = false, disadvantage = false, critRange = 20) {
        let roll1 = Math.floor(Math.random() * 20) + 1;
        let roll2 = Math.floor(Math.random() * 20) + 1;
        let roll = roll1;
        let advType = null;
        
        if (advantage && !disadvantage) {
            roll = Math.max(roll1, roll2);
            advType = "advantage";
        } else if (disadvantage && !advantage) {
            roll = Math.min(roll1, roll2);
            advType = "disadvantage";
        }
        
        return { roll, roll1, roll2, total: roll + modifier, advType, isCrit: roll >= critRange, isFumble: roll === 1 };
    }

    async rollAttackAnimated(modifier = 0, advantage = false, disadvantage = false, critRange = 20) {
        let roll1 = Math.floor(Math.random() * 20) + 1;
        let roll2 = Math.floor(Math.random() * 20) + 1;
        let roll = roll1;
        let advType = null;
        
        if (advantage && !disadvantage) {
            roll = Math.max(roll1, roll2);
            advType = "advantage";
        } else if (disadvantage && !advantage) {
            roll = Math.min(roll1, roll2);
            advType = "disadvantage";
        }
        
        // Show animation based on advantage/disadvantage
        if (advType) {
            await diceAnimator.rollMultiple(roll1, roll2, roll + modifier, advType);
        } else {
            await diceAnimator.rollD20(roll + modifier, "Attack Roll");
        }
        
        return { roll, roll1, roll2, total: roll + modifier, advType, isCrit: roll >= critRange, isFumble: roll === 1 };
    }

    // Time management
    advanceTime(hours) {
        this.hour += hours;
        while (this.hour >= 24) {
            this.hour -= 24;
            this.day++;
        }
        this.updateTimeOfDay();
        // Chance to change weather
        if (Math.random() < 0.2) {
            this.randomizeWeather();
        }
    }

    updateTimeOfDay() {
        if (this.hour >= 6 && this.hour < 8) this.timeOfDay = "dawn";
        else if (this.hour >= 8 && this.hour < 18) this.timeOfDay = "day";
        else if (this.hour >= 18 && this.hour < 20) this.timeOfDay = "dusk";
        else this.timeOfDay = "night";
    }

    randomizeWeather() {
        const weathers = ["clear", "clear", "clear", "cloudy", "cloudy", "rain", "fog", "storm"];
        // Campaign-specific weather
        if (this.campaignId === "curse_of_strahd") {
            // Barovia is always gloomy
            this.weather = ["fog", "fog", "cloudy", "cloudy", "rain", "storm"][Math.floor(Math.random() * 6)];
        } else if (this.campaignId === "tomb_of_annihilation") {
            // Jungle has more rain
            this.weather = ["clear", "cloudy", "rain", "rain", "storm", "fog"][Math.floor(Math.random() * 6)];
        } else {
            this.weather = weathers[Math.floor(Math.random() * weathers.length)];
        }
    }

    getTimeIcon() {
        const icons = { dawn: "🌅", day: "☀️", dusk: "🌆", night: "🌙" };
        return icons[this.timeOfDay] || "☀️";
    }

    getWeatherIcon() {
        const icons = { clear: "☀️", cloudy: "☁️", rain: "🌧️", storm: "⛈️", fog: "🌫️" };
        return icons[this.weather] || "☀️";
    }

    // Check if weather affects combat
    getWeatherEffects() {
        const effects = { rangedDisadvantage: false, perceptionDisadvantage: false, description: "" };
        if (this.weather === "rain") {
            effects.rangedDisadvantage = true;
            effects.description = "Rain hampers ranged attacks.";
        } else if (this.weather === "storm") {
            effects.rangedDisadvantage = true;
            effects.perceptionDisadvantage = true;
            effects.description = "Storm causes disadvantage on ranged attacks and Perception checks.";
        } else if (this.weather === "fog") {
            effects.perceptionDisadvantage = true;
            effects.description = "Fog limits visibility.";
        }
        return effects;
    }

    // Initiative system
    rollInitiative(monsterDexMod = 0) {
        const playerDex = this.character.getModifier("dex");
        this.initiative.player = Math.floor(Math.random() * 20) + 1 + playerDex;
        this.initiative.enemy = Math.floor(Math.random() * 20) + 1 + monsterDexMod;
        this.initiative.playerGoesFirst = this.initiative.player >= this.initiative.enemy;
        return this.initiative;
    }

    // Reset action economy for new turn
    resetActions() {
        this.actions = {
            action: true,
            bonusAction: true,
            reaction: true,
            movement: 30
        };
    }

    useAction(type) {
        if (type === 'action' && this.actions.action) {
            this.actions.action = false;
            return true;
        } else if (type === 'bonusAction' && this.actions.bonusAction) {
            this.actions.bonusAction = false;
            return true;
        } else if (type === 'reaction' && this.actions.reaction) {
            this.actions.reaction = false;
            return true;
        }
        return false;
    }

    // Party management methods
    canRecruitCompanion(companionName) {
        const campaignCompanions = COMPANIONS[this.campaignId];
        if (!campaignCompanions || !campaignCompanions[companionName]) return false;
        
        const companion = campaignCompanions[companionName];
        const condition = companion.recruitCondition;
        
        // Check if we have room
        if (this.party.length >= this.maxPartySize - 1) return false;
        
        // Check if already in party
        if (this.party.find(c => c.name === companionName)) return false;
        
        // Check quest flag condition
        return this.questFlags[condition] === true;
    }

    recruitCompanion(companionName) {
        const campaignCompanions = COMPANIONS[this.campaignId];
        if (!this.canRecruitCompanion(companionName)) return null;
        
        const template = campaignCompanions[companionName];
        const companion = {
            ...template,
            currentHp: template.hp
        };
        
        // Apply character flaw penalty if applicable
        if (this.character.personality.flaw && this.character.personality.flaw.includes("slow to trust")) {
            companion.loyalty = Math.max(0, companion.loyalty - 20);
        }
        
        this.party.push(companion);
        
        // Track relationship
        this.character.relationships[companionName] = companion.loyalty;
        
        return companion;
    }

    dismissCompanion(companionName) {
        const index = this.party.findIndex(c => c.name === companionName);
        if (index === -1) return false;
        
        const companion = this.party[index];
        if (companion.loyalty < 30) {
            // Low loyalty companion might have harsh parting words
            this.party.splice(index, 1);
            return { success: true, message: `${companion.name} leaves angrily: "Fine! I didn't want to travel with you anyway!"` };
        }
        
        this.party.splice(index, 1);
        return { success: true, message: `${companion.name} nods respectfully: "May we meet again, friend."` };
    }

    adjustCompanionLoyalty(companionName, amount, reason = "") {
        const companion = this.party.find(c => c.name === companionName);
        if (!companion) return;
        
        companion.loyalty = Math.max(-100, Math.min(100, companion.loyalty + amount));
        this.character.relationships[companionName] = companion.loyalty;
        
        // Check for desertion
        if (companion.loyalty <= -50) {
            this.dismissCompanion(companionName);
            return { deserted: true, message: `${companion.name} has lost faith in you and leaves the party!` };
        }
        
        return { deserted: false, loyalty: companion.loyalty };
    }

    companionAttack(companion, enemy) {
        // Companion makes an attack
        const statMod = companion.stats[companion.weapon.stat] ? 
            Math.floor((companion.stats[companion.weapon.stat] - 10) / 2) : 2;
        const attackRoll = Math.floor(Math.random() * 20) + 1;
        const profBonus = Math.floor((companion.level - 1) / 4) + 2; // Proper proficiency scaling
        const totalAttack = attackRoll + statMod + profBonus;
        
        if (attackRoll === 1) {
            return { hit: false, critical: false, fumble: true, roll: attackRoll, message: `${companion.name} fumbles their attack!` };
        }
        
        const isCrit = attackRoll === 20;
        const hit = isCrit || totalAttack >= enemy.ac;
        
        if (!hit) {
            return { hit: false, roll: attackRoll, total: totalAttack, message: `${companion.name} misses! (${totalAttack} vs AC ${enemy.ac})` };
        }
        
        // Calculate damage
        const diceMatch = companion.weapon.damage.match(/(\d+)d(\d+)/);
        let damage = 0;
        if (diceMatch) {
            const numDice = parseInt(diceMatch[1]);
            const diceSides = parseInt(diceMatch[2]);
            for (let i = 0; i < numDice * (isCrit ? 2 : 1); i++) {
                damage += Math.floor(Math.random() * diceSides) + 1;
            }
        }
        damage += statMod;
        
        return {
            hit: true,
            critical: isCrit,
            roll: attackRoll,
            damage: damage,
            message: `${companion.name}${isCrit ? ' CRITS' : ' hits'} for ${damage} damage! "${companion.dialogue.combat}"`
        };
    }

    healCompanion(companionName, amount) {
        const companion = this.party.find(c => c.name === companionName);
        if (!companion) return false;
        
        const oldHp = companion.currentHp;
        companion.currentHp = Math.min(companion.maxHp, companion.currentHp + amount);
        return { healed: companion.currentHp - oldHp, newHp: companion.currentHp };
    }

    getPartyStatus() {
        return this.party.map(c => ({
            name: c.name,
            class: c.class,
            hp: c.currentHp,
            maxHp: c.maxHp,
            loyalty: c.loyalty,
            status: c.currentHp <= 0 ? "Unconscious" : 
                   c.currentHp <= c.maxHp / 4 ? "Badly Wounded" :
                   c.currentHp <= c.maxHp / 2 ? "Wounded" : "Healthy"
        }));
    }

    // Rumor system
    getRandomRumor() {
        const campaignRumors = RUMORS[this.campaignId] || [];
        const unheardRumors = campaignRumors.filter(r => !this.tavennRumorsHeard.includes(r));
        
        if (unheardRumors.length === 0) {
            return "You've heard all the rumors in this area.";
        }
        
        const rumor = unheardRumors[Math.floor(Math.random() * unheardRumors.length)];
        this.tavennRumorsHeard.push(rumor);
        return rumor;
    }

    // Concentration checks
    concentrationCheck(damageTaken) {
        if (!this.character.concentrating) return { success: true };
        
        const dc = Math.max(10, Math.floor(damageTaken / 2));
        const conMod = this.character.getModifier("con");
        let roll = Math.floor(Math.random() * 20) + 1;
        
        // War Caster feat: advantage on concentration saves
        if (this.character.feats && this.character.feats.includes("War Caster")) {
            const roll2 = Math.floor(Math.random() * 20) + 1;
            roll = Math.max(roll, roll2);
        }
        
        // Resilient (CON): add proficiency bonus to CON saves
        let profBonus = 0;
        if (this.character.feats && this.character.feats.includes("Resilient (CON)")) {
            profBonus = this.character.getProficiencyBonus();
        }
        
        const total = roll + conMod + profBonus;
        
        if (total >= dc) {
            return { success: true, roll, dc, message: `Concentration maintained! (${total} vs DC ${dc})` };
        } else {
            const spell = this.character.concentrating;
            this.character.concentrating = null;
            return { success: false, roll, dc, spell, message: `Concentration broken! ${spell} ends. (${total} vs DC ${dc})` };
        }
    }

    // Exhaustion management
    addExhaustion(levels = 1) {
        this.character.exhaustion = Math.min(6, this.character.exhaustion + levels);
        const effect = EXHAUSTION_EFFECTS[this.character.exhaustion];
        
        if (this.character.exhaustion >= 6) {
            return { exhaustion: 6, effect: "Death", message: "You die from exhaustion!" };
        }
        
        return { exhaustion: this.character.exhaustion, effect: effect.name };
    }

    removeExhaustion(levels = 1) {
        this.character.exhaustion = Math.max(0, this.character.exhaustion - levels);
        return { exhaustion: this.character.exhaustion };
    }

    getExhaustionPenalties() {
        const penalties = [];
        for (let i = 1; i <= this.character.exhaustion; i++) {
            penalties.push(EXHAUSTION_EFFECTS[i]);
        }
        return penalties;
    }

    // Encumbrance calculation
    calculateEncumbrance() {
        const str = this.character.stats.str;
        this.character.carryCapacity = str * 15; // Standard 5e encumbrance
        
        let currentWeight = 0;
        // Estimate weights (simplified)
        currentWeight += this.character.inventory.length * 2; // 2 lbs per item average
        currentWeight += Math.floor(this.character.gold / 50); // 50 coins = 1 lb
        
        const encumbered = currentWeight > this.character.carryCapacity * 0.33;
        const heavilyEncumbered = currentWeight > this.character.carryCapacity * 0.66;
        
        return {
            current: currentWeight,
            capacity: this.character.carryCapacity,
            encumbered,
            heavilyEncumbered,
            penalty: heavilyEncumbered ? -20 : (encumbered ? -10 : 0) // Speed penalty
        };
    }

    // Inspiration
    grantInspiration(reason = "") {
        if (!this.character.inspiration) {
            this.character.inspiration = true;
            return { granted: true, message: `You gain Inspiration! ${reason}` };
        }
        return { granted: false, message: "You already have Inspiration." };
    }

    useInspiration() {
        if (this.character.inspiration) {
            this.character.inspiration = false;
            return { used: true, message: "You use your Inspiration for advantage!" };
        }
        return { used: false, message: "You have no Inspiration to use." };
    }

    // Downtime activities
    startDowntimeActivity(activity) {
        const activityData = DOWNTIME_ACTIVITIES[activity];
        if (!activityData) return { success: false };
        
        this.character.downtime.currentActivity = activity;
        this.character.downtime.progress = 0;
        
        return { 
            success: true, 
            activity, 
            daysRequired: activityData.daysRequired,
            costPerDay: activityData.costPerDay
        };
    }

    advanceDowntime(days) {
        if (!this.character.downtime.currentActivity) return { success: false };
        
        const activity = DOWNTIME_ACTIVITIES[this.character.downtime.currentActivity];
        const cost = activity.costPerDay * days;
        
        if (this.character.gold < cost) {
            return { success: false, message: "Not enough gold for this activity." };
        }
        
        this.character.gold -= cost;
        this.character.downtime.progress += days;
        this.character.downtime.daysAvailable -= days;
        
        if (this.character.downtime.progress >= activity.daysRequired) {
            return this.completeDowntimeActivity();
        }
        
        return {
            success: true,
            progress: this.character.downtime.progress,
            remaining: activity.daysRequired - this.character.downtime.progress
        };
    }

    completeDowntimeActivity() {
        const activity = this.character.downtime.currentActivity;
        const activityData = DOWNTIME_ACTIVITIES[activity];
        
        let result = { success: true, activity };
        
        switch (activityData.result) {
            case "earnGold":
                const earned = Math.floor(Math.random() * 20) + 10;
                this.character.gold += earned;
                result.message = `You earned ${earned} gold from working.`;
                break;
            case "removeExhaustion":
                this.removeExhaustion(1);
                result.message = "You recovered from one level of exhaustion.";
                break;
            case "contactOrTrouble":
                if (Math.random() < 0.7) {
                    result.message = "You made a useful contact while carousing!";
                    result.contact = true;
                } else {
                    result.message = "Your carousing got you into trouble!";
                    result.trouble = true;
                }
                break;
            case "loreDiscovery":
                const rumor = this.getRandomRumor();
                result.message = `Your research revealed: "${rumor}"`;
                break;
            default:
                result.message = `You completed ${activity}.`;
        }
        
        this.character.downtime.currentActivity = null;
        this.character.downtime.progress = 0;
        
        return result;
    }

    // NPC relationship tracking
    updateNPCRelationship(npcName, change, reason = "") {
        if (!this.character.relationships[npcName]) {
            this.character.relationships[npcName] = 0;
        }
        
        this.character.relationships[npcName] = Math.max(-100, 
            Math.min(100, this.character.relationships[npcName] + change));
        
        const level = this.character.relationships[npcName];
        let attitude = "Neutral";
        if (level >= 75) attitude = "Loyal";
        else if (level >= 50) attitude = "Friendly";
        else if (level >= 25) attitude = "Helpful";
        else if (level <= -75) attitude = "Hostile";
        else if (level <= -50) attitude = "Unfriendly";
        else if (level <= -25) attitude = "Wary";
        
        return { npc: npcName, relationship: level, attitude };
    }

    getNPCAttitude(npcName) {
        const level = this.character.relationships[npcName] || 0;
        if (level >= 75) return "loyal";
        if (level >= 50) return "friendly";
        if (level >= 25) return "helpful";
        if (level <= -75) return "hostile";
        if (level <= -50) return "unfriendly";
        if (level <= -25) return "wary";
        return "neutral";
    }

    // DM Narration enhancement
    getDMNarration(type, context = {}) {
        const narrations = DM_NARRATION[type];
        if (!narrations) return "";
        
        // Check for specific context
        if (context.weather && narrations[context.weather]) {
            const options = narrations[context.weather];
            return options[Math.floor(Math.random() * options.length)];
        }
        if (context.time && narrations[context.time]) {
            const options = narrations[context.time];
            return options[Math.floor(Math.random() * options.length)];
        }
        if (context.situation && narrations[context.situation]) {
            const options = narrations[context.situation];
            return options[Math.floor(Math.random() * options.length)];
        }
        
        // Default narrations
        if (Array.isArray(narrations)) {
            return narrations[Math.floor(Math.random() * narrations.length)];
        }
        
        return "";
    }

    // Check for flaw complications
    checkFlawComplication(trigger) {
        if (!this.character.personality.flaw) return null;
        
        const flaw = this.character.personality.flaw.toLowerCase();
        
        for (const [key, comp] of Object.entries(FLAW_COMPLICATIONS)) {
            if (flaw.includes(key) && comp.trigger === trigger) {
                // 30% chance for flaw to trigger
                if (Math.random() < 0.3) {
                    return comp;
                }
            }
        }
        return null;
    }
}

// Critical hit and fumble tables
const CRITICAL_HIT_EFFECTS = [
    { name: "Devastating Blow", effect: "Double damage dice!", damageMultiplier: 2 },
    { name: "Stunning Strike", effect: "Enemy is stunned until end of next turn!", condition: "stunned" },
    { name: "Disarming Strike", effect: "Enemy drops their weapon!", special: "disarm" },
    { name: "Precise Hit", effect: "Extra 1d6 damage!", bonusDamage: "1d6" },
    { name: "Brutal Critical", effect: "Maximum damage on one die + normal roll!", special: "maxDie" },
    { name: "Momentum Strike", effect: "Gain a bonus action attack!", special: "bonusAttack" }
];

const FUMBLE_EFFECTS = [
    { name: "Dropped Weapon", effect: "You drop your weapon! Must spend action to retrieve.", penalty: "dropWeapon" },
    { name: "Off Balance", effect: "You stumble! Enemy gets advantage on next attack.", penalty: "enemyAdvantage" },
    { name: "Self Injury", effect: "You hurt yourself for 1d4 damage!", selfDamage: "1d4" },
    { name: "Wide Open", effect: "You leave yourself exposed! -2 AC until next turn.", penalty: "acPenalty" },
    { name: "Fumbled Footing", effect: "You fall prone!", condition: "prone" },
    { name: "Embarrassing Miss", effect: "Your attack is so bad, it's demoralizing. -1 to next attack.", penalty: "attackPenalty" }
];

// Crafting recipes
const CRAFTING_RECIPES = {
    "Health Potion": {
        materials: { "Healing Herbs": 2, "Empty Vial": 1 },
        skill: "Nature",
        dc: 12,
        result: "Potion of Healing"
    },
    "Antidote": {
        materials: { "Antitoxin Root": 1, "Empty Vial": 1 },
        skill: "Nature",
        dc: 10,
        result: "Antidote"
    },
    "Poison": {
        materials: { "Venom Sac": 1, "Empty Vial": 1 },
        skill: "Nature",
        dc: 14,
        result: "Basic Poison"
    },
    "Fire Oil": {
        materials: { "Oil Flask": 1, "Sulfur": 1 },
        skill: "Arcana",
        dc: 12,
        result: "Alchemist's Fire"
    },
    "Silver Weapon Coating": {
        materials: { "Silver Dust": 2 },
        skill: "Arcana",
        dc: 14,
        result: "Silvered (weapon)"
    }
};

// Material drop tables by monster type
const MATERIAL_DROPS = {
    "beast": ["Hide", "Fangs", "Claws", "Meat"],
    "undead": ["Bone Dust", "Ectoplasm", "Death Essence"],
    "humanoid": ["Cloth Scraps", "Empty Vial", "Coin Pouch"],
    "dragon": ["Dragon Scale", "Dragon Tooth", "Dragon Blood"],
    "plant": ["Healing Herbs", "Poisonous Spores", "Bark"],
    "aberration": ["Strange Ichor", "Eye", "Tentacle"],
    "fiend": ["Sulfur", "Brimstone", "Infernal Essence"],
    "goblinoid": ["Crude Tools", "Wolf Fangs", "Tribal Fetish"],
    "default": ["Monster Parts", "Salvage"]
};

// Companion NPCs available to recruit
const COMPANIONS = {
    "keep_on_borderlands": {
        "Marcus the Guard": {
            name: "Marcus the Guard",
            race: "Human",
            class: "Fighter",
            level: 2,
            hp: 18, maxHp: 18, ac: 16,
            stats: { str: 15, dex: 12, con: 14, int: 10, wis: 11, cha: 10 },
            weapon: { name: "Longsword", damage: "1d8", stat: "str" },
            loyalty: 50,
            personality: "A veteran guard tired of wall duty, seeking adventure.",
            voiceStyle: "Speaks gruffly with military discipline",
            recruitCondition: "metCastellan",
            dialogue: {
                greeting: "The Castellan gave me leave to join you. Let's clear those caves!",
                combat: "For the Keep!",
                hurt: "I've had worse in training...",
                victory: "That's how it's done!"
            }
        },
        "Brother Caedmon": {
            name: "Brother Caedmon",
            race: "Human",
            class: "Cleric",
            level: 2,
            hp: 14, maxHp: 14, ac: 15,
            stats: { str: 12, dex: 10, con: 12, int: 12, wis: 16, cha: 13 },
            weapon: { name: "Mace", damage: "1d6", stat: "str" },
            loyalty: 60,
            personality: "A young priest eager to smite evil in the Caves.",
            voiceStyle: "Speaks with religious fervor and kindness",
            recruitCondition: "foundCaves",
            dialogue: {
                greeting: "The light must shine in those dark caves. I will join you!",
                combat: "By the light, be purified!",
                hurt: "My faith... sustains me...",
                victory: "The light prevails!"
            }
        }
    },
    "nights_dark_terror": {
        "Pyotr Sukiskyn": {
            name: "Pyotr Sukiskyn",
            race: "Human",
            class: "Fighter",
            level: 2,
            hp: 18, maxHp: 18, ac: 15,
            stats: { str: 14, dex: 12, con: 14, int: 10, wis: 11, cha: 10 },
            weapon: { name: "Longsword", damage: "1d8", stat: "str" },
            loyalty: 50,
            personality: "Protective and determined to defend his family.",
            voiceStyle: "Speaks with a thick Traladaran accent",
            recruitCondition: "reachedSukiskyn",
            dialogue: {
                greeting: "We must defend Sukiskyn! Will you stand with us?",
                combat: "For my family!",
                hurt: "I won't fall here...",
                victory: "The homestead is safe... for now."
            }
        },
        "Taras": {
            name: "Taras",
            race: "Human",
            class: "Rogue",
            level: 1,
            hp: 8, maxHp: 8, ac: 13,
            stats: { str: 10, dex: 16, con: 10, int: 14, wis: 12, cha: 11 },
            weapon: { name: "Dagger", damage: "1d4", stat: "dex" },
            loyalty: 30,
            personality: "Grateful but traumatized from captivity.",
            voiceStyle: "Speaks softly and hesitantly",
            recruitCondition: "rescuedTaras",
            dialogue: {
                greeting: "Y-you saved me. I owe you my life.",
                combat: "I-I'll try...",
                hurt: "Not again... please...",
                victory: "We did it? We actually did it!"
            }
        }
    },
    "curse_of_strahd": {
        "Ismark Kolyanovich": {
            name: "Ismark Kolyanovich",
            race: "Human",
            class: "Fighter",
            level: 3,
            hp: 28, maxHp: 28, ac: 16,
            stats: { str: 16, dex: 10, con: 14, int: 11, wis: 12, cha: 13 },
            weapon: { name: "Longsword", damage: "1d8", stat: "str" },
            loyalty: 60,
            personality: "Noble and protective of his sister.",
            voiceStyle: "Speaks formally with underlying desperation",
            recruitCondition: "metIsmark",
            dialogue: {
                greeting: "Strahd has taken everything from us. Will you help?",
                combat: "For Ireena!",
                hurt: "I cannot fail her...",
                victory: "One less of Strahd's minions."
            }
        },
        "Ezmerelda d'Avenir": {
            name: "Ezmerelda d'Avenir",
            race: "Human",
            class: "Ranger",
            level: 4,
            hp: 32, maxHp: 32, ac: 15,
            stats: { str: 14, dex: 16, con: 12, int: 13, wis: 14, cha: 12 },
            weapon: { name: "Rapier", damage: "1d8", stat: "dex" },
            loyalty: 40,
            personality: "Confident vampire hunter with a mysterious past.",
            voiceStyle: "Speaks with Vistani flair and confidence",
            recruitCondition: "foundVanRichten",
            dialogue: {
                greeting: "Van Richten trained me well. I hunt the dead.",
                combat: "Time to die, monster!",
                hurt: "Not bad... for a corpse.",
                victory: "Another one for my tally."
            }
        }
    },
    "tomb_of_annihilation": {
        "Azaka Stormfang": {
            name: "Azaka Stormfang",
            race: "Human",
            class: "Ranger",
            level: 3,
            hp: 24, maxHp: 24, ac: 14,
            stats: { str: 15, dex: 14, con: 12, int: 10, wis: 14, cha: 10 },
            weapon: { name: "Longbow", damage: "1d8", stat: "dex" },
            loyalty: 50,
            personality: "Proud and secretive about her weretiger nature.",
            voiceStyle: "Speaks with Chultan accent, often growls softly",
            recruitCondition: "hiredGuide",
            dialogue: {
                greeting: "The jungle is my home. I will guide you safely.",
                combat: "*growls* Prepare yourself!",
                hurt: "You'll pay for that...",
                victory: "The jungle takes its toll."
            }
        },
        "Artus Cimber": {
            name: "Artus Cimber",
            race: "Human",
            class: "Fighter",
            level: 5,
            hp: 45, maxHp: 45, ac: 17,
            stats: { str: 14, dex: 14, con: 14, int: 15, wis: 12, cha: 14 },
            weapon: { name: "Longsword", damage: "1d8", stat: "str" },
            loyalty: 30,
            personality: "Carries the Ring of Winter, seeking his lost love.",
            voiceStyle: "Speaks wisely, with centuries of experience",
            recruitCondition: "enteredJungle",
            dialogue: {
                greeting: "I've searched for Mezro for so long...",
                combat: "The Ring's power aids me!",
                hurt: "Not after all this time...",
                victory: "Alisanda would be proud."
            }
        }
    },
    "lost_mine_of_phandelver": {
        "Sildar Hallwinter": {
            name: "Sildar Hallwinter",
            race: "Human",
            class: "Fighter",
            level: 3,
            hp: 24, maxHp: 24, ac: 16,
            stats: { str: 14, dex: 10, con: 14, int: 12, wis: 13, cha: 12 },
            weapon: { name: "Longsword", damage: "1d8", stat: "str" },
            loyalty: 60,
            personality: "A veteran soldier with a strong sense of duty.",
            voiceStyle: "Speaks with military formality and gratitude",
            recruitCondition: "rescuedSildar",
            dialogue: {
                greeting: "You saved my life. My sword is yours.",
                combat: "For the Lords' Alliance!",
                hurt: "I've survived worse...",
                victory: "Well fought, friend."
            }
        },
        "Sister Garaele": {
            name: "Sister Garaele",
            race: "Elf",
            class: "Cleric",
            level: 2,
            hp: 14, maxHp: 14, ac: 14,
            stats: { str: 10, dex: 12, con: 12, int: 13, wis: 16, cha: 14 },
            weapon: { name: "Mace", damage: "1d6", stat: "str" },
            loyalty: 50,
            personality: "A kind-hearted elf devoted to Tymora, goddess of luck.",
            voiceStyle: "Speaks softly with elvish grace",
            recruitCondition: "arrivedPhandalin",
            dialogue: {
                greeting: "Tymora smiles on our meeting. Let me aid your quest.",
                combat: "Lady Luck, guide my hand!",
                hurt: "Tymora, grant me strength...",
                victory: "Fortune favors the bold!"
            }
        }
    }
};

// Character personality options
const PERSONALITY_TRAITS = {
    Fighter: [
        "I always have a plan for what to do when things go wrong.",
        "I face problems head-on. A simple, direct solution is the best path.",
        "I have a strong sense of fair play and always try to find the most equitable solution.",
        "I protect those who cannot protect themselves."
    ],
    Wizard: [
        "I use polysyllabic words that convey the impression of great erudition.",
        "I'm always humming or muttering an arcane formula I'm working on.",
        "I believe that everything worth doing is worth doing right.",
        "I speak slowly when explaining concepts to those of lesser intelligence."
    ],
    Rogue: [
        "I always have an escape plan ready.",
        "I never trust anyone. Anyone can betray you.",
        "The best lies contain a lot of truth.",
        "I pocket anything I see that might have some value."
    ],
    Cleric: [
        "I see omens in every event and action. The gods try to speak to us.",
        "I put no trust in divine beings, only in my faith.",
        "I quote sacred texts and proverbs in almost every situation.",
        "I am tolerant of other faiths and respect the worship of other gods."
    ],
    Ranger: [
        "I watch over my friends as if they were newborn pups.",
        "I once ran twenty miles to warn my clan of an approaching threat.",
        "I feel more comfortable around animals than people.",
        "I'm always picking up sticks, stones, and bits of nature."
    ]
};

const IDEALS = [
    "Greater Good - Our lot is to lay down our lives for the many.",
    "Freedom - Tyrants must not be allowed to oppress the people.",
    "Honor - If I dishonor myself, I dishonor my whole clan.",
    "Power - I will prove myself superior to all others.",
    "Knowledge - The path to power and self-improvement is through knowledge.",
    "Faith - I trust that my deity will guide my actions."
];

const BONDS = [
    "I have a family, but I have no idea where they are.",
    "I owe my life to the priest who took me in when my parents died.",
    "Someone saved my life on the battlefield. I will never forget.",
    "My honor is my life. I would die before dishonoring myself.",
    "I will recover an ancient relic of my people that was lost long ago.",
    "I work to preserve a library, university, or monastery."
];

const FLAWS = [
    "I have trouble keeping my true feelings hidden. My sharp tongue lands me in trouble.",
    "I am slow to trust members of other races, tribes, and societies.",
    "Violence is my answer to almost any challenge.",
    "I remember every insult I've received and nurse a silent resentment.",
    "I turn tail and run when things look bad.",
    "I am suspicious of strangers and expect the worst of them."
];

// Flaw complications that can trigger
const FLAW_COMPLICATIONS = {
    "sharp tongue": {
        trigger: "dialogue",
        effect: "Your sharp words offend the NPC, giving disadvantage on this interaction.",
        mechanical: "disadvantage"
    },
    "slow to trust": {
        trigger: "newCompanion",
        effect: "You're hesitant to trust this new ally. Loyalty starts lower.",
        mechanical: "loyaltyPenalty"
    },
    "violence": {
        trigger: "dialogue",
        effect: "You feel the urge to solve this with your fists. Choose: Attack or restrain yourself.",
        mechanical: "choiceAttack"
    },
    "resentment": {
        trigger: "combatEnemy",
        effect: "Your hatred for this foe burns hot. You fight recklessly! +2 damage, -2 AC this fight.",
        mechanical: "reckless"
    },
    "cowardly": {
        trigger: "lowHp",
        effect: "Your survival instincts kick in. WIS save DC 12 or try to flee!",
        mechanical: "fleeCheck"
    },
    "suspicious": {
        trigger: "shop",
        effect: "You suspect the merchant is cheating you. Prices seem 10% higher.",
        mechanical: "pricePenalty"
    }
};

// Random rumors by campaign
const RUMORS = {
    "keep_on_borderlands": [
        "The Caves of Chaos are a day's march north. Multiple monster tribes lair there.",
        "Kobolds set traps everywhere. Watch where you step in those tunnels.",
        "An unnatural alliance binds the cave monsters. Someone is organizing them.",
        "The Castellan pays 100 gold for proof the caves are cleared.",
        "A hidden temple lies deep in the ravine. Dark magic emanates from within.",
        "Gnolls and bugbears guard the inner caves. They're tougher than the outer lot.",
        "A minotaur is said to roam the deepest tunnels. Best go well-armed.",
        "Brother Caedmon at the chapel seeks brave souls to cleanse the caves of evil."
    ],
    "nights_dark_terror": [
        "The Iron Ring slavers have been seen moving through the Dymrak Forest.",
        "Wolves have been attacking more frequently. Unnatural, some say.",
        "The Hutaakans in the Lost Valley guard ancient secrets.",
        "Stephan knows these lands better than any. Find him if you need a guide.",
        "Goblins worship some dark power in the ruins of Xitaqa.",
        "The homesteaders of Sukiskyn are hardy folk. They've survived worse.",
        "There's treasure in those ruins, but the goblins guard it fiercely.",
        "Some say the wolves aren't just wolves... they're cursed men."
    ],
    "curse_of_strahd": [
        "The mists trap all who enter. There is no escape from Barovia.",
        "Madame Eva knows all. The Vistani read the future in their cards.",
        "The holy symbol of Ravenkind can turn back Strahd's minions.",
        "The Amber Temple holds dark gifts... for those willing to pay the price.",
        "Van Richten hunts vampires. If anyone can defeat Strahd, it's him.",
        "Argynvostholt was once home to silver dragon knights.",
        "The wines of the Wizard of Wines are the only joy left in Barovia.",
        "Strahd watches everything. The land itself is his spy."
    ],
    "tomb_of_annihilation": [
        "The death curse drains all who've been raised from the dead.",
        "Omu lies hidden in the jungle. The Trickster Gods test all who enter.",
        "Beware the Yuan-ti. They sacrifice the living to their serpent gods.",
        "Syndra Silvane grows weaker by the day. We must hurry!",
        "Nine puzzle cubes unlock the Tomb of the Nine Gods.",
        "Acererak built the Soulmonger deep beneath Omu.",
        "The guides of Port Nyanzaru know the jungle's secrets.",
        "Red Wizards seek the tomb too. Trust them not."
    ],
    "lost_mine_of_phandelver": [
        "Gundren Rockseeker and his brothers found something big in these hills.",
        "The Redbrands have been terrorizing Phandalin for weeks. Someone needs to stop them.",
        "There's an old manor on the east edge of town. The Redbrands use it as their base.",
        "The Cragmaw goblins answer to a bugbear named King Grol.",
        "A mysterious figure called the Black Spider is pulling all the strings.",
        "Wave Echo Cave was lost five hundred years ago. The Forge of Spells lies within.",
        "Sister Garaele at the shrine has been asking about a banshee named Agatha.",
        "Old Owl Well has been overrun - something dark stirs there."
    ]
};

// Exhaustion effects by level
const EXHAUSTION_EFFECTS = {
    1: { name: "Disadvantage on Ability Checks", effect: "abilityCheckDisadvantage" },
    2: { name: "Speed Halved", effect: "speedHalved" },
    3: { name: "Disadvantage on Attacks and Saves", effect: "combatDisadvantage" },
    4: { name: "HP Maximum Halved", effect: "hpHalved" },
    5: { name: "Speed Reduced to 0", effect: "noMovement" },
    6: { name: "Death", effect: "death" }
};

// Downtime activities
const DOWNTIME_ACTIVITIES = {
    "Training": {
        description: "Train to gain proficiency in a new skill or tool.",
        daysRequired: 250,
        costPerDay: 1,
        result: "newProficiency"
    },
    "Research": {
        description: "Research a topic at a library or sage.",
        daysRequired: 7,
        costPerDay: 2,
        result: "loreDiscovery"
    },
    "Crafting": {
        description: "Craft an item during your downtime.",
        daysRequired: "varies",
        costPerDay: 0,
        result: "craftedItem"
    },
    "Working": {
        description: "Earn money through honest labor.",
        daysRequired: 7,
        costPerDay: 0,
        result: "earnGold"
    },
    "Carousing": {
        description: "Spend time in taverns making contacts.",
        daysRequired: 7,
        costPerDay: 10,
        result: "contactOrTrouble"
    },
    "Recuperating": {
        description: "Rest and recover from exhaustion or disease.",
        daysRequired: 7,
        costPerDay: 1,
        result: "removeExhaustion"
    }
};

// Standard 5e item weights (lbs) for export enrichment
const EXPORT_ITEM_WEIGHTS = {
    "Dagger": 1, "Handaxes": 4, "Javelin": 2, "Mace": 4, "Quarterstaff": 4,
    "Spear": 3, "Light Crossbow": 5, "Shortbow": 2, "Shortsword": 2,
    "Scimitar": 3, "Rapier": 2, "Longsword": 3, "Battleaxe": 4, "Flail": 2,
    "Morningstar": 4, "Warhammer": 2, "Longbow": 2, "Hand Crossbow": 3,
    "Glaive": 6, "Halberd": 6, "Greatsword": 6, "Greataxe": 7,
    "Robes": 4, "Padded Armor": 8, "Leather Armor": 10, "Studded Leather": 13,
    "Hide Armor": 12, "Chain Shirt": 20, "Scale Mail": 45, "Breastplate": 20,
    "Half Plate": 40, "Ring Mail": 40, "Chain Mail": 55, "Splint Armor": 60,
    "Plate Armor": 65, "Shield": 6, "Tower Shield": 12,
    "Healing Potion": 0.5, "Greater Healing Potion": 0.5, "Antidote": 0.5,
    "Torch": 1, "Rope (50 ft)": 10, "Rations (1 day)": 2
};

class Game {
    constructor() {
        this.character = null;
        this.dm = null;
        this.selectedRace = null;
        this.selectedClass = null;
        this.selectedBackground = null;
        this.selectedCampaign = null;
        this.currentSaveKey = null; // Track which save slot is being used
        
        // Game settings
        this.difficulty = currentDifficulty;
        this.theme = currentTheme;
        this.fontSize = currentFontSize;
        this.autoSave = true;
        
        // Combat state
        this.combatTactics = 'normal'; // normal, defensive, aggressive
        this.playerStatusEffects = [];
        this.enemyStatusEffects = [];
        this.processingCombatAction = false; // Prevent combat action spam exploit
        
        // Statistics for achievements
        this.stats = {
            enemiesKilled: 0,
            bossesKilled: 0,
            dragonsKilled: 0,
            level: 1,
            goldEarned: 0,
            criticalHits: 0,
            closeCallWins: 0,
            spellsCast: 0,
            locationsVisited: 0,
            campaignsCompleted: 0,
            itemsCrafted: 0,
            maxLoyaltyReached: 0,
            flawlessVictories: 0,
            damageThisCombat: 0,
            xpThisRound: 0,
            goldThisRound: 0
        };
        
        // Unlocked achievements
        this.unlockedAchievements = new Set();
        
        // Discovered recipes
        this.discoveredRecipes = new Set();
        
        // Active side quests
        this.sideQuests = [];
        
        // Log filter settings
        this.logFilters = {
            combat: true,
            dm: true,
            loot: true,
            success: true,
            danger: true
        };
        
        // Load saved settings
        this.loadSettings();
        
        this.initCampaignSelection();
        this.initKeyboardShortcuts();
        this.checkForSaves();
    }
    
    // Initialize keyboard shortcuts
    initKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Don't trigger shortcuts when typing in input fields
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            
            const action = KEYBOARD_SHORTCUTS[e.key];
            if (action) {
                this.handleKeyboardAction(action, e);
            }
        });
    }
    
    handleKeyboardAction(action, event) {
        // Check if we're in combat (stored on dm object)
        const inCombat = this.dm && this.dm.inCombat;
        
        switch(action) {
            case 'action1':
            case 'action2':
            case 'action3':
            case 'action4':
            case 'action5':
                const btnIndex = parseInt(action.slice(-1)) - 1;
                const actionBtns = document.querySelectorAll('.actions-panel .action-btn:not([disabled])');
                if (actionBtns[btnIndex]) {
                    actionBtns[btnIndex].click();
                    event.preventDefault();
                }
                break;
            case 'attack':
                if (inCombat) {
                    this.combatAction('attack');
                    event.preventDefault();
                }
                break;
            case 'spell':
                if (inCombat) {
                    this.combatAction('spell');
                    event.preventDefault();
                }
                break;
            case 'defend':
                if (inCombat) {
                    this.combatAction('defend');
                    event.preventDefault();
                }
                break;
            case 'bonusAction':
                if (inCombat) {
                    this.showBonusActionMenu();
                    event.preventDefault();
                }
                break;
            case 'retreat_or_rest':
                if (inCombat) {
                    this.combatAction('flee');
                    event.preventDefault();
                } else {
                    this.rest();
                    event.preventDefault();
                }
                break;
            case 'inventory':
                this.openInventory();
                event.preventDefault();
                break;
            case 'character':
                this.openStatus();
                event.preventDefault();
                break;

            case 'closeModal':
                const modals = document.querySelectorAll('.modal.active, .modal-overlay');
                modals.forEach(m => m.remove ? m.remove() : m.classList.remove('active'));
                event.preventDefault();
                break;
            case 'continue':
                // Click any continue button that's visible
                const continueBtn = document.querySelector('.choice-btn:only-child, .close-modal');
                if (continueBtn) {
                    continueBtn.click();
                    event.preventDefault();
                }
                break;
        }
    }
    
    // Load/Save settings
    loadSettings() {
        const settings = localStorage.getItem('dndGameSettings');
        if (settings) {
            const parsed = JSON.parse(settings);
            this.difficulty = parsed.difficulty || 'normal';
            this.theme = parsed.theme || 'dark';
            this.fontSize = parsed.fontSize || 'medium';
            this.unlockedAchievements = new Set(parsed.achievements || []);
            this.discoveredRecipes = new Set(parsed.recipes || []);
            this.stats = { ...this.stats, ...parsed.stats };
            currentDifficulty = this.difficulty;
            currentTheme = this.theme;
            currentFontSize = this.fontSize;
        }
        this.applyTheme();
        this.applyFontSize();
    }
    
    saveSettings() {
        const settings = {
            difficulty: this.difficulty,
            theme: this.theme,
            fontSize: this.fontSize,
            achievements: Array.from(this.unlockedAchievements),
            recipes: Array.from(this.discoveredRecipes),
            stats: this.stats
        };
        localStorage.setItem('dndGameSettings', JSON.stringify(settings));
    }
    
    // Theme system
    applyTheme() {
        document.body.classList.remove('theme-dark', 'theme-light');
        document.body.classList.add(`theme-${this.theme}`);
    }
    
    toggleTheme() {
        this.theme = this.theme === 'dark' ? 'light' : 'dark';
        currentTheme = this.theme;
        this.applyTheme();
        this.saveSettings();
        this.log(`🎨 Theme changed to ${this.theme} mode`, 'dm');
    }
    
    // Font size system
    applyFontSize() {
        document.body.classList.remove('font-small', 'font-medium', 'font-large');
        document.body.classList.add(`font-${this.fontSize}`);
    }
    
    setFontSize(size) {
        this.fontSize = size;
        currentFontSize = size;
        this.applyFontSize();
        this.saveSettings();
        this.log(`📝 Font size changed to ${size}`, 'dm');
    }
    
    // Difficulty system
    setDifficulty(diff) {
        this.difficulty = diff;
        currentDifficulty = diff;
        this.saveSettings();
        const settings = DIFFICULTY_SETTINGS[diff];
        this.log(`⚔️ Difficulty set to ${settings.name}: ${settings.description}`, 'dm');
    }
    
    // Achievement system
    checkAchievements() {
        this.stats.level = this.character?.level || 1;
        
        for (const [id, achievement] of Object.entries(ACHIEVEMENTS)) {
            if (!this.unlockedAchievements.has(id) && achievement.condition(this.stats)) {
                this.unlockAchievement(id);
            }
        }
    }
    
    unlockAchievement(id) {
        const achievement = ACHIEVEMENTS[id];
        if (!achievement || this.unlockedAchievements.has(id)) return;
        
        this.unlockedAchievements.add(id);
        soundManager.playAchievement();
        
        // Show achievement notification
        this.showAchievementNotification(achievement);
        this.log(`🏆 <strong>ACHIEVEMENT UNLOCKED:</strong> ${achievement.icon} ${achievement.name} - ${achievement.description}`, 'success');
        this.saveSettings();
    }
    
    showAchievementNotification(achievement) {
        const notification = document.createElement('div');
        notification.className = 'achievement-notification';
        notification.innerHTML = `
            <div class="achievement-icon">${achievement.icon}</div>
            <div class="achievement-text">
                <div class="achievement-title">Achievement Unlocked!</div>
                <div class="achievement-name">${achievement.name}</div>
                <div class="achievement-desc">${achievement.description}</div>
            </div>
        `;
        document.body.appendChild(notification);
        
        setTimeout(() => notification.classList.add('show'), 100);
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 500);
        }, 4000);
    }
    
    openAchievements() {
        let html = '<h2>🏆 Achievements</h2><div class="achievements-grid">';
        
        for (const [id, achievement] of Object.entries(ACHIEVEMENTS)) {
            const unlocked = this.unlockedAchievements.has(id);
            html += `
                <div class="achievement-card ${unlocked ? 'unlocked' : 'locked'}">
                    <div class="achievement-icon">${unlocked ? achievement.icon : '🔒'}</div>
                    <div class="achievement-info">
                        <div class="achievement-name">${unlocked ? achievement.name : '???'}</div>
                        <div class="achievement-desc">${unlocked ? achievement.description : 'Keep playing to unlock'}</div>
                    </div>
                </div>
            `;
        }
        
        html += '</div><button class="close-modal" onclick="this.parentElement.parentElement.remove()">Close</button>';
        
        this.showModal(html);
    }
    
    // Generic modal display
    showModal(html) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `<div class="modal-content">${html}</div>`;
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
        document.body.appendChild(modal);
    }
    
    // Side Quest System
    generateSideQuest() {
        const template = SIDE_QUEST_TEMPLATES[Math.floor(Math.random() * SIDE_QUEST_TEMPLATES.length)];
        const locations = this.dm.campaign?.locations || ['the wilderness', 'a dark cave', 'the forest'];
        const location = locations[Math.floor(Math.random() * locations.length)];
        const enemies = this.dm.campaign?.enemies || { Bandit: {} };
        const target = Object.keys(enemies)[Math.floor(Math.random() * Object.keys(enemies).length)];
        const items = ['Ancient Scroll', 'Golden Chalice', 'Family Ring', 'Enchanted Gem'];
        const item = items[Math.floor(Math.random() * items.length)];
        
        const quest = {
            id: Date.now(),
            ...template,
            title: template.title,
            description: template.description
                .replace('{location}', location)
                .replace('{target}', target)
                .replace('{item}', item),
            target: target,
            location: location,
            progress: 0,
            goal: template.type === 'kill' ? Math.floor(Math.random() * 3) + 2 : 1,
            completed: false,
            reward: {
                gold: Math.floor(template.reward.gold * (1 + this.character.level * 0.1)),
                xp: Math.floor(template.reward.xp * (1 + this.character.level * 0.15))
            }
        };
        
        this.sideQuests.push(quest);
        return quest;
    }
    
    checkSideQuestProgress(eventType, target) {
        for (const quest of this.sideQuests) {
            if (quest.completed) continue;
            
            if (quest.type === eventType) {
                if (eventType === 'kill' && target.toLowerCase().includes(quest.target.toLowerCase())) {
                    quest.progress++;
                    this.log(`📋 Quest Progress: ${quest.title} (${quest.progress}/${quest.goal})`, 'dm');
                    
                    if (quest.progress >= quest.goal) {
                        this.completeSideQuest(quest);
                    }
                } else if (eventType === 'explore' && target === quest.location) {
                    quest.progress = quest.goal;
                    this.completeSideQuest(quest);
                }
            }
        }
    }
    
    completeSideQuest(quest) {
        quest.completed = true;
        this.character.gold += quest.reward.gold;
        this.character.experience += quest.reward.xp;
        this.stats.goldEarned += quest.reward.gold;
        
        soundManager.playAchievement();
        this.log(`🎉 <strong>QUEST COMPLETE:</strong> ${quest.title}!`, 'success');
        this.log(`Rewards: ${quest.reward.gold} gold, ${quest.reward.xp} XP`, 'loot');
        
        this.checkAchievements();
        this.autoSaveGame();
    }
    
    openSideQuests() {
        let html = '<h2>📋 Quests</h2>';
        
        // Show main campaign quests from journal
        const journalActive = this.character.journal.quests.filter(q => !q.completed);
        const journalCompleted = this.character.journal.quests.filter(q => q.completed);
        
        // Show side quests
        const sideActive = this.sideQuests.filter(q => !q.completed);
        const sideCompleted = this.sideQuests.filter(q => q.completed);
        
        const hasAnyQuests = journalActive.length > 0 || journalCompleted.length > 0 || sideActive.length > 0 || sideCompleted.length > 0;
        
        if (!hasAnyQuests) {
            html += '<p style="text-align:center;color:#888;">No quests yet. Explore to find opportunities!</p>';
        } else {
            // Main Campaign Quests
            if (journalActive.length > 0) {
                html += '<h3 style="color:#c9a227;">📜 Main Quests</h3>';
                journalActive.forEach(q => {
                    html += `
                        <div class="quest-card">
                            <div class="quest-title">${q.name}</div>
                            <div class="quest-desc">${q.description}</div>
                        </div>
                    `;
                });
            }
            
            // Side Quests
            if (sideActive.length > 0) {
                html += '<h3 style="color:#c9a227;">⭐ Side Quests</h3>';
                sideActive.forEach(q => {
                    html += `
                        <div class="quest-card">
                            <div class="quest-title">${q.title}</div>
                            <div class="quest-desc">${q.description}</div>
                            <div class="quest-progress">Progress: ${q.progress}/${q.goal}</div>
                            <div class="quest-reward">Reward: ${q.reward.gold}g, ${q.reward.xp} XP</div>
                        </div>
                    `;
                });
            }
            
            // Completed Quests
            if (journalCompleted.length > 0 || sideCompleted.length > 0) {
                html += '<h3 style="color:#4CAF50;">✅ Completed</h3>';
                journalCompleted.forEach(q => {
                    html += `<div class="quest-card completed"><div class="quest-title">✓ ${q.name}</div></div>`;
                });
                sideCompleted.forEach(q => {
                    html += `<div class="quest-card completed"><div class="quest-title">✓ ${q.title}</div></div>`;
                });
            }
        }
        
        html += '<button class="close-modal" onclick="this.parentElement.parentElement.remove()">Close</button>';
        this.showModal(html);
    }
    
    // Settings Panel
    openSettings() {
        const html = `
            <div class="settings-modal">
                <h2>⚙️ Settings</h2>
                
                <div class="settings-grid">
                    <div class="settings-section">
                        <h3>Difficulty</h3>
                        <div class="settings-buttons">
                            <button class="setting-btn ${this.difficulty === 'easy' ? 'active' : ''}" onclick="game.setDifficulty('easy'); game.openSettings();">Easy</button>
                            <button class="setting-btn ${this.difficulty === 'normal' ? 'active' : ''}" onclick="game.setDifficulty('normal'); game.openSettings();">Normal</button>
                            <button class="setting-btn ${this.difficulty === 'hard' ? 'active' : ''}" onclick="game.setDifficulty('hard'); game.openSettings();">Hard</button>
                        </div>
                        <p class="setting-desc">${DIFFICULTY_SETTINGS[this.difficulty].description}</p>
                    </div>
                    
                    <div class="settings-section">
                        <h3>Theme</h3>
                        <div class="settings-buttons">
                            <button class="setting-btn ${this.theme === 'dark' ? 'active' : ''}" onclick="game.theme='dark'; game.applyTheme(); game.saveSettings(); game.openSettings();">🌙 Dark</button>
                            <button class="setting-btn ${this.theme === 'light' ? 'active' : ''}" onclick="game.theme='light'; game.applyTheme(); game.saveSettings(); game.openSettings();">☀️ Light</button>
                        </div>
                    </div>
                    
                    <div class="settings-section">
                        <h3>Font Size</h3>
                        <div class="settings-buttons">
                            <button class="setting-btn ${this.fontSize === 'small' ? 'active' : ''}" onclick="game.setFontSize('small'); game.openSettings();">Small</button>
                            <button class="setting-btn ${this.fontSize === 'medium' ? 'active' : ''}" onclick="game.setFontSize('medium'); game.openSettings();">Medium</button>
                            <button class="setting-btn ${this.fontSize === 'large' ? 'active' : ''}" onclick="game.setFontSize('large'); game.openSettings();">Large</button>
                        </div>
                    </div>
                    
                    <div class="settings-section">
                        <h3>Audio</h3>
                        <div class="settings-buttons">
                            <button class="setting-btn ${soundManager.enabled ? 'active' : ''}" onclick="soundManager.enabled = !soundManager.enabled; game.openSettings();">🔊 Sound: ${soundManager.enabled ? 'ON' : 'OFF'}</button>
                            <button class="setting-btn ${musicManager.enabled ? 'active' : ''}" onclick="musicManager.toggle(); game.openSettings();">🎵 Music: ${musicManager.enabled ? 'ON' : 'OFF'}</button>
                        </div>
                        
                        <h4 style="margin-top: 15px;">🌲 Ambient Soundscapes</h4>
                        <div class="settings-buttons">
                            <button class="setting-btn ${musicManager.ambientEnabled ? 'active' : ''}" 
                                onclick="musicManager.setAmbientEnabled(!musicManager.ambientEnabled); game.openSettings();">
                                🌊 Ambient: ${musicManager.ambientEnabled ? 'ON' : 'OFF'}
                            </button>
                        </div>
                        ${musicManager.ambientEnabled ? `
                            <div class="volume-control" style="margin-top: 10px; padding: 10px; background: rgba(0,0,0,0.3); border-radius: 8px;">
                                <label style="display: block; margin-bottom: 5px;">Volume</label>
                                <input type="range" min="0" max="100" value="${musicManager.ambientVolume * 100}" 
                                    oninput="musicManager.setAmbientVolume(this.value / 100); this.nextElementSibling.textContent = this.value + '%';"
                                    style="width: 100%;">
                                <span style="display: block; text-align: center; margin-top: 5px;">${Math.round(musicManager.ambientVolume * 100)}%</span>
                            </div>
                        ` : ''}
                    </div>
                    
                    <div class="settings-section">
                        <h3>Auto-Save</h3>
                        <div class="settings-buttons">
                            <button class="setting-btn ${this.autoSave ? 'active' : ''}" onclick="game.autoSave = !game.autoSave; game.openSettings();">Auto-Save: ${this.autoSave ? 'ON' : 'OFF'}</button>
                        </div>
                    </div>
                </div>
                
                <button class="close-modal" onclick="this.parentElement.parentElement.remove()">Close</button>
            </div>
        `;
        
        // Remove any existing modal first
        document.querySelectorAll('.modal-overlay').forEach(m => m.remove());
        this.showModal(html);
    }
    
    // Combat Tactics System
    setCombatTactics(tactics) {
        this.combatTactics = tactics;
        
        switch(tactics) {
            case 'defensive':
                this.log('🛡️ You adopt a defensive stance: +2 AC, -2 Attack', 'dm');
                break;
            case 'aggressive':
                this.log('⚔️ You adopt an aggressive stance: +2 Attack, -2 AC', 'dm');
                break;
            default:
                this.log('⚖️ You return to a balanced stance', 'dm');
        }
    }
    
    getTacticsModifiers() {
        switch(this.combatTactics) {
            case 'defensive': return { ac: 2, attack: -2, damage: 0 };
            case 'aggressive': return { ac: -2, attack: 2, damage: 2 };
            default: return { ac: 0, attack: 0, damage: 0 };
        }
    }
    
    // Status Effects System
    applyStatusEffect(target, effectId, source = 'unknown') {
        const effectTemplate = STATUS_EFFECTS[effectId];
        if (!effectTemplate) return;
        
        const effect = {
            ...effectTemplate,
            id: effectId,
            remainingDuration: effectTemplate.duration,
            source: source
        };
        
        if (target === 'player') {
            // Check if already has this effect
            const existing = this.playerStatusEffects.findIndex(e => e.id === effectId);
            if (existing >= 0) {
                this.playerStatusEffects[existing].remainingDuration = effectTemplate.duration;
            } else {
                this.playerStatusEffects.push(effect);
            }
            this.log(`${effectTemplate.icon} You are now ${effectTemplate.name}! (${effectTemplate.description})`, 'danger');
        } else {
            const existing = this.enemyStatusEffects.findIndex(e => e.id === effectId);
            if (existing >= 0) {
                this.enemyStatusEffects[existing].remainingDuration = effectTemplate.duration;
            } else {
                this.enemyStatusEffects.push(effect);
            }
            this.log(`${effectTemplate.icon} Enemy is now ${effectTemplate.name}!`, 'success');
        }
    }
    
    processStatusEffects(target) {
        const effects = target === 'player' ? this.playerStatusEffects : this.enemyStatusEffects;
        const char = target === 'player' ? this.character : this.dm.currentEnemy;
        
        const toRemove = [];
        
        for (const effect of effects) {
            // Apply turn start effects
            if (effect.onTurnStart && char) {
                const message = effect.onTurnStart(char, effect);
                if (message) this.log(message, target === 'player' ? 'danger' : 'success');
                
                if (effect.id === 'poisoned') soundManager.playPoison();
                if (effect.id === 'regenerating') soundManager.playHeal();
            }
            
            // Reduce duration
            effect.remainingDuration--;
            
            if (effect.remainingDuration <= 0) {
                toRemove.push(effect.id);
                this.log(`${effect.icon} ${effect.name} wears off.`, 'dm');
            }
        }
        
        // Remove expired effects
        if (target === 'player') {
            this.playerStatusEffects = this.playerStatusEffects.filter(e => !toRemove.includes(e.id));
        } else {
            this.enemyStatusEffects = this.enemyStatusEffects.filter(e => !toRemove.includes(e.id));
        }
    }
    
    // Check if action is prevented by status effects
    canTakeAction(target) {
        const effects = target === 'player' ? this.playerStatusEffects : this.enemyStatusEffects;
        return !effects.some(e => e.preventsAction);
    }
    
    toggleLogFilter(type) {
        this.logFilters[type] = !this.logFilters[type];
    }

    // Auto-save system
    autoSaveGame() {
        if (this.autoSave && this.character) {
            this.saveGame();
            this.log('💾 Auto-saved!', 'success');
        }
    }
    
    initCampaignSelection() {
        // Populate campaign options
        const campaignContainer = document.getElementById("campaignOptions");
        if (!campaignContainer) return;
        
        campaignContainer.innerHTML = "";
        
        for (let campaignId in CAMPAIGNS) {
            const campaign = CAMPAIGNS[campaignId];
            let coverClass = 'nights-dark';
            if (campaignId === 'curse_of_strahd') coverClass = 'strahd';
            else if (campaignId === 'tomb_of_annihilation') coverClass = 'tomb';
            else if (campaignId === 'lost_mine_of_phandelver') coverClass = 'phandelver';
            else if (campaignId === 'keep_on_borderlands') coverClass = 'borderlands';
            
            campaignContainer.innerHTML += `
                <div class="campaign-card" data-campaign="${campaignId}" onclick="game.selectCampaign('${campaignId}')">
                    <div class="campaign-cover ${coverClass}">
                        <img src="${campaign.coverArt}" alt="${campaign.name}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                        <span class="campaign-cover-fallback">${campaign.icon}</span>
                    </div>
                    <div class="campaign-info">
                        <h3>${campaign.name}</h3>
                        <p class="campaign-setting">Setting: ${campaign.setting} | Level Range: ${campaign.level}</p>
                        <p class="campaign-desc">${campaign.description}</p>
                    </div>
                </div>
            `;
        }
        
        // Show saved games section
        this.updateSavesDisplay();
    }
    
    updateSavesDisplay() {
        const saves = getSaveSlots();
        const savesContainer = document.getElementById("savedGamesContainer");
        
        if (!savesContainer) return;
        
        if (saves.length === 0) {
            savesContainer.innerHTML = `<p class="no-saves">No saved games found. Start a new adventure!</p>`;
            return;
        }
        
        let savesHTML = `<h3>📜 Saved Adventures</h3><div class="saves-list">`;
        
        saves.forEach(save => {
            const data = save.data;
            const campaign = CAMPAIGNS[data.campaignId] || { name: "Unknown", icon: "❓" };
            const saveDate = new Date(data.saveTime || 0).toLocaleDateString();
            const saveTime = new Date(data.saveTime || 0).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
            const charName = data.character?.name || "Unknown";
            const charLevel = data.character?.level || 1;
            const charClass = data.character?.charClass || "Unknown";
            const chapter = data.currentChapter || 0;
            
            savesHTML += `
                <div class="save-slot" data-save-key="${save.key}">
                    <div class="save-icon">${campaign.icon}</div>
                    <div class="save-info">
                        <div class="save-character">${charName} - Level ${charLevel} ${charClass}</div>
                        <div class="save-campaign">${campaign.name} - Chapter ${chapter + 1}</div>
                        <div class="save-time">${saveDate} at ${saveTime}</div>
                    </div>
                    <div class="save-actions">
                        <button class="save-load-btn" onclick="game.loadSave('${save.key}')" title="Load Game">▶️</button>
                        <button class="save-delete-btn" onclick="game.confirmDeleteSave('${save.key}')" title="Delete Save">🗑️</button>
                    </div>
                </div>
            `;
        });
        
        savesHTML += `</div>`;
        savesContainer.innerHTML = savesHTML;
    }
    
    loadSave(saveKey) {
        const saveData = localStorage.getItem(saveKey);
        if (saveData) {
            this.currentSaveKey = saveKey;
            this.loadGameFromData(JSON.parse(saveData));
        }
    }
    
    confirmDeleteSave(saveKey) {
        const saveData = JSON.parse(localStorage.getItem(saveKey));
        const charName = saveData?.character?.name || "Unknown";
        
        if (confirm(`Are you sure you want to delete the save for "${charName}"?\n\nThis cannot be undone!`)) {
            deleteSave(saveKey);
            this.updateSavesDisplay();
        }
    }
    
    selectCampaign(campaignId) {
        this.selectedCampaign = campaignId;
        ACTIVE_CAMPAIGN = CAMPAIGNS[campaignId];
        
        document.querySelectorAll("[data-campaign]").forEach(el => el.classList.remove("selected"));
        document.querySelector(`[data-campaign="${campaignId}"]`).classList.add("selected");
        
        // Show character creation screen
        document.getElementById("campaignSelectScreen").classList.add("hidden");
        document.getElementById("creationScreen").classList.remove("hidden");
        
        this.initCreation();
    }
    
    backToCampaignSelect() {
        // Reset selections
        this.selectedRace = null;
        this.selectedClass = null;
        this.selectedBackground = null;
        this.selectedCampaign = null;
        ACTIVE_CAMPAIGN = null;
        
        // Reset name input
        document.getElementById("nameInput").value = "";
        document.getElementById("startGameBtn").disabled = true;
        
        // Show campaign selection screen
        document.getElementById("creationScreen").classList.add("hidden");
        document.getElementById("campaignSelectScreen").classList.remove("hidden");
        
        // Remove selected state from campaigns
        document.querySelectorAll("[data-campaign]").forEach(el => el.classList.remove("selected"));
    }

    // ==================== TITLE SCREEN & ONBOARDING ====================
    
    showCampaignSelect() {
        document.getElementById("titleScreen").classList.add("hidden");
        document.getElementById("campaignSelectScreen").classList.remove("hidden");
    }
    
    backToTitleScreen() {
        document.getElementById("campaignSelectScreen").classList.add("hidden");
        document.getElementById("titleScreen").classList.remove("hidden");
    }
    
    // Check for existing saves and update title screen
    checkForSaves() {
        const saves = getSaveSlots();
        const titleButtons = document.querySelector('.title-buttons');
        
        if (saves.length > 0 && titleButtons) {
            // Add continue button if not already there
            if (!document.getElementById('continueBtn')) {
                const continueBtn = document.createElement('button');
                continueBtn.id = 'continueBtn';
                continueBtn.className = 'title-btn';
                continueBtn.innerHTML = '▶️ Continue Last Adventure';
                continueBtn.onclick = () => this.loadSave(saves[0].key);
                titleButtons.insertBefore(continueBtn, titleButtons.firstChild);
            }
        }
    }
    
    backToTitleScreen() {
        document.getElementById("campaignSelectScreen").classList.add("hidden");
        document.getElementById("titleScreen").classList.remove("hidden");
    }
    
    // Tutorial system
    tutorialSteps = [
        {
            icon: "⚔️",
            title: "Welcome, Adventurer!",
            text: "Welcome to <strong>Dungeons & Dragons: Realms of Adventure</strong>! This tutorial will teach you the basics of playing this epic fantasy RPG.",
            tip: "You can skip this tutorial anytime and access it later from the Help menu."
        },
        {
            icon: "🎭",
            title: "Create Your Hero",
            text: "First, you'll create your character by choosing a <strong>Race</strong> (like Human, Elf, or Dwarf), a <strong>Class</strong> (Fighter, Wizard, Rogue, etc.), and a <strong>Background</strong> that shapes your story.",
            tip: "Each combination creates a unique playstyle. Fighters excel in combat, Wizards cast powerful spells, and Rogues are masters of stealth!"
        },
        {
            icon: "🎲",
            title: "The D20 System",
            text: "This game uses the classic D&D dice system. When you attempt actions, you'll roll a <strong>d20</strong> (20-sided die) and add your modifiers. Rolling high is good!",
            tip: "Rolling a natural 20 is a Critical Hit - double damage! Rolling a 1 is a Critical Fail. Press [A] during combat for a quick attack."
        },
        {
            icon: "⚔️",
            title: "Combat Basics",
            text: "In combat, you can <strong>Attack</strong> with your weapon, cast <strong>Spells</strong> (if you're a magic user), <strong>Defend</strong> to boost your armor, or <strong>Retreat</strong> to flee.",
            tip: "Use the Tactics buttons (Balanced, Defensive, Aggressive) to change your fighting style. Keyboard shortcuts: [A]ttack, [S]pell, [D]efend, [R]etreat"
        },
        {
            icon: "🗺️",
            title: "Exploration",
            text: "Use <strong>Explore</strong> to investigate your surroundings and find treasure, encounters, or story events. <strong>Travel</strong> lets you move between locations.",
            tip: "Higher danger areas have tougher enemies but better rewards. Rest at safe locations to recover HP!"
        },
        {
            icon: "📜",
            title: "Quests & Story",
            text: "Follow your campaign's main <strong>Objectives</strong> (shown at the top) to progress the story. You can also complete <strong>Side Quests</strong> for extra rewards!",
            tip: "Talk to NPCs, explore thoroughly, and check your Journal to track your adventures."
        },
        {
            icon: "🏆",
            title: "Ready to Play!",
            text: "You're ready to begin your adventure! Remember to <strong>Save</strong> your progress regularly. Good luck, hero - your legend awaits!",
            tip: "Earn Achievements by completing challenges. Check the Settings to customize difficulty, theme, and more!"
        }
    ];
    
    currentTutorialStep = 0;
    
    showTutorial() {
        this.currentTutorialStep = 0;
        document.getElementById("tutorialOverlay").classList.remove("hidden");
        this.updateTutorialDisplay();
    }
    
    updateTutorialDisplay() {
        const step = this.tutorialSteps[this.currentTutorialStep];
        document.getElementById("tutorialIcon").textContent = step.icon;
        document.getElementById("tutorialTitle").textContent = step.title;
        document.getElementById("tutorialText").innerHTML = step.text;
        document.getElementById("tutorialTipText").textContent = step.tip;
        
        // Update progress dots
        const progressContainer = document.getElementById("tutorialProgress");
        progressContainer.innerHTML = this.tutorialSteps.map((_, i) => {
            let cls = "tutorial-dot";
            if (i < this.currentTutorialStep) cls += " completed";
            else if (i === this.currentTutorialStep) cls += " active";
            return `<div class="${cls}"></div>`;
        }).join("");
        
        // Update button text
        const nextBtn = document.getElementById("tutorialNextBtn");
        if (this.currentTutorialStep === this.tutorialSteps.length - 1) {
            nextBtn.textContent = "Start Playing! 🎮";
        } else {
            nextBtn.textContent = "Next →";
        }
    }
    
    nextTutorial() {
        if (this.currentTutorialStep < this.tutorialSteps.length - 1) {
            this.currentTutorialStep++;
            this.updateTutorialDisplay();
        } else {
            this.skipTutorial();
        }
    }
    
    skipTutorial() {
        document.getElementById("tutorialOverlay").classList.add("hidden");
    }
    
    // Quick Start - pre-built characters
    quickStart(characterClass) {
        // Set default campaign
        this.selectedCampaign = "nights_dark_terror";
        ACTIVE_CAMPAIGN = CAMPAIGNS["nights_dark_terror"];
        
        // Pre-defined quick start characters
        const quickCharacters = {
            "Fighter": { race: "Human", class: "Fighter", background: "Soldier", name: "Aldric the Bold" },
            "Wizard": { race: "Elf", class: "Wizard", background: "Scholar", name: "Elyndra Starweave" },
            "Rogue": { race: "Halfling", class: "Rogue", background: "Criminal", name: "Finn Shadowstep" },
            "Cleric": { race: "Dwarf", class: "Cleric", background: "Acolyte", name: "Thorin Ironheart" }
        };
        
        const preset = quickCharacters[characterClass];
        
        this.character = new Character();
        this.character.name = preset.name;
        this.character.race = preset.race;
        this.character.characterClass = preset.class;
        this.character.charClass = preset.class;
        this.character.background = preset.background;
        
        this.character.rollStats();
        this.character.applyRacialBonus();
        this.character.setupClass();
        this.character.setupBackground();
        
        this.generateCharacterPersonality();
        
        this.dm = new DungeonMaster(this.character, this.selectedCampaign);
        
        // Hide title screen, show game
        document.getElementById("titleScreen").classList.add("hidden");
        document.getElementById("gameScreen").classList.remove("hidden");
        document.getElementById("characterPanel").classList.remove("hidden");
        
        // Update chapter banner with campaign info
        const campaign = this.dm.campaign;
        document.querySelector(".chapter-banner .chapter-title").textContent = `${campaign.icon} ${campaign.name.toUpperCase()} ${campaign.icon}`;
        
        this.updateUI();
        
        this.log(`⚡ <strong>Quick Start!</strong> Welcome, ${this.character.name}!`, "success");
        this.log(`You are a Level ${this.character.level} ${this.character.race} ${this.character.charClass}.`, "dm");
        this.dm.narrateLocation();
        
        // Show brief intro
        setTimeout(() => {
            this.showQuickStartIntro();
        }, 1000);
    }
    
    showQuickStartIntro() {
        const html = `
            <h2>⚡ Quick Start</h2>
            <div style="text-align: center; margin-bottom: 20px;">
                <div style="font-size: 3rem; margin-bottom: 15px;">🎮</div>
                <p style="color: #ccc; margin-bottom: 15px;">
                    You've jumped right into <strong>Night's Dark Terror</strong>!
                </p>
                <p style="color: #888; font-size: 0.9rem; margin-bottom: 20px;">
                    Your mission: Escort Stephan to his family homestead at Sukiskyn.<br>
                    Use <strong>Explore</strong> to investigate and <strong>Travel</strong> to move.
                </p>
                <div style="background: rgba(201, 162, 39, 0.15); border-left: 4px solid #c9a227; padding: 15px; text-align: left; border-radius: 0 8px 8px 0;">
                    <strong style="color: #c9a227;">💡 Quick Tips:</strong>
                    <ul style="margin: 10px 0 0 20px; color: #aaa; font-size: 0.9rem;">
                        <li>Press <kbd style="background: #333; padding: 2px 6px; border-radius: 3px;">A</kbd> to attack in combat</li>
                        <li>Click <strong>Rest</strong> when HP is low</li>
                        <li>Check your <strong>Journal</strong> for objectives</li>
                    </ul>
                </div>
            </div>
            <button class="close-modal" onclick="this.parentElement.parentElement.remove()">Begin Adventure!</button>
        `;
        this.showModal(html);
    }
    
    // Visual effects for combat
    showFloatingDamage(amount, type = 'damage', x = null, y = null) {
        const el = document.createElement('div');
        el.className = `floating-damage ${type}`;
        el.textContent = type === 'damage' ? `-${amount}` : `+${amount}`;
        
        // Position near the game log if no coordinates given
        if (x === null || y === null) {
            const log = document.getElementById('gameLog');
            const rect = log.getBoundingClientRect();
            x = rect.left + rect.width / 2 + (Math.random() - 0.5) * 100;
            y = rect.top + 50;
        }
        
        el.style.left = `${x}px`;
        el.style.top = `${y}px`;
        document.body.appendChild(el);
        
        setTimeout(() => el.remove(), 1500);
    }
    
    shakeElement(elementId) {
        const el = document.getElementById(elementId);
        if (el) {
            el.classList.add('shake');
            setTimeout(() => el.classList.remove('shake'), 500);
        }
    }
    
    flashElement(elementId, type = 'damage') {
        const el = document.getElementById(elementId);
        if (el) {
            const cls = type === 'damage' ? 'damage-taken' : 'heal-received';
            el.classList.add(cls);
            setTimeout(() => el.classList.remove(cls), 300);
        }
    }

    initCreation() {
        // Icon maps for visual flair
        const raceIcons = {
            "Human": "👤", "Elf": "🧝", "Dwarf": "⛏️", "Halfling": "🍀",
            "Dragonborn": "🐉", "Tiefling": "😈", "Half-Orc": "🪓"
        };
        const classIcons = {
            "Fighter": "⚔️", "Wizard": "🧙", "Rogue": "🗡️", "Cleric": "⛪",
            "Ranger": "🏹", "Barbarian": "💪", "Paladin": "🛡️", "Monk": "🥋",
            "Warlock": "👁️", "Bard": "🎵", "Sorcerer": "✨", "Druid": "🌿",
            "Artificer": "⚙️"
        };
        const bgIcons = {
            "Soldier": "🎖️", "Scholar": "📚", "Criminal": "🔪", "Noble": "👑",
            "Outlander": "🌲", "Acolyte": "🙏"
        };
        
        // Class groupings for organized display
        const classGroups = {
            "Martial": ["Fighter", "Barbarian", "Monk", "Rogue"],
            "Divine": ["Cleric", "Paladin", "Druid"],
            "Arcane": ["Wizard", "Sorcerer", "Warlock", "Bard"],
            "Hybrid": ["Ranger", "Artificer"]
        };

        // Populate race options
        const raceContainer = document.getElementById("raceOptions");
        raceContainer.innerHTML = "";
        for (let race in GAME_DATA.races) {
            const traits = GAME_DATA.races[race].traits.join(", ");
            raceContainer.innerHTML += `
                <div class="option-card" data-race="${race}" onclick="game.selectRace('${race}')">
                    <span class="option-icon">${raceIcons[race] || "👤"}</span>
                    <div class="option-info">
                        <h3>${race}</h3>
                        <p>${traits}</p>
                    </div>
                </div>
            `;
        }

        // Populate class options with grouped layout
        const classContainer = document.getElementById("classOptions");
        classContainer.innerHTML = "";
        for (let groupName in classGroups) {
            classContainer.innerHTML += `<div class="class-group-label">${groupName}</div>`;
            for (let cls of classGroups[groupName]) {
                const info = GAME_DATA.classes[cls];
                if (!info) continue;
                const castLabel = info.spellcaster ? "🔮" : "";
                classContainer.innerHTML += `
                    <div class="option-card" data-class="${cls}" onclick="game.selectClass('${cls}')">
                        <span class="option-icon">${classIcons[cls] || "⚔️"}</span>
                        <div class="option-info">
                            <h3>${cls}</h3>
                            <p>d${info.hitDie} · ${info.primary.toUpperCase()} ${castLabel}</p>
                        </div>
                    </div>
                `;
            }
        }

        // Populate background options
        const bgContainer = document.getElementById("backgroundOptions");
        bgContainer.innerHTML = "";
        for (let bg in GAME_DATA.backgrounds) {
            const info = GAME_DATA.backgrounds[bg];
            bgContainer.innerHTML += `
                <div class="option-card" data-background="${bg}" onclick="game.selectBackground('${bg}')">
                    <span class="option-icon">${bgIcons[bg] || "📜"}</span>
                    <div class="option-info">
                        <h3>${bg}</h3>
                        <p>${info.feature}</p>
                    </div>
                </div>
            `;
        }
    }

    selectRace(race) {
        this.selectedRace = race;
        document.querySelectorAll("[data-race]").forEach(el => el.classList.remove("selected"));
        document.querySelector(`[data-race="${race}"]`).classList.add("selected");
        this.checkStartButton();
    }

    selectClass(cls) {
        this.selectedClass = cls;
        document.querySelectorAll("[data-class]").forEach(el => el.classList.remove("selected"));
        document.querySelector(`[data-class="${cls}"]`).classList.add("selected");
        this.checkStartButton();
    }

    selectBackground(bg) {
        this.selectedBackground = bg;
        document.querySelectorAll("[data-background]").forEach(el => el.classList.remove("selected"));
        document.querySelector(`[data-background="${bg}"]`).classList.add("selected");
        this.checkStartButton();
    }

    checkStartButton() {
        const name = document.getElementById("nameInput").value.trim();
        const canStart = name && this.selectedRace && this.selectedClass && this.selectedBackground;
        document.getElementById("startGameBtn").disabled = !canStart;
    }

    startGame() {
        const name = document.getElementById("nameInput").value.trim() || "Adventurer";
        
        this.character = new Character();
        this.character.name = name;
        this.character.race = this.selectedRace;
        this.character.characterClass = this.selectedClass;
        this.character.charClass = this.selectedClass;
        this.character.background = this.selectedBackground;
        
        this.character.rollStats();
        this.character.applyRacialBonus();
        this.character.setupClass();
        this.character.setupBackground();
        
        // Apply imported character data if available
        if (this.importedCharacter) {
            this.startGameWithImport();
        }
        
        // Generate character personality
        this.generateCharacterPersonality();
        
        this.dm = new DungeonMaster(this.character, this.selectedCampaign);
        
        // Switch to game screen
        document.getElementById("creationScreen").classList.add("hidden");
        document.getElementById("gameScreen").classList.remove("hidden");
        document.getElementById("characterPanel").classList.remove("hidden");
        
        // Update chapter banner with campaign info
        const campaign = this.dm.campaign;
        document.querySelector(".chapter-banner .chapter-title").textContent = `${campaign.icon} ${campaign.name.toUpperCase()} ${campaign.icon}`;
        
        this.updateUI();
        
        this.log(`Welcome, ${this.character.name} the ${this.character.race} ${this.character.charClass}!`, "dm");
        this.log(`<strong>${campaign.icon} ${campaign.name.toUpperCase()} ${campaign.icon}</strong>`, "dm");
        
        // Show personality info
        this.log(`<em>Your ideal: ${this.character.personality.ideal}</em>`, "dm");
        
        // Campaign-specific intro
        if (this.selectedCampaign === "nights_dark_terror") {
            this.log(`You begin your adventure in the frontier town of Kelven, in the Grand Duchy of Karameikos.`, "dm");
            this.log("Your stats have been rolled: " + Object.entries(this.character.stats).map(([k,v]) => `${k.toUpperCase()}: ${v}`).join(", "), "success");
            this.log(`<em>A horse trader named Stephan approaches you in the tavern...</em>`, "dm");
            setTimeout(() => this.triggerStoryEvent("intro"), 1500);
        } else if (this.selectedCampaign === "curse_of_strahd") {
            this.log(`Mysterious mists have surrounded you and your companions. When they clear, you find yourselves in a dark, unfamiliar land.`, "dm");
            this.log("Your stats have been rolled: " + Object.entries(this.character.stats).map(([k,v]) => `${k.toUpperCase()}: ${v}`).join(", "), "success");
            this.log(`<em>The iron gates of Barovia loom before you. There is no going back...</em>`, "dm");
            setTimeout(() => this.triggerStoryEvent("intro_strahd"), 1500);
        } else if (this.selectedCampaign === "tomb_of_annihilation") {
            this.log(`A mysterious summons has brought you to the tower of an archmage. Something terrible is happening across Faerûn...`, "dm");
            this.log("Your stats have been rolled: " + Object.entries(this.character.stats).map(([k,v]) => `${k.toUpperCase()}: ${v}`).join(", "), "success");
            this.log(`<em>Syndra Silvane, visibly weakened by some curse, beckons you closer...</em>`, "dm");
            setTimeout(() => this.triggerStoryEvent("intro_toa"), 1500);
        } else if (this.selectedCampaign === "keep_on_borderlands") {
            this.log(`You are a fledgling adventurer seeking fame and fortune on the frontier. The Keep on the Borderlands offers shelter and opportunity for those brave enough to face the wilderness beyond.`, "dm");
            this.log("Your stats have been rolled: " + Object.entries(this.character.stats).map(([k,v]) => `${k.toUpperCase()}: ${v}`).join(", "), "success");
            this.log(`<em>The dusty road stretches before you. In the distance, you can see the walls of the Keep...</em>`, "dm");
            this.log("💡 <strong>TIP:</strong> Click TRAVEL to go to the Keep Gates!", "loot");
            this.updateChapterDisplay();
        } else if (this.selectedCampaign === "lost_mine_of_phandelver") {
            this.log(`You've been hired by a dwarf named Gundren Rockseeker to escort a wagonload of supplies to the rough-and-tumble settlement of Phandalin, a couple of days' travel southeast of the city of Neverwinter.`, "dm");
            this.log("Your stats have been rolled: " + Object.entries(this.character.stats).map(([k,v]) => `${k.toUpperCase()}: ${v}`).join(", "), "success");
            this.log(`<em>Gundren rode ahead with his bodyguard Sildar Hallwinter, promising to meet you in Phandalin. The Triboar Trail stretches before you...</em>`, "dm");
            setTimeout(() => this.triggerStoryEvent("intro_lmop"), 1500);
        }
    }
    
    generateCharacterPersonality() {
        // Get class-specific traits or use generic
        const traits = PERSONALITY_TRAITS[this.character.charClass] || PERSONALITY_TRAITS["Fighter"];
        
        this.character.personality = {
            trait: traits[Math.floor(Math.random() * traits.length)],
            ideal: IDEALS[Math.floor(Math.random() * IDEALS.length)],
            bond: BONDS[Math.floor(Math.random() * BONDS.length)],
            flaw: FLAWS[Math.floor(Math.random() * FLAWS.length)]
        };
        
        // Generate voice style based on class and race
        const voiceStyles = {
            "Fighter": ["speaks with military precision", "uses short, direct sentences", "occasionally references past battles"],
            "Wizard": ["speaks in a scholarly manner", "uses arcane terminology", "often trails off into thought"],
            "Rogue": ["speaks in hushed tones", "uses street slang occasionally", "always sounds slightly amused"],
            "Cleric": ["speaks with quiet conviction", "references their deity often", "offers blessings freely"],
            "Ranger": ["speaks sparingly", "uses nature metaphors", "observes more than talks"]
        };
        
        const classVoice = voiceStyles[this.character.charClass] || voiceStyles["Fighter"];
        this.character.voiceStyle = classVoice[Math.floor(Math.random() * classVoice.length)];
    }

    updateUI() {
        if (!this.character) return;

        // Update character info
        document.getElementById("charName").textContent = this.character.name;
        document.getElementById("charRace").textContent = this.character.race;
        document.getElementById("charClass").textContent = this.character.charClass;
        document.getElementById("charLevel").textContent = this.character.level;
        document.getElementById("charBackground").textContent = this.character.background;
        
        // Update subclass display if available
        const charClassEl = document.getElementById("charClass");
        if (this.character.subclass && SUBCLASS_DATA[this.character.charClass]) {
            const subclassName = SUBCLASS_DATA[this.character.charClass].options[this.character.subclass]?.name;
            if (subclassName) {
                charClassEl.textContent = `${this.character.charClass} (${subclassName})`;
            }
        }
        
        // Update HP bar
        const hpPercent = (this.character.hp / this.character.maxHp) * 100;
        document.getElementById("hpBar").style.width = hpPercent + "%";
        document.getElementById("currentHp").textContent = this.character.hp;
        document.getElementById("maxHp").textContent = this.character.maxHp;
        
        // Update XP bar
        const xpNeeded = this.character.level * 300;
        const xpPercent = (this.character.experience / xpNeeded) * 100;
        document.getElementById("xpBar").style.width = Math.min(xpPercent, 100) + "%";
        document.getElementById("currentXp").textContent = this.character.experience;
        document.getElementById("nextLevelXp").textContent = xpNeeded;
        
        // Update stats
        const statsGrid = document.getElementById("statsGrid");
        statsGrid.innerHTML = "";
        for (let stat in this.character.stats) {
            const value = this.character.stats[stat];
            const mod = this.character.getModifier(stat);
            const sign = mod >= 0 ? "+" : "";
            statsGrid.innerHTML += `
                <div class="stat-box">
                    <div class="stat-name">${stat}</div>
                    <div class="stat-value">${value}</div>
                    <div class="stat-mod">${sign}${mod}</div>
                </div>
            `;
        }
        
        // Update other stats
        document.getElementById("charAC").textContent = this.character.ac;
        document.getElementById("charGold").textContent = this.character.gold;
        
        // Update passive scores (Perception, Insight, Investigation)
        const passivesEl = document.getElementById("charPassives");
        if (passivesEl) {
            const pp = this.character.getPassivePerception ? this.character.getPassivePerception() : 10;
            const pi = this.character.getPassiveInsight ? this.character.getPassiveInsight() : 10;
            const pinv = this.character.getPassiveInvestigation ? this.character.getPassiveInvestigation() : 10;
            passivesEl.innerHTML = `
                <div class="passive-badge" title="Passive Perception (10 + Perception modifier)">👁️ PP <span class="passive-val">${pp}</span></div>
                <div class="passive-badge" title="Passive Insight (10 + Insight modifier)">🧠 PI <span class="passive-val">${pi}</span></div>
                <div class="passive-badge" title="Passive Investigation (10 + Investigation modifier)">🔍 Inv <span class="passive-val">${pinv}</span></div>
            `;
        }
        
        // Update traits row (Darkvision, racial features)
        const traitsEl = document.getElementById("charTraits");
        if (traitsEl) {
            let traitsHtml = '';
            if (this.character.hasDarkvision && this.character.hasDarkvision()) {
                traitsHtml += `<span class="trait-tag" title="Darkvision ${this.character.darkvisionRange}ft">🌙 Darkvision ${this.character.darkvisionRange}ft</span>`;
            }
            // Show racial ability status
            if (this.character.racialAbilities) {
                if (this.character.race === 'Dragonborn') {
                    const used = this.character.racialAbilities.breathWeaponUsed;
                    traitsHtml += `<span class="trait-tag" title="Breath Weapon (recharges on short rest)" style="${used ? 'opacity:0.4' : ''}">${used ? '💨' : '🔥'} Breath${used ? ' (used)' : ''}</span>`;
                }
                if (this.character.race === 'Half-Orc') {
                    const used = this.character.racialAbilities.relentlessUsed;
                    traitsHtml += `<span class="trait-tag" title="Relentless Endurance (recharges on long rest)" style="${used ? 'opacity:0.4' : ''}">💪 Relentless${used ? ' (used)' : ''}</span>`;
                }
            }
            if (this.character.race === 'Halfling') {
                traitsHtml += `<span class="trait-tag" title="Lucky: Reroll natural 1s on d20 rolls">🍀 Lucky</span>`;
            }
            if (this.character.race === 'Elf') {
                traitsHtml += `<span class="trait-tag" title="Fey Ancestry: Advantage on saves vs charm">🧝 Fey Ancestry</span>`;
            }
            if (this.character.race === 'Dwarf') {
                traitsHtml += `<span class="trait-tag" title="Dwarven Resilience: Advantage on saves vs poison">⛏️ Dwarven Resilience</span>`;
            }
            if (this.character.race === 'Tiefling') {
                traitsHtml += `<span class="trait-tag" title="Fire Resistance: Half damage from fire">🔥 Fire Resistance</span>`;
            }
            traitsEl.innerHTML = traitsHtml;
        }
        
        // Update attunement display
        const attuneEl = document.getElementById("charAttunement");
        if (attuneEl && this.character.attunedItems) {
            const count = this.character.attunedItems.length;
            if (count > 0) {
                let html = `✨ Attuned: <span class="attune-count">${count}/3</span>`;
                html += '<div style="margin-top:2px">';
                this.character.attunedItems.forEach(item => {
                    html += `<span class="attune-item">• ${item}</span> `;
                });
                html += '</div>';
                attuneEl.innerHTML = html;
            } else {
                attuneEl.innerHTML = '';
            }
        }
        
        // Update skills panel
        const skillsPanel = document.getElementById("skillsPanel");
        if (skillsPanel && typeof SKILL_ABILITY_MAP !== 'undefined') {
            let skillsHtml = '';
            const skillNames = Object.keys(SKILL_ABILITY_MAP).sort();
            for (const skill of skillNames) {
                const isProficient = this.character.isSkillProficient ? this.character.isSkillProficient(skill) : false;
                const hasExpert = this.character.hasExpertise ? this.character.hasExpertise(skill) : false;
                const mod = this.character.getSkillModifier ? this.character.getSkillModifier(skill) : 0;
                const sign = mod >= 0 ? '+' : '';
                const marker = hasExpert ? '◆' : (isProficient ? '●' : '○');
                const abilityAbbr = SKILL_ABILITY_MAP[skill].substring(0, 3).toUpperCase();
                skillsHtml += `<div class="skill-row ${isProficient ? 'proficient' : ''}">
                    <span><span class="skill-prof-marker">${marker}</span> ${skill} <span style="color:#666;font-size:0.65rem">(${abilityAbbr})</span></span>
                    <span class="skill-mod">${sign}${mod}</span>
                </div>`;
            }
            skillsPanel.innerHTML = skillsHtml;
        }
        
        // Update equipment display
        this.updateEquipmentDisplay();
        
        // Update inventory
        const inventoryList = document.getElementById("inventoryList");
        inventoryList.innerHTML = "";
        
        // Get campaign-specific items for checking
        const campaignId = this.dm ? this.dm.campaignId : null;
        const campaignItems = campaignId ? GAME_DATA.campaignItems[campaignId] : null;
        
        for (let item of this.character.inventory) {
            // Check if item is usable (potions, consumables, campaign consumables)
            let isUsable = item.includes("Potion") || item === "Antidote" || item === "Rations (1 day)";
            if (campaignItems && campaignItems.consumables && campaignItems.consumables[item]) {
                isUsable = true;
            }
            // Other usable items from campaign
            const campaignUsables = ["Karameikan Brandy", "Wolfsbane Potion", "Hutaakan Healing Salve", 
                                     "Holy Water", "Garlic Necklace", "Purple Grapemash Wine", "Morning Lord's Blessing",
                                     "Tej (Honey Wine)", "Antivenom", "Insect Repellent", "Rain Catcher Rations", "Spirit of Ubtao"];
            if (campaignUsables.includes(item)) {
                isUsable = true;
            }
            
            // Check if equippable (standard or campaign-specific)
            let isEquippable = GAME_DATA.weapons[item] || GAME_DATA.armor[item] || GAME_DATA.shields[item];
            if (campaignItems) {
                if (campaignItems.weapons && campaignItems.weapons[item]) isEquippable = true;
                if (campaignItems.armor && campaignItems.armor[item]) isEquippable = true;
                if (campaignItems.shields && campaignItems.shields[item]) isEquippable = true;
            }
            
            const isEquipped = this.character.equipped.weapon === item || 
                               this.character.equipped.armor === item || 
                               this.character.equipped.shield === item;
            
            // Check if this is a campaign-specific item
            let isCampaignItem = false;
            if (campaignItems) {
                if ((campaignItems.weapons && campaignItems.weapons[item]) ||
                    (campaignItems.armor && campaignItems.armor[item]) ||
                    (campaignItems.shields && campaignItems.shields[item]) ||
                    (campaignItems.consumables && campaignItems.consumables[item])) {
                    isCampaignItem = true;
                }
            }
            
            let itemHtml = `<div class="inventory-item ${isUsable ? 'usable' : ''} ${isEquipped ? 'equipped' : ''} ${isEquippable ? 'equippable' : ''} ${isCampaignItem ? 'campaign-item' : ''}">`;
            itemHtml += `<span class="item-name" onclick="game.showItemInfo('${item.replace(/'/g, "\\'")}')" title="Click for info">${item}${isCampaignItem ? ' ⭐' : ''}</span>`;
            itemHtml += `<button class="info-btn" onclick="game.showItemInfo('${item.replace(/'/g, "\\'")}')">ℹ️</button>`;
            
            if (isEquipped) {
                itemHtml += ` <span class="equipped-badge">✓ Equipped</span>`;
            } else if (isEquippable) {
                itemHtml += ` <button class="equip-btn" onclick="game.equipItem('${item}')">Equip</button>`;
            }
            
            if (isUsable) {
                itemHtml += ` <button class="use-btn" onclick="game.useItem('${item}')">Use</button>`;
            }
            
            itemHtml += `</div>`;
            inventoryList.innerHTML += itemHtml;
        }
        
        // Update location
        document.getElementById("locationName").textContent = this.dm.currentLocation.name;
        const typeIcons = { town: "🏠 Town", dungeon: "💀 Dungeon", wilderness: "🌲 Wilderness" };
        document.getElementById("locationType").textContent = typeIcons[this.dm.currentLocation.type];
        
        // Add/update shop button for towns
        this.updateShopButton();
        
        // Update mini-map
        this.updateMiniMap();
        
        // Update action buttons state
        const actionsPanel = document.getElementById("actionsPanel");
        const isUnconsciousOrInCombat = this.dm.inCombat || this.character.hp <= 0;
        actionsPanel.querySelectorAll("button").forEach(btn => {
            // Only Rest button should be enabled when unconscious
            if (this.character.hp <= 0) {
                btn.disabled = !btn.textContent.includes("Rest");
            } else {
                btn.disabled = this.dm.inCombat;
            }
        });
    }

    log(message, type = "dm") {
        // Check if this type should be shown based on filters
        if (this.logFilters && this.logFilters[type] === false) return;
        
        const gameLog = document.getElementById("gameLog");
        const entry = document.createElement("div");
        entry.className = `log-entry ${type}`;
        
        if (type === "dm") {
            entry.innerHTML = `<div class="speaker">🎭 Dungeon Master</div>${message}`;
        } else {
            entry.innerHTML = message;
        }
        
        gameLog.appendChild(entry);
        gameLog.scrollTop = gameLog.scrollHeight;
        
        // Add visual effects based on message content
        if (type === "danger" || type === "combat") {
            // Extract damage numbers for floating damage
            const damageMatch = message.match(/(\d+)\s*damage/i);
            if (damageMatch && message.includes("you") && !message.includes("You hit")) {
                // Player took damage
                this.showFloatingDamage(damageMatch[1], 'damage');
                this.shakeElement('characterPanel');
                this.flashElement('gameLog', 'damage');
            }
            if (message.includes("CRITICAL")) {
                this.flashElement('combatPanel', message.includes("hits you") ? 'damage' : 'heal');
            }
        }
        if (type === "success" && message.includes("heal")) {
            const healMatch = message.match(/(\d+)\s*(HP|hit points|health)/i);
            if (healMatch) {
                this.showFloatingDamage(healMatch[1], 'heal');
                this.flashElement('characterPanel', 'heal');
            }
        }
    }

    async explore() {
        if (this.dm.inCombat) return;
        
        // Cannot explore while unconscious
        if (this.character.hp <= 0) {
            this.log("You're unconscious and need medical attention! Rest to recover.", "danger");
            return;
        }
        
        this.dm.turn++;
        const locType = this.dm.currentLocation.type;
        
        // Advance time when exploring (30 minutes to 1 hour)
        this.dm.advanceTime(0.5 + Math.random() * 0.5);
        
        // Show time and weather
        this.log(`${this.dm.getTimeIcon()} ${this.formatTime()} | ${this.dm.getWeatherIcon()} ${this.dm.weather}`, "dm");
        
        // Ambient event - use campaign-specific events
        const campaignEvents = this.dm.campaign.events[locType];
        const event = campaignEvents[Math.floor(Math.random() * campaignEvents.length)];
        this.log(event, "dm");
        
        const danger = this.dm.currentLocation.danger;
        
        // Night encounters are more dangerous
        const isNight = this.dm.timeOfDay === "night";
        const effectiveDanger = isNight ? danger + 1 : danger;
        
        // Background-specific events (10% chance)
        if (Math.random() < 0.10) {
            await this.triggerBackstoryEvent();
            return;
        }
        
        // Skill check events (25% chance) - adds D&D feel
        if (Math.random() < 0.25) {
            this.triggerSkillCheckEvent();
            return;
        }
        
        // Random encounter - higher chance at night
        const encounterChance = isNight ? 0.5 : 0.4;
        if (effectiveDanger > 0 && Math.random() < encounterChance) {
            // Perception check to potentially avoid ambush
            this.triggerAmbushCheck();
        } else if (Math.random() < 0.3) {
            this.findTreasure();
        } else {
            await this.randomEvent();
        }
    }
    
    async triggerBackstoryEvent() {
        const char = this.character;
        const bg = char.background;
        
        const backstoryEvents = {
            "Noble": [
                {
                    title: "📜 A Letter From Home",
                    description: "A courier recognizes you and delivers a sealed letter bearing your family crest.",
                    outcomes: [
                        { text: "Read it privately", effect: () => {
                            this.log("The letter speaks of political intrigue at home. Your family needs gold.", "dm");
                            this.character.addJournalEntry('lore', { title: "Family Letter", text: "Political troubles at home require attention." });
                        }},
                        { text: "Ignore it for now", effect: () => {
                            this.log("You pocket the letter for later. Family matters can wait.", "dm");
                        }}
                    ]
                },
                {
                    title: "🎭 Noble Recognition",
                    description: "A merchant recognizes your noble bearing and offers preferential treatment.",
                    outcomes: [
                        { text: "Accept graciously (+Rep Nobility)", effect: () => {
                            char.adjustReputation("nobility", 5);
                            char.adjustReputation("commoners", -2);
                            this.log("Your noble status brings privilege, but commoners look on with envy.", "success");
                        }},
                        { text: "Decline humbly (+Rep Commoners)", effect: () => {
                            char.adjustReputation("commoners", 5);
                            this.log("Your humility earns respect from the common folk.", "success");
                        }}
                    ]
                }
            ],
            "Criminal": [
                {
                    title: "🗡️ Old Contact",
                    description: "A hooded figure approaches. 'Word on the street is you're back in town...'",
                    outcomes: [
                        { text: "Hear them out (+Rep Thieves Guild)", effect: () => {
                            char.adjustReputation("thieves_guild", 5);
                            const gold = Math.floor(Math.random() * 15) + 5;
                            char.gold += gold;
                            this.log(`They share intel and ${gold} gold for old times' sake.`, "success");
                        }},
                        { text: "Walk away (-Rep Thieves Guild)", effect: () => {
                            char.adjustReputation("thieves_guild", -5);
                            this.log("You've left that life behind. They won't forget.", "dm");
                        }}
                    ]
                },
                {
                    title: "👁️ Wanted Poster",
                    description: "You spot a wanted poster. The face looks... familiar. It might be you.",
                    outcomes: [
                        { text: "Tear it down", effect: () => {
                            const roll = Math.floor(Math.random() * 20) + 1;
                            if (roll >= 10) {
                                this.log("You discreetly remove the poster. Your past stays hidden.", "success");
                            } else {
                                this.log("Someone notices! You quickly blend into the crowd.", "danger");
                                char.adjustReputation("military", -3);
                            }
                        }},
                        { text: "Ignore it", effect: () => {
                            this.log("Best not to draw attention. You move on.", "dm");
                        }}
                    ]
                }
            ],
            "Soldier": [
                {
                    title: "⚔️ Former Comrade",
                    description: "A voice calls out - 'Is that you? From the 4th Regiment?'",
                    outcomes: [
                        { text: "Greet them warmly (+Rep Military)", effect: () => {
                            char.adjustReputation("military", 5);
                            this.log("You share war stories. They promise to put in a good word.", "success");
                            this.character.addJournalEntry('npc', { name: "Old Comrade", notes: "Former soldier from your regiment." });
                        }},
                        { text: "Pretend not to hear", effect: () => {
                            this.log("Some memories are better left buried.", "dm");
                        }}
                    ]
                }
            ],
            "Scholar": [
                {
                    title: "📚 Ancient Text",
                    description: "You notice a rare manuscript in a merchant's pile of goods.",
                    outcomes: [
                        { text: "Examine it", skill: "int", dc: 12, effect: () => {
                            const check = this.dm.skillCheck("int", 12);
                            if (check.success) {
                                this.log("The text reveals ancient knowledge! +50 XP", "success");
                                char.experience += 50;
                                this.character.addJournalEntry('lore', { title: "Ancient Text", text: "Scholarly findings of historical significance." });
                            } else {
                                this.log("The text is too damaged to decipher.", "dm");
                            }
                        }},
                        { text: "Buy it (10 gold)", effect: () => {
                            if (char.gold >= 10) {
                                char.gold -= 10;
                                char.addMaterial("Ancient Scroll", 1);
                                this.log("You purchase the scroll for later study.", "success");
                            } else {
                                this.log("You can't afford it.", "danger");
                            }
                        }}
                    ]
                }
            ],
            "Acolyte": [
                {
                    title: "🙏 A Soul in Need",
                    description: "A distressed villager approaches, seeking spiritual guidance.",
                    outcomes: [
                        { text: "Offer counsel (+Rep Church)", effect: () => {
                            char.adjustReputation("church", 5);
                            char.adjustReputation("commoners", 3);
                            this.log("Your words bring comfort. The villager blesses you.", "success");
                        }},
                        { text: "Refer them to a temple", effect: () => {
                            this.log("You point them toward proper clergy.", "dm");
                        }}
                    ]
                }
            ],
            "Outlander": [
                {
                    title: "🐾 Animal Tracks",
                    description: "Your keen eyes spot unusual tracks. Your wilderness instincts kick in.",
                    outcomes: [
                        { text: "Follow them", skill: "wis", dc: 10, effect: () => {
                            const check = this.dm.skillCheck("wis", 10);
                            if (check.success) {
                                const items = ["Healing Herbs", "Hide", "Meat"];
                                const item = items[Math.floor(Math.random() * items.length)];
                                char.addMaterial(item, 2);
                                this.log(`The tracks lead to useful resources! Found 2x ${item}`, "success");
                            } else {
                                this.log("The trail goes cold.", "dm");
                            }
                        }},
                        { text: "Note location for later", effect: () => {
                            this.log("You mark the location mentally.", "dm");
                            this.character.addJournalEntry('lore', { title: "Hunting Grounds", text: "Good hunting location marked." });
                        }}
                    ]
                }
            ]
        };
        
        const events = backstoryEvents[bg];
        if (!events || events.length === 0) {
            await this.randomEvent(); // Fallback
            return;
        }
        
        const event = events[Math.floor(Math.random() * events.length)];
        this.showBackstoryChoiceModal(event);
    }
    
    showBackstoryChoiceModal(event) {
        let modal = document.getElementById("backstoryModal");
        if (!modal) {
            modal = document.createElement("div");
            modal.id = "backstoryModal";
            modal.className = "modal";
            document.body.appendChild(modal);
        }
        
        modal.innerHTML = `
            <div class="modal-content">
                <h2>${event.title}</h2>
                <p style="margin-bottom: 20px;">${event.description}</p>
                <div class="choice-options">
                    ${event.outcomes.map((o, i) => {
                        // Extract DC info if present (e.g., "Examine it (Intelligence DC 12)")
                        let displayText = o.text;
                        let dcHint = "";
                        
                        // Check if this outcome has DC requirements
                        if (o.skill && o.dc) {
                            const charMod = this.character.getModifier(o.skill);
                            const hasAdv = this.checkForAdvantage(o.skill);
                            dcHint = `<span class="dc-hint">(DC ${o.dc}, you have +${charMod}${hasAdv ? ' 📈' : ''})</span>`;
                            // Remove the old inline DC format if present
                            displayText = o.text.replace(/\s*\(.*DC\s*\d+\)/i, '');
                        }
                        
                        return `
                            <button class="choice-btn skill-option" onclick="game.resolveBackstoryChoice(${i})">
                                <span>${displayText}</span>${dcHint}
                            </button>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
        
        this.currentBackstoryEvent = event;
        modal.classList.add("active");
    }
    
    resolveBackstoryChoice(index) {
        const modal = document.getElementById("backstoryModal");
        if (modal) modal.classList.remove("active");
        
        const outcome = this.currentBackstoryEvent.outcomes[index];
        if (outcome.effect) {
            outcome.effect();
        }
        
        this.updateUI();
    }
    
    async triggerSkillCheckEvent() {
        const locType = this.dm.currentLocation.type;
        const danger = this.dm.currentLocation.danger;
        
        // Different skill events based on location type
        const skillEvents = {
            dungeon: [
                { 
                    title: "🔍 Suspicious Stones",
                    description: "You notice some stones in the wall look different. The mortar seems newer...",
                    approaches: [
                        { text: "🔍 Investigate (Investigation)", skill: "int", dc: 12, successReward: "secret", failPenalty: null },
                        { text: "💪 Push the stones (Strength)", skill: "str", dc: 14, successReward: "secret", failPenalty: "noise" },
                        { text: "🚶 Keep moving", skill: null }
                    ]
                },
                {
                    title: "⚠️ Tripwire Ahead",
                    description: "Your foot catches on something thin and taut. You freeze...",
                    approaches: [
                        { text: "🎯 Carefully disarm (Dexterity)", skill: "dex", dc: 13, successReward: "trap_parts", failPenalty: "trap_damage" },
                        { text: "🔍 Study the mechanism (Investigation)", skill: "int", dc: 14, successReward: "trap_safe", failPenalty: null },
                        { text: "🏃 Jump back quickly (Dexterity)", skill: "dex", dc: 10, successReward: "escape", failPenalty: "trap_damage" }
                    ]
                },
                {
                    title: "👻 Strange Sounds",
                    description: "Eerie whispers echo from deeper in the dungeon. They almost sound like words...",
                    approaches: [
                        { text: "🧠 Listen carefully (Perception)", skill: "wis", dc: 12, successReward: "info", failPenalty: null },
                        { text: "📚 Recall dungeon lore (History)", skill: "int", dc: 14, successReward: "knowledge", failPenalty: null },
                        { text: "😤 Ignore it", skill: null }
                    ]
                }
            ],
            wilderness: [
                {
                    title: "🦶 Fresh Tracks",
                    description: "You spot tracks in the soft earth. They look relatively fresh...",
                    approaches: [
                        { text: "🔍 Study the tracks (Survival)", skill: "wis", dc: 11, successReward: "tracking", failPenalty: null },
                        { text: "🌿 Follow stealthily (Stealth)", skill: "dex", dc: 13, successReward: "ambush_advantage", failPenalty: "ambushed" },
                        { text: "🚶 Avoid this area", skill: null }
                    ]
                },
                {
                    title: "🌿 Medicinal Herbs",
                    description: "You recognize some plants that might have healing properties...",
                    approaches: [
                        { text: "🌱 Gather herbs (Nature)", skill: "int", dc: 12, successReward: "herbs", failPenalty: "poison" },
                        { text: "📚 Identify carefully (Medicine)", skill: "wis", dc: 10, successReward: "safe_herbs", failPenalty: null },
                        { text: "🚶 Leave them", skill: null }
                    ]
                },
                {
                    title: "🏔️ Difficult Terrain",
                    description: "The path ahead is treacherous. Loose rocks and steep inclines block your way.",
                    approaches: [
                        { text: "🧗 Climb carefully (Athletics)", skill: "str", dc: 13, successReward: "shortcut", failPenalty: "fall_damage" },
                        { text: "🔍 Find another path (Perception)", skill: "wis", dc: 14, successReward: "safe_path", failPenalty: "lost_time" },
                        { text: "🚶 Take the long way", skill: null }
                    ]
                }
            ],
            town: [
                {
                    title: "🗣️ Nervous Merchant",
                    description: "A merchant keeps glancing around nervously. They seem to know something...",
                    approaches: [
                        { text: "😊 Befriend them (Persuasion)", skill: "cha", dc: 12, successReward: "info_gold", failPenalty: null },
                        { text: "😠 Intimidate them (Intimidation)", skill: "cha", dc: 14, successReward: "info", failPenalty: "reputation" },
                        { text: "🔍 Observe discreetly (Insight)", skill: "wis", dc: 13, successReward: "secret_info", failPenalty: null },
                        { text: "🚶 Mind your business", skill: null }
                    ]
                },
                {
                    title: "🎲 Gambling Game",
                    description: "A group is playing dice. One of them waves you over with a grin.",
                    approaches: [
                        { text: "🎯 Play the odds (Intelligence)", skill: "int", dc: 13, successReward: "gambling_win", failPenalty: "gambling_loss" },
                        { text: "🃏 Cheat subtly (Sleight of Hand)", skill: "dex", dc: 15, successReward: "big_win", failPenalty: "caught" },
                        { text: "🚶 Decline politely", skill: null }
                    ]
                },
                {
                    title: "📜 Mysterious Note",
                    description: "Someone slips a folded note into your hand and disappears into the crowd.",
                    approaches: [
                        { text: "📚 Decipher the code (Investigation)", skill: "int", dc: 12, successReward: "secret_location", failPenalty: null },
                        { text: "🗣️ Ask around about it (Persuasion)", skill: "cha", dc: 14, successReward: "quest_info", failPenalty: "attention" },
                        { text: "🚶 Throw it away", skill: null }
                    ]
                }
            ]
        };
        
        const events = skillEvents[locType] || skillEvents.wilderness;
        const chosenEvent = events[Math.floor(Math.random() * events.length)];
        
        // Show the choice modal
        const choice = await this.showSkillCheckChoice(chosenEvent);
        const approach = chosenEvent.approaches[choice];
        
        if (!approach.skill) {
            this.log("You decide not to investigate further.", "dm");
            return;
        }
        
        // Determine if character has advantage (from skills, class features, etc.)
        const hasAdvantage = this.checkForAdvantage(approach.skill);
        const hasDisadvantage = false; // Could add conditions that cause this
        
        // Roll the skill check
        const check = await this.dm.skillCheckAnimated(approach.skill, approach.dc, hasAdvantage, hasDisadvantage);
        
        // Format the roll message
        let rollMsg = `🎲 ${approach.text.split('(')[1].replace(')', '')} Check: `;
        if (check.advType) {
            rollMsg += `(${check.roll1}, ${check.roll2}) → ${check.roll}`;
            rollMsg += check.advType === "advantage" ? " 📈" : " 📉";
        } else {
            rollMsg += `${check.roll}`;
        }
        rollMsg += `+${check.modifier}=${check.total} vs DC ${check.dc}`;
        
        if (check.critical && check.roll === 20) {
            this.log(`${rollMsg} - 🌟 NATURAL 20!`, "success");
        } else if (check.critical && check.roll === 1) {
            this.log(`${rollMsg} - 💀 NATURAL 1!`, "danger");
        } else if (check.success) {
            this.log(`${rollMsg} - ✓ Success!`, "success");
        } else {
            this.log(`${rollMsg} - ✗ Failed!`, "danger");
        }
        
        // Apply results
        this.applySkillCheckResult(check.success, approach, check.critical);
        this.updateUI();
    }
    
    checkForAdvantage(skill) {
        // Check if character has advantage based on skills, class, or buffs
        const char = this.character;
        
        // Rogues get advantage on DEX checks when sneaking
        if (char.charClass === "Rogue" && skill === "dex" && char.isSkillProficient("Stealth")) {
            return true;
        }
        
        // Rangers get advantage on Survival/Nature in wilderness
        if (char.charClass === "Ranger" && (skill === "wis" || skill === "int")) {
            const locType = this.dm.currentLocation.type;
            if (locType === "wilderness" && (char.isSkillProficient("Survival") || char.isSkillProficient("Nature"))) {
                return true;
            }
        }
        
        // Elf Fey Ancestry: advantage on saves vs charm
        if (char.race === "Elf" && char.conditions?.charmed) {
            return true;
        }
        
        // Dwarf Dwarven Resilience: advantage on saves vs poison
        if (char.race === "Dwarf" && char.conditions?.poisoned) {
            return true;
        }
        
        // Halfling Brave: advantage on saves vs frightened
        if (char.race === "Halfling" && char.conditions?.frightened) {
            return true;
        }
        
        return false;
    }
    
    applySkillCheckResult(success, approach, critical) {
        const char = this.character;
        
        if (success) {
            switch (approach.successReward) {
                case "secret":
                    const secretGold = Math.floor(Math.random() * 30) + 20;
                    char.gold += secretGold;
                    this.log(`🔓 You found a hidden compartment with ${secretGold} gold!`, "loot");
                    break;
                case "trap_parts":
                    char.inventory.push("Trap Parts");
                    this.log("🔧 You carefully disarm the trap and salvage the mechanism.", "loot");
                    break;
                case "trap_safe":
                    this.log("✓ You understand the trap's workings and safely step around it.", "success");
                    break;
                case "escape":
                    this.log("🏃 You leap back just in time as the trap springs harmlessly!", "success");
                    break;
                case "info":
                    this.log("💡 You learn valuable information about what lies ahead.", "success");
                    break;
                case "knowledge":
                    this.log("📚 Your knowledge reveals this is an ancient warning - treasure may be nearby!", "success");
                    char.gold += Math.floor(Math.random() * 15) + 10;
                    break;
                case "tracking":
                    this.log("🔍 The tracks lead to a creature's lair. You could ambush them...", "success");
                    char.buffs.guidingBolt = true; // Advantage on next attack
                    break;
                case "ambush_advantage":
                    this.log("🗡️ You sneak up on your quarry. You'll have the element of surprise!", "success");
                    char.buffs.guidingBolt = true;
                    break;
                case "herbs":
                case "safe_herbs":
                    char.inventory.push("Healing Potion");
                    this.log("🌿 You gather medicinal herbs and brew a healing potion!", "loot");
                    break;
                case "shortcut":
                    const shortcutGold = Math.floor(Math.random() * 20) + 10;
                    char.gold += shortcutGold;
                    this.log(`🏔️ You climb up and discover an old camp with ${shortcutGold} gold!`, "loot");
                    break;
                case "safe_path":
                    this.log("✓ You spot a safer route that avoids the treacherous terrain.", "success");
                    break;
                case "info_gold":
                    const infoGold = Math.floor(Math.random() * 15) + 5;
                    char.gold += infoGold;
                    this.log(`🗣️ The merchant shares useful information and gives you ${infoGold} gold for your kindness.`, "loot");
                    break;
                case "secret_info":
                    this.log("👁️ You notice they're watching the Iron Ring warehouse. Valuable intel!", "success");
                    break;
                case "gambling_win":
                    const winnings = Math.floor(Math.random() * 20) + 15;
                    char.gold += winnings;
                    this.log(`🎲 Lady luck smiles upon you! You win ${winnings} gold!`, "loot");
                    break;
                case "big_win":
                    const bigWin = Math.floor(Math.random() * 40) + 30;
                    char.gold += bigWin;
                    this.log(`🃏 Your sleight of hand pays off! You win ${bigWin} gold!`, "loot");
                    break;
                case "secret_location":
                    const cacheGold = Math.floor(Math.random() * 25) + 15;
                    char.gold += cacheGold;
                    this.log(`📜 The note reveals a hidden cache location! You find ${cacheGold} gold!`, "loot");
                    soundManager.playGold();
                    break;
                case "quest_info":
                    this.log("🗣️ A contact reveals important quest information!", "success");
                    break;
                default:
                    this.log("✓ Your skill serves you well!", "success");
            }
            
            // Critical success bonus
            if (critical) {
                const bonusGold = Math.floor(Math.random() * 15) + 10;
                char.gold += bonusGold;
                this.log(`🌟 Critical success! Bonus ${bonusGold} gold!`, "loot");
            }
        } else {
            // Handle failure penalties
            switch (approach.failPenalty) {
                case "trap_damage":
                    const trapDmg = this.dm.rollDice("1d6");
                    char.takeDamage(trapDmg);
                    this.log(`💥 The trap springs! You take ${trapDmg} damage!`, "danger");
                    break;
                case "noise":
                    this.log("💥 The stones collapse loudly! Something may have heard that...", "danger");
                    if (Math.random() < 0.5) {
                        this.triggerAmbushCheck(true); // Forced combat
                    }
                    break;
                case "ambushed":
                    this.log("⚠️ You stumble into their lair! They attack with surprise!", "danger");
                    this.triggerAmbushCheck(true);
                    break;
                case "poison":
                    const poisonDmg = this.dm.rollDice("1d4");
                    char.takeDamage(poisonDmg);
                    this.log(`🤢 The plant was poisonous! You take ${poisonDmg} damage!`, "danger");
                    break;
                case "fall_damage":
                    const fallDmg = this.dm.rollDice("1d6");
                    char.takeDamage(fallDmg);
                    this.log(`🏔️ You slip and fall! ${fallDmg} damage!`, "danger");
                    break;
                case "lost_time":
                    this.log("⏰ You spend a long time searching for another path...", "dm");
                    break;
                case "reputation":
                    this.log("😠 The merchant is offended and spreads word of your rudeness.", "danger");
                    break;
                case "gambling_loss":
                    const loss = Math.min(char.gold, Math.floor(Math.random() * 15) + 10);
                    char.gold -= loss;
                    this.log(`🎲 Bad luck! You lose ${loss} gold!`, "danger");
                    break;
                case "caught":
                    const fine = Math.min(char.gold, Math.floor(Math.random() * 25) + 15);
                    char.gold -= fine;
                    this.log(`🚔 You're caught cheating! You pay ${fine} gold to avoid trouble!`, "danger");
                    break;
                case "attention":
                    this.log("👀 Your questions draw unwanted attention...", "danger");
                    break;
                default:
                    if (approach.failPenalty) {
                        this.log("✗ Your attempt fails, but no harm done.", "dm");
                    }
            }
            
            // Critical failure extra penalty
            if (critical) {
                const critDmg = this.dm.rollDice("1d4");
                char.takeDamage(critDmg);
                this.log(`💀 Critical failure! You hurt yourself for ${critDmg} damage!`, "danger");
            }
        }
    }
    
    showSkillCheckChoice(event) {
        return new Promise(resolve => {
            const modal = document.getElementById("choiceModal");
            document.getElementById("choiceTitle").textContent = event.title;
            document.getElementById("choiceDescription").textContent = event.description;
            
            const optionsContainer = document.getElementById("choiceOptions");
            optionsContainer.innerHTML = "";
            
            event.approaches.forEach((approach, index) => {
                const btn = document.createElement("div");
                btn.className = "travel-option skill-option";
                
                // Show DC hint for skill checks
                let dcHint = "";
                if (approach.skill) {
                    const charMod = this.character.getModifier(approach.skill);
                    const hasAdv = this.checkForAdvantage(approach.skill);
                    dcHint = `<span class="dc-hint">(DC ${approach.dc}, you have +${charMod}${hasAdv ? ' 📈' : ''})</span>`;
                }
                
                btn.innerHTML = `<span>${approach.text}</span>${dcHint}`;
                btn.onclick = () => {
                    modal.classList.remove("active");
                    resolve(index);
                };
                optionsContainer.appendChild(btn);
            });
            
            modal.classList.add("active");
        });
    }

    showChoiceWithDC(title, description, choices) {
        return new Promise(resolve => {
            const modal = document.getElementById("choiceModal");
            document.getElementById("choiceTitle").textContent = title;
            document.getElementById("choiceDescription").textContent = description;
            
            const optionsContainer = document.getElementById("choiceOptions");
            optionsContainer.innerHTML = "";
            
            choices.forEach((choice, index) => {
                const btn = document.createElement("div");
                btn.className = "travel-option skill-option";
                
                // Show DC hint for skill checks
                let dcHint = "";
                if (choice.skill) {
                    const charMod = this.character.getModifier(choice.skill);
                    const hasAdv = this.checkForAdvantage(choice.skill);
                    dcHint = `<span class="dc-hint">(DC ${choice.dc}, you have +${charMod}${hasAdv ? ' 📈' : ''})</span>`;
                }
                
                btn.innerHTML = `<span>${choice.text}</span>${dcHint}`;
                btn.onclick = () => {
                    modal.classList.remove("active");
                    resolve(index);
                };
                optionsContainer.appendChild(btn);
            });
            
            modal.classList.add("active");
        });
    }
    
    async triggerAmbushCheck(forced = false) {
        const danger = this.dm.currentLocation.danger;
        const monsterTier = Math.min(danger, 3);
        const monsters = this.dm.campaign.monsters[monsterTier];
        const monster = { ...monsters[Math.floor(Math.random() * monsters.length)] };
        
        if (forced) {
            // Enemy has surprise
            this.log("⚠️ You've been ambushed!", "danger");
            this.startCombat(monster);
            // Enemy gets a free attack
            setTimeout(() => this.monsterTurn(), 500);
            return;
        }
        
        // Passive Perception check first (automatic detection for easy ambushes)
        const perceptionDC = 10 + danger;
        const passivePerception = this.character.getPassivePerception();
        
        // Darkvision + lighting interaction
        const isDark = this.dm.timeOfDay === "night";
        const hasDarkvision = this.character.hasDarkvision();
        let hasDisadvantage = isDark && !hasDarkvision; // Darkness without darkvision = disadvantage
        let hasAdvantage = false;
        
        // Darkvision in dim light (dusk/dawn) works normally, in darkness treats as dim light
        if (isDark && hasDarkvision) {
            // Darkvision in darkness: treat as dim light, still disadvantage on Perception
            hasDisadvantage = true; // Dim light = disadvantage on Perception (per RAW darkvision)
        }
        
        // Passive perception auto-detects if high enough (with -5 for disadvantage)
        const effectivePassive = hasDisadvantage ? passivePerception - 5 : (hasAdvantage ? passivePerception + 5 : passivePerception);
        
        if (effectivePassive >= perceptionDC) {
            // Auto-detected via passive perception
            this.log(`👁️ Passive Perception (${effectivePassive}) detected danger! (DC ${perceptionDC})`, "success");
            this.log(`🔍 You notice a ${monster.name} lurking ahead. You have the advantage!`, "dm");
            this.character.buffs.guidingBolt = true;
            this.startCombat(monster);
            return;
        }
        
        // Active Perception check (with proficiency)
        const check = await this.dm.skillCheckAnimated("wis", perceptionDC, hasAdvantage, hasDisadvantage, "Perception");
        
        let rollMsg = `🎲 Perception Check: `;
        if (check.advType) {
            rollMsg += `(${check.roll1}, ${check.roll2}) → ${check.roll}📈`;
        } else {
            rollMsg += check.roll;
        }
        rollMsg += `+${check.modifier}=${check.total} vs DC ${perceptionDC}`;
        
        if (check.success) {
            this.log(`${rollMsg} - You spotted the danger!`, "success");
            this.log(`🔍 You notice a ${monster.name} lurking ahead. You have the advantage!`, "dm");
            this.character.buffs.guidingBolt = true; // Advantage on first attack
            this.startCombat(monster);
        } else {
            this.log(`${rollMsg} - You didn't notice the threat!`, "danger");
            this.startCombat(monster);
            // Small chance enemy gets surprise attack
            if (Math.random() < 0.3) {
                this.log(`💀 The ${monster.name} gets a surprise attack!`, "danger");
                setTimeout(() => this.monsterTurn(), 500);
            }
        }
    }

    startCombat(monster) {
        this.dm.inCombat = true;
        this.dm.currentEnemy = monster;
        this.dm.defendingThisTurn = false;
        
        // Apply difficulty settings to monster
        const diffSettings = DIFFICULTY_SETTINGS[this.difficulty];
        monster.hp = Math.floor(monster.hp * diffSettings.enemyHpMod);
        monster.maxHp = monster.hp;
        
        // Reset combat state
        this.stats.damageThisCombat = 0;
        this.combatTactics = 'normal';
        this.playerStatusEffects = [];
        this.enemyStatusEffects = [];
        
        // Initialize monster conditions
        monster.conditions = monster.conditions || {};
        
        // Initialize legendary resistances for bosses
        if (monster.legendaryResistances && monster.legendaryResistances > 0) {
            monster.legendaryResistancesRemaining = monster.legendaryResistances;
        }
        
        // Check if this is a boss
        if (BOSS_ENEMIES[monster.bossId]) {
            monster.isBoss = true;
            soundManager.playBossAppear();
            this.log(`⚠️ <strong>BOSS ENCOUNTER!</strong>`, 'danger');
            if (monster.legendaryResistancesRemaining > 0) {
                this.log(`💀 ${monster.name} has <strong>${monster.legendaryResistancesRemaining} Legendary Resistance${monster.legendaryResistancesRemaining > 1 ? 's' : ''}</strong>!`, 'danger');
            }
        } else if (monster.boss && monster.legendaryResistancesRemaining > 0) {
            // Campaign encounter bosses (not in BOSS_ENEMIES but have boss: true)
            monster.isBoss = true;
            soundManager.playBossAppear();
            this.log(`⚠️ <strong>BOSS ENCOUNTER!</strong>`, 'danger');
            this.log(`💀 ${monster.name} has <strong>${monster.legendaryResistancesRemaining} Legendary Resistance${monster.legendaryResistancesRemaining > 1 ? 's' : ''}</strong>!`, 'danger');
        } else {
            // Regular combat start sound
            soundManager.playHit();
        }
        
        // Play combat music
        musicManager.playAmbient(monster.isBoss ? 'boss' : 'combat');
        
        // Roll initiative
        const monsterDexMod = Math.floor((monster.ac - 10) / 4); // Estimate DEX from AC
        const init = this.dm.rollInitiative(monsterDexMod);
        
        document.getElementById("combatPanel").classList.remove("hidden");
        document.getElementById("enemyName").textContent = monster.name;
        document.getElementById("enemyDescription").textContent = monster.description || "A dangerous foe!";
        document.getElementById("enemyHp").textContent = monster.hp;
        document.getElementById("enemyAc").textContent = monster.ac;
        
        // Show/hide spell button based on whether character is a spellcaster
        const spellBtn = document.getElementById("spellCombatBtn");
        if (spellBtn) {
            if (this.character.isSpellcaster()) {
                spellBtn.classList.remove("hidden");
            } else {
                spellBtn.classList.add("hidden");
            }
        }
        
        // Show/hide rage button for Barbarians
        const rageBtn = document.getElementById("rageCombatBtn");
        if (rageBtn) {
            if (this.character.charClass === "Barbarian" && this.character.ragesRemaining > 0) {
                rageBtn.classList.remove("hidden");
                if (this.character.raging) {
                    rageBtn.textContent = "💢 Raging!";
                    rageBtn.disabled = true;
                }
            } else {
                rageBtn.classList.add("hidden");
            }
        }
        
        // Show bonus action button if character has any bonus action available
        const bonusBtn = document.getElementById("bonusActionBtn");
        if (bonusBtn) {
            const hasBonusActions = this.getAvailableBonusActions().length > 0;
            if (hasBonusActions) {
                bonusBtn.classList.remove("hidden");
            } else {
                bonusBtn.classList.add("hidden");
            }
        }
        
        this.log(`⚔️ A ${monster.name} appears!`, "combat");
        this.log(`📊 Initiative: You (${init.player}) vs ${monster.name} (${init.enemy})`, "dm");
        
        // Display monster stat block info (resistances, immunities, etc.)
        let statBlockInfo = [];
        if (monster.resistances && monster.resistances.length > 0) {
            statBlockInfo.push(`Resists: ${monster.resistances.join(", ")}`);
        }
        if (monster.immunities && monster.immunities.length > 0) {
            statBlockInfo.push(`Immune: ${monster.immunities.join(", ")}`);
        }
        if (monster.vulnerabilities && monster.vulnerabilities.length > 0) {
            statBlockInfo.push(`Vulnerable: ${monster.vulnerabilities.join(", ")}`);
        }
        if (monster.multiattack && monster.multiattack > 1) {
            statBlockInfo.push(`Multiattack: ${monster.multiattack} attacks/turn`);
        }
        if (statBlockInfo.length > 0) {
            this.log(`📋 ${monster.name}: ${statBlockInfo.join(" | ")}`, "dm");
        }
        
        // Show weather effects if relevant
        const weatherEffects = this.dm.getWeatherEffects();
        if (weatherEffects.description) {
            this.log(`🌦️ ${weatherEffects.description}`, "dm");
        }
        
        // Reset action economy
        this.dm.resetActions();
        
        // Store max HP for regeneration/healing caps
        if (!monster.maxHp) monster.maxHp = monster.hp;
        
        // Initialize monster conditions
        if (!monster.conditions) monster.conditions = {};
        
        // Show party status in combat if we have companions
        this.updateCombatPartyDisplay();
        
        // Check if player is already at 0 HP (death saves needed)
        if (this.character.hp === 0 && !this.character.deathSaves.stable) {
            this.showDeathSaveButton();
            this.log("You're unconscious! Roll a death saving throw.", "danger");
        }
        
        // If enemy goes first, they attack
        if (!init.playerGoesFirst) {
            this.log(`${monster.name} acts first!`, "danger");
            setTimeout(() => this.monsterTurn(), 500);
        } else {
            this.log("You act first!", "success");
            // Assassin: Assassinate - advantage on first attack against enemies that haven't acted
            if (this.character.subclass === 'Assassin') {
                this.character.buffs.guidingBolt = true; // Uses existing advantage mechanic
                this.character.subclassFeatures.assassinateActive = true; // Hits auto-crit
                this.log(`🗡️ <strong>Assassinate!</strong> You have advantage and critical hits on this creature!`, "success");
            }
        }
        
        this.updateUI();
    }

    async combatAction(action) {
        if (!this.dm.inCombat) return;
        
        // Prevent multiple actions while processing (fixes XP spam exploit)
        if (this.processingCombatAction) return;
        this.processingCombatAction = true;
        
        const monster = this.dm.currentEnemy;
        const char = this.character;
        const campaignId = this.dm.campaignId;

        // Check if character is at 0 HP (death saves)
        if (char.hp === 0 && !char.deathSaves.stable) {
            if (action === "deathSave") {
                this.rollDeathSave();
            } else {
                this.log("You're unconscious! Roll a death saving throw.", "danger");
            }
            this.processingCombatAction = false;
            return;
        }

        // Check for paralyzed/stunned conditions
        if (char.hasCondition("paralyzed") || char.hasCondition("stunned")) {
            this.log("You can't act while paralyzed/stunned!", "danger");
            char.removeCondition("stunned"); // Stunned lasts 1 turn
            this.monsterTurn();
            this.processingCombatAction = false;
            return;
        }

        if (action === "attack") {
            // Get weapon info for attack
            const weaponInfo = char.getWeaponDamage(campaignId);
            const profBonus = char.getProficiencyBonus();
            const magicBonus = weaponInfo.magicBonus || 0;
            
            // Check for advantage/disadvantage from various sources
            let hasAdvantage = char.buffs.guidingBolt || false;
            let hasDisadvantage = false;
            
            // Conditions affecting attacks
            if (char.hasCondition("blinded")) hasDisadvantage = true;
            if (char.hasCondition("prone")) hasDisadvantage = true;
            if (char.hasCondition("restrained")) hasDisadvantage = true;
            if (char.hasCondition("frightened")) hasDisadvantage = true;
            
            // Monster conditions giving advantage
            if (monster.conditions?.paralyzed || monster.conditions?.stunned) hasAdvantage = true;
            if (monster.conditions?.restrained || monster.conditions?.prone) hasAdvantage = true;
            
            // Barbarian Rage grants advantage on STR attacks (Reckless Attack)
            if (char.raging && char.charClass === "Barbarian") hasAdvantage = true;
            
            // Rogue gets advantage if monster has a condition (simplified Sneak Attack condition)
            if (char.charClass === "Rogue" && (monster.conditions?.restrained || monster.conditions?.stunned || monster.conditions?.paralyzed || monster.conditions?.prone)) {
                hasAdvantage = true;
            }
            
            // Hidden Strike from Cunning Action: Hide
            if (char.buffs.hiddenStrike) {
                hasAdvantage = true;
                char.buffs.hiddenStrike = false;
            }
            
            // Weather affects ranged attacks
            const weatherEffects = this.dm.getWeatherEffects();
            if (weaponInfo.properties?.includes("ranged") && weatherEffects.rangedDisadvantage) {
                hasDisadvantage = true;
            }
            
            // Clear guiding bolt buff after use
            if (char.buffs.guidingBolt) {
                char.buffs.guidingBolt = false;
            }
            
            // Use weapon's stat (finesse weapons use DEX, others use their defined stat)
            let attackStat = weaponInfo.stat;
            if (weaponInfo.properties && weaponInfo.properties.includes("finesse")) {
                attackStat = char.getModifier("dex") > char.getModifier("str") ? "dex" : "str";
            }
            const attackMod = char.getModifier(attackStat);
            
            // Total attack modifier: ability mod + proficiency bonus (if proficient) + magic weapon bonus
            let totalAttackMod = attackMod + magicBonus;
            if (char.isProficientWithWeapon(char.equipped.weapon || "Unarmed")) {
                totalAttackMod += profBonus;
            }
            
            // Equipment proficiency: non-proficient armor causes disadvantage on attacks
            let armorPenalty = false;
            if (char.equipped.armor && !char.isProficientWithArmor(char.equipped.armor)) {
                armorPenalty = true;
                hasDisadvantage = true;
            }
            if (char.equipped.shield && !char.isProficientWithShield()) {
                armorPenalty = true;
                hasDisadvantage = true;
            }
            
            // Feat: Great Weapon Master / Sharpshooter power attack (-5 hit, +10 damage)
            let powerAttackActive = false;
            if (char.feats.includes("Great Weapon Master") && weaponInfo.properties?.includes("heavy")) {
                totalAttackMod -= 5;
                powerAttackActive = true;
            } else if (char.feats.includes("Sharpshooter") && weaponInfo.properties?.includes("ranged")) {
                totalAttackMod -= 5;
                powerAttackActive = true;
            }
            
            // Roll attack with advantage/disadvantage support - with animation
            // Champion subclass: expanded crit range
            const critRange = char.subclassFeatures?.critRange || 20;
            const attackResult = await this.dm.rollAttackAnimated(totalAttackMod, hasAdvantage, hasDisadvantage, critRange);
            
            // Assassin: Assassinate - first hit on a surprised enemy is auto-crit
            if (char.subclassFeatures?.assassinateActive && attackResult.total >= monster.ac) {
                attackResult.isCrit = true;
                char.subclassFeatures.assassinateActive = false; // Only works once
            }
            
            // Calculate bonus damage from various sources
            let bonusDamage = 0;
            let bonusDamageText = "";
            
            // Hunter's Mark bonus
            if (char.buffs.huntersMark) {
                const hmDmg = this.dm.rollDice("1d6");
                bonusDamage += hmDmg;
                bonusDamageText += ` +${hmDmg} Hunter's Mark`;
            }
            
            // Barbarian Rage bonus damage
            if (char.raging && char.charClass === "Barbarian") {
                const rageDmg = char.getRageDamage();
                bonusDamage += rageDmg;
                bonusDamageText += ` +${rageDmg} Rage`;
            }
            
            // Bardic Inspiration bonus on attack
            if (char.buffs.bardicInspiration) {
                const inspireDmg = this.dm.rollDice(char.buffs.bardicInspiration);
                bonusDamage += inspireDmg;
                bonusDamageText += ` +${inspireDmg} Inspiration`;
                char.buffs.bardicInspiration = null;
            }
            
            // Weapon-specific bonus damage (e.g., Yuan-ti Fang Sword poison, Goblin Cleaver vs goblinoids)
            const weaponData = char.getWeaponData(char.equipped.weapon, campaignId);
            if (weaponData) {
                const monsterType = (monster.type || monster.name || "").toLowerCase();
                
                // Always-on bonus dice (e.g., Yuan-ti Fang Sword: +1d4 poison on every hit)
                if (weaponData.bonusDamageDice && !weaponData.bonusDamageVs) {
                    const wpnBonusDmg = this.dm.rollDice(weaponData.bonusDamageDice);
                    bonusDamage += wpnBonusDmg;
                    bonusDamageText += ` +${wpnBonusDmg} ${weaponData.bonusDamageType || 'special'}`;
                }
                
                // Helper to check if monster matches a creature type
                const matchesType = (bonusVs) => {
                    if (monsterType.includes(bonusVs)) return true;
                    if (bonusVs === "goblinoid" && (monsterType.includes("goblin") || monsterType.includes("hobgoblin") || monsterType.includes("bugbear"))) return true;
                    if (bonusVs === "undead" && (monsterType.includes("undead") || monsterType.includes("zombie") || monsterType.includes("skeleton") || monsterType.includes("vampire") || monsterType.includes("ghost") || monsterType.includes("wight") || monsterType.includes("ghoul"))) return true;
                    return false;
                };
                
                // Flat bonus vs creature type (e.g., Goblin Cleaver: +1 vs goblinoids)
                if (weaponData.bonusDamageVs && weaponData.bonusDamage && matchesType(weaponData.bonusDamageVs.toLowerCase())) {
                    bonusDamage += weaponData.bonusDamage;
                    bonusDamageText += ` +${weaponData.bonusDamage} vs ${weaponData.bonusDamageVs}`;
                }
                
                // Bonus dice vs creature type (e.g., Sunsword: +1d6 radiant vs undead)
                if (weaponData.bonusDamageVs && weaponData.bonusDamageDice && matchesType(weaponData.bonusDamageVs.toLowerCase())) {
                    const vsBonusDmg = this.dm.rollDice(weaponData.bonusDamageDice);
                    bonusDamage += vsBonusDmg;
                    bonusDamageText += ` +${vsBonusDmg} ${weaponData.bonusDamageType || 'radiant'} vs ${weaponData.bonusDamageVs}`;
                }
            }
            
            // Rogue Sneak Attack (applies once per turn when has advantage or ally adjacent)
            let sneakAttackDamage = 0;
            if (char.charClass === "Rogue" && char.getSneakAttackDice() > 0) {
                // Sneak Attack triggers with advantage or in simplified conditions (always in party play)
                const sneakDice = char.getSneakAttackDice();
                sneakAttackDamage = this.dm.rollDice(`${sneakDice}d6`);
                bonusDamageText += ` +${sneakAttackDamage} Sneak Attack (${sneakDice}d6)`;
            }
            
            // Subclass combat bonuses
            // Battle Master: spend superiority die for bonus damage
            if (char.subclass === 'BattleMaster' && char.subclassFeatures.superiorityDiceRemaining > 0) {
                const dieSize = char.subclassFeatures.superiorityDieSize || 8;
                const superiorityDmg = this.dm.rollDice(`1d${dieSize}`);
                bonusDamage += superiorityDmg;
                char.subclassFeatures.superiorityDiceRemaining--;
                bonusDamageText += ` +${superiorityDmg} Maneuver (d${dieSize})`;
                this.log(`⚔️ Combat Maneuver! (${char.subclassFeatures.superiorityDiceRemaining}/${char.subclassFeatures.superiorityDice} dice remaining)`, "combat");
            }
            
            // Hunter Ranger: Colossus Slayer (1d8 extra vs wounded)
            if (char.subclass === 'Hunter' && monster.hp < monster.maxHp) {
                const colossusSlayerDmg = this.dm.rollDice("1d8");
                bonusDamage += colossusSlayerDmg;
                bonusDamageText += ` +${colossusSlayerDmg} Colossus Slayer`;
            }
            
            // Feat: GWM / Sharpshooter +10 damage bonus
            if (powerAttackActive) {
                bonusDamage += 10;
                bonusDamageText += ` +10 Power Attack`;
            }
            
            // Build roll message
            let rollMsg = "";
            if (attackResult.advType) {
                rollMsg = `(${attackResult.roll1}, ${attackResult.roll2}) → ${attackResult.roll}`;
                rollMsg += attackResult.advType === "advantage" ? " 📈" : " 📉";
            } else {
                rollMsg = `${attackResult.roll}`;
            }
            rollMsg += `+${totalAttackMod}=${attackResult.total}`;
            if (magicBonus > 0) rollMsg += ` (includes +${magicBonus} magic)`;
            
            if (attackResult.isFumble) {
                // FUMBLE! Roll on fumble table
                const fumble = FUMBLE_EFFECTS[Math.floor(Math.random() * FUMBLE_EFFECTS.length)];
                this.log(`💀 FUMBLE! Natural 1! ${fumble.effect}`, "danger");
                soundManager.playMiss();
                this.applyFumbleEffect(fumble);
            } else if (attackResult.isCrit) {
                // CRITICAL HIT! Double the weapon dice + ability mod + magic bonus + bonus damage
                const critEffect = CRITICAL_HIT_EFFECTS[Math.floor(Math.random() * CRITICAL_HIT_EFFECTS.length)];
                // Crit: roll weapon dice twice (per 5e RAW) + mods
                let critDamage = this.dm.rollDice(weaponInfo.damage) + this.dm.rollDice(weaponInfo.damage) + attackMod + magicBonus + bonusDamage;
                // Sneak Attack dice also double on crit
                if (sneakAttackDamage > 0) {
                    const sneakDice = char.getSneakAttackDice();
                    critDamage += sneakAttackDamage + this.dm.rollDice(`${sneakDice}d6`); // Original + extra dice
                }
                
                // Apply crit effect
                if (critEffect.bonusDamage) {
                    critDamage += this.dm.rollDice(critEffect.bonusDamage);
                }
                if (critEffect.special === "maxDie") {
                    critDamage += parseInt(weaponInfo.damage.split("d")[1]) || 6;
                }
                if (critEffect.condition) {
                    monster.conditions = monster.conditions || {};
                    monster.conditions[critEffect.condition] = true;
                }
                
                const critResult = this.applyDamageToMonster(monster, critDamage, weaponInfo.type);
                soundManager.playCritical();
                this.log(`🎯 CRITICAL HIT! ${critEffect.name}: ${critEffect.effect}`, "success");
                this.log(`💥 ${critResult.finalDamage} ${weaponInfo.type} damage with ${weaponInfo.name}!${bonusDamageText}`, "combat");
                if (critResult.message) this.log(critResult.message, "dm");
                
                // Check for bonus attack
                if (critEffect.special === "bonusAttack") {
                    this.log("⚔️ You gain a bonus attack!", "success");
                    const bonusAttack = await this.dm.rollAttackAnimated(totalAttackMod, false, false);
                    if (bonusAttack.total >= monster.ac) {
                        const bonusDmg = this.dm.rollDice(weaponInfo.damage) + attackMod + magicBonus;
                        const bonusResult = this.applyDamageToMonster(monster, bonusDmg, weaponInfo.type);
                        this.log(`⚔️ Bonus attack hits for ${bonusResult.finalDamage} damage!`, "combat");
                        if (bonusResult.message) this.log(bonusResult.message, "dm");
                    }
                }
            } else if (attackResult.total >= monster.ac) {
                // Normal hit: weapon die + ability mod + magic bonus + bonus damage
                const damage = this.dm.rollDice(weaponInfo.damage) + attackMod + magicBonus + bonusDamage + sneakAttackDamage;
                const hitResult = this.applyDamageToMonster(monster, damage, weaponInfo.type);
                soundManager.playHit();
                this.log(`⚔️ You hit with ${weaponInfo.name}! (Roll: ${rollMsg} vs AC ${monster.ac}) Damage: ${hitResult.finalDamage} ${weaponInfo.type}${bonusDamageText}`, "combat");
                if (hitResult.message) this.log(hitResult.message, "dm");
            } else {
                soundManager.playMiss();
                this.log(`❌ You miss with ${weaponInfo.name}! (Roll: ${rollMsg} vs AC ${monster.ac})`, "combat");
            }
            
            // EXTRA ATTACKS (martial classes level 5+, Fighter gets more at 11/20)
            const totalAttacks = char.getExtraAttackCount();
            for (let extraNum = 1; extraNum < totalAttacks && monster.hp > 0; extraNum++) {
                this.log(`⚔️ Extra Attack ${extraNum}!`, "combat");
                const extraAttack = await this.dm.rollAttackAnimated(totalAttackMod, hasAdvantage, hasDisadvantage, critRange);
                let extraRollMsg = `${extraAttack.roll}+${totalAttackMod}=${extraAttack.total}`;
                
                // Calculate extra attack bonus damage (Hunter's Mark applies to each attack, Sneak Attack does NOT)
                let extraBonusDmg = 0;
                let extraBonusText = "";
                if (char.buffs.huntersMark) {
                    const hmExtra = this.dm.rollDice("1d6");
                    extraBonusDmg += hmExtra;
                    extraBonusText += ` +${hmExtra} Hunter's Mark`;
                }
                if (char.raging && char.charClass === "Barbarian") {
                    const rageDmg = char.getRageDamage();
                    extraBonusDmg += rageDmg;
                    extraBonusText += ` +${rageDmg} Rage`;
                }
                // Subclass bonus on extra attacks
                if (char.subclass === 'Hunter' && monster.hp < monster.maxHp) {
                    const csExtra = this.dm.rollDice("1d8");
                    extraBonusDmg += csExtra;
                    extraBonusText += ` +${csExtra} Colossus Slayer`;
                }
                
                if (extraAttack.isFumble) {
                    const fumble = FUMBLE_EFFECTS[Math.floor(Math.random() * FUMBLE_EFFECTS.length)];
                    this.log(`💀 Extra attack FUMBLE! ${fumble.effect}`, "danger");
                    this.applyFumbleEffect(fumble);
                } else if (extraAttack.isCrit) {
                    const extraCritDmg = this.dm.rollDice(weaponInfo.damage) + this.dm.rollDice(weaponInfo.damage) + attackMod + magicBonus + extraBonusDmg;
                    const ecResult = this.applyDamageToMonster(monster, extraCritDmg, weaponInfo.type);
                    this.log(`🎯 CRITICAL! Extra attack deals ${ecResult.finalDamage} damage!${extraBonusText}`, "success");
                    if (ecResult.message) this.log(ecResult.message, "dm");
                } else if (extraAttack.total >= monster.ac) {
                    const extraDmg = this.dm.rollDice(weaponInfo.damage) + attackMod + magicBonus + extraBonusDmg;
                    const ehResult = this.applyDamageToMonster(monster, extraDmg, weaponInfo.type);
                    this.log(`⚔️ Extra attack hits! (${extraRollMsg} vs AC ${monster.ac}) ${ehResult.finalDamage} damage!${extraBonusText}`, "combat");
                    if (ehResult.message) this.log(ehResult.message, "dm");
                } else {
                    this.log(`❌ Extra attack misses! (${extraRollMsg} vs AC ${monster.ac})`, "combat");
                }
            }
            
            // Berserker Frenzy: bonus action attack while raging
            if (char.subclass === 'Berserker' && char.raging && monster.hp > 0) {
                this.log(`💢 Frenzy! Bonus action attack!`, "combat");
                const frenzyAttack = await this.dm.rollAttackAnimated(totalAttackMod, false, false, critRange);
                if (frenzyAttack.isCrit) {
                    const frenzyDmg = this.dm.rollDice(weaponInfo.damage) + this.dm.rollDice(weaponInfo.damage) + attackMod + magicBonus;
                    this.applyDamageToMonster(monster, frenzyDmg, weaponInfo.type);
                    this.log(`🎯 CRITICAL Frenzy attack! ${frenzyDmg} damage!`, "success");
                } else if (frenzyAttack.total >= monster.ac) {
                    const frenzyDmg = this.dm.rollDice(weaponInfo.damage) + attackMod + magicBonus;
                    this.applyDamageToMonster(monster, frenzyDmg, weaponInfo.type);
                    this.log(`💢 Frenzy attack hits for ${frenzyDmg} damage!`, "combat");
                } else {
                    this.log(`❌ Frenzy attack misses!`, "combat");
                }
            }
            
            // War Priest: bonus action attack
            if (char.subclass === 'War' && char.subclassFeatures.warPriestUsesRemaining > 0 && monster.hp > 0) {
                char.subclassFeatures.warPriestUsesRemaining--;
                this.log(`⚔️ War Priest! Bonus weapon attack!`, "combat");
                const warAttack = await this.dm.rollAttackAnimated(totalAttackMod, false, false);
                if (warAttack.total >= monster.ac || warAttack.isCrit) {
                    const warDmg = this.dm.rollDice(weaponInfo.damage) + attackMod + magicBonus;
                    this.applyDamageToMonster(monster, warDmg, weaponInfo.type);
                    this.log(`⚔️ War Priest hits for ${warDmg} damage! (${char.subclassFeatures.warPriestUsesRemaining} uses left)`, "combat");
                } else {
                    this.log(`❌ War Priest attack misses!`, "combat");
                }
            }
            
            // Beast Master: Animal Companion attacks
            if (char.subclass === 'BeastMaster' && char.subclassFeatures.companion && char.subclassFeatures.companion.hp > 0 && monster.hp > 0) {
                const companion = char.subclassFeatures.companion;
                const companionAttackMod = char.getModifier("wis") + char.getProficiencyBonus();
                const companionAttack = await this.dm.rollAttackAnimated(companionAttackMod, false, false);
                if (companionAttack.isCrit) {
                    const compDmg = this.dm.rollDice(companion.damage) + this.dm.rollDice(companion.damage);
                    this.applyDamageToMonster(monster, compDmg, "piercing");
                    this.log(`🐺 ${companion.name} scores a CRITICAL bite for ${compDmg} damage!`, "success");
                } else if (companionAttack.total >= monster.ac) {
                    const compDmg = this.dm.rollDice(companion.damage);
                    this.applyDamageToMonster(monster, compDmg, "piercing");
                    this.log(`🐺 ${companion.name} bites for ${compDmg} damage!`, "combat");
                } else {
                    this.log(`🐺 ${companion.name}'s attack misses!`, "combat");
                }
            }
            
            this.dm.defendingThisTurn = false;
            
        } else if (action === "defend") {
            this.log("🛡️ You take a defensive stance, gaining +2 AC this round.", "dm");
            this.dm.defendingThisTurn = true;
            
        } else if (action === "flee") {
            // Cunning Action: Dash / Step of the Wind gives auto-flee
            if (this.dm.cunningDash) {
                this.dm.cunningDash = false;
                this.log(`🏃 You dash away with blinding speed — escape is automatic!`, "success");
                this.endCombat(false);
                this.processingCombatAction = false;
                return;
            }
            
            // Check for Disengage (no opportunity attack if disengaged)
            let disengaged = false;
            if (this.dm.cunningDisengage) {
                disengaged = true;
                this.dm.cunningDisengage = false;
                this.log(`🤸 You nimbly disengage, avoiding opportunity attacks!`, "dm");
            }
            
            // Opportunity Attack: monster gets a free attack when you flee without disengaging
            if (!disengaged && monster.hp > 0) {
                this.log(`⚔️ ${monster.name} makes an opportunity attack as you try to flee!`, "danger");
                const monsterAttackBonus = monster.attackBonus || Math.floor(monster.hp / 10) + 3;
                const oaRoll = Math.floor(Math.random() * 20) + 1;
                const oaTotal = oaRoll + monsterAttackBonus;
                const playerAC = char.ac + (this.dm.defendingThisTurn ? 2 : 0);
                
                if (oaRoll === 20 || oaTotal >= playerAC) {
                    const oaDmg = monster.damage ? this.dm.rollDice(monster.damage) : Math.floor(Math.random() * 6) + 2;
                    const finalOaDmg = oaRoll === 20 ? oaDmg * 2 : oaDmg;
                    
                    // Half-Orc Relentless Endurance check
                    if (char.hp - finalOaDmg <= 0 && char.race === "Half-Orc" && !char.racialAbilities.relentlessUsed) {
                        char.hp = 1;
                        char.racialAbilities.relentlessUsed = true;
                        this.log(`💀 The attack would have dropped you, but your Relentless Endurance keeps you at 1 HP!`, "success");
                    } else {
                        char.hp = Math.max(0, char.hp - finalOaDmg);
                        this.log(`💥 Opportunity attack hits for ${finalOaDmg} damage! (${oaRoll}+${monsterAttackBonus}=${oaTotal} vs AC ${playerAC})`, "danger");
                    }
                    
                    // Sentinel feat: if monster has it, speed reduced to 0 — but since it's a player fleeing, Sentinel on monster stops the flee
                    if (char.hp <= 0) {
                        this.updateUI();
                        this.processingCombatAction = false;
                        return;
                    }
                } else {
                    this.log(`⚔️ Opportunity attack misses! (${oaRoll}+${monsterAttackBonus}=${oaTotal} vs AC ${playerAC})`, "dm");
                }
            }
            
            // Flee check (Athletics/Acrobatics)
            let fleeDC = disengaged ? 5 : 12;
            const check = await this.dm.skillCheckAnimated("dex", fleeDC, false, false, "Acrobatics");
            if (check.success) {
                this.log(`🏃 You successfully flee from combat! (Roll: ${check.roll}+${check.modifier}=${check.total} vs DC ${fleeDC})`, "success");
                this.endCombat(false);
                this.processingCombatAction = false;
                return;
            } else {
                this.log(`❌ You fail to escape! (Roll: ${check.roll}+${check.modifier}=${check.total} vs DC ${fleeDC})`, "danger");
            }
            this.dm.defendingThisTurn = false;
        } else if (action === "spell") {
            // Open spell casting UI
            this.showSpellMenu();
            this.processingCombatAction = false;
            return; // Don't proceed to monster turn yet
        } else if (action === "rage") {
            // Barbarian Rage - bonus action, then still get to attack
            if (char.charClass === "Barbarian" && char.ragesRemaining > 0 && !char.raging) {
                char.raging = true;
                char.ragesRemaining--;
                this.log(`💢 RAGE! You enter a furious rage! (+${char.getRageDamage()} melee damage, resistance to physical damage, advantage on STR attacks)`, "success");
                this.log(`Rages remaining: ${char.ragesRemaining}`, "dm");
                // Update the rage button
                const rageBtn = document.getElementById("rageCombatBtn");
                if (rageBtn) {
                    rageBtn.innerHTML = '<span class="icon">💢</span> Raging!';
                    rageBtn.disabled = true;
                }
                // Rage is a bonus action — proceed to attack automatically
                this.processingCombatAction = false;
                await this.combatAction("attack");
                return;
            }
            this.processingCombatAction = false;
            return;
        }
        
        // Update enemy HP display
        document.getElementById("enemyHp").textContent = Math.max(0, monster.hp);
        
        // Check if enemy is dead
        if (monster.hp <= 0) {
            this.handleMonsterDeath(monster);
            this.processingCombatAction = false;
            return;
        }
        
        // Companion attacks (if any companions in party)
        await this.companionCombatRound(monster);
        
        // Check again if enemy died from companion attacks
        if (monster.hp <= 0) {
            this.handleMonsterDeath(monster);
            this.processingCombatAction = false;
            return;
        }
        
        // Monster's turn
        this.monsterTurn();
        
        // Reset processing flag at the end
        this.processingCombatAction = false;
    }
    
    async companionCombatRound(monster) {
        if (!this.dm.party || this.dm.party.length === 0) return;
        
        for (const companion of this.dm.party) {
            if (companion.currentHp <= 0) continue; // Skip unconscious companions
            
            await this.delay(500); // Brief pause between companion attacks
            
            const result = this.dm.companionAttack(companion, monster);
            this.log(result.message, result.hit ? "combat" : "dm");
            
            if (result.hit) {
                monster.hp -= result.damage;
                document.getElementById("enemyHp").textContent = Math.max(0, monster.hp);
                
                if (monster.hp <= 0) {
                    this.log(`${companion.name} deals the finishing blow!`, "success");
                    return;
                }
            }
            
            // Monster may retaliate against companions
            if (Math.random() < 0.3 && monster.hp > 0) {
                await this.delay(300);
                this.companionTakesDamage(companion, monster);
            }
        }
    }
    
    companionTakesDamage(companion, monster) {
        const monsterAttack = Math.floor(Math.random() * 20) + 1 + 2; // +2 is basic attack bonus
        
        if (monsterAttack >= companion.ac) {
            const damage = this.dm.rollDice(monster.damage);
            companion.currentHp -= damage;
            
            if (companion.currentHp <= 0) {
                companion.currentHp = 0;
                this.log(`💔 ${companion.name} falls unconscious! "${companion.dialogue.hurt}"`, "danger");
                this.dm.adjustCompanionLoyalty(companion.name, -5, "fell in combat");
            } else {
                this.log(`💥 The ${monster.name} hits ${companion.name} for ${damage} damage!`, "danger");
            }
        }
    }

    applyFumbleEffect(fumble) {
        const char = this.character;
        
        if (fumble.selfDamage) {
            const damage = this.dm.rollDice(fumble.selfDamage);
            char.takeDamage(damage);
            this.stats.damageThisCombat += damage;
            this.log(`You hurt yourself for ${damage} damage!`, "danger");
        }
        
        if (fumble.condition) {
            char.addCondition(fumble.condition);
            this.log(`You are now ${fumble.condition}!`, "danger");
        }
        
        if (fumble.penalty === "dropWeapon") {
            this.dm.droppedWeapon = true;
            this.log("You'll need to spend your next action to retrieve your weapon!", "danger");
        }
        
        if (fumble.penalty === "enemyAdvantage") {
            this.dm.enemyAdvantageNextAttack = true;
        }
        
        if (fumble.penalty === "acPenalty") {
            this.dm.tempAcPenalty = 2;
        }
        
        if (fumble.penalty === "attackPenalty") {
            this.dm.tempAttackPenalty = 1;
        }
        
        this.updateUI();
    }

    rollDeathSave() {
        const char = this.character;
        const roll = Math.floor(Math.random() * 20) + 1;
        
        if (roll === 20) {
            // Natural 20 - regain 1 HP!
            char.heal(1);
            char.deathSaves = { successes: 0, failures: 0, stable: false };
            this.log(`🎉 NATURAL 20! You regain consciousness with 1 HP!`, "success");
            this.updateUI();
            return;
        } else if (roll === 1) {
            // Natural 1 - two failures
            char.deathSaves.failures += 2;
            this.log(`💀 Natural 1! Two death save failures! (${char.deathSaves.failures}/3 failures)`, "danger");
        } else if (roll >= 10) {
            char.deathSaves.successes++;
            this.log(`✅ Death save success! Roll: ${roll} (${char.deathSaves.successes}/3 successes)`, "success");
        } else {
            char.deathSaves.failures++;
            this.log(`❌ Death save failure! Roll: ${roll} (${char.deathSaves.failures}/3 failures)`, "danger");
        }
        
        // Check for stabilization or death
        if (char.deathSaves.successes >= 3) {
            char.deathSaves.stable = true;
            this.log("🛡️ You stabilize! You're unconscious but no longer dying.", "success");
            this.log("⚕️ A companion tends to your wounds. You must rest to recover.", "dm");
            // End combat if stabilized
            this.endCombat(false);
            // Show recovery prompt
            setTimeout(() => {
                this.log("You need to rest to regain consciousness. Click 'Rest' to recover.", "danger");
            }, 500);
            return;
        }
        
        if (char.deathSaves.failures >= 3) {
            this.log("💀 You have died...", "danger");
            this.gameOver();
            return;
        }
        
        // Monster still gets to attack (might finish you off)
        this.monsterTurn();
    }

    monsterTurn() {
        const monster = this.dm.currentEnemy;
        const char = this.character;
        
        // Check if monster is stunned or paralyzed
        if (monster.conditions?.stunned || monster.conditions?.paralyzed) {
            this.log(`The ${monster.name} is incapacitated and cannot act!`, "success");
            delete monster.conditions.stunned; // Stun wears off
            this.dm.resetActions();
            this.updateCombatPartyDisplay();
            return;
        }
        
        // Execute special abilities at start of monster turn (if any)
        if (monster.specialAbilities && monster.specialAbilities.length > 0) {
            for (const ability of monster.specialAbilities) {
                if (ability.triggerChance && Math.random() < ability.triggerChance) {
                    this.executeMonsterAbility(monster, ability, char);
                }
            }
        }
        
        // Decide target: player or companion?
        // 40% chance to target a companion if there are conscious companions
        const activeCompanions = (this.dm.party || []).filter(c => c.currentHp > 0);
        const targetCompanion = activeCompanions.length > 0 && Math.random() < 0.4;
        
        if (targetCompanion) {
            // Monster attacks a random companion
            const companion = activeCompanions[Math.floor(Math.random() * activeCompanions.length)];
            this.monsterAttacksCompanion(monster, companion);
            this.dm.resetActions();
            this.updateCombatPartyDisplay();
            this.updateUI();
            return;
        }
        
        // Determine number of attacks (multiattack)
        const numAttacks = monster.multiattack || 1;
        
        for (let attackNum = 0; attackNum < numAttacks; attackNum++) {
            if (char.hp <= 0 && char.deathSaves.failures >= 3) break; // Already dead
            
            if (numAttacks > 1 && attackNum === 0) {
                this.log(`⚔️ The ${monster.name} uses Multiattack! (${numAttacks} attacks)`, "combat");
            }
            
            this.monsterSingleAttack(monster, char, attackNum > 0);
        }
        
        // Clear prone after being attacked (you can stand up)
        char.removeCondition("prone");
        
        // Reset actions for next player turn
        this.dm.resetActions();
        
        // Re-enable bonus action button for new turn
        const bonusBtn = document.getElementById("bonusActionBtn");
        if (bonusBtn) {
            const hasBonusActions = this.getAvailableBonusActions().length > 0;
            if (hasBonusActions) {
                bonusBtn.classList.remove("hidden");
                bonusBtn.disabled = false;
                bonusBtn.innerHTML = '<span class="icon">⚡</span> Bonus <span class="shortcut-hint">[B]</span>';
            } else {
                bonusBtn.classList.add("hidden");
            }
        }
        
        this.updateCombatPartyDisplay();
        this.updateUI();
    }
    
    monsterSingleAttack(monster, char, isExtraAttack = false) {
        // Monster attack roll against player
        let monsterAdvantage = (!isExtraAttack && this.dm.enemyAdvantageNextAttack) || false;
        let monsterDisadvantage = false;
        
        if (monster.conditions?.blinded) monsterDisadvantage = true;
        if (monster.conditions?.frightened) monsterDisadvantage = true;
        if (monster.conditions?.restrained) monsterDisadvantage = true;
        if (char.hasCondition("prone")) monsterAdvantage = true;
        
        if (!isExtraAttack) this.dm.enemyAdvantageNextAttack = false;
        
        let roll1 = Math.floor(Math.random() * 20) + 1;
        let roll2 = Math.floor(Math.random() * 20) + 1;
        let monsterAttack = roll1;
        
        if (monsterAdvantage && !monsterDisadvantage) {
            monsterAttack = Math.max(roll1, roll2);
        } else if (monsterDisadvantage && !monsterAdvantage) {
            monsterAttack = Math.min(roll1, roll2);
        }
        
        let defenseBonus = this.dm.defendingThisTurn ? 2 : 0;
        if (!isExtraAttack) {
            defenseBonus -= this.dm.tempAcPenalty || 0;
            this.dm.tempAcPenalty = 0;
        }
        
        // Shield spell adds +5 AC
        if (char.buffs.shieldActive) {
            defenseBonus += 5;
            char.buffs.shieldActive = false; // Expires after this attack
        }
        
        const attackBonus = this.getMonsterAttackBonus(monster);
        const isCrit = monsterAttack === 20;
        const isFumble = monsterAttack === 1;
        
        // Use the monster's attack bonus for the total
        const totalAttackRoll = monsterAttack + attackBonus;
        
        if (isFumble) {
            this.log(`🎉 The ${monster.name} fumbles ${isExtraAttack ? 'an extra ' : 'their '}attack!`, "success");
            soundManager.playMiss();
        } else if (isCrit || totalAttackRoll >= char.ac + defenseBonus) {
            // Determine damage dice — support multiple attack types
            let damageDice = monster.damage;
            let damageType = monster.damageType || "physical";
            
            // If monster has attacks array, pick the appropriate one
            if (monster.attacks && monster.attacks.length > 0) {
                const attackChoice = monster.attacks[isExtraAttack ? Math.min(1, monster.attacks.length - 1) : 0];
                damageDice = attackChoice.damage || monster.damage;
                damageType = attackChoice.type || damageType;
            }
            
            let damage = this.dm.rollDice(damageDice);
            
            // Critical hit from monster
            if (isCrit) {
                damage *= 2;
                soundManager.playCritical();
                this.log(`💀 CRITICAL HIT! The ${monster.name} crits you for ${damage} ${damageType} damage!`, "danger");
            } else {
                soundManager.playHit();
                this.log(`💥 The ${monster.name} hits you for ${damage} ${damageType} damage! (${monsterAttack}+${attackBonus}=${totalAttackRoll} vs AC ${char.ac + defenseBonus})`, "danger");
            }
            
            // Barbarian Rage: resistance to bludgeoning, piercing, and slashing damage
            if (char.raging && char.charClass === "Barbarian") {
                const physicalTypes = ["bludgeoning", "piercing", "slashing", "physical"];
                if (char.subclass === 'TotemWarrior' || physicalTypes.includes(damageType)) {
                    damage = Math.floor(damage / 2);
                    if (char.subclass === 'TotemWarrior') {
                        this.log(`🐻 Bear Totem Rage absorbs the blow! Damage reduced to ${damage}!`, "success");
                    } else {
                        this.log(`💢 Rage reduces damage to ${damage}!`, "success");
                    }
                }
            }
            
            // Abjuration Wizard: Arcane Ward absorbs damage first
            if (char.subclass === 'Abjuration' && char.subclassFeatures.arcaneWardHp > 0) {
                const absorbed = Math.min(damage, char.subclassFeatures.arcaneWardHp);
                char.subclassFeatures.arcaneWardHp -= absorbed;
                damage -= absorbed;
                this.log(`🛡️ Arcane Ward absorbs ${absorbed} damage! (Ward HP: ${char.subclassFeatures.arcaneWardHp})`, "success");
                if (damage <= 0) {
                    this.log(`✨ The Arcane Ward blocked all the damage!`, "success");
                    this.stats.damageThisCombat += 0;
                    return;
                }
            }
            
            if (damage > 0) {
                this.applyMonsterDamageToPlayer(char, damage, isCrit, damageType);
            }
        } else {
            soundManager.playMiss();
            if (!isExtraAttack) {
                this.log(`🛡️ The ${monster.name} misses! (${monsterAttack}+${attackBonus}=${totalAttackRoll} vs AC ${char.ac + defenseBonus})`, "dm");
            } else {
                this.log(`🛡️ Extra attack misses!`, "dm");
            }
        }
    }
    
    applyMonsterDamageToPlayer(char, damage, isCrit = false, damageType = null) {
        // Taking damage while at 0 HP = automatic death save failure
        if (char.hp === 0) {
            char.deathSaves.failures++;
            if (isCrit) char.deathSaves.failures++; // Crit = 2 failures
            this.log(`Taking damage while dying! (${char.deathSaves.failures}/3 failures)`, "danger");
            if (char.deathSaves.failures >= 3) {
                this.log("💀 You have died...", "danger");
                soundManager.playDeath();
                this.gameOver();
                return;
            }
        } else if (!char.takeDamage(damage, damageType)) {
            // Dropped to 0 HP (or Relentless Endurance triggered)
            if (char.hp > 0) {
                // Half-Orc Relentless Endurance triggered
                this.stats.damageThisCombat += damage;
                this.log(`🔥 Half-Orc Relentless Endurance! You refuse to fall — 1 HP remaining!`, "success");
            } else {
                this.stats.damageThisCombat += damage;
                soundManager.playDeath();
                this.log("💀 You fall unconscious! Roll death saves to survive!", "danger");
                this.showDeathSaveButton();
            }
        } else {
            // Still conscious, track damage
            this.stats.damageThisCombat += damage;
            
            // Racial resistance notification
            if (damageType) {
                if ((char.race === "Dragonborn" && damageType === "fire") ||
                    (char.race === "Tiefling" && damageType === "fire") ||
                    (char.race === "Dwarf" && damageType === "poison")) {
                    this.log(`🛡️ Racial resistance halves the ${damageType} damage!`, "success");
                }
            }
            
            // Concentration check when taking damage
            if (char.concentrating) {
                const concCheck = this.dm.concentrationCheck(damage);
                if (!concCheck.success) {
                    this.dropConcentration(char, concCheck.message);
                } else if (concCheck.message) {
                    this.log(`🔮 ${concCheck.message}`, "success");
                }
            }
        }
    }
    
    executeMonsterAbility(monster, ability, char) {
        const abilityName = ability.name || "Special Ability";
        
        switch (ability.type) {
            case "breath":
                // Breath weapon (dragon-type): DEX save for half damage
                const breathDmg = this.dm.rollDice(ability.damage);
                const saveDC = ability.dc || this.getMonsterSaveDC(monster);
                const dexSave = this.dm.rollDice("1d20") + char.getModifier("dex");
                if (dexSave >= saveDC) {
                    const halfDmg = Math.floor(breathDmg / 2);
                    this.log(`🔥 ${monster.name} uses ${abilityName}! You dodge (DEX save ${dexSave} vs DC ${saveDC}) — ${halfDmg} ${ability.damageType || 'fire'} damage!`, "danger");
                    this.applyMonsterDamageToPlayer(char, halfDmg);
                } else {
                    this.log(`🔥 ${monster.name} uses ${abilityName}! (DEX save ${dexSave} vs DC ${saveDC}) — ${breathDmg} ${ability.damageType || 'fire'} damage!`, "danger");
                    this.applyMonsterDamageToPlayer(char, breathDmg);
                }
                break;
                
            case "frighten":
                // Frightful Presence: WIS save or become frightened
                const wisSave = this.dm.rollDice("1d20") + char.getModifier("wis");
                const frightDC = ability.dc || this.getMonsterSaveDC(monster);
                if (wisSave < frightDC) {
                    char.addCondition("frightened");
                    this.log(`😱 ${monster.name} uses ${abilityName}! (WIS save ${wisSave} vs DC ${frightDC}) You are frightened!`, "danger");
                } else {
                    this.log(`💪 ${monster.name} uses ${abilityName}! (WIS save ${wisSave} vs DC ${frightDC}) You resist the fear!`, "success");
                }
                break;
                
            case "poison":
                // Poison attack: CON save or take poison damage + poisoned condition
                const conSave = this.dm.rollDice("1d20") + char.getModifier("con");
                const poisonDC = ability.dc || this.getMonsterSaveDC(monster);
                const poisonDmg = this.dm.rollDice(ability.damage || "2d6");
                if (conSave < poisonDC) {
                    char.addCondition("poisoned");
                    this.log(`☠️ ${monster.name} uses ${abilityName}! (CON save ${conSave} vs DC ${poisonDC}) You take ${poisonDmg} poison damage and are poisoned!`, "danger");
                    this.applyMonsterDamageToPlayer(char, poisonDmg);
                } else {
                    const halfPoison = Math.floor(poisonDmg / 2);
                    this.log(`💪 ${monster.name} uses ${abilityName}! (CON save ${conSave} vs DC ${poisonDC}) You resist! ${halfPoison} poison damage.`, "success");
                    this.applyMonsterDamageToPlayer(char, halfPoison);
                }
                break;
                
            case "heal":
                // Monster heals itself (like Troll regeneration)
                const healAmount = this.dm.rollDice(ability.healing || "1d10");
                const oldHp = monster.hp;
                monster.hp = Math.min(monster.maxHp || monster.hp + healAmount, monster.hp + healAmount);
                const healed = monster.hp - oldHp;
                if (healed > 0) {
                    this.log(`💚 ${monster.name} ${abilityName}! Recovers ${healed} HP. (${monster.hp} HP)`, "danger");
                    document.getElementById("enemyHp").textContent = Math.max(0, monster.hp);
                }
                break;
                
            case "summon":
                this.log(`📢 ${monster.name} ${abilityName}!`, "danger");
                // Summon effect — adds temp HP to monster as "reinforcements"
                const bonusHp = this.dm.rollDice(ability.bonusHp || "2d6");
                monster.hp += bonusHp;
                if (monster.maxHp) monster.maxHp += bonusHp;
                this.log(`Reinforcements arrive! (+${bonusHp} HP)`, "danger");
                document.getElementById("enemyHp").textContent = Math.max(0, monster.hp);
                break;
                
            default:
                // Generic ability — just logs a message
                if (ability.message) {
                    this.log(`⚡ ${monster.name}: ${ability.message}`, "danger");
                }
                break;
        }
    }

    monsterAttacksCompanion(monster, companion) {
        const monsterAttack = Math.floor(Math.random() * 20) + 1;
        const attackBonus = Math.floor((monster.ac - 10) / 4) + 2; // Estimate attack bonus
        const totalAttack = monsterAttack + attackBonus;
        
        const isCrit = monsterAttack === 20;
        const isFumble = monsterAttack === 1;
        
        if (isFumble) {
            this.log(`🎉 The ${monster.name} fumbles their attack against ${companion.name}!`, "success");
            soundManager.playMiss();
        } else if (isCrit || totalAttack >= companion.ac) {
            let damage = this.dm.rollDice(monster.damage);
            if (isCrit) {
                damage *= 2;
                this.log(`💀 CRITICAL! The ${monster.name} crits ${companion.name} for ${damage} damage!`, "danger");
            } else {
                this.log(`💥 The ${monster.name} attacks ${companion.name} for ${damage} damage!`, "danger");
            }
            soundManager.playHit();
            
            companion.currentHp -= damage;
            if (companion.currentHp <= 0) {
                companion.currentHp = 0;
                this.log(`💔 ${companion.name} falls unconscious! "${companion.dialogue.hurt}"`, "danger");
                this.dm.adjustCompanionLoyalty(companion.name, -5, "fell in combat");
            }
        } else {
            soundManager.playMiss();
            this.log(`🛡️ ${companion.name} deflects the ${monster.name}'s attack!`, "dm");
        }
    }
    
    updateCombatPartyDisplay() {
        // Update party status display during combat
        let partyDisplay = document.getElementById("combatPartyStatus");
        
        if (!this.dm.party || this.dm.party.length === 0) {
            if (partyDisplay) partyDisplay.remove();
            return;
        }
        
        // Create display if it doesn't exist
        if (!partyDisplay) {
            const combatPanel = document.getElementById("combatPanel");
            if (!combatPanel) return;
            
            partyDisplay = document.createElement("div");
            partyDisplay.id = "combatPartyStatus";
            partyDisplay.className = "combat-party-status";
            
            // Insert after enemy info
            const enemyInfo = combatPanel.querySelector(".enemy-info") || combatPanel.firstChild;
            if (enemyInfo && enemyInfo.nextSibling) {
                combatPanel.insertBefore(partyDisplay, enemyInfo.nextSibling);
            } else {
                combatPanel.appendChild(partyDisplay);
            }
        }
        
        // Build party status HTML
        let html = '<div class="party-combat-header">👥 Party Status</div>';
        html += '<div class="party-combat-list">';
        
        for (const companion of this.dm.party) {
            const hpPercent = Math.max(0, (companion.currentHp / companion.maxHp) * 100);
            const status = companion.currentHp <= 0 ? 'unconscious' : 
                          companion.currentHp <= companion.maxHp / 4 ? 'critical' :
                          companion.currentHp <= companion.maxHp / 2 ? 'wounded' : 'healthy';
            
            html += `
                <div class="party-combat-member ${status}">
                    <span class="pcm-name">${companion.name}</span>
                    <div class="pcm-hp-bar">
                        <div class="pcm-hp-fill ${status}" style="width: ${hpPercent}%"></div>
                    </div>
                    <span class="pcm-hp-text">${companion.currentHp}/${companion.maxHp}</span>
                </div>
            `;
        }
        html += '</div>';
        
        partyDisplay.innerHTML = html;
    }

    showDeathSaveButton() {
        // Add death save button to combat panel
        const combatActions = document.querySelector(".combat-actions");
        if (combatActions && !document.getElementById("deathSaveBtn")) {
            const btn = document.createElement("button");
            btn.id = "deathSaveBtn";
            btn.className = "action-btn danger";
            btn.innerHTML = '<span class="icon">💀</span>Death Save';
            btn.onclick = () => this.combatAction("deathSave");
            combatActions.appendChild(btn);
        }
    }

    // ===== BONUS ACTION ECONOMY =====
    
    getAvailableBonusActions() {
        const char = this.character;
        const actions = [];
        
        // Check if bonus action already used this turn
        if (!this.dm.actions.bonusAction) return actions;
        
        // Fighter: Second Wind (1d10 + level HP, once per short rest)
        if (char.charClass === "Fighter" && !char.secondWindUsed) {
            actions.push({
                id: "secondWind",
                name: "Second Wind",
                icon: "💨",
                description: `Heal 1d10+${char.level} HP (once per short rest)`,
                className: "Fighter"
            });
        }
        
        // Rogue: Cunning Action (Dash, Disengage, or Hide)
        if (char.charClass === "Rogue") {
            actions.push({
                id: "cunningAction",
                name: "Cunning Action",
                icon: "🗡️",
                description: "Dash, Disengage, or Hide as a bonus action",
                className: "Rogue"
            });
        }
        
        // Monk: Ki abilities (level 2+)
        if (char.charClass === "Monk" && char.kiPoints > 0 && char.level >= 2) {
            actions.push({
                id: "flurryOfBlows",
                name: "Flurry of Blows",
                icon: "👊",
                description: `Two unarmed strikes (1 ki) — ${char.kiPoints}/${char.kiMax} ki`,
                className: "Monk"
            });
            actions.push({
                id: "patientDefense",
                name: "Patient Defense",
                icon: "🧘",
                description: `Dodge action as bonus (1 ki) — ${char.kiPoints}/${char.kiMax} ki`,
                className: "Monk"
            });
            actions.push({
                id: "stepOfTheWind",
                name: "Step of the Wind",
                icon: "💨",
                description: `Dash or Disengage as bonus (1 ki) — ${char.kiPoints}/${char.kiMax} ki`,
                className: "Monk"
            });
        }
        
        // Bard: Bardic Inspiration
        if (char.charClass === "Bard" && char.bardicInspirationUses > 0) {
            actions.push({
                id: "bardicInspiration",
                name: "Bardic Inspiration",
                icon: "🎵",
                description: `Grant ${char.bardicInspirationDie} inspiration (${char.bardicInspirationUses} uses left)`,
                className: "Bard"
            });
        }
        
        // Paladin: Lay on Hands (as bonus heal pool)
        if (char.charClass === "Paladin" && char.layOnHandsPool > 0) {
            actions.push({
                id: "layOnHands",
                name: "Lay on Hands",
                icon: "✋",
                description: `Heal up to ${char.layOnHandsPool} HP from your pool`,
                className: "Paladin"
            });
        }
        
        // Sorcerer: Quickened Spell (costs 2 sorcery points)
        if (char.charClass === "Sorcerer" && char.sorceryPoints >= 2 && char.level >= 3) {
            actions.push({
                id: "quickenedSpell",
                name: "Quickened Spell",
                icon: "⚡",
                description: `Cast a spell as bonus action (2 sorcery pts, ${char.sorceryPoints} left)`,
                className: "Sorcerer"
            });
        }
        
        // Two-Weapon Fighting: off-hand attack if wielding light weapon
        if (char.equipped.weapon) {
            const weaponData = char.getWeaponData(char.equipped.weapon, this.dm.campaignId);
            if (weaponData && weaponData.properties && weaponData.properties.includes("light")) {
                actions.push({
                    id: "offhandAttack",
                    name: "Off-Hand Attack",
                    icon: "🗡️",
                    description: `Attack with off hand (${weaponData.damage} without ability mod)`,
                    className: "Any"
                });
            }
        }
        
        // Dragonborn: Breath Weapon (action, but we treat as bonus for flow)
        if (char.race === "Dragonborn" && char.racialAbilities && !char.racialAbilities.breathWeaponUsed) {
            const breathDmg = char.getBreathWeaponDamage();
            const breathType = char.racialAbilities.breathType || "fire";
            actions.push({
                id: "breathWeapon",
                name: "Breath Weapon",
                icon: "🐉",
                description: `${breathDmg} ${breathType} damage, DEX save for half (recharges on short rest)`,
                className: "Dragonborn"
            });
        }
        
        return actions;
    }
    
    showBonusActionMenu() {
        if (!this.dm.inCombat) return;
        
        const actions = this.getAvailableBonusActions();
        if (actions.length === 0) {
            this.log("No bonus actions available!", "danger");
            return;
        }
        
        // Create modal
        let modal = document.getElementById("bonusActionModal");
        if (!modal) {
            modal = document.createElement("div");
            modal.id = "bonusActionModal";
            modal.className = "modal";
            document.body.appendChild(modal);
        }
        
        let actionsHtml = actions.map(a => `
            <div class="spell-btn" onclick="game.executeBonusAction('${a.id}')" style="cursor:pointer; padding: 10px; margin: 5px 0; border: 1px solid #7b2d8e; border-radius: 8px; background: rgba(123,45,142,0.15);">
                <span style="font-size:1.2em">${a.icon}</span> <strong>${a.name}</strong>
                <div style="font-size:0.85em; color:#aaa; margin-top:2px">${a.description}</div>
            </div>
        `).join("");
        
        modal.innerHTML = `
            <div class="modal-content spell-modal-content">
                <h2>⚡ Bonus Actions</h2>
                <div style="max-height: 400px; overflow-y: auto;">
                    ${actionsHtml}
                </div>
                <button class="close-btn" onclick="game.closeBonusActionMenu()">Cancel</button>
            </div>
        `;
        
        modal.style.display = "flex";
    }
    
    closeBonusActionMenu() {
        const modal = document.getElementById("bonusActionModal");
        if (modal) modal.style.display = "none";
    }
    
    async executeBonusAction(actionId) {
        this.closeBonusActionMenu();
        
        if (!this.dm.actions.bonusAction) {
            this.log("You've already used your bonus action this turn!", "danger");
            return;
        }
        
        const char = this.character;
        const monster = this.dm.currentEnemy;
        
        switch (actionId) {
            case "secondWind":
                await this.bonusSecondWind(char);
                break;
            case "cunningAction":
                await this.bonusCunningAction(char);
                break;
            case "flurryOfBlows":
                await this.bonusFlurryOfBlows(char, monster);
                break;
            case "patientDefense":
                await this.bonusPatientDefense(char);
                break;
            case "stepOfTheWind":
                await this.bonusStepOfTheWind(char);
                break;
            case "bardicInspiration":
                await this.bonusBardicInspiration(char);
                break;
            case "layOnHands":
                await this.bonusLayOnHands(char);
                break;
            case "quickenedSpell":
                await this.bonusQuickenedSpell(char);
                break;
            case "offhandAttack":
                await this.bonusOffhandAttack(char, monster);
                break;
            case "breathWeapon":
                await this.bonusBreathWeapon(char, monster);
                break;
            default:
                this.log("Unknown bonus action!", "danger");
                return;
        }
        
        // Consume the bonus action
        this.dm.useAction('bonusAction');
        
        // Update bonus action button state
        const bonusBtn = document.getElementById("bonusActionBtn");
        if (bonusBtn) {
            bonusBtn.disabled = true;
            bonusBtn.innerHTML = '<span class="icon">⚡</span> Used';
        }
        
        this.updateUI();
    }
    
    async bonusSecondWind(char) {
        const healing = this.dm.rollDice("1d10") + char.level;
        const oldHp = char.hp;
        char.hp = Math.min(char.maxHp, char.hp + healing);
        const healed = char.hp - oldHp;
        char.secondWindUsed = true;
        this.log(`💨 Second Wind! You catch your breath and recover ${healed} HP! (${char.hp}/${char.maxHp})`, "success");
    }
    
    async bonusCunningAction(char) {
        // Simplified: Cunning Action gives a defensive benefit 
        const options = ["Dash", "Disengage", "Hide"];
        const choice = options[Math.floor(Math.random() * options.length)];
        
        if (choice === "Dash") {
            this.log(`🏃 Cunning Action: Dash! You dart around the battlefield with extra movement.`, "success");
            // Gives advantage on next flee attempt
            this.dm.cunningDash = true;
        } else if (choice === "Disengage") {
            this.log(`🗡️ Cunning Action: Disengage! You slip away — the enemy can't make opportunity attacks.`, "success");
            this.dm.cunningDisengage = true;
        } else {
            // Hide: gain advantage on next attack
            const stealthCheck = this.dm.rollDice("1d20") + char.getModifier("dex");
            if (stealthCheck >= (this.dm.currentEnemy?.ac || 12)) {
                this.log(`🫥 Cunning Action: Hide! You melt into the shadows. (Stealth: ${stealthCheck}) Next attack has advantage!`, "success");
                char.buffs.hiddenStrike = true;
            } else {
                this.log(`🫥 Cunning Action: Hide attempt failed! (Stealth: ${stealthCheck}) The enemy spots you.`, "danger");
            }
        }
    }
    
    async bonusFlurryOfBlows(char, monster) {
        if (char.kiPoints < 1) {
            this.log("Not enough ki points!", "danger");
            return;
        }
        char.kiPoints--;
        
        const profBonus = char.getProficiencyBonus();
        const attackMod = Math.max(char.getModifier("dex"), char.getModifier("str"));
        const totalMod = attackMod + profBonus;
        const martialDie = char.martialArtsDie || "1d4";
        
        this.log(`👊 Flurry of Blows! (${char.kiPoints}/${char.kiMax} ki remaining)`, "combat");
        
        for (let i = 0; i < 2; i++) {
            await this.delay(400);
            const roll = this.dm.rollDice("1d20");
            const total = roll + totalMod;
            const isCrit = roll === 20;
            
            if (isCrit) {
                const dmg = this.dm.rollDice(martialDie) + this.dm.rollDice(martialDie) + attackMod;
                monster.hp -= dmg;
                this.log(`🎯 CRITICAL unarmed strike ${i+1}! ${dmg} damage!`, "success");
            } else if (total >= monster.ac) {
                const dmg = this.dm.rollDice(martialDie) + attackMod;
                monster.hp -= dmg;
                this.log(`👊 Unarmed strike ${i+1} hits! (${roll}+${totalMod}=${total} vs AC ${monster.ac}) ${dmg} damage!`, "combat");
            } else {
                this.log(`❌ Unarmed strike ${i+1} misses! (${roll}+${totalMod}=${total} vs AC ${monster.ac})`, "combat");
            }
            
            if (monster.hp <= 0) break;
        }
        
        document.getElementById("enemyHp").textContent = Math.max(0, monster.hp);
        if (monster.hp <= 0) {
            this.handleMonsterDeath(monster);
        }
    }
    
    async bonusPatientDefense(char) {
        if (char.kiPoints < 1) {
            this.log("Not enough ki points!", "danger");
            return;
        }
        char.kiPoints--;
        this.dm.defendingThisTurn = true;
        this.log(`🧘 Patient Defense! You adopt a defensive stance (+2 AC this round). (${char.kiPoints}/${char.kiMax} ki)`, "success");
    }
    
    async bonusStepOfTheWind(char) {
        if (char.kiPoints < 1) {
            this.log("Not enough ki points!", "danger");
            return;
        }
        char.kiPoints--;
        // Gives advantage on next flee attempt and +2 AC as movement perk
        this.dm.cunningDash = true;
        this.log(`💨 Step of the Wind! Your movement doubles — you move like the wind! (${char.kiPoints}/${char.kiMax} ki)`, "success");
    }
    
    async bonusBardicInspiration(char) {
        if (char.bardicInspirationUses <= 0) {
            this.log("No Bardic Inspiration uses remaining!", "danger");
            return;
        }
        char.bardicInspirationUses--;
        
        // Apply inspiration buff — adds die to next attack or check
        char.buffs.bardicInspiration = char.bardicInspirationDie;
        this.log(`🎵 Bardic Inspiration! You play an inspiring tune, granting a ${char.bardicInspirationDie} bonus to your next attack or ability check! (${char.bardicInspirationUses} uses left)`, "success");
    }
    
    async bonusLayOnHands(char) {
        if (char.layOnHandsPool <= 0) {
            this.log("Lay on Hands pool is empty!", "danger");
            return;
        }
        
        // Heal based on how hurt the character is, up to pool max
        const missing = char.maxHp - char.hp;
        const healAmount = Math.min(missing, char.layOnHandsPool, Math.max(5, Math.ceil(char.level * 2.5)));
        
        if (healAmount <= 0) {
            this.log("You're already at full health!", "danger");
            return;
        }
        
        char.layOnHandsPool -= healAmount;
        char.hp = Math.min(char.maxHp, char.hp + healAmount);
        this.log(`✋ Lay on Hands! Divine energy flows through you, healing ${healAmount} HP. (${char.hp}/${char.maxHp}, pool: ${char.layOnHandsPool})`, "success");
    }
    
    async bonusQuickenedSpell(char) {
        if (char.sorceryPoints < 2) {
            this.log("Not enough sorcery points! (Need 2)", "danger");
            return;
        }
        char.sorceryPoints -= 2;
        this.log(`⚡ Quickened Spell! You channel metamagic to cast with lightning speed. (${char.sorceryPoints}/${char.sorceryPointsMax} sorcery pts)`, "success");
        // Open spell menu — the spell cast from here doesn't consume the main action
        char.buffs.quickenedSpell = true;
        this.showSpellMenu();
    }
    
    async bonusOffhandAttack(char, monster) {
        const weaponData = char.getWeaponData(char.equipped.weapon, this.dm.campaignId);
        if (!weaponData) return;
        
        const profBonus = char.getProficiencyBonus();
        let attackStat = weaponData.stat;
        if (weaponData.properties && weaponData.properties.includes("finesse")) {
            attackStat = char.getModifier("dex") > char.getModifier("str") ? "dex" : "str";
        }
        const attackMod = char.getModifier(attackStat);
        const totalMod = attackMod + profBonus;
        
        const roll = this.dm.rollDice("1d20");
        const total = roll + totalMod;
        const isCrit = roll === 20;
        
        if (isCrit) {
            // Off-hand does NOT add ability modifier to damage (unless Two-Weapon Fighting style)
            const dmg = this.dm.rollDice(weaponData.damage) + this.dm.rollDice(weaponData.damage);
            monster.hp -= dmg;
            this.log(`🎯 CRITICAL off-hand strike! ${dmg} damage!`, "success");
        } else if (total >= monster.ac) {
            // No ability mod on damage for off-hand (RAW)
            const dmg = this.dm.rollDice(weaponData.damage);
            monster.hp -= dmg;
            this.log(`🗡️ Off-hand attack hits! (${roll}+${totalMod}=${total} vs AC ${monster.ac}) ${dmg} damage!`, "combat");
        } else {
            this.log(`❌ Off-hand attack misses! (${roll}+${totalMod}=${total} vs AC ${monster.ac})`, "combat");
        }
        
        document.getElementById("enemyHp").textContent = Math.max(0, monster.hp);
        if (monster.hp <= 0) {
            this.handleMonsterDeath(monster);
        }
    }
    
    async bonusBreathWeapon(char, monster) {
        if (!monster) return;
        if (char.race !== "Dragonborn" || char.racialAbilities.breathWeaponUsed) {
            this.log("Breath weapon already used!", "danger");
            return;
        }
        
        char.racialAbilities.breathWeaponUsed = true;
        const breathDmg = char.getBreathWeaponDamage();
        const breathType = char.racialAbilities.breathType || "fire";
        const saveDC = 8 + char.getModifier("con") + char.getProficiencyBonus();
        
        const damage = this.dm.rollDice(breathDmg);
        const monsterSave = this.dm.rollDice("1d20") + (monster.saveMod || 0);
        
        this.log(`🐉 You unleash your ${breathType} Breath Weapon! (DC ${saveDC} DEX save)`, "combat");
        
        if (monsterSave >= saveDC) {
            const halfDmg = Math.floor(damage / 2);
            this.applyDamageToMonster(monster, halfDmg, breathType);
            this.log(`🛡️ ${monster.name} partially resists! ${halfDmg} ${breathType} damage (saved: ${monsterSave} vs DC ${saveDC})`, "combat");
        } else {
            this.applyDamageToMonster(monster, damage, breathType);
            this.log(`🔥 ${monster.name} takes ${damage} ${breathType} damage! (failed save: ${monsterSave} vs DC ${saveDC})`, "success");
        }
        
        document.getElementById("enemyHp").textContent = Math.max(0, monster.hp);
        if (monster.hp <= 0) {
            this.handleMonsterDeath(monster);
        }
    }
    
    // ===== END BONUS ACTION ECONOMY =====

    // ===== MONSTER STAT BLOCKS =====
    
    /**
     * Apply damage to a monster, checking resistances, immunities, and vulnerabilities.
     * @param {object} monster - The monster object
     * @param {number} damage - Raw damage amount
     * @param {string} damageType - The type of damage (e.g., "slashing", "fire", "radiant")
     * @returns {object} { finalDamage, message } 
     */
    applyDamageToMonster(monster, damage, damageType = "physical") {
        let finalDamage = damage;
        let message = "";
        
        // Normalize damage type
        const dtype = (damageType || "physical").toLowerCase();
        
        // Check immunity first
        if (monster.immunities && monster.immunities.includes(dtype)) {
            finalDamage = 0;
            message = `💀 The ${monster.name} is IMMUNE to ${dtype} damage!`;
        }
        // Check resistance
        else if (monster.resistances && monster.resistances.includes(dtype)) {
            finalDamage = Math.floor(damage / 2);
            message = `🛡️ The ${monster.name} RESISTS ${dtype} damage! (${damage} → ${finalDamage})`;
        }
        // Check vulnerability
        else if (monster.vulnerabilities && monster.vulnerabilities.includes(dtype)) {
            finalDamage = damage * 2;
            message = `💥 The ${monster.name} is VULNERABLE to ${dtype} damage! (${damage} → ${finalDamage})`;
        }
        
        monster.hp -= finalDamage;
        
        // Update enemy HP display
        const hpEl = document.getElementById("enemyHp");
        if (hpEl) hpEl.textContent = Math.max(0, monster.hp);
        
        return { finalDamage, message };
    }
    
    /**
     * Get the attack bonus for a monster based on its stat block
     */
    getMonsterAttackBonus(monster) {
        if (monster.attackBonus !== undefined) return monster.attackBonus;
        // Estimate from AC: roughly (AC - 10) / 2 + proficiency
        return Math.floor((monster.ac - 10) / 4) + 2;
    }
    
    /**
     * Get the save DC for monster abilities
     */
    getMonsterSaveDC(monster) {
        if (monster.saveDC !== undefined) return monster.saveDC;
        // Estimate: 8 + proficiency + ability mod
        return 8 + Math.floor(monster.xp / 500) + 2;
    }
    
    // ===== END MONSTER STAT BLOCKS =====

    endCombat(victory) {
        this.dm.inCombat = false;
        this.dm.currentEnemy = null;
        document.getElementById("combatPanel").classList.add("hidden");
        
        // Clear dice animation overlay
        diceAnimator.hide();
        
        // Stop combat music
        musicManager.stop();
        
        // Clear combat buffs
        this.character.buffs.shieldActive = false;
        this.character.buffs.guidingBolt = false;
        // Hunter's Mark persists
        // Bless persists until rest
        // End Rage on combat end
        this.character.raging = false;
        // Reset rage button
        const rageBtn = document.getElementById("rageCombatBtn");
        if (rageBtn) {
            rageBtn.innerHTML = '<span class="icon">💢</span> Rage';
            rageBtn.disabled = false;
        }
        
        this.updateUI();
        
        // Show post-combat summary popup (only on victory)
        if (victory) {
            setTimeout(() => this.showPostCombatSummary(), 300);
        }
    }
    
    // ==================== SPELL SYSTEM ====================
    
    showSpellMenu() {
        const char = this.character;
        
        if (!char.isSpellcaster()) {
            this.log("You don't know any spells!", "danger");
            return;
        }
        
        // Create spell menu modal
        let modal = document.getElementById("spellModal");
        if (!modal) {
            modal = document.createElement("div");
            modal.id = "spellModal";
            modal.className = "modal";
            modal.innerHTML = `
                <div class="modal-content spell-modal-content">
                    <h2>✨ Cast a Spell</h2>
                    <div id="spellSlotInfo" class="spell-slot-info"></div>
                    <div id="spellList" class="spell-list"></div>
                    <button class="close-btn" onclick="game.closeSpellMenu()">Cancel</button>
                </div>
            `;
            document.body.appendChild(modal);
        }
        
        // Update spell slot display - dynamically show all levels with slots
        const slotInfo = document.getElementById("spellSlotInfo");
        let slotHtml = '<div class="slot-display">';
        for (let lvl = 1; lvl <= 9; lvl++) {
            const totalSlots = char.spells.slots[lvl] || 0;
            if (totalSlots > 0) {
                const usedSlots = char.spells.slotsUsed[lvl] || 0;
                const availableSlots = totalSlots - usedSlots;
                const ordinal = lvl === 1 ? '1st' : lvl === 2 ? '2nd' : lvl === 3 ? '3rd' : `${lvl}th`;
                slotHtml += `<span>${ordinal} Level: ${'🔮'.repeat(availableSlots)}${'⚫'.repeat(usedSlots)}</span>`;
            }
        }
        slotHtml += '</div>';
        slotInfo.innerHTML = slotHtml;
        
        // Build spell list
        const spellList = document.getElementById("spellList");
        spellList.innerHTML = "";
        
        // Add cantrips section
        if (char.spells.cantrips.length > 0) {
            spellList.innerHTML += `<div class="spell-section-header">Cantrips (At Will)</div>`;
            char.spells.cantrips.forEach(spellName => {
                const spell = GAME_DATA.spells[spellName];
                if (spell) {
                    spellList.innerHTML += this.createSpellButton(spellName, spell, true);
                }
            });
        }
        
        // Add leveled spells section, grouped by spell level
        if (char.spells.known.length > 0) {
            const spellsByLevel = {};
            char.spells.known.forEach(spellName => {
                const spell = GAME_DATA.spells[spellName];
                if (spell) {
                    if (!spellsByLevel[spell.level]) spellsByLevel[spell.level] = [];
                    spellsByLevel[spell.level].push({ name: spellName, spell });
                }
            });
            for (let lvl = 1; lvl <= 9; lvl++) {
                if (spellsByLevel[lvl] && spellsByLevel[lvl].length > 0) {
                    const ordinal = lvl === 1 ? '1st' : lvl === 2 ? '2nd' : lvl === 3 ? '3rd' : `${lvl}th`;
                    const slotsLeft = (char.spells.slots[lvl] || 0) - (char.spells.slotsUsed[lvl] || 0);
                    spellList.innerHTML += `<div class="spell-section-header">${ordinal} Level Spells (${slotsLeft} slots)</div>`;
                    spellsByLevel[lvl].forEach(({ name, spell }) => {
                        const canCast = char.canCastSpell(name);
                        const canRitual = !canCast && spell.ritual && char.canCastRitual(name) && !this.dm.inCombat;
                        spellList.innerHTML += this.createSpellButton(name, spell, canCast || canRitual ? true : canCast);
                    });
                }
            }
        }
        
        modal.classList.add("active");
    }
    
    createSpellButton(spellName, spell, canCast) {
        const char = this.character;
        let effectText = "";
        
        if (spell.damage) {
            // Show scaled damage for cantrips
            const displayDamage = (spell.level === 0 && spell.scaling) ? this.getScaledSpellDamage(spell) : spell.damage;
            effectText = `${displayDamage} ${spell.damageType}`;
        } else if (spell.healing) {
            effectText = `Heal ${spell.healing}+${char.getSpellcastingMod()}`;
        } else if (spell.defensive) {
            effectText = "Defensive";
        } else if (spell.buff) {
            effectText = "Buff";
        } else {
            effectText = "Utility";
        }
        
        const levelText = spell.level === 0 ? "Cantrip" : `Level ${spell.level}`;
        const disabledClass = canCast ? "" : "disabled";
        const disabledAttr = canCast ? "" : "disabled";
        const ritualTag = spell.ritual ? ' <span class="ritual-tag">🕯️ Ritual</span>' : '';
        const concTag = spell.concentration ? ' <span class="conc-tag">◎</span>' : '';
        
        // Show ritual cast button if can cast as ritual but not enough slots
        let ritualBtn = "";
        if (spell.ritual && !canCast && char.canCastRitual(spellName) && !this.dm.inCombat) {
            ritualBtn = `<div class="spell-ritual-btn" onclick="game.castSpellAsRitual('${spellName}')">🕯️ Cast as Ritual (no slot)</div>`;
        }
        
        return `
            <div class="spell-option ${disabledClass}" onclick="${canCast ? `game.castSpell('${spellName}')` : ''}">
                <div class="spell-name">${spellName}${ritualTag}${concTag}</div>
                <div class="spell-info">
                    <span class="spell-level">${levelText}</span>
                    <span class="spell-effect">${effectText}</span>
                </div>
                <div class="spell-desc">${spell.description}</div>
                ${ritualBtn}
            </div>
        `;
    }
    
    closeSpellMenu() {
        const modal = document.getElementById("spellModal");
        if (modal) {
            modal.classList.remove("active");
        }
    }
    
    async castSpellAsRitual(spellName) {
        const char = this.character;
        const spell = GAME_DATA.spells[spellName];
        
        if (!spell || !spell.ritual) {
            this.log("This spell cannot be cast as a ritual.", "danger");
            return;
        }
        if (!char.canCastRitual(spellName)) {
            this.log("You can't cast this spell as a ritual.", "danger");
            return;
        }
        if (this.dm.inCombat) {
            this.log("You can't cast a ritual during combat — it takes 10 minutes!", "danger");
            return;
        }
        
        this.closeSpellMenu();
        
        // Ritual casting takes 10 extra minutes but uses no spell slot
        this.log(`🕯️ You begin a ritual casting of ${spellName}... (10 minutes)`, "dm");
        this.dm.advanceTime(0.167); // ~10 minutes
        
        // Apply the spell effect
        if (spell.utility) {
            this.log(`✨ ${spellName} takes effect through the ritual! ${spell.description}`, "success");
            // Detect Magic: reveal magic items in inventory
            if (spellName === "Detect Magic") {
                const magicItems = char.inventory.filter(item => {
                    const weapon = char.getWeaponData(item);
                    return weapon && weapon.magicBonus;
                });
                if (magicItems.length > 0) {
                    this.log(`🔮 You sense magic emanating from: ${magicItems.join(", ")}`, "dm");
                } else {
                    this.log(`🔮 You sense no magical auras nearby.`, "dm");
                }
            }
            // Identify: identify a random magic item
            if (spellName === "Identify") {
                const unidentified = char.inventory.filter(item => {
                    const weapon = char.getWeaponData(item);
                    return weapon && weapon.magicBonus && !char.isAttuned(item);
                });
                if (unidentified.length > 0) {
                    const item = unidentified[0];
                    const weapon = char.getWeaponData(item);
                    this.log(`📖 You identify ${item}: +${weapon.magicBonus} magical weapon (${weapon.damage} ${weapon.type} damage). Requires attunement.`, "success");
                } else {
                    this.log(`📖 You have no unidentified magic items.`, "dm");
                }
            }
        }
        
        this.updateUI();
    }
    
    async castSpell(spellName) {
        const char = this.character;
        const spell = GAME_DATA.spells[spellName];
        const monster = this.dm.currentEnemy;
        
        if (!spell) return;
        
        // Close the spell menu
        this.closeSpellMenu();
        
        // Use spell slot if not a cantrip
        if (spell.level > 0) {
            if (!char.useSpellSlot(spell.level)) {
                this.log("No spell slots remaining!", "danger");
                return;
            }
            this.log(`✨ You cast ${spellName}! (Level ${spell.level} slot used)`, "combat");
        } else {
            this.log(`✨ You cast ${spellName}!`, "combat");
        }
        
        const spellMod = char.getSpellcastingMod();
        const spellAttack = char.getSpellAttackBonus();
        const spellDC = char.getSpellSaveDC();
        
        // Concentration check: drop existing concentration if casting a new concentration spell
        if (spell.concentration) {
            if (char.concentrating) {
                this.dropConcentration(char, `casting ${spellName}`);
            }
            char.concentrating = spellName;
            this.log(`🔮 Concentrating on ${spellName}.`, "dm");
        }
        
        // Handle different spell types
        if (spell.damage) {
            await this.handleDamageSpell(spellName, spell, monster, spellAttack, spellDC, spellMod);
        } else if (spell.healing) {
            this.handleHealingSpell(spellName, spell, spellMod);
        } else if (spell.defensive) {
            this.handleDefensiveSpell(spellName, spell);
        } else if (spell.buff) {
            this.handleBuffSpell(spellName, spell);
        } else {
            this.handleUtilitySpell(spellName, spell);
        }
        
        // Update UI and proceed with combat
        document.getElementById("enemyHp").textContent = Math.max(0, monster.hp);
        
        // Check if enemy is dead
        if (monster.hp <= 0) {
            this.handleMonsterDeath(monster);
            return;
        }
        
        // Monster's turn (unless spell was defensive/reaction)
        if (!spell.defensive) {
            this.monsterTurn();
        }
        
        this.updateUI();
    }
    
    // Get cantrip damage scaled by character level (5e: extra die at L5, L11, L17)
    getScaledSpellDamage(spell) {
        if (!spell.damage) return spell.damage;
        const char = this.character;
        // Only scale cantrips (level 0)
        if (spell.level !== 0 || !spell.scaling) return spell.damage;
        
        // Parse base damage dice (e.g., "1d10" -> num=1, sides=10)
        const match = spell.damage.match(/(\d+)d(\d+)/);
        if (!match) return spell.damage;
        
        let numDice = parseInt(match[1]);
        const sides = match[2];
        
        // Cantrip scaling: extra die at levels 5, 11, 17
        if (char.level >= 17) numDice = 4;
        else if (char.level >= 11) numDice = 3;
        else if (char.level >= 5) numDice = 2;
        
        return `${numDice}d${sides}`;
    }

    async handleDamageSpell(spellName, spell, monster, spellAttack, spellDC, spellMod) {
        // Get scaled damage for cantrips
        const spellDamage = this.getScaledSpellDamage(spell);
        const char = this.character;
        
        // Evocation: Empowered Evocation (level 14) - add INT mod to damage
        let evocationBonus = 0;
        if (char.subclass === 'Evocation' && char.subclassFeatures['Evocation_14'] && spell.school === 'Evocation') {
            evocationBonus = char.getModifier('int');
        }
        
        // Light Domain (14): Corona of Light - extra 1d8 radiant on damaging spells
        let lightBonus = 0;
        if (char.subclass === 'Light' && char.subclassFeatures['Light_14']) {
            lightBonus = this.dm.rollDice("1d8");
        }
        
        const subclassSpellBonus = evocationBonus + lightBonus;
        
        if (spell.autoHit) {
            // Magic Missile - auto hit (not a cantrip, uses spell.damage directly)
            const damage = this.dm.rollDice(spell.damage) + subclassSpellBonus;
            monster.hp -= damage;
            this.log(`🎯 ${spellName} automatically hits for ${damage} ${spell.damageType} damage!${evocationBonus ? ` (includes +${evocationBonus} Empowered Evocation)` : ''}${lightBonus ? ` (+${lightBonus} radiant Corona)` : ''}`, "combat");
        } else if (spell.save) {
            // Saving throw spell  
            const monsterSave = Math.floor(Math.random() * 20) + 1 + 2; // Monster has +2 save
            if (monsterSave >= spellDC) {
                const halfDamage = Math.floor(this.dm.rollDice(spellDamage) / 2);
                monster.hp -= halfDamage;
                this.log(`🎲 Enemy ${spell.save.toUpperCase()} save: ${monsterSave} vs DC ${spellDC} - Saved! Half damage: ${halfDamage}`, "combat");
            } else if (monster.legendaryResistancesRemaining > 0) {
                // Legendary Resistance: boss chooses to succeed instead
                monster.legendaryResistancesRemaining--;
                const halfDamage = Math.floor(this.dm.rollDice(spellDamage) / 2);
                monster.hp -= halfDamage;
                this.log(`🎲 Enemy ${spell.save.toUpperCase()} save: ${monsterSave} vs DC ${spellDC} - <strong>Failed!</strong>`, "danger");
                this.log(`⚡ <strong>${monster.name} uses Legendary Resistance!</strong> The save succeeds instead! Half damage: ${halfDamage}`, "danger");
                this.log(`💀 Legendary Resistances remaining: ${monster.legendaryResistancesRemaining}/${monster.legendaryResistances || '?'}`, "dm");
            } else {
                const damage = this.dm.rollDice(spellDamage) + subclassSpellBonus;
                monster.hp -= damage;
                this.log(`🎲 Enemy ${spell.save.toUpperCase()} save: ${monsterSave} vs DC ${spellDC} - Failed! ${damage} ${spell.damageType} damage!${evocationBonus ? ` (+${evocationBonus} Empowered)` : ''}`, "combat");
                
                // Necromancy: Grim Harvest - heal when you kill with a spell
                if (char.subclass === 'Necromancy' && monster.hp <= 0) {
                    const spellLevel = spell.level || 1;
                    const grimHeal = spell.school === 'Necromancy' ? spellLevel * 3 : spellLevel * 2;
                    char.heal(grimHeal);
                    this.log(`💀 Grim Harvest: You drain ${grimHeal} HP from the fallen creature! (${char.hp}/${char.maxHp})`, "success");
                }
            }
        } else {
            // Attack roll spell
            const attackResult = await this.dm.rollAttackAnimated(spellAttack, false, false);
            
            if (attackResult.isCrit) {
                const damage = this.dm.rollDice(spellDamage) + this.dm.rollDice(spellDamage) + subclassSpellBonus;
                monster.hp -= damage;
                this.log(`🎯 CRITICAL! Spell attack: ${attackResult.roll}+${spellAttack}=${attackResult.total} vs AC ${monster.ac}. ${damage} ${spell.damageType} damage!`, "success");
            } else if (attackResult.total >= monster.ac) {
                const damage = this.dm.rollDice(spellDamage) + subclassSpellBonus;
                monster.hp -= damage;
                this.log(`✨ Spell attack: ${attackResult.roll}+${spellAttack}=${attackResult.total} vs AC ${monster.ac}. ${damage} ${spell.damageType} damage!${evocationBonus ? ` (+${evocationBonus} Empowered)` : ''}`, "combat");
                
                // Guiding Bolt grants advantage on next attack
                if (spellName === "Guiding Bolt") {
                    this.character.buffs.guidingBolt = true;
                    this.log("✨ The target glows! Next attack has advantage!", "success");
                }
            } else {
                this.log(`❌ Spell attack: ${attackResult.roll}+${spellAttack}=${attackResult.total} vs AC ${monster.ac}. Miss!`, "danger");
            }
        }
    }
    
    handleHealingSpell(spellName, spell, spellMod) {
        const char = this.character;
        let healAmount = this.dm.rollDice(spell.healing) + spellMod;
        
        // Life Domain: Disciple of Life adds 2 + spell level to healing
        if (char.subclass === 'Life') {
            const spellLevel = spell.level || 1;
            const lifeBonus = 2 + spellLevel;
            healAmount += lifeBonus;
            this.log(`💛 Disciple of Life: +${lifeBonus} bonus healing!`, "success");
        }
        
        char.heal(healAmount);
        this.log(`💚 ${spellName} restores ${healAmount} HP! (Now at ${char.hp}/${char.maxHp})`, "success");
        
        // Life Domain (7): Blessed Healer - caster also heals
        if (char.subclass === 'Life' && char.subclassFeatures['Life_7']) {
            const selfHeal = 2 + (spell.level || 1);
            char.heal(selfHeal);
            this.log(`💛 Blessed Healer: You also regain ${selfHeal} HP! (${char.hp}/${char.maxHp})`, "success");
        }
    }
    
    handleDefensiveSpell(spellName, spell) {
        if (spellName === "Shield") {
            this.character.buffs.shieldActive = true;
            this.log("🛡️ A magical barrier appears! +5 AC until your next turn!", "success");
            
            // Abjuration: Arcane Ward recharges when casting abjuration spells
            if (this.character.subclass === 'Abjuration' && spell.school === 'Abjuration') {
                const recharge = (spell.level || 1) * 2;
                const maxWard = this.character.subclassFeatures.arcaneWardMaxHp || 0;
                if (maxWard > 0) {
                    this.character.subclassFeatures.arcaneWardHp = Math.min(
                        maxWard,
                        (this.character.subclassFeatures.arcaneWardHp || 0) + recharge
                    );
                    this.log(`🛡️ Arcane Ward recharges! Ward HP: ${this.character.subclassFeatures.arcaneWardHp}/${maxWard}`, "success");
                }
            }
        }
    }
    
    handleBuffSpell(spellName, spell) {
        if (spellName === "Bless") {
            this.character.buffs.blessActive = true;
            this.log("✨ Divine power flows through you! +1d4 to attacks and saves!", "success");
        } else if (spellName === "Hunter's Mark") {
            this.character.buffs.huntersMark = true;
            this.log("🎯 You mark your quarry! +1d6 damage to weapon attacks!", "success");
        }
    }
    
    handleUtilitySpell(spellName, spell) {
        if (spellName === "Misty Step") {
            this.log("💨 You vanish in a puff of mist and reappear safely!", "success");
            // Could add tactical advantage here
            this.character.buffs.guidingBolt = true; // Advantage from repositioning
        } else if (spellName === "Light") {
            this.log("💡 Light springs from your hand, illuminating the area!", "dm");
        } else if (spellName === "Mage Hand") {
            this.log("👋 A spectral hand appears, ready to help!", "dm");
        } else if (spellName === "Spare the Dying") {
            this.log("🙏 Divine energy stabilizes the dying!", "success");
        } else {
            this.log(`✨ You cast ${spellName}!`, "dm");
        }
    }
    
    // Drop concentration on a spell and remove its buff effects
    dropConcentration(char, reason) {
        if (!char.concentrating) return;
        const oldSpell = char.concentrating;
        char.concentrating = null;
        
        // Remove buff effects tied to concentration spells
        if (oldSpell === "Bless") {
            char.buffs.blessActive = false;
        } else if (oldSpell === "Hunter's Mark") {
            char.buffs.huntersMark = false;
        } else if (oldSpell === "Greater Invisibility") {
            // Remove invisibility advantage
        } else if (oldSpell === "Swift Quiver") {
            // Remove swift quiver bonus attacks
        }
        
        this.log(`💔 Concentration on ${oldSpell} ends${reason ? ` (${reason})` : ''}!`, "danger");
    }
    
    handleMonsterDeath(monster) {
        const char = this.character;
        const diffSettings = DIFFICULTY_SETTINGS[this.difficulty];
        
        // Apply difficulty modifiers
        const xpGained = Math.floor(monster.xp * diffSettings.xpMod);
        
        soundManager.playDeath(); // Enemy death sound
        this.log(`🎉 Victory! The ${monster.name} is defeated!`, "success");
        char.experience += xpGained;
        this.stats.xpThisRound = xpGained; // Track XP for toast display
        this.log(`You gain ${xpGained} XP! (Total: ${char.experience})`, "loot");
        
        // Track statistics for achievements
        this.stats.enemiesKilled++;
        
        // Check if this was a boss
        if (monster.isBoss) {
            this.stats.bossesKilled++;
            soundManager.playLevelUp(); // Special sound for boss kills
        }
        
        // Check for dragon kills
        if (monster.name.toLowerCase().includes('dragon')) {
            this.stats.dragonsKilled++;
        }
        
        // Check for close call victory (less than 5 HP)
        if (char.hp < 5 && char.hp > 0) {
            this.stats.closeCallWins++;
        }
        
        // Check for flawless victory (no damage taken this combat)
        if (this.stats.damageThisCombat === 0) {
            this.stats.flawlessVictories++;
        }
        
        // Check achievements
        this.checkAchievements();
        
        // Advance time slightly for combat
        this.dm.advanceTime(0.5);
        
        // Roll for material drops (crafting system)
        this.rollMaterialDrop(monster);
        
        // Chance to discover a recipe from boss
        if (monster.isBoss && Math.random() < 0.5) {
            this.discoverRandomRecipe();
        }
        
        // Reputation gain for killing monsters
        this.adjustReputationForKill(monster);
        
        // Track kills based on campaign
        if (this.dm.campaignId === "nights_dark_terror") {
            if (monster.name.toLowerCase().includes("goblin")) {
                this.dm.questFlags.goblinsKilled++;
                // Show progress during the siege (Chapter 1)
                if (this.dm.currentChapter === 1 && !this.dm.questFlags.survivedSiege) {
                    const kills = this.dm.questFlags.goblinsKilled;
                    const needed = 5;
                    if (kills < needed) {
                        this.log(`📊 Siege Progress: ${kills}/${needed} goblins defeated`, "dm");
                    }
                }
            }
        } else if (this.dm.campaignId === "keep_on_borderlands") {
            const monsterNameLower = monster.name.toLowerCase();
            if (monsterNameLower.includes("kobold") || monsterNameLower.includes("goblin") || monsterNameLower.includes("orc")) {
                if (!this.dm.questFlags.outerMonstersKilled) this.dm.questFlags.outerMonstersKilled = 0;
                this.dm.questFlags.outerMonstersKilled++;
            }
            if (monsterNameLower.includes("bugbear") || monsterNameLower.includes("gnoll") || monsterNameLower.includes("hobgoblin")) {
                if (!this.dm.questFlags.innerMonstersKilled) this.dm.questFlags.innerMonstersKilled = 0;
                this.dm.questFlags.innerMonstersKilled++;
            }
        } else if (this.dm.campaignId === "curse_of_strahd") {
            const undeadNames = ["zombie", "ghoul", "wight", "specter", "vampire", "skeleton"];
            if (undeadNames.some(name => monster.name.toLowerCase().includes(name))) {
                this.dm.questFlags.undeadKilled++;
            }
        } else if (this.dm.campaignId === "tomb_of_annihilation") {
            const dinosaurNames = ["raptor", "allosaurus", "tyrannosaurus", "pterafolk"];
            const undeadNames = ["zombie", "ghoul", "wight", "skeleton", "bodak"];
            if (dinosaurNames.some(name => monster.name.toLowerCase().includes(name))) {
                this.dm.questFlags.dinosaursSlain++;
            }
            if (undeadNames.some(name => monster.name.toLowerCase().includes(name))) {
                this.dm.questFlags.undeadSlain++;
            }
        } else if (this.dm.campaignId === "lost_mine_of_phandelver") {
            if (monster.name.toLowerCase().includes("goblin") || monster.name.toLowerCase().includes("hobgoblin") || monster.name.toLowerCase().includes("bugbear")) {
                this.dm.questFlags.goblinsKilled++;
            }
            if (monster.name.toLowerCase().includes("redbrand") || monster.name.toLowerCase().includes("ruffian")) {
                this.dm.questFlags.redbrandsDefeated++;
                if (this.dm.currentChapter === 3 && !this.dm.questFlags.clearedRedbrands) {
                    const kills = this.dm.questFlags.redbrandsDefeated;
                    const needed = 4;
                    if (kills < needed) {
                        this.log(`📊 Redbrand Hideout Progress: ${kills}/${needed} Redbrands defeated`, "dm");
                    }
                    if (kills >= needed) {
                        setTimeout(() => this.triggerStoryEvent("redbrandsCleared"), 500);
                    }
                }
            }
        }
        
        // Check for boss defeat
        this.checkBossDefeat(monster);
        
        // Fire any combat-gated story event
        if (this.dm.pendingStoryEvent) {
            const pendingEvent = this.dm.pendingStoryEvent;
            this.dm.pendingStoryEvent = null;
            setTimeout(() => this.triggerStoryEvent(pendingEvent), 600);
        }
        
        // Level up check
        if (char.experience >= char.level * 300) {
            this.levelUp();
        }
        
        // Loot
        this.rollEnemyLoot(monster);
        this.endCombat(true);
    }
    
    // Recipe discovery system
    discoverRandomRecipe() {
        const undiscovered = Object.keys(DISCOVERABLE_RECIPES).filter(r => !this.discoveredRecipes.has(r));
        if (undiscovered.length === 0) return;
        
        const recipe = undiscovered[Math.floor(Math.random() * undiscovered.length)];
        this.discoveredRecipes.add(recipe);
        this.saveSettings();
        
        const recipeData = DISCOVERABLE_RECIPES[recipe];
        this.log(`📜 <strong>RECIPE DISCOVERED:</strong> ${recipe}!`, 'loot');
        this.log(`Ingredients: ${recipeData.ingredients.join(', ')}`, 'dm');
        soundManager.playAchievement();
    }

    rollMaterialDrop(monster) {
        // 40% chance to get materials
        if (Math.random() > 0.4) return;
        
        // Determine monster type for material table
        const name = monster.name.toLowerCase();
        let type = "default";
        
        if (name.includes("wolf") || name.includes("bear") || name.includes("spider") || name.includes("rat") || name.includes("dinosaur") || name.includes("raptor")) {
            type = "beast";
        } else if (name.includes("zombie") || name.includes("skeleton") || name.includes("ghoul") || name.includes("wight") || name.includes("vampire")) {
            type = "undead";
        } else if (name.includes("goblin") || name.includes("orc") || name.includes("bandit") || name.includes("cultist")) {
            type = "goblinoid";
        } else if (name.includes("dragon")) {
            type = "dragon";
        } else if (name.includes("demon") || name.includes("devil")) {
            type = "fiend";
        } else if (name.includes("blight") || name.includes("shambling")) {
            type = "plant";
        }
        
        const materials = MATERIAL_DROPS[type] || MATERIAL_DROPS["default"];
        const material = materials[Math.floor(Math.random() * materials.length)];
        
        this.character.addMaterial(material, 1);
        this.log(`📦 You salvage: ${material}`, "loot");
    }
    
    adjustReputationForKill(monster) {
        const name = monster.name.toLowerCase();
        
        // Killing bandits/goblins helps with common folk
        if (name.includes("goblin") || name.includes("bandit") || name.includes("orc")) {
            this.character.adjustReputation("commoners", 1);
            this.character.adjustReputation("military", 1);
        }
        
        // Killing undead helps with church
        if (name.includes("zombie") || name.includes("skeleton") || name.includes("vampire") || name.includes("ghoul")) {
            this.character.adjustReputation("church", 2);
        }
    }
    
    checkBossDefeat(monster) {
        if (monster.boss) {
            if (this.dm.campaignId === "nights_dark_terror") {
                if (monster.name === "King Xitaqa") {
                    setTimeout(() => this.triggerStoryEvent("defeatXitaqa"), 500);
                } else if (monster.name === "Golthar the Wizard") {
                    setTimeout(() => this.triggerStoryEvent("defeatGolthar"), 500);
                }
            } else if (this.dm.campaignId === "curse_of_strahd") {
                if (monster.name === "Strahd von Zarovich") {
                    setTimeout(() => this.triggerStoryEvent("defeatStrahd"), 500);
                }
            } else if (this.dm.campaignId === "tomb_of_annihilation") {
                if (monster.name === "Ras Nsi") {
                    setTimeout(() => this.triggerStoryEvent("defeatRasNsi"), 500);
                } else if (monster.name === "Atropal") {
                    setTimeout(() => this.triggerStoryEvent("defeatAtropal"), 500);
                } else if (monster.name === "Acererak") {
                    setTimeout(() => this.triggerStoryEvent("defeatAcererak"), 500);
                }
            } else if (this.dm.campaignId === "keep_on_borderlands") {
                if (monster.name === "Minotaur") {
                    setTimeout(() => this.triggerStoryEvent("defeatedMinotaur"), 500);
                } else if (monster.name === "High Priest of Chaos") {
                    setTimeout(() => this.triggerStoryEvent("defeatedHighPriest"), 500);
                }
            } else if (this.dm.campaignId === "lost_mine_of_phandelver") {
                if (monster.name === "Glasstaff") {
                    setTimeout(() => this.triggerStoryEvent("defeatGlassstaff"), 500);
                } else if (monster.name === "King Grol") {
                    setTimeout(() => this.triggerStoryEvent("defeatKingGrol"), 500);
                } else if (monster.name === "Nezznar the Black Spider") {
                    setTimeout(() => this.triggerStoryEvent("defeatBlackSpider"), 500);
                } else if (monster.name === "Flameskull") {
                    setTimeout(() => this.triggerStoryEvent("defeatFlameskull"), 500);
                }
            }
        }
        
        // Track Keep on the Borderlands cave kills (ALL monsters, not just bosses)
        if (this.dm.campaignId === "keep_on_borderlands") {
            const monsterNameLower = monster.name.toLowerCase();
            // Initialize flags if missing (for saves from before this feature)
            if (this.dm.questFlags.outerCavesKills === undefined) this.dm.questFlags.outerCavesKills = 0;
            if (this.dm.questFlags.innerCavesKills === undefined) this.dm.questFlags.innerCavesKills = 0;
            if (this.dm.questFlags.outerCavesCleared === undefined) this.dm.questFlags.outerCavesCleared = false;
            if (this.dm.questFlags.innerCavesCleared === undefined) this.dm.questFlags.innerCavesCleared = false;
            
            // Track outer caves kills (Chapter 3) - ANY monster counts
            if (this.dm.currentChapter === 3 && !this.dm.questFlags.outerCavesCleared) {
                this.dm.questFlags.outerCavesKills++;
                const kills = this.dm.questFlags.outerCavesKills;
                const needed = 10;
                if (kills < needed) {
                    this.log(`📊 Outer Caves Progress: ${kills}/${needed} monsters cleared`, "dm");
                }
                if (kills >= needed) {
                    setTimeout(() => this.triggerStoryEvent("outerCavesCleared"), 500);
                }
                this.updateChapterDisplay();
            }
            // Track inner caves kills (Chapter 4) - ANY monster counts
            if (this.dm.currentChapter === 4 && !this.dm.questFlags.innerCavesCleared) {
                this.dm.questFlags.innerCavesKills++;
                const kills = this.dm.questFlags.innerCavesKills;
                const needed = 8;
                if (kills < needed) {
                    this.log(`📊 Inner Caves Progress: ${kills}/${needed} monsters cleared`, "dm");
                }
                if (kills >= needed) {
                    setTimeout(() => this.triggerStoryEvent("innerCavesCleared"), 500);
                }
                this.updateChapterDisplay();
            }
        }
        
        // Campaign-specific victory checks
        if (this.dm.campaignId === "nights_dark_terror") {
            if (this.dm.currentChapter === 1 && this.dm.questFlags.goblinsKilled >= 5 && !this.dm.questFlags.survivedSiege) {
                setTimeout(() => this.triggerStoryEvent("siegeVictory"), 500);
            }
        }
    }
    
    showPostCombatSummary() {
        const char = this.character;
        
        // Calculate rewards
        const xpGained = this.stats.xpThisRound || 0;
        const goldGained = this.stats.goldThisRound || 0;
        const lootItems = this.character.inventory.filter(item => item.justLooted);
        
        // Build summary line
        const summaryParts = [];
        summaryParts.push(`<strong style="color: #2ecc71;">+${xpGained}</strong> XP`);
        if (goldGained > 0) {
            summaryParts.push(`<strong style="color: #f1c40f;">${goldGained}</strong>g`);
        }
        if (lootItems.length > 0) {
            summaryParts.push(`<strong style="color: #c9a227;">${lootItems.length}</strong> item${lootItems.length !== 1 ? 's' : ''}`);
        }
        
        // Create toast if it doesn't exist
        let toast = document.getElementById("combatToast");
        if (!toast) {
            toast = document.createElement("div");
            toast.id = "combatToast";
            toast.className = "combat-toast";
            document.body.appendChild(toast);
        }
        
        // Build expanded content
        const location = this.dm.currentLocation;
        const chapter = this.dm.campaign.chapters[this.dm.currentChapter];
        const healthPercent = Math.round((char.hp / char.maxHp) * 100);
        
        let healthStatus = "";
        if (healthPercent >= 75) healthStatus = "🟢 Good condition";
        else if (healthPercent >= 50) healthStatus = "🟡 Lightly wounded";
        else if (healthPercent >= 25) healthStatus = "🟠 Moderately wounded";
        else healthStatus = "🔴 Critically wounded";
        
        // Build loot list
        let lootHtml = lootItems.length > 0 
            ? lootItems.map(item => `<div style="color: #c9a227; margin: 5px 0;">• ${item.name}${item.rarity ? ` <span style="color: #888;">(${item.rarity})</span>` : ''}</div>`).join('')
            : '<div style="color: #888;">No loot this time</div>';
        
        // Set toast HTML
        toast.innerHTML = `
            <div class="combat-toast-header">
                <div class="combat-toast-title">⚔️ Victory!</div>
                <button class="combat-toast-close" onclick="game.closeCombatToast()">✕</button>
            </div>
            
            <div class="combat-toast-summary">
                <div class="toast-summary-line">
                    ${summaryParts.join(' | ')}
                </div>
                <div class="toast-hint">Click to see more details</div>
            </div>
            
            <div class="combat-toast-detail">
                <div class="toast-detail-section">
                    <div class="toast-detail-title">📍 Location</div>
                    <div class="toast-detail-content">${location.icon} ${location.name}</div>
                </div>
                
                <div class="toast-detail-section">
                    <div class="toast-detail-title">❤️ Status</div>
                    <div class="toast-detail-content">${healthStatus} (${char.hp}/${char.maxHp} HP)</div>
                </div>
                
                <div class="toast-detail-section">
                    <div class="toast-detail-title">💰 Rewards</div>
                    <div class="toast-detail-content">
                        <div style="margin: 5px 0;">XP Gained: <strong style="color: #2ecc71;">+${xpGained}</strong></div>
                        <div style="margin: 5px 0;">Gold Gained: <strong style="color: #f1c40f;">+${goldGained}g</strong></div>
                    </div>
                </div>
                
                <div class="toast-detail-section">
                    <div class="toast-detail-title">🎒 Loot</div>
                    <div class="toast-detail-content">${lootHtml}</div>
                </div>
                
                <div class="toast-detail-section">
                    <div class="toast-detail-title">🎯 Objective</div>
                    <div class="toast-detail-content">${chapter ? chapter.objective : 'Continue your adventure'}</div>
                </div>
            </div>
        `;
        
        // Show toast with animation
        toast.classList.remove("expanded");
        toast.classList.add("show");
        
        // Make it clickable to expand
        toast.onclick = (e) => {
            if (e.target.closest('.combat-toast-close')) return;
            toast.classList.toggle("expanded");
        };
        
        // Auto-dismiss after 5 seconds if not expanded
        this.combatToastTimer = setTimeout(() => {
            if (!toast.classList.contains("expanded")) {
                this.closeCombatToast();
            }
        }, 5000);
        
        // Clear looted flag
        lootItems.forEach(item => item.justLooted = false);
    }
    
    closeCombatToast() {
        const toast = document.getElementById("combatToast");
        if (toast) {
            clearTimeout(this.combatToastTimer);
            toast.classList.remove("show");
            setTimeout(() => {
                toast.classList.remove("expanded");
            }, 400);
        }
        // Reset combat round rewards
        this.stats.xpThisRound = 0;
        this.stats.goldThisRound = 0;
    }
    
    closePostCombatSummary() {
        this.closeCombatToast();
    }
    
    updateMiniMap() {
        // Create mini-map container if it doesn't exist
        let mapContainer = document.getElementById("miniMapContainer");
        if (!mapContainer) {
            mapContainer = document.createElement("div");
            mapContainer.id = "miniMapContainer";
            mapContainer.className = "mini-map-container";
            mapContainer.innerHTML = `
                <div class="mini-map-header">
                    <h4>🗺️ Map</h4>
                    <button class="map-toggle-btn" onclick="game.toggleMapExpand()">⊞</button>
                </div>
                <div id="miniMapContent" class="mini-map-content"></div>
            `;
            
            // Insert after location info
            const locationPanel = document.getElementById("locationType")?.parentElement;
            if (locationPanel) {
                locationPanel.parentElement.insertBefore(mapContainer, locationPanel.nextSibling);
            }
        }
        
        const mapContent = document.getElementById("miniMapContent");
        const availableLocations = this.getAvailableLocations();
        const currentLoc = this.dm.currentLocation;
        const currentChapter = this.dm.currentChapter;
        
        // Group locations by chapter
        const locationsByChapter = {};
        availableLocations.forEach(loc => {
            if (!locationsByChapter[loc.chapter]) {
                locationsByChapter[loc.chapter] = [];
            }
            locationsByChapter[loc.chapter].push(loc);
        });
        
        let mapHtml = '';
        
        // Render each chapter's locations
        Object.keys(locationsByChapter).sort((a, b) => a - b).forEach(chapter => {
            const chapterNum = parseInt(chapter);
            const chapterInfo = this.dm.campaign.chapters[chapterNum];
            const isCurrentChapter = chapterNum === currentChapter;
            const isPastChapter = chapterNum < currentChapter;
            
            mapHtml += `<div class="map-chapter ${isCurrentChapter ? 'current-chapter' : ''} ${isPastChapter ? 'past-chapter' : ''}">`;
            mapHtml += `<div class="map-chapter-title">${chapterInfo ? chapterInfo.name.split(':')[0] : 'Chapter ' + chapter}</div>`;
            mapHtml += `<div class="map-locations">`;
            
            locationsByChapter[chapter].forEach(loc => {
                const isCurrent = loc.name === currentLoc.name;
                const dangerClass = loc.danger === 0 ? 'safe' : loc.danger <= 2 ? 'moderate' : 'dangerous';
                const typeClass = loc.type;
                const originalIndex = this.dm.campaign.locations.indexOf(loc);
                
                mapHtml += `
                    <div class="map-location ${isCurrent ? 'current' : ''} ${dangerClass} ${typeClass}" 
                         onclick="game.quickTravel(${originalIndex})"
                         title="${loc.description || loc.name}">
                        <span class="loc-icon">${loc.icon}</span>
                        <span class="loc-name">${loc.name}</span>
                        ${isCurrent ? '<span class="you-marker">📍</span>' : ''}
                    </div>
                `;
            });
            
            mapHtml += `</div></div>`;
        });
        
        // Add objective reminder at bottom
        const chapter = this.dm.campaign.chapters[currentChapter];
        if (chapter) {
            mapHtml += `<div class="map-objective">🎯 ${chapter.objective}</div>`;
        }
        
        mapContent.innerHTML = mapHtml;
    }
    
    quickTravel(locationIndex) {
        if (this.dm.inCombat) {
            this.log("You can't travel during combat!", "danger");
            return;
        }
        
        const newLocation = this.dm.campaign.locations[locationIndex];
        if (newLocation.name === this.dm.currentLocation.name) {
            return; // Already here
        }
        
        // Check if location is available
        const availableLocations = this.getAvailableLocations();
        if (!availableLocations.includes(newLocation)) {
            this.log("You can't travel there yet.", "danger");
            return;
        }
        
        this.travel(locationIndex);
    }
    
    toggleMapExpand() {
        const mapContainer = document.getElementById("miniMapContainer");
        const btn = mapContainer.querySelector(".map-toggle-btn");
        
        if (mapContainer.classList.contains("expanded")) {
            mapContainer.classList.remove("expanded");
            btn.textContent = "⊞";
        } else {
            mapContainer.classList.add("expanded");
            btn.textContent = "⊟";
        }
    }
    
    getItemInfo(itemName) {
        const campaignId = this.dm ? this.dm.campaignId : null;
        const campaignItems = campaignId ? GAME_DATA.campaignItems[campaignId] : null;
        
        // Check standard weapons
        if (GAME_DATA.weapons[itemName]) {
            const w = GAME_DATA.weapons[itemName];
            return {
                name: itemName,
                type: "Weapon",
                category: w.type.charAt(0).toUpperCase() + w.type.slice(1),
                damage: w.damage + " " + w.type,
                properties: w.properties.length > 0 ? w.properties.join(", ") : "None",
                stat: w.stat.toUpperCase(),
                range: w.range ? w.range + " ft" : "Melee",
                versatile: w.versatileDamage ? w.versatileDamage + " (two-handed)" : null,
                description: w.description || this.getGenericWeaponDescription(itemName, w)
            };
        }
        
        // Check campaign weapons
        if (campaignItems && campaignItems.weapons && campaignItems.weapons[itemName]) {
            const w = campaignItems.weapons[itemName];
            return {
                name: itemName,
                type: "Weapon",
                category: w.type.charAt(0).toUpperCase() + w.type.slice(1) + " (⭐ Campaign)",
                damage: w.damage + " " + w.type,
                properties: w.properties.length > 0 ? w.properties.join(", ") : "None",
                stat: w.stat.toUpperCase(),
                range: w.range ? w.range + " ft" : "Melee",
                versatile: w.versatileDamage ? w.versatileDamage + " (two-handed)" : null,
                description: w.description
            };
        }
        
        // Check standard armor
        if (GAME_DATA.armor[itemName]) {
            const a = GAME_DATA.armor[itemName];
            return {
                name: itemName,
                type: "Armor",
                category: a.type.charAt(0).toUpperCase() + a.type.slice(1) + " Armor",
                ac: "AC " + a.ac + (a.maxDex > 0 && a.maxDex < 99 ? " + DEX (max " + a.maxDex + ")" : a.maxDex === 99 ? " + DEX" : ""),
                stealth: a.stealthDisadvantage ? "Disadvantage on Stealth" : "No stealth penalty",
                description: a.description || this.getGenericArmorDescription(itemName, a)
            };
        }
        
        // Check campaign armor
        if (campaignItems && campaignItems.armor && campaignItems.armor[itemName]) {
            const a = campaignItems.armor[itemName];
            return {
                name: itemName,
                type: "Armor",
                category: a.type.charAt(0).toUpperCase() + a.type.slice(1) + " Armor (⭐ Campaign)",
                ac: "AC " + a.ac + (a.maxDex > 0 && a.maxDex < 99 ? " + DEX (max " + a.maxDex + ")" : a.maxDex === 99 ? " + DEX" : ""),
                stealth: a.stealthDisadvantage ? "Disadvantage on Stealth" : "No stealth penalty",
                description: a.description
            };
        }
        
        // Check standard shields
        if (GAME_DATA.shields[itemName]) {
            const s = GAME_DATA.shields[itemName];
            return {
                name: itemName,
                type: "Shield",
                category: "Shield",
                ac: "+" + s.acBonus + " AC",
                stealth: s.stealthDisadvantage ? "Disadvantage on Stealth" : "No stealth penalty",
                description: s.description || "A standard shield providing protection in combat."
            };
        }
        
        // Check campaign shields
        if (campaignItems && campaignItems.shields && campaignItems.shields[itemName]) {
            const s = campaignItems.shields[itemName];
            return {
                name: itemName,
                type: "Shield",
                category: "Shield (⭐ Campaign)",
                ac: "+" + s.acBonus + " AC",
                stealth: s.stealthDisadvantage ? "Disadvantage on Stealth" : "No stealth penalty",
                description: s.description
            };
        }
        
        // Check campaign consumables
        if (campaignItems && campaignItems.consumables && campaignItems.consumables[itemName]) {
            const c = campaignItems.consumables[itemName];
            return {
                name: itemName,
                type: "Consumable",
                category: "Consumable (⭐ Campaign)",
                effect: this.getEffectDescription(c.effect, c.healAmount),
                description: c.description
            };
        }
        
        // Check standard consumables/items
        return this.getGenericItemInfo(itemName);
    }
    
    getEffectDescription(effect, healAmount) {
        const effects = {
            "heal": healAmount ? `Restores ${healAmount} HP` : "Restores health",
            "courage": "Grants advantage on fear saves",
            "wolfsbane": "Protects against lycanthropy",
            "damage_undead": "Deals 2d6 radiant damage to undead",
            "vampire_ward": "Vampires have disadvantage on attacks",
            "cure_poison": "Cures poison effects",
            "insect_ward": "Repels insects for 8 hours"
        };
        return effects[effect] || "Special effect";
    }
    
    getGenericWeaponDescription(name, weapon) {
        const descriptions = {
            "Longsword": "A versatile blade favored by knights and warriors. Can be wielded with one or two hands.",
            "Shortsword": "A light, quick blade ideal for swift strikes and dual-wielding.",
            "Greatsword": "A massive two-handed blade that deals devastating damage.",
            "Greataxe": "A heavy two-handed axe capable of cleaving through armor.",
            "Battleaxe": "A versatile axe that can be swung with one or two hands.",
            "Handaxes": "Light throwing axes, useful for ranged attacks or dual-wielding.",
            "Rapier": "An elegant thrusting weapon favored by duelists.",
            "Scimitar": "A curved blade designed for quick, slashing attacks.",
            "Dagger": "A small blade useful for close combat or throwing.",
            "Mace": "A simple bludgeoning weapon effective against armored foes.",
            "Warhammer": "A versatile crushing weapon that can be wielded in one or two hands.",
            "Quarterstaff": "A simple wooden staff that can be wielded defensively or offensively.",
            "Longbow": "A powerful ranged weapon with excellent range.",
            "Shortbow": "A compact bow suitable for mounted combat or skirmishing.",
            "Light Crossbow": "A mechanical ranged weapon that's easy to use but slow to reload.",
            "Hand Crossbow": "A small crossbow that can be wielded in one hand.",
            "Javelin": "A throwing spear useful at medium range.",
            "Spear": "A versatile polearm that can be thrown or used in melee.",
            "Flail": "A spiked ball on a chain, difficult to block.",
            "Morningstar": "A spiked mace that deals piercing damage.",
            "Glaive": "A polearm with a curved blade, offering reach advantage.",
            "Halberd": "A versatile polearm combining axe and spear."
        };
        return descriptions[name] || `A ${weapon.type} weapon dealing ${weapon.damage} damage.`;
    }
    
    getGenericArmorDescription(name, armor) {
        const descriptions = {
            "Robes": "Simple cloth garments offering no protection but full mobility.",
            "Padded Armor": "Quilted layers of cloth and batting. Noisy but better than nothing.",
            "Leather Armor": "Boiled leather shaped into a protective breastplate and guards.",
            "Studded Leather": "Leather armor reinforced with metal rivets for added protection.",
            "Hide Armor": "Crude armor made from thick animal hides.",
            "Chain Shirt": "A shirt of interlocking metal rings worn under clothing.",
            "Scale Mail": "Armor made of overlapping metal scales, like a fish.",
            "Breastplate": "A fitted metal chest piece that allows good mobility.",
            "Half Plate": "Plate armor covering vital areas while allowing movement.",
            "Ring Mail": "Leather armor with heavy rings sewn into it.",
            "Chain Mail": "Full armor made of interlocking metal rings.",
            "Splint Armor": "Metal strips riveted to a leather backing.",
            "Plate Armor": "Full plate armor offering maximum protection."
        };
        return descriptions[name] || `${armor.type} armor providing AC ${armor.ac}.`;
    }
    
    getGenericItemInfo(itemName) {
        const genericItems = {
            "Healing Potion": {
                type: "Consumable",
                category: "Potion",
                effect: "Restores 2d4+2 HP",
                description: "A red liquid that shimmers when agitated. Drinking it restores hit points."
            },
            "Greater Healing Potion": {
                type: "Consumable",
                category: "Potion",
                effect: "Restores 4d4+4 HP",
                description: "A more potent healing potion that glows with a deep crimson light."
            },
            "Antidote": {
                type: "Consumable",
                category: "Potion",
                effect: "Cures poison",
                description: "A bitter green liquid that neutralizes most poisons."
            },
            "Torch": {
                type: "Equipment",
                category: "Light Source",
                effect: "Provides light for 1 hour",
                description: "A wooden rod wrapped in oil-soaked cloth. Burns brightly for about an hour."
            },
            "Rope (50 ft)": {
                type: "Equipment",
                category: "Adventuring Gear",
                effect: "Utility item",
                description: "Hemp rope, useful for climbing, binding, or countless other purposes."
            },
            "Rations (1 day)": {
                type: "Consumable",
                category: "Food",
                effect: "Restores 1d4 HP when resting",
                description: "Dried meat, hardtack, and dried fruit. Enough to sustain one person for a day."
            }
        };
        
        if (genericItems[itemName]) {
            return { name: itemName, ...genericItems[itemName] };
        }
        
        // Unknown item - provide basic info
        return {
            name: itemName,
            type: "Item",
            category: "Miscellaneous",
            description: "An item of unknown origin. It may have special uses."
        };
    }
    
    showItemInfo(itemName) {
        const info = this.getItemInfo(itemName);
        
        // Create modal if it doesn't exist
        let modal = document.getElementById("itemInfoModal");
        if (!modal) {
            modal = document.createElement("div");
            modal.id = "itemInfoModal";
            modal.className = "modal";
            modal.innerHTML = `
                <div class="modal-content item-info-modal-content">
                    <h2 id="itemInfoTitle"></h2>
                    <div id="itemInfoContent"></div>
                    <button class="close-btn" onclick="game.closeItemInfo()">Close</button>
                </div>
            `;
            document.body.appendChild(modal);
        }
        
        // Build content based on item type
        let content = `<div class="item-info-category">${info.category || info.type}</div>`;
        
        if (info.type === "Weapon") {
            content += `
                <div class="item-info-stats">
                    <div class="stat-row"><span class="stat-label">⚔️ Damage:</span> <span>${info.damage}</span></div>
                    <div class="stat-row"><span class="stat-label">🎯 Range:</span> <span>${info.range}</span></div>
                    <div class="stat-row"><span class="stat-label">💪 Ability:</span> <span>${info.stat}</span></div>
                    <div class="stat-row"><span class="stat-label">✨ Properties:</span> <span>${info.properties}</span></div>
                    ${info.versatile ? `<div class="stat-row"><span class="stat-label">🔄 Versatile:</span> <span>${info.versatile}</span></div>` : ''}
                </div>
            `;
        } else if (info.type === "Armor") {
            content += `
                <div class="item-info-stats">
                    <div class="stat-row"><span class="stat-label">🛡️ AC:</span> <span>${info.ac}</span></div>
                    <div class="stat-row"><span class="stat-label">🥾 Stealth:</span> <span>${info.stealth}</span></div>
                </div>
            `;
        } else if (info.type === "Shield") {
            content += `
                <div class="item-info-stats">
                    <div class="stat-row"><span class="stat-label">🛡️ AC Bonus:</span> <span>${info.ac}</span></div>
                    <div class="stat-row"><span class="stat-label">🥾 Stealth:</span> <span>${info.stealth}</span></div>
                </div>
            `;
        } else if (info.type === "Consumable") {
            content += `
                <div class="item-info-stats">
                    <div class="stat-row"><span class="stat-label">✨ Effect:</span> <span>${info.effect}</span></div>
                </div>
            `;
        } else if (info.effect) {
            content += `
                <div class="item-info-stats">
                    <div class="stat-row"><span class="stat-label">✨ Effect:</span> <span>${info.effect}</span></div>
                </div>
            `;
        }
        
        content += `<div class="item-info-description">${info.description}</div>`;
        
        // Show value if in shop prices
        const price = GAME_DATA.shopPrices[itemName];
        if (price !== undefined && price > 0) {
            content += `<div class="item-info-value">💰 Value: ${price} gold</div>`;
        }
        
        document.getElementById("itemInfoTitle").textContent = info.name;
        document.getElementById("itemInfoContent").innerHTML = content;
        modal.classList.add("active");
    }
    
    closeItemInfo() {
        const modal = document.getElementById("itemInfoModal");
        if (modal) {
            modal.classList.remove("active");
        }
    }

    levelUp() {
        const char = this.character;
        char.level++;
        const hitDie = GAME_DATA.classes[char.charClass].hitDie;
        const hpGain = Math.max(1, Math.floor(Math.random() * hitDie) + 1 + char.getModifier("con"));
        char.maxHp += hpGain;
        char.hp = char.maxHp;
        
        // Increase hit dice
        char.hitDice.max = char.level;
        char.hitDice.current = char.level;
        
        soundManager.playLevelUp();
        this.log(`🎊 LEVEL UP! You are now level ${char.level}!`, "success");
        this.log(`HP increased by ${hpGain}! (New max: ${char.maxHp})`, "success");
        
        // Subclass selection at level 3
        if (char.level === 3 && !char.subclass && SUBCLASS_DATA[char.charClass]) {
            this.showSubclassSelection();
        }
        
        // Apply subclass features gained at this level
        if (char.subclass && SUBCLASS_DATA[char.charClass]) {
            const subclassInfo = SUBCLASS_DATA[char.charClass].options[char.subclass];
            if (subclassInfo && subclassInfo.features[char.level]) {
                const feature = subclassInfo.features[char.level];
                this.log(`🌟 <strong>${subclassInfo.name} Feature:</strong> ${feature.name}!`, "success");
                this.log(`📜 ${feature.description}`, "dm");
                
                // Apply feature-specific effects
                this.applySubclassFeature(char, char.subclass, char.level, feature);
            }
        }
        
        // Show proficiency bonus if it increased
        const profBonus = char.getProficiencyBonus();
        const prevProfBonus = Math.floor((char.level - 2) / 4) + 2;
        if (profBonus > prevProfBonus) {
            this.log(`📈 Proficiency Bonus increased to +${profBonus}!`, "success");
        }
        
        // Extra Attack at level 5 for martial classes
        if (char.level === 5) {
            if (char.charClass === "Fighter" || char.charClass === "Barbarian" || char.charClass === "Ranger" || char.charClass === "Paladin" || char.charClass === "Monk") {
                char.extraAttack = true;
                this.log(`⚔️ Extra Attack! You can now attack twice per turn!`, "success");
            }
        }
        
        // Fighter Extra Attack (2) at level 11
        if (char.level === 11 && char.charClass === "Fighter") {
            this.log(`⚔️ Extra Attack (2)! You can now attack THREE times per turn!`, "success");
        }
        
        // Fighter Extra Attack (3) at level 20
        if (char.level === 20 && char.charClass === "Fighter") {
            this.log(`⚔️ Extra Attack (3)! You can now attack FOUR times per turn!`, "success");
        }
        
        // Barbarian Rage progression
        if (char.charClass === "Barbarian") {
            // Rages per long rest by level
            const ragesPerLevel = { 1: 2, 2: 2, 3: 3, 4: 3, 5: 3, 6: 4, 7: 4, 8: 4, 9: 4, 10: 4, 11: 4, 12: 5, 13: 5, 14: 5, 15: 5, 16: 5, 17: 6, 18: 6, 19: 6, 20: 99 };
            char.ragesRemaining = ragesPerLevel[char.level] || 2;
            if (char.level === 1 || char.level === 3 || char.level === 6 || char.level === 12 || char.level === 17 || char.level === 20) {
                this.log(`💢 Rages per long rest: ${char.ragesRemaining === 99 ? 'Unlimited' : char.ragesRemaining}`, "success");
            }
            if (char.level === 9) {
                this.log(`💢 Rage damage bonus increased to +3!`, "success");
            }
            if (char.level === 16) {
                this.log(`💢 Rage damage bonus increased to +4!`, "success");
            }
        }
        
        // Rogue Sneak Attack progression
        if (char.charClass === "Rogue" && char.level % 2 === 1) {
            const sneakDice = char.getSneakAttackDice();
            this.log(`🗡️ Sneak Attack increased to ${sneakDice}d6!`, "success");
        }
        
        // Monk Ki progression
        if (char.charClass === "Monk" && char.level >= 2) {
            char.kiMax = char.level;
            char.kiPoints = char.kiMax;
            // Martial arts die scaling
            if (char.level >= 17) char.martialArtsDie = "1d10";
            else if (char.level >= 11) char.martialArtsDie = "1d8";
            else if (char.level >= 5) char.martialArtsDie = "1d6";
            else char.martialArtsDie = "1d4";
            if (char.level === 2) this.log(`🥋 Ki Points unlocked! You have ${char.kiMax} ki points.`, "success");
        }
        
        // Paladin progression  
        if (char.charClass === "Paladin") {
            char.layOnHandsPool = char.level * 5;
            char.divineSenseUses = 1 + char.getModifier("cha");
            if (char.level === 2) this.log(`✋ Lay on Hands pool: ${char.layOnHandsPool} HP`, "success");
            if (char.level === 2) this.log(`⚔️ Fighting Style and Divine Smite unlocked!`, "success");
            if (char.level === 6) this.log(`🛡️ Aura of Protection! +${Math.max(1, char.getModifier("cha"))} to all saves for you and nearby allies!`, "success");
        }
        
        // Warlock Pact Slot progression
        if (char.charClass === "Warlock") {
            const pactTable = GAME_DATA.pactMagicSlots[char.level];
            if (pactTable) {
                const pactLevel = parseInt(Object.keys(pactTable)[0]);
                const pactCount = pactTable[pactLevel];
                char.pactSlotLevel = pactLevel;
                char.pactSlots = pactCount;
                char.pactSlotsUsed = 0;
            }
        }
        
        // Bard progression
        if (char.charClass === "Bard") {
            char.bardicInspirationUses = Math.max(1, char.getModifier("cha"));
            if (char.level >= 15) char.bardicInspirationDie = "1d12";
            else if (char.level >= 10) char.bardicInspirationDie = "1d10";
            else if (char.level >= 5) char.bardicInspirationDie = "1d8";
            else char.bardicInspirationDie = "1d6";
            if (char.level === 2) this.log(`🎵 Jack of All Trades! Add half proficiency to non-proficient ability checks.`, "success");
            if (char.level === 3) this.log(`🎵 Expertise! Double proficiency in two skills.`, "success");
        }
        
        // Sorcerer progression
        if (char.charClass === "Sorcerer" && char.level >= 2) {
            char.sorceryPointsMax = char.level;
            char.sorceryPoints = char.sorceryPointsMax;
            if (char.level === 2) this.log(`✨ Font of Magic! ${char.sorceryPoints} sorcery points available.`, "success");
            if (char.level === 3) this.log(`✨ Metamagic unlocked! Quickened Spell and Twinned Spell available.`, "success");
        }
        
        // Druid progression
        if (char.charClass === "Druid") {
            if (char.level === 2) {
                char.wildShapeUses = 2;
                char.wildShapeCR = 0.25;
                this.log(`🐻 Wild Shape unlocked! Transform into beasts (CR 1/4).`, "success");
            }
            if (char.level === 4) char.wildShapeCR = 0.5;
            if (char.level === 8) char.wildShapeCR = 1;
        }
        
        // Artificer progression
        if (char.charClass === "Artificer") {
            if (char.level === 2) {
                this.log(`🔧 Infuse Item! Imbue mundane items with magical properties.`, "success");
                char.infusionsKnown = 4;
            }
            if (char.level === 6) char.infusionsKnown = 6;
            if (char.level === 10) char.infusionsKnown = 8;
        }
        
        // ASI at levels 4, 8, 12, 16, 19 (Fighters also at 6, 14; Rogues also at 10)
        const asiLevels = [4, 8, 12, 16, 19];
        const fighterExtraAsi = [6, 14];
        const rogueExtraAsi = [10];
        if (asiLevels.includes(char.level) || (char.charClass === "Fighter" && fighterExtraAsi.includes(char.level)) || (char.charClass === "Rogue" && rogueExtraAsi.includes(char.level))) {
            // Show ASI/Feat choice modal
            this.showAsiOrFeatChoice();
        }
        
        // Spellcaster spell slot progression (uses D&D 5e tables)
        if (char.isSpellcaster() || (char.charClass === "Ranger" && char.level >= 2) || (char.charClass === "Paladin" && char.level >= 2)) {
            const classInfo = GAME_DATA.classes[char.charClass];
            let slotTable;
            if (classInfo.casterType === 'pact') {
                slotTable = GAME_DATA.pactMagicSlots;
            } else if (classInfo.casterType === 'half') {
                slotTable = GAME_DATA.halfCasterSlots;
            } else {
                slotTable = GAME_DATA.fullCasterSlots;
            }
            const prevSlotTable = slotTable[char.level - 1] || {};
            const newSlotTable = slotTable[char.level] || {};
            
            // Update all spell slot levels from the table
            for (let spellLvl = 1; spellLvl <= 9; spellLvl++) {
                char.spells.slots[spellLvl] = newSlotTable[spellLvl] || 0;
            }
            
            // Detect newly gained spell levels and auto-learn spells
            for (let spellLvl = 1; spellLvl <= 9; spellLvl++) {
                const prevSlots = prevSlotTable[spellLvl] || 0;
                const newSlots = newSlotTable[spellLvl] || 0;
                
                if (newSlots > 0 && prevSlots === 0) {
                    // Gained access to a new spell level!
                    const ordinal = spellLvl === 1 ? '1st' : spellLvl === 2 ? '2nd' : spellLvl === 3 ? '3rd' : `${spellLvl}th`;
                    this.log(`✨ You gain ${ordinal} level spell slots!`, "success");
                    
                    // Auto-learn a spell of the new level
                    const newLevelSpells = Object.keys(GAME_DATA.spells).filter(s => 
                        GAME_DATA.spells[s].level === spellLvl && 
                        GAME_DATA.spells[s].classes.includes(char.charClass) && 
                        !char.spells.known.includes(s)
                    );
                    if (newLevelSpells.length > 0) {
                        char.spells.known.push(newLevelSpells[0]);
                        this.log(`📖 You learn: ${newLevelSpells[0]}!`, "success");
                        // Learn a second spell if available
                        if (newLevelSpells.length > 1) {
                            char.spells.known.push(newLevelSpells[1]);
                            this.log(`📖 You learn: ${newLevelSpells[1]}!`, "success");
                        }
                    }
                } else if (newSlots > prevSlots && prevSlots > 0) {
                    // Existing spell level got more slots
                    const ordinal = spellLvl === 1 ? '1st' : spellLvl === 2 ? '2nd' : spellLvl === 3 ? '3rd' : `${spellLvl}th`;
                    this.log(`✨ ${ordinal} level spell slots increased to ${newSlots}!`, "success");
                }
            }
            
            // Cantrip damage scaling: at level 5, 11, 17 cantrips get extra dice
            if (char.level === 5 || char.level === 11 || char.level === 17) {
                this.log(`✨ Cantrip damage increased! Your cantrips now deal more damage.`, "success");
            }
        }
        
        // Add journal entry for level up
        this.character.addJournalEntry('lore', { 
            title: `Reached Level ${char.level}`, 
            text: `Grew stronger on Day ${this.dm.day}. Proficiency bonus: +${profBonus}.` 
        });
    }

    showSubclassSelection() {
        const char = this.character;
        const classData = SUBCLASS_DATA[char.charClass];
        if (!classData) return;

        let html = `<h2>🌟 Choose Your ${classData.name}</h2>`;
        html += `<p style="margin-bottom:15px;">At level 3, ${char.name} must choose a specialization path:</p>`;
        html += `<div style="display:flex;flex-direction:column;gap:12px;">`;

        for (const [key, subclass] of Object.entries(classData.options)) {
            const level3Feature = subclass.features[3];
            html += `<div style="border:1px solid var(--border);border-radius:8px;padding:12px;cursor:pointer;transition:all 0.2s;" 
                          onmouseover="this.style.borderColor='var(--accent)';this.style.background='rgba(255,215,0,0.05)'" 
                          onmouseout="this.style.borderColor='var(--border)';this.style.background=''" 
                          onclick="game.selectSubclass('${key}')">
                <div style="font-weight:bold;font-size:1.1em;color:var(--accent);">⚔️ ${subclass.name}</div>
                <div style="margin:6px 0;color:var(--text-secondary);font-style:italic;">${subclass.description}</div>
                <div style="font-size:0.9em;color:var(--text);padding:6px;background:rgba(0,0,0,0.2);border-radius:4px;">
                    <strong>Level 3:</strong> ${level3Feature.name} — ${level3Feature.description}
                </div>
            </div>`;
        }
        html += `</div>`;
        this.showModal(html);
    }

    selectSubclass(subclassKey) {
        const char = this.character;
        const classData = SUBCLASS_DATA[char.charClass];
        if (!classData || !classData.options[subclassKey]) return;

        const subclass = classData.options[subclassKey];
        char.subclass = subclassKey;

        // Close the modal
        const modals = document.querySelectorAll('.modal-overlay');
        modals.forEach(m => m.remove());

        this.log(`🌟 <strong>${char.name} has chosen the ${subclass.name}!</strong>`, "success");

        // Apply level 3 feature
        const feature = subclass.features[3];
        if (feature) {
            this.log(`📜 <strong>${feature.name}:</strong> ${feature.description}`, "dm");
            this.applySubclassFeature(char, subclassKey, 3, feature);
        }

        // Add journal entry
        char.addJournalEntry('lore', {
            title: `Chose ${subclass.name}`,
            text: `Specialized as a ${subclass.name}. Gained: ${feature ? feature.name : 'subclass features'}.`
        });

        this.updateUI();
    }

    // ==================== ASI / FEAT CHOICE ====================
    showAsiOrFeatChoice() {
        const char = this.character;
        let html = `<h2>📊 Ability Score Improvement</h2>`;
        html += `<p style="margin-bottom:15px;">Choose how to improve at level ${char.level}:</p>`;
        html += `<div style="display:flex;flex-direction:column;gap:12px;">`;
        
        html += `<div style="border:1px solid var(--border);border-radius:8px;padding:12px;cursor:pointer;transition:all 0.2s;" 
                      onmouseover="this.style.borderColor='var(--accent)';this.style.background='rgba(255,215,0,0.05)'" 
                      onmouseout="this.style.borderColor='var(--border)';this.style.background=''" 
                      onclick="game.chooseAsi()">
            <div style="font-weight:bold;font-size:1.1em;color:var(--accent);">📈 Ability Score Increase</div>
            <div style="margin:6px 0;color:var(--text-secondary);font-style:italic;">+2 to your primary ability score (${GAME_DATA.classes[char.charClass].primary.toUpperCase()})</div>
        </div>`;
        
        const availableFeats = Object.entries(FEATS_DATA).filter(([name, feat]) => {
            if (char.feats.includes(name)) return false;
            if (feat.prerequisite === "spellcaster" && !char.isSpellcaster()) return false;
            return true;
        });
        
        if (availableFeats.length > 0) {
            html += `<div style="border:1px solid var(--border);border-radius:8px;padding:12px;cursor:pointer;transition:all 0.2s;" 
                          onmouseover="this.style.borderColor='var(--accent)';this.style.background='rgba(255,215,0,0.05)'" 
                          onmouseout="this.style.borderColor='var(--border)';this.style.background=''" 
                          onclick="game.showFeatSelection()">
                <div style="font-weight:bold;font-size:1.1em;color:var(--accent);">🏆 Choose a Feat</div>
                <div style="margin:6px 0;color:var(--text-secondary);font-style:italic;">Gain a special ability instead of stat increases (${availableFeats.length} available)</div>
            </div>`;
        }
        
        html += `</div>`;
        this.showModal(html);
    }
    
    chooseAsi() {
        const char = this.character;
        const modals = document.querySelectorAll('.modal-overlay');
        modals.forEach(m => m.remove());
        
        const primaryStat = GAME_DATA.classes[char.charClass].primary;
        if (char.stats[primaryStat] < 20) {
            const increase = Math.min(2, 20 - char.stats[primaryStat]);
            char.stats[primaryStat] += increase;
            this.log(`📊 Ability Score Improvement! ${primaryStat.toUpperCase()} increased by ${increase} to ${char.stats[primaryStat]}!`, "success");
            if (increase === 1 && char.stats.con < 20) {
                char.stats.con += 1;
                this.log(`📊 CON also increased by 1 to ${char.stats.con}!`, "success");
            }
        } else {
            if (char.stats.con < 20) {
                const increase = Math.min(2, 20 - char.stats.con);
                char.stats.con += increase;
                this.log(`📊 Ability Score Improvement! CON increased by ${increase} to ${char.stats.con}!`, "success");
            }
        }
        this.recalculateAfterAsi();
    }
    
    showFeatSelection() {
        const char = this.character;
        const availableFeats = Object.entries(FEATS_DATA).filter(([name, feat]) => {
            if (char.feats.includes(name)) return false;
            if (feat.prerequisite === "spellcaster" && !char.isSpellcaster()) return false;
            return true;
        });
        
        let html = `<h2>🏆 Choose a Feat</h2>`;
        html += `<p style="margin-bottom:15px;">Select a feat to learn:</p>`;
        html += `<div style="display:flex;flex-direction:column;gap:10px;max-height:60vh;overflow-y:auto;">`;
        
        for (const [name, feat] of availableFeats) {
            html += `<div style="border:1px solid var(--border);border-radius:8px;padding:10px;cursor:pointer;transition:all 0.2s;" 
                          onmouseover="this.style.borderColor='var(--accent)';this.style.background='rgba(255,215,0,0.05)'" 
                          onmouseout="this.style.borderColor='var(--border)';this.style.background=''" 
                          onclick="game.selectFeat('${name}')">
                <div style="font-weight:bold;color:var(--accent);">🏆 ${name}</div>
                <div style="font-size:0.9em;margin-top:4px;color:var(--text-secondary);">${feat.description}</div>
            </div>`;
        }
        
        html += `</div>`;
        html += `<div style="margin-top:12px;text-align:center;"><button onclick="game.showAsiOrFeatChoice()" style="padding:8px 16px;cursor:pointer;border-radius:4px;border:1px solid var(--border);background:rgba(0,0,0,0.3);color:var(--text);">← Back</button></div>`;
        
        const modals = document.querySelectorAll('.modal-overlay');
        modals.forEach(m => m.remove());
        this.showModal(html);
    }
    
    selectFeat(featName) {
        const char = this.character;
        const feat = FEATS_DATA[featName];
        if (!feat || char.feats.includes(featName)) return;
        
        const modals = document.querySelectorAll('.modal-overlay');
        modals.forEach(m => m.remove());
        
        feat.onApply(char);
        
        this.log(`🏆 <strong>Feat Gained: ${featName}!</strong>`, "success");
        this.log(`📜 ${feat.description}`, "dm");
        
        if (featName === "Tough") {
            this.log(`❤️ Max HP increased by ${char.level * 2}!`, "success");
        }
        
        this.recalculateAfterAsi();
    }
    
    recalculateAfterAsi() {
        const char = this.character;
        const conMod = char.getModifier("con");
        char.maxHp = GAME_DATA.classes[char.charClass].hitDie + conMod;
        for (let lvl = 2; lvl <= char.level; lvl++) {
            char.maxHp += Math.max(1, Math.floor(GAME_DATA.classes[char.charClass].hitDie / 2) + 1 + conMod);
        }
        if (char.feats.includes("Tough")) {
            char.maxHp += char.level * 2;
        }
        char.hp = char.maxHp;
        char.calculateAc(this.dm?.campaignId);
        this.updateUI();
    }

    applySubclassFeature(char, subclassKey, level, feature) {
        // Store the feature as active
        if (!char.subclassFeatures) char.subclassFeatures = {};
        char.subclassFeatures[`${subclassKey}_${level}`] = true;

        // Apply specific mechanical effects
        switch (subclassKey) {
            case 'Champion':
                if (level === 3) {
                    char.subclassFeatures.critRange = 19; // Crit on 19-20
                } else if (level === 15) {
                    char.subclassFeatures.critRange = 18; // Crit on 18-20
                }
                break;
                
            case 'BattleMaster':
                if (level === 3) {
                    char.subclassFeatures.superiorityDice = 4;
                    char.subclassFeatures.superiorityDiceRemaining = 4;
                    char.subclassFeatures.superiorityDieSize = 8;
                } else if (level === 7) {
                    char.subclassFeatures.superiorityDice = 5;
                    char.subclassFeatures.superiorityDiceRemaining = 5;
                }
                break;

            case 'EldritchKnight':
                if (level === 3) {
                    // Grant spellcasting to Fighter
                    if (!char.spells.cantrips.length) char.spells.cantrips = [];
                    const wizCantrips = Object.keys(GAME_DATA.spells).filter(s => 
                        GAME_DATA.spells[s].level === 0 && GAME_DATA.spells[s].classes.includes("Wizard")
                    );
                    // Add 2 wizard cantrips
                    for (let i = 0; i < Math.min(2, wizCantrips.length); i++) {
                        if (!char.spells.cantrips.includes(wizCantrips[i])) {
                            char.spells.cantrips.push(wizCantrips[i]);
                            this.log(`✨ Learned cantrip: ${wizCantrips[i]}`, "success");
                        }
                    }
                    // Add 3 level-1 wizard spells
                    const wizSpells = Object.keys(GAME_DATA.spells).filter(s => 
                        GAME_DATA.spells[s].level === 1 && GAME_DATA.spells[s].classes.includes("Wizard") && !char.spells.known.includes(s)
                    );
                    for (let i = 0; i < Math.min(3, wizSpells.length); i++) {
                        char.spells.known.push(wizSpells[i]);
                        this.log(`📖 Learned spell: ${wizSpells[i]}`, "success");
                    }
                    // Grant spell slots (third-caster: round up at /3)
                    char.spells.slots[1] = Math.max(char.spells.slots[1], 2);
                }
                break;

            case 'ArcaneTrickster':
                if (level === 3) {
                    // Similar to Eldritch Knight
                    if (!char.spells.cantrips.length) char.spells.cantrips = [];
                    const rogueCantrips = Object.keys(GAME_DATA.spells).filter(s => 
                        GAME_DATA.spells[s].level === 0 && GAME_DATA.spells[s].classes.includes("Wizard")
                    );
                    for (let i = 0; i < Math.min(3, rogueCantrips.length); i++) {
                        if (!char.spells.cantrips.includes(rogueCantrips[i])) {
                            char.spells.cantrips.push(rogueCantrips[i]);
                            this.log(`✨ Learned cantrip: ${rogueCantrips[i]}`, "success");
                        }
                    }
                    const rogueSpells = Object.keys(GAME_DATA.spells).filter(s => 
                        GAME_DATA.spells[s].level === 1 && GAME_DATA.spells[s].classes.includes("Wizard") && !char.spells.known.includes(s)
                    );
                    for (let i = 0; i < Math.min(3, rogueSpells.length); i++) {
                        char.spells.known.push(rogueSpells[i]);
                        this.log(`📖 Learned spell: ${rogueSpells[i]}`, "success");
                    }
                    char.spells.slots[1] = Math.max(char.spells.slots[1], 2);
                }
                break;

            case 'Life':
                // Disciple of Life: bonus healing tracked via subclassFeatures flag
                break;

            case 'War':
                if (level === 3) {
                    const wisMod = Math.max(1, char.getModifier("wis"));
                    char.subclassFeatures.warPriestUses = wisMod;
                    char.subclassFeatures.warPriestUsesRemaining = wisMod;
                } else if (level === 7) {
                    char.subclassFeatures.guidedStrikeAvailable = true;
                }
                break;

            case 'BeastMaster':
                if (level === 3) {
                    const companionHp = 4 * char.level;
                    char.subclassFeatures.companion = {
                        name: "Wolf Companion",
                        hp: companionHp,
                        maxHp: companionHp,
                        damage: "2d4+2",
                        ac: 13
                    };
                    this.log(`🐺 A loyal wolf joins you as your animal companion! (HP: ${companionHp})`, "success");
                }
                break;

            case 'Berserker':
                // Frenzy: bonus attack while raging (tracked in combat)
                break;

            case 'TotemWarrior':
                // Bear Totem: resistance to all damage while raging (tracked in combat)
                break;

            case 'Abjuration':
                if (level === 3) {
                    // Arcane Ward: HP = twice wizard level + INT modifier
                    const wardHp = (char.level * 2) + char.getModifier('int');
                    char.subclassFeatures.arcaneWardHp = wardHp;
                    char.subclassFeatures.arcaneWardMaxHp = wardHp;
                    this.log(`🛡️ Arcane Ward activated! Ward HP: ${wardHp}`, "success");
                }
                break;

            case 'Evocation':
                // Sculpt Spells / Empowered Evocation: passive, tracked via feature flags
                break;

            case 'Necromancy':
                // Grim Harvest: tracked in handleDamageSpell
                break;
        }
    }

    rollEnemyLoot(monster) {
        // Determine loot tier based on monster danger/xp
        let tier = 1;
        if (monster.xp >= 1000) tier = 5;
        else if (monster.xp >= 450) tier = 4;
        else if (monster.xp >= 200) tier = 3;
        else if (monster.xp >= 75) tier = 2;
        
        const lootTable = GAME_DATA.lootTables[tier];
        const campaignItems = GAME_DATA.campaignItems[this.dm.campaignId];
        
        // Always drop some gold
        const [minGold, maxGold] = lootTable.goldRange;
        const gold = Math.floor(Math.random() * (maxGold - minGold + 1)) + minGold;
        this.character.gold += gold;
        this.stats.goldThisRound = gold; // Track gold for toast display
        soundManager.playGold();
        this.log(`💰 You loot ${gold} gold from the ${monster.name}!`, "loot");
        
        // Check for equipment drop
        if (Math.random() < lootTable.dropChance) {
            // Build combined loot pool (standard + campaign-specific)
            let weaponPool = [...lootTable.weapons];
            let armorPool = [...lootTable.armor];
            let shieldPool = [...lootTable.shields];
            
            // Add campaign-specific loot items (30% chance to include each)
            if (campaignItems && campaignItems.lootItems) {
                for (const item of campaignItems.lootItems) {
                    if (Math.random() < 0.3) {
                        if (campaignItems.weapons && campaignItems.weapons[item]) weaponPool.push(item);
                        else if (campaignItems.armor && campaignItems.armor[item]) armorPool.push(item);
                        else if (campaignItems.shields && campaignItems.shields[item]) shieldPool.push(item);
                    }
                }
            }
            
            // Randomly decide: weapon, armor, or shield
            const dropType = Math.random();
            let droppedItem = null;
            
            if (dropType < 0.5 && weaponPool.length > 0) {
                // Drop weapon (50% chance)
                droppedItem = weaponPool[Math.floor(Math.random() * weaponPool.length)];
            } else if (dropType < 0.85 && armorPool.length > 0) {
                // Drop armor (35% chance)
                droppedItem = armorPool[Math.floor(Math.random() * armorPool.length)];
            } else if (shieldPool.length > 0) {
                // Drop shield (15% chance)
                droppedItem = shieldPool[Math.floor(Math.random() * shieldPool.length)];
            }
            
            if (droppedItem && !this.character.inventory.includes(droppedItem)) {
                this.character.inventory.push(droppedItem);
                
                // Describe the item (check campaign items too)
                let itemDesc = "";
                let isCampaignItem = false;
                
                if (campaignItems && campaignItems.weapons && campaignItems.weapons[droppedItem]) {
                    const w = campaignItems.weapons[droppedItem];
                    itemDesc = `${w.damage} ${w.type}`;
                    isCampaignItem = true;
                } else if (campaignItems && campaignItems.armor && campaignItems.armor[droppedItem]) {
                    const a = campaignItems.armor[droppedItem];
                    itemDesc = `AC ${a.ac}`;
                    isCampaignItem = true;
                } else if (campaignItems && campaignItems.shields && campaignItems.shields[droppedItem]) {
                    const s = campaignItems.shields[droppedItem];
                    itemDesc = `+${s.acBonus} AC`;
                    isCampaignItem = true;
                } else if (GAME_DATA.weapons[droppedItem]) {
                    const w = GAME_DATA.weapons[droppedItem];
                    itemDesc = `${w.damage} ${w.type}`;
                } else if (GAME_DATA.armor[droppedItem]) {
                    const a = GAME_DATA.armor[droppedItem];
                    itemDesc = `AC ${a.ac}`;
                } else if (GAME_DATA.shields[droppedItem]) {
                    const s = GAME_DATA.shields[droppedItem];
                    itemDesc = `+${s.acBonus} AC`;
                }
                
                this.log(`⚔️ The ${monster.name} dropped: ${droppedItem} (${itemDesc})${isCampaignItem ? ' ⭐' : ''}!`, "loot");
            }
        }
        
        // Boss monsters always drop something extra special
        if (monster.boss) {
            const bossLoot = GAME_DATA.lootTables[5];
            const bonusGold = Math.floor(Math.random() * 100) + 50;
            this.character.gold += bonusGold;
            this.log(`👑 Bonus loot from boss: ${bonusGold} gold!`, "loot");
            
            // Build boss loot pool (standard + campaign-specific boss loot)
            let bossWeapons = [...bossLoot.weapons];
            let bossArmor = [...bossLoot.armor];
            let bossShields = [...bossLoot.shields];
            
            // Campaign-specific boss loot
            if (campaignItems && campaignItems.bossLoot) {
                for (const item of campaignItems.bossLoot) {
                    if (campaignItems.weapons && campaignItems.weapons[item]) bossWeapons.push(item);
                    else if (campaignItems.armor && campaignItems.armor[item]) bossArmor.push(item);
                    else if (campaignItems.shields && campaignItems.shields[item]) bossShields.push(item);
                }
            }
            
            // Boss always drops a piece of equipment
            const bossDropType = Math.random();
            let bossItem = null;
            if (bossDropType < 0.4 && bossWeapons.length > 0) {
                bossItem = bossWeapons[Math.floor(Math.random() * bossWeapons.length)];
            } else if (bossDropType < 0.8 && bossArmor.length > 0) {
                bossItem = bossArmor[Math.floor(Math.random() * bossArmor.length)];
            } else if (bossShields.length > 0) {
                bossItem = bossShields[Math.floor(Math.random() * bossShields.length)];
            }
            
            if (bossItem && !this.character.inventory.includes(bossItem)) {
                this.character.inventory.push(bossItem);
                const isCampaignItem = campaignItems && (
                    (campaignItems.weapons && campaignItems.weapons[bossItem]) ||
                    (campaignItems.armor && campaignItems.armor[bossItem]) ||
                    (campaignItems.shields && campaignItems.shields[bossItem])
                );
                this.log(`👑 Rare drop: ${bossItem}${isCampaignItem ? ' ⭐' : ''}!`, "loot");
            }
            
            // Bosses also drop a healing item (campaign-specific or generic)
            if (campaignItems && campaignItems.consumables) {
                const healingItems = Object.keys(campaignItems.consumables).filter(item => 
                    campaignItems.consumables[item].effect === "heal"
                );
                if (healingItems.length > 0 && Math.random() < 0.5) {
                    const campHealItem = healingItems[Math.floor(Math.random() * healingItems.length)];
                    this.character.inventory.push(campHealItem);
                    this.log(`👑 Bonus: ${campHealItem} ⭐!`, "loot");
                } else {
                    this.character.inventory.push("Greater Healing Potion");
                    this.log(`👑 Bonus: Greater Healing Potion!`, "loot");
                }
            } else {
                this.character.inventory.push("Greater Healing Potion");
                this.log(`👑 Bonus: Greater Healing Potion!`, "loot");
            }
        }
        
        this.updateUI();
    }

    findTreasure() {
        const treasure = GAME_DATA.treasures[Math.floor(Math.random() * GAME_DATA.treasures.length)];
        
        if (treasure.usable) {
            this.character.inventory.push(treasure.name);
            this.log(`💎 You found a ${treasure.name}! (Added to inventory)`, "loot");
        } else {
            const value = treasure.getValue();
            this.character.gold += value;
            this.log(`💰 You found ${treasure.name} worth ${value} gold!`, "loot");
        }
        
        this.updateUI();
    }

    async randomEvent() {
        const events = [
            () => this.merchantEvent(),
            () => this.mysteriousStrangerEvent(),
            () => this.trappedChestEvent(),
            () => this.treasureChestEvent(),
            () => this.healingSpringEvent()
        ];

        await events[Math.floor(Math.random() * events.length)]();
    }

    showChoice(title, description, choices) {
        return new Promise(resolve => {
            const modal = document.getElementById("choiceModal");
            document.getElementById("choiceTitle").textContent = title;
            document.getElementById("choiceDescription").textContent = description;
            
            const optionsContainer = document.getElementById("choiceOptions");
            optionsContainer.innerHTML = "";
            
            choices.forEach((choice, index) => {
                const btn = document.createElement("div");
                btn.className = "travel-option";
                btn.innerHTML = `<span>${choice.text}</span>`;
                btn.onclick = () => {
                    modal.classList.remove("active");
                    resolve(index);
                };
                optionsContainer.appendChild(btn);
            });
            
            modal.classList.add("active");
        });
    }

    async merchantEvent() {
        this.log("A traveling merchant approaches you.", "dm");
        this.log("'I have wares if you have coin!'", "dm");
        
        // Open the shop with random inventory
        this.openShop("traveling");
    }
    
    openShop(shopType = "general") {
        // Cannot shop while unconscious
        if (this.character.hp <= 0) {
            this.log("You're unconscious and need medical attention! Rest to recover.", "danger");
            return;
        }
        
        // Generate shop inventory based on type and location
        let shopInventory = [];
        const prices = GAME_DATA.shopPrices;
        const campaignItems = GAME_DATA.campaignItems[this.dm.campaignId];
        
        // Get campaign-specific shop items
        const campaignShopItems = campaignItems ? campaignItems.shopItems || [] : [];
        
        if (shopType === "traveling") {
            // Traveling merchant has limited, random inventory
            const allItems = Object.keys(prices).filter(item => prices[item] > 0); // Exclude 0-cost items (cannot be bought)
            const numItems = Math.floor(Math.random() * 4) + 4; // 4-7 items
            const shuffled = allItems.sort(() => Math.random() - 0.5);
            shopInventory = shuffled.slice(0, numItems);
            // Always include healing potion
            if (!shopInventory.includes("Healing Potion")) {
                shopInventory.push("Healing Potion");
            }
            // Add 1-2 random campaign-specific items if available
            if (campaignShopItems.length > 0) {
                const campItems = campaignShopItems.sort(() => Math.random() - 0.5).slice(0, 2);
                shopInventory = [...shopInventory, ...campItems.filter(i => !shopInventory.includes(i))];
            }
        } else if (shopType === "weapons") {
            // Standard weapons
            shopInventory = Object.keys(GAME_DATA.weapons).filter(w => w !== "Unarmed" && prices[w]);
            // Add campaign-specific weapons
            if (campaignItems && campaignItems.weapons) {
                const campWeapons = Object.keys(campaignItems.weapons).filter(w => prices[w] && prices[w] > 0);
                shopInventory = [...shopInventory, ...campWeapons];
            }
        } else if (shopType === "armor") {
            // Standard armor and shields
            shopInventory = [...Object.keys(GAME_DATA.armor).filter(a => a !== "Robes" && prices[a]), ...Object.keys(GAME_DATA.shields)];
            // Add campaign-specific armor and shields
            if (campaignItems) {
                if (campaignItems.armor) {
                    const campArmor = Object.keys(campaignItems.armor).filter(a => prices[a] && prices[a] > 0);
                    shopInventory = [...shopInventory, ...campArmor];
                }
                if (campaignItems.shields) {
                    const campShields = Object.keys(campaignItems.shields).filter(s => prices[s] && prices[s] > 0);
                    shopInventory = [...shopInventory, ...campShields];
                }
            }
        } else {
            // General store - everything buyable
            shopInventory = Object.keys(prices).filter(item => prices[item] > 0);
            // Add campaign-specific shop items
            shopInventory = [...new Set([...shopInventory, ...campaignShopItems])];
        }
        
        this.showShopModal(shopInventory, shopType);
    }
    
    showShopModal(inventory, shopType) {
        this.currentShopInventory = inventory;
        this.currentShopType = shopType;
        
        // Create shop modal if it doesn't exist
        let shopModal = document.getElementById("shopModal");
        if (!shopModal) {
            shopModal = document.createElement("div");
            shopModal.id = "shopModal";
            shopModal.className = "modal";
            shopModal.innerHTML = `
                <div class="modal-content shop-modal-content">
                    <h2 id="shopTitle">🏺 Shop</h2>
                    <p id="shopGold" style="color: gold; margin-bottom: 15px;"></p>
                    <div id="shopModeTabs" class="shop-mode-tabs">
                        <button class="shop-mode-tab active" onclick="game.switchShopMode('buy')">🪙 Buy</button>
                        <button class="shop-mode-tab" onclick="game.switchShopMode('sell')">💰 Sell</button>
                    </div>
                    <div id="shopTabs" class="shop-tabs"></div>
                    <div id="shopItems" class="shop-items"></div>
                    <button class="close-btn" onclick="game.closeShop()">Close Shop</button>
                </div>
            `;
            document.body.appendChild(shopModal);
        }
        
        // Set title based on shop type
        const titles = {
            "traveling": "🏺 Traveling Merchant",
            "weapons": "⚒️ Smith",
            "armor": "🛡️ Blacksmith's Forge",
            "general": "🏺 General Store"
        };
        document.getElementById("shopTitle").textContent = titles[shopType] || "🏺 Shop";
        document.getElementById("shopGold").textContent = `Your Gold: ${this.character.gold} gp`;
        
        // Create category tabs for general store
        const tabsContainer = document.getElementById("shopTabs");
        tabsContainer.innerHTML = "";
        
        if (shopType === "general" || shopType === "traveling") {
            const categories = ["All", "Weapons", "Armor", "Items"];
            categories.forEach(cat => {
                const tab = document.createElement("button");
                tab.className = "shop-tab" + (cat === "All" ? " active" : "");
                tab.textContent = cat;
                tab.onclick = () => this.filterShopItems(inventory, cat, tabsContainer);
                tabsContainer.appendChild(tab);
            });
        }
        
        // Populate items
        this.populateShopItems(inventory, "All");
        
        shopModal.classList.add("active");
    }
    
    filterShopItems(inventory, category, tabsContainer) {
        // Update active tab
        tabsContainer.querySelectorAll(".shop-tab").forEach(tab => {
            tab.classList.toggle("active", tab.textContent === category);
        });
        this.populateShopItems(this.currentShopInventory, category);
    }
    
    switchShopMode(mode) {
        // Update mode tab styling
        document.querySelectorAll('.shop-mode-tab').forEach(tab => {
            tab.classList.toggle('active', tab.textContent.toLowerCase().includes(mode));
        });
        
        this.currentShopMode = mode;
        
        // Update category tabs for sell mode
        const tabsContainer = document.getElementById("shopTabs");
        tabsContainer.innerHTML = "";
        
        if (mode === 'sell') {
            const categories = ["All", "Weapons", "Armor", "Items"];
            categories.forEach(cat => {
                const tab = document.createElement("button");
                tab.className = "shop-tab" + (cat === "All" ? " active" : "");
                tab.textContent = cat;
                tab.onclick = () => {
                    tabsContainer.querySelectorAll(".shop-tab").forEach(t => t.classList.remove("active"));
                    tab.classList.add("active");
                    this.populateSellItems(cat);
                };
                tabsContainer.appendChild(tab);
            });
            this.populateSellItems("All");
        } else {
            // Buy mode - restore original tabs
            if (this.currentShopType === "general" || this.currentShopType === "traveling") {
                const categories = ["All", "Weapons", "Armor", "Items"];
                categories.forEach(cat => {
                    const tab = document.createElement("button");
                    tab.className = "shop-tab" + (cat === "All" ? " active" : "");
                    tab.textContent = cat;
                    tab.onclick = () => this.filterShopItems(this.currentShopInventory, cat, tabsContainer);
                    tabsContainer.appendChild(tab);
                });
            }
            this.populateShopItems(this.currentShopInventory, "All");
        }
    }
    
    populateSellItems(category) {
        const itemsContainer = document.getElementById("shopItems");
        itemsContainer.innerHTML = "";
        
        const prices = GAME_DATA.shopPrices;
        const campaignItems = GAME_DATA.campaignItems[this.dm.campaignId] || {};
        const descriptions = GAME_DATA.itemDescriptions;
        
        // Get sellable items from inventory (exclude equipped items)
        const equippedWeapon = this.character.equipped.weapon;
        const equippedArmor = this.character.equipped.armor;
        const equippedShield = this.character.equipped.shield;
        
        // Count items in inventory
        const itemCounts = {};
        this.character.inventory.forEach(item => {
            itemCounts[item] = (itemCounts[item] || 0) + 1;
        });
        
        // Create sell items list (unique items), excluding equipped items entirely
        const sellableItems = [...new Set(this.character.inventory)].filter(item => {
            const price = prices[item];
            if (!price || price <= 0) return false; // Can only sell items with a price
            // Exclude equipped items from sell list
            if (item === equippedWeapon || item === equippedArmor || item === equippedShield) return false;
            return true;
        });
        
        sellableItems.forEach(item => {
            const basePrice = prices[item];
            const sellPrice = Math.floor(basePrice * 0.5); // Sell at 50% value
            const count = itemCounts[item];
            
            // Check item type
            const isWeapon = GAME_DATA.weapons[item] || (campaignItems.weapons && campaignItems.weapons[item]);
            const isArmor = GAME_DATA.armor[item] || (campaignItems.armor && campaignItems.armor[item]);
            const isShield = GAME_DATA.shields[item] || (campaignItems.shields && campaignItems.shields[item]);
            const isItem = !isWeapon && !isArmor && !isShield;
            
            // Filter by category
            if (category !== "All") {
                if (category === "Weapons" && !isWeapon) return;
                if (category === "Armor" && !(isArmor || isShield)) return;
                if (category === "Items" && !isItem) return;
            }
            
            // Get detailed description
            const detailedDesc = descriptions[item] || this.getItemStats(item, campaignItems);
            
            const itemDiv = document.createElement("div");
            itemDiv.className = `shop-item sell-item`;
            itemDiv.innerHTML = `
                <div class="shop-item-info">
                    <span class="shop-item-name">${item} ${count > 1 ? `(x${count})` : ''}</span>
                    <span class="shop-item-desc">${detailedDesc}</span>
                </div>
                <div class="shop-item-price">
                    <span class="sell-price">+${sellPrice} gp</span>
                    <button class="sell-btn" onclick="game.sellItem('${item.replace(/'/g, "\\'")}', ${sellPrice})">Sell</button>
                </div>
            `;
            itemsContainer.appendChild(itemDiv);
        });
        
        if (itemsContainer.children.length === 0) {
            itemsContainer.innerHTML = '<p style="text-align: center; color: #888;">No items to sell in this category</p>';
        }
    }
    
    sellItem(item, sellPrice) {
        // Check if item is equipped - prevent selling equipped items
        const isEquipped = item === this.character.equipped.weapon || 
                          item === this.character.equipped.armor || 
                          item === this.character.equipped.shield;
        
        if (isEquipped) {
            this.log(`⚠️ Cannot sell ${item} - it is currently equipped! Unequip it first.`, "warning");
            return;
        }
        
        // Remove one instance of the item from inventory
        const index = this.character.inventory.indexOf(item);
        if (index > -1) {
            this.character.inventory.splice(index, 1);
            this.character.gold += sellPrice;
            this.log(`💰 Sold ${item} for ${sellPrice} gold!`, "success");
            soundManager.playGold();
            
            // Refresh shop display
            document.getElementById("shopGold").textContent = `Your Gold: ${this.character.gold} gp`;
            
            // Re-populate sell list
            const activeTab = document.querySelector(".shop-tab.active");
            const category = activeTab ? activeTab.textContent : "All";
            this.populateSellItems(category);
            
            this.updateUI();
        }
    }
    
    getItemStats(item, campaignItems) {
        // Get item stats for description
        if (campaignItems.weapons && campaignItems.weapons[item]) {
            const w = campaignItems.weapons[item];
            let desc = `${w.damage} ${w.type}`;
            if (w.properties && w.properties.length > 0) desc += ` (${w.properties.join(", ")})`;
            return desc;
        } else if (campaignItems.armor && campaignItems.armor[item]) {
            const a = campaignItems.armor[item];
            return `AC ${a.ac} (${a.type})`;
        } else if (campaignItems.shields && campaignItems.shields[item]) {
            const s = campaignItems.shields[item];
            return `+${s.acBonus} AC`;
        } else if (campaignItems.consumables && campaignItems.consumables[item]) {
            return campaignItems.consumables[item].description;
        } else if (GAME_DATA.weapons[item]) {
            const w = GAME_DATA.weapons[item];
            let desc = `${w.damage} ${w.type}`;
            if (w.properties && w.properties.length > 0) desc += ` (${w.properties.join(", ")})`;
            return desc;
        } else if (GAME_DATA.armor[item]) {
            const a = GAME_DATA.armor[item];
            return `AC ${a.ac} (${a.type})`;
        } else if (GAME_DATA.shields[item]) {
            return `+${GAME_DATA.shields[item].acBonus} AC`;
        }
        return "";
    }
    
    populateShopItems(inventory, category) {
        const itemsContainer = document.getElementById("shopItems");
        itemsContainer.innerHTML = "";
        
        const prices = GAME_DATA.shopPrices;
        const campaignItems = GAME_DATA.campaignItems[this.dm.campaignId] || {};
        const descriptions = GAME_DATA.itemDescriptions;
        
        inventory.forEach(item => {
            const price = prices[item];
            if (!price) return;
            
            // Check both standard and campaign-specific items
            const isWeapon = GAME_DATA.weapons[item] || (campaignItems.weapons && campaignItems.weapons[item]);
            const isArmor = GAME_DATA.armor[item] || (campaignItems.armor && campaignItems.armor[item]);
            const isShield = GAME_DATA.shields[item] || (campaignItems.shields && campaignItems.shields[item]);
            const isCampaignConsumable = campaignItems.consumables && campaignItems.consumables[item];
            const isItem = !isWeapon && !isArmor && !isShield;
            
            // Filter by category
            if (category !== "All") {
                if (category === "Weapons" && !isWeapon) return;
                if (category === "Armor" && !(isArmor || isShield)) return;
                if (category === "Items" && !isItem) return;
            }
            
            // Get item stats (short version for display)
            let statsDesc = "";
            let isCampaignItem = false;
            
            if (campaignItems.weapons && campaignItems.weapons[item]) {
                const w = campaignItems.weapons[item];
                statsDesc = `${w.damage} ${w.type}`;
                if (w.properties && w.properties.length > 0) statsDesc += ` (${w.properties.join(", ")})`;
                isCampaignItem = true;
            } else if (campaignItems.armor && campaignItems.armor[item]) {
                const a = campaignItems.armor[item];
                statsDesc = `AC ${a.ac} (${a.type})`;
                isCampaignItem = true;
            } else if (campaignItems.shields && campaignItems.shields[item]) {
                const s = campaignItems.shields[item];
                statsDesc = `+${s.acBonus} AC`;
                isCampaignItem = true;
            } else if (campaignItems.consumables && campaignItems.consumables[item]) {
                const c = campaignItems.consumables[item];
                statsDesc = c.description;
                isCampaignItem = true;
            } else if (GAME_DATA.weapons[item]) {
                const w = GAME_DATA.weapons[item];
                statsDesc = `${w.damage} ${w.type}`;
                if (w.properties.length > 0) statsDesc += ` (${w.properties.join(", ")})`;
            } else if (GAME_DATA.armor[item]) {
                const a = GAME_DATA.armor[item];
                statsDesc = `AC ${a.ac} (${a.type})`;
            } else if (GAME_DATA.shields[item]) {
                const s = GAME_DATA.shields[item];
                statsDesc = `+${s.acBonus} AC`;
            } else if (item.includes("Healing")) {
                statsDesc = item === "Greater Healing Potion" ? "Heals 4d4+4 HP" : "Heals 2d4+2 HP";
            }
            
            // Get detailed description from descriptions database
            const detailedDesc = descriptions[item] || "";
            
            const canAfford = this.character.gold >= price;
            const alreadyOwned = this.character.inventory.includes(item);
            
            const itemDiv = document.createElement("div");
            itemDiv.className = `shop-item ${!canAfford ? "cannot-afford" : ""} ${alreadyOwned ? "owned" : ""} ${isCampaignItem ? "campaign-item" : ""}`;
            itemDiv.innerHTML = `
                <div class="shop-item-info">
                    <span class="shop-item-name">${item} ${isCampaignItem ? '⭐' : ''}</span>
                    <span class="shop-item-stats">${statsDesc}</span>
                    ${detailedDesc ? `<span class="shop-item-desc">${detailedDesc}</span>` : ''}
                </div>
                <div class="shop-item-price">
                    <span>${price} gp</span>
                    ${alreadyOwned 
                        ? '<span class="owned-badge">Owned</span>' 
                        : `<button class="buy-btn" ${!canAfford ? "disabled" : ""} onclick="game.buyItem('${item.replace(/'/g, "\\'")}', ${price})">Buy</button>`
                    }
                </div>
            `;
            itemsContainer.appendChild(itemDiv);
        });
        
        if (itemsContainer.children.length === 0) {
            itemsContainer.innerHTML = '<p style="text-align: center; color: #888;">No items in this category</p>';
        }
    }
    
    buyItem(item, price) {
        if (this.character.gold >= price) {
            this.character.gold -= price;
            this.character.inventory.push(item);
            this.log(`🪙 Purchased ${item} for ${price} gold!`, "success");
            soundManager.playGold();
            
            // Refresh shop display
            document.getElementById("shopGold").textContent = `Your Gold: ${this.character.gold} gp`;
            
            // Re-populate to update owned status
            const activeTab = document.querySelector(".shop-tab.active");
            const category = activeTab ? activeTab.textContent : "All";
            this.populateShopItems(this.currentShopInventory, category);
            
            this.updateUI();
        } else {
            this.log("You don't have enough gold!", "danger");
        }
    }
    
    closeShop() {
        const shopModal = document.getElementById("shopModal");
        if (shopModal) {
            shopModal.classList.remove("active");
        }
    }
    
    // ==================== JOURNAL SYSTEM ====================
    openJournal() {
        let modal = document.getElementById("journalModal");
        if (!modal) {
            modal = document.createElement("div");
            modal.id = "journalModal";
            modal.className = "modal";
            document.body.appendChild(modal);
        }
        
        const journal = this.character.journal;
        
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 600px;">
                <h2>📜 Journal</h2>
                
                <div class="journal-tabs">
                    <button class="journal-tab active" onclick="game.showJournalTab('quests')">Quests</button>
                    <button class="journal-tab" onclick="game.showJournalTab('npcs')">NPCs</button>
                    <button class="journal-tab" onclick="game.showJournalTab('lore')">Lore</button>
                    <button class="journal-tab" onclick="game.showJournalTab('reputation')">Reputation</button>
                </div>
                
                <div id="journalContent" class="journal-content">
                    ${this.renderJournalQuests()}
                </div>
                
                <button class="close-modal" onclick="game.closeJournal()">Close</button>
            </div>
        `;
        
        modal.classList.add("active");
    }
    
    showJournalTab(tab) {
        // Update tab styling
        document.querySelectorAll('.journal-tab').forEach(t => t.classList.remove('active'));
        event.target.classList.add('active');
        
        const content = document.getElementById("journalContent");
        switch(tab) {
            case 'quests': content.innerHTML = this.renderJournalQuests(); break;
            case 'npcs': content.innerHTML = this.renderJournalNPCs(); break;
            case 'lore': content.innerHTML = this.renderJournalLore(); break;
            case 'reputation': content.innerHTML = this.renderJournalReputation(); break;
        }
    }
    
    renderJournalQuests() {
        const quests = this.character.journal.quests;
        if (quests.length === 0) {
            return '<p style="color: #888;">No quests recorded yet.</p>';
        }
        return quests.map(q => `
            <div class="journal-entry">
                <div class="journal-title">${q.completed ? '✅' : '📋'} ${q.name || q.id}</div>
                <div class="journal-text">${q.description || ''}</div>
            </div>
        `).join('');
    }
    
    renderJournalNPCs() {
        const npcs = this.character.journal.npcs;
        if (npcs.length === 0) {
            return '<p style="color: #888;">No NPCs recorded yet.</p>';
        }
        return npcs.map(n => `
            <div class="journal-entry">
                <div class="journal-title">👤 ${n.name}</div>
                <div class="journal-text">${n.notes || n.role || ''}</div>
            </div>
        `).join('');
    }
    
    renderJournalLore() {
        const lore = this.character.journal.lore;
        if (lore.length === 0) {
            return '<p style="color: #888;">No lore discovered yet.</p>';
        }
        return lore.map(l => `
            <div class="journal-entry">
                <div class="journal-title">📚 ${l.title}</div>
                <div class="journal-text">${l.text || ''}</div>
            </div>
        `).join('');
    }
    
    renderJournalReputation() {
        const rep = this.character.reputation;
        const factionNames = {
            commoners: "Common Folk",
            nobility: "Nobility",
            merchants: "Merchants Guild",
            thieves_guild: "Thieves Guild",
            military: "Military",
            church: "The Church"
        };
        
        return Object.keys(rep).map(faction => {
            const value = rep[faction];
            const level = this.character.getReputationLevel(faction);
            const color = value >= 25 ? '#2ecc71' : value >= 0 ? '#f1c40f' : '#e74c3c';
            return `
                <div class="journal-entry">
                    <div class="journal-title">${factionNames[faction] || faction}</div>
                    <div class="journal-text" style="color: ${color};">${level} (${value >= 0 ? '+' : ''}${value})</div>
                </div>
            `;
        }).join('');
    }
    
    closeJournal() {
        const modal = document.getElementById("journalModal");
        if (modal) modal.classList.remove("active");
    }
    
    // ==================== NPC TALK SYSTEM ====================
    getAvailableNPCs() {
        const currentLoc = this.dm.currentLocation;
        const campaignNPCs = this.dm.campaign.npcs || {};
        const available = [];
        
        // Get NPCs based on their availability
        for (const [npcId, npc] of Object.entries(campaignNPCs)) {
            if (this.isNPCAvailable(npcId, currentLoc)) {
                available.push({ id: npcId, ...npc });
            }
        }
        
        return available;
    }
    
    isNPCAvailable(npcId, currentLoc) {
        const flags = this.dm.questFlags;
        const chapter = this.dm.currentChapter;
        const campaignId = this.dm.campaignId;
        const locName = currentLoc.name.toLowerCase();
        
        if (campaignId === "keep_on_borderlands") {
            if (npcId === "Castellan" && locName.includes("inner bailey")) return true;
            if (npcId === "Priest" && locName.includes("chapel")) return true;
            if (npcId === "Merchant" && locName.includes("bailey")) return true;
            if (npcId === "Innkeeper" && locName.includes("tavern")) return true;
        }
        
        if (campaignId === "nights_dark_terror") {
            if (npcId === "Stephan" && chapter === 0) return true;
            if (npcId === "Pyotr" && flags.reachedSukiskyn && locName.includes("sukiskyn")) return true;
            if (npcId === "Taras" && flags.rescuedTaras) return true;
        }
        
        if (campaignId === "curse_of_strahd") {
            if (npcId === "Ismark" && locName.includes("barovia") && !locName.includes("castle")) return true;
            if (npcId === "Ireena" && flags.metIreena && locName.includes("barovia")) return true;
            if (npcId === "MadamEva" && locName.includes("tser pool")) return true;
            if (npcId === "Bildrath" && locName.includes("mercantile")) return true;
        }
        
        if (campaignId === "tomb_of_annihilation") {
            if (npcId === "Syndra" && chapter === 0) return true;
            if (npcId === "Azaka" && locName.includes("port nyanzaru") && flags.arrivedPort) return true;
            if (npcId === "Merchant" && locName.includes("port nyanzaru")) return true;
        }
        
        if (campaignId === "lost_mine_of_phandelver") {
            if (npcId === "Gundren" && chapter === 0) return true;
            if (npcId === "Sildar" && flags.rescuedSildar && locName.includes("phandalin")) return true;
            if (npcId === "ElmarBarthen" && locName.includes("barthen")) return true;
            if (npcId === "ElmarBarthen" && locName.includes("town square")) return true;
            if (npcId === "Glasstaff" && locName.includes("glasstaff") && !flags.defeatedGlassstaff) return true;
            if (npcId === "Nezznar" && locName.includes("temple of dumathoin") && !flags.defeatedBlackSpider) return true;
        }
        
        return false;
    }
    
    openTalkMenu() {
        const npcs = this.getAvailableNPCs();
        
        if (npcs.length === 0) {
            this.log("There's no one here to talk to.", "dm");
            return;
        }
        
        let modal = document.getElementById("talkModal");
        if (!modal) {
            modal = document.createElement("div");
            modal.id = "talkModal";
            modal.className = "modal";
            document.body.appendChild(modal);
        }
        
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 500px;">
                <h2>💬 Talk to...</h2>
                <div class="npc-list" style="max-height: 400px; overflow-y: auto;">
                    ${npcs.map(npc => `
                        <div class="npc-option" onclick="game.talkToNPC('${npc.id}')" style="padding: 15px; margin: 10px 0; background: rgba(255,255,255,0.05); border-radius: 8px; cursor: pointer; border: 2px solid #c9a227; transition: all 0.3s;" onmouseover="this.style.background='rgba(201,162,39,0.2)'" onmouseout="this.style.background='rgba(255,255,255,0.05)'">
                            <div class="npc-name" style="font-size: 18px; font-weight: bold; color: #c9a227; margin-bottom: 5px;">👤 ${npc.name || npc.id}</div>
                            <div class="npc-role" style="font-size: 14px; color: #aaa; margin-bottom: 5px;">${npc.role || ''}</div>
                            <div class="npc-desc" style="font-size: 13px; color: #999;">${npc.description || ''}</div>
                        </div>
                    `).join('')}
                </div>
                <button class="close-modal" onclick="game.closeTalkMenu()">Close</button>
            </div>
        `;
        
        modal.classList.add("active");
    }
    
    talkToNPC(npcId) {
        const npc = this.dm.campaign.npcs[npcId];
        if (!npc) return;
        
        this.closeTalkMenu();
        
        // Add NPC to journal if not already there
        if (!this.character.journal.npcs.find(n => n.name === npc.name)) {
            this.character.addJournalEntry('npc', {
                name: npc.name,
                notes: npc.description || npc.role || "Met in " + this.dm.currentLocation.name
            });
        }
        
        // Show dialogue
        this.log(`💬 You approach ${npc.name}...`, "dm");
        
        if (npc.dialogue && npc.dialogue.length > 0) {
            const dialogue = Array.isArray(npc.dialogue) ? npc.dialogue[0] : npc.dialogue;
            this.log(`<em>"${dialogue}"</em>`, "dm");
        }
        
        // Trigger any quest-related events
        this.checkNPCQuestTriggers(npcId);
        
        this.updateUI();
    }
    
    checkNPCQuestTriggers(npcId) {
        const flags = this.dm.questFlags;
        const campaignId = this.dm.campaignId;
        
        // Handle quest-giving NPCs
        if (campaignId === "keep_on_borderlands") {
            if (npcId === "Castellan" && !flags.metCastellan) {
                this.triggerStoryEvent("meetCastellan");
            }
        }
        
        if (campaignId === "curse_of_strahd") {
            if (npcId === "Ismark" && !flags.metIsmark) {
                this.triggerStoryEvent("meetIsmark");
            }
            if (npcId === "MadamEva" && !flags.visitedMadamEva) {
                this.triggerStoryEvent("visitMadamEva");
            }
        }
        
        if (campaignId === "tomb_of_annihilation") {
            if (npcId === "Syndra" && !flags.metSyndra) {
                this.triggerStoryEvent("intro_toa");
            }
            if (npcId === "Azaka" && !flags.hiredGuide) {
                this.triggerStoryEvent("meetGuide");
            }
        }
        
        if (campaignId === "nights_dark_terror") {
            if (npcId === "Stephan" && !flags.intro) {
                this.triggerStoryEvent("intro");
            }
        }
        
        if (campaignId === "lost_mine_of_phandelver") {
            if (npcId === "ElmarBarthen" && !flags.metBarthen) {
                this.triggerStoryEvent("meetBarthen");
            }
            if (npcId === "Sildar" && flags.rescuedSildar && !flags.learnedRedbrands) {
                this.triggerStoryEvent("sildarWarnsRedbrands");
            }
        }
    }
    
    closeTalkMenu() {
        const modal = document.getElementById("talkModal");
        if (modal) modal.classList.remove("active");
    }
    
    // ==================== CRAFTING SYSTEM ====================
    openCrafting() {
        let modal = document.getElementById("craftingModal");
        if (!modal) {
            modal = document.createElement("div");
            modal.id = "craftingModal";
            modal.className = "modal";
            document.body.appendChild(modal);
        }
        
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 550px;">
                <h2>🔨 Crafting</h2>
                
                <div class="crafting-section">
                    <h3>📦 Your Materials</h3>
                    <div class="materials-list">
                        ${this.renderMaterials()}
                    </div>
                </div>
                
                <div class="crafting-section">
                    <h3>📜 Recipes</h3>
                    <div class="recipes-list">
                        ${this.renderRecipes()}
                    </div>
                </div>
                
                <button class="close-modal" onclick="game.closeCrafting()">Close</button>
            </div>
        `;
        
        modal.classList.add("active");
    }
    
    renderMaterials() {
        const materials = this.character.materials;
        const entries = Object.entries(materials).filter(([_, count]) => count > 0);
        
        if (entries.length === 0) {
            return '<p style="color: #888;">No materials collected yet. Defeat monsters to gather materials!</p>';
        }
        
        return entries.map(([mat, count]) => `
            <div class="material-item">
                <span class="material-name">${mat}</span>
                <span class="material-count">x${count}</span>
            </div>
        `).join('');
    }
    
    renderRecipes() {
        return Object.entries(CRAFTING_RECIPES).map(([name, recipe]) => {
            const canCraft = this.canCraftRecipe(recipe);
            const materialsText = Object.entries(recipe.materials)
                .map(([mat, count]) => `${count}x ${mat}`)
                .join(', ');
            
            return `
                <div class="recipe-item ${canCraft ? '' : 'disabled'}">
                    <div class="recipe-header">
                        <span class="recipe-name">${name}</span>
                        <span class="recipe-dc">DC ${recipe.dc} ${recipe.skill}</span>
                    </div>
                    <div class="recipe-materials">${materialsText}</div>
                    <div class="recipe-result">Creates: ${recipe.result}</div>
                    <button class="craft-btn" ${canCraft ? `onclick="game.craftItem('${name}')"` : 'disabled'}>
                        ${canCraft ? 'Craft' : 'Missing Materials'}
                    </button>
                </div>
            `;
        }).join('');
    }
    
    canCraftRecipe(recipe) {
        for (const [material, needed] of Object.entries(recipe.materials)) {
            if ((this.character.materials[material] || 0) < needed) {
                return false;
            }
        }
        return true;
    }
    
    craftItem(recipeName) {
        const recipe = CRAFTING_RECIPES[recipeName];
        if (!recipe || !this.canCraftRecipe(recipe)) {
            this.log("You don't have the required materials!", "danger");
            return;
        }
        
        // Consume materials
        for (const [material, needed] of Object.entries(recipe.materials)) {
            this.character.useMaterial(material, needed);
        }
        
        // Skill check
        const stat = recipe.skill === "Nature" ? "wis" : recipe.skill === "Arcana" ? "int" : "dex";
        const check = this.dm.skillCheck(stat, recipe.dc);
        
        if (check.success) {
            this.character.inventory.push(recipe.result);
            this.log(`✅ Crafting success! (${check.total} vs DC ${recipe.dc}) Created: ${recipe.result}`, "success");
        } else {
            this.log(`❌ Crafting failed! (${check.total} vs DC ${recipe.dc}) Materials lost.`, "danger");
        }
        
        // Refresh the crafting UI
        this.openCrafting();
        this.updateUI();
    }
    
    closeCrafting() {
        const modal = document.getElementById("craftingModal");
        if (modal) modal.classList.remove("active");
    }
    
    // ==================== PARTY MANAGEMENT ====================
    openPartyPanel() {
        let modal = document.getElementById("partyModal");
        if (!modal) {
            modal = document.createElement("div");
            modal.id = "partyModal";
            modal.className = "modal";
            document.body.appendChild(modal);
        }
        
        const partyStatus = this.dm.getPartyStatus();
        const availableCompanions = this.getAvailableCompanions();
        
        // Check if player has healing items
        const hasHealingPotion = this.character.inventory.includes("Potion of Healing");
        const hasGreaterHealing = this.character.inventory.includes("Potion of Greater Healing");
        
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 650px;">
                <h2>👥 Party Management</h2>
                
                <div class="party-section">
                    <h3>⚔️ Current Party (${this.dm.party.length + 1}/${this.dm.maxPartySize})</h3>
                    <div class="party-member leader">
                        <div class="member-info">
                            <span class="member-name">👑 ${this.character.name} (You)</span>
                            <span class="member-class">${this.character.charClass} ${this.character.level}</span>
                        </div>
                        <div class="member-hp">
                            HP: ${this.character.hp}/${this.character.maxHp}
                        </div>
                    </div>
                    ${partyStatus.map(c => {
                        const needsHealing = c.hp < c.maxHp;
                        const hpPercent = (c.hp / c.maxHp) * 100;
                        const hpClass = c.hp <= 0 ? 'critical' : c.hp <= c.maxHp / 4 ? 'critical' : c.hp <= c.maxHp / 2 ? 'wounded' : 'healthy';
                        return `
                        <div class="party-member ${c.hp <= 0 ? 'unconscious' : ''}">
                            <div class="member-info">
                                <span class="member-name">🛡️ ${c.name}</span>
                                <span class="member-class">${c.class} - ${c.status}</span>
                            </div>
                            <div class="member-stats">
                                <div class="companion-hp-bar-container">
                                    <div class="companion-hp-bar ${hpClass}" style="width: ${hpPercent}%"></div>
                                    <span class="companion-hp-text">HP: ${c.hp}/${c.maxHp}</span>
                                </div>
                                <span>Loyalty: ${this.getLoyaltyEmoji(c.loyalty)} ${c.loyalty}</span>
                            </div>
                            <div class="member-actions">
                                ${needsHealing ? `
                                    ${hasHealingPotion ? `<button class="heal-btn" onclick="game.healCompanionWithPotion('${c.name}', 'Potion of Healing')">🧪 Heal (2d4+2)</button>` : ''}
                                    ${hasGreaterHealing ? `<button class="heal-btn" onclick="game.healCompanionWithPotion('${c.name}', 'Potion of Greater Healing')">🧪 Greater (4d4+4)</button>` : ''}
                                    ${!hasHealingPotion && !hasGreaterHealing ? '<span class="no-heals">No healing potions</span>' : ''}
                                ` : '<span class="full-hp">✓ Full HP</span>'}
                                <button class="small-btn dismiss" onclick="game.dismissCompanionUI('${c.name}')">Dismiss</button>
                            </div>
                        </div>
                    `}).join('') || '<p style="color: #888;">No companions in party.</p>'}
                </div>
                
                ${availableCompanions.length > 0 ? `
                    <div class="party-section">
                        <h3>📢 Available Companions</h3>
                        ${availableCompanions.map(c => `
                            <div class="companion-option">
                                <div class="companion-info">
                                    <span class="companion-name">${c.name}</span>
                                    <span class="companion-desc">${c.race} ${c.class} (Level ${c.level})</span>
                                    <span class="companion-personality">"${c.dialogue.greeting}"</span>
                                </div>
                                <button class="recruit-btn" onclick="game.recruitCompanionUI('${c.name}')">Recruit</button>
                            </div>
                        `).join('')}
                    </div>
                ` : ''}
                
                <button class="close-modal" onclick="game.closePartyPanel()">Close</button>
            </div>
        `;
        
        modal.classList.add("active");
    }
    
    healCompanionWithPotion(companionName, potionType) {
        // Check if player has the potion
        const potionIndex = this.character.inventory.indexOf(potionType);
        if (potionIndex === -1) {
            this.log(`You don't have a ${potionType}!`, "danger");
            return;
        }
        
        // Find the companion
        const companion = this.dm.party.find(c => c.name === companionName);
        if (!companion) {
            this.log(`${companionName} is not in your party!`, "danger");
            return;
        }
        
        // Calculate healing
        let healing = 0;
        if (potionType === "Potion of Healing") {
            healing = this.dm.rollDice("2d4") + 2;
        } else if (potionType === "Potion of Greater Healing") {
            healing = this.dm.rollDice("4d4") + 4;
        }
        
        // Apply healing
        const oldHp = companion.currentHp;
        companion.currentHp = Math.min(companion.maxHp, companion.currentHp + healing);
        const actualHealing = companion.currentHp - oldHp;
        
        // Remove potion from inventory
        this.character.inventory.splice(potionIndex, 1);
        
        // Log and feedback
        if (oldHp <= 0 && companion.currentHp > 0) {
            this.log(`💚 You revive ${companionName} with a ${potionType}! They regain ${actualHealing} HP and are back on their feet!`, "success");
            this.dm.adjustCompanionLoyalty(companionName, 10, "healed from unconscious");
        } else {
            this.log(`💚 You give ${companionName} a ${potionType}. They recover ${actualHealing} HP! (${companion.currentHp}/${companion.maxHp})`, "success");
            this.dm.adjustCompanionLoyalty(companionName, 3, "healed");
        }
        
        soundManager.playHeal();
        
        // Refresh UI
        this.closePartyPanel();
        this.openPartyPanel();
        this.updateCombatPartyDisplay();
        this.updateUI();
    }
    
    getAvailableCompanions() {
        const campaignCompanions = COMPANIONS[this.dm.campaignId] || {};
        const available = [];
        
        for (const [name, companion] of Object.entries(campaignCompanions)) {
            if (this.dm.canRecruitCompanion(name)) {
                available.push(companion);
            }
        }
        
        return available;
    }
    
    getLoyaltyEmoji(loyalty) {
        if (loyalty >= 75) return '💖';
        if (loyalty >= 50) return '💚';
        if (loyalty >= 25) return '💛';
        if (loyalty >= 0) return '🤍';
        return '💔';
    }
    
    recruitCompanionUI(name) {
        const companion = this.dm.recruitCompanion(name);
        if (companion) {
            this.log(`🤝 ${companion.name} joins your party! "${companion.dialogue.greeting}"`, "success");
            this.closePartyPanel();
            this.openPartyPanel();
        }
    }
    
    dismissCompanionUI(name) {
        const result = this.dm.dismissCompanion(name);
        if (result.success) {
            this.log(`👋 ${result.message}`, "dm");
            this.closePartyPanel();
            this.openPartyPanel();
        }
    }
    
    closePartyPanel() {
        const modal = document.getElementById("partyModal");
        if (modal) modal.classList.remove("active");
    }
    
    // ==================== INSPIRATION SYSTEM ====================
    openInspirationPanel() {
        let modal = document.getElementById("inspirationModal");
        if (!modal) {
            modal = document.createElement("div");
            modal.id = "inspirationModal";
            modal.className = "modal";
            document.body.appendChild(modal);
        }
        
        const hasInspiration = this.character.inspiration;
        const personality = this.character.personality;
        
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 500px;">
                <h2>✨ Inspiration & Personality</h2>
                
                <div class="inspiration-status">
                    <span class="inspiration-icon">${hasInspiration ? '⭐' : '☆'}</span>
                    <span>Inspiration: ${hasInspiration ? 'Available!' : 'None'}</span>
                </div>
                
                <div class="personality-section">
                    <h3>🎭 Your Personality</h3>
                    <div class="personality-trait">
                        <strong>Trait:</strong> ${personality.trait || 'Unknown'}
                    </div>
                    <div class="personality-trait">
                        <strong>Ideal:</strong> ${personality.ideal || 'Unknown'}
                    </div>
                    <div class="personality-trait">
                        <strong>Bond:</strong> ${personality.bond || 'Unknown'}
                    </div>
                    <div class="personality-trait">
                        <strong>Flaw:</strong> ${personality.flaw || 'Unknown'}
                    </div>
                </div>
                
                <div class="exhaustion-section">
                    <h3>😓 Exhaustion Level: ${this.character.exhaustion}/6</h3>
                    <div class="exhaustion-bar">
                        ${[1,2,3,4,5,6].map(i => 
                            `<div class="exhaust-pip ${this.character.exhaustion >= i ? 'active' : ''}"></div>`
                        ).join('')}
                    </div>
                    ${this.character.exhaustion > 0 ? `
                        <div class="exhaustion-effects">
                            <strong>Effects:</strong>
                            ${this.dm.getExhaustionPenalties().map(p => `<div>• ${p.name}</div>`).join('')}
                        </div>
                    ` : '<p style="color: #2ecc71;">No exhaustion effects.</p>'}
                </div>
                
                <button class="close-modal" onclick="game.closeInspirationPanel()">Close</button>
            </div>
        `;
        
        modal.classList.add("active");
    }
    
    closeInspirationPanel() {
        const modal = document.getElementById("inspirationModal");
        if (modal) modal.classList.remove("active");
    }
    
    // ==================== TAVERN RUMORS ====================
    async askForRumors() {
        const rumor = this.dm.getRandomRumor();
        
        this.log(`🍺 You buy a round of drinks and chat with the locals...`, "dm");
        await this.delay(1000);
        
        this.log(`📢 A patron leans in and whispers: "${rumor}"`, "dm");
        
        // Add to lore journal
        if (!this.character.journal.lore.find(l => l.text === rumor)) {
            this.character.journal.lore.push({
                title: "Tavern Rumor",
                text: rumor
            });
        }
        
        // Small gold cost
        if (this.character.gold >= 2) {
            this.character.gold -= 2;
            this.log(`💰 You spent 2 gold on drinks.`, "dm");
        }
        
        this.updateUI();
    }
    
    // ==================== DOWNTIME ACTIVITIES ====================
    openDowntimePanel() {
        let modal = document.getElementById("downtimeModal");
        if (!modal) {
            modal = document.createElement("div");
            modal.id = "downtimeModal";
            modal.className = "modal";
            document.body.appendChild(modal);
        }
        
        const activities = DOWNTIME_ACTIVITIES;
        const currentActivity = this.character.downtime.currentActivity;
        
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 550px;">
                <h2>🏠 Downtime Activities</h2>
                
                <div class="downtime-info">
                    <p>Days available: ${this.character.downtime.daysAvailable}</p>
                    ${currentActivity ? `
                        <div class="current-activity">
                            <strong>Current Activity:</strong> ${currentActivity}
                            <br>Progress: ${this.character.downtime.progress} / ${activities[currentActivity].daysRequired} days
                        </div>
                    ` : ''}
                </div>
                
                <div class="activities-list">
                    ${Object.entries(activities).map(([name, activity]) => `
                        <div class="activity-option ${currentActivity === name ? 'active' : ''}">
                            <div class="activity-name">${name}</div>
                            <div class="activity-desc">${activity.description}</div>
                            <div class="activity-cost">
                                ${activity.daysRequired} days | ${activity.costPerDay}gp/day
                            </div>
                            ${!currentActivity ? `
                                <button class="small-btn" onclick="game.startDowntime('${name}')">Start</button>
                            ` : ''}
                        </div>
                    `).join('')}
                </div>
                
                ${currentActivity ? `
                    <button class="action-btn" onclick="game.progressDowntime(1)">Spend 1 Day</button>
                    <button class="action-btn" onclick="game.progressDowntime(7)">Spend 1 Week</button>
                ` : ''}
                
                <button class="close-modal" onclick="game.closeDowntimePanel()">Close</button>
            </div>
        `;
        
        modal.classList.add("active");
    }
    
    startDowntime(activity) {
        const result = this.dm.startDowntimeActivity(activity);
        if (result.success) {
            this.log(`📋 You begin ${activity}. It will take ${result.daysRequired} days.`, "dm");
            this.closeDowntimePanel();
            this.openDowntimePanel();
        }
    }
    
    progressDowntime(days) {
        const result = this.dm.advanceDowntime(days);
        if (result.success) {
            if (result.message) {
                // Activity completed
                this.log(`✅ ${result.message}`, "success");
            } else {
                this.log(`⏳ Progress: ${result.progress} days. ${result.remaining} days remaining.`, "dm");
            }
            this.closeDowntimePanel();
            this.openDowntimePanel();
            this.updateUI();
        } else {
            this.log(`❌ ${result.message || 'Cannot progress downtime.'}`, "danger");
        }
    }
    
    closeDowntimePanel() {
        const modal = document.getElementById("downtimeModal");
        if (modal) modal.classList.remove("active");
    }
    
    // ==================== CHARACTER STATUS DISPLAY ====================
    getCharacterVoiceLine(situation) {
        const voiceStyle = this.character.voiceStyle;
        const personality = this.character.personality;
        
        const lines = {
            combat_start: [
                "Let's end this quickly.",
                "Prepare yourself!",
                "Another battle awaits.",
                "May fortune favor us."
            ],
            victory: [
                "That's handled.",
                "Well fought!",
                "Victory is ours.",
                "The enemy falls."
            ],
            hurt: [
                "I can take more than that!",
                "A scratch, nothing more.",
                "You'll pay for that!",
                "I've had worse."
            ],
            low_hp: [
                "I need to be careful...",
                "This isn't going well.",
                "I must retreat and recover.",
                "Hold on... just hold on..."
            ]
        };
        
        const situationLines = lines[situation] || lines.combat_start;
        return situationLines[Math.floor(Math.random() * situationLines.length)];
    }

    async treasureChestEvent() {
        // Determine chest rarity based on location danger
        const danger = this.dm.currentLocation.danger || 1;
        const trapDC = 10 + danger * 2;
        let rarity = "common";
        if (danger >= 4) rarity = "epic";
        else if (danger >= 3) rarity = "rare";
        else if (danger >= 2) rarity = "uncommon";
        
        const loot = GAME_DATA.chestLoot[rarity];
        const campaignItems = GAME_DATA.campaignItems[this.dm.campaignId];
        
        this.log("✨ You discover a treasure chest!", "dm");
        
        // Passive Perception auto-detects traps
        const passivePerc = this.character.getPassivePerception();
        let trapAutoDetected = false;
        if (passivePerc >= trapDC) {
            trapAutoDetected = true;
            this.log(`👁️ Your keen senses (Passive Perception ${passivePerc}) detect a trap on the chest!`, "success");
        }
        
        // Darkvision/light interaction
        const isDark = this.dm.timeOfDay === "night";
        const hasDarkvision = this.character.hasDarkvision();
        let darkPenalty = "";
        if (isDark && !hasDarkvision) {
            darkPenalty = " (Harder to see in the dark!)";
        }
        
        // Show chest with DC hints for trap detection
        const choice = await this.showChoiceWithDC(
            "📦 Treasure Chest",
            `You've found a ${rarity} treasure chest! It looks ${danger >= 3 ? "heavily locked" : "old but intact"}.${trapAutoDetected ? ' You can see a trap mechanism!' : ''}${darkPenalty}`,
            [
                { text: trapAutoDetected ? "Open it (trap disarmed)" : "Open it", skill: null },
                { text: "Check for traps first", skill: "dex", dc: trapDC },
                { text: "Leave it alone", skill: null }
            ]
        );
        
        if (choice === 2) {
            this.log("You decide not to risk it and move on.", "dm");
            return;
        }
        
        let trapTriggered = false;
        
        if (choice === 0) {
            if (trapAutoDetected) {
                this.log("🔓 You disarm the detected trap and safely open the chest!", "success");
            } else if (Math.random() < (danger * 0.15)) {
                trapTriggered = true;
            }
        } else if (choice === 1) {
            // Check for traps - Investigation (INT) or Perception (WIS) check with proficiency
            const hasDisadvantage = isDark && !hasDarkvision;
            const check = await this.dm.skillCheckAnimated("int", trapDC, false, hasDisadvantage, "Investigation");
            if (check.success) {
                this.log(`🔍 You carefully examine the chest and disarm a hidden trap! (Roll: ${check.total} vs DC ${trapDC})`, "success");
            } else {
                this.log(`🔍 You fail to notice the trap! (Roll: ${check.total} vs DC ${trapDC})`, "danger");
                trapTriggered = true;
            }
        }
        
        if (trapTriggered) {
            const trapDamage = Math.floor(Math.random() * (danger * 3)) + danger;
            this.character.takeDamage(trapDamage);
            this.log(`💥 A trap springs! You take ${trapDamage} damage!`, "danger");
            
            if (this.character.hp <= 0) {
                this.gameOver();
                return;
            }
        }
        
        // Give loot!
        const [minGold, maxGold] = loot.goldRange;
        const gold = Math.floor(Math.random() * (maxGold - minGold + 1)) + minGold;
        this.character.gold += gold;
        this.log(`💰 You find ${gold} gold!`, "loot");
        
        // Build item pool from standard + campaign items
        let itemPool = [...loot.items];
        
        // Add campaign-specific items to the loot pool based on rarity
        if (campaignItems) {
            if (rarity === "epic" || rarity === "rare") {
                // Rare/Epic chests can have boss-tier campaign items
                if (campaignItems.bossLoot) {
                    const campItems = campaignItems.bossLoot.filter(() => Math.random() < 0.3);
                    itemPool = [...itemPool, ...campItems];
                }
            } else {
                // Common/Uncommon chests get regular campaign loot items
                if (campaignItems.lootItems) {
                    const campItems = campaignItems.lootItems.filter(() => Math.random() < 0.4);
                    itemPool = [...itemPool, ...campItems];
                }
                // Also add campaign consumables
                if (campaignItems.consumables) {
                    const consumableItems = Object.keys(campaignItems.consumables).filter(() => Math.random() < 0.3);
                    itemPool = [...itemPool, ...consumableItems];
                }
            }
        }
        
        // Give 1-2 items from the loot pool
        const numItems = Math.floor(Math.random() * 2) + 1;
        for (let i = 0; i < numItems; i++) {
            const item = itemPool[Math.floor(Math.random() * itemPool.length)];
            const isStackable = item.includes("Potion") || item.includes("Rations") || item.includes("Torch") || 
                                item.includes("Wine") || item.includes("Holy Water") || item.includes("Brandy") ||
                                item.includes("Antidote") || item.includes("Antivenom") || item.includes("Tej");
            
            if (!this.character.inventory.includes(item) || isStackable) {
                this.character.inventory.push(item);
                
                // Get item description - check campaign items too
                let desc = "";
                let isCampaignItem = false;
                
                if (campaignItems && campaignItems.weapons && campaignItems.weapons[item]) {
                    const w = campaignItems.weapons[item];
                    desc = ` (${w.damage} ${w.type})`;
                    isCampaignItem = true;
                } else if (campaignItems && campaignItems.armor && campaignItems.armor[item]) {
                    const a = campaignItems.armor[item];
                    desc = ` (AC ${a.ac})`;
                    isCampaignItem = true;
                } else if (campaignItems && campaignItems.shields && campaignItems.shields[item]) {
                    const s = campaignItems.shields[item];
                    desc = ` (+${s.acBonus} AC)`;
                    isCampaignItem = true;
                } else if (campaignItems && campaignItems.consumables && campaignItems.consumables[item]) {
                    isCampaignItem = true;
                } else if (GAME_DATA.weapons[item]) {
                    const w = GAME_DATA.weapons[item];
                    desc = ` (${w.damage} ${w.type})`;
                } else if (GAME_DATA.armor[item]) {
                    const a = GAME_DATA.armor[item];
                    desc = ` (AC ${a.ac})`;
                } else if (GAME_DATA.shields[item]) {
                    const s = GAME_DATA.shields[item];
                    desc = ` (+${s.acBonus} AC)`;
                }
                
                this.log(`📦 Found: ${item}${desc}${isCampaignItem ? ' ⭐' : ''}!`, "loot");
            }
        }
        
        this.updateUI();
    }

    async mysteriousStrangerEvent() {
        this.log("A hooded figure beckons you closer...", "dm");
        
        const choice = await this.showChoiceWithDC(
            "🕵️ Mysterious Stranger",
            "A hooded figure beckons you from the shadows...",
            [
                { text: "Approach", skill: null },
                { text: "Ignore", skill: null }
            ]
        );
        
        if (choice === 0) {
            if (Math.random() < 0.5) {
                const gold = Math.floor(Math.random() * 21) + 10;
                this.character.gold += gold;
                this.log(`The stranger rewards your bravery with ${gold} gold!`, "success");
            } else {
                const damage = Math.floor(Math.random() * 7) + 2;
                this.character.takeDamage(damage);
                this.log("It's a trap!", "danger");
                this.log(`You take ${damage} damage from a hidden blade!`, "danger");
                
                if (this.character.hp <= 0) {
                    this.gameOver();
                    return;
                }
            }
        } else {
            this.log("Wisdom keeps you safe... this time.", "dm");
        }
        
        this.updateUI();
    }

    async trappedChestEvent() {
        this.log("You discover an old chest covered in dust.", "dm");
        const trapDC = 12;
        
        // Passive Perception auto-detect
        const passivePerc = this.character.getPassivePerception();
        if (passivePerc >= trapDC) {
            this.log(`👁️ Passive Perception (${passivePerc}) detects a trap!`, "success");
        }
        
        const choice = await this.showChoiceWithDC(
            "📦 Mysterious Chest",
            `You discover an old chest covered in dust...${passivePerc >= trapDC ? ' You notice a trap mechanism!' : ''}`,
            [
                { text: passivePerc >= trapDC ? "Open it (trap disarmed)" : "Open it", skill: null },
                { text: "Check for traps first", skill: "int", dc: trapDC },
                { text: "Leave it", skill: null }
            ]
        );
        
        if (choice === 0) {
            if (passivePerc >= trapDC) {
                // Auto-disarmed
                const gold = Math.floor(Math.random() * 41) + 20;
                this.character.gold += gold;
                this.log(`You disarm the trap and find ${gold} gold!`, "loot");
            } else if (Math.random() < 0.4) {
                const damage = Math.floor(Math.random() * 10) + 3;
                this.character.takeDamage(damage);
                this.log(`💥 A trap! You take ${damage} damage!`, "danger");
                
                if (this.character.hp <= 0) {
                    this.gameOver();
                    return;
                }
            } else {
                const gold = Math.floor(Math.random() * 36) + 15;
                this.character.gold += gold;
                this.log(`Inside you find ${gold} gold!`, "loot");
            }
        } else if (choice === 1) {
            const check = await this.dm.skillCheckAnimated("int", trapDC, false, false, "Investigation");
            if (check.success) {
                this.log(`You disarm the trap! (Roll: ${check.roll}+${check.modifier}=${check.total} vs DC ${trapDC})`, "success");
                const gold = Math.floor(Math.random() * 41) + 20;
                this.character.gold += gold;
                this.log(`You find ${gold} gold!`, "loot");
            } else {
                this.log(`You trigger the trap! (Roll: ${check.roll}+${check.modifier}=${check.total} vs DC ${trapDC})`, "danger");
                const damage = Math.floor(Math.random() * 7) + 2;
                this.character.takeDamage(damage);
                this.log(`You take ${damage} damage!`, "danger");
                
                if (this.character.hp <= 0) {
                    this.gameOver();
                    return;
                }
            }
        } else {
            this.log("You leave the chest alone.", "dm");
        }
        
        this.updateUI();
    }

    async healingSpringEvent() {
        this.log("You discover a natural spring with crystal-clear water.", "dm");
        this.log("The water glows with a faint magical aura.", "dm");
        
        const choice = await this.showChoiceWithDC(
            "✨ Healing Spring",
            "The water glows with a faint magical aura...",
            [
                { text: "Drink from the spring", skill: null },
                { text: "Leave it alone", skill: null }
            ]
        );
        
        if (choice === 0) {
            const heal = Math.floor(Math.random() * 11) + 5;
            this.character.heal(heal);
            this.log(`✨ The magical water heals you for ${heal} HP!`, "success");
        } else {
            this.log("You continue on your way.", "dm");
        }
        
        this.updateUI();
    }

    useItem(item) {
        if (this.dm.inCombat) {
            this.log("You can't use items during combat!", "danger");
            return;
        }
        
        // Cannot use items while unconscious
        if (this.character.hp <= 0) {
            this.log("You're unconscious! You need to rest to recover.", "danger");
            return;
        }
        
        // Remove item from inventory
        const removeItem = () => {
            const index = this.character.inventory.indexOf(item);
            if (index > -1) {
                this.character.inventory.splice(index, 1);
            }
        };
        
        // Check for campaign-specific consumables first
        const campaignItems = GAME_DATA.campaignItems[this.dm.campaignId];
        if (campaignItems && campaignItems.consumables && campaignItems.consumables[item]) {
            const consumable = campaignItems.consumables[item];
            
            if (consumable.effect === "heal" && consumable.healAmount) {
                const heal = this.dm.rollDice(consumable.healAmount);
                this.character.heal(heal);
                removeItem();
                this.log(`✨ You use the ${item} and heal ${heal} HP!`, "success");
                this.updateUI();
                return;
            } else if (consumable.effect === "courage") {
                removeItem();
                this.log(`🍺 You drink the ${item}. You feel courageous! (Advantage on fear saves for 1 hour)`, "success");
                this.updateUI();
                return;
            } else if (consumable.effect === "wolfsbane") {
                removeItem();
                this.log(`🌿 You apply the ${item}. You are protected against lycanthropy for 24 hours!`, "success");
                this.updateUI();
                return;
            } else if (consumable.effect === "damage_undead") {
                removeItem();
                this.log(`💧 You ready the ${item}. It can be thrown at undead for 2d6 radiant damage!`, "success");
                this.updateUI();
                return;
            } else if (consumable.effect === "vampire_ward") {
                removeItem();
                this.log(`🧄 You wear the ${item}. Vampires have disadvantage on attacks against you!`, "success");
                this.updateUI();
                return;
            } else if (consumable.effect === "cure_poison") {
                removeItem();
                this.log(`💉 You drink the ${item}. Poison is cured and you're immune for 1 hour!`, "success");
                this.updateUI();
                return;
            } else if (consumable.effect === "insect_ward") {
                removeItem();
                this.log(`🦟 You apply the ${item}. Insects will leave you alone for 8 hours!`, "success");
                this.updateUI();
                return;
            }
        }
        
        // Standard item handling
        if (item === "Greater Healing Potion") {
            const heal = this.dm.rollDice("4d4") + 4;
            this.character.heal(heal);
            removeItem();
            this.log(`✨ You drink the ${item} and heal ${heal} HP!`, "success");
            this.updateUI();
        } else if (item.includes("Healing") || item === "Purple Grapemash Wine" || item === "Tej (Honey Wine)") {
            // Standard healing potions or wine
            let heal;
            if (item === "Purple Grapemash Wine") {
                heal = this.dm.rollDice("1d4");
            } else if (item === "Tej (Honey Wine)") {
                heal = this.dm.rollDice("1d6");
            } else {
                heal = this.dm.rollDice("2d4") + 2;
            }
            this.character.heal(heal);
            removeItem();
            this.log(`🍷 You drink the ${item} and heal ${heal} HP!`, "success");
            this.updateUI();
        } else if (item === "Antidote" || item === "Antivenom") {
            removeItem();
            this.log(`💊 You drink the ${item}. Any poison effects are cured!`, "success");
            this.updateUI();
        } else if (item === "Rations (1 day)" || item === "Rain Catcher Rations") {
            let heal;
            if (item === "Rain Catcher Rations") {
                heal = this.dm.rollDice("2d4");
            } else {
                heal = Math.floor(Math.random() * 3) + 1;
            }
            this.character.heal(heal);
            removeItem();
            this.log(`🍖 You eat the ${item} and recover ${heal} HP.`, "success");
            this.updateUI();
        } else if (item === "Morning Lord's Blessing" || item === "Spirit of Ubtao" || item === "Hutaakan Healing Salve") {
            // Powerful campaign healing items
            const heal = this.dm.rollDice("4d4") + 4;
            this.character.heal(heal);
            removeItem();
            this.log(`✨ You use the ${item} and heal ${heal} HP! Any curses are lifted.`, "success");
            this.updateUI();
        } else if (item === "Karameikan Brandy") {
            removeItem();
            this.log(`🍺 You drink the ${item}. You feel brave! (Advantage on fear saves)`, "success");
            this.updateUI();
        } else if (item === "Wolfsbane Potion") {
            removeItem();
            this.log(`🌿 You drink the ${item}. You are protected against lycanthropy for 24 hours!`, "success");
            this.updateUI();
        } else if (item === "Holy Water") {
            removeItem();
            this.log(`💧 You ready the Holy Water. Throw it at undead for 2d6 radiant damage!`, "success");
            this.updateUI();
        } else if (item === "Garlic Necklace") {
            removeItem();
            this.log(`🧄 You put on the ${item}. Vampires have disadvantage on attacks against you!`, "success");
            this.updateUI();
        } else if (item === "Insect Repellent") {
            removeItem();
            this.log(`🦟 You apply the ${item}. Jungle insects will leave you alone for 8 hours!`, "success");
            this.updateUI();
        }
    }
    
    equipItem(item) {
        const campaignId = this.dm ? this.dm.campaignId : null;
        const result = this.character.equipItem(item, campaignId);
        if (result.success) {
            this.log(`⚔️ ${result.message}`, "success");
        } else {
            this.log(`❌ ${result.message}`, "danger");
        }
        this.updateUI();
    }
    
    unequipItem(slot) {
        const campaignId = this.dm ? this.dm.campaignId : null;
        const result = this.character.unequipItem(slot, campaignId);
        if (result.success) {
            this.log(`${result.message}`, "dm");
        }
        this.updateUI();
    }
    
    updateShopButton() {
        // Add shop button for towns
        let shopBtnContainer = document.getElementById("shopBtnContainer");
        
        if (this.dm.currentLocation.type === "town" && this.dm.currentLocation.danger <= 1) {
            if (!shopBtnContainer) {
                shopBtnContainer = document.createElement("div");
                shopBtnContainer.id = "shopBtnContainer";
                shopBtnContainer.style.marginTop = "10px";
                
                // Find the location panel and add the button there
                const locationPanel = document.getElementById("locationType")?.parentElement;
                if (locationPanel) {
                    locationPanel.appendChild(shopBtnContainer);
                }
            }
            
            // Get NPCs available at this location
            const availableNPCs = this.getAvailableNPCs();
            
            shopBtnContainer.innerHTML = `
                <button class="shop-btn" onclick="game.openShop('general')">🏺 Visit Shop</button>
                ${availableNPCs.length > 0 ? `<button class="shop-btn" onclick="game.openTalkMenu()" style="background: linear-gradient(135deg, #9c27b0, #6a1b9a); margin-left: 5px;">💬 Talk</button>` : ''}
            `;
            shopBtnContainer.style.display = "block";
        } else if (shopBtnContainer) {
            shopBtnContainer.style.display = "none";
        }
    }
    
    updateEquipmentDisplay() {
        // Create or update equipment panel
        let equipPanel = document.getElementById("equipmentPanel");
        if (!equipPanel) {
            // Create equipment panel if it doesn't exist in HTML
            const sidebar = document.querySelector(".sidebar") || document.getElementById("inventoryList")?.parentElement;
            if (sidebar) {
                equipPanel = document.createElement("div");
                equipPanel.id = "equipmentPanel";
                equipPanel.className = "equipment-panel";
                sidebar.insertBefore(equipPanel, document.getElementById("inventoryList"));
            }
        }
        
        if (equipPanel) {
            const weapon = this.character.equipped.weapon;
            const armor = this.character.equipped.armor;
            const shield = this.character.equipped.shield;
            
            let weaponInfo = "None (Unarmed)";
            if (weapon) {
                const campaignId = this.dm?.campaignId;
                const w = this.character.getWeaponData(weapon, campaignId);
                if (w) {
                    const damage = (w.properties && w.properties.includes("versatile") && !shield) ? w.versatileDamage : w.damage;
                    const magicTag = w.magicBonus ? ` [+${w.magicBonus}]` : '';
                    weaponInfo = `${weapon}${magicTag} (${damage} ${w.type})`;
                }
            }
            
            let armorInfo = "None (AC 10 + DEX)";
            if (armor) {
                const campaignId = this.dm?.campaignId;
                const a = this.character.getArmorData(armor, campaignId);
                if (a) {
                    armorInfo = `${armor} (AC ${a.ac})`;
                }
            }
            
            let shieldInfo = "None";
            if (shield) {
                const campaignId = this.dm?.campaignId;
                const s = this.character.getShieldData(shield, campaignId);
                if (s) {
                    shieldInfo = `${shield} (+${s.acBonus} AC)`;
                }
            }
            
            equipPanel.innerHTML = `
                <h4>⚔️ Equipment</h4>
                <div class="equip-slot">
                    <span class="slot-label">Weapon:</span>
                    <span class="slot-item">${weaponInfo}</span>
                    ${weapon ? `<button class="unequip-btn" onclick="game.unequipItem('weapon')">✕</button>` : ''}
                </div>
                <div class="equip-slot">
                    <span class="slot-label">Armor:</span>
                    <span class="slot-item">${armorInfo}</span>
                    ${armor ? `<button class="unequip-btn" onclick="game.unequipItem('armor')">✕</button>` : ''}
                </div>
                <div class="equip-slot">
                    <span class="slot-label">Shield:</span>
                    <span class="slot-item">${shieldInfo}</span>
                    ${shield ? `<button class="unequip-btn" onclick="game.unequipItem('shield')">✕</button>` : ''}
                </div>
            `;
        }
    }

    openTravelModal() {
        if (this.dm.inCombat) return;
        
        const modal = document.getElementById("travelModal");
        const optionsContainer = document.getElementById("travelOptions");
        optionsContainer.innerHTML = "";
        
        const availableLocations = this.getAvailableLocations();
        
        availableLocations.forEach((loc) => {
            const dangerStars = loc.danger > 0 ? "⚠️".repeat(loc.danger) : "Safe";
            const originalIndex = this.dm.campaign.locations.indexOf(loc);
            const option = document.createElement("div");
            option.className = "travel-option";
            option.innerHTML = `
                <div>
                    <span>${loc.icon} ${loc.name}</span>
                    <div style="font-size: 0.8rem; color: #888;">${loc.description || loc.type}</div>
                </div>
                <span class="danger-level">${dangerStars}</span>
            `;
            option.onclick = () => this.travel(originalIndex);
            optionsContainer.appendChild(option);
        });
        
        modal.classList.add("active");
    }

    closeTravelModal() {
        document.getElementById("travelModal").classList.remove("active");
    }

    travel(locationIndex) {
        this.closeTravelModal();
        
        // Cannot travel while unconscious
        if (this.character.hp <= 0) {
            this.log("You're unconscious and need medical attention! Rest to recover.", "danger");
            return;
        }
        
        const newLocation = this.dm.campaign.locations[locationIndex];
        const oldLocation = this.dm.currentLocation;
        this.dm.currentLocation = newLocation;
        
        // Play ambient soundscape for location
        musicManager.playAmbientForLocation(newLocation);
        
        this.log(`You travel to ${newLocation.name}...`, "dm");
        if (newLocation.description) {
            this.log(`<em>${newLocation.description}</em>`, "dm");
        }
        
        // Story triggers based on location
        this.checkStoryTriggers(newLocation);
        
        // Random encounter while traveling
        if (Math.random() < 0.35 && newLocation.danger > 0) {
            this.log("You encounter enemies!", "danger");
            const tier = Math.min(newLocation.danger, 3);
            const monsters = this.dm.campaign.monsters[tier];
            const monster = { ...monsters[Math.floor(Math.random() * monsters.length)] };
            this.startCombat(monster);
        }
        
        this.updateUI();
    }
    
    checkStoryTriggers(location) {
        const flags = this.dm.questFlags;
        const campaignId = this.dm.campaignId;
        
        if (campaignId === "nights_dark_terror") {
            // Chapter 1 trigger - reaching Sukiskyn (town arrival, siege starts after)
            if (location.name === "Sukiskyn Homestead" && !flags.reachedSukiskyn) {
                this.triggerStoryEvent("reachSukiskyn");
            }
            
            // Chapter 3 trigger - entering Xitaqa's Lair - bugbear guards block the way
            if (location.name === "Xitaqa's Lair - Entrance" && !flags.enteredXitaqasLair) {
                this.log("Bugbear sentries guard the ancient entrance! They spot you and charge with weapons raised!", "danger");
                this.dm.pendingStoryEvent = "enterXitaqasLair";
                const bugbear = { ...this.dm.campaign.monsters[3].find(m => m.name === "Bugbear") };
                bugbear.name = "Bugbear Sentry";
                this.startCombat(bugbear);
            }
            
            // Xitaqa's Throne Room - boss fight
            if (location.name === "Xitaqa's Throne Room" && !flags.defeatedXitaqa) {
                this.log("King Xitaqa rises from his bone throne, flanked by bugbear guards!", "danger");
                const xitaqa = { ...this.dm.campaign.monsters[4].find(m => m.name === "King Xitaqa") };
                this.startCombat(xitaqa);
            }
            
            // Prison caves - must fight goblin jailer to rescue Taras
            if (location.name === "Prison Caves" && !flags.rescuedTaras) {
                this.log("A goblin warrior stands guard over the prisoners, keys jangling at his belt! He draws his blade as you approach!", "danger");
                this.dm.pendingStoryEvent = "rescueTaras";
                const goblin = { ...this.dm.campaign.monsters[2].find(m => m.name === "Goblin Warrior") };
                goblin.name = "Goblin Jailer";
                this.startCombat(goblin);
            }
            
            // Chapter 5 trigger - Lost Valley - dire wolves prowl the entrance
            if (location.name === "The Lost Valley - Entrance" && !flags.foundLostValley) {
                this.log("A pack of dire wolves guards the narrow pass into the valley! The alpha snarls and lunges!", "danger");
                this.dm.pendingStoryEvent = "findLostValley";
                const wolf = { ...this.dm.campaign.monsters[2].find(m => m.name === "Dire Wolf") };
                this.startCombat(wolf);
            }
            
            // Final boss - Golthar's Sanctum
            if (location.name === "Golthar's Sanctum" && !flags.defeatedGolthar) {
                this.log("Golthar the wizard turns to face you, dark energy crackling around his hands!", "danger");
                const golthar = { ...this.dm.campaign.monsters[5].find(m => m.name === "Golthar the Wizard") };
                this.startCombat(golthar);
            }
        } else if (campaignId === "curse_of_strahd") {
            // Death House - animated dead block the entrance
            if (location.name === "Death House" && !flags.enteredBarovia) {
                this.log("The door creaks open and a shambling horror lurches from the darkness! The dead walk in this cursed house!", "danger");
                this.dm.pendingStoryEvent = "enterDeathHouse";
                const zombie = { ...this.dm.campaign.monsters[1].find(m => m.name === "Strahd Zombie") };
                this.startCombat(zombie);
            }
            
            // Village of Barovia - meet Ismark (town NPC - no gate)
            if (location.name === "Village of Barovia" && !flags.metIsmark) {
                this.triggerStoryEvent("meetIsmark");
            }
            
            // Burgomaster's Mansion - meet Ireena (NPC - no gate)
            if (location.name === "Burgomaster's Mansion" && !flags.metIreena) {
                this.triggerStoryEvent("meetIreena");
            }
            
            // Tser Pool - Madam Eva (NPC fortune - no gate)
            if (location.name === "Tser Pool" && !flags.visitedMadamEva) {
                this.triggerStoryEvent("visitMadamEva");
            }
            
            // Vallaki (town arrival - no gate)
            if (location.name === "Vallaki" && !flags.reachedVallaki) {
                this.triggerStoryEvent("reachVallaki");
            }
            
            // Van Richten's Tower - werewolves prowl the area
            if (location.name === "Van Richten's Tower" && !flags.foundVanRichten) {
                this.log("A werewolf lunges from the treeline near the tower! Its howl pierces the fog-choked night!", "danger");
                this.dm.pendingStoryEvent = "findVanRichten";
                const werewolf = { ...this.dm.campaign.monsters[3].find(m => m.name === "Werewolf") };
                this.startCombat(werewolf);
            }
            
            // Amber Temple - golem guardian blocks the way
            if (location.name === "Amber Temple" && !flags.reachedAmberTemple) {
                this.log("A massive amber golem stirs to life in the temple doorway! Its eyes glow with ancient sorcery as it raises a fist!", "danger");
                this.dm.pendingStoryEvent = "reachAmberTemple";
                const golem = { ...this.dm.campaign.monsters[5].find(m => m.name === "Amber Golem") };
                this.startCombat(golem);
            }
            
            // Castle Ravenloft - vampire spawn guard the gates
            if (location.name === "Castle Ravenloft - Gates" && !flags.enteredRavenloft) {
                this.log("Vampire spawn descend from the castle battlements, their eyes gleaming with hunger! 'The master does not receive uninvited guests!'", "danger");
                this.dm.pendingStoryEvent = "enterRavenloft";
                const spawn = { ...this.dm.campaign.monsters[3].find(m => m.name === "Vampire Spawn") };
                this.startCombat(spawn);
            }
            
            // Castle Ravenloft - Crypt - Final boss
            if (location.name === "Castle Ravenloft - Crypt" && !flags.defeatedStrahd) {
                this.log("Count Strahd von Zarovich rises from his coffin, his eyes glowing red with ancient power!", "danger");
                const strahd = { ...this.dm.campaign.monsters[5].find(m => m.name === "Strahd von Zarovich") };
                this.startCombat(strahd);
            }
        } else if (campaignId === "tomb_of_annihilation") {
            // Port Nyanzaru - arrival (town - no gate)
            if (location.name === "Port Nyanzaru - Harbor" && !flags.arrivedPort) {
                this.triggerStoryEvent("arrivePort");
            }
            
            // Meet a guide (town NPC - no gate)
            if (location.name === "Port Nyanzaru - Market" && !flags.hiredGuide) {
                this.triggerStoryEvent("meetGuide");
            }
            
            // Enter the jungle - dinosaur attack!
            if (location.name === "Aldani Basin" && !flags.enteredJungle) {
                this.log("A massive allosaurus bursts from the jungle canopy! The ground shakes as it charges toward you!", "danger");
                this.dm.pendingStoryEvent = "enterJungle";
                const dino = { ...this.dm.campaign.monsters[2].find(m => m.name === "Allosaurus") };
                this.startCombat(dino);
            }
            
            // Find Omu - yuan-ti sentinels guard the ruins
            if (location.name === "Omu - City Gates" && !flags.foundOmu) {
                this.log("A yuan-ti malison slithers from the vine-choked gates, hissing a warning! 'No warm-bloods enter the Forbidden City!'", "danger");
                this.dm.pendingStoryEvent = "findOmu";
                const yuanti = { ...this.dm.campaign.monsters[3].find(m => m.name === "Yuan-ti Malison") };
                this.startCombat(yuanti);
            }
            
            // Enter the Fane - yuan-ti abomination bars the way
            if (location.name === "Fane of the Night Serpent" && !flags.enteredFane) {
                this.log("A monstrous yuan-ti abomination coils before the fane entrance, its massive serpentine body filling the passage! 'The Night Serpent devours all intruders!'", "danger");
                this.dm.pendingStoryEvent = "enterFane";
                const abom = { ...this.dm.campaign.monsters[4].find(m => m.name === "Yuan-ti Abomination") };
                this.startCombat(abom);
            }
            
            // Ras Nsi boss fight
            if (location.name === "Ras Nsi's Throne Room" && !flags.defeatedRasNsi) {
                this.log("Ras Nsi rises from his throne, drawing a flaming sword. 'You will not stop Acererak's plan!'", "danger");
                const rasNsi = { ...this.dm.campaign.monsters[4].find(m => m.name === "Ras Nsi") };
                this.startCombat(rasNsi);
            }
            
            // Enter the Tomb - tomb guardian blocks the entrance
            if (location.name === "Tomb - Level 1" && !flags.enteredTomb) {
                this.log("A tomb guardian materializes in the doorway, its stone form crackling with necrotic energy! 'None shall desecrate the Nine Gods!'", "danger");
                this.dm.pendingStoryEvent = "enterTomb";
                const guardian = { ...this.dm.campaign.monsters[5].find(m => m.name === "Tomb Guardian") };
                this.startCombat(guardian);
            }
            
            // Soulmonger - must destroy before Acererak
            if (location.name === "Tomb - Cradle of the Death God" && !flags.destroyedSoulmonger) {
                this.log("The Soulmonger pulses with dark energy! The Atropal floating above it lets out a deathly wail!", "danger");
                const atropal = { ...this.dm.campaign.monsters[5].find(m => m.name === "Atropal") };
                this.startCombat(atropal);
            }
            
            // Acererak - final boss (after Soulmonger)
            if (location.name === "Tomb - Cradle of the Death God" && flags.destroyedSoulmonger && !flags.defeatedAcererak) {
                this.log("Acererak materializes, fury in his empty eye sockets. 'You have destroyed my masterpiece. Now you will suffer for eternity!'", "danger");
                const acererak = { ...this.dm.campaign.monsters[5].find(m => m.name === "Acererak") };
                this.startCombat(acererak);
            }
        } else if (campaignId === "keep_on_borderlands") {
            // Chapter 0 -> 1: Arrive at Keep Gates (town - no gate)
            if (location.name === "Keep Gates" && !flags.arrivedAtKeep) {
                this.triggerStoryEvent("arriveAtKeep");
            }
            
            // Chapter 1: Enter the Outer Bailey (town - no gate)
            if (location.name === "Keep - Outer Bailey" && !flags.exploredKeep) {
                this.triggerStoryEvent("exploreKeep");
            }
            
            // Chapter 1: Visit the Inn for lodging (town - no gate)
            if (location.name === "Green Man Inn" && !flags.foundLodging) {
                this.triggerStoryEvent("findLodging");
            }
            
            // Chapter 1 -> 2: Learn about Caves from Castellan (NPC - no gate)
            if (location.name === "Keep - Inner Bailey" && !flags.metCastellan) {
                this.triggerStoryEvent("meetCastellan");
            }
            
            // Chapter 2 -> 3: Enter the Caves of Chaos - kobold scouts attack
            if (location.name === "Caves of Chaos - Entrance" && !flags.foundCaves) {
                this.log("Kobold scouts leap from behind the rocks, hurling javelins! They've been watching the ravine entrance!", "danger");
                this.dm.pendingStoryEvent = "findCaves";
                const kobold = { ...this.dm.campaign.monsters[1].find(m => m.name === "Kobold") };
                kobold.name = "Kobold Scout";
                this.startCombat(kobold);
            }
            
            // Chapter 3: Enter Kobold Caves - kobold warriors defend their lair
            if (location.name === "Kobold Caves" && !flags.clearedKobolds) {
                this.log("Kobold warriors screech and charge from the cave mouth, crude weapons raised in defense of their tunnels!", "danger");
                this.dm.pendingStoryEvent = "enterKoboldCaves";
                const kobold = { ...this.dm.campaign.monsters[1].find(m => m.name === "Kobold") };
                kobold.name = "Kobold Warrior";
                this.startCombat(kobold);
            }
            
            // Chapter 3: Enter Goblin Caves - goblin ambush
            if (location.name === "Goblin Caves" && !flags.clearedGoblins) {
                this.log("Goblins drop from concealed ledges above the cave entrance! Arrows fly as they spring their ambush!", "danger");
                this.dm.pendingStoryEvent = "enterGoblinCaves";
                const goblin = { ...this.dm.campaign.monsters[1].find(m => m.name === "Goblin") };
                goblin.name = "Goblin Ambusher";
                this.startCombat(goblin);
            }
            
            // Chapter 4: Hobgoblin Caves - hobgoblin patrol
            if (location.name === "Hobgoblin Caves" && !flags.enteredHobgoblins) {
                this.log("A hobgoblin patrol blocks the cave entrance in disciplined formation! 'Halt! None pass without tribute to the war chief!'", "danger");
                this.dm.pendingStoryEvent = "enterHobgoblinCaves";
                const hobgoblin = { ...this.dm.campaign.monsters[2].find(m => m.name === "Hobgoblin") };
                hobgoblin.name = "Hobgoblin Patrol Leader";
                this.startCombat(hobgoblin);
            }
            
            // Chapter 4: Minotaur boss
            if (location.name === "Minotaur Lair" && !flags.defeatedMinotaur) {
                this.log("A bellowing roar echoes through the maze! The Minotaur charges!", "danger");
                const minotaur = { ...this.dm.campaign.monsters[4].find(m => m.name === "Minotaur") };
                this.startCombat(minotaur);
            }
            
            // Chapter 5: Temple of Evil Chaos - acolytes guard the entrance
            if (location.name === "Temple of Evil Chaos" && !flags.enteredTemple) {
                this.log("Robed acolytes chant dark prayers at the temple entrance! One spots you and shrieks, 'Unbelievers! The Dark Gods demand your blood!'", "danger");
                this.dm.pendingStoryEvent = "enterTemple";
                const acolyte = { ...this.dm.campaign.monsters[3].find(m => m.name === "Acolyte of Chaos") };
                this.startCombat(acolyte);
            }
            
            // Chapter 5: Final boss - High Priest
            if (location.name === "Inner Sanctum" && !flags.defeatedHighPriest) {
                this.log("The High Priest of Chaos turns, dark energy swirling around him. 'Fools! The dark gods will consume your souls!'", "danger");
                const highPriest = { ...this.dm.campaign.monsters[5].find(m => m.name === "High Priest of Chaos") };
                this.startCombat(highPriest);
            }
        } else if (campaignId === "lost_mine_of_phandelver") {
            // Chapter 1: Goblin Ambush Site - ambush triggers intro
            if (location.name === "Goblin Ambush Site" && !flags.ambushed) {
                this.log("Dead horses block the trail ahead - it's an ambush! Goblins leap from the undergrowth!", "danger");
                this.dm.pendingStoryEvent = "intro_lmop";
                const goblin = { ...this.dm.campaign.monsters[1].find(m => m.name === "Goblin") };
                this.startCombat(goblin);
            }
            
            // Chapter 1: Cragmaw Hideout - must fight Klarg the bugbear to rescue Sildar
            if (location.name === "Cragmaw Hideout - Depths" && !flags.rescuedSildar) {
                this.log("A massive bugbear named Klarg blocks the passage, his pet wolf snarling beside him! Sildar is chained to a post behind them!", "danger");
                this.dm.pendingStoryEvent = "rescueSildar";
                const bugbear = { ...this.dm.campaign.monsters[2].find(m => m.name === "Bugbear") };
                bugbear.name = "Klarg the Bugbear";
                this.startCombat(bugbear);
            }
            
            // Chapter 2: Arrive in Phandalin (town - no gate needed)
            if (location.name === "Phandalin - Town Square" && !flags.arrivedPhandalin) {
                this.triggerStoryEvent("arrivePhandalin");
            }
            
            // Chapter 2: Visit Barthen's (NPC meeting - no gate needed)
            if (location.name === "Barthen's Provisions" && !flags.metBarthen) {
                this.triggerStoryEvent("meetBarthen");
            }
            
            // Chapter 3: Enter Redbrand Hideout - must fight through a Nothic guardian
            if (location.name === "Tresendar Manor Ruins" && !flags.enteredRedbrandHideout) {
                this.log("As you descend into the cellar, a horrible one-eyed creature lurches from the shadows! Its single eye glows with malevolent intelligence.", "danger");
                this.dm.pendingStoryEvent = "enterRedbrandHideout";
                const nothic = { ...this.dm.campaign.monsters[3].find(m => m.name === "Nothic") };
                this.startCombat(nothic);
            }
            
            // Chapter 3: Boss fight - Glasstaff
            if (location.name === "Glasstaff's Quarters" && !flags.defeatedGlassstaff) {
                this.log("A wizard in fine robes whirls to face you, clutching a glass staff! 'You dare invade my sanctuary?!'", "danger");
                const glasstaff = { ...this.dm.campaign.monsters[3].find(m => m.name === "Glasstaff") };
                this.startCombat(glasstaff);
            }
            
            // Chapter 4: Enter Cragmaw Castle - must fight hobgoblin sentries
            if (location.name === "Cragmaw Castle - Ruins" && !flags.enteredCragmawCastle) {
                this.log("Hobgoblin sentries spot you approaching the crumbling castle! 'Intruders! Sound the alarm!' They charge with weapons drawn!", "danger");
                this.dm.pendingStoryEvent = "enterCragmawCastle";
                const hobgoblin = { ...this.dm.campaign.monsters[2].find(m => m.name === "Hobgoblin") };
                hobgoblin.name = "Hobgoblin Sentry";
                this.startCombat(hobgoblin);
            }
            
            // Chapter 4: Boss fight - King Grol
            if (location.name === "King Grol's Chamber" && !flags.defeatedKingGrol) {
                this.log("A massive bugbear rises from a pile of furs, morningstar in hand. Beside him, Gundren lies chained to the wall!", "danger");
                const kingGrol = { ...this.dm.campaign.monsters[4].find(m => m.name === "King Grol") };
                this.startCombat(kingGrol);
            }
            
            // Chapter 5: Enter Wave Echo Cave - must fight through undead guardians
            if (location.name === "Wave Echo Cave - Entrance" && !flags.enteredWaveEchoCave) {
                this.log("The cave entrance reeks of death. Shambling corpses of ancient miners stagger toward you, eyes glowing with pale light!", "danger");
                this.dm.pendingStoryEvent = "enterWaveEchoCave";
                const zombie = { ...this.dm.campaign.monsters[2].find(m => m.name === "Zombie") };
                zombie.name = "Undead Miner";
                this.startCombat(zombie);
            }
            
            // Chapter 5: Find the Forge of Spells - must defeat the Spectator guardian
            if (location.name === "The Forge of Spells" && !flags.foundForgeOfSpells) {
                this.log("A bizarre floating creature with a central eye and four eyestalks guards the ancient forge! 'None shall claim the forge without my master's permission!'", "danger");
                this.dm.pendingStoryEvent = "findForgeOfSpells";
                const spectator = { ...this.dm.campaign.monsters[5].find(m => m.name === "Spectator") };
                this.startCombat(spectator);
            }
            
            // Chapter 5: Final boss - Black Spider
            if (location.name === "Temple of Dumathoin" && !flags.defeatedBlackSpider) {
                this.log("A dark elf steps from the shadows, flanked by giant spiders. 'So, the meddlesome adventurers have finally arrived. No matter - you're too late!'", "danger");
                const nezznar = { ...this.dm.campaign.monsters[5].find(m => m.name === "Nezznar the Black Spider") };
                this.startCombat(nezznar);
            }
        }
    }

    async rest() {
        if (this.dm.inCombat) return;
        
        // If at 0 HP and stable, force immediate recovery
        if (this.character.hp <= 0) {
            this.forceRecoveryRest();
            return;
        }
        
        // Show rest options modal
        this.showRestModal();
    }

    showRestModal() {
        let modal = document.getElementById("restModal");
        if (!modal) {
            modal = document.createElement("div");
            modal.id = "restModal";
            modal.className = "modal";
            document.body.appendChild(modal);
        }

        const char = this.character;
        const inTown = this.dm.currentLocation.type === "town";
        const canAffordInn = char.gold >= 5;
        const hasHitDice = char.hitDice.current > 0;
        const canShortRest = this.dm.shortRestsTaken < this.dm.maxShortRests;

        modal.innerHTML = `
            <div class="modal-content">
                <h2>🛏️ Rest Options</h2>
                <div class="rest-options">
                    <div class="rest-option ${!hasHitDice || !canShortRest ? 'disabled' : ''}" 
                         onclick="${hasHitDice && canShortRest ? 'game.shortRest()' : ''}">
                        <div class="rest-title">⏰ Short Rest (1 hour)</div>
                        <div class="rest-desc">Spend hit dice to recover HP</div>
                        <div class="rest-info">Hit Dice: ${char.hitDice.current}/${char.hitDice.max} | Short Rests: ${this.dm.shortRestsTaken}/${this.dm.maxShortRests}</div>
                    </div>
                    ${inTown ? `
                        <div class="rest-option ${!canAffordInn ? 'disabled' : ''}" 
                             onclick="${canAffordInn ? 'game.longRestInn()' : ''}">
                            <div class="rest-title">🏨 Long Rest at Inn (8 hours)</div>
                            <div class="rest-desc">Full HP, spell slots, hit dice restored</div>
                            <div class="rest-info">Cost: 5 gold (You have: ${char.gold})</div>
                        </div>
                    ` : `
                        <div class="rest-option" onclick="game.longRestCamp()">
                            <div class="rest-title">🏕️ Long Rest - Make Camp (8 hours)</div>
                            <div class="rest-desc">Full recovery, but may be interrupted!</div>
                            <div class="rest-info">30% chance of encounter</div>
                        </div>
                    `}
                </div>
                <button class="close-modal" onclick="game.closeRestModal()">Cancel</button>
            </div>
        `;
        modal.classList.add("active");
    }

    forceRecoveryRest() {
        this.log("⚕️ Your companions tend to your wounds while you're unconscious...", "dm");
        this.dm.advanceTime(1);
        
        // Heal to 1 HP minimum (stabilized recovery)
        const healAmount = Math.max(1, Math.floor(this.character.maxHp * 0.25));
        this.character.heal(healAmount);
        
        this.log(`💚 You regain consciousness with ${healAmount} HP!`, "success");
        this.log(`${this.dm.getTimeIcon()} Time: ${this.formatTime()}`, "dm");
        this.log("You can continue your adventure, but consider resting more to fully recover.", "dm");
        
        this.updateUI();
    }

    closeRestModal() {
        const modal = document.getElementById("restModal");
        if (modal) modal.classList.remove("active");
    }

    shortRest() {
        this.closeRestModal();
        const char = this.character;
        
        if (char.hitDice.current <= 0) {
            this.log("You have no hit dice remaining!", "danger");
            return;
        }

        if (this.dm.shortRestsTaken >= this.dm.maxShortRests) {
            this.log("You've already taken your maximum short rests. Try a long rest.", "danger");
            return;
        }

        // Advance time by 1 hour
        this.dm.advanceTime(1);
        this.dm.shortRestsTaken++;

        // Use hit dice
        const healing = char.useHitDie();
        this.log(`⏰ You take a short rest and recover ${healing} HP using a hit die.`, "success");
        this.log(`Hit dice remaining: ${char.hitDice.current}/${char.hitDice.max}`, "dm");

        // Restore subclass short rest resources
        if (char.subclass === 'BattleMaster') {
            char.subclassFeatures.superiorityDiceRemaining = char.subclassFeatures.superiorityDice || 4;
            this.log(`⚔️ Superiority dice restored!`, "success");
        }
        
        // Fighter: Second Wind resets on short rest
        if (char.charClass === 'Fighter' && char.secondWindUsed) {
            char.secondWindUsed = false;
            this.log(`💨 Second Wind restored!`, "success");
        }
        
        // Monk: Ki points fully restore on short rest
        if (char.charClass === 'Monk' && char.kiPoints < char.kiMax) {
            char.kiPoints = char.kiMax;
            this.log(`🥋 Ki points restored! (${char.kiMax}/${char.kiMax})`, "success");
        }
        
        // Bard: Bardic Inspiration restores on short rest (level 5+ with Font of Inspiration)
        if (char.charClass === 'Bard' && char.level >= 5) {
            char.bardicInspirationUses = Math.max(1, char.getModifier('cha'));
            this.log(`🎵 Bardic Inspiration uses restored!`, "success");
        }
        
        // Warlock: Pact Magic slots restore on short rest
        if (char.charClass === 'Warlock' && char.pactSlotsUsed > 0) {
            char.pactSlotsUsed = 0;
            this.log(`🔮 Pact Magic slots restored!`, "success");
        }
        
        // Dragonborn: Breath Weapon recharges on short rest
        if (char.race === 'Dragonborn' && char.racialAbilities?.breathWeaponUsed) {
            char.racialAbilities.breathWeaponUsed = false;
            this.log(`🐉 Breath Weapon recharged!`, "success");
        }

        // Show time update
        this.log(`${this.dm.getTimeIcon()} Time: ${this.formatTime()} | ${this.dm.getWeatherIcon()} ${this.dm.weather}`, "dm");
        
        this.updateUI();
    }

    longRestInn() {
        this.closeRestModal();
        const char = this.character;

        if (char.gold < 5) {
            this.log("You can't afford the inn (5 gold required).", "danger");
            return;
        }

        char.gold -= 5;
        this.performLongRest(false);
        this.log("🏨 You rest at the inn. Fully restored!", "success");
    }

    longRestCamp() {
        this.closeRestModal();
        
        this.log("🏕️ You make camp and attempt to rest...", "dm");
        
        // Advance time by 8 hours
        this.dm.advanceTime(8);
        
        // Higher chance of interruption at night or in dangerous areas
        let interruptChance = 0.3;
        if (this.dm.currentLocation.danger >= 3) interruptChance = 0.4;
        if (this.dm.currentLocation.danger >= 5) interruptChance = 0.5;
        
        if (Math.random() < interruptChance) {
            this.log("💀 Your rest is interrupted!", "danger");
            const chapter = Math.min(this.dm.currentChapter + 1, Object.keys(this.dm.campaign.monsters).length);
            const monsters = this.dm.campaign.monsters[chapter] || this.dm.campaign.monsters[1];
            const monster = { ...monsters[Math.floor(Math.random() * monsters.length)] };
            this.startCombat(monster);
        } else {
            this.performLongRest(true);
            this.log("🌙 You rest peacefully through the night. Fully restored!", "success");
        }
    }

    performLongRest(showTime = true) {
        const char = this.character;

        // Full HP restore
        char.hp = char.maxHp;

        // Restore all hit dice
        char.hitDice.current = char.hitDice.max;

        // Restore spell slots (all 9 levels)
        if (char.spells) {
            char.spells.slotsUsed = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 };
        }

        // Clear conditions
        char.clearAllConditions();

        // Reset short rest counter
        this.dm.shortRestsTaken = 0;

        // Restore subclass long rest resources
        if (char.subclass === 'BattleMaster') {
            char.subclassFeatures.superiorityDiceRemaining = char.subclassFeatures.superiorityDice || 4;
        }
        if (char.subclass === 'War') {
            const wisMod = Math.max(1, char.getModifier("wis"));
            char.subclassFeatures.warPriestUsesRemaining = wisMod;
            char.subclassFeatures.guidedStrikeAvailable = true;
        }
        
        // Restore feat resources on long rest
        if (char.feats.includes("Lucky")) {
            char.featData.luckyPoints = 3;
        }
        
        // Restore class resources on long rest
        if (char.charClass === 'Fighter') char.secondWindUsed = false;
        if (char.charClass === 'Monk') char.kiPoints = char.kiMax;
        if (char.charClass === 'Bard') char.bardicInspirationUses = Math.max(1, char.getModifier('cha'));
        if (char.charClass === 'Paladin') char.layOnHandsPool = char.level * 5;
        if (char.charClass === 'Sorcerer') char.sorceryPoints = char.sorceryPointsMax;
        if (char.charClass === 'Druid') char.wildShapeUses = 2;
        if (char.charClass === 'Barbarian') {
            char.raging = false; // Rage ends on long rest
        }
        if (char.charClass === 'Paladin') {
            char.divineSenseUses = 1 + char.getModifier('cha');
        }
        if (char.charClass === 'Warlock' && char.pactSlotsUsed !== undefined) {
            char.pactSlotsUsed = 0;
        }
        
        // Clear concentration
        if (char.concentrating) {
            char.concentrating = null;
        }
        
        // Restore racial abilities on long rest
        if (char.racialAbilities) {
            if (char.race === "Dragonborn") char.racialAbilities.breathWeaponUsed = false;
            if (char.race === "Half-Orc") char.racialAbilities.relentlessUsed = false;
        }

        // Advance time if not already done
        if (showTime) {
            this.dm.advanceTime(8);
            this.log(`${this.dm.getTimeIcon()} Time: ${this.formatTime()} | ${this.dm.getWeatherIcon()} ${this.dm.weather}`, "dm");
        }

        this.updateUI();
    }

    formatTime() {
        const hour = Math.floor(this.dm.hour);
        const period = hour >= 12 ? "PM" : "AM";
        const displayHour = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour);
        return `Day ${this.dm.day}, ${displayHour}:00 ${period}`;
    }

    saveGame() {
        // Check if we have too many saves
        const saves = getSaveSlots();
        if (saves.length >= MAX_SAVES && !this.currentSaveKey) {
            if (!confirm(`You have ${MAX_SAVES} saved games. Do you want to overwrite the oldest one?`)) {
                this.log("Save cancelled.", "dm");
                return;
            }
            // Delete oldest save
            const oldestSave = saves[saves.length - 1];
            deleteSave(oldestSave.key);
        }
        
        const saveKey = this.currentSaveKey || generateSaveKey();
        this.currentSaveKey = saveKey;
        
        const saveData = {
            character: this.character.toJSON(),
            campaignId: this.dm.campaignId,
            location: this.dm.currentLocation,
            turn: this.dm.turn,
            currentChapter: this.dm.currentChapter,
            questFlags: this.dm.questFlags,
            saveTime: Date.now()
        };
        localStorage.setItem(saveKey, JSON.stringify(saveData));
        this.log("💾 Game saved!", "success");
    }
    
    loadGameFromData(saveData) {
        if (saveData) {
            this.character = Character.fromJSON(saveData.character);
            this.selectedCampaign = saveData.campaignId || "nights_dark_terror";
            ACTIVE_CAMPAIGN = CAMPAIGNS[this.selectedCampaign];
            this.dm = new DungeonMaster(this.character, this.selectedCampaign);
            this.dm.currentLocation = saveData.location;
            this.dm.turn = saveData.turn;
            this.dm.currentChapter = saveData.currentChapter || 0;
            this.dm.questFlags = saveData.questFlags || this.dm.questFlags;
            
            // Switch to game screen
            document.getElementById("campaignSelectScreen").classList.add("hidden");
            document.getElementById("creationScreen").classList.add("hidden");
            document.getElementById("gameScreen").classList.remove("hidden");
            document.getElementById("characterPanel").classList.remove("hidden");
            
            // Update chapter banner with campaign info
            const campaign = this.dm.campaign;
            document.querySelector(".chapter-banner .chapter-title").textContent = `${campaign.icon} ${campaign.name.toUpperCase()} ${campaign.icon}`;
            
            this.updateUI();
            this.updateChapterDisplay();
            this.log("📂 Game loaded!", "success");
            this.log(`Welcome back, ${this.character.name}!`, "dm");
        }
    }

    loadGame() {
        // Legacy support - try old save format first
        const oldSave = localStorage.getItem("dndSaveGame");
        if (oldSave) {
            this.currentSaveKey = null;
            this.loadGameFromData(JSON.parse(oldSave));
            // Migrate to new format
            localStorage.removeItem("dndSaveGame");
            this.saveGame();
            return;
        }
        
        // Load most recent save
        const saves = getSaveSlots();
        if (saves.length > 0) {
            this.loadSave(saves[0].key);
        }
    }

    // ==================== MAIN MENU ====================
    
    returnToMainMenu() {
        // Confirm before leaving (in case they haven't saved)
        const confirmed = confirm("Return to the main menu?\n\nMake sure you've saved your game first!");
        
        if (confirmed) {
            // Simply refresh the page to return to main menu
            // This ensures the saved games list is properly refreshed
            location.reload();
        }
    }

    // ==================== SAVE MANAGER ====================
    
    showSaveManager() {
        const modal = document.getElementById('saveManagerModal');
        const container = document.getElementById('saveListContainer');

        if (!modal || !container) return;

        const saves = getSaveSlots();

        if (saves.length === 0) {
            container.innerHTML = '<div class="no-saves-message">📂 No saved games found.<br>Start a new adventure to create a save!</div>';
        } else {
            container.innerHTML = saves.map(save => {
                const char = save.data?.character || {};
                const saveDate = new Date(save.data?.saveTime || Date.now());
                const campaign = CAMPAIGNS[save.data?.campaignId] || null;
                const chapter = Number.isInteger(save.data?.currentChapter) ? save.data.currentChapter + 1 : 'Unknown';
                const charName = char.name || 'Unknown Hero';
                const charRace = char.race || 'Unknown Race';
                const charClass = char.characterClass || char.charClass || 'Unknown Class';
                const charLevel = char.level ?? 1;
                const charHp = char.hp ?? 0;
                const charMaxHp = char.maxHp ?? 0;

                return `
                    <div class="save-item">
                        <div class="save-info">
                            <div class="save-character-name">${charName}</div>
                            <div class="save-details">
                                ${charRace} ${charClass} • Level ${charLevel} • ${charHp}/${charMaxHp} HP<br>
                                📖 ${campaign ? campaign.name : 'Unknown Campaign'} • Chapter ${chapter}<br>
                                💾 Saved: ${saveDate.toLocaleString()}
                            </div>
                        </div>
                        <div class="save-actions">
                            <button class="save-load-btn" onclick="game.loadSaveFromManager('${save.key}')">
                                📂 Load
                            </button>
                            <button class="save-delete-btn" onclick="game.deleteSaveFromManager('${save.key}')">
                                🗑️ Delete
                            </button>
                        </div>
                    </div>
                `;
            }).join('');
        }

        modal.classList.add('active');
    }

    closeSaveManager() {
        const modal = document.getElementById('saveManagerModal');
        if (modal) {
            modal.classList.remove('active');
        }
    }

    loadSaveFromManager(saveKey) {
        if (confirm('Load this saved game?')) {
            this.loadSave(saveKey);
            this.closeSaveManager();

            // Hide title screen and show game
            document.getElementById('titleScreen').classList.add('hidden');
            document.getElementById('gameScreen').classList.remove('hidden');
            document.getElementById('characterPanel').classList.remove('hidden');
        }
    }

    deleteSaveFromManager(saveKey) {
        const saves = getSaveSlots();
        const save = saves.find(s => s.key === saveKey);

        if (save) {
            const charName = save.data?.character?.name || 'this character';
            if (confirm(`Are you sure you want to delete the save for "${charName}"?\n\nThis action cannot be undone!`)) {
                deleteSave(saveKey);
                this.log(`🗑️ Deleted save for ${charName}`, 'dm');

                // Refresh the save list
                this.showSaveManager();
            }
        }
    }

    // ==================== CHARACTER EXPORT/IMPORT SYSTEM ====================
    // Export format designed for cross-platform compatibility with Foundry VTT, Roll20, D&D Beyond importers

    _toSlug(str) {
        return str.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
    }

    _getAbilityModifier(score) {
        return Math.floor((score - 10) / 2);
    }

    _buildAbilities(stats) {
        const abilityMap = { str: "strength", dex: "dexterity", con: "constitution", int: "intelligence", wis: "wisdom", cha: "charisma" };
        const profBonus = this.character.getProficiencyBonus();
        const saveProficiencies = GAME_DATA.classes[this.character.charClass]?.saves || [];
        const abilities = {};
        for (const [abbr, fullName] of Object.entries(abilityMap)) {
            const score = stats[abbr];
            const mod = this._getAbilityModifier(score);
            const saveProf = saveProficiencies.includes(abbr);
            abilities[fullName] = {
                slug: abbr,
                score: score,
                modifier: mod,
                save: saveProf ? mod + profBonus : mod,
                saveProficiency: saveProf
            };
        }
        return abilities;
    }

    _buildInventoryItem(itemName) {
        const campaignId = this.dm ? this.dm.campaignId : null;
        const slug = this._toSlug(itemName);
        const item = { name: itemName, slug: slug, quantity: 1 };

        // Weight
        const weight = EXPORT_ITEM_WEIGHTS[itemName];
        if (weight !== undefined) item.weight = weight;

        // Price
        const price = GAME_DATA.shopPrices[itemName];
        if (price !== undefined) item.value = price;

        // Weapon data
        const weaponData = this.character.getWeaponData(itemName, campaignId);
        if (weaponData) {
            item.type = "weapon";
            item.damage = weaponData.damage;
            item.damageType = weaponData.type;
            item.properties = weaponData.properties || [];
            item.attackAbility = weaponData.stat;
            if (weaponData.magicBonus) item.magicBonus = weaponData.magicBonus;
            if (weaponData.versatileDamage) item.versatileDamage = weaponData.versatileDamage;
            if (weaponData.range) item.range = weaponData.range;
            if (weaponData.description) item.description = weaponData.description;
            if (weaponData.bonusDamageVs) item.bonusDamageVs = weaponData.bonusDamageVs;
            if (weaponData.bonusDamage) item.bonusDamage = weaponData.bonusDamage;
            if (weaponData.bonusDamageDice) item.bonusDamageDice = weaponData.bonusDamageDice;
            item.equipped = (this.character.equipped.weapon === itemName);
            return item;
        }

        // Armor data
        const armorData = this.character.getArmorData(itemName, campaignId);
        if (armorData) {
            item.type = "armor";
            item.armorClass = armorData.ac;
            item.armorType = armorData.type;
            item.maxDexBonus = armorData.maxDex === 99 ? null : armorData.maxDex;
            item.stealthDisadvantage = armorData.stealthDisadvantage || false;
            if (armorData.description) item.description = armorData.description;
            item.equipped = (this.character.equipped.armor === itemName);
            return item;
        }

        // Shield data
        const shieldData = this.character.getShieldData(itemName, campaignId);
        if (shieldData) {
            item.type = "shield";
            item.acBonus = shieldData.acBonus;
            if (shieldData.stealthDisadvantage) item.stealthDisadvantage = true;
            if (shieldData.description) item.description = shieldData.description;
            item.equipped = (this.character.equipped.shield === itemName);
            return item;
        }

        // Consumable data — check campaign consumables
        if (campaignId && GAME_DATA.campaignItems[campaignId]?.consumables?.[itemName]) {
            const cons = GAME_DATA.campaignItems[campaignId].consumables[itemName];
            item.type = "consumable";
            if (cons.effect) item.effect = cons.effect;
            if (cons.healAmount) item.healAmount = cons.healAmount;
            if (cons.description) item.description = cons.description;
            return item;
        }

        // Generic consumable check
        const genericDesc = GAME_DATA.itemDescriptions?.[itemName];
        if (genericDesc) item.description = genericDesc;
        item.type = "gear";
        return item;
    }

    _buildSkills(skillsList) {
        return (skillsList || []).map(skill => ({
            name: skill,
            slug: this._toSlug(skill),
            proficient: true
        }));
    }

    _buildSpells(spellNames) {
        return (spellNames || []).map(name => {
            const data = GAME_DATA.spells[name];
            if (!data) return { name: name, slug: this._toSlug(name) };
            const spell = {
                name: name,
                slug: this._toSlug(name),
                level: data.level,
                school: data.school ? data.school.toLowerCase() : undefined
            };
            if (data.damage) spell.damage = data.damage;
            if (data.damageType) spell.damageType = data.damageType;
            if (data.healing) spell.healing = data.healing;
            if (data.range !== undefined) spell.range = data.range;
            if (data.description) spell.description = data.description;
            return spell;
        });
    }

    exportCharacter() {
        if (!this.character) {
            alert("No character to export!");
            return;
        }

        const char = this.character;
        const campaignId = this.dm ? this.dm.campaignId : null;
        const classData = GAME_DATA.classes[char.charClass] || {};

        const exportData = {
            formatVersion: "3.2",
            exportType: "dnd-character",
            system: "dnd5e",
            generator: "dnd-text-adventure",
            exportDate: new Date().toISOString(),

            character: {
                name: char.name,

                race: {
                    name: char.race,
                    slug: this._toSlug(char.race),
                    traits: char.traits ? [...char.traits] : []
                },

                class: {
                    name: char.charClass,
                    slug: this._toSlug(char.charClass),
                    hitDie: classData.hitDie || 8,
                    primaryAbility: classData.primary || null,
                    spellcaster: classData.spellcaster || false,
                    spellcastingAbility: classData.spellStat || null,
                    subclass: char.subclass || null
                },

                background: {
                    name: char.background,
                    slug: this._toSlug(char.background),
                    feature: GAME_DATA.backgrounds[char.background]?.feature || null
                },

                level: char.level,
                experience: char.experience,
                proficiencyBonus: char.getProficiencyBonus(),
                inspiration: char.inspiration || 0,
                exhaustion: char.exhaustion || 0,

                abilities: this._buildAbilities(char.stats),

                hitPoints: {
                    current: char.hp,
                    maximum: char.maxHp,
                    temporary: 0,
                    hitDice: {
                        die: `d${classData.hitDie || 8}`,
                        current: char.hitDice?.current ?? char.level,
                        maximum: char.level
                    }
                },

                armorClass: char.ac || 10,
                speed: 30,
                currency: {
                    gp: char.gold,
                    sp: 0,
                    cp: 0,
                    ep: 0,
                    pp: 0
                },

                skills: this._buildSkills(char.skills),
                proficiencies: (char.proficiencies || []).map(p => ({
                    name: p,
                    slug: this._toSlug(p)
                })),

                inventory: char.inventory.map(item => this._buildInventoryItem(item)),

                equipment: {
                    weapon: char.equipped.weapon || null,
                    armor: char.equipped.armor || null,
                    shield: char.equipped.shield || null
                },

                spellcasting: classData.spellcaster ? {
                    ability: classData.spellStat,
                    spellSlots: char.spellSlots ? { ...char.spellSlots } : {},
                    maxSpellSlots: char.maxSpellSlots ? { ...char.maxSpellSlots } : {},
                    knownSpells: this._buildSpells(char.knownSpells),
                    preparedSpells: this._buildSpells(char.preparedSpells)
                } : null,

                campaign: campaignId ? {
                    id: campaignId,
                    name: this.dm.campaign?.name || campaignId
                } : null
            }
        };
        
        const jsonString = JSON.stringify(exportData, null, 2);
        
        // Copy to clipboard
        navigator.clipboard.writeText(jsonString).then(() => {
            this.log("📤 <strong>CHARACTER EXPORTED!</strong>", "success");
            this.log(`${char.name} (Level ${char.level} ${char.race} ${char.charClass}) copied to clipboard & downloaded!`, "dm");
            this.log("Compatible with Foundry VTT, Roll20, and other D&D 5e tools.", "dm");
            
            // Also offer download
            this.downloadCharacter(jsonString);
        }).catch(err => {
            // Fallback - just download
            this.downloadCharacter(jsonString);
            this.log("📤 <strong>CHARACTER EXPORTED!</strong>", "success");
            this.log("Character file downloaded!", "dm");
        });
    }
    
    downloadCharacter(jsonString) {
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${this.character.name.replace(/[^a-z0-9]/gi, '_')}_Level${this.character.level}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
    
    showImportCharacterDialog() {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.id = 'importModal';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 500px;">
                <h2 style="color: #c9a227; margin-bottom: 15px;">📥 Import Character</h2>
                <p style="margin-bottom: 15px; color: #aaa;">Paste your exported character data below, or load from a file:</p>
                
                <textarea id="importTextarea" placeholder="Paste character JSON here..." 
                    style="width: 100%; height: 150px; background: rgba(0,0,0,0.3); border: 2px solid #4a4a6a; 
                    border-radius: 8px; color: #fff; padding: 10px; font-family: monospace; font-size: 0.85rem;
                    resize: vertical; margin-bottom: 15px;"></textarea>
                
                <div style="margin-bottom: 15px;">
                    <label style="display: inline-block; background: linear-gradient(135deg, #4a4a6a 0%, #2d2d44 100%); 
                        padding: 10px 20px; border-radius: 8px; cursor: pointer; border: 2px solid #4a4a6a;">
                        📁 Load from File
                        <input type="file" id="importFileInput" accept=".dnd,.json,.txt" style="display: none;">
                    </label>
                </div>
                
                <div style="display: flex; gap: 10px; justify-content: flex-end;">
                    <button onclick="document.getElementById('importModal').remove()" 
                        style="padding: 10px 20px; background: #4a4a6a; border: none; border-radius: 8px; 
                        color: #fff; cursor: pointer;">Cancel</button>
                    <button onclick="game.processImport()" 
                        style="padding: 10px 20px; background: linear-gradient(135deg, #c9a227 0%, #8b7355 100%); 
                        border: none; border-radius: 8px; color: #1a1a2e; font-weight: bold; cursor: pointer;">
                        ⬇️ Import Character</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        // File input handler
        document.getElementById('importFileInput').addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    document.getElementById('importTextarea').value = event.target.result;
                };
                reader.readAsText(file);
            }
        });
    }
    
    processImport() {
        const textarea = document.getElementById('importTextarea');
        const jsonString = textarea.value.trim();
        
        if (!jsonString) {
            alert("Please paste character data or load a file first!");
            return;
        }
        
        try {
            const importData = JSON.parse(jsonString);
            
            // Validate import data
            if (importData.exportType !== 'dnd-character' || !importData.character) {
                alert("Invalid character file! This doesn't appear to be a D&D character export.");
                return;
            }
            
            // Normalize to internal format (handles both v3.0 and legacy v2.x)
            const raw = importData.character;
            const isV3 = importData.formatVersion >= "3.0";
            
            if (isV3) {
                // v3.0 format — extract flat values from nested objects
                this.importedCharacter = {
                    name: raw.name,
                    race: raw.race?.name || raw.race,
                    characterClass: raw.class?.name || raw.characterClass,
                    background: raw.background?.name || raw.background,
                    level: raw.level,
                    experience: raw.experience,
                    stats: raw.abilities ? (() => {
                        const s = {};
                        for (const [, data] of Object.entries(raw.abilities)) {
                            s[data.slug] = data.score;
                        }
                        return s;
                    })() : raw.stats || {},
                    maxHp: raw.hitPoints?.maximum || raw.maxHp,
                    hp: raw.hitPoints?.current || raw.hp,
                    gold: raw.currency?.gp ?? raw.gold ?? 0,
                    inventory: (raw.inventory || []).map(item => typeof item === 'string' ? item : item.name),
                    equippedWeapon: raw.equipment?.weapon || null,
                    equippedArmor: raw.equipment?.armor || null,
                    equippedShield: raw.equipment?.shield || null,
                    spellSlots: raw.spellcasting?.spellSlots || null,
                    maxSpellSlots: raw.spellcasting?.maxSpellSlots || null,
                    knownSpells: (raw.spellcasting?.knownSpells || []).map(s => typeof s === 'string' ? s : s.name),
                    preparedSpells: (raw.spellcasting?.preparedSpells || []).map(s => typeof s === 'string' ? s : s.name),
                    skills: (raw.skills || []).map(s => typeof s === 'string' ? s : s.name),
                    proficiencies: (raw.proficiencies || []).map(p => typeof p === 'string' ? p : p.name),
                    traits: raw.race?.traits || null,
                    inspiration: raw.inspiration || 0,
                    exhaustion: raw.exhaustion || 0
                };
            } else {
                // Legacy v2.x format — use directly
                this.importedCharacter = raw;
            }
            
            // Close modal
            document.getElementById('importModal').remove();
            
            // Update creation screen to show imported character
            this.applyImportedCharacter();
            
        } catch (e) {
            alert("Failed to parse character data. Make sure you copied the complete JSON text.\n\nError: " + e.message);
        }
    }
    
    applyImportedCharacter() {
        const char = this.importedCharacter;
        
        // Set name
        document.getElementById('nameInput').value = char.name;
        
        // Find and select race
        const raceOptions = document.querySelectorAll('#raceOptions .option-card');
        raceOptions.forEach(card => {
            const raceName = card.querySelector('h3').textContent;
            if (raceName === char.race) {
                card.click();
            }
        });
        
        // Find and select class
        const classOptions = document.querySelectorAll('#classOptions .option-card');
        classOptions.forEach(card => {
            const className = card.querySelector('h3').textContent;
            if (className === char.characterClass) {
                card.click();
            }
        });
        
        // Find and select background
        const bgOptions = document.querySelectorAll('#backgroundOptions .option-card');
        bgOptions.forEach(card => {
            const bgName = card.querySelector('h3').textContent;
            if (bgName === char.background) {
                card.click();
            }
        });
        
        // Show confirmation
        const importInfo = document.createElement('div');
        importInfo.id = 'importInfo';
        importInfo.style.cssText = 'background: rgba(201, 162, 39, 0.2); border: 2px solid #c9a227; border-radius: 8px; padding: 15px; margin: 10px auto; max-width: 600px; text-align: center;';
        importInfo.innerHTML = `
            <h3 style="color: #c9a227; margin-bottom: 10px;">✨ Importing: ${char.name}</h3>
            <p style="color: #aaa;">Level ${char.level} ${char.race} ${char.characterClass} • ${char.experience} XP • ${char.gold} Gold</p>
            <p style="color: #888; font-size: 0.85rem; margin-top: 5px;">Your character's level, XP, gold, inventory, and equipment will be preserved!</p>
        `;
        
        // Remove existing import info if any
        const existingInfo = document.getElementById('importInfo');
        if (existingInfo) existingInfo.remove();
        
        // Insert before the button
        const startBtn = document.getElementById('startGameBtn');
        startBtn.parentNode.insertBefore(importInfo, startBtn);
    }
    
    startGameWithImport() {
        // Called when starting game with an imported character
        const char = this.importedCharacter;
        
        // Apply all the imported stats to the character
        this.character.level = char.level;
        this.character.experience = char.experience;
        this.character.gold = char.gold;
        this.character.maxHp = char.maxHp;
        this.character.hp = char.hp;
        this.character.stats = { ...char.stats };
        // Inventory — ensure plain string names (handles both v3 objects and legacy strings)
        this.character.inventory = (char.inventory || []).map(item => typeof item === 'string' ? item : item.name);
        // Equipment slots
        if (char.equippedWeapon) this.character.equipped.weapon = char.equippedWeapon;
        if (char.equippedArmor) this.character.equipped.armor = char.equippedArmor;
        if (char.equippedShield) this.character.equipped.shield = char.equippedShield;
        
        if (char.spellSlots) this.character.spellSlots = { ...char.spellSlots };
        if (char.maxSpellSlots) this.character.maxSpellSlots = { ...char.maxSpellSlots };
        if (char.knownSpells) this.character.knownSpells = (char.knownSpells || []).map(s => typeof s === 'string' ? s : s.name);
        if (char.preparedSpells) this.character.preparedSpells = (char.preparedSpells || []).map(s => typeof s === 'string' ? s : s.name);
        if (char.skills) this.character.skills = (char.skills || []).map(s => typeof s === 'string' ? s : s.name);
        if (char.proficiencies) this.character.proficiencies = (char.proficiencies || []).map(p => typeof p === 'string' ? p : p.name);
        if (char.traits) {
            this.character.traits = Array.isArray(char.traits) ? [...char.traits] : 
                                   typeof char.traits === 'object' ? Object.values(char.traits) : [];
        }
        if (char.inspiration) this.character.inspiration = char.inspiration;
        if (char.exhaustion) this.character.exhaustion = char.exhaustion;
        
        // Recalculate HP cap based on class/level, then restore imported HP
        const importedHp = char.hp;
        this.character.calculateHp();
        // Override maxHp if the import had a higher value (e.g. from leveling in another campaign)
        if (char.maxHp && char.maxHp > 0) {
            this.character.maxHp = Math.max(char.maxHp, this.character.maxHp);
        }
        this.character.hp = Math.min(importedHp || this.character.maxHp, this.character.maxHp);
        
        // Clear imported character reference
        this.importedCharacter = null;
    }

    gameOver() {
        this.endCombat(false);
        this.log("💀 GAME OVER", "danger");
        this.log(`${this.character.name} has fallen after ${this.dm.turn} turns.`, "danger");
        this.log(`Final Level: ${this.character.level} | XP: ${this.character.experience}`, "dm");
        
        // Campaign-specific stats
        if (this.dm.campaignId === "nights_dark_terror") {
            this.log(`Goblins Slain: ${this.dm.questFlags.goblinsKilled} | Prisoners Rescued: ${this.dm.questFlags.prisonersRescued}`, "dm");
        } else if (this.dm.campaignId === "curse_of_strahd") {
            this.log(`Undead Slain: ${this.dm.questFlags.undeadKilled} | Villagers Rescued: ${this.dm.questFlags.villagersRescued}`, "dm");
        } else if (this.dm.campaignId === "tomb_of_annihilation") {
            this.log(`Dinosaurs Slain: ${this.dm.questFlags.dinosaursSlain} | Undead Slain: ${this.dm.questFlags.undeadSlain}`, "dm");
        } else if (this.dm.campaignId === "lost_mine_of_phandelver") {
            this.log(`Goblins Slain: ${this.dm.questFlags.goblinsKilled} | Redbrands Defeated: ${this.dm.questFlags.redbrandsDefeated} | Townsfolk Helped: ${this.dm.questFlags.townsfolkHelped}`, "dm");
        } else if (this.dm.campaignId === "keep_on_borderlands") {
            const outerKills = this.dm.questFlags.outerCavesKills || 0;
            const innerKills = this.dm.questFlags.innerCavesKills || 0;
            this.log(`Outer Cave Monsters: ${outerKills} | Inner Cave Monsters: ${innerKills} | Chapter Reached: ${this.dm.currentChapter}`, "dm");
        }
        
        // Delete current save on game over
        if (this.currentSaveKey) {
            deleteSave(this.currentSaveKey);
            this.currentSaveKey = null;
        }
        
        setTimeout(() => {
            if (confirm("Game Over! Would you like to start a new adventure?")) {
                location.reload();
            }
        }, 1000);
    }
    
    async triggerStoryEvent(eventType) {
        const campaignNpcs = this.dm.campaign.npcs;
        
        // Night's Dark Terror events
        switch(eventType) {
            case "intro":
                await this.showChoice(
                    "👤 Stephan Approaches",
                    `"Greetings, traveler! I am Stephan Sukiskyn, a horse trader. I need capable warriors to escort me to my family's homestead. The roads have become dangerous - goblins raid with impunity. I can pay 50 gold pieces, and my family will provide food and shelter. What say you?"`,
                    [{ text: "Accept the job" }, { text: "Ask for more information" }]
                ).then(choice => {
                    // Add NPC to journal
                    this.character.addJournalEntry('npc', { 
                        name: "Stephan Sukiskyn", 
                        notes: "Horse trader who hired us to escort him to his family homestead." 
                    });
                    
                    if (choice === 0) {
                        this.dm.questFlags.metStephan = true;
                        this.character.gold += 25;
                        this.log("You accept Stephan's offer. He pays you 25 gold upfront.", "success");
                        this.log(`<em>"Excellent! We leave at dawn. Meet me at Misha's Ferry."</em>`, "dm");
                    } else {
                        this.log(`<em>"My family breeds the finest white horses in Karameikos. But I haven't heard from them in weeks. I fear the worst. Please, I need your help!"</em>`, "dm");
                        this.dm.questFlags.metStephan = true;
                        this.character.gold += 25;
                        this.log("Moved by his plea, you accept. He pays you 25 gold upfront.", "success");
                    }
                    
                    // Add quest to journal
                    this.character.addJournalEntry('quest', {
                        id: 'journey_to_sukiskyn',
                        name: 'Journey to Sukiskyn',
                        description: 'Escort Stephan safely to his family homestead.',
                        completed: false
                    });
                    
                    this.log("📜 <strong>QUEST STARTED:</strong> Journey to Sukiskyn", "loot");
                    this.updateChapterDisplay();
                    this.updateUI();
                });
                break;
                
            case "reachSukiskyn":
                this.dm.currentChapter = 1;
                this.log("🏠 <strong>CHAPTER 1: SIEGE OF SUKISKYN</strong>", "danger");
                this.log(`As you approach the homestead, you hear screams and the howl of wolves! The palisade walls are surrounded by goblin wolf-riders!`, "dm");
                this.log(`Stephan cries out: <em>"No! My family! We must help them!"</em>`, "dm");
                this.log("📜 <strong>OBJECTIVE:</strong> Defend Sukiskyn from the goblin siege!", "loot");
                this.dm.questFlags.reachedSukiskyn = true;
                this.log("👥 <strong>NEW COMPANION AVAILABLE:</strong> Pyotr Sukiskyn can now join your party! Click 'Party' to recruit him.", "success");
                this.updateChapterDisplay();
                break;
                
            case "siegeVictory":
                this.dm.questFlags.survivedSiege = true;
                this.dm.currentChapter = 2;
                this.character.gold += 25;
                this.character.experience += 200;
                this.log("🎉 <strong>SIEGE BROKEN!</strong> The goblins retreat into the forest!", "success");
                this.log(`Pyotr Sukiskyn clasps your hand: <em>"You saved us, friend. But my brother Taras... they took him during the attack! Please, you must rescue him!"</em>`, "dm");
                this.log("📜 <strong>CHAPTER 2: THE KIDNAPPING</strong>", "danger");
                this.log("📜 <strong>OBJECTIVE:</strong> Track the goblins and rescue Taras!", "loot");
                this.updateChapterDisplay();
                this.updateUI();
                break;
            
            case "enterXitaqasLair":
                this.dm.questFlags.enteredXitaqasLair = true;
                this.dm.currentChapter = 3;
                this.log("🕳️ <strong>CHAPTER 3: XITAQA'S LAIR</strong>", "danger");
                this.log(`You enter the ancient ruins that the goblins have claimed as their stronghold. The stench of wolves and goblins fills the air.`, "dm");
                this.log(`Somewhere in these tunnels, King Xitaqa holds court - and prisoners await rescue!`, "dm");
                this.log("📜 <strong>OBJECTIVE:</strong> Infiltrate Xitaqa's lair and defeat him!", "loot");
                this.updateChapterDisplay();
                break;
                
            case "rescueTaras":
                this.dm.questFlags.rescuedTaras = true;
                this.dm.questFlags.prisonersRescued++;
                this.character.experience += 300;
                this.log("⛓️ You free Taras from his chains!", "success");
                this.log(`<em>"Thank the Immortals! The goblins spoke of the Iron Ring - slavers who paid them to capture prisoners. Their leader, a wizard called Golthar, seeks something in the mountains..."</em>`, "dm");
                this.log("📜 <strong>CLUE:</strong> The Iron Ring is behind the goblin attacks!", "loot");
                this.log("👥 <strong>NEW COMPANION AVAILABLE:</strong> Taras can now join your party! Click 'Party' to recruit him.", "success");
                break;
                
            case "defeatXitaqa":
                this.dm.questFlags.defeatedXitaqa = true;
                this.dm.currentChapter = 4;
                this.character.experience += 500;
                this.character.gold += 100;
                this.log("👑 <strong>KING XITAQA IS DEFEATED!</strong>", "success");
                this.log(`Among his possessions, you find letters from the Iron Ring, detailing their operations in Threshold and a 'Lost Valley' in the mountains.`, "dm");
                this.log("📜 <strong>CHAPTER 4: THE IRON RING</strong>", "danger");
                this.log("📜 <strong>OBJECTIVE:</strong> Investigate the Iron Ring in Threshold!", "loot");
                this.updateChapterDisplay();
                this.updateUI();
                break;
                
            case "findLostValley":
                this.dm.questFlags.foundLostValley = true;
                this.dm.currentChapter = 5;
                this.log("🏔️ <strong>CHAPTER 5: THE LOST VALLEY</strong>", "danger");
                this.log(`You discover a hidden valley, untouched for centuries! Ancient Hutaakan ruins cover the hillsides. At the center stands a massive temple.`, "dm");
                this.log(`Dark energy crackles from within - Golthar is performing some terrible ritual!`, "dm");
                this.log("📜 <strong>OBJECTIVE:</strong> Stop Golthar before it's too late!", "loot");
                this.updateChapterDisplay();
                break;
                
            case "defeatGolthar":
                this.dm.questFlags.defeatedGolthar = true;
                this.dm.currentChapter = 6;
                this.character.experience += 1000;
                this.character.gold += 500;
                this.log("💀 <strong>GOLTHAR IS DEFEATED!</strong>", "success");
                this.log(`The wizard's dark magic dissipates. The Iron Ring's plot is foiled!`, "dm");
                this.log("🎊 <strong>EPILOGUE: HEROES OF KARAMEIKOS</strong>", "success");
                this.log(`Word of your deeds spreads across the Grand Duchy. You have become legendary heroes! The Sukiskyn family honors you as friends for life.`, "dm");
                this.log(`<strong>🏆 CONGRATULATIONS! You have completed Night's Dark Terror!</strong>`, "success");
                this.log(`Final Stats - Level: ${this.character.level} | XP: ${this.character.experience} | Gold: ${this.character.gold}`, "loot");
                this.log(`Goblins Slain: ${this.dm.questFlags.goblinsKilled} | Prisoners Rescued: ${this.dm.questFlags.prisonersRescued}`, "loot");
                this.updateChapterDisplay();
                this.updateUI();
                break;
                
            // Curse of Strahd events
            case "intro_strahd":
                await this.showChoice(
                    "🚪 The Gates of Barovia",
                    `The massive iron gates creak open of their own accord. Beyond lies a road shrouded in mist, leading into darkness. You feel a chill that has nothing to do with the cold. There is no going back - the mists close behind you.`,
                    [{ text: "Press forward into the mist" }, { text: "Examine your surroundings" }]
                ).then(choice => {
                    this.dm.questFlags.enteredBarovia = true;
                    if (choice === 0) {
                        this.log("You steel yourself and step through the gates into the land of Barovia.", "dm");
                    } else {
                        this.log("The trees are bare and twisted. Ravens watch you from every branch. The mist swirls with an almost sentient malevolence.", "dm");
                        this.log("With no other choice, you press forward into the cursed land.", "dm");
                    }
                    this.log("📜 <strong>QUEST STARTED:</strong> Escape the land of Barovia", "loot");
                    this.updateChapterDisplay();
                    this.updateUI();
                });
                break;
                
            case "enterDeathHouse":
                this.dm.currentChapter = 0;
                this.log("🏚️ <strong>DEATH HOUSE</strong>", "danger");
                this.log(`The house seems to call to you. Two children stand outside, begging you to save their baby brother from the monster in the basement.`, "dm");
                this.log("📜 <strong>OBJECTIVE:</strong> Explore Death House and survive!", "loot");
                this.updateChapterDisplay();
                break;
                
            case "meetIsmark":
                this.dm.questFlags.metIsmark = true;
                this.dm.currentChapter = 1;
                this.character.experience += 100;
                
                // Add NPC to journal
                this.character.addJournalEntry('npc', { 
                    name: "Ismark Kolyanovich", 
                    notes: "Seeking help to protect his sister Ireena from the vampire lord Strahd." 
                });
                
                this.log("👤 <strong>CHAPTER 1: VILLAGE OF BAROVIA</strong>", "danger");
                await this.showChoice(
                    "👤 Ismark Kolyanovich",
                    `A weary-looking man approaches you in the tavern. "Strangers! Please, I need your help. The Devil Strahd has taken an interest in my sister Ireena. I must get her to safety in Vallaki, but the roads are too dangerous to travel alone. I can pay you for your protection."`,
                    [{ text: "Agree to help" }, { text: "Ask about Strahd" }]
                ).then(choice => {
                    if (choice === 1) {
                        this.log(`<em>"Strahd von Zarovich is the lord of this land - a vampire who has ruled for centuries. He has become obsessed with my sister. She bears bite marks on her neck... Please, we must act quickly!"</em>`, "dm");
                    }
                    
                    // Add quest to journal
                    this.character.addJournalEntry('quest', {
                        id: 'escape_barovia',
                        name: 'Escape the Land of Barovia',
                        description: 'Help Ismark and Ireena escape to Vallaki. Confront Strahd von Zarovich.',
                        completed: false
                    });
                    
                    this.log("📜 <strong>QUEST STARTED:</strong> Escape the land of Barovia", "loot");
                    this.log("You agree to help Ismark protect his sister.", "success");
                    this.log("📜 <strong>OBJECTIVE:</strong> Meet Ireena and escort her to safety!", "loot");
                    this.log("👥 <strong>NEW COMPANION AVAILABLE:</strong> Ismark Kolyanovich can now join your party! Click 'Party' to recruit him.", "success");
                    this.updateChapterDisplay();
                    this.updateUI();
                });
                break;
                
            case "meetIreena":
                this.dm.questFlags.metIreena = true;
                this.character.experience += 100;
                
                // Add NPC to journal
                this.character.addJournalEntry('npc', { 
                    name: "Ireena Kolyana", 
                    notes: "Ismark's sister. Bears the bite marks of Strahd. The vampire lord is obsessed with her." 
                });
                
                this.log("👩 You meet Ireena Kolyana.", "success");
                this.log(`<em>A beautiful young woman with auburn hair regards you with both hope and fear. Two faint puncture marks are visible on her neck.</em>`, "dm");
                this.log(`"I will not be a prisoner in my own home. If you are traveling to Vallaki, I will come with you. But first, my father must be buried properly."`, "dm");
                this.log("📜 <strong>CLUE:</strong> Ireena is Strahd's obsession!", "loot");
                break;
                
            case "visitMadamEva":
                this.dm.questFlags.visitedMadamEva = true;
                this.dm.currentChapter = 2;
                this.character.experience += 200;
                
                // Add NPC to journal
                this.character.addJournalEntry('npc', { 
                    name: "Madam Eva", 
                    notes: "Ancient Vistani fortune teller. Read our fate in the tarokka cards and foretold of treasures needed to defeat Strahd." 
                });
                
                this.log("🎪 <strong>CHAPTER 2: THE FORTUNE TELLER</strong>", "danger");
                this.log(`The ancient Vistani woman spreads her tarokka cards before you. Her eyes seem to see beyond the physical world.`, "dm");
                this.log(`<em>"Your fate is written in the cards. Listen well, for they will guide you to salvation... or doom."</em>`, "dm");
                this.log("📜 The cards reveal: A powerful weapon awaits in the castle. An ancient ally slumbers in the amber temple. The source of Strahd's power lies in the tome of his making.", "loot");
                this.log("📜 <strong>OBJECTIVE:</strong> Find the three treasures foretold!", "loot");
                this.updateChapterDisplay();
                break;
                
            case "reachVallaki":
                this.dm.questFlags.reachedVallaki = true;
                this.dm.currentChapter = 3;
                this.character.experience += 200;
                this.log("🏰 <strong>CHAPTER 3: THE TOWN OF VALLAKI</strong>", "danger");
                this.log(`Vallaki's walls offer some protection from the horrors outside. The Baron insists that 'All Will Be Well' and holds weekly festivals to prove it. But darkness festers beneath the cheerful facade.`, "dm");
                this.log("📜 <strong>OBJECTIVE:</strong> Investigate the troubles in Vallaki!", "loot");
                this.updateChapterDisplay();
                break;
            
            case "findVanRichten":
                this.dm.questFlags.foundVanRichten = true;
                this.dm.currentChapter = 4;
                this.character.experience += 300;
                this.log("🗼 <strong>CHAPTER 4: THE WIZARD'S TOWER</strong>", "danger");
                this.log(`You discover the hidden tower of Rudolph van Richten, the legendary vampire hunter. He has spent decades preparing to destroy Strahd.`, "dm");
                this.log(`<em>"You seek to challenge the Devil? Then you will need allies and artifacts of great power. The Amber Temple holds dark secrets..."</em>`, "dm");
                this.log("📜 <strong>OBJECTIVE:</strong> Find allies to stand against Strahd!", "loot");
                this.log("👥 <strong>NEW COMPANION AVAILABLE:</strong> Ezmerelda d'Avenir can now join your party! Click 'Party' to recruit her.", "success");
                this.updateChapterDisplay();
                break;
            
            case "reachAmberTemple":
                this.dm.questFlags.reachedAmberTemple = true;
                this.dm.currentChapter = 5;
                this.character.experience += 500;
                this.log("💎 <strong>CHAPTER 5: THE AMBER TEMPLE</strong>", "danger");
                this.log(`High in the frozen mountains, you find the Amber Temple - an ancient prison for dark vestiges. Here, Strahd first made his pact with the powers of darkness.`, "dm");
                this.log(`The vestiges whisper offers of forbidden power... Will you resist their temptation?`, "dm");
                this.log("📜 <strong>OBJECTIVE:</strong> Uncover the source of Strahd's power!", "loot");
                this.updateChapterDisplay();
                break;
            
            case "enterRavenloft":
                this.dm.questFlags.enteredRavenloft = true;
                this.dm.currentChapter = 6;
                this.character.experience += 500;
                this.log("🏰 <strong>CHAPTER 6: CASTLE RAVENLOFT</strong>", "danger");
                this.log(`The gates of Castle Ravenloft creak open as if expecting you. Lightning illuminates the towering spires above. Somewhere within, Strahd awaits.`, "dm");
                this.log(`<em>"Welcome to my home. I have been expecting you..."</em> Strahd's voice echoes from everywhere and nowhere.`, "dm");
                this.log("📜 <strong>OBJECTIVE:</strong> Defeat Strahd von Zarovich!", "loot");
                this.updateChapterDisplay();
                break;
                
            case "defeatStrahd":
                this.dm.questFlags.defeatedStrahd = true;
                this.dm.currentChapter = 7;
                this.character.experience += 5000;
                this.character.gold += 1000;
                this.log("🧛 <strong>STRAHD VON ZAROVICH IS DESTROYED!</strong>", "success");
                this.log(`As the ancient vampire crumbles to dust, a ray of sunlight breaks through the eternal clouds for the first time in centuries.`, "dm");
                this.log("🌅 <strong>EPILOGUE: DAWN OVER BAROVIA</strong>", "success");
                this.log(`The mists begin to lift. The people of Barovia emerge from their homes, blinking in the unfamiliar sunlight. The curse is broken!`, "dm");
                this.log(`<strong>🏆 CONGRATULATIONS! You have completed Curse of Strahd!</strong>`, "success");
                this.log(`Final Stats - Level: ${this.character.level} | XP: ${this.character.experience} | Gold: ${this.character.gold}`, "loot");
                this.log(`Undead Slain: ${this.dm.questFlags.undeadKilled} | Villagers Rescued: ${this.dm.questFlags.villagersRescued}`, "loot");
                this.updateChapterDisplay();
                this.updateUI();
                break;
            
            // Tomb of Annihilation events
            case "intro_toa":
                await this.showChoice(
                    "💀 The Death Curse",
                    `Syndra Silvane, an archmage dying from a mysterious curse, summons you to her tower. "The Death Curse is killing everyone who has ever been raised from the dead. I have traced its source to the jungle peninsula of Chult. Please, you must find the Soulmonger and destroy it before it claims us all."`,
                    [{ text: "Accept the quest" }, { text: "Ask about the curse" }]
                ).then(choice => {
                    if (choice === 1) {
                        this.log(`<em>"The curse prevents resurrection magic from working. Those who have been raised before are slowly wasting away. I have only weeks to live... Please, you are my last hope."</em>`, "dm");
                    }
                    this.dm.questFlags.metSyndra = true;
                    this.character.gold += 50;
                    
                    // Add NPC to journal
                    this.character.addJournalEntry('npc', { 
                        name: "Syndra Silvane", 
                        notes: "Dying archmage afflicted by the Death Curse. She hired us to find and destroy the Soulmonger in Chult." 
                    });
                    
                    // Add quest to journal
                    this.character.addJournalEntry('quest', {
                        id: 'end_death_curse',
                        name: 'End the Death Curse',
                        description: 'Travel to Chult and find the Soulmonger. Destroy it to end the Death Curse.',
                        completed: false
                    });
                    
                    this.log("You accept Syndra's quest. She provides 50 gold for passage to Chult.", "success");
                    this.log("📜 <strong>QUEST STARTED:</strong> End the Death Curse", "loot");
                    this.updateChapterDisplay();
                    this.updateUI();
                });
                break;
                
            case "arrivePort":
                this.dm.questFlags.arrivedPort = true;
                this.dm.currentChapter = 1;
                this.character.experience += 100;
                this.log("⚓ <strong>CHAPTER 1: PORT NYANZARU</strong>", "danger");
                this.log(`The ship pulls into the harbor of Port Nyanzaru, the greatest city in Chult. The air is thick with humidity, spices, and the calls of exotic birds. Dinosaurs walk the streets alongside merchants!`, "dm");
                this.log("📜 <strong>OBJECTIVE:</strong> Gather supplies and find a guide!", "loot");
                this.updateChapterDisplay();
                break;
                
            case "meetGuide":
                this.dm.questFlags.hiredGuide = true;
                this.character.experience += 100;
                this.log("👤 You find a guide willing to lead you into the jungle.", "success");
                await this.showChoice(
                    "🐯 Azaka Stormfang",
                    `A fierce-looking woman with wild hair approaches you. "You seek to venture into the jungle? I know its secrets better than anyone. For 5 gold per day, I will guide you. But I have my own quest - I seek to recover a family heirloom from the tower called Firefinger. Help me, and I will reduce my fee."`,
                    [{ text: "Agree to help her" }, { text: "Just hire her as a guide" }]
                ).then(choice => {
                    if (choice === 0) {
                        this.log("You agree to help Azaka recover her family mask from Firefinger.", "success");
                        this.log("📜 <strong>SIDE QUEST:</strong> Recover Azaka's mask!", "loot");
                    } else {
                        this.character.gold -= 20;
                        this.log("You hire Azaka as a guide. (20 gold advance)", "success");
                    }
                    this.log("👥 <strong>NEW COMPANION AVAILABLE:</strong> Azaka Stormfang can now join your party! Click 'Party' to recruit her.", "success");
                    this.updateUI();
                });
                break;
                
            case "enterJungle":
                this.dm.questFlags.enteredJungle = true;
                this.dm.currentChapter = 2;
                this.character.experience += 200;
                this.log("🌿 <strong>CHAPTER 2: THE JUNGLE</strong>", "danger");
                this.log(`The jungle of Chult is like nothing you've ever experienced. Ancient ruins peek through the canopy, and the calls of dinosaurs echo all around. Somewhere in this green hell lies the source of the Death Curse.`, "dm");
                this.log("📜 <strong>OBJECTIVE:</strong> Navigate the jungle and find clues to Omu!", "loot");
                this.log("👥 <strong>NEW COMPANION AVAILABLE:</strong> Artus Cimber can now join your party! Click 'Party' to recruit him.", "success");
                this.updateChapterDisplay();
                break;
                
            case "findOmu":
                this.dm.questFlags.foundOmu = true;
                this.dm.currentChapter = 3;
                this.character.experience += 500;
                this.log("🚪 <strong>CHAPTER 3: OMU, THE FORBIDDEN CITY</strong>", "danger");
                this.log(`After weeks of travel, you finally gaze upon Omu - the lost city of the Omuans. Crumbling buildings and overgrown streets stretch before you. Yuan-ti patrol the ruins, and nine shrines dedicated to the Trickster Gods dot the landscape.`, "dm");
                this.log("📜 <strong>OBJECTIVE:</strong> Collect the puzzle cubes from the Nine Shrines!", "loot");
                this.updateChapterDisplay();
                break;
            
            case "enterFane":
                this.dm.questFlags.enteredFane = true;
                this.dm.currentChapter = 4;
                this.character.experience += 400;
                this.log("🐍 <strong>CHAPTER 4: THE FANE OF THE NIGHT SERPENT</strong>", "danger");
                this.log(`You descend into the yuan-ti temple beneath Omu. The air is thick with incense and the hiss of serpents. Ras Nsi, the fallen paladin, rules here in service to a darker master.`, "dm");
                this.log("📜 <strong>OBJECTIVE:</strong> Find the entrance to the Tomb of the Nine Gods!", "loot");
                this.updateChapterDisplay();
                break;
                
            case "enterTomb":
                this.dm.questFlags.enteredTomb = true;
                this.dm.currentChapter = 5;
                this.character.experience += 500;
                this.log("💀 <strong>CHAPTER 5: THE TOMB OF THE NINE GODS</strong>", "danger");
                this.log(`You descend into Acererak's legendary tomb. The air grows cold, and you sense countless traps waiting to claim the unwary. Ghostly whispers echo through the halls - the spirits of adventurers who died here before you.`, "dm");
                this.log(`<em>"Many have entered. None have left. Welcome to your grave."</em> - A voice echoes from nowhere.`, "dm");
                this.log("📜 <strong>OBJECTIVE:</strong> Descend to the Cradle of the Death God!", "loot");
                this.updateChapterDisplay();
                break;
            
            case "defeatRasNsi":
                this.dm.questFlags.defeatedRasNsi = true;
                this.character.experience += 2000;
                this.character.gold += 300;
                this.log("🐍 <strong>RAS NSI IS DEFEATED!</strong>", "success");
                this.log(`The fallen paladin crumbles. With his dying breath, he gasps: "Acererak... betrayed me... The entrance to the tomb... through the mirror..."`, "dm");
                this.log("📜 <strong>CLUE:</strong> The tomb entrance is revealed!", "loot");
                this.updateUI();
                break;
            
            case "defeatAtropal":
                this.dm.questFlags.destroyedSoulmonger = true;
                this.character.experience += 5000;
                this.log("👶 <strong>THE ATROPAL IS DESTROYED!</strong>", "success");
                this.log(`The undead godling shrieks as it dissolves. The Soulmonger begins to crack and shatter! Across Faerûn, those afflicted by the Death Curse feel the weight lift from their souls.`, "dm");
                this.log("📜 <strong>The Death Curse is BROKEN!</strong>", "loot");
                this.log("But the tomb shakes... Someone is very angry...", "danger");
                this.updateUI();
                break;
            
            case "defeatAcererak":
                this.dm.questFlags.defeatedAcererak = true;
                this.dm.currentChapter = 6;
                this.character.experience += 10000;
                this.character.gold += 5000;
                this.log("💀 <strong>ACERERAK IS BANISHED!</strong>", "success");
                this.log(`The archlich screams in fury as his physical form is destroyed. "This is not the end! I am eternal! I will return!"`, "dm");
                this.log(`His phylactery is elsewhere, but for now, his plans are ruined. The tomb begins to collapse around you!`, "dm");
                this.log("🌴 <strong>EPILOGUE: CURSE LIFTED</strong>", "success");
                this.log(`You escape the crumbling tomb as Chult begins to heal. Syndra Silvane lives! The souls trapped by the Soulmonger are freed. You are heroes across all of Faerûn!`, "dm");
                this.log(`<strong>🏆 CONGRATULATIONS! You have completed Tomb of Annihilation!</strong>`, "success");
                this.log(`Final Stats - Level: ${this.character.level} | XP: ${this.character.experience} | Gold: ${this.character.gold}`, "loot");
                this.log(`Dinosaurs Slain: ${this.dm.questFlags.dinosaursSlain} | Undead Slain: ${this.dm.questFlags.undeadSlain}`, "loot");
                this.updateChapterDisplay();
                this.updateUI();
                break;
            
            // Keep on the Borderlands events
            case "arriveAtKeep":
                this.dm.questFlags.arrivedAtKeep = true;
                this.log("🚪 You approach the massive gates of the Keep on the Borderlands.", "dm");
                this.log(`The guards eye you suspiciously but allow you to enter. <em>"Welcome, traveler. Keep your weapons sheathed and cause no trouble."</em>`, "dm");
                this.log("📜 <strong>TIP:</strong> Travel to the Green Man Inn to find lodging!", "loot");
                this.updateUI();
                break;
                
            case "findLodging":
                this.dm.questFlags.foundLodging = true;
                this.dm.currentChapter = 1;
                this.character.experience += 50;
                this.log("🍺 <strong>CHAPTER 1: THE KEEP</strong>", "success");
                this.log(`Wilf the Innkeeper greets you warmly. <em>"A room's 5 silver a night, meals included. You look like an adventurer - if you're looking for excitement, ask the Castellan about the Caves of Chaos."</em>`, "dm");
                this.log("You've found lodging! Now explore the Keep and meet its inhabitants.", "success");
                this.log("📜 <strong>OBJECTIVE:</strong> Visit the Castellan in the Inner Bailey!", "loot");
                this.updateChapterDisplay();
                this.updateUI();
                break;
                
            case "exploreKeep":
                if (!this.dm.questFlags.exploredKeep) {
                    this.dm.questFlags.exploredKeep = true;
                    this.character.experience += 25;
                    this.log("🏘️ You explore the Outer Bailey of the Keep.", "dm");
                    this.log(`Shops line the streets - a trader sells adventuring supplies, and you spot a chapel and a tavern. Guards patrol regularly.`, "dm");
                    this.updateUI();
                }
                break;
                
            case "meetCastellan":
                this.dm.questFlags.metCastellan = true;
                this.dm.currentChapter = 2;
                this.character.experience += 100;
                
                // Add NPC to journal
                this.character.addJournalEntry('npc', { 
                    name: "The Castellan", 
                    notes: "Lord of the Keep. Tasked us with clearing the Caves of Chaos." 
                });
                
                this.log("🏰 <strong>CHAPTER 2: THE WILDERNESS</strong>", "danger");
                await this.showChoice(
                    "🏰 The Castellan",
                    `The lord of the Keep receives you in his hall. "I've heard of your arrival. The Caves of Chaos to the north have become a menace. Monsters raid our supply caravans, and settlers fear for their lives. Clear those caves, and you'll earn the gratitude of everyone in the Keep - and a fair reward. 100 gold for proof of the monsters' defeat."`,
                    [{ text: "Accept the quest" }, { text: "Ask for more information" }]
                ).then(choice => {
                    if (choice === 1) {
                        this.log(`<em>"The Caves are a day's travel through the wilderness. Multiple monster tribes lair there - kobolds, goblins, orcs, and worse. They've formed an unnatural alliance. Someone or something is organizing them."</em>`, "dm");
                    }
                    
                    // Add quest to journal
                    this.character.addJournalEntry('quest', {
                        id: 'clear_caves_of_chaos',
                        name: 'Clear the Caves of Chaos',
                        description: 'Defeat the monsters in the Caves of Chaos and bring proof to the Castellan. Reward: 100 gold.',
                        completed: false
                    });
                    
                    this.log("📜 <strong>QUEST STARTED:</strong> Clear the Caves of Chaos!", "loot");
                    this.log("📜 <strong>OBJECTIVE:</strong> Navigate the wilderness and find the Caves!", "loot");
                    this.log("👥 <strong>NEW COMPANION AVAILABLE:</strong> Marcus the Guard can now join your party! Click 'Party' to recruit him.", "success");
                    this.updateChapterDisplay();
                    this.updateUI();
                });
                break;
                
            case "findCaves":
                this.dm.questFlags.foundCaves = true;
                this.dm.currentChapter = 3;
                this.character.experience += 100;
                this.log("🏔️ <strong>CHAPTER 3: CAVES OF CHAOS - OUTER CAVES</strong>", "danger");
                this.log(`The ravine opens before you, a wound in the hillside. Dark cave mouths dot the cliff faces on both sides. You can smell smoke and hear distant drums.`, "dm");
                this.log(`You spot several cave entrances: small ones that might be Kobold warrens, medium ones that could house Goblins or Orcs.`, "dm");
                this.log("📜 <strong>OBJECTIVE:</strong> Clear the outer caves of monsters!", "loot");
                this.log("👥 <strong>NEW COMPANION AVAILABLE:</strong> Brother Caedmon the Cleric can now join your party! Click 'Party' to recruit him.", "success");
                this.updateChapterDisplay();
                break;
                
            case "enterKoboldCaves":
                this.dm.questFlags.enteredKobolds = true;
                this.log("🐀 You enter the Kobold Caves. Watch for traps!", "danger");
                this.log(`The tunnels are small - you have to crouch in places. Crude pit traps and tripwires are everywhere.`, "dm");
                break;
                
            case "enterGoblinCaves":
                this.dm.questFlags.enteredGoblins = true;
                this.log("👺 You enter the Goblin Caves.", "danger");
                this.log(`The stench of goblins fills the air. You hear arguing voices deeper in the tunnels.`, "dm");
                break;
            
            case "outerCavesCleared":
                this.dm.questFlags.outerCavesCleared = true;
                this.character.experience += 300;
                this.character.gold += 50;
                this.log("🎉 <strong>OUTER CAVES CLEARED!</strong>", "success");
                this.log(`You've driven out the kobolds, goblins, and orcs from the outer caves! The Keep will be pleased with your progress.`, "dm");
                this.log("📜 <strong>OBJECTIVE COMPLETE:</strong> The outer caves are secure!", "loot");
                this.log("📜 <strong>NEW OBJECTIVE:</strong> Venture deeper into the inner caves - Bugbear and Gnoll lairs await!", "loot");
                this.updateChapterDisplay();
                this.updateUI();
                break;
                
            case "innerCavesCleared":
                this.dm.questFlags.innerCavesCleared = true;
                this.character.experience += 400;
                this.character.gold += 75;
                this.log("🎉 <strong>INNER CAVES CLEARED!</strong>", "success");
                this.log(`The bugbears and gnolls have been vanquished! But rumors speak of a hidden temple deeper within...`, "dm");
                this.log("📜 <strong>OBJECTIVE COMPLETE:</strong> The inner caves are secure!", "loot");
                this.log("📜 <strong>NEW OBJECTIVE:</strong> Find the Temple of Evil Chaos - the source of the monster alliance!", "loot");
                this.updateChapterDisplay();
                this.updateUI();
                break;
                
            case "enterHobgoblinCaves":
                this.dm.questFlags.enteredHobgoblins = true;
                this.dm.currentChapter = 4;
                this.character.experience += 200;
                this.log("⚔️ <strong>CHAPTER 4: CAVES OF CHAOS - INNER CAVES</strong>", "danger");
                this.log(`These caves are different - organized, with guard posts and disciplined patrols. The Hobgoblins run a tight operation.`, "dm");
                this.log("📜 <strong>OBJECTIVE:</strong> Venture deeper and find the source of the monster alliance!", "loot");
                this.updateChapterDisplay();
                break;
            
            case "defeatedMinotaur":
                this.dm.questFlags.defeatedMinotaur = true;
                this.character.experience += 500;
                this.character.gold += 100;
                this.log("🐂 <strong>THE MINOTAUR IS SLAIN!</strong>", "success");
                this.log(`The beast falls with a final bellow. In its lair, you find bones of past victims and a hidden passage leading deeper into the ravine.`, "dm");
                this.log("📜 <strong>CLUE:</strong> Strange symbols on the walls suggest a temple nearby!", "loot");
                this.updateUI();
                break;
                
            case "enterTemple":
                this.dm.questFlags.enteredTemple = true;
                this.dm.currentChapter = 5;
                this.character.experience += 300;
                this.log("💀 <strong>CHAPTER 5: THE TEMPLE OF EVIL CHAOS</strong>", "danger");
                this.log(`Behind a hidden door, you discover a temple dedicated to dark gods. Evil acolytes chant in shadowy alcoves. This is the source of the monster alliance!`, "dm");
                this.log("📜 <strong>OBJECTIVE:</strong> Destroy the Temple and defeat the High Priest!", "loot");
                this.updateChapterDisplay();
                break;
                
            case "defeatedHighPriest":
                this.dm.questFlags.defeatedHighPriest = true;
                this.dm.currentChapter = 6;
                this.character.experience += 1000;
                this.character.gold += 500;
                this.log("💀 <strong>THE HIGH PRIEST IS DEFEATED!</strong>", "success");
                this.log(`With the High Priest's death, his dark magic fades. The remaining monsters flee into the wilderness, their unnatural alliance broken.`, "dm");
                this.log("🏰 <strong>EPILOGUE: HEROES OF THE BORDERLANDS</strong>", "success");
                this.log(`You return to the Keep as heroes! The Castellan presents you with a reward of 500 gold and declares a feast in your honor. The Borderlands are safe once more!`, "dm");
                this.log(`<strong>🏆 CONGRATULATIONS! You have completed Keep on the Borderlands!</strong>`, "success");
                this.log(`Final Stats - Level: ${this.character.level} | XP: ${this.character.experience} | Gold: ${this.character.gold}`, "loot");
                this.updateChapterDisplay();
                this.updateUI();
                break;
            
            // Lost Mine of Phandelver events
            case "intro_lmop":
                await this.showChoice(
                    "🛤️ The Triboar Trail",
                    `You've been driving the wagon of supplies for about half a day when you spot two dead horses sprawled across the trail. They're peppered with black-feathered arrows. The saddlebags have been looted. These are Gundren's horses! An ambush!`,
                    [{ text: "Draw weapons and search for survivors" }, { text: "Carefully examine the area for traps" }]
                ).then(choice => {
                    this.dm.questFlags.ambushed = true;
                    this.dm.currentChapter = 1;
                    if (choice === 0) {
                        this.log("You ready your weapons just as goblins leap from the bushes!", "danger");
                    } else {
                        this.log("You spot crude snare traps hidden in the underbrush. But the goblins notice you and attack!", "danger");
                        this.character.experience += 25;
                    }
                    this.log("📜 <strong>CHAPTER 1: GOBLIN TROUBLE</strong>", "danger");
                    this.log("📜 <strong>OBJECTIVE:</strong> Follow the goblin trail to find Gundren and Sildar!", "loot");
                    
                    this.character.addJournalEntry('quest', {
                        id: 'rescue_gundren',
                        name: 'Find Gundren Rockseeker',
                        description: 'Gundren and Sildar were ambushed by goblins on the Triboar Trail. Find them!',
                        completed: false
                    });
                    
                    this.log("📜 <strong>QUEST STARTED:</strong> Find Gundren Rockseeker", "loot");
                    this.log("💡 <strong>TIP:</strong> Travel to the Cragmaw Hideout to rescue Sildar!", "loot");
                    this.updateChapterDisplay();
                    this.updateUI();
                });
                break;
            
            case "rescueSildar":
                this.dm.questFlags.rescuedSildar = true;
                this.character.experience += 200;
                this.character.gold += 10;
                this.log("⛓️ You free Sildar Hallwinter from the goblins!", "success");
                this.log(`<em>"Thank the gods you found me! Those filthy goblins ambushed us on the road. They took Gundren and his map to somewhere called Cragmaw Castle - their chieftain King Grol has him. But first, we should head to Phandalin. I can tell you more there."</em>`, "dm");
                this.log("📜 <strong>CLUE:</strong> Gundren was taken to Cragmaw Castle!", "loot");
                this.log("👥 <strong>NEW COMPANION AVAILABLE:</strong> Sildar Hallwinter can now join your party! Click 'Party' to recruit him.", "success");
                this.updateUI();
                break;
            
            case "arrivePhandalin":
                this.dm.questFlags.arrivedPhandalin = true;
                this.dm.currentChapter = 2;
                this.character.experience += 100;
                this.log("🏘️ <strong>CHAPTER 2: PHANDALIN</strong>", "success");
                this.log(`You arrive in the small frontier town of Phandalin. It's a rough-and-tumble settlement of miners, farmers, and shopkeepers. But something is wrong - the townsfolk cast nervous glances at rough-looking thugs in tattered red cloaks who swagger through the streets.`, "dm");
                this.log(`<em>"The Redbrands," a merchant whispers. "They've been terrorizing the town for weeks. Their hideout is somewhere near the old Tresendar Manor."</em>`, "dm");
                this.log("📜 <strong>OBJECTIVE:</strong> Deliver the supplies and deal with the Redbrand menace!", "loot");
                this.log("👥 <strong>NEW COMPANION AVAILABLE:</strong> Sister Garaele can now join your party! Click 'Party' to recruit her.", "success");
                this.updateChapterDisplay();
                this.updateUI();
                break;
            
            case "meetBarthen":
                this.dm.questFlags.metBarthen = true;
                this.character.gold += 10;
                this.dm.questFlags.townsfolkHelped++;
                this.log("🏺 Elmar Barthen accepts the delivery of supplies.", "success");
                this.log(`<em>"Thank you for bringing these! Here's the 10 gold Gundren promised. Terrible shame about him being captured. The Redbrands are another matter entirely - they're led by someone called Glasstaff, holed up under Tresendar Manor on the east side of town."</em>`, "dm");
                this.log("📜 <strong>CLUE:</strong> The Redbrand leader 'Glasstaff' is in Tresendar Manor!", "loot");
                this.updateUI();
                break;
            
            case "sildarWarnsRedbrands":
                this.dm.questFlags.learnedRedbrands = true;
                this.log("💬 Sildar tells you more about the situation.", "dm");
                this.log(`<em>"I came to Phandalin searching for a fellow Lords' Alliance agent named Iarno Albrek. He disappeared here two months ago. I suspect the Redbrands may be involved. Also - I've been asking around about Cragmaw Castle. It's somewhere in Neverwinter Wood, northeast of here."</em>`, "dm");
                this.log("📜 <strong>CLUE:</strong> Missing agent Iarno Albrek may be connected to the Redbrands!", "loot");
                this.updateUI();
                break;
            
            case "enterRedbrandHideout":
                this.dm.questFlags.enteredRedbrandHideout = true;
                this.dm.currentChapter = 3;
                this.character.experience += 100;
                this.log("🏚️ <strong>CHAPTER 3: SECRETS OF TRESENDAR MANOR</strong>", "danger");
                this.log(`You descend into the cellar beneath the ruined manor. The Redbrand hideout sprawls through ancient crypts and storerooms. You can hear voices echoing through the stone corridors.`, "dm");
                this.log("📜 <strong>OBJECTIVE:</strong> Clear out the Redbrands and confront Glasstaff!", "loot");
                this.updateChapterDisplay();
                break;
            
            case "redbrandsCleared":
                this.dm.questFlags.clearedRedbrands = true;
                this.character.experience += 200;
                this.character.gold += 50;
                this.dm.questFlags.townsfolkHelped += 3;
                this.log("🎉 <strong>REDBRANDS DRIVEN OUT!</strong>", "success");
                this.log(`The remaining Redbrands flee the hideout. The townsfolk of Phandalin cheer as word spreads that their tormentors have been defeated!`, "dm");
                this.log("📜 <strong>OBJECTIVE:</strong> Now find Cragmaw Castle and rescue Gundren!", "loot");
                this.updateChapterDisplay();
                this.updateUI();
                break;
            
            case "defeatGlassstaff":
                this.dm.questFlags.defeatedGlassstaff = true;
                this.character.experience += 400;
                this.character.gold += 75;
                this.log("🪄 <strong>GLASSTAFF IS DEFEATED!</strong>", "success");
                this.log(`Among his belongings, you find a letter signed with a black spider symbol: <em>"Lord Albrek, my spies have located Wave Echo Cave. Secure the area around Phandalin and prevent anyone from interfering. - The Black Spider"</em>`, "dm");
                this.log(`Sildar is stunned: <em>"Iarno Albrek IS Glasstaff?! My own colleague, turned traitor! At least now we know the Black Spider is behind everything."</em>`, "dm");
                this.log("📜 <strong>CLUE:</strong> Glasstaff was Iarno Albrek! The Black Spider seeks Wave Echo Cave!", "loot");
                if (!this.dm.questFlags.clearedRedbrands) {
                    this.dm.questFlags.clearedRedbrands = true;
                    this.dm.questFlags.townsfolkHelped += 3;
                }
                this.updateUI();
                break;
            
            case "enterCragmawCastle":
                this.dm.questFlags.enteredCragmawCastle = true;
                this.dm.currentChapter = 4;
                this.character.experience += 150;
                this.log("🏰 <strong>CHAPTER 4: CRAGMAW CASTLE</strong>", "danger");
                this.log(`The crumbling castle looms ahead - towers collapsed, walls breached, but still formidable. Goblins patrol the ramparts and a bugbear's roar echoes from within. Gundren is somewhere inside!`, "dm");
                this.log("📜 <strong>OBJECTIVE:</strong> Storm Cragmaw Castle and rescue Gundren!", "loot");
                this.updateChapterDisplay();
                break;
            
            case "defeatKingGrol":
                this.dm.questFlags.defeatedKingGrol = true;
                this.dm.questFlags.rescuedGundren = true;
                this.character.experience += 500;
                this.character.gold += 100;
                this.log("👑 <strong>KING GROL IS DEFEATED!</strong>", "success");
                this.log(`You find Gundren chained in the bugbear's chamber, battered but alive!`, "dm");
                this.log(`<em>"You came for me! Thank Moradin! The Black Spider - his real name is Nezznar, a drow! He took my map to Wave Echo Cave. We must stop him before he claims the Forge of Spells!"</em>`, "dm");
                this.dm.currentChapter = 5;
                this.log("⛏️ <strong>CHAPTER 5: WAVE ECHO CAVE</strong>", "danger");
                this.log("📜 <strong>OBJECTIVE:</strong> Enter Wave Echo Cave and stop the Black Spider!", "loot");
                this.updateChapterDisplay();
                this.updateUI();
                break;
            
            case "enterWaveEchoCave":
                this.dm.questFlags.enteredWaveEchoCave = true;
                this.character.experience += 200;
                this.log("⛏️ You enter the legendary Wave Echo Cave!", "dm");
                this.log(`The sound of crashing waves echoes through the tunnels despite being miles from the sea - the source of the cave's name. Ancient mining tunnels branch in every direction. Skeletons of dwarves and orcs from the battle five hundred years ago still litter the passages.`, "dm");
                this.log("📜 <strong>OBJECTIVE:</strong> Find the Forge of Spells and stop Nezznar!", "loot");
                this.updateChapterDisplay();
                break;
            
            case "findForgeOfSpells":
                this.dm.questFlags.foundForgeOfSpells = true;
                this.character.experience += 300;
                this.log("🔨 <strong>THE FORGE OF SPELLS!</strong>", "success");
                this.log(`You discover the legendary Forge of Spells - a great stone brazier that burns with an eerie green flame. A spectator beholder-kin hovers nearby, still guarding the forge after five centuries!`, "dm");
                this.log(`The magical energy here is palpable. Weapons and armor placed in the forge could be imbued with magical power!`, "dm");
                this.updateUI();
                break;
            
            case "defeatFlameskull":
                this.character.experience += 500;
                this.log("💀 <strong>THE FLAMESKULL IS DESTROYED!</strong>", "success");
                this.log(`The flaming skull shatters! Its green fire dissipates, revealing a hidden passage deeper into the mine.`, "dm");
                this.updateUI();
                break;
            
            case "defeatBlackSpider":
                this.dm.questFlags.defeatedBlackSpider = true;
                this.dm.currentChapter = 6;
                this.character.experience += 1500;
                this.character.gold += 500;
                this.log("🕷️ <strong>THE BLACK SPIDER IS DEFEATED!</strong>", "success");
                this.log(`Nezznar crumples to the ground, his spider staff clattering beside him. <em>"Impossible... I was so close..."</em> The drow's schemes are finally over.`, "dm");
                this.log("⛏️ <strong>EPILOGUE: HEROES OF PHANDALIN</strong>", "success");
                this.log(`With the Black Spider defeated and Wave Echo Cave secured, the Rockseeker brothers can begin mining once more. The Forge of Spells will bring prosperity to the entire region!`, "dm");
                this.log(`You return to Phandalin as heroes! The townsfolk throw a celebration, and Gundren insists on sharing the mine's profits with you.`, "dm");
                this.log(`<strong>🏆 CONGRATULATIONS! You have completed Lost Mine of Phandelver!</strong>`, "success");
                this.log(`Final Stats - Level: ${this.character.level} | XP: ${this.character.experience} | Gold: ${this.character.gold}`, "loot");
                this.log(`Goblins Slain: ${this.dm.questFlags.goblinsKilled} | Redbrands Defeated: ${this.dm.questFlags.redbrandsDefeated} | Townsfolk Helped: ${this.dm.questFlags.townsfolkHelped}`, "loot");
                this.updateChapterDisplay();
                this.updateUI();
                break;
        }
    }
    
    updateChapterDisplay() {
        const chapter = this.dm.campaign.chapters[this.dm.currentChapter];
        if (chapter) {
            document.getElementById("chapterName").textContent = chapter.name;
            document.getElementById("chapterObjective").textContent = chapter.objective;
            
            // Show hint about where to go next
            const hint = this.getChapterHint();
            const hintEl = document.getElementById("chapterHint");
            if (hintEl && hint) {
                hintEl.textContent = hint;
                hintEl.style.display = "block";
            } else if (hintEl) {
                hintEl.style.display = "none";
            }
        }
    }
    
    // Get a helpful hint for the current chapter objective
    getChapterHint() {
        const campaignId = this.dm.campaignId;
        const chapter = this.dm.currentChapter;
        const flags = this.dm.questFlags;
        
        // Campaign-specific hints
        if (campaignId === "keep_on_borderlands") {
            if (chapter === 0 && !flags.arrivedAtKeep) return "💡 TRAVEL to Keep Gates to enter the Keep";
            if (chapter === 0 && flags.arrivedAtKeep && !flags.foundLodging) return "💡 TRAVEL to Green Man Inn for lodging";
            if (chapter === 1 && !flags.metCastellan) return "💡 TRAVEL to Keep - Inner Bailey to meet the Castellan";
            if (chapter === 1) return "💡 TRAVEL to The Wilderness to begin your quest";
            if (chapter === 2) return "💡 TRAVEL to Caves of Chaos - Entrance";
            if (chapter === 3 && !flags.outerCavesCleared) {
                const kills = flags.outerCavesKills || 0;
                return `💡 EXPLORE the caves! Clear monsters (${kills}/10) to progress`;
            }
            if (chapter === 3 && flags.outerCavesCleared) return "💡 TRAVEL to Bugbear or Gnoll Caves (inner caves)";
            if (chapter === 4 && !flags.innerCavesCleared) {
                const kills = flags.innerCavesKills || 0;
                return `💡 EXPLORE inner caves! Clear monsters (${kills}/8) to progress`;
            }
            if (chapter === 4 && flags.innerCavesCleared) return "💡 TRAVEL to find the Temple of Evil Chaos";
            if (chapter === 5) return "💡 TRAVEL to Inner Sanctum to face the High Priest!";
            if (chapter === 6) return "🎉 Congratulations! You've completed the campaign!";
        }
        
        if (campaignId === "nights_dark_terror") {
            if (chapter === 0 && !flags.metStephan) return "💡 Use EXPLORE to meet Stephan the horse trader";
            if (chapter === 0 && flags.metStephan) return "💡 TRAVEL to Sukiskyn Homestead";
            if (chapter === 1 && !flags.survivedSiege) {
                const kills = flags.goblinsKilled || 0;
                return `💡 EXPLORE to defend! Defeat goblins (${kills}/5) to break the siege`;
            }
            if (chapter === 2) return "💡 TRAVEL to track the goblins to Xitaqa's Lair";
            if (chapter === 3) return "💡 TRAVEL to Xitaqa's Throne Room to face the Goblin King";
            if (chapter === 4) return "💡 TRAVEL to investigate the Iron Ring in Threshold";
            if (chapter === 5) return "💡 TRAVEL to Golthar's Sanctum for the final battle";
            if (chapter === 6) return "🎉 Congratulations! You've completed the campaign!";
        }
        
        if (campaignId === "curse_of_strahd") {
            if (chapter === 0) return "💡 TRAVEL to Village of Barovia to find shelter";
            if (chapter === 1) return "💡 TRAVEL to Burgomaster's Mansion, then Tser Pool";
            if (chapter === 2) return "💡 TRAVEL to Tser Pool to meet Madam Eva";
            if (chapter === 3) return "💡 TRAVEL to explore Vallaki and find allies";
            if (chapter === 4) return "💡 TRAVEL to Van Richten's Tower or the Amber Temple";
            if (chapter === 5) return "💡 TRAVEL to the Amber Temple for dark secrets";
            if (chapter === 6) return "💡 TRAVEL to Castle Ravenloft to face Strahd!";
            if (chapter === 7) return "🎉 Congratulations! You've freed Barovia!";
        }
        
        if (campaignId === "tomb_of_annihilation") {
            if (chapter === 0) return "💡 TRAVEL to Port Nyanzaru Market to prepare";
            if (chapter === 1) return "💡 TRAVEL into the jungle to search for clues";
            if (chapter === 2) return "💡 TRAVEL to Omu, the Forbidden City";
            if (chapter === 3) return "💡 TRAVEL to the shrines of Omu for puzzle cubes";
            if (chapter === 4) return "💡 TRAVEL to the Fane of the Night Serpent";
            if (chapter === 5) return "💡 TRAVEL down through the Tomb levels";
            if (chapter === 6) return "🎉 Congratulations! The death curse is ended!";
        }
        
        if (campaignId === "lost_mine_of_phandelver") {
            if (chapter === 0 && !flags.ambushed) return "💡 TRAVEL along the Triboar Trail to deliver supplies";
            if (chapter === 1 && !flags.rescuedSildar) return "💡 TRAVEL to the Cragmaw Hideout to rescue Sildar";
            if (chapter === 1 && flags.rescuedSildar) return "💡 TRAVEL to Phandalin to deliver the supplies";
            if (chapter === 2 && !flags.enteredRedbrandHideout) return "💡 TRAVEL to Tresendar Manor Ruins to confront the Redbrands";
            if (chapter === 3 && !flags.defeatedGlassstaff) return "💡 TRAVEL to Glasstaff's Quarters to confront the Redbrand leader";
            if (chapter === 3 && flags.defeatedGlassstaff) return "💡 TRAVEL to Cragmaw Castle to rescue Gundren";
            if (chapter === 4 && !flags.defeatedKingGrol) return "💡 TRAVEL to King Grol's Chamber to rescue Gundren";
            if (chapter === 5 && !flags.foundForgeOfSpells) return "💡 EXPLORE Wave Echo Cave and find the Forge of Spells";
            if (chapter === 5 && flags.foundForgeOfSpells) return "💡 TRAVEL to the Temple of Dumathoin to face the Black Spider";
            if (chapter === 6) return "🎉 Congratulations! Phandalin is saved!";
        }
        
        return null;
    }
    
    getAvailableLocations() {
        // Filter locations based on current chapter
        // Only show locations from chapters you've already unlocked (current chapter and below)
        // PLUS the key progression location for the next chapter
        const chapter = this.dm.currentChapter;
        const flags = this.dm.questFlags;
        const campaignId = this.dm.campaignId;
        
        // Key progression locations that advance to the next chapter
        const progressionLocations = {
            "keep_on_borderlands": [
                "Keep Gates",                // Enter the Keep
                "Green Man Inn",             // Get lodging → Chapter 1
                "Keep - Inner Bailey",       // Meet Castellan → Chapter 2
                "Caves of Chaos - Entrance", // Find caves → Chapter 3
                "Temple of Evil Chaos",      // Enter temple → Chapter 5
                "Inner Sanctum"              // Final battle
            ],
            "nights_dark_terror": [
                "Sukiskyn Homestead",
                "Xitaqa's Lair - Entrance",
                "The Lost Valley - Entrance"
            ],
            "curse_of_strahd": [
                "Village of Barovia",
                "Tser Pool",
                "Vallaki",
                "Van Richten's Tower",
                "Amber Temple",
                "Castle Ravenloft - Gates"
            ],
            "tomb_of_annihilation": [
                "Port Nyanzaru - Market",
                "Aldani Basin",
                "Omu - City Gates",
                "Fane of the Night Serpent",
                "Tomb - Level 1"
            ],
            "lost_mine_of_phandelver": [
                "Goblin Ambush Site",
                "Phandalin - Town Square",
                "Tresendar Manor Ruins",
                "Cragmaw Castle - Ruins",
                "Wave Echo Cave - Entrance",
                "Temple of Dumathoin"
            ]
        };
        
        const campaignProgressionLocations = progressionLocations[campaignId] || [];
        
        return this.dm.campaign.locations.filter(loc => {
            // Only show locations at or below current chapter
            if (loc.chapter <= chapter) {
                return true;
            }
            
            // Show next chapter's KEY PROGRESSION location (so you can advance)
            if (loc.chapter === chapter + 1 && campaignProgressionLocations.includes(loc.name)) {
                return true;
            }
            
            // Special handling for Keep on the Borderlands - some locations unlock via flags
            if (campaignId === "keep_on_borderlands") {
                // Once you've arrived at the Keep, show all Keep locations (chapter 1)
                if (flags.arrivedAtKeep && loc.chapter === 1) {
                    return true;
                }
                // Once you've met the Castellan, show wilderness (chapter 2)
                if (flags.metCastellan && loc.chapter === 2) {
                    return true;
                }
                // Once you've found the caves, show outer cave locations (chapter 3)
                if (flags.foundCaves && loc.chapter === 3) {
                    return true;
                }
                // Once outer caves are cleared, show inner cave locations (chapter 4)
                if (flags.outerCavesCleared && loc.chapter === 4) {
                    return true;
                }
                // Once inner caves are cleared, show temple locations (chapter 5)
                if (flags.innerCavesCleared && loc.chapter === 5) {
                    return true;
                }
            }
            
            // Special handling for Night's Dark Terror
            if (campaignId === "nights_dark_terror") {
                // Once siege is survived, show chapter 2 locations
                if (flags.survivedSiege && loc.chapter === 2) {
                    return true;
                }
                // Once Xitaqa is defeated, show chapter 4 locations
                if (flags.defeatedXitaqa && loc.chapter === 4) {
                    return true;
                }
                // Once Iron Ring is found, show chapter 5 locations
                if (flags.foundLostValley && loc.chapter === 5) {
                    return true;
                }
            }
            
            // Special handling for Curse of Strahd
            if (campaignId === "curse_of_strahd") {
                // Once you meet Ismark, show chapter 2 locations
                if (flags.metIsmark && loc.chapter === 2) {
                    return true;
                }
                // Once you visit Madam Eva, show chapter 3 locations
                if (flags.visitedMadamEva && loc.chapter === 3) {
                    return true;
                }
                // Once you reach Vallaki, show chapter 4 locations
                if (flags.reachedVallaki && loc.chapter === 4) {
                    return true;
                }
                // Once you find Van Richten, show chapter 5 locations
                if (flags.foundVanRichten && loc.chapter === 5) {
                    return true;
                }
                // Once you reach Amber Temple, show chapter 6 locations
                if (flags.reachedAmberTemple && loc.chapter === 6) {
                    return true;
                }
            }
            
            // Special handling for Tomb of Annihilation
            if (campaignId === "tomb_of_annihilation") {
                // Once you arrive at port, show chapter 1 locations
                if (flags.arrivedPort && loc.chapter === 1) {
                    return true;
                }
                // Once you enter jungle, show chapter 2 locations
                if (flags.enteredJungle && loc.chapter === 2) {
                    return true;
                }
                // Once you find Omu, show chapter 3 locations
                if (flags.foundOmu && loc.chapter === 3) {
                    return true;
                }
                // Once you enter Fane, show chapter 4 locations
                if (flags.enteredFane && loc.chapter === 4) {
                    return true;
                }
                // Once you enter Tomb, show chapter 5 locations
                if (flags.enteredTomb && loc.chapter === 5) {
                    return true;
                }
            }
            
            // Special handling for Lost Mine of Phandelver
            if (campaignId === "lost_mine_of_phandelver") {
                // Once ambushed, show chapter 1 locations (Cragmaw Hideout)
                if (flags.ambushed && loc.chapter === 1) {
                    return true;
                }
                // Once arrived in Phandalin, show chapter 2 locations
                if (flags.arrivedPhandalin && loc.chapter === 2) {
                    return true;
                }
                // Once learned about Redbrands, show chapter 3 locations
                if (flags.enteredRedbrandHideout && loc.chapter === 3) {
                    return true;
                }
                // Once Redbrands cleared, show chapter 4 locations
                if (flags.clearedRedbrands && loc.chapter === 4) {
                    return true;
                }
                // Once Gundren rescued, show chapter 5 locations
                if (flags.rescuedGundren && loc.chapter === 5) {
                    return true;
                }
            }
            
            // Don't show future chapter locations
            return false;
        });
    }
}

// Initialize game
let game;
document.addEventListener("DOMContentLoaded", () => {
    // Inject equipment system styles
    const equipmentStyles = document.createElement('style');
    equipmentStyles.textContent = `
        .equipment-panel {
            background: rgba(0,0,0,0.3);
            border-radius: 8px;
            padding: 10px;
            margin-bottom: 15px;
        }
        .equipment-panel h4 {
            margin: 0 0 10px 0;
            color: #ffd700;
            font-size: 1rem;
        }
        .equip-slot {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 5px 0;
            border-bottom: 1px solid rgba(255,255,255,0.1);
        }
        .equip-slot:last-child {
            border-bottom: none;
        }
        .slot-label {
            font-weight: bold;
            color: #aaa;
            min-width: 60px;
        }
        .slot-item {
            flex: 1;
            color: #fff;
            font-size: 0.9rem;
        }
        .unequip-btn {
            background: #8b0000;
            color: white;
            border: none;
            border-radius: 4px;
            padding: 2px 8px;
            cursor: pointer;
            font-size: 0.8rem;
        }
        .unequip-btn:hover {
            background: #a00;
        }
        .inventory-item {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 8px;
            margin: 4px 0;
            background: rgba(255,255,255,0.05);
            border-radius: 4px;
        }
        .inventory-item.equipped {
            background: rgba(0,100,0,0.3);
            border-left: 3px solid #4CAF50;
        }
        .inventory-item .item-name {
            flex: 1;
        }
        .equipped-badge {
            color: #4CAF50;
            font-size: 0.8rem;
            font-weight: bold;
        }
        .equip-btn {
            background: #1e88e5;
            color: white;
            border: none;
            border-radius: 4px;
            padding: 4px 10px;
            cursor: pointer;
            font-size: 0.8rem;
        }
        .equip-btn:hover {
            background: #1976d2;
        }
        .use-btn {
            background: #43a047;
            color: white;
            border: none;
            border-radius: 4px;
            padding: 4px 10px;
            cursor: pointer;
            font-size: 0.8rem;
        }
        .use-btn:hover {
            background: #388e3c;
        }
        /* Shop Modal Styles */
        .shop-modal-content {
            max-width: 650px;
            max-height: 80vh;
            overflow: hidden;
            display: flex;
            flex-direction: column;
        }
        .shop-mode-tabs {
            display: flex;
            gap: 10px;
            margin-bottom: 10px;
            padding-bottom: 10px;
            border-bottom: 2px solid rgba(255,255,255,0.2);
            flex-shrink: 0;
        }
        .shop-mode-tab {
            background: rgba(255,255,255,0.1);
            border: 2px solid transparent;
            color: #fff;
            padding: 10px 24px;
            border-radius: 6px;
            cursor: pointer;
            font-weight: bold;
            font-size: 1rem;
            transition: all 0.2s;
        }
        .shop-mode-tab:hover {
            background: rgba(255,255,255,0.2);
        }
        .shop-mode-tab.active {
            background: linear-gradient(135deg, #1e88e5, #1565c0);
            border-color: #42a5f5;
        }
        .shop-tabs {
            display: flex;
            gap: 5px;
            margin-bottom: 15px;
            flex-wrap: wrap;
            flex-shrink: 0;
        }
        .shop-tab {
            background: rgba(255,255,255,0.1);
            border: none;
            color: #fff;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            transition: background 0.2s;
        }
        .shop-tab:hover {
            background: rgba(255,255,255,0.2);
        }
        .shop-tab.active {
            background: #1e88e5;
        }
        .shop-items {
            display: flex;
            flex-direction: column;
            gap: 8px;
            flex: 1;
            min-height: 0;
            overflow-y: auto;
            padding-right: 10px;
        }
        .shop-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: rgba(255,255,255,0.05);
            padding: 12px;
            border-radius: 6px;
            transition: background 0.2s;
        }
        .shop-item:hover {
            background: rgba(255,255,255,0.1);
        }
        .shop-item.cannot-afford {
            opacity: 0.5;
        }
        .shop-item.owned {
            border-left: 3px solid #4CAF50;
        }
        .shop-item.campaign-item {
            border-right: 3px solid #ff9800;
            background: rgba(255, 152, 0, 0.1);
        }
        .shop-item.campaign-item:hover {
            background: rgba(255, 152, 0, 0.2);
        }
        .inventory-item.campaign-item {
            border-left: 3px solid #ff9800;
            background: rgba(255, 152, 0, 0.15);
        }
        .shop-item-info {
            display: flex;
            flex-direction: column;
            gap: 4px;
            flex: 1;
        }
        .shop-item-name {
            font-weight: bold;
            color: #fff;
        }
        .shop-item-stats {
            font-size: 0.85rem;
            color: #4fc3f7;
            font-weight: 500;
        }
        .shop-item-desc {
            font-size: 0.8rem;
            color: #aaa;
            font-style: italic;
            line-height: 1.3;
        }
        .shop-item-price {
            display: flex;
            align-items: center;
            gap: 10px;
            color: gold;
            min-width: 120px;
            justify-content: flex-end;
        }
        .sell-price {
            color: #4CAF50;
            font-weight: bold;
        }
        .sell-btn {
            background: linear-gradient(135deg, #ff9800, #f57c00);
            color: white;
            border: none;
            border-radius: 4px;
            padding: 6px 14px;
            cursor: pointer;
            font-weight: bold;
        }
        .sell-btn:hover {
            background: linear-gradient(135deg, #ffa726, #ff9800);
        }
        .sell-item.equipped-item {
            border-left: 3px solid #f44336;
            opacity: 0.7;
        }
        .equipped-badge {
            color: #f44336;
            font-size: 0.75rem;
            font-weight: bold;
        }
        .buy-btn {
            background: #4CAF50;
            color: white;
            border: none;
            border-radius: 4px;
            padding: 6px 14px;
            cursor: pointer;
            font-weight: bold;
        }
        .buy-btn:hover:not(:disabled) {
            background: #45a049;
        }
        .buy-btn:disabled {
            background: #666;
            cursor: not-allowed;
        }
        .owned-badge {
            color: #4CAF50;
            font-size: 0.8rem;
            font-weight: bold;
        }
        .close-btn {
            margin-top: 15px;
            background: #666;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 4px;
            cursor: pointer;
            width: 100%;
            flex-shrink: 0;
        }
        .close-btn:hover {
            background: #777;
        }
        .shop-btn {
            background: linear-gradient(135deg, #f5af19, #f12711);
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            font-weight: bold;
            margin-top: 5px;
        }
        .shop-btn:hover {
            opacity: 0.9;
        }
        /* Post-Combat Summary Modal Styles */
        .post-combat-modal-content {
            max-width: 500px;
            text-align: left;
        }
        .post-combat-modal-content h2 {
            text-align: center;
            color: #4CAF50;
            margin-bottom: 20px;
        }
        .post-combat-section {
            background: rgba(255,255,255,0.05);
            border-radius: 8px;
            padding: 12px;
            margin-bottom: 12px;
        }
        .post-combat-section h3 {
            margin: 0 0 8px 0;
            font-size: 1rem;
            color: #ffd700;
        }
        .post-combat-section p {
            margin: 4px 0;
        }
        .post-combat-section ul li {
            font-size: 0.9rem;
        }
        /* Mini-Map Styles */
        .mini-map-container {
            background: rgba(0,0,0,0.4);
            border-radius: 8px;
            padding: 8px;
            margin: 8px 0;
            border: 1px solid rgba(255,255,255,0.1);
            max-height: 150px;
            overflow-y: auto;
            transition: max-height 0.3s ease;
        }
        .mini-map-container.expanded {
            max-height: 400px;
        }
        .mini-map-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 6px;
        }
        .mini-map-header h4 {
            margin: 0;
            color: #ffd700;
            font-size: 0.85rem;
        }
        .map-toggle-btn {
            background: rgba(255,255,255,0.1);
            border: none;
            color: #fff;
            padding: 2px 8px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 1rem;
        }
        .map-toggle-btn:hover {
            background: rgba(255,255,255,0.2);
        }
        .mini-map-content {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }
        .map-chapter {
            background: rgba(255,255,255,0.03);
            border-radius: 6px;
            padding: 6px;
        }
        .map-chapter.current-chapter {
            background: rgba(30, 136, 229, 0.15);
            border-left: 3px solid #1e88e5;
        }
        .map-chapter.past-chapter {
            opacity: 0.7;
        }
        .map-chapter-title {
            font-size: 0.75rem;
            color: #888;
            margin-bottom: 4px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .map-locations {
            display: flex;
            flex-direction: column;
            gap: 3px;
        }
        .map-location {
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 4px 8px;
            border-radius: 4px;
            cursor: pointer;
            transition: background 0.2s;
            font-size: 0.85rem;
        }
        .map-location:hover {
            background: rgba(255,255,255,0.1);
        }
        .map-location.current {
            background: rgba(76, 175, 80, 0.3);
            border: 1px solid #4CAF50;
        }
        .map-location.safe {
            border-left: 2px solid #4CAF50;
        }
        .map-location.moderate {
            border-left: 2px solid #ff9800;
        }
        .map-location.dangerous {
            border-left: 2px solid #f44336;
        }
        .map-location .loc-icon {
            font-size: 1rem;
        }
        .map-location .loc-name {
            flex: 1;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        .map-location .you-marker {
            font-size: 0.9rem;
            animation: pulse 1.5s infinite;
        }
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }
        .map-objective {
            margin-top: 8px;
            padding: 8px;
            background: rgba(255, 215, 0, 0.1);
            border-radius: 4px;
            font-size: 0.8rem;
            color: #ffd700;
            border-left: 3px solid #ffd700;
        }
        /* Item Info Button and Modal Styles */
        .info-btn {
            background: transparent;
            border: none;
            cursor: pointer;
            font-size: 0.85rem;
            padding: 2px 4px;
            opacity: 0.6;
            transition: opacity 0.2s;
        }
        .info-btn:hover {
            opacity: 1;
        }
        .inventory-item .item-name {
            cursor: pointer;
            flex: 1;
        }
        .inventory-item .item-name:hover {
            text-decoration: underline;
            color: #64b5f6;
        }
        .item-info-modal-content {
            max-width: 450px;
            text-align: left;
        }
        .item-info-modal-content h2 {
            text-align: center;
            color: #ffd700;
            margin-bottom: 10px;
        }
        .item-info-category {
            text-align: center;
            color: #888;
            font-size: 0.9rem;
            margin-bottom: 15px;
            padding: 4px 12px;
            background: rgba(255,255,255,0.1);
            border-radius: 12px;
            display: inline-block;
            width: auto;
            margin-left: 50%;
            transform: translateX(-50%);
        }
        .item-info-stats {
            background: rgba(255,255,255,0.05);
            border-radius: 8px;
            padding: 12px;
            margin-bottom: 15px;
        }
        .stat-row {
            display: flex;
            justify-content: space-between;
            padding: 6px 0;
            border-bottom: 1px solid rgba(255,255,255,0.1);
        }
        .stat-row:last-child {
            border-bottom: none;
        }
        .stat-label {
            color: #aaa;
        }
        .item-info-description {
            padding: 12px;
            background: rgba(100, 181, 246, 0.1);
            border-left: 3px solid #64b5f6;
            border-radius: 4px;
            font-style: italic;
            line-height: 1.5;
        }
        .item-info-value {
            margin-top: 12px;
            text-align: center;
            color: gold;
            font-weight: bold;
        }
        /* Combat Party Status Display */
        .combat-party-status {
            background: rgba(0,0,0,0.4);
            border-radius: 8px;
            padding: 10px;
            margin: 10px 0;
            border: 1px solid rgba(255,255,255,0.2);
        }
        .party-combat-header {
            font-weight: bold;
            color: #ffd700;
            margin-bottom: 8px;
            font-size: 0.9rem;
        }
        .party-combat-list {
            display: flex;
            flex-direction: column;
            gap: 6px;
        }
        .party-combat-member {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 6px 8px;
            background: rgba(255,255,255,0.05);
            border-radius: 4px;
        }
        .party-combat-member.unconscious {
            opacity: 0.5;
            background: rgba(139, 0, 0, 0.3);
        }
        .pcm-name {
            min-width: 100px;
            font-weight: bold;
            font-size: 0.85rem;
        }
        .pcm-hp-bar {
            flex: 1;
            height: 12px;
            background: rgba(0,0,0,0.5);
            border-radius: 6px;
            overflow: hidden;
        }
        .pcm-hp-fill {
            height: 100%;
            transition: width 0.3s;
        }
        .pcm-hp-fill.healthy { background: linear-gradient(to right, #4CAF50, #66BB6A); }
        .pcm-hp-fill.wounded { background: linear-gradient(to right, #ff9800, #ffb74d); }
        .pcm-hp-fill.critical { background: linear-gradient(to right, #f44336, #ef5350); }
        .pcm-hp-text {
            min-width: 55px;
            text-align: right;
            font-size: 0.8rem;
            color: #ccc;
        }
        /* Party Panel Heal Buttons */
        .companion-hp-bar-container {
            position: relative;
            width: 120px;
            height: 18px;
            background: rgba(0,0,0,0.5);
            border-radius: 9px;
            overflow: hidden;
        }
        .companion-hp-bar {
            height: 100%;
            transition: width 0.3s;
        }
        .companion-hp-bar.healthy { background: linear-gradient(to right, #4CAF50, #66BB6A); }
        .companion-hp-bar.wounded { background: linear-gradient(to right, #ff9800, #ffb74d); }
        .companion-hp-bar.critical { background: linear-gradient(to right, #f44336, #ef5350); }
        .companion-hp-text {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            text-align: center;
            font-size: 0.75rem;
            line-height: 18px;
            color: white;
            text-shadow: 1px 1px 2px black;
        }
        .member-actions {
            display: flex;
            gap: 5px;
            flex-wrap: wrap;
            margin-top: 8px;
        }
        .heal-btn {
            background: linear-gradient(135deg, #2e7d32, #388e3c);
            color: white;
            border: none;
            border-radius: 4px;
            padding: 4px 8px;
            cursor: pointer;
            font-size: 0.75rem;
            transition: all 0.2s;
        }
        .heal-btn:hover {
            background: linear-gradient(135deg, #388e3c, #43a047);
            transform: scale(1.05);
        }
        .no-heals {
            color: #888;
            font-size: 0.75rem;
            font-style: italic;
        }
        .full-hp {
            color: #4CAF50;
            font-size: 0.8rem;
        }
        .small-btn.dismiss {
            background: #8b0000;
            margin-left: auto;
        }
        .party-member .member-stats {
            display: flex;
            align-items: center;
            gap: 15px;
            flex-wrap: wrap;
        }
    `;
    document.head.appendChild(equipmentStyles);
    
    game = new Game();
    
    // Listen for name input changes
    document.getElementById("nameInput").addEventListener("input", () => game.checkStartButton());
    
    // Start game button
    document.getElementById("startGameBtn").addEventListener("click", () => game.startGame());
});

// ==================== PROFESSIONAL LANDING PAGE & LOADING ==================== 

// Demo mode functionality
function startDemo() {
    const landingPage = document.getElementById('landing-page');
    const loadingScreen = document.getElementById('loading-screen');
    
    // Hide landing page
    landingPage.classList.add('hidden');
    
    // Show loading screen
    loadingScreen.classList.remove('hidden');
    
    const loadingText = document.querySelector('.loading-text');
    const tipElement = document.querySelector('.loading-tip');
    
    if (loadingText) loadingText.textContent = '🎬 Loading Demo 🎬';
    if (tipElement) tipElement.textContent = 'Experience the adventure in auto-play mode!';
    
    // Start demo after loading
    setTimeout(() => {
        loadingScreen.classList.add('hidden');
        alert('🎬 DEMO MODE 🎬\n\nWatch as an AI adventurer plays through a sample quest!\n\n' +
              'Features showcased:\n' +
              '✓ Character creation\n' +
              '✓ Combat mechanics\n' +
              '✓ Exploration\n' +
              '✓ Leveling system\n' +
              '✓ Quest completion\n\n' +
              'Click OK to return to the main menu and create your own character!');
        
        // Return to landing page
        landingPage.classList.remove('hidden');
    }, 2500);
}

// Landing page functionality
function startGame() {
    const landingPage = document.getElementById('landing-page');
    const loadingScreen = document.getElementById('loading-screen');
    
    // Hide landing page
    landingPage.classList.add('hidden');
    
    // Show loading screen
    loadingScreen.classList.remove('hidden');
    
    // Simulate loading with random tips
    const tips = [
        "💡 Tip: Always check your inventory before exploring!",
        "💡 Tip: Resting restores HP and spell slots.",
        "💡 Tip: Use keyboard shortcuts for faster combat!",
        "💡 Tip: Recruit companions to strengthen your party.",
        "💡 Tip: Complete side quests for extra rewards.",
        "💡 Tip: Save your game frequently!",
        "💡 Tip: Different combat tactics affect your AC and damage.",
        "💡 Tip: Crafting powerful items can give you an edge.",
        "💡 Tip: Your background affects available skills and story options.",
        "💡 Tip: High Charisma helps with persuasion and deception.",
        "💡 Tip: Stealth can help you avoid dangerous encounters.",
        "💡 Tip: Explore thoroughly to find hidden treasures."
    ];
    
    const tipElement = document.querySelector('.loading-tip');
    if (tipElement) {
        tipElement.textContent = tips[Math.floor(Math.random() * tips.length)];
    }
    
    // Hide loading screen after delay
    setTimeout(() => {
        loadingScreen.classList.add('hidden');
    }, 2000);
}

// Initialize on page load
window.addEventListener('DOMContentLoaded', () => {
    const loadingScreen = document.getElementById('loading-screen');
    
    // Hide initial loading screen after assets load
    setTimeout(() => {
        loadingScreen.classList.add('hidden');
    }, 1500);
});

// Add smooth scrolling for better UX
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });
});

// Add version and credits info
console.log('%c⚔️ D&D: Realms of Adventure v2.5 ⚔️', 'color: #d4af37; font-size: 20px; font-weight: bold;');
console.log('%cA professional D&D 5th Edition web experience', 'color: #c9a227; font-size: 12px;');
console.log('%c📜 Features: Multiple campaigns, character creation, achievements, companions, crafting, and more!', 'color: #888;');
console.log('%c💾 Auto-save enabled | 🎮 Keyboard shortcuts available | 🎲 Authentic D&D rules', 'color: #888;');

