from __future__ import annotations

from statistics import fmean


def sma(values: list[float], period: int) -> float:
    sample = values[-period:]
    return sum(sample) / len(sample)


def ema(values: list[float], period: int) -> float:
    multiplier = 2 / (period + 1)
    ema_value = sma(values[:period], period)
    for price in values[period:]:
        ema_value = (price - ema_value) * multiplier + ema_value
    return ema_value


def rsi(values: list[float], period: int = 14) -> float:
    gains: list[float] = []
    losses: list[float] = []
    for current, previous in zip(values[1:], values[:-1]):
        delta = current - previous
        gains.append(max(delta, 0))
        losses.append(abs(min(delta, 0)))

    avg_gain = fmean(gains[:period]) if any(gains[:period]) else 0.0
    avg_loss = fmean(losses[:period]) if any(losses[:period]) else 0.0

    for gain, loss in zip(gains[period:], losses[period:]):
        avg_gain = ((avg_gain * (period - 1)) + gain) / period
        avg_loss = ((avg_loss * (period - 1)) + loss) / period

    if avg_loss == 0:
        return 100.0
    rs = avg_gain / avg_loss
    return 100 - (100 / (1 + rs))


def pct_change(current: float, previous: float) -> float:
    if previous == 0:
        return 0.0
    return ((current - previous) / previous) * 100
