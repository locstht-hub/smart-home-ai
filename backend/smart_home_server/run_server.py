import os

from app import create_app


if __name__ == "__main__":
    app = create_app()
    routes = sorted(str(rule) for rule in app.url_map.iter_rules() if "power" in str(rule))
    print("POWER_ROUTES=" + ",".join(routes), flush=True)
    app.run(host="0.0.0.0", port=int(os.environ.get("SMART_HOME_PORT", "5001")), debug=False, use_reloader=False)
