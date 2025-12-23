import { DynamicModule, Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

/**
 *
 */
@Module({})
export class OrmModule {
    /**
     *
     */
    static forRoot(): DynamicModule {
        const isTest = process.env.NODE_ENV === 'test'
        const url = process.env.DATABASE_URL

        if (isTest) {
            return {
                module: OrmModule,
                imports: [
                    TypeOrmModule.forRoot({
                        type: 'sqlite',
                        database: ':memory:',
                        entities: [__dirname + '/../../modules/**/*.entity.{ts,js}'],
                        synchronize: true,
                        autoLoadEntities: true,
                    }),
                ],
            }
        }

        if (!url) {
            // Return dummy module to avoid crash if no DB, but this will break feature modules
            // So we must warn or provide dummy connection
            console.warn('No DATABASE_URL provided, ORM disabled')
            return { module: OrmModule }
        }

        return {
            module: OrmModule,
            imports: [
                TypeOrmModule.forRoot({
                    type: 'postgres',
                    url,
                    autoLoadEntities: true, // Load entities from feature modules
                    synchronize: false,
                    logging: false,
                    poolSize: 10,
                }),
            ],
        }
    }
}
