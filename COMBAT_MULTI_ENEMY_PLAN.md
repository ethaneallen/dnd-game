# Tactical Combat (#4) — Migration Plan

**Status:** ✅ IMPLEMENTED (all stages 0–4 + latent-bug fix). Logic smoke-tested; needs in-browser playtest.
**Goal:** Multi-enemy fights + light positioning, without breaking the working 1v1 engine.

## Implementation notes (what shipped)
- **Stage 0:** `dm.enemies` array is source of truth; `dm.currentEnemy` is a getter/setter alias (single assign → `[monster]`, null → clears). All 18 legacy refs untouched.
- **Stage 1:** `handleMonsterDeath` splices the dead enemy and only `endCombat(true)` when none remain (else retargets). `monsterTurn()` now loops living enemies via `monsterAct(monster)`; end-of-round bookkeeping moved to `endMonsterRound()` (runs once). `combatAction` and `castSpell` continue the turn when enemies remain.
- **Stage 2:** `#enemyCards` strip (shown only when >1 enemy) via `renderEnemies()` + `selectTarget()`. Refreshed inside `updateEnemyHpBar`. AoE spells (`spell.aoe`) splash half-damage to other enemies; multi-slain resolved in `castSpell`.
- **Stage 3:** `triggerAmbushCheck` builds `_ambushGroup` (1–3 by danger, bosses solo) and starts it via `startCombatGroup` at every entry point (`startPack()`).
- **Stage 4:** `inferEnemyRange()` tags enemies melee/ranged from stat-block text; shown as ⚔️/🏹 on cards + outnumbered flavor log.
- **Bug fix:** undefined `handleEnemyDefeat` (Alchemist's Fire) routed to `handleMonsterDeath`; also fixed its `this.` → `this.dm.` combat-state refs.
- Combat state is not persisted in saves (pre-existing design), so no save-format changes were needed.

---

## 1. What the engine assumes today

Combat is built around a **single** enemy held in `this.dm.currentEnemy`. Surveyed scope:

- **`currentEnemy` references:** 18 total (very tractable — not "dozens").
- **Core functions:**
  - `startCombat(monster)` — sets `currentEnemy`, renders the one-enemy panel.
  - `combatAction(action)` — player turn; `const monster = this.dm.currentEnemy` drives attack/spell/grapple/shove.
  - `monsterTurn()` — `const monster = this.dm.currentEnemy`; one enemy acts, picks player or companion target.
  - `handleMonsterDeath(monster)` — grants XP/loot, then **unconditionally `endCombat(true)`**. ← key change point.
  - `endCombat(victory)` — clears `currentEnemy`, hides panel.
  - `castSpell(spellName)` — `const monster = this.dm.currentEnemy`.
  - `updateEnemyHpBar()` + ~6 direct `getElementById("enemyHp"/"enemyName")` writes — single-enemy UI.
- **UI:** `#combatPanel` shows exactly one `#enemyName`, `#enemyHp`, `#enemyHpBar`, `#enemyImage`.

### Latent bug found during survey
`handleEnemyDefeat(this.currentEnemy)` is **called** (Alchemist's Fire, line ~22345) but **never defined**. It would throw if that item killed an enemy. Fix opportunistically during this work (route it to `handleMonsterDeath`).

---

## 2. Design

- Introduce `this.dm.enemies` = **array** of monster objects. Keep `this.dm.currentEnemy` as a **getter/compatibility alias** pointing at the current *primary target* so untouched code keeps working during migration.
- Player chooses a **target** among living enemies (default = first living). A target selector appears only when >1 enemy.
- `monsterTurn()` loops over **all living enemies**, each taking its turn.
- A death removes one enemy from the array; **combat only ends when the array is empty** (victory) or the player flees/dies.
- **Positioning (Part B, phase 4):** each enemy gets a `range: "melee" | "ranged"` tag. Melee flanking/AoE/“high ground” hooks that already exist in code key off this. Lightweight — no grid.

---

## 3. Staged rollout (each stage independently shippable & testable)

**Stage 0 — Safety net (no behavior change)**
- Add `this.dm.enemies = []` and a `currentEnemy` compatibility alias (primary target = `enemies[0]` or null).
- `startCombat(monster)` pushes a single enemy into the array. Everything else still reads `currentEnemy`.
- ✅ Result: identical 1v1 behavior, but the data model is now array-backed. Fully regression-safe.

**Stage 1 — Multi-enemy under the hood**
- `startCombat` accepts either one monster or an array (`startCombatGroup([...])`).
- `handleMonsterDeath` removes the dead enemy; only calls `endCombat(true)` when `enemies` is empty. Otherwise promotes the next living enemy to primary target.
- `monsterTurn()` iterates all living enemies.
- UI still shows only the **primary** enemy for now.
- ✅ Result: group fights work mechanically; UI shows one-at-a-time. Testable via a forced 2-enemy encounter.

**Stage 2 — Multi-enemy UI**
- `#combatPanel` renders a **row of enemy cards** (name + HP bar + portrait), the targeted one highlighted.
- Clicking a card sets the target. Attacks/spells hit the target; AoE spells hit all.
- ✅ Result: the player can see and pick targets.

**Stage 3 — Encounter sources**
- Let exploration/ambush/discovery-beat encounters roll **1–3 enemies** (scaled by location danger). Bosses stay solo (or boss + minions later).
- ✅ Result: group fights actually occur in normal play.

**Stage 4 — Positioning (Part B)**
- Tag enemies `melee`/`ranged`; wire the existing flanking/cover/high-ground flavor to it. Optional “close distance” action.
- ✅ Result: spatial feel, still no grid.

---

## 4. Risk & mitigation

- **Highest risk:** `handleMonsterDeath` → `endCombat` coupling. Mitigated by Stage 1 isolating that single change.
- **Save compatibility:** mid-combat saves are rare; `enemies` array serializes fine. Old saves (no `enemies`) rebuild from `currentEnemy` on load.
- **Companion/AoE/status code** all currently assume one monster — touched only in Stage 1+, behind the alias.
- **Rollback:** Stages 0–1 keep the `currentEnemy` alias, so any stage can be reverted without touching the rest.

**Recommendation:** build Stage 0 + Stage 1 first, verify a 2-enemy fight end-to-end, then proceed. Stop after any stage and the game is still shippable.
