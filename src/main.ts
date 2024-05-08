import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './all-exceptions.filter';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { setupSwagger } from './config/swagger.config';
const PORT = process.env.PORT || 3000;

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: '*',
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST', 'DELETE', 'PATCH'],
  });

  const { httpAdapter } = app.get(HttpAdapterHost);
  app.useGlobalFilters(new AllExceptionsFilter(httpAdapter));
  app.use(cookieParser());

  app.useGlobalPipes(new ValidationPipe({ whitelist: true }))

  // swagger setup
  setupSwagger(app);


  app.listen(PORT).then(() => {
    console.log(`App running on port ${PORT}`)
  })
}
bootstrap();
