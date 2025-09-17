import { type ZodType, z } from 'zod/v4'
import type { $ZodType, $ZodTypes } from 'zod/v4/core'
import type { Branded, Custom, Scope, Scoped } from './types'

export function brand<Brand extends string, Strict extends boolean>(name: Brand, strict: Strict) {
	return <Type extends $ZodType>(type: Type) => {
		type._zod.def.brand = { name, strict }
		return type as Branded<Type, Brand, Strict>
	}
}

export function custom<Type, Token extends string>(token: Token): Custom<Type, Token> {
	const type = z.custom<Type>()
	type._zod.def.extended = {
		token,
		type: 'custom'
	}

	return type as Custom<Type, Token>
}

export function scope<
	Inner extends ZodType,
	Name extends string,
	Context extends Record<string, $ZodType>
>(inner: Inner, name: Name, context: Context) {
	const type = z.custom<(params: { [K in keyof Context]: z.infer<Context[K]> }) => z.infer<Inner>>()
	type._zod.def.extended = {
		inner,
		scope: {
			context,
			name
		},
		type: 'scoped'
	}

	return type as Scoped<Inner, Name, Context>
}

export function shapeOf(type: $ZodType, scope?: Scope): string {
	const def = (type as $ZodTypes)._zod.def

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
				switch (def.extended.type) {
					case 'custom': {
						return `_Custom(${def.extended.token})`
					}
					case 'scoped': {
						return shapeOf(def.extended.inner, def.extended.scope)
					}
				}
				break
			}
			default: {
				throw `${def.type} not supported`
			}
		}
	}

	if (scope) {
		if (def.brand) {
			return `_Scoped(${scope.name},_Branded(${def.brand.name},${shape()}))`
		}
		return `_Scoped(${scope.name},${shape()})`
	}

	if (def.brand) {
		return `_Branded(${def.brand.name},${shape()})`
	}

	return shape()
}

export function metaZod(type: $ZodType) {
	function shape(type: $ZodType) {
		const def = (type as $ZodTypes)._zod.def

		switch (def.type) {
			case 'string': {
				return 'z.string()'
			}
			case 'number': {
				return 'z.number()'
			}
			case 'boolean': {
				return 'z.boolean()'
			}
			case 'undefined': {
				return 'z.undefined()'
			}
			case 'null': {
				return 'z.null()'
			}
			case 'literal': {
				return `z.literal("${def.values[0]}")`
			}
			case 'enum': {
				return `z.enum([${Object.values(def.entries)
					.map(value => `"${value}"`)
					.join(',')}])`
			}
			case 'array': {
				return `z.array(${shape(def.element)})`
			}
			case 'tuple': {
				return `z.tuple([${def.items.map(item => shape(item)).join(',')}])`
			}
			case 'object': {
				return `z.object({${Object.entries(def.shape)
					.map(([key, value]) => `${key}:${shape(value)}`)
					.join(',')}})`
			}
			case 'union': {
				return `z.union([${def.options.map(option => shape(option)).join(',')}])`
			}

			case 'optional': {
				return `${shape(def.innerType)}.optional()`
			}

			case 'nullable': {
				return `${shape(def.innerType)}.nullable()`
			}

			case 'default': {
				return `${shape(def.innerType)}.default(${def.defaultValue})`
			}
			case 'date': {
				return 'z.date()'
			}

			default: {
				throw `${def.type} not supported`
			}
		}
	}
	return shape(type)
}
