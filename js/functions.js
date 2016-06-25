var marcadores = [];
var colecciones = [];
var map;
var col_tab = false;
var tab = 1;
var zoom;
var seleccionado;

$(document).ready(function(){
    initMap();
    $('#get').click(function(event){
        event.preventDefault();
        dameAlojamientos();
    });
    mostrarColecciones();
    $('#seleccionado').html(htmlColeccion(false));
    $('#selected').html(htmlColeccion(false));
    $('#form-coleccion').submit(function(event){
        event.preventDefault();
        insertar_coleccion($('#nueva_coleccion').val());
        mostrarColecciones();
        collectionHandlers();
    });
    $('#importar').submit(function(event){
        event.preventDefault();
        importar();
    });
    $('#exportar').submit(function(event){
        event.preventDefault();
        exportar();
    });
});


//Inicializa el mapa
var initMap = function(){
    $("#map").fadeIn(800);
    map = L.map('map').setView([40.4175, -3.708], 11);
    L.tileLayer('https://api.tiles.mapbox.com/v4/scarro.0fp5pccj/{z}/{x}/{y}.png?access_token=pk.eyJ1Ijoic2NhcnJvIiwiYSI6ImNpbmhtdWdnaTAwMmd2ZGx5eHhsaWs5YzEifQ.FONk5Fvpiz12ehN8ByO2GA', {
        attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
        maxZoom: 18
    }).addTo(map);
    L.easyButton('fa-map', function (){
            borrarTodosMarcadores();
        },
        'Limpiar el mapa'
    ).addTo(map);
};

function tabsHandler(){
    $('#myNavbar > ul').fadeIn(500);
    $('#refresh').fadeIn(500);
    $('#colecciones-nav').click(function(){
        col_tab = true;
        $('#get').hide();
        if(tab==3){
            $('#lista-alojamientos').fadeIn(500);
        }
        $('.alojamientos').hide();
        $('.colecciones').fadeIn(500);
        $('.alojamiento').draggable('enable');
        tab = 2;
    });
    $('#gestion-nav').click(function(){
        $('#lista-alojamientos').hide();
        $('.alojamientos').hide();
        $('.colecciones').hide();
        tab = 3;
    });
    $('#main-nav').click(function(){
        col_tab = false;
        $('#get').show();
        if(tab==3){
            $('#lista-alojamientos').fadeIn(500);
        }
        $('.alojamientos').fadeIn(500);
        $('.colecciones').hide();
        $('.alojamiento').draggable('disable');
        tab = 1;
    });
}

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

//Obtiene los datos del alojamiento solicitado (Así como su marcador)
function dameAlojamiento(number,zoom){
    var alojamiento = alojamientos[number];
    var name = alojamiento.basicData.name;
    var lat = alojamiento.geoData.latitude;
    var lon = alojamiento.geoData.longitude;
    var dir = alojamiento.geoData.address;
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
        console.log("Creo marcador");
        crearMarcador(number, name, url, lat, lon);
    } else {
        console.log(zoom);
        map.setView([lat,lon], zoom);
    }
    var descripcion = "<p><h1 class='titulo detalle'>" + name + "</h1>"
        + '<p>Tipo: <span class="tipo">' + cat + "</span>";
    if(subcat)
        descripcion += ', categoría: <span class="categoria">' + subcat + "</span>";
    if(dir){
        descripcion += '<br/>Direccion: ' + dir + '</p>'
    }
    descripcion += "</p>"
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
  carousel += "<div class='carousel-inner'>";
  carousel += "<div class='item active'>";
  carousel += "<img src='" + images[0].url + "' alt='imagen' style='width:100%;'>";
  carousel += "</div>";
  for(i=1;i<images.length;i++){
    carousel += "<div class='item'>";
    carousel += "<img src='" + images[i].url + "' alt='imagen' style='width:100%;'>";
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
    var existe = false;
    for(var i=0; i<colecciones.length; i++){
        if(colecciones[i].nombre == coleccion){
            existe = true;
        }
    }
    if(!existe){
        $('#error').html('');
        var c = {nombre: coleccion, hoteles: new Array(), sel:false};
        colecciones.push(c);
    } else {
        mensaje = "Ya existe una colección con ese nombre."
        $('#error').html(mensaje);
    }
    $('#nueva_coleccion').val('');
}

