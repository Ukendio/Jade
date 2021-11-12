import { Option, Vec } from "@rbxts/rust-classes";
import { Entity } from "entities";
import { Component } from "entity_ref";
import { World } from "world";
import todo from "@rbxts/todo";

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
		todo();
	}

	public deallocate(): boolean {
		todo();
	}

	public is_live(generational_index: GenerationalIndex): boolean {
		todo();
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
		todo();
	}
}

class AnyMap {
	insert<T>(t: T): void {}

	get<T>(): Option<T> {
		todo();
	}
}

/**
 * BELOW IS JUST TYPE PROTOTYPES
 */

class ComponentRegistry {
	public register_component<T extends Component>(): void {
		todo();
	}

	public setup_world(ecs: World): void {
		todo();
	}

	public load_entity(json: string, ecs: World): Entity {
		todo();
	}
}

class ResourceRegistry {
	public register_resource<T extends Resource>(): void {}

	public setup_world(world: World): void {}

	public load_resource(json: string, ecs: World): void {}
}

function load_component_registry(): ComponentRegistry {
	const component_registry = new ComponentRegistry();

	component_registry.register_component();
	return component_registry;
}

function load_resource_registry(): ResourceRegistry {
	const resource_registry = new ResourceRegistry();

	resource_registry.register_resource();
	return resource_registry;
}

class Registry {
	public components = load_component_registry();
	public resources = load_resource_registry();
}

type Resource = {};
