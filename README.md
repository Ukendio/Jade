# Jade

Attempt at porting [Hecs](https://github.com/Ralith/hecs) made by Ralith to Roblox. Semantically identical API and documentation.

### Example

```ts
const world = new World()
// Literally anything can be a component! 
const a = world.spawn((123, true, "abc"));
const b = world.spawn((42, false));

// Systems can be simple for loops
for (let [id, number, flag] of entities.generator()) {
	if (flag) {
		number *= 2;
	}
}

expect(world.get<number>(a).unwrap().deref()).to.equal(123)
expect(world.get<number>(a).unwrap().deref()).to.equal(246)
```

## Motivation

The Entity Component System (also known as ECS) provides infrastructre for representing distinct objects with loosely coupled state and behaviour.

An ECS world consists of any number of *entities* (unique ids) associated with *components* which are pure data that contain no behaviour. The world is then manipulated by systems that implement self-contained behaviour, each of which access a set of a specific component type.

Due to the nature of the ECS paradigm that allows for new components and systems to be added without conflicting with existing logic makes it suitable for games where many layers of overlapping behaviour will be defined on the same set of game objects, i.e. new behaviour defined in the future. 

### Performance

Jade provides an archetypal storage layout which allows systems to access all entities sharing the same set of components. An entity is written by its archetype into a single table that contains entities which identical archetypes. An archetype is an assembly of entities. If you have entities with `Apple and Orange` and one with `Apple and Banana`, these are held in different tables. This allows for fast linear traversal over relevant components by finding corresponding archetypes, filtering unnecessary data.

Despite not being able to maximize cache use due to lack of pointers. Storing data in this layout allows for incredibly fast data retrievals.

## Alternatives

Jade is far from production-ready unlike these existing ECS libraires for Roblox:

- [Stitch](https://github.com/sayhisam1/Stitch), which is a batteries-included library with a lot of battle testing.
- [Anatta](https://github.com/kennethloeffler/anatta), which is arguably the most popular ECS implementation.
- [Recs](https://github.com/AmaranthineCodices/recs), which is one of the oldest yet still maintained repository.

-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

I fucking miss you Jade 