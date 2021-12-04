import { HashMap, Iterator, Option, Result, UnitType, Vec } from "@rbxts/rust-classes";
import { Component, EntityRef, Ref } from "./entity_ref";
import { Entities, Entity, NoSuchEntity, ReserveEntitiesIterator } from "./entities";
import { Archetype } from "./archetype";
import { todo } from "@rbxts/todo";

class QueryBorrow<w extends World, Q extends Query> {}

class Query {}

export class World {
	public constructor(
		private entity_to_component = HashMap.empty<Entity, defined>(),
		private entities = Entities.default(),
		private archetypes = { archetypes: new Array<Archetype>() },
	) {}

	public spawn(...components: Array<defined>): Entity {
		const entity = this.entities.alloc();

		this.entity_to_component.entry(entity).orInsert(components);

		return entity;
	}

	public spawn_batch<I>(iter: Iterator<I>) {
		todo();
	}

	public reserve_entities(count: number): ReserveEntitiesIterator {
		return this.entities.reserve_entities(count);
	}

	public reserve_entity(): Entity {
		return this.entities.reserve_entity();
	}

	public despawn(entity: Entity): Result<UnitType, NoSuchEntity> {
		this.flush();

		return this.entities.free(entity).match(
			(loc) => {
				return this.archetypes.archetypes[loc.archetype].remove(loc.index, true).match(
					(moved) => {
						this.entities.meta.asPtr()[moved].location.index = loc.index;
						return Result.ok({});
					},
					() => Result.err(NoSuchEntity),
				);
			},
			(reason) => Result.err(reason),
		);
	}

	/**
	 * need macro to get typeId from T and find from components
	 */
	public get<T extends Component>(entity: Entity): Result<Ref<T>, ComponentError> {
		return Result.ok(
			this.entity(entity)
				.unwrap()
				.get<T>()
				.okOrElse(() => Result.ok({}))
				.expect(ComponentError),
		);
	}

	public query<Components extends Array<defined>>(): Vec<[Entity, Components]> {
		todo();
	}

	public entity(entity: Entity): Result<EntityRef, NoSuchEntity> {
		const loc = this.entities.get(entity).unwrap();

		return Result.ok(new EntityRef(this.archetypes.archetypes[loc.archetype], entity, loc.index));
	}

	public insert(entity: Entity, components: Array<defined>): Result<UnitType, NoSuchEntity> {
		todo();
	}

	public flush(): void {}
}

class SpawnBatchIter<I> {
	public constructor(
		private inner: Iterator<I>,
		private entities: Entities,
		private archetype_id: number,
		private archetype: Archetype,
	) {}

	public next(): Option<Entity> {
		return this.inner.nextItem().match(
			(components) => {
				const entity = this.entities.alloc();
				const index = this.archetype.allocate(entity.id);
				todo();
			},
			() => Option.none(),
		);
	}
}

export const ComponentError = "ComponentError";
export type ComponentError = typeof ComponentError;
