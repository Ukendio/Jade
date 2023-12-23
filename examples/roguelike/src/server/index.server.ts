import { World } from "@rbxts/jade";
import { Players, RunService } from "@rbxts/services";
import { CombatStats } from "./components/combat_stats";
import { DamageSystem } from "./systems/damage_system";
import { MeleeCombatSystem } from "./systems/melee_combat_system";

const world = new World();

async function on_player_added(player: Player): Promise<void> {
	const player_entity = world.spawn(
		player,
		player.Name,
		record<CombatStats>({ max_hp: 30, hp: 30, defense: 2, power: 5 }),
	);
}

Players.PlayerAdded.Connect(on_player_added);
for (const player of Players.GetPlayers()) {
	on_player_added(player);
}

RunService.Heartbeat.Connect(() => {
	DamageSystem.update(world);
	MeleeCombatSystem.update(world);
});
