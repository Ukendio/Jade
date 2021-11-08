/// <reference types="@rbxts/testez/globals" />

import { Vec } from "@rbxts/rust-classes"
import { World } from "./world"

function vec_contains<T>(vec: Vec<T>, value: T): boolean {
	for (const a of vec.generator())  {
		if (a === value) {
			return true
		}
	}

	return false
}

const world = new World()
const a = world.spawn(123, true, "abc")
const b = world.spawn(456, false)
const entities = world.query<[boolean, number]>().iter().map(([e, [i, b]]) => [e, i, b]).collect() 
assert(entities.len() === 2)
assert(vec_contains(entities, [a, 123, true]))

