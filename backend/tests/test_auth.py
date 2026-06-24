def test_register_user(client):
    resp = client.post("/auth/register", json={
        "username": "testuser1", "email": "testuser1@example.com", "password": "password123"
    })
    assert resp.status_code == 201
    assert resp.json()["username"] == "testuser1"


def test_register_duplicate_username_fails(client):
    client.post("/auth/register", json={
        "username": "dupeuser", "email": "dupe1@example.com", "password": "password123"
    })
    resp = client.post("/auth/register", json={
        "username": "dupeuser", "email": "dupe2@example.com", "password": "password123"
    })
    assert resp.status_code == 400


def test_login_success(client):
    client.post("/auth/register", json={
        "username": "loginuser", "email": "loginuser@example.com", "password": "password123"
    })
    resp = client.post("/auth/login", json={"username": "loginuser", "password": "password123"})
    assert resp.status_code == 200
    assert "token" in resp.json()


def test_login_wrong_password(client):
    client.post("/auth/register", json={
        "username": "loginuser2", "email": "loginuser2@example.com", "password": "password123"
    })
    resp = client.post("/auth/login", json={"username": "loginuser2", "password": "wrongpass"})
    assert resp.status_code == 401

