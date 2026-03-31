import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);
const BIN = "yt-dlp";

export interface VideoFormat {
  itag: string;
  qualityLabel: string;
  ext: string;
  filesize?: number;
  vcodec: string;
  acodec: string;
}

export interface VideoInfo {
  title: string;
  uploader: string;
  duration: number; // seconds
  formats: VideoFormat[];
}

export async function getInfo(url: string): Promise<VideoInfo> {
  const { stdout } = await execFileAsync(BIN, [
    "--dump-json",
    "--no-playlist",
    url,
  ]);
  const raw = JSON.parse(stdout);

  // Only formats that have both video+audio OR we'll pick best video+audio
  const formats: VideoFormat[] = (raw.formats as any[])
    .filter((f) => f.vcodec !== "none" && f.acodec !== "none" && f.height)
    .map((f) => ({
      itag: String(f.format_id),
      qualityLabel: `${f.height}p`,
      ext: f.ext,
      filesize: f.filesize ?? f.filesize_approx,
      vcodec: f.vcodec,
      acodec: f.acodec,
    }));

  // Deduplicate by qualityLabel, keep largest filesize
  const seen = new Map<string, VideoFormat>();
  for (const f of formats) {
    const existing = seen.get(f.qualityLabel);
    if (!existing || (f.filesize ?? 0) > (existing.filesize ?? 0)) {
      seen.set(f.qualityLabel, f);
    }
  }

  return {
    title: raw.title,
    uploader: raw.uploader ?? raw.channel ?? "Unknown",
    duration: raw.duration ?? 0,
    formats: Array.from(seen.values()).sort(
      (a, b) => parseInt(b.qualityLabel) - parseInt(a.qualityLabel)
    ),
  };
}

export function downloadVideo(
  url: string,
  formatId: string,
  outputPath: string,
  startSec?: number,
  durationSec?: number
): Promise<void> {
  return new Promise((resolve, reject) => {
    const args = [
      "-f", `${formatId}+bestaudio/best`,
      "--merge-output-format", "mp4",
      "-o", outputPath,
      "--no-playlist",
    ];

    if (startSec !== undefined && durationSec !== undefined) {
      args.push(
        "--download-sections",
        `*${startSec}-${startSec + durationSec}`,
        "--force-keyframes-at-cuts"
      );
    }

    args.push(url);

    const proc = execFile(BIN, args);
    proc.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`yt-dlp exited with code ${code}`));
    });
    proc.on("error", reject);
  });
}

export function downloadAudio(url: string, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const args = [
      "-f", "bestaudio",
      "--extract-audio",
      "--audio-format", "mp3",
      "--audio-quality", "192K",
      "-o", outputPath,
      "--no-playlist",
      url,
    ];

    const proc = execFile(BIN, args);
    proc.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`yt-dlp exited with code ${code}`));
    });
    proc.on("error", reject);
  });
}
