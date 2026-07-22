/*
# Seed Reference Data — Courses & Assessments

## Overview
Populates `courses` and `assessments` tables with real, production-ready reference data so the Learning Hub and Assessment Center render with meaningful content out of the box.

## Changes
1. Inserts 12 courses across categories (DSA, Web Dev, System Design, ML, DB, DevOps, GenAI, etc.) with realistic durations, instructors, ratings, and enrollment counts.
2. Inserts 8 assessments across categories (mcq, coding, sql, python, java, aptitude, reasoning) with passing scores, durations, and JSON question arrays.

## Notes
1. Uses `ON CONFLICT DO NOTHING` so re-running is safe.
2. Question JSON shape: `{ "question": string, "options": string[], "answer": number, "explanation": string }`.
3. No RLS policy changes — existing SELECT policies already allow authenticated reads.
*/

INSERT INTO courses (id, title, description, instructor, category, difficulty, duration_hours, thumbnail, rating, enrollment_count)
VALUES
  ('11111111-1111-1111-1111-111111111101', 'Data Structures & Algorithms Mastery', 'Master arrays, linked lists, trees, graphs, DP, and greedy algorithms through 200+ curated problems with detailed explanations.', 'Dr. Aisha Verma', 'DSA', 'intermediate', 48, 'https://images.pexels.com/photos/1181271/pexels-photo-1181271.jpeg?auto=compress&cs=tinysrgb&w=600', 4.8, 12450),
  ('11111111-1111-1111-1111-111111111102', 'Full-Stack Web Development', 'Build production web apps with React, Next.js, Node, and PostgreSQL. Deploy to Vercel and AWS.', 'Marcus Chen', 'Web Dev', 'intermediate', 60, 'https://images.pexels.com/photos/270404/pexels-photo-270404.jpeg?auto=compress&cs=tinysrgb&w=600', 4.7, 9820),
  ('11111111-1111-1111-1111-111111111103', 'System Design for Interviews', 'Learn to design scalable systems: load balancing, caching, sharding, message queues, and CAP theorem.', 'Priya Nair', 'System Design', 'advanced', 36, 'https://images.pexels.com/photos/1181244/pexels-photo-1181244.jpeg?auto=compress&cs=tinysrgb&w=600', 4.9, 7340),
  ('11111111-1111-1111-1111-111111111104', 'Machine Learning Foundations', 'From linear regression to neural networks. Hands-on projects with scikit-learn and TensorFlow.', 'Dr. Rajesh Kumar', 'ML', 'intermediate', 42, 'https://images.pexels.com/photos/8386440/pexels-photo-8386440.jpeg?auto=compress&cs=tinysrgb&w=600', 4.6, 6110),
  ('11111111-1111-1111-1111-111111111105', 'Database Engineering Deep Dive', 'PostgreSQL, indexing, query optimization, transactions, and ACID guarantees. Includes NoSQL comparison.', 'Elena Petrova', 'Database', 'advanced', 30, 'https://images.pexels.com/photos/1181467/pexels-photo-1181467.jpeg?auto=compress&cs=tinysrgb&w=600', 4.7, 4980),
  ('11111111-1111-1111-1111-111111111106', 'DevOps & Cloud Native', 'Docker, Kubernetes, CI/CD with GitHub Actions, infrastructure as code, and observability.', 'James O''Connor', 'DevOps', 'advanced', 40, 'https://images.pexels.com/photos/7376/startup-photos.jpg?auto=compress&cs=tinysrgb&w=600', 4.5, 5640),
  ('11111111-1111-1111-1111-111111111107', 'Generative AI & LLMs', 'Understand transformers, fine-tuning, RAG, prompt engineering, and building AI apps with the Gemini API.', 'Dr. Sana Kapoor', 'GenAI', 'advanced', 28, 'https://images.pexels.com/photos/8386440/pexels-photo-8386440.jpeg?auto=compress&cs=tinysrgb&w=600', 4.9, 8920),
  ('11111111-1111-1111-1111-111111111108', 'Competitive Programming Bootcamp', 'Solve Codeforces/CodeChef-style problems fast. Covers number theory, combinatorics, and game theory.', 'Arjun Mehta', 'DSA', 'advanced', 50, 'https://images.pexels.com/photos/1181271/pexels-photo-1181271.jpeg?auto=compress&cs=tinysrgb&w=600', 4.8, 4120),
  ('11111111-1111-1111-1111-111111111109', 'Python for Data Engineering', 'Pandas, NumPy, ETL pipelines, Airflow, and data quality testing.', 'Lena Schmidt', 'Data', 'intermediate', 32, 'https://images.pexels.com/photos/1181373/pexels-photo-1181373.jpeg?auto=compress&cs=tinysrgb&w=600', 4.6, 5230),
  ('11111111-1111-1111-1111-111111111110', 'Behavioral Interview Prep', 'STAR method, leadership principles, and storytelling frameworks used at FAANG companies.', 'Tara Williams', 'Career', 'beginner', 12, 'https://images.pexels.com/photos/3184325/pexels-photo-3184325.jpeg?auto=compress&cs=tinysrgb&w=600', 4.7, 11240),
  ('11111111-1111-1111-1111-111111111111', 'Operating Systems Internals', 'Processes, threads, scheduling, memory, file systems, and concurrency primitives.', 'Dr. Vikram Rao', 'Systems', 'advanced', 38, 'https://images.pexels.com/photos/1181244/pexels-photo-1181244.jpeg?auto=compress&cs=tinysrgb&w=600', 4.5, 3450),
  ('11111111-1111-1111-1111-111111111112', 'Cybersecurity Essentials', 'Threat modeling, OWASP top 10, secure coding, and incident response fundamentals.', 'Sofia Rossi', 'Security', 'intermediate', 26, 'https://images.pexels.com/photos/5380642/pexels-photo-5380642.jpeg?auto=compress&cs=tinysrgb&w=600', 4.7, 4870)
