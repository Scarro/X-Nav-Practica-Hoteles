var marcadores = [];
var colecciones = [];
var seleccionado = false;
var map;
var zoom;
var tab;
var col_tab = false;

$(document).ready(function(){
    initMap();
    $('#get').click(function(event){
        event.preventDefault();
        $('#get').html('').hide();
        dameAlojamientos();
    });

    $('#form-coleccion').submit(function(event){
        event.preventDefault();
        insertar_coleccion($('#nueva_coleccion').val());
        mostrar_colecciones();
        $('.coleccion').droppable({
            hoverClass:'border',
            over: function(event, ui){
                console.log("over me");
            },
            drop: handleDrop,
        });
        $('.coleccion').click(function(event){
            event.preventDefault();
            var s = event.currentTarget.attributes[0].value;
            if(s== true) {
                for(var i = 0; i<colecciones.length; i++){
                    if(colecciones[i].sel == true){
                        colecciones[i].sel = false;
                    }
                }
            }
            colecciones[s].sel = true;
            seleccionado = true;
            var html = mostrarSeleccionado(s);
            $('#selected').html(html);
        });
    });
});

var initMap = function(){
    $("#map").fadeIn(800);
    map = L.map('map').setView([40.4175, -3.708], 11);
    L.tileLayer('https://api.tiles.mapbox.com/v4/scarro.ppial27m/{z}/{x}/{y}.png?access_token=pk.eyJ1Ijoic2NhcnJvIiwiYSI6ImNpbmhtdWdnaTAwMmd2ZGx5eHhsaWs5YzEifQ.FONk5Fvpiz12ehN8ByO2GA', {
        attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
        maxZoom: 18
    }).addTo(map);
    L.easyButton('fa-map', 
              function (){
                borrarTodosMarcadores();
              },
             'Limpiar el mapa'
            ).addTo(map);
};

function dameAlojamientos(){
    $('#lista').empty();
    tabsHandler();
    $.getJSON('data/alojamientos.json', function(data){
        alojamientos = data.serviceList.service;
        var lista = new String();
        for (var i = 0; i < alojamientos.length; i++) {
            lista += "<a no=" + i + " class='list-group-item alojamiento'>"
                 + alojamientos[i].basicData.title + "</a>";
        };
        $('#lista').append(lista);
        $('#lista').btsListFilter('#searchinput', {
            initial: false,
            casesensitive: false,
        });
        $('#num_hoteles').text(alojamientos.length + ' hoteles encontrados');
        $('.alojamiento').draggable({
            helper: 'clone',
            appendTo: 'body',
            revert:true
        });
        $('.alojamiento').draggable('disable');
        $('.alojamiento').click(function(){
            if(!col_tab){
                dameAlojamiento($(this).attr('no'), 15);
            }
        });

    });
}

function tabsHandler(){
    $('#colecciones-nav').fadeIn(800);
    $('#gestion-nav').fadeIn(800);
    $('#lista-alojamientos').fadeIn(500);
    tab = 1;
    $('#colecciones-nav').click(function(){
        col_tab = true;
        $('.alojamientos').hide();
        if(tab == 3){
            $('#lista-alojamientos').fadeIn(500);
        }
        //Aqui he de poner que se vea la lista seleccionada???
        $('.colecciones').fadeIn(500);
        $('.alojamiento').draggable('enable');
        tab = 2;
    });
    $('#gestion-nav').click(function(){
        $('#lista-alojamientos').fadeOut(500);
        $('.alojamientos').fadeOut(500);
        $('.colecciones').fadeOut(500);
        tab = 3;
    })
    $('#main-nav').click(function(){
        col_tab = false;
        if(tab == 3){
            $('#lista-alojamientos').fadeIn(500);
        }
        $('.colecciones').hide();
        $('.alojamientos').fadeIn(500);
        $('.alojamiento').draggable('disable');
        tab = 1;
    });
}

//Obtiene los datos del alojamiento solicitado (Así como su marcador)
function dameAlojamiento(number,zoom){
    var alojamiento = alojamientos[number];
    var name = alojamiento.basicData.name;
    var lat = alojamiento.geoData.latitude;
    var lon = alojamiento.geoData.longitude;
    var url = alojamiento.basicData.web;
    var desc = alojamiento.basicData.body;
    var cat = alojamiento.extradata.categorias.categoria.item[1]['#text'];
    if(alojamiento.extradata.categorias.categoria.subcategorias){
        var subcat = alojamiento.extradata.categorias.categoria
    .       subcategorias.subcategoria.item[1]['#text'];
    }
    if(alojamiento.multimedia){
        var images = alojamiento.multimedia.media;
    }
    var existe = false;
    marcadores.forEach(function(marcador){
        if(number == marcador.number){
            existe = true;
        }
    });
    if(!existe){
        crearMarcador(number, name, url, lat, lon);
    } else {
        map.setView([lat,lon], zoom);
    }
    var descripcion = "<p><h1>" + name + "</h1>"
        + '<p>Tipo: ' + cat;
    if(subcat)
        descripcion += ', categoría: ' + subcat + '</p>';
    if(desc){
        descripcion += "<h4>" + desc + "</h4></p>";
    }
    if(images){
        if(images.length > 1){
            selector = $('#detalles');
            crearCarousel(selector,images);
        } else if(!images.length){
            $('#detalles').html('<img src="' + images.url + '" class="imagen col-sm-6 img-responsive" alt="imagen">');
        }
        $('#detalles').append(descripcion);
    } else {
        $('#detalles').html(descripcion);
    }
}

