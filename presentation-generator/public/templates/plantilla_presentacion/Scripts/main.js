import Presentacion from '../Clases/Presentacion.js';

window.addEventListener('resize', resizeMain);

async function loadJson() {
    const response = await fetch('guion.json');
    const data = await response.json();
    return data;
}



function resizeMain() {
    var main = document.getElementById('main');
    var windowAspectRatio = window.innerWidth / window.innerHeight;
    var mainAspectRatio = 16 / 9;

    if (windowAspectRatio > mainAspectRatio) {
        main.style.width = window.innerHeight * mainAspectRatio + 'px';
        main.style.height = window.innerHeight + 'px';
    } else {
        main.style.width = window.innerWidth + 'px';
        main.style.height = window.innerWidth / mainAspectRatio + 'px';
    }
}

function validarClick(items) {
    return items.every(item => item.estado === true);
}

async function main() {
    let guion = await loadJson();
    let debug = guion.debug;
    let presentacion = null;
    if (typeof window !== 'undefined' && window.parent && !debug) {
        if (typeof window.parent.tienePointerEventsNone2 === 'function' && window.parent.tienePointerEventsNone2()) {
            debug = true;
            presentacion = new Presentacion(guion.url_svg, guion.nombre, guion.items, debug);
        } else {
            presentacion = new Presentacion(guion.url_svg, guion.nombre, guion.items, debug);
        }
    } else {
        presentacion = new Presentacion(guion.url_svg, guion.nombre, guion.items, debug);
    }


    if (!debug) {
        console.log('Modo Testing desactivado');
    } else {
        console.log('Modo Testing activado');
    }

    $(document).ready(function () {

        $('#start').click(function () {
            console.log('Se ha iniciado la animación principal');

            $(this).addClass('animate');
            setTimeout(function () {
                $('#start').remove();
                var audioElement = $('#principal').get(0);
                audioElement.src = guion.audio_presentacion;
                audioElement.play();
                if (debug) {
                    presentacion.iniciarInteractivo();
                    presentacion.animacionPrincipal();

                } else {
                    $('#principal').one('ended', function () {
                        presentacion.iniciarInteractivo();
                        presentacion.animacionPrincipal();
                        setTimeout(function () {
                        }, 2000);
                    });
                }
            }, 2000);
        });


        //Agregamos el cerrado
        $('.btn_exit').click(function () {
            var modal = $(this).closest('.modal_personalizado');

            // Si es el modal de video, detener el video
            if (modal.attr('id') === 'tipo_video') {
                var video = $('#tipo_video_video').get(0);
                if (video) {
                    video.pause();
                    video.currentTime = 0;
                }
                modal.addClass('d-none');
            }else {modal.addClass('puff-out-center');
                modal.one('animationend', function () {
                    modal.removeClass('puff-out-center');
                    modal.addClass('d-none');
                });
            }

            modal.addClass('puff-out-center');

            modal.one('animationend', function () {
                modal.removeClass('puff-out-center');
                modal.addClass('d-none');
            });

            let principal = $('#principal').get(0);
            let secundario = $('#secundario').get(0);

            // Si el audio está reproduciéndose, entonces pausar directamente
            if (!principal.paused) {
                principal.pause();
            }

            if (!secundario.paused) {
                secundario.pause();
            }
            $('.selected').removeClass('heartbeat');

            // Assuming guion.items is an array of objects
            if (validarClick(presentacion.items)) {
                if (typeof window !== 'undefined' && typeof window.parent.validarPuntaje === 'function') {
                    window.parent.validarPuntaje(20, "opcion");
                } else {
                    console.log('No se ha encontrado la función validarPuntaje');
                }
                if (guion.audio_despedida !== '') {
                    console.log('Intentando reproducir el audio principal');
                    principal.src = guion.audio_despedida;
                    principal.play().then(_ => {
                        console.log('Reproducción iniciada');
                    }).catch(error => {
                        console.log('Error al intentar reproducir el audio:', error);
                    });
                }
                console.log('Se ha hecho clic en todos los elementos');
            }

            $('#containerSVG').empty();
        });

        //Para el titulo
        if (typeof window !== 'undefined' && 'addEventListener' in window.parent.document) {
            window.parent.document.addEventListener('fullscreenchange', () => {

                if (window.parent.document.fullscreenElement) {
                    $('#header').removeClass('d-none');
                } else {
                    $('#header').addClass('d-none');
                }
            });
        }
    });
}
resizeMain();
main();