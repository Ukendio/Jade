local immutable = require(script.immutable)
local World = require(script.World)
local newComponent = require(script.component).newComponent

return table.freeze({
	World = World,
	component = newComponent,

	merge = immutable.merge,
	None = immutable.None,
})
