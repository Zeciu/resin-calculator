from fastapi import FastAPI
from fastapi.testclient import TestClient

from public.app import SpaStaticFiles


def test_spa_static_files_fall_back_to_index_for_client_routes(tmp_path):
    (tmp_path / "index.html").write_text("<html>HFZWood</html>", encoding="utf-8")
    app = FastAPI()
    app.mount("/", SpaStaticFiles(directory=tmp_path, html=True), name="static")
    client = TestClient(app)

    assert client.get("/login").text == "<html>HFZWood</html>"
    assert client.get("/about").status_code == 200
    assert client.get("/assets/missing.js").status_code == 404
    assert client.get("/api/unknown").status_code == 404
