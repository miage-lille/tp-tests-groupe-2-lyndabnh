import { InMemoryWebinarRepository } from 'src/webinars/adapters/webinar-repository.in-memory';
import { Webinar } from 'src/webinars/entities/webinar.entity';
import { ChangeSeats } from 'src/webinars/use-cases/change-seats';
import { testUser } from 'src/users/tests/user-seeds';
import { WebinarNotFoundException } from 'src/webinars/exceptions/webinar-not-found';
import { WebinarNotOrganizerException } from 'src/webinars/exceptions/webinar-not-organizer';
import { WebinarReduceSeatsException } from 'src/webinars/exceptions/webinar-reduce-seats';
import { WebinarTooManySeatsException } from 'src/webinars/exceptions/webinar-too-many-seats';

describe('Feature: Change seats', () => {
  let repository: InMemoryWebinarRepository;
  let useCase: ChangeSeats;

  const webinar = new Webinar({
    id: 'webinar-id',
    organizerId: testUser.alice.props.id,
    title: 'Webinar Title',
    startDate: new Date('2024-01-01T10:00:00Z'),
    endDate: new Date('2024-01-01T11:00:00Z'),
    seats: 100,
  });

  beforeEach(() => {
    repository = new InMemoryWebinarRepository([webinar]);
    useCase = new ChangeSeats(repository);
  });

  describe('Scenario: Happy path', () => {
    it('should change the number of seats for a webinar', async () => {
      await useCase.execute({
        webinarId: 'webinar-id',
        user: testUser.alice,
        seats: 200,
      });

      const updatedWebinar = await repository.findById('webinar-id');
      expect(updatedWebinar?.props.seats).toEqual(200);
    });
  });

  describe('Scenario: Webinar does not exist', () => {
    it('should throw WebinarNotFoundException', async () => {
      await expect(
        useCase.execute({
          webinarId: 'non-existing-id',
          user: testUser.alice,
          seats: 200,
        }),
      ).rejects.toThrow(WebinarNotFoundException);
    });
  });

  describe('Scenario: User is not the organizer', () => {
    it('should throw WebinarNotOrganizerException', async () => {
      await expect(
        useCase.execute({
          webinarId: 'webinar-id',
          user: testUser.bob,
          seats: 200,
        }),
      ).rejects.toThrow(WebinarNotOrganizerException);
    });
  });

  describe('Scenario: Reducing the number of seats', () => {
    it('should throw WebinarReduceSeatsException', async () => {
      await expect(
        useCase.execute({
          webinarId: 'webinar-id',
          user: testUser.alice,
          seats: 50,
        }),
      ).rejects.toThrow(WebinarReduceSeatsException);
    });
  });

  describe('Scenario: Too many seats', () => {
    it('should throw WebinarTooManySeatsException', async () => {
      await expect(
        useCase.execute({
          webinarId: 'webinar-id',
          user: testUser.alice,
          seats: 1500,
        }),
      ).rejects.toThrow(WebinarTooManySeatsException);
    });
  });
});
