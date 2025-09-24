# Basta Dental — Website Functionality Guide

This README explains what users can do on the Basta Dental website, how appointment scheduling works, and what the different statuses and flows mean. It is written for patients, dentists, and clinic staff, focusing on user-facing behavior rather than technical setup.

Quick project context:
- Repository: [basta_dental](https://github.com/eduardodfran/basta_dental)
- Structure: `frontend/` (website), `backend/` (API), `database/` (data)
- Languages: JavaScript, HTML, CSS

---

## Roles and Who Can Do What

- Patients
  - Create an account and sign in
  - Book new appointments and view existing ones
  - Reschedule or cancel according to clinic policies
  - Send messages via the Contact page

- Dentists
  - Set working hours and mark unavailability
  - Review appointments and patient details
  - Add internal patient notes tied to appointments

- Admin/Clinic Staff
  - Manage clinic-wide unavailability (e.g., holidays)
  - Oversee appointments and reassign them when needed
  - Review and respond to contact messages

---

## Core Features

### 1) Appointment Booking
- Patients can book appointments by selecting:
  - Service (e.g., cleaning, consultation, etc.)
  - Dentist
  - Date and time
- Time slots are shown in 30-minute increments (9:00, 9:30, 10:00, …).
- Unavailable slots are clearly disabled in the booking interface and cannot be selected.

A time slot is unavailable if:
- It’s outside the default working hours (Monday–Friday, 9:00 AM–5:00 PM) unless the dentist has custom hours for that date.
- The day is marked as permanently unavailable (e.g., recurring non-working days).
- The date/time falls in a temporary unavailability period (e.g., vacation, conferences, clinic closures).
- The slot is already booked by another patient.

The system enforces these rules in the UI, via the API, and in the database to keep bookings consistent and reliable.

### 2) Managing Existing Appointments
- View upcoming and past appointments with status indicators.
- Reschedule to a different valid slot; the same availability checks apply.
- Cancel if your appointment status and clinic policy allow it.

Appointment status meanings:
- pending: Appointment request created and awaiting confirmation or payment review.
- confirmed: Appointment is approved and reserved for you.
- cancelled: Appointment was cancelled by patient or clinic.
- completed: Appointment took place and is finished.

### 3) Payments and Downpayment Tracking (if enabled by clinic)
- Some services may require a downpayment.
- Downpayment status shows as:
  - pending: Payment not yet received/cleared
  - paid: Payment received
  - failed: Attempted payment did not complete
- If downpayments are required, booking confirmation may depend on payment status.

### 4) Appointment Transfers (staff-managed)
- For operational reasons, the clinic may transfer an appointment to another dentist.
- Transfer flow statuses:
  - pending: Transfer has been initiated
  - available: A receiving dentist/time is available
  - accepted: The receiving party accepted the transfer
  - completed: Transfer finalized
- The original dentist is recorded for reference.

### 5) Availability Management (Dentists and Clinic Staff)
- Default hours: Monday–Friday, 9:00 AM–5:00 PM
- Dentists can:
  - Define per-day working hours
  - Set permanent unavailability (recurring)
  - Set temporary unavailability (date ranges)
- Clinic staff can:
  - Set clinic-wide permanent or temporary closures (e.g., public holidays)
- These settings dynamically shape what patients see when booking.

### 6) Patient Notes (Dentist-facing)
- Dentists can add internal notes tied to a patient (optionally linked to a specific appointment).
- Notes help with continuity of care and are not visible to patients unless explicitly shared by clinic policy.

### 7) Contact Page
- Visitors can send messages (name, email, message).
- Clinic staff review and respond to submissions.

### 8) Accounts and Security
- Patients can sign up, sign in, and reset passwords securely.
- Profile fields may include name, date of birth, contact details, and address.
- Patient gender options include male, female, or other.

---

## Typical User Journeys

- Book an appointment (Patient)
  1. Sign up or sign in.
  2. Choose a service, dentist, and date.
  3. Pick an available 30‑minute time slot.
  4. Confirm the booking (and complete any required downpayment).
  5. Receive status updates (e.g., pending → confirmed).

- Reschedule an appointment (Patient)
  1. Open an existing appointment.
  2. Select a new date/time from available slots.
  3. Confirm; the system re-validates availability.

- Set availability (Dentist)
  1. Review default hours (Mon–Fri, 9:00–17:00).
  2. Add permanent unavailability (recurring rules).
  3. Add temporary unavailability (specific dates/ranges).
  4. Patients immediately see the updated valid slots.

- Manage clinic closures (Admin/Staff)
  1. Set clinic-wide permanent or temporary closures.
  2. The booking UI reflects closures for all dentists.

- Handle appointment transfers (Admin/Staff)
  1. Initiate a transfer (e.g., dentist unavailable).
  2. Track progress: pending → available → accepted → completed.
  3. Patient and schedules update accordingly.

---

## FAQs

- Why can’t I select a time slot?
  - It may be outside working hours, already booked, on a closed day, or during a temporary unavailability period.

- What does “pending” mean on my appointment?
  - Your request is recorded but not yet confirmed; it might be awaiting review or payment.

- Can I reschedule?
  - Yes. You can select a new date/time as long as it’s available under the same rules as initial booking.

- Do I need to pay a downpayment?
  - Some services may require it. If so, your booking may remain “pending” until payment is received.

- My appointment was moved to another dentist—why?
  - Occasionally, the clinic may transfer appointments for availability or specialization reasons. You’ll be notified when this happens.

---

## Notes and Policies

- Availability is validated in the UI and again at confirmation time to avoid double-booking.
- Clinic policies on cancellations, no-shows, and payments may vary; please refer to clinic-provided terms.
- Data privacy and security are taken seriously; only clinic-authorized roles can see internal notes.

---
