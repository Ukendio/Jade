/// <reference types="@rbxts/"

import { HashMap } from "@rbxts/rust-classes";
import { Entities, Entity } from "./entities";
describe("tests entities", () => {
	it("entity_bits_roundtrip()", () => {
		const e = new Entity(0xdeadbeef, 0xbaadf00d);
		expect(Entity.from_bits(e.to_bits()).unwrap()).to.equal(e);
	});

	it("alloc_and_free()", () => {
		const rng = new Random();

		let e = Entities.default();
		let first_unused = 0;
		let id_to_gen = HashMap.empty<number, number>();
		let free_set = new Set();

		let len = 0;

		for (let i = 0; i < 100; i++) {
			const alloc = rng.NextNumber(0, 1) > 0.7;

			if (alloc || first_unused === 0) {
				const entity = e.alloc();
				len++;

				let id = entity.id;
				if (!free_set.isEmpty()) {
					expect(free_set.delete(id)).to.be.ok();
				} else if (id >= first_unused) {
					first_unused = id++;
				}

				e.get(entity).unwrap().index = 37;

				expect(id_to_gen.insert(id, entity.generation).isNone()).to.equal(true);
			} else {
				const id = rng.NextInteger(0, first_unused);

				const generation = id_to_gen.remove(id);
				const entity = new Entity(
					generation.unwrapOrElse(() => 1),
					id,
				);

				expect(e.free(entity).isOk()).to.equal(generation.isSome());
				if (generation.isSome()) {
					len--;
				}

				free_set.add(id);
			}

			expect(e.len()).to.equal(len);
		}
	});
});
