// import { Test, TestingModule } from "@nestjs/testing";
// import { INestApplication } from "@nestjs/common";
// import * as request from "supertest";
// import { AppModule } from "@/modules";
// import { AuthService } from "@/modules/api/auth/services";
// import { PrismaService } from "@/modules/core/prisma/services";
// import { customAlphabet, urlAlphabet } from "nanoid";
// import { SignUpDto } from "@/modules/api/auth/dtos";

// describe("Auth Test", () => {
//     let app: INestApplication;
//     let authService: AuthService;
//     let prismaService: PrismaService;

//     beforeEach(async () => {
//         const moduleFixture: TestingModule = await Test.createTestingModule({
//             imports: [AppModule],
//         }).compile();

//         authService = moduleFixture.get(AuthService);
//         prismaService = moduleFixture.get(PrismaService);
//         app = moduleFixture.createNestApplication();
//         await app.init();
//     });
//     afterAll(async () => {
//         await app.close();
//     });

//     describe("[POST] /auth/signup", () => {
//         it("should pass if the payload is correct and user does not exist", async () => {
//             const payload: SignUpDto = {
//                 email: "johndoe@example.com",
//                 firstName: "John",
//                 lastName: "Doe",
//                 password: "pass1234",
//             };

//             const createUserData = {
//                 ...payload,
//                 identifier: customAlphabet(urlAlphabet, 16)(),
//                 password: await authService.hashPassword(payload.password),
//             };
//             const findExistingUserMock = jest
//                 .spyOn(prismaService.user, "findUnique")
//                 .mockReturnValue(null);

//             prismaService.user.create = jest.fn().mockReturnValue({
//                 id: 1,
//                 identifier: createUserData.identifier,
//             });

//             const resp = await request(app.getHttpServer())
//                 .post(`/auth/signup`)
//                 .send(payload);

//             expect(resp.status).toBe(201);
//             expect(findExistingUserMock).toHaveBeenCalledTimes(1);
//             expect(prismaService.user.create).toHaveBeenCalledTimes(1);
//             expect(prismaService.user.create).toHaveBeenCalledWith;
//             //     toHaveBeenCalledWith({
//             //     data: createUserData,
//             // });
//         });
//     });
// });
