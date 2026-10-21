/*
 * peramban.js — pengendali Chrome/Edge tanpa kepala untuk uji antarmuka (tanpa dependensi).
 *
 * Membuka sebuah URL di Chrome atau Edge yang sudah terpasang, lalu mengendalikannya lewat
 * protokol DevTools memakai WebSocket bawaan Node (perlu Node.js 22 atau lebih baru).
 * Bila peramban atau WebSocket tidak ada, `buka` mengembalikan null dan uji dilewati.
 *
 *   var p = await Peramban.buka('file:///.../index.html');
 *   await p.evaluasi('1 + 1');            // -> 2 (nilai dikembalikan sebagai JSON)
 *   await p.layar('hasil.png');           // tangkapan layar
 *   await p.tutup();
 */
'use strict';

var fs = require('fs');
var os = require('os');
var path = require('path');
var http = require('http');
var cp = require('child_process');

function cariPeramban() {
  var kandidat = [];
  if (process.env.CHROME_PATH) kandidat.push(process.env.CHROME_PATH);
  if (process.platform === 'win32') {
    var pf = process.env['ProgramFiles'] || 'C:\\Program Files', pf86 = process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)', lokal = process.env.LOCALAPPDATA || '';
    kandidat.push(pf + '\\Google\\Chrome\\Application\\chrome.exe', pf86 + '\\Google\\Chrome\\Application\\chrome.exe',
      lokal + '\\Google\\Chrome\\Application\\chrome.exe', pf86 + '\\Microsoft\\Edge\\Application\\msedge.exe', pf + '\\Microsoft\\Edge\\Application\\msedge.exe');
  } else if (process.platform === 'darwin') {
    kandidat.push('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge');
  } else {
    kandidat.push('/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/microsoft-edge');
  }
  for (var i = 0; i < kandidat.length; i++) if (kandidat[i] && fs.existsSync(kandidat[i])) return kandidat[i];
  return null;
}

function ambilJson(port, jalur) {
  return new Promise(function (selesai, gagal) {
    http.get({ host: '127.0.0.1', port: port, path: jalur }, function (res) {
      var s = '';
      res.on('data', function (d) { s += d; });
      res.on('end', function () { try { selesai(JSON.parse(s)); } catch (e) { gagal(e); } });
    }).on('error', gagal);
  });
}

