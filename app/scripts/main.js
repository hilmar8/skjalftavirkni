'use strict';

/*global ol:false, moment:false */

/*
 *
 * Notast við kort frá MapQuest í gegnum OpenLayers. Það hefur reynst vel í þróun.
 *
 */
var map = new ol.Map({
  target: 'map',
  layers: [
    new ol.layer.Tile({
      source: new ol.source.MapQuest({layer: 'sat'})
    })
  ],
  view: new ol.View({
    // Byrja yfir íslandi, zoomað út.
    center: ol.proj.transform([-18.0, 64.8], 'EPSG:4326', 'EPSG:3857'),
    zoom: 8
  })
});

/*
 *
 * Hér var tekin ákvörðun um að nota HTML5 canvas loop í stað þess að
 * notast við ol.source.ImageCanvas frá OpenLayers eftir mikinn
 * hausverk. Þessi niðurstaða kom betur út.
 *
 */
/* jshint ignore:start */
var requestAnimationFrame = window.requestAnimationFrame ||
  window.mozRequestAnimationFrame ||
  window.webkitRequestAnimationFrame ||
  window.msRequestAnimationFrame;
/* jshint ignore:end */

// Stillum núllpunktinn þar sem atburðinir byrja sem einhverja
// dagsetningu í millisekúndum. Í þessu tilfelli er sú dagsetning
// 14. ágúst 2014.
var EPOCH = 1407974400000;

// Smá hakk ef það er verið að nota IE10.
var IE10 = false;
if (navigator.appVersion.indexOf('MSIE 10') !== -1)
{
  IE10 = true;
}

// Stjórnum FPS til að vera ekki að teikna of oft á skjáinn til að hlífa
// eldri tölvum. Aðferð fengin frá eftirfarandi vefslóð
// http://codetheory.in/controlling-the-frame-rate-with-requestanimationframe/
var fps = 30;
var now;
var then = Date.now();
var interval = 1000/fps;
var delta;

// Res er breyta sem kemur frá OpenLayers og segir okkur hvert resolution
// er á kortinu sem við erum að birta. Ef zoomað er inn þá er gildið lítið,
// t.d. 150 en ef zoomað er út þá fer gildið stækkandi, t.d. 350. Þessa breytu
// notum við til að segja hvað skjálftinn á að vera stór eftir því hversu mikið
// það er zoomað inn.
var res = 0;

// Canvas til að teikna á.
var canvas = document.getElementById('canvas');

// Geymum hver klukkan er núna. Þessi breyta er notuð til að finna út hvaða
// jarðskjálfta á að birta á hvaða tíma.
var currentTime = EPOCH;
var endofTime = EPOCH;

// JSON breyta sem geymir alla jarðskjálftana.
var json;

// Þessi breyta geymir staðsetninguna í json fylkinu sem við erum komin á þegar tíminn
// currentTime er.
var jsonPosition = 0;

// ac geymir alla jarðskjáfta sem eru í birtingu.
var ac = [];

// Viljum birta allar dagsetningar á íslensku.
moment.locale('is');

// Þegar kortið er hreyft, zoomað er inn og út eða glugginn stækkar eða minnkar
// þurfum við að stilla canvas til að vera jafn stór og kortið, staðsetja
// tímasliderinn og stilla res breytuna sem ræður stærðinni á jarðskjálftum eftir
// því hversu mikið er zoomað inn.
map.on('moveend', function() {
  canvas.width = map.getSize()[0];
  canvas.height = map.getSize()[1];
  $('#slider-wrapper').css('top', map.getSize()[1] - 75);
  $('#git-wrapper').css('left', map.getSize()[0] - 50);
  $('#info-wrapper').css('top', map.getSize()[1] - 40);
  res = map.getView().getResolution();
});

