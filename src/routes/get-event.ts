import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

import { prisma } from '../lib/prisma';
import { BadRequest } from './_errors/bad-request';

export async function getEvent(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().get(
    '/events/:eventId',
    {
      schema: {
        summary: 'Get an event',
        tags: ['events'],
        params: z.object({
          eventId: z.string().uuid(),
        }),
        response: {
          200: z.object({
            event: z.object({
              id: z.string().uuid(),
              title: z.string(),
              slug: z.string(),
              details: z.string().nullable(),
              maximumAttendees: z.number().int().nullable(),
              attendee: z.number().int(),
            }),
          }),
        },
      },
    },
    async (request, response) => {
      const { eventId } = request.params;

      const event = await prisma.event.findUnique({
        select: {
          id: true,
          title: true,
          slug: true,
          details: true,
          maximumAttendees: true,
          _count: {
            select: {
              attendee: true,
            },
          },
        },
        where: {
          id: eventId,
        },
      });

      if (event === null) {
        throw new BadRequest('Event not found.');
      }

      return response.status(200).send({
        event: {
          id: event.id,
          title: event.title,
          slug: event.slug,
          details: event.details,
          maximumAttendees: event.maximumAttendees,
          attendee: event._count.attendee,
        },
      });
    }
  );
}
