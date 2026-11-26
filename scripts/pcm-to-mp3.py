import sys
import numpy as np

sys.path.insert(0, r"C:\Users\rpta\Documents\Codex\2026-11-24\pu\work\whisper-libs")
import av

def main():
    if len(sys.argv) < 3:
        print("Usage: pcm-to-mp3.py <in.pcm> <out.mp3> [sample_rate]")
        sys.exit(1)
    in_pcm = sys.argv[1]
    out_mp3 = sys.argv[2]
    sample_rate = int(sys.argv[3]) if len(sys.argv) > 3 else 24000

    raw = open(in_pcm, "rb").read()
    # Ensure even byte length for s16le
    if len(raw) % 2 == 1:
        raw = raw[:-1]
    samples = np.frombuffer(raw, dtype="<i2")

    container = av.open(out_mp3, mode="w", format="mp3")
    stream = container.add_stream("libmp3lame", rate=sample_rate)
    stream.layout = "mono"
    stream.bit_rate = 64000

    chunk = 4096
    pts = 0
    for start in range(0, len(samples), chunk):
        seg = samples[start : start + chunk]
        if len(seg) == 0:
            continue
        frame = av.AudioFrame.from_ndarray(seg.reshape(1, -1), format="s16", layout="mono")
        frame.sample_rate = sample_rate
        frame.pts = pts
        pts += len(seg)
        for packet in stream.encode(frame):
            container.mux(packet)

    for packet in stream.encode(None):
        container.mux(packet)
    container.close()

if __name__ == "__main__":
    main()
