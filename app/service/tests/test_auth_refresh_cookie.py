import json
import os
import unittest
import uuid
from unittest.mock import AsyncMock, MagicMock, patch

os.environ.setdefault("ENV_JWT_ALG", "HS256")
os.environ.setdefault("ENV_JWT_SECRET", "test-secret")
os.environ.setdefault("ENV_DATABASE_URL", "postgresql+asyncpg://user:pass@localhost:5432/test")
os.environ.setdefault("ENV_CORS_ORIGINS", '["http://localhost:5173"]')
os.environ.setdefault("ENV_CORS_HEADERS", '["Content-Type", "Authorization"]')
os.environ.setdefault("GOOGLE_CLIENT_ID", "test-client-id")

from src.auth_user import router
from src.auth_user.schemas import GoogleSignInRequest

USER = {"id": 7, "name": "Ana", "last_name": "Diaz", "email": "ana@example.com", "id_role": 1}
NEW_TOKEN = "n" * 64


def _set_cookie(response) -> str:
    return "; ".join(v.decode() for k, v in response.raw_headers if k == b"set-cookie")


class RefreshCookieTests(unittest.IsolatedAsyncioTestCase):
    def setUp(self):
        self.execute = AsyncMock()
        self.fetch_one = AsyncMock(return_value=USER)
        for target in (
            patch("src.auth_user.service.execute", self.execute),
            patch("src.auth_user.service.fetch_one", self.fetch_one),
            patch("src.auth_user.service.utils.generate_random_alphanum", return_value=NEW_TOKEN),
        ):
            target.start()
            self.addCleanup(target.stop)

    async def test_google_sign_in_sets_refresh_cookie_on_returned_response(self):
        userinfo = MagicMock(status_code=200)
        userinfo.json.return_value = {"sub": "g-1", "email": USER["email"], "name": "Ana Diaz"}
        with patch("src.auth_user.service.http_requests.get", return_value=userinfo):
            response = await router.google_sign_in_route(GoogleSignInRequest(access_token="google-token"))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(json.loads(response.body)["refresh_token"], NEW_TOKEN)
        self.assertIn(f"refreshToken={NEW_TOKEN}", _set_cookie(response))
        self.assertIn("HttpOnly", _set_cookie(response))

    async def test_refresh_sets_rotated_refresh_cookie_on_returned_response(self):
        db_token = {"uuid": uuid.uuid4(), "id_user": USER["id"], "refresh_token": "old-token"}
        response = await router.refresh_tokens(refresh_token=db_token)

        self.assertEqual(response.status_code, 200)
        self.assertIn("access_token", json.loads(response.body))
        self.assertIn(f"refreshToken={NEW_TOKEN}", _set_cookie(response))
        self.assertNotIn("old-token", _set_cookie(response))

    async def test_logout_expires_refresh_cookie_on_returned_response(self):
        db_token = {"uuid": uuid.uuid4(), "id_user": USER["id"], "refresh_token": "old-token"}
        response = await router.logout_user(refresh_token=db_token)

        self.assertEqual(response.status_code, 200)
        cookie = _set_cookie(response)
        self.assertIn('refreshToken=""', cookie)
        self.assertIn("Max-Age=0", cookie)
        self.execute.assert_awaited_once()


if __name__ == "__main__":
    unittest.main()
