import os
import json
import uuid
import threading
import urllib.request
import urllib.error
from datetime import datetime
from typing import Dict, Any, List, Optional
from backend.auth.jwt import hash_password

FIREBASE_RTDB_URL = os.getenv("FIREBASE_DATABASE_URL", "https://project-final-62be8-default-rtdb.firebaseio.com").rstrip("/")
LOCAL_STORAGE_BACKUP = os.path.join(os.path.dirname(__file__), "firebase_local_store.json")

class FirebaseDB:
    def __init__(self):
        self.base_url = FIREBASE_RTDB_URL
        self.cloud_reachable = False
        self.cloud_error = None
        self._auth_warned = False
        self._cache = {
            # 13 ER collections
            "customers": {},
            "vehicles": {},
            "vehicle_images": {},
            "insurance_policies": {},
            "payments": {},
            "claims": {},
            "claim_images": {},
            "claimed_damages": {},
            "ai_assessments": {},
            "ai_detected_damages": {},
            "claim_verifications": {},
            "officers": {},
            "claim_reviews": {},
            # App configs & auth
            "users": {},
            "cost_configs": {},
            "severity_configs": {},
            "policies": {},
            "premium_configs": {},
            "activities": {}
        }
        self._load_local_backup()
        # Non-blocking cloud probe so API startup never hangs on RTDB latency
        threading.Thread(target=self._hydrate_from_cloud, daemon=True).start()

    def _load_local_backup(self):
        if os.path.exists(LOCAL_STORAGE_BACKUP):
            try:
                with open(LOCAL_STORAGE_BACKUP, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    for k in self._cache.keys():
                        if k in data and isinstance(data[k], dict):
                            self._cache[k] = data[k]
            except Exception as e:
                print(f"[FirebaseDB] Local backup load error: {e}")

    def _save_local_backup(self):
        try:
            with open(LOCAL_STORAGE_BACKUP, "w", encoding="utf-8") as f:
                json.dump(self._cache, f, indent=2, default=str)
        except Exception as e:
            print(f"[FirebaseDB] Local backup save error: {e}")

    def _request_cloud(self, path: str, method: str = "GET", data: Optional[Dict[str, Any]] = None, timeout: float = 5.0):
        url = f"{self.base_url}/{path.lstrip('/')}.json" if path else f"{self.base_url}/.json"
        body = json.dumps(data, default=str).encode("utf-8") if data is not None else None
        headers = {"Content-Type": "application/json"}
        req = urllib.request.Request(url, data=body, headers=headers, method=method)
        with urllib.request.urlopen(req, timeout=timeout) as response:
            raw = response.read().decode("utf-8") or "null"
            return json.loads(raw)

    def check_connection(self) -> Dict[str, Any]:
        """Probe Firebase Realtime Database connectivity and permissions."""
        try:
            self._request_cloud("", method="GET", timeout=5.0)
            self.cloud_reachable = True
            self.cloud_error = None
            return {"connected": True, "url": self.base_url, "mode": "cloud+local"}
        except urllib.error.HTTPError as e:
            self.cloud_reachable = False
            if e.code in (401, 403):
                self.cloud_error = (
                    "Firebase RTDB permission denied. Open Firebase Console > Realtime Database > Rules "
                    "and set .read/.write to true (see backend/db/firebase_rules.json)."
                )
            else:
                self.cloud_error = f"Firebase RTDB HTTP {e.code}"
            return {"connected": False, "url": self.base_url, "error": self.cloud_error, "mode": "local-only"}
        except Exception as e:
            self.cloud_reachable = False
            self.cloud_error = str(e)
            return {"connected": False, "url": self.base_url, "error": self.cloud_error, "mode": "local-only"}

    def _hydrate_from_cloud(self):
        """Pull existing cloud collections into the local cache when rules allow."""
        status = self.check_connection()
        if not status.get("connected"):
            print(f"[FirebaseDB] Cloud unreachable - using local store. {status.get('error')}")
            return

        print("[FirebaseDB] Cloud connected. Hydrating local cache from Realtime Database...")
        for collection in list(self._cache.keys()):
            try:
                remote = self._request_cloud(collection, method="GET", timeout=5.0)
                if isinstance(remote, dict) and remote:
                    # Merge remote over local so cloud is source of truth when present
                    merged = dict(self._cache.get(collection) or {})
                    merged.update({str(k): v for k, v in remote.items() if isinstance(v, dict)})
                    self._cache[collection] = merged
            except Exception as e:
                print(f"[FirebaseDB] Skip hydrate {collection}: {e}")
        self._save_local_backup()
        print("[FirebaseDB] Hydration complete.")

    def _sync_to_cloud(self, path: str, method: str = "PUT", data: Optional[Dict[str, Any]] = None):
        """Asynchronous fire-and-forget sync to Firebase Realtime Database."""
        def worker():
            try:
                self._request_cloud(path, method=method, data=data, timeout=5.0)
                self.cloud_reachable = True
                self.cloud_error = None
            except urllib.error.HTTPError as e:
                self.cloud_reachable = False
                if e.code in (401, 403):
                    self.cloud_error = "permission_denied"
                    if not self._auth_warned:
                        self._auth_warned = True
                        print(
                            "[FirebaseDB] RTDB sync blocked (401/403). "
                            "Update Realtime Database rules to allow read/write "
                            "(copy from backend/db/firebase_rules.json). "
                            "App continues on local firebase_local_store.json."
                        )
                else:
                    self.cloud_error = f"HTTP {e.code}"
            except Exception as e:
                self.cloud_reachable = False
                self.cloud_error = str(e)
        t = threading.Thread(target=worker, daemon=True)
        t.start()

    # ------------------ SEEDING & INITIALIZATION ------------------ #
    def seed_initial_data(self):
        print("[FirebaseDB] Seeding Firebase database collections...")
        
        # 1. Seed Admin & User if not present
        admin_email = "admin@secureclaim.ai"
        user_email = "policyholder@secureclaim.ai"

        if not self.get_user_by_email(admin_email):
            admin_user = {
                "id": 1,
                "name": "Chief Claims Officer",
                "email": admin_email,
                "password_hash": hash_password("Admin@12345"),
                "role": "admin",
                "is_active": True,
                "created_at": datetime.utcnow().isoformat()
            }
            self.set_data(f"users/{admin_user['id']}", admin_user)

        if not self.get_user_by_email(user_email):
            regular_user = {
                "id": 2,
                "name": "Sarah Jenkins",
                "email": user_email,
                "password_hash": hash_password("User@12345"),
                "role": "user",
                "is_active": True,
                "created_at": datetime.utcnow().isoformat()
            }
            self.set_data(f"users/{regular_user['id']}", regular_user)

        # 2. Seed Cost Configurations
        if not self.get_collection("cost_configs"):
            default_costs = [
                {"id": 1, "part": "Front Bumper", "damage_type": "Dent", "severity": "Minor", "cost_min": 2500, "cost_max": 6000},
                {"id": 2, "part": "Front Bumper", "damage_type": "Scratch", "severity": "Minor", "cost_min": 1500, "cost_max": 3500},
                {"id": 3, "part": "Front Bumper", "damage_type": "Crack / Tear", "severity": "Moderate", "cost_min": 8000, "cost_max": 18000},
                {"id": 4, "part": "Front Bumper", "damage_type": "Severe Impact", "severity": "Severe", "cost_min": 22000, "cost_max": 45000},
                {"id": 5, "part": "Bonnet / Hood", "damage_type": "Dent", "severity": "Minor", "cost_min": 3500, "cost_max": 7500},
                {"id": 6, "part": "Bonnet / Hood", "damage_type": "Severe Impact", "severity": "Severe", "cost_min": 35000, "cost_max": 70000},
                {"id": 7, "part": "Headlight", "damage_type": "Crack / Tear", "severity": "Moderate", "cost_min": 6000, "cost_max": 15000},
                {"id": 8, "part": "Headlight", "damage_type": "Severe Impact", "severity": "Severe", "cost_min": 15000, "cost_max": 35000},
                {"id": 9, "part": "Side Door Panel", "damage_type": "Dent", "severity": "Moderate", "cost_min": 7000, "cost_max": 16000},
                {"id": 10, "part": "Side Door Panel", "damage_type": "Scratch", "severity": "Minor", "cost_min": 2000, "cost_max": 5000},
                {"id": 11, "part": "Rear Bumper", "damage_type": "Dent", "severity": "Minor", "cost_min": 2500, "cost_max": 6500},
                {"id": 12, "part": "Windshield / Glass", "damage_type": "Crack / Tear", "severity": "Moderate", "cost_min": 8000, "cost_max": 20000}
            ]
            for c in default_costs:
                self.set_data(f"cost_configs/{c['id']}", c)

        # 3. Seed Severity Configurations
        if not self.get_collection("severity_configs"):
            default_sevs = [
                {"id": 1, "damage_type": "Scratch", "weight": 0.8, "area_threshold_minor": 0.05, "area_threshold_moderate": 0.15},
                {"id": 2, "damage_type": "Dent", "weight": 1.2, "area_threshold_minor": 0.04, "area_threshold_moderate": 0.12},
                {"id": 3, "damage_type": "Crack / Tear", "weight": 1.6, "area_threshold_minor": 0.03, "area_threshold_moderate": 0.10},
                {"id": 4, "damage_type": "Severe Impact", "weight": 2.5, "area_threshold_minor": 0.02, "area_threshold_moderate": 0.08}
            ]
            for s in default_sevs:
                self.set_data(f"severity_configs/{s['id']}", s)

        # 4. Seed Default Policy
        if not self.get_collection("policies"):
            default_policy = {
                "id": 1,
                "policy_number": "POL-2026-0042",
                "user_id": 2,
                "vehicle_type": "Passenger Sedan",
                "vehicle_model": "Hyundai i20",
                "vehicle_plate": "KA-01-MJ-8821",
                "coverage_type": "Comprehensive Zero-Dep",
                "annual_premium": 18500.0,
                "monthly_instalment": 1650.0,
                "start_date": "2026-01-01T00:00:00",
                "end_date": "2026-12-31T23:59:59",
                "status": "Active",
                "created_at": datetime.utcnow().isoformat()
            }
            self.set_data(f"policies/{default_policy['id']}", default_policy)

        # 5. Seed 13 ER Diagram Collections if empty
        if not self.get_collection("customers"):
            seed_cust = {
                "customer_id": "CUST_001",
                "name": "Sarah Jenkins",
                "mobile": "+91-9876543210",
                "email": user_email,
                "address": "42 Residency Road, Indiranagar, Bengaluru, KA 560038",
                "date_of_birth": "1992-05-14",
                "created_at": datetime.utcnow().isoformat()
            }
            self.set_data(f"customers/{seed_cust['customer_id']}", seed_cust)

        if not self.get_collection("vehicles"):
            seed_veh = {
                "vehicle_id": "VEH_001",
                "customer_id": "CUST_001",
                "vehicle_type": "Car",
                "registration_number": "KA-01-MJ-8821",
                "manufacturer": "Hyundai",
                "model": "i20",
                "variant": "Asta 1.2 MT",
                "manufacturing_year": 2023,
                "registration_date": "2023-04-12",
                "fuel_type": "Petrol",
                "engine_capacity": "1197 cc",
                "vin_masked": "MALAB51CLPM****21",
                "created_at": datetime.utcnow().isoformat()
            }
            self.set_data(f"vehicles/{seed_veh['vehicle_id']}", seed_veh)

        if not self.get_collection("insurance_policies"):
            seed_pol = {
                "policy_id": "POL_001",
                "vehicle_id": "VEH_001",
                "policy_number": "POL-2026-0042",
                "policy_type": "Comprehensive Zero-Dep",
                "start_date": "2026-01-01",
                "expiry_date": "2026-12-31",
                "idv": 685000.0,
                "premium_amount": 18500.0,
                "coverage": "Own Damage + Third Party Liability + Zero Dep",
                "addons": "Engine Protection, Roadside Assistance",
                "status": "ACTIVE",
                "created_at": datetime.utcnow().isoformat()
            }
            self.set_data(f"insurance_policies/{seed_pol['policy_id']}", seed_pol)

        if not self.get_collection("payments"):
            seed_pay = {
                "payment_id": "PAY_001",
                "policy_id": "POL_001",
                "amount": 18500.0,
                "payment_method": "UPI",
                "transaction_id": "TXN_UPI_20260101_77492",
                "payment_date": datetime.utcnow().isoformat(),
                "payment_status": "COMPLETED"
            }
            self.set_data(f"payments/{seed_pay['payment_id']}", seed_pay)

        if not self.get_collection("officers"):
            seed_off = {
                "officer_id": "OFF_001",
                "name": "Chief Claims Officer",
                "email": admin_email,
                "role": "SURVEYOR",
                "created_at": datetime.utcnow().isoformat()
            }
            self.set_data(f"officers/{seed_off['officer_id']}", seed_off)

        print("[FirebaseDB] Initialization complete.")

    # ------------------ GENERIC OPERATIONS ------------------ #
    def set_data(self, path: str, data: Dict[str, Any]):
        parts = path.strip("/").split("/")
        collection = parts[0]
        item_id = str(parts[1]) if len(parts) > 1 else None

        if collection not in self._cache:
            self._cache[collection] = {}

        if item_id:
            self._cache[collection][item_id] = data
        else:
            self._cache[collection] = data

        self._save_local_backup()
        self._sync_to_cloud(path, method="PUT", data=data)

    def update_data(self, path: str, data: Dict[str, Any]):
        parts = path.strip("/").split("/")
        collection = parts[0]
        item_id = str(parts[1]) if len(parts) > 1 else None

        if collection in self._cache and item_id in self._cache[collection]:
            if isinstance(self._cache[collection][item_id], dict):
                self._cache[collection][item_id].update(data)
            else:
                self._cache[collection][item_id] = data
        self._save_local_backup()
        self._sync_to_cloud(path, method="PATCH", data=data)

    def delete_data(self, path: str):
        parts = path.strip("/").split("/")
        collection = parts[0]
        item_id = str(parts[1]) if len(parts) > 1 else None

        if collection in self._cache and item_id:
            self._cache[collection].pop(item_id, None)
        self._save_local_backup()
        self._sync_to_cloud(path, method="DELETE")

    def get_collection(self, collection_name: str) -> List[Dict[str, Any]]:
        cached = self._cache.get(collection_name, {})
        if isinstance(cached, dict):
            return list(cached.values())
        return []

    def get_item(self, collection_name: str, item_id: Any) -> Optional[Dict[str, Any]]:
        item_key = str(item_id)
        return self._cache.get(collection_name, {}).get(item_key)

    # ------------------ USERS ------------------ #
    def get_user_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        if not email:
            return None
        email_clean = email.strip().lower()
        users = self.get_collection("users")
        for u in users:
            if u.get("email", "").strip().lower() == email_clean:
                return u
        return None

    def get_user_by_id(self, user_id: Any) -> Optional[Dict[str, Any]]:
        return self.get_item("users", user_id)

    def create_user(self, user_dict: Dict[str, Any]) -> Dict[str, Any]:
        users = self.get_collection("users")
        max_id = max([int(u.get("id", 0)) for u in users if str(u.get("id", 0)).isdigit()] or [0])
        new_id = max_id + 1
        user_dict["id"] = new_id
        user_dict["created_at"] = datetime.utcnow().isoformat()
        self.set_data(f"users/{new_id}", user_dict)
        return user_dict

    # ------------------ CLAIMS ------------------ #
    def get_claim(self, claim_id: Any) -> Optional[Dict[str, Any]]:
        return self.get_item("claims", claim_id)

    def create_claim(self, claim_dict: Dict[str, Any]) -> Dict[str, Any]:
        claims = self.get_collection("claims")
        max_id = max([int(c.get("id", 0)) for c in claims if str(c.get("id", 0)).isdigit()] or [0])
        new_id = max_id + 1
        claim_dict["id"] = new_id
        if "created_at" not in claim_dict:
            claim_dict["created_at"] = datetime.utcnow().isoformat()
        claim_dict["updated_at"] = datetime.utcnow().isoformat()
        self.set_data(f"claims/{new_id}", claim_dict)
        
        self.log_activity(
            type="new_claim",
            title=f"New Claim #{claim_dict.get('claim_number', new_id)} Filed",
            description=f"Part: {claim_dict.get('claimed_part')}, Severity: {claim_dict.get('claimed_severity')}",
            claim_id=new_id
        )
        return claim_dict

    def update_claim(self, claim_id: Any, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        claim = self.get_claim(claim_id)
        if not claim:
            return None
        updates["updated_at"] = datetime.utcnow().isoformat()
        self.update_data(f"claims/{claim_id}", updates)
        return self.get_claim(claim_id)

    # ------------------ ACTIVITIES ------------------ #
    def log_activity(self, type: str, title: str, description: str, claim_id: Optional[int] = None, user_email: Optional[str] = None):
        act_id = f"ACT_{int(datetime.utcnow().timestamp())}_{str(uuid.uuid4())[:4]}"
        activity = {
            "id": act_id,
            "type": type,
            "title": title,
            "description": description,
            "claim_id": claim_id,
            "user_email": user_email,
            "timestamp": datetime.utcnow().isoformat()
        }
        self.set_data(f"activities/{act_id}", activity)

firebase_db = FirebaseDB()
