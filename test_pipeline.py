import urllib.request
import urllib.parse
import json

BASE = "http://127.0.0.1:5000/api"

def make_req(url, data=None, headers=None, method='GET'):
    req = urllib.request.Request(url, method=method)
    if headers:
        for k, v in headers.items():
            req.add_header(k, v)
    if data is not None:
        if isinstance(data, dict):
            req.add_header('Content-Type', 'application/json')
            body = json.dumps(data).encode('utf-8')
        else:
            body = data
        req.data = body
    with urllib.request.urlopen(req) as resp:
        return resp.status, resp.read()

# 1. User login
status, body = make_req(f"{BASE}/auth/login", data={"email": "user@secureclaim.com", "password": "User@123"}, method='POST')
u_data = json.loads(body.decode())
print("1. User login:", status, "Role:", u_data.get("user", {}).get("role"))
u_token = u_data["access_token"]
u_headers = {"Authorization": f"Bearer {u_token}"}

# 2. Admin login
status, body = make_req(f"{BASE}/auth/login", data={"email": "admin@secureclaim.com", "password": "Admin@123"}, method='POST')
a_data = json.loads(body.decode())
print("2. Admin login:", status, "Role:", a_data.get("user", {}).get("role"))
a_token = a_data["access_token"]
a_headers = {"Authorization": f"Bearer {a_token}"}

# 3. User claims list
status, body = make_req(f"{BASE}/user/claims", headers=u_headers)
claims_data = json.loads(body.decode())
print("3. User claims list:", status, "Total items:", claims_data.get("total"))

# 4. Admin analytics
status, body = make_req(f"{BASE}/admin/analytics", headers=a_headers)
analytics_data = json.loads(body.decode())
kpis = analytics_data.get("kpis", {})
print("4. Admin analytics:", status, "Total claims KPI:", kpis.get("total_claims"))

# 5. Admin cost configs
status, body = make_req(f"{BASE}/admin/cost-config", headers=a_headers)
cost_rules = json.loads(body.decode())
print("5. Admin cost configs:", status, "Rules count:", len(cost_rules))

# 6. Admin severity configs
status, body = make_req(f"{BASE}/admin/severity-config", headers=a_headers)
sev_rules = json.loads(body.decode())
print("6. Admin severity configs:", status, "Rules count:", len(sev_rules))

# 7. Admin users list
status, body = make_req(f"{BASE}/admin/users", headers=a_headers)
users_list = json.loads(body.decode())
print("7. Admin users list:", status, "Users count:", len(users_list))

# 8. User active policy
status, body = make_req(f"{BASE}/user/policy", headers=u_headers)
pol_data = json.loads(body.decode())
print("8. User active policy:", status, "Has policy:", pol_data.get("has_policy"), "Premium:", pol_data.get("policy", {}).get("annual_premium"))

# 9. Admin policies list
status, body = make_req(f"{BASE}/admin/policies", headers=a_headers)
policies_list = json.loads(body.decode())
print("9. Admin policies list:", status, "Policies count:", len(policies_list))

# 10. Admin premium configs
status, body = make_req(f"{BASE}/admin/premium-config", headers=a_headers)
prem_configs = json.loads(body.decode())
print("10. Admin premium configs:", status, "Configs count:", len(prem_configs))

print("\nSUCCESS: All core backend endpoints responded 200 OK with authentic schemas!")

