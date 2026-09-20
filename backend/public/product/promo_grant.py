"""Promotional full-access grants based on Cognito UserCreateDate.

Automated code writes `grantExpiresAt` only when it is absent. Manual values
are never replaced. Stripe commercial fields are not modified.
"""

from __future__ import annotations

from calendar import monthrange
from collections.abc import Callable
from datetime import datetime, timezone
from typing import Any, Protocol
import logging
import os

from botocore.exceptions import BotoCoreError, ClientError

from public.product.entitlements import EntitlementsRepository

PROMO_ACTIVATED_AT_ENV = "HFZWOOD_PROMO_ACTIVATED_AT"
PROMO_GRANT_MONTHS = 3

logger = logging.getLogger(__name__)


def add_calendar_months(value: datetime, months: int) -> datetime:
    """Add calendar months, clamping the day to the last day of the target month."""
    if months < 0:
        raise ValueError("months must be non-negative.")
    utc_value = _as_utc(value)
    month_index = utc_value.month - 1 + months
    year = utc_value.year + month_index // 12
    month = month_index % 12 + 1
    day = min(utc_value.day, monthrange(year, month)[1])
    return utc_value.replace(year=year, month=month, day=day)


def parse_promo_activation_timestamp(raw: str | None) -> datetime | None:
    """Parse an ISO-8601 UTC timestamp. Naive or invalid values are rejected."""
    if not isinstance(raw, str) or not raw.strip():
        return None
    text = raw.strip()
    if text.endswith("Z"):
        text = f"{text[:-1]}+00:00"
    try:
        parsed = datetime.fromisoformat(text)
    except ValueError:
        return None
    if parsed.tzinfo is None:
        return None
    return parsed.astimezone(timezone.utc)


def load_promo_activation_timestamp(
    environ: dict[str, str] | None = None,
) -> datetime | None:
    source = os.environ if environ is None else environ
    return parse_promo_activation_timestamp(source.get(PROMO_ACTIVATED_AT_ENV))


def promotional_grant_expires_at(
    user_create_date: datetime, activation: datetime
) -> datetime:
    created = _as_utc(user_create_date)
    activated = _as_utc(activation)
    if created < activated:
        return add_calendar_months(activated, PROMO_GRANT_MONTHS)
    return add_calendar_months(created, PROMO_GRANT_MONTHS)


class CognitoUserDirectory(Protocol):
    def get_user_create_date(
        self, user_id: str, *, username: str | None = None
    ) -> datetime | None:
        ...


class CognitoAdminUserDirectory:
    """Reads UserCreateDate via cognito-idp:AdminGetUser. Never calls ListUsers."""

    def __init__(
        self,
        *,
        user_pool_id: str | None = None,
        region: str | None = None,
        client_factory: Callable[[], Any] | None = None,
    ) -> None:
        self._user_pool_id = (user_pool_id or os.environ.get("COGNITO_USER_POOL_ID") or "").strip()
        self._region = (
            region
            or os.environ.get("COGNITO_REGION")
            or os.environ.get("AWS_DEFAULT_REGION")
            or ""
        ).strip()
        self._client_factory = client_factory
        self._client = None

    def get_user_create_date(
        self, user_id: str, *, username: str | None = None
    ) -> datetime | None:
        if not self._user_pool_id:
            logger.warning("promo_grant_cognito_pool_unconfigured")
            return None
        client = self._client_for_request()
        if client is None:
            return None
        for candidate in _admin_get_user_usernames(user_id, username):
            created = self._admin_get_user_create_date(client, candidate)
            if created is not None:
                return created
        return None

    def _client_for_request(self):
        if self._client is not None:
            return self._client
        try:
            if self._client_factory is not None:
                self._client = self._client_factory()
            else:
                import boto3

                kwargs: dict[str, str] = {}
                if self._region:
                    kwargs["region_name"] = self._region
                self._client = boto3.client("cognito-idp", **kwargs)
        except Exception:
            logger.exception("promo_grant_cognito_client_unavailable")
            return None
        return self._client

    def _admin_get_user_create_date(self, client, username: str) -> datetime | None:
        try:
            response = client.admin_get_user(
                UserPoolId=self._user_pool_id,
                Username=username,
            )
        except ClientError as exc:
            error_code = exc.response.get("Error", {}).get("Code", "unknown")
            if error_code == "UserNotFoundException":
                return None
            logger.error(
                "promo_grant_admin_get_user_failed username=%s error_code=%s",
                username,
                error_code,
            )
            return None
        except (BotoCoreError, Exception):
            logger.exception("promo_grant_admin_get_user_failed username=%s", username)
            return None
        created = response.get("UserCreateDate")
        if isinstance(created, datetime):
            return _as_utc(created)
        return None


_ACTIVATION_UNSET = object()


class PromoGrantService:
    def __init__(
        self,
        entitlements: EntitlementsRepository,
        *,
        user_directory: CognitoUserDirectory | None = None,
        activation: datetime | None | object = _ACTIVATION_UNSET,
        activation_loader: Callable[[], datetime | None] | None = None,
    ) -> None:
        self._entitlements = entitlements
        self._user_directory = (
            user_directory if user_directory is not None else CognitoAdminUserDirectory()
        )
        self._activation_override = activation
        self._activation_loader = activation_loader or load_promo_activation_timestamp

    def ensure_for_user(self, user_id: str, *, username: str | None = None) -> None:
        if not isinstance(user_id, str) or not user_id.strip():
            return
        record = self._entitlements.get_record(user_id)
        if record.get("grantExpiresAt") is not None:
            return
        activation = self._activation()
        if activation is None:
            return
        created = self._user_directory.get_user_create_date(user_id, username=username)
        if created is None:
            logger.warning("promo_grant_user_create_date_unavailable user_id=%s", user_id)
            return
        expires_at = int(promotional_grant_expires_at(created, activation).timestamp())
        self._entitlements.set_grant_expires_at_if_absent(user_id, expires_at)

    def _activation(self) -> datetime | None:
        if self._activation_override is _ACTIVATION_UNSET:
            return self._activation_loader()
        if isinstance(self._activation_override, datetime):
            return _as_utc(self._activation_override)
        return None


def _admin_get_user_usernames(user_id: str, username: str | None) -> list[str]:
    names: list[str] = []
    if isinstance(username, str) and username.strip():
        names.append(username.strip())
    trimmed_id = user_id.strip()
    if trimmed_id and trimmed_id not in names:
        names.append(trimmed_id)
    return names


def _as_utc(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc)