//Crea El localizador en el mapa del Alojamiento
function crearMarcador(number, name, url, lat, lon){
    var marcador = L.marker([lat, lon]);
    marcador.number = number;
    marcadores.push(marcador);
    marcador.addTo(map).bindPopup('<a href="' 
    + url + '">' + name + '</a><br/><input type="button"'+
    ' value="Borrar marcador" class="marker-delete-button"/>');
    map.setView([lat,lon], 15);
    marcador.on('popupopen', onPopupOpen);
    existe_marcador = true;
}

//Evento que se produce al seleccionar un marcador
//Con esta funcion obtienes el hotel seleccionado en el mapa
//o borras el marcador
function onPopupOpen(){
    var tempMarker = this;
    var temp_coords = this._latlng;
    for(var i = 0; i<marcadores.length; i++){
        var latlng = marcadores[i]._latlng
        if(temp_coords.lat == latlng.lat){
            if(temp_coords.lng == latlng.lng){
                dameAlojamiento(tempMarker.number, map.getZoom());
                break;
            }
        }
    }
    $(".marker-delete-button:visible").click(function () {
        map.removeLayer(tempMarker);
        marcadores.splice(i, 1);
    });
}

//Crea el carousel en el selector indicado con las imagenes entregadas
function crearCarousel(selector,images){
  var carousel = "<div id='carousel1' class='imagen col-sm-6 carousel slide show' data-ride='carousel'>";
  carousel += "<ol class='carousel-indicators'>";
  carousel += "<li data-target='#carousel1' data-slide-to='0' class='active'></li>";
  for(i=1; i<images.length; i++){
    carousel +="<li data-target='#carousel1' data-slide-to=" + i + "></li>";
  }
  carousel += "</ol>";
  carousel += "<div class='carousel-inner' role='listbox'>";
  carousel += "<div class='item active'>";
  carousel += "<img src='" + images[0].url + "' alt='imagen' class='img-responsive'>";
  carousel += "</div>";
  for(i=1;i<images.length;i++){
    carousel += "<div class='item'>";
    carousel += "<img src='" + images[i].url + "' alt='imagen' class='img-responsive'>";
    if(images[i].description != null){
      carousel += "<div class='carousel-caption'>";
      carousel += "<h3>" + images[i].description + "</h3>";
      carousel += "</div>";
    }
    carousel += "</div>" ;
  }
  // Controles
  carousel += "<a class='left carousel-control' href='#carousel1' role='button' data-slide='prev'>";
  carousel += "<span class='glyphicon glyphicon-chevron-left' aria-hidden='true'></span>";
  carousel += "<span class='sr-only'>Previous</span></a>";
  carousel += "<a class='right carousel-control controles' href='#carousel1' role='button' data-slide='next'>";
  carousel += "<span class='glyphicon glyphicon-chevron-right' aria-hidden='true'></span>";
  carousel += "<span class='sr-only'>Next</span></a>";
  carousel += "</div>";
  selector.html(carousel);
}

function borrarTodosMarcadores(){
    var i = marcadores.length-1;
    while(i>=0){
        map.removeLayer(marcadores[i]);
        marcadores.pop();
        i--;
    }
}

//Inserta una nueva coleccion al array de objetos colecciones
function insertar_coleccion(coleccion){
    var c = {nombre: coleccion, hoteles: new Array(), sel:false};
    colecciones.push(c);
    $('#nueva_coleccion').val('');
}

//Muestra en el html las colecciones disponibles
function mostrar_colecciones(){
    var html = new String();
    var hoteles = [];
    if(colecciones.length > 0){
        for(var i = 0; i<colecciones.length; i++){
            html += mostrarSeleccionado(i);
        }
    } else {
        html += "<p>No hay colecciones disponibles.</p>";
    }
    $('#collection-list').html(html);
}

function mostrarSeleccionado(seleccionado){
    var html = new String();
    html += '<a no="' + seleccionado + '" class="list-group-item coleccion">' 
        + '<h4 class="list-group-item-heading">'
        + colecciones[seleccionado].nombre + '</h4>'
        + '<p>Hoteles:</p>';
    var hoteles = colecciones[seleccionado].hoteles;
    if(hoteles.length > 0){
        html += '<ol class="list-inline">';
        for(var j=0; j<hoteles.length;j++){
            html +='<li>' + hoteles[j]
            + '</li>'
        }
        html += '</ol>'
    } else {
        html += "<p>No hay hoteles seleccionados.</p>";
    }
    html += "</a>";
    return html;
}

//Rellena la coleccion con el hotel que se ha soltado encima de la coleccion
function handleDrop(event, ui){
    index = event.target.attributes[0].value;
    hotel = ui.draggable[0].innerText;
    colecciones[index].hoteles.push(hotel);
    var p = $('.coleccion[no="' + index + '"]>p').next();
    if(p[0].innerText == "No hay hoteles seleccionados."){
        p[0].innerHTML = '';
        if(p.length == 2){
            p[1].innerText = '';
        }
    }
    if(colecciones[index].hoteles.length == 1){
        $('.coleccion[no="' + index + '"]>p').next().append(hotel);
    } else if (colecciones[index].hoteles.length > 1){
        $('.coleccion[no="' + index + '"]>p').next().append(', ' + hotel);
    }
}