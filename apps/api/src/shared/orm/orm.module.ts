import { DynamicModule, Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

@Module({})
export class OrmModule {
    static forRoot(): DynamicModule {
        const url = process.env.DATABASE_URL
        if (!url) {
            return { module: OrmModule }
        }
        return {
            module: OrmModule,
            imports: [
                TypeOrmModule.forRoot({
                    type: 'postgres',
                    url,
                    entities: [],
                    synchronize: false,
                    logging: false,
                    poolSize: 10,
                }),
            ],
        }
    }
}
