from types import SimpleNamespace
from unittest.mock import MagicMock

import pytest

from app.database import get_session


@pytest.mark.parametrize("fail", [False, True])
def test_session_is_closed_after_request(fail):
    session_factory = MagicMock()
    request = SimpleNamespace(
        app=SimpleNamespace(state=SimpleNamespace(session_factory=session_factory))
    )
    dependency = get_session(request)
    assert next(dependency) is session_factory.return_value.__enter__.return_value
    if fail:
        with pytest.raises(RuntimeError):
            dependency.throw(RuntimeError("request failed"))
    else:
        with pytest.raises(StopIteration):
            next(dependency)
    session_factory.return_value.__exit__.assert_called_once()
