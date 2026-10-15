import os
import unittest

os.environ.setdefault("ENV_JWT_ALG", "HS256")
os.environ.setdefault("ENV_JWT_SECRET", "test-secret")
os.environ.setdefault("ENV_DATABASE_URL", "postgresql+asyncpg://user:pass@localhost:5432/test")
os.environ.setdefault("ENV_CORS_ORIGINS", '["http://localhost:5173"]')
os.environ.setdefault("ENV_CORS_HEADERS", '["Content-Type", "Authorization"]')
os.environ.setdefault("GOOGLE_CLIENT_ID", "test-client-id")

from src.auth_user.service import google_avatar_url


class GoogleAvatarUrlTests(unittest.TestCase):
    def test_https_picture_is_kept(self):
        url = "https://lh3.googleusercontent.com/a/ACg8ocK=s96-c"
        self.assertEqual(google_avatar_url({"picture": url}), url)

    def test_missing_picture_is_none(self):
        self.assertIsNone(google_avatar_url({}))

    def test_non_https_or_non_string_is_rejected(self):
        for picture in ["http://lh3.googleusercontent.com/a/x", "javascript:alert(1)", "", None, 42]:
            with self.subTest(picture=picture):
                self.assertIsNone(google_avatar_url({"picture": picture}))

    def test_oversized_url_is_rejected(self):
        self.assertIsNone(google_avatar_url({"picture": "https://x.test/" + "a" * 2048}))


if __name__ == "__main__":
    unittest.main()
