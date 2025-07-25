import type { ZodCustom, ZodType, z } from 'zod/v4'
import type {
	$ZodArray,
	$ZodBoolean,
	$ZodEnum,
	$ZodLiteral,
	$ZodNull,
	$ZodNumber,
	$ZodObject,
	$ZodString,
	$ZodType,
	$ZodUndefined,
	$ZodUnion
} from 'zod/v4/core'

declare module 'zod/v4/core' {
	interface $ZodTypeDef {
		brand?: Brand
	}
	interface $ZodCustomDef {
		extended:
			| {
					type: 'custom'
					token: string
			  }
			| {
					type: 'scoped'
					inner: $ZodType
					scope: Scope
			  }
	}
}

export type Node = {
	input: $ZodType
	output: $ZodType
}

export type Custom<Type, Token extends string> = ZodCustom<Type, Type> & {
	_zod: {
		def: {
			extended: {
				token: Token
				type: 'custom'
			}
		}
	}
}

export type Brand<Name extends string = string, Strict extends boolean = boolean> = {
	name: Name
	strict: Strict
}

export type Branded<Type extends $ZodType, Name extends string, Strict extends boolean> = Type & {
	_zod: {
		def: {
			brand: Brand<Name, Strict>
		}
	}
}

export type Token = `$$.${string}`

export type Scope<
	Name extends string = string,
	Context extends Record<Token, $ZodType> = Record<Token, $ZodType>
> = {
	name: Name
	context: Context
}

export type Scoped<
	Type extends ZodType,
	Name extends string,
	Context extends Record<Token, $ZodType>
> = ZodCustom<(context: { [K in keyof Context]: z.infer<Context[K]> }) => z.infer<Type>> & {
	_zod: {
		def: {
			extended: {
				scope: Scope<Name, Context>
				inner: Type
				type: 'scoped'
			}
		}
	}
}

export type ShapeOf<Type extends $ZodType> = Type extends Scoped<
	infer Inner extends ZodType,
	infer Name,
	infer _Context
>
	? ['scoped', Name, ShapeOf<Inner>]
	: Type extends Branded<infer Inner extends $ZodType, infer Brand, infer _Strict>
		? ['branded', Brand, ShapeOf<Inner>]
		: Type extends $ZodString
			? 'string'
			: Type extends $ZodNumber
				? 'number'
				: Type extends $ZodBoolean
					? 'boolean'
					: Type extends $ZodUndefined
						? 'undefined'
						: Type extends $ZodNull
							? 'null'
							: Type extends $ZodLiteral<infer Literal extends string>
								? Literal
								: Type extends $ZodEnum<infer Enum extends Record<string, string>>
									? Enum[keyof Enum]
									: Type extends $ZodObject<infer Fields extends Record<string, $ZodType>>
										? { [Key in keyof Fields]: ShapeOf<Fields[Key]> }
										: Type extends $ZodArray<infer Inner extends $ZodType>
											? ShapeOf<Inner>[]
											: Type extends $ZodUnion<infer Union extends readonly $ZodType[]>
												? ShapeOf<Union[number]>
												: Type extends Custom<infer _, infer Token>
													? Token
													: never
