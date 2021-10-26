import { Result, Vec } from "@rbxts/rust-classes";
import { AtomicI64, Location } from "./entity_ref";

export class Entity {
	public generation;
	public id;
	public constructor(generation: number, id: number) {
		this.generation = generation;
		this.id = id;
	}
}

type EntityMeta = {
	generation: number;
	id: number;
	location: Location;
};

export class Entities {
	private constructor(
		public meta = Vec.vec<EntityMeta>(),
		private len = 0,
		private pending = Vec.vec<number>(),
		private free_cursor = new AtomicI64(0),
	) {}

	public static default(): Entities {
		return new Entities();
	}

	public alloc(): Entity {
		this.len++;
		print(this.len);

		return this.pending.pop().match(
			(id) => {
				const new_free_cursor = this.pending.len();
				this.free_cursor.store(new_free_cursor);

				return new Entity(this.meta.asPtr()[this.len].generation, id);
			},
			() => {
				const id = this.meta.len();
				return new Entity(1, id);
			},
		);
	}

	public get(entity: Entity): Result<Location, NoSuchEntity> {
		if (this.meta.len() <= entity.id) {
			return Result.ok(new Location(0, max_value));
		}

		const meta = this.meta.asPtr()[entity.id];
		if (meta.generation !== entity.generation) {
			return Result.err(NoSuchEntity);
		}

		return Result.ok(meta.location);
	}
}

export const NoSuchEntity = "NoSuchEntity";
export type NoSuchEntity = typeof NoSuchEntity;

export const max_value = 4294967295;
export type MaxValue = typeof max_value;
