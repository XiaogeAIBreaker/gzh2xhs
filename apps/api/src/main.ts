import 'reflect-metadata'
import { NestFactory } from '@nestjs/core'
import { AppModule } from './modules/app.module'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { ValidationPipe } from '@nestjs/common'

async function bootstrap() {
    const app = await NestFactory.create(AppModule)

    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
        }),
    )

    const config = new DocumentBuilder()
        .setTitle('gzh2xhs API')
        .setDescription('REST + gRPC 混合架构 API')
        .setVersion('0.1.0')
        .addBearerAuth()
        .build()
    const document = SwaggerModule.createDocument(app, config)
    SwaggerModule.setup('/docs', app, document)

    const port = process.env.PORT ? Number(process.env.PORT) : 3001
    await app.listen(port)
}

bootstrap()
