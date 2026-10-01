#!/usr/bin/env python3
"""Identify 60-second MP3 clips and generate Kastriva imported music catalog.

Local-only development tool. It sends short audio excerpts to the recognition
service used by the `shazamio` package. Do not commit the local venv or reports.
Only publish audio you have permission/licensing to stream from your website.
"""
from __future__ import annotations
import argparse, asyncio, csv, json, os, re, shutil, subprocess, sys, tempfile, zipfile
from pathlib import Path

ALLOWED_IDS = [f"wedding-{i:02d}" for i in range(1,64)] + [f"aqiqah-{i:02d}" for i in range(1,3)]
WINDOWS = (4, 20, 36)

def natural_key(p: Path):
    parts=re.split(r"(\d+)",p.stem.lower())
    return [int(x) if x.isdigit() else x for x in parts]

def source_id(path: Path) -> tuple[str,str]:
    stem=path.stem.strip().lower()
    m=re.fullmatch(r"(\d+)",stem)
    if m:
        n=int(m.group(1))
        if 1 <= n <= 63: return f"wedding-{n:02d}","wedding"
    compact=re.sub(r"\s+"," ",stem)
    if compact in {"akikah","aqiqah"}: return "aqiqah-01","aqiqah"
    if compact in {"akikah 2","aqiqah 2","akikah2","aqiqah2"}: return "aqiqah-02","aqiqah"
    raise ValueError(f"Nama file tidak dikenali sebagai slot Kastriva: {path.name}")

def safe_filename(value: str) -> str:
    value=re.sub(r'[<>:"/\\|?*\x00-\x1f]',"",value).strip().rstrip(". ")
    return re.sub(r"\s+"," ",value)[:150] or "Tanpa nama"

def ensure_ffmpeg(tool_dir: Path) -> str:
    existing=shutil.which("ffmpeg")
    if existing: return existing
    try:
        import imageio_ffmpeg
    except Exception as e:
        raise RuntimeError("imageio-ffmpeg belum terpasang.") from e
    src=Path(imageio_ffmpeg.get_ffmpeg_exe())
    bin_dir=tool_dir/".bin";bin_dir.mkdir(parents=True,exist_ok=True)
    dst=bin_dir/("ffmpeg.exe" if os.name=="nt" else "ffmpeg")
    if not dst.exists() or dst.stat().st_size!=src.stat().st_size:
        shutil.copy2(src,dst)
        try: dst.chmod(0o755)
        except OSError: pass
    os.environ["PATH"]=str(bin_dir)+os.pathsep+os.environ.get("PATH","")
    return str(dst)

def track_metadata(track: dict) -> tuple[str,str]:
    album="";label=""
    for section in track.get("sections") or []:
        for row in section.get("metadata") or []:
            title=str(row.get("title") or "").strip().lower()
            text=str(row.get("text") or "").strip()
            if title=="album": album=text
            elif title in {"label","record label"}: label=text
    return album,label

async def recognize_file(shazam, ffmpeg: str, src: Path, work: Path) -> dict:
    errors=[]
    for offset in WINDOWS:
        sample=work/f"{src.stem}-{offset}.wav"
        cmd=[ffmpeg,"-hide_banner","-loglevel","error","-ss",str(offset),"-t","18","-i",str(src),"-vn","-ac","1","-ar","44100","-y",str(sample)]
        p=subprocess.run(cmd,capture_output=True,text=True)
        if p.returncode:
            errors.append(f"ffmpeg@{offset}: {p.stderr[-180:]}")
            continue
        try:
            raw=await shazam.recognize(str(sample))
            track=(raw or {}).get("track") if isinstance(raw,dict) else None
            if track and track.get("title") and track.get("subtitle"):
                album,label=track_metadata(track)
                genre=((track.get("genres") or {}).get("primary") or "").strip()
                return {
                    "matched":True,
                    "title":str(track["title"]).strip(),
                    "artist":str(track["subtitle"]).strip(),
                    "album":album,
                    "label":label,
                    "genre":genre,
                    "recognition_url":str(track.get("url") or ""),
                    "matched_offset_seconds":offset,
                }
        except Exception as e:
            errors.append(f"recognize@{offset}: {type(e).__name__}: {e}")
        finally:
            try: sample.unlink(missing_ok=True)
            except Exception: pass
        await asyncio.sleep(.35)
    return {"matched":False,"errors":errors[-3:]}

