/// <reference types="@rbxts/testez/globals" />

import { Vec } from "@rbxts/rust-classes";
import { Entity } from "entities";
import { World } from "./world";

describe("", () => {
	it("", () => {
		const world = new World();
		const a = world.spawn(123, true, "abc");
		const b = world.spawn(456, false);

		world.query();
		let entities = world
			.query<[number, boolean]>()
			.iter()
			.map(([e, [i, b]]) => [e, i, b] as const)
			.collect();

		expect(entities.len()).to.equal(2);
		expect(entities.contains([a, 123, true])).to.equal(true);

		for (let [_, number, flag] of entities.generator()) {
			if (flag) {
				number *= 2;
			}
		}
	});
});

Promise.race([new Promise<Callback>((resolve) => resolve(() => {}))]).then((fn) => fn());
