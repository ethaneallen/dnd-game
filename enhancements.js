// ==================== PREMIUM ENHANCEMENTS FOR D&D GAME ====================
// This file adds enhanced dialogue choices, dynamic NPC interactions, and improved UI polish

// ==================== DIALOGUE CHOICE SYSTEM ====================
const DIALOGUE_ENCOUNTERS = {
    mysterious_stranger: {
        title: "A Mysterious Stranger",
        description: "A hooded figure approaches you in the shadows. Their eyes gleam with an otherworldly light.",
        image: "🧙‍♂️",
        choices: [
            {
                text: "Greet them warmly (Persuasion)",
                skill: "persuasion",
                dc: 12,
                success: {
                    text: "The stranger smiles and reveals a hidden map. 'You have a kind heart. This may aid your quest.'",
                    rewards: { gold: 25, item: "Ancient Map", xp: 50 }
                },
                failure: {
                    text: "The stranger eyes you suspiciously and vanishes into the mist — but not before picking your pocket as a parting lesson.",
                    rewards: { gold: -10 }
                }
            },
            {
                text: "Demand to know their business (Intimidation)",
                skill: "intimidation",
                dc: 14,
                success: {
                    text: "The stranger backs away, dropping a pouch of gold. 'Take it! Just leave me be!'",
                    rewards: { gold: 40, xp: 30 }
                },
                failure: {
                    text: "The stranger laughs mockingly. 'You have no power over me, fool!' They disappear, leaving you feeling foolish.",
                    rewards: { reputation: -5 }
                }
            },
            {
                text: "Observe them carefully (Insight)",
                skill: "insight",
                dc: 13,
                success: {
                    text: "You notice the stranger is actually a disguised merchant testing travelers. They reward your perception with a rare item.",
                    rewards: { item: "Ring of Protection", xp: 60 }
                },
                failure: {
                    text: "You misjudge them entirely — distracted by the wrong details, you waste precious time before they slip away.",
                    rewards: { time_lost: 1 }
                }
            },
            {
                text: "Ignore them and walk away",
                skill: null,
                dc: 0,
                success: {
                    text: "You continue on your path. Sometimes discretion is the better part of valor.",
                    rewards: {}
                }
            }
        ]
    },
    
    merchant_in_distress: {
        title: "Merchant Under Attack",
        description: "You hear cries for help! A merchant is being robbed by bandits on the road ahead.",
        image: "🛡️",
        choices: [
            {
                text: "Rush to their aid immediately (Combat)",
                skill: "combat",
                dc: 0,
                success: {
                    text: "You defeat the bandits! The grateful merchant rewards you generously.",
                    rewards: { gold: 50, reputation: 10, xp: 75 },
                    combat: { enemy: "Bandit", count: 2 }
                }
            },
            {
                text: "Sneak around and ambush the bandits (Stealth)",
                skill: "stealth",
                dc: 14,
                success: {
                    text: "You catch the bandits by surprise! They flee in terror, and the merchant is saved.",
                    rewards: { gold: 60, reputation: 15, xp: 100 }
                },
                failure: {
                    text: "The bandits spot you! Now you must fight them head-on.",
                    rewards: { reputation: 5 },
                    combat: { enemy: "Bandit", count: 2 }
                }
            },
            {
                text: "Negotiate with the bandits (Persuasion)",
                skill: "persuasion",
                dc: 16,
                success: {
                    text: "You convince the bandits that the merchant is under your protection. They back off, impressed by your authority.",
                    rewards: { gold: 30, reputation: 20, xp: 90 }
                },
                failure: {
                    text: "The bandits laugh at your attempt. 'Join us or die!' Combat begins.",
                    combat: { enemy: "Bandit", count: 2 }
                }
            },
            {
                text: "Keep walking - not your problem",
                skill: null,
                dc: 0,
                success: {
                    text: "You continue on your way. The merchant's screams fade behind you. Your conscience weighs heavy.",
                    rewards: { reputation: -15 }
                }
            }
        ]
    },
    
    cursed_artifact: {
        title: "A Glowing Artifact",
        description: "You discover a strange, glowing artifact half-buried in the ground. It pulses with magical energy.",
        image: "💎",
        choices: [
            {
                text: "Examine it carefully (Arcana)",
                skill: "arcana",
                dc: 15,
                success: {
                    text: "You identify it as a powerful but safe magical item. You carefully extract it.",
                    rewards: { item: "Amulet of Health", xp: 80 }
                },
                failure: {
                    text: "You trigger a magical trap! The artifact explodes with energy.",
                    rewards: { damage: "2d6", condition: "stunned" }
                }
            },
            {
                text: "Grab it quickly",
                skill: null,
                dc: 0,
                success: {
                    text: "You seize the artifact! But it's cursed - you feel your strength draining away.",
                    rewards: { item: "Cursed Amulet", condition: "weakened" }
                }
            },
            {
                text: "Destroy it (Strength)",
                skill: "athletics",
                dc: 14,
                success: {
                    text: "You smash the artifact with a heavy rock. It shatters, releasing trapped souls who bless you.",
                    rewards: { xp: 100, buff: "blessed" }
                },
                failure: {
                    text: "The artifact resists your attempts and releases a burst of dark energy!",
                    rewards: { damage: "1d8" }
                }
            },
            {
                text: "Leave it alone - too risky",
                skill: null,
                dc: 0,
                success: {
                    text: "Wisdom guides you to leave the artifact undisturbed. Sometimes the best treasure is the one you don't take.",
                    rewards: { xp: 25 }
                }
            }
        ]
    },
    
    tavern_gambler: {
        title: "A Gambling Challenge",
        description: "A confident gambler at the tavern challenges you to a game of dice. 'Care to test your luck, friend?'",
        image: "🎲",
        choices: [
            {
                text: "Accept the challenge (Bet 20 gold)",
                skill: "luck",
                dc: 12,
                cost: 20,
                success: {
                    text: "Fortune favors you! You win the game and earn the respect of the tavern patrons.",
                    rewards: { gold: 50, reputation: 5, xp: 40 }
                },
                failure: {
                    text: "The dice betray you. You lose your wager, but learn a valuable lesson about gambling.",
                    rewards: { gold: -20, xp: 10 }
                }
            },
            {
                text: "Cheat using sleight of hand (Sleight of Hand)",
                skill: "sleight_of_hand",
                dc: 16,
                cost: 20,
                success: {
                    text: "Your nimble fingers ensure victory! No one notices your deception.",
                    rewards: { gold: 60, xp: 50 }
                },
                failure: {
                    text: "You're caught cheating! The tavern erupts in anger.",
                    rewards: { gold: -20, reputation: -20, combat: { enemy: "Angry Patron", count: 1 } }
                }
            },
            {
                text: "Decline politely",
                skill: null,
                dc: 0,
                success: {
                    text: "You politely refuse. The gambler shrugs and moves on to another mark.",
                    rewards: {}
                }
            },
            {
                text: "Accuse them of cheating (Insight)",
                skill: "insight",
                dc: 14,
                success: {
                    text: "You spot their loaded dice! They're exposed as a fraud and kicked out. The tavern keeper rewards your sharp eye.",
                    rewards: { gold: 30, reputation: 10, xp: 60 }
                },
                failure: {
                    text: "Your accusation falls flat. You look paranoid and lose face.",
                    rewards: { reputation: -5 }
                }
            }
        ]
    },
    
    wounded_enemy: {
        title: "A Defeated Foe",
        description: "Your enemy lies defeated at your feet, bleeding and helpless. They look up at you with fear in their eyes.",
        image: "⚔️",
        choices: [
            {
                text: "Show mercy and spare them (Good)",
                skill: null,
                dc: 0,
                success: {
                    text: "You spare their life. They swear to abandon their evil ways and give you information about their hideout.",
                    rewards: { reputation: 15, xp: 50, info: "enemy_hideout" }
                }
            },
            {
                text: "Execute them (Evil)",
                skill: null,
                dc: 0,
                success: {
                    text: "You deliver the killing blow. Their companions will fear you, but your conscience is stained.",
                    rewards: { reputation: -10, gold: 15 }
                }
            },
            {
                text: "Interrogate them (Intimidation)",
                skill: "intimidation",
                dc: 13,
                success: {
                    text: "Fear loosens their tongue. They reveal valuable information about upcoming dangers.",
                    rewards: { xp: 60, info: "upcoming_ambush" }
                },
                failure: {
                    text: "They spit at you defiantly and reveal nothing. You let them crawl away — and word of your weakness spreads.",
                    rewards: { reputation: -5 }
                }
            },
            {
                text: "Heal them and let them go (Medicine)",
                skill: "medicine",
                dc: 12,
                success: {
                    text: "Your compassion moves them deeply. They vow to repay this debt someday.",
                    rewards: { reputation: 20, xp: 70, ally: "reformed_enemy" }
                },
                failure: {
                    text: "Your medical skills aren't enough. They die despite your efforts.",
                    rewards: { xp: 20 }
                }
            }
        ]
    }
};

