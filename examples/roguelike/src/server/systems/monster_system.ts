import Make from "@rbxts/make";
import { match, __ } from "@rbxts/rbxts-pattern";
import { Vec } from "@rbxts/rust-classes";
import { World } from "@rbxts/jade";

const orc = (world: World, pos: Vector3) => monster(world, pos, "Orc");
const goblin = (world: World, pos: Vector3) => monster(world, pos, "Goblin");

function monster<S extends string>(world: World, pos: Vector3, name: S): void {
	const part = Make("Part", { BrickColor: new BrickColor("Really red"), Name: name, Position: pos }) as Part;
	world.spawn(name, pos, part);
}

export function random_monster(world: World, pos: Vector3): void {
	let roll: number;
	{
		const rng = new Random();
		roll = rng.NextInteger(1, 2);
	}

	match(roll)
		.with(1, () => orc(world, pos))
		.with(__, () => goblin(world, pos))
		.exhaustive();
}

const MAX_MONSTERS = 4;
const MAX_ITEMS = 2;

const MAP_WIDTH = 80;
const MAP_DEPTH = 43;

const monster_spawn_points = Vec.vec<number>();
const item_spawn_points = Vec.vec<number>();

function corners(rect: Region3): LuaTuple<[number, number, number, number]> {
	const bottom_front_left = rect.CFrame.mul(
		new CFrame(new Vector3(rect.Size.X / 2, rect.Size.Y / 2, rect.Size.Z / 2)),
	);

	const x1 = bottom_front_left.Position.X;
	const z1 = bottom_front_left.Position.Z;

	const bottom_back_right = rect.CFrame.mul(
		new CFrame(new Vector3(rect.Size.X / 2, -(rect.Size.Y / 2), rect.Size.Z / 2)),
	);

	const x2 = bottom_back_right.Position.X;
	const z2 = bottom_back_right.Position.Y;

	return [x1, z1, x2, z2] as LuaTuple<[number, number, number, number]>;
}

function spawn_room(world: World, room: Region3): void {
	const room_pos = room.CFrame.Position;
	const rng = new Random();
	const num_monsters = rng.NextInteger(1, MAX_MONSTERS);
	const num_items = rng.NextInteger(1, MAX_ITEMS);

	{
		const [x1, z1, x2, z2] = corners(room);
		for (let i = 0; i < num_monsters; i++) {
			let added = false;
			while (!added) {
				const x = room_pos.X + rng.NextInteger(1, math.abs(x2 - x1));
				const y = room_pos.Y + rng.NextInteger(1, math.abs(z2 - z1));

				const idx = y * MAP_WIDTH + x;

				if (!monster_spawn_points.contains(idx)) {
					monster_spawn_points.push(idx);
					added = true;
				}
			}
		}

		for (let i = 0; i < num_items; i++) {
			let added = false;

			while (!added) {
				const x = room_pos.X + rng.NextInteger(1, math.abs(x2 - x1));
				const y = room_pos.Y + rng.NextInteger(1, math.abs(z2 - z1));

				const idx = y * MAP_WIDTH + x;

				if (!item_spawn_points.contains(idx)) {
					item_spawn_points.push(idx);
					added = true;
				}
			}
		}
	}

	for (const idx of monster_spawn_points.iter().generator()) {
		const x = idx % MAP_WIDTH;
		const z = idx & MAP_DEPTH;

		random_monster(world, new Vector3(x, 0, z));
	}
}

export namespace MonsterSystem {
	export function update(world: World) {
		const entities = world
			.query<[string, Vector3, Part]>()
			.iter()
			.map(([e, [name, pos, ren]]) => [e, name, pos, ren] as const)
			.collect();

		for (const [_, name, pos, ren] of entities.generator()) {
			if (pos.sub(ren.Position).Magnitude < 4) {
				if (name === "Goblin") {
					print("hello");
				}
			}
		}
	}
}
