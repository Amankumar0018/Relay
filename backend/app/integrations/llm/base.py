from abc import ABC, abstractmethod
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field


class LLMError(Exception):
    """Base exception for all LLM provider operations."""
    pass


class LLMAuthError(LLMError):
    """Raised when authentication with the LLM provider fails."""
    pass


class LLMQuotaError(LLMError):
    """Raised when the LLM provider rate limit or quota is exceeded."""
    pass


class LLMUnavailableError(LLMError):
    """Raised when the LLM provider is temporarily unavailable or experiencing high demand."""
    pass


class LLMTimeoutError(LLMError):
    """Raised when a request to the LLM provider times out."""
    pass


class LLMResponse(BaseModel):
    """Normalized response payload returned by LLM providers."""
    content: str = Field(..., description="Generated text content")
    model: str = Field(..., description="Model identifier used for generation")
    finish_reason: Optional[str] = Field(None, description="Reason generation finished")
    prompt_tokens: Optional[int] = Field(None, description="Input token count if reported")
    completion_tokens: Optional[int] = Field(None, description="Output token count if reported")
    raw_response: Optional[Dict[str, Any]] = Field(None, description="Raw provider metadata if available")


class BaseLLMProvider(ABC):
    """Abstract base provider interface for language model providers."""

    @abstractmethod
    def generate_text(
        self,
        prompt: str,
        system_instruction: Optional[str] = None,
        temperature: float = 0.0,
        max_output_tokens: Optional[int] = None,
        thinking_budget: Optional[int] = None,
        model: Optional[str] = None,
    ) -> LLMResponse:
        """
        Executes a minimal text completion request.
        Raises LLMError sub-classes on failure.
        """
        pass

    @abstractmethod
    def check_health(self) -> bool:
        """
        Checks provider connectivity and credential validity.
        Returns True if connected, raises an LLMError otherwise.
        """
        pass
