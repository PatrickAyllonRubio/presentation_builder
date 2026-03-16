import os
import shutil
import tempfile
from PIL import Image
import numpy as np
import argparse
import subprocess
import re
from pathlib import Path

def find_protected_images(dirpath):
    """Busca imágenes referenciadas en index.html y devuelve nombres en minúsculas"""
    protected = set()
    base_dir = Path(dirpath)
    
    # Buscar index.html en varios niveles
    search_paths = [
        base_dir / 'index.html',
        base_dir.parent / 'index.html',
        base_dir.parent.parent / 'index.html'
    ]
    
    patterns = [
        r'(?:src|data-src|href)=["\'](?:\.{0,2}/)?(?:images?/)?([^"\']+\.(?:png|jpe?g|gif|webp))',
        r'["\']images?/([^"\']+\.(?:png|jpe?g|gif|webp))["\']'
    ]
    
    for index_path in search_paths:
        if not index_path.exists():
            continue
            
        try:
            print(f"📄 Leyendo: {index_path}")
            content = index_path.read_text(encoding='utf-8', errors='ignore')
            
            for pattern in patterns:
                for match in re.findall(pattern, content, re.IGNORECASE):
                    img_name = Path(match).name.lower()
                    if img_name not in protected:
                        protected.add(img_name)
                        print(f"  🔒 Protegida: {img_name}")
                        
        except Exception as e:
            print(f"⚠ Error leyendo {index_path}: {e}")
    
    print(f"🛡 Total protegidas: {len(protected)}\n" if protected else "⚠ Sin imágenes protegidas\n")
    return protected

def should_exclude(filepath, protected_set):
    """Determina si un archivo debe excluirse del procesamiento"""
    name_lower = filepath.name.lower()
    
    # Excluir SVG y archivos con 'fondo' en el nombre
    if name_lower.endswith('.svg') or 'fondo' in name_lower:
        return True
    
    # Excluir si está protegida en index.html
    if name_lower in protected_set:
        print(f"🔒 PROTEGIDO (usado en index.html): {filepath.name}")
        return True
    
    # Excluir PNG con 'fondo' (protección adicional)
    if name_lower.endswith('.png') and 'fondo' in name_lower:
        return True
            
    return False

def gather_images(dirpath, protected_set):
    """Recolecta imágenes válidas para procesar"""
    extensions = {'.jpg', '.jpeg', '.png'}
    images = []
    
    for file in Path(dirpath).iterdir():
        if file.suffix.lower() in extensions and not should_exclude(file, protected_set):
            images.append(file)
    
    return images

def flatten_transparency(img):
    """Convierte RGBA/LA a RGB con fondo blanco"""
    if img.mode in ('RGBA', 'LA'):
        # Usar numpy para mejor rendimiento
        rgba = np.array(img.convert('RGBA'), dtype=np.float32) / 255
        rgb, alpha = rgba[..., :3], rgba[..., 3:4]
        blended = rgb * alpha + (1 - alpha)  # Fondo blanco
        return Image.fromarray((blended * 255).astype(np.uint8), 'RGB')
    return img.convert('RGB') if img.mode != 'RGB' else img

def resize_image(img, max_width=1200):
    """Redimensiona imagen manteniendo proporción"""
    if img.size[0] > max_width:
        ratio = max_width / img.size[0]
        new_size = (max_width, int(img.size[1] * ratio))
        return img.resize(new_size, Image.Resampling.LANCZOS)
    return img

def mozjpeg_compress(input_path, output_path, quality, mozjpeg_path=None):
    """Comprime con MozJPEG usando parámetros optimizados"""
    exe = mozjpeg_path or "cjpeg"
    try:
        subprocess.run([
            exe, "-quality", str(quality),
            "-optimize", "-progressive",
            "-quant-table", "2",
            "-sample", "2x2",
            "-tune-ssim",
            "-outfile", output_path,
            input_path
        ], check=True, capture_output=True)
        return True
    except (subprocess.CalledProcessError, FileNotFoundError) as e:
        return False

