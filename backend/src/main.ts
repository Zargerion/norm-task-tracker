import { NestFactory, Reflector } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
import * as bodyParser from 'body-parser';
import helmet from 'helmet';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(bodyParser.json({ limit: '20mb' }));
  app.use(bodyParser.urlencoded({ extended: true, limit: '20mb' }));
  app.use(cookieParser());

  const allowedOrigins = (process.env.CORS_ORIGIN ?? 'http://localhost:3000,http://localhost:3001')
    .split(',').map((o) => o.trim());

  app.enableCors({
    origin: (origin, cb) => {
      if (!origin || allowedOrigins.includes(origin)) cb(null, true);
      else cb(new Error(`CORS: ${origin} не разрешён`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useWebSocketAdapter(new IoAdapter(app));
  app.setGlobalPrefix('api');

  const port = process.env.PORT ?? 4000;
  await app.listen(port);
  console.log(`Backend running on http://localhost:${port}/api`);
}
bootstrap();
