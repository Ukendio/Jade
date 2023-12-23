import { HashMap, Iterator, Option, Result, Vec } from "@rbxts/rust-classes";
import { NoSuchEntity } from "./entities";
import type { Component } from "./entity_ref";
import { NonNull } from "./non_null";
import { todo } from "@rbxts/todo";

interface TypeInfo {
	id: TypeId;
}

function TypeIdInfo<T>(): number {
	return 1;
}

export const enum Ordering {
	Less = -1,
	Equal = 0,
	Greater = 1,
}

function binary_search_by<a extends Array<unknown>, F extends (T: number) => Ordering>(
	data: a,
	f: F,
): Result<number, number> {
	let size = data.size();
	let left = 0;
	let right = size;

	while (left < right) {
		const mid = left + size / 2;

		const cmp = f(mid);

		if (cmp === Ordering.Less) {
			left = mid + 1;
		} else if (cmp === Ordering.Greater) {
			right = mid;
		} else {
			return Result.ok(mid);
		}

		size = right - left;
	}

	return Result.err(left);
}

function binary_search_by_key<T, a extends Array<unknown>, B extends number, F extends (T: number) => B>(
	data: a,
	b: B,
	f: F,
): Result<number, number> {
	return binary_search_by(data, (k) => cmp(f(k), b));
}

function cmp(a: number, by: number): number {
	return 1;
}

class OrderedTypeIdMap<V> {
	private _0;
	private constructor(vals: Vec<[TypeId, V]>) {
		this._0 = vals;
	}

	public default<T>(iter: Iterator<[TypeId, T]>): OrderedTypeIdMap<T> {
		const vals = iter.collect().asPtr();
		table.sort(vals, ([a], [b]) => b.type_id() < a.type_id());
		return new OrderedTypeIdMap(Vec.fromPtr(vals));
	}

	public search(id: TypeId): Option<number> {
		todo();
	}

	public contains_key(id: TypeId): boolean {
		return this.search(id).isSome();
	}

	public get(id: TypeId): Option<V> {
		return this.search(id).map((idx) => this._0.asPtr()[idx][1]);
	}
}

type TypeIdMap<V> = HashMap<TypeId, V>;

export class Archetype {
	public constructor(
		public types: Vec<TypeInfo>,
		public index: OrderedTypeIdMap<number>,
		public len: number,
		public entities: Iterator<number>,
		public data: Iterator<Data>,
		public remove_edges: TypeIdMap<number>,
	) {}

	public allocate(id: number): number {
		todo();
	}

	public get_state<T>(): Result<T, NoSuchEntity> {
		todo();
	}

	public get_base<T>(state: T): NonNull<T> {
		return new NonNull<T>(state);
	}

	public borrow<T>(state: T): void {}

	public release<T>(state: T): void {}

	public remove(index: number, drop: boolean): Option<number> {
		const last = this.len - 1;
		for (const [ty, data] of this.types.iter().zip(this.data).generator()) {
			todo();
		}

		todo();
	}
}

interface Data {
	state: number;
	storage: NonNull<number>;
}

class ColumnRef<T extends Component> {
	private constructor(public archetype: Archetype, public column: [T]) {}

	public deref(): [T] {
		return this.column;
	}

	public drop(): void {
		const state = this.archetype.get_state<T>().unwrap();
		this.archetype.release<T>(state);
	}

	public clone(): ColumnRef<T> {
		const state = this.archetype.get_state<T>().unwrap();
		this.archetype.borrow<T>(state);
		return new ColumnRef(this.archetype, this.column);
	}
}

class TypeId {
	public t: TypeId;

	private constructor(t: TypeId) {
		this.t = t;
	}

	public static of<T>(): TypeId {
		return new TypeId(todo());
	}

	public type_id(): number {
		todo();
	}
}

class TypeInfo {
	private constructor(public id: TypeId) {}

	public static of<T>() {
		return new TypeInfo(TypeId.of<T>());
	}
}
