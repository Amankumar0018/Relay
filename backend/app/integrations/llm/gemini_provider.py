import os
import time
import logging
from typing import Optional, Dict, Any, TypeVar, Type
from pydantic import BaseModel

from app.core.config import settings
from app.integrations.llm.base import (
    BaseLLMProvider,
    LLMResponse,
    LLMStructuredResponse,
    LLMError,
    LLMAuthError,
    LLMQuotaError,
    LLMUnavailableError,
    LLMTimeoutError,
    LLMResponseValidationError,
    LLMResponseTruncatedError,
)

T = TypeVar("T", bound=BaseModel)

logger = logging.getLogger(__name__)


class GeminiProvider(BaseLLMProvider):
    """
    Production-grade Gemini LLM provider using the official google-genai SDK.
    Features:
    - Secure environment credential injection (never logs or exposes keys).
    - Configurable model selection with Flash-class defaults.
    - Bounded retries on transient provider/network errors.
    - Strict timeout controls.
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        default_model: Optional[str] = None,
        timeout_seconds: Optional[int] = None,
        max_retries: Optional[int] = None,
    ):
        if api_key is not None:
            self._api_key = api_key
        else:
            self._api_key = settings.GEMINI_API_KEY or os.environ.get("GEMINI_API_KEY")
        self.default_model = default_model or settings.GEMINI_MODEL
        self.timeout_seconds = timeout_seconds or settings.GEMINI_TIMEOUT_SECONDS
        self.max_retries = max_retries or settings.GEMINI_MAX_RETRIES
        self._client = None

    def _get_client(self):
        """Initializes or returns cached Google GenAI client."""
        if not self._api_key:
            raise LLMAuthError(
                "Gemini API key is not configured. Please supply GEMINI_API_KEY via backend/.env."
            )

        if self._client is None:
            try:
                from google import genai
                from google.genai import types

                self._client = genai.Client(
                    api_key=self._api_key,
                    http_options=types.HttpOptions(timeout=self.timeout_seconds * 1000),
                )
            except ImportError as exc:
                raise LLMError(
                    "The google-genai package is not installed in the environment."
                ) from exc
            except Exception as exc:
                raise LLMError(f"Failed to initialize Gemini client: {exc}") from exc

        return self._client

    def generate_text(
        self,
        prompt: str,
        system_instruction: Optional[str] = None,
        temperature: float = 0.0,
        max_output_tokens: Optional[int] = None,
        thinking_budget: Optional[int] = 0,
        model: Optional[str] = None,
    ) -> LLMResponse:
        """
        Executes a prompt completion request against the Gemini API with bounded retries.
        """
        client = self._get_client()
        target_model = model or self.default_model

        from google.genai import types
        from google.genai.errors import ClientError, ServerError, APIError

        # Build generation configuration.
        # Note: thinking_budget controls reasoning token allocation on models that support thinking;
        # setting it to 0 reduces latency by bypassing extended reasoning, but does not guarantee determinism.
        config_kwargs: Dict[str, Any] = {
            "temperature": temperature,
        }
        if max_output_tokens is not None:
            config_kwargs["max_output_tokens"] = max_output_tokens
        if system_instruction is not None:
            config_kwargs["system_instruction"] = system_instruction
        if thinking_budget is not None:
            config_kwargs["thinking_config"] = types.ThinkingConfig(thinking_budget=thinking_budget)

        config = types.GenerateContentConfig(**config_kwargs)

        last_exception = None

        for attempt in range(self.max_retries):
            try:
                response = client.models.generate_content(
                    model=target_model,
                    contents=prompt,
                    config=config,
                )

                content_text = ""
                if response.text:
                    content_text = response.text.strip()
                elif response.candidates and response.candidates[0].content:
                    parts = response.candidates[0].content.parts or []
                    content_text = "".join(getattr(p, "text", "") for p in parts).strip()

                finish_reason = None
                if response.candidates:
                    raw_fr = getattr(response.candidates[0], "finish_reason", None)
                    if raw_fr is not None:
                        finish_reason = getattr(raw_fr, "name", str(raw_fr)).split(".")[-1].upper()
                    if finish_reason in (
                        "SAFETY",
                        "BLOCKLIST",
                        "PROHIBITED_CONTENT",
                        "SPII",
                        "IMAGE_SAFETY",
                        "IMAGE_PROHIBITED_CONTENT",
                    ):
                        raise LLMError("Gemini response was blocked by safety filters.")

                prompt_tokens = None
                completion_tokens = None
                if hasattr(response, "usage_metadata") and response.usage_metadata:
                    prompt_tokens = getattr(response.usage_metadata, "prompt_token_count", None)
                    completion_tokens = getattr(response.usage_metadata, "candidates_token_count", None)

                return LLMResponse(
                    content=content_text,
                    model=target_model,
                    finish_reason=finish_reason,
                    prompt_tokens=prompt_tokens,
                    completion_tokens=completion_tokens,
                )

            except ClientError as c_err:
                status_code = getattr(c_err, "code", None)
                err_msg = str(c_err)

                if status_code in (400, 401, 403) and ("key" in err_msg.lower() or "auth" in err_msg.lower()):
                    raise LLMAuthError("Gemini authentication failed: Invalid or unauthorized API key.") from None
                elif status_code == 404:
                    raise LLMError(f"Gemini model '{target_model}' not found or unsupported.") from None
                elif status_code == 429:
                    raise LLMQuotaError("Gemini quota or rate limit exceeded. Please check project quota.") from None
                else:
                    raise LLMError(f"Gemini client request failed (status {status_code}).") from None

            except ServerError as s_err:
                status_code = getattr(s_err, "code", None)
                last_exception = LLMUnavailableError(
                    f"Gemini service temporarily unavailable (status {status_code}): high demand. Attempt {attempt + 1}/{self.max_retries}."
                )
                logger.warning(
                    "Gemini transient 503 error on model '%s'. Retrying attempt %d/%d...",
                    target_model,
                    attempt + 1,
                    self.max_retries,
                )
                if attempt < self.max_retries - 1:
                    time.sleep(1.0 * (2 ** attempt))
                    continue
                raise last_exception from None

            except (TimeoutError, Exception) as exc:
                if isinstance(exc, TimeoutError) or "timeout" in str(exc).lower():
                    last_exception = LLMTimeoutError(
                        f"Gemini request timed out after {self.timeout_seconds} seconds."
                    )
                else:
                    last_exception = LLMError(f"Unexpected Gemini provider error: {type(exc).__name__}")

                if attempt < self.max_retries - 1:
                    time.sleep(1.0 * (2 ** attempt))
                    continue
                raise last_exception from None

        if last_exception:
            raise last_exception
        raise LLMError("Exhausted retries without response.")

    def generate_structured(
        self,
        prompt: str,
        response_schema: Type[T],
        system_instruction: Optional[str] = None,
        temperature: float = 0.0,
        max_output_tokens: Optional[int] = None,
        thinking_budget: Optional[int] = 0,
        model: Optional[str] = None,
    ) -> LLMStructuredResponse[T]:
        """
        Executes a prompt completion request enforcing structured JSON adhering to response_schema.
        Validates the output using Pydantic v2.
        """
        client = self._get_client()
        target_model = model or self.default_model

        from google.genai import types
        from google.genai.errors import ClientError, ServerError, APIError

        config_kwargs: Dict[str, Any] = {
            "temperature": temperature,
            "response_mime_type": "application/json",
            "response_schema": response_schema,
        }
        if max_output_tokens is not None:
            config_kwargs["max_output_tokens"] = max_output_tokens
        if system_instruction is not None:
            config_kwargs["system_instruction"] = system_instruction
        if thinking_budget is not None:
            config_kwargs["thinking_config"] = types.ThinkingConfig(thinking_budget=thinking_budget)

        config = types.GenerateContentConfig(**config_kwargs)

        last_exception = None

        for attempt in range(self.max_retries):
            try:
                response = client.models.generate_content(
                    model=target_model,
                    contents=prompt,
                    config=config,
                )

                finish_reason = None
                if response.candidates:
                    raw_fr = getattr(response.candidates[0], "finish_reason", None)
                    if raw_fr is not None:
                        finish_reason = getattr(raw_fr, "name", str(raw_fr)).split(".")[-1].upper()
                    if finish_reason in (
                        "SAFETY",
                        "BLOCKLIST",
                        "PROHIBITED_CONTENT",
                        "SPII",
                        "IMAGE_SAFETY",
                        "IMAGE_PROHIBITED_CONTENT",
                    ):
                        raise LLMError("Gemini response was blocked by safety filters.")

                content_text = ""
                if response.text:
                    content_text = response.text.strip()
                elif response.candidates and response.candidates[0].content:
                    parts = response.candidates[0].content.parts or []
                    content_text = "".join(getattr(p, "text", "") for p in parts).strip()

                if not content_text:
                    raise LLMResponseValidationError("Gemini returned an empty response.")

                # Validate content against the requested Pydantic schema
                try:
                    validated_data = response_schema.model_validate_json(content_text)
                except Exception as val_err:
                    if finish_reason in ("MAX_TOKENS", "LENGTH"):
                        raise LLMResponseTruncatedError(
                            f"Gemini response was truncated due to {finish_reason} and failed schema validation: {val_err}"
                        ) from None
                    raise LLMResponseValidationError(
                        f"Failed to validate Gemini response against schema {response_schema.__name__}: {val_err}"
                    ) from None

                prompt_tokens = None
                completion_tokens = None
                if hasattr(response, "usage_metadata") and response.usage_metadata:
                    prompt_tokens = getattr(response.usage_metadata, "prompt_token_count", None)
                    completion_tokens = getattr(response.usage_metadata, "candidates_token_count", None)

                return LLMStructuredResponse[T](
                    data=validated_data,
                    content=content_text,
                    model=target_model,
                    finish_reason=finish_reason,
                    prompt_tokens=prompt_tokens,
                    completion_tokens=completion_tokens,
                )

            except (LLMResponseValidationError, LLMResponseTruncatedError):
                # Deterministic validation or truncation errors must not be retried indefinitely
                raise

            except ClientError as c_err:
                status_code = getattr(c_err, "code", None)
                err_msg = str(c_err)

                if status_code in (400, 401, 403) and ("key" in err_msg.lower() or "auth" in err_msg.lower()):
                    raise LLMAuthError("Gemini authentication failed: Invalid or unauthorized API key.") from None
                elif status_code == 404:
                    raise LLMError(f"Gemini model '{target_model}' not found or unsupported.") from None
                elif status_code == 429:
                    raise LLMQuotaError("Gemini quota or rate limit exceeded. Please check project quota.") from None
                else:
                    raise LLMError(f"Gemini client request failed (status {status_code}).") from None

            except ServerError as s_err:
                status_code = getattr(s_err, "code", None)
                last_exception = LLMUnavailableError(
                    f"Gemini service temporarily unavailable (status {status_code}): high demand. Attempt {attempt + 1}/{self.max_retries}."
                )
                logger.warning(
                    "Gemini transient 503 error on model '%s'. Retrying attempt %d/%d...",
                    target_model,
                    attempt + 1,
                    self.max_retries,
                )
                if attempt < self.max_retries - 1:
                    time.sleep(1.0 * (2 ** attempt))
                    continue
                raise last_exception from None

            except (TimeoutError, Exception) as exc:
                if isinstance(exc, LLMError):
                    raise
                if isinstance(exc, TimeoutError) or "timeout" in str(exc).lower():
                    last_exception = LLMTimeoutError(
                        f"Gemini request timed out after {self.timeout_seconds} seconds."
                    )
                else:
                    last_exception = LLMError(f"Unexpected Gemini provider error: {type(exc).__name__}")

                if attempt < self.max_retries - 1:
                    time.sleep(1.0 * (2 ** attempt))
                    continue
                raise last_exception from None

        if last_exception:
            raise last_exception
        raise LLMError("Exhausted retries without response.")

    def check_health(self) -> bool:
        """
        Verifies client credentials and model readiness with a lightweight ping.
        """
        try:
            res = self.generate_text("Reply with: PING")
            return bool(res.content)
        except Exception as exc:
            logger.error("Gemini provider health check failed: %s", exc)
            return False

    def __repr__(self) -> str:
        return f"<GeminiProvider default_model='{self.default_model}' configured={bool(self._api_key)}>"
