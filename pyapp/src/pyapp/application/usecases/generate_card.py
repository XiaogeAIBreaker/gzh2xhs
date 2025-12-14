from typing import Any, Dict, List
from ...domain.models import Card

class GenerateCardUseCase:
    """生成卡片用例。"""

    def execute(self, text: str, model: str, style: str) -> Dict[str, Any]:
        cards: List[Card] = [
            Card(id="card-1", title=text[:32], model=model, style=style)
        ]
        copytext = text
        return {"cards": [c.model_dump() for c in cards], "copytext": copytext}
