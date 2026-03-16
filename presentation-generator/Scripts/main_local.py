import subprocess
import os

def get_file_size(path):
    size_mb = os.path.getsize(path) / (1024 * 1024)
    return round(size_mb, 2)

def is_optimized(path, target_mb=20, tolerance=2):
    size = get_file_size(path)
    if size <= target_mb:
        return True
    return size <= (target_mb + tolerance)

def optimize_video_replace(input_path, target_size_mb=50):  # Aumentado de 20 a 50 MB
    if is_optimized(input_path, target_size_mb):
        print(f"⏹️ Ya está optimizado: {get_file_size(input_path)} MB → No se hace nada.")
        return

    temp_path = input_path + "_temp.mp4"

    duration_cmd = [
        "ffprobe", "-v", "error", "-show_entries",
        "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", input_path
    ]
    duration = float(subprocess.check_output(duration_cmd).decode().strip())
    target_bitrate = (target_size_mb * 8192) / duration

    cmd = [
        "ffmpeg", "-i", input_path,
        "-c:v", "libx264", "-preset", "slow", "-crf", "20",  # CRF 20 = alta calidad
        "-c:a", "aac", "-b:a", "192k",  # Aumentado a 192k para mejor audio
        "-y", temp_path
    ]
    subprocess.run(cmd, check=True)

    os.remove(input_path)
    os.rename(temp_path, input_path)
    print(f"✅ Video reemplazado: {input_path} ({get_file_size(input_path)} MB)")

def generate_resolutions(input_path, base_name, resolutions=["720"]):
    for res in resolutions:
        output_path = f"{base_name}_{res}p.mp4"
        cmd = [
            "ffmpeg", "-i", input_path,
            "-vf", f"scale=-2:{res}",
            "-c:v", "libx264", "-crf", "23",
            "-c:a", "aac", "-b:a", "128k",
            "-y", output_path
        ]
        subprocess.run(cmd, check=True)
        size = get_file_size(output_path)
        status = "✅ Optimizado" if is_optimized(output_path) else "⚠️ Fuera de rango"
        print(f"{res}p → {output_path} → {size} MB → {status}")

def process_course(course_path):
    """
    Procesa un curso completo buscando automáticamente todos los módulos
    """
    if not os.path.exists(course_path):
        print(f"❌ Ruta del curso no encontrada: {course_path}")
        return
    
    print(f"🎓 Procesando curso: {os.path.basename(course_path)}")
    print(f"📍 Ruta: {course_path}")
    
    # Buscar todas las carpetas que tengan el formato 'MOD-XX' (donde XX son números)
    import re
    module_folders = []
    for item in os.listdir(course_path):
        item_path = os.path.join(course_path, item)
        if os.path.isdir(item_path) and re.match(r"M\d+", item.upper()):
            module_folders.append(item)

    if not module_folders:
        print("⚠️ No se encontraron carpetas de módulos (formato 'MOD-XX')")
        return

    # Ordenar los módulos alfabéticamente
    module_folders.sort()
    print(f"📚 Se encontraron {len(module_folders)} módulos: {', '.join(module_folders)}")

    # Procesar cada módulo
    for module_name in module_folders:
        module_path = os.path.join(course_path, module_name)
        print(f"\n📁 Procesando módulo: {module_name}")

        # Buscar todos los archivos de video directamente en la carpeta del módulo
        video_files = []
        for file in os.listdir(module_path):
            if file.lower().endswith(('.mp4', '.avi', '.mov', '.mkv')):
                video_files.append(file)

        if not video_files:
            print(f"⚠️ No se encontraron videos en: {module_path}")
            continue

        print(f"🎥 Se encontraron {len(video_files)} videos")

        # Procesar cada video
        for file in video_files:
            video_path = os.path.join(module_path, file)
            base_name = os.path.splitext(video_path)[0]

            print(f"\n🎬 Video: {file}")
            print(f"Original: {get_file_size(video_path)} MB")

            # 1. Optimizar el video original
            optimize_video_replace(video_path)
            status_final = "✅ Optimizado" if is_optimized(video_path) else "⚠️ Fuera de rango"
            print(f"Final: {get_file_size(video_path)} MB → {status_final}")

            # 2. Generar versión en 720p
            print("📹 Generando resolución 720p...")
            generate_resolutions(video_path, base_name, resolutions=["720"])

# 📁 Ruta base del curso
course_path = r"C:\Users\patri\Documents\CERV\cerv_scripts\Optimizador - videos\Videos"

process_course(course_path)