import { ValidationPipe } from '@nestjs/common';
import { NestApplication } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { AppModule } from 'src/app.module';
import { PrismaService } from 'src/prisma/prisma.service';
import * as pactum from 'pactum';
import { AuthDto } from 'src/auth/dto';

describe('App (e2e)', () => {
  let app: NestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
      }),
    );
    await app.init();
    await app.listen(8001);

    prisma = app.get(PrismaService);
    await prisma.cleanDb();
    pactum.request.setBaseUrl('http://localhost:8001');
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Auth', () => {
    const dto: AuthDto = {
      email: 'test@test.com',
      password: '123456',
    };
    describe('Signup', () => {
      it('should throw exception if email is empty', () => {
        return pactum
          .spec()
          .post('/auth/signup')
          .withBody({
            password: dto.password,
          })
          .expectStatus(400);
      });

      it('should throw exception if password is empty', () => {
        return pactum
          .spec()
          .post('/auth/signup')
          .withBody({
            email: dto.email,
          })
          .expectStatus(400);
      });

      it('should throw exception if no body provided', () => {
        return pactum.spec().post('/auth/signup').expectStatus(400);
      });

      it('should signup', () => {
        return pactum
          .spec()
          .post('/auth/signup')
          .withBody(dto)
          .expectStatus(201);
      });
    });
    describe('Signin', () => {
      it('should throw exception if email is empty', () => {
        return pactum
          .spec()
          .post('/auth/signin')
          .withBody({
            password: dto.password,
          })
          .expectStatus(400);
      });

      it('should throw exception if password is empty', () => {
        return pactum
          .spec()
          .post('/auth/signin')
          .withBody({
            email: dto.email,
          })
          .expectStatus(400);
      });

      it('should throw exception if no body provided', () => {
        return pactum.spec().post('/auth/signin').expectStatus(400);
      });

      it('should signin', () => {
        return pactum
          .spec()
          .post('/auth/signin')
          .withBody(dto)
          .expectStatus(200)
          .stores('userAt', 'access_token');
      });
    });
  });
  describe('Users', () => {
    describe('Get me', () => {
      it('should get current user', () => {
        return pactum
          .spec()
          .get('/user/me')
          .withHeaders({
            Authorization: 'Bearer $S{userAt}',
          })
          .expectStatus(200);
      });
    });

    describe('Edit user', () => {
      const dto = {
        firstName: 'TestF',
        lastName: 'TestL',
        email: 'test2@test.com',
      };
      it("should update user's firstName", () => {
        return pactum
          .spec()
          .patch('/user')
          .withHeaders({
            Authorization: 'Bearer $S{userAt}',
          })
          .withBody({
            firstName: dto.firstName,
          })
          .expectStatus(200)
          .expectBodyContains(dto.firstName);
      });
      it("should update user's lastName", () => {
        return pactum
          .spec()
          .patch('/user')
          .withHeaders({
            Authorization: 'Bearer $S{userAt}',
          })
          .withBody({
            lastName: dto.lastName,
          })
          .expectStatus(200)
          .expectBodyContains(dto.lastName);
      });
      it("should update user's email", () => {
        return pactum
          .spec()
          .patch('/user')
          .withHeaders({
            Authorization: 'Bearer $S{userAt}',
          })
          .withBody({
            email: dto.email,
          })
          .expectStatus(200)
          .expectBodyContains(dto.email);
      });
    });
  });
  describe('Bookmarks', () => {
    describe('Get no bookmarks', () => {
      it('should get no bookmarks', () => {
        return pactum
          .spec()
          .get('/bookmark')
          .withHeaders({
            Authorization: 'Bearer $S{userAt}',
          })
          .expectStatus(200)
          .expectBody([]);
      });
    });

    describe('Create bookmark', () => {
      it('should create bookmark', () => {
        return pactum
          .spec()
          .post('/bookmark')
          .withHeaders({
            Authorization: 'Bearer $S{userAt}',
          })
          .withBody({
            title: 'Test',
            description: 'Test',
            link: 'https://google.com',
          })
          .expectStatus(201)
          .stores('bookmarkId', 'id');
      });
    });
    describe('Get bookmark by id', () => {
      it('should get bookmark by id', () => {
        return pactum
          .spec()
          .get('/bookmark/$S{bookmarkId}')
          .withHeaders({
            Authorization: 'Bearer $S{userAt}',
          })
          .expectStatus(200);
      });

      it('should get no bookmark', () => {
        return pactum
          .spec()
          .get('/bookmark/123456')
          .withHeaders({
            Authorization: 'Bearer $S{userAt}',
          })
          .expectStatus(403);
      });
    });
    describe('Edit bookmark by id', () => {
      const dto = {
        title: 'Test2',
        description: 'Test2',
        link: 'https://google2.com',
      };
      it('should edit bookmark title', () => {
        return pactum
          .spec()
          .patch('/bookmark/$S{bookmarkId}')
          .withHeaders({
            Authorization: 'Bearer $S{userAt}',
          })
          .withBody({
            title: dto.title,
          })
          .expectStatus(200)
          .withJson({
            title: dto.title,
          });
      });

      it('should edit bookmark description', () => {
        return pactum
          .spec()
          .patch('/bookmark/$S{bookmarkId}')
          .withHeaders({
            Authorization: 'Bearer $S{userAt}',
          })
          .withBody({
            description: dto.description,
          })
          .expectStatus(200)
          .withJson({
            description: dto.description,
          });
      });

      it('should edit bookmark link', () => {
        return pactum
          .spec()
          .patch('/bookmark/$S{bookmarkId}')
          .withHeaders({
            Authorization: 'Bearer $S{userAt}',
          })
          .withBody({
            link: dto.link,
          })
          .expectStatus(200)
          .withJson({
            link: dto.link,
          });
      });
    });
    describe('Delete bookmark by id', () => {
      it('should delete bookmark by id', () => {
        return pactum
          .spec()
          .delete('/bookmark/$S{bookmarkId}')
          .withHeaders({
            Authorization: 'Bearer $S{userAt}',
          })
          .expectStatus(200);
      });
    });
  });
});
