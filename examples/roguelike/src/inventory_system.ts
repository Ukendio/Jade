import { Vec } from "@rbxts/rust-classes";
import { Entity, World } from "index";
import { IndexSignatureDeclaration } from "typescript";

interface Backup {
	owner: Entity;
}

interface WantsToPickupItem {
	collected_by: Entity;
	item: Entity;
}

export namespace InventorySystem {
	export function update(world: World): void {
		const entities = world
			.query<[Player, WantsToPickupItem, Vec<Vector3>]>()
			.iter()
			.map(([e, [plr, act, pos]]) => [e, plr, act, pos] as const)
			.collect();

		for (let [_, plr, wants_pickup, positions] of entities.generator()) {
		}
	}
}
