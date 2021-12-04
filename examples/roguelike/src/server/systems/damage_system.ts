import { Entity, World } from "@rbxts/jade";
import { Vec } from "@rbxts/rust-classes";
import { CombatStats } from "../components/combat_stats";
import { SufferDamage } from "../components/suffer_damage";

export namespace DamageSystem {
	export function update(world: World) {
		const entities = world
			.query<[CombatStats, SufferDamage]>()
			.iter()
			.map(([entity, components]) => [entity, ...components] as const)
			.collect()
			.generator();

		for (const [_, stats, damage] of entities) {
			stats.hp -= damage.amount.iter().sum();
		}
	}

	export function delete_the_dead(world: World): void {
		const dead = Vec.vec<Entity>();
		{
			const combat_stats = world.query<[CombatStats]>().generator();

			for (const [entity, [stats]] of combat_stats) {
				if (stats.hp < 1) dead.push(entity);
			}
		}

		for (const victim of dead.generator()) {
			world.despawn(victim).expect("Unable to delete");
		}
	}
}
