# CoachSlot: Module map

## identity

- Job: sign-up, log in/out, password reset
- Tables: users, sessions
- Public methods: register(), login(), logout(), getCurrentUser()
- Depends on: nothing

## organizations

- Job: create a gym, invite and remove coaches, roles
- Tables: gyms,memberships
- Public methods: createGym(), inviteCoach(), removeMember(), getMembership()
- Depends on: identity (he logged-in user?)

## catalog

- Job: session types, and which coach offers which
- Tables: session_types ,coash_session_types
- Public methods: createSessionType(), archiveSessionType(), canscelSession()
- Depends on:organizations

## availability

- Job: working hours, days off, list free slots
- Tables: working_hours,time_off
- Public methods: setWorkingHours(), addTimeOff(), getFreeSlots()
- Depends on: catalog (it needs the session length), organizations

## booking

- Job: book, cancel, mark a no-show
- Tables: bookings
- Public methods: book(), cancel(), markNoShow(),listBookings()
- Depends on: availability, identity,catalog

## notifications

- Job: tell people when something changes (in-app in v1, email later)
- Tables: none yet
- Public methods: notify()
- Depends on: availability, catalog, organizations, notifications,audit

## audit

- Job: record who changed what, and when
- Tables:audit_entries
- Public methods: record()
- Depends on: nothing

identity → nothing
organizations → identity
catalog → organizations
availability → catalog, organizations
booking → availability, catalog, organizations,
notifications, audit
notifications → nothing
audit → nothing
