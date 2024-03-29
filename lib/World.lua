local archetypeModule = require(script.Parent.archetype)
local Component = require(script.Parent.component)

local assertValidComponentInstance = Component.assertValidComponentInstance
local assertValidComponent = Component.assertValidComponent
local archetypeOf = archetypeModule.archetypeOf
local areArchetypesCompatible = archetypeModule.areArchetypesCompatible

local QueryResult = require(script.Parent.query)

local ERROR_NO_ENTITY = "Entity doesn't exist, use world:contains to check if needed"

--[=[
	@class World

	A World contains entities which have components.
	The World is queryable and can be used to get entities with a specific set of components.
	Entities are simply ever-increasing integers.
]=]
local World = {}
World.__index = World

--[=[
	Creates a new World.
]=]
function World.new()
	local firstStorage = {}

	return setmetatable({
		-- List of maps from archetype string --> entity ID --> entity data
		_storages = { firstStorage },
		-- The most recent storage that has not been dirtied by an iterator
		_pristineStorage = firstStorage,

		-- Map from entity ID -> archetype string
		_entityArchetypes = {},

		-- Cache of the component metatables on each entity. Used for generating archetype.
		-- Map of entity ID -> array
		_entityMetatablesCache = {},

		-- Cache of what query archetypes are compatible with what component archetypes
		_queryCache = {},

		-- Cache of what entity archetypes have ever existed in the game. This is used for knowing
		-- when to update the queryCache.
		_entityArchetypeCache = {},

		-- The next ID that will be assigned with World:spawn
		_nextId = 1,

		-- The total number of active entities in the world
		_size = 0,

		-- Storage for `queryChanged`
		_changedStorage = {},
	}, World)
end

-- Searches all archetype storages for the entity with the given archetype
-- Returns the storage that the entity is in if it exists, otherwise nil
function World:_getStorageWithEntity(archetype, id)
	for _, storage in self._storages do
		local archetypeStorage = storage[archetype]
		if archetypeStorage then
			if archetypeStorage[id] then
				return storage
			end
		end
	end
	return nil
end

function World:_markStorageDirty()
	local newStorage = {}
	table.insert(self._storages, newStorage)
	self._pristineStorage = newStorage
end

function World:_getEntity(id)
	local archetype = self._entityArchetypes[id]
	local storage = self:_getStorageWithEntity(archetype, id)

	return storage[archetype][id]
end

function World:_next(last)
	local entityId, archetype = next(self._entityArchetypes, last)

	if entityId == nil then
		return nil
	end

	local storage = self:_getStorageWithEntity(archetype, entityId)

	return entityId, storage[archetype][entityId]
end

--[=[
	Iterates over all entities in this World. Iteration returns entity ID followed by a dictionary mapping
	Component to Component Instance.

	**Usage:**

	```lua
	for entityId, entityData in world do
		print(entityId, entityData[Components.Example])
	end
	```

	@return number
	@return {[Component]: ComponentInstance}
]=]
function World:__iter()
	return World._next, self
end

--[=[
	Spawns a new entity in the world with the given components.

	@param ... ComponentInstance -- The component values to spawn the entity with.
	@return number -- The new entity ID.
]=]
function World:spawn(...)
	return self:spawnAt(self._nextId, ...)
end

--[=[
	Spawns a new entity in the world with a specific entity ID and given components.

	The next ID generated from [World:spawn] will be increased as needed to never collide with a manually specified ID.

	@param id number -- The entity ID to spawn with
	@param ... ComponentInstance -- The component values to spawn the entity with.
	@return number -- The same entity ID that was passed in
]=]
function World:spawnAt(id, ...)
	if self:contains(id) then
		error(
			string.format(
				"The world already contains an entity with ID %d. Use World:replace instead if this is intentional.",
				id
			),
			2
		)
	end

	self._size += 1

	if id >= self._nextId then
		self._nextId = id + 1
	end

	local components = {}
	local metatables = {}

	for i = 1, select("#", ...) do
		local newComponent = select(i, ...)

		assertValidComponentInstance(newComponent, i)

		local metatable = getmetatable(newComponent)

		if components[metatable] then
			error(("Duplicate component type at index %d"):format(i), 2)
		end

		self:_trackChanged(metatable, id, nil, newComponent)

		components[metatable] = newComponent
		table.insert(metatables, metatable)
	end

	self._entityMetatablesCache[id] = metatables

	self:_transitionArchetype(id, components)

	return id
end

