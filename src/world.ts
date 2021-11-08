import { HashMap,  Result, Vec } from "@rbxts/rust-classes";
import { Component, EntityRef, Ref } from "./entity_ref";
import { Entities, Entity, NoSuchEntity } from "./entities";
import { Archetype } from "./archetype";
import todo from "@rbxts/todo";

class QueryBorrow<w extends World, Q extends Query>{

}

class Query {

}
export class World {
	public constructor(
		private entity_to_component = HashMap.empty<Entity, defined>(),
		private entities = Entities.default(),
		private archetypes = { archetypes: new Array<Archetype<defined>>() },
	) {}

	public spawn(...components: Array<defined>): Entity {
		const entity = this.entities.alloc();

		this.entity_to_component.entry(entity).orInsert(components);

		return entity;
	}

	/**
	 * need macro to get typeId from T and find from components
	 */
	public get<T extends Component>(entity: Entity): Result<Ref<defined, T>, ComponentError> {
		return Result.ok(
			this.entity(entity)
				.unwrap()
				.get<T>()
				.okOrElse(() => Result.ok({}))
				.expect(ComponentError),
		);
	}

	public query<Components extends Array<defined>>(): Vec<[Entity, Components]> {
		todo()
	}

	public entity(entity: Entity): Result<EntityRef<defined>, NoSuchEntity> {
		const loc = this.entities.get(entity).unwrap();

		// eslint-disable-next-line prettier/prettier
		return Result.ok(new EntityRef(
			this.archetypes.archetypes[loc.archetype], 
			entity, 
			loc.index
		))
	}
}

export const ComponentError = "ComponentError";
export type ComponentError = typeof ComponentError;

