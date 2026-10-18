/* Reference lists. Order matters: hospital records store medicine and test values in these orders. */
const MED=[['Paracetamol',.5],['ORS',.12],['Amoxicillin',.15],['Iron-folic acid',.2],['Insulin',.03]];
const TESTS=['Malaria RDT','Haemoglobin','Blood sugar','Dengue NS1','Urine pregnancy','HIV'];

/* Equipment tracked per facility: [name, key]. key=1 means "not working" raises a flag. Status codes in facility.eq: 1 working, 0 not working, 2 not provisioned for this facility type. */
const EQ=[['Oxygen supply',1],['Ambulance',1],['Power backup',1],['Water supply',1],['Vaccine cold chain',1],['X-ray',0],['Ultrasound',0],['ECG',0],['Labour room kit',0],['Autoclave',0]];
const EQ_ST={0:'Not working',1:'Working',2:'Not provisioned'};
/* Doctor duty codes used in facility.docs = [[specialty, duty, 7-day attendance %], ...] */
const DUTY={D:'On duty',C:'On call',O:'Off duty today',L:'On leave'};