function tunggu(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

async function buka(url, opsi) {
  opsi = opsi || {};
  if (typeof WebSocket === 'undefined') return null;
  var exe = cariPeramban();
  if (!exe) return null;
  var dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ojk-peramban-'));
  var proc = cp.spawn(exe, [
    '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check', '--disable-extensions',
    '--remote-debugging-port=0', '--user-data-dir=' + dir, '--window-size=' + (opsi.lebar || 1500) + ',' + (opsi.tinggi || 950), url
  ], { stdio: 'ignore' });

  function bersihkan() {
    try {
      if (process.platform === 'win32') cp.spawnSync('taskkill', ['/pid', String(proc.pid), '/T', '/F'], { stdio: 'ignore' });
      else proc.kill('SIGKILL');
    } catch (e) { /* abaikan */ }
    try { fs.rmSync(dir, { recursive: true, force: true }); } catch (e) { /* abaikan */ }
  }

  try {
    var berkasPort = path.join(dir, 'DevToolsActivePort'), port = null;
    for (var i = 0; i < 100 && !port; i++) {
      await tunggu(100);
      if (fs.existsSync(berkasPort)) { var isi = fs.readFileSync(berkasPort, 'utf8').split(/\r?\n/); if (isi[0]) port = Number(isi[0]); }
    }
    if (!port) throw new Error('peramban tidak menyala');
    var halaman = null;
    for (i = 0; i < 50 && !halaman; i++) {
      var daftar = await ambilJson(port, '/json/list');
      halaman = daftar.filter(function (t) { return t.type === 'page' && t.webSocketDebuggerUrl; })[0];
      if (!halaman) await tunggu(100);
    }
    if (!halaman) throw new Error('halaman peramban tidak ditemukan');

    var ws = new WebSocket(halaman.webSocketDebuggerUrl);
    await new Promise(function (ok, gagal) { ws.onopen = ok; ws.onerror = function () { gagal(new Error('WebSocket gagal')); }; });
    var nomor = 0, menunggu = {}, penanda = {}, konsol = [];
    ws.onmessage = function (e) {
      var m = JSON.parse(e.data);
      if (m.id && menunggu[m.id]) {
        var w = menunggu[m.id]; delete menunggu[m.id];
        if (m.error) w.gagal(new Error(m.error.message)); else w.selesai(m.result);
        return;
      }
      if (m.method === 'Runtime.consoleAPICalled' && (m.params.type === 'error' || m.params.type === 'warning')) {
        konsol.push(m.params.type + ': ' + m.params.args.map(function (a) { return a.value !== undefined ? a.value : (a.description || a.type); }).join(' '));
      } else if (m.method === 'Runtime.exceptionThrown') {
        var d = m.params.exceptionDetails;
        konsol.push('exception: ' + (d.exception && d.exception.description ? d.exception.description : d.text));
      } else if (m.method === 'Log.entryAdded' && (m.params.entry.level === 'error')) {
        konsol.push('log: ' + m.params.entry.text + ' ' + (m.params.entry.url || ''));
      }
      (penanda[m.method] || []).slice().forEach(function (f) { f(m.params); });
    };
    function kirim(method, params) {
      return new Promise(function (selesai, gagal) {
        var id = ++nomor;
        menunggu[id] = { selesai: selesai, gagal: gagal };
        ws.send(JSON.stringify({ id: id, method: method, params: params || {} }));
      });
    }
    function sekali(method) { return new Promise(function (selesai) { (penanda[method] = penanda[method] || []).push(function f(p) { penanda[method] = penanda[method].filter(function (x) { return x !== f; }); selesai(p); }); }); }
    await kirim('Runtime.enable'); await kirim('Log.enable'); await kirim('Page.enable');

    var obj = {
      konsol: konsol,
      kirim: kirim,
      /** Jalankan ekspresi (boleh async) dan kembalikan nilainya. */
      evaluasi: async function (ekspresi) {
        var r = await kirim('Runtime.evaluate', { expression: ekspresi, awaitPromise: true, returnByValue: true, userGesture: true });
        if (r.exceptionDetails) throw new Error((r.exceptionDetails.exception && r.exceptionDetails.exception.description) || r.exceptionDetails.text);
        return r.result.value;
      },
      layar: async function (berkas, klip) {
        var p = { format: 'png' };
        if (klip) p.clip = Object.assign({ scale: 1 }, klip);
        var r = await kirim('Page.captureScreenshot', p);
        fs.writeFileSync(berkas, Buffer.from(r.data, 'base64'));
      },
      /** Seret pointer dari (x1,y1) ke (x2,y2) lewat beberapa langkah. */
      seret: async function (x1, y1, x2, y2, langkah) {
        langkah = langkah || 8;
        await kirim('Input.dispatchMouseEvent', { type: 'mouseMoved', x: x1, y: y1 });
        await kirim('Input.dispatchMouseEvent', { type: 'mousePressed', x: x1, y: y1, button: 'left', buttons: 1, clickCount: 1 });
        for (var s = 1; s <= langkah; s++) {
          await kirim('Input.dispatchMouseEvent', { type: 'mouseMoved', x: x1 + (x2 - x1) * s / langkah, y: y1 + (y2 - y1) * s / langkah, button: 'left', buttons: 1 });
        }
        await kirim('Input.dispatchMouseEvent', { type: 'mouseReleased', x: x2, y: y2, button: 'left', buttons: 0, clickCount: 1 });
      },
      klik: async function (x, y) {
        await kirim('Input.dispatchMouseEvent', { type: 'mouseMoved', x: x, y: y });
        await kirim('Input.dispatchMouseEvent', { type: 'mousePressed', x: x, y: y, button: 'left', buttons: 1, clickCount: 1 });
        await kirim('Input.dispatchMouseEvent', { type: 'mouseReleased', x: x, y: y, button: 'left', buttons: 0, clickCount: 1 });
      },
      ukuran: function (lebar, tinggi) {
        return kirim('Emulation.setDeviceMetricsOverride', { width: lebar, height: tinggi, deviceScaleFactor: 1, mobile: false });
      },
      tunggu: tunggu,
      muatSelesai: function () { return sekali('Page.loadEventFired'); },
      tutup: async function () {
        try { ws.close(); } catch (e) { /* abaikan */ }
        bersihkan();
        // Chrome baru melepas berkas profilnya beberapa ratus milidetik setelah dimatikan (Windows: EPERM/EBUSY),
        // jadi hapusan pertama di bersihkan() sering gagal dan folder sementara tertinggal: ulangi sampai hilang
        for (var i = 0; i < 25 && fs.existsSync(dir); i++) {
          await tunggu(200);
          try { fs.rmSync(dir, { recursive: true, force: true }); } catch (e) { /* masih terkunci */ }
        }
      }
    };
    // beri waktu halaman memuat skrip (url diberikan pada baris perintah). Tab awal bisa masih about:blank
    // (yang sudah "complete") selagi alamat http:// dimuat, jadi tunggu sampai alamat sebenarnya terbuka.
    // Selama pindah halaman, evaluasi boleh gagal sebentar ("Execution context was destroyed"): ulangi.
    for (i = 0; i < 150 && !/^about:/.test(url); i++) {
      var terbuka = false;
      try { terbuka = await obj.evaluasi('location.href !== "about:blank" && document.readyState === "complete"'); } catch (e) { terbuka = false; }
      if (terbuka) break;
      await tunggu(100);
    }
    await obj.evaluasi('new Promise(function (r) { if (document.readyState === "complete") r(true); else window.addEventListener("load", function () { r(true); }); })');
    return obj;
  } catch (e) {
    bersihkan();
    throw e;
  }
}

module.exports = { buka: buka, cariPeramban: cariPeramban };