def optimize_image(filepath, target_bytes, quality, min_quality, mozjpeg_path=None):
    """Optimiza una imagen iterando calidad hasta alcanzar objetivo"""
    orig_size = filepath.stat().st_size
    
    with Image.open(filepath) as img:
        # Procesar imagen
        img = flatten_transparency(img)
        img = resize_image(img, max_width=1200)
        
        # Guardar temporal en BMP para MozJPEG
        with tempfile.NamedTemporaryFile(suffix='.bmp', delete=False) as temp_bmp:
            temp_bmp_path = temp_bmp.name
            img.save(temp_bmp_path, format="BMP")
        
        use_mozjpeg = mozjpeg_compress(temp_bmp_path, temp_bmp_path + '.test', 75, mozjpeg_path)
        if use_mozjpeg:
            os.remove(temp_bmp_path + '.test')
        
        last_file = None
        used_quality = min_quality
        final_size = orig_size
        # Iterar calidad descendente, pero guardar SIEMPRE el último intento
        for q in range(quality, min_quality - 1, -5):
            with tempfile.NamedTemporaryFile(suffix='.jpg', delete=False) as temp_jpg:
                temp_path = temp_jpg.name
            if use_mozjpeg:
                if not mozjpeg_compress(temp_bmp_path, temp_path, q, mozjpeg_path):
                    continue
            else:
                img.save(temp_path, format='JPEG', optimize=True, quality=q, subsampling=0)
            size = os.path.getsize(temp_path)
            last_file = temp_path
            used_quality = q
            final_size = size
            if size <= target_bytes:
                break
        os.remove(temp_bmp_path)
        if last_file:
            # Convertir PNG a JPG si es necesario
            if filepath.suffix.lower() == '.png' and 'fondo' not in filepath.name.lower():
                new_path = filepath.with_suffix('.jpg')
                shutil.move(last_file, new_path)
                filepath.unlink()  # Eliminar PNG original
                return new_path, used_quality, final_size
            else:
                shutil.move(last_file, filepath)
                return filepath, used_quality, final_size
        return None, used_quality, orig_size

def human_size(bytes_size):
    """Formato legible de tamaño"""
    return f"{bytes_size // 1024}KB" if bytes_size >= 1024 else f"{bytes_size}B"

def process_directory(dirpath, quality, target_ratio, min_quality, mozjpeg_path, dry_run):
    """Procesa todas las imágenes en un directorio"""
    protected = find_protected_images(dirpath)
    images = gather_images(dirpath, protected)
    
    if not images:
        return
    
    total_before = sum(img.stat().st_size for img in images)
    if total_before == 0:
        return
    
    target_total = int(total_before * target_ratio)
    
    print(f"📁 {dirpath}")
    print(f"🖼 {len(images)} archivos | Antes: {human_size(total_before)} | Objetivo: {human_size(target_total)}")
    
    if dry_run:
        print("[DRY-RUN] No se realizarán cambios\n")
        return
    
    processed_total = 0
    for img_path in images:
        orig_size = img_path.stat().st_size
        target_file = max(2048, int(orig_size * (target_total / total_before)))
        
        result_path, used_q, final_size = optimize_image(
            img_path, target_file, quality, min_quality, mozjpeg_path
        )
        
        if result_path:
            reduction = ((orig_size - final_size) / orig_size * 100) if orig_size > 0 else 0
            print(f"✔ {img_path.name}: {human_size(orig_size)} → {human_size(final_size)} (-{reduction:.1f}%) q={used_q}")
            if result_path != img_path:
                print(f"  → Convertido a: {result_path.name}")
        else:
            print(f"✖ {img_path.name}: Error al convertir (q~{used_q})")
        processed_total += final_size
    
    print(f"\n📊 Resumen:")
    print(f"Antes: {human_size(total_before)} | Después: {human_size(processed_total)}")
    print("✅ Objetivo alcanzado\n" if processed_total <= target_total else "⚠ Objetivo no alcanzado\n")

def process_images(root, folder_names, quality, target_ratio, min_quality, mozjpeg_path, dry_run):
    """Procesa múltiples carpetas de imágenes"""
    root_path = Path(root)
    processed_dirs = 0
    
    for dirpath, _, _ in os.walk(root_path):
        dir_name = Path(dirpath).name.lower()
        if dir_name in folder_names:
            process_directory(dirpath, quality, target_ratio, min_quality, mozjpeg_path, dry_run)
            processed_dirs += 1
    
    print(f"✅ Procesados {processed_dirs} directorios")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Optimiza imágenes con MozJPEG")
    parser.add_argument("--root", required=True, help="Ruta raíz")
    parser.add_argument("--folders", nargs='+', default=['imagenes'], 
                        help="Nombres de carpetas a buscar (ej: photo images)") 
    parser.add_argument("--quality", type=int, default=80, help="Calidad inicial (1-100)")
    parser.add_argument("--min-quality", type=int, default=40, help="Calidad mínima")
    parser.add_argument("--target-ratio", type=float, default=0.35, help="Reducción objetivo (0.3 = 30%%)")
    parser.add_argument("--mozjpeg-path", help="Ruta a cjpeg.exe")
    parser.add_argument("--dry-run", action="store_true", help="Simular sin cambios")
    
    args = parser.parse_args()
    
    # Normalizar nombres de carpetas a minúsculas
    folder_names = {name.lower() for name in args.folders}
    
    process_images(
        args.root, folder_names, args.quality, args.target_ratio,
        args.min_quality, args.mozjpeg_path, args.dry_run
    )
