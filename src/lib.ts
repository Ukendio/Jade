import { Option, Vec } from "@rbxts/rust-classes";

export interface GenerationalIndex {
	index: number;
	generation: number;
}

interface AllocatorEntity {
	is_live: boolean;
	generation: number;
}

interface IGenerationalIndexAllocator {
	entries: Vec<AllocatorEntity>;
	free: Vec<number>;

	allocate(): GenerationalIndex;
	deallocate(): boolean;
	is_live(generational_index: GenerationalIndex): boolean;
}

export class GenerationalIndexAllocator implements IGenerationalIndexAllocator {
	public entries = Vec.vec<AllocatorEntity>();
	public free = Vec.vec<number>();

	public allocate(): GenerationalIndex {
		return 1 as never;
	}

	public deallocate(): boolean {
		return true;
	}

	public is_live(generational_index: GenerationalIndex): boolean {
		return true;
	}
}

interface ArrayEntry<T> {
	value: T;
	generation: number;
}

interface GenerationalIndexArray<T> {}

class GenerationalIndexArray<T> implements GenerationalIndexArray<T> {
	public constructor() {}
	public set(index: GenerationalIndex, value: T): void {}
	get(index: GenerationalIndex): Option<T> {
		return Option.none();
	}
}

class AnyMap {
	insert<T>(t: T): void {}

	get<T>(): Option<T> {
		return Option.none();
	}
}

type Entity = GenerationalIndex;
type EntityMap<T> = GenerationalIndexArray<T>;

type Component = {};
type Resource = {};

interface ECS {
	entity_allocator: GenerationalIndexAllocator;
	entity_components: AnyMap;
	resources: AnyMap;
}

class ECS {
	get_component<T extends Component>(component: T): Option<EntityMap<T>> {
		return Option.none();
	}

	get_resource<T extends Resource>(): Option<T> {
		return Option.none();
	}
}

class ComponentRegistry {
	public register_component<T extends Component>(): void {}

	public setup_ecs(ecs: ECS): void {}

	public load_entity(json: string, ecs: ECS): Entity {
		return 1 as never;
	}
}

class ResourceRegistry {
	public register_resource<T extends Resource>(): void {}

	public setup_ecs(ecs: ECS): void {}

	public load_resource(json: string, ecs: ECS): void {}
}

interface PhysicsComponent {}

function load_component_registry(): ComponentRegistry {
	const component_registry = new ComponentRegistry();

	component_registry.register_component<PhysicsComponent>();
	return component_registry;
}

interface BlocksResource {}

function load_resource_registry(): ResourceRegistry {
	const resource_registry = new ResourceRegistry();

	resource_registry.register_resource<BlocksResource>();
	return resource_registry;
}

class Registry {
	public components = load_component_registry();
	public resources = load_resource_registry();
}