def write_generated(project: Path, rows: list[dict]):
    tracks=[]
    seen=set()
    imported_dir=project/"public/music/imported"
    imported_dir.mkdir(parents=True,exist_ok=True)
    for row in rows:
        if not row.get("matched"): continue
        duplicate_key=(row["group"],row["artist"].casefold().strip(),row["title"].casefold().strip())
        if duplicate_key in seen:
            row["duplicate"]=True
            continue
        seen.add(duplicate_key)
        row["duplicate"]=False
        src=Path(row["_path"])
        dest=imported_dir/f'{row["id"]}.mp3'
        shutil.copy2(src,dest)
        tracks.append({
            "id":row["id"],
            "name":row["title"],
            "artist":row["artist"],
            "mood":"Pop Indonesia · Pernikahan" if row["group"]=="wedding" else "Aqiqah",
            "detail":("Koleksi MP3 pernikahan yang diimpor pengelola." if row["group"]=="wedding"
                      else "Koleksi MP3 aqiqah yang diimpor pengelola."),
            "kind":"file",
            "group":row["group"],
            "src":f'/music/imported/{row["id"]}.mp3',
        })
    generated=(
        "/** AUTO-GENERATED by tools/import_music/identify_and_import.py. Do not hand-edit. */\n"
        "export const IMPORTED_MUSIC_TRACKS = "
        + json.dumps(tracks,ensure_ascii=False,indent=2)
        + " as const;\n"
    )
    (project/"lib/imported-music.generated.ts").write_text(generated,encoding="utf-8")
    return tracks

async def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("input",help="Folder MP3 atau ZIP 63 lagu")
    ap.add_argument("--project",default=str(Path(__file__).resolve().parents[2]),help="Root project Kastriva Invitation")
    args=ap.parse_args()
    inp=Path(args.input).expanduser().resolve()
    project=Path(args.project).expanduser().resolve()
    if not (project/"lib/music-library.ts").exists():
        raise SystemExit(f"Bukan root Kastriva Invitation: {project}")

    tool_dir=Path(__file__).resolve().parent
    out_dir=tool_dir/"output";out_dir.mkdir(parents=True,exist_ok=True)
    named_dir=out_dir/"nama-benar";named_dir.mkdir(parents=True,exist_ok=True)
    ffmpeg=ensure_ffmpeg(tool_dir)

    try:
        from shazamio import Shazam
    except Exception:
        raise SystemExit("shazamio belum terpasang. Jalankan IMPORT_MUSIK_KASTRIVA.ps1.")

    with tempfile.TemporaryDirectory(prefix="kastriva-music-") as td:
        work=Path(td)
        if inp.suffix.lower()==".zip":
            extracted=work/"source";extracted.mkdir()
            with zipfile.ZipFile(inp) as z:z.extractall(extracted)
            files=sorted(extracted.rglob("*.mp3"),key=natural_key)
        elif inp.is_dir():
            files=sorted(inp.rglob("*.mp3"),key=natural_key)
        else:
            raise SystemExit("Input harus folder atau file ZIP.")

        if len(files)!=65:
            print(f"PERINGATAN: ditemukan {len(files)} MP3; paket awal diharapkan 65 (63 nikah + 2 aqiqah).")
        rows=[]
        shazam=Shazam()
        for index,src in enumerate(files,1):
            try:
                sid,group=source_id(src)
            except ValueError as e:
                print("SKIP:",e);continue
            print(f"[{index}/{len(files)}] Mengenali {src.name} ...",flush=True)
            result=await recognize_file(shazam,ffmpeg,src,work)
            row={"source":src.name,"id":sid,"group":group,**result,"_path":str(src)}
            rows.append(row)
            if row["matched"]:
                print(f"  -> {row['artist']} — {row['title']}")
                human=named_dir/f"{safe_filename(row['artist'])} - {safe_filename(row['title'])}.mp3"
                if human.exists(): human=named_dir/f"{human.stem} [{sid}].mp3"
                shutil.copy2(src,human)
            else:
                print("  -> BELUM TERIDENTIFIKASI")

        tracks=write_generated(project,rows)
        clean=[{k:v for k,v in r.items() if k!="_path"} for r in rows]
        (out_dir/"music-identification.json").write_text(json.dumps(clean,ensure_ascii=False,indent=2),encoding="utf-8")
        fields=["source","id","group","matched","artist","title","album","genre","matched_offset_seconds","recognition_url","duplicate"]
        with (out_dir/"music-identification.csv").open("w",encoding="utf-8-sig",newline="") as f:
            w=csv.DictWriter(f,fieldnames=fields,extrasaction="ignore");w.writeheader()
            for row in clean:w.writerow(row)

        matched=sum(bool(r.get("matched")) for r in rows)
        unmatched=len(rows)-matched
        unique=len(tracks)
        print("\nSELESAI")
        print(f"Teridentifikasi : {matched}")
        print(f"Belum dikenali  : {unmatched}")
        print(f"Pilihan unik    : {unique}")
        print(f"Katalog         : {project/'lib/imported-music.generated.ts'}")
        print(f"Audio web       : {project/'public/music/imported'}")
        print(f"Laporan         : {out_dir/'music-identification.csv'}")
        if unmatched:
            print("File yang belum dikenali tidak dimasukkan ke katalog. Lihat JSON/CSV untuk daftar.")

if __name__=="__main__":
    asyncio.run(main())