// Teikna allt.
function mainLoop() {
  now = Date.now();
  delta = now - then;

  if (delta > interval) {
    then = now - (delta % interval);

    // Sendum sliderinn áfram.
    $('#slider-range').slider("option", "value", currentTime);

    // Sækjum context til að teikna á.
    var context = canvas.getContext('2d');

    // Burtu með allt sem búið er að teikna.
    context.clearRect(0, 0, canvas.width, canvas.height);

    // Sækjum tímann sem við erum að birta á íslensku læsilegu formi.
    var dateCurrentTime = moment(currentTime).format('dddd, Do MMMM YYYY, HH:mm:ss');

    // Birta tímann á kortinu.
    context.fillStyle = 'white';
    context.font = 'bold 16px Arial';
    context.shadowColor = 'black';
    context.shadowOffsetX = 1;
    context.shadowOffsetY = 1;
    context.shadowBlur = 5;
    context.fillText(dateCurrentTime.charAt(0).toUpperCase() + dateCurrentTime.slice(1), 40, canvas.height - 85);

    if (IE10) {
      context.fillText('Því miður er ekki hægt að hreyfa kortið né þysja inn og út í Internet Explorer 10.', 40, canvas.height - 125);
      context.fillText('Vinsamlegast notaðu annan vafra eða uppfærðu Internet Explorer.', 40, canvas.height - 105);
    }

    // Burtu með skuggann sem settur var á tímann.
    context.shadowOffsetX = 0;
    context.shadowOffsetY = 0;
    context.shadowBlur = 0;

    // Skellum öllum jarðskjálftum inn í ac fylkið sem hafa gerst eftir að síðasta
    // ítrun á mainLoop() gerðist. Þetta eru skjálftanir sem eiga að fara í birtingu
    // núna.
    for (var i = 0; i !== json.length; i++) {
      if ((json[i].dags + EPOCH) < currentTime && i > jsonPosition) {
        jsonPosition = i;
        ac.push(json[i]);
      }
    }

    // Teiknum jarðskjálftan sem eru virkir inn í ac fylkinu.
    var v, jj, o, scale, sin;
    for (var k = 0; k !== ac.length; k++) {
      v = ac[k];

      // Skjálftagögnin frá veðurstofunni koma á 66° norður sniðmátinu og því þurfum við að breyta
      // því í sniðmátið sem kortið frá MapQuest er að nota.
      jj = ol.proj.transform([parseFloat(v.lengd), parseFloat(v.breidd)], 'EPSG:4326', 'EPSG:3857');

      // Síðan þurfum við að breyta sniðmátinu sem MapQuest kortið er að nota yfir í skjápixla
      // til að teikna jarðskjálftann á kortinu.
      o = map.getPixelFromCoordinate([jj[0], jj[1]]);

      // Hvað er skjálftinn stór.
      scale = parseFloat(v.m);

      // Sumir skjálftar komu á -9.99 eða svipuðu stigi og því þurfum við að athuga hvort þessi skjálfti
      // sé ekki örugglega yfir 0.
      if (scale > 0) {
        // Angle breytan ræður því hversu stór jarðskjálftinn er. Jarðskjálftinn byrjar með radíus
        // sem er margfeldi af sin(angle) = 0 og endar sem margfeldi af sin(angle) = 1.
        if (!v.angle) {
          v.angle = 0;
        }

        // Reikna út sin(angle)
        sin = Math.abs(Math.sin(v.angle));

        // Við viljum bara teikna skjálftann ef hann er enn stækkandi. Ef sin er orðið 1 eða stærra
        // þá viljum við fjarlægja skjálftann því hann er búinn.
        if (sin < 1) {

          // Skalinn á jarðskjálftum er exponential skali þar sem t.d. skjálfti upp á 5 er 10 sinnum stærri
          // en skjálfti upp á 4. Þessi skali kemur mjög illa út á þessu korti þannig að minnstu skjálftanir
          // eru allt of litlir og stærstu eru allt of stórir. Því búum við bara til okkar eigin skala sem
          // kemur mjög vel út. Deilum með res þar sem res fer stækkandi þegar zoomað er út og við viljum
          // að skjálftinn fari minnkandi þegar zoomað er út.
          var magnitude = parseFloat(v.m);
          var radius = ((Math.exp(magnitude) / 10) / res) * 8000 * sin;

          // Teiknum sjálfan skjálftann í þeirri stærð sem hann á að birtast.
          context.beginPath();
          context.arc(o[0], o[1], radius, 0, Math.PI * 2, false);
          context.closePath();
          // Notumst við cos(angle) til að segja hversu bjartur skjálftinn á að vera. Þegar skjálftinn
          // er nýr og angle = 0 þá er cos(0) = 1 en þegar sin(angle) nálgast 1 þá nálgast cos(angle) 0.
          context.fillStyle = 'rgba(159, 0, 197, '+Math.abs(Math.cos(v.angle)).toFixed(2)+')';
          context.fill();

          // Hægt að leika sér að birta stærð jarðskjálfta við jarðskjálftann.
          /*if (magnitude > 2.5) {
            context.font = 'bold 16px Arial';
            context.shadowColor = 'black';
            context.shadowOffsetX = 1;
            context.shadowOffsetY = 1;
            context.shadowBlur = 5;
            context.fillStyle = 'white';
            context.fillText('' + magnitude, o[0], o[1]);
          }*/


          // Stækkum skjálftann fyrir næstu ítrun á lykkjunni.
          v.angle += Math.PI / 128;
        } else {
          // Fjarlægjum skjálftann ef hann er búinn.
          ac.splice(i, 1);
        }
      } else {
        // Út með alla skjálfta sem eru undir 0 á skala.
        ac.splice(i, 1);
      }
    }

    // Stækkum um 6 mínutur og 40 sekúndur í hverri ítrun af lykkjunni.
    if (currentTime < endofTime) {
      currentTime += 500000;
    }
  }

  // Köllum aftur á mainLoop þegar vafrinn vill.
  requestAnimationFrame(mainLoop);
}

// Aðferð til að geta breytt tímasetningunni í currentTime hvenær sem er.
function setTime(newTime) {
  jsonPosition = 0;
  ac = [];
  currentTime = newTime;

  for (var i = 0; i !== json.length; i++) {
    json[i].angle = 0;
    if (jsonPosition === 0 && (json[i].dags + EPOCH) >= newTime) {
      jsonPosition = i;
    }
  }
}

// Þegar smellt er á einhver stað á sliderinum þá þarf að breyta tímasetningunni
// á þann stað.
$('#slider-range').on('input change slide', function() {
    setTime(parseFloat($(this).slider("option", "value")));
});

$( "#slider-range" ).slider();

// Sækja JSON gögn yfir jarðskjálfta og stilla breytur.
$.getJSON('data.json', function(data) {
  endofTime = data[data.length - 1].dags + EPOCH;

  $('#slider-range').slider("option", "min", EPOCH);
  $('#slider-range').slider("option", "max", endofTime);
  $('#slider-range').slider("option", "value", EPOCH);

  json = data;
  mainLoop();
});
