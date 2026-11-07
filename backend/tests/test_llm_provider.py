import os
import json
import pytest
from unittest.mock import MagicMock, patch

from app.integrations.llm.base import (
    LLMError,
    LLMAuthError,
    LLMQuotaError,
    LLMUnavailableError,
    LLMTimeoutError,
    LLMResponseValidationError,
    LLMResponseTruncatedError,
    LLMResponse,
    LLMStructuredResponse,
)
from app.integrations.llm.gemini_provider import GeminiProvider, sanitize_gemini_schema
from app.schemas.extraction import DocumentExtractionPayload
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


def test_gemini_provider_generate_structured_success():
    """Verify structured output parsing and validation against Pydantic schema."""
    provider = GeminiProvider(api_key="mock-key")
    mock_client = MagicMock()

    sample_json = json.dumps({
        "facts": [
            {
                "category": "decision",
                "statement": "Titan architecture approved.",
                "deadline_text": None,
                "severity": None,
                "confidence": 0.95,
                "citations": [
                    {
                        "segment_id": "seg-1",
                        "quote": "Titan architecture was formally approved.",
                        "source_context": None,
                    }
                ],
                "is_inference": False,
            }
        ],
        "entities": [
            {
                "name": "Project Titan",
                "category": "project",
                "description": None,
                "mentions": [],
            }
        ],
        "relationships": [],
    })

    mock_response = MagicMock()
    mock_response.text = sample_json
    mock_response.candidates = [MagicMock(finish_reason="STOP")]
    mock_response.usage_metadata = MagicMock(prompt_token_count=120, candidates_token_count=45)
    mock_client.models.generate_content.return_value = mock_response

    provider._client = mock_client

    res: LLMStructuredResponse[DocumentExtractionPayload] = provider.generate_structured(
        prompt="Analyze segments",
        response_schema=DocumentExtractionPayload,
    )

    assert isinstance(res.data, DocumentExtractionPayload)
    assert len(res.data.facts) == 1
    assert res.data.facts[0].statement == "Titan architecture approved."
    assert len(res.data.entities) == 1
    assert res.data.entities[0].name == "Project Titan"
    assert res.prompt_tokens == 120
    assert res.completion_tokens == 45


def test_gemini_provider_generate_structured_malformed_json():
    """Verify malformed JSON raises LLMResponseValidationError without indefinite retries."""
    provider = GeminiProvider(api_key="mock-key")
    mock_client = MagicMock()

    mock_response = MagicMock()
    mock_response.text = "NOT_JSON {unclosed_bracket"
    mock_response.candidates = [MagicMock(finish_reason="STOP")]
    mock_response.usage_metadata = None
    mock_client.models.generate_content.return_value = mock_response

    provider._client = mock_client

    with pytest.raises(LLMResponseValidationError) as exc_info:
        provider.generate_structured("Prompt", DocumentExtractionPayload)

    assert "Failed to validate" in str(exc_info.value)
    # Confirm it does not retry deterministic schema errors
    assert mock_client.models.generate_content.call_count == 1


def test_gemini_provider_generate_structured_schema_mismatch():
    """Verify schema violations raise LLMResponseValidationError."""
    provider = GeminiProvider(api_key="mock-key")
    mock_client = MagicMock()

    # JSON is valid syntax, but category is not a valid FactCategory
    invalid_category_json = json.dumps({
        "facts": [
            {
                "category": "not_a_category",
                "statement": "Statement",
            }
        ],
        "entities": [],
        "relationships": [],
    })

    mock_response = MagicMock()
    mock_response.text = invalid_category_json
    mock_response.candidates = [MagicMock(finish_reason="STOP")]
    mock_response.usage_metadata = None
    mock_client.models.generate_content.return_value = mock_response

    provider._client = mock_client

    with pytest.raises(LLMResponseValidationError) as exc_info:
        provider.generate_structured("Prompt", DocumentExtractionPayload)

    assert "Failed to validate" in str(exc_info.value)


def test_gemini_provider_generate_structured_empty_response():
    """Verify empty response raises LLMResponseValidationError."""
    provider = GeminiProvider(api_key="mock-key")
    mock_client = MagicMock()

    mock_response = MagicMock()
    mock_response.text = ""
    mock_response.candidates = []
    mock_client.models.generate_content.return_value = mock_response

    provider._client = mock_client

    with pytest.raises(LLMResponseValidationError) as exc_info:
        provider.generate_structured("Prompt", DocumentExtractionPayload)

    assert "empty response" in str(exc_info.value)


def test_gemini_provider_generate_structured_safety_blocked():
    """Verify safety block raises LLMError."""
    provider = GeminiProvider(api_key="mock-key")
    mock_client = MagicMock()

    mock_response = MagicMock()
    mock_response.text = None
    mock_response.candidates = [MagicMock(finish_reason="SAFETY")]
    mock_client.models.generate_content.return_value = mock_response

    provider._client = mock_client

    with pytest.raises(LLMError) as exc_info:
        provider.generate_structured("Prompt", DocumentExtractionPayload)

    assert "safety filters" in str(exc_info.value)


def test_gemini_provider_generate_structured_sdk_enum_safety_blocked():
    """Verify safety block using actual SDK types.FinishReason enum object raises LLMError."""
    from google.genai import types

    provider = GeminiProvider(api_key="mock-key")
    mock_client = MagicMock()

    mock_response = MagicMock()
    mock_response.text = None
    mock_candidate = MagicMock()
    mock_candidate.finish_reason = types.FinishReason.SAFETY
    mock_response.candidates = [mock_candidate]
    mock_client.models.generate_content.return_value = mock_response

    provider._client = mock_client

    with pytest.raises(LLMError) as exc_info:
        provider.generate_structured("Prompt", DocumentExtractionPayload)

    assert "safety filters" in str(exc_info.value)