//Muestra en el html las colecciones disponibles
function mostrarColecciones(){
    var html = new String();
    var hoteles = [];
    if(colecciones.length > 0){
        for(var i = 0; i<colecciones.length; i++){
            html += htmlColeccion(i);
        }
    } else {
        html += "<p style='text-align:center;'>No hay colecciones disponibles.</p>";
    }
    $('#collection-list').html(html);
}

function htmlColeccion(seleccionado){
    var html = new String();
    console.log(seleccionado);
    if(typeof seleccionado !== "boolean"){
        html += '<a no="' + seleccionado + '" class="list-group-item coleccion eliminar">' 
        + '<h3 class="list-group-item-heading"><strong>'
        + colecciones[seleccionado].nombre + '</strong></h3>'
        + '<p>Hoteles:</p>';
        var hoteles = colecciones[seleccionado].hoteles;
        if(hoteles.length > 0){
            html += '<ol class="list-inline lista-hoteles">';
            for(var i=0; i<hoteles.length;i++){
                html +='<li>' + hoteles[i].basicData.title;
                if(i<(hoteles.length-1)){
                    html += '<span>, <span>';
                }
                html += '</li>'
            }
            html += '</ol></a>';
        } else {
            html += "<p>No hay hoteles seleccionados.</p>";
        }
    } else {
        html = "<p style='text-align:center;'>No hay seleccionada ninguna coleccion.</p>"
    }
    return html;
}

function collectionHandlers(){
    $('.coleccion').droppable({
            hoverClass:'border',
            drop: handleDrop,
        });
    $('.coleccion').click(function(event){
        event.preventDefault();
        var s = event.currentTarget.attributes[0].value;
        if(s>=0){
            colecciones[s].sel = true;
            for(var i=0; i<colecciones.length; i++){
                if(i != s && colecciones[i].sel == true){
                    colecciones[i].sel = false;
                }
            }
        }
        seleccionado = colecciones[s];
        var html = htmlColeccion(s);
        $('#selected').html(html);
        $('#seleccionado').html(html);
    });
}

//Rellena la coleccion con el hotel que se ha soltado encima de la coleccion
function handleDrop(event, ui){
    var existe = false;
    index = event.target.attributes[0].value;
    if(colecciones[index].hoteles.length == 0){
        var p = $('.coleccion[no="' + index + '"]>p').next();
        if(p[0].innerText == "No hay hoteles seleccionados."){
            for(var i=0; i<p.length; i++){
                p[i].innerText = '';
            }
        }
    }
    var num_alojamiento = ui.draggable[0].outerHTML.split(" ")[1].split("\"")[1];
    var hotel = alojamientos[num_alojamiento];
    for(var i=0;i<colecciones[index].hoteles.length;i++){
        if(colecciones[index].hoteles[i].basicData.name == hotel.basicData.name){
            existe = true;
        }
    }
    if(!existe){
        colecciones[index].hoteles.push(hotel);
        var nombre = hotel.basicData.title;
        if(colecciones[index].hoteles.length == 1){
            $('.coleccion[no="' + index + '"]>p').next().append(nombre);
        } else if (colecciones[index].hoteles.length > 1){
            $('.coleccion[no="' + index + '"]>p').next().append(', ' + nombre);
        }
    }
}

function exportar(){
    var token = $('#token1').val();
    var repositorio = $('#repo1').val();
    var nombre = $('#nombre_arch1').val();

    var github = new GitHub({token:token, auth:"oauth"});
    var json = colecciones;
    var text = JSON.stringify(json);
    var commit = "JSON exportado";
    var rep = github.getRepo("Scarro", repositorio);

    rep.writeFile("master", nombre, text, commit, function(err){});
    $('#miModalExportar').modal('hide');
}

function importar(){
    var token = $('#token2').val();
    var repositorio = $('#repo2').val();
    var nombre = $('#nombre_arch2').val();

    var github = new GitHub({token:token, auth:"oauth"});
    var rep = github.getRepo("Scarro", repositorio);
    var url = "https://api.github.com/repos/Scarro/" + repositorio + "/contents/" + nombre;
    $.getJSON(url).done(function(data){
        colecciones = JSON.parse(decodeURIComponent(escape(atob(data.content))));
        mostrarColecciones();
        collectionHandlers();
        $('#miModalImportar').modal('hide');
    }).fail(function(error){
        alert(nombre + ": " + error.statusText);
        $('#miModalImportar').modal('hide');
    });
}