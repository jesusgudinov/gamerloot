from pydantic import BaseModel
from typing import Optional

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenPayload(BaseModel):
    sub: Optional[str] = None
    
class GoogleLogin(BaseModel):
    credential: str

class MFASetupResponse(BaseModel):
    secret: str
    uri: str

class MFAEnable(BaseModel):
    code: str

class MFAVerify(BaseModel):
    temp_token: str
    code: str
    context: Optional[str] = "client"
