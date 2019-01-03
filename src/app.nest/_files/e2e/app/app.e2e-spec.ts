import * as request from 'supertest';
import { Test } from '@nestjs/testing';
import { ApplicationModule } from '../../src/app.module';
import { AppService } from '../../src/app.service';
import { INestApplication } from '@nestjs/common';

describe('Application', () => {
  let app: INestApplication;
  let appService = { get: () => 'Hello world' };

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [ApplicationModule]
    })
      .overrideProvider(AppService)
      .useValue(appService)
      .compile();

    app = module.createNestApplication();
    await app.init();
  });

  it(`/GET app`, () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect(appService.get());
  });

  afterAll(async () => {
    await app.close();
  });
});
