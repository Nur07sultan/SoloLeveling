from __future__ import annotations

from rest_framework.renderers import JSONRenderer


class ApiRenderer(JSONRenderer):
    """Wrap all successful/error responses into a stable envelope.

    Success:
      {"success": true, "data": <any>, "errors": null}

    Error:
      {"success": false, "data": null, "errors": {"field": ["msg"]}}
    """

    charset = "utf-8"

    def render(self, data, accepted_media_type=None, renderer_context=None):
        renderer_context = renderer_context or {}
        response = renderer_context.get("response")

        if response is None:
            return super().render(data, accepted_media_type, renderer_context)

        status_code = getattr(response, "status_code", 200)

        # 204 must not have a body.
        if status_code == 204:
            return b""

        if isinstance(data, dict) and set(data.keys()) == {"success", "data", "errors"}:
            wrapped = data
        else:
            is_success = 200 <= status_code < 400
            if is_success:
                wrapped = {"success": True, "data": data, "errors": None}
            else:
                wrapped = {"success": False, "data": None, "errors": data}

        return super().render(wrapped, accepted_media_type, renderer_context)
