import { Option, Result } from "@rbxts/rust-classes";
import { Archetype } from "./archetype";
import { Entity, NoSuchEntity } from "./entities";
import { NonNull } from "./non_null";
import { todo } from "@rbxts/todo";

export type Component = defined;

export class Location {
	public archetype;
	public index;
	public constructor(archetype: number, index: number) {
		this.archetype = archetype;
		this.index = index;
	}
}

export class EntityRef<a extends Component> {
	private archetype;
	private entity_handle;
	private index;
	public constructor(archetype: Archetype<a>, entity: Entity, index: number) {
		this.archetype = archetype;
		this.entity_handle = entity;
		this.index = index;
	}

	public entity(): Entity {
		return this.entity_handle;
	}

	public get<T extends Component>(): Option<Ref<a, T>> {
		//the idea is that archetypes are ordered maps of typeIDs, and we move the index depending on the type_id which is T
		return Option.some(Ref.default<a, T>(this.archetype, this.index).unwrap());
	}
}

export class Ref<a, T extends Component> {
	public archetype;
	private state;
	private target;
	private constructor(archetype: Archetype<a>, state: number, target: NonNull<T>) {
		this.archetype = archetype;
		this.state = state;
		this.target = target;
	}

	public static default<a, T extends Component>(
		archetype: Archetype<a>,
		index: number,
	): Result<Ref<a, T>, NoSuchEntity> {
		todo();
		/*
		return archetype.get_state().match(
			(state) => {
				const target = new NonNull<T>(archetype.get_base<T>(state).as_ref());
				archetype.borrow(state);

				return Result.ok(new this<a, T>(archetype, state, target));
			},
			() => Result.err(NoSuchEntity),
		);
		*/
	}

	public deref(): T {
		return this.target.as_ref();
	}
}
