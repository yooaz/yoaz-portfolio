"""Offline SEO contract for Yoaz's existing, approved sitemap content.

Run: python3 -m unittest discover -s tests -p 'test_sitemap_image_namespace.py' -v
No network, browser, deployment or external dependencies.
"""
from pathlib import Path
import unittest
import xml.etree.ElementTree as ET
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parents[1]
SITEMAP_NS = "http://www.sitemaps.org/schemas/sitemap/0.9"
IMAGE_NS = "http://www.google.com/schemas/sitemap-image/1.1"
BAD_IMAGE_NS = "http://www.google.com/schemas/sitemaps/image/1.1"
XHTML_NS = "http://www.w3.org/1999/xhtml"

EXPECTED_IMAGES = {
    "hero.jpg", "client-playstation-metro.jpg", "client-adidas-paris.png",
    "gallery-mandala.jpg", "gallery-cosmos.jpg", "gallery-jardin-surreal.jpg",
    "gallery-temple-solaire.jpg", "gallery-dieux-jumeaux.jpg",
}


def parse(name):
    return ET.parse(ROOT / name).getroot()


def image_urls(root):
    return [node.text for node in root.findall(f".//{{{IMAGE_NS}}}image/{{{IMAGE_NS}}}loc")]


class SitemapImageNamespaceTests(unittest.TestCase):
    def test_primary_sitemap_declares_valid_google_image_nodes(self):
        root = parse("sitemap.xml")
        self.assertEqual(root.tag, f"{{{SITEMAP_NS}}}urlset")
        self.assertEqual(len(root.findall(f".//{{{IMAGE_NS}}}image")), 8)

    def test_primary_sitemap_preserves_eight_approved_image_urls(self):
        urls = image_urls(parse("sitemap.xml"))
        self.assertEqual({urlsplit(url).path.rsplit("/", 1)[-1] for url in urls}, EXPECTED_IMAGES)
        self.assertEqual(len(urls), len(set(urls)))

    def test_no_obsolete_incorrect_image_namespace(self):
        root = parse("sitemap.xml")
        self.assertEqual(len(root.findall(f".//{{{BAD_IMAGE_NS}}}image")), 0)

    def test_existing_home_and_language_alternates_are_preserved(self):
        root = parse("sitemap.xml")
        home = root.find(f"{{{SITEMAP_NS}}}url")
        self.assertEqual(home.findtext(f"{{{SITEMAP_NS}}}loc"), "https://yoaz.fr/")
        alternates = {x.get("hreflang"): x.get("href") for x in home.findall(f"{{{XHTML_NS}}}link")}
        self.assertEqual(alternates, {
            "fr": "https://yoaz.fr/", "en": "https://yoaz.fr/?lang=en",
            "nl": "https://yoaz.fr/?lang=nl", "es": "https://yoaz.fr/?lang=es",
            "x-default": "https://yoaz.fr/",
        })
        self.assertEqual(len(root.findall(f"{{{SITEMAP_NS}}}url")), 11)

    def test_primary_images_use_local_https_asset_urls(self):
        for url in image_urls(parse("sitemap.xml")):
            parsed = urlsplit(url)
            self.assertEqual((parsed.scheme, parsed.netloc), ("https", "yoaz.fr"))
            self.assertTrue(parsed.path.startswith("/images/"))
            self.assertFalse(parsed.query or parsed.fragment)

    def test_secondary_image_sitemap_is_already_valid(self):
        root = parse("image-sitemap.xml")
        self.assertEqual(root.tag, f"{{{SITEMAP_NS}}}urlset")
        self.assertEqual(len(image_urls(root)), 4)


if __name__ == "__main__":
    unittest.main()
