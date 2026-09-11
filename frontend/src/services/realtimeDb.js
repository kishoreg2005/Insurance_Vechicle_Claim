import { getDatabase, ref, set, onValue } from "firebase/database";
import { app } from "./firebase";

const db = getDatabase(app);

export const syncClaimToRTDB = (claimData) => {
  if (!claimData || !claimData.id) {
    console.warn("Invalid claim data provided for RTDB sync");
    return;
  }

  const claimRef = ref(db, `claims/${claimData.id}`);

  set(claimRef, claimData)
    .then(() => {
      console.log(`Claim ${claimData.id} synced to Realtime Database successfully.`);
    })
    .catch((error) => {
      console.error(`Failed to sync claim ${claimData.id} to Realtime Database:`, error?.code || error?.message || error);
    });
};

export const subscribeToClaimRTDB = (id, callback) => {
  const claimRef = ref(db, `claims/${id}`);

  const unsubscribe = onValue(
    claimRef,
    (snapshot) => {
      const data = snapshot.val();
      if (data) callback(data);
    },
    (error) => {
      console.warn("Claim RTDB subscription error:", error?.code || error?.message);
    }
  );

  return unsubscribe;
};

export const subscribeToLiveActivities = (callback) => {
  const activitiesRef = ref(db, "activities");

  const unsubscribe = onValue(
    activitiesRef,
    (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const activitiesArray = Object.values(data)
          .map((a) => ({
            ...a,
            message: a.message || a.title || a.description || "Activity update",
          }))
          .sort((a, b) => String(b.timestamp || "").localeCompare(String(a.timestamp || "")));
        callback(activitiesArray);
      } else {
        callback([]);
      }
    },
    (error) => {
      console.warn("Activities RTDB subscription error:", error?.code || error?.message);
      callback([]);
    }
  );

  return unsubscribe;
};

export const subscribeToConnectionStatus = (callback) => {
  const connectedRef = ref(db, ".info/connected");

  const unsubscribe = onValue(
    connectedRef,
    (snap) => {
      callback(snap.val() === true);
    },
    () => {
      callback(false);
    }
  );

  return unsubscribe;
};

export const savePolicyToRTDB = (userId, policyData) => {
  if (!userId || !policyData) return;
  const policyRef = ref(db, `policies/${userId}`);
  return set(policyRef, policyData)
    .then(() => {
      console.log(`Policy for user ${userId} saved to RTDB.`);
    })
    .catch((err) => {
      console.warn("Failed to save policy to RTDB:", err?.code || err?.message);
    });
};

export const subscribeToPolicyRTDB = (userId, callback) => {
  if (!userId) return () => {};
  const policyRef = ref(db, `policies/${userId}`);
  const unsubscribe = onValue(
    policyRef,
    (snapshot) => {
      callback(snapshot.val() || null);
    },
    () => callback(null)
  );
  return unsubscribe;
};

export const syncCustomerToRTDB = (customerId, customerData) => {
  if (!customerId || !customerData) return Promise.resolve();
  return set(ref(db, `customers/${customerId}`), customerData);
};

export const syncVehicleToRTDB = (vehicleId, vehicleData) => {
  if (!vehicleId || !vehicleData) return Promise.resolve();
  return set(ref(db, `vehicles/${vehicleId}`), vehicleData);
};

export const syncAIAssessmentToRTDB = (claimId, assessmentData) => {
  if (!claimId || !assessmentData) return Promise.resolve();
  return set(ref(db, `ai_assessments/${claimId}`), assessmentData);
};

export const syncClaimVerificationToRTDB = (claimId, verificationData) => {
  if (!claimId || !verificationData) return Promise.resolve();
  return set(ref(db, `claim_verifications/${claimId}`), verificationData);
};

export const syncClaimReviewToRTDB = (claimId, reviewData) => {
  if (!claimId || !reviewData) return Promise.resolve();
  return set(ref(db, `claim_reviews/${claimId}`), reviewData);
};
