import asyncio
import os
import subprocess
import edge_tts

VOICE = "en-US-ChristopherNeural"

SCENES = [
    {
        "id": "scene_01",
        "name": "Opening Hook & Brand Identity",
        "text": (
            "When technical leaders depart, institutional memory evaporates. "
            "Decisions lose their rationale, conflicting dates persist uncorrected across competing memos, "
            "and cloud infrastructure sits silently orphaned. "
            "We built Relay to ensure that when leadership changes, institutional knowledge survives intact."
        )
    },
    {
        "id": "scene_02",
        "name": "Dashboard & Document Archive",
        "text": (
            "Relay operates as an evidence-grounded continuity desk. "
            "Outgoing leaders deposit organizational memos, charters, and roadmaps. "
            "Rather than generating loose AI summaries, Relay’s extraction pipeline "
            "anchors every single assertion to character-level evidence coordinates in the primary text."
        )
    },
    {
        "id": "scene_03",
        "name": "Conflict Detection & Ownership Gaps",
        "text": (
            "Instead of smoothing over differences, Relay cross-examines records using property-aware semantic matching. "
            "Here, Document A specifies November 15 for launch, while an amendment memo references December 20. "
            "Relay flags a Direct Contradiction. "
            "It also unmasks an unassigned Kubernetes cluster, detecting an operational liability before an outage occurs."
        )
    },
    {
        "id": "scene_04",
        "name": "Switch & FastMCP Workflow",
        "text": (
            "This is where Switch and the Model Context Protocol transform the workflow. "
            "When the incoming leader asks about the timeline in Switch, the OpenCode agent executes Relay’s registered FastMCP tools. "
            "It audits open discrepancies, retrieves the primary amendment evidence, "
            "and accurately explains the conflict rather than guessing an answer. "
            "The agent then proposes escalating the issue for formal human review."
        )
    },
    {
        "id": "scene_05",
        "name": "Human Authority Gate & Governance",
        "text": (
            "Here is Relay’s defining governance doctrine: "
            "An AI agent may discover discrepancies and propose adjudications, "
            "but it must never possess the authority to unilaterally decide corporate truth. "
            "When human review is requested, Relay generates a 32-byte single-use cryptographic token. "
            "Ratification requires an authenticated human reviewer verified through Mattermost."
        )
    },
    {
        "id": "scene_06",
        "name": "Handover Dossier & Continuity Radar",
        "text": (
            "For the incoming leader, Relay compiles weeks of manual archaeology "
            "into an audited 9-Chapter Handover Dossier and a chronological Day 1 to 30 Roadmap. "
            "The interactive Continuity Radar maps every relationship across people, projects, and infrastructure, "
            "turning fragmented records into an operational compass."
        )
    },
    {
        "id": "scene_07",
        "name": "Grounded Q&A & Closing",
        "text": (
            "When evidence exists, Relay anchors answers to exact source citations. "
            "When records are silent, it refuses to guess. "
            "Backed by 229 verified tests, Relay guarantees that the next leader never has to start from zero."
        )
    }
]

async def main():
    out_dir = os.path.abspath("docs/demo-video/audio")
    os.makedirs(out_dir, exist_ok=True)
    
    print("=== GENERATING PROFESSIONAL NEURAL NARRATION (edge-tts) ===")
    total_duration = 0.0
    
    for s in SCENES:
        out_mp3 = os.path.join(out_dir, f"{s['id']}.mp3")
        print(f"Generating {s['id']}: {s['name']}...")
        communicate = edge_tts.Communicate(s['text'], VOICE, rate="-4%")
        await communicate.save(out_mp3)
        
        # Probe duration with ffprobe / ffmpeg
        ffmpeg_exe = r"C:\Users\Aman\Desktop\Relay\backend\.venv\Lib\site-packages\imageio_ffmpeg\binaries\ffmpeg-win-x86_64-v9.0.2.exe"
        cmd = [ffmpeg_exe, "-i", out_mp3]
        proc = subprocess.run(cmd, stderr=subprocess.PIPE, stdout=subprocess.PIPE, text=True)
        dur = 0.0
        for line in proc.stderr.split("\n"):
            if "Duration:" in line:
                part = line.split("Duration:")[1].split(",")[0].strip()
                h, m, sec = part.split(":")
                dur = int(h)*3600 + int(m)*60 + float(sec)
                break
        print(f"  -> Generated: {out_mp3} (Duration: {dur:.2f}s)")
        s['duration'] = dur
        total_duration += dur

    print(f"\nTOTAL VOICE DURATION: {total_duration:.2f}s ({total_duration/60:.2f} mins)")

if __name__ == "__main__":
    asyncio.run(main())

