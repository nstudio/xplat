import { NestFactory } from "@nestjs/core";
import { ApplicationModule } from "./app.module";

import * as helmet from "helmet";
// import * as csurf from "csurf";
import * as rateLimit from "express-rate-limit";
import * as compression from "compression";

declare const module: any;

async function bootstrap() {
  const app = await NestFactory.create(ApplicationModule, { cors: true });

  app.use(helmet());
  //app.use(csurf());
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100 // limit each IP to 100 requests per windowMs
    })
  );
  app.use(compression());

  await app.listen(9000);

  if (module.hot) {
    module.hot.accept();
    module.hot.dispose(() => app.close());
  }
}
bootstrap();
