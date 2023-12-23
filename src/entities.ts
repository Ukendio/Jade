import { match, when } from "@rbxts/rbxts-pattern";
import { Iterator, Option, Result, Vec } from "@rbxts/rust-classes";
import { Location } from "./entity_ref";

const u32_MAX = 0xffff_ffff;

class Range {
	private idx;

	public constructor(private range_start: number, private range_end: number) {
		this.idx = range_start;
	}

	public contains(n: number): boolean {
		return n > this.range_start && n < this.range_end;
	}

	public next(): Option<number> {
		if (this.idx < this.range_end) {
			return Option.some(this.idx++);
		}

		return Option.none();
	}

	public len(): number {
		return this.range_end - this.range_start;
	}

	public iter(): Iterator<number> {
		const buffer = new Array<number>();
		for (let i = this.range_start; i < this.range_end; i++) {
			buffer.push(i);
		}
		return Iterator.fromItems(...buffer);
	}

	public into(): [number, number] {
		return [this.range_start, this.range_end];
	}

	public *generator(): Generator<number> {
		let item = this.next();
		while (item.isSome()) {
			yield item.unwrap();
			item = this.next();
		}
	}
}

namespace Serde {
	export type Serializer = (data: Entity) => Entity;
}

function serialize<S extends Serde.Serializer>(serializer: S): <T extends Entity>(data: T) => Entity {
	return function (data: Entity): Entity {
		return serializer(data);
	};
}

export class Entity {
	public constructor(public generation: number, public id: number) {}

	public to_bits(): number {
		return this.generation << this.id;
	}

	public static from_bits(bits: number): Option<Entity> {
		return Option.some(new Entity(bits >> 32, bits));
	}

	public serialize<S extends Serde.Serializer>(serializer: S): Entity {
		return serialize(serializer)(this);
	}
}

export class ReserveEntitiesIterator {
	public constructor(private meta: Array<EntityMeta>, private id_iter: Iterator<number>, private id_range: Range) {}

	public next() {
		return this.id_iter
			.nextItem()
			.map((id) => new Entity(this.meta[id].generation, id))
			.orElse(() => this.id_range.next().map((id) => new Entity(1, id)));
	}

	public size_hint(): LuaTuple<[number, Option<number>]> {
		const len = this.id_iter.count() + this.id_range.iter().count();
		return [len, Option.some(len)] as LuaTuple<[number, Option<number>]>;
	}
}

export class Entities {
	private constructor(
		public meta = Vec.vec<EntityMeta>(),
		private length = 0,
		public pending = Vec.vec<number>(),
		private free_cursor = 0,
	) {}

	public static default(): Entities {
		return new Entities();
	}

	public reserve_entities(count: number): ReserveEntitiesIterator {
		const range_end = (this.free_cursor = count);

		const range_start = range_end - count;

		const freelist_range = new Range(math.max(0, range_start), math.max(0, range_end));

		const base = this.meta.len();

		const [new_id_start, new_id_end] =
			range_start >= 0
				? ([0, 0] as LuaTuple<[number, number]>)
				: [base - math.min(range_end), range_start - base];

		return new ReserveEntitiesIterator(
			this.meta.asPtr(),
			this.pending.drain(freelist_range.into()),
			new Range(new_id_start, new_id_end),
		);
	}

	public reserve_entity(): Entity {
		const n = (this.free_cursor -= 1);

		if (n > 0) {
			const id = this.pending.get(n - 1).unwrap()!;

			return new Entity(this.meta.asPtr()[id].generation, id);
		} else {
			return new Entity(1, this.meta.len() - n);
		}
	}

	private verify_flushed(): void {
		assert(!this.needs_flush(), "flush() needs to be called before this operation is legal");
	}

	public alloc(): Entity {
		this.verify_flushed();

		this.length++;

		return this.pending.pop().match(
			(id) => {
				const new_free_cursor = this.pending.len();
				this.free_cursor = new_free_cursor;

				return new Entity(this.meta.asPtr()[id].generation, id);
			},
			() => {
				const id = this.meta.len();
				this.meta.push(EntityMeta.EMPTY());
				return new Entity(1, id);
			},
		);
	}

	public alloc_many(n: number, archetype: number, first_index: number) {
		this.verify_flushed();

		const fresh = n - this.pending.len();

		assert(this.meta.len() + fresh < u32_MAX, "too many entities");

		const pending_end = this.pending.len() - n;
		for (const id of this.pending.drain([pending_end, this.pending.len()]).generator()) {
			this.meta.asPtr()[id].location = new Location(archetype, first_index);
			first_index++;
		}

		const fresh_start = this.meta.len();
		this.meta.append(
			new Range(first_index, first_index + fresh)
				.iter()
				.map((index) => new EntityMeta(1, new Location(archetype, index)))
				.collect(),
		);

		this.length += n;

		return new AllocManyState(pending_end, new Range(fresh_start, fresh_start + fresh));
	}

