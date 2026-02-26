D&D Game - Ambient Soundscapes System
==================================

Place your mp3 in this folder with the following names:

📂C:\webapp\dnd-game\
  ├── public\
  │   └── sounds\
  │       ├── tavern-fire.mp3
  │       ├── forest-wind.mp3
  │       ├── cave-ambience.mp3
  │       ├── town-square.mp3
  │       └── dungeon-drips.mp3
  ├── game.js
  ├── index.html
  └── package.json

🎮The soundscapes will play:

🔥 Tavern Fire → when in taverns/inns
🌲 Forest Wind → in wilderness/forests
🕳️ Cave Ambience → in caves
🏘️ Town Square → in towns
💀 Dungeon Drips → in dungeons

🛠️Soundscape Limitations:
1. File Format & Size

Format: MP3 only (hardcoded in the code)
Recommended size: Under 1-2MB each for fast loading
Location: Must be in sounds folder
2. Required Files
You need exactly these 5 files:

tavern-fire.mp3 - Taverns, Inns
forest-wind.mp3 - Forests, Wilderness
cave-ambience.mp3 - Caves, Crypts
town-square.mp3 - Towns (default)
dungeon-drips.mp3 - Dungeons, Lairs

3. Audio Properties
Must loop seamlessly - No gaps or clicks between loops
Volume controlled by settings (0-100%)
Single track at a time - Can't layer multiple soundscapes
Auto-plays on travel - Only triggers when moving to new location

4. Browser Compatibility
Works in all modern browsers (Chrome, Firefox, Safari, Edge)
Requires user interaction first (click/play) due to autoplay policies
Some browsers may block autoplay until user enables it

5. Performance
One audio element active at a time
Pauses/clears when switching locations
Doesn't use much CPU or memory
Settings persist via localStorage
6. Location Detection
Soundscapes play based on:

✨Location name keywords (checked first):
"tavern", "inn" → tavern-fire.mp3
"forest", "jungle", "wood" → forest-wind.mp3
"cave", "cavern", "crypt" → cave-ambience.mp3
"dungeon", "lair" → dungeon-drips.mp3
Everything else → town-square.mp3
Location type (fallback):
type: "town" → town-square.mp3
type: "dungeon" → dungeon-drips.mp3
type: "wilderness" → forest-wind.mp3
7. Settings Control
Toggle: ON/OFF in Settings menu
Volume: 0-100% slider (saved to localStorage)
Settings persist across page refreshes
Is there a specific limitation you'd like me to address or change?


