import { PrismaClient } from '@prisma/client';
import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';
import { exec } from 'child_process';
import Fastify, { FastifyInstance } from 'fastify';
import { AppContainer } from '../../container';
import { webinarRoutes } from '../../webinars/routes';
import { promisify } from 'util';

// Transformation d'exec en une fonction basée sur des promesses
const asyncExec = promisify(exec);

export class TestServerFixture {
  private container!: StartedPostgreSqlContainer;
  private prismaClient!: PrismaClient;
  private serverInstance!: FastifyInstance;
  private appContainer!: AppContainer;

  // Configure toutes les ressources nécessaires pour les tests automatisés
  async init() {
    try {
      // Lance un conteneur PostgreSQL temporaire
      this.container = await new PostgreSqlContainer()
        .withDatabase('test_db')
        .withUsername('user_test')
        .withPassword('password_test')
        .start();

      const dbUrl = this.container.getConnectionUri();
      // Initialise Prisma avec l'URL de connexion de la base temporaire
      this.prismaClient = new PrismaClient({
        datasources: {
          db: { url: dbUrl },
        },
      });

      // Exécute les migrations Prisma sur la base temporaire
      const command =
        process.platform === 'win32'
          ? `set DATABASE_URL=${dbUrl} && npx prisma migrate deploy`
          : `DATABASE_URL=${dbUrl} npx prisma migrate deploy`;
      await asyncExec(command);

      await this.prismaClient.$connect();

      // Crée et configure le conteneur applicatif avec Prisma
      this.appContainer = new AppContainer();
      this.appContainer.init(this.prismaClient);

      // Démarre un serveur Fastify avec les routes pour les tests
      this.serverInstance = Fastify({ logger: false });
      await webinarRoutes(this.serverInstance, this.appContainer);
      await this.serverInstance.ready();
    } catch (error) {
      console.error(
        'Une erreur est survenue lors de l’initialisation du TestServerFixture :',
        error
      );
      throw error;
    }
  }

  // Retourne l'instance PrismaClient
  getPrismaClient() {
    return this.prismaClient;
  }

  // Retourne l'instance Fastify
  getServer() {
    return this.serverInstance.server;
  }

  // Libère toutes les ressources après les tests
  async stop() {
    try {
      if (this.serverInstance) await this.serverInstance.close();
      if (this.prismaClient) await this.prismaClient.$disconnect();
      if (this.container) await this.container.stop();
    } catch (error) {
      console.error(
        'Une erreur est survenue lors de la fermeture des ressources :',
        error
      );
    }
  }

  // Nettoie les données entre deux tests
  async reset() {
    try {
      await this.prismaClient.webinar.deleteMany();
      await this.prismaClient.$executeRawUnsafe('DELETE FROM "Webinar" CASCADE');
    } catch (error) {
      console.error(
        'Une erreur est survenue lors de la réinitialisation de la base :',
        error
      );
      throw error;
    }
  }
}