def test_gemini_provider_generate_structured_truncated_response():
    """Verify output truncation (MAX_TOKENS) raises LLMResponseTruncatedError."""
    provider = GeminiProvider(api_key="mock-key")
    mock_client = MagicMock()

    mock_response = MagicMock()
    mock_response.text = '{"facts": [{"category": "decision", "statement": "Incompl'
    mock_response.candidates = [MagicMock(finish_reason="MAX_TOKENS")]
    mock_client.models.generate_content.return_value = mock_response

    provider._client = mock_client

    with pytest.raises(LLMResponseTruncatedError) as exc_info:
        provider.generate_structured("Prompt", DocumentExtractionPayload)

    assert "truncated" in str(exc_info.value)


def test_gemini_provider_generate_structured_timeout():
    """Verify provider timeout raises LLMTimeoutError."""
    provider = GeminiProvider(api_key="mock-key", timeout_seconds=1, max_retries=1)
    mock_client = MagicMock()
    mock_client.models.generate_content.side_effect = TimeoutError("Request timed out")

    provider._client = mock_client

    with pytest.raises(LLMTimeoutError):
        provider.generate_structured("Prompt", DocumentExtractionPayload)


def test_gemini_provider_generate_structured_retry_on_server_error():
    """Verify retry on 503 ServerError recovers when subsequent call succeeds."""
    from google.genai.errors import ServerError

    provider = GeminiProvider(api_key="mock-key", max_retries=2)
    mock_client = MagicMock()

    valid_json = json.dumps({"facts": [], "entities": [], "relationships": []})
    mock_success = MagicMock()
    mock_success.text = valid_json
    mock_success.candidates = [MagicMock(finish_reason="STOP")]
    mock_success.usage_metadata = None

    mock_client.models.generate_content.side_effect = [
        ServerError(503, {"error": {"code": 503, "message": "Service unavailable"}}, MagicMock()),
        mock_success,
    ]

    provider._client = mock_client

    with patch("time.sleep"):
        res = provider.generate_structured("Prompt", DocumentExtractionPayload)

    assert isinstance(res.data, DocumentExtractionPayload)
    assert mock_client.models.generate_content.call_count == 2


def test_sanitize_gemini_schema_strips_array_length_constraints():
    """
    Regression test: verify sanitize_gemini_schema removes max_items, maxItems, min_items,
    and minItems recursively without mutating other properties.
    """
    input_schema = {
        "type": "object",
        "properties": {
            "facts": {
                "type": "array",
                "max_items": 500,
                "maxItems": 500,
                "min_items": 1,
                "items": {
                    "type": "object",
                    "properties": {
                        "statement": {"type": "string", "maxLength": 2000},
                        "citations": {
                            "type": "array",
                            "max_items": 50,
                            "items": {"type": "string"},
                        },
                    },
                },
            }
        },
    }

    sanitized = sanitize_gemini_schema(input_schema)
    sanitized_str = str(sanitized)
    assert "max_items" not in sanitized_str
    assert "maxItems" not in sanitized_str
    assert "min_items" not in sanitized_str
    assert "minItems" not in sanitized_str
    assert sanitized["properties"]["facts"]["items"]["properties"]["statement"]["maxLength"] == 2000


def test_gemini_client_error_sanitization_and_masking():
    """
    Regression test: verify ClientError 400 preserves sanitized failure reason while masking API keys.
    """
    from google.genai.errors import ClientError

    secret_key = "AIzaSySuperSecretKey123"
    provider = GeminiProvider(api_key=secret_key, max_retries=1)
    mock_client = MagicMock()

    mock_client.models.generate_content.side_effect = ClientError(
        400,
        {"error": {"code": 400, "message": f"Request contains an invalid argument secret token {secret_key}"}},
        MagicMock(),
    )
    provider._client = mock_client

    with pytest.raises(LLMError) as exc_info:
        provider.generate_text("test")

    err_msg = str(exc_info.value)
    assert secret_key not in err_msg
    assert "[REDACTED]" in err_msg
    assert "status 400" in err_msg


@pytest.mark.live_llm
@pytest.mark.skipif(
    not os.environ.get("GEMINI_API_KEY"),
    reason="GEMINI_API_KEY environment variable not configured",
)
def test_gemini_provider_live_connectivity():
    provider = GeminiProvider()
    try:
        response = provider.generate_text("Reply with exactly: RELAY_CONNECTED")
        assert "RELAY_CONNECTED" in response.content
        assert response.model == settings.GEMINI_MODEL
    except LLMQuotaError as exc:
        pytest.skip(f"Live Gemini API quota exceeded: {exc}")


@pytest.mark.live_llm
@pytest.mark.skipif(
    not os.environ.get("GEMINI_API_KEY"),
    reason="GEMINI_API_KEY environment variable not configured",
)
def test_gemini_provider_live_structured_generation():
    """Live smoke test validating structured JSON generation against DocumentExtractionPayload."""
    provider = GeminiProvider()
    prompt = (
        "Document: Executive Memo\n"
        "Segment 1: Dr. Aris Thorne decided that Project Titan will transfer to Sarah Chen on December 1, 2026.\n"
        "Extract the facts, entities, and relationships according to the requested schema."
    )
    try:
        res = provider.generate_structured(
            prompt=prompt,
            response_schema=DocumentExtractionPayload,
        )
        assert isinstance(res.data, DocumentExtractionPayload)
        assert len(res.data.facts) > 0 or len(res.data.entities) > 0
        assert res.prompt_tokens is not None
        assert res.completion_tokens is not None
    except LLMQuotaError as exc:
        pytest.skip(f"Live Gemini API quota exceeded: {exc}")
