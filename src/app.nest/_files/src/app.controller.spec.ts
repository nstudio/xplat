import { Test } from "@nestjs/testing";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";

describe("App controller", () => {
  let appController: AppController;
  let appService: AppService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService]
    }).compile();

    appService = module.get<AppService>(AppService);
    appController = module.get<AppController>(AppController);
  });

  describe("hello world", () => {
    it("should get response", async () => {
      const result = "Hello world";
      jest.spyOn(appService, "get").mockImplementation(() => result);

      expect(await appController.root()).toBe(result);
    });
  });
});
