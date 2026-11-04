from pydantic import BaseModel


class RootResponse(BaseModel):
    message: str
    version: str
    docs_url: str


class HealthResponse(BaseModel):
    status: str
    database: str
    environment: str
    version: str