// ==================== DYNAMIC SKILL CHECK EVENTS ====================
const SKILL_CHECK_EVENTS = {
    perception: [
        {
            description: "You notice something glinting in the underbrush...",
            dc: 12,
            success: "You discover a hidden cache containing valuable items!",
            failure: "It was just a trick of the light. Nothing there.",
            successRewards: { gold: 30, item: "Potion of Healing" },
            failureRewards: {}
        },
        {
            description: "You hear faint footsteps behind you. Someone is following!",
            dc: 14,
            success: "You spot the stalker and confront them - it's a friendly scout with a warning about dangers ahead.",
            failure: "You can't pinpoint the source. The feeling of being watched persists...",
            successRewards: { xp: 40, info: "danger_warning" },
            failureRewards: { ambush_chance: 0.3 }
        }
    ],
    
    investigation: [
        {
            description: "You search the area thoroughly for clues...",
            dc: 13,
            success: "You find tracks leading to a secret passage! This could be useful.",
            failure: "Despite your efforts, you find nothing of interest.",
            successRewards: { xp: 50, info: "secret_passage" },
            failureRewards: {}
        },
        {
            description: "Something about this room seems off. You investigate...",
            dc: 15,
            success: "You discover a hidden compartment containing treasure!",
            failure: "Your search turns up nothing. Perhaps you're being paranoid.",
            successRewards: { gold: 50, item: "Gem" },
            failureRewards: {}
        }
    ],
    
    survival: [
        {
            description: "You attempt to forage for food and supplies...",
            dc: 12,
            success: "You find edible plants and fresh water. You gather enough rations for the journey.",
            failure: "You find nothing edible. Your stomach growls with hunger.",
            successRewards: { item: "Rations", xp: 30 },
            failureRewards: { exhaustion: 1 }
        },
        {
            description: "You try to find the best path through this treacherous terrain...",
            dc: 14,
            success: "Your wilderness expertise guides you along a safe route, saving hours of travel.",
            failure: "You take a wrong turn and waste time backtracking through difficult terrain.",
            successRewards: { xp: 40 },
            failureRewards: { time_lost: 2 }
        }
    ],
    
    athletics: [
        {
            description: "You come across a steep cliff. You could climb it to take a shortcut...",
            dc: 13,
            success: "You scale the cliff with ease! The view from the top reveals a shortcut.",
            failure: "You slip and fall partway up, taking damage and bruising your pride.",
            successRewards: { xp: 50 },
            failureRewards: { damage: "1d6" }
        },
        {
            description: "A heavy boulder blocks your path. You could try to move it...",
            dc: 15,
            success: "With a mighty heave, you push the boulder aside, revealing a hidden alcove with treasure!",
            failure: "The boulder won't budge. You strain yourself trying.",
            successRewards: { gold: 40, xp: 60 },
            failureRewards: { exhaustion: 1 }
        }
    ],
    
    acrobatics: [
        {
            description: "You need to cross a narrow beam over a dangerous drop...",
            dc: 14,
            success: "You dance across the beam with perfect balance! Impressive.",
            failure: "You lose your footing and fall, taking damage from the drop.",
            successRewards: { xp: 50 },
            failureRewards: { damage: "2d6" }
        }
    ],
    
    nature: [
        {
            description: "You recognize some rare herbs growing nearby...",
            dc: 12,
            success: "You carefully harvest the herbs. These could be useful for crafting!",
            failure: "You accidentally crush the delicate plants. They're ruined.",
            successRewards: { item: "Healing Herbs", xp: 40 },
            failureRewards: {}
        }
    ]
};

