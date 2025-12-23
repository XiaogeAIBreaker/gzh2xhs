import { IsString, IsOptional, IsEnum, MinLength, MaxLength } from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { APP_CONSTANTS, ERROR_MESSAGES } from '../constants'

export class GenerateInputDto {
    @ApiProperty({ description: '要转换的文本内容' })
    @IsString()
    @MinLength(1, { message: ERROR_MESSAGES.EMPTY_INPUT })
    @MaxLength(APP_CONSTANTS.MAX_TEXT_LENGTH, { message: ERROR_MESSAGES.TEXT_TOO_LONG })
    text!: string

    @ApiProperty({ description: '使用的AI模型', enum: ['deepseek', 'nanobanana'] })
    @IsEnum(['deepseek', 'nanobanana'])
    model!: 'deepseek' | 'nanobanana'

    @ApiPropertyOptional({ description: '卡片样式', enum: ['simple', 'standard', 'rich'] })
    @IsOptional()
    @IsEnum(['simple', 'standard', 'rich'])
    style?: 'simple' | 'standard' | 'rich'

    @ApiPropertyOptional({ description: '卡片尺寸', enum: ['1:1', '4:5', '9:16'] })
    @IsOptional()
    @IsEnum(['1:1', '4:5', '9:16'])
    size?: '1:1' | '4:5' | '9:16'
}
