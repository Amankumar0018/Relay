import urllib.request
import json

resp = urllib.request.urlopen('http://localhost:8000/api/v1/handovers')
items = json.loads(resp.read().decode())['items']
hid = items[0]['id']

resp_full = urllib.request.urlopen(f'http://localhost:8000/api/v1/handovers/{hid}')
dossier = json.loads(resp_full.read().decode())

with open('docs/handover-dossier-v1.json', 'w', encoding='utf-8') as f:
    json.dump(dossier, f, indent=2)

content = dossier['content']
outgoing = dossier.get('outgoing_leader', {}).get('name', 'Marcus Vance')
incoming = dossier.get('incoming_leader', {}).get('name', 'Aman Kumar')

md = f"# {dossier['title']}\n\n"
md += f"**Version**: v{dossier['version']} | **Status**: {dossier['status'].upper()} | **Target Role**: {dossier.get('target_role')}\n"
md += f"**Outgoing Authority**: {outgoing} | **Incoming Successor**: {incoming}\n"
md += f"**Date**: {dossier['created_at']}\n\n---\n\n"
md += f"## Executive Summary\n\n{content['executive_summary']}\n\n"
md += f"## Mandate & Scope\n\n{content['mandate_overview']}\n\n"
md += "## Day 1 to Day 30 Operational Roadmap\n\n"
for i, act in enumerate(content.get('recommended_day_1_to_30_actions', []), 1):
    md += f"{i}. {act}\n"
md += "\n---\n\n## Chapters\n\n"
for ch in content['chapters']:
    md += f"### Chapter {ch['chapter_id'].upper()}: {ch['title']}\n\n"
    md += f"{ch['summary']}\n\n"
    if ch.get('facts'):
        md += "**Key Verified Facts:**\n"
        for f in ch['facts']:
            md += f"- **{f.get('category', 'FACT').upper()}**: {f.get('statement')}\n"
        md += "\n"
    if ch.get('citations'):
        md += "**Source Grounding Citations:**\n"
        for c in ch['citations']:
            md += f"> &ldquo;{c.get('verbatim_quote')}&rdquo;  \n> *Source: {c.get('document_filename')} ({c.get('source_location')})*\n\n"
    if ch.get('action_items'):
        md += "**Transition Directives:**\n"
        for a in ch['action_items']:
            md += f"- [ ] {a}\n"
        md += "\n"

with open('docs/handover-dossier-v1.md', 'w', encoding='utf-8') as f:
    f.write(md)

print('Generated docs/handover-dossier-v1.json and docs/handover-dossier-v1.md successfully!')