// ==================== TACTICAL COMBAT MODIFIERS ====================
const TACTICAL_COMBAT_SITUATIONS = {
    high_ground: {
        name: "High Ground Advantage",
        description: "You have the high ground!",
        playerBonus: { attack: 2, damage: 0 },
        enemyPenalty: { attack: -1 }
    },
    
    cover: {
        name: "Partial Cover",
        description: "You're behind cover",
        playerBonus: { ac: 2 },
        enemyPenalty: { attack: -2 }
    },
    
    flanking: {
        name: "Flanking Position",
        description: "You and your ally flank the enemy!",
        playerBonus: { attack: 2, advantage: true },
        enemyPenalty: {}
    },
    
    darkness: {
        name: "Fighting in Darkness",
        description: "You can barely see your opponent",
        playerBonus: {},
        enemyPenalty: {},
        bothPenalty: { attack: -2, disadvantage: true }
    },
    
    difficult_terrain: {
        name: "Difficult Terrain",
        description: "The ground is treacherous",
        playerBonus: {},
        enemyPenalty: { attack: -1, ac: -1 }
    },
    
    surrounded: {
        name: "Surrounded!",
        description: "Enemies surround you on all sides",
        playerBonus: {},
        enemyPenalty: {},
        playerPenalty: { ac: -2, disadvantage_on_attacks: true }
    }
};

