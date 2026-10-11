DROP TABLE IF EXISTS bookings, session_types, memberships, gyms, users CASCADE;

CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email varchar NOT NULL UNIQUE,
  password_hash varchar NOT NULL,
  name varchar NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE gyms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar NOT NULL,
  timezone varchar NOT NULL,
  contact_email varchar NOT NULL,
  contact_phone varchar,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id),
  gym_id uuid NOT NULL REFERENCES gyms(id),
  role varchar NOT NULL CHECK (role IN ('owner', 'coach', 'client')),
  status varchar NOT NULL CHECK (status IN ('active', 'removed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, gym_id)
);

CREATE TABLE session_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id uuid NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  name varchar NOT NULL,
  duration_minutes int NOT NULL CHECK (duration_minutes > 0),
  is_archived boolean NOT NULL DEFAULT false,
  UNIQUE (gym_id, name)
);

CREATE TABLE bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id uuid NOT NULL REFERENCES gyms(id),
  coach_membership_id uuid NOT NULL REFERENCES memberships(id),
  client_membership_id uuid NOT NULL REFERENCES memberships(id),
  session_type_id uuid NOT NULL REFERENCES session_types(id),
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL CHECK (ends_at > starts_at),
  status varchar NOT NULL CHECK (
    status IN (
      'booked',
      'cancelled_by_client',
      'cancelled_by_coach',
      'cancelled_by_gym',
      'completed',
      'no_show'
    )
  ),
  cancelled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX bookings_coach_start_active_idx
ON bookings (coach_membership_id, starts_at)
WHERE status = 'booked';
