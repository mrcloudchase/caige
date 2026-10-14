import json
import threading
import unittest
import urllib.error
import urllib.request

from caige_lab.audit import verify
from caige_lab.model import OfflineModel
from caige_lab.server import serve

from .helpers import close_apps, make_app, user


class Audit(unittest.TestCase):
    def setUp(self):
        self.app = make_app(OfflineModel())
        self.result = self.app.handle(user(self.app, "alice"), "How long does standard shipping take?")
        self.log = self.result.run_dir / "audit.jsonl"
        self.anchor = self.result.run_dir / "anchor.jsonl"

    def test_untouched_log_verifies(self):
        self.assertTrue(verify(self.log, self.anchor).ok)

    def test_edit_is_detected(self):
        lines = self.log.read_text().splitlines()
        entry = json.loads(lines[0])
        entry["data"]["text"] = "something else"
        lines[0] = json.dumps(entry)
        self.log.write_text("\n".join(lines) + "\n")
        self.assertFalse(verify(self.log).ok)

    def test_truncation_is_detected_only_with_anchor(self):
        lines = self.log.read_text().splitlines()
        self.log.write_text("\n".join(lines[:-1]) + "\n")
        self.assertTrue(verify(self.log).ok)  # a chain alone cannot see a missing tail
        self.assertFalse(verify(self.log, self.anchor).ok)


class Server(unittest.TestCase):
    def test_chat_endpoint(self):
        app = make_app(OfflineModel())
        server = serve(app, port=0)
        thread = threading.Thread(target=server.serve_forever, daemon=True)
        thread.start()
        url = f"http://127.0.0.1:{server.server_address[1]}/chat"
        try:
            req = urllib.request.Request(url, data=json.dumps({"message": "Is shipping free?"}).encode(),
                                         headers={"Authorization": "Bearer tok-alice", "Content-Type": "application/json"})
            body = json.loads(urllib.request.urlopen(req, timeout=5).read())
            self.assertEqual(body["status"], "ok")
            self.assertIn("harmful", body["outcomes"])
            with self.assertRaises(urllib.error.HTTPError) as err:
                urllib.request.urlopen(urllib.request.Request(url, data=b"{}"), timeout=5)
            self.assertEqual(err.exception.code, 401)
        finally:
            server.shutdown()
            server.server_close()


def tearDownModule():
    close_apps()


if __name__ == "__main__":
    unittest.main()
