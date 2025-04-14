appointments table:

id int NO PRI auto_increment
user_id int NO MUL
service varchar(100) NO
dentist varchar(100) NO
date date NO
time time NO
status enum('pending','confirmed','cancelled','completed') YES pending
notes text YES
created_at timestamp YES CURRENT_TIMESTAMP DEFAULT_GENERATED
updated_at timestamp YES CURRENT_TIMESTAMP DEFAULT_GENERATED on update CURRENT_TIMESTAMP
downpayment_status enum('pending','paid','failed') YES pending
transfer_status enum('pending','available','accepted','completed') YES pending
original_dentist varchar(255) YES

availability table:

id int NO PRI auto_increment
dentist_id int NO MUL
date date NO
time time NO
status enum('available','booked') YES available
created_at timestamp YES CURRENT_TIMESTAMP DEFAULT_GENERATED

clinic_permanent_unavailability table:

id int NO PRI auto_increment
day_of_week tinyint NO UNI
reason varchar(255) YES
created_at timestamp YES CURRENT_TIMESTAMP DEFAULT_GENERATED

clinic_temporary_unavailability table:

id int NO PRI auto_increment
start_date date NO
end_date date YES
reason varchar(255) YES
created_at timestamp YES CURRENT_TIMESTAMP DEFAULT_GENERATED

contact_messages table:

id int NO PRI auto_increment
name varchar(255) NO
email varchar(255) NO
message text NO
created_at timestamp YES CURRENT_TIMESTAMP DEFAULT_GENERATED

dentist_availability table:

id int NO PRI auto_increment
dentist_id int NO MUL
date date NO
time_start time NO
time_end time NO
created_at timestamp YES CURRENT_TIMESTAMP DEFAULT_GENERATED

dentist_permanent_unavailability table:

id int NO PRI auto_increment
dentist_id int NO MUL
day_of_week tinyint NO
created_at timestamp YES CURRENT_TIMESTAMP DEFAULT_GENERATED

dentist_temporary_unavailability table:

id int NO PRI auto_increment
dentist_id int NO MUL
start_date date NO
end_date date YES
reason varchar(255) YES
created_at timestamp YES CURRENT_TIMESTAMP DEFAULT_GENERATED

dentists table:

id int NO PRI auto_increment
specialization varchar(255) YES
phone varchar(20) NO
email varchar(255) YES
created_at timestamp YES CURRENT_TIMESTAMP DEFAULT_GENERATED
user_id int NO UNI
bio text YES

patient_notes table:

id int NO PRI auto_increment
dentist_id int NO MUL
patient_id int NO MUL
appointment_id int YES MUL
notes text NO
created_at timestamp YES CURRENT_TIMESTAMP DEFAULT_GENERATED

users table:

id int NO PRI auto_increment
name varchar(255) NO
email varchar(255) NO UNI
password varchar(255) NO
dob date NO
phone varchar(20) YES
gender enum('male','female','other') YES
address text YES
role enum('patient','admin','dentist') YES patient
created_at timestamp YES CURRENT_TIMESTAMP DEFAULT_GENERATED
updated_at timestamp YES CURRENT_TIMESTAMP DEFAULT_GENERATED on update CURRENT_TIMESTAMP
