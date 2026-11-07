import subprocess
import os
import sys

def main():
    print("=========================================================")
    print("    RELAY DEMO VIDEO — MASTER PRODUCTION ASSEMBLY")
    print("=========================================================")

    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    demo_dir = os.path.join(base_dir, 'docs', 'demo-video')
    frames_dir = os.path.join(demo_dir, 'frames')
    audio_dir = os.path.join(demo_dir, 'audio')
    temp_dir = os.path.join(demo_dir, 'temp_segments')
    os.makedirs(temp_dir, exist_ok=True)

    ffmpeg = os.path.join(
        base_dir, 'backend', '.venv', 'Lib', 'site-packages', 'imageio_ffmpeg', 'binaries',
        'ffmpeg-win-x86_64-v9.0.2.exe'
    )
    if not os.path.exists(ffmpeg):
        raise FileNotFoundError(f"FFmpeg binary not found at: {ffmpeg}")

    print(f"Using FFmpeg: {ffmpeg}")

    # Define the 7 scene specifications
    scenes = [
        {
            "id": "scene_01",
            "name": "Hook: Institutional Memory Evaporation",
            "duration": 22.0,
            "audio": os.path.join(audio_dir, "scene_01.mp3"),
            "audio_delay_ms": 500,
            "clips": [
                {
                    "image": os.path.join(frames_dir, "scene_01_hook.png"),
                    "duration": 22.0,
                    "fade_in": 0.8,
                    "fade_out": 0.5
                }
            ]
        },
        {
            "id": "scene_02",
            "name": "Solution: Document Archive & Grounding",
            "duration": 22.0,
            "audio": os.path.join(audio_dir, "scene_02.mp3"),
            "audio_delay_ms": 500,
            "clips": [
                {
                    "image": os.path.join(frames_dir, "scene_02_dashboard.png"),
                    "duration": 11.0,
                    "fade_in": 0.0,
                    "fade_out": 0.4
                },
                {
                    "image": os.path.join(frames_dir, "scene_02_archive.png"),
                    "duration": 11.0,
                    "fade_in": 0.4,
                    "fade_out": 0.0
                }
            ]
        },
        {
            "id": "scene_03",
            "name": "Engine: Contradictions & Orphan Detection",
            "duration": 27.0,
            "audio": os.path.join(audio_dir, "scene_03.mp3"),
            "audio_delay_ms": 500,
            "clips": [
                {
                    "image": os.path.join(frames_dir, "scene_03_investigations.png"),
                    "duration": 27.0,
                    "fade_in": 0.4,
                    "fade_out": 0.4
                }
            ]
        },
        {
            "id": "scene_04",
            "name": "Integration: Switch + FastMCP + OpenCode",
            "duration": 29.0,
            "audio": os.path.join(audio_dir, "scene_04.mp3"),
            "audio_delay_ms": 500,
            "clips": [
                {
                    "image": os.path.join(frames_dir, "scene_04_switch.png"),
                    "duration": 29.0,
                    "fade_in": 0.4,
                    "fade_out": 0.4
                }
            ]
        },
        {
            "id": "scene_05",
            "name": "Governance: Cryptographic Review Desk",
            "duration": 26.0,
            "audio": os.path.join(audio_dir, "scene_05.mp3"),
            "audio_delay_ms": 500,
            "clips": [
                {
                    "image": os.path.join(frames_dir, "scene_05_review.png"),
                    "duration": 26.0,
                    "fade_in": 0.4,
                    "fade_out": 0.4
                }
            ]
        },
        {
            "id": "scene_06",
            "name": "Artifacts: 9-Chapter Dossier & Radar",
            "duration": 23.0,
            "audio": os.path.join(audio_dir, "scene_06.mp3"),
            "audio_delay_ms": 500,
            "clips": [
                {
                    "image": os.path.join(frames_dir, "scene_06_handovers.png"),
                    "duration": 12.0,
                    "fade_in": 0.4,
                    "fade_out": 0.4
                },
                {
                    "image": os.path.join(frames_dir, "scene_06_map.png"),
                    "duration": 11.0,
                    "fade_in": 0.4,
                    "fade_out": 0.4
                }
            ]
        },
        {
            "id": "scene_07",
            "name": "Conclusion: Grounded Trust & Open-Source Outro",
            "duration": 21.0,
            "audio": os.path.join(audio_dir, "scene_07.mp3"),
            "audio_delay_ms": 500,
            "clips": [
                {
                    "image": os.path.join(frames_dir, "scene_07_qa.png"),
                    "duration": 10.0,
                    "fade_in": 0.4,
                    "fade_out": 0.4
                },
                {
                    "image": os.path.join(frames_dir, "scene_07_outro.png"),
                    "duration": 11.0,
                    "fade_in": 0.4,
                    "fade_out": 1.5
                }
            ]
        }
    ]

    total_calc_duration = sum(s["duration"] for s in scenes)
    print(f"Configured {len(scenes)} scenes. Master Target Duration: {total_calc_duration:.1f}s ({int(total_calc_duration//60)}m {int(total_calc_duration%60)}s)\n")

    # Render each individual scene segment
    segment_files = []
    for idx, sc in enumerate(scenes, 1):
        seg_output = os.path.join(temp_dir, f"{sc['id']}.mp4")
        segment_files.append(seg_output)
        print(f"--- Rendering [{idx}/{len(scenes)}] {sc['id']}: {sc['name']} ({sc['duration']}s) ---")

        inputs = []
        filter_parts = []
        video_concat_tags = []

        # Add image inputs
        for c_idx, clip in enumerate(sc["clips"]):
            inputs.extend(["-loop", "1", "-t", str(clip["duration"]), "-i", clip["image"]])
            v_filters = ["scale=1920:1080"]
            if clip.get("fade_in", 0) > 0:
                v_filters.append(f"fade=t=in:st=0:d={clip['fade_in']}")
            if clip.get("fade_out", 0) > 0:
                out_st = max(0.0, clip["duration"] - clip["fade_out"])
                v_filters.append(f"fade=t=out:st={out_st:.2f}:d={clip['fade_out']}")
            
            filter_parts.append(f"[{c_idx}:v]" + ",".join(v_filters) + f"[v{c_idx}]")
            video_concat_tags.append(f"[v{c_idx}]")

        # Add audio input
        audio_idx = len(sc["clips"])
        inputs.extend(["-i", sc["audio"]])

        # Assemble video filter
        if len(sc["clips"]) > 1:
            filter_parts.append("".join(video_concat_tags) + f"concat=n={len(sc['clips'])}:v=1:a=0[v_cat]")
            v_out = "[v_cat]"
        else:
            v_out = "[v0]"

        # Assemble audio filter (delay + apad)
        filter_parts.append(f"[{audio_idx}:a]adelay={sc['audio_delay_ms']}|{sc['audio_delay_ms']},apad[a_pad]")

        filter_complex = ";".join(filter_parts)

        cmd = [
            ffmpeg, "-y",
            *inputs,
            "-filter_complex", filter_complex,
            "-map", v_out,
            "-map", "[a_pad]",
            "-t", str(sc["duration"]),
            "-c:v", "libx264", "-preset", "fast", "-crf", "18", "-pix_fmt", "yuv420p", "-r", "30",
            "-c:a", "aac", "-b:a", "192k", "-ar", "48000",
            seg_output
        ]

        res = subprocess.run(cmd, capture_output=True, text=True)
        if res.returncode != 0:
            print(f"FAILED to render scene {sc['id']}:")
            print(res.stderr[-800:])
            sys.exit(1)
        
        file_sz = os.path.getsize(seg_output) / (1024 * 1024)
        print(f"-> Rendered {sc['id']}.mp4 successfully ({file_sz:.2f} MB)")

    # Create concat list
    concat_list_path = os.path.join(temp_dir, "concat_list.txt")
    with open(concat_list_path, "w", encoding="utf-8") as f:
        for seg in segment_files:
            # Use forward slashes
            clean_path = os.path.abspath(seg).replace("\\", "/")
            f.write(f"file '{clean_path}'\n")

    print("\n--- Concatenating all scenes into master sequence ---")
    raw_master = os.path.join(temp_dir, "master_raw.mp4")
    concat_cmd = [
        ffmpeg, "-y",
        "-f", "concat", "-safe", "0",
        "-i", concat_list_path,
        "-c", "copy",
        raw_master
    ]
    res = subprocess.run(concat_cmd, capture_output=True, text=True)
    if res.returncode != 0:
        print("Concatenation failed:")
        print(res.stderr[-500:])
        sys.exit(1)

    print(f"Master raw video created ({os.path.getsize(raw_master)/(1024*1024):.2f} MB)")

    # Generate background music track and burn subtitles
    final_output = os.path.join(demo_dir, "relay-demo.mp4")
    srt_path = os.path.join(demo_dir, "relay-demo.en.srt")
    
    # Format srt path for FFmpeg subtitles filter on Windows
    srt_clean = os.path.abspath(srt_path).replace("\\", "/")
    if ":" in srt_clean:
        drive, path_part = srt_clean.split(":", 1)
        srt_clean = drive + r"\:" + path_part

    # Subtitle styling: Semi-transparent black banner box for 100% readability over light & dark UIs
    sub_style = (
        "FontName=Space Mono,"
        "FontSize=16,"
        "PrimaryColour=&H00FFFFFF,"
        "BackColour=&H80000000,"
        "BorderStyle=3,"
        "Outline=1,"
        "Shadow=0,"
        "MarginV=38"
    )
    sub_filter = f"subtitles='{srt_clean}':force_style='{sub_style}'"

    print("\n--- Mixing ambient background audio & burning synchronized subtitles ---")
    
    # FFmpeg synthesis of warm ambient pad chord (A2 110Hz, E3 165Hz, A3 220Hz, C#4 277Hz)
    # Filtered and ducked to -24 dB so narration is crystal clear
    synth_expr = (
        "0.035*sin(2*PI*110*t)+0.025*sin(2*PI*164.81*t)+0.02*sin(2*PI*220*t)+0.015*sin(2*PI*277.18*t)"
    )
    bgm_filter = (
        f"aevalsrc='{synth_expr}|{synth_expr}':s=48000:d={total_calc_duration:.1f}:c=stereo,"
        f"lowpass=f=350,afade=t=in:st=0:d=2,afade=t=out:st={total_calc_duration-4:.1f}:d=4[bgm];"
        f"[0:a][bgm]amix=inputs=2:duration=first:dropout_transition=2[a_out]"
    )

    full_filter_complex = f"[0:v]{sub_filter}[v_out];{bgm_filter}"

    final_cmd = [
        ffmpeg, "-y",
        "-i", raw_master,
        "-filter_complex", full_filter_complex,
        "-map", "[v_out]",
        "-map", "[a_out]",
        "-c:v", "libx264", "-preset", "slow", "-crf", "18", "-pix_fmt", "yuv420p", "-r", "30",
        "-c:a", "aac", "-b:a", "192k", "-ar", "48000",
        "-movflags", "+faststart",
        final_output
    ]

    print("Running final encode with high-fidelity x264 CRF 18 + AAC 192k...")
    res = subprocess.run(final_cmd, capture_output=True, text=True)
    if res.returncode != 0:
        print("Final render failed:")
        print(res.stderr[-800:])
        sys.exit(1)

    final_size_mb = os.path.getsize(final_output) / (1024 * 1024)
    print("\n=========================================================")
    print("  PRODUCTION COMPLETE! MASTER VIDEO EXPORTED:")
    print(f"  Target: {final_output}")
    print(f"  File Size: {final_size_mb:.2f} MB")
    print(f"  Duration: {total_calc_duration:.1f} seconds")
    print("=========================================================")

if __name__ == "__main__":
    main()
