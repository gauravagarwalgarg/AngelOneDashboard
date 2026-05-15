from __future__ import annotations

import ast
import re
from typing import Any

from .models import StockMetric


FORMULA_ALIASES = {
    "current price": "current_price",
    "last price": "last_price",
    "high price all time": "all_time_high",
    "all time high": "all_time_high",
    "low price all time": "all_time_low",
    "all time low": "all_time_low",
    "market capitalization": "market_cap",
    "market cap": "market_cap",
    "change %": "change_pct",
    "price vs sma 20 %": "price_vs_sma_20_pct",
    "price vs sma 50 %": "price_vs_sma_50_pct",
}

_ALLOWED_AST_NODES = (
    ast.Expression,
    ast.BoolOp,
    ast.BinOp,
    ast.UnaryOp,
    ast.Compare,
    ast.Name,
    ast.Load,
    ast.Constant,
    ast.And,
    ast.Or,
    ast.Add,
    ast.Sub,
    ast.Mult,
    ast.Div,
    ast.Pow,
    ast.Mod,
    ast.USub,
    ast.UAdd,
    ast.Lt,
    ast.LtE,
    ast.Gt,
    ast.GtE,
    ast.Eq,
    ast.NotEq,
)


def normalize_formula(formula: str) -> str:
    normalized = formula.strip()
    normalized = re.sub(r"\bAND\b", "and", normalized, flags=re.IGNORECASE)
    normalized = re.sub(r"\bOR\b", "or", normalized, flags=re.IGNORECASE)
    for label, key in sorted(FORMULA_ALIASES.items(), key=lambda item: len(item[0]), reverse=True):
        normalized = re.sub(rf"\b{re.escape(label)}\b", key, normalized, flags=re.IGNORECASE)
    normalized = re.sub(r"\s+", " ", normalized)
    return normalized


def evaluate_formula(metric: StockMetric, formula: str | None) -> bool:
    if not formula:
        return True
    normalized = normalize_formula(formula)
    tree = ast.parse(normalized, mode="eval")
    for node in ast.walk(tree):
        if not isinstance(node, _ALLOWED_AST_NODES):
            raise ValueError(f"Unsupported formula syntax: {type(node).__name__}")
    context = metric.model_dump()
    return bool(_eval_node(tree.body, context))


def _eval_node(node: ast.AST, context: dict[str, Any]) -> Any:
    if isinstance(node, ast.BoolOp):
        values = [_eval_node(value, context) for value in node.values]
        return all(values) if isinstance(node.op, ast.And) else any(values)

    if isinstance(node, ast.BinOp):
        left = _eval_node(node.left, context)
        right = _eval_node(node.right, context)
        operations = {
            ast.Add: lambda a, b: a + b,
            ast.Sub: lambda a, b: a - b,
            ast.Mult: lambda a, b: a * b,
            ast.Div: lambda a, b: a / b,
            ast.Pow: lambda a, b: a**b,
            ast.Mod: lambda a, b: a % b,
        }
        for op_type, handler in operations.items():
            if isinstance(node.op, op_type):
                return handler(left, right)

    if isinstance(node, ast.UnaryOp):
        operand = _eval_node(node.operand, context)
        if isinstance(node.op, ast.USub):
            return -operand
        if isinstance(node.op, ast.UAdd):
            return +operand

    if isinstance(node, ast.Compare):
        left = _eval_node(node.left, context)
        for op, comparator in zip(node.ops, node.comparators):
            right = _eval_node(comparator, context)
            if isinstance(op, ast.Lt) and not (left < right):
                return False
            if isinstance(op, ast.LtE) and not (left <= right):
                return False
            if isinstance(op, ast.Gt) and not (left > right):
                return False
            if isinstance(op, ast.GtE) and not (left >= right):
                return False
            if isinstance(op, ast.Eq) and not (left == right):
                return False
            if isinstance(op, ast.NotEq) and not (left != right):
                return False
            left = right
        return True

    if isinstance(node, ast.Name):
        value = context.get(node.id)
        return 0 if value is None else value

    if isinstance(node, ast.Constant):
        return node.value

    raise ValueError("Unsupported formula expression")
