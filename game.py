import random
import json
import os

# D&D 5e Simplified Game Engine

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
                   "skills": ["Athletics", "Intimidation"], "equipment": ["Longsword", "Shield", "Chain Mail"]},
        "Wizard": {"hit_die": 6, "primary": "int", "saves": ["int", "wis"],
                  "skills": ["Arcana", "History"], "equipment": ["Quarterstaff", "Spellbook", "Robes"]},
        "Rogue": {"hit_die": 8, "primary": "dex", "saves": ["dex", "int"],
                 "skills": ["Stealth", "Thieves' Tools"], "equipment": ["Shortsword", "Dagger", "Leather Armor"]},
        "Cleric": {"hit_die": 8, "primary": "wis", "saves": ["wis", "cha"],
                  "skills": ["Medicine", "Religion"], "equipment": ["Mace", "Shield", "Scale Mail"]},
        "Ranger": {"hit_die": 10, "primary": "dex", "saves": ["str", "dex"],
                  "skills": ["Survival", "Nature"], "equipment": ["Longbow", "Shortsword", "Leather Armor"]},
        "Barbarian": {"hit_die": 12, "primary": "str", "saves": ["str", "con"],
                     "skills": ["Athletics", "Survival"], "equipment": ["Greataxe", "Handaxes", "Hide Armor"]},
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
        self.inventory = []
        self.gold = 0
        self.traits = []
        self.skills = []
        
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
        
    def calculate_ac(self):
        dex_mod = self.get_modifier("dex")
        # Simplified AC based on equipment
        if "Chain Mail" in self.inventory:
            self.ac = 16
        elif "Scale Mail" in self.inventory:
            self.ac = 14 + min(dex_mod, 2)
        elif "Leather Armor" in self.inventory or "Hide Armor" in self.inventory:
            self.ac = 11 + dex_mod
        else:
            self.ac = 10 + dex_mod
        if "Shield" in self.inventory:
            self.ac += 2
            
    def setup_class(self):
        class_info = self.CLASSES[self.char_class]
        self.inventory.extend(class_info["equipment"])
        self.skills.extend(class_info["skills"])
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
        print("-"*50)
        print(f"  Skills: {', '.join(self.skills)}")
        print(f"  Traits: {', '.join(self.traits)}")
        print("-"*50)
        print(f"  Equipment: {', '.join(self.inventory)}")
        print("="*50 + "\n")
        
    def take_damage(self, damage):
        self.hp = max(0, self.hp - damage)
        return self.hp > 0
    
    def heal(self, amount):
        self.hp = min(self.max_hp, self.hp + amount)
        
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
    
    LOCATIONS = [
        {"name": "The Forgotten Crypt", "type": "dungeon", "danger": 2},
        {"name": "Thornwood Forest", "type": "wilderness", "danger": 1},
        {"name": "The Rusty Dragon Inn", "type": "town", "danger": 0},
        {"name": "Goblin Warrens", "type": "dungeon", "danger": 2},
        {"name": "Mystic Tower", "type": "dungeon", "danger": 3},
        {"name": "Riverside Village", "type": "town", "danger": 0},
    ]
    
    MONSTERS = {
        1: [
            {"name": "Goblin", "hp": 7, "ac": 15, "damage": "1d6", "xp": 50},
            {"name": "Kobold", "hp": 5, "ac": 12, "damage": "1d4", "xp": 25},
            {"name": "Giant Rat", "hp": 7, "ac": 12, "damage": "1d4", "xp": 25},
        ],
        2: [
            {"name": "Orc", "hp": 15, "ac": 13, "damage": "1d12", "xp": 100},
            {"name": "Skeleton", "hp": 13, "ac": 13, "damage": "1d6", "xp": 50},
            {"name": "Zombie", "hp": 22, "ac": 8, "damage": "1d6", "xp": 50},
        ],
        3: [
            {"name": "Bugbear", "hp": 27, "ac": 16, "damage": "2d8", "xp": 200},
            {"name": "Ogre", "hp": 59, "ac": 11, "damage": "2d8", "xp": 450},
            {"name": "Ghoul", "hp": 22, "ac": 12, "damage": "2d6", "xp": 200},
        ]
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
        
    def narrate(self, text):
        print(f"\n[DM]: {text}")
        
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
        self.narrate(f"    Enemy HP: {monster['hp']} | AC: {monster['ac']}")
        
        monster_hp = monster['hp']
        
        while monster_hp > 0 and self.character.hp > 0:
            print(f"\n[Your HP: {self.character.hp}/{self.character.max_hp}] [Enemy HP: {monster_hp}]")
            print("Actions: [1] Attack  [2] Defend  [3] Flee")
            
            action = input("Choose action: ").strip()
            
            if action == "1":  # Attack
                attack_roll = random.randint(1, 20)
                primary_stat = self.character.CLASSES[self.character.char_class]["primary"]
                attack_mod = self.character.get_modifier(primary_stat)
                total_attack = attack_roll + attack_mod
                
                if attack_roll == 20:
                    damage = self.roll_dice("2d6") + attack_mod  # Simplified crit
                    self.narrate(f"CRITICAL HIT! You strike for {damage} damage!")
                    monster_hp -= damage
                elif total_attack >= monster['ac']:
                    damage = self.roll_dice("1d8") + attack_mod
                    self.narrate(f"You hit! (Roll: {attack_roll}+{attack_mod}={total_attack} vs AC {monster['ac']}) Damage: {damage}")
                    monster_hp -= damage
                else:
                    self.narrate(f"You miss! (Roll: {attack_roll}+{attack_mod}={total_attack} vs AC {monster['ac']})")
                    
            elif action == "2":  # Defend
                self.narrate("You take a defensive stance, gaining +2 AC this round.")
                temp_ac_bonus = 2
            else:  # Flee
                if self.skill_check("dex", 12):
                    self.narrate("You successfully flee from combat!")
                    return False
                else:
                    self.narrate("You fail to escape!")
                    
            # Monster's turn (if still alive)
            if monster_hp > 0:
                monster_attack = random.randint(1, 20)
                if monster_attack >= self.character.ac:
                    damage = self.roll_dice(monster['damage'])
                    self.narrate(f"The {monster['name']} hits you for {damage} damage!")
                    if not self.character.take_damage(damage):
                        self.narrate("💀 You have fallen in battle!")
                        return "death"
                else:
                    self.narrate(f"The {monster['name']} misses!")
                    
        if monster_hp <= 0:
            self.narrate(f"🎉 Victory! The {monster['name']} is defeated!")
            xp_gained = monster['xp']
            self.character.experience += xp_gained
            self.narrate(f"You gain {xp_gained} XP! (Total: {self.character.experience})")
            
            # Check for level up (simplified: 300 XP per level)
            if self.character.experience >= self.character.level * 300:
                self.level_up()
            
            return True
        return False
    
    def level_up(self):
        self.character.level += 1
        hit_die = self.character.CLASSES[self.character.char_class]["hit_die"]
        hp_gain = random.randint(1, hit_die) + self.character.get_modifier("con")
        hp_gain = max(1, hp_gain)
        self.character.max_hp += hp_gain
        self.character.hp = self.character.max_hp
        self.narrate(f"🎊 LEVEL UP! You are now level {self.character.level}!")
        self.narrate(f"HP increased by {hp_gain}! (New max: {self.character.max_hp})")
    
    def explore(self):
        self.turn += 1
        loc_type = self.current_location['type']
        
        self.narrate(random.choice(self.EVENTS[loc_type]))
        
        # Random encounters based on danger level
        danger = self.current_location['danger']
        if danger > 0 and random.random() < 0.4:
            monster_tier = min(danger, 3)
            monster = random.choice(self.MONSTERS[monster_tier]).copy()
            self.narrate(f"⚠️  A {monster['name']} appears!")
            result = self.combat(monster)
            if result == "death":
                return "death"
            elif result:  # Victory
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
        usable = [item for item in self.character.inventory if "Potion" in item]
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
            if "Healing" in item:
                heal = self.roll_dice("2d4") + 2
                self.character.heal(heal)
                self.character.inventory.remove(item)
                self.narrate(f"You drink the potion and heal {heal} HP!")
        except (ValueError, IndexError):
            self.narrate("Invalid choice.")
    
    def travel(self):
        print("\nAvailable locations:")
        for i, loc in enumerate(self.LOCATIONS, 1):
            danger_stars = "⚠️" * loc['danger'] if loc['danger'] > 0 else "🏠"
            print(f"  [{i}] {loc['name']} ({loc['type']}) {danger_stars}")
        
        choice = input("Choose destination (0 to stay): ").strip()
        if choice == "0":
            return
            
        try:
            idx = int(choice) - 1
            self.current_location = self.LOCATIONS[idx]
            self.narrate(f"You travel to {self.current_location['name']}...")
            
            # Random encounter while traveling
            if random.random() < 0.3 and self.current_location['danger'] > 0:
                self.narrate("You encounter something on the road!")
                monster = random.choice(self.MONSTERS[1])
                self.combat(monster.copy())
        except (ValueError, IndexError):
            self.narrate("Invalid location.")
    
    def rest(self):
        if self.current_location['type'] == 'town':
            if self.character.gold >= 5:
                self.character.gold -= 5
                self.character.hp = self.character.max_hp
                self.narrate("You rest at the inn (5 gold). Fully healed!")
            else:
                self.narrate("You can't afford the inn (5 gold required).")
        else:
            self.narrate("You make camp and rest...")
            if random.random() < 0.3:
                self.narrate("Your rest is interrupted!")
                monster = random.choice(self.MONSTERS[1])
                self.combat(monster.copy())
            else:
                heal = self.roll_dice("1d8")
                self.character.heal(heal)
                self.narrate(f"You rest peacefully and recover {heal} HP.")


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
    
    dm.narrate(f"Welcome, {character.name} the {character.race} {character.char_class}!")
    dm.narrate(f"You begin your adventure at {dm.current_location['name']}.")
    
    # Main game loop
    while character.hp > 0:
        print(f"\n[HP: {character.hp}/{character.max_hp}] [Gold: {character.gold}] [Location: {dm.current_location['name']}]")
        print("-" * 50)
        print("Actions:")
        print("  [1] Explore      [4] Rest")
        print("  [2] Travel       [5] Character Sheet")
        print("  [3] Use Item     [6] Save & Quit")
        
        action = input("\nWhat do you do? ").strip()
        
        if action == "1":
            result = dm.explore()
            if result == "death":
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
        else:
            print("Invalid action.")
    
    if character.hp <= 0:
        print("\n" + "="*50)
        print("  💀 GAME OVER 💀")
        print(f"  {character.name} has fallen after {dm.turn} turns.")
        print(f"  Final Level: {character.level} | XP: {character.experience}")
        print("="*50)
        print("\n[1] Try again")
        print("[2] Quit")
        if input("Choose: ").strip() == "1":
            main()


if __name__ == "__main__":
    main()
