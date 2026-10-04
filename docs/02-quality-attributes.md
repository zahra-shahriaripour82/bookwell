# CoachSlot: Quality attributes

The three qualities CoachSlot v1 must get right, each with one
scenario we can measure or test.

## 1. Correctness

**What it means:** The schedule is always right. A slot is never
booked twice, and the 24h cancel rule always works.

**Why it's top 3:** "The same slot can never be booked twice" is
in our success list. If it fails, gyms stop trusting the app.

**Scenario:**

- Situation: Two clients book Coach Sara's Tuesday 10:00 slot
  at the same moment.
- Expected result: Exactly one booking succeeds. The other client
  sees "This slot was just taken".
- How we check it: An automated test sends both bookings at the
  same time and checks that only one exists.

## 2. Tenant security

**What it means:** One gym can never see or change the schedule,
clients or bookings of another gym.

**Why it's top 3:** If a gym could see another gym's clients and
bookings, private information would leak and gyms would stop
trusting CoachSlot.

**Scenario:**

- Situation: The owner of Gym A is logged in and tries to open a
  booking that belongs to Gym B.
- Expected result: They see "Not found" and get no data.
- How we check it: An automated test logs in as Gym A, requests
  a Gym B booking, and checks that the answer is "Not found" and
  contains no booking data.

## 3. Maintainability

**What it means:** The code is easy to change without breaking
other parts.

**Why it's top 3:** I will keep adding features for 20 weeks, so
if the code is messy, every change will be difficult.

**Scenario:**

- Situation: The owner wants to change the cancel limit from 24h
  to 12h.
- Expected result: I change it in 1 place and all tests still pass.
- How we check it: Count the files changed in the PR. The goal is
  1 file (plus its test).

## Not a priority in v1

- **Handling millions of users:** our users are small gyms with a
  few coaches and clients, so simple and correct beats fast at scale.
- **Real-time updates:** listed as "Not in v1" in the product brief.
  Refreshing the page is good enough for now.
- **Mobile app:** also "Not in v1". A website that works on a phone
  covers the need.
