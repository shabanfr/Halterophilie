#!/usr/bin/env python3
"""Serveur local Queen of Nails (TV) : site + enregistrement du contenu + relais de télécommande (sans internet)."""
import http.server, json, base64, os, queue, threading, sys
ROOT = os.path.expanduser('~/qon')
PORT = int(os.environ.get('QON_PORT', '8080'))
subs = {'rc': [], 'st': []}
last_state = b'{}'
lock = threading.Lock()

def broadcast(kind, body):
    msg = json.dumps({'event': 'message', 'message': body.decode('utf-8', 'replace')})
    with lock:
        for q in list(subs[kind]):
            q.put(msg)

class H(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **k): super().__init__(*a, directory=ROOT, **k)
    def log_message(self, *a): pass
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store'); super().end_headers()
    def _ok(self, body=b'ok', ctype='text/plain'):
        self.send_response(200); self.send_header('Content-Type', ctype); self.send_header('Content-Length', str(len(body))); self.end_headers(); self.wfile.write(body)
    def do_GET(self):
        path = self.path.split('?')[0]
        if path == '/__ping': return self._ok()
        if path == '/__state': return self._ok(last_state, 'application/json')
        if path in ('/__rc/events', '/__state/events'):
            kind = 'rc' if path.startswith('/__rc') else 'st'
            q = queue.Queue()
            with lock: subs[kind].append(q)
            try:
                self.send_response(200); self.send_header('Content-Type', 'text/event-stream'); self.send_header('X-Accel-Buffering', 'no'); self.end_headers()
                self.wfile.write(b': ok\n\n'); self.wfile.flush()
                while True:
                    try: m = q.get(timeout=15); self.wfile.write(('data: %s\n\n' % m).encode())
                    except queue.Empty: self.wfile.write(b': ka\n\n')
                    self.wfile.flush()
            except Exception: pass
            finally:
                with lock:
                    if q in subs[kind]: subs[kind].remove(q)
            return
        return super().do_GET()
    def do_POST(self):
        global last_state
        n = int(self.headers.get('Content-Length', 0)); body = self.rfile.read(n)
        path = self.path.split('?')[0]
        if path == '/__rc': broadcast('rc', body); return self._ok()
        if path == '/__state': last_state = body; broadcast('st', body); return self._ok()
        if path == '/__save':
            try:
                o = json.loads(body); rel = os.path.normpath(o['path']).lstrip('/')
                okp = rel == 'data.json' or ('..' not in rel and ((rel.startswith('photos/') and rel.endswith('.jpg')) or (rel.startswith('music/') and rel.endswith(('.mp3', '.m4a')))))
                if not okp: return self.send_error(403)
                dst = os.path.join(ROOT, rel); os.makedirs(os.path.dirname(dst), exist_ok=True)
                open(dst, 'wb').write(base64.b64decode(o['b64'])); return self._ok()
            except Exception as e:
                return self.send_error(400, str(e))
        self.send_error(404)

if __name__ == '__main__':
    http.server.ThreadingHTTPServer(('0.0.0.0', PORT), H).serve_forever()
