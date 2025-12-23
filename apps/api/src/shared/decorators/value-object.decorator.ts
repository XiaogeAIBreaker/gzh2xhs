import { SetMetadata } from '@nestjs/common'

export const VALUE_OBJECT_METADATA = 'value_object_metadata'

export interface ValueObjectOptions {
  validate?: boolean
  serialize?: boolean
}

export const ValueObject = (options: ValueObjectOptions = {}): ClassDecorator => {
  return SetMetadata(VALUE_OBJECT_METADATA, options)
}