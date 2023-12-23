import { Option, Result } from "@rbxts/rust-classes";
import { Archetype } from "./archetype";
import { Entity, NoSuchEntity } from "./entities";
import { NonNull } from "./non_null";
import { todo } from "@rbxts/todo";

export type Component = defined;

export class Location {
	public constructor(public archetype: number, public index: number) {}
}

export class EntityRef {
	public constructor(public archetype: Archetype, public entity_handle: Entity, public index: number) {}

	public entity(): Entity {
		return this.entity_handle;
	}

	public get<T extends Component>(): Option<Ref<T>> {
		//the idea is that archetypes are ordered maps of typeIDs, and we move the index depending on the type_id which is T
		return Option.some(Ref.default<T>(this.archetype, this.index).unwrap());
	}
}

export class Ref<T extends Component> {
	private constructor(public archetype: Archetype, private state: number, private target: NonNull<T>) {}

	public static default<T extends Component>(archetype: Archetype, index: number): Result<Ref<T>, NoSuchEntity> {
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
