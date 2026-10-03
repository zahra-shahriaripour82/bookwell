# CoachSlot — User stories

26 stories in 4 groups: Owner, Coach, Client, and Everyone (accounts and security).
Words used everywhere: **owner, coach, client, session type, booking, slot**.

---

## Owner

### O1 — Create the gym account

**As the** owner, **I want** to create an account for my gym,
**so that** my coaches and clients can use one shared schedule.

- Given I'm not registered, when I sign up with the gym name, my email and a password, then the gym is created and I'm logged in as its owner.
- Given the email is already used, when I sign up, then I see "This email already has an account" and nothing is created.

### O2 — Invite a coach

**As the** owner, **I want** to invite a coach by email,
**so that** they can set their hours and clients can book them.

- Given I enter a coach's email, when I send the invite, then they get a link to join my gym and appear in my coach list as "Invited".
- Given the coach accepts the invite, when I open my coach list, then they show as "Active".

### O3 — Remove a coach

**As the** owner, **I want** to remove a coach who no longer works at the gym,
**so that** clients can't book someone who isn't here.

- Given a coach is removed, when a client looks for coaches, then that coach isn't listed and the coach can no longer log in to my gym.
- Given the coach still has upcoming bookings, when I try to remove them, then I see those bookings and must confirm first.
- Given I confirm, then all their upcoming bookings are cancelled and each client sees "Cancelled by gym" in their bookings.

### O4 — Define session types

**As the** owner, **I want** to define session types with a name and length (for example "60-min personal training"),
**so that** clients know what they're booking and how long it takes.

- Given I enter a name and a length of 60 minutes, when I save, then the session type appears in the list clients choose from.
- Given the length is empty or 0, when I save, then I see an error and it isn't saved.

### O5 — See all bookings

**As the** owner, **I want** to see all bookings for all coaches in one list,
**so that** I can answer "is there a free slot?" questions and spot problems without messaging each coach.

- Given there are bookings for 3 coaches this week, when I open Bookings, then I see each one with date, time, coach, client, session type and status.
- Given I filter by one coach, then I see only that coach's bookings.

### O6 — Edit or archive a session type

**As the** owner, **I want** to rename or archive a session type,
**so that** clients only see the sessions we offer now.

- Given I archive "30-min assessment", when a client chooses a session type, then it isn't in the list.
- Given a client already booked an archived session type, then that booking stays as it is.

---

## Coach

### CO1 — Set weekly working hours

**As a** coach, **I want** to set my working hours for each day of the week,
**so that** clients can only book me when I'm actually at the gym.

- Given I work Mondays 09:00–13:00, when a client looks at a Monday, then they only see slots between 09:00 and 13:00.
- Given the end time is before the start time, when I save, then I see an error.

### CO2 — Mark days off

**As a** coach, **I want** to mark specific dates as days off,
**so that** nobody books me when I'm away.

- Given 10 October is a day off, when a client looks at that date, then no slots are shown for me.
- Given I already have a booking on that date, when I mark it off, then I'm warned about that booking first.

### CO3 — Cancel a session

**As a** coach, **I want** to cancel a booked session,
**so that** the client finds out early and doesn't come for nothing.

- Given a client has booked me, when I cancel, then the booking shows as "Cancelled by coach" in the client's bookings and the slot is no longer in my upcoming sessions.

### CO4 — Mark a client as a no-show

**As a** coach, **I want** to mark a client as a no-show after a session,
**so that** the gym has a record of missed sessions.

- Given the session's start time has passed, when I mark it as a no-show, then its status becomes "No-show".
- Given the session hasn't started yet, then the no-show option isn't available.

### CO5 — See my week on one screen

**As a** coach, **I want** to see all my sessions for the week on one screen,
**so that** I can plan my week without checking messages or notes.

- Given Mark booked me for Tuesday 10:00, when I open This week, then I see Tuesday 10:00 with "Mark" and "60-min personal training".
- Given a client cancelled a session, when I open This week, then it is shown greyed out and marked "Cancelled".
- Given another coach has bookings, when I open This week, then I see only my own sessions.

### CO6 — See who is coming