// ==================== ENHANCED NPC PERSONALITIES ====================
const NPC_PERSONALITY_TRAITS = {
    friendly_merchant: {
        greeting: [
            "Ah, welcome friend! What can I interest you in today?",
            "Good to see you! I've got some fine wares for sale.",
            "Well met, traveler! Looking for supplies?"
        ],
        haggle_success: [
            "You drive a hard bargain! Very well, I accept.",
            "Alright, alright! You've convinced me. Deal!",
            "Your silver tongue has won the day. It's yours."
        ],
        haggle_failure: [
            "I'm sorry, but I can't go any lower than that.",
            "That's my final offer, friend. Take it or leave it.",
            "I've got a business to run! That's the best I can do."
        ],
        farewell: [
            "Safe travels, friend!",
            "Come back anytime!",
            "May fortune smile upon you!"
        ]
    },
    
    grumpy_guard: {
        greeting: [
            "State your business.",
            "What do you want?",
            "Move along if you've got nothing important."
        ],
        bribe_success: [
            "*pockets the gold* I didn't see anything. Go on through.",
            "Well now, that changes things. You may pass.",
            "*looks around nervously* Make it quick."
        ],
        bribe_failure: [
            "Are you trying to bribe me?! That's it, you're under arrest!",
            "I'm not that kind of guard. Get out of here!",
            "Insulting! I should throw you in the stocks for that."
        ],
        intimidate_success: [
            "*steps aside nervously* F-fine, go ahead...",
            "I don't want any trouble. Just... just go.",
            "*swallows hard* You didn't hear this from me, but..."
        ],
        intimidate_failure: [
            "You threatening me? I'll have you in chains!",
            "*blows whistle* Guards! We've got a troublemaker!",
            "Big mistake, friend. BIG mistake."
        ]
    },
    
    mysterious_informant: {
        greeting: [
            "*whispers* I have information... for a price.",
            "Psst! Over here. I know things you need to know.",
            "*looks around nervously* You looking for answers?"
        ],
        payment_success: [
            "*pockets the gold* Listen carefully. What I'm about to tell you could save your life...",
            "Smart. Very smart. Here's what you need to know...",
            "*leans in close* This is what I know..."
        ],
        payment_failure: [
            "No gold, no information. That's how this works.",
            "*shakes head* Come back when you can afford it.",
            "I don't work for free, friend."
        ],
        farewell: [
            "*melts into the shadows*",
            "Remember - you didn't hear this from me.",
            "*disappears into the crowd*"
        ]
    }
};

// ==================== CONSEQUENCE SYSTEM ====================
const CONSEQUENCE_TRACKER = {
    // Track player choices and their long-term effects
    choices: {},
    
    recordChoice: function(choiceId, outcome) {
        this.choices[choiceId] = {
            outcome: outcome,
            timestamp: Date.now()
        };
    },
    
    hasChoice: function(choiceId) {
        return this.choices.hasOwnProperty(choiceId);
    },
    
    getChoice: function(choiceId) {
        return this.choices[choiceId];
    },
    
    // Check if a choice affects current situation
    getConsequences: function(situation) {
        const consequences = [];
        
        // Example: If you spared an enemy earlier, they might help you now
        if (this.hasChoice('spared_bandit') && situation === 'bandit_encounter') {
            consequences.push({
                text: "Wait... you're the one who spared my life! I owe you a debt.",
                effect: "bandit_helps"
            });
        }
        
        // If you helped a merchant, they give you discounts
        if (this.hasChoice('saved_merchant') && situation === 'shopping') {
            consequences.push({
                text: "You saved my life! Please, take a 20% discount on all my wares.",
                effect: "merchant_discount_20"
            });
        }
        
        // If you were cruel, NPCs remember
        if (this.hasChoice('executed_prisoner') && situation === 'town_reputation') {
            consequences.push({
                text: "Word of your cruelty has spread. The townsfolk eye you with suspicion.",
                effect: "reputation_penalty"
            });
        }
        
        return consequences;
    }
};

// Export for use in main game
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        DIALOGUE_ENCOUNTERS,
        SKILL_CHECK_EVENTS,
        TACTICAL_COMBAT_SITUATIONS,
        NPC_PERSONALITY_TRAITS,
        CONSEQUENCE_TRACKER
    };
}
