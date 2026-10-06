# ADR-001: Modular monolith

Status: Accepted

Context: CoachSlot is built by one developer(s). It is a booking app
for small gyms. We need to build features fast but keep the code
clean and easy to change (from our quality attributes).

Decision: We build one app (a monolith) split into 7 modules
(identity, organizations, ...). Each module owns its own tables and
other modules must call it, not touch its data.

Consequences:

- Good: only one app to run, test and deploy, so it's easy
- Good: clear modules make the code easy to chamge
- Bad: if one part gets very busy, we can't scale just that one module;we have to scale the
  whole app
- Later: if CoachSlot grows a lot, a module could become its own
  service, because the walls between modules are already there.

# ADR-002: Store times in UTC with each gym's time zone

Status: Accepted

Context: Bookings happen at local gym times, but clocks change
twice a year daylight saving and the server may be in a
different time zone. If we save local times, some times become
ambiguous (1:30 AM in November happens twice).

Decision: We save all booking times in UTC. Each gym stores its
time zone, e.g.America/New_York. We convert to local time only
when showing it to a user.

Consequences:

- Good: every saved time means exactly one moment
- Good: works for gyms in any country or time zone
- Bad: we must always remember to convert to the gym's time zone
  before showing a time

# ADR-003: Server sessions instead of JWT

Status: Accepted

Context: After login, the app must remember who the user is on
every request. When the owner removes a coach, that coach must
lose access immediately. If a login cookie is stolen, we must
be able to cancel (revoke) it.

Decision: We use server sessions. After login, we save a session
row in the sessions table and give the browser a cookie with a
random session ID. On each request we look it up in the table.

Consequences:

- Good: we can log someone out immediately by deleting their session row
- Good: it's simple, because we have one app (see ADR-001)
- Bad: every request needs one extra database lookup
- Not chosen: JWT, because a JWT can't be cancelled before it expires
