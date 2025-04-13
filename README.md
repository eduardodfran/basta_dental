# BastaDental System

## Appointment Availability System

The appointment scheduling system follows these rules:

1. **Default Working Hours**: Dentists' working hours are set to Monday-Friday, 9:00 AM - 5:00 PM by default.

2. **Unavailability Management**: Dentists can mark specific days or periods when they're unavailable:

   - **Permanent Unavailability**: For recurring days like weekends
   - **Temporary Unavailability**: For specific dates like vacations or conferences

3. **Appointment Booking Process**:

   - Patients can only select from available time slots
   - Time slots follow 30-minute intervals (9:00, 9:30, etc.)
   - A time slot is considered unavailable if:
     - It's outside the dentist's working hours
     - It's on a day marked as permanently unavailable
     - It falls within a temporary unavailability period
     - It's already booked by another patient
   - **Important**: The system strictly enforces dentist availability rules

4. **Booking Interface**: In the patient booking view, unavailable time slots are visually distinguished and cannot be selected.

5. **Unavailability Enforcement**: The system enforces unavailability at multiple levels:

   - Frontend: Checks availability before loading time slots
   - API: Validates availability before processing appointments
   - Database: Maintains separate tables for permanent and temporary unavailability

6. **Reschedule Protection**: When rescheduling appointments, the system also checks dentist availability to prevent booking on unavailable days.

## Additional Information

...
