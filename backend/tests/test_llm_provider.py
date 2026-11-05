import os
import pytest
from unittest.mock import MagicMock, patch

from app.integrations.llm.base import (
    LLMError,
    LLMAuthError,
    LLMUnavailableError,
    LLMResponse,
)
from app.integrations.llm.gemini_provider import GeminiProvider
from app.core.config import settings


def test_gemini_provider_unconfigured():
    provider = GeminiProvider(api_key="")
    assert provider.check_health() is False
    with pytest.raises(LLMAuthError) as exc_info:
        provider.generate_text("Hello")
    assert "Gemini API key is not configured" in str(exc_info.value)


def test_gemini_provider_repr_masks_key():
    fake_secret = "AIzaSySecretFakeKey98765"
    provider = GeminiProvider(api_key=fake_secret, default_model="gemini-3.5-flash")
    repr_str = repr(provider)
    assert fake_secret not in repr_str
    assert "gemini-3.5-flash" in repr_str
    assert "configured=True" in repr_str


def test_gemini_provider_mocked_success():
    provider = GeminiProvider(api_key="mock-key")
    mock_client = MagicMock()
    mock_response = MagicMock()
    mock_response.text = "MOCKED_RESPONSE"
    mock_response.candidates = [MagicMock(finish_reason="STOP")]
    mock_response.usage_metadata = MagicMock(prompt_token_count=10, candidates_token_count=5)
    mock_client.models.generate_content.return_value = mock_response

    provider._client = mock_client

    response = provider.generate_text("Prompt")
    assert response.content == "MOCKED_RESPONSE"
    assert response.model == settings.GEMINI_MODEL
    assert response.prompt_tokens == 10
    assert response.completion_tokens == 5


def test_gemini_provider_mocked_retry_on_server_error():
    from google.genai.errors import ServerError

    provider = GeminiProvider(api_key="mock-key", max_retries=2)
    mock_client = MagicMock()

    # Attempt 1: 503, Attempt 2: Success
    mock_success = MagicMock()
    mock_success.text = "RECOVERED_RESPONSE"
    mock_success.candidates = []
    mock_success.usage_metadata = None

    mock_client.models.generate_content.side_effect = [
        ServerError(503, {"error": {"code": 503, "message": "High demand"}}, MagicMock()),
        mock_success,
    ]

    provider._client = mock_client

    with patch("time.sleep"):  # Avoid real sleep in unit tests
        response = provider.generate_text("Prompt")

    assert response.content == "RECOVERED_RESPONSE"
    assert mock_client.models.generate_content.call_count == 2


@pytest.mark.live_llm
@pytest.mark.skipif(
    not os.environ.get("GEMINI_API_KEY"),
    reason="GEMINI_API_KEY environment variable not configured",
)
def test_gemini_provider_live_connectivity():
    provider = GeminiProvider()
    response = provider.generate_text("Reply with exactly: RELAY_CONNECTED")
    assert "RELAY_CONNECTED" in response.content
    assert response.model == settings.GEMINI_MODEL
