import yt_dlp
import ffmpeg
import whisper

def transcribe_audio(audio_path):
    model = whisper.load_model("large")  
    result = model.transcribe(audio_path, word_timestamps=True)
    return result["segments"]  

def save_as_srt(transcription, output_srt="transcription.srt"):
    with open(output_srt, "w", encoding="utf-8") as srt_file:
        for i, segment in enumerate(transcription, start=1):
            start_time = format_timestamp(segment["start"])
            end_time = format_timestamp(segment["end"])
            text = segment["text"]

            srt_file.write(f"{i}\n")
            srt_file.write(f"{start_time} --> {end_time}\n")
            srt_file.write(f"{text}\n\n")
    
    print(f"Saved transcription as {output_srt}")

def format_timestamp(seconds):
    millisec = int((seconds - int(seconds)) * 1000)
    time_format = f"{int(seconds // 3600):02}:{int((seconds % 3600) // 60):02}:{int(seconds % 60):02},{millisec:03}"
    return time_format


def download_audio(youtube_url, output_path="transcribs/audio"):
    ydl_opts = {
        'format': 'bestaudio/best',
        'outtmpl': output_path,
        'postprocessors': [{
            'key': 'FFmpegExtractAudio',
            'preferredcodec': 'mp3',
            'preferredquality': '192',
        }],
    }
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        ydl.download([youtube_url])
    
    return output_path


def main():
    yt_url = "https://www.youtube.com/watch?v=U1yHTTorFwc"
    audio_path = download_audio(yt_url)
    print("Audio downloaded:", audio_path)
    
    transcription = transcribe_audio(audio_path)
    save_as_srt(transcription, "transcription.srt")

if __name__ == "__main__":
    main()
