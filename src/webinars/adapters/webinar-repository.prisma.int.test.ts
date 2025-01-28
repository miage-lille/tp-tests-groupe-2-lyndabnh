import { PrismaClient } from '@prisma/client';
import {
 PostgreSqlContainer,
 StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';
import { exec } from 'child_process';
import { PrismaWebinarRepository } from 'src/webinars/adapters/webinar-repository.prisma';
import { Webinar } from 'src/webinars/entities/webinar.entity';
import { promisify } from 'util';

const asyncExec = promisify(exec);

describe('PrismaWebinarRepository', () => {
 let container: StartedPostgreSqlContainer;
 let prismaClient: PrismaClient;
 let repository: PrismaWebinarRepository;

 beforeAll(async () => {
 // Démarrage de la DB dans un container Docker
 container = await new PostgreSqlContainer()
 .withDatabase('test_db')
 .withUsername('user_test')
 .withPassword('password_test')
 .withExposedPorts(5432)
 .start();

 const dbUrl = container.getConnectionUri();
 prismaClient = new PrismaClient({
 datasources: {
 db: { url: dbUrl },
 },
 });

 // Lancer les migrations pour synchroniser la DB
 await asyncExec(`DATABASE_URL=${dbUrl} npx prisma migrate deploy`);

 return prismaClient.$connect();
 });

 beforeEach(async () => {
 repository = new PrismaWebinarRepository(prismaClient);
 // Nettoyer la DB avant chaque test
 await prismaClient.webinar.deleteMany();
 await prismaClient.$executeRawUnsafe('DELETE FROM "Webinar" CASCADE');
 });

 afterAll(async () => {
 // Arrêter le container après tous les tests
 await container.stop({ timeout: 1000 });
 return prismaClient.$disconnect();
 });

 describe('Scenario : repository.create', () => {
 it('should create a webinar', async () => {
 // ARRANGE
 const webinar = new Webinar({
 id: 'webinar-id',
 organizerId: 'organizer-id',
 title: 'Webinar title',
 startDate: new Date('2022-01-01T00:00:00Z'),
 endDate: new Date('2022-01-01T01:00:00Z'),
 seats: 100,
 });

 // ACT
 await repository.create(webinar);

 // ASSERT
 const maybeWebinar = await prismaClient.webinar.findUnique({
 where: { id: 'webinar-id' },
 });
 expect(maybeWebinar).toEqual({
 id: 'webinar-id',
 organizerId: 'organizer-id',
 title: 'Webinar title',
 startDate: new Date('2022-01-01T00:00:00Z'),
 endDate: new Date('2022-01-01T01:00:00Z'),
 seats: 100,
 });
 });
 });

 describe('Scenario : repository.findById', () => {
 it('should find a webinar by its id', async () => {
 // ARRANGE
 const webinar = new Webinar({
 id: 'webinar-id',
 organizerId: 'organizer-id',
 title: 'Webinar title',
 startDate: new Date('2022-01-01T00:00:00Z'),
 endDate: new Date('2022-01-01T01:00:00Z'),
 seats: 100,
 });

 await repository.create(webinar);

 // ACT
 const maybeWebinar = await repository.findById('webinar-id');

 // ASSERT
 expect(maybeWebinar).toEqual(webinar);
 });
 });

 describe('Scenario : repository.update', () => {
 it('should update a webinar', async () => {
 // ARRANGE
 const webinar = new Webinar({
 id: 'webinar-id',
 organizerId: 'organizer-id',
 title: 'Webinar title',
 startDate: new Date('2022-01-01T00:00:00Z'),
 endDate: new Date('2022-01-01T01:00:00Z'),
 seats: 100,
 });

 await repository.create(webinar);

 // UPDATE
 webinar.props.title = 'Updated Webinar title';
 await repository.update(webinar);

 // ACT
 const maybeWebinar = await repository.findById('webinar-id');

 // ASSERT
 expect(maybeWebinar?.props.title).toEqual('Updated Webinar title');
 });
 });
});