import requests
import json
import base64
import os
import subprocess

# Tu clave API de Google
api_key = 'AIzaSyDYEl_wNsKBuk56bR-SeQKLCEifB05_mfM'

# URL de la API de Text to Speech de Google
url = f'https://texttospeech.googleapis.com/v1/text:synthesize?key={api_key}'

# Nombre de la carpeta donde se guardarán los audios (un nivel arriba)
folder_name = '../Audios'

# Definir la variable de género de voz
voice_gender = "hombre"  # O "hombre"

# Configuraciones de audio y voz
configurations = {
    "hombre": {
        "audioConfig": {
            "audioEncoding": "LINEAR16",
            "effectsProfileId": [
                "small-bluetooth-speaker-class-device"
            ],
            "pitch": 0,
            "speakingRate": 1.04
        },
        "voice": {
            "languageCode": "es-US",
            "name": "es-US-Chirp3-HD-Algenib"
        }
    },
    "mujer": {
        "audioConfig": {
            "audioEncoding": "LINEAR16",
            "effectsProfileId": [
                "small-bluetooth-speaker-class-device"
            ],
            "pitch": 0,
            "speakingRate": 1
        },
        "voice": {
            "languageCode": "es-US",
            "name": "es-US-Chirp3-HD-Aoede"
        }
    }
}

# Verificar si la carpeta existe, si no, crearla
if not os.path.exists(folder_name):
    os.makedirs(folder_name)

# Definir la ruta al archivo guion.json
guion_path = os.path.join('..', 'guion.json')

# Leer y parsear el contenido del archivo JSON
with open(guion_path, 'r', encoding='utf-8') as file:
    guion_data = json.load(file)

# Extraer items específicos del JSON
items = guion_data.get('items', [])

def generate_audio(text, file_path, config):
    """Genera un archivo de audio usando la API de Google Text-to-Speech."""
    request_data = {
        "input": {
            "text": text
        },
        "voice": config['voice'],
        "audioConfig": config['audioConfig']
    }
    response = requests.post(url, json=request_data)
    if response.status_code == 200:
        response_data = response.json()
        audio_content = base64.b64decode(response_data['audioContent'])
        with open(file_path, 'wb') as audio_file:
            audio_file.write(audio_content)
        print(f"El audio ha sido guardado en '{file_path}'")
    else:
        print(f"Error al generar el audio: {response.status_code}")
        print(response.text)

# Obtener la configuración basada en el género de la voz
config = configurations[voice_gender]


# Generar audio de presentación
audio_presentacion_narracion = guion_data.get('audio_presentacion_narracion')
audio_presentacion_path = guion_data.get('audio_presentacion')
if audio_presentacion_narracion and audio_presentacion_path:
    # Eliminar 'Audios/' del path y agregar folder_name
    audio_presentacion_path = os.path.join(folder_name, os.path.basename(audio_presentacion_path))
    generate_audio(audio_presentacion_narracion, audio_presentacion_path, config)

# Generar audio de despedida
audio_despedida_narracion = guion_data.get('audio_despedida_narracion')
audio_despedida_path = guion_data.get('audio_despedida')
if audio_despedida_narracion and audio_despedida_path:
    # Eliminar 'Audios/' del path y agregar folder_name
    audio_despedida_path = os.path.join(folder_name, os.path.basename(audio_despedida_path))
    generate_audio(audio_despedida_narracion, audio_despedida_path, config)

# Procesar cada item y sub-item
for item in items:
    audio = item.get('audio')
    url_audio = os.path.join(folder_name, os.path.basename(item.get('url_audio')))
    if audio:
        generate_audio(audio, url_audio, config)
    else:
        print(f"Item no tiene audio, no se generó el audio para {url_audio}")

    sub_items = item.get('sub_items', [])
    if sub_items:
        for sub_item in sub_items:
            sub_audio = sub_item.get('audio')
            sub_url_audio = os.path.join(folder_name, os.path.basename(sub_item.get('url_audio')))
            if sub_audio:
                generate_audio(sub_audio, sub_url_audio, config)
            else:
                print(f"  Sub-item no tiene audio, no se generó el audio para {sub_url_audio}")
    else:
        print("  No tiene sub_items")

# Cambiar el directorio de trabajo a la carpeta donde se guardan los audios
os.chdir(folder_name)

# Construir la ruta dinámica al script de reducción de tamaño de audio
script_path = os.path.join('..', 'AutomatizacionAudios', 'reduce_audio_size.sh')

# Verificar si el script existe y es ejecutable
if os.path.exists(script_path) and os.access(script_path, os.X_OK):
    try:
        # Llamar al script de reducción de tamaño de audio usando Git Bash
        subprocess.run(['C:\\Program Files\\Git\\bin\\bash.exe', script_path], check=True)
    except subprocess.CalledProcessError as e:
        print(f"Error al ejecutar el script: {e}")
else:
    print(f"El script '{script_path}' no existe o no es ejecutable")