	public finish_alloc_many(pending_end: number): void {
		this.pending.truncate(pending_end);
	}

	public alloc_at(entity: Entity): Option<Location> {
		this.verify_flushed();

		const loc = match(entity.id)
			.when(
				(n: number) => n >= this.meta.len(),
				() => Option.none<Location>(),
			)
			.when(
				() => this.pending.iter().position((item) => item === entity.id),
				(index: number) => {
					this.pending.swapRemove(index);

					const new_free_cursor = this.pending.len();
					this.free_cursor = new_free_cursor;
					this.length++;
					return Option.none<Location>();
				},
			)
			.otherwise(() => {
				return Option.some<Location>((this.meta.asPtr()[entity.id].location = EntityMeta.EMPTY().location));
			});

		this.meta.asPtr()[entity.id].generation = entity.generation;

		return loc;
	}

	public free(entity: Entity): Result<Location, NoSuchEntity> {
		this.verify_flushed();

		return this.meta
			.get(entity.id)
			.okOr(NoSuchEntity)
			.map((meta) => {
				meta.generation = wrapping_add(meta.generation, 1).unwrapOrElse(() => 1);

				const loc = (meta.location = EntityMeta.EMPTY().location);

				this.pending.push(entity.id);

				const new_free_cursor = this.pending.len();
				this.free_cursor = new_free_cursor;
				this.length--;

				return loc;
			});
	}

	public contains(entity: Entity): boolean {
		return this.meta.get(entity.id).mapOr(true, (meta) => meta.generation === entity.generation);
	}

	public clear(): void {
		this.meta.clear();
		this.pending.clear();
		this.free_cursor = 0;
	}

	public get(entity: Entity): Result<Location, NoSuchEntity> {
		if (this.meta.len() <= entity.id) {
			return Result.ok(new Location(0, u32_MAX));
		}

		const meta = this.meta.asPtr()[entity.id];
		if (meta.generation !== entity.generation) {
			return Result.err(NoSuchEntity);
		}

		return Result.ok(meta.location);
	}

	public resolve_unknown_gen(id: number): Entity {
		const meta_len = this.meta.len();

		if (meta_len > id) {
			const meta = this.meta.asPtr()[id];
			return new Entity(meta.generation, id);
		} else {
			const free_cursor = this.free_cursor;
			const num_pending = math.max(-free_cursor, 0);

			if (meta_len + num_pending > id) {
				return new Entity(1, id);
			} else {
				error("entity id is out of range");
			}
		}
	}

	private needs_flush(): boolean {
		return this.free_cursor !== this.pending.len();
	}

	public flush(init: (n: number, loc: Location) => void): void {
		const free_cursor = this.free_cursor;

		const new_free_cursor = match(free_cursor)
			.when(
				(n) => n >= 0,
				() => free_cursor,
			)
			.otherwise(() => {
				const old_meta_len = this.meta.len();
				const new_meta_len = old_meta_len + -free_cursor;
				this.meta.resize(new_meta_len, EntityMeta.EMPTY());

				this.length += -free_cursor;

				for (const [id, meta] of this.meta.iter().enumerate().skip(old_meta_len).generator()) {
					init(id, meta.location);
				}

				this.free_cursor = 0;

				return 0;
			});

		this.length += this.pending.len() - new_free_cursor;

		for (const id of this.pending.drain([new_free_cursor, this.pending.len()]).generator()) {
			init(id, this.meta.asPtr()[id].location);
		}
	}

	public len(): number {
		return this.length;
	}
}

class AllocManyState {
	public constructor(public pending_end: number, public fresh: Range) {}

	public next(entities: Entities): Option<number> {
		if (this.pending_end < entities.pending.len()) {
			const id = entities.pending.asPtr()[this.pending_end];
			this.pending_end += 1;
			return Option.some(id);
		} else return this.fresh.next();
	}

	public len(entities: Entities): number {
		return this.fresh.len() + (entities.pending.len() - this.pending_end);
	}
}

export class EntityMeta {
	public constructor(public generation: number, public location: Location) {}

	public static EMPTY(): EntityMeta {
		return new EntityMeta(1, new Location(0, u32_MAX));
	}
}

export const NoSuchEntity = "NoSuchEntity" as const;
export type NoSuchEntity = typeof NoSuchEntity;

function wrapping_add(a: number, b: number): Result<number, string> {
	const sum = a + b;
	if (sum > u32_MAX) {
		return Result.err("exceeds byte limit");
	}

	return Result.ok(sum);
}
