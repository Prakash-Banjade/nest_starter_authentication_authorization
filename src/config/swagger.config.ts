import { INestApplication } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AuthModule } from "src/auth/auth.module";
import { UsersModule } from "src/users/users.module";

export function setupSwagger(app: INestApplication): void {
    const config = new DocumentBuilder()
        .setTitle('My API Title')
        .setDescription('Backend API documentation for NestJs application')
        .setVersion('1.0')
        .addBearerAuth(
            {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT',
                name: 'JWT',
                description: 'Enter JWT token',
                in: 'header',
            }
        )
        .build();

    const document = SwaggerModule.createDocument(app, config, {
        include: [AuthModule, UsersModule],
    });

    SwaggerModule.setup('api', app, document, {
        customSiteTitle: 'My API Title',
        // customfavIcon: 'https://avatars.githubusercontent.com/u/6936373?s=200&v=4',
        // customJs: [
        //     'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-bundle.min.js',
        //     'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-standalone-preset.min.js',
        // ],
        // customCssUrl: [
        //     'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui.min.css',
        //     'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-standalone-preset.min.css',
        //     'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui.css',
        // ],
    });
}