function World:_newQueryArchetype(queryArchetype)
	if self._queryCache[queryArchetype] == nil then
		self._queryCache[queryArchetype] = {}
	else
		return -- Archetype isn't actually new
	end

	for _, storage in self._storages do
		for entityArchetype in storage do
			local archetype = string.split(queryArchetype, "||")
			local negatedArchetype = archetype[1]
			local exclude = archetype[2]

			if exclude then
				if areArchetypesCompatible(exclude, entityArchetype) then
					continue
				end
			end

			if areArchetypesCompatible(negatedArchetype, entityArchetype) then
				self._queryCache[queryArchetype][entityArchetype] = true
			end
		end
	end
end

function World:_updateQueryCache(entityArchetype)
	for queryArchetype, compatibleArchetypes in pairs(self._queryCache) do
		if areArchetypesCompatible(queryArchetype, entityArchetype) then
			compatibleArchetypes[entityArchetype] = true
		end
	end
end

function World:_transitionArchetype(id, components)
	debug.profilebegin("transitionArchetype")
	local newArchetype = nil
	local oldArchetype = self._entityArchetypes[id]
	local oldStorage

	if oldArchetype then
		oldStorage = self:_getStorageWithEntity(oldArchetype, id)

		if not components then
			oldStorage[oldArchetype][id] = nil
		end
	end

	if components then
		newArchetype = archetypeOf(unpack(self._entityMetatablesCache[id]))

		if oldArchetype ~= newArchetype then
			if oldStorage then
				oldStorage[oldArchetype][id] = nil
			end

			if self._pristineStorage[newArchetype] == nil then
				self._pristineStorage[newArchetype] = {}
			end

			if self._entityArchetypeCache[newArchetype] == nil then
				debug.profilebegin("update query cache")
				self._entityArchetypeCache[newArchetype] = true
				self:_updateQueryCache(newArchetype)
				debug.profileend()
			end
			self._pristineStorage[newArchetype][id] = components
		else
			oldStorage[newArchetype][id] = components
		end
	end

	self._entityArchetypes[id] = newArchetype

	debug.profileend()
end

--[=[
	Replaces a given entity by ID with an entirely new set of components.
	Equivalent to removing all components from an entity, and then adding these ones.

	@param id number -- The entity ID
	@param ... ComponentInstance -- The component values to spawn the entity with.
]=]
function World:replace(id, ...)
	if not self:contains(id) then
		error(ERROR_NO_ENTITY, 2)
	end

	local components = {}
	local metatables = {}
	local entity = self:_getEntity(id)

	for i = 1, select("#", ...) do
		local newComponent = select(i, ...)

		assertValidComponentInstance(newComponent, i)

		local metatable = getmetatable(newComponent)

		if components[metatable] then
			error(("Duplicate component type at index %d"):format(i), 2)
		end

		self:_trackChanged(metatable, id, entity[metatable], newComponent)

		components[metatable] = newComponent
		table.insert(metatables, metatable)
	end

	for metatable, component in pairs(entity) do
		if not components[metatable] then
			self:_trackChanged(metatable, id, component, nil)
		end
	end

	self._entityMetatablesCache[id] = metatables

	self:_transitionArchetype(id, components)
end

--[=[
	Despawns a given entity by ID, removing it and all its components from the world entirely.

	@param id number -- The entity ID
]=]
function World:despawn(id)
	local entity = self:_getEntity(id)

	for metatable, component in pairs(entity) do
		self:_trackChanged(metatable, id, component, nil)
	end

	self._entityMetatablesCache[id] = nil
	self:_transitionArchetype(id, nil)

	self._size -= 1
end

--[=[
	Removes all entities from the world.

	:::caution
	Removing entities in this way is not reported by `queryChanged`.
	:::
]=]
function World:clear()
	local firstStorage = {}
	self._storages = { firstStorage }
	self._pristineStorage = firstStorage
	self._entityArchetypes = {}
	self._entityMetatablesCache = {}
	self._size = 0
	self._changedStorage = {}
end

--[=[
	Checks if the given entity ID is currently spawned in this world.

	@param id number -- The entity ID
	@return bool -- `true` if the entity exists
]=]
function World:contains(id)
	return self._entityArchetypes[id] ~= nil
end

--[=[
	Gets a specific component (or set of components) from a specific entity in this world.

	@param id number -- The entity ID
	@param ... Component -- The components to fetch
	@return ... -- Returns the component values in the same order they were passed in
]=]
function World:get(id, ...)
	if not self:contains(id) then
		error(ERROR_NO_ENTITY, 2)
	end

	local entity = self:_getEntity(id)

	local length = select("#", ...)

	if length == 1 then
		assertValidComponent((...), 1)
		return entity[...]
	end

	local components = {}
	for i = 1, length do
		local metatable = select(i, ...)
		assertValidComponent(metatable, i)
		components[i] = entity[metatable]
	end

	return unpack(components, 1, length)
end

