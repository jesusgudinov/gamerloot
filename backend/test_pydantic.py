import sys
sys.path.append('.')
from app.models.role import Role
from app.models.user import User
from app.models.product import Product
from app.schemas.marketing import CampaignResponse
from app.models.marketing import Campaign
from datetime import datetime, timezone

camp = Campaign(
    id=5,
    name="Test",
    slug="test",
    description="test",
    start_date=datetime.now(timezone.utc),
    end_date=datetime.now(timezone.utc),
    is_active=True
)

resp = CampaignResponse.model_validate(camp)
print(resp.model_dump_json())