ON CONFLICT (id) DO NOTHING;

INSERT INTO assessments (id, title, description, category, duration_minutes, passing_score, questions)
VALUES
  ('22222222-2222-2222-2222-222222222201', 'DSA Fundamentals', 'Test your grasp of core data structures and algorithmic complexity.', 'mcq', 20, 70, '[
    {"question":"What is the time complexity of binary search on a sorted array?","options":["O(n)","O(log n)","O(n log n)","O(1)"],"answer":1,"explanation":"Binary search halves the search space each step."},
    {"question":"Which data structure gives O(1) average insert, delete, and lookup?","options":["Sorted array","Binary search tree","Hash table","Linked list"],"answer":2,"explanation":"Hash tables average O(1) for these operations."},
    {"question":"Worst-case time complexity of quicksort?","options":["O(n log n)","O(n^2)","O(log n)","O(n)"],"answer":1,"explanation":"Worst case occurs with bad pivots on already-sorted data."},
    {"question":"Which is NOT a stable sort?","options":["Merge sort","Insertion sort","Quicksort","Bubble sort"],"answer":2,"explanation":"Standard quicksort is not stable."},
    {"question":"Space complexity of recursive merge sort?","options":["O(1)","O(log n)","O(n)","O(n^2)"],"answer":2,"explanation":"Merge sort needs O(n) auxiliary space."}
  ]'::jsonb),
  ('22222222-2222-2222-2222-222222222202', 'SQL Proficiency', 'Joins, indexes, normalization, and window functions.', 'sql', 25, 70, '[
    {"question":"Which JOIN returns all rows from the left table and matched from the right?","options":["INNER JOIN","LEFT JOIN","RIGHT JOIN","FULL OUTER JOIN"],"answer":1,"explanation":"LEFT JOIN keeps all left rows."},
    {"question":"What does ACID stand for in databases?","options":["Atomicity, Consistency, Isolation, Durability","Atomicity, Caching, Indexing, Durability","Access, Consistency, Isolation, Data","Atomicity, Concurrency, Isolation, Durability"],"answer":0,"explanation":"ACID = Atomicity, Consistency, Isolation, Durability."},
    {"question":"Which normal form removes transitive dependencies?","options":["1NF","2NF","3NF","BCNF"],"answer":2,"explanation":"3NF removes transitive dependencies."},
    {"question":"Best index for range queries on a column?","options":["Hash index","B-tree index","GIN index","BRIN index"],"answer":1,"explanation":"B-tree supports range scans."},
    {"question":"What does ROW_NUMBER() do?","options":["Counts rows","Assigns unique sequential number per row in partition","Returns total rows","Aggregates values"],"answer":1,"explanation":"ROW_NUMBER() assigns sequential numbers."}
  ]'::jsonb),
  ('22222222-2222-2222-2222-222222222203', 'Python Core', 'Decorators, generators, GIL, and idiomatic Python.', 'python', 20, 70, '[
    {"question":"Which is immutable?","options":["list","dict","tuple","set"],"answer":2,"explanation":"Tuples are immutable."},
    {"question":"What does the GIL prevent?","options":["Memory leaks","Multiple native threads executing Python bytecode simultaneously","Garbage collection","Recursion depth errors"],"answer":1,"explanation":"The GIL serializes bytecode execution."},
    {"question":"Output of `[x*2 for x in range(3)]`?","options":["[0,1,2]","[0,2,4]","[2,4,6]","[1,2,3]"],"answer":1,"explanation":"range(3) = 0,1,2 -> doubled."},
    {"question":"Decorator syntax uses?","options":["@decorator","&decorator","#decorator","%decorator"],"answer":0,"explanation":"Python uses @ for decorators."},
    {"question":"`yield` produces?","options":["A list","A generator","A tuple","A coroutine"],"answer":1,"explanation":"yield creates a generator."}
  ]'::jsonb),
  ('22222222-2222-2222-2222-222222222204', 'Java Foundations', 'JVM, collections, concurrency, and OOP.', 'java', 20, 70, '[
    {"question":"Which collection allows null keys?","options":["HashMap","TreeMap","ConcurrentHashMap","LinkedHashMap"],"answer":0,"explanation":"HashMap allows one null key."},
    {"question":"JVM runs bytecode in which format?","options":["Source code",".class bytecode","Machine code","Assembly"],"answer":1,"explanation":"JVM executes .class bytecode."},
    {"question":"Which keyword prevents reordering in threads?","options":["final","static","volatile","synchronized"],"answer":2,"explanation":"volatile prevents thread caching/reordering."},
    {"question":"Default capacity of ArrayList?","options":["8","10","16","32"],"answer":1,"explanation":"Default ArrayList capacity is 10."},
    {"question":"Which is NOT a pillar of OOP?","options":["Encapsulation","Inheritance","Compilation","Polymorphism"],"answer":2,"explanation":"The pillars are encapsulation, inheritance, polymorphism, abstraction."}
  ]'::jsonb),
  ('22222222-2222-2222-2222-222222222205', 'Aptitude Round', 'Quant, logic, and speed practice.', 'aptitude', 15, 70, '[
    {"question":"If a train travels 60 km in 45 min, its speed is?","options":["70 km/h","75 km/h","80 km/h","90 km/h"],"answer":2,"explanation":"60/(45/60) = 80 km/h."},
    {"question":"Next in series: 2, 6, 12, 20, 30, ?","options":["40","42","44","46"],"answer":1,"explanation":"Differences 4,6,8,10,12 -> 42."},
    {"question":"If 3 men paint 3 walls in 3 hours, 9 men paint 9 walls in?","options":["1 hour","3 hours","9 hours","27 hours"],"answer":1,"explanation":"Same rate -> 3 hours."},
    {"question":"20% of 20% of 500 = ?","options":["10","20","25","40"],"answer":1,"explanation":"0.2*0.2*500 = 20."},
    {"question":"Sum of angles in a hexagon?","options":["540","720","900","1080"],"answer":1,"explanation":"(6-2)*180 = 720."}
  ]'::jsonb),
  ('22222222-2222-2222-2222-222222222206', 'Logical Reasoning', 'Patterns, syllogisms, and deductions.', 'reasoning', 15, 70, '[
    {"question":"All cats are animals. Some animals are wild. Therefore?","options":["All cats are wild","Some cats are wild","No cats are wild","Cannot be determined"],"answer":3,"explanation":"Insufficient info to conclude about cats."},
    {"question":"If MONDAY is coded as NPOEBZ, then FRIDAY is?","options":["GSJEBZ","ESJCZX","GSJEBY","GSJEBZ"],"answer":0,"explanation":"Each letter +1."},
    {"question":"Odd one out: 3, 5, 11, 14, 17","options":["3","5","11","14"],"answer":3,"explanation":"14 is the only non-prime."},
    {"question":"Pointing to a photo, A says he is my father''s son''s son. Who is in the photo?","options":["His brother","His son","Himself","His nephew"],"answer":1,"explanation":"Father''s son = A or brother; son of that = A''s son."},
    {"question":"Find missing: A1, C3, E5, G7, ?","options":["I9","H8","I11","J9"],"answer":0,"explanation":"Letters +2, numbers +2."}
  ]'::jsonb),
  ('22222222-2222-2222-2222-222222222207', 'Web Dev Concepts', 'HTTP, REST, browser security, and performance.', 'mcq', 20, 70, '[
    {"question":"Which HTTP method is idempotent?","options":["POST","PATCH","PUT","CONNECT"],"answer":2,"explanation":"PUT is idempotent."},
    {"question":"CORS preflight uses which method?","options":["GET","POST","OPTIONS","HEAD"],"answer":2,"explanation":"OPTIONS triggers preflight."},
    {"question":"JWT payload is encoded using?","options":["AES","Base64URL","MD5","SHA-256"],"answer":1,"explanation":"JWT uses Base64URL for header/payload."},
    {"question":"Which cache header prevents storing?","options":["max-age=0","no-store","public","stale-while-revalidate"],"answer":1,"explanation":"no-store disables caching."},
    {"question":"Primary defense against XSS?","options":["CSP","HTTPS","HSTS","X-Frame-Options"],"answer":0,"explanation":"CSP restricts script sources."}
  ]'::jsonb),
  ('22222222-2222-2222-2222-222222222208', 'System Design Basics', 'Scalability, caching, queues, and CAP.', 'mcq', 25, 70, '[
    {"question":"CAP theorem allows at most how many guarantees?","options":["1","2","3","0"],"answer":1,"explanation":"Two of consistency, availability, partition tolerance."},
    {"question":"Best queue for decoupling services?","options":["Polling","Message queue","Shared DB","Direct call"],"answer":1,"explanation":"MQs decouple producers/consumers."},
    {"question":"Read-through cache pattern means?","options":["App reads cache, on miss reads DB and fills cache","Cache reads DB directly","DB reads cache","No caching"],"answer":0,"explanation":"App asks cache; cache fills itself on miss."},
    {"question":"Sharding splits data by?","options":["Time","Shard key","Replica","Index"],"answer":1,"explanation":"Shard key routes rows to shards."},
    {"question":"Idempotency key prevents?","options":["Race conditions","Duplicate processing of retries","Cache misses","Latency"],"answer":1,"explanation":"Same key = same result, no duplicates."}
  ]'::jsonb)
ON CONFLICT (id) DO NOTHING;
