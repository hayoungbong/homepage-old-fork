/* Runs in <head> before first paint: picks language and light/dark theme so the page never flashes the wrong one.
   Theme rule: light while the sun is up where the visitor is, dark after sunset.
   Location is estimated from the browser's time zone only (no permission prompt, nothing leaves the browser). */
(function () {
  'use strict';
  var root = document.documentElement;
  root.classList.add('js');

  function read(store, k) { try { return window[store].getItem(k); } catch (e) { return null; } }

  var lang = read('localStorage', 'lang');
  if (lang !== 'ko' && lang !== 'en') lang = 'en';
  root.setAttribute('data-lang', lang);
  root.setAttribute('lang', lang);

  var TZ = {
    'America/New_York':[40.7,-74],'America/Detroit':[42.3,-83],'America/Chicago':[41.9,-87.6],'America/Denver':[39.7,-105],
    'America/Phoenix':[33.4,-112],'America/Los_Angeles':[34,-118.2],'America/Anchorage':[61.2,-149.9],'Pacific/Honolulu':[21.3,-157.9],
    'America/Toronto':[43.7,-79.4],'America/Vancouver':[49.3,-123.1],'America/Mexico_City':[19.4,-99.1],'America/Costa_Rica':[9.9,-84.1],
    'America/Bogota':[4.7,-74.1],'America/Lima':[-12,-77],'America/Santiago':[-33.4,-70.7],'America/Sao_Paulo':[-23.5,-46.6],
    'America/Argentina/Buenos_Aires':[-34.6,-58.4],'Europe/London':[51.5,-0.1],'Europe/Dublin':[53.3,-6.3],'Europe/Lisbon':[38.7,-9.1],
    'Europe/Paris':[48.9,2.35],'Europe/Brussels':[50.8,4.4],'Europe/Amsterdam':[52.4,4.9],'Europe/Berlin':[52.5,13.4],
    'Europe/Zurich':[47.4,8.5],'Europe/Vienna':[48.2,16.4],'Europe/Rome':[41.9,12.5],'Europe/Madrid':[40.4,-3.7],
    'Europe/Copenhagen':[55.7,12.6],'Europe/Oslo':[59.9,10.8],'Europe/Stockholm':[59.3,18.1],'Europe/Helsinki':[60.2,24.9],
    'Europe/Warsaw':[52.2,21],'Europe/Athens':[38,23.7],'Europe/Istanbul':[41,29],'Europe/Moscow':[55.8,37.6],
    'Africa/Cairo':[30,31.2],'Africa/Lagos':[6.5,3.4],'Africa/Nairobi':[-1.3,36.8],'Africa/Johannesburg':[-26.2,28],
    'Asia/Dubai':[25.2,55.3],'Asia/Kolkata':[28.6,77.2],'Asia/Calcutta':[28.6,77.2],'Asia/Bangkok':[13.8,100.5],
    'Asia/Ho_Chi_Minh':[10.8,106.7],'Asia/Jakarta':[-6.2,106.8],'Asia/Singapore':[1.35,103.8],'Asia/Kuala_Lumpur':[3.1,101.7],
    'Asia/Manila':[14.6,121],'Asia/Hong_Kong':[22.3,114.2],'Asia/Taipei':[25,121.5],'Asia/Shanghai':[31.2,121.5],
    'Asia/Seoul':[37.57,126.98],'Asia/Tokyo':[35.7,139.7],'Australia/Perth':[-31.95,115.9],'Australia/Brisbane':[-27.5,153],
    'Australia/Sydney':[-33.9,151.2],'Australia/Melbourne':[-37.8,145],'Pacific/Auckland':[-36.8,174.8]
  };
  function visitorLatLon() {
    var tz = '';
    try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) {}
    if (TZ[tz]) return TZ[tz];
    var lon = -new Date().getTimezoneOffset() / 4;
    var south = /^(Australia|Antarctica)\//.test(tz) || /America\/(Argentina|Sao_Paulo|Santiago|Montevideo)/.test(tz);
    return [south ? -30 : 35, lon];
  }
  // Sunrise equation (https://en.wikipedia.org/wiki/Sunrise_equation)
  function isDaylight(now) {
    var ll = visitorLatLon(), rad = Math.PI / 180, lat = ll[0] * rad;
    var J = now / 86400000 + 2440587.5;
    var n = Math.round(J - 2451545.0 + 0.0008);
    var Js = n - ll[1] / 360;
    var M = (357.5291 + 0.98560028 * Js) % 360;
    var C = 1.9148 * Math.sin(M * rad) + 0.02 * Math.sin(2 * M * rad) + 0.0003 * Math.sin(3 * M * rad);
    var L = (M + C + 180 + 102.9372) % 360;
    var Jt = 2451545.0 + Js + 0.0053 * Math.sin(M * rad) - 0.0069 * Math.sin(2 * L * rad);
    var dec = Math.asin(Math.sin(L * rad) * Math.sin(23.4397 * rad));
    var cosW = (Math.sin(-0.833 * rad) - Math.sin(lat) * Math.sin(dec)) / (Math.cos(lat) * Math.cos(dec));
    if (cosW > 1) return false;   // polar night
    if (cosW < -1) return true;   // midnight sun
    var W = Math.acos(cosW) / rad / 360;
    var toMs = function (j) { return (j - 2440587.5) * 86400000; };
    return now >= toMs(Jt - W) && now < toMs(Jt + W);
  }

  function applyAutoTheme() {
    var manual = read('sessionStorage', 'theme');   // set when the visitor uses the switch
    var theme = (manual === 'dark' || manual === 'light') ? manual : null;
    if (!theme) {
      try { theme = isDaylight(Date.now()) ? 'light' : 'dark'; }
      catch (e) { theme = null; }                    // fall back to the OS preference (CSS media query)
    }
    if (theme) root.setAttribute('data-theme', theme); else root.removeAttribute('data-theme');
  }

  applyAutoTheme();
  setInterval(applyAutoTheme, 5 * 60 * 1000);
  document.addEventListener('visibilitychange', function () { if (!document.hidden) applyAutoTheme(); });
  window.addEventListener('pageshow', applyAutoTheme);
})();
