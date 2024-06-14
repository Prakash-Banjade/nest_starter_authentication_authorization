import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './all-exceptions.filter';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { setupSwagger } from './config/swagger.config';
import helmet from 'helmet';
import { SecurityHeadersMiddleware } from './core/middlewares/security_headers.middleware';
import { setupMorgan } from './config/morgan.config';
const PORT = process.env.PORT || 3000;

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: ['http://client.com'],
    credentials: true,
    optionsSuccessStatus: 200,
    preflightContinue: false, // enforce CORS policy consistently across the application's endpoints.
    methods: ['GET', 'POST', 'DELETE', 'PATCH'],
  });

  // Helmet helps secure your apps by setting various HTTP headers. It’s not specific to NestJS but is essential for web applications to prevent common attacks.
  app.use(helmet());

  // security header middleware
  const securityHeadersMiddleware = new SecurityHeadersMiddleware();
  app.use(securityHeadersMiddleware.use.bind(securityHeadersMiddleware));

  const { httpAdapter } = app.get(HttpAdapterHost);
  app.useGlobalFilters(new AllExceptionsFilter(httpAdapter));
  app.use(cookieParser());

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }))

  // swagger setup
  setupSwagger(app);

  // setup morgan
  setupMorgan(app);


  app.listen(PORT).then(() => {
    console.log(`App running on port ${PORT}`)
  })
}
bootstrap();
