import { Entity, World } from "@rbxts/jade";
import { Vec } from "@rbxts/rust-classes";
import { CombatStats } from "../components/combat_stats";
import { SufferDamage } from "../components/suffer_damage";
import { WantsToMelee } from "../components/wants_to_melee";

export namespace MeleeCombatSystem {
	export function update(world: World) {
		const entities = world
			.query<[WantsToMelee, string, CombatStats, SufferDamage]>()
			.iter()
			.map(([entity, components]) => [entity, ...components] as const)
			.collect()
			.generator();

		for (const [_, wants_melee, name, stats, inflict_dmg] of entities) {
			if (stats.hp > 0) {
				const target_stats = get_combat_stats(world, wants_melee.target);
				if (target_stats.hp > 0) {
					const target_name = get_player_name(world, wants_melee.target);

					const damage = math.max(0, stats.power - target_stats.defense);

					if (damage === 0) {
						print(`${name} unable to hurt ${target_name}`);
					} else {
						print(`${name} hits ${target_name}, for ${damage} hp.`);
						new_damage(world, inflict_dmg, wants_melee.target, damage);
					}
				}
			}
		}
	}
}

function new_damage(world: World, inflict_damage: SufferDamage, victim: Entity, amount: number): void {
	world.get<SufferDamage>(victim).match(
		(suffering) => {
			suffering.deref().amount.push(amount);
		},
		() => {
			const dmg = new SufferDamage(Vec.fromPtr([amount]));
			world.insert(victim, dmg).expect("Unable to insert damage");
		},
	);
}

function get_combat_stats(world: World, target: Entity): CombatStats {
	return world.get<CombatStats>(target).unwrap().deref();
}

function get_player_name(world: World, target: Entity): string {
	return world.get<string>(target).unwrap().deref();
}
