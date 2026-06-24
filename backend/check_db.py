import sqlite3

conn = sqlite3.connect("travel_planner.db")
cursor = conn.cursor()

cursor.execute("SELECT COUNT(*) FROM users")
print("Users:", cursor.fetchone()[0])

cursor.execute("SELECT COUNT(*) FROM trips")
print("Trips:", cursor.fetchone()[0])

conn.close()