--[=[
	Performs a query against the entities in this World. Returns a [QueryResult](/api/QueryResult), which iterates over
	the results of the query.

	Order of iteration is not guaranteed.

	```lua
	for id, enemy, charge, model in world:query(Enemy, Charge, Model) do
		-- Do something
	end

	for id in world:query(Target):without(Model) do
		-- Again, with feeling
	end
	```

	@param ... Component -- The component types to query. Only entities with *all* of these components will be returned.
	@return QueryResult -- See [QueryResult](/api/QueryResult) docs.
]=]
function World:query(...)
	return QueryResult.new(self, ...)
end

function World:_trackChanged(metatable, id, old, new)
	if not self._changedStorage[metatable] then
		return
	end

	if old == new then
		return
	end

	local record = table.freeze({
		old = old,
		new = new,
	})

	for _, storage in ipairs(self._changedStorage[metatable]) do
		-- If this entity has changed since the last time this system read it,
		-- we ensure that the "old" value is whatever the system saw it as last, instead of the
		-- "old" value we have here.
		if storage[id] then
			storage[id] = table.freeze({ old = storage[id].old, new = new })
		else
			storage[id] = record
		end
	end
end

--[=[
	Inserts a component (or set of components) into an existing entity.

	If another instance of a given component already exists on this entity, it is replaced.

	```lua
	world:insert(
		entityId,
		ComponentA({
			foo = "bar"
		}),
		ComponentB({
			baz = "qux"
		})
	)
	```

	@param id number -- The entity ID
	@param ... ComponentInstance -- The component values to insert
]=]
function World:insert(id, ...)
	debug.profilebegin("insert")
	if not self:contains(id) then
		error(ERROR_NO_ENTITY, 2)
	end

	local entity = self:_getEntity(id)

	local wasNew = false
	for i = 1, select("#", ...) do
		local newComponent = select(i, ...)

		assertValidComponentInstance(newComponent, i)

		local metatable = getmetatable(newComponent)

		local oldComponent = entity[metatable]

		if not oldComponent then
			wasNew = true

			table.insert(self._entityMetatablesCache[id], metatable)
		end

		self:_trackChanged(metatable, id, oldComponent, newComponent)

		entity[metatable] = newComponent
	end

	if wasNew then -- wasNew
		self:_transitionArchetype(id, entity)
	end

	debug.profileend()
end

--[=[
	Removes a component (or set of components) from an existing entity.

	```lua
	local removedA, removedB = world:remove(entityId, ComponentA, ComponentB)
	```

	@param id number -- The entity ID
	@param ... Component -- The components to remove
	@return ...ComponentInstance -- Returns the component instance values that were removed in the order they were passed.
]=]
function World:remove(id, ...)
	if not self:contains(id) then
		error(ERROR_NO_ENTITY, 2)
	end

	local entity = self:_getEntity(id)

	local length = select("#", ...)
	local removed = {}

	for i = 1, length do
		local metatable = select(i, ...)

		assertValidComponent(metatable, i)

		local oldComponent = entity[metatable]

		removed[i] = oldComponent

		self:_trackChanged(metatable, id, oldComponent, nil)

		entity[metatable] = nil
	end

	-- Rebuild entity metatable cache
	local metatables = {}

	for metatable in pairs(entity) do
		table.insert(metatables, metatable)
	end

	self._entityMetatablesCache[id] = metatables

	self:_transitionArchetype(id, entity)

	return unpack(removed, 1, length)
end

--[=[
	Returns the number of entities currently spawned in the world.
]=]
function World:size()
	return self._size
end

--[=[
	:::tip
	[Loop] automatically calls this function on your World(s), so there is no need to call it yourself if you're using
	a Loop.
	:::

	If you are not using a Loop, you should call this function at a regular interval (i.e., once per frame) to optimize
	the internal storage for queries.

	This is part of a strategy to eliminate iterator invalidation when modifying the World while inside a query from
	[World:query]. While inside a query, any changes to the World are stored in a separate location from the rest of
	the World. Calling this function combines the separate storage back into the main storage, which speeds things up
	again.
]=]
function World:optimizeQueries()
	if #self._storages == 1 then
		return
	end

	local firstStorage = self._storages[1]

	for i = 2, #self._storages do
		local storage = self._storages[i]

		for archetype, entities in storage do
			if firstStorage[archetype] == nil then
				firstStorage[archetype] = entities
			else
				for entityId, entityData in entities do
					if firstStorage[archetype][entityId] then
						error("Entity ID already exists in first storage...")
					end
					firstStorage[archetype][entityId] = entityData
				end
			end
		end
	end

	table.clear(self._storages)

	self._storages[1] = firstStorage
	self._pristineStorage = firstStorage
end

return World
