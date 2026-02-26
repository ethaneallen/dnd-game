# D&D 5e Text Adventure Engine  v3.1.0
# "Combat Gates" — Campaign Progression Overhaul, February 2026
import random
import json
import os

class Character:
    RACES = {
        "Human": {"bonus": {"all": 1}, "traits": ["Versatile"]},
        "Elf": {"bonus": {"dex": 2}, "traits": ["Darkvision", "Fey Ancestry"]},
        "Dwarf": {"bonus": {"con": 2}, "traits": ["Darkvision", "Dwarven Resilience"]},
        "Halfling": {"bonus": {"dex": 2}, "traits": ["Lucky", "Brave"]},
        "Dragonborn": {"bonus": {"str": 2, "cha": 1}, "traits": ["Breath Weapon", "Damage Resistance"]},
        "Tiefling": {"bonus": {"int": 1, "cha": 2}, "traits": ["Darkvision", "Hellish Resistance"]},
    }
    
    CLASSES = {
        "Fighter": {"hit_die": 10, "primary": "str", "saves": ["str", "con"],
                    "skills": ["Athletics", "Intimidation"],
                    "equipment": ["Longsword", "Shield", "Chain Mail"],
                    "caster_mult": 0, "subclass_caster": 0.33},  # Eldritch Knight
        "Wizard": {"hit_die": 6, "primary": "int", "saves": ["int", "wis"],
                   "skills": ["Arcana", "History"],
                   "equipment": ["Quarterstaff", "Spellbook", "Robes"],
                   "caster_mult": 1.0},
        "Rogue": {"hit_die": 8, "primary": "dex", "saves": ["dex", "int"],
                  "skills": ["Stealth", "Thieves' Tools"],
                  "equipment": ["Shortsword", "Dagger", "Leather Armor"],
                  "caster_mult": 0, "subclass_caster": 0.33},  # Arcane Trickster
        "Cleric": {"hit_die": 8, "primary": "wis", "saves": ["wis", "cha"],
                   "skills": ["Medicine", "Religion"],
                   "equipment": ["Mace", "Shield", "Scale Mail"],
                   "caster_mult": 1.0},
        "Ranger": {"hit_die": 10, "primary": "dex", "saves": ["str", "dex"],
                   "skills": ["Survival", "Nature"],
                   "equipment": ["Longbow", "Shortsword", "Leather Armor"],
                   "caster_mult": 0.5},
        "Barbarian": {"hit_die": 12, "primary": "str", "saves": ["str", "con"],
                      "skills": ["Athletics", "Survival"],
                      "equipment": ["Greataxe", "Handaxes", "Hide Armor"],
                      "caster_mult": 0},
        "Warlock": {"hit_die": 8, "primary": "cha", "saves": ["wis", "cha"],
                    "skills": ["Arcana", "Deception"],
                    "equipment": ["Quarterstaff", "Leather Armor"],
                    "caster_mult": 0, "pact_magic": True},
        "Paladin": {"hit_die": 10, "primary": "str", "saves": ["wis", "cha"],
                    "skills": ["Athletics", "Religion"],
                    "equipment": ["Longsword", "Shield", "Chain Mail"],
                    "caster_mult": 0.5},
    }
    
    BACKGROUNDS = {
        "Soldier": {"skills": ["Athletics", "Intimidation"], "feature": "Military Rank"},
        "Scholar": {"skills": ["Arcana", "History"], "feature": "Researcher"},
        "Criminal": {"skills": ["Deception", "Stealth"], "feature": "Criminal Contact"},
        "Noble": {"skills": ["History", "Persuasion"], "feature": "Position of Privilege"},
        "Outlander": {"skills": ["Athletics", "Survival"], "feature": "Wanderer"},
        "Acolyte": {"skills": ["Insight", "Religion"], "feature": "Shelter of the Faithful"},
    }

    def __init__(self):
        self.name = ""
        self.race = ""
        self.char_class = ""
        self.background = ""
        self.level = 1
        self.experience = 0
        self.stats = {"str": 10, "dex": 10, "con": 10, "int": 10, "wis": 10, "cha": 10}
        self.hp = 0
        self.max_hp = 0
        self.ac = 10
        self.base_ac = 10
        self.inventory = []
        self.gold = 0
        self.traits = []
        self.skills = []
        # --- Action Economy State ---
        self.has_used_reaction = False
        self.has_used_bonus_action = False
        self.bonus_action_spell_this_turn = False  # True if a leveled spell was cast as BA
        self.has_used_object_interaction = False
        self.is_disengaging = False      # Disengage: no opportunity attacks this turn
        self.has_dodge_active = False     # Dodge: attacks against have Disadvantage
        # --- Concentration ---
        self.is_concentrating = False
        self.concentration_spell = None
        # --- Conditions ---
        self.conditions = []  # list of {"name", "save_stat", "save_dc", "duration"}
        self.feats = []  # e.g. ["War Caster"]
        # --- Multiclass ---
        self.class_levels = {}  # e.g. {"Fighter": 3, "Wizard": 2}
        self.pact_slots = 0      # Warlock pact magic (separate pool)
        self.pact_slots_max = 0
        # --- Death Saving Throws ---
        self.death_saves = {"successes": 0, "failures": 0}
        self.is_dying = False
        self.is_stable = False
        self.is_dead = False
        # --- Readied Action ---
        self.readied_action = None  # {"trigger": str, "action": str}
        # --- Last Stand (boss fights only) ---
        self.last_stand_active = False
        self.last_stand_rounds = 0  # Rounds remaining in Last Stand
        self.last_stand_max = 3     # Max rounds before heroic collapse
        # --- Legacy System (inherited by next character) ---
        self.legacy_bonuses = []    # Accumulated from heroic sacrifices
        self.heroic_sacrifice_count = 0
        # --- Economy & Lifestyle ---
        self.lifestyle = "squalid"  # squalid/poor/modest/comfortable/wealthy
        self.days_without_food = 0  # Starvation counter
        self.armor_condition = 1.0  # 1.0 = pristine, degrades toward 0
        self.reputation = {}        # Location-name -> int standing
        self.exhaustion_level = 0   # 0-6; 6 = death
        self.bounty = 0             # Accumulated from black-market deals
        # --- Favor charges (from artifact trades) ---
        self.favor_advantage_encounters = 0  # Grants Advantage each combat
        self.favor_ally_encounters = 0       # NPC ally deals 1d6/round
        
    def roll_stats(self):
        """Roll 4d6, drop lowest for each stat"""
        for stat in self.stats:
            rolls = sorted([random.randint(1, 6) for _ in range(4)], reverse=True)
            self.stats[stat] = sum(rolls[:3])
        
    def apply_racial_bonus(self):
        bonuses = self.RACES[self.race]["bonus"]
        if "all" in bonuses:
            for stat in self.stats:
                self.stats[stat] += bonuses["all"]
        else:
            for stat, bonus in bonuses.items():
                self.stats[stat] += bonus
        self.traits.extend(self.RACES[self.race]["traits"])
    
    def get_modifier(self, stat):
        return (self.stats[stat] - 10) // 2
    
    def calculate_hp(self):
        hit_die = self.CLASSES[self.char_class]["hit_die"]
        con_mod = self.get_modifier("con")
        self.max_hp = hit_die + con_mod
        self.hp = self.max_hp
        
    def calculate_ac(self, cover_bonus=0):
        dex_mod = self.get_modifier("dex")
        # Simplified AC based on equipment
        if "Chain Mail" in self.inventory:
            self.base_ac = 16
        elif "Scale Mail" in self.inventory:
            self.base_ac = 14 + min(dex_mod, 2)
        elif "Leather Armor" in self.inventory or "Hide Armor" in self.inventory:
            self.base_ac = 11 + dex_mod
        else:
            self.base_ac = 10 + dex_mod
        if "Shield" in self.inventory:
            self.base_ac += 2
        # Armor degradation penalty
        if self.armor_condition <= 0.3:
            self.base_ac = max(10 + dex_mod, self.base_ac - 1)
        self.ac = self.base_ac + cover_bonus

    # --- Incapacitation constants ---
    #  Conditions whose root mechanic is Incapacitated.
    INCAPACITATING_CONDITIONS = {"Stunned", "Paralyzed", "Unconscious"}

    # --- Condition helpers ---

    def add_condition(self, name, save_stat=None, save_dc=0, duration=3,
                      recurring_damage=None):
        """Apply a status condition.  Duplicate names are ignored.
        recurring_damage: optional dice notation (e.g. '1d6') applied each
                          end-of-turn *before* the save is attempted."""
        if self.has_condition(name):
            return
        self.conditions.append({
            "name": name, "save_stat": save_stat,
            "save_dc": save_dc, "duration": duration,
            "recurring_damage": recurring_damage,
            # Buffer: the condition was just applied this turn, so the
            # first end-of-turn save is skipped ("until end of next turn").
            "first_turn": True,
        })
        # --- Incapacitation side-effects ---
        if name in self.INCAPACITATING_CONDITIONS:
            # Auto-break Concentration
            if self.is_concentrating:
                self.is_concentrating = False
                self.concentration_spell = None
            # Lose Dodge benefit
            self.has_dodge_active = False

    def remove_condition(self, name):
        self.conditions = [c for c in self.conditions if c["name"] != name]

    def has_condition(self, name):
        return any(c["name"] == name for c in self.conditions)

    def is_incapacitated(self):
        """True if any active condition implies the Incapacitated root."""
        return any(c["name"] in self.INCAPACITATING_CONDITIONS
                   for c in self.conditions)

    def end_of_turn_saves(self):
        """At end of turn:
        1. Apply any recurring damage from conditions.
        2. Skip the save if this is the condition's first turn (duration buffer).
        3. Otherwise roll the save; on success the condition ends.
        Returns list of (condition_name, saved:bool, recurring_dmg:int)
        for narration."""
        results = []
        remaining = []
        for cond in self.conditions:
            rec_dmg = 0
            # Step 1 — recurring damage happens *before* the save
            if cond.get("recurring_damage"):
                from game import DungeonMaster  # local import for dice helper
                dm_tmp = DungeonMaster.__new__(DungeonMaster)
                rec_dmg = dm_tmp.roll_dice(cond["recurring_damage"])
                self.hp = max(0, self.hp - rec_dmg)

            # Step 2 — first-turn buffer: no save yet
            if cond.get("first_turn"):
                cond["first_turn"] = False
                results.append((cond["name"], False, rec_dmg))
                remaining.append(cond)
                continue

            # Step 3 — decrement duration, then attempt save
            cond["duration"] -= 1
            if cond["duration"] <= 0:
                results.append((cond["name"], True, rec_dmg))  # expired
                continue
            if cond["save_stat"] and cond["save_dc"] > 0:
                roll = random.randint(1, 20)
                mod = self.get_modifier(cond["save_stat"])
                if roll + mod >= cond["save_dc"]:
                    results.append((cond["name"], True, rec_dmg))
                    continue
                else:
                    results.append((cond["name"], False, rec_dmg))
            remaining.append(cond)
        self.conditions = remaining
        return results

    def active_conditions_str(self):
        if not self.conditions:
            return "None"
        return ", ".join(c["name"] for c in self.conditions)

    def start_of_turn(self):
        """Reset per-turn action economy flags at the start of a creature's turn."""
        self.has_used_reaction = False
        self.has_used_bonus_action = False
        self.bonus_action_spell_this_turn = False
        self.has_used_object_interaction = False
        self.is_disengaging = False
        self.has_dodge_active = False
        # NOTE: Incapacitated state is NOT reset here — it persists
        # until the condition itself is removed via end_of_turn saves.

    def concentration_check(self, damage):
        """Roll a CON save to maintain concentration after taking damage.
        DC is the higher of 10 or half the damage taken."""
        if not self.is_concentrating:
            return True
        dc = max(10, damage // 2)
        roll = random.randint(1, 20)
        con_mod = self.get_modifier("con")
        total = roll + con_mod
        if total >= dc:
            return True
        # Concentration broken
        spell_name = self.concentration_spell or "the spell"
        self.is_concentrating = False
        self.concentration_spell = None
        return False

    def can_cast_leveled_action_spell(self):
        """If a leveled spell was cast as a Bonus Action this turn,
        only cantrips with a casting time of 1 action may be cast."""
        return not self.bonus_action_spell_this_turn

    def get_dex_ac_component(self):
        """Return the portion of AC that comes purely from Dexterity."""
        return self.get_modifier("dex")

    def get_armor_ac_component(self):
        """Return the portion of AC from armor (total AC minus Dex portion)."""
        return self.ac - self.get_modifier("dex")

    def attack_has_disadvantage(self):
        """True if this creature's attacks have Disadvantage (Poisoned, Prone…)"""
        return self.has_condition("Poisoned") or self.has_condition("Prone")

    def attacks_against_have_advantage(self):
        """True if attacks *against* this creature have Advantage."""
        return (self.has_condition("Stunned") or self.has_condition("Paralyzed")
                or self.has_condition("Prone"))

    def auto_fail_str_dex_saves(self):
        return self.has_condition("Stunned") or self.has_condition("Paralyzed")

    def auto_crit_if_hit(self):
        """Stunned/Paralyzed: attacks within 5 ft are automatic crits."""
        return self.has_condition("Stunned") or self.has_condition("Paralyzed")

    def shove_contest(self, target_dex, target_str=0):
        """Attempt a Shove (Athletics vs. target's Athletics or Acrobatics).
        target_dex / target_str are raw ability scores for the monster.
        Returns True if the shove succeeds."""
        player_roll = random.randint(1, 20) + self.get_modifier("str")
        # Target defends with the better of Athletics(STR) or Acrobatics(DEX)
        target_str_mod = (target_str - 10) // 2 if target_str else 0
        target_dex_mod = (target_dex - 10) // 2
        target_bonus = max(target_str_mod, target_dex_mod)
        target_roll = random.randint(1, 20) + target_bonus
        return player_roll >= target_roll

    # --- Multiclass Spell Slot Table (5e PHB p. 165) ---
    MULTICLASS_SPELL_SLOTS = {
        1:  [2, 0, 0, 0, 0],  2:  [3, 0, 0, 0, 0],
        3:  [4, 2, 0, 0, 0],  4:  [4, 3, 0, 0, 0],
        5:  [4, 3, 2, 0, 0],  6:  [4, 3, 3, 0, 0],
        7:  [4, 3, 3, 1, 0],  8:  [4, 3, 3, 2, 0],
        9:  [4, 3, 3, 3, 1],  10: [4, 3, 3, 3, 2],
    }

    PACT_MAGIC_SLOTS = {
        1: (1, 1), 2: (2, 1), 3: (2, 2), 4: (2, 2), 5: (2, 3),
        6: (2, 3), 7: (2, 4), 8: (2, 4), 9: (2, 5), 10: (2, 5),
    }

    @property
    def caster_level(self):
        """Multiclass caster level (full=1.0, half=0.5, third=0.33)."""
        if not self.class_levels:
            info = self.CLASSES.get(self.char_class, {})
            return max(0, int(self.level * info.get("caster_mult", 0)))
        total = 0.0
        for cls, lvl in self.class_levels.items():
            total += lvl * self.CLASSES.get(cls, {}).get("caster_mult", 0)
        return max(0, int(total))

    def available_spell_slots(self):
        """Spell slots [1st..5th] by multiclass caster level."""
        cl = min(self.caster_level, 10)
        return list(self.MULTICLASS_SPELL_SLOTS.get(cl, [0]*5)) if cl > 0 else [0]*5

    def death_saving_throw(self):
        """Roll a death save. Returns (result, d20_roll).
        result: 'alive' | 'stable' | 'dead' | 'ongoing'."""
        if self.hp > 0:
            return "alive", 0
        if self.is_stable:
            return "stable", 0
        if self.is_dead:
            return "dead", 0
        roll = random.randint(1, 20)
        if roll == 20:
            self.hp = 1
            self.is_dying = False
            self.death_saves = {"successes": 0, "failures": 0}
            return "alive", roll
        elif roll == 1:
            self.death_saves["failures"] += 2
        elif roll >= 10:
            self.death_saves["successes"] += 1
        else:
            self.death_saves["failures"] += 1
        if self.death_saves["failures"] >= 3:
            self.is_dead = True
            self.is_dying = False
            return "dead", roll
        if self.death_saves["successes"] >= 3:
            self.is_stable = True
            self.is_dying = False
            return "stable", roll
        return "ongoing", roll

    def reset_death_saves(self):
        """Reset death save state on healing above 0 HP."""
        self.death_saves = {"successes": 0, "failures": 0}
        self.is_dying = False
        self.is_stable = False

    @property
    def proficiency_bonus(self):
        """Proficiency bonus by level (5e table, simplified)."""
        if self.level < 5:
            return 2
        elif self.level < 9:
            return 3
        elif self.level < 13:
            return 4
        elif self.level < 17:
            return 5
        return 6

    def passive_perception(self):
        """10 + WIS mod + proficiency (if proficient in Perception)."""
        base = 10 + self.get_modifier("wis")
        if "Perception" in self.skills:
            base += self.proficiency_bonus
        return base

    @property
    def is_silenced(self):
        """True if the Silenced condition is active."""
        return self.has_condition("Silenced")

    def can_cast_spell(self, components_str):
        """Check whether this character can cast a spell with the given
        component string (e.g. 'V, S').
        Returns (can_cast: bool, reason: str)."""
        components = [c.strip().upper() for c in components_str.split(",")]
        if "V" in components and self.is_silenced:
            return False, "You are Silenced and cannot speak the verbal component!"
        if "S" in components:
            hands_full = ("Shield" in self.inventory
                          and any(w in self.inventory for w in
                                  ["Longsword", "Mace", "Shortsword",
                                   "Quarterstaff", "Greataxe"]))
            if hands_full and "War Caster" not in self.feats:
                return False, ("Your hands are full! You need a free hand for "
                               "somatic components (or the War Caster feat).")
        return True, ""

    def damage_profile(self):
        """Return dict of this character's damage resistances / etc."""
        resistances = []
        if "Hellish Resistance" in self.traits:
            resistances.append("fire")
        if "Damage Resistance" in self.traits:
            resistances.append("fire")  # Dragonborn (simplified)
        return {"resistances": resistances, "vulnerabilities": [],
                "immunities": []}

    def setup_class(self):
        class_info = self.CLASSES[self.char_class]
        self.inventory.extend(class_info["equipment"])
        self.skills.extend(class_info["skills"])
        self.class_levels = {self.char_class: 1}
        if class_info.get("pact_magic"):
            slots, _ = self.PACT_MAGIC_SLOTS.get(1, (1, 1))
            self.pact_slots = slots
            self.pact_slots_max = slots
        self.calculate_hp()
        self.calculate_ac()
        
    def setup_background(self):
        bg_info = self.BACKGROUNDS[self.background]
        for skill in bg_info["skills"]:
            if skill not in self.skills:
                self.skills.append(skill)
        self.gold = random.randint(10, 25)
        
    def display_sheet(self):
        print("\n" + "="*50)
        print(f"  CHARACTER SHEET: {self.name}")
        print("="*50)
        print(f"  Race: {self.race}    Class: {self.char_class}    Level: {self.level}")
        print(f"  Background: {self.background}")
        print("-"*50)
        print("  ATTRIBUTES:")
        for stat, value in self.stats.items():
            mod = self.get_modifier(stat)
            sign = "+" if mod >= 0 else ""
            print(f"    {stat.upper()}: {value} ({sign}{mod})")
        print("-"*50)
        print(f"  HP: {self.hp}/{self.max_hp}    AC: {self.ac}    Gold: {self.gold}")
        print(f"  Lifestyle: {self.lifestyle.title()}"
              f"    Armor Condition: "
              f"{int(self.armor_condition * 100)}%")
        if self.days_without_food >= 2:
            print(f"  WARNING: Starving "
                  f"({self.days_without_food} days)")
        print("-"*50)
        print(f"  Skills: {', '.join(self.skills)}")
        print(f"  Traits: {', '.join(self.traits)}")
        print("-"*50)
        print(f"  Equipment: {', '.join(self.inventory)}")
        print(f"  Conditions: {self.active_conditions_str()}")
        if self.reputation:
            rep_str = ", ".join(
                f"{k}: {v}" for k, v in self.reputation.items())
            print(f"  Reputation: {rep_str}")
        print("="*50 + "\n")
        
    def take_damage(self, damage):
        self.hp = max(0, self.hp - damage)
        # Concentration check on taking damage
        if self.is_concentrating:
            kept = self.concentration_check(damage)
            if not kept:
                pass  # Message handled at the combat-narration layer
        return self.hp > 0
    
    def heal(self, amount):
        was_dying = self.hp <= 0
        self.hp = min(self.max_hp, self.hp + amount)
        if was_dying and self.hp > 0:
            self.reset_death_saves()
        
    def to_dict(self):
        return {
            "name": self.name,
            "race": self.race,
            "char_class": self.char_class,
            "background": self.background,
            "level": self.level,
            "experience": self.experience,
            "stats": self.stats,
            "hp": self.hp,
            "max_hp": self.max_hp,
            "ac": self.ac,
            "inventory": self.inventory,
            "gold": self.gold,
            "traits": self.traits,
            "skills": self.skills
        }
    
    @classmethod
    def from_dict(cls, data):
        char = cls()
        for key, value in data.items():
            setattr(char, key, value)
        return char


class DungeonMaster:
    """AI Dungeon Master that runs the game"""
    
    # --- Cover bonuses ---
    COVER_NONE = 0
    COVER_HALF = 2       # +2 AC
    COVER_THREE_QUARTERS = 5  # +5 AC

    # --- Weapon properties: type, reach (ft), ranged? ---
    WEAPON_DAMAGE_TYPES = {
        "Longsword":    {"type": "slashing",    "reach": 5,  "ranged": False},
        "Shortsword":   {"type": "piercing",    "reach": 5,  "ranged": False},
        "Dagger":       {"type": "piercing",    "reach": 5,  "ranged": False},
        "Mace":         {"type": "bludgeoning",  "reach": 5,  "ranged": False},
        "Greataxe":     {"type": "slashing",    "reach": 5,  "ranged": False},
        "Quarterstaff": {"type": "bludgeoning",  "reach": 5,  "ranged": False},
        "Longbow":      {"type": "piercing",    "reach": 0,  "ranged": True, "range": 150},
        "Handaxes":     {"type": "slashing",    "reach": 5,  "ranged": False},
        "Glaive":       {"type": "slashing",    "reach": 10, "ranged": False},
        "Halberd":      {"type": "slashing",    "reach": 10, "ranged": False},
    }

    # --- Spell Definitions (components, damage type) ---
    SPELLS = {
        "Energy Bolt": {
            "damage": "1d6", "type": "force", "components": "V, S",
            "level": 0, "action": "bonus",
            "desc": "A bolt of shimmering force energy.",
        },
        "Fire Bolt": {
            "damage": "1d10", "type": "fire", "components": "V, S",
            "level": 0, "action": "action",
            "desc": "A mote of fire streaks toward the target.",
        },
        "Sacred Flame": {
            "damage": "1d8", "type": "radiant", "components": "V, S",
            "level": 0, "action": "action",
            "desc": "Flame-like radiance descends on the target.",
        },
        "Healing Word": {
            "heal": "1d4+2", "type": "healing", "components": "V",
            "level": 1, "action": "bonus",
            "desc": "A word of power mends wounds at a distance.",
        },
        "Thunderwave": {
            "damage": "2d8", "type": "thunder", "components": "V, S",
            "level": 1, "action": "action",
            "desc": "A wave of thunderous force sweeps out from you.",
        },
        "Grease": {
            "damage": "0", "type": "none", "components": "V, S, M",
            "level": 1, "action": "action",
            "desc": "Slick grease covers the ground. DEX save or fall Prone.",
            "special": "grease",
        },
        "Eldritch Blast": {
            "damage": "1d10", "type": "force", "components": "V, S",
            "level": 0, "action": "action",
            "desc": "A beam of crackling energy streaks toward a creature.",
        },
    }

    # --- Environmental Synergy Combos ---
    ENVIRONMENTAL_COMBOS = {
        ("grease", "fire"): {
            "damage": "2d6", "type": "fire",
            "narration": "The grease ignites in a spectacular explosion!",
        },
        ("grease", "thunder"): {
            "damage": "1d6", "type": "thunder",
            "narration": "The thunderwave scatters the grease violently!",
        },
    }

    LOCATIONS = [
        {"name": "The Forgotten Crypt", "type": "dungeon", "danger": 2,
         "difficult_terrain": False, "cover_available": True,
         "light": "dim", "has_lair_actions": True},
        {"name": "Thornwood Forest", "type": "wilderness", "danger": 1,
         "difficult_terrain": True, "cover_available": True,
         "light": "bright", "has_lair_actions": False},
        {"name": "The Rusty Dragon Inn", "type": "town", "danger": 0,
         "difficult_terrain": False, "cover_available": False,
         "light": "bright", "has_lair_actions": False},
        {"name": "Goblin Warrens", "type": "dungeon", "danger": 2,
         "difficult_terrain": True, "cover_available": True,
         "light": "darkness", "has_lair_actions": True},
        {"name": "Mystic Tower", "type": "dungeon", "danger": 3,
         "difficult_terrain": False, "cover_available": False,
         "light": "dim", "has_lair_actions": True},
        {"name": "Riverside Village", "type": "town", "danger": 0,
         "difficult_terrain": False, "cover_available": False,
         "light": "bright", "has_lair_actions": False},
    ]
    
    MONSTERS = {
        1: [
            {"name": "Goblin", "hp": 7, "ac": 15, "str": 8, "dex": 14,
             "damage": "1d6", "damage_type": "piercing", "xp": 50,
             "stealth_mod": 6,
             "resistances": [], "vulnerabilities": [], "immunities": [],
             "morale_threshold": 0.50, "is_boss": False,
             "recharge_ability": None,
             "banter": ["The goblin cackles wildly!", "'You die now, tall-one!'"]},
            {"name": "Kobold", "hp": 5, "ac": 12, "str": 7, "dex": 15,
             "damage": "1d4", "damage_type": "piercing", "xp": 25,
             "stealth_mod": 4,
             "resistances": [], "vulnerabilities": [], "immunities": [],
             "morale_threshold": 0.40, "is_boss": False,
             "recharge_ability": None,
             "banter": ["The kobold hisses nervously.", "'Pack will avenge me!'"]},
            {"name": "Giant Rat", "hp": 7, "ac": 12, "str": 7, "dex": 11,
             "damage": "1d4", "damage_type": "piercing", "xp": 25,
             "stealth_mod": 2,
             "resistances": [], "vulnerabilities": [], "immunities": [],
             "morale_threshold": 0.30, "is_boss": False,
             "recharge_ability": None, "banter": []},
        ],
        2: [
            {"name": "Orc", "hp": 15, "ac": 13, "str": 16, "dex": 12,
             "damage": "1d12", "damage_type": "slashing", "xp": 100,
             "stealth_mod": 0,
             "resistances": [], "vulnerabilities": [], "immunities": [],
             "morale_threshold": 0.50, "is_boss": False,
             "recharge_ability": None,
             "banter": ["The orc snarls: 'GRUMMSH gives me strength!'",
                        "The orc pounds its chest and roars."]},
            {"name": "Skeleton", "hp": 13, "ac": 13, "str": 10, "dex": 14,
             "damage": "1d6", "damage_type": "piercing", "xp": 50,
             "stealth_mod": 2,
             "resistances": ["piercing"], "vulnerabilities": ["bludgeoning"],
             "immunities": ["poison"],
             "morale_threshold": 0.0, "is_boss": False,
             "recharge_ability": None, "banter": []},
            {"name": "Zombie", "hp": 22, "ac": 8, "str": 13, "dex": 6,
             "damage": "1d6", "damage_type": "bludgeoning", "xp": 50,
             "stealth_mod": -2,
             "resistances": [], "vulnerabilities": [],
             "immunities": ["poison"],
             "morale_threshold": 0.0, "is_boss": False,
             "recharge_ability": None, "banter": []},
        ],
        3: [
            {"name": "Bugbear", "hp": 27, "ac": 16, "str": 15, "dex": 14,
             "damage": "2d8", "damage_type": "bludgeoning", "xp": 200,
             "stealth_mod": 6,
             "resistances": [], "vulnerabilities": [], "immunities": [],
             "morale_threshold": 0.40, "is_boss": False,
             "recharge_ability": {"name": "Crushing Slam", "damage": "3d6",
                                  "recharge_on": 5, "telegraph":
                                  "The bugbear raises both fists high, muscles tensing..."},
             "banter": ["The bugbear grins with yellowed fangs.",
                        "'Little thing. Stand still.'"]},
            {"name": "Ogre", "hp": 59, "ac": 11, "str": 19, "dex": 8,
             "damage": "2d8", "damage_type": "bludgeoning", "xp": 450,
             "stealth_mod": -1,
             "resistances": [], "vulnerabilities": [], "immunities": [],
             "morale_threshold": 0.25, "is_boss": True,
             "recharge_ability": {"name": "Sweeping Club", "damage": "3d8",
                                  "recharge_on": 5, "telegraph":
                                  "The ogre heaves its massive club back, the air whistling..."},
             "banter": ["The ogre bellows: 'ME SMASH LITTLE BUG!'",
                        "The ogre laughs, shaking the ground.",
                        "'Why you not fall down yet?!'"]},
            {"name": "Ghoul", "hp": 22, "ac": 12, "str": 13, "dex": 15,
             "damage": "2d6", "damage_type": "slashing", "xp": 200,
             "stealth_mod": 2,
             "resistances": [], "vulnerabilities": [],
             "immunities": ["poison"],
             "morale_threshold": 0.0, "is_boss": False,
             "recharge_ability": {"name": "Paralyzing Touch", "damage": "1d6",
                                  "recharge_on": 6, "telegraph":
                                  "The ghoul's claws begin to glow with a sickly green light...",
                                  "condition": "Paralyzed", "save_stat": "con", "save_dc": 10},
             "banter": ["The ghoul lets out a rattling moan."]},
        ]
    }

    # =================================================================
    #  BOSS ENCOUNTERS — Legendary Actions, Resistances, Phases,
    #                     Minions, Secondary Objectives
    # =================================================================

    BOSS_ENCOUNTERS = {
        "The Forgotten Crypt": {
            "boss": {
                "name": "The Crypt Lord", "hp": 120, "ac": 17,
                "str": 18, "dex": 12, "damage": "2d10",
                "damage_type": "necrotic", "xp": 1800,
                "stealth_mod": -1,
                "resistances": ["necrotic"],
                "vulnerabilities": ["radiant"],
                "immunities": ["poison"],
                "morale_threshold": 0.0, "is_boss": True,
                "recharge_ability": {
                    "name": "Soul Drain", "damage": "3d8",
                    "recharge_on": 5,
                    "telegraph": ("The Crypt Lord raises a skeletal "
                                  "hand, dark energy coalescing..."),
                    "condition": "Stunned",
                    "save_stat": "con", "save_dc": 14,
                },
                "banter": [
                    "'Your soul will join my collection...'",
                    "'This crypt has been my domain for a thousand years!'",
                    "The Crypt Lord laughs, an echoing cold sound.",
                ],
            },
            "intro": [
                "The temperature plummets. Frost crawls across the walls.",
                "A towering figure of bone and shadow rises from the sarcophagus.",
                "Two pinpoints of soulfire blaze in its hollow skull.",
                "THE CRYPT LORD has awakened.",
            ],
            "legendary_actions": 3,
            "legendary_action_options": [
                {"name": "Necrotic Lash", "type": "attack",
                 "damage": "1d8", "damage_type": "necrotic", "cost": 1,
                 "desc": "A tendril of dark energy lashes out."},
                {"name": "Ghastly Step", "type": "move", "cost": 1,
                 "desc": ("The Crypt Lord phases through shadow, "
                          "repositioning.")},
                {"name": "Dread Gaze", "type": "debuff", "cost": 2,
                 "save_stat": "wis", "save_dc": 14,
                 "condition": "Stunned", "cond_duration": 1,
                 "desc": ("Its hollow eyes flash with paralyzing "
                          "dread.")},
            ],
            "legendary_resistances": 3,
            "phases": [
                {
                    "threshold": 0.5,
                    "narration": [
                        "The Crypt Lord staggers -- then begins to LAUGH.",
                        "Bones crack and reform. Dark energy surges!",
                        "*** PHASE 2: THE CRYPT LORD ASCENDANT ***",
                        "Its form twists into something larger, "
                        "more terrible...",
                    ],
                    "stat_changes": {
                        "ac": 19, "damage": "3d10",
                        "resistances": ["necrotic", "bludgeoning",
                                        "piercing", "slashing"],
                    },
                    "new_recharge": {
                        "name": "Army of the Dead", "damage": "4d6",
                        "recharge_on": 5,
                        "telegraph": ("The Crypt Lord slams the "
                                      "ground -- the dead stir!"),
                    },
                },
            ],
            "minions": [
                {"name": "Skeletal Minion", "hp": 8, "ac": 11,
                 "damage": "1d6", "damage_type": "piercing"},
            ],
            "minion_count": 2,
            "minion_reinforcement_round": 4,
            "secondary_objective": {
                "name": "Phylactery Crystal",
                "desc": ("A cracked soul gem pulses on a pedestal. "
                         "It seems to sustain the Crypt Lord!"),
                "hp": 15, "ac": 10,
                "effect": "vulnerability",
                "effect_desc": ("The crystal shatters! The Crypt Lord "
                                "shrieks -- its defenses weaken!"),
                "effect_data": {"vulnerabilities": ["radiant",
                                                    "slashing"]},
            },
            "boss_lair_actions": [
                {"text": "Skeletal hands erupt from the ground!",
                 "save_stat": "dex", "save_dc": 13,
                 "damage": "2d6",
                 "miss_text": "You leap free of the grasping bones!"},
                {"text": "A wave of necrotic cold sweeps the chamber!",
                 "save_stat": "con", "save_dc": 12,
                 "damage": "1d8",
                 "miss_text": "You steel yourself and endure the chill."},
            ],
        },
        "Goblin Warrens": {
            "boss": {
                "name": "Groznak the Goblin King", "hp": 85, "ac": 16,
                "str": 14, "dex": 16, "damage": "2d8",
                "damage_type": "slashing", "xp": 1100,
                "stealth_mod": 4,
                "resistances": [],
                "vulnerabilities": [],
                "immunities": [],
                "morale_threshold": 0.0, "is_boss": True,
                "recharge_ability": {
                    "name": "Crown of Command", "damage": "2d8",
                    "recharge_on": 5,
                    "telegraph": ("Groznak raises his jagged crown -- "
                                  "it pulses with wicked energy!"),
                },
                "banter": [
                    "'I am KING! You kneel or you DIE!'",
                    "'Goblins! Protect your KING!'",
                    "Groznak cackles: 'You fight alone. I never do.'",
                ],
            },
            "intro": [
                "The tunnel opens into a vast, torch-lit chamber.",
                "A goblin twice the size of the others sits on a "
                "throne of rusted blades.",
                "He stands, drawing a serrated scimitar.",
                "GROZNAK THE GOBLIN KING challenges you!",
            ],
            "legendary_actions": 2,
            "legendary_action_options": [
                {"name": "Quick Slash", "type": "attack",
                 "damage": "1d8", "damage_type": "slashing", "cost": 1,
                 "desc": "A blindingly fast strike from the scimitar."},
                {"name": "Rally Minions", "type": "summon", "cost": 1,
                 "desc": ("Groznak shouts a command -- a fresh "
                          "goblin charges in!")},
                {"name": "Dirty Trick", "type": "debuff", "cost": 2,
                 "save_stat": "dex", "save_dc": 13,
                 "condition": "Prone", "cond_duration": 1,
                 "desc": "He kicks dirt in your eyes!"},
            ],
            "legendary_resistances": 2,
            "phases": [
                {
                    "threshold": 0.4,
                    "narration": [
                        "Groznak snarls, bleeding from a dozen cuts.",
                        "He grabs a vial from his belt and drinks!",
                        "*** PHASE 2: FRENZIED KING ***",
                        "His eyes glow red. He fights with savage fury!",
                    ],
                    "stat_changes": {
                        "ac": 14, "damage": "3d8",
                        "str": 18, "dex": 18,
                    },
                    "new_recharge": None,
                },
            ],
            "minions": [
                {"name": "Goblin Bodyguard", "hp": 10, "ac": 14,
                 "damage": "1d6", "damage_type": "piercing"},
            ],
            "minion_count": 3,
            "minion_reinforcement_round": 3,
            "secondary_objective": {
                "name": "War Horn",
                "desc": ("A massive war horn hangs on the wall. "
                         "If it sounds, more goblins will come!"),
                "hp": 10, "ac": 8,
                "effect": "stop_reinforcements",
                "effect_desc": ("You smash the War Horn to splinters! "
                                "No more reinforcements!"),
                "effect_data": {},
            },
            "boss_lair_actions": [
                {"text": "Trap doors open -- spikes jab upward!",
                 "save_stat": "dex", "save_dc": 12,
                 "damage": "2d4",
                 "miss_text": "You dodge the crude mechanism!"},
                {"text": "A net drops from the ceiling!",
                 "save_stat": "dex", "save_dc": 11,
                 "damage": "0",
                 "condition": "Prone", "cond_duration": 1,
                 "miss_text": "You roll clear of the tangling net!"},
            ],
        },
        "Mystic Tower": {
            "boss": {
                "name": "Archmage Vaelith", "hp": 100, "ac": 15,
                "str": 10, "dex": 14, "damage": "3d8",
                "damage_type": "force", "xp": 2300,
                "stealth_mod": 0,
                "resistances": ["force"],
                "vulnerabilities": [],
                "immunities": ["poison", "thunder"],
                "morale_threshold": 0.0, "is_boss": True,
                "recharge_ability": {
                    "name": "Arcane Overload", "damage": "4d10",
                    "recharge_on": 6,
                    "telegraph": ("Vaelith begins tracing a massive "
                                  "sigil of blinding light in the air!"),
                    "condition": "Stunned",
                    "save_stat": "int", "save_dc": 15,
                },
                "banter": [
                    "'Your crude steel is no match for pure arcana.'",
                    "'I have studied for centuries. You are but a "
                    "moment.'",
                    "Vaelith smiles coldly: 'Fascinating resilience.'",
                ],
            },
            "intro": [
                "The spiral stair ends at a vast observatory.",
                "Stars wheel overhead through a crystalline dome.",
                "A figure in shimmering robes turns from a lectern "
                "of floating tomes.",
                "'You dare enter MY tower? How... quaint.'",
                "ARCHMAGE VAELITH draws power from the ley lines!",
            ],
            "legendary_actions": 3,
            "legendary_action_options": [
                {"name": "Force Bolt", "type": "attack",
                 "damage": "1d10", "damage_type": "force", "cost": 1,
                 "desc": "A bolt of pure force lances out."},
                {"name": "Misty Step", "type": "move", "cost": 1,
                 "desc": "Vaelith vanishes and reappears elsewhere."},
                {"name": "Counterspell Echo", "type": "debuff",
                 "cost": 2,
                 "save_stat": "int", "save_dc": 15,
                 "condition": "Silenced", "cond_duration": 1,
                 "desc": ("An anti-magic pulse suppresses your "
                          "voice.")},
            ],
            "legendary_resistances": 3,
            "phases": [
                {
                    "threshold": 0.5,
                    "narration": [
                        "Vaelith gasps, touching a wound in disbelief.",
                        "'Enough. You want power? I'LL SHOW YOU POWER.'",
                        "*** PHASE 2: ARCANE ASCENSION ***",
                        "Vaelith levitates, tendrils of raw magic "
                        "swirling around them!",
                    ],
                    "stat_changes": {
                        "ac": 17, "damage": "4d8",
                        "resistances": ["force", "fire", "cold"],
                    },
                    "new_recharge": {
                        "name": "Meteor Swarm",
                        "damage": "5d8",
                        "recharge_on": 6,
                        "telegraph": ("The dome splits open and "
                                      "burning stars begin to fall!"),
                    },
                },
            ],
            "minions": [
                {"name": "Arcane Construct", "hp": 12, "ac": 13,
                 "damage": "1d8", "damage_type": "force"},
            ],
            "minion_count": 2,
            "minion_reinforcement_round": 5,
            "secondary_objective": {
                "name": "Ley Line Conduit",
                "desc": ("A pillar of swirling energy feeds Vaelith "
                         "power. Destroying it might weaken the "
                         "Archmage!"),
                "hp": 20, "ac": 12,
                "effect": "reduce_legendary",
                "effect_desc": ("The conduit explodes! Vaelith "
                                "screams as arcane power drains away!"),
                "effect_data": {"reduce_lr": 1, "reduce_la": 1},
            },
            "boss_lair_actions": [
                {"text": "Arcane runes on the floor flare to life!",
                 "save_stat": "dex", "save_dc": 14,
                 "damage": "2d8",
                 "miss_text": "You leap clear of the blazing sigils!"},
                {"text": "Gravity reverses momentarily!",
                 "save_stat": "str", "save_dc": 13,
                 "damage": "1d6",
                 "condition": "Prone", "cond_duration": 1,
                 "miss_text": "You brace yourself and keep your feet!"},
            ],
        },
    }

    EVENTS = {
        "dungeon": [
            "You hear distant echoes through the stone corridors...",
            "Torchlight flickers against ancient walls covered in mysterious runes.",
            "The smell of decay fills the musty air.",
            "Water drips somewhere in the darkness ahead.",
            "You notice scratch marks on the floor, leading deeper inside.",
        ],
        "wilderness": [
            "Birds scatter from the trees as you approach.",
            "A cool breeze carries the scent of wildflowers.",
            "You find an old trail, partially overgrown.",
            "Strange tracks cross your path.",
            "The forest grows darker and more twisted ahead.",
        ],
        "town": [
            "Townsfolk go about their daily business around you.",
            "A merchant calls out, advertising exotic wares.",
            "You overhear rumors of treasure in a nearby ruin.",
            "A mysterious stranger watches you from the shadows.",
            "The smell of fresh bread wafts from a nearby bakery.",
        ]
    }
    
    TREASURES = [
        {"name": "Gold coins", "value": lambda: random.randint(5, 30)},
        {"name": "Silver necklace", "value": lambda: random.randint(10, 25)},
        {"name": "Gemstone", "value": lambda: random.randint(25, 75)},
        {"name": "Ancient artifact", "value": lambda: random.randint(50, 150)},
        {"name": "Healing Potion", "value": lambda: 50, "usable": True, "effect": "heal"},
    ]

    # --- Lifestyle Tiers ---
    LIFESTYLE_TIERS = {
        "squalid":     {"cost": 0,  "heal_die": "0",   "ambush": 0.40,
                        "desc": "sleeping in alleys or under trees"},
        "poor":        {"cost": 2,  "heal_die": "1d4",  "ambush": 0.30,
                        "desc": "a flophouse cot or stable loft"},
        "modest":      {"cost": 5,  "heal_die": "1d8",  "ambush": 0.15,
                        "desc": "a plain room at a tavern"},
        "comfortable": {"cost": 10, "heal_die": "0",    "ambush": 0.0,
                        "desc": "a private room with a warm meal",
                        "full_heal": True},
        "wealthy":     {"cost": 25, "heal_die": "0",    "ambush": 0.0,
                        "desc": "a fine suite with healer's attention",
                        "full_heal": True, "bonus_hp": True},
    }

    # --- Shop Inventory ---
    SHOP_ITEMS = [
        {"name": "Healing Potion",         "cost": 25,
         "desc": "Restore 2d4+2 HP",       "type": "consumable"},
        {"name": "Greater Healing Potion",  "cost": 75,
         "desc": "Restore 4d4+4 HP",       "type": "consumable"},
        {"name": "Antitoxin",              "cost": 25,
         "desc": "Advantage on poison saves for 1 hour",
         "type": "consumable"},
        {"name": "Rations (5 days)",       "cost": 5,
         "desc": "Prevents starvation penalties",
         "type": "consumable"},
        {"name": "Rope (50 ft)",           "cost": 5,
         "desc": "Useful for climbing & restraints",
         "type": "gear"},
        {"name": "Torch (5)",              "cost": 1,
         "desc": "Bright light for exploration",
         "type": "gear"},
        {"name": "Leather Armor",          "cost": 10,
         "desc": "AC 11 + DEX",            "type": "armor"},
        {"name": "Scale Mail",             "cost": 50,
         "desc": "AC 14 + DEX (max 2)",    "type": "armor"},
        {"name": "Chain Mail",             "cost": 75,
         "desc": "AC 16",                  "type": "armor"},
        {"name": "Shield",                 "cost": 10,
         "desc": "+2 AC",                  "type": "armor"},
        {"name": "Component Pouch",          "cost": 15,
         "desc": "Covers mundane spell components (M)",
         "type": "gear"},
    ]

    # --- Bounty Board (quest-based gold earning) ---
    BOUNTY_BOARD = [
        {"desc": "Slay the wolves terrorizing the road",
         "target": "wilderness", "reward": 30,  "difficulty": 12},
        {"desc": "Clear the rats from the cellar",
         "target": "town",       "reward": 15,  "difficulty": 8},
        {"desc": "Retrieve a lost artifact from the crypt",
         "target": "dungeon",    "reward": 60,  "difficulty": 14},
        {"desc": "Escort a merchant through bandit country",
         "target": "wilderness", "reward": 40,  "difficulty": 11},
        {"desc": "Investigate strange noises underground",
         "target": "dungeon",    "reward": 50,  "difficulty": 13},
    ]

    # --- Barter Value Table (sell prices = roughly 50% of buy) ---
    BARTER_VALUES = {
        "Healing Potion": 12, "Greater Healing Potion": 35,
        "Antitoxin": 12, "Rations (5 days)": 2,
        "Rope (50 ft)": 2, "Torch (5)": 0,
        "Leather Armor": 5, "Scale Mail": 25,
        "Chain Mail": 35, "Shield": 5,
        "Silver necklace": 15, "Gemstone": 40,
        "Ancient artifact": 75,
        # Weapons
        "Longsword": 8, "Shortsword": 5, "Dagger": 1,
        "Mace": 3, "Greataxe": 15, "Quarterstaff": 1,
        "Longbow": 25, "Handaxes": 3, "Glaive": 10,
        "Halberd": 10,
        "Component Pouch": 7,
    }

    # Barter values for campaign-specific items
    # -1 = PRICELESS ARTIFACT (cannot be sold, only traded for favors)
    #  0 = Unsellable (worthless or too dangerous)
    # >0 = Gold value at a shop
    CAMPAIGN_BARTER_VALUES = {
        # --- Strahd Uniques (scaled for tight economy) ---
        "Saint Markovia's Thighbone": 250,
        "Blood Spear": 200, "Gulthias Staff": 180,
        "Icon of Ravenloft": 300, "Doss Lute": 350,
        "Luck Blade": 400,
        "Silver-tipped Crossbow Bolts (10)": 8,
        "Vial of Holy Water": 12,
        "Barovian Wine (heals 1d4, grants calm)": 3,
        "Wooden Stake & Mallet": 2,
        # Strahd Legendaries — PRICELESS
        "Sunsword": -1, "Holy Symbol of Ravenkind": -1,
        "Tome of Strahd": -1,
        # --- ToA Uniques ---
        "Amulet of the Black Skull": 275,
        "Ghost Lantern": 200, "Scorpion Armor": 300,
        "Bookmark (sentient dagger)": 350,
        # ToA Legendaries — PRICELESS
        "Ring of Winter": -1,
        "Staff of the Forgotten One": -1,
        # ToA Common
        "Wukka Nuts (bright light 10 ft, 1 hour)": 2,
        "Ryath Root (chew: 2d4 temp HP, 1 hour)": 5,
        "Dancing Monkey Fruit (save vs Irresistible Dance)": 3,
        "Menga Leaves (heals 1 HP, cures disease)": 4,
        "Insect Repellent Salve (4 hours protection)": 3,
        # --- Borderlands Uniques ---
        "+1 Shield (Orcish)": 150, "+1 Hand Axe": 120,
        "+1 Plate Mail": 750, "+2 Sword": 1000,
        "Wand of Paralyzation": 500,
        "Rope of Climbing (60 ft, obeys commands)": 60,
        "Elven Boots (Advantage on Stealth)": 150,
        "Snake Staff (turns into a constrictor 1/dawn)": 120,
        "Silver Dagger (+0, bypasses lycanthrope DR)": 25,
        # --- Cursed Items (black market only) ---
        "Helm of Alignment Change": 0,
        # --- Dark Terror Uniques ---
        "+1 Handaxe (Black Web)": 100,
        "+1 Longsword (Iron Ring)": 150,
        "Map of the Dymrak Forest": 40,
        "Iron Ring Tattoo (identifies the antagonist cult)": 0,
        "Rough-drawn map fragment (hints at treasure)": 5,
        "Trail Rations, Karameikan (7 days, +1 morale)": 4,
        "Wolvesbane Bundle (repels lycanthropes, 3 uses)": 8,
    }

    # Items with black-market value — shady NPCs pay well for
    # cursed or forbidden goods that normal shops refuse.
    # is_cursed = True  → 1.5× illicit multiplier (weaponised tool)
    BLACK_MARKET_ITEMS = {
        "Helm of Alignment Change": {
            "value": 200,
            "is_cursed": True,
            "buyer": "a hooded figure in the alley",
            "line": ("'Ah, a helm that reshapes the mind... "
                     "I have \u2026 clients who need such things.'"),
        },
        "Gulthias Staff": {
            "value": 400,
            "is_cursed": True,
            "buyer": "a pale woman with knowing eyes",
            "line": ("'The Gulthias tree still whispers "
                     "through that staff. I must have it.'"),
        },
        "Iron Ring Tattoo (identifies the antagonist cult)": {
            "value": 50,
            "is_cursed": False,
            "buyer": "a nervous man who checks over his shoulder",
            "line": ("'That tattoo \u2014 proof of Iron Ring "
                     "membership. Worth something to the right "
                     "\u2026 or wrong people.'"),
        },
    }

    # Artifacts that can be traded for Major Favors instead of gold
    ARTIFACT_FAVORS = {
        "Sunsword": [
            "The Keepers of the Feather pledge their "
            "spy network to your cause.",
            "A powerful Vistani seer reveals Strahd's "
            "next move — Advantage on your next 3 encounters.",
        ],
        "Holy Symbol of Ravenkind": [
            "The Abbot of Krezk restores a fallen "
            "ally to life (free Resurrection).",
            "The Morning Lord's blessing: remove all "
            "exhaustion and curses from the party.",
        ],
        "Tome of Strahd": [
            "Van Richten shares his full monster "
            "compendium — Advantage vs undead for 7 days.",
            "The tome's secrets reveal a hidden cache: "
            "gain 500 gold and 2 Greater Healing Potions.",
        ],
        "Ring of Winter": [
            "The Harpers grant you safe passage through "
            "any port city and a 1,000g line of credit.",
            "Artus Cimber pledges his aid — a powerful "
            "NPC ally joins for 3 encounters.",
        ],
        "Staff of the Forgotten One": [
            "Acererak's servants leave you be: skip "
            "the next deadly trap encounter entirely.",
            "The lich's knowledge flows through you: "
            "permanent +1 to Intelligence.",
        ],
    }

    # --- Service-for-lodging options ---
    ODD_JOBS = [
        {"desc": "perform at the tavern (CHA)",
         "stat": "cha", "dc": 10, "gold": 8},
        {"desc": "guard a merchant's stall (STR)",
         "stat": "str", "dc": 10, "gold": 6},
        {"desc": "help the blacksmith (CON)",
         "stat": "con", "dc": 10, "gold": 5},
        {"desc": "translate old texts (INT)",
         "stat": "int", "dc": 12, "gold": 10},
        {"desc": "scout the perimeter (WIS)",
         "stat": "wis", "dc": 11, "gold": 7},
        {"desc": "deliver packages quickly (DEX)",
         "stat": "dex", "dc": 10, "gold": 5},
    ]
    
    QUEST_HOOKS = [
        "A frightened villager begs you to rescue their child from {location}.",
        "A mysterious letter promises great treasure hidden in {location}.",
        "Strange disappearances have been linked to {location}.",
        "An old map you found marks {location} with an X.",
        "A dying adventurer whispers about {location} before passing.",
    ]

    def __init__(self, character):
        self.character = character
        self.current_location = self.LOCATIONS[2]  # Start at inn
        self.quest_active = False
        self.quest_location = None
        self.turn = 0
        self.movement_budget = 30  # feet per round (standard)
        self.boss_encounters_cleared = set()  # Track defeated bosses
        # --- Economy state ---
        self.active_bounty = None   # Current bounty from board
        self.bounties_completed = 0
        self._shop_restock_turn = 0  # Next turn the shop restocks
        self._worked_this_visit = False  # Odd-job limiter
        # --- Combat tracking (for armor degradation) ---
        self._combat_took_crit = False
        self._combat_took_acid_fire = False
        # --- Campaign setting ---
        self.campaign = 'standard'  # Set during game start

    def narrate(self, text):
        print(f"\n[DM]: {text}")

    # -----------------------------------------------------------------
    #  Advantage / Disadvantage rolling
    # -----------------------------------------------------------------

    @staticmethod
    def roll_d20_advantage():
        return max(random.randint(1, 20), random.randint(1, 20))

    @staticmethod
    def roll_d20_disadvantage():
        return min(random.randint(1, 20), random.randint(1, 20))

    @staticmethod
    def roll_d20_normal():
        return random.randint(1, 20)

    def combat_roll(self, has_advantage=False, has_disadvantage=False):
        """Resolve advantage vs disadvantage (they cancel out)."""
        if has_advantage and has_disadvantage:
            return self.roll_d20_normal(), "Straight"
        elif has_advantage:
            return self.roll_d20_advantage(), "Advantage"
        elif has_disadvantage:
            return self.roll_d20_disadvantage(), "Disadvantage"
        return self.roll_d20_normal(), "Straight"

    # -----------------------------------------------------------------
    #  Vision & Light
    # -----------------------------------------------------------------

    LIGHT_DESCRIPTIONS = {
        "bright": "The area is well-lit. You can see clearly.",
        "dim": "The light is fading here — shadows cling to every corner. (Disadvantage on Perception)",
        "darkness": "It is pitch black. Without Darkvision you are effectively Blinded! (Disadvantage on attacks; enemies have Advantage against you)",
    }

    def get_light_level(self):
        return self.current_location.get("light", "bright")

    def player_has_darkvision(self):
        return "Darkvision" in self.character.traits

    def light_attack_modifier(self):
        """Return (player_disadvantage, monster_advantage) flags from lighting."""
        light = self.get_light_level()
        if light == "darkness" and not self.player_has_darkvision():
            return True, True   # player has disadv, monsters have adv
        if light == "dim" and not self.player_has_darkvision():
            return False, False  # dim = Perception penalty, not attack penalty
        return False, False

    # -----------------------------------------------------------------
    #  Lair / Environmental Actions (Initiative 20)
    # -----------------------------------------------------------------

    LAIR_ACTIONS = {
        "dungeon": [
            {"text": "The ceiling trembles — falling rocks!",
             "save_stat": "dex", "save_dc": 12, "damage": "2d6", "miss_text": "You dive clear of the debris!"},
            {"text": "Noxious gas seeps from cracks in the floor!",
             "save_stat": "con", "save_dc": 11, "damage": "1d6",
             "condition": "Poisoned", "cond_duration": 2,
             "miss_text": "You hold your breath and press on."},
            {"text": "The floor gives way beneath you!",
             "save_stat": "dex", "save_dc": 13, "damage": "1d8",
             "condition": "Prone", "cond_duration": 1,
             "miss_text": "You catch yourself on the edge!"},
            {"text": "An arc of residual magic crackles through the chamber!",
             "save_stat": "dex", "save_dc": 11, "damage": "2d4",
             "miss_text": "The bolt fizzles out before reaching you."},
            {"text": "An arcane ward activates — a sphere of absolute silence envelops you!",
             "save_stat": "wis", "save_dc": 12, "damage": "0",
             "condition": "Silenced", "cond_duration": 2,
             "miss_text": "You resist the ward's pull — your voice remains."},
        ],
        "wilderness": [
            {"text": "A dead tree crashes down toward you!",
             "save_stat": "dex", "save_dc": 12, "damage": "2d6",
             "miss_text": "You leap aside as it splinters on the ground."},
            {"text": "The ground turns to sucking mud!",
             "save_stat": "str", "save_dc": 11, "damage": "0",
             "condition": "Prone", "cond_duration": 1,
             "miss_text": "You wrench your boots free in time."},
        ],
    }

    def lair_action(self):
        """Fire a random lair/environmental action at the start of the round."""
        if not self.current_location.get("has_lair_actions", False):
            return
        if random.random() > 0.35:  # 35 % chance per round
            return
        loc_type = self.current_location["type"]
        actions = self.LAIR_ACTIONS.get(loc_type)
        if not actions:
            return
        event = random.choice(actions)
        self.narrate(f"🌋 LAIR ACTION: {event['text']}")
        save_stat = event["save_stat"]
        save_dc = event["save_dc"]

        # Auto-fail if stunned/paralyzed and the save is STR or DEX
        if self.character.auto_fail_str_dex_saves() and save_stat in ("str", "dex"):
            self.narrate(f"You're {self.character.active_conditions_str()} — automatic failure!")
            success = False
        else:
            roll = random.randint(1, 20)
            mod = self.character.get_modifier(save_stat)
            total = roll + mod
            success = total >= save_dc
            result_str = "Success!" if success else "Failure!"
            self.narrate(f"{save_stat.upper()} Save: {roll}+{mod}={total} vs DC {save_dc}. {result_str}")

        if not success:
            dmg_notation = event.get("damage", "0")
            if dmg_notation != "0":
                dmg = self.roll_dice(dmg_notation)
                self.narrate(f"You take {dmg} damage from the environment!")
                self.character.take_damage(dmg)
            cond = event.get("condition")
            if cond:
                dur = event.get("cond_duration", 2)
                self.character.add_condition(cond, save_stat=save_stat, save_dc=save_dc, duration=dur)
                self.narrate(f"You are now {cond}!")
        else:
            self.narrate(event.get("miss_text", "You avoid the hazard."))

    # -----------------------------------------------------------------
    #  Telegraphing & Social Cues
    # -----------------------------------------------------------------

    @staticmethod
    def should_recharge(ability):
        """Roll to see if a recharge ability is available (D6 >= recharge_on)."""
        if ability is None:
            return False
        return random.randint(1, 6) >= ability.get("recharge_on", 6)

    def telegraph_attack(self, monster):
        """Print a cue the turn before a recharge attack fires."""
        ability = monster.get("recharge_ability")
        if ability and ability.get("telegraph"):
            self.narrate(f"⚠️  {ability['telegraph']}")

    def combat_banter(self, monster, monster_hp, monster_max_hp):
        """Occasionally output flavour dialogue for the monster."""
        banter_lines = monster.get("banter", [])
        if not banter_lines:
            return
        # Higher chance when boss or low health
        chance = 0.25
        if monster.get("is_boss"):
            chance = 0.45
        ratio = monster_hp / monster_max_hp if monster_max_hp > 0 else 1
        if ratio < 0.35:
            chance += 0.20
        if random.random() < chance:
            self.narrate(random.choice(banter_lines))

    # -----------------------------------------------------------------
    #  4. Critical Hit / Fumble Narration
    # -----------------------------------------------------------------

    @staticmethod
    def describe_nat20_hit():
        return random.choice([
            "A devastating blow! You find a gap in the armor and strike deep.",
            "Perfect timing — your weapon sings through the air and lands true!",
            "The stars align. You deliver a picture-perfect strike that echoes through the chamber.",
            "You spot an opening and exploit it ruthlessly — masterful!",
        ])

    @staticmethod
    def describe_nat1_miss():
        return random.choice([
            "Your foot slips on the loose gravel, and your swing goes wide.",
            "A gust of wind — or maybe bad luck — sends your strike laughably off course.",
            "You overcommit and stumble, weapon flailing uselessly.",
            "The weapon almost slips from your grip as you whiff spectacularly.",
        ])

    @staticmethod
    def describe_monster_nat20():
        return random.choice([
            "It finds the exact weak point in your defense — a vicious, precise strike!",
            "A brutal blow catches you completely off guard!",
            "The creature moves with terrifying speed and lands a devastating hit.",
        ])

    @staticmethod
    def describe_monster_nat1():
        return random.choice([
            "The creature stumbles over its own feet — a laughable miss.",
            "It swings wild and nearly hits itself instead.",
            "A clumsy lunge that sails embarrassingly wide.",
        ])

    # -----------------------------------------------------------------
    #  2. Narrative "DM-Style" Feedback Helpers
    # -----------------------------------------------------------------

    @staticmethod
    def describe_health(current_hp, max_hp, name="The creature"):
        """Return a DM-style health descriptor instead of raw numbers."""
        ratio = current_hp / max_hp if max_hp > 0 else 0
        if ratio > 0.75:
            desc = random.choice(["looking fresh", "unscathed", "barely winded"])
        elif ratio > 0.50:
            desc = random.choice(["scuffed", "showing minor cuts", "lightly bruised"])
        elif ratio > 0.25:
            desc = random.choice(["bloodied", "staggering", "visibly wounded"])
        else:
            desc = random.choice(["gasping for air", "on death's door", "barely standing"])
        return f"{name} is {desc}."

    @staticmethod
    def describe_miss(attack_roll, target_ac, target_dex_mod):
        """Provide flavour text for a missed attack based on AC composition."""
        dex_threshold = 10 + target_dex_mod
        armor_threshold = target_ac

        if attack_roll < 10:
            return random.choice([
                "The attack is wildly off-target.",
                "A clumsy swing that doesn't come close.",
                "The strike sails wide, hitting nothing but air.",
            ])
        elif attack_roll < dex_threshold:
            return random.choice([
                "The target deftly dodges out of the way.",
                "A nimble sidestep carries them clear of the blow.",
                "Quick reflexes save them — the strike whiffs past.",
            ])
        else:  # beat Dex portion but not total AC
            return random.choice([
                "The blow clangs harmlessly off their armor.",
                "Sparks fly as the strike glances off hardened steel.",
                "The hit lands, but the armor absorbs the impact entirely.",
            ])

    # -----------------------------------------------------------------
    #  3a. Cover System
    # -----------------------------------------------------------------

    def get_cover_modifier(self):
        """Determine cover bonus based on the current location and a bit of luck."""
        if not self.current_location.get("cover_available", False):
            return self.COVER_NONE
        roll = random.random()
        if roll < 0.35:
            return self.COVER_NONE
        elif roll < 0.75:
            return self.COVER_HALF
        else:
            return self.COVER_THREE_QUARTERS

    @staticmethod
    def describe_cover(bonus):
        if bonus == 0:
            return "You're fighting in the open — no cover."
        elif bonus == 2:
            return "You duck behind a low wall — Half Cover (+2 AC)."
        else:
            return "You press against a thick pillar — Three-Quarters Cover (+5 AC)."

    # -----------------------------------------------------------------
    #  3b. Difficult Terrain
    # -----------------------------------------------------------------

    def effective_movement(self):
        """Return effective movement in ft considering difficult terrain."""
        if self.current_location.get("difficult_terrain", False):
            return self.movement_budget // 2
        return self.movement_budget

    # -----------------------------------------------------------------
    #  3c. Enemy Morale / Flee AI
    # -----------------------------------------------------------------

    @staticmethod
    def morale_check(monster, current_hp):
        """Return True if the monster flees.  threshold of 0 = never flees."""
        threshold = monster.get("morale_threshold", 0.0)
        if threshold <= 0:
            return False
        ratio = current_hp / monster["hp"] if monster["hp"] > 0 else 0
        if ratio > threshold:
            return False
        # Below threshold: WIS-style morale roll (DC 10)
        roll = random.randint(1, 20)
        return roll < 10  # failed save → flees

    # -----------------------------------------------------------------
    #  Damage Types — Resistance, Vulnerability, Immunity
    # -----------------------------------------------------------------

    def get_player_damage_type(self):
        """Determine the player's weapon damage type from their equipment."""
        for item in self.character.inventory:
            if item in self.WEAPON_DAMAGE_TYPES:
                return self.WEAPON_DAMAGE_TYPES[item]["type"]
        return "bludgeoning"  # unarmed

    def get_player_weapon_reach(self):
        """Return the player's weapon reach in ft (5 default, 10 for polearms)."""
        for item in self.character.inventory:
            if item in self.WEAPON_DAMAGE_TYPES:
                return self.WEAPON_DAMAGE_TYPES[item].get("reach", 5)
        return 5  # unarmed

    def is_player_ranged(self):
        """True if the player's primary weapon is ranged."""
        for item in self.character.inventory:
            if item in self.WEAPON_DAMAGE_TYPES:
                return self.WEAPON_DAMAGE_TYPES[item].get("ranged", False)
        return False

    def apply_damage_modifiers(self, raw_damage, damage_type, target_data):
        """Apply Resistance, Vulnerability, and Immunity.
        target_data is a dict with 'resistances', 'vulnerabilities', 'immunities'
        keys (works for both monster dicts and Character.damage_profile()).
        Returns (final_damage, narration_string)."""
        immunities = target_data.get("immunities", [])
        vulnerabilities = target_data.get("vulnerabilities", [])
        resistances = target_data.get("resistances", [])

        if damage_type in immunities:
            return 0, random.choice([
                "The attack passes through harmlessly — it is completely immune!",
                "The creature is utterly unaffected. Total immunity!",
            ])
        if damage_type in vulnerabilities:
            final = raw_damage * 2
            narr = random.choice([
                "The strike shatters its brittle form, dealing massive damage!",
                "It recoils violently — that hit found a critical weakness!",
                f"VULNERABLE! The {damage_type} attack is devastating!",
            ])
            return final, narr
        if damage_type in resistances:
            final = max(1, raw_damage // 2)
            narr = random.choice([
                "The blow lands, but the creature seems strangely unfazed.",
                "Your attack connects, but something absorbs much of the impact.",
                f"The creature shrugs off some of the {damage_type} damage.",
            ])
            return final, narr
        return raw_damage, ""

    # -----------------------------------------------------------------
    #  Passive Perception & Surprise
    # -----------------------------------------------------------------

    def surprise_check(self, monster):
        """Roll monster Stealth vs. player Passive Perception.
        Returns True if the player is Surprised."""
        stealth_mod = monster.get("stealth_mod", 0)
        stealth_roll = random.randint(1, 20) + stealth_mod
        passive_pp = self.character.passive_perception()
        if stealth_roll > passive_pp:
            self.narrate(
                f"⚠️  The {monster['name']} catches you off guard! "
                f"(Stealth {stealth_roll} vs. Passive Perception {passive_pp})")
            self.narrate(
                "You are SURPRISED — you cannot act or react in the first round!")
            return True
        else:
            self.narrate(
                f"Your keen senses detect the {monster['name']} before it strikes. "
                f"(Passive Perception {passive_pp} vs. Stealth {stealth_roll})")
            return False

    # -----------------------------------------------------------------
    #  Tactical Positioning
    # -----------------------------------------------------------------

    def generate_battlefield(self):
        """Generate tactical battlefield conditions for this encounter."""
        bf = {
            "ally_present": random.random() < 0.20,
            "ally_flanking": False,
            "player_elevated": False,
            "player_distance": 30,
        }
        if bf["ally_present"]:
            bf["ally_flanking"] = random.random() < 0.50
        if self.current_location.get("cover_available"):
            bf["player_elevated"] = random.random() < 0.25
        return bf

    def describe_battlefield(self, bf):
        """Narrate tactical positioning at fight start."""
        if bf["ally_present"]:
            if bf["ally_flanking"]:
                self.narrate(
                    "An allied scout flanks the enemy from the opposite "
                    "side! (Flanking: melee attacks have Advantage)")
            else:
                self.narrate(
                    "A friendly adventurer fights nearby but can't "
                    "establish a flanking position.")
        if bf["player_elevated"]:
            self.narrate(
                "You have the high ground! (+2 to ranged attack rolls)")
        if bf["player_distance"] > 5:
            self.narrate(
                f"The enemy is {bf['player_distance']} ft away.")

    def check_flanking(self, bf):
        """Return True if flanking conditions grant Advantage."""
        return bf.get("ally_flanking", False)

    def check_high_ground(self, bf):
        """Return +2 bonus if player has elevated position, else 0."""
        return 2 if bf.get("player_elevated", False) else 0

    # -----------------------------------------------------------------
    #  Social Combat (Persuade / Intimidate)
    # -----------------------------------------------------------------

    def attempt_social_combat(self, monster, monster_hp, monster_max_hp):
        """Attempt to Persuade or Intimidate a monster mid-combat.
        Returns: 'surrender', 'morale', 'backfire', or 'immune'."""
        if monster.get("morale_threshold", 0) <= 0:
            self.narrate(
                f"The {monster['name']} has no mind to persuade "
                "-- it is immune to social influence!")
            return "immune"

        print("  Social approach:")
        print("    [1] Persuade (CHA check)")
        print("    [2] Intimidate (STR or CHA)")
        sub = input("  Choose: ").strip()

        if sub == "1":
            mod = self.character.get_modifier("cha")
            ability = "Persuasion"
        elif sub == "2":
            mod = max(self.character.get_modifier("str"),
                      self.character.get_modifier("cha"))
            ability = "Intimidation"
        else:
            self.narrate("You hesitate and say nothing.")
            return "backfire"

        base_dc = 15 if monster.get("is_boss") else 12
        hp_ratio = monster_hp / monster_max_hp if monster_max_hp > 0 else 1
        dc = base_dc if hp_ratio > 0.5 else base_dc - 3

        roll = random.randint(1, 20)
        total = roll + mod
        self.narrate(
            f"{ability} check: {roll}+{mod}={total} vs DC {dc}")

        if total >= dc + 5:
            self.narrate(
                f"The {monster['name']} throws down its weapon and "
                "surrenders! A masterful display.")
            return "surrender"
        elif total >= dc:
            self.narrate(
                f"Your words shake the {monster['name']}'s resolve -- "
                "it looks ready to break!")
            return "morale"
        else:
            self.narrate(
                f"The {monster['name']} laughs in your face -- "
                "your words betray weakness! "
                "(Enemy gains Advantage on next attack)")
            return "backfire"

    # -----------------------------------------------------------------
    #  Environmental Synergy
    # -----------------------------------------------------------------

    def check_env_synergy(self, spell, battlefield_effects):
        """Check if a cast spell triggers an environmental combo.
        Returns (bonus_damage, type, narration) or None."""
        spell_type = spell.get("type", "none")
        for (effect, trigger), combo in self.ENVIRONMENTAL_COMBOS.items():
            if effect in battlefield_effects and spell_type == trigger:
                bonus = self.roll_dice(combo["damage"])
                battlefield_effects.discard(effect)
                return bonus, combo["type"], combo["narration"]
        return None

    # -----------------------------------------------------------------
    #  Death Transition Helper
    # -----------------------------------------------------------------

    def _handle_zero_hp(self):
        """Handle transition when HP drops to 0.
        Returns: 'ok' | 'saved' | 'dying' | 'fail_added' | 'dead'."""
        if self.character.hp > 0:
            return "ok"
        if self.character.is_dead:
            return "dead"
        if self.character.is_dying or self.character.is_stable:
            # Damage while already dying = auto failed death save
            self.character.death_saves["failures"] += 1
            self.narrate(
                f"Damage while dying -- automatic death save failure! "
                f"(Failures: {self.character.death_saves['failures']}/3)")
            if self.character.death_saves["failures"] >= 3:
                self.character.is_dead = True
                self.character.is_dying = False
                self.character.is_stable = False
                return "dead"
            return "fail_added"
        # First time dropping to 0
        self.character.is_dying = True
        self.character.death_saves = {"successes": 0, "failures": 0}
        self.narrate("You collapse, teetering on the brink of death...")
        # Last gasp: potion check
        potions = [i for i in self.character.inventory if "Healing" in i]
        if potions:
            self.narrate("As darkness closes in, you reach for a potion...")
            gasp = (random.randint(1, 20)
                    + self.character.get_modifier("dex"))
            if gasp >= 10:
                heal = self.roll_dice("2d4") + 2
                self.character.hp = heal
                self.character.is_dying = False
                self.character.reset_death_saves()
                self.character.inventory.remove(potions[0])
                self.narrate(
                    f"LAST GASP! You chug the {potions[0]}! "
                    f"({heal} HP!) Back in the fight!")
                return "saved"
            else:
                self.narrate(
                    f"The potion slips from your fingers... "
                    f"(DEX check: {gasp} vs DC 10)")
        return "dying"

    # =================================================================
    #  BOSS ENCOUNTER HELPERS
    # =================================================================

    def _boss_lair_action(self, encounter):
        """Boss-specific lair action — fires EVERY round (guaranteed)."""
        actions = encounter.get("boss_lair_actions")
        if not actions:
            return
        event = random.choice(actions)
        self.narrate(f"LAIR ACTION: {event['text']}")
        save_stat = event["save_stat"]
        save_dc = event["save_dc"]

        if (self.character.auto_fail_str_dex_saves()
                and save_stat in ("str", "dex")):
            self.narrate("Auto-failure -- you're incapacitated!")
            success = False
        else:
            roll = random.randint(1, 20)
            mod = self.character.get_modifier(save_stat)
            total = roll + mod
            success = total >= save_dc
            tag = "Success!" if success else "Failure!"
            self.narrate(
                f"{save_stat.upper()} Save: {roll}+{mod}={total} "
                f"vs DC {save_dc}. {tag}")

        if not success:
            dmg_notation = event.get("damage", "0")
            if dmg_notation != "0":
                dmg = self.roll_dice(dmg_notation)
                self.narrate(
                    f"You take {dmg} damage from the environment!")
                self.character.take_damage(dmg)
            cond = event.get("condition")
            if cond:
                dur = event.get("cond_duration", 2)
                self.character.add_condition(
                    cond, save_stat=save_stat,
                    save_dc=save_dc, duration=dur)
                self.narrate(f"You are now {cond}!")
        else:
            self.narrate(
                event.get("miss_text", "You avoid the hazard."))

    def _resolve_legendary_actions(self, encounter, boss, boss_hp,
                                   la_remaining, monster_conditions):
        """Boss uses legendary actions after the player's turn.
        Returns (new_la_remaining, damage_dealt_to_player)."""
        if la_remaining <= 0 or boss_hp <= 0:
            return la_remaining, 0
        total_player_dmg = 0
        options = encounter.get("legendary_action_options", [])
        if not options:
            return la_remaining, 0

        affordable = [o for o in options
                      if o.get("cost", 1) <= la_remaining]
        if not affordable:
            return la_remaining, 0

        # Boss AI: 70% chance to use a legendary action each
        # opportunity, preferring attacks
        while la_remaining > 0 and affordable:
            if random.random() > 0.70:
                break
            action = random.choice(affordable)
            cost = action.get("cost", 1)
            la_remaining -= cost

            self.narrate(
                f"LEGENDARY ACTION ({boss['name']}): "
                f"{action['desc']}")

            if action["type"] == "attack":
                dmg = self.roll_dice(action["damage"])
                d_type = action.get("damage_type", "force")
                profile = self.character.damage_profile()
                final, mod_narr = self.apply_damage_modifiers(
                    dmg, d_type, profile)
                self.narrate(f"You take {final} {d_type} damage!")
                if mod_narr:
                    self.narrate(mod_narr)
                self.character.take_damage(final)
                total_player_dmg += final

            elif action["type"] == "debuff":
                ss = action.get("save_stat", "con")
                dc = action.get("save_dc", 13)
                cond = action.get("condition", "Prone")
                dur = action.get("cond_duration", 1)
                roll = random.randint(1, 20)
                mod = self.character.get_modifier(ss)
                if (self.character.auto_fail_str_dex_saves()
                        and ss in ("str", "dex")):
                    save_ok = False
                else:
                    save_ok = (roll + mod) >= dc
                if not save_ok:
                    self.character.add_condition(
                        cond, save_stat=ss,
                        save_dc=dc, duration=dur)
                    self.narrate(
                        f"You fail the save! You are now {cond}!")
                else:
                    self.narrate(
                        f"You resist! ({ss.upper()} save: "
                        f"{roll}+{mod} vs DC {dc})")

            elif action["type"] == "move":
                self.narrate(
                    f"The {boss['name']} repositions. "
                    "(-2 to your next attack roll from disorientation)")
                # Tracked via flag set on calling code

            elif action["type"] == "summon":
                pass  # Handled by caller

            self.narrate(
                f"  (Legendary Actions remaining: "
                f"{la_remaining})")

            affordable = [o for o in options
                          if o.get("cost", 1) <= la_remaining]

        return la_remaining, total_player_dmg

    def _legendary_resistance(self, boss, condition_name,
                              lr_remaining, boss_hp=None):
        """Boss uses Legendary Resistance with SACRIFICE cost.
        Instead of a free auto-succeed, the boss pays a price:
          - Loses 5-15% of max HP (power tears its body apart)
          - On last LR use, also loses a legendary action slot
        Returns (auto_succeed: bool, new_lr_remaining, hp_cost)."""
        if lr_remaining <= 0:
            return False, lr_remaining, 0
        # Always burn LR on severe conditions;
        # 60 % chance on lesser ones
        severe = {"Stunned", "Paralyzed", "Unconscious", "Silenced"}
        if condition_name in severe or random.random() < 0.6:
            lr_remaining -= 1

            # --- Sacrifice cost ---
            max_hp = boss.get("hp", 100)  # original max stored
            cost_pct = random.uniform(0.05, 0.15)
            hp_cost = max(1, int(max_hp * cost_pct))

            self.narrate(
                f"The {boss['name']} would be {condition_name}... "
                "but it surges with defiance!")
            self.narrate(
                f"LEGENDARY RESISTANCE! It forces the condition "
                f"away -- but the effort costs it dearly!")
            self.narrate(
                f"  > The {boss['name']} takes {hp_cost} self-"
                "inflicted damage as dark energy tears through "
                "its form!")
            if lr_remaining == 0:
                self.narrate(
                    f"  > Its reserves are SPENT. You sense it "
                    "cannot do that again.")
            self.narrate(
                f"  (Legendary Resistances remaining: "
                f"{lr_remaining})")
            return True, lr_remaining, hp_cost
        return False, lr_remaining, 0

    def _check_phase_transition(self, encounter, boss, boss_hp,
                                boss_max_hp, phases_triggered):
        """Check if the boss should transition to a new phase.
        Includes vivid tactical telegraphing so the player can
        immediately understand the threat has escalated.
        Returns updated (boss_dict, phases_triggered_set)."""
        for i, phase in enumerate(encounter.get("phases", [])):
            if i in phases_triggered:
                continue
            threshold = phase["threshold"]
            ratio = boss_hp / boss_max_hp if boss_max_hp > 0 else 1
            if ratio <= threshold:
                phases_triggered.add(i)
                # === DRAMATIC PHASE TRANSITION ===
                print(f"\n{'*'*55}")
                print("  !!! THE BATTLEFIELD SHIFTS !!!")
                print(f"{'*'*55}")
                for line in phase.get("narration", []):
                    self.narrate(line)

                # --- Tactical warnings ---
                changes = phase.get("stat_changes", {})
                if "ac" in changes:
                    old_ac = boss.get("ac", 0)
                    new_ac = changes["ac"]
                    delta = new_ac - old_ac
                    if delta > 0:
                        self.narrate(
                            f"  WARNING: Its defenses harden! "
                            f"(AC {old_ac} -> {new_ac})")
                    elif delta < 0:
                        self.narrate(
                            f"  OPENING: Its guard drops in "
                            f"frenzy! (AC {old_ac} -> {new_ac})")
                if "damage" in changes:
                    self.narrate(
                        f"  DANGER: Its attacks grow far more "
                        f"devastating! (now {changes['damage']})")
                new_res = changes.get("resistances")
                if new_res:
                    added = [r for r in new_res
                             if r not in boss.get(
                                 "resistances", [])]
                    if added:
                        self.narrate(
                            f"  ADAPTED: It gains resistance to "
                            f"{', '.join(added)}!")
                new_rc = phase.get("new_recharge")
                if new_rc:
                    self.narrate(
                        f"  NEW ABILITY: {new_rc['name']} -- "
                        "brace yourself!")

                print(f"{'*'*55}\n")

                # Apply stat changes
                for key, val in changes.items():
                    boss[key] = val
                # New recharge ability
                if new_rc:
                    boss["recharge_ability"] = new_rc
        return boss, phases_triggered

    def _spawn_minions(self, encounter, live_minions):
        """Spawn new minions up to the encounter's minion_count.
        Returns a list of new minion dicts."""
        templates = encounter.get("minions", [])
        if not templates:
            return live_minions
        max_count = encounter.get("minion_count", 2)
        while len(live_minions) < max_count:
            t = random.choice(templates)
            m = dict(t)
            m["max_hp"] = m["hp"]
            label = chr(65 + len(live_minions))  # A, B, C, ...
            m["label"] = label
            live_minions.append(m)
        if live_minions:
            names = ", ".join(
                f"{m['name']} {m['label']}" for m in live_minions)
            self.narrate(
                f"Minions on the field: {names}")
        return live_minions

    def _resolve_minion_turns(self, live_minions):
        """Each living minion attacks the player.
        Returns updated list (dead removed) and total dmg dealt."""
        total_dmg = 0
        for m in live_minions:
            roll = random.randint(1, 20)
            if roll >= self.character.ac:
                dmg = self.roll_dice(m["damage"])
                d_type = m.get("damage_type", "piercing")
                profile = self.character.damage_profile()
                final, mod_narr = self.apply_damage_modifiers(
                    dmg, d_type, profile)
                self.narrate(
                    f"{m['name']} {m['label']} attacks! "
                    f"Hit for {final} {d_type} damage!")
                if mod_narr:
                    self.narrate(mod_narr)
                self.character.take_damage(final)
                total_dmg += final
            else:
                self.narrate(
                    f"{m['name']} {m['label']} attacks -- miss!")
        return live_minions, total_dmg

    def _player_attacks_minion(self, live_minions):
        """Let the player choose and attack a minion.
        Returns (live_minions, attacked: bool)."""
        if not live_minions:
            self.narrate("No minions to target!")
            return live_minions, False
        print("  Target a minion:")
        for i, m in enumerate(live_minions, 1):
            print(f"    [{i}] {m['name']} {m['label']} "
                  f"(HP: {m['hp']}/{m['max_hp']})")
        print("    [0] Cancel")
        choice = input("  Choose: ").strip()
        if choice == "0":
            return live_minions, False
        try:
            idx = int(choice) - 1
            target = live_minions[idx]
        except (ValueError, IndexError):
            self.narrate("Invalid target.")
            return live_minions, False

        primary = self.character.CLASSES[
            self.character.char_class]["primary"]
        atk_mod = self.character.get_modifier(primary)
        roll = random.randint(1, 20)
        total = roll + atk_mod
        if roll == 20 or total >= target["ac"]:
            dmg_dice = "2d6" if roll == 20 else "1d8"
            raw = self.roll_dice(dmg_dice) + atk_mod
            p_type = self.get_player_damage_type()
            self.narrate(
                f"{'CRITICAL! ' if roll == 20 else ''}"
                f"You hit {target['name']} {target['label']} "
                f"for {raw} {p_type} damage!")
            target["hp"] -= raw
            if target["hp"] <= 0:
                self.narrate(
                    f"{target['name']} {target['label']} "
                    "is destroyed!")
                live_minions.remove(target)
        else:
            self.narrate(
                f"Miss! ({roll}+{atk_mod}={total} vs "
                f"AC {target['ac']})")
        return live_minions, True

    def _player_attacks_objective(self, objective):
        """Player attacks a secondary objective.
        Returns (objective, destroyed: bool)."""
        if not objective or objective["hp"] <= 0:
            self.narrate("The objective is already destroyed.")
            return objective, False

        primary = self.character.CLASSES[
            self.character.char_class]["primary"]
        atk_mod = self.character.get_modifier(primary)
        roll = random.randint(1, 20)
        total = roll + atk_mod
        if roll == 20 or total >= objective["ac"]:
            dmg_dice = "2d6" if roll == 20 else "1d8"
            raw = self.roll_dice(dmg_dice) + atk_mod
            self.narrate(
                f"You strike the {objective['name']}! "
                f"({raw} damage)")
            objective["hp"] -= raw
            if objective["hp"] <= 0:
                objective["hp"] = 0
                self.narrate(objective["effect_desc"])
                return objective, True
            else:
                self.narrate(
                    f"({objective['name']}: {objective['hp']} HP "
                    "remaining)")
        else:
            self.narrate(
                f"Miss! ({roll}+{atk_mod}={total} vs "
                f"AC {objective['ac']})")
        return objective, False

    # =================================================================
    #  LAST STAND — Heroic final turns when HP hits 0
    # =================================================================

    def _offer_last_stand(self, boss_name):
        """Offer the player a Last Stand when they hit 0 HP in a boss
        fight. Returns True if they accept, False for normal death
        saves."""
        if self.character.last_stand_active:
            return False  # Can't trigger twice

        print(f"\n{'~'*55}")
        print("  YOUR VISION DARKENS...")
        self.narrate(
            "As the world fades, a spark of defiance ignites "
            "within you.")
        self.narrate(
            f"The {boss_name} looms above. This cannot be the "
            "end.")
        print(f"{'~'*55}")
        print()
        print("  [1] Fall Unconscious (standard death saves)")
        print("  [2] TRIGGER LAST STAND -- fight on for "
              f"{self.character.last_stand_max} more rounds")
        print("      (Advantage on attacks, extra damage die,")
        print("       ignore Fear/Charm -- but death is certain")
        print("       when the adrenaline fades)")
        choice = input("  Choose your fate: ").strip()

        if choice == "2":
            self.character.last_stand_active = True
            self.character.last_stand_rounds = (
                self.character.last_stand_max)
            self.character.hp = 1
            self.character.is_dying = False
            self.character.is_stable = False
            self.character.reset_death_saves()
            # Lock death saves -- healing cannot save you now
            self.character.death_saves["failures"] = 3

            print(f"\n{'!'*55}")
            self.narrate(
                f"{self.character.name} IGNORES THE MORTAL WOUND!")
            self.narrate(
                "Fueled by pure adrenaline and a final prayer, "
                "you rise!")
            self.narrate(
                f"LAST STAND ACTIVE -- {self.character.last_stand_max} "
                "rounds of glory remain!")
            self.narrate(
                "  > Advantage on ALL attack rolls")
            self.narrate(
                "  > Extra damage die on every hit")
            self.narrate(
                "  > Immune to Frightened and Charmed")
            self.narrate(
                "  > Healing spells have NO effect")
            print(f"{'!'*55}\n")
            return True
        return False

    def _tick_last_stand(self):
        """Called at end of each round during Last Stand.
        Returns 'continue' or 'collapse'."""
        if not self.character.last_stand_active:
            return "continue"
        self.character.last_stand_rounds -= 1
        remaining = self.character.last_stand_rounds
        if remaining <= 0:
            return "collapse"
        urgency = {
            3: "The fire still burns bright within you.",
            2: "Your vision blurs at the edges. Not yet...",
            1: "Every heartbeat is agony. ONE MORE ROUND.",
        }
        msg = urgency.get(
            remaining,
            f"Last Stand: {remaining} rounds remain.")
        self.narrate(msg)
        return "continue"

    def _resolve_last_stand_collapse(self, boss_name,
                                     boss_hp, boss_max_hp):
        """Handle the end of a Last Stand. The hero falls, but may
        leave a lasting impact.
        Returns 'death' or 'heroic_death'."""
        print(f"\n{'~'*55}")
        print("  THE ADRENALINE FADES...")
        print(f"{'~'*55}")
        self.narrate(
            f"The light fades from {self.character.name}'s eyes "
            "as the adrenaline wears off.")

        # Check if they dealt enough damage to matter
        dmg_dealt_pct = 1 - (boss_hp / boss_max_hp
                             if boss_max_hp > 0 else 1)

        if dmg_dealt_pct >= 0.8:
            self.narrate(
                f"But the {boss_name} is STAGGERING -- your "
                "sacrifice has nearly finished it!")
            self.narrate(
                "HEROIC SACRIFICE! Your legend will echo through "
                "the ages.")
        else:
            self.narrate(
                f"{self.character.name} has fallen, a true hero.")
            self.narrate(
                "Your sacrifice will not be forgotten.")

        self.character.hp = 0
        self.character.is_dead = True
        self.character.last_stand_active = False
        self.character.heroic_sacrifice_count += 1
        return "heroic_death"

    def _heroic_sacrifice_objective(self, objective, boss_name):
        """During Last Stand, auto-destroy a secondary objective
        at the cost of immediate death.
        Returns (objective, destroyed: bool, hero_died: bool)."""
        if not objective or objective["hp"] <= 0:
            self.narrate("No objective to sacrifice for.")
            return objective, False, False

        print(f"\n{'!'*55}")
        self.narrate(
            f"With the last of your strength, {self.character.name} "
            f"hurls themselves at the {objective['name']}!")
        self.narrate(
            "HEROIC SACRIFICE! The objective shatters in a "
            "blinding flash!")
        self.narrate(objective["effect_desc"])
        print(f"{'!'*55}\n")

        objective["hp"] = 0

        # The hero collapses
        self.narrate(
            f"{self.character.name} crumples to the ground, "
            "a serene smile on their face.")
        self.narrate(
            "A true hero's end -- the sacrifice of one to "
            "save many.")

        self.character.hp = 0
        self.character.is_dead = True
        self.character.last_stand_active = False
        self.character.heroic_sacrifice_count += 1

        return objective, True, True

    # =================================================================
    #  FAIL-FORWARD — Boss-specific alternatives to total defeat
    # =================================================================

    FAIL_FORWARD_SCENARIOS = {
        "capture": {
            "narration": [
                "As darkness claims you, the killing blow "
                "never comes.",
                "You awaken bound in chains. The boss has "
                "plans for you...",
                "You are stripped of half your gold and one "
                "random item.",
                "But you are ALIVE. And alive means another "
                "chance.",
            ],
            "gold_loss_pct": 0.5,
            "item_loss": True,
            "hp_restore_pct": 0.25,
        },
        "hubris": {
            "narration": [
                "The boss turns away from your broken form, "
                "dismissing you as beneath notice.",
                "'Pathetic. You aren't even worth the killing "
                "blow.'",
                "As the villain focuses on their dark ritual, "
                "you feel consciousness slowly return...",
                "The world is now MORE DANGEROUS. The boss's "
                "plan advances.",
            ],
            "gold_loss_pct": 0.0,
            "item_loss": False,
            "hp_restore_pct": 0.15,
        },
        "intervention": {
            "narration": [
                "A flash of divine light tears through the "
                "chamber!",
                "An unseen force drags you from the brink of "
                "death.",
                "You awaken far from the lair, gasping. A "
                "spectral voice whispers:",
                "'This debt WILL be repaid. Your next battle "
                "will be harder.'",
            ],
            "gold_loss_pct": 0.0,
            "item_loss": False,
            "hp_restore_pct": 0.50,
        },
    }

    def _boss_fail_forward(self, boss_name, encounter):
        """Instead of a hard Game Over, offer narrative consequences.
        Returns 'rescued' if the player survives with consequences,
        or 'death' if true death is chosen / forced."""
        # Only works once per boss
        if encounter.get("_fail_forward_used"):
            return "death"

        print(f"\n{'='*55}")
        print("  DEFEAT IS NOT THE END...")
        print(f"{'='*55}")
        self.narrate(
            f"The {boss_name} stands victorious over your "
            "broken body.")
        self.narrate(
            "But fate offers alternatives to oblivion...")
        print()

        scenarios = list(self.FAIL_FORWARD_SCENARIOS.items())
        random.shuffle(scenarios)
        # Offer the player 2 of 3 options + true death
        offered = scenarios[:2]

        labels = {
            "capture": "Captured & Ransomed",
            "hubris": "The Villain's Hubris",
            "intervention": "Divine Intervention",
        }
        for i, (key, _) in enumerate(offered, 1):
            print(f"  [{i}] {labels[key]}")
        print(f"  [3] Accept Death (Game Over)")
        choice = input("  Choose: ").strip()

        if choice in ("1", "2"):
            try:
                idx = int(choice) - 1
                key, scenario = offered[idx]
            except (ValueError, IndexError):
                return "death"

            encounter["_fail_forward_used"] = True

            for line in scenario["narration"]:
                self.narrate(line)

            # Apply consequences
            gold_loss = int(
                self.character.gold
                * scenario["gold_loss_pct"])
            if gold_loss > 0:
                self.character.gold -= gold_loss
                self.narrate(
                    f"You lose {gold_loss} gold.")

            if scenario["item_loss"] and self.character.inventory:
                lost = random.choice(self.character.inventory)
                self.character.inventory.remove(lost)
                self.narrate(
                    f"The {lost} has been taken from you.")

            # Restore partial HP
            restore = max(1, int(
                self.character.max_hp
                * scenario["hp_restore_pct"]))
            self.character.hp = restore
            self.character.is_dying = False
            self.character.is_stable = False
            self.character.is_dead = False
            self.character.reset_death_saves()
            self.character.last_stand_active = False
            self.character.conditions.clear()

            self.narrate(
                f"You cling to life with {restore} HP.")

            # Hubris consequence: world gets harder
            if key == "hubris":
                self.narrate(
                    "The villain's plan advances. All "
                    "enemies in this area grow stronger.")
                # Mark danger escalation
                encounter["_world_darker"] = True

            # Intervention debt
            if key == "intervention":
                self.narrate(
                    "The divine debt weighs on you. Your "
                    "next saving throw will be at "
                    "Disadvantage.")
                self.character.add_condition(
                    "Exhausted", save_stat="con",
                    save_dc=99, duration=5)

            self.character.calculate_ac()
            return "rescued"

        return "death"

    # =================================================================
    #  LEGACY SYSTEM — Bonuses inherited by the next character
    # =================================================================

    LEGACY_REWARDS = [
        {
            "name": "Hero's Echo",
            "type": "stat",
            "desc": ("The fallen hero's spirit grants +1 to "
                     "your highest ability score."),
            "apply": "stat_boost",
        },
        {
            "name": "Heirloom Weapon",
            "type": "equipment",
            "desc": ("You inherit a weapon that glows with "
                     "the previous hero's essence. "
                     "(+1 damage on all attacks)"),
            "apply": "heirloom",
        },
        {
            "name": "Adrenaline Burst Token",
            "type": "token",
            "desc": ("Once per adventure, auto-succeed a "
                     "saving throw or turn a hit into a "
                     "critical hit."),
            "apply": "hero_token",
        },
        {
            "name": "Inherited Reputation",
            "type": "social",
            "desc": ("The world remembers the sacrifice. "
                     "Advantage on all social checks for "
                     "the first 10 turns."),
            "apply": "reputation",
        },
    ]

    def _generate_legacy(self, fallen_character):
        """Generate legacy bonuses from a fallen hero.
        Returns a list of legacy dicts to apply to new char."""
        legacies = []
        # Always get 1 guaranteed reward
        legacies.append(random.choice(self.LEGACY_REWARDS))
        # Heroic sacrifice grants an extra bonus
        if fallen_character.heroic_sacrifice_count > 0:
            remaining = [r for r in self.LEGACY_REWARDS
                         if r not in legacies]
            if remaining:
                legacies.append(random.choice(remaining))
        return legacies

    def _apply_legacy(self, legacies):
        """Apply legacy bonuses to the current character."""
        if not legacies:
            return
        print(f"\n{'='*55}")
        print("  LEGACY OF THE FALLEN")
        print(f"{'='*55}")
        for legacy in legacies:
            self.narrate(f"LEGACY: {legacy['name']}")
            self.narrate(f"  {legacy['desc']}")

            if legacy["apply"] == "stat_boost":
                # +1 to highest stat
                best = max(self.character.stats,
                           key=self.character.stats.get)
                self.character.stats[best] += 1
                self.narrate(
                    f"  ({best.upper()} increased to "
                    f"{self.character.stats[best]}!)")

            elif legacy["apply"] == "heirloom":
                self.character.inventory.append(
                    "Heirloom Weapon (+1 dmg)")
                self.narrate(
                    "  (Added to inventory)")

            elif legacy["apply"] == "hero_token":
                self.character.inventory.append(
                    "Adrenaline Burst Token")
                self.narrate(
                    "  (Added to inventory -- use during "
                    "combat for guaranteed crit or "
                    "auto-save)")

            elif legacy["apply"] == "reputation":
                self.character.legacy_bonuses.append(
                    "reputation_advantage")
                self.narrate(
                    "  (Social advantage active for 10 "
                    "turns)")

        self.character.legacy_bonuses.extend(
            [l["name"] for l in legacies])
        print(f"{'='*55}\n")

    def roll_dice(self, notation):
        """Roll dice in NdN format (e.g., 2d6)"""
        if "d" not in notation:
            return int(notation)
        num, sides = notation.split("d")
        num = int(num) if num else 1
        sides = int(sides)
        return sum(random.randint(1, sides) for _ in range(num))
    
    def skill_check(self, stat, dc):
        roll = random.randint(1, 20)
        modifier = self.character.get_modifier(stat)
        total = roll + modifier
        success = total >= dc
        
        if roll == 20:
            self.narrate(f"NATURAL 20! Critical success! (Roll: {roll} + {modifier} = {total} vs DC {dc})")
            return True
        elif roll == 1:
            self.narrate(f"NATURAL 1! Critical failure! (Roll: {roll} + {modifier} = {total} vs DC {dc})")
            return False
        else:
            result = "Success!" if success else "Failure."
            self.narrate(f"Roll: {roll} + {modifier} = {total} vs DC {dc}. {result}")
            return success
    
    def combat(self, monster):
        self.narrate(f"⚔️  COMBAT BEGINS: {monster['name']}!")
        self.narrate(self.describe_health(monster['hp'], monster['hp'], monster['name']))

        monster_hp = monster['hp']
        monster_max_hp = monster['hp']
        monster_dex_mod = (monster.get('dex', 10) - 10) // 2
        monster_dex = monster.get('dex', 10)
        monster_str = monster.get('str', 10)
        monster_conditions = set()  # "Prone", "Stunned", etc.

        # --- Determine cover at fight start ---
        cover_bonus = self.get_cover_modifier()
        self.narrate(self.describe_cover(cover_bonus))
        self.character.calculate_ac(cover_bonus)

        # --- Lighting ---
        light = self.get_light_level()
        self.narrate(self.LIGHT_DESCRIPTIONS.get(light, ""))
        light_player_disadv, light_monster_adv = self.light_attack_modifier()

        # --- Difficult terrain warning ---
        eff_move = self.effective_movement()
        if eff_move < self.movement_budget:
            self.narrate(
                f"The ground is treacherous — your movement is halved "
                f"to {eff_move} ft.")

        # --- Passive Perception / Surprise Check ---
        player_surprised = False
        if (self.current_location.get("has_lair_actions")
                or self.current_location.get("danger", 0) >= 2):
            player_surprised = self.surprise_check(monster)

        # --- Tactical Positioning ---
        battlefield = self.generate_battlefield()
        self.describe_battlefield(battlefield)
        battlefield_effects = set()

        # --- Favor: Blessing of Advantage ---
        favor_adv_active = False
        if self.character.favor_advantage_encounters > 0:
            self.character.favor_advantage_encounters -= 1
            favor_adv_active = True
            remaining = self.character.favor_advantage_encounters
            self.narrate(
                f"✨ Blessing of Advantage is active this "
                f"combat! ({remaining} encounter(s) left)")

        # --- Favor: NPC Ally ---
        favor_ally_active = False
        if self.character.favor_ally_encounters > 0:
            self.character.favor_ally_encounters -= 1
            favor_ally_active = True
            remaining = self.character.favor_ally_encounters
            self.narrate(
                f"🗡️  Your NPC ally fights alongside you! "
                f"({remaining} encounter(s) left)")

        combat_round = 0
        recharge_ready = False
        help_grants_advantage = False
        social_backfire_adv = False

        while monster_hp > 0 and not self.character.is_dead:
            combat_round += 1

            # =============================================================
            #  INITIATIVE 20 — Lair / Environmental Action
            # =============================================================
            self.lair_action()
            if self.character.hp <= 0:
                status = self._handle_zero_hp()
                if status == "dead":
                    self.narrate("Slain by the environment!")
                    self.character.calculate_ac()
                    return "death"

            # =============================================================
            #  START OF PLAYER TURN — reset action economy
            # =============================================================
            self.character.start_of_turn()
            self.character.calculate_ac(cover_bonus)

            is_incap = self.character.is_incapacitated()

            # DM flavour: describe the state of the fight
            print(f"\n{'='*40}")
            print(f"  --- Round {combat_round} ---")
            self.narrate(self.describe_health(
                self.character.hp, self.character.max_hp, self.character.name))
            self.narrate(self.describe_health(
                monster_hp, monster_max_hp, f"The {monster['name']}"))
            conds = self.character.active_conditions_str()
            m_cond_str = (", ".join(sorted(monster_conditions))
                          if monster_conditions else "None")
            pp = self.character.passive_perception()
            print(f"  [AC: {self.character.ac}]  [Move: {eff_move} ft]  "
                  f"[Passive Perception: {pp}]")
            print(f"  [Conditions: {conds}]  [Enemy: {m_cond_str}]")

            # --- SURPRISED: skip entire first turn ---
            prompt_action = True
            action = "_skip"

            if player_surprised:
                self.narrate(
                    "You are SURPRISED! You can't act or react "
                    "this round.")
                player_surprised = False
                prompt_action = False
            elif self.character.is_dying or self.character.is_stable:
                prompt_action = False
                if self.character.is_stable:
                    self.narrate(
                        "You are unconscious but stable. "
                        "Skipping your turn...")
                else:
                    self.narrate(
                        f"DEATH SAVES: "
                        f"S {self.character.death_saves['successes']}/3 | "
                        f"F {self.character.death_saves['failures']}/3")
                    ds_result, ds_roll = (
                        self.character.death_saving_throw())
                    if ds_result == "alive":
                        self.narrate(
                            f"NATURAL 20! Your eyes snap open "
                            f"-- you surge back with 1 HP!")
                        prompt_action = True
                        is_incap = False
                    elif ds_result == "dead":
                        note = ("NATURAL 1 -- two failures!"
                                if ds_roll == 1
                                else f"({ds_roll}): Failure.")
                        self.narrate(f"Death save {note}")
                        self.narrate(
                            "Three failures. Your journey "
                            "ends here.")
                        self.character.calculate_ac()
                        return "death"
                    elif ds_result == "stable":
                        self.narrate(
                            f"Death save ({ds_roll}): Success! "
                            f"You stabilize.")
                    else:
                        sorf = ("Success" if ds_roll >= 10
                                else "Failure")
                        self.narrate(
                            f"Death save ({ds_roll}): {sorf}! "
                            f"(S:{self.character.death_saves['successes']}/3 "
                            f"F:{self.character.death_saves['failures']}/3)")
            elif is_incap:
                self.narrate(
                    "You are Incapacitated! You cannot take Actions, "
                    "Bonus Actions, or Reactions this turn.")
                prompt_action = False

            if prompt_action:
                print("  Actions:")
                print("    [1] Attack           [5] Disengage (no opp. attacks)")
                print("    [2] Dodge (+Disadv)   [6] Help (grant Advantage)")
                print("    [3] Flee             [7] Cast Spell")
                print("    [4] Object Interact  [8] Shove (knock Prone)")
                print("    [9] Persuade/Intimidate  [10] Ready Action")
                action = input("  Choose action: ").strip()

            # === FREE OBJECT INTERACTION ===
            if action == "4":
                if self.character.has_used_object_interaction:
                    self.narrate(
                        "You've already used your free Object "
                        "Interaction this turn!")
                else:
                    self.character.has_used_object_interaction = True
                    usable = [i for i in self.character.inventory
                              if "Potion" in i]
                    if usable:
                        self.narrate(
                            f"You quickly grab a {usable[0]} from your "
                            "belt. (Use Item action still needed to drink it)")
                    else:
                        self.narrate(
                            "You adjust your grip on your weapon "
                            "(free interaction used).")
                continue  # doesn't consume the Action

            # === ATTACK ===
            if action == "1":
                primary_stat = self.character.CLASSES[
                    self.character.char_class]["primary"]
                attack_mod = self.character.get_modifier(primary_stat)

                # --- Flanking & High Ground ---
                flanking = self.check_flanking(battlefield)
                hg_bonus = (self.check_high_ground(battlefield)
                            if self.is_player_ranged() else 0)

                player_adv = (help_grants_advantage
                              or "Prone" in monster_conditions
                              or flanking
                              or favor_adv_active)
                player_disadv = (self.character.attack_has_disadvantage()
                                 or light_player_disadv)
                help_grants_advantage = False

                attack_roll, roll_type = self.combat_roll(
                    has_advantage=player_adv,
                    has_disadvantage=player_disadv)
                if roll_type != "Straight":
                    self.narrate(f"(Rolling with {roll_type})")
                total_attack = attack_roll + attack_mod + hg_bonus

                p_dmg_type = self.get_player_damage_type()

                if attack_roll == 20:
                    raw = self.roll_dice("2d6") + attack_mod
                    final, mod_narr = self.apply_damage_modifiers(
                        raw, p_dmg_type, monster)
                    self.narrate(
                        f"NATURAL 20 — CRITICAL HIT! "
                        f"{self.describe_nat20_hit()} "
                        f"({final} {p_dmg_type} damage!)")
                    if mod_narr:
                        self.narrate(mod_narr)
                    monster_hp -= final
                elif attack_roll == 1:
                    self.narrate(
                        f"NATURAL 1 — Critical Fumble! "
                        f"{self.describe_nat1_miss()}")
                elif total_attack >= monster['ac']:
                    raw = self.roll_dice("1d8") + attack_mod
                    final, mod_narr = self.apply_damage_modifiers(
                        raw, p_dmg_type, monster)
                    self.narrate(
                        f"You hit! (Roll: {attack_roll}+{attack_mod}"
                        f"={total_attack} vs AC {monster['ac']}) "
                        f"— {final} {p_dmg_type} damage")
                    if mod_narr:
                        self.narrate(mod_narr)
                    monster_hp -= final
                else:
                    miss_text = self.describe_miss(
                        total_attack, monster['ac'], monster_dex_mod)
                    self.narrate(
                        f"Miss! (Roll: {attack_roll}+{attack_mod}"
                        f"={total_attack} vs AC {monster['ac']}) "
                        f"— {miss_text}")

            # === DODGE ===
            elif action == "2":
                self.character.has_dodge_active = True
                self.narrate(
                    "You focus entirely on evading. All attacks against "
                    "you have Disadvantage until your next turn.")

            # === FLEE ===
            elif action == "3":
                flee_dc = 14 if eff_move < self.movement_budget else 12
                if self.skill_check("dex", flee_dc):
                    self.narrate("You successfully flee from combat!")
                    self.character.conditions.clear()
                    self.character.calculate_ac()
                    return False
                else:
                    self.narrate("You fail to escape!")

            # === DISENGAGE ===
            elif action == "5":
                self.character.is_disengaging = True
                self.narrate(
                    "You carefully disengage — no Opportunity Attacks "
                    "this turn.")

            # === HELP (mechanical) ===
            elif action == "6":
                help_grants_advantage = True
                self.narrate(
                    "You study the enemy's movements and call out an "
                    "opening. Your next Attack will have Advantage "
                    f"against the {monster['name']}!")

            # === CAST SPELL (full component system) ===
            elif action == "7":
                spell_list = list(self.SPELLS.items())
                print("  Available spells:")
                for i, (sname, sdata) in enumerate(spell_list, 1):
                    comp = sdata["components"]
                    slvl = ("Cantrip" if sdata["level"] == 0
                            else f"Level {sdata['level']}")
                    sact = sdata["action"].title()
                    print(f"    [{i}] {sname} ({slvl}, {sact}) "
                          f"[{comp}] — {sdata['desc']}")
                print("    [0] Cancel")
                spell_choice = input("  Choose spell: ").strip()
                if spell_choice == "0":
                    continue
                try:
                    spell_idx = int(spell_choice) - 1
                    spell_name, spell = spell_list[spell_idx]
                except (ValueError, IndexError):
                    self.narrate("Invalid spell choice.")
                    continue

                is_bonus_spell = spell["action"] == "bonus"
                if is_bonus_spell:
                    if self.character.has_used_bonus_action:
                        self.narrate(
                            "You've already used your Bonus Action!")
                        continue
                else:
                    if not self.character.can_cast_leveled_action_spell():
                        self.narrate(
                            "You already cast a leveled BA spell — "
                            "only cantrips as your Action this turn!")
                        continue

                # --- Component check (V / S) ---
                can_cast, reason = self.character.can_cast_spell(
                    spell["components"])
                if not can_cast:
                    self.narrate(reason)
                    continue

                # --- Material component cost (M) ---
                m_ok, m_cost, m_reason = (
                    self._material_component_cost(spell))
                if not m_ok:
                    self.narrate(m_reason)
                    continue
                if m_cost > 0:
                    self.character.gold -= m_cost
                    self.narrate(
                        f"(Material components consumed: "
                        f"{m_cost} gold)")

                comp_tag = f"[{spell['components']}]"
                if spell["type"] == "healing":
                    heal_expr = spell.get("heal", "1d4")
                    base_heal = self.roll_dice(
                        heal_expr.split("+")[0])
                    bonus = (int(heal_expr.split("+")[1])
                             if "+" in heal_expr else 0)
                    total_heal = base_heal + bonus
                    self.character.heal(total_heal)
                    self.narrate(
                        f"✨ You cast {spell_name}! {comp_tag} "
                        f"— healed for {total_heal} HP!")
                else:
                    # --- Grease special: creates hazard ---
                    if spell.get("special") == "grease":
                        battlefield_effects.add("grease")
                        save_roll = (random.randint(1, 20)
                                     + monster_dex_mod)
                        if save_roll < 12:
                            monster_conditions.add("Prone")
                            self.narrate(
                                f"You cast {spell_name}! {comp_tag} "
                                "Slick grease covers the ground!")
                            self.narrate(
                                f"The {monster['name']} slips and "
                                f"falls Prone! (DEX save: "
                                f"{save_roll} vs DC 12)")
                        else:
                            self.narrate(
                                f"You cast {spell_name}! {comp_tag} "
                                f"The {monster['name']} keeps its "
                                f"footing. (DEX save: {save_roll} "
                                f"vs DC 12)")
                    else:
                        raw_dmg = self.roll_dice(spell["damage"])
                        final_dmg, mod_narr = (
                            self.apply_damage_modifiers(
                                raw_dmg, spell["type"], monster))
                        self.narrate(
                            f"You cast {spell_name}! {comp_tag} "
                            f"({final_dmg} {spell['type']} damage)")
                        if mod_narr:
                            self.narrate(mod_narr)
                        monster_hp -= final_dmg
                    # --- Environmental Synergy ---
                    synergy = self.check_env_synergy(
                        spell, battlefield_effects)
                    if synergy:
                        s_dmg, s_type, s_narr = synergy
                        self.narrate(
                            f"ENVIRONMENTAL COMBO! {s_narr}")
                        s_final, s_mod = (
                            self.apply_damage_modifiers(
                                s_dmg, s_type, monster))
                        self.narrate(
                            f"Bonus {s_final} {s_type} damage!")
                        if s_mod:
                            self.narrate(s_mod)
                        monster_hp -= s_final

                if is_bonus_spell:
                    self.character.has_used_bonus_action = True
                    if spell["level"] > 0:
                        self.character.bonus_action_spell_this_turn = True
                        self.narrate(
                            "(Leveled BA spell: only cantrips with "
                            "your Action this turn.)")

            # === SHOVE ===
            elif action == "8":
                self.narrate(
                    "You attempt to shove the enemy to the ground!")
                if self.character.shove_contest(monster_dex, monster_str):
                    monster_conditions.add("Prone")
                    self.narrate(
                        f"The {monster['name']} crashes to the ground"
                        " — it is now Prone! (Melee attacks have "
                        "Advantage, its attacks have Disadvantage)")
                else:
                    self.narrate(
                        f"The {monster['name']} holds its ground. "
                        "Shove failed!")

            # === PERSUADE / INTIMIDATE ===
            elif action == "9":
                result = self.attempt_social_combat(
                    monster, monster_hp, monster_max_hp)
                if result == "surrender":
                    xp_gained = monster['xp']
                    self.character.experience += xp_gained
                    self.narrate(
                        f"The {monster['name']} surrenders! "
                        f"You gain {xp_gained} XP.")
                    self.character.conditions.clear()
                    self.character.calculate_ac()
                    return True
                elif result == "morale":
                    if self.morale_check(monster, monster_hp):
                        self.narrate(
                            f"The {monster['name']} breaks and "
                            "flees!")
                        xp_gained = monster['xp'] // 2
                        self.character.experience += xp_gained
                        self.narrate(
                            f"You gain {xp_gained} XP.")
                        self.character.conditions.clear()
                        self.character.calculate_ac()
                        return True
                elif result == "backfire":
                    social_backfire_adv = True

            # === READY ACTION ===
            elif action == "10":
                print("  Ready a trigger:")
                print("    [1] When enemy moves (attack)")
                print("    [2] When enemy attacks (dodge)")
                print("    [3] When enemy uses special (attack)")
                ready_choice = input(
                    "  Choose trigger: ").strip()
                triggers = {"1": "on_move", "2": "on_attack",
                            "3": "on_special"}
                actions = {"1": "attack", "2": "dodge",
                           "3": "attack"}
                if ready_choice in triggers:
                    self.character.readied_action = {
                        "trigger": triggers[ready_choice],
                        "action": actions[ready_choice],
                    }
                    self.narrate(
                        "You hold your action, watching for "
                        "an opening... "
                        "(uses Reaction when triggered)")
                else:
                    self.narrate(
                        "Invalid trigger. Action wasted.")

            # =============================================================
            #  Opportunity Attack on Flee
            # =============================================================
            if action == "3" and not self.character.is_disengaging:
                if not monster.get('_used_reaction', False):
                    opp_roll = random.randint(1, 20)
                    if opp_roll >= self.character.ac:
                        opp_damage = self.roll_dice(monster['damage'])
                        self.narrate(
                            f"Opportunity Attack! The "
                            f"{monster['name']} strikes as you "
                            f"leave its reach -- {opp_damage} dmg!")
                        self.character.take_damage(opp_damage)
                        status = self._handle_zero_hp()
                        if status == "dead":
                            self.narrate(
                                "You have fallen in battle!")
                            self.character.calculate_ac()
                            return "death"
                    else:
                        self.narrate(
                            f"The {monster['name']} swings an "
                            "opportunity attack -- but misses!")
                    monster['_used_reaction'] = True

            # =============================================================
            #  Monster Morale Check
            # =============================================================
            if monster_hp > 0 and self.morale_check(monster, monster_hp):
                flee_msg = random.choice([
                    'breaks and runs!', 'flees in terror!',
                    'turns tail and retreats!'])
                self.narrate(f"The {monster['name']} {flee_msg}")
                if (not self.character.is_incapacitated()
                        and not self.character.has_used_reaction):
                    self.narrate(
                        "⚡ You get an Opportunity Attack as it flees!")
                    self.character.has_used_reaction = True
                    primary_stat = self.character.CLASSES[
                        self.character.char_class]["primary"]
                    oa_mod = self.character.get_modifier(primary_stat)
                    oa_roll = random.randint(1, 20)
                    if oa_roll + oa_mod >= monster['ac']:
                        oa_dmg = self.roll_dice("1d8") + oa_mod
                        self.narrate(
                            f"You strike the fleeing "
                            f"{monster['name']} for {oa_dmg} damage!")
                        monster_hp -= oa_dmg
                    else:
                        self.narrate(
                            "Your swing misses the retreating foe.")
                xp_gained = monster['xp'] // 2
                self.character.experience += xp_gained
                self.narrate(
                    f"The enemy escaped, but you gain {xp_gained} XP "
                    "for driving it off.")
                self.character.conditions.clear()
                self.character.calculate_ac()
                return True

            # =============================================================
            #  NPC ALLY BONUS ATTACK (favor)
            # =============================================================
            if favor_ally_active and monster_hp > 0:
                ally_dmg = self.roll_dice("1d6")
                monster_hp -= ally_dmg
                self.narrate(
                    f"\U0001f5e1\ufe0f  Your ally strikes the "
                    f"{monster['name']} for {ally_dmg} damage!")
                if monster_hp <= 0:
                    monster_hp = 0

            # =============================================================
            #  MONSTER'S TURN
            # =============================================================
            if monster_hp > 0:
                monster['_used_reaction'] = False

                # --- Standing Up from Prone ---
                # A creature with speed 0 (Incapacitated) CANNOT stand.
                MONSTER_INCAP = {"Stunned", "Paralyzed", "Unconscious"}
                if "Prone" in monster_conditions:
                    if monster_conditions & MONSTER_INCAP:
                        self.narrate(
                            f"The {monster['name']} is "
                            f"{', '.join(monster_conditions & MONSTER_INCAP)}"
                            " and cannot stand! (Speed is 0)")
                    else:
                        monster_conditions.discard("Prone")
                        self.narrate(
                            f"The {monster['name']} staggers to its "
                            "feet. (Half its movement spent standing)")

                monster_attack_disadv = "Prone" in monster_conditions

                # --- Combat Banter ---
                self.combat_banter(monster, monster_hp, monster_max_hp)

                # --- Recharge ability ---
                ability = monster.get("recharge_ability")
                used_recharge = False
                if recharge_ready and ability:
                    recharge_ready = False
                    rc_dmg = self.roll_dice(ability["damage"])
                    self.narrate(
                        f"💥 The {monster['name']} unleashes "
                        f"{ability['name']}! ({rc_dmg} damage)")
                    alive = self.character.take_damage(rc_dmg)
                    rc_cond = ability.get("condition")
                    if rc_cond:
                        rc_ss = ability.get("save_stat", "con")
                        rc_dc = ability.get("save_dc", 12)
                        roll = random.randint(1, 20)
                        mod = self.character.get_modifier(rc_ss)
                        if (self.character.auto_fail_str_dex_saves()
                                and rc_ss in ("str", "dex")):
                            save_ok = False
                        else:
                            save_ok = (roll + mod) >= rc_dc
                        if not save_ok:
                            self.character.add_condition(
                                rc_cond, save_stat=rc_ss,
                                save_dc=rc_dc, duration=2)
                            self.narrate(f"You are now {rc_cond}!")
                        else:
                            self.narrate(
                                f"You resist the {rc_cond} effect! "
                                f"({rc_ss.upper()} save: {roll}+{mod}"
                                f" vs DC {rc_dc})")
                    if not alive:
                        status = self._handle_zero_hp()
                        if status == "dead":
                            self.narrate(
                                "You have fallen in battle!")
                            self.character.calculate_ac()
                            return "death"
                    used_recharge = True
                elif ability and self.should_recharge(ability):
                    recharge_ready = True
                    self.telegraph_attack(monster)

                # --- Normal attack ---
                if not used_recharge:
                    m_adv = (light_monster_adv
                             or self.character
                                 .attacks_against_have_advantage()
                             or social_backfire_adv)
                    social_backfire_adv = False
                    m_disadv = (self.character.has_dodge_active
                                or monster_attack_disadv)
                    if self.character.is_incapacitated():
                        m_disadv = False  # Dodge vetoed
                    monster_attack, m_roll_type = self.combat_roll(
                        has_advantage=m_adv,
                        has_disadvantage=m_disadv)
                    if m_roll_type != "Straight":
                        self.narrate(
                            f"(The {monster['name']} rolls with "
                            f"{m_roll_type})")

                    player_dex_mod = (
                        self.character.get_dex_ac_component())
                    is_auto_crit = (
                        self.character.auto_crit_if_hit()
                        and monster_attack >= self.character.ac)

                    m_dmg_type = monster.get(
                        "damage_type", "bludgeoning")
                    player_profile = self.character.damage_profile()

                    if monster_attack >= self.character.ac:
                        # Track crit & acid/fire for armor degradation
                        if is_auto_crit or monster_attack == 20:
                            self._combat_took_crit = True
                        if m_dmg_type in ("acid", "fire"):
                            self._combat_took_acid_fire = True
                        if is_auto_crit or monster_attack == 20:
                            raw = (self.roll_dice(monster['damage'])
                                   * 2)
                            crit_label = ("AUTO-CRIT"
                                          if is_auto_crit
                                          else "CRITICAL HIT")
                            flavour = (
                                self.describe_monster_nat20()
                                if monster_attack == 20 else "")
                            final, mod_narr = (
                                self.apply_damage_modifiers(
                                    raw, m_dmg_type,
                                    player_profile))
                            self.narrate(
                                f"{crit_label}! The "
                                f"{monster['name']} devastates you "
                                f"for {final} {m_dmg_type} damage! "
                                f"{flavour}")
                            if mod_narr:
                                self.narrate(mod_narr)
                            damage = final
                        else:
                            raw = self.roll_dice(monster['damage'])
                            final, mod_narr = (
                                self.apply_damage_modifiers(
                                    raw, m_dmg_type,
                                    player_profile))
                            self.narrate(
                                f"The {monster['name']} hits you for "
                                f"{final} {m_dmg_type} damage!")
                            if mod_narr:
                                self.narrate(mod_narr)
                            damage = final
                        alive = self.character.take_damage(damage)
                        if self.character.is_concentrating:
                            kept = (
                                self.character
                                    .concentration_check(damage))
                            if not kept:
                                self.narrate(
                                    "Your concentration on "
                                    f"{self.character.concentration_spell or 'the spell'}"
                                    " shatters!")
                        if not alive:
                            status = self._handle_zero_hp()
                            if status == "dead":
                                self.narrate(
                                    "You have fallen in battle!")
                                self.character.calculate_ac()
                                return "death"
                    else:
                        if monster_attack == 1:
                            self.narrate(
                                f"The {monster['name']} rolls a "
                                f"Natural 1! "
                                f"{self.describe_monster_nat1()}")
                        else:
                            miss_text = self.describe_miss(
                                monster_attack,
                                self.character.ac,
                                player_dex_mod)
                            self.narrate(
                                f"The {monster['name']} attacks "
                                f"— {miss_text}")

                # --- Readied Action Trigger ---
                if (self.character.readied_action
                        and not self.character.has_used_reaction
                        and not self.character.is_dying):
                    ra = self.character.readied_action
                    triggered = False
                    if (ra["trigger"] == "on_attack"
                            and not used_recharge):
                        triggered = True
                    elif (ra["trigger"] == "on_special"
                          and used_recharge):
                        triggered = True
                    elif ra["trigger"] == "on_move":
                        triggered = True
                    if triggered:
                        self.character.has_used_reaction = True
                        self.character.readied_action = None
                        if ra["action"] == "attack":
                            self.narrate(
                                "Your readied action triggers!")
                            primary_stat = (
                                self.character.CLASSES[
                                    self.character.char_class]
                                ["primary"])
                            ra_mod = (
                                self.character.get_modifier(
                                    primary_stat))
                            ra_roll = random.randint(1, 20)
                            if ra_roll + ra_mod >= monster['ac']:
                                ra_dmg = (
                                    self.roll_dice("1d8")
                                    + ra_mod)
                                p_type = (
                                    self.get_player_damage_type())
                                ra_final, ra_narr = (
                                    self.apply_damage_modifiers(
                                        ra_dmg, p_type, monster))
                                self.narrate(
                                    f"Your readied strike hits "
                                    f"for {ra_final} damage!")
                                if ra_narr:
                                    self.narrate(ra_narr)
                                monster_hp -= ra_final
                            else:
                                self.narrate(
                                    "Your readied attack misses!")
                        elif ra["action"] == "dodge":
                            self.character.has_dodge_active = True
                            self.narrate(
                                "Your readied dodge activates! "
                                "(Attacks have Disadvantage)")

                # --- Player Reaction ---
                if (not self.character.is_incapacitated()
                        and not self.character.has_used_reaction
                        and not self.character.is_dying
                        and monster_hp > 0):
                    react = input(
                        "  Use your Reaction for a retaliatory "
                        "strike? [y/n]: ").strip().lower()
                    if react == "y":
                        self.character.has_used_reaction = True
                        r_roll = random.randint(1, 20)
                        primary_stat = self.character.CLASSES[
                            self.character.char_class]["primary"]
                        r_mod = self.character.get_modifier(
                            primary_stat)
                        if r_roll + r_mod >= monster['ac']:
                            r_damage = (self.roll_dice("1d6")
                                        + r_mod)
                            self.narrate(
                                f"⚡ Your reaction strikes true "
                                f"for {r_damage} damage!")
                            monster_hp -= r_damage
                        else:
                            self.narrate(
                                "Your reaction attack misses!")

            # =============================================================
            #  END OF PLAYER TURN
            # =============================================================
            save_results = self.character.end_of_turn_saves()
            for cond_name, saved, rec_dmg in save_results:
                if rec_dmg > 0:
                    self.narrate(
                        f"The {cond_name} effect deals "
                        f"{rec_dmg} recurring damage!")
                    if self.character.hp <= 0:
                        status = self._handle_zero_hp()
                        if status == "dead":
                            self.narrate(
                                "You have fallen to lingering "
                                "effects!")
                            self.character.calculate_ac()
                            return "death"
                if saved:
                    self.narrate(
                        f"You shake off the {cond_name} "
                        "condition!")
                else:
                    self.narrate(
                        f"You remain {cond_name}... (save failed)")

        # =============================================================
        #  POST-COMBAT
        # =============================================================
        self.character.conditions.clear()
        self.character.calculate_ac()

        if monster_hp <= 0:
            self.narrate(
                f"🎉 Victory! The {monster['name']} is defeated!")
            xp_gained = monster['xp']
            self.character.experience += xp_gained
            self.narrate(
                f"You gain {xp_gained} XP! "
                f"(Total: {self.character.experience})")

            if (self.character.experience
                    >= self.character.level * 300):
                self.level_up()

            return True
        return False
    
    def level_up(self):
        self.character.level += 1
        # --- Multiclass Choice ---
        print("\n  LEVEL UP! Choose a class to advance:")
        available = list(Character.CLASSES.keys())
        for i, cls in enumerate(available, 1):
            info = Character.CLASSES[cls]
            current = self.character.class_levels.get(cls, 0)
            tag = f" (current: {current})" if current > 0 else ""
            print(f"    [{i}] {cls} (d{info['hit_die']}){tag}")
        print(f"    [0] Stay {self.character.char_class}")
        choice = input("  Choose: ").strip()
        if choice == "0" or not choice:
            chosen_class = self.character.char_class
        else:
            try:
                chosen_class = available[int(choice) - 1]
            except (ValueError, IndexError):
                chosen_class = self.character.char_class
        self.character.class_levels[chosen_class] = (
            self.character.class_levels.get(chosen_class, 0) + 1)
        hit_die = Character.CLASSES[chosen_class]["hit_die"]
        hp_gain = (random.randint(1, hit_die)
                   + self.character.get_modifier("con"))
        hp_gain = max(1, hp_gain)
        self.character.max_hp += hp_gain
        self.character.hp = self.character.max_hp
        # Update primary class if new class has more levels
        if (self.character.class_levels.get(chosen_class, 0)
                > self.character.class_levels.get(
                    self.character.char_class, 0)):
            self.character.char_class = chosen_class
        # Warlock pact magic
        if chosen_class == "Warlock":
            wlvl = self.character.class_levels.get("Warlock", 1)
            slots, _ = Character.PACT_MAGIC_SLOTS.get(
                wlvl, (1, 1))
            self.character.pact_slots = slots
            self.character.pact_slots_max = slots
        mc_str = ", ".join(
            f"{c} {l}"
            for c, l in self.character.class_levels.items())
        self.narrate(f"LEVEL UP! You are now level {self.character.level}!")
        self.narrate(f"Class: {mc_str}")
        self.narrate(f"HP +{hp_gain} (Max: {self.character.max_hp})")
        cl = self.character.caster_level
        if cl > 0:
            slots = self.character.available_spell_slots()
            slot_str = "/".join(str(s) for s in slots)
            self.narrate(f"Caster Level: {cl} | Spell Slots: {slot_str}")

    # =================================================================
    #  BOSS COMBAT — Legendary Actions, Resistances, Phases,
    #  Minions, and Secondary Objectives
    # =================================================================

    def boss_combat(self, encounter):
        """Full boss encounter loop with 5e boss mechanics."""
        boss = dict(encounter["boss"])
        boss_hp = boss["hp"]
        boss_max_hp = boss_hp
        boss_name = boss["name"]
        monster_dex = boss.get("dex", 10)
        monster_str = boss.get("str", 10)
        monster_dex_mod = (monster_dex - 10) // 2

        # Legendary mechanics
        la_max = encounter.get("legendary_actions", 0)
        lr_remaining = encounter.get("legendary_resistances", 0)
        phases_triggered = set()
        monster_conditions = set()

        # Minions & objective
        live_minions = []
        obj = encounter.get("secondary_objective")
        objective = dict(obj) if obj else None
        objective_destroyed = False
        reinforcements_stopped = False

        # --- Local helper: unified death check for boss fights ---
        def _boss_death_check(context_msg):
            """Handle 0-HP in boss fight with Last Stand + Fail-Forward.
            Returns: 'ok' | 'last_stand' | 'rescued' | 'death'."""
            if self.character.hp > 0:
                return "ok"
            if self.character.last_stand_active:
                # Already in Last Stand; just run normal 0-HP
                status = self._handle_zero_hp()
                if status == "dead":
                    return "death"
                return "ok"
            status = self._handle_zero_hp()
            if status == "dead":
                # Offer fail-forward before true death
                ff = self._boss_fail_forward(
                    boss_name, encounter)
                return ff  # 'rescued' or 'death'
            if status == "dying":
                # Offer Last Stand
                accepted = self._offer_last_stand(boss_name)
                if accepted:
                    return "last_stand"
                # Normal dying -- death saves continue
                return "ok"
            return "ok"

        # ─── DRAMATIC INTRO ───
        print(f"\n{'='*55}")
        print(f"  *** BOSS ENCOUNTER ***")
        for line in encounter.get("intro", []):
            self.narrate(line)
        print(f"{'='*55}\n")

        self.narrate(
            f"THE {boss_name.upper()} | HP: {boss_hp}/{boss_max_hp} "
            f"| AC: {boss['ac']}")
        if objective:
            self.narrate(
                f"SECONDARY OBJECTIVE: {objective['name']}")
            self.narrate(f"  {objective['desc']}")

        live_minions = self._spawn_minions(encounter, live_minions)

        # --- Environment setup (reuse existing systems) ---
        cover_bonus = self.get_cover_modifier()
        self.narrate(self.describe_cover(cover_bonus))
        self.character.calculate_ac(cover_bonus)

        light = self.get_light_level()
        self.narrate(self.LIGHT_DESCRIPTIONS.get(light, ""))
        light_player_disadv, light_monster_adv = (
            self.light_attack_modifier())

        eff_move = self.effective_movement()
        if eff_move < self.movement_budget:
            self.narrate(
                f"Treacherous ground -- movement halved to "
                f"{eff_move} ft.")

        battlefield = self.generate_battlefield()
        self.describe_battlefield(battlefield)
        battlefield_effects = set()

        # --- Favor: Blessing of Advantage ---
        favor_adv_active = False
        if self.character.favor_advantage_encounters > 0:
            self.character.favor_advantage_encounters -= 1
            favor_adv_active = True
            remaining = self.character.favor_advantage_encounters
            self.narrate(
                f"✨ Blessing of Advantage is active this "
                f"combat! ({remaining} encounter(s) left)")

        # --- Favor: NPC Ally ---
        favor_ally_active = False
        if self.character.favor_ally_encounters > 0:
            self.character.favor_ally_encounters -= 1
            favor_ally_active = True
            remaining = self.character.favor_ally_encounters
            self.narrate(
                f"🗡️  Your NPC ally fights alongside you! "
                f"({remaining} encounter(s) left)")

        combat_round = 0
        recharge_ready = False
        help_grants_advantage = False
        social_backfire_adv = False

        while boss_hp > 0 and not self.character.is_dead:
            combat_round += 1
            la_remaining = la_max  # Reset each round

            # ═══════════════════════════════════════════════
            #  INITIATIVE 20 — Boss Lair Action (guaranteed)
            # ═══════════════════════════════════════════════
            self._boss_lair_action(encounter)
            if self.character.hp <= 0:
                dc_result = _boss_death_check(
                    "the boss's domain")
                if dc_result == "death":
                    self.character.calculate_ac()
                    return "death"
                elif dc_result == "rescued":
                    self.character.calculate_ac()
                    return False

            # ═══════════════════════════════════════════════
            #  START OF PLAYER TURN
            # ═══════════════════════════════════════════════
            self.character.start_of_turn()
            self.character.calculate_ac(cover_bonus)
            is_incap = self.character.is_incapacitated()

            # --- Soft Enrage: every 3 rounds boss fury grows ---
            if combat_round > 1 and (combat_round - 1) % 3 == 0:
                enrage_stacks += 1
                if enrage_stacks == 1:
                    self.narrate(
                        f"The {boss_name}'s attacks grow "
                        "more ferocious -- it is tiring of "
                        "this fight!")
                elif enrage_stacks == 2:
                    self.narrate(
                        f"The {boss_name} ROARS with "
                        "mounting fury! Its blows land "
                        "harder.")
                elif enrage_stacks == 3:
                    self.narrate(
                        f"The {boss_name}'s eyes burn "
                        "with rage -- every strike is "
                        "devastating!")
                else:
                    self.narrate(
                        f"ENRAGED! The {boss_name} is "
                        "utterly berserk -- each hit could "
                        "be your last!")
                print(f"  [ENRAGE x{enrage_stacks}: "
                      f"+{enrage_stacks * 2} boss damage]")

            # --- Status display ---
            print(f"\n{'='*50}")
            print(f"  --- BOSS FIGHT | Round {combat_round} ---")
            self.narrate(self.describe_health(
                self.character.hp, self.character.max_hp,
                self.character.name))
            self.narrate(self.describe_health(
                boss_hp, boss_max_hp, f"The {boss_name}"))

            if live_minions:
                for m in live_minions:
                    print(f"    [{m['name']} {m['label']}: "
                          f"{m['hp']}/{m['max_hp']} HP]")
            if objective and not objective_destroyed:
                print(f"    [OBJECTIVE: {objective['name']} "
                      f"-- {objective['hp']} HP]")

            conds = self.character.active_conditions_str()
            m_cond_str = (", ".join(sorted(monster_conditions))
                          if monster_conditions else "None")
            pp = self.character.passive_perception()
            print(f"  [AC: {self.character.ac}]  "
                  f"[Move: {eff_move} ft]  [PP: {pp}]")
            print(f"  [Conditions: {conds}]  "
                  f"[Boss: {m_cond_str}]")
            print(f"  [Legendary Actions: {la_remaining}/{la_max}]"
                  f"  [Legendary Resist: {lr_remaining}]")
            if enrage_stacks > 0:
                print(f"  [ENRAGE x{enrage_stacks}: "
                      f"+{enrage_stacks * 2} boss dmg]")
            if self.character.last_stand_active:
                ls_r = self.character.last_stand_rounds
                print(f"  [!! LAST STAND: {ls_r} rounds "
                      "remaining !!]")

            # --- Death saves / incapacitation ---
            prompt_action = True
            action = "_skip"

            if self.character.is_dying or self.character.is_stable:
                prompt_action = False
                if self.character.is_stable:
                    self.narrate(
                        "Unconscious but stable. Skipping...")
                else:
                    self.narrate(
                        f"DEATH SAVES: "
                        f"S {self.character.death_saves['successes']}/3"
                        f" | F {self.character.death_saves['failures']}/3")
                    ds_result, ds_roll = (
                        self.character.death_saving_throw())
                    if ds_result == "alive":
                        self.narrate(
                            "NATURAL 20! You surge back "
                            "with 1 HP!")
                        prompt_action = True
                        is_incap = False
                    elif ds_result == "dead":
                        self.narrate(
                            "Three failures. "
                            "Your journey ends here.")
                        self.character.calculate_ac()
                        return "death"
                    elif ds_result == "stable":
                        self.narrate(
                            f"Death save ({ds_roll}): "
                            "Success! You stabilize.")
                    else:
                        sorf = ("Success" if ds_roll >= 10
                                else "Failure")
                        self.narrate(
                            f"Death save ({ds_roll}): {sorf}!")
            elif is_incap:
                self.narrate(
                    "Incapacitated! No actions this turn.")
                prompt_action = False

            # ═══════════════════════════════════════════════
            #  PLAYER ACTION MENU
            # ═══════════════════════════════════════════════
            if prompt_action:
                print("  Actions:")
                print("    [1] Attack Boss       "
                      "[5] Disengage")
                print("    [2] Dodge (+Disadv)    "
                      "[6] Help (Advantage)")
                print("    [3] Flee              "
                      "[7] Cast Spell")
                print("    [4] Object Interact   "
                      "[8] Shove Boss")
                print("    [9] Persuade/Intimidate  "
                      "[10] Ready Action")
                if live_minions:
                    print("    [11] Attack Minion")
                if objective and not objective_destroyed:
                    print("    [12] Attack Objective")
                if (self.character.last_stand_active
                        and objective
                        and not objective_destroyed):
                    print("    [13] HEROIC SACRIFICE "
                          "(destroy objective, die a hero)")
                action = input("  Choose action: ").strip()

            # === FREE OBJECT INTERACTION ===
            if action == "4":
                if self.character.has_used_object_interaction:
                    self.narrate(
                        "Already used Object Interaction!")
                else:
                    self.character.has_used_object_interaction = True
                    usable = [i for i in self.character.inventory
                              if "Potion" in i]
                    if usable:
                        self.narrate(
                            f"You grab a {usable[0]}. "
                            "(Still need Use Item to drink.)")
                    else:
                        self.narrate(
                            "You adjust your grip. "
                            "(Free interaction used)")
                continue

            # === ATTACK BOSS ===
            if action == "1":
                primary_stat = self.character.CLASSES[
                    self.character.char_class]["primary"]
                attack_mod = self.character.get_modifier(
                    primary_stat)

                flanking = self.check_flanking(battlefield)
                hg_bonus = (
                    self.check_high_ground(battlefield)
                    if self.is_player_ranged() else 0)

                # Last Stand: forced Advantage
                ls_adv = self.character.last_stand_active
                player_adv = (help_grants_advantage
                              or "Prone" in monster_conditions
                              or flanking
                              or ls_adv
                              or favor_adv_active)
                player_disadv = (
                    self.character.attack_has_disadvantage()
                    or light_player_disadv)
                # Last Stand: ignore Fear/Charm disadvantage
                if ls_adv:
                    player_disadv = False
                help_grants_advantage = False

                attack_roll, roll_type = self.combat_roll(
                    has_advantage=player_adv,
                    has_disadvantage=player_disadv)
                if roll_type != "Straight":
                    self.narrate(f"(Rolling with {roll_type})")
                total_attack = (attack_roll + attack_mod
                                + hg_bonus)

                p_dmg_type = self.get_player_damage_type()

                # Last Stand: extra damage die
                ls_bonus = (self.roll_dice("1d6")
                            if self.character.last_stand_active
                            else 0)

                if attack_roll == 20:
                    raw = (self.roll_dice("2d6") + attack_mod
                           + ls_bonus)
                    final, mod_narr = (
                        self.apply_damage_modifiers(
                            raw, p_dmg_type, boss))
                    self.narrate(
                        f"CRITICAL HIT! "
                        f"{self.describe_nat20_hit()} "
                        f"({final} {p_dmg_type} damage!)")
                    if mod_narr:
                        self.narrate(mod_narr)
                    boss_hp -= final
                elif attack_roll == 1:
                    self.narrate(
                        f"NATURAL 1! "
                        f"{self.describe_nat1_miss()}")
                elif total_attack >= boss['ac']:
                    raw = (self.roll_dice("1d8") + attack_mod
                           + ls_bonus)
                    final, mod_narr = (
                        self.apply_damage_modifiers(
                            raw, p_dmg_type, boss))
                    hit_msg = "Hit!"
                    if ls_bonus > 0:
                        hit_msg = (
                            "LAST STAND FURY! ")
                    self.narrate(
                        f"{hit_msg} ({attack_roll}+"
                        f"{attack_mod}"
                        f"={total_attack} vs AC "
                        f"{boss['ac']}) "
                        f"-- {final} {p_dmg_type} damage")
                    if mod_narr:
                        self.narrate(mod_narr)
                    boss_hp -= final
                else:
                    miss_text = self.describe_miss(
                        total_attack, boss['ac'],
                        monster_dex_mod)
                    self.narrate(
                        f"Miss! ({attack_roll}+{attack_mod}"
                        f"={total_attack} vs AC {boss['ac']}) "
                        f"-- {miss_text}")

            # === DODGE ===
            elif action == "2":
                self.character.has_dodge_active = True
                self.narrate(
                    "You focus on evasion. Attacks against you "
                    "have Disadvantage this round.")

            # === FLEE ===
            elif action == "3":
                flee_dc = 16  # Harder to flee a boss!
                if self.skill_check("dex", flee_dc):
                    self.narrate(
                        "Against all odds, you escape the "
                        f"{boss_name}'s lair!")
                    self.character.conditions.clear()
                    self.character.calculate_ac()
                    return False
                else:
                    self.narrate(
                        f"The {boss_name} blocks your escape!")

            # === DISENGAGE ===
            elif action == "5":
                self.character.is_disengaging = True
                self.narrate(
                    "You disengage -- no Opportunity Attacks.")

            # === HELP ===
            elif action == "6":
                help_grants_advantage = True
                self.narrate(
                    f"You study the {boss_name}'s patterns. "
                    "Next Attack has Advantage!")

            # === CAST SPELL ===
            elif action == "7":
                spell_list = list(self.SPELLS.items())
                print("  Available spells:")
                for i, (sn, sd) in enumerate(spell_list, 1):
                    comp = sd["components"]
                    slvl = ("Cantrip" if sd["level"] == 0
                            else f"Level {sd['level']}")
                    sact = sd["action"].title()
                    print(f"    [{i}] {sn} ({slvl}, {sact}) "
                          f"[{comp}] -- {sd['desc']}")
                print("    [0] Cancel")
                spell_choice = input(
                    "  Choose spell: ").strip()
                if spell_choice == "0":
                    continue
                try:
                    spell_idx = int(spell_choice) - 1
                    spell_name, spell = spell_list[spell_idx]
                except (ValueError, IndexError):
                    self.narrate("Invalid spell choice.")
                    continue

                is_bonus_spell = spell["action"] == "bonus"
                if is_bonus_spell:
                    if self.character.has_used_bonus_action:
                        self.narrate(
                            "Already used Bonus Action!")
                        continue
                else:
                    if not (self.character
                            .can_cast_leveled_action_spell()):
                        self.narrate(
                            "Only cantrips allowed as "
                            "Action this turn!")
                        continue

                can_cast, reason = (
                    self.character.can_cast_spell(
                        spell["components"]))
                if not can_cast:
                    self.narrate(reason)
                    continue

                # --- Material component cost (M) ---
                m_ok, m_cost, m_reason = (
                    self._material_component_cost(spell))
                if not m_ok:
                    self.narrate(m_reason)
                    continue
                if m_cost > 0:
                    self.character.gold -= m_cost
                    self.narrate(
                        f"(Material components consumed: "
                        f"{m_cost} gold)")

                comp_tag = f"[{spell['components']}]"

                if spell["type"] == "healing":
                    heal_expr = spell.get("heal", "1d4")
                    base_heal = self.roll_dice(
                        heal_expr.split("+")[0])
                    bonus = (int(heal_expr.split("+")[1])
                             if "+" in heal_expr else 0)
                    total_heal = base_heal + bonus
                    self.character.heal(total_heal)
                    self.narrate(
                        f"You cast {spell_name}! {comp_tag} "
                        f"-- healed {total_heal} HP!")
                else:
                    # Grease special
                    if spell.get("special") == "grease":
                        battlefield_effects.add("grease")
                        save_roll = (random.randint(1, 20)
                                     + monster_dex_mod)
                        if save_roll < 12:
                            # Check LR before applying
                            auto, lr_remaining, lr_cost = (
                                self._legendary_resistance(
                                    boss, "Prone",
                                    lr_remaining, boss_hp))
                            boss_hp -= lr_cost
                            if not auto:
                                monster_conditions.add("Prone")
                                self.narrate(
                                    f"The {boss_name} slips "
                                    "and falls Prone!")
                        else:
                            self.narrate(
                                f"The {boss_name} keeps its "
                                "footing!")
                    else:
                        raw_dmg = self.roll_dice(
                            spell["damage"])
                        final_dmg, mod_narr = (
                            self.apply_damage_modifiers(
                                raw_dmg, spell["type"],
                                boss))
                        self.narrate(
                            f"{spell_name}! {comp_tag} "
                            f"({final_dmg} {spell['type']} "
                            "damage)")
                        if mod_narr:
                            self.narrate(mod_narr)
                        boss_hp -= final_dmg

                        # Spell condition (e.g. Stunned)
                        spell_cond = spell.get("condition")
                        if spell_cond:
                            auto, lr_remaining, lr_cost = (
                                self._legendary_resistance(
                                    boss, spell_cond,
                                    lr_remaining, boss_hp))
                            boss_hp -= lr_cost
                            if not auto:
                                self.character.add_condition(
                                    spell_cond,
                                    duration=2)

                    # Environmental synergy
                    synergy = self.check_env_synergy(
                        spell, battlefield_effects)
                    if synergy:
                        s_dmg, s_type, s_narr = synergy
                        self.narrate(
                            f"ENVIRONMENTAL COMBO! {s_narr}")
                        s_final, s_mod = (
                            self.apply_damage_modifiers(
                                s_dmg, s_type, boss))
                        self.narrate(
                            f"Bonus {s_final} {s_type} damage!")
                        if s_mod:
                            self.narrate(s_mod)
                        boss_hp -= s_final

                if is_bonus_spell:
                    self.character.has_used_bonus_action = True
                    if spell["level"] > 0:
                        self.character.bonus_action_spell_this_turn = True

            # === SHOVE ===
            elif action == "8":
                self.narrate(
                    f"You attempt to shove the {boss_name}!")
                if self.character.shove_contest(
                        monster_dex, monster_str):
                    auto, lr_remaining, lr_cost = (
                        self._legendary_resistance(
                            boss, "Prone", lr_remaining,
                            boss_hp))
                    boss_hp -= lr_cost
                    if not auto:
                        monster_conditions.add("Prone")
                        self.narrate(
                            f"The {boss_name} is Prone!")
                else:
                    self.narrate("Shove failed!")

            # === PERSUADE / INTIMIDATE ===
            elif action == "9":
                self.narrate(
                    f"The {boss_name} is beyond negotiation "
                    "-- bosses do not surrender!")

            # === READY ACTION ===
            elif action == "10":
                print("  Ready a trigger:")
                print("    [1] When boss moves (attack)")
                print("    [2] When boss attacks (dodge)")
                print("    [3] When boss uses special (attack)")
                rc = input("  Choose trigger: ").strip()
                triggers = {"1": "on_move", "2": "on_attack",
                            "3": "on_special"}
                actions = {"1": "attack", "2": "dodge",
                           "3": "attack"}
                if rc in triggers:
                    self.character.readied_action = {
                        "trigger": triggers[rc],
                        "action": actions[rc],
                    }
                    self.narrate(
                        "You hold your action, watching "
                        "for an opening...")
                else:
                    self.narrate("Invalid trigger.")

            # === ATTACK MINION ===
            elif action == "11" and live_minions:
                live_minions, _ = (
                    self._player_attacks_minion(live_minions))

            # === ATTACK OBJECTIVE ===
            elif (action == "12" and objective
                  and not objective_destroyed):
                objective, destroyed = (
                    self._player_attacks_objective(objective))
                if destroyed:
                    objective_destroyed = True
                    eff = objective.get("effect")
                    if eff == "vulnerability":
                        extra_v = objective.get(
                            "effect_data", {}).get(
                            "vulnerabilities", [])
                        boss["vulnerabilities"] = (
                            boss.get("vulnerabilities", [])
                            + extra_v)
                    elif eff == "stop_reinforcements":
                        reinforcements_stopped = True
                    elif eff == "reduce_legendary":
                        data = objective.get(
                            "effect_data", {})
                        lr_remaining = max(
                            0,
                            lr_remaining
                            - data.get("reduce_lr", 0))
                        la_max = max(
                            0,
                            la_max
                            - data.get("reduce_la", 0))
                        self.narrate(
                            f"Legendary Actions now: "
                            f"{la_max} | Resistances: "
                            f"{lr_remaining}")

            # === HEROIC SACRIFICE (Last Stand only) ===
            elif (action == "13"
                  and self.character.last_stand_active
                  and objective
                  and not objective_destroyed):
                objective, destroyed, hero_died = (
                    self._heroic_sacrifice_objective(
                        objective, boss_name))
                if destroyed:
                    objective_destroyed = True
                    # Apply objective effect
                    eff = objective.get("effect")
                    if eff == "vulnerability":
                        extra_v = objective.get(
                            "effect_data", {}).get(
                            "vulnerabilities", [])
                        boss["vulnerabilities"] = (
                            boss.get("vulnerabilities", [])
                            + extra_v)
                    elif eff == "stop_reinforcements":
                        reinforcements_stopped = True
                    elif eff == "reduce_legendary":
                        data = objective.get(
                            "effect_data", {})
                        lr_remaining = max(
                            0,
                            lr_remaining
                            - data.get("reduce_lr", 0))
                        la_max = max(
                            0,
                            la_max
                            - data.get("reduce_la", 0))
                if hero_died:
                    self.character.calculate_ac()
                    return "heroic_death"

            # ═══════════════════════════════════════════════
            #  LEGENDARY ACTIONS (after player turn)
            # ═══════════════════════════════════════════════
            if boss_hp > 0:
                la_remaining, la_dmg = (
                    self._resolve_legendary_actions(
                        encounter, boss, boss_hp,
                        la_remaining, monster_conditions))
                if self.character.hp <= 0:
                    dc_result = _boss_death_check(
                        "a legendary action")
                    if dc_result == "death":
                        self.character.calculate_ac()
                        return "death"
                    elif dc_result == "rescued":
                        self.character.calculate_ac()
                        return False

            # ═══════════════════════════════════════════════
            #  PHASE TRANSITION CHECK
            # ═══════════════════════════════════════════════
            if boss_hp > 0:
                boss, phases_triggered = (
                    self._check_phase_transition(
                        encounter, boss, boss_hp,
                        boss_max_hp, phases_triggered))
                # Refresh combat stats after phase change
                monster_dex = boss.get("dex", 10)
                monster_str = boss.get("str", 10)
                monster_dex_mod = (monster_dex - 10) // 2

            # ═══════════════════════════════════════════════
            #  MINION TURNS
            # ═══════════════════════════════════════════════
            if live_minions:
                live_minions, min_dmg = (
                    self._resolve_minion_turns(live_minions))
                # Remove dead minions
                live_minions = [
                    m for m in live_minions if m["hp"] > 0]
                if self.character.hp <= 0:
                    dc_result = _boss_death_check(
                        "the minion swarm")
                    if dc_result == "death":
                        self.character.calculate_ac()
                        return "death"
                    elif dc_result == "rescued":
                        self.character.calculate_ac()
                        return False

            # Minion reinforcements
            reinf_round = encounter.get(
                "minion_reinforcement_round", 99)
            if (combat_round % reinf_round == 0
                    and not reinforcements_stopped
                    and boss_hp > 0):
                self.narrate(
                    "Reinforcements arrive!")
                live_minions = self._spawn_minions(
                    encounter, live_minions)

            # ═══════════════════════════════════════════════
            #  NPC ALLY BONUS ATTACK (favor)
            # ═══════════════════════════════════════════════
            if favor_ally_active and boss_hp > 0:
                ally_dmg = self.roll_dice("1d6")
                boss_hp -= ally_dmg
                self.narrate(
                    f"\U0001f5e1\ufe0f  Your ally strikes the "
                    f"{boss_name} for {ally_dmg} damage!")
                if boss_hp <= 0:
                    boss_hp = 0

            # ═══════════════════════════════════════════════
            #  BOSS'S TURN
            # ═══════════════════════════════════════════════
            if boss_hp > 0:
                boss['_used_reaction'] = False

                # Standing up from Prone
                BOSS_INCAP = {"Stunned", "Paralyzed",
                              "Unconscious"}
                if "Prone" in monster_conditions:
                    if monster_conditions & BOSS_INCAP:
                        self.narrate(
                            f"The {boss_name} is "
                            f"{', '.join(monster_conditions & BOSS_INCAP)}"
                            " and cannot stand!")
                    else:
                        monster_conditions.discard("Prone")
                        self.narrate(
                            f"The {boss_name} rises "
                            "(half movement spent).")

                monster_attack_disadv = (
                    "Prone" in monster_conditions)

                # Banter
                self.combat_banter(
                    boss, boss_hp, boss_max_hp)

                # Recharge ability
                ability = boss.get("recharge_ability")
                used_recharge = False
                if recharge_ready and ability:
                    recharge_ready = False
                    rc_dmg = (self.roll_dice(ability["damage"])
                              + enrage_stacks * 2)
                    self.narrate(
                        f"The {boss_name} unleashes "
                        f"{ability['name']}! "
                        f"({rc_dmg} damage)")
                    alive = self.character.take_damage(rc_dmg)
                    rc_cond = ability.get("condition")
                    if rc_cond:
                        rc_ss = ability.get(
                            "save_stat", "con")
                        rc_dc = ability.get("save_dc", 12)
                        roll = random.randint(1, 20)
                        mod = self.character.get_modifier(
                            rc_ss)
                        if (self.character
                                .auto_fail_str_dex_saves()
                                and rc_ss in ("str", "dex")):
                            save_ok = False
                        else:
                            save_ok = (roll + mod) >= rc_dc
                        if not save_ok:
                            self.character.add_condition(
                                rc_cond, save_stat=rc_ss,
                                save_dc=rc_dc, duration=2)
                            self.narrate(
                                f"You are now {rc_cond}!")
                        else:
                            self.narrate(
                                f"You resist! ({rc_ss.upper()}"
                                f" save: {roll}+{mod} vs "
                                f"DC {rc_dc})")
                    if not alive:
                        dc_result = _boss_death_check(
                            "the boss's special attack")
                        if dc_result == "death":
                            self.character.calculate_ac()
                            return "death"
                        elif dc_result == "rescued":
                            self.character.calculate_ac()
                            return False
                    used_recharge = True
                elif ability and self.should_recharge(ability):
                    recharge_ready = True
                    self.telegraph_attack(boss)

                # Normal attack
                if not used_recharge:
                    m_adv = (
                        light_monster_adv
                        or self.character
                            .attacks_against_have_advantage()
                        or social_backfire_adv)
                    social_backfire_adv = False
                    m_disadv = (
                        self.character.has_dodge_active
                        or monster_attack_disadv)
                    if self.character.is_incapacitated():
                        m_disadv = False

                    m_roll, m_type = self.combat_roll(
                        has_advantage=m_adv,
                        has_disadvantage=m_disadv)
                    if m_type != "Straight":
                        self.narrate(
                            f"(The {boss_name} rolls "
                            f"with {m_type})")

                    player_dex_mod = (
                        self.character
                            .get_dex_ac_component())
                    is_auto_crit = (
                        self.character.auto_crit_if_hit()
                        and m_roll >= self.character.ac)
                    m_dmg_type = boss.get(
                        "damage_type", "bludgeoning")
                    player_profile = (
                        self.character.damage_profile())

                    if m_roll >= self.character.ac:
                        enrage_bonus = enrage_stacks * 2
                        if is_auto_crit or m_roll == 20:
                            raw = (self.roll_dice(
                                boss['damage']) * 2
                                + enrage_bonus)
                            crit_label = (
                                "AUTO-CRIT"
                                if is_auto_crit
                                else "CRITICAL HIT")
                            final, mod_narr = (
                                self.apply_damage_modifiers(
                                    raw, m_dmg_type,
                                    player_profile))
                            self.narrate(
                                f"{crit_label}! The "
                                f"{boss_name} devastates "
                                f"you for {final} "
                                f"{m_dmg_type} damage!")
                            if mod_narr:
                                self.narrate(mod_narr)
                            damage = final
                        else:
                            raw = (self.roll_dice(
                                boss['damage'])
                                + enrage_bonus)
                            final, mod_narr = (
                                self.apply_damage_modifiers(
                                    raw, m_dmg_type,
                                    player_profile))
                            self.narrate(
                                f"The {boss_name} hits for "
                                f"{final} {m_dmg_type} dmg!")
                            if mod_narr:
                                self.narrate(mod_narr)
                            damage = final

                        alive = self.character.take_damage(
                            damage)
                        if self.character.is_concentrating:
                            kept = (
                                self.character
                                    .concentration_check(
                                        damage))
                            if not kept:
                                self.narrate(
                                    "Concentration "
                                    "shatters!")
                        if not alive:
                            dc_result = _boss_death_check(
                                "the boss's attack")
                            if dc_result == "death":
                                self.character.calculate_ac()
                                return "death"
                            elif dc_result == "rescued":
                                self.character.calculate_ac()
                                return False
                    else:
                        if m_roll == 1:
                            self.narrate(
                                f"The {boss_name} rolls "
                                "a Natural 1! "
                                f"{self.describe_monster_nat1()}")
                        else:
                            miss_text = self.describe_miss(
                                m_roll,
                                self.character.ac,
                                player_dex_mod)
                            self.narrate(
                                f"The {boss_name} attacks "
                                f"-- {miss_text}")

                # --- Readied Action Trigger ---
                if (self.character.readied_action
                        and not self.character.has_used_reaction
                        and not self.character.is_dying):
                    ra = self.character.readied_action
                    triggered = False
                    if (ra["trigger"] == "on_attack"
                            and not used_recharge):
                        triggered = True
                    elif (ra["trigger"] == "on_special"
                          and used_recharge):
                        triggered = True
                    elif ra["trigger"] == "on_move":
                        triggered = True
                    if triggered:
                        self.character.has_used_reaction = True
                        self.character.readied_action = None
                        if ra["action"] == "attack":
                            self.narrate(
                                "Readied action triggers!")
                            ps = self.character.CLASSES[
                                self.character.char_class][
                                "primary"]
                            ra_mod = (
                                self.character.get_modifier(
                                    ps))
                            ra_roll = random.randint(1, 20)
                            if (ra_roll + ra_mod
                                    >= boss['ac']):
                                ra_dmg = (
                                    self.roll_dice("1d8")
                                    + ra_mod)
                                p_type = (
                                    self
                                    .get_player_damage_type())
                                ra_f, ra_n = (
                                    self
                                    .apply_damage_modifiers(
                                        ra_dmg, p_type,
                                        boss))
                                self.narrate(
                                    f"Readied strike for "
                                    f"{ra_f} damage!")
                                if ra_n:
                                    self.narrate(ra_n)
                                boss_hp -= ra_f
                            else:
                                self.narrate(
                                    "Readied attack misses!")
                        elif ra["action"] == "dodge":
                            self.character.has_dodge_active = True
                            self.narrate(
                                "Readied dodge activates!")

                # --- Player Reaction ---
                if (not self.character.is_incapacitated()
                        and not self.character.has_used_reaction
                        and not self.character.is_dying
                        and boss_hp > 0):
                    react = input(
                        "  Reaction: retaliatory strike? "
                        "[y/n]: ").strip().lower()
                    if react == "y":
                        self.character.has_used_reaction = True
                        r_roll = random.randint(1, 20)
                        ps = self.character.CLASSES[
                            self.character.char_class][
                            "primary"]
                        r_mod = self.character.get_modifier(
                            ps)
                        if r_roll + r_mod >= boss['ac']:
                            r_dmg = (self.roll_dice("1d6")
                                     + r_mod)
                            p_type = (
                                self.get_player_damage_type())
                            r_f, r_n = (
                                self.apply_damage_modifiers(
                                    r_dmg, p_type, boss))
                            self.narrate(
                                f"Your reaction strikes "
                                f"for {r_f} damage!")
                            if r_n:
                                self.narrate(r_n)
                            boss_hp -= r_f
                        else:
                            self.narrate(
                                "Reaction attack misses!")

            # ═══════════════════════════════════════════════
            #  END OF PLAYER TURN
            # ═══════════════════════════════════════════════
            save_results = self.character.end_of_turn_saves()
            for cond_name, saved, rec_dmg in save_results:
                if rec_dmg > 0:
                    self.narrate(
                        f"{cond_name} deals {rec_dmg} "
                        "recurring damage!")
                    if self.character.hp <= 0:
                        dc_result = _boss_death_check(
                            "lingering effects")
                        if dc_result == "death":
                            self.character.calculate_ac()
                            return "death"
                        elif dc_result == "rescued":
                            self.character.calculate_ac()
                            return False
                if saved:
                    self.narrate(
                        f"You shake off {cond_name}!")
                else:
                    self.narrate(
                        f"Still {cond_name}... "
                        "(save failed)")

            # ═══════════════════════════════════════════════
            #  LAST STAND TICK (end of round countdown)
            # ═══════════════════════════════════════════════
            if self.character.last_stand_active:
                ls_status = self._tick_last_stand()
                if ls_status == "collapse":
                    result = self._resolve_last_stand_collapse(
                        boss_name, boss_hp, boss_max_hp)
                    self.character.calculate_ac()
                    return result  # 'heroic_death'

        # ═══════════════════════════════════════════════
        #  BOSS DEFEATED — POST-COMBAT
        # ═══════════════════════════════════════════════
        self.character.conditions.clear()
        self.character.calculate_ac()

        if boss_hp <= 0:
            # --- Clean up Last Stand if still active ---
            if self.character.last_stand_active:
                self.character.last_stand_active = False
                self.character.hp = max(1, self.character.hp)
                self.narrate(
                    "The adrenaline fades, but the boss falls "
                    "first. Against all odds, you survive!")

            print(f"\n{'='*55}")
            self.narrate(
                f"The {boss_name} lets out a final, "
                "terrible cry...")
            self.narrate(
                f"VICTORY! The {boss_name} is DEFEATED!")
            print(f"{'='*55}\n")

            xp_gained = boss['xp']

            # --- Objective bonus (significant to reward the
            #     "wasted" damage that went to the objective) ---
            if objective_destroyed:
                # 50% bonus XP + guaranteed rare item
                bonus = xp_gained // 2
                xp_gained += bonus
                self.narrate(
                    f"TACTICAL BONUS: +{bonus} XP for "
                    "completing the objective!")
                # Rare item reward
                rare_items = [
                    "Ring of Protection (+1 AC)",
                    "Cloak of Resistance (adv. on one save)",
                    "Boots of Speed (+10 movement)",
                    "Amulet of Health (+2 max HP)",
                ]
                rare = random.choice(rare_items)
                self.character.inventory.append(rare)
                self.narrate(
                    f"Among the wreckage of the "
                    f"{objective['name']}, you discover "
                    f"a {rare}!")

            # Combat performance bonus
            speed_bonus = max(0, (10 - combat_round) * 50)
            if speed_bonus > 0:
                xp_gained += speed_bonus
                self.narrate(
                    f"Swift victory bonus: +{speed_bonus} XP!")

            # Minion bonus
            minion_bonus = combat_round * 25
            xp_gained += minion_bonus

            self.character.experience += xp_gained
            self.narrate(
                f"TOTAL XP: {xp_gained}! "
                f"(Running total: {self.character.experience})")

            # Boss treasure — Treasure Hoard roll
            self._treasure_hoard()

            # Guaranteed healing potion drop
            self.character.inventory.append("Healing Potion")
            self.narrate(
                "You find a Healing Potion among the spoils!")

            # Bonus healing potion if objective was destroyed
            if objective_destroyed:
                self.character.inventory.append(
                    "Greater Healing Potion")
                self.narrate(
                    "You also find a Greater Healing Potion!")

            if (self.character.experience
                    >= self.character.level * 300):
                self.level_up()

            return True
        return False

    # =================================================================
    #  ECONOMY & LIFESTYLE SYSTEM
    # =================================================================

    def _update_lifestyle(self):
        """Set the character's lifestyle tier based on current gold."""
        gold = self.character.gold
        if gold >= 50:
            self.character.lifestyle = "wealthy"
        elif gold >= 20:
            self.character.lifestyle = "comfortable"
        elif gold >= 10:
            self.character.lifestyle = "modest"
        elif gold >= 3:
            self.character.lifestyle = "poor"
        else:
            self.character.lifestyle = "squalid"

    def _lifestyle_rest(self):
        """Rest at the current lifestyle tier. Town only."""
        self._update_lifestyle()
        tiers = list(self.LIFESTYLE_TIERS.keys())
        max_idx = tiers.index(self.character.lifestyle)

        print("\n  Choose your accommodations:")
        for i, tier in enumerate(tiers):
            info = self.LIFESTYLE_TIERS[tier]
            cost = info["cost"]
            tag = ""
            if i > max_idx:
                tag = " [can't afford]"
            elif tier == self.character.lifestyle:
                tag = " [best available]"
            if info.get("full_heal"):
                heal_txt = "full heal"
            elif info["heal_die"] == "0":
                heal_txt = "no healing"
            else:
                heal_txt = f"recover {info['heal_die']}"
            print(f"    [{i+1}] {tier.title():12s} "
                  f"({cost} gold) — {info['desc']} "
                  f"[{heal_txt}]{tag}")
        print(f"    [0] Cancel")

        choice = input("  Choose: ").strip()
        if choice == "0":
            return
        try:
            idx = int(choice) - 1
            tier = tiers[idx]
        except (ValueError, IndexError):
            self.narrate("Invalid choice.")
            return

        info = self.LIFESTYLE_TIERS[tier]
        if self.character.gold < info["cost"]:
            self.narrate("You can't afford that lifestyle.")
            return

        self.character.gold -= info["cost"]
        self.character.lifestyle = tier

        if info.get("full_heal"):
            self.character.hp = self.character.max_hp
            self.narrate(
                f"You rest in {info['desc']}. Fully healed!")
            if info.get("bonus_hp"):
                temp = self.roll_dice("1d6")
                self.character.hp = min(
                    self.character.max_hp + temp,
                    self.character.hp + temp)
                self.narrate(
                    f"The healer's herbs grant +{temp} "
                    "temporary vitality!")
        elif info["heal_die"] != "0":
            heal = self.roll_dice(info["heal_die"])
            self.character.heal(heal)
            self.narrate(
                f"You sleep in {info['desc']} and "
                f"recover {heal} HP.")
        else:
            self.narrate(
                f"You huddle in {info['desc']}. "
                "No healing, but you survive the night.")

        # Ambush chance
        if random.random() < info["ambush"]:
            self.narrate("Your rest is interrupted!")
            monster = random.choice(self.MONSTERS[1])
            self.combat(monster.copy())

        # Reset starvation
        self.character.days_without_food = 0

        # --- Tier-gated exhaustion removal ---
        # Standard 5e: Long Rest + food removes 1 exhaustion level.
        # We gate efficiency by lifestyle to prevent rest-spam.
        if self.character.exhaustion_level > 0:
            if tier in ("comfortable", "wealthy"):
                # Best accommodations: guaranteed reduction
                levels = 2 if tier == "wealthy" else 1
                self._reduce_exhaustion(levels)
            elif tier in ("modest", "poor"):
                # Adequate rest: removes 1 level
                self._reduce_exhaustion(1)
            else:
                # Squalid: CON save DC 12 to clear even 1 level
                con_mod = self.character.get_modifier("con")
                roll = random.randint(1, 20)
                if (roll + con_mod) >= 12:
                    self._reduce_exhaustion(1)
                    self.narrate(
                        f"Despite the rough conditions you "
                        f"manage some recovery. "
                        f"(CON save: {roll}+{con_mod} vs DC 12)")
                else:
                    self.narrate(
                        f"The squalid conditions prevent "
                        f"recovery from exhaustion. "
                        f"(CON save: {roll}+{con_mod} vs DC 12)")

    def _forage(self):
        """Attempt to forage for food in the wilderness.
        Uses Survival (WIS) check.
        If exhausted, an ally 'Help' action grants Advantage
        to break the death spiral."""
        dc = 12 + self._campaign_forage_dc_mod()
        wis_mod = self.character.get_modifier("wis")
        has_survival = "Survival" in self.character.skills
        bonus = wis_mod + (2 if has_survival else 0)

        # --- Death-Spiral Breaker ---
        # If the player is exhausted, a companion can Help
        ally_help = False
        if self.character.exhaustion_level >= 1:
            self.narrate(
                "You're exhausted... foraging will be "
                "harder (Disadvantage on ability checks).")
            print("  A companion offers to assist.")
            print("  [1] Accept help (Advantage on this check)")
            print("  [2] Go it alone (Disadvantage)")
            help_choice = input("  Choose: ").strip()
            if help_choice == "1":
                ally_help = True
                self.narrate(
                    "Your ally scouts alongside you, "
                    "pointing out edible plants and fresh "
                    "water sources.")

        # Roll with advantage/disadvantage based on exhaustion
        if ally_help:
            # Advantage (Help cancels Exhaustion disadvantage)
            roll = max(random.randint(1, 20),
                       random.randint(1, 20))
        elif self.character.exhaustion_level >= 1:
            # Disadvantage from Exhaustion Lv1+
            roll = min(random.randint(1, 20),
                       random.randint(1, 20))
        else:
            roll = random.randint(1, 20)

        self.narrate("You search the area for food and water...")
        total = roll + bonus
        if total >= dc:
            rations = 1 + (1 if total >= dc + 5 else 0)
            self.character.days_without_food = 0
            self.narrate(
                f"Foraging success! (WIS: {roll}+{bonus} vs "
                f"DC {dc}) You find enough food"
                f"{' for two days!' if rations > 1 else '.'}")
            if rations > 1:
                if "Rations (5 days)" not in self.character.inventory:
                    self.character.inventory.append(
                        "Rations (5 days)")
                    self.narrate("Extra rations saved!")
        else:
            self.character.days_without_food += 1
            self.narrate(
                f"Foraging failed. (WIS: {roll}+{bonus} vs "
                f"DC {dc}) You go hungry.")
            if self.character.days_without_food >= 3:
                # CON save to resist exhaustion
                save_dc = 10 + self.character.days_without_food
                con_mod = self.character.get_modifier("con")
                save_roll = random.randint(1, 20)
                if (save_roll + con_mod) < save_dc:
                    self._apply_exhaustion(1)
                    self.narrate(
                        f"Hunger overwhelms you! "
                        f"(CON save failed vs DC {save_dc})")
                else:
                    self.narrate(
                        f"You endure the hunger. "
                        f"(CON save: {save_roll}+{con_mod} "
                        f"vs DC {save_dc})")

    # -----------------------------------------------------------------
    #  Exhaustion System (5e-inspired 6-level scale)
    # -----------------------------------------------------------------
    EXHAUSTION_EFFECTS = {
        1: "Disadvantage on ability checks",
        2: "Speed halved",
        3: "Disadvantage on attack rolls and saving throws",
        4: "Hit point maximum halved",
        5: "Speed reduced to 0",
        6: "Death",
    }

    def _apply_exhaustion(self, levels=1):
        """Increase exhaustion by *levels*. Level 6 = death."""
        old = self.character.exhaustion_level
        self.character.exhaustion_level = min(
            6, old + levels)
        new = self.character.exhaustion_level
        for lv in range(old + 1, new + 1):
            desc = self.EXHAUSTION_EFFECTS.get(lv, "")
            self.narrate(
                f"EXHAUSTION LEVEL {lv}: {desc}")
        if new >= 6:
            self.narrate(
                "Your body gives out. Exhaustion "
                "claims your life.")
            self.character.hp = 0
            self.character.is_dead = True
        elif new >= 4:
            new_max = self.character.max_hp // 2
            if self.character.hp > new_max:
                self.character.hp = new_max
                self.narrate(
                    f"HP maximum halved to {new_max}!")
        if new >= 3:
            self.narrate(
                "You suffer Disadvantage on attacks and saves.")

    def _reduce_exhaustion(self, levels=1):
        """Reduce exhaustion (e.g. after a long rest with food)."""
        old = self.character.exhaustion_level
        if old <= 0:
            return
        self.character.exhaustion_level = max(0, old - levels)
        new = self.character.exhaustion_level
        if new < old:
            self.narrate(
                f"Exhaustion reduced to level {new}."
                + (" Fully rested!" if new == 0 else ""))

    def _check_starvation(self):
        """Called at the start of explore(). Consumes rations or
        increments hunger counter.  Uses Exhaustion levels instead
        of direct damage, with a CON save grace period."""
        if "Rations (5 days)" in self.character.inventory:
            self.character.days_without_food = 0
            return  # Rations auto-consumed (abstract)
        loc = self.current_location["type"]
        if loc == "town":
            if self.character.gold >= 1:
                self.character.gold -= 1  # Street food
                self.character.days_without_food = 0
                return
        # No food available — hunger grows
        self.character.days_without_food += 1
        days = self.character.days_without_food
        if days < 3:
            return  # Grace period: first 2 days without food are free

        # CON save to stave off exhaustion (DC 10 + days hungry)
        # Strict campaigns (Strahd, ToA) add +2 to the DC
        save_dc = 10 + days
        if self._campaign_exhaustion_strict():
            save_dc += 2
        con_mod = self.character.get_modifier("con")
        roll = random.randint(1, 20)
        total = roll + con_mod
        if total >= save_dc:
            self.narrate(
                f"You haven't eaten in {days} days, "
                f"but your constitution holds. "
                f"(CON save: {roll}+{con_mod}={total} vs "
                f"DC {save_dc})")
            return

        # Failed — gain 1 exhaustion level
        self._apply_exhaustion(1)
        self.narrate(
            f"Starvation wears you down! ({days} days "
            f"without food — CON save failed: "
            f"{roll}+{con_mod}={total} vs DC {save_dc})")

    def _armor_degradation(self):
        """After combat, armor degrades ONLY when the player took
        a critical hit or acid/fire damage during the fight."""
        armors = ["Chain Mail", "Scale Mail",
                  "Leather Armor", "Hide Armor"]
        worn = [a for a in armors if a in self.character.inventory]
        if not worn:
            return
        if not (self._combat_took_crit
                or self._combat_took_acid_fire):
            return  # No degradation this fight
        self.character.armor_condition = max(
            0.0, self.character.armor_condition - 0.1)
        cond = self.character.armor_condition
        reason = ("critical hit" if self._combat_took_crit
                  else "corrosive/fire damage")
        if cond <= 0.3:
            self.narrate(
                f"The {reason} badly damaged your armor! "
                "Visit a town to repair it or risk "
                "AC penalties.")
        elif cond <= 0.6:
            self.narrate(
                f"The {reason} leaves your armor "
                "showing wear.")
        if cond <= 0.0:
            destroyed = worn[0]
            self.character.inventory.remove(destroyed)
            self.character.armor_condition = 1.0
            self.narrate(
                f"Your {destroyed} is destroyed!")
            self.character.calculate_ac()

    def _repair_armor(self):
        """Repair armor at a town blacksmith."""
        if self.character.armor_condition >= 1.0:
            self.narrate("Your armor is in perfect condition.")
            return
        cond = self.character.armor_condition
        cost = int((1.0 - cond) * 20) + 2
        self.narrate(
            f"The blacksmith examines your armor. "
            f"Condition: {int(cond * 100)}%")
        self.narrate(f"Repair cost: {cost} gold.")
        print("  [1] Repair  [2] Decline")
        if input("  Choose: ").strip() == "1":
            if self.character.gold >= cost:
                self.character.gold -= cost
                self.character.armor_condition = 1.0
                self.narrate("Armor fully repaired!")
                self.character.calculate_ac()
            else:
                self.narrate("You can't afford the repairs.")

    def _shop(self):
        """Full shop: buy and sell items in town.
        Prices scale with campaign price multiplier."""
        if self.current_location["type"] != "town":
            self.narrate(
                "You need to be in a town to visit a shop.")
            return
        price_mult = self._campaign_price_mult()
        while True:
            print(f"\n{'='*50}")
            print(f"  SHOP  [Your Gold: {self.character.gold}]")
            if price_mult != 1.0:
                print(f"  (Local prices: x{price_mult:.1f})")
            print(f"{'='*50}")
            print("  --- BUY ---")
            for i, item in enumerate(self.SHOP_ITEMS, 1):
                actual_cost = max(1, int(
                    item["cost"] * price_mult))
                afford = ("" if self.character.gold >= actual_cost
                          else " [can't afford]")
                print(f"    [{i}] {item['name']:26s} "
                      f"{actual_cost:>3}g  "
                      f"— {item['desc']}{afford}")

            # Sell section
            sellable = []
            artifacts = []
            black_market = []
            for item in self.character.inventory:
                val = self._get_barter_value(item)
                if val == -1:
                    artifacts.append(item)
                elif val > 0:
                    sellable.append((item, val))
                elif item in self.BLACK_MARKET_ITEMS:
                    black_market.append(item)
            if sellable:
                print("  --- SELL ---")
                for j, (item, val) in enumerate(sellable, 1):
                    print(f"    [s{j}] {item:26s} "
                          f"  {val}g")
            if artifacts:
                print("  --- ARTIFACTS (Priceless) ---")
                for art in artifacts:
                    print(f"    \u2605 {art:26s}  "
                          f"  [Trade for a Major Favor]")
            if black_market:
                print("  --- SHADY BUYER LURKING... ---")
                for bm in black_market:
                    bm_info = self.BLACK_MARKET_ITEMS[bm]
                    print(f"    \u2620 {bm:26s}  "
                          f"  {bm_info['value']}g (black market)")

            print("  --- OTHER ---")
            if artifacts:
                print("    [a] Trade an Artifact for a Favor")
            if black_market:
                print("    [x] Deal with the shady buyer")
            if self.character.armor_condition < 1.0:
                print("    [r] Repair armor")
            print("    [0] Leave shop")

            choice = input("\n  Choose: ").strip().lower()
            if choice == "0":
                break
            elif choice == "r":
                self._repair_armor()
            elif choice == "a" and artifacts:
                self._trade_artifact_for_favor(artifacts)
            elif choice == "x" and black_market:
                self._sell_black_market(black_market)
            elif choice.startswith("s"):
                try:
                    idx = int(choice[1:]) - 1
                    item_name, val = sellable[idx]
                    # Block artifact sales
                    if self._is_artifact(item_name):
                        self.narrate(
                            f"The shopkeeper's eyes go wide. "
                            f"'I... I could not put a price "
                            f"on the {item_name}. You must "
                            f"find someone worthy of it.'")
                        continue
                    self.character.inventory.remove(item_name)
                    self.character.gold += val
                    self.narrate(
                        f"Sold {item_name} for {val} gold.")
                except (ValueError, IndexError):
                    self.narrate("Invalid choice.")
            else:
                try:
                    idx = int(choice) - 1
                    item = self.SHOP_ITEMS[idx]
                    actual_cost = max(1, int(
                        item["cost"] * price_mult))
                    if self.character.gold >= actual_cost:
                        self.character.gold -= actual_cost
                        self.character.inventory.append(
                            item["name"])
                        self.narrate(
                            f"Purchased {item['name']}!")
                        # Re-check AC if armor was bought
                        if item["type"] == "armor":
                            self.character.calculate_ac()
                    else:
                        self.narrate("Not enough gold.")
                except (ValueError, IndexError):
                    self.narrate("Invalid choice.")

    def _trade_artifact_for_favor(self, artifacts):
        """Trade a priceless artifact for a Major Favor.
        Artifacts are too valuable for gold — only story-changing
        trades are worthy."""
        print("\n  === ARTIFACT TRADE ===")
        print("  These relics are beyond price.")
        print("  A worthy recipient offers a Major Favor")
        print("  in exchange.\n")
        for i, art in enumerate(artifacts, 1):
            favors = self.ARTIFACT_FAVORS.get(art, [])
            if favors:
                print(f"    [{i}] {art}")
                for f_idx, favor in enumerate(favors, 1):
                    print(f"        Favor {f_idx}: {favor}")
            else:
                print(f"    [{i}] {art}")
                print(f"        A powerful NPC owes you a ")
                print(f"        debt of gratitude (DM's choice).")
        print(f"    [0] Keep your artifacts")

        choice = input("  Trade which artifact? ").strip()
        if choice == "0":
            return
        try:
            art_idx = int(choice) - 1
            artifact = artifacts[art_idx]
        except (ValueError, IndexError):
            self.narrate("Invalid choice.")
            return

        favors = self.ARTIFACT_FAVORS.get(artifact, [])
        if not favors:
            # Generic favor
            self.character.inventory.remove(artifact)
            self.narrate(
                f"You entrust the {artifact} to a worthy "
                f"guardian. In return, they pledge a "
                f"Major Favor — call on it when the need "
                f"is dire.")
            self.character.inventory.append(
                f"Major Favor (from trading {artifact})")
            return

        print(f"\n  Choose your favor for the {artifact}:")
        for f_idx, favor in enumerate(favors, 1):
            print(f"    [{f_idx}] {favor}")
        f_choice = input("  Choose: ").strip()
        try:
            f_idx = int(f_choice) - 1
            chosen_favor = favors[f_idx]
        except (ValueError, IndexError):
            self.narrate("Invalid choice.")
            return

        self.character.inventory.remove(artifact)
        self.narrate(
            f"You relinquish the {artifact}...")
        self.narrate(f"  {chosen_favor}")

        # Apply mechanical effects of the favor
        if "Resurrection" in chosen_favor:
            self.narrate(
                "A fallen ally is restored to life!")
        elif "remove all exhaustion" in chosen_favor.lower():
            self.character.exhaustion_level = 0
            self.narrate(
                "All exhaustion and curses are lifted!")
        elif "Advantage" in chosen_favor:
            self.character.favor_advantage_encounters = 3
            self.narrate(
                "A powerful blessing settles over you — "
                "Advantage on your next 3 combats!")
        elif "500 gold" in chosen_favor:
            self.character.gold += 500
            self.character.inventory.append(
                "Greater Healing Potion")
            self.character.inventory.append(
                "Greater Healing Potion")
            self.narrate(
                "A hidden cache yields its riches!")
        elif "1,000g" in chosen_favor:
            self.character.gold += 1000
            self.narrate(
                "A vast line of credit is opened to you.")
        elif "NPC ally" in chosen_favor:
            self.character.favor_ally_encounters = 3
            self.narrate(
                "A powerful companion pledges their aid "
                "for your next 3 combats!")
        elif "skip" in chosen_favor.lower():
            self.character.inventory.append(
                "Trap Bypass Token (next deadly trap)")
            self.narrate(
                "Dark forces part before you... for now.")
        elif "+1 to Intelligence" in chosen_favor:
            self.character.stats["int"] = min(
                20, self.character.stats["int"] + 1)
            self.narrate(
                f"Forbidden knowledge floods your mind! "
                f"INT is now {self.character.stats['int']}.")
        elif "spy network" in chosen_favor:
            self.character.inventory.append(
                "Spy Network Access (permanent)")
            self.narrate(
                "Eyes and ears throughout the land now "
                "serve your cause.")
        else:
            # Generic major favor token
            self.character.inventory.append(
                f"Major Favor (from trading {artifact})")

    def _sell_black_market(self, black_market_items):
        """Sell cursed or forbidden items to shady buyers.

        Features:
        - Illicit multiplier: cursed items sell for 1.5× base value.
        - Negotiation phase: Accept / Haggle (CHA) / Walk Away.
        - Critical-fail haggle triggers a guard encounter.
        - Each sale adds to the character's bounty.
        """
        print("\n  === BLACK MARKET ===")
        print("  A shadowy figure beckons from the alley...")
        if self.character.bounty > 0:
            print(f"  ⚠  Your current bounty: {self.character.bounty}g")
        print()

        for i, item in enumerate(black_market_items, 1):
            bm = self.BLACK_MARKET_ITEMS[item]
            illicit = int(bm["value"] * 1.5) if bm.get(
                "is_cursed") else bm["value"]
            print(f"    [{i}] {item}")
            print(f"        Buyer: {bm['buyer']}")
            print(f"        {bm['line']}")
            tag = " (cursed — illicit premium!)" if bm.get(
                "is_cursed") else ""
            print(f"        Offers: {illicit}g{tag}")
        print(f"    [0] Walk away")

        choice = input("  Deal? ").strip()
        if choice == "0":
            return
        try:
            idx = int(choice) - 1
            item_name = black_market_items[idx]
        except (ValueError, IndexError):
            self.narrate("Invalid choice.")
            return

        bm = self.BLACK_MARKET_ITEMS[item_name]
        base_offer = int(bm["value"] * 1.5) if bm.get(
            "is_cursed") else bm["value"]

        # --- Negotiation phase ---
        self._resolve_black_market_sale(
            item_name, bm, base_offer)

    # ------------------------------------------------------------------
    #  Black-market negotiation helpers
    # ------------------------------------------------------------------

    def _resolve_black_market_sale(self, item_name, bm, offer):
        """Three choices: accept, haggle (CHA), or walk away."""
        print(f"\n  {bm['buyer'].capitalize()} offers {offer}g ")
        print(f"  for your {item_name}.")
        print("    [1] Accept the offer")
        print("    [2] Haggle (CHA check — risky)")
        print("    [3] Walk away")

        pick = input("  Your move: ").strip()

        if pick == "3":
            self.narrate(
                "You melt back into the crowd. "
                "The figure shrugs and vanishes.")
            return

        if pick == "2":
            offer = self._haggle_black_market(offer, bm)
            if offer is None:
                return  # guard encounter happened

        if pick in ("1", "2"):
            self._complete_black_market_sale(
                item_name, bm, offer)
        else:
            self.narrate("Invalid choice.")

    def _haggle_black_market(self, offer, bm):
        """CHA-based haggle. Returns new offer or None on crit-fail."""
        cha_mod = self.character.get_modifier("cha")
        roll = random.randint(1, 20)
        total = roll + cha_mod

        self.narrate(
            f"You lean in and press for a better price... "
            f"(CHA check: {roll} + {cha_mod} = {total})")

        if total >= 18:
            new_offer = int(offer * 1.3)
            self.narrate(
                f"The fence grins reluctantly. "
                f"'Fine — {new_offer}g. But you owe me.'")
            return new_offer
        elif total <= 5:
            # Critical failure — guards!
            self.narrate(
                "Your clumsy haggling draws attention. "
                "The fence hisses 'We're done!' and "
                "vanishes into the shadows.")
            self._trigger_guard_encounter()
            return None  # sale aborted
        else:
            self.narrate(
                f"The fence doesn't budge. "
                f"'Take it or leave it — {offer}g.'")
            # Still allow the player to accept the original
            confirm = input(
                "  Accept the original offer? (y/n) ").strip().lower()
            return offer if confirm == "y" else None

    def _complete_black_market_sale(self, item_name, bm, price):
        """Finalise sale: transfer gold, apply reputation & bounty."""
        loc_name = self.current_location["name"]
        rep = self.character.reputation.get(loc_name, 0)

        self.character.inventory.remove(item_name)
        self.character.gold += price
        self.narrate(
            f"{bm['buyer'].capitalize()} takes the "
            f"{item_name} and slides you {price} gold.")

        # Bounty always increases
        bounty_gain = max(25, price // 4)
        self.character.bounty += bounty_gain
        self.narrate(
            f"💀 Bounty increased by {bounty_gain}g "
            f"(total: {self.character.bounty}g).")

        if rep > 0:
            self.character.reputation[loc_name] = rep - 1
            self.narrate(
                "Word of your shady dealings spreads... "
                f"Reputation in {loc_name} decreased.")
        else:
            self.narrate(
                "No one noticed the exchange... this time.")

    # ------------------------------------------------------------------
    #  Guard encounter (black-market critical failure or bounty event)
    # ------------------------------------------------------------------

    _GUARD_STAT_BLOCK = {
        "name": "Town Guard", "hp": 22, "ac": 16,
        "str": 13, "dex": 12,
        "damage": "1d8+1", "damage_type": "piercing",
        "xp": 50, "stealth_mod": 0,
        "resistances": [], "vulnerabilities": [],
        "immunities": [],
        "morale_threshold": 0.25, "is_boss": False,
        "recharge_ability": None,
        "banter": [
            "'Halt! You're under arrest!'",
            "'Drop your weapons, criminal!'",
        ],
    }

    def _trigger_guard_encounter(self):
        """A guard patrol interrupts the deal.

        Options: fight (combat), flee (DEX check DC 14), or
        surrender (pay bounty to clear it).
        """
        self.narrate(
            "🛡️  A town guard rounds the corner!\n"
            "    'You there — hold! We've had reports "
            "of illicit dealings.'")

        bounty_add = 50
        self.character.bounty += bounty_add
        self.narrate(
            f"💀 Bounty increased by {bounty_add}g "
            f"(total: {self.character.bounty}g).")

        print("    [1] Fight the guard")
        print("    [2] Flee (DEX check DC 14)")
        cost = self.character.bounty
        gold = self.character.gold
        if gold >= cost:
            print(f"    [3] Surrender (pay {cost}g — you have {gold}g)")
        else:
            print(f"    [3] Surrender (need {cost}g — you only have "
                  f"{gold}g — will fail!)")
        action = input("  Choose: ").strip()

        if action == "1":
            guard = dict(self._GUARD_STAT_BLOCK)  # copy
            self.narrate("You draw your weapon!")
            self._combat_took_crit = False
            self._combat_took_acid_fire = False
            result = self.combat(guard)
            if result == "death":
                return "death"
            if result:  # victory
                self.character.bounty += 100
                self.narrate(
                    "You defeated the guard, but killing "
                    "an officer is a serious crime.\n"
                    "💀 Bounty +100g "
                    f"(total: {self.character.bounty}g).")

        elif action == "2":
            dex_mod = self.character.get_modifier("dex")
            roll = random.randint(1, 20)
            total = roll + dex_mod
            self.narrate(
                f"You bolt into the alley! "
                f"(DEX check: {roll} + {dex_mod} = {total} "
                f"vs DC 14)")
            if total >= 14:
                self.narrate(
                    "You lose the guard in a maze of "
                    "back streets. Safe... for now.")
            else:
                self.narrate(
                    "The guard tackles you! "
                    "A scuffle breaks out.")
                guard = dict(self._GUARD_STAT_BLOCK)
                self._combat_took_crit = False
                self._combat_took_acid_fire = False
                result = self.combat(guard)
                if result == "death":
                    return "death"
                if result:
                    self.character.bounty += 100
                    self.narrate(
                        "💀 Bounty +100g "
                        f"(total: {self.character.bounty}g).")

        elif action == "3":
            cost = self.character.bounty
            if self.character.gold >= cost:
                self.character.gold -= cost
                old_bounty = self.character.bounty
                self.character.bounty = 0
                self.narrate(
                    f"You hand over {cost}g. The guard "
                    f"pockets the bribe and "
                    f"'loses' the report.\n"
                    f"Bounty cleared ({old_bounty}g → 0g).")
            else:
                self.narrate(
                    f"You can't afford {cost}g. "
                    f"The guard hauls you before the "
                    f"magistrate.")
                # Forced fight as last resort
                guard = dict(self._GUARD_STAT_BLOCK)
                self._combat_took_crit = False
                self._combat_took_acid_fire = False
                result = self.combat(guard)
                if result == "death":
                    return "death"
        else:
            self.narrate("Hesitation costs you — the guard attacks!")
            guard = dict(self._GUARD_STAT_BLOCK)
            self._combat_took_crit = False
            self._combat_took_acid_fire = False
            result = self.combat(guard)
            if result == "death":
                return "death"

    def _barter_for_lodging(self):
        """Trade an item directly for a night's rest when broke."""
        tradeable = []
        for item in self.character.inventory:
            val = self._get_barter_value(item)
            if val >= 5:
                tradeable.append((item, val))
        if not tradeable:
            self.narrate(
                "You have nothing valuable enough to "
                "trade for a room.")
            return False
        print("  The innkeeper eyes your belongings...")
        print("  'I might accept one of these for a bed:'")
        for i, (item, val) in enumerate(tradeable, 1):
            print(f"    [{i}] {item}")
        print(f"    [0] Nevermind")
        choice = input("  Choose: ").strip()
        if choice == "0":
            return False
        try:
            idx = int(choice) - 1
            item_name, _ = tradeable[idx]
            self.character.inventory.remove(item_name)
            heal = self.roll_dice("1d8")
            self.character.heal(heal)
            self.narrate(
                f"You trade your {item_name} for a night's "
                f"lodging. You recover {heal} HP.")
            self.character.days_without_food = 0
            return True
        except (ValueError, IndexError):
            self.narrate("Invalid choice.")
            return False

    # ----- Trinket Barter (barter_economy campaigns) --------

    TRINKET_TRADE_TABLE = {
        # Tradeable loot → survival essentials (1:1 value trades)
        "Silver necklace": [("Rations (5 days)", 5),
                            ("Healer's Kit", 1)],
        "Gemstone":        [("Rations (5 days)", 5),
                            ("Antitoxin", 1),
                            ("Torch (5)", 5)],
        "Gold ring":       [("Rations (3 days)", 3),
                            ("Healer's Kit", 1)],
        "Ornate dagger":   [("Rations (5 days)", 5),
                            ("Component Pouch", 1)],
        "Embroidered cloak": [("Rations (3 days)", 3),
                              ("Rope (50 ft)", 1)],
    }

    def _trade_trinkets(self):
        """Trade loot trinkets 1:1 for survival essentials.
        Only available in barter_economy campaigns (Strahd)."""
        setting = self.CAMPAIGN_SETTINGS.get(
            self.campaign, self.CAMPAIGN_SETTINGS["standard"])
        if setting.get("special") != "barter_economy":
            self.narrate(
                "The locals prefer coin here, not barter.")
            return

        tradeable = []
        for item in self.character.inventory:
            if item in self.TRINKET_TRADE_TABLE:
                tradeable.append(item)
        if not tradeable:
            self.narrate(
                "You have no trinkets the traders want.")
            return

        print("\n  === TRINKET BARTER ===")
        print("  The desperate folk of this land trade")
        print("  valuables for practical goods.")
        for i, trinket in enumerate(tradeable, 1):
            options = self.TRINKET_TRADE_TABLE[trinket]
            goods = ", ".join(
                f"{name} x{qty}" for name, qty in options)
            print(f"    [{i}] {trinket}  →  choose: {goods}")
        print(f"    [0] Keep your trinkets")

        choice = input("  Trade which trinket? ").strip()
        if choice == "0":
            return
        try:
            idx = int(choice) - 1
            trinket = tradeable[idx]
        except (ValueError, IndexError):
            self.narrate("Invalid choice.")
            return

        options = self.TRINKET_TRADE_TABLE[trinket]
        print(f"  Trading {trinket} — pick your goods:")
        for j, (name, qty) in enumerate(options, 1):
            print(f"    [{j}] {name} x{qty}")
        good_choice = input("  Choose: ").strip()
        try:
            gidx = int(good_choice) - 1
            good_name, good_qty = options[gidx]
        except (ValueError, IndexError):
            self.narrate("Invalid choice.")
            return

        self.character.inventory.remove(trinket)
        for _ in range(good_qty):
            self.character.inventory.append(good_name)
        # Rations reset starvation counter
        if "Rations" in good_name:
            self.character.days_without_food = max(
                0, self.character.days_without_food - good_qty)
        self.narrate(
            f"You trade your {trinket} for "
            f"{good_name} x{good_qty}. "
            f"A fair deal in these dark times.")

    def _odd_job(self):
        """Perform a service in town for gold.
        Limited to once per town visit; better jobs require
        local reputation.  Payouts scale with campaign setting."""
        if self.current_location["type"] != "town":
            self.narrate(
                "You need to be in a town to find work.")
            return
        if self._worked_this_visit:
            self.narrate(
                "You've already worked here today. "
                "Travel elsewhere and return for more jobs.")
            return

        loc_name = self.current_location["name"]
        rep = self.character.reputation.get(loc_name, 0)

        # Campaign payout scaling (Strahd pays more to offset 3x prices)
        payout_mult = max(1.0, self._campaign_price_mult() * 0.6)

        # Filter jobs by reputation
        available_jobs = list(self.ODD_JOBS)
        if rep < 1:
            # Unknown in town: only low-tier jobs (gold <= 6)
            available_jobs = [
                j for j in available_jobs if j["gold"] <= 6]
            if not available_jobs:
                available_jobs = [self.ODD_JOBS[-1]]  # fallback
            self.narrate(
                "The locals eye you warily — only menial "
                "work is available to strangers.")
        elif rep >= 3:
            self.narrate(
                f"Your reputation in {loc_name} precedes "
                "you — the best jobs are open!")

        jobs = random.sample(
            available_jobs,
            min(3, len(available_jobs)))
        print("\n  HELP WANTED — Odd Jobs:")
        for i, job in enumerate(jobs, 1):
            display_gold = max(1, int(job['gold'] * payout_mult))
            print(f"    [{i}] {job['desc']} "
                  f"— up to {display_gold} gold")
        print(f"    [0] Skip")
        choice = input("  Choose: ").strip()
        if choice == "0":
            return
        try:
            idx = int(choice) - 1
            job = jobs[idx]
        except (ValueError, IndexError):
            self.narrate("Invalid choice.")
            return

        self._worked_this_visit = True

        roll = random.randint(1, 20)
        mod = self.character.get_modifier(job["stat"])
        total = roll + mod
        if total >= job["dc"]:
            base_gold = job["gold"] + (
                (total - job["dc"]) // 2)
            gold = max(1, int(base_gold * payout_mult))
            self.character.gold += gold
            self.narrate(
                f"Job well done! ({job['stat'].upper()}: "
                f"{roll}+{mod} vs DC {job['dc']}) "
                f"You earn {gold} gold.")
            # Reputation boost
            self.character.reputation[loc_name] = (
                rep + 1)
        else:
            pity = max(1, int(job["gold"] // 3 * payout_mult))
            self.character.gold += pity
            self.narrate(
                f"Mediocre effort. ({job['stat'].upper()}: "
                f"{roll}+{mod} vs DC {job['dc']}) "
                f"You earn only {pity} gold.")

    def _bounty_board(self):
        """Check the bounty board for paying quests."""
        if self.current_location["type"] != "town":
            self.narrate(
                "Bounty boards are found in towns.")
            return
        if self.active_bounty:
            b = self.active_bounty
            self.narrate(
                f"Active bounty: \"{b['desc']}\" "
                f"(target area: {b['target']}, "
                f"reward: {b['reward']}g)")
            print("  [1] Attempt to complete (if in target)")
            print("  [2] Abandon bounty")
            print("  [0] Back")
            c = input("  Choose: ").strip()
            if c == "2":
                self.active_bounty = None
                self.narrate("Bounty abandoned.")
            return

        available = random.sample(
            self.BOUNTY_BOARD,
            min(3, len(self.BOUNTY_BOARD)))
        print("\n  BOUNTY BOARD:")
        for i, b in enumerate(available, 1):
            print(f"    [{i}] {b['desc']} "
                  f"(Reward: {b['reward']}g)")
        print(f"    [0] Skip")
        choice = input("  Choose: ").strip()
        if choice == "0":
            return
        try:
            idx = int(choice) - 1
            self.active_bounty = dict(available[idx])
            self.narrate(
                f"Bounty accepted: \"{self.active_bounty['desc']}\"")
        except (ValueError, IndexError):
            self.narrate("Invalid choice.")

    def _try_complete_bounty(self):
        """Check if the player can complete their active bounty
        (must be in matching location type)."""
        if not self.active_bounty:
            return
        b = self.active_bounty
        loc = self.current_location["type"]
        if loc != b["target"]:
            return
        # Skill challenge
        dc = b["difficulty"]
        stat = random.choice(["str", "dex", "wis"])
        roll = random.randint(1, 20)
        mod = self.character.get_modifier(stat)
        total = roll + mod
        self.narrate(
            f"Bounty attempt: \"{b['desc']}\"")
        if total >= dc:
            reward = b["reward"]
            self.character.gold += reward
            self.narrate(
                f"Bounty complete! ({stat.upper()}: "
                f"{roll}+{mod} vs DC {dc}) "
                f"You earn {reward} gold!")
            self.active_bounty = None
            self.bounties_completed += 1
            # Bonus: bounty hoard every 3 completions
            if self.bounties_completed % 3 == 0:
                self.narrate(
                    "Your reputation earns a guild "
                    "stipend and a treasure cache!")
                self._treasure_hoard()
        else:
            self.narrate(
                f"The task proves too difficult this time. "
                f"({stat.upper()}: {roll}+{mod} vs DC {dc})")

    def _loot_gold_from_combat(self, monster):
        """Award CR-scaled gold drops from defeated monsters.
        Tier 1 (CR 0-1/4): 1-3 gp  — covers 1-2 days Modest.
        Tier 2 (CR 1/2-1) : 3-6 gp  — a few days Comfortable.
        Tier 3 (CR 2-4)   : 8-25 gp — toward Pouch or repair."""
        tier = 1
        for t in [3, 2, 1]:
            if monster in [m for m in self.MONSTERS.get(t, [])]:
                tier = t
                break
        base = {1: (1, 3), 2: (3, 6), 3: (8, 25)}
        lo, hi = base.get(tier, (1, 3))
        gold = random.randint(lo, hi)
        # Campaign modifier (e.g. Strahd inflated prices = less loot)
        price_mult = self._campaign_price_mult()
        if price_mult != 1.0:
            gold = max(1, int(gold / price_mult))
        if gold > 0:
            self.character.gold += gold
            self.narrate(
                f"You find {gold} gold on the body.")

    # =================================================================
    #  TREASURE HOARD TABLE (Tier 1: CR 0-4)
    # =================================================================

    TREASURE_HOARDS = [
        # (d100 upper bound, label, gold_range, extras)
        (15,  "Scavenged Cache",
         (100, 150),
         {"items": ["Rations (5 days)"],
          "desc": ("A collection of loose coins and basic "
                   "supplies — someone's lost stash.")}),
        (35,  "Bandit's Spoils",
         (200, 300),
         {"items": ["Component Pouch"],
          "potions": 1,
          "desc": ("A bandit chief's lockbox. Coins, a few "
                   "small gems, and useful gear.")}),
        (65,  "Hero's Reward",
         (350, 500),
         {"potions": 2,
          "desc": ("Silver idols and silk bolts sit beside "
                   "a respectable pile of coin.")}),
        (85,  "Ancient Trove",
         (500, 700),
         {"potions": 1,
          "magic_item": "common",
          "desc": ("Dusty chests reveal old gems and a "
                   "faintly glowing trinket...")}),
        (100, "Dragon's Hoard",
         (750, 1000),
         {"potions": 2,
          "magic_item": "uncommon",
          "rations": 10,
          "desc": ("A gleaming mountain of treasure the "
                   "stuff of legend!")}),
    ]

    COMMON_MAGIC_ITEMS = [
        "Clockwork Amulet (once/day auto-10 on attack)",
        "Moon-Touched Sword (+0, sheds light)",
        "Cloak of Many Fashions (change clothes at will)",
        "Hat of Wizardry (extra cantrip attempt)",
    ]
    UNCOMMON_MAGIC_ITEMS = [
        "Gauntlets of Ogre Power (STR 19)",
        "Boots of Elvenkind (Advantage on Stealth)",
        "Cloak of Protection (+1 AC & saves)",
        "Bag of Holding (500 lb extra carrying)",
        "Goggles of Night (Darkvision 60 ft)",
    ]

    # =================================================================
    #  CAMPAIGN-SPECIFIC MAGIC ITEMS
    # =================================================================

    CAMPAIGN_MAGIC_ITEMS = {
        # --- Curse of Strahd (Gothic Horror) -------------------------
        "strahd": {
            "legendary": [
                {"name": "Sunsword",
                 "desc": "Sentient radiant longsword, +2, sheds sunlight",
                 "bonus": "+2 attack/damage, radiant, extra 1d8 vs undead",
                 "type": "weapon"},
                {"name": "Holy Symbol of Ravenkind",
                 "desc": "Ancient amulet, Turn Undead 1/dawn, sunlight 1/dawn",
                 "bonus": "+2 to Turn Undead DC",
                 "type": "wondrous"},
                {"name": "Tome of Strahd",
                 "desc": "Strahd's journal — reveals his weaknesses",
                 "bonus": "Advantage on saves vs Strahd's abilities",
                 "type": "wondrous"},
            ],
            "unique": [
                {"name": "Saint Markovia's Thighbone",
                 "desc": "Holy mace, +1, extra 2d6 radiant vs undead",
                 "type": "weapon"},
                {"name": "Blood Spear",
                 "desc": "+1 spear, heal HP equal to damage dealt 1/dawn",
                 "type": "weapon"},
                {"name": "Gulthias Staff",
                 "desc": "+1 quarterstaff, Blight 1/dawn, controls blights",
                 "type": "weapon"},
                {"name": "Icon of Ravenloft",
                 "desc": "Raises a holy ward: Advantage vs undead for party",
                 "type": "wondrous"},
                {"name": "Doss Lute",
                 "desc": "Instrument of the Bards — cast 3 spells 1/dawn",
                 "type": "wondrous"},
                {"name": "Luck Blade",
                 "desc": "+1 sword, 1 Wish charge, +1 to all saves",
                 "type": "weapon"},
            ],
            "common": [
                "Silver-tipped Crossbow Bolts (10)",
                "Vial of Holy Water",
                "Barovian Wine (heals 1d4, grants calm)",
                "Wooden Stake & Mallet",
            ],
        },
        # --- Tomb of Annihilation (Jungle Hexcrawl) -----------------
        "tomb": {
            "legendary": [
                {"name": "Ring of Winter",
                 "desc": "Legendary ring — ice spells at will, cold immunity",
                 "bonus": "Cold immunity, Wall of Ice/Cone of Cold at will",
                 "type": "ring"},
                {"name": "Staff of the Forgotten One",
                 "desc": "+3 quarterstaff, regain HP on kill, +5 Warlock DC",
                 "bonus": "+3 attack, +10 necrotic on hit",
                 "type": "weapon"},
            ],
            "unique": [
                {"name": "Amulet of the Black Skull",
                 "desc": "Cast Branding Smite as bonus action, resist necrotic",
                 "type": "wondrous"},
                {"name": "Ghost Lantern",
                 "desc": "Trapped ghost — cast protection from evil 1/dawn",
                 "type": "wondrous"},
                {"name": "Scorpion Armor",
                 "desc": "+1 Studded Leather, poison immunity, Poison Spray",
                 "type": "armor"},
                {"name": "Bookmark (sentient dagger)",
                 "desc": "+3 dagger, Plane Shift 1/dawn, sentient",
                 "type": "weapon"},
            ],
            "common": [
                "Wukka Nuts (bright light 10 ft, 1 hour)",
                "Ryath Root (chew: 2d4 temp HP, 1 hour)",
                "Dancing Monkey Fruit (save vs Irresistible Dance)",
                "Menga Leaves (heals 1 HP, cures disease)",
                "Insect Repellent Salve (4 hours protection)",
            ],
        },
        # --- Keep on the Borderlands (Classic Beginner) -------------
        "borderlands": {
            "legendary": [],  # Introductory module — no legendaries
            "unique": [
                {"name": "+1 Shield (Orcish)",
                 "desc": "Bone-reinforced shield, +1 AC beyond normal",
                 "type": "armor"},
                {"name": "+1 Hand Axe",
                 "desc": "+1 handaxe — reliable and sharp",
                 "type": "weapon"},
                {"name": "+1 Plate Mail",
                 "desc": "AC 19 — the finest armor in the Keep",
                 "type": "armor"},
                {"name": "+2 Sword",
                 "desc": "+2 longsword — a knight's prize blade",
                 "type": "weapon"},
                {"name": "Wand of Paralyzation",
                 "desc": "7 charges: target CON save or Paralyzed (1 min)",
                 "type": "wondrous"},
                {"name": "Helm of Alignment Change",
                 "desc": "Cursed! Shifts alignment on first wear",
                 "type": "wondrous"},
            ],
            "common": [
                "Rope of Climbing (60 ft, obeys commands)",
                "Elven Boots (Advantage on Stealth)",
                "Snake Staff (turns into a constrictor 1/dawn)",
                "Silver Dagger (+0, bypasses lycanthrope DR)",
            ],
        },
        # --- Night's Dark Terror (Wilderness Mystery) ---------------
        "dark_terror": {
            "legendary": [],  # Narrative-focused, not loot-focused
            "unique": [
                {"name": "+1 Handaxe (Black Web)",
                 "desc": "+1 handaxe claimed from Black Web Orcs",
                 "type": "weapon"},
                {"name": "+1 Longsword (Iron Ring)",
                 "desc": "+1 longsword taken from an Iron Ring agent",
                 "type": "weapon"},
                {"name": "Map of the Dymrak Forest",
                 "desc": "Advantage on Survival checks in wilderness",
                 "type": "wondrous"},
            ],
            "common": [
                "Iron Ring Tattoo (identifies the antagonist cult)",
                "Rough-drawn map fragment (hints at treasure)",
                "Trail Rations, Karameikan (7 days, +1 morale)",
                "Wolvesbane Bundle (repels lycanthropes, 3 uses)",
            ],
        },
        # --- Standard (generic fallback) ----------------------------
        "standard": {
            "legendary": [],
            "unique": [],
            "common": [],
        },
    }

    def _get_barter_value(self, item_name):
        """Look up barter value from base table + campaign table.
        Returns: >0 = gold value, 0 = unsellable, -1 = PRICELESS."""
        # Check campaign table first (has legendaries at -1)
        camp_val = self.CAMPAIGN_BARTER_VALUES.get(item_name, None)
        if camp_val is not None:
            return camp_val
        val = self.BARTER_VALUES.get(item_name, 0)
        return val

    def _is_artifact(self, item_name):
        """Check if an item is a priceless artifact (-1 barter)."""
        return self.CAMPAIGN_BARTER_VALUES.get(item_name) == -1

    def _roll_campaign_magic_item(self, rarity):
        """Roll a magic item, blending generic + campaign-specific
        lists.  'rarity' = 'common' or 'uncommon'.
        Uncommon has a 30% chance of dropping a campaign 'unique'.
        Dragon's Hoard tier has a small chance at a legendary."""
        key = getattr(self, 'campaign', 'standard')
        camp_items = self.CAMPAIGN_MAGIC_ITEMS.get(
            key, self.CAMPAIGN_MAGIC_ITEMS["standard"])

        if rarity == "common":
            # 40% chance for a campaign common item if available
            camp_common = camp_items.get("common", [])
            if camp_common and random.random() < 0.4:
                return random.choice(camp_common)
            return random.choice(self.COMMON_MAGIC_ITEMS)

        elif rarity == "uncommon":
            # 5% chance for legendary if the campaign has any
            legendaries = camp_items.get("legendary", [])
            if legendaries and random.random() < 0.05:
                item = random.choice(legendaries)
                self.narrate(
                    f"\n  *** LEGENDARY ARTIFACT ***")
                self.narrate(f"  {item['desc']}")
                if item.get('bonus'):
                    self.narrate(f"  Bonus: {item['bonus']}")
                return item["name"]

            # 30% chance for campaign unique
            uniques = camp_items.get("unique", [])
            if uniques and random.random() < 0.3:
                item = random.choice(uniques)
                self.narrate(
                    f"  Campaign treasure: {item['desc']}")
                return item["name"]

            return random.choice(self.UNCOMMON_MAGIC_ITEMS)

        # Fallback
        return random.choice(self.COMMON_MAGIC_ITEMS)

    def _treasure_hoard(self):
        """Roll a d100 Treasure Hoard (Tier 1).
        Awards gold, potions, rations, and possibly a magic item."""
        roll = random.randint(1, 100)
        for upper, label, gold_range, extras in self.TREASURE_HOARDS:
            if roll <= upper:
                break

        lo, hi = gold_range
        gold = random.randint(lo, hi)
        # Campaign modifier
        price_mult = self._campaign_price_mult()
        if price_mult > 1.0:
            # Scarce economy: hoard contains trade goods instead
            gold = max(50, int(gold / price_mult))

        print(f"\n{'='*50}")
        print(f"  TREASURE HOARD: {label}  (d100: {roll})")
        print(f"{'='*50}")
        self.narrate(extras["desc"])
        self.character.gold += gold
        self.narrate(f"You find {gold} gold!")

        # Potions
        num_potions = extras.get("potions", 0)
        for _ in range(num_potions):
            if random.random() < 0.3:
                self.character.inventory.append(
                    "Greater Healing Potion")
                self.narrate(
                    "Among the hoard: a Greater Healing Potion!")
            else:
                self.character.inventory.append("Healing Potion")
                self.narrate(
                    "Among the hoard: a Healing Potion!")

        # Named items
        for item_name in extras.get("items", []):
            if item_name not in self.character.inventory:
                self.character.inventory.append(item_name)
                self.narrate(
                    f"Among the hoard: a {item_name}!")

        # Rations
        rations = extras.get("rations", 0)
        if rations:
            count = 0
            while count < rations:
                if "Rations (5 days)" not in self.character.inventory:
                    self.character.inventory.append(
                        "Rations (5 days)")
                count += 5
            self.narrate(
                f"A stockpile of {rations} days' rations!")
            self.character.days_without_food = 0

        # Magic items
        tier = extras.get("magic_item")
        if tier == "common":
            mi = self._roll_campaign_magic_item("common")
            self.character.inventory.append(mi)
            self.narrate(f"MAGIC ITEM: {mi}")
        elif tier == "uncommon":
            mi = self._roll_campaign_magic_item("uncommon")
            self.character.inventory.append(mi)
            self.narrate(f"RARE FIND — MAGIC ITEM: {mi}")

        print(f"{'='*50}\n")

    # =================================================================
    #  CAMPAIGN SETTINGS — Adapts economy to setting
    # =================================================================

    CAMPAIGN_SETTINGS = {
        "borderlands": {
            "name": "Keep on the Borderlands  \u2605 Recommended Start",
            "desc": ("The Keep is your safe hub. Reputation "
                     "matters; armor repair is the main gold sink."),
            "price_mult": 1.0,
            "loot_mult": 1.2,
            "foraging_dc_mod": 0,
            "exhaustion_strict": False,
            "special": "reputation_focus",
        },
        "standard": {
            "name": "Standard Adventure",
            "desc": "A balanced setting for classic dungeon crawling.",
            "price_mult": 1.0,
            "loot_mult": 1.0,
            "foraging_dc_mod": 0,
            "exhaustion_strict": False,
            "special": None,
        },
        "strahd": {
            "name": "Curse of Strahd",
            "desc": ("Barovia is a land of extreme scarcity. "
                     "Shops are rare, prices inflated."),
            "price_mult": 3.0,
            "loot_mult": 0.5,
            "foraging_dc_mod": +2,
            "exhaustion_strict": True,
            "special": "barter_economy",
        },
        "tomb": {
            "name": "Tomb of Annihilation",
            "desc": ("The jungles of Chult are unforgiving. "
                     "Foraging is key; shops vanish past the city."),
            "price_mult": 1.5,
            "loot_mult": 0.8,
            "foraging_dc_mod": +3,
            "exhaustion_strict": True,
            "special": "jungle_survival",
        },
        "dark_terror": {
            "name": "Night's Dark Terror",
            "desc": ("Treasure is abundant but heavy. Choose "
                     "between gold and rations carefully."),
            "price_mult": 0.7,
            "loot_mult": 1.5,
            "foraging_dc_mod": -1,
            "exhaustion_strict": False,
            "special": "heavy_treasure",
        },
    }

    def _campaign_price_mult(self):
        """Return the price multiplier for the active campaign."""
        key = getattr(self, 'campaign', 'standard')
        setting = self.CAMPAIGN_SETTINGS.get(key, {})
        return setting.get("price_mult", 1.0)

    def _campaign_forage_dc_mod(self):
        """Return the foraging DC modifier for the active campaign."""
        key = getattr(self, 'campaign', 'standard')
        setting = self.CAMPAIGN_SETTINGS.get(key, {})
        return setting.get("foraging_dc_mod", 0)

    def _campaign_exhaustion_strict(self):
        """Return whether the campaign uses strict exhaustion rules."""
        key = getattr(self, 'campaign', 'standard')
        setting = self.CAMPAIGN_SETTINGS.get(key, {})
        return setting.get("exhaustion_strict", False)

    def _material_component_cost(self, spell):
        """Check if a spell requires costly material components.
        A Component Pouch covers mundane (low/no-cost) materials.
        Only explicitly expensive materials (material_cost > 0 in
        the spell data) require gold.
        Returns (can_afford, cost, reason)."""
        comps = spell.get("components", "")
        if "M" not in comps.upper():
            return True, 0, ""
        explicit_cost = spell.get("material_cost", 0)
        # Component Pouch covers everyday materials
        has_pouch = "Component Pouch" in self.character.inventory
        if has_pouch and explicit_cost <= 0:
            return True, 0, ""
        if explicit_cost <= 0 and not has_pouch:
            # No pouch and no explicit cost: minor gold charge
            cost = 2
            if self.character.gold >= cost:
                return True, cost, ""
            return (False, cost,
                    f"You need a Component Pouch or {cost} gold "
                    "for basic material components!")
        # Expensive material (diamonds, rare gems, etc.)
        if self.character.gold >= explicit_cost:
            return True, explicit_cost, ""
        return (False, explicit_cost,
                f"This spell requires {explicit_cost} gold in "
                "rare material components!")

    # =================================================================

    def explore(self):
        self.turn += 1
        loc_type = self.current_location['type']

        # --- Starvation check ---
        self._check_starvation()
        if self.character.hp <= 0:
            return "death"

        # --- Bounty completion attempt ---
        if self.active_bounty:
            self._try_complete_bounty()

        self.narrate(random.choice(self.EVENTS[loc_type]))

        # --- Bounty: guard patrol risk ---
        loc_name = self.current_location['name']
        danger = self.current_location['danger']
        if (self.character.bounty >= 100
                and loc_type == "town"
                and random.random() < min(
                    0.10 + self.character.bounty / 1000, 0.50)):
            self.narrate(
                "A patrol rounds the corner — one of the "
                "guards studies a wanted poster that looks "
                "disturbingly familiar…")
            result = self._trigger_guard_encounter()
            if result == "death":
                return "death"

        # --- Thieves' Guild: black-market access in shady towns ---
        rep = self.character.reputation.get(loc_name, 0)
        if (loc_type == "town"
                and rep <= -2
                and random.random() < 0.20):
            bm_items = [
                it for it in self.character.inventory
                if it in self.BLACK_MARKET_ITEMS]
            if bm_items:
                self.narrate(
                    "A cloaked figure slips you a note: "
                    "'Meet me behind the tannery at dusk. "
                    "I hear you carry interesting wares…'")
                deal = input(
                    "  Follow the stranger to the black "
                    "market? (y/n) ").strip().lower()
                if deal == "y":
                    self._sell_black_market(bm_items)

        # --- BOSS ENCOUNTER CHECK ---
        if (loc_name in self.BOSS_ENCOUNTERS
                and loc_name not in self.boss_encounters_cleared
                and danger >= 2
                and self.turn >= 5
                and random.random() < 0.35):
            encounter = self.BOSS_ENCOUNTERS[loc_name]
            self.narrate(
                "The air grows heavy... something powerful "
                "stirs ahead.")
            result = self.boss_combat(encounter)
            if result == "death":
                return "death"
            elif result == "heroic_death":
                return "heroic_death"
            elif result:  # Victory
                self.boss_encounters_cleared.add(loc_name)
                self.find_treasure()
            return

        # Random encounters based on danger level
        if danger > 0 and random.random() < 0.4:
            monster_tier = min(danger, 3)
            monster = random.choice(self.MONSTERS[monster_tier]).copy()
            self.narrate(f"⚠️  A {monster['name']} appears!")
            # Reset armor degradation flags for this fight
            self._combat_took_crit = False
            self._combat_took_acid_fire = False
            result = self.combat(monster)
            if result == "death":
                return "death"
            elif result:  # Victory
                self._loot_gold_from_combat(monster)
                self._armor_degradation()
                if random.random() < 0.5:
                    self.find_treasure()
        elif random.random() < 0.3:
            self.find_treasure()
        else:
            self.random_event()
    
    def find_treasure(self):
        treasure = random.choice(self.TREASURES)
        if callable(treasure['value']):
            value = treasure['value']()
        else:
            value = treasure['value']
            
        if treasure.get('usable'):
            self.character.inventory.append(treasure['name'])
            self.narrate(f"💎 You found a {treasure['name']}! (Added to inventory)")
        else:
            self.character.gold += value
            self.narrate(f"💰 You found {treasure['name']} worth {value} gold!")
    
    def random_event(self):
        events = [
            self.merchant_event,
            self.mysterious_stranger,
            self.trapped_chest,
            self.healing_spring,
        ]
        random.choice(events)()
    
    def merchant_event(self):
        self.narrate("A traveling merchant approaches you.")
        print("'I have wares if you have coin!'")
        print("[1] Buy Healing Potion (25 gold)")
        print("[2] Decline")
        
        choice = input("Choose: ").strip()
        if choice == "1" and self.character.gold >= 25:
            self.character.gold -= 25
            self.character.inventory.append("Healing Potion")
            self.narrate("You purchased a Healing Potion!")
        elif choice == "1":
            self.narrate("You don't have enough gold.")
        else:
            self.narrate("The merchant moves on.")
    
    def mysterious_stranger(self):
        self.narrate("A hooded figure beckons you closer...")
        print("[1] Approach")
        print("[2] Ignore")
        
        choice = input("Choose: ").strip()
        if choice == "1":
            if random.random() < 0.5:
                gold = random.randint(10, 30)
                self.character.gold += gold
                self.narrate(f"The stranger rewards your bravery with {gold} gold!")
            else:
                self.narrate("It's a trap!")
                damage = random.randint(2, 8)
                self.character.take_damage(damage)
                self.narrate(f"You take {damage} damage from a hidden blade!")
        else:
            self.narrate("Wisdom keeps you safe... this time.")
    
    def trapped_chest(self):
        self.narrate("You discover an old chest covered in dust.")
        print("[1] Open it")
        print("[2] Check for traps first")
        print("[3] Leave it")
        
        choice = input("Choose: ").strip()
        if choice == "1":
            if random.random() < 0.4:
                damage = random.randint(3, 12)
                self.character.take_damage(damage)
                self.narrate(f"💥 A trap! You take {damage} damage!")
            else:
                gold = random.randint(15, 50)
                self.character.gold += gold
                self.narrate(f"Inside you find {gold} gold!")
        elif choice == "2":
            if self.skill_check("int", 12):
                self.narrate("You disarm the trap and safely open the chest!")
                gold = random.randint(20, 60)
                self.character.gold += gold
                self.narrate(f"You find {gold} gold!")
            else:
                self.narrate("You trigger the trap while checking!")
                damage = random.randint(2, 8)
                self.character.take_damage(damage)
                self.narrate(f"You take {damage} damage!")
        else:
            self.narrate("You leave the chest alone.")
    
    def healing_spring(self):
        self.narrate("You discover a natural spring with crystal-clear water.")
        self.narrate("The water glows with a faint magical aura.")
        print("[1] Drink from the spring")
        print("[2] Leave it alone")
        
        choice = input("Choose: ").strip()
        if choice == "1":
            heal = random.randint(5, 15)
            self.character.heal(heal)
            self.narrate(f"✨ The magical water heals you for {heal} HP!")
        else:
            self.narrate("You continue on your way.")
    
    def use_item(self):
        usable = [item for item in self.character.inventory
                  if "Potion" in item or "Antitoxin" in item
                  or "Rations" in item
                  or "Adrenaline Burst" in item]
        if not usable:
            self.narrate("You have no usable items.")
            return

        print("Usable items:")
        for i, item in enumerate(usable, 1):
            print(f"  [{i}] {item}")
        print(f"  [0] Cancel")

        choice = input("Choose item: ").strip()
        if choice == "0":
            return

        try:
            idx = int(choice) - 1
            item = usable[idx]
            if "Greater Healing" in item:
                heal = self.roll_dice("4d4") + 4
                self.character.heal(heal)
                self.character.inventory.remove(item)
                self.narrate(
                    f"You drink the Greater Healing Potion "
                    f"and recover {heal} HP!")
            elif "Healing" in item:
                heal = self.roll_dice("2d4") + 2
                self.character.heal(heal)
                self.character.inventory.remove(item)
                self.narrate(
                    f"You drink the potion and heal "
                    f"{heal} HP!")
            elif "Antitoxin" in item:
                self.character.inventory.remove(item)
                self.narrate(
                    "You drink the antitoxin. Advantage on "
                    "poison saves for the next encounter!")
            elif "Rations" in item:
                self.character.days_without_food = 0
                self.character.inventory.remove(item)
                self.narrate("You eat some rations. Hunger abated.")
            elif "Adrenaline Burst" in item:
                self.character.inventory.remove(item)
                self.character.hp = min(
                    self.character.max_hp,
                    self.character.hp + 10)
                self.narrate(
                    "The legacy token surges with energy! "
                    "+10 HP and your next attack has "
                    "advantage!")
            else:
                self.narrate(f"You can't figure out how to use {item}.")
        except (ValueError, IndexError):
            self.narrate("Invalid choice.")
    
    def travel(self):
        print("\nAvailable locations:")
        for i, loc in enumerate(self.LOCATIONS, 1):
            danger_stars = "⚠️" * loc['danger'] if loc['danger'] > 0 else "🏠"
            terrain_tag = " [Difficult Terrain]" if loc.get("difficult_terrain") else ""
            cover_tag = " [Cover Available]" if loc.get("cover_available") else ""
            print(f"  [{i}] {loc['name']} ({loc['type']}) {danger_stars}{terrain_tag}{cover_tag}")
        
        choice = input("Choose destination (0 to stay): ").strip()
        if choice == "0":
            return
            
        try:
            idx = int(choice) - 1
            self.current_location = self.LOCATIONS[idx]
            self.narrate(f"You travel to {self.current_location['name']}...")

            # Reset per-visit flags for new location
            self._worked_this_visit = False

            if self.current_location.get("difficult_terrain"):
                self.narrate("The terrain here is rough and uneven — movement will be costly.")
            
            # Random encounter while traveling
            if random.random() < 0.3 and self.current_location['danger'] > 0:
                self.narrate("You encounter something on the road!")
                monster = random.choice(self.MONSTERS[1])
                self.combat(monster.copy())
        except (ValueError, IndexError):
            self.narrate("Invalid location.")
    
    def rest(self):
        self._update_lifestyle()
        if self.current_location['type'] == 'town':
            self.narrate(
                f"Current lifestyle: "
                f"{self.character.lifestyle.title()} "
                f"(Gold: {self.character.gold})")
            print("  [1] Pay for lodging (lifestyle-tiered)")
            print("  [2] Barter an item for a bed")
            print("  [3] Sleep rough (free, risky)")
            choice = input("  Choose: ").strip()
            if choice == "1":
                self._lifestyle_rest()
            elif choice == "2":
                if not self._barter_for_lodging():
                    self.narrate("You sleep rough instead.")
                    self._rough_sleep()
            else:
                self._rough_sleep()
        else:
            self.narrate("You make camp in the wilderness...")
            print("  [1] Rest  [2] Forage for food first")
            choice = input("  Choose: ").strip()
            if choice == "2":
                self._forage()
            self._rough_sleep()

    def _rough_sleep(self):
        """Free rest: low healing, ambush risk."""
        if random.random() < 0.3:
            self.narrate("Your rest is interrupted!")
            monster = random.choice(self.MONSTERS[1])
            self.combat(monster.copy())
        else:
            heal = self.roll_dice("1d4")
            self.character.heal(heal)
            self.narrate(
                f"You sleep rough and recover only "
                f"{heal} HP.")


def create_character():
    """Interactive character creation"""
    char = Character()
    
    print("\n" + "="*50)
    print("  ⚔️  DUNGEONS & DRAGONS CHARACTER CREATION ⚔️")
    print("="*50)
    
    char.name = input("\nWhat is your character's name? ").strip() or "Adventurer"
    
    print("\nChoose your RACE:")
    races = list(Character.RACES.keys())
    for i, race in enumerate(races, 1):
        traits = ", ".join(Character.RACES[race]["traits"])
        print(f"  [{i}] {race} - {traits}")
    
    while True:
        choice = input("Enter number: ").strip()
        try:
            char.race = races[int(choice) - 1]
            break
        except (ValueError, IndexError):
            print("Invalid choice, try again.")
    
    print("\nChoose your CLASS:")
    classes = list(Character.CLASSES.keys())
    for i, cls in enumerate(classes, 1):
        info = Character.CLASSES[cls]
        print(f"  [{i}] {cls} - Hit Die: d{info['hit_die']}, Primary: {info['primary'].upper()}")
    
    while True:
        choice = input("Enter number: ").strip()
        try:
            char.char_class = classes[int(choice) - 1]
            break
        except (ValueError, IndexError):
            print("Invalid choice, try again.")
    
    print("\nChoose your BACKGROUND:")
    backgrounds = list(Character.BACKGROUNDS.keys())
    for i, bg in enumerate(backgrounds, 1):
        feature = Character.BACKGROUNDS[bg]["feature"]
        print(f"  [{i}] {bg} - {feature}")
    
    while True:
        choice = input("Enter number: ").strip()
        try:
            char.background = backgrounds[int(choice) - 1]
            break
        except (ValueError, IndexError):
            print("Invalid choice, try again.")
    
    print("\n🎲 Rolling your stats (4d6, drop lowest)...")
    char.roll_stats()
    char.apply_racial_bonus()
    char.setup_class()
    char.setup_background()
    
    print("\nYour character is ready!")
    char.display_sheet()
    
    return char


def save_game(character, dm):
    """Save game state to file"""
    save_data = {
        "character": character.to_dict(),
        "location": dm.current_location,
        "turn": dm.turn
    }
    with open("savegame.json", "w") as f:
        json.dump(save_data, f, indent=2)
    print("\n💾 Game saved!")


def load_game():
    """Load game state from file"""
    try:
        with open("savegame.json", "r") as f:
            save_data = json.load(f)
        character = Character.from_dict(save_data["character"])
        dm = DungeonMaster(character)
        dm.current_location = save_data["location"]
        dm.turn = save_data["turn"]
        print("\n📂 Game loaded!")
        return character, dm
    except FileNotFoundError:
        return None, None


def main():
    print("\n" + "="*60)
    print("  🐉 WELCOME TO DUNGEONS & DRAGONS: TEXT ADVENTURE 🐉")
    print("="*60)
    print("\n[1] New Game")
    print("[2] Load Game")
    print("[3] Quit")
    
    choice = input("\nChoose: ").strip()
    
    if choice == "3":
        print("\nFarewell, adventurer!")
        return
    elif choice == "2":
        character, dm = load_game()
        if not character:
            print("No save file found. Starting new game...")
            character = create_character()
            dm = DungeonMaster(character)
    else:
        character = create_character()
        dm = DungeonMaster(character)

    # --- Campaign Setting Selection ---
    print("\n" + "="*50)
    print("  Choose your CAMPAIGN SETTING:")
    print("="*50)
    settings = list(DungeonMaster.CAMPAIGN_SETTINGS.items())
    for i, (key, info) in enumerate(settings, 1):
        print(f"  [{i}] {info['name']}")
        print(f"      {info['desc']}")
    print()
    print("  TIP: Start with Keep on the Borderlands to")
    print("  benchmark gold-drop rates at 1.0x prices.")
    print("  Once you know how fast you can afford a")
    print("  Component Pouch & Armor Repairs, you'll know")
    print("  exactly how much 3.0x Strahd will pressure you.")
    print()
    camp_choice = input("  Choose (default: 1): ").strip()
    try:
        camp_key = settings[int(camp_choice) - 1][0]
    except (ValueError, IndexError):
        camp_key = "borderlands"
    dm.campaign = camp_key
    camp_info = DungeonMaster.CAMPAIGN_SETTINGS[camp_key]
    dm.narrate(f"Campaign: {camp_info['name']}")
    if camp_info["price_mult"] != 1.0:
        dm.narrate(
            f"Economy modifier: prices x{camp_info['price_mult']}")
    if camp_info["foraging_dc_mod"] != 0:
        dm.narrate(
            f"Foraging DC modifier: "
            f"{'+' if camp_info['foraging_dc_mod'] > 0 else ''}"
            f"{camp_info['foraging_dc_mod']}")
    if camp_info["exhaustion_strict"]:
        dm.narrate("Strict exhaustion rules are in effect.")
    
    dm.narrate(f"Welcome, {character.name} the {character.race} {character.char_class}!")
    dm.narrate(f"You begin your adventure at {dm.current_location['name']}.")
    
    # Track heroic death for legacy system
    heroic_death = False
    
    # Main game loop
    while character.hp > 0 and not character.is_dead:
        dm._update_lifestyle()
        lifestyle_tag = character.lifestyle.title()
        hunger_tag = (
            f" [HUNGRY: {character.days_without_food}d]"
            if character.days_without_food >= 2 else "")
        armor_tag = (
            f" [Armor: {int(character.armor_condition*100)}%]"
            if character.armor_condition < 0.7 else "")
        exhaust_tag = (
            f" [Exhaustion: {character.exhaustion_level}/6]"
            if character.exhaustion_level > 0 else "")
        print(f"\n[HP: {character.hp}/{character.max_hp}] "
              f"[Gold: {character.gold}] "
              f"[{lifestyle_tag}] "
              f"[Location: {dm.current_location['name']}]"
              f"{hunger_tag}{armor_tag}{exhaust_tag}")
        if character.last_stand_active:
            print(f"  [!! LAST STAND: {character.last_stand_rounds} rounds !!]")
        print("-" * 50)
        loc = dm.current_location['type']
        print("Actions:")
        print("  [1] Explore      [5] Character Sheet")
        print("  [2] Travel       [6] Save & Quit")
        print("  [3] Use Item     [7] Forage (wilderness)")
        print("  [4] Rest")
        if loc == 'town':
            print("  [8] Shop         [9] Work for Gold")
            print("  [b] Bounty Board [t] Trade Trinkets")
        
        action = input("\nWhat do you do? ").strip()
        
        if action == "1":
            result = dm.explore()
            if result == "death":
                break
            elif result == "heroic_death":
                heroic_death = True
                break
        elif action == "2":
            dm.travel()
        elif action == "3":
            dm.use_item()
        elif action == "4":
            dm.rest()
        elif action == "5":
            character.display_sheet()
        elif action == "6":
            save_game(character, dm)
            print("\nUntil next time, adventurer!")
            break
        elif action == "7":
            if dm.current_location['type'] != 'town':
                dm._forage()
            else:
                dm.narrate(
                    "You're in town — buy food "
                    "at the shop instead.")
        elif action == "8":
            dm._shop()
        elif action == "9":
            dm._odd_job()
        elif action == "b":
            dm._bounty_board()
        elif action == "t":
            dm._trade_trinkets()
        else:
            print("Invalid action.")
    
    if character.hp <= 0 or character.is_dead:
        print("\n" + "="*50)

        if heroic_death:
            print("  HEROIC SACRIFICE")
            print(f"  {character.name} gave their life so that "
                  "others might prevail.")
            print(f"  The world will remember this hero.")
        else:
            print("  GAME OVER")
            print(f"  {character.name} has fallen after "
                  f"{dm.turn} turns.")
            if character.is_dead:
                print("  Cause: Failed 3 Death Saving Throws")

        print(f"  Final Level: {character.level} | "
              f"XP: {character.experience}")
        print("="*50)

        # --- LEGACY SYSTEM ---
        if heroic_death or character.heroic_sacrifice_count > 0:
            legacies = dm._generate_legacy(character)
            print("\nYour sacrifice echoes through time...")
            print("A new hero inherits the fallen's legacy.\n")
            print("[1] Begin a new adventure "
                  "(with Legacy bonuses)")
            print("[2] Quit")
            if input("Choose: ").strip() == "1":
                new_character = create_character()
                new_dm = DungeonMaster(new_character)
                new_dm._apply_legacy(legacies)
                # Restart game loop with the new character
                # by calling main recursively and injecting
                # the character
                new_dm.narrate(
                    f"Welcome, {new_character.name} the "
                    f"{new_character.race} "
                    f"{new_character.char_class}!")
                new_dm.narrate(
                    "You carry the legacy of "
                    f"{character.name}, who fell a hero.")
                new_dm.narrate(
                    f"You begin at "
                    f"{new_dm.current_location['name']}.")
                # Continue with new character (inline loop)
                _run_game_loop(new_character, new_dm)
        else:
            print("\n[1] Try again")
            print("[2] Quit")
            if input("Choose: ").strip() == "1":
                main()


def _run_game_loop(character, dm):
    """Continue the game loop with a given character and DM."""
    heroic_death = False

    while character.hp > 0 and not character.is_dead:
        dm._update_lifestyle()
        lifestyle_tag = character.lifestyle.title()
        hunger_tag = (
            f" [HUNGRY: {character.days_without_food}d]"
            if character.days_without_food >= 2 else "")
        armor_tag = (
            f" [Armor: {int(character.armor_condition*100)}%]"
            if character.armor_condition < 0.7 else "")
        exhaust_tag = (
            f" [Exhaustion: {character.exhaustion_level}/6]"
            if character.exhaustion_level > 0 else "")
        print(f"\n[HP: {character.hp}/{character.max_hp}] "
              f"[Gold: {character.gold}] "
              f"[{lifestyle_tag}] "
              f"[Location: {dm.current_location['name']}]"
              f"{hunger_tag}{armor_tag}{exhaust_tag}")
        if character.last_stand_active:
            print(f"  [!! LAST STAND: "
                  f"{character.last_stand_rounds} rounds !!]")
        print("-" * 50)
        loc = dm.current_location['type']
        print("Actions:")
        print("  [1] Explore      [5] Character Sheet")
        print("  [2] Travel       [6] Save & Quit")
        print("  [3] Use Item     [7] Forage (wilderness)")
        print("  [4] Rest")
        if loc == 'town':
            print("  [8] Shop         [9] Work for Gold")
            print("  [b] Bounty Board [t] Trade Trinkets")

        action = input("\nWhat do you do? ").strip()

        if action == "1":
            result = dm.explore()
            if result == "death":
                break
            elif result == "heroic_death":
                heroic_death = True
                break
        elif action == "2":
            dm.travel()
        elif action == "3":
            dm.use_item()
        elif action == "4":
            dm.rest()
        elif action == "5":
            character.display_sheet()
        elif action == "6":
            save_game(character, dm)
            print("\nUntil next time, adventurer!")
            return
        elif action == "7":
            if dm.current_location['type'] != 'town':
                dm._forage()
            else:
                dm.narrate(
                    "You're in town — buy food "
                    "at the shop instead.")
        elif action == "8":
            dm._shop()
        elif action == "9":
            dm._odd_job()
        elif action == "b":
            dm._bounty_board()
        elif action == "t":
            dm._trade_trinkets()
        else:
            print("Invalid action.")

    if character.hp <= 0 or character.is_dead:
        print("\n" + "="*50)
        if heroic_death:
            print("  HEROIC SACRIFICE")
            print(f"  {character.name} gave their life.")
        else:
            print("  GAME OVER")
            print(f"  {character.name} has fallen after "
                  f"{dm.turn} turns.")
        print(f"  Final Level: {character.level} | "
              f"XP: {character.experience}")
        print("="*50)

        if heroic_death or character.heroic_sacrifice_count > 0:
            legacies = dm._generate_legacy(character)
            print("\n[1] New hero (with Legacy)")
            print("[2] Quit")
            if input("Choose: ").strip() == "1":
                new_char = create_character()
                new_dm = DungeonMaster(new_char)
                new_dm._apply_legacy(legacies)
                new_dm.narrate(
                    f"You carry the legacy of "
                    f"{character.name}.")
                _run_game_loop(new_char, new_dm)
        else:
            print("\n[1] Try again")
            print("[2] Quit")
            if input("Choose: ").strip() == "1":
                main()


if __name__ == "__main__":
    main()
