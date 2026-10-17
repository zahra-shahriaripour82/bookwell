import { sql } from 'drizzle-orm';

import {
  pgTable,
  varchar,
  uuid,
  timestamp,
  check,
  unique,
  integer,
  boolean,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

export const usersTable = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    email: varchar('email').notNull().unique(),

    password_hash: varchar('password_hash').notNull(),

    name: varchar('name').notNull(),

    created_at: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [uniqueIndex('lower_case_email_idx').on(sql`lower(${t.email})`)],
);

export const gymsTable = pgTable('gyms', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name').notNull(),
  timezone: varchar('timezone').notNull(),
  contact_email: varchar('contact_email').notNull(),
  contact_phone: varchar('contact_phone'),
  created_at: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const membershipsTable = pgTable(
  'memberships',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    user_id: uuid('user_id')
      .notNull()
      .references(() => usersTable.id),
    gym_id: uuid('gym_id')
      .notNull()
      .references(() => gymsTable.id),
    role: varchar('role').notNull(),
    status: varchar('status').notNull(),
    created_at: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    unique().on(t.user_id, t.gym_id),
    check(
      'memberships_role_check',
      sql`${t.role} in ('owner', 'coach', 'client')`,
    ),
    check(
      'memberships_status_check',
      sql`${t.status} in ('active', 'removed')`,
    ),
  ],
);

export const sessionTypesTable = pgTable(
  'session_types',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    gym_id: uuid('gym_id')
      .notNull()
      .references(() => gymsTable.id),
    name: varchar('name').notNull(),
    duration_minutes: integer('duration_minutes').notNull(),
    is_archived: boolean('is_archived').notNull().default(false),
  },
  (t) => [
    check('session_types_duration_check', sql`${t.duration_minutes} > 0`),
    unique().on(t.gym_id, t.name),
  ],
);

export const bookingsTable = pgTable(
  'bookings',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    gym_id: uuid('gym_id')
      .notNull()
      .references(() => gymsTable.id),
    coach_membership_id: uuid('coach_membership_id')
      .notNull()
      .references(() => membershipsTable.id),
    client_membership_id: uuid('client_membership_id')
      .notNull()
      .references(() => membershipsTable.id),
    session_type_id: uuid('session_type_id')
      .notNull()
      .references(() => sessionTypesTable.id),
    starts_at: timestamp('starts_at', { withTimezone: true }).notNull(),
    ends_at: timestamp('ends_at', { withTimezone: true }).notNull(),
    status: varchar('status').notNull(),
    cancelled_at: timestamp('cancelled_at', { withTimezone: true }),
    created_at: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    check(
      'bookings_ends_after_starts_check',
      sql`${t.ends_at} > ${t.starts_at}`,
    ),
    check(
      'bookings_status_check',
      sql`${t.status} IN (
      'booked',
      'cancelled_by_client',
      'cancelled_by_coach',
      'cancelled_by_gym',
      'completed',
      'no_show'
    )`,
    ),
    check(
      'bookings_cancelled_at_check',
      sql`(${t.status} LIKE 'cancelled%') = (${t.cancelled_at} IS NOT NULL)`,
    ),
    uniqueIndex('bookings_coach_start_active_idx')
      .on(t.coach_membership_id, t.starts_at)
      .where(sql`${t.status} = 'booked'`),
  ],
);