**As a** coach, **I want** to open a session and see the client and session details,
**so that** I know who is coming and can prepare.

- Given Mark booked 60-min personal training at 18:20, when I open that session, then I see "Mark", "60-min personal training", "60 minutes" and "18:20".

### CO7 — Accept an invite

**As a** coach, **I want** to accept the owner's invite and create my account,
**so that** I can work at this gym in CoachSlot.

- Given I received an invite link from the owner, when I open it and set my name and password, then my account is created and I appear in the owner's coach list as "Active".
- Given the link was already used or has expired, when I open it, then I see "This invite is no longer valid, ask the gym for a new one".

---

## Client

### C1 — See available slots

**As a** client, **I want** to choose a session type and a coach and see their free time slots,
**so that** I can pick a time that suits me without messaging the gym.

- Given a coach works 09:00–12:00 and is booked at 10:00, when I view that day for a 60-min session, then 09:00 and 11:00 are shown and 10:00 is not.
- Given it's the coach's day off, then I see no slots and the message "No free times on this day".

### C2 — Book a slot

**As a** client, **I want** to book a free slot,
**so that** my session with the coach is confirmed.

- Given a slot is free, when I book it, then it appears in my upcoming bookings and disappears for other clients.
- Given someone else booked it a moment before me, when I book, then I see a clear message and the updated list of slots.

### C3 — Cancel a booking

**As a** client, **I want** to cancel my booking,
**so that** I don't take a slot I won't use.

- Given my session starts in more than 24 hours, when I cancel, then it shows as "Cancelled" and the slot becomes free again.
- Given my session starts in less than 24 hours, when I try to cancel, then I see why I can't and who to contact.

### C4 — Create an account

**As a** client, **I want** to create an account at my gym,
**so that** I can book sessions myself.

- Given I'm on my gym's sign-up page, when I enter my name, email and password, then my account is created and I'm logged in.
- Given my password is shorter than 8 characters, when I sign up, then I see an error and no account is created.

### C5 — See my upcoming bookings

**As a** client, **I want** to see my upcoming bookings,
**so that** I know when and with whom my next sessions are.

- Given I have 2 bookings next week, when I open My bookings, then I see both with date, time, coach and session type, earliest first.

### C6 — See my past bookings

**As a** client, **I want** to see my past bookings,
**so that** I can check which sessions I attended.

- Given I had a session last Monday, when I open Past bookings, then I see it with its status ("Completed", "Cancelled" or "No-show").

### C7 — See that my coach cancelled

**As a** client, **I want** to see when my coach cancels my session,
**so that** I don't travel to the gym for nothing.

- Given my coach cancelled my Thursday session, when I open My bookings, then it shows "Cancelled by coach" at the top.

---

## Everyone (accounts and security)

### A1 — Log in and log out

**As a** user (owner, coach or client), **I want** to log in and log out,
**so that** only I can use my account.

- Given I enter the correct email and password, when I log in, then I see the home page for my role.
- Given I enter a wrong password, then I see "Email or password is incorrect" (without saying which one is wrong).
- Given I log out, when I press Back in the browser, then I can't see my account pages.

### A2 — Reset my password

**As a** user, **I want** to reset a forgotten password,
**so that** I don't lose access to my account.

- Given I request a reset for my email, then I get a reset link that works once and expires after 1 hour.

### S1 — Clients only see their own bookings

**As a** client, **I want** nobody else to see my bookings,
**so that** my personal information stays private.

- Given I'm logged in as client A, when I try to open client B's booking (for example by changing the ID in the URL), then I get "Not found".

### S2 — Each gym's data stays separate

**As the** owner, **I want** my gym's data to be invisible to other gyms,
**so that** my business information stays private.

- Given I'm the owner of Gym A, when I try to open a coach, booking or session type from Gym B, then I get "Not found".

### S3 — Only the owner manages the gym

**As the** owner, **I want** only me to be able to invite or remove coaches and change session types,
**so that** nobody else can change how the gym works.

- Given I'm logged in as a coach or client, when I try to invite a coach or edit a session type, then I'm refused and nothing changes.
