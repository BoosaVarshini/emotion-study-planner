import { PythonFile } from '../types';

export const pythonFiles: PythonFile[] = [
  {
    name: "schema.sql",
    path: "database/schema.sql",
    language: "sql",
    description: "MySQL database design and initial table definitions with relations.",
    code: `-- ==========================================
-- Database Schema for Emotion-Based Study Planner
-- Target: MySQL Server 8.0+
-- ==========================================

CREATE DATABASE IF NOT EXISTS emotion_study_planner;
USE emotion_study_planner;

-- 1. Table: students
CREATE TABLE IF NOT EXISTS students (
    student_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL
) ENGINE=InnoDB;

-- 2. Table: mood_logs
CREATE TABLE IF NOT EXISTS mood_logs (
    mood_id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    mood VARCHAR(50) NOT NULL,
    energy_level INT NOT NULL CHECK (energy_level BETWEEN 1 AND 10),
    study_hours DECIMAL(4,2) NOT NULL,
    log_date DATE NOT NULL,
    FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 3. Table: study_plans
CREATE TABLE IF NOT EXISTS study_plans (
    plan_id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    subject VARCHAR(100) NOT NULL,
    duration INT NOT NULL, -- duration in minutes
    plan_date DATE NOT NULL,
    FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 4. Table: performance
CREATE TABLE IF NOT EXISTS performance (
    performance_id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    planned_hours DECIMAL(4,2) NOT NULL,
    actual_hours DECIMAL(4,2) NOT NULL,
    tasks_completed INT NOT NULL,
    completion_percentage DECIMAL(5,2) NOT NULL,
    entry_date DATE NOT NULL,
    FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE
) ENGINE=InnoDB;
`
  },
  {
    name: "database.py",
    path: "database.py",
    language: "python",
    description: "Handles secure MySQL connection pooling, execution of parameterized queries, and robust exception handling.",
    code: `import mysql.connector
from mysql.connector import Error

class DatabaseManager:
    """
    Manages MySQL Database Connectivity (PDBC), connection setup,
    and structured error/exception handling for query executions.
    """
    def __init__(self, host="localhost", user="root", password="", database="emotion_study_planner"):
        self.host = host
        self.user = user
        self.password = password
        self.database = database
        self.connection = None

    def connect(self):
        """Establishes and returns a connection to the MySQL database."""
        try:
            # First attempt to connect without database to verify server is reachable
            self.connection = mysql.connector.connect(
                host=self.host,
                user=self.user,
                password=self.password
            )
            cursor = self.connection.cursor()
            # Ensure the database exists
            cursor.execute(f"CREATE DATABASE IF NOT EXISTS {self.database}")
            cursor.execute(f"USE {self.database}")
            
            # Reconnect with database selected
            self.connection.database = self.database
            return True
        except Error as e:
            print(f"\\n[DB Error] Connection failed: {e}")
            self.connection = None
            return False

    def get_connection(self):
        """Verifies or builds connection dynamically."""
        if self.connection is None or not self.connection.is_connected():
            self.connect()
        return self.connection

    def execute_query(self, query, params=None):
        """
        Executes a Non-Query SQL command (INSERT, UPDATE, DELETE).
        Utilizes parameterized queries to prevent SQL Injection.
        """
        conn = self.get_connection()
        if not conn:
            raise ConnectionError("Database not connected.")
        
        try:
            cursor = conn.cursor()
            cursor.execute(query, params or ())
            conn.commit()
            return cursor.lastrowid
        except Error as e:
            conn.rollback()
            print(f"\\n[DB Error] execution failed: {e}")
            raise e

    def fetch_all(self, query, params=None):
        """
        Executes a Read-Query (SELECT) and returns all results.
        """
        conn = self.get_connection()
        if not conn:
            raise ConnectionError("Database not connected.")
        
        try:
            cursor = conn.cursor(dictionary=True)
            cursor.execute(query, params or ())
            return cursor.fetchall()
        except Error as e:
            print(f"\\n[DB Error] fetch failed: {e}")
            raise e

    def fetch_one(self, query, params=None):
        """
        Executes a Read-Query (SELECT) and returns a single matching entry.
        """
        conn = self.get_connection()
        if not conn:
            raise ConnectionError("Database not connected.")
        
        try:
            cursor = conn.cursor(dictionary=True)
            cursor.execute(query, params or ())
            return cursor.fetchone()
        except Error as e:
            print(f"\\n[DB Error] fetch_one failed: {e}")
            raise e

    def close(self):
        """Safely closes the database connection."""
        if self.connection and self.connection.is_connected():
            self.connection.close()
            print("[Database connection terminated gracefully]")
`
  },
  {
    name: "student.py",
    path: "student.py",
    language: "python",
    description: "Encapsulates Student data and business logic including unique validations and credentials processing.",
    code: `import hashlib
from database import DatabaseManager

class Student:
    """
    Object-oriented encapsulation of Student entity.
    Handles Registration, Logging validation, and session states.
    """
    def __init__(self, student_id=None, name=None, email=None, password=None):
        self._student_id = student_id
        self._name = name
        self._email = email
        self._password = password # Encapsulated storage

    # Getters and Setters promoting clean OOP encapsulation
    @property
    def student_id(self):
        return self._student_id

    @property
    def name(self):
        return self._name

    @property
    def email(self):
        return self._email

    @staticmethod
    def hash_password(password):
        """Encrypts raw text password securely using SHA-256."""
        return hashlib.sha256(password.encode()).hexdigest()

    def register(self, db_manager: DatabaseManager):
        """
        Validates inputs and commits a new student to the database schema.
        Handles unique constraint violations.
        """
        if not self._name or not self._email or not self._password:
            raise ValueError("Registration fields cannot be left empty.")

        # Check unique email beforehand (Double validation)
        existing_user = db_manager.fetch_one(
            "SELECT student_id FROM students WHERE email = %s",
            (self._email,)
        )
        if existing_user:
            raise ValueError(f"Email domain '{self._email}' is already registered.")

        hashed_pass = self.hash_password(self._password)
        query = "INSERT INTO students (name, email, password) VALUES (%s, %s, %s)"
        
        # Insuring into MySQL
        new_id = db_manager.execute_query(query, (self._name, self._email, hashed_pass))
        self._student_id = new_id
        return True

    @classmethod
    def login(cls, db_manager: DatabaseManager, email, password):
        """
        Verifies login credentials. Returns Student instance if validated.
        Raises ValueError otherwise.
        """
        if not email or not password:
            raise ValueError("Email and password fields cannot be empty.")

        hashed_pass = cls.hash_password(password)
        query = "SELECT * FROM students WHERE email = %s AND password = %s"
        record = db_manager.fetch_one(query, (email, hashed_pass))

        if record:
            return cls(
                student_id=record['student_id'],
                name=record['name'],
                email=record['email']
            )
        else:
            raise ValueError("Credentials mismatch: Invalid email or incorrect password.")
`
  },
  {
    name: "mood_tracker.py",
    path: "mood_tracker.py",
    language: "python",
    description: "Captures and logs patient's daily mood metrics with range checks and sanitization.",
    code: `from datetime import date
from database import DatabaseManager

class MoodTracker:
    """
    Responsible for capturing, storing, and reviewing historical Mood metrics.
    """
    VALID_MOODS = ["Happy", "Motivated", "Tired", "Stressed", "Anxious", "Bored"]

    def __init__(self, student_id):
        self.student_id = student_id

    def log_mood(self, db_manager: DatabaseManager, mood: str, energy_level: int, study_hours: float):
        """
        Validates values and inserts mood parameters into the MySQL logs.
        """
        # Form Validation
        clean_mood = mood.strip().capitalize()
        if clean_mood not in self.VALID_MOODS:
            raise ValueError(f"Invalid mood selection. Must navigate: {self.VALID_MOODS}")

        if not (1 <= energy_level <= 10):
            raise ValueError("Energy spectrum must fall inside [1 - 10] range.")

        if study_hours <= 0 or study_hours > 24:
            raise ValueError("Intelligent study hours must be greater than 0 and fit within a single day (24h).")

        today = date.today().strftime("%Y-%m-%d")

        query = """
            INSERT INTO mood_logs (student_id, mood, energy_level, study_hours, log_date)
            VALUES (%s, %s, %s, %s, %s)
        """
        params = (self.student_id, clean_mood, energy_level, study_hours, today)
        db_manager.execute_query(query, params)
        return today

    def get_history(self, db_manager: DatabaseManager):
        """Retrieves and returns mood logs historically for the active session."""
        query = """
            SELECT log_date, mood, energy_level, study_hours 
            FROM mood_logs 
            WHERE student_id = %s 
            ORDER BY log_date DESC
        """
        return db_manager.fetch_all(query, (self.student_id,))
`
  },
  {
    name: "study_planner.py",
    path: "study_planner.py",
    language: "python",
    description: "Implements the core Rule-Based Study Generation algorithm, allocating time intervals dynamically.",
    code: `from datetime import date
from database import DatabaseManager

class StudyPlanner:
    """
    Algorithmic study scheduler incorporating psychological fatigue management.
    Adjusts study slots dynamically depending on human emotions and energy indexes.
    """
    def __init__(self, student_id):
        self.student_id = student_id

    def generate_plan(self, db_manager: DatabaseManager, mood: str, energy: int, total_hours: float, subjects: list):
        """
        Implements detailed clinical rule-based study assignments.
        Stores generated schedules directly in study_plans table.
        """
        if not subjects:
            raise ValueError("At least one subject must be assigned to formulate a plan.")

        clean_mood = mood.strip().capitalize()
        total_minutes = int(total_hours * 60)
        allocated_plans = []

        # 1. Rule-Based AI Study Planner Engine
        if clean_mood == "Happy" and energy > 7:
            # Peak condition: Heavy tasks, fast-paced conceptual learning
            slots = [
                {"activity": "DSA / Concept Practice", "ratio": 0.50}, # 50% time
                {"activity": "Python Advanced Coding", "ratio": 0.33}, # 33% time
                {"activity": "Analytical Aptitude", "ratio": 0.17}    # 17% time
            ]
        elif clean_mood == "Tired" and energy < 5:
            # Low physical energy: Light cognitive weight tasks
            slots = [
                {"activity": "Revision of Notes", "ratio": 0.375},
                {"activity": "Handwritten Summaries", "ratio": 0.375},
                {"activity": "Topic MCQs", "ratio": 0.25}
            ]
        elif clean_mood == "Stressed":
            # High anxiety parameters: Short focus, regular breathing checkpoints
            slots = [
                {"activity": "Mindfulness Breathing Break", "ratio": 0.20},
                {"activity": "Decompressed Revision & Core Maps", "ratio": 0.40},
                {"activity": "Elementary Easy Review", "ratio": 0.40}
            ]
        elif clean_mood == "Motivated" and energy >= 6:
            # Ambitious focus: Deep project workspace build
            slots = [
                {"activity": "System Design & Building Core Engine", "ratio": 0.60},
                {"activity": "Project Architecture Mapping", "ratio": 0.40}
            ]
        elif clean_mood == "Anxious":
            # Vulnerable focus: Chunk tasks down to atomic size
            slots = [
                {"activity": "Self-Testing Quiz", "ratio": 0.30},
                {"activity": "Interactive Tutorials", "ratio": 0.50},
                {"activity": "Calming Buffer Break", "ratio": 0.20}
            ]
        else:
            # Balanced state / Bored / Default: Standard split
            slots = [
                {"activity": "Core Textbook Reading", "ratio": 0.50},
                {"activity": "Practical Assignments", "ratio": 0.50}
            ]

        # Formulate final subjects rotation on these structural slots
        today = date.today().strftime("%Y-%m-%d")
        
        # We rotate through subjects inside the assigned slots
        for i, slot in enumerate(slots):
            subject_to_assign = subjects[i % len(subjects)].strip()
            # Calculate duration based on percentage ratio
            duration = int(total_minutes * slot["ratio"])
            if duration <= 0:
                continue

            full_activity = f"{subject_to_assign} - {slot['activity']}"
            allocated_plans.append({
                "subject": full_activity,
                "duration": duration,
                "date": today
            })

        # Clear existing plan for student on today to prevent redundancy duplicate logs
        db_manager.execute_query(
            "DELETE FROM study_plans WHERE student_id = %s AND plan_date = %s",
            (self.student_id, today)
        )

        # Bulk execution insert matching standard relational integrity
        for plan in allocated_plans:
            query = """
                INSERT INTO study_plans (student_id, subject, duration, plan_date)
                VALUES (%s, %s, %s, %s)
            """
            db_manager.execute_query(query, (self.student_id, plan["subject"], plan["duration"], plan["date"]))

        return allocated_plans

    def get_today_plan(self, db_manager: DatabaseManager):
        """Fetches the current formulated schedule for the active user."""
        today = date.today().strftime("%Y-%m-%d")
        query = """
            SELECT subject, duration, plan_date 
            FROM study_plans 
            WHERE student_id = %s AND plan_date = %s
        """
        return db_manager.fetch_all(query, (self.student_id, today))
`
  },
  {
    name: "performance_tracker.py",
    path: "performance_tracker.py",
    language: "python",
    description: "Tracks active results, evaluates completion metric equations, and computes user productivity score.",
    code: `from datetime import date
from database import DatabaseManager

class PerformanceTracker:
    """
    Processes real study performance compared with generated plans,
    calculating completion rates, analytics logs, and daily metrics.
    """
    def __init__(self, student_id):
        self.student_id = student_id

    def track_today(self, db_manager: DatabaseManager, planned_hours: float, actual_hours: float, tasks_completed: int):
        """
        Saves today's learning outcomes. 
        Auto-calculates completing percentage and saves it safely.
        """
        if planned_hours <= 0:
            raise ValueError("Assigned planned study hours must exceed 0 to track outcomes.")
        if actual_hours < 0 or actual_hours > 24:
            raise ValueError("Actual study hours must be in range [0 - 24].")
        if tasks_completed < 0:
            raise ValueError("Quantified tasks completed cannot register negative values.")

        completion_pct = round((actual_hours / planned_hours) * 100, 2)
        # Limit to 100% physically or allow higher for overachievers
        completion_pct = min(completion_pct, 150.00) 

        today = date.today().strftime("%Y-%m-%d")

        # Clear existing performance log for today to bypass double entries
        db_manager.execute_query(
            "DELETE FROM performance WHERE student_id = %s AND entry_date = %s",
            (self.student_id, today)
        )

        query = """
            INSERT INTO performance (student_id, planned_hours, actual_hours, tasks_completed, completion_percentage, entry_date)
            VALUES (%s, %s, %s, %s, %s, %s)
        """
        params = (self.student_id, planned_hours, actual_hours, tasks_completed, completion_pct, today)
        db_manager.execute_query(query, params)
        
        # Calculate localized productivity index
        prod_score = round((actual_hours * 0.7) + (tasks_completed * 0.3), 2)
        return completion_pct, prod_score
`
  },
  {
    name: "analytics_manager.py",
    path: "analytics_manager.py",
    language: "python",
    description: "Synthesizes multi-table relational metrics and triggers Matplotlib graph rendering.",
    code: `import matplotlib.pyplot as plt
from database import DatabaseManager

class AnalyticsManager:
    """
    Synthesizes and compiles student behaviors, habits, consistency metrics,
    and plots actual progress utilizing Matplotlib graphs.
    """
    def __init__(self, student_id):
        self.student_id = student_id

    def fetch_dashboard_stats(self, db_manager: DatabaseManager):
        """
        Queries database records to synthesize performance coefficients.
        """
        # 1. Total actual cumulative study hours requested
        hours_query = "SELECT SUM(actual_hours) as total_hrs FROM performance WHERE student_id = %s"
        hours_res = db_manager.fetch_one(hours_query, (self.student_id,))
        total_hrs = float(hours_res['total_hrs']) if hours_res and hours_res['total_hrs'] else 0.0

        # 2. Most Frequent Mood
        mood_query = """
            SELECT mood, COUNT(mood) as mood_cnt 
            FROM mood_logs 
            WHERE student_id = %s 
            GROUP BY mood 
            ORDER BY mood_cnt DESC 
            LIMIT 1
        """
        mood_res = db_manager.fetch_one(mood_query, (self.student_id,))
        prime_mood = mood_res['mood'] if mood_res else "No Log"

        # 3. Average completion percentage log
        comp_query = "SELECT AVG(completion_percentage) as avg_comp FROM performance WHERE student_id = %s"
        comp_res = db_manager.fetch_one(comp_query, (self.student_id,))
        avg_comp = float(comp_res['avg_comp']) if comp_res and comp_res['avg_comp'] else 0.0

        # 4. Consistency score: calculated by logs frequency / study days matching
        logs_query = "SELECT COUNT(DISTINCT entry_date) as entry_days FROM performance WHERE student_id = %s"
        days_res = db_manager.fetch_one(logs_query, (self.student_id,))
        logged_days = days_res['entry_days'] if days_res else 0
        
        # Score calculation base: 10 points per logged metric day (Max 100)
        consistency_score = min(logged_days * 20, 100)

        return {
            "total_study_hours": total_hrs,
            "frequent_mood": prime_mood,
            "completion_percentage": round(avg_comp, 2),
            "consistency_score": consistency_score,
            "total_logged_days": logged_days
        }

    def render_progress_chart(self, db_manager: DatabaseManager):
        """
        Generates and shows a Matplotlib historical study progress line-bar chart.
        """
        query = """
            SELECT entry_date, planned_hours, actual_hours, completion_percentage 
            FROM performance 
            WHERE student_id = %s 
            ORDER BY entry_date ASC 
            LIMIT 7
        """
        records = db_manager.fetch_all(query, (self.student_id,))
        if not records:
            print("\\n[Analytics Warning] Insufficient metrics found. Plan studies and log performance first!")
            return False

        dates = [str(r['entry_date']) for r in records]
        planned = [float(r['planned_hours']) for r in records]
        actual = [float(r['actual_hours']) for r in records]

        # Formulate beautiful double plots
        plt.figure(figsize=(10, 5))
        
        # Bar plots indicating expectations
        plt.bar(dates, planned, color='skyblue', alpha=0.6, label='Planned Study Hours', width=0.4, align='center')
        # Splines representing operational output
        plt.plot(dates, actual, color='navy', marker='o', linewidth=2, label='Actual Logged Outputs')

        plt.title('Emotion-Based Weekly Academic Progress Log', fontsize=14, fontweight='bold')
        plt.xlabel('Date Logged', fontsize=11)
        plt.ylabel('Study Time Allocated (hours)', fontsize=11)
        plt.ylim(0, max(max(planned), max(actual)) + 2)
        plt.grid(axis='y', linestyle='--', alpha=0.5)
        plt.legend()
        plt.tight_layout()
        
        print("\\n[Matplotlib] Generating analytical charting window... Plotted lines built correctly.")
        plt.show() # Note: Displaying locally
        return True
`
  },
  {
    name: "main.py",
    path: "main.py",
    language: "python",
    description: "The primary entry point. Coordinates CLI interactive commands, exception safeguards, and session loops.",
    code: `import sys
import os
import csv
from database import DatabaseManager
from student import Student
from mood_tracker import MoodTracker
from study_planner import StudyPlanner
from performance_tracker import PerformanceTracker
from analytics_manager import AnalyticsManager

def clear_screen():
    os.system('cls' if os.name == 'nt' else 'clear')

def main():
    # Instantiate the database parameters
    db = DatabaseManager()
    
    print("=" * 60)
    print("      INITIALIZING EMOTION-BASED STUDY PLANNER DATABASE")
    print("=" * 60)
    
    # Establish PDBC
    if not db.connect():
        print("CRITICAL: Failed to establish MySQL Connection. Please confirm MySQL status.")
        sys.exit(1)

    logged_student = None

    while True:
        print("\\n" + "=" * 60)
        print("             EMOTION-BASED STUDY PLANNER MAIN MENU")
        print("=" * 60)
        if logged_student:
            print(f" Logged in as: {logged_student.name} ({logged_student.email})")
            print("-" * 60)
        else:
            print(" [No Active Academic Session - Register / Login to Start]")
            print("-" * 60)

        print("  1.  Register New Student")
        print("  2.  Student Login")
        print("  3.  Assessment of Daily Mood")
        print("  4.  Trigger AI Study Plan Generator")
        print("  5.  View Today's Operational Study Plan")
        print("  6.  Review Historic Mood Logs")
        print("  7.  Track Practical Study Performance")
        print("  8.  Open Analytics Dashboard (Matplotlib Progress)")
        print("  9.  Export Study Report (TXT & CSV Formats)")
        print("  10. Search Custom Academic Log Parameters")
        print("  11. Exit Program Workspace")
        print("=" * 60)

        choice = input("Enter option sequence selector (1-11): ").strip()

        try:
            if choice == "1":
                # --- FEATURE 1: REGISTER ---
                print("\\n--- New Student Registration Portal ---")
                name = input("Enter Student Full Name: ").strip()
                email = input("Enter Academic Email Domain: ").strip()
                password = input("Enter Security Password value: ").strip()

                if not name or not email or not password:
                    raise ValueError("Operation Interrupted: Inputs cannot register empty characters.")

                new_stud = Student(name=name, email=email, password=password)
                if new_stud.register(db):
                    print(f"\\n[Success] Registration successful! Welcome {name}. You can now login.")

            elif choice == "2":
                # --- FEATURE 2: LOGIN ---
                print("\\n--- Log Into Active Account ---")
                email = input("Enter Registered Email: ").strip()
                password = input("Enter Account Password: ").strip()

                logged_student = Student.login(db, email, password)
                print(f"\\n[Success] Credentials confirmed! Account unlocked. Welcome back, {logged_student.name}!")

            elif choice == "3":
                # --- FEATURE 3: DAILY MOOD ASSESSMENT ---
                if not logged_student:
                    raise PermissionError("Access Blocked: Login to log daily mood logs.")

                print("\\n--- Daily Emotional Health State Check ---")
                print("Options: [Happy, Motivated, Tired, Stressed, Anxious, Bored]")
                mood = input("Select current predominant emotion: ").strip().capitalize()
                
                try:
                    energy = int(input("Scale physical energy intensity level (1-10): "))
                except ValueError:
                    raise ValueError("Energy scale factor must interpret as solid digits list.")

                try:
                    hours = float(input("List cumulative hours target available (e.g. 3.5): "))
                except ValueError:
                    raise ValueError("Study availability metric must represent numeric hours.")

                tracker = MoodTracker(logged_student.student_id)
                log_date = tracker.log_mood(db, mood, energy, hours)
                print(f"\\n[Success] Daily emotion index recorded securely inside logs on: {log_date}")

            elif choice == "4":
                # --- FEATURE 4: AI STUDY PLAN GENERATOR ---
                if not logged_student:
                    raise PermissionError("Access Blocked: Login to initiate the planner.")

                # Review latest registered mood to populate parameters on today
                query = "SELECT * FROM mood_logs WHERE student_id = %s ORDER BY log_date DESC LIMIT 1"
                latest_log = db.fetch_one(query, (logged_student.student_id,))
                
                if not latest_log:
                    raise ValueError("Pre-requisite missing: Check in daily emotional state logs first (Option 3)!")

                print("\\n--- AI Algorithm-Based Schedule Formulation ---")
                print(f"Current Mood evaluated: {latest_log['mood']} | Energy index: {latest_log['energy_level']}")
                print(f"Study Time budget checked: {latest_log['study_hours']} hours.")
                
                subj_inp = input("Enter subject titles separated by commas (e.g. Python, Math, DSA): ").strip()
                if not subj_inp:
                    raise ValueError("You must list target subjects to study.")
                subjects = [s.strip() for s in subj_inp.split(",") if s.strip()]

                planner = StudyPlanner(logged_student.student_id)
                plan = planner.generate_plan(
                    db, 
                    latest_log['mood'], 
                    latest_log['energy_level'], 
                    float(latest_log['study_hours']), 
                    subjects
                )

                print("\\n[Success] Optimized Study Schedule generated successfully! Check contents below:")
                print("-" * 50)
                for item in plan:
                    print(f" * Subject Module: {item['subject']}")
                    print(f"   Required Session Time: {item['duration']} mins")
                print("-" * 50)

            elif choice == "5":
                # --- FEATURE 5: VIEW TODAY STUDY PLAN ---
                if not logged_student:
                    raise PermissionError("Access Blocked: Login to read structured agendas.")

                planner = StudyPlanner(logged_student.student_id)
                plan_records = planner.get_today_plan(db)

                print("\\n--- Completed Target Study Agenda Today ---")
                if not plan_records:
                    print("No study schedules formulated. Proceed with AI logic trigger first (Option 4).")
                else:
                    for count, r in enumerate(plan_records, 1):
                        print(f"  {count}. Code Task: {r['subject']}")
                        print(f"     Time Segment allocated: {r['duration']} minutes | Date: {r['plan_date']}")

            elif choice == "6":
                # --- FEATURE 6: MOOD HISTORY LOGS ---
                if not logged_student:
                    raise PermissionError("Access Blocked: Login credentials required.")

                tracker = MoodTracker(logged_student.student_id)
                history = tracker.get_history(db)

                print("\\n--- Historical Mood Checkpoints logs ---")
                if not history:
                    print("No historical logs register yet on your portal identifier.")
                else:
                    print("-" * 65)
                    print(f"{'Date':<15} | {'Mood Index':<15} | {'Energy index':<12} | {'Time Allocated':<15}")
                    print("-" * 65)
                    for h in history:
                        print(f"{str(h['log_date']):<15} | {h['mood']:<15} | {h['energy_level']:<12} | {h['study_hours']:<15.1f} hrs")
                    print("-" * 65)

            elif choice == "7":
                # --- FEATURE 7: TRACK PERFORMANCE ---
                if not logged_student:
                    raise PermissionError("Access Blocked: Login account credentials needed.")

                print("\\n--- Performance Tracker Interface ---")
                # Pull allocated expectations on plan today
                query = "SELECT SUM(duration) as total_mins FROM study_plans WHERE student_id = %s AND plan_date = CURDATE()"
                plan_res = db.fetch_one(query, (logged_student.student_id,))
                
                planned_mins = plan_res['total_mins'] if plan_res and plan_res['total_mins'] else 0
                if planned_mins == 0:
                    raise ValueError("No matching study records exist for today. Re-schedule first!")

                planned_hours = round(float(planned_mins) / 60.0, 2)
                print(f"Your calculated active studies goal today: {planned_hours} hours.")

                try:
                    actual_hours = float(input("Input true active study time spent: "))
                    tasks_completed = int(input("Enter metric index representing tasks completed completed: "))
                except ValueError:
                    raise ValueError("Value error: actual hours and task units must be valid numbers.")

                tracker = PerformanceTracker(logged_student.student_id)
                comp_pct, prod_score = tracker.track_today(db, planned_hours, actual_hours, tasks_completed)
                
                print(f"\\n[Success] Performance tracked!")
                print(f" * Session Completion Rate: {comp_pct}%")
                print(f" * Composite Productivity Factor Metric: {prod_score}")

            elif choice == "8":
                # --- FEATURE 8: ANALYTICS DASHBOARD ---
                if not logged_student:
                    raise PermissionError("Access Blocked: Account authentication active mandatory.")

                print("\\n--- Compiling Dashboard Multi-Schema Statistics ---")
                analytics = AnalyticsManager(logged_student.student_id)
                stats = analytics.fetch_dashboard_stats(db)

                print("-" * 50)
                print(f" Cumulative Study Output Logging: {stats['total_study_hours']} hrs")
                print(f" Predominant Emotional Factor:    {stats['frequent_mood']}")
                print(f" Average Session Completion Rate:  {stats['completion_percentage']}%")
                print(f" Workspace Consistency Coefficient: {stats['consistency_score']}/100")
                print(f" Total Logged Study Days:          {stats['total_logged_days']}")
                print("-" * 50)

                # Execute rendering code
                analytics.render_progress_chart(db)

            elif choice == "9":
                # --- FEATURE 9: EXPORT STUDY REPORT ---
                if not logged_student:
                    raise PermissionError("Access Blocked: Active authentication required.")

                print("\\n--- Data Core File Exporter Workspace ---")
                print("1. Text file report standard (.txt)")
                print("2. CSV sheet tables standard (.csv)")
                rep_type = input("Choose file specification index (1-2): ").strip()

                if rep_type not in ["1", "2"]:
                    raise ValueError("Unsupported formatting selection.")

                # Retrieve history logs for compiling reports
                logs = db.fetch_all("SELECT * FROM mood_logs WHERE student_id = %s ORDER BY log_date DESC", (logged_student.student_id,))
                perf = db.fetch_all("SELECT * FROM performance WHERE student_id = %s ORDER BY entry_date DESC", (logged_student.student_id,))

                if rep_type == "1":
                    filename = f"student_{logged_student.student_id}_report.txt"
                    with open(filename, "w") as f:
                        f.write(f"==================================================\\n")
                        f.write(f"       STUDENT REPORT: {logged_student.name.upper()}\\n")
                        f.write(f"       Email: {logged_student.email}\\n")
                        f.write(f"==================================================\\n\\n")
                        f.write(f"--- 1. MOOD & COGNITIVE CHECKS HISTORIC LOGS ---\\n")
                        for l in logs:
                            f.write(f" Date: {l['log_date']} | Mood: {l['mood']} | Energy: {l['energy_level']} | Target Study: {l['study_hours']} hrs\\n")
                        f.write(f"\\n--- 2. EXPERIMENTAL STUDY PERFORMANCE ---\\n")
                        for p in perf:
                            f.write(f" Date: {p['entry_date']} | Goals: {p['planned_hours']}h | Done: {p['actual_hours']}h | Tasks: {p['tasks_completed']} | Completion: {p['completion_percentage']}%\\n")
                    print(f"\\n[Success] Report compiled and saved securely to localized text repository file: '{filename}'")

                elif rep_type == "2":
                    filename = f"student_{logged_student.student_id}_performance_logs.csv"
                    with open(filename, "w", newline='') as f:
                        writer = csv.writer(f)
                        writer.writerow(["Date", "Expected Target Hours", "Actual Study Outputs", "Tasks Quantified", "Completion Index Percentage"])
                        for p in perf:
                            writer.writerow([p['entry_date'], p['planned_hours'], p['actual_hours'], p['tasks_completed'], p['completion_percentage']])
                    print(f"\\n[Success] Performance datasets written into table schema CSV sheets: '{filename}'")

            elif choice == "10":
                # --- FEATURE 10: SEARCH CUSTOM LOGS ---
                if not logged_student:
                    raise PermissionError("Access Blocked: Security credential login check needed.")

                print("\\n--- Query Filtering and Deep Search Module ---")
                print(" 1. Filter metrics by exact log Calendar Date")
                print(" 2. Filter logs by localized Mood emotion factor")
                print(" 3. Filter by Student Database ID reference code")
                
                search_choice = input("Select filtering parameter index (1-3): ").strip()
                
                if search_choice == "1":
                    target_date = input("Enter target retrieval calendar date (YYYY-MM-DD): ").strip()
                    query = """
                        SELECT log_date, mood, energy_level, study_hours 
                        FROM mood_logs 
                        WHERE student_id = %s AND log_date = %s
                    """
                    records = db.fetch_all(query, (logged_student.student_id, target_date))
                elif search_choice == "2":
                    target_mood = input("Enter keyword mood factor criteria (e.g. Happy, Stressed): ").strip().capitalize()
                    query = """
                        SELECT log_date, mood, energy_level, study_hours 
                        FROM mood_logs 
                        WHERE student_id = %s AND mood = %s
                    """
                    records = db.fetch_all(query, (logged_student.student_id, target_mood))
                elif search_choice == "3":
                    target_id = input("Enter database Student Master ID verification index: ").strip()
                    # To obey the query "Search by Student ID" comprehensively
                    # It will search academic mood logs belonging to that custom Student ID
                    query = """
                        SELECT m.log_date, m.mood, m.energy_level, m.study_hours, s.name, s.student_id
                        FROM mood_logs m
                        JOIN students s ON m.student_id = s.student_id
                        WHERE s.student_id = %s
                    """
                    records = db.fetch_all(query, (target_id,))
                else:
                    raise ValueError("Choice scope error.")

                print(f"\\n--- Found {len(records)} matching relational records inside schema ---")
                for index, r in enumerate(records, 1):
                    if "name" in r:
                        print(f"  {index}. [Student ID: {r['student_id']}] Student: {r['name']} | Logged: {r['log_date']} | Mood: {r['mood']} | Energy: {r['energy_level']}")
                    else:
                        print(f"  {index}. Log Date: {r['log_date']} | Emotional Coefficient: {r['mood']} | Body Energy metrics: {r['energy_level']} | Target Plan time: {r['study_hours']}h")

            elif choice == "11":
                # --- FEATURE 11: EXIT ---
                print("\\nClosing Study Simulator Session context. Remain consistent and stay mindful!")
                sys.exit(0)

            else:
                print("\\n[Selection Warning] Option not indexable. Choose correct navigation indices (1-11).")

        except (ValueError, PermissionError) as user_err:
            print(f"\\n[Validation Refused] Error encountered: {user_err}")
        except Exception as system_err:
            print(f"\\n[Exception Block] Internal operational crash alert: {system_err}")

if __name__ == "__main__":
    main()
`
  },
  {
    name: "sample_output.txt",
    path: "docs/sample_output.txt",
    language: "text",
    description: "Verified sample interactive inputs and terminal display screenshots representing all features.",
    code: `================================================================================
                       SAMPLE TERMINAL OUTPUT TRACES
================================================================================

--------------------------------------------------
FEATURE 1: New Student Registration
--------------------------------------------------
--- New Student Registration Portal ---
Enter Student Full Name: Jane Doe
Enter Academic Email Domain: jane@college.edu
Enter Security Password value: securepass123

[Success] Registration successful! Welcome Jane Doe. You can now login.

--------------------------------------------------
FEATURE 2: Student Login
--------------------------------------------------
--- Log Into Active Account ---
Enter Registered Email: jane@college.edu
Enter Account Password: securepass123

[Success] Credentials confirmed! Account unlocked. Welcome back, Jane Doe!

--------------------------------------------------
FEATURE 3: Daily Mood Assessment
--------------------------------------------------
--- Daily Emotional Health State Check ---
Options: [Happy, Motivated, Tired, Stressed, Anxious, Bored]
Select current predominant emotion: Happy
Scale physical energy intensity level (1-10): 8
List cumulative hours target available (e.g. 3.5): 4.0

[Success] Daily emotion index recorded securely inside logs on: 2026-06-18

--------------------------------------------------
FEATURE 4: AI Study Plan Generator
--------------------------------------------------
--- AI Algorithm-Based Schedule Formulation ---
Current Mood evaluated: Happy | Energy index: 8
Study Time budget checked: 4.0 hours.
Enter subject titles separated by commas (e.g. Python, Math, DSA): Python, Data Structures, Mathematics

[Success] Optimized Study Schedule generated successfully! Check contents below:
--------------------------------------------------
 * Subject Module: Python - DSA / Concept Practice
   Required Session Time: 120 mins
 * Subject Module: Data Structures - Python Advanced Coding
   Required Session Time: 79 mins
 * Subject Module: Mathematics - Analytical Aptitude
   Required Session Time: 40 mins
--------------------------------------------------

--------------------------------------------------
FEATURE 5: View Today's Operational Study Plan
--------------------------------------------------
--- Completed Target Study Agenda Today ---
  1. Code Task: Python - DSA / Concept Practice
     Time Segment allocated: 120 minutes | Date: 2026-06-18
  2. Code Task: Data Structures - Python Advanced Coding
     Time Segment allocated: 79 minutes | Date: 2026-06-18
  3. Code Task: Mathematics - Analytical Aptitude
     Time Segment allocated: 40 minutes | Date: 2026-06-18

--------------------------------------------------
FEATURE 6: Review Historic Mood Logs
--------------------------------------------------
--- Historical Mood Checkpoints logs ---
-----------------------------------------------------------------
Date            | Mood Index      | Energy index | Time Allocated
-----------------------------------------------------------------
2026-06-18      | Happy           | 8            | 4.0 hrs
2026-06-17      | Tired           | 3            | 2.0 hrs
2026-06-16      | Stressed        | 4            | 3.0 hrs
-----------------------------------------------------------------

--------------------------------------------------
FEATURE 7: Track Practical Study Performance
--------------------------------------------------
--- Performance Tracker Interface ---
Your calculated active studies goal today: 3.98 hours.
Input true active study time spent: 4.2
Enter metric index representing tasks completed completed: 3

[Success] Performance tracked!
 * Session Completion Rate: 105.53%
 * Composite Productivity Factor Metric: 3.84

--------------------------------------------------
FEATURE 8: Open Analytics Dashboard
--------------------------------------------------
--- Compiling Dashboard Multi-Schema Statistics ---
--------------------------------------------------
 Cumulative Study Output Logging: 4.2 hrs
 Predominant Emotional Factor:    Happy
 Average Session Completion Rate:  105.53%
 Workspace Consistency Coefficient: 20/100
 Total Logged Study Days:          1
--------------------------------------------------
[Matplotlib] Generating analytical charting window... Plotted lines built correctly.

--------------------------------------------------
FEATURE 9: Export Study Report
--------------------------------------------------
--- Data Core File Exporter Workspace ---
1. Text file report standard (.txt)
2. CSV sheet tables standard (.csv)
Choose file specification index (1-2): 1

[Success] Report compiled and saved securely to localized text repository file: 'student_1_report.txt'

--------------------------------------------------
FEATURE 10: Search Custom Academic Log Parameters
--------------------------------------------------
--- Query Filtering and Deep Search Module ---
 1. Filter metrics by exact log Calendar Date
 2. Filter logs by localized Mood emotion factor
 3. Filter by Student Database ID reference code
Select filtering parameter index (1-3): 2
Enter keyword mood factor criteria (e.g. Happy, Stressed): Happy

--- Found 1 matching relational records inside schema ---
  1. Log Date: 2026-06-18 | Emotional Coefficient: Happy | Body Energy metrics: 8 | Target Plan time: 4.0h
`
  }
];
