from __future__ import annotations

from datetime import datetime
from urllib.parse import quote_plus
import xml.etree.ElementTree as ET

import requests

from .config import settings
from .models import NewsItem, NewsResponse


DEFAULT_NEWS_QUERY = "Indian stock market OR Nifty OR Sensex market opportunity"


def market_news(query: str = DEFAULT_NEWS_QUERY, limit: int = 12) -> NewsResponse:
    encoded = quote_plus(query)
    url = f"https://news.google.com/rss/search?q={encoded}&hl=en-IN&gl=IN&ceid=IN:en"
    response = requests.get(url, timeout=settings.request_timeout_seconds)
    response.raise_for_status()
    root = ET.fromstring(response.text)
    items: list[NewsItem] = []
    for node in root.findall("./channel/item")[:limit]:
        source = node.find("source")
        items.append(
            NewsItem(
                title=_node_text(node, "title"),
                link=_node_text(node, "link"),
                published_at=_node_text(node, "pubDate"),
                source=source.text if source is not None else None,
            )
        )
    return NewsResponse(generated_at=datetime.utcnow(), query=query, items=items)


def _node_text(node: ET.Element, name: str) -> str:
    child = node.find(name)
    return child.text if child is not None and child.text else ""
