import { ZodType, z } from 'zod/v4'
import type { $ZodType, $ZodTypes } from 'zod/v4/core'
import type { Branded, Custom, Scope, Scoped } from './types'

export function brand<Brand extends string, Strict extends boolean>(name: Brand, strict: Strict) {
	return <Type extends $ZodType>(type: Type) => {
		type._zod.def.brand = { name, strict }
		return type as Branded<Type, Brand, Strict>
	}
}

export function custom<Type, Token extends string>(token: Token) {
	const custom = z.custom<Type>()
	custom._zod.def.token = token
	return custom as Custom<Type, Token>
}

export function scope<
	Type extends ZodType,
	Name extends string,
	Context extends Record<string, $ZodType>
>(type: Type, scope: { name: Name; context: Context }) {
	return new ZodType({ ...type._zod.def, scope }) as Scoped<Type, Name, Context>
}

export function shapeOf(type: $ZodType, _scope?: Scope): string {
	const def = (type as $ZodTypes)._zod.def

	const scope = _scope ?? def.scope

	function shape() {
		switch (def.type) {
			case 'string': {
				return '_String'
			}
			case 'number': {
				return '_Number'
			}
			case 'boolean': {
				return '_Boolean'
			}
			case 'undefined': {
				return '_Undefined'
			}
			case 'null': {
				return '_Null'
			}
			case 'literal': {
				return `_Literal(${def.values[0]})`
			}
			case 'enum': {
				return `_Enum(${Object.values(def.entries).join(',')})`
			}
			case 'array': {
				return `_Array(${shapeOf(def.element, scope)})`
			}
			case 'tuple': {
				return `_Tuple(${def.items.map(item => shapeOf(item, scope)).join(',')})`
			}
			case 'object': {
				return `_Object(${Object.entries(def.shape)
					.map(([key, value]) => `${key}:${shapeOf(value, scope)}`)
					.join(',')})`
			}
			case 'union': {
				return `_Union(${def.options.map(option => shapeOf(option, scope)).join(',')})`
			}
			case 'custom': {
				return `_Custom(${def.token})`
			}
			default: {
				throw `${def.type} not supported`
			}
		}
	}

	if (scope) {
		return `_Scoped(${scope.name},${shape()})`
	}

	if (def.brand) {
		return `_Branded(${def.brand.name},${shape()})`
	}

	return shape()
}
