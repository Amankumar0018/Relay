import sqlite3
import httpx

conn = sqlite3.connect('backend/relay.db')
c = conn.cursor()
docs = c.execute('SELECT COUNT(*) FROM documents').fetchone()[0]
entities = c.execute('SELECT COUNT(*) FROM extracted_entities').fetchone()[0]
facts = c.execute('SELECT COUNT(*) FROM extracted_facts').fetchone()[0]
open_conflicts = c.execute("SELECT COUNT(*) FROM knowledge_conflicts WHERE status='open'").fetchone()[0]
all_conflicts = c.execute('SELECT status, COUNT(*) FROM knowledge_conflicts GROUP BY status').fetchall()

print(f"DB Documents: {docs}")
print(f"DB Entities: {entities}")
print(f"DB Facts: {facts}")
print(f"DB Open Conflicts: {open_conflicts}")
print(f"DB All Conflicts: {all_conflicts}")

r = httpx.get('http://localhost:8000/api/v1/continuity/overview')
data = r.json()
print("\nAPI Telemetry:")
print(f"API Documents: {data.get('total_documents_deposited')}")
print(f"API Entities: {data.get('total_entities_indexed')}")
print(f"API Facts: {data.get('total_facts_extracted')}")
print(f"API Active Conflicts: {data.get('active_conflicts_count')}")
print(f"API Readiness Score: {data.get('continuity_score')}%")
print(f"API Readiness Status: {data.get('readiness_status')}")
print(f"API Critical Blockers: {data.get('critical_blockers_count')}")

