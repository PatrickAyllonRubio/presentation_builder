class Presentacion {
    constructor(url_svg, nombre, items, debug) {
        this.url_svg = url_svg;
        this.items = items;
        this.debug = debug;
        this.lastClickedIndex = -1;
        this.clickCount = 0;


        this.validarSvg();
        $('#title').text(nombre);
    }

    async validarSvg() {
        try {
            const response = await fetch(this.url_svg);
            if (response.ok) {
                const svgText = await response.text();
                this.agregarSvg(svgText);
                console.log('SVG cargado correctamente');
            } else {
                console.log('No se encontró el SVG en la URL proporcionada');
            }
        } catch (error) {
            console.log('Ocurrió un error al intentar cargar el SVG:', error);
        }
    }
    insertFormattedText(id, text) {
        // Reemplaza comandos específicos en el texto con etiquetas HTML
        text = text.replace(/_([^_]+)_/g, '<i>$1</i>'); // Oblicua para texto entre guiones bajos
        text = text.replace(/\*([^\*]+)\*/g, '<b>$1</b>'); // Negrita para texto entre asteriscos
        text = text.replace(/\\n/g, '<br/>'); // Salto de línea para "\n"

        // Envuelve el texto formateado en un párrafo
        text = `<p>${text}</p>`;

        // Inserta el texto formateado en el div
        $(`#${id}`).html(text);
    }

    agregarSvg(svgText, containerId = 'svg') {
        const svgContainer = document.getElementById(containerId);
        if (svgContainer) {
            svgContainer.innerHTML = svgText;
        } else {
            console.log(`No se encontró el elemento con id "${containerId}"`);
        }
    }

    cargarYAgregarSvg(url_svg, containerId) {
        return new Promise((resolve, reject) => {
            fetch(url_svg)
                .then(response => {
                    if (response.ok) {
                        return response.text();
                    } else {
                        throw new Error('No se encontró el SVG en la URL proporcionada');
                    }
                })
                .then(svgText => {
                    this.agregarSvg(svgText, containerId);
                    console.log('SVG cargado y agregado correctamente');
                    resolve(); // Resuelve la promesa aquí
                })
                .catch(error => {
                    console.log('Ocurrió un error al intentar cargar el SVG:', error);
                    reject(error); // Rechaza la promesa aquí
                });
        });
    }

    animacionPrincipal() {
        let delay = 0;
        this.items.forEach(item => {
            setTimeout(() => {
                const element = document.getElementById(`p-${item.id}`);
                if (element) {
                    element.classList.add('fade-in-fwd');
                    element.addEventListener('animationend', () => {
                        element.classList.remove('fade-in-fwd');
                    });
                } else {
                    console.log(`No se encontró el elemento con id "p-${item.id}"`);
                }
            }, delay);
            delay += 300;
        });
    }

    toggleFlip(targetId) {
        var flipContainer = document.getElementById(targetId);
        if (!flipContainer) return; // Si no encuentra el contenedor, termina la función

        // Si el contenedor tiene la clase 'flip', quítala y cambia el icono a texto
        if (flipContainer.classList.contains('flip')) {
            flipContainer.classList.remove('flip');

            // Encuentra el icono y cambia su clase para indicar texto
            var icon = flipContainer.closest('.modal_personalizado').querySelector('.btn_flipper i');
            icon.className = 'bi bi-file-text';
        }
    }
    iniciarInteractivo() {
        this.items.forEach((item, index) => {
            const element = document.getElementById(`p-${item.id}`);
            if (element) {
                // Agrega la animación al primer elemento por defecto
                if (index === 0) {
                    element.classList.add('heartbeat');
                }

                element.addEventListener('click', () => {
                    if (index <= this.lastClickedIndex + 1) {
                        let first = false;
                        if (!item.estado) {
                            first = true;
                            // Si el item es de tipo video, nunca deshabilitar el botón de cerrar
                            if (!this.debug && item.tipo !== 'video') {
                                $('.btn_exit').addClass('disabled');
                            }
                            this.lastClickedIndex = index;
                            this.clickCount++;
                            element.classList.remove('heartbeat');
                            element.classList.add('selected');
                            const nextElement = document.getElementById(`p-${this.items[index + 1]?.id}`);
                            if (nextElement && !nextElement.classList.contains('heartbeat')) {
                                setTimeout(() => {
                                    nextElement.classList.add('heartbeat');
                                }, 1000);
                            }
                        } else {
                            console.log('Ya se hizo clic en este elemento');
                        }

                        this.toggleFlip('flipContainerGallery2D');
                        this.toggleFlip('flipContainerImage');
                        this.toggleFlip('flipContainerSVG');
                        this.generarModal(item, first);

                    }
                });
            } else {
                console.log(`No se encontró el elemento con id "p-${item.id}"`);
            }
        });
    }

    generarModal(item, first) {
        switch (item.tipo) {
            case 'galeria2D':
                this.generarModalGaleria2D(item, first);
                break;
            case 'imagen':
                this.generarModalImagen(item);
                break;
            case 'svgAudio':
                this.generarModalSVGAudio(item);
                break;
            case 'galeriaTexto':
                this.generarModalGaleria2D(item, first, 'texto');
                break;
            case 'video':
                this.generarModalVideo(item);
                break;
            default:
                console.log('Tipo de item no reconocido');
        }
    }
    generarModalVideo(item) {
        // Forzar el estado a true siempre para videos
        item.estado = true;
        // Configurar elementos del modal de video
        $('#tipo_video')
            .addClass('fade-in-bck')
            .removeClass('d-none')
            .one('animationend', function () {
                $(this).removeClass('fade-in-bck');
            });

        // Configurar contenido del modal
        $('#tipo_video_subtitulo').text(item.sub_titulo);
        const videoElement = $('#tipo_video_video');
        videoElement.find('source').attr('src', item.url_video);
        videoElement[0].load();
        // Opcional: reproducir automáticamente
        videoElement[0].play();
    }

    reproducirAudio(url_audio, id) {
        const audioElement = $(`#${id}`);
        audioElement.attr('src', url_audio).get(0).play().catch(console.log);
        setTimeout(() => audioElement.get(0).play().catch(console.log), 100);
    }

    mostrarModal(id) {
        $(`#${id}`)
            .addClass('fade-in-bck')
            .removeClass('d-none')
            .one('animationend', function () {
                $(this).removeClass('fade-in-bck');
            });
    }


    generarModalSVGAudio(item) {
        if (this.debug) {
            item.estado = true;
        }

        if (!item.estado) {
            $('.btn_exit').addClass('disabled');
        }

        let contador = 0;
        const actualizarEstadoSubItem = (subitem, $subItemElement) => {
            $('#principal').get(0).pause();
            $('#principal').get(0).currentTime = 0;
            subitem.estado = true;
            $subItemElement.addClass('selected').removeClass('heartbeat');
            contador++;
            this.reproducirAudio(subitem.url_audio, 'secundario');
            if (!item.estado) {
                $('.itemSVG').addClass('disabled');
            }
        };

        this.cargarYAgregarSvg(item.url_imagen, 'containerSVG').then(() => {
            this.reproducirAudio(item.url_audio, 'principal');
            this.mostrarModal('tipo_svg');
            $('#tipo_svg_subtitulo').text(item.sub_titulo);

            item.sub_items.forEach((subitem, index) => {
                const subitemId = `${item.id}-${index + 1}`;
                const $subItemElement = $(`#${subitemId}`);
                if ($subItemElement.length) {
                    $('#principal').one('ended', () => {
                        // Acciones a realizar cuando el audio principal termine
                        if (!item.estado && index === 0) {
                            $subItemElement.addClass('heartbeat');
                        }
                    });
                    $subItemElement.on('click', () => {
                        if (!item.estado) {
                            if (!$('#principal').get(0).paused) {
                                console.log('El audio principal está reproduciéndose. Retornando...');
                                return; // Retornar si el audio principal está activo
                            }
                        }
                        if (index <= contador) {
                            if (index === contador) {
                                actualizarEstadoSubItem(subitem, $subItemElement);
                                // Dentro del evento click, después de manejar el audio secundario
                                if (!item.estado) {
                                    $('#secundario').one('ended', () => {
                                        $('.itemSVG').removeClass('disabled');
                                        if (this.validarClick(item.sub_items)) {
                                            $('.btn_exit').removeClass('disabled').addClass('escalar');
                                            console.log('Se ha hecho clic en todos los items del svg');
                                            item.estado = true;
                                        }
                                        // Asegurarse de que el índice del siguiente subitem esté dentro del rango
                                        if (index + 1 < item.sub_items.length) {
                                            // Generar el ID del siguiente subitem basado en el patrón `${item.id}-${index + 1}`
                                            const nextSubItemId = `${item.id}-${index + 2}`; // +2 porque el índice es base 0 y ya estamos sumando 1 para el ID actual
                                            const $nextSubItemElement = $(`#${nextSubItemId}`);
                                            $nextSubItemElement.addClass('heartbeat');
                                        }
                                    });
                                }
                            } else {
                                this.reproducirAudio(subitem.url_audio, 'secundario');
                                console.log('Ya se hizo clic en este elemento');
                            }
                            console.log(`Se hizo clic en el subitem con ID: ${subitemId}`);
                        }
                    }).addClass('itemSVG');
                } else {
                    console.log(`El elemento con ID: ${subitemId} no existe.`);
                }
            });
        }).catch(error => {
            console.error('Error al cargar y agregar el SVG:', error);
        });
    }
    generarModalImagen(item) {
        // Configurar elementos de la imagen
        $('#tipo_imagen')
            .addClass('fade-in-bck')
            .removeClass('d-none')
            .one('animationend', function () {
                $(this).removeClass('fade-in-bck');
            });

        // Configurar contenido del modal
        this.insertFormattedText('tipo_imagen_texto', item.narracion);
        $('#tipo_imagen_imagen').attr('src', item.url_imagen);
        $('#tipo_imagen_subtitulo').text(item.sub_titulo);

        // Configurar y controlar audio
        let principal = $('#principal').get(0);
        principal.pause();
        $('#principal').attr('src', item.url_audio);
        setTimeout(() => {
            principal.play().catch(error => console.log(error));
        }, 500);

        // Manejar evento de finalización del audio si no estamos en modo debug
        if (!this.debug) {
            $(principal).one('ended', function () {
                $('.btn_exit').removeClass('disabled').addClass('escalar');
                item.estado = true;
                // Asegúrate de que la clase 'escalar' esté definida en tu CSS con la animación deseada
            });
        } else {
            item.estado = true;
        }
    }

    validarClick(items) {
        // Los items de tipo 'video' siempre se consideran completos
        return items.every(item => {
            if (item.tipo === 'video') return true;
            return item.estado;
        });
    }

    generarModalGaleria2D(item, first, tipo = 'imagen') {

        if (this.debug) {
            item.estado = true;
        }

        // Configurar elementos de la galería 2D
        $('#tipo_galeria_2d')
            .addClass('fade-in-bck')
            .removeClass('d-none')
            .one('animationend', function () {
                $(this).removeClass('fade-in-bck');
            });

        // Configurar contenido del modal
        this.insertFormattedText('tipo_galeria_2d_texto', item.narracion);
        $('#tipo_galeria_2d_subtitulo').text(item.sub_titulo);
        $('#tipo_galeria_2d_imagen').attr('src', item.url_imagen);
        $('#principal').attr('src', item.url_audio);
        $('#principal').get(0).play().catch(error => console.log(error));

        $('#miniaturas').empty();
        let contadorClics = 0; // Contador para llevar la cuenta de los clics

        item.sub_items.forEach((subItem, index) => {
            let subItemElement; // Declaración fuera del bloque if-else para ampliar el alcance
            if (tipo === 'imagen') {
                subItemElement = document.createElement('img');
                subItemElement.src = subItem.url_imagen;
                subItemElement.classList.add('miniatura', 'items');
            } else {
                subItemElement = document.createElement('div');
                const textNode = document.createTextNode(subItem.label);
                subItemElement.appendChild(textNode);
                subItemElement.classList.add('miniatura', 'items');
            }

            if (first && !this.debug) {
                $('#principal').on('ended', function () {
                    first = false;
                    if (index === 0) {
                        subItemElement.classList.add('heartbeat');
                    }
                });
            }

            // Restringir el evento de clic solo a la siguiente miniatura permitida
            subItemElement.addEventListener('click', () => {

                // Si al item no le revisaron aun
                if (!subItem.estado && index <= contadorClics && !first) {

                    // Actualizamos la informacion del item
                    $('#tipo_galeria_2d_imagen').attr('src', subItem.url_imagen);
                    this.insertFormattedText('tipo_galeria_2d_texto', subItem.narracion);
                    $('#principal').get(0).pause();
                    $('#secundario').attr('src', subItem.url_audio);
                    $('#secundario').get(0).play().catch(error => console.log(error));
                    this.toggleFlip('flipContainerGallery2D');
                    //Los desabilitamos a todos
                    $('.miniatura').addClass('disabled');
                    $(subItemElement).removeClass('heartbeat').addClass('selected');
                    //Cuando termine el audio entonces habilitamos a todos otra vez
                    const self = this; // Guarda una referencia al contexto actual antes de la función de callback
                    $('#secundario').one('ended', function () {
                        subItem.estado = true;
                        $('.miniatura').removeClass('disabled');
                        // Al siguiente elemento le ponemos la clase heartbeat
                        if (index + 1 < item.sub_items.length) {
                            const nextSubItemElement = document.querySelectorAll('.miniatura')[index + 1];
                            $(nextSubItemElement).addClass('heartbeat');
                        }
                        contadorClics++; // Incrementar el contador solo después de un clic válido
                        if (self.validarClick(item.sub_items)) { // Usa 'self' en lugar de 'this'
                            $('.btn_exit').removeClass('disabled').addClass('escalar');
                            console.log('Se ha hecho clic en todas las miniaturas');
                            item.estado = true;
                        }
                    });
                } else {
                    if (subItem.estado || this.debug) {
                        this.toggleFlip('flipContainerGallery2D');
                        // console.log('Ya se hizo clic en este elemento');
                        $('#tipo_galeria_2d_imagen').attr('src', subItem.url_imagen);
                        this.insertFormattedText('tipo_galeria_2d_texto', subItem.narracion);
                        $('#principal').get(0).pause();
                        $('#secundario').attr('src', subItem.url_audio);
                        $('#secundario').get(0).play().catch(error => console.log(error));
                        $(subItemElement).addClass('selected');
                        subItem.estado = true;
                    }
                }

            });
            $('#miniaturas').append(subItemElement);
        });

    }
}

export default Presentacion;