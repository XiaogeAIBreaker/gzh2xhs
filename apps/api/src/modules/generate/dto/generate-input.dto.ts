import { IsString, IsOptional } from 'class-validator'

export class GenerateInputDto {
    @IsString()
    title!: string

    @IsString()
    content!: string

    @IsOptional()
    @IsString()
    style?: string
}
