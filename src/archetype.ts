import { Result, Vec } from "@rbxts/rust-classes";
import { NoSuchEntity } from "./entities";
import type { Component } from "./entity_ref";
import { NonNull } from "./non_null";
import todo from "@rbxts/todo";

type TypeIdInfo = number;
function TypeIdInfo<T>(): number {
	return 1;
}

export class Archetype<a extends Component> {
	//missing typeInfo macro
	public types: Vec<TypeIdInfo> = todo();

	public get_state<T>(): Result<T, NoSuchEntity> {
		todo();
	}

	public get_base<T>(state: T): NonNull<T> {
		return new NonNull<T>(state);
	}

	public borrow<T>(state: T): void {
		todo();
	}
}
