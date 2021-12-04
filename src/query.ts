import { HashMap, Iterator, Option } from "@rbxts/rust-classes";
import { todo } from "@rbxts/todo";
import { Component } from "./entity_ref";
import { Archetype } from "./archetype";
import { Entity, EntityMeta } from "./entities";
import { NonNull } from "./non_null";

export class Query {
	[key: string]: Fetch;
	public static Fetch: Fetch;
}

export interface Fetch {
	Item: unknown;
}

class FetchRead<T extends Component> {
	public Item: T = todo();
	public State: number = todo();

	public static dangling<T extends Component>(): FetchRead<T> {
		return new this<T>();
	}
}

type QueryItem<Q extends Query> = Q["Fetch"]["Item"];

export const enum Access {
	Iterate = 2,
	Read = 4,
	Write = 6,
}

export class PreparedQueryIter<Q extends Query> {
	public constructor(
		private meta: Array<EntityMeta>,
		private archetypes: Array<Archetype>,
		private iter = HashMap.empty<number, Q>().iter(),
	) {}

	private next(): Option<[Entity, QueryItem<Q>]> {
		for (;;) {
			return this.iter.nextItem().match(
				() => {
					const [idx, state]: [number, never] = undefined!;
					const archetype = this.archetypes[idx];
					this.iter = todo();

					todo();
				},
				() => {
					todo();
				},
			);
		}
	}

	private size_hint(): LuaTuple<[number, Option<number>]> {
		const n = this.len();
		return [n, Option.some(n)] as LuaTuple<[number, Option<number>]>;
	}

	private len(): number {
		todo();
	}
}

class ChunkIter<Q extends Query> {
	private constructor(
		private entities: NonNull<number>,
		private fetch: Q["Fetch"],
		private position: number,
		private len: number,
	) {}

	private static empty<Q extends Query>(query: Q): ChunkIter<Q> {
		return new ChunkIter(new NonNull<number>(1), query["Fetch"] as Q["Fetch"], 0, 0);
	}
}
