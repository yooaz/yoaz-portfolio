"""Offline regression for the Netlify backup file rule (no deploy or network)."""
from pathlib import Path
import tomllib
import unittest

CONFIG = Path(__file__).resolve().parents[1] / 'netlify.toml'


def read_config():
    with CONFIG.open('rb') as handle:
        return tomllib.load(handle)


class PortfolioBackupRouteTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.config = read_config()
        cls.redirects = cls.config['redirects']

    def test_site_still_publishes_static_root(self):
        self.assertEqual(self.config['build']['publish'], '.')

    def test_single_exact_historical_backup_rule(self):
        matches = [r for r in self.redirects if r['from'] == '/index.html.v3backup']
        self.assertEqual(len(matches), 1)

    def test_backup_rule_replies_404(self):
        r = next(r for r in self.redirects if r['from'] == '/index.html.v3backup')
        self.assertEqual((r['to'], r['status']), ('/404.html', 404))

    def test_force_required_when_file_exists(self):
        r = next(r for r in self.redirects if r['from'] == '/index.html.v3backup')
        self.assertIs(r.get('force'), True)

    def test_backup_route_precedes_fallback(self):
        i = next(i for i, r in enumerate(self.redirects) if r['from'] == '/index.html.v3backup')
        default = next(i for i, r in enumerate(self.redirects) if r['from'] == '/*')
        self.assertLess(i, default)

    def test_global_fallback_still_404(self):
        r = [r for r in self.redirects if r['from'] == '/*']
        self.assertEqual(len(r), 1)
        self.assertEqual((r[0]['to'], r[0]['status']), ('/404.html', 404))

    def test_www_https_canonical_redirect_unmodified(self):
        r = self.redirects[0]
        self.assertEqual((r['from'], r['to'], r['status'], r['force']),
                         ('https://www.yoaz.fr/*', 'https://yoaz.fr/:splat', 301, True))

    def test_http_https_canonical_redirect_unmodified(self):
        r = self.redirects[1]
        self.assertEqual((r['from'], r['to'], r['status'], r['force']),
                         ('http://yoaz.fr/*', 'https://yoaz.fr/:splat', 301, True))

    def test_security_headers_preserved(self):
        entries = [h for h in self.config['headers'] if h['for'] == '/*']
        self.assertEqual(len(entries), 1)
        self.assertIn('Content-Security-Policy', entries[0]['values'])
        self.assertIn('X-Frame-Options', entries[0]['values'])

    def test_default_route_not_forced(self):
        r = next(r for r in self.redirects if r['from'] == '/*')
        self.assertIsNot(r.get('force', False), True)

    def test_no_external_redirect_for_backup(self):
        r = next(r for r in self.redirects if r['from'] == '/index.html.v3backup')
        self.assertTrue(r['to'].startswith('/'))
        self.assertNotIn('http', r['to'])

    def test_backup_rule_only_exact_path(self):
        r = next(r for r in self.redirects if r['from'] == '/index.html.v3backup')
        self.assertNotIn('*', r['from'])


if __name__ == '__main__':
    unittest.main()
