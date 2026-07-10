-- ============================================================
-- ANTIGRAVITY — Seed Data (Updated for Email-Based Auth)
-- ============================================================

-- Default election settings
INSERT INTO election_settings (election_title, status)
VALUES ('College Association Election 2026', 'NOT_STARTED');

-- Sample candidates for testing
INSERT INTO candidates (candidate_name, position, department, bio) VALUES
-- President
('Arun Kumar', 'PRESIDENT', 'Computer Science', 'Passionate about technology and student welfare. Committed to bringing digital transformation to campus.'),
('Priya Sharma', 'PRESIDENT', 'Electronics', 'Experienced student leader with focus on inclusivity and innovation.'),
-- Vice President
('Rahul Menon', 'VICE_PRESIDENT', 'Mechanical', 'Dedicated to improving campus infrastructure and student facilities.'),
('Sneha Reddy', 'VICE_PRESIDENT', 'Information Technology', 'Advocate for equal opportunities and academic excellence.'),
-- Secretary
('Karthik Nair', 'SECRETARY', 'Civil Engineering', 'Detail-oriented organizer with experience in event management.'),
('Divya Patel', 'SECRETARY', 'Computer Science', 'Strong communicator committed to transparent governance.'),
-- Joint Secretary
('Vishnu Prasad', 'JOINT_SECRETARY', 'Electronics', 'Team player focused on student engagement and cultural events.'),
('Anjali Iyer', 'JOINT_SECRETARY', 'Mechanical', 'Committed to bridging the gap between students and administration.'),
-- Treasurer
('Mohammed Faiz', 'TREASURER', 'Information Technology', 'Finance background with experience in budget management.'),
('Lakshmi Devi', 'TREASURER', 'Computer Science', 'Transparent and accountable financial management advocate.'),
-- Joint Treasurer
('Sanjay Raj', 'JOINT_TREASURER', 'Civil Engineering', 'Focused on optimal resource allocation for student activities.'),
('Meera Krishnan', 'JOINT_TREASURER', 'Electronics', 'Dedicated to ensuring fair and efficient fund management.');

-- Sample students for testing (10 students with UNIQUE emails)
INSERT INTO students (register_number, student_name, department, year, dob, mobile_number, email) VALUES
('CS2024001', 'Aditya Verma', 'Computer Science', 2, '2004-03-15', '9876543210', 'aditya.verma@student.edu'),
('CS2024002', 'Bhavana Singh', 'Computer Science', 2, '2004-07-22', '9876543211', 'bhavana.singh@student.edu'),
('EC2024001', 'Chandra Mohan', 'Electronics', 2, '2004-01-10', '9876543212', 'chandra.mohan@student.edu'),
('ME2024001', 'Deepa Lakshmi', 'Mechanical', 2, '2004-11-05', '9876543213', 'deepa.lakshmi@student.edu'),
('IT2024001', 'Eshan Gupta', 'Information Technology', 2, '2004-09-18', '9876543214', 'eshan.gupta@student.edu'),
('CE2024001', 'Fathima Noor', 'Civil Engineering', 2, '2004-06-30', '9876543215', 'fathima.noor@student.edu'),
('CS2024003', 'Ganesh Pillai', 'Computer Science', 3, '2003-04-12', '9876543216', 'ganesh.pillai@student.edu'),
('EC2024002', 'Harini Rao', 'Electronics', 3, '2003-08-25', '9876543217', 'harini.rao@student.edu'),
('ME2024002', 'Ibrahim Khan', 'Mechanical', 3, '2003-02-14', '9876543218', 'ibrahim.khan@student.edu'),
('IT2024002', 'Janani Sundar', 'Information Technology', 3, '2003-12-08', '9876543219', 'janani.sundar@student.edu');
